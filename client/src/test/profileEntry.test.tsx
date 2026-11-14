import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ProfileForm } from '../components/ProfileForm';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('shows manual fields only after choosing manual entry', () => {
  render(<ProfileForm onSubmit={vi.fn()} loading={false} error={null} />);
  expect(screen.queryByLabelText(/most recent role/i)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Enter Manually' }));
  expect(screen.getByLabelText(/most recent role/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Analyze My Résumé' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Generate My Opportunities' })).toBeEnabled();
});

it('waits for explicit analysis, then requires review of the editable draft', async () => {
  const request = vi.fn().mockResolvedValue(
    Response.json({
      draft: {
        currentRole: 'Warehouse Associate',
        location: 'Chicago, IL',
        skills: 'Inventory',
        education: 'High school diploma',
        experience: '8 years',
        interests: 'Logistics',
      },
      interpreted: true,
    })
  );
  vi.stubGlobal('fetch', request);
  const { container } = render(<ProfileForm onSubmit={vi.fn()} loading={false} error={null} />);
  fireEvent.click(screen.getByRole('button', { name: 'Upload Résumé' }));
  fireEvent.change(container.querySelector('input[type=file]')!, {
    target: { files: [new File(['sample'], 'warehouse.pdf', { type: 'application/pdf' })] },
  });
  expect(screen.getByText('warehouse.pdf')).toBeInTheDocument();
  expect(request).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Analyze My Résumé' }));
  expect(await screen.findByText('Confirm your résumé details')).toBeInTheDocument();
  expect(screen.getByLabelText(/most recent role/i)).toHaveValue('Warehouse Associate');
  expect(screen.getByLabelText(/location/i)).toHaveValue('Chicago, IL');
  expect(screen.getByLabelText(/key skills/i)).toHaveValue('Inventory');
  expect(screen.getByLabelText(/education/i)).toHaveValue('High school diploma');
  expect(screen.getByLabelText(/description of experience/i)).toHaveValue('8 years');
  const interests = screen.getByLabelText(/interests or passions/i);
  expect(interests).toHaveValue('Logistics');
  fireEvent.change(interests, { target: { value: 'Warehouse automation' } });
  expect(interests).toHaveValue('Warehouse automation');
  const generate = screen.getByRole('button', { name: 'Generate My Opportunities' });
  expect(generate).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: /reviewed and confirmed/i }));
  expect(generate).toBeEnabled();
  expect(request).toHaveBeenCalledTimes(1);
});

import express from 'express';
import request from 'supertest';
import { afterEach, expect, it, vi } from 'vitest';
import { resumeRouter } from './resume.js';

vi.mock('express-rate-limit', () => ({ rateLimit: () => express.Router() }));
vi.mock('../lib/granite.js', () => ({ generateGraniteContent: vi.fn() }));
vi.mock('../lib/gemini.js', () => ({ generateContent: vi.fn() }));
import { generateGraniteContent } from '../lib/granite.js';
import { generateContent } from '../lib/gemini.js';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

const app = express();
app.use('/api/resume', resumeRouter);

function resumePdf(lines: string[]) {
  const contents =
    'BT /F1 12 Tf 50 720 Td 18 TL ' + lines.map((line) => '(' + line + ') Tj T*').join(' ') + ' ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length ' + contents.length + ' >>\nstream\n' + contents + '\nendstream',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((object, index) => {
    const offset = pdf.length;
    pdf += index + 1 + ' 0 obj\n' + object + '\nendobj\n';
    return String(offset).padStart(10, '0') + ' 00000 n \n';
  });
  const xref = pdf.length;
  pdf +=
    'xref\n0 6\n0000000000 65535 f \n' +
    offsets.join('') +
    'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' +
    xref +
    '\n%%EOF\n';
  return Buffer.from(pdf);
}

function uploadPdf(file: Buffer, interpret = false) {
  return request(app)
    .post(interpret ? '/api/resume?interpret=true' : '/api/resume')
    .set('Content-Type', 'application/pdf')
    .send(file);
}

it('extracts only the profile fields from a real PDF', { timeout: 15_000 }, async () => {
  const response = await uploadPdf(
    resumePdf([
      'Sample Person',
      'sample@example.com',
      'Skills',
      'Inventory management',
      'Work Experience',
      'Coordinated weekly stock checks',
      'Education',
      'Example College',
    ])
  );
  expect(response.status).toBe(200);
  expect(generateContent).not.toHaveBeenCalled();
  expect(response.body).toEqual({
    draft: {
      skills: 'Inventory management',
      experience: 'Coordinated weekly stock checks',
      education: 'Example College',
    },
    extraction: 'local',
    interpreted: false,
  });
});

it('rejects an invalid PDF signature', async () => {
  const response = await uploadPdf(Buffer.from('invalid'));
  expect(response.status).toBe(400);
});

it('rejects a PDF with no selectable text', async () => {
  const response = await uploadPdf(resumePdf([]));
  expect(response.status).toBe(422);
  expect(response.body.error).toContain('selectable text');
});

function stubDocling(
  uri: string,
  artifactResponse = new Response('## Skills\nInventory management')
) {
  vi.stubEnv('DOCLING_SERVICE_URL', 'https://api.test.dcls.saas.ibm.com/test');
  vi.stubEnv('DOCLING_SERVICE_API_KEY', 'test-key');
  const upstream = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ task_id: 'job' }))
    .mockResolvedValueOnce(Response.json({ task_status: 'success' }))
    .mockResolvedValueOnce(
      Response.json({
        documents: [{ artifacts: [{ artifact_type: 'markdown', uri }] }],
      })
    )
    .mockResolvedValueOnce(artifactResponse);
  vi.stubGlobal('fetch', upstream);
  return upstream;
}

it('uses Docling text for Granite interpretation and returns an editable draft', async () => {
  const upstream = stubDocling(
    'https://dclstest.blob.core.windows.net/result.md',
    new Response('## Skills\nInventory management\nsample@example.com')
  );
  vi.stubEnv('AI_PROVIDER', 'granite');
  vi.mocked(generateGraniteContent).mockResolvedValue(
    '{"currentRole":"Warehouse Associate","education":"High school diploma","experience":"8 years","location":"Chicago, IL","interests":"Logistics"}'
  );

  const response = await uploadPdf(Buffer.from('%PDF-test'), true);

  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    draft: {
      currentRole: 'Warehouse Associate',
      location: 'Chicago, IL',
      interests: 'Logistics',
      experience: '8 years',
      education: 'High school diploma',
      skills: 'Inventory management',
    },
    extraction: 'docling',
    interpreted: true,
  });
  expect(generateGraniteContent).toHaveBeenCalledWith(expect.stringContaining('[email removed]'));
  expect(generateGraniteContent).not.toHaveBeenCalledWith(
    expect.stringContaining('sample@example.com')
  );
  expect(upstream.mock.calls[3]?.[1]).not.toHaveProperty('headers');
});

it.each([
  ['https://untrusted.example/result.md', new Response('ignored')],
  ['https://api.test.dcls.saas.ibm.com/result.md', new Response(null, { status: 403 })],
  ['https://dclstest.blob.core.windows.net/result.md', new Response('x'.repeat(256_001))],
])(
  'falls back to local text when the Docling artifact fails at %s',
  async (uri, artifactResponse) => {
    stubDocling(uri, artifactResponse);
    vi.stubEnv('AI_PROVIDER', 'gemini');
    vi.mocked(generateContent).mockResolvedValue('invalid JSON');

    const response = await uploadPdf(resumePdf(['Skills', 'Inventory management']), true);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      draft: { skills: 'Inventory management' },
      extraction: 'local',
      interpreted: false,
    });
  }
);

it('rejects a corrupt PDF', async () => {
  expect((await uploadPdf(Buffer.from('%PDF-broken'))).status).toBe(422);
});

it('retains explicit resume fields when the model returns a mix of usable and invalid values', async () => {
  vi.stubEnv('DOCLING_ENABLED', 'false');
  vi.stubEnv('AI_PROVIDER', 'gemini');
  vi.mocked(generateContent).mockResolvedValue(
    '{"currentRole":null,"location":null,"experience":"Worked in logistics","interests":["Cycling","Robotics"],"education":{"degree":"unknown"}}'
  );

  const response = await uploadPdf(
    resumePdf([
      'Current Role: Warehouse Associate',
      'Location: Chicago, IL',
      'Summary',
      'Logistics worker with 2 years of experience',
      'Interests: Cycling',
    ]),
    true
  );

  expect(response.status).toBe(200);
  expect(response.body.draft).toEqual({
    currentRole: 'Warehouse Associate',
    location: 'Chicago, IL',
    experience: '2 years',
    interests: 'Cycling, Robotics',
  });
});

it('reads inline labels when the model is unavailable', async () => {
  vi.stubEnv('DOCLING_ENABLED', 'false');
  vi.stubEnv('AI_PROVIDER', 'gemini');
  vi.mocked(generateContent).mockRejectedValue(new Error('Unavailable'));

  const response = await uploadPdf(
    resumePdf([
      'Job Title: Warehouse Associate',
      'Based In: Chicago, IL',
      'Years of Experience: 2 years',
      'Hobbies: Cycling and robotics',
    ]),
    true
  );

  expect(response.body.draft).toEqual({
    currentRole: 'Warehouse Associate',
    location: 'Chicago, IL',
    experience: '2 years',
    interests: 'Cycling and robotics',
  });
});

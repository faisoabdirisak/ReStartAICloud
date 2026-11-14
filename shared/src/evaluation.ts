import { z } from 'zod';

export const EvaluationInputSchema = z.object({
  demoPersona: z.enum(['maria', 'james', 'aisha']).optional(),
  opportunityId: z.string().min(1).max(200),
  name: z.string().trim().min(1).max(100),
  role: z.enum(['Lecturer', 'Career adviser', 'Worker', 'Other']),
  affiliation: z.string().trim().max(150),
  reviewerCode: z.string().trim().max(40),
  fit: z.enum(['Well', 'Partly', 'Poorly']),
  reason: z.string().trim().min(1).max(1000),
  firstStep: z.string().trim().min(1).max(1000),
  usefulness: z.enum(['Useful', 'Somewhat useful', 'Not useful']),
  reportChanges: z.string().trim().max(1000),
  friction: z.string().trim().max(1000),
  publish: z.literal(true),
});

export type EvaluationInput = z.infer<typeof EvaluationInputSchema>;
export type PublicEvaluation = Omit<
  EvaluationInput,
  'publish' | 'opportunityId' | 'reviewerCode' | 'demoPersona'
> & {
  source: string;
  id: string;
  opportunityTitle: string;
  createdAt: string;
};

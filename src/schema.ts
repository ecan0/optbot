import { z } from 'zod';

export const responsePayloadSchema = z.object({
  survey_id: z.string().min(1).max(120),
  variant_id: z.string().min(1).max(120),
  consent_version: z.string().min(1).max(120),
  answers: z.record(z.string(), z.union([z.string().max(4000), z.number()])),
  metadata: z.object({
    started_at: z.string().datetime(),
    completed_at: z.string().datetime(),
    user_agent: z.string().max(500).optional()
  }),
  turnstile_token: z.string().optional()
});

export type ResponsePayload = z.infer<typeof responsePayloadSchema>;

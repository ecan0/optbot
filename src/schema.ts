import { z } from 'zod';
import { validateTextResponse } from './textValidation';

export const visualDesignAttributesSchema = z.object({
  colorway: z.string().min(1).max(120),
  iconStyle: z.string().min(1).max(120),
  density: z.string().min(1).max(80),
  sectionEmphasis: z.string().min(1).max(120),
  layout: z.string().min(1).max(120)
});

const answerValueSchema = z.union([z.string().max(4000), z.number().finite()]);
const requiredTextResponseIds = [
  'concerns_influenced_decision',
  'information_increase_trust'
] as const;


const answersSchema = z.record(z.string(), answerValueSchema).superRefine((answers, context) => {
  if (
    answers.presentation_preference !== 'prefer_assigned_notice' &&
    answers.presentation_preference !== 'prefer_text_notice'
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Choose Notice A or Notice B.',
      path: ['presentation_preference']
    });
  }

  for (const answerId of requiredTextResponseIds) {
    const validation = validateTextResponse(answers[answerId], 5);
    if (!validation.isValid) {
      context.addIssue({
        code: 'custom',
        message: 'Enter a substantive response of at least five words.',
        path: [answerId]
      });
    }
  }
});

export const shownNoticeVariantSchema = z.object({
  notice_variant_id: z.enum(['plain-text-control', 'trust-cue-summary', 'transparency-flow']),
  notice_variant_label: z.string().min(1).max(160),
  notice_format: z.enum(['plain_text', 'visual_trust_cues', 'visual_transparency_flow']),
  visual_design_variant_id: z.enum(['disclosure-ledger-v4', 'privacy-controls-v4', 'data-journey-v4']),
  visual_design_attributes: visualDesignAttributesSchema,
  assignment_method: z.literal('session-randomized-fixed')
});

export const responsePayloadSchema = z.object({
  survey_id: z.string().min(1).max(120),
  variant_id: z.string().min(1).max(120),
  consent_version: z.string().min(1).max(120),
  answers: answersSchema,
  metadata: z.object({
    survey_flow_version: z.string().min(1).max(120),
    started_at: z.string().datetime(),
    completed_at: z.string().datetime(),
    user_agent: z.string().max(500).optional(),
    notice_presentation_order: z.enum(['assigned-first', 'reference-first']),
    assigned_notice_slot: z.enum(['A', 'B']),
    shown_notice_variant: shownNoticeVariantSchema
  }),
  turnstile_token: z.string().optional()
});

export type ResponsePayload = z.infer<typeof responsePayloadSchema>;

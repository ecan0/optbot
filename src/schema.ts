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
const requiredTextResponseIds = ['decision_influence'] as const;

const requiredRatingIds = [
  'visual_willingness',
  'visual_trust',
  'visual_understanding',
  'visual_privacy_concern',
  'text_willingness',
  'text_trust',
  'text_understanding',
  'text_privacy_concern'
] as const;


const answersSchema = z.record(z.string(), answerValueSchema).superRefine((answers, context) => {
  if (
    answers.presentation_preference !== 'prefer_visual_notice' &&
    answers.presentation_preference !== 'prefer_text_notice'
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Choose Notice A or Notice B.',
      path: ['presentation_preference']
    });
  }

  for (const answerId of requiredRatingIds) {
    const rating = answers[answerId];
    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      context.addIssue({
        code: 'custom',
        message: 'Choose a rating from 1 to 5.',
        path: [answerId]
      });
    }
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
  notice_variant_id: z.literal('icon-led-disclosure'),
  notice_variant_label: z.string().min(1).max(160),
  notice_format: z.literal('visual_disclosure_ledger'),
  visual_design_variant_id: z.literal('disclosure-ledger-v5'),
  visual_design_attributes: visualDesignAttributesSchema,
  assignment_method: z.literal('fixed-study-treatment')
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

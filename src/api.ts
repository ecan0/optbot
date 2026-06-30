import { responsePayloadSchema, type ResponsePayload } from './schema';

export type SubmitResult = {
  mode: 'preview' | 'submitted';
  responseId?: string;
};

const apiBase = (import.meta.env.VITE_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

export async function submitResponse(payload: ResponsePayload): Promise<SubmitResult> {
  const parsed = responsePayloadSchema.parse(payload);

  if (!apiBase) {
    return { mode: 'preview', responseId: crypto.randomUUID() };
  }

  const response = await fetch(`${apiBase}/v1/responses`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(parsed)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Submit failed with status ${response.status}`);
  }

  const body = (await response.json()) as { response_id?: string };
  return { mode: 'submitted', responseId: body.response_id };
}

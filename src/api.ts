import { publicRuntimeConfig, type PublicRuntimeConfig } from './config';
import { responsePayloadSchema, type ResponsePayload } from './schema';

export type SubmitResult = {
  mode: 'preview' | 'submitted';
  responseId?: string;
};

type SubmissionConfig = Pick<PublicRuntimeConfig, 'apiBaseUrl' | 'collectionMode'>;

export function createResponseSubmitter(config: SubmissionConfig, request: typeof fetch = fetch) {
  return async function submitResponse(payload: ResponsePayload): Promise<SubmitResult> {
    const parsed = responsePayloadSchema.parse(payload);

    if (config.collectionMode === 'preview') {
      return { mode: 'preview' };
    }

    if (!config.apiBaseUrl) {
      throw new Error('Live collection requires VITE_PUBLIC_API_BASE_URL.');
    }

    const response = await request(`${config.apiBaseUrl}/v1/responses`, {
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
  };
}

export const submitResponse = createResponseSubmitter(publicRuntimeConfig);

import { publicRuntimeConfig, type PublicRuntimeConfig } from './config';
import { responsePayloadSchema, type ResponsePayload } from './schema';

export type SubmitResult = {
  mode: 'preview' | 'submitted';
  responseId?: string;
};

type SubmissionConfig = Pick<PublicRuntimeConfig, 'apiBaseUrl' | 'collectionMode'>;

export function createResponseSubmitter(config: SubmissionConfig, request: typeof fetch = fetch) {
  let activeSubmission: Promise<SubmitResult> | null = null;

  return function submitResponse(payload: ResponsePayload): Promise<SubmitResult> {
    const parsed = responsePayloadSchema.parse(payload);

    if (config.collectionMode === 'preview') {
      return Promise.resolve({ mode: 'preview' });
    }

    if (!config.apiBaseUrl) {
      return Promise.reject(new Error('Live collection requires VITE_PUBLIC_API_BASE_URL.'));
    }

    if (activeSubmission) {
      return activeSubmission;
    }

    const submission = (async (): Promise<SubmitResult> => {
      let response: Response;

      try {
        response = await request(`${config.apiBaseUrl}/v1/responses`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(parsed)
        });
      } catch {
        throw new Error('We could not submit your response. Please try again.');
      }

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Verification was not accepted. Complete it again and retry.');
        }
        throw new Error('We could not submit your response. Please try again.');
      }
      let body: { response_id?: unknown };
      try {
        body = (await response.json()) as { response_id?: unknown };
      } catch {
        throw new Error('We could not confirm that your response was stored. Please try again.');
      }
      if (typeof body.response_id !== 'string' || !body.response_id) {
        throw new Error('We could not confirm that your response was stored. Please try again.');
      }
      return { mode: 'submitted', responseId: body.response_id };
    })();

    activeSubmission = submission;
    void submission.then(
      () => {
        if (activeSubmission === submission) {
          activeSubmission = null;
        }
      },
      () => {
        if (activeSubmission === submission) {
          activeSubmission = null;
        }
      }
    );
    return submission;
  };
}

export const submitResponse = createResponseSubmitter(publicRuntimeConfig);

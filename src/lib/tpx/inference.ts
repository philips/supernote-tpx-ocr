import { refreshGrant } from './client';
import type { StoredGrant } from './types';

export interface ModelInfo {
  id: string;
  description?: string;
}

const VISION_HINT = /vision/i;

export const DEFAULT_PROMPT = [
  'Transcribe all handwritten and printed text visible in this image exactly as written.',
  'Preserve line breaks between distinct lines of writing.',
  'Output only the transcribed text, with no commentary, headers, or descriptions of the image.',
  'If the page has no legible text, output nothing.',
].join(' ');

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

export async function listModels(resource: string): Promise<ModelInfo[]> {
  const res = await fetch(`${trimTrailingSlash(resource)}/models`);
  if (!res.ok) throw new Error(`failed to list models: ${res.status}`);
  const body = (await res.json()) as { data: ModelInfo[] };
  return body.data;
}

export function supportsVision(model: ModelInfo): boolean {
  return VISION_HINT.test(model.description ?? '');
}

export interface RecognizeResult {
  text: string;
  /** Possibly refreshed - callers should persist this in place of the grant they passed in. */
  grant: StoredGrant;
}

/** Sends one page image to the model for transcription. Transparently refreshes an expired access token once (spec conformance checklist: "on 401 refresh") and retries. */
export async function recognizePageText(opts: {
  grant: StoredGrant;
  model: string;
  imageDataUrl: string;
  prompt?: string;
}): Promise<RecognizeResult> {
  let grant = opts.grant;

  const call = () =>
    fetch(`${trimTrailingSlash(grant.resource)}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${grant.accessToken}`,
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: opts.prompt ?? DEFAULT_PROMPT },
              { type: 'image_url', image_url: { url: opts.imageDataUrl } },
            ],
          },
        ],
      }),
    });

  let res = await call();
  if (res.status === 401) {
    grant = await refreshGrant(grant);
    res = await call();
  }

  if (res.status === 402) {
    const body = await res.json().catch(() => null) as { error?: { code?: string } } | null;
    throw new Error(
      body?.error?.code === 'balance_exhausted'
        ? "the provider's own balance is empty - the account holder needs to top off"
        : "this grant's budget is exhausted - disconnect and reconnect TPX with a larger budget",
    );
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`recognition request failed (${res.status})${body ? `: ${body}` : ''}`);
  }

  const body = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return { text: body.choices[0]?.message.content ?? '', grant };
}

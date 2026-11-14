import { setTimeout as delay } from 'node:timers/promises';
import { z } from 'zod';

export async function extractWithDocling(file: Buffer, extension: string, mime: string) {
  const base = new URL(process.env.DOCLING_SERVICE_URL ?? '');
  const key = process.env.DOCLING_SERVICE_API_KEY;
  if (
    base.protocol !== 'https:' ||
    !base.hostname.endsWith('.dcls.saas.ibm.com') ||
    base.username ||
    base.password ||
    base.port ||
    base.search ||
    base.hash ||
    !key
  ) {
    throw new Error('Invalid Docling configuration');
  }

  const signal = AbortSignal.timeout(20_000);
  async function request(path: string, body?: FormData): Promise<unknown> {
    const response = await fetch(base.href.replace(/\/+$/, '') + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'X-Api-Key': key! },
      redirect: 'error',
      signal,
      body,
    });
    if (!response.ok) throw new Error('Docling request failed');
    return response.json();
  }

  const form = new FormData();
  form.append('files', new Blob([new Uint8Array(file)], { type: mime }), 'resume.' + extension);
  form.append('options', JSON.stringify({ to_formats: ['md'] }));
  const task = z
    .object({ task_id: z.string().min(1) })
    .parse(await request('/v1/convert/file/async', form));
  const id = encodeURIComponent(task.task_id);
  for (;;) {
    const { task_status } = z
      .object({ task_status: z.string() })
      .parse(await request('/v1/status/poll/' + id));
    if (task_status === 'success') break;
    if (!['pending', 'started', 'queued', 'running'].includes(task_status))
      throw new Error('Docling conversion failed');
    await delay(1000, undefined, { signal });
  }
  const result = z
    .object({
      documents: z.array(
        z.object({ artifacts: z.array(z.object({ artifact_type: z.string(), uri: z.string() })) })
      ),
    })
    .parse(await request('/v1/result/' + id));
  const artifact = result.documents[0]?.artifacts.find((item) => item.artifact_type === 'markdown');
  const url = new URL(artifact?.uri ?? '');
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    !(
      url.hostname === base.hostname ||
      /^dcls[a-z0-9]+\.blob\.core\.windows\.net$/.test(url.hostname)
    )
  ) {
    throw new Error('Invalid Docling artifact URL');
  }
  const response = await fetch(url, { redirect: 'error', signal });
  if (!response.ok || !response.body) throw new Error('Docling artifact unavailable');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return text + decoder.decode();
      size += value.byteLength;
      if (size > 256_000) throw new Error('Docling artifact too large');
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel();
  }
}

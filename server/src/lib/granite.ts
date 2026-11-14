import { z } from 'zod';

const tokenSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().positive(),
});
const chatSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string().trim().min(1) }),
        finish_reason: z.string().optional(),
      })
    )
    .min(1),
});

let cachedToken: { key: string; value: string; expiresAt: number } | undefined;

async function getToken(key: string) {
  if (cachedToken?.key === key && cachedToken.expiresAt > Date.now() + 60_000)
    return cachedToken.value;

  const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: key,
    }),
    signal: AbortSignal.timeout(15_000),
    redirect: 'error',
  });
  if (!response.ok) throw new Error('IBM Cloud authentication failed');
  const token = tokenSchema.parse(await response.json());
  cachedToken = { key, value: token.access_token, expiresAt: Date.now() + token.expires_in * 1000 };
  return token.access_token;
}

export async function generateGraniteContent(prompt: string): Promise<string> {
  const key = process.env.WATSONX_API_KEY?.trim();
  const project = process.env.WATSONX_PROJECT_ID?.trim();
  if (!key || !project) throw new Error('watsonx.ai credentials are missing');

  const endpoint = new URL(process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com');
  if (
    endpoint.protocol !== 'https:' ||
    !endpoint.hostname.endsWith('.ml.cloud.ibm.com') ||
    endpoint.username ||
    endpoint.password ||
    endpoint.port
  ) {
    throw new Error('Invalid watsonx.ai regional endpoint');
  }

  const response = await fetch(new URL('/ml/v1/text/chat?version=2024-05-31', endpoint), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken(key)}` },
    body: JSON.stringify({
      model_id: process.env.WATSONX_MODEL || 'ibm/granite-4-h-small',
      project_id: project,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(75_000),
    redirect: 'error',
  });
  if (!response.ok) {
    if (response.status === 401) cachedToken = undefined;
    throw new Error('watsonx.ai request failed');
  }
  const [choice] = chatSchema.parse(await response.json()).choices;
  if (choice.finish_reason === 'length')
    throw new Error('Granite response reached its token limit');
  return choice.message.content;
}

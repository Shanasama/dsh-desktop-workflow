/** One bounded JSON POST. No credential discovery, logs, SDK retries, or redirects. */
const SAFE_CODES = new Set(['invalid-request-shape','invalid-abort-signal','request-cancelled','invalid-request-json','request-too-large','invalid-endpoint','explicit-transport-dependencies-required','invalid-transport-limits','automatic-retries-forbidden','credential-unavailable','request-timeout','invalid-http-response','redirect-forbidden','non-json-response','response-too-large','missing-response-body','invalid-response-stream','invalid-response-json','invalid-response-shape','http-request-failed','unapproved-provider-or-model','unknown-usage-contract','unsupported-reasoning-contract','unverified-endpoint-path','unsupported-output-limit-contract','provider-contract-not-verified','usage-unknown','invalid-bounded-request','invalid-text-request','nonterminal-response-usage-unknown','model-result-unusable','model-result-incomplete','invalid-typesafe-request','invalid-question-id','invalid-typesafe-question','invalid-typesafe-answer','typesafe-usage-unknown','typesafe-model-mismatch','invalid-typesafe-model','typesafe-http-error','invalid-typesafe-phase','interactive-terminal-required','terminal-input-failed','terminal-input-closed','user-cancelled','multiline-input-refused','invalid-terminal-input','terminal-input-too-long','invalid-preflight-config','preflight-contract-incomplete','synthetic-evidence-is-not-provider-proof','input-bound-not-tied-to-final-request','shared-ledger-preflight-blocked','invalid-cli-arguments','live-config-required']);
export class TransportError extends Error {
  constructor(code) {
    code = SAFE_CODES.has(code) ? code : 'http-request-failed';
    super(code);
    this.name = 'TransportError';
    this.code = code;
    this.retryable = false;
    this.usageUnknown = true;
  }
}
export const reject = code => { throw new TransportError(code); };
export const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export const integer = (value, min = 0) => Number.isSafeInteger(value) && value >= min;
export function exactKeys(value, allowed, code = 'invalid-request-shape') {
  if (!record(value) || Object.keys(value).some(key => !allowed.includes(key))) reject(code);
}
export function checkSignal(signal) {
  if (signal !== undefined && !(signal instanceof AbortSignal)) reject('invalid-abort-signal');
  if (signal?.aborted) reject('request-cancelled');
}
export function encodeRequest(payload, maxRequestBytes) {
  let body;
  try { body = JSON.stringify(payload); } catch { reject('invalid-request-json'); }
  if (typeof body !== 'string' || new TextEncoder().encode(body).byteLength > maxRequestBytes) reject('request-too-large');
  return body;
}
export function createJsonPost({endpoint, getCredential, fetchImpl, timeoutMs = 15_000, maxRequestBytes = 65_536, maxResponseBytes = 262_144}) {
  let url;
  try { url = new URL(endpoint); } catch { reject('invalid-endpoint'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.href !== endpoint) reject('invalid-endpoint');
  if (typeof getCredential !== 'function' || typeof fetchImpl !== 'function') reject('explicit-transport-dependencies-required');
  if (!integer(timeoutMs, 1) || timeoutMs > 120_000 || !integer(maxRequestBytes, 1) || maxRequestBytes > 1_048_576 || !integer(maxResponseBytes, 1) || maxResponseBytes > 1_048_576) reject('invalid-transport-limits');
  return async (payload, {attempts = 1, signal} = {}) => {
    if (attempts !== 1) reject('automatic-retries-forbidden');
    checkSignal(signal);
    const body = encodeRequest(payload, maxRequestBytes);
    let credential;
    try { credential = getCredential(); } catch { reject('credential-unavailable'); }
    if (typeof credential !== 'string' || !credential || credential.length > 8192 || /[^\x21-\x7e]/.test(credential)) reject('credential-unavailable');
    const controller = new AbortController();
    let timeout, reader, response, rejectAbort, dispatched = false;
    let abortCode;
    const aborted = new Promise((_, no) => { rejectAbort = no; });
    const abort = code => {
      if (abortCode) return;
      abortCode = code;
      controller.abort();
      // Never wait indefinitely for a broken injected stream to acknowledge cancellation.
      try { Promise.resolve(reader?.cancel()).catch(() => {}); } catch {}
      rejectAbort(new TransportError(code));
    };
    const onAbort = () => abort('request-cancelled');
    signal?.addEventListener('abort', onAbort, {once: true});
    if (signal?.aborted) onAbort();
    timeout = setTimeout(() => abort('request-timeout'), timeoutMs);
    const operation = async () => {
      checkSignal(controller.signal);
      dispatched = true;
      response = await fetchImpl(endpoint, {
        method: 'POST', redirect: 'error', credentials: 'omit', referrerPolicy: 'no-referrer',
        headers: {'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${credential}`},
        body, signal: controller.signal,
      });
      credential = undefined;
      if (controller.signal.aborted) {
        try { Promise.resolve(response?.body?.cancel()).catch(() => {}); } catch {}
        reject(abortCode || 'request-cancelled');
      }
      if (!response || !integer(response.status, 100) || response.status > 599) reject('invalid-http-response');
      // redirect:error is enforced by native fetch before a second request; these checks
      // also reject mocks/custom fetch implementations that report an already followed hop.
      if (response.redirected || response.status >= 300 && response.status < 400 || response.url && response.url !== endpoint) reject('redirect-forbidden');
      const type = response.headers?.get('content-type') || '';
      if (!/^application\/(?:[a-z0-9.+-]+\+)?json(?:\s*;|$)/i.test(type)) reject('non-json-response');
      const length = response.headers.get('content-length');
      if (length !== null && (!/^\d+$/.test(length) || !integer(Number(length)) || Number(length) > maxResponseBytes)) reject('response-too-large');
      if (!response.body || typeof response.body.getReader !== 'function') reject('missing-response-body');
      reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8', {fatal: true});
      let raw = '', size = 0;
      for (;;) {
        const chunk = await reader.read();
        if (controller.signal.aborted) reject(abortCode || 'request-cancelled');
        if (chunk.done) break;
        if (!(chunk.value instanceof Uint8Array)) reject('invalid-response-stream');
        size += chunk.value.byteLength;
        if (size > maxResponseBytes) reject('response-too-large');
        raw += decoder.decode(chunk.value, {stream: true});
      }
      raw += decoder.decode();
      let json;
      try { json = JSON.parse(raw); } catch { reject('invalid-response-json'); }
      if (!record(json)) reject('invalid-response-shape');
      return {status: response.status, json};
    };
    const pending = operation();
    try { return await Promise.race([pending, aborted]); }
    catch (error) {
      controller.abort();
      // Best-effort cleanup also covers errors before getReader (headers, redirect, size).
      try { Promise.resolve(reader ? reader.cancel() : response?.body?.cancel()).catch(() => {}); } catch {}
      // Preserve only a fixed uncertainty flag; no raw error or transport body escapes.
      const safe = new TransportError(error instanceof TransportError ? error.code : abortCode || 'http-request-failed');
      // No exceptional dispatched request proves server/stream cleanup has stopped.
      safe.requestUnsettled = dispatched;
      throw safe;
    } finally {
      credential = undefined;
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
      try { Promise.resolve(reader?.cancel()).catch(() => {}); } catch {}
      try { reader?.releaseLock(); } catch {}
    }
  };
}

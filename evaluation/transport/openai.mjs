/** Explicit OpenAI-wire subset; compatibility with a third party is not presumed. */
import {normalizeUsage} from '../src/budget.mjs';
import {createJsonPost, exactKeys, integer, record, reject} from './http.mjs';
export const APPROVED_MODEL_ORIGIN = 'https://api.aiuzh.icu';
export const APPROVED_MODEL_ID = 'gpt6-luna';
const messages = value => Array.isArray(value) && value.length > 0 && value.length <= 128 && value.every(m => record(m) && Object.keys(m).every(k => ['role', 'content'].includes(k)) && ['system', 'developer', 'user', 'assistant'].includes(m.role) && typeof m.content === 'string');
export function validateOpenAIContract({baseUrl = APPROVED_MODEL_ORIGIN, endpointPath, modelId = APPROVED_MODEL_ID, contract, maxOutputTokens = 2048}) {
  if (baseUrl !== APPROVED_MODEL_ORIGIN || modelId !== APPROVED_MODEL_ID) reject('unapproved-provider-or-model');
  if (!record(contract) || !['chat_completions', 'responses'].includes(contract.usageFormat)) reject('unknown-usage-contract');
  if (contract.reasoningAccounting !== 'included_in_output') reject('unsupported-reasoning-contract');
  if (!integer(maxOutputTokens, 1) || maxOutputTokens > 2048) reject('invalid-bounded-request');
  const chat = contract.usageFormat === 'chat_completions';
  // Paths are explicit operator input. Never probe paths, change APIs, or retry on 404.
  const paths = chat ? ['/v1/chat/completions', '/chat/completions'] : ['/v1/responses', '/responses'];
  if (!paths.includes(endpointPath)) reject('unverified-endpoint-path');
  if (contract.outputLimitParameter !== (chat ? 'max_completion_tokens' : 'max_output_tokens')) reject('unsupported-output-limit-contract');
  if (contract.verifiedForModelId !== modelId || contract.outputLimitIncludesAllBillableOutput !== true || typeof contract.inputUpperBoundMethod !== 'string' || !contract.inputUpperBoundMethod.trim() || typeof contract.evidence !== 'string' || !contract.evidence.trim()) reject('provider-contract-not-verified');
  return {endpoint: `${baseUrl}${endpointPath}`, modelId, chat, maxOutputTokens, contract: structuredClone(contract)};
}
export function sanitizeOpenAIUsage(usage, contract) {
  if (!record(usage)) reject('usage-unknown');
  const chat = contract.usageFormat === 'chat_completions';
  const inputKey = chat ? 'prompt_tokens' : 'input_tokens', outputKey = chat ? 'completion_tokens' : 'output_tokens';
  const inDetails = `${inputKey}_details`, outDetails = `${outputKey}_details`;
  exactKeys(usage, [inputKey, outputKey, 'total_tokens', inDetails, outDetails], 'usage-unknown');
  const clean = {[inputKey]: usage[inputKey], [outputKey]: usage[outputKey]};
  if (usage.total_tokens !== undefined) clean.total_tokens = usage.total_tokens;
  for (const [key, allowed] of [[inDetails, ['cached_tokens', 'cache_write_tokens', 'audio_tokens']], [outDetails, ['reasoning_tokens', 'audio_tokens', 'accepted_prediction_tokens', 'rejected_prediction_tokens']]]) {
    if (usage[key] === undefined || usage[key] === null) continue;
    exactKeys(usage[key], allowed, 'usage-unknown');
    clean[key] = {};
    for (const [name, n] of Object.entries(usage[key])) {
      if (!integer(n) || n > usage[key === inDetails ? inputKey : outputKey]) reject('usage-unknown');
      clean[key][name] = n;
    }
  }
  try { normalizeUsage(clean, contract); } catch { reject('usage-unknown'); }
  return clean;
}
export function validateOpenAIRequest(payload, profile) {
  const {chat, modelId, contract} = profile;
  const cap = contract.outputLimitParameter;
  exactKeys(payload, ['model', chat ? 'messages' : 'input', ...(chat ? ['n'] : ['instructions']), cap, 'stream', 'store']);
  if (payload.model !== modelId || payload.stream !== false || !integer(payload[cap], 1) || payload[cap] > profile.maxOutputTokens || payload.store !== undefined && payload.store !== false || payload.n !== undefined && payload.n !== 1) reject('invalid-bounded-request');
  if (chat ? !messages(payload.messages) : !(typeof payload.input === 'string' || messages(payload.input))) reject('invalid-text-request');
  if (payload.instructions !== undefined && typeof payload.instructions !== 'string') reject('invalid-text-request');
}
export function createOpenAITransport(options) {
  const profile = validateOpenAIContract(options);
  const post = createJsonPost({...options, endpoint: profile.endpoint});
  return async (payload, controls) => {
    validateOpenAIRequest(payload, profile);
    const {status, json} = await post(payload, controls);
    // Nonterminal Responses can still accrue charges after this response; retain reservation.
    if (!profile.chat && ['queued', 'in_progress'].includes(json.status)) reject('nonterminal-response-usage-unknown');
    const usage = sanitizeOpenAIUsage(json.usage, profile.contract);
    const failure = code => ({usage, error: {code}});
    if (status < 200 || status >= 300) return failure('http-error');
    if (json.error !== undefined && json.error !== null) return failure('provider-error');
    if (json.model !== profile.modelId) return failure('response-model-mismatch');
    if (profile.chat) {
      if (!Array.isArray(json.choices) || json.choices.length !== 1) reject('nonterminal-response-usage-unknown');
      const choice = json.choices[0];
      if (!record(choice) || !['stop', 'length', 'content_filter', 'tool_calls', 'function_call'].includes(choice.finish_reason)) reject('nonterminal-response-usage-unknown');
      if (!record(choice.message) || choice.message.role !== 'assistant' || typeof choice.message.content !== 'string' || !['stop', 'length', 'content_filter'].includes(choice.finish_reason) || choice.message.tool_calls || choice.message.function_call || choice.message.refusal) return failure('unusable-output');
      return {usage, model: profile.modelId, choices: [{index: 0, finish_reason: choice.finish_reason, message: {role: 'assistant', content: choice.message.content}}]};
    }
    if (!['completed', 'incomplete', 'failed', 'cancelled'].includes(json.status)) reject('nonterminal-response-usage-unknown');
    if (json.status !== 'completed') return failure('response-not-completed');
    if (!Array.isArray(json.output)) return failure('invalid-output');
    const output = [];
    for (const item of json.output) {
      // Reasoning content is not used as a controller command; usage already counts it.
      if (record(item) && item.type === 'reasoning') continue;
      if (!record(item) || item.type !== 'message' || item.role !== 'assistant' || item.status !== 'completed' || !Array.isArray(item.content)) return failure('unusable-output');
      const content = [];
      for (const part of item.content) {
        if (!record(part) || part.type !== 'output_text' || typeof part.text !== 'string') return failure('unusable-output');
        content.push({type: 'output_text', text: part.text});
      }
      output.push({type: 'message', role: 'assistant', status: 'completed', content});
    }
    if (!output.length) return failure('empty-output');
    return {usage, model: profile.modelId, status: 'completed', output};
  };
}
/** Invoke only AFTER callBudgetedModel settled usage; output is never evaluated as code. */
export function decodeOpenAIText(response, usageFormat) {
  if (response?.error) reject('model-result-unusable');
  if (usageFormat === 'chat_completions') {
    const choice = response?.choices?.[0];
    if (!choice || choice.finish_reason !== 'stop') reject('model-result-incomplete');
    return choice.message.content;
  }
  if (usageFormat !== 'responses' || response?.status !== 'completed') reject('model-result-incomplete');
  return response.output.flatMap(item => item.content.map(part => part.text)).join('\n');
}

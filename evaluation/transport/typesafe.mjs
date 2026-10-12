/** Official TypeSafe /v1/systemone contract, checked against docs on 2026-10-10. */
import {readFileSync} from 'node:fs';
import {parseJevResponse, projectJevText, JEV_DISCLOSURE} from '../../src/jev-client.js';
import {createJsonPost, exactKeys, integer, record, reject} from './http.mjs';
export const TYPESAFE_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
export const DOCUMENTED_JEV_MODEL = 'jev-1.13.0';
const policies = Object.fromEntries(['lane', 'loop-step'].map(name => [name, JSON.parse(readFileSync(new URL(`../../src/vendor/${name}.json`, import.meta.url), 'utf8'))]));
const description = value => typeof value === 'string' && value.trim().length > 0 || record(value) && Object.keys(value).length > 0 || Array.isArray(value) && value.length > 0;
const unit = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
const validModel = model => typeof model === 'string' && /^(?:jev-\d+\.\d+\.\d+(?:-[a-z0-9.]+)?|jev-latest|jev-preview)$/.test(model);
export function validateTypeSafeRequest(payload, modelId) {
  exactKeys(payload, ['model', 'state', 'questions']);
  if (payload.model !== modelId || !validModel(modelId) || !description(payload.state) || !record(payload.questions) || !Object.keys(payload.questions).length || Object.keys(payload.questions).length > 128) reject('invalid-typesafe-request');
  for (const [name, question] of Object.entries(payload.questions)) {
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(name)) reject('invalid-question-id');
    exactKeys(question, ['type', 'instructions', 'criteria']);
    if (!description(question.instructions)) reject('invalid-typesafe-question');
    const criteria = question.criteria;
    if (question.type === 'noul') {
      if (criteria !== undefined && (!record(criteria) || Object.keys(criteria).length !== 2 || !description(criteria.true) || !description(criteria.false))) reject('invalid-typesafe-question');
    } else if (question.type === 'choice') {
      if (!record(criteria) || Object.keys(criteria).length < 2 || Object.keys(criteria).length > 255 || Object.values(criteria).some(v => v !== null && !description(v))) reject('invalid-typesafe-question');
    } else if (question.type === 'score') {
      if (!Array.isArray(criteria) || criteria.length < 2 || criteria.length > 10 || criteria.some(v => !description(v))) reject('invalid-typesafe-question');
    } else reject('invalid-typesafe-question');
  }
}
function distribution(raw, keys) {
  if (!record(raw) || Object.keys(raw).length !== keys.length || !keys.every(key => unit(raw[key])) || Math.abs(Object.values(raw).reduce((a, b) => a + b, 0) - 1) > 0.03) reject('invalid-typesafe-answer');
  return Object.fromEntries(keys.map(key => [key, raw[key]]));
}
export function sanitizeTypeSafeResponse(json, payload) {
  if (!record(json.usage) || !integer(json.usage.input_tokens) || !integer(json.usage.output_tokens)) reject('typesafe-usage-unknown');
  if (!validModel(json.model) || !['jev-latest', 'jev-preview'].includes(payload.model) && json.model !== payload.model) reject('typesafe-model-mismatch');
  if (!record(json.answers) || Object.keys(json.answers).length !== Object.keys(payload.questions).length) reject('invalid-typesafe-answer');
  const answers = {};
  for (const [name, question] of Object.entries(payload.questions)) {
    const answer = json.answers[name];
    if (!record(answer) || answer.type !== question.type) reject('invalid-typesafe-answer');
    if (question.type === 'noul') {
      if (!unit(answer.noul)) reject('invalid-typesafe-answer');
      answers[name] = {type: 'noul', noul: answer.noul};
    } else if (question.type === 'choice') {
      const probabilities = distribution(answer.probabilities, Object.keys(question.criteria));
      if (!Object.hasOwn(probabilities, answer.choice) || !unit(answer.confidence) || probabilities[answer.choice] + 1e-6 < Math.max(...Object.values(probabilities))) reject('invalid-typesafe-answer');
      answers[name] = {type: 'choice', choice: answer.choice, probabilities, confidence: answer.confidence};
    } else {
      const keys = question.criteria.map((_, index) => String(index));
      const probabilities = distribution(answer.probabilities, keys);
      if (!unit(answer.confidence) || typeof answer.score !== 'number' || !Number.isFinite(answer.score) || answer.score < 0 || answer.score > keys.length - 1 || !record(answer.legend) || Object.keys(answer.legend).length !== keys.length || !keys.every(key => typeof answer.legend[key] === 'string')) reject('invalid-typesafe-answer');
      const mean = Object.entries(probabilities).reduce((sum, [key, value]) => sum + Number(key) * value, 0);
      if (Math.abs(mean - answer.score) > 0.03 * keys.length) reject('invalid-typesafe-answer');
      answers[name] = {type: 'score', score: answer.score, probabilities, confidence: answer.confidence, legend: Object.fromEntries(keys.map(key => [key, answer.legend[key]]))};
    }
  }
  return {model: json.model, usage: {input_tokens: json.usage.input_tokens, output_tokens: json.usage.output_tokens}, answers};
}
export function createTypeSafeTransport({modelId = DOCUMENTED_JEV_MODEL, ...options}) {
  if (!validModel(modelId)) reject('invalid-typesafe-model');
  const post = createJsonPost({...options, endpoint: TYPESAFE_ENDPOINT});
  return async (payload, controls) => {
    validateTypeSafeRequest(payload, modelId);
    const {status, json} = await post(payload, controls);
    if (status < 200 || status >= 300 || json.error) reject('typesafe-http-error');
    return sanitizeTypeSafeResponse(json, payload);
  };
}
export function createTypeSafeDecisionClient(options) {
  const requestedModel = options.modelId ?? DOCUMENTED_JEV_MODEL;
  const transport = createTypeSafeTransport({...options, modelId: requestedModel});
  let networkVerified = false;
  return {
    mode: 'live', requestedModel,
    status: () => ({configured: true, available: networkVerified, networkVerified, endpoint: TYPESAFE_ENDPOINT, requestedModel, disclosure: JEV_DISCLOSURE}),
    preflight() {}, // Construction checks configuration. Only the caller supplies in-memory credentials.
    async decide({phase, goal, evidence, notes, signal}) {
      if (!['classify', 'step'].includes(phase)) reject('invalid-typesafe-phase');
      const policy = policies[phase === 'classify' ? 'lane' : 'loop-step'];
      const state = phase === 'classify'
        ? {task: projectJevText(goal, 3000), context: 'User-selected role models are pinned. Classify review intensity only; never change a model/provider or grant permission.'}
        : {task: projectJevText(goal, 2000), diff_stat: projectJevText(evidence?.diffStat, 1500), checks: projectJevText(evidence?.checkSummary, 2500), notes: projectJevText(notes, 1200)};
      const raw = await transport({model: requestedModel, state, questions: policy.questions}, {attempts: 1, signal});
      const answers = parseJevResponse(raw, phase, {requestedModel});
      networkVerified = true;
      return answers;
    },
  };
}

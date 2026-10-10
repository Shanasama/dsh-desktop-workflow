#!/usr/bin/env node
/** Local user handoff only. Importing only loads checked-in policy data; it never discovers credentials or sends HTTP. */
import {readFileSync, statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {BudgetLedger, JevMeter, openProjectLedger, openJevMeter, callBudgetedModel, prepareModelRequest} from '../src/budget.mjs';
import {createOpenAITransport, validateOpenAIContract, decodeOpenAIText, APPROVED_MODEL_ORIGIN, APPROVED_MODEL_ID} from './openai.mjs';
import {createTypeSafeTransport, DOCUMENTED_JEV_MODEL, TYPESAFE_ENDPOINT} from './typesafe.mjs';
import {exactKeys, integer, reject, TransportError} from './http.mjs';
import {hiddenInput} from './terminal.mjs';
export const PUBLIC_SYNTHETIC_PROMPT = 'Public synthetic connectivity fixture. Reply with the single word READY. No tools or external actions.';
export function syntheticRequest(config) {
  const chat = config.providerContract.usageFormat === 'chat_completions';
  return {model: config.modelId, ...(chat ? {messages: [{role: 'user', content: PUBLIC_SYNTHETIC_PROMPT}]} : {input: PUBLIC_SYNTHETIC_PROMPT}), store: false};
}
export const requestHash = payload => createHash('sha256').update(JSON.stringify(payload)).digest('hex');
export function validatePreflightConfig(config) {
  exactKeys(config, ['schemaVersion', 'projectId', 'baseUrl', 'endpointPath', 'modelId', 'jevModelId', 'maxOutputTokens', 'inputUpperBoundTokens', 'requestSha256', 'providerContract'], 'invalid-preflight-config');
  exactKeys(config.providerContract, ['usageFormat', 'reasoningAccounting', 'inputUpperBoundMethod', 'outputLimitParameter', 'outputLimitIncludesAllBillableOutput', 'verifiedForModelId', 'evidence'], 'invalid-preflight-config');
  if (config.baseUrl !== APPROVED_MODEL_ORIGIN || config.modelId !== APPROVED_MODEL_ID || config.schemaVersion !== 1 || config.projectId !== 'dsh-jev-project-acceptance' || config.jevModelId !== DOCUMENTED_JEV_MODEL || !integer(config.maxOutputTokens, 1) || config.maxOutputTokens > 128 || !integer(config.inputUpperBoundTokens, 1) || config.inputUpperBoundTokens + config.maxOutputTokens > 20_000) reject('preflight-contract-incomplete');
  validateOpenAIContract({baseUrl: config.baseUrl, endpointPath: config.endpointPath, modelId: config.modelId, contract: config.providerContract});
  if (/synthetic|offline|fixture|example/i.test(config.providerContract.evidence)) reject('synthetic-evidence-is-not-provider-proof');
  const payload = prepareModelRequest(syntheticRequest(config), {maxOutputTokens: config.maxOutputTokens}, config.providerContract);
  if (config.requestSha256 !== requestHash(payload)) reject('input-bound-not-tied-to-final-request');
  return payload;
}
export async function runOffline() {
  const contract = {usageFormat: 'chat_completions', reasoningAccounting: 'included_in_output', inputUpperBoundMethod: 'synthetic-only', outputLimitParameter: 'max_completion_tokens', outputLimitIncludesAllBillableOutput: true, verifiedForModelId: APPROVED_MODEL_ID, evidence: 'synthetic-only'};
  const ledger = new BudgetLedger({projectId: 'offline-transport'}), jev = new JevMeter({maxCalls: 1, maxAttempts: 1});
  let physicalCalls = 0;
  const modelTransport = createOpenAITransport({baseUrl: APPROVED_MODEL_ORIGIN, endpointPath: '/v1/chat/completions', modelId: APPROVED_MODEL_ID, contract, getCredential: () => 'public-synthetic-placeholder', fetchImpl: async () => {
    physicalCalls++;
    return Response.json({model: APPROVED_MODEL_ID, choices: [{message: {role: 'assistant', content: 'READY'}, finish_reason: 'stop'}], usage: {prompt_tokens: 20, completion_tokens: 8, total_tokens: 28, prompt_tokens_details: {cached_tokens: 10}, completion_tokens_details: {reasoning_tokens: 3}}});
  }});
  const result = await callBudgetedModel({ledger, reservation: {taskId: 'preflight', batchId: 'pilot', inputUpperBound: 100, maxOutputTokens: 128, taskLimit: 20_000, batchLimit: 100_000}, contract, request: syntheticRequest({modelId: APPROVED_MODEL_ID, providerContract: contract}), transport: modelTransport});
  const jt = createTypeSafeTransport({getCredential: () => 'public-synthetic-placeholder', fetchImpl: async () => {
    physicalCalls++;
    return Response.json({model: DOCUMENTED_JEV_MODEL, answers: {ready: {type: 'noul', noul: 0.99}}, usage: {input_tokens: 20, output_tokens: 2}});
  }});
  await jev.call(() => jt({model: DOCUMENTED_JEV_MODEL, state: 'The public synthetic fixture is ready.', questions: {ready: {type: 'noul', instructions: 'Does the state report readiness?'}}}, {attempts: 1}));
  return {mode: 'offline', networkRequests: 0, simulatedHttpPosts: physicalCalls, modelId: APPROVED_MODEL_ID, simulatedModelUsage: result.counted, simulatedJev: jev.snapshot(), decodedFixturePassed: decodeOpenAIText(result.response, contract.usageFormat) === 'READY', liveReady: false};
}
export function offlineConfigReport(config) {
  let blocker = null;
  try { validatePreflightConfig(config); } catch (error) { blocker = error instanceof TransportError ? error.code : 'invalid-preflight-config'; }
  const requestHashes = Object.fromEntries(['chat_completions', 'responses'].map(usageFormat => {
    const contract = {...config.providerContract, usageFormat, outputLimitParameter: usageFormat === 'chat_completions' ? 'max_completion_tokens' : 'max_output_tokens'};
    const payload = prepareModelRequest(syntheticRequest({modelId: APPROVED_MODEL_ID, providerContract: contract}), {maxOutputTokens: integer(config.maxOutputTokens, 1) ? config.maxOutputTokens : 128}, contract);
    return [usageFormat, requestHash(payload)];
  }));
  return {mode: 'offline-config-check', networkRequests: 0, credentialsRead: false, configurationAccepted: blocker === null, liveReady: false, blocker, requestHashes, note: 'Hashes bind an input-bound proof to the final public fixture. A hash or one successful response does not prove provider limits.'};
}
export async function runLivePreflight(config, {readSecret = hiddenInput, fetchImpl = globalThis.fetch, openLedger = openProjectLedger, openMeter = openJevMeter, write = text => process.stderr.write(`${text}\n`)} = {}) {
  // All configuration and shared-ledger checks happen before asking for a credential.
  validatePreflightConfig(config);
  const project = openLedger(fileURLToPath(new URL('../run-state/project-budget.json', import.meta.url)), {projectId: config.projectId, limit: 10_000_000, concurrency: 1});
  let meter, modelCredential, jevCredential;
  const aborter = new AbortController();
  const onInterrupt = () => aborter.abort();
  process.once('SIGINT', onInterrupt); process.once('SIGTERM', onInterrupt);
  try {
    meter = openMeter(fileURLToPath(new URL('../run-state/project-jev.json', import.meta.url)), {maxCalls: 30, maxAttempts: 2, concurrency: 1});
    const snapshot = project.ledger.snapshot();
    const amount = config.inputUpperBoundTokens + config.maxOutputTokens;
    const task = snapshot.tasks['http-preflight'], batch = snapshot.batches.pilot;
    if (snapshot.halted || snapshot.remaining < amount || task && (task.attempts >= 2 || task.spent + amount > 20_000 || task.limit !== 20_000 || task.maxAttempts !== 2 || task.logicalCalls) || batch && (batch.spent + amount > 100_000 || batch.limit !== 100_000) || meter.meter.snapshot().halted || meter.meter.snapshot().calls >= 30) reject('shared-ledger-preflight-blocked');
    write(`将只发送两次公共合成请求：${TYPESAFE_ENDPOINT} (${config.jevModelId}) 和 ${config.baseUrl}${config.endpointPath} (${config.modelId})。无重试，不发送用户项目；使用同一项目预算账本。`);
    write('供应商合约由配置的证据支持；一次响应不能证明硬上限。两项密钥仅在本进程内使用，不写文件、环境或报告。请勿在共享终端或录屏中输入。');
    modelCredential = await readSecret('模型服务密钥（隐藏输入）：', {signal: aborter.signal});
    jevCredential = await readSecret('TypeSafe 密钥（隐藏输入）：', {signal: aborter.signal});
    const confirmation = await readSecret('输入 SEND 并回车，才会发出两次请求；其他输入取消：', {signal: aborter.signal});
    if (confirmation !== 'SEND' || aborter.signal.aborted) reject('user-cancelled');
    const jt = createTypeSafeTransport({modelId: config.jevModelId, getCredential: () => jevCredential, fetchImpl});
    await meter.meter.call(() => jt({model: config.jevModelId, state: 'The public synthetic fixture is ready.', questions: {ready: {type: 'noul', instructions: 'Does the state report readiness?'}}}, {attempts: 1, signal: aborter.signal}), {signal: aborter.signal});
    const transport = createOpenAITransport({baseUrl: config.baseUrl, endpointPath: config.endpointPath, modelId: config.modelId, maxOutputTokens: config.maxOutputTokens, contract: config.providerContract, getCredential: () => modelCredential, fetchImpl});
    const result = await callBudgetedModel({ledger: project.ledger, reservation: {taskId: 'http-preflight', batchId: 'pilot', inputUpperBound: config.inputUpperBoundTokens, maxOutputTokens: config.maxOutputTokens, taskLimit: 20_000, batchLimit: 100_000, maxAttemptsPerTask: 2}, contract: config.providerContract, request: syntheticRequest(config), transport, signal: aborter.signal});
    let outputMatchesFixture = false;
    try { outputMatchesFixture = decodeOpenAIText(result.response, config.providerContract.usageFormat).trim() === 'READY'; } catch {}
    return {mode: 'user-started-live-preflight', modelId: config.modelId, observedUsage: result.counted, outputMatchesFixture, projectSpentTokens: project.ledger.snapshot().spent, jev: meter.meter.snapshot(), providerContractProvedByThisCall: false, note: 'No model output or credentials are included. This is a connectivity/usage observation, not a project quality acceptance.'};
  } finally {
    modelCredential = undefined; jevCredential = undefined;
    process.removeListener('SIGINT', onInterrupt); process.removeListener('SIGTERM', onInterrupt);
    // Unresolved model usage intentionally retains the lock and reservation; do not reset.
    try { meter?.close(); } catch {}
    try { project.close(); } catch {}
  }
}
export async function main(argv = process.argv.slice(2)) {
  if (argv.length === 1 && argv[0] === '--help') return {help: 'node evaluation/transport/run.mjs [--offline] [--config path]\nnode evaluation/transport/run.mjs --live-preflight --config path\nOffline is the default. Live mode requires a verified provider contract, a real TTY, two hidden keys, and explicit SEND. Never pass a key as an argument.'};
  let live = false, configPath, modeSeen = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--live-preflight' && !modeSeen) { live = true; modeSeen = true; }
    else if (argv[i] === '--offline' && !modeSeen) { modeSeen = true; continue; }
    else if (argv[i] === '--config' && !configPath && argv[i + 1] && !argv[i + 1].startsWith('--')) configPath = argv[++i];
    else reject('invalid-cli-arguments');
  }
  if (!configPath) { if (live) reject('live-config-required'); return runOffline(); }
  let config;
  try { const info = statSync(configPath); if (!info.isFile() || info.size > 32_768) reject('invalid-preflight-config'); const raw = readFileSync(configPath); if (raw.byteLength > 32_768) reject('invalid-preflight-config'); config = JSON.parse(raw.toString('utf8')); } catch { reject('invalid-preflight-config'); }
  if (!live) return offlineConfigReport(config);
  if (!process.stdin.isTTY || !process.stderr.isTTY) reject('interactive-terminal-required');
  return runLivePreflight(config);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(result => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`), error => {
    // Unknown errors can contain OS paths or transport secrets: never print their text.
    const code = error instanceof TransportError ? error.code : 'preflight-stopped';
    process.stderr.write(`${JSON.stringify({ok: false, code, instruction: 'Stopped without retry. Review the local ledger before another run; never delete an unresolved lock to bypass accounting.'})}\n`);
    process.exitCode = 1;
  });
}

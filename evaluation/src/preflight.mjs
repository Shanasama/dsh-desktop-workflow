/** Pure preflight: no network, credential access, or execution of model output. */
export function preflight(config, fixture) {
  const blockers = [];
  const need = (ok, message) => { if (!ok) blockers.push(message); };
  need(config.schemaVersion === 1, 'Unsupported config version.');
  need(config.baseUrl === 'https://api.aiuzh.icu', 'Only the user-approved provider origin is configured.');
  need(typeof config.modelId === 'string' && config.modelId.trim().length > 0, 'Exact external model ID is required.');
  need(config.credentialConfiguredByUser === true, 'User must securely configure a fresh credential; this tool never checks or reads it.');
  const b = config.budget ?? {}, p = config.providerContract ?? {};
  need(b.definitionConfirmed === true && b.definition === 'input-plus-total-billable-output-reasoning-counted-once', 'User-confirmed token accounting is required.');
  need(Number.isSafeInteger(b.projectTokenLimit) && b.projectTokenLimit > 0 && b.projectTokenLimit <= 10_000_000, 'Project limit must not exceed 10,000,000 tokens.');
  need(Number.isSafeInteger(b.pilotTokenLimit) && b.pilotTokenLimit > 0 && b.pilotTokenLimit <= Math.min(100_000, b.projectTokenLimit), 'Invalid pilot token limit.');
  need(Number.isSafeInteger(b.taskTokenLimit) && b.taskTokenLimit > 0 && b.taskTokenLimit <= Math.min(20_000, b.pilotTokenLimit), 'Invalid task token limit.');
  need(Number.isSafeInteger(b.concurrency) && b.concurrency === 1, 'Pilot concurrency must remain 1.');
  need(Number.isSafeInteger(b.maxOutputTokens) && b.maxOutputTokens > 0 && b.maxOutputTokens < b.taskTokenLimit, 'Invalid output token limit.');
  need(Number.isSafeInteger(b.maxModelAttemptsPerTask) && b.maxModelAttemptsPerTask >= 1 && b.maxModelAttemptsPerTask <= 2, 'At most two task attempts are permitted in the pilot.');
  need(Number.isSafeInteger(b.maxRequestsPerTask) && b.maxRequestsPerTask >= 1 && b.maxRequestsPerTask <= 12, 'At most twelve physical model calls are permitted for one team task.');
  need(b.transportRetries === 0, 'Automatic model transport retries must be disabled.');
  need(config.automaticUpgrade === false && Array.isArray(config.upgradeModelIds) && config.upgradeModelIds.length === 0, 'No unverified upgrade model may be selected.');
  need(['chat_completions', 'responses'].includes(p.usageFormat), 'Provider usage format is unverified.');
  need(['included_in_output', 'additional_to_output'].includes(p.reasoningAccounting), 'Provider reasoning accounting is unverified.');
  need(typeof p.inputUpperBoundMethod === 'string' && p.inputUpperBoundMethod.length > 0, 'A verified bound for the full serialized input is required.');
  need(['max_completion_tokens', 'max_tokens', 'max_output_tokens'].includes(p.outputLimitParameter) && p.outputLimitIncludesAllBillableOutput === true, 'Provider must enforce an output cap including all billable reasoning.');
  need(p.verifiedForModelId === config.modelId && typeof p.evidence === 'string' && p.evidence.length > 0, 'Model-specific provider-contract evidence is required.');
  const j = config.jev ?? {};
  need(j.projectOnly === true && Number.isSafeInteger(j.maxAttemptsPerDecision) && j.maxAttemptsPerDecision >= 1 && j.maxAttemptsPerDecision <= 2 && Number.isSafeInteger(j.pilotMaxCalls) && j.pilotMaxCalls > 0 && j.concurrency === 1, 'Jev pilot must have bounded project-only calls, retries and concurrency.');
  need(fixture?.provenance === 'synthetic-offline-fixture' && fixture.realModelCalls === 0 && Array.isArray(fixture.cases) && fixture.cases.length > 0, 'Only the public synthetic stage1 fixture is supported.');
  return {
    mode: 'offline-preflight', realModelCalls: 0, realJevCalls: 0,
    configurationReady: blockers.length === 0, liveTransportImplemented: true, liveReady: false, independentVerifierIntegrationImplemented: true, persistentJevMeterImplemented: true, realTaskAdapterVerified: false, costRoutingImplemented: false,
    modelId: config.modelId, preferredModelFamily: config.preferredModelFamily,
    projectTokenLimit: b.projectTokenLimit, pilotTokenLimit: b.pilotTokenLimit, taskTokenLimit: b.taskTokenLimit,
    moneyLimit: null, priceKnown: config.pricing !== null && config.pricing !== undefined,
    blockers: [...blockers, 'Real provider accounting, safe user-controlled credential entry, and an authorized task adapter must be verified before live acceptance.'],
    evidence: {
      fixtureProvenance: fixture?.provenance ?? null, referenceCases: fixture?.cases?.length ?? 0,
      syntheticReferenceAgreement: null, replayAgreement: null,
      actualVerification: 'not-run', observedProductionAccuracy: null,
      effectiveCompletionRate: null, failureRecoveryRate: null, falseAcceptRate: null, unnecessaryReworkRate: null
    }
  };
}

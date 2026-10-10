import {safeRelative} from './verification.js';
/** Strict, data-only contracts for the bounded team runner. No model calls live here. */
export const TEAM_ROLES = Object.freeze(['planner', 'coordinator', 'researcher', 'explorer', 'worker', 'reviewer']);
export const TASK_ROLES = Object.freeze(['researcher', 'explorer', 'worker']);
export const DEFAULT_LIMITS = Object.freeze({concurrency: 2, maxAgents: 12, maxTasks: 8, maxRetries: 1, maxDurationMs: 600000, maxStepsPerAgent: 8, maxRounds: 4, maxJevCalls: 10});
export const RETENTION_LIMITS = Object.freeze({runs: 16, nodes: 64, edges: 512, events: 256, outputPerNode: 8000, outputPerRun: 64000});
const LIMIT_RANGES = {concurrency: [1, 4], maxAgents: [1, 32], maxTasks: [1, 12], maxRetries: [0, 2], maxDurationMs: [1000, 1800000], maxStepsPerAgent: [1, 16], maxRounds: [1, 8], maxJevCalls: [1, 20]};
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const UNSAFE_TEXT = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g;

export function safeText(value, max = 2000) {
  return typeof value === 'string' ? value.slice(0, max).replace(UNSAFE_TEXT, '') : '';
}
function record(value, allowed, label, required = allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new TypeError(`${label} must be a plain object`);
  const keys = Reflect.ownKeys(value);
  if (keys.some(key => typeof key !== 'string' || !allowed.includes(key) || !('value' in Object.getOwnPropertyDescriptor(value, key)))) throw new TypeError(`${label} contains unsupported fields`);
  for (const key of required) if (!Object.hasOwn(value, key)) throw new TypeError(`${label}.${key} is required`);
  return value;
}
function string(value, min, max, label) {
  if (typeof value !== 'string' || value.length < min || value.length > max || safeText(value, max) !== value || (min && !value.trim())) throw new TypeError(`${label} must be safe text (${min}–${max} characters)`);
  return value;
}
function array(value, max, label) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > max) throw new TypeError(`${label} must be an array of at most ${max} entries`);
  if (Reflect.ownKeys(value).some(key => key !== 'length' && (typeof key !== 'string' || !/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length))) throw new TypeError(`${label} contains unsupported fields`);
  for (let i = 0; i < value.length; i++) if (!Object.hasOwn(value, i) || !('value' in Object.getOwnPropertyDescriptor(value, String(i)))) throw new TypeError(`${label} must contain data entries`);
  return value;
}
function identifier(value, label) {
  if (typeof value !== 'string' || !ID.test(value)) throw new TypeError(`${label} is not a valid task identifier`);
  return value;
}
export const DEFAULT_PRODUCTION = Object.freeze({budget:{enabled:false,tokenLimit:0},routing:{enabled:false,roles:{}},jev:{model:'jev-latest',trace:true,shadow:{enabled:false,model:'',maxCalls:2}}});
export function validateModelSelection(value,label='model') {
  const model=record(value,['provider','model','reasoningEffort','maxTokens'],label,['provider','model']);
  const entry={provider:string(model.provider,1,120,`${label}.provider`),model:string(model.model,1,160,`${label}.model`),maxTokens:4096};
  if(Object.hasOwn(model,'reasoningEffort'))entry.reasoningEffort=string(model.reasoningEffort,1,32,`${label}.reasoningEffort`);
  if(Object.hasOwn(model,'maxTokens')){if(!Number.isInteger(model.maxTokens)||model.maxTokens<1||model.maxTokens>32768)throw new TypeError(`${label}.maxTokens must be an integer from 1 to 32768`);entry.maxTokens=model.maxTokens;}
  return entry;
}
export function validateProduction(value={}) {
  const budget=structuredClone(DEFAULT_PRODUCTION.budget),routing=structuredClone(DEFAULT_PRODUCTION.routing),jev=structuredClone(DEFAULT_PRODUCTION.jev);
  if(value.budget!==undefined){record(value.budget,['enabled','tokenLimit'],'budget');if(typeof value.budget.enabled!=='boolean'||!Number.isSafeInteger(value.budget.tokenLimit)||value.budget.tokenLimit<0||value.budget.tokenLimit>1_000_000_000||value.budget.enabled&&value.budget.tokenLimit===0)throw new TypeError('budget requires an explicit positive token limit when enabled');Object.assign(budget,value.budget);}
  if(value.routing!==undefined){record(value.routing,['enabled','roles'],'routing');if(typeof value.routing.enabled!=='boolean')throw new TypeError('routing.enabled must be boolean');record(value.routing.roles,TEAM_ROLES,'routing.roles',[]);routing.enabled=value.routing.enabled;for(const[role,candidates]of Object.entries(value.routing.roles)){record(candidates,['weak','strong'],`routing.${role}`,[]);routing.roles[role]={};for(const[tier,model]of Object.entries(candidates))routing.roles[role][tier]=validateModelSelection(model,`routing.${role}.${tier}`);}}
  if(value.jev!==undefined){record(value.jev,['enabled','disclosureAccepted','model','trace','shadow'],'jev',[]);if(value.jev.model!==undefined){if(typeof value.jev.model!=='string'||value.jev.model.length>64||!/^(?:jev-latest|jev-preview|jev-\d+\.\d+\.\d+(?:-[a-z0-9.]+)?)$/.test(value.jev.model))throw new TypeError('jev.model must be a supported alias or an explicit pinned version');jev.model=value.jev.model;}if(value.jev.trace!==undefined){if(typeof value.jev.trace!=='boolean')throw new TypeError('jev.trace must be boolean');jev.trace=value.jev.trace;}if(value.jev.shadow!==undefined){record(value.jev.shadow,['enabled','model','maxCalls'],'jev.shadow');const shadow=value.jev.shadow;if(typeof shadow.enabled!=='boolean'||typeof shadow.model!=='string'||shadow.model.length>64||(shadow.enabled||shadow.model!=='')&&!/^jev-\d+\.\d+\.\d+(?:-[a-z0-9.]+)?$/.test(shadow.model)||!Number.isInteger(shadow.maxCalls)||shadow.maxCalls<0||shadow.maxCalls>20)throw new TypeError('shadow requires an explicit pinned Jev version and 0–20 calls');jev.shadow={...shadow};}}
  return {budget,routing,jev};
}
export function configuredModels(config){const selected={...config.roles};for(const[role,candidates]of Object.entries(config.routing?.roles||{}))for(const[tier,model]of Object.entries(candidates))selected[`${role}.${tier}`]=model;return selected;}
export function selectRoleModel(config,role,lane){const tier=config.routing?.enabled?(lane==='small'?'weak':['high','escalate'].includes(lane)?'strong':'base'):'base';const chosen=config.routing?.roles?.[role]?.[tier];return {model:structuredClone(chosen||config.roles[role]),tier:chosen?tier:'base',reason:!config.routing?.enabled?'routing_disabled':tier==='base'?'medium_lane_base':chosen?'configured_lane_candidate':'candidate_absent_base'};}
export function validateConfig(value) {
  record(value, ['sessionId', 'goal', 'roles', 'limits', 'reviewPlan', 'routeEnabled', 'jev', 'verification', 'budget', 'routing'], 'config', ['sessionId', 'goal', 'roles']);
  const sessionId = string(value.sessionId, 1, 160, 'sessionId');
  const goal = string(value.goal, 1, 8000, 'goal');
  record(value.roles, [...TEAM_ROLES, 'router'], 'roles', TEAM_ROLES);
  const roles = {};
  for (const role of [...TEAM_ROLES, 'router']) {
    if (!Object.hasOwn(value.roles, role)) continue;
    roles[role] = validateModelSelection(value.roles[role], `roles.${role}`);
  }
  const limits = {...DEFAULT_LIMITS};
  if (value.limits !== undefined) {
    record(value.limits, Object.keys(LIMIT_RANGES), 'limits', []);
    for (const [key, [min, max]] of Object.entries(LIMIT_RANGES)) if (Object.hasOwn(value.limits, key)) {
      if (!Number.isInteger(value.limits[key]) || value.limits[key] < min || value.limits[key] > max) throw new TypeError(`limits.${key} must be an integer from ${min} to ${max}`);
      limits[key] = value.limits[key];
    }
  }
  for (const key of ['reviewPlan', 'routeEnabled']) if (value[key] !== undefined && typeof value[key] !== 'boolean') throw new TypeError(`${key} must be a boolean`);
  const routeEnabled = value.routeEnabled ?? false;
  if (routeEnabled && !roles.router) throw new TypeError('roles.router is required when routing is enabled');
  let jev, verification;
  if(value.jev!==undefined){if(value.jev.enabled!==true||typeof value.jev.disclosureAccepted!=='boolean')throw new TypeError('Jev must be explicitly enabled');jev={...validateProduction({jev:value.jev}).jev,enabled:true,disclosureAccepted:value.jev.disclosureAccepted};}
  if(value.verification!==undefined){record(value.verification,['profileId','scope'],'verification');const scope=array(value.verification.scope,16,'scope');if(!scope.length||!scope.every(safeRelative)||new Set(scope).size!==scope.length)throw new TypeError('Scope must contain unique safe relative paths');verification={profileId:identifier(value.verification.profileId,'verification.profileId'),scope:[...scope]};}
  return {sessionId, goal, roles, limits, ...Object.fromEntries(Object.entries(validateProduction(value)).filter(([key])=>key!=='jev')), reviewPlan: value.reviewPlan ?? true, routeEnabled, ...(jev?{jev}:{}), ...(verification?{verification}:{})};
}

export function validatePlan(value, maxTasks = 12) {
  record(value, ['summary', 'tasks'], 'plan');
  const summary = string(value.summary, 1, 2000, 'plan.summary');
  array(value.tasks, maxTasks, 'plan.tasks');
  if (!value.tasks.length) throw new TypeError('plan.tasks must not be empty');
  const tasks = value.tasks.map((task, index) => {
    record(task, ['id', 'title', 'instructions', 'role', 'dependsOn'], `task ${index}`);
    if (!TASK_ROLES.includes(task.role)) throw new TypeError(`task ${index} has an unknown role`);
    const dependsOn = array(task.dependsOn, maxTasks, `task ${index}.dependsOn`).map(id => identifier(id, 'dependency'));
    if (new Set(dependsOn).size !== dependsOn.length) throw new TypeError('Duplicate task dependency');
    return {id: identifier(task.id, 'task.id'), title: string(task.title, 1, 160, 'task.title'), instructions: string(task.instructions, 1, 8000, 'task.instructions'), role: task.role, dependsOn};
  });
  const byId = new Map(tasks.map(task => [task.id, task]));
  if (byId.size !== tasks.length) throw new TypeError('Duplicate task identifier');
  for (const task of tasks) for (const dependency of task.dependsOn) if (!byId.has(dependency)) throw new TypeError(`Unknown dependency: ${dependency}`);
  const visited = new Set(), visiting = new Set();
  const visit = id => {
    if (visiting.has(id)) throw new TypeError('Task dependency cycle');
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id).dependsOn) visit(dependency);
    visiting.delete(id); visited.add(id);
  };
  for (const task of tasks) visit(task.id);
  return {summary, tasks};
}
export function validateReview(value, taskIds = []) {
  record(value, ['verdict', 'summary', 'issues'], 'review');
  if (!['approve', 'revise', 'blocked'].includes(value.verdict)) throw new TypeError('Unknown review verdict');
  const issues = array(value.issues, 24, 'review.issues').map(issue => {
    record(issue, ['taskId', 'message'], 'review issue');
    const taskId = string(issue.taskId, 0, 64, 'issue.taskId');
    if (taskId && !taskIds.includes(taskId)) throw new TypeError(`Unknown review task: ${taskId}`);
    return {taskId, message: string(issue.message, 1, 2000, 'issue.message')};
  });
  return {verdict: value.verdict, summary: string(value.summary, 1, 2000, 'review.summary'), issues};
}
export function validateRoute(value) {
  record(value, ['route', 'summary'], 'route');
  if (!['plan', 'clarify'].includes(value.route)) throw new TypeError('Unknown route');
  return {route: value.route, summary: string(value.summary, 1, 2000, 'route.summary')};
}
// The verified rc.2 host supports a small JSON Schema subset. Runtime validators
// above enforce all bounds, patterns, DAG integrity, and data-only restrictions.
const textSchema = maxLength => ({type: 'string', description: `Nonempty safe text, at most ${maxLength} characters.`});
export const PLAN_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['summary', 'tasks'], properties: {
    summary: textSchema(2000), tasks: {type: 'array', description: 'Between 1 and 12 tasks, also within the configured maxTasks limit.', items: {
      type: 'object', additionalProperties: false, required: ['id', 'title', 'instructions', 'role', 'dependsOn'], properties: {
        id: {type: 'string', description: '1 to 64 characters: start with an ASCII letter or digit; remaining characters may also be underscore or hyphen.'}, title: textSchema(160), instructions: textSchema(8000),
        role: {type: 'string', enum: TASK_ROLES}, dependsOn: {type: 'array', description: 'At most 12 unique task IDs from this plan; no dependency cycles.', items: {type: 'string', description: '1 to 64 characters: start with an ASCII letter or digit; remaining characters may also be underscore or hyphen.'}},
      },
    }},
  },
};
export const REVIEW_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['verdict', 'summary', 'issues'], properties: {
    verdict: {type: 'string', enum: ['approve', 'revise', 'blocked']}, summary: textSchema(2000),
    issues: {type: 'array', description: 'At most 24 concrete review issues.', items: {type: 'object', additionalProperties: false, required: ['taskId', 'message'], properties: {taskId: {type: 'string', description: 'An existing task ID, at most 64 characters; empty string for a global issue.'}, message: textSchema(2000)}}},
  },
};
export const ROUTE_SCHEMA = {type: 'object', additionalProperties: false, required: ['route', 'summary'], properties: {route: {type: 'string', enum: ['plan', 'clarify']}, summary: textSchema(2000)}};

// Public preflight name shared with the host adapter; validation returns detached data.
export const validateTeamConfig = validateConfig;

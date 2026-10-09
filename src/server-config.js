/**
 * Fork addition (not upstream). Upstream keeps `verificationProfiles` in trusted server
 * configuration that only a profile patch can carry, and this DSH build ships no surface
 * that renders a bundle row's config — so the field could not be edited at all. This
 * module exposes the verification profiles to the plugin's own configuration view and
 * writes edits through the host's `configEditor`, which persists the profile patch and
 * reconciles it through the normal Loader path.
 *
 * What this deliberately does NOT do:
 * - It never accepts or returns a secret. The Jev key stays out of the browser: only the
 *   environment variable NAME is ever shown.
 * - It never lets the browser supply executable paths or endpoints. A check is an argv
 *   plus a timeout, validated here with the same rules the verifier enforces, and the
 *   command still runs under the original host sandbox.
 * - It never widens permissions. Persisting config cannot grant a capability the host
 *   does not already have.
 */
import { verificationProfiles } from './verification.js';

/** `id` of the profile patch row this plugin owns; also its Loader patch id. */
export const ENTRY_ID = 'desktop-workflow';

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** One relative repository path segment: no `.`/`..`, no separators, no backslashes. */
const SAFE_SEGMENT = /^[A-Za-z0-9_.-]+$/;
/** The same rule the verifier applies to a scope or protected path. */
const safeRelative = value => typeof value === 'string' && value.length > 0 && value.length <= 240
  && !value.startsWith('/') && value.split('/').every(part => SAFE_SEGMENT.test(part) && part !== '.' && part !== '..');

/** The exact slice of the config this view owns. Other keys are never touched. */
function ownConfig(config) {
  return {
    verificationProfiles: config?.verificationProfiles ?? [],
    models: config?.models ?? {},
    verification: { profileId: config?.verification?.profileId ?? '', scope: config?.verification?.scope ?? [] },
    jev: { ...(config?.jev ?? {}), disclosureAccepted: config?.jev?.disclosureAccepted === true },
  };
}

/** A model entry as the form writes it: `"provider/model"`. */
const MODEL = /^[^/\s]{1,120}\/[^/\s]{1,160}$/;

/**
 * Validate everything the chat tool needs before it can start a run. Kept here rather
 * than in the browser so a malformed payload can never reach the profile patch.
 */
export function validateRunConfig(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('配置必须是对象。');
  const models = input.models ?? {};
  if (typeof models !== 'object' || Array.isArray(models)) throw new TypeError('models 必须是「岗位 → 提供方/模型」的映射。');
  const allowed = ['default', 'planner', 'coordinator', 'researcher', 'explorer', 'worker', 'reviewer'];
  for (const [role, value] of Object.entries(models)) {
    if (!allowed.includes(role)) throw new TypeError(`未知的岗位键「${role}」；可用：${allowed.join('、')}。`);
    if (typeof value === 'string' && !MODEL.test(value.trim())) throw new TypeError(`models.${role} 要写成「提供方/模型」，例如 deepseek-official/deepseek-flash。`);
    if (typeof value === 'string' && !value.trim()) throw new TypeError(`models.${role} 不能为空。`);
  }
  const verification = input.verification ?? {};
  const profileId = typeof verification.profileId === 'string' ? verification.profileId.trim() : '';
  const profiles = validateProfiles(input.verificationProfiles ?? []);
  if (profileId && !profiles.some(profile => profile.id === profileId)) throw new TypeError(`验证方案「${profileId}」不在已配置的验证方案里。`);
  const scope = verification.scope ?? [];
  if (!Array.isArray(scope)) throw new TypeError('允许修改的相对路径必须是数组。');
  if (!scope.every(safeRelative)) throw new TypeError('允许修改的相对路径必须是相对仓库根的路径，不能是绝对路径、`.`/`..`、反斜线或通配符。');
  if (input.jev?.disclosureAccepted !== undefined && typeof input.jev.disclosureAccepted !== 'boolean') throw new TypeError('TypeSafe 同意开关必须是布尔值。');
  return {
    verificationProfiles: profiles,
    models,
    verification: { profileId, scope: [...scope] },
    jev: { disclosureAccepted: input.jev?.disclosureAccepted === true },
  };
}

/** Everything a chat-started run needs, read back for the form. */
export function readRunConfig(configEditor) {
  const view = readServerConfig(configEditor);
  const layers = configEditor && typeof configEditor.configuration === 'function' ? configEditor.configuration() : [];
  const row = Array.isArray(layers) ? layers.find(item => findEntry([item?.entry])) : undefined;
  const raw = (row?.override && Object.keys(row.override).length ? row.override : row?.inherited) ?? {};
  return {
    ...view,
    models: raw.models && typeof raw.models === 'object' ? raw.models : {},
    verification: {
      profileId: typeof raw.verification?.profileId === 'string' ? raw.verification.profileId : '',
      scope: Array.isArray(raw.verification?.scope) ? raw.verification.scope : [],
    },
    disclosureAccepted: raw.jev?.disclosureAccepted === true,
  };
}

/**
 * Find this plugin's patch row. The entry shape differs between Loader versions, so the
 * patch id is read from every place it has been observed, with the package name as a
 * last resort. Never matches another plugin's row.
 */
function findEntry(entries) {
  const list = Array.isArray(entries) ? entries : [];
  return list.find(item => (item?.id ?? item?.options?.id) === ENTRY_ID)
    ?? list.find(item => (item?.name ?? item?.options?.name) === 'dsh-desktop-workflow')
    ?? undefined;
}

/**
 * Read the profiles as the panel should show them, plus which storage answered.
 * @param {{entries?:Function, configuration?:Function}|undefined} configEditor
 */
export function readServerConfig(configEditor) {
  const available = !!configEditor && typeof configEditor.entries === 'function';
  let row;
  if (available) {
    const layers = typeof configEditor.configuration === 'function' ? configEditor.configuration() : [];
    row = Array.isArray(layers) ? layers.find(item => findEntry([item?.entry])) : undefined;
  }
  // The override layer is what an edit rewrites; show it when present, else the effective config.
  const raw = row?.override && Object.keys(row.override).length ? row.override : row?.inherited ?? {};
  let profiles = [];
  let invalid;
  try {
    profiles = verificationProfiles(raw.verificationProfiles);
  } catch (error) {
    invalid = typeof error?.message === 'string' ? error.message : '验证配置无效。';
  }
  return {
    available,
    writable: available,
    reason: available ? undefined : '当前宿主未提供配置编辑服务，无法在面板保存；请改 profile 的 cordis.patch.yml。',
    verificationProfiles: profiles,
    invalid,
  };
}

/**
 * Validate a browser-submitted profile list and persist it through the host editor.
 * Mirrors the verifier's own rules so a bad profile is refused before it can ever reach
 * a run (a bad one would otherwise fail at check time and poison the run lease).
 */
export function validateProfiles(input) {
  if (!Array.isArray(input)) throw new TypeError('verificationProfiles 必须是数组。');
  if (input.length > 12) throw new TypeError('验证配置最多 12 条。');
  return input.map(profile => {
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) throw new TypeError('每条验证配置必须是对象。');
    const id = profile.id;
    const name = typeof profile.name === 'string' && profile.name.trim() ? profile.name.trim().slice(0, 120) : id;
    if (typeof id !== 'string' || !SAFE_ID.test(id)) throw new TypeError('验证配置 id 只能包含字母、数字、下划线和连字符（1–64 位）。');
    if (!Array.isArray(profile.checks) || !profile.checks.length || profile.checks.length > 4) throw new TypeError('每条验证配置需要 1–4 条检查。');
    const checks = profile.checks.map(check => {
      if (!check || typeof check !== 'object' || Array.isArray(check)) throw new TypeError('每条检查必须是对象。');
      if (typeof check.id !== 'string' || !SAFE_ID.test(check.id)) throw new TypeError('检查 id 只能包含字母、数字、下划线和连字符（1–64 位）。');
      if (!Array.isArray(check.argv) || !check.argv.length || check.argv.length > 24) throw new TypeError('检查 argv 需要 1–24 项。');
      if (!check.argv.every(item => typeof item === 'string' && item.length <= 500 && !/[\u0000-\u001f]/.test(item))) throw new TypeError('argv 每项必须是不含控制字符的字符串（≤500 字符）。');
      if (!Number.isInteger(check.timeoutMs) || check.timeoutMs < 1000 || check.timeoutMs > 60000) throw new TypeError('检查超时必须是不小于 1000、不大于 60000 的整数（毫秒）。');
      return { id: check.id, argv: [...check.argv], timeoutMs: check.timeoutMs };
    });
    if (!Array.isArray(profile.protectedPaths) || !profile.protectedPaths.length || profile.protectedPaths.length > 32) throw new TypeError('受保护路径需要 1–32 条。');
    if (!profile.protectedPaths.every(safeRelative)) throw new TypeError('受保护路径必须是相对仓库根的路径：不能是绝对路径、`.`/`..`、反斜线或通配符。');
    return {
      id,
      name,
      checks,
      protectedPaths: [...profile.protectedPaths],
      expectsChanges: profile.expectsChanges !== false,
    };
  });
}

/**
 * Persist the run configuration. `edit` is the host editor call; `fallbackWrite` is an
 * optional profile-patch writer used only when the host provides no editor service.
 */
export async function saveRunConfig(input, { configEditor, fallbackWrite } = {}) {
  const validated = validateRunConfig(input);
  if (configEditor && typeof configEditor.entries === 'function' && typeof configEditor.edit === 'function') {
    const entry = findEntry(configEditor.entries());
    if (!entry) throw new Error('未找到 desktop-workflow 配置条目，无法保存。');
    await configEditor.edit(entry, (current, inherited) => {
      const base = current ?? inherited ?? {};
      return { ...base, ...ownConfig({ ...base, ...validated }) };
    });
    return { saved: true, via: 'configEditor', ...validated };
  }
  if (typeof fallbackWrite === 'function') {
    await fallbackWrite(validated);
    return { saved: true, via: 'profilePatch', ...validated };
  }
  throw new Error('当前宿主未提供配置编辑服务，无法保存。');
}

/** Persist only the verification profile list (kept for callers that own just that field). */
export async function saveProfiles(input, { configEditor, fallbackWrite } = {}) {
  const profiles = validateProfiles(input);
  if (configEditor && typeof configEditor.entries === 'function' && typeof configEditor.edit === 'function') {
    const entry = findEntry(configEditor.entries());
    if (!entry) throw new Error('未找到 desktop-workflow 配置条目，无法保存。');
    await configEditor.edit(entry, (current, inherited) => {
      const base = current ?? inherited ?? {};
      return { ...base, ...ownConfig({ ...base, verificationProfiles: profiles }) };
    });
    return { saved: true, via: 'configEditor', verificationProfiles: profiles };
  }
  if (typeof fallbackWrite === 'function') {
    await fallbackWrite(profiles);
    return { saved: true, via: 'profilePatch', verificationProfiles: profiles };
  }
  throw new Error('当前宿主未提供配置编辑服务，无法保存。');
}

/**
 * Fork addition (not upstream). dsh-desktop-workflow read the Jev key with
 * `process.env[name]` only, so the key had to be exported in the host environment and
 * could not be managed anywhere in DSH. This bridge resolves the same environment
 * variable NAME through the host's `credentials` service as well — the layer DSH's own
 * Settings cards write to, over the process environment, the provider-managed store and
 * `.env` files — while keeping the consumer's synchronous contract.
 *
 * `ctx.credentials.resolve()` is async, but Jev's `status()`/`preflight()` are sync and
 * run on every catalog/start call, so resolution is cached and refreshed in the
 * background; `resolve()` answers from the last refresh and never blocks. The
 * environment is still read synchronously as the fallback, and an empty stored value
 * counts as absent everywhere (the credentials service's own rule), so a blank never
 * masquerades as a configured secret.
 */
export function createCredentialBridge(reflect, environment = process.env) {
  const cache = new Map();
  const clean = value => (typeof value === 'string' && value.trim() ? value.trim() : undefined);
  const service = () => {
    try { return reflect() ?? undefined; } catch { return undefined; }
  };
  const fromEnvironment = name => clean(environment?.[name]);
  const resolve = name => clean(cache.get(name)) ?? fromEnvironment(name);
  let refreshing = null;
  return {
    resolve,
    /** Begin a background refresh of every name that has been resolved so far. */
    refresh(names = []) {
      const list = [...new Set([...names, ...cache.keys()])].filter(name => typeof name === 'string' && name.length);
      const credentials = service();
      if (!credentials || typeof credentials.resolve !== 'function' || !list.length || refreshing) return refreshing;
      refreshing = Promise.all(list.map(async name => {
        try { cache.set(name, clean((await credentials.resolve(name))?.value)); }
        catch { /* keep the last known value; never forward credential diagnostics */ }
      })).finally(() => { refreshing = null; });
      return refreshing;
    },
    /** Diagnostics for the panel: which layer answered, without exposing a value. */
    snapshot(names = []) {
      const credentials = service();
      return {
        fromCredentialsService: !!credentials,
        names: [...new Set(names)].map(name => ({
          name,
          stored: clean(cache.get(name)) !== undefined,
          environment: fromEnvironment(name) !== undefined,
        })),
      };
    },
    async dispose() { await refreshing; },
  };
}

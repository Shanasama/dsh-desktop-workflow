/** Role restrictions compose with native DSH policy; they never grant host permissions. */
import { createRequire } from 'node:module';
import { isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';

export const READ_TOOL_NAMES = Object.freeze(['read', 'read_image', 'glob', 'grep', 'structured_output']);
const WEB_TOOL_NAMES = Object.freeze(['web_search', 'web_fetch']);
const EDIT_TOOL_NAMES = Object.freeze(['write', 'edit']);
export function roleToolNames(role, project, sessionPlanning = false) {
  return new Set([...READ_TOOL_NAMES,
    ...(role === 'researcher' ? WEB_TOOL_NAMES : []),
    ...(role === 'worker' && (!project || ['verified', 'unverified-editable'].includes(project.mode)) ? EDIT_TOOL_NAMES : []),
    ...(role === 'worker' && !project ? ['bash', 'pwsh'] : []),
    ...(sessionPlanning ? ['todo_write'] : []),
  ]);
}

export const TEAM_TOOL_BOUNDARY_PROMPT = `The model-visible tools and native host permissions are authoritative; tools not supplied are unavailable. Every role may use ${READ_TOOL_NAMES.filter(name => name !== 'structured_output').join(', ')}. Researcher may also use ${WEB_TOOL_NAMES.join(', ')} for web research; this does not grant arbitrary network or shell access. Worker may use ${EDIT_TOOL_NAMES.join(', ')} only while the project is editable. Automatic project teams have no general shell: pwd, ls, cat, git, npm, node and similar commands cannot run. Use the supplied file tools for discovery; independent verification is performed by the host verifier. A verified official todo_write, when supplied, updates only the calling child's session task list. It is permitted for planning and read-only work and does not modify project files. Follow its multi-step planning instructions. Never use it to claim unobserved work completed. structured_output is the child's response tool. A tool or file-boundary denial ends that task and must not be retried or bypassed. Never change permissions, credentials or security settings, and never delegate recursively.`;

/** Resolve the same official modules as the launcher, not a profile-local peer.
 * rc.2 exposes no tool provenance field. Its official Todo apply registers one
 * unique name into its own scope, owned for the ACTIVE fiber's whole lifetime.
 * Public registry + scope + exact definition identity therefore identify that
 * registration without trusting a tool name, description or source-string hash.
 * This is a composition contract, not isolation from hostile in-process code.
 */
export async function resolveOfficialTodoContract(ctx) {
  try {
    const profile = ctx.get?.('profileContext');
    if (profile !== undefined && (typeof profile?.installAnchor !== 'string' || !isAbsolute(profile.installAnchor))) return undefined;
    const hostRequire = createRequire(profile?.installAnchor ?? import.meta.url);
    const toolsFile = hostRequire.resolve('@deepseek-ai/dsh-tools');
    const toolsRequire = createRequire(toolsFile);
    const paths = [
      ['@deepseek-ai/dsh-tool-todo', hostRequire],
      ['@deepseek-ai/dsh-tools', hostRequire],
      ['@deepseek-ai/dsh-scope', toolsRequire],
    ];
    for (const [name, resolver] of paths) {
      const manifest = JSON.parse(await readFile(resolver.resolve(name + '/package.json'), 'utf8'));
      if (manifest.name !== name || manifest.version !== '0.2.0-rc.2') return undefined;
    }
    const [todo, nativeTools, scope] = await Promise.all(paths.map(([name, resolver]) => import(pathToFileURL(resolver.resolve(name)).href)));
    if (typeof todo.apply !== 'function' || typeof scope.scopeOf !== 'function' || typeof scope.scopeChainOf !== 'function') return undefined;
    return Object.freeze({
      identify(tools, agent) {
        if (!(tools instanceof nativeTools.ToolRuntime)) return undefined;
        const definition = tools.get('todo_write', agent);
        if (!definition || typeof definition.execute !== 'function') return undefined;
        const runtime = ctx.registry?.get(todo);
        if (!runtime || runtime.callback !== todo.apply) return undefined;
        const chain = scope.scopeChainOf(agent);
        for (const fiber of runtime.fibers) {
          if (fiber.state !== 2 || typeof fiber.config?.allowParallelInProgress !== 'boolean') continue;
          const owner = scope.scopeOf(fiber.ctx);
          if (owner !== undefined && !chain.includes(owner)) continue;
          if (fiber.ctx.get('tools').get('todo_write', owner) === definition) return definition;
        }
        return undefined;
      },
    });
  } catch { return undefined; } // Unknown installations never gain the capability.
}

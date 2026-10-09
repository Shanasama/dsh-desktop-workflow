#!/usr/bin/env node
// Explicitly requested profile only; delegates to DSH's reversible manager.
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
const [action,profile,archive,...extra]=process.argv.slice(2);
if(!['install','uninstall'].includes(action) || !profile || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(profile) || extra.length || (action==='uninstall' && archive) || (action==='install' && (!archive || !existsSync(resolve(archive)) || !archive.endsWith('.tgz')))) {
 console.error('Usage: node scripts/profile-install.mjs install <existing-profile> <plugin.tgz>\n       node scripts/profile-install.mjs uninstall <profile>'); process.exit(2);
}
if (process.platform==='win32') { console.error('On Windows, run the documented dsh plugin command directly in PowerShell. This wrapper is POSIX-only.'); process.exit(2); }
const home = process.env.DSH_HOME?.trim() || join(homedir(), '.dsh');
if (!existsSync(join(home, 'profiles', profile, 'package.json'))) { console.error('Target profile does not exist. Initialize and review the DSH Desktop profile before installing this viewer.'); process.exit(2); }
const args=action==='install' ? ['plugin','--profile',profile,'add',resolve(archive),'--ignore-scripts'] : ['plugin','--profile',profile,'remove','dsh-desktop-workflow','--config.ignore-scripts=true'];
const result=spawnSync('dsh',args,{stdio:'inherit',shell:false});
if(result.error){console.error(`Could not run DSH: ${result.error.message}`);process.exit(1);}
process.exit(result.status ?? 1);

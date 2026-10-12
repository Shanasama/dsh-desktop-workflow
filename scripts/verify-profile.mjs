/** Optional real CLI lifecycle smoke. Requires DSH_CLI pointing to official rc.2 lib/bin.js. */
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const cli = process.env.DSH_CLI;
if(!cli || !path.isAbsolute(cli))throw new Error('Set DSH_CLI to the official DSH 0.2.0-rc.2 absolute lib/bin.js path.');
const archive=path.resolve(process.argv[2]||'dsh-desktop-workflow-0.5.1.tgz');await access(archive);
const temp=await mkdtemp(path.join(tmpdir(),'dsh-workflow-profile-'));
try{
 const home=path.join(temp,'home');const profile=path.join(home,'profiles','workflow-qa');await mkdir(profile,{recursive:true});
 await writeFile(path.join(profile,'package.json'),JSON.stringify({name:'isolated-desktop-workflow-qa',version:'0.0.0',private:true,dependencies:{},dsh:{profile:{bundles:[]}}}));
 const env={...process.env,DSH_HOME:home,PNPM_HOME:path.join(temp,'pnpm'),XDG_CACHE_HOME:path.join(temp,'cache'),npm_config_cache:path.join(temp,'npm')};
 const invoke=args=>{const result=spawnSync(process.execPath,[cli,'plugin','--profile','workflow-qa',...args],{env,stdio:'inherit'});assert.equal(result.status,0,'Official plugin manager failed');};
 invoke(['add',archive,'--ignore-scripts']);let manifest=JSON.parse(await readFile(path.join(profile,'package.json'),'utf8'));assert.ok(manifest.dependencies['dsh-desktop-workflow']);assert.ok(manifest.dsh.profile.bundles.includes('dsh-desktop-workflow'));
 invoke(['remove','dsh-desktop-workflow','--config.ignore-scripts=true']);manifest=JSON.parse(await readFile(path.join(profile,'package.json'),'utf8'));assert.ok(!manifest.dependencies?.['dsh-desktop-workflow']);assert.ok(!manifest.dsh.profile.bundles.includes('dsh-desktop-workflow'));
 console.log('PASS: actual isolated rc.2 package install, bundle registration, removal.');
}finally{await rm(temp,{recursive:true,force:true});}

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {READ_TOOL_NAMES,roleToolNames,TEAM_TOOL_BOUNDARY_PROMPT,resolveOfficialTodoContract} from '../src/tool-contract.js';

test('one role capability contract includes session planning separately from project mutation',()=>{
 for(const role of ['router','planner','coordinator','reviewer','explorer','researcher','worker']) {
  const allowed=roleToolNames(role,{mode:'analysis-only'},true);
  assert.equal(allowed.has('todo_write'),true);
  assert.equal(allowed.has('structured_output'),true);
  for(const name of ['write','edit','bash','pwsh','run_code','spawn_agent','settings_write'])assert.equal(allowed.has(name),false);
  assert.equal(allowed.has('web_search'),role==='researcher');
  assert.equal(allowed.has('web_fetch'),role==='researcher');
 }
 const editable=roleToolNames('worker',{mode:'verified'},true);
 assert.equal(editable.has('write'),true);assert.equal(editable.has('edit'),true);assert.equal(editable.has('bash'),false);
 assert.equal(roleToolNames('explorer',{mode:'verified'},false).has('todo_write'),false);
 assert.equal(roleToolNames('worker',undefined,false).has('bash'),true,'existing non-project adapter contract is preserved');
 assert.ok(Object.isFrozen(READ_TOOL_NAMES));
});

test('planning prompt follows native schema and distinguishes web tools from arbitrary networking',()=>{
 assert.match(TEAM_TOOL_BOUNDARY_PROMPT,/model-visible tools and native host permissions are authoritative/);
 assert.match(TEAM_TOOL_BOUNDARY_PROMPT,/Researcher may also use web_search, web_fetch/);
 assert.match(TEAM_TOOL_BOUNDARY_PROMPT,/calling child's session task list/);
 assert.match(TEAM_TOOL_BOUNDARY_PROMPT,/permitted for planning and read-only work/);
 assert.match(TEAM_TOOL_BOUNDARY_PROMPT,/must not be retried or bypassed/);
 assert.doesNotMatch(TEAM_TOOL_BOUNDARY_PROMPT,/no general shell and no network/);
});

test('an invalid launcher anchor does not fall back to a local same-name tool',async()=>{
 assert.equal(await resolveOfficialTodoContract({get:()=>({installAnchor:'relative-untrusted-anchor'})}),undefined);
 assert.equal(await resolveOfficialTodoContract({get:()=>({installAnchor:'/missing/host/package.json'})}),undefined);
});

import {test} from 'node:test';
// Opt-in official host regression: never install or discover a host/profile.
test('rc.2 client settings callbacks honor real Cordis Remote injection', {skip:!process.env.DSH_NODE_MODULES},async()=>{
  await import('../scripts/verify-client-host.mjs');
});

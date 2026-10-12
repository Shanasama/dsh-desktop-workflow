import {test} from 'node:test';
test('verification invocations satisfy official rc.2 tool schemas and safely release the run', {skip:!process.env.DSH_NODE_MODULES},async()=>{
  await import('../scripts/verify-verifier-host.mjs');
});

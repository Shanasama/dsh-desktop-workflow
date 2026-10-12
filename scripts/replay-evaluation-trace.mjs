/** Decision-policy replay only: does not execute models, commands, source or tests. */
import {readFile,stat} from 'node:fs/promises';
import {replayExecutionTrace} from '../src/execution-trace.js';
try{
 const path=process.argv[2];if(!path||process.argv.length!==3)throw Error();
 if((await stat(path)).size>2*1024*1024)throw Error();
 const result=replayExecutionTrace(JSON.parse(await readFile(path,'utf8')));
 console.log(JSON.stringify(result,null,2));if(result.matches===false)process.exitCode=1;
}catch{console.error('Cannot replay: provide one valid, complete metadata-only trace JSON file (at most 2 MiB).');process.exitCode=2;}

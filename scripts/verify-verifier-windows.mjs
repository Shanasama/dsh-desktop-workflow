#!/usr/bin/env node
/** Opt-in Windows-native acceptance. This entry must never certify another OS. */
import {runPwshAcceptance} from './verify-verifier-pwsh.mjs';
await runPwshAcceptance({requireWindows:true});

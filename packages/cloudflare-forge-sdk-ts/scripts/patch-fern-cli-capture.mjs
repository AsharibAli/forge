#!/usr/bin/env node
// Targets fern-api 5.112.0. Fail closed when its minified anchors change.
import { readFileSync, writeFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) {
  console.error('usage: patch-fern-cli-capture.mjs <fern-cli.cjs>');
  process.exit(2);
}

const original = readFileSync(path, 'utf8');
let next = original;

const envFrom = 'kfs=["FERN_STACK_TRACK",F2e]';
const envTo = 'kfs=["FERN_STACK_TRACK",F2e,"CLOUDFLARE_FERN_CAPTURE_DIR"]';
if (next.includes(envFrom)) {
  next = next.replace(envFrom, envTo);
  console.log('patched Fern container environment for canonical IR capture');
} else if (!next.includes(envTo)) {
  console.error('Fern runContainer environment marker not found');
  process.exit(1);
}

const bindFrom =
  'let d=()=>T3h({logger:e,imageName:t,args:r,binds:n,envVars:i,ports:o,removeAfterCompletion:a,writeLogsToFile:s,runner:c,pull:u,platform:l,signal:p});';
const bindTo =
  'process.env.CLOUDFLARE_FERN_CAPTURE_DIR&&n.push(`${process.env.CLOUDFLARE_FERN_CAPTURE_DIR}:/capture`);' + bindFrom;
if (next.includes(bindTo)) {
  // Already patched.
} else if (next.includes(bindFrom)) {
  next = next.replace(bindFrom, bindTo);
  console.log('patched Fern canonical IR capture bind mount');
} else {
  console.error('Fern ContainerExecutionEnvironment bind marker not found');
  process.exit(1);
}

if (next !== original) {
  writeFileSync(path, next);
  console.log('wrote', path);
} else {
  console.log('Fern CLI already supports canonical IR capture');
}

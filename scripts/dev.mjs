// RAM-aware dev bundler selection.
// Turbopack (Next's default) is fast but memory-hungry; on low-RAM machines it swaps and thrashes the CPU. Webpack has a lower, more predictable memory ceiling.
// We pick by total installed RAM (a per-machine constant) rather than free RAM, because free RAM fluctuates and flipping bundlers between runs invalidates the .next cache.
// To override this heuristic, force a bundler with `npm run dev:webpack` or `npm run dev:turbopack`.
import { spawn } from 'node:child_process';
import os from 'node:os';

const totalGiB = os.totalmem() / 1024 ** 3;
const useWebpack = totalGiB < 12; // 8 GB -> webpack, 16 GB -> Turbopack

console.log(
  `[dev] ${Math.round(totalGiB)} GiB RAM detected -> ${useWebpack ? 'webpack' : 'Turbopack'}`
);

// Forward any extra flags to `next dev` (e.g. --experimental-https from dev-https), so every dev command gets the same RAM-based bundler selection.
const passthrough = process.argv.slice(2);

// Pass the command as a single string (not args + shell:true, which Node 24 deprecates via DEP0190). shell:true resolves the next.cmd shim on Windows and is harmless elsewhere; the args are script/developer-supplied, not untrusted input.
const parts = [
  'next',
  'dev',
  ...(useWebpack ? ['--webpack'] : []),
  ...passthrough,
];
const child = spawn(parts.join(' '), { stdio: 'inherit', shell: true });

child.on('error', err => {
  console.error('[dev] failed to start the dev server:', err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  // OOM kills (SIGKILL) are plausible on the low-RAM machines this script targets; surface them as a failure instead of a false success.
  // Interactive stops (Ctrl-C / SIGINT, SIGTERM) exit cleanly to avoid npm error noise.
  if (signal && signal !== 'SIGINT' && signal !== 'SIGTERM') {
    console.error(`[dev] dev server terminated by ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 0);
});

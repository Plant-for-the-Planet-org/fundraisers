// RAM-aware dev bundler selection.
// Turbopack (Next's default) is fast but memory-hungry; on low-RAM machines it swaps
// and thrashes the CPU. Webpack has a lower, more predictable memory ceiling.
// We pick by total installed RAM (a per-machine constant) rather than free RAM, because
// free RAM fluctuates and flipping bundlers between runs invalidates the .next cache.
// Use `npm run dev:webpack` to force webpack regardless of this heuristic.
import { spawn } from 'node:child_process';
import os from 'node:os';

const totalGiB = os.totalmem() / 1024 ** 3;
const useWebpack = totalGiB < 12; // 8 GB -> webpack, 16 GB -> Turbopack

console.log(
  `[dev] ${Math.round(totalGiB)} GiB RAM detected -> ${useWebpack ? 'webpack' : 'Turbopack'}`
);

const child = spawn('next', ['dev', ...(useWebpack ? ['--webpack'] : [])], {
  stdio: 'inherit',
  shell: true, // resolves the next.cmd shim on Windows; harmless elsewhere
});

child.on('exit', code => process.exit(code ?? 0));

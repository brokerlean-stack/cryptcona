// Run the prebuilt app locally without per-page development compilation.
const { spawn } = require('node:child_process');
require('@next/env').loadEnvConfig(process.cwd(), false);
const child = spawn(process.execPath, ['.next/standalone/server.js'], {
  stdio: 'inherit', windowsHide: true,
  env: { ...process.env, NODE_ENV:'production', PORT:'3100', HOSTNAME:'0.0.0.0', NEXTAUTH_URL:'http://localhost:3100' },
});
child.on('exit', code => { process.exitCode = code || 0; });
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));

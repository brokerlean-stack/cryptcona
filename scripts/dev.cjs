const { spawn } = require('node:child_process');
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', '-p', '3100'], {
  stdio: 'inherit',
  windowsHide: true,
  env: { ...process.env, NEXTAUTH_URL: 'http://localhost:3100' },
});
child.on('exit', code => { process.exitCode = code || 0; });
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));

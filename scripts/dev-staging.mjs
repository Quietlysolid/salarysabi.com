import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
const config = JSON.parse(readFileSync(new URL('../supabase/.temp/staging-public.json', import.meta.url), 'utf8'));
if (config.url !== 'https://vcgqxlbhsbilxlkratbw.supabase.co') throw new Error('Staging project mismatch');
const port = process.env.STAGING_PORT || '3001';
if (!['3001','3002'].includes(port)) throw new Error('Use staging port 3001 or 3002');
const command = process.argv.includes('--build') ? ['build'] : process.argv.includes('--start') ? ['start', '-p', port] : ['dev', '--webpack', '-p', port];
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', ...command], {
  stdio: 'inherit',
  env: { ...process.env, SALARYSABI_STAGING: '1', NEXT_PUBLIC_SUPABASE_URL: config.url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: config.key, NEXT_PUBLIC_SITE_URL: `http://localhost:${port}`,
    PUBLIC_SITE_URL: `http://localhost:${port}` },
});
child.on('exit', code => { process.exitCode = code ?? 1; });

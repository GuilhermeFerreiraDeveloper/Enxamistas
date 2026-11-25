const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const services = [
  { name: 'API', args: ['run', 'dev', '--workspace=@enxamistas/api'], color: '\x1b[33m' },
  { name: 'WEB', args: ['run', 'dev', '--workspace=@enxamistas/web'], color: '\x1b[36m' },
];

const children = [];
const reset = '\x1b[0m';

for (const svc of services) {
  const child = spawn(npmCmd, svc.args, {
    cwd: path.resolve(__dirname, '..'),
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: isWin,
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      console.log(`${svc.color}[${svc.name}]${reset} ${line}`);
    }
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      console.error(`${svc.color}[${svc.name}]${reset} ${line}`);
    }
  });

  child.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`${svc.color}[${svc.name}]${reset} exited with code ${code}`);
    }
  });

  children.push(child);
}

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

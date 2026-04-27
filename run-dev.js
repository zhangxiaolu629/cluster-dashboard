const { execSync } = require('child_process');

// 直接执行 Next.js 开发服务器
const command = 'node "' + __dirname + '/node_modules/next/dist/bin/next" dev -p 3001';

console.log('Starting Next.js dev server...');
console.log('Command:', command);

try {
  // 使用 spawn 来保持进程运行
  const { spawn } = require('child_process');
  const child = spawn('node', [__dirname + '/node_modules/next/dist/bin/next', 'dev', '-p', '3001'], {
    stdio: 'inherit',
    cwd: __dirname
  });

  child.on('exit', (code) => {
    console.log(`Next.js dev server exited with code ${code}`);
  });

} catch (error) {
  console.error('Error starting dev server:', error);
}

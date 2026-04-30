import { spawn } from "node:child_process";

// 直接调用 next dev 命令
const child = spawn(process.execPath, ["./node_modules/next/dist/bin/next", "dev", "-p", "3001"], {
  stdio: "inherit",
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: "development",
  },
});

child.on("exit", (code) => {
  console.log(`Next.js dev server exited with code ${code}`);
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("Failed to start Next.js dev server:", error);
  process.exit(1);
});

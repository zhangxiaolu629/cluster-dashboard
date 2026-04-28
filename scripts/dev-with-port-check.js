const { execSync, spawn } = require("node:child_process");
const { copyFileSync, existsSync } = require("node:fs");

function ensureLightningcssBinary() {
  const target = "./node_modules/lightningcss/lightningcss.win32-x64-msvc.node";
  const source = "./node_modules/lightningcss-win32-x64-msvc/lightningcss.win32-x64-msvc.node";

  if (existsSync(target)) {
    return;
  }

  if (!existsSync(source)) {
    console.warn("[dev] 未找到 lightningcss windows 二进制，跳过修复");
    return;
  }

  copyFileSync(source, target);
  console.log("[dev] 已修复 lightningcss 本地二进制");
}

function getPidsOnPort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    });

    const lines = output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && line.includes("LISTENING"));

    const pids = new Set();

    for (const line of lines) {
      const parts = line.split(/\s+/);
      const pid = parts[parts.length - 1];
      if (/^\d+$/.test(pid)) {
        pids.add(pid);
      }
    }

    return [...pids];
  } catch {
    return [];
  }
}

function killPid(pid) {
  try {
    execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
    console.log(`[dev] 已结束占用进程 PID=${pid}`);
  } catch {
    console.warn(`[dev] 结束进程失败 PID=${pid}，继续尝试启动`);
  }
}

function startDevServer() {
  const child = spawn(
    process.execPath,
    ["./node_modules/next/dist/bin/next", "dev", "-p", "3001"],
    { stdio: "inherit", shell: false }
  );

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

const pids = getPidsOnPort(3001);
if (pids.length > 0) {
  console.log(`[dev] 检测到 3001 端口占用，准备清理 (${pids.join(", ")})`);
  for (const pid of pids) {
    killPid(pid);
  }
} else {
  console.log("[dev] 3001 端口空闲");
}

ensureLightningcssBinary();
startDevServer();

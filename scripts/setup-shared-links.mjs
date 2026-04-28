import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const sharedRulesDir = path.join(repoRoot, ".shared", "rules");

const linkTargets = [
  path.join(repoRoot, ".cursor", "rules"),
  path.join(repoRoot, ".trae", "rules"),
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function pointsToTarget(linkPath, targetPath) {
  try {
    const resolved = fs.realpathSync(linkPath);
    const targetResolved = fs.realpathSync(targetPath);
    return resolved === targetResolved;
  } catch {
    return false;
  }
}

function backupExisting(linkPath) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${linkPath}.bak-${stamp}`;
  fs.renameSync(linkPath, backupPath);
  console.warn(`[shared-links] 已备份已有目录/文件: ${linkPath} -> ${backupPath}`);
}

function createLink(linkPath, targetPath) {
  const parent = path.dirname(linkPath);
  ensureDir(parent);

  if (fs.existsSync(linkPath)) {
    if (pointsToTarget(linkPath, targetPath)) {
      console.log(`[shared-links] 已存在正确链接: ${linkPath}`);
      return;
    }
    backupExisting(linkPath);
  }

  const relativeTarget = path.relative(parent, targetPath);
  if (process.platform === "win32") {
    fs.symlinkSync(relativeTarget, linkPath, "junction");
  } else {
    fs.symlinkSync(relativeTarget, linkPath, "dir");
  }
  console.log(`[shared-links] 已创建链接: ${linkPath} -> ${relativeTarget}`);
}

function main() {
  ensureDir(sharedRulesDir);
  for (const linkPath of linkTargets) {
    createLink(linkPath, sharedRulesDir);
  }
}

main();

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const exec = promisify(execFile);

export async function createPostgresBackup(outputDir = process.env.BACKUP_DIR || "./backups") {
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.resolve(outputDir, `magstock-${stamp}.sql`);
  const url = new URL(process.env.DATABASE_URL || "postgresql://magstock:magstock@localhost:5432/magstock");
  const args = ["-h", url.hostname, "-p", String(url.port || 5432), "-U", decodeURIComponent(url.username), "-d", decodeURIComponent(url.pathname.slice(1)), "-f", file];
  const env = { ...process.env, PGPASSWORD: decodeURIComponent(url.password) };
  await exec("pg_dump", args, { env });
  return file;
}

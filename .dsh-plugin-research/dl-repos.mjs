import { writeFileSync, mkdirSync } from "node:fs";
const repos = [
  ["xiaobright", "dsh-anchored-standard", "main"],
  ["delightedMaster", "dsh-anchored-standard-windows", "main"],
  ["Jungod1121", "dsh-anchored-standard", "main"]
];
for (const [owner, repo, ref] of repos) {
  const url = `https://codeload.github.com/${owner}/${repo}/tar.gz/refs/heads/${ref}`;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 30000);
    const r = await fetch(url, { signal: ctl.signal });
    clearTimeout(t);
    const buf = Buffer.from(await r.arrayBuffer());
    const out = `E:/ai-wardrobe-agent/.dsh-plugin-research/${owner}-${repo}.tar.gz`;
    writeFileSync(out, buf);
    console.log(owner + "/" + repo, "=>", r.status, buf.length, "bytes ->", out);
  } catch (e) {
    console.log(owner + "/" + repo, "=> FAILED:", e.cause?.code || e.message);
  }
}

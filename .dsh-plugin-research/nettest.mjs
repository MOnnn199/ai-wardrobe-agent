const urls = [
  "https://registry.npmjs.org/dsh-browser",
  "https://raw.githubusercontent.com/xiaobright/dsh-anchored-standard/main/README.md",
  "https://github.com/xiaobright/dsh-anchored-standard",
  "https://codeload.github.com/xiaobright/dsh-anchored-standard/tar.gz/refs/heads/main"
];
for (const u of urls) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 15000);
    const r = await fetch(u, { signal: ctl.signal, redirect: "follow" });
    clearTimeout(t);
    const text = await r.text();
    console.log(u, "=>", r.status, "len=" + text.length, "head=" + text.slice(0, 100).replace(/\n/g, " "));
  } catch (e) {
    console.log(u, "=> FAILED:", e.cause?.code || e.message);
  }
}

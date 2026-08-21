// 搜索 modelscope 上的 yolov8 / clip 模型
const search = async (q) => {
  const u = `https://www.modelscope.cn/api/v1/dolphin/models?PageNumber=1&PageSize=10&Search=${encodeURIComponent(q)}`;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 20000);
    const r = await fetch(u, { signal: ctl.signal, redirect: "follow", headers: { "accept": "application/json" } });
    clearTimeout(t);
    const txt = await r.text();
    console.log("== search", q, "=>", r.status);
    if (r.ok) {
      try {
        const j = JSON.parse(txt);
        const models = j?.Data?.Model?.Models || j?.Data?.Models || j?.models || [];
        for (const m of models.slice(0, 10)) {
          console.log("  -", m.Path || m.ModelId || m.id, "|", (m.Name || "").slice(0, 40));
        }
        if (!models.length) console.log("  (raw head)", txt.slice(0, 300));
      } catch { console.log("  (raw)", txt.slice(0, 300)); }
    } else {
      console.log("  (raw)", txt.slice(0, 300));
    }
  } catch (e) {
    console.log("== search", q, "=> FAILED:", e.cause?.code || e.message);
  }
};
await search("yolov8");
await search("clip");

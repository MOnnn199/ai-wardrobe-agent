// 测试模型权重下载通道：yolov8n.pt（hf-mirror）与 CLIP 模型（modelscope 目录探测）。
const urls = [
  "https://hf-mirror.com/Ultralytics/YOLOv8/resolve/main/yolov8n.pt",
  "https://hf-mirror.com/sentence-transformers/clip-ViT-B-32/resolve/main/config.json",
  "https://huggingface.co/sentence-transformers/clip-ViT-B-32/resolve/main/config.json",
  "https://www.modelscope.cn/models/AI-ModelScope/clip-ViT-B-32/resolve/main/config.json"
];
for (const u of urls) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 20000);
    const r = await fetch(u, { signal: ctl.signal, redirect: "follow" });
    clearTimeout(t);
    const buf = await r.arrayBuffer();
    console.log(u, "=>", r.status, buf.byteLength, "bytes");
  } catch (e) {
    console.log(u, "=> FAILED:", e.cause?.code || e.message);
  }
}

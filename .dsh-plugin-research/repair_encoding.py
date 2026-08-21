"""修复被 PowerShell 5.1 GBK 读写损坏的 UTF-8 文件。

损坏过程：PS 5.1 用默认 ANSI(GBK) 读了 UTF-8 文件，再用 utf8 写回。
修复：UTF-8 解码当前文件 → 去掉我追加的样式段 → 按 GB18030 回编（U+FFFD 处补 '?'）
→ 把 '?/' 字节序列还原为 '</'（损坏点正是「中文末字节 + <」被 GBK 解码吞掉的位置）。
"""
import sys

path = sys.argv[1]
raw = open(path, "rb").read()
s = raw.decode("utf-8", errors="replace")

# 1) 去掉本次会话追加的样式段（唯一标记），恢复原来的 </style> 结尾
MARKER = "/* ===== P1: 场景快捷推荐 ====="
idx = s.find(MARKER)
if idx != -1:
    s = s[:idx].rstrip() + "\n</style>\n"
    print("styles block stripped")
else:
    print("marker not found — nothing to strip")

# 2) GB18030 回编；U+FFFD → 0x3F('?')
out = bytearray()
for ch in s:
    if ch == "\ufffd":
        out += b"?"
    else:
        try:
            out += ch.encode("gb18030")
        except Exception:
            out += b"?"

# 3) 字节级修复：'?/' -> '</'（损坏点）
fixed = out.replace(b"?/", b"</")

# 4) 校验
t = fixed.decode("utf-8", errors="replace")
print("remaining U+FFFD:", t.count("\ufffd"))
print("remaining ascii '?':", t.count("?"))
print("has 换一套:", "换一套" in t)
print("has wb-single:", "wb-single" in t)
print("has 穿搭回顾:", "穿搭回顾" in t)

out_path = path + ".repaired"
open(out_path, "wb").write(fixed)
print("written:", out_path, len(fixed), "bytes")

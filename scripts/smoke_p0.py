"""P0 改动冒烟测试（针对 8001 新实例）：
1. 登录 user/stylist/admin 拿 token
2. 权限：user 访问 stylist/config → 403；stylist 访问 stylist → 200；admin 访问 config → 200
3. 衣橱 CRUD（真实 DB）
4. get_wardrobe 工具直接调用（真实数据，不依赖 LLM）
5. 上传接口无 token → 401
"""
import json
import os
import sys
import httpx

# 让脚本能 import backend 的 app 包（无论从哪个目录运行）
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

BASE = "http://127.0.0.1:8001"
c = httpx.Client(base_url=BASE, timeout=30)
fails = []


def check(name, cond, extra=""):
    tag = "PASS" if cond else "FAIL"
    print(f"[{tag}] {name} {extra}")
    if not cond:
        fails.append(name)


def login(username, password):
    r = c.post("/api/auth/login", json={"username": username, "password": password})
    check(f"login {username}", r.status_code == 200, f"({r.status_code})")
    return r.json().get("token", "") if r.status_code == 200 else ""


user_tok = login("user", "123456")
stylist_tok = login("stylist", "123456")
admin_tok = login("admin", "123456")

h_user = {"Authorization": f"Bearer {user_tok}"}
h_stylist = {"Authorization": f"Bearer {stylist_tok}"}
h_admin = {"Authorization": f"Bearer {admin_tok}"}

# 2. 权限
r = c.get("/api/stylist/stats", headers=h_user)
check("user -> /stylist/stats 403", r.status_code == 403, f"({r.status_code})")
r = c.get("/api/config/prompts", headers=h_user)
check("user -> /config/prompts 403", r.status_code == 403, f"({r.status_code})")
r = c.get("/api/stylist/stats", headers=h_stylist)
check("stylist -> /stylist/stats 200", r.status_code == 200, f"({r.status_code})")
r = c.get("/api/config/prompts", headers=h_admin)
check("admin -> /config/prompts 200", r.status_code == 200, f"({r.status_code})")
r = c.get("/api/config/prompts", headers=h_stylist)
check("stylist -> /config/prompts 403", r.status_code == 403, f"({r.status_code})")

# 3. 衣橱 CRUD
r = c.get("/api/user/wardrobe", headers=h_user)
check("wardrobe list", r.status_code == 200, f"({r.status_code}) count={len(r.json()) if r.status_code == 200 else '?'}")
first = None
if r.status_code == 200 and r.json():
    first = r.json()[0]
    print("   first item:", first.get("name"), first.get("category"), "material=", first.get("material"), "pattern=", first.get("pattern"))

# 3b. 新增一件带 material/pattern 的衣物，再删除
r = c.post("/api/user/wardrobe", headers=h_user, json={
    "name": "冒烟测试衬衫", "category": "top", "color": "白", "style": "休闲",
    "material": "棉", "pattern": "条纹", "season": "春夏", "occasion": "休闲"})
check("create item with material/pattern", r.status_code == 200, f"({r.status_code})")
if r.status_code == 200:
    new_id = r.json().get("id")
    got = r.json().get("material"), r.json().get("pattern")
    check("material/pattern persisted", got == ("棉", "条纹"), f"got={got}")
    r = c.delete(f"/api/user/wardrobe/{new_id}", headers=h_user)
    check("delete test item", r.status_code == 200, f"({r.status_code})")

# 4. get_wardrobe 工具直接调用（绕过 LLM，验证真实 DB 读取）
from app.agent.tools.wardrobe import WardrobeTool
from app.models import SessionLocal
from app.models.user import User
db = SessionLocal()
u = db.query(User).filter(User.username == "user").first()
db.close()
out = WardrobeTool().execute({"user_id": u.id})
data = json.loads(out)
check("wardrobe tool real DB", data.get("total", 0) >= 1 and "error" not in data,
      f"total={data.get('total')}")

# 5. 上传接口无 token → 401
files = {"file": ("test.jpg", b"fakeimagebytes", "image/jpeg")}
r = c.post("/api/user/wardrobe/upload-image", files=files)
check("upload-image no token 401", r.status_code == 401, f"({r.status_code})")
r = c.post("/api/user/analyze-image", files=files)
check("analyze-image no token 401", r.status_code == 401, f"({r.status_code})")

print()
if fails:
    print("FAILED:", fails)
    sys.exit(1)
print("ALL SMOKE TESTS PASSED")

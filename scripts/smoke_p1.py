"""P1 功能冒烟测试（针对 8001）：
场景推荐 / 套装 / 日程 / 采纳+穿搭日志 / 个人设置 / 用户管理 / 单品纠错 / 仪表盘 / 内容审核列表。
"""
import os
import sys
import json

import httpx

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

BASE = "http://127.0.0.1:8001"
c = httpx.Client(base_url=BASE, timeout=120)
fails = []


def check(name, cond, extra=""):
    tag = "PASS" if cond else "FAIL"
    print(f"[{tag}] {name} {extra}")
    if not cond:
        fails.append(name)


def login(username, password):
    r = c.post("/api/auth/login", json={"username": username, "password": password})
    return r.json().get("token", "") if r.status_code == 200 else ""


user_tok = login("user", "123456")
stylist_tok = login("stylist", "123456")
admin_tok = login("admin", "123456")
h_user = {"Authorization": f"Bearer {user_tok}"}
h_stylist = {"Authorization": f"Bearer {stylist_tok}"}
h_admin = {"Authorization": f"Bearer {admin_tok}"}

# 1. 场景
r = c.get("/api/user/scenes", headers=h_user)
check("scenes list", r.status_code == 200 and len(r.json()) >= 6, f"({r.status_code}) count={len(r.json()) if r.status_code==200 else '?'}")

r = c.post("/api/user/quick-recommend", headers=h_user, json={"scene": "commute"})
ok = r.status_code == 200 and (r.json().get("recommendation") or "").strip()
check("quick-recommend commute", ok, f"({r.status_code}) len={len(r.json().get('recommendation','')) if r.status_code==200 else 0}")

# 2. 套装
r = c.post("/api/user/outfits", headers=h_user, json={"name": "通勤套装", "item_ids": [1, 2], "description": "测试"})
check("create outfit", r.status_code == 200, f"({r.status_code})")
outfit_id = r.json().get("id") if r.status_code == 200 else None
r = c.get("/api/user/outfits", headers=h_user)
check("list outfits", r.status_code == 200 and len(r.json()) >= 1, f"({r.status_code})")
if outfit_id:
    r = c.put(f"/api/user/outfits/{outfit_id}", headers=h_user, json={"name": "通勤套装V2"})
    check("update outfit", r.status_code == 200, f"({r.status_code})")
    r = c.delete(f"/api/user/outfits/{outfit_id}", headers=h_user)
    check("delete outfit", r.status_code == 200, f"({r.status_code})")

# 3. 日程
r = c.post("/api/user/calendar", headers=h_user, json={"title": "临时会议", "event_date": "2026-08-20", "occasion": "正式", "remind": 1})
check("create calendar event", r.status_code == 200, f"({r.status_code})")
ev_id = r.json().get("id") if r.status_code == 200 else None
r = c.get("/api/user/calendar", headers=h_user)
check("list calendar", r.status_code == 200 and len(r.json()) >= 1, f"({r.status_code})")
if ev_id:
    r = c.delete(f"/api/user/calendar/{ev_id}", headers=h_user)
    check("delete calendar event", r.status_code == 200, f"({r.status_code})")

# 4. 采纳 + 穿搭日志
r = c.post("/api/user/outfits/adopt", headers=h_user, json={"item_ids": [1, 2], "source": "scene", "scene": "通勤", "reason": "测试采纳"})
check("adopt outfit", r.status_code == 200, f"({r.status_code})")
r = c.get("/api/user/adoptions", headers=h_user)
check("list adoptions", r.status_code == 200 and len(r.json()) >= 1, f"({r.status_code})")
r = c.get("/api/user/wear-diary", headers=h_user)
check("wear-diary", r.status_code == 200 and "stats" in r.json(), f"({r.status_code})")

# 5. 个人设置
r = c.put("/api/user/profile", headers=h_user, json={"city": "上海", "lat": 31.23, "lon": 121.47})
check("update profile", r.status_code == 200, f"({r.status_code})")
r = c.get("/api/user/profile", headers=h_user)
check("get profile", r.status_code == 200 and r.json().get("city") == "上海", f"({r.status_code}) city={r.json().get('city') if r.status_code==200 else '?'}")

# 6. 管理端（admin only）
r = c.get("/api/admin/users", headers=h_stylist)
check("stylist -> admin/users 403", r.status_code == 403, f"({r.status_code})")
r = c.get("/api/admin/users", headers=h_admin)
check("admin users list", r.status_code == 200 and "users" in r.json(), f"({r.status_code})")
r = c.get("/api/admin/dashboard", headers=h_admin)
check("admin dashboard", r.status_code == 200 and "adoption_rate" in r.json(), f"({r.status_code})")
if r.status_code == 200:
    print("   dashboard:", {k: r.json()[k] for k in ("total_users", "total_recommendations", "total_adoptions", "adoption_rate")})

# 7. 单品纠错
r = c.post("/api/stylist/item-corrections", headers=h_stylist, json={"item_id": 1, "error_fields": ["color"], "correct_attrs": {"color": "米白"}, "note": "测试"})
check("create item correction", r.status_code == 200, f"({r.status_code})")
corr_id = r.json().get("id") if r.status_code == 200 else None
if corr_id:
    r = c.post(f"/api/stylist/item-corrections/{corr_id}/apply", headers=h_stylist)
    check("apply item correction", r.status_code == 200, f"({r.status_code})")
r = c.get("/api/stylist/item-corrections", headers=h_stylist)
check("list item corrections", r.status_code == 200, f"({r.status_code})")

# 8. 内容审核列表（可能有 pending 记录）
r = c.get("/api/stylist/moderation", headers=h_stylist)
check("moderation list", r.status_code == 200, f"({r.status_code})")

# 9. 相似款检索工具（直接调用，验证 CLIP 向量通路）
from app.agent.tools.similar_clothes import SimilarClothesTool
out = SimilarClothesTool().execute({"user_id": 1, "query": "白色上衣"})
data = json.loads(out)
check("similar clothes tool", "items" in data, f"items={len(data.get('items', []))}")

print()
if fails:
    print("FAILED:", fails)
    sys.exit(1)
print("ALL P1 SMOKE TESTS PASSED")

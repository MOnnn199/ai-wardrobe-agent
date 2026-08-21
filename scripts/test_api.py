import httpx
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = "http://localhost:8000"

# 登录获取 token（后端所有 /user 接口都要求 Bearer 鉴权）
r = httpx.post(BASE + "/api/auth/login", json={"username": "user", "password": "123456"}, timeout=30)
assert r.status_code == 200, f"登录失败: {r.status_code} {r.text[:200]}"
headers = {"Authorization": "Bearer " + r.json()["token"]}


# Add items
r = httpx.post(BASE + "/api/user/wardrobe",
    json={"name":"白衬衫","category":"top","color":"白色","style":"商务","season":"春夏"}, headers=headers)
print("Add 1:", r.status_code, r.json().get("name"))

r = httpx.post(BASE + "/api/user/wardrobe",
    json={"name":"深蓝牛仔裤","category":"bottom","color":"深蓝","style":"休闲","season":"四季"}, headers=headers)
print("Add 2:", r.status_code, r.json().get("name"))

r = httpx.post(BASE + "/api/user/wardrobe",
    json={"name":"黑色皮鞋","category":"shoes","color":"黑色","style":"商务","season":"四季","image_url":"/uploads/wardrobe/shoe.jpg"}, headers=headers)
print("Add 3:", r.status_code, r.json().get("name"))

# List wardrobe
r = httpx.get(BASE + "/api/user/wardrobe", headers=headers)
items = r.json()
print("\n衣橱:", len(items), "件")
for i in items:
    print(f"  [{i['category']}] {i['name']} ({i['color']})")

# Test wardrobe analysis
r = httpx.get(BASE + "/api/user/wardrobe-analysis", headers=headers)
a = r.json()
print(f"\n衣橱分析: {a['total_items']}件, 闲置: {len(a.get('unused_items',[]))}件")
print(f"建议: {a['suggestions']}")

# Test today outfit
r = httpx.get(BASE + "/api/user/today-outfit", headers=headers, timeout=180)
print(f"\n今日推荐: {r.json()['recommendation'][:100]}...")

print("\n=== ALL TESTS PASSED ===")

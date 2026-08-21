import os
files = [
    r"E:\ai-wardrobe-agent\backend\app\services\ab_test.py",
    r"E:\ai-wardrobe-agent\backend\app\services\scheduled.py",
]
for path in files:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    fixed = content.replace("\\\"", "\"")
    if fixed != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(fixed)
        print("Fixed:", path)
    else:
        print("OK:", path)
print("Done")
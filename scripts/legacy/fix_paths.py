import os

path = r'E:\ai-wardrobe-agent\backend\app\api\user.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

base_dir = r"os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'uploads')"

# Replace the upload-and-tag function's upload_dir
content = content.replace(
    "upload_dir = 'uploads/wardrobe'",
    f"upload_dir = {base_dir}"
)

# Replace the analyze-image function's upload_dir  
content = content.replace(
    "upload_dir = 'uploads/temp'",
    f"upload_dir = os.path.join({base_dir}, 'temp')"
)

# Replace the original upload-image function's upload_dir
content = content.replace(
    "upload_dir = 'uploads/wardrobe'",
    f"upload_dir = {base_dir}"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Paths fixed')
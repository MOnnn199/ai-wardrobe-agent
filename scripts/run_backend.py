import sys, os
sys.path.insert(0, r'E:\ai-wardrobe-agent\backend')
os.chdir(r'E:\ai-wardrobe-agent\backend')
import uvicorn
uvicorn.run('app.main:app', host='0.0.0.0', port=8000)

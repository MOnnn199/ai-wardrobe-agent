# ====== AI Wardrobe - Web Console Launcher ======
$ErrorActionPreference = "Stop"
$dir = "E:\ai-wardrobe-agent\frontend-web"
Set-Location $dir

# 1. Free port 5175
$conns = Get-NetTCPConnection -LocalPort 5175 -State Listen -ErrorAction SilentlyContinue
foreach ($c in $conns) {
  Write-Host ("Killing PID " + $c.OwningProcess + " on 5175...")
  Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1

# 2. Write index.html (needed by vite; was deleted by sandbox)
$html = '<!DOCTYPE html>' + "`n" +
'<html lang="zh-CN">' + "`n" +
'  <head>' + "`n" +
'    <meta charset="UTF-8" />' + "`n" +
'    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;utf8,<svg xmlns=''http://www.w3.org/2000/svg'' viewBox=''0 0 100 100''><circle cx=''50'' cy=''50'' r=''45'' fill=''%237aa8ff''/><text x=''50'' y=''66'' text-anchor=''middle'' font-size=''52'' fill=''white'' font-family=''sans-serif'' font-weight=''700''>A</text></svg>" />' + "`n" +
'    <meta name="viewport" content="width=device-width, initial-scale=1.0" />' + "`n" +
'    <title>AI Wardrobe Console</title>' + "`n" +
'  </head>' + "`n" +
'  <body>' + "`n" +
'    <div id="app"></div>' + "`n" +
'    <script type="module" src="/src/main.js"></script>' + "`n" +
'  </body>' + "`n" +
'</html>' + "`n"
[System.IO.File]::WriteAllText(($dir + '\index.html'), $html, (New-Object System.Text.UTF8Encoding $false))
$size = (Get-Item ($dir + '\index.html')).Length
Write-Host ("index.html: " + $size + " bytes")

# 3. Start vite (keep this window open)
Write-Host "Starting vite..." -ForegroundColor Yellow
npm run dev
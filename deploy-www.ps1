# 部署 strapi-site Next.js 静态产物（out/）到服务器 www.joho.cn 站点
param(
  [string]$Local = "E:\code\strapi-site\out",
  [string]$HostName = "joho",
  [string]$RemoteSite = "/opt/1panel/apps/openresty/openresty/www/sites/www.joho.cn"
)
$ErrorActionPreference = "Stop"

$RemoteIndex = "$RemoteSite/index"
$TmpTar = Join-Path $env:TEMP "www_site_out.tar.gz"

if (-not (Test-Path "$Local\index.html")) {
  throw "本地产物缺失: $Local\index.html"
}
Write-Host "[1/6] 本地产物 OK: $Local"

Write-Host "[2/6] 打包产物..."
tar -czf $TmpTar -C $Local .

Write-Host "[3/6] 备份远程站点..."
ssh $HostName "sudo rm -rf $RemoteSite/index_backup && sudo cp -a $RemoteIndex $RemoteSite/index_backup"

Write-Host "[4/6] 上传 tar 包..."
scp -- $TmpTar "${HostName}:/tmp/www_site_out.tar.gz"

Write-Host "[5/6] 解包替换站点内容..."
ssh $HostName "sudo rm -rf $RemoteIndex/* && sudo tar -xzf /tmp/www_site_out.tar.gz -C $RemoteIndex && sudo rm -f /tmp/www_site_out.tar.gz"

Write-Host "[6/6] 校验..."
$check = ssh $HostName "ls $RemoteIndex/index.html $RemoteIndex/_next >/dev/null && echo SYNC_OK || echo SYNC_FAIL"
Write-Host $check
Remove-Item $TmpTar -Force
if ($check -notmatch "SYNC_OK") { throw "部署校验失败" }
Write-Host "部署完成: www.joho.cn"

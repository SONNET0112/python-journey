$desktop = [Environment]::GetFolderPath('Desktop')
$lnk = Join-Path $desktop 'Python Journey.lnk'
$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut($lnk)
$sc.TargetPath = 'C:\Users\ASUS\python-journey\start-python-journey.bat'
$sc.WorkingDirectory = 'C:\Users\ASUS\python-journey'
$sc.Description = 'Python Journey 学习成长花园（本地）'
$sc.WindowStyle = 1
$sc.Save()
Write-Output ("created: " + $lnk)
Write-Output ("target: " + $ws.CreateShortcut($lnk).TargetPath)
Write-Output ("workdir: " + $ws.CreateShortcut($lnk).WorkingDirectory)

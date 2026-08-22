<#
Sinh resource-monitor/hardware-report.md - bang spec may + hostname (muc 6, muc 11).

muc 11 doi hostname trong bao cao nay phai KHOP voi cac bai truoc cua sinh vien.
May nay: Pham_Vu_Ngoc_Duy (khop HW02/HW04).

Cach goi:  npm run hardware
#>

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$out  = Join-Path $repo "resource-monitor\hardware-report.md"

Write-Host "Dang thu thap thong tin phan cung..."

$os   = Get-CimInstance Win32_OperatingSystem
$cs   = Get-CimInstance Win32_ComputerSystem
$cpu  = @(Get-CimInstance Win32_Processor)[0]
$disk = @(Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='D:'")
if (-not $disk) { $disk = @(Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3")[0] } else { $disk = $disk[0] }

function Get-Ver($exe, $argList, $pattern) {
    try {
        $raw = & $exe $argList 2>&1 | Out-String
        if ($raw -match $pattern) { return $Matches[0] }
        return ($raw -split "`n")[0].Trim()
    } catch { return "khong xac dinh duoc" }
}

# `java -version` ghi ra STDERR chu khong phai stdout -> phai gop 2>&1 truoc khi doc
$javaVer = "khong xac dinh duoc"
try {
    # java -version ghi ra stderr; voi $ErrorActionPreference="Stop" thi PowerShell coi
    # do la loi ket thuc va nhay thang vao catch -> phai ha xuong Continue trong pham vi nay
    $ErrorActionPreference = "Continue"
    $raw = (& java -version 2>&1 | Out-String)
    if ($raw -match '"(\d+[^"]*)"') { $javaVer = $Matches[1] }
    elseif ($raw -match '\d+\.\d+\.\d+') { $javaVer = $Matches[0] }
} catch { } finally { $ErrorActionPreference = "Stop" }
$nodeVer  = Get-Ver "node" @("-v") 'v\d+\.\d+\.\d+'
$jmeterBin = if ($env:JMETER_BIN) { $env:JMETER_BIN } else { "D:\jmeter\apache-jmeter-5.6.3\bin\jmeter.bat" }
$jmeterVer = "khong xac dinh duoc"
try {
    $raw = & $jmeterBin "--version" 2>&1 | Out-String
    if ($raw -match '\d+\.\d+\.\d+') { $jmeterVer = $Matches[0] }
} catch { }

$ramGb   = [math]::Round($cs.TotalPhysicalMemory / 1GB, 1)
$diskGb  = [math]::Round($disk.Size / 1GB, 1)
$freeGb  = [math]::Round($disk.FreeSpace / 1GB, 1)
$now     = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# QUAN TRONG: $env:COMPUTERNAME tra ve ten NetBIOS, bi CAT CON 15 KY TU.
# Ten that "Pham_Vu_Ngoc_Duy" (16 ky tu) se thanh "PHAM_VU_NGOC_DU" -> nhin nhu
# hostname KHONG KHOP voi cac HW truoc, trong khi muc 11 kiem dung cho nay.
# Dung Dns.GetHostName() de lay ten day du, dung nguyen dang chu hoa/thuong.
$hostFull    = [System.Net.Dns]::GetHostName()
$hostNetbios = $env:COMPUTERNAME

$md = @"
# Hardware Report - 23127183

> Sinh tu dong bang ``npm run hardware`` (``tools/hardware-report.ps1``).
> Anh dxdiag: ``screenshots/hardware-dxdiag.png`` - xem ``docs/HUONG-DAN-VIEC-TU-LAM.md`` muc A.
> muc 11: hostname phai **khop voi cac HW truoc** cua sinh vien.

| Muc | Gia tri |
|---|---|
| **Hostname** | ``$hostFull`` |
| Ten NetBIOS (bi cat 15 ky tu) | ``$hostNetbios`` |
| User | ``$($env:USERNAME)`` |
| OS | $($os.Caption) - build $($os.BuildNumber), $($os.OSArchitecture) |
| CPU | $($cpu.Name.Trim()) |
| So loi | **$($cpu.NumberOfCores) loi vat ly / $($cpu.NumberOfLogicalProcessors) loi logic** |
| Xung co ban | $($cpu.MaxClockSpeed) MHz |
| RAM | **$ramGb GB** |
| O dia chua SUT | $($disk.DeviceID) - $diskGb GB tong, $freeGb GB trong |
| Java | $javaVer |
| JMeter | $jmeterVer |
| Node | $nodeVer |
| Ngay sinh bao cao | $now |

## Gioi han bat buoc phai cong bo

**Load generator (JMeter) va SUT (backend Node) chay tren CUNG may nay.** Moi so do vi the
bao gom ca chi phi sinh tai. CPU dinh cua ``java.exe`` so voi ``node.exe`` o tung luot duoc ghi
trong ``results/resources/*.resources.csv`` va doi chieu o ``report/main-report.md`` muc 6.

**Cach doc cot ``cpu_percent_of_one_core``:** 100 = bao hoa **mot loi**. May nay co
$($cpu.NumberOfLogicalProcessors) loi logic nen tran ly thuyet la $($cpu.NumberOfLogicalProcessors * 100).
Node chay JavaScript tren mot luong nen cham ~100 la da bao hoa, du may con loi ranh.

## Anh

![dxdiag](screenshots/hardware-dxdiag.png)
"@

$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($out, $md, $enc)

Write-Host "[OK] Da ghi $out"
Write-Host ""
Write-Host "  Hostname : $hostFull   (NetBIOS: $hostNetbios)"
Write-Host "  CPU      : $($cpu.Name.Trim())"
Write-Host "  Loi      : $($cpu.NumberOfCores) vat ly / $($cpu.NumberOfLogicalProcessors) logic"
Write-Host "  RAM      : $ramGb GB"
Write-Host ""
Write-Host "  NHO: con phai chup anh dxdiag thu cong -> screenshots/hardware-dxdiag.png"

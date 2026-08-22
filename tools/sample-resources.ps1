<#
Lay mau CPU/RAM cua tien trinh SUT (node) va load generator (java) trong luc chay luot do.

Anh Task Manager chi la MOT khoanh khac. File nay cho chuoi so theo thoi gian de:
  - doi chieu voi anh chup (so trong anh phai nam trong day so nay)
  - tra loi cau hoi "load generator co phai diem nghen khong" (CPU java vs CPU node)
  - do do troi RSS cho luot Soak (docs/08)

CACH TINH CPU — doc ky truoc khi sua:
  Dung hieu cua (Get-Process).CPU (tong GIAY CPU tien trinh da dung) giua hai lan lay mau,
  chia cho so giay troi qua, nhan 100.
  => cpu_percent_of_one_core = 100 nghia la bao hoa MOT LOI.
     May nay 8 loi logic nen tran ly thuyet la 800.
     Node chay JS single-thread nen cham ~100 la da bao hoa, du may con 7 loi ranh.

  KHONG dung Get-Counter '\Process(node)\% Processor Time': ten instance doi khi co nhieu
  tien trinh cung ten (node, node#1, node#2) va se ghi nham tien trinh.

Cach goi:
  powershell -ExecutionPolicy Bypass -File tools/sample-resources.ps1 `
      -OutFile results/resources/23127183_Load_20260822-101500.resources.csv -IntervalSec 2
#>

param(
    [Parameter(Mandatory = $true)][string]$OutFile,
    [int]$IntervalSec = 2,
    [string[]]$ProcessNames = @("node", "java")
)

$dir = Split-Path -Parent $OutFile
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }

# Ghi bang StreamWriter mo MOT LAN, encoding UTF8 KHONG BOM.
# Vi sao khong dung Out-File/Add-Content: tren Windows PowerShell 5.1, `-Encoding utf8`
# them BOM vao dau file, lam awk/Node doc cot dau tien bi dinh ky tu la.
$OutFileAbs = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutFile)

# Chan chay TRUNG instance: hai sampler cung ghi mot file se vua truncate vua append
# len nhau -> file mat header va lan lon dong. (Da xay ra that trong luc dung script nay.)
$mutexName = "Global\HW05SampleResources_" + ($OutFileAbs -replace '[^A-Za-z0-9]', '_')
$mutex = New-Object System.Threading.Mutex($false, $mutexName)
if (-not $mutex.WaitOne(0)) {
    Write-Error "Da co mot sampler khac dang ghi vao '$OutFile'. Dung instance cu truoc khi chay lai."
    exit 1
}

$enc = New-Object System.Text.UTF8Encoding($false)
$writer = New-Object System.IO.StreamWriter($OutFileAbs, $false, $enc)
$writer.AutoFlush = $true    # flush ngay de doc duoc file trong LUC dang chay
$writer.WriteLine("timestamp_iso,epoch_ms,process,pid,cpu_percent_of_one_core,working_set_mb,private_mb,threads,handles")

# Trang thai lan lay mau truoc, khoa theo PID
$prev = @{}

Write-Host "Dang lay mau moi $IntervalSec giay -> $OutFile"
Write-Host "Theo doi: $($ProcessNames -join ', ')   (Ctrl+C de dung)"

try {
while ($true) {
    $now = Get-Date
    $epochMs = [long]([DateTimeOffset]$now).ToUnixTimeMilliseconds()
    $iso = $now.ToString("yyyy-MM-ddTHH:mm:ss.fff")

    foreach ($name in $ProcessNames) {
        $procs = @(Get-Process -Name $name -ErrorAction SilentlyContinue)
        foreach ($p in $procs) {
            # Ghi MOT DONG cho MOI PID — khong cong gop, de phan biet backend voi
            # cac tien trinh node khac dang chay tren may.
            $key = "$name-$($p.Id)"
            $cpuSeconds = 0.0
            try { $cpuSeconds = [double]$p.CPU } catch { $cpuSeconds = 0.0 }

            # CANH BAO PowerShell: KHONG dung `if ($cpuPct -eq "")` de kiem "chua tinh duoc".
            # PowerShell ep toan hang PHAI ve kieu cua toan hang TRAI, nen khi $cpuPct = 0.0
            # (tien trinh dang ranh) thi `0.0 -eq ""` cho ra TRUE -> moi mau luc may ranh bi
            # bo qua im lang. Dung co $havePrev tuong minh thay vi so sanh gia tri.
            $cpuPct = 0.0
            $havePrev = $false
            if ($prev.ContainsKey($key)) {
                $dtSec = ($now - $prev[$key].Time).TotalSeconds
                if ($dtSec -gt 0) {
                    $delta = $cpuSeconds - $prev[$key].Cpu
                    if ($delta -lt 0) { $delta = 0 }   # tien trinh vua restart
                    $cpuPct = [math]::Round(($delta / $dtSec) * 100, 1)
                    $havePrev = $true
                }
            }
            $prev[$key] = @{ Time = $now; Cpu = $cpuSeconds }

            # Lan lay mau dau tien chua co moc truoc -> chua tinh duoc CPU, bo qua dong nay
            if (-not $havePrev) { continue }

            $wsMb   = [math]::Round($p.WorkingSet64 / 1MB, 2)
            $privMb = [math]::Round($p.PrivateMemorySize64 / 1MB, 2)

            $writer.WriteLine("$iso,$epochMs,$name,$($p.Id),$cpuPct,$wsMb,$privMb,$($p.Threads.Count),$($p.HandleCount)")
        }
    }

    Start-Sleep -Seconds $IntervalSec
}
}
finally {
    if ($writer) { $writer.Flush(); $writer.Close() }
    if ($mutex) { $mutex.ReleaseMutex(); $mutex.Dispose() }
}

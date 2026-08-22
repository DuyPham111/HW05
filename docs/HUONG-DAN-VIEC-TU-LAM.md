# Hướng dẫn từng bước — những việc CHỈ BẠN tự làm được

> Đây là các việc AI không thể làm thay: chụp ảnh màn hình máy bạn, quay video giọng bạn, và tạo Issue trên tài khoản GitHub của bạn.
> Mỗi mục dưới đây là **cầm tay chỉ việc**: bấm gì, gõ gì, lưu tên file gì, kiểm lại thế nào.
> Cập nhật: 2026-08-22

**Thứ tự làm đề xuất:** A (dxdiag, 5 phút, làm được ngay) → B (ảnh Task Manager, làm cùng lúc chạy 4 lượt) → C (ảnh bug) → D (GitHub Issues) → E (video, làm cuối vì cần mọi thứ đã xong).

---

## A. Chụp `dxdiag` — hardware report (§6, §11) · ~5 phút

**Vì sao cần:** §11 nói TA đối chiếu **hostname** trong hardware report với các bài trước của bạn. Máy bạn tên `Pham_Vu_Ngoc_Duy` — khớp HW02/HW04.

### Các bước

**Bước A1.** Bấm `Win + R`, gõ đúng chữ này rồi Enter:

```
dxdiag
```

**Bước A2.** Cửa sổ *DirectX Diagnostic Tool* mở ra. Nếu nó hỏi *"Do you want to check if your drivers are digitally signed?"* → bấm **No** (không cần, và bấm Yes sẽ lâu hơn).

**Bước A3.** Đợi thanh tiến trình dưới đáy chạy xong (khoảng 5–15 giây), rồi ở tab **System**, kiểm đủ 4 dòng này đọc được:

| Dòng | Giá trị mong đợi |
|---|---|
| **Computer Name** | `PHAM_VU_NGOC_DUY` (hoặc tương tự — miễn khớp HW trước) |
| **Operating System** | Windows 11 … 64-bit |
| **Processor** | tên CPU + số nhân |
| **Memory** | dung lượng RAM |

**Bước A4.** Chụp **toàn màn hình**: bấm `Win + Shift + S` → trên thanh công cụ hiện ra ở đỉnh màn hình, chọn biểu tượng **Fullscreen snip** (hình chữ nhật đầy, ngoài cùng bên phải).

> ⚠️ **Đừng dùng "Rectangular snip" cắt riêng cửa sổ dxdiag.** Cần thấy cả **đồng hồ Windows** ở góc phải taskbar — đó là dấu thời gian không giả được.

**Bước A5.** Ảnh vừa chụp nằm trong clipboard và có thông báo góc phải. Bấm vào thông báo đó → Snipping Tool mở ra → `Ctrl + S` → lưu vào đúng đường dẫn này với đúng tên này:

```
D:\Nam3\HK3\Kiểm thử phần mềm\HW05\HW05-Performance-Testing\resource-monitor\screenshots\hardware-dxdiag.png
```

**Bước A6.** Xuất thêm bản text (nộp kèm càng chắc). Mở PowerShell, dán nguyên dòng này:

```bash
dxdiag /t "D:\Nam3\HK3\Kiểm thử phần mềm\HW05\HW05-Performance-Testing\resource-monitor\dxdiag.txt"
```

Lệnh này **không mở cửa sổ** — nó chạy ngầm 10–20 giây rồi ghi file. Đợi rồi kiểm bằng lệnh dưới.

### Kiểm lại A

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && ls -la resource-monitor/screenshots/hardware-dxdiag.png resource-monitor/dxdiag.txt && grep -i "Computer Name\|Operating System\|Processor\|Memory:" resource-monitor/dxdiag.txt | head -5
```

✅ Đạt khi: ảnh tồn tại (> 50 KB), và `dxdiag.txt` in ra được 4 dòng thông tin máy.

---

## B. Chụp ảnh Task Manager cùng khung với JMeter (§6, §11) · 4 ảnh

**Vì sao cần:** §6 đòi nguyên văn *"a screenshot of the tool **together with** the backend process's resource usage"* — **cùng một ảnh**, không phải hai ảnh ghép. Đây là mục §11 kiểm kỹ nhất.

### Chuẩn bị MỘT LẦN trước khi chạy lượt đầu tiên

**Bước B1.** Mở Task Manager: bấm `Ctrl + Shift + Esc`.

**Bước B2.** Sang tab **Details** (nếu thấy giao diện gọn thì bấm **More details** trước).

**Bước B3.** Chuột phải vào **thanh tiêu đề cột** (chỗ ghi "Name", "PID"…) → chọn **Select columns** → tick đủ 4 ô này rồi OK:

- ☑ `CPU`
- ☑ `Memory (private working set)`
- ☑ `Threads`
- ☑ `PID`

**Bước B4.** Bấm vào tiêu đề cột **CPU** để sắp xếp giảm dần (mũi tên chỉ xuống). Như vậy `node.exe` và `java.exe` sẽ tự nổi lên đầu khi chạy tải.

**Bước B5.** Chia đôi màn hình:
- Bấm vào cửa sổ **terminal** (nơi sẽ chạy JMeter) → bấm `Win + ←` (terminal chiếm nửa trái)
- Bấm vào cửa sổ **Task Manager** → bấm `Win + →` (chiếm nửa phải)

Bố cục đúng trông như sau:

```
┌──────────────────────────────┬─────────────────────────────┐
│ Terminal chạy JMeter          │ Task Manager → tab Details  │
│ (dòng "summary + ..." đang    │ node.exe   ...% CPU         │
│  tăng dần)                    │ java.exe   ...% CPU         │
└──────────────────────────────┴─────────────────────────────┘
                            đồng hồ Windows ở góc phải taskbar
```

### Chụp — làm 4 lần, mỗi lượt 1 ảnh

Khi chạy `node tools/run-scenario.mjs <Scenario>`, script sẽ **in ra màn hình nhắc bạn giây thứ mấy cần chụp**. Mốc từng lượt:

| Lượt | Chụp ở giây thứ | Vì sao mốc đó | Tên file lưu |
|---|---|---|---|
| **Load** | **~180** | giữa vùng ổn định, đã qua ramp 60s | `taskmgr-load.png` |
| **Stress** | **~300–400** | đang ở bậc **200 VU** (bậc 4 bắt đầu t=270s, ramp xong t=290s) — ảnh giá trị nhất cả bài | `taskmgr-stress.png` |
| **Spike** | **~65–88** | trong cú sốc (chỉ kéo dài 30s — xem mẹo dưới) | `taskmgr-spike.png` |
| **Soak** | **~400** | giữa lượt 12 phút, để so RSS đầu/giữa/cuối | `taskmgr-soak.png` |

Thao tác chụp: `Win + Shift + S` → **Fullscreen snip** → bấm thông báo → `Ctrl + S` → lưu vào:

```
D:\Nam3\HK3\Kiểm thử phần mềm\HW05\HW05-Performance-Testing\resource-monitor\screenshots\taskmgr-<tên lượt>.png
```

> 💡 **Mẹo cho lượt Spike** — cửa sổ chỉ 30 giây, rất dễ trượt. Thay vì canh tay, hãy **quay màn hình cả lượt** rồi cắt frame sau:
> - Bấm `Win + Alt + R` để bắt đầu quay (Xbox Game Bar), bấm lại để dừng.
> - Video lưu ở `C:\Users\DELL\Videos\Captures\`.
> - Mở video, tua tới giây ~70, tạm dừng, rồi `Win + Shift + S` chụp màn hình đang phát.
> - **Video này dùng luôn được cho phần E (video demo)** — một công đôi việc.

### Bốn thứ BẮT BUỘC nhìn thấy trong mỗi ảnh

Tự soi lại từng ảnh sau khi chụp:

- [ ] Cửa sổ terminal/JMeter đang chạy, có dòng `summary + ...` với số sample đang tăng
- [ ] Dòng **`node.exe`** trong Task Manager, đọc được số CPU và Memory
- [ ] Dòng **`java.exe`** (chính là JMeter) — cần để chứng minh load generator ăn bao nhiêu
- [ ] **Đồng hồ Windows** góc phải — mốc thời gian phải khớp `results/run-log.md`

> Ảnh mờ, ảnh chụp bằng điện thoại, ảnh cắt mất đồng hồ → coi như **không có bằng chứng**, và chụp lại thì phải chạy lại cả lượt. Làm đúng ngay lần đầu.

### Kiểm lại B

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && for f in resource-monitor/screenshots/taskmgr-*.png; do printf "%-50s %8s KB  %s\n" "$(basename $f)" "$(( $(stat -c%s "$f") / 1024 ))" "$(date -r "$f" '+%H:%M:%S')"; done
```

✅ Đạt khi: đủ **4 ảnh**, và giờ của mỗi ảnh **nằm trong** khoảng chạy của lượt tương ứng ghi ở `results/run-log.md`.

---

## C. Chụp ảnh bằng chứng cho 5 bug (§6) · ~15-20 phút

Năm bug đã có bằng chứng số liệu VÀ đã được AI kiểm chứng bằng request thật (chạy
`node bug-report/verify-bugs.mjs` ra `6/6 CONFIRMED`), giờ chỉ cần chụp ảnh lại. **Backend phải
đang chạy** trước khi làm.

### C1 — Bug P1: `register` không có UNIQUE email

Mở PowerShell, dán **nguyên khối** này (nó gọi đăng ký 2 lần cùng một email):

```bash
curl -s -X POST http://127.0.0.1:3000/api/register -H "Content-Type: application/json" -d "{\"name\":\"BugDemo\",\"email\":\"bug-p1-demo@hw05.test\",\"password\":\"Test1234!\"}" && echo "" && curl -s -X POST http://127.0.0.1:3000/api/register -H "Content-Type: application/json" -d "{\"name\":\"BugDemo\",\"email\":\"bug-p1-demo@hw05.test\",\"password\":\"Test1234!\"}"
```

Kết quả sẽ ra **2 dòng, cùng email nhưng `id` khác nhau** — đó chính là bug. Chụp `Win + Shift + S` → Fullscreen → lưu:

```
resource-monitor\..\bug-report\screenshots\p1-register-trung-email.png
```
(đường dẫn đầy đủ: `D:\Nam3\HK3\Kiểm thử phần mềm\HW05\HW05-Performance-Testing\bug-report\screenshots\p1-register-trung-email.png`)

### C2 — Bug P2: `products/:id` trả 200 cho id không tồn tại

```bash
curl -s -w "\n--> HTTP status: %{http_code}\n" http://127.0.0.1:3000/api/products/999999
```

Kết quả: body `{}` nhưng status **200** (đáng lẽ phải 404). Chụp → lưu `bug-report\screenshots\p2-200-body-rong.png`

### C3 — Bug P3: SQL injection ở `search` — **đã xác nhận là Critical, chụp cả 2 lệnh**

Đã kiểm chứng thật rồi (AI đã chạy) — đây không còn là "kiểm tra xem có bug không" mà là "chụp lại
bằng chứng của một bug Critical đã xác nhận". Chạy lần lượt cả hai lệnh, chụp cả hai kết quả:

```bash
curl -s -w "\n--> HTTP status: %{http_code}\n" "http://127.0.0.1:3000/api/products?search=a'"
```

Kết quả: **HTTP 500** kèm thông báo lỗi SQL thật (`SQLITE_ERROR: unrecognized token`). Chụp → lưu
`bug-report\screenshots\p3a-sqli-error500.png`

```bash
curl -s "http://127.0.0.1:3000/api/products?search=zzz_no_match%25%27%20UNION%20SELECT%201,email,password,role,1,1%20FROM%20users--%20" | head -c 500
```

Kết quả: trả về dữ liệu thật từ bảng `users` — dòng đầu tiên là `admin@eshop.com` kèm mật khẩu
plaintext `Admin123!`. Đây là bằng chứng **rút được dữ liệu**, không chỉ là lỗi 500. Chụp → lưu
`bug-report\screenshots\p3b-sqli-union-leak.png`

### C4 — Bug P5: payload 3,6 MB do không phân trang

```bash
curl -s -o NUL -w "search=Perf   --> %{size_download} bytes\n" "http://127.0.0.1:3000/api/products?search=Perf" && curl -s -o NUL -w "khong loc    --> %{size_download} bytes\n" http://127.0.0.1:3000/api/products
```

Chụp → lưu `bug-report\screenshots\p5-payload-3mb.png`

### C5 — Bug P6: restart backend xoá sạch database

Bug này **không nên thực thi thật** (sẽ xoá dữ liệu bạn đang dùng cho các lượt đo khác). Thay vào
đó, chụp lại đoạn code là bằng chứng đủ:

1. Mở file `database.js` của backend (SUT) trong VS Code hoặc Notepad.
2. Tìm dòng gọi `initDatabase()` ở cuối file, và bên trong hàm đó có các lệnh `DROP TABLE IF EXISTS`
   cho từng bảng, chạy ngay lúc file được `require()` — không có điều kiện nào kiểm tra "đã có dữ
   liệu chưa" trước khi xoá.
3. Chụp đoạn code đó (kéo chọn khoảng 15-20 dòng quanh `initDatabase`). Chụp → lưu
   `bug-report\screenshots\p6-restart-wipe-code.png`

(Nếu muốn bằng chứng bằng số thay vì code: ghi lại số sản phẩm trước/sau một lần bạn **buộc phải**
restart backend trong quá trình làm bài — ví dụ sau sự cố thật đã xảy ra ở bug P5 — chứ đừng chủ
động restart chỉ để chụp ảnh.)

### Kiểm lại C

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && ls -la bug-report/screenshots/*.png
```

Phải thấy đủ **6 file ảnh**: `p1-register-trung-email.png`, `p2-200-body-rong.png`,
`p3a-sqli-error500.png`, `p3b-sqli-union-leak.png`, `p5-payload-3mb.png`, `p6-restart-wipe-code.png`.

---

## D. Tạo GitHub Issues (§6) · ~20 phút

**Vì sao AI không làm thay được:** cần đăng nhập tài khoản GitHub của bạn. (Ở HW02 bạn cũng đã tự làm phần này và ghi rõ trong audit log — giữ nguyên cách đó.)

### Bước D1 — Mở trang tạo Issue

Vào: **https://github.com/DuyPham111/HW05/issues** → bấm nút xanh **New issue**.

### Bước D2 — Điền theo mẫu (làm lần lượt cho từng bug)

**Title** — copy y nguyên:

| Bug | Title |
|---|---|
| P3 | `[SECURITY][BUG] GET /api/products?search noi chuoi SQL - SQL injection, rut duoc toan bo bang users` |
| P5 | `[PERF] GET /api/products khong phan trang - 3.6 MB/request, lam chet backend o 200 VU` |
| P6 | `[BUG] Khoi dong lai backend xoa sach toan bo database` |
| P1 | `[BUG] POST /api/register khong co UNIQUE constraint tren email - tao duoc tai khoan trung` |
| P2 | `[BUG] GET /api/products/:id tra HTTP 200 + body rong cho id khong ton tai (dang le 404)` |

**Body** — mở `bug-report/bug-report.md`, copy khối mô tả bug tương ứng (Pre-conditions / Steps / Expected / Actual / Severity) dán vào.

**Chèn ảnh:** kéo thả file `.png` từ Windows Explorer **thả thẳng vào ô soạn body** — GitHub tự upload và chèn link. Đừng dán đường dẫn máy bạn (`D:\...`) vì TA không mở được.

Bấm **Submit new issue**.

### Bước D3 — Dán link thật vào bug report

Sau khi tạo, URL sẽ dạng `https://github.com/DuyPham111/HW05/issues/1`. Mở `bug-report/bug-report.md`, tìm cột **GitHub Issue** của bug đó, điền:

```markdown
[#1](https://github.com/DuyPham111/HW05/issues/1)
```

> Cột này **để trống là mất điểm** — §6 đòi bug phải được log lên GitHub Issues.

### Kiểm lại D

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && grep -o "https://github.com/DuyPham111/HW05/issues/[0-9]*" bug-report/bug-report.md | sort -u
```

✅ Đạt khi: in ra đủ số link bằng số bug bạn báo, và mở từng link thấy Issue thật có ảnh.

---

## E. Quay video demo ≥ 6 phút (§6, §11) · ~1 giờ

**Làm CUỐI CÙNG** — cần mọi thứ đã xong để có cái mà quay.

### Ba ràng buộc cứng — sai một cái là mất điểm cả video

| Ràng buộc | Cách thoả |
|---|---|
| **≥ 6 phút** | kịch bản dưới dài ~12 phút, quay đủ là dư |
| **Tool + Task Manager CÙNG KHUNG** | quay **toàn màn hình**, không quay riêng cửa sổ |
| **Giọng nói của chính bạn, tiếng Việt** | nói trực tiếp lúc quay; **không** dùng giọng máy đọc |

### Bước E1 — Cài và cấu hình OBS Studio

> Vì sao không dùng `Win + Alt + R`: Xbox Game Bar **không quay được** khi bạn chuyển qua lại giữa nhiều cửa sổ/File Explorer — mà video này cần đúng điều đó.

1. Tải OBS: https://obsproject.com/ → cài đặt (Next → Next → Finish).
2. Mở OBS. Nếu hiện *Auto-Configuration Wizard* → chọn **Optimize just for recording**.
3. Ở ô **Sources** (dưới đáy) bấm dấu **`+`** → chọn **Display Capture** → OK → OK.
4. Bấm **`+`** lần nữa → chọn **Audio Input Capture** → OK → ở ô Device chọn micro của bạn → OK.
5. **Thử mic:** nói vài câu, nhìn thanh **Mic/Aux** trong ô *Audio Mixer* — thanh phải nhảy. Không nhảy = mic sai, sửa trước khi quay.

### Bước E2 — Dọn màn hình trước khi quay

- Tắt thông báo: `Win + N` → bật **Do not disturb**
- Đóng hết tab/cửa sổ riêng tư (Facebook, Zalo, mail…)
- Mở sẵn: terminal, Task Manager (tab Details), VS Code mở repo, trình duyệt ở tab GitHub repo

### Bước E3 — Kịch bản 12 phút

Bấm **Start Recording** trong OBS rồi bám theo bảng này. **Nhìn kịch bản mà nói bằng lời của mình, đừng đọc từng chữ.**

| # | Phút | Làm gì trên màn hình | Nói gì |
|---|---|---|---|
| 1 | 0:00–0:45 | Gõ `hostname` rồi `jmeter --version` | "Em là Phạm Vũ Ngọc Duy, MSSV 23127183, bài HW05 Performance Testing trên SUT EShop. Máy em tên `Pham_Vu_Ngoc_Duy`, JMeter bản 5.6.3." |
| 2 | 0:45–2:00 | Mở `docs/endpoint-selection.md`, chỉ bảng 7 bước | "Workflow em chọn là Customer Storefront. Bước 1 và 7 là auth-heavy, bước 2-3 read-heavy, bước 4-5-6 transactional. Bước 7 cố tình đăng nhập sai để phủ yêu cầu account-lockout của đề." |
| 3 | 2:00–3:00 | Mở file `.jmx` bằng JMeter GUI, bung cây | "Đây là 7 sampler, 5 CSV Data Set — chú ý Sharing mode để **All threads** để mỗi VU một tài khoản riêng. Và đây là Response Assertion của bước 7 nhận cả 401 lẫn 403." |
| 4 | 3:00–5:30 ⭐ | **Chạy Load thật**, để chạy **liên tục ≥ 2 phút không cắt** | Vừa chạy vừa chỉ: "Dòng summary đang tăng. Bên phải, `node.exe` đang ở x% CPU, `java.exe` là JMeter ở y%." |
| 5 | 5:30–7:00 | Mở lần lượt 3 file `.jmx`, chỉ listener từng cái | "Ba listener khác loại: Summary Report cho Load, Aggregate Report cho Stress, View Results Tree cho Spike. Mở cái này ra, bấm vào sample bước 7 — thấy response 401, đây là bằng chứng 401 là hành vi thiết kế chứ không phải lỗi." |
| 6 | 7:00–8:30 | `npm run summary`, mở `results/summary.md`, rồi `endurance-threshold.md` | Đọc to p95 từng scenario và con số ngưỡng chịu tải. |
| 7 | 8:30–10:00 ⭐ | Mở `task2-ai-output-verbatim.md`, chỉ 1 chỗ AI sai, rồi **chạy lệnh tính lại số đúng ngay trên video** | "AI nói error rate 14% là hệ thống từ chối request. Em kiểm raw log thì 100% số đó là 401/403 của bước 7 — nhánh lockout cố ý. Đây là lệnh em dùng để tính lại." |
| 8 | 10:00–11:30 ⭐ | Gọi skill `/perf-test-plan` trong Claude Code, cho chạy trên **endpoint chưa làm** (vd `/api/categories`) | "Đây là Agent Skill em viết. Em áp nó lên một nhóm endpoint khác để chứng minh nó tái sử dụng được — và đây là chỗ em sửa lại output của nó." |
| 9 | 11:30–12:30 | Mở flow chart Task 3 + `ci/ci-runs.md` chỉ lượt FAIL | "Mô hình continuous perf testing: theo dõi commit → quyết định có chạy không → cảnh báo khi p95 hồi quy. Đây là lượt CI đỏ thật, chứng minh cổng chặn hoạt động." |

> Ba mục ⭐ là phần TA xem kỹ nhất — **đừng tua nhanh, đừng cắt**.

### Bước E4 — Upload lên YouTube

1. Vào https://youtube.com → bấm biểu tượng **máy quay có dấu +** góc phải trên → **Upload video**
2. Kéo file từ `C:\Users\DELL\Videos\` (hoặc thư mục OBS lưu) vào
3. **Title:** `HW05 Performance Testing - EShop - 23127183 Pham Vu Ngoc Duy`
4. **Description:** dán link repo + bảng timestamp (copy từ `demo/README.md`)
5. Ở mục *Audience* chọn **No, it's not made for kids**
6. Bấm **Next** 3 lần → tới bước **Visibility** → chọn **Unlisted**

> 🚨 **Đừng chọn Private.** Private thì TA **không xem được** = coi như không nộp video. Phải là **Unlisted**.

7. Bấm **Save**, copy link dạng `https://youtu.be/xxxxx`

### Bước E5 — Tự kiểm bằng cửa sổ ẩn danh

Bấm `Ctrl + Shift + N` (Chrome) → dán link → phải **xem được mà không cần đăng nhập**.
Nếu báo *"Video unavailable"* → bạn đang để Private, quay lại YouTube Studio sửa thành Unlisted.

### Bước E6 — Dán link vào 3 chỗ

| File | Chỗ nào |
|---|---|
| `README.md` | dòng **Video demo** trong bảng Liên kết |
| `report/main-report.md` | §2.5 |
| `demo/README.md` | dòng **Link (unlisted)** + điền thời lượng thật |

### Kiểm lại E

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && grep -rn "youtu.be\|youtube.com" README.md report/main-report.md demo/README.md
```

✅ Đạt khi: cả 3 file đều có link, thời lượng ghi ≥ 6:00, và link mở được ở cửa sổ ẩn danh.

---

## Bảng theo dõi tiến độ

Tick dần khi làm xong:

| | Việc | Thời gian | Xong? |
|---|---|---|:--:|
| A | Chụp dxdiag + xuất `dxdiag.txt` | 5 phút | ☐ |
| B | 4 ảnh Task Manager (làm cùng lúc chạy 4 lượt) | trong lúc chạy | ☐ |
| C | 4 ảnh bằng chứng bug | 15 phút | ☐ |
| D | Tạo GitHub Issues + dán link | 20 phút | ☐ |
| E | Quay + upload video ≥ 6 phút | 1 giờ | ☐ |

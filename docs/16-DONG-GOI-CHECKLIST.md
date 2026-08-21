# 16 — Đóng gói và checklist cuối cùng (§14, §17)

> §17: **"Missing any required document results in 0 points."** Chạy hết checklist này trước khi bấm nộp.
> Tên file: `23127183_HW05_AI_Performance_<điểm tự chấm 3 chữ số>.zip` — ví dụ `23127183_HW05_AI_Performance_100.zip`.

---

## 1. Checklist §14 — 14 mục bắt buộc

Đánh dấu từng mục, và **mở file ra kiểm chứ đừng tin trí nhớ**.

| # | §14 đòi | Nằm ở | ✓ |
|---|---|---|:--:|
| 1 | Main report (**Markdown + PDF**), gồm cả phần AI analysis critique | `report/main-report.md` + `.pdf` | ☐ |
| 2 | **Link GitHub repo công khai** (test plan + data file) | README mục Liên kết — mở bằng **cửa sổ ẩn danh** để chắc là public | ☐ |
| 3 | **3 test plan** đúng tên `{MSSV}_{ScenarioType}_{YYYYMMDD}` | `test-plans/23127183_{Load,Stress,Spike}_20260820.jmx` (+ Soak) | ☐ |
| 4 | **3 raw `.jtl`** đầy đủ | `results/jtl/` — kiểm không rỗng, có header, số dòng khớp sample trong `summary.md` | ☐ |
| 5 | **3 thư mục HTML report** | `results/html/{load,stress,spike}/index.html` mở được | ☐ |
| 6 | Ảnh **resource-monitor** và **hardware-spec** | `resource-monitor/screenshots/` — 4 ảnh Task Manager + dxdiag | ☐ |
| 7 | **Link YouTube unlisted** ≥ 6 phút | README + `report/main-report.md` §2.5 | ☐ |
| 8 | **AI Critique** + **AI Audit Report** (Markdown + PDF) | `ai-audit/` — 4 file | ☐ |
| 9 | **Git commit log** (text) | `git-log/commit-log.txt` | ☐ |
| 10 | **Bug report** + ảnh Issues (nếu có) | `bug-report/` + link Issues thật | ☐ |
| 11 | **README** có bảng tự chấm + test summary | `README.md` | ☐ |
| 12 | **Endurance threshold** kèm số cụ thể | `endurance/endurance-threshold.md` | ☐ |
| 13 | Task 3 — **flow chart** + trade-off | `report/main-report.md` §4 + `report/assets/` | ☐ |
| 14 | Agent Skills | `.claude/skills/` — 4 `SKILL.md` | ☐ |

---

## 2. Kiểm bằng lệnh, không kiểm bằng mắt

Liệt kê nhanh mọi thứ:

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && ls test-plans/*.jmx && for f in results/jtl/*.jtl endurance/jtl/*.jtl; do printf "%-58s %8s dong\n" "$f" "$(wc -l < "$f")"; done && ls -d results/html/*/ && ls resource-monitor/screenshots/ && find . -name "*.pdf" -not -path "./node_modules/*"
```

Kiểm đủ **3 listener khác loại** (§6 — chỗ mất điểm oan):

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && grep -oh 'guiclass="[A-Za-z]*"' test-plans/*.jmx | grep -i -E "visualizer|summary|stat" | sort | uniq -c
```

Kiểm ảnh chụp **đúng lúc lượt đang chạy** (§11 đối chiếu mốc thời gian):

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && for f in resource-monitor/screenshots/taskmgr-*.png; do printf "%-52s %s\n" "$f" "$(date -r "$f" '+%Y-%m-%d %H:%M:%S')"; done && grep -iE "bat dau|ket thuc|scenario|Bắt đầu|Kết thúc" results/run-log.md
```

Bốn phép kiểm chéo dễ quên nhất:

| Phép kiểm | Kỳ vọng | Nếu sai thì |
|---|---|---|
| Số `.jtl` = số lượt ghi trong `run-log.md` | bằng nhau | có lượt chạy mà không ghi log, hoặc ngược lại |
| Số sample trong `summary.md` = `wc -l` của `.jtl` trừ 1 | bằng nhau | script đọc sai file, hoặc `.jtl` bị ghi đè |
| 3 `guiclass` listener khác nhau | đúng 3 loại | trùng listener → mất điểm §6 |
| mtime ảnh nằm **trong** khoảng chạy của lượt tương ứng | nằm trong | ảnh chụp trước/sau lượt → §11 coi là bằng chứng dựng |

---

## 3. Viết `README.md` — **làm cuối cùng**, sau khi mọi số đã có

README là thứ TA đọc **đầu tiên**. Nó phải trả lời được 5 câu mà không cần mở file nào khác:

1. Đã chạy những scenario nào?
2. Phủ những endpoint group nào?
3. Endurance threshold là bao nhiêu (**bằng số**)?
4. Có bao nhiêu bug / performance issue?
5. Video demo ở đâu?

Khung README đã dựng sẵn ở `README.md` gốc repo. Điền theo thứ tự:

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && npm run summary && npm run drift && cat results/summary.md
```

Rồi **copy số từ đó vào README** — không gõ tay từ dashboard, không ước lượng.

### Bảng tự chấm (§15)

> **Lưu ý lỗi số học trong đề:** sáu dòng tiêu chí cộng lại là 90 (`20+20+20+10+10+10`) nhưng dòng Total ghi 100. Giữ nguyên từng mức tối đa của đề, và dùng `100` theo đúng dòng Total + định dạng `SelfAssessedGrade` 3 chữ số. Ghi một dòng chú thích như trên vào README — nó cho thấy bạn đọc kỹ đề chứ không phải tự cộng bừa.

| No. | Tiêu chí | Điểm tối đa | Tự chấm | Căn cứ (điền số thật) |
|---|---|---|---|---|
| 1 | Task 1 — Load testing | 20 | | {n} sample · 20 VU · think 1–3s · p95 {x} ms · listener Summary Report · 5 CSV · ảnh Task Manager khớp mốc |
| 2 | Task 1 — Stress testing | 20 | | 4 bậc 25→50→100→200 VU · {n} sample · RPS đỉnh {x} · listener Aggregate Report · CPU node {a}%→{b}% |
| 3 | Task 1 — Spike testing | 20 | | 10 nền + 200/5s · listener View Results Tree · bảng hồi phục 4 cửa sổ |
| 4 | Task 2 — AI analysis + misinterpretation hunt | 10 | | output nguyên văn + {n} nhận định soát lại kèm giá trị đúng từ raw `.jtl` + {m} đề xuất phân loại |
| 5 | Task 3 — Continuous Performance Testing (G9.6) | 10 | | flow chart {n} nút · {m} trade-off · {k} lượt CI thật, 1 lượt đỏ |
| 6 | Agent Skills | 10 | | 4 `SKILL.md` + demo end-to-end trong video |
| | **Total** | **100** | | |

---

## 4. Đóng gói `.zip`

**Không** cho vào zip: `node_modules/`, `.git/`, file tạm. **Có** cho vào: `docs/` (không bắt buộc nhưng vô hại, và cho thấy quy trình).

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05" && rm -rf pack/23127183_HW05_AI_Performance_100 && mkdir -p pack/23127183_HW05_AI_Performance_100 && (cd HW05-Performance-Testing && git ls-files | grep -v "^node_modules/" > /tmp/hw05files.txt) && (cd HW05-Performance-Testing && tar -cf - -T /tmp/hw05files.txt) | (cd pack/23127183_HW05_AI_Performance_100 && tar -xf -) && echo "So file: $(find pack/23127183_HW05_AI_Performance_100 -type f | wc -l)"
```

> Dùng `git ls-files` thay vì copy cả thư mục: nó tự loại đúng những gì `.gitignore` đã loại, và **đảm bảo mọi thứ trong zip đều đã được commit** — tức là bản nộp khớp với repo public, không có file "chỉ có ở máy em".

Nén:

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/pack" && powershell -Command "Compress-Archive -Path '23127183_HW05_AI_Performance_100/*' -DestinationPath '23127183_HW05_AI_Performance_100.zip' -Force" && ls -lh 23127183_HW05_AI_Performance_100.zip
```

**Kiểm lại bản zip** (đừng bỏ bước này — nhiều bài mất điểm vì zip thiếu file):

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/pack" && unzip -l 23127183_HW05_AI_Performance_100.zip | grep -E "\.jmx|\.jtl|\.pdf|README.md|SKILL.md|commit-log"
```

---

## 5. Bảy phép kiểm cuối — làm ngay trước khi nộp

| # | Kiểm | Cách |
|---|---|---|
| 1 | **Repo GitHub là public** | mở link trong **cửa sổ ẩn danh** |
| 2 | **Video xem được** | mở link YouTube trong **cửa sổ ẩn danh**, đọc thời lượng ≥ 6:00 |
| 3 | **PDF không vỡ** | mở từng file `.pdf`: bảng còn nguyên, ảnh hiện được |
| 4 | **AI Critique 200–300 từ** | `sed '/^#/d;/^\*\*/d' ai-audit/ai-critique.md \| wc -w` |
| 5 | **Tên test plan đúng mẫu** | `ls test-plans/` — phải là `23127183_Load_YYYYMMDD.jmx` (§11 kiểm đích danh mục này) |
| 6 | **Link Issues thật, không để trống** | mở từng link trong `bug-report.md` |
| 7 | **Số trong README = số trong `summary.md`** | đối chiếu từng dòng |

---

## 6. Bốn cái bẫy đã biết của bài này

| Bẫy | Hậu quả | Tránh bằng |
|---|---|---|
| Gõ tay số từ HTML dashboard vào README | README lệch báo cáo, TA thấy ngay | chỉ lấy số từ `results/summary.md` |
| Không xóa thư mục `-o` cũ trước khi chạy | JMeter báo lỗi **sau khi** chạy xong → mất cả lượt | `run-scenario.mjs` tự dọn |
| Video để **Private** thay vì **Unlisted** | TA không xem được = coi như không có video | kiểm bằng cửa sổ ẩn danh |
| Zip từ thư mục thay vì từ `git ls-files` | lọt `node_modules` (hàng chục nghìn file) hoặc thiếu file chưa commit | dùng lệnh ở §4 |

---

## 7. Nộp

1. Upload `.zip` lên Moodle theo đúng link nộp bài.
2. Kiểm lại: tên file đúng mẫu `23127183_HW05_AI_Performance_<3 chữ số>.zip`.
3. §17: **không có nộp trễ.** Nộp sớm ít nhất 2 tiếng để còn kịp xử lý nếu Moodle lỗi.
4. §13: **30% sinh viên ngẫu nhiên** bị gọi vấn đáp 5–7 phút trong tuần sau deadline. Chuẩn bị trả lời 4 câu:
   - *Vì sao chọn workflow này và nó phủ 3 nhóm endpoint thế nào?*
   - *Chỉ ra một chỗ AI đọc sai metric và em chứng minh sai bằng gì?*
   - *Endurance threshold của em là bao nhiêu, đo trong điều kiện nào?*
   - *Vì sao bước 7 nhận 401 là thành công mà không phải lỗi?*

---

## 8. Xong

Quay lại [00-ROADMAP.md](00-ROADMAP.md) để soát lại bản đồ yêu cầu lần cuối.

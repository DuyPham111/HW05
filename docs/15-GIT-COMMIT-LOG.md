# 15 — Git commit log (§12)

> §12: *"Create a **new Git commit for each step** of the procedure (for example: each scenario's test plan, the AI analysis, and the continuous testing proposal). Provide the Git commit log in a **text-based** file format."*
> Output: `git-log/commit-log.txt`.

---

## 1. Nguyên tắc: 1 bước = 1 commit, rải nhiều ngày

Commit log là thứ TA nhìn để biết bạn làm **theo quy trình** hay làm dồn một đêm rồi viết báo cáo ngược. Ba điều nó tiết lộ:

| Cái TA nhìn | Ý nghĩa |
|---|---|
| **Số commit** và độ mịn | có làm theo bước hay không |
| **Khoảng cách ngày** | dồn 1 đêm hay rải theo buổi |
| **Thứ tự** | test plan phải commit **trước** file `.jtl`; nếu ngược lại thì số liệu có trước plan — vô lý |

**Đừng để commit đầu tiên chứa toàn bộ bài.** Nếu lỡ làm rồi thì không sửa lịch sử — ghi thành thật vào README một dòng giải thích còn hơn là `rebase` giả.

---

## 2. Bản đồ commit đề xuất (~28 commit, 5 buổi)

| Buổi | # | Commit message |
|---|---|---|
| **1** | 1 | `chore: khoi tao skeleton HW05 + docs huong dan` |
| | 2 | `chore: preflight kiem moi truong + 6 endpoint cua workflow` |
| | 3 | `docs: chot pham vi workflow storefront + bang chung khong trung nhom` |
| | 4 | `feat(data): seed 400 tai khoan + 20k san pham, sinh 5 file CSV data-driven` |
| **2** | 5 | `docs: chot tham so scenario Load (20 VU / 60s ramp / think 1-3s / 6 phut)` |
| | 6 | `test(load): sinh 4 plan .jmx tu mot dinh nghia workflow chung` |
| | 7 | `test(load): CSV data-driven + JSON extractor token + assertion tung buoc` |
| | 8 | `test(load): sua assertion buoc 7 va du lieu coupon sau smoke test` |
| | 9 | `docs: human review - 8 loi cua AI trong test plan Load va nguyen nhan` |
| | 10 | `feat(tools): run-scenario + sample-resources + reset-lockout cho Windows` |
| | 11 | `test(load): raw jtl + dashboard + anh Task Manager luot Load` |
| **3** | 12 | `test(stress): 4 bac 25-50-100-200 VU (khong dung plugin)` |
| | 13 | `test(stress): raw jtl + dashboard + anh bac 200 VU` |
| | 14 | `test(spike): 10 VU nen + 200 VU trong 5s + listener View Results Tree` |
| | 15 | `test(spike): raw jtl + phan tich hoi phuc 4 cua so` |
| | 16 | `feat(tools): summarize-jtl sinh moi con so tu raw jtl` |
| | 17 | `docs: dinh nghia tieu chi on dinh TRUOC khi chay soak` |
| | 18 | `test(soak): luot endurance 12 phut + chot nguong bang so cu the` |
| | 19 | `docs: hardware report + anh dxdiag (hostname Pham_Vu_Ngoc_Duy)` |
| **4** | 20 | `docs(task2): luu nguyen van output phan tich cua AI` |
| | 21 | `docs(task2): soat 7 nhan dinh cua AI, doi chieu gia tri dung tu raw jtl` |
| | 22 | `docs(task2): phan loai 6 de xuat toi uu feasible/hallucinated + A-B test WAL` |
| | 23 | `feat(ci): pipeline perf-smoke + ci-gate cho continuous perf testing` |
| | 24 | `docs(task3): flow chart + trade-off + 4 luot CI that (1 luot do)` |
| **5** | 25 | `docs: bug report 3 bug moi + verify-bugs chay lai duoc + link Issues` |
| | 26 | `feat(skills): 4 Agent Skill perf-test-plan / jtl-analysis / resource-evidence / ai-audit-logger` |
| | 27 | `docs: AI Audit Report 17 block + AI Critique 2xx tu + xuat PDF` |
| | 28 | `docs: README self-assessment + test summary + link video demo` |

**Quy ước message:** `<type>(<scope>): <việc đã làm>`, không dấu tiếng Việt (tránh lỗi encoding khi xuất log ra `.txt` trên Windows).

---

## 3. Commit file `.jtl` lớn

File `.jtl` của lượt Stress có thể 20–60 MB. Vẫn dưới giới hạn 100 MB/file của GitHub → commit bình thường, **không** dùng Git LFS (LFS làm TA clone về thấy con trỏ thay vì dữ liệu nếu họ không cài LFS).

Kiểm trước khi push:

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && find results endurance -name "*.jtl" -exec ls -lh {} \; | awk '{print $5, $9}'
```

Nếu có file > 90 MB: giảm bằng cách tắt bớt cột không cần trong `jmeter.properties` cho lượt đó (**không** xóa dòng khỏi `.jtl` — §11 đòi *"attached in full — not only the summary"*), hoặc giảm thời lượng lượt và chạy lại.

---

## 4. Xuất `git-log/commit-log.txt`

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && git log --graph --date=iso --pretty=format:'%h | %ad | %an | %s' --stat > git-log/commit-log.txt && head -30 git-log/commit-log.txt
```

Thêm một bản gọn để TA đọc nhanh:

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && git log --date=short --pretty=format:'%ad  %h  %s' > git-log/commit-log-short.txt && wc -l git-log/commit-log-short.txt
```

**Xuất log là commit CUỐI CÙNG** — nên nó sẽ không tự chứa chính nó. Điều đó bình thường; ghi một dòng chú thích ở đầu file:

```
# Git commit log - HW05 Performance Testing - 23127183 Pham Vu Ngoc Duy
# Xuat luc: <ngày giờ>  |  Repo: https://github.com/DuyPham111/HW05
# Ghi chu: commit cuoi cung ("docs: xuat git commit log") khong xuat hien trong file nay
#          vi file duoc sinh ra TRUOC khi commit no. Xem lich su day du tren GitHub.
```

**Commit:** `docs: xuat git commit log (§12)`

---

## 5. Checklist §12

- [ ] ≥ 20 commit, mỗi commit là **một bước** của quy trình
- [ ] Rải trên ≥ 4 ngày khác nhau (kiểm: `git log --date=short --pretty=format:'%ad' | sort -u`)
- [ ] Test plan commit **trước** file `.jtl` tương ứng
- [ ] Message không dấu, theo mẫu `type(scope): việc`
- [ ] `git-log/commit-log.txt` xuất xong, mở bằng Notepad đọc được (không lỗi encoding)
- [ ] Repo GitHub ở trạng thái **public**, link đã dán vào README

```bash
cd "D:/Nam3/HK3/Kiểm thử phần mềm/HW05/HW05-Performance-Testing" && echo "So commit: $(git rev-list --count HEAD)" && echo "So ngay khac nhau: $(git log --date=short --pretty=format:'%ad' | sort -u | wc -l)"
```

---

→ Tiếp: [16-DONG-GOI-CHECKLIST.md](16-DONG-GOI-CHECKLIST.md)

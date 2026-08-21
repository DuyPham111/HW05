# test-plans/

Bốn test plan JMeter, sinh bằng `npm run plans` từ **MỘT** định nghĩa workflow chung (`tools/gen-test-plans.py`) — để cả 4 plan chạy đúng cùng một workflow end-to-end (§6).

| File | Scenario | Tham số tải | Listener (§6 đòi 3 loại **khác** nhau) |
|---|---|---|---|
| `23127183_Load_20260821.jmx` | Load | 20 VU · ramp 60s · think 1–3s · 360s | **Summary Report** |
| `23127183_Stress_20260821.jmx` | Stress | 4 bậc cộng dồn 25→50→100→200 VU · think 0,3–1s | **Aggregate Report** |
| `23127183_Spike_20260821.jmx` | Spike | 10 VU nền + 200 VU trong 5s · think 0–0,5s · 240s | **View Results Tree** |
| `23127183_Soak_20260821.jmx` | Soak (endurance) | 20 VU · 720s | Summary Report |

**§11 kiểm TÊN FILE** — phải đúng mẫu `{MSSV}_{ScenarioType}_{YYYYMMDD}`.

## Workflow dùng chung — 7 bước

```
1. POST /api/login              (auth-heavy)    -> extract $.token, $.user.id
2. GET  /api/products?search=   (read-heavy)
3. GET  /api/products/{id}      (read-heavy)
4. POST /api/cart               (transactional) [Bearer]
5. POST /api/apply-coupon       (transactional)
6. POST /api/checkout           (transactional) [Bearer]
7. POST /api/login (sai mk)     (auth-heavy)    -> nhánh phủ account-lockout
```

Phủ 3 nhóm §5: auth-heavy 2/7 · read-heavy 2/7 · transactional 3/7.

## Chạy

```bash
"D:/jmeter/apache-jmeter-5.6.3/bin/jmeter.bat" -n -t test-plans/23127183_Load_20260821.jmx -l results/jtl/out.jtl -e -o results/html/load -Jdatadir=data
```

**Luôn gọi từ thư mục gốc repo** — `datadir` mặc định là `data` (đường dẫn tương đối tính từ CWD).

Property ghi đè được: `-Jhost` (mặc định `localhost`) · `-Jport` (`3000`) · `-Jdatadir` (`data`) · và với **Load/Soak** (một thread group) thêm `-Jthreads` · `-Jduration` — dùng cho smoke test:

```bash
"D:/jmeter/apache-jmeter-5.6.3/bin/jmeter.bat" -n -t test-plans/23127183_Load_20260821.jmx -l results/jtl/smoke.jtl -Jthreads=2 -Jduration=40 -Jdatadir=data
```

Stress và Spike dùng giá trị cố định vì mỗi bậc/pha có số riêng — không ghi đè bằng `-Jthreads` được.

## Bốn quyết định thiết kế cần biết trước khi sửa plan

1. **Không dùng plugin ngoài.** Stress dựng bằng 4 `ThreadGroup` chuẩn cộng dồn qua `delay`+`duration`, **không** dùng Ultimate Thread Group (cần `jpgc-casutg`; TA mở trên JMeter sạch sẽ không mở được file).
2. **Mọi `CSVDataSet` để `shareMode.all` và đặt ở cấp Test Plan.** Mỗi thread lấy dòng **kế tiếp** → 200 VU ↔ 200 tài khoản, không có 2 VU dùng chung tài khoản (tránh tranh chấp ghi trên cùng dòng `users`). Đặt ở cấp Test Plan để 4 thread group của Stress dùng chung một pool.
3. **`users_lockout.csv` phải khai biến là `lock_email`,** không phải `email` — trùng tên với `users.csv` thì JMeter **ghi đè im lặng** và bước 1 sẽ đăng nhập bằng tài khoản mồi.
4. **Assertion bước 7 là `401|403` + Ignore Status.** Cả hai đều là hành vi đúng: 401 khi sai mật khẩu, 403 khi tài khoản đã bị khóa (`+2`/lần, ngưỡng `>=3`, khóa 180s). Không xử lý thì JMeter tính bước 7 là lỗi → error rate giả ~14%.

## Kiểm nhanh

```bash
grep -c "shareMode.all" test-plans/23127183_Load_20260821.jmx && grep -o 'guiclass="[A-Za-z]*Visualizer"\|guiclass="SummaryReport"\|guiclass="StatVisualizer"' test-plans/*.jmx | sort -u
```

Phải ra: 5 `shareMode.all`, và đúng 3 loại listener khác nhau giữa Load / Stress / Spike.

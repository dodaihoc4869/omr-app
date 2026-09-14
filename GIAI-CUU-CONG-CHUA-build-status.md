# GIẢI CỨU NGƯỜI YÊU CŨ — nhật ký build

*(tên hiển thị đổi 14-09; tên tệp và tên biến vẫn là `giai-cuu-cong-chua`)*

Đặc tả: `claude/GIAI-CUU-CONG-CHUA.md` (trong project MASTER DO DAI HOC)
Chỗ ở: **một màn trong app học sinh** — `StudentPortalScreen`, tab `game`.
Thay chỗ **Đấu Trường Hoá Chất**, đã gỡ hoàn toàn.

---

## 14-09-2026 — Đợt 1: gỡ Đấu Trường, dựng game, chơi một mình với 11 bot

### Đã gỡ

| Thứ | Trạng thái trước khi xoá |
|---|---|
| `src/game/dau-truong-hoa-chat/` (7 tệp, ~1 800 dòng) | **chưa được git theo dõi** — xoá là mất hẳn |
| `src/components/DauTruongGame.tsx` (1 655 dòng) | đã commit ở `079875d`, git lấy lại được |
| `src/game/firstperson/` | thư mục rỗng |

**Sao lưu trước khi xoá:** `/Volumes/SSD NGOÀI/_luu-dau-truong-hoa-chat-1409.tgz` (33 KB).
Muốn lấy lại: `tar xzf _luu-dau-truong-hoa-chat-1409.tgz -C omr-app/`.

### Đã dựng — 3 104 dòng

| Tệp | Việc |
|---|---|
| `hoa-chat.ts` | 12 hoá chất, ion, màu, bảng kết tủa — **nguồn sự thật duy nhất** |
| `bang-khac-che.ts` | 8 luật + `xuLyHoaChat()` thuần + 44 phương trình |
| `cau-hinh.ts` | mọi hằng số, cấm hard-code chỗ khác |
| `xu-ly-dam.ts` | luật dẫm hai tầng, hàm thuần |
| `man-choi.ts` | sinh đảo từ hạt giống, không `Math.random` |
| `bot.ts` | 11 bot, nhảy hụt thật, **không bao giờ chạm công chúa** |
| `rong.ts` | trùm 4 giai đoạn, đổi hoá chất mỗi khi mất máu |
| `van-choi.ts` | mô phỏng — **không một lệnh vẽ nào** |
| `ve-van.ts` | vẽ — **không đổi một giá trị nào của ván** |
| `hieu-ung.ts` | tệp DUY NHẤT được dùng `Math.random` |
| `am-thanh.ts` | Web Audio, 0 tệp âm thanh |
| `nhan-vat.ts` | vẽ người/công chúa/rồng bằng Bézier, 0 tệp ảnh |
| `GiaiCuuCongChuaGame.tsx` | vỏ React, gắn canvas một lần |

**Tách mô phỏng khỏi vẽ là quyết định quan trọng nhất của đợt này.** Nhờ nó mà
2 000 ván đánh trùm và 500 ván kiểm bot chạy được bằng `vitest`, không cần trình duyệt —
tức là mục 9 đặc tả tự chứng minh được thật, không phải hứa.

### Ba lỗi thật, đã truy nguyên nhân gốc

1. **Luật "cấm trùng chất" và luật "mất mạng được đổi chất" mâu thuẫn nhau.**
   Khi cả 12 còn sống thì không chất nào trống ⇒ màn chọn lại RỖNG đúng lúc em cầm
   chất yếu cần đổi nhất. Phép kiểm 500 ván bắt được (4 869 ca).
   **Chữa:** đổi chéo — lấy chất của ai thì người đó nhận lại chất của mình. Bộ chất
   luôn là một hoán vị nên không bao giờ trùng, mà lúc nào cũng có 11 lựa chọn.

2. **Viền cảnh báo bỏ sót ca trung hoà.** `biKhacChe()` hỏi "họ có khắc chế mình không",
   trong khi câu người chơi cần là "nhảy lên có mất mạng không" — trung hoà cũng mất một
   mạng mà không có viền nào báo. Phép kiểm 2 000 ca bắt được **214 ca**.
   **Chữa:** `canhBaoDam()` trả ba mức — an · trung hoà (cam) · bị khắc chế (đỏ).

3. **Rồng quay mặt sai hướng, phun lửa vào công chúa.** Chỉ nhìn ảnh chụp mới thấy.
   **Chữa:** lật ngang khi vẽ. Kèm theo: `veRong` nhận cường độ lửa 0..1 chứ không phải
   boolean — `tsc -b` bắt được chỗ truyền nhầm kiểu.

Thêm một chỗ đáng ghi: `tsc --noEmit -p tsconfig.json` **không** kiểm dự án app
(tsconfig gốc chỉ trỏ tới các project con). Cổng đúng là **`npx tsc -b`** — nó bắt
được 2 lỗi mà lệnh kia bỏ qua. Lần sau dùng `tsc -b`.

### Nghiệm thu

| # | Tiêu chí | Cách đo | Kết quả | Đạt |
|---|---|---|---|---|
| 1 | biên dịch nghiêm ngặt | `npx tsc -b` | 0 lỗi | ✅ |
| 2 | không tệp ảnh/âm thanh | `find src/game/... -regex ...` | 0 tệp | ✅ |
| 3 | 4 tư thế khác nhau ở 40 px | chồng ảnh, đếm điểm ảnh | 6/6 cặp ≥ 18% (thấp nhất 18,4%) | ✅ |
| 4 | luật dẫm, 10 000 ca | `vitest` | 0 ca đứng yên bị loại · 0 ca bay lên · 0 ca bất tử | ✅ |
| 5 | rồng hạ được 15–45% | 2 000 ván | **41,0%** (821/2000) | ✅ |
| 6 | bot không chạm công chúa | 500 ván | 0 lần | ✅ |
| 7 | bot nhảy hụt thật | 10 000 quyết định | lệch < 3% so với 0,62 | ✅ |
| 8 | ≥ 58 fps | — | **CHƯA ĐO** trên máy thật | ⏳ |
| 10 | không rò dữ liệu học sinh | `kiem-game.mjs` | 0 dòng | ✅ |
| 11 | không CDN | `kiem-game.mjs` | 0 dòng | ✅ |
| 12 | bảng phủ 66 cặp, đối xứng | `vitest` | 66/66, 0 lệch chiều | ✅ |
| 13 | mọi phương trình cân bằng | đếm nguyên tử 2 vế | **0/44 lệch** | ✅ |
| 14 | cặp trơ ≤ 35% | đếm | **33%** (22/66) | ✅ |
| 15 | không ai bị khoá chất | 500 ván | 0 ca thiếu lời mời | ✅ |
| 16 | cấm trùng chất | 500 ván | 0 ván trùng | ✅ |
| 17 | cảnh báo hiện đúng | 2 000 ca | 0 ca sai | ✅ |
| 18 | ba mức khó dần thật, không cấu hình chết | `vitest` | 6/6 trục đúng chiều | ✅ |
| 19 | quái không đi ra vực | 200 đảo × Thủ khoa | 0 con | ✅ |
| 20 | ba luật quái | `vitest` | đúng cả ba | ✅ |
| 21 | hoa khổng lồ 10 giây, ăn một lần | `vitest` | đúng | ✅ |
| 22 | ba mức chạy trọn, bot không chạm | 180 ván | 0 lần | ✅ |
| 23 | `vitest` 4 tệp game | `npx vitest run tests/giai-cuu-*` | **47/47** | ✅ |

**Lệnh chạy lại:**
```
npx tsc -b
npx vitest run tests/giai-cuu-cong-chua-hoa-hoc.test.ts \
                tests/giai-cuu-cong-chua-dam.test.ts \
                tests/giai-cuu-cong-chua-van.test.ts \
                tests/giai-cuu-cong-chua-quai-hoa.test.ts
node scripts/kiem-game.mjs
```

### Đợt 1b (cùng ngày) — ba mức độ · quái · hoa khổng lồ

Thầy thêm giữa chừng: *"Tạo 3 mức độ khó, trượt đại học, đỗ đại học và thủ khoa toàn
quốc nhé, có các con quái chạy lại chạm vào là mất một mạng, ăn hoa thì biến thành khổng
lồ trong 10 giây, khi biến thành khổng lồ thì chạy va vào ai người đó mất mạng hay quái
vật cũng mất mạng."*

| Tệp thêm | Việc |
|---|---|
| `do-kho.ts` | ba mức, **mọi con số độ khó nằm hết ở đây** |
| `quai-va-hoa.ts` | sinh quái tránh vực, đi tuần, va chạm, hoa khổng lồ |
| `nhan-vat.ts` (+180 dòng) | `veQuai` ba kiểu, `veHoa` sáu cánh |
| `tests/giai-cuu-cong-chua-quai-hoa.test.ts` | 16 phép kiểm |

| Mức | Quái | Tốc độ | Hoa | Bot đúng | Máu rồng | Cửa sổ hở |
|---|---|---|---|---|---|---|
| Trượt đại học | 8 | 70 | 10 | 42% | 2 | 2,0 s |
| Đỗ đại học | 16 | 110 | 6 | 62% | 3 | 1,5 s |
| Thủ khoa toàn quốc | 26 | 160 | 3 | 82% | 4 | 1,1 s |

**Hai lỗi nữa, đã sửa tận gốc:**

4. **Quái vẽ lơ lửng cao hơn mặt đất đúng 64 đơn vị.** `veQuai` vẽ CHÂN ở gốc, nhưng
   `ve-van.ts` truyền vào đỉnh đầu (`q.y + CAO_QUAI`). Chỉ nhìn ảnh chụp mới thấy.
5. **`giayHoRong` là cấu hình CHẾT** — khai trong `do-kho.ts` mà không ai đọc, nên ba mức
   có cùng cửa sổ hở. Đã nối vào `taoRong()`, và thêm phép kiểm "không có cấu hình chết".

Nghiệm thu thêm: **47/47** phép kiểm (4 tệp), `tsc -b` sạch phần game, cổng tĩnh đạt.

### Chưa làm — khai rõ

- **Nhiều người thật qua Durable Object: HOÃN sang đợt 2.** Đợt 1 chơi một mình với
  11 bot. Lý do: chơi được ngay mà không đụng hạ tầng máy chủ, và phần hoá học —
  thứ đáng giá nhất — không cần máy chủ mới chạy được.
- **Chưa đo fps trên máy thật** (tiêu chí 8).
- **Chưa phát hành.** Chưa `git push`, chưa deploy. Lý do ở dưới.
- Bảng xếp hạng chung: chưa làm.

### Chưa phát hành, vì

Lúc build, **một phiên Claude khác đang sửa dở cùng repo** — `ModalKhacPhucCauSai.tsx`,
`html-may-chieu.ts`, `server/src/*`, `tests/may-chieu-len-bang-1409.test.ts` đều có thay
đổi chưa commit. Đẩy lên lúc này là trộn việc dở của phiên kia vào bản live của học sinh.

Mọi tệp của game **không đụng** một tệp nào phiên kia đang sửa.


---

## Trạng thái git lúc kết phiên

**Chưa commit được.** `.git/index.lock` bị một phiên Claude khác giữ suốt buổi; HEAD đã
nhảy `3771e06 → 003f95e` trong lúc tôi làm, tức phiên kia đang commit liên tục.

Toàn bộ mã nằm trên đĩa, đã chạy qua mọi cổng. Lệnh commit khi lock nhả:

```
git add -- src/game/giai-cuu-cong-chua src/components/GiaiCuuCongChuaGame.tsx \
  src/components/DauTruongGame.tsx src/screens/StudentPortalScreen.tsx \
  tests/giai-cuu-cong-chua-*.test.ts tests/dau-truong-game-12-nguoi.test.ts \
  scripts/kiem-game.mjs GIAI-CUU-CONG-CHUA-build-status.md
git commit -m "Giai Cuu Nguoi Yeu Cu: thay cho Dau Truong Hoa Chat"
```

**Lùi:** `git revert <mã commit>` — hoặc lấy lại Đấu Trường bằng
`tar xzf /Volumes/SSD\ NGOÀI/_luu-dau-truong-hoa-chat-1409.tgz -C omr-app/`
kèm `git checkout 079875d -- src/components/DauTruongGame.tsx`.

**`tsc -b` còn 2 lỗi, KHÔNG phải của game:** `src/lib/ho-so-lop.ts(166)` thiếu trường
`btvn` — tệp đó là việc đang sửa dở của phiên kia, tôi không đụng vào.


---

## 14-09-2026 — Đợt 2: nhiều người thật qua Durable Object

### Thêm

| Tệp | Việc |
|---|---|
| `server-game/wrangler.toml` | Worker **`omr-game`** riêng — 0 D1, 0 R2, 0 secret |
| `server-game/src/index.ts` | định tuyến `/moi`, `/phong/<MÃ>`, `/khoe` |
| `server-game/src/phong.ts` | Durable Object: phòng chờ, nhịp 20 Hz, trọng tài |
| `src/game/…/giao-thuc.ts` | gói lên/xuống; máy khách CHỈ gửi phím |
| `src/game/…/may-chu.ts` | máy khách WebSocket, nội suy giữa hai ảnh |
| `src/game/…/bo-nguoi.ts` | tách dữ liệu 12 người khỏi mã vẽ |
| `src/game/…/dia-chi-may-chu.ts` | địa chỉ Worker (công khai, không phải bí mật) |
| `tests/…-giao-thuc.test.ts` | 14 phép kiểm giao thức và tầng đỏ |
| `server-game/kiem/*.mjs` | hai phép kiểm ĐẦU-CUỐI trên máy chủ chạy thật |

### Ba việc thầy thêm giữa chừng, đã làm

1. **Chỉ người sống sót cuối cùng được gặp rồng.** Còn hơn một người thì cửa hang đóng.
   Điều này **sửa một chỗ bản đợt 1 làm lệch** so với câu đầu tiên thầy nói.
2. **Cảnh mở đầu 6,5 giây**: màn tối, hai đốm mắt rồng, năm dòng chữ, kết bằng
   **DŨNG CẢM LÊN**. Âm rùng rợn: nốt trầm 55 Hz chồng 58 Hz (lệch 3 Hz nên tai nghe
   gờn gợn), thêm quãng tritone, rồi bốn tiếng gõ chậm dần như tim đập.
3. **Đổi tên hiển thị** thành *Giải Cứu Người Yêu Cũ*.

### Nghiệm thu đợt 2

| # | Tiêu chí | Kết quả | Đạt |
|---|---|---|---|
| 23 | máy khách không gửi được toạ độ | `GoiPhim` chỉ có loai·trai·phai·nhay·stt | ✅ |
| 24 | máy chủ chỉ đọc đúng 5 trường đó | quét `phong.ts` | ✅ |
| 25 | máy chủ game không chạm dữ liệu học sinh | 0 D1, 0 R2, 0 secret | ✅ |
| 26 | máy chủ dùng đúng bộ luật máy khách | import `van-choi.ts` | ✅ |
| 27a | hai người vào một phòng | ✓ | ✅ |
| 27b | cấm trùng chất trên máy chủ thật | B bị từ chối HCl | ✅ |
| 27c | chỉ chủ phòng đổi mức độ | ✓ | ✅ |
| 27d | ván mở sau 30 giây, đủ 12 người | ✓ | ✅ |
| 27e | nhịp ảnh ≈20/giây | **đo 20,4** | ✅ |
| 27f | gửi phím phải thì máy chủ dời mình | ✓ | ✅ |
| 27g | **gói giả tự dời 5 000 đơn vị bị bỏ qua** | ✓ | ✅ |
| 28 | `tsc -b` · `vitest` · `build` | 0 lỗi · **69/69** · build sạch | ✅ |

Lệnh chạy lại phần đầu-cuối: `bash server-game/kiem/chay.sh`

### CHƯA PHÁT HÀNH — cần thầy làm một việc

`npx wrangler whoami` trả về **"You are not authenticated"**. Máy chủ game chưa dựng
được, nên chế độ nhiều người **chưa dùng được thật**. Chơi một mình thì chạy bình thường.

Thầy chạy hai lệnh này, tôi làm nốt phần còn lại:

```
npx wrangler login                 # mở trình duyệt, thầy bấm cho phép
cd server-game && npx wrangler deploy
```

Tôi **không** tự đăng nhập thay thầy — đó là tài khoản Cloudflare giữ cả máy chủ thi.

Sau khi dựng xong, địa chỉ mặc định trong `dia-chi-may-chu.ts` là
`https://omr-game.ttadodaihoc.workers.dev`. Khác thì sửa một dòng ở tệp đó.

### Chưa làm

- Bảng xếp hạng chung: chưa.
- Dự đoán tại máy khách: **cố ý chưa làm**, lý do ở mục 3D đặc tả.
- fps trên máy thật: chưa đo.

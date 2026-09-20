# Hợp đồng PROP — ĐẢO THẦN THÚ bản mới (Code 6 viết 21/09 · Code 5 nối vào `Game.tsx`)

Mã ở `src/game/than-thu-v2/dao/` (Code 6 giữ). `Game.tsx` chỉ cần nạp lazy MỘT component vỏ; mọi màn con (chọn thú, đảo, thám hiểm, sổ tay, túi đồ) + thanh điều hướng dưới nằm trong vỏ. Máy chủ: `docs/hop-dong-dao-than-thu-may-chu-2109.md` (Code 5).

```tsx
const DaoThanThu = lazy(() => import('./dao/DaoThanThu'))
// thay cho: khối `profile.choice ? <Chọn bạn đồng hành cũ>`, khối `tab==='home'` (mission-dashboard + spirit-hero), và `tab==='learn'` khi mode là adventure/repair
{profile && tab === 'home' && <Suspense fallback={<p role="status" className="spirit-status">Đang mở đảo…</p>}>
  <DaoThanThu sbd={sbd} profile={profile} doanMo={doanMo} call={request} exp={exp} tasks={tasks}
    moiDoan={doanMo && manDau === 'doan'} onMoDoan={() => setTab('doan')} onMoVoDai={() => setTab('arena')} onMoTienBo={() => setTab('progress')} onDong={onDong} />
</Suspense>}
```

## `DaoThanThuProps` (khai ở `dao/kieu.ts`)
| prop | kiểu | ý nghĩa |
|---|---|---|
| `sbd` | `string` | chỉ để chọn thẻ mở đầu ở màn chọn thú (mỗi em một thẻ khác nhau) và khoá bộ nhớ tạm |
| `profile` | `Profile` của `Game.tsx` (đọc: `nickname, pet, choice, cap, exp, wallet, mastery[], shields`) | `choice===true` ⇒ vỏ hiện màn **Chọn bạn đồng hành**; ngược lại hiện đảo |
| `doanMo` | `boolean` | `false` ⇒ thanh dưới KHÔNG có mục Đoàn |
| `call` | `(action, data?) => Promise<Result>` = `request` của `Game.tsx` | vỏ tự gọi `choose` → (`rename` nếu em đặt tên) · `sync`* → `start` · `resume` · `answer` · `complete` · `shield-use` · `rename` · `invest`. Giữ nguyên hành vi: ném `Error` khi `!ok`, tự `setProfile`. Vỏ tự quản cờ bận + lỗi của mình |
| `exp?` | `{homNay:number; manhKhien:{manh,moiKhien,khienConLai}\|null} \| null` (= `DuLieuExp` của `nhiem-vu-adapter`) | EXP MỚI + mảnh khiên. Vắng/`null` ⇒ ẩn chip "EXP hôm nay" và mục tiêu "Rèn khiên" (không bịa số). **Cần Code 5/Code 3 cho biết lấy ở đâu trong cây Game** — nếu `profile` của game-v2 chưa có thì cổng HS truyền xuống qua prop của `Game` |
| `chuoiNgay?` | `number` | chuỗi ngày học; vắng ⇒ ẩn chip |
| `tasks?` | `{id,dang}[]` | "Gia đình nhắc em ôn" → thẻ trên đảo, chạm = `start('repair', dang)` |
| `moiDoan?` | `boolean` | em vào từ cửa Đoàn mà chưa chọn thú ⇒ thêm dòng mời ở màn chọn |
| `onMoDoan` | `() => void` | chạm mục Đoàn ở thanh dưới |
| `onMoVoDai?`, `onMoTienBo?` | `() => void` | lối sang Võ đài / Tiến bộ (hiện thành 2 dòng trong Túi đồ; vắng ⇒ ẩn) |
| `onDong` | `() => void` | "Về app học sinh" |

## Điều `Game.tsx` cần làm khi nối
1. Khi `tab==='home'` (và khi vỏ đang chạy thám hiểm): ẨN `spirit-header`, `spirit-nav`, dòng `spirit-status` — đảo có đầu trang + thanh dưới riêng. Các tab `doan/arena/progress/coming` giữ nguyên như cũ.
2. Bọc ngoài vẫn là `<section className="spirit-game">`: CSS của đảo đã tự thắng `.spirit-game button{…}` (mọi bộ chọn đứng sau `.dao`, trạng thái nút đi qua biến `--nut-*`). Nên cho đảo tràn mép: bỏ `padding` của `.spirit-game` khi ở tab home (vd thêm lớp `spirit-game-dao`).
3. Chọn thú chỉ MỘT lần (luật máy chủ `choose`) — màn mới không hứa "đổi thần thú"; tên thì đổi được (`rename`).
4. `start`/`answer`: vỏ đọc `questions[].role` và `lyDoThuong` nếu có; chưa có thì tự suy bằng `ly-do-thuong.ts` (của Code 5) và `stage`.

## TRẠNG THÁI 21/09: ĐỦ 4 MÀN + VỎ — nối được trọn một lần
- Vỏ: `dao/DaoThanThu.tsx` (default export). Màn con: `ChonBanDongHanh`, `DaoCuaEm`, `ThamHiem` (`DaiAi`, `SanDau`), `SoTay`, `TuiDo`; lõi thuần `dao-core.ts`; kiểu `kieu.ts`; ảnh `anh.ts`; CSS `dao.css`.
- Vỏ TỰ bọc `.dao` (màn con đứng riêng thì phải có tổ tiên `.dao`). Khi đang thám hiểm vỏ ẩn thanh dưới; "Về đảo" giữ lượt dở, LÊN ĐƯỜNG lần sau đi tiếp.
- Thứ tự lệnh vỏ gọi (test `tests/dao-than-thu-vo.test.tsx` khoá): mở đảo → `recommendations` + `so-tay` (đọc-chỉ, hỏng thì bỏ qua) · LÊN ĐƯỜNG → `resume` (có lượt adventure/repair còn ải chưa làm ⇒ đi tiếp, KHÔNG sync/start; lượt đã làm hết ⇒ `complete`) → `sync` lặp tới `remaining=0` → `start {mode, dang}` · mỗi ải `answer {session,qid,answer,assisted}` · ải cuối `complete {session}` → `recommendations` · gia đình nhắc ôn → `start {mode:'repair', dang}` (không resume) · `invest`, `rename {name}`, `shield-use {useId}` y như cũ.
- `call` KHÔNG cần ổn định danh tính (vỏ giữ qua ref). `call` phải NÉM Error khi `ok:false` (như `request` hiện tại).
- `questions[].role` vắng (Worker cũ / `resume`) ⇒ ải tính là "Luyện đều". `lyDoThuong` vắng ⇒ vỏ tự suy bằng `lyDoThuongTuKetQua` (cùng câu chữ với `ly-do-thuong.ts`).
- Lượt của Võ đài (`mode:'arena'`) KHÔNG đi qua vỏ — `Game.tsx` giữ tab `learn` cũ cho arena.
- Gói thêm (đo esbuild, cận trên vì gộp cả `core.ts`/`ImmortalShield` vốn đã ở gói Game): JS 17,9 KB + CSS 7,2 KB gzip = 25 KB ≤ 40 KB. Nạp `lazy()`.
- Xem thử khi `npm run dev`: `/src/game/than-thu-v2/dao/xem-thu.html?man=vo[&chuachon][&doan]` (vỏ thật + máy chủ giả), `?man=chon|dao|tham|so-tay|tui`.

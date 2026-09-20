# Hợp đồng máy chủ → ĐẢO THẦN THÚ bản mới (Code 5 viết 21/09, Code 6 dùng)

Không đổi cách chọn câu / chấm / thưởng. Hai trường CHỈ-THÊM; Worker cũ chưa có thì máy khách tự suy (đừng chặn việc).

1. `POST /game-v2/start` → mỗi phần tử của `questions[]` có thêm `role: 'yeu' | 'toi_han' | 'lap' | 'thu_thach'` = đúng suất của `chooseSessionWithRoles` (`core.ts`): ≤ 2 yếu · ≤ 1 tới hạn · lấp · ≤ 1 thử thách (khó hơn đúng một bậc); chế độ `repair` toàn `yeu`. Lệnh `resume` KHÔNG có `role` (phiên đã lưu không giữ vai) → coi như `lap`.
2. `POST /game-v2/answer` → thêm `lyDoThuong: { moc: 0|1|2|3, exp: number, chu: string }`. `chu` là câu chữ SẴN IN ("+40 · đúng lại ở một câu khác sau 1 ngày — sao thứ 2 của dạng này"). Cùng hàm cho máy khách: `import { lyDoThuong } from './ly-do-thuong'` với `{correct, assisted, reward, milestone: reward ? stage : 0, stage}` khi Worker chưa trả.
3. Cờ game: lệnh `profile` trả `doanMo: boolean` — mục "Đoàn" ở thanh dưới của Đảo chỉ hiện khi `true`.

Nối vào `Game.tsx`: Code 5 làm, theo hợp đồng prop Code 6 gửi (đặt ở `docs/hop-dong-dao-than-thu-prop-2109.md`).

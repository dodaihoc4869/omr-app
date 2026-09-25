-- CNH-1.0 P08 — HẤP THỤ · CẤP · KHIÊN · MẢNH · VÍ (CHỈ-THÊM, NỘI BỘ, CHƯA KÍCH HOẠT).
--
-- ⚠️ PHẠM VI: chỉ TẠO BẢNG MỚI cho P08. KHÔNG sửa/đọc bảng cũ (`cnh_exp_account`, `cnh_exp_day`,
-- `cnh_exp_grant_ledger`, `game_v2_profile`, `exp_so`, `luot`, `ca`, …). KHÔNG bật cutover.
-- Tệp lùi: `server/lui-2309-cnh-exp-p08.sql` (DROP đúng các đối tượng dưới đây).
--
-- ⚠️ VÌ SAO BẢNG RIÊNG, KHÔNG `ALTER` `cnh_exp_account`: bảng đó là VÍ của P07 và đã có ràng buộc
-- tiền tệ đã kiểm chứng; thêm cột bằng `ALTER TABLE` không xoá được bằng `DROP TABLE` (lùi phải
-- giữ nguyên hình dạng bảng cũ ⇒ phải dựng lại bảng, rủi ro cao). Bảng P08 tách riêng ⇒ lùi SẠCH.
--
-- ⚠️ RÀNG BUỘC SỐ: mọi cột tiền/đếm/phiên bản đều có `typeof(col) = 'integer'` (SQLite nhận 1.5
-- thành REAL, kiểm khoảng `>= 0` KHÔNG đủ để chứng minh số nguyên). Cờ 0/1 dùng `IN (0, 1)`.
-- Ghi sai ⇒ lỗi SQL cứng (fail-closed), không âm thầm 0 hàng.

-- Một hàng mỗi học sinh: trạng thái kinh tế P08 + CAS `revision`.
--
-- ⚠️ TỪ VỰNG (`03` §1, "Các con số có một nguồn"): `wallet_exp` = ví chưa hấp thụ (ở `cnh_exp_account`
-- của P07, KHÔNG chép lại đây), `invested_exp` = EXP ĐÃ hấp thụ (cột dưới), `gold` = vàng đã đổi.
-- §9.1 gọi `invested_exp` là "progress"; §6 viết "invested/progress/level" — hai từ chỉ CÙNG một số.
-- Tên cột theo §1 vì §1 mới là mục chốt từ-điển. `level` VẪN ĐƯỢC LƯU vì §9.1 liệt kê nó trong
-- snapshot chuyển dữ liệu, NHƯNG nó là số SUY RA: lệnh ghi PHẢI để cửa canh kiểm
-- `level = capTuInvestedExp(invested_exp).level` trong cùng giao dịch (không tin hai số tự khớp).
-- `absorbed_day` giữ NGÀY VN của `absorbed_today`; đổi ngày ⇒ caller PHẢI đặt lại `absorbed_today = 0`
-- trong CÙNG giao dịch (ràng buộc "cùng ngày" kiểm ở tầng lệnh, xem `cnh_exp_p08_guard`).
CREATE TABLE IF NOT EXISTS cnh_exp_p08_state (
  student_id           TEXT    NOT NULL PRIMARY KEY,
  absorbed_day         TEXT    NOT NULL DEFAULT '',
  -- Trần ngày tối đa là `achievedAbsorbCap = 200` (`03` §6) ⇒ 201 là trạng thái hỏng, chặn ở SQL.
  absorbed_today       INTEGER NOT NULL DEFAULT 0 CHECK (typeof(absorbed_today)   = 'integer' AND absorbed_today   >= 0 AND absorbed_today   <= 200),
  -- Trần theo `03` §6: tổng đường cấp = `tongExpToiCap(120)` = 238 200 ⇒ không vượt được.
  invested_exp         INTEGER NOT NULL DEFAULT 0 CHECK (typeof(invested_exp)     = 'integer' AND invested_exp     >= 0 AND invested_exp     <= 238200),
  level                INTEGER NOT NULL DEFAULT 1 CHECK (typeof(level)            = 'integer' AND level            >= 1 AND level            <= 120),
  -- ⚠️ `fragment_balance` và `achieved_days` là số DẪN XUẤT. `03` §7.1: *"Số fragment và ngày đạt chỉ
  -- lấy từ LEDGER SERVER"* ⇒ lưu ở đây chỉ để CAS + snapshot §9.1, KHÔNG phải nguồn sự thật.
  -- Lệnh ghi PHẢI đối soát với sổ trong CÙNG giao dịch (đừng tin cột):
  --   achieved_days    = số hàng `achieved_fragment` của học sinh
  --   fragment_balance = Σ delta(sổ mảnh) − fragmentsPerShield × Σ shields_delta(sổ tiêu)
  fragment_balance     INTEGER NOT NULL DEFAULT 0 CHECK (typeof(fragment_balance) = 'integer' AND fragment_balance >= 0 AND fragment_balance <= 9007199254740991),
  -- ⚠️ KHÔNG có `CHECK (unused_shields <= 5)`: `03` §9.1 — "Giữ mọi khiên cũ, kể cả vượt 5". Trần 5 là
  -- luật CẤP (`xetKhien` trong `cnh-exp-p08.ts`), KHÔNG phải ràng buộc cột; chặn ở cột sẽ làm hồ sơ cũ
  -- có 6 khiên KHÔNG THỂ chuyển vào ⇒ mất tài sản của em.
  unused_shields       INTEGER NOT NULL DEFAULT 0 CHECK (typeof(unused_shields)   = 'integer' AND unused_shields   >= 0 AND unused_shields   <= 9007199254740991),
  used_shields         INTEGER NOT NULL DEFAULT 0 CHECK (typeof(used_shields)     = 'integer' AND used_shields     >= 0 AND used_shields     <= 9007199254740991),
  first_shield_claimed INTEGER NOT NULL DEFAULT 0 CHECK (typeof(first_shield_claimed) = 'integer' AND first_shield_claimed IN (0, 1)),
  -- `03` §9.2: trạng thái quyền khiên ĐẦU là BA nhánh, KHÔNG phải boolean:
  -- `none` (chưa từng nhận) · `claimed` (đã nhận) · `legacy_unresolved` (không đủ bằng chứng ⇒ chờ đối chiếu).
  -- `first_shield_claimed` ở trên là cờ DÙNG LÚC CHẠY (§7.1); cột này là SỔ CHUYỂN TIẾP, tách riêng.
  first_claim_status   TEXT    NOT NULL DEFAULT 'none' CHECK (first_claim_status IN ('none', 'claimed', 'legacy_unresolved')),
  -- `03` §9.2: "Có số dư mảnh đáng tin nhưng KHÔNG ghép được quà/rèn ⇒ giữ nguyên trong
  -- `legacy_pending_fragments`, KHÔNG xóa và KHÔNG tự tiêu." Tách khỏi `fragment_balance` đang tiêu được.
  legacy_pending_fragments INTEGER NOT NULL DEFAULT 0 CHECK (typeof(legacy_pending_fragments) = 'integer' AND legacy_pending_fragments >= 0 AND legacy_pending_fragments <= 9007199254740991),
  achieved_days        INTEGER NOT NULL DEFAULT 0 CHECK (typeof(achieved_days)    = 'integer' AND achieved_days    >= 0 AND achieved_days    <= 9007199254740991),
  gold                 INTEGER NOT NULL DEFAULT 0 CHECK (typeof(gold)             = 'integer' AND gold             >= 0 AND gold             <= 9007199254740991),
  revision             INTEGER NOT NULL DEFAULT 0 CHECK (typeof(revision)         = 'integer' AND revision         >= 0 AND revision         <= 9007199254740991),
  cap_nhat_luc         TEXT    NOT NULL DEFAULT (datetime('now')),
  -- `03` §9.2: `first_claim_status` là NGUỒN, cờ `first_shield_claimed` là số SUY RA từ nó
  -- (`claimed` ⇒ 1; `none`/`legacy_unresolved` ⇒ 0). CHECK này chặn hàng tự mâu thuẫn.
  CHECK ((first_claim_status = 'claimed' AND first_shield_claimed = 1)
      OR (first_claim_status <> 'claimed' AND first_shield_claimed = 0))
);

-- Sổ MẢNH — CHỈ GHI PHẦN KIẾM: một hàng mỗi NGÀY ĐẠT. `03` §7.1 chốt khoá
-- `(student_id, learning_day, achieved_fragment)`, nên UNIQUE dưới đây KHỚP ĐÚNG khoá đó và KHÔNG gộp
-- `policy_version` vào khoá: một ngày gốc chỉ có MỘT phiên bản chính sách (`03` §9.1), nên cấp mảnh
-- lần hai cho cùng ngày — kể cả dưới phiên bản khác — KHÔNG thể cộng đôi. `policy_version` vẫn là CỘT
-- dữ liệu để đối soát. `studied` KHÔNG cho mảnh (`03` §7.1) nên không có loại `studied`.
--
-- ⚠️ §7.1 "khi có correction hợp lệ TRẢ LẠI CÙNG QUYỀN, KHÔNG TẠO NGÀY THỨ HAI": khoá `(student,
-- learning_day, kind)` là thứ bắt điều đó. Correction đảo achieved→studied rồi lại achieved ⇒ hàng của
-- NGÀY ĐÓ vẫn chỉ MỘT (tầng lệnh hoặc xoá/khôi phục đúng hàng cũ, KHÔNG chèn hàng ngày mới).
-- Tầng lệnh (chưa làm) PHẢI ghi/khôi phục theo đúng khoá này, không tự sinh khoá thứ hai.
CREATE TABLE IF NOT EXISTS cnh_exp_fragment_ledger (
  entry_id       TEXT    NOT NULL PRIMARY KEY,
  student_id     TEXT    NOT NULL,
  learning_day   TEXT    NOT NULL,
  policy_version TEXT    NOT NULL,
  kind           TEXT    NOT NULL CHECK (kind IN ('achieved_fragment')),
  delta          INTEGER NOT NULL CHECK (typeof(delta) = 'integer' AND delta > 0 AND delta <= 9007199254740991),
  execution_id   TEXT    NOT NULL,
  tao_luc        TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (student_id, learning_day, kind)
);

-- Sổ TIÊU: một hàng mỗi LỆNH tiêu (`03` §7 rèn khiên, §8 đổi vàng). `UNIQUE(student_id, command_type,
-- request_id)` làm lệnh trùng KHÔNG thể trừ hai lần (cùng "chìa khoá yêu cầu" ⇒ một hàng, lần sau
-- là replay đọc `cnh_exp_command`). `exp_delta <= 0` ⇒ sổ tiêu không bao giờ CỘNG ví.
-- `shields_delta ∈ {0,1}`: một lệnh đổi TỐI ĐA một khiên (không gộp nhiều khiên một lệnh).
--
-- `claim_index` (`03` §7.1 "Ghi claim_index và receipt duy nhất"): số thứ tự khiên của học sinh
-- (1, 2, 3, …). `UNIQUE (student_id, claim_index)` là thứ bảo đảm "Hai máy gọi quà/rèn ngày 21
-- CHỈ nhận 1 khiên" NGAY Ở TẦNG SQL: hai lượt đồng thời tính cùng `claim_index` ⇒ một lượt lỗi
-- UNIQUE, không thể cấp hai khiên. `claim_index` là `NULL` với lệnh đổi vàng (SQLite cho phép
-- nhiều `NULL` trong UNIQUE ⇒ các hàng đổi vàng không đụng nhau); CHECK bảng buộc đúng tương quan.
CREATE TABLE IF NOT EXISTS cnh_exp_spend_ledger (
  entry_id        TEXT    NOT NULL PRIMARY KEY,
  student_id      TEXT    NOT NULL,
  command_type    TEXT    NOT NULL CHECK (command_type IN ('doi_vang', 'ren_khien', 'dung_khien')),
  request_id      TEXT    NOT NULL,
  claim_index     INTEGER          CHECK (claim_index IS NULL OR (typeof(claim_index) = 'integer' AND claim_index >= 1 AND claim_index <= 9007199254740991)),
  exp_delta       INTEGER NOT NULL CHECK (typeof(exp_delta)      = 'integer' AND exp_delta       <= 0 AND exp_delta       >= -9007199254740991),
  gold_delta      INTEGER NOT NULL DEFAULT 0 CHECK (typeof(gold_delta)     = 'integer' AND gold_delta      >= 0 AND gold_delta      <= 9007199254740991),
  fragments_delta INTEGER NOT NULL DEFAULT 0 CHECK (typeof(fragments_delta) = 'integer' AND fragments_delta <= 0 AND fragments_delta >= -9007199254740991),
  -- `+1` = khiên được CẤP (rèn/quà); `-1` = khiên bị TIÊU khi dùng trong game (§7.2), kèm `cnh_exp_command` làm usage receipt.
  shields_delta   INTEGER NOT NULL DEFAULT 0 CHECK (typeof(shields_delta)  = 'integer' AND shields_delta   IN (-1, 0, 1)),
  execution_id    TEXT    NOT NULL,
  tao_luc         TEXT    NOT NULL DEFAULT (datetime('now')),
  CHECK ((command_type = 'ren_khien' AND claim_index IS NOT NULL)
      OR (command_type IN ('doi_vang', 'dung_khien') AND claim_index IS NULL)),
  UNIQUE (student_id, command_type, request_id),
  UNIQUE (student_id, claim_index),
  UNIQUE (execution_id)
);

-- QUYẾT ĐỊNH CHÍNH SÁCH LÚC CHUYỂN (`03` §9.1): *"Policy decision lưu
-- `(student_id, effective_at, old_policy, new_policy, migration_id)`"* + snapshot trước chuyển.
--
-- Một hàng mỗi học sinh (v1): chuyển xong thì KHÔNG chuyển lại. `migration_id` là khoá idempotent —
-- chạy lần hai CÙNG `migration_id` ⇒ 0 hàng chèn (no-op), tài sản không đổi.
-- `snapshot_json`/`snapshot_hash` giữ BẰNG CHỨNG số cũ; `ket_qua_json` giữ kết quả tính lại.
CREATE TABLE IF NOT EXISTS cnh_exp_p08_chuyen_doi (
  student_id     TEXT    NOT NULL PRIMARY KEY,
  migration_id   TEXT    NOT NULL,
  effective_at   TEXT    NOT NULL,
  old_policy     TEXT    NOT NULL,
  new_policy     TEXT    NOT NULL,
  snapshot_json  TEXT    NOT NULL,
  snapshot_hash  TEXT    NOT NULL,
  ket_qua_json   TEXT    NOT NULL,
  so_ngay_dat    INTEGER NOT NULL CHECK (typeof(so_ngay_dat) = 'integer' AND so_ngay_dat >= 0 AND so_ngay_dat <= 9007199254740991),
  tao_luc        TEXT    NOT NULL DEFAULT (datetime('now'))
  -- ⚠️ KHÔNG `UNIQUE (migration_id)`: `03` §9.3 chốt *"Migration id duy nhất THEO student/version"*
  -- — không phải duy nhất toàn cục. Đợt chuyển hàng loạt có thể dùng CÙNG một `migration_id` cho
  -- nhiều học sinh; ràng buộc toàn cục sẽ làm em thứ hai KHÔNG chuyển được. Khoá idempotent ở đây
  -- là `student_id` (PRIMARY KEY) + đối chiếu `migration_id` ở tầng lệnh.
);

-- Cửa canh BẤT BIẾN trong-giao-dịch của P08 (cùng khuôn `cnh_exp_guard` của P07 nhưng TÁCH RIÊNG để
-- hai đường ghi không giẫm lên nhau). Lệnh chèn MỘT hàng khi đã chiếm được CAS (`cnh_exp_command`);
-- bất biến tính trong `CASE WHEN … THEN 1 ELSE 0`, CHỈ phép thử "đã chiếm CAS" nằm ở WHERE ngoài,
-- nên lượt THUA CAS chèn 0 hàng (no-op). `CHECK (ok = 1)` biến bất biến hỏng thành LỖI SQL cứng,
-- nên "hỏng mà im lặng" là BẤT KHẢ.
CREATE TABLE IF NOT EXISTS cnh_exp_p08_guard (
  execution_id TEXT    NOT NULL PRIMARY KEY,
  ok           INTEGER NOT NULL CHECK (ok = 1),
  tao_luc      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cnh_exp_fragment_student ON cnh_exp_fragment_ledger (student_id, learning_day);

-- ĐỐI CHIẾU NHÁNH `legacy_unresolved` (`03` §9.2): *"Giáo viên đối chiếu có evidence và
-- `legacy_resolution_id`: nếu chứng minh quyền free còn thiếu, cấp MỘT voucher free theo mốc lịch sử
-- đủ điều kiện, KHÔNG đụng mảnh mới; nếu đã nhận thì đóng pending. Voucher chỉ cấp MỘT LẦN và vẫn
-- tôn trọng kho 5. Nếu thiếu bằng chứng mãi, giữ pending."*
--
-- ⚠️ Khoá idempotent là `(student_id, legacy_resolution_id)` — id đối chiếu duy nhất THEO HỌC SINH
-- (KHÔNG `UNIQUE` toàn cục, cùng bài học như `migration_id`).
CREATE TABLE IF NOT EXISTS cnh_exp_p08_giai_quyet (
  student_id           TEXT    NOT NULL,
  legacy_resolution_id TEXT    NOT NULL,
  ket_luan             TEXT    NOT NULL CHECK (ket_luan IN ('da_nhan', 'con_thieu')),
  giao_vien            TEXT    NOT NULL,
  voucher_cap          INTEGER NOT NULL DEFAULT 0 CHECK (typeof(voucher_cap) = 'integer' AND voucher_cap IN (0, 1)),
  ket_qua_json         TEXT    NOT NULL,
  luc                  TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (student_id, legacy_resolution_id)
);

CREATE INDEX IF NOT EXISTS idx_cnh_exp_spend_student    ON cnh_exp_spend_ledger (student_id, command_type);

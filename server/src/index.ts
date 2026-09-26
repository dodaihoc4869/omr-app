// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
import { emCoGhi, keHoachCoDem } from './dem-ke-hoach'
// Removed due to missing dependency
// Removed due to missing dependency
import {qidTuLuanCuaTo} from './cam-tu-luan'
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
import {ghiLoiMay} from './nhat-ky-may'
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// MÁY CHỦ MỚI — bốn lệnh nóng lúc thi (MAY-CHU-MOI.md).
//
// BA LUẬT KHÔNG ĐƯỢC PHÁ:
//   1. Mỗi endpoint dùng 1–3 câu truy vấn. Trần D1 miễn phí là 50 câu một lượt
//      gọi Worker, và vòng lặp truy vấn theo số em là đường chắc chắn chạm trần.
//   2. Gói đề KHÔNG nằm trong D1 (trần 2 MB một dòng, kho thầy đã 2,1 MB) —
//      nằm ở R2, D1 chỉ giữ khoá đối tượng.
//   3. Lệnh của HỌC SINH không đòi mã bí mật (giống Apps Script hiện nay);
//      lệnh của THẦY thì đòi. Không nới luật này ở bất kỳ đâu.
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
import * as AI from './bo-nao'
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency
// Removed due to missing dependency

// CORS — app chạy ở `dodaihoc4869.github.io`, Worker ở `workers.dev`, nên MỌI
// lượt gọi đều là chéo nguồn. Thiếu mấy dòng này là trình duyệt chặn sạch và
// máy em chỉ thấy "lỗi mạng" — không có cách nào đoán ra từ phía em.
//
// Mở cho mọi nguồn, đúng như Apps Script đang làm: lệnh của học sinh vốn không
// đòi mã bí mật, khoá theo nguồn không thêm an toàn mà chỉ thêm chỗ hỏng.
// Removed due to missing dependency
// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// ---------------------------------------------------------------- HỌC SINH

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// ------------------------------------------------------------------- THẦY

// Removed due to missing dependency

/** Thầy bấm BẮT ĐẦU THI — cả lớp nhận đề đúng một thời điểm. */
async function batDauThi(env: Env, maCa: string, dongBoGio?: unknown): Promise<Response> {
  // Removed due to missing dependency
  // Removed due to missing dependency
  // Removed due to missing dependency
  // Removed due to missing dependency
  // Removed due to missing dependency
  // Removed due to missing dependency
  // Removed due to missing dependency
  // Removed due to missing dependency
  // Lặp yêu cầu hoặc hai máy cùng bấm đều giữ mốc và lựa chọn của lần đầu.
  // Removed due to missing dependency
  // Removed due to missing dependency
  const luc = new Date().toISOString()
  // Removed due to missing dependency
  xoaDemCaBaoVe() // HẠ TẢI D1 (Boss 22/09): ghi bảng `ca` ⇒ bỏ đệm `protectedQuestions` ngay
  // Removed due to missing dependency
  // Removed due to missing dependency
  return ra({ ok: true, batDauLuc: daLuu.bat_dau_thi_luc, daBatTruoc: r.meta.changes === 0,
    canBoTheoEm, coBoTheoEm, dongBoGio: Number(daLuu.dong_bo_gio) === 1 })
}

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// ---------------------------------------------------------------------------
// DANH SÁCH LỚP — cổng chặn số báo danh lạ, 11/09.
//
// Bên Apps Script, `vaoThi` chặn em không có trong `DanhSachLop`. Worker chưa
// có cổng ấy, nên chuyển vào thi sang đây mà quên nó là ai có mã ca cũng gõ
// một số báo danh bất kỳ rồi vào thi được.
//
// LUẬT GIỮ NGUYÊN TỪ APPS SCRIPT: bảng RỖNG thì KHÔNG chặn ai. Thầy chưa kịp
// đẩy danh sách mà cả lớp đứng ngoài cửa là hỏng nặng hơn hẳn việc thiếu cổng.
// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// ===========================================================================
// BÀI TẬP VỀ NHÀ — dựng mới trọn trên máy chủ mới.
// Đặc tả: claude/PHAN-CONG-GIAO-BTVN.md
// ===========================================================================

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// ===========================================================================
// KHỐI C — KHO ĐỀ
//
// Đây là thứ DUY NHẤT phải chuyển sang NGUYÊN VẸN (thầy chốt 11/09 tối: "đẩy
// kho đề sang nguyên vẹn cho tôi là được, còn lại dựng lại hết"). Mọi bảng khác
// bắt đầu từ rỗng.
//
// CHỖ ĐỂ: gói đề đầy đủ nằm ở R2 `kho/<ma_de>.json` — một đề có ảnh và lời giải
// tới vài trăm KB, nhét vào D1 là sai chỗ. D1 chỉ giữ CHỈ MỤC để tra nhanh:
// câu nào thuộc chuyên đề nào, mức độ nào, ở đề nào.
//
// LUẬT ĐỎ: gói trong `kho/` CÓ ĐÁP ÁN và CÓ LỜI GIẢI. Nó chỉ ra bằng đường đòi
// mã bí mật. Đường công khai `GET /de/:maCa` phục vụ máy em là gói ĐÃ CẮT ĐÁP
// ÁN, dựng riêng lúc mở ca — hai thứ khác nhau, đừng bao giờ trộn.
// ===========================================================================

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// ===========================================================================
// KHỐI A — CHẤM ĐIỂM TRỌN VẸN TRÊN MÁY CHỦ MỚI
//
// Thay `ghiDiem` bên Apps Script, và thay luôn cả chuỗi việc nó kéo theo:
// chi tiết từng câu · tiến độ theo ca · tiến độ tổng (bảng mạnh–yếu) · danh
// sách câu đã làm · bản đồ câu sai.
//
// LUẬT PHẢI KHỚP APPS SCRIPT, KHÔNG ĐƯỢC XÊ MỘT LY — đây là chỗ sinh ra bảng
// mạnh–yếu, mà bảng ấy quyết định em được phát câu nào để luyện:
//
//   1. `tien_do_ca` khoá theo (ca, em, chuyên đề), lưu SỐ CÂU và SỐ SAI.
//   2. `tien_do_hs` KHÔNG cộng dồn từng lần. Nó được TÍNH LẠI TỪ ĐẦU bằng cách
//      cộng mọi dòng `tien_do_ca` của em ấy. Cộng dồn thì chấm lại một ca là
//      cộng hai lần — đúng lỗi đã làm điểm ca 447479 sai ba lần hôm 09/09.
//   3. Chuyên đề lần chấm trước có, lần này không còn ⇒ dòng ấy về 0, không xoá.
//   4. `qid_da_lam` là HỢP TẬP, không bao giờ bớt đi.
// ===========================================================================

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

/** GỌI LÊN BẢNG — ghi một câu chữa tại lớp vào bảng mạnh–yếu, KHÔNG tạo lượt
 * thi giả và KHÔNG đụng điểm số. Đúng khuôn `ghiLenBang` bên Apps Script. */
async function ghiLenBangMoi(env: Env, b: Record<string, unknown>): Promise<Response> {
  // Removed due to missing dependency
  const chuyenDe = String(b.chuyenDe ?? '').trim()
  // Removed due to missing dependency
  // Removed due to missing dependency
  // Removed due to missing dependency
  const qid = String(b.qid ?? '').trim()

  // `giayThuc` (tuỳ chọn, hợp đồng docs/hop-dong-giay-thuc-len-bang-1909.md): số hữu hạn 20..1800 thì ghi, còn lại ghi NULL. KHÔNG BAO GIỜ từ chối lệnh ghi vì trường này.
  const giayTho = b.giayThuc
  // Removed due to missing dependency
  // Removed due to missing dependency
  // Removed due to missing dependency
  // Removed due to missing dependency
  try {
    // Removed due to missing dependency
  } catch (e) {
    // Chưa chạy migration-1909-len-bang-giay-thuc.sql (cột `giay_thuc` chưa có): ghi như cũ, bỏ số đo. Batch là giao dịch nên thử lại không ghi đôi.
    if (!/no such column|has no column named/i.test(e instanceof Error ? e.message : String(e))) throw e
    // Removed due to missing dependency
    // Removed due to missing dependency
  }
  // SỔ SỰ KIỆN HỌC (GĐ 0): mỗi lượt gọi bảng là một sự kiện, khoá theo id dòng `len_bang`
  // (giống hệt đường nạp lại). Không có qid thì không có bằng chứng về câu nào — không ghi.
  // Removed due to missing dependency
  return ra({ ok: true })
}

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// ------------------------------------------------------------------ ĐO TẢI

// Removed due to missing dependency

// Removed due to missing dependency

// ------------------------------------------------------------------ ĐỊNH TUYẾN


// ===========================================================================
// CỔNG `/goi` — BẢNG DỊCH LỆNH CŨ. CẮT HẲN GOOGLE (thầy chốt 12/09 rạng sáng).
//
// App đang gọi Apps Script bằng 67 lệnh `{action: '...'}`. Viết lại 67 chỗ gọi
// trong một đêm là cách chắc chắn nhất để làm hỏng một thứ đang chạy, nên đi
// đường ngược lại: GIỮ NGUYÊN DÁNG LỆNH, ĐỔI NƠI NHẬN. Đây là bảng dịch ấy.
//
// Mỗi lệnh trả về ĐÚNG DÁNG cũ — tên trường, kiểu, cả trường rỗng — vì màn hình
// không được sửa một dòng nào trong đợt này. Lệnh nào chưa dựng thì trả lỗi nói
// thẳng tên lệnh, KHÔNG trả `{ok:true}` rỗng: im lặng trả rỗng là thầy nhìn màn
// hình thấy "không có dữ liệu" và tưởng mất sạch.
// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

// Removed due to missing dependency

const boXuLy = {
  async scheduled(event:{cron:string}, env:Env) {
    // RESET TOÀN APP (chỉ chạy đúng một lần, sau mốc 00:01 thứ Hai 21/09; trước mốc và sau khi xong thì trả về ngay). PHẢI chạy trước mọi việc khác của cron.
    // Job chia bước (≤ 40 truy vấn D1 mỗi lượt): đang làm/nhường thì các việc cron khác nghỉ lượt này (kế hoạch, tin PH, vinh danh đều dựng lại theo yêu cầu khi có người mở).
    // Removed due to missing dependency
    // Removed due to missing dependency
    // Removed due to missing dependency
  },
  async fetch(req: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    // Removed due to missing dependency
    // Removed due to missing dependency
    // SESSIONS API (Boss 22/09, lượt 2, docs/do-tai-d1/phan-loai-route-doc-ghi-2209.md): `env` bọc `DB.withSession('first-unconstrained')` —
    // CHỈ dùng cho route đã soát KHÔNG có bất kỳ INSERT/UPDATE/DELETE nào ở mọi hàm nó gọi (kể cả gián tiếp, như `ghiTruyCap` khiến hầu hết
    // /ph/* KHÔNG đủ điều kiện dù nhìn tưởng đọc-chỉ). Cloudflare tự chọn bản sao gần nhất thay vì luôn đi primary, giảm tải D1 chính; không
    // đổi kết quả (đọc-chỉ, không cần "đọc ngay sau ghi của chính lượt này"). `withSession` vắng ở D1 giả/local ⇒ dùng nguyên `env`, hành vi cũ.
    // `env.DB?.` (không chỉ `.withSession?`): vài test dựng `env` tối giản KHÔNG có `DB` để kiểm đường từ chối trước khi chạm D1 (vd. chưa xác thực) — phải sống sót cả khi thiếu hẳn `DB`.
    // Removed due to missing dependency

    // Removed due to missing dependency
    // RESET TOÀN APP 00:01 thứ Hai 21/09 (reset-toan-app.ts): trong cửa sổ đóng băng [00:00, 00:20] giờ VN mà job CHƯA xong thì mọi lệnh trả lời tử tế để máy khách
    // không coi là lỗi đăng nhập/mất mạng. Ngoài cửa sổ: không tốn truy vấn nào. Chỉ chuyển hướng và /khoe được qua.
    // Removed due to missing dependency
    // PHIẾU: đường đọc CÔNG KHAI, đặt trước mọi cổng mã bí mật.
    // Removed due to missing dependency
    // Removed due to missing dependency
    // Removed due to missing dependency
    // Removed due to missing dependency
    // Removed due to missing dependency
    // Removed due to missing dependency
    // Removed due to missing dependency
    // Removed due to missing dependency
    // Removed due to missing dependency
    // Removed due to missing dependency
    // Removed due to missing dependency
    // Removed due to missing dependency
    // Removed due to missing dependency
    // Removed due to missing dependency

    try {
      let b: Record<string, unknown>
      try {
        // Removed due to missing dependency
      } catch (e: any) {
        return ra({ ok: false, error: `Thân gói không phải JSON. Lỗi: ${e.message}` }, 400)
      }

      // Lệnh của HỌC SINH — không đòi mã bí mật, giống Apps Script hiện nay.
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // CỔNG PHỤ HUYNH — token giai đoạn mềm (docs/token-phu-huynh-1909.md): chỉ nhận `pass` (token do thầy cấp).
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // "Mọi thứ về con" (Code 4, đã soát): ĐỌC-CHỈ, token hoặc SBD trần; chi tiết một câu (lời giải) cùng luật che.
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // ĐẤU TRƯỜNG CHÂN LÝ — phòng sáu người. Máy chủ chỉ cất đội hình đã nộp;
      // trận đánh do máy em tính, và nó tất định. Xem `server/src/vo-dai.ts`.
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // CỔNG TƯƠNG THÍCH — tự phân quyền bên trong, nên đứng TRƯỚC cổng mã bí mật.
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // KẾ HOẠCH NGÀY (GĐ 2) — em đọc kế hoạch hôm nay; đặt số phút học mỗi ngày (cần token).
      // Ô "Thi đua hôm nay" (Điều 8, phương án 8A): ĐỌC-CHỈ, token của em (thi-dua-hom-nay.ts của Code 4).
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // THỬ THÁCH RIÊNG HÔM NAY (Bộ não A.I Nấc 1, docs/hop-dong-thu-thach-rieng-2109.md): máy chủ chọn + chốt câu; nộp đi đường chấm của ôn lại.
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // `await` là bắt buộc: trả thẳng promise thì lỗi (vd. token sai) lọt khỏi `catch` bên dưới.
      // Removed due to missing dependency

      // Lệnh của THẦY — đòi mã bí mật.
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Token phụ huynh: cấp liên kết theo danh sách/lớp, và đếm truy cập (token so với SBD trần) để quyết giai đoạn cứng.
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // HỒ SƠ NẮM KIẾN THỨC (GĐ 1) — dựng lại từ sổ (≤ 50 em/lượt), xem một em, đo độ phủ mã dạng.
      // Removed due to missing dependency
      // Removed due to missing dependency
      // HỒ SƠ NĂNG LỰC CNH-1.0 (P03): dựng lại từ bằng chứng theo cửa sổ 30 ngày rồi trả DTO CHUNG cho ba app.
      // Cờ `nang_luc_v1` chỉ để biết đường học đã bật chưa; lệnh này chỉ ĐỌC/DỰNG, không cộng tiền.
      // Removed due to missing dependency
      // CÔNG BỐ kết quả một đợt (ca thi/bài) ⇒ kết quả rời trạng thái che, mới vào bằng chứng năng lực (T47).
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Chạy thử reset (chỉ ĐẾM, không ghi): job sẽ xoá bảng nào, bao nhiêu dòng, giữ bảng nào.
      // Removed due to missing dependency
      // Chạy tiếp TAY (bỏ qua hạn 01:00; vẫn cần cờ cho phép, không cờ huỷ): MỘT lượt ≤ 40 truy vấn, gọi lặp tới khi trangThai 'xong'.
      // Removed due to missing dependency
      // Đo giới hạn truy vấn D1 mỗi lượt gọi của gói đang dùng (chỉ đọc).
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Màn HÔM NAY của app giáo viên (docs/hop-dong-gv-hom-nay-2109.md): chỉ đọc, ≤ 8 truy vấn, khối nào không tính được thì null + lyDoThieu.
      // Removed due to missing dependency
      // Kế hoạch hôm nay của MỘT em cho màn Học sinh của thầy: CHỈ ĐỌC (không lập kế hoạch, không capNhatExp) để không nuốt `expNhan` của em.
      // Removed due to missing dependency
      // HÔM NAY v2 (docs/hop-dong-hom-nay-v2-2109.md): MỘT lệnh GHI (cảnh báo em chưa nộp — chỉ thầy bấm mới gửi).
      // Removed due to missing dependency
      // Removed due to missing dependency
      // NĂM lệnh ĐỌC-CHỈ (≤ 12 truy vấn, đo ở `soTruyVan`): ô Việc gấp, Em cần thầy giúp, Vinh danh, tra cứu, Toàn cảnh một em.
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // GỌI LÊN BẢNG (thầy lệnh 21/09): em đã làm câu này chưa, đúng hay sai, quét HẾT lịch sử (KHÔNG áp mốc 12:00). ĐỌC-CHỈ, ≤ 200 cặp, 2 truy vấn (docs/hop-dong-lich-su-cau-len-bang-2109.md).
      // Removed due to missing dependency
      // BẢNG TIN KIỂU SÀN GIAO DỊCH (thầy chốt mẫu 21/09; hợp đồng docs/hop-dong-bang-tin-song-2109.md): mọi khoá của /gv/bang-tin (gồm `chuaHocHomNay`, đệm chung 60 giây) + `song` (nến 5 phút, tia 60 phút, theo lớp, ô nhiệt, băng tin, dẫn đầu; đệm 10 giây).
      // Cờ lùi `cau_hinh.bang_tin_san = 'tat'` ⇒ trả `{ok:false, lyDo:'tat'}` (máy thầy dùng Bảng tin bản 3). ĐỌC-CHỈ.
      // BÁO CÁO CA cho THẦY (docs/hop-dong-xem-diem-v2-2109.md mục 2 + 4): ĐỌC-CHỈ, không bị chặn công bố (trả `congBo`); `phan[].toiDa` / `phanTb[].toiDa` = trần điểm từng phần từ `quotaPhan` (một nguồn với chấm điểm). Lỗi đọc ⇒ {ok:false, lyDo:'loi_doc'}.
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // TÊN LỚP (docs/hop-dong-ten-lop-2109.md): `/gv/lop` ĐỌC-CHỈ; `/gv/doi-lop-em` GHI cột `hoc_sinh.ten_lop` của MỘT em (không đụng `lop` = khối).
      // Removed due to missing dependency
      // Removed due to missing dependency
      // BUỔI CHỮA TỐI NAY (B6, docs/hop-dong-buoi-chua-de-xuat-2109.md): số liệu thô ĐỌC-CHỈ, ≤ 12 truy vấn.
      // Removed due to missing dependency
      // BẢNG TIN CỦA THẦY bản 3 (docs/hop-dong-bang-tin-v3-2109.md): MỘT lệnh đọc-chỉ ≤ 12 truy vấn cho cả màn Hôm nay, số liệu tính từ mốc `cau_hinh.bang_tin_tu`.
      // `chuaHocHomNay` (Code 4, Điều 8): chỉ-thêm, khối RIÊNG ngoài bộ đếm truy vấn của bảng tin; lỗi/thiếu ⇒ vắng khoá (máy thầy ẩn khối, không bịa).
      // Removed due to missing dependency
      // CỜ TẮT chung của các việc máy tự làm B7–B11 (thầy chỉ tắt/bật): đọc-ghi khoá `cau_hinh.tu_dong_cac_viec`.
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      if (p === '/ca/danh-sach') return themMocReset(env, await danhSachCaMoi(env, b.daXoa === true)) // đường CHÍNH app thầy (Code 1): phải mang `mocReset` như /goi danhSachCa
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // THÊM PHÚT cho ca đang chạy (docs/hop-dong-them-phut-2109.md): chỉ cộng, trần 30 phút mỗi ca.
      // Removed due to missing dependency
      // ĐỔI TÊN một học sinh (docs/hop-dong-doi-ten-hoc-sinh-2109.md): chỉ cột tên, 5 bảng; giữ phieu/chan_vao.
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // CHẤM LẠI MỘT CA CŨ bằng luật chấm hiện hành rồi ghi lại D1 (thầy chốt 23/09 — việc còn lại của MỤC 3).
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // BỘ NÃO A.I (Code 1, `bo-nao.ts`; hợp đồng docs/hop-dong-bo-nao-2109.md): MỌI lệnh /ai/* là lệnh THẦY — nằm SAU cổng `laThay`; các hàm tự trả {ok,…}, không tự kiểm mã.
      // Removed due to missing dependency
      if (p === '/ai/ho-so-ngay') return ra(await AI.boNaoHoSoNgay(env, b, Date.now(), { thanThu: (ds) => docThanThuSoThat(env, ds) })) // + SỐ THẬT thần thú trong thẻ (Nấc 1)
      // Removed due to missing dependency
      // TÊN DẠNG cạnh mã dạng (chuẩn từ ngữ luật 4: mã nội bộ không hiện cho thầy) — lớp mỏng `ten-dang-bo-nao.ts`, không sửa lõi Bộ não.
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency
      // Removed due to missing dependency

      return ra({ ok: false, error: 'Không có đường này' }, 404)
    } catch (e) {
      const ma = (e as { ma?: unknown } | null)?.ma // mã lỗi có tên (vd het_tran của game) để màn hiện đúng lời; lỗi thường không có
      return ra({ ok: false, error: e instanceof Error ? e.message : 'Lỗi máy chủ', ...(typeof ma === 'string' ? { ma } : {}) }, 500)
    }
  },
}

/** Bọc `boXuLy.fetch`: đo thời gian trả lời từng lệnh (trừ OPTIONS) vào bộ nhớ ⇒ p50/p95 ⇒ `nhipDeNghi` + `/gv/suc-khoe-may-chu` (suc-khoe-may.ts). Không tốn truy vấn nào. */
export default {
  ...boXuLy,
  async fetch(req: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    // Removed due to missing dependency
    // Removed due to missing dependency
    try { res = await boXuLy.fetch(req, env, ctx) } finally { if (req.method !== 'OPTIONS') ghiDoLenh(tenLenh(new URL(req.url).pathname), Date.now() - t0) }
    // HEADER song song với trường JSON `nhipDeNghi` (Code 2: máy em yếu, khỏi phải clone + parse thân phản hồi 20–100 KB): `x-nhip-de-nghi: 1|2|4` + cho trình duyệt đọc qua CORS. Thân phản hồi đi nguyên (stream).
    // Removed due to missing dependency
    // Removed due to missing dependency
    const ex = h.get('access-control-expose-headers'); // Removed due to missing dependency
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h })
  },
}

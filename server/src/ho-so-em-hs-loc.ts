// LỌC BẢN HỌC SINH của "Hồ sơ làm bài" (thầy 12/10: "Cho hs bấm vào bảng lười chăm. Khi bấm vào hiển thị đủ hồ sơ như trong nhịp học nhé").
// Hàm THUẦN, chỉ nhập KIỂU — máy chủ (`ho-so-em-hs.ts`) và trang chụp ảnh dùng chung, nên bản em thấy trong ảnh đúng là bản máy chủ trả.
//
// Thầy thấy (`/gv/ho-so-thai-do` + `/gv/lich-su-lam-cau`) ⇒ em thấy CÙNG mọi con số, TRỪ những trường dưới đây (danh sách đầy đủ, khoá bằng test
// tests/ho-so-em-hs-1210f.test.ts):
//   ĐÃ BỎ Ở MÁY CHỦ (lõi `hoSoThaiDoCuaEm` / `lichSuLamCauCuaEm` với `nguoiDoc = 'hoc-sinh'`):
//     · mọi lượt còn giấu (`visibility = 'embargoed'`) — thầy cũng không thấy;
//     · mọi lượt của ca kiểm tra CHƯA công bố hoặc đã xoá (`sqlLuotCaDaCongBo`, đúng luật `SQL_DA_CONG_BO`) — kể cả trong số đếm, tín hiệu, câu đúng;
//     · `canhBao` nội bộ của thầy (Gói 7 chưa đọc được, khoảng ngày bị nắn, sổ Hành trình…) — chỉ giữ dòng "sổ bị cắt".
//   ĐÃ BỎ Ở ĐÂY:
//     · `lan[].chon` (đáp án em đã chọn) ⇒ null: ghép với cột Đúng/Sai là lộ ĐÁP ÁN ĐÚNG của câu; nguồn nào trả phản hồi muộn (bài tập về nhà, phiếu…)
//       thì em chưa được xem — bỏ hẳn, không đoán nguồn nào an toàn;
//     · `qid` thật (mã tờ đề, mã câu nội bộ) ⇒ khoá "c" + số băm CỐ ĐỊNH của mã (đợt 16, 12/10: cùng mã ⇒ cùng khoá ở MỌI trả lời — hồ sơ thái độ và
//       lịch sử ghép được số giây từng lần cho "Câu đúng" / "Câu đã ôn"); `tieuDe` rỗng ⇒ "Câu N" theo quy ước mã câu, không thì "Câu chưa có tên dạng"
//       (tấm không bao giờ ghi khoá ra màn).
//   THÊM Ở ĐÂY (đợt 16 — thầy: "chỗ các câu học sinh chưa chữa đc bấm vào phải nảy vào đúng chỗ tự sửa"): `cauSai[].moChua` = khoá "g<số>" băm từ MÃ
//     GỐC của câu (`khoaMoChua`) — màn Tự chữa băm mã các câu trong danh sách của nó bằng CÙNG hàm để mở đúng câu; không có mã nội bộ nào xuống máy.
//   KHÔNG có trong hai lệnh (nên không phải bỏ): đáp án đúng, lời giải, đề bài, đường mở app thầy, ghi chú của thầy.
import type { CauTomTat, KetQuaHoSoThaiDo } from './bai-hang-ngay-kieu'
import type { CauEmSai, KetQuaLichSuLamCau, LanLamCau } from './lich-su-lam-cau-kieu'

/** Danh sách trường bỏ / đổi ở bản học sinh (ghi đúng như chú thích đầu tệp — test đọc để báo cáo). */
export const TRUONG_BO_BAN_HOC_SINH = [
  'lượt embargoed',
  'lượt ca kiểm tra chưa công bố / đã xoá',
  'canhBao nội bộ',
  'lan[].chon',
  'qid thật (đổi khoá c1, c2…)',
] as const

/** Băm FNV-1a 32 bit (hạt giống khác nhau cho hai nửa). */
function fnv32(s: string, hat: number): number {
  let h = hat >>> 0
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return h >>> 0
}
/** Mã gốc để mở Tự chữa: bỏ tiền tố "tc:", đuôi lượt "#n", đuôi bản đổi số / song sinh "~n", "~ssn", "~btn", "~ydn". */
export function maGocChua(qid: string): string {
  return qid.replace(/^tc:/, '').replace(/#\d+$/, '').replace(/~(?:ss|bt|yd)?\d+$/, '')
}
/** Khoá mở Tự chữa: "g" + số băm 48 bit của MÃ GỐC (hàm thuần — app học sinh băm danh sách Tự chữa bằng chính hàm này để khớp). */
export function khoaMoChua(qid: string): string {
  const g = maGocChua(qid)
  return `g${fnv32(g, 2166136261) * 65536 + (fnv32(g, 0x9e3779b9) & 0xffff)}`
}
/** Khoá câu cho máy em: mã thật ⇒ "c" + số băm 48 bit CỐ ĐỊNH (cùng mã ⇒ cùng khoá ở mọi trả lời; hai mã khác nhau trùng khoá ~ 1/2^48). */
export function taoKhoaCau(): (qid: string) => string {
  const m = new Map<string, string>()
  return (qid) => {
    let k = m.get(qid)
    if (!k) m.set(qid, (k = `c${fnv32(qid, 2166136261) * 65536 + (fnv32(qid, 0x9e3779b9) & 0xffff)}`))
    return k
  }
}

/** Tiêu đề câu ở máy em: tiêu đề sẵn có; rỗng ⇒ "Câu N" theo quy ước mã `<mã tờ>-<phần>-<số>` của câu gốc (bỏ đuôi lượt `#n`, bản song sinh
 *  `~ss|~bt|~yd`); không theo quy ước ⇒ "Câu chưa có tên dạng". Không bao giờ ghi mã nội bộ. */
export function tieuDeCauHs(qidThat: string, tieuDe: string): string {
  const t = tieuDe.trim()
  if (t) return t
  const goc = qidThat.replace(/#\d+$/, '').replace(/~(?:ss|bt|yd)\d+$/, '')
  const m = /-(III|II|I)-(\d+)$/.exec(goc)
  return m ? `Câu ${Number(m[2])}` : 'Câu chưa có tên dạng'
}

/** Bản học sinh của lịch sử làm câu — xem đầu tệp. Mọi con số giữ nguyên. */
export function banHocSinhLichSu(kq: KetQuaLichSuLamCau): KetQuaLichSuLamCau {
  const khoa = taoKhoaCau()
  const lan: LanLamCau[] = kq.lan.map((l) => ({ ...l, qid: khoa(l.qid), tieuDe: tieuDeCauHs(l.qid, l.tieuDe), chon: null }))
  const cauSai: CauEmSai[] = kq.cauSai.map((c) => ({ ...c, qid: khoa(c.qid), tieuDe: tieuDeCauHs(c.qid, c.tieuDe), moChua: khoaMoChua(c.qid) }))
  return { ...kq, lan, cauSai }
}

/** Bản học sinh của hồ sơ thái độ — xem đầu tệp (`canhBao` đã lọc ở lõi máy chủ). Mọi con số giữ nguyên. */
export function banHocSinhHoSoThaiDo(kq: KetQuaHoSoThaiDo): KetQuaHoSoThaiDo {
  const khoa = taoKhoaCau()
  const doi = (c: CauTomTat): CauTomTat => ({ ...c, qid: khoa(c.qid), tieuDe: tieuDeCauHs(c.qid, c.tieuDe) })
  return { ...kq, cauDung: kq.cauDung.map(doi), cauDaOn: kq.cauDaOn.map(doi) }
}

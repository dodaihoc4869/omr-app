// BÀI TẬP VỀ NHÀ DỰNG MỚI + CHỐT CỨNG MỤC TIÊU 0% APPS SCRIPT.
//
// Thầy chốt 11/09 tối: *"tuyệt đối 0% app scrip"*. Một mục tiêu như thế không
// giữ được bằng lời hứa — vài tuần nữa ai đó (kể cả tôi) thêm một lời gọi
// `postJson` vào đường của em là nó trôi lại, và không ai thấy.
//
// Nên nó được canh bằng phép kiểm ĐỌC MÃ NGUỒN, liệt kê đích danh những tệp
// thuộc đường của HỌC SINH và PHỤ HUYNH.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const WK = doc('server/src/index.ts')
const API = doc('src/lib/exam-api.ts')
const BTVN = doc('src/lib/btvn-may-chu-moi.ts')
const SQL = doc('server/migration-1209-toan-bo.sql')
// 02/11: cập nhật theo f8cb79175/4356cf495/0ad819c5a — đọc kho đề dời sang `homeworkQuestions` (btvn-grading.ts),
// chấm + ghi lượt nộp dời sang `nopBtvnQuaPhieu` (goi-cu.ts); canh đúng chỗ đang làm việc.
const GRADING = doc('server/src/btvn-grading.ts')
const GOI_CU = doc('server/src/goi-cu.ts')
const HQ = GRADING.slice(GRADING.indexOf('export async function homeworkQuestions('), GRADING.indexOf('export function homeworkKeys('))
const NOP_PHIEU = GOI_CU.slice(GOI_CU.indexOf('export async function nopBtvnQuaPhieu('), GOI_CU.indexOf('function goPhanMa('))

describe('BTVN — ba luật chốt cứng ở MÁY CHỦ', () => {
  const GIAO = WK.slice(WK.indexOf('async function giaoBtvn('), WK.indexOf('async function btvnCuaEm('))
  const CUA_EM = WK.slice(WK.indexOf('async function btvnCuaEm('), WK.indexOf('async function nopBtvn('))
  const NOP = WK.slice(WK.indexOf('async function nopBtvn('), WK.indexOf('async function theoDoiBtvn('))

  it('LUẬT 1 — chỉ giao cho em CÓ LƯỢT trong ca ấy', () => {
    // Em vắng hôm đó không bị giao bài.
    expect(GIAO).toContain('FROM luot l LEFT JOIN danh_sach d ON d.sbd = l.sbd')
    expect(GIAO).toContain('WHERE l.ma_ca = ?')
    // và KHÔNG lấy cả lớp
    expect(GIAO).not.toContain('FROM danh_sach ORDER BY')
  })

  it('lượt đã duyệt lại KHÔNG tính — cùng luật đếm của màn Ca thi', () => {
    expect(GIAO).toContain("l.trang_thai <> 'duoc_duyet_lai'")
  })

  it('ca chưa em nào vào thi thì TỪ CHỐI, không giao bài rỗng', () => {
    // Từ 12/09 giao được nhiều ca một lượt: ca rỗng bị BỎ QUA và kê tên, còn
    // rỗng cả lượt thì từ chối hẳn.
    expect(GIAO).toContain('caRong.push(ca)')
    expect(GIAO).toContain('Những ca đã tick chưa có em nào vào thi')
  })

  it('LUẬT 2 — trả NGUYÊN gói đề, không xáo không lọc', () => {
    // Từ 12/09 một lượt giao gồm NHIỀU tờ đề (`ma_de` là danh sách nối bằng
    // dấu phẩy), nên gói được GỘP — nhưng luật không đổi: đúng thứ tự thầy
    // tick, đúng thứ tự câu trong từng tờ.
    // 02/11: cập nhật theo f8cb79175 (gói đề đọc qua `homeworkQuestions` dùng chung cho mở bài và chấm).
    expect(CUA_EM).toContain('homeworkQuestions(env,String(bt.ma_de))')
    expect(HQ).toContain('`kho/${goc}.json`')
    // Lọc DUY NHẤT được phép: lấy đúng phần thầy đã tick (TN · ĐS · TLN) (+ bỏ câu tự luận, luật chung).
    expect(HQ).toContain('if (phan && c.phan !== phan) continue')
    for (const vung of [CUA_EM, HQ]) {
      for (const cam of ['sort(', 'shuffle', 'Math.random']) {
        expect(vung, cam).not.toContain(cam)
      }
      // không cắt bớt số câu (`slice(0, -hậu tố)` trên MÃ ĐỀ thì được)
      expect(vung).not.toMatch(/\.slice\(0,\s*\d/)
    }
  })

  it('LUẬT 3 — hạn tính từ lúc BẤM GIAO, chung cả lớp', () => {
    expect(GIAO).toContain('HAN_BTVN_GIO * 3600 * 1000')
    expect(WK).toContain('const HAN_BTVN_GIO = 48')
    // MỘT nguồn sự thật: số 48 chỉ xuất hiện đúng một lần trong mã máy chủ
    expect(WK.match(/HAN_BTVN_GIO/g)!.length).toBeGreaterThan(1)
  })

  it('CHẶN QUÁ HẠN Ở MÁY CHỦ — cả lúc mở lẫn lúc nộp', () => {
    // Giờ trên máy em chỉnh được, nên ẩn nút thôi là không chặn được gì.
    // 02/11: cập nhật theo 4356cf495 + 01b633724 — `nopBtvn` giao cho `nopBtvnQuaPhieu` (goi-cu.ts); ĐIỀU 4 = B:
    // qua hạn vẫn nộp LẦN ĐẦU (nộp trễ), nộp LẠI sau hạn vẫn chặn; cờ lùi `btvn_nop_tre='tat'` trả luật cũ.
    expect(CUA_EM).toContain("lyDo: 'qua_han'")
    expect(NOP).toContain('G.nopBtvnQuaPhieu(')
    expect(NOP_PHIEU).toContain("if (quaHan && !(await btvnNopTreBat(env, bt.giao_luc))) return { ok: false, lyDo: 'qua_han'")
    expect(NOP_PHIEU).toContain("if (quaHan && cu.nop_luc) return { ok: false, lyDo: 'qua_han'")
    expect(NOP_PHIEU).toContain("Bạn đã quá hạn nộp BTVN")
  })

  it('nộp rồi thì nộp lại KHÔNG ghi đè — khoá nằm trong WHERE', () => {
    // 02/11: cập nhật theo 4356cf495 (thầy cho làm lại tối đa 3 lần): `nop_luc IS NULL` trong WHERE bỏ có chủ đích.
    // Còn canh: gửi lại ĐÚNG bài cũ ⇒ trả `daNhan` không ghi; hết 3 lượt làm lại ⇒ chặn; bài bị thu hồi ⇒ không ghi.
    expect(NOP_PHIEU).toContain('if(cu.nop_luc&&String(cu.dap_an_json)===JSON.stringify(lam))return {')
    expect(NOP_PHIEU).toContain('daNhan:true')
    expect(NOP_PHIEU).toContain('if (daLam >= 4) {')
    expect(NOP_PHIEU).toContain('WHERE khoa = ? AND thu_hoi=0')
  })

  it('đường của EM là công khai, đường của THẦY đòi mã bí mật', () => {
    const iThay = WK.indexOf('if (!laThay(req, env, b))')
    expect(WK.indexOf("p === '/btvn/cua-em'")).toBeLessThan(iThay)
    expect(WK.indexOf("p === '/btvn/nop'")).toBeLessThan(iThay)
    expect(WK.indexOf("p === '/btvn/giao'")).toBeGreaterThan(iThay)
    expect(WK.indexOf("p === '/btvn/theo-doi'")).toBeGreaterThan(iThay)
  })

  it('theo dõi kê TÊN em chưa nộp, không chỉ đếm số', () => {
    const TD = WK.slice(WK.indexOf('async function theoDoiBtvn('), WK.indexOf('// ==========', WK.indexOf('async function theoDoiBtvn(')))
    // 02/11: cập nhật theo 0ad819c5a (bỏ em đã thu hồi khỏi danh sách chưa nộp); vẫn kê TÊN.
    expect(TD).toContain("chuaNop: dsEm.filter((x) => !x.nop_luc && !x.thu_hoi).map((x) => ({ sbd: String(x.sbd ?? ''), hoTen: String(x.ho_ten ?? '') }))")
  })

  it('danh sách em chốt NGAY LÚC GIAO, không tính lại về sau', () => {
    // Em được duyệt thi lại sau đó không tự nhiên bị giao thêm bài.
    expect(SQL).toContain('CREATE TABLE IF NOT EXISTS btvn_em')
    expect(GIAO).toContain('INSERT INTO btvn_em')
  })

  it('máy thầy KHÔNG gọi Apps Script cho BTVN', () => {
    expect(BTVN).not.toContain('script.google.com')
    expect(BTVN).not.toContain('postJson')
    expect(BTVN).not.toContain('scriptUrl')
  })
})

describe('0% APPS SCRIPT — chốt cứng, không để trôi lại', () => {
  it('lượt NỘP của em không còn bắt buộc phải đi Apps Script', () => {
    // Đây là lượt gọi cuối cùng còn sót trong đường của em: bài đã cất vào D1
    // xong mà vẫn phải gọi sang bên kia chỉ để lấy `keyBank` và cờ `congBo`.
    const i = API.indexOf('export async function submitAnswers(')
    const than = API.slice(i, API.indexOf('\n}\n', i)) // 02/11: cả thân hàm (chú thích dài thêm, cửa 3000 ký tự không còn đủ)
    expect(than).toContain("if (cb === 'khong' || cb === 'ca_lop_xong') return { keyBank: null, congBo: cb as CongBoDiem }")
    // 02/11: cập nhật theo 9656633a9 (tờ đáp án tải sẵn đã khoá, máy chủ chỉ trao chìa) — vẫn CHỈ khi công bố 'ngay'.
    expect(than).toContain("const kb = cb === 'ngay' && (daCat.keyBank")
    expect(than).toContain("if (kb) return { keyBank: kb as KeyBank, congBo: 'ngay' }")
  })

  it('ngân hàng CÓ đáp án được cất lúc mở ca, sau khoá RIÊNG', () => {
    expect(WK).toContain('`key/${maCa}.json`')
    // LUẬT CŨ: chỉ cất khi ca công bố điểm NGAY — "không cất sẵn thứ không ai
    // được đọc". Sai ở chỗ CÓ người được đọc: chính em, sau khi đã nộp, qua
    // link xem điểm. Ca 195422 (`ca_lop_xong`) sáng 12/09 vì thế mất sạch link
    // xem điểm. Nay LUÔN cất; cổng nằm ở chỗ ĐỌC, không ở chỗ ghi.
    expect(API).not.toContain("congBoDiem === 'ngay' ? keyBank : undefined")
    const i = API.indexOf('        bank,\n')
    expect(API.slice(i, i + 900)).toContain('keyBank,')
  })

  it('đáp án KHÔNG BAO GIỜ đi ra đường công khai của học sinh', () => {
    const layDe = WK.slice(WK.indexOf('async function layDe('), WK.indexOf('async function layDe(') + 700)
    expect(layDe).not.toContain('key/')
    expect(layDe).not.toContain('kho/')
  })

  it('ca KHÔNG công bố điểm thì máy chủ không trả đáp án', () => {
    const HAM = WK.slice(WK.indexOf('async function congBoSauNop('), WK.indexOf('async function congBoSauNop(') + 1200)
    expect(HAM).toContain("if (congBo !== 'ngay') return { congBo }")
  })

  it('thiếu ngân hàng thì trả null để chỗ gọi tự đi đường cũ — không để em nhìn màn trắng', () => {
    const HAM = WK.slice(WK.indexOf('async function congBoSauNop('), WK.indexOf('async function congBoSauNop(') + 1200)
    expect(HAM).toContain('keyBank: null')
  })
})

describe('HỒ SƠ EM — bảng mạnh–yếu lấy từ máy chủ mới', () => {
  it('thay bảng khi bên mới CÓ số', () => {
    const i = API.indexOf('export async function hoSoEm(')
    const than = API.slice(i, API.indexOf('\n}', i))
    expect(than).toContain('tienDoEmMoi(chMoi,')
    expect(than).toContain('if (td && td.chuyenDe.length > 0)')
  })

  it('KHÔNG bao giờ xoá bảng đang hiện bằng một bảng RỖNG', () => {
    // Rỗng bên mới mà bên cũ có số thì vẫn dùng bên cũ. Đây là chỗ dễ làm thầy
    // mở hồ sơ em ra thấy trắng mà không hiểu vì sao.
    const i = API.indexOf('export async function hoSoEm(')
    const than = API.slice(i, API.indexOf('\n}', i))
    expect(than).toContain('let chuyenDe = r.chuyenDe || []')
    expect(than).toContain('} catch {')
  })
})

// KHÔNG có phép kiểm cho `CHUYEN-SANG-MAY-CHU-MOI.command` ở đây, và đó là cố ý.
//
// Tệp ấy nằm NGOÀI git (nó mang `CLOUDFLARE_ACCOUNT_ID`, mà repo này CÔNG KHAI).
// Phép kiểm đọc một tệp không có trong repo thì xanh trên máy tôi và đỏ ở mọi
// nơi khác — đúng kiểu phép kiểm tệ nhất: nó dối.
//
// Việc "script phát hành phải chạy `migration-1209-toan-bo.sql`" vì thế được
// canh bằng chính lượt phát hành: script tự tra `SELECT ... FROM chi_tiet_cau /
// de_kho / btvn` sau khi chạy migration, và DỪNG nếu truy vấn hỏng. Tra thật
// mạnh hơn một phép kiểm đọc chữ.

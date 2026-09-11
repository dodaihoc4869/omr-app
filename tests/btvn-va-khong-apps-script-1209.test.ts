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
    expect(GIAO).toContain("Ca này chưa có em nào vào thi")
  })

  it('LUẬT 2 — trả NGUYÊN gói đề, không xáo không lọc', () => {
    expect(CUA_EM).toContain('`kho/${String(bt.ma_de ?? \'\')}.json`')
    for (const cam of ['sort(', 'shuffle', 'slice(0,', 'filter((c)']) {
      expect(CUA_EM, cam).not.toContain(cam)
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
    expect(CUA_EM).toContain("lyDo: 'qua_han'")
    expect(NOP).toContain("lyDo: 'qua_han'")
    expect(NOP).toContain("Bạn đã quá hạn nộp BTVN")
  })

  it('nộp rồi thì nộp lại KHÔNG ghi đè — khoá nằm trong WHERE', () => {
    expect(NOP).toContain('WHERE khoa = ? AND nop_luc IS NULL')
    expect(NOP).toContain('daNhan: true')
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
    expect(TD).toContain('chuaNop: dsEm.filter((x) => !x.nop_luc)')
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
    const than = API.slice(i, i + 3000)
    expect(than).toContain("if (cb === 'khong' || cb === 'ca_lop_xong') return { keyBank: null, congBo: cb as CongBoDiem }")
    expect(than).toContain("if (cb === 'ngay' && daCat.keyBank) return { keyBank: daCat.keyBank as KeyBank, congBo: 'ngay' }")
  })

  it('ngân hàng CÓ đáp án được cất lúc mở ca, sau khoá RIÊNG', () => {
    expect(WK).toContain('`key/${maCa}.json`')
    // và CHỈ khi ca công bố điểm ngay — không cất sẵn thứ không ai được đọc
    expect(API).toContain("congBoDiem === 'ngay' ? keyBank : undefined")
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

describe('SCRIPT PHÁT HÀNH dựng đủ bảng mới', () => {
  it('chạy migration của đợt bỏ Apps Script', () => {
    const CMD = doc('CHUYEN-SANG-MAY-CHU-MOI.command')
    expect(CMD).toContain('migration-1209-toan-bo.sql')
  })

  it('tự kiểm bằng truy vấn THẬT, không tin mã thoát', () => {
    // `ALTER TABLE` chạy lần hai báo lỗi và đó là hành vi đúng, nên mã thoát
    // không nói lên điều gì. Chỉ truy vấn thật mới nói.
    const CMD = doc('CHUYEN-SANG-MAY-CHU-MOI.command')
    expect(CMD).toContain('FROM chi_tiet_cau')
    expect(CMD).toContain('FROM de_kho')
    expect(CMD).toContain('FROM btvn')
    expect(CMD).toContain('KD=$?')
  })

  it('kiểm đường của EM là CÔNG KHAI, không phải 403', () => {
    const CMD = doc('CHUYEN-SANG-MAY-CHU-MOI.command')
    expect(CMD).toContain('/btvn/cua-em')
    expect(CMD).toContain('CÔNG KHAI, phải 200')
  })
})

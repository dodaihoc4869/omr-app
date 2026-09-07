// ĐỒNG BỘ HỌ TÊN TỪ DANH SÁCH LỚP VÀO CA — thầy báo 07/09.
//
// Hai ca 371304 và 879501: em đã có tên trong danh sách lớp nhưng lượt thi bỏ
// trống cột HoTen, vì em vào thi chỉ gõ số báo danh. Phiếu gửi phụ huynh khi đó
// in "SBD 10038" thay cho tên con.
//
// Ba thứ phải khoá:
//   1. Lệnh chỉ đụng cột tên, tuyệt đối không đụng điểm và chi tiết câu.
//   2. Tên đang có mà lệch danh sách thì sửa theo danh sách nhưng BÁO RA cũ →
//      mới, không đổi lặng lẽ.
//   3. Danh sách lớp rỗng thì DỪNG, không xoá sạch tên đang có.
import { describe, expect, it, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { dongBoTenCa } from '../src/lib/exam-api'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')
const THAN = GS.slice(GS.indexOf("if (action === 'dongBoTenCa')"), GS.indexOf("if (action === 'doiTenCa')"))

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('máy chủ — luật đồng bộ tên', () => {
  it('đòi mã bí mật và đòi mã ca', () => {
    expect(THAN).toContain('kiemTraMaBiMat_(body)')
    expect(THAN).toContain("if (!maCaDT2) return jsonResponse_({ ok: false, error: 'Thiếu mã ca' })")
  })

  it('DANH SÁCH RỖNG THÌ DỪNG — không xoá sạch tên đang có', () => {
    // Ghi đè bằng danh sách rỗng là mất tên của cả ca, mà tên đó có thể là thứ
    // duy nhất còn lại nếu bản sao danh sách bị hỏng.
    expect(THAN).toContain('if (!dsDT.length) return jsonResponse_({ ok: false')
    expect(THAN.indexOf('!dsDT.length')).toBeLessThan(THAN.indexOf('setValue(tenMoi)'))
  })

  it('chỉ ghi CỘT 13 (HoTen) của LuotThi — không đụng điểm, không đụng chi tiết câu', () => {
    // LUOT_HEADERS: cột 13 là HoTen, 14–17 là DiemI/II/III/Tong.
    expect(THAN).toContain('shDT.getRange(r + 1, 13).setValue(tenMoi)')
    expect(THAN).not.toContain('getRange(r + 1, 14')
    expect(THAN).not.toMatch(/SHEET_CHITIET|CHITIET_HEADERS/)
    expect(GS).toContain("const LUOT_HEADERS = ['MaCa', 'SBD', 'LanThu', 'IdThietBi', 'VaoLuc', 'HetGioLuc', 'NopLuc', 'TrangThai', 'DapAnJson', 'SoLanRoiMan', 'TongGiayRoiMan', 'IntegrityJson', 'HoTen',")
  })

  it('tên trống thì điền, tên lệch thì sửa và báo cũ → mới, tên khớp thì để yên', () => {
    expect(THAN).toContain('daDien.push({ sbd: sbdR, hoTen: tenMoi })')
    expect(THAN).toContain('daSua.push({ sbd: sbdR, cu: tenCu, moi: tenMoi })')
    expect(THAN).toContain('giuNguyen++')
    // So bằng `chuanTen_` chứ không so chuỗi thô: khác mỗi dấu thì không phải
    // là "lệch", sửa vào là ghi đè vô ích lên cả ca.
    expect(THAN).toContain('chuanTen_(tenCu) !== chuanTen_(tenMoi)')
  })

  it('SBD không có trong danh sách thì BÁO RA, không im lặng bỏ qua', () => {
    expect(THAN).toContain('khongCo.push(sbdR)')
    expect(THAN).toContain('khongCo: khongCo')
  })

  it('hồ sơ HocSinh trống tên thì điền luôn, có tên rồi thì KHÔNG đụng', () => {
    expect(THAN).toContain("if (hoSoDT && !String(hoSoDT.hoTen || '').trim())")
  })
})

describe('máy khách', () => {
  function gia(tra: unknown) {
    const goi = vi.fn(async () => ({ ok: true, json: async () => tra }))
    vi.stubGlobal('fetch', goi)
    return goi
  }

  it('gửi đúng lệnh, đúng ba trường', async () => {
    const goi = gia({ ok: true, maCa: '371304', tenCa: '2011 - Duy & Long - L1', daDien: [], daSua: [], khongCo: [], giuNguyen: 0 })
    await dongBoTenCa('https://x', 'MAT', '371304')
    expect(JSON.parse((goi.mock.calls[0][1] as { body: string }).body)).toEqual({ action: 'dongBoTenCa', secret: 'MAT', maCa: '371304' })
  })

  it('đọc đủ bốn con số để thầy đối chiếu', async () => {
    gia({
      ok: true,
      maCa: '371304',
      tenCa: '2011 - Duy & Long - L1',
      daDien: [{ sbd: '10038', hoTen: 'A' }, { sbd: '10039', hoTen: 'B' }],
      daSua: [{ sbd: '10040', cu: 'C cũ', moi: 'C mới' }],
      khongCo: ['10099'],
      giuNguyen: 5,
    })
    const kq = await dongBoTenCa('https://x', 'MAT', '371304')
    expect(kq.daDien).toHaveLength(2)
    expect(kq.daSua[0]).toEqual({ sbd: '10040', cu: 'C cũ', moi: 'C mới' })
    expect(kq.khongCo).toEqual(['10099'])
    expect(kq.giuNguyen).toBe(5)
  })

  it('máy chủ từ chối thì ném nguyên văn, không nuốt', async () => {
    gia({ ok: false, error: 'Danh sách lớp trên máy chủ đang rỗng — bấm Đồng bộ danh sách trước' })
    await expect(dongBoTenCa('https://x', 'MAT', '371304')).rejects.toThrow(/đang rỗng/)
  })

  it('máy chủ cũ không trả mảng thì trả mảng rỗng, màn hình không vỡ', async () => {
    gia({ ok: true })
    const kq = await dongBoTenCa('https://x', 'MAT', '371304')
    expect(kq).toMatchObject({ daDien: [], daSua: [], khongCo: [], giuNguyen: 0 })
  })
})

describe('màn Theo dõi ca', () => {
  const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamMonitorScreen.tsx'), 'utf8')

  it('chỉ hiện nút khi THẬT SỰ có em thiếu tên', () => {
    expect(MAN).toContain('{emThieuTen.length > 0 && (')
    expect(MAN).toContain("dsEm.filter((e) => !e.hoTen.trim())")
  })

  it('nói rõ hậu quả trước khi thầy bấm', () => {
    expect(MAN).toMatch(/chưa có họ tên[\s\S]{0,120}in số báo danh thay cho tên con/)
  })

  it('đồng bộ xong thì tải lại ca — không để màn hiện số cũ', () => {
    const than = MAN.slice(MAN.indexOf('const dongBoTenChoCa'), MAN.indexOf('const daCham ='))
    expect(than).toContain('await tai(chiTiet.ca.maCa)')
    expect(than).toContain('Dựng lại phiếu để tên hiện đúng')
  })
})

describe('cầu nối __ddh', () => {
  it('có lệnh dongBoTenCa để chạy hàng loạt từ ngoài', () => {
    const cn = fs.readFileSync(path.join(process.cwd(), 'src/lib/cau-noi-ddh.ts'), 'utf8')
    expect(cn).toContain('dongBoTenCa: (maCa: string) => Promise<KetQuaDongBoTenCa>')
    expect(cn).toContain('dongBoTenCa: async (maCa) => {')
  })
})

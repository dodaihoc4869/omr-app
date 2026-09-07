// LINK XEM ĐIỂM `/d/<mã ca>` — thầy báo 07/09.
//
// Thầy gửi link ca cho em xem điểm thì em nhận một ô đỏ báo chặn: `/t/<mã ca>`
// là link VÀO THI, nộp xong máy chủ chặn vào lại. Đường `/d/` là lối riêng cho
// em xem lại điểm trên máy bất kỳ.
//
// Ba điều phải khoá:
//   1. `/d/<mã ca>` đọc ra đúng vai và mã ca.
//   2. Đường đó KHÔNG bị coi là app quản lý của thầy — hỏi mật khẩu ở đây là
//      chặn cả lớp khỏi xem điểm.
//   3. Lệnh `phieuCuaEm` gửi đủ ba thứ danh tính, và lỗi máy chủ được nói lại
//      nguyên văn chứ không nuốt mất.
import { describe, expect, it, vi, afterEach } from 'vitest'
import { docVaiTuDuongDan, docDuongVao, laManThayQuanLy } from '../src/lib/vai-tro'
import { phieuCuaEm } from '../src/lib/exam-api'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('đường /d/<mã ca>', () => {
  it('đọc ra vai "diem" kèm mã ca, cả khi có gạch chéo cuối', () => {
    expect(docVaiTuDuongDan('/omr-app/d/248567')).toEqual({ vai: 'diem', maCa: '248567' })
    expect(docVaiTuDuongDan('/omr-app/d/248567/')).toEqual({ vai: 'diem', maCa: '248567' })
    expect(docVaiTuDuongDan('/d/1234')).toEqual({ vai: 'diem', maCa: '1234' })
  })

  it('không nuốt nhầm đường vào thi và đường phiếu', () => {
    expect(docVaiTuDuongDan('/omr-app/t/248567')).toEqual({ vai: null, maCa: '248567' })
    expect(docVaiTuDuongDan('/omr-app/p')).toEqual({ vai: 'phieu', maCa: '' })
    expect(docVaiTuDuongDan('/omr-app/gv')).toEqual({ vai: 'gv', maCa: '' })
  })

  it('mã ca phải là 4–8 chữ số, chữ cái không tính', () => {
    expect(docVaiTuDuongDan('/d/abc123')).toEqual({ vai: null, maCa: '' })
    expect(docVaiTuDuongDan('/d/12')).toEqual({ vai: null, maCa: '' })
  })

  it('404.html đổi sang ?vai=diem thì app vẫn đọc đúng', () => {
    expect(docDuongVao('?vai=diem&examCode=248567', '/')).toEqual({ vai: 'diem', maCa: '248567' })
  })

  it('KHÔNG phải app quản lý của thầy — không được hỏi mật khẩu', () => {
    expect(laManThayQuanLy('', '/omr-app/d/248567')).toBe(false)
    expect(laManThayQuanLy('?vai=diem&examCode=248567', '/')).toBe(false)
    // Đối chứng: đường của thầy vẫn phải hỏi.
    expect(laManThayQuanLy('', '/omr-app/')).toBe(true)
  })
})

describe('phieuCuaEm', () => {
  function gia(tra: unknown) {
    const goi = vi.fn(async () => ({ ok: true, json: async () => tra }))
    vi.stubGlobal('fetch', goi)
    return goi
  }

  it('gửi đủ ba thứ danh tính và trả mã phiếu', async () => {
    const goi = gia({ ok: true, ma: 'FjcLyEs4Hh', maBaiTap: 'GsHnAARbtV', tong: 6.69 })
    const kq = await phieuCuaEm('https://x', '248567', '12026', 'Kiều Minh Gia Huy', '2009')
    expect(kq).toEqual({ ma: 'FjcLyEs4Hh', maBaiTap: 'GsHnAARbtV', tong: 6.69 })
    const goiBody = JSON.parse((goi.mock.calls[0][1] as { body: string }).body)
    expect(goiBody).toMatchObject({
      action: 'phieuCuaEm',
      maCa: '248567',
      sbd: '12026',
      hoTen: 'Kiều Minh Gia Huy',
      namSinh: '2009',
    })
    // KHÔNG được kèm mã bí mật: đây là lệnh chạy trên MÁY EM.
    expect(Object.keys(goiBody)).not.toContain('secret')
  })

  it('máy chủ từ chối thì ném đúng câu của máy chủ, không nuốt mất', async () => {
    gia({ ok: false, lyDo: 'sai_ho_so', error: 'Số báo danh, họ tên hoặc năm sinh không khớp danh sách lớp' })
    await expect(phieuCuaEm('https://x', '248567', '12026', 'Sai Tên', '2009')).rejects.toThrow(
      /không khớp danh sách lớp/,
    )
  })

  it('chưa dựng phiếu thì nói rõ, không trả mã rỗng im lặng', async () => {
    gia({ ok: false, lyDo: 'chua_co_phieu', error: 'Thầy chưa dựng phiếu kết quả cho ca này' })
    await expect(phieuCuaEm('https://x', '248567', '12026', 'A', '2009')).rejects.toThrow(/chưa dựng phiếu/)
  })
})

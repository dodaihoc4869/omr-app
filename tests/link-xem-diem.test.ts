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

describe('phieuCuaEm — CHỈ hỏi số báo danh', () => {
  function gia(tra: unknown) {
    const goi = vi.fn(async () => ({ ok: true, json: async () => tra }))
    vi.stubGlobal('fetch', goi)
    return goi
  }

  const DAY_DU = {
    ok: true,
    ma: 'FjcLyEs4Hh',
    maBaiTap: 'GsHnAARbtV',
    tong: 6.69,
    hoTen: 'Kiều Minh Gia Huy',
    lop: '12',
    tenCa: '2009 - L1 - L1',
    thoiGianPhut: 20,
    giuDeDoc: true,
    luot: {
      lanThu: 1,
      vaoLuc: '2026-09-07T12:00:00.000Z',
      nopLuc: '2026-09-07T12:15:05.144Z',
      trangThai: 'da_nop',
      dapAn: { phanI: { q1: 'A' }, phanII: {}, phanIII: {} },
      giayCau: { q1: 12 },
      integrity: { leaveCount: 0, totalHiddenMs: 0, events: [], blocked: false },
      soLanRoiMan: 0,
      tongGiayRoiMan: 0,
    },
    bank: { phanI: [], phanII: [], phanIII: [] },
  }

  it('gói gửi đi chỉ có mã ca và số báo danh — KHÔNG hỏi họ tên, năm sinh', () => {
    const goi = gia(DAY_DU)
    return phieuCuaEm('https://x', '248567', '12026').then(() => {
      const b = JSON.parse((goi.mock.calls[0][1] as { body: string }).body)
      expect(b).toEqual({ action: 'phieuCuaEm', maCa: '248567', sbd: '12026' })
      // Thầy chốt 07/09: gõ ba ô trên điện thoại sai một dấu là tắc.
      expect(Object.keys(b)).not.toContain('hoTen')
      expect(Object.keys(b)).not.toContain('namSinh')
      expect(Object.keys(b)).not.toContain('secret')
    })
  })

  it('trả đủ thứ để dựng lại màn "Đã nộp bài", không chỉ mã phiếu', async () => {
    gia(DAY_DU)
    const kq = await phieuCuaEm('https://x', '248567', '12026')
    expect(kq.ma).toBe('FjcLyEs4Hh')
    expect(kq.hoTen).toBe('Kiều Minh Gia Huy')
    expect(kq.thoiGianPhut).toBe(20)
    expect(kq.giuDeDoc).toBe(true)
    expect(kq.luot.nopLuc).toBe('2026-09-07T12:15:05.144Z')
    expect(kq.luot.dapAn).toEqual({ phanI: { q1: 'A' }, phanII: {}, phanIII: {} })
    expect(kq.luot.giayCau).toEqual({ q1: 12 })
    expect(kq.bank).not.toBeNull()
  })

  it('máy chủ thiếu trường nào thì trả mặc định an toàn, không ném vỡ màn', async () => {
    gia({ ok: true })
    const kq = await phieuCuaEm('https://x', '248567', '12026')
    expect(kq.ma).toBe('')
    expect(kq.tong).toBeNull()
    expect(kq.bank).toBeNull()
    expect(kq.luot.lanThu).toBe(1)
    expect(kq.luot.dapAn).toBeNull()
  })

  it('số báo danh không có trong danh sách lớp thì bị chặn', async () => {
    gia({ ok: false, lyDo: 'khong_trong_danh_sach', error: 'Số báo danh không có trong danh sách lớp' })
    await expect(phieuCuaEm('https://x', '248567', '99999')).rejects.toThrow(/không có trong danh sách lớp/)
  })

  it('chưa nộp bài ca đó thì nói rõ, không trả bài rỗng', async () => {
    gia({ ok: false, lyDo: 'chua_nop', error: 'Em chưa nộp bài ca này' })
    await expect(phieuCuaEm('https://x', '248567', '12026')).rejects.toThrow(/chưa nộp bài/)
  })
})


describe('ĐỀ TRẢ VỀ PHẢI CÓ ĐÁP ÁN', () => {
  // Lần thử đầu 07/09: máy chủ trả `bankRef` — bản GỬI MÁY EM lúc thi, đã lược
  // sạch đáp án. Câu Phần II không có `correct` nên bước chấm lại nổ ở
  // `q.correct.join('')` và em nhìn thấy "Màn Làm bài gặp lỗi".
  it('bản lược đáp án bị nhận ra: câu Phần II thiếu `correct`', () => {
    const luoc = { phanI: [{ id: 'a', text: 't', choices: ['1', '2', '3', '4'] }], phanII: [{ id: 'b', text: 't', ideas: ['1', '2', '3', '4'] }], phanIII: [{ id: 'c', text: 't' }] }
    const day = { phanI: [{ id: 'a', text: 't', choices: ['1', '2', '3', '4'], correct: 'A' }], phanII: [{ id: 'b', text: 't', ideas: ['1', '2', '3', '4'], correct: ['D', 'S', 'D', 'S'] }], phanIII: [{ id: 'c', text: 't', correct: '1' }] }
    const co = (b: { phanI: { correct?: unknown }[]; phanII: { correct?: unknown }[]; phanIII: { correct?: unknown }[] }) => {
      if (b.phanII.length > 0 && !Array.isArray(b.phanII[0]?.correct)) return false
      if (b.phanI.length > 0 && !b.phanI[0]?.correct) return false
      if (b.phanIII.length > 0 && b.phanIII[0]?.correct === undefined) return false
      return b.phanI.length + b.phanII.length + b.phanIII.length > 0
    }
    expect(co(luoc)).toBe(false)
    expect(co(day)).toBe(true)
    expect(co({ phanI: [], phanII: [], phanIII: [] })).toBe(false)
  })
})

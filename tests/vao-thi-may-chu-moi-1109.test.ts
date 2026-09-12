// VÀO THI QUA MÁY CHỦ MỚI — 11/09.
//
// VÌ SAO LỆNH NÀY LÀ THEN CHỐT: `luu-tam` và `nop` trên Worker chỉ CẬP NHẬT
// dòng lượt do `/vao-thi` tạo ra. Vào thi còn ở Apps Script thì hai lệnh kia
// không bao giờ tìm thấy dòng nào, trả `khong_dang_lam`, và lùi hết về đường
// cũ — tức cả đợt 3 nằm im dù cờ đã bật.
//
// CHỖ NGUY HIỂM NHẤT là ca ĐỀ RIÊNG. Máy em cắt đề theo `boCuaEm`; máy thầy
// chấm theo bản đồ trên máy chủ. Lệch nhau là điểm sai LẶNG LẼ — đúng lỗi làm
// em 12124 tụt 5,69 xuống 2,56 hôm 10/09. Nửa sau tệp này canh đúng chỗ đó.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const URL_CU = 'https://script.example/exec'
const URL_MOI = 'https://omr.example'

/** Bật cờ máy chủ mới cho toàn bộ tệp này. */
function batCoMayChuMoi() {
  vi.doMock('../src/lib/may-chu-moi', async (goc) => {
    const that = (await goc()) as Record<string, unknown>
    return {
      ...that,
      layCauHinhMayChu: async () => ({
        BAT: true, URL: URL_MOI, HAN_GIAY: 10, HAN_NONG_GIAY: 3,
        SO_LAN_THU: 3, LUI_VE_APPS_SCRIPT: true, GIAN_VAO_THI_GIAY: 0,
      }),
    }
  })
}

const CA_CO_BAN = {
  ok: true, cach: 'moi', lanThu: 1, vaoLuc: '2026-09-11T07:00:00.000Z',
  hetGioLuc: '2026-09-11T07:45:00.000Z', thoiGianPhut: 45, congBo: 'khong',
  loai: 'thi', hanNop: '', tenCa: 'Lớp 1', nguongLan: 3, nguongGiay: 10,
  lop: '12', giuDeDoc: false, anHanGiay: 0, deUrl: null,
}

const DE = { phanI: [{ id: 'q1' }], phanII: [], phanIII: [] }

/** Giả mạng: trả theo đường gọi. `theoDuong` nhận (url, than) → đối tượng. */
function gaMang(theoDuong: (url: string, than: Record<string, unknown>) => unknown) {
  vi.stubGlobal('fetch', async (u: string, init?: RequestInit) => {
    const than = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {}
    const kq = theoDuong(String(u), than)
    if (kq === null) return new Response('{}', { status: 500 })
    return new Response(JSON.stringify(kq), { status: 200 })
  })
}

beforeEach(() => {
  vi.resetModules()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.doUnmock('../src/lib/may-chu-moi')
})

describe('ĐƯỜNG NHANH CHẠY ĐƯỢC', () => {
  it('máy chủ mới trả lời ⇒ KHÔNG chạm Apps Script lần nào', async () => {
    batCoMayChuMoi()
    let chamCu = 0
    gaMang((u) => {
      if (u.includes('script.example')) {
        chamCu += 1
        return { ok: true, cach: 'moi', lop: '12', thoiGianPhut: 45, lanThu: 1, vaoLuc: 'a', hetGioLuc: 'b' }
      }
      return CA_CO_BAN
    })
    const { vaoThi } = await import('../src/lib/exam-api')
    const kq = await vaoThi(URL_CU, 'ca1', '10001', 'tb', false)
    expect(kq.ok).toBe(true)
    expect(chamCu).toBe(0)
  })

  it('PHÒNG CHỜ trả đúng dáng riêng — không kèm lượt, không kèm đồng hồ', async () => {
    batCoMayChuMoi()
    gaMang((u) => (u.includes('script.example') ? { ok: false } : { ok: true, cach: 'cho', lop: '12', thoiGianPhut: 45, congBo: 'khong', tenCa: 'Lớp 1' }))
    const { vaoThi } = await import('../src/lib/exam-api')
    const kq = await vaoThi(URL_CU, 'ca1', '10001', 'tb', false)
    expect(kq.ok).toBe(true)
    if (kq.ok) {
      expect(kq.cach).toBe('cho')
      expect((kq as unknown as { hetGioLuc?: string }).hetGioLuc).toBeUndefined()
    }
  })

  it('em CẦN đề ⇒ tải gói đề từ máy chủ mới và trả kèm', async () => {
    batCoMayChuMoi()
    gaMang((u) => {
      if (u.includes('/de/')) return DE
      if (u.includes('script.example')) return { ok: false }
      return { ...CA_CO_BAN, deUrl: '/de/ca1' }
    })
    const { vaoThi } = await import('../src/lib/exam-api')
    const kq = await vaoThi(URL_CU, 'ca1', '10001', 'tb', true)
    expect(kq.ok).toBe(true)
    if (kq.ok && kq.cach !== 'cho') expect(kq.bank).toEqual(DE)
  })

  it('máy chủ mới TỪ CHỐI có lý do rõ ⇒ tin và báo cho em, không hỏi lại chỗ cũ', async () => {
    batCoMayChuMoi()
    let chamCu = 0
    gaMang((u) => {
      if (u.includes('script.example')) {
        chamCu += 1
        return { ok: true, cach: 'moi', lop: '12', thoiGianPhut: 45, lanThu: 1, vaoLuc: 'a', hetGioLuc: 'b' }
      }
      return { ok: false, lyDo: 'khong_co_sbd' }
    })
    const { vaoThi } = await import('../src/lib/exam-api')
    const kq = await vaoThi(URL_CU, 'ca1', '99999', 'tb', false)
    expect(kq.ok).toBe(false)
    if (!kq.ok) expect(kq.lyDo).toBe('khong_co_sbd')
    expect(chamCu).toBe(0)
  })
})

// KHÔNG CÒN ĐƯỜNG LÙI — ĐỔI LUẬT 12/09.
//
// Bản 11/09 để mọi trục trặc "im lặng lùi về Apps Script": em chỉ chậm, không
// hỏng. Thầy chốt "gỡ sạch google", nên lùi về đâu cũng không còn. Bản trước
// vẫn giữ nguyên các câu `return null` ấy, và chúng rơi vào cổng `/goi` của
// CHÍNH máy chủ này — mà `/goi` trả `deUrl` chứ không trả gói đề. Kết quả: ca
// Test6 (455713) tối 11/09 mở bình thường, đề nằm sẵn trong R2, bản đồ có đủ
// em, mà em vẫn đọc "Máy chủ chưa gửi đề — bấm Vào thi lại".
//
// LUẬT MỚI: hỏng thì NÓI THÀNH LỜI, nói đúng chỗ hỏng và việc em phải làm.
describe('KHÔNG CÒN ĐƯỜNG LÙI — hỏng phải nói thành lời', () => {
  it('CẤU HÌNH TRỐNG nhưng chỗ gọi có địa chỉ thật ⇒ vẫn vào thi được', async () => {
    // Máy em vừa mở app, cấu hình trong IndexedDB chưa kịp nạp. Một luật địa
    // chỉ cho cả app (giống `postJson`): lấy cấu hình trước, trống thì dùng địa
    // chỉ chỗ gọi truyền vào — miễn là nó không trỏ về Google.
    gaMang(() => ({ ok: true, cach: 'moi', lop: '12', thoiGianPhut: 45, lanThu: 1, vaoLuc: 'a', hetGioLuc: 'b' }))
    const { vaoThi } = await import('../src/lib/exam-api')
    const kq = await vaoThi('https://may-chu-that.example', 'ca1', '10001', 'tb', false)
    expect(kq.ok).toBe(true)
  })

  it('KHÔNG CÓ ĐỊA CHỈ Ở ĐÂU CẢ ⇒ nói thẳng, không gọi đi đâu hết', async () => {
    let cham = 0
    gaMang(() => {
      cham += 1
      return { ok: true, cach: 'moi', lop: '12', thoiGianPhut: 45, lanThu: 1, vaoLuc: 'a', hetGioLuc: 'b' }
    })
    const { vaoThi } = await import('../src/lib/exam-api')
    await expect(vaoThi('', 'ca1', '10001', 'tb', false)).rejects.toThrow(/chưa có địa chỉ máy chủ/i)
    expect(cham).toBe(0)
  })

  it('địa chỉ trỏ VỀ GOOGLE ⇒ bị chặn cứng, không một byte nào chạm Apps Script', async () => {
    let cham = 0
    gaMang(() => {
      cham += 1
      return { ok: true, cach: 'moi', lop: '12', thoiGianPhut: 45, lanThu: 1, vaoLuc: 'a', hetGioLuc: 'b' }
    })
    const { vaoThi } = await import('../src/lib/exam-api')
    await expect(
      vaoThi('https://script.google.com/macros/s/AKfy/exec', 'ca1', '10001', 'tb', false),
    ).rejects.toThrow(/chưa có địa chỉ máy chủ/i)
    expect(cham).toBe(0)
  })

  it('máy chủ CHẾT ⇒ báo "không kết nối được", không treo im lặng', async () => {
    batCoMayChuMoi()
    gaMang(() => null) // mọi đường đều 500
    const { vaoThi } = await import('../src/lib/exam-api')
    await expect(vaoThi(URL_CU, 'ca1', '10001', 'tb', false)).rejects.toThrow(/Không kết nối được máy chủ/)
  }, 20000)

  it('em CẦN đề mà ca CHƯA được phát đề ⇒ chỉ đúng việc Thầy phải làm', async () => {
    batCoMayChuMoi()
    gaMang(() => ({ ...CA_CO_BAN, deUrl: null }))
    const { vaoThi } = await import('../src/lib/exam-api')
    await expect(vaoThi(URL_CU, 'ca1', '10001', 'tb', true)).rejects.toThrow(/chưa được phát đề/)
  })

  it('tải gói đề HỎNG giữa chừng ⇒ báo đúng "không tải được đề"', async () => {
    batCoMayChuMoi()
    gaMang((u) => (u.includes('/de/') ? null : { ...CA_CO_BAN, deUrl: '/de/ca1' }))
    const { vaoThi } = await import('../src/lib/exam-api')
    await expect(vaoThi(URL_CU, 'ca1', '10001', 'tb', true)).rejects.toThrow(/Không tải được đề/)
  })
})

describe('ĐỀ RIÊNG — chỗ sai một lần là điểm em sai lặng lẽ', () => {
  const GOI = { bo: { '10001': ['q1', 'q2'] }, lap: { '10001': ['q1'] }, dem: { '10001': { q1: 2 } } }

  it('bản đồ CÓ phần của em ⇒ trả đúng bộ câu, đúng câu hỏi lại, đúng số lần sai', async () => {
    batCoMayChuMoi()
    gaMang((u) => (u.includes('script.example') ? { ok: false } : { ...CA_CO_BAN, boTheoEm: GOI }))
    const { vaoThi } = await import('../src/lib/exam-api')
    const kq = await vaoThi(URL_CU, 'ca1', '10001', 'tb', false)
    expect(kq.ok).toBe(true)
    if (kq.ok && kq.cach !== 'cho') {
      expect(kq.boCuaEm).toEqual(['q1', 'q2'])
      expect(kq.cauLap).toEqual(['q1'])
      expect(kq.demLap).toEqual({ q1: 2 })
    }
  })

  it('ca có bản đồ mà THIẾU phần của CHÍNH EM NÀY ⇒ TỪ CHỐI hẳn, không phát đề sai', async () => {
    batCoMayChuMoi()
    gaMang(() => ({ ...CA_CO_BAN, boTheoEm: { bo: { '99999': ['q1'] } } }))
    const { vaoThi } = await import('../src/lib/exam-api')
    const kq = await vaoThi(URL_CU, 'ca1', '10001', 'tb', false)
    expect(kq.ok).toBe(false)
    if (!kq.ok) expect(kq.lyDo).toBe('thieu_bo_cau')
  })

  it('bộ câu của em RỖNG cũng tính là thiếu ⇒ TỪ CHỐI hẳn', async () => {
    batCoMayChuMoi()
    gaMang(() => ({ ...CA_CO_BAN, boTheoEm: { bo: { '10001': [] } } }))
    const { vaoThi } = await import('../src/lib/exam-api')
    const kq = await vaoThi(URL_CU, 'ca1', '10001', 'tb', false)
    expect(kq.ok).toBe(false)
    if (!kq.ok) expect(kq.lyDo).toBe('thieu_bo_cau')
  })

  it('CÔNG BỐ KHI CẢ LỚP NỘP XONG ⇒ VẪN đi đường nhanh — cổng ấy nay nằm ở D1', async () => {
    // LUẬT CŨ: chế độ này phải đi đường cũ, vì cổng công bố đếm số em đang làm
    // từ bảng bên Apps Script, mà lượt vào thi trên máy chủ mới không ghi sang
    // đó ⇒ đếm ra 0 và đáp án bung ra giữa giờ.
    //
    // LUẬT MỚI: `ketQuaCuaEm` đếm thẳng bảng `luot` trong D1 — đúng nơi lượt vào
    // thi được ghi. Bỏ cuộc ở đây chính là lỗi ca Test6: ca lành mà em không vào
    // được. Phép kiểm này canh để không ai nối lại chốt cũ.
    batCoMayChuMoi()
    let chamCu = 0
    gaMang((u) => {
      if (u.includes('script.example') || u.includes('/goi')) {
        chamCu += 1
        return { ok: true, cach: 'moi', lop: '12', thoiGianPhut: 45, lanThu: 1, vaoLuc: 'a', hetGioLuc: 'b' }
      }
      return { ...CA_CO_BAN, congBo: 'ca_lop_xong' }
    })
    const { vaoThi } = await import('../src/lib/exam-api')
    const kq = await vaoThi(URL_CU, 'ca1', '10001', 'tb', false)
    expect(kq.ok).toBe(true)
    if (kq.ok && kq.cach !== 'cho') expect(kq.congBo).toBe('ca_lop_xong')
    expect(chamCu).toBe(0)
  })

  it('công bố NGAY hoặc KHÔNG ⇒ vẫn đi đường nhanh', async () => {
    batCoMayChuMoi()
    let chamCu = 0
    gaMang((u) => {
      if (u.includes('omr.example') && !u.includes('/goi')) return { ...CA_CO_BAN, congBo: 'ngay' }
      chamCu += 1
      return { ok: true }
    })
    const { vaoThi } = await import('../src/lib/exam-api')
    const kq = await vaoThi(URL_CU, 'ca1', '10001', 'tb', false)
    expect(kq.ok).toBe(true)
    expect(chamCu).toBe(0)
  })

  it('ca KHÔNG đề riêng (không có bản đồ) ⇒ vẫn đi đường nhanh bình thường', async () => {
    batCoMayChuMoi()
    let chamCu = 0
    gaMang((u) => {
      if (u.includes('omr.example') && !u.includes('/goi')) return CA_CO_BAN
      chamCu += 1
      return { ok: true }
    })
    const { vaoThi } = await import('../src/lib/exam-api')
    const kq = await vaoThi(URL_CU, 'ca1', '10001', 'tb', false)
    expect(kq.ok).toBe(true)
    expect(chamCu).toBe(0)
  })
})

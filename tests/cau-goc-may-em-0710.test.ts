// "Xem câu gốc" — PHẦN LÕI / MÁY EM (thầy 07/10: nút nhỏ hiển thị câu gốc đã đúng để em đối chiếu kiến thức của câu thay thế; rút gọn ghi chú).
//   · tách nhãn câu thay (`tachNhanThay`) + dòng đậm ngắn (`chuNganNhanThay`): chữ đầy đủ vẫn lưu ở ca, máy em hiện bản gọn;
//   · khoá "~goc:<qid câu thay>" trong bản đồ nhãn: tạo (banDoDaDung), đọc (gocCuaCauThay, cacCauGocCuaEm), giữ qua `daDungCuaEm`;
//   · bộ đọc phòng thủ nội dung câu gốc (`docCauGoc`): chỉ phần ĐỀ, không bao giờ đáp án / lời giải;
//   · `layCauGocQuaMayChu`: gói hỏi máy chủ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  xongNapDiaChi: async () => {},
  layCauHinhMayChu: async () => ({ BAT: true, URL: 'https://may.test', HAN_GIAY: 5, HAN_NONG_GIAY: 3, SO_LAN_THU: 1, LUI_VE_APPS_SCRIPT: false }),
}))

const lib = await import('../src/lib/rut-de-da-dung')
const { docCauGoc, docBangCauGoc } = await import('../src/lib/cau-goc')
const { layCauGocQuaMayChu } = await import('../src/lib/exam-api')
const { tachNhanThay, chuNganNhanThay, nhanThay, daDungCuaEm, gocCuaCauThay, cacCauGocCuaEm, khoaGoc, laKhoaGoc, TIEN_TO_GOC } = lib

const NOI = 'Ca Kiểm tra tuần 3 · 28/09 · Thông hiểu'

describe('tachNhanThay — tách nhãn câu thay để máy em hiện bản gọn', () => {
  it('vòng tròn với `nhanThay`: mọi kiểu × lý thuyết × nơi (kể cả nơi rỗng ⇒ "trước đây")', () => {
    const noiMau = [NOI, 'Chiến dịch Ôn chương 1 — Ester và chất béo (Đảo thần thú) · 28/09 · Vận dụng', 'Ôn lại câu sai · 30/09', '', '   ']
    for (const kieu of ['thay_so', 'cung_dang'] as const) {
      for (const ly of [false, true]) {
        for (const noi of noiMau) {
          const t = tachNhanThay(nhanThay(kieu, ly, noi))
          expect(t, `${kieu}/${ly}/${noi}`).toEqual({ kieu, lyThuyet: kieu === 'cung_dang' && ly, noi: noi.trim() })
        }
      }
    }
  })

  it('nhãn đã LƯU ở ca mở từ 06/10 (chuỗi cứng) vẫn tách được', () => {
    expect(tachNhanThay('Câu này thay số của câu em đã đúng ở Ca Kiểm tra tuần 3 · 28/09 · Nhận biết')).toEqual({ kieu: 'thay_so', lyThuyet: false, noi: 'Ca Kiểm tra tuần 3 · 28/09 · Nhận biết' })
    expect(tachNhanThay('Câu lý thuyết này thay cho câu em đã đúng ở Ca Kiểm tra tuần 3 · 28/09 · Nhận biết (cùng dạng bài, nội dung khác)')).toEqual({ kieu: 'cung_dang', lyThuyet: true, noi: 'Ca Kiểm tra tuần 3 · 28/09 · Nhận biết' })
    expect(tachNhanThay('Câu này thay cho câu em đã đúng trước đây (cùng dạng bài, nội dung khác)')).toEqual({ kieu: 'cung_dang', lyThuyet: false, noi: '' })
  })

  it('nhãn câu NGUYÊN VĂN hoặc không phải chuỗi ⇒ null (không bao giờ nhầm thành câu thay)', () => {
    for (const x of [NOI, `Em đã làm đúng: ${NOI}`, 'Ôn lại câu sai · 30/09', '', '   ', 'Câu này', 'Câu này thay số', undefined, null, 5, {}, []]) expect(tachNhanThay(x), String(x)).toBeNull()
  })

  it('khớp với `laNhanThay` (một định nghĩa): nhãn nào tách được thì là nhãn thay, và ngược lại', () => {
    for (const x of [nhanThay('thay_so', false, NOI), nhanThay('cung_dang', true, NOI), nhanThay('cung_dang', false, ''), NOI, `Em đã làm đúng: ${NOI}`, '']) {
      expect(tachNhanThay(x) !== null, x).toBe(lib.laNhanThay(x))
    }
  })
})

describe('chuNganNhanThay — dòng đậm ngắn', () => {
  it('ba dòng cố định; luôn NGẮN hơn nhãn đầy đủ và không lặp phần nơi / "cùng dạng bài, nội dung khác"', () => {
    expect(chuNganNhanThay({ kieu: 'thay_so', lyThuyet: false })).toBe('Thay số từ câu em đã đúng')
    expect(chuNganNhanThay({ kieu: 'cung_dang', lyThuyet: true })).toBe('Thay cho câu lý thuyết em đã đúng')
    expect(chuNganNhanThay({ kieu: 'cung_dang', lyThuyet: false })).toBe('Thay cho câu em đã đúng')
    for (const kieu of ['thay_so', 'cung_dang'] as const) {
      for (const ly of [false, true]) {
        const ngan = chuNganNhanThay({ kieu, lyThuyet: ly })
        const day = nhanThay(kieu, ly, NOI)
        expect(ngan.length).toBeLessThan(day.length / 2)
        expect(ngan).not.toContain('cùng dạng bài')
        expect(ngan).not.toContain('Ca Kiểm tra')
      }
    }
  })
})

describe('khoá câu gốc "~goc:<qid câu thay>" trong bản đồ nhãn của em', () => {
  it('tên khoá: tiền tố cố định, không thể trùng một qid thật; nhận ra / bỏ tiền tố đúng', () => {
    expect(TIEN_TO_GOC).toBe('~goc:')
    expect(khoaGoc('Q1~ss2')).toBe('~goc:Q1~ss2')
    expect(laKhoaGoc('~goc:Q1~ss2')).toBe(true)
    for (const q of ['Q1~ss2', 'DH-12-C3-B10-II-22', 'goc:Q1', '']) expect(laKhoaGoc(q)).toBe(false)
  })

  it('gocCuaCauThay: đọc đúng câu gốc của câu thay; thiếu / hỏng ⇒ rỗng', () => {
    const m = { 'Q1~ss1': 'nhãn', [khoaGoc('Q1~ss1')]: ' Q1 ', [khoaGoc('Q2~ss1')]: 7 as never }
    expect(gocCuaCauThay(m, 'Q1~ss1')).toBe('Q1')
    expect(gocCuaCauThay(m, 'Q2~ss1')).toBe('')
    expect(gocCuaCauThay(m, 'KHAC')).toBe('')
    expect(gocCuaCauThay(null, 'Q1~ss1')).toBe('')
    expect(gocCuaCauThay(undefined, 'Q1~ss1')).toBe('')
  })

  it('cacCauGocCuaEm: mọi câu gốc (không trùng), bỏ khoá không phải "~goc:" và giá trị rỗng / không phải chuỗi', () => {
    const m = { a: 'nhãn', [khoaGoc('t1')]: 'Q1', [khoaGoc('t2')]: 'Q2', [khoaGoc('t3')]: 'Q1', [khoaGoc('t4')]: '', [khoaGoc('t5')]: 3, '~goc': 'Q9' }
    expect(cacCauGocCuaEm(m).sort()).toEqual(['Q1', 'Q2'])
    expect(cacCauGocCuaEm(null)).toEqual([])
  })

  it('daDungCuaEm GIỮ khoá "~goc:" (đi qua gói đề của em), vẫn bỏ giá trị rỗng / không phải chuỗi và cắt nhãn dài', () => {
    const ra = daDungCuaEm({ Q1: nhanThay('thay_so', false, NOI), [khoaGoc('Q1')]: 'Q0', Q2: '   ', Q3: 5, Q4: 'x'.repeat(400) })
    expect(ra[khoaGoc('Q1')]).toBe('Q0')
    expect(ra.Q1).toBe(nhanThay('thay_so', false, NOI))
    expect('Q2' in ra).toBe(false)
    expect('Q3' in ra).toBe(false)
    expect(ra.Q4!.length).toBe(260)
    expect(daDungCuaEm([])).toEqual({})
    expect(daDungCuaEm(null)).toEqual({})
  })
})

describe('docCauGoc — chỉ phần ĐỀ; không bao giờ đáp án', () => {
  const day = {
    qid: 'Q1', phan: 'I', text: 'Chất nào sau đây là este?', choices: ['HCOOCH₃', 'CH₃COOH', 'C₂H₅OH', 'CH₃CHO', 'THỪA-E'], ideas: [],
    table: [['Chất', 'M'], ['X', '60']], thanCauImg: 'https://anh.test/de.png', imageDataUrl: 'data:image/png;base64,AAAA',
    choiceImgs: ['data:image/png;base64,BBBB', '', null, 'javascript:alert(1)'],
    hinhAnh: [{ src: 'data:image/png;base64,CCCC', viTri: 'sau_de', alt: 'Hình đề' }, { src: 'data:image/png;base64,ANH-LOI-GIAI', viTri: 'sau_loi_giai' }, { src: '/anh/x.png', viTri: 'sau_pa_B' }, { src: 'https://anh.test/y.png', viTri: 'vi-tri-la' }, null, 7],
    // các trường KHÔNG được vào máy em
    correct: 'A', solution: 'LỜI GIẢI BÍ MẬT', reviewed: true, kienThuc: ['k1'], mucDo: 'hieu', dang: 'ES.A.X', maDe: 'DE1', version: 'v', group: 'g', truongLa: 'T',
  }

  it('giữ: qid, phần, đề, tối đa 4 phương án, bảng, ảnh đề, ảnh phương án, ảnh theo vị trí hợp lệ', () => {
    const c = docCauGoc(day)!
    expect(c).toMatchObject({ qid: 'Q1', phan: 'I', text: 'Chất nào sau đây là este?', table: [['Chất', 'M'], ['X', '60']], thanCauImg: 'https://anh.test/de.png', imageDataUrl: 'data:image/png;base64,AAAA' })
    expect(c.choices).toEqual(['HCOOCH₃', 'CH₃COOH', 'C₂H₅OH', 'CH₃CHO'])
    expect(c.choiceImgs).toEqual(['data:image/png;base64,BBBB', undefined, undefined, undefined])
    expect(c.hinhAnh).toEqual([{ src: 'data:image/png;base64,CCCC', viTri: 'sau_de', alt: 'Hình đề' }, { src: '/anh/x.png', viTri: 'sau_pa_B' }])
  })

  it('bỏ MỌI trường ngoài danh sách công khai (đáp án, lời giải, nhãn nội bộ) và ảnh lời giải', () => {
    const c = docCauGoc(day) as Record<string, unknown>
    for (const k of ['correct', 'solution', 'reviewed', 'kienThuc', 'mucDo', 'dang', 'maDe', 'version', 'group', 'truongLa']) expect(k in c, k).toBe(false)
    const chuoi = JSON.stringify(c)
    for (const bi of ['LỜI GIẢI BÍ MẬT', 'ANH-LOI-GIAI', 'javascript:']) expect(chuoi, bi).not.toContain(bi)
  })

  it('hỏng ⇒ null: không phải đối tượng, thiếu qid / phần, không có đề lẫn ảnh đề', () => {
    for (const x of [null, undefined, 'x', 5, [], {}, { qid: 'Q', phan: 'IV', text: 'a' }, { qid: '', phan: 'I', text: 'a' }, { qid: 'Q', phan: 'I', text: '   ' }, { qid: 'Q', phan: 'I' }]) expect(docCauGoc(x), JSON.stringify(x)).toBeNull()
    expect(docCauGoc({ qid: 'Q', phan: 'II', text: '', thanCauImg: 'https://anh.test/d.png' })).not.toBeNull() // đề là ảnh
  })

  it('chỉ nhận nguồn ảnh an toàn: data:image, http(s), đường dẫn gốc "/"', () => {
    const c = docCauGoc({ qid: 'Q', phan: 'III', text: 'a', imageDataUrl: 'javascript:alert(1)', thanCauImg: 'data:text/html;base64,AAAA' })!
    expect('imageDataUrl' in c).toBe(false)
    expect('thanCauImg' in c).toBe(false)
  })

  it('docBangCauGoc: bỏ phần tử hỏng; khoá `__proto__` chỉ là khoá thường, không đổi nguyên mẫu', () => {
    const bang = docBangCauGoc(JSON.parse('{"Q1":{"qid":"Q1","phan":"I","text":"a"},"Q2":{"x":1},"__proto__":{"qid":"P","phan":"I","text":"p"}}'))
    expect(Object.keys(bang).sort()).toEqual(['Q1', '__proto__'])
    expect(Object.getPrototypeOf(bang)).toBe(Object.prototype)
    expect(docBangCauGoc(null)).toEqual({})
    expect(docBangCauGoc([1])).toEqual({})
  })
})

describe('layCauGocQuaMayChu — gói hỏi máy chủ', () => {
  const GOC = { qid: 'Q1', phan: 'I', text: 'Đề', choices: ['a', 'b', 'c', 'd'], correct: 'A', solution: 'BÍ MẬT' }
  const dap = (body: unknown, status = 200) => vi.fn(async () => ({ ok: status < 400, status, json: async () => body }) as Response)
  beforeEach(() => vi.stubGlobal('fetch', dap({ ok: true, cau: {} })))
  afterEach(() => vi.unstubAllGlobals())

  it('gửi đúng một lệnh POST /hs/cau-goc với { maCa, sbd, qid:[câu gốc] }; trả phần đề, bỏ đáp án nếu máy chủ lỡ gửi thừa', async () => {
    const f = dap({ ok: true, cau: { Q1: GOC }, khongCo: [] })
    vi.stubGlobal('fetch', f)
    const c = await layCauGocQuaMayChu('https://kich-ban.test', 'KC', 'S1', 'Q1')
    expect(f).toHaveBeenCalledTimes(1)
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://may.test/hs/cau-goc')
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({ maCa: 'KC', sbd: 'S1', qid: ['Q1'] })
    expect(c).toEqual({ qid: 'Q1', phan: 'I', text: 'Đề', choices: ['a', 'b', 'c', 'd'] })
    expect(JSON.stringify(c)).not.toMatch(/BÍ MẬT|correct|solution/)
  })

  it('máy chủ trả lời "không có" (khongCo) ⇒ null — không phải lỗi', async () => {
    vi.stubGlobal('fetch', dap({ ok: true, cau: {}, khongCo: ['Q1'] }))
    expect(await layCauGocQuaMayChu('x', 'KC', 'S1', 'Q1')).toBeNull()
  })

  it('câu máy chủ trả KHÔNG phải câu đã xin (qid khác) ⇒ null, không lấy nhầm', async () => {
    vi.stubGlobal('fetch', dap({ ok: true, cau: { Q2: { ...GOC, qid: 'Q2' } } }))
    expect(await layCauGocQuaMayChu('x', 'KC', 'S1', 'Q1')).toBeNull()
  })

  it('máy chủ báo ok:false (đóng cửa, lỗi tạm) hoặc không với tới được ⇒ NÉM LỖI để em bấm lại (không giả "không có")', async () => {
    vi.stubGlobal('fetch', dap({ ok: false, error: 'Chưa kiểm tra xong phạm vi đề thi đang bảo vệ. Em thử lại sau.' }))
    await expect(layCauGocQuaMayChu('x', 'KC', 'S1', 'Q1')).rejects.toThrow()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    await expect(layCauGocQuaMayChu('x', 'KC', 'S1', 'Q1')).rejects.toThrow()
    vi.stubGlobal('fetch', dap({}, 500))
    await expect(layCauGocQuaMayChu('x', 'KC', 'S1', 'Q1')).rejects.toThrow()
  })
})

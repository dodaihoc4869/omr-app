// RÚT ĐỀ CA KIỂM TRA v2 (02/10) — PHẦN MÁY THẦY / MÁY EM:
//   · khối Bộ câu ra đề: "Cả lớp cùng một đề" ⇒ KHÔNG nhân kho; "Kiểm tra điểm yếu" ⇒ ca đề riêng từng em;
//   · `batDauThi` chốt bằng `/ca/chot-bat-dau` (một lệnh), máy chủ cũ (404) ⇒ đường cũ;
//   · máy em: máy chủ trả `cho_bo_cau` ⇒ tự thử lại, không cắt đề theo băm;
//   · chạy thử lúc mở ca rồi chốt lúc Bắt đầu: dùng lại kết quả, chỉ rút thêm cho em vào sau, nối câu song sinh vào kho ca.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

const loiDenHanTheoEm = vi.fn()
const noiKhoCa = vi.fn(async () => ({ themBank: 1, themKey: 1 }))
const loadSessionTeacherBank = vi.fn()
const saveSessionTeacherBank = vi.fn(async () => {})
const docSoCauCa = vi.fn()
const loadExamSources = vi.fn(async () => [])

vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  loiDenHanTheoEm: (...a: unknown[]) => loiDenHanTheoEm(...a),
  noiKhoCa: (...a: unknown[]) => noiKhoCa(...(a as [])),
}))
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  loadSessionTeacherBank: (...a: unknown[]) => loadSessionTeacherBank(...a),
  saveSessionTeacherBank: (...a: unknown[]) => saveSessionTeacherBank(...(a as [])),
  docSoCauCa: (...a: unknown[]) => docSoCauCa(...a),
  loadExamSources: (...a: unknown[]) => loadExamSources(...(a as [])),
}))

const { default: KhoiRutDe } = await import('../src/components/KhoiRutDe')
const { chayThuRutDeCa, chotRutDeCa, docRutThu } = await import('../src/lib/de-rieng-v2')
const { soCauLenBang, dungUngVien } = await import('../src/lib/rut-de')

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

// Kho hợp lệ: 60 câu Phần I, 20 Phần II, 20 Phần III (đáp án số) — đủ lớn để thấy kho bị nhân hay không.
const mcq = (id: string) => ({ id, text: `Đốt cháy hoàn toàn ${id} mol ester tính khối lượng m gam`, choices: ['1,2', '2,4', '3,6', '4,8'] as [string, string, string, string], correct: 'A' as const, chuyenDe: 'Ester', mucDo: 'hieu' })
const ds = (id: string) => ({ id, text: `Cho các phát biểu về ${id}`, ideas: ['a', 'b', 'c', 'd'] as [string, string, string, string], correct: ['D', 'S', 'D', 'S'] as ['D', 'S', 'D', 'S'], chuyenDe: 'Ester', mucDo: 'hieu' })
const tln = (id: string) => ({ id, text: `Tính thể tích khí ${id} (lít)`, correct: '2,24', chuyenDe: 'Ester', mucDo: 'van_dung' })
const NGUON = [{ maDe: 'D', phanI: Array.from({ length: 60 }, (_, i) => mcq(`D-I-${i}`)), phanII: Array.from({ length: 20 }, (_, i) => ds(`D-II-${i}`)), phanIII: Array.from({ length: 20 }, (_, i) => tln(`D-III-${i}`)) }]

describe('khối Bộ câu ra đề — cờ "riêng" theo lựa chọn của thầy', () => {
  it('"Cả lớp cùng một đề" (mặc định) ⇒ kho ca ĐÚNG bằng số câu mỗi em (9·2·3), không nhân 3', () => {
    const onDoi = vi.fn()
    render(<KhoiRutDe nguon={NGUON as never} qidCaTruoc={[]} phutLamBai={45} onDoi={onDoi} />)
    const cuoi = () => onDoi.mock.calls.at(-1)?.[0] as { ids: Set<string>; soCau: { I: number; II: number; III: number }; deRieng?: boolean }
    expect(cuoi().deRieng).toBe(false)
    expect(cuoi().soCau).toEqual({ I: 9, II: 2, III: 3 })
    expect(cuoi().ids.size).toBe(14)
    fireEvent.click(screen.getByText(/Đề riêng từng em/))
    expect(cuoi().deRieng).toBe(true)
    expect(cuoi().ids.size).toBe(100) // đề riêng: đẩy kho rộng để lúc Bắt đầu rút từng em
    fireEvent.click(screen.getByText(/Cả lớp cùng một đề/))
    expect(cuoi().ids.size).toBe(14)
  })

  it('"Kiểm tra điểm yếu" ⇒ ca đề riêng từng em (cờ đề riêng + lên bảng), đủ số câu chẩn đoán theo thời lượng', () => {
    const onDoi = vi.fn()
    render(<KhoiRutDe nguon={NGUON as never} qidCaTruoc={[]} phutLamBai={15} onDoi={onDoi} />)
    fireEvent.click(screen.getByText('Kiểm tra điểm yếu'))
    const k = onDoi.mock.calls.at(-1)?.[0] as { lenBang: boolean; deRieng?: boolean; soCau: unknown }
    expect(k.lenBang).toBe(true)
    expect(k.deRieng).toBe(true)
    expect(k.soCau).toEqual(soCauLenBang(dungUngVien(NGUON as never), 15))
    expect(screen.getByText(/Mỗi em một bộ câu riêng/)).toBeTruthy()
  })
})

// =====================================================================================================
const URL = 'https://omr.example'
describe('batDauThi — chốt MỘT lệnh `/ca/chot-bat-dau`; máy chủ cũ ⇒ đường cũ', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('../src/lib/may-chu-moi', async (goc) => ({
      ...((await goc()) as Record<string, unknown>),
      layCauHinhMayChu: async () => ({ BAT: true, URL: 'https://omr.example', HAN_GIAY: 10, HAN_NONG_GIAY: 3, SO_LAN_THU: 3, LUI_VE_APPS_SCRIPT: false, GIAN_VAO_THI_GIAY: 0 }),
      xongNapDiaChi: async () => {},
    }))
  })
  afterEach(() => {
    vi.doUnmock('../src/lib/may-chu-moi')
  })
  const mang = (tra: (url: string, than: Record<string, unknown>) => { status?: number; body: unknown }) => {
    const goi: { url: string; than: Record<string, unknown> }[] = []
    vi.stubGlobal('fetch', async (u: string, init?: RequestInit) => {
      // Tệp cấu hình công khai (bộ tìm địa chỉ máy chủ) — không phải lệnh, không đếm.
      if (String(u).includes('cau-hinh')) return new Response('{}', { status: 404 })
      const than = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {}
      goi.push({ url: String(u), than })
      const r = tra(String(u), than)
      return new Response(JSON.stringify(r.body), { status: r.status ?? 200 })
    })
    return goi
  }

  it('máy chủ mới: MỘT lượt gọi mang cả bản đồ (kèm bậc lấp) — không có lệnh `batDauThi` rồi `/ca/day` tách rời', async () => {
    const goi = mang(() => ({ body: { ok: true, chot: true, batDauLuc: '2026-10-02T03:00:00.000Z', daBatTruoc: false, canBoTheoEm: true, coBoTheoEm: true } }))
    const { batDauThi } = await import('../src/lib/exam-api')
    const kq = await batDauThi(URL, 'MAT', 'C1', { S1: ['q1'] }, { S1: ['q1'] }, {}, { lucRut: 'x' }, false, undefined, { S1: { q1: 'muc_dich' } })
    expect(kq).toEqual({ batDauLuc: '2026-10-02T03:00:00.000Z', daBatTruoc: false, thieuBoTheoEm: false, chuaSangMayChuMoi: false })
    expect(goi).toHaveLength(1)
    expect(goi[0]!.url).toBe('https://omr.example/ca/chot-bat-dau')
    expect(goi[0]!.than).toMatchObject({ maCa: 'C1', dongBoGio: false, boTheoEm: { bo: { S1: ['q1'] }, lap: { S1: ['q1'] }, bac: { S1: { q1: 'muc_dich' } } } })
  })

  it('máy chủ trả "đã bắt đầu" ⇒ báo đã bắt đầu từ trước, KHÔNG đẩy lại bản đồ đè lên', async () => {
    const goi = mang(() => ({ body: { ok: false, chot: true, lyDo: 'da_bat_dau', batDauLuc: '2026-10-02T02:00:00.000Z', canBoTheoEm: true, coBoTheoEm: true } }))
    const { batDauThi } = await import('../src/lib/exam-api')
    const kq = await batDauThi(URL, 'MAT', 'C1', { S1: ['q1'] })
    expect(kq.daBatTruoc).toBe(true)
    expect(goi.map((g) => g.url)).toEqual(['https://omr.example/ca/chot-bat-dau'])
  })

  it('máy chủ đời cũ (404) ⇒ dự phòng: đi tiếp lệnh `batDauThi` như trước', async () => {
    const goi = mang((u) => (u.endsWith('/ca/chot-bat-dau') ? { status: 404, body: { ok: false, error: 'Không có đường này' } } : { body: { ok: true, batDauLuc: '2026-10-02T03:00:00.000Z' } }))
    const { batDauThi } = await import('../src/lib/exam-api')
    const kq = await batDauThi(URL, 'MAT', 'C1', { S1: ['q1'] })
    expect(kq.daBatTruoc).toBe(false)
    expect(goi.map((g) => g.url.replace('https://omr.example', '')).slice(0, 2)).toEqual(['/ca/chot-bat-dau', '/goi'])
    expect(goi[1]!.than.action).toBe('batDauThi')
  })

  it('máy chủ từ chối có lý do (ca đã đóng) ⇒ NÉM LỖI, không đi tiếp đường cũ', async () => {
    const goi = mang(() => ({ body: { ok: false, chot: true, error: 'Ca đã đóng hoặc đã xoá' } }))
    const { batDauThi } = await import('../src/lib/exam-api')
    await expect(batDauThi(URL, 'MAT', 'C1')).rejects.toThrow(/đã đóng/)
    expect(goi).toHaveLength(1)
  })

  it('máy em: máy chủ trả `cho_bo_cau` ⇒ tự thử lại sau ~1 giây rồi vào đúng bộ của mình', async () => {
    let lan = 0
    mang((u) => {
      if (!u.endsWith('/vao-thi')) return { body: { ok: false } }
      lan++
      return lan === 1
        ? { body: { ok: false, lyDo: 'cho_bo_cau', thuLaiSauMs: 1000 } }
        : { body: { ok: true, cach: 'moi', khoaLuot: 'C1|S1|1', lanThu: 1, vaoLuc: 'a', hetGioLuc: 'b', thoiGianPhut: 45, congBo: 'khong', loai: 'thi', tenCa: 'Ca', lop: '12', deUrl: null, boTheoEm: { bo: { S1: ['q1'] }, lap: {}, dem: {}, bb: null } } }
    })
    const { vaoThi } = await import('../src/lib/exam-api')
    const kq = await vaoThi(URL, 'C1', 'S1', 'tb', false)
    expect(lan).toBe(2)
    expect(kq.ok).toBe(true)
  }, 10_000)
})

// =====================================================================================================
describe('chạy thử lúc mở ca → chốt lúc Bắt đầu', () => {
  const BANK = [{ maDe: 'D', phanI: Array.from({ length: 30 }, (_, i) => mcq(`D-I-${i}`)), phanII: [], phanIII: [] }]
  const NGAY = '2026-10-02'
  beforeEach(() => {
    loiDenHanTheoEm.mockReset()
    noiKhoCa.mockClear()
    saveSessionTeacherBank.mockClear()
    loadSessionTeacherBank.mockResolvedValue(BANK)
    docSoCauCa.mockResolvedValue({ I: 4, II: 0, III: 0 })
    loiDenHanTheoEm.mockImplementation(async (_u: string, _m: string, dsSbd: string[]) => {
      const em: Record<string, unknown[]> = {}
      for (const s of dsSbd) {
        em[s] = s === 'A'
          ? [{ qid: 'D-I-3', denHan: '2026-10-01', trangThai: 'mo', nenSongSinh: true, songSinh: 0, phan: 'I', mucDo: 'hieu', dang: 'CD:Ester', cauSongSinh: { id: 'D-I-3~ss0', phan: 'I', text: 'Song sinh: tính m', choices: ['1', '2', '3', '4'], correct: 'C', table: [['Chất', 'Khối lượng'], ['A', '2']] } }]
          : s === 'C'
            ? [{ qid: 'D-I-7', denHan: '2026-10-02', trangThai: 'mo', phan: 'I', mucDo: 'hieu' }]
            : []
      }
      return { em, daGap: Object.fromEntries(dsSbd.map((s) => [s, { 'D-I-3': '2026-09-30', 'D-I-7': '2026-09-30' }])), hong: [] }
    })
  })

  it('chạy thử cả lớp; Bắt đầu dùng LẠI bộ đã chạy thử, chỉ rút thêm cho em vào sau; câu song sinh được nối vào kho ca (bản em không có đáp án)', async () => {
    const rt = await chayThuRutDeCa('', 'MAT', 'CA9', ['B', 'A'], { cheDo: 'ca', ngay: NGAY })
    expect(loiDenHanTheoEm).toHaveBeenCalledTimes(1)
    expect(loiDenHanTheoEm.mock.calls[0]![2]).toEqual(['A', 'B'])
    expect(noiKhoCa).not.toHaveBeenCalled() // chạy thử không ghi gì lên máy chủ
    expect(rt.kq.theoEm.A!.find((x) => x.qid === 'D-I-3~ss0')?.bac).toBe('song_sinh')
    const boA = rt.kq.theoEm.A!.map((x) => x.qid)
    expect(docRutThu('CA9')).toBe(rt)

    const chot = await chotRutDeCa('', 'MAT', 'CA9', ['A', 'B', 'C'], { cheDo: 'ca', ngay: NGAY, phamVi: 'gan_nhat' })
    expect(loiDenHanTheoEm).toHaveBeenCalledTimes(2)
    expect(loiDenHanTheoEm.mock.calls[1]![2]).toEqual(['C']) // chỉ em vào sau
    expect(chot.soEmRutThem).toBe(1)
    expect(chot.boTheoEm.A).toEqual(boA)
    expect(chot.boTheoEm.C).toContain('D-I-7')
    expect(chot.bacTheoEm.C!['D-I-7']).toBe('muc_dich')
    expect(chot.lapTheoEm.A).toEqual(['D-I-3~ss0'])
    expect(noiKhoCa).toHaveBeenCalledTimes(1)
    const [, , , bankEm, keyBank] = noiKhoCa.mock.calls[0] as unknown as [string, string, string, { phanI: Record<string, unknown>[] }, { phanI: Record<string, unknown>[] }]
    expect(bankEm.phanI.map((q) => q.id)).toEqual(['D-I-3~ss0'])
    expect(bankEm.phanI[0]!.correct).toBeUndefined() // đáp án không xuống máy em
    expect(keyBank.phanI[0]).toMatchObject({ id: 'D-I-3~ss0', correct: 'C' })
    expect(keyBank.phanI[0].table).toEqual([['Chất', 'Khối lượng'], ['A', '2']])
    expect(bankEm.phanI[0].table).toEqual([['Chất', 'Khối lượng'], ['A', '2']])
    expect(chot.soCauNoiThem).toBe(1)
    expect((chot.bienBan as { v2?: unknown }).v2).toBeTruthy()
    for (const b of Object.values(chot.boTheoEm)) expect(b).toHaveLength(4)
  })

  it('nối kho hỏng ⇒ rút lại chỉ từ kho ca (không phát câu máy em không có) và nói ra', async () => {
    await chayThuRutDeCa('', 'MAT', 'CA8', ['A'], { cheDo: 'ca', ngay: NGAY })
    noiKhoCa.mockRejectedValueOnce(new Error('mất mạng'))
    const chot = await chotRutDeCa('', 'MAT', 'CA8', ['A'], { cheDo: 'ca', ngay: NGAY })
    expect(chot.boTheoEm.A!.some((q) => q.includes('~ss'))).toBe(false)
    expect(chot.boTheoEm.A).toHaveLength(4)
    expect(chot.canhBao.join(' ')).toMatch(/Không nối được 1 câu ngoài kho/)
  })
})

// =====================================================================================================
describe('màn Theo dõi ca — bảng Xem trước phân bổ và nút Bắt đầu dùng kết quả chạy thử', () => {
  it('bảng nói em nào thiếu ô nào, lấp bằng gì; số theo bậc có nhãn', async () => {
    loadSessionTeacherBank.mockResolvedValue([{ maDe: 'D', phanI: Array.from({ length: 5 }, (_, i) => mcq(`D-I-${i}`)), phanII: [], phanIII: [] }])
    docSoCauCa.mockResolvedValue({ I: 4, II: 0, III: 0 })
    loiDenHanTheoEm.mockResolvedValue({ em: { A: [], B: [] }, daGap: { A: {}, B: { 'D-I-0': '2026-09-30', 'D-I-1': '2026-09-30' } }, hong: [] })
    const rt = await chayThuRutDeCa('', 'MAT', 'CA7', ['A', 'B'], { cheDo: 'ca', ngay: '2026-10-02' })
    const { BangRutThuV2 } = await import('../src/screens/ExamMonitorScreen')
    render(<BangRutThuV2 rt={rt} dang={false} loi="" tenCua={{ B: 'Bình' }} onChayLai={() => {}} />)
    expect(screen.getByText('Xem trước phân bổ')).toBeTruthy()
    expect(screen.getByText(/Chạy thử — chưa phát cho em/)).toBeTruthy()
    expect(screen.getByText('Bình')).toBeTruthy() // em B phải dùng lại câu đã gặp (kho 5 câu, đã gặp 2)
    expect(screen.getAllByText('Câu đã gặp (kho thiếu)').length).toBeGreaterThan(0)
    expect(screen.getByText(/Câu mới:/)).toBeTruthy()
  })

  it('nút Bắt đầu: rút đề v2 trước (dùng lại chạy thử), đường cũ chỉ là dự phòng; bậc lấp đi cùng lệnh chốt', async () => {
    const ma = (await import('../src/screens/ExamMonitorScreen.tsx?raw')).default
    const than = ma.slice(ma.indexOf('const batDauCaNay = async'), ma.indexOf('const huyCaCho = async'))
    expect(than.indexOf('chotRutDeCa(')).toBeGreaterThan(0)
    expect(than.indexOf('chotRutDeCa(')).toBeLessThan(than.indexOf('dungDeRiengChoCa('))
    expect(than).toContain('if (!boTheoEm) {')
    expect(than).toContain('daLamLaiTheoEm, bacTheoEm)')
    expect(ma).toContain('chayThuRutDeCa(scriptUrl.trim(), secret.trim(), maCaNay, [...ds], { cheDo: cheDoRutV2 })')
    expect(ma).toContain("const cheDoRutV2: 'ca' | 'diem_yeu' = chiTiet?.ca.lenBang === true ? 'diem_yeu' : 'ca'")
  })
})

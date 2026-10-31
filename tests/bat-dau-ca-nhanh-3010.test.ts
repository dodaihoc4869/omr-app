// @vitest-environment node
// TỐC ĐỘ «BẮT ĐẦU» CA RÚT CÂU SAI (thầy 30/10 tối: «ca kiểm tra rút câu sai bấm bắt đầu rất lâu, tối ưu lại toàn bộ tốc độ rút câu phân đề»).
//
// ĐO THẬT (ca 269333, workflow chỉ-đọc do-cham-bai-3010.yml): biên bản rút ghi «Không nối được 344 câu ngoài kho … Máy chủ không trả lời sau 25 giây»
// ⇒ nút Bắt đầu chờ ≥ 25 giây rồi đề «rút câu sai» mất HẾT câu sai cũ (bậc lấp cả lớp: 44 câu mục đích / 896 ô). Ba chỗ sửa:
//   1. máy chủ `noiKhoCa`: một vòng D1 (`json_each`) + hai đối tượng R2 song song (bản cũ: 4 lô nối tiếp + R2 nối tiếp);
//   2. máy thầy NỐI SỚM ngay sau chạy thử (ca còn phòng chờ) ⇒ lúc Bắt đầu chỉ nối phần chênh; nối hỏng vẫn giữ câu đã nối sẵn;
//   3. lúc Bắt đầu chỉ ĐỌC LẠI hồ sơ em có lượt mới (bản cũ đọc lại cả lớp) — xem tests/ke-ho-ca-kiem-tra-0610.test.ts;
//   + `noiKhoCa` máy thầy: hạn 60 giây + thử lại 1 lần (gửi lại an toàn).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loiDenHanTheoEm = vi.fn()
const coLuotMoiTheoEm = vi.fn()
const noiKhoCaMock = vi.fn(async () => ({ themBank: 1, themKey: 1 }))
let bankMay: unknown[] = []
const loadSessionTeacherBank = vi.fn(async () => bankMay)
const saveSessionTeacherBank = vi.fn(async (_m: string, b: unknown[]) => { bankMay = b })
const docSoCauCa = vi.fn()

// 31/10: `noiKhoCa` dời từ exam-api sang ca-em-thay-api (học sinh khỏi tải mã của thầy) ⇒ giả cùng chỗ với hai lệnh máy thầy kia.
vi.mock('../src/lib/ca-em-thay-api', () => ({
  loiDenHanTheoEm: (...a: unknown[]) => loiDenHanTheoEm(...a),
  coLuotMoiTheoEm: (...a: unknown[]) => coLuotMoiTheoEm(...a),
  noiKhoCa: (...a: unknown[]) => noiKhoCaMock(...(a as [])),
}))
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  loadSessionTeacherBank: (...a: unknown[]) => loadSessionTeacherBank(...(a as [])),
  saveSessionTeacherBank: (...a: unknown[]) => saveSessionTeacherBank(...(a as [string, unknown[]])),
  docSoCauCa: (...a: unknown[]) => docSoCauCa(...a),
  loadExamSources: vi.fn(async () => []),
}))

const { chayThuRutDeCa, chotRutDeCa, noiSomCauNgoai, docDaNoi } = await import('../src/lib/de-rieng-v2')
const { noiKhoCa } = await import('../server/src/goi-cu')
const { taoD1That } = await import('./_d1-that')

const mcq = (id: string) => ({ id, text: `Đốt cháy hoàn toàn ${id} mol ester tính khối lượng m gam`, choices: ['1,2', '2,4', '3,6', '4,8'] as [string, string, string, string], correct: 'A' as const, chuyenDe: 'Ester', mucDo: 'hieu' })
const NGAY = '2026-10-30'
const BANK = [{ maDe: 'D', phanI: Array.from({ length: 30 }, (_, i) => mcq(`D-I-${i}`)), phanII: [], phanIII: [] }]

describe('máy thầy — nối sớm sau chạy thử, lúc Bắt đầu chỉ nối phần chênh', () => {
  beforeEach(() => {
    loiDenHanTheoEm.mockReset()
    coLuotMoiTheoEm.mockReset()
    noiKhoCaMock.mockReset()
    noiKhoCaMock.mockResolvedValue({ themBank: 1, themKey: 1 })
    saveSessionTeacherBank.mockClear()
    bankMay = JSON.parse(JSON.stringify(BANK))
    docSoCauCa.mockResolvedValue({ I: 4, II: 0, III: 0 })
    // Em A có một lỗi đến hạn nên được câu song sinh (câu NGOÀI kho ca, phải nối vào kho ca mới phát được).
    loiDenHanTheoEm.mockImplementation(async (_u: string, _m: string, ds: string[]) => ({
      em: Object.fromEntries(ds.map((s) => [s, s === 'A'
        ? [{ qid: 'D-I-3', denHan: '2026-10-29', trangThai: 'mo', nenSongSinh: true, songSinh: 0, phan: 'I', mucDo: 'hieu', dang: 'CD:Ester', cauSongSinh: { id: 'D-I-3~ss0', phan: 'I', text: 'Song sinh', choices: ['1', '2', '3', '4'], correct: 'C' } }]
        : []])),
      daGap: Object.fromEntries(ds.map((s) => [s, { 'D-I-3': '2026-10-20' }])),
      hong: [],
    }))
  })

  it('chạy thử KHÔNG ghi; nối sớm nối đúng câu song sinh; Bắt đầu KHÔNG nối lại, đề A vẫn có câu song sinh', async () => {
    const rt = await chayThuRutDeCa('', 'MAT', 'CN1', ['A', 'B'], { cheDo: 'ca', ngay: NGAY })
    expect(noiKhoCaMock).not.toHaveBeenCalled()
    expect(rt.kq.theoEm.A!.map((x) => x.qid)).toContain('D-I-3~ss0')
    expect(await noiSomCauNgoai('', 'MAT', 'CN1')).toBe(1)
    expect(noiKhoCaMock).toHaveBeenCalledTimes(1)
    expect(docDaNoi('CN1').has('D-I-3~ss0')).toBe(true)
    // Bản đề CÓ đáp án của máy thầy có câu song sinh đúng MỘT lần (chấm được ngay ở màn Theo dõi).
    const ids = (bankMay as typeof BANK).flatMap((b) => b.phanI.map((q) => q.id))
    expect(ids.filter((x) => x === 'D-I-3~ss0')).toHaveLength(1)
    coLuotMoiTheoEm.mockResolvedValue({ em: [] })
    const chot = await chotRutDeCa('', 'MAT', 'CN1', ['A', 'B'], { cheDo: 'ca', ngay: NGAY, phamVi: 'gan_nhat' })
    expect(noiKhoCaMock).toHaveBeenCalledTimes(1) // không gửi lại câu đã nối sẵn
    expect(chot.boTheoEm.A).toContain('D-I-3~ss0')
    expect(chot.soCauNoiThem).toBe(1)
    expect(chot.canhBao.join(' ')).toBe('')
    // Nối sớm lần hai: không còn gì để nối.
    expect(await noiSomCauNgoai('', 'MAT', 'CN1')).toBe(0)
  })

  it('CHUẨN BỊ NGẦM (31/10): chốt chạy sẵn khi em vào phòng chờ ⇒ lúc bấm (trong 45 giây) KHÔNG hỏi lại bài mới làm, KHÔNG nối lại; quá 45 giây / không xin bỏ qua ⇒ hỏi như cũ', async () => {
    await chayThuRutDeCa('', 'MAT', 'CN2', ['A', 'B'], { cheDo: 'ca', ngay: NGAY })
    coLuotMoiTheoEm.mockResolvedValue({ em: [] })
    await chotRutDeCa('', 'MAT', 'CN2', ['A', 'B'], { cheDo: 'ca', ngay: NGAY, phamVi: 'gan_nhat' }) // lượt chuẩn bị ngầm
    expect(coLuotMoiTheoEm).toHaveBeenCalledTimes(1)
    expect(noiKhoCaMock).toHaveBeenCalledTimes(1)
    const bam = await chotRutDeCa('', 'MAT', 'CN2', ['A', 'B'], { cheDo: 'ca', ngay: NGAY, phamVi: 'gan_nhat', boQuaKiemMoiMs: 45_000 }) // thầy bấm
    expect(coLuotMoiTheoEm).toHaveBeenCalledTimes(1) // không hỏi lại
    expect(noiKhoCaMock).toHaveBeenCalledTimes(1) // không nối lại
    expect(bam.boTheoEm.A).toContain('D-I-3~ss0')
    await chotRutDeCa('', 'MAT', 'CN2', ['A', 'B'], { cheDo: 'ca', ngay: NGAY, phamVi: 'gan_nhat' }) // không xin bỏ qua ⇒ hỏi như cũ
    expect(coLuotMoiTheoEm).toHaveBeenCalledTimes(2)
  })

  it('đã nối sớm mà lượt nối phần chênh lúc Bắt đầu hỏng ⇒ VẪN giữ câu đã nối sẵn (bản cũ bỏ hết câu ngoài kho)', async () => {
    await chayThuRutDeCa('', 'MAT', 'CN2', ['A'], { cheDo: 'ca', ngay: NGAY })
    await noiSomCauNgoai('', 'MAT', 'CN2')
    // Em C vào phòng sau, có lỗi ⇒ câu song sinh mới (phần chênh); lần nối này hỏng.
    loiDenHanTheoEm.mockImplementation(async (_u: string, _m: string, ds: string[]) => ({
      em: Object.fromEntries(ds.map((s) => [s, s === 'C'
        ? [{ qid: 'D-I-7', denHan: '2026-10-29', trangThai: 'mo', nenSongSinh: true, songSinh: 1, phan: 'I', mucDo: 'hieu', cauSongSinh: { id: 'D-I-7~ss1', phan: 'I', text: 'Song sinh 7', choices: ['1', '2', '3', '4'], correct: 'B' } }]
        : []])),
      daGap: {},
      hong: [],
    }))
    coLuotMoiTheoEm.mockResolvedValue({ em: [] })
    noiKhoCaMock.mockRejectedValueOnce(new Error('Máy chủ không trả lời sau 60 giây'))
    const chot = await chotRutDeCa('', 'MAT', 'CN2', ['A', 'C'], { cheDo: 'ca', ngay: NGAY })
    expect(chot.boTheoEm.A).toContain('D-I-3~ss0') // đã nằm trong kho ca từ lượt nối sớm
    expect(chot.boTheoEm.C!.some((q) => q === 'D-I-7~ss1')).toBe(false) // câu chưa nối được thì không phát
    expect(chot.boTheoEm.C).toHaveLength(4)
    expect(chot.canhBao.join(' ')).toMatch(/Không nối được 1 câu ngoài kho .* và câu đã nối sẵn/)
  })

  it('nối sớm hỏng ⇒ không chặn gì (trả 0); Bắt đầu nối như cũ', async () => {
    await chayThuRutDeCa('', 'MAT', 'CN3', ['A'], { cheDo: 'ca', ngay: NGAY })
    noiKhoCaMock.mockRejectedValueOnce(new Error('mất mạng'))
    expect(await noiSomCauNgoai('', 'MAT', 'CN3')).toBe(0)
    coLuotMoiTheoEm.mockResolvedValue({ em: [] })
    const chot = await chotRutDeCa('', 'MAT', 'CN3', ['A'], { cheDo: 'ca', ngay: NGAY })
    expect(noiKhoCaMock).toHaveBeenCalledTimes(2)
    expect(chot.boTheoEm.A).toContain('D-I-3~ss0')
  })
})

describe('máy chủ noiKhoCa — một vòng D1 + R2 song song, cùng dữ liệu như cũ', () => {
  const MA = 'NK1'
  const cau = (id: string) => ({ id, text: `Câu ${id}`, choices: ['a', 'b', 'c', 'd'] })
  const dung = () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cap_nhat_luc) VALUES(?, 'Ca', 'mo', '2026-10-30T00:00:00.000Z')").run(MA)
    d.objects.set(`de/${MA}.json`, JSON.stringify({ phanI: [cau('G-1')], phanII: [], phanIII: [] }))
    d.objects.set(`key/${MA}.json`, JSON.stringify({ phanI: [{ ...cau('G-1'), correct: 'A' }], phanII: [], phanIII: [] }))
    return d
  }
  const b = (n: number) => ({
    maCa: MA,
    bank: { phanI: [cau('G-1'), ...Array.from({ length: n }, (_, i) => cau(`T-${i}`))], phanII: [], phanIII: [] },
    keyBank: { phanI: [{ ...cau('G-1'), correct: 'A' }, ...Array.from({ length: n }, (_, i) => ({ ...cau(`T-${i}`), correct: 'B' }))], phanII: [], phanIII: [] },
  })

  it('344 câu ⇒ ghi `kho_ca_them` đủ, đúng đáp án trong MỘT lượt batch; R2 đề + tờ đáp án chỉ THÊM câu chưa có', async () => {
    const d = dung()
    const truoc = d.soLenh.batch
    const r = await noiKhoCa(d.env, b(344))
    expect(r).toMatchObject({ ok: true, themBank: 345 })
    expect(d.soLenh.batch - truoc).toBe(1)
    expect(d.dem('kho_ca_them', `ma_ca = '${MA}'`)).toBe(345)
    const x = d.sql.prepare('SELECT khoa, qid, dap_an, cau_json FROM kho_ca_them WHERE qid = ?').get('T-7') as Record<string, string>
    expect(x.khoa).toBe(`${MA}|T-7`)
    expect(x.dap_an).toBe('B')
    expect(JSON.parse(x.cau_json)).toEqual(cau('T-7'))
    const de = JSON.parse(String(d.objects.get(`de/${MA}.json`)))
    const key = JSON.parse(String(d.objects.get(`key/${MA}.json`)))
    expect(de.phanI).toHaveLength(345)
    expect(key.phanI).toHaveLength(345)
    expect(key.phanI.find((q: { id: string }) => q.id === 'T-7').correct).toBe('B')
    expect(de.phanI.filter((q: { id: string }) => q.id === 'G-1')).toHaveLength(1)
  })

  it('gửi lại (máy thầy thử lại sau khi quá hạn) KHÔNG nhân đôi dòng hay câu', async () => {
    const d = dung()
    await noiKhoCa(d.env, b(5))
    await noiKhoCa(d.env, b(5))
    expect(d.dem('kho_ca_them', `ma_ca = '${MA}'`)).toBe(6)
    expect(JSON.parse(String(d.objects.get(`de/${MA}.json`))).phanI).toHaveLength(6)
    expect(JSON.parse(String(d.objects.get(`key/${MA}.json`))).phanI).toHaveLength(6)
  })
})

describe('máy thầy noiKhoCa — hạn 60 giây, máy chủ bận thì thử lại một lần', () => {
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
    vi.doUnmock('../src/lib/exam-api')
    vi.unstubAllGlobals()
  })
  it('503 lần đầu ⇒ gửi lại đúng lệnh, lần hai thành công', async () => {
    vi.doUnmock('../src/lib/exam-api')
    vi.doUnmock('../src/lib/ca-em-thay-api')
    const goi: Record<string, unknown>[] = []
    vi.stubGlobal('fetch', async (u: string, init?: RequestInit) => {
      if (String(u).includes('cau-hinh')) return new Response('{}', { status: 404 })
      goi.push(JSON.parse(String(init?.body ?? '{}')))
      return goi.length === 1 ? new Response('{"ok":false}', { status: 503 }) : new Response(JSON.stringify({ ok: true, themBank: 2, themKey: 2 }), { status: 200 })
    })
    const api = await vi.importActual<typeof import('../src/lib/exam-api')>('../src/lib/exam-api')
    expect(api.HAN_NOI_KHO_CA_GIAY).toBe(60)
    // 31/10: `noiKhoCa` nay ở ca-em-thay-api (chỉ máy thầy) — mã giữ nguyên, vẫn đi `postCoThuLai` của exam-api.
    const thay = await vi.importActual<typeof import('../src/lib/ca-em-thay-api')>('../src/lib/ca-em-thay-api')
    const r = await thay.noiKhoCa('https://omr.example', 'MAT', 'C1', { phanI: [], phanII: [], phanIII: [] } as never, { phanI: [], phanII: [], phanIII: [] })
    expect(r).toEqual({ themBank: 2, themKey: 2 })
    expect(goi).toHaveLength(2)
    expect(goi.every((g) => g.action === 'noiKhoCa' && g.maCa === 'C1')).toBe(true)
  }, 10_000)
})

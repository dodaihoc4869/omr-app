// @vitest-environment node
// KẾ HOẠCH CA KIỂM TRA (06/10) — HAI VIỆC:
//   1. Bản chạy thử cũ không được làm câu em VỪA LÀM thành câu "mới": lúc Bắt đầu thi, có lượt tự làm mới của bất kỳ em nào
//      trong danh sách ca kể từ lúc chạy thử ⇒ rút lại cả lớp bằng hồ sơ mới (cùng seed `maCa`).
//   2. Ca "Không rút câu sai": MỘT quy tắc "câu đã gặp" cho cả hai đường (src/lib/khong-rut-cau-sai.ts).
import { beforeEach, describe, expect, it, vi } from 'vitest'

const loiDenHanTheoEm = vi.fn()
const coLuotMoiTheoEm = vi.fn()
const hoSoOnCaMock = vi.fn()
const noiKhoCa = vi.fn(async () => ({ themBank: 0, themKey: 0 }))
const loadSessionTeacherBank = vi.fn()
const saveSessionTeacherBank = vi.fn(async () => {})
const docSoCauCa = vi.fn()

vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  loiDenHanTheoEm: (...a: unknown[]) => loiDenHanTheoEm(...a),
  coLuotMoiTheoEm: (...a: unknown[]) => coLuotMoiTheoEm(...a),
  hoSoOnCa: (...a: unknown[]) => hoSoOnCaMock(...a),
  noiKhoCa: (...a: unknown[]) => noiKhoCa(...(a as [])),
}))
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  loadSessionTeacherBank: (...a: unknown[]) => loadSessionTeacherBank(...a),
  saveSessionTeacherBank: (...a: unknown[]) => saveSessionTeacherBank(...(a as [])),
  docSoCauCa: (...a: unknown[]) => docSoCauCa(...a),
  loadExamSources: vi.fn(async () => []),
}))

const { chayThuRutDeCa, chotRutDeCa, docRutThu } = await import('../src/lib/de-rieng-v2')
const { camKhongRutCauSai, lamGanDayTuDaGap, tapCamEmVaoMuon, SO_NGAY_CAM_MEM } = await import('../src/lib/khong-rut-cau-sai')
const { docHoSoOnCa } = await import('../src/lib/de-rieng-nguon')
const { rutDeV2 } = await import('../src/lib/rut-de-v2')
const { hoSoOnCa } = await import('../server/src/ho-so-on-ca')
const { coLuotMoi } = await import('../server/src/ca-co-luot-moi')
const { taoD1That, goiWorker } = await import('./_d1-that')
const { default: worker } = await import('../server/src/index')

const mcq = (id: string) => ({ id, text: `Đốt cháy hoàn toàn ${id} mol ester tính khối lượng m gam`, choices: ['1,2', '2,4', '3,6', '4,8'] as [string, string, string, string], correct: 'A' as const, chuyenDe: 'Ester', mucDo: 'hieu' })

// =====================================================================================================
describe('Việc 2 — một quy tắc "câu đã gặp" cho ca Không rút câu sai', () => {
  it('cấm mềm là 30 ngày (không còn 7)', () => {
    expect(SO_NGAY_CAM_MEM).toBe(30)
  })

  it('thứ tự tập cấm: câu ca trước đứng trước, câu làm gần đây ở kênh khác đứng sau; lọc theo kho và bộ sẵn', () => {
    const cam = camKhongRutCauSai(['A', 'B', 'X'].values(), ['C', 'A', 'D', 'E'], new Set(['A', 'B', 'C', 'D', 'E']), new Set(['D']))
    expect(cam).toEqual(['A', 'B', 'C', 'E']) // X ngoài kho, D đã có trong bộ sẵn, A không lặp lại ở nhóm mềm
  })

  it('lamGanDayTuDaGap: chỉ lấy câu trong 30 ngày, mới nhất trước, cùng ngày thì qid tăng dần', () => {
    const r = lamGanDayTuDaGap({ q9: '2026-10-05', q1: '2026-10-05', q2: '2026-09-10', q3: '2026-09-05', q4: '2026-08-01' }, '2026-10-06')
    expect(r).toEqual(['q1', 'q9', 'q2']) // 09-05 cách 31 ngày, 08-01 quá xa
  })

  it('em vào muộn = CÙNG hàm với đề chuẩn bị sẵn: ca trước cấm cứng + 30 ngày mọi kênh', () => {
    const trongPool = new Set(['A', 'B', 'C', 'D'])
    const caTruoc = ['A']
    const daGap = { B: '2026-09-20', C: '2026-06-01', A: '2026-09-30' } // C cách quá 30 ngày ⇒ KHÔNG cấm
    const vaoMuon = tapCamEmVaoMuon({ caTruoc, daGap, ngay: '2026-10-06', trongPool })
    const chuanBi = camKhongRutCauSai(caTruoc, lamGanDayTuDaGap(daGap, '2026-10-06'), trongPool, new Set())
    expect(vaoMuon).toEqual(chuanBi)
    expect(vaoMuon).toEqual(['A', 'B'])
  })

  it('de-rieng.ts không còn bản riêng của luật: dùng hàm chung', async () => {
    const ma = (await import('../src/lib/de-rieng.ts?raw')).default
    expect(ma).toContain("from './khong-rut-cau-sai'")
    expect(ma).not.toMatch(/function camKhongRutCauSai/)
  })

  it('máy thầy xin hồ sơ ôn 30 ngày CHỈ ở ca Không rút câu sai', async () => {
    hoSoOnCaMock.mockReset()
    hoSoOnCaMock.mockResolvedValue({ S1: { tuCa: '', sai: [], daKhacPhuc: [], lam: [] } })
    await docHoSoOnCa('', 'MAT', ['S1'], 'CA', '2026-10-06', 1, SO_NGAY_CAM_MEM)
    expect(hoSoOnCaMock.mock.calls[0]![6]).toBe(30)
    hoSoOnCaMock.mockClear()
    await docHoSoOnCa('', 'MAT', ['S1'], 'CA', '2026-10-06', 1)
    expect(hoSoOnCaMock.mock.calls[0]![6]).toBeUndefined() // các chế độ khác: giữ 7 ngày
    const ma = (await import('../src/lib/de-rieng-nguon.ts?raw')).default
    expect(ma).toContain("const soNgayLamHoSo = ch.PHAM_VI_HOI_LAI === 'khong' ? SO_NGAY_CAM_MEM : undefined")
    expect(ma.match(/soCaHoSo, soNgayLamHoSo\)/g)).toHaveLength(2) // em có mặt + em vắng
  })

  it('máy chủ hoSoOnCa: soNgayLam=30 thấy câu làm 20 ngày trước; mặc định vẫn 7 ngày; trần soNgayLam là 30', async () => {
    const d = taoD1That()
    const ins = (qid: string, ngay: string) =>
      d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES(?,?,?,?,?,1,1,?,?)").run(`k|${qid}`, 'S1', qid, 'game', 'M', `${ngay}T05:00:00.000Z`, ngay)
    ins('Q-CU', '2026-09-16') // 20 ngày trước 06/10
    ins('Q-MOI', '2026-10-04')
    ins('Q-QUA-XA', '2026-08-20') // 47 ngày
    const mac = (await hoSoOnCa(d.env, { dsSbd: ['S1'], maCa: 'C', ngayCa: '2026-10-06' })) as { em: Record<string, { lam: string[] }> }
    expect(mac.em.S1!.lam).toEqual(['Q-MOI'])
    const ba = (await hoSoOnCa(d.env, { dsSbd: ['S1'], maCa: 'C', ngayCa: '2026-10-06', soNgayLam: 30 })) as { em: Record<string, { lam: string[] }> }
    expect(ba.em.S1!.lam).toEqual(['Q-MOI', 'Q-CU'])
    const vuot = (await hoSoOnCa(d.env, { dsSbd: ['S1'], maCa: 'C', ngayCa: '2026-10-06', soNgayLam: 400 })) as { em: Record<string, { lam: string[] }> }
    expect(vuot.em.S1!.lam).toEqual(['Q-MOI', 'Q-CU']) // bị chặn ở 30
  })
})

// =====================================================================================================
describe('Việc 1 — máy chủ `/ca/co-luot-moi`: em nào có lượt tự làm MỚI kể từ mốc chạy thử', () => {
  const MOC = '2026-10-06T03:00:00.000Z'
  function dung() {
    const d = taoD1That()
    const ins = (sbd: string, qid: string, luc: string, o: { as?: string | null; pu?: string | null; nguon?: string } = {}) =>
      d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,purpose) VALUES(?,?,?,?,?,1,0,?,?,?,?)")
        .run(`k|${sbd}|${qid}|${luc}`, sbd, qid, o.nguon ?? 'game', 'M', luc, luc.slice(0, 10), o.as ?? null, o.pu ?? null)
    ins('S1', 'Q1', '2026-10-06T04:00:00.000Z') // tự làm, SAU mốc ⇒ tính
    ins('S2', 'Q2', '2026-10-06T04:00:00.000Z', { as: 'assisted' }) // có hỗ trợ ⇒ không tính
    ins('S3', 'Q3', '2026-10-06T02:00:00.000Z') // TRƯỚC mốc ⇒ không tính
    ins('S4', 'Q4', '2026-10-06T04:00:00.000Z', { pu: 'xem_loi_giai' }) // chỉ đọc lời giải ⇒ không tính
    ins('S5', 'Q5', '2026-10-06T04:00:00.000Z', { pu: 'luot' }) // lướt ⇒ không tính
    ins('S6', 'nen:Q6', '2026-10-06T04:00:00.000Z') // câu nền ⇒ không tính
    ins('S7', 'Q7', '2026-10-06T05:00:00.000Z', { nguon: 'len_bang' }) // kênh khác ⇒ tính
    return d
  }

  it('chỉ đếm lượt tự làm sau mốc; trả danh sách em (không phải số đoán)', async () => {
    const d = dung()
    const r = (await coLuotMoi(d.env, { sbd: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'], tu: MOC })) as { ok: boolean; em: string[] }
    expect(r.ok).toBe(true)
    expect(r.em).toEqual(['S1', 'S7'])
  })

  it('đi qua route /ca/co-luot-moi (cần mã bí mật); thiếu/ sai mốc ⇒ ok:false, không đoán', async () => {
    const d = dung()
    const r = await goiWorker(worker, d.env, '/ca/co-luot-moi', { sbd: ['S1', 'S3'], tu: MOC }, true)
    expect(r).toMatchObject({ ok: true, em: ['S1'] })
    const hong = await goiWorker(worker, d.env, '/ca/co-luot-moi', { sbd: ['S1'], tu: 'không-phải-ngày' }, true)
    expect(hong.ok).toBe(false)
    const khongMa = await goiWorker(worker, d.env, '/ca/co-luot-moi', { sbd: ['S1'], tu: MOC }, false)
    expect(khongMa.em).toBeUndefined()
  })

  it('không có em ⇒ rỗng; quá nhiều em một lượt ⇒ từ chối rõ', async () => {
    const d = dung()
    expect(await coLuotMoi(d.env, { sbd: [], tu: MOC })).toMatchObject({ ok: true, em: [] })
    const nhieu = Array.from({ length: 201 }, (_, i) => `E${i}`)
    expect((await coLuotMoi(d.env, { sbd: nhieu, tu: MOC })).ok).toBe(false)
  })

  it('sổ cũ chưa có cột assistance/purpose ⇒ vẫn trả lời bằng luật lọc cũ (không ném lỗi)', async () => {
    const d = dung()
    // D1 trước CNH-1 cũng chưa có trigger giao chữa 0710 phụ thuộc các cột này.
    d.sql.exec('DROP TRIGGER IF EXISTS chua_giao_sai_sau_ghi; DROP TRIGGER IF EXISTS chua_giao_sai_sau_cong_bo')
    d.sql.exec('ALTER TABLE su_kien_hoc DROP COLUMN assistance')
    const r = (await coLuotMoi(d.env, { sbd: ['S1', 'S3'], tu: MOC })) as { ok: boolean; em: string[] }
    expect(r.ok).toBe(true)
    expect(r.em).toEqual(['S1'])
  })
})

// =====================================================================================================
describe('Việc 1 — chốt lúc Bắt đầu thi rút lại khi có lượt mới sau chạy thử', () => {
  const BANK = [{ maDe: 'D', phanI: Array.from({ length: 12 }, (_, i) => mcq(`D-I-${i}`)), phanII: [], phanIII: [] }]
  const NGAY = '2026-10-06'
  /** Hồ sơ "đang có": em có câu đã gặp nào. Đổi biến này giữa chạy thử và chốt để mô phỏng em vừa làm bài. */
  let daGapHienTai: Record<string, Record<string, string>> = {}

  beforeEach(() => {
    loiDenHanTheoEm.mockReset()
    coLuotMoiTheoEm.mockReset()
    noiKhoCa.mockClear()
    loadSessionTeacherBank.mockResolvedValue(BANK)
    docSoCauCa.mockResolvedValue({ I: 4, II: 0, III: 0 })
    daGapHienTai = {}
    loiDenHanTheoEm.mockImplementation(async (_u: string, _m: string, dsSbd: string[]) => ({
      em: Object.fromEntries(dsSbd.map((s) => [s, []])),
      daGap: Object.fromEntries(dsSbd.map((s) => [s, { ...(daGapHienTai[s] ?? {}) }])),
      hong: [],
    }))
  })
  const boCua = (kq: { theoEm: Record<string, { qid: string }[]> }, s: string) => kq.theoEm[s]!.map((x) => x.qid)

  it('hai lần rút với dữ liệu giống nhau cho cùng kết quả (seed = maCa)', async () => {
    const a = await chayThuRutDeCa('', 'MAT', 'CA-TT', ['A', 'B'], { cheDo: 'ca', ngay: NGAY })
    const b = await chayThuRutDeCa('', 'MAT', 'CA-TT', ['A', 'B'], { cheDo: 'ca', ngay: NGAY })
    expect(boCua(b.kq, 'A')).toEqual(boCua(a.kq, 'A'))
    expect(boCua(b.kq, 'B')).toEqual(boCua(a.kq, 'B'))
  })

  it('KHÔNG có lượt mới ⇒ dùng lại bản chạy thử, không rút lại (soEmCapNhat = 0)', async () => {
    const rt = await chayThuRutDeCa('', 'MAT', 'CA-K', ['A', 'B'], { cheDo: 'ca', ngay: NGAY })
    coLuotMoiTheoEm.mockResolvedValue({ em: [] })
    const chot = await chotRutDeCa('', 'MAT', 'CA-K', ['A', 'B'], { cheDo: 'ca', ngay: NGAY, phamVi: 'gan_nhat' })
    expect(coLuotMoiTheoEm).toHaveBeenCalledTimes(1)
    expect(coLuotMoiTheoEm.mock.calls[0]![2]).toEqual(['A', 'B'])
    expect(coLuotMoiTheoEm.mock.calls[0]![3]).toBe(rt.mocDoc) // mốc = lúc TRƯỚC khi đọc hồ sơ chạy thử
    expect(loiDenHanTheoEm).toHaveBeenCalledTimes(1)
    expect(chot.soEmCapNhat).toBe(0)
    expect(chot.boTheoEm.A).toEqual(boCua(rt.kq, 'A'))
  })

  it('có lượt mới của MỘT em ⇒ rút lại CẢ LỚP bằng hồ sơ mới; câu em vừa làm không còn là câu "mới"; báo số em', async () => {
    const rt = await chayThuRutDeCa('', 'MAT', 'CA-M', ['A', 'B', 'C'], { cheDo: 'ca', ngay: NGAY })
    const boA = boCua(rt.kq, 'A')
    const vuaLam = boA[0]!
    daGapHienTai = { A: { [vuaLam]: NGAY } } // sau lúc chạy thử, A làm câu `vuaLam`
    coLuotMoiTheoEm.mockResolvedValue({ em: ['A'] })
    const chot = await chotRutDeCa('', 'MAT', 'CA-M', ['A', 'B', 'C'], { cheDo: 'ca', ngay: NGAY, phamVi: 'gan_nhat' })
    expect(loiDenHanTheoEm).toHaveBeenCalledTimes(2)
    expect(loiDenHanTheoEm.mock.calls[1]![2]).toEqual(['A', 'B', 'C']) // rút lại toàn bộ, không chỉ A
    expect(chot.soEmCapNhat).toBe(1)
    expect(chot.boTheoEm.A).not.toContain(vuaLam) // kho 12 câu, đủ câu mới ⇒ em không nhận lại câu vừa làm
    expect(chot.boTheoEm.A).toHaveLength(4)
    expect(docRutThu('CA-M')!.hoSo.A!.daGap[vuaLam]).toBe(NGAY) // bản đồ lưu đã cập nhật
    expect(chot.canhBao.join(' ')).toBe('')
  })

  it('em vào phòng chờ sau chạy thử cũng được xét lượt mới (danh sách = lớp ∪ phòng chờ)', async () => {
    await chayThuRutDeCa('', 'MAT', 'CA-V', ['A'], { cheDo: 'ca', ngay: NGAY })
    coLuotMoiTheoEm.mockResolvedValue({ em: [] })
    await chotRutDeCa('', 'MAT', 'CA-V', ['A', 'C'], { cheDo: 'ca', ngay: NGAY, phamVi: 'gan_nhat' })
    expect([...coLuotMoiTheoEm.mock.calls[0]![2] as string[]].sort()).toEqual(['A', 'C'])
  })

  it('lệnh đọc lượt mới lỗi ⇒ GIỮ bản cũ + cảnh báo, không chặn Bắt đầu', async () => {
    const rt = await chayThuRutDeCa('', 'MAT', 'CA-L', ['A', 'B'], { cheDo: 'ca', ngay: NGAY })
    coLuotMoiTheoEm.mockRejectedValue(new Error('mất mạng'))
    const chot = await chotRutDeCa('', 'MAT', 'CA-L', ['A', 'B'], { cheDo: 'ca', ngay: NGAY, phamVi: 'gan_nhat' })
    expect(chot.boTheoEm.A).toEqual(boCua(rt.kq, 'A'))
    expect(chot.soEmCapNhat).toBe(0)
    expect(chot.canhBao.join(' ')).toMatch(/Chưa kiểm được bài các em vừa làm/)
  })

  it('rút lại lỗi giữa chừng ⇒ GIỮ bản cũ + cảnh báo', async () => {
    const rt = await chayThuRutDeCa('', 'MAT', 'CA-R', ['A', 'B'], { cheDo: 'ca', ngay: NGAY })
    coLuotMoiTheoEm.mockResolvedValue({ em: ['A'] })
    loiDenHanTheoEm.mockRejectedValueOnce(new Error('máy chủ bận'))
    const chot = await chotRutDeCa('', 'MAT', 'CA-R', ['A', 'B'], { cheDo: 'ca', ngay: NGAY, phamVi: 'gan_nhat' })
    expect(chot.boTheoEm.A).toEqual(boCua(rt.kq, 'A'))
    expect(chot.soEmCapNhat).toBe(0)
    expect(chot.canhBao.join(' ')).toMatch(/giữ đề đã chạy thử/)
    expect(docRutThu('CA-R')).toBe(rt) // bản nhớ không bị thay bằng bản hỏng
  })

  it('chưa chạy thử (rút mới ngay lúc chốt) ⇒ không cần hỏi lượt mới', async () => {
    const chot = await chotRutDeCa('', 'MAT', 'CA-N', ['A'], { cheDo: 'ca', ngay: NGAY, phamVi: 'gan_nhat' })
    expect(coLuotMoiTheoEm).not.toHaveBeenCalled()
    expect(chot.soEmCapNhat).toBe(0)
  })
})

describe('Việc 1 — màn thầy báo số em đã cập nhật đúng chuẩn từ ngữ', () => {
  it('toast "Đã cập nhật đề của N em theo bài các em vừa làm" nằm cạnh nhánh chốt v2', async () => {
    const ma = (await import('../src/screens/ExamMonitorScreen.tsx?raw')).default
    const than = ma.slice(ma.indexOf('const batDauCaNay = async'), ma.indexOf('const huyCaCho = async'))
    expect(than).toContain('v2.soEmCapNhat > 0')
    expect(than).toContain('Đã cập nhật đề của ${v2.soEmCapNhat} em theo bài các em vừa làm')
  })
})

// rutDeV2 xác định (seed) — nền cho việc rút lại
describe('rútDeV2 tất định', () => {
  it('cùng dữ liệu + cùng seed ⇒ cùng bộ', () => {
    const kho = BANK_KHO()
    const chay = () => rutDeV2({ kho, soCau: { I: 4, II: 0, III: 0 }, dsSbd: ['A', 'B'], hoSo: { A: { loi: [], daGap: {} }, B: { loi: [], daGap: {} } }, ngay: '2026-10-06', cheDo: 'ca', seed: 'CA-X' })
    expect(JSON.stringify(chay().theoEm)).toBe(JSON.stringify(chay().theoEm))
  })
})
function BANK_KHO() {
  return Array.from({ length: 12 }, (_, i) => ({ id: `D-I-${i}`, phan: 'I' as const, mucDo: 'hieu', dang: '', chuyenDe: 'Ester', lyThuyet: false })) as never
}

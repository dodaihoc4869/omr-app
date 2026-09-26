// MÁY THẦY XIN HỒ SƠ NẮM KIẾN THỨC TỪ MÁY CHỦ — DÂY NỐI CỦA `napHoSoLop` (GĐ 6, 19/09).
//
// Hợp đồng: `docs/hop-dong-ho-so-len-bang-1909.md`.
//   · request `hoSoLopLenBang` mang THÊM `dsQid` (các câu của buổi chữa) — chỉ khi có câu;
//   · response mang THÊM `em[sbd].namKt` — máy chủ đời cũ không có, máy thầy phải chạy như cũ;
//   · máy chủ đời cũ bỏ qua trường thừa `dsQid` (không lỗi).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://test' }))
vi.mock('../src/lib/may-chu-moi', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  layCauHinhMayChu: async () => ({ BAT: true, URL: 'https://test' }),
  xongNapDiaChi: async () => {},
}))

const { napHoSoLop } = await import('../src/lib/ho-so-lop')

const dsEm = [
  { sbd: '12001', hoTen: 'An', coMat: true },
  { sbd: '12002', hoTen: 'Bình', coMat: true },
]
const emRong = { chuyenDe: [], qidSai: [], qidDaLam: [], lenBang: { soLan: 0, lanCuoi: '', qids: [] } }

let guiDi: Record<string, unknown>[] = []
let traVe: Record<string, unknown> = { ok: true, em: {} }

beforeEach(() => {
  guiDi = []
  traVe = { ok: true, em: { '12001': emRong, '12002': emRong } }
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: RequestInit) => {
      guiDi.push(JSON.parse(String(init.body)))
      return { ok: true, status: 200, json: async () => traVe } as Response
    }),
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('napHoSoLop xin hồ sơ nắm kiến thức', () => {
  it('gửi kèm `dsQid` (bỏ trùng, bỏ rỗng) khi buổi có câu', async () => {
    await napHoSoLop('https://test', 'mat', dsEm, ['Q1', 'Q2', 'Q1', ''])
    expect(guiDi).toHaveLength(1)
    expect(guiDi[0]).toMatchObject({ action: 'hoSoLopLenBang', dsSbd: ['12001', '12002'] })
    expect(guiDi[0].dsQid).toEqual(['Q1', 'Q2'])
  })

  it('không có câu nào thì KHÔNG gửi `dsQid` — yêu cầu y hệt trước 19/09', async () => {
    await napHoSoLop('https://test', 'mat', dsEm)
    await napHoSoLop('https://test', 'mat', dsEm, [])
    expect(guiDi).toHaveLength(2)
    for (const b of guiDi) expect('dsQid' in b).toBe(false)
  })

  it('máy chủ MỚI trả `namKt` ⇒ hồ sơ mang hồ sơ nắm của đúng từng em', async () => {
    traVe = {
      ok: true,
      em: {
        '12001': { ...emRong, namKt: { Q1: { lanSai: 3, trangThai: 'moi_sai', canDayLai: true, maDang: 'ES-01', bac: 'biet', dang: { soGap: 6, soDaKhacPhuc: 1, soChuaThaySai: 2 } } } },
        '12002': { ...emRong, namKt: {} },
      },
    }
    const r = await napHoSoLop('https://test', 'mat', dsEm, ['Q1'])
    expect(r.loi).toBe('')
    expect(r.hoSo[0].namKt?.get('Q1')?.canDayLai).toBe(true)
    expect(r.hoSo[0].namKt?.get('Q1')?.bac).toBe('biet')
    expect(r.hoSo[1].namKt?.size).toBe(0)
  })

  it('máy chủ ĐỜI CŨ (không có `namKt`) ⇒ hồ sơ y như trước, không lỗi', async () => {
    const r = await napHoSoLop('https://test', 'mat', dsEm, ['Q1'])
    expect(r.loi).toBe('')
    expect(r.hoSo).toHaveLength(2)
    expect(r.hoSo.every((e) => e.namKt === undefined)).toBe(true)
  })

  it('mất mạng ⇒ hồ sơ rỗng kèm lý do, KHÔNG ném lỗi (xếp buổi vẫn chạy được)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('mất mạng') }))
    const r = await napHoSoLop('https://test', 'mat', dsEm, ['Q1'])
    expect(r.loi).not.toBe('')
    expect(r.hoSo).toHaveLength(2)
    expect(r.hoSo.every((e) => e.namKt === undefined)).toBe(true)
  })
})

describe('Màn Gọi lên bảng xin hồ sơ đúng cho câu của buổi', () => {
  it('truyền danh sách qid của buổi và xin lại khi đổi em/câu hoặc lần trước lỗi', async () => {
    const { readFileSync } = await import('node:fs')
    const man = readFileSync('src/screens/GoiLenBangScreen.tsx', 'utf8')
    expect(man).toContain("napHoSoLop(cauHinh?.url ?? '', cauHinh?.mat ?? '', coMat, qidBuoi)")
    expect(man).toContain('if (loiHoSo || khoaHoSo !== khoaHoSoDaNap.current)')
    expect(man).toContain('khoaHoSoDaNap.current = r.loi ? \'\' : khoaHoSo')
    // Đường xếp buổi dùng LUẬT MỚI (25/09 — thay Engine E): vẫn xếp bằng hồ sơ vừa nạp để lấy em cho `dong`.
    expect(man).toContain('xepBuoiChuaMoi(cauVaoXep, hoSo, CAU_HINH_LEN_BANG_MAC_DINH')
  })
})

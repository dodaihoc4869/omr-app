// @vitest-environment node
// TU LUYỆN — CHỌN NGUỒN CÂU SAI (thầy lệnh 30/09: "phần sửa câu sai trong tu luyện chỗ rút câu cho hs chọn tick nguồn để rút câu").
// Khoá: (1) lệnh nguồn trả đếm THEO NGUỒN (câu sai ở nhiều nguồn đếm cho mỗi nguồn) + bảng mặt nạ ⇒ tổng câu DUY NHẤT đúng cho mọi tổ hợp;
// (2) lệnh rút/xem trước nhận `nguon[]` và chỉ lấy câu có ít nhất một lần sai thuộc nguồn đã chọn; (3) không tick nguồn nào ⇒ không rút;
// (4) máy bản cũ không gửi `nguon` ⇒ cả kho như trước; (5) nhãn "Sai gốc" ưu tiên nguồn em chọn; (6) thứ tự bit hai phía trùng nhau.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { dongBoCacTo, xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { tuLuyenNguon, tuLuyenRut, tuLuyenXemTruoc } from '../server/src/tu-luyen'
import { DS_NGUON_SAI, LOI_CHUA_CHON_NGUON, demTheoNguon, docDsNguon, locTheoNguon, nhanSaiGoc, qidGoc, type LanSai } from '../server/src/tu-luyen-cau-sai'
import { DS_NGUON, demChon } from '../src/components/tu-luyen/nguon-cau-sai'

const T0 = Date.parse('2026-09-30T19:00:00+07:00')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); xoaDemCaBaoVe() })
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

type Tho = Record<string, unknown>
const PA = { A: 'Phương án A', B: 'Phương án B', C: 'Phương án C', D: 'Phương án D' }
const DANG = { ma: 'ES.A.X', ten: 'Ester đơn chức' }
const cauI = (so: number, de: string, dapAn: string, o: Tho = {}): Tho => ({
  phan: 'I', so, de, pa: PA, dap_an: dapAn, dang: DANG, chuyen_de: 'CD1', muc_do: 'biet', loi_giai: { chot: `Chọn ${dapAn} vì lý do ${so}.`, trang_thai: 'khop' }, ...o,
})
const MA = 'DH-12-C1-B1'
const KHO: Tho[] = [
  cauI(1, 'Câu một về ester.', 'B'),
  cauI(2, 'Câu hai về ester.', 'C'),
  cauI(3, 'Câu ba về ester.', 'A'),
  cauI(4, 'Câu bốn về ester.', 'D'),
  cauI(5, 'Câu năm về ester.', 'A'),
  cauI(6, 'Câu sáu về ester.', 'B'),
  { phan: 'III', so: 1, de: 'Tính khối lượng ester (gam).', dap_an: '8,8', dang: DANG, chuyen_de: 'CD1', muc_do: 'van_dung', loi_giai: { chot: 'Tính mol.', ket_qua: '8,8', trang_thai: 'khop' } },
  { phan: 'III', so: 2, de: 'Giải thích vì sao ester nhẹ hơn nước.', dap_an: 'vì khối lượng riêng nhỏ hơn nước nên nổi lên trên', dang: DANG, chuyen_de: 'CD1' }, // tự luận
]
const q = (phan: string, so: number) => `${MA}-${phan}-${so}`

let n = 0
function suKien(d: D1That, o: { qid: string; nguon: string; maNguon: string; ketQua: 0 | 1 | null; luc: string; maDang?: string }) {
  const ngay = new Date(Date.parse(o.luc) + 7 * 3_600_000).toISOString().slice(0, 10)
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,ma_dang) VALUES(?,?,?,?,?,1,?,?,?,?)')
    .run(`k${++n}`, 'HS1', o.qid, o.nguon, o.maNguon, o.ketQua, o.luc, ngay, o.maDang ?? null)
}

async function dung(lop = '12'): Promise<D1That> {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('HS1','Em Một',?,'x','x')").run(lop)
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'12',?,?,0,'v1')").run(MA, MA, KHO.length, `kho/${MA}.json`)
  d.objects.set(`kho/${MA}.json`, { ma_de: MA, cau: KHO.map((c) => ({ ...c })) })
  for (const t of KHO) d.sql.prepare("INSERT INTO cau_hoi(qid,ma_de,chuyen_de,muc_do,phan,lop,co_loi_giai,cap_nhat_luc) VALUES(?,?,'CD1','biet',?,'12',1,'x')").run(q(String(t.phan), Number(t.so)), MA, String(t.phan))
  await dongBoCacTo(d.env, [MA])
  const ca = d.sql.prepare(`INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES(?,?,?,?,?,45,'thi',?,'',?)`)
  ca.run('CA-1', 'Ca kiểm tra Ester', 'dong', '2026-09-29T01:00:00.000Z', '2026-09-29T02:00:00.000Z', 'ngay', 'x')
  d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('G-DAO', 'HS1', JSON.stringify({ mode: 'adventure', questions: [] }), 'x')
  return d
}
const ldNop = (d: D1That, id: string, status = 'submitted', result: Tho | null = null) =>
  d.sql.prepare('INSERT INTO luyen_de_2026(id,sbd,created_at,deadline,status,bank_key,answers,result,updated_at) VALUES(?,?,?,?,?,?,?,?,?)')
    .run(id, 'HS1', T0 - 3_600_000, T0, status, `luyen-de-2026/HS1/${id}.json`, '{}', result ? JSON.stringify(result) : null, T0 - 600_000)
const coDapAn = (o: unknown) => /dap_?an|loiGiai|loi_giai|"chot"|ketQua|lyDo|chuaCho|"correct"/i.test(JSON.stringify(o))
const qids = (r: Tho) => (r.cau as { qid: string }[]).map((c) => c.qid)

/** Kho mẫu: câu 1 sai ở Đảo (29/09) VÀ ca kiểm tra (30/09) · câu 2 Bi-a · câu 3 Đoàn Hộ Tống · câu 4 Luyện đề cấu trúc. */
async function khoMau(): Promise<D1That> {
  const d = await dung()
  const ss = d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)')
  ss.run('G-BIA', 'HS1', JSON.stringify({ mode: 'adventure', bia: 1, questions: [] }), 'x')
  ss.run('G-DOAN', 'HS1', JSON.stringify({ mode: 'adventure', doan: { chang: 1 }, questions: [] }), 'x')
  suKien(d, { qid: q('I', 1), nguon: 'game', maNguon: 'G-DAO', ketQua: 0, luc: '2026-09-29T02:00:00.000Z' })
  suKien(d, { qid: q('I', 1), nguon: 'thi', maNguon: 'CA-1', ketQua: 0, luc: '2026-09-30T02:00:00.000Z' })
  suKien(d, { qid: q('I', 2), nguon: 'game', maNguon: 'G-BIA', ketQua: 0, luc: '2026-09-30T02:30:00.000Z' })
  suKien(d, { qid: q('I', 3), nguon: 'game', maNguon: 'G-DOAN', ketQua: 0, luc: '2026-09-30T02:40:00.000Z' })
  ldNop(d, 'LD1')
  suKien(d, { qid: q('I', 4), nguon: 'luyen', maNguon: 'LD1', ketQua: 0, luc: '2026-09-30T03:00:00.000Z' })
  return d
}

describe('Đếm theo nguồn + khử trùng', () => {
  it('lệnh nguồn: mỗi nguồn đếm câu của nó, tổng là số câu DUY NHẤT; bảng mặt nạ tính đúng mọi tổ hợp', async () => {
    const d = await khoMau()
    const ng = await tuLuyenNguon(d.env, 'HS1')
    const k = ng.khoCauSai as { tong: number; theoNguon: Record<string, number>; theoMat: Record<string, number> }
    expect(k.tong).toBe(4)
    expect(k.theoNguon).toEqual({ ca: 1, dao: 1, doan: 1, bia: 1, tu_luyen: 0, luyen_de: 1 })
    // tổng theo nguồn = 5 (câu 1 ở hai nguồn) nhưng câu duy nhất = 4
    expect(Object.values(k.theoNguon).reduce((a, b) => a + b, 0)).toBe(5)
    expect(demChon(k.theoMat, DS_NGUON.map((n) => n.ma))).toBe(4)
    expect(demChon(k.theoMat, ['ca', 'dao'])).toBe(1)
    expect(demChon(k.theoMat, ['ca', 'bia'])).toBe(2)
    expect(demChon(k.theoMat, [])).toBe(0)
    expect(coDapAn(ng.khoCauSai)).toBe(false)
  })

  it('hàm thuần: demTheoNguon / locTheoNguon / docDsNguon; thứ tự bit máy chủ = máy em', () => {
    const l = (qid: string, loai: LanSai['loai']): LanSai => ({ qid, loai, tenCa: '', tenChienDich: '', luc: '2026-09-30T01:00:00.000Z', ngay: '2026-09-30' })
    const ds = [{ lanSai: [l('a', 'ca'), l('a', 'tu_luyen'), l('a', 'ca')] }, { lanSai: [l('b', 'tu_luyen')] }, { lanSai: [l('c', 'bia')] }]
    const { theoNguon, theoMat } = demTheoNguon(ds)
    expect(theoNguon).toMatchObject({ ca: 1, tu_luyen: 2, bia: 1, dao: 0 })
    expect(demChon(theoMat, ['tu_luyen'])).toBe(2)
    expect(demChon(theoMat, ['ca', 'tu_luyen'])).toBe(2)
    expect(locTheoNguon(ds, new Set(['bia'] as const)).length).toBe(1)
    expect(locTheoNguon(ds, null).length).toBe(3)
    expect(docDsNguon(undefined)).toBeNull()
    expect([...docDsNguon(['ca', 'la', 'bia', 3])!]).toEqual(['ca', 'bia'])
    expect(DS_NGUON.map((n) => n.ma)).toEqual([...DS_NGUON_SAI])
  })
})

describe('Rút chỉ từ nguồn đã chọn', () => {
  it('nguon = [Bi-a] ⇒ chỉ câu 2 (thiếu thì lặp), xem trước đếm đúng 1; không lộ đáp án', async () => {
    const d = await khoMau()
    const x = await tuLuyenXemTruoc(d.env, 'HS1', { cheDo: 1, nguon: ['bia'] })
    expect(x.tongToiDa).toBe(1)
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 10, nguon: ['bia'] })
    expect(r.ok).toBe(true)
    expect(new Set(qids(r).map(qidGoc))).toEqual(new Set([q('I', 2)]))
    expect(qids(r).length).toBe(2)
    expect(coDapAn(r.cau)).toBe(false)
  })

  it('nguon = [Đoàn Hộ Tống, Luyện đề cấu trúc] ⇒ đúng câu 3 + 4', async () => {
    const d = await khoMau()
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 2, nguon: ['doan', 'luyen_de'] })
    expect(qids(r).sort()).toEqual([q('I', 3), q('I', 4)])
  })

  it('câu sai ở nhiều nguồn: chọn một nguồn vẫn lấy được, "Sai gốc" hiện nguồn em chọn (vẫn đếm mọi lần)', async () => {
    const d = await khoMau()
    const theoDao = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 1, nguon: ['dao'] })
    const c = (theoDao.cau as { qid: string; saiGoc: string }[])[0]!
    expect(c.qid).toBe(q('I', 1))
    expect(c.saiGoc).toBe('Sai gốc: Đảo thần thú · 29/09 và 1 lần khác')
    const d2 = await khoMau()
    const ca = await tuLuyenRut(d2.env, 'HS1', { cheDo: 1, soCau: 1, nguon: ['ca'] })
    expect((ca.cau as { saiGoc: string }[])[0]!.saiGoc).toBe('Sai gốc: Ca kiểm tra Ester · 30/09 và 1 lần khác')
  })

  it('không tick nguồn nào ⇒ không rút (rút báo lỗi, xem trước 0 câu); máy bản cũ không gửi nguồn ⇒ cả kho', async () => {
    const d = await khoMau()
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 10, nguon: [] })
    expect(r).toMatchObject({ ok: false, error: LOI_CHUA_CHON_NGUON })
    const x = await tuLuyenXemTruoc(d.env, 'HS1', { cheDo: 1, nguon: [] })
    expect(x).toMatchObject({ ok: true, tongToiDa: 0, loi: LOI_CHUA_CHON_NGUON })
    const rac = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 10, nguon: ['la-lam'] })
    expect(rac.ok).toBe(false)
    const cu = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 4 })
    expect(qids(cu).sort()).toEqual([q('I', 1), q('I', 2), q('I', 3), q('I', 4)])
  })

  it('nguồn đã chọn không còn câu ⇒ báo rõ, không rút', async () => {
    const d = await khoMau()
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 5, nguon: ['tu_luyen'] })
    expect(r).toMatchObject({ ok: false, error: 'Nguồn em chọn không còn câu sai nào. Em chọn thêm nguồn khác.' })
  })

  it('nhanSaiGoc: không truyền nguồn ưu tiên ⇒ giữ đúng luật cũ', () => {
    const l = (loai: LanSai['loai'], luc: string): LanSai => ({ qid: 'x', loai, tenCa: 'Ca A', tenChienDich: '', luc, ngay: luc.slice(0, 10) })
    const ds = [l('dao', '2026-09-29T01:00:00Z'), l('ca', '2026-09-30T01:00:00Z')]
    expect(nhanSaiGoc(ds)).toBe('Sai gốc: Ca A · 30/09 và 1 lần khác')
    expect(nhanSaiGoc(ds, new Set(['dao'] as const))).toBe('Sai gốc: Đảo thần thú · 29/09 và 1 lần khác')
    expect(nhanSaiGoc(ds, new Set(['bia'] as const))).toBe('Sai gốc: Ca A · 30/09 và 1 lần khác')
  })
})

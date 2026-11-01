// @vitest-environment node
// HÔM NAY · 4 BẢNG — PHẦN D1 (server/src/bon-chi-so-d1.ts) trên D1 thật trong máy. Hai đường đọc sổ đã có test riêng (bộ Học thật, Nhịp học) ⇒ ở đây giả lập
// ĐẦU RA của chúng, khoá phần mới:
//   · cron: giờ cao điểm 18:00–23:30 không chạy; ngoài giờ mỗi lượt một lô em chưa có bản HÔM NAY (ngày 12 em, đêm 25 em); hết ⇒ «xong»;
//   · /gv/bon-bang: 4 bảng xếp cao → thấp đúng ngưỡng, dòng có bằng chứng ngắn, trung vị cả lớp, đang tính dần (daTinh/tong);
//   · /gv/bon-bang/em: hạng trong bảng thầy bấm, «cả lớp» từng thẻ = trung vị số đo, ví dụ có tên bài + đầu đề; em chưa có bản ⇒ tính ngay rồi lưu.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { danhGiaEm, type DauVaoDanhGia, type LuotDanhGia } from '../server/src/danh-gia-hoc-that'

const NGAY = ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31']
type Kieu = 'luoi' | 'that' | 'doiPho'
const EM = Array.from({ length: 15 }, (_, i) => ({ sbd: `S${String(i + 1).padStart(2, '0')}`, hoTen: `Học Sinh ${String.fromCharCode(65 + i)}`, lop: '11A2', khoi: '11', goi7Tu: null }))
const KIEU: Record<string, Kieu> = Object.fromEntries(EM.map((e, i) => [e.sbd, (i % 3 === 0 ? 'luoi' : i % 3 === 1 ? 'that' : 'doiPho') as Kieu]))
let tick = 0
const L = (o: Partial<LuotDanhGia> & { ngay: string }): LuotDanhGia => ({ phan: 'I', dung: true, ma: 3, r: 1.2, pLop: 0.6, chon: 'A', coGoiY: false, songSinh: false, luc: new Date(Date.parse(`${o.ngay}T01:00:00Z`) + ++tick * 10_000).toISOString(), cau: `C${tick}`, giay: 40, giayDoc: 16, qid: 'DH-11-C2-B7-I-1', ...o })
function dauVaoCua(sbd: string): DauVaoDanhGia {
  const k = KIEU[sbd]
  const luot = k === 'luoi' ? [] : NGAY.flatMap((n) => Array.from({ length: 36 }, (_, i) => (k === 'doiPho' ? L({ ngay: n, ma: i < 20 ? 1 : 3, dung: i >= 20, giay: 3 }) : L({ ngay: n }))))
  return { luot, ngayCuaSo: NGAY, ktcn: { daNop: 0, boHan: 0, diem: [] }, thi: [], gianLanXacNhan: 0 }
}
vi.mock('../server/src/bai-hang-ngay', async (goc) => ({
  ...(await goc<typeof import('../server/src/bai-hang-ngay')>()),
  docDanhSachEm: vi.fn(async () => EM),
  docNgayCacEm: vi.fn(async (_env: unknown, em: typeof EM) => new Map(em.map((e) => [e.sbd, NGAY.map((ngay) => ({ ngay, mucToiThieu: 36, daLam: KIEU[e.sbd] === 'luoi' ? 0 : 36 }))]))),
}))
vi.mock('../server/src/nhip-hoc', async (goc) => ({
  ...(await goc<typeof import('../server/src/nhip-hoc')>()),
  docNgayVao: vi.fn(async (_env: unknown, em: typeof EM, tu: string) => new Map(em.map((e) => [e.sbd, tu]))),
}))
vi.mock('../server/src/danh-gia-hoc-that-d1', async (goc) => ({
  ...(await goc<typeof import('../server/src/danh-gia-hoc-that-d1')>()),
  tinhLoEm: vi.fn(async (_env: unknown, sbds: string[]) => sbds.map((sbd) => { const dauVao = dauVaoCua(sbd); return { sbd, tuan: '', kq: danhGiaEm(dauVao), bac: { bac: 1, lyDo: [], viec: null }, coDoNang: { coTinh: false, gianLan: 0 }, dauVao } })),
}))
const M = await import('../server/src/bon-chi-so-d1')
const NOW = Date.parse('2026-11-01T03:00:00Z') // 10:00 giờ VN
beforeEach(() => M.xoaDemBon())
afterEach(() => vi.clearAllMocks())

function moi() {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-11-C2-B7','Bài 7. Nitrogen và hợp chất',40,0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES('DH-11-C2-B7','DH-11-C2-B7-I-1','v1','g',NULL,?)").run(JSON.stringify({ text: 'Cho 12,0 gam hỗn hợp X gồm Fe và Cu vào dung dịch HCl dư, thu được 2,479 lít khí H₂ (đkc). Phần trăm khối lượng Cu là' }))
  return { d, env: d.env as unknown as Env }
}

describe('cron 4 bảng', () => {
  it('cao điểm không chạy; ngoài giờ mỗi lượt 12 em (ban ngày) tới hết, rồi «xong»; bản ghi ngày hôm nay', async () => {
    const { d, env } = moi()
    expect(await M.cronBonChiSo(env, Date.parse('2026-11-01T12:30:00Z'))).toEqual({ chay: false, lyDo: 'cao_diem' }) // 19:30 VN
    expect(await M.cronBonChiSo(env, NOW)).toEqual({ chay: true, soEm: 12, con: 3 })
    expect(await M.cronBonChiSo(env, NOW + 60_000)).toEqual({ chay: true, soEm: 3, con: 0 })
    expect(await M.cronBonChiSo(env, NOW + 120_000)).toEqual({ chay: false, lyDo: 'xong' })
    const r = d.sql.prepare('SELECT COUNT(*) n, MIN(ngay) a, MAX(ngay) b FROM bon_chi_so_em').get() as { n: number; a: string; b: string }
    expect(r).toEqual({ n: 15, a: '2026-11-01', b: '2026-11-01' })
  })
})

describe('/gv/bon-bang + /gv/bon-bang/em', () => {
  it('4 bảng đúng ngưỡng, cao → thấp, có bằng chứng ngắn; trung vị; bằng chứng một em có hạng, cả lớp, tên bài + đầu đề', async () => {
    const { env } = moi()
    expect(await M.gvBonBang(env, {}, NOW)).toMatchObject({ ok: true, daTinh: 0, tong: 15 })
    await M.cronBonChiSo(env, NOW); await M.cronBonChiSo(env, NOW)
    const b = await M.gvBonBang(env, {}, NOW)
    if (!b.ok) throw new Error(b.error)
    expect(b).toMatchObject({ tu: '2026-10-18', den: '2026-10-31', daTinh: 15, tong: 15 })
    expect(b.bang.lu.map((x) => x.sbd)).toEqual(['S01', 'S04', 'S07', 'S10', 'S13'])
    // ngày bảo trì (ngay-bao-tri.ts) em chưa đủ mức KHÔNG tính là ngày không làm (luật Nhịp học) ⇒ mẫu n/n, n ≤ 14
    expect(b.bang.lu[0]!.bc).toMatch(/^\*\*(\d+)\/\1\*\* ngày không làm$/)
    expect(b.bang.dp.map((x) => x.sbd).sort()).toEqual(['S03', 'S06', 'S09', 'S12', 'S15'])
    expect(b.bang.ht.map((x) => x.sbd).sort()).toEqual(['S02', 'S05', 'S08', 'S11', 'S14'])
    expect(b.bang.ch.length).toBeGreaterThanOrEqual(5)
    for (const k of ['ht', 'dp', 'ch', 'lu'] as const) for (let i = 1; i < b.bang[k].length; i++) expect(b.bang[k][i - 1]!.diem).toBeGreaterThanOrEqual(b.bang[k][i]!.diem)
    expect(b.trungVi.lu).not.toBeNull()

    const e = await M.gvBonBangEm(env, { sbd: 'S03', bang: 'dp' }, NOW)
    if (!e.ok) throw new Error(e.error)
    expect(e.em).toEqual({ sbd: 'S03', hoTen: 'Học Sinh C', lop: '11A2' })
    expect(e.hang).toEqual({ thu: 1, tong: 5 })
    expect(e.ketLuan).toContain('làm cho có')
    const voi = e.the.find((t) => t.ma === 'voi')!
    expect(voi.so).toBe(56)
    expect(voi.lop).toBe(28) // trung vị cả lớp: 5 em làm thật 0% · 5 em đối phó 56% (em không có lượt nào thì không tính)
    expect(voi.viDu![0]!.cau).toBe('Bài 7 · Cho 12,0 gam hỗn hợp X gồm Fe và Cu vào dung dịch…')
    expect(e.ngay).toHaveLength(14)
    expect(await M.gvBonBangEm(env, { sbd: 'X99', bang: 'dp' }, NOW)).toMatchObject({ ok: false })
  })
  it('em chưa có bản tính ⇒ tính ngay, lưu, trả bằng chứng', async () => {
    const { d, env } = moi()
    const e = await M.gvBonBangEm(env, { sbd: 'S02', bang: 'ht' }, NOW)
    if (!e.ok) throw new Error(e.error)
    expect(e.diem.ht).not.toBeNull()
    expect((d.sql.prepare("SELECT COUNT(*) n FROM bon_chi_so_em WHERE sbd = 'S02'").get() as { n: number }).n).toBe(1)
  })
  it('tên câu ngắn: «Bài N · đầu đề…»', () => {
    expect(M.tenCauNgan('Bài 10. Quy tắc octet', 'Nguyên tử   Na có cấu hình')).toBe('Bài 10 · Nguyên tử Na có cấu hình')
    expect(M.tenCauNgan('', '')).toBe('Câu luyện tập')
  })
})

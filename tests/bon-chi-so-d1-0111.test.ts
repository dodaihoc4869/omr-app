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
  // v2: «làm thật» phải có BẰNG CHỨNG — có câu sai rồi sửa đúng bằng câu song sinh 2 ngày sau, và kiểm tra cá nhân khớp luyện tập.
  const luot = k === 'luoi' ? [] : NGAY.flatMap((n, d) => Array.from({ length: 36 }, (_, i) => (k === 'doiPho' ? L({ ngay: n, ma: i < 20 ? 1 : 3, dung: i >= 20, giay: 3 })
    : i < 2 && d < 10 ? L({ ngay: n, cau: `${sbd}-S${d}-${i}`, dung: false }) : i >= 34 && d >= 2 ? L({ ngay: n, cau: `${sbd}-S${d - 2}-${i - 34}`, songSinh: true }) : L({ ngay: n }))))
  return { luot, ngayCuaSo: NGAY, ktcn: { daNop: k === 'that' ? 1 : 0, boHan: 0, diem: k === 'that' ? [9] : [] }, thi: [], gianLanXacNhan: 0 }
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
    // v3b (02/11): hai trục, mỗi em một nhãn mỗi trục — em đối phó chọn vội mà sai 20/36 câu mỗi ngày là LÀM CHO CÓ ⇒ Lười (lý do riêng), xếp sau em bỏ hẳn ngày
    expect(b.bang.lu.map((x) => x.sbd).slice(0, 5)).toEqual(['S01', 'S04', 'S07', 'S10', 'S13'])
    expect(b.bang.lu.map((x) => x.sbd).sort()).toEqual(['S01', 'S03', 'S04', 'S06', 'S07', 'S09', 'S10', 'S12', 'S13', 'S15'])
    expect(b.bang.lu.find((x) => x.sbd === 'S03')!.bc).toMatch(/lượt làm cho có$/)
    // ngày bảo trì (ngay-bao-tri.ts) em chưa đủ mức KHÔNG tính là ngày không làm (luật Nhịp học) ⇒ mẫu n/n, n ≤ 14
    expect(b.bang.lu[0]!.bc).toMatch(/^\*\*(\d+)\/\1\*\* ngày không làm$/)
    expect(b.bang.dp.map((x) => x.sbd).sort()).toEqual(['S03', 'S06', 'S09', 'S12', 'S15'])
    expect(b.bang.ht.map((x) => x.sbd).sort()).toEqual(['S02', 'S05', 'S08', 'S11', 'S14'])
    expect(b.bang.ch.length).toBeGreaterThanOrEqual(5)
    for (const k of ['ht', 'dp', 'ch', 'lu'] as const) for (let i = 1; i < b.bang[k].length; i++) expect(b.bang[k][i - 1]!.diem).toBeGreaterThanOrEqual(b.bang[k][i]!.diem)
    expect(b.trungVi.lu).not.toBeNull()
    expect(b.theoDoi).toEqual([]) // v3b: bỏ «Đang theo dõi» — giữ khoá cho app cũ, luôn rỗng
    // mọi em đều có bảng: em lười không làm gì chỉ có trục công sức; còn lại đủ hai trục
    const coBang = new Set((['ht', 'dp', 'ch', 'lu'] as const).flatMap((k) => b.bang[k].map((x) => x.sbd)))
    expect(coBang.size).toBe(15)

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
  it('kết luận bản cũ (một đoạn, chưa có v: 2) ⇒ bấm em là tính lại ngay: mỗi lý do một dòng, lưu bản mới', async () => {
    const { d, env } = moi()
    await M.cronBonChiSo(env, NOW); await M.cronBonChiSo(env, NOW)
    d.sql.prepare("UPDATE bon_chi_so_em SET ket_json = ? WHERE sbd = 'S03'").run(JSON.stringify({ dp: 'Em làm 14/14 ngày đủ mức nhưng làm cho có: treo máy cho đủ giờ: **16**; **52%** số câu.', ht: '', ch: '', lu: '' }))
    const e = await M.gvBonBangEm(env, { sbd: 'S03', bang: 'dp' }, NOW)
    if (!e.ok) throw new Error(e.error)
    expect(e.ketLuan.split('\n').length).toBeGreaterThanOrEqual(2)
    expect(e.ketLuan.split('\n')[1]).toMatch(/^\*\*\d+%\*\* số câu chọn đáp án khi chưa kịp đọc hết đề — sai \d+\/\d+ câu$/)
    expect(JSON.parse((d.sql.prepare("SELECT ket_json j FROM bon_chi_so_em WHERE sbd = 'S03'").get() as { j: string }).j).v).toBe(2)
  })
  it('v3 (02/11): đọc ca thi thật + lên bảng + luyện tập cũ trên D1 thật — đơn vị kiến thức tra từ `cau_meta`, thẻ «Ca thi khớp luyện tập» / «Lên bảng»', async () => {
    const { d, env } = moi()
    const sk = d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de, muc_do) VALUES (?,?,?,?,?,1,?,NULL,?,?,NULL,?,?)')
    const meta = d.sql.prepare('INSERT INTO cau_meta (ma_de, qid, thu_tu, chuyen_de) VALUES (?,?,?,?)')
    // luyện tập CŨ hơn 14 ngày (01–10/10): 20 câu chặng học, 16 đúng — dòng sổ KHÔNG ghi chuyên đề, chuyên đề tra theo qid trong chỉ mục kho
    for (let i = 0; i < 20; i++) {
      const ngay = `2026-10-${String(1 + (i % 10)).padStart(2, '0')}`
      sk.run(`luyen|m|S02|P${i}|1`, 'S02', `P${i}`, 'luyen', 'm', i < 16 ? 1 : 0, `${ngay}T10:00:00.000Z`, ngay, null, '')
      meta.run('DH-12-ESTE', `P${i}`, i, 'Este')
    }
    meta.run('DH-12-ESTE', 'P0~ss1', 99, 'Không dùng') // qid ảo song sinh không bao giờ ghép (qid gốc)
    // ca thi thật 12/10: 6 câu Este (5 đúng) + 1 câu bỏ trống (= sai); ca chưa công bố (che) không đọc
    for (let i = 0; i < 7; i++) sk.run(`thi|CA1|S02|T${i}|1`, 'S02', `T${i}`, 'thi', 'CA1', i < 5 ? 1 : i === 5 ? 0 : null, '2026-10-12T12:00:00.000Z', '2026-10-12', 'Este', 'hieu')
    sk.run('thi|CA2|S02|U0|1', 'S02', 'U0', 'thi', 'CA2', 0, '2026-10-13T12:00:00.000Z', '2026-10-13', 'Este', 'hieu')
    d.sql.prepare("UPDATE su_kien_hoc SET visibility = 'embargoed' WHERE ma_nguon = 'CA2'").run()
    // lên bảng + kiểm tra đầu giờ: 3 lần, đạt 2
    sk.run('len_bang|lb|S02|P1|1', 'S02', 'P1', 'len_bang', 'lb', 1, '2026-10-20T09:00:00.000Z', '2026-10-20', 'Este', '')
    sk.run('len_bang|lb|S02|P2|2', 'S02', 'P2', 'len_bang', 'lb', 1, '2026-10-22T09:00:00.000Z', '2026-10-22', 'Este', '')
    sk.run('dau_gio|b1|S02|P3|1', 'S02', 'P3', 'dau_gio', 'b1', 0, '2026-10-24T09:00:00.000Z', '2026-10-24', 'Este', '')
    const e = await M.gvBonBangEm(env, { sbd: 'S02', bang: 'ht' }, NOW)
    if (!e.ok) throw new Error(e.error)
    const ca = e.the.find((t) => t.ma === 'caThi')!
    expect(ca).toMatchObject({ tieu: 'Ca thi khớp luyện tập', lon: '5/7' })
    expect(ca.hai![0]).toMatchObject({ nhan: 'Luyện tập · cùng đơn vị', so: '80%', phu: '16/20 lượt đúng' })
    expect(ca.viDu![0]).toMatchObject({ cau: 'Este', phu: 'luyện 16/20', kq: 'thi 5/7' })
    expect(e.the.find((t) => t.ma === 'lenBang')).toMatchObject({ lon: '2/3', nhoSo: 'lần đạt · chưa đạt 1' })
    const sl = JSON.parse((d.sql.prepare("SELECT so_lieu_json j FROM bon_chi_so_em WHERE sbd = 'S02'").get() as { j: string }).j)
    expect(sl).toMatchObject({ ban: 4, caCau: 7, caGhep: 7, bangTong: 3, bangDat: 2, theoDoi: null })
  })
  it('tên câu ngắn: «Bài N · đầu đề…»', () => {
    expect(M.tenCauNgan('Bài 10. Quy tắc octet', 'Nguyên tử   Na có cấu hình')).toBe('Bài 10 · Nguyên tử Na có cấu hình')
    expect(M.tenCauNgan('', '')).toBe('Câu luyện tập')
  })
})

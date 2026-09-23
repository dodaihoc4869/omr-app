import { daHocDang } from './_pham-vi-ca-nhan'
// @vitest-environment node
// THỬ THÁCH RIÊNG HÔM NAY (Bộ não A.I Nấc 1; docs/hop-dong-thu-thach-rieng-2109.md): máy chủ CHỌN + CHỐT câu (không tự luận, chưa làm 14 ngày, không vượt bậc + 1, không đề bảo vệ, không đáp án),
// nộp đi đường chấm của ôn lại (nguồn sổ thu_thach_rieng), số thật thần thú, cờ tắt, dòng mayDaLam.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { boNaoHoSoNgay } from '../server/src/bo-nao'
import { docThanThuSoThat, chonCauThuThach, docThuThachTuDieuChinh, mucNham, type UngVien } from '../server/src/thu-thach-rieng'
import { ghiSuKien, ngayVn } from '../server/src/su-kien-hoc'
import { thanhExp } from '../src/game/than-thu-hoa-hoc/kinh-nghiem'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

vi.mock('../server/src/game-v2-auth', async (orig) => ({
  ...(await orig<typeof import('../server/src/game-v2-auth')>()),
  gameIdentity: async (_e: unknown, b: Record<string, unknown>) => {
    if (b.token === 'token-S1') return 'S1'
    if (b.token === 'token-S2') return 'S2'
    throw new Error('Phiên đăng nhập không hợp lệ.')
  },
}))
afterEach(() => vi.useRealTimers())

const H = 3_600_000
const D = 86_400_000
const LOI_GIAI = 'LOI-GIAI-BI-MAT-XYZ'
const HOM_NAY = () => ngayVn(Date.now())
const LOI_MOI = 'Viêm Sư còn thiếu 40 EXP để lên cấp 7. Hôm nay thử 6 câu Thuỷ phân este, xong là đủ.'
const cauKho = (qid: string, dang: string, muc: 'biet' | 'hieu' | 'van_dung', o: Record<string, unknown> = {}) => ({
  qid, maDe: 'DEX', version: 'v', group: `g-${qid}`, phan: 'I', text: `Nội dung câu ${qid}.`, choices: ['A. a', 'B. b', 'C. c', 'D. d'], ideas: [], dang, tenDang: 'Dạng thử', mucDo: muc, sao: 1, kienThuc: ['k1'],
  hinhAnh: [{ viTri: 'sau_loi_giai', url: 'ANH-LOI-GIAI.png' }], correct: 'B', solution: LOI_GIAI, reviewed: true, ...o,
})
const tuLuan = (qid: string, dang: string) => ({ ...cauKho(qid, dang, 'hieu'), phan: 'III', choices: [], text: 'Theo em, có thể dùng phương pháp nào để tách saccharose ra khỏi hỗn hợp saccharose và cát?', correct: 'kết tinh lại' })
function themKho(d: D1That, cau: ReturnType<typeof cauKho>[], maDe = 'DEX') {
  d.sql.prepare("INSERT OR IGNORE INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'12',?,?,0,'v1')").run(maDe, maDe, cau.length, `kho/${maDe}.json`)
  d.sql.prepare("INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(maDe)
  for (const c of cau) d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(maDe, c.qid, 'v', c.group, c.dang, JSON.stringify({ ...c, maDe }))
}
/** Dạng D1: 4 câu mức biết (B1..B4), 4 hiểu (H1..H4), 4 vận dụng (V1..V4), 2 câu tự luận (T1, T2). Dạng D2: chỉ 2 câu hiểu (X1, X2). */
const KHO = [
  ...[1, 2, 3, 4].map((i) => cauKho(`DEX-I-B${i}`, 'D1', 'biet')), ...[1, 2, 3, 4].map((i) => cauKho(`DEX-I-H${i}`, 'D1', 'hieu')), ...[1, 2, 3, 4].map((i) => cauKho(`DEX-I-V${i}`, 'D1', 'van_dung')),
  tuLuan('DEX-III-T1', 'D1'), tuLuan('DEX-III-T2', 'D1'), cauKho('DEX-I-X1', 'D2', 'hieu'), cauKho('DEX-I-X2', 'D2', 'hieu'),
]
const goi = (d: D1That, duong: string, b: Record<string, unknown> = {}, token: string | null = 'token-S1') => goiWorker(worker, d.env, duong, { ...(token ? { token } : {}), ...b })
const thu = (d: D1That, token: string | null = 'token-S1') => goi(d, '/hs/thu-thach-hom-nay', {}, token)
const nop = (d: D1That, traLoi: unknown, token: string | null = 'token-S1') => goi(d, '/hs/thu-thach-hom-nay/nop', { traLoi }, token)
const themDieuChinh = (d: D1That, sbd: string, o: { thuThach?: unknown; loiMoi?: string; ap?: number; huy?: number; ngay?: string } = {}) =>
  d.sql.prepare("INSERT OR REPLACE INTO ai_dieu_chinh(sbd,ngay,json,ap_dung,het_han,huy,nop_luc,che_do) VALUES(?,?,?,?,'2999-01-01',?,'x','that')").run(
    sbd, o.ngay ?? HOM_NAY(), JSON.stringify({ thuThach: o.thuThach ?? { dang: ['D1'], soCau: 6, bac: 'dung_bac' }, loiMoi: o.loiMoi ?? LOI_MOI }), o.ap ?? 1, o.huy ?? 0)
const dangHs = (d: D1That, sbd: string, ma: string, gap: number, bac: number) => {
  d.sql.prepare("INSERT OR REPLACE INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES(?,?,?,?,0,0,0,0,?,'x')").run(`${sbd}|${ma}`, sbd, ma, gap, bac)
  daHocDang(d, sbd, ma)
}
const hoSoGame = (d: D1That, sbd: string, o: { pet?: string; cap?: number; exp?: number; manh?: number; choice?: boolean } = {}) =>
  d.sql.prepare('INSERT OR REPLACE INTO game_v2_profile(sbd,revision,json,created_at) VALUES(?,1,?,?)').run(sbd, JSON.stringify({ pet: o.pet ?? 'lua_phuong', choice: o.choice ?? false, cap: o.cap ?? 6, exp: o.exp ?? 50, nickname: 'Biệt danh riêng', khienRen: { manh: o.manh ?? 15, daRen: 0 } }), 'x')
function truong(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Em Một','12','x'),('S2','Em Hai','12','x')").run()
  themKho(d, KHO)
  dangHs(d, 'S1', 'D1', 8, 1) // đủ căn cứ, bậc hồ sơ 1 (hiểu)
  themDieuChinh(d, 'S1')
  hoSoGame(d, 'S1')
  return d
}
const qidCua = (r: { cau: { qid: string }[] }) => r.cau.map((c) => c.qid)
const mucCua = (qid: string) => (/-B\d$/.test(qid) ? 0 : /-H\d$/.test(qid) || /-X\d$/.test(qid) ? 1 : 2)

describe('hàm thuần', () => {
  it('docThuThachTuDieuChinh: đúng khuôn ⇒ nhận; sai dạng / số câu / bậc / lời mời ⇒ null', () => {
    const ok = { thuThach: { dang: ['D1', 'D2'], soCau: 6, bac: 'thap_hon_mot_bac' }, loiMoi: '  Lời   mời 6 câu. ' }
    expect(docThuThachTuDieuChinh(JSON.stringify(ok))).toEqual({ thuThach: { dang: ['D1', 'D2'], soCau: 6, bac: 'thap_hon_mot_bac' }, loiMoi: 'Lời mời 6 câu.' })
    for (const sai of [
      { ...ok, thuThach: { ...ok.thuThach, soCau: 2 } }, { ...ok, thuThach: { ...ok.thuThach, soCau: 9 } }, { ...ok, thuThach: { ...ok.thuThach, soCau: 5.5 } }, { ...ok, thuThach: { ...ok.thuThach, soCau: '6' } },
      { ...ok, thuThach: { ...ok.thuThach, dang: [] } }, { ...ok, thuThach: { ...ok.thuThach, dang: ['A', 'B', 'C'] } }, { ...ok, thuThach: { ...ok.thuThach, bac: 'cao_hon_hai_bac' } },
      { ...ok, loiMoi: '' }, { ...ok, loiMoi: 'x'.repeat(201) }, { ...ok, loiMoi: 5 }, { loiMoi: 'chỉ có lời' }, { thuThach: ok.thuThach }, [], null, 'không phải json',
    ]) expect(docThuThachTuDieuChinh(sai), JSON.stringify(sai).slice(0, 50)).toBeNull()
    expect(docThuThachTuDieuChinh({ ...ok, thuThach: { ...ok.thuThach, dang: ['D1', 'D1'], soCau: 3 } })!.thuThach.dang).toEqual(['D1']) // trùng dạng gộp lại
    expect(docThuThachTuDieuChinh({ ...ok, loiMoi: 'x'.repeat(200) })).not.toBeNull() // đúng 200 ký tự (biên)
  })
  it('mucNham: dung_bac = bậc; thap = bậc − 1 (≥ 0); cao = bậc + 1 (≤ 2) — KHÔNG BAO GIỜ vượt bậc + 1', () => {
    expect([0, 1, 2].map((b) => mucNham(b, 'dung_bac'))).toEqual([0, 1, 2])
    expect([0, 1, 2].map((b) => mucNham(b, 'thap_hon_mot_bac'))).toEqual([0, 0, 1])
    expect([0, 1, 2].map((b) => mucNham(b, 'cao_hon_mot_bac'))).toEqual([1, 2, 2])
    for (const b of [-3, 0, 1, 2, 7]) for (const k of ['dung_bac', 'thap_hon_mot_bac', 'cao_hon_mot_bac'] as const) expect(mucNham(b, k)).toBeLessThanOrEqual(Math.min(2, Math.max(0, b) + 1))
  })
  const uv = (dang: string, muc: 0 | 1 | 2, n: number): UngVien[] => Array.from({ length: n }, (_, i) => ({ qid: `${dang}-${muc}-${i}`, dang, muc }))
  const chon = (o: Partial<Parameters<typeof chonCauThuThach>[0]> = {}) =>
    chonCauThuThach({ sbd: 'S1', ngay: '2026-09-21', dang: ['D1'], soCau: 4, mucNhamTheoDang: new Map([['D1', 1], ['D2', 1]]), ungVien: [...uv('D1', 0, 5), ...uv('D1', 1, 5), ...uv('D1', 2, 5), ...uv('D2', 1, 5)], loaiTru: new Set(), ...o })
  it('chonCauThuThach: ưu tiên ĐÚNG mức nhắm, không câu CAO hơn mức nhắm; thiếu thì lấy mức thấp hơn; tất định; không trùng; loại trừ được tôn trọng', () => {
    const a = chon()
    expect(a.qid).toHaveLength(4)
    expect(a.qid.every((q) => q.startsWith('D1-1-'))).toBe(true)
    expect(chon().qid).toEqual(a.qid) // tất định
    expect(chon({ ngay: '2026-09-22' }).qid).not.toEqual(a.qid) // đổi ngày ⇒ xáo khác
    expect(chon({ sbd: 'S2' }).qid).not.toEqual(a.qid)
    const thieuMucNham = chon({ soCau: 7 }) // chỉ có 5 câu mức hiểu ⇒ 5 hiểu + 2 biết, KHÔNG có vận dụng
    expect(thieuMucNham.qid.filter((q) => q.startsWith('D1-1-'))).toHaveLength(5)
    expect(thieuMucNham.qid.filter((q) => q.startsWith('D1-0-'))).toHaveLength(2)
    expect(thieuMucNham.qid.some((q) => q.startsWith('D1-2-'))).toBe(false)
    expect(new Set(thieuMucNham.qid).size).toBe(7)
    const loai = chon({ loaiTru: new Set(a.qid) })
    expect(loai.qid.some((q) => a.qid.includes(q))).toBe(false)
  })
  it('chonCauThuThach: chia đều hai dạng (dạng đầu nhận phần dư), xen kẽ; dạng thiếu ⇒ nhường dạng kia; hết câu ⇒ trả ít + thieu; 0 câu ⇒ rỗng', () => {
    const hai = chon({ dang: ['D1', 'D2'], soCau: 5 })
    expect(hai.qid.filter((q) => q.startsWith('D1')).length).toBe(3)
    expect(hai.qid.filter((q) => q.startsWith('D2')).length).toBe(2)
    expect(hai.qid.map((q) => q.slice(0, 2))).toEqual(['D1', 'D2', 'D1', 'D2', 'D1']) // xen kẽ
    const nhuong = chon({ dang: ['D1', 'D2'], soCau: 8, ungVien: [...uv('D1', 1, 2), ...uv('D2', 1, 9)] })
    expect(nhuong.qid.filter((q) => q.startsWith('D1'))).toHaveLength(2)
    expect(nhuong.qid.filter((q) => q.startsWith('D2'))).toHaveLength(6)
    expect(nhuong.thieu).toBe(0)
    const it = chon({ soCau: 8, ungVien: uv('D1', 1, 3) })
    expect(it).toMatchObject({ thieu: 5 })
    expect(it.qid).toHaveLength(3)
    expect(chon({ ungVien: [] })).toEqual({ qid: [], thieu: 4 })
  })
})

describe('/hs/thu-thach-hom-nay — điều kiện có thẻ', () => {
  it('cần token học sinh: không token / token sai ⇒ từ chối bằng lời, KHÔNG có câu/đáp án, KHÔNG ghi', async () => {
    const d = truong()
    for (const r of [await thu(d, null), await thu(d, 'token-sai')]) {
      expect(r.ok).toBe(false)
      expect(JSON.stringify(r)).not.toContain(LOI_GIAI)
    }
    expect(d.sql.prepare('SELECT COUNT(*) AS n FROM thu_thach_rieng').get()).toEqual({ n: 0 })
  })
  it('em KHÔNG có thử thách (chưa áp / chưa có điều chỉnh / đã huỷ / ngày khác / cờ tắt / sai khuôn) ⇒ {ok:true, co:false} và không dòng nào được ghi', async () => {
    const dem = (d: D1That): number => { try { return (d.sql.prepare('SELECT COUNT(*) AS n FROM thu_thach_rieng').get() as { n: number }).n } catch { return 0 } } // bảng có thể vắng (chưa migration)
    const chay = async (sua: (d: D1That) => void) => { const d = truong(); sua(d); const r = await thu(d); expect(dem(d)).toBe(0); return r }
    expect(await chay((d) => d.sql.exec('DELETE FROM ai_dieu_chinh'))).toEqual({ ok: true, co: false, serverNow: expect.anything() })
    expect(await chay((d) => themDieuChinh(d, 'S1', { ap: 0 }))).toMatchObject({ co: false }) // chế độ bóng / tin cậy thấp: chỉ ghi sổ
    expect(await chay((d) => themDieuChinh(d, 'S1', { huy: 1 }))).toMatchObject({ co: false })
    expect(await chay((d) => { d.sql.exec('DELETE FROM ai_dieu_chinh'); themDieuChinh(d, 'S1', { ngay: '2020-01-01' }) })).toMatchObject({ co: false }) // chỉ có điều chỉnh của NGÀY KHÁC
    expect(await chay((d) => d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bo_nao','{\"bat\":true,\"cheDo\":\"that\",\"lopThat\":[],\"thuThach\":false}','x')").run())).toMatchObject({ co: false })
    expect(await chay((d) => themDieuChinh(d, 'S1', { thuThach: { dang: ['D1'], soCau: 2, bac: 'dung_bac' } }))).toMatchObject({ co: false })
    expect(await chay((d) => d.sql.exec('DROP TABLE thu_thach_rieng'))).toMatchObject({ ok: true, co: false }) // chưa chạy migration ⇒ thẻ ẩn, không lỗi
  })
  it('cờ thuThach vắng hoặc true ⇒ có thẻ (mặc định BẬT)', async () => {
    const d = truong()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bo_nao','{\"bat\":true,\"cheDo\":\"that\"}','x')").run()
    expect((await thu(d)).co).toBe(true)
  })
})

describe('/hs/thu-thach-hom-nay — chọn câu', () => {
  it('có thẻ: đúng 6 câu, đủ trường hợp đồng; KHÔNG đáp án / lời giải / tự luận; câu ĐÚNG bậc hiểu (thiếu thì biết), không vận dụng; tên dạng; lời mời nguyên văn', async () => {
    const d = truong()
    const r = await thu(d)
    expect(r).toMatchObject({ ok: true, co: true, ngay: HOM_NAY(), loiMoi: LOI_MOI, soCau: 6, bac: 'dung_bac', trangThai: 'chua_lam', soDaLam: 0, dang: [{ ma: 'D1', ten: 'Dạng thử' }], daNop: [] })
    const q = qidCua(r as never)
    expect(q).toHaveLength(6)
    expect(new Set(q).size).toBe(6)
    expect(q.filter((x) => mucCua(x) === 1)).toHaveLength(4) // 4 câu hiểu có sẵn (mức nhắm), phần còn lại lấy mức biết
    expect(q.filter((x) => mucCua(x) === 0)).toHaveLength(2)
    expect(q.some((x) => mucCua(x) === 2)).toBe(false)
    expect(q.some((x) => /-T\d$/.test(x))).toBe(false)
    const txt = JSON.stringify(r)
    for (const cam of [LOI_GIAI, 'ANH-LOI-GIAI', '"correct"', '"solution"']) expect(txt).not.toContain(cam)
    expect((r as { cau: { choices: string[] }[] }).cau[0]!.choices).toHaveLength(4)
    expect((r as { thieu?: unknown }).thieu).toBeUndefined()
  })
  it('bậc cao_hon_mot_bac nhắm vận dụng nhưng KHÔNG BAO GIỜ quá bậc hồ sơ + 1; thap_hon_mot_bac nhắm biết', async () => {
    const cao = truong(); themDieuChinh(cao, 'S1', { thuThach: { dang: ['D1'], soCau: 4, bac: 'cao_hon_mot_bac' } })
    expect(qidCua((await thu(cao)) as never).every((x) => mucCua(x) === 2)).toBe(true)
    const thap = truong(); themDieuChinh(thap, 'S1', { thuThach: { dang: ['D1'], soCau: 4, bac: 'thap_hon_mot_bac' } })
    expect(qidCua((await thu(thap)) as never).every((x) => mucCua(x) === 0)).toBe(true)
    const chuaDuTin = truong(); dangHs(chuaDuTin, 'S1', 'D1', 2, 2) // gặp 2 câu < 4: chưa đủ căn cứ ⇒ bậc 0 (như bộ câu bài tập về nhà), cao ⇒ mức hiểu, không vận dụng
    themDieuChinh(chuaDuTin, 'S1', { thuThach: { dang: ['D1'], soCau: 4, bac: 'cao_hon_mot_bac' } })
    expect(qidCua((await thu(chuaDuTin)) as never).every((x) => mucCua(x) <= 1)).toBe(true)
  })
  it('KHÔNG chọn câu em đã làm trong 14 ngày (kể cả ở nguồn khác) và câu nằm trong bài tập về nhà em chưa nộp; câu làm cách 15 ngày thì được', async () => {
    const d = truong()
    const luc = (soNgay: number) => new Date(Date.now() - soNgay * D).toISOString()
    await ghiSuKien(d.env, [
      { nguon: 'on_lai', maNguon: 'x', sbd: 'S1', qid: 'DEX-I-H1', lan: 1, ketQua: 1, luc: luc(14) }, // ĐÚNG 14 ngày: còn trong cửa sổ ⇒ loại
      { nguon: 'btvn', maNguon: 'y', sbd: 'S1', qid: 'DEX-I-H2', lan: 1, ketQua: 0, luc: luc(2) }, // loại
      { nguon: 'on_lai', maNguon: 'z', sbd: 'S1', qid: 'DEX-I-H3', lan: 1, ketQua: 1, luc: luc(15) }, // 15 ngày: đủ xa ⇒ được
    ])
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,giao_luc,han_nop,so_cau,da_xoa,cap_nhat_luc) VALUES('B1','Riêng','DEX','x','2999-01-01T00:00:00.000Z',10,0,'x')").run()
    d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten,so_cau) VALUES('B1|S1','B1','S1','Em',10)").run()
    d.sql.prepare("INSERT INTO btvn_em_cau(ma_btvn,sbd,qid,chang,thu_tu,nhan) VALUES('B1','S1','DEX-I-H4',0,1,'loi')").run() // trong bộ đang chạy: loại
    const q = qidCua((await thu(d)) as never)
    for (const cam of ['DEX-I-H1', 'DEX-I-H2', 'DEX-I-H4']) expect(q, cam).not.toContain(cam)
    expect(q).toContain('DEX-I-H3')
    d.sql.prepare("UPDATE btvn_em SET nop_luc = 'x'").run() // bài đã nộp ⇒ hết loại
    const d2 = truong(); d2.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,giao_luc,han_nop,so_cau,da_xoa,cap_nhat_luc) VALUES('B1','Riêng','DEX','x','2999-01-01T00:00:00.000Z',10,0,'x')").run()
    d2.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten,so_cau,nop_luc) VALUES('B1|S1','B1','S1','Em',10,'x')").run()
    d2.sql.prepare("INSERT INTO btvn_em_cau(ma_btvn,sbd,qid,chang,thu_tu,nhan) VALUES('B1','S1','DEX-I-H4',0,1,'loi')").run()
    expect(qidCua((await thu(d2)) as never)).toContain('DEX-I-H4')
  })
  it('CHỐT một lần/ngày: gọi lại (kể cả khi kho/hồ sơ đổi) trả ĐÚNG các câu cũ; lưu một dòng đủ trường; em khác không thấy thẻ của em', async () => {
    const d = truong()
    const a = await thu(d)
    d.sql.prepare("DELETE FROM game_v2_question WHERE qid = ?").run(qidCua(a as never)[0])
    d.sql.exec("UPDATE nam_kt_dang SET bac = 2")
    const b = await thu(d)
    expect(qidCua(b as never)).toEqual(qidCua(a as never).slice(1)) // câu đã xoá khỏi kho thì không phục vụ được nhưng các câu còn lại VẪN là các câu đã chốt (không chọn lại câu khác)
    const hang = d.sql.prepare('SELECT * FROM thu_thach_rieng').all() as Record<string, unknown>[]
    expect(hang).toHaveLength(1)
    expect(hang[0]).toMatchObject({ sbd: 'S1', ngay: HOM_NAY(), bac: 'dung_bac', so_cau: 6, so_cau_muon: 6, loi_moi: LOI_MOI })
    expect(JSON.parse(String(hang[0]!.qid_json))).toEqual(qidCua(a as never))
    expect(JSON.parse(String(hang[0]!.dang_json))).toEqual(['D1'])
    expect((await thu(d, 'token-S2')).co).toBe(false)
  })
  it('thiếu câu ⇒ trả ÍT hơn + thieu (soCau, lyDo); 0 câu ⇒ co:false và KHÔNG chốt (chốt được khi có câu)', async () => {
    const d = truong(); themDieuChinh(d, 'S1', { thuThach: { dang: ['D2'], soCau: 5, bac: 'dung_bac' } })
    dangHs(d, 'S1', 'D2', 8, 1)
    const r = await thu(d)
    expect(r).toMatchObject({ co: true, soCau: 2, thieu: { soCau: 3, lyDo: 'Dạng này còn ít câu em chưa làm gần đây.' } })
    const rong = truong(); themDieuChinh(rong, 'S1', { thuThach: { dang: ['D_KHONG_CO'], soCau: 4, bac: 'dung_bac' } })
    expect(await thu(rong)).toMatchObject({ ok: true, co: false })
    expect(rong.sql.prepare('SELECT COUNT(*) AS n FROM thu_thach_rieng').get()).toEqual({ n: 0 })
  })
  it('đề THI ĐANG BẢO VỆ: câu thuộc đề đang thi không bao giờ được chọn; không kiểm được đề bảo vệ ⇒ ĐÓNG CỬA (không thẻ)', async () => {
    const d = truong()
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CAP','Ca','mo',?,?,45,'thi','khong','key/CAP.json','x')")
      .run(new Date(Date.now() + 24 * H).toISOString(), new Date(Date.now() + 30 * H).toISOString())
    await d.env.DE.put('key/CAP.json', JSON.stringify({ phanI: [{ id: 'DEX-I-H1', text: 'x', choices: ['A. a', 'B. b', 'C. c', 'D. d'], correct: 'B', dang: { ma: 'D1' }, mucDo: 'hieu', kienThuc: ['k1'] }] }))
    const co = (await thu(d)) as { soCau: number; cau: { qid: string }[] }
    expect(qidCua(co as never)).not.toContain('DEX-I-H1')
    expect(JSON.parse((d.sql.prepare('SELECT qid_json FROM thu_thach_rieng').get() as { qid_json: string }).qid_json)).not.toContain('DEX-I-H1') // không lọt vào CẢ hàng đã chốt (không chỉ ở phần trả về)
    expect(co.soCau).toBe(6)
    const hong = truong()
    hong.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CAP','Ca','mo',?,?,45,'thi','khong','key/HONG.json','x')")
      .run(new Date(Date.now() + 24 * H).toISOString(), new Date(Date.now() + 30 * H).toISOString())
    expect(await thu(hong)).toMatchObject({ ok: true, co: false })
    expect(hong.sql.prepare('SELECT COUNT(*) AS n FROM thu_thach_rieng').get()).toEqual({ n: 0 }) // đóng cửa từ bước CHỌN: không chốt gì
  })
  it('thua cuộc đua: một yêu cầu khác chốt trước lúc ta ghi ⇒ dùng ĐÚNG hàng đã chốt (INSERT OR IGNORE), không ghi đè', async () => {
    const d = truong()
    const goc = d.env.DB.prepare.bind(d.env.DB)
    let chen = false
    d.env.DB.prepare = ((q: string) => {
      if (!chen && /^INSERT OR IGNORE INTO thu_thach_rieng/.test(q.trim())) {
        chen = true
        d.sql.prepare("INSERT INTO thu_thach_rieng(sbd,ngay,dang_json,bac,so_cau,so_cau_muon,qid_json,loi_moi,tao_luc) VALUES('S1',?,'[\"D1\"]','dung_bac',1,6,'[\"DEX-I-B1\"]','lời của người chốt trước','x')").run(HOM_NAY())
      }
      return goc(q)
    }) as typeof d.env.DB.prepare
    const r = (await thu(d)) as { soCau: number; loiMoi: string; cau: { qid: string }[]; thieu?: { soCau: number } }
    expect(chen).toBe(true)
    expect(r).toMatchObject({ soCau: 1, loiMoi: 'lời của người chốt trước', thieu: { soCau: 5 } })
    expect(r.cau.map((c) => c.qid)).toEqual(['DEX-I-B1'])
    expect(d.sql.prepare('SELECT COUNT(*) AS n FROM thu_thach_rieng').get()).toEqual({ n: 1 })
  })
  it('câu chọn xong CHƯA được lấy nội dung qua /hs/cau-theo-qid (không mở đường dò kho): chưa gặp ⇒ khongCo', async () => {
    const d = truong()
    const q = qidCua((await thu(d)) as never)
    const r = await goi(d, '/hs/cau-theo-qid', { qid: q })
    expect(r).toMatchObject({ ok: true, cau: [] })
  })
})

describe('/hs/thu-thach-hom-nay — số thật thần thú', () => {
  it('thanThu: tên LOÀI (không nickname), cấp, EXP còn thiếu = thanhExp(cấp) − exp, mảnh khiên = manh mod 36 / 36 (thầy lệnh 21/09; fixture 15 mảnh), chuỗi ngày đạt; loài lạ / chưa chọn ⇒ vắng', async () => {
    const d = truong()
    const kh = (ngay: string, kq: string | null, nghi = 0) => d.sql.prepare("INSERT INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,ket_qua,so_cau_da_lam,so_cau_len_bac,so_cau_tut_bac,la_ngay_nghi,so_su_kien,cap_nhat_luc) VALUES(?,'S1',?,1,'s','{}','{}','[]',?,0,0,0,?,0,'x')").run(`S1|${ngay}`, ngay, kq, nghi)
    const homNay = HOM_NAY()
    const lui = (n: number) => new Date(Date.parse(`${homNay}T00:00:00Z`) - n * D).toISOString().slice(0, 10)
    kh(homNay, null); kh(lui(1), 'dat'); kh(lui(2), 'dat'); kh(lui(3), null, 1); kh(lui(4), 'dat'); kh(lui(5), 'mot_phan'); kh(lui(6), 'dat') // hôm nay chưa xong (bỏ qua), 1+2 đạt, nghỉ bỏ qua, 4 đạt ⇒ 3, đứt ở "mot_phan"
    const r = (await thu(d)) as { thanThu?: Record<string, unknown> }
    expect(r.thanThu).toEqual({ ten: 'Viêm Sư', cap: 6, expConThieu: thanhExp(6) - 50, manhKhien: 15, manhKhienTong: 21, chuoiNgay: 3 })
    expect(JSON.stringify(r.thanThu)).not.toContain('Biệt danh')
    const chuaChon = truong(); hoSoGame(chuaChon, 'S1', { choice: true })
    expect((await thu(chuaChon)) as never).not.toHaveProperty('thanThu')
    const la = truong(); hoSoGame(la, 'S1', { pet: 'thu_la_hoac' })
    expect((await thu(la)) as never).not.toHaveProperty('thanThu')
    const khongHoSo = truong(); khongHoSo.sql.exec('DELETE FROM game_v2_profile')
    expect(((await thu(khongHoSo)) as never as { co: boolean }).co).toBe(true) // vẫn có thẻ, chỉ không có số thú
    expect((await thu(khongHoSo)) as never).not.toHaveProperty('thanThu')
  })
  it('docThanThuSoThat theo lô: đúng từng em; em lớn cấp / EXP vượt ⇒ expConThieu ≥ 0; mảnh 36 ⇒ 0/36 (đủ một khiên), mảnh 12 ⇒ 12/36', async () => {
    const d = truong()
    hoSoGame(d, 'S2', { pet: 'nuoc_long', cap: 120, exp: 5, manh: 36 })
    const m = await docThanThuSoThat(d.env, ['S1', 'S2', 'S3'])
    expect([...m.keys()].sort()).toEqual(['S1', 'S2'])
    expect(m.get('S2')).toMatchObject({ ten: 'Thuỷ Long', cap: 120, expConThieu: 0, manhKhien: 36, manhKhienTong: 21 })
    hoSoGame(d, 'S2', { pet: 'nuoc_long', cap: 6, exp: 99999, manh: 12 })
    expect((await docThanThuSoThat(d.env, ['S2'])).get('S2')).toMatchObject({ manhKhien: 12, manhKhienTong: 21 }) // mảnh cũ 12 không còn đủ một khiên
    expect((await docThanThuSoThat(d.env, ['S2'])).get('S2')!.expConThieu).toBe(0)
    expect((await docThanThuSoThat(d.env, [])).size).toBe(0)
  })
})

describe('/hs/thu-thach-hom-nay/nop', () => {
  const dapAn = (qid: string, dung: boolean) => ({ qid, dapAn: dung ? 'B' : 'C', giay: 20 })
  it('CHỈ nhận câu đã chốt cho em: qid ngoài thẻ ⇒ khongCo, không ghi; chưa trả lời ⇒ chuaLam, không ghi, không đáp án', async () => {
    const d = truong()
    const q = qidCua((await thu(d)) as never)
    const ngoai = 'DEX-I-V1'
    const r = await nop(d, [dapAn(ngoai, true), { qid: q[0], dapAn: '', giay: 20 }])
    expect(r).toMatchObject({ ok: true, ketQua: [], khongCo: [ngoai], chuaLam: [q[0]] })
    expect(JSON.stringify(r)).not.toContain(LOI_GIAI)
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM su_kien_hoc WHERE nguon = 'thu_thach_rieng'").get()).toEqual({ n: 0 })
    const tron = await nop(d, [dapAn(ngoai, true), dapAn(q[0]!, true)]) // vừa qid ngoài thẻ vừa câu đã trả lời: qid ngoài vẫn báo khongCo, câu đúng được chấm
    expect(tron).toMatchObject({ ok: true, khongCo: [ngoai] })
    expect((tron.ketQua as { qid: string }[]).map((x) => x.qid)).toEqual([q[0]])
    expect(d.sql.prepare("SELECT qid FROM su_kien_hoc WHERE nguon = 'thu_thach_rieng'").all()).toEqual([{ qid: q[0] }]) // chỉ câu đã chốt được ghi sổ
  })
  it('chấm ở máy chủ, GHI SỔ nguon thu_thach_rieng / ma_nguon thu_thach:<ngày>, rồi MỚI trả đáp án + lời giải; câu sai vào hồ sơ (moi_sai); exp trả về; trạng thái dang_lam → xong', async () => {
    const d = truong()
    const q = qidCua((await thu(d)) as never)
    const r1 = await nop(d, [dapAn(q[0]!, true), dapAn(q[1]!, false)])
    expect(r1).toMatchObject({ ok: true, trangThai: 'dang_lam', soDaLam: 2 })
    expect((r1.ketQua as { qid: string; dung: boolean; dapAnDung: string; loiGiai: string }[]).map((x) => [x.qid, x.dung, x.dapAnDung, x.loiGiai])).toEqual([[q[0], true, 'B', LOI_GIAI], [q[1], false, 'B', LOI_GIAI]])
    const so = d.sql.prepare("SELECT qid, nguon, ma_nguon, ket_qua, lan FROM su_kien_hoc WHERE nguon = 'thu_thach_rieng' ORDER BY qid").all() as Record<string, unknown>[]
    expect(so).toHaveLength(2)
    expect(so[0]).toMatchObject({ nguon: 'thu_thach_rieng', ma_nguon: `thu_thach:${HOM_NAY()}`, lan: 1 })
    expect((d.sql.prepare("SELECT trang_thai FROM nam_kt_cau WHERE sbd = 'S1' AND qid = ?").get(q[1]) as { trang_thai: string }).trang_thai).toBe('moi_sai') // câu sai vào lịch ôn
    expect(typeof r1.exp).toBe('number')
    const giua = (await thu(d)) as { trangThai: string; soDaLam: number; cau: { qid: string }[]; daNop: { qid: string; dung: boolean }[] }
    expect(giua).toMatchObject({ trangThai: 'dang_lam', soDaLam: 2, daNop: [{ qid: q[0], dung: true }, { qid: q[1], dung: false }] })
    expect(giua.cau.map((c) => c.qid)).toEqual(q.slice(2)) // không lặp lại câu đã nộp
    const r5 = await nop(d, [dapAn(q[2]!, true), dapAn(q[3]!, true), dapAn(q[4]!, true)])
    expect(r5).toMatchObject({ trangThai: 'dang_lam', soDaLam: 5 }) // còn 1 câu ⇒ CHƯA xong
    expect(await thu(d)).toMatchObject({ trangThai: 'dang_lam', soDaLam: 5, soCau: 6 })
    const r2 = await nop(d, [dapAn(q[5]!, true)])
    expect(r2).toMatchObject({ trangThai: 'xong', soDaLam: 6 })
    expect(await thu(d)).toMatchObject({ trangThai: 'xong', soDaLam: 6, cau: [] })
  })
  it('nộp lại cùng câu KHÔNG đổi kết quả lần đầu (đã thấy lời giải thì không sửa được đáp án)', async () => {
    const d = truong()
    const q = qidCua((await thu(d)) as never)
    await nop(d, [dapAn(q[0]!, false)])
    const lai = await nop(d, [dapAn(q[0]!, true)])
    expect((lai.ketQua as { dung: boolean }[])[0]!.dung).toBe(false)
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM su_kien_hoc WHERE nguon = 'thu_thach_rieng'").get()).toEqual({ n: 1 })
  })
  it('cần token; em khác (token S2) không nộp được câu của S1; chưa có thử thách hôm nay ⇒ khongCo hết', async () => {
    const d = truong()
    const q = qidCua((await thu(d)) as never)
    expect((await nop(d, [dapAn(q[0]!, true)], null)).ok).toBe(false)
    expect(await nop(d, [dapAn(q[0]!, true)], 'token-S2')).toMatchObject({ ok: true, ketQua: [], khongCo: [q[0]] })
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM su_kien_hoc WHERE nguon = 'thu_thach_rieng'").get()).toEqual({ n: 0 })
  })
  it('đường ÔN LẠI cũ không đổi: /hs/on-lai/nop vẫn ghi nguon on_lai và KHÔNG nhận câu thử thách chưa gặp', async () => {
    const d = truong()
    const q = qidCua((await thu(d)) as never)
    const r = await goi(d, '/hs/on-lai/nop', { traLoi: [dapAn(q[0]!, true)] })
    expect(r).toMatchObject({ ok: true, ketQua: [] })
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM su_kien_hoc WHERE nguon = 'on_lai'").get()).toEqual({ n: 0 })
  })
})

describe('thẻ /ai/ho-so-ngay có SỐ THẬT thần thú (ẩn danh)', () => {
  it('boNaoHoSoNgay nhận phần phụ thanThu: thẻ và hồ sơ đã lưu đều có khối thanThu; em không có thú ⇒ không có khoá; không tên em/nickname', async () => {
    const d = truong()
    d.sql.prepare("INSERT INTO ai_ban_tin(ngay,json,nop_luc) VALUES('2000-01-01','{}','x')").run()
    await ghiSuKien(d.env, [1, 2, 3].map((i) => ({ nguon: 'on_lai' as const, maNguon: 'x', sbd: 'S1', qid: `Q${i}`, lan: 1, ketQua: 1 as const, luc: new Date(Date.now() - 6 * H).toISOString(), maDang: 'D1' })))
    await ghiSuKien(d.env, [{ nguon: 'on_lai' as const, maNguon: 'x', sbd: 'S2', qid: 'Q9', lan: 1, ketQua: 1 as const, luc: new Date(Date.now() - 6 * H).toISOString(), maDang: 'D1' }])
    const r = (await boNaoHoSoNgay(d.env, { ngay: HOM_NAY(), coTrang: 60 }, Date.now(), { thanThu: (ds) => docThanThuSoThat(d.env, ds) })) as { ok: boolean; cacEm: { sbd: string; the?: Record<string, unknown> }[] }
    expect(r.ok).toBe(true)
    const s1 = r.cacEm.find((x) => x.sbd === 'S1')!
    const s2 = r.cacEm.find((x) => x.sbd === 'S2')!
    expect(s1.the!.thanThu).toEqual({ ten: 'Viêm Sư', cap: 6, expConThieu: thanhExp(6) - 50, manhKhien: 15, manhKhienTong: 21, chuoiNgay: 0 })
    expect(s2.the).not.toHaveProperty('thanThu')
    expect(JSON.stringify(r)).not.toMatch(/Biệt danh|Em Một|Em Hai/)
    const luu = JSON.parse((d.sql.prepare("SELECT the_json FROM ai_ho_so_ngay WHERE sbd = 'S1'").get() as { the_json: string }).the_json)
    expect(luu.thanThu.ten).toBe('Viêm Sư') // lưu cùng thẻ ⇒ lúc nộp kiểm lại đúng số này
    // không truyền phần phụ ⇒ Y HỆT bản cũ (không khoá thanThu)
    const cu = (await boNaoHoSoNgay(d.env, { ngay: HOM_NAY(), coTrang: 60 })) as { cacEm: { sbd: string; the?: Record<string, unknown> }[] }
    expect(cu.cacEm.find((x) => x.sbd === 'S1')!.the).not.toHaveProperty('thanThu')
  })
})

describe('mayDaLam của bảng tin: "N em nhận thử thách riêng · M em đã làm"', () => {
  it('chỉ có dòng khi N > 0; N = em có thử thách ĐÃ ÁP hôm nay (sai khuôn / chưa áp không tính); M = em đã nộp ≥ 1 câu', async () => {
    const d = truong()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S3','Em Ba','12','x')").run()
    themDieuChinh(d, 'S2'); themDieuChinh(d, 'S3', { ap: 0 })
    const bt = async () => ((await goiWorker(worker, d.env, '/gv/bang-tin', {}, true)).mayDaLam as { loai: string; so: number; soDaLam: number; chu: string }[]).find((x) => x.loai === 'thu_thach_rieng')
    expect(await bt()).toEqual({ loai: 'thu_thach_rieng', so: 2, soDaLam: 0, chu: '2 em nhận thử thách riêng · 0 em đã làm' })
    const q = qidCua((await thu(d)) as never)
    await nop(d, [{ qid: q[0], dapAn: 'B', giay: 20 }, { qid: q[1], dapAn: 'B', giay: 20 }])
    expect(await bt()).toMatchObject({ so: 2, soDaLam: 1, chu: '2 em nhận thử thách riêng · 1 em đã làm' })
    const trong = taoD1That()
    expect(((await goiWorker(worker, trong.env, '/gv/bang-tin', {}, true)).mayDaLam as { loai: string }[]).some((x) => x.loai === 'thu_thach_rieng')).toBe(false)
  })
})

describe('bảng + migration + reset', () => {
  it('migration chỉ THÊM bảng và chỉ mục; đủ cột; reset toàn app GIỮ bảng; nguồn sổ mới nằm trong danh sách nguồn EXP', async () => {
    const { readFileSync } = await import('node:fs')
    const m = readFileSync('server/migration-2109-thu-thach-rieng.sql', 'utf-8').replace(/^--.*$/gm, '')
    expect(m).not.toMatch(/\b(DROP|ALTER|UPDATE|DELETE|INSERT)\b/i)
    const d = taoD1That()
    expect((d.sql.prepare('PRAGMA table_info(thu_thach_rieng)').all() as { name: string }[]).map((c) => c.name)).toEqual(['sbd', 'ngay', 'dang_json', 'bac', 'so_cau', 'so_cau_muon', 'qid_json', 'loi_moi', 'tao_luc'])
    const { BANG_GIU, BANG_XOA } = await import('../server/src/reset-toan-app')
    expect(BANG_GIU).toContain('thu_thach_rieng')
    expect(BANG_XOA).not.toContain('thu_thach_rieng')
    expect((await import('../server/src/exp-hoc-tap')).NGUON_EXP_CAU).toContain('thu_thach_rieng')
    expect((await import('../server/src/su-kien-hoc')).CAC_NGUON).toContain('thu_thach_rieng')
  })
})

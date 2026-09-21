// @vitest-environment node
// BTVN "NÂNG ĐỠ" — thầy CHO LÀM LẠI (/btvn/cho-lam-lai): chép lịch sử, so_lan_lam + 1, xoá nộp/đáp án/điểm, lo_da_xong = 0, GIỮ bộ câu + hạn;
// quá hạn/chưa nộp/bài thường bị từ chối; sổ ghi lan mới; EXP không cộng đôi trong ngày. Cộng: /btvn/xem-truoc (a) trả boQuaQid + thieuMeta.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, type D1That } from './_d1-that'
import { BAY_GIO, DAP_AN_DUNG, HAN, boCuaEm, cauThay, dung, giao, gio, maBtvn, mo, nopChang } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())

const choLamLai = (d: D1That, sbd = 'S1', thay = true) => goiWorker(worker, d.env, '/btvn/cho-lam-lai', { maBtvn: maBtvn(d), sbd }, thay)
const em = (d: D1That) => d.sql.prepare("SELECT * FROM btvn_em WHERE sbd = 'S1'").get() as Record<string, unknown>

/** Đi hết mọi chặng (qua các ngày) rồi tự nộp; `dapAn(qid)` quyết đúng/sai. Trả kết quả chặng cuối. */
async function lamHet(d: D1That, dapAn: (q: string) => string, ngayBatDau = BAY_GIO.getTime(), buocMs = 3_600_000 * 24) {
  let cuoi: Record<string, any> = {}
  const soChang = Math.max(...boCuaEm(d).map((x) => x.chang)) + 1
  for (let k = 0; k < soChang; k++) {
    gio(new Date(ngayBatDau + k * buocMs)) // mặc định mỗi chặng một ngày (chặng k mở 00:00 giờ VN ngày thứ k kể từ ngày chốt)
    const qs = boCuaEm(d).filter((x) => x.chang === k).map((x) => x.qid)
    cuoi = await nopChang(d, k, Object.fromEntries(qs.map((q) => [q, dapAn(q)])))
  }
  return cuoi
}

describe('/btvn/cho-lam-lai', () => {
  it('bài đã nộp, còn hạn: chép lịch sử, so_lan_lam 2, xoá nộp/đáp án/điểm/lo_da_xong, GIỮ bộ câu + chot_luc + hạn; /btvn/cua-em báo lượt mới', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    const m0 = await mo(d)
    const cuoi = await lamHet(d, (q) => (q.endsWith('-I-1') ? 'B' : DAP_AN_DUNG(q)), BAY_GIO.getTime())
    expect(cuoi.nop).toMatchObject({ daNop: true })
    const truoc = em(d)
    const bo = boCuaEm(d)
    const han = (d.sql.prepare('SELECT han_nop FROM btvn').get() as { han_nop: string }).han_nop
    gio(new Date(BAY_GIO.getTime() + 2 * 24 * 3_600_000))
    const r = await choLamLai(d)
    expect(r).toMatchObject({ ok: true, soLanLam: 2 })
    expect(em(d)).toMatchObject({ nop_luc: null, so_dung: null, so_cau: null, dap_an_json: null, so_lan_lam: 2, lo_da_xong: 0, xong_vong1_luc: null, chot_luc: truoc.chot_luc, so_cau_em: truoc.so_cau_em, so_chang: truoc.so_chang })
    expect(boCuaEm(d)).toEqual(bo) // GIỮ bộ câu
    expect((d.sql.prepare('SELECT han_nop FROM btvn').get() as { han_nop: string }).han_nop).toBe(han) // GIỮ hạn nộp
    const ls = d.sql.prepare("SELECT hanh_dong, du_lieu FROM btvn_em_lich_su WHERE khoa = ?").all(`${maBtvn(d)}|S1`) as { hanh_dong: string; du_lieu: string }[]
    expect(ls.length).toBe(1)
    expect(ls[0]!.hanh_dong).toBe('cho-lam-lai')
    expect(JSON.parse(ls[0]!.du_lieu)).toMatchObject({ nop_luc: truoc.nop_luc, so_dung: truoc.so_dung, so_cau: truoc.so_cau, so_lan_lam: truoc.so_lan_lam })
    // Máy em: lượt mới, bắt đầu lại từ chặng 1, cùng bộ, chưa nộp, không đáp án.
    const m = await mo(d)
    expect(m).toMatchObject({ ok: true, soLanLam: 2, daNop: false, loDaXong: 0, changDangMo: 0, soCauCuaEm: m0.soCauCuaEm, soChang: m0.soChang, duocLamLai: false })
    expect(m.de.cau.map((c: { qid: string }) => c.qid)).toEqual(bo.filter((x) => x.chang === 0).map((x) => x.qid))
    expect(JSON.stringify(m)).not.toContain('dap_an')
    expect((await goiWorker(worker, d.env, '/hs/btvn', { sbd: 'S1' })).items[0]).toMatchObject({ soLanLam: 2, daNop: false, soDung: null })
  })

  it('lượt mới chấm bằng đáp án MỚI (không bị khoá bởi lượt cũ), sổ ghi lan MỚI, tự nộp giữ so_lan_lam = 2; điểm mới thay điểm cũ', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    const sai = (q: string) => (q.endsWith('-I-1') || q.endsWith('-I-2') ? 'B' : DAP_AN_DUNG(q))
    await lamHet(d, sai)
    const tong = boCuaEm(d).length
    const soChang = Math.max(...boCuaEm(d).map((x) => x.chang)) + 1
    const diemCu = em(d).so_dung as number
    expect(diemCu).toBeLessThan(tong) // lượt 1 có câu sai (nếu bộ có I-1/I-2)
    const soSoLuot1 = d.dem('su_kien_hoc', "nguon = 'btvn_lo'")
    expect(soSoLuot1).toBe(tong)

    gio(new Date(BAY_GIO.getTime() + 8 * 24 * 3_600_000 - 24 * 3_600_000)) // trước hạn 1 ngày
    d.sql.prepare('UPDATE btvn SET han_nop = ?').run(new Date(BAY_GIO.getTime() + 30 * 24 * 3_600_000).toISOString()) // thầy đã gia hạn bằng lệnh sẵn có
    expect(await choLamLai(d)).toMatchObject({ ok: true, soLanLam: 2 })
    const cuoi = await lamHet(d, (q) => DAP_AN_DUNG(q), BAY_GIO.getTime() + 8 * 24 * 3_600_000 - 24 * 3_600_000)
    expect(cuoi.nop).toMatchObject({ daNop: true, soDung: tong, soCau: tong, qidSai: [] })
    expect(em(d)).toMatchObject({ so_lan_lam: 2, so_dung: tong, so_cau: tong })
    // Sổ: lượt 2 có dòng RIÊNG (lan = 1000 + chiSo), lượt 1 vẫn còn nguyên.
    const lan = (d.sql.prepare("SELECT DISTINCT lan FROM su_kien_hoc WHERE nguon = 'btvn_lo' ORDER BY lan").all() as { lan: number }[]).map((x) => x.lan)
    expect(lan).toEqual([...Array.from({ length: soChang }, (_, k) => k), ...Array.from({ length: soChang }, (_, k) => 1000 + k)])
    expect(d.dem('su_kien_hoc', "nguon = 'btvn_lo'")).toBe(2 * tong)
    expect(d.dem('su_kien_hoc', "nguon = 'btvn'")).toBe(0) // tự nộp cuối không ghi đôi câu đã có qua chặng
    const ds = await goiWorker(worker, d.env, '/hs/btvn', { sbd: 'S1' })
    expect(ds.items[0]).toMatchObject({ soLanLam: 2, soDung: tong, soCau: tong, diem: 10 })
  })

  it('EXP KHÔNG cộng đôi khi làm lại trong cùng ngày (khoá idempotent sẵn có): làm hết + cho làm lại + làm hết lần nữa CÙNG NGÀY ⇒ exp_so không thêm dòng nào', async () => {
    gio(BAY_GIO)
    const d = dung()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: '2026-09-01T00:00:00.000Z', dsSbd: ['S1'] }))
    await giao(d)
    await mo(d)
    // Lùi giờ chốt để MỌI chặng đã tới giờ mở ⇒ cả bài làm xong trong MỘT ngày (một lượt gọi liên tiếp, cùng đồng hồ).
    d.sql.prepare("UPDATE btvn_em SET chot_luc = '2026-09-10T03:00:00.000Z' WHERE sbd = 'S1'").run()
    await lamHet(d, (q) => DAP_AN_DUNG(q), BAY_GIO.getTime(), 0)
    expect(em(d).nop_luc).not.toBeNull()
    const truoc = d.sql.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(exp),0) AS tong FROM exp_so WHERE sbd = 'S1'").get() as { n: number; tong: number }
    expect(truoc.n).toBeGreaterThan(0)
    expect(d.dem('exp_so', "loai = 'lo'")).toBeGreaterThan(0)
    expect(d.dem('exp_so', "loai = 'btvn'")).toBe(1)
    expect(await choLamLai(d)).toMatchObject({ ok: true, soLanLam: 2 })
    await lamHet(d, (q) => DAP_AN_DUNG(q), BAY_GIO.getTime(), 0)
    expect(em(d)).toMatchObject({ so_lan_lam: 2 })
    expect(em(d).nop_luc).not.toBeNull()
    const sau = d.sql.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(exp),0) AS tong FROM exp_so WHERE sbd = 'S1'").get() as { n: number; tong: number }
    expect(sau).toEqual(truoc)
  })

  it('CHỈ bài đã nộp và còn hạn: chưa nộp ⇒ chua_nop; quá hạn ⇒ qua_han (nhắc gia hạn); bài thường ⇒ khong_ca_nhan; sai mã/em ⇒ lỗi; bấm lần hai ⇒ chua_nop, lịch sử đúng 1 dòng', async () => {
    gio(BAY_GIO)
    const d = dung(2)
    await giao(d)
    await mo(d)
    expect(await choLamLai(d)).toMatchObject({ ok: false, lyDo: 'chua_nop' })
    await lamHet(d, (q) => DAP_AN_DUNG(q))
    expect(await choLamLai(d, 'S9')).toMatchObject({ ok: false })
    expect(await goiWorker(worker, d.env, '/btvn/cho-lam-lai', { maBtvn: 'KHONG-CO', sbd: 'S1' }, true)).toMatchObject({ ok: false })
    expect(await goiWorker(worker, d.env, '/btvn/cho-lam-lai', { sbd: 'S1' }, true)).toMatchObject({ ok: false })
    // Quá hạn ⇒ từ chối, KHÔNG đổi gì.
    gio('2026-10-05T00:00:00.000Z')
    const truoc = em(d)
    const qh = await choLamLai(d)
    expect(qh).toMatchObject({ ok: false, lyDo: 'qua_han' })
    expect(String(qh.error)).toContain('gia hạn')
    expect(em(d)).toEqual(truoc)
    expect(d.dem('btvn_em_lich_su')).toBe(0)
    // Còn hạn: lần 1 được, lần 2 (em chưa nộp lại) bị từ chối, lịch sử đúng 1 dòng.
    d.sql.prepare('UPDATE btvn SET han_nop = ?').run('2026-11-01T00:00:00.000Z')
    expect(await choLamLai(d)).toMatchObject({ ok: true, soLanLam: 2 })
    expect(await choLamLai(d)).toMatchObject({ ok: false, lyDo: 'chua_nop' })
    expect(d.dem('btvn_em_lich_su')).toBe(1)
    // Em khác cùng bài không bị đụng.
    expect(d.sql.prepare("SELECT so_lan_lam FROM btvn_em WHERE sbd = 'S2'").get()).toMatchObject({ so_lan_lam: 1 })
    // Bài thường (ca_nhan = 0) ⇒ từ chối bằng lời.
    d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cap_nhat_luc) VALUES('CA2','Ca 2','dong','x')")
    d.sql.exec("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,cap_nhat_luc,ho_ten) VALUES('CA2|S1|1','CA2','S1',1,'x','da_nop','x','Em 1')")
    gio(BAY_GIO)
    await goiWorker(worker, d.env, '/btvn/giao', { maCa: 'CA2', maDe: 'DE1', hanNop: HAN }, true)
    const cu = (d.sql.prepare("SELECT ma_btvn FROM btvn WHERE ca_nhan = 0").get() as { ma_btvn: string }).ma_btvn
    expect(await goiWorker(worker, d.env, '/btvn/cho-lam-lai', { maBtvn: cu, sbd: 'S1' }, true)).toMatchObject({ ok: false, lyDo: 'khong_ca_nhan' })
  })

  it('BẤM ĐÚP / hai máy thầy: bên sau đọc bản CŨ của dòng nhưng KHÔNG ghi thêm lịch sử và KHÔNG tăng lượt (da_thay_doi)', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    await lamHet(d, (q) => DAP_AN_DUNG(q))
    gio(new Date(BAY_GIO.getTime() + 3 * 24 * 3_600_000))
    const cu = em(d) // bản mà "bên sau" đã đọc trước khi bên trước kịp ghi
    expect(await choLamLai(d)).toMatchObject({ ok: true, soLanLam: 2 })
    const goc = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = ((q: string) => {
      const st = goc(q)
      if (/^SELECT \* FROM btvn_em WHERE khoa/.test(q)) return { bind: () => ({ first: async () => cu }) } as never
      return st
    }) as typeof d.env.DB.prepare
    expect(await choLamLai(d)).toMatchObject({ ok: false, lyDo: 'da_thay_doi' })
    d.env.DB.prepare = goc as typeof d.env.DB.prepare
    expect(d.dem('btvn_em_lich_su')).toBe(1)
    expect(em(d)).toMatchObject({ so_lan_lam: 2, nop_luc: null })
  })
  it('lệnh của THẦY: không có mã bí mật ⇒ không chạy, không đổi gì', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    await lamHet(d, (q) => DAP_AN_DUNG(q))
    const truoc = em(d)
    const r = await choLamLai(d, 'S1', false)
    expect(r.ok).not.toBe(true)
    expect(em(d)).toEqual(truoc)
  })

  it('làm lại mà bỏ dở rồi mở lại: chặng 0 mở, chặng 1 chỉ mở khi chặng 0 xong (luật chặng không đổi)', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    await lamHet(d, (q) => DAP_AN_DUNG(q))
    gio(new Date(BAY_GIO.getTime() + 10 * 24 * 3_600_000))
    d.sql.prepare('UPDATE btvn SET han_nop = ?').run(new Date(BAY_GIO.getTime() + 40 * 24 * 3_600_000).toISOString())
    await choLamLai(d)
    const m = await mo(d)
    expect(m.chang.map((c: { daMo: boolean }) => c.daMo)).toEqual([true, ...Array(m.soChang - 1).fill(false)])
    expect(await nopChang(d, 1, { x: 'A' })).toMatchObject({ ok: false, lyDo: 'chang_chua_mo' })
  })
})

describe('/btvn/xem-truoc (a) trả boQuaQid + thieuMeta để đối chiếu với máy thầy', () => {
  it('cau[] đủ đúng quy ước ⇒ [] và 0; thiếu 2 câu + 1 qid lạ ⇒ đếm đúng', async () => {
    gio(BAY_GIO)
    const d = dung()
    const chung = { maDe: 'DE1', ghim: [], hanNop: HAN, hatGiong: 'h', dsSbd: ['S1'] }
    const dayDu = await goiWorker(worker, d.env, '/btvn/xem-truoc', { ...chung, cau: cauThay() }, true)
    expect(dayDu).toMatchObject({ ok: true, boQuaQid: [], thieuMeta: 0 })
    const thieu = await goiWorker(worker, d.env, '/btvn/xem-truoc', { ...chung, cau: [...cauThay().slice(2), { qid: 'LA-I-1', dang: 'X', chuyenDe: 'Y', mucDo: 0, sao: 0, phan: 'I' }] }, true)
    expect(thieu).toMatchObject({ ok: true, boQuaQid: ['LA-I-1'], thieuMeta: 2 })
  })
})

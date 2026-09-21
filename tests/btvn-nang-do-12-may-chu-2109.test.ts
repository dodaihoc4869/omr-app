// @vitest-environment node
// BTVN "NÂNG ĐỠ" · BẢN 1.2 phía MÁY CHỦ (prompt-btvn-nang-do.md CẬP NHẬT 3; lõi thuần của Code 1: `thuSucThem`).
// Em yếu: lõi BẮT BUỘC chỉ gồm câu ≤ bậc đích + 1; lõi cao hơn ⇒ nhóm "THỬ SỨC THÊM · không bắt buộc": lưu `btvn_em_cau.chang = -1`, mở CÙNG chặng cuối, nộp CÙNG lượt nộp chặng cuối,
// KHÔNG tính vào xong chặng / xong bài / ngân sách / điểm mẫu; đúng thì cộng (không vượt mẫu), sai/bỏ trống không trừ, không vào sổ (không hẹn ôn); thích nghi không đụng nhóm; bài đã chốt giữ nguyên.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, type D1That } from './_d1-that'
import { BAY_GIO, boCuaEm, cauThay, DAP_AN_DUNG, dung, giao, gio, maBtvn, mo, nopChang, TAT_CA_QID } from './_btvn-nang-do-mau'

// Lõi của Code 1 bọc lại: mặc định đi thẳng qua hàm thật; MỘT test ép lõi trả thay đổi HỢP LỆ để khoá phần NỐI của máy chủ (thích nghi có lưu và không đụng nhóm thử sức thêm).
type KqLoi = { bo: { chang: string[][]; nhan: Record<string, string>; rieng: string[] }; doi: unknown[]; henOnLai: string[] }
const ep = { bien: null as null | ((kq: KqLoi) => KqLoi), soLanGoi: 0 }
vi.mock('../src/lib/btvn-nang-do', async (goc) => {
  const m = await goc<typeof import('../src/lib/btvn-nang-do')>()
  return { ...m, thichNghiChangSau: (...a: Parameters<typeof m.thichNghiChangSau>) => { ep.soLanGoi++; const kq = m.thichNghiChangSau(...a); return ep.bien ? (ep.bien(kq as unknown as KqLoi) as unknown as typeof kq) : kq } }
})
afterEach(() => { vi.useRealTimers(); ep.bien = null; ep.soLanGoi = 0 })

const CAU_THU = 'DE1-III-1' // dạng DA-4 toàn mức Vận dụng ⇒ lõi của DA-4 là câu Vận dụng ⇒ với em yếu là "thử sức thêm"
/** Tờ mẫu (24 câu) nhưng cả dạng DA-4 là Vận dụng. S1 = em không hồ sơ (yếu ⇒ có thử sức thêm); S2 = em bậc 2 ở DA-4 (khá ⇒ mọi lõi là bắt buộc). */
async function baiCoThuSuc() {
  gio(BAY_GIO)
  const d = dung(2)
  d.sql.exec("INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES('S2|DA-4','S2','DA-4',10,1,9,0,0,2,'x')")
  const cau = cauThay().map((c) => (c.dang === 'DA-4' ? { ...c, mucDo: 2 } : c))
  const g = await giao(d, { cau })
  expect(g.ok).toBe(true)
  return d
}
const emRow = (d: D1That, sbd = 'S1') => d.sql.prepare('SELECT * FROM btvn_em WHERE sbd = ?').get(sbd) as Record<string, string | number | null>
/** Đưa em tới chặng CUỐI đang mở: đặt giờ 02:00 UTC 29/09 (trước hạn 03:00, mọi chặng đã tới giờ mở) rồi LÀM ĐÚNG mọi chặng trước. */
async function toiChangCuoi(d: D1That, sbd = 'S1', _tuyChon: { lamChangCuoi?: boolean } = {}) {
  const so = Number(emRow(d, sbd).so_chang)
  gio('2026-09-29T02:00:00.000Z')
  for (let c = 0; c < so - 1; c++) expect((await nopChang(d, c, dapAnDungCua(batBuoc(d, c, sbd)), sbd)).ok).toBe(true)
  return so
}
const thoi = (d: D1That, sbd = 'S1') => (boCuaEm(d, sbd).filter((x) => x.chang < 0))
const batBuoc = (d: D1That, chang: number, sbd = 'S1') => boCuaEm(d, sbd).filter((x) => x.chang === chang).map((x) => x.qid)
const dapAnDungCua = (qids: string[]) => Object.fromEntries(qids.map((q) => [q, DAP_AN_DUNG(q)]))
const dapAnSaiCua = (qids: string[]) => Object.fromEntries(qids.map((q) => [q, /-II-/.test(q) ? 'SDSD' : /-III-/.test(q) ? '99' : 'B']))

describe('CHỐT bộ: nhóm thử sức thêm lưu ngoài chặng (chang = -1)', () => {
  it('em yếu: 1 câu thử sức thêm ở chang = -1, nhãn loi_cao; so_cau_em / so_chang / tomTat CHỈ đếm câu bắt buộc; em khá không có', async () => {
    const d = await baiCoThuSuc()
    expect((await mo(d, 'S1')).ok).toBe(true)
    expect((await mo(d, 'S2')).ok).toBe(true)
    expect(thoi(d, 'S1')).toEqual([{ qid: CAU_THU, chang: -1, nhan: 'loi_cao' }])
    expect(thoi(d, 'S2')).toEqual([])
    const em = emRow(d)
    const tt = JSON.parse(String(em.tom_tat_json))
    expect(tt).toMatchObject({ soThuSucThem: 1, soLoiCao: 1, soLoi: 6 })
    expect(Number(em.so_cau_em)).toBe(tt.tong) // số BẮT BUỘC
    expect(boCuaEm(d).filter((x) => x.chang >= 0).length).toBe(tt.tong)
    expect(boCuaEm(d).some((x) => x.qid === CAU_THU && x.chang >= 0)).toBe(false) // KHÔNG nằm trong chặng nào
    expect(Number(em.so_chang)).toBe(Math.max(...boCuaEm(d).map((x) => x.chang)) + 1)
  })
  it('mở lại không chốt lại: bộ + nhóm thử sức thêm y nguyên', async () => {
    const d = await baiCoThuSuc()
    await mo(d, 'S1')
    const truoc = JSON.stringify(boCuaEm(d))
    await mo(d, 'S1'); await mo(d, 'S1')
    expect(JSON.stringify(boCuaEm(d))).toBe(truoc)
  })
})

describe('MỞ BÀI: thuSucThem là CHẶNG ẢO {chiSo, moLuc, cau[], daNop}', () => {
  it('trước mốc mở chặng cuối: có {chiSo = soChang, moLuc} nhưng cau = [] (không lộ đề sớm); soThuSucThem = 1; soCau/soCauCuaEm/soChang = bắt buộc; không câu thử sức trong de.cau/nhan', async () => {
    const d = await baiCoThuSuc()
    const r = await mo(d, 'S1')
    expect(r).toMatchObject({ ok: true, caNhan: true, soThuSucThem: 1 })
    expect(r.thuSucThem).toEqual({ chiSo: r.soChang, moLuc: expect.any(String), cau: [], daNop: false })
    expect(Date.parse(r.thuSucThem.moLuc)).toBeGreaterThan(Date.now()) // chặng cuối chưa tới giờ mở
    expect(r.soCau).toBe(r.tomTat.soBatBuoc)
    expect(r.soCauCuaEm).toBe(r.soCau)
    expect(r.de.cau.map((c: { qid: string }) => c.qid)).not.toContain(CAU_THU)
    expect(Object.keys(r.nhan)).not.toContain(CAU_THU)
    const kha = await mo(d, 'S2')
    expect(kha.soThuSucThem).toBe(0) // em khá: 0 và KHÔNG có khoá thuSucThem
    expect(kha).not.toHaveProperty('thuSucThem')
  })
  it('tới mốc mở chặng cuối: cau = [câu thử sức ĐÃ BÓC ĐÁP ÁN], moLuc = mốc mở chặng cuối, daNop = false; lời giải/đáp án không xuống máy em', async () => {
    const d = await baiCoThuSuc()
    const truoc = await mo(d, 'S1')
    await toiChangCuoi(d)
    const r = await mo(d, 'S1')
    expect(r.thuSucThem).toMatchObject({ chiSo: truoc.soChang, moLuc: truoc.thuSucThem.moLuc, daNop: false })
    expect(r.thuSucThem.cau.map((c: { qid: string }) => c.qid)).toEqual([CAU_THU])
    expect(Date.parse(r.thuSucThem.moLuc)).toBeLessThanOrEqual(Date.now())
    expect(JSON.stringify(r.thuSucThem.cau)).not.toMatch(/dap_an|dapAn|loi_giai|LG-BI-MAT/) // luật đỏ: đáp án không xuống máy em trước khi nộp
    expect(r.soCauCuaEm).toBe(truoc.soCauCuaEm)
    expect(r.de.cau.map((c: { qid: string }) => c.qid)).not.toContain(CAU_THU) // nhóm thử sức KHÔNG lẫn trong de.cau
  })
  it('bài ĐÃ CHỐT TRƯỚC bản 1.2 (không dòng chang = -1, tomTat cũ): soThuSucThem = 0, không khoá thuSucThem, mọi thứ như cũ; nộp chiSo = soChang bị từ chối', async () => {
    const d = await baiCoThuSuc()
    await mo(d, 'S1')
    d.sql.exec("DELETE FROM btvn_em_cau WHERE chang < 0; UPDATE btvn_em SET tom_tat_json = json_remove(tom_tat_json, '$.soThuSucThem', '$.soBatBuoc')")
    const so = await toiChangCuoi(d)
    const r = await mo(d, 'S1')
    expect(r.ok).toBe(true)
    expect(r.soThuSucThem).toBe(0)
    expect(r).not.toHaveProperty('thuSucThem')
    expect(await nopChang(d, so, { [CAU_THU]: DAP_AN_DUNG(CAU_THU) })).toMatchObject({ ok: false, lyDo: 'chang_chua_mo' })
    expect((await nopChang(d, so - 1, dapAnDungCua(batBuoc(d, so - 1)))).ok).toBe(true)
  })
})

describe('NỘP RIÊNG chặng ảo (chiSo = soChang): thử sức thêm', () => {
  it('trước mốc mở ⇒ chang_chua_mo, không lưu gì; sau hạn ⇒ qua_han', async () => {
    const d = await baiCoThuSuc()
    const r0 = await mo(d, 'S1')
    expect(await nopChang(d, r0.soChang, { [CAU_THU]: DAP_AN_DUNG(CAU_THU) })).toMatchObject({ ok: false, lyDo: 'chang_chua_mo' })
    expect(JSON.stringify(emRow(d).dap_an_json)).not.toContain(CAU_THU)
    gio('2026-09-29T04:00:00.000Z') // sau hạn 03:00
    expect(await nopChang(d, r0.soChang, { [CAU_THU]: DAP_AN_DUNG(CAU_THU) })).toMatchObject({ ok: false, lyDo: 'qua_han' })
  })
  it('bài ĐÃ tự nộp: thử sức nộp được TỚI han_nop — quá hạn thì qua_han, điểm giữ nguyên', async () => {
    const d = await baiCoThuSuc()
    await mo(d, 'S1')
    const so = await toiChangCuoi(d)
    await nopChang(d, so - 1, dapAnDungCua(batBuoc(d, so - 1)))
    const chup = { dung: emRow(d).so_dung, cau: emRow(d).so_cau }
    gio('2026-09-29T03:00:01.000Z') // ngay sau hạn
    expect(await nopChang(d, so, { [CAU_THU]: DAP_AN_DUNG(CAU_THU) })).toMatchObject({ ok: false, lyDo: 'qua_han' })
    expect({ dung: emRow(d).so_dung, cau: emRow(d).so_cau }).toEqual(chup)
  })
  it('bài CHƯA nộp: chỉ LƯU đáp án (điểm tính lúc nộp cuối); trả ketQua như chặng thường (đúng/sai + lời giải), KHÔNG đổi lo_da_xong, không tự nộp; nộp cuối: +1 tử +1 mẫu cho câu thử sức đúng', async () => {
    const d = await baiCoThuSuc()
    await mo(d, 'S1')
    const so = await toiChangCuoi(d, 'S1', { lamChangCuoi: false })
    const truoc = Number(emRow(d).lo_da_xong)
    const r = await nopChang(d, so, { [CAU_THU]: DAP_AN_DUNG(CAU_THU) })
    expect(r.ok).toBe(true)
    expect(r.ketQua).toEqual([expect.objectContaining({ qid: CAU_THU, dung: true, dapAnDung: DAP_AN_DUNG(CAU_THU) })])
    expect(r.chang).toEqual({ chiSo: so, soCau: 1, soDung: 1, xong: true })
    expect(r.thuSucThem).toEqual({ chiSo: so, soCau: 1, soDaLam: 1, soDung: 1, daNop: true })
    expect(r.chuaLam).toEqual([])
    expect(r).not.toHaveProperty('nop')
    expect(Number(emRow(d).lo_da_xong)).toBe(truoc) // KHÔNG tính vào lo_da_xong
    expect(emRow(d).nop_luc).toBeNull()
    expect(emRow(d).so_dung).toBeNull() // điểm chỉ tính lúc nộp cuối
    expect(JSON.parse(String(emRow(d).dap_an_json))[CAU_THU]).toBe(DAP_AN_DUNG(CAU_THU))
    // làm nốt chặng cuối ⇒ tự nộp; thử sức ĐÚNG ⇒ tử +1 và mẫu +1 (10/10 vẫn 10/10, không vượt)
    const qs = batBuoc(d, so - 1)
    const nop = await nopChang(d, so - 1, dapAnDungCua(qs))
    expect(nop.nop).toMatchObject({ daNop: true })
    const em = emRow(d)
    expect(Number(em.so_dung)).toBe(Number(em.so_cau))
    expect(Number(em.so_cau)).toBe(Number(emRow(d).so_cau_em) + 1) // mẫu = bắt buộc + 1 câu thử sức đúng
  })
  it('bài ĐÃ tự nộp (phần bắt buộc xong): nộp thử sức ĐÚNG ⇒ so_dung + 1 và so_cau + 1; SAI ⇒ không đổi; sổ chỉ ghi câu ĐÚNG; kể cả khi bài đã nộp', async () => {
    const d = await baiCoThuSuc()
    await mo(d, 'S1')
    const so = await toiChangCuoi(d)
    const qs = batBuoc(d, so - 1)
    expect((await nopChang(d, so - 1, dapAnDungCua(qs))).nop).toMatchObject({ daNop: true })
    const truoc = { dung: Number(emRow(d).so_dung), cau: Number(emRow(d).so_cau) }
    const r = await nopChang(d, so, { [CAU_THU]: DAP_AN_DUNG(CAU_THU) })
    expect(r.ok).toBe(true)
    expect(r.baiDaNop).toEqual({ soDung: truoc.dung + 1, soCau: truoc.cau + 1 })
    expect({ dung: Number(emRow(d).so_dung), cau: Number(emRow(d).so_cau) }).toEqual({ dung: truoc.dung + 1, cau: truoc.cau + 1 })
    expect(d.dem('su_kien_hoc', `qid = '${CAU_THU}' AND ket_qua = 1`)).toBe(1)
  })
  it('IDEMPOTENT + đáp án đầu KHOÁ: nộp lại (kể cả gửi đáp án khác) không cộng đôi, không đổi kết quả', async () => {
    const d = await baiCoThuSuc()
    await mo(d, 'S1')
    const so = await toiChangCuoi(d)
    await nopChang(d, so - 1, dapAnDungCua(batBuoc(d, so - 1)))
    await nopChang(d, so, { [CAU_THU]: DAP_AN_DUNG(CAU_THU) })
    const chup = { dung: emRow(d).so_dung, cau: emRow(d).so_cau, luu: emRow(d).dap_an_json }
    const lai = await nopChang(d, so, { [CAU_THU]: DAP_AN_DUNG(CAU_THU) })
    const khac = await nopChang(d, so, { [CAU_THU]: dapAnSaiCua([CAU_THU])[CAU_THU]! })
    for (const r of [lai, khac]) expect(r.ketQua[0]).toMatchObject({ dung: true }) // vẫn báo đáp án đã khoá
    expect({ dung: emRow(d).so_dung, cau: emRow(d).so_cau, luu: emRow(d).dap_an_json }).toEqual(chup)
    expect(d.dem('su_kien_hoc', `qid = '${CAU_THU}'`)).toBe(1)
  })
  it('thử sức SAI: điểm không đổi; KHÔNG vào sổ (không hẹn ôn), không thành câu sai của hồ sơ; vẫn có lời giải cho em xem', async () => {
    const d = await baiCoThuSuc()
    await mo(d, 'S1')
    const so = await toiChangCuoi(d)
    await nopChang(d, so - 1, dapAnDungCua(batBuoc(d, so - 1)))
    const truoc = { dung: Number(emRow(d).so_dung), cau: Number(emRow(d).so_cau) }
    const r = await nopChang(d, so, { [CAU_THU]: dapAnSaiCua([CAU_THU])[CAU_THU]! })
    expect(r.ketQua[0]).toMatchObject({ qid: CAU_THU, dung: false, dapAnDung: DAP_AN_DUNG(CAU_THU) })
    expect(r.thuSucThem).toMatchObject({ soDaLam: 1, soDung: 0, daNop: true })
    expect({ dung: Number(emRow(d).so_dung), cau: Number(emRow(d).so_cau) }).toEqual(truoc)
    expect(d.dem('su_kien_hoc', `qid = '${CAU_THU}'`)).toBe(0)
    expect(d.dem('nam_kt_cau', `qid = '${CAU_THU}'`)).toBe(0)
  })
  it('bỏ trống (gửi rỗng): chỉ báo trạng thái, không ghi gì; phần bắt buộc vẫn tự nộp không cần thử sức', async () => {
    const d = await baiCoThuSuc()
    await mo(d, 'S1')
    const so = await toiChangCuoi(d)
    expect((await nopChang(d, so - 1, dapAnDungCua(batBuoc(d, so - 1)))).nop).toMatchObject({ daNop: true })
    const r = await nopChang(d, so, {})
    expect(r).toMatchObject({ ok: true, chuaLam: [CAU_THU], thuSucThem: { soDaLam: 0, daNop: false } })
    expect(Number(emRow(d).so_dung)).toBe(Number(emRow(d).so_cau)) // 10/10 dù bỏ thử sức
    expect(d.dem('su_kien_hoc', `qid = '${CAU_THU}'`)).toBe(0)
  })
  it('thử sức chỉ nhận ở chiSo = soChang: gửi kèm ở chặng thường bị BỎ QUA; /btvn/nop không nhận đáp án thử sức trong thân lệnh', async () => {
    const d = await baiCoThuSuc()
    await mo(d, 'S1')
    const c0 = batBuoc(d, 0)
    await nopChang(d, 0, { ...dapAnDungCua(c0), [CAU_THU]: DAP_AN_DUNG(CAU_THU) })
    expect(Object.keys(JSON.parse(String(emRow(d).dap_an_json)))).not.toContain(CAU_THU)
    const so = await toiChangCuoi(d)
    await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: maBtvn(d), sbd: 'S1', dapAn: { [CAU_THU]: DAP_AN_DUNG(CAU_THU) } })
    expect(Object.keys(JSON.parse(String(emRow(d).dap_an_json ?? '{}')))).not.toContain(CAU_THU)
    void so
  })
  it('EXP: câu thử sức đúng có EXP theo câu như thường (sổ + exp_so), không có EXP "xong chặng"', async () => {
    const d = await baiCoThuSuc()
    await mo(d, 'S1')
    const so = await toiChangCuoi(d)
    await nopChang(d, so - 1, dapAnDungCua(batBuoc(d, so - 1)))
    const truoc = d.dem('exp_so', "sbd = 'S1'")
    const r = await nopChang(d, so, { [CAU_THU]: DAP_AN_DUNG(CAU_THU) })
    expect(r.exp).toMatchObject({ homNay: expect.anything() })
    expect(d.dem('exp_so', "sbd = 'S1'")).toBeGreaterThanOrEqual(truoc)
    expect(d.dem('exp_so', "sbd = 'S1' AND loai LIKE '%chang%'")).toBe(0)
  })
})

describe('THÍCH NGHI không đụng nhóm thử sức thêm', () => {
  it('sau chặng đầu (đúng hết ⇒ có thể đổi/thêm câu chặng chưa mở): dòng chang = -1 vẫn nguyên, số bắt buộc = so_cau_em', async () => {
    const d = await baiCoThuSuc()
    await mo(d, 'S1')
    const truoc = thoi(d)
    expect((await nopChang(d, 0, dapAnDungCua(batBuoc(d, 0)))).ok).toBe(true)
    expect(thoi(d)).toEqual(truoc)
    expect(Number(emRow(d).so_cau_em)).toBe(boCuaEm(d).filter((x) => x.chang >= 0).length)
    expect(boCuaEm(d).filter((x) => x.chang >= 0).every((x) => x.qid !== CAU_THU)).toBe(true)
  })
})

describe('THÍCH NGHI LƯU thay đổi thật mà nhóm thử sức thêm đứng nguyên', () => {
  it('lõi trả một thay đổi hợp lệ (thêm một câu vào chặng cuối chưa mở) ⇒ máy chủ LƯU; dòng chang = -1 KHÔNG bị xoá/ghi lại; so_cau_em = số bắt buộc mới', async () => {
    const d = await baiCoThuSuc()
    await mo(d, 'S1')
    const truoc = thoi(d)
    const so = Number(emRow(d).so_chang)
    const cuoiTruoc = batBuoc(d, so - 1).length
    let vaoQid = ''
    ep.bien = (kq) => {
      const trong = new Set(kq.bo.chang.flat())
      vaoQid = TAT_CA_QID.find((q) => !trong.has(q) && q !== CAU_THU)!
      const chang = kq.bo.chang.map((c, i) => (i === kq.bo.chang.length - 1 ? [...c, vaoQid] : c))
      return { ...kq, doi: [{ ma: 'DA-1', loai: 'them_cau_de', chang: kq.bo.chang.length - 1, vao: vaoQid }], bo: { ...kq.bo, chang, nhan: { ...kq.bo.nhan, [vaoQid]: 'cung_co' }, rieng: [...kq.bo.rieng, vaoQid] } }
    }
    expect((await nopChang(d, 0, dapAnDungCua(batBuoc(d, 0)))).ok).toBe(true)
    expect(ep.soLanGoi).toBeGreaterThan(0)
    expect(batBuoc(d, so - 1).length).toBe(cuoiTruoc + 1) // thay đổi ĐÃ LƯU
    expect(batBuoc(d, so - 1)).toContain(vaoQid)
    expect(thoi(d)).toEqual(truoc) // nhóm thử sức thêm còn nguyên
    expect(Number(emRow(d).so_cau_em)).toBe(boCuaEm(d).filter((x) => x.chang >= 0).length)
    expect(Number(emRow(d).so_chang)).toBe(so)
  })
})

describe('THẦY: xem trước, theo dõi, bài làm', () => {
  it('/btvn/xem-truoc (a) và (b): tomTat có soBatBuoc + soThuSucThem, chiTiet có thuSucThem của em', async () => {
    gio(BAY_GIO)
    const d = dung(2)
    const cau = cauThay().map((c) => (c.dang === 'DA-4' ? { ...c, mucDo: 2 } : c))
    const truocGiao = await goiWorker(worker, d.env, '/btvn/xem-truoc', { maDe: 'DE1', cau, ghim: [], hanNop: '2026-09-29T03:00:00.000Z', hatGiong: 'hg-1', dsSbd: ['S1'], sbdChiTiet: 'S1' }, true)
    expect(truocGiao.ok).toBe(true)
    expect(truocGiao.ds[0].tomTat).toMatchObject({ soThuSucThem: 1 })
    expect(truocGiao.ds[0].tomTat.soBatBuoc).toBe(truocGiao.ds[0].tomTat.tong)
    expect(truocGiao.chiTiet.thuSucThem).toEqual([CAU_THU])
    expect(JSON.stringify(truocGiao.chiTiet.chang)).not.toContain(CAU_THU)
    await giao(d, { cau })
    await mo(d, 'S1')
    const sau = await goiWorker(worker, d.env, '/btvn/xem-truoc', { maBtvn: maBtvn(d), dsSbd: ['S1'], sbdChiTiet: 'S1' }, true)
    expect(sau.chiTiet.thuSucThem).toEqual([CAU_THU]) // em đã chốt ⇒ ĐÚNG bộ đã ghi
    expect(sau.ds[0].tomTat.soThuSucThem).toBe(1)
  })
  it('/btvn/theo-doi: soCauLoi/diemLoi của em chỉ tính lõi BẮT BUỘC (thử sức không kéo điểm lõi xuống); soCauThuongSai không tính thử sức sai', async () => {
    const d = await baiCoThuSuc()
    await mo(d, 'S1')
    const so = await toiChangCuoi(d)
    const qs = batBuoc(d, so - 1)
    await nopChang(d, so - 1, dapAnDungCua(qs))
    await nopChang(d, so, { [CAU_THU]: dapAnSaiCua([CAU_THU])[CAU_THU]! })
    const td = await goiWorker(worker, d.env, '/btvn/theo-doi', { maCa: 'CA1' }, true)
    const em1 = td.ds[0].hocSinh.find((x: { sbd: string }) => x.sbd === 'S1')
    expect(em1.soCauLoi).toBe(6) // lõi 7 − 1 câu thử sức = 6 bắt buộc
    expect(em1.soCauThuongSai).toBe(0)
    const em2 = td.ds[0].hocSinh.find((x: { sbd: string }) => x.sbd === 'S2')
    expect(em2.soCauLoi).toBe(0) // S2 chưa mở bài ⇒ chưa chốt ⇒ 0 (không bịa)
  })
  it('/btvn/bai-lam: thầy thấy nhóm thử sức thêm (đáp án em chọn + đúng/sai) tách khỏi điểm mẫu', async () => {
    const d = await baiCoThuSuc()
    await mo(d, 'S1')
    const so = await toiChangCuoi(d)
    const qs = batBuoc(d, so - 1)
    await nopChang(d, so - 1, dapAnDungCua(qs))
    await nopChang(d, so, { [CAU_THU]: DAP_AN_DUNG(CAU_THU) })
    const r = await goiWorker(worker, d.env, '/btvn/bai-lam', { maBtvn: maBtvn(d), sbd: 'S1' }, true)
    expect(r.thuSucThem).toEqual({ soCau: 1, daLam: [{ qid: CAU_THU, dapAnEm: DAP_AN_DUNG(CAU_THU), dung: true }] })
    expect(r.chang.flat()).not.toContain(CAU_THU)
    expect(r.de.cau.map((c: { qid: string }) => c.qid)).not.toContain(CAU_THU)
  })
})

describe('EM / KẾ HOẠCH: các con số chỉ đếm câu bắt buộc', () => {
  it('/hs/btvn: soCauCuaEm = bắt buộc, soThuSucThem riêng (em khá = 0)', async () => {
    const d = await baiCoThuSuc()
    await mo(d, 'S1'); await mo(d, 'S2')
    const r1 = (await goiWorker(worker, d.env, '/hs/btvn', { sbd: 'S1' })).items[0]
    const r2 = (await goiWorker(worker, d.env, '/hs/btvn', { sbd: 'S2' })).items[0]
    expect(r1).toMatchObject({ caNhan: true, soThuSucThem: 1 })
    expect(r1.soCauCuaEm).toBe(Number(emRow(d, 'S1').so_cau_em))
    expect(r2.soThuSucThem).toBe(0)
  })
  it('kế hoạch ngày / theo dõi chống chép: nhóm thử sức thêm KHÔNG vào kích cỡ chặng (lô ≡ chặng) và không vào bộ của em', async () => {
    const d = await baiCoThuSuc()
    await mo(d, 'S1')
    const { docBoCuaCacEm } = await import('../server/src/btvn-nang-do-d1')
    const ra = await docBoCuaCacEm(d.env, [maBtvn(d)], ['S1'])
    const bo = [...(ra.bo.get(`${maBtvn(d)}|S1`) ?? [])]
    expect(bo).not.toContain(CAU_THU)
    expect(bo.length).toBe(Number(emRow(d).so_cau_em))
    const { lapVaLuuKeHoach } = await import('../server/src/ke-hoach-ngay-d1')
    const kh = (await lapVaLuuKeHoach(d.env, ['S1'], Date.now())).get('S1')!
    const lo = kh.viec.filter((v) => v.loai === 'btvn_lo')
    expect(lo.length).toBeGreaterThan(0)
    for (const v of lo) expect(Number((v.chiTiet as { tongLo?: number }).tongLo ?? 0)).toBeLessThanOrEqual(Number(emRow(d).so_chang))
  })
})

describe('CHỐNG HỒI QUY: bài không có thử sức thêm chạy Y HỆT cũ', () => {
  it('em khá: mở bài không có soThuSucThem>0, nộp chặng cuối không có khoá thuSucThem, điểm 10/10, sổ đủ', async () => {
    const d = await baiCoThuSuc()
    await mo(d, 'S2')
    const so = await toiChangCuoi(d, 'S2')
    const qs = batBuoc(d, so - 1, 'S2')
    const r = await nopChang(d, so - 1, dapAnDungCua(qs), 'S2')
    expect(r).not.toHaveProperty('thuSucThem')
    expect(r.nop).toMatchObject({ daNop: true })
    expect(Number(emRow(d, 'S2').so_dung)).toBe(Number(emRow(d, 'S2').so_cau))
  })
})

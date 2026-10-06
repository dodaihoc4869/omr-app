// @vitest-environment node
// CHẤM LẠI CA KHI TỜ ĐÁP ÁN R2 ĐÃ MẤT CÂU NỐI THÊM + DỌN "CÂU SAI" THỪA (thầy 06/10: "không được phép chấm sai cho bất kì bài kiểm tra nào").
//
// Đo thật ca 269409 (26 em, mỗi em MỘT lượt): sau khi bổ sung đáp án từ `kho_ca_them`, 9/26 em có điểm đã lưu lệch (một em lưu 0 mà đúng 8,5), 91 dòng chi tiết thiếu,
// và 105 dòng `ban_do_sai` ở câu KHÔNG thuộc bộ câu của em (bản chấm cũ bù câu lạ rồi ghi "sai") ⇒ em bị hỏi lại câu chưa từng được giao.
// Khoá: (1) xem trước thấy được bảng cũ → mới dù tờ R2 thiếu câu, KHÔNG ghi gì, và nói cần phục hồi tờ đáp án; (2) GHI chỉ chạy bằng tờ R2 thật (chưa phục hồi ⇒ em thiếu câu
// không bị ghi gì); (3) sau phục hồi: điểm, dòng chi tiết đúng; `ban_do_sai` thừa bị dọn, dòng sai thật còn nguyên, em NHIỀU LƯỢT và ca khác không bị đụng.
import { describe, expect, it } from 'vitest'
import worker, { lapDonBanDoSaiThua } from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const MA = 'CA1'
const NOP = '2026-10-06T03:00:00.000Z'
const mcq = (id: string, correct = 'A') => ({ id, text: id, choices: ['a', 'b', 'c', 'd'], correct, chuyenDe: 'Este', mucDo: 'hieu' })
const tf = (id: string) => ({ id, text: id, ideas: ['1', '2', '3', '4'], correct: ['D', 'S', 'D', 'S'], chuyenDe: 'Este', mucDo: 'hieu' })
const sa = (id: string, correct: string) => ({ id, text: id, correct, chuyenDe: 'Este', mucDo: 'van_dung' })

const BO_S5 = ['I-1', 'X-I-1', 'X-II-1', 'X-III-1'] // có 3 câu nối thêm mà tờ R2 đã mất
const BO_S6 = ['I-1', 'I-2', 'II-1', 'III-1'] // bộ trong kho, em làm HAI lượt
const KEY = {
  phanI: ['I-1', 'I-2'].map((x) => mcq(x)),
  phanII: [tf('II-1')],
  phanIII: [sa('III-1', '0,54')],
  soCau: { I: 2, II: 1, III: 1 },
  boTheoEm: { bo: { S5: BO_S5, S6: BO_S6 } },
}
const KHO_THEM = [
  { qid: 'X-I-1', cau_json: JSON.stringify({ id: 'X-I-1', text: 'x', choices: ['a', 'b', 'c', 'd'] }), dap_an: 'B' },
  { qid: 'X-II-1', cau_json: JSON.stringify({ id: 'X-II-1', text: 'x', ideas: ['1', '2', '3', '4'] }), dap_an: 'DSDD' },
  { qid: 'X-III-1', cau_json: JSON.stringify({ id: 'X-III-1', text: 'x' }), dap_an: '3,5' },
]
// S5: I-1 chọn B (SAI, khoá A) · 3 câu nối thêm đúng ⇒ 2,25 + 4,00 + 1,50 = 7,75
const BAI_S5 = { phanI: { 'I-1': 'B', 'X-I-1': 'B' }, phanII: { 'X-II-1': ['D', 'S', 'D', 'D'] }, phanIII: { 'X-III-1': '3,50' } }
const BAI_S6 = { phanI: { 'I-1': 'A', 'I-2': 'A' }, phanII: { 'II-1': ['D', 'S', 'D', 'S'] }, phanIII: { 'III-1': '0,54' } } // 10,00

function dung(): D1That {
  const d = taoD1That()
  d.sql
    .prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,so_cau_json,bo_theo_em_json,de_rieng,sinh_tai_d1,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,1,1,?)')
    .run(MA, 'Ca thiếu câu', 'dong', 'thi', 'ca_lop_xong', JSON.stringify(KEY.soCau), JSON.stringify(KEY.boTheoEm), NOP)
  d.objects.set(`key/${MA}.json`, KEY)
  for (const x of KHO_THEM) d.sql.prepare('INSERT INTO kho_ca_them(khoa,ma_ca,qid,cau_json,dap_an,luc) VALUES(?,?,?,?,?,?)').run(`${MA}|${x.qid}`, MA, x.qid, x.cau_json, x.dap_an, NOP)
  const luot = (sbd: string, lan: number, bai: unknown, tong: number) =>
    d.sql
      .prepare('INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,id_thiet_bi,vao_luc,nop_luc,trang_thai,cap_nhat_luc,ho_ten,tong,diem_i,diem_ii,diem_iii,dap_an_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(`${MA}|${sbd}|${lan}`, MA, sbd, lan, `MAY-${sbd}`, NOP, NOP, 'da_nop', NOP, `Em ${sbd}`, tong, null, null, null, JSON.stringify(bai))
  luot('S5', 1, BAI_S5, 9) // điểm lưu SAI (đúng 7,75)
  luot('S6', 1, BAI_S6, 10)
  luot('S6', 2, BAI_S6, 10)
  const bd = (ca: string, sbd: string, qid: string) =>
    d.sql.prepare("INSERT INTO ban_do_sai(khoa,ma_ca,sbd,qid,chuyen_de,muc_do,so_lan_sai,da_chua,cap_nhat_luc) VALUES(?,?,?,?,'Este','hieu',1,0,?)").run(`${ca}|${sbd}|${qid}`, ca, sbd, qid, NOP)
  bd(MA, 'S5', 'I-1') // sai THẬT, trong bộ ⇒ phải còn
  bd(MA, 'S5', 'I-2') // THỪA: không thuộc bộ của S5
  bd(MA, 'S5', 'III-1') // THỪA
  bd(MA, 'S6', 'X-I-1') // câu ngoài bộ của S6 NHƯNG S6 có hai lượt ⇒ không đụng
  bd('CA2', 'S5', 'I-2') // ca khác ⇒ không đụng
  return d
}
const qidBanDo = (d: D1That, ca: string, sbd: string) => (d.sql.prepare('SELECT qid FROM ban_do_sai WHERE ma_ca = ? AND sbd = ? ORDER BY qid').all(ca, sbd) as { qid: string }[]).map((x) => x.qid)
const tong = (d: D1That, sbd: string, lan = 1) => (d.sql.prepare('SELECT tong FROM luot WHERE ma_ca = ? AND sbd = ? AND lan_thu = ?').get(MA, sbd, lan) as { tong: number }).tong
const BANG = ['luot', 'chi_tiet_cau', 'ban_do_sai', 'qid_da_lam', 'tien_do_ca', 'tien_do_hs', 'su_kien_hoc', 'kho_ca_them']

describe('/ca/cham-lai — tờ đáp án R2 thiếu câu nối thêm + `ban_do_sai` thừa', () => {
  it('XEM TRƯỚC: bổ sung đáp án trong bộ nhớ, thấy bảng cũ → mới, đếm câu sai thừa, nói cần phục hồi tờ đáp án; KHÔNG ghi gì', async () => {
    const d = dung()
    const truoc = BANG.map((b) => d.chup(b))
    const kq = await goiWorker(worker, d.env, '/ca/cham-lai', { maCa: MA, xemTruoc: true }, true)
    expect(kq.ok).toBe(true)
    expect(kq.tuChoi).toEqual([])
    expect(kq.canPhucHoiKey).toBe(3)
    expect(kq.em.find((e: { sbd: string }) => e.sbd === 'S5')).toMatchObject({ cu: { tong: 9 }, moi: { tong: 7.75 }, doi: true })
    expect(kq.em.find((e: { sbd: string }) => e.sbd === 'S6')).toMatchObject({ doi: false })
    expect(kq.soSeDonBanDoSaiThua).toBe(2) // I-2 và III-1 của S5
    expect(kq.soEmSeDonBanDoSaiThua).toBe(1)
    expect(kq.boQuaDonNhieuLuot).toBe(1) // S6 có hai lượt
    expect(BANG.map((b) => d.chup(b))).toEqual(truoc)
  })

  it('GHI khi CHƯA phục hồi tờ đáp án: em thiếu câu bị TỪ CHỐI, điểm và bản đồ câu sai của em ấy nguyên vẹn', async () => {
    const d = dung()
    const kq = await goiWorker(worker, d.env, '/ca/cham-lai', { maCa: MA }, true)
    expect(kq.ok).toBe(true)
    expect(kq.tuChoi.map((x: { sbd: string }) => x.sbd)).toEqual(['S5'])
    expect(kq.tuChoi[0].viSao).toContain('không còn trong kho đáp án')
    expect(kq.canPhucHoiKey).toBeUndefined() // chỉ báo ở bản xem trước
    expect(tong(d, 'S5')).toBe(9)
    expect(qidBanDo(d, MA, 'S5')).toEqual(['I-1', 'I-2', 'III-1'])
  })

  it('SAU phục hồi, GHI: điểm sửa đúng, dòng chi tiết đủ bốn câu, `ban_do_sai` thừa bị dọn — dòng sai thật, em nhiều lượt và ca khác còn nguyên', async () => {
    const d = dung()
    await goiWorker(worker, d.env, '/ca/phuc-hoi-key', { maCa: MA, ghi: true }, true)
    const kq = await goiWorker(worker, d.env, '/ca/cham-lai', { maCa: MA }, true)
    expect(kq.ok).toBe(true)
    expect(kq.tuChoi).toEqual([])
    expect(tong(d, 'S5')).toBe(7.75)
    const qid = (d.sql.prepare("SELECT qid FROM chi_tiet_cau WHERE ma_ca = ? AND sbd = 'S5'").all(MA) as { qid: string }[]).map((x) => x.qid).sort()
    expect(qid).toEqual([...BO_S5].sort())
    expect(qidBanDo(d, MA, 'S5')).toEqual(['I-1']) // I-2, III-1 (ngoài bộ) đã dọn; I-1 sai thật còn
    expect(kq.soDonBanDoSaiThua).toBe(2)
    expect(kq.soEmDonBanDoSaiThua).toBe(1)
    expect(kq.boQuaDonNhieuLuot).toBe(1)
    expect(qidBanDo(d, MA, 'S6')).toEqual(['X-I-1']) // hai lượt ⇒ không đụng
    expect(qidBanDo(d, 'CA2', 'S5')).toEqual(['I-2']) // ca khác ⇒ không đụng
  })

  it('bài làm KHÔNG có em nào cần dọn ⇒ không có lệnh xoá nào (không bao giờ xoá khi bộ câu rỗng)', async () => {
    const d = dung()
    d.sql.exec("DELETE FROM ban_do_sai WHERE ma_ca = 'CA1' AND sbd = 'S5' AND qid IN ('I-2','III-1')")
    await goiWorker(worker, d.env, '/ca/phuc-hoi-key', { maCa: MA, ghi: true }, true)
    const kq = await goiWorker(worker, d.env, '/ca/cham-lai', { maCa: MA }, true)
    expect(kq.soDonBanDoSaiThua).toBe(0)
    expect(qidBanDo(d, MA, 'S5')).toEqual(['I-1'])
  })

  it('hàm dọn: bộ câu RỖNG hoặc không có lượt nào ⇒ không lập lệnh xoá (không bao giờ xoá sạch bản đồ của em)', async () => {
    const d = dung()
    const r = await lapDonBanDoSaiThua(d.env, MA, [{ sbd: 'S5', cau: [] }])
    expect(r).toMatchObject({ soDong: 0, soEm: 0, boQuaNhieuLuot: 0 })
    expect(r.lenh).toEqual([])
    expect(await lapDonBanDoSaiThua(d.env, MA, [])).toMatchObject({ soDong: 0, lenh: [] })
    expect(qidBanDo(d, MA, 'S5')).toEqual(['I-1', 'I-2', 'III-1'])
  })
})

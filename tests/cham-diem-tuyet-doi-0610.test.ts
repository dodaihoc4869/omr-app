// @vitest-environment node
// CHẤM ĐIỂM CHÍNH XÁC TUYỆT ĐỐI Ở MÁY CHỦ (thầy 06/10: "quét toàn bộ mục chấm điểm của phần mở ca thi … không được phép chấm sai cho bất kì bài kiểm tra nào").
//
// Chạy trên SQLite THẬT (`_d1-that.ts`) qua Worker thật. Khoá các lỗi ĐÃ ĐO trong đợt quét:
//   1. chấm lại ca đọc bản đồ trong tờ đáp án R2 (bản chụp lúc mở ca), KHÔNG đọc D1 sống ⇒ em vào muộn bị chấm theo bộ câu của người khác rồi GHI ĐÈ điểm đúng;
//   2. `/ca/kiem-cham` (CHỈ ĐỌC) đo đúng số lệch và KHÔNG ghi gì; `/ca/cham-lai` có chế độ `xemTruoc` không ghi;
//   3. bộ chấm THỨ HAI `danhGiaLuot` (chấm lúc đọc) so chuỗi Phần III ("0,540" ≠ "0,54") rồi GHI câu sai oan vào `ban_do_sai`;
//   4. máy em gọi `sendFeedback` ghi thẳng điểm máy em gửi ⇒ nay máy chủ tự chấm, số máy em gửi chỉ để đối chiếu;
//   5. `capNhatKeyBank` ghi đè mù tờ đáp án (mất `soCau`, `boTheoEm`, câu nối thêm; gói hỏng ghi "null");
//   6. chấm điểm không dọn dòng `ban_do_sai` của câu nay đã ĐÚNG.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { chamLaiMotCa, chamLuotTuNganHang, type LuotChoCham, type NganHangDapAn } from '../server/src/cham-lai-ca'
import { danhGiaLuot } from '../server/src/goi-cu'
import { buSoCauChoKeyBank, hopNhatKeyBank } from '../server/src/key-bank-hop-nhat'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { chuanHoaMayChu } from '../src/lib/cau-hinh-may-chu'
import { nopMoi, quenCaVang } from '../src/lib/may-chu-moi'

const MA = 'CA1'
const NOP = '2026-10-06T03:00:00.000Z'
const mcq = (id: string, correct = 'A') => ({ id, text: id, choices: ['a', 'b', 'c', 'd'], correct, chuyenDe: 'Este', mucDo: 'hieu' })
const tf = (id: string) => ({ id, text: id, ideas: ['1', '2', '3', '4'], correct: ['D', 'S', 'D', 'S'], chuyenDe: 'Este', mucDo: 'hieu' })
const sa = (id: string, correct: string) => ({ id, text: id, correct, chuyenDe: 'Este', mucDo: 'van_dung' })

const BO_S1 = ['I-1', 'I-2', 'II-1', 'III-1']
const BO_S2 = ['I-3', 'I-4', 'II-2', 'III-2'] // em vào muộn: chỉ có ở D1 sống
const BO_S3 = ['I-5', 'I-6', 'II-3', 'III-3']

/** Kho 6/3/3, ca đề riêng 2/1/1. Phần III có khoá "0,54" và khoá CÓ ĐƠN VỊ "12 g/mol". */
const NH: NganHangDapAn = {
  phanI: ['I-1', 'I-2', 'I-3', 'I-4', 'I-5', 'I-6'].map((x) => mcq(x)),
  phanII: ['II-1', 'II-2', 'II-3'].map(tf),
  phanIII: [sa('III-1', '0,54'), sa('III-2', '12 g/mol'), sa('III-3', '2')],
  soCau: { I: 2, II: 1, III: 1 },
  // BẢN CHỤP lúc mở ca: chỉ có S1 (em vào muộn S2, S3 không có ở đây).
  boTheoEm: { bo: { S1: BO_S1 } },
}

const DUNG_S1 = { phanI: { 'I-1': 'A', 'I-2': 'A' }, phanII: { 'II-1': ['D', 'S', 'D', 'S'] }, phanIII: { 'III-1': '0,540' } } // 10,00 theo luật so_hoc
const BAI_S2 = { phanI: { 'I-3': 'A', 'I-4': 'B' }, phanII: { 'II-2': ['D', 'S', 'D', 'S'] }, phanIII: { 'III-2': '12' } } // 2,25 + 4,00 + 1,50 = 7,75
const BAI_S3_LAC = { phanI: { 'I-1': 'A', 'I-5': 'A' }, phanII: {}, phanIII: {} } // làm câu NGOÀI bộ D1 của S3 (I-1)

function dung(): D1That {
  const d = taoD1That()
  d.sql
    .prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,so_cau_json,bo_theo_em_json,de_rieng,sinh_tai_d1,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,1,1,?)')
    .run(MA, 'Ca đề riêng', 'dong', 'thi', 'ngay', JSON.stringify({ I: 2, II: 1, III: 1 }), JSON.stringify({ bo: { S1: BO_S1, S2: BO_S2, S3: BO_S3 } }), NOP)
  d.objects.set(`key/${MA}.json`, NH)
  return d
}
function themLuot(d: D1That, sbd: string, dapAn: unknown, o: { tong: number | null; i?: number | null; ii?: number | null; iii?: number | null; tb?: string } = { tong: null }) {
  d.sql
    .prepare('INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,id_thiet_bi,vao_luc,nop_luc,trang_thai,cap_nhat_luc,ho_ten,tong,diem_i,diem_ii,diem_iii,dap_an_json) VALUES(?,?,?,1,?,?,?,?,?,?,?,?,?,?,?)')
    .run(`${MA}|${sbd}|1`, MA, sbd, o.tb ?? `MAY-${sbd}`, NOP, NOP, 'da_nop', NOP, `Em ${sbd}`, o.tong, o.i ?? null, o.ii ?? null, o.iii ?? null, JSON.stringify(dapAn))
}
const themCt = (d: D1That, sbd: string, qid: string, phan: string, so: number, dungSai: number) =>
  d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,chuyen_de,muc_do,dap_an_chon,dap_an_dung,dung_sai,giay,cap_nhat_luc) VALUES(?,?,?,1,?,?,?,'Este','hieu','x','y',?,5,?)").run(`${MA}|${sbd}|1|${phan}|${so}`, MA, sbd, phan, so, qid, dungSai, NOP)
const themBanDoSai = (d: D1That, sbd: string, qid: string) =>
  d.sql.prepare("INSERT INTO ban_do_sai(khoa,ma_ca,sbd,qid,chuyen_de,muc_do,so_lan_sai,da_chua,cap_nhat_luc) VALUES(?,?,?,?,'Este','hieu',1,0,?)").run(`${MA}|${sbd}|${qid}`, MA, sbd, qid, NOP)

/** Ba em: S1 (điểm lưu CŨ sai 8,5 vì Phần III bị chấm sai thời so chuỗi), S2 (em vào muộn, điểm lưu đúng), S3 (bài làm lệch bộ câu). */
function dungDayDu(): D1That {
  const d = dung()
  themLuot(d, 'S1', DUNG_S1, { tong: 8.5, i: 4.5, ii: 4, iii: 0 })
  themCt(d, 'S1', 'I-1', 'I', 1, 1); themCt(d, 'S1', 'I-2', 'I', 2, 1); themCt(d, 'S1', 'II-1', 'II', 1, 1); themCt(d, 'S1', 'III-1', 'III', 1, 0) // dòng III-1 ghi SAI oan
  themBanDoSai(d, 'S1', 'III-1') // và bản đồ câu sai ghi theo
  themLuot(d, 'S2', BAI_S2, { tong: 7.75, i: 2.25, ii: 4, iii: 1.5 })
  themLuot(d, 'S3', BAI_S3_LAC, { tong: 5, i: 2.25, ii: 2, iii: 0.75 })
  return d
}

const ANH_CHUP = ['luot', 'chi_tiet_cau', 'ban_do_sai', 'qid_da_lam', 'tien_do_ca', 'tien_do_hs', 'su_kien_hoc']

describe('/ca/kiem-cham — CHỈ ĐỌC, đo đúng từng loại lệch', () => {
  it('đếm điểm lệch, dòng chi tiết lệch, bản đồ câu sai oan, em vào muộn, bài làm lệch bộ câu — và KHÔNG ghi một dòng nào', async () => {
    const d = dungDayDu()
    const truoc = ANH_CHUP.map((b) => d.chup(b))
    const kq = await goiWorker(worker, d.env, '/ca/kiem-cham', { maCa: MA }, true)
    expect(kq.ok).toBe(true)
    expect(kq.soEmDaNop).toBe(3)
    expect(kq.soEmChamDuoc).toBe(2)
    expect(kq.soEmTuChoi).toBe(1)
    expect(kq.tuChoi[0].sbd).toBe('S3')
    expect(kq.tuChoi[0].viSao).toContain('bai_lam_ngoai_bo')
    // nguồn bộ câu
    expect(kq.nguon).toMatchObject({ keyCoSoCau: true, keyCoBoTheoEm: true, d1CoSoCau: true, d1CoBoTheoEm: true, emChiCoOD1: 2 })
    // S1: điểm lưu 8,5 ≠ tính lại 10 · phần III lệch · dòng III-1 sai oan · bản đồ sai oan
    expect(kq.lech.diem_tong_lech).toBe(1)
    expect(kq.lech.diem_phan_lech).toBe(1)
    expect(kq.lech.dong_lech).toBe(1)
    expect(kq.lech.ban_do_sai_oan).toBe(1)
    // S2: em vào muộn chưa có dòng chi tiết nào; và chấm lại bằng cách CŨ (chỉ bản chụp R2) sẽ ra điểm KHÁC.
    expect(kq.lech.em_khong_co_dong).toBe(1)
    expect(kq.lech.cach_cu_chi_diem_lech).toBe(1)
    expect(kq.mau.cach_cu_chi_diem_lech[0].sbd).toBe('S2')
    expect(kq.mau.cach_cu_chi_diem_lech[0].moi).toBe(7.75)
    expect(kq.boCau.da_ghi).toBe(2)
    // CHỈ ĐỌC
    expect(ANH_CHUP.map((b) => d.chup(b))).toEqual(truoc)
  })

  it('không có mã bí mật ⇒ 403; thiếu mã ca ⇒ từ chối; ca không có ⇒ khong_co_ca', async () => {
    const d = dungDayDu()
    const r = await worker.fetch(new Request('https://test/ca/kiem-cham', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ maCa: MA }) }), d.env)
    expect(r.status).toBe(403)
    expect((await goiWorker(worker, d.env, '/ca/kiem-cham', {}, true)).ok).toBe(false)
    expect((await goiWorker(worker, d.env, '/ca/kiem-cham', { maCa: 'KHONG-CO' }, true)).lyDo).toBe('khong_co_ca')
  })

  it('soi được cả ca ĐANG MỞ (cổng "ca đã xong" chỉ chặn đường GHI)', async () => {
    const d = dungDayDu()
    d.sql.prepare("UPDATE ca SET trang_thai = 'mo' WHERE ma_ca = ?").run(MA)
    d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,cap_nhat_luc) VALUES(?,?,?,1,?,'dang_lam',?)").run(`${MA}|S9|1`, MA, 'S9', NOP, NOP)
    expect((await goiWorker(worker, d.env, '/ca/kiem-cham', { maCa: MA }, true)).ok).toBe(true)
    const chamLai = await goiWorker(worker, d.env, '/ca/cham-lai', { maCa: MA }, true)
    expect(chamLai.ok).toBe(false)
    expect(chamLai.lyDo).toBe('ca_chua_xong')
  })
})

describe('/ca/cham-lai — bản đồ D1 sống + chế độ xem trước + khoá an toàn', () => {
  it('xemTruoc: trả bảng cũ → mới, soSeGhi, KHÔNG ghi gì', async () => {
    const d = dungDayDu()
    const truoc = ANH_CHUP.map((b) => d.chup(b))
    const kq = await goiWorker(worker, d.env, '/ca/cham-lai', { maCa: MA, xemTruoc: true }, true)
    expect(kq.ok).toBe(true)
    expect(kq.xemTruoc).toBe(true)
    expect(kq.soGhi).toBe(0)
    expect(kq.soSeGhi).toBe(2)
    expect(kq.em.find((e: { sbd: string }) => e.sbd === 'S1')).toMatchObject({ cu: { tong: 8.5 }, moi: { tong: 10 }, doi: true })
    expect(kq.em.find((e: { sbd: string }) => e.sbd === 'S2')).toMatchObject({ cu: { tong: 7.75 }, moi: { tong: 7.75 }, doi: false })
    expect(kq.tuChoi.map((x: { sbd: string }) => x.sbd)).toEqual(['S3'])
    expect(ANH_CHUP.map((b) => d.chup(b))).toEqual(truoc)
  })

  it('EM VÀO MUỘN được chấm theo bộ câu D1 sống (7,75), KHÔNG theo bộ rơi về hash; em bài làm lệch bộ câu bị TỪ CHỐI và giữ nguyên điểm', async () => {
    const d = dungDayDu()
    const kq = await goiWorker(worker, d.env, '/ca/cham-lai', { maCa: MA }, true)
    expect(kq.ok).toBe(true)
    expect(kq.soGhi).toBe(2)
    const diem = (sbd: string) => d.sql.prepare('SELECT tong, diem_i, diem_ii, diem_iii FROM luot WHERE ma_ca=? AND sbd=?').get(MA, sbd) as Record<string, number>
    expect(diem('S1')).toEqual({ tong: 10, diem_i: 4.5, diem_ii: 4, diem_iii: 1.5 })
    expect(diem('S2')).toEqual({ tong: 7.75, diem_i: 2.25, diem_ii: 4, diem_iii: 1.5 })
    // dòng chi tiết của S2 = ĐÚNG bộ D1 của em ấy
    const qid = (d.sql.prepare("SELECT qid FROM chi_tiet_cau WHERE ma_ca=? AND sbd='S2' ORDER BY phan, so_cau").all(MA) as { qid: string }[]).map((x) => x.qid).sort()
    expect(qid).toEqual([...BO_S2].sort())
    // S3 lệch bộ câu ⇒ không ghi gì, điểm cũ còn nguyên
    expect(kq.tuChoi[0].sbd).toBe('S3')
    expect(diem('S3').tong).toBe(5)
    expect(d.dem('chi_tiet_cau', "sbd='S3'")).toBe(0)
    // dòng sai oan của S1 đã được dọn
    expect(d.dem('ban_do_sai', "sbd='S1' AND qid='III-1'")).toBe(0)
  })

  it('EM VÀO MUỘN bỏ trống + chưa xem vài câu: bộ D1 sống cho dòng chi tiết ĐÚNG câu em được giao; đoán từ bài làm sẽ chèn câu lạ vào bảng "câu sai"', async () => {
    const d = dung()
    const BO_S4 = ['I-1', 'I-6', 'II-3', 'III-3']
    d.sql.prepare('UPDATE ca SET bo_theo_em_json = ? WHERE ma_ca = ?').run(JSON.stringify({ bo: { S4: BO_S4 } }), MA)
    // Em S4 chỉ làm I-6 và II-3; bỏ trống HẲN I-1 và III-3 (không để lại dấu vết nào, kể cả giây xem câu).
    themLuot(d, 'S4', { phanI: { 'I-6': 'A' }, phanII: { 'II-3': ['D', 'S', 'D', 'S'] }, phanIII: {} }, { tong: null })
    const kq = await goiWorker(worker, d.env, '/ca/cham-lai', { maCa: MA }, true)
    expect(kq.ok).toBe(true)
    expect(kq.tuChoi).toEqual([])
    expect((d.sql.prepare("SELECT tong FROM luot WHERE sbd='S4'").get() as { tong: number }).tong).toBe(6.25) // I: 1/2 = 2,25 · II: 4,00 · III: 0
    const qid = (d.sql.prepare("SELECT qid FROM chi_tiet_cau WHERE sbd='S4'").all() as { qid: string }[]).map((x) => x.qid).sort()
    expect(qid).toEqual([...BO_S4].sort()) // ĐÚNG bốn câu em được giao — gồm I-1 và III-3 em bỏ trống
    expect(d.dem('ban_do_sai', "sbd='S4'")).toBe(2) // hai câu bỏ trống là hai câu SAI THẬT của em ấy
  })

  it('hàm thuần: bản chụp R2 thiếu em ⇒ boD1 bổ sung; không có boD1 ⇒ em ấy rơi về hash (điểm KHÁC) — đây chính là lỗi cũ', () => {
    const luot = (sbd: string, dapAn: unknown): LuotChoCham => ({ sbd, hoTen: sbd, lanThu: 1, trangThai: 'da_nop', dapAn: dapAn as LuotChoCham['dapAn'], giayCau: null, diem: { I: null, II: null, III: null, tong: null } })
    const co = chamLaiMotCa(MA, 'x', NH, [luot('S2', BAI_S2)], { I: 2, II: 1, III: 1 }, { bo: { S2: BO_S2 } })
    expect(co.em[0]!.moi.tong).toBe(7.75)
    // Không có D1 sống: bộ câu của S2 không có trong bản chụp ⇒ luật hash ⇒ bài làm nằm ngoài bộ hash ⇒ dựng từ bài làm (an toàn) — vẫn 7,75, có cảnh báo.
    const khong = chamLaiMotCa(MA, 'x', NH, [luot('S2', BAI_S2)], { I: 2, II: 1, III: 1 })
    expect(khong.em[0]!.moi.tong).toBe(7.75)
    expect(khong.canhBao[0]?.ma).toContain('hash_lech_bai_lam')
  })
})

describe('danhGiaLuot — một lõi chấm với điểm (không còn bộ chấm thứ hai)', () => {
  const caRow = { so_cau_json: JSON.stringify({ I: 2, II: 1, III: 1 }), bo_theo_em_json: JSON.stringify({ bo: { S1: BO_S1 } }) }

  it('Phần III "0,540" khớp khoá "0,54" ⇒ ĐÚNG (bản cũ ghi SAI), "–1" ≡ "-1", đơn vị bỏ qua được', () => {
    const dg = danhGiaLuot(NH, caRow, DUNG_S1, 'S1', MA, 1, 'Ca')
    expect(dg.tongCau).toBe(4)
    expect(dg.soCauDung).toBe(4)
    expect(dg.dsCauSai).toHaveLength(0)
    expect(dg.dsChiTiet.map((c) => c.qid)).toEqual(BO_S1)
    const dgDonVi = danhGiaLuot(NH, { ...caRow, bo_theo_em_json: JSON.stringify({ bo: { S2: BO_S2 } }) }, BAI_S2, 'S2', MA, 1, 'Ca')
    expect(dgDonVi.dsChiTiet.find((c) => c.qid === 'III-2')?.dung_sai).toBe(1) // "12" khớp "12 g/mol"
    expect(dgDonVi.dsCauSai.map((c) => c.qid)).toEqual(['I-4']) // chỉ câu I-4 em chọn B (khoá A)
  })

  it('KHÔNG bù câu theo thứ tự kho, KHÔNG thêm câu bản đồ mà kho không còn: không chấm được ⇒ RỖNG (không ghi bịa)', () => {
    const khongConCau = { ...caRow, bo_theo_em_json: JSON.stringify({ bo: { S1: ['I-1', 'I-LAC', 'II-1', 'III-1'] } }) }
    const dg = danhGiaLuot(NH, khongConCau, DUNG_S1, 'S1', MA, 1, 'Ca')
    expect(dg.dsChiTiet).toEqual([])
    expect(dg.tongCau).toBe(0)
    // gói chỉ có ĐỀ (không đáp án) ⇒ rỗng
    const congKhai = { phanI: NH.phanI.map((q) => ({ id: q.id, text: q.text, choices: q.choices })), phanII: [], phanIII: [] }
    expect(danhGiaLuot(congKhai, caRow, DUNG_S1, 'S1', MA).dsChiTiet).toEqual([])
    expect(chamLuotTuNganHang(NH, caRow, null, 'S1', MA)).toBeNull()
  })

  it('đường đọc thật `hsCauSai`: ca đã công bố, chưa có dòng chi tiết ⇒ câu Phần III đúng KHÔNG vào danh sách sai và KHÔNG vào bản đồ câu sai', async () => {
    const d = dung()
    themLuot(d, 'S1', DUNG_S1, { tong: null })
    const kq = await goiWorker(worker, d.env, '/goi', { action: 'hsCauSai', sbd: 'S1' })
    expect(kq.ok).toBe(true)
    expect((kq.items ?? kq.cau ?? []).length).toBe(0)
    await new Promise((x) => setTimeout(x, 80)) // `luuChiTietCauNeuChuaCo` chạy nền
    expect(d.dem('chi_tiet_cau', "sbd='S1'")).toBe(4)
    expect(d.dem('chi_tiet_cau', "sbd='S1' AND dung_sai = 0")).toBe(0)
    expect(d.dem('ban_do_sai', "sbd='S1'")).toBe(0)
  })
})

describe('sendFeedback — điểm do MÁY CHỦ chấm, số máy em gửi chỉ để đối chiếu', () => {
  it('máy em gửi điểm 10 cho bài thật 7,75 ⇒ D1 ghi 7,75 (bản cũ ghi 10)', async () => {
    const d = dungDayDu()
    const kq = await goiWorker(worker, d.env, '/goi', { action: 'sendFeedback', maCa: MA, sbd: 'S2', idThietBi: 'MAY-S2', diem: 10, diemPhan: { I: 4.5, II: 4, III: 1.5 }, xepLoai: 'Giỏi', cauSai: [] })
    expect(kq.ok).toBe(true)
    expect(kq.daGhiDiem).toBe(true)
    expect(d.sql.prepare("SELECT tong, diem_i FROM luot WHERE sbd='S2'").get()).toEqual({ tong: 7.75, diem_i: 2.25 })
    const nx = JSON.parse((d.sql.prepare("SELECT noi_dung FROM nhan_xet WHERE sbd='S2'").get() as { noi_dung: string }).noi_dung)
    expect(nx).toMatchObject({ diem: 7.75, tuMayChu: true, diemMay: 10 })
  })
  it('thiếu `diem` KHÔNG xoá điểm đang có; bài không chấm được chính xác ⇒ KHÔNG ghi điểm, giữ nguyên', async () => {
    const d = dungDayDu()
    await goiWorker(worker, d.env, '/goi', { action: 'sendFeedback', maCa: MA, sbd: 'S2', idThietBi: 'MAY-S2' })
    expect((d.sql.prepare("SELECT tong FROM luot WHERE sbd='S2'").get() as { tong: number }).tong).toBe(7.75)
    const lac = await goiWorker(worker, d.env, '/goi', { action: 'sendFeedback', maCa: MA, sbd: 'S3', idThietBi: 'MAY-S3', diem: 9.99, diemPhan: { I: 4.5, II: 4, III: 1.49 } })
    expect(lac.ok).toBe(true)
    expect(lac.daGhiDiem).toBe(false)
    expect((d.sql.prepare("SELECT tong FROM luot WHERE sbd='S3'").get() as { tong: number }).tong).toBe(5)
  })
  it('máy lạ (sai mã thiết bị) vẫn bị chặn như cũ', async () => {
    const d = dungDayDu()
    const kq = await goiWorker(worker, d.env, '/goi', { action: 'sendFeedback', maCa: MA, sbd: 'S2', idThietBi: 'MAY-LA', diem: 10 })
    expect(kq.ok).toBe(false)
    expect((d.sql.prepare("SELECT tong FROM luot WHERE sbd='S2'").get() as { tong: number }).tong).toBe(7.75)
  })
})

describe('capNhatKeyBank — hợp nhất, không ghi đè mù', () => {
  it('gói TRẦN (như chốt đáp án / kho sửa gửi) giữ soCau + boTheoEm + câu nối thêm, nhưng nhận đáp án MỚI', async () => {
    const d = dung()
    const khoanThem = mcq('I-NOI-THEM') // câu máy khác đã nối vào ca (noiKhoCa)
    d.objects.set(`key/${MA}.json`, { ...NH, phanI: [...NH.phanI, khoanThem] })
    const goiTran = { phanI: NH.phanI.map((q) => (q.id === 'I-1' ? { ...q, correct: 'C' } : q)), phanII: NH.phanII, phanIII: NH.phanIII }
    const kq = await goiWorker(worker, d.env, '/goi', { action: 'capNhatKeyBank', maCa: MA, keyBank: goiTran }, true)
    expect(kq.ok).toBe(true)
    const tho = d.objects.get(`key/${MA}.json`)
    const sau = (typeof tho === 'string' ? JSON.parse(tho) : tho) as typeof NH
    expect(sau.soCau).toEqual({ I: 2, II: 1, III: 1 })
    expect(sau.boTheoEm).toEqual({ bo: { S1: BO_S1 } })
    expect(sau.phanI.map((q) => q.id)).toEqual(['I-1', 'I-2', 'I-3', 'I-4', 'I-5', 'I-6', 'I-NOI-THEM']) // giữ thứ tự cũ + giữ câu nối thêm
    expect(sau.phanI[0]!.correct).toBe('C') // đáp án mới được áp
  })
  it('gói hỏng bị TỪ CHỐI, tờ đáp án cũ còn nguyên (bản cũ ghi "null" xoá sạch)', async () => {
    const d = dung()
    for (const keyBank of [null, undefined, 'x', { phanI: [] }, []]) {
      const kq = await goiWorker(worker, d.env, '/goi', { action: 'capNhatKeyBank', maCa: MA, keyBank }, true)
      expect(kq.ok, JSON.stringify(keyBank)).toBe(false)
    }
    expect(d.objects.get(`key/${MA}.json`)).toEqual(NH)
  })
  it('hàm thuần: cũ rỗng/hỏng ⇒ lấy gói mới; gói mới có soCau thì thắng', () => {
    const moi = { phanI: [mcq('a')], phanII: [], phanIII: [], soCau: { I: 1, II: 0, III: 0 } }
    expect(hopNhatKeyBank(null, moi)).toEqual(moi)
    expect(hopNhatKeyBank({ phanI: [mcq('a')], phanII: [], phanIII: [], soCau: { I: 9, II: 9, III: 9 } }, moi)!.soCau).toEqual({ I: 1, II: 0, III: 0 })
  })
})

describe('/cham-diem — mọi lần chấm dọn dòng bản đồ câu sai của câu nay đã ĐÚNG', () => {
  it('chấm điểm (không phải chấm lại ca) cũng xoá `ban_do_sai` oan, giữ dòng của câu còn sai', async () => {
    const d = dung()
    themLuot(d, 'S1', DUNG_S1, { tong: null })
    themBanDoSai(d, 'S1', 'III-1') // oan — câu này em làm đúng
    themBanDoSai(d, 'S1', 'I-2') // câu này lượt mới chấm là SAI
    const cau = (qid: string, phan: string, so: number, dungSai: boolean) => ({ phan, soCau: so, qid, chuyenDe: 'Este', mucDo: 'hieu', dapAnChon: 'x', dapAnDung: 'y', dungSai, giay: 3 })
    const kq = await goiWorker(worker, d.env, '/cham-diem', { maCa: MA, bai: [{ sbd: 'S1', lanThu: 1, diem: { I: 2.25, II: 4, III: 1.5, tong: 7.75 }, cau: [cau('I-1', 'I', 1, true), cau('I-2', 'I', 2, false), cau('II-1', 'II', 1, true), cau('III-1', 'III', 1, true)] }] }, true)
    expect(kq.ok).toBe(true)
    expect(d.dem('ban_do_sai', "sbd='S1' AND qid='III-1'")).toBe(0)
    expect(d.dem('ban_do_sai', "sbd='S1' AND qid='I-2'")).toBe(1)
  })
})

describe('tờ đáp án gửi cho em luôn mang `soCau` (bù từ D1 khi tờ đã mất)', () => {
  const khongSoCau = { phanI: NH.phanI, phanII: NH.phanII, phanIII: NH.phanIII }
  it('hàm thuần: thiếu ⇒ bù, nối vào chuỗi nguyên văn; đã có ⇒ giữ; D1 cũng thiếu ⇒ không bịa', () => {
    const tho = JSON.stringify(khongSoCau)
    const bu = buSoCauChoKeyBank(khongSoCau, tho, JSON.stringify({ I: 2, II: 1, III: 1 }))!
    expect(bu.giaTri.soCau).toEqual({ I: 2, II: 1, III: 1 })
    expect(JSON.parse(bu.tho).soCau).toEqual({ I: 2, II: 1, III: 1 })
    expect(JSON.parse(bu.tho).phanI).toHaveLength(6) // phần còn lại nguyên vẹn
    expect(buSoCauChoKeyBank(NH, JSON.stringify(NH), JSON.stringify({ I: 9, II: 9, III: 9 }))).toBeNull() // đã có soCau ⇒ không đụng
    expect(buSoCauChoKeyBank(khongSoCau, tho, null)).toBeNull()
    expect(buSoCauChoKeyBank(khongSoCau, tho, '{"I":0,"II":0,"III":0}')).toBeNull()
    expect(buSoCauChoKeyBank({ phanI: [] }, null, '{"I":1,"II":1,"III":1}')).toBeNull()
  })
  it('đường /nop (ca công bố ngay): tờ đáp án trả cho em có soCau của ca dù tờ ở R2 đã mất nó', async () => {
    const d = dung()
    d.objects.set(`key/${MA}.json`, khongSoCau)
    d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,id_thiet_bi,vao_luc,trang_thai,cap_nhat_luc) VALUES(?,?,?,1,?,?,'dang_lam',?)").run(`${MA}|S1|1`, MA, 'S1', 'MAY-S1', NOP, NOP)
    const kq = await goiWorker(worker, d.env, '/nop', { maCa: MA, sbd: 'S1', dapAn: DUNG_S1, integrity: {} })
    expect(kq.ok).toBe(true)
    expect(kq.keyBank.soCau).toEqual({ I: 2, II: 1, III: 1 })
    expect(kq.keyBank.phanI).toHaveLength(6)
  })
  it('đường hỏi lại `ketQua` cũng bù', async () => {
    const d = dung()
    d.objects.set(`key/${MA}.json`, khongSoCau)
    const kq = await goiWorker(worker, d.env, '/goi', { action: 'ketQua', maCa: MA, sbd: 'S1' })
    expect(kq.ok).toBe(true)
    expect(kq.keyBank.soCau).toEqual({ I: 2, II: 1, III: 1 })
  })
})

describe('/nop — gửi nốt bài của lượt CŨ phải khoá đúng lượt (không đè lượt thi lại)', () => {
  it('có `khoaLuot` của lượt cũ đã đóng ⇒ bài cũ thành BÀI BỔ SUNG; lượt mới của em vẫn `dang_lam`, đáp án của nó nguyên vẹn', async () => {
    const d = dung()
    themLuot(d, 'S1', { phanI: { 'I-1': 'A' }, phanII: {}, phanIII: {} }, { tong: null }) // lượt 1 đã nộp
    d.sql
      .prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,id_thiet_bi,vao_luc,trang_thai,cap_nhat_luc,dap_an_json) VALUES(?,?,?,2,?,?,'dang_lam',?,?)")
      .run(`${MA}|S1|2`, MA, 'S1', 'MAY-S1', NOP, NOP, JSON.stringify({ phanI: { 'I-2': 'A' }, phanII: {}, phanIII: {} }))
    // Máy em gửi nốt bài của lượt 1 (đáp án CŨ khác hẳn) — kèm khoá đúng lượt 1.
    const kq = await goiWorker(worker, d.env, '/nop', { maCa: MA, sbd: 'S1', khoaLuot: `${MA}|S1|1`, dapAn: { phanI: { 'I-1': 'A', 'I-2': 'B' }, phanII: {}, phanIII: {} }, integrity: {} })
    expect(kq.ok).toBe(true)
    const moi = d.sql.prepare("SELECT trang_thai, dap_an_json FROM luot WHERE khoa = ?").get(`${MA}|S1|2`) as { trang_thai: string; dap_an_json: string }
    expect(moi.trang_thai).toBe('dang_lam')
    expect(JSON.parse(moi.dap_an_json).phanI).toEqual({ 'I-2': 'A' })
  })
})

// ===== BỔ SUNG SAU KIỂM ĐỘT BIẾN (06/10): tám điểm làm hỏng cố ý mà bộ test đầu chưa bắt được =====

describe('/ca/kiem-cham — đo dòng chi tiết THIẾU / THỪA, bản đồ câu sai THỪA, điểm chưa có, tổng ≠ tổng ba phần', () => {
  it('dòng thiếu (II-1), dòng thừa (I-5 ngoài bộ), bản đồ sai thừa (I-6 ngoài bộ): mỗi loại đúng 1, loại khác không nhảy', async () => {
    const d = dung()
    themLuot(d, 'S1', DUNG_S1, { tong: 10, i: 4.5, ii: 4, iii: 1.5 }) // điểm lưu ĐÚNG ⇒ chỉ còn lỗi dòng / bản đồ
    themCt(d, 'S1', 'I-1', 'I', 1, 1); themCt(d, 'S1', 'I-2', 'I', 2, 1); themCt(d, 'S1', 'III-1', 'III', 1, 1) // THIẾU dòng II-1
    themCt(d, 'S1', 'I-5', 'I', 3, 0) // dòng THỪA: I-5 không thuộc bộ của S1
    themBanDoSai(d, 'S1', 'I-6') // bản đồ sai THỪA: I-6 cũng ngoài bộ
    const kq = await goiWorker(worker, d.env, '/ca/kiem-cham', { maCa: MA }, true)
    expect(kq.ok).toBe(true)
    expect(kq.lech).toMatchObject({ dong_thieu: 1, dong_thua: 1, ban_do_sai_thua: 1, dong_lech: 0, ban_do_sai_oan: 0, em_khong_co_dong: 0, diem_tong_lech: 0, diem_phan_lech: 0, tong_khac_tong_phan: 0 })
    expect(kq.mau.dong_thieu[0]).toMatchObject({ sbd: 'S1', qid: 'II-1' })
    expect(kq.mau.dong_thua[0]).toMatchObject({ sbd: 'S1', qid: 'I-5' })
    expect(kq.mau.ban_do_sai_thua[0]).toMatchObject({ sbd: 'S1', qid: 'I-6' })
  })

  it('điểm CHƯA CÓ và tổng khác tổng ba phần được đếm riêng', async () => {
    const d = dung()
    themLuot(d, 'S1', DUNG_S1, { tong: 10, i: 4.5, ii: 4, iii: 1 }) // 4,5 + 4 + 1 = 9,5 ≠ 10 và Phần III lưu 1 ≠ 1,5
    themLuot(d, 'S2', BAI_S2, { tong: null })
    const kq = await goiWorker(worker, d.env, '/ca/kiem-cham', { maCa: MA }, true)
    expect(kq.lech).toMatchObject({ tong_khac_tong_phan: 1, diem_phan_lech: 1, diem_chua_co: 1, diem_tong_lech: 0 })
    expect(kq.mau.diem_chua_co[0]).toMatchObject({ sbd: 'S2', moi: 7.75 })
  })
})

describe('chấm lại ca — chỉ chấm lượt MỚI NHẤT và chỉ khi đã nộp', () => {
  const luot = (sbd: string, lanThu: number, trangThai: string, dapAn: unknown): LuotChoCham => ({ sbd, hoTen: sbd, lanThu, trangThai, dapAn: dapAn as LuotChoCham['dapAn'], giayCau: null, diem: { I: null, II: null, III: null, tong: null } })
  const SC = { I: 2, II: 1, III: 1 }

  it('lượt mới nhất ĐANG LÀM (đã lưu tạm đáp án) ⇒ bỏ qua cả em: không chấm giữa chừng, không quay về lượt cũ', () => {
    const kq = chamLaiMotCa(MA, 'x', NH, [luot('S1', 1, 'da_nop', DUNG_S1), luot('S1', 2, 'dang_lam', { phanI: { 'I-1': 'A' }, phanII: {}, phanIII: {} })], SC)
    expect(kq.em).toEqual([])
    expect(kq.bai).toEqual([])
    expect(kq.tuChoi).toEqual([])
  })

  it('lượt đã nộp mới nhất thắng lượt cũ; lượt khoá cũng được chấm', () => {
    const sai = { phanI: { 'I-1': 'B', 'I-2': 'B' }, phanII: {}, phanIII: {} }
    const kq = chamLaiMotCa(MA, 'x', NH, [luot('S1', 1, 'da_nop', sai), luot('S1', 2, 'khoa', DUNG_S1)], SC)
    expect(kq.em).toHaveLength(1)
    expect(kq.em[0]).toMatchObject({ sbd: 'S1', moi: { tong: 10 } })
    expect(kq.bai[0]!.lanThu).toBe(2)
  })
})

describe('hợp nhất tờ đáp án — câu CHỈ có ở gói mới được nối đuôi', () => {
  it('thứ tự cũ giữ nguyên, câu chỉ ở tờ cũ vẫn giữ, câu mới nối sau, nội dung mới thắng', () => {
    const cu = { phanI: [mcq('a'), mcq('b')], phanII: [], phanIII: [] }
    const moi = { phanI: [mcq('c'), mcq('a', 'B')], phanII: [tf('x')], phanIII: [sa('s', '1')] }
    const r = hopNhatKeyBank(cu, moi)! as { phanI: { id: string; correct: string }[]; phanII: { id: string }[]; phanIII: { id: string }[] }
    expect(r.phanI.map((q) => q.id)).toEqual(['a', 'b', 'c'])
    expect(r.phanI[0]!.correct).toBe('B')
    expect(r.phanII.map((q) => q.id)).toEqual(['x'])
    expect(r.phanIII.map((q) => q.id)).toEqual(['s'])
  })
})

describe('/ca/nap-day-du — cũng HỢP NHẤT tờ đáp án, không ghi đè mù', () => {
  const docKey = (d: D1That) => {
    const tho = d.objects.get(`key/${MA}.json`)
    return (typeof tho === 'string' ? JSON.parse(tho) : tho) as typeof NH
  }
  it('gói TRẦN của máy thầy giữ soCau + boTheoEm của tờ đang giữ, nhưng nhận đáp án mới', async () => {
    const d = dung()
    const goiTran = { phanI: NH.phanI.map((q) => (q.id === 'I-2' ? { ...q, correct: 'D' } : q)), phanII: NH.phanII, phanIII: NH.phanIII }
    const kq = await goiWorker(worker, d.env, '/ca/nap-day-du', { maCa: MA, luot: [], keyBank: goiTran }, true)
    expect(kq.ok).toBe(true)
    const sau = docKey(d)
    expect(sau.soCau).toEqual({ I: 2, II: 1, III: 1 })
    expect(sau.boTheoEm).toEqual({ bo: { S1: BO_S1 } })
    expect(sau.phanI.find((q) => q.id === 'I-2')!.correct).toBe('D')
  })
  it('gói hỏng KHÔNG ghi đè tờ cũ', async () => {
    const d = dung()
    await goiWorker(worker, d.env, '/ca/nap-day-du', { maCa: MA, luot: [], keyBank: { x: 1 } }, true)
    expect(d.objects.get(`key/${MA}.json`)).toEqual(NH)
  })
})

describe('máy em gửi nốt bài của lượt CŨ — gói gửi lên mang khoá đúng lượt', () => {
  it('nopMoi kèm `khoaLuot` khi được truyền; không truyền thì KHÔNG có khoá (máy chủ lấy lượt mới nhất như cũ)', async () => {
    quenCaVang()
    const goi: Record<string, unknown>[] = []
    const cu = globalThis.fetch
    globalThis.fetch = (async (_u: unknown, init?: RequestInit) => {
      goi.push(JSON.parse(String(init?.body ?? '{}')))
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } })
    }) as typeof fetch
    try {
      const BAT = chuanHoaMayChu({ BAT: true, URL: 'https://x.workers.dev', SO_LAN_THU: 1, HAN_GIAY: 1 })
      await nopMoi(BAT, 'C1', 'E1', { c1: 'A' }, {}, undefined, 'C1|E1|1')
      await nopMoi(BAT, 'C1', 'E1', { c1: 'A' }, {})
    } finally {
      globalThis.fetch = cu
    }
    expect(goi).toHaveLength(2)
    expect(goi[0]).toMatchObject({ maCa: 'C1', sbd: 'E1', khoaLuot: 'C1|E1|1' })
    expect('khoaLuot' in goi[1]!).toBe(false)
  })
})

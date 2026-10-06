// @vitest-environment node
// BỔ SUNG TỜ ĐÁP ÁN TỪ `kho_ca_them` (thầy 06/10: "không được phép chấm sai cho bất kì bài kiểm tra nào").
//
// Lỗi thật đo trên ca 269409: đề công khai 1 146 câu, tờ đáp án R2 chỉ 929 — mất đúng 217 câu NỐI THÊM (`noiKhoCa`) do các đường ghi tờ đáp án ghi đè mù;
// cả 26 em đã nộp đều có câu thiếu nên máy chủ từ chối chấm (đúng) và máy em không hiện được đáp án. Bảng `kho_ca_them` còn đủ 217/217 đáp án.
// Khoá: (1) hàm thuần chỉ THÊM câu thiếu, đúng khuôn, không ghi đè; (2) `/ca/kiem-cham` chấm được nhờ bổ sung trong bộ nhớ và so được `dap_an_dung` đã ghi;
// (3) `/ca/phuc-hoi-key` mặc định chỉ xem trước, ghi thì sao lưu + chỉ thêm + không chạy khi ca mở.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { boSungKeyTuKhoCaThem, type DongKhoCaThem } from '../server/src/key-bank-bo-sung'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const MA = 'CA1'
const NOP = '2026-10-06T03:00:00.000Z'
const mcq = (id: string, correct = 'A') => ({ id, text: id, choices: ['a', 'b', 'c', 'd'], correct, chuyenDe: 'Este', mucDo: 'hieu' })
const tf = (id: string) => ({ id, text: id, ideas: ['1', '2', '3', '4'], correct: ['D', 'S', 'D', 'S'], chuyenDe: 'Este', mucDo: 'hieu' })
const sa = (id: string, correct: string) => ({ id, text: id, correct, chuyenDe: 'Este', mucDo: 'van_dung' })

const KEY = {
  phanI: ['I-1', 'I-2'].map((x) => mcq(x)),
  phanII: [tf('II-1')],
  phanIII: [sa('III-1', '0,54')],
  soCau: { I: 2, II: 1, III: 1 },
  boTheoEm: { bo: { S5: ['I-1', 'X-I-1', 'X-II-1', 'X-III-1'] } },
}
/** Ba câu NỐI THÊM: tờ đáp án R2 đã mất, bảng `kho_ca_them` còn. */
const DONG: DongKhoCaThem[] = [
  { qid: 'X-I-1', cau_json: JSON.stringify({ id: 'X-I-1', text: 'câu I ngoài kho', choices: ['a', 'b', 'c', 'd'] }), dap_an: 'B' },
  { qid: 'X-II-1', cau_json: JSON.stringify({ id: 'X-II-1', text: 'câu II ngoài kho', ideas: ['1', '2', '3', '4'] }), dap_an: 'DSDD' },
  { qid: 'X-III-1', cau_json: JSON.stringify({ id: 'X-III-1', text: 'câu III ngoài kho' }), dap_an: '3,5' },
]
const BAI_S5 = { phanI: { 'I-1': 'A', 'X-I-1': 'B' }, phanII: { 'X-II-1': ['D', 'S', 'D', 'D'] }, phanIII: { 'X-III-1': '3,50' } } // đúng cả: 10,00

describe('boSungKeyTuKhoCaThem — hàm thuần', () => {
  it('thêm ĐÚNG câu thiếu vào đúng phần, nối đuôi, giữ nguyên câu cũ và các trường khác', () => {
    const r = boSungKeyTuKhoCaThem(KEY, DONG)!
    expect(r.soBoSung).toBe(3)
    expect(r.soBoQua).toBe(0)
    expect(r.them).toEqual({ I: 1, II: 1, III: 1 })
    const g = r.giaTri as typeof KEY
    expect(g.phanI.map((q) => q.id)).toEqual(['I-1', 'I-2', 'X-I-1'])
    expect(g.phanII.map((q) => q.id)).toEqual(['II-1', 'X-II-1'])
    expect(g.phanIII.map((q) => q.id)).toEqual(['III-1', 'X-III-1'])
    expect((g.phanI[2] as { correct: string }).correct).toBe('B')
    expect((g.phanII[1] as { correct: string[] }).correct).toEqual(['D', 'S', 'D', 'D'])
    expect((g.phanIII[1] as { correct: string }).correct).toBe('3,5')
    expect(g.soCau).toEqual(KEY.soCau)
    expect(g.boTheoEm).toEqual(KEY.boTheoEm)
    expect(KEY.phanI).toHaveLength(2) // đầu vào không bị sửa
  })

  it('KHÔNG BAO GIỜ ghi đè câu có sẵn, kể cả khi bảng nối thêm ghi đáp án khác', () => {
    const r = boSungKeyTuKhoCaThem(KEY, [{ qid: 'I-1', cau_json: JSON.stringify({ id: 'I-1', choices: ['a', 'b', 'c', 'd'] }), dap_an: 'D' }])!
    expect(r.soBoSung).toBe(0)
    expect((r.giaTri.phanI as { id: string; correct: string }[])[0]).toMatchObject({ id: 'I-1', correct: 'A' })
  })

  it('sai khuôn ⇒ BỎ và đếm, không đoán: không đáp án · JSON hỏng · chữ cái mà câu không có `choices` · D/S mà câu không có `ideas` · Phần III không phải số', () => {
    const dong: DongKhoCaThem[] = [
      { qid: 'a1', cau_json: JSON.stringify({ choices: [1, 2, 3, 4] }), dap_an: '' },
      { qid: 'a2', cau_json: '{hỏng', dap_an: 'B' },
      { qid: 'a3', cau_json: JSON.stringify({ text: 'không choices' }), dap_an: 'B' },
      { qid: 'a4', cau_json: JSON.stringify({ text: 'không ideas' }), dap_an: 'DSDS' },
      { qid: 'a5', cau_json: JSON.stringify({ text: 'chữ' }), dap_an: 'abc' },
      { qid: 'a6', cau_json: JSON.stringify({ text: 'có choices mà đáp án số', choices: [1, 2, 3, 4] }), dap_an: '3,5' },
      { qid: '', cau_json: JSON.stringify({ text: 'không mã' }), dap_an: 'B' },
      { qid: 'a7', cau_json: JSON.stringify({ text: 'thiếu một ý', ideas: [1, 2, 3, 4] }), dap_an: 'DSD' }, // Phần II phải ĐỦ bốn ký tự
    ]
    const r = boSungKeyTuKhoCaThem(KEY, dong)!
    expect(r.soBoSung).toBe(0)
    expect(r.soBoQua).toBe(7) // dòng không mã bị lờ đi, không tính là "bỏ qua"
  })

  it('chữ thường chấp nhận ("b" → "B", "dsds" → D/S); chuyên đề / mức độ lấy từ dòng chi tiết khi câu chưa có', () => {
    const dong: DongKhoCaThem[] = [
      { qid: 'm1', cau_json: JSON.stringify({ choices: [1, 2, 3, 4] }), dap_an: 'b', chuyen_de: 'Amin', muc_do: 'van_dung' },
      { qid: 'm2', cau_json: JSON.stringify({ ideas: [1, 2, 3, 4], chuyenDe: 'Giữ' }), dap_an: 'dsds', chuyen_de: 'Khác' },
    ]
    const r = boSungKeyTuKhoCaThem(KEY, dong)!
    expect((r.giaTri.phanI as Record<string, unknown>[])[2]).toMatchObject({ id: 'm1', correct: 'B', chuyenDe: 'Amin', mucDo: 'van_dung' })
    expect((r.giaTri.phanII as Record<string, unknown>[])[1]).toMatchObject({ id: 'm2', correct: ['D', 'S', 'D', 'S'], chuyenDe: 'Giữ' })
  })

  it('tờ đáp án không hợp lệ ⇒ null', () => {
    expect(boSungKeyTuKhoCaThem(null, DONG)).toBeNull()
    expect(boSungKeyTuKhoCaThem({ phanI: [] }, DONG)).toBeNull()
  })
})

function dung(): D1That {
  const d = taoD1That()
  d.sql
    .prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,so_cau_json,bo_theo_em_json,de_rieng,sinh_tai_d1,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,1,1,?)')
    .run(MA, 'Ca có câu nối thêm', 'dong', 'thi', 'ca_lop_xong', JSON.stringify(KEY.soCau), JSON.stringify(KEY.boTheoEm), NOP)
  d.objects.set(`key/${MA}.json`, KEY)
  return d
}
const themKho = (d: D1That, dong: DongKhoCaThem[] = DONG) => {
  for (const x of dong) d.sql.prepare('INSERT INTO kho_ca_them(khoa,ma_ca,qid,cau_json,dap_an,luc) VALUES(?,?,?,?,?,?)').run(`${MA}|${x.qid}`, MA, x.qid, x.cau_json, x.dap_an, NOP)
}
const themLuotS5 = (d: D1That, tong: number | null = 10) =>
  d.sql
    .prepare('INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,id_thiet_bi,vao_luc,nop_luc,trang_thai,cap_nhat_luc,ho_ten,tong,diem_i,diem_ii,diem_iii,dap_an_json) VALUES(?,?,?,1,?,?,?,?,?,?,?,?,?,?,?)')
    .run(`${MA}|S5|1`, MA, 'S5', 'MAY-S5', NOP, NOP, 'da_nop', NOP, 'Em S5', tong, tong === null ? null : 4.5, tong === null ? null : 4, tong === null ? null : 1.5, JSON.stringify(BAI_S5))
const themDong = (d: D1That, qid: string, phan: string, so: number, dungSai: number, dapAnDung: string) =>
  d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,chuyen_de,muc_do,dap_an_chon,dap_an_dung,dung_sai,giay,cap_nhat_luc) VALUES(?,?,'S5',1,?,?,?,'Este','hieu','x',?,?,5,?)").run(`${MA}|S5|1|${phan}|${so}`, MA, phan, so, qid, dapAnDung, dungSai, NOP)
const themDongDayDu = (d: D1That) => {
  themDong(d, 'I-1', 'I', 1, 1, 'A'); themDong(d, 'X-I-1', 'I', 2, 1, 'B'); themDong(d, 'X-II-1', 'II', 1, 1, 'DSDD'); themDong(d, 'X-III-1', 'III', 1, 1, '3,5')
}
const docKey = (d: D1That) => {
  const tho = d.objects.get(`key/${MA}.json`)
  return (typeof tho === 'string' ? JSON.parse(tho) : tho) as typeof KEY
}

describe('/ca/kiem-cham — bổ sung tờ đáp án trong bộ nhớ, không ghi gì', () => {
  it('KHÔNG có `kho_ca_them` ⇒ em bị TỪ CHỐI (thieu_trong_kho), không chấm đoán; CÓ ⇒ chấm được, 0 lệch', async () => {
    const d = dung()
    themLuotS5(d)
    themDongDayDu(d)
    const khong = await goiWorker(worker, d.env, '/ca/kiem-cham', { maCa: MA }, true)
    expect(khong.ok).toBe(true)
    expect(khong.soEmTuChoi).toBe(1)
    expect(khong.tuChoi[0].viSao).toContain('thieu_trong_kho')
    expect(khong.nguon.boSungTuKhoCaThem).toBe(0)

    themKho(d)
    const truoc = [d.chup('luot'), d.chup('chi_tiet_cau'), d.chup('kho_ca_them')]
    const co = await goiWorker(worker, d.env, '/ca/kiem-cham', { maCa: MA }, true)
    expect(co.nguon.boSungTuKhoCaThem).toBe(3)
    expect(co.nguon.boQuaKhoCaThem).toBe(0)
    expect(co.soEmChamDuoc).toBe(1)
    expect(co.soEmTuChoi).toBe(0)
    expect(co.boCau.da_ghi).toBe(1)
    expect(co.lech).toMatchObject({ diem_tong_lech: 0, diem_phan_lech: 0, dong_lech: 0, dong_thieu: 0, dong_thua: 0, dap_an_dung_lech: 0 })
    expect(co.soEmCoLech).toBe(0)
    expect([d.chup('luot'), d.chup('chi_tiet_cau'), d.chup('kho_ca_them')]).toEqual(truoc) // CHỈ ĐỌC
    expect(docKey(d).phanI).toHaveLength(2) // tờ R2 không đổi: bổ sung chỉ ở bộ nhớ
  })

  it('điểm lưu SAI được bắt (7,5 ≠ 10) và `dap_an_dung` đã ghi KHÁC khoá hiện hành được bắt riêng', async () => {
    const d = dung()
    themLuotS5(d, 7.5)
    themDong(d, 'I-1', 'I', 1, 1, 'A'); themDong(d, 'X-I-1', 'I', 2, 1, 'C'); themDong(d, 'X-II-1', 'II', 1, 1, 'D,S,D,D'); themDong(d, 'X-III-1', 'III', 1, 1, '3.5')
    themKho(d)
    const kq = await goiWorker(worker, d.env, '/ca/kiem-cham', { maCa: MA }, true)
    expect(kq.lech.diem_tong_lech).toBe(1)
    expect(kq.mau.diem_tong_lech[0]).toMatchObject({ sbd: 'S5', luu: 7.5, moi: 10 })
    // "C" ≠ "B" ⇒ lệch; "D,S,D,D" ≡ "DSDD" và "3.5" ≡ "3,5" ⇒ không lệch
    expect(kq.lech.dap_an_dung_lech).toBe(1)
    expect(kq.mau.dap_an_dung_lech[0]).toMatchObject({ sbd: 'S5', qid: 'X-I-1' })
    expect(JSON.stringify(kq)).not.toContain('"C"') // không lộ đáp án
  })

  it('bảng `kho_ca_them` vắng / lỗi ⇒ không làm hỏng công cụ kiểm', async () => {
    const d = dung()
    themLuotS5(d)
    d.sql.exec('DROP TABLE kho_ca_them')
    const kq = await goiWorker(worker, d.env, '/ca/kiem-cham', { maCa: MA }, true)
    expect(kq.ok).toBe(true)
    expect(kq.nguon.boSungTuKhoCaThem).toBe(0)
    expect(kq.soEmTuChoi).toBe(1)
  })
})

describe('/ca/phuc-hoi-key — mặc định chỉ xem trước; ghi thì sao lưu + chỉ thêm', () => {
  it('xem trước: đếm đúng, KHÔNG ghi R2, không tạo bản sao lưu', async () => {
    const d = dung()
    themKho(d)
    const kq = await goiWorker(worker, d.env, '/ca/phuc-hoi-key', { maCa: MA }, true)
    expect(kq).toMatchObject({ ok: true, xemTruoc: true, daGhi: false, soBoSung: 3, soBoQua: 0, truoc: { I: 2, II: 1, III: 1 }, sau: { I: 3, II: 2, III: 2 } })
    expect(docKey(d)).toEqual(KEY)
    expect([...d.objects.keys()].filter((k) => k.startsWith('sao-luu-key/'))).toEqual([])
  })

  it('ghi: tờ mới có đủ câu, giữ soCau + boTheoEm, sao lưu nguyên văn tờ cũ; chạy lại ⇒ không thêm nữa', async () => {
    const d = dung()
    themKho(d)
    const kq = await goiWorker(worker, d.env, '/ca/phuc-hoi-key', { maCa: MA, ghi: true }, true)
    expect(kq).toMatchObject({ ok: true, xemTruoc: false, daGhi: true, soBoSung: 3 })
    const sau = docKey(d)
    expect(sau.phanI.map((q) => q.id)).toEqual(['I-1', 'I-2', 'X-I-1'])
    expect(sau.phanII.map((q) => q.id)).toEqual(['II-1', 'X-II-1'])
    expect(sau.phanIII.map((q) => q.id)).toEqual(['III-1', 'X-III-1'])
    expect(sau.soCau).toEqual(KEY.soCau)
    expect(sau.boTheoEm).toEqual(KEY.boTheoEm)
    const sl = [...d.objects.keys()].filter((k) => k.startsWith(`sao-luu-key/${MA}/`))
    expect(sl).toHaveLength(1)
    expect(kq.saoLuu).toBe(sl[0])
    const goc = d.objects.get(sl[0]!)
    expect(typeof goc === 'string' ? JSON.parse(goc) : goc).toEqual(KEY) // sao lưu = tờ cũ nguyên vẹn
    const lai = await goiWorker(worker, d.env, '/ca/phuc-hoi-key', { maCa: MA, ghi: true }, true)
    expect(lai).toMatchObject({ ok: true, daGhi: false, soBoSung: 0 })
    expect([...d.objects.keys()].filter((k) => k.startsWith('sao-luu-key/'))).toHaveLength(1) // không sao lưu thừa
  })

  it('SAU khi phục hồi, chấm lại ca chạy được bằng tờ R2 thật (xem trước, không cần bổ sung trong bộ nhớ)', async () => {
    const d = dung()
    themLuotS5(d, 7.5)
    themKho(d)
    await goiWorker(worker, d.env, '/ca/phuc-hoi-key', { maCa: MA, ghi: true }, true)
    d.sql.exec('DROP TABLE kho_ca_them') // chứng minh: không còn dựa vào bảng nữa
    const kq = await goiWorker(worker, d.env, '/ca/cham-lai', { maCa: MA, xemTruoc: true }, true)
    expect(kq.ok).toBe(true)
    expect(kq.tuChoi).toEqual([])
    expect(kq.em.find((e: { sbd: string }) => e.sbd === 'S5')).toMatchObject({ cu: { tong: 7.5 }, moi: { tong: 10 }, doi: true })
  })

  it('tờ đáp án R2 thiếu / hỏng / sai khuôn ⇒ nói đúng lý do, KHÔNG ghi gì (không bịa tờ mới từ bảng nối thêm)', async () => {
    const d = dung()
    themKho(d)
    d.objects.delete(`key/${MA}.json`)
    expect(await goiWorker(worker, d.env, '/ca/phuc-hoi-key', { maCa: MA, ghi: true }, true)).toMatchObject({ ok: false, lyDo: 'chua_co_dap_an' })
    d.objects.set(`key/${MA}.json`, '{hỏng')
    expect(await goiWorker(worker, d.env, '/ca/phuc-hoi-key', { maCa: MA, ghi: true }, true)).toMatchObject({ ok: false, lyDo: 'dap_an_hong' })
    d.objects.set(`key/${MA}.json`, JSON.stringify({ phanI: [] }))
    expect(await goiWorker(worker, d.env, '/ca/phuc-hoi-key', { maCa: MA, ghi: true }, true)).toMatchObject({ ok: false, lyDo: 'dap_an_hong' })
    expect(d.objects.get(`key/${MA}.json`)).toBe(JSON.stringify({ phanI: [] })) // không đụng
    expect([...d.objects.keys()].filter((k) => k.startsWith('sao-luu-key/'))).toEqual([])
  })

  it('ca ĐANG MỞ ⇒ từ chối ghi, R2 nguyên vẹn; không có mã bí mật ⇒ 403; thiếu mã ca / ca lạ ⇒ từ chối', async () => {
    const d = dung()
    themKho(d)
    d.sql.prepare("UPDATE ca SET trang_thai = 'mo' WHERE ma_ca = ?").run(MA)
    const mo = await goiWorker(worker, d.env, '/ca/phuc-hoi-key', { maCa: MA, ghi: true }, true)
    expect(mo).toMatchObject({ ok: false, lyDo: 'ca_dang_mo' })
    expect(docKey(d)).toEqual(KEY)
    const xem = await goiWorker(worker, d.env, '/ca/phuc-hoi-key', { maCa: MA }, true)
    expect(xem).toMatchObject({ ok: true, xemTruoc: true, soBoSung: 3 }) // xem trước vẫn được khi ca mở
    const r = await worker.fetch(new Request('https://test/ca/phuc-hoi-key', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ maCa: MA, ghi: true }) }), d.env)
    expect(r.status).toBe(403)
    expect((await goiWorker(worker, d.env, '/ca/phuc-hoi-key', {}, true)).ok).toBe(false)
    expect((await goiWorker(worker, d.env, '/ca/phuc-hoi-key', { maCa: 'KHONG-CO' }, true)).lyDo).toBe('khong_co_ca')
  })
})

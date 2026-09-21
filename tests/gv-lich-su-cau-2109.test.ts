// @vitest-environment node
// `POST /gv/lich-su-cau-cua-em` (Gọi lên bảng: "em này đã làm câu này chưa, đúng hay sai", quét HẾT lịch sử, KHÔNG áp mốc 12:00): ĐỌC-CHỈ, ≤ 200 cặp, đúng thứ tự cặp vào, ≤ 3 truy vấn (mỗi truy vấn ≤ 5 term UNION),
// KHÔNG lộ đúng/sai của bài về nhà CHƯA nộp · gói gia đình CHƯA nộp · ca CHƯA công bố · câu tự luận. SQLite thật (tests/_d1-that.ts, có chốt 5 term của D1).
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { gvLichSuCauCuaEm, TOI_DA_CAP_LICH_SU } from '../server/src/gv-lich-su-cau'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

let dem = 0
/** Một sự kiện của sổ học (mọi nguồn). `ngay` = ngày VN; `luc` mặc định 03:00Z ngày đó. */
const sk = (d: D1That, o: { sbd?: string; qid: string; nguon: string; ma?: string; kq: 0 | 1 | null; ngay: string; luc?: string; lan?: number }) =>
  d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(`k${++dem}`, o.sbd ?? 'S1', o.qid, o.nguon, o.ma ?? 'm', o.lan ?? 1, o.kq, 30, o.luc ?? `${o.ngay}T03:00:00.000Z`, o.ngay, 'D.1')
const goi = (d: D1That, b: Record<string, unknown>, thay = true) => goiWorker(worker, d.env, '/gv/lich-su-cau-cua-em', b, thay) as Promise<any>
const mot = async (d: D1That, qid: string, sbd = 'S1') => (await goi(d, { cap: [{ sbd, qid }] })).ketQua[0]
const themCa = (d: D1That, ma: string, congBo: string, tt = 'mo') =>
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,cap_nhat_luc) VALUES(?,?,?,'thi',?,'x')").run(ma, `Ca ${ma}`, tt, congBo)
const themBtvn = (d: D1That, ma: string, nop: string | null) => {
  d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc) VALUES(?,?,'DE',5,'2026-09-15T00:00:00.000Z','2026-09-30T00:00:00.000Z',0,'x')").run(ma, `CA-${ma}`)
  d.sql.prepare('INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten,nop_luc) VALUES(?,?,?,?,?)').run(`${ma}|S1`, ma, 'S1', 'Em', nop)
}

describe('kết quả từng cặp', () => {
  it('chưa làm: daLam false, soLan 0, lanCuoi và lenBang null', async () => {
    const d = taoD1That()
    expect(await mot(d, 'Q-CHUA')).toEqual({ sbd: 'S1', qid: 'Q-CHUA', daLam: false, soLan: 0, soDung: 0, soSai: 0, lanCuoi: null, lenBang: null })
  })

  it('đúng / sai / vừa đúng vừa sai: đếm đủ, lần gần nhất theo THỜI GIAN (không theo thứ tự ghi), ngày VN và nguồn của lần đó', async () => {
    const d = taoD1That()
    sk(d, { qid: 'Q-DUNG', nguon: 'on_lai', kq: 1, ngay: '2026-09-19' })
    sk(d, { qid: 'Q-SAI', nguon: 'game', kq: 0, ngay: '2026-09-20' })
    // vừa đúng vừa sai: ghi lần MỚI trước, lần cũ sau ⇒ vẫn lấy lần mới (theo luc)
    sk(d, { qid: 'Q-HAI', nguon: 'luyen', kq: 1, ngay: '2026-09-20', luc: '2026-09-20T09:00:00.000Z', ma: 'm2', lan: 1 })
    sk(d, { qid: 'Q-HAI', nguon: 'on_lai', kq: 0, ngay: '2026-09-18', luc: '2026-09-18T03:00:00.000Z' })
    sk(d, { qid: 'Q-HAI', nguon: 'game', kq: 0, ngay: '2026-09-19', luc: '2026-09-19T03:00:00.000Z' })
    expect(await mot(d, 'Q-DUNG')).toMatchObject({ daLam: true, soLan: 1, soDung: 1, soSai: 0, lanCuoi: { dung: true, ngay: '2026-09-19', nguon: 'on_lai' }, lenBang: null })
    expect(await mot(d, 'Q-SAI')).toMatchObject({ soLan: 1, soDung: 0, soSai: 1, lanCuoi: { dung: false, ngay: '2026-09-20', nguon: 'game' } })
    expect(await mot(d, 'Q-HAI')).toMatchObject({ soLan: 3, soDung: 1, soSai: 2, lanCuoi: { dung: true, ngay: '2026-09-20', nguon: 'luyen' } })
  })

  it('CÙNG một ngày: lần gần nhất là lần có luc muộn hơn dù thứ tự chỉ mục (ngày, kết quả) xếp lần "đúng" sau', async () => {
    const d = taoD1That()
    sk(d, { qid: 'Q-NGAY', nguon: 'on_lai', kq: 1, ngay: '2026-09-20', luc: '2026-09-20T02:00:00.000Z', ma: 'a' })
    sk(d, { qid: 'Q-NGAY', nguon: 'game', kq: 0, ngay: '2026-09-20', luc: '2026-09-20T08:00:00.000Z', ma: 'b' })
    expect(await mot(d, 'Q-NGAY')).toMatchObject({ soLan: 2, soDung: 1, soSai: 1, lanCuoi: { dung: false, nguon: 'game' } })
  })

  it('KHÔNG áp mốc 12:00 21/09: sự kiện từ 12/09 vẫn được đếm', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('hien_thi_tu','2026-09-21T05:00:00.000Z','x')").run()
    sk(d, { qid: 'Q-CU', nguon: 'on_lai', kq: 0, ngay: '2026-09-12' })
    expect(await mot(d, 'Q-CU')).toMatchObject({ daLam: true, soLan: 1, soSai: 1, lanCuoi: { dung: false, ngay: '2026-09-12' } })
  })

  it('đúng em, đúng câu: sự kiện của em khác hoặc câu khác không lẫn vào', async () => {
    const d = taoD1That()
    sk(d, { sbd: 'S2', qid: 'Q1', nguon: 'on_lai', kq: 1, ngay: '2026-09-19' })
    sk(d, { sbd: 'S1', qid: 'Q2', nguon: 'on_lai', kq: 1, ngay: '2026-09-19' })
    expect(await mot(d, 'Q1', 'S1')).toMatchObject({ daLam: false, soLan: 0 })
    expect(await mot(d, 'Q1', 'S2')).toMatchObject({ daLam: true, soLan: 1 })
  })
})

describe('KHÔNG lộ đúng/sai của bài đang mở (dung: null)', () => {
  it('bài về nhà CHƯA nộp: vẫn "đã làm" (soLan) nhưng soDung/soSai = 0 và lanCuoi.dung null; nộp rồi thì hiện', async () => {
    const d = taoD1That()
    themBtvn(d, 'BT1', null)
    sk(d, { qid: 'Q-BT', nguon: 'btvn', ma: 'BT1', kq: 0, ngay: '2026-09-20' })
    sk(d, { qid: 'Q-LO', nguon: 'btvn_lo', ma: 'BT1', kq: 1, ngay: '2026-09-20' })
    expect(await mot(d, 'Q-BT')).toMatchObject({ daLam: true, soLan: 1, soDung: 0, soSai: 0, lanCuoi: { dung: null, nguon: 'btvn' } })
    expect(await mot(d, 'Q-LO')).toMatchObject({ daLam: true, soLan: 1, soDung: 0, soSai: 0, lanCuoi: { dung: null, nguon: 'btvn_lo' } })
    d.sql.prepare("UPDATE btvn_em SET nop_luc = '2026-09-21T02:00:00.000Z'").run()
    expect(await mot(d, 'Q-BT')).toMatchObject({ soSai: 1, lanCuoi: { dung: false } })
    expect(await mot(d, 'Q-LO')).toMatchObject({ soDung: 1, lanCuoi: { dung: true } })
  })

  it('bài về nhà KHÔNG còn dòng trong bảng gốc (đã dọn ở reset): đọc như đã nộp, kết quả trong sổ hiện', async () => {
    const d = taoD1That()
    sk(d, { qid: 'Q-COLD', nguon: 'btvn', ma: 'BT-DA-DON', kq: 1, ngay: '2026-09-17' })
    expect(await mot(d, 'Q-COLD')).toMatchObject({ soDung: 1, lanCuoi: { dung: true, ngay: '2026-09-17' } })
  })

  it('ca kiểm tra CHƯA công bố ⇒ null; công bố ngay / đã đóng ⇒ hiện', async () => {
    const d = taoD1That()
    themCa(d, 'CA-KHONG', 'khong'); themCa(d, 'CA-NGAY', 'ngay'); themCa(d, 'CA-DONG', 'ca_lop_xong', 'dong')
    d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,cap_nhat_luc) VALUES('CA-DONG|S9|1','CA-DONG','S9',1,'x','dang_lam','x')").run() // còn người chưa nộp nhưng ca đã ĐÓNG ⇒ công bố
    sk(d, { qid: 'Q-K', nguon: 'thi', ma: 'CA-KHONG', kq: 0, ngay: '2026-09-18' })
    sk(d, { qid: 'Q-N', nguon: 'thi', ma: 'CA-NGAY', kq: 0, ngay: '2026-09-18' })
    sk(d, { qid: 'Q-D', nguon: 'thi', ma: 'CA-DONG', kq: 1, ngay: '2026-09-18' })
    expect(await mot(d, 'Q-K')).toMatchObject({ daLam: true, soLan: 1, soDung: 0, soSai: 0, lanCuoi: { dung: null, nguon: 'thi' } })
    expect(await mot(d, 'Q-N')).toMatchObject({ soSai: 1, lanCuoi: { dung: false } })
    expect(await mot(d, 'Q-D')).toMatchObject({ soDung: 1, lanCuoi: { dung: true } })
  })

  it('gói gia đình giao (mom) CHƯA nộp ⇒ null; nộp rồi thì hiện', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO mom_bai(sbd,id,title,created_at,question_count,bank_key,submitted_at,answers) VALUES('S1','G1','Gói',?,3,'k',NULL,'{}')").run('2026-09-20T01:00:00.000Z')
    sk(d, { qid: 'Q-M', nguon: 'mom', ma: 'G1', kq: 1, ngay: '2026-09-20' })
    expect(await mot(d, 'Q-M')).toMatchObject({ daLam: true, soLan: 1, soDung: 0, lanCuoi: { dung: null } })
    d.sql.prepare("UPDATE mom_bai SET submitted_at = '2026-09-20T02:00:00.000Z'").run()
    expect(await mot(d, 'Q-M')).toMatchObject({ soDung: 1, lanCuoi: { dung: true } })
  })

  it('câu tự luận / bỏ trống (ket_qua rỗng): daLam + soLan, không đúng/sai', async () => {
    const d = taoD1That()
    sk(d, { qid: 'Q-TL', nguon: 'luyen', kq: null, ngay: '2026-09-19' })
    expect(await mot(d, 'Q-TL')).toMatchObject({ daLam: true, soLan: 1, soDung: 0, soSai: 0, lanCuoi: { dung: null, ngay: '2026-09-19', nguon: 'luyen' } })
  })

  it('lần MỚI NHẤT là bài chưa nộp còn lần cũ hơn là ôn lại đã hiện: lanCuoi.dung null (lần cuối bị che) nhưng soDung/soSai chỉ gồm lần được thấy', async () => {
    const d = taoD1That()
    themBtvn(d, 'BT2', null)
    sk(d, { qid: 'Q-X', nguon: 'on_lai', kq: 1, ngay: '2026-09-18' })
    sk(d, { qid: 'Q-X', nguon: 'btvn', ma: 'BT2', kq: 0, ngay: '2026-09-20' })
    expect(await mot(d, 'Q-X')).toMatchObject({ soLan: 2, soDung: 1, soSai: 0, lanCuoi: { dung: null, ngay: '2026-09-20', nguon: 'btvn' } })
  })
})

describe('lên bảng (bảng len_bang)', () => {
  it('có lần lên bảng: lenBang {soLan, datLanCuoi theo lần MỚI NHẤT}; soLan KHÔNG gồm lên bảng; daLam true kể cả khi chỉ có lên bảng', async () => {
    const d = taoD1That()
    const lb = d.sql.prepare('INSERT INTO len_bang(sbd,chuyen_de,qid,dat,luc) VALUES(?,?,?,?,?)')
    lb.run('S1', 'CD', 'Q-LB', 0, '2026-09-18T03:00:00.000Z'); lb.run('S1', 'CD', 'Q-LB', 1, '2026-09-20T03:00:00.000Z')
    lb.run('S1', 'CD', 'Q-LB2', 1, '2026-09-18T03:00:00.000Z'); lb.run('S1', 'CD', 'Q-LB2', 0, '2026-09-19T03:00:00.000Z')
    lb.run('S2', 'CD', 'Q-LB', 0, '2026-09-21T03:00:00.000Z') // em khác
    expect(await mot(d, 'Q-LB')).toEqual({ sbd: 'S1', qid: 'Q-LB', daLam: true, soLan: 0, soDung: 0, soSai: 0, lanCuoi: null, lenBang: { soLan: 2, datLanCuoi: true } })
    expect((await mot(d, 'Q-LB2')).lenBang).toEqual({ soLan: 2, datLanCuoi: false })
    sk(d, { qid: 'Q-LB', nguon: 'on_lai', kq: 0, ngay: '2026-09-19' })
    expect(await mot(d, 'Q-LB')).toMatchObject({ soLan: 1, soSai: 1, lenBang: { soLan: 2, datLanCuoi: true } })
  })

  it('sổ học cũng có dòng nguồn len_bang: tính "đã làm" nhưng KHÔNG vào soLan / soDung / soSai / lanCuoi (lên bảng đi riêng ở lenBang)', async () => {
    const d = taoD1That()
    sk(d, { qid: 'Q-SLB', nguon: 'len_bang', kq: 1, ngay: '2026-09-20' })
    expect(await mot(d, 'Q-SLB')).toMatchObject({ daLam: true, soLan: 0, soDung: 0, soSai: 0, lanCuoi: null, lenBang: null })
  })
})

describe('vào / ra', () => {
  it('đúng THỨ TỰ cặp vào, kể cả cặp trùng (mỗi cặp vào một phần tử)', async () => {
    const d = taoD1That()
    sk(d, { qid: 'A', nguon: 'on_lai', kq: 1, ngay: '2026-09-19' })
    sk(d, { qid: 'B', nguon: 'on_lai', kq: 0, ngay: '2026-09-19' })
    const r = await goi(d, { cap: [{ sbd: 'S1', qid: 'B' }, { sbd: 'S1', qid: 'A' }, { sbd: 'S1', qid: 'B' }, { sbd: 'S2', qid: 'A' }] })
    expect(r.ok).toBe(true)
    expect(r.ketQua.map((x: { sbd: string; qid: string; daLam: boolean }) => `${x.sbd}:${x.qid}:${x.daLam}`)).toEqual(['S1:B:true', 'S1:A:true', 'S1:B:true', 'S2:A:false'])
  })

  it('tối đa 200 cặp (200 chạy, 201 ⇒ qua_nhieu_cap); rỗng / không phải mảng / cặp thiếu ⇒ thieu', async () => {
    const d = taoD1That()
    const nCap = (n: number) => Array.from({ length: n }, (_, i) => ({ sbd: 'S1', qid: `Q${i}` }))
    expect(TOI_DA_CAP_LICH_SU).toBe(200)
    expect((await goi(d, { cap: nCap(200) })).ketQua).toHaveLength(200)
    expect(await goi(d, { cap: nCap(201) })).toMatchObject({ ok: false, lyDo: 'qua_nhieu_cap' })
    for (const cap of [[], undefined, 'x', [{ sbd: 'S1' }], [{ qid: 'Q' }], [{ sbd: '', qid: 'Q' }]]) expect(await goi(d, { cap }), JSON.stringify(cap)).toMatchObject({ ok: false, lyDo: 'thieu' })
  })

  it('sai / thiếu mã bí mật ⇒ từ chối (không trả dữ liệu)', async () => {
    const d = taoD1That()
    sk(d, { qid: 'Q1', nguon: 'on_lai', kq: 1, ngay: '2026-09-19' })
    const r = await goi(d, { cap: [{ sbd: 'S1', qid: 'Q1' }] }, false)
    expect(r.ok).not.toBe(true)
    expect(JSON.stringify(r)).not.toContain('daLam')
  })

  it('lỗi đọc dữ liệu ⇒ ok:false cho CẢ lệnh (không trả nửa vời)', async () => {
    const d = taoD1That(); d.sql.exec('DROP TABLE su_kien_hoc')
    expect(await gvLichSuCauCuaEm(d.env, { cap: [{ sbd: 'S1', qid: 'Q1' }] })).toMatchObject({ ok: false, lyDo: 'loi_doc' })
  })

  it('không lộ trường nào ngoài hợp đồng (không đáp án, không lời giải, không mã bài)', async () => {
    const d = taoD1That()
    themBtvn(d, 'BT9', null)
    sk(d, { qid: 'Q1', nguon: 'btvn', ma: 'BT9', kq: 1, ngay: '2026-09-19' })
    const x = await mot(d, 'Q1')
    expect(Object.keys(x).sort()).toEqual(['daLam', 'lanCuoi', 'lenBang', 'qid', 'sbd', 'soDung', 'soLan', 'soSai'])
    expect(Object.keys(x.lanCuoi).sort()).toEqual(['dung', 'ngay', 'nguon'])
    expect(JSON.stringify(x)).not.toContain('BT9') // mã bài không rời máy chủ
  })
})

describe('chi phí: ≤ 3 truy vấn, chỉ đọc, ≤ 5 term UNION', () => {
  it('200 cặp trộn đủ nguồn: ≤ 3 truy vấn D1, chỉ SELECT (không câu ghi nào), và bảng không đổi', async () => {
    const d = taoD1That()
    themBtvn(d, 'BT1', null); themCa(d, 'CA-K', 'khong')
    d.sql.prepare("INSERT INTO mom_bai(sbd,id,title,created_at,question_count,bank_key,answers) VALUES('S1','G1','Gói','2026-09-20T01:00:00.000Z',3,'k','{}')").run()
    for (let i = 0; i < 200; i++) sk(d, { qid: `Q${i}`, nguon: ['on_lai', 'btvn', 'thi', 'mom', 'game'][i % 5]!, ma: ['m', 'BT1', 'CA-K', 'G1', 's'][i % 5]!, kq: (i % 2) as 0 | 1, ngay: '2026-09-19' })
    d.sql.prepare("INSERT INTO len_bang(sbd,chuyen_de,qid,dat,luc) VALUES('S1','CD','Q0',1,'2026-09-19T03:00:00.000Z')").run()
    const log: string[] = []
    const goc = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = ((q: string) => { log.push(q); return goc(q) }) as typeof d.env.DB.prepare
    const truoc = ['su_kien_hoc', 'len_bang', 'btvn_em', 'mom_bai', 'ca'].map((b) => d.chup(b))
    const r = await gvLichSuCauCuaEm(d.env, { cap: Array.from({ length: 200 }, (_, i) => ({ sbd: 'S1', qid: `Q${i}` })) })
    expect(r.ok).toBe(true)
    expect(log.length).toBeLessThanOrEqual(3)
    expect(log.length).toBe(2)
    for (const q of log) expect(q).toMatch(/^\s*SELECT\b/i)
    expect(['su_kien_hoc', 'len_bang', 'btvn_em', 'mom_bai', 'ca'].map((b) => d.chup(b))).toEqual(truoc)
  })
})

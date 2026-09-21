// @vitest-environment node
// ĐỢT 2 "THẦN THÚ MỖI NGÀY" — MÁY CHỦ (prompt-than-thu-moi-ngay-2109.md; Điều 3, 4, 5): kho rút = phần LỚP đã học (bảng đệm lop_da_hoc), quota lượt/ngày (3 sẵn + mở thêm) ở máy chủ, trần 60 câu, chặn câu bài tập về nhà
// CHƯA nộp, EXP câu thử thách/Lượt trùm, `maiCho`, cờ lùi `cau_hinh.game_luot_moi = 'tat'`. SQLite thật (tests/_d1-that.ts); số viết thẳng.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { gameV2 } from '../server/src/game-v2'
import { demLuotHomNay, docCauBtvnChuaNop, docChuoiKeThua, docDangLop, docDauVaoLuot, luotMoiBat, maiCho } from '../server/src/game-v2-luot'
import { taoD1That, type D1That } from './_d1-that'

vi.mock('../server/src/game-v2-auth', async (orig) => ({
  ...(await orig<typeof import('../server/src/game-v2-auth')>()),
  gameIdentity: async (_e: unknown, b: Record<string, unknown>) => {
    if (b.token === 'token-S3') return 'S3'
    if (b.token !== 'token-S1') throw new Error('Phiên đăng nhập không hợp lệ.')
    return 'S1'
  },
}))
afterEach(() => vi.useRealTimers())
const gio = (s: string) => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${s}+07:00`)) }
const NGAY = '2026-09-22'
const TEN_LOP = '12 - Lớp Thường'
const cauJson = (qid: string, dang: string, mucDo: string) => ({ qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Đề ${qid}`, choices: ['A', 'B', 'C', 'D'], ideas: [], hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo, sao: 1, kienThuc: ['K1'], correct: 'B', solution: { chot: 'Giải' }, reviewed: true })

/** Lớp 12 (mặc định "12 - Lớp Thường"): em S1 + bạn S2. Kho: A-0…A-39 dạng A.1 (bài cá nhân hoá giao cho bạn S2 ⇒ lớp đã học), B-0…B-7 dạng B.2 (chưa ai học), C-0…C-7 dạng C.3 (ca lớp sẽ đóng). */
function dung(o: { mucDoA?: string } = {}): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Tờ 1',56,0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  const them = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 0; i < 40; i++) them.run('DE1', `A-${i}`, 'v1', `g-A-${i}`, 'A.1', JSON.stringify(cauJson(`A-${i}`, 'A.1', o.mucDoA ?? 'biet')))
  for (let i = 0; i < 8; i++) them.run('DE1', `B-${i}`, 'v1', `g-B-${i}`, 'B.2', JSON.stringify(cauJson(`B-${i}`, 'B.2', 'biet')))
  for (let i = 0; i < 8; i++) them.run('DE1', `C-${i}`, 'v1', `g-C-${i}`, 'C.3', JSON.stringify(cauJson(`C-${i}`, 'C.3', 'biet')))
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,lop,cap_nhat_luc) VALUES('S1','Em Một','mk1','12','x'),('S2','Em Hai','mk2','12','x')").run()
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,revision,json,created_at) VALUES(?,0,?,?)').run('S1', JSON.stringify({ pet: 'dat_quy', choice: false, legacy: null, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2026-09-21T05:00:00.000Z', luatCap: 2 }), 'x')
  d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('BT1','CA1','DE1',40,'2026-09-20T00:00:00.000Z','2099-01-01T00:00:00.000Z',0,'x',1)").run()
  d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES('BT1|S2','BT1','S2','Em Hai')").run()
  d.sql.prepare("INSERT INTO btvn_cau(ma_btvn,qid,thu_tu,dang,muc_do,sao,phan,loi,ghim) VALUES('BT1','A-0',1,'A.1',0,0,'I',0,0)").run()
  return d
}
const start = (d: D1That, o: Record<string, unknown> = {}) => gameV2(d.env, 'start', { token: 'token-S1', mode: 'adventure', ...o }) as Promise<any>
const tra = (d: D1That, id: string, qid: string, dapAn = 'B') => gameV2(d.env, 'answer', { token: 'token-S1', session: id, qid, answer: dapAn }) as Promise<any>
/** Trả lời HẾT các câu của lượt (đáp án đúng là 'B'; `dapAn: 'A'` = sai hết). */
const lamHetLuot = async (d: D1That, r: any, dapAn = 'B') => { for (const c of r.questions) await tra(d, r.id, c.qid, dapAn) }
const qids = (r: any): string[] => (r.questions as { qid: string }[]).map((x) => x.qid)
const bangLop = (d: D1That) => d.sql.prepare('SELECT ten_lop, dang FROM lop_da_hoc ORDER BY dang').all() as { ten_lop: string; dang: string }[]

describe('kho rút = phần LỚP đã học', () => {
  it('dạng bài giao cho BẠN CÙNG LỚP mở cho em dù em CHƯA có bằng chứng; dạng chưa ai học không bao giờ ra; có `luot` (lượt đang mở, còn lại, trần 6)', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung()
    const r = await start(d)
    expect(r.ok).toBe(true); expect(r.questions).toHaveLength(6)
    expect(qids(r).every((q) => q.startsWith('A-'))).toBe(true)
    expect(new Set(qids(r)).size).toBe(6)
    for (const c of r.questions) { expect(c.correct).toBeUndefined(); expect(['yeu', 'toi_han', 'lap', 'thu_thach']).toContain(c.role); expect(['yeu', 'toi_han', 'moi', 'thu_thach', 'trum', 'lap']).toContain(c.roleV2) } // `role` = tập cũ cho máy em đang sống; `roleV2` = vai thật
    expect(r.luot).toMatchObject({ tran: 6, tongLuotMo: 3, daLam: 1, conLai: 2, luotDangMo: { so: 1, loai: 'khoi_dong', thuong: false } })
    expect(bangLop(d)).toEqual([{ ten_lop: TEN_LOP, dang: 'A.1' }])
  })

  it('bảng đệm nạp lười: trong 6 giờ không đổi dù lớp học thêm dạng mới; qua 6 giờ nạp lại (thêm dạng của ca lớp ĐÃ ĐÓNG)', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung()
    expect(await docDangLop(d.env, 'S1', Date.now())).toEqual(['A.1'])
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cong_bo,cap_nhat_luc) VALUES('CA9','Ca 9','dong','khong','x')").run()
    d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,dung_sai,cap_nhat_luc) VALUES('CA9|S2|1|I|1','CA9','S2',1,'I',1,'C-0',1,'x')").run()
    expect(await docDangLop(d.env, 'S1', Date.now() + 5 * 3_600_000)).toEqual(['A.1']) // còn mới
    expect(await docDangLop(d.env, 'S1', Date.now() + 7 * 3_600_000)).toEqual(['A.1', 'C.3']) // qua 6 giờ: ca đã đóng ⇒ dạng C.3
    expect(bangLop(d).map((x) => x.dang)).toEqual(['A.1', 'C.3'])
  })

  it('ca lớp CHƯA đóng và chưa công bố KHÔNG mở dạng; ca công bố ngay thì mở', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung()
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cong_bo,cap_nhat_luc) VALUES('CAM','Ca mở','mo','khong','x'),('CAN','Ca công bố','mo','ngay','x')").run()
    d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,dung_sai,cap_nhat_luc) VALUES('CAM|S2|1|I|1','CAM','S2',1,'I',1,'B-0',1,'x'),('CAN|S2|1|I|1','CAN','S2',1,'I',1,'C-0',1,'x')").run()
    expect(await docDangLop(d.env, 'S1', Date.now())).toEqual(['A.1', 'C.3'])
  })

  it('thiếu bảng đệm (Worker lên trước migration) ⇒ không lỗi: dạng lớp = []', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(); d.sql.exec('DROP TABLE lop_da_hoc')
    expect(await docDangLop(d.env, 'S1', Date.now())).toEqual([])
  })
})

const LOP_MOI = '12 - Nhóm 10 điểm'
/** Thêm em S3 vào lớp mới tách (ten_lop = LOP_MOI, chưa có bài/ca riêng) — lớp gốc mặc định là "12 - Lớp Thường" (có S1, S2; bài của S2 dạy A.1). */
const themEmLopMoi = (d: D1That) => {
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,lop,ten_lop,cap_nhat_luc) VALUES('S3','Em Ba','mk3','12',?,'x')").run(LOP_MOI)
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,revision,json,created_at) VALUES(?,0,?,?)').run('S3', JSON.stringify({ pet: 'dat_quy', choice: false, legacy: null, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2026-09-21T05:00:00.000Z', luatCap: 2 }), 'x')
}
const datKeThua = (d: D1That, v: unknown) => d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('lop_da_hoc_ke_thua',?,'x')").run(typeof v === 'string' ? v : JSON.stringify(v))

describe('KẾ THỪA kho lớp (Boss 21/09: lớp mới tách không được có kho nhỏ nhất)', () => {
  it('lớp mới tách, chưa có bài/ca riêng: KHÔNG kế thừa ⇒ kho rỗng; có `lop_da_hoc_ke_thua` ⇒ nhận đủ dạng lớp gốc; `start` của em rút được câu lớp gốc', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(); themEmLopMoi(d)
    expect(await docDangLop(d.env, 'S3', Date.now())).toEqual([])
    datKeThua(d, { [LOP_MOI]: '12 - Lớp Thường' })
    expect(await docDangLop(d.env, 'S3', Date.now())).toEqual(['A.1']) // đổi cấu hình ⇒ nạp lại NGAY (mốc gắn chuỗi kế thừa), không chờ 6 giờ
    expect(bangLop(d)).toEqual([{ ten_lop: LOP_MOI, dang: 'A.1' }])
    const r = await gameV2(d.env, 'start', { token: 'token-S3', mode: 'adventure' }) as any
    expect(r.ok).toBe(true); expect(r.questions.length).toBeGreaterThan(0); expect(qids(r).every((q) => q.startsWith('A-'))).toBe(true)
  })

  it('dạng từ bài/ca CHÍNH em được giao vẫn có dù lớp hiện tại và lớp gốc không có; gỡ kế thừa ⇒ trở về chỉ phần của em', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(); themEmLopMoi(d)
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('BT9','CA1','DE1',8,'2026-09-20T00:00:00.000Z','2099-01-01T00:00:00.000Z',0,'x',1)").run()
    d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES('BT9|S3','BT9','S3','Em Ba')").run()
    d.sql.prepare("INSERT INTO btvn_cau(ma_btvn,qid,thu_tu,dang,muc_do,sao,phan,loi,ghim) VALUES('BT9','C-0',1,'C.3',0,0,'I',0,0)").run()
    expect(await docDangLop(d.env, 'S3', Date.now())).toEqual(['C.3'])
    // bài MỚI giao cho chính em SAU khi bảng đệm của lớp đã nạp (còn mới): phần của em thấy NGAY, không chờ 6 giờ
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('BT8','CA1','DE1',8,'2026-09-22T00:00:00.000Z','2099-01-01T00:00:00.000Z',0,'x',1)").run()
    d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES('BT8|S3','BT8','S3','Em Ba')").run()
    d.sql.prepare("INSERT INTO btvn_cau(ma_btvn,qid,thu_tu,dang,muc_do,sao,phan,loi,ghim) VALUES('BT8','B-0',1,'B.2',0,0,'I',0,0)").run()
    expect(await docDangLop(d.env, 'S3', Date.now())).toEqual(['B.2', 'C.3'])
    datKeThua(d, { [LOP_MOI]: '12 - Lớp Thường' })
    expect(await docDangLop(d.env, 'S3', Date.now())).toEqual(['A.1', 'B.2', 'C.3'])
    d.sql.exec("DELETE FROM cau_hinh WHERE khoa = 'lop_da_hoc_ke_thua'")
    expect(await docDangLop(d.env, 'S3', Date.now())).toEqual(['B.2', 'C.3'])
  })

  it('vòng A→B→A không treo; cấu hình hỏng / không phải đối tượng / giá trị không phải chuỗi ⇒ bỏ qua, không ném lỗi; chuỗi tối đa 3 tầng', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(); themEmLopMoi(d)
    datKeThua(d, { [LOP_MOI]: '12 - Lớp Thường', '12 - Lớp Thường': LOP_MOI })
    expect(await docChuoiKeThua(d.env, LOP_MOI)).toEqual([LOP_MOI, '12 - Lớp Thường'])
    expect(await docDangLop(d.env, 'S3', Date.now())).toEqual(['A.1'])
    for (const hong of ['{khong phai json', '[1,2]', '"chuoi"', '{"12 - Nhóm 10 điểm": 5}', 'null']) {
      datKeThua(d, hong)
      expect(await docChuoiKeThua(d.env, LOP_MOI)).toEqual([LOP_MOI])
    }
    datKeThua(d, { a: 'b', b: 'c', c: 'd', d: 'e' })
    expect(await docChuoiKeThua(d.env, 'a')).toEqual(['a', 'b', 'c', 'd']) // tối đa 3 tầng
  })

  it('lớp KHÔNG khai kế thừa không đổi: em S1 vẫn nhận đúng dạng lớp mình; nạp lại chỉ khi cũ hơn 6 giờ hoặc đổi chuỗi', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung()
    expect(await docDangLop(d.env, 'S1', Date.now())).toEqual(['A.1'])
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cong_bo,cap_nhat_luc) VALUES('CA9','Ca 9','dong','khong','x')").run()
    d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,dung_sai,cap_nhat_luc) VALUES('CA9|S2|1|I|1','CA9','S2',1,'I',1,'C-0',1,'x')").run()
    expect(await docDangLop(d.env, 'S1', Date.now() + 60_000)).toEqual(['A.1']) // còn mới, chuỗi không đổi ⇒ dùng bảng đệm
    expect(await docDangLop(d.env, 'S1', Date.now() + 7 * 3_600_000)).toEqual(['A.1', 'C.3'])
  })
})

describe('vai tương thích với máy em đang sống', () => {
  it('`role` chỉ có yeu|toi_han|lap|thu_thach (moi → lap, trum → thu_thach), `roleV2` giữ vai thật; lượt chờ trả lại cũng thế; EXP thử thách dựa VAI THẬT đã lưu', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung()
    const iso = new Date().toISOString()
    d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('SV', 'S1', JSON.stringify({ mode: 'adventure', created: Date.now(), questions: ['moi', 'trum', 'yeu', 'lap', 'thu_thach', 'toi_han'].map((role, i) => ({ qid: `A-${i + 1}`, maDe: 'DE1', version: 'v1', group: `g-A-${i + 1}`, novel: true, role })) }), iso)
    const r = await start(d) // lượt chờ (chưa trả lời câu nào) ⇒ trả lại chính nó
    expect(r.id).toBe('SV')
    expect(r.questions.map((c: any) => [c.role, c.roleV2])).toEqual([['lap', 'moi'], ['thu_thach', 'trum'], ['yeu', 'yeu'], ['lap', 'lap'], ['thu_thach', 'thu_thach'], ['toi_han', 'toi_han']])
  })
})

describe('quota lượt và trần câu', () => {
  it('`start` lần hai khi lượt cũ CHƯA trả lời câu nào ⇒ trả lại CHÍNH lượt ấy (không bốc lại câu, không tốn lượt)', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung()
    const a = await start(d), b = await start(d)
    expect(b.id).toBe(a.id); expect(qids(b)).toEqual(qids(a))
    expect(d.dem('game_v2_session')).toBe(1)
  })

  it('3 lượt mở sẵn: sau khi làm hết 3 lượt ⇒ hết lượt (het:true, không câu, có maiCho); đạt nhiệm vụ ngày mở thêm 1 lượt THƯỞNG; không lặp câu giữa các lượt', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung()
    const dung1 = await start(d); await lamHetLuot(d, dung1)
    const dung2 = await start(d); await lamHetLuot(d, dung2, 'A') // lượt 2 sai hết ⇒ chưa đủ 80 % đúng ⇒ chưa mở Lượt trùm
    expect(dung2.luot).toMatchObject({ daLam: 2, conLai: 1, luotDangMo: { so: 2, loai: 'kham_pha' } })
    const dung3 = await start(d); await lamHetLuot(d, dung3)
    const tatCa = [...qids(dung1), ...qids(dung2), ...qids(dung3)]
    expect(tatCa).toHaveLength(18); expect(new Set(tatCa).size).toBe(18) // 18 câu KHÁC nhau
    const het = await start(d)
    expect(het).toMatchObject({ ok: true, het: true, questions: [], luot: { conLai: 0, daLam: 3 } })
    expect(het.maiCho).toMatchObject({ dangMoi: expect.any(Number), toiHan: expect.any(Number) })
    // đạt nhiệm vụ ngày ⇒ +1 lượt thưởng (chỉ 6 lượt/ngày, mỗi lượt 6 câu)
    d.sql.prepare("INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,qid,ma_nguon,exp,luc,ghi_chu) VALUES('S1|dat|x','S1',?,'dat_ngay',NULL,NULL,80,?,'x')").run(NGAY, `${NGAY}T03:00:00.000Z`)
    const thuong = await start(d)
    expect(thuong.questions.length).toBeGreaterThan(0); expect(thuong.luot.luotDangMo).toMatchObject({ so: 4, thuong: true })
  })

  it('trần ĐẢO 36 câu/ngày (sửa CÓ CHỦ Ý 21/09: trần gộp 60 ⇒ Đảo 36 riêng, thầy lệnh 19:30): đã đủ 36 lượt trả lời thì `start` báo bằng lời; `recommendations` trả remaining 0, tranNgay 36', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung()
    const ins = d.sql.prepare("INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,'S1','cu',?,?,?,?)")
    for (let i = 0; i < 36; i++) ins.run(`x${i}`, `q${i}`, `g${i}`, JSON.stringify({ attempt: { correct: true } }), new Date().toISOString())
    await expect(start(d)).rejects.toThrow('36 câu')
    expect(await gameV2(d.env, 'recommendations', { token: 'token-S1' }) as any).toMatchObject({ remaining: 0, tranNgay: 36, dailyUsed: 36 })
  })

  it('Đoàn/Linh Tâm KHÔNG tính vào 6 lượt: phiên có `doan` hoặc `guardian` bị bỏ khi đếm', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung()
    const iso = new Date().toISOString()
    d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('dh', 'S1', JSON.stringify({ mode: 'adventure', doan: 1, created: Date.now(), questions: [] }), iso)
    d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('lt', 'S1', JSON.stringify({ mode: 'arena', guardian: 'G', created: Date.now(), questions: [] }), iso)
    const r = await start(d)
    expect(r.luot).toMatchObject({ daLam: 1, conLai: 2 }) // chỉ lượt vừa mở
  })
})

describe('chặn câu bài tập về nhà CHƯA nộp', () => {
  const themBaiChuaNop = (d: D1That) => {
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('BT2','CA1','DE1',5,'2026-09-21T00:00:00.000Z','2099-01-01T00:00:00.000Z',0,'x',1)").run()
    d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES('BT2|S1','BT2','S1','Em Một')").run()
    for (let i = 1; i <= 39; i++) d.sql.prepare("INSERT INTO btvn_em_cau(khoa,ma_btvn,sbd,qid,chang,nhan,thu_tu) VALUES(?,?,?,?,0,'loi',?)").run(`BT2|S1|A-${i}`, 'BT2', 'S1', `A-${i}`, i)
  }
  it('qid VÀ nhóm của câu trong bài em chưa nộp bị chặn; nộp xong thì được rút lại', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(); themBaiChuaNop(d)
    const chan = await docCauBtvnChuaNop(d.env, 'S1')
    for (const i of [1, 5, 39]) { expect(chan.has(`A-${i}`)).toBe(true); expect(chan.has(`g-A-${i}`)).toBe(true) }
    expect(chan.has('A-0')).toBe(false)
    const r = await start(d)
    expect(qids(r)).toEqual(['A-0']) // 39 câu còn lại nằm trong bài em CHƯA nộp ⇒ chỉ còn A-0
    d.sql.prepare("UPDATE btvn_em SET nop_luc='2026-09-22T01:00:00.000Z' WHERE khoa='BT2|S1'").run()
    expect((await docCauBtvnChuaNop(d.env, 'S1')).size).toBe(0)
  })
  it('bài THƯỜNG (không cá nhân hoá) chưa nộp: chặn CẢ TỜ đề; bài thu hồi hoặc đã xoá không chặn', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung()
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('BT3','CA1','DE1',56,'2026-09-21T00:00:00.000Z','2099-01-01T00:00:00.000Z',0,'x',0)").run()
    d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES('BT3|S1','BT3','S1','Em Một')").run()
    expect((await docCauBtvnChuaNop(d.env, 'S1')).has('B-3')).toBe(true)
    d.sql.prepare("UPDATE btvn_em SET thu_hoi=1 WHERE khoa='BT3|S1'").run()
    expect((await docCauBtvnChuaNop(d.env, 'S1')).size).toBe(0)
  })
})

describe('cờ lùi nhanh và lý do khi kho không đủ', () => {
  it('`cau_hinh.game_luot_moi = tat` ⇒ đường CŨ (không có khối `luot`); vắng cờ ⇒ bật', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung()
    expect(await luotMoiBat(d.env)).toBe(true)
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_luot_moi','tat','x')").run()
    expect(await luotMoiBat(d.env)).toBe(false)
    const r = await start(d)
    expect(r).not.toHaveProperty('luot')
  })
  it('kho chỉ còn câu QUÁ BẬC + 1 của em ⇒ không câu, lý do rõ (không dùng lại lời "hoàn thành bài Thầy giao")', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung({ mucDoA: 'van_dung' })
    const r = await start(d)
    expect(r.questions).toEqual([])
    expect(r.lyDo).toBe('chi_con_cau_qua_bac')
    expect(String(r.message)).not.toContain('hoàn thành bài Thầy giao')
  })
  it('câu thiếu `mucDo` KHÔNG vào kho lượt (hàm chọn coi câu thiếu mức là dễ nhất nên máy chủ phải lọc trước)', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(); d.sql.exec("UPDATE game_v2_question SET json = json_set(json, '$.mucDo', NULL)")
    const r = await start(d)
    expect(r.questions).toEqual([]); expect(r.lyDo).toBe('kho_trong')
  })
  it('lớp chưa học dạng nào ⇒ lyDo kho_trong', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(); d.sql.exec('DELETE FROM btvn_cau')
    const r = await start(d)
    expect(r.questions).toEqual([]); expect(r.lyDo).toBe('kho_trong')
  })
})

describe('maiCho (màn hết lượt)', () => {
  it('dangMoi = dạng lớp đã học mà em chưa có mastery; toiHan = dạng có mốc ôn trong hôm nay/ngày mai', () => {
    const now = 1_800_000_000_000, ngay = 86_400_000
    const ms = [{ key: 'A.1', stage: 1, first: 1, due: now - 1, groups: [], repaired: false }, { key: 'B.2', stage: 2, first: 1, due: now + 3 * ngay, groups: [], repaired: false }, { key: 'X', stage: 0, first: 0, due: 0, groups: [], repaired: false }]
    expect(maiCho(['A.1', 'B.2', 'C.3', 'D.4'], ms, now)).toEqual({ dangMoi: 2, toiHan: 1 }) // C.3, D.4 mới; tới hạn: chỉ A.1 (đã học, quá hạn); B.2 hạn sau 3 ngày; X chưa học (stage 0) không tính
  })
})

describe('EXP câu THỬ THÁCH / LƯỢT TRÙM làm đúng lần đầu (qua cửa trần 120 EXP game/ngày)', () => {
  const bat = (d: D1That) => d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: '2026-09-01T00:00:00.000Z', dsSbd: ['S1'] }))
  const moLuotCoVai = (d: D1That, vai: Record<string, string>) => {
    const refs = Object.entries(vai).map(([qid, role]) => ({ qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, novel: true, role }))
    d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('SS', 'S1', JSON.stringify({ mode: 'adventure', created: Date.now(), questions: refs }), new Date().toISOString())
  }
  const hoSo = (d: D1That) => JSON.parse((d.sql.prepare("SELECT json FROM game_v2_profile WHERE sbd='S1'").get() as { json: string }).json) as Record<string, any>
  const khoan = (d: D1That) => d.sql.prepare("SELECT khoa, loai, exp, qid FROM exp_so WHERE sbd='S1' AND loai='thu_thach' ORDER BY khoa").all() as { khoa: string; loai: string; exp: number; qid: string }[]

  it('câu vai thu_thach / trum đúng ⇒ +EXP theo bảng giá câu (Phần I, 1 sao = 3) ghi exp_so khoá `thuthach|<qid>`, vào ống nghiệm; vai khác (moi/lap) không có; trả lời lại không cộng đôi', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(); bat(d)
    moLuotCoVai(d, { 'A-1': 'thu_thach', 'A-2': 'trum', 'A-3': 'moi' })
    const a = await tra(d, 'SS', 'A-1')
    expect(a).toMatchObject({ correct: true, reward: 10, expThuThach: 3 }) // nấc 1 = 10 EXP (đường Đảo) + 3 EXP thử thách
    expect(khoan(d)).toEqual([{ khoa: 'S1|thuthach|A-1', loai: 'thu_thach', exp: 3, qid: 'A-1' }])
    expect(hoSo(d)).toMatchObject({ wallet: 13, earned: 13, expGame: { ngay: NGAY, da: 13 } })
    expect((a.profile as any).wallet).toBe(13) // phản hồi mang hồ sơ MỚI (sau khi cộng ống)
    const b = await tra(d, 'SS', 'A-2'); expect(b.expThuThach).toBe(3)
    const c = await tra(d, 'SS', 'A-3'); expect(c).not.toHaveProperty('expThuThach')
    expect(khoan(d).map((x) => x.qid)).toEqual(['A-1', 'A-2'])
    expect(hoSo(d).wallet).toBe(16) // nấc dạng A.1 chỉ MỘT lần (10) + 2 thử thách × 3
    await tra(d, 'SS', 'A-1') // replay
    expect(khoan(d)).toHaveLength(2); expect(hoSo(d).wallet).toBe(16)
  })

  it('câu thử thách SAI hoặc có trợ giúp ⇒ không có EXP thử thách; EXP mới TẮT cho em ⇒ không ghi sổ', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(); bat(d)
    moLuotCoVai(d, { 'A-1': 'thu_thach', 'A-2': 'thu_thach' })
    expect(await tra(d, 'SS', 'A-1', 'A')).not.toHaveProperty('expThuThach')
    expect(khoan(d)).toEqual([])
    const e = dung(); moLuotCoVai(e, { 'A-1': 'thu_thach' }) // chưa bật cờ EXP mới
    expect(await tra(e, 'SS', 'A-1')).not.toHaveProperty('expThuThach'); expect(e.dem('exp_so')).toBe(0)
  })

  it('trần 120 EXP game/ngày: đã đủ ⇒ ghi khoản 0 EXP (đã xét), không cộng ống; phản hồi có thuongGoc cho nấc bị cắt', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(); bat(d)
    d.sql.prepare("UPDATE game_v2_profile SET json = json_set(json, '$.expGame', json(?))").run(JSON.stringify({ ngay: NGAY, da: 120 }))
    moLuotCoVai(d, { 'A-1': 'thu_thach' })
    const a = await tra(d, 'SS', 'A-1')
    expect(a).toMatchObject({ correct: true, reward: 0, thuongGoc: 10 }); expect(a).not.toHaveProperty('expThuThach')
    expect(khoan(d)).toEqual([{ khoa: 'S1|thuthach|A-1', loai: 'thu_thach', exp: 0, qid: 'A-1' }])
    expect(hoSo(d)).toMatchObject({ wallet: 0, earned: 0 })
  })
})

describe('sửa theo rà chéo W2b của Code 1', () => {
  const themBaiChuaNop = (d: D1That) => {
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('BT2','CA1','DE1',39,'2026-09-21T00:00:00.000Z','2099-01-01T00:00:00.000Z',0,'x',1)").run()
    d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES('BT2|S1','BT2','S1','Em Một')").run()
    for (let i = 1; i <= 39; i++) d.sql.prepare("INSERT INTO btvn_em_cau(khoa,ma_btvn,sbd,qid,chang,nhan,thu_tu) VALUES(?,?,?,?,0,'loi',?)").run(`BT2|S1|A-${i}`, 'BT2', 'S1', `A-${i}`, i)
  }
  const cungCoBangChung = (d: D1That) => { // em có bằng chứng dạng A.1 (đường CŨ chỉ rút dạng em đã có bằng chứng)
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cong_bo,cap_nhat_luc) VALUES('CAE','Ca E','dong','ngay','x')").run()
    d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,nop_luc,cap_nhat_luc) VALUES('CAE|S1|1','CAE','S1',1,'2026-09-20T00:30:00.000Z','da_nop','2026-09-20T01:00:00.000Z','x')").run()
    d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,dung_sai,cap_nhat_luc) VALUES('CAE|S1|1|I|1','CAE','S1',1,'I',1,'A-0',0,'x')").run()
  }

  it('(1) đường CŨ của `start` (cờ lùi tắt, repair/tower, Đoàn nội bộ) KHÔNG rút câu nằm trong bài tập về nhà em CHƯA nộp', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(); cungCoBangChung(d)
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_luot_moi','tat','x')").run()
    const truoc = await start(d)
    expect(truoc.questions.length).toBeGreaterThan(0) // đường cũ có câu khi chưa có bài chưa nộp
    d.sql.exec('DELETE FROM game_v2_session')
    themBaiChuaNop(d)
    const r = await start(d)
    expect(qids(r).filter((q) => /^A-([1-9]|[1-3][0-9])$/.test(q))).toEqual([]) // A-1…A-39 nằm trong bài chưa nộp
    d.sql.exec('DELETE FROM game_v2_session')
    for (const mode of ['repair', 'tower']) { const m = await start(d, { mode }); expect(qids(m).filter((q) => /^A-([1-9]|[1-3][0-9])$/.test(q))).toEqual([]) }
  })

  it('lượt CHỜ (chưa trả lời câu nào) mà sau đó thầy giao BTVN chứa câu của lượt ⇒ bỏ lượt chờ (xoá, không mất lượt), mở lượt mới không chứa câu dính bài chưa nộp', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung()
    const a = await start(d)
    expect(d.dem('game_v2_session')).toBe(1)
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('BT7','CA1','DE1',6,'2026-09-22T00:00:00.000Z','2099-01-01T00:00:00.000Z',0,'x',1)").run()
    d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES('BT7|S1','BT7','S1','Em Một')").run()
    qids(a).forEach((q, i) => d.sql.prepare("INSERT INTO btvn_em_cau(khoa,ma_btvn,sbd,qid,chang,nhan,thu_tu) VALUES(?,?,?,?,0,'loi',?)").run(`BT7|S1|${q}`, 'BT7', 'S1', q, i + 1))
    const b = await start(d)
    expect(b.id).not.toBe(a.id)
    expect(qids(b).filter((q) => qids(a).includes(q))).toEqual([])
    expect(d.dem('game_v2_session')).toBe(1) // phiên chờ cũ đã xoá; chỉ còn phiên mới
    expect(b.luot).toMatchObject({ daLam: 1, conLai: 2 })
  })

  const suKien = (d: D1That, qid: string, nguon: string, chiSo = 0, ngay = NGAY, ketQua: number | null = 1) => d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES (?, 'S1', ?, ?, ?, ?, ?, 40, ?, ?)")
    .run(`${qid}|${nguon}|${chiSo}`, qid, nguon, nguon === 'btvn_lo' ? 'BT5' : 'x', chiSo, ketQua, `${ngay}T03:00:00.000Z`, ngay)
  const dauVao = (d: D1That) => docDauVaoLuot(d.env, 'S1', NGAY, Date.parse(`${NGAY}T10:00:00+07:00`), false)

  it('(2)(3) xong chặng = chặng ĐÃ XONG (lo_da_xong tăng), không phải mới làm 1 câu; bài đã xong hết chặng chưa bấm nộp ⇒ không tính "đang chạy" (null)', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung()
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('BT5','CA1','DE1',9,'2026-09-21T00:00:00.000Z','2099-01-01T00:00:00.000Z',0,'x',1)").run()
    d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten,so_chang,lo_da_xong) VALUES('BT5|S1','BT5','S1','Em Một',3,0)").run()
    suKien(d, 'A-1', 'btvn_lo', 0) // mới làm 1 câu của chặng 0
    expect((await dauVao(d)).xongChangHomNay).toBe(false)
    d.sql.exec("UPDATE btvn_em SET lo_da_xong = 1 WHERE ma_btvn = 'BT5'") // xong chặng 0
    expect((await dauVao(d)).xongChangHomNay).toBe(true)
    d.sql.exec("UPDATE btvn_em SET lo_da_xong = 3 WHERE ma_btvn = 'BT5'") // xong HẾT chặng nhưng chưa nộp
    expect((await dauVao(d)).xongChangHomNay).toBeNull()
    d.sql.exec("UPDATE btvn_em SET lo_da_xong = 1, thu_hoi = 1 WHERE ma_btvn = 'BT5'") // bài bị thu hồi ⇒ không có bài đang chạy
    expect((await dauVao(d)).xongChangHomNay).toBeNull()
  })

  it('(2) xong ôn tới hạn = hôm nay có ≥ 1 câu ôn lại VÀ không còn câu tới hạn; câu KHẮC PHỤC không tính là ôn; còn câu tới hạn ⇒ chưa xong', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung()
    suKien(d, 'K-1', 'khac_phuc'); expect((await dauVao(d)).xongOnToiHan).toBe(false)
    suKien(d, 'O-1', 'on_lai')
    d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,ket_qua_cuoi,nguon_cuoi,luc_cuoi,moc_on_ke,trang_thai,can_day_lai,cap_nhat_luc) VALUES('S1|O-2','S1','O-2','A.1',1,1,0,0,0,0,'btvn','x',?,'moi_sai',0,'x')").run(NGAY)
    expect((await dauVao(d)).xongOnToiHan).toBe(false) // còn 1 câu tới hạn
    d.sql.exec("UPDATE nam_kt_cau SET moc_on_ke = '2026-09-25'") // hẹn ngày sau ⇒ hết câu tới hạn
    expect((await dauVao(d)).xongOnToiHan).toBe(true)
  })

  it('(4) lượt đã MỞ rồi BỎ quá 2 giờ mà chưa trả lời câu nào không mất lượt; có ≥ 1 câu trả lời hoặc còn trong 2 giờ thì tính', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung()
    const phien = (id: string, truocGio: number) => d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run(id, 'S1', JSON.stringify({ mode: 'adventure', created: Date.now(), questions: [] }), new Date(Date.now() - truocGio * 3_600_000).toISOString())
    phien('bo', 3); phien('moi', 1); phien('lamdo', 3)
    d.sql.prepare("INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES('a1','S1','lamdo','q','g','{}',?)").run(new Date(Date.now() - 3 * 3_600_000).toISOString())
    expect(await demLuotHomNay(d.env, 'S1', NGAY, Date.now())).toBe(2) // 'moi' (1 giờ) + 'lamdo' (có câu trả lời); 'bo' (3 giờ, 0 câu) không tính
  })
})

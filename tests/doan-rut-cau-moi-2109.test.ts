// @vitest-environment node
// ĐOÀN RÚT CÂU KHÔNG LẶP (thầy lệnh 21/09 ~19:35 "rút câu theo đúng luật cá nhân hóa, nâng đỡ tiến bộ và chặn câu lặp lại cho mỗi học sinh"; server/src/game-v2-cau-moi.ts + startDoanKhoLop dùng chooseLuotMoi 'kham_pha'):
//  • 60 câu cá nhân/ngày của MỘT em không qid trùng (10 chặng liền); • ưu tiên câu CHƯA TỪNG làm ở mọi nguồn/mọi ngày; • hết câu mới ⇒ câu LÂU NHẤT chưa gặp + `hetCauMoi` thật; • làm hết trong ngày ⇒ báo thật, không lặp;
//  • hai em khác hồ sơ ⇒ bộ câu khác (2 suất yếu theo dạng yếu của CHÍNH em); • trùm nhớ câu đã ra ở chặng trước của các em trong đoàn và câu các em đã làm hôm nay. Không Phần II ở câu cá nhân. SQLite thật.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { danhDau } from '../server/src/game-v2-doan'
import { chonLauNhat, tachMoiCu } from '../server/src/game-v2-cau-moi'
import { taoD1That, type D1That } from './_d1-that'

const T0 = Date.parse('2026-09-22T12:00:00+07:00')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())
const cau = (qid: string, dang: string, phan: 'I' | 'II' | 'III' = 'I') => ({
  qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Đề ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['ý a', 'ý b', 'ý c', 'ý d'] : [],
  hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo: 'biet', sao: 1, kienThuc: ['K1'], correct: phan === 'II' ? 'DSDS' : 'B', solution: `LG-${qid}`, reviewed: true,
})
/** Lớp 12, các em S1..S3; lớp đã học A.1 (bài cá nhân hoá có câu A-0) và B.2 (câu B-0). Kho: A-0…A-{soA-1} (Phần I, A.1), B-0…B-{soB-1} (B.2), P-0…P-{soII-1} Phần II (A.1, kiến thức K1) cho trùm. */
function dung(o: { soA?: number; soB?: number; soII?: number; em?: string[] } = {}): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong',?,'x')").run(JSON.stringify({ toanBo: true }))
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',300,'kho/DE1.json',0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  const them = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  const ds = [...Array.from({ length: o.soA ?? 100 }, (_, i) => cau(`A-${i}`, 'A.1')), ...Array.from({ length: o.soB ?? 30 }, (_, i) => cau(`B-${i}`, 'B.2')), ...Array.from({ length: o.soII ?? 8 }, (_, i) => cau(`P-${i}`, 'A.1', 'II'))]
  for (const q of ds) them.run('DE1', q.qid, 'v1', q.group, q.dang, JSON.stringify(q))
  for (const sbd of o.em ?? ['S1', 'S2', 'S3']) {
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12','mk','x')").run(sbd, `Em ${sbd}`)
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run(sbd, JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  }
  d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('BT1','CA1','DE1',30,'2026-09-20T00:00:00.000Z','2099-01-01T00:00:00.000Z',0,'x',1)").run()
  d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES('BT1|S3','BT1','S3','Em S3')").run()
  d.sql.prepare("INSERT INTO btvn_cau(ma_btvn,qid,thu_tu,dang,muc_do,sao,phan,loi,ghim) VALUES('BT1','A-0',1,'A.1',0,0,'I',0,0),('BT1','B-0',2,'B.2',0,0,'I',0,0)").run()
  return d
}
const ghiSo = (d: D1That, sbd: string, qid: string, ketQua: 0 | 1 | null, luc: number, nguon = 'on_lai', dang = 'A.1') =>
  d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(`s-${sbd}-${qid}-${luc}`, sbd, qid, nguon, 'm', 1, ketQua, 30, new Date(luc).toISOString(), new Date(luc + 7 * 3_600_000).toISOString().slice(0, 10), dang)
const HOM_QUA = T0 - 24 * 3_600_000
const NGAY_TRUOC = T0 - 5 * 24 * 3_600_000
let stt = 0
/** Đoàn lấy câu cá nhân (đường `start` nội bộ) và em LÀM hết (đúng): đánh dấu phiên $.doan, ghi lượt. */
async function rutVaLam(d: D1That, sbd = 'S1'): Promise<any> {
  const r = await gameV2(d.env, 'start', danhDau({ token: await gameToken(d.env, sbd), mode: 'adventure' })) as any
  if (!r.questions?.length) return r
  d.sql.prepare("UPDATE game_v2_session SET json=json_set(json,'$.doan',1) WHERE id=?").run(r.id)
  const ins = d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
  for (const q of r.questions as { qid: string; group?: string; dang?: string }[]) {
    const g = `g-${q.qid}`
    ins.run(`rv${++stt}`, sbd, r.id, q.qid, g, JSON.stringify({ attempt: { id: `rv${stt}`, session: r.id, qid: q.qid, group: g, dang: q.dang ?? 'A.1', mucDo: 'biet', correct: true, assisted: false, at: T0 - 60_000 + stt, novel: true } }), new Date(T0 - 60_000 + stt).toISOString())
  }
  return r
}

describe('60 câu cá nhân/ngày của một em: KHÔNG qid trùng', () => {
  it('10 chặng liền (60 câu, trần Đoàn 60): 60 qid khác nhau, mỗi chặng đủ 6 câu Phần I/III (không Phần II); chặng thứ 11 chạm trần', async () => {
    const d = dung({ soA: 120, soB: 0 })
    const tatCa: string[] = []
    for (let i = 0; i < 10; i++) {
      const r = await rutVaLam(d)
      expect(r.questions, `chặng ${i + 1}`).toHaveLength(6)
      expect(r.hetCauMoi).toBeUndefined() // kho còn dư câu mới ⇒ không phải "hết mới"
      for (const q of r.questions) { tatCa.push(q.qid); expect(q.qid).toMatch(/^A-/); expect(q.phan).not.toBe('II') }
    }
    expect(tatCa).toHaveLength(60)
    expect(new Set(tatCa).size).toBe(60)
    await expect(rutVaLam(d)).rejects.toThrow(/hoàn thành 60 câu hôm nay/)
  })
})

describe('ưu tiên câu CHƯA TỪNG làm ở mọi nguồn; hết mới ⇒ câu lâu nhất chưa gặp + báo thật', () => {
  it('em đã làm A-0…A-39 ở các nguồn/ngày khác (ôn lại, bài về nhà, ca): chặng chỉ lấy câu mới A-40…', async () => {
    const d = dung({ soA: 60, soB: 0 })
    for (let i = 0; i < 40; i++) ghiSo(d, 'S1', `A-${i}`, i % 3 === 0 ? 0 : 1, NGAY_TRUOC + i, ['on_lai', 'btvn', 'thi', 'luyen'][i % 4])
    const r = await rutVaLam(d)
    expect(r.questions).toHaveLength(6)
    for (const q of r.questions) expect(Number(q.qid.slice(2)), q.qid).toBeGreaterThanOrEqual(40)
    expect(r.hetCauMoi).toBeUndefined()
  })

  it('kho chỉ còn 3 câu MỚI: chặng = 3 câu mới + 3 câu LÂU NHẤT chưa gặp (không phải câu vừa làm gần đây), hetCauMoi = true', async () => {
    const d = dung({ soA: 10, soB: 0 })
    for (let i = 0; i < 7; i++) ghiSo(d, 'S1', `A-${i}`, 1, NGAY_TRUOC + i * 3_600_000) // A-0 lâu nhất … A-6 mới nhất (cùng ngày trước)
    const r = await rutVaLam(d)
    const ids = (r.questions as { qid: string }[]).map((q) => q.qid).sort()
    expect(r.hetCauMoi).toBe(true)
    expect(ids).toHaveLength(6)
    for (const moi of ['A-7', 'A-8', 'A-9']) expect(ids).toContain(moi)
    // 3 câu cũ = lâu nhất chưa gặp: A-0, A-1, A-2 (không phải A-4…A-6)
    for (const cu of ['A-0', 'A-1', 'A-2']) expect(ids).toContain(cu)
  })

  it('làm hết câu hôm nay rồi: KHÔNG lặp dù kho nhỏ — báo thật "hết câu mới", doan-mo từ chối bằng chính lời ấy', async () => {
    const d = dung({ soA: 6, soB: 0 })
    for (let i = 0; i < 6; i++) ghiSo(d, 'S1', `A-${i}`, 1, T0 - 3_600_000 + i)   // hôm nay, nguồn khác
    const r = await gameV2(d.env, 'start', danhDau({ token: await gameToken(d.env, 'S1'), mode: 'adventure' })) as any
    expect(r.questions).toEqual([])
    expect(r).toMatchObject({ lyDo: 'het_cau_moi_hom_nay' }); expect(r.message).toMatch(/hết câu mới/)
    await expect(gameV2(d.env, 'doan-mo', { token: await gameToken(d.env, 'S1') })).rejects.toThrow(/hết câu mới/)
  })

  it('câu vừa làm ở game HÔM NAY (kể cả lượt có trợ giúp — không vào sổ học) cũng không quay lại', async () => {
    const d = dung({ soA: 12, soB: 0 })
    d.sql.prepare("INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES('h','S1',?,'x')").run(JSON.stringify({ mode: 'adventure', questions: [], created: 1 }))
    const ins = d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
    for (let i = 0; i < 6; i++) ins.run(`ht${i}`, 'S1', 'h', `A-${i}`, `g-A-${i}`, JSON.stringify({ attempt: { id: `ht${i}`, session: 'h', qid: `A-${i}`, group: `g-A-${i}`, dang: 'A.1', mucDo: 'biet', correct: false, assisted: true, at: T0 - 1000, novel: true } }), new Date(T0 - 1000).toISOString())
    const r = await rutVaLam(d)
    for (const q of r.questions) expect(Number(q.qid.slice(2)), q.qid).toBeGreaterThanOrEqual(6)
  })
})

describe('câu làm HÔM NAY bị loại hẳn cả ở phần bù "lâu nhất chưa gặp"', () => {
  it('kho 8 câu: 6 câu em đã chơi ở game HÔM NAY (có trợ giúp) + 2 câu mới ⇒ chặng chỉ 2 câu mới (không bù bằng câu vừa làm hôm nay)', async () => {
    const d = dung({ soA: 8, soB: 0, soII: 0 })
    d.sql.prepare("INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES('h','S1',?,'x')").run(JSON.stringify({ mode: 'adventure', questions: [], created: 1 }))
    const ins = d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
    for (let i = 0; i < 6; i++) ins.run(`hn${i}`, 'S1', 'h', `A-${i}`, `g-A-${i}`, JSON.stringify({ attempt: { id: `hn${i}`, session: 'h', qid: `A-${i}`, group: `g-A-${i}`, dang: 'A.1', mucDo: 'biet', correct: false, assisted: true, at: T0 - 1000, novel: true } }), new Date(T0 - 1000).toISOString())
    const r = await gameV2(d.env, 'start', danhDau({ token: await gameToken(d.env, 'S1'), mode: 'adventure' })) as any
    expect((r.questions as { qid: string }[]).map((q) => q.qid).sort()).toEqual(['A-6', 'A-7'])
    expect(r.hetCauMoi).toBeUndefined() // không có câu cũ nào hợp lệ để bù ⇒ không phải "bù câu cũ"
  })
})

describe('luật cá nhân hoá: hai em khác hồ sơ ⇒ bộ câu khác', () => {
  it('S1 yếu dạng A.1, S2 yếu dạng B.2 (lượt game sai) ⇒ hai suất yếu của mỗi em theo dạng yếu CỦA CHÍNH EM; hai bộ khác nhau', async () => {
    const d = dung({ soA: 40, soB: 40, soII: 0 })
    const sai = (sbd: string, qid: string, dang: string) => {
      d.sql.prepare("INSERT OR IGNORE INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,'x')").run(`sai-${sbd}`, sbd, JSON.stringify({ mode: 'adventure', questions: [], created: 1 }))
      d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)').run(`x-${sbd}-${qid}`, sbd, `sai-${sbd}`, qid, `g-${qid}`, JSON.stringify({ attempt: { id: `x-${sbd}-${qid}`, session: `sai-${sbd}`, qid, group: `g-${qid}`, dang, mucDo: 'biet', correct: false, assisted: false, at: HOM_QUA, novel: true } }), new Date(HOM_QUA).toISOString())
    }
    for (let i = 30; i < 34; i++) { sai('S1', `A-${i}`, 'A.1'); sai('S2', `B-${i}`, 'B.2') }
    const a = await rutVaLam(d, 'S1'), b = await rutVaLam(d, 'S2')
    const dangA = (a.questions as { qid: string }[]).map((q) => q.qid[0]), dangB = (b.questions as { qid: string }[]).map((q) => q.qid[0])
    expect(dangA.filter((x) => x === 'A').length).toBeGreaterThanOrEqual(2)  // 2 suất yếu ⇒ ít nhất 2 câu A.1
    expect(dangB.filter((x) => x === 'B').length).toBeGreaterThanOrEqual(2)  // của S2: ít nhất 2 câu B.2
    expect(new Set([...(a.questions as { qid: string }[]).map((q) => q.qid)].sort()).size).toBe(6)
    expect((a.questions as { qid: string }[]).map((q) => q.qid).sort().join()).not.toBe((b.questions as { qid: string }[]).map((q) => q.qid).sort().join())
  })
})

describe('câu chung của TRÙM nhớ câu đã ra + câu đã làm', () => {
  const trumCua = (d: D1That, ma: string) => (JSON.parse((d.sql.prepare('SELECT json FROM doan_chang WHERE ma=?').get(ma) as { json: string }).json).trum as Record<string, { qid: string } | null>)
  const daRa = (d: D1That, sbd: string, qid: string, hiep = 4) => {
    const ma = `CU-${qid}-${sbd}`
    d.sql.prepare("INSERT INTO doan_chang(ma,json,chu,trang_thai,tao_luc) VALUES(?,?,?,'xong','2026-09-21T01:00:00.000Z')").run(ma, '{}', sbd)
    d.sql.prepare("INSERT INTO doan_luot(ma_chang,sbd,ngay_vn,lop,ghe,vao_luc) VALUES(?,?,?,?,0,?)").run(ma, sbd, '2026-09-21', '12', '2026-09-21T01:00:00.000Z')
    d.sql.prepare('INSERT INTO doan_trum_cau(ma_chang,hiep,lop,ngay_vn,ma_dang,qid,y_dung,so_ghe) VALUES(?,?,?,?,?,?,?,?)').run(ma, hiep, '12', '2026-09-21', 'A.1', qid, 2, 1)
  }
  it('các Phần II P-0…P-4 đã ra ở chặng trước của em ⇒ trùm hiệp 4 chọn câu CHƯA AI thấy (P-5…P-7)', async () => {
    const d = dung({ soA: 40, soB: 0, soII: 8 })
    for (let i = 0; i < 5; i++) daRa(d, 'S1', `P-${i}`)
    const ma = ((await gameV2(d.env, 'doan-mo', { token: await gameToken(d.env, 'S1') })) as any).doan.ma as string
    const t = trumCua(d, ma)
    expect(['P-5', 'P-6', 'P-7']).toContain(t['4']!.qid)
  })
  it('bạn trong đoàn cũng đã thấy: P-0…P-3 do S2 thấy, P-4 do S1 thấy — trùm tránh cả hai; và câu Phần II em đã làm HÔM NAY ở nguồn khác không ra', async () => {
    const d = dung({ soA: 40, soB: 0, soII: 6 })
    for (let i = 0; i < 4; i++) daRa(d, 'S2', `P-${i}`)
    daRa(d, 'S1', 'P-4')
    // câu chung P-5 em đã chơi HÔM NAY ở game (lượt có trợ giúp — không vào sổ học ⇒ chỉ đường `game_v2_attempt` mới thấy) ⇒ chặn cứng
    d.sql.prepare("INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES('h','S1',?,'x')").run(JSON.stringify({ mode: 'adventure', questions: [], created: 1 }))
    d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)').run('hn-p5', 'S1', 'h', 'P-5', 'g-P-5', JSON.stringify({ attempt: { id: 'hn-p5', session: 'h', qid: 'P-5', group: 'g-P-5', dang: 'A.1', mucDo: 'biet', correct: false, assisted: true, at: T0 - 1000, novel: true } }), new Date(T0 - 1000).toISOString())
    const ma = ((await gameV2(d.env, 'doan-mo', { token: await gameToken(d.env, 'S1'), cheDo: 'phong' })) as any).doan.ma as string
    await gameV2(d.env, 'doan-vao', { token: await gameToken(d.env, 'S2'), ma })
    await gameV2(d.env, 'doan-bat-dau', { token: await gameToken(d.env, 'S1'), ma })
    const t = trumCua(d, ma)
    // còn lại có thể chọn: không có câu nào chưa ai thấy (P-5 bị chặn) ⇒ vẫn chọn được một trong những câu ĐÃ thấy, nhưng KHÔNG BAO GIỜ P-5
    expect(t['4']?.qid).not.toBe('P-5'); expect(t['8']?.qid ?? '').not.toBe('P-5')
  })
})

describe('hàm thuần', () => {
  const q = (qid: string) => ({ qid, group: `g-${qid}` })
  it('tachMoiCu: hôm nay loại hẳn; đã làm ở sổ hoặc nhóm đã chơi ở game ⇒ cũ; còn lại mới', () => {
    const kq = tachMoiCu([q('A'), q('B'), q('C'), q('D')], new Set(['A', 'g-B']), new Map([['C', 5]]), new Set(['g-D']))
    expect(kq.moi.map((x) => x.qid)).toEqual([]); expect(kq.cu.map((x) => x.qid)).toEqual(['C', 'D'])
    expect(tachMoiCu([q('E')], new Set(), new Map(), new Set()).moi.map((x) => x.qid)).toEqual(['E'])
  })
  it('chonLauNhat: theo lần làm gần nhất ở mọi nguồn (sổ hoặc game), cũ nhất trước, cắt k; hoà ⇒ theo qid', () => {
    const cu = [q('c'), q('a'), q('b'), q('d')]
    const r = chonLauNhat(cu, new Map([['a', 300], ['b', 100], ['c', 200]]), new Map([['g-d', 250]]), 3) // d chỉ có ở lịch sử game (250)
    expect(r.map((x) => x.qid)).toEqual(['b', 'c', 'd'])
    expect(chonLauNhat(cu, new Map(), new Map(), 2).map((x) => x.qid)).toEqual(['a', 'b'])
    expect(chonLauNhat(cu, new Map(), new Map(), 0)).toEqual([])
  })
})

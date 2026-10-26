// @vitest-environment node
// LỆNH ĐỌC «GỢI Ý 3 TẦNG / LỜI GIẢI KIỂU SƠ ĐỒ» (26/10, server/src/loi-giai-so-do.ts) + trường `soDo` của `answer` — SQL chạy thật trên lược đồ thật
// (tests/_d1-that.ts: schema.sql + mọi migration, kể cả server/migration-2610-loi-giai-so-do.sql). SQLite trong bộ nhớ, không phải runtime D1.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich, xoaDemMetaCau } from '../server/src/srs2-d1'
import { xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import type { BanSoDo } from '../src/lib/goi-y-cham/kieu'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-26T03:00:00Z')
const Q = 'DH-12-SD-III-1'
const MA_DE = 'DH-12-SD'

function banXuoi(qid = Q): BanSoDo {
  return {
    qid, phienBan: 1,
    deNoiGi: 'Quặng chứa FeS_2; đề cho khối lượng quặng và phần trăm, hỏi khối lượng chất sau cùng.',
    soDo: { chieu: 'xuoi', nut: [{ tong: '1 tấn quặng', chat: 'FeS_2', soLieu: ['8%'] }, { chat: 'SO_2', soLieu: ['m kg = ?'] }], muiTen: [{ H: 90 }] },
    buoc: [{
      ten: 'm', donVi: 'kg', ketQua: '76,8',
      thuaSo: [
        { so: '10^6', nghia: 'đổi tấn ra gam' }, { so: '8/100', nghia: 'phần FeS_2' }, { so: '1/120', nghia: 'đổi ra tiền nhà FeS_2' },
        { so: '2', nghia: 'bảo toàn S: ra 2 SO_2' }, { so: '64', nghia: 'mol ra gam' }, { so: '90/100', nghia: 'đánh thuế' }, { so: '1/1000', nghia: 'gam ra kg' },
      ],
    }],
    ketQua: '76,8',
  }
}

let d: D1That, token: string
const goi = (than: Record<string, unknown>, env: Env = d.env) => goiWorker(worker, env, '/hs/goi-y-so-do', { token, qid: Q, ...than })
const themBan = (qid: string, ban: BanSoDo, cong = 'dat') =>
  d.sql.prepare("INSERT OR REPLACE INTO loi_giai_so_do(qid,ma_de,version,phien_ban,ban_json,cong,ly_do,tao_luc,cap_nhat_luc) VALUES(?,'test','v',?,?,?,NULL,?,?)")
    .run(qid, 1, JSON.stringify(ban), cong, String(NOW), String(NOW))
const themSoLuyen = (qid = Q) => d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,visibility,purpose) VALUES(?,'HS1',?,'game','G1',1,0,?,'2026-10-25','none','released','repair')")
  .run(`k-${qid}`, qid, new Date(NOW - 86_400_000).toISOString())
const themPhien = (id: string, qids: string[], daNop: string[] = []) => {
  d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run(id, 'HS1', JSON.stringify({ mode: 'learn', created: NOW, questions: qids.map((qid) => ({ qid, maDe: MA_DE, version: 'v1', group: 'g', novel: false })) }), new Date(NOW - 60_000).toISOString())
  for (const qid of daNop) d.sql.prepare("INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,'HS1',?,?,'g','{}',?)").run(`${id}|${qid}`, id, qid, new Date(NOW - 30_000).toISOString())
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW)
  d = taoD1That()
  xoaDemCaBaoVe()
  const cau = { qid: Q, maDe: MA_DE, version: 'v1', group: 'nhom-sd', phan: 'III', text: 'Từ 1 tấn quặng chứa 8% FeS2 điều chế được bao nhiêu kg SO2 (H = 90%)?', choices: [], ideas: [], correct: '76,8', solution: { chot: 'lời giải cũ' }, reviewed: true }
  d.sql.exec(`INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('HS1','Em Một','12','x','x');
    INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,cap_nhat_luc) VALUES('${MA_DE}','Sơ đồ','12',1,'kho/sd','v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('${MA_DE}','v1','x')`)
  d.sql.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,json) VALUES(?,?,'v1','nhom-sd',?)").run(MA_DE, Q, JSON.stringify(cau))
  token = await gameToken(d.env, 'HS1')
  themBan(Q, banXuoi())
})
afterEach(() => { d.sql.close(); vi.useRealTimers(); xoaDemCaBaoVe() })

describe('/hs/goi-y-so-do', () => {
  it('trước nộp: có bản, cắt mọi ketQua', async () => {
    const r = await goi({})
    expect(r).toMatchObject({ ok: true, co: true, giaiDoan: 'truoc' })
    expect(r.ban.buoc[0].thuaSo).toHaveLength(7)
    expect(JSON.stringify(r)).not.toMatch(/ketQua|76,8|"correct"|"solution"/)
  })

  it('sau nộp (em đã tự làm câu ở chỗ luyện): trả đủ, kể cả kết quả', async () => {
    themSoLuyen()
    const r = await goi({})
    expect(r).toMatchObject({ ok: true, co: true, giaiDoan: 'sau' })
    expect(r.ban.ketQua).toBe('76,8')
    expect(r.ban.buoc[0].ketQua).toBe('76,8')
  })

  it('sau nộp trong lượt: bản chấm của lượt có câu ⇒ trả đủ', async () => {
    themPhien('P1', [Q], [Q])
    expect(await goi({ session: 'P1' })).toMatchObject({ co: true, giaiDoan: 'sau', ban: { ketQua: '76,8' } })
  })

  it('đang làm lại câu (lượt chưa nộp) ⇒ vẫn cắt, dù đã từng làm; đánh dấu câu của lượt là có trợ giúp', async () => {
    themSoLuyen()
    themPhien('P2', ['DH-12-SD-III-0', Q])
    const r = await goi({ session: 'P2' })
    expect(r).toMatchObject({ co: true, giaiDoan: 'truoc' })
    expect(JSON.stringify(r)).not.toContain('ketQua')
    const phien = JSON.parse((d.sql.prepare("SELECT json FROM game_v2_session WHERE id='P2'").get() as { json: string }).json)
    expect(phien.questions[1].goiY).toBe(1)
    expect(phien.questions[0].goiY).toBeUndefined()
  })

  it('tắt ở kiểm tra cá nhân đang chạy', async () => {
    d.sql.prepare("INSERT INTO kiem_tra_ca_nhan(id,sbd,lop,ngay,mo_luc,han_luc,trang_thai,json,cap_nhat_luc) VALUES('kt1','HS1','12','2026-10-26',?,?,'hen','{}',?)").run(NOW - 1000, NOW + 60_000, NOW)
    d.sql.prepare("INSERT INTO kiem_tra_ca_nhan_chang(bai_id,stt,bat_dau,han) VALUES('kt1',0,?,?)").run(NOW - 1000, NOW + 60_000)
    themSoLuyen()
    const r = await goi({})
    expect(r).toMatchObject({ ok: true, co: false, lyDo: 'dang_kiem_tra' })
    expect(r.ban).toBeUndefined()
  })

  it('tắt khi câu nằm trong ca thi chưa công bố; không đọc được tập bảo vệ ⇒ cũng tắt', async () => {
    d.objects.set('key/ca-sd.json', { phanIII: [{ id: 'TO-KHAC-III-9', text: 'Một câu khác hẳn.', correct: '1' }] })
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,lop,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CA-SD','Ca','12','dong',?,?,60,'thi','khong','key/ca-sd.json','sd')")
      .run(new Date(NOW - 86_400_000).toISOString(), new Date(NOW - 60_000).toISOString())
    xoaDemCaBaoVe()
    expect(await goi({})).toMatchObject({ co: true }) // ca không chứa câu ⇒ vẫn mở
    d.objects.set('key/ca-sd.json', { phanIII: [{ id: Q, text: 'Từ 1 tấn quặng…', correct: '76,8' }] })
    d.sql.prepare("UPDATE ca SET cap_nhat_luc='sd2' WHERE ma_ca='CA-SD'").run()
    xoaDemCaBaoVe()
    themSoLuyen()
    const r = await goi({})
    expect(r).toMatchObject({ ok: true, co: false, lyDo: 'ca_chua_cong_bo' })
    expect(JSON.stringify(r)).not.toContain('76,8')
    // Gói đề của ca hỏng (không chuẩn hoá được) ⇒ tập bảo vệ lỗi ⇒ đóng, không đoán.
    d.objects.set('key/ca-sd.json', { cau: [{ hong: true }] })
    d.sql.prepare("UPDATE ca SET cap_nhat_luc='sd3' WHERE ma_ca='CA-SD'").run()
    xoaDemCaBaoVe()
    expect(await goi({})).toMatchObject({ co: false, lyDo: 'ca_chua_cong_bo' })
  })

  it('chỉ trả bản cổng «dat», và kiểm lại với đáp án kho HIỆN TẠI', async () => {
    themBan(Q, banXuoi(), 'lech')
    expect(await goi({})).toMatchObject({ co: false, lyDo: 'chua_co' })
    themBan(Q, banXuoi(), 'dat')
    d.sql.prepare("UPDATE game_v2_question SET json=json_set(json,'$.correct','80') WHERE qid=?").run(Q)
    expect(await goi({})).toMatchObject({ co: false, lyDo: 'chua_co' })
  })

  it('câu lặp #n dùng bản gốc; song sinh ~ss không dùng bản gốc', async () => {
    expect(await goi({ qid: `${Q}#2` })).toMatchObject({ co: true, giaiDoan: 'truoc' })
    expect(await goi({ qid: `${Q}~ss0` })).toMatchObject({ co: false })
  })

  it('cờ tắt toàn cục TAT_SO_DO ⇒ không trả gì', async () => {
    expect(await goi({}, { ...d.env, TAT_SO_DO: '1' } as Env)).toMatchObject({ ok: true, co: false, lyDo: 'tat' })
  })

  it('MỘT đợt chờ D1 (mọi lượt đọc song song); việc ghi «có trợ giúp» đi sau phản hồi', async () => {
    themPhien('P3', [Q])
    // Bộ đếm đợt như cổng tốc độ (tests/toc-do-may-chu-lenh-nong-1310.test.ts): giữ mọi lệnh, trả cả hàng khi mã rảnh = một đợt.
    const goc = d.env.DB as unknown as { prepare(q: string): any }
    const hang: (() => void)[] = []
    const cho = <T,>(f: () => Promise<T>) => new Promise<T>((ok, loi) => { hang.push(() => { f().then(ok, loi) }) })
    const boc = (st: any): any => ({ bind: (...a: unknown[]) => boc(st.bind(...a)), first: () => cho(() => st.first()), all: () => cho(() => st.all()), run: () => cho(() => st.run()) })
    const env = { ...d.env, DB: { prepare: (q: string) => boc(goc.prepare(q)), batch: (ds: unknown[]) => cho(() => d.env.DB.batch(ds as never)) } } as unknown as Env
    const { hsGoiYSoDo } = await import('../server/src/loi-giai-so-do')
    const sau: Promise<unknown>[] = []
    let xong = false, dot = 0
    const p = hsGoiYSoDo(env, { token: await gameToken(d.env, 'HS1'), qid: Q, session: 'P3' }, { sau: (v) => { sau.push(v) } }).finally(() => { xong = true })
    for (;;) { await new Promise((r) => setImmediate(r)); if (xong) break; if (hang.length) { dot++; for (const f of hang.splice(0)) f() } }
    expect(await p).toMatchObject({ co: true, giaiDoan: 'truoc' })
    expect(dot).toBe(1)
    for (let i = 0; i < 50 && sau.length && hang.length === 0; i++) await new Promise((r) => setImmediate(r))
    for (const f of hang.splice(0)) f()
    await Promise.all(sau)
  })

  it('bảng chưa có (migration chưa chạy) ⇒ co:false, không ném lỗi', async () => {
    d.sql.exec('DROP TABLE loi_giai_so_do')
    expect(await goi({})).toMatchObject({ ok: true, co: false, lyDo: 'chua_co' })
  })

  it('token hỏng ⇒ lỗi, không có bản', async () => {
    const r = await goiWorker(worker, d.env, '/hs/goi-y-so-do', { token: 'x.y', qid: Q })
    expect(r.ok).toBe(false)
    expect(r.ban).toBeUndefined()
  })
})

describe('/quan-tri/soan-so-do-lo', () => {
  it('đòi mã bí mật của thầy', async () => {
    const thuong = await worker.fetch(new Request('https://test/quan-tri/soan-so-do-lo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }), d.env)
    expect(thuong.status).toBe(403)
    const thay = await worker.fetch(new Request('https://test/quan-tri/soan-so-do-lo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ secret: 'bi-mat-thu' }) }), d.env)
    expect(thay.status).not.toBe(403) // qua cổng thầy; máy soạn thật (làn D) tự trả lỗi khi thiếu khoá mô hình
    // Workflow soan-so-do-2610.yml gửi mã ở HEADER `x-ma-bi-mat` (thân không có `secret`) ⇒ cũng qua cổng.
    const quaHeader = await worker.fetch(new Request('https://test/quan-tri/soan-so-do-lo', { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': 'bi-mat-thu' }, body: JSON.stringify({ thuKhong: true, gioiHan: 1 }) }), d.env)
    expect(quaHeader.status).not.toBe(403)
  })
})

// ---------------------------------------------------------------- `answer` kèm `soDo` (cùng kho với cổng tốc độ tests/toc-do-may-chu-lenh-nong-1310.test.ts)

const NOW2 = Date.parse('2026-10-12T13:30:00Z')
function banBon(qid: string): BanSoDo {
  return {
    qid, phienBan: 1, deNoiGi: 'Đề cho một lượng chất, hỏi lượng chất sau khi chia đôi.',
    soDo: { chieu: 'xuoi', nut: [{ chat: 'X', soLieu: ['a'] }, { chat: 'Y', soLieu: ['b = ?'] }], muiTen: [{}] },
    buoc: [{ ten: 'b', thuaSo: [{ so: '8', nghia: 'lượng ban đầu' }, { so: '1/2', nghia: 'chia đôi' }], ketQua: '4' }], ketQua: '4',
  }
}
describe('answer kèm soDo sau chấm', () => {
  afterEach(() => { xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi(); xoaDemMetaCau() })
  it('câu có bản đạt ⇒ phản hồi có `soDo` đủ kết quả, `solution` cũ giữ nguyên, bản chấm lưu không chứa soDo', async () => {
    vi.setSystemTime(NOW2)
    const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
    for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
    await damBaoBangBaiDaDay(k.env)
    const b8 = k.qids('DH-B8')
    k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk';
      INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',24,0,'v1');
      INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
      INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x');
      UPDATE game_v2_question SET json=json_set(json,'$.choices',json('["2","4","6","8"]')) WHERE ma_de='DH-B8' AND json_extract(json,'$.phan')='I'`)
    k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
      .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8"]', '2026-10-11T11:00:00Z')
    themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: b8, maDe: ['DH-B8'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
    await dongBoGoi7(k.env, NOW2)
    const ins = k.d.sql.prepare("INSERT INTO loi_giai_so_do(qid,ma_de,version,phien_ban,ban_json,cong,tao_luc,cap_nhat_luc) VALUES(?,'test','v',1,?,'dat','1','1')")
    for (const q of b8) ins.run(q, JSON.stringify(banBon(q)))
    const tk = await gameToken(k.env, 'S1')
    vi.setSystemTime(NOW2 + 40_000)
    const s = await goiWorker(worker, k.env, '/game-v2/hoc-tap-start', { token: tk })
    expect(s.ok, JSON.stringify(s).slice(0, 200)).toBe(true)
    expect(JSON.stringify(s)).not.toContain('soDo')
    const cau = (s.questions as { qid: string; phan: string }[]).find((x) => x.phan !== 'II')!
    expect(cau).toBeTruthy()
    vi.setSystemTime(NOW2 + 100_000)
    const r = await goiWorker(worker, k.env, '/game-v2/answer', { token: tk, session: s.id, qid: cau.qid, answer: cau.phan === 'I' ? 'B' : '4', assisted: false, msLam: 30_000 })
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect(r.correct).toBe(true)
    expect(r.solution).toMatchObject({ chot: `Cốt lõi ${cau.qid}` })
    expect(r.soDo).toMatchObject({ qid: cau.qid, ketQua: '4', buoc: [{ ketQua: '4' }] })
    const luu = k.d.sql.prepare('SELECT json FROM game_v2_attempt WHERE id=?').get(`${s.id}|${cau.qid}`) as { json: string }
    expect(luu.json).not.toContain('soDo')
    // Bấm chấm lại (bản đã chấm) vẫn kèm soDo.
    const lai = await goiWorker(worker, k.env, '/game-v2/answer', { token: tk, session: s.id, qid: cau.qid, answer: cau.phan === 'I' ? 'B' : '4', assisted: false, msLam: 30_000 })
    expect(lai).toMatchObject({ ok: true, replayed: true, soDo: { ketQua: '4' } })
    // Cờ tắt ⇒ không kèm, solution vẫn có.
    const khac = (s.questions as { qid: string; phan: string }[]).find((x) => x.phan !== 'II' && x.qid !== cau.qid)!
    const tat = await goiWorker(worker, { ...k.env, TAT_SO_DO: '1' } as Env, '/game-v2/answer', { token: tk, session: s.id, qid: khac.qid, answer: khac.phan === 'I' ? 'B' : '4', assisted: false, msLam: 30_000 })
    expect(tat.ok).toBe(true)
    expect(tat.soDo).toBeUndefined()
    expect(tat.solution).toBeTruthy()
    // Worker đẩy TRƯỚC khi chạy migration (bảng chưa có) ⇒ answer vẫn chấm được, không soDo, solution còn.
    k.d.sql.exec('DROP TABLE loi_giai_so_do')
    // Chấm lại câu đầu (lượt có thể chỉ có 2 câu không phải Phần II ⇒ không dựa vào câu thứ ba).
    const thieu = await goiWorker(worker, k.env, '/game-v2/answer', { token: tk, session: s.id, qid: cau.qid, answer: cau.phan === 'I' ? 'B' : '4', assisted: false, msLam: 30_000 })
    expect(thieu.ok, JSON.stringify(thieu).slice(0, 300)).toBe(true)
    expect(thieu.soDo).toBeUndefined()
    expect(thieu.solution).toBeTruthy()
    k.d.sql.close()
  })
})

// @vitest-environment node
// CÂU ĐÃ LÀM — ÍT ĐỢT D1 HƠN, KẾT QUẢ Y HỆT (tối ưu vòng 2, 06/10; thầy: "app thật mượt mà nhanh gấp 2 lần", "Câu đã làm phải mới ngay sau khi em làm xong câu").
// Trước: `hoa2-cau-da-lam` chạy 7 đợt D1 NỐI TIẾP (OMNI bật 8): hồ sơ thần thú → hồ sơ 2.0 (3–4 đợt) → đọc lại bảng chiến dịch → đọc JSON ĐẦY ĐỦ của từng câu để xét tự luận →
// đọc lịch sử có nguồn. Nay: lệnh (chỉ đọc) bắt đầu CÙNG đợt với hồ sơ thần thú; lịch sử có nguồn đọc ngay khi hồ sơ biết tập câu; danh sách chiến dịch lấy từ đệm chiến dịch hồ sơ vừa
// đọc; cờ tự luận lấy từ `hs.meta`. Khoá ở đây: (1) ngân sách đợt (3 khi OMNI tắt); (2) KHÔNG đệm dữ liệu: em vừa trả lời xong câu thì lần mở kế tiếp thấy ngay (lịch sử mới, không số cũ).
// Bằng chứng "kết quả y hệt" trên dữ liệu gần thật: tests/do-toi-uu-0510-may-chu.test.ts (`DO_SO` = phản hồi mọi lệnh + ảnh chụp D1 trùng bản trước, 0 khác biệt).
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { demVongD1 } from './_dem-vong-d1'
import { gvChienDich } from '../server/src/srs2-gv'
import { biaAction } from '../server/src/bi-a'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import type { Env } from '../server/src/kieu'

const NGAY = 86_400_000
const cau = (qid: string, ma = 'DE1') => JSON.stringify({ qid, maDe: ma, lop: '12', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'NB', sao: 1, kienThuc: ['k'], correct: 'B', reviewed: true, solution: { chot: `Cốt lõi ${qid}` } })
type Muc = { qid: string; chienDichId: string; trangThai: string; lichSu: { ngay: string; dung: boolean; nguon?: string }[] }

async function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','mk1','x')")
  d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Ester',20,0,'v1'),('DE9','KT',5,0,'v1')")
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x'),('DE9','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= 20; i++) st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, 'D1', cau(`Q${i}`))
  for (let i = 1; i <= 5; i++) st.run('DE9', `X${i}`, 'v1', `g-X${i}`, 'D1', cau(`X${i}`, 'DE9'))
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x'),('bi_a','{"bat":true}','x')`)
  // 06/10 (gộp làn A'): Bi-a nay cũng qua THANG làm lại câu sai — câu sai trong ca (X1..X5) là câu LỖI nên có thể ra bản xáo (chữ cái em chọn đổi so với câu gốc). Test này khoá SỐ ĐỢT D1
  // và kết quả đọc lại của "Câu đã làm", không phải thang ⇒ tắt khoá `lam_lai_khac` (đường BẬT: tests/lam-lai-cau-sai-0610-bi-a.test.ts).
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('lam_lai_khac','{"bat":false}','x')`)
  // ca kiểm tra đã công bố hôm qua: em sai X1..X5 (đề DE9, không thuộc chiến dịch nào) ⇒ nhóm "Câu sai trong ca kiểm tra"
  d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,cong_bo,thoi_gian_phut,cap_nhat_luc) VALUES('C1','KT','dong','thi','12A1','ngay',45,'x')")
  const hqua = new Date(Date.now() - NGAY).toISOString()
  const sk = d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES (?,?,?,'thi','C1',1,0,30,?,?)")
  for (let i = 1; i <= 5; i++) sk.run(`thi|C1|S1|X${i}`, 'S1', `X${i}`, hqua, hqua.slice(0, 10))
  expect((await gvChienDich(env, { action: 'tao', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE1'], hanNop: '2026-12-30', raiDeu: false }, Date.now() - 3 * NGAY)).ok).toBe(true)
  const token = await gameToken(env, 'S1')
  await gameV2(env, 'choose', { token, pet: 'dat_quy' })
  const ban = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, Date.now())
  return { d, env, token, ban, qs: (ban.bi as { qid: string }[]).map((x) => x.qid) }
}

describe('hoa2-cau-da-lam / hoa2-cau-chi-tiet — ít đợt D1, kết quả như cũ', () => {
  it('ngân sách: Câu đã làm ≤ 3 đợt D1 khi OMNI tắt (trước: 7); danh sách đúng câu em đã làm, đủ nhóm chiến dịch / ca sai, lịch sử có nguồn', async () => {
    const { env, token, ban, qs } = await dung()
    for (const q of qs) await gameV2(env, 'answer', { token, session: ban.session, qid: q, answer: 'B' })
    const { env: e2, d } = demVongD1(env)
    const r = await gameV2(e2, 'hoa2-cau-da-lam', { token })
    expect(r.ok).toBe(true)
    const ds = r.cau as Muc[]
    // câu em đã làm = các câu trả lời trong Bi-a + 5 câu sai trong ca kiểm tra đã công bố (nhóm riêng, nguồn "thi")
    const mong = new Set([...qs, 'X1', 'X2', 'X3', 'X4', 'X5'])
    expect(ds.map((c) => c.qid).sort()).toEqual([...mong].sort())
    const chiBia = ds.filter((c) => qs.includes(c.qid))
    expect(chiBia.length).toBe(qs.length)
    expect((r.chienDich as { id: string }[]).length).toBeGreaterThanOrEqual(1)
    for (const c of ds) expect(c.lichSu.length).toBeGreaterThanOrEqual(1)
    expect(chiBia.every((c) => c.lichSu.at(-1)!.nguon === 'bia')).toBe(true) // lần làm cuối của câu trả lời trong Bi-a ghi nguồn "Bi-a"
    expect(ds.filter((c) => c.qid.startsWith('X') && !qs.includes(c.qid)).every((c) => c.lichSu[0]!.nguon === 'thi')).toBe(true)
    // eslint-disable-next-line no-console
    console.log(`DO|cau-da-lam|${d.vong}|${d.dot}`)
    expect(d.dot).toBeLessThanOrEqual(3)
  })

  it('KHÔNG đệm dữ liệu: em vừa trả lời thêm một câu thì lần mở kế tiếp thấy ngay (lịch sử mới, câu mới)', async () => {
    const { env, token, ban, qs } = await dung()
    await gameV2(env, 'answer', { token, session: ban.session, qid: qs[0], answer: 'B' })
    const truoc = (await gameV2(env, 'hoa2-cau-da-lam', { token })).cau as Muc[]
    expect(truoc.some((c) => c.qid === qs[0])).toBe(true)
    expect(truoc.some((c) => c.qid === qs[1])).toBe(false) // chưa làm ⇒ chưa hiện
    await gameV2(env, 'answer', { token, session: ban.session, qid: qs[1], answer: 'A' })
    const sau = (await gameV2(env, 'hoa2-cau-da-lam', { token })).cau as Muc[]
    expect(sau.length).toBe(truoc.length + (truoc.some((c) => c.qid === qs[1]) ? 0 : 1))
    expect(sau.find((c) => c.qid === qs[1])!.lichSu.at(-1)).toMatchObject({ dung: false, nguon: 'bia' }) // lần vừa làm hiện NGAY, không số cũ
  })

  it('chi tiết câu: đề + đáp án + lời giải của câu em ĐÃ làm, câu chưa làm không trả đáp án — không đổi; ≤ 5 đợt D1', async () => {
    const { env, token, ban, qs } = await dung()
    await gameV2(env, 'answer', { token, session: ban.session, qid: qs[0], answer: 'B' })
    const { env: e2, d } = demVongD1(env)
    const ct = await gameV2(e2, 'hoa2-cau-chi-tiet', { token, qids: [qs[0], qs[1]] })
    const ds = ct.cau as { de: { qid: string }; dapAn: string; emTraLoi: string }[]
    expect(ds.map((x) => x.de.qid).includes(qs[0]!)).toBe(true)
    expect(ds.find((x) => x.de.qid === qs[0])).toMatchObject({ dapAn: 'B', emTraLoi: 'B' })
    expect(ds.some((x) => x.de.qid === qs[1])).toBe(false) // câu chưa làm ⇒ không trả đáp án
    expect(d.dot).toBeLessThanOrEqual(5)
  })

  it('em chưa chọn thần thú ⇒ trả lời như cũ (kết quả chạy sớm bị bỏ, không lộ gì)', async () => {
    const { d, env } = await dung()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S2','Bình','12A1','mk2','x')")
    const t2 = await gameToken(env, 'S2')
    const r = await gameV2(env, 'hoa2-cau-da-lam', { token: t2 })
    expect(r).toMatchObject({ ok: true, cheDo2: true, canChonThu: true })
    expect('cau' in r).toBe(false)
  })

  it('em chưa ở Hoá 2.0 (cờ tắt) ⇒ { ok:true, cheDo2:false } như cũ (kết quả chạy sớm bị bỏ)', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','An','12A1','mk1','x')")
    const token = await gameToken(env, 'S1') // không có dòng cờ `game_hoa_2` ⇒ tắt
    await gameV2(env, 'choose', { token, pet: 'dat_quy' })
    const tat = await gameV2(env, 'hoa2-cau-da-lam', { token })
    expect(tat).toMatchObject({ ok: true, cheDo2: false })
    expect('cau' in tat).toBe(false)
  })
})

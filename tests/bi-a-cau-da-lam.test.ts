// @vitest-environment node
// BI-A · CÂU ĐÃ LÀM (thầy 28/09: "Phải lưu câu đã làm ở game bia nữa. Tôi chưa thấy lưu").
// Nguyên nhân gốc: Bi-a (và Đoàn) phát CÂU ÔN trước; câu ôn gồm câu sai trong ca kiểm tra đã công bố (nguồn `ca_sai`) — không thuộc chiến dịch nào,
// mà `hoa2-cau-da-lam` chỉ liệt kê câu của chiến dịch ⇒ em trả lời trong Bi-a xong không thấy. Nay: nhóm "Câu sai trong ca kiểm tra" + nguồn từng lần làm.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { biaAction } from '../server/src/bi-a'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { NHOM_CAU_ON_CA } from '../server/src/srs2-game'
import { docCauDaLam } from '../src/components/hoa2/api'
import { chuLanLam } from '../src/components/hoa2/cau-chuyen'
import type { Env } from '../server/src/kieu'

const NGAY = 86_400_000
const cau = (qid: string, ma = 'DE1') => JSON.stringify({ qid, maDe: ma, version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'TH', sao: 1, kienThuc: ['k'], correct: 'B', reviewed: true, solution: { chot: `Cốt lõi ${qid}` } })
type Muc = { qid: string; chienDichId: string; trangThai: string; lichSu: { ngay: string; dung: boolean; nguon?: string }[] }

async function dung(o: { caSai?: boolean } = {}) {
  const d = taoD1That(); const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','mk1','x')")
  d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Ester',20,0,'v1'),('DE9','KT',5,0,'v1')")
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x'),('DE9','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= 20; i++) st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, 'D1', cau(`Q${i}`))
  for (let i = 1; i <= 5; i++) st.run('DE9', `X${i}`, 'v1', `g-X${i}`, 'D1', cau(`X${i}`, 'DE9'))
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x'),('bi_a','{"bat":true}','x')`)
  if (o.caSai) {
    // ca kiểm tra đã công bố hôm qua: em sai X1..X5 (đề DE9, không thuộc chiến dịch nào)
    d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,cong_bo,thoi_gian_phut,cap_nhat_luc) VALUES('C1','KT','dong','thi','12A1','ngay',45,'x')")
    const hqua = new Date(Date.now() - NGAY).toISOString()
    const sk = d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES (?,?,?,'thi','C1',1,0,30,?,?)")
    for (let i = 1; i <= 5; i++) sk.run(`thi|C1|S1|X${i}`, 'S1', `X${i}`, hqua, hqua.slice(0, 10))
  }
  // raiDeu:false (30/09): test này kiểm Bi-a với kế hoạch đổ đầy thể lực (hạn xa ⇒ rải đều chỉ 1 câu/ngày, bàn không đủ bi)
  expect((await gvChienDich(env, { action: 'tao', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE1'], hanNop: '2026-12-30', raiDeu: false }, Date.now() - 3 * NGAY)).ok).toBe(true)
  const token = await gameToken(env, 'S1')
  await gameV2(env, 'choose', { token, pet: 'dat_quy' })
  const ban = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, Date.now())
  return { d, env, token, ban, qs: (ban.bi as { qid: string }[]).map((x) => x.qid), chot: (ban.chot as { qid: string }).qid }
}

describe('Câu đã làm có câu em trả lời trong Bi-a', () => {
  it('câu chiến dịch trả lời trong Bi-a: hiện đúng trạng thái, lịch sử ghi nguồn "Bi-a"; xem chi tiết được đề + đáp án + lời giải; câu chưa trả lời KHÔNG hiện, không lộ đáp án', async () => {
    const { env, token, ban, qs } = await dung()
    await gameV2(env, 'answer', { token, session: ban.session, qid: qs[0], answer: 'B' })
    await gameV2(env, 'answer', { token, session: ban.session, qid: qs[1], answer: 'A' })
    const r = await gameV2(env, 'hoa2-cau-da-lam', { token })
    const cau = r.cau as Muc[]
    expect(cau.map((c) => c.qid).sort()).toEqual([qs[0], qs[1]].sort())
    expect(cau.find((c) => c.qid === qs[0])).toMatchObject({ trangThai: 'dang_on', lichSu: [{ dung: true, nguon: 'bia' }] })
    expect(cau.find((c) => c.qid === qs[1])).toMatchObject({ trangThai: 'dang_on', lichSu: [{ dung: false, nguon: 'bia' }] })
    const ct = await gameV2(env, 'hoa2-cau-chi-tiet', { token, qids: [qs[0], qs[1], qs[2]] })
    const ds = ct.cau as { de: { qid: string }; dapAn: string; loiGiai: { chot: string }; emTraLoi: string }[]
    expect(ds.map((x) => x.de.qid)).toEqual([qs[0], qs[1]]) // qs[2] còn trên bàn, chưa trả lời ⇒ không trả đáp án
    expect(ds[0]).toMatchObject({ dapAn: 'B', loiGiai: { chot: `Cốt lõi ${qs[0]}` }, emTraLoi: 'B' })
    expect(ds[1]!.emTraLoi).toBe('A')
    // máy em đọc được nguồn và hiện chữ
    const may = docCauDaLam(r)
    if (!may.cheDo2) throw new Error('cheDo2')
    expect(chuLanLam(may.cau.find((c) => c.qid === qs[0])!.lichSu[0]!)).toMatch(/^Đúng \d{2}\/\d{2} · Bi-a$/)
  })

  it('câu ôn NGOÀI chiến dịch (câu sai trong ca kiểm tra đã công bố) trả lời trong Bi-a: hiện ở nhóm "Câu sai trong ca kiểm tra", lịch sử: Ca kiểm tra (sai) rồi Bi-a — TRƯỚC ĐÂY KHÔNG HIỆN', async () => {
    const { env, token, ban, qs, chot } = await dung({ caSai: true })
    const ngoai = [...qs, chot].filter((q) => q.startsWith('X'))
    expect(ngoai.length).toBeGreaterThan(0) // Bi-a phát câu ôn trước
    for (const q of [...qs, chot]) await gameV2(env, 'answer', { token, session: ban.session, qid: q, answer: 'B' })
    const r = await gameV2(env, 'hoa2-cau-da-lam', { token })
    const nhom = (r.chienDich as { id: string; ten: string; tong: number }[]).find((c) => c.id === NHOM_CAU_ON_CA)
    expect(nhom).toMatchObject({ ten: 'Câu sai trong ca kiểm tra', tong: 5 }) // câu sai trong ca đã công bố cũng là "đã làm" (một lần ở ca), như câu chiến dịch làm trong ca
    expect((r.chienDich as { id: string }[])[0]!.id).not.toBe(NHOM_CAU_ON_CA) // chiến dịch thật vẫn đứng đầu (mặc định trên màn)
    const cau = r.cau as Muc[]
    for (const q of ngoai) expect(cau.find((c) => c.qid === q)).toMatchObject({ chienDichId: NHOM_CAU_ON_CA, lichSu: [{ dung: false, nguon: 'thi' }, { dung: true, nguon: 'bia' }] })
    for (const q of qs.filter((x) => x.startsWith('Q'))) expect(cau.find((c) => c.qid === q)?.lichSu).toEqual([expect.objectContaining({ nguon: 'bia' })])
    // câu ca sai CHƯA làm lại: chỉ có lần sai trong ca
    const chuaLam = ['X1', 'X2', 'X3', 'X4', 'X5'].filter((x) => !ngoai.includes(x))
    for (const q of chuaLam) expect(cau.find((c) => c.qid === q)).toMatchObject({ chienDichId: NHOM_CAU_ON_CA, lichSu: [{ dung: false, nguon: 'thi' }] })
    const ct = await gameV2(env, 'hoa2-cau-chi-tiet', { token, qids: ngoai })
    expect((ct.cau as { de: { qid: string } }[]).map((x) => x.de.qid).sort()).toEqual([...ngoai].sort())
  })

  it('nguồn lần làm: Bát Linh Đảo / Đoàn Hộ Tống theo phiên; bản máy chủ cũ (không có nguồn) vẫn đọc được', async () => {
    const { d, env, token } = await dung()
    const now = new Date().toISOString()
    d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('p-dao', 'S1', JSON.stringify({ mode: 'adventure', hoa2: 1, questions: [] }), now)
    d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('p-doan', 'S1', JSON.stringify({ mode: 'adventure', hoa2: 1, doan: 1, questions: [] }), now)
    const sk = d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES (?,?,?,'game',?,1,?,30,?,?)")
    sk.run('game|p-dao|S1|Q20|1', 'S1', 'Q20', 'p-dao', 1, now, now.slice(0, 10))
    sk.run('game|p-doan|S1|Q19|1', 'S1', 'Q19', 'p-doan', 0, now, now.slice(0, 10))
    const r = await gameV2(env, 'hoa2-cau-da-lam', { token })
    const cau = r.cau as Muc[]
    expect(cau.find((c) => c.qid === 'Q20')!.lichSu[0]!.nguon).toBe('dao')
    expect(cau.find((c) => c.qid === 'Q19')!.lichSu[0]!.nguon).toBe('doan')
    const may = docCauDaLam({ chienDich: [], cau: [{ qid: 'Q1', lichSu: [{ ngay: '2026-09-28', dung: false, coGoiY: true }, { ngay: '2026-09-28', dung: true, nguon: 'la' }] }] })
    if (!may.cheDo2) throw new Error('cheDo2')
    expect(may.cau[0]!.lichSu.map(chuLanLam)).toEqual(['Sai 28/09 · có gợi ý', 'Đúng 28/09'])
  })
})

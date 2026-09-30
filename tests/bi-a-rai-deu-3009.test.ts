// @vitest-environment node
// THẦY LỆNH 30/09: "Bi a cũng rải luôn câu ôn lại đúng theo tỷ lệ trần của bi a luôn".
// Cùng ngày PR #108 bật RẢI ĐỀU (câu mới/ngày dừng đúng quota, thể lực dư dành cho ôn) ⇒ kế hoạch ngày có thể nhỏ. Luật Bi-a mới:
//   (1) trần = floor(40% TOÀN BỘ kế hoạch ngày) — cả câu mới lẫn câu ôn lại (nợ, củng cố, duy trì) — chia theo đúng tỉ lệ mới : ôn của kế hoạch;
//   (2) trần còn ít hơn một bàn đủ (7 bi + Câu chốt) ⇒ bàn VẪN MỞ với đúng số câu còn (bi thiếu câu là bi trống), Sảnh báo "Hôm nay Bi-a còn N câu";
//       Câu chốt chỉ khi còn ≥ 2 câu; (3) "Trả lời câu hỏi" cùng luật; (4) Sảnh đếm đúng luật mới.
// Kèm bản CHẠY VỚI RẢI ĐỀU BẬT (mặc định) của hai test cũ tests/bi-a-cau-da-lam.test.ts và tests/bi-a-giu-cau-3009.test.ts (bản cũ đặt raiDeu:false).
// D1 thật (node:sqlite, lược đồ đủ migration).
import { beforeEach, describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { layKeHoachHomNay, qidGoc } from '../server/src/srs2-d1'
import { biaAction, biaChoSanh, laCauMoiKeHoach, LOI_BIA, tinhTranBia } from '../server/src/bi-a'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import type { Env } from '../server/src/kieu'

const NGAY = 86_400_000
function cauJson(qid: string, phan: 'I' | 'II' | 'III', mucDo: string, dang: string, correct: string) {
  return JSON.stringify({
    qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
    hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo, sao: 1, kienThuc: ['k'], correct, reviewed: true, solution: { chot: `Cốt lõi ${qid}` },
  })
}
const dapAn = (i: number) => (i % 4 === 0 ? 'DSDS' : i % 5 === 0 ? '4' : 'B')
const dapAnCua = (qid: string) => dapAn(Number(qid.slice(1)))
function fixture(soCau = 45) {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','mk1','x')")
  d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Ester',${soCau},0,'v1')`)
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= soCau; i++) {
    const phan = i % 4 === 0 ? 'II' : i % 5 === 0 ? 'III' : 'I'
    st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, `D${i % 3}`, cauJson(`Q${i}`, phan, ['NB', 'TH', 'VD'][i % 3]!, `D${i % 3}`, dapAn(i)))
  }
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bi_a','{"bat":true,"lop":["12A1"]}','x')`)
  return { d, env }
}
/** Giao chiến dịch với RẢI ĐỀU mặc định (không truyền raiDeu). Hạn còn `ngayHan` ngày ⇒ quota câu mới = ceil(số câu / (ngayHan + 1 − 3)). */
async function giao(env: Env, ngayHan = 5) {
  const nay = Date.now()
  const r = await gvChienDich(env, { action: 'tao', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE1'], hanNop: new Date(nay + ngayHan * NGAY).toISOString().slice(0, 10) }, nay - 3 * NGAY)
  expect(r.ok).toBe(true)
}
/** Câu ôn (nợ) hôm nay: em sai từ hôm qua. */
async function taoCauOn(env: Env, qids: string[]) {
  const hqua = Date.now() - NGAY
  await ghiSuKien(env, qids.map((q) => ({ nguon: 'game', maNguon: `p-${q}`, sbd: 'S1', qid: q, lan: 1, ketQua: 0, luc: new Date(hqua).toISOString() })))
}
const tran = (s: Record<string, unknown>) => s.tran as { con: number; tong: number; tranMoi: number; tranOn: number; conMoi: number; conOn: number }
const trenBan = (b: Record<string, unknown>) => [...(b.bi as { qid: string }[]), b.chot as { qid: string } | null].filter(Boolean).map((q) => q!.qid)
/** Kế hoạch hôm nay + nhóm mới/ôn + trần theo luật mới (tính độc lập từ kế hoạch). */
async function keHoach(env: Env, nay: number) {
  const { kh, hs } = await layKeHoachHomNay(env, 'S1', nay)
  const tatCa = [...kh.doan, ...kh.dao]
  const laMoi = (k: string) => laCauMoiKeHoach(k, hs, kh.ngay)
  const moi = new Set(tatCa.filter(laMoi).map(qidGoc))
  const soMoi = tatCa.filter(laMoi).length
  return { kh, moi, soMoi, soOn: tatCa.length - soMoi, t: tinhTranBia(soMoi, tatCa.length - soMoi, 0, 0) }
}
/** Làm hết câu Bi-a bằng "Trả lời câu hỏi" (mỗi lượt ≤ 10 câu) ⇒ danh sách câu đã nhận, theo thứ tự. */
async function lamHetBangTraLoi(env: Env, nay: number): Promise<{ qids: string[]; cuoi: Record<string, unknown> }> {
  const token = await gameToken(env, 'S1')
  const qids: string[] = []
  for (let luot = 0; luot < 20; luot++) {
    const r = await biaAction(env, 'S1', 'bia-tra-loi', {}, nay + luot * 1000)
    if (!r.session) return { qids, cuoi: r }
    for (const c of r.cau as { qid: string }[]) {
      qids.push(c.qid)
      await gameV2(env, 'answer', { token, session: String(r.session), qid: c.qid, answer: dapAnCua(c.qid), assisted: false })
    }
  }
  throw new Error('Trả lời câu hỏi không dừng')
}

beforeEach(() => xoaDemCaBaoVe())

describe('Thầy 30/09: Bi-a rải câu ôn lại đúng tỉ lệ trần 40% trên TOÀN BỘ kế hoạch (rải đều bật)', () => {
  it('kế hoạch có cả câu mới (quota rải đều) lẫn nợ: Sảnh = floor(40% cả kế hoạch), chia mới : ôn theo tỉ lệ kế hoạch; hoa2-sanh cùng số', async () => {
    const { env } = fixture()
    await giao(env)
    await taoCauOn(env, ['Q1', 'Q2', 'Q3', 'Q5', 'Q6', 'Q7', 'Q9', 'Q10'])
    const nay = Date.now()
    const { t, soMoi, soOn } = await keHoach(env, nay)
    expect(soMoi).toBeGreaterThan(0)
    expect(soOn).toBeGreaterThan(0)
    expect(t.tong).toBe(Math.floor(0.4 * (soMoi + soOn)))
    expect(t.tranMoi).toBeGreaterThan(0)
    expect(t.tranOn).toBeGreaterThan(0)
    const s = await biaAction(env, 'S1', 'bia-sanh', {}, nay)
    expect(tran(s)).toMatchObject({ con: t.tong, tong: t.tong, tranMoi: t.tranMoi, tranOn: t.tranOn, conMoi: t.tranMoi, conOn: t.tranOn })
    expect(await biaChoSanh(env, 'S1', nay)).toMatchObject({ con: t.tong, tong: t.tong })
  })

  it('"Trả lời câu hỏi" làm hết trần: đúng tranMoi câu mới + tranOn câu ôn (không hơn, không kém); câu mới đều thuộc quota rải đều; Đảo vẫn còn câu mới', async () => {
    const { env } = fixture()
    await giao(env)
    await taoCauOn(env, ['Q1', 'Q2', 'Q3', 'Q5', 'Q6', 'Q7', 'Q9', 'Q10'])
    const nay = Date.now()
    const { kh, t, moi, soMoi } = await keHoach(env, nay)
    const { qids, cuoi } = await lamHetBangTraLoi(env, nay)
    expect(qids).toHaveLength(t.tong)
    expect(new Set(qids).size).toBe(qids.length)
    const keHoachQ = new Set([...kh.doan, ...kh.dao].map(qidGoc))
    for (const q of qids) expect(keHoachQ.has(q)).toBe(true) // chỉ câu trong kế hoạch ⇒ không vượt quota câu mới rải đều
    expect(qids.filter((q) => moi.has(q))).toHaveLength(t.tranMoi)
    expect(qids.filter((q) => !moi.has(q))).toHaveLength(t.tranOn)
    expect(soMoi - t.tranMoi).toBeGreaterThan(0) // Bi-a không "ăn" hết câu mới của Đảo
    expect(cuoi).toMatchObject({ ok: true, lyDo: 'het_tran', message: LOI_BIA.het_tran })
    const s = await biaAction(env, 'S1', 'bia-sanh', {}, nay + 60_000)
    expect(tran(s)).toMatchObject({ con: 0, tong: t.tong })
    expect(s.lyDoKhoa).toBe('het_tran')
  })

  it('xếp bàn: số bi câu mới : câu ôn theo tỉ lệ phần còn trần, câu ôn đứng trước, mỗi nhóm không vượt trần của nhóm', async () => {
    const { env } = fixture()
    await giao(env)
    await taoCauOn(env, ['Q1', 'Q2', 'Q3', 'Q5', 'Q6', 'Q7', 'Q9', 'Q10'])
    const nay = Date.now()
    const { t, moi } = await keHoach(env, nay)
    const ban = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, nay)
    const bi = (ban.bi as { qid: string }[]).map((q) => q.qid)
    const tatCa = trenBan(ban)
    expect(tatCa.length).toBe(Math.min(8, t.tong))
    expect(tatCa.filter((q) => moi.has(q)).length).toBeLessThanOrEqual(t.tranMoi)
    expect(tatCa.filter((q) => !moi.has(q)).length).toBeLessThanOrEqual(t.tranOn)
    const viTriMoi = bi.findIndex((q) => moi.has(q))
    if (viTriMoi >= 0) expect(bi.slice(viTriMoi).every((q) => moi.has(q))).toBe(true)
    // tỉ lệ trên bàn lệch tỉ lệ trần không quá 1 câu (làm tròn + Câu chốt)
    const moiTrenBan = tatCa.filter((q) => moi.has(q)).length
    expect(Math.abs(moiTrenBan - (tatCa.length * t.tranMoi) / t.tong)).toBeLessThanOrEqual(1)
  })
})

describe('Trần Bi-a còn ít hơn một bàn đủ: bàn vẫn mở với đúng số câu còn, báo rõ', () => {
  it('kế hoạch rải đều nhỏ (chỉ câu mới): trần X < 8 ⇒ Sảnh báo "Hôm nay Bi-a còn X câu", bàn có X câu (Câu chốt + X−1 bi), bi còn lại là bi trống', async () => {
    const { env } = fixture()
    await giao(env)
    const nay = Date.now()
    const { t, soOn } = await keHoach(env, nay)
    expect(soOn).toBe(0)
    const X = t.tong
    expect(X).toBeGreaterThanOrEqual(2)
    expect(X).toBeLessThan(8)
    const s = await biaAction(env, 'S1', 'bia-sanh', {}, nay)
    expect(tran(s)).toMatchObject({ con: X, tong: X })
    expect(s.lyDoKhoa).toBeUndefined()
    expect(String(s.thongBao)).toContain(`Hôm nay Bi-a còn ${X} câu`)
    const ban = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, nay)
    expect(ban.van).toBeTruthy()
    expect(ban.chot).toBeTruthy()
    expect((ban.bi as unknown[]).length).toBe(X - 1)
    expect(ban.trong).toBe(7 - (X - 1))
    expect(String(ban.thongBao)).toContain(`còn ${X} câu`)
  })

  it('còn đúng 1 câu ⇒ bàn mở với 1 bi mang câu, KHÔNG Câu chốt (Bi chốt trống); làm xong ⇒ Sảnh "Hết câu Bi-a hôm nay"', async () => {
    const { env } = fixture()
    await giao(env)
    const nay = Date.now()
    const token = await gameToken(env, 'S1')
    const X = (await keHoach(env, nay)).t.tong
    const ban1 = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, nay)
    const q1 = trenBan(ban1)
    expect(q1).toHaveLength(X)
    for (const q of q1.slice(0, X - 1)) await gameV2(env, 'answer', { token, session: String(ban1.session), qid: q, answer: dapAnCua(q), assisted: false })
    expect(tran(await biaAction(env, 'S1', 'bia-sanh', {}, nay + 60_000))).toMatchObject({ con: 1, tong: X })
    const ban2 = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, nay + 120_000)
    expect(ban2.van).toBeTruthy()
    expect(ban2.chot).toBeNull()
    expect(trenBan(ban2)).toEqual([q1[X - 1]])
    expect(ban2.trong).toBe(6)
    expect(String(ban2.thongBao)).toContain('còn 1 câu')
    await gameV2(env, 'answer', { token, session: String(ban2.session), qid: q1[X - 1], answer: dapAnCua(q1[X - 1]!), assisted: false })
    const s = await biaAction(env, 'S1', 'bia-sanh', {}, nay + 180_000)
    expect(s).toMatchObject({ lyDoKhoa: 'het_tran', message: LOI_BIA.het_tran })
    expect(tran(s)).toMatchObject({ con: 0, tong: X })
    expect(await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, nay + 240_000)).toMatchObject({ ok: true, lyDo: 'het_tran', message: LOI_BIA.het_tran })
    expect(await biaAction(env, 'S1', 'bia-tra-loi', {}, nay + 240_000)).toMatchObject({ ok: true, lyDo: 'het_tran' })
  })

  it('kế hoạch rải đều rất nhỏ (hạn xa ⇒ 1 câu mới/ngày): trần 0 ⇒ báo rõ "Hết câu Bi-a hôm nay", không kẹt, không lỗi', async () => {
    const { env } = fixture(20)
    await giao(env, 90)
    const nay = Date.now()
    const { kh, t } = await keHoach(env, nay)
    expect(kh.tong).toBeLessThanOrEqual(2)
    expect(t.tong).toBe(0)
    expect(await biaAction(env, 'S1', 'bia-sanh', {}, nay)).toMatchObject({ ok: true, lyDoKhoa: 'het_tran', message: LOI_BIA.het_tran, tran: { con: 0, tong: 0 } })
    expect(await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, nay)).toMatchObject({ ok: true, lyDo: 'het_tran', message: LOI_BIA.het_tran })
  })
})

// ---------------------------------------------------------------- bản RẢI ĐỀU BẬT của hai test cũ (bản cũ: raiDeu:false)
describe('[rải đều bật] ẢNH THẦY 30/09: vào bàn, chưa trả lời câu nào, thoát ⇒ Sảnh vẫn đủ số câu (bản của tests/bi-a-giu-cau-3009.test.ts)', () => {
  it('X/X → vào bàn (min(8, X) câu lên bàn) → thoát không kết ván ⇒ Sảnh Bi-a và cửa Sảnh Bát Linh vẫn X/X', async () => {
    const { env } = fixture()
    await giao(env)
    const nay = Date.now()
    const truoc = await biaAction(env, 'S1', 'bia-sanh', {}, nay)
    const X = tran(truoc).tong
    expect(X).toBeGreaterThan(0)
    expect(tran(truoc)).toMatchObject({ con: X, tong: X })
    const ban = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, nay)
    expect(trenBan(ban)).toHaveLength(Math.min(8, X))
    const sau = await biaAction(env, 'S1', 'bia-sanh', {}, nay + 60_000)
    expect(tran(sau)).toMatchObject({ con: X, tong: X })
    expect(await biaChoSanh(env, 'S1', nay + 60_000)).toMatchObject({ con: X, tong: X })
  })
  it('câu ĐÃ trả lời vẫn trừ; vào lại bàn nhận lại ĐÚNG các câu cũ (Câu chốt cũ, câu đã làm không lên lại)', async () => {
    const { env } = fixture()
    await giao(env)
    const nay = Date.now()
    const X = tran(await biaAction(env, 'S1', 'bia-sanh', {}, nay)).tong
    expect(X).toBeGreaterThanOrEqual(3)
    const ban1 = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, nay)
    const q1 = trenBan(ban1)
    const token = await gameToken(env, 'S1')
    const daLam = (ban1.bi as { qid: string }[])[0]!.qid
    await gameV2(env, 'answer', { token, session: String(ban1.session), qid: daLam, answer: dapAnCua(daLam), assisted: false })
    expect(tran(await biaAction(env, 'S1', 'bia-sanh', {}, nay + 60_000))).toMatchObject({ con: X - 1, tong: X })
    const ban2 = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, nay + 120_000)
    const q2 = trenBan(ban2)
    expect((ban2.chot as { qid: string }).qid).toBe((ban1.chot as { qid: string }).qid)
    expect(q2).not.toContain(daLam)
    for (const q of q1.filter((x) => x !== daLam)) expect(q2).toContain(q)
  })
})

describe('[rải đều bật] Câu đã làm có câu em trả lời trong Bi-a (bản của tests/bi-a-cau-da-lam.test.ts)', () => {
  const cauI = (qid: string, ma = 'DE1') => JSON.stringify({ qid, maDe: ma, version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'TH', sao: 1, kienThuc: ['k'], correct: 'B', reviewed: true, solution: { chot: `Cốt lõi ${qid}` } })
  async function dung(o: { caSai?: boolean } = {}) {
    const d = taoD1That(); const env = d.env as unknown as Env
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','mk1','x')")
    d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Ester',20,0,'v1'),('DE9','KT',5,0,'v1')")
    d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x'),('DE9','v1','x')")
    const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
    for (let i = 1; i <= 20; i++) st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, 'D1', cauI(`Q${i}`))
    for (let i = 1; i <= 5; i++) st.run('DE9', `X${i}`, 'v1', `g-X${i}`, 'D1', cauI(`X${i}`, 'DE9'))
    d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x'),('bi_a','{"bat":true}','x')`)
    if (o.caSai) {
      d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,cong_bo,thoi_gian_phut,cap_nhat_luc) VALUES('C1','KT','dong','thi','12A1','ngay',45,'x')")
      const hqua = new Date(Date.now() - NGAY).toISOString()
      const sk = d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES (?,?,?,'thi','C1',1,0,30,?,?)")
      for (let i = 1; i <= 5; i++) sk.run(`thi|C1|S1|X${i}`, 'S1', `X${i}`, hqua, hqua.slice(0, 10))
    }
    // Rải đều BẬT (mặc định): hạn còn 4 ngày ⇒ quota ceil(20 / 2) = 10 câu mới/ngày ⇒ trần Bi-a ≥ 4 (Câu chốt + 3 bi).
    await giao(env, 4)
    const token = await gameToken(env, 'S1')
    await gameV2(env, 'choose', { token, pet: 'dat_quy' })
    const ban = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, Date.now())
    return { env, token, ban, qs: (ban.bi as { qid: string }[]).map((x) => x.qid), chot: (ban.chot as { qid: string } | null)?.qid ?? null }
  }
  type Muc = { qid: string; chienDichId: string; trangThai: string; lichSu: { ngay: string; dung: boolean; nguon?: string }[] }

  it('câu chiến dịch trả lời trong Bi-a: hiện đúng trạng thái, lịch sử nguồn "Bi-a"; câu chưa trả lời không hiện, không lộ đáp án', async () => {
    const { env, token, ban, qs } = await dung()
    expect(qs.length).toBeGreaterThanOrEqual(3)
    await gameV2(env, 'answer', { token, session: ban.session, qid: qs[0], answer: 'B' })
    await gameV2(env, 'answer', { token, session: ban.session, qid: qs[1], answer: 'A' })
    const r = await gameV2(env, 'hoa2-cau-da-lam', { token })
    const cau = r.cau as Muc[]
    expect(cau.map((c) => c.qid).sort()).toEqual([qs[0], qs[1]].sort())
    expect(cau.find((c) => c.qid === qs[0])).toMatchObject({ trangThai: 'dang_on', lichSu: [{ dung: true, nguon: 'bia' }] })
    expect(cau.find((c) => c.qid === qs[1])).toMatchObject({ trangThai: 'dang_on', lichSu: [{ dung: false, nguon: 'bia' }] })
    const ct = await gameV2(env, 'hoa2-cau-chi-tiet', { token, qids: [qs[0], qs[1], qs[2]] })
    expect((ct.cau as { de: { qid: string } }[]).map((x) => x.de.qid)).toEqual([qs[0], qs[1]])
  })

  it('câu ôn NGOÀI chiến dịch (câu sai trong ca đã công bố) vẫn lên Bi-a theo tỉ lệ ôn và hiện ở nhóm "Câu sai trong ca kiểm tra"', async () => {
    const { env, token, ban, qs, chot } = await dung({ caSai: true })
    const tren = [...qs, ...(chot ? [chot] : [])]
    const ngoai = tren.filter((q) => q.startsWith('X'))
    expect(ngoai.length).toBeGreaterThan(0)
    for (const q of tren) await gameV2(env, 'answer', { token, session: ban.session, qid: q, answer: 'B' })
    const r = await gameV2(env, 'hoa2-cau-da-lam', { token })
    const cau = r.cau as Muc[]
    for (const q of ngoai) expect(cau.find((c) => c.qid === q)).toMatchObject({ lichSu: [{ dung: false, nguon: 'thi' }, { dung: true, nguon: 'bia' }] })
  })
})

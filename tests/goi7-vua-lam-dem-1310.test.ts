// @vitest-environment node
// LỖI 13/10 20:11 (em báo "e còn một câu mà nó báo hoàn thành", sảnh "Chặng học của em 23/24" + "Em đã hoàn thành phần được xếp hôm nay…"; thầy:
// "sửa luôn tối ưu tức thì máy chủ"). Nguyên nhân gốc: "đã làm hôm nay" của kế hoạch Gói 7 chỉ đọc sổ học `su_kien_hoc`, mà dòng sổ ghi SAU khi trả lời
// máy em (`ctx.waitUntil`); lượt trả lời `game_v2_attempt` ghi NGAY. Mở chặng / đếm ngay sau câu cuối ⇒ bộ đếm thiếu câu vừa làm, kế hoạch xếp lại câu
// ấy, `startGoi7` (luật không phát lại câu vừa trả lời) bỏ nó ⇒ chặng rỗng mà vẫn "còn 1 câu". Khoá: đã làm = sổ ∪ lượt trả lời ≤ 15 phút (quy câu gốc).
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { demHomNay7, dongBoGoi7, lapGoi7, startGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'

const NOW = Date.parse('2026-10-13T13:10:00Z') // 20:10 giờ VN
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe() })

async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 60 }, 2)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL;
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8',60,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8', 8, '["DH-B8"]', '2026-10-12T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1', 'S2'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return k
}
/** Lượt trả lời đã ghi trong lô chấm; dòng sổ học (ghi hoãn) CHƯA có. */
const ghiLuotNgay = (k: Awaited<ReturnType<typeof kho>>, qids: string[], luc: number, phien = 'phien-cuoi') => {
  const st = k.d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
  for (const q of qids) st.run(`${phien}|${q}`, 'S1', phien, q, `g-${q}`, '{}', new Date(luc).toISOString())
}

it('em vừa nộp hết câu của kế hoạch, sổ chưa kịp ghi: bộ đếm đủ NGAY, kế hoạch không xếp lại câu vừa làm, sảnh không còn "còn câu"', async () => {
  const k = await kho()
  const lap0 = (await lapGoi7(k.env, 'S1', NOW))!
  const ke = lap0.plan.viec.map((v) => v.qid)
  expect(ke.length).toBe(lap0.toiThieu) // M câu hôm nay
  ghiLuotNgay(k, ke, NOW - 5_000)
  const lap = (await lapGoi7(k.env, 'S1', NOW))!
  expect(lap.daLamNgay).toBe(lap0.toiThieu) // trước: 0 (sổ chưa có) ⇒ "0/M" và kế hoạch xếp lại cả M câu
  expect(lap.plan.viec.filter((v) => ke.includes(v.qid))).toEqual([])
  const dem = await demHomNay7(k.env, 'S1', NOW)
  expect(dem.daLamHomNay).toBe(lap0.toiThieu) // ô "đã làm/M câu hôm nay" cũng đủ ngay
  const r = (await startGoi7(k.env, 'S1', NOW)) as { questions: { qid: string }[]; goi7: { daLamHomNay: number; toiThieu: number } }
  // 29/10: đủ mức ⇒ chỉ «học thêm» câu MỚI (không phát lại câu em vừa làm, kể cả khi sổ chưa kịp ghi)
  for (const q of r.questions) expect(ke).not.toContain(q.qid)
  expect(r.goi7.daLamHomNay).toBe(r.goi7.toiThieu) // "M/M" — hết mâu thuẫn "còn 1 câu mà báo hoàn thành"
})

it('còn câu chưa làm thì vẫn phát đúng câu chưa làm; câu vừa nộp (kể cả bản song sinh ~ss2, biến thể ~bt1#2) không quay lại', async () => {
  const k = await kho()
  const ke = (await lapGoi7(k.env, 'S1', NOW))!.plan.viec.map((v) => v.qid)
  ghiLuotNgay(k, [...ke.slice(0, 22).map((q, i) => (i === 0 ? `${q}~ss2` : i === 1 ? `${q}~bt1#2` : q))], NOW - 30_000)
  const lap = (await lapGoi7(k.env, 'S1', NOW))!
  expect(lap.daLamNgay).toBe(22)
  const r = (await startGoi7(k.env, 'S1', NOW)) as { questions: { qid: string }[] }
  expect(r.questions.length).toBeGreaterThan(0)
  expect(r.questions.map((q) => q.qid).filter((q) => ke.slice(0, 22).includes(q))).toEqual([])
})

it('lượt trả lời cũ hơn 15 phút hoặc của hôm qua không cộng vào hôm nay (sổ là nguồn chính như cũ)', async () => {
  const k = await kho()
  const ke = (await lapGoi7(k.env, 'S1', NOW))!.plan.viec.map((v) => v.qid)
  ghiLuotNgay(k, ke.slice(0, 3), NOW - 16 * 60_000, 'p1')
  ghiLuotNgay(k, ke.slice(3, 5), Date.parse('2026-10-12T16:59:00Z'), 'p2') // 23:59 hôm qua giờ VN
  expect((await lapGoi7(k.env, 'S1', NOW))!.daLamNgay).toBe(0)
  expect((await demHomNay7(k.env, 'S1', NOW)).daLamHomNay).toBe(0)
})

// LỖI 13/10 22h (thầy, 2 ảnh cùng một em: Hôm nay "Đủ mức hôm nay · Đã làm 24/24 · Đã làm hết câu được giao", lịch ngày "Hôm nay 13/10 · 19/24 · thiếu 5":
// "app báo đủ mức rồi mà hôm nay lại báo thiếu, sửa triệt để đi nhé"). Nguyên nhân gốc: phần "vừa làm" (bản vá 20:11) cộng MÃ GỐC của câu bản ảo
// (song sinh ~ssN, biến thể ~btN, lần #n) vào tập đã làm, trong khi sổ ghi ĐÚNG mã đã phát (mã ảo) ⇒ 15 phút sau mỗi câu ảo, một câu đếm HAI lần
// (mã sổ + mã gốc); kế hoạch tưởng đủ mức, ngừng phát câu. Lịch ngày (thầy / hồ sơ em / phụ huynh) đếm theo sổ ⇒ 19. Nay tập đã làm thêm ĐÚNG mã sổ.
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { ngayBaiCuaMotEm } from '../server/src/bai-hang-ngay'

it('câu bản ảo vừa làm (sổ đã ghi) không bị đếm hai lần — sảnh, ô đếm sau mỗi câu và lịch ngày cùng MỘT số', async () => {
  const k = await kho()
  const ke = (await lapGoi7(k.env, 'S1', NOW))!.plan.viec.map((v) => v.qid)
  const lam = ke.slice(0, 19).map((q, i) => (i < 3 ? `${q}~ss${i + 1}` : i < 5 ? `${q}~bt1#${i}` : q)) // 5 câu bản ảo
  const luc = NOW - 60_000
  ghiLuotNgay(k, lam, luc)
  await ghiSuKien(k.env, lam.map((q) => ({ nguon: 'game', maNguon: 'phien-cuoi', sbd: 'S1', qid: q, lan: 1, ketQua: 1, luc: new Date(luc).toISOString(), maDang: '', chuyenDe: '', mucDo: '', attemptId: `phien-cuoi|${q}`, assistance: 'none', purpose: 'maintenance', receivedAt: luc })) as never)
  const lap = (await lapGoi7(k.env, 'S1', NOW))!
  expect(lap.daLamNgay).toBe(19) // trước: 24 ⇒ "Đủ mức 24/24" mà thật mới 19
  expect((await demHomNay7(k.env, 'S1', NOW)).daLamHomNay).toBe(19)
  const ngay = await ngayBaiCuaMotEm(k.env, 'S1', '2026-10-13', '2026-10-13', '2026-10-13')
  expect(ngay?.map((n) => n.daLam)).toEqual([19])
  expect(lap.plan.viec.length).toBeGreaterThan(0) // còn thiếu ⇒ vẫn phát câu
  expect(lap.plan.viec.filter((v) => ke.slice(0, 19).includes(v.qid))).toEqual([]) // câu vừa làm (cả gốc của bản ảo) không quay lại
})

// 29/10 (thầy: «Phần học tiếp ở dưới chưa làm câu nào thanh đã báo rồi»): lượt LƯỚT là câu em đã được phát + đã trả lời ⇒ TÍNH vào chặng (chỉ không tính đúng / sai); chẩn đoán vẫn không.
it('lượt lướt tính vào chặng, chẩn đoán đã vào sổ thì không — phần "vừa làm" không cộng lại hai lần; sảnh và lịch ngày vẫn cùng số', async () => {
  const k = await kho()
  const ke = (await lapGoi7(k.env, 'S1', NOW))!.plan.viec.map((v) => v.qid)
  const luc = NOW - 60_000
  const lam = ke.slice(0, 6)
  ghiLuotNgay(k, lam, luc)
  const dong = (q: string, i: number) => ({ nguon: 'game', maNguon: 'phien-cuoi', sbd: 'S1', qid: q, lan: 1, ketQua: i === 0 ? null : 1, luc: new Date(luc).toISOString(), maDang: '', chuyenDe: '', mucDo: '', attemptId: `phien-cuoi|${q}`, assistance: 'none', purpose: i === 0 ? 'luot' : i === 1 ? 'chan_doan' : 'maintenance', receivedAt: luc })
  await ghiSuKien(k.env, lam.map(dong) as never)
  const lap = (await lapGoi7(k.env, 'S1', NOW))!
  expect(lap.daLamNgay).toBe(5) // 6 lượt − 1 chẩn đoán (lướt có tính)
  expect((await demHomNay7(k.env, 'S1', NOW)).daLamHomNay).toBe(5)
  expect((await ngayBaiCuaMotEm(k.env, 'S1', '2026-10-13', '2026-10-13', '2026-10-13'))?.map((n) => n.daLam)).toEqual([5])
})

// LỖI 28/10 (ảnh thầy: «Đủ 14/12 câu hôm nay · 2/2 chặng» mà nút Sửa lỗi còn 2 câu — «phần sửa chưa làm xong nhưng lại tự xong chặng cuối mặc dù chưa làm»).
// Nguyên nhân gốc: lượt Tự sửa lỗi (`nguon = 'chua_loi'`) cộng vào «đã làm hôm nay» ⇒ kế hoạch bớt câu học, Lộ trình vẽ chặng cuối «xong». Mức / chặng chỉ đếm câu học.
it('câu Tự sửa lỗi không cộng vào đã làm hôm nay — sảnh, ô đếm, lịch ngày cùng số; kế hoạch vẫn phát đủ câu học', async () => {
  const k = await kho()
  const lap0 = (await lapGoi7(k.env, 'S1', NOW))!
  const ke = lap0.plan.viec.map((v) => v.qid)
  const luc = NOW - 60_000
  const hoc = ke.slice(0, 6)
  ghiLuotNgay(k, hoc, luc)
  const sua = k.qids('DH-B8').filter((q) => !ke.includes(q)).slice(0, 8)
  const dong = (nguon: string, q: string) => ({ nguon, maNguon: nguon === 'chua_loi' ? `dot-${q}` : 'phien-cuoi', sbd: 'S1', qid: q, lan: 1, ketQua: 1, luc: new Date(luc).toISOString(), maDang: '', chuyenDe: '', mucDo: '', attemptId: `${nguon}|${q}`, assistance: 'none', purpose: nguon === 'chua_loi' ? 'repair' : 'maintenance', receivedAt: luc })
  await ghiSuKien(k.env, [...hoc.map((q) => dong('game', q)), ...sua.map((q) => dong('chua_loi', q))] as never)
  const lap = (await lapGoi7(k.env, 'S1', NOW))!
  expect(lap.daLamNgay).toBe(6) // trước: 14 ⇒ «Đủ 14/12», chặng cuối tự xong
  expect((await demHomNay7(k.env, 'S1', NOW)).daLamHomNay).toBe(6)
  expect((await ngayBaiCuaMotEm(k.env, 'S1', '2026-10-13', '2026-10-13', '2026-10-13'))?.map((n) => n.daLam)).toEqual([6])
  expect(lap.daLamNgay + lap.plan.viec.length).toBeGreaterThanOrEqual(lap0.toiThieu) // phần học còn lại vẫn được xếp đủ mức
})

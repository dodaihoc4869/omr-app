// @vitest-environment node
// GÓI BÀI CẢ NGÀY — MÁY CHỦ (server/src/goi-ngay.ts; thầy 29/10 22:05 «cách khác hoàn toàn để app hs load tức thì ở mọi thời điểm, kể cả giờ cao điểm»).
// Khoá:
//   · gói = đúng các câu lượt mở chặng thường sẽ phát (chặng đầu y hệt `startGoi7`), chia chặng 6 câu, KHÔNG có đáp án; bộ ref niêm phong (`ve`) mờ;
//   · mở phiên từ `ve`: ghi phiên y như lượt mở chặng thường (`goiNgay: 1`), tem MỚI hạn thường từng câu; câu em đã làm (sổ học) bị bỏ;
//   · `ve` của em khác / bị sửa ⇒ GOI_CU; công tắc tắt ⇒ `tat` / GOI_TAT.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, startGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { datCheDoGoiNgay, goiNgay7, moGoi7 } from '../server/src/goi-ngay'
import { HAN_NIEM_MS, moNiem, xoaKhoaNiem } from '../server/src/niem-phong'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-29T13:10:00Z') // 20:10 giờ VN — giờ cao điểm
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW); xoaKhoaNiem(); datCheDoGoiNgay('bat') })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); datCheDoGoiNgay() })

async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 60 }, 2)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL;
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8',60,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8', 8, '["DH-B8"]', '2026-10-28T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1', 'S2'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  const env = { ...k.env, MA_BI_MAT: 'bi-mat-thu-nghiem' } as unknown as Env
  return { ...k, env }
}
type Goi = { ok: boolean; tat?: boolean; ngay?: string; chang: { ve: string; questions: { qid: string; sk?: string }[] }[] }
const temCua = (c: Goi['chang'][number]) => Object.fromEntries(c.questions.map((q) => [q.qid, q.sk]))

it('gói = các câu lượt mở chặng thường sẽ phát, chia chặng 6 câu, không đáp án; mở phiên y như đường cũ, tem mới hạn thường', async () => {
  const k = await kho()
  const goi = await goiNgay7(k.env, 'S1', NOW) as unknown as Goi
  expect(goi.ok).toBe(true)
  expect(goi.ngay).toBe('2026-10-29')
  expect(goi.chang.length).toBeGreaterThanOrEqual(2)
  for (const c of goi.chang) { expect(c.questions.length).toBeLessThanOrEqual(6); expect(typeof c.ve).toBe('string') }
  const tatCa = goi.chang.flatMap((c) => c.questions.map((q) => q.qid))
  expect(new Set(tatCa).size).toBe(tatCa.length)
  expect(tatCa.length).toBeLessThanOrEqual(24)
  const chu = JSON.stringify(goi)
  expect(chu).not.toContain('"correct"'); expect(chu).not.toContain('"solution"')
  // Chặng đầu y hệt lượt mở chặng thường
  const st = await startGoi7(k.env, 'S1', NOW, undefined, { khongLuu: true }) as { chuanBi: { questions: { qid: string }[] } }
  expect(goi.chang[0]!.questions.map((q) => q.qid)).toEqual(st.chuanBi.questions.map((q) => q.qid))
  // Mở phiên
  const c0 = goi.chang[0]!
  const mo = await moGoi7(k.env, 'S1', { ve: c0.ve, sk: temCua(c0) }, NOW + 60_000) as { ok: boolean; id: string; qids: string[]; sk: Record<string, string>; daLam: number }
  expect(mo.ok).toBe(true)
  expect(mo.qids).toEqual(c0.questions.map((q) => q.qid))
  expect(mo.daLam).toBe(0)
  const row = k.d.sql.prepare('SELECT sbd,json FROM game_v2_session WHERE id=?').get(mo.id) as { sbd: string; json: string }
  expect(row.sbd).toBe('S1')
  const s = JSON.parse(row.json) as { goi7: number; hocTap: number; goiNgay: number; questions: { qid: string; maDe: string; version: string }[] }
  expect(s).toMatchObject({ goi7: 1, hocTap: 1, goiNgay: 1 })
  expect(s.questions.map((r) => r.qid)).toEqual(mo.qids)
  for (const r of s.questions) { expect(r.maDe).toBe('DH-B8'); expect(r.version).toBeTruthy() }
  // Tem mới: mở được bằng đường chấm thường (hạn 45 phút); tem dài của gói thì không
  const q0 = mo.qids[0]!
  expect(await moNiem(k.env, 'S1', q0, mo.sk[q0], NOW + 60_000)).not.toBeNull()
  expect(await moNiem(k.env, 'S1', q0, mo.sk[q0], NOW + 60_000 + HAN_NIEM_MS + 1000)).toBeNull()
  expect(await moNiem(k.env, 'S1', q0, temCua(c0)[q0], NOW + 60_000)).toBeNull()
})

it('câu em đã làm (sổ học) bị bỏ khi mở phiên; làm hết ⇒ GOI_HET', async () => {
  const k = await kho()
  const goi = await goiNgay7(k.env, 'S1', NOW) as unknown as Goi
  const c0 = goi.chang[0]!, qs = c0.questions.map((q) => q.qid)
  const dong = (q: string, i: number) => ({ nguon: 'game', maNguon: 'phien-x', sbd: 'S1', qid: q, lan: 1, ketQua: 1, luc: new Date(NOW - 60_000).toISOString(), maDang: '', chuyenDe: '', mucDo: '',
    attemptId: `phien-x|${q}`, assistance: 'none', purpose: 'maintenance', receivedAt: NOW - 60_000 - i, cauVersion: 'v1' })
  await ghiSuKien(k.env, [dong(qs[0]!, 0)] as never)
  const mo = await moGoi7(k.env, 'S1', { ve: c0.ve, sk: temCua(c0) }, NOW) as { ok: boolean; qids: string[] }
  expect(mo.ok).toBe(true)
  expect(mo.qids).toEqual(qs.slice(1))
  await ghiSuKien(k.env, qs.slice(1).map((q, i) => dong(q, i + 1)) as never)
  expect(await moGoi7(k.env, 'S1', { ve: c0.ve, sk: {} }, NOW)).toEqual({ ok: false, ma: 'GOI_HET' })
})

it('`ve` của em khác / bị sửa / rác ⇒ GOI_CU; công tắc tắt ⇒ tat / GOI_TAT', async () => {
  const k = await kho()
  const goi = await goiNgay7(k.env, 'S1', NOW) as unknown as Goi
  const ve = goi.chang[0]!.ve
  expect(await moGoi7(k.env, 'S2', { ve }, NOW)).toEqual({ ok: false, ma: 'GOI_CU' })
  expect(await moGoi7(k.env, 'S1', { ve: ve.slice(0, 30) + (ve[30] === 'A' ? 'B' : 'A') + ve.slice(31) }, NOW)).toEqual({ ok: false, ma: 'GOI_CU' })
  expect(await moGoi7(k.env, 'S1', { ve: 12 }, NOW)).toEqual({ ok: false, ma: 'GOI_CU' })
  expect(await moGoi7(k.env, 'S1', { ve }, NOW + 86_400_000)).toEqual({ ok: false, ma: 'GOI_CU' }) // sang ngày khác
  datCheDoGoiNgay('tat')
  expect(await goiNgay7(k.env, 'S1', NOW)).toMatchObject({ ok: true, tat: true })
  expect(await moGoi7(k.env, 'S1', { ve }, NOW)).toEqual({ ok: false, ma: 'GOI_TAT' })
  datCheDoGoiNgay('thu')
  expect(await goiNgay7(k.env, 'S1', NOW)).toMatchObject({ tat: true }) // chỉ tài khoản thử của thầy
})

it('em có bản sẵn (cron) còn dùng được ⇒ gói lấy đúng chặng bản sẵn, không lập kế hoạch; mở phiên được', async () => {
  const k = await kho()
  const { chuanBiSanSang, docSanSang } = await import('../server/src/san-sang')
  expect(await chuanBiSanSang(k.env, 'S1', NOW - 60_000)).toBe(true)
  const ban = await docSanSang(k.env, 'S1')
  const qBan = (ban!.chang!.questions as { qid: string }[]).map((q) => q.qid)
  const goi = await goiNgay7(k.env, 'S1', NOW) as unknown as Goi & { tuBanSan?: boolean }
  expect(goi.tuBanSan).toBe(true)
  expect(goi.chang).toHaveLength(1)
  expect(goi.chang[0]!.questions.map((q) => q.qid)).toEqual(qBan)
  expect(JSON.stringify(goi)).not.toContain('"correct"')
  const mo = await moGoi7(k.env, 'S1', { ve: goi.chang[0]!.ve, sk: temCua(goi.chang[0]!) }, NOW) as { ok: boolean; qids: string[]; sk: Record<string, string> }
  expect(mo.ok).toBe(true)
  expect(mo.qids).toEqual(qBan)
  expect(Object.keys(mo.sk).length).toBe(qBan.length)
})

it('máy em ghép câu của hai chặng trong gói (`ves` + `qids`) ⇒ phiên đúng các câu ấy, tối đa 6; một `ve` hỏng ⇒ GOI_CU', async () => {
  const k = await kho()
  const goi = await goiNgay7(k.env, 'S1', NOW) as unknown as Goi
  const [c0, c1] = [goi.chang[0]!, goi.chang[1]!]
  const chon = [...c0.questions.slice(3).map((q) => q.qid), ...c1.questions.slice(0, 3).map((q) => q.qid)]
  const sk = { ...temCua(c0), ...temCua(c1) }
  const mo = await moGoi7(k.env, 'S1', { ves: [c0.ve, c1.ve], qids: chon, sk }, NOW) as { ok: boolean; id: string; qids: string[] }
  expect(mo.ok).toBe(true)
  expect(mo.qids).toEqual(chon)
  const tat = await moGoi7(k.env, 'S1', { ves: [c0.ve, c1.ve], sk }, NOW) as { qids: string[] }
  expect(tat.qids).toHaveLength(6) // không chọn ⇒ vẫn tối đa một chặng
  expect(await moGoi7(k.env, 'S1', { ves: [c0.ve, 'x'.repeat(80)], qids: chon }, NOW)).toEqual({ ok: false, ma: 'GOI_CU' })
})

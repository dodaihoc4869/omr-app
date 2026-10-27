// @vitest-environment node
// LỖI 27/10 tối (ảnh thầy): ba số mâu thuẫn trên Lộ trình — vòng Bi «8/16 chặng» (chưa đạt) · thẻ «Đủ 93/92 câu hôm nay!» · thẻ bài «0 câu tự làm · 0 câu
// học có hỗ trợ» mà «16/16 chặng». Chốt (Boss): mục tiêu ngày đo bằng CÂU, MỘT nguồn với thẻ «Đủ x/y câu» (`docDaLamNgay7`); +5 tinh thể trả khi đủ mức câu,
// không trả trùng. Test D1 thật: đủ mức câu qua nhiều chặng (có câu «Học cách giải») ⇒ /hs/thuong, sảnh và hoc-tap-dem ra CÙNG một số; vòng đạt.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich, xoaDemMetaCau } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { gameToken } from '../server/src/game-v2-auth'
import { hsThuong } from '../server/src/thuong-d1'
import { chuViecGoi7 } from '../src/components/hoc-tap/HocTapHomNay'
import { chuViecBai } from '../src/components/hoc-tap/chu-viec-bai'
import { vongMucTieu } from '../src/lib/thuong-api'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-12T13:30:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi(); xoaDemMetaCau() })

async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  await damBaoBangBaiDaDay(k.env)
  const b8 = k.qids('DH-B8')
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',24,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8"]', '2026-10-11T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: b8, maDe: ['DH-B8'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return { ...k, token: await gameToken(k.env, 'S1') }
}
async function goi(env: Env, token: string, lenh: string, than: Record<string, unknown>) {
  const viec: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => { viec.push(p) }, passThroughOnException() {} }
  const res = await worker.fetch(new Request(`https://test/game-v2/${lenh}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...than, token }) }), env, ctx as never)
  await Promise.allSettled(viec)
  return (await res.json()) as Record<string, unknown>
}
const dapAnDung = (phan: string) => (phan === 'I' ? 'B' : phan === 'II' ? 'DSDS' : '4')
const dapAnSai = (phan: string) => (phan === 'I' ? 'A' : phan === 'II' ? 'DSDD' : '7')
const LUOI = /vội|treo|đối phó|doi_pho|bam_voi|lười|ĐUỔI|muc_lam|mucLam/i



type MucTieu = { daXong: number; can: number; cau?: number; cauDaLam?: number; dat: boolean }

describe('mục tiêu ngày = mức câu (D1 thật, ba nơi một số)', () => {
  it('chưa đủ mức ⇒ vòng câu chưa đạt, chưa +5; đủ mức qua nhiều chặng (có Học cách giải) ⇒ vòng = thẻ «Đủ x/y câu», đạt, +5 MỘT lần', async () => {
    const k = await kho()
    let t = NOW
    const buoc = () => { t += 30_000; vi.setSystemTime(t) }
    const khoaMt = () => (k.d.sql.prepare("SELECT COUNT(*) AS n FROM vang_so WHERE sbd = 'S1' AND khoa_yeu_cau LIKE 'tt|%|muc_tieu'").get() as { n: number }).n
    let chang = 0
    let giua: MucTieu | null = null
    for (let c = 0; c < 12; c++) {
      buoc()
      const s = await goi(k.env, k.token, 'hoc-tap-start', {})
      const qs = (s.questions ?? []) as { qid: string; phan: string }[]
      if (!qs.length) break
      for (let i = 0; i < qs.length; i++) {
        buoc()
        const r = i === 1 && c % 2 === 1
          ? await goi(k.env, k.token, 'hoc-tap-gap', { session: s.id, qid: qs[i]!.qid, chuaTuLam: true })
          : await goi(k.env, k.token, 'answer', { session: s.id, qid: qs[i]!.qid, answer: dapAnDung(qs[i]!.phan), assisted: false, msLam: 40_000 })
        expect(r.ok, JSON.stringify(r).slice(0, 200)).toBe(true)
      }
      chang++
      if (c === 0) {
        giua = (await hsThuong(k.env, { token: k.token }, undefined, t)).mucTieu as MucTieu
        const dem = await goi(k.env, k.token, 'hoc-tap-dem', {})
        expect(giua.cauDaLam).toBe(dem.daLamHomNay)
        expect(giua.cau).toBe(dem.toiThieu)
        expect(giua.dat).toBe(false)
        expect(khoaMt()).toBe(0)
      }
    }
    expect(chang).toBeGreaterThan(2)
    buoc()
    const sanh = await goi(k.env, k.token, 'hoc-tap-sanh', {})
    const g7 = sanh.goi7 as { daLamHomNay: number; toiThieu: number; tuLamCon: number; tiepCanCon: number; thieuNgay: number }
    expect(g7.daLamHomNay).toBeGreaterThanOrEqual(g7.toiThieu) // thẻ «Đủ x/y câu hôm nay!»
    const tq = await hsThuong(k.env, { token: k.token }, undefined, t)
    const mt = tq.mucTieu as MucTieu
    // (1) vòng = (2) thẻ: cùng số câu, cùng mức, đạt — dù số chặng ghi trong thuong_bai_xong khác.
    expect({ cauDaLam: mt.cauDaLam, cau: mt.cau, dat: mt.dat }).toEqual({ cauDaLam: g7.daLamHomNay, cau: g7.toiThieu, dat: true })
    expect(vongMucTieu(mt as never)).toEqual({ da: g7.daLamHomNay, can: g7.toiThieu, donVi: 'câu', dat: true })
    // +5 tinh thể đúng một lần (gọi lại tổng quan không trả trùng).
    expect(khoaMt()).toBe(1)
    await hsThuong(k.env, { token: k.token }, undefined, t + 1000)
    expect(khoaMt()).toBe(1)
    // (3) thẻ bài: hết việc ⇒ nói số ĐÃ LÀM thật, không «0 câu tự làm · 0 câu học có hỗ trợ».
    expect(g7.tuLamCon + g7.tiepCanCon).toBe(0) // dòng gốc «0 câu tự làm · 0 câu học có hỗ trợ» = số CÒN LẠI
    expect(chuViecBai(chuViecGoi7(g7), { daLam: g7.daLamHomNay, muc: g7.toiThieu } as never)).toBe(`Đã làm ${g7.daLamHomNay} câu hôm nay`)
  })
})

describe('chữ thẻ bài (hàm thuần)', () => {
  it('thẻ bài «Trong»: chưa đủ mức ⇒ «Còn x câu tự làm · y câu học có hỗ trợ»; đủ mức ⇒ «Đã làm N câu hôm nay»; dòng Hành trình giữ nguyên', () => {
    const so = (daLam: number, muc: number) => ({ daLam, muc }) as never
    expect(chuViecBai('12 câu tự làm · 4 câu học có hỗ trợ', so(30, 46))).toBe('Còn 12 câu tự làm · 4 câu học có hỗ trợ')
    expect(chuViecBai('0 câu tự làm · 0 câu học có hỗ trợ', so(93, 92))).toBe('Đã làm 93 câu hôm nay')
    expect(chuViecBai('Nền · Chặng 2/4', so(93, 92))).toBe('Nền · Chặng 2/4')
    expect(chuViecBai('0 câu tự làm · 0 câu học có hỗ trợ', null)).toBe('0 câu tự làm · 0 câu học có hỗ trợ')
  })
  it('vòng: có mức câu ⇒ đo bằng câu; máy chủ cũ (chỉ chặng) ⇒ lùi về chặng', () => {
    expect(vongMucTieu({ daXong: 8, can: 16, cau: 92, cauDaLam: 93, dat: true })).toEqual({ da: 93, can: 92, donVi: 'câu', dat: true })
    expect(vongMucTieu({ daXong: 8, can: 16 })).toEqual({ da: 8, can: 16, donVi: 'chặng', dat: false })
    expect(vongMucTieu({ daXong: 1, can: 16, cau: 92, cauDaLam: 40 })).toEqual({ da: 40, can: 92, donVi: 'câu', dat: false })
  })
})

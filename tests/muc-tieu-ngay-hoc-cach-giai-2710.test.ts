// @vitest-environment node
// LỖI 27/10 — vòng «Mục tiêu ngày» đứng «1/16» dù em làm thêm nhiều chặng (thẻ «Bài 8. Amine» 4/16 → 8/16).
// NGUYÊN NHÂN GỐC: câu em bấm «Học cách giải» (lệnh `hoc-tap-gap`) không đi qua `answer` ⇒ không vào `$.nt` của phiên ⇒ chặng có một câu như vậy KHÔNG BAO GIỜ
// «xong bài» ⇒ không `ketBai`, không dòng `thuong_bai_xong` ⇒ `mucTieu.daXong` không tăng. Câu mới của Gói 7 luôn hỏi «Học cách giải / Tự làm» nên rất hay gặp.
// Test D1 thật (tests/_d1-that.ts qua taoKhoOmni): 3 chặng (thường · Học cách giải giữa chặng · Học cách giải ở CÂU CUỐI) ⇒ daXong = 3; luật thưởng giữ nguyên.
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
import { tinhThuongHocCachGiai } from '../server/src/thuong-tra-loi'
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


type MucTieu = { daXong: number; can: number; cau?: number }
type KetBai = { soCau: number; soDung: number; hoanHao: boolean; tong: number; mucTieu?: MucTieu }

describe('tinhThuongHocCachGiai (hàm thuần)', () => {
  const qs = ['a', 'b', 'c'].map((qid) => ({ qid }))
  it('câu học cách giải vào $.nt: có hỗ trợ, KHÔNG được tính, 0 nguyên tử; là câu cuối ⇒ ketBai (mất Hoàn hảo)', () => {
    const nt = [{ q: 'a', n: 10, d: 1, h: 0, t: 1, k: 0, c: 1, g: 30 }, { q: 'b', n: 10, d: 1, h: 0, t: 1, k: 0, c: 2, g: 30 }]
    const r = tinhThuongHocCachGiai({ questions: qs, hocTap: 1, nt }, 'c', {}, 0)!
    expect(r.thuong).toMatchObject({ tinh: false, nguyenTu: 0 })
    expect(r.nt.find((x) => x.q === 'c')).toMatchObject({ n: 0, d: 0, h: 1, t: 0 })
    expect(r.ketBai).toMatchObject({ soCau: 3, soDung: 2, hoanHao: false, tong: 20 })
  })
  it('chưa phải câu cuối ⇒ không ketBai; câu đã nộp ⇒ giữ bản cũ; phiên không phải bài học ⇒ null', () => {
    expect(tinhThuongHocCachGiai({ questions: qs, hocTap: 1, nt: [] }, 'a', {}, 0)!.ketBai).toBeUndefined()
    const cu = [{ q: 'a', n: 10, d: 1 as const, h: 0 as const, t: 1 as const, k: 0 as const, c: 1, g: 30 }]
    expect(tinhThuongHocCachGiai({ questions: qs, hocTap: 1, nt: cu }, 'a', {}, 0)!.nt).toEqual(cu)
    expect(tinhThuongHocCachGiai({ questions: qs, kimCuong: 1, nt: [] }, 'a', {}, 0)).toBeNull()
    expect(tinhThuongHocCachGiai({ questions: qs, nt: [] }, 'a', {}, 0)).toBeNull()
  })
})

describe('mục tiêu ngày đếm đủ chặng (D1 thật)', () => {
  it('xong 3 chặng trong ngày (một chặng có «Học cách giải» giữa chặng, một chặng ở câu cuối) ⇒ daXong = 3, /hs/thuong trả 3 kèm mức câu', async () => {
    const k = await kho()
    let t = NOW
    const buoc = () => { t += 30_000; vi.setSystemTime(t) }
    const kb: (KetBai | undefined)[] = []
    for (let c = 0; c < 3; c++) {
      buoc()
      const s = await goi(k.env, k.token, 'hoc-tap-start', {})
      const qs = (s.questions ?? []) as { qid: string; phan: string }[]
      expect(qs.length, JSON.stringify(s).slice(0, 200)).toBeGreaterThan(1)
      const hoc = c === 1 ? 1 : c === 2 ? qs.length - 1 : -1
      let cuoi: Record<string, unknown> = {}
      for (let i = 0; i < qs.length; i++) {
        buoc()
        cuoi = i === hoc
          ? await goi(k.env, k.token, 'hoc-tap-gap', { session: s.id, qid: qs[i]!.qid, chuaTuLam: true })
          : await goi(k.env, k.token, 'answer', { session: s.id, qid: qs[i]!.qid, answer: dapAnDung(qs[i]!.phan), assisted: false, msLam: 40_000 })
        expect(cuoi.ok, JSON.stringify(cuoi).slice(0, 300)).toBe(true)
        if (i < qs.length - 1) expect(cuoi.ketBai).toBeUndefined()
      }
      kb.push(cuoi.ketBai as KetBai | undefined)
      // Gọi lặp «Học cách giải» ở câu cuối (mất mạng) ⇒ không thêm chặng.
      if (c === 2) { buoc(); await goi(k.env, k.token, 'hoc-tap-gap', { session: s.id, qid: qs[hoc]!.qid, chuaTuLam: true }) }
    }
    expect(kb.map((x) => x?.mucTieu?.daXong)).toEqual([1, 2, 3])
    // Luật thưởng giữ nguyên: câu học cách giải 0 nguyên tử, mất Hoàn hảo; chặng thường vẫn Hoàn hảo.
    expect(kb[0]).toMatchObject({ hoanHao: true })
    expect(kb[1]).toMatchObject({ hoanHao: false, soDung: kb[1]!.soCau - 1 })
    expect(kb[2]).toMatchObject({ hoanHao: false, soDung: kb[2]!.soCau - 1 })
    expect((k.d.sql.prepare('SELECT COUNT(*) AS n FROM thuong_bai_xong WHERE em = ?').get('S1') as { n: number }).n).toBe(3)
    const tq = await hsThuong(k.env, { token: k.token }, undefined, t)
    const muc = (k.d.sql.prepare('SELECT muc FROM goi_bai_7_muc_ngay WHERE sbd = ?').get('S1') as { muc: number } | undefined)?.muc
    expect(tq.mucTieu).toMatchObject({ daXong: 3, can: kb[2]!.mucTieu!.can, ...(muc ? { cau: muc } : {}) })
  })
})

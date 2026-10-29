// @vitest-environment node
// TEM NIÊM PHONG ĐÁP ÁN (thầy 29/10 «giờ cao điểm cũng phải tức thì 100%») — server/src/niem-phong.ts, niem-cau.ts, cham-nhanh.ts `chamTuNiem`, nop-luong.ts.
// Khoá: (1) tem mờ, gắn đúng em + câu, hết hạn 45 phút, sửa một ký tự là hỏng; (2) chấm từ tem khớp chấm thường (đúng / sai, khongTinh, OMNI lướt, hình thức đáp án);
// (3) câu phát ra mang tem, mở chặng không lộ đáp án; (4) dòng 1 đi KHI D1 TREO HẲN — bằng chứng dòng 1 không phụ thuộc đợt D1 nào, ở isolate không có gì trong đệm;
// (5) tem sai / hết hạn / của câu khác ⇒ không dùng (đường thường chấm đúng như cũ).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_SAN_SANG } from '../server/src/san-sang'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich, xoaDemMetaCau } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { gameToken } from '../server/src/game-v2-auth'
import { chamTuNiem, nhoBaoVe, nhoBienNhan, nhoEm, xoaChamNhanh } from '../server/src/cham-nhanh'
import { HAN_NIEM_MS, moNiem, niemPhong, xoaKhoaNiem, type NoiDungNiem } from '../server/src/niem-phong'
import { niemPhongCau } from '../server/src/niem-cau'
import { boSungKichThuocDe, docDoGiayMot } from '../server/src/do-giay-luot'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { khongTinhTuDo } from '../server/src/thuong-tra-loi'
import type { PrivateQuestion } from '../src/game/than-thu-v2/core'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-12T13:30:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW); xoaChamNhanh(); xoaKhoaNiem() })
afterEach(() => { vi.useRealTimers(); xoaChamNhanh(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi(); xoaDemMetaCau() })

const envBiMat = (bi = 'bi-mat-thu-nghiem') => ({ MA_BI_MAT: bi }) as unknown as Env
const LOI_GIAI = 'Bảo toàn nguyên tố N: n(amin) = n(HCl) = 0,1 mol; M = 5,9 / 0,1 = 59 ⇒ C3H9N. '.repeat(20)
const cauMau = (o: Partial<PrivateQuestion> = {}): PrivateQuestion => ({
  qid: 'Q1', maDe: 'DH', version: 'v1', group: 'G1', phan: 'I', text: 'Amin X có công thức nào sau đây? '.repeat(6), choices: ['CH5N', 'C2H7N', 'C3H9N', 'C4H11N'], ideas: [], hinhAnh: [{ src: 'a.png', viTri: 'sau_loi_giai' }, { src: 'b.png', viTri: 'de' }],
  dang: 'amin', tenDang: 'Amin', mucDo: 'TH', sao: 2, kienThuc: ['k1'], correct: 'C', solution: LOI_GIAI, reviewed: true, ...o,
} as PrivateQuestion)
const noiDung = (o: Partial<NoiDungNiem> = {}): Omit<NoiDungNiem, 'v' | 'e'> => ({ q: 'Q1', r: 'v1', g: 'G1', p: 'I', c: 'C', l: LOI_GIAI, m: [], t: 60, h: 0, o: 1, ...o })
const doiKyTu = (s: string, i: number) => s.slice(0, i) + (s[i] === 'A' ? 'B' : 'A') + s.slice(i + 1)

describe('tem niêm phong (niem-phong.ts)', () => {
  it('mở lại được đúng nội dung; tem mờ — không chứa lời giải / đáp án ở dạng đọc được; ngắn nhờ nén', async () => {
    const env = envBiMat()
    const tem = await niemPhong(env, 'S1', noiDung())
    expect(typeof tem).toBe('string')
    const nd = await moNiem(env, 'S1', 'Q1', tem)
    expect(nd).toMatchObject({ q: 'Q1', g: 'G1', p: 'I', c: 'C', l: LOI_GIAI, t: 60, h: 0, o: 1 })
    const tho = Buffer.from(tem!.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('latin1')
    expect(tho).not.toContain('Bảo toàn'); expect(tho).not.toContain('C3H9N')
    expect(tem!.length).toBeLessThan(900) // lời giải ~1,6 KB chữ lặp ⇒ nén mạnh; lời giải thật ~0,5–1 KB chữ ⇒ tem ≲ 1,2 KB
  })
  it('chỉ đúng em + đúng câu mở được; hỏng một ký tự / hết hạn / đổi bí mật / thiếu bí mật / rác ⇒ null', async () => {
    const env = envBiMat()
    const tem = (await niemPhong(env, 'S1', noiDung()))!
    expect(await moNiem(env, 'S2', 'Q1', tem)).toBeNull()
    expect(await moNiem(env, 'S1', 'Q2', tem)).toBeNull()
    expect(await moNiem(env, 'S1', 'Q1', doiKyTu(tem, 20))).toBeNull()
    expect(await moNiem(env, 'S1', 'Q1', tem.slice(0, -4))).toBeNull()
    expect(await moNiem(env, 'S1', 'Q1', 'x'.repeat(200))).toBeNull()
    expect(await moNiem(env, 'S1', 'Q1', undefined)).toBeNull()
    expect(await moNiem(env, 'S1', 'Q1', tem, NOW + HAN_NIEM_MS - 1000)).not.toBeNull()
    expect(await moNiem(env, 'S1', 'Q1', tem, NOW + HAN_NIEM_MS + 1000)).toBeNull()
    expect(await moNiem(envBiMat('bi-mat-khac'), 'S1', 'Q1', tem)).toBeNull()
    expect(await niemPhong({} as Env, 'S1', noiDung())).toBeUndefined()
    expect(await moNiem({} as Env, 'S1', 'Q1', tem)).toBeNull()
  })
  it('mỗi lần niêm phong ra chuỗi khác (IV ngẫu nhiên) nhưng cùng nội dung', async () => {
    const env = envBiMat()
    const a = await niemPhong(env, 'S1', noiDung()), b = await niemPhong(env, 'S1', noiDung())
    expect(a).not.toBe(b)
    expect(await moNiem(env, 'S1', 'Q1', a)).toMatchObject({ c: 'C' }); expect(await moNiem(env, 'S1', 'Q1', b)).toMatchObject({ c: 'C' })
  })
  it('câu tự luận / ngoài kênh số / thiếu đáp án ⇒ không niêm phong', async () => {
    const env = envBiMat()
    expect(await niemPhongCau(env, 'S1', cauMau())).toBeTypeOf('string')
    expect(await niemPhongCau(env, 'S1', cauMau({ correct: '' }))).toBeUndefined()
    expect(await niemPhongCau(env, 'S1', cauMau({ phan: 'IV' as never }))).toBeUndefined()
    expect(await niemPhongCau(env, 'S1', cauMau({ phan: 'III', correct: '1/3' }))).toBeUndefined() // ngoài kênh số (ngoaiKenhSo)
  })
})

describe('chấm từ tem (chamTuNiem) khớp chấm thường', () => {
  const nd = (o: Partial<NoiDungNiem> = {}): NoiDungNiem => ({ v: 1, e: NOW + 60_000, ...noiDung(o) })
  const b = (answer: string, o: Record<string, unknown> = {}) => ({ session: 'P1', qid: 'Q1', answer, msLam: 30_000, ...o })
  it('Phần I / II / III đúng – sai, lời giải + ảnh lời giải đi cùng', () => {
    const d = chamTuNiem('S1', nd({ m: [{ src: 'a.png' }] }), b('C'), NOW)!
    expect(d).toMatchObject({ ok: true, tam: true, correct: true, answer: 'C', traLoi: 'C', solution: LOI_GIAI, solutionImages: [{ src: 'a.png' }] })
    expect(chamTuNiem('S1', nd(), b('A'), NOW)).toMatchObject({ correct: false, traLoi: 'A' })
    expect(chamTuNiem('S1', nd({ p: 'II', c: 'DSDS' }), b('DSDS'), NOW)).toMatchObject({ correct: true })
    expect(chamTuNiem('S1', nd({ p: 'II', c: 'DSDS' }), b('DSDD'), NOW)).toMatchObject({ correct: false })
    expect(chamTuNiem('S1', nd({ p: 'III', c: '24' }), b(' 24 '), NOW)).toMatchObject({ correct: true })
    expect(chamTuNiem('S1', nd({ p: 'III', c: '24' }), b('25'), NOW)).toMatchObject({ correct: false })
  })
  it('hình thức đáp án sai / thiếu câu ⇒ null (đường thường báo lỗi như cũ)', () => {
    expect(chamTuNiem('S1', nd(), b('E'), NOW)).toBeNull()
    expect(chamTuNiem('S1', nd({ p: 'II', c: 'DSDS' }), b('DSD'), NOW)).toBeNull()
    expect(chamTuNiem('S1', nd({ p: 'III', c: '24' }), b(''), NOW)).toBeNull()
    expect(chamTuNiem('S1', nd(), { ...b('C'), session: '' }, NOW)).toBeNull()
    expect(chamTuNiem('S1', nd(), { ...b('C'), qid: 'Q2' }, NOW)).toBeNull() // tem của câu khác
  })
  it('OMNI: câu SAI làm dưới 8 giây / không đo của phiên Hoá 2.0 ⇒ null (cần số lướt); đúng thì vẫn nhanh; ≥ 8 giây vẫn nhanh', () => {
    expect(chamTuNiem('S1', nd(), b('A', { msLam: 3000 }), NOW)).toBeNull()
    expect(chamTuNiem('S1', nd(), b('A', { msLam: 7999 }), NOW)).toBeNull()
    expect(chamTuNiem('S1', nd(), b('A', { msLam: 8000 }), NOW)).toMatchObject({ correct: false })
    expect(chamTuNiem('S1', nd(), b('C', { msLam: 1000 }), NOW)).toMatchObject({ correct: true })
    expect(chamTuNiem('S1', nd({ o: 0 }), b('A', { msLam: 1000 }), NOW)).toMatchObject({ correct: false })
    expect(chamTuNiem('S1', nd(), b('A', { msLam: undefined }), NOW)).toMatchObject({ correct: false }) // máy không đo ⇒ không bao giờ lướt (cùng luật cham-nhanh.ts)
  })
  it('OMNI + tem mang kỳ vọng `y` và số lướt `u` ⇒ câu SAI làm nhanh QUYẾT LƯỚT NGAY (không null, không D1): lướt ⇒ chưa tính; hết suất lướt / đủ lâu ⇒ sai thường', () => {
    const om = (o: Partial<NoiDungNiem> = {}) => nd({ y: 30_000, u: 0, ...o }) // kỳ vọng 30 s ⇒ ngưỡng lướt = max(3 s, 10 % × 30 s) = 3 s
    expect(chamTuNiem('S1', om(), b('A', { msLam: 2000 }), NOW)).toMatchObject({ correct: false, khongTinh: true, omni: { luot: true } })
    expect(chamTuNiem('S1', om(), b('A', { msLam: 3000 }), NOW)).toMatchObject({ correct: false }) // = ngưỡng ⇒ không lướt (còn «làm vội» là luật khác, xét như cũ)
    expect(chamTuNiem('S1', om(), b('A', { msLam: 3000 }), NOW)!.omni).toBeUndefined()
    expect(chamTuNiem('S1', om({ u: 3 }), b('A', { msLam: 1000 }), NOW)!.omni).toBeUndefined() // đã đủ 3 lượt lướt hôm nay ⇒ sai thường
    expect(chamTuNiem('S1', om({ u: 2 }), b('A', { msLam: 1000 }), NOW)).toMatchObject({ omni: { luot: true } }) // lượt lướt thứ 3 vẫn được
    expect(chamTuNiem('S1', om({ u: 2 }), b('A', { msLam: 1000, lm: 1 }), NOW)!.omni).toBeUndefined() // máy em đã thấy thêm 1 lướt trong chặng ⇒ 2 + 1 = 3 ⇒ sai thường
    expect(chamTuNiem('S1', om({ y: 90_000 }), b('A', { msLam: 7000 }), NOW)).toMatchObject({ khongTinh: true, omni: { luot: true } }) // kỳ vọng 90 s ⇒ ngưỡng 8 s (kẹp)
    expect(chamTuNiem('S1', om(), b('C', { msLam: 1000 }), NOW)!.omni).toBeUndefined() // đúng thì không bao giờ lướt
    expect(chamTuNiem('S1', nd({ o: 1 }), b('A', { msLam: 1000 }), NOW)).toBeNull() // OMNI chưa biết kỳ vọng ⇒ đường thường như cũ
    expect(chamTuNiem('S1', om({ o: 0 }), b('A', { msLam: 1000 }), NOW)!.omni).toBeUndefined() // OMNI tắt cho em ⇒ không xét lướt
  })
  it('niêm phong cả chặng: OMNI áp ⇒ tem mang y + u; OMNI tắt ⇒ o = 0; chưa biết (lỗi) ⇒ o = 1 không y', async () => {
    const env = envBiMat(), q = cauMau()
    const mo = async (om: Parameters<typeof niemPhongCau>[6]) => (await moNiem(env, 'S1', 'Q1', (await niemPhongCau(env, 'S1', q, true, NOW, undefined, om))!))!
    expect(await mo({ bat: true, ky: new Map([['Q1', 30_456.7]]), luot: 2 })).toMatchObject({ o: 1, y: 30_457, u: 2 })
    expect(await mo({ bat: false })).toMatchObject({ o: 0 })
    expect((await mo({ bat: false })).y).toBeUndefined()
    const loi = await mo(null)
    expect(loi).toMatchObject({ o: 1 }); expect(loi.y).toBeUndefined()
    const thieu = await mo({ bat: true, ky: new Map(), luot: 0 })
    expect(thieu).toMatchObject({ o: 1 }); expect(thieu.y).toBeUndefined() // câu không có kỳ vọng ⇒ như chưa biết
  })
  it('khongTinh (làm vội) khớp đúng hàm của đường thường với mọi thời lượng', async () => {
    const env = envBiMat()
    const q = cauMau()
    const tem = (await niemPhongCau(env, 'S1', q))!
    const ndTem = (await moNiem(env, 'S1', 'Q1', tem))!
    for (const ms of [800, 1500, 4000, 9000, 30_000, 120_000]) {
      const body = b('C', { msLam: ms })
      const mong = khongTinhTuDo(boSungKichThuocDe(docDoGiayMot(body, { ms }), q.phan, q), true)
      const d = chamTuNiem('S1', ndTem, body, NOW)!
      expect(!!d.khongTinh, `ms=${ms}`).toBe(mong)
    }
  })
  it('biên nhận đã vào đường thường ở isolate này / câu thuộc ca thi (tập bảo vệ còn mới) / thầy chặn câu hoặc tạm dừng em ⇒ null', () => {
    expect(chamTuNiem('S1', nd(), b('C'), NOW)).not.toBeNull()
    nhoBienNhan('P1|Q1'); expect(chamTuNiem('S1', nd(), b('C'), NOW)).toBeNull()
    xoaChamNhanh()
    nhoBaoVe(new Set(['G1']), NOW); expect(chamTuNiem('S1', nd(), b('C'), NOW + 1000)).toBeNull()
    expect(chamTuNiem('S1', nd(), b('C'), NOW + 6 * 60_000)).not.toBeNull() // tập bảo vệ cũ quá 5 phút ⇒ không dùng (như đệm)
    xoaChamNhanh()
    nhoEm('S1', { enabled: true, blocked: ['Q1'], types: [] }, true, NOW); expect(chamTuNiem('S1', nd(), b('C'), NOW + 1000)).toBeNull()
    nhoEm('S1', { enabled: false, blocked: [], types: [] }, true, NOW); expect(chamTuNiem('S1', nd(), b('C'), NOW + 1000)).toBeNull()
  })
})

// ───────────── Đường thật qua cửa Worker ─────────────
async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  for (const q of SQL_SAN_SANG) k.d.sql.exec(q)
  k.d.sql.exec('CREATE TABLE IF NOT EXISTS chien_dich_em (chien_dich_id TEXT NOT NULL, sbd TEXT NOT NULL, them_luc TEXT, bot_luc TEXT, PRIMARY KEY (chien_dich_id, sbd))')
  await damBaoBangBaiDaDay(k.env)
  const b8 = k.qids('DH-B8')
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',24,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8"]', '2026-10-11T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: b8, maDe: ['DH-B8'], sbd: ['S1', 'S2'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return { k, env: k.env as Env, token: await gameToken(k.env as Env, 'S1') }
}
type Kho = Awaited<ReturnType<typeof kho>>
type Cau = { qid: string; phan: string; sk?: string }

async function goi(x: Kho, lenh: string, than: Record<string, unknown>, env: Env = x.env) {
  const nen: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => { nen.push(p) }, passThroughOnException() {} }
  const res = await worker.fetch(new Request(`https://test/game-v2/${lenh}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...than, token: x.token }) }), env, ctx as never)
  const luong = /ndjson/.test(res.headers.get('content-type') ?? '')
  const chu = await res.text()
  for (let i = 0; i < nen.length; i++) await nen[i]!.catch(() => null)
  const dong = luong ? chu.trim().split('\n').map((d) => JSON.parse(d) as Record<string, unknown>) : [JSON.parse(chu) as Record<string, unknown>]
  return { luong, dong, cuoi: dong[dong.length - 1]! }
}
const traLoi = (phan: string, dung: boolean) => phan === 'I' ? (dung ? 'B' : 'A') : phan === 'II' ? (dung ? 'DSDS' : 'DSDD') : dung ? '4' : '5'
async function moChang(x: Kho) {
  const s = await goi(x, 'hoc-tap-start', {})
  expect(s.cuoi.ok, JSON.stringify(s.cuoi).slice(0, 200)).toBe(true)
  const ds = s.cuoi.questions as Cau[]
  expect(ds.length).toBeGreaterThanOrEqual(5)
  return { id: s.cuoi.id as string, ds }
}

/** D1 TREO HẲN: mọi lệnh đọc / ghi không bao giờ xong. Dòng 1 mà vẫn đi được ⇒ không phụ thuộc đợt D1 nào. */
function d1Treo() {
  const mai = new Promise<never>(() => {})
  const st: Record<string, unknown> = { bind: () => st, first: () => mai, all: () => mai, run: () => mai, raw: () => mai }
  const db: Record<string, unknown> = { prepare: () => st, batch: () => mai, exec: () => mai, withSession: () => db }
  return db
}
const hetGio = (ms: number) => new Promise<'het'>((ok) => setTimeout(() => ok('het'), ms))
/** Gửi lệnh nộp `luong: 1` tới Worker có D1 treo; trả dòng 1 nếu tới trong `ms`, ngược lại 'het'. */
async function dong1KhiD1Treo(x: Kho, than: Record<string, unknown>, ms = 1500): Promise<Record<string, unknown> | 'het'> {
  const env = { ...x.env, DB: d1Treo() } as unknown as Env
  const ctx = { waitUntil: () => {}, passThroughOnException() {} }
  const res = await Promise.race([worker.fetch(new Request('https://test/game-v2/answer', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...than, luong: 1, token: x.token }) }), env, ctx as never), hetGio(ms)])
  if (res === 'het') return 'het'
  if (!/ndjson/.test(res.headers.get('content-type') ?? '')) return 'het'
  const doc = res.body!.getReader()
  let dem = ''
  const gm = new TextDecoder()
  const doc1 = (async () => { for (;;) { const { value, done } = await doc.read(); if (value) dem += gm.decode(value, { stream: true }); const i = dem.indexOf('\n'); if (i >= 0) return JSON.parse(dem.slice(0, i)) as Record<string, unknown>; if (done) return 'het' as const } })()
  const r = await Promise.race([doc1, hetGio(ms)])
  void doc.cancel().catch(() => {})
  return r
}

describe('đường thật: mở chặng cấp tem, nộp kèm tem', () => {
  it('mọi câu phát ra có tem `sk`; câu công khai KHÔNG có đáp án / lời giải; mở lại chặng (hoc-tap-start lần hai, cùng đợt) vẫn có tem', async () => {
    const x = await kho()
    const { ds } = await moChang(x)
    for (const c of ds) {
      expect(typeof c.sk, c.qid).toBe('string')
      expect(c.sk!.length).toBeGreaterThan(40)
      expect(c).not.toHaveProperty('correct'); expect(c).not.toHaveProperty('solution')
    }
    const lai = await moChang(x)
    expect(lai.ds.every((c) => typeof c.sk === 'string')).toBe(true)
  })
  it('đệm isolate TRỐNG + tem ⇒ luồng: dòng 1 (đúng / sai) trước, khớp dòng 2 (bản lưu); ghi đúng một lần mỗi câu; câu sai làm ≥ 8 giây cũng nhanh', async () => {
    const x = await kho()
    const { id, ds } = await moChang(x)
    for (const [i, dung] of [[0, true], [1, false], [2, true], [3, false]] as const) {
      xoaChamNhanh() // isolate khác: đệm không có gì
      vi.setSystemTime(NOW + 60_000 * (i + 1))
      const r = await goi(x, 'answer', { session: id, qid: ds[i]!.qid, answer: traLoi(ds[i]!.phan, dung), assisted: false, msLam: 30_000, luong: 1, sk: ds[i]!.sk })
      expect(r.luong, `câu ${i}: ${JSON.stringify(r.cuoi).slice(0, 160)}`).toBe(true)
      const [d1, d2] = r.dong as [Record<string, unknown>, Record<string, unknown>]
      expect(d1.tam).toBe(true); expect(d1.correct).toBe(dung); expect(d2.ok).toBe(true); expect(d2.correct).toBe(dung)
      expect(d1.answer).toBe(d2.answer); expect(d1.traLoi).toBe(d2.traLoi)
      expect(JSON.stringify(d1.solution)).toBe(JSON.stringify(d2.solution))
      expect(JSON.stringify(d1.solutionImages)).toBe(JSON.stringify(d2.solutionImages))
      expect(x.k.d.dem('game_v2_attempt', `id='${id}|${ds[i]!.qid}'`)).toBe(1)
    }
  })
  it('D1 TREO HẲN + isolate trống + tem ⇒ dòng 1 vẫn đi NGAY (không phụ thuộc D1); không tem ⇒ không có dòng 1', async () => {
    const x = await kho()
    const { id, ds } = await moChang(x)
    xoaChamNhanh()
    const co = await dong1KhiD1Treo(x, { session: id, qid: ds[0]!.qid, answer: traLoi(ds[0]!.phan, true), assisted: false, msLam: 30_000, sk: ds[0]!.sk })
    expect(co, 'dòng 1 phải tới dù D1 treo').not.toBe('het')
    expect(co).toMatchObject({ ok: true, tam: true, correct: true })
    xoaChamNhanh()
    const sai = await dong1KhiD1Treo(x, { session: id, qid: ds[1]!.qid, answer: traLoi(ds[1]!.phan, false), assisted: false, msLam: 30_000, sk: ds[1]!.sk })
    expect(sai).toMatchObject({ tam: true, correct: false, answer: expect.any(String) })
    xoaChamNhanh()
    expect(await dong1KhiD1Treo(x, { session: id, qid: ds[2]!.qid, answer: traLoi(ds[2]!.phan, true), assisted: false, msLam: 30_000 }, 600)).toBe('het')
  })
  it('OMNI áp cho em: tem mang kỳ vọng + số lướt; câu SAI làm nhanh ⇒ dòng 1 «lướt» (chưa tính) đi NGAY khi D1 treo hẳn', async () => {
    const x = await kho()
    x.k.d.sql.exec(`UPDATE cau_hinh SET gia_tri='{"bat":true,"lop":[],"sbd":["S1"]}' WHERE khoa='game_hoa_2'; INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('omni','{"bat":true,"lop":[],"sbd":["S1"]}','x')`)
    xoaDemCauHinh(x.env)
    const { id, ds } = await moChang(x)
    const nd0 = (await moNiem(x.env, 'S1', ds[0]!.qid, ds[0]!.sk))!
    expect(nd0.o).toBe(1); expect(nd0.y).toBeGreaterThan(0); expect(nd0.u).toBe(0)
    xoaChamNhanh()
    const sai = await dong1KhiD1Treo(x, { session: id, qid: ds[0]!.qid, answer: traLoi(ds[0]!.phan, false), assisted: false, msLam: 1500, sk: ds[0]!.sk })
    expect(sai, 'câu sai nhanh phải có dòng 1 từ tem dù D1 treo').not.toBe('het')
    expect(sai).toMatchObject({ tam: true, correct: false, khongTinh: true, omni: { luot: true } })
    xoaChamNhanh()
    const du = await dong1KhiD1Treo(x, { session: id, qid: ds[1]!.qid, answer: traLoi(ds[1]!.phan, false), assisted: false, msLam: 1500, lm: 3, sk: ds[1]!.sk })
    expect(du).toMatchObject({ tam: true, correct: false }) // máy em đã thấy 3 lượt lướt ⇒ lần này sai thường, vẫn có dòng 1 ngay
    expect((du as Record<string, unknown>).omni).toBeUndefined()
  })
  it('tem hỏng / của câu khác / hết hạn 45 phút / đã nộp rồi ở isolate này ⇒ KHÔNG dùng (D1 treo ⇒ không có dòng 1)', async () => {
    const x = await kho()
    const { id, ds } = await moChang(x)
    const than = (i: number, o: Record<string, unknown> = {}) => ({ session: id, qid: ds[i]!.qid, answer: traLoi(ds[i]!.phan, true), assisted: false, msLam: 30_000, sk: ds[i]!.sk, ...o })
    xoaChamNhanh()
    expect(await dong1KhiD1Treo(x, than(0, { sk: doiKyTu(ds[0]!.sk!, 30) }), 600)).toBe('het')
    expect(await dong1KhiD1Treo(x, than(0, { sk: ds[1]!.sk }), 600)).toBe('het') // tem của câu khác
    expect(await dong1KhiD1Treo(x, than(0, { sk: 'rac-khong-phai-tem' }), 600)).toBe('het')
    vi.setSystemTime(NOW + HAN_NIEM_MS + 5000)
    expect(await dong1KhiD1Treo(x, than(0), 600)).toBe('het')
    vi.setSystemTime(NOW + 1000)
    expect(await dong1KhiD1Treo(x, than(0), 1500)).not.toBe('het') // chính tem ấy, còn hạn ⇒ dùng được
    // Biên nhận đã vào đường thường ở isolate này ⇒ lượt nộp lại không chấm bằng tem (dòng 2 là bản lưu).
    nhoBienNhan(`${id}|${ds[3]!.qid}`)
    expect(await dong1KhiD1Treo(x, than(3), 600)).toBe('het')
  })
  it('tem của câu khác trên máy chủ có D1: đường thường chấm ĐÚNG đáp án thật (không chấm theo tem lạ)', async () => {
    const x = await kho()
    const { id, ds } = await moChang(x)
    xoaChamNhanh()
    const r = await goi(x, 'answer', { session: id, qid: ds[0]!.qid, answer: traLoi(ds[0]!.phan, true), assisted: false, msLam: 30_000, luong: 1, sk: ds[1]!.sk })
    expect(r.cuoi.ok).toBe(true); expect(r.cuoi.correct).toBe(true)
    for (const d of r.dong) if (d.tam === true) expect(d.correct).toBe(true)
  })
})

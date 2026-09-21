// @vitest-environment node
// ĐIỀU 7 — "đạt nhiệm vụ ngày" phải có ít nhất một nửa số câu tối thiểu ĐÚNG (ceil(tối thiểu / 2)), áp từ ngày VN 22/09 (src/lib/dat-nhiem-vu-ngay.ts, Code 1). Máy chủ cấp `soCauDungHomNay` cho ba nơi tính đạt:
// EXP thời gian thực (capNhatExp), CHỐT NGÀY (chotNgayCu) và bảng thầy (hom-nay-thay), và đưa lý do thiếu vào `tienBo.thieuDat` của kế hoạch ngày. Ngày 21/09 giữ luật cũ. Chạy trên SQLite thật.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { capNhatExp } from '../server/src/exp-d1'
import { chotNgayCu } from '../server/src/ke-hoach-ngay-d1'
import { homNayThay } from '../server/src/hom-nay-thay'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

afterEach(() => vi.useRealTimers())
const T = (s: string): number => Date.parse(`${s}+07:00`)
const gio = (s: string) => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(T(s))) }

function dung(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES('S1','Em Một','x')").run()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: '2026-09-01T00:00:00.000Z', dsSbd: ['S1'] }))
  return d
}
const luuKh = (d: D1That, ngay: string, o: { toiThieu?: number; ketQua?: string | null } = {}) => d.sql.prepare(
  `INSERT OR REPLACE INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,ket_qua,la_ngay_nghi,so_su_kien,cap_nhat_luc) VALUES(?,?,?,1,1,?,?,'[]',?,0,0,'x')`,
).run(`S1|${ngay}`, 'S1', ngay, JSON.stringify({ mucTieuCau: 8, toiThieuCau: o.toiThieu ?? 4 }), JSON.stringify({ viec: [], tienBo: { soCauToiHan: 0, treNhip: false } }), o.ketQua ?? null)
/** `ketQuas` = kết quả từng câu (1 đúng / 0 sai) làm trong ngày `ngay`, mỗi câu một qid riêng. */
const lam = async (d: D1That, ngay: string, ketQuas: (0 | 1)[], tienTo = 'Q') => {
  const sk = ketQuas.map((kq, i) => ({ nguon: 'btvn' as const, maNguon: 'B', sbd: 'S1', qid: `${tienTo}-I-${i}`, lan: i + 1, ketQua: kq, luc: `${ngay}T05:0${i}:00.000Z` }))
  expect((await ghiSuKien(d.env, sk)).ok).toBe(true)
}
const ketQuaNgay = (d: D1That, ngay: string) => (d.sql.prepare('SELECT ket_qua FROM ke_hoach_ngay WHERE sbd = ? AND ngay = ?').get('S1', ngay) as { ket_qua: string | null }).ket_qua
const khoanDat = (d: D1That, ngay: string) => d.sql.prepare("SELECT exp FROM exp_so WHERE sbd='S1' AND khoa LIKE '%dat|' || ?").all(ngay) as { exp: number }[]

describe('CHỐT NGÀY (chotNgayCu): đạt cần ≥ ceil(tối thiểu/2) câu đúng từ 22/09', () => {
  const chot = async (ngay: string, kq: (0 | 1)[], toiThieu = 4) => {
    const d = dung(); luuKh(d, ngay, { toiThieu }); await lam(d, ngay, kq)
    await chotNgayCu(d.env, ['S1'], '2026-09-30', '2026-09-29T17:01:00.000Z')
    return ketQuaNgay(d, ngay)
  }
  it('22/09: 4 câu SAI hết (đủ số câu) ⇒ mot_phan, KHÔNG đạt', async () => { expect(await chot('2026-09-22', [0, 0, 0, 0])).toBe('mot_phan') })
  it('22/09: tối thiểu 4 ⇒ cần 2 đúng: 1 đúng ⇒ mot_phan; 2 đúng ⇒ dat', async () => {
    expect(await chot('2026-09-22', [1, 0, 0, 0])).toBe('mot_phan')
    expect(await chot('2026-09-22', [1, 1, 0, 0])).toBe('dat')
  })
  it('tối thiểu lẻ 5 ⇒ cần ceil(5/2) = 3 đúng: 2 đúng ⇒ mot_phan, 3 đúng ⇒ dat', async () => {
    expect(await chot('2026-09-25', [1, 1, 0, 0, 0], 5)).toBe('mot_phan')
    expect(await chot('2026-09-25', [1, 1, 1, 0, 0], 5)).toBe('dat')
  })
  it('21/09 GIỮ LUẬT CŨ: 4 câu sai hết vẫn dat (ngày trao đã chốt không đổi)', async () => { expect(await chot('2026-09-21', [0, 0, 0, 0])).toBe('dat') })
  it('không làm câu nào ⇒ khong (như cũ)', async () => { expect(await chot('2026-09-22', [])).toBe('khong') })
})

describe('EXP thời gian thực (capNhatExp): đạt ngày chỉ trao khi đủ câu đúng', () => {
  it('22/09: 4 câu sai ⇒ chưa có khoản đạt ngày; làm thêm 2 câu đúng ⇒ có khoản đạt ngày 80 (giá mới) và trả lý do thiếu lúc chưa đạt', async () => {
    const d = dung(); luuKh(d, '2026-09-22')
    const now = T('2026-09-22T12:00:00')
    await lam(d, '2026-09-22', [0, 0, 0, 0])
    const a = await capNhatExp(d.env, 'S1', now)
    expect(khoanDat(d, '2026-09-22')).toHaveLength(0)
    expect(a.datNgay).toMatchObject({ dat: false, thieu: ['cau_dung_toi_thieu'], daLam: 4 })
    await lam(d, '2026-09-22', [1, 1], 'R')
    await capNhatExp(d.env, 'S1', now)
    expect(khoanDat(d, '2026-09-22')).toEqual([{ exp: 80 }])
  })
  it('21/09: 4 câu sai vẫn được trao (luật cũ)', async () => {
    const d = dung(); luuKh(d, '2026-09-21')
    await lam(d, '2026-09-21', [0, 0, 0, 0])
    await capNhatExp(d.env, 'S1', T('2026-09-21T12:00:00'))
    expect(khoanDat(d, '2026-09-21')).toEqual([{ exp: 20 }])
  })
})

describe('kế hoạch ngày: `tienBo.thieuDat` (chỉ khi thiếu câu ĐÚNG, từ 22/09)', () => {
  const kh = (d: D1That) => goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' }) as Promise<{ tienBo: { toiThieuCau: number; thieuDat?: { soCauDung: number; chu: string } } }>
  it('22/09: chưa đúng câu nào ⇒ soCauDung = ceil(tối thiểu/2) kèm câu chữ có số thật; đúng đủ ⇒ trường biến mất', async () => {
    gio('2026-09-22T10:00:00')
    const d = dung()
    const a = await kh(d)
    expect(a.tienBo.toiThieuCau).toBe(6)
    expect(a.tienBo.thieuDat).toEqual({ soCauDung: 3, chu: 'Em cần làm đúng thêm 3 câu nữa (hôm nay em đúng 0/3 câu cần đúng).' })
    await lam(d, '2026-09-22', [1, 1, 0])
    expect((await kh(d)).tienBo.thieuDat).toEqual({ soCauDung: 1, chu: 'Em cần làm đúng thêm 1 câu nữa (hôm nay em đúng 2/3 câu cần đúng).' })
    await lam(d, '2026-09-22', [1], 'R')
    expect((await kh(d)).tienBo).not.toHaveProperty('thieuDat')
  })
  it('21/09 (chưa áp luật) ⇒ không có `thieuDat`', async () => {
    gio('2026-09-21T10:00:00')
    const d = dung()
    expect((await kh(d)).tienBo).not.toHaveProperty('thieuDat')
  })
})

describe('bảng thầy (hom-nay-thay) đếm "đạt" theo cùng luật', () => {
  const dat = async (d: D1That, ngay: string) => ((await homNayThay(d.env, { ngay }, T(`${ngay}T12:00:00`))).nhiemVu as { tong: number; dat: number })
  it('22/09: 4 câu sai ⇒ đạt 0/1; thêm 2 câu đúng ⇒ đạt 1/1. 21/09: 4 câu sai vẫn đạt 1/1 (luật cũ)', async () => {
    const d = dung(); d.sql.prepare("UPDATE hoc_sinh SET lop='12A' WHERE sbd='S1'").run()
    luuKh(d, '2026-09-22'); luuKh(d, '2026-09-21')
    await lam(d, '2026-09-22', [0, 0, 0, 0]); await lam(d, '2026-09-21', [0, 0, 0, 0], 'V')
    expect(await dat(d, '2026-09-22')).toMatchObject({ tong: 1, dat: 0 })
    expect(await dat(d, '2026-09-21')).toMatchObject({ tong: 1, dat: 1 })
    await lam(d, '2026-09-22', [1, 1], 'R')
    expect(await dat(d, '2026-09-22')).toMatchObject({ tong: 1, dat: 1 })
  })
})

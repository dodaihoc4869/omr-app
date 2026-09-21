// BTVN "NÂNG ĐỠ" — LỊCH CHẶNG THEO GIỜ + SỨC CHỨA (`src/lib/btvn-nang-do-lich.ts`, Code 1, 21/09/2026). Đặc tả: `prompt-btvn-nang-do.md` CẬP NHẬT 2.
// Test TÍNH CHẤT trên hàng trăm tình huống ngẫu nhiên (hạt giống cố định): mọi mốc mở < hạn · chặng cuối đủ thời gian · giãn cách ≥ 40 phút khi còn dư giờ ·
// hạn dài ⇒ đúng một chặng/ngày mở 00:00 (y hệt `moLucChang` cũ) · không chặng nào mở 00:00–05:59 (trừ chặng mở ngay lúc chốt) · tất định.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  LICH_CHANG,
  canhBaoHanNgan,
  chiaSoCauChang,
  cheDoLich,
  hanNopMacDinh,
  mocMoMuonNhat,
  soNgayToiHan,
  sucChua,
  xepLichChang,
  type DauVaoLich,
} from '../src/lib/btvn-nang-do-lich'
import { moLucChang } from '../server/src/btvn-nang-do-chang'

// ───────────────────────── tiện ích ─────────────────────────
function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const MS_PHUT = 60_000
const MS_NGAY = 86_400_000
const LECH = 7 * 3_600_000
const ms = (s: string) => Date.parse(s)
/** Giờ VN dạng "MM-DD HH:MM" cho dễ đọc. */
const vn = (s: string) => new Date(ms(s) + LECH).toISOString().slice(5, 16).replace('T', ' ')
const gioVn = (s: string) => new Date(ms(s) + LECH).toISOString().slice(11, 16)
const phutVn = (s: string) => (((ms(s) + LECH) % MS_NGAY) + MS_NGAY) % MS_NGAY / MS_PHUT
const ngayVn = (s: string) => Math.floor((ms(s) + LECH) / MS_NGAY)
/** 22/09/2026 hh:mm giờ VN → ISO UTC. */
const luc = (ngay: string, gio: string) => new Date(Date.parse(`${ngay}T${gio}:00+07:00`)).toISOString()

const HAN = hanNopMacDinh('2026-09-22')
const co = (o: Partial<DauVaoLich> & Pick<DauVaoLich, 'chotLuc' | 'hanNop'>): DauVaoLich => ({ cauMoiNgay: 12, giayMoiCau: 90, ...o })

// ───────────────────────── các ví dụ trong đặc tả ─────────────────────────
describe('ví dụ của đặc tả', () => {
  it('hạn tối nay, chốt 20:00: ba chặng 20:00 · 21:20 · 22:40, đúng nhịp trước 23:59', () => {
    const l = xepLichChang(co({ chotLuc: luc('2026-09-22', '20:00'), hanNop: HAN, soCauTungChang: [10, 10, 10] }))
    expect(l.map((x) => gioVn(x.moLuc))).toEqual(['20:00', '21:20', '22:40'])
    expect(l.map((x) => gioVn(x.dungNhipTruoc))).toEqual(['23:59', '23:59', '23:59'])
    expect(l.map((x) => x.soCau)).toEqual([10, 10, 10])
    expect(l.map((x) => x.chiSo)).toEqual([0, 1, 2])
  })
  it('giao ban ngày mà hạn ngay tối đó: chặng 1 mở NGAY, các chặng sau rơi vào cửa sổ tối', () => {
    const l = xepLichChang(co({ chotLuc: luc('2026-09-22', '14:00'), hanNop: HAN, soCauTungChang: [10, 10, 10] }))
    expect(l.map((x) => gioVn(x.moLuc))).toEqual(['14:00', '20:00', '21:20'])
  })
  it('hạn mai, chốt hôm nay 14:00, 6 chặng: hai buổi tối, mỗi buổi 20:00 · 21:20 · 22:40 (chặng 0 mở ngay 14:00... ) — dàn đều theo giờ học', () => {
    const l = xepLichChang(co({ chotLuc: luc('2026-09-21', '20:00'), hanNop: HAN, soCauTungChang: [14, 14, 13, 13, 13, 13] }))
    expect(l.map((x) => vn(x.moLuc))).toEqual(['09-21 20:00', '09-21 21:20', '09-21 22:40', '09-22 20:00', '09-22 21:20', '09-22 22:40'])
  })
  it('em vào muộn (22:30) vẫn làm kịp: chặng cuối còn ≥ 1,5 × thời gian làm trước hạn; giãn cách bị bỏ bớt (deadline thắng)', () => {
    const l = xepLichChang(co({ chotLuc: luc('2026-09-22', '22:30'), hanNop: HAN, soCauTungChang: [10, 10, 10] }))
    expect(l.map((x) => gioVn(x.moLuc))).toEqual(['22:30', '23:10', '23:36'])
    expect(ms(HAN) - ms(l[2].moLuc)).toBeGreaterThanOrEqual(1.5 * 10 * 90 * 1000)
  })
  it('hạn dài (7 ngày, 8 câu/ngày): chặng 0 lúc chốt, chặng k mở 00:00 giờ VN ngày thứ k, đúng nhịp 23:59', () => {
    const l = xepLichChang(co({ chotLuc: luc('2026-09-22', '09:30'), hanNop: hanNopMacDinh('2026-09-28'), soCauTungChang: Array(7).fill(8) }))
    expect(l.map((x) => vn(x.moLuc))).toEqual(['09-22 09:30', '09-23 00:00', '09-24 00:00', '09-25 00:00', '09-26 00:00', '09-27 00:00', '09-28 00:00'])
    expect(l.map((x) => gioVn(x.dungNhipTruoc))).toEqual(Array(7).fill('23:59'))
    expect(l.map((x) => vn(x.dungNhipTruoc).slice(0, 5))).toEqual(['09-22', '09-23', '09-24', '09-25', '09-26', '09-27', '09-28'])
  })
  it('chỉ đưa `tongCau`: hạn ngắn chia ≤ 10 câu/chặng; hạn dài chia mỗi ngày một chặng', () => {
    const ngan = xepLichChang(co({ chotLuc: luc('2026-09-22', '14:00'), hanNop: HAN, tongCau: 25 }))
    expect(ngan.map((x) => x.soCau)).toEqual([9, 8, 8])
    const dai = xepLichChang(co({ chotLuc: luc('2026-09-22', '09:30'), hanNop: hanNopMacDinh('2026-09-28'), tongCau: 40 }))
    expect(dai.length).toBe(7)
    expect(dai.reduce((a, x) => a + x.soCau, 0)).toBe(40)
    expect(Math.max(...dai.map((x) => x.soCau)) - Math.min(...dai.map((x) => x.soCau))).toBeLessThanOrEqual(1)
  })
  it('hạn dài Y HỆT `moLucChang` cũ (bài chốt trước bản này và bài mới cùng một mốc)', () => {
    const chot = luc('2026-09-22', '09:30')
    const cu = moLucChang(chot, 7)
    const moi = xepLichChang(co({ chotLuc: chot, hanNop: hanNopMacDinh('2026-09-28'), soCauTungChang: Array(7).fill(8) }))
    expect(moi.map((x) => x.moLuc)).toEqual(cu)
  })
})

// ───────────────────────── chế độ ─────────────────────────
describe('cheDoLich', () => {
  it('hạn ≤ 48 giờ ⇒ ngắn (kể cả bài nhẹ); 48 giờ 1 phút và bài nhẹ ⇒ dài', () => {
    const chot = luc('2026-09-22', '09:00')
    expect(cheDoLich(co({ chotLuc: chot, hanNop: new Date(ms(chot) + 48 * 3_600_000).toISOString(), tongCau: 5 }))).toBe('ngan')
    expect(cheDoLich(co({ chotLuc: chot, hanNop: new Date(ms(chot) + 48 * 3_600_000 + MS_PHUT).toISOString(), tongCau: 5 }))).toBe('dai')
    expect(cheDoLich(co({ chotLuc: chot, hanNop: new Date(ms(chot) + 3_600_000).toISOString() }))).toBe('ngan') // không biết tổng câu cũng được
  })
  it('tải mỗi ngày > ngân sách × 1,3 ⇒ ngắn; bằng đúng ngưỡng ⇒ dài; ôn lại được trừ khỏi ngân sách', () => {
    const chot = luc('2026-09-22', '09:00')
    const han = hanNopMacDinh('2026-09-26') // 5 ngày
    expect(cheDoLich(co({ chotLuc: chot, hanNop: han, tongCau: 5 * 15 }))).toBe('dai') // 15/ngày ≤ 12 × 1,3 = 15,6
    expect(cheDoLich(co({ chotLuc: chot, hanNop: han, tongCau: 5 * 16 }))).toBe('ngan') // 16/ngày > 15,6
    expect(cheDoLich(co({ chotLuc: chot, hanNop: han, tongCau: 5 * 12, onLaiMoiNgay: 4 }))).toBe('ngan') // ngân sách còn 8 ⇒ ngưỡng 10,4
    expect(cheDoLich(co({ chotLuc: chot, hanNop: han, soCauTungChang: [12, 12, 12, 12, 12] }))).toBe('dai')
  })
  it('số ngày tới hạn tính theo lịch VN; hạn đúng 00:00 thì ngày hạn là ngày liền trước', () => {
    expect(soNgayToiHan(luc('2026-09-22', '09:00'), HAN)).toBe(1)
    expect(soNgayToiHan(luc('2026-09-22', '23:59'), hanNopMacDinh('2026-09-23'))).toBe(2)
    expect(soNgayToiHan(luc('2026-09-22', '09:00'), luc('2026-09-23', '00:00'))).toBe(1)
    expect(soNgayToiHan(luc('2026-09-22', '09:00'), luc('2026-09-22', '08:00'))).toBe(1) // đã quá hạn ⇒ vẫn ≥ 1
  })
})

// ───────────────────────── mốc muộn nhất ─────────────────────────
describe('mocMoMuonNhat', () => {
  it('= hạn − 1,5 × thời gian còn lại, làm tròn xuống phút; không bao giờ rơi vào 00:00–05:59', () => {
    const han = ms(HAN)
    expect(mocMoMuonNhat(han, 20 * MS_PHUT)).toBe(han - 30 * MS_PHUT) // 23:29
    expect(new Date(mocMoMuonNhat(han + 17_000, 20 * MS_PHUT)).getTime() % MS_PHUT).toBe(0)
    // hạn 03:00 sáng: muốn mở 02:30 ⇒ lùi về 23:59 hôm trước
    const han3 = ms(luc('2026-09-23', '03:00'))
    const t = mocMoMuonNhat(han3, 20 * MS_PHUT)
    expect(vn(new Date(t).toISOString())).toBe('09-22 23:59')
    for (let m = 0; m < 24 * 60; m += 7) {
      const h = ms(luc('2026-09-23', '00:00')) + m * MS_PHUT
      const p = phutVn(new Date(mocMoMuonNhat(h, 45 * MS_PHUT)).toISOString())
      expect(p < 0 || p >= 360, `hạn ${m} phút`).toBe(true)
    }
  })
  it('đơn điệu: còn nhiều việc hơn ⇒ mốc không muộn hơn', () => {
    const han = ms(luc('2026-09-24', '13:00'))
    let truoc = Infinity
    for (let ph = 0; ph <= 3000; ph += 13) {
      const t = mocMoMuonNhat(han, ph * MS_PHUT)
      expect(t).toBeLessThanOrEqual(truoc)
      truoc = t
    }
  })
})

// ───────────────────────── tính chất ngẫu nhiên: lịch ─────────────────────────
interface TinhHuong {
  p: DauVaoLich
  cheDo: 'dai' | 'ngan'
  m0: number
  han: number
  sizes: number[]
}
function taoTinhHuong(rnd: () => number, ep?: 'dai' | 'ngan'): TinhHuong {
  const ngayChot = 20_000 + Math.floor(rnd() * 200) // ngày trong khoảng 2024–2025 và 2026 đều được: chỉ dùng số học
  const phutChot = Math.floor(rnd() * 1440)
  const m0 = (ngayChot * MS_NGAY - LECH) + phutChot * MS_PHUT + Math.floor(rnd() * 60) * 1000
  const soNgayHan = ep === 'dai' ? 3 + Math.floor(rnd() * 20) : Math.floor(rnd() * (ep === 'ngan' ? 3 : 25))
  const ngayHan = ngayChot + soNgayHan
  let han = ngayHan * MS_NGAY - LECH + (23 * 60 + 59) * MS_PHUT
  if (rnd() < 0.15) han = m0 + Math.floor(rnd() * 72 * 60) * MS_PHUT + 1 * MS_PHUT // hạn có giờ lẻ
  const giay = 30 + Math.floor(rnd() * 190)
  const cauMoiNgay = 6 + Math.floor(rnd() * 16)
  const cuaSo = rnd() < 0.2 ? { tu: '19:00', den: '22:30' } : undefined
  const soNgay = Math.max(1, Math.floor((han - 1 + LECH) / MS_NGAY) - Math.floor((m0 + LECH) / MS_NGAY) + 1)
  const n = ep === 'dai' ? 1 + Math.floor(rnd() * Math.min(soNgay, 12)) : 1 + Math.floor(rnd() * 12)
  const sizes = Array.from({ length: n }, () => (ep === 'dai' ? 4 + Math.floor(rnd() * 8) : 1 + Math.floor(rnd() * 14)))
  const p: DauVaoLich = { chotLuc: new Date(m0).toISOString(), hanNop: new Date(han).toISOString(), soCauTungChang: sizes, cauMoiNgay, giayMoiCau: giay, ...(cuaSo ? { cuaSo } : {}) }
  return { p, cheDo: cheDoLich(p), m0, han, sizes }
}

describe('TÍNH CHẤT: mọi tình huống', () => {
  const rnd = mulberry32(2109)
  const ca = Array.from({ length: 900 }, (_, i) => taoTinhHuong(rnd, i % 3 === 0 ? 'dai' : i % 3 === 1 ? 'ngan' : undefined)).filter((t) => t.han > t.m0)
  it('có đủ cả hai chế độ trong bộ thử', () => {
    expect(ca.filter((t) => t.cheDo === 'ngan').length).toBeGreaterThan(200)
    expect(ca.filter((t) => t.cheDo === 'dai').length).toBeGreaterThan(200)
  })
  it('MỌI MỐC MỞ < HẠN; các mốc không giảm; chặng 0 = lúc chốt; đủ số chặng, đủ chiSo, đủ số câu', () => {
    for (const t of ca) {
      const l = xepLichChang(t.p)
      expect(l.length).toBe(t.sizes.length)
      expect(l.map((x) => x.chiSo)).toEqual(l.map((_, i) => i))
      expect(l.map((x) => x.soCau)).toEqual(t.sizes)
      expect(ms(l[0].moLuc)).toBe(t.m0)
      for (let k = 0; k < l.length; k++) {
        expect(ms(l[k].moLuc), `chặng ${k} phải mở trước hạn`).toBeLessThan(t.han)
        if (k > 0) expect(ms(l[k].moLuc)).toBeGreaterThanOrEqual(ms(l[k - 1].moLuc))
      }
    }
  })
  it('"đúng nhịp trước": sau lúc mở, không quá hạn; hoặc đúng hạn, hoặc đúng 23:59 giờ VN', () => {
    for (const t of ca) {
      for (const x of xepLichChang(t.p)) {
        expect(ms(x.dungNhipTruoc)).toBeGreaterThan(ms(x.moLuc))
        expect(ms(x.dungNhipTruoc)).toBeLessThanOrEqual(t.han)
        expect(ms(x.dungNhipTruoc) === t.han || phutVn(x.dungNhipTruoc) === 23 * 60 + 59).toBe(true)
      }
    }
  })
  it('HẠN NGẮN · chặng cuối đủ thời gian: mở sớm hơn hạn ≥ 1,5 × thời gian làm (trừ khi lúc chốt đã không còn đủ giờ)', () => {
    for (const t of ca.filter((x) => x.cheDo === 'ngan')) {
      const l = xepLichChang(t.p)
      const cuoi = l[l.length - 1]
      const can = 1.5 * cuoi.soCau * t.p.giayMoiCau * 1000
      if (t.han - t.m0 >= can) expect(t.han - ms(cuoi.moLuc), `mở ${vn(cuoi.moLuc)}`).toBeGreaterThanOrEqual(Math.min(can, t.han - t.m0) - MS_PHUT)
      // chặng nào cũng kịp: phần còn lại từ chặng ấy ≤ (hạn − lúc mở) / 1,5 khi có thể
      for (const x of l) {
        const con = l.slice(x.chiSo).reduce((a, y) => a + y.soCau * t.p.giayMoiCau * 1000, 0)
        expect(ms(x.moLuc)).toBeLessThanOrEqual(Math.max(t.m0, mocMoMuonNhat(t.han, con)))
      }
    }
  })
  it('HẠN NGẮN · giãn cách ≥ 40 phút khi còn dư giờ (chỉ được sát hơn khi bị mốc muộn nhất của hạn ép)', () => {
    for (const t of ca.filter((x) => x.cheDo === 'ngan')) {
      const l = xepLichChang(t.p)
      for (let k = 1; k < l.length; k++) {
        const con = l.slice(k).reduce((a, y) => a + y.soCau * t.p.giayMoiCau * 1000, 0)
        const daBiEp = ms(l[k].moLuc) >= mocMoMuonNhat(t.han, con)
        if (!daBiEp) expect(ms(l[k].moLuc) - ms(l[k - 1].moLuc), `chặng ${k} mở ${vn(l[k].moLuc)}, chặng trước ${vn(l[k - 1].moLuc)}`).toBeGreaterThanOrEqual(LICH_CHANG.GIAN_CACH_PHUT * MS_PHUT)
      }
    }
  })
  it('HẠN NGẮN · không chặng nào mở trong 00:00–05:59 giờ VN, trừ chặng mở NGAY lúc chốt (cửa sổ mặc định)', () => {
    for (const t of ca.filter((x) => x.cheDo === 'ngan' && !x.p.cuaSo)) {
      for (const x of xepLichChang(t.p)) {
        if (ms(x.moLuc) === t.m0) continue
        const p = phutVn(x.moLuc)
        expect(p >= 360, `chặng ${x.chiSo} mở ${vn(x.moLuc)} (chốt ${vn(t.p.chotLuc)}, hạn ${vn(t.p.hanNop)})`).toBe(true)
      }
    }
  })
  it('HẠN NGẮN · đủ giờ học (hạn ≥ 4 ngày, cửa sổ mặc định): mọi chặng sau chặng 0 mở TRONG cửa sổ 20:00–23:59, trừ khi bị mốc muộn nhất của hạn ép', () => {
    const r = mulberry32(4242)
    let soCa = 0
    for (let i = 0; i < 600; i++) {
      const t = taoTinhHuong(r, 'dai')
      // ép sang hạn ngắn bằng tải nặng nhưng hạn xa: mỗi chặng 10–14 câu, 6–12 chặng, ngân sách nhỏ
      const n = 6 + Math.floor(r() * 7)
      const p: DauVaoLich = { ...t.p, soCauTungChang: Array(n).fill(0).map(() => 10 + Math.floor(r() * 5)), cauMoiNgay: 6, cuaSo: undefined }
      delete (p as { cuaSo?: unknown }).cuaSo
      if (cheDoLich(p) !== 'ngan' || t.han - t.m0 < 4 * MS_NGAY) continue
      soCa++
      const l = xepLichChang(p)
      for (let k = 1; k < l.length; k++) {
        const con = l.slice(k).reduce((a, y) => a + y.soCau * p.giayMoiCau * 1000, 0)
        if (ms(l[k].moLuc) >= mocMoMuonNhat(t.han, con)) continue
        const ph = phutVn(l[k].moLuc)
        expect(ph >= 1200 && ph <= 1439, `chặng ${k} mở ${vn(l[k].moLuc)} (chốt ${vn(p.chotLuc)}, hạn ${vn(p.hanNop)}, ${n} chặng)`).toBe(true)
      }
    }
    expect(soCa).toBeGreaterThan(30)
  })
  it('HẠN DÀI · đúng MỘT chặng mỗi ngày, mở 00:00 giờ VN, liên tiếp từ ngày kế ngày chốt; y hệt `moLucChang` cũ (số chặng ≤ số ngày, như lõi luôn đảm bảo)', () => {
    for (const t of ca.filter((x) => x.cheDo === 'dai' && x.sizes.length <= soNgayToiHan(x.p.chotLuc, x.p.hanNop))) {
      const l = xepLichChang(t.p)
      const cu = moLucChang(t.p.chotLuc, t.sizes.length)
      expect(l.map((x) => x.moLuc)).toEqual(cu)
      for (let k = 1; k < l.length; k++) {
        expect(phutVn(l[k].moLuc)).toBe(0)
        expect(ngayVn(l[k].moLuc) - ngayVn(l[0].moLuc)).toBe(k)
        expect(gioVn(l[k].dungNhipTruoc) === '23:59' || ms(l[k].dungNhipTruoc) === ms(t.p.hanNop)).toBe(true)
      }
    }
  })
  it('HẠN DÀI · nhiều chặng hơn số ngày (lỗi ở nơi gọi) vẫn không vượt hạn: các chặng thừa mở chung 00:00 ngày cuối', () => {
    const chot = luc('2026-09-22', '09:00')
    const han = hanNopMacDinh('2026-09-26') // 5 ngày
    const l = xepLichChang(co({ chotLuc: chot, hanNop: han, soCauTungChang: Array(8).fill(9) }))
    expect(l.length).toBe(8)
    expect(l.slice(4).map((x) => vn(x.moLuc))).toEqual(Array(4).fill('09-26 00:00'))
    for (const x of l) expect(ms(x.moLuc)).toBeLessThan(ms(han))
  })
  it('TẤT ĐỊNH: gọi hai lần cho cùng kết quả, không đổi đầu vào', () => {
    for (const t of ca.slice(0, 200)) {
      const truoc = JSON.stringify(t.p)
      const a = xepLichChang(t.p)
      expect(JSON.stringify(t.p)).toBe(truoc)
      expect(xepLichChang(JSON.parse(truoc))).toEqual(a)
    }
  })
  it('lịch tính từ `tongCau` cho cùng tính chất: đủ tổng, chặng ≥ 1 câu, mốc < hạn', () => {
    const r = mulberry32(77)
    for (let i = 0; i < 300; i++) {
      const t = taoTinhHuong(r)
      if (t.han <= t.m0) continue
      const tong = 1 + Math.floor(r() * 90)
      const { soCauTungChang: _b, ...goc } = t.p
      void _b
      const l = xepLichChang({ ...goc, tongCau: tong })
      expect(l.reduce((a, x) => a + x.soCau, 0)).toBe(tong)
      for (const x of l) {
        expect(x.soCau).toBeGreaterThanOrEqual(1)
        expect(ms(x.moLuc)).toBeLessThan(t.han)
      }
    }
  })
})

// ───────────────────────── deadline thắng, không nhốt em ─────────────────────────
describe('deadline thắng giãn cách · không nhốt em', () => {
  it('chốt 23:30, hạn 23:59, năm chặng: mọi chặng mở ngay hoặc gần hạn, không chặng nào mở sau mốc muộn nhất, chặng 0 = lúc chốt', () => {
    const l = xepLichChang(co({ chotLuc: luc('2026-09-22', '23:30'), hanNop: HAN, soCauTungChang: [10, 10, 10, 10, 10] }))
    expect(gioVn(l[0].moLuc)).toBe('23:30')
    for (const x of l) expect(ms(x.moLuc)).toBeLessThan(ms(HAN))
    expect(l.every((x, k) => k === 0 || ms(x.moLuc) >= ms(l[k - 1].moLuc))).toBe(true)
    // không đủ giờ cho cả năm chặng: bỏ giãn cách — bốn chặng đầu mở ngay lúc chốt; chặng cuối chỉ chờ tới mốc muộn nhất (hạn − 1,5 × 15 phút = 23:36)
    expect(l.map((x) => gioVn(x.moLuc))).toEqual(['23:30', '23:30', '23:30', '23:30', '23:36'])
  })
  it('chốt sau cửa sổ (23:59:30): chặng nào cũng mở ngay lúc chốt hoặc mốc sát; không có mốc nào < chốt', () => {
    const chot = '2026-09-22T17:00:00.000Z' // 00:00 giờ VN 23/09
    const l = xepLichChang(co({ chotLuc: chot, hanNop: hanNopMacDinh('2026-09-23'), soCauTungChang: [10, 10] }))
    expect(ms(l[0].moLuc)).toBe(ms(chot))
    expect(gioVn(l[1].moLuc)).toBe('20:00') // hạn 23:59 ngày 23: chặng 1 mở tối cùng ngày (không đêm khuya)
  })
  it('chốt lệch giờ tròn (20:07, trong cửa sổ): ô đều nhau, mốc làm tròn 5 phút tính từ lúc chốt: 20:07 · 21:27 · 22:42', () => {
    const l = xepLichChang(co({ chotLuc: luc('2026-09-22', '20:07'), hanNop: HAN, soCauTungChang: [10, 10, 10] }))
    expect(l.map((x) => gioVn(x.moLuc))).toEqual(['20:07', '21:27', '22:42'])
  })
  it('chốt 19:50 (10 phút trước cửa sổ): chặng 1 vẫn cách chặng 0 ≥ 40 phút ⇒ 20:30', () => {
    const l = xepLichChang(co({ chotLuc: luc('2026-09-22', '19:50'), hanNop: HAN, soCauTungChang: [10, 10] }))
    expect(gioVn(l[1].moLuc)).toBe('20:30')
  })
  it('hạn quá gần: hạn ≤ chốt ⇒ mọi chặng mở đúng lúc chốt; một chặng ⇒ chỉ lúc chốt; không chặng ⇒ rỗng', () => {
    const chot = luc('2026-09-22', '10:00')
    const qua = xepLichChang(co({ chotLuc: chot, hanNop: luc('2026-09-22', '09:00'), soCauTungChang: [5, 5, 5] }))
    expect(qua.map((x) => x.moLuc)).toEqual([new Date(ms(chot)).toISOString(), new Date(ms(chot)).toISOString(), new Date(ms(chot)).toISOString()])
    expect(xepLichChang(co({ chotLuc: chot, hanNop: HAN, soCauTungChang: [12] })).map((x) => x.moLuc)).toEqual([new Date(ms(chot)).toISOString()])
    expect(xepLichChang(co({ chotLuc: chot, hanNop: HAN, soCauTungChang: [] }))).toEqual([])
    expect(xepLichChang(co({ chotLuc: chot, hanNop: HAN, tongCau: 0 }))).toEqual([])
  })
  it('cửa sổ tuỳ chỉnh 19:00–22:00 được theo; cửa sổ sai (chuỗi lạ, đến ≤ từ) rơi về 20:00–23:59', () => {
    const goc = { chotLuc: luc('2026-09-22', '19:00'), hanNop: HAN, soCauTungChang: [10, 10, 10] }
    expect(xepLichChang(co({ ...goc, cuaSo: { tu: '19:00', den: '22:00' } })).map((x) => gioVn(x.moLuc))).toEqual(['19:00', '20:00', '21:00'])
    const macDinh = xepLichChang(co(goc))
    expect(xepLichChang(co({ ...goc, cuaSo: { tu: 'abc', den: '22:00' } }))).toEqual(macDinh)
    expect(xepLichChang(co({ ...goc, cuaSo: { tu: '22:00', den: '20:00' } }))).toEqual(macDinh)
    expect(xepLichChang(co({ ...goc, cuaSo: { tu: '20:00', den: '20:00' } }))).toEqual(macDinh) // cửa sổ rỗng cũng bị bỏ
    expect(xepLichChang(co({ ...goc, cuaSo: { tu: '25:00', den: '26:00' } }))).toEqual(macDinh)
  })
  it('giây/câu vô lý (NaN, 0, âm) ⇒ dùng 90 giây; chặng chậm hơn thì mốc muộn nhất sớm hơn', () => {
    const goc = { chotLuc: luc('2026-09-22', '23:00'), hanNop: HAN, soCauTungChang: [10, 10] }
    const mac = xepLichChang(co({ ...goc, giayMoiCau: 90 }))
    expect(gioVn(mac[1].moLuc)).toBe('23:36') // mốc muộn nhất: hạn − 1,5 × 10 × 90 giây
    for (const g of [Number.NaN, 0, -5, Infinity]) expect(xepLichChang(co({ ...goc, giayMoiCau: g }))).toEqual(mac)
    const cham = xepLichChang(co({ ...goc, giayMoiCau: 240 }))
    expect(ms(cham[1].moLuc)).toBeLessThanOrEqual(ms(mac[1].moLuc))
  })
  it('đầu vào hỏng: thời điểm không phải ISO ⇒ RangeError rõ ràng; ngày mặc định sai dạng ⇒ RangeError', () => {
    expect(() => xepLichChang(co({ chotLuc: 'hôm qua', hanNop: HAN, soCauTungChang: [1] }))).toThrow(RangeError)
    expect(() => xepLichChang(co({ chotLuc: luc('2026-09-22', '10:00'), hanNop: '', soCauTungChang: [1] }))).toThrow(RangeError)
    expect(() => hanNopMacDinh('22/09/2026')).toThrow(RangeError)
    expect(hanNopMacDinh('2026-09-22')).toBe('2026-09-22T16:59:00.000Z')
    expect(hanNopMacDinh('2026-01-01')).toBe('2026-01-01T16:59:00.000Z')
  })
})

// ───────────────────────── sức chứa ─────────────────────────
describe('sucChua', () => {
  const chot = luc('2026-09-21', '20:00')
  it('hạn dài: số ngày × ngân sách/ngày (đã trừ ôn lại); một phiên mỗi ngày', () => {
    const s = sucChua(co({ chotLuc: luc('2026-09-22', '09:00'), hanNop: hanNopMacDinh('2026-09-28'), onLaiMoiNgay: 2 }), 'dai')
    expect(s).toEqual({ cheDo: 'dai', soNgay: 7, soPhien: 7, cauMoiPhien: 10, soCauToiDa: 70 })
  })
  it('không truyền chế độ: hạn ≤ 48 giờ ⇒ ngắn, còn lại dài', () => {
    expect(sucChua(co({ chotLuc: chot, hanNop: HAN })).cheDo).toBe('ngan')
    expect(sucChua(co({ chotLuc: luc('2026-09-22', '09:00'), hanNop: hanNopMacDinh('2026-09-28') })).cheDo).toBe('dai')
  })
  it('hạn ngắn, hai buổi tối: 6 phiên × 10 câu nhưng mỗi ngày ≤ 1,5 × 12 = 18 câu ⇒ 36 câu', () => {
    expect(sucChua(co({ chotLuc: chot, hanNop: HAN }))).toEqual({ cheDo: 'ngan', soNgay: 2, soPhien: 6, cauMoiPhien: 10, soCauToiDa: 36 })
  })
  it('hạn tối nay, chốt 14:00: một phiên mở ngay + 3 phiên tối, nhưng cả ngày ≤ 18 câu', () => {
    const s = sucChua(co({ chotLuc: luc('2026-09-22', '14:00'), hanNop: HAN }))
    expect(s).toMatchObject({ cheDo: 'ngan', soNgay: 1, soPhien: 4, soCauToiDa: 18 })
  })
  it('em làm chậm ⇒ phiên ít câu hơn (≤ 20 phút); em nhanh ⇒ trần 10 câu', () => {
    const p = (giay: number) => sucChua(co({ chotLuc: chot, hanNop: HAN, giayMoiCau: giay }))
    expect(p(30).cauMoiPhien).toBe(10)
    expect(p(120).cauMoiPhien).toBe(10)
    expect(p(240).cauMoiPhien).toBe(5)
    expect(p(900).cauMoiPhien).toBe(1)
    expect(p(Number.NaN).cauMoiPhien).toBe(10) // 90 giây ⇒ 13 ⇒ kẹp 10
  })
  it('không bao giờ 0: chốt sát hạn vẫn có 1 phiên và ≥ 1 câu', () => {
    const s = sucChua(co({ chotLuc: luc('2026-09-22', '23:55'), hanNop: HAN }))
    expect(s.soPhien).toBeGreaterThanOrEqual(1)
    expect(s.soCauToiDa).toBeGreaterThanOrEqual(1)
  })
  it('TÍNH CHẤT: hạn xa hơn (cùng lúc chốt) không làm sức chứa giảm; ôn lại nhiều hơn không làm tăng; ngắn luôn ≥ 1 phiên', () => {
    const r = mulberry32(555)
    for (let i = 0; i < 400; i++) {
      const t = taoTinhHuong(r, i % 2 ? 'ngan' : undefined)
      if (t.han <= t.m0) continue
      const goc = { chotLuc: t.p.chotLuc, cauMoiNgay: t.p.cauMoiNgay, giayMoiCau: t.p.giayMoiCau, ...(t.p.cuaSo ? { cuaSo: t.p.cuaSo } : {}) }
      const s1 = sucChua({ ...goc, hanNop: t.p.hanNop }, 'ngan')
      const s2 = sucChua({ ...goc, hanNop: new Date(t.han + MS_NGAY).toISOString() }, 'ngan')
      expect(s2.soCauToiDa, `chốt ${vn(t.p.chotLuc)} hạn ${vn(t.p.hanNop)}`).toBeGreaterThanOrEqual(s1.soCauToiDa)
      expect(s2.soPhien).toBeGreaterThanOrEqual(s1.soPhien)
      expect(s1.soPhien).toBeGreaterThanOrEqual(1)
      expect(s1.cauMoiPhien).toBeLessThanOrEqual(LICH_CHANG.CAU_TOI_DA_MOI_PHIEN)
      expect(sucChua({ ...goc, hanNop: t.p.hanNop, onLaiMoiNgay: 3 }, 'ngan').soCauToiDa).toBeLessThanOrEqual(s1.soCauToiDa)
    }
  })
  it('cảnh báo Xem trước: chỉ khi hạn ngắn và lõi vượt sức chứa; có số câu lõi và số phiên', () => {
    const s = sucChua(co({ chotLuc: chot, hanNop: HAN }))
    expect(canhBaoHanNgan(36, s)).toBeNull()
    expect(canhBaoHanNgan(37, s)).toBe('Hạn ngắn: mỗi em tối thiểu 37 câu lõi trong 6 phiên — cân nhắc lùi hạn')
    expect(canhBaoHanNgan(80, s)).toBe('Hạn ngắn: mỗi em tối thiểu 80 câu lõi trong 6 phiên — cân nhắc lùi hạn')
    expect(canhBaoHanNgan(500, sucChua(co({ chotLuc: luc('2026-09-22', '09:00'), hanNop: hanNopMacDinh('2026-09-28') }), 'dai'))).toBeNull()
  })
})

// ───────────────────────── chia số câu ─────────────────────────
describe('chiaSoCauChang', () => {
  it('đủ tổng, đều nhau (lệch ≤ 1, chặng đầu nhiều hơn), mọi chặng ≥ 1 câu', () => {
    const r = mulberry32(31)
    for (let i = 0; i < 400; i++) {
      const t = taoTinhHuong(r)
      if (t.han <= t.m0) continue
      const sc = sucChua({ chotLuc: t.p.chotLuc, hanNop: t.p.hanNop, cauMoiNgay: t.p.cauMoiNgay, giayMoiCau: t.p.giayMoiCau }, t.cheDo)
      const tong = Math.floor(r() * 120)
      const c = chiaSoCauChang(tong, sc)
      expect(c.reduce((a, b) => a + b, 0)).toBe(tong)
      if (tong === 0) expect(c).toEqual([])
      else {
        expect(c.length).toBeLessThanOrEqual(sc.cheDo === 'ngan' ? sc.soPhien : sc.soNgay)
        expect(Math.max(...c) - Math.min(...c)).toBeLessThanOrEqual(1)
        expect(Math.min(...c)).toBeGreaterThanOrEqual(1)
        expect(c).toEqual([...c].sort((a, b) => b - a))
      }
    }
  })
  it('hạn ngắn: đủ phiên ⇒ ≤ 10 câu/chặng; lõi vượt sức chứa ⇒ đúng số phiên, mỗi chặng lớn hơn 10', () => {
    const sc = sucChua(co({ chotLuc: luc('2026-09-21', '20:00'), hanNop: HAN }))
    expect(chiaSoCauChang(25, sc)).toEqual([9, 8, 8])
    expect(Math.max(...chiaSoCauChang(36, sc))).toBeLessThanOrEqual(10)
    const nhieu = chiaSoCauChang(80, sc)
    expect(nhieu.length).toBe(sc.soPhien)
    expect(nhieu).toEqual([14, 14, 13, 13, 13, 13])
  })
  it('tổng rỗng / âm / NaN ⇒ rỗng; tổng ≤ 10 câu ⇒ một chặng', () => {
    const sc = sucChua(co({ chotLuc: luc('2026-09-21', '20:00'), hanNop: HAN }))
    expect(chiaSoCauChang(0, sc)).toEqual([])
    expect(chiaSoCauChang(-4, sc)).toEqual([])
    expect(chiaSoCauChang(Number.NaN, sc)).toEqual([])
    expect(chiaSoCauChang(2, sc)).toEqual([2]) // ≤ 10 câu ⇒ một phiên
  })
})

// ───────────────────────── khoá nguồn: thuần ─────────────────────────
describe('khoá nguồn: thuần, không đồng hồ, không Intl, không ngẫu nhiên, không import', () => {
  it('src/lib/btvn-nang-do-lich.ts', () => {
    const ma = readFileSync('src/lib/btvn-nang-do-lich.ts', 'utf8')
      .split('\n')
      .filter((l) => !l.trimStart().startsWith('//') && !l.trimStart().startsWith('*') && !l.trimStart().startsWith('/**'))
      .join('\n')
    expect(ma).not.toMatch(/Date\.now\(|new Date\(\)|Math\.random|Intl\.|toLocale|process\.|performance\.now|getTimezoneOffset|getHours|getDate\(|getDay\(/)
    expect(ma).not.toMatch(/^import /m)
  })
})

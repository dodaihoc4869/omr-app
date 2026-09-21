// BTVN "NÂNG ĐỠ" — LỊCH CHẶNG BẢN 1.3: HẠN NỘP RƠI BUỔI TRƯA (Code 1, 21/09/2026; Boss giao gấp sau bài thật hạn 12:00).
// Lỗi của 1.2 ở hạn dài: chặng k mở 00:00 ngày k ⇒ chặng CUỐI mở 00:00 ĐÚNG ngày hạn, em chỉ còn buổi sáng đi học tới 12:00 trong khi giờ tự học là 20:00–23:59.
// LUẬT MỚI: số phiên = số BUỔI TỐI (cửa sổ 20:00–23:59) còn TRỌN trước hạn; ngày hạn mà cửa sổ học nằm sau giờ hạn thì KHÔNG tính; chặng cuối mở chậm nhất tối hôm trước.
// Hạn 23:59 ⇒ Y HỆT bản cũ (chữ ký vàng dưới đây tính bằng ĐÚNG mã bản 1.2 trước khi sửa). Hạn nộp, lõi, điểm không đổi.
import { describe, expect, it } from 'vitest'
import { chiaSoCauChang, cheDoLich, hanNopMacDinh, lichDaiSomHon, sucChua, xepLichChang, soNgayToiHan, type DauVaoLich } from '../src/lib/btvn-nang-do-lich'
import { mulberry32 } from '../src/lib/exam-shuffle'

/** FNV-1a 32 bit trên chuỗi. */
function bam(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** Lưới đầu vào có HẠN 23:59 (mặc định của ô hạn): chốt nhiều giờ trong ngày × hạn 0–10 ngày sau × ngân sách × tổng câu × giây/câu. */
function chuKyHan2359(): { chuKy: number; soCa: number } {
  const gio = ['00:00', '06:30', '12:00', '19:45', '20:30', '22:15', '23:30']
  let h = 0
  let soCa = 0
  for (let d = 0; d < 6; d++)
    for (const g of gio) {
      const ngayChot = `2026-09-${String(21 + d).padStart(2, '0')}`
      const chotLuc = new Date(`${ngayChot}T${g}:00+07:00`).toISOString()
      for (let n = 0; n <= 10; n++) {
        const hanNop = hanNopMacDinh(new Date(Date.parse(`${ngayChot}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10))
        for (const cauMoiNgay of [8, 12])
          for (const onLaiMoiNgay of [0, 3])
            for (const tongCau of [0, 10, 25, 40, 70])
              for (const giayMoiCau of [60, 90, 200]) {
                const p = { chotLuc, hanNop, tongCau, cauMoiNgay, onLaiMoiNgay, giayMoiCau }
                const ra = JSON.stringify([soNgayToiHan(chotLuc, hanNop), cheDoLich(p), sucChua(p), xepLichChang(p)])
                h = bam(`${h}|${ra}`)
                soCa++
              }
      }
    }
  return { chuKy: h, soCa }
}

describe('HẠN 23:59 ⇒ Y HỆT bản 1.2', () => {
  it('chữ ký vàng trên lưới 6 ngày chốt × 7 giờ × hạn 0–10 ngày × ngân sách × tổng câu × giây/câu', () => {
    const { chuKy, soCa } = chuKyHan2359()
    expect(soCa).toBe(6 * 7 * 11 * 2 * 2 * 5 * 3)
    expect(chuKy).toBe(2745342784) // tính bằng ĐÚNG mã bản 1.2 (trước khi sửa) — hạn 23:59 phải cho đúng số này
  })
})

// ───────────────────────── tiện ích ─────────────────────────
const vn = (s: string) => new Date(`${s}+07:00`).toISOString() // '2026-09-21T20:30' (giờ VN) → ISO UTC
const gioVn = (iso: string) => new Date(Date.parse(iso) + 7 * 3_600_000).toISOString().replace('T', ' ').slice(0, 16) // ISO UTC → 'YYYY-MM-DD HH:MM' giờ VN
const MS_NGAY = 86_400_000
const LECH = 7 * 3_600_000
const ngayVn = (t: number) => Math.floor((t + LECH) / MS_NGAY)
const dauNgay = (i: number) => i * MS_NGAY - LECH

/** Định nghĩa CHẬM (duyệt từng ngày): số buổi tối bắt đầu từ ngày chốt mà cửa sổ học (kết thúc `denPhut`) KẾT THÚC không muộn hơn hạn; ngày chốt luôn tính (chặng 0 mở ngay). */
function soBuoiToiTay(chot: number, han: number, denPhut: number): number {
  let n = 0
  for (let d = ngayVn(chot); dauNgay(d) + denPhut * 60_000 <= han; d++) n++
  return Math.max(1, n)
}

describe('SỐ BUỔI TỐI còn trọn trước hạn (`soNgayToiHan`)', () => {
  it('ví dụ của Boss: chốt 21/09 20:30, hạn 25/09 12:00 ⇒ 4 buổi tối (21, 22, 23, 24); hạn 23:59 ngày 25 ⇒ 5', () => {
    expect(soNgayToiHan(vn('2026-09-21T20:30'), vn('2026-09-25T12:00'))).toBe(4)
    expect(soNgayToiHan(vn('2026-09-21T20:30'), vn('2026-09-25T23:59'))).toBe(5)
    expect(soNgayToiHan(vn('2026-09-21T20:30'), vn('2026-09-26T00:00'))).toBe(5) // hạn đúng 00:00 ngày sau = hết ngày 25
    expect(soNgayToiHan(vn('2026-09-21T20:30'), vn('2026-09-25T23:58'))).toBe(4) // hạn TRƯỚC khi hết cửa sổ ngày 25 ⇒ tối 25 chưa trọn
  })
  it('ngày chốt luôn tính (≥ 1): chốt 08:00 hạn 12:00 cùng ngày ⇒ 1; hạn trước cả lúc chốt ⇒ 1', () => {
    expect(soNgayToiHan(vn('2026-09-25T08:00'), vn('2026-09-25T12:00'))).toBe(1)
    expect(soNgayToiHan(vn('2026-09-25T08:00'), vn('2026-09-20T12:00'))).toBe(1)
  })
  it('cửa sổ học tuỳ chọn: 19:00–22:00 ⇒ hạn 22:00 tính ngày hạn, 21:59 thì không; cửa sổ hỏng ⇒ mặc định 20:00–23:59', () => {
    const cs = { tu: '19:00', den: '22:00' }
    expect(soNgayToiHan(vn('2026-09-21T20:30'), vn('2026-09-25T22:00'), cs)).toBe(5)
    expect(soNgayToiHan(vn('2026-09-21T20:30'), vn('2026-09-25T21:59'), cs)).toBe(4)
    expect(soNgayToiHan(vn('2026-09-21T20:30'), vn('2026-09-25T23:59'), { tu: 'x', den: 'y' })).toBe(5)
  })
  it('TÍNH CHẤT: khớp định nghĩa duyệt từng ngày trên 5000 (chốt, hạn, cửa sổ) ngẫu nhiên; hạn 23:59 ⇒ đúng số ngày lịch từ chốt tới hạn (như bản cũ)', () => {
    const rnd = mulberry32(13092026)
    for (let i = 0; i < 5000; i++) {
      const chot = Date.parse('2026-09-21T00:00:00Z') + Math.floor(rnd() * 40 * MS_NGAY)
      const han = chot + Math.floor(rnd() * 20 * MS_NGAY) - MS_NGAY / 2
      const den = [1439, 1320, 1380, 1260][Math.floor(rnd() * 4)]
      const hh = String(Math.floor(den / 60)).padStart(2, '0')
      const mm = String(den % 60).padStart(2, '0')
      const cs = den === 1439 ? undefined : { tu: '19:00', den: `${hh}:${mm}` }
      expect(soNgayToiHan(new Date(chot).toISOString(), new Date(han).toISOString(), cs), `${i}`).toBe(soBuoiToiTay(chot, han, den))
    }
    // hạn 23:59: bằng số ngày lịch từ ngày chốt tới ngày hạn (bản cũ)
    for (let i = 0; i < 300; i++) {
      const chot = Date.parse('2026-09-21T00:00:00Z') + Math.floor(rnd() * 30 * MS_NGAY)
      const ngayHan = ngayVn(chot) + Math.floor(rnd() * 12)
      const han = dauNgay(ngayHan) + 1439 * 60_000
      expect(soNgayToiHan(new Date(chot).toISOString(), new Date(han).toISOString())).toBe(Math.max(1, ngayHan - ngayVn(chot) + 1))
    }
  })
})

describe('LỊCH CHẶNG hạn dài khi hạn rơi buổi trưa', () => {
  const dauVao = (o: Partial<DauVaoLich> = {}): DauVaoLich => ({ chotLuc: vn('2026-09-21T20:30'), hanNop: vn('2026-09-25T12:00'), cauMoiNgay: 10, onLaiMoiNgay: 2, giayMoiCau: 90, soCauTungChang: [5, 5, 5, 5], ...o })

  it('VÍ DỤ CỦA BOSS: 4 chặng mở lúc chốt · 22/09 00:00 · 23/09 00:00 · 24/09 00:00 — KHÔNG còn chặng mở 00:00 đúng ngày hạn 25/09', () => {
    const p = dauVao()
    expect(cheDoLich(p)).toBe('dai')
    const l = xepLichChang(p)
    expect(l.map((c) => gioVn(c.moLuc))).toEqual(['2026-09-21 20:30', '2026-09-22 00:00', '2026-09-23 00:00', '2026-09-24 00:00'])
    expect(l.map((c) => gioVn(c.dungNhipTruoc))).toEqual(['2026-09-21 23:59', '2026-09-22 23:59', '2026-09-23 23:59', '2026-09-24 23:59'])
  })
  it('bộ đã có 5 chặng (chốt trước bản vá): chặng thứ 5 KHÔNG mở ngày hạn mà dồn cùng ngày với chặng 4 (24/09 00:00); hạn 23:59 thì đúng như cũ (25/09 00:00)', () => {
    const l5 = xepLichChang(dauVao({ soCauTungChang: [4, 4, 4, 4, 4] }))
    expect(l5.map((c) => gioVn(c.moLuc))).toEqual(['2026-09-21 20:30', '2026-09-22 00:00', '2026-09-23 00:00', '2026-09-24 00:00', '2026-09-24 00:00'])
    const cu = xepLichChang(dauVao({ soCauTungChang: [4, 4, 4, 4, 4], hanNop: vn('2026-09-25T23:59') }))
    expect(cu.map((c) => gioVn(c.moLuc))).toEqual(['2026-09-21 20:30', '2026-09-22 00:00', '2026-09-23 00:00', '2026-09-24 00:00', '2026-09-25 00:00'])
  })
  it('sucChua hạn dài: soNgay = soPhien = 4, soCauToiDa = 4 × (ngân sách − ôn lại); tổng câu chia đều KHÔNG quá 4 chặng', () => {
    const sc = sucChua({ chotLuc: vn('2026-09-21T20:30'), hanNop: vn('2026-09-25T12:00'), cauMoiNgay: 10, onLaiMoiNgay: 2, giayMoiCau: 90 })
    expect(sc).toMatchObject({ cheDo: 'dai', soNgay: 4, soPhien: 4, cauMoiPhien: 8, soCauToiDa: 32 })
    expect(chiaSoCauChang(30, sc)).toHaveLength(4)
    expect(chiaSoCauChang(30, sc).reduce((a, b) => a + b, 0)).toBe(30)
  })
  it('tổng câu khớp số phiên: `tongCau` (không truyền soCauTungChang) ⇒ số chặng ≤ số buổi tối', () => {
    const l = xepLichChang({ chotLuc: vn('2026-09-21T20:30'), hanNop: vn('2026-09-25T12:00'), tongCau: 30, cauMoiNgay: 10, onLaiMoiNgay: 2, giayMoiCau: 90 })
    expect(l).toHaveLength(4)
    expect(l.reduce((n, c) => n + c.soCau, 0)).toBe(30)
  })
  it('hạn dài nhưng TẢI mỗi buổi tối vượt ngân sách × 1,3 ⇒ chuyển sang hạn ngắn (đếm theo số buổi tối mới, không theo số ngày lịch)', () => {
    // 45 câu: theo số ngày lịch cũ (5) là 9/ngày ≤ 8 × 1,3 = 10,4 ⇒ 'dai'; theo 4 buổi tối là 11,25 ⇒ 'ngan'
    const p = { chotLuc: vn('2026-09-21T20:30'), hanNop: vn('2026-09-25T12:00'), tongCau: 45, cauMoiNgay: 8, onLaiMoiNgay: 0, giayMoiCau: 90 }
    expect(cheDoLich(p)).toBe('ngan')
    expect(cheDoLich({ ...p, hanNop: vn('2026-09-25T23:59') })).toBe('dai') // cùng bài, hạn 23:59 (5 buổi) ⇒ dài như cũ
  })
})

describe('cửa sổ học tuỳ chọn đi xuyên suốt (cheDoLich · sucChua · xepLichChang)', () => {
  const cs = { tu: '19:00', den: '22:00' }
  const chot = vn('2026-09-21T20:30')
  const han = vn('2026-09-25T22:00') // hạn 22:00: với cửa sổ 19:00–22:00 thì tối 25 còn trọn (5 buổi); với cửa sổ mặc định (đến 23:59) thì không (4 buổi)
  it('sucChua: 5 buổi với cửa sổ 19:00–22:00, 4 buổi với mặc định', () => {
    const p = { chotLuc: chot, hanNop: han, cauMoiNgay: 10, onLaiMoiNgay: 2, giayMoiCau: 90 }
    expect(sucChua({ ...p, cuaSo: cs }, 'dai')).toMatchObject({ soNgay: 5, soPhien: 5, soCauToiDa: 40 })
    expect(sucChua(p, 'dai')).toMatchObject({ soNgay: 4, soPhien: 4, soCauToiDa: 32 })
  })
  it('xepLichChang: chặng cuối mở 25/09 00:00 với cửa sổ 19:00–22:00 (5 buổi), 24/09 00:00 với mặc định', () => {
    const p: DauVaoLich = { chotLuc: chot, hanNop: han, soCauTungChang: [4, 4, 4, 4, 4], cauMoiNgay: 10, onLaiMoiNgay: 2, giayMoiCau: 90 }
    expect(gioVn(xepLichChang({ ...p, cuaSo: cs })[4].moLuc)).toBe('2026-09-25 00:00')
    expect(gioVn(xepLichChang(p)[4].moLuc)).toBe('2026-09-24 00:00')
  })
  it('cheDoLich: 45 câu ⇒ dài với 5 buổi (9/buổi ≤ 10,4), ngắn với 4 buổi (11,25/buổi)', () => {
    const p = { chotLuc: chot, hanNop: han, tongCau: 45, cauMoiNgay: 8, onLaiMoiNgay: 0 }
    expect(cheDoLich({ ...p, cuaSo: cs })).toBe('dai')
    expect(cheDoLich(p)).toBe('ngan')
  })
})

describe('TÍNH CHẤT hạn dài: DEADLINE + buổi tối (mọi chốt × mọi hạn × mọi số chặng)', () => {
  it('2000 lịch ngẫu nhiên (hạn 12:00 / 20:30 / 23:58 / 23:59 / 00:00 / giờ ngẫu nhiên): chặng 0 = lúc chốt; mốc không giảm; mọi mốc ≤ hạn − 1 phút; chặng cuối mở chậm nhất TỐI HÔM TRƯỚC khi cửa sổ ngày hạn nằm sau hạn; số chặng khác 0 khi n ≥ 1', () => {
    const rnd = mulberry32(2026092113)
    let soCaTruaTro = 0
    for (let i = 0; i < 2000; i++) {
      const chot = Date.parse('2026-09-21T00:00:00Z') + Math.floor(rnd() * 20 * MS_NGAY)
      const gioHan = [12 * 60, 20 * 60 + 30, 1438, 1439, 0, Math.floor(rnd() * 1440)][Math.floor(rnd() * 6)]
      const ngayHan = ngayVn(chot) + 3 + Math.floor(rnd() * 8) // hạn > 48 giờ ⇒ chế độ dài (ngân sách rộng để không sang 'ngan')
      const han = dauNgay(ngayHan) + gioHan * 60_000
      const n = 1 + Math.floor(rnd() * 8)
      const p: DauVaoLich = { chotLuc: new Date(chot).toISOString(), hanNop: new Date(han).toISOString(), soCauTungChang: Array.from({ length: n }, () => 2 + Math.floor(rnd() * 5)), cauMoiNgay: 16, onLaiMoiNgay: 0, giayMoiCau: 60 }
      if (cheDoLich(p) !== 'dai') continue
      const l = xepLichChang(p)
      expect(l).toHaveLength(n)
      const mo = l.map((c) => Date.parse(c.moLuc))
      expect(mo[0], `${i}: chặng 0 mở lúc chốt`).toBe(chot)
      for (let k = 1; k < n; k++) {
        expect(mo[k]).toBeGreaterThanOrEqual(mo[k - 1])
        expect(mo[k], `${i}: chặng ${k} phải mở trước hạn`).toBeLessThanOrEqual(han - 60_000)
      }
      const soBuoi = soNgayToiHan(p.chotLuc, p.hanNop)
      // chặng k mở 00:00 ngày (chốt + min(k, soBuoi − 1)) — không bao giờ quá ngày của buổi tối cuối cùng
      for (let k = 1; k < n; k++) expect(mo[k], `${i}: chặng ${k}`).toBe(dauNgay(ngayVn(chot) + Math.min(k, soBuoi - 1)))
      if (n >= 2) {
        const cuoiCungTinh = ngayVn(chot) + soBuoi - 1
        expect(mo[n - 1], `${i}: chặng cuối không muộn hơn 00:00 ngày của buổi tối cuối`).toBeLessThanOrEqual(dauNgay(cuoiCungTinh))
        // hạn trước 23:59 ⇒ tối ngày hạn không tính ⇒ chặng cuối mở chậm nhất 00:00 hôm TRƯỚC ngày hạn (tức có nguyên ngày hôm trước để làm)
        if (gioHan < 1439 && gioHan > 0) {
          expect(mo[n - 1]).toBeLessThanOrEqual(Math.max(chot, dauNgay(ngayHan - 1)))
          soCaTruaTro++
        }
      }
      // đúng nhịp: 23:59 của ngày mở, không quá hạn
      for (const c of l) expect(Date.parse(c.dungNhipTruoc)).toBeLessThanOrEqual(han)
    }
    expect(soCaTruaTro).toBeGreaterThan(300) // có đủ ca hạn "giữa ngày" thật để phép thử có nghĩa
  })

  it('sức chứa hạn dài khớp số buổi tối trên 2000 ca: soNgay = soPhien = soNgayToiHan; soCauToiDa = soPhien × (ngân sách − ôn lại); chiaSoCauChang ≤ soPhien chặng và cộng đủ tổng', () => {
    const rnd = mulberry32(77130921)
    for (let i = 0; i < 2000; i++) {
      const chot = Date.parse('2026-09-21T00:00:00Z') + Math.floor(rnd() * 20 * MS_NGAY)
      const han = dauNgay(ngayVn(chot) + 3 + Math.floor(rnd() * 8)) + Math.floor(rnd() * 1440) * 60_000
      const cauMoiNgay = 8 + Math.floor(rnd() * 9)
      const onLai = Math.floor(rnd() * 4)
      const p = { chotLuc: new Date(chot).toISOString(), hanNop: new Date(han).toISOString(), cauMoiNgay, onLaiMoiNgay: onLai, giayMoiCau: 60 + Math.floor(rnd() * 100) }
      const sc = sucChua(p, 'dai')
      const soBuoi = soNgayToiHan(p.chotLuc, p.hanNop)
      expect(sc).toMatchObject({ cheDo: 'dai', soNgay: soBuoi, soPhien: soBuoi })
      expect(sc.soCauToiDa).toBe(soBuoi * Math.max(1, cauMoiNgay - onLai))
      const tong = 1 + Math.floor(rnd() * 80)
      const chia = chiaSoCauChang(tong, sc)
      expect(chia.length).toBeLessThanOrEqual(soBuoi)
      expect(chia.reduce((a, b) => a + b, 0)).toBe(tong)
    }
  })
})

// ───────────────────────── EM ĐÃ CHỐT TRƯỚC BẢN VÁ ─────────────────────────
/** Lịch hạn dài của BẢN 1.2 (cũ): chặng k mở 00:00 ngày (chốt + min(k, số NGÀY LỊCH từ chốt tới hạn − 1)). */
function lichCu12(chot: number, han: number, n: number): string[] {
  const soNgayLich = Math.max(1, ngayVn(han - 1) - ngayVn(chot) + 1)
  return Array.from({ length: n }, (_, k) => new Date(k === 0 ? chot : dauNgay(ngayVn(chot) + Math.min(k, soNgayLich - 1))).toISOString())
}

describe('lichDaiSomHon — chặng CHƯA MỞ của em chốt trước bản vá mở SỚM HƠN, không bao giờ muộn hơn', () => {
  const chot = vn('2026-09-21T20:30')
  const han = vn('2026-09-25T12:00')
  const cu = lichCu12(Date.parse(chot), Date.parse(han), 5)

  it('ví dụ của Boss: lịch cũ 21, 22, 23, 24, 25/09 ⇒ chặng 5 (chưa mở) mở 24/09 00:00; các chặng khác giữ nguyên', () => {
    expect(cu.map(gioVn)).toEqual(['2026-09-21 20:30', '2026-09-22 00:00', '2026-09-23 00:00', '2026-09-24 00:00', '2026-09-25 00:00'])
    const moi = lichDaiSomHon(cu, { chotLuc: chot, hanNop: han }, Date.parse(vn('2026-09-22T10:00')))
    expect(moi.map(gioVn)).toEqual(['2026-09-21 20:30', '2026-09-22 00:00', '2026-09-23 00:00', '2026-09-24 00:00', '2026-09-24 00:00'])
    // chuỗi ISO của chặng không đổi được giữ NGUYÊN chuỗi cũ (không tạo khác biệt vô nghĩa khi so sánh/ghi)
    for (const k of [0, 1, 2, 3]) expect(moi[k]).toBe(cu[k])
  })
  it('chặng ĐÃ MỞ (mốc ≤ bây giờ) không bao giờ đổi, kể cả khi lịch mới sẽ sớm hơn', () => {
    const nay = Date.parse(vn('2026-09-25T09:00')) // hạn còn 3 giờ, chặng 5 đã mở theo lịch cũ (25/09 00:00)
    expect(lichDaiSomHon(cu, { chotLuc: chot, hanNop: han }, nay)).toEqual(cu)
  })
  it('hạn 23:59 ⇒ trả Y HỆT; một chặng hoặc hạn ≤ chốt ⇒ y hệt; không sửa đầu vào', () => {
    const han2359 = vn('2026-09-25T23:59')
    const cu2 = lichCu12(Date.parse(chot), Date.parse(han2359), 5)
    expect(lichDaiSomHon(cu2, { chotLuc: chot, hanNop: han2359 }, Date.parse(chot))).toEqual(cu2)
    expect(lichDaiSomHon([chot], { chotLuc: chot, hanNop: han }, 0)).toEqual([chot])
    expect(lichDaiSomHon(cu, { chotLuc: chot, hanNop: vn('2026-09-20T12:00') }, 0)).toEqual(cu)
    expect(lichDaiSomHon([], { chotLuc: chot, hanNop: han }, 0)).toEqual([])
    const snap = JSON.stringify(cu)
    lichDaiSomHon(cu, { chotLuc: chot, hanNop: han }, 0)
    expect(JSON.stringify(cu)).toBe(snap)
  })
  it('chuỗi mốc KHÔNG đổi giữ NGUYÊN dạng đã lưu (kể cả chuỗi không chuẩn hoá như "…:00Z"); chỉ chặng đổi mới thành ISO chuẩn', () => {
    const luu = ['2026-09-21T13:30:00Z', '2026-09-21T17:00:00Z', '2026-09-22T17:00:00Z', '2026-09-23T17:00:00Z', '2026-09-24T17:00:00Z'] // 20:30 · 00:00 22 · 00:00 23 · 00:00 24 · 00:00 25 (giờ VN)
    const moi = lichDaiSomHon(luu, { chotLuc: chot, hanNop: han }, 0)
    expect(moi.slice(0, 4)).toEqual(luu.slice(0, 4))
    expect(moi[4]).toBe('2026-09-23T17:00:00.000Z') // 24/09 00:00 giờ VN
  })
  it('mốc lưu hỏng ⇒ RangeError (máy chủ bắt và giữ lịch cũ), không đoán', () => {
    expect(() => lichDaiSomHon(['không phải giờ', cu[1]], { chotLuc: chot, hanNop: han }, 0)).toThrow(RangeError)
  })
  it('TÍNH CHẤT 1500 em: mốc mới ≤ mốc cũ; đã mở giữ nguyên; không giảm; ≤ hạn − 1 phút; áp lại = cũ (idempotent); chưa mở nào ⇒ đúng bằng `xepLichChang` bản mới', () => {
    const rnd = mulberry32(13210926)
    let soDoi = 0
    for (let i = 0; i < 1500; i++) {
      const c = Date.parse('2026-09-21T00:00:00Z') + Math.floor(rnd() * 15 * MS_NGAY)
      const ngayHan = ngayVn(c) + 3 + Math.floor(rnd() * 8)
      const h = dauNgay(ngayHan) + [12 * 60, 1439, 20 * 60 + 30, 0, Math.floor(rnd() * 1440)][Math.floor(rnd() * 5)] * 60_000
      const n = 2 + Math.floor(rnd() * 8)
      const p = { chotLuc: new Date(c).toISOString(), hanNop: new Date(h).toISOString() }
      const luuCu = lichCu12(c, h, n)
      const nay = c + Math.floor(rnd() * (h - c))
      const moi = lichDaiSomHon(luuCu, p, nay)
      expect(moi).toHaveLength(n)
      for (let k = 0; k < n; k++) {
        const a = Date.parse(luuCu[k])
        const b = Date.parse(moi[k])
        expect(b, `${i}: chặng ${k} không được mở MUỘN hơn`).toBeLessThanOrEqual(a)
        if (a <= nay) expect(moi[k], `${i}: chặng ${k} đã mở`).toBe(luuCu[k])
        if (k > 0) expect(b).toBeGreaterThanOrEqual(Date.parse(moi[k - 1]))
        if (k > 0) expect(b).toBeLessThanOrEqual(h - 60_000)
        if (b < a) soDoi++
      }
      expect(lichDaiSomHon(moi, p, nay), `${i}: idempotent`).toEqual(moi)
      // không chặng nào mở rồi ⇒ bằng lịch mới của xepLichChang (chế độ dài)
      const tatCaChuaMo = lichDaiSomHon(luuCu, p, c - 1)
      const dv: DauVaoLich = { ...p, soCauTungChang: Array.from({ length: n }, () => 3), cauMoiNgay: 16, onLaiMoiNgay: 0, giayMoiCau: 60 }
      if (cheDoLich(dv) === 'dai') expect(tatCaChuaMo).toEqual(xepLichChang(dv).map((x) => x.moLuc))
    }
    expect(soDoi).toBeGreaterThan(200) // có nhiều chặng thật sự được mở sớm hơn
  })
})

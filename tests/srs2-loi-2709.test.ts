// @vitest-environment node
// Thuật toán 2.0 (Game Hóa 2.0) — mỗi luật mục B của prompt-game-hoa-2-0.md có ít nhất một test.
import { describe, expect, it } from 'vitest'
import {
  bam, canGoiY, chonPhuongAnGach, congNgay, duocThuongCauThu, henOnSau, khoiLuongCan, lapKeHoachNgay, moDuocRuong,
  ngayThanhThaoSomNhat, phatLaiCau, soNgayConLai, sucChua, tiLeChienDich, trongSoOn,
  type CauSrs, type LanLam, type TrangThaiCau,
} from '../server/src/srs2-loi'

const HAN = '2026-10-04'
const lam = (ngay: string, dung: boolean, gio = 10, coGoiY = false, qid = 'Q'): LanLam => ({ qid, ngay, luc: `${ngay}T${String(gio).padStart(2, '0')}:00:00Z`, dung, coGoiY })
const cau = (qid: string, phan: CauSrs['phan'] = 'I', mucDo: string | null = 'TH', dang: string | null = 'D1', nguon?: CauSrs['nguon']): CauSrs => ({ qid, phan, mucDo, dang, ...(nguon ? { nguon } : {}) })
const moi = (qid: string): TrangThaiCau => phatLaiCau(qid, [], HAN)
// Luật THÀNH THẠO LẦN ĐẦU (thầy 28/09): câu 0/1 sao đúng ngay lần đầu (không gợi ý) ⇒ thành thạo luôn. Các test chuỗi
// "đúng 2 ngày khác nhau" dưới đây chạy trên câu 2 SAO — loại câu vẫn giữ luật chuỗi cũ. Luật mới: tests/srs2-thanh-thao-lan-dau-2809.test.ts.
const SAO2 = { sao: 2 }

describe('ngày và D', () => {
  it('D tính cả hôm nay, tối thiểu 1', () => {
    expect(soNgayConLai('2026-09-29', HAN)).toBe(6)
    expect(soNgayConLai(HAN, HAN)).toBe(1)
    expect(soNgayConLai('2026-10-09', HAN)).toBe(1)
    expect(congNgay('2026-09-30', 2)).toBe('2026-10-02')
  })
})

describe('B.3 khi trả lời', () => {
  it('đúng câu mới (câu 2 sao) ⇒ cc = 1, hẹn +3 ngày', () => {
    const t = phatLaiCau('Q', [lam('2026-09-20', true)], HAN, [], SAO2)
    expect([t.laMoi, t.cc, t.thanhThao, t.henOn]).toEqual([false, 1, false, '2026-09-23'])
  })
  it('sai rồi đúng (cc lên 1) VẪN được hẹn lại +3 — lỗi đặc tả gốc đã sửa', () => {
    const t = phatLaiCau('Q', [lam('2026-09-20', false), lam('2026-09-21', true)], HAN)
    expect([t.cc, t.henOn]).toEqual([1, '2026-09-24'])
  })
  it('đúng 2 ngày khác nhau (câu 2 sao) ⇒ THÀNH THẠO, hẹn +7; lần 3 hẹn +14', () => {
    const t2 = phatLaiCau('Q', [lam('2026-09-01', true), lam('2026-09-04', true)], HAN, [], SAO2)
    expect([t2.cc, t2.thanhThao, t2.henOn]).toEqual([2, true, '2026-09-11'])
    const t3 = phatLaiCau('Q', [lam('2026-09-01', true), lam('2026-09-04', true), lam('2026-09-11', true)], '2026-12-31', [], SAO2)
    expect([t3.cc, t3.henOn]).toEqual([3, '2026-09-25'])
  })
  it('đúng lần hai CÙNG ngày không cộng chuỗi (trừ ngày cuối) — câu 2 sao', () => {
    const t = phatLaiCau('Q', [lam('2026-09-20', true, 8), lam('2026-09-20', true, 20)], HAN, [], SAO2)
    expect([t.cc, t.thanhThao]).toEqual([1, false])
    const cuoi = phatLaiCau('Q', [lam(HAN, true, 8), lam(HAN, true, 20)], HAN, [], SAO2)
    expect([cuoi.cc, cuoi.thanhThao]).toEqual([2, true])
  })
  it('sai ⇒ cc = 0, sai + 1, BỎ cờ thành thạo, hẹn ngày mai — lỗi đặc tả gốc (không bỏ cờ) đã sửa', () => {
    const t = phatLaiCau('Q', [lam('2026-09-01', true), lam('2026-09-04', true), lam('2026-09-11', false)], HAN)
    expect([t.cc, t.lanSai, t.thanhThao, t.henOn]).toEqual([0, 1, false, '2026-09-12'])
  })
  it('đúng nhờ gợi ý M3 ⇒ cc = 1, không tính thành thạo', () => {
    const t = phatLaiCau('Q', [lam('2026-09-01', true), lam('2026-09-04', false), lam('2026-09-05', true, 10, true)], HAN)
    expect([t.cc, t.thanhThao, t.henOn]).toEqual([1, false, '2026-09-08'])
  })
  it('ép chín sát hạn: chưa thành thạo ⇒ ngày mai; ngày cuối ⇒ ngay trong ngày', () => {
    expect(henOnSau('2026-10-02', 3, HAN, false)).toBe('2026-10-03')
    expect(henOnSau(HAN, 1, HAN, false)).toBe(HAN)
    expect(henOnSau('2026-09-20', 3, HAN, false)).toBe('2026-09-23')
  })
  it('đã thành thạo sát hạn: KHÔNG ép ôn hằng ngày, ôn chốt một lần ngày áp chót', () => {
    expect(henOnSau('2026-09-30', 7, HAN, true)).toBe('2026-10-03')
    expect(henOnSau('2026-10-03', 7, HAN, true) > HAN).toBe(true)
  })
  it('sau hạn: không nén; câu đã thành thạo hẹn ôn duy trì ≥ 30 ngày', () => {
    expect(henOnSau('2026-10-10', 3, HAN, false)).toBe('2026-10-13')
    expect(henOnSau('2026-10-10', 7, HAN, true)).toBe('2026-11-09')
  })
  it('cắt tỉa: sai ≥ 4 và lần cuối sai ⇒ Cần thầy dạy lại; thầy "Chữa xong" ⇒ đếm sai về 0, ôn ngày hôm sau', () => {
    const ds = ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'].map((n) => lam(n, false))
    const t = phatLaiCau('Q', ds, HAN)
    expect([t.lanSai, t.catTia]).toEqual([4, true])
    const sau = phatLaiCau('Q', ds, HAN, ['2026-10-05T09:00:00Z'])
    expect([sau.lanSai, sau.catTia, sau.henOn]).toEqual([0, false, '2026-10-06'])
  })
  it('cắt tỉa KHÔNG tự sống lại theo thời gian (lỗi W − 200 của đặc tả gốc)', () => {
    const ds = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04'].map((n) => lam(n, false))
    const tt = new Map([['Q', phatLaiCau('Q', ds, HAN)]])
    const kh = lapKeHoachNgay([cau('Q')], tt, { homNay: '2026-09-25', hanNop: HAN })
    expect([...kh.dao, ...kh.doan]).toEqual([])
    expect(kh.catTia).toEqual(['Q'])
  })
})

describe('B.5 gợi ý M3', () => {
  it('bật khi lần cuối sai và đã sai ≥ 2 lần; tắt khi cắt tỉa hoặc lần cuối đúng', () => {
    expect(canGoiY(phatLaiCau('Q', [lam('2026-09-01', false)], HAN))).toBe(false)
    expect(canGoiY(phatLaiCau('Q', [lam('2026-09-01', false), lam('2026-09-02', false)], HAN))).toBe(true)
    expect(canGoiY(phatLaiCau('Q', [lam('2026-09-01', false), lam('2026-09-02', false), lam('2026-09-03', false)], HAN))).toBe(true)
    expect(canGoiY(phatLaiCau('Q', ['01', '02', '03', '04'].map((d) => lam(`2026-09-${d}`, false)), HAN))).toBe(false)
    expect(canGoiY(phatLaiCau('Q', [lam('2026-09-01', false), lam('2026-09-02', false), lam('2026-09-03', true)], HAN))).toBe(false)
  })
  it('gạch đúng 2 phương án, không bao giờ gạch đáp án đúng, tất định', () => {
    for (const dung of ['A', 'B', 'C', 'D']) for (let i = 0; i < 50; i++) {
      const g = chonPhuongAnGach(dung, `S${i}|Q|2026-09-30`)
      expect(g).toHaveLength(2)
      expect(g).not.toContain(dung)
      expect(chonPhuongAnGach(dung, `S${i}|Q|2026-09-30`)).toEqual(g)
    }
  })
})

describe('B.2 lập kế hoạch ngày', () => {
  const nhieuCau = (n: number, phan: CauSrs['phan'] = 'I') => Array.from({ length: n }, (_, i) => cau(`M${i}`, phan, ['NB', 'TH', 'VD'][i % 3]!, `D${i % 4}`))
  it('câu mới giữ chỗ trước: số câu mới = ceil(câu mới còn / (D − 3))', () => {
    const cs = nhieuCau(80)
    const tt = new Map(cs.map((c) => [c.qid, moi(c.qid)]))
    const kh = lapKeHoachNgay(cs, tt, { homNay: '2026-09-29', hanNop: HAN })
    expect(kh.D).toBe(6)
    expect(kh.dao.length).toBe(40)
    const kh2 = lapKeHoachNgay(cs.slice(0, 30), new Map(cs.slice(0, 30).map((c) => [c.qid, moi(c.qid)])), { homNay: '2026-09-29', hanNop: HAN })
    expect(kh2.dao.length).toBe(30)
  })
  it('câu mới xếp Nhận biết → Thông hiểu → Vận dụng', () => {
    const cs = [cau('a', 'I', 'VD'), cau('b', 'I', 'NB'), cau('c', 'I', 'TH')]
    const kh = lapKeHoachNgay(cs, new Map(cs.map((c) => [c.qid, moi(c.qid)])), { homNay: '2026-10-02', hanNop: HAN })
    expect(kh.dao).toEqual(['b', 'c', 'a'])
  })
  it('câu mới + câu ôn Đúng–sai ⇒ Đảo; câu ôn Trắc nghiệm/Trả lời ngắn ⇒ Đoàn', () => {
    const cs = [cau('moi1'), cau('on1', 'I'), cau('on2', 'II'), cau('on3', 'III')]
    const tt = new Map<string, TrangThaiCau>([
      ['moi1', moi('moi1')],
      ['on1', phatLaiCau('on1', [lam('2026-09-28', false, 10, false, 'on1')], HAN)],
      ['on2', phatLaiCau('on2', [lam('2026-09-28', false, 10, false, 'on2')], HAN)],
      ['on3', phatLaiCau('on3', [lam('2026-09-28', false, 10, false, 'on3')], HAN)],
    ])
    const kh = lapKeHoachNgay(cs, tt, { homNay: '2026-09-30', hanNop: HAN })
    expect(new Set(kh.dao)).toEqual(new Set(['moi1', 'on2']))
    expect(new Set(kh.doan)).toEqual(new Set(['on1', 'on3']))
  })
  it('trọng số ôn: 50 + 20 × ngày trễ + 80 sắp chín / + 60 vừa sai; sắp chín xếp trước vừa sai', () => {
    const vuaSai = phatLaiCau('Q', [lam('2026-09-28', false)], HAN)
    const sapChin = phatLaiCau('Q', [lam('2026-09-26', true)], HAN, [], SAO2)
    expect(trongSoOn(vuaSai, '2026-09-29')).toBe(110)
    expect(trongSoOn(vuaSai, '2026-10-01')).toBe(150)
    expect(trongSoOn(sapChin, '2026-09-29')).toBe(130)
  })
  it('câu chưa đến lịch không vào kế hoạch', () => {
    const t = phatLaiCau('Q', [lam('2026-09-28', true)], HAN)
    const kh = lapKeHoachNgay([cau('Q')], new Map([['Q', t]]), { homNay: '2026-09-29', hanNop: HAN })
    expect([...kh.dao, ...kh.doan]).toEqual([])
  })
  it('không có chiến dịch (hoặc sau hạn): không mở câu mới, vẫn ôn nợ cũ đến lịch', () => {
    const cs = [cau('moi1'), cau('no1', 'I', 'TH', 'D1', 'no_cu')]
    const tt = new Map([['moi1', moi('moi1')], ['no1', phatLaiCau('no1', [lam('2026-10-01', false, 10, false, 'no1')], HAN)]])
    const kh = lapKeHoachNgay(cs, tt, { homNay: '2026-10-06', hanNop: HAN })
    expect(kh.dao).toEqual([])
    expect(kh.doan).toEqual(['no1'])
  })
  it('ôn duy trì chiếm tối đa 20% trần', () => {
    const cs = Array.from({ length: 30 }, (_, i) => cau(`T${i}`, 'I', 'TH', 'D', 'duy_tri'))
    const tt = new Map(cs.map((c) => [c.qid, phatLaiCau(c.qid, [lam('2026-08-01', true, 10, false, c.qid), lam('2026-08-05', true, 10, false, c.qid)], '2026-08-10')]))
    const kh = lapKeHoachNgay(cs, tt, { homNay: '2026-10-20', hanNop: null })
    expect(kh.doan.length).toBe(8)
  })
})

describe('B.4 Huyết Chiến', () => {
  it('đếm theo LƯỢT cần: 180 câu mới / 5 ngày ⇒ cần 360 lượt > 0,9 × 200 ⇒ bật, trần 80', () => {
    const cs = Array.from({ length: 180 }, (_, i) => cau(`H${i}`))
    const tt = new Map(cs.map((c) => [c.qid, moi(c.qid)]))
    const kh = lapKeHoachNgay(cs, tt, { homNay: '2026-09-30', hanNop: HAN })
    expect(kh.khoiLuong).toBe(360)
    expect(kh.huyetChien).toBe(true)
    expect(kh.tran).toBe(80)
    expect(kh.dao.length).toBe(80)
  })
  it('khối lượng: câu mới 2, câu đang ôn 2 − cc, bỏ câu thành thạo và cắt tỉa', () => {
    const ds = [moi('a'), phatLaiCau('b', [lam('2026-09-01', true, 10, false, 'b')], HAN, [], SAO2), phatLaiCau('c', [lam('2026-09-01', true, 10, false, 'c'), lam('2026-09-04', true, 10, false, 'c')], HAN)]
    expect(khoiLuongCan(ds)).toBe(3)
  })
  it('từ câu thứ 41 trong ngày không rơi EXP', () => {
    expect(duocThuongCauThu(40)).toBe(true)
    expect(duocThuongCauThu(41)).toBe(false)
  })
})

describe('Rương Bát Linh, sức chứa, tỉ lệ', () => {
  it('rương mở khi xong trọn kế hoạch ngày', () => {
    expect(moDuocRuong(40, 39)).toBe(false)
    expect(moDuocRuong(40, 40)).toBe(true)
    expect(moDuocRuong(0, 0)).toBe(false)
  })
  it('sức chứa: 205 lượt / 6 ngày × 40 = 85% ⇒ vàng', () => {
    const s = sucChua(205, 6)
    expect(Math.round(s.tiLe * 100)).toBe(85)
    expect(s.muc).toBe('vang')
    expect(sucChua(167, 6).muc).toBe('xanh')
    expect(sucChua(230, 6).muc).toBe('do')
  })
  it('tỉ lệ chiến dịch và ngày thành thạo sớm nhất', () => {
    const ds = [moi('a'), phatLaiCau('b', [lam('2026-09-29', true, 10, false, 'b')], HAN, [], SAO2)]
    expect(tiLeChienDich(ds)).toEqual({ tong: 2, coXat: 1, thanhThao: 0, canDayLai: 0 })
    expect(ngayThanhThaoSomNhat(ds)).toBe('2026-10-02')
  })
  it('băm tất định', () => {
    expect(bam('abc')).toBe(bam('abc'))
    expect(bam('abc')).not.toBe(bam('abd'))
  })
})

// ---------------------------------------------------------------- N2: mô phỏng so với đặc tả gốc
function rng(seed: number) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function chuan(r: () => number) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }
interface Em { p0: number; p: number; lanCuoi: number | null; ngayDung: number[]; ketQuaCuoi: boolean | null }
function taoEm(n: number, mu: number, r: () => number): Em[] { return Array.from({ length: n }, () => { const p0 = Math.min(0.95, Math.max(0.05, mu + 0.2 * chuan(r))); return { p0, p: p0, lanCuoi: null, ngayDung: [], ketQuaCuoi: null } }) }
function traLoi(e: Em, ngay: number, r: () => number): boolean {
  if (e.lanCuoi !== null) e.p = Math.max(e.p0, e.p - 0.02 * (ngay - e.lanCuoi))
  const d = r() < e.p
  e.p += d ? 0.1 * (1 - e.p) : 0.25 * (1 - e.p)
  e.lanCuoi = ngay; e.ketQuaCuoi = d
  if (d) { if (!e.ngayDung.includes(ngay)) e.ngayDung.push(ngay) } else e.ngayDung = []
  return d
}
const thanhThaoThat = (ds: Em[]) => ds.filter((e) => e.ketQuaCuoi === true && e.ngayDung.length >= 2).length / ds.length

function chayMoi(n: number, soNgay: number, mu: number, seed: number) {
  const r = rng(seed), em = taoEm(n, mu, r), bat = '2026-09-01', han = congNgay(bat, soNgay - 1)
  const cs = Array.from({ length: n }, (_, i) => cau(`q${i}`, 'I', 'TH', `D${i % 6}`))
  const lich: LanLam[] = []
  // Đối chứng với đặc tả gốc (thành thạo = đúng 2 ngày) ⇒ chạy luật chuỗi: câu 2 sao.
  const trangThai = () => new Map(cs.map((c) => [c.qid, phatLaiCau(c.qid, lich, han, [], SAO2)]))
  for (let t = 0; t < soNgay; t++) {
    const ngay = congNgay(bat, t)
    let daLam = 0
    for (let buoi = 0; buoi < (t === soNgay - 1 ? 2 : 1); buoi++) {
      const kh = lapKeHoachNgay(cs, trangThai(), { homNay: ngay, hanNop: han }, daLam)
      for (const qid of [...kh.doan, ...kh.dao]) {
        const i = Number(qid.slice(1))
        lich.push({ qid, ngay, luc: `${ngay}T${String(8 + buoi * 10).padStart(2, '0')}:${String(daLam % 60).padStart(2, '0')}:00Z`, dung: traLoi(em[i]!, t, r), coGoiY: false })
        daLam++
      }
    }
  }
  const tt = [...trangThai().values()]
  return { coXat: tt.filter((x) => !x.laMoi).length / n, thanhThao: thanhThaoThat(em) }
}

/** Đặc tả gốc, chạy ĐÚNG như viết (kể cả lỗi), đơn vị nửa ngày — đối chứng cho N2. */
function chayGoc(n: number, soNgay: number, mu: number, seed: number) {
  const r = rng(seed), em = taoEm(n, mu, r)
  const q = Array.from({ length: n }, (_, i) => ({ i, isNew: true, cc: 0, fail: 0, mastered: false, next: 0 }))
  const datHen = (x: typeof q[0], so: number, D: number, nua: number) => { x.next = D <= so ? (D > 1 ? nua + 2 : nua + 1) : nua + 2 * so }
  for (let t = 0; t < soNgay; t++) {
    const D = soNgay - t
    let daLam = 0
    for (let b = 0; b < (D <= 1 ? 2 : 1); b++) {
      const nua = 2 * t + b
      const huyet = q.filter((x) => !x.mastered).length > D * 40 * 0.9
      const W = (x: typeof q[0]) => { let w = 0; if (x.isNew) w = 100 / D; else if (x.next <= nua) { w += 50; const tre = Math.floor((nua - x.next) / 2); if (tre > 0) w += tre * 20; if (x.cc === 0) w += 80 } if (x.fail >= 4) w -= 200; return w }
      const ds = q.map((x) => [W(x), x] as const).filter((x) => x[0] > 0).sort((a, b) => b[0] - a[0] || a[1].i - b[1].i).slice(0, Math.max(0, (huyet ? 80 : 40) - daLam))
      for (const [, x] of ds) {
        const d = traLoi(em[x.i]!, t, r)
        if (d) { if (x.isNew) { x.isNew = false; x.cc = 1; datHen(x, 3, D, nua) } else { x.cc++; if (x.cc === 2) { x.mastered = true; datHen(x, 7, D, nua) } else if (x.cc >= 3) datHen(x, 14, D, nua) } }
        else { x.isNew = false; x.cc = 0; x.fail++; datHen(x, 1, D, nua) }
        daLam++
      }
    }
  }
  return { coXat: q.filter((x) => !x.isNew).length / n, thanhThao: thanhThaoThat(em) }
}

describe('N2 mô phỏng 300 lần: kho 150 câu, 14 ngày, 40 câu/ngày', () => {
  it('cọ xát = 100% tại hạn nộp; thành thạo thật cao hơn đặc tả gốc', () => {
    let coXatMoi = 0, ttMoi = 0, ttGoc = 0, coXatMin = 1
    const LAN = 300
    for (let i = 0; i < LAN; i++) {
      const a = chayMoi(150, 14, 0.5, 1000 + i)
      const b = chayGoc(150, 14, 0.5, 1000 + i)
      coXatMoi += a.coXat / LAN; ttMoi += a.thanhThao / LAN; ttGoc += b.thanhThao / LAN
      coXatMin = Math.min(coXatMin, a.coXat)
    }
    expect(coXatMin).toBe(1)
    expect(coXatMoi).toBeCloseTo(1, 12) // trung bình cộng số thực; điều kiện chặt nằm ở coXatMin === 1 (mọi lần chạy)
    expect(ttMoi).toBeGreaterThan(ttGoc)
    console.log(`N2: cọ xát ${(coXatMoi * 100).toFixed(1)}% · thành thạo thật mới ${(ttMoi * 100).toFixed(1)}% vs gốc ${(ttGoc * 100).toFixed(1)}%`)
  }, 120_000)
})

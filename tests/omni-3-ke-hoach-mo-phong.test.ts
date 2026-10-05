// OMNI 3 · làn A2 — MÔ PHỎNG TẤT ĐỊNH hai bài song song + chế độ chờ (đặc tả mục 9.2, 9.3; prompt tick bài NGHIỆM THU 1–2).
// Lõi thuần `lapKeHoachNgay` + `phatLaiCau`, 40 em (đúng/sai giả tất định theo băm em|câu|lần, sức em trải 0,45 → 0,95, học dần +0,12 mỗi lần gặp lại).
// Lớp D1 được mô phỏng đúng luật `docHoSo2` khi OMNI bật: câu bài đang chạy ⇒ nguồn chien_dich + `cd`; câu bài đã hết hạn em đã gặp ⇒ nợ cũ / duy trì;
// câu từng sai ⇒ nợ (nguồn thứ 4); câu bài cũ trong phạm vi chưa gặp / chưa thành thạo ⇒ ứng viên ôn bài cũ; bài chưa tick ⇒ KHÔNG có mặt.
//   Kịch bản A: bài 1 = 120 câu giao ngày 1 (01/10) hạn 7 ngày (07/10); bài 2 = 100 câu giao ngày 4 (04/10) hạn 7 ngày (10/10); bài 0 (trước bài 1,
//   30 câu, không chiến dịch) là bài cũ; bài 3 (40 câu) CHƯA tick. Thể lực 40, Huyết Chiến 80.
//   Kịch bản B: chỉ bài 1; ngày 8 (08/10) không tick bài mới ⇒ chế độ chờ.
import { describe, expect, it } from 'vitest'
import { bam, congNgay, lapKeHoachNgay, phatLaiCau, soNgayGiua, type CauSrs, type KeHoachNgay, type LanLam, type TrangThaiCau, type TuyChonKeHoach } from '../server/src/srs2-loi'
import { theLucCho, tiLeOnBaiCu } from '../server/src/omni-ke-hoach'
import { THAM_SO_OMNI } from '../server/src/omni-kieu'

type Phan = CauSrs['phan']
interface BaiGia { ten: string; cd: string | null; qids: string[]; batDau: string | null; hanNop: string | null }
const MUC = ['NB', 'TH', 'VD', 'VDC']
const phanCua = (i: number): Phan => (i % 5 === 4 ? 'II' : i % 7 === 6 ? 'III' : 'I')
const LOAI = new Map<string, { phan: Phan; mucDo: string; dang: string }>()
function taoBai(ten: string, n: number, cd: string | null, batDau: string | null, hanNop: string | null): BaiGia {
  const qids = Array.from({ length: n }, (_, i) => {
    const q = `${ten}-${i}`
    LOAI.set(q, { phan: phanCua(i), mucDo: MUC[i % 4]!, dang: `${ten}.D${i % 4}` })
    return q
  })
  return { ten, cd, qids, batDau, hanNop }
}

interface NgayEm { ngay: string; kh: KeHoachNgay; soCau: number; cho: boolean; theoLoai: Record<string, number>; soUngVienOn: number }
interface KetQuaMoPhong { gapDau: Map<string, string>[]; ngay: NgayEm[][] }

/** Một lượt mô phỏng: mỗi ngày lập kế hoạch cho từng em rồi cho em làm HẾT kế hoạch (đúng/sai giả tất định). */
function moPhong(bai: readonly BaiGia[], soEm: number, ngayDau: string, soNgay: number, theLuc: number, sucEm?: (s: number) => number): KetQuaMoPhong {
  const lich: Map<string, LanLam[]>[] = Array.from({ length: soEm }, () => new Map())
  const gapDau: Map<string, string>[] = Array.from({ length: soEm }, () => new Map())
  const ngayCua: NgayEm[][] = Array.from({ length: soEm }, () => [])
  for (let d = 0; d < soNgay; d++) {
    const ngay = congNgay(ngayDau, d)
    const dangChay = bai.filter((b) => b.cd && b.batDau! <= ngay && ngay <= b.hanNop!).sort((a, b) => (a.hanNop! < b.hanNop! ? -1 : 1))
    // phạm vi đã dạy hôm nay: bài cũ không chiến dịch + bài đã tick (đã tới ngày giao)
    const phamVi = bai.filter((b) => !b.cd || b.batDau! <= ngay)
    for (let s = 0; s < soEm; s++) {
      const cau: CauSrs[] = [], onBaiCu: CauSrs[] = []
      const tt = new Map<string, TrangThaiCau>()
      const loaiCau = new Map<string, string>()
      for (const b of phamVi) {
        const chay = dangChay.includes(b)
        for (const q of b.qids) {
          const l = LOAI.get(q)!
          const H = lich[s]!.get(q) ?? []
          const t = phatLaiCau(q, H, b.hanNop, [], { sao: 0, phan: l.phan, mucDo: l.mucDo })
          tt.set(q, t)
          const c: CauSrs = { qid: q, phan: l.phan, mucDo: l.mucDo, dang: l.dang }
          if (chay) { cau.push({ ...c, nguon: 'chien_dich', cd: b.cd! }); loaiCau.set(q, t.laMoi ? 'moi' : 'chien_dich'); continue }
          if (t.laMoi) { onBaiCu.push({ ...c, nguon: 'on_bai_cu' }); loaiCau.set(q, 'on_bai_cu'); continue }
          if (b.cd || H.some((x) => !x.dung)) { cau.push({ ...c, nguon: t.thanhThao ? 'duy_tri' : 'no_cu' }); loaiCau.set(q, t.thanhThao ? 'duy_tri' : 'no'); continue }
          if (!t.thanhThao && !t.catTia) { onBaiCu.push({ ...c, nguon: 'on_bai_cu' }); loaiCau.set(q, 'on_bai_cu') }
        }
      }
      const gan = dangChay[0]
      const cho = !dangChay.length
      const tc: TuyChonKeHoach = {
        homNay: ngay, hanNop: gan?.hanNop ?? null, tranNgay: theLuc, tranHuyetChien: 2 * theLuc, raiDeu: true,
        chienDich: dangChay.map((b) => ({ id: b.cd!, hanNop: b.hanNop!, theLucNgay: theLuc, raiDeu: true, batDau: b.batDau! })),
        onBaiCu, tiLeOnBaiCu: tiLeOnBaiCu(gan ? soNgayGiua(gan.batDau!, ngay) + 1 : null),
        ...(cho ? { cheDoCho: { theLuc: theLucCho(theLuc) } } : {}),
      }
      const kh = lapKeHoachNgay(cau, tt, tc)
      const ds = [...kh.dao, ...kh.doan]
      const theoLoai: Record<string, number> = {}
      for (const q of ds) { const k = loaiCau.get(q) ?? 'la'; theoLoai[k] = (theoLoai[k] ?? 0) + 1 }
      ngayCua[s]!.push({ ngay, kh, soCau: ds.length, cho, theoLoai, soUngVienOn: onBaiCu.length })
      const suc = sucEm ? sucEm(s) : 0.45 + (0.5 * s) / Math.max(1, soEm - 1)
      ds.forEach((q, i) => {
        const H = lich[s]!.get(q) ?? []
        const p = suc >= 1 ? 1 : Math.min(0.97, suc + 0.12 * H.length)
        const dung = bam(`${s}|${q}|${H.length}`) / 4294967296 < p
        H.push({ qid: q, ngay, luc: new Date(Date.parse(`${ngay}T01:00:00Z`) + i * 1000).toISOString(), dung, coGoiY: false })
        lich[s]!.set(q, H)
        if (!gapDau[s]!.has(q)) gapDau[s]!.set(q, ngay)
      })
    }
  }
  return { gapDau, ngay: ngayCua }
}

describe('OMNI 3 · mô phỏng hai bài song song (40 em, thể lực 40)', () => {
  const bai0 = taoBai('B0', 30, null, null, null)
  const bai1 = taoBai('B1', 120, 'CD1', '2026-10-01', '2026-10-07')
  const bai2 = taoBai('B2', 100, 'CD2', '2026-10-04', '2026-10-10')
  const bai3 = taoBai('B3', 40, 'CD3', '2099-01-01', '2099-01-07') // chưa tick: ngoài phạm vi suốt mô phỏng
  const kq = moPhong([bai0, bai1, bai2, bai3], 40, '2026-10-01', 10, 40)

  it('mỗi bài: MỌI câu mới được gặp trước hạn riêng − 3 (bài 1 ≤ 04/10, bài 2 ≤ 07/10), với từng em', () => {
    const tre: string[] = []
    kq.gapDau.forEach((g, s) => {
      for (const b of [bai1, bai2]) {
        const moc = congNgay(b.hanNop!, -3)
        for (const q of b.qids) { const n = g.get(q); if (!n || n > moc) tre.push(`em ${s} ${q} ${n ?? 'chưa gặp'}`) }
      }
    })
    expect(tre.slice(0, 10)).toEqual([])
  })
  it('không ngày nào vượt trần — trừ ngày Huyết Chiến có cờ (trần 80)', () => {
    for (const ds of kq.ngay) for (const x of ds) {
      expect(x.soCau, `${x.ngay}`).toBeLessThanOrEqual(x.kh.huyetChien ? 80 : 40)
      expect(x.kh.tran).toBe(x.kh.huyetChien ? 80 : 40)
    }
  })
  it('không câu nào của bài 3 (chưa tick) và không câu bài 2 trước ngày giao xuất hiện', () => {
    for (const ds of kq.ngay) for (const x of ds) {
      const tat = [...x.kh.dao, ...x.kh.doan]
      expect(tat.some((q) => q.startsWith('B3-'))).toBe(false)
      if (x.ngay < '2026-10-04') expect(tat.some((q) => q.startsWith('B2-'))).toBe(false)
    }
  })
  it('hai chiến dịch: quota câu mới theo từng bài (EDF), mỗi ngày giao câu mới có câu mới của bài đang luyện', () => {
    const em = kq.ngay[20]!
    // ngày 1–3 chỉ bài 1 có câu mới; ngày 5–7 bài 2 có câu mới
    for (const x of em.slice(0, 3)) expect(Object.keys(x.kh.moiTheoCd ?? {})).toEqual(['CD1'])
    for (const x of em.slice(4, 7)) expect(x.kh.moiTheoCd?.CD2 ?? 0).toBeGreaterThan(0)
    // sau hạn bài 1 (ngày 8–10) chỉ còn bài 2 trong danh sách chiến dịch
    for (const x of em.slice(7)) expect(Object.keys(x.kh.moiTheoCd ?? {})).toEqual(['CD2'])
  })
  it('ôn bài cũ chỉ lấp lượt dư, ≤ 20 % (ngày 4–5 của bài: ≤ 40 %) trần ngày', () => {
    for (const ds of kq.ngay) for (const x of ds) {
      const on = x.theoLoai.on_bai_cu ?? 0
      const ngayThu = soNgayGiua(x.ngay < '2026-10-08' ? '2026-10-01' : '2026-10-04', x.ngay) + 1
      expect(on).toBeLessThanOrEqual(Math.floor(x.kh.tran * tiLeOnBaiCu(ngayThu)))
    }
    // có em có ôn bài cũ thật (bài 0 trong phạm vi)
    expect(kq.ngay.some((ds) => ds.some((x) => (x.theoLoai.on_bai_cu ?? 0) > 0))).toBe(true)
  })
})

describe('OMNI 3 · chế độ chờ bài mới (ngày 8, không tick bài mới)', () => {
  const bai0 = taoBai('C0', 40, null, null, null)
  const bai1 = taoBai('C1', 120, 'CE1', '2026-10-01', '2026-10-07')
  const kq = moPhong([bai0, bai1], 40, '2026-10-01', 8, 40)

  it('trần = max(12, round(0,6 × 40)) = 24; thứ tự nợ → duy trì ≤ 50 % → ôn bài cũ lấp phần còn lại', () => {
    expect(theLucCho(40)).toBe(24)
    for (const ds of kq.ngay) {
      const x = ds[7]!
      expect(x.ngay).toBe('2026-10-08')
      expect(x.cho).toBe(true)
      expect(x.kh.tran).toBe(24)
      expect(x.kh.huyetChien).toBe(false)
      expect(x.soCau).toBeLessThanOrEqual(24)
      const no = x.theoLoai.no ?? 0, duyTri = x.theoLoai.duy_tri ?? 0, on = x.theoLoai.on_bai_cu ?? 0
      expect(duyTri).toBeLessThanOrEqual(Math.floor(24 * THAM_SO_OMNI.CHO_DUY_TRI_TI_LE))
      // ôn bài cũ chỉ có khi còn chỗ sau nợ + duy trì; còn ứng viên thì lấp tới đủ trần
      if (on > 0) expect(no + duyTri + on).toBeLessThanOrEqual(24)
    }
    // lớp có em ngày 8 có cả nợ lẫn ôn bài cũ
    expect(kq.ngay.some((ds) => (ds[7]!.theoLoai.no ?? 0) > 0)).toBe(true)
    expect(kq.ngay.some((ds) => (ds[7]!.theoLoai.on_bai_cu ?? 0) > 0)).toBe(true)
  })
  it('ngày 8 lấp đủ 24 lượt khi em còn đủ ứng viên ôn bài cũ (không thì dùng hết ứng viên)', () => {
    for (const ds of kq.ngay) {
      const x = ds[7]!
      const on = x.theoLoai.on_bai_cu ?? 0
      expect(x.soCau === 24 || on === x.soUngVienOn, `kế hoạch ${x.soCau}, ôn bài cũ ${on}/${x.soUngVienOn}`).toBe(true)
    }
  })
  it('em KHÔNG nợ, KHÔNG duy trì vẫn có ôn bài cũ (còn bài cũ chưa vững)', () => {
    // em "giỏi tuyệt đối": đúng mọi câu ⇒ không nợ; duy trì chưa tới lịch (30 ngày)
    const kq2 = moPhong([taoBai('E0', 200, null, null, null), taoBai('E1', 40, 'CF1', '2026-10-01', '2026-10-07')], 1, '2026-10-01', 8, 40, () => 1)
    const x = kq2.ngay[0]![7]!
    expect(x.cho).toBe(true)
    expect(x.theoLoai.no ?? 0).toBe(0)
    expect(x.theoLoai.duy_tri ?? 0).toBe(0)
    expect(x.theoLoai.on_bai_cu ?? 0).toBeGreaterThan(0)
    expect(x.soCau).toBeGreaterThanOrEqual(1)
  })
})

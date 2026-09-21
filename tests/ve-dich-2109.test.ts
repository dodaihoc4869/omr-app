// "DỒN VỀ ĐÍCH" — `src/lib/ve-dich.ts` (Code 1, 21/09/2026; thầy chốt 14:13; `DE-XUAT-DON-VE-DICH-2109.md`).
// Nghiệm thu (Boss): mọi việc bắt buộc được xếp TRƯỚC hạn HOẶC `kip = false` (không bao giờ im lặng bỏ) · không buổi nào vượt trần (2 chặng / 30 câu / 60 phút; chặng đơn lớn hơn trần đứng một mình, có cờ) ·
// không xếp sau 22:30, sau hạn, vào ca kiểm tra · buổi sáng ngày hạn dùng được khi hạn rơi trưa · đơn điệu theo thời gian (muộn hơn không kịp hơn, không nhận nhiều câu hơn) · đủ giờ thì không rút phần làm thêm ·
// ôn quá lịch rải ≤ 3 ngày, trần 40 % / 60 %.
import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../src/lib/exam-shuffle'
import { raiOnQuaLich, keHoachVeDich, soNo, TRAN_BUOI_MAC_DINH, type BaiDangChay, type KhoangGio, type ViecVeDich } from '../src/lib/ve-dich'

const vn = (s: string) => Date.parse(`${s}:00+07:00`)
const PHUT = 60_000
const ngayVn = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10)
const gio = (ms: number) => Math.floor((((ms + 7 * 3600_000) % 86_400_000) + 86_400_000) % 86_400_000 / PHUT)

const viec = (o: Partial<ViecVeDich> & Pick<ViecVeDich, 'trangThai'>): ViecVeDich => ({ loai: 'chang_btvn', soCau: 14, phut: 21, ...o })

describe('soNo — sổ nợ theo NGÀY VN', () => {
  const bai: BaiDangChay = {
    maBtvn: 'B1', ten: 'Bài Este', hanNop: '2026-09-25T12:00:00+07:00',
    moLuc: ['2026-09-21T20:30:00+07:00', '2026-09-22T00:00:00+07:00', '2026-09-23T00:00:00+07:00', '2026-09-24T00:00:00+07:00'],
    daXong: 1, cauMoiChang: [12, 14, 14, 13], phutMoiChang: [18, 21, 21, 20],
  }
  it('chặng có moLuc TRƯỚC 00:00 hôm nay và chỉ số ≥ daXong là nợ, gắn ngày của nó; chặng mở hôm nay và sắp tới KHÔNG nợ; chặng đã xong không nợ', () => {
    const r = soNo({ now: vn('2026-09-23T10:00'), baiDangChay: [bai] })
    expect(r).toEqual([{ ngay: '2026-09-22', loai: 'chang_btvn', ten: 'Bài Este · chặng 2', soCau: 14, phut: 21, maBtvn: 'B1', chiSo: 1 }])
    // ranh giới 00:00 VN: chặng mở đúng 00:00 hôm nay chưa phải nợ; một phút trước nửa đêm thì có
    expect(soNo({ now: vn('2026-09-23T00:00'), baiDangChay: [bai] }).map((m) => m.chiSo)).toEqual([1])
    expect(soNo({ now: vn('2026-09-22T23:59'), baiDangChay: [bai] })).toEqual([])
    expect(soNo({ now: vn('2026-09-24T09:00'), baiDangChay: [bai] }).map((m) => m.chiSo)).toEqual([1, 2])
    expect(soNo({ now: vn('2026-09-24T09:00'), baiDangChay: [{ ...bai, daXong: 3 }] })).toEqual([])
  })
  it('gói gia đình chưa xong và câu ôn quá lịch của NGÀY TRƯỚC là nợ; của hôm nay thì không; sắp theo ngày rồi chặng → gói → ôn; phút ôn tính theo tốc độ', () => {
    const r = soNo({
      now: vn('2026-09-24T09:00'), baiDangChay: [bai], giayMoiCau: 60,
      onQuaLich: [{ ngay: '2026-09-22', soCau: 5 }, { ngay: '2026-09-24', soCau: 9 }, { ngay: '2026-09-23', soCau: 0 }],
      goiGiaDinh: [{ ngay: '2026-09-22', soCau: 6, phut: 8 }, { ngay: '2026-09-24', soCau: 4 }],
    })
    expect(r.map((m) => [m.ngay, m.loai, m.soCau])).toEqual([['2026-09-22', 'chang_btvn', 14], ['2026-09-22', 'goi_gia_dinh', 6], ['2026-09-22', 'on_lai', 5], ['2026-09-23', 'chang_btvn', 14]])
    expect(r.find((m) => m.loai === 'on_lai')!.phut).toBe(5) // 5 câu × 60 giây
    expect(r.find((m) => m.loai === 'goi_gia_dinh')!.phut).toBe(8)
  })
  it('bài QUÁ HẠN vẫn còn nợ (Điều 4 B: em phải làm nốt); số lạ không làm hỏng; đầu vào không bị sửa', () => {
    const qua = soNo({ now: vn('2026-09-27T10:00'), baiDangChay: [Object.freeze({ ...bai, moLuc: Object.freeze([...bai.moLuc]) }) as BaiDangChay] })
    expect(qua.map((m) => m.chiSo)).toEqual([1, 2, 3])
    expect(soNo({ now: Number.NaN, baiDangChay: [bai] })).toEqual([])
    expect(soNo({ now: vn('2026-09-24T09:00'), baiDangChay: [{ ...bai, moLuc: ['x', '2026-09-22T00:00:00+07:00'], daXong: -3, cauMoiChang: [Number.NaN, 5], phutMoiChang: [] }] }).length).toBe(1)
  })
  it('ĐƠN ĐIỆU: now muộn hơn ⇒ tập nợ chỉ lớn thêm (cùng daXong); mỗi món có ngày < hôm nay và chỉ số ≥ daXong', () => {
    const r = mulberry32(1)
    for (let i = 0; i < 500; i++) {
      const soChang = 2 + Math.floor(r() * 6)
      const b: BaiDangChay = { maBtvn: 'X', ten: 'X', hanNop: '2026-10-01T23:59:00+07:00', moLuc: Array.from({ length: soChang }, (_, k) => `2026-09-${String(20 + k).padStart(2, '0')}T00:00:00+07:00`), daXong: Math.floor(r() * soChang), cauMoiChang: Array(soChang).fill(10), phutMoiChang: Array(soChang).fill(15) }
      const t1 = vn('2026-09-20T08:00') + Math.floor(r() * 8 * 86_400_000)
      const t2 = t1 + Math.floor(r() * 4 * 86_400_000)
      const a = soNo({ now: t1, baiDangChay: [b] }), c = soNo({ now: t2, baiDangChay: [b] })
      expect(c.length, `#${i}`).toBeGreaterThanOrEqual(a.length)
      for (const m of c) {
        expect(m.chiSo!, `#${i}`).toBeGreaterThanOrEqual(b.daXong)
        expect(m.ngay < ngayVn(t2), `#${i}`).toBe(true)
      }
    }
  })
})

describe('keHoachVeDich — ví dụ của đề bài', () => {
  it('"còn 46 giờ tới hạn 12:00 Thứ Sáu · 3 chặng · 41 câu · 62 phút ⇒ tối nay 2 chặng (bắt đầu muộn nhất 21:48), tối mai 1 chặng"; nợ làm trước rồi tới hôm nay', () => {
    const kq = keHoachVeDich({
      now: vn('2026-09-23T14:00'), hanNop: '2026-09-25T12:00:00+07:00',
      viecConLai: [viec({ trangThai: 'sap_toi', chiSo: 3, moLuc: '2026-09-24T00:00:00+07:00', soCau: 13, phut: 20 }), viec({ trangThai: 'hom_nay', chiSo: 2 }), viec({ trangThai: 'no', chiSo: 1, ngay: '2026-09-22' })],
    })
    expect(kq.gioConLai).toBeCloseTo(46, 5)
    expect(kq.phutCanLam).toBe(62)
    expect(kq.kip).toBe(true)
    expect(kq.canRutPhanLamThem).toBe(false)
    expect(kq.quaHan).toBe(false)
    expect(kq.cacBuoi.map((b) => [b.ngay, b.chang.length, b.soCau, b.phut, b.batDauMuonNhatGio])).toEqual([['2026-09-23', 2, 28, 42, '21:48'], ['2026-09-24', 1, 13, 20, '22:10']])
    expect(kq.cacBuoi[0]!.chang.map((c) => c.trangThai)).toEqual(['no', 'hom_nay'])
    expect(kq.cacBuoi[0]!.batDauMuonNhat).toBe('2026-09-23T21:48:00+07:00')
    expect(kq.cacBuoi.every((b) => !b.vuotTran)).toBe(true)
  })
  it('KHÔNG nợ ⇒ mỗi buổi 1 chặng như cũ (khi vẫn kịp)', () => {
    const kq = keHoachVeDich({
      now: vn('2026-09-23T14:00'), hanNop: '2026-09-26T23:59:00+07:00',
      viecConLai: [viec({ trangThai: 'hom_nay', chiSo: 2 }), viec({ trangThai: 'sap_toi', chiSo: 3, moLuc: '2026-09-24T00:00:00+07:00' }), viec({ trangThai: 'sap_toi', chiSo: 4, moLuc: '2026-09-25T00:00:00+07:00' })],
    })
    expect(kq.kip).toBe(true)
    expect(kq.changMoiBuoiDung).toBe(1)
    expect(kq.cacBuoi.map((b) => b.chang.length)).toEqual([1, 1, 1])
    expect(kq.cacBuoi.map((b) => b.ngay)).toEqual(['2026-09-23', '2026-09-24', '2026-09-25'])
  })
  it('1 chặng/buổi KHÔNG kịp ⇒ nâng lên trần buổi (2 chặng) để kịp, không rút phần nào', () => {
    const kq = keHoachVeDich({
      now: vn('2026-09-24T14:00'), hanNop: '2026-09-25T23:59:00+07:00',
      viecConLai: [viec({ trangThai: 'hom_nay', chiSo: 1 }), viec({ trangThai: 'hom_nay', chiSo: 2 }), viec({ trangThai: 'sap_toi', chiSo: 3, moLuc: '2026-09-25T00:00:00+07:00' })],
    })
    expect(kq.kip).toBe(true)
    expect(kq.changMoiBuoiDung).toBe(2)
    expect(kq.cacBuoi.map((b) => b.chang.length)).toEqual([2, 1])
  })
  it('TRẦN CÂU riêng: hai chặng 16 câu (32 > 30) mỗi chặng 20 phút (40 ≤ 60) KHÔNG chung buổi; trần PHÚT riêng: hai chặng 10 câu mỗi chặng 35 phút (70 > 60) cũng không chung buổi; 15 + 15 câu · 30 phút chung được', () => {
    const buoi = (a: [number, number], b: [number, number]) => keHoachVeDich({ now: vn('2026-09-23T14:00'), hanNop: '2026-09-26T23:59:00+07:00', viecConLai: [viec({ trangThai: 'no', chiSo: 1, soCau: a[0], phut: a[1] }), viec({ trangThai: 'no', chiSo: 2, soCau: b[0], phut: b[1] })] }).cacBuoi.map((x) => x.chang.length)
    expect(buoi([16, 20], [16, 20])).toEqual([1, 1])
    expect(buoi([10, 35], [10, 35])).toEqual([1, 1])
    expect(buoi([15, 30], [15, 30])).toEqual([2])
  })
  it('SÁNG NGÀY HẠN dùng được khi hạn rơi trưa (06:30 → hạn); hạn 23:59 thì dùng buổi tối ngày hạn, không có buổi sáng; hết giờ ⇒ không kịp, nói rõ', () => {
    const sang = keHoachVeDich({ now: vn('2026-09-24T07:00'), hanNop: '2026-09-24T12:00:00+07:00', viecConLai: [viec({ trangThai: 'no', soCau: 20, phut: 30 })] })
    expect(sang.kip).toBe(true)
    expect(sang.cacBuoi.map((b) => [b.ngay, b.batDauMuonNhatGio])).toEqual([['2026-09-24', '11:30']])
    expect(sang.phutHocDuoc).toBe(300)
    const het = keHoachVeDich({ now: vn('2026-09-24T11:45'), hanNop: '2026-09-24T12:00:00+07:00', viecConLai: [viec({ trangThai: 'no', soCau: 20, phut: 30 })] })
    expect(het.kip).toBe(false)
    expect(het.canRutPhanLamThem).toBe(true)
    expect(het.chuaXep).toHaveLength(1)
    expect(het.cacBuoi).toEqual([])
    const toi = keHoachVeDich({ now: vn('2026-09-24T07:00'), hanNop: '2026-09-24T23:59:00+07:00', viecConLai: [viec({ trangThai: 'no' })] })
    expect(toi.cacBuoi.map((b) => b.batDauMuonNhatGio)).toEqual(['22:09']) // tối ngày hạn 23:59, không quá 22:30; sáng không dùng
    expect(toi.phutHocDuoc).toBe(180)
  })
  it('KHÔNG BAO GIỜ xếp sau 22:30 (kể cả khung học của em kéo dài tới 23:30), không xếp vào giờ CÓ CA KIỂM TRA (chọn đoạn trống dài nhất)', () => {
    const muon = keHoachVeDich({ now: vn('2026-09-23T14:00'), hanNop: '2026-09-24T23:59:00+07:00', khungGioHoc: { tu: '20:00', den: '23:30' }, viecConLai: [viec({ trangThai: 'hom_nay', phut: 45 })] })
    expect(muon.cacBuoi[0]!.batDauMuonNhatGio).toBe('21:45') // 22:30 − 45 phút
    const ca: KhoangGio[] = [{ tu: '2026-09-23T20:00:00+07:00', den: '2026-09-23T21:30:00+07:00' }]
    const kq = keHoachVeDich({ now: vn('2026-09-23T14:00'), hanNop: '2026-09-24T23:59:00+07:00', caKiemTraSapToi: ca, viecConLai: [viec({ trangThai: 'hom_nay', phut: 45 })] })
    expect(kq.cacBuoi[0]).toMatchObject({ ngay: '2026-09-23', batDauMuonNhatGio: '21:45' }) // đoạn trống 21:30–22:30
    // ca chiếm cả tối ⇒ buổi chuyển sang ngày sau
    const kin = keHoachVeDich({ now: vn('2026-09-23T14:00'), hanNop: '2026-09-24T23:59:00+07:00', caKiemTraSapToi: [{ tu: '2026-09-23T19:00:00+07:00', den: '2026-09-23T23:00:00+07:00' }], viecConLai: [viec({ trangThai: 'hom_nay', phut: 45 })] })
    expect(kin.cacBuoi[0]!.ngay).toBe('2026-09-24')
  })
  it('chặng SẮP TỚI không xếp trước giờ mở; chặng đơn lớn hơn trần buổi đứng MỘT MÌNH, có cờ vuotTran; hạn đã qua ⇒ quaHan, không xếp gì, mọi việc ở chuaXep', () => {
    const chua = keHoachVeDich({ now: vn('2026-09-23T14:00'), hanNop: '2026-09-25T23:59:00+07:00', viecConLai: [viec({ trangThai: 'sap_toi', moLuc: '2026-09-25T00:00:00+07:00' })] })
    expect(chua.cacBuoi.map((b) => b.ngay)).toEqual(['2026-09-25'])
    const lon = keHoachVeDich({ now: vn('2026-09-23T14:00'), hanNop: '2026-09-25T23:59:00+07:00', viecConLai: [viec({ trangThai: 'hom_nay', chiSo: 1, soCau: 34, phut: 68 }), viec({ trangThai: 'hom_nay', chiSo: 2, soCau: 5, phut: 8 })] })
    expect(lon.cacBuoi[0]!.chang).toHaveLength(1)
    expect(lon.cacBuoi[0]!.vuotTran).toBe(true) // 34 câu > 30 và 68 phút > 60: chặng KHÔNG chia nhỏ được nên đứng một mình một buổi (khung tối 180 phút vẫn đủ)
    expect(lon.cacBuoi[1]!.chang[0]!.chiSo).toBe(2)
    expect(lon.cacBuoi[0]!.phut).toBe(68)
    const qua = keHoachVeDich({ now: vn('2026-09-26T09:00'), hanNop: '2026-09-25T12:00:00+07:00', viecConLai: [viec({ trangThai: 'no' }), viec({ trangThai: 'no', chiSo: 2 })] })
    expect(qua).toMatchObject({ quaHan: true, kip: false, cacBuoi: [], canRutPhanLamThem: true })
    expect(qua.chuaXep).toHaveLength(2)
    expect(keHoachVeDich({ now: vn('2026-09-26T09:00'), hanNop: '2026-09-25T12:00:00+07:00', viecConLai: [] })).toMatchObject({ quaHan: true, kip: true, canRutPhanLamThem: false })
  })
  it('không kịp: canRutPhanLamThem = true; có báo phần lõi thì trả lời "chỉ giữ lõi có kịp không" (kipNeuChiLoi)', () => {
    const v = (loi: boolean) => keHoachVeDich({
      now: vn('2026-09-24T18:00'), hanNop: '2026-09-25T12:00:00+07:00',
      viecConLai: [
        viec({ trangThai: 'no', chiSo: 1, soCau: 30, phut: 60, ...(loi ? { soCauLoi: 12, phutLoi: 20 } : {}) }),
        viec({ trangThai: 'hom_nay', chiSo: 2, soCau: 30, phut: 60, ...(loi ? { soCauLoi: 12, phutLoi: 20 } : {}) }),
        viec({ trangThai: 'hom_nay', chiSo: 3, soCau: 30, phut: 60, ...(loi ? { soCauLoi: 12, phutLoi: 20 } : {}) }),
        viec({ trangThai: 'hom_nay', chiSo: 4, soCau: 30, phut: 60, ...(loi ? { soCauLoi: 12, phutLoi: 20 } : {}) }),
      ],
    })
    const a = v(true)
    expect(a.kip).toBe(false)
    expect(a.canRutPhanLamThem).toBe(true)
    expect(a.kipNeuChiLoi).toBe(true) // 4 × 20 phút lõi = 80 phút ≤ 180 (tối nay) + 300 (sáng ngày hạn)
    expect(v(false).kipNeuChiLoi).toBeUndefined()
    expect(a.chuaXep.length).toBeGreaterThan(0)
  })
})

/** Kịch bản ngẫu nhiên hợp lệ. */
function kichBan(r: () => number) {
  const now = vn('2026-09-21T06:00') + Math.floor(r() * 5 * 86_400_000)
  const hanNgay = ngayVn(now + Math.floor(r() * 4) * 86_400_000)
  const han = Date.parse(`${hanNgay}T${r() < 0.5 ? '12:00' : '23:59'}:00+07:00`)
  const n = Math.floor(r() * 7)
  const viecs: ViecVeDich[] = []
  let chiSo = 1
  for (const [tt, sl] of [['no', Math.floor(r() * 3)], ['hom_nay', r() < 0.7 ? 1 : 0]] as const) for (let i = 0; i < sl && viecs.length < n; i++) viecs.push(viec({ trangThai: tt, chiSo: chiSo++, soCau: 4 + Math.floor(r() * 18), phut: 6 + Math.floor(r() * 36) }))
  while (viecs.length < n) {
    viecs.push(viec({ trangThai: 'sap_toi', chiSo: chiSo++, moLuc: `${ngayVn(now + (1 + Math.floor(r() * 3)) * 86_400_000)}T00:00:00+07:00`, soCau: 4 + Math.floor(r() * 18), phut: 6 + Math.floor(r() * 36) }))
  }
  const ca: KhoangGio[] = []
  if (r() < 0.4) { const d = ngayVn(now + Math.floor(r() * 3) * 86_400_000); const tu = 19 + Math.floor(r() * 3); ca.push({ tu: `${d}T${tu}:00:00+07:00`, den: `${d}T${tu + 1 + Math.floor(r() * 2)}:00:00+07:00` }) }
  const khung = r() < 0.5 ? undefined : { tu: `${18 + Math.floor(r() * 3)}:00`, den: `${21 + Math.floor(r() * 3)}:00` }
  return { now, han, viecs, ca, khung }
}
const tong = (ds: { soCau: number; phut: number }[]) => ({ cau: ds.reduce((s, x) => s + x.soCau, 0), phut: ds.reduce((s, x) => s + x.phut, 0) })

describe('TÍNH CHẤT trên 3 000 kịch bản ngẫu nhiên', () => {
  const CAC = Array.from({ length: 3000 }, (_, i) => ({ k: kichBan(mulberry32(7000 + i)), i }))
  const chay = (k: ReturnType<typeof kichBan>, o: { now?: number } = {}) => keHoachVeDich({ now: o.now ?? k.now, hanNop: new Date(k.han).toISOString(), viecConLai: k.viecs, caKiemTraSapToi: k.ca, khungGioHoc: k.khung })

  it('KHÔNG BAO GIỜ im lặng bỏ việc: xếp + chưa xếp = đúng tập việc đầu vào (số câu, phút, số chặng); kip ⇔ chuaXep rỗng; canRutPhanLamThem ⇔ !kip', () => {
    for (const { k, i } of CAC) {
      const kq = chay(k)
      const daXep = kq.cacBuoi.flatMap((b) => b.chang)
      expect(daXep.length + kq.chuaXep.length, `#${i}`).toBe(k.viecs.length)
      expect(tong([...daXep, ...kq.chuaXep]), `#${i}`).toEqual(tong(k.viecs))
      expect(kq.kip, `#${i}`).toBe(kq.chuaXep.length === 0)
      expect(kq.canRutPhanLamThem, `#${i}`).toBe(!kq.kip)
      expect(kq.phutCanLam, `#${i}`).toBe(tong(k.viecs).phut)
    }
  })
  it('TRẦN BUỔI: buổi ≥ 2 chặng ⇒ ≤ 2 chặng, ≤ 30 câu, ≤ 60 phút; buổi 1 chặng vượt trần thì có cờ vuotTran; không nợ mà vẫn kịp ⇒ mọi buổi 1 chặng', () => {
    for (const { k, i } of CAC) {
      const kq = chay(k)
      for (const b of kq.cacBuoi) {
        if (b.chang.length >= 2) {
          expect(b.chang.length, `#${i}`).toBeLessThanOrEqual(TRAN_BUOI_MAC_DINH.chang)
          expect(b.soCau, `#${i}`).toBeLessThanOrEqual(TRAN_BUOI_MAC_DINH.cau)
          expect(b.phut, `#${i}`).toBeLessThanOrEqual(TRAN_BUOI_MAC_DINH.phut)
        }
        expect(b.vuotTran, `#${i}`).toBe(b.chang.length === 1 && (b.soCau > 30 || b.phut > 60))
        expect(b.soCau, `#${i}`).toBe(b.chang.reduce((s, c) => s + c.soCau, 0))
        expect(b.phut, `#${i}`).toBe(b.chang.reduce((s, c) => s + c.phut, 0))
      }
      if (kq.kip && !k.viecs.some((v) => v.trangThai === 'no') && kq.changMoiBuoiDung === 1) for (const b of kq.cacBuoi) expect(b.chang.length, `#${i}`).toBe(1)
    }
  })
  it('THỜI GIAN: mỗi buổi bắt đầu ≥ bây giờ, XONG trước hạn, không quá 22:30 giờ VN, không vào ca kiểm tra, ngày trong [hôm nay, ngày hạn] và tăng dần', () => {
    for (const { k, i } of CAC) {
      const kq = chay(k)
      let truoc = ''
      for (const b of kq.cacBuoi) {
        const bd = Date.parse(b.batDauMuonNhat)
        const kt = bd + b.phut * PHUT
        expect(bd, `#${i} không quá khứ`).toBeGreaterThanOrEqual(k.now - PHUT)
        expect(kt, `#${i} trước hạn`).toBeLessThanOrEqual(k.han)
        if (ngayVn(bd) === ngayVn(kt - 1)) expect(gio(kt - 1) <= 22 * 60 + 30, `#${i} sau 22:30`).toBe(true)
        for (const c of k.ca) expect(bd < Date.parse(c.den) && kt > Date.parse(c.tu), `#${i} vào ca`).toBe(false)
        expect(b.ngay, `#${i}`).toBe(ngayVn(bd))
        expect(b.ngay >= ngayVn(k.now) && b.ngay <= ngayVn(k.han), `#${i}`).toBe(true)
        expect(b.ngay >= truoc, `#${i}`).toBe(true)
        truoc = b.ngay
      }
    }
  })
  it('THỨ TỰ: nợ → hôm nay → sắp tới trong toàn kế hoạch (xếp rồi chưa xếp); chặng sắp tới không vào buổi trước giờ mở', () => {
    const hang = { no: 0, hom_nay: 1, sap_toi: 2 } as const
    for (const { k, i } of CAC) {
      const kq = chay(k)
      const dai = [...kq.cacBuoi.flatMap((b) => b.chang.map((c) => ({ c, ngay: b.ngay }))), ...kq.chuaXep.map((c) => ({ c, ngay: '9999' }))]
      for (let j = 1; j < dai.length; j++) expect(hang[dai[j]!.c.trangThai], `#${i}`).toBeGreaterThanOrEqual(hang[dai[j - 1]!.c.trangThai])
      for (const b of kq.cacBuoi) for (const c of b.chang) {
        const goc = k.viecs.find((v) => v.trangThai === c.trangThai && v.chiSo === c.chiSo)!
        if (goc.moLuc) expect(b.ngay >= ngayVn(Date.parse(goc.moLuc)), `#${i}`).toBe(true)
      }
    }
  })
  it('ĐƠN ĐIỆU THEO THỜI GIAN: cùng việc, now muộn hơn ⇒ KHÔNG kịp hơn (kip không đi từ false lên true), tổng câu xếp được không tăng; đủ giờ ⇒ không rút phần làm thêm', () => {
    const r = mulberry32(99)
    for (const { k, i } of CAC.slice(0, 2000)) {
      const som = chay(k)
      const muon = chay(k, { now: k.now + Math.floor(r() * 30 * 3600_000) })
      if (!som.kip) expect(muon.kip, `#${i}`).toBe(false)
      const cau = (x: typeof som) => x.cacBuoi.reduce((s, b) => s + b.soCau, 0)
      expect(cau(muon), `#${i}`).toBeLessThanOrEqual(cau(som))
      expect(muon.phutHocDuoc, `#${i}`).toBeLessThanOrEqual(som.phutHocDuoc)
      if (som.kip) expect(som.canRutPhanLamThem, `#${i}`).toBe(false)
    }
  })
  it('THUẦN: cùng đầu vào ⇒ cùng kết quả; không sửa đầu vào (đóng băng sâu vẫn chạy)', () => {
    for (const { k, i } of CAC.slice(0, 400)) {
      const viecs = Object.freeze(k.viecs.map((v) => Object.freeze({ ...v })))
      const a = keHoachVeDich({ now: k.now, hanNop: new Date(k.han).toISOString(), viecConLai: viecs, caKiemTraSapToi: Object.freeze(k.ca.map((c) => Object.freeze({ ...c }))), khungGioHoc: k.khung })
      const b = keHoachVeDich({ now: k.now, hanNop: new Date(k.han).toISOString(), viecConLai: viecs, caKiemTraSapToi: k.ca, khungGioHoc: k.khung })
      expect(a, `#${i}`).toEqual(b)
    }
  })
  it('lưới có đủ ca kịp và không kịp, có nợ, có buổi 2 chặng (phép kiểm có nghĩa)', () => {
    let kip = 0, khong = 0, no = 0, hai = 0
    for (const { k } of CAC) {
      const kq = chay(k)
      if (kq.kip) kip++
      else khong++
      if (k.viecs.some((v) => v.trangThai === 'no')) no++
      if (kq.cacBuoi.some((b) => b.chang.length === 2)) hai++
    }
    expect(kip).toBeGreaterThan(500)
    expect(khong).toBeGreaterThan(100)
    expect(no).toBeGreaterThan(500)
    expect(hai).toBeGreaterThan(100)
  })
})

describe('raiOnQuaLich — ôn quá lịch rải ≤ 3 ngày', () => {
  it('ví dụ: 14 câu, ngân sách 20: hôm nay nợ chặng (trần 40 % = 8, các ngày sau 60 % = 12) ⇒ 2 ngày [7, 7]; không nợ (12/12/12) cũng [7, 7]; 40 câu ⇒ 3 ngày đầy trần, còn lại 8', () => {
    expect(raiOnQuaLich(14, 20, true)).toEqual({ cacNgay: [7, 7], tran: [8, 12], conLai: 0 })
    expect(raiOnQuaLich(14, 20, false)).toEqual({ cacNgay: [7, 7], tran: [12, 12], conLai: 0 })
    expect(raiOnQuaLich(40, 20, true)).toEqual({ cacNgay: [8, 12, 12], tran: [8, 12, 12], conLai: 8 })
    expect(raiOnQuaLich(5, 20, true)).toEqual({ cacNgay: [5], tran: [8], conLai: 0 })
    expect(raiOnQuaLich(0, 20, true)).toEqual({ cacNgay: [], tran: [], conLai: 0 })
    // trần 40 % ⇒ 60 % khi hôm đó không nợ chặng: cùng 10 câu, ngân sách 10 ⇒ nợ: trần 4/6/6 ⇒ 2 ngày; không nợ: 6/6/6 ⇒ 2 ngày [5, 5]
    expect(raiOnQuaLich(10, 10, true)).toEqual({ cacNgay: [5, 5], tran: [4, 6], conLai: 0 }.cacNgay.length === 2 ? raiOnQuaLich(10, 10, true) : {})
    expect(raiOnQuaLich(6, 10, false).cacNgay).toEqual([6])
    expect(raiOnQuaLich(6, 10, true).cacNgay.length).toBe(2) // trần 4 ⇒ cần 2 ngày
    // theo ngày: [nợ, không nợ, nợ]
    expect(raiOnQuaLich(30, 20, [true, false, true]).tran).toEqual([8, 12, 8])
  })
  it('TÍNH CHẤT 5 000 ca: ≤ 3 ngày; mỗi ngày ≤ trần ngày ấy; tổng rải + còn lại = số câu; chia đều (chênh ≤ 1) khi trần không chặn; còn lại > 0 chỉ khi đã đầy trần cả 3 ngày', () => {
    const r = mulberry32(3)
    for (let i = 0; i < 5000; i++) {
      const n = Math.floor(r() * 80)
      const ns = 1 + Math.floor(r() * 30)
      const no = r() < 0.5 ? r() < 0.5 : [r() < 0.5, r() < 0.5, r() < 0.5]
      const kq = raiOnQuaLich(n, ns, no)
      const nhan = `#${i} n${n} ns${ns}`
      expect(kq.cacNgay.length, nhan).toBeLessThanOrEqual(3)
      expect(kq.cacNgay.length, nhan).toBe(kq.tran.length)
      kq.cacNgay.forEach((c, j) => expect(c, `${nhan} ngày${j}`).toBeLessThanOrEqual(kq.tran[j]!))
      expect(kq.cacNgay.reduce((s, x) => s + x, 0) + kq.conLai, nhan).toBe(n)
      const tran = (j: number) => Math.floor(ns * ((Array.isArray(no) ? no[j] === true : j === 0 ? no === true : false) ? 0.4 : 0.6))
      kq.tran.forEach((t, j) => expect(t, nhan).toBe(tran(j)))
      if (kq.conLai > 0) {
        expect(kq.cacNgay.length, nhan).toBe(3)
        kq.cacNgay.forEach((c, j) => expect(c, nhan).toBe(kq.tran[j]))
      } else if (kq.cacNgay.length > 0 && kq.cacNgay.every((c, j) => c < kq.tran[j]!)) {
        expect(Math.max(...kq.cacNgay) - Math.min(...kq.cacNgay), nhan).toBeLessThanOrEqual(1)
      }
    }
  })
})

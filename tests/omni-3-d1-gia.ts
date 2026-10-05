// LÕI GIẢ TẤT ĐỊNH cho test LỚP D1 OMNI 3 (làn B2) — KHÔNG phải công thức thật (lõi thuần là làn khác, đang là STUB).
// Mục đích: kiểm ĐƯỜNG ỐNG (sổ → SuKienOmni → Q → prior → phatLaiEm → Sảnh/PH/Bảng bài) mà không phụ thuộc con số của stub.
// Test gắn các hàm này qua `vi.mock` (omni-p-vkn, du-bao-diem, omni-ke-hoach, omni-met-gio, omni-chung-chi, bai-da-day).
import {
  CAC_KHUNG_GIO, PHIEN_BAN_OMNI, THAM_SO_OMNI, khungGioCua,
  type ChungChi, type DuBao, type HoSoOmniEm, type HoSoVkn, type KhungDe, type KhungGio, type QCau, type ThamSoOmni,
} from '../server/src/omni-kieu'
import type { DauVaoPhatLai } from '../server/src/omni-p-vkn'
import type { PhamViLop } from '../server/src/bai-da-day'

/** Trạng thái dùng chung giữa test và các mock (cùng một thể hiện mô-đun). */
export const gia = {
  /** Mọi lần gọi phatLaiEm (đầu vào) — test soi đường ống. */
  goi: [] as { sbd: string; dv: DauVaoPhatLai }[],
  /** Ghi đè hồ sơ sau phát lại theo em (vd ép sơ ý cao). */
  ghiDe: {} as Record<string, (hs: HoSoOmniEm) => HoSoOmniEm>,
  /** Lớp do "tick bài" (lopCuaEm) trả; vắng ⇒ null (lớp D1 tự lùi về hoc_sinh). */
  lop: {} as Record<string, string>,
  phamVi: {} as Record<string, PhamViLop>,
  /** Hồ sơ mệt theo giờ: null ⇒ không kích hoạt. */
  metGio: null as null | { khung: KhungGio; tiLe: number; tiLeTot: number; kichHoat: boolean },
  /** Mọi lần gọi goiYQ / betaTuMau. */
  goiYQ: [] as unknown[],
  beta: [] as number[][],
}
export function datLaiGia(): void {
  gia.goi = []; gia.ghiDe = {}; gia.lop = {}; gia.phamVi = {}; gia.metGio = null; gia.goiYQ = []; gia.beta = []
}

const vknRong = (k: string, p: number): HoSoVkn => ({ vkn: k, p, nTuLam: 0, nCau: 0, nNgay: 0, nTroiChay: 0, nCauLaDung: 0, diemSprt: 0, trangThai: 'chua_du', ngayCuoi: null, dayLai: false })
export const vknCuaCau = (c: QCau): string[] => [...new Set([...c.vkn, ...(c.vknY ?? []).flat()])]

/** Phát lại giả: một quan sát/câu/ngày, bỏ lướt/đọc lời giải/hỗ trợ/bỏ trống; đúng ⇒ p += (1−p)·0,3; sai ⇒ p ·= 0,6; lượt vững ⇒ đếm sơ ý. */
export function phatLaiGia(sbd: string, dv: DauVaoPhatLai): HoSoOmniEm {
  const ts = dv.ts ?? THAM_SO_OMNI
  const vkn: Record<string, HoSoVkn> = {}
  const khungGio = Object.fromEntries(CAC_KHUNG_GIO.map((k) => [k, { n: 0, soY: 0 }])) as HoSoOmniEm['khungGio']
  let nVung = 0, nSaiVung = 0
  const da = new Set<string>()
  const ngay = new Map<string, Set<string>>()
  const ds = [...dv.suKien].sort((a, b) => a.receivedAt - b.receivedAt || (a.khoa < b.khoa ? -1 : 1))
  for (const e of ds) {
    if (e.purpose === 'xem_loi_giai' || e.purpose === 'luot' || e.ketQua === null || e.assistance !== 'none') continue
    const k1 = `${e.qid}|${e.ngayVn}`
    if (da.has(k1)) continue
    da.add(k1)
    const q = dv.q.get(e.qid)
    if (!q) continue
    khungGio[khungGioCua(e.receivedAt)].n++
    const pTruoc = q.vkn.map((k) => vkn[k]?.p ?? dv.p0?.get(k) ?? ts.P0)
    if (pTruoc.every((p) => p >= ts.P_VUNG_DO_SO_Y)) { nVung++; if (e.ketQua === 0) nSaiVung++ }
    q.vkn.forEach((k, i) => {
      const cu = vkn[k] ?? vknRong(k, pTruoc[i]!)
      const p = e.ketQua === 1 ? cu.p + (1 - cu.p) * 0.3 : cu.p * 0.6
      const s = ngay.get(k) ?? new Set<string>()
      s.add(e.ngayVn)
      ngay.set(k, s)
      vkn[k] = { ...cu, p, nTuLam: cu.nTuLam + 1, nCau: cu.nCau + 1, nNgay: s.size, nTroiChay: cu.nTroiChay + (e.ketQua === 1 && e.nhanTocDo === 'troi_chay' ? 1 : 0), trangThai: p >= 0.9 ? 'vung' : p < 0.2 ? 'chua_vung' : 'chua_du', ngayCuoi: e.ngayVn }
    })
  }
  for (const x of dv.xacNhan ?? []) {
    const k = `dang:${x.maDang}`
    vkn[k] = { ...(vkn[k] ?? vknRong(k, ts.P0)), p: x.ket === 'vung' ? ts.XAC_NHAN.vung : ts.XAC_NHAN.dayLai, trangThai: x.ket === 'vung' ? 'vung' : 'chua_vung', dayLai: x.ket === 'day_lai' }
  }
  const cuoi = ds[ds.length - 1]
  const hs: HoSoOmniEm = {
    sbd, vkn, sEm: (nSaiVung + ts.S0 * ts.S_AO) / (nVung + ts.S_AO), nVung, nSaiVung, tau: 0, nTau: 0, khungGio,
    luotHomNay: dv.suKien.filter((e) => e.purpose === 'luot' && e.ngayVn === dv.homNay).length,
    cursor: cuoi ? `${cuoi.receivedAt}|${cuoi.khoa}` : '', phienBan: PHIEN_BAN_OMNI,
  }
  return gia.ghiDe[sbd] ? gia.ghiDe[sbd]!(hs) : hs
}

const pAndGia = (hs: Pick<HoSoOmniEm, 'vkn'>, kn: readonly string[], ts: ThamSoOmni = THAM_SO_OMNI) => kn.reduce((s, k) => s * (hs.vkn[k]?.p ?? ts.P0), 1)
/** Dự báo giả: kỳ vọng = 10 × trung bình pAnd(câu) × (1 − sEm); cỡ mẫu = Σ nTuLam vi kỹ năng phạm vi. */
export function duBaoGia(hs: HoSoOmniEm, cau: readonly QCau[], _tuy: { khung?: KhungDe; mucTieu?: number; khaThi?: KhungDe } = {}, ts: ThamSoOmni = THAM_SO_OMNI): DuBao {
  const vk = [...new Set(cau.flatMap(vknCuaCau))]
  const soBangChung = vk.reduce((s, k) => s + (hs.vkn[k]?.nTuLam ?? 0), 0)
  const tb = cau.length ? cau.reduce((s, c) => s + pAndGia(hs, c.vkn, ts), 0) / cau.length : 0
  const kyVong = Math.round(10 * tb * (1 - hs.sEm) * 1000) / 1000
  return { kyVong, p8: kyVong >= 8 ? 0.93 : 0.2, saiSo: 0.5, pmf: [], conDuong: null, conThieu: { vkn: [], soY: 0 }, soBangChung }
}
/** Dạng đã vững giả: mọi vi kỹ năng của mọi câu của dạng có trạng thái 'vung'. */
export function dangDaVungGia(hs: HoSoOmniEm, cau: readonly QCau[]): string[] {
  const dang = [...new Set(cau.map((c) => c.maDang ?? '').filter(Boolean))]
  return dang.filter((d) => cau.filter((c) => c.maDang === d).flatMap(vknCuaCau).every((k) => hs.vkn[k]?.trangThai === 'vung'))
}
/** Chứng chỉ giả: đạt ⇔ có ca chốt ≥ T_CA_CHOT (đủ để kiểm đường ghi, không kiểm công thức). */
export function xetChungChiGia(_hs: HoSoOmniEm, _cau: readonly QCau[], duBao: DuBao, caChot: { diem: number; ngay: string } | null, _nhip: number, ts: ThamSoOmni = THAM_SO_OMNI): ChungChi {
  const dat = !!caChot && caChot.diem >= ts.T_CA_CHOT
  return { dat, doTin: duBao.p8, thieu: dat ? [] : ['ca_chot'], conThieu: duBao.conThieu, uocNgay: dat ? null : 3 }
}

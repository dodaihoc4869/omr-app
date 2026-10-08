// BỘ QUYẾT ĐỊNH OMNI–ZPD v2 — lõi thuần, tất định.
// ZPD chịu trách nhiệm quota bậc; mô-đun này xếp câu trong từng quota theo giá trị học thật/phút,
// độ sẵn sàng tiền quyết, nguy cơ quên và độ chắc của hồ sơ. Không tự nâng bậc ngoài ZPD.
import { trongSoCau } from './du-bao-diem'
import { THAM_SO_OMNI, type HoSoOmniEm, type HoSoVkn, type QCau, type ThamSoOmni } from './omni-kieu'
import { msKyVong } from './omni-toc-do'
import { vknCaCau } from './omni-p-vkn'

export const PHIEN_BAN_QUYET_DINH_V2 = 'omni-zpd-value-per-minute-v2.0'

/** Đồ thị nền đã duyệt theo quan hệ bắt buộc rõ ràng; nhãn không có cạnh không bị suy đoán. */
export const TIEN_QUYET_NEN: Readonly<Record<string, readonly string[]>> = Object.freeze({
  ti_le_mol_phuong_trinh: ['can_bang_phuong_trinh', 'doi_mol_khoi_luong'],
  chat_du_het: ['ti_le_mol_phuong_trinh'],
  hieu_suat: ['ti_le_mol_phuong_trinh'],
  bao_toan_khoi_luong: ['can_bang_phuong_trinh'],
  bao_toan_nguyen_to: ['doi_mol_khoi_luong'],
  bao_toan_electron: ['can_bang_phuong_trinh', 'doi_mol_khoi_luong'],
  bao_toan_dien_tich: ['doi_mol_khoi_luong'],
  dung_dich_pha_loang: ['nong_do_mol', 'nong_do_phan_tram'],
  ph_nong_do_ion: ['nong_do_mol'],
  hang_so_can_bang: ['nong_do_mol', 'can_bang_phuong_trinh'],
  bien_thien_enthalpy: ['can_bang_phuong_trinh'],
  nang_luong_lien_ket: ['bien_thien_enthalpy'],
  dien_phan_faraday: ['bao_toan_electron', 'doi_mol_khoi_luong'],
  the_dien_cuc_pin: ['bao_toan_electron'],
  phan_tram_khoi_luong: ['doi_mol_khoi_luong'],
  cong_thuc_phan_tu: ['phan_tram_khoi_luong', 'doi_mol_khoi_luong'],
  do_bat_bao_hoa: ['cong_thuc_phan_tu'],
})

const kep = (x: number, min: number, max: number): number => Number.isFinite(x) ? Math.max(min, Math.min(max, x)) : min
const ngayMs = (ngay: string): number => Date.parse(`${ngay}T00:00:00Z`)
const soNgay = (a: string | null, b: string): number => {
  if (!a) return 0
  const x = ngayMs(a), y = ngayMs(b)
  return Number.isFinite(x) && Number.isFinite(y) ? Math.max(0, Math.round((y - x) / 86_400_000)) : 0
}
const nhanNen = (vkn: string): string | null => vkn.startsWith('nen:') ? vkn.slice(4) : null

/** Độ tin của hồ sơ: co mẫu nhỏ, không cho 1–2 lượt lấn át lịch nền. */
export const doTinVkn = (h: HoSoVkn | undefined): number => h ? kep(h.nTuLam / (h.nTuLam + 6), 0, 1) : 0

/**
 * Xác suất còn nhớ tại ngày lập kế hoạch. Đây là lớp thích nghi thận trọng trên hồ sơ OMNI;
 * card FSRS theo content_group vẫn là nguồn lịch nhớ chính, hàm này chỉ xếp ưu tiên khi nhiều câu cùng đến hạn.
 */
export function xacSuatConNho(h: HoSoVkn | undefined, homNay: string, p0 = THAM_SO_OMNI.P0): number {
  if (!h) return p0
  const d = soNgay(h.ngayCuoi, homNay)
  if (d <= 0) return kep(h.p, .02, .99)
  const chatLuong = kep(.55 + .7 * h.p + .08 * Math.min(4, h.nNgay) + .08 * Math.min(3, h.nCauLaDung), .65, 1.8)
  const nuaDoi = kep(Math.pow(2, Math.max(0, h.nNgay - 1)) * chatLuong, 1, 45)
  return kep(h.p * Math.pow(2, -d / nuaDoi), .02, .99)
}

export interface ChiTietQuyetDinhV2 {
  qid: string
  diemCu: number
  diemMoi: number
  msKyVong: number
  doTin: number
  nguyCoQuen: number
  sanSangTienQuyet: number
  thuongMoKhoa: number
}

/** Chi tiết giải thích được của một câu; mọi hệ số đều bị kẹp để dữ liệu mỏng không tạo bước nhảy lớn. */
export function chamCauQuyetDinhV2(
  hs: HoSoOmniEm,
  cau: QCau,
  homNay: string,
  betaLn?: number | null,
  ts: ThamSoOmni = THAM_SO_OMNI,
): ChiTietQuyetDinhV2 {
  const diemCu = trongSoCau(hs, cau, hs.sEm, ts)
  const vkn = vknCaCau(cau)
  const hoSo = vkn.map((k) => hs.vkn[k])
  const doTin = hoSo.length ? hoSo.reduce((s, h) => s + doTinVkn(h), 0) / hoSo.length : 0
  const nguyCoQuen = hoSo.length
    ? hoSo.reduce((s, h) => s + Math.max(0, (h?.p ?? ts.P0) - xacSuatConNho(h, homNay, ts.P0)), 0) / hoSo.length
    : 0

  const nen = vkn.map(nhanNen).filter((x): x is string => !!x)
  const tienQuyet = [...new Set(nen.flatMap((n) => TIEN_QUYET_NEN[n] ?? []))]
  const pTienQuyet = tienQuyet.map((n) => xacSuatConNho(hs.vkn[`nen:${n}`], homNay, ts.P0))
  const sanSangTienQuyet = pTienQuyet.length ? Math.min(...pTienQuyet) : 1

  // Câu trực tiếp luyện một nền yếu được cộng điểm theo số kỹ năng phía sau mà nó mở khoá.
  let moKhoa = 0
  for (const n of nen) {
    const p = xacSuatConNho(hs.vkn[`nen:${n}`], homNay, ts.P0)
    const bacRa = Object.values(TIEN_QUYET_NEN).filter((ds) => ds.includes(n)).length
    if (p < .72 && bacRa > 0) moKhoa += (1 - p) * Math.min(3, bacRa) / 3
  }
  const thuongMoKhoa = kep(moKhoa, 0, 1)
  const ms = msKyVong(betaLn, hs.tau, cau.phan, cau.mucDo)
  const heSoThoiGian = kep(60_000 / Math.max(15_000, ms), .6, 1.5)
  const heSoTin = .75 + .25 * doTin
  const heSoOn = 1 + 1.2 * kep(nguyCoQuen, 0, .5)
  const heSoTienQuyet = tienQuyet.length ? .55 + .45 * sanSangTienQuyet : 1
  const heSoMoKhoa = 1 + .45 * thuongMoKhoa
  const heSoKhamPha = 1 + .12 * (1 - doTin)
  const diemMoi = diemCu * heSoThoiGian * heSoTin * heSoOn * heSoTienQuyet * heSoMoKhoa * heSoKhamPha
  return { qid: cau.qid, diemCu, diemMoi, msKyVong: ms, doTin, nguyCoQuen, sanSangTienQuyet, thuongMoKhoa }
}

/** Chấm cả tập một lần; trả cả điểm phục vụ và chi tiết để shadow/đo lường không phải tính lại. */
export function chamTapQuyetDinhV2(
  hs: HoSoOmniEm,
  cau: readonly QCau[],
  homNay: string,
  beta: ReadonlyMap<string, number> = new Map(),
  ts: ThamSoOmni = THAM_SO_OMNI,
): { diem: Record<string, number>; chiTiet: ChiTietQuyetDinhV2[] } {
  const chiTiet = cau.map((c) => chamCauQuyetDinhV2(hs, c, homNay, beta.get(c.qid), ts))
  return { diem: Object.fromEntries(chiTiet.map((x) => [x.qid, x.diemMoi])), chiTiet }
}


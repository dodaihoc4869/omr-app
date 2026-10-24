// XẾP HỌC SINH: Học thật · Cần theo dõi · Đối phó · Không dạy nổi · ĐUỔI (thầy 24/10: «Phải có cả mức ĐUỔI… tính toán mọi thứ đề xuất thông minh nhất»;
// «Chốt build tất cả nhưng chưa đẩy»). Đặc tả docs/DE-XUAT-HOC-THAT-DOI-PHO-2410.md (mục 0, 3, 4b). LÕI THUẦN — không đọc D1 (xem danh-gia-hoc-that-d1.ts).
//
//   Điểm Thật tuần = 100 − Σ phạt (mỗi phạt có trần). Tỉ lệ dùng CẬN DƯỚI WILSON 90% (em ít lượt không bị phạt oan vì vài lần trượt tay).
//   Nhanh mà ĐÚNG («Thuộc») không bao giờ bị phạt — số đo thật: lượt nhanh đúng 85%, cao hơn lượt chậm.
//   Điểm cao/thấp KHÔNG bao giờ là lý do Đối phó: em yếu mà làm thật vẫn là Học thật (trục Tiến bộ đi riêng).
//   Mọi ngưỡng là TẠM — chỉnh theo nhãn mù của thầy (mục 7 đặc tả).

export type BacDanhGia = 1 | 2 | 3 | 4 | 5
export const TEN_BAC: Readonly<Record<BacDanhGia, string>> = { 1: 'Học thật', 2: 'Cần theo dõi', 3: 'Đối phó', 4: 'Không dạy nổi', 5: 'ĐUỔI' }
/** Bậc học sinh / phụ huynh được thấy: CHỈ Học thật / Đối phó (bậc 2 hiện như Học thật, bậc 4–5 hiện như Đối phó). */
export const bacCongKhai = (b: BacDanhGia): 1 | 3 => (b >= 3 ? 3 : 1)

export const NGUONG_DANH_GIA = {
  /** Điểm Thật ≥ 75 ⇒ Học thật · 60–74 ⇒ Cần theo dõi · < 60 ⇒ Đối phó. */
  diemHocThat: 75,
  diemTheoDoi: 60,
  /** Dưới số lượt đo này VÀ dưới số bài thi/KTCN này trong cửa sổ ⇒ chưa đủ dữ liệu. */
  luotToiThieu: 20,
  baiToiThieu: 3,
  /** z của cận dưới Wilson 90% (một phía). */
  zWilson: 1.2816,
  /** Câu lớp đúng ≥ 80% = câu dễ (sai nặng × 1,5) · < 40% = câu khó (sai không tính). */
  deTu: 0.8,
  khoDuoi: 0.4,
  heSoSaiCauDe: 1.5,
  /** So em với chính em: 30% lượt nhanh nhất. Cờ khi đúng < 45% VÀ thấp hơn lượt còn lại của em ≥ 20 điểm %. */
  tiLeNhanNhat: 0.3,
  nhanDungDuoi: 0.45,
  nhanThuaChamTu: 0.2,
  /** Bấm lặp: chuỗi ≥ 6 lượt liền cùng một chữ (Phần I). */
  chuoiLap: 6,
  /** Thuộc mà không hiểu: chênh đúng câu gốc − đúng bản song sinh trừ 20 điểm %; cần ≥ 10 lượt song sinh. */
  chenhThuocTru: 20,
  songSinhToiThieu: 10,
  /** Rời màn khi thi: ≥ 3 lần hoặc ≥ 60 giây mỗi bài. */
  roiManLan: 3,
  roiManGiay: 60,
  /** Lời giải / gợi ý trước khi tự thử: xấu khi ≥ 40% lượt (≥ 20 lượt). */
  goiYXau: 0.4,
  /** Không làm: ≥ 3 ngày liền không làm câu nào trong cửa sổ. */
  ngayLienKhongLam: 3,
} as const

/** Trần từng phạt (đặc tả 4b). */
export const TRAN_PHAT = { nhanMaSai: 30, bamLap: 20, treo: 25, goiY: 10, thuocKhongHieu: 15, thi: 40, boKtcn: 20, vang: 15, khongLam: 15 } as const
export type MaPhat = keyof typeof TRAN_PHAT

/** Cận dưới Wilson một phía của tỉ lệ k/n. n = 0 ⇒ 0. Thuần. */
export function canDuoiWilson(k: number, n: number, z: number = NGUONG_DANH_GIA.zWilson): number {
  if (!(n > 0)) return 0
  const p = Math.min(1, Math.max(0, k / n))
  const z2 = z * z
  return Math.max(0, (p + z2 / (2 * n) - z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / (1 + z2 / n))
}

/** Một lượt làm câu đã xếp Mức làm (lấy từ `mucLamTuDong`). */
export interface LuotDanhGia {
  phan: 'I' | 'II' | 'III' | null
  dung: boolean | null
  /** Mã Mức làm 1–4 (null = chưa có số đo); `thuoc` = nhanh mà đúng. */
  ma: 1 | 2 | 3 | 4 | null
  thuoc?: boolean
  treo?: 'treo' | 'co_tinh' | null
  /** giây / T_đọc riêng (để chọn 30% lượt nhanh nhất của em); null = chưa đo. */
  r: number | null
  /** Tỉ lệ đúng của cả lớp ở câu này trong cửa sổ (null = ít mẫu). */
  pLop: number | null
  /** Chữ em chọn (Phần I) — để bắt chuỗi bấm lặp. */
  chon: string | null
  /** Lượt có dùng gợi ý / xem lời giải trước khi trả lời. */
  coGoiY: boolean
  /** Lượt là bản song sinh của câu từng sai (`raw_json.tc`). */
  songSinh: boolean
  ngay: string
  luc: string
}

export interface DauVaoDanhGia {
  luot: readonly LuotDanhGia[]
  /** Các ngày trong cửa sổ (YYYY-MM-DD, tăng dần) — để đếm ngày liền không làm. */
  ngayCuaSo: readonly string[]
  ktcn: { daNop: number; boHan: number; diem: readonly number[] }
  thi: readonly { roiLan: number; roiGiay: number }[]
  /** Số lần trùng lỗi sai với bạn mà THẦY ĐÃ XÁC NHẬN gian lận trong cửa sổ. */
  gianLanXacNhan: number
  /** Buổi học của lớp em trong cửa sổ / em có mặt / em vắng có phép. null = buổi chưa gắn lớp (không tính vắng). */
  buoi: { tong: number; coMat: number; coPhep: number } | null
}

export interface PhatDanhGia {
  ma: MaPhat
  diem: number
  /** Lý do bằng số cho thầy (và em nếu công khai). */
  chu: string
  /** Tín hiệu XẤU (đặc tả mục 4: có ≥ 1 tín hiệu xấu ⇒ Đối phó dù Điểm Thật còn ≥ 60). */
  xau?: boolean
  /** Cờ đỏ nặng (gian lận xác nhận, cố tình treo ≥ 2 ngày) — cũng ⇒ Đối phó, và tính vào đường tắt ĐUỔI. */
  coDo?: boolean
}

export interface KetQuaDanhGia {
  duDuLieu: boolean
  diem: number
  /** Bậc của RIÊNG tuần này (1–3) trước khi xét lịch sử (bậc 4–5 do `bacTheoLichSu`). */
  bacTuan: 1 | 2 | 3
  phat: PhatDanhGia[]
  coDo: boolean
  soLieu: {
    soLuot: number
    soDo: number
    soThuoc: number
    soBamVoi: number
    soTreo: number
    soCoTinh: number
    ngayCoTinh: number
    nhanDung: number | null
    chamDung: number | null
    dungGoc: number | null
    dungSongSinh: number | null
    boKtcn: number | null
  }
  /** Trục Tiến bộ thật (không dùng để gắn Đối phó). */
  tienBo: { dungBanKhac: number | null; ktcnXuHuong: number | null; nhan: 'dang_tien' | 'dung_yen' | 'di_lui' | 'chua_ro' }
}

const tiLe = (k: number, n: number): number | null => (n > 0 ? k / n : null)
const pt = (x: number) => `${Math.round(x * 100)}%`

/** Điểm Thật + phạt + bậc tuần của MỘT em trong cửa sổ. Thuần. */
export function danhGiaEm(v: DauVaoDanhGia): KetQuaDanhGia {
  const NG = NGUONG_DANH_GIA
  const phat: PhatDanhGia[] = []
  const them = (ma: MaPhat, diem: number, chu: string, coDo = false, xau = false) => {
    const d = Math.min(TRAN_PHAT[ma], Math.max(0, Math.round(diem * 10) / 10))
    if (d > 0 || coDo || xau) phat.push({ ma, diem: d, chu, ...(xau || coDo ? { xau: true } : {}), ...(coDo ? { coDo: true } : {}) })
  }
  const lam = v.luot.filter((l) => l.dung !== null)
  const doLuot = lam.filter((l) => l.ma !== null && !l.treo)
  const treoLuot = lam.filter((l) => l.treo)
  const soCoTinh = treoLuot.filter((l) => l.treo === 'co_tinh').length
  const ngayCoTinh = new Set(treoLuot.filter((l) => l.treo === 'co_tinh').map((l) => l.ngay)).size
  const thuoc = doLuot.filter((l) => l.ma === 1 && l.dung === true)

  // B1 · Nhanh mà sai (Mức 1 = Bấm vội): bỏ sai ở câu khó; sai câu dễ nặng × 1,5.
  let trongSoBam = 0
  for (const l of doLuot) {
    if (l.ma !== 1 || l.dung !== false) continue
    if (l.pLop !== null && l.pLop < NG.khoDuoi) continue
    trongSoBam += l.pLop !== null && l.pLop >= NG.deTu ? NG.heSoSaiCauDe : 1
  }
  const soBamVoi = doLuot.filter((l) => l.ma === 1 && l.dung === false).length
  if (doLuot.length >= NG.luotToiThieu && trongSoBam > 0) {
    const lb = canDuoiWilson(Math.min(trongSoBam, doLuot.length), doLuot.length)
    them('nhanMaSai', 100 * lb, `${soBamVoi}/${doLuot.length} lượt trả lời trước khi đọc xong đề mà sai`, false, lb >= 0.3)
  }
  // B1' · So em với chính em: 30% lượt nhanh nhất (theo giây/T_đọc riêng) đúng < 45% VÀ kém lượt còn lại ≥ 20 điểm %.
  const coR = doLuot.filter((l) => l.r !== null).sort((a, b) => (a.r ?? 0) - (b.r ?? 0))
  let nhanDung: number | null = null, chamDung: number | null = null
  if (coR.length >= NG.luotToiThieu) {
    const k = Math.max(1, Math.floor(coR.length * NG.tiLeNhanNhat))
    const nhan = coR.slice(0, k), cham = coR.slice(k)
    nhanDung = tiLe(nhan.filter((l) => l.dung === true).length, nhan.length)
    chamDung = tiLe(cham.filter((l) => l.dung === true).length, cham.length)
    const caoNhan = 1 - canDuoiWilson(nhan.filter((l) => l.dung !== true).length, nhan.length)
    if (nhanDung !== null && chamDung !== null && caoNhan < NG.nhanDungDuoi && chamDung - nhanDung >= NG.nhanThuaChamTu) {
      them('nhanMaSai', 20, `lượt làm nhanh nhất chỉ đúng ${pt(nhanDung)}, lượt làm chậm đúng ${pt(chamDung)}: tốc độ không đi kèm hiểu bài`, false, true)
    }
  }
  // B2 · Bấm lặp: chuỗi ≥ 6 lượt liền cùng chữ (Phần I, theo thời gian).
  const tn = lam.filter((l) => l.phan === 'I' && l.chon && /^[ABCD]$/.test(l.chon)).sort((a, b) => (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : 0))
  let soChuoi = 0, dai = 0
  for (let i = 0; i < tn.length; i++) {
    dai = i > 0 && tn[i]!.chon === tn[i - 1]!.chon && tn[i]!.ngay === tn[i - 1]!.ngay ? dai + 1 : 1
    if (dai === NG.chuoiLap) soChuoi++
  }
  if (soChuoi) them('bamLap', 10 * soChuoi, `${soChuoi} lần bấm liền ≥ ${NG.chuoiLap} câu cùng một đáp án`, false, soChuoi >= 2)
  // B3 · Treo máy: cận dưới Wilson tỉ lệ treo; +10 mỗi ngày Cố tình treo máy (Mức 6). ≥ 2 ngày Mức 6 ⇒ cờ đỏ.
  const soTreoTong = treoLuot.length
  if (soTreoTong && lam.length) {
    const lb = canDuoiWilson(soTreoTong, doLuot.length + soTreoTong)
    them('treo', 100 * lb + 10 * ngayCoTinh, `${soTreoTong} lượt treo máy${ngayCoTinh ? `, ${ngayCoTinh} ngày cố tình treo máy` : ''}`, ngayCoTinh >= 2, lb >= 0.15)
  }
  // B4 · Xem gợi ý / lời giải trước khi thử.
  const soGoiY = lam.filter((l) => l.coGoiY).length
  if (lam.length >= NG.luotToiThieu && canDuoiWilson(soGoiY, lam.length) >= NG.goiYXau) them('goiY', 10, `${soGoiY}/${lam.length} lượt xem gợi ý trước khi tự làm`, false, true)
  // B5 · Thuộc mà không hiểu: đúng câu gốc − đúng bản song sinh.
  const goc = lam.filter((l) => !l.songSinh), ss = lam.filter((l) => l.songSinh)
  const dungGoc = tiLe(goc.filter((l) => l.dung === true).length, goc.length)
  const dungSongSinh = tiLe(ss.filter((l) => l.dung === true).length, ss.length)
  if (ss.length >= NG.songSinhToiThieu && dungGoc !== null && dungSongSinh !== null) {
    const chenh = Math.round((dungGoc - dungSongSinh) * 100) - NG.chenhThuocTru
    if (chenh > 0) them('thuocKhongHieu', chenh, `đúng câu gốc ${pt(dungGoc)} nhưng bản khác của câu từng sai chỉ đúng ${pt(dungSongSinh)}: thuộc đáp án, chưa hiểu`, false, chenh >= 10)
  }
  // B6–B7 · Thi / KTCN: rời màn; trùng lỗi sai thầy đã xác nhận (cờ đỏ).
  const baiRoi = v.thi.filter((t) => t.roiLan >= NG.roiManLan || t.roiGiay >= NG.roiManGiay).length
  if (baiRoi >= 2) them('thi', 10 * baiRoi, `${baiRoi} bài thi rời màn hình ≥ ${NG.roiManLan} lần hoặc ≥ ${NG.roiManGiay} giây`, false, true)
  if (v.gianLanXacNhan > 0) them('thi', 40 * v.gianLanXacNhan, `${v.gianLanXacNhan} lần thầy xác nhận trùng lỗi sai với bạn khi thi`, true)
  // A1 · Bỏ KTCN.
  const tongKt = v.ktcn.daNop + v.ktcn.boHan
  const boKtcn = tiLe(v.ktcn.boHan, tongKt)
  if (tongKt >= 4 && boKtcn !== null && boKtcn > 0) them('boKtcn', 40 * boKtcn, `bỏ ${v.ktcn.boHan}/${tongKt} bài kiểm tra cá nhân`, false, boKtcn >= 0.5)
  // A3 · Vắng không phép (chỉ khi buổi đã gắn lớp).
  if (v.buoi && v.buoi.tong > 0) {
    const khongPhep = Math.max(0, v.buoi.tong - v.buoi.coMat - v.buoi.coPhep)
    if (khongPhep > 0) them('vang', 30 * (khongPhep / v.buoi.tong), `vắng không phép ${khongPhep}/${v.buoi.tong} buổi`)
  }
  // A2 · Không làm: ngày liền dài nhất không làm câu nào trong cửa sổ.
  const coLam = new Set(lam.map((l) => l.ngay))
  let lien = 0, lienMax = 0
  for (const n of v.ngayCuaSo) { lien = coLam.has(n) ? 0 : lien + 1; lienMax = Math.max(lienMax, lien) }
  if (lienMax >= NG.ngayLienKhongLam) them('khongLam', 5 * lienMax, `${lienMax} ngày liền không làm câu nào`, false, true)

  const tong = phat.reduce((s, p) => s + p.diem, 0)
  const diem = Math.max(0, Math.round((100 - tong) * 10) / 10)
  const coDo = phat.some((p) => p.coDo)
  const xau = phat.some((p) => p.xau)
  const duDuLieu = doLuot.length + treoLuot.length >= NG.luotToiThieu || v.thi.length + tongKt >= NG.baiToiThieu
  const bacTuan: 1 | 2 | 3 = xau || diem < NG.diemTheoDoi ? 3 : diem < NG.diemHocThat ? 2 : 1

  // Tiến bộ thật: đúng bản khác của câu từng sai; xu hướng điểm KTCN (nửa sau − nửa đầu).
  const d = v.ktcn.diem
  const ktcnXuHuong = d.length >= 4 ? Math.round((tb(d.slice(Math.floor(d.length / 2))) - tb(d.slice(0, Math.floor(d.length / 2)))) * 10) / 10 : null
  const nhan = dungSongSinh === null && ktcnXuHuong === null ? 'chua_ro' : (ktcnXuHuong ?? 0) >= 0.5 || (dungSongSinh ?? 0) >= 0.6 ? 'dang_tien' : (ktcnXuHuong ?? 0) <= -0.5 ? 'di_lui' : 'dung_yen'

  return {
    duDuLieu,
    diem,
    // Chưa đủ dữ liệu ⇒ chỉ cờ đỏ nặng (gian lận / cố tình treo) mới gắn Đối phó; «không làm» vẫn tính (không làm thì làm gì có lượt).
    bacTuan: duDuLieu ? bacTuan : coDo || phat.some((p) => p.ma === 'khongLam' || p.ma === 'boKtcn') ? (bacTuan === 1 ? 2 : bacTuan) : 1,
    phat,
    coDo,
    soLieu: { soLuot: lam.length, soDo: doLuot.length, soThuoc: thuoc.length, soBamVoi, soTreo: soTreoTong - soCoTinh, soCoTinh, ngayCoTinh, nhanDung, chamDung, dungGoc, dungSongSinh, boKtcn },
    tienBo: { dungBanKhac: dungSongSinh, ktcnXuHuong, nhan },
  }
}
const tb = (xs: readonly number[]): number => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0)

// ───────────────────────── THANG 5 BẬC THEO LỊCH SỬ ─────────────────────────

export type LoaiCanThiep = 'nhac_em' | 'bao_ph' | 'thay_goi_ph' | 'cam_ket' | 'xac_nhan_nghi' | 'cho_them' | 'gian_lan_xac_nhan'
export interface CanThiep {
  loai: LoaiCanThiep
  /** ISO lúc gửi / ghi. */
  luc: string
  emXem?: string | null
  phXem?: string | null
}
export interface TuanDaTinh {
  /** Thứ Hai đầu tuần (YYYY-MM-DD). */
  tuan: string
  diem: number
  bacTuan: 1 | 2 | 3
  bac: BacDanhGia
  coDo: boolean
  /** Cờ đỏ nặng của tuần: Mức 6 ≥ 1 ngày · gian lận xác nhận · bỏ ≥ 75% KTCN và vắng không phép ≥ 50%. */
  coDoNang?: { coTinh: boolean; gianLan: number; boVaVang: boolean }
}

export const LUAT_BAC = {
  /** Không dạy nổi: Đối phó ≥ 3 trong 4 tuần gần nhất. */
  tuanDoiPho: 3,
  cuaSoTuan: 4,
  /** ≥ 2 lần can thiệp EM (hoặc PH) đã xem. */
  canThiepDaXem: 2,
  /** Sau mỗi can thiệp 7 ngày Điểm Thật không tăng ≥ 10. */
  tangSauCanThiep: 10,
  /** Tiến bộ thật coi như không có khi đúng bản khác < 40% và KTCN không tăng. */
  dungBanKhacDuoi: 0.4,
  /** Cam kết 14 ngày. */
  ngayCamKet: 14,
  /** Thoát bậc: 2 tuần liền Điểm Thật ≥ 75. */
  tuanThoat: 2,
} as const

export interface KetLuanBac {
  bac: BacDanhGia
  lyDo: string[]
  /** Việc máy đề nghị / tự làm (chỉ khi công tắc «bật»). */
  viec: 'nhac_em' | 'bao_ph' | 'goi_ph_mo_cam_ket' | 'xac_nhan_nghi' | null
  /** Bằng chứng cho hồ sơ ĐUỔI / Không dạy nổi. */
  bangChung?: { tuan: string; diem: number; bac: BacDanhGia }[]
}

const cachNgay = (a: string, b: string): number => (Date.parse(b) - Date.parse(a)) / 86_400_000

/**
 * Bậc của tuần hiện tại từ: kết quả tuần này, các tuần trước (mới → cũ), nhật ký can thiệp, tiến bộ thật. Thuần.
 * Bậc chỉ đi LÊN theo luật; đi XUỐNG một bậc khi 2 tuần liền Điểm Thật ≥ 75 (không nhảy thẳng từ ĐUỔI về Học thật).
 */
export function bacTheoLichSu(tuanNay: TuanDaTinh, truoc: readonly TuanDaTinh[], canThiep: readonly CanThiep[], tienBo: KetQuaDanhGia['tienBo'], nowIso: string): KetLuanBac {
  const L = LUAT_BAC
  const bacTruoc: BacDanhGia = truoc[0]?.bac ?? 1
  const bon = [tuanNay, ...truoc].slice(0, L.cuaSoTuan)
  const soDoiPho = bon.filter((t) => t.bacTuan === 3).length
  const bangChung = bon.map((t) => ({ tuan: t.tuan, diem: t.diem, bac: t.bac }))
  const daXem = canThiep.filter((c) => (c.loai === 'nhac_em' || c.loai === 'bao_ph' || c.loai === 'thay_goi_ph') && (c.emXem || c.phXem || c.loai === 'thay_goi_ph'))
  // Can thiệp không hiệu quả: 7 ngày sau lần ấy, Điểm Thật tuần kế không tăng ≥ 10 so với tuần của lần ấy.
  const theoTuan = [...bon].reverse()
  const khongHieuQua = daXem.filter((c) => {
    const truocCt = [...theoTuan].reverse().find((t) => t.tuan <= c.luc.slice(0, 10))
    const sauCt = theoTuan.find((t) => cachNgay(c.luc, t.tuan) >= 6)
    return truocCt && sauCt && sauCt.diem - truocCt.diem < L.tangSauCanThiep
  }).length
  const khongTienBo = (tienBo.dungBanKhac === null || tienBo.dungBanKhac < L.dungBanKhacDuoi) && (tienBo.ktcnXuHuong === null || tienBo.ktcnXuHuong <= 0)
  const nang = bon.map((t) => t.coDoNang).filter(Boolean)
  const tuanCoTinh = nang.filter((n) => n!.coTinh).length
  const gianLan = nang.reduce((s, n) => s + (n!.gianLan || 0), 0)
  const boVaVangDu = bon.length >= L.cuaSoTuan && nang.length >= L.cuaSoTuan && nang.every((n) => n!.boVaVang)
  const camKet = [...canThiep].filter((c) => c.loai === 'cam_ket').sort((a, b) => (a.luc < b.luc ? 1 : -1))[0]
  const choThem = [...canThiep].filter((c) => c.loai === 'cho_them').sort((a, b) => (a.luc < b.luc ? 1 : -1))[0]

  // Đi xuống: 2 tuần liền ≥ 75 ⇒ hạ một bậc so với tuần trước.
  const haiTuanTot = [tuanNay, truoc[0]].filter(Boolean).length === L.tuanThoat && [tuanNay, truoc[0]].every((t) => t!.diem >= NGUONG_DANH_GIA.diemHocThat && !t!.coDo)

  // Sàn bậc: bậc đã lên thì GIỮ cho tới khi 2 tuần liền Điểm Thật ≥ 75 (khi ấy hạ MỘT bậc). Thầy bấm «Cho thêm 2 tuần» ⇒ trần 4 trong 14 ngày.
  const dangChoThem = !!choThem && cachNgay(choThem.luc, nowIso) < L.ngayCamKet
  const san: BacDanhGia = bacTruoc >= 3 ? ((haiTuanTot ? bacTruoc - 1 : bacTruoc) as BacDanhGia) : 1
  const ket = (bac: BacDanhGia, lyDo: string[], viec: KetLuanBac['viec'], coBangChung = false): KetLuanBac => {
    let b = Math.max(bac, san) as BacDanhGia
    if (dangChoThem && b === 5) b = 4
    const v = b === 5 ? 'xac_nhan_nghi' : b === 4 ? (camKet ? null : 'goi_ph_mo_cam_ket') : viec
    const ly = b > bac && !lyDo.length ? [b === 5 ? 'đã ở mức ĐUỔI, chưa đủ 2 tuần liền Điểm Thật ≥ 75 để hạ bậc' : `chưa đủ ${L.tuanThoat} tuần liền Điểm Thật ≥ 75 để hạ bậc`] : lyDo
    return { bac: b, lyDo: ly, viec: v, ...(coBangChung || b >= 4 ? { bangChung } : {}) }
  }

  // ĐƯỜNG TẮT ĐUỔI (cờ đỏ nặng).
  const tat: string[] = []
  if (gianLan >= 2) tat.push(`${gianLan} lần gian lận thi đã xác nhận trong ${L.cuaSoTuan} tuần`)
  if (tuanCoTinh >= 3) tat.push(`cố tình treo máy ở ${tuanCoTinh}/${L.cuaSoTuan} tuần`)
  if (boVaVangDu) tat.push(`bỏ ≥ 75% kiểm tra cá nhân và vắng không phép ≥ 50% suốt ${L.cuaSoTuan} tuần`)
  if (tat.length) return ket(5, tat, 'xac_nhan_nghi', true)

  // ĐƯỜNG THƯỜNG ĐUỔI: đang Không dạy nổi, cam kết đã qua 14 ngày, Điểm Thật TB từ lúc cam kết < 60 hoặc thấp hơn trước cam kết.
  if (bacTruoc >= 4 && camKet && cachNgay(camKet.luc, nowIso) >= L.ngayCamKet && !(choThem && choThem.luc > camKet.luc)) {
    const sau = bon.filter((t) => t.tuan >= camKet.luc.slice(0, 10))
    const truocCk = bon.filter((t) => t.tuan < camKet.luc.slice(0, 10))
    const tbSau = sau.length ? tb(sau.map((t) => t.diem)) : tuanNay.diem
    const tbTruoc = truocCk.length ? tb(truocCk.map((t) => t.diem)) : null
    if (tbSau < NGUONG_DANH_GIA.diemTheoDoi || (tbTruoc !== null && tbSau < tbTruoc)) {
      return ket(5, [`hết ${L.ngayCamKet} ngày cam kết, Điểm Thật trung bình ${Math.round(tbSau)}${tbTruoc !== null ? ` (trước cam kết ${Math.round(tbTruoc)})` : ''}`], 'xac_nhan_nghi', true)
    }
  }

  // KHÔNG DẠY NỔI.
  if (soDoiPho >= L.tuanDoiPho && daXem.length >= L.canThiepDaXem && khongHieuQua >= L.canThiepDaXem && khongTienBo) {
    return ket(4, [`Đối phó ${soDoiPho}/${L.cuaSoTuan} tuần`, `đã nhắc ${daXem.length} lần (em/phụ huynh đã xem) mà không khá lên`, 'không có tiến bộ thật (bản khác của câu từng sai, kiểm tra cá nhân)'], 'goi_ph_mo_cam_ket', true)
  }

  // ĐỐI PHÓ / CẦN THEO DÕI / HỌC THẬT.
  if (tuanNay.bacTuan === 3) return ket(3, [], truoc[0]?.bacTuan === 3 ? 'bao_ph' : 'nhac_em')
  return ket(tuanNay.bacTuan, [], null)
}

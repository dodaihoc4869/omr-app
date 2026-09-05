// TÁM KÊNH ĐO DẤU VẾT CHỤP MÀN HÌNH — BAOMATCATHI.md mục 1.
//
// ĐỢT 0: file này chỉ ĐO và GHI NHẬT KÝ. Không khoá ai, không nối vào màn thi.
// Ngưỡng để khoá còn để trống, điền sau khi thầy đo trên máy thật (mục 2).
//
// VÌ SAO KHÔNG ĐI ĐƯỜNG "NHÌN THẤY ẢNH NHỎ": trang web chỉ đọc được thứ trong
// khung của nó; ảnh nhỏ vừa chụp do hệ điều hành vẽ đè lên trên, cùng tầng với
// thanh pin. Không API nào mở tầng đó ra — mà nếu có thì mọi trang web đều đọc
// lén được app ngân hàng bên cạnh. Nên đo bằng DẤU VẾT VẬT LÝ của việc chụp.
//
// Kênh 8 là chìa khoá cho iPhone: chụp màn hình phải bấm Nguồn + Tăng âm lượng
// cùng lúc, hai nút ở HAI CẠNH ĐỐI DIỆN — tay phải bóp máy, tạo xung xoắn rất
// ngắn quanh trục dọc. Nó không quan tâm màn hình đang hiện gì, nên em đổi sang
// chế độ ảnh nhỏ ở góc cũng không tránh được.

export type MaKenh = 'an_trang' | 'tieu_diem' | 'toan_man' | 'kich_thuoc' | 'nhip_ve' | 'lech_dong_ho' | 'phim_chup' | 'xung_chuyen_dong'

export const TEN_KENH: Record<MaKenh, string> = {
  an_trang: 'Ẩn trang',
  tieu_diem: 'Tiêu điểm',
  toan_man: 'Toàn màn hình',
  kich_thuoc: 'Kích thước',
  nhip_ve: 'Nhịp vẽ khung',
  lech_dong_ho: 'Lệch đồng hồ',
  phim_chup: 'Phím chụp',
  xung_chuyen_dong: 'Xung chuyển động',
}

/** Số hiệu kênh trong đặc tả — để nhật ký ghi "K8" cho thầy đối chiếu. */
export const SO_KENH: Record<MaKenh, number> = {
  an_trang: 1,
  tieu_diem: 2,
  toan_man: 3,
  kich_thuoc: 4,
  nhip_ve: 5,
  lech_dong_ho: 6,
  phim_chup: 7,
  xung_chuyen_dong: 8,
}

// ------------------------------------------------- MỘT NGUỒN SỰ THẬT CẤU HÌNH
// Mục 5 của đặc tả. Cấm rải số vào màn hình.

/** Cửa sổ gộp phiếu nhiều kênh: các kênh đo những mặt khác nhau của CÙNG một sự
 * kiện (tay bóp máy · lớp phủ dựng lên · trang ngừng được vẽ) nên cả ba rơi vào
 * khoảng một phần ba giây. */
export const MS_TRUNG_KHOP = 300

/** Chờ `hidden` báo trễ của iOS trước khi kết luận là cửa sổ nổi. Bỏ nhịp chờ
 * này là mọi cuộc gọi đến thành khoá ngay. */
export const MS_XAC_NHAN_CUA_SO_NOI = 900

/** Giữ đủ lâu mới coi là thu nhỏ màn: bàn phím ảo trên vài máy đổi cả layout
 * viewport trong ~300 ms rồi trả lại. */
export const MS_XAC_NHAN_CO_MAN = 600

/** Cửa sổ nổi không bắn `resize`, nên phải tự nhịp kiểm. */
export const MS_NHIP_KIEM_CO_MAN = 1000

/** Ba giây đầu sau khi vào bài không bao giờ khoá: lúc xin toàn màn hình trình
 * duyệt hay bắn `blur` giả. */
export const MS_AN_HAN_VAO_BAI = 3000

/** Tỉ lệ diện tích còn lại so với mốc thì coi là thu nhỏ. Cần hiệu chỉnh bằng
 * Đợt 0 việc 5 (gõ đáp án — bàn phím ảo). */
export const TI_LE_CO_MAN = 0.72

// ---------------------------------------------------------- NGƯỠNG CHỜ ĐO
// CẤM chốt bằng suy đoán (mục 12). Còn `null` nghĩa là kênh đó CHƯA ĐƯỢC PHÉP
// khoá — `kenhDuocKhoaMotMinh` bên dưới đọc đúng chỗ này.

export const MS_RAF_NGHI: number | null = null
export const MS_LECH_DONG_HO: number | null = null

export interface NguongXung {
  /** rad/s — biên độ xoắn quanh trục dọc coi là một nhát bóp. */
  xoan: number
  /** Đỉnh phải kéo dài trong khoảng này rồi tắt; dài hơn là rung, không phải bóp. */
  msMin: number
  msMax: number
  /** Gia tốc vuông góc mặt màn (z) so với biên độ xoắn. Gõ ngón tay vào màn cho
   * z trội; bóp cạnh máy cho xoắn trội. Vượt tỉ lệ này ⇒ coi là gõ, không khớp. */
  tiLeZToiDa: number
}

export const NGUONG_XUNG: NguongXung | null = null

// -------------------------------------------------------- NGƯỠNG ĐỂ QUAN SÁT
// Khác hẳn ngưỡng để khoá: đây chỉ là mức tối thiểu để một tín hiệu được GHI VÀO
// NHẬT KÝ ở trang /do. Đặt rộng tay để thầy nhìn thấy cả những nhát yếu rồi mới
// chốt ngưỡng thật. KHÔNG BAO GIỜ dùng mấy số này để khoá.

export const MS_RAF_QUAN_SAT = 150
export const MS_LECH_QUAN_SAT = 120
export const NGUONG_XUNG_QUAN_SAT: NguongXung = { xoan: 1.2, msMin: 40, msMax: 200, tiLeZToiDa: 1 }

/** Cửa sổ trượt giữ mẫu chuyển động trong bộ nhớ. Không lưu đĩa, không gửi đi. */
export const MS_CUA_SO_CHUYEN_DONG = 2000

/** Khoảng lặng quanh một xung: 2 giây trước đó không có xung tương tự. Đặt máy
 * xuống bàn, đi lại, xe chạy đều cho chuỗi xung liên tiếp, không phải một nhát. */
export const MS_XUNG_DUNG_MOT_MINH = 2000

/** Không có chạm màn trong khoảng này trước và sau xung — em đang bấm nút cứng
 * thì không đồng thời quẹt màn hình. */
export const MS_TRANH_CHAM_MAN = 200

// ------------------------------------------------------------------ PHIẾU
/** Một lần một kênh báo. `luc` tính bằng `performance.now()`. */
export interface PhieuKenh {
  kenh: MaKenh
  luc: number
  /** Câu tả bằng số để thầy đọc nhật ký hiểu ngay, vd "gap 480 ms". */
  chiTiet: string
}

/** Nhóm phiếu rơi vào cùng một cửa sổ trùng khớp, tính từ phiếu đầu nhóm. */
export function gomPhieuTrungKhop(ds: PhieuKenh[], ms: number = MS_TRUNG_KHOP): PhieuKenh[][] {
  const xep = [...ds].sort((a, b) => a.luc - b.luc)
  const nhom: PhieuKenh[][] = []
  for (const p of xep) {
    const cuoi = nhom[nhom.length - 1]
    if (cuoi && p.luc - cuoi[0].luc <= ms) cuoi.push(p)
    else nhom.push([p])
  }
  return nhom
}

/** Số kênh KHÁC NHAU trong một nhóm. Cùng một kênh báo hai lần không thành hai
 * phiếu: hai mặt của một sự kiện mới là bằng chứng, một mặt lặp lại thì không. */
export function soKenhKhacNhau(nhom: PhieuKenh[]): number {
  return new Set(nhom.map((p) => p.kenh)).size
}

export interface KetLuanTrungKhop {
  /** Nhóm có từ 2 kênh khác nhau trở lên — đủ để khoá theo luật 1.2. */
  duKhoa: PhieuKenh[][]
  /** Phiếu đơn lẻ: ghi nhật ký + nhãn vàng cho thầy, KHÔNG khoá. */
  donLe: PhieuKenh[]
}

/** LUẬT 1.2 — chính xác nhờ trùng khớp, không nhờ nhạy.
 *
 * Một kênh nhạy quá thì khoá oan; nhiều kênh cùng chỉ về một thời điểm thì vừa
 * nhạy vừa chắc. Đây là chỗ chữ "chính xác" của thầy được thi hành. */
export function xetTrungKhop(ds: PhieuKenh[], ms: number = MS_TRUNG_KHOP): KetLuanTrungKhop {
  const nhom = gomPhieuTrungKhop(ds, ms)
  return {
    duKhoa: nhom.filter((n) => soKenhKhacNhau(n) >= 2),
    donLe: nhom.filter((n) => soKenhKhacNhau(n) < 2).flat(),
  }
}

/** Kênh này đã được phép KHOÁ MỘT MÌNH chưa.
 *
 * Kênh 3 và 4 là số đo trực tiếp, một mình đủ. Kênh 7 trên máy tính cũng vậy.
 * Năm kênh còn lại là dấu vết chụp — chỉ được nâng lên khoá một mình sau khi
 * Đợt 0 chứng minh đạt chuẩn 2.2 (≥ 9/10 bắt đúng, 0 báo nhầm), và lúc đó ngưỡng
 * tương ứng mới thôi là `null`. Chưa đo thì hàm này trả false, nên không có
 * đường nào bật khoá bằng suy đoán. */
export function kenhDuocKhoaMotMinh(kenh: MaKenh): boolean {
  if (kenh === 'toan_man' || kenh === 'kich_thuoc' || kenh === 'phim_chup') return true
  if (kenh === 'nhip_ve') return MS_RAF_NGHI !== null
  if (kenh === 'lech_dong_ho') return MS_LECH_DONG_HO !== null
  if (kenh === 'xung_chuyen_dong') return NGUONG_XUNG !== null
  return false
}

// -------------------------------------------- KÊNH 8: NHẬN DẠNG XUNG BÓP MÁY

/** Một mẫu đọc từ gia tốc kế, đã rút gọn còn hai số cần dùng. */
export interface MauChuyenDong {
  luc: number
  /** Biên độ xoắn quanh trục dọc, rad/s — lấy từ `rotationRate` alpha/gamma. */
  xoan: number
  /** Gia tốc vuông góc mặt màn hình, m/s² — `accelerationIncludingGravity.z`
   * đã trừ trọng trường. */
  z: number
}

export interface XungKhop {
  batDau: number
  ketThuc: number
  /** Đỉnh xoắn của xung, để nhật ký ghi con số thật. */
  dinhXoan: number
  dinhZ: number
}

export interface LyDoLoaiXung {
  batDau: number
  keoDaiMs: number
  dinhXoan: number
  dinhZ: number
  /** Vì sao KHÔNG khớp — nhật ký phải nói rõ, không im lặng bỏ qua. */
  lyDo: 'ngan_qua' | 'dai_qua' | 'z_troi' | 'co_cham_man' | 'khong_dung_mot_minh'
}

export interface KetQuaNhanDang {
  khop: XungKhop[]
  loai: LyDoLoaiXung[]
}

/** Gom các mẫu liên tiếp vượt ngưỡng xoắn thành từng đỉnh. */
function tachDinh(mau: MauChuyenDong[], nguongXoan: number): { batDau: number; ketThuc: number; dinhXoan: number; dinhZ: number }[] {
  const ra: { batDau: number; ketThuc: number; dinhXoan: number; dinhZ: number }[] = []
  let dang: { batDau: number; ketThuc: number; dinhXoan: number; dinhZ: number } | null = null
  for (const m of mau) {
    if (Math.abs(m.xoan) >= nguongXoan) {
      if (!dang) dang = { batDau: m.luc, ketThuc: m.luc, dinhXoan: Math.abs(m.xoan), dinhZ: Math.abs(m.z) }
      else {
        dang.ketThuc = m.luc
        dang.dinhXoan = Math.max(dang.dinhXoan, Math.abs(m.xoan))
        dang.dinhZ = Math.max(dang.dinhZ, Math.abs(m.z))
      }
    } else if (dang) {
      ra.push(dang)
      dang = null
    }
  }
  if (dang) ra.push(dang)
  return ra
}

/**
 * NHẬN DẠNG XUNG BÓP HAI NÚT CỨNG.
 *
 * Bốn điều kiện, thiếu một là loại — và loại vì lý do gì thì ghi ra, để bảng
 * tổng kết Đợt 0 nói được "báo nhầm ở đâu" chứ không chỉ đếm số:
 *
 *   1. NGẮN — đỉnh kéo dài trong `[msMin, msMax]` rồi tắt, không phải rung dài.
 *   2. XOẮN, KHÔNG PHẢI GÕ — z không được trội hơn xoắn quá `tiLeZToiDa`.
 *   3. KHÔNG ĐI KÈM CHẠM MÀN — không `touchstart`/`touchmove` trong 200 ms
 *      trước và sau.
 *   4. ĐỨNG MỘT MÌNH — 2 giây trước đó không có đỉnh tương tự.
 */
export function nhanDangXungBop(mau: MauChuyenDong[], mocChamMan: number[], nguong: NguongXung): KetQuaNhanDang {
  const khop: XungKhop[] = []
  const loai: LyDoLoaiXung[] = []
  const dinh = tachDinh(mau, nguong.xoan)

  dinh.forEach((d, i) => {
    const keoDai = d.ketThuc - d.batDau
    const ghiLoai = (lyDo: LyDoLoaiXung['lyDo']) => loai.push({ batDau: d.batDau, keoDaiMs: keoDai, dinhXoan: d.dinhXoan, dinhZ: d.dinhZ, lyDo })

    if (keoDai < nguong.msMin) return ghiLoai('ngan_qua')
    if (keoDai > nguong.msMax) return ghiLoai('dai_qua')
    if (d.dinhZ > d.dinhXoan * nguong.tiLeZToiDa) return ghiLoai('z_troi')
    if (mocChamMan.some((t) => t >= d.batDau - MS_TRANH_CHAM_MAN && t <= d.ketThuc + MS_TRANH_CHAM_MAN)) return ghiLoai('co_cham_man')
    const truoc = dinh[i - 1]
    if (truoc && d.batDau - truoc.ketThuc < MS_XUNG_DUNG_MOT_MINH) return ghiLoai('khong_dung_mot_minh')

    khop.push({ batDau: d.batDau, ketThuc: d.ketThuc, dinhXoan: d.dinhXoan, dinhZ: d.dinhZ })
  })

  return { khop, loai }
}

// ------------------------------------------ PHÂN LOẠI MỘT LẦN "RA KHỎI MÀN"
// Mục 4.1. Chuyển app bắn CẢ `blur` LẪN `hidden`; Android thường bắn `blur`
// trước, iOS báo `hidden` trễ. Kết luận ngay lúc `blur` là mọi cuộc gọi đến
// thành cửa sổ nổi → khoá ngay, phá sạch luật rời app đang chạy tốt.

export type KetLuanRaMan =
  /** Về trước 400 ms — góp một phiếu cho dấu vết chụp, không tự khoá. */
  | 've_som'
  /** Vẫn ở ngoài sau 900 ms mà chưa hề thấy `hidden` ⇒ có cửa sổ đè lên. */
  | 'cua_so_noi'
  /** Có `hidden` và ở ngoài ≥ 400 ms ⇒ rời app, đi theo luật cũ. */
  | 'roi_app'
  /** Chưa đủ dữ kiện — vẫn đang chờ nhịp 900 ms. */
  | 'chua_ket_luan'

/** Về trong khoảng này thì coi là "ra rồi về ngay", một dấu vết chụp. */
export const MS_VE_SOM = 400

export function phanLoaiRaMan(sk: { tRa: number; tVe: number | null; tHidden: number | null; tBayGio: number }): KetLuanRaMan {
  const raNgoai = (sk.tVe ?? sk.tBayGio) - sk.tRa
  if (sk.tVe !== null && raNgoai < MS_VE_SOM) return 've_som'
  if (sk.tHidden !== null && raNgoai >= MS_VE_SOM) return 'roi_app'
  if (sk.tHidden === null && sk.tVe === null && sk.tBayGio - sk.tRa >= MS_XAC_NHAN_CUA_SO_NOI) return 'cua_so_noi'
  if (sk.tHidden === null && sk.tVe !== null && raNgoai >= MS_XAC_NHAN_CUA_SO_NOI) return 'cua_so_noi'
  return 'chua_ket_luan'
}

// ------------------------------------------------------------ BẢNG TỔNG KẾT
// Mục 2.2: một kênh chỉ được khoá một mình khi bắt đúng ≥ 9/10 và 0 báo nhầm.

export const BAT_DUNG_TOI_THIEU = 9
export const LAN_THU_CHUAN = 10
/** Bắt dưới mức này thì kênh đó không góp được phiếu nào — tắt hẳn. */
export const BAT_DUNG_TOI_THIEU_DE_GOP = 3

export interface DiemKenh {
  kenh: MaKenh
  /** Số lần bắt đúng trong các lần thầy chụp thử. */
  batDung: number
  soLanThu: number
  /** Số lần báo khi thầy KHÔNG chụp — bài đo nhiễu. */
  baoNham: number
}

export type XepLoaiKenh = 'khoa_mot_minh' | 'gop_phieu' | 'tat_han'

/** CHẤM ĐIỂM CÁI MÁY, không phải chấm học sinh.
 *
 * 9/10 ở đây là điểm đậu của kênh đo trong bài thử của thầy. Học sinh trong ca
 * thi vẫn là MỘT LẦN LÀ KHOÁ, không có ngưỡng đếm nào. */
export function xepLoaiKenh(d: DiemKenh): XepLoaiKenh {
  if (d.baoNham === 0 && d.batDung >= BAT_DUNG_TOI_THIEU && d.soLanThu >= LAN_THU_CHUAN) return 'khoa_mot_minh'
  if (d.batDung >= BAT_DUNG_TOI_THIEU_DE_GOP) return 'gop_phieu'
  return 'tat_han'
}

export const TEN_XEP_LOAI: Record<XepLoaiKenh, string> = {
  khoa_mot_minh: 'đủ chuẩn khoá một mình',
  gop_phieu: 'chỉ góp phiếu',
  tat_han: 'tắt hẳn',
}

/** Một dòng nhật ký ở trang /do — đủ số để thầy đọc là biết chuyện gì xảy ra. */
export interface DongNhatKy {
  luc: number
  kenh: MaKenh | null
  chiTiet: string
  /** Bối cảnh lúc đó: đang chạm màn không, trang còn hiện không, cỡ cửa sổ. */
  boiCanh: string
}

/** Dòng chữ của một nhật ký để chép hoặc tải .txt. */
export function vanBanNhatKy(ds: DongNhatKy[], moc: number): string {
  return ds
    .map((d) => {
      const t = `+${Math.round(d.luc - moc)} ms`
      const k = d.kenh ? `K${SO_KENH[d.kenh]} ${TEN_KENH[d.kenh]}` : '—'
      return `${t} · ${k} · ${d.chiTiet} · ${d.boiCanh}`
    })
    .join('\n')
}

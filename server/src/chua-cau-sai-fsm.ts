// FSM DẠY — vòng chữa câu sai (đặc tả §7, §5.5–5.6, 07/10/2026).
// Quản lý chuyển trạng thái `TrangThaiDay` cho MỘT đợt lỗi (chua_loi_dot).
// KHÔNG đọc D1 trực tiếp — nhận tham số từ route handler.
import type {
  TrangThaiDay, LoaiItem, BuocChua, HocLieuChua, BuocTienDo,
  TrangThaiBuoc, ItemCongKhai, PhanHoiItem, CauHinhChuaCauSai,
} from './chua-cau-sai-kieu'

// ---------------------------------------------------------------------------
// Trạng thái nội bộ của một phiên (in-memory, không persist riêng)
// ---------------------------------------------------------------------------
export interface TrangThaiPhien {
  trangThai: TrangThaiDay
  buocDangXuLy: number   // 0-based, -1 = chưa chẩn đoán xong
  buocDaQua: Set<number>
  soVongHoTro: number    // đếm qua các vòng muc 1-2-3 của bước hiện tại
  soHoTroBuocHienTai: number
}

// ---------------------------------------------------------------------------
// §5.5 — Sáu thành phần hiểu bước (chỉ ghi nhãn logic; UI ở PhaseC)
// ---------------------------------------------------------------------------
export type BuocHieu =
  | 'nhan_cach_nghi'     // (1) Nhận đúng cách em nghĩ
  | 'tim_diem_re'        // (2) Tìm điểm rẽ
  | 'thay_vi_sao'        // (3) Thấy vì sao
  | 'tu_sua_quan_he'     // (4) Tự sửa quan hệ
  | 'dung_vao_bai_moi'   // (5) Dùng vào bài mới
  | 'noi_lai_bai_lon'    // (6) Nối lại bài lớn

/** Danh sách sáu thành phần theo thứ tự. */
export const SAU_THANH_PHAN: readonly BuocHieu[] = [
  'nhan_cach_nghi', 'tim_diem_re', 'thay_vi_sao',
  'tu_sua_quan_he', 'dung_vao_bai_moi', 'noi_lai_bai_lon',
]

// ---------------------------------------------------------------------------
// Chọn loại item tiếp theo cho một bước (§5.6 — giảm hỗ trợ dần)
// ---------------------------------------------------------------------------
export function chonLoaiItemTiep(
  buoc: BuocChua,
  tienDo: BuocTienDo,
  cauHinh: CauHinhChuaCauSai,
): LoaiItem | null {
  const soVong = tienDo.soVongHoTro
  const mucHoTro = tienDo.mucHoTroCaoNhat

  // Bước 1: Chẩn đoán — luôn chạy trước
  if (!tienDo.receiptChanDoan) {
    if (buoc.chanDoan.length > 0) return 'chan_doan'
    if (buoc.phanBiet.length > 0) return 'phan_biet'
  }

  // Bước 2: Sau chẩn đoán đúng → kiểm lý do (§5.5 thành phần 1-3)
  if (tienDo.receiptChanDoan && !tienDo.receiptLyDo) {
    if (buoc.hieuBuoc?.kiemLyDo?.length) return 'kiem_ly_do'
  }

  // Bước 3: Sau hiểu lý do → kiểm lại tự làm (§5.5 thành phần 4-5)
  if (tienDo.receiptLyDo && !tienDo.receiptChuyenGiao) {
    if (buoc.kiemLai.length > 0) return 'kiem_lai'
  }

  // Bước 4: Chuyển giao sang bài mới (§5.5 thành phần 5-6)
  if (tienDo.receiptLyDo && buoc.hieuBuoc?.chuyenGiao?.length) {
    return 'chuyen_giao'
  }

  // §5.6 — Giảm hỗ trợ: nếu quá số vòng tối đa mà vẫn chưa qua → chuyển thầy
  if (soVong >= cauHinh.vongHoTroToiDaMoiBuoc && mucHoTro >= 3) {
    return null  // cần thầy
  }

  return null
}

// ---------------------------------------------------------------------------
// Chuyển trạng thái FSM sau khi nộp item
// ---------------------------------------------------------------------------
export interface SuKienNop {
  itemLoai: LoaiItem
  buocSo: number
  dung: boolean
  coHoTro: boolean
  mucHoTro: number
  hocLieu: HocLieuChua
  cauHinh: CauHinhChuaCauSai
}

export function chuyenTrang(
  hien: TrangThaiPhien,
  su: SuKienNop,
): { moi: TrangThaiPhien; loaiBuocTiep: LoaiItem | null; canThay: boolean } {
  let { trangThai, buocDangXuLy, buocDaQua, soVongHoTro, soHoTroBuocHienTai } = hien
  let canThay = false

  switch (trangThai) {
    case 'can_chan_doan': {
      if (su.dung) {
        trangThai = 'dang_chua_buoc'
        buocDangXuLy = su.buocSo
      }
      break
    }
    case 'dang_chua_buoc': {
      if (su.dung && !su.coHoTro) {
        buocDaQua.add(su.buocSo)
        soVongHoTro = 0
        soHoTroBuocHienTai = 0
        // Kiểm xem còn bước chưa qua không
        const conBuoc = su.hocLieu.buoc.some((_, i) => !buocDaQua.has(i))
        if (!conBuoc) {
          trangThai = 'dang_ghep_bai'
        }
      } else if (su.coHoTro) {
        soHoTroBuocHienTai++
        if (soHoTroBuocHienTai > su.cauHinh.vongHoTroToiDaMoiBuoc) {
          canThay = true
          trangThai = 'can_thay'
        }
      }
      break
    }
    case 'dang_ghep_bai': {
      if (su.dung) {
        trangThai = 'cho_gap_lai_2'
      }
      break
    }
    case 'dang_kiem_chung': {
      if (su.dung && !su.coHoTro) {
        trangThai = 'da_tu_sua'
      } else if (su.dung && su.coHoTro) {
        // Đúng nhưng có hỗ trợ → quay lại chữa thêm
        trangThai = 'can_chan_doan'
        buocDaQua = new Set()
        soVongHoTro = 0
      } else {
        // Sai ở kiểm chứng → quay vào chữa lại bước đầu tiên sai
        trangThai = 'can_chan_doan'
        buocDaQua = new Set()
        soVongHoTro = 0
      }
      break
    }
    default:
      break
  }

  return {
    moi: { trangThai, buocDangXuLy, buocDaQua, soVongHoTro, soHoTroBuocHienTai },
    loaiBuocTiep: null,  // route handler tính riêng
    canThay,
  }
}

// ---------------------------------------------------------------------------
// Xây phản hồi cho học sinh (§5.5 — giữ bí mật đáp án)
// ---------------------------------------------------------------------------
export function xayPhanHoi(
  itemId: string,
  dung: boolean,
  itemLoai: LoaiItem,
  buoc: BuocChua | null,
): PhanHoiItem {
  const base: PhanHoiItem = { itemId, dung }
  if (!dung) {
    // Gợi ý "điểm lệch" — KHÔNG lộ đáp án; chỉ nhắc hướng suy nghĩ
    if (buoc?.hieuBuoc?.doiChieu?.[0]) {
      const dc = buoc.hieuBuoc.doiChieu[0]
      base.diemlech = dc.diemLech
      base.giaThiet = dc.cachNghiCu
    }
  } else {
    // Đúng: nối sang thành phần tiếp theo
    if (itemLoai === 'chan_doan') base.hanhDongTiep = 'hieu_buoc'
    if (itemLoai === 'kiem_lai') base.hanhDongTiep = 'chuyen_giao'
    if (itemLoai === 'chuyen_giao') base.hanhDongTiep = 'buoc_tiep'
    if (itemLoai === 'ghep_bai') base.hanhDongTiep = 'cho_gap_lai_2'
    if (itemLoai === 'kiem_chung') base.hanhDongTiep = 'hoan_thanh'
  }
  return base
}

// ---------------------------------------------------------------------------
// Tính tiến độ bước từ danh sách tienDo (đọc từ phien.tien_do_json)
// ---------------------------------------------------------------------------
export function tinhTienDo(hocLieu: HocLieuChua, tienDo: BuocTienDo[]): {
  soBuocDaQua: number; soBuocCanKiem: number
} {
  const da = tienDo.filter(
    (b) => b.trangThai === 'da_lam_dung_trong_phien' || b.trangThai === 'co_bang_chung_hieu_trong_phien',
  ).length
  return { soBuocDaQua: da, soBuocCanKiem: hocLieu.buoc.length }
}

// ---------------------------------------------------------------------------
// Khởi tạo tiến độ bước từ học liệu
// ---------------------------------------------------------------------------
export function khoiTaoTienDo(hocLieu: HocLieuChua): BuocTienDo[] {
  return hocLieu.buoc.map((b, i) => ({
    buocId: b.id,
    thuTu: i,
    tieuDe: b.tieuDe,
    trangThai: 'chua_kiem' as TrangThaiBuoc,
    mucHoTroCaoNhat: 0,
    soVongHoTro: 0,
  }))
}

// ---------------------------------------------------------------------------
// Xây ItemCongKhai từ BuocChua + loại item (KHÔNG có đáp án)
// ---------------------------------------------------------------------------
export function xayItemCongKhai(
  id: string,
  loai: LoaiItem,
  buocSo: number | undefined,
  buoc: BuocChua | null,
): ItemCongKhai {
  return {
    id,
    loai,
    buocSo,
    tieuDe: buoc?.tieuDe ?? '',
    kieu: 'chon',
    hoi: '',          // Route handler điền từ ProbeRef → câu hỏi thực
    luaChon: null,
    // Đáp án KHÔNG có ở đây
  }
}

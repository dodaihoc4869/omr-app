// Máy trạng thái có thể phát lại: chỉ receipt của câu mới mới tạo bằng chứng.
import { khopPhanIII } from '../../src/lib/cham-so'
import { chamCauTuLuyen, chuanDungSai } from '../../src/lib/tu-luyen'
import { khoiTaoTienDo } from './chua-cau-sai-fsm'
import type {
  BuocTienDo,
  CauHinhChuaCauSai,
  HocLieuChua,
  LoaiItem,
  ProbeRef,
  PhanHoiItem,
  TrangThaiDay,
} from './chua-cau-sai-kieu'
export interface AnhPhien {
  hocLieu: HocLieuChua
  cauGoc: {
    phan: string
    text: string
    table?: string[][]
    choices?: string[]
    ideas?: string[]
    thanCauImg?: string
    imageDataUrl?: string
    choiceImgs?: (string | undefined)[]
    ideaImgs?: (string | undefined)[]
    hinhAnh?: { src: string; viTri: string; alt?: string }[]
  }
  version: string
  cfg: CauHinhChuaCauSai
  tienDo: BuocTienDo[]
  buoc: number
  pha: LoaiItem
  daDung: string[]
  soItem: number
  soChanDoan: number
  batDauDoan: number
  phanHoi: PhanHoiItem | null
  gioDocLoiGiai?: number
}
export function anhMoi(
  h: HocLieuChua,
  cauGoc: AnhPhien['cauGoc'],
  version: string,
  cfg: CauHinhChuaCauSai,
  now: number,
): AnhPhien {
  return {
    hocLieu: h,
    cauGoc,
    version,
    cfg,
    tienDo: khoiTaoTienDo(h),
    buoc: 0,
    pha: 'chan_doan',
    daDung: [],
    soItem: 0,
    soChanDoan: 0,
    batDauDoan: now,
    phanHoi: null,
  }
}
export function dauNoiDung(p: ProbeRef): string {
  const n = p.noiDungTrucTiep
  if (!n) return `${p.qid}@${p.phienBan}`
  const chuan = (s: string) =>
    s.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
  return JSON.stringify([
    chuan(n.hoi),
    (n.luaChon ?? []).map((x) => chuan(x.noi)).sort(),
    (n.y ?? []).map(chuan).sort(),
    n.bang ?? [],
    (n.hinhAnh ?? []).map((x) => x.src).sort(),
  ])
}
export function chamProbe(p: ProbeRef, tra: string): boolean {
  const n = p.noiDungTrucTiep
  if (!n) return false
  if (n.kieu === 'so') return khopPhanIII(tra, n.dapAn)
  if (n.kieu === 'ds')
    return n.y?.length === 4
      ? chamCauTuLuyen('II', n.dapAn, tra).dung
      : chuanDungSai(tra) !== '' && chuanDungSai(tra) === chuanDungSai(n.dapAn)
  if (n.kieu === 'chon' || n.kieu === 'chon_ly_do')
    return /^[A-D]$/i.test(n.dapAn)
      ? chamCauTuLuyen('I', n.dapAn, tra).dung
      : tra.trim().toUpperCase() === n.dapAn.trim().toUpperCase()
  return false // Không chấm tự luận bằng so chuỗi hoặc mô hình không được kiểm duyệt.
}
export function chonProbe(a: AnhPhien): ProbeRef | null {
  const b = a.hocLieu.buoc[a.buoc]
  let ds: ProbeRef[] = []
  switch (a.pha) {
    case 'chan_doan':
      ds = b?.chanDoan ?? []
      break
    case 'phan_biet':
      ds = [
        ...(b?.phanBiet ?? []),
        ...(b?.hieuBuoc?.doiChieu.map((x) => x.probeXacNhan) ?? []),
      ]
      break
    case 'kiem_ly_do':
      ds = b?.hieuBuoc?.kiemLyDo ?? []
      break
    case 'kiem_lai':
      ds = b?.kiemLai ?? []
      break
    case 'chuyen_giao':
      ds = b?.hieuBuoc?.chuyenGiao ?? []
      break
    case 'ghep_bai':
      ds = a.hocLieu.banGhepBai
      break
    case 'kiem_chung':
      ds = a.hocLieu.banKiemChung
      break
  }
  return ds.find((p) => !a.daDung.includes(dauNoiDung(p))) ?? null
}
export function nhanSauNop(
  a: AnhPhien,
  p: ProbeRef,
  tra: string,
  id: string,
  receipt: string,
  dung: boolean,
  coHoTro: boolean,
): {
  anh: AnhPhien
  trangThai: TrangThaiDay
  phanHoi: PhanHoiItem
  canThay: boolean
} {
  const n = structuredClone(a),
    loai = a.pha,
    b = n.hocLieu.buoc[n.buoc],
    td = n.tienDo[n.buoc]
  let trangThai: TrangThaiDay = 'dang_chua_buoc',
    canThay = false
  const giu = n.tienDo
    .filter((t) => t.trangThai === 'co_bang_chung_hieu_trong_phien')
    .map((t) => t.tieuDe)
  const ph: PhanHoiItem = {
    itemId: id,
    dung,
    phanGiuDuoc: giu.length
      ? `Em đã chứng minh được: ${giu.join('; ')}.`
      : undefined,
  }
  if (loai === 'ghep_bai' || loai === 'kiem_chung') {
    if (dung && (loai === 'ghep_bai' || !coHoTro)) {
      trangThai = loai === 'ghep_bai' ? 'cho_gap_lai_2' : 'da_tu_sua'
      ph.hanhDongTiep =
        loai === 'ghep_bai'
          ? 'Em đã ghép lại cả bài. Sau ít nhất 24 giờ, thử một bản mới mà không xem gợi ý.'
          : 'Em vừa tự giải được bản mới. Lịch ôn chung sẽ kiểm tra tiếp độ bền.'
    } else {
      // Giữ bước đã hiểu; cần thầy xác định điểm rẽ của bài tổng hợp, không xoá bằng chứng cũ.
      trangThai = 'can_thay'
      canThay = true
      ph.diemlech = dung
        ? 'Bài này đúng sau khi được giúp, nên chưa tính là tự sửa độc lập.'
        : 'Bài tổng hợp còn vướng. Các bước em đã chứng minh vẫn được giữ.'
      ph.hanhDongTiep =
        'Chỗ còn mắc được xếp vào buổi chữa trên lớp. Sau buổi chữa, em sẽ tự kiểm lại bằng câu mới.'
    }
  } else if (b && td) {
    td.trangThai = 'dang_kiem'
    if (loai === 'chan_doan') {
      td.receiptChanDoan = receipt
      n.soChanDoan++
      n.pha = dung ? 'kiem_ly_do' : 'phan_biet'
      if (dung)
        ph.phanGiuDuoc = `Em làm đúng ${b.tieuDe.toLowerCase()}. Tiếp theo, kiểm vì sao cách này đúng.`
      else {
        ph.diemlech = `Chỗ cần kiểm nằm ở ${b.tieuDe.toLowerCase()}. Một đáp án sai chưa đủ kết luận nguyên nhân.`
        ph.giaThiet = 'Thử một câu ngắn để phân biệt cách hiểu với phép tính.'
      }
    } else if (loai === 'phan_biet') {
      const doi = b.hieuBuoc?.doiChieu.find(
        (d) =>
          dauNoiDung(d.probeXacNhan) === dauNoiDung(p) &&
          p.dapAnSai?.some(
            (x) => x.trim().toLowerCase() === tra.trim().toLowerCase(),
          ),
      )
      if (doi) {
        td.maLoiDaXacNhan = doi.maLoi
        ph.giaThiet = doi.cachNghiCu
        ph.diemlech = `${doi.diemLech} ${doi.heQua}`
        ph.hanhDongTiep = `${doi.cachDung} ${b.hieuBuoc?.noiVoiBuocSau ?? ''}`
      } else {
        ph.diemlech = dung
          ? 'Em làm được câu phân biệt. Ta sẽ kiểm lý do và một bài mới.'
          : 'Chưa đủ bằng chứng để gọi tên nguyên nhân. Ta thử sửa quan hệ trước.'
        ph.hanhDongTiep = b.hieuBuoc?.viSaoCanBuoc
      }
      n.pha = 'kiem_ly_do'
    } else if (dung && !coHoTro) {
      if (loai === 'kiem_ly_do') {
        td.receiptLyDo = receipt
        n.pha = 'kiem_lai'
      }
      if (loai === 'kiem_lai') n.pha = 'chuyen_giao'
      if (loai === 'chuyen_giao' && td.receiptLyDo) {
        td.receiptChuyenGiao = receipt
        td.trangThai = 'co_bang_chung_hieu_trong_phien'
        ph.phanGiuDuoc = `Em đã giải thích và vận dụng được ${b.tieuDe.toLowerCase()} vào câu mới.`
        n.buoc = n.tienDo.findIndex(
          (t) => t.trangThai !== 'co_bang_chung_hieu_trong_phien',
        )
        n.pha = 'chan_doan'
        if (n.buoc < 0) n.buoc = n.hocLieu.buoc.length
        if (n.buoc >= n.hocLieu.buoc.length) {
          n.pha = 'ghep_bai'
          trangThai = 'dang_ghep_bai'
        }
      }
    } else {
      td.soVongHoTro++
      td.trangThai = 'can_ho_tro_tiep'
      td.receiptLyDo = undefined
      ph.diemlech =
        coHoTro && dung
          ? 'Em làm được sau gợi ý. Ta giảm hỗ trợ rồi thử câu khác để biết em đã tự làm được.'
          : 'Cần chỉnh thêm một quan hệ ở bước này.'
      ph.hanhDongTiep = [
        b.hieuBuoc?.dieuKienApDung,
        b.hoTro.find((x) => x.muc === 3)?.noiDung,
        'Giữ quan hệ vừa sửa rồi tự thử một câu khác, không nhìn lại ví dụ.',
      ]
        .filter(Boolean)
        .join(' ')
      n.pha = 'kiem_ly_do'
      if (td.soVongHoTro >= n.cfg.vongHoTroToiDaMoiBuoc) {
        td.trangThai = 'chuyen_thay'
        trangThai = 'can_thay'
        canThay = true
      }
    }
    if (!ph.hanhDongTiep)
      ph.hanhDongTiep =
        n.pha === 'chan_doan'
          ? 'Giữ bước vừa làm được, cùng xem bước tiếp theo.'
          : 'Em chọn “Tiếp tục” khi đã sẵn sàng thử câu mới.'
    if (b.hieuBuoc && loai !== 'chan_doan') {
      const {
        mucTieu,
        yNghiaDaiLuong,
        viSaoCanBuoc,
        dieuKienApDung,
        noiVoiBuocSau,
      } = b.hieuBuoc
      ph.dieuCanHieu = {
        mucTieu,
        yNghiaDaiLuong,
        viSaoCanBuoc,
        dieuKienApDung,
        noiVoiBuocSau,
      }
    }
  }
  n.phanHoi = ph
  return { anh: n, trangThai, phanHoi: ph, canThay }
}

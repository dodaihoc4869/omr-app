// Tổng hợp việc cần làm từ bài đã giao. Không thay đổi bộ rút câu hoặc luật chấm.
import { chuoiNgayHoc, hanBaiMom, mocThoiGian, ngayVietNam } from './han-bai-tap'
import { gioMayChu } from './gio-may-chu'
import { loDangCho, tinhLichLoBtvn } from './lich-lo-btvn'
import { tenBaiTapVeNha } from './btvn-ca-nhan-kieu'

export type LoaiNhiemVu =
  | 'btvn_lo'
  | 'mom'
  | 'sua_loi_vong1'
  | 'sua_loi_vong2'
  | 'thu_thach_vong3'
  | 'nap_thu'
  | 'on_tap'

export type CapDoUuTien = 'khan_cap' | 'quan_trong' | 'tieu_chuan' | 'thu_thach'

export interface NhiemVuTroLy {
  id: string
  loai: LoaiNhiemVu
  tieuDe: string
  moTa: string
  soCau: number
  phutUocTinh: number
  expThuong: number
  hanNop?: string
  conLaiMs?: number
  conLaiChu?: string
  capDoUuTien: CapDoUuTien
  diemUuTien: number
  hanhDong: {
    loai: 'mo_btvn' | 'mo_mom' | 'mo_khac_phuc' | 'mo_thi' | 'mo_than_thu' | 'mo_thu_thach'
    payload?: Record<string, any>
    nhanNut: string
  }
}

export interface DongRadarDeadline {
  id: string
  tieuDe: string
  hanNop?: string
  conLaiChu: string
  trangThai: 'khan_cap' | 'sap_den' | 'binh_thuong' | 'qua_han' | 'da_xong'
  loai?: 'btvn' | 'mom' | 'thi'
}

export interface KeHoachNgayTroLy {
  nganSach: {
    mucTieuCau: number
    daLamCau: number
    phanTramHoanThanh: number
    phutConLaiUocTinh: number
    trangThaiTai: 'nhe_nhang' | 'vua_suc' | 'go_no_giam_tai'
    chuThich: string
  }
  streak: {
    soNgayLienTiep: number
    daHocHomNay: boolean
    trangThaiThau: 'binh_thuong' | 'cuong_no_hao_quang'
  }
  top3: NhiemVuTroLy[]
  radarDeadline: {
    tongPending: number
    sapHetHan: number
    quaHan: number
    daXong: number
    danhSach: DongRadarDeadline[]
  }
  thanThu: {
    tenThu: string
    cap: number
    expHienTai: number
    expCanLenCap: number
    expHomNay: number
    tinhLucWallet: number
    thongDiepThu: string
  }
  loiKhuyenSuPham: {
    tieuDe: string
    noiDung: string
    mucDoTapTrung: 'go_loi_cot_loi' | 'duy_tri_phong_do' | 'but_pha_dinh_cao'
  }
}

/** Định dạng mili-giây còn lại thành chuỗi dễ đọc */
export function dinhDangConLai(ms?: number): string {
  if (ms === undefined || Number.isNaN(ms)) return 'Không rõ'
  if (ms <= 0) return 'Đã quá hạn'
  const phut = Math.floor(ms / (60 * 1000))
  if (ms < 60_000) return 'Còn dưới 1 phút'
  if (phut < 60) return `Còn ${phut} phút`
  const gio = Math.floor(phut / 60)
  const phutLe = phut % 60
  if (gio < 24) return `Còn ${gio}h ${phutLe > 0 ? `${phutLe}p` : ''}`
  const ngay = Math.floor(gio / 24)
  const gioLe = gio % 24
  return `Còn ${ngay} ngày ${gioLe > 0 ? `${gioLe}h` : ''}`
}

/**
 * Tính toán Ngân sách câu hỏi học tập mỗi ngày (Adaptive Daily Budget)
 * Đảm bảo nguyên tắc Anti-Burnout: Tối thiểu 8 câu, tối đa 16 câu.
 */
export function tinhNganSachNgay(
  tongPending: number,
  tongCauSai: number,
  vanTocGiayMoiCau = 90,
  soCauDaLamHomNay = 0,
): {
  mucTieuCau: number
  daLamCau: number
  phanTramHoanThanh: number
  phutConLaiUocTinh: number
  trangThaiTai: 'nhe_nhang' | 'vua_suc' | 'go_no_giam_tai'
  chuThich: string
} {
  let mucTieu = 12
  let trangThaiTai: 'nhe_nhang' | 'vua_suc' | 'go_no_giam_tai' = 'vua_suc'
  let chuThich = 'Gợi ý luyện thêm: 12 câu, khoảng 18 phút. Bài được giao vẫn cần nộp đủ trước hạn.'

  // Khi học sinh đang bị tồn đọng nhiều bài (>= 15 câu nợ hoặc >= 20 câu sai)
  if (tongPending >= 15 || tongCauSai >= 20) {
    mucTieu = 8
    trangThaiTai = 'go_no_giam_tai'
    chuThich = 'Gợi ý giảm tải: bắt đầu với 8 câu. Nếu không kịp bài đến hạn, em báo Thầy để sắp xếp.'
  } else if (tongPending >= 6 || tongCauSai >= 10) {
    mucTieu = 10
    trangThaiTai = 'vua_suc'
    chuThich = 'Gợi ý luyện thêm: 10 câu, khoảng 15 phút. Mốc này không thay yêu cầu của bài được giao.'
  } else if (tongPending <= 2 && tongCauSai <= 4) {
    // Học sinh theo kịp tiến độ tốt
    if (vanTocGiayMoiCau < 75) {
      mucTieu = 16
      trangThaiTai = 'nhe_nhang'
      chuThich = 'Gợi ý luyện thêm: tối đa 16 câu. Em có thể dừng sau phần bắt buộc.'
    } else {
      mucTieu = 12
      trangThaiTai = 'vua_suc'
      chuThich = 'Gợi ý luyện thêm: 12 câu. Số câu đã làm chưa chứng minh em đã nhớ kiến thức.'
    }
  }

  // Giới hạn tuyệt đối trong khoảng [8, 16] câu/ngày
  mucTieu = Math.max(8, Math.min(16, mucTieu))

  const daLam = Math.max(0, soCauDaLamHomNay)
  const phanTram = Math.min(100, Math.round((daLam / mucTieu) * 100))
  const cauConLai = Math.max(0, mucTieu - daLam)
  const phutConLai = Math.ceil((cauConLai * vanTocGiayMoiCau) / 60)

  return {
    mucTieuCau: mucTieu,
    daLamCau: daLam,
    phanTramHoanThanh: phanTram,
    phutConLaiUocTinh: phutConLai,
    trangThaiTai,
    chuThich,
  }
}

/**
 * Tính điểm ưu tiên số học cho từng nhiệm vụ (Dynamic Priority Scoring Engine)
 * Công thức: P = 0.40 * Urgency + 0.35 * Severity + 0.15 * Effort + 0.10 * Pet
 */
export function tinhDiemUuTien(params: {
  conLaiMs?: number
  isOverdue?: boolean
  loai: LoaiNhiemVu
  soCau: number
  expThuong: number
  canLenCapNgay?: boolean
}): { score: number; capDo: CapDoUuTien } {
  const { conLaiMs, isOverdue, loai, soCau, canLenCapNgay } = params

  // 1. Urgency (0.00 -> 1.00)
  let urgency = 0.3
  if (isOverdue) {
    urgency = 0.75
  } else if (conLaiMs !== undefined) {
    const gioConLai = conLaiMs / (3600 * 1000)
    if (gioConLai <= 2) urgency = 1.0 // Dưới 2 tiếng (rất khẩn cấp)
    else if (gioConLai <= 6) urgency = 0.9
    else if (gioConLai <= 12) urgency = 0.8
    else if (gioConLai <= 24) urgency = 0.65
    else if (gioConLai <= 48) urgency = 0.45
    else urgency = 0.25
  }

  // 2. Pedagogical Severity (0.00 -> 1.00)
  let severity = 0.5
  switch (loai) {
    case 'mom':
      severity = 0.95 // Bài mẹ giao cần làm nghiêm túc
      break
    case 'sua_loi_vong1':
      severity = 1.0 // Bịt lỗi cốt lõi trước để không sai dây chuyền
      break
    case 'btvn_lo':
      severity = 0.85 // Lô BTVN đang tới lượt (thay Vòng 1/Vòng 2)
      break
    case 'sua_loi_vong2':
      severity = 0.75
      break
    case 'thu_thach_vong3':
      severity = 0.35 // Thử thách không ép buộc
      break
    case 'nap_thu':
      severity = 0.2
      break
    default:
      severity = 0.5
  }

  // 3. Effort Fit (0.00 -> 1.00): Quick Win (ít câu) được ưu tiên để tạo đà
  let effort = 0.7
  if (soCau <= 4) effort = 0.9
  else if (soCau <= 8) effort = 0.75
  else effort = 0.5

  // 4. Pet Incentive (0.00 -> 1.00)
  const pet = canLenCapNgay ? 1.0 : 0.6

  const score = 0.4 * urgency + 0.35 * severity + 0.15 * effort + 0.1 * pet

  let capDo: CapDoUuTien = 'tieu_chuan'
  if (score >= 0.8 || urgency >= 0.9) capDo = 'khan_cap'
  else if (score >= 0.65 || severity >= 0.85) capDo = 'quan_trong'
  else if (loai === 'thu_thach_vong3') capDo = 'thu_thach'

  return { score: Math.round(score * 100) / 100, capDo }
}

/**
 * Tổng hợp Kế hoạch Trợ lý Toàn Diện cho Học sinh
 */
export function tongHopKeHoachTroLy(input: {
  sbd: string
  hoTen: string
  dsBtvn: any[]
  dsMomGiao: any[]
  dsLichSu: any[]
  tongCauSai: number
  hoSoThanThu?: any
  now?: number
}): KeHoachNgayTroLy {
  const { sbd: _sbd, hoTen, dsBtvn, dsMomGiao, dsLichSu, tongCauSai, hoSoThanThu } = input

  const now = input.now ?? gioMayChu()

  // 1. Phân tích Bài Mom giao
  const momChuaNop = dsMomGiao.filter((b) => b.trangThai !== 'da_nop')
  const btvnChuaNop = dsBtvn.filter((b) => !b.daNop)

  const tongPending = momChuaNop.length + btvnChuaNop.length

  // Đếm câu có số lượng xác nhận, theo ngày Việt Nam. Thiếu số liệu không tự bù 10 câu.
  let soCauDaLamHomNay = 0
  const homNayIso = ngayVietNam(now)
  const baiDaNop = [
    ...dsLichSu.map(c => ({ ...c, key: `thi:${c.maCa || c.nopLuc}` })),
    ...dsBtvn.filter(b => b.daNop).map(b => ({ ...b, key: `bt:${b.maBtvn || b.maCa}` })),
    ...dsMomGiao.filter(b => b.trangThai === 'da_nop').map(b => ({ ...b, key: `mom:${b.id}` })),
  ]
  const seen = new Set<string>()
  for (const b of baiDaNop) {
    if (seen.has(b.key)) continue
    seen.add(b.key)
    if (ngayVietNam(b.nopLuc) !== homNayIso) continue
    const n = Number(b.tongCau ?? b.soCau)
    if (Number.isFinite(n) && n > 0) soCauDaLamHomNay += Math.floor(n)
  }

  // 3. Tính Ngân sách ngày
  const nganSach = tinhNganSachNgay(tongPending, tongCauSai, 90, soCauDaLamHomNay)

  // 4. Xây dựng Danh sách Nhiệm vụ Ứng viên (Candidate Tasks)
  const candidateTasks: NhiemVuTroLy[] = []

  // A. Candidate: Bài Mom giao
  for (const mom of momChuaNop) {
    let conLaiMs: number | undefined
    let conLaiChu = 'Hạn 2 tiếng'
    let isOverdue = false

    const hanMom = hanBaiMom(mom)
    if (hanMom) {
      conLaiMs = Date.parse(hanMom) - now
      conLaiChu = dinhDangConLai(conLaiMs)
      isOverdue = conLaiMs <= 0
    } else {
      conLaiChu = '120 phút từ khi bắt đầu'
    }
    // Bài Mom hết giờ vẫn phải vào để nộp phần đã lưu; không mời làm tiếp.

    const { score, capDo } = tinhDiemUuTien({
      conLaiMs,
      isOverdue,
      loai: 'mom',
      soCau: mom.soCau || 10,
      expThuong: (mom.soCau || 10) * 2,
    })

    candidateTasks.push({
      id: `mom_${mom.id}`,
      loai: 'mom',
      tieuDe: mom.tieuDe || 'Bài Mom giao',
      moTa: `Gồm ${mom.soCau || 10} câu ôn tập · ${conLaiChu}`,
      soCau: mom.soCau || 10,
      phutUocTinh: Math.ceil(((mom.soCau || 10) * 80) / 60),
      expThuong: (mom.soCau || 10) * 2,
      hanNop: hanMom,
      conLaiMs,
      conLaiChu,
      capDoUuTien: capDo,
      diemUuTien: score,
      hanhDong: {
        loai: 'mo_mom',
        payload: { id: mom.id, bai: mom },
        nhanNut: isOverdue ? 'Mở để hoàn tất nộp bài' : 'Làm bài của Mom',
      },
    })
  }

  // B. Candidate: BTVN Thầy giao — LÔ THEO NGÀY/GIỜ (mục 3 SO-VIEC.md 19/09,
  // thay Vòng 1/Vòng 2). Lịch tính THUẦN từ giaoLuc/hanNop/soCau + tải các
  // nhiệm vụ khác (`lich-lo-btvn.ts`), không lưu gì ngoài `bt.loDaXong` (số lô
  // đã xong, máy chủ ghi qua `/btvn/xong-lo`).
  //
  // MỖI BÀI CHỈ SINH TỐI ĐA MỘT Ô — đúng lô em đang phải làm. Lô chưa tới mốc
  // dự kiến thì KHÔNG sinh ô nào, dù lô trước đã xong: "chỉ khi nào hoàn thành
  // xong nhiệm vụ trước thì nhiệm vụ mới mới hiển thị" đọc đúng nghĩa là xong
  // lô trước VÀ đúng nhịp — xong sớm không kéo lô sau hiện sớm theo.
  for (const bt of btvnChuaNop) {
    const id = bt.maBtvn || bt.maCa || 'btvn'
    let conLaiMsHanChung: number | undefined
    let isOverdue = false

    if (bt.hanNop) {
      const hanTime = mocThoiGian(bt.hanNop)
      conLaiMsHanChung = hanTime === undefined ? undefined : hanTime - now
      if (conLaiMsHanChung !== undefined && conLaiMsHanChung <= 0) isOverdue = true
    }

    if (isOverdue) continue // Máy chủ chặn BTVN quá hạn; giữ trong danh sách theo dõi.

    // Tải các nhiệm vụ KHÁC (không tính chính bài này) — bài này phải nhường
    // bớt ngân sách ngày cho chúng, lô co lại tương ứng để không dồn tải.
    const taiKhac =
      btvnChuaNop.filter((x) => x !== bt).reduce((s, x) => s + (x.soCau || 0), 0) +
      momChuaNop.reduce((s, m) => s + (m.soCau || 10), 0)

    const lich = tinhLichLoBtvn({
      soCau: bt.soCau || 15,
      giaoLuc: String(bt.giaoLuc || ''),
      hanNop: String(bt.hanNop || ''),
      nganSachNgay: nganSach.mucTieuCau,
      taiKhac,
    })
    const dangCho = loDangCho(lich, Math.max(0, Number(bt.loDaXong) || 0), now)
    if (!dangCho || !dangCho.daToiMoc) continue // xong hết lô bắt buộc, hoặc lô kế chưa tới nhịp

    const conLaiChu = dinhDangConLai(conLaiMsHanChung)
    // TRỄ NHỊP (đã qua mốc lô KẾ TIẾP mà lô này vẫn chưa xong) ⇒ ép mức khẩn
    // cấp lên hẳn thay vì chỉ dựa hạn chung còn xa — đúng "gán nhãn khẩn cấp
    // hơn" thầy yêu cầu khi chưa hoàn thành nhiệm vụ trước.
    const conLaiMsChoDiem = dangCho.treNhip ? Math.min(conLaiMsHanChung ?? 2 * 3600_000, 2 * 3600_000) : conLaiMsHanChung
    const { score, capDo } = tinhDiemUuTien({
      conLaiMs: conLaiMsChoDiem,
      isOverdue: false,
      loai: 'btvn_lo',
      soCau: dangCho.soCau,
      expThuong: dangCho.soCau * 2,
    })

    const tongLo = lich.cacLo.length
    candidateTasks.push({
      id: `btvn_lo_${id}_${dangCho.chiSo}`,
      loai: 'btvn_lo',
      tieuDe: `${tenBaiTapVeNha(bt)}: Chặng ${dangCho.chiSo + 1} trong ${tongLo} chặng`,
      moTa: dangCho.treNhip
        ? `Đã trễ nhịp dự kiến (${lich.donViDan === 'ngay' ? 'theo ngày' : 'theo giờ'}) — làm ngay để không dồn tiếp qua chặng sau · ${dangCho.soCau} câu · ${conLaiChu}`
        : `${dangCho.soCau} câu · ${conLaiChu}`,
      soCau: dangCho.soCau,
      phutUocTinh: Math.ceil((dangCho.soCau * 80) / 60),
      expThuong: dangCho.soCau * 2,
      hanNop: bt.hanNop,
      conLaiMs: conLaiMsHanChung,
      conLaiChu,
      capDoUuTien: capDo,
      diemUuTien: score,
      hanhDong: {
        loai: 'mo_btvn',
        payload: { bt },
        nhanNut: `Làm chặng ${dangCho.chiSo + 1}`,
      },
    })
  }

  // Gợi ý mở luồng luyện câu sai có sẵn; chưa phải lịch ôn giãn cách.
  if (tongCauSai > 0) {
    const soCauSua = Math.min(4, Math.max(2, Math.round(tongCauSai * 0.2)))
    const { score: scoreSua, capDo: capDoSua } = tinhDiemUuTien({
      loai: 'sua_loi_vong1',
      soCau: soCauSua,
      expThuong: soCauSua * 3, // Thưởng thêm EXP khi tự tay sửa câu sai
    })

    candidateTasks.push({
      id: 'sua_loi_cot_loi',
      loai: 'sua_loi_vong1',
      tieuDe: `Luyện sửa ${soCauSua} câu sai căn bản`,
      moTa: `Tự tay làm lại câu sai ca thi gần nhất để không sai lặp lại`,
      soCau: soCauSua,
      phutUocTinh: Math.ceil((soCauSua * 80) / 60),
      expThuong: soCauSua * 3,
      capDoUuTien: capDoSua,
      diemUuTien: scoreSua,
      hanhDong: {
        loai: 'mo_khac_phuc',
        payload: { cheDo: 1, soCau: soCauSua },
        nhanNut: 'Sửa lỗi ngay',
      },
    })
  }

  // D. Candidate: Thử Thách Vòng 3 hoặc Thần Thú
  const { score: scoreV3, capDo: capDoV3 } = tinhDiemUuTien({
    loai: 'thu_thach_vong3',
    soCau: 2,
    expThuong: 8, // x2 EXP
  })

  candidateTasks.push({
    id: 'thu_thach_vong3',
    loai: 'thu_thach_vong3',
    tieuDe: 'Luyện nâng cao (tự chọn)',
    moTa: 'Chỉ chọn khi em đã xong bài cần nộp.',
    soCau: 2,
    phutUocTinh: 6,
    expThuong: 8,
    capDoUuTien: capDoV3,
    diemUuTien: scoreV3,
    hanhDong: {
      loai: 'mo_thu_thach',
      payload: { vong: 3, soCau: 2 },
      nhanNut: 'Thử sức ngay',
    },
  })

  // Chỉ xếp thứ tự việc học. Giữ nguyên payload, số câu và các vòng của bộ làm bài.
  const due = (t: NhiemVuTroLy) => t.conLaiMs !== undefined && t.conLaiMs > 0 && t.conLaiMs <= 86400_000
  candidateTasks.sort((a, b) => Number(due(b)) - Number(due(a)) ||
    (due(a) && due(b) ? a.conLaiMs! - b.conLaiMs! : 0) || b.diemUuTien - a.diemUuTien)
  // Mỗi bài chỉ chiếm một ô trên trang chủ; các vòng vẫn có trong màn làm bài.
  const daXep = new Set<string>()
  const top3 = candidateTasks.filter(t => {
    const key = t.hanhDong.loai === 'mo_btvn' ? `bt:${t.hanhDong.payload?.bt.maBtvn || t.hanhDong.payload?.bt.maCa}` : t.id
    if (daXep.has(key)) return false
    daXep.add(key)
    return true
  }).slice(0, 3)

  // 5. Radar Deadline
  const radarItems: DongRadarDeadline[] = []
  let countSapHetHan = 0
  let countQuaHan = 0
  let countDaXong = 0

  for (const m of dsMomGiao) {
    if (m.trangThai === 'da_nop') {
      countDaXong++
      radarItems.push({
        id: `mom_${m.id}`,
        tieuDe: m.tieuDe || 'Bài Mom giao',
        conLaiChu: 'Đã hoàn thành',
        trangThai: 'da_xong',
      })
    } else {
      let conLaiMs: number | undefined
      const hanMom = hanBaiMom(m)
      if (hanMom) conLaiMs = Date.parse(hanMom) - now
      const conLaiChu = conLaiMs === undefined ? '120 phút từ khi bắt đầu' : dinhDangConLai(conLaiMs)
      let tt: DongRadarDeadline['trangThai'] = 'binh_thuong'
      if (conLaiMs !== undefined && conLaiMs <= 0) {
        tt = 'qua_han'
        countQuaHan++
      } else if (conLaiMs !== undefined && conLaiMs <= 86400_000) {
        tt = 'khan_cap'
        countSapHetHan++
      }

      radarItems.push({
        id: `mom_${m.id}`,
        tieuDe: m.tieuDe || 'Bài Mom giao',
        hanNop: hanMom,
        conLaiChu,
        trangThai: tt,
        loai: 'mom',
      })
    }
  }

  for (const b of dsBtvn) {
    if (b.daNop) {
      countDaXong++
      radarItems.push({
        id: `bt_${b.maBtvn || b.maCa}`,
        tieuDe: b.tenBtvn || b.tieuDe || 'BTVN Thầy giao',
        conLaiChu: 'Đã nộp bài',
        trangThai: 'da_xong',
        loai: 'btvn',
      })
    } else {
      // Radar dùng ĐÚNG hạn CHUNG (b.hanNop) — mốc duy nhất máy chủ chặn nộp —
      // và chỉ ghi chú thêm "trễ nhịp lô" khi lô em đang chờ đã qua mốc lô kế
      // tiếp mà chưa xong (xem `loDangCho`, thay Vòng 1/Vòng 2).
      const taiKhacRadar =
        dsBtvn.filter((x) => x !== b && !x.daNop).reduce((s, x) => s + (x.soCau || 0), 0) +
        dsMomGiao.filter((m) => m.trangThai !== 'da_nop').reduce((s, m) => s + (m.soCau || 10), 0)
      const lichRadar = tinhLichLoBtvn({
        soCau: b.soCau || 15,
        giaoLuc: String(b.giaoLuc || ''),
        hanNop: String(b.hanNop || ''),
        nganSachNgay: nganSach.mucTieuCau,
        taiKhac: taiKhacRadar,
      })
      const dangChoRadar = loDangCho(lichRadar, Math.max(0, Number(b.loDaXong) || 0), now)

      let conLaiMsHanChung: number | undefined
      if (b.hanNop) {
        const msc = mocThoiGian(b.hanNop)
        conLaiMsHanChung = msc === undefined ? undefined : msc - now
      }
      const quaHanChung = conLaiMsHanChung !== undefined && conLaiMsHanChung <= 0

      const conLaiChu = dangChoRadar?.treNhip && !quaHanChung ? 'Đã trễ nhịp chặng' : dinhDangConLai(conLaiMsHanChung)
      let tt: DongRadarDeadline['trangThai'] = 'binh_thuong'
      if (quaHanChung) {
        tt = 'qua_han'
        countQuaHan++
      } else if (conLaiMsHanChung !== undefined && conLaiMsHanChung <= 12 * 3600 * 1000) {
        tt = 'khan_cap'
        countSapHetHan++
      } else if (conLaiMsHanChung !== undefined && conLaiMsHanChung <= 24 * 3600 * 1000) {
        tt = 'sap_den'
        countSapHetHan++
      }

      radarItems.push({
        id: `bt_${b.maBtvn || b.maCa}`,
        tieuDe: b.tenBtvn || b.tieuDe || 'BTVN Thầy giao',
        hanNop: b.hanNop,
        conLaiChu,
        trangThai: tt,
        loai: 'btvn',
      })
    }
  }

  // Chuỗi ngày có bài nộp, không phải phép đo mức độ nắm kiến thức.
  const soNgayLienTiep = chuoiNgayHoc(baiDaNop.map(b => b.nopLuc), now)
  const daHocHomNay = soCauDaLamHomNay >= nganSach.mucTieuCau

  // 7. Thần Thú Profile
  const cap = hoSoThanThu?.cap ?? 1
  const expHienTai = hoSoThanThu?.exp ?? 0
  const expCanLenCap = cap * 25 + 50
  const tinhLucWallet = hoSoThanThu?.wallet ?? 0
  const tenThu = hoSoThanThu?.nickname || 'Thần Thú Đồng Hành'

  let thongDiepThu = `${tenThu} đang rất sẵn sàng cùng em chinh phục các câu hỏi hôm nay!`
  if (tinhLucWallet > 0) {
    thongDiepThu = `Em đang có ${tinhLucWallet} EXP tinh lực trong kho! Bấm nạp tinh lực để giúp ${tenThu} tăng cấp ngay.`
  } else if (expCanLenCap - expHienTai <= 15) {
    thongDiepThu = `Chỉ còn ${expCanLenCap - expHienTai} EXP nữa là ${tenThu} lên cấp ${cap + 1}! EXP được ghi nhận theo kết quả bài làm.`
  }

  // 8. Lời khuyên Sư phạm của Thầy Đỗ Đại Học
  let tieuDeLoiKhuyen = `Việc học của em ${hoTen || ''} hôm nay`
  let noiDungLoiKhuyen = `Em xem hạn nộp trước, làm bài được giao rồi luyện lại câu sai. Gợi ý số câu không thay yêu cầu nộp bài.`
  let mucDoTapTrung: KeHoachNgayTroLy['loiKhuyenSuPham']['mucDoTapTrung'] = 'duy_tri_phong_do'

  if (countQuaHan > 0 || countSapHetHan > 0) {
    tieuDeLoiKhuyen = 'Ưu tiên giải quyết các bài sắp đến hạn trước'
    noiDungLoiKhuyen = 'Em làm bài gần hạn trước. BTVN quá hạn cần Thầy gia hạn; bài gia đình giao hết giờ cần mở để nộp phần đã lưu.'
    mucDoTapTrung = 'go_loi_cot_loi'
  } else if (tongCauSai >= 15) {
    tieuDeLoiKhuyen = 'Luyện lại những câu em còn sai'
    noiDungLoiKhuyen = 'Em làm lại câu sai trước khi xem giải. Sau đó ghi lại bước còn vướng để hỏi Thầy.'
    mucDoTapTrung = 'go_loi_cot_loi'
  } else if (soCauDaLamHomNay >= nganSach.mucTieuCau) {
    tieuDeLoiKhuyen = 'Em đã đạt số câu gợi ý hôm nay'
    noiDungLoiKhuyen = 'Em kiểm tra bài cần nộp trước khi nghỉ. Đạt số câu gợi ý không có nghĩa mọi bài đã nộp đủ.'
    mucDoTapTrung = 'but_pha_dinh_cao'
  }

  return {
    nganSach,
    streak: {
      soNgayLienTiep,
      daHocHomNay,
      trangThaiThau: soNgayLienTiep >= 3 ? 'cuong_no_hao_quang' : 'binh_thuong',
    },
    top3,
    radarDeadline: {
      tongPending,
      sapHetHan: countSapHetHan,
      quaHan: countQuaHan,
      daXong: countDaXong,
      danhSach: radarItems,
    },
    thanThu: {
      tenThu,
      cap,
      expHienTai,
      expCanLenCap,
      expHomNay: soCauDaLamHomNay * 2,
      tinhLucWallet,
      thongDiepThu,
    },
    loiKhuyenSuPham: {
      tieuDe: tieuDeLoiKhuyen,
      noiDung: noiDungLoiKhuyen,
      mucDoTapTrung,
    },
  }
}

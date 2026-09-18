// THUẬT TOÁN TRỢ LÝ CÁ NHÂN ĐỖ ĐẠI HỌC AI (PERSONAL LEARNING CO-PILOT)
//
// Phục vụ học sinh:
// 1. Quản lý toàn diện deadline (BTVN Thầy giao, Bài Mom giao 2 tiếng, Ca thi).
// 2. Quản lý ngân sách học tập thích ứng (Anti-Burnout Budget: 8-16 câu/ngày).
// 3. Chu kỳ bịt lỗ hổng câu sai (Spaced Repetition Vòng 1 -> Vòng 2).
// 4. Ma trận ưu tiên động trích xuất Top 3 việc quan trọng nhất hôm nay (1-Click Action).
// 5. Thần Thú đồng hành (EXP, Streak, Tinh lực phát sáng).

export type LoaiNhiemVu =
  | 'btvn_vong1'
  | 'btvn_vong2'
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
    loai: 'mo_btvn' | 'mo_mom' | 'mo_khac_phuc' | 'mo_thi' | 'mo_than_thu'
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
  let chuThich = 'Nhịp độ học tập tiêu chuẩn: 12 câu (~18 phút) để duy trì phản xạ và tiến bộ.'

  // Khi học sinh đang bị tồn đọng nhiều bài (>= 15 câu nợ hoặc >= 20 câu sai)
  if (tongPending >= 15 || tongCauSai >= 20) {
    mucTieu = 8
    trangThaiTai = 'go_no_giam_tai'
    chuThich = 'Đang giảm tải gỡ nợ: Tập trung 8 câu Vòng 1 Lõi Căn Bản để giải tỏa áp lực và lấy lại tự tin.'
  } else if (tongPending >= 6 || tongCauSai >= 10) {
    mucTieu = 10
    trangThaiTai = 'vua_suc'
    chuThich = 'Tải học tập vừa sức: 10 câu trọng tâm (~15 phút) giúp hoàn thành chỉ tiêu mà không ngợp.'
  } else if (tongPending <= 2 && tongCauSai <= 4) {
    // Học sinh theo kịp tiến độ tốt
    if (vanTocGiayMoiCau < 75) {
      mucTieu = 16
      trangThaiTai = 'nhe_nhang'
      chuThich = 'Phong độ xuất sắc: 16 câu (kèm câu Vòng 3 Thử Thách) để bứt phá điểm 9-10 và nhân đôi EXP Thần Thú.'
    } else {
      mucTieu = 12
      trangThaiTai = 'vua_suc'
      chuThich = 'Tiến độ rất tốt: Duy trì 12 câu đều đặn mỗi ngày để nắm chắc điểm 8+.'
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
    case 'btvn_vong1':
      severity = 0.9 // Vòng 1 Lõi bài mới
      break
    case 'sua_loi_vong2':
      severity = 0.75
      break
    case 'btvn_vong2':
      severity = 0.7
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
}): KeHoachNgayTroLy {
  const { sbd: _sbd, hoTen, dsBtvn, dsMomGiao, dsLichSu, tongCauSai, hoSoThanThu } = input

  const now = Date.now()

  // 1. Phân tích Bài Mom giao
  const momChuaNop = dsMomGiao.filter((b) => b.trangThai !== 'da_nop')
  const btvnChuaNop = dsBtvn.filter((b) => !b.daNop)

  const tongPending = momChuaNop.length + btvnChuaNop.length

  // 2. Tính số câu đã làm hôm nay
  let soCauDaLamHomNay = 0
  const homNayIso = new Date().toISOString().slice(0, 10)
  for (const c of dsLichSu) {
    if (c.nopLuc && c.nopLuc.startsWith(homNayIso)) {
      soCauDaLamHomNay += c.tongCau || c.soCau || 10
    }
  }
  for (const b of dsMomGiao) {
    if (b.trangThai === 'da_nop' && b.nopLuc && b.nopLuc.startsWith(homNayIso)) {
      soCauDaLamHomNay += b.soCau || 10
    }
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

    if (mom.batDauLuc) {
      const daTroi = Math.floor((now - new Date(mom.batDauLuc).getTime()) / 1000)
      const conGiay = Math.max(0, 7200 - daTroi)
      conLaiMs = conGiay * 1000
      conLaiChu = dinhDangConLai(conLaiMs)
      if (conGiay <= 0) isOverdue = true
    } else if (mom.hanNop) {
      const hanTime = new Date(mom.hanNop).getTime()
      conLaiMs = hanTime - now
      conLaiChu = dinhDangConLai(conLaiMs)
      if (conLaiMs <= 0) isOverdue = true
    }

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
      hanNop: mom.hanNop,
      conLaiMs,
      conLaiChu,
      capDoUuTien: capDo,
      diemUuTien: score,
      hanhDong: {
        loai: 'mo_mom',
        payload: { id: mom.id, bai: mom },
        nhanNut: 'Làm bài của Mom',
      },
    })
  }

  // B. Candidate: BTVN Thầy giao
  for (const bt of btvnChuaNop) {
    const id = bt.maBtvn || bt.maCa || 'btvn'
    let conLaiMs: number | undefined
    let isOverdue = false

    if (bt.hanNop) {
      const hanTime = new Date(bt.hanNop).getTime()
      conLaiMs = hanTime - now
      if (conLaiMs <= 0) isOverdue = true
    }

    const conLaiChu = dinhDangConLai(conLaiMs)
    const tongCauBtvn = bt.soCau || 15
    const soCauV1 = Math.max(4, Math.round(tongCauBtvn * 0.45))
    const soCauV2 = Math.max(3, Math.round(tongCauBtvn * 0.35))

    // Nhiệm vụ Vòng 1 Lõi Căn Bản
    const { score: scoreV1, capDo: capDoV1 } = tinhDiemUuTien({
      conLaiMs,
      isOverdue,
      loai: 'btvn_vong1',
      soCau: soCauV1,
      expThuong: soCauV1 * 2,
    })

    candidateTasks.push({
      id: `btvn_v1_${id}`,
      loai: 'btvn_vong1',
      tieuDe: `${bt.tieuDe || 'BTVN'}: Vòng 1 (Lõi Căn Bản)`,
      moTa: `Bắt buộc hoàn thành · ${soCauV1} câu nền tảng · ${conLaiChu}`,
      soCau: soCauV1,
      phutUocTinh: Math.ceil((soCauV1 * 75) / 60),
      expThuong: soCauV1 * 2,
      hanNop: bt.hanNop,
      conLaiMs,
      conLaiChu,
      capDoUuTien: capDoV1,
      diemUuTien: scoreV1,
      hanhDong: {
        loai: 'mo_btvn',
        payload: { bt },
        nhanNut: 'Làm Vòng 1',
      },
    })

    // Nhiệm vụ Vòng 2 Trọng Tâm Cá Nhân
    const { score: scoreV2, capDo: capDoV2 } = tinhDiemUuTien({
      conLaiMs,
      isOverdue,
      loai: 'btvn_vong2',
      soCau: soCauV2,
      expThuong: soCauV2 * 2,
    })

    candidateTasks.push({
      id: `btvn_v2_${id}`,
      loai: 'btvn_vong2',
      tieuDe: `${bt.tieuDe || 'BTVN'}: Vòng 2 (Trọng Tâm Cá Nhân)`,
      moTa: `Bổ sung chuyên đề hay sai · Đạt 100% chỉ tiêu bài tập`,
      soCau: soCauV2,
      phutUocTinh: Math.ceil((soCauV2 * 90) / 60),
      expThuong: soCauV2 * 2,
      hanNop: bt.hanNop,
      conLaiMs,
      conLaiChu,
      capDoUuTien: capDoV2,
      diemUuTien: scoreV2,
      hanhDong: {
        loai: 'mo_btvn',
        payload: { bt },
        nhanNut: 'Làm Vòng 2',
      },
    })
  }

  // C. Candidate: Bịt Lỗ Hổng Câu Sai (Spaced Repetition)
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
      tieuDe: `Bịt lỗ hổng: Sửa ${soCauSua} câu sai căn bản`,
      moTa: `Tự tay làm lại câu sai ca thi gần nhất để không sai lặp lại`,
      soCau: soCauSua,
      phutUocTinh: Math.ceil((soCauSua * 80) / 60),
      expThuong: soCauSua * 3,
      capDoUuTien: capDoSua,
      diemUuTien: scoreSua,
      hanhDong: {
        loai: 'mo_khac_phuc',
        payload: { cheDo: 1 },
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
    tieuDe: 'Thử thách bứt phá 9+ (x2 EXP Thần Thú)',
    moTa: '2 câu Vận dụng cao · Rèn luyện bản lĩnh & bứt phá điểm số',
    soCau: 2,
    phutUocTinh: 6,
    expThuong: 8,
    capDoUuTien: capDoV3,
    diemUuTien: scoreV3,
    hanhDong: {
      loai: 'mo_than_thu',
      payload: {},
      nhanNut: 'Thử sức ngay',
    },
  })

  // Sắp xếp tasks theo điểm ưu tiên giảm dần
  candidateTasks.sort((a, b) => b.diemUuTien - a.diemUuTien)

  // Trích xuất Top 3
  const top3 = candidateTasks.slice(0, 3)

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
      if (m.batDauLuc) {
        const daTroi = Math.floor((now - new Date(m.batDauLuc).getTime()) / 1000)
        conLaiMs = Math.max(0, (7200 - daTroi) * 1000)
      } else if (m.hanNop) {
        conLaiMs = new Date(m.hanNop).getTime() - now
      }

      const conLaiChu = dinhDangConLai(conLaiMs)
      let tt: DongRadarDeadline['trangThai'] = 'sap_den'
      if (conLaiMs !== undefined && conLaiMs <= 0) {
        tt = 'qua_han'
        countQuaHan++
      } else if (conLaiMs !== undefined && conLaiMs <= 6 * 3600 * 1000) {
        tt = 'khan_cap'
        countSapHetHan++
      } else {
        countSapHetHan++
      }

      radarItems.push({
        id: `mom_${m.id}`,
        tieuDe: m.tieuDe || 'Bài Mom giao',
        hanNop: m.hanNop,
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
        tieuDe: b.tieuDe || 'BTVN Thầy giao',
        conLaiChu: 'Đã nộp bài',
        trangThai: 'da_xong',
        loai: 'btvn',
      })
    } else {
      let conLaiMs: number | undefined
      if (b.hanNop) {
        conLaiMs = new Date(b.hanNop).getTime() - now
      }

      const conLaiChu = dinhDangConLai(conLaiMs)
      let tt: DongRadarDeadline['trangThai'] = 'binh_thuong'
      if (conLaiMs !== undefined && conLaiMs <= 0) {
        tt = 'qua_han'
        countQuaHan++
      } else if (conLaiMs !== undefined && conLaiMs <= 12 * 3600 * 1000) {
        tt = 'khan_cap'
        countSapHetHan++
      } else if (conLaiMs !== undefined && conLaiMs <= 24 * 3600 * 1000) {
        tt = 'sap_den'
        countSapHetHan++
      }

      radarItems.push({
        id: `bt_${b.maBtvn || b.maCa}`,
        tieuDe: b.tieuDe || 'BTVN Thầy giao',
        hanNop: b.hanNop,
        conLaiChu,
        trangThai: tt,
        loai: 'btvn',
      })
    }
  }

  // 6. Streak tính toán
  const soNgayLienTiep = Math.max(1, Math.min(30, dsLichSu.length > 0 ? (dsLichSu.length % 7) + 1 : 1))
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
    thongDiepThu = `Chỉ còn ${expCanLenCap - expHienTai} EXP nữa là ${tenThu} lên cấp ${cap + 1}! Hoàn thành 1 bài tập là đủ EXP.`
  }

  // 8. Lời khuyên Sư phạm của Thầy Đỗ Đại Học
  let tieuDeLoiKhuyen = `Chào em ${hoTen || ''}! Hãy giữ vững nhịp độ mỗi ngày`
  let noiDungLoiKhuyen = `Mỗi ngày em chỉ cần hoàn thành 10-12 câu vừa sức theo đúng gợi ý của Trợ lý. Kiến thức ngấm sâu từng ngày chắc chắn sẽ mang lại kết quả bứt phá.`
  let mucDoTapTrung: KeHoachNgayTroLy['loiKhuyenSuPham']['mucDoTapTrung'] = 'duy_tri_phong_do'

  if (countQuaHan > 0 || countSapHetHan > 0) {
    tieuDeLoiKhuyen = 'Ưu tiên giải quyết các bài sắp đến hạn trước'
    noiDungLoiKhuyen = 'Em hãy tập trung làm trước các bài tập có hạn nộp trong ngày để giữ trọn vẹn điểm chuyên cần và không bị dồn bài nhé.'
    mucDoTapTrung = 'go_loi_cot_loi'
  } else if (tongCauSai >= 15) {
    tieuDeLoiKhuyen = 'Tập trung bịt dứt điểm các lỗi sai căn bản'
    noiDungLoiKhuyen = 'Sai ở đâu đứng lên ở đó. Khi em hiểu rõ vì sao mình sai ở câu Nhận biết, em sẽ không bao giờ mắc lại bẫy đó trong đề thi thật.'
    mucDoTapTrung = 'go_loi_cot_loi'
  } else if (soCauDaLamHomNay >= nganSach.mucTieuCau) {
    tieuDeLoiKhuyen = 'Xuất sắc! Em đã hoàn thành chỉ tiêu học tập hôm nay'
    noiDungLoiKhuyen = 'Em có thể nghỉ ngơi thư giãn hoặc thử sức với 1-2 câu Vòng 3 Thử Thách để nhận thêm x2 EXP nuôi Thần Thú.'
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

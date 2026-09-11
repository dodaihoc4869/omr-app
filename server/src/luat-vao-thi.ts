// LUẬT CHO VÀO THI — thuần logic, không chạm cơ sở dữ liệu.
//
// Chép ĐÚNG luật của `quyetDinhVaoThi_` bên Apps Script (đã có test ở
// `tests/apps-script-vao-thi.test.ts`). Tách riêng để test được không cần D1,
// và để hai máy chủ không bao giờ xử khác nhau cho cùng một em.
import type { DongCa, DongLuot } from './kieu'

export type LyDoChan =
  | 'khong_co_ca' | 'da_xoa' | 'da_dong' | 'dang_lam_may_khac'
  | 'da_nop' | 'chua_mo' | 'het_han_vao' | 'thieu'

export type CachVao = 'moi' | 'khoi_phuc' | 'duyet_lai'

export interface QuyetDinh {
  ok: boolean
  cach?: CachVao
  lyDo?: LyDoChan
  lanThu?: number
}

function ms(iso: string | null | undefined): number {
  const t = new Date(String(iso ?? '')).getTime()
  return Number.isFinite(t) ? t : NaN
}

/** `luot` = lượt MỚI NHẤT của SBD trong ca, hoặc null nếu em chưa vào bao giờ. */
export function quyetDinhVaoThi(ca: DongCa | null, luot: DongLuot | null, idThietBi: string, nowMs: number): QuyetDinh {
  if (!ca) return { ok: false, lyDo: 'khong_co_ca' }
  if (ca.trang_thai === 'da_xoa') return { ok: false, lyDo: 'da_xoa' }
  if (ca.trang_thai === 'dong') return { ok: false, lyDo: 'da_dong' }

  const batDau = ms(ca.bat_dau)
  if (Number.isFinite(batDau) && nowMs < batDau) return { ok: false, lyDo: 'chua_mo' }

  // Em ĐÃ VÀO rồi thì xét trước hạn vào phòng: vào đúng giờ mà mất mạng, quay
  // lại sau khi quá hạn vẫn phải khôi phục được bài đang làm dở.
  if (luot) {
    if (luot.trang_thai === 'da_nop' || luot.trang_thai === 'khoa') {
      return { ok: false, lyDo: 'da_nop', lanThu: luot.lan_thu }
    }
    if (luot.trang_thai === 'dang_lam') {
      if (luot.id_thiet_bi && luot.id_thiet_bi !== idThietBi) {
        return { ok: false, lyDo: 'dang_lam_may_khac', lanThu: luot.lan_thu }
      }
      return { ok: true, cach: 'khoi_phuc', lanThu: luot.lan_thu }
    }
    // THẦY VỪA DUYỆT CHO THI LẠI. Lượt mới đã được tạo sẵn ở trạng thái chờ,
    // nên em vào ĐÚNG lượt ấy — không đẻ thêm lần thử thứ ba, và KHÔNG bị hạn
    // vào phòng chặn: thầy duyệt sau giờ đóng cửa là chuyện thường.
    if (luot.trang_thai === 'duoc_duyet_lai') {
      return { ok: true, cach: 'duyet_lai', lanThu: luot.lan_thu }
    }
  }

  const hetHan = ms(ca.het_han_vao)
  if (Number.isFinite(hetHan) && nowMs > hetHan) return { ok: false, lyDo: 'het_han_vao' }
  return { ok: true, cach: 'moi', lanThu: (luot?.lan_thu ?? 0) + 1 }
}

/** Mốc hết giờ của một lượt. Bài tập về nhà đi theo HẠN NỘP, không đếm ngược. */
export function mocHetGio(ca: DongCa, vaoLucMs: number): string {
  if (ca.loai === 'baitap') return ca.han_nop || ''
  const phut = Number(ca.thoi_gian_phut) || 45
  return new Date(vaoLucMs + phut * 60000).toISOString()
}

export function khoaLuot(maCa: string, sbd: string, lanThu: number): string {
  return `${maCa}|${sbd}|${lanThu}`
}

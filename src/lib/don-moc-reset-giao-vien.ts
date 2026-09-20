// DỌN BỘ NHỚ MÁY THẦY THEO `mocReset` (thầy chốt 19/09/2026: 00:01 thứ Hai 21/09 máy chủ làm mới dữ liệu học sinh).
//
// ĐỔI 21/09 (Boss chuyển lệnh thầy): reset GIỮ TOÀN BỘ ca thi ⇒ danh sách DỌN ở `exam-db.ts` nay RỖNG — máy thầy không xoá gì và
// không báo gì. Tệp này giữ nguyên CƠ CHẾ (kích hoạt theo mốc máy chủ, một giao dịch nguyên tử, dấu "đã dọn theo mốc") để lần sau
// đổi ý chỉ việc thêm tên vào danh sách, không dựng lại.
//
// PHẠM VI — hẹp có chủ ý (0.Planer duyệt 19/09):
//   · CHỈ IndexedDB `omr-exam` (danh sách nhóm dọn nằm ở `exam-db.ts`). KHÔNG đụng localStorage/sessionStorage: dọn hai thứ
//     ấy là việc của `don-moc-reset.ts` (cổng học sinh / phụ huynh, chung gốc với app này). Đặc biệt `omr_student_portal_auth`,
//     `omr_ph_sbd`, `ddh.em.*` PHẢI GIỮ — tài khoản + mật khẩu được giữ qua reset, dọn là đăng xuất cả trường sáng thứ Hai.
//   · CHỈ khi đang ở vai giáo viên (`laManThayQuanLy`).
//
// KÍCH HOẠT — CHỈ theo `mocReset` do MÁY CHỦ trả trong phản hồi `danhSachCa` (chuỗi như "2026-09-21", CHỈ có sau khi job reset
// chạy xong). KHÔNG có mốc cứng theo đồng hồ: thầy còn cờ HUỶ reset tới phút chót, huỷ mà máy tự dọn theo giờ thì mất bank của
// các ca đang dùng thật. Mất mạng ⇒ không nhận được mốc ⇒ không dọn ⇒ cũng không đẩy được gì lên máy chủ: an toàn.
//
// Gọi ở chỗ nhận phản hồi `danhSachCa` (exam-api.ts `danhSachCaThat`), TRƯỚC khi ai cất thêm gì vào cache. Không bao giờ ném
// lỗi ra ngoài — danh sách ca của thầy quan trọng hơn việc dọn.
import { docMocResetDaDon, donDuLieuTheoMocReset, type KetQuaDonKhiReset } from './exam-db'
import { laManThayQuanLy } from './vai-tro'

export type LyDoKhongDon = 'khong_co_moc' | 'khong_phai_thay' | 'da_don_roi' | 'loi'
export type KetQuaDonMoc = { daDon: true; ket: KetQuaDonKhiReset; moc: string } | { daDon: false; lyDo: LyDoKhongDon }

/** Mốc hợp lệ: chuỗi ngắn gồm chữ, số, `.`, `_`, `:`, `-` (như "2026-09-21"). Mọi thứ khác (rỗng, số, đối tượng, chuỗi dài lạ) coi
 * như KHÔNG có mốc — đừng dọn theo dữ liệu không đọc được. */
export function chuanMocReset(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return /^[0-9A-Za-z][0-9A-Za-z._:-]{0,39}$/.test(s) ? s : null
}

export interface PhuThuocDonMoc {
  laThay: () => boolean
  docDaDon: () => Promise<string>
  don: (moc: string) => Promise<KetQuaDonKhiReset>
}

// Phụ thuộc mặc định tra LÚC DÙNG (không đọc export nào lúc nạp module): `exam-api.ts` nạp tệp này, mà nhiều test thay `exam-db` /
// `appStore` bằng bản giả chỉ có vài hàm — đọc sớm là vỡ chúng dù mốc reset không bao giờ tới.
const MAC_DINH: PhuThuocDonMoc = {
  laThay: () => typeof location !== 'undefined' && laManThayQuanLy(location.search, location.pathname),
  docDaDon: () => docMocResetDaDon(),
  don: (moc) => donDuLieuTheoMocReset(moc),
}

// Nhiều lệnh `danhSachCa` cùng nhận mốc một lúc thì chỉ MỘT lượt dọn chạy.
const dangDon = new Map<string, Promise<KetQuaDonMoc>>()

/** Dọn nếu (và chỉ nếu) máy chủ báo một mốc reset mà máy này CHƯA dọn. */
export function donTheoMocReset(mocTho: unknown, pt: Partial<PhuThuocDonMoc> = {}): Promise<KetQuaDonMoc> {
  const moc = chuanMocReset(mocTho)
  if (!moc) return Promise.resolve({ daDon: false, lyDo: 'khong_co_moc' })
  const p = { ...MAC_DINH, ...pt }
  if (!p.laThay()) return Promise.resolve({ daDon: false, lyDo: 'khong_phai_thay' })
  const dang = dangDon.get(moc)
  if (dang) return dang
  const lam = (async (): Promise<KetQuaDonMoc> => {
    try {
      if ((await p.docDaDon()) === moc) return { daDon: false, lyDo: 'da_don_roi' }
      const ket = await p.don(moc)
      // Không báo thầy: từ 21/09 danh sách dọn rỗng (giữ toàn bộ ca thi) nên không có gì để nói.
      return { daDon: true, ket, moc }
    } catch (e) {
      console.warn('[mocReset] không dọn được bộ nhớ máy thầy — lần sau thử lại:', e)
      return { daDon: false, lyDo: 'loi' }
    }
  })().finally(() => {
    dangDon.delete(moc)
  })
  dangDon.set(moc, lam)
  return lam
}

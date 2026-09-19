// DỌN BỘ NHỚ MÁY THẦY THEO `mocReset` (thầy chốt 19/09/2026: 00:01 thứ Hai 21/09 máy chủ xoá toàn bộ dữ liệu học sinh).
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

/** Một dòng cho thầy. Mốc dạng ngày `yyyy-mm-dd` thì nói rõ ngày; mốc khác thì nói chung. */
export function chuThongBaoMocReset(moc: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(moc)
  const ngay = m ? ` ngày ${m[3]}/${m[2]}` : ''
  return `Hệ thống đã làm mới${ngay} — dữ liệu ca cũ trong máy đã được dọn`
}

export interface PhuThuocDonMoc {
  laThay: () => boolean
  docDaDon: () => Promise<string>
  don: (moc: string) => Promise<KetQuaDonKhiReset>
  baoThay: (chu: string) => void
}

// Phụ thuộc mặc định tra LÚC DÙNG (không đọc export nào lúc nạp module): `exam-api.ts` nạp tệp này, mà nhiều test thay `exam-db` /
// `appStore` bằng bản giả chỉ có vài hàm — đọc sớm là vỡ chúng dù mốc reset không bao giờ tới.
const MAC_DINH: PhuThuocDonMoc = {
  laThay: () => typeof location !== 'undefined' && laManThayQuanLy(location.search, location.pathname),
  docDaDon: () => docMocResetDaDon(),
  don: (moc) => donDuLieuTheoMocReset(moc),
  baoThay: (chu) => {
    void import('../store/appStore').then((m) => m.useAppStore.getState().showToast(chu, 'success'))
  },
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
      // Chỉ báo thầy khi thật sự có gì để dọn — máy mới tinh thì im lặng.
      if (ket.soBanGhi + ket.soKhoaSettings > 0) p.baoThay(chuThongBaoMocReset(moc))
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

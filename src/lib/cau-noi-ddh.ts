// CẦU NỐI `window.__ddh` — APP-CAN-MO-DUONG-CHO-COWORK.md mục 3.
//
// VÌ SAO CẦN.
//
// Mật khẩu mở app mã hoá mã bí mật; sau khi thầy nhập đúng, mã sống trong bộ
// nhớ module (`exam-db.maBiMatPhien`) chứ không còn nằm chữ thường trong
// IndexedDB. Đó là điều đúng và không đổi. Nhưng phiên Cowork gửi Zalo chạy
// bằng JavaScript trong CHÍNH tab này lại không còn đường nào gọi các lệnh cần
// quyền: mọi lệnh trả về "Sai mã bí mật".
//
// Cầu nối này là lối vào các lệnh ĐÃ CÓ, không phải một quyền mới.
//
// BA LUẬT CỨNG, quan trọng ngang tính năng:
//
// 1. KHÔNG hàm nào trả mã bí mật, KHÔNG thuộc tính nào chứa nó. Mã bí mật được
//    đọc ngay trước mỗi lượt gọi rồi vứt; đối tượng `window.__ddh` chỉ có hàm.
//    Cấm `window.__ddh.secret` — có bộ kiểm quét chuỗi bắt điều này.
// 2. Cầu nối CHỈ tồn tại khi app ĐANG MỞ KHOÁ. Khoá lại, hết hạn hỏi lại, hay
//    đóng app thì `window.__ddh` biến mất. Nó không phải cửa sau: chưa nhập
//    đúng mật khẩu thì không có gì để gọi.
// 3. Không ghi gì xuống đĩa. Cầu nối không cất, không nhớ, không đệm.
//
// Đây vẫn KÍN HƠN hiện trạng trước khi có mật khẩu: hồi đó mã bí mật nằm chữ
// thường trong IndexedDB, ai mở công cụ nhà phát triển cũng đọc được rồi gọi
// Apps Script từ máy khác. Cầu nối chỉ sống trong tab đang mở khoá.
import { coMaBiMatPhien, loadScriptUrl, loadTeacherSecret } from './exam-db'
import { chiTietCa, danhSachCa, danhSachEm, phieuTheoCa, type ChiTietCa, type CaTomTat, type EmTomTat, type PhieuCuaCa } from './exam-api'
import { taoPhieuCaCa, type KetQuaTaoPhieuCaCa } from './phieu-ca-ca'
import { taoLinkPhieu } from './phieu-link'

/** Tên biến trên `window`. Một chỗ khai, để bộ kiểm và tài liệu không lệch. */
export const TEN_CAU_NOI = '__ddh'

export interface CauNoiDdh {
  /** Đã mở khoá chưa. Bên gọi dùng để biết lúc nào phải nhắc thầy nhập mật khẩu. */
  sanSang: () => boolean
  danhSachCa: () => Promise<CaTomTat[]>
  chiTietCa: (maCa: string, xinKeyBank?: boolean) => Promise<ChiTietCa>
  danhSachEm: () => Promise<EmTomTat[]>
  phieuTheoCa: (maCa: string) => Promise<PhieuCuaCa[]>
  /** Dựng nốt phiếu cho em chưa có rồi trả link của MỌI em đã chấm trong ca. */
  taoPhieuCaCa: (maCa: string) => Promise<KetQuaTaoPhieuCaCa>
  /** Dựng link `/p#<mã>` từ một mã phiếu đã có. Thuần chuỗi, không gọi máy chủ. */
  linkPhieu: (ma: string) => string
}

/** Gốc đường dẫn app — `taoLinkPhieu` cần nó để dựng link phụ huynh mở được. */
function gocApp(): string {
  return `${location.origin}${import.meta.env.BASE_URL}`
}

/** Đọc link Apps Script + mã bí mật NGAY TRƯỚC mỗi lượt gọi.
 *
 * Cố ý không giữ trong biến đóng: thầy khoá app giữa chừng thì lượt gọi tiếp
 * theo phải hỏng vì không có chìa, chứ không chạy tiếp bằng chìa cũ. */
async function chia(): Promise<{ url: string; mat: string }> {
  if (!coMaBiMatPhien() && !(await loadTeacherSecret())) {
    throw new Error('App đang khoá — thầy nhập mật khẩu rồi gọi lại')
  }
  const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
  if (!url.trim()) throw new Error('Chưa cấu hình link Apps Script')
  if (!mat.trim()) throw new Error('App đang khoá — thầy nhập mật khẩu rồi gọi lại')
  return { url: url.trim(), mat: mat.trim() }
}

/** Dựng đối tượng cầu nối. Tách khỏi `gan()` để bộ kiểm gọi thẳng được. */
export function dungCauNoi(): CauNoiDdh {
  return {
    sanSang: () => coMaBiMatPhien(),
    danhSachCa: async () => {
      const { url, mat } = await chia()
      return danhSachCa(url, mat)
    },
    chiTietCa: async (maCa, xinKeyBank) => {
      const { url, mat } = await chia()
      return chiTietCa(url, mat, String(maCa || '').trim(), xinKeyBank)
    },
    danhSachEm: async () => {
      const { url, mat } = await chia()
      return danhSachEm(url, mat)
    },
    phieuTheoCa: async (maCa) => {
      const { url, mat } = await chia()
      return phieuTheoCa(url, mat, String(maCa || '').trim())
    },
    taoPhieuCaCa: async (maCa) => {
      const { url, mat } = await chia()
      return taoPhieuCaCa(url, mat, String(maCa || '').trim(), gocApp())
    },
    linkPhieu: (ma) => taoLinkPhieu(gocApp(), String(ma || '').trim()),
  }
}

type CuaSoCoCauNoi = Window & { [TEN_CAU_NOI]?: CauNoiDdh }

/** GẮN cầu nối. Gọi khi app vào trạng thái đã mở khoá. */
export function ganCauNoi(w: Window = window): void {
  ;(w as CuaSoCoCauNoi)[TEN_CAU_NOI] = dungCauNoi()
}

/** GỠ cầu nối. Gọi khi khoá lại, hết hạn hỏi lại, hoặc rời app quản lý. */
export function goCauNoi(w: Window = window): void {
  delete (w as CuaSoCoCauNoi)[TEN_CAU_NOI]
}

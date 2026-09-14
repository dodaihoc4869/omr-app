/**
 * BOT — phải nhảy HỤT THẬT và dẫm TRƯỢT THẬT.
 *
 * Cấm "trúng theo xác suất": bot không được tàng hình ăn điểm. Mỗi lần bot
 * quyết định sai thì nó vẫn nhảy, vẫn có quỹ đạo thật, và vẫn rơi xuống vực
 * thật. Có thế em mới thấy bot cũng hỏng như mình.
 *
 * BOT KHÔNG BAO GIỜ CHẠM CÔNG CHÚA. Cho bot thắng thì ván tự kết thúc mà em
 * không làm gì. Bot chỉ thắng bằng cách loại hết người thật.
 */
import { CAU_HINH } from './cau-hinh'
import { coDat, type Dao } from './man-choi'
import { biKhacChe } from './bang-khac-che'
import type { NguoiChoi } from './types'

export interface NaoBot {
  /** Bộ sinh riêng của con bot này — cùng hạt giống thì cùng cách chơi. */
  r: () => number
  /** Còn bao lâu mới được ra quyết định kế (thời gian phản xạ). */
  chờ: number
  /** Quyết định nhảy đang giữ. */
  dinhNhay: boolean
  /** Lần này bot quyết định ĐÚNG hay SAI — chốt trước khi nhảy, không sửa giữa chừng. */
  lanNayDung: boolean
  /** Độ chính xác, lấy theo mức độ khó. */
  doChinhXac: number
}

export function taoNao(r: () => number, doChinhXac = CAU_HINH.BOT_DO_CHINH_XAC): NaoBot {
  return { r, chờ: 0, dinhNhay: false, lanNayDung: true, doChinhXac }
}

/**
 * Bot nghĩ. Ghi thẳng vào `n.phim`.
 * `moc` là x xa nhất bot được phép tới — với bot luôn là cửa hang, KHÔNG tới công chúa.
 */
export function nghiBot(
  n: NguoiChoi, nao: NaoBot, dao: Dao, moiNguoi: readonly NguoiChoi[], giay: number, moc: number,
): void {
  nao.chờ -= 1 / CAU_HINH.FPS_MUC_TIEU
  if (n.x >= moc) { n.phim.trai = false; n.phim.phai = false; return }

  // ——— luôn tiến về cuối đảo
  n.phim.phai = true
  n.phim.trai = false

  // ——— thấy người thật ở ngay dưới thì nhảy lên đầu
  let mucTieu: NguoiChoi | null = null
  for (const k of moiNguoi) {
    if (k === n || !k.song || k.batTuDen > giay) continue
    const dx = k.x - n.x
    if (dx > 10 && dx < 190 && k.y <= n.y + 40) {
      if (mucTieu === null || Math.abs(dx) < Math.abs(mucTieu.x - n.x)) mucTieu = k
    }
  }

  if (nao.chờ <= 0) {
    nao.chờ = CAU_HINH.BOT_GIAY_PHAN_XA
    // Chốt ĐÚNG/SAI một lần cho quyết định này. Bot sai thì vẫn nhảy thật.
    nao.lanNayDung = nao.r() < nao.doChinhXac

    if (mucTieu !== null) {
      // Bot "thuộc bài" mới tránh người khắc chế mình. Bot sai thì nhảy bừa và tự mất mạng.
      const nen = nao.lanNayDung ? !biKhacChe(n.hoaChat, mucTieu.hoaChat) : true
      nao.dinhNhay = nen
    } else {
      // ——— sắp tới vực thì nhảy
      const truoc = n.x + 70
      const sapRoi = !coDat(dao, truoc) || !coDat(dao, n.x + 130)
      // Bot sai thì nhảy MUỘN — quỹ đạo thật, và rơi xuống vực thật.
      nao.dinhNhay = sapRoi && nao.lanNayDung
    }
  }

  if (nao.dinhNhay && n.chamDat) {
    n.phim.nhayLuc = giay
    nao.dinhNhay = false
  }
}

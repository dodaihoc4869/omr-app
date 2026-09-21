// CỬA HÀNG PHỤ KIỆN — NỐI MÁY CHỦ THẬT (bước B5, phía máy em). Năm lệnh `/game-v2/…` theo docs/hop-dong-shop-phu-kien-2109.md mục 3:
// vang-xem · vang-doi · shop-danh-sach · shop-mua · thu-mac-do. Trả đúng hình `ShopApi` của màn (kieu.ts); lỗi ném `LoiShopApi(ma, loi)`.
// - Lời lỗi của máy chủ (`loi`, chữ chốt mục 9.3) đi thẳng lên màn — KHÔNG viết lại; thiếu `loi` thì dùng `error`, thiếu cả hai thì chữ chung ở chu-shop.ts.
// - Rớt mạng / hết giờ / thân không đọc được ⇒ `mat_mang` (màn giữ khoá yêu cầu của lần mua/đổi để bấm lại không ghi hai lần; máy chủ idempotent theo khoaYeuCau).
// - Số dư (vàng, ống nghiệm) luôn là số máy chủ trả; tệp này không lưu, không cộng trừ. Token của em chỉ đi ở thân yêu cầu (như mọi lệnh game), không lưu ở đâu.
// - MỘT lượt gọi có hạn 20 giây. Không tự thử lại (nhịp thử lại là việc của màn + nút "Thử lại", không phải vòng nền).
import { chuLoiKhongRo, loiMayChu } from './chu-shop'
import { LoiShopApi, MA_MAT_MANG } from './kieu'
import type { DapDanhSach, DapDoi, DapMacDo, DapMua, ShopApi, ViSo } from './kieu'

export interface NguonGoiShop {
  /** Địa chỉ gốc của máy chủ (như `layDiaChiMayChu` của game). */
  layDiaChi: () => Promise<string>
  /** Token phiên game của em. */
  token: string
  fetchFn?: typeof fetch
  hanMs?: number
}

export const HAN_GOI_SHOP_MS = 20_000

const laDoiTuong = (x: unknown): x is Record<string, unknown> => x !== null && typeof x === 'object' && !Array.isArray(x)

export function taoShopApiThat(n: NguonGoiShop): ShopApi {
  const goi = async <T>(lenh: string, than: Record<string, unknown> = {}): Promise<T> => {
    const dieuKhien = new AbortController()
    const gio = setTimeout(() => dieuKhien.abort(), n.hanMs ?? HAN_GOI_SHOP_MS)
    let d: unknown
    try {
      const goc = await n.layDiaChi()
      const res = await (n.fetchFn ?? fetch)(`${goc}/game-v2/${lenh}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...than, token: n.token }),
        signal: dieuKhien.signal,
      })
      d = await res.json()
    } catch {
      throw new LoiShopApi(MA_MAT_MANG, loiMayChu.matMang)
    } finally {
      clearTimeout(gio)
    }
    if (!laDoiTuong(d) || d.ok !== true) {
      const o = laDoiTuong(d) ? d : {}
      const loi = typeof o.loi === 'string' && o.loi.trim() ? o.loi : typeof o.error === 'string' && o.error.trim() ? o.error : chuLoiKhongRo
      throw new LoiShopApi(typeof o.ma === 'string' && o.ma ? o.ma : 'loi_may_chu', loi)
    }
    return d as T
  }
  return {
    vangXem: () => goi<ViSo>('vang-xem'),
    vangDoi: (soExp, khoaYeuCau) => goi<DapDoi>('vang-doi', { soExp, khoaYeuCau }),
    shopDanhSach: () => goi<DapDanhSach>('shop-danh-sach'),
    shopMua: (maMon, giaThay, khoaYeuCau) => goi<DapMua>('shop-mua', { maMon, giaThay, khoaYeuCau }),
    thuMacDo: (oGan, maMon) => goi<DapMacDo>('thu-mac-do', { oGan, maMon }),
  }
}

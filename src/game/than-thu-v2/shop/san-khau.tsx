// CỬA HÀNG PHỤ KIỆN — SÂN KHẤU THỬ ĐỒ: thần thú CỦA EM đứng trên bệ sáng; sân khấu LUÔN là đêm (kể cả giao diện sáng) để ánh sáng phụ kiện nổi.
// Điểm cắm `veThu`: mặc định = `ThuHinh` (thú thật) + lớp CSS giữ chỗ (vòng sáng dưới chân, vệt, khung tên) theo màu bậc của món;
// sau này Code 4 đưa `ThuMacDo` vào đây (nó vẽ SVG thật, nhận đúng `dangMac` này) — màn không đổi.
import { ThuHinh } from '../DoanHinh'
import { chuDangThu, chuDoThanThuDangMac, chuThuCuaEm } from './chu-shop'
import type { DangMac, MonShop, VeThu } from './kieu'
import { demDangThu } from './logic-shop'

/** Cạnh hộp thú trên sân khấu (px). */
export const CO_THU_SAN = 172

/** Bản vẽ mặc định: thú thật + lớp giữ chỗ bằng CSS. Mỗi lớp có `key` theo mã món nên đổi món thì lớp mới hiện vào (chuyển lớp 220 ms). */
export function taoVeThuMacDinh(mon: readonly MonShop[]): VeThu {
  const theoMa = new Map(mon.map((m) => [m.ma, m] as const))
  const tim = (ma: string | null | undefined) => (ma ? theoMa.get(ma) : undefined)
  return ({ dangMac, pet, cap, size, ten, nhan }) => {
    const hq = tim(dangMac['hao-quang'])
    const vet = tim(dangMac.vet)
    const khung = tim(dangMac.khung)
    return (
      <div className="ps-thu-cho" style={{ width: size }}>
        <div className="ps-thu-hop" style={{ width: size, height: size }}>
          {hq && <span key={hq.ma} className={`ps-gc ps-gc-hq ps-bac-${hq.bac}`} data-mon={hq.ma} />}
          {vet && <span key={vet.ma} className={`ps-gc ps-gc-vet ps-bac-${vet.bac}`} data-mon={vet.ma} />}
          <ThuHinh pet={pet} cap={cap} size={size} />
        </div>
        {ten ? (
          <span key={khung?.ma ?? 'khong'} className={`ps-gc ps-gc-khung${khung ? ` ps-bac-${khung.bac}` : ''}`} data-mon={khung?.ma ?? ''}>
            <small>{nhan}</small>
            <strong>{ten}</strong>
          </span>
        ) : null}
      </div>
    )
  }
}

export interface SanKhauProps {
  pet: number
  cap: number
  /** Món hiện trên thú = món đang THỬ đè lên món đang MẶC. */
  hienThi: DangMac
  /** Món đang thử (để nói "Đang thử N phụ kiện"). */
  dangThu: DangMac
  tenThu?: string
  mon: readonly MonShop[]
  veThu?: VeThu
}

export default function SanKhau({ pet, cap, hienThi, dangThu, tenThu, mon, veThu }: SanKhauProps) {
  const ve = veThu ?? taoVeThuMacDinh(mon)
  const n = demDangThu(dangThu)
  return (
    <div className="ps-san">
      <span className="ps-san-trang" aria-hidden="true" />
      <span className="ps-san-nhan">{n > 0 ? chuDangThu(n) : chuDoThanThuDangMac}</span>
      <span className="ps-san-be" aria-hidden="true" />
      <div className="ps-san-thu" role="img" aria-label={chuThuCuaEm(tenThu)}>
        {ve({ dangMac: hienThi, pet, cap, size: CO_THU_SAN, ten: tenThu ?? '' })}
      </div>
    </div>
  )
}

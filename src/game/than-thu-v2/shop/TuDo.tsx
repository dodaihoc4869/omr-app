// MÀN 4 · TỦ ĐỒ — năm chỗ đeo, mỗi chỗ liệt kê món em ĐÃ CÓ; chạm "Mặc ngay" / "Cởi ra"; chạm tên món để đọc lại Bật mí Hoá học.
// Xem được cả khi Cửa hàng tạm đóng hoặc mất mạng (dùng danh sách của lần tải trước). Chưa có danh sách ⇒ khung xám / lời máy chủ + "Thử lại".
import { useState } from 'react'
import { BtTu } from './bieu-tuong'
import { DauMan, KhoiLoi } from './chung'
import { CAC_O } from './kieu'
import type { MonShop, OGan } from './kieu'
import { TEN_BAC, TEN_O, chuBatMi, chuCoiRa, chuMacNgay, chuOTrong, chuSapMo, chuToiCuaHang, chuTrangThai, chuTuDo, chuTuDoPhu, chuTuDoTrong, chuVeCuaHang } from './chu-shop'

export interface TuDoProps {
  /** `null` = chưa có danh sách (đang tải, hoặc tải hỏng). */
  mon: readonly MonShop[] | null
  dangTai: boolean
  /** Lời máy chủ khi chưa có danh sách và tải hỏng / cửa hàng đóng. */
  loiTai: string
  /** Cửa hàng đang đóng: không có "Thử lại". */
  dong: boolean
  sapMo: (o: OGan) => boolean
  bao: string
  loiMac: { loi: string; thuLai: () => void } | null
  /** Mã món đang gửi lệnh mặc/cởi (khoá nút của món ấy). */
  dangGui: string | null
  onMac: (m: MonShop) => void
  onCoi: (m: MonShop) => void
  onVe: () => void
  onToiCuaHang: () => void
  onThuLai: () => void
}

function HangTu({ m, dangGui, moBatMi, onBatMi, onMac, onCoi }: { m: MonShop; dangGui: boolean; moBatMi: boolean; onBatMi: () => void; onMac: (m: MonShop) => void; onCoi: (m: MonShop) => void }) {
  return (
    <li className={`ps-tu-hang ps-bac-${m.bac}`} data-ma={m.ma}>
      <button type="button" className="ps-tu-ten" aria-expanded={moBatMi} onClick={onBatMi}>
        <span className="ps-ngoc" aria-hidden="true" />
        <span className="ps-thu-chu">
          <b>{m.ten}</b>
          <span>
            <span className="ps-bac-chu">{TEN_BAC[m.bac]}</span>
            {m.dangMac && <> · {chuTrangThai.dangMac}</>}
          </span>
        </span>
      </button>
      <button type="button" className="ps-nut-nho" data-viec={m.dangMac ? 'coi' : 'mac'} disabled={dangGui} onClick={() => (m.dangMac ? onCoi(m) : onMac(m))}>
        {m.dangMac ? chuCoiRa : chuMacNgay}
      </button>
      {moBatMi && (
        <p className="ps-bat-mi ps-tu-bat-mi">
          <b>{chuBatMi}</b>
          {m.batMi}
        </p>
      )}
    </li>
  )
}

export default function TuDo(p: TuDoProps) {
  const [mo, setMo] = useState<string | null>(null)
  const dau = <DauMan tieuDe={chuTuDo} phu={chuTuDoPhu} nhanVe={chuVeCuaHang} onVe={p.onVe} />
  if (p.mon === null) {
    return (
      <>
        {dau}
        {p.dangTai ? (
          <div className="ps-tu-xam" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="ps-tu-hang ps-xam" aria-hidden="true" />
            ))}
          </div>
        ) : (
          <KhoiLoi loi={p.loiTai} onThuLai={p.dong ? undefined : p.onThuLai} />
        )}
      </>
    )
  }
  const co = p.mon.filter((m) => m.daCo)
  if (co.length === 0) {
    return (
      <>
        {dau}
        <div className="ps-kinh ps-tu-trong">
          <BtTu c={28} />
          <p>{chuTuDoTrong}</p>
          <button type="button" className="ps-nut-vang" onClick={p.onToiCuaHang}>
            <span>{chuToiCuaHang}</span>
          </button>
        </div>
      </>
    )
  }
  return (
    <>
      {dau}
      <p className="ps-bao ps-cho-1" role="status" aria-live="polite">
        {p.bao}
      </p>
      {CAC_O.map((o) => {
        const ds = co.filter((m) => m.oGan === o).sort((a, b) => a.gia - b.gia || a.ma.localeCompare(b.ma))
        const sap = ds.length === 0 && p.sapMo(o)
        return (
          <section key={o} className="ps-kinh ps-tu-o" aria-labelledby={`ps-tu-${o}`} data-o={o}>
            <h3 id={`ps-tu-${o}`}>
              {TEN_O[o]}
              {sap && <em>{chuSapMo}</em>}
            </h3>
            {ds.length === 0 ? (
              <p className="ps-ghi-chu">{chuOTrong}</p>
            ) : (
              <ul>
                {ds.map((m) => (
                  <HangTu key={m.ma} m={m} dangGui={p.dangGui === m.ma} moBatMi={mo === m.ma} onBatMi={() => setMo((c) => (c === m.ma ? null : m.ma))} onMac={p.onMac} onCoi={p.onCoi} />
                ))}
              </ul>
            )}
          </section>
        )
      })}
      {p.loiMac && <KhoiLoi loi={p.loiMac.loi} onThuLai={p.loiMac.thuLai} />}
    </>
  )
}

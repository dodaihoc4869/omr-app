// ĐỒNG HỒ SỨC CHỨA (bản vẽ GV-GiaoChienDich): khối lượng lượt em ở giữa lớp cần so với D ngày × thể lực/ngày.
// Xanh ≤ 70% · vàng 70–90% · đỏ > 90%. Màu không là kênh duy nhất: luôn kèm % và chữ "vừa sức / sát / quá tải".
import type { SucChua } from './api'
import { hienNgay, phanTram } from './ngay'
import { CHU_MUC, mucSucChua } from './tinh'

export interface RutCon {
  soCau: number
  tiLe: number
}

export default function DongHoSucChua({
  sc,
  dangTinh,
  loi,
  theLuc,
  rutCon,
  onRut,
  onLuiHan,
  onBoRut,
  onTinhLai,
}: {
  sc: SucChua | null
  dangTinh: boolean
  loi: string
  theLuc: number
  rutCon: RutCon | null
  onRut: (r: RutCon) => void
  onLuiHan: (hanNop: string) => void
  onBoRut: () => void
  onTinhLai: () => void
}) {
  if (loi && !dangTinh) {
    return (
      <div className="cd-dong-ho" data-khoi="dong-ho-suc-chua" aria-live="polite">
        <p className="cd-loi">{loi}</p>
        <div>
          <button type="button" className="m3-nut-chu cd-nut-nho" onClick={onTinhLai}>
            Tính lại sức chứa
          </button>
        </div>
      </div>
    )
  }
  if (!sc) {
    return (
      <div className="cd-dong-ho" data-khoi="dong-ho-suc-chua" aria-live="polite" aria-busy={dangTinh}>
        <p className="cd-phu">{dangTinh ? 'Đang tính sức chứa…' : 'Chọn tờ đề, lớp và hạn nộp để tính sức chứa.'}</p>
        <div className="cd-ray" aria-hidden="true" />
      </div>
    )
  }
  // Máy chủ đã áp "rút còn" (soCau đã giảm) ⇒ dùng số máy chủ; chưa áp ⇒ dùng tỉ lệ gợi ý máy chủ vừa tính cho lựa chọn ấy.
  const dungRut = rutCon && sc.soCau > rutCon.soCau ? rutCon : null
  const tiLe = dungRut ? dungRut.tiLe : sc.tiLe
  const muc = dungRut ? mucSucChua(tiLe) : sc.muc
  const khoiLuong = dungRut ? Math.round(tiLe * sc.sucChua) : sc.khoiLuongTrungVi
  const rong = Math.max(0, Math.min(1, Number.isFinite(tiLe) ? tiLe : 1)) * 100
  const cauQuaTai = dungRut ? '' : sc.soEmQuaTai > 0 ? ` ${sc.soEmQuaTai}/${sc.soEm} em quá tải.` : ' Không em nào quá tải.'
  // Vì sao ra số lượt: mỗi câu MỚI cần 2 lượt (đúng 2 lần mới chín), câu đang ôn cần 2 − số lần đúng liên tiếp.
  const tg = !dungRut && sc.tachGiua && sc.tachGiua.cauMoi * 2 + sc.tachGiua.luotOn === khoiLuong ? sc.tachGiua : null
  const viSao = tg ? ` (${tg.cauMoi} câu mới × 2 lượt${tg.luotOn > 0 ? ` + ${tg.luotOn} lượt ôn` : ''})` : ''

  return (
    <div className="cd-dong-ho" data-khoi="dong-ho-suc-chua" data-muc={muc} aria-live="polite" aria-busy={dangTinh}>
      <div className="cd-dong-ho-dau">
        <span id="cd-suc-chua-nhan">Sức chứa tới hạn nộp</span>
        <span>
          <strong data-so="ti-le">{phanTram(tiLe)}</strong> · {CHU_MUC[muc]}
        </span>
      </div>
      <div className="cd-ray" role="meter" aria-labelledby="cd-suc-chua-nhan" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(tiLe * 100)} aria-valuetext={`${phanTram(tiLe)} · ${CHU_MUC[muc]}`}>
        <div className={`cd-ray--${muc}`} data-ray={muc} style={{ width: `${rong}%` }} />
      </div>
      <p className="cd-phu cd-so">
        {dungRut ? `Rút còn ${dungRut.soCau} câu (giữ câu cả lớp sai nhiều): em` : 'Em'} ở giữa lớp cần khoảng {khoiLuong} lượt{viSao} · sức chứa {sc.D} ngày × {theLuc} lượt/ngày = {sc.sucChua} lượt.
        {cauQuaTai}
      </p>
      {dungRut ? (
        <div className="cd-goi-y">
          <button type="button" className="m3-nut-chu cd-nut-nho" onClick={onBoRut}>
            Bỏ rút câu · giữ đủ {sc.soCau} câu
          </button>
        </div>
      ) : (
        sc.goiY &&
        (sc.goiY.rutCon || sc.goiY.luiHan) && (
          <div className="cd-goi-y" role="group" aria-label="Gợi ý đưa sức chứa về mức vừa sức">
            {sc.goiY.rutCon && (
              <button type="button" className="m3-nut-tonal cd-nut-nho" onClick={() => onRut(sc.goiY!.rutCon!)}>
                Rút còn {sc.goiY.rutCon.soCau} câu → {phanTram(sc.goiY.rutCon.tiLe)}
              </button>
            )}
            {sc.goiY.luiHan && (
              <button type="button" className="m3-nut-tonal cd-nut-nho" onClick={() => onLuiHan(sc.goiY!.luiHan!.hanNop)}>
                Lùi hạn nộp tới {hienNgay(sc.goiY.luiHan.hanNop, false)} → {phanTram(sc.goiY.luiHan.tiLe)}
              </button>
            )}
          </div>
        )
      )}
    </div>
  )
}

// KHỐI LƯỢNG SO VỚI THỜI GIAN CÒN LẠI (tên cũ "Sức chứa tới hạn nộp"; bản vẽ docs/ban-ve-gv-2809/GV-GiaoChienDich):
// lượt em ở giữa lớp cần so với D ngày × số lượt câu mỗi ngày.
// Xanh ≤ 70% · vàng 70–90% · đỏ > 90%. Màu không là kênh duy nhất: luôn kèm % và chữ "vừa sức / sát / quá tải".
import type { SucChua } from './api'
import { phanTram } from './ngay'
import { CHU_MUC } from './tinh'

const CHU_MUC_HOA = { xanh: 'Vừa sức', vang: 'Sát', do: 'Quá tải' } as const
/** Số ngày cuối dành để ôn khi rải đều (= `NGAY_DEM` của máy chủ, srs2-loi.ts). */
export const NGAY_ON_CUOI = 3

/**
 * Dòng giải thích rải đều câu mới trên đồng hồ (phản biện vòng 2 PR 110): máy chủ xếp NỢ trước (tối đa nửa số lượt), câu mới lấy phần còn lại
 * ⇒ câu mới chắc chắn có `theLuc − ⌊theLuc/2⌋` lượt/ngày. Vượt ngưỡng ấy ⇒ cảnh báo "khi em còn nợ"; vượt cả số lượt ⇒ cảnh báo dồn ngày cuối.
 * Áp cho CẢ chiến dịch ngắn (D ≤ 3: câu mới giao ngay từ ngày đầu, nhưng vẫn chỉ trong số lượt của ngày).
 */
export function chuRaiDeu(D: number, cauMoi: number, theLuc: number): string {
  const choMoi = theLuc - Math.floor(theLuc / 2)
  const dau = D <= NGAY_ON_CUOI
    ? `Chiến dịch ngắn (không quá 3 ngày): câu mới giao ngay từ ngày đầu (${cauMoi} câu mới).`
    : `Rải đều: khoảng ${cauMoi} câu mới mỗi ngày trong ${D - NGAY_ON_CUOI} ngày đầu, 3 ngày cuối để ôn.`
  if (cauMoi > theLuc) return `${dau} Mỗi ngày chỉ có ${theLuc} lượt — câu mới sẽ dồn sang những ngày cuối. Nên tăng lượt mỗi ngày hoặc lùi hạn.`
  if (cauMoi > choMoi) return `${dau} Khi em còn nợ, câu nợ được xếp trước nên mỗi ngày chỉ chắc chắn có ${choMoi} lượt cho câu mới — em còn nợ nhiều thì câu mới có thể dồn sang những ngày cuối.`
  return dau
}

export default function DongHoSucChua({
  sc,
  dangTinh,
  loi,
  theLuc,
  onTinhLai,
}: {
  sc: SucChua | null
  dangTinh: boolean
  loi: string
  theLuc: number
  onTinhLai: () => void
}) {
  if (loi && !dangTinh) {
    return (
      <div className="cd-dong-ho" data-khoi="dong-ho-suc-chua" aria-live="polite">
        <p className="cd-loi">{loi}</p>
        <div>
          <button type="button" className="m3-nut-chu cd-nut-nho" onClick={onTinhLai}>
            Tính lại
          </button>
        </div>
      </div>
    )
  }
  if (!sc) {
    return (
      <div className="cd-dong-ho" data-khoi="dong-ho-suc-chua" aria-live="polite" aria-busy={dangTinh}>
        <p className="cd-phu">{dangTinh ? 'Đang tính khối lượng…' : 'Chọn tờ đề, em và hạn nộp để tính khối lượng.'}</p>
        <div className="cd-ray" aria-hidden="true" />
      </div>
    )
  }
  const tiLe = sc.tiLe
  const muc = sc.muc
  const khoiLuong = sc.khoiLuongTrungVi
  const rong = Math.max(0, Math.min(1, Number.isFinite(tiLe) ? tiLe : 1)) * 100
  const cauQuaTai = sc.soEmQuaTai > 0 ? ` ${sc.soEmQuaTai}/${sc.soEm} em quá tải.` : ' Không em nào quá tải.'
  // Vì sao ra số lượt: mỗi câu MỚI cần 2 lượt (đúng 2 lần mới chín), câu đang ôn cần 2 − số lần đúng liên tiếp.
  const tg = sc.tachGiua && sc.tachGiua.cauMoi * 2 + sc.tachGiua.luotOn + (sc.tachGiua.luotNoCu ?? 0) === khoiLuong ? sc.tachGiua : null
  const viSao = tg ? ` (${tg.cauMoi} câu mới × 2 lượt${tg.luotOn > 0 ? ` + ${tg.luotOn} lượt ôn` : ''}${tg.luotNoCu ? ` + ${tg.luotNoCu} lượt nợ cũ` : ''})` : ''
  const noCu = sc.noCu ?? []

  return (
    <div className="cd-dong-ho" data-khoi="dong-ho-suc-chua" data-muc={muc} aria-live="polite" aria-busy={dangTinh}>
      <div className="cd-dong-ho-dau">
        <span id="cd-suc-chua-nhan">Khối lượng so với thời gian còn lại</span>
        <span className={`cd-chip-muc cd-chip-muc--${muc}`}>{CHU_MUC_HOA[muc]}</span>
      </div>
      <div className="cd-dong-ho-so">
        <strong data-so="ti-le">{phanTram(tiLe)}</strong>
      </div>
      <div className="cd-ray" role="meter" aria-labelledby="cd-suc-chua-nhan" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(tiLe * 100)} aria-valuetext={`${phanTram(tiLe)} · ${CHU_MUC[muc]}`}>
        <div className={`cd-ray--${muc}`} data-ray={muc} style={{ width: `${rong}%` }} />
      </div>
      <div className="cd-vach-thang cd-so" aria-hidden="true">
        <span style={{ left: 0 }}>0%</span>
        <span style={{ left: '70%' }}>70</span>
        <span style={{ left: '90%' }}>90</span>
      </div>
      <p className="cd-phu cd-so">
        Em ở giữa lớp cần khoảng {khoiLuong} lượt{viSao} · có {sc.D} ngày × {theLuc} lượt/ngày = {sc.sucChua} lượt.
        {cauQuaTai}
      </p>
      {sc.raiDeu && sc.cauMoiMoiNgay != null && (
        <p className="cd-phu cd-so" data-khoi="rai-deu">
          {chuRaiDeu(sc.D, sc.cauMoiMoiNgay, theLuc)}
        </p>
      )}
      {noCu.length > 0 && (
        <ul className="cd-phu" data-khoi="no-cu">
          {noCu.slice(0, 5).map((x) => <li key={x.sbd}>{x.cau}.</li>)}
          {noCu.length > 5 && <li>… và {noCu.length - 5} em nữa.</li>}
        </ul>
      )}
    </div>
  )
}

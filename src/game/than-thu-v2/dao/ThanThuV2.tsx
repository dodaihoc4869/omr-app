// BẢN DUYỆT V2 · MÀN 06 — "THẦN THÚ CỦA EM" (thầy ra lệnh 09/10/2026). Mở từ mục "Thần thú" của thanh dưới (màn Hôm nay V2 / thanh Đảo).
// Số liệu THẬT: loài + biệt danh + cấp + EXP (hồ sơ `profile`), mốc tiến hoá (evolution.ts), số vàng (lệnh cửa hàng `vang-xem`, chỉ khi có phiên).
// Bản duyệt vẽ "Các thần thú khác của em" kèm cấp từng con — mỗi em hiện chỉ có MỘT thần thú, nên khối dưới là bộ sưu tập 8 loài Bát Linh:
// loài của em có cấp + "Đang đồng hành", bảy loài kia chỉ ghi tên và hệ (không bịa cấp). Ảnh: public/than-thu-v2/nho/ (anh.ts).
import { useEffect, useMemo, useState } from 'react'
import { Coins, Lock, PawPrint, Sparkles } from 'lucide-react'
import { PETS } from '../core'
import { EVOLUTION_LEVELS, EVOLUTION_NAMES, evolutionStage } from '../evolution'
import { anhThu, anhThuTheoDang } from './anh'
import { CAP_TOI_DA, chiSoThu, tenThu, vongExp } from './dao-core'
import type { DaoProfile } from './kieu'
import { layDiaChiMayChu } from '../../../lib/dia-chi-may-chu'
import { taoShopApiThat } from '../shop/may-chu-that'
import '../../../styles/ban-duyet-v2.css'
import './than-thu-v2.css'

export interface ThanThuV2Props {
  profile: DaoProfile
  /** Phiên game — có thì đọc số vàng; vắng ⇒ không vẽ ô vàng. */
  token?: string
  /** Cửa hàng mở cho em (máy chủ báo `shopBat`) — có thì nút "+" cạnh số vàng mở Cửa hàng. */
  onCuaHang?: () => void
  onTuiDo: () => void
  /** "Đồng hành" = ra đảo cùng thần thú (màn Đảo). */
  onDongHanh: () => void
}

/** Đọc số vàng từ phản hồi `vang-xem` (ví tắt / lỗi ⇒ null, không vẽ). */
export function docVang(v: unknown): number | null {
  const o = v as { bat?: unknown; vang?: unknown } | null
  return o && o.bat !== false && typeof o.vang === 'number' && Number.isFinite(o.vang) ? Math.max(0, Math.floor(o.vang)) : null
}

function useVang(token?: string): number | null {
  const api = useMemo(() => (token ? taoShopApiThat({ token, layDiaChi: () => layDiaChiMayChu('') }) : null), [token])
  const [vang, setVang] = useState<number | null>(null)
  useEffect(() => {
    if (!api) return
    let huy = false
    api.vangXem().then((v) => { if (!huy) setVang(docVang(v)) }, () => { if (!huy) setVang(null) })
    return () => { huy = true }
  }, [api])
  return vang
}

export default function ThanThuV2({ profile, token, onCuaHang, onTuiDo, onDongHanh }: ThanThuV2Props) {
  const i = chiSoThu(profile.pet)
  const loai = PETS[i]!
  const ten = tenThu(profile)
  const cap = Math.max(1, Math.floor(profile.cap || 1))
  const v = vongExp(cap, profile.exp)
  const co = v.toiDa ? 0 : v.can - v.con
  const dang = evolutionStage(cap)
  const vang = useVang(token)
  return (
    <div className="v2 v2t">
      <header className="v2t-dau">
        <h1 className="v2-tieu-de v2t-tieu">Thần thú của em</h1>
        {vang !== null && (
          <span className="v2t-vang" aria-label={`Số vàng của em: ${vang}`}>
            <Coins size={20} aria-hidden="true" />
            <b className="v2-so">{vang}</b>
            {onCuaHang && (
              <button type="button" className="v2t-vang-them" onClick={onCuaHang} aria-label="Mở Cửa hàng">
                +
              </button>
            )}
          </span>
        )}
      </header>
      <div className="v2t-the-tab" role="tablist" aria-label="Thần thú và Túi đồ">
        <button type="button" role="tab" aria-selected="true" className="v2t-tab">
          <PawPrint size={20} aria-hidden="true" />
          Thần thú
        </button>
        <button type="button" role="tab" aria-selected="false" className="v2t-tab" onClick={onTuiDo}>
          Túi đồ
        </button>
      </div>

      <section className="v2t-chinh" aria-label={`Thần thú của em: ${ten}`}>
        <div className="v2t-canh">
          <span className="v2t-hao" aria-hidden="true" />
          <img src={anhThu(i, cap)} alt={`${ten} — ${loai.name}, dạng ${EVOLUTION_NAMES[dang]}`} width={320} height={320} decoding="async" />
        </div>
        <div className="v2t-thong-tin v2-the">
          <p className="v2t-ten">
            <Sparkles size={22} aria-hidden="true" />
            <span className="v2-tieu-de">{ten}</span>
          </p>
          <p className="v2t-loai">
            {loai.name} · hệ {loai.element}
          </p>
          <p className="v2t-cap v2-tieu-de v2-so">
            Cấp <em>{cap}</em>
          </p>
          {v.toiDa ? (
            <p className="v2t-phu">Đã đạt cấp tối đa {CAP_TOI_DA}</p>
          ) : (
            <div className="v2t-exp">
              <span className="v2-thanh" role="progressbar" aria-label={`EXP tới cấp ${cap + 1}`} aria-valuemin={0} aria-valuemax={v.can} aria-valuenow={co}>
                <i style={{ width: `${Math.round(v.tiLe * 100)}%` }} />
              </span>
              <b className="v2-so">
                {co}/{v.can} EXP
              </b>
            </div>
          )}
          <div className="v2t-tien-hoa">
            <p className="v2t-tien-hoa-tieu">
              Tiến hoá · <b>{EVOLUTION_NAMES[dang]}</b>
            </p>
            <ol className="v2t-moc" aria-label="Các dạng tiến hoá">
              {EVOLUTION_LEVELS.map((moc, d) => {
                const toi = d <= dang
                return (
                  <li key={moc} className="v2t-moc-o" data-toi={toi ? 'true' : 'false'} data-hien-tai={d === dang ? 'true' : undefined} aria-label={`${EVOLUTION_NAMES[d]} — ${toi ? 'đã mở' : `mở ở cấp ${moc}`}`}>
                    {toi ? <img src={anhThuTheoDang(i, d, true)} alt="" width={44} height={44} /> : <Lock size={18} aria-hidden="true" />}
                    <small className="v2-so">Cấp {moc}</small>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </section>

      <section className="v2t-bo-suu-tap v2-the" aria-labelledby="v2t-bst">
        <h2 id="v2t-bst" className="v2t-bst-tieu">
          Bát Linh · 8 loài thần thú
        </h2>
        <ul className="v2t-luoi">
          {PETS.map((p, k) => {
            const cuaEm = k === i
            return (
              <li key={p.id} className="v2t-o" data-cua-em={cuaEm ? 'true' : 'false'}>
                <img src={anhThuTheoDang(k, cuaEm ? dang : 0, true)} alt="" width={96} height={96} loading="lazy" />
                <span className="v2t-o-ten">{p.name}</span>
                <span className="v2t-o-phu">{cuaEm ? `Cấp ${cap} · Đang đồng hành` : `Hệ ${p.element}`}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <button type="button" className="v2-nut-chinh v2t-dong-hanh" onClick={onDongHanh}>
        <PawPrint size={24} aria-hidden="true" />
        <span>
          Đồng hành
          <small>Ra đảo cùng {ten}</small>
        </span>
      </button>
    </div>
  )
}

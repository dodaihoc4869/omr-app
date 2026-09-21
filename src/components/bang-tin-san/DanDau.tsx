// "Dẫn đầu hôm nay" + "Tiến bộ nhất" + "Em cần thầy để ý". Dẫn đầu = CHĂM (số câu hôm nay) và TIẾN BỘ so với CHÍNH em ấy 7 ngày — không so em này với em khác, không hạ thấp em nào.
// Hạng đổi ⇒ dòng trượt tới chỗ mới, mũi tên lên/xuống hiện 4 giây. Chạm tên em ⇒ Toàn cảnh một em.
import { useEffect, useRef, useState } from 'react'
import type { DanDauSan } from '../../lib/bang-tin-san/kieu'
import type { BangTin, EmCanDeY, TienBoBangTin } from '../../lib/bang-tin-thay'
import { tenGoiKhongTrung } from '../../lib/bang-tin-san/ten-goi'

const TOI_DA_CAN_DE_Y = 3

/** Mức của một em cần để ý: quá hạn / sai nhiều ⇒ "Cần để ý" (đỏ); còn lại (chưa mở bài, tín hiệu khác) ⇒ "Theo dõi" (vàng). */
export function mucCanDeY(e: EmCanDeY): 'do' | 'vang' {
  return e.lyDo.some((l) => l.loai === 'qua_han' || l.loai === 'sai_nhieu') ? 'do' : 'vang'
}

export function DanDau({ danDau, bt, onMoEm }: { danDau: readonly DanDauSan[] | null; bt: BangTin | null; onMoEm: (sbd: string) => void }) {
  const hang = useRef(new Map<string, number>())
  const [doi, setDoi] = useState<Record<string, 'len' | 'xuong'>>({})
  useEffect(() => {
    if (!danDau) return
    const moi: Record<string, 'len' | 'xuong'> = {}
    danDau.forEach((e, i) => {
      const cu = hang.current.get(e.sbd)
      if (cu !== undefined && cu !== i) moi[e.sbd] = i < cu ? 'len' : 'xuong'
      hang.current.set(e.sbd, i)
    })
    if (Object.keys(moi).length === 0) return
    setDoi((d) => ({ ...d, ...moi }))
    const id = setTimeout(() => setDoi((d) => Object.fromEntries(Object.entries(d).filter(([k]) => !(k in moi)))), 4200)
    return () => clearTimeout(id)
  }, [danDau])
  const tienBo: TienBoBangTin | undefined = bt?.tienBo.find((t) => t.loai === 'tien_bo_nhat')
  const tenGoi = tenGoiKhongTrung([...(danDau ?? []), ...(tienBo ? [tienBo] : [])])
  const goiTen = (sbd: string, hoTen: string): string => tenGoi.get(sbd) || hoTen // tên gọi hai chữ cuối, trùng thì thêm chữ trước (không "…")
  const canDeY = bt?.canDeY.ds.slice(0, TOI_DA_CAN_DE_Y) ?? []
  return (
    <article className="bts-the" data-khoi="dan-dau">
      <div className="bts-the-dau">
        <h2 className="bts-ten">Dẫn đầu hôm nay</h2>
        <span className="bts-the-phu">so với chính em ấy, 7 ngày</span>
      </div>
      {danDau && danDau.length > 0 && (
        <ol className="bts-dan-dau" style={{ height: `calc(var(--bts-cao-hang) * min(${danDau.length}, var(--bts-max-hang, ${danDau.length})))` }}>
          {danDau.map((e, i) => (
            <li key={e.sbd}>
              <button type="button" className="bts-dd-hang" style={{ transform: `translateY(calc(var(--bts-cao-hang) * ${i}))` }} data-doi={doi[e.sbd]} onClick={() => onMoEm(e.sbd)} aria-label={`Hạng ${i + 1}: ${e.hoTen}, ${e.tenLop} — ${e.soCau} câu — mở toàn cảnh`}>
                <span className="bts-dd-thu bts-so">{i + 1}</span>
                <span className="bts-dd-mt" aria-hidden="true" />
                <span className="bts-dd-ten" title={e.hoTen}>
                  {goiTen(e.sbd, e.hoTen)} <span>· {e.tenLop}</span>
                </span>
                <span className="bts-dd-cau bts-so">
                  {e.soCau} <small>câu</small>
                </span>
                <span className="bts-dd-tb bts-so" data-am={e.tienBo < 0 ? '1' : '0'}>
                  {e.tienBo >= 0 ? '+' : '−'}
                  {Math.abs(Math.round(e.tienBo))} %
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {tienBo && (
        <p className="bts-tien-bo">
          <span className="bts-nhan"><span className="bts-nhan-dai">Tiến bộ nhất</span><span className="bts-nhan-gon">Tiến bộ</span></span>
          <span>
            <b title={`${tienBo.hoTen} · ${tienBo.tenLop}`}>{goiTen(tienBo.sbd, tienBo.hoTen)}</b> · <b className="bts-so">{tienBo.chu}</b>
          </span>
        </p>
      )}
      {canDeY.length > 0 && (
        <>
          <h3 className="bts-muc-phu">Em cần thầy để ý</h3>
          <ul className="bts-chu-y">
            {canDeY.map((e) => {
              const muc = mucCanDeY(e)
              return (
                <li key={e.sbd}>
                  <button type="button" className="bts-cy" onClick={() => onMoEm(e.sbd)} aria-label={`${e.hoTen}${e.tenLop ? ` · ${e.tenLop}` : ''} — mở toàn cảnh`}>
                    <span className="bts-cy-dau">
                      <span className={`bts-muc bts-muc-${muc}`}>{muc === 'do' ? 'Cần để ý' : 'Theo dõi'}</span>
                      <span className="bts-cy-ten">
                        {e.hoTen} <span>· {e.tenLop}</span>
                      </span>
                    </span>
                    <span className="bts-cy-ly">{e.lyDo[0]?.chu ?? ''}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </article>
  )
}

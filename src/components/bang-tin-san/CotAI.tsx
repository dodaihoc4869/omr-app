// Cột tối "A.I Đỗ Đại Học đã tự làm hôm nay": việc máy đã làm (số thật), Bộ não A.I đêm qua, dạng cả lớp đang vấp, chân "Hệ thống bình thường". Chỉ ĐỌC. Con số nào máy chủ không có ⇒ bỏ dòng ấy (không vẽ 0 giả).
import { useEffect, useRef, useState } from 'react'
import type { BangTin } from '../../lib/bang-tin-thay'

const TOI_DA_VIEC = 3
const TOI_DA_DANG = 3
const nghin = (n: number): string => Math.round(n).toLocaleString('vi-VN')

function Tich() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Số trong câu: đổi giá trị thì nháy nền một nhịp (con số nhảy). */
function SoNhay({ so }: { so: number }) {
  const cu = useRef(so)
  const [vua, setVua] = useState(false)
  useEffect(() => {
    if (cu.current === so) return
    cu.current = so
    setVua(true)
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setVua(false)))
    return () => cancelAnimationFrame(id)
  }, [so])
  return <b className={`bts-so${vua ? ' bts-vua' : ''}`}>{nghin(so)}</b>
}

/** Câu việc: tách số ra khỏi chữ máy chủ soạn ("Đưa 128 câu sai về lịch ôn lại") để số nhảy riêng. */
function DongViec({ chu, so }: { chu: string; so: number }) {
  const i = chu.indexOf(String(so))
  if (i < 0) return <span>{chu}</span>
  return (
    <span>
      {chu.slice(0, i)}
      <SoNhay so={so} />
      {chu.slice(i + String(so).length)}
    </span>
  )
}

export function CotAI({ bt }: { bt: BangTin }) {
  const viec = bt.mayDaLam.slice(0, TOI_DA_VIEC)
  const nao = bt.boNao
  const vap = bt.dangVap.slice(0, TOI_DA_DANG)
  const soNao = nao ? [[nao.soEmSoi, 'em được soi'], [nao.soEmDieuChinh, 'em được chỉnh bài'], [nao.soLoiNhan, 'lời nhắn']].filter((x): x is [number, string] => x[0] !== null) : []
  return (
    <article className="bts-the bts-the-ai" data-khoi="cot-ai">
      <div className="bts-the-dau">
        <h2 className="bts-ten">A.I Đỗ Đại Học đã tự làm hôm nay</h2>
      </div>
      {viec.length > 0 && (
        <ul className="bts-ai-ds">
          {viec.map((v) => (
            <li key={v.loai}>
              <Tich />
              <DongViec chu={v.chu} so={v.so} />
            </li>
          ))}
        </ul>
      )}
      {soNao.length > 0 && (
        <div className="bts-nao">
          <span className="bts-nao-ten">Bộ não A.I đêm qua</span>
          {soNao.map(([so, nhan]) => (
            <div key={nhan}>
              <b className="bts-so">{nghin(so)}</b>
              <span>{nhan}</span>
            </div>
          ))}
        </div>
      )}
      {vap.length > 0 && (
        <>
          <h3 className="bts-muc-phu">Dạng cả lớp đang vấp</h3>
          <ul className="bts-vap">
            {vap.map((d) => {
              const tl = d.soEmGap > 0 ? Math.min(100, (d.soEmVap / d.soEmGap) * 100) : 0
              return (
                <li key={d.ma}>
                  <div className="bts-vap-dong">
                    <span>{d.ten}</span>
                    <span className="bts-so">
                      {d.soEmVap} / {d.soEmGap} em vấp
                    </span>
                  </div>
                  <div className="bts-vap-thanh" role="img" aria-label={`${d.soEmVap} trên ${d.soEmGap} em đã gặp dạng này bị vấp`}>
                    <i style={{ transform: `scaleX(${(tl / 100).toFixed(3)})` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
      {bt.sucKhoe && (
        <p className="bts-ai-chan" data-muc={bt.sucKhoe.muc}>
          <i className="bts-tim" />
          {bt.sucKhoe.chu}
        </p>
      )}
    </article>
  )
}

// TỔNG HỢP ĐÁNH GIÁ của Tu luyện (29/09): em thấy tiến bộ của mình — tỉ lệ đúng theo tuần, theo dạng (mạnh nhất / yếu nhất / tiến bộ nhiều
// nhất so với lần đầu), theo sao, theo phần I/II/III, chuỗi ngày, gợi ý dạng nên luyện tiếp (bấm ⇒ rút ngay chế độ Dạng bài).
// Số liệu tính bằng `tongHopTuLuyen` (src/lib/tu-luyen.ts, hàm thuần có test). Biểu đồ SVG tự vẽ, một màu, con số nào cũng có nhãn.
import { useEffect, useMemo, useState } from 'react'
import {
  NHAN_PHAN_TU_LUYEN,
  TEN_CHE_DO,
  chuThoiGian,
  timDangTrongDanhMuc,
  tongHopTuLuyen,
  type DongCauTuLuyen,
  type DongLuotTuLuyen,
  type LopDangBaiTL,
  type TongHopDang,
  type TuanTuLuyen,
} from '../../lib/tu-luyen'
import { taiTongHop } from './api'

export interface TongHopTuLuyenProps {
  token: string
  lamMoi: number
  danhMuc: LopDangBaiTL[]
  onLuyenDang: (lop: string, tenBai: string, ma: string) => void
}

const ngayGio = (ms: number) => {
  const d = new Date(ms + 7 * 3_600_000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())} · ${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}`
}

/** Cột tỉ lệ đúng 8 tuần (một chuỗi số ⇒ một màu, không chú giải; tuần không luyện vẽ vạch mờ, không bịa 0 %). */
function BieuDoTuan({ tuan }: { tuan: TuanTuLuyen[] }) {
  const [chon, setChon] = useState<number | null>(null)
  const W = 320, H = 150, dinh = 18, day = 118
  const y = (p: number) => day - ((day - dinh) * p) / 100
  const moc = chon ?? [...tuan.keys()].reverse().find((i) => tuan[i].soCau > 0) ?? null
  return (
    <figure className="tl-bd">
      <svg viewBox={`0 0 ${W} ${H}`} className="tl-bd-svg" role="img" aria-label={`Tỉ lệ đúng theo tuần: ${tuan.filter((t) => t.soCau).map((t) => `tuần ${t.nhan} ${t.tiLe}%`).join(', ') || 'chưa có tuần nào'}`}>
        {[0, 50, 100].map((p) => (
          <g key={p}>
            <line x1={28} x2={W} y1={y(p)} y2={y(p)} className="tl-bd-luoi" />
            <text x={0} y={y(p) + 4} className="tl-bd-truc">{p}%</text>
          </g>
        ))}
        {tuan.map((t, i) => {
          const x = 28 + i * ((W - 28) / tuan.length) + 6
          const w = (W - 28) / tuan.length - 12
          const co = t.soCau > 0
          return (
            <g key={t.batDau} onMouseEnter={() => setChon(i)} onFocus={() => setChon(i)} onClick={() => setChon(i)} tabIndex={co ? 0 : -1} role={co ? 'button' : undefined} aria-label={co ? `Tuần từ ${t.nhan}: ${t.soDung}/${t.soCau} câu đúng, ${t.tiLe}%` : undefined}>
              <rect x={x - 6} y={dinh - 8} width={w + 12} height={day - dinh + 30} fill="transparent" />
              {co ? (
                <rect x={x} y={y(t.tiLe)} width={w} height={Math.max(4, day - y(t.tiLe))} rx={4} className="tl-bd-cot" data-chon={moc === i ? 'true' : 'false'} />
              ) : (
                <rect x={x} y={day - 2} width={w} height={2} rx={1} className="tl-bd-trong" />
              )}
              <text x={x + w / 2} y={H - 12} textAnchor="middle" className="tl-bd-truc">{t.nhan}</text>
            </g>
          )
        })}
        <line x1={28} x2={W} y1={day} y2={day} className="tl-bd-day" />
      </svg>
      <figcaption className="tl-bd-chu" aria-live="polite">
        {moc !== null && tuan[moc].soCau > 0 ? (
          <>Tuần từ Thứ Hai {tuan[moc].nhan}: <b className="tl-tab">{tuan[moc].tiLe}%</b> đúng · {tuan[moc].soDung}/{tuan[moc].soCau} câu</>
        ) : (
          <>Chưa có tuần nào đã luyện trong 8 tuần gần đây.</>
        )}
      </figcaption>
    </figure>
  )
}

/** Một hàng thanh ngang: nhãn · thanh tỉ lệ · "x/y câu · z%". */
function HangThanh({ nhan, phu, soDung, soCau, tiLe }: { nhan: string; phu?: string; soDung: number; soCau: number; tiLe: number }) {
  return (
    <li className="tl-hang-thanh">
      <div className="tl-hang-thanh-dau">
        <span className="tl-hang-thanh-nhan">{nhan}{phu && <span className="tl-hang-thanh-phu"> · {phu}</span>}</span>
        <span className="tl-tab tl-hang-thanh-so">{soCau ? `${tiLe}% · ${soDung}/${soCau} câu` : 'chưa luyện'}</span>
      </div>
      <span className="tl-thanh" aria-hidden="true"><span style={{ transform: `scaleX(${soCau ? tiLe / 100 : 0})` }} /></span>
    </li>
  )
}

function TheNoiBat({ nhan, d, chu }: { nhan: string; d: TongHopDang | null; chu: (d: TongHopDang) => string }) {
  return (
    <div className="tl-noi-bat">
      <span className="tl-noi-bat-nhan">{nhan}</span>
      {d ? (
        <>
          <b className="tl-noi-bat-ten">{d.ten}</b>
          <span className="tl-noi-bat-so tl-tab">{chu(d)}</span>
        </>
      ) : (
        <span className="tl-noi-bat-so">Luyện thêm vài lượt để thấy</span>
      )}
    </div>
  )
}

export default function TongHopTuLuyen({ token, lamMoi, danhMuc, onLuyenDang }: TongHopTuLuyenProps) {
  const [du, setDu] = useState<{ luot: DongLuotTuLuyen[]; cau: DongCauTuLuyen[] } | null>(null)
  const [loi, setLoi] = useState('')
  const [lan, setLan] = useState(0)
  const [xemHet, setXemHet] = useState(false)
  useEffect(() => {
    let song = true
    setLoi('')
    void taiTongHop(token).then((r) => {
      if (!song) return
      if (r.ok) setDu(r.du)
      else setLoi(r.loi)
    })
    return () => { song = false }
  }, [token, lamMoi, lan])
  const t = useMemo(() => (du ? tongHopTuLuyen(du.luot, du.cau, Date.now()) : null), [du])

  if (!du && loi) {
    return (
      <div className="tl-bao" data-kieu="loi" role="alert">
        <p>{loi}</p>
        <button type="button" className="tl-nut-phu" onClick={() => setLan((n) => n + 1)}>Thử lại</button>
      </div>
    )
  }
  if (!t) return <div className="tl-luoi-che-do" role="status" aria-label="Đang tải tổng hợp">{[1, 2, 3].map((i) => <div key={i} className="tl-xuong" />)}</div>
  if (t.soCau === 0) {
    return (
      <div className="tl-bao tl-bao-trong">
        <b>Chưa có lượt tu luyện nào</b>
        <p>Làm một lượt ở thẻ Luyện — nộp xong, tổng hợp tiến bộ của em hiện ở đây: tỉ lệ đúng theo tuần, dạng mạnh nhất, dạng cần luyện thêm.</p>
      </div>
    )
  }
  const goiYBam = t.goiY.map((d) => ({ d, o: timDangTrongDanhMuc(danhMuc, d.ma, d.ten) }))
  const dsDang = xemHet ? t.theoDang : t.theoDang.slice(0, 6)
  return (
    <div className="tl-tong-hop">
      <section className="tl-hero" aria-label="Tổng quan">
        <div className="tl-hero-so">
          <b className="baloo tl-tab">{t.tiLe}%</b>
          <span>câu đúng · {t.soDung}/{t.soCau} câu</span>
        </div>
        <dl className="tl-kpi">
          <div><dt>Lượt đã nộp</dt><dd className="tl-tab">{t.soLuot}</dd></div>
          <div><dt>Chuỗi ngày</dt><dd className="tl-tab">{t.chuoiHienTai} ngày</dd></div>
          <div><dt>Dài nhất</dt><dd className="tl-tab">{t.chuoiDaiNhat} ngày</dd></div>
          <div><dt>Thời gian luyện</dt><dd className="tl-tab">{chuThoiGian(t.tongGiay)}</dd></div>
        </dl>
      </section>

      <section className="tl-khoi" aria-labelledby="tl-h-tuan">
        <h2 id="tl-h-tuan" className="tl-muc">Tỉ lệ đúng theo tuần</h2>
        <BieuDoTuan tuan={t.theoTuan} />
      </section>

      <section className="tl-khoi" aria-label="Điểm nổi bật">
        <div className="tl-luoi-noi-bat">
          <TheNoiBat nhan="Dạng mạnh nhất" d={t.manhNhat} chu={(d) => `${d.tiLe}% đúng · ${d.soCau} câu`} />
          <TheNoiBat nhan="Dạng cần luyện thêm" d={t.yeuNhat} chu={(d) => `${d.tiLe}% đúng · ${d.soCau} câu`} />
          <TheNoiBat nhan="Tiến bộ nhiều nhất" d={t.tienBoNhat} chu={(d) => `lần đầu ${d.tiLeDau}% → gần nhất ${d.tiLeCuoi}% (+${d.tienBo} điểm %)`} />
        </div>
      </section>

      {goiYBam.length > 0 && (
        <section className="tl-khoi" aria-labelledby="tl-h-goi-y">
          <h2 id="tl-h-goi-y" className="tl-muc">Nên luyện tiếp</h2>
          <ul className="tl-goi-y">
            {goiYBam.map(({ d, o }) => (
              <li key={d.khoa}>
                <div className="tl-goi-y-chu">
                  <b>{d.ten}</b>
                  <span className="tl-tab">{d.tiLe}% đúng · {d.soCau} câu đã làm{o ? ` · ${o.tenBai}` : ''}</span>
                </div>
                {o ? (
                  <button type="button" className="tl-nut-phu" onClick={() => onLuyenDang(o.lop, o.tenBai, o.dang.ma)}>Luyện 20 câu dạng này</button>
                ) : (
                  <span className="tl-goi-y-ghi">Luyện bằng chế độ Dạng câu sai</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="tl-khoi" aria-labelledby="tl-h-dang">
        <h2 id="tl-h-dang" className="tl-muc">Theo dạng bài</h2>
        <ul className="tl-ds-thanh">
          {dsDang.map((d) => (
            <HangThanh key={d.khoa} nhan={d.ten} phu={d.tienBo !== null ? `lần đầu ${d.tiLeDau}% → gần nhất ${d.tiLeCuoi}%` : d.bai || undefined} soDung={d.soDung} soCau={d.soCau} tiLe={d.tiLe} />
          ))}
        </ul>
        {t.theoDang.length > 6 && (
          <button type="button" className="tl-nut-chu" onClick={() => setXemHet((x) => !x)}>{xemHet ? 'Thu gọn' : `Xem cả ${t.theoDang.length} dạng`}</button>
        )}
      </section>

      <div className="tl-hai-cot">
        <section className="tl-khoi" aria-labelledby="tl-h-sao">
          <h2 id="tl-h-sao" className="tl-muc">Theo mức sao của câu</h2>
          <ul className="tl-ds-thanh">
            <HangThanh nhan="Câu 2 sao" phu="khó, có bẫy" {...t.theoSao['2']} />
            <HangThanh nhan="Câu 1 sao" phu="bản chất" {...t.theoSao['1']} />
            <HangThanh nhan="Câu thường" {...t.theoSao['0']} />
          </ul>
        </section>
        <section className="tl-khoi" aria-labelledby="tl-h-phan">
          <h2 id="tl-h-phan" className="tl-muc">Theo phần</h2>
          <ul className="tl-ds-thanh">
            {(['I', 'II', 'III'] as const).map((p) => <HangThanh key={p} nhan={`Phần ${p} · ${NHAN_PHAN_TU_LUYEN[p]}`} {...t.theoPhan[p]} />)}
          </ul>
        </section>
      </div>

      <section className="tl-khoi" aria-labelledby="tl-h-gan">
        <h2 id="tl-h-gan" className="tl-muc">Lượt gần đây</h2>
        <ul className="tl-ds-luot">
          {t.ganDay.map((l) => (
            <li key={l.id}>
              <div className="tl-goi-y-chu">
                <b>{l.tieuDe || TEN_CHE_DO[l.cheDo]}</b>
                <span className="tl-tab">{ngayGio(l.nopLuc)} · {chuThoiGian(l.giay)}</span>
              </div>
              <span className="tl-luot-so tl-tab">{l.soDung}/{l.soCau} câu đúng</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

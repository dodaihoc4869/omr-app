// TỔNG HỢP ĐÁNH GIÁ của Tu luyện (29/09): em thấy tiến bộ của mình — tỉ lệ đúng theo tuần, theo dạng (mạnh nhất / yếu nhất / tiến bộ nhiều
// nhất so với lần đầu), theo sao, theo phần I/II/III, chuỗi ngày, gợi ý dạng nên luyện tiếp (bấm ⇒ rút ngay chế độ Dạng bài).
// Số liệu tính bằng `tongHopTuLuyen` (src/lib/tu-luyen.ts, hàm thuần có test). Biểu đồ SVG tự vẽ, một màu, con số nào cũng có nhãn.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
  /** Bấm "Xem lại" một lượt đã nộp ⇒ màn kết quả của lượt ấy (đáp án + lời giải đã chốt). */
  onXemLuot?: (luotId: string) => void
  /** Lượt đang mở (hiện "Đang mở…" trên nút). */
  dangMoLuot?: string
  /** Màn ngang / máy tính (30/09): bảng điều khiển nhiều cột, biểu đồ vẽ theo đúng bề rộng thật. Màn dọc: như cũ. */
  rong?: boolean
  /** Khối "Luyện đề cấu trúc" đặt vào lưới bảng điều khiển (chỉ khi `rong`). */
  luyenDe?: ReactNode
}

/** Phần trăm kiểu Việt: dấu phẩy thập phân (60,7%). */
const pt = (x: number) => `${x.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`

const ngayGio = (ms: number) => {
  const d = new Date(ms + 7 * 3_600_000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())} · ${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}`
}

/** Cột tỉ lệ đúng 8 tuần (một chuỗi số ⇒ một màu, không chú giải; tuần không luyện vẽ vạch mờ, không bịa 0 %). */
function BieuDoTuan({ tuan, rong = false }: { tuan: TuanTuLuyen[]; rong?: boolean }) {
  const [chon, setChon] = useState<number | null>(null)
  // Màn rộng: khung vẽ = đúng bề rộng thật (px) ⇒ chữ trục giữ cỡ 11–12 px, nét sắc ở mọi kích thước (không phóng to ảnh 320 px).
  const khung = useRef<HTMLElement>(null)
  const [rongPx, setRongPx] = useState(0)
  useEffect(() => {
    const el = khung.current
    if (!rong || !el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([m]) => setRongPx(Math.round(m!.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [rong])
  const W = rong && rongPx > 0 ? Math.max(300, rongPx) : 320
  const H = rong ? (W < 520 ? 176 : 230) : 150
  const dinh = rong ? 30 : 18
  const day = H - 32
  const coSo = rong && W >= 440
  const y = (p: number) => day - ((day - dinh) * p) / 100
  const moc = chon ?? [...tuan.keys()].reverse().find((i) => tuan[i].soCau > 0) ?? null
  return (
    <figure className="tlu-bd" ref={khung}>
      <svg viewBox={`0 0 ${W} ${H}`} width={rong ? W : undefined} height={rong ? H : undefined} className="tlu-bd-svg" role="img" aria-label={`Tỉ lệ đúng theo tuần: ${tuan.filter((t) => t.soCau).map((t) => `tuần ${t.nhan} ${pt(t.tiLe)}`).join(', ') || 'chưa có tuần nào'}`}>
        {[0, 50, 100].map((p) => (
          <g key={p}>
            <line x1={28} x2={W} y1={y(p)} y2={y(p)} className="tlu-bd-luoi" />
            <text x={0} y={y(p) + 4} className="tlu-bd-truc">{p}%</text>
          </g>
        ))}
        {tuan.map((t, i) => {
          const x = 28 + i * ((W - 28) / tuan.length) + 6
          const w = (W - 28) / tuan.length - 12
          const co = t.soCau > 0
          return (
            <g key={t.batDau} onMouseEnter={() => setChon(i)} onFocus={() => setChon(i)} onClick={() => setChon(i)} tabIndex={co ? 0 : -1} role={co ? 'button' : undefined} aria-label={co ? `Tuần từ ${t.nhan}: ${t.soDung}/${t.soCau} câu đúng, ${pt(t.tiLe)}` : undefined}>
              <rect x={x - 6} y={dinh - 8} width={w + 12} height={day - dinh + 30} fill="transparent" />
              {co ? (
                <>
                  <rect x={x} y={y(t.tiLe)} width={w} height={Math.max(4, day - y(t.tiLe))} rx={rong ? 6 : 4} className="tlu-bd-cot" data-chon={moc === i ? 'true' : 'false'} />
                  {coSo && <text x={x + w / 2} y={y(t.tiLe) - 8} textAnchor="middle" className="tlu-bd-so">{pt(t.tiLe)}</text>}
                </>
              ) : (
                <rect x={x} y={day - 2} width={w} height={2} rx={1} className="tlu-bd-trong" />
              )}
              <text x={x + w / 2} y={H - 12} textAnchor="middle" className="tlu-bd-truc">{t.nhan}</text>
            </g>
          )
        })}
        <line x1={28} x2={W} y1={day} y2={day} className="tlu-bd-day" />
      </svg>
      <figcaption className="tlu-bd-chu" aria-live="polite">
        {moc !== null && tuan[moc].soCau > 0 ? (
          <>Tuần từ Thứ Hai {tuan[moc].nhan}: <b className="tlu-tab">{pt(tuan[moc].tiLe)}</b> đúng · {tuan[moc].soDung}/{tuan[moc].soCau} câu</>
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
    <li className="tlu-hang-thanh">
      <div className="tlu-hang-thanh-dau">
        <span className="tlu-hang-thanh-nhan">{nhan}{phu && <span className="tlu-hang-thanh-phu"> · {phu}</span>}</span>
        <span className="tlu-tab tlu-hang-thanh-so">{soCau ? `${pt(tiLe)} · ${soDung}/${soCau} câu` : 'chưa luyện'}</span>
      </div>
      <span className="tlu-thanh" aria-hidden="true"><span style={{ transform: `scaleX(${soCau ? tiLe / 100 : 0})` }} /></span>
    </li>
  )
}

function TheNoiBat({ nhan, d, chu }: { nhan: string; d: TongHopDang | null; chu: (d: TongHopDang) => string }) {
  return (
    <div className="tlu-noi-bat">
      <span className="tlu-noi-bat-nhan">{nhan}</span>
      {d ? (
        <>
          <b className="tlu-noi-bat-ten">{d.ten}</b>
          <span className="tlu-noi-bat-so tlu-tab">{chu(d)}</span>
        </>
      ) : (
        <span className="tlu-noi-bat-so">Luyện thêm vài lượt để thấy</span>
      )}
    </div>
  )
}

export default function TongHopTuLuyen({ token, lamMoi, danhMuc, onLuyenDang, onXemLuot, dangMoLuot, rong = false, luyenDe }: TongHopTuLuyenProps) {
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
      <div className="tlu-bao" data-kieu="loi" role="alert">
        <p>{loi}</p>
        <button type="button" className="tlu-nut-phu" onClick={() => setLan((n) => n + 1)}>Thử lại</button>
      </div>
    )
  }
  if (!t) return <div className="tlu-luoi-che-do" role="status" aria-label="Đang tải tổng hợp">{[1, 2, 3].map((i) => <div key={i} className="tlu-xuong" />)}</div>
  if (t.soCau === 0) {
    return (
      <>
        <div className="tlu-bao tlu-bao-trong">
          <b>Chưa có lượt tu luyện nào</b>
          <p>Làm một lượt ở thẻ Luyện — nộp xong, tổng hợp tiến bộ của em hiện ở đây: tỉ lệ đúng theo tuần, dạng mạnh nhất, dạng cần luyện thêm.</p>
        </div>
        {rong && luyenDe}
      </>
    )
  }
  const goiYBam = t.goiY.map((d) => ({ d, o: timDangTrongDanhMuc(danhMuc, d.ma, d.ten) }))
  const dsDang = xemHet ? t.theoDang : t.theoDang.slice(0, 6)
  const oHero = (
      <section className="tlu-hero" aria-label="Tổng quan">
        <div className="tlu-hero-so">
          <b className="baloo tlu-tab">{pt(t.tiLe)}</b>
          <span>câu đúng · {t.soDung}/{t.soCau} câu</span>
        </div>
        <dl className="tlu-kpi">
          <div><dt>Lượt đã nộp</dt><dd className="tlu-tab">{t.soLuot}</dd></div>
          <div><dt>Chuỗi ngày</dt><dd className="tlu-tab">{t.chuoiHienTai} ngày</dd></div>
          <div><dt>Chuỗi dài nhất</dt><dd className="tlu-tab">{t.chuoiDaiNhat} ngày</dd></div>
          <div><dt>Thời gian luyện</dt><dd className="tlu-tab">{chuThoiGian(t.tongGiay)}</dd></div>
        </dl>
      </section>
  )
  const oTuan = (
      <section className="tlu-khoi tlu-o-tuan" aria-labelledby="tlu-h-tuan">
        <h2 id="tlu-h-tuan" className="tlu-muc">Tỉ lệ đúng theo tuần</h2>
        <BieuDoTuan tuan={t.theoTuan} rong={rong} />
      </section>
  )
  const oNoiBat = (
      <section className="tlu-khoi tlu-o-noi-bat" aria-label="Điểm nổi bật">
        <div className="tlu-luoi-noi-bat">
          <TheNoiBat nhan="Dạng mạnh nhất" d={t.manhNhat} chu={(d) => `${pt(d.tiLe)} đúng · ${d.soCau} câu`} />
          <TheNoiBat nhan="Dạng cần luyện thêm" d={t.yeuNhat} chu={(d) => `${pt(d.tiLe)} đúng · ${d.soCau} câu`} />
          <TheNoiBat nhan="Tiến bộ nhiều nhất" d={t.tienBoNhat} chu={(d) => `lần đầu ${pt(d.tiLeDau)} → gần nhất ${pt(d.tiLeCuoi)} (tăng ${(d.tienBo ?? 0).toLocaleString('vi-VN')} điểm phần trăm)`} />
        </div>
      </section>
  )
  const oGoiY = goiYBam.length > 0 && (
        <section className="tlu-khoi tlu-o-goi-y" aria-labelledby="tlu-h-goi-y">
          <h2 id="tlu-h-goi-y" className="tlu-muc">Nên luyện tiếp</h2>
          <ul className="tlu-goi-y">
            {goiYBam.map(({ d, o }) => (
              <li key={d.khoa}>
                <div className="tlu-goi-y-chu">
                  <b>{d.ten}</b>
                  <span className="tlu-tab">{pt(d.tiLe)} đúng · {d.soCau} câu đã làm{o ? ` · ${o.tenBai}` : ''}</span>
                </div>
                {o ? (
                  <button type="button" className="tlu-nut-phu" onClick={() => onLuyenDang(o.lop, o.tenBai, o.dang.ma)}>Luyện 20 câu dạng này</button>
                ) : (
                  <span className="tlu-goi-y-ghi">Luyện bằng chế độ Dạng câu sai</span>
                )}
              </li>
            ))}
          </ul>
        </section>
  )
  const oDang = (
      <section className="tlu-khoi tlu-o-dang" aria-labelledby="tlu-h-dang">
        <h2 id="tlu-h-dang" className="tlu-muc">Theo dạng bài</h2>
        <ul className="tlu-ds-thanh">
          {dsDang.map((d) => (
            <HangThanh key={d.khoa} nhan={d.ten} phu={d.tienBo !== null ? `lần đầu ${pt(d.tiLeDau)} → gần nhất ${pt(d.tiLeCuoi)}` : d.bai || undefined} soDung={d.soDung} soCau={d.soCau} tiLe={d.tiLe} />
          ))}
        </ul>
        {t.theoDang.length > 6 && (
          <button type="button" className="tlu-nut-chu" onClick={() => setXemHet((x) => !x)}>{xemHet ? 'Thu gọn' : `Xem cả ${t.theoDang.length} dạng`}</button>
        )}
      </section>
  )
  const oSaoPhan = (
      <div className="tlu-hai-cot">
        <section className="tlu-khoi tlu-o-sao" aria-labelledby="tlu-h-sao">
          <h2 id="tlu-h-sao" className="tlu-muc">Theo mức sao của câu</h2>
          <ul className="tlu-ds-thanh">
            <HangThanh nhan="Câu 2 sao" phu="khó, có bẫy" {...t.theoSao['2']} />
            <HangThanh nhan="Câu 1 sao" phu="bản chất" {...t.theoSao['1']} />
            <HangThanh nhan="Câu thường" {...t.theoSao['0']} />
          </ul>
        </section>
        <section className="tlu-khoi tlu-o-phan" aria-labelledby="tlu-h-phan">
          <h2 id="tlu-h-phan" className="tlu-muc">Theo phần</h2>
          <ul className="tlu-ds-thanh">
            {(['I', 'II', 'III'] as const).map((p) => <HangThanh key={p} nhan={`Phần ${p} · ${NHAN_PHAN_TU_LUYEN[p]}`} {...t.theoPhan[p]} />)}
          </ul>
        </section>
      </div>
  )
  const oGan = (
      <section className="tlu-khoi tlu-o-gan" aria-labelledby="tlu-h-gan">
        <h2 id="tlu-h-gan" className="tlu-muc">Lượt gần đây</h2>
        <ul className="tlu-ds-luot">
          {t.ganDay.map((l) => (
            <li key={l.id}>
              <div className="tlu-goi-y-chu">
                <b>{l.tieuDe || TEN_CHE_DO[l.cheDo]}</b>
                <span className="tlu-tab">{ngayGio(l.nopLuc)} · {chuThoiGian(l.giay)}</span>
              </div>
              <span className="tlu-luot-so tlu-tab">{l.soDung}/{l.soCau} câu đúng</span>
              {onXemLuot && (
                <button type="button" className="tlu-nut-phu" disabled={dangMoLuot === l.id} onClick={() => onXemLuot(l.id)} aria-label={`Xem lại lượt ${l.tieuDe || TEN_CHE_DO[l.cheDo]}: đáp án và lời giải`}>
                  {dangMoLuot === l.id ? 'Đang mở…' : 'Xem lại'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
  )
  if (rong) {
    // BẢNG ĐIỀU KHIỂN (ngang / máy tính): hàng tổng quan, rồi HAI cột độc lập (không khối nào bị kéo cao theo khối bên cạnh):
    // trái = biểu đồ tuần, theo dạng, theo sao + phần, luyện đề; phải = điểm nổi bật, nên luyện tiếp, lượt gần đây.
    return (
      <div className="tlu-tong-hop" data-rong="true">
        {oHero}
        <div className="tlu-th-cot">
          <div className="tlu-th-trai">
            {oTuan}
            {oDang}
            {oSaoPhan}
            {luyenDe && <div className="tlu-o-ld">{luyenDe}</div>}
          </div>
          <div className="tlu-th-phai">
            {oNoiBat}
            {oGoiY}
            {oGan}
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="tlu-tong-hop">
      {oHero}

      {oTuan}

      {oNoiBat}

      {oGoiY}

      {oDang}

      {oSaoPhan}

      {oGan}
    </div>
  )
}

/** Mục "Luyện đề cấu trúc" trong Tổng hợp (30/09): CHỈ ĐỌC điểm các lượt đã nộp từ `/luyen-de/dieu-kien` (cùng dữ liệu `/luyen-de/history`), không đổi schema. */
export function DiemLuyenDeTongHop({ items, onMo }: { items: { id: string; createdAt: number; status: string; score: number | null }[]; onMo: () => void }) {
  const daNop = items.filter((x) => x.status === 'submitted' && typeof x.score === 'number') as { id: string; createdAt: number; score: number }[]
  if (daNop.length === 0) return null
  const so = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 2 })
  const caoNhat = Math.max(...daNop.map((x) => x.score))
  const tb = daNop.reduce((n, x) => n + x.score, 0) / daNop.length
  return (
    <section className="tlu-khoi" aria-labelledby="tlu-h-luyen-de">
      <h2 id="tlu-h-luyen-de" className="tlu-muc">Luyện đề cấu trúc</h2>
      <dl className="tlu-kpi">
        <div><dt>Đề đã nộp</dt><dd className="tlu-tab">{daNop.length} đề</dd></div>
        <div><dt>Điểm gần nhất</dt><dd className="tlu-tab">{so(daNop[0].score)} / 10</dd></div>
        <div><dt>Điểm cao nhất</dt><dd className="tlu-tab">{so(caoNhat)} / 10</dd></div>
        <div><dt>Điểm trung bình</dt><dd className="tlu-tab">{so(tb)} / 10</dd></div>
      </dl>
      <ul className="tlu-ds-thanh" aria-label="Điểm các đề gần đây">
        {daNop.slice(0, 5).map((x) => (
          <li key={x.id} className="tlu-hang-thanh">
            <div className="tlu-hang-thanh-dau">
              <span className="tlu-hang-thanh-nhan tlu-tab">{ngayGio(x.createdAt)}</span>
              <span className="tlu-hang-thanh-so tlu-tab">{so(x.score)} / 10 điểm</span>
            </div>
            <span className="tlu-thanh" aria-hidden="true"><span style={{ transform: `scaleX(${Math.max(0, Math.min(1, x.score / 10))})` }} /></span>
          </li>
        ))}
      </ul>
      <button type="button" className="tlu-nut-chu" onClick={onMo}>Mở Luyện đề cấu trúc</button>
    </section>
  )
}

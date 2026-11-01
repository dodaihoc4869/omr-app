// BẰNG CHỨNG CỦA MỘT EM (Hôm nay · 4 bảng — thầy chốt bản vẽ 01/11; sửa khi chốt: «bằng chứng ẩn phần cách tính đi, chỉ hiện các thông số sắc bén khiến hs
// tâm phục khẩu phục»). Bản vẽ: docs/ban-ve-trong-2610/gv-bang-chung-em.html (#dp · #ht · #ch · #lu) — KHÔNG có thẻ «Cách tính».
//   · Tấm toàn màn chồng lên màn thầy (cổng vẽ ở <body>), thanh trên: «‹ Hôm nay» · «Bằng chứng · <tên>» · «<lớp> · 14 ngày <từ> – <đến> · N lượt làm câu».
//   · Trái: Kết luận (màu của bảng thầy bấm, «<Tên bảng> · hạng x/y») · thẻ «Bằng chứng» (đánh số, mạnh → nhẹ: con số lớn, thanh Em / Cả lớp, chuỗi chữ bấm
//     lặp, hai ô so sánh, ví dụ cụ thể có ngày giờ).
//   · Phải: «4 chỉ số của em» (vạch xám = giữa lớp; chưa đủ dữ liệu ⇒ «—») · «14 ngày của em» (cột chồng câu làm kỹ / câu chọn khi chưa đọc hết đề, ngày
//     không làm tô đỏ, vạch đứt = mức ngày).
//   · Số CHỈ từ `/gv/bon-bang/em` (src/lib/bon-bang-api.ts). Esc / «Hôm nay» đóng.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { layBangChung } from '../../lib/bon-bang-api'
import { TEN_BANG, THU_TU_BANG, type DiemBon, type MaBang, type NgayBon, type TheBangChung, type TraLoiBangChung } from '../../lib/bon-bang-kieu'
import { chuDam } from './BonBang'
import './bon-bang.css'

/** «2026-10-30T14:14:00Z» ⇒ «30/10 21:14» (giờ VN). */
export function gioVn(iso: string): string {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return ''
  const d = new Date(t + 7 * 3_600_000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}
/** «2026-10-19» ⇒ «19/10». */
const ngayNgan = (n: string): string => (/^\d{4}-\d{2}-\d{2}$/.test(n) ? `${n.slice(8, 10)}/${n.slice(5, 7)}` : n)

function ChiSo({ bang, v, tv }: { bang: MaBang; v: number | null; tv: number | null }) {
  return (
    <div className="bbc-cs" data-bang={bang} data-trong={v === null ? '' : undefined}>
      <div className="bbc-cs-dau">
        <span>{TEN_BANG[bang]}</span>
        <b className="gvv2-so">
          {v === null ? '—' : Math.round(v)}
          <small>{v === null ? ' chưa đủ dữ liệu' : '/100'}</small>
        </b>
      </div>
      <div className="bbc-ray" role="img" aria-label={`${TEN_BANG[bang]}: ${v === null ? 'chưa đủ dữ liệu' : `${Math.round(v)} trên 100`}${tv !== null ? `, giữa lớp ${Math.round(tv)}` : ''}`}>
        {v !== null && <i style={{ width: `${Math.max(0, Math.min(100, v))}%` }} />}
        {tv !== null && <u style={{ left: `${Math.max(0, Math.min(100, tv))}%` }} />}
      </div>
    </div>
  )
}

function The({ t, thu }: { t: TheBangChung; thu: number }) {
  return (
    <div className="bbc-bc">
      <span className="bbc-so-tt gvv2-so" aria-hidden="true">{thu}</span>
      <div className="bbc-bc-than">
        <div className="bbc-tieu">
          <h4>{t.tieu}</h4>
          <span className="bbc-lon gvv2-so">
            {t.lon}
            {t.nhoSo && <small>{t.nhoSo}</small>}
          </span>
        </div>
        {t.so !== undefined && (
          <div className="bbc-ss-khoi" role="img" aria-label={`Em ${Math.round(t.so)}%${t.lop !== undefined ? `, cả lớp ${Math.round(t.lop)}%` : ''}`}>
            <div className="bbc-ss">
              <span>Em</span>
              <span className="bbc-thanh" data-loai="em"><i style={{ width: `${t.so}%` }} /></span>
              <b className="gvv2-so">{Math.round(t.so)}%</b>
            </div>
            {t.lop !== undefined && (
              <div className="bbc-ss">
                <span>Cả lớp</span>
                <span className="bbc-thanh" data-loai="lop"><i style={{ width: `${t.lop}%` }} /></span>
                <b className="gvv2-so">{Math.round(t.lop)}%</b>
              </div>
            )}
          </div>
        )}
        {t.chuoi && (
          <div className="bbc-chuoi" role="img" aria-label={`Chuỗi bấm: ${t.chuoi.chu.split('').join(' ')}, đúng ${t.chuoi.dung.length}/${t.chuoi.chu.length}`}>
            {t.chuoi.chu.split('').map((c, j) => (
              <span key={j} data-dung={t.chuoi!.dung.includes(j) ? '' : undefined}>{c}</span>
            ))}
          </div>
        )}
        {t.hai && (
          <div className="bbc-hai">
            {t.hai.map((h, j) => (
              <div key={j} data-lech={h.lech ? '' : undefined}>
                <span>{h.nhan}</span>
                <b className="gvv2-so">{h.so}</b>
                {h.phu && <span>{h.phu}</span>}
              </div>
            ))}
          </div>
        )}
        {t.viDu && t.viDu.length > 0 && (
          <div className="bbc-vd">
            {t.viDu.map((v, j) => (
              <div key={j}>
                <time className="gvv2-so">{gioVn(v.luc)}</time>
                <p>
                  {v.cau}
                  {v.phu && <small>{v.phu}</small>}
                </p>
                <span className="bbc-kq" data-dung={v.dung === true ? 'dung' : v.dung === false ? 'sai' : undefined}>{v.kq}</span>
              </div>
            ))}
          </div>
        )}
        {t.chu && <p className="bbc-chu">{chuDam(t.chu)}</p>}
      </div>
    </div>
  )
}

/** 14 cột chồng: câu làm kỹ (xanh) + câu chọn khi chưa đọc hết đề (chàm); ngày không làm câu nào ⇒ ô đỏ thấp; vạch đứt = mức ngày cao nhất trong 14 ngày. */
function MuoiBonNgay({ ngay }: { ngay: readonly NgayBon[] }) {
  const muc = Math.max(0, ...ngay.map((n) => n.muc))
  const tran = Math.max(1, muc * 1.2, ...ngay.map((n) => n.ky + n.voi))
  const tom = ngay.map((n) => `${ngayNgan(n.ngay)}: ${n.ky + n.voi === 0 ? 'không làm' : `${n.ky} câu kỹ${n.voi ? `, ${n.voi} câu vội` : ''}`}`).join('; ')
  return (
    <>
      <div className="bbc-ngay" role="img" aria-label={tom} style={{ gridTemplateColumns: `repeat(${Math.max(1, ngay.length)}, minmax(0, 1fr))` }}>
        {ngay.map((n) =>
          n.ky + n.voi === 0 ? (
            <span key={n.ngay} className="bbc-cot" data-khong="" style={{ height: '12%' }} />
          ) : (
            <span key={n.ngay} className="bbc-cot" style={{ height: `${Math.round(((n.ky + n.voi) / tran) * 100)}%` }}>
              <i data-loai="ky" style={{ height: `${Math.round((n.ky / (n.ky + n.voi)) * 100)}%` }} />
              <i data-loai="voi" style={{ height: `${Math.round((n.voi / (n.ky + n.voi)) * 100)}%` }} />
            </span>
          ),
        )}
        {muc > 0 && <span className="bbc-muc" style={{ bottom: `${Math.round((muc / tran) * 100)}%` }} />}
      </div>
      <div className="bbc-ngay-nhan" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${Math.max(1, ngay.length)}, minmax(0, 1fr))` }}>
        {ngay.map((n) => (
          <span key={n.ngay}>{n.ngay.slice(8, 10)}</span>
        ))}
      </div>
      <p className="bbc-chu-giai" aria-hidden="true">
        <span data-loai="ky">câu làm kỹ</span>
        <span data-loai="voi">câu chọn khi chưa đọc hết đề</span>
        <span data-loai="khong">không làm</span>
      </p>
    </>
  )
}

const cs = (d: DiemBon, k: MaBang) => d[k]

export default function BangChungBon({ sbd, hoTen, lop, bang, onDong }: { sbd: string; hoTen: string; lop: string; bang: MaBang; onDong: () => void }) {
  const [du, setDu] = useState<TraLoiBangChung | null>(null)
  const [loi, setLoi] = useState('')
  const [lan, setLan] = useState(0)
  const nutVe = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    let huy = false
    setLoi('')
    void layBangChung(sbd, bang).then((r) => {
      if (huy) return
      if (r.ok) setDu(r.du)
      else setLoi(r.chu)
    })
    return () => {
      huy = true
    }
  }, [sbd, bang, lan])
  useEffect(() => {
    nutVe.current?.focus()
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDong()
    }
    window.addEventListener('keydown', phim)
    return () => window.removeEventListener('keydown', phim)
  }, [onDong])

  const ten = du?.em.hoTen || hoTen
  const phu = du
    ? `${du.em.lop || lop} · 14 ngày ${ngayNgan(du.tu)} – ${ngayNgan(du.den)} · ${du.soLuot ? `${du.soLuot} lượt làm câu` : 'không có lượt làm câu'}`
    : lop
  const k = du?.bang ?? bang
  const dongKet = (du?.ketLuan ?? '').split('\n').map((x) => x.trim()).filter(Boolean)

  return createPortal(
    <div className="m3 m3-thay vo-thay" style={{ display: 'contents' }}>
      <div className="bbc-man" role="dialog" aria-modal="true" aria-labelledby="bbc-tieu" data-bang={k}>
        <header className="bbc-tren">
          <button ref={nutVe} type="button" className="bbc-ve tt-nhan" onClick={onDong}>
            <ArrowLeft size={18} aria-hidden="true" />
            Hôm nay
          </button>
          <div className="bbc-tren-chu">
            <h1 id="bbc-tieu">Bằng chứng · {ten}</h1>
            <p className="gvv2-so">{phu}</p>
          </div>
        </header>
        <div className="bbc-than">
          {!du ? (
            loi ? (
              <div className="bb-the bb-loi" role="alert">
                <p>Chưa tải được bằng chứng. {loi}</p>
                <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => setLan((x) => x + 1)}>
                  <RefreshCw size={16} aria-hidden="true" />
                  Thử lại
                </button>
              </div>
            ) : (
              <div className="bbc-cho" role="status" aria-label="Đang tải bằng chứng">
                <span className="gv-xuong-khoi tt-xuong" style={{ width: '100%', height: 96 }} />
                <span className="gv-xuong-khoi tt-xuong" style={{ width: '100%', height: 220 }} />
              </div>
            )
          ) : (
            <div className="bbc-luoi">
              <div className="bbc-cot-chinh">
                {du.ketLuan && (
                  <div className="bbc-ket">
                    <p className="bbc-ket-nhan">
                      Kết luận · {TEN_BANG[k]}
                      {du.hang ? ` · hạng ${du.hang.thu}/${du.hang.tong}` : ''}
                    </p>
                    {/* thầy 01/11: «làm rõ ràng và nổi bật hơn, hai con số kia liền nhau, cách dòng xuống» ⇒ dòng đầu = nhận định, mỗi lý do một dòng, số to */}
                    <p className="bbc-ket-chu">{chuDam(dongKet[0] ?? '')}</p>
                    {dongKet.length > 1 && (
                      <ul className="bbc-ket-ds">
                        {dongKet.slice(1).map((x, i) => <li key={i}>{chuDam(x)}</li>)}
                      </ul>
                    )}
                  </div>
                )}
                <section className="bb-the bbc-the-bc" aria-labelledby="bbc-bc-tieu">
                  <div className="bbc-the-dau">
                    <h3 id="bbc-bc-tieu">Bằng chứng</h3>
                    <span>xếp từ mạnh tới nhẹ</span>
                  </div>
                  {du.the.length === 0 ? <p className="bb-trong">Chưa có bằng chứng nào trong 14 ngày.</p> : du.the.map((t, i) => <The key={t.ma + i} t={t} thu={i + 1} />)}
                </section>
              </div>
              <div className="bbc-cot-phu">
                <section className="bb-the" aria-labelledby="bbc-cs-tieu">
                  <div className="bbc-the-dau">
                    <h3 id="bbc-cs-tieu">4 chỉ số của em</h3>
                    <span>vạch xám = giữa lớp</span>
                  </div>
                  <div className="bbc-bon-so">
                    {THU_TU_BANG.map((b) => (
                      <ChiSo key={b} bang={b} v={cs(du.diem, b)} tv={cs(du.trungVi, b)} />
                    ))}
                  </div>
                </section>
                {du.ngay.length > 0 && (
                  <section className="bb-the" aria-labelledby="bbc-ngay-tieu">
                    <div className="bbc-the-dau">
                      <h3 id="bbc-ngay-tieu">14 ngày của em</h3>
                      {Math.max(0, ...du.ngay.map((n) => n.muc)) > 0 && <span className="gvv2-so">mức {Math.max(...du.ngay.map((n) => n.muc))} câu/ngày</span>}
                    </div>
                    <MuoiBonNgay ngay={du.ngay} />
                  </section>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

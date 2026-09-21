// BÁO CÁO MỘT EM TRONG CA — trang của THẦY (Xem điểm bản 2 · GV-2; bản vẽ docs/ban-ve-xem-diem-2109/gv-2-bao-cao-mot-em.html, Boss duyệt 21/09).
// Chỉ VẼ số đã tính ở lib/bao-cao-mot-em.ts; dùng bộ thành phần chung `xd-*` của Code 2. Khối nào không có dữ liệu thật thì ẨN, không bịa:
// (bậc từng dạng, so với lần trước, "A.I Đỗ Đại Học đã lo", lịch ôn, tiến bộ qua các ca) chờ /gv/bao-cao-ca-em của Code 3.
// Trang thay hộp báo cáo cũ CHỈ ở đường của thầy (màn Theo dõi ca); hộp cũ vẫn dùng cho học sinh/phụ huynh.
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Minus, TrendingDown, TrendingUp, X } from 'lucide-react'
import '../m3'
import '../xem-diem/xem-diem.css'
import './xem-diem-gv.css'
import { NutXd, ThanhTrenXd } from '../xem-diem/thanh-phan'
import { ChemText } from '../../lib/chem-format'
import { chuanHoaLoiGiaiCau } from '../../lib/chuan-hoa-loi-giai'
import { soVn } from '../../lib/ket-qua-sau-nop'
import { chuGiay } from '../../lib/bao-cao-ca-lop'
import type { BaoCaoMotEm, CauXemLai, KetQuaCau, PhanChiTiet } from '../../lib/bao-cao-mot-em'
import { chuDapAn, TEN_PHAN_DAY_DU } from './BaoCaoCaLop'

type TrangThaiLuot = 'dang_lam' | 'da_nop' | 'khoa' | 'duoc_duyet_lai'

const CHU_KQ: Record<KetQuaCau, string> = { dung: 'đúng', sai: 'sai', mot_phan: 'đúng một phần', trong: 'bỏ trống' }
const KIEU_O: Record<KetQuaCau, string> = { dung: 'xd-o--dung', sai: 'xd-o--sai', mot_phan: 'xd-o--mot-phan', trong: '' }

/** "Nộp lúc 09:12 · Thứ Bảy 19/09/2026" (giờ 24, múi giờ Việt Nam); mốc hỏng ⇒ null. */
export function chuNopLuc(v: unknown): string | null {
  const t = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Date.parse(v) : NaN
  if (!Number.isFinite(t)) return null
  const d = new Date(t)
  const mui = 'Asia/Ho_Chi_Minh'
  const gio = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: mui })
  const thu = d.toLocaleDateString('vi-VN', { weekday: 'long', timeZone: mui })
  const ngay = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: mui })
  return `Nộp lúc ${gio} · ${thu.charAt(0).toUpperCase()}${thu.slice(1)} ${ngay}`
}

function XuongMuc({ id, muc }: { id: string; muc: string }) {
  return (
    <a
      href={`#${id}`}
      onClick={(e) => {
        e.preventDefault()
        document.getElementById(id)?.scrollIntoView({ block: 'start' })
      }}
    >
      {muc}
    </a>
  )
}

function KetQuaEm({ bc, phutDe, nopLuc }: { bc: BaoCaoMotEm; phutDe: number; nopLuc: unknown }) {
  const diem = bc.tong ?? 0
  const r = 52
  const cv = 2 * Math.PI * r
  const dat = (Math.max(0, Math.min(10, diem)) / 10) * cv
  const nop = chuNopLuc(nopLuc)
  return (
    <section className="xd-muc" id="gv2-ket-qua" aria-labelledby="gv2-t-kq">
      <section className="xd-the xd-kq">
        <div className="xd-vong" role="img" aria-label={`Điểm ${soVn(diem)} trên 10`}>
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <circle className="nen" cx="60" cy="60" r={r} />
            <circle className="dat" cx="60" cy="60" r={r} strokeDasharray={`${dat.toFixed(1)} ${cv.toFixed(1)}`} />
          </svg>
          <div className="xd-vong__so">
            <b>{soVn(diem)}</b>
            <span>trên 10 điểm</span>
          </div>
        </div>
        <div className="xd-kq__chi-tiet">
          <h2 id="gv2-t-kq" className="xd-sr">
            Kết quả
          </h2>
          {bc.dung != null && bc.tongCau != null && (
            <p className="xd-kq__dong xd-so">
              Em ấy làm đúng {bc.dung}/{bc.tongCau} câu
            </p>
          )}
          {bc.chuThoiGian && (
            <p className="xd-kq__phu xd-so">
              Thời gian làm {bc.chuThoiGian}
              {phutDe > 0 ? ` (ca cho ${phutDe} phút)` : ''}
            </p>
          )}
          {nop && <p className="xd-kq__phu xd-so">{nop}</p>}
        </div>
      </section>
    </section>
  )
}

function SoVoiLopEm({ bc, tong }: { bc: BaoCaoMotEm; tong: number }) {
  const s = bc.soVoiLop
  if (!s) return null
  const lam = Math.round(s.hieu * 100) / 100
  const [lop, Bieu, dau, chu] = lam > 0 ? (['len', TrendingUp, '+', 'cao hơn trung bình lớp'] as const) : lam < 0 ? (['xuong', TrendingDown, '−', 'thấp hơn trung bình lớp'] as const) : (['bang', Minus, '', 'bằng trung bình lớp'] as const)
  return (
    <section className="xd-the" id="gv2-lop" aria-labelledby="gv2-t-lop">
      <div className="xd-muc__dau">
        <h2 id="gv2-t-lop">So với cả lớp</h2>
        <span className="xd-chip xd-chip--khoa">Chỉ thầy thấy mục này</span>
      </div>
      <dl className="gv-so gv2-so-lop">
        <div>
          <dt>Điểm của em ấy</dt>
          <dd className="xd-so">{soVn(tong)}</dd>
        </div>
        <div>
          <dt>Trung bình cả lớp</dt>
          <dd className="xd-so">{soVn(s.tbLop)}</dd>
        </div>
      </dl>
      <span className={`xd-ss xd-ss--${lop}`}>
        <Bieu className="xd-i" aria-hidden="true" />
        <span className="xd-so">
          {dau}
          {soVn(Math.abs(lam))} {chu}
        </span>
      </span>
      <p className="gv2-lop-chu xd-so">
        Đứng thứ {s.hang} trong {s.siSo} em đã nộp.
        {s.dangTotHon.length > 0 && ` ${s.dangTotHon.length === 1 ? 'Dạng' : `${s.dangTotHon.length} dạng`} em ấy làm tốt hơn cả lớp: ${s.dangTotHon.join(', ')}.`}
      </p>
    </section>
  )
}

function OCauVe({ phan }: { phan: PhanChiTiet }) {
  return (
    <ul className="xd-luoi" aria-label={`Từng câu của ${TEN_PHAN_DAY_DU[phan.ma]}`}>
      {phan.cau.map((c) => (
        <li key={c.soCau} className={`xd-o ${KIEU_O[c.kq]}`} aria-label={`Câu ${c.soCau}: ${CHU_KQ[c.kq]}`}>
          <span aria-hidden="true">{c.soCau}</span>
          {c.kq === 'dung' && <Check className="xd-i" aria-hidden="true" />}
          {c.kq === 'sai' && <X className="xd-i" aria-hidden="true" />}
          {c.kq === 'mot_phan' && <Minus className="xd-i" aria-hidden="true" />}
        </li>
      ))}
    </ul>
  )
}

function BaPhanEm({ bc }: { bc: BaoCaoMotEm }) {
  if (bc.phan.length === 0) return null
  return (
    <section className="xd-muc" id="gv2-ba-phan" aria-labelledby="gv2-t-ba-phan">
      <div className="xd-muc__dau">
        <h2 id="gv2-t-ba-phan">Ba phần của bài</h2>
        {bc.coBangCham && <p>Chạm một phần để xem từng câu</p>}
      </div>
      <div className="xd-phan-ds">
        {bc.phan.map((p) => {
          const dem = p.ma === 'II' ? `đúng trọn ${p.dung}/${p.tong} câu${p.motPhan > 0 ? `, ${p.motPhan} câu đúng một phần` : ''}` : `đúng ${p.dung}/${p.tong} câu`
          const noiDung = (
            <>
              <span className="xd-phan__ten">{TEN_PHAN_DAY_DU[p.ma]}</span>
              <span className="xd-phan__diem xd-so">
                {soVn(p.diem)}
                <small>/{soVn(p.toiDa)} điểm</small>
              </span>
              <span className="xd-phan__thanh" role="img" aria-label={dem}>
                <i style={{ width: `${p.toiDa > 0 ? Math.min(100, (p.diem / p.toiDa) * 100) : 0}%` }} />
              </span>
              <span className="xd-phan__dem xd-so">{dem}</span>
            </>
          )
          if (p.cau.length === 0) {
            return (
              <div className="xd-phan" key={p.ma}>
                <div className="xd-phan__nut">{noiDung}</div>
              </div>
            )
          }
          return (
            <details className="xd-phan gv2-phan" key={p.ma}>
              <summary className="xd-phan__nut">{noiDung}</summary>
              <div className="xd-phan__cau">
                <OCauVe phan={p} />
              </div>
            </details>
          )
        })}
      </div>
      {bc.coBangCham && (
        <p className="xd-chu-giai">
          <span>
            <Check className="xd-i" aria-hidden="true" /> Đúng
          </span>
          <span>
            <X className="xd-i" aria-hidden="true" /> Sai
          </span>
          <span>
            <Minus className="xd-i" aria-hidden="true" /> Phần II đúng một phần
          </span>
        </p>
      )}
    </section>
  )
}

function DangEm({ bc }: { bc: BaoCaoMotEm }) {
  if (bc.dang.length === 0) return null
  return (
    <section className="xd-muc" id="gv2-dang" aria-labelledby="gv2-t-dang">
      <div className="xd-muc__dau">
        <h2 id="gv2-t-dang">Theo dạng bài</h2>
        <p>{bc.dang.length} dạng trong ca này</p>
      </div>
      <p className="xd-muc__mo-ta">Dạng em ấy còn vấp được xếp lên trên.</p>
      <ul className="xd-dang-ds">
        {bc.dang.map((d) => (
          <li key={d.ten} className={`xd-dang${d.canOn ? ' xd-dang--vap' : ''}`}>
            <div className="xd-dang__ten">
              <span>{d.ten}</span>
              {d.canOn && <span className="xd-chip xd-chip--cho">Cần ôn thêm</span>}
            </div>
            <div className="xd-dang__hang">
              <span className="xd-dang__dem">
                Trong ca này đúng {d.dung}/{d.tong} câu
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function LoiGiaiKho({ c }: { c: CauXemLai }) {
  const lg = chuanHoaLoiGiaiCau(c.loiGiai, c.phan, c.dapAnDung)
  if (lg.thieu) return null // kho chưa có lời giải: không bày nút trống (đầu mục có nói số câu chưa có)
  return (
    <details className="xd-giai">
      <summary>
        Xem lời giải <ChevronDown className="xd-i" aria-hidden="true" />
      </summary>
      <div className="xd-giai__noi-dung">
        {lg.chot && (
          <p>
            <ChemText text={lg.chot} />
          </p>
        )}
        {lg.buoc && lg.buoc.length > 0 && (
          <ol>
            {lg.buoc.map((b, i) => (
              <li key={i}>
                <ChemText text={b} />
              </li>
            ))}
          </ol>
        )}
        {lg.ketQua && (
          <p>
            <ChemText text={lg.ketQua} />
          </p>
        )}
      </div>
    </details>
  )
}

function CauXemLaiEm({ bc }: { bc: BaoCaoMotEm }) {
  if (bc.cauXemLai.length === 0) return null
  // câu có đề trong kho mà kho chưa có lời giải (câu không có kho thì không nói — đã có dòng "chưa có đáp án" ở trên)
  const soCauThieuLoiGiai = bc.cauXemLai.filter((c) => c.de !== null && chuanHoaLoiGiaiCau(c.loiGiai, c.phan, c.dapAnDung).thieu).length
  return (
    <section className="xd-muc" id="gv2-cau" aria-labelledby="gv2-t-cau">
      <div className="xd-muc__dau">
        <h2 id="gv2-t-cau">Câu cần xem lại</h2>
        <p>{bc.cauXemLai.length} câu · thầy xem cả đáp án và lời giải</p>
      </div>
      {soCauThieuLoiGiai > 0 && (
        <p className="xd-muc__mo-ta" role="status">
          {soCauThieuLoiGiai} câu chưa có lời giải trong kho nên không có mục "Xem lời giải".
        </p>
      )}
      <div className="xd-cau-ds">
        {bc.cauXemLai.map((c) => {
          const bo = !/[^\s-]/.test(c.dapAnChon)
          return (
            <article className="xd-cau" key={c.qid}>
              <div className="xd-cau__dau">
                <h3 className="xd-cau__ten">
                  Câu {c.soCau} · {TEN_PHAN_DAY_DU[c.phan]}
                  {c.dang && <small>{c.dang}</small>}
                </h3>
                <span className={`xd-chip ${c.loai === 'sai' ? 'xd-chip--luu-y' : 'xd-chip--cho'}`}>{c.loai === 'sai' ? (bo ? 'Bỏ trống' : 'Sai') : 'Đúng nhưng làm lâu'}</span>
              </div>
              {c.de && (
                <p className="xd-cau__de">
                  <ChemText text={c.de} />
                </p>
              )}
              <div className="xd-cau__tra-loi">
                <div className={`xd-tl ${bo ? 'xd-tl--khoa' : c.loai === 'sai' ? 'xd-tl--em' : 'xd-tl--em-dung'}`}>
                  <b>{bo ? 'Em ấy' : 'Em ấy chọn'}</b>
                  <span>{bo ? 'bỏ trống' : chuDapAn(c.phan, c.dapAnChon)}</span>
                </div>
                {c.loai === 'sai' && (
                  <div className="xd-tl xd-tl--dung">
                    <b>Đáp án</b>
                    <span>{c.dapAnDung ? chuDapAn(c.phan, c.dapAnDung) : '—'}</span>
                  </div>
                )}
              </div>
              <LoiGiaiKho c={c} />
              {c.giay != null && (
                <p className="xd-cau__meta xd-so">
                  <span>Làm {chuGiay(c.giay)}</span>
                  {c.tbGiayLop != null && <span>Trung bình cả lớp {chuGiay(c.tbGiayLop)}</span>}
                </p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function ChuaCoBaoCao({ trangThai, soLanRoiMan, tongGiayRoiMan }: { trangThai: TrangThaiLuot; soLanRoiMan: number; tongGiayRoiMan: number }) {
  const chu =
    trangThai === 'dang_lam' ? 'Em ấy đang làm bài — báo cáo sẽ có sau khi em ấy nộp.' : trangThai === 'duoc_duyet_lai' ? 'Em ấy đang chờ thi lại — chưa có bài nộp để báo cáo.' : 'Bài của em ấy chưa có điểm — chưa có gì để báo cáo.'
  return (
    <section className="xd-the" id="gv2-ket-qua" role="status">
      <h2 className="xd-muc__dau">Chưa có báo cáo</h2>
      <p className="xd-muc__mo-ta">{chu}</p>
      {soLanRoiMan > 0 && (
        <p className="xd-muc__mo-ta xd-so">
          Rời màn làm bài {soLanRoiMan} lần, tổng {chuGiay(tongGiayRoiMan)}.
        </p>
      )}
    </section>
  )
}

/** Hai việc tiếp theo với em này: MỘT nút chính (toàn cảnh) + một nút phụ (giao bài riêng). */
function Hanh({ onToanCanh, onGiaoRieng }: { onToanCanh: () => void; onGiaoRieng: () => void }) {
  return (
    <section className="xd-muc gv2-hanh-dong" aria-label="Việc tiếp theo với em này">
      <NutXd kieu="chinh" rong onClick={onToanCanh}>
        Xem toàn cảnh em này
      </NutXd>
      <NutXd kieu="tonal" rong onClick={onGiaoRieng}>
        Giao bài riêng cho em này
      </NutXd>
    </section>
  )
}

interface Props {
  bc: BaoCaoMotEm
  hoTen: string
  sbd: string
  lop: string
  tenCa: string
  thoiGianPhut: number
  nopLuc: unknown
  trangThai: TrangThaiLuot
  soLanRoiMan: number
  tongGiayRoiMan: number
  onDong: () => void
  onToanCanh: () => void
  onGiaoRieng: () => void
}

/** Trang báo cáo một em — phủ kín màn, đóng bằng nút quay lại hoặc phím Esc. */
export default function BaoCaoMotEmTrang({ bc, hoTen, sbd, lop, tenCa, thoiGianPhut, nopLuc, trangThai, soLanRoiMan, tongGiayRoiMan, onDong, onToanCanh, onGiaoRieng }: Props) {
  const goc = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const truoc = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    goc.current?.querySelector<HTMLButtonElement>('.xd-nut-tron')?.focus()
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDong()
    }
    document.addEventListener('keydown', phim)
    return () => {
      document.body.style.overflow = truoc
      document.removeEventListener('keydown', phim)
    }
  }, [onDong])

  const ten = hoTen || `SBD ${sbd}`
  const phu = [tenCa, lop, `SBD ${sbd}`, thoiGianPhut > 0 ? `${thoiGianPhut} phút` : ''].filter(Boolean).join(' · ')
  const tong = bc.daNop ? bc.tong : null
  const mucLuc = [
    ['gv2-ket-qua', 'Kết quả', true],
    ['gv2-lop', 'So với lớp', bc.soVoiLop != null],
    ['gv2-ba-phan', 'Ba phần', bc.phan.length > 0],
    ['gv2-dang', 'Theo dạng bài', bc.dang.length > 0],
    ['gv2-cau', 'Câu cần xem lại', bc.cauXemLai.length > 0],
  ] as const

  return createPortal(
    <div ref={goc} className="m3 xd xd-gv gv2-trang" role="dialog" aria-modal="true" aria-label={`Báo cáo của ${ten}`}>
      <ThanhTrenXd ten={`Báo cáo · ${ten}`} phu={phu} onQuayLai={onDong} quayLai="Quay lại ca" />
      <div className="xd-khung xd-khung--rong">
        {tong != null ? (
          <div className="xd-bao-cao">
            <nav className="xd-muc-luc" aria-label="Các mục của báo cáo">
              <span className="xd-muc-luc__tieu">TRONG BÁO CÁO NÀY</span>
              <ul>
                {mucLuc
                  .filter((m) => m[2])
                  .map((m) => (
                    <li key={m[0]}>
                      <XuongMuc id={m[0]} muc={m[1]} />
                    </li>
                  ))}
              </ul>
            </nav>
            <div className="xd-bao-cao__noi-dung">
              <KetQuaEm bc={bc} phutDe={thoiGianPhut} nopLuc={nopLuc} />
              <SoVoiLopEm bc={bc} tong={tong} />
              <BaPhanEm bc={bc} />
              {!bc.coBangCham && (
                <p className="xd-muc__mo-ta" role="status">
                  Chưa xem được từng câu: máy này chưa có đáp án của ca nên không dựng lại được bảng chấm của em ấy.
                </p>
              )}
              <DangEm bc={bc} />
              <CauXemLaiEm bc={bc} />
              <Hanh onToanCanh={onToanCanh} onGiaoRieng={onGiaoRieng} />
            </div>
          </div>
        ) : (
          <>
            <ChuaCoBaoCao trangThai={trangThai} soLanRoiMan={soLanRoiMan} tongGiayRoiMan={tongGiayRoiMan} />
            <Hanh onToanCanh={onToanCanh} onGiaoRieng={onGiaoRieng} />
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

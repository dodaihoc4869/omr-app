import { useState } from 'react'
import { Bell, BookOpen, CalendarDays, ClipboardCheck, Eye, Gamepad2, PenLine, Presentation, Sparkles, TrendingDown, TrendingUp, Zap, Minus } from 'lucide-react'
import { TEN_BAC_DANG, TEN_XU_HUONG } from '../../lib/hom-nay-v2'
import { gioPhutVN, LOAI_SU_KIEN, luoiNhip, moiXemChu, nhomTheoNgay, TEN_LOAI, tomTatNhip, type DangCuaEm, type LoaiSuKien, type NhipNgay, type SuKienEm } from '../../lib/em-toan-canh'
import '../../styles/hom-nay-v2.css'
import '../../styles/toan-canh-em.css'

const BIEU_TUONG: Record<LoaiSuKien, typeof Bell> = {
  ca: CalendarDays,
  btvn: ClipboardCheck,
  on_lai: BookOpen,
  bai_rieng: PenLine,
  len_bang: Presentation,
  game: Gamepad2,
  exp: Zap,
  bo_nao: Sparkles,
  canh_bao: Bell,
  mo_app: Eye,
}

/** DÒNG THỜI GIAN — mọi việc em đã làm, mới nhất trên cùng, nhóm theo ngày, lọc theo loại. Chip đếm theo loại KHÔNG có (máy chủ không trả số đếm — không bịa). */
export function DongThoiGian({
  dong,
  loai,
  dangTai,
  loi,
  conNua,
  dangTaiThem,
  nayMs,
  onLoc,
  onThem,
  onMoCa,
}: {
  dong: SuKienEm[]
  loai: LoaiSuKien | ''
  dangTai: boolean
  loi: string
  conNua: boolean
  dangTaiThem: boolean
  nayMs: number
  onLoc: (l: LoaiSuKien | '') => void
  onThem: () => void
  onMoCa: (maCa: string) => void
}) {
  const nhom = nhomTheoNgay(dong, nayMs)
  // "Mở app" chưa có nguồn thật ở máy chủ ⇒ chỉ hiện bộ lọc đó khi thật sự thấy loại ấy (hợp đồng mục 8).
  const coMoApp = dong.some((v) => v.loai === 'mo_app') || loai === 'mo_app'
  const loc = LOAI_SU_KIEN.filter((l) => l !== 'mo_app' || coMoApp)
  return (
    <section className="hn2-the tc-dong" aria-labelledby="tc-dong-td" data-khoi="dong-thoi-gian">
      <div className="tc-dong-dau">
        <h2 id="tc-dong-td" className="hn2-tieu-de">
          Dòng thời gian · mọi việc em đã làm
        </h2>
        <span className="tc-phu">mới nhất trên cùng</span>
      </div>
      <div className="hn2-loc-lop" role="group" aria-label="Lọc theo loại việc">
        <button type="button" className="hn2-loc" aria-pressed={loai === ''} onClick={() => onLoc('')}>
          Tất cả
        </button>
        {loc.map((l) => (
          <button key={l} type="button" className="hn2-loc" aria-pressed={loai === l} onClick={() => onLoc(l)}>
            {TEN_LOAI[l]}
          </button>
        ))}
      </div>

      {loi && (
        <p className="hn2-ghi-chu hn2-ghi-chu--canh" role="alert">
          {loi}
        </p>
      )}
      {dangTai && <p className="hn2-trong">Đang tải…</p>}
      {!dangTai && !loi && dong.length === 0 && <p className="hn2-trong">{loai ? `Em chưa có việc loại “${TEN_LOAI[loai]}” nào được ghi.` : 'Em chưa có việc nào được ghi.'}</p>}

      {!dangTai &&
        nhom.map((n) => (
          <div className="tc-ngay" key={n.ngay || 'khong-ro'}>
            <h3 className="tc-ngay-nhan">
              {n.nhan}
              <span className="tc-phu">{n.viec.length} việc</span>
            </h3>
            {n.viec.map((v, i) => {
              const Icon = BIEU_TUONG[v.loai]
              return (
                <article className="tc-viec" key={`${v.luc}-${v.loai}-${i}`} data-loai={v.loai}>
                  <span className="tc-viec-gio">{gioPhutVN(v.luc)}</span>
                  <span className={`tc-viec-bieu tc-viec-bieu--${v.loai}`} aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <div className="tc-viec-noi-dung">
                    <span className="tc-viec-loai">{TEN_LOAI[v.loai]}</span>
                    <h4 className="tc-viec-tieu-de">{v.tieuDe}</h4>
                    {v.mota && <p className="tc-viec-mota">{v.mota}</p>}
                    {(v.chips.length > 0 || v.maCa) && (
                      <div className="tc-viec-chips">
                        {v.chips.map((c, k) => (
                          <span key={k} className={`hn2-chip hn2-chip--nho${c.muc === 'tot' ? ' hn2-chip--tot' : c.muc === 'sai' ? ' hn2-chip--loi' : ''}`}>
                            {c.chu}
                          </span>
                        ))}
                        {v.maCa && (
                          <button type="button" className="hn2-lien-ket" onClick={() => onMoCa(v.maCa)}>
                            Mở ca {v.maCa}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ))}

      {conNua && !dangTai && (
        <button type="button" className="hn2-lien-ket tc-them" onClick={onThem} disabled={dangTaiThem}>
          {dangTaiThem ? 'Đang tải…' : 'Xem thêm việc cũ hơn'}
        </button>
      )}
    </section>
  )
}

const SO_DANG_GON = 5

/** BẢN ĐỒ DẠNG — mỗi dạng một dòng: bậc, gặp / sai / đã khắc phục, xu hướng 7 ngày, câu sai gần nhất. */
export function BanDoDang({ dang }: { dang: DangCuaEm[] }) {
  const [het, setHet] = useState(false)
  const hien = het ? dang : dang.slice(0, SO_DANG_GON)
  return (
    <section className="hn2-the" aria-labelledby="tc-dang-td" data-khoi="ban-do-dang">
      <div className="tc-dong-dau">
        <h2 id="tc-dang-td" className="hn2-tieu-de">
          Bản đồ dạng
        </h2>
        {dang.length > 0 && <span className="tc-phu">{dang.length} dạng đã gặp</span>}
      </div>
      {dang.length === 0 && <p className="hn2-trong">Chưa có dạng nào đủ dữ liệu để hiện.</p>}
      {hien.map((d) => {
        const Icon = d.xuHuong === 'giam' ? TrendingDown : d.xuHuong === 'tang' ? TrendingUp : Minus
        const tiLe = d.sai != null && d.gap ? Math.min(100, Math.round((d.sai / d.gap) * 100)) : null
        return (
          <div className="tc-dang" key={d.ma || d.ten}>
            <div className="tc-dang-dau">
              <span className="tc-dang-ten">{d.ten}</span>
              {d.xuHuong && (
                <span className={`tc-dang-xh tc-dang-xh--${d.xuHuong}`}>
                  <Icon size={14} aria-hidden="true" />
                  {TEN_XU_HUONG[d.xuHuong]}
                </span>
              )}
            </div>
            <div className="tc-dang-so">
              {d.bac && <span className="hn2-chip hn2-chip--nho">bậc {TEN_BAC_DANG[d.bac]}</span>}
              {d.gap != null && <span>gặp {d.gap}</span>}
              {d.sai != null && <span>sai {d.sai}</span>}
              {d.khacPhuc != null && <span>đã khắc phục {d.khacPhuc}</span>}
            </div>
            {tiLe != null && (
              <span className="tc-dang-thanh" role="img" aria-label={`sai ${d.sai} trên ${d.gap} câu đã gặp`}>
                <i style={{ width: `${tiLe}%` }} />
              </span>
            )}
            {d.cauSaiGanNhat && (
              <p className="tc-dang-cau">
                Câu sai gần nhất: Câu {d.cauSaiGanNhat.stt}
                {d.cauSaiGanNhat.emChon && ` · em chọn ${d.cauSaiGanNhat.emChon}`}
                {d.cauSaiGanNhat.dapAn && ` (đáp án ${d.cauSaiGanNhat.dapAn})`}
              </p>
            )}
          </div>
        )
      })}
      {dang.length > SO_DANG_GON && (
        <button type="button" className="hn2-lien-ket" aria-expanded={het} onClick={() => setHet((v) => !v)}>
          {het ? 'Thu gọn' : `Xem cả ${dang.length} dạng`}
        </button>
      )}
    </section>
  )
}

const THU_NGAN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

/** NHỊP HỌC 30 NGÀY — lưới kiểu lịch, mỗi ô một ngày (đậm hơn = làm nhiều câu hơn). Chỉ đếm trong đúng các ngày máy chủ trả. */
export function NhipHoc30({ nhip, chuoiNgay }: { nhip: NhipNgay[]; chuoiNgay: number | null }) {
  const hang = luoiNhip(nhip)
  const tt = tomTatNhip(nhip)
  return (
    <section className="hn2-the" aria-labelledby="tc-nhip-td" data-khoi="nhip-hoc">
      <div className="tc-dong-dau">
        <h2 id="tc-nhip-td" className="hn2-tieu-de">
          Nhịp học 30 ngày
        </h2>
        {nhip.length > 0 && (
          <span className="tc-phu">
            học {tt.ngayHoc}/{tt.tong} ngày
          </span>
        )}
      </div>
      {nhip.length === 0 ? (
        <p className="hn2-trong">Chưa có số liệu nhịp học 30 ngày.</p>
      ) : (
        <>
          <div className="tc-nhip" role="img" aria-label={`Em học ${tt.ngayHoc} trong ${tt.tong} ngày gần nhất; chuỗi liền dài nhất ${tt.chuoiDaiNhat} ngày`}>
            {THU_NGAN.map((t) => (
              <span className="tc-nhip-thu" key={t}>
                {t}
              </span>
            ))}
            {hang.flat().map((o, i) =>
              o ? <span className={`tc-o tc-o--${o.muc}`} key={o.ngay} title={`${o.ngay.slice(8)}/${o.ngay.slice(5, 7)}`} /> : <span className="tc-o tc-o--rong" key={`t${i}`} />,
            )}
          </div>
          <div className="tc-nhip-chu">
            <span>
              {chuoiNgay != null && (
                <>
                  chuỗi hiện tại <b>{chuoiNgay} ngày</b> ·{' '}
                </>
              )}
              liền dài nhất trong 30 ngày <b>{tt.chuoiDaiNhat}</b>
            </span>
            <span className="tc-nhip-chu-thich" aria-hidden="true">
              ít
              <i className="tc-o tc-o--0" />
              <i className="tc-o tc-o--1" />
              <i className="tc-o tc-o--2" />
              <i className="tc-o tc-o--3" />
              nhiều
            </span>
          </div>
        </>
      )}
    </section>
  )
}

/** PHỤ HUYNH — lần xem app gần nhất (máy chủ chưa trả ⇒ nói thật). */
export function TheHuynh({ luc, nayMs }: { luc: string; nayMs: number }) {
  return (
    <section className="hn2-the" aria-labelledby="tc-ph-td" data-khoi="phu-huynh">
      <h2 id="tc-ph-td" className="hn2-tieu-de">
        Phụ huynh
      </h2>
      <p className="tc-ph-dong">{luc ? (
        <>
          Lần xem app gần nhất: <b>{moiXemChu(luc, nayMs)}</b>
        </>
      ) : (
        'Máy chủ chưa trả lần xem app của phụ huynh.'
      )}</p>
    </section>
  )
}

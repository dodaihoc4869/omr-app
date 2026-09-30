// THẺ "LUYỆN ĐỀ CẤU TRÚC" trong Tu luyện (30/09, thầy lệnh: "cho vào bên trong tu luyện, thêm một thẻ cạnh thẻ tổng hợp là Luyện đề cấu trúc,
// giữ nguyên tính năng thuật toán thay đổi giao diện cho phù hợp đẹp mắt"). NẠP LƯỜI từ ManTuLuyen (mảnh ngoài precache — vite.config.ts).
// LUẬT GIỮ NGUYÊN: lõi dùng chung `luyen-de/dung-luyen-de.ts` (y như LuyenDeChuan): rút đề + cổng quyền + chấm + lịch sử ở máy chủ `/luyen-de/*`,
// 50 phút theo mốc máy chủ, tự nộp khi hết giờ, lưu nháp máy + máy chủ. Đáp án + lời giải CHỈ có sau nộp (máy chủ mới gửi `solutions`).
// Chỉ đổi GIAO DIỆN: giới thiệu (cấu trúc đề 3 phần + lượt gần đây) → làm bài (TheCau `thi`, đồng hồ gọn, tiến độ, nhảy câu theo phần)
// → kết quả (điểm /10, theo phần I/II/III, xem lại từng câu có đáp án + lời giải + Hỏi thầy).
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import TheCau from '../TheCau'
import NutHoiThay from '../loi-giai/NutHoiThay'
import { hoiXacNhan } from '../hop-thoai'
import { useGiayConLai, type KhoGio } from '../../lib/dong-ho-thi'
import { demDaLam, useLuyenDe, type DieuKienLuyenDe, type LuotLuyenDe, type PaperLuyenDe } from '../luyen-de/dung-luyen-de'
import type { PublicExamBank } from '../../data/examContent'
import './luyen-de-cau-truc.css'

type Phan = 'I' | 'II' | 'III'
type Chu = 'A' | 'B' | 'C' | 'D'
type DS = 'D' | 'S'
type CauDe = PublicExamBank['phanI'][number] | PublicExamBank['phanII'][number] | PublicExamBank['phanIII'][number]

/** Cấu trúc đề Bộ 2026 (đúng ma trận máy chủ rút: src/lib/ma-tran-hoa-2026.ts SO_CAU_CHUAN_2026) + thang điểm của `chamDeChuan`. */
export const CAU_TRUC_DE: { phan: Phan; ten: string; soCau: number; diemToiDa: number; cach: string }[] = [
  { phan: 'I', ten: 'Trắc nghiệm', soCau: 18, diemToiDa: 4.5, cach: 'Chọn 1 trong 4 đáp án · 0,25 điểm mỗi câu' },
  { phan: 'II', ten: 'Đúng–sai', soCau: 4, diemToiDa: 4, cach: '4 ý mỗi câu · đúng cả 4 ý được 1 điểm' },
  { phan: 'III', ten: 'Trả lời ngắn', soCau: 6, diemToiDa: 1.5, cach: 'Điền số · 0,25 điểm mỗi câu' },
]
const TEN_PHAN: Record<Phan, string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }
export const MO_TA_LUYEN_DE = '50 phút · 28 câu đúng cấu trúc đề Bộ · rút từ Bộ đề lớp 12'

const so = (n: number, le = 2) => n.toLocaleString('vi-VN', { maximumFractionDigits: le })
const ngayGio = (ms: number) => {
  const d = new Date(ms)
  const h = (n: number) => String(n).padStart(2, '0')
  return `${h(d.getHours())}:${h(d.getMinutes())} · ${h(d.getDate())}/${h(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function IconLuyenDe({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M15 3v4h4" />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
    </svg>
  )
}
export function IconKhoa({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  )
}
function IconVe() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}
function IconDongHo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5M9.5 2.5h5" />
    </svg>
  )
}

/** Đồng hồ gọn — NÚT LÁ duy nhất vẽ lại mỗi giây (đỏ khi ≤ 5 phút). */
function DongHoGon({ kho, giayDau }: { kho: KhoGio | null; giayDau: number }) {
  const song = useGiayConLai(kho)
  const s = kho ? Math.max(0, Math.ceil(song ?? 0)) : giayDau
  return (
    <span className="ldct-dong-ho" data-gap={s <= 300 ? 'true' : 'false'}>
      <IconDongHo />
      <span className="tlu-tab" aria-label="Thời gian còn lại">{Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}</span>
    </span>
  )
}

const daLamCau = (v: string | undefined) => !!(v && v.trim() && v !== '----')

/** Một câu ĐANG LÀM (TheCau `thi` — không có `correct`/lời giải). memo: chọn một câu chỉ vẽ lại câu đó (máy yếu). */
const CauLam = memo(function CauLam({ q, phan, stt, giaTri, onDoi }: { q: CauDe; phan: Phan; stt: number; giaTri: string; onDoi: (id: string, v: string) => void }) {
  const chung = { ...q, cheDo: 'thi' as const, stt }
  let the
  if ('choices' in q)
    the = <TheCau {...chung} phan="I" choices={q.choices} choiceImgs={q.choiceImgs} choicePerm={[0, 1, 2, 3]} selected={(giaTri || null) as Chu | null} onSelect={(v) => onDoi(q.id, v)} />
  else if ('ideas' in q)
    the = (
      <TheCau
        {...chung}
        phan="II"
        ideas={q.ideas}
        ideaImgs={q.ideaImgs}
        selected={Array.from({ length: 4 }, (_, j) => {
          const v = (giaTri || '')[j]
          return v === 'D' || v === 'S' ? v : null
        })}
        onSelect={(j, v) => {
          const a = (giaTri || '----').split('')
          a[j] = v
          onDoi(q.id, a.join(''))
        }}
      />
    )
  else the = <TheCau {...chung} phan="III" selected={giaTri} onChange={(v) => onDoi(q.id, v)} />
  return (
    <article id={`ldct-cau-${phan}-${stt}`} className="tlu-the-cau m3 ldct-cau" data-da-lam={daLamCau(giaTri) ? 'true' : 'false'}>
      <div className="tlu-the-cau-dau">
        <span className="tlu-so-cau">Câu {stt}</span>
        <span className="tlu-nhan">Phần {phan} · {TEN_PHAN[phan]}</span>
      </div>
      {the}
    </article>
  )
})

type Props = {
  token: string
  sbd: string
  /** Cổng do máy chủ tính (`/luyen-de/dieu-kien`); `null` = máy chủ chưa trả lời được lệnh này ⇒ giữ cổng cũ (em tự xác nhận, máy chủ chặn ở `start`). */
  dieuKien: DieuKienLuyenDe | null
  dangTaiDieuKien: boolean
  /** Nộp xong / mở đề ⇒ báo ManTuLuyen tải lại cổng + điểm cho thẻ Tổng hợp. */
  onDoi: () => void
}

export default function LuyenDeCauTruc({ token, sbd, dieuKien, dangTaiDieuKien, onDoi }: Props) {
  const ld = useLuyenDe(sbd, token)
  const { paper, history, busy, error, ready, setReady, open } = ld

  // Nộp xong ⇒ thẻ Tổng hợp + trạng thái thẻ ở ManTuLuyen tải lại.
  const daNop = paper?.status === 'submitted' ? paper.id : ''
  const onDoiRef = useRef(onDoi)
  onDoiRef.current = onDoi
  useEffect(() => {
    if (daNop) onDoiRef.current()
  }, [daNop])

  if (paper) return createPortal(<ManDe ld={ld} />, document.body)

  const trangThai = dieuKien?.trangThai ?? null
  const khoa = trangThai === 'khoa'
  const canTick = trangThai !== 'mo' // 'can_xac_nhan' hoặc chưa rõ (máy chủ cũ) ⇒ em tự xác nhận như cổng cũ
  const dangLam = history.find((h) => h.status === 'active')
  const nhanNut = busy ? 'Đang chuẩn bị đề…' : dangLam ? 'Làm tiếp bài đang làm' : 'Bắt đầu đề mới · 50 phút'
  const chuTrangThai = khoa ? 'Đang khoá' : trangThai === 'mo' ? 'Đã mở cho em' : trangThai === 'can_xac_nhan' ? 'Cần em xác nhận' : ''

  return (
    <div className="ldct-gioi-thieu">
      <section className="ldct-the" data-khoa={khoa ? 'true' : 'false'} aria-labelledby="ldct-ten">
        <span className="ldct-the-icon"><IconLuyenDe size={30} /></span>
        <div className="ldct-the-chu">
          <h2 id="ldct-ten" className="ldct-the-ten">Luyện đề cấu trúc</h2>
          <p className="ldct-the-phu">{MO_TA_LUYEN_DE}</p>
        </div>
        {chuTrangThai && (
          <span className="ldct-trang-thai" data-kieu={trangThai ?? ''}>
            {khoa && <IconKhoa size={14} />}
            {chuTrangThai}
          </span>
        )}
        {khoa && (
          <p className="ldct-ly-do" role="status">
            <IconKhoa size={18} />
            <span>{dieuKien?.lyDo || 'Mục này đang khoá với em.'}</span>
          </p>
        )}
      </section>

      {!khoa && (
        <section className="tlu-cau-hinh ldct-bat-dau" aria-label="Bắt đầu luyện đề">
          {dangTaiDieuKien && !dieuKien ? (
            <p className="tlu-ghi" role="status">Đang kiểm tra quyền luyện đề của em…</p>
          ) : (
            canTick && !dangLam && (
              <label className="tlu-o-chon">
                <input type="checkbox" checked={ready} onChange={(e) => setReady(e.target.checked)} />
                <span className="tlu-o-chon-chu">Em đã học xong toàn bộ chương trình.</span>
              </label>
            )
          )}
          {error && <p className="tlu-ghi" data-kieu="loi" role="alert">{error}</p>}
          <button
            type="button"
            className="tlu-nut-chinh tlu-nut-rong"
            disabled={busy || (dangTaiDieuKien && !dieuKien) || (!dangLam && canTick && !ready)}
            onClick={() => void (dangLam ? open(dangLam.id) : open())}
          >
            {nhanNut}
          </button>
        </section>
      )}

      <section className="tlu-khoi" aria-labelledby="ldct-h-cau-truc">
        <h2 id="ldct-h-cau-truc" className="tlu-muc">Cấu trúc đề</h2>
        <ul className="ldct-cau-truc">
          {CAU_TRUC_DE.map((p) => (
            <li key={p.phan} data-phan={p.phan}>
              <span className="ldct-ct-nhan">Phần {p.phan} · {p.ten}</span>
              <b className="baloo tlu-tab">{p.soCau} câu</b>
              <span className="ldct-ct-diem tlu-tab">tối đa {so(p.diemToiDa)} điểm</span>
              <span className="ldct-ct-cach">{p.cach}</span>
            </li>
          ))}
        </ul>
        <dl className="tlu-kpi ldct-kpi">
          <div><dt>Thời gian</dt><dd className="tlu-tab">50 phút</dd></div>
          <div><dt>Tổng số câu</dt><dd className="tlu-tab">28 câu</dd></div>
          <div><dt>Thang điểm</dt><dd className="tlu-tab">10 điểm</dd></div>
          <div><dt>Nguồn câu</dt><dd>Bộ đề lớp 12</dd></div>
        </dl>
        <p className="tlu-ghi">Hết 50 phút bài tự nộp. Đáp án và lời giải hiện sau khi em nộp.</p>
      </section>

      <LuotGanDay history={history} busy={busy} onMo={(id) => void open(id)} khoa={khoa} />
      {khoa && error && <p className="tlu-ghi" data-kieu="loi" role="alert">{error}</p>}
    </div>
  )
}

function LuotGanDay({ history, busy, onMo, khoa }: { history: LuotLuyenDe[]; busy: boolean; onMo: (id: string) => void; khoa: boolean }) {
  const [het, setHet] = useState(false)
  const ds = het ? history : history.slice(0, 5)
  return (
    <section className="tlu-khoi" aria-labelledby="ldct-h-luot">
      <h2 id="ldct-h-luot" className="tlu-muc">Lượt luyện đề gần đây</h2>
      {history.length === 0 ? (
        <p className="tlu-ghi">{khoa ? 'Chưa có lượt luyện đề nào.' : 'Chưa có lượt luyện đề nào. Làm đề đầu tiên — nộp xong điểm hiện ở đây và ở thẻ Tổng hợp.'}</p>
      ) : (
        <ul className="tlu-ds-luot">
          {ds.map((h) => (
            <li key={h.id}>
              <div className="tlu-goi-y-chu">
                <b>{h.status === 'active' ? 'Bài đang làm' : 'Đề cấu trúc 28 câu'}</b>
                <span className="tlu-tab">{ngayGio(h.createdAt)}</span>
              </div>
              <span className="tlu-luot-so tlu-tab ldct-luot-diem" data-kieu={h.status === 'active' ? 'dang' : 'xong'}>
                {h.status === 'active' ? 'Đang làm' : h.score == null ? 'Đã nộp' : `${so(h.score)} / 10 điểm`}
              </span>
              <button type="button" className="tlu-nut-phu" disabled={busy} onClick={() => onMo(h.id)}>
                {h.status === 'active' ? 'Làm tiếp' : 'Xem lại'}
              </button>
            </li>
          ))}
        </ul>
      )}
      {history.length > 5 && (
        <button type="button" className="tlu-nut-chu" onClick={() => setHet((x) => !x)}>{het ? 'Thu gọn' : `Xem cả ${history.length} lượt`}</button>
      )}
    </section>
  )
}

type LD = ReturnType<typeof useLuyenDe>

/** Danh sách câu theo phần kèm số thứ tự trong phần (đề Bộ đánh số lại từ 1 mỗi phần, như bản cũ). */
function theoPhan(bank: PublicExamBank): { phan: Phan; cau: CauDe[] }[] {
  return [
    { phan: 'I', cau: bank.phanI },
    { phan: 'II', cau: bank.phanII },
    { phan: 'III', cau: bank.phanIII },
  ]
}

function ManDe({ ld }: { ld: LD }) {
  const { paper } = ld
  if (!paper) return null
  return paper.status === 'submitted' ? <ManKetQua ld={ld} paper={paper} /> : <ManLam ld={ld} paper={paper} />
}

function ManLam({ ld, paper }: { ld: LD; paper: PaperLuyenDe }) {
  const { answers, busy, error, saved, khoGio, seconds, submit, setPaper } = ld
  const cuonRef = useRef<HTMLDivElement>(null)
  const dauRef = useRef<HTMLElement>(null)
  // `change` của lõi đổi mỗi lần vẽ ⇒ giữ qua ref để CauLam (memo) không vẽ lại cả đề khi em chọn một câu.
  const changeRef = useRef(ld.change)
  changeRef.current = ld.change
  const doi = useCallback((id: string, v: string) => changeRef.current(id, v), [])

  const phans = useMemo(() => theoPhan(paper.bank), [paper.bank])
  const tong = phans.reduce((n, p) => n + p.cau.length, 0)
  const daLam = demDaLam(answers)

  const nhayToi = (phan: Phan, stt: number) => {
    const el = document.getElementById(`ldct-cau-${phan}-${stt}`)
    const cuon = cuonRef.current
    if (!el || !cuon) return
    const cao = dauRef.current?.offsetHeight ?? 0
    const top = cuon.scrollTop + el.getBoundingClientRect().top - cuon.getBoundingClientRect().top - cao - 8
    cuon.scrollTo({ top, behavior: 'smooth' })
  }

  const nop = async () => {
    const conTrong = tong - daLam
    const dongY = await hoiXacNhan({
      tieuDe: 'Nộp bài luyện đề?',
      noiDung: conTrong > 0
        ? `Em đã làm ${daLam}/${tong} câu, còn ${conTrong} câu chưa làm — câu bỏ trống không được điểm. Nộp xong em xem điểm, đáp án và lời giải.`
        : `Em đã làm đủ ${tong}/${tong} câu. Nộp xong em xem điểm, đáp án và lời giải.`,
      nhanDongY: 'Nộp bài',
      nhanKhong: 'Làm tiếp',
      vo: 'm3',
    })
    if (dongY) void submit()
  }

  return (
    <div ref={cuonRef} className="tlu ldct-toan" data-chang="lam">
      <header ref={dauRef} className="tlu-dau tlu-dau-lam ldct-dau">
        <div className="tlu-hang">
          <button type="button" className="tlu-ve" aria-label="Về giới thiệu đề (bài vẫn giữ, giờ vẫn chạy)" onClick={() => setPaper(null)}><IconVe /></button>
          <div className="tlu-tieu-khoi ldct-dau-chu">
            <h1 className="tlu-tieu tlu-tieu-nho">Luyện đề cấu trúc</h1>
            <p className="tlu-phu tlu-tab">Đã làm {daLam}/{tong} câu</p>
          </div>
          <DongHoGon kho={khoGio} giayDau={seconds} />
        </div>
        <div className="tlu-tien-do" role="progressbar" aria-label="Số câu đã làm" aria-valuemin={0} aria-valuemax={tong} aria-valuenow={daLam}>
          <span style={{ transform: `scaleX(${tong ? daLam / tong : 0})` }} />
        </div>
        <nav className="ldct-dieu-huong" aria-label="Chuyển tới câu">
          {phans.map((p) => (
            <div key={p.phan} className="ldct-dh-phan">
              <span className="ldct-dh-nhan">Phần {p.phan}</span>
              {p.cau.map((q, i) => (
                <button
                  key={q.id}
                  type="button"
                  className="ldct-dh-o tlu-tab"
                  data-da-lam={daLamCau(answers[q.id]) ? 'true' : 'false'}
                  aria-label={`Phần ${p.phan} câu ${i + 1}${daLamCau(answers[q.id]) ? ', đã làm' : ', chưa làm'}`}
                  onClick={() => nhayToi(p.phan, i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </header>
      <main className="tlu-than tlu-ds-cau">
        {error && <p className="tlu-bao" data-kieu="loi" role="alert">{error}</p>}
        {phans.map((p) => (
          <section key={p.phan} className="ldct-phan" aria-labelledby={`ldct-h-phan-${p.phan}`}>
            <h2 id={`ldct-h-phan-${p.phan}`} className="tlu-muc ldct-phan-ten">
              Phần {p.phan} · {TEN_PHAN[p.phan]} <span className="tlu-muc-phu tlu-tab">{p.cau.length} câu</span>
            </h2>
            {p.cau.map((q, i) => (
              <CauLam key={q.id} q={q} phan={p.phan} stt={i + 1} giaTri={answers[q.id] || ''} onDoi={doi} />
            ))}
          </section>
        ))}
      </main>
      <footer className="tlu-thanh-nop">
        <div className="tlu-thanh-nop-trong">
          <div className="tlu-thanh-so">
            <b className="tlu-so-lon">{daLam}/{tong}</b>
            <span role="status" className="ldct-luu">câu đã làm{saved ? ` · ${saved}` : ''}</span>
          </div>
          <button type="button" className="tlu-nut-chinh" disabled={busy} onClick={() => void nop()}>
            {busy ? 'Đang nộp…' : 'Nộp bài'}
          </button>
        </div>
      </footer>
    </div>
  )
}

/** Điểm của một câu từ `result.detail` (máy chủ chấm). Không có detail (bài rất cũ) ⇒ null. */
function diemCau(paper: PaperLuyenDe, id: string): number | null {
  const d = paper.result?.detail?.[id]
  return d && typeof d.points === 'number' ? d.points : null
}

export function tinhTheoPhan(paper: PaperLuyenDe) {
  return theoPhan(paper.bank).map((p) => {
    const toiDa = CAU_TRUC_DE.find((c) => c.phan === p.phan)!
    let diem = 0
    let dung = 0
    let coDiem = false
    for (const q of p.cau) {
      const d = diemCau(paper, q.id)
      if (d === null) continue
      coDiem = true
      diem += d
      if ((p.phan === 'II' && d >= 1) || (p.phan !== 'II' && d > 0)) dung++
    }
    return { phan: p.phan, soCau: p.cau.length, dung, diem: Math.round(diem * 100) / 100, toiDa: p.phan === 'II' ? p.cau.length : p.cau.length * 0.25, coDiem, ten: toiDa.ten }
  })
}

function ManKetQua({ ld, paper }: { ld: LD; paper: PaperLuyenDe }) {
  const { setPaper, getSolution, error } = ld
  const [chiSai, setChiSai] = useState(false)
  const diem = paper.result?.score ?? 0
  const phans = useMemo(() => theoPhan(paper.bank), [paper.bank])
  const cacPhan = useMemo(() => tinhTheoPhan(paper), [paper])
  const coDetail = cacPhan.some((p) => p.coDiem)
  const tong = phans.reduce((n, p) => n + p.cau.length, 0)
  const soSai = phans.reduce((n, p) => n + p.cau.filter((q) => { const d = diemCau(paper, q.id); return d !== null && d < (p.phan === 'II' ? 1 : 0.25) }).length, 0)
  const soTrong = phans.reduce((n, p) => n + p.cau.filter((q) => !daLamCau(paper.answers[q.id])).length, 0)
  const chuVi = 2 * Math.PI * 44
  return (
    <div className="tlu ldct-toan" data-chang="ket-qua">
      <header className="tlu-dau">
        <div className="tlu-hang">
          <button type="button" className="tlu-ve" aria-label="Về giới thiệu đề" onClick={() => setPaper(null)}><IconVe /></button>
          <div className="tlu-tieu-khoi">
            <h1 className="tlu-tieu tlu-tieu-nho">Kết quả luyện đề cấu trúc</h1>
            <p className="tlu-phu tlu-tab">Đề 28 câu · làm lúc {ngayGio(paper.deadline - 50 * 60000)}</p>
          </div>
        </div>
      </header>
      <main className="tlu-than">
        {error && <p className="tlu-bao" data-kieu="loi" role="alert">{error}</p>}
        <section className="tlu-diem ldct-diem" aria-label="Điểm lượt này">
          <span className="tlu-vong" role="img" aria-label={`Điểm ${so(diem)} trên 10`}>
            <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden="true" focusable="false">
              <circle cx="56" cy="56" r="44" className="tlu-vong-nen" strokeWidth="10" fill="none" />
              <circle cx="56" cy="56" r="44" className="tlu-vong-dat" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={`${((chuVi * Math.min(10, diem)) / 10).toFixed(1)} ${chuVi.toFixed(1)}`} transform="rotate(-90 56 56)" />
            </svg>
            <span className="tlu-vong-chu"><b className="baloo tlu-tab">{so(diem)}</b><span>/ 10 điểm</span></span>
          </span>
          <dl className="tlu-diem-so ldct-diem-dau">
            <div><dt>Điểm lượt này</dt><dd className="tlu-tab">{so(diem)} / 10</dd></div>
            {coDetail && <div><dt>Câu chưa đúng</dt><dd className="tlu-tab">{soSai} câu</dd></div>}
            {coDetail && <div><dt>Câu bỏ trống</dt><dd className="tlu-tab">{soTrong} câu</dd></div>}
          </dl>
          {coDetail ? (
            <dl className="tlu-diem-so ldct-theo-phan">
              {cacPhan.map((p) => (
                <div key={p.phan}>
                  <dt>Phần {p.phan} · {p.ten}</dt>
                  <dd className="tlu-tab" aria-label={`${so(p.diem)} trên ${so(p.toiDa)} điểm`}>{so(p.diem)}/{so(p.toiDa)}</dd>
                  <span className="ldct-tp-phu tlu-tab">điểm · {p.phan === 'II' ? `${p.dung}/${p.soCau} câu đúng cả 4 ý` : `${p.dung}/${p.soCau} câu đúng`}</span>
                </div>
              ))}
            </dl>
          ) : (
            <p className="tlu-ghi">Bài này chấm trước khi có bảng điểm theo phần — chỉ còn tổng điểm.</p>
          )}
          <p className="tlu-ghi">Câu nào chưa hiểu, em bấm Hỏi thầy ngay dưới câu đó.</p>
        </section>
        {coDetail && (
          <div className="tlu-chip-hang" role="group" aria-label="Lọc câu">
            <button type="button" className="tlu-chip" aria-pressed={!chiSai} onClick={() => setChiSai(false)}>Tất cả {tong} câu</button>
            <button type="button" className="tlu-chip" aria-pressed={chiSai} onClick={() => setChiSai(true)}>Câu chưa đúng · {soSai}</button>
          </div>
        )}
        <div className="tlu-ds-cau">
          {phans.map((p) => {
            const ds = p.cau.map((q, i) => ({ q, i, d: diemCau(paper, q.id) })).filter((x) => !chiSai || (x.d !== null && x.d < (p.phan === 'II' ? 1 : 0.25)))
            if (!ds.length) return null
            return (
              <section key={p.phan} className="ldct-phan" aria-labelledby={`ldct-kq-phan-${p.phan}`}>
                <h2 id={`ldct-kq-phan-${p.phan}`} className="tlu-muc ldct-phan-ten">Phần {p.phan} · {TEN_PHAN[p.phan]}</h2>
                {ds.map(({ q, i, d }) => (
                  <CauXem key={q.id} q={q} phan={p.phan} stt={i + 1} diem={d} giaTri={paper.answers[q.id] || ''} sol={getSolution(q.id)} />
                ))}
              </section>
            )
          })}
          {chiSai && soSai === 0 && <p className="tlu-ghi tlu-ghi-giua">Không có câu nào sai. Em làm tốt lắm!</p>}
        </div>
        <div className="tlu-hang-nut">
          <button type="button" className="tlu-nut-chinh" onClick={() => setPaper(null)}>Về trang luyện đề</button>
        </div>
      </main>
    </div>
  )
}

function CauXem({ q, phan, stt, diem, giaTri, sol }: { q: CauDe; phan: Phan; stt: number; diem: number | null; giaTri: string; sol: ReturnType<LD['getSolution']> }) {
  const chung = { ...q, cheDo: 'xem_lai' as const, stt, explanation: sol?.explanation, loiGiai: sol?.loiGiai }
  const dungHet = diem !== null && diem >= (phan === 'II' ? 1 : 0.25)
  const yDung = phan === 'II' && diem !== null ? [0, 0.1, 0.25, 0.5, 1].indexOf(diem) : -1
  let the
  if ('choices' in q)
    the = <TheCau {...chung} phan="I" choices={q.choices} choiceImgs={q.choiceImgs} choicePerm={[0, 1, 2, 3]} selected={(giaTri || null) as Chu | null} correct={sol?.correct as Chu | undefined} />
  else if ('ideas' in q)
    the = (
      <TheCau
        {...chung}
        phan="II"
        ideas={q.ideas}
        ideaImgs={q.ideaImgs}
        selected={Array.from({ length: 4 }, (_, j) => {
          const v = giaTri[j]
          return v === 'D' || v === 'S' ? v : null
        })}
        correct={sol?.correct as [DS, DS, DS, DS] | undefined}
      />
    )
  else the = <TheCau {...chung} phan="III" selected={giaTri} correct={sol?.correct as string | undefined} />
  return (
    <article className="tlu-the-cau m3" data-dung={diem === null ? undefined : dungHet ? 'true' : 'false'}>
      <div className="tlu-the-cau-dau">
        <span className="tlu-so-cau">Câu {stt}</span>
        {diem !== null && (
          <span className="tlu-nhan" data-kieu={dungHet ? 'dung' : 'sai'}>
            {dungHet ? 'Đúng' : yDung > 0 ? `Đúng ${yDung}/4 ý` : daLamCau(giaTri) ? 'Sai' : 'Bỏ trống'}
          </span>
        )}
        {diem !== null && <span className="tlu-nhan tlu-tab">+{so(diem)} điểm</span>}
      </div>
      {the}
      <NutHoiThay qid={q.id} nguon="luyen_de" gon />
    </article>
  )
}

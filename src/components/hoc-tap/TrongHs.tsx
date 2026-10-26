// GIAO DIỆN «TRONG» · APP HỌC SINH — phần trình bày RIÊNG của bản vẽ thầy chốt 26/10 (ve-moi/hs-mot-trang*.html, hs-menu-phai.html), NẠP LƯỜI qua
// nap-trong-hs.ts (chỉ khi `<html data-trong>`): Hôm nay «MỘT TRANG» + menu dọc mép phải (Điểm danh đầu menu, A.I Đỗ Đại Học dưới 4 mục). Cùng số, cùng
// chữ nút, cùng lệnh với bản cũ — chỉ đổi trình bày. Kiểu ở styles/trong-hs.css (nạp cùng mảnh này ⇒ vẽ là đã có kiểu).
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, ClipboardCheck, Flame, QrCode, RefreshCw, Sparkles, Target, type LucideIcon } from 'lucide-react'
import { soChangXong, type SoHomNay } from './lam-bai'
import { chiaChang, chuNutHoc, useNhipHocEm } from './TheHomNayEm'
import { nhipTheoSanh } from '../../lib/nhip-hoc-em'
import type { TomTatKiemTra } from '../../lib/kiem-tra-ca-nhan'
import { ngayGon, useDiemDanhHs } from '../diem-danh/TheDiemDanhHs'
import type { BuoiCuaEm } from '../../lib/buoi-hoc-api'
import '../../styles/trong-hs.css'

export interface PropsMotTrang {
  so: SoHomNay | null; dangTai: boolean; tenBai?: string; viec?: string
  onHoc: () => void; khoaHoc: boolean; hetCau: boolean; kho?: { choBoSung?: number; sanSang?: number }
  coCa: boolean; onThi: () => void; token?: string
  soSua: number | null; onChua: () => void; hinhSua?: ReactNode
  kiem?: TomTatKiemTra; ngayKiem: boolean; onKiemTra?: () => void
  soBaiTap?: number; coBaiTap?: boolean; onBaiTap: () => void
  /** Dòng nhắc sẵn có của Hôm nay (thiếu câu phù hợp, câu đang giữ cho ca). */
  ghi: string[]
}
type Hang = { k: string; ten: string; mo?: string; so?: ReactNode; hinh: ReactNode; sac: string; onClick?: () => void; tat?: boolean }

// Chữ ngày giờ Kiểm tra ôn tập — cùng luật với kiem-tra-chu.ts (giờ Việt Nam, hạn đúng 00:00 hôm sau ⇒ "24:00"); viết gọn tại đây để mảnh «Trong» không kéo
// kiem-tra-chu thành một tệp precache riêng (trần 170 tệp — scripts/kiem-sw.mjs).
const VN = 7 * 3600_000, hai = (n: number) => String(n).padStart(2, '0')
const ngayVn = (ms: number) => new Date(ms + VN).toISOString().slice(0, 10)
const gioVn = (ms: number) => { const t = new Date(ms + VN); return `${hai(t.getUTCHours())}:${hai(t.getUTCMinutes())}` }
const gioHan = (han: number, ngay: string) => (gioVn(han) === '00:00' && ngayVn(han - 1) === ngay ? '24:00' : gioVn(han))
const diemChu = (d: number) => String(Math.round(d * 100) / 100).replace('.', ',')
const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const ngayKiemChu = (ngay: string, now: number) => {
  const [y, m, d] = ngay.split('-').map(Number)
  if (!y || !m || !d) return ngay
  const con = Math.round((Date.UTC(y, m - 1, d) - Date.parse(`${ngayVn(now)}T00:00:00Z`)) / 86_400_000)
  return `${THU[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${hai(d)}/${hai(m)}${con > 0 ? ` · còn ${con} ngày` : ''}`
}

/** Chữ phụ của dòng Kiểm tra ôn tập — chỉ số có trong TomTatKiemTra (như thẻ TheKiemTraCaNhan). */
function chuKiem(k: TomTatKiemTra): string {
  if (k.trangThai === 'cho_nguon') return 'Đang chuẩn bị'
  if (k.nopLuc !== null || k.trangThai === 'het_han') return `${k.trangThai === 'het_han' ? 'Đã hết hạn' : 'Đã nộp'} · ${k.diem !== null ? `điểm ${diemChu(k.diem)}/10` : 'đang chấm'}`
  if (!k.homNay) return ngayKiemChu(k.ngay, k.serverNow)
  return `${k.tong} câu · khoảng ${k.phut} phút · hạn nộp ${gioHan(k.hanLuc, k.ngay)}`
}

function Vong({ da, tong, nhan, du }: { da: number; tong: number; nhan: string; du?: boolean }) {
  const pct = tong > 0 ? Math.min(100, Math.round((100 * da) / tong)) : 0
  return <div className="tr-vong" data-du={du || undefined} style={{ '--p': pct } as CSSProperties} role="img" aria-label={`${da}/${tong} ${nhan}`}>
    <b>{da}<small>/{tong}</small></b><span>{nhan}</span>
  </div>
}

function DongSau({ h, i }: { h: Hang; i: number }) {
  const than = <>
    <span className="mot-so" data-xam="" aria-hidden="true">{i}</span>
    <span className="mot-o" data-sac={h.sac} aria-hidden="true">{h.hinh}</span>
    <span className="mot-giua"><strong>{h.ten}</strong>{h.mo && <small>{h.mo}</small>}</span>
    {h.so != null && <b className="mot-so-phai">{h.so}</b>}
    {h.onClick && <ChevronRight size={20} aria-hidden="true" className="mot-mui" />}
  </>
  return h.onClick ? <button type="button" className="mot-dong" onClick={h.onClick} disabled={h.tat}>{than}</button> : <div className="mot-dong">{than}</div>
}

/** HÔM NAY «MỘT TRANG» (bản vẽ hs-mot-trang · -ca · -xong, thầy chốt 26/10): MỘT việc số 1 với MỘT nút chính, rồi «Sau đó» tối đa 3 dòng (2–4) — vừa một
 *  khung hình, không cuộn. Thứ tự việc số 1: ca kiểm tra đang mở → (ngày chỉ có Kiểm tra ôn tập: thẻ kiểm tra) → học tiếp → đủ mức thì việc kế tiếp làm được
 *  (Tự sửa lỗi, rồi Bài tập về nhà) lên số 1 và «Học thêm câu mới» thành liên kết. Mỗi dòng hiện đúng điều kiện như Hôm nay cũ; Nhịp học, Bài học 7 ngày,
 *  Ôn và sửa ở các mục khác (Hành trình, Ôn & sửa). Chuỗi ngày đọc cùng bản nhớ `/hs/nhip-hoc` như thẻ cũ. */
export function MotTrangHs(p: PropsMotTrang) {
  const so = p.so, kiem = p.kiem
  const nhipGoc = useNhipHocEm(p.ngayKiem ? undefined : p.token, null)
  const chuoi = typeof nhipGoc === 'string' ? 0 : nhipTheoSanh(nhipGoc, so ? { muc: so.muc, daLam: so.daLam } : null).chuoiDuGanNhat
  const con = so ? Math.max(0, so.muc - so.daLam) : null
  const du = con === 0
  const xuong = !so && p.dangTai
  const nutHoc = chuNutHoc(so, p.hetCau, p.kho)
  const kiemXong = !!kiem && (kiem.nopLuc !== null || kiem.trangThai === 'het_han')
  const kiemLam = !!kiem && kiem.homNay && !kiemXong && kiem.trangThai === 'can_lam'
  const pct = so && so.muc > 0 ? Math.min(100, Math.round((100 * so.daLam) / so.muc)) : 0

  const hHoc: Hang = { k: 'hoc', ten: p.tenBai || 'Bài học hôm nay', mo: nutHoc, so: so ? <>{so.daLam}<small>/{so.muc} câu</small></> : undefined,
    hinh: <span className="tr-vong mot-vong-nho" style={{ '--p': pct } as CSSProperties} />, sac: 'vong', onClick: p.onHoc, tat: p.khoaHoc }
  const hSua: Hang | null = p.soSua && p.soSua > 0 ? { k: 'sua', ten: 'Tự sửa lỗi', mo: 'Câu em làm sai', so: <>{p.soSua}<small> câu</small></>, hinh: p.hinhSua, sac: 'sai', onClick: p.onChua } : null
  const hKiem: Hang | null = kiem ? { k: 'kiem', ten: 'Kiểm tra ôn tập', mo: chuKiem(kiem), hinh: <Target size={20} />, sac: 'tin',
    onClick: (kiemLam || kiemXong) && p.onKiemTra ? p.onKiemTra : undefined, tat: p.coCa } : null
  const hBt: Hang | null = p.soBaiTap || p.coBaiTap ? { k: 'bt', ten: 'Bài tập về nhà', mo: p.soBaiTap ? 'Thầy đang giao' : 'Xem lại bài đã nộp',
    so: p.soBaiTap ? <>{p.soBaiTap}<small> bài</small></> : undefined, hinh: <BookOpen size={20} />, sac: 'chu-y', onClick: p.onBaiTap } : null

  // Ngày kiểm tra không kèm học (ngayKiem): như Hôm nay cũ, thẻ kiểm tra thay cả khối học ⇒ nó là việc số 1, không dòng nào khác.
  // Thứ tự việc (thầy 26/10): học đủ mức ⇒ Kiểm tra ôn tập (nếu đang phải làm) tự lên số 1 ⇒ rồi Tự sửa lỗi ⇒ rồi Bài tập về nhà.
  const chinh = p.coCa ? 'ca' : p.ngayKiem ? 'kiem' : du && kiemLam ? 'kiem' : du && hSua ? 'sua' : du && p.soBaiTap ? 'bt' : 'hoc'
  const sau = (chinh === 'ca' ? (p.ngayKiem ? [hKiem] : [hHoc, hKiem, hSua, hBt]) : chinh === 'kiem' ? (p.ngayKiem ? [] : [hSua, hBt])
    : chinh === 'sua' ? [hKiem, hBt] : chinh === 'bt' ? [hKiem] : [hKiem, hSua, hBt]).filter((h): h is Hang => !!h).slice(0, 3)
  const hocThem = (chinh === 'sua' || chinh === 'bt' || (chinh === 'kiem' && !p.ngayKiem)) && !p.khoaHoc
  const vongDu = so && <Vong da={so.daLam} tong={so.muc} nhan="câu hôm nay" du />
  const chipDu = <span className="tr-chip" data-sac="dung"><Check size={14} strokeWidth={3} aria-hidden="true" />Đủ mức hôm nay</span>
  const chipChuoi = chuoi > 0 && <span className="tr-chip" data-sac="sao"><Flame size={14} aria-hidden="true" />Chuỗi {chuoi} ngày</span>

  let nhan: string, trai: ReactNode, chu: ReactNode, nut: { chu: string; onClick?: () => void; tat?: boolean } | null, chan: ReactNode = chipChuoi
  if (chinh === 'ca') {
    nhan = 'Làm ngay'; trai = <span className="mot-o-lon" aria-hidden="true"><ClipboardCheck size={34} /></span>
    chu = <><h2>Ca kiểm tra đang mở</h2><p className="mot-phu">Nhập mã ca và mật khẩu thầy cung cấp để vào phòng kiểm tra.</p></>
    nut = { chu: 'Vào ca kiểm tra', onClick: p.onThi }; chan = null
  } else if (chinh === 'kiem' && kiem) {
    const het = kiem.trangThai === 'het_han'
    nhan = kiemLam ? 'Làm ngay' : 'Việc của em hôm nay'
    trai = <Vong da={kiem.daTra} tong={kiem.tong} nhan="câu đã trả lời" du={kiemXong && !het} />
    chu = <>{kiemXong && <span className="tr-chip" data-sac={het ? 'xam' : 'dung'}>{het ? 'Đã hết hạn' : 'Đã nộp'}</span>}<h2>Kiểm tra ôn tập</h2>
      <p className="mot-phu">{kiemLam ? `${kiem.soChang} chặng · khoảng ${kiem.phut} phút · hạn nộp ${gioHan(kiem.hanLuc, kiem.ngay)}` : chuKiem(kiem)}</p></>
    nut = !p.onKiemTra || kiem.trangThai === 'cho_nguon' ? null : { chu: kiemXong ? 'Xem kết quả' : kiem.daTra > 0 ? `Làm tiếp · còn ${kiem.con} câu` : 'Làm bài kiểm tra', onClick: p.onKiemTra, tat: p.coCa }
    chan = null
  } else if (chinh === 'sua') {
    nhan = 'Việc tiếp theo'; trai = vongDu
    chu = <>{chipDu}<h2>{hSua!.ten}</h2><p className="mot-phu">Câu em làm sai · {p.soSua} câu</p></>
    nut = { chu: 'Sửa lỗi ngay', onClick: p.onChua }
  } else if (chinh === 'bt') {
    nhan = 'Việc tiếp theo'; trai = vongDu
    chu = <>{chipDu}<h2>Bài tập về nhà</h2><p className="mot-phu">Thầy đang giao {p.soBaiTap} bài</p></>
    nut = { chu: 'Mở bài tập về nhà', onClick: p.onBaiTap }
  } else {
    const chang = so ? chiaChang(so) : []
    const xong = so ? soChangXong(so) : 0
    nhan = 'Bắt đầu từ đây'
    trai = xuong ? <span className="tr-vong tr-vong-xuong" aria-hidden="true" /> : so && <Vong da={so.daLam} tong={so.muc} nhan="câu hôm nay" du={du} />
    chu = <>
      {du ? chipDu : so && <p className="mot-nho">{so.daLam > 0 ? 'Học tiếp' : 'Bắt đầu học'}</p>}
      {xuong ? <span className="mot-xuong" aria-hidden="true" /> : <h2>{p.tenBai || 'Bài học hôm nay'}</h2>}
      {!xuong && <p className="mot-phu">{!so ? 'Số câu hôm nay sẽ hiện khi bài học tải xong.' : du ? `Đã làm ${so.daLam}/${so.muc} câu hôm nay · em có thể nghỉ.` : p.viec}</p>}
      {so && !du && chang.length > 0 && (
        <div className="mot-chang" role="progressbar" aria-label="Tiến độ hôm nay" aria-valuemin={0} aria-valuemax={so.muc} aria-valuenow={Math.min(so.daLam, so.muc)}
          aria-valuetext={`Đã làm ${so.daLam} trên ${so.muc} câu · xong ${xong} trong ${chang.length} chặng`}>
          {chang.map((c, i) => <i key={i} data-tt={c.tt} style={{ flexGrow: c.co }}>{c.tt === 'dang' && c.phan > 0 && <span style={{ width: `${c.phan}%` }} />}</i>)}
        </div>
      )}
    </>
    nut = { chu: nutHoc, onClick: p.onHoc, tat: p.khoaHoc }
    chan = <>{so && !du && <span className="tr-chip" data-sac="chu-y">Còn {con} câu để đủ mức</span>}{chipChuoi}</>
  }

  return <div className="mot-luoi">
    <section className="mot-viec" data-ca={chinh === 'ca' || undefined} aria-label="Việc của em lúc này" aria-busy={xuong}>
      <p className="mot-nhan"><span className="mot-so" aria-hidden="true">1</span>{nhan}</p>
      <div className="mot-than">{trai}<div className="mot-chu">{chu}</div></div>
      {nut && <button type="button" className="mot-nut" onClick={nut.onClick} disabled={nut.tat}>{nut.chu}{!(chinh === 'hoc' && p.hetCau) && <ArrowRight size={20} aria-hidden="true" />}</button>}
      {chan && <div className="mot-chan">{chan}</div>}
      {p.ghi.map((g) => <p key={g} className="mot-ghi">{g}</p>)}
    </section>
    {(sau.length > 0 || hocThem) && <section className="mot-sau" aria-label="Sau đó">
      <p className="mot-nhan">Sau đó</p>
      {sau.length > 0 && <div className="mot-ds">{sau.map((h, i) => <DongSau key={h.k} h={h} i={i + 2} />)}</div>}
      {hocThem && <button type="button" className="mot-lien-ket" onClick={p.onHoc}>Học thêm câu mới<ChevronRight size={18} aria-hidden="true" /></button>}
    </section>}
  </div>
}

const tenBuoi = (b: BuoiCuaEm) => { const n = ngayGon(b.ten); return `${n === b.ten ? b.ten : `Buổi ${n}`}${b.lop ? ` · ${b.lop}` : ''}` }

/** KHỐI ĐIỂM DANH đầu menu (bản vẽ hs-mot-trang-menu · -menu-xong): CÙNG hook với thẻ nổi cũ (useDiemDanhHs — cùng lệnh gửi, cùng luồng QR `?diem-danh=`).
 *  Buổi đang mở, em chưa điểm danh ⇒ khối chàm, 6 ô mã (một ô nhập thật phủ trên) + nút Điểm danh · đã điểm danh ⇒ khối xanh (+ giờ em vừa bấm trên máy
 *  này) · không có buổi ⇒ khối xám. App chưa có máy quét QR riêng ⇒ không nút máy ảnh; em quét QR bằng máy ảnh điện thoại như cũ. */
type DiemDanh = ReturnType<typeof useDiemDanhHs>
function KhoiDiemDanh({ tt, ma, setMa, loi, setLoi, dangGui, gui, oNhap }: Pick<DiemDanh, 'tt' | 'ma' | 'setMa' | 'loi' | 'setLoi' | 'dangGui' | 'gui' | 'oNhap'>) {
  if (tt.loai === 'cho') return (
    <form className="tr-dd" aria-label="Điểm danh buổi học" onSubmit={(e) => { e.preventDefault(); void gui(ma) }}>
      <div className="tr-dd-dau"><QrCode size={20} aria-hidden="true" /><b>Điểm danh</b>{tt.buoi && <span>{tenBuoi(tt.buoi).split(' · ')[0]}</span>}</div>
      <label className="tr-dd-o">
        <span className="sr-only">Mã 6 số trên máy chiếu</span>
        <input ref={oNhap} value={ma} onChange={(e) => { setMa(e.target.value.replace(/\D/g, '').slice(0, 6)); setLoi('') }}
          inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6} aria-invalid={!!loi} aria-describedby={loi ? 'tr-dd-loi' : undefined} />
        {Array.from({ length: 6 }, (_, i) => <span key={i} aria-hidden="true" data-dang={i === Math.min(ma.length, 5) || undefined}>{ma[i] ?? ''}</span>)}
      </label>
      <button type="submit" className="tr-dd-nut" disabled={dangGui || ma.length !== 6}>{dangGui ? 'Đang gửi…' : 'Điểm danh'}</button>
      {loi && <p id="tr-dd-loi" className="tr-dd-loi" role="alert">{loi}</p>}
      <p className="tr-dd-phu">Gõ mã 6 số trên máy chiếu, hoặc quét mã QR</p>
    </form>
  )
  const xong = tt.loai === 'xong' ? tt : tt.daXong ? { buoi: tt.daXong, luc: 0 } : null
  if (xong) return (
    <section className="tr-dd" data-tt="xong" aria-label="Điểm danh buổi học">
      <div className="tr-dd-dau"><CheckCircle2 size={20} aria-hidden="true" /><b>Đã điểm danh</b>{xong.luc > 0 && <span>{hai(new Date(xong.luc).getHours())}:{hai(new Date(xong.luc).getMinutes())}</span>}</div>
      <p className="tr-dd-phu">{tenBuoi(xong.buoi)}</p>
    </section>
  )
  return (
    <section className="tr-dd" data-tt="tat" aria-label="Điểm danh buổi học">
      <div className="tr-dd-dau"><QrCode size={20} aria-hidden="true" /><b>Điểm danh</b></div>
      <p className="tr-dd-phu">Chưa có buổi học nào đang mở</p>
    </section>
  )
}

/** MENU DỌC MÉP PHẢI (bản vẽ hs-menu-phai, thầy chốt 26/10): gộp thanh trên (logo, Vào ca kiểm tra, chuông, cập nhật, ảnh «Của em») + menu 4 mục.
 *  Thu gọn = MỘT vạch nhỏ giữa mép phải (chấm đỏ khi có tin chưa đọc — CSS :has đọc số của chuông thật). Chạm ⇒ thẻ menu ra, nền sau mờ; chạm ngoài /
 *  chọn mục / Esc / cuộn trang ⇒ thu lại. Mở ⇒ tiêu điểm vào mục đầu; Esc, chạm ngoài, chọn mục ⇒ trả tiêu điểm về vạch. Chuông = ĐÚNG phần tử
 *  ThongBaoHocSinh (giữ hành vi + số chưa đọc), phủ cả dòng; menu luôn gắn trong DOM (ẩn bằng CSS) để tấm thông báo mở từ đây không mất.
 *  «Một trang» (bản vẽ hs-mot-trang-menu, 26/10): khối Điểm danh đứng đầu (KhoiDiemDanh); buổi đang mở mà em chưa điểm danh ⇒ vạch thò thẻ chàm dọc
 *  «Điểm danh» (bấm ⇒ menu mở, tiêu điểm vào ô mã); mã QR gửi xong / gửi hỏng ⇒ menu tự mở cho em thấy kết quả. Mục «A.I Đỗ Đại Học» dưới 4 mục chính mở
 *  ĐÚNG tấm chat của BongBongAiDdh (sự kiện `ddh:mo-ai`; mục chỉ hiện khi kênh bật — `<html data-ai-ddh>`). */
export function MenuDocTrong(p: {
  muc: string; ds: readonly { id: string; ten: string; icon: LucideIcon }[]; onMuc: (id: string) => void
  coCa: boolean; onThi: () => void; thongBao?: ReactNode; dangTai: boolean; onTaiLai: () => void
  chuDau: string; moCuaEm: boolean; onCuaEm: () => void; nutCuaEm: RefObject<HTMLButtonElement | null>
  token?: string; moDiemDanh: boolean
}) {
  const [mo, setMo] = useState(false)
  const nut = useRef<HTMLButtonElement>(null)
  const the = useRef<HTMLElement>(null)
  const { tt, ma, setMa, loi, setLoi, dangGui, gui, oNhap, mo: ddMoLoi, tuQr } = useDiemDanhHs(p.token ?? '', p.moDiemDanh && !!p.token)
  const ddMo = tt.loai === 'cho'
  const dong = (traVe: boolean) => { setMo(false); if (traVe) nut.current?.focus() }
  useEffect(() => { if (ddMoLoi || (tuQr && tt.loai === 'xong')) setMo(true) }, [ddMoLoi, tuQr, tt.loai])
  useEffect(() => {
    if (!mo) return
    ;(oNhap.current ?? the.current?.querySelector<HTMLElement>('.tr-menu-muc'))?.focus()
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMo(false); nut.current?.focus() } }
    const cuon = () => setMo(false)
    window.addEventListener('keydown', phim)
    window.addEventListener('scroll', cuon, { passive: true })
    return () => { window.removeEventListener('keydown', phim); window.removeEventListener('scroll', cuon) }
  }, [mo, oNhap])
  return <>
    <button ref={nut} type="button" className="tr-menu-cham" data-dd={ddMo || undefined} aria-label={ddMo ? 'Mở menu · Buổi học đang mở điểm danh' : 'Mở menu'} aria-expanded={mo} aria-controls="tr-menu" onClick={() => setMo(true)}>
      <i /><s />{ddMo && <em aria-hidden="true"><QrCode size={16} />Điểm danh</em>}
    </button>
    {mo && <div className="tr-menu-phu" onClick={() => dong(true)} aria-hidden="true" />}
    <nav ref={the} id="tr-menu" className="tr-menu" data-mo={mo || undefined} data-dd={p.token ? '' : undefined} aria-label="Điều hướng học sinh">
      <a className="tr-menu-dau" href="/hs"><img src={`${import.meta.env.BASE_URL}logo-hs-nho-v3.svg`} width={26} height={26} alt="" draggable={false} />Đỗ Đại Học</a>
      {p.token && <KhoiDiemDanh tt={tt} ma={ma} setMa={setMa} loi={loi} setLoi={setLoi} dangGui={dangGui} gui={gui} oNhap={oNhap} />}
      {p.ds.map(({ id, ten, icon: Icon }) => <button key={id} type="button" className="tr-menu-muc" onClick={() => { p.onMuc(id); dong(true) }} aria-current={p.muc === id ? 'page' : undefined}><Icon size={20} aria-hidden="true" />{ten}</button>)}
      <button type="button" className="tr-menu-muc tr-menu-ai" onClick={() => { dong(false); window.dispatchEvent(new Event('ddh:mo-ai')) }}><span className="tr-o-ai" aria-hidden="true"><Sparkles size={16} /></span>A.I Đỗ Đại Học</button>
      <hr className="tr-menu-vach" />
      {!p.coCa && <button type="button" className="tr-menu-muc" onClick={() => { dong(true); p.onThi() }}><ClipboardCheck size={20} aria-hidden="true" />Vào ca kiểm tra</button>}
      {p.thongBao && <div className="tr-menu-muc tr-menu-tb" onClickCapture={(e) => { if ((e.target as Element).closest?.('.m3-tb-chuong')) dong(false) }}>{p.thongBao}<span aria-hidden="true">Thông báo</span></div>}
      <button type="button" className="tr-menu-muc" onClick={() => { dong(true); p.onTaiLai() }} disabled={p.dangTai}><RefreshCw size={20} aria-hidden="true" />Cập nhật bài học</button>
      <button ref={p.nutCuaEm} type="button" className="tr-menu-muc" onClick={() => { dong(false); p.onCuaEm() }} aria-haspopup="dialog" aria-expanded={p.moCuaEm}><span className="tr-menu-anh" aria-hidden="true">{p.chuDau}</span>Của em</button>
    </nav>
  </>
}

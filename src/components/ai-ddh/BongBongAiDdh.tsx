// BONG BÓNG CHAT «A.I ĐỖ ĐẠI HỌC» (thầy 24/10 duyệt bản vẽ 3 — docs/ban-ve-ai-ddh-2410/, đặc tả docs/DAC-TA-AI-DDH-APP-HS-2410.md).
// Một kênh hỏi bài nữa của VĂN PHÒNG (y như Hộp thư Zalo): em gửi chữ / ảnh ⇒ hàng chờ ⇒ văn phòng giải đúng luồng của mình ⇒ trả lời hiện ở đây.
// Tải lười, ngoài precache; nơi gắn (StudentPortalScreen) ẩn hẳn ở màn kiểm tra / làm bài / game. Máy chủ còn khoá thêm khi em có bài kiểm tra mở.
// HỎI MÁY CHỦ: lúc mở app 0 lệnh (cờ lớp em có bật giữ trên máy 6 giờ; cờ cũ ⇒ hỏi một lần khi máy rảnh). Tấm mở: 1 lệnh mở; đang chờ trả lời: 1,5 giây/lần
// (và thêm 60 giây sau mỗi tin trả lời — link trang lời giải gửi tiếp); tấm mở mà không chờ: 20 giây/lần; tấm đóng mà còn câu chờ: 60 giây/lần; xong là dừng.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Anh, ArrowRight, BookOpen, Camera, CheckCircle2, ChevronDown, ClipboardPaste, Clock, Lightbulb, Lock, MoonStar, Send, ShieldCheck, Sparkles, WifiOff, Zap } from './bieu-tuong-ai'
import { AnhLogo } from '../LogoVai'
import { batNhipBenVung } from '../../lib/nhip-ben-vung'
import { CO_CU_MS, docCoBat, ghiCoBat, gopTin, guiAiDdh, moAiDdh, nenAnh, taiAnhAiDdh, taoMaTin, tinMoiAiDdh, type MoAiDdh, type TinAiDdh } from '../../lib/ai-ddh-api'
import { chuNguon, tachKhoi, type Khuc } from '../../lib/ai-ddh-dinh-dang'
import './ai-ddh.css'

/** Sau mỗi tin trả lời: còn hỏi nhanh (1,5 giây) chừng này để link trang lời giải gửi tiếp tới ngay. */
export const DUOI_NHANH_MS = 60_000

const Mat = ({ co = 40, on = false }: { co?: number; on?: boolean }) => (
  <span className="aid-mat" data-on={on ? '' : undefined} style={{ width: co, height: co }}><AnhLogo vai="hs" size={Math.round(co * 0.82)} /></span>
)
const gio = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(11, 16)

function Chu({ khuc }: { khuc: Khuc[] }) {
  return <>{khuc.map((k, i) => (k.chu === '\n' ? <br key={i} /> : <span key={i} className={k.kieu.map((x) => `aid-kieu-${x}`).join(' ') || undefined}>{k.chu}</span>))}</>
}

/** Một tin văn phòng: tách khối từ đánh dấu Zalo ⇒ dải đáp án, bước có số, khung phương trình, ô chỗ hay nhầm. */
function TinVanPhong({ t }: { t: TinAiDdh }) {
  const khoi = useMemo(() => tachKhoi(t.chu), [t.chu])
  const coKhoi = khoi.some((k) => k.loai !== 'doan')
  const nguon = chuNguon(t.nguon, t.chiGoiY)
  const nhanNguon = nguon ? (
    <span className="aid-nguon" data-l={t.chiGoiY ? 'goi-y' : t.nguon === 'kho' || t.nguon === 'de' ? 'kho' : 'hai'}>
      {t.chiGoiY ? <Lightbulb size={14} /> : t.nguon === 'kho' || t.nguon === 'de' ? <ShieldCheck size={14} /> : <Sparkles size={14} />}{nguon}
    </span>
  ) : null
  const buoc = khoi.filter((k) => k.loai === 'buoc')
  return (
    <>
      {t.chu.trim() && (
        <div className={t.trangThai === 'viet' ? 'aid-bt aid-dang-viet' : 'aid-bt'}>
          {coKhoi ? (
            <div className="aid-giai">
              {khoi.map((k, i) => {
                if (k.loai === 'dap') return <div key={i} className="aid-dap"><span className="aid-dap-icon"><CheckCircle2 size={20} /></span><span><small>Đáp án</small><b><Chu khuc={k.khuc} /></b></span></div>
                if (k.loai === 'pt') return <div key={i} className="aid-pt"><Chu khuc={k.khuc} /></div>
                if (k.loai === 'nham') return <div key={i} className="aid-nham"><AlertTriangle size={18} /><span><small>Chỗ hay nhầm</small><Chu khuc={k.khuc} /></span></div>
                if (k.loai === 'buoc') {
                  if (k !== buoc[0]) return null
                  return <ol key={i} className="aid-buoc">{buoc.map((b, j) => <li key={j}><p><Chu khuc={b.khuc} /></p></li>)}</ol>
                }
                return <p key={i}><Chu khuc={k.khuc} /></p>
              })}
              {nhanNguon}
            </div>
          ) : (
            <div className="aid-chu">{khoi.map((k, i) => <p key={i}><Chu khuc={k.khuc} /></p>)}{nhanNguon}</div>
          )}
        </div>
      )}
      {t.trangUrl && !t.boDe && (
        <a className="aid-trang" href={t.trangUrl} target="_blank" rel="noopener noreferrer">
          <span className="aid-trang-anh"><BookOpen size={26} /></span>
          <span><b>Lời giải từng bước</b><small>Thử chọn đáp án trước, rồi bấm «Bước tiếp» xem từng bước và mẹo của Thầy.</small></span>
          <span className="aid-trang-nut">Mở lời giải<ArrowRight size={18} /></span>
        </a>
      )}
      {t.boDe && (t.boDe.link || t.trangUrl) && (
        <a className="aid-bo-de" href={t.boDe.link || t.trangUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="aid-bo-de-dau"><span className="aid-trang-anh"><BookOpen size={24} /></span><span><b>{t.boDe.ten || 'Bộ đề của bạn'}</b><small>{t.boDe.moTa || 'Câu lấy nguyên văn từ kho đề của Thầy, có lời giải từng câu'}</small></span></div>
          <span className="aid-trang-nut">Mở bộ đề{t.boDe.soDe ? ` · ${t.boDe.soDe} đề` : ''}<ArrowRight size={18} /></span>
        </a>
      )}
    </>
  )
}

interface TinCho { maTin: string; chu: string; anh: string[]; so: number[]; loi: string }

// Dòng chờ trả lời đúng tình huống (25/10, thầy: "bỏ chữ đang soạn, tuỳ ngữ cảnh thì hiện đang soạn, đang nghĩ hay chờ tý").
const TAM_SU = /buồn|mệt|chán|áp lực|stress|lo lắng|sợ|khóc|tâm sự|cô đơn|nản/i
const XIN_DE = /(?:^|[^\p{L}])(?:đề|de)(?![\p{L}])|vài câu|mấy câu|câu luyện|luyện thêm/iu
export function chuDangCho(t: { chu: string; anh: number } | undefined, lau: boolean): string {
  if (lau) return 'Chờ tý nhé, câu này hơi dài…'
  if (!t) return 'Đang nghĩ…'
  if (t.anh > 0) return 'Đang xem ảnh…'
  if (TAM_SU.test(t.chu)) return 'Tôi đang nghe đây…'
  if (XIN_DE.test(t.chu)) return 'Đang soạn đề…'
  return 'Đang nghĩ…'
}
/** Chờ quá ngần này ⇒ «Chờ tý nhé…». */
const LAU_MS = 25_000

// 25/10 (thầy: "cho nút a.i nhỏ lại, di chuyển được khắp màn hình"): kéo nút đi đâu cũng được, nhớ vị trí trên máy; chạm nhẹ (< 6 px) vẫn là mở.
const VI_TRI = 'aid-vi-tri'
type ViTri = { x: number; y: number }
function docViTri(): ViTri | null {
  try { const v = JSON.parse(localStorage.getItem(VI_TRI) || 'null') as ViTri | null; return v && Number.isFinite(v.x) && Number.isFinite(v.y) ? v : null } catch { return null }
}
const kep = (p: ViTri, w: number, h: number): ViTri => ({
  x: Math.round(Math.min(Math.max(8, p.x), window.innerWidth - w - 8)), y: Math.round(Math.min(Math.max(8, p.y), window.innerHeight - h - 8)),
})

export default function BongBongAiDdh({ auth }: { auth: { token?: string | null; sbd: string; hoTen?: string | null } }) {
  const token = auth.token ?? '', sbd = auth.sbd, hoTen = auth.hoTen
  const ten = hoTen?.trim().split(/\s+/).pop()
  const co = docCoBat(sbd)
  const [bat, setBat] = useState<boolean>(co?.bat === true)
  const [mo, setMo] = useState(false)
  const [du, setDu] = useState<MoAiDdh | null>(null)
  const [loi, setLoi] = useState('')
  const [tin, setTin] = useState<TinAiDdh[]>([])
  const [cho, setCho] = useState<TinCho[]>([])
  const [chu, setChu] = useState('')
  const [anh, setAnh] = useState<string[]>([])
  // Ảnh TẢI TRƯỚC ngay lúc chọn (25/10 «gửi ảnh tức thì»): mỗi ảnh một số thứ tự trong tin nháp; bấm Gửi chỉ còn gửi chữ + số.
  const [anhSo, setAnhSo] = useState<number[]>([])
  const maNhap = useRef(taoMaTin())
  const demSo = useRef(0)
  const daTai = useRef(new Map<string, Promise<boolean>>())
  const [dangGui, setDangGui] = useState(false)
  const [moiChua, setMoiChua] = useState(0)
  const [truc, setTruc] = useState(true)
  const than = useRef<HTMLDivElement>(null)
  const tepChup = useRef<HTMLInputElement>(null)
  const tepChon = useRef<HTMLInputElement>(null)
  const bong = useRef<HTMLDivElement>(null)
  const keo = useRef<{ dx: number; dy: number; x0: number; y0: number; da: boolean } | null>(null)
  const vuaKeo = useRef(false)
  const [viTri, setViTri] = useState(docViTri)
  const sau = useMemo(() => tin.reduce((m, x) => Math.max(m, x.luc), 0), [tin])
  const dangCho = tin.some((x) => x.ben === 'em' && (x.trangThai === 'cho' || x.trangThai === 'dang'))
  const tinCho = dangCho ? [...tin].reverse().find((x) => x.ben === 'em' && (x.trangThai === 'cho' || x.trangThai === 'dang')) : undefined
  const [lau, setLau] = useState(false)
  useEffect(() => {
    setLau(false)
    if (!tinCho) return
    const h = window.setTimeout(() => setLau(true), LAU_MS)
    return () => clearTimeout(h)
  }, [tinCho?.id])
  // ĐUÔI NHANH (25/10 thầy: "tối ưu tốc độ trả lời của a.i tức thì hơn nữa"): văn phòng gửi lời giải chữ TRƯỚC, trang HTML / link gửi tiếp sau
  // (đăng trang 15–60 giây). Nhận tin trả lời xong vẫn hỏi 1,5 giây/lần thêm DUOI_NHANH_MS để link tới ngay, rồi mới thưa về 20 giây.
  const [nhanhDen, setNhanhDen] = useState(0)
  const duoiNhanh = nhanhDen > 0
  useEffect(() => {
    if (!nhanhDen) return
    const h = window.setTimeout(() => setNhanhDen(0), Math.max(0, nhanhDen - Date.now()))
    return () => clearTimeout(h)
  }, [nhanhDen])

  // Cờ lớp em có bật: cũ ⇒ hỏi một lần khi máy rảnh (không chặn lúc mở app).
  useEffect(() => {
    if (co && Date.now() - co.luc < (co.bat ? CO_CU_MS : CO_CU_MS / 6)) return
    const chay = () => void moAiDdh(token).then((r) => { if (r.ok) { ghiCoBat(sbd, r.du.bat); setBat(r.du.bat) } })
    const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }
    const h = w.requestIdleCallback ? w.requestIdleCallback(chay, { timeout: 8000 }) : window.setTimeout(chay, 5000)
    return () => { if (!w.requestIdleCallback) clearTimeout(h) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, sbd])

  const taiMo = useCallback(async () => {
    setLoi('')
    const r = await moAiDdh(token)
    if (!r.ok) { setLoi(r.chu); return }
    ghiCoBat(sbd, r.du.bat)
    setBat(r.du.bat); setDu(r.du); setTin(r.du.tin); setTruc(r.du.vanPhongTruc); setMoiChua(0)
  }, [token, sbd])
  useEffect(() => { if (mo) void taiMo() }, [mo, taiMo])

  // Hỏi tin mới: đang chờ 1 giây (25/10 "tối ưu tức thì"; tối: "tức thì hơn nữa" — trước 1,5 giây); tấm mở 20 giây; tấm đóng mà còn chờ 60 giây.
  // Vòng NỐI TIẾP (`batNhipBenVung`, đã có sẵn trong khung HS ⇒ không thêm byte): lượt sau chỉ hẹn khi lượt trước xong, tab ẩn không gọi, lỗi ⇒ thưa dần.
  const sauRef = useRef(sau)
  sauRef.current = sau
  useEffect(() => {
    if (!du?.bat) return
    // Đang chờ (tấm mở): GIỮ ĐƯỜNG — máy chủ chờ sẵn tới 10 giây, có tin là trả liền, rồi hỏi ngay lượt sau (chữ hiện dần tới từng nhịp ~0,7 giây).
    const giuDuong = mo && (dangCho || duoiNhanh)
    const ms = giuDuong ? 120 : mo ? 20_000 : dangCho ? 60_000 : 0
    if (!ms) return
    const v = batNhipBenVung(async () => {
      const r = await tinMoiAiDdh(token, sauRef.current, giuDuong ? 10_000 : 0)
      if (!r.ok) return false
      if (giuDuong && !r.du.giu) await new Promise((x) => setTimeout(x, 900))     // máy chủ cũ chưa giữ đường: giữ nhịp 1 giây như trước
      setTruc(r.du.vanPhongTruc)
      if (!r.du.tin.length) return
      setTin((cu) => gopTin(cu, r.du.tin))
      if (r.du.tin.some((x) => x.ben === 'vp')) setNhanhDen(Date.now() + DUOI_NHANH_MS)
      if (!mo) setMoiChua((n) => n + r.du.tin.filter((x) => x.ben === 'vp').length)
    }, { coSoMs: ms, lechMs: ms / 6, chayNgay: false, luiDanMs: [ms * 2, ms * 4, Math.max(ms * 8, 30_000)] })
    return () => v.dung()
  }, [du?.bat, mo, dangCho, duoiNhanh, token])

  useEffect(() => { const t = than.current; if (t && mo) t.scrollTop = t.scrollHeight }, [tin.length, cho.length, mo])

  // Tấm mở ⇒ KHOÁ CUỘN trang Hôm nay phía sau (25/10, thầy: "khi vuốt nền ở dưới không chạy theo nữa"). `overflow: hidden` trên body không đủ ở Safari iPhone
  // ⇒ ghim body cố định đúng chỗ đang cuộn; đóng tấm thì trả body + vị trí cuộn như cũ.
  useEffect(() => {
    if (!mo) return
    const b = document.body.style
    const cu = { position: b.position, top: b.top, left: b.left, right: b.right, width: b.width, overflow: b.overflow }
    const y = window.scrollY
    Object.assign(b, { position: 'fixed', top: `-${y}px`, left: '0', right: '0', width: '100%', overflow: 'hidden' })
    return () => {
      Object.assign(b, cu)
      window.scrollTo(0, y)
    }
  }, [mo])

  const gui = async (lai?: TinCho) => {
    const t: TinCho = lai ?? { maTin: maNhap.current, chu: chu.trim(), anh, so: anhSo, loi: '' }
    if (!t.chu && !t.anh.length) return
    if (!lai) { setChu(''); setAnh([]); setAnhSo([]); maNhap.current = taoMaTin(); demSo.current = 0 }
    setCho((c) => [...c.filter((x) => x.maTin !== t.maTin), { ...t, loi: '' }])
    setDangGui(true)
    // Ảnh đã tải trước (thường xong từ lúc em gõ chữ) ⇒ chỉ gửi số; ảnh nào hỏng thì tải lại một lần; vẫn hỏng ⇒ gửi kèm ảnh như cũ.
    const xong = await Promise.all(t.so.map(async (n, i) => {
      const k = `${t.maTin}-${n}`
      if (await (daTai.current.get(k) ?? Promise.resolve(false))) return true
      const p = taiAnhAiDdh(token, t.maTin, n, t.anh[i]!)
      daTai.current.set(k, p)
      return p
    }))
    const so = t.so.length && xong.every(Boolean) ? t.so : []
    const r = await guiAiDdh(token, t.maTin, t.chu, so.length ? [] : t.anh, so)
    setDangGui(false)
    if (r.ok) {
      setCho((c) => c.filter((x) => x.maTin !== t.maTin))
      const moi = [...(r.du.tin ? [r.du.tin] : []), ...r.du.them]
      if (moi.length) setTin((cu) => gopTin(cu, moi))
      setDu((d) => (d ? { ...d, conLuot: Math.max(0, d.conLuot - 1) } : d))
    } else {
      if (r.khoa === 'kiem_tra') setDu((d) => (d ? { ...d, khoa: 'kiem_tra' } : d))
      setCho((c) => c.map((x) => (x.maTin === t.maTin ? { ...x, loi: r.chu } : x)))
    }
  }
  // Có mạng lại ⇒ tự gửi các tin còn giữ.
  useEffect(() => {
    const on = () => cho.filter((x) => x.loi).forEach((x) => void gui(x))
    window.addEventListener('online', on)
    return () => window.removeEventListener('online', on)
  })

  const themAnh = async (ds: FileList | null) => {
    if (!ds) return
    for (const f of Array.from(ds).slice(0, 8 - anh.length)) {
      const b = await nenAnh(f)
      if (!b || demSo.current >= 16) continue
      const n = demSo.current++, ma = maNhap.current
      daTai.current.set(`${ma}-${n}`, taiAnhAiDdh(token, ma, n, b))
      setAnh((a) => [...a, b].slice(0, 8)); setAnhSo((x) => [...x, n].slice(0, 8))
    }
  }
  const dan = async () => {
    try { const s = await navigator.clipboard.readText(); if (s) setChu((c) => (c ? c + '\n' : '') + s) } catch { /* máy chặn đọc bộ nhớ tạm */ }
  }

  // Màn xoay / đổi cỡ ⇒ kéo nút về trong màn.
  const coViTri = viTri !== null
  useEffect(() => {
    if (!coViTri) return
    const on = () => setViTri((p) => (p ? kep(p, bong.current?.offsetWidth ?? 48, bong.current?.offsetHeight ?? 48) : p))
    on()
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [coViTri])

  if (!bat) return null
  return (
    <div className="aid-goc">
      {!mo && (
        <div className="aid-bong" ref={bong} style={viTri ? { left: viTri.x, top: viTri.y, right: 'auto', bottom: 'auto' } : undefined}>
          <button type="button" className="aid-bong-nut" aria-label="Mở A.I Đỗ Đại Học (giữ và kéo để đổi chỗ)"
            onPointerDown={(e) => {
              const r = bong.current!.getBoundingClientRect()
              keo.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, x0: e.clientX, y0: e.clientY, da: false }
              e.currentTarget.setPointerCapture(e.pointerId)      // giữ cử chỉ ngay từ đầu: tay rời nút nhanh vẫn kéo được
            }}
            onPointerMove={(e) => {
              const k = keo.current, b = bong.current
              if (!k || !b) return
              if (!k.da) {
                if (Math.hypot(e.clientX - k.x0, e.clientY - k.y0) < 6) return
                k.da = true
              }
              const p = kep({ x: e.clientX - k.dx, y: e.clientY - k.dy }, b.offsetWidth, b.offsetHeight)
              Object.assign(b.style, { left: `${p.x}px`, top: `${p.y}px`, right: 'auto', bottom: 'auto' })
            }}
            onPointerUp={() => {
              const k = keo.current, b = bong.current
              keo.current = null
              if (!k?.da || !b) return
              vuaKeo.current = true
              const r = b.getBoundingClientRect()
              const p = { x: Math.round(r.left), y: Math.round(r.top) }
              setViTri(p)
              try { localStorage.setItem(VI_TRI, JSON.stringify(p)) } catch { /* máy chặn lưu: lần sau về chỗ mặc định */ }
            }}
            onPointerCancel={() => { keo.current = null }}
            onClick={() => { if (vuaKeo.current) { vuaKeo.current = false; return } setMo(true) }}>
            <Mat co={42} />
            {moiChua ? <span className="aid-cham">{moiChua}</span> : null}
          </button>
        </div>
      )}
      {mo && (
        <>
          <div className="aid-che" onClick={() => setMo(false)} />
          <section className="aid-tam" role="dialog" aria-modal="true" aria-label="A.I Đỗ Đại Học">
            <header className="aid-dau">
              <span className="aid-tay" aria-hidden="true" />
              <Mat co={46} on={truc} />
              <div className="aid-dau-chu">
                <b>A.I Đỗ Đại Học</b>
                <span className="aid-trang-thai"><span className="aid-den" data-on={truc ? '' : undefined} />{truc ? 'Đang trực, nhắn gì cũng được' : 'Đang nghỉ, tin vẫn được giữ'}</span>
              </div>
              <button type="button" className="aid-nut-tron" aria-label="Thu nhỏ" onClick={() => setMo(false)}><ChevronDown size={22} /></button>
            </header>
            <div className="aid-than" ref={than} aria-live="polite">
              {!du ? (
                <div className="aid-tai">{loi ? <><WifiOff size={28} /><span>{loi}</span><button type="button" className="aid-trang-nut" onClick={() => void taiMo()}>Thử lại</button></> : <span className="aid-cho"><i /><i /><i /></span>}</div>
              ) : du.khoa === 'kiem_tra' ? (
                <div className="aid-khoa"><span className="aid-khoa-icon"><Lock size={40} /></span><b>Bạn đang có bài kiểm tra mở</b><p>Tôi tạm khoá tới khi bạn nộp bài. Trong màn làm bài kiểm tra, bong bóng cũng ẩn hẳn.</p></div>
              ) : (
                <>
                  {!tin.length && !cho.length && (
                    <div className="aid-chao">
                      <div className="aid-chao-anh"><Mat co={64} on={truc} /></div>
                      <div className="aid-chao-than">
                        <h2>{ten ? `Chào ${ten}! Có gì cứ quăng đây, tôi cân hết.` : 'Chào bạn! Có gì cứ quăng đây, tôi cân hết.'}</h2>
                        <p>Hỏi bài, xin đề, xin vài câu luyện, hay chỉ muốn tâm sự cũng được. Tôi trả lời ngay trong này.</p>
                        <div className="aid-o-chon">
                          <button type="button" onClick={() => tepChup.current?.click()}><i><Camera size={22} /></i>Chụp ảnh đề</button>
                          <button type="button" onClick={() => tepChon.current?.click()}><i><Anh size={22} /></i>Chọn ảnh có sẵn</button>
                          <button type="button" onClick={() => void dan()}><i><ClipboardPaste size={22} /></i>Dán đề bài</button>
                        </div>
                        <div className="aid-tin-cay">
                          <span><ShieldCheck size={16} />Câu có trong kho đề của Thầy: tôi dùng đúng đáp án và lời giải của kho.</span>
                          <span><Zap size={16} />Câu mới: tôi giải hai lượt độc lập, khớp nhau mới gửi bạn.</span>
                        </div>
                        <span className="aid-luot"><Clock size={14} />Hôm nay bạn còn {du.conLuot}/{du.tranLuot} lượt nhắn</span>
                      </div>
                    </div>
                  )}
                  {tin.map((t, i) => {
                    const truoc = tin[i - 1]
                    if (t.ben === 'em') return (
                      <div key={t.id} className="aid-em">
                        {t.anh > 0 && <div className="aid-bt"><span className="aid-anh-em"><Camera size={16} />{t.anh} ảnh đề</span></div>}
                        {t.chu && <div className="aid-bt">{t.chu}</div>}
                        <span className="aid-gio">{gio(t.luc)}</span>
                      </div>
                    )
                    return (
                      <div key={t.id} className="aid-nhom">
                        <Mat co={32} />
                        {truoc?.ben !== 'vp' && <span className="aid-ten">A.I Đỗ Đại Học</span>}
                        <TinVanPhong t={t} />
                        <span className="aid-gio">{gio(t.luc)}</span>
                      </div>
                    )
                  })}
                  {cho.map((t) => (
                    <div key={t.maTin} className="aid-em">
                      {t.anh.length > 0 && <div className="aid-go-anh">{t.anh.map((a, i) => <span key={i}><img src={`data:image/jpeg;base64,${a}`} alt="Ảnh đề" /></span>)}</div>}
                      {t.chu && <div className="aid-bt">{t.chu}</div>}
                      {t.loi ? <span className="aid-loi-gui"><WifiOff size={14} />{t.loi}<button type="button" onClick={() => void gui(t)}>Gửi lại</button></span> : <span className="aid-gio">{t.anh.length ? 'Đang gửi ảnh…' : 'Đang gửi…'}</span>}
                    </div>
                  ))}
                  {dangCho && truc && (
                    <div className="aid-nhom"><Mat co={32} /><div className="aid-bt"><span className="aid-soan"><span className="aid-cho"><i /><i /><i /></span>{chuDangCho(tinCho, lau)}</span></div></div>
                  )}
                  {dangCho && !truc && (
                    <div className="aid-he"><MoonStar size={18} /><span><b>Tôi đang nghỉ.</b> Tin của bạn đã được giữ lại. Mở lại là tôi trả lời ngay, bong bóng hiện chấm đỏ báo tin mới.</span></div>
                  )}
                  {du.conLuot <= 0 && <div className="aid-he"><Clock size={18} />Hôm nay bạn đã nhắn đủ {du.tranLuot} lượt. 0 giờ đêm nay nhắn tiếp được.</div>}
                </>
              )}
            </div>
            <div className="aid-go-vo">
              {du && !du.khoa && (
                <>
                  {anh.length > 0 && <div className="aid-go-anh">{anh.map((a, i) => <span key={i}><img src={`data:image/jpeg;base64,${a}`} alt={`Ảnh đề ${i + 1}`} /><button type="button" aria-label="Bỏ ảnh" onClick={() => { setAnh((x) => x.filter((_, j) => j !== i)); setAnhSo((x) => x.filter((_, j) => j !== i)) }}>×</button></span>)}</div>}
                  <div className="aid-go">
                    <button type="button" className="aid-nut-tron" aria-label="Chụp ảnh đề" onClick={() => tepChup.current?.click()}><Camera size={22} /></button>
                    <button type="button" className="aid-nut-tron" aria-label="Chọn ảnh có sẵn" onClick={() => tepChon.current?.click()}><Anh size={22} /></button>
                    <textarea className="aid-go-o" rows={1} placeholder="Nhắn gì cũng được…" value={chu} maxLength={4000} aria-label="Nội dung hỏi" onChange={(e) => setChu(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 720) { e.preventDefault(); void gui() } }} />
                    <button type="button" className="aid-nut-tron" data-gui="" aria-label="Gửi" disabled={dangGui || (!chu.trim() && !anh.length) || du.conLuot <= 0} onClick={() => void gui()}><Send size={20} /></button>
                  </div>
                </>
              )}
              <div className="aid-chan"><Lock size={12} />{du?.khoa ? 'Nộp bài kiểm tra xong, A.I Đỗ Đại Học mở lại.' : 'Tự khoá khi bạn đang làm bài kiểm tra.'}</div>
              <input ref={tepChup} className="aid-an" type="file" accept="image/*" capture="environment" onChange={(e) => { void themAnh(e.target.files); e.target.value = '' }} />
              <input ref={tepChon} className="aid-an" type="file" accept="image/*" multiple onChange={(e) => { void themAnh(e.target.files); e.target.value = '' }} />
            </div>
          </section>
        </>
      )}
    </div>
  )
}


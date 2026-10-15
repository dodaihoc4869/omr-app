// ĐƯỜNG /hoi-thay (thầy 15/10/2026: "Tất cả các bài làm html đã gửi học sinh bạn nối nguyên nút hỏi thầy trong app vào từng câu để học sinh
// hỏi được chứ"). Trang bài làm văn phòng gửi em (https://ddh-tai-lieu.pages.dev/t/<slug>/) có nút "Hỏi thầy" ở từng câu; bấm ⇒ trang mở
// lớp phủ có iframe tới `/hoi-thay?qid=<qid>&dl=<1|0>&nguon=trang_html[&em=<đáp án em đã chọn>]#t=<token>` ⇒ ở đây mở NGUYÊN hộp Hỏi Thầy
// của app (HopHoiThay) hoặc khung lời giải (KhungLoiGiai), đúng luật NgheHoiThayPhieu (phiếu HTML trong iframe):
//   · `dl=1` (em đang làm, chưa nộp) ⇒ máy chủ chỉ trả đề, Thầy (AI) chỉ gợi hướng; phần hỏi Thầy chưa bật cho em ⇒ lời nhắc làm xong rồi hỏi.
//   · `dl=0` (đã nộp) ⇒ hộp hỏi Thầy có lối sang "Xem lời giải từng bước"; chưa bật hỏi Thầy ⇒ khung lời giải (hồ sơ hoặc lời giải chữ của kho).
//   · Lỗi máy chủ (ca kiểm tra mở, câu đang bảo vệ…) ⇒ báo đúng lời máy chủ như mọi nút Hỏi thầy.
// TOKEN: phiên cổng học sinh (`omr_student_portal_auth`, docTokenHs). Iframe bên thứ ba trong trình duyệt Zalo trên iPhone (WebKit ITP) có thể
// mất localStorage giữa các lần mở ⇒ trang mẹ cất token hộ và đưa lại qua `#t=<token>`: ghi vào phiên rồi XOÁ hash khỏi địa chỉ. Máy chặn hẳn
// localStorage ⇒ kho nhớ tạm của lượt mở này (khoNhoTam). Chưa có token ⇒ thẻ đăng nhập học sinh của app, xong mở hộp luôn.
// NHẮN TRANG MẸ (postMessage CHỈ tới ME_ORIGIN, không '*' vì có token): {type:'ddh-hs-token', token} sau đăng nhập / khi có sẵn token không
// đến từ #t; {type:'ddh-hoi-thay-dong'} khi em đóng; {type:'ddh-hs-dang-xuat'} khi máy chủ báo phiên hỏng (trang mẹ xoá token đã cất).
// TỐC ĐỘ (luật tốc độ 13/10): mảnh riêng (main.tsx chọn gốc này, không kéo App.tsx); lượt hỏi máy chủ bắt đầu NGAY lúc mảnh chạy, trước khi
// React dựng; hộp nảy lên ngay với ba vạch chờ (như NutHoiThay); khung lời giải và màn đăng nhập tách mảnh, chỉ tải khi cần.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import BatLinhShell from '../components/bat-linh/BatLinhShell'
import ChanLoi from '../components/ChanLoi'
import HopHoiThay from '../components/loi-giai/HopHoiThay'
import KhungLoiGiai from '../components/loi-giai/KhungLoiGiai'
import DangNhap from './HoiThayDangNhap'
import { CHU_LAM_XONG, docTokenHs, hoiThay, type CauChoKhung, type HoSoLoiGiai, type KetQuaHoiThay, type KiemKhung, type LoiGiaiChu } from '../lib/loi-giai-api'
import type { ThongTinHs } from '../lib/phien-hoc-sinh'
import { docPhien, docThamSoHoiThay, KHOA_PHIEN, laLoiPhien, ME_ORIGIN, phienTuToken, tokenCuaHash, type TinChoMe } from '../lib/hoi-thay-nhung'
import '../components/loi-giai/loi-giai.css'
import './hoi-thay-trang.css'


/** Iframe bên thứ ba mà trình duyệt CHẶN HẲN localStorage (Safari "chặn mọi cookie"…: đọc là ném lỗi) ⇒ thay bằng kho trong bộ nhớ cho lượt
 *  mở này, để phiên vừa đăng nhập / token trang mẹ đưa vẫn đọc được (docTokenHs). Chỉ mảnh /hoi-thay làm, không đụng mã chung của ba app. */
function khoNhoTam(): void {
  try { void window.localStorage.length; return } catch { /* bị chặn */ }
  const m = new Map<string, string>()
  const kho = {
    get length() { return m.size },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, String(v)) },
    removeItem: (k: string) => { m.delete(k) },
    clear: () => m.clear(),
  }
  try { Object.defineProperty(window, 'localStorage', { configurable: true, value: kho }) } catch { /* không thay được: đăng nhập vẫn chạy, chỉ không nhớ */ }
}

/** Trong iframe của trang mẹ? (`parent` khác chính nó.) */
function trongIframe(): boolean {
  try { return window.parent !== window } catch { return true }
}

function baoMe(tin: TinChoMe): void {
  try { if (window.parent !== window) window.parent.postMessage(tin, ME_ORIGIN) } catch { /* trang mẹ khác gốc: trình duyệt tự bỏ tin */ }
}

/** Cất phiên vào localStorage (máy chặn lưu ⇒ kho nhớ tạm của lượt mở này, xem `khoNhoTam`). */
function catToken(t: ThongTinHs): void {
  try { localStorage.setItem(KHOA_PHIEN, JSON.stringify(t)) } catch { /* không lưu được: em đăng nhập lại lần sau */ }
}

function boToken(token: string): void {
  try { if (docPhien()?.token === token) localStorage.removeItem(KHOA_PHIEN) } catch { /* như trên */ }
}

// ---------------------------------------------------------------- chạy NGAY lúc mảnh về (trước khi React dựng)
khoNhoTam()
const THAM_SO = docThamSoHoiThay(location.search)
const TU_HASH = (() => {
  const t = tokenCuaHash(location.hash)
  if (!t) return false
  try { history.replaceState(history.state, '', location.pathname + location.search) } catch { /* trình duyệt cũ: hash ở lại, vô hại */ }
  const p = phienTuToken(t, docPhien())
  if (!p) return false
  catToken(p)
  return true
})()
const NHUNG = trongIframe()
if (NHUNG) document.documentElement.setAttribute('data-hoi-thay-nhung', '')
type Hoi = { cau: CauChoKhung; hoSo?: HoSoLoiGiai; loiGiaiChu?: LoiGiaiChu; kiem?: KiemKhung; hoiThem: boolean }
let huaDau: Promise<KetQuaHoiThay> | null = THAM_SO.qid && docTokenHs() ? hoiThay(THAM_SO.qid, THAM_SO.nguon, THAM_SO.dangLam) : null

/** Mốc KaTeX của main.tsx (`GocApp.huaManEmSom`): hộp có công thức ngay ⇒ main.tsx tải KaTeX liền, không cần chờ gì. */
export function huaManEmSom(): Promise<unknown> | null {
  return null
}

type TrangThai =
  | { k: 'cho' }
  | { k: 'hop'; hoi: Hoi }
  | { k: 'khung'; hoi: Hoi }
  | { k: 'loi'; loi: string }
  | { k: 'dong' }

function ManHoiThay() {
  const { qid, dangLam, nguon, dapAnEm } = THAM_SO
  const [token, setToken] = useState(() => docTokenHs())
  const [tt, setTt] = useState<TrangThai>(() => (!qid ? { k: 'loi', loi: 'Thiếu câu cần hỏi. Em đóng rồi bấm lại nút Hỏi thầy ở câu đó nhé.' } : { k: 'cho' }))
  const [luot, setLuot] = useState(0) // "Hỏi lại câu này" sau khi đóng (mở thẳng, không trong iframe)
  const daBaoToken = useRef(false)

  useLayoutEffect(() => {
    if (!NHUNG) return
    document.documentElement.setAttribute('data-hoi-thay-nhung', '')
    return () => document.documentElement.removeAttribute('data-hoi-thay-nhung')
  }, [])

  // Có sẵn token mà không đến từ #t ⇒ trang mẹ cất hộ (lần sau đưa lại qua #t).
  useEffect(() => {
    if (token && !TU_HASH && !daBaoToken.current) { daBaoToken.current = true; baoMe({ type: 'ddh-hs-token', token }) }
  }, [token])

  useEffect(() => {
    if (!token || !qid || tt.k !== 'cho') return
    let con = true
    const hua = huaDau ?? hoiThay(qid, nguon, dangLam)
    huaDau = null
    void hua.then((r) => {
      if (!con) return
      if (!r.ok) {
        if (laLoiPhien(r.loi)) {
          boToken(token)
          baoMe({ type: 'ddh-hs-dang-xuat' })
          setToken('')
          return
        }
        setTt({ k: 'loi', loi: r.loi })
        return
      }
      if (dangLam && !r.hoiThem) { setTt({ k: 'loi', loi: CHU_LAM_XONG }); return }
      const hoi: Hoi = { cau: r.cau, hoSo: r.hoSo, loiGiaiChu: r.loiGiaiChu, kiem: 'kiem' in r ? r.kiem : undefined, hoiThem: r.hoiThem === true }
      setTt(hoi.hoiThem ? { k: 'hop', hoi } : { k: 'khung', hoi })
    })
    return () => { con = false }
  }, [token, qid, nguon, dangLam, tt.k, luot])

  const dong = () => {
    setTt({ k: 'dong' })
    baoMe({ type: 'ddh-hoi-thay-dong' })
  }
  const daDangNhap = async (t: ThongTinHs) => {
    if (!t.token) return
    catToken(t)
    daBaoToken.current = true
    baoMe({ type: 'ddh-hs-token', token: t.token })
    setTt(qid ? { k: 'cho' } : tt)
    setToken(t.token)
  }

  if (!token) {
    return (
      <DangNhap onDangNhap={daDangNhap} onDong={dong} />
    )
  }
  if (tt.k === 'dong') {
    if (NHUNG) return null
    return (
      <div className="htt-nen m3">
        <div className="htt-the" role="status">
          <p className="htt-the-chu">Đã đóng hộp Hỏi Thầy.</p>
          <div className="htt-the-nut">
            <button type="button" className="lg-nut lg-nut--chinh" onClick={() => (history.length > 1 ? history.back() : window.close())}>Quay lại bài làm</button>
            {qid && <button type="button" className="lg-nut" onClick={() => { setTt({ k: 'cho' }); setLuot((x) => x + 1) }}>Hỏi lại câu này</button>}
          </div>
        </div>
      </div>
    )
  }
  if (tt.k === 'loi') {
    return (
      <div className="lg-bao-loi m3" role="alert">
        <span>{tt.loi}</span>
        <button type="button" className="lg-nut" onClick={dong}>Đóng</button>
      </div>
    )
  }
  if (tt.k === 'khung') {
    const { hoi } = tt
    return (
      <KhungLoiGiai hoSo={hoi.hoSo} cau={hoi.cau} loiGiaiChu={hoi.loiGiaiChu} kiem={hoi.kiem} nguon={nguon} onDong={dong} />
    )
  }
  const hoi = tt.k === 'hop' ? tt.hoi : null
  return (
    <HopHoiThay
      cau={hoi?.cau ?? null}
      qid={qid}
      nguon={nguon}
      dangLam={dangLam}
      dapAnEm={!dangLam && dapAnEm ? dapAnEm : undefined}
      onDong={dong}
      onMoLoiGiai={hoi && !dangLam ? () => setTt({ k: 'khung', hoi }) : undefined}
    />
  )
}

export default function HoiThayScreen() {
  return (
    <ChanLoi o="Hỏi thầy">
      <BatLinhShell vai="hs">
        <ManHoiThay />
      </BatLinhShell>
    </ChanLoi>
  )
}

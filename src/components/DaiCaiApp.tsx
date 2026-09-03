// CÀI APP RA MÀN HÌNH CHÍNH — hai lối vào, chung một bộ logic.
//
//   <DaiCaiApp>  dải nhắc ở ĐẦU TRANG. Bấm "Để sau" thì im 7 ngày.
//   <NutCaiApp>  hàng nhỏ ở CUỐI TRANG, LUÔN CÓ khi app đang chạy trong tab
//                trình duyệt. Bấm "Để sau" chỉ tắt dải nhắc, KHÔNG được cắt
//                mất đường cài — thầy đã dính đúng cảnh này: bấm Để sau một
//                lần rồi mở lại link thì không còn chỗ nào bấm cài nữa.
//
// Ba tình huống, cùng một cách xử:
//   1. Cài được 1 chạm (Chrome Android)  → gọi hộp thoại cài của trình duyệt.
//   2. iOS Safari                        → tấm trượt hướng dẫn Chia sẻ → Thêm vào MH chính.
//   3. Không cài được (Cốc Cốc, Zalo, …) → tấm trượt bảo mở bằng Chrome,
//      kèm Sao chép link và (Android) Thử mở trong Chrome bằng intent.
import { useEffect, useState } from 'react'
import { X, Smartphone } from 'lucide-react'
import {
  caiMotCham,
  CHO_SU_KIEN_CAI_MS,
  coTheCaiMotCham,
  daBoQuaNhacCai,
  dangTrongTrinhDuyet,
  ghiNhoBoQuaNhacCai,
  laCocCoc,
  laIOS,
  moBangChrome,
  tenAppCuaVai,
  tenAppSeCai,
  theoDoiSuKienCai,
  trongTrinhDuyetTrongApp,
} from '../lib/pwa-install'
import { useAppStore } from '../store/appStore'

const SANS: React.CSSProperties = { fontFamily: 'var(--sans)' }

/** Icon vai — dùng chính file biểu tượng sẽ hiện trên màn hình chính, để em
 * thấy trước đúng cái sắp cài. */
function bieuTuong(vai: 'hs' | 'ph'): string {
  return `${import.meta.env.BASE_URL}${vai === 'ph' ? 'icon-ph-192.png' : 'icon-hs-192.png'}`
}

/** Vẽ khung điện thoại, tô sáng đúng vị trí nút ⋮ góc trên bên phải.
 * Phụ huynh lớn tuổi không tìm ra nút đó nếu chỉ tả bằng chữ. */
function ViTriNutBaCham() {
  return (
    <svg viewBox="0 0 60 96" width="46" height="74" aria-hidden="true" style={{ flex: 'none' }}>
      <rect x="1" y="1" width="58" height="94" rx="8" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
      <rect x="1" y="1" width="58" height="18" rx="8" fill="currentColor" fillOpacity="0.06" />
      <rect x="8" y="7" width="26" height="5" rx="2.5" fill="currentColor" fillOpacity="0.25" />
      <circle cx="50" cy="10" r="9" fill="var(--cam)" fillOpacity="0.22" />
      <circle cx="50" cy="6.2" r="1.5" fill="currentColor" />
      <circle cx="50" cy="10" r="1.5" fill="currentColor" />
      <circle cx="50" cy="13.8" r="1.5" fill="currentColor" />
      <rect x="8" y="28" width="44" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
      <rect x="8" y="38" width="34" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
      <rect x="8" y="48" width="40" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

/** Nút Chia sẻ của Safari, vẽ bằng SVG (không tải ảnh ngoài). */
function NutChiaSeIOS() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
    </svg>
  )
}

const NUT_DAC: React.CSSProperties = {
  fontSize: 'var(--cx-1)',
  color: 'var(--muc-nguoc)',
  background: 'var(--muc)',
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k4)',
  minHeight: 40,
}
const NUT_VIEN: React.CSSProperties = {
  fontSize: 'var(--cx-1)',
  color: 'var(--muc)',
  border: '1px solid var(--vien)',
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k4)',
  minHeight: 40,
}

/** Toàn bộ logic cài app, dùng chung cho dải nhắc và nút cuối trang. */
function useCaiApp(vai: 'hs' | 'ph') {
  const showToast = useAppStore((s) => s.showToast)
  const [trongTab, setTrongTab] = useState(dangTrongTrinhDuyet)
  const [moTam, setMoTam] = useState(false)
  const [coNutCai, setCoNutCai] = useState(coTheCaiMotCham())
  const [hetGioCho, setHetGioCho] = useState(false)
  // TÊN APP TRÌNH DUYỆT THẬT SỰ SẼ CÀI, đọc từ đúng file manifest đang được
  // thẻ <link rel="manifest"> trỏ tới. null = chưa đọc xong.
  const [tenSeCai, setTenSeCai] = useState<string | null>(null)

  useEffect(() => theoDoiSuKienCai(() => setCoNutCai(coTheCaiMotCham())), [])

  // KHÔNG ĐOÁN THEO TÊN TRÌNH DUYỆT, DÒ KHẢ NĂNG THẬT. Cốc Cốc là Chromium
  // nhưng không có luồng cài PWA; đoán theo tên thì còn sót bao nhiêu cái khác.
  useEffect(() => {
    const t = setTimeout(() => setHetGioCho(true), CHO_SU_KIEN_CAI_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let con = true
    tenAppSeCai().then((t) => con && setTenSeCai(t))
    return () => {
      con = false
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: browser)')
    const doi = () => setTrongTab(dangTrongTrinhDuyet())
    mq.addEventListener('change', doi)
    return () => mq.removeEventListener('change', doi)
  }, [])

  const tenApp = tenAppCuaVai(vai)
  // Máy còn giữ bản HTML cũ thì thẻ manifest vẫn trỏ app chung — bấm Cài đặt
  // lúc này ra app "ĐỖ ĐẠI HỌC" chung. Thà chặn lại còn hơn cài nhầm.
  const lechManifest = tenSeCai !== null && tenSeCai !== '' && tenSeCai !== tenApp
  const trongApp = trongTrinhDuyetTrongApp()
  // iOS: không bao giờ có beforeinstallprompt, nhưng Safari cài tay được.
  const khongCaiDuoc = trongApp || (!coNutCai && hetGioCho && !laIOS())
  const linkChrome = khongCaiDuoc ? moBangChrome() : null

  const chepLink = async () => {
    try {
      await navigator.clipboard.writeText(location.href)
      showToast('Đã sao chép — dán vào Chrome để mở', 'success')
    } catch {
      showToast('Máy không cho sao chép. Bấm ⋮ rồi chọn Mở bằng trình duyệt.', 'warn')
    }
  }

  const cai = async () => {
    if (!coTheCaiMotCham()) return setMoTam(true)
    const ok = await caiMotCham()
    if (ok) setTrongTab(false)
    else setCoNutCai(coTheCaiMotCham())
  }

  return { trongTab, tenApp, tenSeCai, lechManifest, trongApp, khongCaiDuoc, linkChrome, chepLink, cai, moTam, setMoTam }
}

type BoCaiApp = ReturnType<typeof useCaiApp>

/** Tấm trượt hướng dẫn — nội dung đổi theo tình huống thật của máy. */
function TamHuongDan({ bo }: { bo: BoCaiApp }) {
  if (!bo.moTam) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'var(--phu)' }} onClick={() => bo.setMoTam(false)}>
      <div
        className="w-full"
        style={{ maxWidth: 480, background: 'var(--the)', borderTopLeftRadius: 'var(--bo-3)', borderTopRightRadius: 'var(--bo-3)', padding: 'var(--k5)', ...SANS }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between" style={{ gap: 'var(--k3)', marginBottom: 'var(--k4)' }}>
          <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)', color: 'var(--muc)' }}>
            {bo.khongCaiDuoc ? 'Mở bằng Chrome để cài app' : 'Cài ra màn hình chính'}
          </div>
          <button onClick={() => bo.setMoTam(false)} className="tap-target shrink-0" style={{ color: 'var(--nhat)' }} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {bo.khongCaiDuoc ? (
          <div className="flex items-start" style={{ gap: 'var(--k4)' }}>
            <ViTriNutBaCham />
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 'var(--cx-2)', color: 'var(--muc)', lineHeight: 1.7 }}>
                {bo.trongApp ? (
                  <>
                    Đang mở trong Zalo nên không cài được. Bấm <b>⋮</b> góc trên bên phải, chọn <b>Mở bằng trình duyệt</b>.
                  </>
                ) : laCocCoc() ? (
                  <>Cốc Cốc không cài được app ra màn hình chính. Sao chép link rồi mở bằng Chrome.</>
                ) : (
                  <>Trình duyệt này không cài được app ra màn hình chính. Sao chép link rồi mở bằng Chrome.</>
                )}
              </div>
              <div className="flex flex-wrap items-center" style={{ gap: 'var(--k2)', marginTop: 'var(--k4)' }}>
                <button type="button" onClick={bo.chepLink} className="tap-target font-bold" style={NUT_DAC}>
                  Sao chép link
                </button>
                {bo.linkChrome && (
                  <a href={bo.linkChrome} className="tap-target font-bold inline-flex items-center" style={NUT_VIEN}>
                    Thử mở trong Chrome
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : laIOS() ? (
          <ol className="flex flex-col" style={{ gap: 'var(--k4)', fontSize: 'var(--cx-2)', color: 'var(--muc)', paddingLeft: 0, listStyle: 'none' }}>
            <li className="flex items-center" style={{ gap: 'var(--k3)' }}>
              <span className="shrink-0 flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 'var(--bo-1)', background: 'var(--the-2)', color: 'var(--tim)' }}>
                <NutChiaSeIOS />
              </span>
              <span>
                Bấm nút <b>Chia sẻ</b> ở thanh dưới Safari (hình mũi tên đi lên).
              </span>
            </li>
            <li className="flex items-center" style={{ gap: 'var(--k3)' }}>
              <span className="shrink-0 flex items-center justify-center font-bold" style={{ width: 40, height: 40, borderRadius: 'var(--bo-1)', background: 'var(--the-2)', color: 'var(--muc)' }}>
                2
              </span>
              <span>
                Kéo xuống, chọn <b>Thêm vào MH chính</b>.
              </span>
            </li>
            <li className="flex items-center" style={{ gap: 'var(--k3)' }}>
              <span className="shrink-0 flex items-center justify-center font-bold" style={{ width: 40, height: 40, borderRadius: 'var(--bo-1)', background: 'var(--the-2)', color: 'var(--muc)' }}>
                3
              </span>
              <span>
                Bấm <b>Thêm</b> ở góc trên bên phải.
              </span>
            </li>
          </ol>
        ) : (
          <div style={{ fontSize: 'var(--cx-2)', color: 'var(--muc)', lineHeight: 1.7 }}>
            Mở menu <b>⋮</b> của trình duyệt, chọn <b>Thêm vào Màn hình chính</b> (hoặc <b>Cài ứng dụng</b>).
          </div>
        )}

        <div style={{ fontSize: 'var(--cx-1)', color: 'var(--nhat)', marginTop: 'var(--k5)' }}>
          Cài xong, mở app từ biểu tượng là vào thẳng, không cần link.
        </div>
      </div>
    </div>
  )
}

/** DẢI NHẮC ở đầu trang. "Để sau" im 7 ngày rồi nhắc lại (pwa-install.ts). */
export default function DaiCaiApp({ vai }: { vai: 'hs' | 'ph' }) {
  const bo = useCaiApp(vai)
  const [daBoQua, setDaBoQua] = useState(daBoQuaNhacCai)

  if (!bo.trongTab || daBoQua) return null

  const deSau = () => {
    ghiNhoBoQuaNhacCai()
    setDaBoQua(true)
  }

  return (
    <>
      <div
        role="note"
        className="flex items-center"
        style={{ gap: 'var(--k3)', background: 'var(--the)', borderBottom: '1px solid var(--vien)', padding: 'var(--k3) var(--k4)', ...SANS }}
      >
        <img src={bieuTuong(vai)} alt="" width={44} height={44} style={{ borderRadius: 'var(--bo-1)', flex: 'none' }} />
        <div className="flex-1 min-w-0">
          <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
            {bo.lechManifest ? 'Máy còn giữ bản cũ' : bo.khongCaiDuoc ? 'Mở bằng Chrome để cài app' : `Cài ${bo.tenSeCai || bo.tenApp} ra màn hình`}
          </div>
          <div style={{ fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
            {bo.lechManifest
              ? `Bấm Cài đặt lúc này sẽ ra app "${bo.tenSeCai}". Tải lại một lần rồi cài.`
              : bo.khongCaiDuoc
                ? 'Trình duyệt đang dùng không cài được app.'
                : vai === 'ph'
                  ? 'Mở nhanh, không cần tìm lại link'
                  : 'Mở nhanh, làm bài toàn màn hình'}
          </div>
        </div>
        <div className="flex items-center shrink-0" style={{ gap: 'var(--k2)' }}>
          <button type="button" onClick={deSau} className="tap-target" style={{ fontSize: 'var(--cx-1)', color: 'var(--nhat)', padding: '0 var(--k2)' }}>
            Để sau
          </button>
          <button
            type="button"
            onClick={bo.lechManifest ? () => location.reload() : bo.khongCaiDuoc ? () => bo.setMoTam(true) : bo.cai}
            className="tap-target font-bold"
            style={NUT_DAC}
          >
            {bo.lechManifest ? 'Tải lại' : bo.khongCaiDuoc ? 'Cách cài' : 'Cài đặt'}
          </button>
        </div>
      </div>
      <TamHuongDan bo={bo} />
    </>
  )
}

/**
 * NÚT CÀI Ở CUỐI TRANG — luôn có khi app đang chạy trong tab trình duyệt.
 *
 * "Để sau" chỉ tắt dải nhắc ở đầu trang; đường cài KHÔNG được biến mất, nếu
 * không thì bấm nhầm một lần là phải chờ 7 ngày hoặc xoá dữ liệu trang mới
 * cài được.
 */
export function NutCaiApp({ vai }: { vai: 'hs' | 'ph' }) {
  const bo = useCaiApp(vai)
  if (!bo.trongTab) return null

  return (
    <>
      <button
        type="button"
        onClick={bo.lechManifest ? () => location.reload() : bo.khongCaiDuoc ? () => bo.setMoTam(true) : bo.cai}
        className="tap-target w-full flex items-center justify-center"
        style={{ ...SANS, gap: 'var(--k2)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', minHeight: 44 }}
      >
        <Smartphone size={16} />
        {bo.lechManifest ? 'Tải lại để cài đúng app' : bo.khongCaiDuoc ? 'Cách cài app ra màn hình chính' : `Cài ${bo.tenSeCai || bo.tenApp} ra màn hình chính`}
      </button>
      <TamHuongDan bo={bo} />
    </>
  )
}

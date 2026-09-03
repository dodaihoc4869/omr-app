// DẢI "CÀI ĐỖ ĐẠI HỌC RA MÀN HÌNH" — đặt ở ĐẦU TRANG, trên nội dung, không
// phải cửa sổ bật lên che màn. Hiện cho vai học sinh và phụ huynh khi app đang
// chạy trong tab trình duyệt thường; đã cài rồi thì không bao giờ hiện.
//
// Chrome/Android: có beforeinstallprompt → bấm "Cài đặt" là cài ngay.
// Safari iOS: KHÔNG có sự kiện đó → bấm "Cài đặt" mở tấm trượt hướng dẫn tay,
// kèm hình nút Chia sẻ để phụ huynh lớn tuổi tìm được.
// "Để sau" im 7 ngày rồi nhắc lại (pwa-install.ts).
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { caiMotCham, CHO_SU_KIEN_CAI_MS, coTheCaiMotCham, daBoQuaNhacCai, dangTrongTrinhDuyet, ghiNhoBoQuaNhacCai, laCocCoc, laIOS, moBangChrome, tenAppCuaVai, tenAppSeCai, theoDoiSuKienCai, trongTrinhDuyetTrongApp, NGAY_IM_LANG } from '../lib/pwa-install'
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

// Chỉ dùng cho vai học sinh / phụ huynh — thầy không cần cài app riêng.
export default function DaiCaiApp({ vai }: { vai: 'hs' | 'ph' }) {
  // Hook phải gọi TRƯỚC mọi lệnh return sớm bên dưới.
  const showToast = useAppStore((s) => s.showToast)
  const [hien, setHien] = useState(() => dangTrongTrinhDuyet() && !daBoQuaNhacCai())
  const [moHuongDan, setMoHuongDan] = useState(false)
  // Nút "Cài đặt" luôn hiện: có beforeinstallprompt thì cài 1 chạm, không có
  // (Safari) thì mở hướng dẫn tay. Vẫn nghe sự kiện để cập nhật khả năng cài.
  const [coNutCai, setCoNutCai] = useState(coTheCaiMotCham())
  useEffect(() => theoDoiSuKienCai(() => setCoNutCai(coTheCaiMotCham())), [])

  // KHÔNG ĐOÁN THEO TÊN TRÌNH DUYỆT, DÒ KHẢ NĂNG THẬT. Cốc Cốc là Chromium
  // nhưng không có luồng cài PWA: menu không có "Thêm vào Màn hình chính" và
  // không bắn beforeinstallprompt. Đoán theo tên thì còn sót bao nhiêu trình
  // duyệt khác. Chờ hết CHO_SU_KIEN_CAI_MS mà không có sự kiện, và không phải
  // iOS (iOS vốn không có sự kiện này, cài tay được), thì kết luận không cài được.
  const [hetGioCho, setHetGioCho] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setHetGioCho(true), CHO_SU_KIEN_CAI_MS)
    return () => clearTimeout(t)
  }, [])

  // TÊN APP TRÌNH DUYỆT THẬT SỰ SẼ CÀI, đọc từ đúng file manifest đang được
  // thẻ <link rel="manifest"> trỏ tới. null = chưa đọc xong.
  const [tenSeCai, setTenSeCai] = useState<string | null>(null)
  useEffect(() => {
    let con = true
    tenAppSeCai().then((t) => con && setTenSeCai(t))
    return () => {
      con = false
    }
  }, [])
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: browser)')
    const onChange = () => setHien(dangTrongTrinhDuyet() && !daBoQuaNhacCai())
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  if (!hien) return null

  const deSau = () => {
    ghiNhoBoQuaNhacCai()
    setHien(false)
  }

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
    if (!coTheCaiMotCham()) return setMoHuongDan(true)
    const ok = await caiMotCham()
    if (ok) setHien(false)
    else setCoNutCai(coTheCaiMotCham())
  }

  const tenApp = tenAppCuaVai(vai)
  // Máy còn giữ bản HTML cũ thì thẻ manifest vẫn trỏ app chung — bấm Cài đặt
  // lúc này ra app "ĐỖ ĐẠI HỌC" chung, không phải app của vai. Thà chặn lại và
  // bảo mở lại một lần, còn hơn để thầy/phụ huynh cài nhầm rồi tưởng đã xong.
  const lechManifest = tenSeCai !== null && tenSeCai !== '' && tenSeCai !== tenApp

  // TRONG ZALO/FACEBOOK thì không cài được, và cũng không nên vờ như cài được:
  // các trình duyệt đó bỏ qua manifest, "Thêm vào màn hình chính" chỉ ra một lối
  // tắt mang tên và biểu tượng chung. Phải mở bằng Chrome/Safari trước.
  if (khongCaiDuoc) {
    return (
      <div
        role="note"
        style={{ background: 'var(--the)', borderBottom: '1px solid var(--vien)', padding: 'var(--k3) var(--k4)', ...SANS }}
      >
        <div className="flex items-center" style={{ gap: 'var(--k3)' }}>
          <img src={bieuTuong(vai)} alt="" width={44} height={44} style={{ borderRadius: 'var(--bo-1)', flex: 'none' }} />
          <div className="flex-1 min-w-0">
            <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
              Mở bằng Chrome để cài app
            </div>
            <div style={{ fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
              {trongApp ? (
                <>
                  Đang mở trong Zalo nên không cài được. Bấm <b>⋮</b> góc trên bên phải, chọn <b>Mở bằng trình duyệt</b>.
                </>
              ) : laCocCoc() ? (
                <>Cốc Cốc không cài được app ra màn hình chính. Sao chép link rồi mở bằng Chrome.</>
              ) : (
                <>Trình duyệt này không cài được app ra màn hình chính. Sao chép link rồi mở bằng Chrome.</>
              )}
            </div>
          </div>
          <button type="button" onClick={deSau} className="tap-target shrink-0" style={{ fontSize: 'var(--cx-1)', color: 'var(--nhat)', padding: '0 var(--k2)' }}>
            Để sau
          </button>
        </div>

        <div className="flex items-center" style={{ gap: 'var(--k3)', marginTop: 'var(--k3)' }}>
          <ViTriNutBaCham />
          <div className="flex flex-wrap items-center" style={{ gap: 'var(--k2)' }}>
            <button
              type="button"
              onClick={chepLink}
              className="tap-target font-bold"
              style={{ fontSize: 'var(--cx-1)', color: 'var(--muc-nguoc)', background: 'var(--muc)', borderRadius: 'var(--bo-1)', padding: '0 var(--k4)', minHeight: 40 }}
            >
              Sao chép link
            </button>
            {linkChrome && (
              <a
                href={linkChrome}
                className="tap-target font-bold inline-flex items-center"
                style={{ fontSize: 'var(--cx-1)', color: 'var(--muc)', border: '1px solid var(--vien)', borderRadius: 'var(--bo-1)', padding: '0 var(--k4)', minHeight: 40 }}
              >
                Thử mở trong Chrome
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        role="note"
        className="flex items-center"
        style={{
          gap: 'var(--k3)',
          background: 'var(--the)',
          borderBottom: '1px solid var(--vien)',
          padding: 'var(--k3) var(--k4)',
          ...SANS,
        }}
      >
        <img src={bieuTuong(vai)} alt="" width={44} height={44} style={{ borderRadius: 'var(--bo-1)', flex: 'none' }} />
        <div className="flex-1 min-w-0">
          <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
            {lechManifest ? 'Máy còn giữ bản cũ' : `Cài ${tenSeCai || tenApp} ra màn hình`}
          </div>
          <div style={{ fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
            {lechManifest
              ? `Bấm Cài đặt lúc này sẽ ra app "${tenSeCai}". Tải lại một lần rồi cài.`
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
            onClick={lechManifest ? () => location.reload() : cai}
            className="tap-target font-bold"
            style={{ fontSize: 'var(--cx-1)', color: 'var(--muc-nguoc)', background: 'var(--muc)', borderRadius: 'var(--bo-1)', padding: '0 var(--k4)', minHeight: 40 }}
          >
            {lechManifest ? 'Tải lại' : 'Cài đặt'}
          </button>
        </div>
      </div>

      {moHuongDan && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'var(--phu)' }} onClick={() => setMoHuongDan(false)}>
          <div
            className="w-full"
            style={{ maxWidth: 480, background: 'var(--the)', borderTopLeftRadius: 'var(--bo-3)', borderTopRightRadius: 'var(--bo-3)', padding: 'var(--k5)', ...SANS }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between" style={{ gap: 'var(--k3)', marginBottom: 'var(--k4)' }}>
              <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)', color: 'var(--muc)' }}>
                Cài ra màn hình chính
              </div>
              <button onClick={() => setMoHuongDan(false)} className="tap-target shrink-0" style={{ color: 'var(--nhat)' }} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>

            {laIOS() ? (
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
              Cài xong, mở app từ biểu tượng là vào thẳng, không cần link. Bấm "Để sau" thì {NGAY_IM_LANG} ngày nữa mới nhắc lại.
            </div>
          </div>
        </div>
      )}
    </>
  )
}

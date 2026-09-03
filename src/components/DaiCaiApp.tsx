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
import { caiMotCham, coTheCaiMotCham, daBoQuaNhacCai, dangTrongTrinhDuyet, ghiNhoBoQuaNhacCai, laIOS, tenAppCuaVai, tenAppSeCai, theoDoiSuKienCai, NGAY_IM_LANG } from '../lib/pwa-install'

const SANS: React.CSSProperties = { fontFamily: 'var(--sans)' }

/** Icon vai — dùng chính file biểu tượng sẽ hiện trên màn hình chính, để em
 * thấy trước đúng cái sắp cài. */
function bieuTuong(vai: 'hs' | 'ph'): string {
  return `${import.meta.env.BASE_URL}${vai === 'ph' ? 'icon-ph-192.png' : 'icon-hs-192.png'}`
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
  const [hien, setHien] = useState(() => dangTrongTrinhDuyet() && !daBoQuaNhacCai())
  const [moHuongDan, setMoHuongDan] = useState(false)
  // Nút "Cài đặt" luôn hiện: có beforeinstallprompt thì cài 1 chạm, không có
  // (Safari) thì mở hướng dẫn tay. Vẫn nghe sự kiện để cập nhật khả năng cài.
  const [, setCoNutCai] = useState(coTheCaiMotCham())
  useEffect(() => theoDoiSuKienCai(() => setCoNutCai(coTheCaiMotCham())), [])

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

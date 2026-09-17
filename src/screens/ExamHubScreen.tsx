import {useState} from 'react'
import {RefreshCw} from 'lucide-react'
import {daySangBanMoi,type DangKySW} from '../lib/cap-nhat-app'
import BangTinGiaoVien from '../components/BangTinGiaoVien'

function NutCapNhat() {
  const [dang, setDang] = useState(false)

  const capNhat = async () => {
    setDang(true)
    try {
      const dk = await navigator.serviceWorker?.getRegistration()
      if (dk) {
        await dk.update().catch(() => {})
        daySangBanMoi(dk as unknown as DangKySW)
        await new Promise((r) => setTimeout(r, 400))
      }

      // BA BƯỚC TRÊN VẪN CÓ THỂ KHÔNG ĂN — thầy bắt được 14/09: máy vẫn hiện
      // "Bản 2cf33fe · 23:31" trong khi máy chủ đã phục vụ bản mới từ 01:06.
      //
      // Vì sao: `update()` chỉ tải lại `sw.js`; nếu chính tệp ấy còn nằm trong
      // bộ đệm HTTP thì trình duyệt so ra "y hệt" và KHÔNG sinh bản chờ nào,
      // nên `daySangBanMoi` không có ai để đẩy. Còn `index.html` thì workbox
      // giữ trong precache, tải lại bao nhiêu lần cũng ra bản cũ.
      //
      // Nên bước cuối phải DỌN SẠCH: xoá mọi bộ đệm rồi huỷ đăng ký hẳn service
      // worker. Lần tải ngay sau đó buộc phải đi ra mạng, và bản mới tự đăng ký
      // lại service worker của nó.
      //
      // Đánh đổi: mất bản offline đúng một lần tải. Nút này chỉ nằm ở màn quản
      // lý của Thầy, không phải màn em đang làm bài, nên không ai mất đề.
      if (typeof caches !== 'undefined') {
        const ten = await caches.keys().catch(() => [] as string[])
        await Promise.all(ten.map((t) => caches.delete(t).catch(() => false)))
      }
      const moiDk = await navigator.serviceWorker?.getRegistrations().catch(() => [])
      for (const d of moiDk ?? []) await d.unregister().catch(() => false)
    } finally {
      // Kèm tem thời gian để qua nốt bộ đệm HTTP của chính trang.
      const u = new URL(location.href)
      u.searchParams.set('_moi', String(Date.now()))
      location.replace(u.toString())
    }
  }

  return (
    <button
      type="button"
      onClick={() => void capNhat()}
      disabled={dang}
      className="tap-target inline-flex items-center font-bold shadow-xs hover:shadow-sm"
      style={{
        gap: 6,
        minHeight: 30,
        padding: '0 var(--k3)',
        borderRadius: 'var(--bo-tron)',
        border: '1px solid var(--gg-xanh)',
        background: 'var(--gg-xanh-nen)',
        color: 'var(--gg-xanh)',
        fontFamily: 'var(--sans)',
        fontSize: 11,
      }}
    >
      <RefreshCw size={13} className={dang ? 'animate-spin' : undefined} />
      {dang ? 'Đang lấy…' : 'Lấy bản mới'}
    </button>
  )
}

export default function ExamHubScreen(){
 return <div className="gv-page min-h-screen pb-24 px-4 pt-4 flex flex-col" style={{background:'var(--nen)',color:'var(--muc)',gap:'var(--k4)'}}>
  <BangTinGiaoVien/>
  <div style={{marginTop:'auto',paddingTop:32,display:'flex',justifyContent:'flex-end'}}><NutCapNhat/></div>
 </div>
}

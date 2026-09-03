// MÀN CỬA VÀO — mở đường gốc `/` thì luôn hiện màn này, ba vai trò rõ ràng.
//
// Vì sao cần: trước đây mở đường gốc là rơi thẳng vào app quản lý của thầy.
// Trên máy thầy thì đúng, nhưng em hay phụ huynh mở nhầm đường gốc (gõ tay,
// bookmark, trình duyệt khôi phục tab) sẽ thấy nguyên bộ menu quản lý —
// vừa khó hiểu vừa không phải chỗ của họ.
//
// Màn này KHÔNG cấp quyền gì. Bấm "Giáo viên" chỉ mở giao diện; mọi lệnh vẫn
// đòi mã bí mật ở Apps Script. Bấm "Học sinh"/"Phụ huynh" mở đúng app của vai,
// còn đọc được dữ liệu hay không thì tuỳ token đã có trong máy chưa.
import { GraduationCap, HeartHandshake, ClipboardList } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAppStore } from '../store/appStore'
import type { VaiTro } from '../lib/vai-tro'
import { datManifestTheoVai } from '../lib/pwa-install'
import { manDauCua } from '../lib/vai-tro'
import { PHIEN_BAN_APP } from '../lib/cap-nhat-app'

function Khoi({
  icon,
  title,
  sub,
  onClick,
  noiBat = false,
}: {
  icon: ReactNode
  title: string
  sub: string
  onClick: () => void
  noiBat?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap-target w-full text-left flex items-center"
      style={{
        gap: 'var(--k4)',
        background: noiBat ? 'var(--g1)' : 'var(--the)',
        color: noiBat ? 'var(--giay)' : 'var(--muc)',
        borderRadius: 'var(--bo-3)',
        boxShadow: 'var(--bong-1)',
        padding: 'var(--k5)',
        minHeight: 88,
      }}
    >
      <span
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--bo-2)',
          background: noiBat ? 'rgba(255,255,255,0.18)' : 'var(--the-2)',
          color: noiBat ? 'var(--giay)' : 'var(--tim)',
        }}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)' }}>
          {title}
        </span>
        <span
          className="block"
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 'var(--cx-1)',
            color: noiBat ? 'var(--giay)' : 'var(--nhat)',
            opacity: noiBat ? 0.9 : 1,
            marginTop: 2,
          }}
        >
          {sub}
        </span>
      </span>
    </button>
  )
}

export default function CuaVaoScreen() {
  const setVai = useAppStore((s) => s.setVai)
  const setScreen = useAppStore((s) => s.setScreen)

  const chon = (vai: VaiTro) => {
    setVai(vai)
    datManifestTheoVai(vai)
    setScreen(manDauCua(vai))
  }

  return (
    <div
      className="min-h-screen flex flex-col px-4 pt-6 pb-24"
      style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)' }}
    >
      <div style={{ marginBottom: 'var(--k2)' }}>
        <h1 className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-6)', letterSpacing: '0.02em' }}>
          ĐỖ ĐẠI HỌC
        </h1>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', marginTop: 2 }}>
          Chọn phần của mình để vào
        </div>
      </div>

      <Khoi
        noiBat
        icon={<ClipboardList size={24} />}
        title="Giáo viên"
        sub="Mở ca kiểm tra, chấm bài, quản lý học sinh"
        onClick={() => chon('gv')}
      />
      <Khoi
        icon={<GraduationCap size={24} />}
        title="Học sinh"
        sub="Vào thi, xem lại bài, làm bài tập về nhà"
        onClick={() => chon('hs')}
      />
      <Khoi
        icon={<HeartHandshake size={24} />}
        title="Phụ huynh"
        sub="Xem kết quả của con và nhắn tin cho Thầy"
        onClick={() => chon('ph')}
      />

      <div
        style={{
          fontFamily: 'var(--sans)',
          fontSize: 'var(--cx-1)',
          color: 'var(--nhat)',
          marginTop: 'var(--k4)',
          lineHeight: 1.6,
        }}
      >
        Học sinh và phụ huynh nên mở bằng <b>link riêng Thầy gửi</b> — vào thẳng phần của mình, không phải chọn lại.
      </div>

      <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', marginTop: 'auto' }}>
        Bản {PHIEN_BAN_APP}
      </div>
    </div>
  )
}

import { useEffect, useState, type ReactNode } from 'react'
import { ClipboardList, GraduationCap, Library, Smartphone } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { PHIEN_BAN_APP } from '../lib/cap-nhat-app'
import { OThongBao, NutChinh } from '../components/DesignSystem'
import { caiMotCham, coTheCaiMotCham, dangTrongTrinhDuyet, theoDoiSuKienCai } from '../lib/pwa-install'

// MANCUAVAOVANENTOI.md mục 2: thẻ KHÔNG viền màu, phân cấp bằng bóng --bong-1;
// CHỈ MỘT thẻ nổi bật — hành động chính (mở ca) — bằng nền gradient --g1;
// tiêu đề thẻ màu --muc. Màn này sẽ được thay bằng "màn cửa vào ba vai trò"
// (mục 3) — giữ tối giản, không thêm gì ngoài hệ thiết kế.
function TheBam({
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
      className="tap-target w-full text-left flex items-center gap-3"
      style={{
        background: noiBat ? 'var(--g1)' : 'var(--the)',
        color: noiBat ? 'var(--giay)' : 'var(--muc)',
        borderRadius: 'var(--bo-3)',
        boxShadow: 'var(--bong-1)',
        padding: 'var(--k4) var(--k5)',
        minHeight: 72,
      }}
    >
      <span
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--bo-1)',
          background: noiBat ? 'rgba(255,255,255,.2)' : 'var(--the-2)',
          color: noiBat ? 'var(--giay)' : 'var(--nhat)',
        }}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)' }}>
          {title}
        </div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: noiBat ? 'var(--giay)' : 'var(--nhat)', opacity: noiBat ? 0.9 : 1, marginTop: 2 }}>
          {sub}
        </div>
      </span>
    </button>
  )
}

/** THẺ CÀI APP — chỉ hiện khi đang mở trong TAB TRÌNH DUYỆT (cài rồi thì ẩn).
 *
 * Ba trường hợp, không gộp làm một:
 *   · Chrome/Edge Android, Chrome máy tính → cài 1 chạm bằng beforeinstallprompt
 *   · iPhone/iPad → Safari không có sự kiện đó, phải chỉ đúng thao tác Chia sẻ
 *   · Zalo, Facebook, Cốc Cốc… → KHÔNG cài được, phải nói thẳng để mở Chrome
 */
function TheCaiApp() {
  const [coTheCai, setCoTheCai] = useState(coTheCaiMotCham)
  const [choSuKien, setChoSuKien] = useState(true)

  useEffect(() => theoDoiSuKienCai(() => setCoTheCai(coTheCaiMotCham())), [])
  // Sự kiện cài của Chrome bắn trễ vài trăm mili giây sau khi nạp. Chờ đủ lâu
  // rồi mới dám kết luận "trình duyệt này không cài được".
  useEffect(() => {
    const t = setTimeout(() => setChoSuKien(false), 2500)
    return () => clearTimeout(t)
  }, [])

  if (!dangTrongTrinhDuyet()) return null

  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const noiDung = coTheCai ? (
    <NutChinh onClick={() => void caiMotCham()}>Cài app lên màn hình chính</NutChinh>
  ) : iOS ? (
    <OThongBao tone="xanh">
      Cài trên iPhone: bấm nút <b>Chia sẻ</b> ở thanh dưới Safari, kéo xuống chọn <b>Thêm vào MH chính</b>.
    </OThongBao>
  ) : choSuKien ? null : (
    <OThongBao tone="cam">
      Trình duyệt này không cài được app. Mở lại link bằng <b>Chrome</b> rồi vào đây cài.
    </OThongBao>
  )
  if (!noiDung) return null

  return (
    <div style={{ background: 'var(--the)', borderRadius: 'var(--bo-3)', boxShadow: 'var(--bong-1)', padding: 'var(--k4) var(--k5)', display: 'flex', flexDirection: 'column', gap: 'var(--k3)' }}>
      <div className="flex items-center" style={{ gap: 'var(--k3)' }}>
        <Smartphone size={20} style={{ color: 'var(--nhat)' }} />
        <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)' }}>
          App trên màn hình chính
        </div>
      </div>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
        Cài rồi thì mở thẳng, không cần gõ link, và chạy được cả khi mất mạng.
      </div>
      {noiDung}
    </div>
  )
}

export default function ExamHubScreen() {
  const setScreen = useAppStore((s) => s.setScreen)

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)' }}>
      <h1 className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-5)' }}>
        Kiểm tra tại lớp
      </h1>

      <TheBam
        noiBat
        icon={<GraduationCap size={22} />}
        title="Chọn đề & mở ca kiểm tra"
        sub="Chọn đề trong ngân hàng, đặt lớp và thời gian, phát mã ca"
        onClick={() => setScreen('examsetup')}
      />
      <TheBam icon={<Library size={22} />} title="Ngân hàng câu hỏi" sub="Đề tự về từ kho · duyệt câu nghi đáp án" onClick={() => setScreen('nganhangde')} />
      <TheBam icon={<ClipboardList size={22} />} title="Ca thi" sub="Mọi ca đã mở, ai đã nộp, điểm, cho thi lại, xuất bảng điểm · tích chọn xoá nhiều ca" onClick={() => setScreen('lichsuca')} />
      {/* Giao bài tập vẫn nằm trong hồ sơ từng em — vào bằng tab HỌC SINH ở
          thanh dưới, chạm một em. Bỏ thẻ lối tắt ở đây theo yêu cầu của thầy;
          tính năng KHÔNG bị gỡ.
          Quản lý đăng ký đã gỡ hẳn: màn đăng ký nằm trong app học sinh và app
          phụ huynh, mà hai app đó đã tách khỏi repo này — hàng chờ duyệt sẽ
          luôn rỗng. Em nay tự vào danh sách khi thi. */}

      <TheCaiApp />

      {/* Dấu phiên bản: sửa lỗi xong, mở app thấy mã commit mới nghĩa là máy đã
          nhận bản mới; còn mã cũ nghĩa là máy còn giữ bản cũ. Căn TRÁI để không
          bị icon tin nhắn (kéo thả được, hay nằm giữa dưới) đè lên. */}
      <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', marginTop: 'var(--k2)' }}>
        Bản {PHIEN_BAN_APP}
      </div>
    </div>
  )
}

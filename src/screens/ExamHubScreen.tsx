import type { ReactNode } from 'react'
import { ClipboardList, GraduationCap, Users2, Users, Library } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { PHIEN_BAN_APP } from '../lib/cap-nhat-app'

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
      <TheBam icon={<ClipboardList size={22} />} title="Lịch sử ca thi & chấm bài" sub="Mọi ca đã mở, ai đã nộp, điểm, cho thi lại, xuất bảng điểm" onClick={() => setScreen('lichsuca')} />
      <TheBam icon={<Users size={22} />} title="Quản lý đăng ký" sub="Phụ huynh & học sinh đã đăng ký, gửi tin cho 1 em" onClick={() => setScreen('registrationmanager')} />
      <TheBam icon={<Users2 size={22} />} title="Học sinh — Vào thi" sub="Nhập mã ca thầy cho + số báo danh" onClick={() => setScreen('examtake')} />
      <TheBam icon={<GraduationCap size={22} />} title="Học sinh — Hồ sơ & nhắn tin thầy" sub="Đăng ký 1 lần, tự điền SBD lúc vào thi" onClick={() => setScreen('studentprofile')} />

      {/* Dấu phiên bản: sửa lỗi xong, mở app thấy mã commit mới nghĩa là máy đã
          nhận bản mới; còn mã cũ nghĩa là máy còn giữ bản cũ. Căn TRÁI để không
          bị icon tin nhắn (kéo thả được, hay nằm giữa dưới) đè lên. */}
      <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', marginTop: 'var(--k2)' }}>
        Bản {PHIEN_BAN_APP}
      </div>
    </div>
  )
}

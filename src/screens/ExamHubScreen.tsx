import { useEffect, useState, type ReactNode } from 'react'
import { ChevronRight, ClipboardList, GraduationCap, Library, Smartphone, Presentation, RefreshCw } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { daySangBanMoi, PHIEN_BAN_APP, type DangKySW } from '../lib/cap-nhat-app'
import { OThongBao, NutChinh } from '../components/DesignSystem'
import { caiMotCham, coTheCaiMotCham, dangTrongTrinhDuyet, theoDoiSuKienCai } from '../lib/pwa-install'

// MANCUAVAOVANENTOI.md mục 2: thẻ KHÔNG viền màu, phân cấp bằng bóng --bong-1;
// CHỈ MỘT thẻ nổi bật — hành động chính (mở ca) — bằng nền gradient --g1;
// tiêu đề thẻ màu --muc. Màn này sẽ được thay bằng "màn cửa vào ba vai trò"
// (mục 3) — giữ tối giản, không thêm gì ngoài hệ thiết kế.
function TheChinh({ icon, nhan, title, sub, onClick }: { icon: ReactNode; nhan: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="the-bam the-bam-chinh tap-target w-full text-left flex items-center">
      <span className="the-bam-icon shrink-0 flex items-center justify-center">{icon}</span>
      <span className="min-w-0" style={{ flex: '1 1 auto' }}>
        <span className="the-bam-nhan">{nhan}</span>
        <span className="the-bam-ten font-bold">{title}</span>
        <span className="the-bam-phu">{sub}</span>
      </span>
      <ChevronRight size={20} className="the-bam-mui shrink-0" />
    </button>
  )
}

/** Ô vuông trong lưới ba việc còn lại. Chữ phụ MỘT DÒNG ngắn: thẻ nào cũng ba
 * dòng mô tả thì thầy phải đọc hết mới biết bấm cái nào. */
function OBam({ icon, title, sub, onClick }: { icon: ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="hub-o tap-target">
      <span className="hub-o-icon shrink-0">{icon}</span>
      <span className="hub-o-ten font-bold">{title}</span>
      <span className="hub-o-phu">{sub}</span>
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

/** ÉP LẤY BẢN MỚI NGAY.
 *
 * ĐÃ MẤT NỬA NGÀY 04-09 vì chuyện này: tôi sửa lỗi, đẩy lên, CI xanh, nhưng
 * app trên máy thầy vẫn chạy mã bản cũ trong bộ nhớ nên thầy thử lại thấy y
 * lỗi cũ và tưởng tôi chưa làm. Nay app đã tự tải lại khi bản mới chiếm quyền,
 * nhưng vẫn cần một nút bấm tay: máy còn giữ service worker ĐỜI CŨ (bản không
 * có phần tự tải lại) thì chỉ nút này cứu được.
 *
 * Ba bước, không bỏ bước nào: hỏi máy chủ có bản mới không → đẩy bản đang nằm
 * chờ vào chạy → tải lại trang. Thiếu bước cuối là vẫn chạy mã cũ. */
function NutCapNhat() {
  const [dang, setDang] = useState(false)

  const capNhat = async () => {
    setDang(true)
    try {
      const dk = await navigator.serviceWorker?.getRegistration()
      if (dk) {
        await dk.update().catch(() => {})
        daySangBanMoi(dk as unknown as DangKySW)
        // Chờ một nhịp cho bản mới kịp chiếm quyền rồi mới tải lại.
        await new Promise((r) => setTimeout(r, 600))
      }
    } finally {
      location.reload()
    }
  }

  return (
    <button
      type="button"
      onClick={() => void capNhat()}
      disabled={dang}
      className="tap-target inline-flex items-center font-bold"
      style={{
        gap: 6,
        minHeight: 32,
        padding: '0 var(--k3)',
        borderRadius: 'var(--bo-tron)',
        border: '1px solid var(--vien)',
        background: 'transparent',
        color: 'var(--nhat)',
        fontFamily: 'var(--sans)',
        fontSize: 'var(--cx-1)',
      }}
    >
      <RefreshCw size={13} className={dang ? 'animate-spin' : undefined} />
      {dang ? 'Đang lấy…' : 'Lấy bản mới'}
    </button>
  )
}

export default function ExamHubScreen() {
  const setScreen = useAppStore((s) => s.setScreen)

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 flex flex-col" style={{ background: 'var(--nen)', color: 'var(--muc)', gap: 'var(--k4)' }}>
      <header style={{ paddingTop: 'var(--k2)' }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--mo)', letterSpacing: '.16em', textTransform: 'uppercase' }}>Đỗ Đại Học</div>
        <h1 className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-5)', lineHeight: 1.15, marginTop: 2 }}>
          Kiểm tra tại lớp
        </h1>
      </header>

      <TheChinh
        icon={<GraduationCap size={24} />}
        nhan="Bắt đầu ở đây"
        title="Mở ca kiểm tra"
        sub="Chọn đề, đặt lớp và thời gian, phát mã ca"
        onClick={() => setScreen('examsetup')}
      />

      <div className="hub-luoi">
        <OBam icon={<ClipboardList size={20} />} title="Ca thi" sub="Ai đã nộp, điểm, cho thi lại, xuất bảng điểm" onClick={() => setScreen('lichsuca')} />
        <OBam icon={<Library size={20} />} title="Ngân hàng câu hỏi" sub="Đề về từ kho · duyệt câu nghi đáp án" onClick={() => setScreen('nganhangde')} />
        <OBam icon={<Presentation size={20} />} title="Gọi lên bảng" sub="Máy chọn câu đúng chỗ em yếu nhất" onClick={() => setScreen('goilenbang')} />
      </div>
      {/* ĐỢT 0 của BAOMATCATHI.md: trang đo, KHÔNG khoá ai. Thầy chụp thử trên
          máy thật để chấm điểm từng kênh; kênh nào đạt chuẩn mới được bật khoá. */}
      {/* Giao bài tập vẫn nằm trong hồ sơ từng em — vào bằng tab HỌC SINH ở
          thanh dưới, chạm một em. Bỏ thẻ lối tắt ở đây theo yêu cầu của thầy;
          tính năng KHÔNG bị gỡ.
          Quản lý đăng ký đã gỡ hẳn: màn đăng ký nằm trong app học sinh và app
          phụ huynh, mà hai app đó đã tách khỏi repo này — hàng chờ duyệt sẽ
          luôn rỗng. Em nay tự vào danh sách khi thi. */}

      <TheCaiApp />

      {/* Dấu phiên bản: sửa lỗi xong, mở app thấy mã commit mới nghĩa là máy đã
          nhận bản mới; còn mã cũ nghĩa là máy còn giữ bản cũ. Căn TRÁI để không
          bị icon tin nhắn (kéo thả được, hay nằm giữa dưới) đè lên.
          Kèm nút ép cập nhật — xem NutCapNhat bên dưới. */}
      <div className="flex items-center flex-wrap" style={{ gap: 'var(--k3)', marginTop: 'var(--k2)' }}>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>Bản {PHIEN_BAN_APP}</span>
        <NutCapNhat />
      </div>
    </div>
  )
}

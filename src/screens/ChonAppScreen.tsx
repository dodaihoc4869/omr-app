// MÀN CHỌN APP — chỉ hiện khi mở `/` TRẦN.
//
// Thầy chốt 14/09: "Link của 3 app bạn hãy bọc hay làm gì đó để đảm bảo 100%
// không nhảy lẫn lộn."
//
// Trước đây `/` trần ĐOÁN vai bằng `localStorage['ddh.vaiDaDung']`. Ba app
// chung một gốc nên chung một localStorage; máy mở cả ba thì khoá ấy là của
// app mở sau cùng. Còn đoán là còn xác suất sai — mà thầy đòi 100%.
//
// Nên `/` trần nay HỎI. Một chạm, và sau chạm ấy địa chỉ mang đúng đường của
// app (`/gv`, `/hs`, `/ph`), nên mọi lượt tải lại sau đó không còn chỗ nào để
// lẫn nữa.
//
// Đường thường ngày KHÔNG đi qua đây: link thầy gửi là đường dẫn, biểu tượng
// trên màn hình chính cũng mở đường dẫn. Màn này là lưới hứng cho người gõ tay
// tên miền hoặc bấm link đã bị cắt mất phần sau dấu `?`.
import { GraduationCap, Users, BookOpenCheck } from 'lucide-react'
import { DUONG_APP, type VaiApp } from '../lib/khoa-vai'
import { vaiDaDung } from '../lib/vai-tro'

const THE: { vai: VaiApp; ten: string; phu: string; Icon: typeof GraduationCap }[] = [
  { vai: 'hs', ten: 'Học sinh', phu: 'Vào thi, xem điểm, nộp bài tập về nhà', Icon: GraduationCap },
  { vai: 'ph', ten: 'Phụ huynh', phu: 'Xem kết quả học tập của con', Icon: Users },
  { vai: 'gv', ten: 'Thầy', phu: 'Mở ca, chấm bài, quản lý lớp', Icon: BookOpenCheck },
]

export default function ChonAppScreen() {
  // App quen tay lên đầu cho đỡ phải tìm. ĐÂY LÀ TOÀN BỘ quyền của `vaiDaDung`
  // từ nay: xếp thứ tự, KHÔNG quyết định thay người dùng.
  const quen = vaiDaDung()
  const ds = quen ? [...THE].sort((a, b) => (a.vai === quen ? -1 : b.vai === quen ? 1 : 0)) : THE

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ minHeight: '100dvh', padding: 'var(--k5, 24px)', background: 'var(--nen)', gap: 'var(--k4, 16px)' }}
    >
      <div style={{ textAlign: 'center', marginBottom: 'var(--k3, 12px)' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-5)', fontWeight: 800, color: 'var(--muc)' }}>
          ĐỖ ĐẠI HỌC
        </div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--nhat)', marginTop: 4 }}>
          Chọn đúng app của mình
        </div>
      </div>

      <div className="flex flex-col w-full" style={{ gap: 'var(--k3, 12px)', maxWidth: 420 }}>
        {ds.map(({ vai, ten, phu, Icon }) => (
          <a
            key={vai}
            href={DUONG_APP[vai]}
            data-chon-app={vai}
            className="tap-target flex items-center"
            style={{
              gap: 'var(--k3, 12px)',
              minHeight: 72,
              padding: '0 var(--k4, 16px)',
              borderRadius: 'var(--bo-2)',
              background: 'var(--the)',
              border: '1.5px solid var(--vien)',
              textDecoration: 'none',
              color: 'var(--muc)',
            }}
          >
            <span
              className="flex items-center justify-center"
              style={{ flex: 'none', width: 44, height: 44, borderRadius: 'var(--bo-1)', background: 'var(--the-2)' }}
            >
              <Icon size={22} />
            </span>
            <span className="flex flex-col" style={{ minWidth: 0 }}>
              <span style={{ fontFamily: 'var(--sans)', fontWeight: 800, fontSize: 'var(--cx-3)' }}>{ten}</span>
              <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>{phu}</span>
            </span>
          </a>
        ))}
      </div>

      <div
        style={{
          fontFamily: 'var(--sans)',
          fontSize: 'var(--cx-1)',
          color: 'var(--nhat)',
          textAlign: 'center',
          maxWidth: 420,
          marginTop: 'var(--k3, 12px)',
        }}
      >
        Chạm một lần rồi lưu lại link trên thanh địa chỉ, lần sau vào thẳng không phải chọn nữa.
      </div>
    </div>
  )
}

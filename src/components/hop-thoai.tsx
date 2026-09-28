// HỘP THOẠI CỦA APP — thay confirm() / alert() / prompt() của trình duyệt ở CẢ BA APP (thầy 28/09: "sửa lại những popup này cho
// phù hợp và đồng điệu với giao diện của app"). Một khung duy nhất: `HopXacNhan` (lớp `hxn-*`), gọi kiểu promise:
//   const ok = await hoiXacNhan({ tieuDe: 'Huỷ chiến dịch?', noiDung: '…', nhanDongY: 'Huỷ chiến dịch', nhanKhong: 'Giữ lại', nguyHiem: true })
//   await baoTin({ tieuDe: 'Chưa lưu được', noiDung: '…' })
//   const ten = await hoiNhap({ tieuDe: 'Đổi tên', nhan: 'Tên mới', macDinh: 'cũ' })   // null = không nhập
// Hộp mở qua cổng ra document.body, nên phải bọc lại trong VỎ MÀU đúng app (`display: contents` — chỉ mang token, không thêm hộp
// bố cục): app thầy `.m3.vo-thay` (bản màu gv-mau.css), app học sinh / phụ huynh / màn thi `.m3` (m3-theme.css). Sáng/tối theo
// token của vỏ đó. Esc / bấm nền = không đồng ý; tiêu điểm vào nút an toàn; đóng xong trả tiêu điểm về chỗ cũ.
// NGOẠI LỆ duy nhất còn hộp của trình duyệt: `beforeunload` (trình duyệt bắt buộc hộp mặc định, trang không vẽ được hộp riêng).
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import HopXacNhan from './HopXacNhan'

export type VoHopThoai = 'thay' | 'm3'

type Chung = {
  tieuDe: string
  noiDung?: ReactNode
  /** Ép vỏ màu; bỏ trống = tự nhận theo chỗ đang có tiêu điểm / đường dẫn. */
  vo?: VoHopThoai
}

/** Vỏ màu của app đang đứng: tiêu điểm (nút vừa bấm) nằm trong vỏ thầy ⇒ thầy; trong `.m3` ⇒ m3; không rõ thì theo đường dẫn. */
export function nhanVo(): VoHopThoai {
  const a = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null
  if (a?.closest?.('.vo-thay')) return 'thay'
  if (a?.closest?.('.m3')) return 'm3'
  const p = typeof location !== 'undefined' ? location.pathname : '/'
  if (/^\/(hs|ph)(\/|$)/.test(p)) return 'm3'
  if (typeof document !== 'undefined' && document.querySelector('.vo-thay')) return 'thay'
  return 'm3'
}

function moHop<T>(vo: VoHopThoai | undefined, ve: (xong: (v: T) => void) => ReactNode): Promise<T> {
  return new Promise<T>((giai) => {
    const vung = document.createElement('div')
    vung.className = (vo ?? nhanVo()) === 'thay' ? 'm3 vo-thay' : 'm3'
    vung.style.display = 'contents'
    vung.setAttribute('data-vo-cong', 'hop-thoai')
    document.body.appendChild(vung)
    const goc = createRoot(vung)
    let daXong = false
    const xong = (v: T) => {
      if (daXong) return
      daXong = true
      // Gỡ hộp trước (HopXacNhan trả tiêu điểm khi gỡ) rồi mới báo kết quả cho chỗ gọi.
      goc.unmount()
      vung.remove()
      giai(v)
    }
    goc.render(ve(xong))
  })
}

/** Hỏi CÓ/KHÔNG. `nhanDongY` phải nói đúng việc ("Huỷ chiến dịch"), `nhanKhong` mặc định "Giữ lại" khi nguy hiểm, "Huỷ" khi thường. */
export function hoiXacNhan(o: Chung & { nhanDongY: string; nhanKhong?: string; nguyHiem?: boolean }): Promise<boolean> {
  return moHop<boolean>(o.vo, (xong) => (
    <HopXacNhan
      tieuDe={o.tieuDe}
      noiDung={o.noiDung}
      nhanXacNhan={o.nhanDongY}
      nhanHuy={o.nhanKhong ?? (o.nguyHiem ? 'Giữ lại' : 'Huỷ')}
      nguyHiem={o.nguyHiem}
      onXacNhan={() => xong(true)}
      onHuy={() => xong(false)}
    />
  ))
}

/** Báo tin một nút (thay alert). */
export function baoTin(o: Chung & { nhanDong?: string }): Promise<void> {
  return moHop<void>(o.vo, (xong) => (
    <HopXacNhan tieuDe={o.tieuDe} noiDung={o.noiDung} nhanXacNhan={o.nhanDong ?? 'Đã hiểu'} nhanHuy={null} onXacNhan={() => xong()} onHuy={() => xong()} />
  ))
}

/** Hỏi nhập một dòng chữ (thay prompt). Trả chữ đã gõ, hoặc null khi không nhập (Esc / nền / nút huỷ). */
export function hoiNhap(
  o: Chung & { nhan: string; macDinh?: string; goiY?: string; batBuoc?: boolean; nhanDongY?: string; nhanKhong?: string },
): Promise<string | null> {
  return moHop<string | null>(o.vo, (xong) => (
    <HopXacNhan
      tieuDe={o.tieuDe}
      noiDung={o.noiDung}
      nhap={{ nhan: o.nhan, macDinh: o.macDinh, goiY: o.goiY, batBuoc: o.batBuoc }}
      nhanXacNhan={o.nhanDongY ?? 'Lưu'}
      nhanHuy={o.nhanKhong ?? 'Huỷ'}
      onXacNhan={(g) => xong(g ?? '')}
      onHuy={() => xong(null)}
    />
  ))
}

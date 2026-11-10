// Gắn <html data-trong="hs"> TRƯỚC mọi mô-đun màn (như main.tsx): màn làm chặng + Bình Phản Ứng nạp tờ «Trong» ngay khi mô-đun chạy.
document.documentElement.dataset.trong = 'hs'
document.documentElement.setAttribute('data-ht2', '') // như app thật: Lộ trình (lớp .ht2) luôn nằm dưới màn chặng / Bình Phản Ứng
const ts = new URLSearchParams(location.search)
if (ts.get('yeu') === '1') document.documentElement.classList.add('may-yeu')
// `&chu=130`: cỡ chữ hệ thống 130 % (Android «Cỡ chữ» ⇒ Chrome nhân mọi cỡ chữ) — giả lập bằng text-size-adjust (có hiệu lực ở chế độ điện thoại).
if (ts.get('chu')) { const s = document.createElement('style'); s.textContent = `html { -webkit-text-size-adjust: ${ts.get('chu')}%; text-size-adjust: ${ts.get('chu')}%; }`; document.head.appendChild(s) }
// Thẻ «hình của đề vẽ lại» (`/hs/hinh-ve`) chỉ tải khi máy có token học sinh ⇒ đặt token GIẢ (máy chủ giả trong trang trả lời); xoá bộ nhớ cảnh cũ.
try { localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'tk-gia' })); localStorage.removeItem('ddh.hv.v1') } catch { /* chặn lưu */ }
export {}

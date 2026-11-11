// Gắn <html data-trong="hs"> TRƯỚC mọi mô-đun màn (như main.tsx) + token học sinh GIẢ (máy chủ giả của chup.mjs trả lời mọi lệnh).
const ts = new URLSearchParams(location.search)
document.documentElement.dataset.trong = ts.get('man') === 'gv' ? 'gv' : 'hs'
document.documentElement.setAttribute('data-ht2', '')
if (ts.get('yeu') === '1') document.documentElement.classList.add('may-yeu')
try { localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'tk-gia' })) } catch { /* chặn lưu */ }
export {}

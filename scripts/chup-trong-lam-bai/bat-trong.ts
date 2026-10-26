// Gắn <html data-trong="hs"> TRƯỚC mọi mô-đun màn (như main.tsx làm trước khi nạp gốc app): các màn nhóm 2 nạp tờ «Trong» ngay khi mô-đun chạy.
// `&trong=tat` ⇒ giao diện cũ để so.
if (new URLSearchParams(location.search).get('trong') !== 'tat') document.documentElement.dataset.trong = 'hs'
export {}

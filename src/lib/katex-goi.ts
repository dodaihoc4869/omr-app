// GÓI KaTeX NẠP LƯỜI (28/09) — KaTeX + mhchem + CSS công thức trong MỘT mảnh riêng.
//
// Trước đây `chem-format.tsx` nhập tĩnh KaTeX (≈ 270 KB thô) và `main.tsx` nhập
// `katex.min.css` ⇒ mọi máy tải cả bộ dựng công thức ngay lượt đầu, kể cả màn
// khoá của thầy và cổng phụ huynh chưa hiện công thức nào. Nay chỉ tệp này nhập
// chúng; `chem-format.tsx` gọi `import('./katex-goi')` khi cần (xem `napKatex`).
// Mảnh này VẪN nằm trong precache (không có trong globIgnores) ⇒ mất mạng vẫn
// hiện đúng công thức.
import katex from 'katex'
import 'katex/contrib/mhchem'
import 'katex/dist/katex.min.css'

export default katex
// Chuẩn hoá chuỗi trước KaTeX (chem-latex.ts) đi cùng mảnh này — chỉ cần khi có công thức.
export { chuanBiLatex, dungCongThuc } from './chem-latex'
// Đầu dòng + in đậm của chữ đề (thầy 01/11) — cùng mảnh lười này.
export { veDe } from './chem-tang-cuong'

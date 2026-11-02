// Trang XEM THỬ (không vào bản phát hành): vẽ khung Lời giải Kính bằng ĐÚNG component + CSS của app với 3 bản mẫu thầy duyệt — để chụp Chromium 6 khổ.
import { createRoot } from 'react-dom/client'
import '../../../src/index.css'
import '../../../src/styles/trong-hs.css'
import '../../../src/styles/trong-hs-mau.css'
import { useState } from 'react'
import '../../../src/styles/trong-lam-bai.css'
import LoiGiaiKinh from '../../../src/components/loi-giai-kinh/LoiGiaiKinh'
import LoiGiaiKinhHs from '../../../src/components/loi-giai-kinh/LoiGiaiKinhHs'
import mau from '../vi-du-kinh.json'
import type { BanKinh } from '../../../src/lib/loi-giai-kinh/kieu'
const ds = [
  { phan: 'I', dapAn: 'A', em: 'B', luaChon: ['C_nH_{2n}O_2 (n ≥ 2)', 'C_nH_{2n-2}O_2', 'C_nH_{2n+2}O_2', 'C_nH_{2n}O'], de: 'Ester no, đơn chức, mạch hở có công thức chung là' },
  { phan: 'II', dapAn: 'SDSD', em: 'DDDD', luaChon: ['Tăng nhiệt độ, cân bằng chuyển dịch theo chiều thuận.', 'Tăng áp suất, cân bằng chuyển dịch theo chiều thuận.', 'Thêm bột Fe làm xúc tác, cân bằng chuyển dịch theo chiều thuận.', 'Lấy bớt NH3 ra khỏi hệ, cân bằng chuyển dịch theo chiều thuận.'], de: 'Cho cân bằng N2(g) + 3H2(g) ⇌ 2NH3(g), ΔrH = −92 kJ. Mỗi ý sau đúng hay sai?' },
  { phan: 'III', dapAn: '13,2', em: '17,6', de: 'Đun nóng 12 gam acetic acid với 13,8 gam ethanol (xúc tác H2SO4 đặc), hiệu suất 75%. Khối lượng ethyl acetate thu được là bao nhiêu gam?' },
] as const
const i = Math.max(0, Math.min(2, Number(new URLSearchParams(location.search).get('cau') || '1') - 1))
const d = ds[i]!
const ban = { ...(mau as unknown[])[i] as object, qid: `mau-${i + 1}`, phienBan: 1, phan: d.phan } as unknown as BanKinh
document.body.style.background = 'var(--tr-nen)'
// ?hop=1: hộp «Lời giải» của màn làm bài (thanh tiêu đề + nút «Lời giải thu gọn» sát nút đóng); ?mo=1 bấm mở sẵn.
function Hop() {
  const [khe, setKhe] = useState<HTMLElement | null>(null)
  const cu = <section className="ht2-lam-loi-giai" aria-label="Lời giải"><p>n acid = 12/60 = 0,2 mol; n ethanol = 0,3 mol ⇒ acid hết.</p><p>m ester = 0,2 × 88 × 75% = <b>13,2 gam</b>.</p></section>
  return (
    <div className="duo-lg" role="dialog" aria-modal="true" aria-label="Lời giải">
      <div className="duo-lg-the">
        <header className="duo-lg-dau"><b>Lời giải · Câu 3</b><span className="duo-lg-khe" ref={setKhe} /><button type="button" className="duo-dong" aria-label="Đóng lời giải">✕</button></header>
        <LoiGiaiKinhHs kheNut={khe} qid="mau-3" phan="III" dapAn="13,2" em="17,6" duPhong={cu} />
      </div>
    </div>
  )
}
const hop = new URLSearchParams(location.search).get('hop') === '1'
createRoot(document.getElementById('goc')!).render(hop ? <Hop /> :
  <main style={{ maxWidth: 1240, margin: '0 auto', padding: '16px max(16px, env(safe-area-inset-left)) 32px' }}>
    <LoiGiaiKinh ban={ban} dapAn={d.dapAn} emTraLoi={d.em} luaChon={'luaChon' in d ? d.luaChon : undefined} de={d.de} />
  </main>,
)

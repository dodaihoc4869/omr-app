// Trang XEM THỬ (không vào bản phát hành): vẽ khung Lời giải Kính bằng ĐÚNG component + CSS của app với 3 bản mẫu thầy duyệt — để chụp Chromium 6 khổ.
import { createRoot } from 'react-dom/client'
import '../../../src/index.css'
import '../../../src/styles/trong-hs.css'
import '../../../src/styles/trong-hs-mau.css'
import { useEffect, useState } from 'react'
import '../../../src/styles/trong-lam-bai.css'
import '../../../src/styles/trong-chang-ngang.css'
import LoiGiaiKinh from '../../../src/components/loi-giai-kinh/LoiGiaiKinh'
import LoiGiaiKinhHs from '../../../src/components/loi-giai-kinh/LoiGiaiKinhHs'
import mau from '../vi-du-kinh.json'
import type { BanKinh } from '../../../src/lib/loi-giai-kinh/kieu'
const ds = [
  { phan: 'I', dapAn: 'A', em: 'B', luaChon: ['C_nH_{2n}O_2 (n ≥ 2)', 'C_nH_{2n-2}O_2', 'C_nH_{2n+2}O_2', 'C_nH_{2n}O'], de: 'Ester no, đơn chức, mạch hở có công thức chung là' },
  { phan: 'II', dapAn: 'SDSD', em: 'DDDD', luaChon: ['Tăng nhiệt độ, cân bằng chuyển dịch theo chiều thuận.', 'Tăng áp suất, cân bằng chuyển dịch theo chiều thuận.', 'Thêm bột Fe làm xúc tác, cân bằng chuyển dịch theo chiều thuận.', 'Lấy bớt NH3 ra khỏi hệ, cân bằng chuyển dịch theo chiều thuận.'], de: 'Cho cân bằng N2(g) + 3H2(g) ⇌ 2NH3(g), ΔrH = −92 kJ. Mỗi ý sau đúng hay sai?' },
  { phan: 'III', dapAn: '13,2', em: '17,6', de: 'Đun nóng 12 gam acetic acid với 13,8 gam ethanol (xúc tác H2SO4 đặc), hiệu suất 75%. Khối lượng ethyl acetate thu được là bao nhiêu gam?' },
] as const
const soCau = Number(new URLSearchParams(location.search).get('cau') || '1')
const i = soCau >= 7 ? 0 : soCau === 5 ? 1 : soCau === 6 ? 2 : Math.max(0, Math.min(2, soCau - 1))
// ?cau=4: câu GỌI TÊN (lysine) — xem cảnh danh-phap theo ba bước của thầy (03/11)
const DP = {
  cotLoi: { chu: 'Gọi tên theo công thức của thầy: **nhánh + mạch chính + liên kết + chức**. Amino acid: COOH là chức chính, C của COOH là số 1, NH₂ là nhánh **amino**.', chip: [{ nhan: 'Đánh số', chu: 'chức → π → nhánh' }, { nhan: 'Đơn chức', chu: 'bỏ e' }] },
  canh: { loai: 'danh-phap', soC: 6, chuc: { viTri: 1, ten: 'COOH' }, nhanh: [{ viTri: 2, ten: 'NH2' }, { viTri: 6, ten: 'NH2' }], pi: [],
    manh: [{ loai: 'nhanh', chu: '2,6-diamino', giai: 'Hai nhóm NH₂ ở carbon số 2 và số 6 là **nhánh amino**; có 2 nhánh nên thêm **di**.' }, { loai: 'mach', chu: 'hex', giai: 'Mạch chính 6 C ⇒ **hex**.' },
      { loai: 'lien-ket', chu: 'an', giai: 'Toàn liên kết đơn ⇒ **an**.' }, { loai: 'chuc', chu: 'oic acid', giai: 'Chức COOH đọc là **oic acid**; đơn chức nên bỏ e (hexane → hexan).' }], ten: '2,6-diaminohexanoic acid' },
}
// ?cau=5: cảnh ĐIỆN DI · ?cau=6: cảnh ĐỘ TAN (kết tinh CuSO4·5H2O) — bản vẽ chờ thầy duyệt 03/11
const DD = { canh: { loai: 'dien-di', pH: 6, chat: [
  { ten: 'Glu', pI: 3.2, nhom: [{ ten: 'NH_3^{+}', dien: 1 }, { ten: 'COO^{-}', dien: -1 }, { ten: 'COO^{-}', dien: -1 }] },
  { ten: 'Gly', pI: 6, nhom: [{ ten: 'NH_3^{+}', dien: 1 }, { ten: 'COO^{-}', dien: -1 }] },
  { ten: 'Lys', pI: 9.7, nhom: [{ ten: 'NH_3^{+}', dien: 1 }, { ten: 'NH_3^{+}', dien: 1 }, { ten: 'COO^{-}', dien: -1 }] }] } }
const DT = { canh: { loai: 'do-tan', chat: 'CuSO4', S: [{ t: 80, S: 55 }, { t: 20, S: 20.7 }], hang: [
  { nhan: 'Dung dịch bão hoà ở 80 °C', ct: 55, nuoc: 100, baoHoa: 80 },
  { nhan: 'Tách ra: 60,66 g CuSO4·5H2O', ct: 38.82, nuoc: 21.84, tachRa: true },
  { nhan: 'Còn lại: dung dịch bão hoà ở 20 °C', ct: 16.18, nuoc: 78.16, baoHoa: 20 }] } }
// ?cau=7: cảnh ĐỒNG PHÂN C4H8 (cấu tạo + hình học) · ?cau=8: ester C4H8O2 (bảng phần cố định) · ?cau=9: ancol C4H10O (OH chỉ C no) — thầy 08/11
const DPH7 = { dongPhan: { ctpt: 'C_4H_8', nguyenTu: { C: 4, H: 8 }, K: 1, tachK: 'K gốc = 1, không có O ⇒ **một nối đôi C=C** (alkene)', hoi: 'dong-phan',
  mach: [{ so: '4', khung: { chinh: 4, nhanh: [] }, dat: [{ loai: 'doi', nhan: 'C=C' }], soChat: 2 }, { so: '3+1', khung: { chinh: 3, nhanh: [{ o: 2, dai: 1 }] }, dat: [{ loai: 'doi', nhan: 'C=C' }], soChat: 1 }], tong: 4 } }
const DPH8 = { dongPhan: { ctpt: 'C_4H_8O_2', nguyenTu: { C: 4, H: 8, O: 2 }, K: 1, tachK: 'Hai O, K = 1 = K chức của COO ⇒ **ester no, đơn chức**', hoi: 'cau-tao',
  bang: { loai: 'este', tieuDe: 'Cố định COO, chia 3 C còn lại cho R và R′', cot: [], hang: [{ phan: [0, 3], soCach: [1, 2], tich: 2 }, { phan: [1, 2], soCach: [1, 1], tich: 1 }, { phan: [2, 1], soCach: [1, 1], tich: 1 }] }, tong: 4 } }
const DPH9 = { dongPhan: { ctpt: 'C_4H_10O', nguyenTu: { C: 4, H: 10, O: 1 }, K: 0, tachK: 'Một O, K = 0 ⇒ **alcohol** (hoặc ether) no', hoi: 'cau-tao',
  mach: [{ so: '4', khung: { chinh: 4, nhanh: [] }, dat: [{ loai: 'oh', nhan: 'OH' }], soChat: 2 }, { so: '3+1', khung: { chinh: 3, nhanh: [{ o: 2, dai: 1 }] }, dat: [{ loai: 'oh', nhan: 'OH' }], soChat: 2 }], tong: 4 } }
const d = soCau >= 7 ? ds[0] : soCau === 4 ? ds[0] : soCau === 5 ? ds[1] : soCau === 6 ? ds[2] : ds[i]!
const PT = { cotLoi: { congThuc: 'H_2N-CH_2-COOH + C_2H_5OH + HCl → ClH_3N-CH_2-COOC_2H_5 + H_2O', chu: 'COOH của glycine ester hoá với OH của ethyl alcohol, mất một H₂O; có HCl nên nhóm NH₂ **nhận H⁺**.', chip: [{ nhan: 'COOH + OH', chu: 'ester hoá, mất H₂O' }] } }
const ban = { ...(mau as unknown[])[i] as object, ...(soCau === 4 ? DP : soCau === 5 ? DD : soCau === 6 ? DT : soCau === 7 ? DPH7 : soCau === 8 ? DPH8 : soCau === 9 ? DPH9 : {}), ...(new URLSearchParams(location.search).get('pt') ? PT : {}), qid: `mau-${i + 1}`, phienBan: 1, phan: d.phan } as unknown as BanKinh
document.body.style.background = 'var(--tr-nen)'
// ?hop=1: hộp «Lời giải» của màn làm bài (thanh tiêu đề + nút «Lời giải thu gọn» sát nút đóng); ?mo=1 bấm mở sẵn.
export function Hop() {
  const [khe, setKhe] = useState<HTMLElement | null>(null)
  const cu = <section className="ht2-lam-loi-giai" aria-label="Lời giải"><p>n acid = 12/60 = 0,2 mol; n ethanol = 0,3 mol ⇒ acid hết.</p><p>m ester = 0,2 × 88 × 75% = <b>13,2 gam</b>.</p></section>
  const pt = new URLSearchParams(location.search).get('pt') === '1'
  return (
    <div className="ht-app ht2-lam duo" data-chang="" data-duo="">
    <div className="duo-lg" role="dialog" aria-modal="true" aria-label="Lời giải">
      <div className="duo-lg-the">
        <header className="duo-lg-dau"><b>Lời giải · Câu 3</b><span className="duo-lg-khe" ref={setKhe} /><button type="button" className="duo-dong" aria-label="Đóng lời giải">✕</button></header>
        <LoiGiaiKinhHs kheNut={khe} qid={pt ? 'mau-3-pt' : 'mau-3'} phan="III" dapAn="13,2" em="17,6" duPhong={cu} />
      </div>
    </div>
    </div>
  )
}
// ?chieu=N: TỜ CHIẾU thật (taoHtmlMayChieu) với bản Kính mẫu N — xem lời giải mới trên máy chiếu (thầy 03/11), bấm sẵn «Hiện lời giải».
export function Chieu() {
  const [html, setHtml] = useState('')
  useEffect(() => { void (async () => {
    const { taoHtmlMayChieu } = await import('../../../src/lib/html-may-chieu')
    const { xepTheoCauPhat } = await import('../../../src/lib/loi-giai-kinh/kiem')
    const n = Number(new URLSearchParams(location.search).get('chieu')) || 1
    const dd = ds[Math.min(2, n - 1)]!
    const tho = { ...(mau as unknown[])[Math.min(2, n - 1)] as object, ...(n === 4 ? DP : {}), qid: 'q', phienBan: 1, phan: dd.phan, _goc: null }
    const luaChon = 'luaChon' in dd ? [...dd.luaChon] : null
    const dapAn = dd.phan === 'I' ? 'A' : dd.dapAn
    const kinh = xepTheoCauPhat(tho, { phan: dd.phan, choices: dd.phan === 'I' ? luaChon ?? undefined : undefined, ideas: dd.phan === 'II' ? luaChon ?? undefined : undefined, correct: dapAn })!
    const cau = { id: 'X-I-1', phan: dd.phan, maDe: 'X', chuyenDe: '', dang: 'chua_ro', sao: 0, mucDo: '', text: dd.de, luaChon, dapAn, chot: '', lyDo: null, buoc: null, ketQua: '', kinh }
    setHtml(taoHtmlMayChieu([{ sbd: '', hoTen: 'Cả lớp', soCau: 1, cau } as never], { tenBuoi: 'Dạy học', ngay: new Date() }))
  })() }, [])
  return html ? <iframe title="Tờ chiếu" srcDoc={html} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0 }} /> : null
}
const chieu = new URLSearchParams(location.search).get('chieu')
const hop = new URLSearchParams(location.search).get('hop') === '1'
createRoot(document.getElementById('goc')!).render(chieu ? <Chieu /> : hop ? <Hop /> :
  <main style={{ maxWidth: 1240, margin: '0 auto', padding: '16px max(16px, env(safe-area-inset-left)) 32px' }}>
    <LoiGiaiKinh ban={ban} dapAn={d.dapAn} emTraLoi={d.em} luaChon={'luaChon' in d ? d.luaChon : undefined} de={d.de} />
  </main>,
)

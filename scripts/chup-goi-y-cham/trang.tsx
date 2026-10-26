// TRANG CHỤP «Chạm để hiểu đề» (26/10) — KHUNG GIẢ kiểu màn Duo (thanh trên + thẻ câu + phương án + hàng nút đáy có KIỂM TRA) vì màn Duo thật
// (nhánh claude/duo-app-2610 của Boss) chưa có trên main. Component THẬT của làn B + lõi THẬT của làn A (phatHien, theCho); chỉ bản sơ đồ là mẫu.
//   ?bai=este|pyrite|nguoc|hcl|loigiai   &toi=1 (chụp tối: trình duyệt giả lập prefers-color-scheme)
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '../../src/styles/trong.css'
import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { ChemText, napKatex } from '../../src/lib/chem-format'
import { VungChamDe } from '../../src/components/goi-y-cham/VungChamDe'
import KhoiLoiGiaiChuan from '../../src/components/loi-giai/KhoiLoiGiaiChuan'
import { thayBangSoDo } from '../../src/components/goi-y-cham/thay-bang-so-do'
import type { BanSoDo, GoiYTraVe } from '../../src/lib/goi-y-cham/kieu'

// ── bài mẫu (số khớp nhau)
const BAI: Record<string, { phan: string; de: string; pa?: string[]; ban: BanSoDo }> = {
  este: {
    phan: 'Phần I · Trắc nghiệm', pa: ['8,2.', '10,2.', '12,2.', '14,2.'],
    de: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng 100 mL dung dịch NaOH 1,5 M, đun nóng. Cô cạn dung dịch sau phản ứng, thu được m gam chất rắn khan. Giá trị của m là',
    ban: {
      qid: 'este', phienBan: 1,
      deNoiGi: 'Ester bị NaOH thuỷ phân khi đun nóng. Sau đó cô cạn: chất dễ bay hơi mất đi, phần rắn còn lại được cân.',
      chiaKhoa: 'Chất rắn khan = muối + NaOH còn dư (nếu có). Vì vậy phải so số mol hai chất trước phản ứng: chất nào hết, chất nào dư?',
      buoc: [
        { ten: 'n_{ester}', thuaSo: [{ so: '8,8', nghia: 'khối lượng ethyl acetate (gam)' }, { so: '1/88', nghia: 'đổi ra tiền = số mol (chia M = 88)' }] },
        { ten: 'n_{NaOH}', thuaSo: [{ so: '1,5', nghia: 'cứ 1 lít có 1,5 mol NaOH' }, { so: '100/1000', nghia: 'đổi 100 mL ra lít' }] },
      ],
      cauTuHoi: 'Tính xong, em so hai số rồi tự làm tiếp.',
    },
  },
  pyrite: {
    phan: 'Phần III · Trả lời ngắn',
    de: 'Đốt cháy 1 tấn quặng pyrite chứa 8% FeS2 về khối lượng (tạp chất không chứa sulfur) để sản xuất SO2, hiệu suất quá trình đạt 90%. Khối lượng SO2 thu được là m kg. Giá trị của m là',
    ban: {
      qid: 'pyrite', phienBan: 1,
      deNoiGi: 'Số mol là tiền. Đổi quặng ra tiền nhà FeS2, chuyển sang nhà SO2 theo dấu nguyên tố S, rồi dùng tiền mua khối lượng SO2. Chuyển tiền có hiệu suất là bị đánh thuế.',
      soDo: { nut: [{ tong: '1 tấn quặng', chat: 'FeS_2', soLieu: ['8%'] }, { chat: 'SO_2', soLieu: ['m kg = ?'] }], muiTen: [{ H: 90 }], chieu: 'xuoi' },
      buoc: [{ ten: 'm', donVi: 'kg', ketQua: '76,8', thuaSo: [
        { so: '10^6', nghia: '1 tấn quặng = 10^6 gam' },
        { so: '8/100', nghia: 'gam FeS2 (quặng chứa 8%)' },
        { so: '1/120', nghia: 'đổi ra tiền nhà FeS2 = số mol (chia M = 120)' },
        { so: '2', nghia: 'tiền nhà SO2: hệ số 2 so với 1 ⇒ nhà SO2 giàu gấp 2 (bảo toàn S)', denDay: 'Tới đây là tiền (số mol) nhà SO2.' },
        { so: '64', nghia: 'dùng tiền mua gam SO2 (nhân M = 64)' },
        { so: '90/100', nghia: 'chuyển tiền bị đánh thuế: tính xuôi chỉ còn 90% (× H/100)' },
        { so: '1/1000', nghia: 'kg SO2 (đề hỏi theo kg)' },
      ] }],
      ketQua: '76,8',
    },
  },
  nguoc: {
    phan: 'Phần III · Trả lời ngắn',
    de: 'Để sản xuất 1 tấn dung dịch H2SO4 98% từ quặng pyrite chứa 60% FeS2, hiệu suất cả quá trình là 80%. Khối lượng quặng pyrite cần dùng là m tấn. Giá trị của m là',
    ban: {
      qid: 'nguoc', phienBan: 1,
      deNoiGi: 'Đề cho sản phẩm (H2SO4), hỏi nguyên liệu (quặng) ⇒ tính ngược. Đổi H2SO4 ra tiền, chuyển về nhà FeS2 theo dấu nguyên tố S, mua khối lượng quặng, rồi bù thuế hiệu suất.',
      soDo: { nut: [{ tong: 'm tấn quặng = ?', chat: 'FeS_2', soLieu: ['60%'] }, { tong: '1 tấn dd', chat: 'H_2SO_4', soLieu: ['98%'] }], muiTen: [{ H: 80 }], chieu: 'nguoc' },
      buoc: [{ ten: 'm', thuaSo: [
        { so: '10^6', nghia: '1 tấn dung dịch = 10^6 gam' },
        { so: '98/100', nghia: 'gam H2SO4 (dung dịch 98%)' },
        { so: '1/98', nghia: 'đổi ra tiền nhà H2SO4 = số mol (chia M = 98)' },
        { so: '1/2', nghia: 'tiền nhà FeS2: hệ số 1 so với 2 ⇒ nhà FeS2 nghèo bằng nửa (bảo toàn S)' },
        { so: '120', nghia: 'dùng tiền mua gam FeS2 (nhân M = 120)' },
        { so: '100/60', nghia: 'gam quặng theo lí thuyết (quặng chỉ chứa 60% FeS2)' },
        { so: '100/80', nghia: 'bù thuế: tính ngược phải gửi nhiều hơn (× 100/H)', denDay: 'Đi ngược từ H2SO4 về quặng thì phải gửi nhiều hơn để sau thuế còn đủ.' },
        { so: '10^-6', nghia: 'tấn quặng (đề hỏi theo tấn)' },
      ] }],
    },
  },
  hcl: {
    phan: 'Phần III · Trả lời ngắn',
    de: 'Nhỏ từ từ đến hết 150 mL dung dịch HCl 1 M vào 100 mL dung dịch Na2CO3 1 M, thu được V lít khí CO2 (đkc). Giá trị của V là (làm tròn đến hàng phần trăm)',
    ban: {
      qid: 'hcl', phienBan: 1,
      deNoiGi: 'Nhỏ từ từ axit vào CO3^2- thì H+ lần lượt làm 2 việc: trước hết biến CO3^2- thành HCO3- (không có khí), chỉ khi hết CO3^2- mới tạo CO2.',
      hienTuong: { giaiThich: ['H+ bị dùng trước cho việc thứ nhất: 0,1 mol.'], thiNghiem: { mau: 'coc', khung: [
        { tieuDe: 'Mới nhỏ HCl', moTa: 'Chưa có bọt khí' },
        { tieuDe: 'Nhỏ đủ 100 mL', moTa: 'Hết CO3^2-, dung dịch toàn HCO3-' },
        { tieuDe: 'Nhỏ tiếp 50 mL', moTa: 'Bắt đầu sủi bọt khí' },
      ] } },
      chiaKhoa: 'H+: 0,15 mol chia làm 2 phần: 0,1 mol đổi CO3^2- → HCO3-, phần còn lại tạo CO2.',
      buoc: [
        { ten: 'n_{CO2}', thuaSo: [{ so: '0,15', nghia: 'tổng mol H+ (150 mL × 1 M)' }, { so: '0,1', nghia: 'mol H+ bị dùng trước để đổi 0,1 mol CO3^2- thành HCO3- (trừ đi)' }] },
        { ten: 'V', thuaSo: [{ so: 'n_{CO2}', nghia: 'mol CO2 ở bước 1' }, { so: '24,79', nghia: 'thể tích 1 mol khí ở đkc (lít)' }] },
      ],
    },
  },
}

function NutODay({ nut }: { nut: ReactNode }) {
  const [o, setO] = useState<HTMLElement | null>(null)
  useEffect(() => setO(document.getElementById('khe-nut-day')), [])
  return o ? createPortal(nut, o) : null
}

const CSS = `
body{background:var(--tr-nen);color:var(--tr-chu);font-family:'Be Vietnam Pro',system-ui,sans-serif}
.kd{min-height:100vh;display:flex;flex-direction:column;padding-right:var(--gyc-cot-phai,0px);box-sizing:border-box}
.kd-tren{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--tr-vien);background:var(--tr-mat)}
.kd-ve{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;border:0;background:transparent;color:var(--tr-chu-2);font-size:20px}
.kd-vach{flex:1;height:10px;border-radius:999px;background:var(--tr-mat-3);overflow:hidden}.kd-vach i{display:block;width:33%;height:100%;background:var(--tr-hs)}
.kd-than{flex:1;width:100%;max-width:760px;margin:0 auto;padding:16px;box-sizing:border-box}
.kd-the{background:var(--tr-mat);border:1px solid var(--tr-vien);border-radius:20px;padding:22px 22px 20px}
.kd-chip{display:inline-flex;min-height:28px;align-items:center;padding:0 10px;border-radius:999px;background:var(--tr-mat-2);color:var(--tr-chu-2);font-size:12.5px;font-weight:600;margin-bottom:12px}
.kd-de{font-size:17px;line-height:1.75;margin:0}
.kd-pa{display:grid;gap:10px;margin-top:18px}
.kd-pa button{display:flex;align-items:center;gap:12px;min-height:52px;padding:0 14px;border-radius:14px;border:1.5px solid var(--tr-vien);background:var(--tr-mat);color:var(--tr-chu);font:inherit;font-size:16px;text-align:left}
.kd-pa b{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:var(--tr-mat-2);font-size:14px}
.kd-o{display:flex;align-items:center;gap:10px;margin-top:18px;color:var(--tr-chu-3);font-size:14px}.kd-o span{flex:1;max-width:260px;height:48px;border-radius:12px;border:1px solid var(--tr-vien-2)}
.kd-day{position:sticky;bottom:0;display:flex;gap:10px;align-items:center;padding:12px 16px calc(12px + env(safe-area-inset-bottom));background:var(--tr-mat);border-top:1px solid var(--tr-vien)}
.kd-day>#khe-nut-day{display:flex}
.kd-kiem{flex:1;min-height:52px;border:0;border-radius:14px;background:var(--tr-hs-nut);color:var(--tr-hs-tren);font:inherit;font-weight:700;font-size:16px;letter-spacing:.04em}
.kd-kq{margin-top:16px}.kd-kq .loi-giai{background:var(--tr-mat);border:1px solid var(--tr-vien);border-radius:20px;padding:18px}
.kd-kq .lg-nhan{font-size:12.5px;font-weight:700;color:var(--tr-chu-3);letter-spacing:.06em;margin-bottom:10px}
.kd-dai{display:flex;gap:10px;align-items:center;padding:14px 16px;border-radius:16px;background:var(--tr-dung-nhat);color:var(--tr-dung-chu);font-weight:700}
`

function Trang() {
  const p = new URLSearchParams(location.search)
  const ten = p.get('bai') ?? 'este'
  if (ten === 'loigiai') {
    const b = BAI.pyrite
    return <div className="kd"><style>{CSS}</style>
      <header className="kd-tren"><button className="kd-ve" aria-label="Về">←</button><b>Câu 2/6</b><div className="kd-vach"><i /></div></header>
      <main className="kd-than">
        <div className="kd-dai" role="status">✓ Đúng · tự làm · em trả lời 76,8</div>
        <div className="kd-kq"><KhoiLoiGiaiChuan phan="III" correct="76,8" loiGiai={{ chot: 'Bảo toàn S', buoc: ['(lời giải chữ cũ)'], ketQua: '76,8' }} thayLoiGiai={thayBangSoDo(b.ban)} /></div>
      </main>
      <footer className="kd-day"><button className="kd-kiem">TIẾP TỤC</button></footer>
    </div>
  }
  const b = BAI[ten] ?? BAI.este
  const tai = async (): Promise<GoiYTraVe> => ({ ok: true, co: true, giaiDoan: 'truoc', ban: b.ban })
  return <div className="kd"><style>{CSS}</style>
    <header className="kd-tren"><button className="kd-ve" aria-label="Lưu và về Hôm nay">←</button><b>Câu 2/6</b><div className="kd-vach"><i /></div></header>
    <main className="kd-than">
      <section className="kd-the">
        <span className="kd-chip">{b.phan}</span>
        <VungChamDe q={{ qid: b.ban.qid }} taiGoiY={tai} nutBatDau={(nut) => <NutODay nut={nut} />}>
          <p className="kd-de"><ChemText text={b.de} /></p>
        </VungChamDe>
        {b.pa ? <div className="kd-pa">{b.pa.map((x, i) => <button key={i}><b>{'ABCD'[i]}</b>{x}</button>)}</div>
          : <div className="kd-o">Đáp số <span /></div>}
      </section>
    </main>
    <footer className="kd-day"><div id="khe-nut-day" /><button className="kd-kiem">KIỂM TRA</button></footer>
  </div>
}

await napKatex()
createRoot(document.getElementById('root')!).render(<Trang />)

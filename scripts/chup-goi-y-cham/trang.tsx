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
import { KhoiLoiGiaiCoSoDo } from '../../src/components/goi-y-cham/thay-bang-so-do'
import type { BanSoDo, GoiYTraVe } from '../../src/lib/goi-y-cham/kieu'

// Bài kí hiệu (thầy 27/10, ảnh paracetamol): tên bước / thừa số «n_paracetamol», «V_mL», «n_H2SO4», số mũ trong sơ đồ.
const KI_HIEU: { ban: BanSoDo } = { ban: {
  qid: 'kihieu', phienBan: 1, ketQua: '862,9',
  deNoiGi: 'Sản xuất 1,5·10^6 viên paracetamol (500 mg/viên) từ p-nitrophenol, hiệu suất 80%: tính khối lượng p-nitrophenol cần dùng.',
  soDo: { chieu: 'nguoc', nut: [{ tong: '1,5·10^6 viên thuốc', chat: 'C_8H_9NO_2', soLieu: ['500 mg'] }, { chat: 'C_6H_5NO_3', soLieu: ['m kg = ?'] }], muiTen: [{ H: 80 }] },
  buoc: [
    { ten: 'n_paracetamol', thuaSo: [{ so: '1,5·10^6', nghia: 'số viên thuốc' }, { so: '500', nghia: 'mg mỗi viên' }, { so: '10^-6', nghia: 'đổi mg ra kg' }, { so: '1/151', nghia: 'số kmol paracetamol (chia M = 151)' }] },
    { ten: 'n_p-nitrophenol', thuaSo: [{ so: 'n_paracetamol', nghia: 'số kmol paracetamol ở bước 1' }, { so: '100/80', nghia: 'tính ngược × 100/H' }] },
    { ten: 'm_p-nitrophenol', donVi: 'kg', ketQua: '862,9', thuaSo: [{ so: 'n_p-nitrophenol', nghia: 'số kmol p-nitrophenol' }, { so: '139', nghia: 'khối lượng p-nitrophenol (nhân M = 139)', denDay: 'tới đây là: m_p-nitrophenol (kg)' }] },
  ],
} }

// ── bài mẫu (số khớp nhau)
const BAI: Record<string, { phan: string; de: string; pa?: string[]; ban: BanSoDo }> = {
  lythuyet: {
    phan: 'Phần I · Trắc nghiệm', de: 'Phát biểu nào sau đây không đúng?',
    pa: ['Nitrogen chiếm khoảng 78% thể tích không khí.', 'Ở điều kiện thường, nitrogen là chất khí không màu, không mùi.', 'Phân tử N2 có liên kết ba bền nên nitrogen khá trơ ở nhiệt độ thường.', 'Nitrogen tan rất tốt trong nước.'],
    ban: {
      qid: 'lythuyet', phienBan: 1, buoc: [],
      deNoiGi: 'Bốn câu đều nói về khí nitrogen. Ba câu đúng, một câu sai: em cần tìm câu sai đó.',
      chiaKhoa: 'Mỗi câu thuộc một mảng kiến thức: thành phần không khí · tính chất vật lí của N2 · liên kết N≡N. Đối chiếu từng câu với đúng mảng của nó.',
      cauTuHoi: 'Trong phòng thí nghiệm, người ta thu khí N2 bằng cách đẩy nước. Điều đó cho em biết N2 tan trong nước nhiều hay ít?',
    },
  },
  este: {
    phan: 'Phần I · Trắc nghiệm', pa: ['8,2.', '10,2.', '12,2.', '14,2.'],
    de: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng 100 mL dung dịch NaOH 1,5 M, đun nóng. Cô cạn dung dịch sau phản ứng, thu được m gam chất rắn khan. Giá trị của m là',
    ban: {
      qid: 'este', phienBan: 1,
      deNoiGi: 'Ester bị NaOH thuỷ phân khi đun nóng. Sau đó cô cạn: chất dễ bay hơi mất đi, phần rắn còn lại được cân.',
      chiaKhoa: 'Chất rắn khan = muối + NaOH còn dư (nếu có). Vì vậy phải so số mol hai chất trước phản ứng: chất nào hết, chất nào dư?',
      buoc: [
        { ten: 'n_{ester}', thuaSo: [{ so: '8,8', nghia: 'khối lượng ethyl acetate (gam)' }, { so: '1/88', nghia: 'số mol ester (chia M = 88)' }] },
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
      deNoiGi: 'Đốt FeS2 trong quặng ra SO2. Theo dấu nguyên tố S từ FeS2 sang SO2, không cần viết phương trình; có hiệu suất thì tính xuôi.',
      soDo: { nut: [{ tong: '1 tấn quặng', chat: 'FeS_2', soLieu: ['8%'] }, { chat: 'SO_2', soLieu: ['m kg = ?'] }], muiTen: [{ H: 90 }], chieu: 'xuoi' },
      buoc: [{ ten: 'm', donVi: 'kg', ketQua: '76,8', thuaSo: [
        { so: '10^6', nghia: '1 tấn quặng = 10^6 gam' },
        { so: '8/100', nghia: 'gam FeS2 (quặng chứa 8%)' },
        { so: '1/120', nghia: 'số mol FeS2 (chia M = 120)' },
        { so: '2', nghia: 'bảo toàn S: 1 FeS2 có 2 S ⇒ ra 2 SO2', denDay: 'Tới đây là số mol SO2.' },
        { so: '64', nghia: 'gam SO2 theo lý thuyết (nhân M = 64)' },
        { so: '90/100', nghia: 'gam SO2 thực tế: tính xuôi × H/100' },
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
      deNoiGi: 'Đề cho sản phẩm (H2SO4), hỏi nguyên liệu (quặng) ⇒ tính ngược. Theo dấu nguyên tố S từ H2SO4 về FeS2, rồi nhân 100/H.',
      soDo: { nut: [{ tong: 'm tấn quặng = ?', chat: 'FeS_2', soLieu: ['60%'] }, { tong: '1 tấn dd', chat: 'H_2SO_4', soLieu: ['98%'] }], muiTen: [{ H: 80 }], chieu: 'nguoc' },
      buoc: [{ ten: 'm', thuaSo: [
        { so: '10^6', nghia: '1 tấn dung dịch = 10^6 gam' },
        { so: '98/100', nghia: 'gam H2SO4 (dung dịch 98%)' },
        { so: '1/98', nghia: 'số mol H2SO4 (chia M = 98)' },
        { so: '1/2', nghia: 'bảo toàn S: 2 H2SO4 cần 1 FeS2' },
        { so: '120', nghia: 'gam FeS2 (nhân M = 120)' },
        { so: '100/60', nghia: 'gam quặng theo lí thuyết (quặng chỉ chứa 60% FeS2)' },
        { so: '100/80', nghia: 'gam quặng thực tế cần: tính ngược × 100/H', denDay: 'Tính ngược: hiệu suất 80% thì phải lấy nhiều quặng hơn lý thuyết.' },
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
      // Hợp đồng chỉ có PHÉP NHÂN (tích thừa số = đáp án, cổng làn C) ⇒ phép trừ nằm trong nghĩa của thừa số đầu.
      buoc: [
        { ten: 'V', thuaSo: [
          { so: 'n_{CO2}', nghia: 'mol CO2 = phần H+ còn lại sau khi đổi hết CO3^2- (0,15 − 0,1)', denDay: 'Tới đây là số mol CO2.' },
          { so: '24,79', nghia: 'mỗi mol khí ở đkc chiếm 24,79 lít' },
        ] },
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
  if (ten === 'loigiai' || ten === 'kihieu') {
    const b = ten === 'kihieu' ? KI_HIEU : BAI.pyrite
    return <div className="kd"><style>{CSS}</style>
      <header className="kd-tren"><button className="kd-ve" aria-label="Về">←</button><b>Câu 2/6</b><div className="kd-vach"><i /></div></header>
      <main className="kd-than">
        <div className="kd-dai" role="status">✓ Đúng · tự làm · em trả lời 76,8</div>
        <div className="kd-kq"><KhoiLoiGiaiCoSoDo phan="III" correct="76,8" loiGiai={{ chot: 'Bảo toàn S', buoc: ['(lời giải chữ cũ)'], ketQua: '76,8' }} soDo={b.ban} /></div>
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

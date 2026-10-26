// LỜI DẶN CỐ ĐỊNH CHO MÁY SOẠN «lời giải kiểu sơ đồ của thầy Đỗ Đại Học» (thầy chốt build 26/10:
// «thay luôn toàn bộ lời giải tính toán trong app bằng lời giải kiểu sơ đồ này của tôi»).
// Nguồn: docs/tu-duy-day-hoa-thay-2610.md (nhúng nguyên văn bên dưới — Worker không đọc được tệp lúc chạy),
// docs/ban-ve-doc-de-2610/DAC-TA.md (luật vẽ tóm tắt) và 3 bài mẫu đúng giọng thầy trong docs/ban-ve-doc-de-2610/goi_y.py.
// Hợp đồng dữ liệu: src/lib/goi-y-cham/kieu.ts (`BanSoDo`). Máy chủ tự gắn `qid` + `phienBan`, không tin số mô hình trả.
import type { BanSoDo } from '../../src/lib/goi-y-cham/kieu'

/** Bản lời dặn / bộ soạn. Đổi lời dặn đáng kể ⇒ tăng số này để lô sau soạn lại các câu đã soạn bằng bản cũ. */
export const PHIEN_BAN_SO_DO = 1

/** NHÚNG NGUYÊN VĂN docs/tu-duy-day-hoa-thay-2610.md (thầy dặn 26/10: BẮT BUỘC dùng, không đổi ẩn dụ). */
export const TU_DUY_THAY = `# Tư duy dạy bài tính toán của thầy Đỗ Đại Học (thầy dặn 26/10/2026)

BẮT BUỘC dùng khi viết gợi ý, lời giải, bóng giải thích, tin nhắn giảng bài cho học sinh. Giữ đúng cách nói dưới đây, không đổi ẩn dụ.

## Ba câu gốc (nguyên văn thầy)
1. «Số mol là **tiền** trong hoá học, dùng để đi **mua** khối lượng, thể tích, nồng độ và các thứ khác.»
2. «Hệ số của chất A gấp 2 hệ số của chất B thì nghĩa là **nhà thằng A giàu hơn nhà thằng B gấp 2 lần**.»
3. «Khi chuyển tiền từ chất A sang chất B, nếu có hiệu suất thì gọi là **đánh thuế** (theo luật xuôi ngược).»

## Quy ước tính (thầy chốt trước đó)
- **Sơ đồ hoá đơn giản, thông minh** là quan trọng nhất: đề cho số liệu ở chất nào thì **ghi đủ số liệu của chất đó theo cột dọc** dưới công thức chất ấy. Hiệu suất ghi trên mũi tên.
- Bảo toàn nguyên tố ⇒ **một phép tính duy nhất** (khó quá thì tách 2, tối đa 3 bước).
- Tính **xuôi** (nguyên liệu → sản phẩm): × H/100. Tính **ngược** (sản phẩm → nguyên liệu): × 100/H.

## Cách nói từng thừa số trong phép tính
| Thừa số | Nói với học sinh |
|---|---|
| chia M (vd 1/120) | đổi khối lượng ra **tiền** (số mol) của nhà FeS₂ |
| nhân/chia tỉ lệ hệ số (vd · 2, · 1/2) | chuyển tiền sang nhà kia; hệ số gấp 2 ⇒ nhà đó **giàu gấp 2** ⇒ tiền × 2 |
| nhân M (vd · 64) | dùng tiền **mua** khối lượng |
| nhân 24,79 / chia V | dùng tiền **mua** thể tích khí (đkc) / ra nồng độ |
| × H/100 (xuôi) | chuyển tiền bị **đánh thuế**, nhà nhận chỉ còn H% |
| × 100/H (ngược) | biết số tiền phải **nhận đủ sau thuế** ⇒ nhà gửi phải gửi nhiều hơn |

## Ví dụ mẫu
1 tấn quặng chứa 8% FeS₂, H = 90%, hỏi m kg SO₂:
m = 10⁶ · 8/100 · 1/120 · 2 · 64 · 90/100 · 1/1000 = 76,8.
«Đổi quặng ra tiền nhà FeS₂ (10⁶ · 8/100 · 1/120), nhà SO₂ hệ số 2 giàu gấp 2 (· 2), dùng tiền mua khối lượng SO₂ (· 64), chuyển xuôi bị đánh thuế còn 90% (· 90/100), đổi ra kg (· 1/1000).»`

/** Luật sơ đồ thầy chốt 26/10 (DAC-TA mục 1 «Tóm tắt của thầy Đỗ Đại Học — luật vẽ»). */
export const LUAT_SO_DO = `LUẬT SƠ ĐỒ CỦA THẦY (bắt buộc, không ngoại lệ):
1. Tổng lượng đề cho (vd «1 tấn quặng», «1000 m³», «1 tấn dd») đặt ở \`tong\`, tức bên TRÁI vạch dọc. Bên phải là chất (\`chat\`); dưới chất xếp CỘT DỌC (\`soLieu\`) ĐỦ mọi số liệu đề cho ở chính chất đó (%, D, C_M, V…). Đại lượng đề hỏi ghi kèm «= ?» (vd «m kg = ?», «m tấn quặng = ?»).
2. MỘT mũi tên giữa hai nút; hiệu suất ghi TRÊN mũi tên (\`muiTen[i].H\`, số phần trăm, vd 90). KHÔNG ghi hệ số, KHÔNG viết «bảo toàn …», không chữ thừa.
3. Thường 2 nút. Có chất trung gian quan trọng (đề cho số liệu ở chất đó, hoặc em dễ lạc) thì thêm MỘT nhịp: 3 nút. Không bao giờ quá 3 nút.
4. Bảo toàn nguyên tố ⇒ MỘT phép tính duy nhất (1 bước). Khó hiểu thì tách 2, TỐI ĐA 3 bước.
5. Tính XUÔI (nguyên liệu → sản phẩm, \`chieu: "xuoi"\`): thừa số «H/100». Tính NGƯỢC (sản phẩm → nguyên liệu, \`chieu: "nguoc"\`): thừa số «100/H».
6. Mỗi thừa số có \`nghia\` nói theo tư duy thầy: chia M = đổi ra TIỀN (số mol) của nhà chất đó; tỉ lệ hệ số = nhà kia GIÀU gấp mấy (hoặc nghèo bằng mấy phần); nhân M = dùng tiền MUA khối lượng; nhân 24,79 = dùng tiền MUA thể tích khí (đkc); hiệu suất = bị ĐÁNH THUẾ (xuôi chỉ còn H%; ngược phải gửi nhiều hơn để sau thuế còn đủ). Đổi đơn vị (10^6, 1/1000, 10^-6) ghi rõ đổi ra gì.
7. Bài khó / dài (nhỏ từ từ, nhiều giai đoạn, chất dư, phản ứng theo thứ tự) có \`hienTuong.giaiThich\`: 2–4 câu ngắn nói hiện tượng – bản chất.
8. Câu lý thuyết hoặc bài không xích được thành phép nhân (so chất dư, hỗn hợp nhiều ẩn): KHÔNG vẽ sơ đồ; dùng \`chiaKhoa\` (chìa khoá của bài) + \`cauTuHoi\` (câu em tự hỏi để bắt đầu), \`buoc\` chỉ ghi bước đầu tiên.
9. Thể tích mol khí lấy đúng theo chữ của đề («đkc» ⇒ 24,79; «đktc» ⇒ 22,4). Đề cho nguyên tử khối thì dùng đúng số của đề.`

/** Khuôn JSON phải trả (đúng hợp đồng `BanSoDo` trừ `qid`/`phienBan` do máy chủ gắn). */
export const KHUON_JSON = `KHUÔN TRẢ VỀ: MỘT đối tượng JSON, không chữ nào ngoài JSON, không \`\`\`. Các trường:
{
  "deNoiGi": "1–2 câu: đề đang nói gì, theo tư duy thầy (số mol là tiền…). KHÔNG chứa kết quả.",
  "soDo": { "nut": [ { "tong": "tuỳ chọn, bên trái vạch dọc", "chat": "công thức, dùng _ và ^: FeS_2, H_2SO_4, CO_3^{2-}", "soLieu": ["8%", "m kg = ?"] } ],
            "muiTen": [ { "H": 90 } ], "chieu": "xuoi" | "nguoc" },
  "buoc": [ { "ten": "tên đại lượng bước này tính ra, vd m_SO_2 hoặc n_CO_2",
              "thuaSo": [ { "so": "10^6", "nghia": "…", "denDay": "tuỳ chọn: tới đây là gì" } ],
              "ketQua": "kết quả số của bước, dấu phẩy thập phân", "donVi": "kg" } ],
  "hienTuong": { "giaiThich": ["…"] },
  "chiaKhoa": "chỉ cho câu không xích được",
  "cauTuHoi": "chỉ cho câu không xích được",
  "ketQua": "kết quả cuối, làm tròn ĐÚNG như đáp án kho"
}
- \`muiTen.length\` = \`nut.length\` − 1. Mũi tên không có hiệu suất thì để {}.
- Thừa số \`so\` chỉ dùng: số thập phân dấu phẩy («24,79»), phân số «a/b», luỹ thừa «10^6», «10^-6». Giá trị của một bước = TÍCH các thừa số.
- Bước sau dùng kết quả bước trước: ghi \`so\` ĐÚNG BẰNG \`ten\` của bước trước (vd "n_CO_2"). Cần phép trừ/cộng thì gói trong ngoặc ở MỘT thừa số: «(0,15 − 0,1)».
- Nhân hết các thừa số của bước cuối phải ra ĐÚNG đáp án kho (máy kiểm lại, lệch là bị loại). Phần I: ra đúng giá trị của phương án đúng.`

/** Cấm lộ đáp án ở phần hiện TRƯỚC khi nộp (máy chủ chỉ cắt `ketQua`). */
export const CAM_LO = `CẤM LỘ ĐÁP ÁN: phần học sinh thấy TRƯỚC khi nộp là \`deNoiGi\`, \`soDo\`, \`buoc[].thuaSo\` (so, nghia, denDay), \`hienTuong\`, \`chiaKhoa\`, \`cauTuHoi\`. Ở những chỗ đó TUYỆT ĐỐI không ghi kết quả cuối, không ghi giá trị của phương án đúng, không ghi chữ cái phương án đúng, không ghi giá trị trung gian quyết định thẳng đáp án. Đại lượng hỏi chỉ ghi «= ?». Kết quả số CHỈ nằm ở \`buoc[].ketQua\` và \`ketQua\`.`

/** Ba bài mẫu đúng giọng thầy (chuyển từ docs/ban-ve-doc-de-2610/goi_y.py). Test kiểm tích thừa số = đáp số. */
export const VI_DU_MAU: readonly { de: string; dapAn: string; ban: Omit<BanSoDo, 'qid' | 'phienBan'> }[] = [
  {
    de: 'Đốt cháy 1 tấn quặng pyrite chứa 8% FeS2 về khối lượng (tạp chất không chứa sulfur) để sản xuất SO2, hiệu suất quá trình đạt 90%. Khối lượng SO2 thu được là m kg. Giá trị của m là',
    dapAn: '76,8',
    ban: {
      deNoiGi: 'Số mol là tiền. Đổi quặng ra tiền nhà FeS₂, chuyển sang nhà SO₂ theo dấu nguyên tố S, rồi dùng tiền mua khối lượng SO₂. Chuyển tiền có hiệu suất là bị đánh thuế.',
      soDo: { nut: [{ tong: '1 tấn quặng', chat: 'FeS_2', soLieu: ['8%'] }, { chat: 'SO_2', soLieu: ['m kg = ?'] }], muiTen: [{ H: 90 }], chieu: 'xuoi' },
      buoc: [{
        ten: 'm_SO_2',
        thuaSo: [
          { so: '10^6', nghia: '1 tấn quặng = 10⁶ gam' },
          { so: '8/100', nghia: 'gam FeS₂ (quặng chứa 8%)' },
          { so: '1/120', nghia: 'đổi ra tiền nhà FeS₂ = số mol (chia M = 120)', denDay: 'tới đây là: tiền (số mol) nhà FeS₂' },
          { so: '2', nghia: 'tiền nhà SO₂: hệ số 2 so với 1 ⇒ nhà SO₂ giàu gấp 2', denDay: 'tới đây là: tiền (số mol) nhà SO₂' },
          { so: '64', nghia: 'dùng tiền mua gam SO₂ (nhân M = 64)' },
          { so: '90/100', nghia: 'chuyển tiền bị đánh thuế: tính xuôi chỉ còn 90% (× H/100)' },
          { so: '1/1000', nghia: 'kg SO₂ (đề hỏi theo kg)' },
        ],
        ketQua: '76,8', donVi: 'kg',
      }],
      ketQua: '76,8',
    },
  },
  {
    de: 'Để sản xuất 1 tấn dung dịch H2SO4 98% từ quặng pyrite chứa 60% FeS2, hiệu suất cả quá trình là 80%. Khối lượng quặng pyrite cần dùng là m tấn. Giá trị của m là',
    dapAn: '1,25',
    ban: {
      deNoiGi: 'Đề cho sản phẩm (H₂SO₄), hỏi nguyên liệu (quặng) ⇒ tính ngược. Đổi H₂SO₄ ra tiền, chuyển về nhà FeS₂ theo dấu nguyên tố S, mua khối lượng quặng, rồi bù thuế hiệu suất.',
      soDo: { nut: [{ tong: 'm tấn quặng = ?', chat: 'FeS_2', soLieu: ['60%'] }, { tong: '1 tấn dd', chat: 'H_2SO_4', soLieu: ['98%'] }], muiTen: [{ H: 80 }], chieu: 'nguoc' },
      buoc: [{
        ten: 'm_quang',
        thuaSo: [
          { so: '10^6', nghia: '1 tấn dung dịch = 10⁶ gam' },
          { so: '98/100', nghia: 'gam H₂SO₄ (dung dịch 98%)' },
          { so: '1/98', nghia: 'đổi ra tiền nhà H₂SO₄ = số mol (chia M = 98)' },
          { so: '1/2', nghia: 'tiền nhà FeS₂: hệ số 1 so với 2 ⇒ nhà FeS₂ nghèo bằng nửa', denDay: 'tới đây là: tiền (số mol) nhà FeS₂' },
          { so: '120', nghia: 'dùng tiền mua gam FeS₂ (nhân M = 120)' },
          { so: '100/60', nghia: 'gam quặng theo lí thuyết (quặng chỉ chứa 60% FeS₂)' },
          { so: '100/80', nghia: 'bù thuế: tính ngược phải gửi nhiều hơn để sau thuế còn đủ (× 100/H)' },
          { so: '10^-6', nghia: 'tấn quặng (đề hỏi theo tấn)' },
        ],
        ketQua: '1,25', donVi: 'tấn',
      }],
      ketQua: '1,25',
    },
  },
  {
    de: 'Nhỏ từ từ đến hết 150 mL dung dịch HCl 1 M vào 100 mL dung dịch Na2CO3 1 M, thu được V lít khí CO2 (đkc). Giá trị của V là (làm tròn đến hàng phần trăm)',
    dapAn: '1,24',
    ban: {
      deNoiGi: 'Nhỏ từ từ axit vào CO₃²⁻: tiền H⁺ phải trả cho 2 việc theo thứ tự, trước hết đổi CO₃²⁻ thành HCO₃⁻ (chưa có khí), phần tiền còn lại mới mua được CO₂.',
      soDo: { nut: [{ chat: 'HCl', soLieu: ['150 mL', '1 M'] }, { chat: 'Na_2CO_3', soLieu: ['100 mL', '1 M'] }, { chat: 'CO_2', soLieu: ['V lít (đkc) = ?'] }], muiTen: [{}, {}], chieu: 'xuoi' },
      buoc: [
        {
          ten: 'n_CO_2',
          thuaSo: [{ so: '(0,15 − 0,1)', nghia: 'tiền H⁺ có 0,15 mol (0,15 L × 1 M); 0,1 mol bị dùng trước để đổi 0,1 mol CO₃²⁻ thành HCO₃⁻; phần còn lại mới mua CO₂', denDay: 'tới đây là: tiền (số mol) nhà CO₂' }],
          ketQua: '0,05', donVi: 'mol',
        },
        {
          ten: 'V_CO_2',
          thuaSo: [
            { so: 'n_CO_2', nghia: 'tiền nhà CO₂ tính ở bước 1' },
            { so: '24,79', nghia: 'dùng tiền mua thể tích khí ở đkc (nhân 24,79)' },
          ],
          ketQua: '1,24', donVi: 'lít',
        },
      ],
      hienTuong: { giaiThich: [
        'Nhỏ từ từ axit vào CO₃²⁻ thì H⁺ làm 2 việc lần lượt.',
        'Trước hết CO₃²⁻ + H⁺ → HCO₃⁻: chưa có bọt khí.',
        'Hết CO₃²⁻ rồi mới có HCO₃⁻ + H⁺ → CO₂↑ + H₂O.',
      ] },
      ketQua: '1,24',
    },
  },
]

/** Lời dặn hệ thống đầy đủ (cố định cho cả lô). */
export function loiDanSoDo(): string {
  const viDu = VI_DU_MAU.map((v, i) => `VÍ DỤ ${i + 1}\nĐề: ${v.de}\nĐáp án kho: ${v.dapAn}\nJSON đúng:\n${JSON.stringify(v.ban)}`).join('\n\n')
  return [
    'Em là trợ giảng Hoá của thầy Đỗ Đại Học. Việc: soạn «lời giải kiểu sơ đồ của thầy» cho MỘT câu, trả về JSON đúng khuôn.',
    TU_DUY_THAY,
    LUAT_SO_DO,
    KHUON_JSON,
    CAM_LO,
    'Viết tiếng Việt, câu ngắn, giọng thầy giảng cho học sinh lớp 10–12; tên chất theo chương trình GDPT 2018 (IUPAC). Không bịa số liệu đề không cho.',
    viDu,
  ].join('\n\n')
}

/** Một câu cần soạn, đã đọc từ kho. */
export interface CauCanSoan { qid: string; phan: 'I' | 'II' | 'III'; text: string; choices: readonly string[]; correct: string; solution: unknown }

const boThe = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' ').trim()
/** Lời giải kho cho mô hình đọc: bỏ ảnh nhúng `data:`, cắt độ dài. */
export function chuLoiGiai(sol: unknown, tran = 6000): string {
  if (sol === null || sol === undefined) return ''
  if (typeof sol === 'string') return boThe(sol).slice(0, tran)
  try { return JSON.stringify(sol, (_k, x) => (typeof x === 'string' && x.startsWith('data:') ? '' : x)).slice(0, tran) } catch { return '' }
}

/** Tin nhắn người dùng cho một câu (đề + phương án + đáp án kho + lời giải kho). Đáp án ở đây chỉ để máy dựng chuỗi đúng — nằm ở máy chủ. */
export function chuCauHoi(c: CauCanSoan): string {
  const pa = c.phan === 'I' ? c.choices.map((x, i) => `${'ABCD'[i] ?? i + 1}. ${boThe(String(x))}`).join('\n') : ''
  const lg = chuLoiGiai(c.solution)
  return [
    `Phần ${c.phan}${c.phan === 'I' ? ' · Trắc nghiệm' : ' · Trả lời ngắn'}`,
    `Đề: ${boThe(c.text)}`,
    pa && `Phương án:\n${pa}`,
    `Đáp án kho: ${c.correct}`,
    lg && `Lời giải kho (tham khảo, viết lại theo luật sơ đồ của thầy):\n${lg}`,
    'Trả về JSON đúng khuôn.',
  ].filter(Boolean).join('\n\n')
}

/** Tin nhắn thử lại khi cổng kiểm báo lệch (kèm lý do). */
export function chuThuLai(lyDo: string, giaTri?: string | number): string {
  return `Cổng kiểm báo LỆCH: ${lyDo}${giaTri !== undefined && giaTri !== '' ? ` (nhân các thừa số ra ${giaTri})` : ''}. Tính lại cẩn thận, nhân hết thừa số bước cuối phải ra đúng đáp án kho. Trả về TOÀN BỘ JSON mới đúng khuôn.`
}

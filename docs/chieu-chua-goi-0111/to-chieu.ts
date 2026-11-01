// ẢNH «CHIẾU CHỮA BÀI · GỌI LÊN BẢNG» (thầy 01/11 tối) — dựng TỜ CHIẾU THẬT qua đúng đường của app: bảng chấm từng câu (`ChiTietCauRow`, có `giay`)
// → `xepCauChuaCa` → `dungToChuaCa` (đề có đáp án của ca). Dữ liệu GIẢ, tên giả. Kèm một PHIẾU (`dungPhieu`) có câu Kc để soát phân số trên phiếu in.
//   npx esbuild docs/chieu-chua-goi-0111/to-chieu.ts --bundle --platform=node --format=esm --outfile=<tmp>.mjs && node <tmp>.mjs <thư mục ra>
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { xepCauChuaCa, type EmBaiCa } from '../../src/lib/chieu-chua-ca'
import { dungToChuaCa } from '../../src/components/ca-thi/dung-to-chua-ca'
import { dungPhieu } from '../../src/lib/html-phieu'
import { cauLuyenTuBoCau } from '../../src/lib/bai-tap-pdf'
import type { ChiTietCauRow } from '../../src/lib/exam-api'
import type { TeacherExamSource } from '../../src/data/examContent'

/** 32 em (tên giả). */
const LOP = [
  'Nguyễn Minh Anh', 'Trần Gia Bảo', 'Lê Thảo Chi', 'Phạm Quốc Dũng', 'Hoàng Thu Hà', 'Vũ Đức Huy', 'Đặng Ngọc Khánh', 'Bùi Hải Long',
  'Đỗ Phương Linh', 'Ngô Tuấn Minh', 'Dương Bảo Ngọc', 'Lý Hoàng Nam', 'Phan Thanh Phong', 'Trịnh Mai Phương', 'Hồ Đăng Quang', 'Mai Thuỳ Trang',
  'Cao Văn Sơn', 'Lâm Khánh Tâm', 'Tạ Minh Thư', 'Đinh Quang Trung', 'Chu Hà Vy', 'Kiều Anh Tú', 'Lưu Hữu Thắng', 'Tô Bích Ngân',
  'Quách Gia Hân', 'Vương Đình Khoa', 'Nghiêm Thảo My', 'Hà Duy Tùng', 'Thái Ngọc Diệp', 'Mạc Tuấn Kiệt', 'La Thanh Xuân', 'Khúc Bảo Châu',
] as const

const KC = 'K_C = \\frac{[CH3COOH][HOC2H5]}{[H2O]}'
/** Đề có đáp án của ca (giả). Câu Kc chép đúng dạng thầy chụp: LaTeX TRẦN, không `$…$`, `\frac {…} {…}` có khoảng trắng. */
const NGUON: TeacherExamSource[] = [{
  maDe: 'KT15-11A2',
  phanI: [
    {
      id: 'KT-Kc', mucDo: 'van_dung', correct: 'B',
      text: 'Cho phản ứng ester hoá: CH3COOH(l) + C2H5OH(l) <=> CH3COOC2H5(l) + H2O(l). Biểu thức tính hằng số cân bằng K_C của phản ứng là',
      choices: [
        'K_C = \\frac {[CH3COOH][C2H5OH]} {[CH3COOC2H5][H2O]}',
        'K_C = \\frac{[CH3COOC2H5][H2O]}{[CH3COOH][C2H5OH]}',
        'K_C = \\frac{[CH3COOC2H5]}{[CH3COOH][C2H5OH]}',
        KC,
      ],
      explanation: 'K_C = tích nồng độ sản phẩm chia tích nồng độ chất phản ứng, mỗi nồng độ mũ hệ số: K_C = \\dfrac{[CH3COOC2H5][H2O]}{[CH3COOH][C2H5OH]}.',
    },
    {
      id: 'KT-pH', mucDo: 'hieu', correct: 'C',
      text: 'Trộn 100 mL dung dịch HCl 0,03 M với 100 mL dung dịch NaOH 0,01 M. Biết $pH = -\\log[H^+]$ và $[H^+] = \\dfrac{n_{H^+}}{V}$. Giá trị pH của dung dịch thu được là',
      choices: ['1,7', '1,5', '2', '12'],
      explanation: 'n(H⁺) dư = 0,003 − 0,001 = 0,002 mol ⇒ [H⁺] = \\frac{0,002}{0,2} = 0,01 M ⇒ pH = 2.',
    },
    {
      id: 'KT-NH3', mucDo: 'hieu', correct: 'A',
      text: 'Cho cân bằng N2(g) + 3H2(g) <=> 2NH3(g)   \\Delta_r H^\\circ_{298} = -92 kJ. Biểu thức K_C đúng là',
      choices: ['$K_C = \\dfrac{[NH_3]^2}{[N_2][H_2]^3}$', '$K_C = \\dfrac{[N_2][H_2]^3}{[NH_3]^2}$', '$K_C = \\dfrac{2[NH_3]}{[N_2] \\cdot 3[H_2]}$', '$K_C = \\sqrt{\\dfrac{[NH_3]}{[N_2][H_2]}}$'],
      explanation: 'Mũ là hệ số cân bằng: K_C = \\dfrac{[NH_3]^2}{[N_2][H_2]^3}.',
    },
    {
      // Câu THỬ TRÀN: phương án là phương trình dài (tờ để cả phương án một dòng) — ở chữ cực lớn phải tự xuống dòng, không thò khỏi tấm giấy.
      id: 'KT-dai', mucDo: 'biet', correct: 'A',
      text: 'Phương trình nào sau đây viết đúng phản ứng xà phòng hoá tristearin?',
      choices: [
        '(C17H35COO)3C3H5 + 3NaOH -> 3C17H35COONa + C3H5(OH)3',
        '(C17H35COO)3C3H5 + 3NaOH -> 3C17H35COOH + C3H5(ONa)3',
        '(C17H35COO)3C3H5 + NaOH -> C17H35COONa + C3H5(OH)3',
        'C17H35COOCH2CH(OOCC17H35)CH2OOCC17H35+3NaOH->3C17H35COONa+C3H5(OH)3',
      ],
    },
  ],
  phanII: [],
  phanIII: [],
}]

/** Bài làm từng em: `sai` = chỉ số em chưa đúng (kèm giây), còn lại làm đúng (giây theo công thức giả). */
const BAI: { qid: string; soCau: number; mucDo: string; dapAn: string; sai: [number, number | null, string][] }[] = [
  // Câu Kc: 9/32 em chưa đúng — có em làm rất nhanh (đoán), một em không có số giây.
  { qid: 'KT-Kc', soCau: 7, mucDo: 'van_dung', dapAn: 'B', sai: [[3, 14, 'D'], [9, 96, 'A'], [17, 22, 'D'], [22, 141, 'C'], [27, 8, 'A'], [12, 57, 'D'], [5, null, ''], [30, 33, 'A'], [14, 71, 'D']] },
  // Câu pH: 22/32 em chưa đúng — thẻ đông.
  { qid: 'KT-pH', soCau: 12, mucDo: 'hieu', dapAn: 'C', sai: [0, 2, 3, 5, 6, 7, 9, 11, 12, 14, 16, 17, 19, 21, 22, 24, 26, 27, 29, 30, 31, 13].map((i, k) => [i, 20 + ((k * 37) % 150), k % 3 ? 'A' : 'B'] as [number, number, string]) },
  // Câu NH3: cả lớp chưa đúng ⇒ «Thầy chữa».
  { qid: 'KT-dai', soCau: 1, mucDo: 'biet', dapAn: 'A', sai: [[4, 12, 'B'], [8, 40, 'D']] },
  { qid: 'KT-NH3', soCau: 3, mucDo: 'hieu', dapAn: 'A', sai: LOP.map((_, i) => [i, 30 + ((i * 13) % 90), i % 2 ? 'B' : 'C'] as [number, number, string]) },
]

const ds: EmBaiCa[] = LOP.map((hoTen, i) => ({
  sbd: String(100100 + i),
  hoTen,
  rows: BAI.map((b): ChiTietCauRow => {
    const s = b.sai.find((x) => x[0] === i)
    return { phan: 'I', soCau: b.soCau, qid: b.qid, chuyenDe: 'Cân bằng hoá học', mucDo: b.mucDo, dapAnChon: s ? s[2] : b.dapAn, dapAnDung: b.dapAn, dungSai: !s, giay: s ? s[1] : 25 + ((i * 29) % 140) }
  }),
}))

const ra = process.argv[2]!
const { html } = await dungToChuaCa(xepCauChuaCa(ds), NGUON, 'Chữa bài · Kiểm tra 15 phút · 11A2')
writeFileSync(join(ra, 'to.html'), html)
const cau = cauLuyenTuBoCau(NGUON[0]!.phanI.map((q) => ({ phan: 'I' as const, q })))
writeFileSync(join(ra, 'phieu.html'), dungPhieu({ hoTen: 'Lớp 11A2', sbd: '', ngay: new Date(2026, 10, 1), tenChuyenDe: 'Cân bằng hoá học', ketQua: '', hienDapAn: true }, cau, { moSan: true }))
console.log('to.html + phieu.html')

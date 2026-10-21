// KHO ĐỀ GIẢ cho trang chụp Hành trình (21/10): giữ mọi hàm thật của `exam-db`, chỉ thay `loadExamSources` (cây Dạy học khối 12, bài 10–14) và
// địa chỉ / mã máy chủ. Câu hỏi GIẢ, số liệu hoá học đã tính lại.
export * from '../../src/lib/exam-db?that'
import type { TeacherExamSource } from '../../src/data/examContent'

let n = 0
const tn = (text: string) => ({ id: `Q-${++n}`, text, choices: ['A', 'B', 'C', 'D'], correct: 'A' })
const to = (maDe: string, nguon: string, chuong: string, cau: { id: string; text: string }[]): TeacherExamSource =>
  ({ maDe, nhom: `12 · DẠY HỌC/${chuong}`, nguon, phanI: cau, phanII: [], phanIII: [] }) as unknown as TeacherExamSource
const KHO = [
  to('DH-12-C1-B10', 'Bài 10. Ester — lipid', 'C1 - Ester lipid', [tn('Thuỷ phân ethyl acetate trong dung dịch NaOH thu được muối nào?')]),
  to('DH-12-C2-B11', 'Bài 11. Carbohydrate', 'C2 - Carbohydrate', [tn('Chất nào sau đây thuộc loại monosaccharide?')]),
  to('DH-12-C3-B12', 'Bài 12. Amine', 'C3 - Hợp chất chứa nitrogen', [
    tn('Cho 4,5 gam ethylamine tác dụng với dung dịch HCl vừa đủ, thu được m gam muối. Giá trị của m là'),
    tn('Dãy gồm các chất đều làm quỳ tím ẩm chuyển sang màu xanh là'),
    tn('Aniline tác dụng với nước bromine tạo kết tủa màu gì?'),
    tn('Đốt cháy hoàn toàn 0,1 mol amine no, đơn chức, mạch hở X thu được 0,3 mol CO₂. Công thức phân tử của X là'),
  ]),
  to('DH-12-C3-B13', 'Bài 13. Amino acid — peptide', 'C3 - Hợp chất chứa nitrogen', [tn('Glycine có công thức cấu tạo là'), tn('Số liên kết peptide trong tripeptide Gly-Ala-Gly là')]),
  to('DH-12-C3-B14', 'Bài 14. Protein — enzyme', 'C3 - Hợp chất chứa nitrogen', [tn('Protein bị đông tụ khi')]),
]
export async function loadExamSources(): Promise<TeacherExamSource[]> {
  return KHO
}
export async function loadScriptUrl() {
  return 'https://may-chu-gia.example.com'
}
export async function loadTeacherSecret() {
  return 'mat-gia'
}

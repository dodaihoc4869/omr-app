// LUYỆN DẠNG BÀI — mục 4 của khối rút đề (15/09/2026)
//
// Thầy chốt: "tạo thêm một mục 4 chỗ này là Luyện dạng bài… đồng bộ cho tất cả
// các chỗ, tất cả các app", và "bấm vào dạng bài cho hiện các thư mục con LỚP
// 10, 11, 12, trong các thư mục con có tên bài theo sách giáo khoa, bấm vào mỗi
// tên bài thì hiển thị từng dạng bài của bài đó".
//
// Phép kiểm này soi MÃ NGUỒN chứ không dựng màn hình, vì thứ dễ hỏng lặng lẽ
// nhất ở đây không phải giao diện mà là bốn chốt dưới đây — hỏng cái nào cũng
// KHÔNG có màn hình nào đỏ lên:
//   1. tờ `DB-` lọt vào chỉ mục ⇒ câu bị đếm hai lần trong mọi lượt rút
//   2. `so_cau` đếm theo chỉ mục ⇒ cả 55 dạng hiện "0 câu"
//   3. thẻ 4 bị khoá theo `coKhoDe` ⇒ em không sai câu nào là không luyện được
//   4. hai lệnh mới rơi vào `LENH_CUA_THAY` ⇒ máy em gọi là 403
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const doc = (p: string) => readFileSync(resolve(GOC, p), 'utf8')

const modal = doc('src/components/ModalKhacPhucCauSai.tsx')
const thuatToan = doc('src/lib/thuat-toan-rut-cau-sai.ts')
const api = doc('src/lib/exam-api.ts')
const mayChu = doc('server/src/goi-cu.ts')
const congChu = doc('server/src/index.ts')
const manPh = doc('src/screens/ParentPortalScreen.tsx')

describe('Mục 4 — Luyện dạng bài trên màn hình', () => {
  it('có đủ bốn chế độ, mặc định vẫn là chế độ 1', () => {
    expect(modal).toContain('useState<1 | 2 | 3 | 4>(1)')
    expect(modal).toContain('4. Luyện dạng bài')
  })

  it('thẻ 4 KHÔNG khoá theo kho câu-sai — em không sai câu nào vẫn luyện được', () => {
    // Đây là chốt số 3. Chép nhầm `coKhoDe &&` từ thẻ 2/3 sang là hỏng ngay.
    expect(modal).toContain('onClick={() => dmDangBai.length > 0 && setCheDo(4)}')
    expect(modal).not.toContain('onClick={() => coKhoDe && setCheDo(4)}')
    // Lối vào khi ca không có câu nào sai
    expect(modal).toContain('const [moThangDangBai, setMoThangDangBai] = useState(false)')
    expect(modal).toContain('if (dsCauSai.length === 0 && !moThangDangBai) {')
  })

  it('điều hướng đúng bốn bước: lớp → tên bài SGK → dạng → số câu', () => {
    expect(modal).toContain('Bước 1 — Chọn lớp:')
    expect(modal).toContain('Bước 2 — Chọn bài (theo sách giáo khoa):')
    expect(modal).toContain('Bước 3 — Chọn dạng bài:')
    expect(modal).toContain('setLopChon(l.lop)')
    expect(modal).toContain('setBaiChon(b.tenBai)')
    expect(modal).toContain('setDangChon(d)')
  })

  it('tờ đề của dạng đi qua ĐÚNG cửa nạp kho, không nới luật nào', () => {
    expect(modal).toContain('parseKhoDeJson(JSON.stringify(kq.de))')
    expect(modal).toContain('buildTeacherSourceFromKhoDe(doc.json)')
    expect(modal).toContain('if (dung.errors.length > 0)')
  })

  it('kho rỗng KHÔNG còn là lý do cảnh báo của chế độ 4', () => {
    expect(modal).toContain('{!dangTaiKho && (loiRut || (!coKhoDe && cheDo !== 4)) && (')
  })

  it('số câu trên thanh trượt đếm SAU cửa nạp, không lấy so_cau trong gói', () => {
    expect(thuatToan).toContain('export function demCauDangBai(')
    expect(thuatToan).toContain('return cauLuyenTuNguon(khoDangBai).length')
    expect(modal).toContain('const tongToiDaCheDo4 = useMemo(() => demCauDangBai(khoDangBai)')
  })

  it('rút xong trộn thứ tự, không phát lại đúng 20 câu đầu mỗi lượt', () => {
    expect(thuatToan).toContain('export function rutLuyenDangBai(')
    expect(thuatToan).toContain('tronMang(tatCa).slice(0, Math.max(0, soCauRut))')
  })
})

describe('Mục 4 — hai lệnh mới của máy chủ', () => {
  it('máy chủ có đủ hai lệnh', () => {
    expect(mayChu).toContain('export async function danhMucDangBai(')
    expect(mayChu).toContain('export async function deTheoDangBai(')
    expect(congChu).toContain("case 'danhMucDangBai':")
    expect(congChu).toContain("case 'deTheoDangBai':")
  })

  it('là lệnh của MÁY EM, không đòi mã bí mật', () => {
    // Chốt số 4. Lọt vào bảng này là máy em gọi ra 403, mà màn hình chỉ hiện
    // "Không lấy được danh mục dạng bài" — rất khó lần ra.
    const bang = congChu.slice(congChu.indexOf('const LENH_CUA_THAY = new Set(['))
    const het = bang.indexOf('])')
    const dsThay = bang.slice(0, het)
    expect(dsThay).not.toContain('danhMucDangBai')
    expect(dsThay).not.toContain('deTheoDangBai')
  })

  it('menu đọc cột CÓ THẬT của bảng de_kho', () => {
    // 15/09 bản đầu đọc cột `nhom` — `de_kho` KHÔNG có cột ấy (chỉ ma_de,
    // ten_de, lop, chuyen_de, so_cau, r2_khoa, da_xoa, cap_nhat_luc), nên D1
    // ném lỗi và máy chủ trả HTTP 500 cho MỌI lượt mở mục 4.
    expect(mayChu).toContain('SELECT ma_de, ten_de, so_cau FROM de_kho')
    expect(mayChu).not.toContain('SELECT ma_de, nhom, so_cau FROM de_kho')
    expect(mayChu).toContain("chuoi(x.ten_de).split(' · ')")
    const cot = /CREATE TABLE IF NOT EXISTS de_kho \(([^;]*?)\)/.exec(
      readFileSync(resolve(GOC, 'server/migration-1209-toan-bo.sql'), 'utf8'),
    )
    expect(cot).not.toBeNull()
    expect(cot![1]).toContain('ten_de')
    expect(cot![1]).not.toContain('nhom')
  })

  it('kho có tờ mà menu rỗng thì BÁO, không trả menu rỗng im lặng', () => {
    expect(mayChu).toContain('if (soTo > 0 && tongDang === 0)')
  })

  it('chỉ mở đúng tờ dạng bài, không thành đường tải tờ đề bất kỳ', () => {
    expect(mayChu).toContain("export const TIEN_TO_DANG_BAI = 'DB-'")
    expect(mayChu).toContain('if (!ma.startsWith(TIEN_TO_DANG_BAI))')
    expect(mayChu).toContain('if (!/^[A-Za-z0-9-]+$/.test(ma))')
  })

  it('máy em gọi bằng đúng hai hàm, lỗi mạng không ném ra màn hình', () => {
    expect(api).toContain('export async function danhMucDangBai(')
    expect(api).toContain('export async function deTheoDangBai(')
    expect(api).toContain("{ action: 'danhMucDangBai' }")
    expect(api).toContain("{ action: 'deTheoDangBai', ma }")
  })
})

describe('Mục 4 — tờ dạng bài không được đếm hai lần', () => {
  it('tờ DB- bị loại khỏi phép đếm "đề mồ côi" ở CẢ HAI chỗ', () => {
    // Chốt số 1 phía máy chủ. Thiếu một trong hai chỗ là nghiệm thu đẩy đề báo
    // "55 tờ chưa có chỉ mục" mãi mà chạy lại bao nhiêu lần cũng không hết.
    const dem = congChu.split("d.ma_de NOT LIKE 'DB-%'").length - 1
    expect(dem).toBe(2)
  })

  it('so_cau đếm TRÊN GÓI, không trên chỉ mục', () => {
    // Chốt số 2. Đếm trên chỉ mục là cả 55 dạng hiện "0 câu" trên menu.
    expect(congChu).toContain('const soCauThat = cauDs.length > 0 ? cauDs.length : de ? docCauTuGoiDe(de as Record<string, unknown>).length : 0')
    expect(congChu).toContain("String(b.chuyenDe ?? ''), soCauThat, de ? khoa : null, nay)")
    expect(congChu).not.toContain("String(b.chuyenDe ?? ''), cauDs.length, de ? khoa : null, nay)")
  })
})

describe('Mục 4 — đồng bộ mọi chỗ mô tả các chế độ', () => {
  it('cổng phụ huynh nói 4 phương pháp, không còn 3', () => {
    expect(manPh).toContain('4 phương pháp khắc phục câu sai tối ưu cho con:')
    expect(manPh).not.toContain('3 phương pháp khắc phục câu sai tối ưu cho con:')
    expect(manPh).toContain('<b>4. Luyện dạng bài</b>')
  })

  it('hai tệp gốc của thuật toán và modal đều ghi đủ 4 mục ở đầu tệp', () => {
    expect(thuatToan.slice(0, 900)).toContain('4. Luyện dạng bài')
    expect(modal.slice(0, 900)).toContain('4. Luyện dạng bài')
  })
})

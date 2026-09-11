// CHỈ MỤC CÂU CỦA KHO — lỗi đo được trên D1 THẬT lúc 23:30 ngày 11/09:
//
//     SELECT COUNT(*) FROM cau_hoi                              →  0
//     SELECT COUNT(*), SUM(so_cau) FROM de_kho WHERE da_xoa = 0 →  118 · 6.843
//
// Kho có đủ đề, mục lục rỗng sạch. Nguyên nhân gốc: gói kho của thầy ghi câu
// bằng `phan` + `so` (xem `KhoDeCau`), còn chỗ dựng chỉ mục lại đòi `qid`/`id`
// rồi `continue` khi không có — nên không câu nào vào bảng.
//
// Hậu quả thầy nhìn thấy: đặt rút 8 trắc nghiệm · 2 đúng sai · 2 trả lời ngắn
// mà chỉ ra 3 · 1 · 1.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const WK = doc('server/src/index.ts')
const CK = doc('src/lib/chuyen-kho-de.ts')
const MAN = doc('src/components/KhoiMayChuMoi.tsx')

describe('MÃ CÂU DỰNG ĐÚNG NHƯ MÁY THẦY', () => {
  it('công thức là <mã đề>-<phần>-<số>, khớp buildTeacherSourceFromKhoDe', () => {
    const han = WK.slice(WK.indexOf('export function qidCuaCau('), WK.indexOf('/** ĐẨY MỘT ĐỀ VÀO KHO.'))
    expect(han).toContain('`${maDe}-${phan}-${so}`')
    // Mã máy thầy đã sinh sẵn thì GIỮ NGUYÊN, không dựng đè lên.
    expect(han).toContain("String(c.qid ?? c.id ?? '').trim()")
    // Thiếu phần hoặc thiếu số thì trả rỗng — KHÔNG đoán một mã.
    expect(han).toContain("if (!phan || !so) return ''")
  })

  it('máy thầy dựng mã theo đúng công thức ấy — hai bên phải khớp từng ký tự', () => {
    const IMP = doc('src/lib/exam-kho-de-import.ts')
    expect(IMP).toContain('`${json.ma_de}-I-${c.so}`')
    expect(IMP).toContain('`${json.ma_de}-II-${c.so}`')
    expect(IMP).toContain('`${json.ma_de}-III-${c.so}`')
  })

  it('chỗ đẩy đề vào kho dùng chung hàm ấy, không tự đọc qid nữa', () => {
    const han = WK.slice(WK.indexOf('async function dayDeKho('), WK.indexOf('async function danhSachDeKho('))
    expect(han).toContain('qidCuaCau(maDe, c)')
    expect(han).not.toContain("String(c.qid ?? c.id ?? '').trim()")
  })
})

describe('LẬP LẠI CHỈ MỤC TỪ GÓI ĐÃ NẰM TRÊN MÁY CHỦ', () => {
  const HAM = WK.slice(WK.indexOf('async function dungChiMucKho('), WK.indexOf('/** RÚT CÂU THEO CHUYÊN ĐỀ'))

  it('có đường riêng, đòi mã bí mật', () => {
    expect(WK).toContain("if (p === '/kho/chi-muc') return dungChiMucKho(env, b)")
    expect(WK.indexOf("p === '/kho/chi-muc'")).toBeGreaterThan(WK.indexOf('if (!laThay(req, env, b))'))
  })

  it('KHÔNG đẩy lại kho — đọc gói sẵn có trên R2', () => {
    expect(HAM).toContain('env.DE.get(`kho/${maDe}.json`)')
  })

  it('chạy theo LÔ và nói còn bao nhiêu tờ — trần 50 câu truy vấn mỗi lượt gọi', () => {
    expect(HAM).toContain('Math.min(10, Number(b.gioiHan) || 6)')
    expect(HAM).toContain('conLai')
  })

  it('chỉ chọn tờ CHƯA có chỉ mục ⇒ chạy lại bao nhiêu lần cũng an toàn', () => {
    expect(HAM).toContain('NOT EXISTS (SELECT 1 FROM cau_hoi c WHERE c.ma_de = d.ma_de)')
  })

  it('một tờ hỏng KHÔNG làm chết cả lượt, và được kê tên', () => {
    expect(HAM).toContain("hong.push({ maDe, viSao: 'gói hỏng, không đọc được' })")
    expect(HAM).toContain("hong.push({ maDe, viSao: 'không còn gói trên R2' })")
  })

  it('lệnh cũ `dungChiMuc` nay DỰNG THẬT, không đếm suông rồi báo xong', () => {
    expect(WK).toContain("case 'dungChiMuc': return dungChiMucKho(env, b)")
  })
})

describe('PHÍA MÁY THẦY', () => {
  it('vòng lặp có TRẦN — một lỗi lặp vô hạn không được quay máy thầy suốt đêm', () => {
    const han = CK.slice(CK.indexOf('export async function dungLaiChiMucKho('))
    expect(han).toContain('lan < 40')
    expect(han).toContain("headers: { 'content-type': 'application/json', 'x-ma-bi-mat': mat }")
  })

  it('dừng khi hết việc, và cũng dừng khi lô không nhích được tờ nào', () => {
    const han = CK.slice(CK.indexOf('export async function dungLaiChiMucKho('))
    expect(han).toContain('if (!j.conLai ||')
  })

  it('có nút riêng trong Cài đặt, tách khỏi nút chuyển kho', () => {
    expect(MAN).toContain('Lập lại chỉ mục câu của kho')
    expect(MAN).toContain('dungLaiChiMucKho')
    // Nói rõ nút này KHÔNG đẩy lại đề — thầy đã chờ một lượt chuyển kho rồi.
    expect(MAN).toContain('KHÔNG đẩy lại đề')
  })
})

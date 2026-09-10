// RÀ SOÁT MỤC CHỌN CA THI — màn Ca thi, khối tích chọn để xoá.
//
// Chạy theo `QUY-TRINH-RA-SOAT-VA-TU-SUA.md`: một lát cắt, xếp theo BÁN KÍNH
// THIỆT HẠI, đầu ra là phép kiểm chạy lại được chứ không phải danh sách phát
// hiện.
//
// ================= HAI LỖI RÀ RA ĐƯỢC =====================================
//
// D1 — LỜI CẢNH BÁO SAI SỰ THẬT. Hộp thoại xoá ghi "xoá rồi không khôi phục
// được". Sai. Máy chủ `xoaCa` là XOÁ MỀM (`TrangThai='da_xoa'`, giữ nguyên
// LuotThi/ChiTietCau), có hẳn lệnh `khoiPhucCa`, và chính màn này có mục "Ca đã
// xoá" kèm nút Khôi phục. Câu sai nằm ngay cạnh sự thật. Hại kép: vừa sai, vừa
// dạy thầy đừng tin mấy dòng cảnh báo của app.
//
// D2 — KHÔNG CẢNH BÁO CA ĐANG CHẠY. Đây mới là chỗ nguy hiểm. Máy chủ coi ca đã
// xoá là ca KHOÁ:
//     function caDangKhoa_(ca) { return ca.trangThai === 'dong' || ca.trangThai === 'da_xoa' }
// và `nopBai` trả "Ca đã khoá — không lưu thêm được". Nghĩa là tích nhầm một ca
// đang chạy rồi xoá thì CẢ PHÒNG đang làm dở không nộp được bài. Hộp thoại cũ
// chỉ hiện số em ĐÃ VÀO, không hề nói ca nào đang chạy.
//
// Khôi phục ca lại được, nhưng mấy phút em ngồi bấm nút mà máy báo lỗi thì
// không lấy lại được — nên đây là tầng 2 theo thang thiệt hại.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { caConEmDangLam, trangThaiCa } from '../src/screens/LichSuCaScreen'

const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/LichSuCaScreen.tsx'), 'utf8')
const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')

const T0 = Date.parse('2026-09-10T08:00:00.000Z')
const ca = (o: Partial<Parameters<typeof caConEmDangLam>[0]>) =>
  ({ trangThai: 'mo', batDau: '', hetHanVao: '', daVao: 0, daNop: 0, ...o }) as Parameters<typeof caConEmDangLam>[0]

describe('SỰ THẬT NỀN — vì sao xoá ca đang chạy lại hại', () => {
  it('máy chủ coi ca ĐÃ XOÁ là ca KHOÁ', () => {
    const dau = GS.indexOf('function caDangKhoa_(ca) {')
    expect(dau).toBeGreaterThan(0)
    const than = GS.slice(dau, GS.indexOf('\n}', dau))
    expect(than).toContain("ca.trangThai === 'da_xoa'")
  })

  it('ca khoá thì em KHÔNG nộp được — đúng câu máy chủ trả về', () => {
    expect(GS).toContain("if (caDangKhoa_(caS)) return jsonResponse_({ ok: false, lyDo: 'da_dong', error: 'Ca đã khoá — bài của em đã được nộp theo phần đã làm'")
    expect(GS).toContain("if (caDangKhoa_(docCa_(caShT, caRowT))) return jsonResponse_({ ok: false, lyDo: 'da_dong', error: 'Ca đã khoá — không lưu thêm được' })")
  })

  it('nhưng xoá là XOÁ MỀM và khôi phục lại được', () => {
    expect(GS).toContain("caSh.getRange(caRow, 10).setValue('da_xoa')")
    expect(GS).toContain("if (action === 'khoiPhucCa') {")
    expect(GS).toContain("caSh.getRange(caRow, 10).setValue('mo')")
  })
})

describe('D2 — NHẬN DIỆN CA ĐANG CHẠY', () => {
  it('ca đang mở, chưa tới hạn vào ⇒ ĐANG CHẠY', () => {
    expect(caConEmDangLam(ca({ batDau: '2026-09-10T07:50:00.000Z', hetHanVao: '2026-09-10T08:20:00.000Z' }), T0)).toBe(true)
  })

  it('hết hạn vào nhưng CÒN EM CHƯA NỘP ⇒ vẫn ĐANG CHẠY', () => {
    const c = ca({ batDau: '2026-09-10T07:00:00.000Z', hetHanVao: '2026-09-10T07:30:00.000Z', daVao: 10, daNop: 7 })
    expect(trangThaiCa(c, T0).ten).toBe('Còn em đang làm')
    expect(caConEmDangLam(c, T0)).toBe(true)
  })

  it('cả lớp nộp xong ⇒ KHÔNG còn chạy', () => {
    const c = ca({ batDau: '2026-09-10T07:00:00.000Z', hetHanVao: '2026-09-10T07:30:00.000Z', daVao: 10, daNop: 10 })
    expect(trangThaiCa(c, T0).ten).toBe('Xong')
    expect(caConEmDangLam(c, T0)).toBe(false)
  })

  it('ca đã đóng ⇒ KHÔNG chạy', () => {
    expect(caConEmDangLam(ca({ trangThai: 'dong' }), T0)).toBe(false)
  })

  it('ca chưa tới giờ bắt đầu ⇒ KHÔNG chạy', () => {
    expect(caConEmDangLam(ca({ batDau: '2026-09-10T09:00:00.000Z' }), T0)).toBe(false)
  })

  it('hết hạn vào, KHÔNG em nào vào ⇒ KHÔNG chạy', () => {
    const c = ca({ batDau: '2026-09-10T07:00:00.000Z', hetHanVao: '2026-09-10T07:30:00.000Z', daVao: 0, daNop: 0 })
    expect(trangThaiCa(c, T0).ten).toBe('Hết giờ vào')
    expect(caConEmDangLam(c, T0)).toBe(false)
  })

  it('DÙNG LẠI `trangThaiCa`, không viết luật đếm giờ thứ hai', () => {
    const dau = MAN.indexOf('export function caConEmDangLam(')
    const than = MAN.slice(dau, MAN.indexOf('\n}', dau))
    expect(than).toContain('trangThaiCa(ca, nowMs).ten')
    // Không được tự parse ngày lần nữa trong hàm này.
    expect(than).not.toContain('new Date(')
  })
})

describe('D1 — LỜI CẢNH BÁO PHẢI ĐÚNG SỰ THẬT', () => {
  it('BỎ HẲN câu sai "xoá rồi không khôi phục được"', () => {
    expect(MAN).not.toContain('xoá rồi không khôi phục được')
  })

  it('nói đúng: xoá mềm, khôi phục được, và CHỈ RÕ chỗ khôi phục', () => {
    expect(MAN).toContain('Xoá là xoá mềm: bài làm giữ nguyên, khôi phục lại được ở mục')
    expect(MAN).toContain('Ca đã xoá')
  })

  it('chỗ khôi phục nói tới là CÓ THẬT trên chính màn này', () => {
    expect(MAN).toContain('handleKhoiPhuc')
    expect(MAN).toContain("khoiPhucCa(url.trim(), mat.trim(), maCa)")
  })
})

describe('HỘP THOẠI XOÁ — cảnh báo nặng nhất đứng trước', () => {
  const hop = MAN.slice(MAN.indexOf('{hoiXoa && chonTrongLoc.length > 0 && ('), MAN.indexOf('Huỷ'))

  it('có khối riêng cho ca đang chạy, tone đỏ', () => {
    expect(hop).toContain('{dangChay.length > 0 && (')
    expect(hop).toContain('ca ĐANG CHẠY. Xoá là em đang làm dở không nộp được bài.')
  })

  it('nói việc PHẢI LÀM, không chỉ doạ', () => {
    expect(hop).toContain('Đóng ca trước, hoặc bỏ tích mấy ca này.')
  })

  it('khối ca đang chạy đứng TRƯỚC khối số bài làm', () => {
    expect(hop.indexOf('ĐANG CHẠY')).toBeLessThan(hop.indexOf('Trong đó có bài làm của'))
  })

  it('từng dòng trong danh sách cũng đánh dấu ca đang chạy', () => {
    expect(MAN).toContain("{caConEmDangLam(c, now) ? <b style={{ color: 'var(--do)' }}> · ĐANG CHẠY</b> : ''}")
  })

  it('`dangChay` tính trên ĐÚNG nhóm sắp xoá, không phải cả danh sách', () => {
    expect(MAN).toContain('const dangChay = useMemo(() => chonTrongLoc.filter((c) => caConEmDangLam(c, gioMayChu())), [chonTrongLoc])')
  })
})

describe('CHỐT CŨ KHÔNG ĐƯỢC MẤT — rà soát không được làm hỏng cái đang đúng', () => {
  it('xoá chỉ chạm ca ĐANG HIỆN, bộ lọc giấu ca nào thì ca đó an toàn', () => {
    expect(MAN).toContain('const chonTrongLoc = useMemo(() => dsLoc.filter((c) => daChon.includes(c.maCa)), [dsLoc, daChon])')
    expect(MAN).toContain('const ds = chonTrongLoc.map((c) => c.maCa)')
  })

  it('"Chọn tất cả" cũng chỉ tích ca đang hiện', () => {
    expect(MAN).toContain('onClick={() => setDaChon(tichHet ? [] : dsLoc.map((c) => c.maCa))}')
  })

  it('không tích em nào thì nút Xoá tắt', () => {
    expect(MAN).toContain('disabled={chonTrongLoc.length === 0}')
  })

  it('máy chủ vẫn đòi mã ca xác nhận khớp', () => {
    expect(GS).toContain("if (String(body.xacNhan || '').trim() !== maCa) return jsonResponse_({ ok: false, error: 'Mã ca xác nhận không khớp' })")
  })

  it('xoá xong thoát chế độ chọn và tải lại — không để tích cũ sót lại', () => {
    const than = MAN.slice(MAN.indexOf('const handleXoa = async () => {'), MAN.indexOf('const now = gioMayChu()'))
    expect(than).toContain('thoatChon()')
    expect(than).toContain('await tai()')
  })
})

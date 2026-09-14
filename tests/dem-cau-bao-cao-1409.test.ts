// ĐẾM TỔNG CÂU VÀ SỐ CÂU SAI — ca Test2 (561169), 14/09.
//
// Ca ĐỀ RIÊNG: gói đề `de/561169.json` chứa cả kho 545 câu (I 314 · II 97 ·
// III 134), còn mỗi em chỉ nhận 12 câu (`soCau` I:8 · II:2 · III:2). Bài
// 1,56 điểm của em 12121212 hiện ra sai số câu ở cả ba app.
//
// Nguồn duy nhất hợp lệ của số câu là BẢNG CHẤM `chi_tiet_cau` của chính em.
// Không có bảng chấm thì trả `null` — cấm suy ra từ điểm, cấm số mặc định.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const SRV = doc('server/src/goi-cu.ts')
const HS_MODAL = doc('src/components/BaoCaoCaThiHocSinhModal.tsx')
const PH_MODAL = doc('src/components/BaoCaoCaThiPhuHuynhModal.tsx')

/** Mọi công thức suy số câu từ điểm đã từng tồn tại trong mã. */
const CONG_THUC_BIA = [
  'Math.round((diem / 10) * tongCau)',
  'Math.round((tongDiem / 10) * 28)',
  'Math.min(18, Math.max(0, Math.round(',
  'Math.min(4, Math.max(0, Math.round(',
  'Math.min(6, Math.max(0, Math.round(',
]

describe('MÁY CHỦ — số câu chỉ đến từ bảng chấm', () => {
  const hsLichSu = SRV.slice(SRV.indexOf('export async function hsLichSuCa'), SRV.indexOf('export async function hsLichSuCa') + 4200)

  it('`hsLichSuCa` KHÔNG còn công thức suy số câu từ điểm', () => {
    for (const ct of CONG_THUC_BIA) expect(hsLichSu, ct).not.toContain(ct)
    expect(hsLichSu).not.toContain('tongCau = 28')
  })

  it('`hsLichSuCa` chưa chấm ⇒ trả null cho cả ba số', () => {
    expect(hsLichSu).toContain('const coCham = rawTongCau > 0')
    expect(hsLichSu).toContain('const tongCau = coCham ? rawTongCau : null')
    expect(hsLichSu).toContain('const soCauDung = coCham ? rawSoDung : null')
    expect(hsLichSu).toContain('const soCauSai = coCham ? rawSoSai : null')
  })

  it('`lichSuEm` nay trả đủ hợp đồng ba cổng đang đọc', () => {
    const ham = SRV.slice(SRV.indexOf('export async function lichSuEm'), SRV.indexOf('export async function lichSuEm') + 3600)
    for (const k of ['tongCau:', 'soCauDung:', 'soCauSai:', 'diemI:', 'diemII:', 'diemIII:', 'lanThu:', 'thoiGianPhut:', 'nopLuc,']) {
      expect(ham, k).toContain(k)
    }
    expect(ham).toContain('FROM chi_tiet_cau WHERE sbd = ? AND ma_ca IN')
    expect(ham).toContain('tongCau: d ? d.tong : null')
  })

  it('`hoSoEm` cũng đếm từ bảng chấm, một câu gộp chứ không lặp theo ca', () => {
    const ham = SRV.slice(SRV.indexOf('export async function hoSoEm'), SRV.indexOf('export async function hoSoEm') + 4200)
    expect(ham).toContain('FROM chi_tiet_cau WHERE sbd = ? AND ma_ca IN')
    expect(ham).toContain('tongCau: d ? d.tong : null')
    expect(ham).toContain('soCauSai: d ? d.sai : null')
  })

  it('đếm gộp một câu cho cả danh sách ca — cả lớp mở cổng cùng lúc', () => {
    // GROUP BY ma_ca, không phải một truy vấn mỗi ca.
    expect((SRV.match(/GROUP BY ma_ca/g) || []).length).toBeGreaterThanOrEqual(2)
  })
})

describe('BA APP — không màn nào tự dựng số câu', () => {
  it('báo cáo cổng HỌC SINH bỏ hết công thức suy từ điểm', () => {
    for (const ct of CONG_THUC_BIA) expect(HS_MODAL, ct).not.toContain(ct)
    expect(HS_MODAL).toContain("const tongCau = baiThi.tongCau && baiThi.tongCau > 0 ? baiThi.tongCau : null")
    expect(HS_MODAL).toContain('const coDemCau = tongCau !== null && soDung !== null')
  })

  it('báo cáo cổng PHỤ HUYNH bỏ hết công thức suy từ điểm', () => {
    for (const ct of CONG_THUC_BIA) expect(PH_MODAL, ct).not.toContain(ct)
    expect(PH_MODAL).toContain("const tongCau = baiThi.tongSoCau && baiThi.tongSoCau > 0 ? baiThi.tongSoCau : null")
    expect(PH_MODAL).toContain('const coDemCau = tongCau !== null && soDung !== null')
  })

  it('không màn nào còn số câu gõ cứng 28 hay 40', () => {
    expect(doc('src/screens/HocSinhScreen.tsx')).not.toContain('tongCau: 40')
    expect(doc('src/screens/ExamMonitorScreen.tsx')).not.toContain('.items.length) : 40)')
    for (const f of [HS_MODAL, PH_MODAL]) {
      expect(f).not.toContain('Math.max(28, dsCauSai.length)')
    }
  })

  it('chưa chấm thì GIẤU dòng đếm, không hiện "Đúng 0/0 câu"', () => {
    const SP = doc('src/screens/StudentPortalScreen.tsx')
    expect(SP).toContain("{typeof item.tongCau === 'number' && item.tongCau > 0 && (")
    expect(PH_MODAL).toContain("{coDemCau ? `Đúng ${soDung}/${tongCau} câu` : 'Ca chưa chấm xong'}")
  })

  it('danh sách câu sai THẬT vẫn được dùng khi máy chủ chưa trả số', () => {
    for (const f of [HS_MODAL, PH_MODAL]) {
      expect(f).toContain("dsCauSai.length > 0 ? dsCauSai.length : null")
    }
  })
})

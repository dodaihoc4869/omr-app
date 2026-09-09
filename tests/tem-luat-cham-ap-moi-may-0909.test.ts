// CA 447479 BỊ GHI NGƯỢC LẦN THỨ HAI — đo chiều 09/09 sau khi thầy mở khoá app.
//
// ĐO ĐƯỢC (không phải suy đoán): chấm lại cả ca bằng lõi chấm của app rồi so
// với ô Sheet — **36/36 em đổi**, ô Sheet cao nhất cả ca đúng **4,50** tức trần
// thang tuyệt đối cũ, trong khi thang đúng của ca 24/6/6 cho trần 10,00. Đêm
// 08/09 tôi đã chấm lại chính ca này và đối chiếu 75/75 phiếu khớp. Tức là nó
// bị đè LẠI trong khoảng giữa.
//
// AI ĐÈ ĐƯỢC? Chốt `duocGhiDiem_` bản đầu (08/09) viết:
//
//     function duocGhiDiem_(coMat, body) {
//       if (coMat) return true                       // ← máy có MA_BI_MAT: qua thẳng
//       return String(body.luatDiem || '') === LUAT_DIEM
//     }
//
// Lý do khi đó là "máy thầy thì tin được". Sai. Máy thầy KHÔNG chỉ có một cái:
// điện thoại, tab chưa tải lại, máy tính khác — đều mang mã bí mật, và bản app
// trong đó có thể còn cũ. Màn Ca thi tự ghi điểm cho MỌI em nó chấm được ngay
// khi mở ra (`ExamMonitorScreen`), nên MỘT màn mở trên một máy chạy bản cũ là
// ghi lại cả ca trong một loạt — khớp đúng hình dạng "36/36, toàn thang cũ".
// Ba mươi sáu máy em mỗi máy đè đúng dòng của mình cùng lúc thì khó hơn nhiều.
//
// SIẾT: tem là cửa DUY NHẤT, áp cho mọi máy. Bản app hiện hành gửi tem trong
// MỌI lượt ghi điểm nên siết chỗ này không chặn nhầm đường nào đang dùng.
//
// KHAI RÕ GIỚI HẠN: đây là giả thuyết khớp hình dạng lỗi, KHÔNG phải bằng chứng
// trực tiếp — máy chủ không ghi lại máy nào đã ghi dòng nào. Nhưng lỗ thì có
// thật và tự nó đủ lý do để bịt: một bản app cũ ở bất kỳ đâu, chỉ cần có mã bí
// mật, là đè được toàn bộ bảng điểm mà không ai biết.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { LUAT_DIEM } from '../src/engine/score'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')
const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')

/** Chạy đúng hàm `duocGhiDiem_` của tệp .gs, không chép lại logic. */
function duocGhiDiem_(coMat: boolean, body: unknown): boolean {
  const dau = GS.indexOf('function duocGhiDiem_(')
  expect(dau, 'không thấy duocGhiDiem_').toBeGreaterThan(0)
  let n = 0
  let cuoi = -1
  for (let i = GS.indexOf('{', dau); i < GS.length; i++) {
    if (GS[i] === '{') n++
    else if (GS[i] === '}') {
      n--
      if (n === 0) { cuoi = i + 1; break }
    }
  }
  const ma = GS.slice(dau, cuoi)
  const f = new Function('LUAT_DIEM', `${ma}; return duocGhiDiem_`)(LUAT_DIEM)
  return f(coMat, body)
}

describe('tem luật chấm — áp cho MỌI máy, không chừa máy thầy', () => {
  it('gói MANG đúng tem thì ghi được, dù có mã bí mật hay không', () => {
    expect(duocGhiDiem_(true, { luatDiem: LUAT_DIEM })).toBe(true)
    expect(duocGhiDiem_(false, { luatDiem: LUAT_DIEM })).toBe(true)
  })

  it('TÁI HIỆN LỖ ĐÃ CẮN: máy CÓ mã bí mật nhưng bản CŨ (không tem) ⇒ KHÔNG ghi được', () => {
    expect(duocGhiDiem_(true, {})).toBe(false)
    expect(duocGhiDiem_(true, { luatDiem: '' })).toBe(false)
    expect(duocGhiDiem_(true, { luatDiem: 'tile-cu' })).toBe(false)
  })

  it('máy em bản cũ vẫn bị chặn như trước — không nới ra', () => {
    expect(duocGhiDiem_(false, {})).toBe(false)
    expect(duocGhiDiem_(false, { luatDiem: 'tile-cu' })).toBe(false)
  })

  it('gói rác không làm hàm nổ, và không lọt', () => {
    for (const b of [null, undefined, 0, '', [], { luatDiem: null }, { luatDiem: 0 }]) {
      expect(duocGhiDiem_(true, b)).toBe(false)
      expect(duocGhiDiem_(false, b)).toBe(false)
    }
  })

  it('KHÔNG còn nhánh "có mã bí mật thì qua thẳng"', () => {
    const dau = GS.indexOf('function duocGhiDiem_(')
    const than = GS.slice(dau, dau + 200)
    expect(than).not.toContain('if (coMat) return true')
  })
})

describe('bản app hiện hành gửi tem ở MỌI lượt ghi điểm — siết không chặn nhầm', () => {
  it('ghiDiem gửi tem', () => {
    expect(API).toContain("postJson(scriptUrl, { action: 'ghiDiem', secret, maCa, bai, luatDiem: LUAT_DIEM }")
  })

  it('sendParentFeedback gửi tem', () => {
    const dau = API.indexOf('export async function sendParentFeedback(')
    expect(dau).toBeGreaterThan(0)
    const than = API.slice(dau, API.indexOf('export async function pushExamStatus', dau))
    expect(than).toContain("action: 'sendFeedback'")
    expect(than).toContain('luatDiem: LUAT_DIEM')
  })

  it('tem ở client và tem ở máy chủ là CÙNG một chuỗi', () => {
    const m = GS.match(/const LUAT_DIEM = '([^']+)'/)
    expect(m, 'máy chủ không khai LUAT_DIEM').toBeTruthy()
    expect(m![1]).toBe(LUAT_DIEM)
  })
})

describe('lượt bị chặn phải BÁO RA, không im lặng', () => {
  it('ghiDiem đẩy lý do vào tuChoi để màn thầy đọc được', () => {
    expect(GS).toContain("tuChoi.push(sbd + ': bản app cũ, chỉ nhận chi tiết câu — điểm giữ nguyên')")
  })

  it('sendFeedback trả boQua rõ ràng thay vì giả vờ đã ghi', () => {
    expect(GS).toContain("boQua: 'ban_cu'")
  })

  it('chi tiết TỪNG CÂU vẫn nhận — chỉ cột điểm bị giữ lại', () => {
    // Khối ghi chi tiết câu nằm NGOÀI nhánh `if (duocGhiDiem_(...))`.
    const dau = GS.indexOf('if (duocGhiDiem_(coMat, body)) {')
    expect(dau).toBeGreaterThan(0)
    const sau = GS.slice(dau, dau + 900)
    expect(sau).toContain("tuChoi.push(sbd + ': bản app cũ")
    // Vòng gom dòng chi tiết cũ đứng SAU khối if/else, tức luôn chạy.
    expect(sau.indexOf('xoaDong.push(i + 1)')).toBeGreaterThan(sau.indexOf("tuChoi.push(sbd + ': bản app cũ"))
  })

  it('mã .gs vẫn hợp lệ cú pháp sau khi siết', () => {
    expect(() => new Function(GS)).not.toThrow()
  })
})

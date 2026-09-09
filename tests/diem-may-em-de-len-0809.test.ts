// "ĐIỂM 9 NHƯNG PHIẾU LẠI GHI ĐIỂM 4" — thầy báo tối 08/09, ca 447479.
//
// ĐO ĐƯỢC TRÊN MÁY CHỦ, không phải suy đoán:
//   · 36/36 điểm cất trong LuotThi đều ≤ 4,50; đúng ba em chạm trần 4,50.
//     4,50 = 8×0,25 + 2×1,00 + 2×0,25 — TRẦN của thang TUYỆT ĐỐI cũ áp lên ca
//     8/2/2. Luật chấm hiện hành cho ca 8/2/2 có trần đúng 10,00.
//   · Chấm lại bằng luật hiện hành trên chính máy thầy: 12021 4 → 9,00 ·
//     12054 3,5 → 7,88 · 12030 3 → 6,44 — khớp từng con số với ba ảnh thầy gửi.
//
// NGUYÊN NHÂN GỐC: máy HỌC SINH cũng được đặt điểm chính thức lên Sheet.
//   · `sendFeedback` ghi thẳng LuotThi cột 14..17 mà KHÔNG kiểm gì cả.
//   · `ghiDiem` nhận máy em qua `idThietBi`.
// Máy nào còn bản app trước 07/09 chấm bằng thang tuyệt đối cũ, và mỗi lần em
// mở lại trang kết quả (`apDungKeyBank` chạy lại) là điểm thầy vừa chấm lại bị
// đè về số cũ. Thầy chấm lại buổi chiều, tối vào xem thì cả ca lại sai.
//
// CHỐT CHẶN: tem luật chấm `LUAT_DIEM`. Máy chủ chỉ nhận ĐIỂM từ máy em khi tem
// khớp; bản cũ không gửi tem nên điểm bị từ chối, còn chi tiết từng câu vẫn
// nhận (chuyên đề, mức độ, giây làm không phụ thuộc luật chấm).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { LUAT_DIEM, quotaPhan, scoreStudent, type AnswerKey, type StudentAnswers } from '../src/engine/score'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')
const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')

/** Lấy nguyên văn một hàm trong .gs rồi chạy thật — kiểm chính đoạn mã sẽ dán
 * lên máy chủ, không kiểm một bản chép tay của nó. */
function layHam(ten: string): string {
  const dau = GS.indexOf(`function ${ten}(`)
  if (dau < 0) throw new Error(`Không thấy hàm ${ten} trong apps-script-kiem-tra.gs`)
  let sau = dau
  let ngoac = 0
  let daVao = false
  while (sau < GS.length) {
    const c = GS[sau]
    if (c === '{') {
      ngoac++
      daVao = true
    } else if (c === '}') {
      ngoac--
      if (daVao && ngoac === 0) return GS.slice(dau, sau + 1)
    }
    sau++
  }
  throw new Error(`Hàm ${ten} không đóng ngoặc`)
}

/** Hằng `LUAT_DIEM` đọc thẳng từ .gs — không chép tay, không tin trí nhớ. */
function temMayChu(): string {
  const m = GS.match(/^const LUAT_DIEM = '([^']+)'$/m)
  if (!m) throw new Error('Không thấy hằng LUAT_DIEM trong apps-script-kiem-tra.gs')
  return m[1]
}

const duocGhiDiem = new Function(
  `const LUAT_DIEM = '${temMayChu()}'\n${layHam('duocGhiDiem_')}\nreturn duocGhiDiem_`,
)() as (coMat: boolean, body: unknown) => boolean

describe('TEM LUẬT CHẤM — hai đầu phải khớp từng ký tự', () => {
  it('hằng ở app và hằng ở máy chủ là MỘT chuỗi', () => {
    expect(temMayChu()).toBe(LUAT_DIEM)
  })

  // VIẾT LẠI 09/09 chiều, KHÔNG XOÁ LẶNG. Bản cũ đòi ĐÚNG điều đã hoá ra là lỗ:
  // "máy thầy (có mã bí mật) luôn ghi được, không cần tem". Giả định đằng sau là
  // "máy thầy thì bản app luôn mới" — sai, vì máy thầy không chỉ có một cái:
  // điện thoại, tab chưa tải lại, máy tính khác đều mang mã bí mật.
  //
  // ĐO ĐƯỢC chiều 09/09: ca 447479 bị ghi ngược LẦN THỨ HAI sau khi đã chấm lại
  // đêm trước — 36/36 em, ô Sheet cao nhất đúng 4,50 tức trần thang cũ. Màn Ca
  // thi tự ghi điểm cả ca ngay khi mở, nên MỘT màn mở trên một máy thầy chạy bản
  // cũ là đè lại toàn bộ trong một loạt, và chốt này cho qua thẳng.
  //
  // Ý ĐỊNH của phép kiểm cũ (đừng chặn nhầm đường thầy đang dùng) vẫn giữ, nhưng
  // bảo đảm theo cách khác: bản app hiện hành gửi tem trong MỌI lượt ghi điểm,
  // nên đòi tem ở mọi máy không chặn nhầm gì — xem `tem-luat-cham-ap-moi-may-0909`.
  it('máy thầy chạy bản MỚI (có tem) vẫn ghi được', () => {
    expect(duocGhiDiem(true, { luatDiem: LUAT_DIEM })).toBe(true)
  })

  it('máy thầy chạy bản CŨ (không tem) KHÔNG còn được qua thẳng', () => {
    expect(duocGhiDiem(true, {})).toBe(false)
    expect(duocGhiDiem(true, { luatDiem: 'linh tinh' })).toBe(false)
  })

  it('máy em bản MỚI (đúng tem) ghi được', () => {
    expect(duocGhiDiem(false, { luatDiem: LUAT_DIEM })).toBe(true)
  })

  it('máy em bản CŨ (không tem) KHÔNG ghi được — đây là chỗ chặn lỗi 08/09', () => {
    expect(duocGhiDiem(false, {})).toBe(false)
    expect(duocGhiDiem(false, { luatDiem: '' })).toBe(false)
    expect(duocGhiDiem(false, { luatDiem: undefined })).toBe(false)
  })

  it('tem của một luật chấm KHÁC cũng bị chặn', () => {
    expect(duocGhiDiem(false, { luatDiem: 'tuyet-doi-025-100-025' })).toBe(false)
    expect(duocGhiDiem(false, { luatDiem: LUAT_DIEM + 'x' })).toBe(false)
  })
})

describe('MÁY CHỦ: hai đường ghi điểm đều đi qua cổng', () => {
  // VIẾT LẠI 09/09 chiều, KHÔNG XOÁ LẶNG. Bản cũ đòi cột điểm nằm NGAY trong
  // nhánh `if (duocGhiDiem_(...))`. Nay có thêm chốt thứ hai — mẫu số — nên
  // hình dạng là if / else if / else. Ý ĐỊNH giữ nguyên và còn mạnh hơn: cột
  // điểm chỉ được ghi ở NHÁNH CUỐI, sau khi qua ĐỦ mọi chốt.
  it('ghiDiem: cột điểm chỉ ghi sau khi qua ĐỦ chốt tem VÀ chốt mẫu số', () => {
    const than = GS.slice(GS.indexOf("if (action === 'ghiDiem')"), GS.indexOf("if (action === 'submit')"))
    const viTem = than.indexOf('if (!duocGhiDiem_(coMat, body))')
    const viMauSo = than.indexOf('} else if (!mauSo.khop) {')
    const viGhi = than.indexOf('sh.getRange(row, 14, 1, 4).setValues')
    expect(viTem).toBeGreaterThan(0)
    expect(viMauSo).toBeGreaterThan(viTem)
    expect(viGhi).toBeGreaterThan(viMauSo)
  })

  it('ghiDiem: chi tiết từng câu VẪN ghi cho bản cũ (không mất dữ liệu chuyên đề)', () => {
    const than = GS.slice(GS.indexOf("if (action === 'ghiDiem')"), GS.indexOf("if (action === 'submit')"))
    // Vòng dựng `themDong` phải nằm NGOÀI nhánh điểm.
    const viDiem = than.indexOf('if (!duocGhiDiem_(coMat, body))')
    const viDongNhanh = than.indexOf('tuChoi.push(sbd + \': bản app cũ')
    const viThemDong = than.indexOf('themDong.push([maCa, sbd, lanThu')
    expect(viDiem).toBeGreaterThan(0)
    expect(viThemDong).toBeGreaterThan(viDongNhanh)
  })

  it('ghiDiem: bản cũ được BÁO ra tuChoi, không im lặng bỏ qua', () => {
    expect(GS).toContain("tuChoi.push(sbd + ': bản app cũ, chỉ nhận chi tiết câu — điểm giữ nguyên')")
  })

  it('sendFeedback: KHÔNG còn ghi LuotThi khi chưa qua cổng', () => {
    const than = GS.slice(GS.indexOf("if (action === 'sendFeedback')"), GS.indexOf("if (action === 'examStatus')"))
    expect(than).toContain('const coMatNX = !kiemTraMaBiMat_(body)')
    expect(than).toContain("if (!duocGhiDiem_(coMatNX, body)) {")
    // Nhánh chặn phải nằm TRƯỚC mọi lệnh ghi.
    const viChan = than.indexOf('if (!duocGhiDiem_(coMatNX, body))')
    expect(viChan).toBeGreaterThan(0)
    expect(than.indexOf('getRange(luotNX.row, 14, 1, 4)')).toBeGreaterThan(viChan)
    expect(than.indexOf('sh.appendRow(rowData)')).toBeGreaterThan(viChan)
  })

  it('sendFeedback: máy lạ KHÔNG đặt được điểm cho em khác (lỗ hổng cũ)', () => {
    const than = GS.slice(GS.indexOf("if (action === 'sendFeedback')"), GS.indexOf("if (action === 'examStatus')"))
    expect(than).toContain("String(body.idThietBi) === String(luotNX.idThietBi)")
    expect(than).toContain("lyDo: 'khong_co_quyen'")
  })
})

describe('MÁY EM: gói gửi lên mang đủ tem và id thiết bị', () => {
  // Bản cũ khoá nguyên văn gói gửi đi. Gói nay mang thêm `soCau` (mẫu số đã
  // dùng) nên chuỗi đổi — ý định "phải có tem" thì giữ nguyên.
  it('ghiDiem gửi luatDiem', () => {
    expect(API).toContain("{ action: 'ghiDiem', secret, maCa, bai, luatDiem: LUAT_DIEM, soCau }")
  })

  it('sendFeedback gửi luatDiem và idThietBi', () => {
    const than = API.slice(API.indexOf('export async function sendParentFeedback'), API.indexOf('export async function pushExamStatus'))
    expect(than).toContain('luatDiem: LUAT_DIEM')
    expect(than).toContain('idThietBi,')
  })

  it('màn làm bài TRUYỀN id thiết bị của chính lượt vào sendParentFeedback', () => {
    const than = MAN.slice(MAN.indexOf('sendParentFeedback('), MAN.indexOf('sendParentFeedback(') + 900)
    expect(than).toContain('done.idThietBi ?? layIdThietBi()')
  })
})

// ---------------------------------------------------------------------------
// SỐ HỌC: chứng minh 4,50 KHÔNG thể là điểm của luật hiện hành
// ---------------------------------------------------------------------------
function baiHoanHao(soCau: { I: number; II: number; III: number }): { sa: StudentAnswers; key: AnswerKey } {
  const key: AnswerKey = {
    madeThi: 'x',
    phanI: Array.from({ length: soCau.I }, () => 'A' as const),
    phanII: Array.from({ length: soCau.II }, () => ['D', 'D', 'D', 'D'] as ('D' | 'S')[]),
    phanIII: Array.from({ length: soCau.III }, (_, i) => String(i + 1)),
  }
  const sa: StudentAnswers = {
    sbd: '1',
    madeThi: 'x',
    phanI: key.phanI.map((v) => ({ value: v, flag: null })),
    phanII: key.phanII.map((r) => r.map((v) => ({ value: v, flag: null }))),
    phanIII: key.phanIII.map((v) => ({ value: v, flag: null })),
  }
  return { sa, key }
}

describe('TRẦN 4,50 là chữ ký của thang cũ, không phải của luật hiện hành', () => {
  it('ca 8/2/2 làm đúng hết được ĐÚNG 10,00 — không phải 4,50', () => {
    const { sa, key } = baiHoanHao({ I: 8, II: 2, III: 2 })
    expect(scoreStudent(sa, key).total).toBe(10)
  })

  it('4,50 chính là trần thang tuyệt đối cũ áp lên ca 8/2/2', () => {
    // 8 câu × 0,25 + 2 câu × 1,00 + 2 câu × 0,25
    expect(8 * 0.25 + 2 * 1.0 + 2 * 0.25).toBe(4.5)
  })

  it('ca đủ 18/4/6 thì hai thang trùng nhau — nên ca cũ không đổi điểm', () => {
    const { sa, key } = baiHoanHao({ I: 18, II: 4, III: 6 })
    expect(scoreStudent(sa, key).total).toBe(10)
    expect(quotaPhan({ I: 18, II: 4, III: 6 })).toEqual({ I: 450, II: 400, III: 150 })
    expect(18 * 0.25 + 4 * 1.0 + 6 * 0.25).toBe(10)
  })
})

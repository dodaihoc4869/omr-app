// THẦY BẤM BẮT ĐẦU Ở PHÒNG CHỜ — cú dồn lớn nhất của cả ca.
//
// Thầy báo 11/09: "bấm duyệt bắt đầu ở phòng chờ, rất chậm và học sinh bị văng
// ra thử lại nhiều lần".
//
// VÌ SAO ĐÂY LÀ CHỖ TỆ NHẤT, tệ hơn lúc em tự bấm Vào thi: em tự bấm thì rải ra
// theo tay từng em. Ở phòng chờ thì MÁY bấm hộ — ba mươi máy hỏi
// `trangThaiPhongCho` mỗi 3 giây, thầy bấm một cái là trong đúng một nhịp 3
// giây cả ba mươi máy cùng thấy `batDau` và cùng gọi `vaoThi`. Mà `vaoThi` là
// lệnh DUY NHẤT phải cầm khoá toàn cục để ghi dòng lượt.
//
// Hai lỗi đã sửa, cả hai nằm ở máy em:
//   ① cú giãn 0–3 giây chỉ chạy LẦN ĐẦU trong phiên, mà em vào phòng chờ đã
//      tiêu mất lần ấy ⇒ đúng lúc cần thì không còn giãn;
//   ② `handleJoin` hỏng là ném em về màn lỗi, bắt tự bấm lại ⇒ lượt bấm lại nối
//      vào cuối chính hàng đợi đang tắc.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { GIAN_VAO_SAU_BAT_DAU_MS, gianVaoSauBatDau, laLoiDongNguoi } from '../src/lib/nhip-gui-lai'

const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')

/** Vùng khoá của `vaoThi` sau T3: tra một dòng + ghi một dòng. */
const KHOA_GIAY = 0.4
/** Hạn chờ của `vaoThi` sau T5. */
const HAN_GIAY = 30

/** Mô phỏng N máy cùng thấy `batDau`, đo em cuối hàng phải chờ bao lâu.
 *
 * Khoá là TOÀN CỤC nên các lượt ghi nối đuôi nhau: lượt thứ k chỉ bắt đầu ghi
 * khi lượt k-1 nhả khoá. Em bị "văng ra" khi tổng thời gian chờ của em vượt hạn. */
function moPhong(soMay: number, gianMs: () => number) {
  const khoiHanh = Array.from({ length: soMay }, () => gianMs() / 1000).sort((a, b) => a - b)
  let khoaRanhLuc = 0
  let vangRa = 0
  let choLauNhat = 0
  for (const t of khoiHanh) {
    const batDauGiuKhoa = Math.max(t, khoaRanhLuc)
    const xongLuc = batDauGiuKhoa + KHOA_GIAY
    const emPhaiCho = xongLuc - t
    if (emPhaiCho > HAN_GIAY) vangRa += 1
    choLauNhat = Math.max(choLauNhat, emPhaiCho)
    khoaRanhLuc = xongLuc
  }
  return { vangRa, choLauNhat: Number(choLauNhat.toFixed(1)) }
}

describe('CÚ DỒN LÚC BẤM BẮT ĐẦU', () => {
  it('BẢN CŨ — không giãn: cả lớp khởi hành trong một nhịp hỏi 3 giây', () => {
    const cu = moPhong(30, () => Math.random() * 3000)
    // eslint-disable-next-line no-console
    console.log(`[phòng chờ] 30 em · KHÔNG giãn · em cuối chờ ${cu.choLauNhat}s · văng ra ${cu.vangRa}`)
    // Không khẳng định bản cũ luôn văng ở 30 em — nó ở sát mép, và chính chỗ
    // "sát mép" ấy là lý do thầy thấy lúc được lúc không.
    expect(cu.choLauNhat).toBeGreaterThan(8)
  })

  it('BẢN MỚI — giãn 8 giây: em cuối chờ ÍT HƠN HẲN', () => {
    const moi = moPhong(30, gianVaoSauBatDau)
    const cu = moPhong(30, () => Math.random() * 3000)
    // eslint-disable-next-line no-console
    console.log(`[phòng chờ] 30 em · giãn 8s · em cuối chờ ${moi.choLauNhat}s · văng ra ${moi.vangRa}`)
    expect(moi.choLauNhat).toBeLessThan(cu.choLauNhat)
    expect(moi.vangRa).toBe(0)
  })

  it('LỚP 50 EM — chỗ bản cũ chắc chắn gãy, bản mới vẫn trong hạn', () => {
    let cuTeNhat = 0
    let moiTeNhat = 0
    let moiVang = 0
    for (let i = 0; i < 200; i++) {
      cuTeNhat = Math.max(cuTeNhat, moPhong(50, () => Math.random() * 3000).choLauNhat)
      const m = moPhong(50, gianVaoSauBatDau)
      moiTeNhat = Math.max(moiTeNhat, m.choLauNhat)
      moiVang += m.vangRa
    }
    // eslint-disable-next-line no-console
    console.log(`[phòng chờ] 50 em · 200 lượt mô phỏng · cũ tệ nhất ${cuTeNhat}s · mới tệ nhất ${moiTeNhat}s · mới văng ${moiVang}`)
    expect(moiTeNhat).toBeLessThan(cuTeNhat)
    expect(moiVang).toBe(0)
  })

  it('cửa sổ giãn là 8 giây, và KHÔNG ăn vào giờ làm bài của em', () => {
    expect(GIAN_VAO_SAU_BAT_DAU_MS).toBe(8000)
    for (let i = 0; i < 300; i++) {
      const v = gianVaoSauBatDau()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(GIAN_VAO_SAU_BAT_DAU_MS)
    }
    // Đồng hồ của em chỉ chạy từ lúc MÁY CHỦ tạo lượt (`hetGioLuc` do máy chủ
    // đặt), nên chờ ở máy em không ăn vào giờ của ai. Canh bằng mã nguồn.
    expect(MAN).toContain('hetGioCua(attempt)')
  })

  it('30 máy giãn ra thành 30 mốc khác nhau, không dồn một khoảnh khắc', () => {
    const ds = Array.from({ length: 30 }, () => gianVaoSauBatDau())
    expect(new Set(ds).size).toBeGreaterThan(25)
    expect(Math.max(...ds) - Math.min(...ds)).toBeGreaterThan(3000)
  })
})

describe('KHÔNG NÉM EM RA — máy tự thử lại', () => {
  it('có vòng thử lại riêng cho đường phòng chờ', () => {
    expect(MAN).toContain('const vaoSauBatDau = async ()')
    expect(MAN).toContain('gianVaoSauBatDau()')
    expect(MAN).toContain('choBaoLau(lan - 1)')
  })

  it('vòng thử lại đứng ở CẤP COMPONENT, không nằm trong effect phòng chờ', () => {
    // Effect ấy phụ thuộc `phase`, mà `handleJoin` đổi `phase` sang 'loading'
    // ngay câu đầu ⇒ effect bị dọn và vòng thử lại chết ngay lần thử thứ nhất.
    const iHam = MAN.indexOf('const vaoSauBatDau = async ()')
    const iEffect = MAN.indexOf("if (phase !== 'cho') return")
    expect(iHam).toBeGreaterThan(0)
    expect(iEffect).toBeGreaterThan(iHam)
  })

  it('CHỈ thử lại lỗi đường truyền, KHÔNG thử lại lỗi em bị chặn thật', () => {
    for (const s of [
      'Không kết nối được máy chủ — cần mạng để vào thi. Kiểm tra mạng rồi bấm Vào thi lại.',
      'Máy chủ không trả lời sau 30 giây. Kiểm tra mạng rồi thử lại.',
      'Máy chủ đang bận — máy em giữ bài và gửi lại',
      'Máy chủ trả lỗi HTTP 503',
    ]) {
      expect(laLoiDongNguoi(s), s).toBe(true)
    }
    for (const s of [
      'Số báo danh, họ tên hoặc năm sinh không khớp danh sách lớp',
      'Ca đã khoá — bài của em đã được nộp theo phần đã làm',
      'Không tìm thấy ca kiểm tra — kiểm tra lại mã ca',
      'Chưa có link kết nối — mở đúng link thầy gửi.',
    ]) {
      expect(laLoiDongNguoi(s), s).toBe(false)
    }
  })

  it('có TRẦN số lần thử — hỏng mãi thì nói thật, không quay vòng vô tận', () => {
    const i = MAN.indexOf('const vaoSauBatDau = async ()')
    const than = MAN.slice(i, i + 1800)
    expect(than).toMatch(/lan < 6/)
    expect(than).toContain('Chưa vào được sau nhiều lần thử')
  })

  it('thấy `batDau` rồi thì NGỪNG hỏi phòng chờ — mỗi lượt thừa là một lượt tranh chỗ', () => {
    const i = MAN.indexOf("if (phase !== 'cho') return")
    const than = MAN.slice(i, i + 2600)
    expect(than).toContain('if (dangVaoSauBatDauRef.current) return')
  })

  it('không bắn hai vòng thử lại chồng nhau', () => {
    const i = MAN.indexOf('const vaoSauBatDau = async ()')
    const than = MAN.slice(i, i + 500)
    expect(than).toContain('if (dangVaoSauBatDauRef.current) return')
    expect(than).toContain('dangVaoSauBatDauRef.current = true')
  })
})

// ĐƯỜNG NHANH CHI TIẾT CA CHƯA TỪNG CHẠY — đo 19h05 ngày 11/09, ngay sau khi
// phát hành đợt 5D.
//
// Tra thẳng D1:
//
//     SELECT COUNT(*), SUM(sinh_tai_d1) FROM ca    →  88 ca, 0 ca có cờ
//     SELECT COUNT(tong), COUNT(ho_ten) FROM luot  →  311 lượt, 0 điểm, 0 tên
//
// Cờ `sinh_tai_d1` chỉ đặt cho ca mở TỪ NAY, nên `chiTietCaMoi` trả
// `dayDu: false` cho tất cả 88 ca và máy thầy rơi về Apps Script mọi lần. Thầy
// quay màn hình: bấm chi tiết ca mất **7 giây**, đúng như trước khi làm.
//
// Bài học lặp lại lần thứ ba trong ngày: **đường nhanh có mặt trong mã không
// có nghĩa là nó chạy.** Phải đếm ở chỗ dữ liệu đọng lại mới biết.
//
// Chữa bằng TỰ CHỮA LÀNH thay vì một lượt chuyển 88 ca (lượt ấy chết ở ca thứ
// 6 lúc 15h46 hôm nay): máy thầy vừa đi đường cũ xong là đã cầm gói đầy đủ —
// gửi luôn sang D1 rồi đặt cờ. Lần sau mở chính ca đó là tức thì.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const WK = fs.readFileSync(path.join(process.cwd(), 'server/src/index.ts'), 'utf8')
const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
const DAY = fs.readFileSync(path.join(process.cwd(), 'src/lib/day-ca-may-chu-moi.ts'), 'utf8')

describe('WORKER — `/ca/nap-day-du`', () => {
  const HAM = WK.slice(WK.indexOf('async function napDayDuCa('), WK.indexOf('/** Mốc thời gian thành mili giây'))

  it('có đường, nằm trong khối đòi mã bí mật', () => {
    expect(WK).toContain("if (p === '/ca/nap-day-du')")
    expect(WK.indexOf("p === '/ca/nap-day-du'")).toBeGreaterThan(WK.indexOf('if (!laThay(req, env, b))'))
  })

  it('TỪ CHỐI ca ĐANG CHẠY — đó là lúc D1 mới hơn Sheet', () => {
    // 19h45 cùng ngày: cửa này từng so nhãn `trang_thai = 'mo'`. Kho của thầy
    // có 12 ca mang nhãn ấy từ mấy hôm trước, chưa bao giờ đóng — chúng không
    // chạy, mà vĩnh viễn không được chữa lành. Nay tính bằng đồng hồ.
    expect(HAM).toContain('if (caDangChay(ca))')
    expect(HAM).toContain("lyDo: 'ca_dang_chay'")
    // và phải từ chối TRƯỚC khi ghi dòng nào
    expect(HAM.indexOf("lyDo: 'ca_dang_chay'")).toBeLessThan(HAM.indexOf('INSERT INTO luot'))
  })

  it('TUYỆT ĐỐI không đụng `da_day_sheet` — cờ ấy nói bài đã VỀ Sheet chưa', () => {
    // LỖI NẶNG NHẤT tối 11/09: bản đầu đặt cờ này = 1 vì "dòng đọc từ Sheet ra
    // thì đã có trên Sheet". Sai: cờ nói lượt ĐỒNG BỘ NGƯỢC đã đưa bài của em
    // về Sheet chưa. Đặt bừa là `dong-bo-nguoc` bỏ qua lượt ấy vĩnh viễn — em
    // nộp bài xong bấm xem điểm thì nghe "Em chưa nộp bài ca này", và điểm mất
    // khỏi đường ra Excel lẫn đường gửi Zalo.
    const ghi = HAM.slice(HAM.indexOf('INSERT INTO luot'), HAM.indexOf(').bind(', HAM.indexOf('INSERT INTO luot')))
    expect(ghi).not.toContain('da_day_sheet=1')
    expect(ghi).not.toContain('da_day_sheet=excluded')
  })

  it('ca chưa có trên D1 thì KHÔNG tự dựng — không đẻ ca rỗng', () => {
    expect(HAM).toContain('if (!ca) return ra({ ok: true, coCa: false, daDat: false })')
  })

  it('TUYỆT ĐỐI không đụng bài làm em đã ghi thẳng lên D1', () => {
    // Cắt ĐÚNG câu SQL, dừng ở `).bind(`. Cắt rộng hơn là ăn cả lời ghi chú
    // ngay dưới — mà lời ghi chú ấy có nhắc đúng ba tên cột này để dặn người
    // sau đừng đụng vào. Bắt cả lời dặn là bắt nhầm; hôm nay tôi đã dính đúng
    // lỗi ấy một lần ở phép kiểm `cau-hinh.json`.
    const ghi = HAM.slice(HAM.indexOf('INSERT INTO luot'), HAM.indexOf(').bind(', HAM.indexOf('INSERT INTO luot')))
    for (const cot of ['dap_an_json', 'giay_cau_json', 'integrity_json']) {
      expect(ghi, cot).not.toContain(cot)
    }
  })

  it('chuỗi rỗng và điểm rỗng KHÔNG xoá giá trị đang có', () => {
    for (const cot of ['ho_ten', 'ghi_chu', 'nop_luc', 'duyet_boi']) {
      expect(HAM, cot).toContain(`${cot}=COALESCE(NULLIF(excluded.${cot},''), luot.${cot})`)
    }
    for (const cot of ['diem_i', 'diem_ii', 'diem_iii', 'tong']) {
      expect(HAM, cot).toContain(`${cot}=COALESCE(excluded.${cot}, luot.${cot})`)
    }
  })

  it('số lần rời màn lấy số LỚN HƠN — không bao giờ đếm thiếu vi phạm', () => {
    expect(HAM).toContain('so_lan_roi_man=MAX(excluded.so_lan_roi_man, luot.so_lan_roi_man)')
    expect(HAM).toContain('tong_giay_roi_man=MAX(excluded.tong_giay_roi_man, luot.tong_giay_roi_man)')
  })

  it('đặt cờ `sinh_tai_d1` SAU khi đã ghi xong lượt', () => {
    expect(HAM).toContain('UPDATE ca SET sinh_tai_d1 = 1')
    expect(HAM.indexOf('await env.DB.batch')).toBeLessThan(HAM.indexOf('UPDATE ca SET sinh_tai_d1 = 1'))
  })
})

describe('MÁY THẦY — chữa lành ngay trong lượt đọc đường cũ', () => {
  it('`chiTietCa` gửi gói vừa đọc được sang máy chủ mới', () => {
    const i = API.indexOf('export async function chiTietCa(')
    const than = API.slice(i, API.indexOf('/** GHI KẾT QUẢ CHỮA BÀI TRÊN BẢNG', i))
    expect(than).toContain('await napDayDuCaMoi(')
    expect(than).toContain('luotSheet as unknown as Record<string, unknown>[]')
  })

  it('KHÔNG chờ và KHÔNG ném lỗi — đây là đường tắt cho lần sau', () => {
    const i = API.indexOf('await napDayDuCaMoi(')
    const khoi = API.slice(i - 400, i + 500)
    expect(khoi).toContain('void (async () => {')
    expect(khoi).toContain('} catch {')
  })

  it('gửi bản đọc từ SHEET, không gửi bản đã trộn với D1', () => {
    // `luotGop` có thể mang dòng do chính D1 sinh ra; gửi ngược lại là thừa và
    // dễ ghi đè nhầm. `luotSheet` mới là thứ D1 đang thiếu.
    const i = API.indexOf('await napDayDuCaMoi(')
    expect(API.slice(i, i + 300)).toContain('luotSheet')
  })

  it('máy chủ mới tắt cờ thì thôi, không kêu gì', () => {
    const han = DAY.slice(DAY.indexOf('export async function napDayDuCaMoi('), DAY.length)
    expect(han).toContain('if (!ch.BAT || !ch.URL || !maCa || luot.length === 0) return false')
  })
})

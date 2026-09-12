// PHÒNG CHỜ KHÔNG ĐƯỢC TREO — luật viết 11/09, VIẾT LẠI 12/09 sau khi cắt Google.
//
// LUẬT CŨ (11/09), khi còn HAI nơi giữ mốc bắt đầu:
//   Apps Script giữ một bản, D1 giữ một bản. Lượt đẩy mốc sang D1 nằm trong
//   `try {} catch {}` không đọc kết quả, chập mạng một nhịp là trượt — D1 còn
//   `bat_dau_thi_luc` rỗng, `/phong-cho` trả `batDau: false`, cả lớp đứng chờ
//   vĩnh viễn mà không một dòng lỗi nào hiện ra. Chốt chặn khi ấy là ĐỐI CHIẾU:
//   máy em bảo "chưa bắt đầu" thì cứ 90 giây hỏi lại đường cũ một lần.
//
// LUẬT MỚI (12/09): CHỈ CÒN MỘT NƠI GIỮ MỐC — bảng `ca` trong D1.
//   Đối chiếu bây giờ là gọi ĐÚNG MỘT máy chủ hai lần cho cùng một câu trả lời,
//   tức nhân đôi tải đúng vào lúc đông người nhất. Nên bỏ. Cú treo cũ không thể
//   tái diễn vì không còn hai bản để lệch nhau.
//
// `src/lib/doi-chieu-phong-cho.ts` từ nay KHÔNG còn chỗ nào trong `src/` dùng
// tới; phép kiểm dưới canh đúng điều đó, để không ai nối lại nhầm.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const API = doc('src/lib/exam-api.ts')
const MAN = doc('src/screens/ExamMonitorScreen.tsx')

describe('VẾ 1 — MỘT nguồn sự thật cho mốc bắt đầu', () => {
  it('phòng chờ hỏi MỘT lượt rồi tin, không đối chiếu', () => {
    expect(API).toContain('const rMoi = await phongChoMoi(chMoi, maCa)')
    expect(API).toContain('if (rMoi) return rMoi')
  })

  it('không còn cửa đối chiếu nào trong đường phòng chờ', () => {
    expect(API).not.toContain('nenDoiChieu')
    expect(API).not.toContain('ghiNhoDaBatDauDuongCu')
    expect(API).not.toContain('daBatDauTheoDuongCu')
  })

  it('không màn nào trong src/ còn nhập module đối chiếu', () => {
    const nhap: string[] = []
    const quet = (thuMuc: string) => {
      for (const ten of fs.readdirSync(path.join(process.cwd(), thuMuc))) {
        const duong = `${thuMuc}/${ten}`
        if (fs.statSync(path.join(process.cwd(), duong)).isDirectory()) quet(duong)
        else if (/\.tsx?$/.test(ten) && duong !== 'src/lib/doi-chieu-phong-cho.ts') {
          if (/from '.*doi-chieu-phong-cho'/.test(doc(duong))) nhap.push(duong)
        }
      }
    }
    quet('src')
    expect(nhap).toEqual([])
  })
})

describe('VẾ 2 — VÀO THI phải trả lời thật, cấm bỏ cuộc im lặng', () => {
  // Ca Test6 (455713) tối 11/09: ca lành, R2 có `de/455713.json`, bản đồ đề
  // riêng có đủ em 12121212 — em vẫn đọc "Máy chủ chưa gửi đề". Vì ca đặt công
  // bố `ca_lop_xong`, và dòng `if (... === 'ca_lop_xong') return null` bắt lượt
  // ấy "đi đường cũ" — trong khi đường cũ đã bị gỡ và chỉ trả `deUrl`, không
  // trả gói đề.
  const than = API.slice(
    API.indexOf('async function vaoThiQuaMayChuMoi('),
    API.indexOf('export async function vaoThi('),
  )

  it('khoanh đúng được thân hàm', () => {
    expect(than.length).toBeGreaterThan(500)
  })

  it('KHÔNG còn một câu `return null` nào trong thân hàm', () => {
    expect(than).not.toContain('return null')
  })

  it('chế độ công bố `ca_lop_xong` KHÔNG còn bị chặn — cổng ấy nay nằm ở D1', () => {
    expect(than).not.toContain("'ca_lop_xong'")
  })

  it('ca đề riêng thiếu phần của em ⇒ TỪ CHỐI có lý do, không phát đề sai', () => {
    expect(than).toContain("return { ok: false, lyDo: 'thieu_bo_cau' }")
  })

  it('thiếu đề, tải hỏng, gói hỏng ⇒ mỗi thứ một câu nói rõ việc phải làm', () => {
    expect(than).toContain('Ca này chưa được phát đề')
    expect(than).toContain('Không tải được đề')
    expect(than).toContain('Gói đề tải về bị hỏng')
  })

  it('`vaoThi` không còn đường lùi nào khác', () => {
    const ngoai = API.slice(API.indexOf('export async function vaoThi('))
    const het = ngoai.indexOf('\n}\n')
    expect(ngoai.slice(0, het)).not.toContain('postCoThuLai')
  })
})

describe('VẾ 3 — lượt bị từ chối phải kèm mốc giờ', () => {
  // "Em đã nộp bài ca này." không nói được lúc nào thì em gọi Thầy giữa giờ thi.
  const SRV = doc('server/src/index.ts')

  it('máy chủ trả nopLuc / batDau / hetHanVao kèm lý do chặn', () => {
    const i = SRV.indexOf('if (!qd.ok || !ca) {')
    expect(i).toBeGreaterThan(0)
    const khoi = SRV.slice(i, i + 900)
    expect(khoi).toContain("nopLuc: qd.lyDo === 'da_nop' ? (cu?.nop_luc ?? '') : ''")
    expect(khoi).toContain('batDau: ca?.bat_dau')
    expect(khoi).toContain('hetHanVao: ca?.het_han_vao')
  })

  it('máy em chuyển tiếp cả ba mốc sang thông điệp cho em', () => {
    const i = API.indexOf('if (!r.ok) {')
    const khoi = API.slice(i, i + 400)
    expect(khoi).toContain('nopLuc: r.nopLuc')
    expect(khoi).toContain('batDau: r.batDau')
    expect(khoi).toContain('hetHanVao: r.hetHanVao')
  })

  it('họ tên và năm sinh được gửi lên để nhật ký chặn vào đọc được', () => {
    const MC = doc('src/lib/may-chu-moi.ts')
    expect(MC).toContain("hoTen: danhTinh.hoTen ?? ''")
    expect(MC).toContain("namSinh: danhTinh.namSinh ?? ''")
  })
})

describe('VẾ 4 — thầy phải biết ngay lúc bấm Bắt đầu', () => {
  it('`batDauThi` ĐỌC kết quả đẩy, không gọi suông', () => {
    expect(API).toContain('chuaSangMayChuMoi = !xong')
    expect(API).toContain('const xong = await dayMocBatDauMoi(')
  })

  it('lỗi ném ra cũng tính là chưa sang', () => {
    const i = API.indexOf('let chuaSangMayChuMoi = false')
    expect(i).toBeGreaterThan(0)
    expect(API.slice(i, i + 900)).toMatch(/\} catch \{\s*\n\s*chuaSangMayChuMoi = true\s*\n\s*\}/)
  })

  it('cờ TẮT thì KHÔNG kêu hỏng — tắt là thầy chủ ý tắt', () => {
    const i = API.indexOf('let chuaSangMayChuMoi = false')
    expect(API.slice(i, i + 400)).toContain('if (chMoi.BAT && chMoi.URL) {')
  })

  it('máy thầy THỬ LẠI lượt đẩy mốc — chữa ở một máy, không chữa ở bốn mươi máy', () => {
    const DAY = doc('src/lib/day-ca-may-chu-moi.ts')
    const i = DAY.indexOf('export async function dayMocBatDauMoi(')
    const han = DAY.slice(i, i + 1600)
    expect(han).toContain('for (let i = 0; i < Math.max(1, soLan); i++)')
    expect(han).toContain('if (xong) return true')
  })

  it('màn Theo dõi hét lên bằng toast ĐỎ', () => {
    expect(MAN).toContain('Mốc bắt đầu CHƯA sang máy chủ mới')
    const i = MAN.indexOf('Mốc bắt đầu CHƯA sang máy chủ mới')
    expect(MAN.slice(i, i + 200)).toContain("'error'")
  })
})

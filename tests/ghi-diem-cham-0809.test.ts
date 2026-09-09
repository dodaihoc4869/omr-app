// `ghiDiem` MỚI LÀ CHỖ CHẾT, KHÔNG PHẢI `chiTietCa` — đo 08/09 khuya.
//
// `chamLaiCa('248567')` (21 em) hỏng BA LẦN liền, cả ba "Máy chủ không trả lời
// sau 25 giây". Hai vòng đầu tôi đoán là `chiTietCa` và nới hạn cho nó — SAI.
// Vòng ba móc `fetch` để ghi lại từng lượt gọi:
//
//     chiTietCa OK 5s
//     ghiDiem HONG 25.3s
//
// `chiTietCa` xong trong 5 giây. Chỗ chết là `ghiDiem`.
//
// NGUYÊN NHÂN GỐC: `ghiDiem` xoá dòng chi tiết cũ bằng `deleteRow` TỪNG DÒNG.
// Một lô 5 em có ~60 dòng chi tiết cũ ⇒ ~60 lượt ghi Sheet, mỗi lượt tốn thời
// gian riêng. Bảng ChiTietCau càng dài thì càng chậm, nên lỗi này chỉ lộ ra khi
// dữ liệu đã tích đủ — ca 447479 chạy lọt vài giờ trước, ca 248567 thì không.
//
// SỬA: chi tiết của một em được ghi liền một mạch nên các dòng gần như luôn
// liền số. Gom thành KHỐI rồi `deleteRows` một lần: ~60 lượt xuống còn vài lượt.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')
const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
const CLC = fs.readFileSync(path.join(process.cwd(), 'src/lib/cham-lai-ca.ts'), 'utf8')

function layHam(ten: string): string {
  const dau = GS.indexOf(`function ${ten}(`)
  if (dau < 0) throw new Error(`Không thấy hàm ${ten}`)
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

const khoi = new Function(`${layHam('khoiLienMach_')}\nreturn khoiLienMach_`)() as (
  ds: number[],
) => [number, number][]

/** Mô phỏng Sheet: xoá theo khối rồi so với xoá từng dòng — hai cách phải ra
 * CÙNG một bảng còn lại. Đây mới là phép kiểm thật; đếm số lượt gọi chỉ là phụ. */
function xoaTheoKhoi(bang: string[], dongGiamDan: number[]): string[] {
  const b = [...bang]
  for (const [dau, so] of khoi(dongGiamDan)) b.splice(dau - 1, so)
  return b
}
function xoaTungDong(bang: string[], dongGiamDan: number[]): string[] {
  const b = [...bang]
  for (const d of dongGiamDan) b.splice(d - 1, 1)
  return b
}

describe('khoiLienMach_ — gom chỉ số dòng thành khối', () => {
  it('ví dụ trong ghi chú', () => {
    expect(khoi([90, 89, 88, 50, 49, 10])).toEqual([
      [88, 3],
      [49, 2],
      [10, 1],
    ])
  })

  it('rỗng ra rỗng', () => {
    expect(khoi([])).toEqual([])
  })

  it('một dòng', () => {
    expect(khoi([7])).toEqual([[7, 1]])
  })

  it('liền mạch hoàn toàn — gom thành ĐÚNG MỘT khối', () => {
    const ds = Array.from({ length: 60 }, (_, i) => 100 - i) // 100..41
    expect(khoi(ds)).toEqual([[41, 60]])
  })

  it('rời rạc hoàn toàn — mỗi dòng một khối, không gom nhầm', () => {
    expect(khoi([9, 7, 5])).toEqual([
      [9, 1],
      [7, 1],
      [5, 1],
    ])
  })

  it('CẮT ĐƯỢC BAO NHIÊU LƯỢT GHI: 60 dòng liền mạch → 1 lượt thay vì 60', () => {
    const ds = Array.from({ length: 60 }, (_, i) => 100 - i)
    expect(ds.length).toBe(60)
    expect(khoi(ds).length).toBe(1)
  })
})

describe('xoá theo khối cho KẾT QUẢ Y HỆT xoá từng dòng', () => {
  const bang = Array.from({ length: 40 }, (_, i) => `d${i + 1}`)

  it('trên khối liền mạch', () => {
    const ds = [22, 21, 20, 19, 18]
    expect(xoaTheoKhoi(bang, ds)).toEqual(xoaTungDong(bang, ds))
  })

  it('trên nhiều khối rời', () => {
    const ds = [40, 39, 30, 12, 11, 10, 2]
    expect(xoaTheoKhoi(bang, ds)).toEqual(xoaTungDong(bang, ds))
  })

  it('trên dòng đầu và dòng cuối bảng', () => {
    const ds = [40, 1]
    expect(xoaTheoKhoi(bang, ds)).toEqual(xoaTungDong(bang, ds))
  })

  it('trên 200 tổ hợp ngẫu nhiên có tái lập', () => {
    let hat = 20260908
    const rnd = () => ((hat = (hat * 1103515245 + 12345) % 2147483648) / 2147483648)
    for (let lan = 0; lan < 200; lan++) {
      const chon = new Set<number>()
      const n = 1 + Math.floor(rnd() * 15)
      for (let k = 0; k < n; k++) chon.add(1 + Math.floor(rnd() * 40))
      const ds = [...chon].sort((a, b) => b - a)
      expect(xoaTheoKhoi(bang, ds), `lệch ở ${JSON.stringify(ds)}`).toEqual(xoaTungDong(bang, ds))
    }
  })
})

describe('máy chủ dùng đúng hàm mới', () => {
  it('ghiDiem gọi deleteRows theo khối, KHÔNG còn deleteRow từng dòng', () => {
    const than = GS.slice(GS.indexOf("if (action === 'ghiDiem')"), GS.indexOf("if (action === 'submit')"))
    expect(than).toContain('const khoi = khoiLienMach_(xoaDong)')
    expect(than).toContain('ctSh.deleteRows(khoi[i][0], khoi[i][1])')
    expect(than).not.toContain('ctSh.deleteRow(xoaDong[i])')
  })

  it('danh sách vẫn được sắp GIẢM DẦN trước khi gom — xoá từ dưới lên', () => {
    const than = GS.slice(GS.indexOf("if (action === 'ghiDiem')"), GS.indexOf("if (action === 'submit')"))
    const viSap = than.indexOf('xoaDong.sort(function (a, b) { return b - a })')
    const viGom = than.indexOf('const khoi = khoiLienMach_(xoaDong)')
    expect(viSap).toBeGreaterThan(0)
    expect(viGom).toBeGreaterThan(viSap)
  })
})

describe('máy em: hạn và cỡ lô hợp với lượt gọi nặng nhất', () => {
  it('ghiDiem dùng hạn 90 giây, không phải mặc định 25', () => {
    // Gói nay mang thêm `soCau` (mẫu số đã dùng, siết 09/09) — con số 90 giây
    // và lý do của nó không đổi.
    expect(API).toContain("{ action: 'ghiDiem', secret, maCa, bai, luatDiem: LUAT_DIEM, soCau }, 90)")
  })

  it('chamLaiCa ghi theo lô 3 em, không phải 5', () => {
    expect(CLC).toContain('const CO_LO = 3')
  })
})

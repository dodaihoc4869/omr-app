/**
 * TÊN THẦN THÚ — VỪA HOÁ HỌC VỪA THẦN THÚ, 16-09.
 *
 * Thầy chốt 15-09: *"bạn đặt lại tên cho vừa hoá học vừa thần thú cho ngầu
 * hơn nữa nhé"*.
 *
 * Luật đặt tên, và phép kiểm dưới đây giữ đúng luật ấy:
 *   `ten`      = [thuật ngữ Hoá có thật] + [tên thần thú]
 *   `danhHieu` = [công thức/tỉ lệ có thật] + [danh xưng]
 *   `kyNangNo` = tên chiêu tối thượng đúng ảnh thầy gửi (chữ IN tiếng Anh)
 *               + nghĩa tiếng Việt.
 *
 * Không có phép kiểm này thì lần đổi tên sau rất dễ đánh rơi một nửa: đặt cho
 * kêu mà mất sạch chất Hoá, hoặc ngược lại.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { DANH_SACH_THAN_THU, DS_HE } from '../src/game/than-thu-hoa-hoc/he-thong-pet'
import { TEN_BAC_THEO_THU, CAP_BAC } from '../src/game/than-thu-hoa-hoc/hinh-thai'

/** Thuật ngữ Hoá phổ thông — danh pháp 2018. */
const CHU_HOA = [
  'nhiệt nhôm', 'cường toan', 'trầm tủa', 'kết tủa', 'halogen', 'điện cực',
  'trùng hợp', 'polymer', 'ester', 'thiêu thiết', 'hoá kim', 'phệ kim',
  'quang sinh', 'lôi đình',
]
/** Tên thần thú — long, ly, quy, phượng, lân, thuỷ long. */
const CHU_THU = ['long', 'lân', 'quy', 'phượng', 'kỳ lân', 'thần thú']

const co = (s: string, ds: string[]) => ds.some((t) => s.toLowerCase().includes(t))

describe('tên sáu thần thú', () => {
  const ds = Object.values(DANH_SACH_THAN_THU)

  it('đủ sáu con, mỗi hệ đúng một con', () => {
    expect(ds).toHaveLength(6)
    expect(new Set(ds.map((t) => t.he)).size).toBe(DS_HE.length)
  })

  it('TÊN mang CẢ HAI nửa: một thuật ngữ Hoá và một tên thần thú', () => {
    for (const t of ds) {
      expect(co(t.ten, CHU_HOA), `${t.id} thiếu chất Hoá trong tên: ${t.ten}`).toBe(true)
      expect(co(t.ten, CHU_THU), `${t.id} thiếu tên thần thú: ${t.ten}`).toBe(true)
    }
  })

  it('DANH HIỆU mang một CÔNG THỨC THẬT, không phải chữ kêu suông', () => {
    // Công thức nhận ra bằng ký hiệu nguyên tố kèm chỉ số dưới, dấu điện tích,
    // hoặc gạch nối chuỗi polymer — thứ chỉ có ở công thức hoá học thật.
    const CO_CONG_THUC = /[A-Z][a-z]?[₀-₉]|[⁺⁻²³ₙ]|‖|–CH₂–/
    for (const t of ds) {
      expect(CO_CONG_THUC.test(t.danhHieu), `${t.id} danh hiệu không có công thức: ${t.danhHieu}`).toBe(true)
      expect(t.danhHieu).toContain('—')
    }
  })

  it('không con nào trùng tên hay trùng danh hiệu con nào', () => {
    expect(new Set(ds.map((t) => t.ten)).size).toBe(6)
    expect(new Set(ds.map((t) => t.danhHieu)).size).toBe(6)
  })

  it('CHIÊU TỐI THƯỢNG đúng sáu tên trong ảnh thầy gửi', () => {
    const phai = [
      'SOLAR FLARE ERUPTION', 'GALAXY CROWN LASER', 'CHRONO-CORE CANON ARRAY',
      'ULTIMATE JADE BLAST', 'CHILLING FROST ROAR', 'BIOLUMINESCENT VORTEX BLAST',
    ]
    const dangCo = ds.map((t) => t.kyNangNo)
    for (const ten of phai) {
      expect(dangCo.some((x) => x.includes(ten)), `thiếu chiêu ${ten}`).toBe(true)
    }
    // Mỗi chiêu phải có phần NGHĨA TIẾNG VIỆT sau dấu gạch — em đọc được.
    for (const x of dangCo) {
      expect(x).toContain('—')
      expect(x.split('—')[1]!.trim().length).toBeGreaterThan(8)
    }
  })

  it('kỹ năng thường cũng là một quá trình Hoá, không phải chữ fantasy trơn', () => {
    for (const t of ds) {
      expect(co(t.kyNangThuong, CHU_HOA), `${t.id}: ${t.kyNangThuong}`).toBe(true)
    }
  })
})

describe('tên sáu bậc tiến hoá', () => {
  it('con nào cũng có đúng sáu bậc, khớp số mốc `CAP_BAC`', () => {
    for (const id of Object.keys(DANH_SACH_THAN_THU)) {
      expect(TEN_BAC_THEO_THU[id], `thiếu bảng bậc cho ${id}`).toBeDefined()
      expect(TEN_BAC_THEO_THU[id]!).toHaveLength(CAP_BAC.length)
    }
  })

  it('bậc 1 là TRỨNG, bậc cuối là TỐI THƯỢNG viết hoa', () => {
    for (const [id, ds] of Object.entries(TEN_BAC_THEO_THU)) {
      expect(ds[0]!.toLowerCase(), id).toContain('trứng')
      expect(ds[ds.length - 1]!, id).toBe(ds[ds.length - 1]!.toUpperCase())
      expect(ds[ds.length - 1]!, id).toContain('TỐI THƯỢNG')
    }
  })

  it('từ bậc 2 trở lên, bậc nào cũng nêu được THẦN THÚ của nó', () => {
    for (const [id, ds] of Object.entries(TEN_BAC_THEO_THU)) {
      for (const ten of ds.slice(1)) {
        expect(co(ten, [...CHU_THU, 'đế', 'vương', 'chủ', 'thần']), `${id}: ${ten}`).toBe(true)
      }
    }
  })

  it('trong một con, sáu bậc KHÔNG tên nào trùng tên nào', () => {
    for (const [id, ds] of Object.entries(TEN_BAC_THEO_THU)) {
      expect(new Set(ds).size, id).toBe(ds.length)
    }
  })
})

describe('âm chưởng tối thượng — sáu hệ sáu tiếng, và chỉ kêu đúng lúc', () => {
  const AM = readFileSync('src/game/than-thu-hoa-hoc/am-thanh-pet.ts', 'utf8')
  const GAME = readFileSync('src/components/ThanThuHoaHocGame.tsx', 'utf8')

  it('`chuongToiThuong` có nhánh riêng cho từng hệ, không dùng chung một tiếng', () => {
    const than = AM.slice(AM.indexOf('chuongToiThuong(he: string)'))
    for (const he of ['khi', 'axit', 'kiem', 'hoa', 'dien']) {
      expect(than, `thiếu nhánh hệ ${he}`).toContain(`case '${he}':`)
    }
    // Hệ thứ sáu (hữu cơ) nằm ở `default` — vẫn là một nhánh riêng.
    expect(than).toContain('default:')
  })

  it('mỗi nhánh nêu đúng tên chiêu của nó trong chú thích — đọc mã là biết tiếng nào', () => {
    for (const ten of [
      'ULTIMATE JADE BLAST', 'GALAXY CROWN LASER', 'CHRONO-CORE CANON ARRAY',
      'SOLAR FLARE ERUPTION', 'CHILLING FROST ROAR', 'BIOLUMINESCENT VORTEX BLAST',
    ]) {
      expect(AM, `thiếu chú thích ${ten}`).toContain(ten)
    }
  })

  it('TRẢ LỜI ĐÚNG mà trùm chưa chết thì KHÔNG phát tiếng tối thượng', () => {
    // Bản trước gọi `kichNo()` cho mọi câu đúng: nghe một buổi là nhờn tai,
    // tới lúc hạ trùm thật thì chẳng còn gì đặc biệt.
    const i = GAME.indexOf('const xuLyTraLoi')
    const than = GAME.slice(i, i + 2200)
    expect(than).toContain('if (mauBossMoi <= 0) {')
    // Trong khối đó phải có CẢ HAI tiếng; nhánh còn lại là đòn thường.
    const khoi = than.slice(than.indexOf('if (mauBossMoi <= 0) {'))
    expect(khoi.slice(0, 400)).toContain('chuongToiThuong')
    expect(khoi.slice(0, 400)).toContain('tanCong()')
  })
})

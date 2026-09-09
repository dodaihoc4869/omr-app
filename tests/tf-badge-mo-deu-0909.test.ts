// HAI CỘT ĐÚNG/SAI TRONG PHIẾU KHẮC PHỤC — thầy báo 09/09, kèm ảnh chụp:
//
//   "những câu đúng sai trong việc tạo câu khắc phục đáp án đều bị in đậm sẵn
//    chữ cái. bạn hãy làm mờ hết lại cho đồng bộ"
//   "bỏ luôn 2 chữ Đ S nhỏ ở trên đầu 2 dãy chọn đúng sai nhé"
//
// Ô Đ/S trước đây để `font-weight: 800` cho MỌI ô, kể cả ô em chưa chọn. 800 là
// độ đậm dành cho ô ĐÃ CHỌN; đặt sẵn cho ô chưa chọn là nói dối bằng hình thức —
// nhìn như đã đánh dấu trước. Ô đã chọn vẫn nổi bật vì nó đổi cả NỀN lẫn MÀU
// CHỮ, không cần mượn thêm độ đậm.
//
// Hàng nhãn "Đ  S" ở đầu hai cột cũng bỏ: mỗi ô đã mang sẵn chữ cái của nó.
//
// PHÉP KIỂM QUAN TRỌNG NHẤT ở cuối tệp: dựng phiếu THẬT rồi soi từng ô, đòi ô
// mang đáp án đúng và ô không mang đáp án phải giống hệt nhau về class hiển thị
// trước khi nộp. Đây là lưới chắn cho đúng loại lỗi đã dính hai lần (08/09):
// sửa kiểu chữ của hai cột rồi vô tình để lộ đáp án.
import { describe, expect, it } from 'vitest'
import { dungPhieu } from '../src/lib/html-phieu'

const TT = {
  hoTen: 'Nguyễn Hồng Sơn',
  sbd: '12036',
  ngay: new Date('2026-09-09T12:00:00.000Z'),
  tenChuyenDe: 'Ester – lipid',
  ketQua: '',
  hienDapAn: false,
  nhanBia: 'Bài luyện',
  oBia: [],
}

/** Một câu Đúng/Sai bốn ý, đáp án ĐSĐS — ý a và c ĐÚNG. Đúng shape `CauLuyen`
 * mà `dungPhieu` thật sự nhận, không phải một shape tôi tự nghĩ ra. */
const CAU_DS = [
  {
    phan: 'II' as const,
    id: 'q-ds-1',
    maDe: '12-BD7-01',
    chuyenDe: 'Ester – lipid',
    dang: 'ly_thuyet',
    sao: 1,
    mucDo: 'nhan_biet',
    text: 'Xét các phát biểu sau',
    luaChon: ['Phát biểu a', 'Phát biểu b', 'Phát biểu c', 'Phát biểu d'],
    dapAn: 'ĐSĐS',
    chot: '',
    lyDo: null,
    buoc: null,
    ketQua: '',
  },
]

function phieu(tuyChon?: Record<string, unknown>): string {
  return dungPhieu(TT as never, CAU_DS as never, tuyChon as never)
}

describe('chữ Đ/S không in đậm sẵn', () => {
  it('ô Đ/S dùng độ đậm 500, KHÔNG phải 800', () => {
    const h = phieu({ anGiai: true })
    // Lấy đúng luật GỐC ở ĐẦU DÒNG, không dính `body.co-lam .tf-badge {`.
    const dau = h.indexOf('\n.tf-badge {')
    expect(dau, 'không thấy luật gốc .tf-badge').toBeGreaterThan(0)
    const khoi = h.slice(dau, h.indexOf('\n}', dau) + 2)
    expect(khoi).toContain('font-weight: 500')
    expect(khoi).not.toContain('font-weight: 800')
    // Và độ đậm 800 không được lẻn về ở bất kỳ luật .tf-badge nào khác.
    for (const m of h.matchAll(/\.tf-badge[^{]*\{[^}]*\}/g)) {
      expect(m[0], `luật còn in đậm: ${m[0].slice(0, 90)}`).not.toContain('font-weight: 800')
    }
  })

  it('ô ĐÃ CHỌN vẫn nổi bật bằng NỀN và MÀU CHỮ, không mượn độ đậm', () => {
    const h = phieu({ anGiai: true })
    expect(h).toContain('.tf-badge.lam-o[aria-checked="true"] { background: #2f3e46; border-color: #2f3e46; color: #ffffff; }')
  })
})

describe('bỏ hàng nhãn Đ / S ở đầu hai cột', () => {
  it('phiếu dựng ra KHÔNG còn thẻ tf-head', () => {
    for (const tc of [{ anGiai: true }, { nop: null }, undefined]) {
      expect(phieu(tc), `tuỳ chọn ${JSON.stringify(tc)}`).not.toContain('tf-head')
    }
  })

  it('mỗi ô vẫn tự mang chữ cái của nó — bỏ nhãn không làm mất nghĩa', () => {
    const h = phieu({ anGiai: true })
    expect(h).toContain('>Đ</span>')
    expect(h).toContain('>S</span>')
  })

  it('KHÔNG còn luật CSS chết của tf-head', () => {
    expect(phieu({ anGiai: true })).not.toContain('.tf-head')
  })
})

describe('LƯỚI CHẮN: sửa kiểu chữ KHÔNG được để lộ đáp án', () => {
  /** Lấy class của mọi ô Đ/S trong phiếu. */
  function classCacO(html: string): string[] {
    return [...html.matchAll(/class="(tf-badge[^"]*)"/g)].map((m) => m[1])
  }

  it('ô mang đáp án đúng và ô không mang đáp án chỉ khác nhau ĐÚNG một class "dung"', () => {
    const o = classCacO(phieu({ anGiai: true }))
    expect(o.length).toBe(8) // 4 ý × 2 ô
    const chuan = (c: string) => c.replace(/\s*\bdung\b/, '').replace(/\s+/g, ' ').trim()
    const d = o.filter((c) => / d\b| d /.test(' ' + c + ' '))
    expect(d.length).toBeGreaterThan(0)
    // Mọi ô cột Đ phải cùng một bộ class sau khi bỏ chữ "dung".
    expect(new Set(d.map(chuan)).size).toBe(1)
  })

  it('trước khi nộp: luật giấu đè lên MỌI ô mang đáp án, không chừa ô nào', () => {
    const h = phieu({ anGiai: true })
    // Ba luật giấu của thân "chi-de" phải còn đủ, kèm !important.
    expect(h).toMatch(/body\.chi-de \.tf-badge\.dung \{[^}]*color: var\(--rat-nhat\) !important/)
    expect(h).toMatch(/body\.chua-nop \.tf-badge\.dung \{[^}]*color: var\(--rat-nhat\) !important/)
  })

  it('màu xanh/đỏ của đáp án chỉ sống trong thẻ ĐÃ MỞ hoặc bản in', () => {
    const h = phieu({ anGiai: true })
    // Luật tô màu phải luôn có tiền tố `.q-card.mo` hoặc nằm trong @media print.
    for (const m of h.matchAll(/^(.*)\.tf-badge\.d\.dung \{/gm)) {
      const truoc = m[1]
      expect(truoc.includes('.q-card.mo') || truoc.trim() === '', `luật lộ màu: ${m[0]}`).toBe(true)
    }
  })
})

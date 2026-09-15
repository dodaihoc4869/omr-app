// "HIỆN ĐỀ" MÀ ĐÁP ÁN VẪN LỘ VÌ KHÁC MÀU. 15/09.
//
// Thầy gửi ảnh phiếu khắc phục, hai câu Carbohydrate: bấm "Hiện đề" rồi mà ô B
// (câu 1) và ô D (câu 2) vẫn khác hẳn ba ô còn lại — nền xám hơn, chữ nhạt
// hơn, chữ cái trong vòng tròn đậm hơn. Nhìn một cái là biết đáp án.
//
// NGUYÊN NHÂN GỐC: bản cũ giấu đáp án bằng cách TÔ LẠI ô đáp án cho "trung
// hoà", mà bộ màu tô lại KHÔNG trùng bộ màu của ô thường:
//
//   thuộc tính        ô thường           ô đáp án lúc "Hiện đề"
//   nền               #ffffff            #f8fafc
//   chữ               var(--muc)         var(--muc-2)
//   nền chữ cái       #f1f5f9            var(--vien-dam)
//
// Bốn chỗ lệch là bốn chỗ lộ. Và cách ấy không thể chữa bằng cách chép màu cho
// khớp: thêm một thuộc tính mới vào `.q-opt.dung` là lộ lại.
//
// NAY: lớp `dung`/`sai` KHÔNG nằm sẵn trong thẻ. Thẻ chỉ mang dấu `data-dung`
// / `data-sai`; hàm `dongBoLoDapAn` trong phiếu gắn lớp vào khi được phép hiện
// và GỠ RA khi đang giấu. Lúc giấu, thẻ đáp án và thẻ thường giống nhau TỪNG
// THUỘC TÍNH vì chúng khớp đúng cùng một bộ luật CSS.
//
// Hai chỗ viết thẳng đáp án ra CHỮ, nằm ngoài khối lời giải nên luật giấu lời
// giải không với tới, cũng phải giấu: `.lo-dap` ("· đáp án đúng C") và
// `.lam-ket` ("Đúng"/"Sai" gắn sau khi nộp).
import { describe, expect, it } from 'vitest'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dungPhieu } from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const NGUON = readFileSync(resolve(GOC, 'src/lib/html-phieu.ts'), 'utf8')
/** Bỏ chú thích trước khi soi LUẬT CSS: chính tệp ấy GIẢI THÍCH các luật đã bỏ
 * (kể cả trong chú thích CSS nằm trong chuỗi mẫu), và phải còn để phiên sau đọc
 * là biết đừng viết lại. */
const CSS = NGUON.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

const cau = (id: string, dapAn: string): CauLuyen => ({
  phan: 'I',
  id,
  maDe: 'TEST',
  chuyenDe: 'Carbohydrate',
  dang: 'ly_thuyet',
  sao: 0,
  mucDo: 'biet',
  text: 'Chất nào sau đây thuộc loại polysaccharide?',
  luaChon: ['Glucose.', 'Cellulose.', 'Fructose.', 'Saccharose.'],
  dapAn,
  chot: 'Cellulose là polysaccharide.',
  lyDo: null,
  buoc: null,
  ketQua: '',
})

const HTML = dungPhieu(
  {
    hoTen: 'Nguyễn Văn A',
    sbd: '000001',
    ngay: new Date('2026-09-15T00:00:00Z'),
    tenChuyenDe: 'CARBOHYDRATE',
    ketQua: '',
    hienDapAn: false,
  },
  [cau('c1', 'B'), cau('c2', 'D')],
)

// Ghi ra file cho `scripts/kiem-lo-dap-an.mjs` chấm bằng Chromium thật.
mkdirSync(resolve(GOC, '.kiem-hien-thi'), { recursive: true })
writeFileSync(resolve(GOC, '.kiem-hien-thi/phieu-lo-dap-an.html'), HTML, 'utf8')

describe('Thẻ không mang sẵn lớp đáp án', () => {
  it('ô đáp án ra HTML KHÔNG có lớp `dung`, chỉ có dấu `data-dung`', () => {
    expect(HTML).toContain('data-dung="1"')
    expect(HTML).not.toContain('class="q-opt dung"')
    expect(HTML).not.toContain('class="q-opt dung lam-o"')
    expect(HTML).not.toContain(' dung lam-o"')
  })

  it('mọi ô phần I ra cùng một chuỗi lớp — không ô nào khác ô nào', () => {
    const lop = [...HTML.matchAll(/class="(q-opt(?: [^"]*)?)"/g)].map((m) => m[1])
    expect(lop.length).toBeGreaterThanOrEqual(8)
    expect(new Set(lop).size).toBe(1)
  })

  it('ô Đ/S phần II cũng vậy', () => {
    expect(NGUON).not.toContain("`<div class=\"tf-badge ${ds}${laDung ? ' dung' : ''}\">")
    expect(NGUON).toContain("${laDung ? ' data-dung=\"1\"' : ''}")
  })
})

describe('Không còn luật CSS nào tô lại ô đáp án', () => {
  it('bỏ hết luật "trung hoà" của bản cũ', () => {
    expect(CSS).not.toContain('body.chua-nop .q-opt.dung')
    expect(CSS).not.toContain('body.chi-de .q-opt.dung')
    expect(CSS).not.toContain('body.chua-nop .tf-badge.dung')
    expect(CSS).not.toContain('body.chi-de .tf-badge.dung')
  })

  it('ô em ĐANG CHỌN vẫn đổi màu — một màu duy nhất, đúng sai như nhau', () => {
    expect(NGUON).toContain('body.chi-de .q-opt.lam-o[aria-checked="true"]')
    expect(NGUON).toContain('body.chua-nop .q-opt.lam-o[aria-checked="true"]')
  })
})

describe('Hàm gỡ lớp chạy ở MỌI chỗ đổi trạng thái giấu/hiện', () => {
  it('có hàm và gỡ cả `dung` lẫn `sai`', () => {
    expect(NGUON).toContain('function dongBoLoDapAn()')
    expect(NGUON).toContain("classList.toggle('dung', !an)")
    expect(NGUON).toContain("classList.toggle('sai', !an)")
    expect(NGUON).toContain("querySelectorAll('[data-dung],[data-sai]')")
  })

  it('gọi đủ 5 chỗ: bật/tắt Hiện đề · in PDF · lúc mở trang · nộp xong · beforeprint', () => {
    const soGoi = NGUON.split('dongBoLoDapAn()').length - 1
    expect(soGoi).toBeGreaterThanOrEqual(5)
    expect(NGUON).toContain("window.addEventListener('beforeprint', dongBoLoDapAn)")
  })
})

describe('Đáp án viết thẳng ra CHỮ cũng phải giấu', () => {
  it('mệnh đề "đáp án đúng X" nằm trong span giấu được', () => {
    expect(NGUON).toContain('<span class="lo-dap">')
    expect(NGUON).toContain('body.chua-nop .lo-dap, body.chi-de .lo-dap { display: none !important; }')
  })

  it('nhãn Đúng/Sai sau khi nộp bị giấu trong chế độ Hiện đề', () => {
    expect(NGUON).toContain('body.chi-de .lam-ket { display: none !important; }')
  })

  it('khối lời giải và đáp án trả lời ngắn vẫn giấu như cũ', () => {
    expect(NGUON).toContain('body.chi-de .sol-wrap { display: none !important; }')
    expect(NGUON).toContain('body.chi-de .sa-answer { display: none !important; }')
  })
})

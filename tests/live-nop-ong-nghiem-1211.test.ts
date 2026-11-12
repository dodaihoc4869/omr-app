// @vitest-environment node
// LIVE THEO KHỐI — NÚT ỐNG NGHIỆM «AI ĐÃ NỘP» (thầy 12/11, bản vẽ docs/ban-ve-live-moi-1211/19–22 đã duyệt «ok chốt build»).
// Khoá: (1) view của THẦY ở buổi live theo khối mang `nop` = mọi em đã gửi [kết quả, giây, đáp án] ở mọi pha; buổi trên lớp không gửi;
// (2) view của EM không bao giờ có `nop` / đáp án bạn chọn / đúng sai của bạn trước khi mở; (3) tờ + app nối đúng tên lệnh; nút chỉ ở chế độ Học.
// Hành vi thật (đếm, tia xoắn ốc, tấm chỉ phủ phía bảng đen, xếp nhanh nhất) thử trên trình duyệt: scripts/thu-live-1011/thu-gv-that-1211.mjs bước 4s–4w, 6z2.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import * as L from '../src/lib/bpu/phong'
import * as LL from '../src/lib/bpu/phong-live'

const chamSo = (a: string, b: string) => a.trim() === b.trim()
function phong(khoi: boolean) {
  const st = L.taoPhong({ buoiId: 'b', lop: 'L', nay: 1000, ds: ['S1', 'S2', 'S3', 'S4'].map((s, i) => ({ sbd: s, ten: `Em ${s}`, coMat: true, luc: i + 1 })) })
  LL.datCoLive(st, { cho: true, sfu: true }, 1000)
  if (khoi) LL.liveDat(st, { khoi: { k: 12, gd: 'dang', che: 'hoc' } }, 1100)
  L.moLuot(st, { qid: 'Q', phan: 'I', tuLuan: false, cau: { text: 'Đề', choices: ['a', 'b', 'c', 'd'] }, dung: 'B', hanGiay: null }, 10_000)
  return st
}
type Nop = Record<string, [number, number, string]>
const nopCua = (st: L.TrangThaiPhong) => (L.viewBang(st, chamSo).luot as { nop?: Nop } | null)?.nop

describe('nút ống nghiệm «Ai đã nộp» — dữ liệu phòng', () => {
  it('buổi live theo khối: view của thầy có `nop` [kết quả, giây, đáp án] cho mọi em đã gửi, đủ ở các pha', () => {
    const st = phong(true)
    expect(nopCua(st)).toEqual({})
    L.nhanTra(st, 'S2', 'B', 18_000) // 8 giây, đúng
    L.nhanTra(st, 'S1', 'C', 31_000) // 21 giây, sai
    expect(nopCua(st)).toEqual({ S2: [1, 8, 'B'], S1: [0, 21, 'C'] })
    L.goiLenBang(st, 'S3', [], 40_000)
    expect(nopCua(st)).toEqual({ S2: [1, 8, 'B'], S1: [0, 21, 'C'] }) // pha gọi lên bảng vẫn còn
    L.chamLenBang(st, true, 41_000); L.moDapAn(st, 42_000, chamSo)
    expect(nopCua(st)).toEqual({ S2: [1, 8, 'B'], S1: [0, 21, 'C'] }) // mở đáp án rồi vẫn còn
  })
  it('buổi dạy trên lớp (không cờ khối): KHÔNG gửi `nop` (không tăng gói tin của bảng đua)', () => {
    const st = phong(false)
    L.nhanTra(st, 'S1', 'B', 12_000)
    expect(nopCua(st)).toBeUndefined()
  })
  it('máy EM không bao giờ nhận `nop`, đáp án bạn chọn hay đúng / sai của bạn trước khi thầy mở', () => {
    const st = phong(true)
    L.nhanTra(st, 'S2', 'B', 18_000); L.nhanTra(st, 'S1', 'C', 31_000)
    for (const s of ['S1', 'S2', 'S3', 'LA']) {
      const chuoi = JSON.stringify(L.viewEm(st, s))
      expect(chuoi).not.toContain('"nop"')
      expect(chuoi).not.toContain('"dung"')
    }
  })
})

describe('nút ống nghiệm «Ai đã nộp» — nối tờ ⇄ app', () => {
  const doc = (p: string) => readFileSync(p, 'utf8')
  const nop = doc('src/lib/live-nop-to-chieu.ts'), noi = doc('src/components/live/thay-noi.ts')
  it('app chỉ gửi danh sách khi đang live theo khối ở chế độ Học và đang có câu; còn lại gửi so = 0 (ẩn nút)', () => {
    expect(noi).toContain("if (view && l && kh && kh.gd === 'dang' && kh.che === 'hoc') {")
    expect(noi).toContain("let tin: Record<string, unknown> = { lenh: 'live-nop', so: 0 }")
    expect(noi).toContain('.sort((a, b) => a[1][1] - b[1][1])') // nhanh nhất trước
    expect(noi).toContain('view.ds.filter((e) => e.vao && !(e.sbd in nop))') // chưa nộp = em có mặt chưa gửi
  })
  it('tờ: nút đứng TRƯỚC nút bốn ô, tia xoắn ốc khi có em mới gửi, tấm đặt theo cột bảng đen, ẩn ở chế độ Bảng', () => {
    expect(doc('src/lib/live-to-chieu.ts')).toContain("if (m.lenh === 'live-nop') { lvNop(m); return; }")
    expect(nop).toContain('t.parentNode.insertBefore(n, t);')
    expect(nop).toContain("if (moi) { nopTia(); nopBao(moi); }")
    expect(nop).toContain("d ? d.querySelector('.mc-cot-lam-bai') : null")
    expect(nop).toContain('body.mc-che-bang .mc-nop-nut,body.mc-che-bang .mc-nop-tam{display:none!important}')
    expect(nop).not.toMatch(/#[0-9a-fA-F]{3,8}\b/) // màu: chỉ biến của tờ
  })
  it('nút bốn ô nhỏ gọn: viên 64 % nằm giữa vùng bấm (vùng bấm giữ --td-cao)', () => {
    const td = doc('src/lib/thanh-day-to-chieu.ts')
    expect(td).toContain('.mc-td-vien{display:grid;place-items:center;width:64%;height:64%;border-radius:30%;')
    expect(td).toContain('[aria-expanded="true"] .mc-td-vien{background:var(--mc-bang-chu);box-shadow:none;color:var(--mc-thanh2)}') // màu đang có của trạng thái mở: giữ nguyên, nay nằm trên viên
    expect(td).toMatch(/\.mc-td-them\{[^}]*width:var\(--td-cao\);height:var\(--td-cao\)/)
    expect(td).toContain('<span class="mc-td-vien"><svg')
  })
})

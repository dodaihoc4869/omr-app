// MÀN GỌI LÊN BẢNG — NỐI ĐÚNG THUẬT TOÁN MỚI (14/09).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const doc = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const than = (p: string) =>
  doc(p).replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

describe('Hộp chọn bài hiện ĐỦ số câu trong kho', () => {
  const s = than('src/screens/GoiLenBangScreen.tsx')

  it('cây chọn bài nhận kho đầy đủ, KHÔNG khử trùng trước khi hiện', () => {
    expect(s).toContain('setDeDaLuu(tachNhieuTheoPhan(kho))')
    expect(s).not.toContain('setDeDaLuu(khuTrungNguon(tachNhieuTheoPhan(kho)).nguon)')
  })

  it('khử trùng chuyển sang lúc DỰNG danh sách chữa', () => {
    // Khử trùng nằm ở bước DỰNG `bankTichTay` (từ các đề đã tích), không ở hộp chọn. Từ 21/09 có thêm nhánh chế độ dạy học (giữ nguyên câu, không khử)
    // và nhánh "buổi chữa xếp sẵn" (lấy đúng các câu máy đề xuất); nhánh thường vẫn khử trùng sau khi thầy tích.
    expect(s).toContain('const bankTichTay: BanDeCa = useMemo(')
    expect(s).toContain('khuTrungNguon(deDaLuu.filter((d) => maDeChon.has(d.maDe))).nguon')
  })

  it('nói ra số câu trùng đã bỏ, không để thầy thắc mắc tích 40 ra 36', () => {
    expect(s).toContain('const soCauTrung = useMemo(')
    expect(s).toContain('câu trùng giữa các bài đã tích')
  })
})

describe('Màn hình chạy thuật toán mới', () => {
  const s = than('src/screens/GoiLenBangScreen.tsx')

  it('nút gộp chạy luôn xếp buổi chữa (LUẬT MỚI 25/09 — thay Engine E)', () => {
    expect(s).toContain('void chayBuoiChua()')
    expect(s).toContain('xepBuoiChuaMoi(cauVaoXep, hoSo, CAU_HINH_LEN_BANG_MAC_DINH')
  })

  it('xin HỒ SƠ ĐẦY ĐỦ của lớp trước khi xếp', () => {
    expect(s).toContain('napHoSoLop(')
    // Mất mạng thì vẫn xếp, chỉ là nói rõ kém chính xác hơn — không dừng.
    expect(s).toContain('xếp bằng dữ liệu ca này')
  })

  it('câu bắt buộc lấy từ độ khó đo được, trừ câu thầy đã bỏ', () => {
    expect(s).toContain('batBuoc: d.batBuoc && !boBatBuoc.includes(d.cau.id)')
  })

  it('hiện số em lên bảng trên sàn và số phút đã dùng', () => {
    expect(s).toContain('em lên bảng')
    expect(s).toContain('kqBuoi.soEmToiThieu')
    expect(s).toContain('câu chỉ đọc đáp án')
  })

  it('chưa đủ sàn thì nói lý do, không im', () => {
    expect(s).toContain('Chưa đủ sàn: {kqBuoi.thieu.viSao}')
  })

  it('tờ máy chiếu lấy bảng buổi chữa và kèm TRANG ĐÁP ÁN', () => {
    expect(s).toContain('kqBuoi.cauDocDapAn')
    expect(s).toContain('dsDapAn,')
  })
})

describe('Máy chủ gói hồ sơ cả lớp', () => {
  const s = than('server/src/goi-cu.ts')

  it('gộp đủ bốn nguồn trong MỘT lượt gọi', () => {
    expect(s).toContain('export async function hoSoLopLenBang(')
    expect(s).toContain('FROM tien_do_hs WHERE sbd IN')
    expect(s).toContain('FROM ban_do_sai WHERE sbd IN')
    expect(s).toContain('FROM qid_da_lam WHERE sbd IN')
    expect(s).toContain('FROM len_bang WHERE sbd IN')
    // Bốn truy vấn chạy song song, không phải mỗi em một lượt.
    expect(s).toContain('await Promise.all([')
  })

  it('là lệnh của THẦY, không mở cho máy em', () => {
    expect(than('server/src/index.ts')).toContain("'hoSoLopLenBang',")
  })

  it('em không có dữ liệu vẫn có dòng, không bịa số', () => {
    // 14/09 lượt 10: hồ sơ mang thêm bài tập về nhà nên khối khởi tạo dài ra
    // mấy dòng, không còn viết gọn một dòng được nữa. Ý ĐỊNH giữ nguyên: mỗi
    // em trong danh sách đều có một dòng, và dòng ấy RỖNG chứ không có số.
    expect(s).toContain('for (const s2 of ds) {')
    expect(s).toContain('chuyenDe: [],')
    expect(s).toContain('qidSai: [],')
    expect(s).toContain('qidDaLam: [],')
    expect(s).toContain("lenBang: { soLan: 0, lanCuoi: '', qids: [] },")
    expect(s).toContain('btvn: { soCauGiao: 0, soDaLam: 0, soDung: 0, soSai: 0, soChuaLam: 0, soLuot: 0, soLuotDaNop: 0,')
  })
})

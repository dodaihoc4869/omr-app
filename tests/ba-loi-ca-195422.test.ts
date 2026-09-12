// BA LỖI CA THẬT ĐẦU TIÊN TRÊN MÁY CHỦ MỚI — ca 195422 "2010 - Lớp 2 - L1", 12/09.
//
// Cả ba đều là dây thừa còn sót từ thời hai máy chủ, không phải hỏng dữ liệu.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { khoaDuocViCuaSoNoi, khoaDuocViThuNhoMan, xetCoMan, TI_LE_CO_MAN_CHOT } from '../src/lib/man-thi-sach'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const API = doc('src/lib/exam-api.ts')
const MAN = doc('src/screens/ExamTakeScreen.tsx')
const THEODOI = doc('src/screens/ExamMonitorScreen.tsx')

describe('LỖI 1 — link xem điểm báo "Máy chủ chưa gửi đề của ca này"', () => {
  // Ca 195422 đặt `cong_bo = 'ca_lop_xong'`. Bản trước chỉ đẩy ngân hàng CÓ đáp
  // án khi ca công bố NGAY, nên R2 không có `key/195422.json`, `phieuCuaEm` trả
  // `bank: null`, và link xem điểm của CẢ CA chết.
  it('mở ca LUÔN đẩy keyBank, không phụ thuộc cách công bố', () => {
    expect(API).not.toContain("congBoDiem === 'ngay' ? keyBank : undefined")
    const i = API.indexOf('        bank,\n')
    expect(i).toBeGreaterThan(0)
    expect(API.slice(i, i + 900)).toContain('keyBank,')
  })

  it('vẫn kín: `phieuCuaEm` chỉ trả đáp án cho lượt ĐÃ NỘP của chính em', () => {
    const SRV = doc('server/src/goi-cu.ts')
    const than = SRV.slice(SRV.indexOf('export async function phieuCuaEm'), SRV.indexOf('export async function phieuCuaEm') + 2600)
    expect(than).toContain('if (daNop && env.DE)')
    expect(than).toContain("chuoi(l.trang_thai) === 'da_nop'")
  })

  it('vẫn kín: đường công khai `/de/:maCa` không bao giờ đọc khoá `key/`', () => {
    const SRV = doc('server/src/index.ts')
    const than = SRV.slice(SRV.indexOf("if (!ca?.bank_r2) return ra({ ok: false, lyDo: 'chua_co_de' }, 404)"), SRV.indexOf("if (!ca?.bank_r2) return ra({ ok: false, lyDo: 'chua_co_de' }, 404)") + 400)
    expect(than).not.toContain('key/')
  })

  it('ca CŨ tự lành: màn chấm đẩy keyBank lên bằng lệnh chỉ ghi một đối tượng R2', () => {
    expect(THEODOI).toContain('void capNhatKeyBank(scriptUrl, secret, chiTiet.ca.maCa, keyBank).catch(() => {})')
    const SRV = doc('server/src/goi-cu.ts')
    const i = SRV.indexOf("await env.DE.put(`key/${maCa}.json`")
    expect(i).toBeGreaterThan(0)
    // Lệnh ấy KHÔNG được đụng bảng ca — ghi đè dòng ca bằng rỗng đã hỏng ca 704066.
    expect(SRV.slice(Math.max(0, i - 500), i + 200)).not.toContain('INSERT INTO ca')
  })
})

describe('LỖI 2 — thầy mở khoá mà em vào lại vẫn ra màn "Đã nộp"', () => {
  // Em Nguyễn Anh Tùng (11049) và em Đào Khánh Ngọc. Trong D1:
  // `ghi_chu = "mở khoá bởi thầy"` mà `trang_thai` vẫn quay về `da_nop`.
  //
  // Nhánh mở khoá ở máy em đòi cờ `kq.daMoKhoa`. Cờ ấy do Apps Script trả; máy
  // chủ mới không có trường đó nên nó LUÔN false ⇒ nhánh không bao giờ chạy.
  it('nhánh mở khoá KHÔNG còn đòi cờ `daMoKhoa`', () => {
    expect(MAN).toContain("if (kq.cach === 'khoi_phuc' && existing?.submitted && existing.integrity.blocked) {")
    expect(MAN).not.toContain('existing.integrity.blocked && kq.daMoKhoa')
  })

  it('vẫn chặt: em nộp THẬT thì máy chủ trả `da_nop`, không bao giờ trả `khoi_phuc`', () => {
    const L = doc('server/src/luat-vao-thi.ts')
    const i = L.indexOf("if (luot.trang_thai === 'da_nop' || luot.trang_thai === 'khoa')")
    expect(i).toBeGreaterThan(0)
    expect(L.slice(i, i + 130)).toContain("lyDo: 'da_nop'")
    // `khoi_phuc` chỉ ra khi dòng lượt đang ở `dang_lam` — tức thầy đã mở khoá.
    const j = L.indexOf("return { ok: true, cach: 'khoi_phuc'")
    expect(L.slice(Math.max(0, j - 320), j)).toContain("luot.trang_thai === 'dang_lam'")
  })

  it('mở khoá đưa dòng lượt về đúng `dang_lam`', () => {
    const SRV = doc('server/src/goi-cu.ts')
    const than = SRV.slice(SRV.indexOf('export async function moKhoaEm'), SRV.indexOf('export async function moKhoaEm') + 700)
    expect(than).toContain("SET trang_thai = 'dang_lam'")
    expect(than).toContain("AND trang_thai = 'khoa'")
  })
})

describe('LỖI 3 — đang làm tự bị khoá, không rời màn lần nào', () => {
  // Em Khổng Minh Huyền (12021) và em Nguyễn Tiến Nam (11034). Trong D1:
  // `leaveCount: 0`, `totalHiddenMs: 0`, `lyDoKhoa: "thu_nho_man"`,
  // `kenhBao: "kênh 4"`. Không rời màn một giây nào.
  it('máy CẢM ỨNG không bị khoá vì thu nhỏ màn — cùng luật với cửa sổ nổi', () => {
    expect(khoaDuocViThuNhoMan(true)).toBe(false)
    expect(khoaDuocViCuaSoNoi(true)).toBe(false)
  })

  it('máy TÍNH vẫn khoá được: chia đôi màn ở đó là thao tác cố ý', () => {
    expect(khoaDuocViThuNhoMan(false)).toBe(true)
  })

  it('kênh 4 ở màn thi đi qua đúng cửa ấy', () => {
    const i = MAN.indexOf("if (p.kenh === 'kich_thuoc')")
    expect(i).toBeGreaterThan(0)
    const than = MAN.slice(i, i + 900)
    expect(than).toContain('khoaDuocViThuNhoMan(camUngMay)')
    // Che đề thì vẫn giữ — chỉ bỏ việc KHOÁ.
    expect(than).toContain('xetCoMan(coMan')
  })

  it('vì sao bắt oan: bàn phím ảo cắt quá 28% khung nhìn là lọt ngưỡng', () => {
    // Điện thoại 360×780. Bàn phím ảo chiếm ~300px chiều cao ⇒ còn 360×480.
    const moc = 360 * 780
    const con = 360 * 480
    expect(con / moc).toBeLessThan(TI_LE_CO_MAN_CHOT)
    // Và ô nhập KHÔNG được lấy tiêu điểm thì tấm đệm `dangGoO` không đỡ.
    const kq = xetCoMan(
      { moc, nhoTu: 1000 },
      { rong: 360, cao: 480, dangGoO: false, bayGio: 9999, tiLe: TI_LE_CO_MAN_CHOT, msXacNhan: 1000 },
    )
    expect(kq.khoa).toBe(true)
  })
})

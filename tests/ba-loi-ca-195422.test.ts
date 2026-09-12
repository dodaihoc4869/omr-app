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

  // Đẩy khi mở ca chỉ cứu ca MỚI. Ca 195422 đã đóng, và bắt Thầy mở màn chấm
  // từng ca cũ là làm tay. Máy chủ tự dựng lại từ bảng chấm.
  describe('ca CŨ: máy chủ tự dựng ngân hàng đáp án từ bảng chấm', () => {
    const SRV = doc('server/src/goi-cu.ts')
    const ham = SRV.slice(SRV.indexOf('async function keyBankTuBangCham('), SRV.indexOf('async function keyBankTuBangCham(') + 3000)

    it('thiếu khoá `key/` thì mới dựng, và chỉ cho lượt ĐÃ NỘP', () => {
      const pc = SRV.slice(SRV.indexOf('export async function phieuCuaEm'), SRV.indexOf('export async function phieuCuaEm') + 2600)
      expect(pc).toContain('if (daNop && env.DE)')
      expect(pc).toContain('if (!bank) bank = await keyBankTuBangCham(env, maCa, sbd)')
    })

    it('đi theo BẢNG CHẤM của chính em, không theo gói đề — ca đề riêng mới đúng tờ', () => {
      expect(ham).toContain('FROM chi_tiet_cau')
      expect(ham).toContain('WHERE ma_ca = ? AND sbd = ? ORDER BY so_cau')
    })

    it('nội dung câu lấy từ gói đề công khai, ghép theo qid', () => {
      expect(ham).toContain('de/${maCa}.json')
      expect(ham).toContain('noiDung.get(chuoi(x.qid))')
    })

    it('CẤM BỊA: thiếu nội dung hoặc thiếu đáp án là bỏ cả bản', () => {
      expect(ham).toContain('if (!cau || !d) return null')
      // Phần I chỉ nhận A/B/C/D, phần II phải đủ 4 ký tự Đ/S.
      expect(ham).toContain("if (c !== 'A' && c !== 'B' && c !== 'C' && c !== 'D') return null")
      expect(ham).toContain('if (t.length < 4) return null')
      expect(ham).toContain("if (y.some((v) => v === '')) return null")
    })

    it('dựng đúng ba dáng `correct` mà máy em đọc', () => {
      // I: 'A'|'B'|'C'|'D' · II: mảng 4 'D'|'S' · III: chuỗi
      expect(ham).toContain('phanI.push({ ...cau, correct: c })')
      expect(ham).toContain("[0, 1, 2, 3].map((i) => (t[i] === 'S' ? 'S' : t[i] === 'D' ? 'D' : ''))")
      expect(ham).toContain('phanIII.push({ ...cau, correct: d })')
      const EX = doc('src/data/examContent.ts')
      expect(EX).toContain("correct: 'A' | 'B' | 'C' | 'D'")
      expect(EX).toContain("correct: ['D' | 'S', 'D' | 'S', 'D' | 'S', 'D' | 'S']")
    })
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

// ---------------------------------------------------------------------------
// ĐỢT 2 — 12/09 chiều
// ---------------------------------------------------------------------------
describe('LỖI 4 — bài BỊ KHOÁ bấm link xem điểm không thấy điểm', () => {
  // Em Nguyễn Tiến Nam (11034, 7,5 điểm) và em Khổng Minh Huyền (12021).
  // `phieuCuaEm` trả đủ ngân hàng, nhưng màn "Đã nộp" lấy `integrity.blocked`
  // để hiện tấm cảnh báo đỏ THAY CHO bảng điểm — đúng lúc đang thi, sai hẳn
  // lúc xem lại.
  it('mở bằng link xem điểm thì bật cờ `xemLai`', () => {
    expect(MAN).toContain('const [xemLai, setXemLai] = useState(false)')
    const i = MAN.indexOf('const moLaiTuMayChu = async ()')
    expect(MAN.slice(i, i + 900)).toContain('setXemLai(true)')
  })

  it('màn khoá bị bỏ qua, và bảng điểm được hiện, khi đang xem lại', () => {
    expect(MAN).toContain('if (attempt?.integrity.blocked && !xemLai) {')
    expect(MAN).toContain('{graded && (!attempt?.integrity.blocked || xemLai) && (')
  })

  it('KHÔNG xoá dấu vết: `integrity.blocked` giữ nguyên trong bản ghi', () => {
    const i = MAN.indexOf('const moLaiTuMayChu = async ()')
    const than = MAN.slice(i, i + 3000)
    expect(than).toContain('integrity: b.luot.integrity ??')
    expect(than).not.toContain('blocked: false')
  })
})

describe('LỖI 5 — đề khắc phục không nói nó chữa cho câu nào', () => {
  const PDL = doc('src/lib/phieu-du-lieu.ts')
  const ham = PDL.slice(PDL.indexOf('function ganNhanTheoChuyenDe('), PDL.indexOf('function xepTheoThuTuKho('))

  it('nhãn được gắn cho CẢ HAI đường dựng phiếu: máy em và máy thầy', () => {
    expect((PDL.match(/ganNhanTheoChuyenDe\(/g) || []).length).toBe(3) // 1 khai báo + 2 chỗ dùng
    expect(PDL).toContain('const baiTapEm = ganNhanTheoChuyenDe(')
    expect(PDL).toContain('const baiTap = ganNhanTheoChuyenDe(')
  })

  it('không đè lên nhãn theo MÃ DẠNG — đường chặt hơn luôn được giữ', () => {
    expect(ham).toContain('if (c.chuaCho) return c')
  })

  it('CẤM BỊA: chỉ nối câu SAI THẬT, cùng chuyên đề, đủ số câu và phần', () => {
    expect(ham).toContain('r.dungSai === false')
    expect(ham).toContain("(r.chuyenDe || '').trim() !== ''")
    expect(ham).toContain('if (!r.phan || !r.soCau) return c')
    // Không tìm được câu sai cùng chuyên đề thì để TRỐNG, không gắn bừa.
    expect(ham).toContain('if (!ds || ds.length === 0) return c')
  })

  it('chia vòng tròn để mọi câu sai đều được phủ', () => {
    expect(ham).toContain('ds[i % ds.length]')
  })

  it('nói ĐÚNG MỨC: cùng mã dạng mới là "khắc phục", cùng chuyên đề là "luyện thêm"', () => {
    const HP = doc('src/lib/html-phieu.ts')
    expect(HP).toContain('Khắc phục lỗi sai câu ${n.soCau} phần ${n.phan}')
    expect(HP).toContain('Luyện thêm cho câu ${n.soCau} phần ${n.phan}')
    expect(HP).toContain('cùng chuyên đề, chưa chắc cùng dạng')
  })

  it('bảng "Phiếu này khắc phục lỗi nào" KHÔNG đếm câu chỉ cùng chuyên đề', () => {
    const HP = doc('src/lib/html-phieu.ts')
    expect(HP).toContain('if (!n || n.theoChuyenDe) continue')
  })
})

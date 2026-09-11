// ĐỢT 5D — CHI TIẾT CA · MỞ CA · MÀN HỌC SINH lên máy chủ mới.
//
// Ba chỗ cuối còn đi Apps Script, và cả ba đều là chỗ thầy kêu tối 11/09:
//   · "bấm vào chi tiết ca load vẫn chậm"            → đo đường cũ p50 5,1 giây
//   · "lúc bấm bắt đầu mở ca là cực kì chậm"         → lượt `publish` ghi cả gói đề vào Sheet
//   · màn Học sinh đỏ "Máy chủ không trả lời sau 25 giây" giữa lúc ca 704066 chạy tốt
//
// Tệp này canh HAI thứ, và thứ hai quan trọng hơn thứ nhất:
//   ① đường nhanh có thật;
//   ② CỔNG AN TOÀN của đường nhanh còn nguyên — đọc thiếu điểm hay lệch mốc giờ
//     thì thà chậm còn hơn.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const WK = fs.readFileSync(path.join(process.cwd(), 'server/src/index.ts'), 'utf8')
const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
const DAY = fs.readFileSync(path.join(process.cwd(), 'src/lib/day-ca-may-chu-moi.ts'), 'utf8')
const SQL = fs.readFileSync(path.join(process.cwd(), 'server/migration-1109-chi-tiet-ca.sql'), 'utf8')

describe('MIGRATION CHỈ THÊM, KHÔNG ĐỤNG CỘT ĐANG CÓ', () => {
  it('chỉ có ADD COLUMN và CREATE TABLE', () => {
    for (const cam of ['DROP ', 'RENAME ', 'DELETE FROM', 'UPDATE ']) {
      expect(SQL.toUpperCase(), cam).not.toContain(cam)
    }
  })

  it('thêm đủ bảy cột điểm/họ tên của lượt', () => {
    for (const c of ['ho_ten', 'diem_i', 'diem_ii', 'diem_iii', 'tong', 'duyet_boi', 'duyet_luc']) {
      expect(SQL, c).toContain(`ALTER TABLE luot ADD COLUMN ${c}`)
    }
  })

  it('điểm để REAL — 8,75 không nhét vừa INTEGER', () => {
    expect(SQL).toMatch(/ALTER TABLE luot ADD COLUMN tong\s+REAL/)
  })

  it('có cờ `sinh_tai_d1` và bảng `chan_vao`', () => {
    expect(SQL).toContain('ALTER TABLE ca ADD COLUMN sinh_tai_d1')
    expect(SQL).toContain('CREATE TABLE IF NOT EXISTS chan_vao')
  })
})

describe('① CHI TIẾT CA — đường nhanh và hai cổng an toàn', () => {
  it('Worker có `/ca/chi-tiet`, nằm trong khối đòi mã bí mật', () => {
    expect(WK).toContain("if (p === '/ca/chi-tiet')")
    expect(WK.indexOf("p === '/ca/chi-tiet'")).toBeGreaterThan(WK.indexOf('if (!laThay(req, env, b))'))
  })

  it('CỔNG 1 — ca chép từ Sheet KHÔNG được đọc thẳng (`dayDu` theo `sinh_tai_d1`)', () => {
    const han = WK.slice(WK.indexOf('async function chiTietCaMoi('), WK.indexOf('async function chiTietCaMoi(') + 700)
    expect(han).toContain("Number(ca.sinh_tai_d1 ?? 0) === 1")
    // và máy thầy phải TỪ CHỐI gói chưa đủ
    const kh = DAY.slice(DAY.indexOf('export async function chiTietCaMoi('), DAY.indexOf('export async function chiTietCaMoi(') + 1200)
    expect(kh).toContain("j.dayDu !== true) return null")
  })

  it('CỔNG 2 — chưa có ngân hàng CÓ ĐÁP ÁN thì đi đường cũ', () => {
    // 20h10 cùng ngày: cổng này từng là `if (!xinKeyBank)`, tức chặn đường
    // nhanh VĨNH VIỄN trên điện thoại thầy (máy ấy không bao giờ có sẵn ngân
    // hàng của ca cũ). Nay lượt chữa lành cất ngân hàng lên R2 sau khoá riêng,
    // nên chỉ lùi khi thật sự chưa có.
    const i = API.indexOf('export async function chiTietCa(')
    const than = API.slice(i, i + 2400)
    expect(than).toContain('if (nhanh && (!xinKeyBank || nhanh.keyBank)) return doiChiTietCaMoi(nhanh)')
  })

  it('`dayCa` đặt cờ sinh_tai_d1, `dayNhieuCa` KHÔNG', () => {
    const day = WK.slice(WK.indexOf('async function dayCa('), WK.indexOf('async function danhSachCaMoi('))
    expect(day).toContain('sinh_tai_d1')
    const nhieu = WK.slice(WK.indexOf('async function dayNhieuCa('), WK.indexOf('async function danhSachCaMoi('))
    expect(nhieu.slice(0, nhieu.indexOf('for (const l of dsLuot)'))).not.toContain('sinh_tai_d1')
  })

  it('họ tên JOIN từ `danh_sach`, không nhân bản bảng tên thứ hai', () => {
    const han = WK.slice(WK.indexOf('async function chiTietCaMoi('), WK.indexOf('async function ghiDiemMoi('))
    expect(han).toContain('LEFT JOIN danh_sach d ON d.sbd = l.sbd')
    expect(han).toContain("COALESCE(NULLIF(l.ho_ten,''), d.ho_ten, '')")
  })

  it('gói dịch KHÔNG bịa hai trường máy chủ mới không giữ', () => {
    const han = API.slice(API.indexOf('function doiChiTietCaMoi('), API.indexOf('function doiChiTietCaMoi(') + 1400)
    expect(han).toContain("danhSachMoi: ''")
    expect(han).toContain("nguoiTao: ''")
    // Ngân hàng thì KHÔNG bịa rỗng nữa — trả đúng cái R2 giữ, hoặc null.
    expect(han).toContain('keyBank: (j.keyBank as KeyBank | null) ?? null')
  })

  it('lượt bị cổng danh sách chặn ĐƯỢC GHI LẠI — thầy đứng trong phòng phải thấy', () => {
    expect(WK).toContain('ghiChanVao(env, maCa, sbd')
    const han = WK.slice(WK.indexOf('async function ghiChanVao('), WK.indexOf('async function ghiChanVao(') + 900)
    expect(han).toContain('INSERT INTO chan_vao')
    // ghi hỏng không được đổi câu trả lời cho em
    expect(WK).toContain("'khong_co_sbd').catch(() => {})")
  })
})

describe('② GHI ĐIỂM SOI SANG D1 — nhưng chỉ lượt Apps Script ĐÃ NHẬN', () => {
  it('Worker chỉ UPDATE, không tạo dòng lượt mới', () => {
    const han = WK.slice(WK.indexOf('async function ghiDiemMoi('), WK.indexOf('function soHoacNull('))
    expect(han).toContain('UPDATE luot SET diem_i')
    expect(han).not.toContain('INSERT INTO luot')
  })

  it('lượt bị TỪ CHỐI vì lệch mẫu số KHÔNG được soi sang — hai nơi không được lệch điểm', () => {
    const i = API.indexOf("action: 'ghiDiem'")
    const than = API.slice(i, i + 1600)
    expect(than).toContain('const daGhi = new Set(')
    expect(than).toContain('daGhi.has(String(x.sbd))')
  })

  it('soi hỏng không được ném lỗi — điểm đã ghi thật bên Apps Script', () => {
    const i = API.indexOf("action: 'ghiDiem'")
    const than = API.slice(i, i + 1600)
    expect(than).toContain('} catch {')
  })
})

describe('③ MỞ CA — mốc giờ tính MỘT nơi, và không xếp sau lượt ghi Sheet', () => {
  const HAM = API.slice(API.indexOf('export async function publishSession('), API.indexOf('export async function capNhatKeyBank('))

  it('mốc bắt đầu tính ở máy thầy rồi GỬI KÈM, để hai bên ra đúng một chuỗi', () => {
    expect(HAM).toContain('const batDauISO = new Date(batDauMs).toISOString()')
    expect(HAM).toContain('batDau: batDauISO')
    expect(HAM).toContain('hetHanVao: hetHanISO')
    // gửi mốc tuyệt đối rồi thì KHÔNG gửi kèm số phút nữa, kẻo máy chủ tự tính lại
    expect(HAM).toContain('hanVaoPhut: 0')
  })

  it('luật tính hạn vào phòng khớp Apps Script: có số phút thì cộng vào mốc bắt đầu', () => {
    expect(HAM).toContain('hanPhut > 0 ? batDauMs + hanPhut * 60000 : mocMsHopLe(moc.hetHanVao)')
  })

  it('đẩy máy chủ mới dựng TRƯỚC lượt ghi Sheet, không xếp sau nó', () => {
    // Đợt 5D cho hai lượt chạy song song. Đợt 5E (19h15 cùng ngày) đi xa hơn:
    // trả lời NGAY khi máy chủ mới có ca, Sheet ghi ở nền. Luật giữ nguyên —
    // lượt đẩy máy chủ mới không bao giờ được xếp sau lượt ghi Sheet.
    expect(HAM.indexOf('const dayMayChuMoi = (async ()')).toBeLessThan(HAM.indexOf('const ghiSheet = async () =>'))
    expect(HAM).toContain('daLenMayChuMoi = await dayMayChuMoi')
  })

  it('gói đề CÔNG KHAI đẩy lên R2 là bản KHÔNG đáp án', () => {
    // 11/09 khuya: ngân hàng CÓ đáp án nay cũng được đẩy, nhưng sang một KHOÁ
    // KHÁC (`key/`) để `/nop` trả ngay cho em khi ca công bố điểm. Luật không
    // đổi — `de/` là đường công khai máy em tải, và nó KHÔNG được có đáp án.
    const khoi = HAM.slice(HAM.indexOf('const dayMayChuMoi = (async ()'), HAM.indexOf('const ghiSheet = async () =>'))
    expect(khoi).toContain('bank,')
    // Ngân hàng đáp án chỉ gửi khi ca CÔNG BỐ NGAY, không gửi bừa.
    expect(khoi).toContain("congBoDiem === 'ngay' ? keyBank : undefined")
    // Và bên Worker, hai khoá phải tách hẳn.
    const WK2 = fs.readFileSync(path.join(process.cwd(), 'server/src/index.ts'), 'utf8')
    const layDe = WK2.slice(WK2.indexOf('async function layDe('), WK2.indexOf('async function layDe(') + 700)
    expect(layDe).not.toContain('key/')
  })

  it('cờ máy chủ mới TẮT thì trả false, không ném — và chỗ gọi quay về đợi Sheet', () => {
    expect(HAM).toContain('if (!chMoi.BAT || !chMoi.URL) return false')
    expect(HAM).toContain('if (!daLenMayChuMoi) {')
  })
})

describe('④ MÀN HỌC SINH đọc máy chủ mới trước', () => {
  it('Worker có `/em/danh-sach`', () => {
    expect(WK).toContain("if (p === '/em/danh-sach')")
  })

  it('điểm gần nhất lấy từ LƯỢT ĐÃ CÓ ĐIỂM, không đoán', () => {
    const han = WK.slice(WK.indexOf('async function danhSachEmMoi('), WK.indexOf('async function danhSachEmMoi(') + 1600)
    expect(han).toContain('WHERE tong IS NOT NULL')
    expect(han).toContain('diemGanNhat: v.diem_gan_nhat === null')
  })

  it('danh sách RỖNG thì đi đường cũ, không hiện màn trống', () => {
    const han = DAY.slice(DAY.indexOf('export async function danhSachEmMoi('), DAY.length)
    expect(han).toContain('j.items.length === 0) return null')
  })

  it('máy thầy gọi máy chủ mới TRƯỚC Apps Script', () => {
    const i = API.indexOf('export async function danhSachEm(')
    const than = API.slice(i, i + 1400)
    expect(than.indexOf('danhSachEmMoi(')).toBeLessThan(than.indexOf("action: 'danhSachEm'"))
  })
})

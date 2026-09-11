// KHỐI A (CHẤM ĐIỂM) và KHỐI C (KHO ĐỀ) trên máy chủ mới.
//
// Bối cảnh: tối 11/09 thầy xoá sạch dữ liệu ca — 312 lượt · 90 ca · 259 danh
// sách · mạnh–yếu · phiếu — để tuần sau các lớp thi lại từ đầu. Nhờ vậy đợt này
// KHÔNG phải chép dữ liệu và KHÔNG phải chạy song song đối chiếu.
//
// Kho đề là thứ DUY NHẤT phải mang sang nguyên vẹn.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { docCauTuGoi } from '../src/lib/chuyen-kho-de'

const WK = fs.readFileSync(path.join(process.cwd(), 'server/src/index.ts'), 'utf8')
const SQL = fs.readFileSync(path.join(process.cwd(), 'server/migration-1209-toan-bo.sql'), 'utf8')
const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
const KHO = fs.readFileSync(path.join(process.cwd(), 'src/lib/chuyen-kho-de.ts'), 'utf8')

describe('MIGRATION — chỉ thêm, không đụng gì đang có', () => {
  it('không có lệnh phá', () => {
    for (const cam of ['DROP ', 'RENAME ', 'DELETE FROM', 'ALTER TABLE luot', 'ALTER TABLE ca ']) {
      expect(SQL.toUpperCase(), cam).not.toContain(cam.toUpperCase())
    }
  })

  it('tên cột tiến độ KHỚP MỘT-MỘT sheet: số câu và SỐ SAI', () => {
    // Sheet `TienDoCa`/`TienDoHS` lưu soCau + soSai, không lưu số đúng. Đổi tên
    // ở đây là mở đường cho lệch dữ liệu giữa hai nơi.
    const tdc = SQL.slice(SQL.indexOf('CREATE TABLE IF NOT EXISTS tien_do_ca'), SQL.indexOf('CREATE INDEX IF NOT EXISTS idx_tdc_em'))
    expect(tdc).toContain('so_cau')
    expect(tdc).toContain('so_sai')
    expect(tdc).not.toContain('so_dung')
  })

  it('dựng đủ bảng của cả bốn khối', () => {
    for (const b of ['chi_tiet_cau', 'ban_do_sai', 'tien_do_ca', 'tien_do_hs', 'qid_da_lam', 'len_bang', 'cau_hoi', 'de_kho', 'hoc_sinh', 'phu_huynh', 'tin_nhan', 'nop_khac_phuc']) {
      expect(SQL, b).toContain(`CREATE TABLE IF NOT EXISTS ${b}`)
    }
  })
})

describe('KHỐI A — luật chấm điểm phải KHỚP Apps Script', () => {
  const HAM = WK.slice(WK.indexOf('async function chamDiem('), WK.indexOf('async function tienDoEm('))

  it('chi tiết cũ của ĐÚNG lượt ấy bị XOÁ trước khi ghi lại', () => {
    // Ghi đè theo khoá không đủ: lần chấm mới có thể ÍT câu hơn lần trước, và
    // dòng thừa còn lại sẽ cộng nhầm vào tiến độ.
    expect(HAM).toContain('DELETE FROM chi_tiet_cau WHERE ma_ca = ? AND sbd = ? AND lan_thu = ?')
    expect(HAM.indexOf('DELETE FROM chi_tiet_cau')).toBeLessThan(HAM.indexOf('INSERT INTO chi_tiet_cau'))
  })

  it('bảng mạnh–yếu TÍNH LẠI TỪ ĐẦU, tuyệt đối không cộng dồn', () => {
    // Cộng dồn thì chấm lại một ca là cộng hai lần — đúng lỗi làm điểm ca
    // 447479 sai ba lần hôm 09/09.
    expect(HAM).toContain('UPDATE tien_do_hs SET so_cau = 0, so_sai = 0')
    expect(HAM).toContain('SELECT ? || \'|\' || chuyen_de, ?, chuyen_de, SUM(so_cau), SUM(so_sai), ?')
    expect(HAM).not.toContain('tien_do_hs.so_cau + excluded.so_cau')
  })

  it('tiến độ theo ca về 0 rồi tính lại, KHÔNG xoá dòng', () => {
    // Chuyên đề lần trước có mà lần này không còn thì dòng ấy phải còn để bảng
    // tổng trừ đi — đúng luật `ghiTienDo_` bên Apps Script.
    expect(HAM).toContain('UPDATE tien_do_ca SET so_cau = 0, so_sai = 0')
    expect(HAM).not.toContain('DELETE FROM tien_do_ca')
  })

  it('câu đã làm là HỢP TẬP — không bao giờ bớt', () => {
    expect(HAM).toContain('INSERT INTO qid_da_lam')
    expect(HAM).toContain('so_lan = qid_da_lam.so_lan + 1')
    expect(HAM).not.toContain('DELETE FROM qid_da_lam')
  })

  it('bản đồ câu sai chỉ nhận câu SAI và câu CÓ qid', () => {
    expect(HAM).toContain("if (!qid || c.dungSai !== false) continue")
  })

  it('bảng tổng chạy SAU khi mọi câu đã ghi xong', () => {
    expect(HAM.indexOf('for (let i = 0; i < cau.length; i += 100)')).toBeLessThan(HAM.indexOf('UPDATE tien_do_hs SET so_cau = 0'))
  })

  it('máy thầy gửi TRỌN GÓI kèm `cau`, không gửi mỗi điểm', () => {
    const i = API.indexOf("action: 'ghiDiem'")
    const than = API.slice(i, i + 2000)
    expect(than).toContain('chamDiemMoi(chMoi, secret, maCa, nhan)')
    // và chỉ lùi về đường chỉ-ghi-điểm khi máy chủ mới chưa có đường mới
    expect(than).toContain('if (!xong) {')
  })

  it('gọi lên bảng KHÔNG tạo lượt thi và KHÔNG đụng điểm', () => {
    const lb = WK.slice(WK.indexOf('async function ghiLenBangMoi('), WK.indexOf('async function ghiLenBangMoi(') + 1800)
    expect(lb).not.toContain('INSERT INTO luot')
    expect(lb).not.toContain('UPDATE luot')
    expect(lb).toContain('INSERT INTO tien_do_hs')
  })
})

describe('KHỐI C — KHO ĐỀ, thứ duy nhất mang sang nguyên vẹn', () => {
  it('gói đầy đủ nằm ở R2, chỉ mục nằm ở D1', () => {
    const HAM = WK.slice(WK.indexOf('async function dayDeKho('), WK.indexOf('async function danhSachDeKho('))
    expect(HAM).toContain('`kho/${maDe}.json`')
    expect(HAM).toContain('INSERT INTO cau_hoi')
  })

  it('ĐÁP ÁN không bao giờ đi đường công khai của học sinh', () => {
    // `GET /de/:maCa` là gói ĐÃ CẮT đáp án, dựng lúc mở ca. `kho/` có đáp án và
    // chỉ ra bằng đường đòi mã bí mật.
    const layDe = WK.slice(WK.indexOf('async function layDe('), WK.indexOf('async function layDe(') + 600)
    expect(layDe).not.toContain('kho/')
    expect(WK.indexOf("p === '/kho/lay'")).toBeGreaterThan(WK.indexOf('if (!laThay(req, env, b))'))
  })

  it('đẩy lại một đề thì chỉ mục CŨ của đề ấy phải đi', () => {
    // Không xoá thì câu đã bỏ khỏi đề vẫn còn được rút ra cho em.
    const HAM = WK.slice(WK.indexOf('async function dayDeKho('), WK.indexOf('async function danhSachDeKho('))
    expect(HAM).toContain('DELETE FROM cau_hoi WHERE ma_de = ?')
  })

  it('xoá đề là xoá MỀM, gói trên R2 giữ nguyên', () => {
    const HAM = WK.slice(WK.indexOf('async function xoaDeKho('), WK.indexOf('async function xoaDeKho(') + 700)
    expect(HAM).toContain('UPDATE de_kho SET da_xoa = ?')
    expect(HAM).not.toContain('env.DE.delete')
  })

  it('rút câu nói rõ kho CÒN BAO NHIÊU câu dùng được', () => {
    // Hứa 40 câu mà kho chỉ có 12 thì phải nói ra, không im lặng trả 12.
    const HAM = WK.slice(WK.indexOf('async function rutCau('), WK.indexOf('async function rutCau(') + 1600)
    expect(HAM).toContain('coSan: con.length')
  })
})

describe('CHUYỂN KHO — chạy lại được, không chết là mất cả lượt', () => {
  it('bỏ qua đề đã có, nên bấm lại là đi tiếp từ chỗ đứt', () => {
    expect(KHO).toContain('if (daCo.has(maDe))')
  })

  it('đề đã có mà RỖNG CÂU thì vẫn đẩy lại — lần trước đẩy dở', () => {
    expect(KHO).toContain('j.items.filter((x) => Number(x.soCau) > 0)')
  })

  it('không hỏi được danh sách bên kia thì KHÔNG đẩy gì cả', () => {
    // Đẩy mù là hàng chục phút vô ích và có thể ghi đè bản tốt bằng bản hỏng.
    expect(KHO).toContain("if (daCo === null) throw new Error('Máy chủ mới không trả lời — chưa đẩy gì cả')")
  })

  it('một đề hỏng KHÔNG dừng cả kho', () => {
    expect(KHO).toContain('kq.hong.push({ maDe')
  })

  it('khoá một lượt, hai lần bấm không chạy chồng', () => {
    expect(KHO).toContain('if (dangChay) throw new Error(')
  })
})

describe('ĐỌC CÂU TỪ GÓI ĐỀ — nhận mọi dạng gói qua các đời', () => {
  it('dạng `cau`', () => {
    expect(docCauTuGoi({ cau: [{ qid: 'a' }, { qid: 'b' }] })).toHaveLength(2)
  })

  it('dạng `items`', () => {
    expect(docCauTuGoi({ items: [{ qid: 'a' }] })).toHaveLength(1)
  })

  it('dạng ba phần I/II/III, và gắn đúng nhãn phần', () => {
    const ds = docCauTuGoi({ phanI: [{ qid: 'a' }], phanII: [{ qid: 'b' }], phanIII: [{ qid: 'c' }] })
    expect(ds).toHaveLength(3)
    expect(ds.map((c) => c.phan)).toEqual(['I', 'II', 'III'])
  })

  it('gói lạ thì trả rỗng, KHÔNG đoán', () => {
    expect(docCauTuGoi({ gi_do: 1 })).toEqual([])
    expect(docCauTuGoi(null)).toEqual([])
  })
})

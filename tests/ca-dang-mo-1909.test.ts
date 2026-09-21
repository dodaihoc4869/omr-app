// @vitest-environment node
// /hs/ca-dang-mo — nút "Vào thi" ở Bảng nhiệm vụ đổi màu khi LỚP của em có ca đang mở.
// Chỉ trả có/bao nhiêu ca; TUYỆT ĐỐI không lộ mã ca, tên ca hay thứ gì giúp vào thi khi thầy chưa phát mã.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const H = 3_600_000
const iso = (gio: number) => new Date(Date.now() + gio * H).toISOString()

function hs(d: D1That, sbd: string, lop: string, namSinh = '2008') {
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,'mk','x')").run(sbd, 'Em', lop)
  d.sql.prepare("INSERT INTO danh_sach(sbd,ho_ten,nam_sinh,lop,cap_nhat_luc) VALUES(?,?,?,?,'x')").run(sbd, 'Em', namSinh, lop)
}
function ca(d: D1That, ma: string, o: Partial<{ lop: string | null; trang_thai: string; loai: string; bat_dau: string; het_han_vao: string; pham_vi: string; chon: string | null }> = {}) {
  const c = { lop: '12', trang_thai: 'mo', loai: 'thi', bat_dau: iso(-1), het_han_vao: iso(2), pham_vi: 'tu_do', chon: null, ...o }
  d.sql.prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,bat_dau,het_han_vao,thoi_gian_phut,pham_vi,danh_sach_chon_json,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .run(ma, `Tên bí mật ${ma}`, c.trang_thai, c.loai, c.lop, c.bat_dau, c.het_han_vao, 45, c.pham_vi, c.chon, 'x')
}
const hoi = (d: D1That, b: Record<string, unknown>) => goiWorker(worker, d.env, '/hs/ca-dang-mo', b)

describe('/hs/ca-dang-mo', () => {
  it('có ca mở đúng lớp → coCaMo=true, soCa=1; ca lớp khác → false', async () => {
    const d = taoD1That()
    hs(d, 'E12', '12'); hs(d, 'E11', '11')
    ca(d, 'C12', { lop: '12' })
    expect(await hoi(d, { sbd: 'E12' })).toMatchObject({ ok: true, coCaMo: true, soCa: 1 })
    expect(await hoi(d, { sbd: 'E11' })).toMatchObject({ ok: true, coCaMo: false, soCa: 0 })
  })

  it('đếm đúng số ca: hai ca mở đúng lớp → soCa=2', async () => {
    const d = taoD1That()
    hs(d, 'E12', '12')
    ca(d, 'A', { lop: '12' }); ca(d, 'B', { lop: '12' }); ca(d, 'C', { lop: '10' })
    expect(await hoi(d, { sbd: 'E12' })).toMatchObject({ coCaMo: true, soCa: 2 })
  })

  it('ca đã khoá/đóng, đã xoá, hết hạn vào (cờ `mo` còn sót), chưa tới giờ, bài tập, không gắn lớp → KHÔNG tính', async () => {
    const d = taoD1That()
    hs(d, 'E12', '12')
    ca(d, 'DONG', { trang_thai: 'dong' })
    ca(d, 'XOA', { trang_thai: 'da_xoa' })
    ca(d, 'HETHAN', { bat_dau: iso(-10), het_han_vao: iso(-5) }) // cờ `mo` nhưng đã quá hạn vào — chính là 7 ca cũ trong D1 thật
    ca(d, 'CHUAMO', { bat_dau: iso(3), het_han_vao: iso(6) })
    ca(d, 'BAITAP', { loai: 'baitap' })
    ca(d, 'KHONGLOP', { lop: null })
    ca(d, 'LOPRONG', { lop: '' })
    expect(await hoi(d, { sbd: 'E12' })).toMatchObject({ ok: true, coCaMo: false, soCa: 0 })
    ca(d, 'MO') // thêm đúng một ca mở → chỉ ca ấy được đếm
    expect(await hoi(d, { sbd: 'E12' })).toMatchObject({ coCaMo: true, soCa: 1 })
  })

  it('em không có lớp → không khớp (không đoán); SBD lạ → ok:false và không ghi gì', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('E0','x','','x')").run()
    ca(d, 'C12', { lop: '12' })
    expect(await hoi(d, { sbd: 'E0' })).toMatchObject({ ok: true, coCaMo: false, soCa: 0 })
    const truoc = ['ca', 'luot', 'hoc_sinh', 'danh_sach'].map((b) => d.chup(b))
    for (const sbd of ['00000000', 'khong-co', 'x'.repeat(200)]) {
      expect(await hoi(d, { sbd })).toMatchObject({ ok: false, error: 'Không tìm thấy học sinh' })
    }
    expect((await hoi(d, {})).ok).toBe(false)
    expect(['ca', 'luot', 'hoc_sinh', 'danh_sach'].map((b) => d.chup(b))).toEqual(truoc)
  })

  it('em đã NỘP ca ấy → không còn "đang mở" với em; đang làm dở thì vẫn mở (khôi phục được)', async () => {
    const d = taoD1That()
    hs(d, 'E12', '12'); hs(d, 'E2', '12')
    ca(d, 'C12', { lop: '12' })
    const luot = (sbd: string, tt: string) => d.sql.prepare('INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,id_thiet_bi,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?)')
      .run(`C12|${sbd}|1`, 'C12', sbd, 1, 'x', tt, 'may-khac', 'x')
    luot('E12', 'da_nop'); luot('E2', 'dang_lam')
    expect(await hoi(d, { sbd: 'E12' })).toMatchObject({ coCaMo: false, soCa: 0 })
    expect(await hoi(d, { sbd: 'E2' })).toMatchObject({ coCaMo: true, soCa: 1 })
  })

  it('phạm vi khối/danh sách chọn theo ĐÚNG luật cổng vào thi: em không thuộc phạm vi thì không thấy ca đang mở', async () => {
    const d = taoD1That()
    hs(d, 'A', '12', '2008'); hs(d, 'B', '12', '2007')
    ca(d, 'KHOI', { pham_vi: 'khoi', chon: JSON.stringify('2008') })
    expect(await hoi(d, { sbd: 'A' })).toMatchObject({ coCaMo: true, soCa: 1 })
    expect(await hoi(d, { sbd: 'B' })).toMatchObject({ coCaMo: false, soCa: 0 })
    ca(d, 'CHON', { pham_vi: 'chon', chon: JSON.stringify(['B']) })
    expect(await hoi(d, { sbd: 'A' })).toMatchObject({ soCa: 1 }) // chỉ ca KHOI
    expect(await hoi(d, { sbd: 'B' })).toMatchObject({ soCa: 1 }) // chỉ ca CHON
  })

  it('JSON trả về KHÔNG chứa mã ca, tên ca, mật khẩu hay gì giúp vào thi — chỉ ok/coCaMo/soCa', async () => {
    const d = taoD1That()
    hs(d, 'E12', '12')
    ca(d, 'BIMAT123', { lop: '12' })
    d.sql.exec("UPDATE ca SET mat_khau = 'matkhau-ca', bank_r2 = 'de/BIMAT123.json'")
    const req = new Request('https://test/hs/ca-dang-mo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sbd: 'E12' }) })
    const chu = await (await worker.fetch(req, d.env)).text()
    expect(chu).not.toMatch(/ma_?ca|ten_?ca|BIMAT|matkhau|bank|de\/|Tên bí mật/i)
    const j = JSON.parse(chu)
    expect(Object.keys(j).sort()).toEqual(['coCaMo', 'nhipDeNghi', 'ok', 'serverNow', 'soCa']) // SỬA CÓ CHỦ Ý 21/09: mọi phản hồi JSON mang nhipDeNghi (hệ số nhịp, suc-khoe-may.ts) — không lộ gì về ca
    expect(j).toMatchObject({ ok: true, coCaMo: true, soCa: 1 })
  })

  it('dùng được cả bằng token (SBD lấy từ chữ ký); token sai bị từ chối', async () => {
    const d = taoD1That()
    hs(d, 'E12', '12')
    ca(d, 'C12', { lop: '12' })
    const token = await gameToken(d.env, 'E12')
    expect(await hoi(d, { token })).toMatchObject({ ok: true, coCaMo: true, soCa: 1 })
    expect((await hoi(d, { token: token + 'x' })).ok).toBe(false)
  })

  it('HAI truy vấn cho một lượt hỏi (không nhân theo số ca)', async () => {
    const d = taoD1That()
    hs(d, 'E12', '12')
    for (let i = 0; i < 6; i++) ca(d, `C${i}`, { lop: '12' })
    // Cổng đóng băng của reset đọc cau_hinh 1 lần rồi đệm 3 giây trong isolate: làm nóng đệm để chỉ đo truy vấn của lệnh này.
    await goiWorker(worker, d.env, '/khong-co-duong-nay', {})
    const truoc = d.soLenh.prepare
    await hoi(d, { sbd: 'E12' })
    // 1 = em có thật + lớp + năm sinh · 2 = ca mở của lớp em (kèm lượt của em)
    expect(d.soLenh.prepare - truoc).toBe(2)
  })
})

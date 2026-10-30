// @vitest-environment node
// B3 CHUỖI NGÀY THEO BÀI — phần D1 (chạy thật trên D1 giả): đọc sổ học / tự sửa xong / vắng có phép / bình mua; cộng bình chống trùng; gác cờ duolingo_bai.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { docChuoiNgayBai, chuoiBaiNeuBat, congBinh } from '../server/src/chuoi-ngay-bai-d1'
import { xoaDemPhamVi } from '../server/src/bai-da-day'
import { datNgayBaoTriChoTest } from '../server/src/ngay-bao-tri'
// Luật chuỗi dùng ngày mẫu cuối tháng 10: ghim lịch bảo trì như lúc viết test (chỉ 27/10) — 28/10 + 29/10 thêm vào lịch vận hành 30/10 (tests/ngay-bao-tri-2710.test.ts).
beforeAll(() => datNgayBaoTriChoTest(['2026-10-27']))
afterAll(() => datNgayBaoTriChoTest())

afterEach(() => { xoaDemPhamVi() })
// 29/10/2026 15:00 VN
const NOW = Date.parse('2026-10-29T08:00:00Z')
function kho() {
  const k = taoKhoOmni({}, 2)
  const sk = k.d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance) VALUES(?,?,?,'game','p',1,?,?,?,'none')")
  const lam = (sbd: string, ngay: string, so: number, ketQua: number | null = 1) => { for (let i = 0; i < so; i++) sk.run(`${sbd}|${ngay}|${ketQua}|${i}`, sbd, `q${ketQua ?? "x"}${i}`, ketQua, `${ngay}T03:00:00Z`, ngay) }
  return { ...k, lam }
}

describe('docChuoiNgayBai', () => {
  it('ngày đủ 6 câu có kết quả mới tính; câu bỏ trống (ket_qua NULL) không tính; hôm nay chưa đủ giữ tới hôm qua', async () => {
    const k = kho()
    k.lam('S1', '2026-10-27', 6); k.lam('S1', '2026-10-28', 6); k.lam('S1', '2026-10-29', 3); k.lam('S1', '2026-10-29', 6, null)
    const r = await docChuoiNgayBai(k.env, 'S1', NOW)
    expect(r?.so).toBe(2)
    expect(r?.lich7.at(-1)).toEqual({ ngay: '2026-10-29', kieu: 'cho' })
  })
  it('bảng tự sửa / điểm danh / bình mua chưa có ⇒ vẫn đọc được (coi như rỗng)', async () => {
    const k = kho()
    k.lam('S1', '2026-10-28', 6)
    expect((await docChuoiNgayBai(k.env, 'S1', NOW))?.so).toBe(1)
  })
  it('cộng bình: chống trùng theo id, chặn số lạ; bình mua có tác dụng giữ chuỗi', async () => {
    const k = kho()
    // Bắt đầu thứ Ba 27/10 (chưa có bình thứ Hai): học 27, lỡ 28 ⇒ không bình thì tắt. Mua 1 bình ngày 27.
    k.lam('S1', '2026-10-27', 6); k.lam('S1', '2026-10-29', 6)
    expect((await docChuoiNgayBai(k.env, 'S1', NOW))?.so).toBe(1)
    expect(await congBinh(k.env, 'S1', 1, 'tinh_the', 'gd-1', Date.parse('2026-10-27T05:00:00Z'))).toBe(true)
    expect(await congBinh(k.env, 'S1', 1, 'tinh_the', 'gd-1', Date.parse('2026-10-27T05:00:00Z'))).toBe(false)
    await expect(congBinh(k.env, 'S1', 9, 'tinh_the', 'gd-2')).rejects.toThrow()
    const r = await docChuoiNgayBai(k.env, 'S1', NOW)
    expect(r?.so).toBe(2); expect(r?.binhVuaDo).toBe('2026-10-28')
  })
})

describe('chuoiBaiNeuBat — gác cờ duolingo_bai', () => {
  it('vắng cờ ⇒ null (giữ cách đếm cũ); bật ⇒ có chuỗi; thử theo lớp đúng lớp em', async () => {
    const k = kho()
    k.lam('S1', '2026-10-28', 6)
    expect(await chuoiBaiNeuBat(k.env, 'S1', NOW)).toBeNull()
    k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('duolingo_bai','{"cheDo":"thu","lop":["12A1"]}','x')`)
    expect((await chuoiBaiNeuBat(k.env, 'S1', NOW + 20_000))?.so).toBe(1)
  })
})

describe('khoá nguồn — nối dây /hs và /ph, không thêm lệnh D1 khi cờ tắt', () => {
  const { readFileSync } = require('node:fs') as typeof import('node:fs')
  const gv = readFileSync('server/src/game-v2.ts', 'utf8'), ph = readFileSync('server/src/ph-tat-ca-ve-con.ts', 'utf8')
  const kh = readFileSync('server/src/ph-truy-cap.ts', 'utf8'), dem = readFileSync('server/src/cau-hinh-dem.ts', 'utf8')
  it('Sảnh Gói 7 trả chuoiNgay khi cờ bật (đọc song song lập kế hoạch)', () => {
    expect(gv).toMatch(/const chuoiSom=(?:hocTapSom\?\.chuoi\?\?)?import\('\.\/chuoi-ngay-bai-d1'\)\.then\(m=>m\.chuoiBaiNeuBat/) // 27/10 sẵn sàng: đọc sớm cùng đợt mật khẩu (batDauHocTapSom)
    expect(gv).toMatch(/\.\.\.\(chuoi7\?\{chuoiNgay:chuoi7\}:\{\}\)/)
  })
  it('Phụ huynh: cờ đọc KÈM truy vấn gộp; bật ⇒ tongQuan.chuoiNgay + chuoiNgayHoc cùng số; /ph/ke-hoach trả chuoiNgay', () => {
    expect(ph).toMatch(/'bang_tin_tu', 'duolingo_bai'\)/)
    expect(ph).toMatch(/tongQuan\.chuoiNgay = chuoiBai/)
    expect(ph).toMatch(/if \(chuoiBai\.so > 0\) tongQuan\.chuoiNgayHoc = chuoiBai\.so/)
    expect(kh).toMatch(/\.\.\.\(chuoiBai \? \{ chuoiNgay: chuoiBai \} : \{\}\)/)
  })
  it('cờ duolingo_bai nằm trong nhóm cờ đọc kèm của đệm cấu hình', () => { expect(dem).toMatch(/'kiem_tra_ca_nhan_v1', 'duolingo_bai'\]/) })
})

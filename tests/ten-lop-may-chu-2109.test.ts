// @vitest-environment node
// TÊN LỚP (thầy lệnh 21/09, Boss chốt; docs/hop-dong-ten-lop-2109.md): `hoc_sinh.lop` GIỮ NGUYÊN = khối; cột mới `hoc_sinh.ten_lop`.
// `/gv/lop` đọc-chỉ (≤ 3 truy vấn) · `/gv/doi-lop-em` ghi ĐÚNG cột ten_lop của MỘT em · `tenLop` thêm vào `/em/danh-sach` và `listStudents` · chưa có cột ⇒ không vỡ, không bịa.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { themEm } from '../server/src/goi-cu'
import { chuanTenLop, macDinhTenLop, tenLopCuaEm, TEN_LOP_THUONG_12, TEN_LOP_TOI_DA } from '../server/src/ten-lop'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

afterEach(() => vi.useRealTimers())

const goi = (d: D1That, duong: string, b: Record<string, unknown> = {}, thay = true) => goiWorker(worker, d.env, duong, b, thay)
const themHs = (d: D1That, sbd: string, hoTen: string, lop: string, tenLop: string | null = null) =>
  d.sql.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,'mk','2026-09-01T00:00:00.000Z')").run(sbd, hoTen, lop, tenLop)
const themDs = (d: D1That, sbd: string, hoTen: string, lop: string) => d.sql.prepare("INSERT OR REPLACE INTO danh_sach(sbd,ho_ten,lop,cap_nhat_luc) VALUES(?,?,?,'x')").run(sbd, hoTen, lop)
function theoDoiGhi(d: D1That): string[] {
  const ghi: string[] = []
  const goc = d.env.DB.prepare.bind(d.env.DB)
  d.env.DB.prepare = ((q: string) => {
    if (/^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i.test(q)) ghi.push(q.trim().slice(0, 50))
    return goc(q)
  }) as typeof d.env.DB.prepare
  return ghi
}
/** Trường: khối 12 (5 em, 2 em Tinh Hoa), khối 11 (2 em), khối 10 (1 em), 1 em không khối; 1 em chỉ có ở danh sách cổng (khối 12). */
function truong(): D1That {
  const d = taoD1That()
  themHs(d, '12001', 'An', '12', '12 - Tinh Hoa'); themHs(d, '12002', 'Bình', '12', '12 - Tinh Hoa')
  themHs(d, '12003', 'Chi', '12'); themHs(d, '12004', 'Dũng', '12', ''); themHs(d, '12005', 'Em', '12', '   ')
  themHs(d, '11001', 'Giang', '11'); themHs(d, '11002', 'Hà', '11'); themHs(d, '10001', 'Khoa', '10'); themHs(d, '99001', 'Lan', '')
  themDs(d, '12006', 'Minh', '12'); themDs(d, '12001', 'An', '12')
  return d
}

describe('hàm thuần', () => {
  it('macDinhTenLop: khối 12 ⇒ "12 - Lớp Thường"; khối khác ⇒ chính khối; rỗng ⇒ "Chưa xếp lớp"', () => {
    expect(macDinhTenLop('12')).toBe('12 - Lớp Thường')
    expect(macDinhTenLop(' 12 ')).toBe('12 - Lớp Thường')
    expect(macDinhTenLop('11')).toBe('11')
    expect(macDinhTenLop('10')).toBe('10')
    expect(macDinhTenLop('')).toBe('Chưa xếp lớp')
    expect(macDinhTenLop(null)).toBe('Chưa xếp lớp')
  })
  it('tenLopCuaEm: đã gán thì dùng (cắt khoảng trắng), NULL/rỗng/khoảng trắng ⇒ mặc định theo khối', () => {
    expect(tenLopCuaEm('12', '12 - Tinh Hoa')).toBe('12 - Tinh Hoa')
    expect(tenLopCuaEm('12', ' 12 - Tinh Hoa ')).toBe('12 - Tinh Hoa')
    for (const v of [null, undefined, '', '   ']) expect(tenLopCuaEm('12', v)).toBe(TEN_LOP_THUONG_12)
    expect(tenLopCuaEm('11', null)).toBe('11')
  })
  it('chuanTenLop: gộp khoảng trắng; từ chối rỗng / không phải chuỗi / > 40 ký tự / ký tự điều khiển / < >', () => {
    expect(chuanTenLop('  12   -  Tinh Hoa ')).toEqual({ ok: true, ten: '12 - Tinh Hoa' })
    expect(chuanTenLop('x'.repeat(TEN_LOP_TOI_DA))).toMatchObject({ ok: true })
    expect(chuanTenLop('x'.repeat(TEN_LOP_TOI_DA + 1))).toMatchObject({ ok: false, error: expect.stringContaining('40') })
    expect(chuanTenLop('Ớ'.repeat(TEN_LOP_TOI_DA))).toMatchObject({ ok: true }) // đếm KÝ TỰ, không đếm byte
    expect(chuanTenLop('😀'.repeat(TEN_LOP_TOI_DA))).toMatchObject({ ok: true }) // ký tự ngoài BMP (2 đơn vị UTF-16) vẫn tính là 1 ký tự
    expect(chuanTenLop('😀'.repeat(TEN_LOP_TOI_DA + 1))).toMatchObject({ ok: false })
    expect(chuanTenLop('12\t-\n  Tinh\r\nHoa')).toEqual({ ok: true, ten: '12 - Tinh Hoa' }) // tab / xuống dòng cũng gộp thành một dấu cách
    for (const v of ['', '   ', 5, null, undefined, {}]) expect(chuanTenLop(v), String(v)).toMatchObject({ ok: false })
    for (const v of ['a\u0000b', 'a\u001fb', 'a\u007fb', '<b>x</b>', 'a>b']) expect(chuanTenLop(v), v).toMatchObject({ ok: false, error: 'Tên lớp có ký tự không hợp lệ.' })
  })
})

describe('/gv/lop (đọc-chỉ)', () => {
  it('không mã bí mật ⇒ 403', async () => {
    const d = truong()
    expect((await goi(d, '/gv/lop', {}, false)).ok).toBe(false)
    expect((await goi(d, '/gv/doi-lop-em', { sbd: '12003', tenLop: 'X' }, false)).ok).toBe(false)
    expect(d.sql.prepare("SELECT ten_lop FROM hoc_sinh WHERE sbd = '12003'").get()).toEqual({ ten_lop: null })
  })
  it('mỗi em ĐÚNG MỘT lớp; chưa gán ⇒ mặc định theo khối; khối lớn trước; em chỉ ở danh sách cổng cũng có lớp; ≤ 3 truy vấn; KHÔNG ghi', async () => {
    const d = truong()
    const ghi = theoDoiGhi(d)
    const r = await goi(d, '/gv/lop')
    expect(r.ok).toBe(true)
    expect(r.lop).toEqual([
      { tenLop: '12 - Lớp Thường', khoi: '12', soEm: 4, sbd: ['12003', '12004', '12005', '12006'] },
      { tenLop: '12 - Tinh Hoa', khoi: '12', soEm: 2, sbd: ['12001', '12002'] },
      { tenLop: '11', khoi: '11', soEm: 2, sbd: ['11001', '11002'] },
      { tenLop: '10', khoi: '10', soEm: 1, sbd: ['10001'] },
      { tenLop: 'Chưa xếp lớp', khoi: '', soEm: 1, sbd: ['99001'] },
    ])
    expect(r.soEm).toBe(10)
    expect(r.soTruyVan).toBeLessThanOrEqual(3)
    expect(r.lyDoThieu).toBeUndefined()
    const moi = (r.lop as { sbd: string[] }[]).flatMap((l) => l.sbd)
    expect(new Set(moi).size).toBe(moi.length) // không em nào ở hai lớp
    expect(ghi).toEqual([])
  })
  it('khối của lớp = khối ĐÔNG nhất trong lớp; hoà ⇒ khối lớn hơn', async () => {
    const d = truong()
    themHs(d, '12010', 'X1', '12', 'Lớp ghép'); themHs(d, '11010', 'X2', '11', 'Lớp ghép'); themHs(d, '11011', 'X3', '11', 'Lớp ghép') // 2 em khối 11 + 1 em khối 12
    themHs(d, '10010', 'Y1', '10', 'Lớp hoà'); themHs(d, '11020', 'Y2', '11', 'Lớp hoà') // hoà 1–1 ⇒ khối 11
    themHs(d, '12009', 'X0', '11', 'Lớp ghép') // chèn SAU nhưng SBD nhỏ hơn: danh sách sbd phải được sắp
    const lop = (await goi(d, '/gv/lop')).lop as { tenLop: string; khoi: string; soEm: number; sbd: string[] }[]
    expect(lop.find((l) => l.tenLop === 'Lớp ghép')).toMatchObject({ khoi: '11', soEm: 4, sbd: ['11010', '11011', '12009', '12010'] })
    expect(lop.find((l) => l.tenLop === 'Lớp hoà')).toMatchObject({ khoi: '11', soEm: 2 })
  })
  it('em đã khoá (trang_thai = khoa) không vào danh sách lớp', async () => {
    const d = truong()
    d.sql.prepare("UPDATE hoc_sinh SET trang_thai = 'khoa' WHERE sbd = '12003'").run()
    const r = await goi(d, '/gv/lop')
    expect((r.lop as { sbd: string[] }[]).flatMap((l) => l.sbd)).not.toContain('12003')
  })
  it('chưa chạy migration (thiếu cột ten_lop): vẫn trả lớp mặc định + lyDoThieu; không ném lỗi', async () => {
    const d = truong()
    d.sql.exec('ALTER TABLE hoc_sinh DROP COLUMN ten_lop')
    const r = await goi(d, '/gv/lop')
    expect(r.ok).toBe(true)
    expect(r.lyDoThieu).toMatch(/ten_lop/)
    expect((r.lop as { tenLop: string }[]).map((l) => l.tenLop)).toEqual(['12 - Lớp Thường', '11', '10', 'Chưa xếp lớp'])
    d.sql.prepare("UPDATE hoc_sinh SET trang_thai = 'khoa' WHERE sbd = '12003'").run()
    expect(((await goi(d, '/gv/lop')).lop as { sbd: string[] }[]).flatMap((l) => l.sbd)).not.toContain('12003') // đường dự phòng cũng bỏ em đã khoá
  })
})

describe('/gv/doi-lop-em (ghi)', () => {
  it('đổi ĐÚNG cột ten_lop của một em: không đụng lop (khối), cap_nhat_luc, em khác; /gv/lop thấy ngay; chuẩn hoá khoảng trắng', async () => {
    const d = truong()
    const truoc = d.sql.prepare("SELECT * FROM hoc_sinh WHERE sbd = '12003'").get() as Record<string, unknown>
    const r = await goi(d, '/gv/doi-lop-em', { sbd: '12003', tenLop: '  12 -  Tinh Hoa ' })
    expect(r).toMatchObject({ ok: true, sbd: '12003', tenLop: '12 - Tinh Hoa' })
    const sau = d.sql.prepare("SELECT * FROM hoc_sinh WHERE sbd = '12003'").get() as Record<string, unknown>
    expect({ ...sau, ten_lop: null }).toEqual({ ...truoc, ten_lop: null })
    expect(sau.ten_lop).toBe('12 - Tinh Hoa')
    expect(d.sql.prepare("SELECT ten_lop FROM hoc_sinh WHERE sbd = '12004'").get()).toEqual({ ten_lop: '' })
    const lop = (await goi(d, '/gv/lop')).lop as { tenLop: string; sbd: string[] }[]
    expect(lop.find((l) => l.tenLop === '12 - Tinh Hoa')!.sbd).toEqual(['12001', '12002', '12003'])
    // thầy gõ tên MỚI cũng được
    expect(await goi(d, '/gv/doi-lop-em', { sbd: '12004', tenLop: '12 - Ôn thi' })).toMatchObject({ ok: true, tenLop: '12 - Ôn thi' })
    expect((await goi(d, '/gv/lop')).lop.map((l: { tenLop: string }) => l.tenLop)).toContain('12 - Ôn thi')
  })
  it('từ chối bằng lời tiếng Việt và KHÔNG ghi: thiếu sbd, tên rỗng/quá dài/ký tự lạ, sbd không có, em chỉ có ở danh sách cổng', async () => {
    const d = truong()
    const truoc = JSON.stringify(d.sql.prepare('SELECT * FROM hoc_sinh ORDER BY sbd').all())
    const thu = async (b: Record<string, unknown>) => goi(d, '/gv/doi-lop-em', b)
    expect(await thu({ tenLop: 'X' })).toEqual({ ok: false, error: 'Thiếu số báo danh.', serverNow: expect.anything() })
    expect(await thu({ sbd: '12003', tenLop: '' })).toMatchObject({ ok: false, error: 'Tên lớp không được để trống.' })
    expect(await thu({ sbd: '12003' })).toMatchObject({ ok: false, error: 'Thiếu tên lớp.' })
    expect(await thu({ sbd: '12003', tenLop: 'x'.repeat(41) })).toMatchObject({ ok: false, error: expect.stringContaining('tối đa 40') })
    expect(await thu({ sbd: '12003', tenLop: '<i>' })).toMatchObject({ ok: false, error: 'Tên lớp có ký tự không hợp lệ.' })
    expect(await thu({ sbd: '00000', tenLop: 'X' })).toMatchObject({ ok: false, error: 'Không tìm thấy học sinh có số báo danh 00000.' })
    expect(await thu({ sbd: '12006', tenLop: 'X' })).toMatchObject({ ok: false, error: 'Em này chưa có hồ sơ tài khoản nên chưa đổi được tên lớp.' })
    expect(JSON.stringify(d.sql.prepare('SELECT * FROM hoc_sinh ORDER BY sbd').all())).toBe(truoc)
  })
  it('chưa chạy migration: báo bằng lời, không ném lỗi', async () => {
    const d = truong()
    d.sql.exec('ALTER TABLE hoc_sinh DROP COLUMN ten_lop')
    expect(await goi(d, '/gv/doi-lop-em', { sbd: '12003', tenLop: 'X' })).toMatchObject({ ok: false, error: expect.stringContaining('thiếu cột tên lớp') })
  })
  it('lệnh ghi hồ sơ khác (thêm em lại / nạp danh sách) KHÔNG xoá tên lớp đã gán', async () => {
    const d = truong()
    expect((await themEm(d.env, { sbd: '12001', hoTen: 'An Mới', namSinh: '2008', lop: '12' })).ok).toBe(true)
    expect(d.sql.prepare("SELECT ho_ten, ten_lop FROM hoc_sinh WHERE sbd = '12001'").get()).toEqual({ ho_ten: 'An Mới', ten_lop: '12 - Tinh Hoa' })
  })
})

describe('trường tenLop ở danh sách học sinh', () => {
  it('/em/danh-sach: mỗi em có tenLop (đã gán hoặc mặc định theo khối); `lop` vẫn là KHỐI', async () => {
    const d = truong()
    const r = await goi(d, '/em/danh-sach')
    const theo = new Map((r.items as { sbd: string; lop: string; tenLop: string }[]).map((x) => [x.sbd, x]))
    expect(theo.get('12001')).toMatchObject({ lop: '12', tenLop: '12 - Tinh Hoa' })
    expect(theo.get('12006')).toMatchObject({ lop: '12', tenLop: '12 - Lớp Thường' }) // chỉ ở danh sách cổng
  })
  it('listStudents (hồ sơ đã đăng ký): có tenLop, lop giữ nguyên; thiếu cột ⇒ KHÔNG thêm trường', async () => {
    const d = truong()
    const ra = await goiWorker(worker, d.env, '/goi', { action: 'listStudents' }, true)
    const items = (ra.items ?? []) as { sbd: string; lop: string; tenLop?: string }[]
    expect(items.find((x) => x.sbd === '12001')).toMatchObject({ lop: '12', tenLop: '12 - Tinh Hoa' })
    expect(items.find((x) => x.sbd === '11001')).toMatchObject({ lop: '11', tenLop: '11' })
    d.sql.exec('ALTER TABLE hoc_sinh DROP COLUMN ten_lop')
    const cu = (await goi(d, '/em/danh-sach')).items as { tenLop?: string }[]
    expect(cu.every((x) => x.tenLop === undefined)).toBe(true)
  })
})

describe('tệp gán dữ liệu thật: 42 em "12 - Tinh Hoa" (41 em danh sách ca 848875 + 12074)', () => {
  const sql = readFileSync('server/gan-2109-ten-lop-tinh-hoa.sql', 'utf-8')
  const dsSbd = [...(/IN \(([^)]*)\)/.exec(sql.replace(/^--.*$/gm, ''))?.[1] ?? '').matchAll(/'(\d+)'/g)].map((m) => m[1]!)
  it('đúng 42 SBD khác nhau, có 12074, không dính khối khác (ràng buộc lop = 12); KHÔNG là tệp migration-*.sql (test/D1 mới không tự nạp)', () => {
    expect(dsSbd.length).toBe(42)
    expect(new Set(dsSbd).size).toBe(42)
    expect(dsSbd).toContain('12074')
    expect(sql).toContain("lop = '12'")
    expect(sql).toMatch(/SET ten_lop = '12 - Tinh Hoa'/)
    expect('gan-2109-ten-lop-tinh-hoa.sql').not.toMatch(/^migration-/)
  })
  it('chạy trên D1 có cột: chỉ đúng các em khối 12 trong danh sách được đổi; em cùng SBD ở khối khác, em ngoài danh sách không bị đụng', () => {
    const d = taoD1That()
    themHs(d, '12021', 'A', '12'); themHs(d, '12074', 'Trần Triệu Bảo An', '12'); themHs(d, '12999', 'Ngoài danh sách', '12')
    themHs(d, '12022', 'Khối khác', '11'); themHs(d, '12027', 'Đã có tên khác', '12', '12 - Ôn thi')
    d.sql.exec(sql)
    const tl = (sbd: string) => (d.sql.prepare('SELECT ten_lop FROM hoc_sinh WHERE sbd = ?').get(sbd) as { ten_lop: string | null }).ten_lop
    expect([tl('12021'), tl('12074'), tl('12999'), tl('12022')]).toEqual(['12 - Tinh Hoa', '12 - Tinh Hoa', null, null])
    expect(tl('12027')).toBe('12 - Tinh Hoa') // lệnh thầy: 41 em + 12074 đều Tinh Hoa (ghi đè tên tạm)
  })
})

describe('migration', () => {
  it('chỉ THÊM MỘT cột nullable vào hoc_sinh (không đổi lop, không xoá gì); nạp cùng schema.sql không lỗi', () => {
    const m = readFileSync('server/migration-2109-ten-lop.sql', 'utf-8').replace(/^--.*$/gm, '').trim()
    expect(m).toBe('ALTER TABLE hoc_sinh ADD COLUMN ten_lop TEXT;')
    const d = taoD1That()
    const cot = (d.sql.prepare('PRAGMA table_info(hoc_sinh)').all() as { name: string; notnull: number }[]).find((c) => c.name === 'ten_lop')
    expect(cot).toMatchObject({ name: 'ten_lop', notnull: 0 })
  })
})

// @vitest-environment node
// Giữ ngân sách học khi ưu tiên kiểm lại: lõi thuần + SQL SQLite, không phải đo tải D1 thật.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { Q, seedChua } from './_chua-cau-sai-fixture'
import { docHoSo2, docQidSaiTaiLop } from '../server/src/srs2-d1'
import { lapKeHoachNgay, phatLaiCau, type CauSrs, type TrangThaiCau } from '../server/src/srs2-loi'
import { chonCauHanhTrinh, type DauVaoHanhTrinh } from '../server/src/hanh-trinh-ngay'

const NOW = Date.parse('2026-10-16T03:00:00Z'), NGAY = '2026-10-16'
const mo = (id: string, khac: Partial<CauSrs> = {}): CauSrs => ({ qid: id, phan: 'I', mucDo: 'NB', dang: 'mol', ...khac })
const tt = (id: string, khac: Partial<TrangThaiCau> = {}): TrangThaiCau => ({ ...phatLaiCau(id, [], null), ...khac })
const daLam = (id: string, khac: Partial<TrangThaiCau> = {}) => tt(id, { laMoi: false, cc: 0, lanSai: 1, lanCuoiDung: false, henOn: '2026-10-15', ...khac })
const tat = (x: { dao: string[]; doan: string[] }) => [...x.dao, ...x.doan]
const soMoi = (x: { dao: string[]; doan: string[] }, t: ReadonlyMap<string, TrangThaiCau>) => tat(x).filter(q => t.get(q)?.laMoi)
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

describe('lịch Hỏi thầy · fallback không tăng lượt D1', () => {
  async function dung() {
    const d = taoD1That(); await seedChua(d.env)
    d.sql.prepare(`INSERT INTO hoi_thay_kiem(id,sbd,qid_goc,nhom_goc,version_goc,qid_kiem,version_kiem,khoa_noi_dung,snapshot_json,assistance,trang_thai,phat_luc,het_han_luc,nop_luc,den_han)
      VALUES('lich','HS1',?,'nhom-Q','v1','kiem','k1','khoa','{}','assisted','da_nop',?,?,?,?)`).run(Q, NOW - 90_000_000, NOW - 4_000_000, NOW - 89_000_000, NOW - 1000)
    return d
  }
  it('nợ tại lớp rỗng và lịch đến hạn trong cùng MỘT SQL; hết hạn tương lai không ưu tiên sớm', async () => {
    const d = await dung(); let lich: string[] = []
    const truoc = d.soLenh.prepare
    expect([...await docQidSaiTaiLop(d.env, 'HS1', { now: NOW, nhan: q => { lich = q } })]).toEqual([])
    expect(d.soLenh.prepare - truoc).toBe(1); expect(lich).toEqual([Q])
    await docQidSaiTaiLop(d.env, 'HS1', { now: NOW - 2000, nhan: q => { lich = q } })
    expect(lich).toEqual([])
    d.sql.close()
  })
  it('bản cũ không lọt ưu tiên; thiếu schema mới vẫn giữ toàn bộ nợ tại lớp', async () => {
    const d = await dung(); let lich: string[] = []
    d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,ket_qua,luc,ngay_vn) VALUES('lop','HS1',?,'len_bang','buoi',0,'2026-10-10T01:00:00Z','2026-10-10')").run(Q)
    d.sql.prepare("UPDATE hoi_thay_kiem SET version_goc='cu'").run()
    await docQidSaiTaiLop(d.env, 'HS1', { now: NOW, nhan: q => { lich = q } }); expect(lich).toEqual([])
    d.sql.exec('DROP TABLE hoi_thay_kiem')
    expect([...await docQidSaiTaiLop(d.env, 'HS1', { now: NOW, nhan: q => { lich = q } })]).toEqual([[Q, '2026-10-10T01:00:00Z']])
    expect(lich).toEqual([])
    d.sql.close()
  })
  it('hồ sơ nhận câu đến hạn ngoài danh sách chiến dịch nhưng vẫn qua cổng khối', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW)
    const d = await dung()
    const h = await docHoSo2(d.env, 'HS1', NGAY)
    expect(h.hoiThayDenHan).toEqual([Q]); expect(h.meta.has(Q)).toBe(true)
    d.sql.prepare("UPDATE hoc_sinh SET lop='11' WHERE sbd='HS1'").run()
    const khacKhoi = await docHoSo2(d.env, 'HS1', NGAY)
    expect(khacKhoi.cau.some(c => c.qid === Q)).toBe(false)
    d.sql.close()
  })
  it.each(['tro_ly', 'goi_y', 'thay_go', 'giai_kho'])('trợ giúp %s của câu cùng nhóm chặn lịch kiểm 12h rồi tự mở lại', async nguon => {
    const d = await dung(), anh = Q + '-anh'
    d.sql.prepare(`INSERT INTO game_v2_question(qid,ma_de,version,content_group,dang,json)
      SELECT ?,ma_de,version,content_group,dang,json FROM game_v2_question WHERE qid=?`).run(anh, Q)
    d.sql.prepare("INSERT INTO loi_giai_hoi(sbd,qid,nguon,luc,co_ho_so) VALUES('HS1',?,?,?,0)")
      .run(anh, `hoc_tap:${nguon}`, new Date(NOW - 3_600_000).toISOString())
    let lich: string[] = []
    await docQidSaiTaiLop(d.env, 'HS1', { now: NOW, nhan: q => { lich = q } })
    expect(lich).toEqual([])
    await docQidSaiTaiLop(d.env, 'HS1', { now: NOW + 11 * 3_600_000, nhan: q => { lich = q } })
    expect(lich).toEqual([Q])
    d.sql.close()
  })
  it('chỉ mở khung hỏi hoặc trợ giúp của em khác không chặn lịch kiểm của em', async () => {
    const d = await dung(), luc = new Date(NOW - 1000).toISOString()
    d.sql.prepare("INSERT INTO loi_giai_hoi(sbd,qid,nguon,luc,co_ho_so) VALUES('HS1',?,'hoc_tap',?,0),('EM-KHAC',?,'hoc_tap:giai_kho',?,1)").run(Q, luc, Q, luc)
    let lich: string[] = []
    await docQidSaiTaiLop(d.env, 'HS1', { now: NOW, nhan: q => { lich = q } })
    expect(lich).toEqual([Q]); d.sql.close()
  })
})

describe('SRS2 · chỉ đổi câu trong phần ôn/sửa', () => {
  function dung() {
    const moi = Array.from({ length: 8 }, (_, i) => mo(`moi-${i}`))
    const cu = Array.from({ length: 12 }, (_, i) => mo(`cu-${i}`, { nguon: 'no_cu' }))
    const t = new Map([...moi.map(c => [c.qid, tt(c.qid)] as const), ...cu.map((c, i) => [c.qid, daLam(c.qid, { lanSai: 3 - Math.floor(i / 4) })] as const)])
    const tc = { homNay: NGAY, hanNop: '2026-10-30', tranNgay: 6, tranHuyetChien: 6, raiDeu: true }
    return { cau: [...moi, ...cu], t, tc }
  }
  it('ưu tiên câu nợ đến hạn thay câu nợ khác; câu mới và tổng kế hoạch giữ nguyên', () => {
    const { cau, t, tc } = dung(), cu = lapKeHoachNgay(cau, t, tc)
    const chon = cau.find(c => c.qid.startsWith('cu-') && !tat(cu).includes(c.qid))!.qid
    const moi = lapKeHoachNgay(cau, t, { ...tc, hoiThayDenHan: [chon] })
    expect(tat(moi)).toContain(chon); expect(soMoi(moi, t)).toEqual(soMoi(cu, t)); expect(tat(moi)).toHaveLength(tat(cu).length)
    expect(lapKeHoachNgay(cau, t, { ...tc, hoiThayDenHan: [] })).toEqual(cu)
  })
  it('đầy quota câu mới thì lịch Hỏi thầy chờ, không thêm câu vượt trần', () => {
    const { cau, t, tc } = dung()
    const lua = { ...tc, hanNop: NGAY, hoiThayDenHan: ['cu-11'] }
    const cu = lapKeHoachNgay(cau, t, { ...lua, hoiThayDenHan: [] }), moi = lapKeHoachNgay(cau, t, lua)
    expect(soMoi(moi, t)).toEqual(soMoi(cu, t)); expect(tat(moi).length).toBeLessThanOrEqual(6)
  })
  it('câu cũ chỉ đến lịch Hỏi thầy không chiếm chỗ sáu câu mới đã được phân', () => {
    const { cau, t, tc } = dung()
    const dau = cau.filter(c => c.qid.startsWith('moi-') || c.qid === 'cu-11')
    t.set('cu-11', daLam('cu-11', { henOn: '2026-10-30' }))
    const a = { ...tc, hanNop: '2026-10-17' }
    const cu = lapKeHoachNgay(dau, t, a), moi = lapKeHoachNgay(dau, t, { ...a, hoiThayDenHan: ['cu-11'] })
    expect(soMoi(cu, t)).toHaveLength(6); expect(soMoi(moi, t)).toEqual(soMoi(cu, t))
    expect(tat(moi)).toHaveLength(tat(cu).length)
  })
  it('SRS2 không thay vào câu kiểm cùng nhóm một câu mới đã được giữ chỗ', () => {
    const { cau, t, tc } = dung()
    t.set('cu-11', daLam('cu-11', { henOn: '2026-10-30' }))
    const cu = lapKeHoachNgay(cau, t, tc), nhomCau = new Map(cau.map(c => [c.qid, c.qid]))
    nhomCau.set('cu-11', soMoi(cu, t)[0]!)
    const moi = lapKeHoachNgay(cau, t, { ...tc, hoiThayDenHan: ['cu-11'], nhomCau })
    expect(tat(moi)).not.toContain('cu-11'); expect(soMoi(moi, t)).toEqual(soMoi(cu, t))
    expect(tat(moi)).toHaveLength(tat(cu).length)
  })
  it('lịch kiểm Hỏi thầy đến hạn mở câu cũ trước lịch SRS; giữ cắt tỉa và lịch câu khác', () => {
    const { cau, t, tc } = dung()
    t.set('cu-9', daLam('cu-9', { henOn: '2026-10-20' }))
    t.set('cu-10', daLam('cu-10', { catTia: true })); t.set('cu-11', daLam('cu-11', { henOn: '2026-10-20' }))
    const cu = lapKeHoachNgay(cau, t, tc)
    const k = lapKeHoachNgay(cau, t, { ...tc, hoiThayDenHan: ['cu-10', 'cu-11'] })
    expect(tat(k)).toContain('cu-11'); expect(tat(k)).not.toContain('cu-10'); expect(tat(k)).not.toContain('cu-9')
    expect(soMoi(k, t)).toEqual(soMoi(cu, t)); expect(tat(k)).toHaveLength(tat(cu).length)
  })
  it('ôn bài cũ có trọng số: ưu tiên đúng phần dư, không thay tỷ lệ hoặc số mới', () => {
    const { cau, t, tc } = dung(), on = Array.from({ length: 8 }, (_, i) => mo(`on-${i}`, { nguon: 'on_bai_cu' }))
    for (const c of on) t.set(c.qid, daLam(c.qid))
    const dau = cau.filter(c => c.qid.startsWith('moi-')), chon = 'on-7'
    const a = { ...tc, tranNgay: 8, tranHuyetChien: 8, onBaiCu: on, trongSoCau: { 'on-0': 100, [chon]: 0 }, tiLeOnBaiCu: 0.25 }
    const cu = lapKeHoachNgay(dau, t, a), moi = lapKeHoachNgay(dau, t, { ...a, hoiThayDenHan: [chon] })
    expect(moi.onBaiCu).toContain(chon); expect(moi.onBaiCu).toHaveLength(cu.onBaiCu!.length)
    expect(soMoi(moi, t)).toEqual(soMoi(cu, t)); expect(tat(moi)).toHaveLength(tat(cu).length)
  })
})

describe('Hành trình · lịch chỉ trong phần sửa/ôn đã sẵn sàng', () => {
  function dung(muc = 12): DauVaoHanhTrinh {
    const moi = Array.from({ length: 18 }, (_, i) => mo(`m-${i}`)), no = Array.from({ length: 18 }, (_, i) => mo(`n-${i}`)), on = Array.from({ length: 18 }, (_, i) => mo(`o-${i}`))
    const cau = [...moi, ...no, ...on]
    const t = new Map([...moi.map(c => [c.qid, tt(c.qid)] as const), ...no.map(c => [c.qid, daLam(c.qid)] as const), ...on.map(c => [c.qid, daLam(c.qid, { thanhThao: true, cc: 2 })] as const)])
    return { ngay: NGAY, tang: 2, toiThieu: muc, daLam: [], cau, tt: t, nhom: new Map(cau.map(c => [c.qid, c.qid])), chan: new Set(), trongSo: Object.fromEntries(cau.map((c, i) => [c.qid, 1000 - i])) }
  }
  it.each([6, 12, 24, 30, 36])('mức%d ưu tiên câu sửa/ôn; giữ tổng và tập câu mới', muc => {
    const a = dung(muc), cu = chonCauHanhTrinh(a), chon = a.cau.find(c => c.qid.startsWith('n-') && !tat(cu).includes(c.qid))?.qid
    if (!chon) throw new Error('Fixture cần dư câu sửa để kiểm thay thế.')
    const moi = chonCauHanhTrinh({ ...a, hoiThayDenHan: [chon] })
    expect(tat(moi)).toContain(chon); expect(soMoi(moi, a.tt)).toEqual(soMoi(cu, a.tt)); expect(tat(moi)).toHaveLength(tat(cu).length)
    expect(new Set(tat(moi)).size).toBe(tat(moi).length)
  })
  it('lịch kiểm sớm không lấy chỗ câu mới khi ngày chưa có ngân sách ôn/sửa', () => {
    const a = dung(6), t = new Map(a.tt)
    t.set('n-17', daLam('n-17', { henOn: '2026-10-30' }))
    const args = { ...a, tt: t, cau: a.cau.filter(c => c.qid.startsWith('m-') || c.qid === 'n-17') }
    const cu = chonCauHanhTrinh(args), moi = chonCauHanhTrinh({ ...args, hoiThayDenHan: ['n-17'] })
    expect(soMoi(cu, t)).toHaveLength(6); expect(soMoi(moi, t)).toEqual(soMoi(cu, t))
    expect(tat(moi)).toHaveLength(tat(cu).length)
  })
  it('hai nợ trùng nhóm chỉ tạo một slot ôn: lịch kiểm không làm năm câu mới giảm còn bốn', () => {
    const a = dung(6), t = new Map(a.tt), nhom = new Map(a.nhom)
    const cau = a.cau.filter(c => /^m-[0-7]$/.test(c.qid) || ['n-0', 'n-1', 'n-17'].includes(c.qid))
    nhom.set('n-0', 'no-trung'); nhom.set('n-1', 'no-trung')
    t.set('n-17', daLam('n-17', { henOn: '2026-10-30' }))
    const args = { ...a, cau, tt: t, nhom }
    const cu = chonCauHanhTrinh(args), moi = chonCauHanhTrinh({ ...args, hoiThayDenHan: ['n-17'] })
    expect(soMoi(cu, t)).toHaveLength(5); expect(soMoi(moi, t)).toEqual(soMoi(cu, t))
    expect(tat(moi)).toContain('n-17'); expect(tat(moi)).toHaveLength(tat(cu).length)
    expect(new Set(tat(moi).map(id => nhom.get(id) || id)).size).toBe(tat(moi).length)
  })
  it('L4 giữ nguyên câu mới khi lịch kiểm sớm chỉ thêm ứng viên vai trò ôn/sửa', () => {
    const a = dung(6), t = new Map(a.tt)
    t.set('n-17', daLam('n-17', { henOn: '2026-10-30' }))
    const cau = a.cau.filter(c => c.qid.startsWith('m-') || c.qid === 'n-17')
    const args = { ...a, tang: 4 as const, tt: t, cau, vaiTro: Object.fromEntries(cau.map(c => [c.qid, c.qid === 'n-17' ? 'on_sua' as const : 'chuyen_giao' as const])) }
    const cu = chonCauHanhTrinh(args), moi = chonCauHanhTrinh({ ...args, hoiThayDenHan: ['n-17'] })
    expect(soMoi(cu, t)).toHaveLength(6); expect(soMoi(moi, t)).toEqual(soMoi(cu, t))
    expect(tat(moi)).toHaveLength(tat(cu).length)
  })
  it('L4 thay đúng slot cũ cùng vai trò, giữ can thiệp và các câu mới', () => {
    const a = dung(12), t = new Map(a.tt)
    t.set('n-17', daLam('n-17', { henOn: '2026-10-30' }))
    const args = { ...a, tang: 4 as const, tt: t, uuTienCanThiep: 'n-0',
      vaiTro: Object.fromEntries(a.cau.map(c => [c.qid, c.qid.startsWith('m-') ? 'chuyen_giao' as const : 'on_sua' as const])) }
    const cu = chonCauHanhTrinh(args), moi = chonCauHanhTrinh({ ...args, hoiThayDenHan: ['n-17'] })
    expect(tat(moi)).toContain('n-17'); expect(tat(moi)).toContain('n-0')
    expect(soMoi(moi, t)).toEqual(soMoi(cu, t)); expect(tat(moi)).toHaveLength(tat(cu).length)
  })
  it('lịch kiểm sớm hơn SRS vẫn giữ cổng tầng, cắt tỉa, bảo vệ và nhóm đã làm', () => {
    const a = dung(), t = new Map(a.tt), chan = new Set(['n-17'])
    t.set('n-12', daLam('n-12', { henOn: '2026-10-20' }))
    t.set('n-16', daLam('n-16', { catTia: true })); t.set('n-15', daLam('n-15', { henOn: '2026-10-20' }))
    const tang = new Map(a.cau.map(c => [c.qid, c.qid === 'n-14' ? 0 : 2])) as any
    const nhom = new Map(a.nhom); nhom.set('n-13', 'da-gap')
    const k = chonCauHanhTrinh({ ...a, tt: t, chan, tangSanSang: tang, nhom, daLam: ['da-gap'], hoiThayDenHan: ['n-17', 'n-16', 'n-15', 'n-14', 'n-13'] })
    expect(tat(k)).toContain('n-15')
    for (const id of ['n-17', 'n-16', 'n-14', 'n-13', 'n-12']) expect(tat(k)).not.toContain(id)
  })
  it('giữ vị trí can thiệp/chẩn đoán và không lấy ưu tiên cũ trùng nhóm câu mới', () => {
    const a = dung(), nhom = new Map(a.nhom); nhom.set('n-17', 'm-0')
    const args = { ...a, nhom, uuTienCanThiep: 'n-0', chanDoan: new Set(['m-17']), nganSachChanDoan: 1 }
    const cu = chonCauHanhTrinh(args), moi = chonCauHanhTrinh({ ...args, hoiThayDenHan: ['n-17'] })
    expect(soMoi(moi, a.tt)).toEqual(soMoi(cu, a.tt)); expect(tat(moi)).toContain('n-0'); expect(tat(moi)).toContain('m-17')
  })
})

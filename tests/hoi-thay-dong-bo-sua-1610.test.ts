// @vitest-environment node
// SQLite trong bộ nhớ: kiểm SQL/CAS/rollback; không khẳng định mô phỏng runtime phân tán D1.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { seedChua, Q } from './_chua-cau-sai-fixture'
import { dongBoSuaLoiHoiThay, duBangChungBanHienTai } from '../server/src/hoi-thay-dong-bo-sua'
import { docTrangThaiLoiDau } from '../server/src/chua-cau-sai-adapter'

const NOW = Date.parse('2026-10-03T03:00:00Z'), SBD = 'HS1', GROUP = 'nhom-Q'
let d: D1That
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW)
  d = taoD1That(); await seedChua(d.env)
  d.sql.prepare("INSERT INTO hoi_thay_can_giup(sbd,qid,gui_luc,cap_nhat_luc) VALUES(?,?,1,1)").run(SBD, Q)
})
afterEach(() => { d.sql.close(); vi.useRealTimers(); vi.restoreAllMocks() })

function lan(id: string, ngay: string, dung: number | null, x: { variant?: boolean; assistance?: string; purpose?: string; visibility?: string; sbd?: string; version?: string | null } = {}) {
  const qid = x.variant ? `${Q}~ss1` : Q
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,ket_qua,luc,ngay_vn,assistance,visibility,purpose,raw_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(id, x.sbd ?? SBD, qid, 'game', 'thu', dung, `${ngay}T03:00:00Z`, ngay, x.assistance ?? 'none', x.visibility ?? 'released', x.purpose ?? 'repair', JSON.stringify({ ...(x.variant ? { tc: Q } : {}), ...(x.version === null ? {} : { ht_cau_version: x.version ?? 'v1' }) }))
}
function receipt(id: string, ngay: string, dung = 1, x: { version?: string; assistance?: string; khoa?: string } = {}) {
  const moc = Date.parse(`${ngay}T03:00:00Z`)
  d.sql.prepare(`INSERT INTO hoi_thay_kiem(id,sbd,qid_goc,nhom_goc,version_goc,qid_kiem,version_kiem,khoa_noi_dung,snapshot_json,assistance,trang_thai,phat_luc,het_han_luc,nop_luc,dung)
    VALUES(?,?,?,?,?,?,?,?,'{}',?,'da_nop',?,?,?,?)`)
    .run(id, SBD, Q, GROUP, x.version ?? 'v1', `hk:${id}`, 'kiem-v1', x.khoa ?? id, x.assistance ?? 'none', moc, moc + 86400000, moc, dung)
}
function duHaiNgay(x: { version?: string; variant?: boolean; assistance?: string; ngay2?: string } = {}) {
  lan('dung1', '2026-09-30', 1); receipt('r1', '2026-09-30', 1, x)
  lan('dung2', x.ngay2 ?? '2026-10-02', 1, { variant: x.variant ?? true, assistance: x.assistance })
  receipt('r2', x.ngay2 ?? '2026-10-02', 1, x)
}
function htk(id: string, ngay: string, x: { version?: string; assistance?: string; rawVersion?: string; phienId?: string } = {}) {
  receipt(id, ngay, 1, x)
  d.sql.prepare(`INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,ket_qua,luc,ngay_vn,assistance,visibility,purpose,raw_json,attempt_id)
    VALUES(?,?,?,'chua_loi',?,1,?,?,?,'released','repair',?,?)`)
    .run(`htk-${id}`, SBD, `hk:${id}`, `hoi_thay_kiem:${id}`, `${ngay}T03:00:00Z`, ngay, x.assistance ?? 'none',
      JSON.stringify({ tc: Q, phienId: x.phienId ?? id, hoiThayKiem: true, ht_cau_version: x.rawVersion ?? 'kiem-v1' }), id)
}
const dot = () => d.sql.prepare('SELECT id,trang_thai_day,dong_luc,revision FROM chua_loi_dot WHERE sbd=? ORDER BY mo_luc,id').all(SBD) as { id: string; trang_thai_day: string; dong_luc: number | null; revision: number }[]
const help = () => d.sql.prepare('SELECT trang_thai,revision FROM hoi_thay_can_giup WHERE sbd=? AND qid=?').get(SBD, Q)
function chenTruocChot(f: () => void) {
  const batch = d.env.DB.batch.bind(d.env.DB); let daChen = false
  vi.spyOn(d.env.DB, 'batch').mockImplementation((ds) => {
    if (!daChen && ds.some(s => String((s as unknown as { _q: string })._q).includes('UPDATE chua_loi_dot'))) { daChen = true; f() }
    return batch(ds) as ReturnType<typeof d.env.DB.batch>
  })
}

describe('đóng đúng theo bằng chứng toàn bài đang dùng', () => {
  it('hai ngày đúng, cách sai đủ3ngày, có biến thể: đóng đợt+request; retry không đổi giờ đóng, không ghi điểm/P', async () => {
    duHaiNgay()
    const so = d.chup('su_kien_hoc'), diem = d.chup('luot'), p = d.chup('omni_p_vkn')
    expect(d.dem('chua_loi_nop')).toBe(0) // Không dựa MAX(nop_luc) của vòng chữa cũ.
    expect(await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).toEqual({ daXacNhan: true, soDotDong: 1, soYeuCauDong: 1 })
    expect(dot()[0]).toMatchObject({ trang_thai_day: 'da_tu_sua', dong_luc: NOW })
    expect(help()).toMatchObject({ trang_thai: 'da_xac_nhan', revision: 1 })
    expect(await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW + 60000)).toEqual({ daXacNhan: true, soDotDong: 0, soYeuCauDong: 0 })
    expect(dot()[0].dong_luc).toBe(NOW)
    expect(d.chup('su_kien_hoc')).toBe(so); expect(d.chup('luot')).toBe(diem); expect(d.chup('omni_p_vkn')).toBe(p)
  })
  it('một lần đúng hoặc microcheck không đóng dù các receipt tự khai đủ', async () => {
    lan('dung1', '2026-10-02', 1, { variant: true }); receipt('r1', '2026-09-30'); receipt('r2', '2026-10-02')
    lan('micro', '2026-09-30', 1, { purpose: 'chua_buoc' })
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
    expect(dot()[0].dong_luc).toBeNull(); expect(help()?.trang_thai).toBe('can_thay')
  })
  it('hai ngày nhưng chưa đủ khoảng cách3ngày, hoặc thiếu biến thể, không đóng', async () => {
    duHaiNgay({ ngay2: '2026-10-01' })
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
    lan('dung3', '2026-10-02', 1)
    // Vẫn đã có biến thể ngày01 nên đủ luật sau lượt03; trường hợp không biến thể kiểm riêng bên dưới.
    expect((await docTrangThaiLoiDau(d.env, SBD, Q, '2026-10-03'))?.loiHoc.trangThai).toBe('dong')
  })
  it('không có lượt đúng biến thể thì không đóng dù hai ngày và receipt khác nội dung', async () => {
    duHaiNgay({ variant: false })
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
  })
  it.each(['tro_ly', 'goi_y', 'thay_go', 'giai_kho'])('dấu %s co_ho_so0 vẫn chặn độc lập, kể cả ledger ghi none', async nguon => {
    duHaiNgay()
    d.sql.prepare('INSERT INTO loi_giai_hoi(sbd,qid,nguon,luc,co_ho_so) VALUES(?,?,?,?,0)').run(SBD, Q, `hoi_thay:${nguon}`, '2026-10-02T02:00:00Z')
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
    expect(dot()[0].dong_luc).toBeNull()
  })
  it('co_ho_so0 chỉ mở khung chưa hướng dẫn không chặn; assisted thật không được tính tự làm', async () => {
    duHaiNgay({ assistance: 'assisted' })
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
    // Bộ predicate chung không nhận receipt assisted dù có hai ngày.
    expect(duBangChungBanHienTai([
      { version_goc: 'v1', nhom_goc: GROUP, dung: 1, assistance: 'none', nop_luc: Date.parse('2026-09-30'), khoa_noi_dung: 'a' },
      { version_goc: 'v1', nhom_goc: GROUP, dung: 1, assistance: 'assisted', nop_luc: Date.parse('2026-10-02'), khoa_noi_dung: 'b' },
    ], 'v1', GROUP)).toBe(false)
  })
  it('chỉ mở khung co_ho_so0 không trở thành dấu hỗ trợ', async () => {
    duHaiNgay()
    d.sql.prepare('INSERT INTO loi_giai_hoi(sbd,qid,nguon,luc,co_ho_so) VALUES(?,?,?,?,0)').run(SBD, Q, 'luyen', '2026-10-02T02:00:00Z')
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(true)
  })
  it('đổi nội dung giữqid không xác nhận bản mới từ hai ngày đúng phiên bản cũ', async () => {
    duHaiNgay()
    d.sql.prepare("UPDATE game_v2_question SET version='v2' WHERE qid=?").run(Q)
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
    expect(dot()[0].dong_luc).toBeNull()
  })
  it('chỉ mục kho chưa đồng bộ nguồn mới không được đóng bằng cache câu cũ', async () => {
    duHaiNgay()
    d.sql.prepare("UPDATE de_kho SET cap_nhat_luc='v2' WHERE ma_de='DH-12-C1-B1'").run()
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
    expect(dot()[0].dong_luc).toBeNull()
  })
  it('câu trùng cùng nhóm được đồng bộ, học sinh khác và câu khác giữ nguyên', async () => {
    duHaiNgay()
    d.sql.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,json) VALUES('DH-12-C1-B1','ALIAS-I-1','v1',?,'{}')").run(GROUP)
    d.sql.prepare("INSERT INTO hoi_thay_can_giup(sbd,qid,gui_luc,cap_nhat_luc) VALUES(?,'ALIAS-I-1',1,1),(?,'CAU-KHAC',1,1),('HS2',?,1,1)").run(SBD, SBD, Q)
    expect(await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).toMatchObject({ daXacNhan: true, soYeuCauDong: 2 })
    expect(d.sql.prepare("SELECT trang_thai FROM hoi_thay_can_giup WHERE sbd=? AND qid='CAU-KHAC'").get(SBD)?.trang_thai).toBe('can_thay')
    expect(d.sql.prepare("SELECT trang_thai FROM hoi_thay_can_giup WHERE sbd='HS2' AND qid=?").get(Q)?.trang_thai).toBe('can_thay')
  })
  it('duy trì sau khi đã qua2mốc vẫn có thể đồng bộ projection, không đổi luật', async () => {
    duHaiNgay(); lan('duy-tri1', '2026-10-16', 1); lan('duy-tri2', '2026-11-01', 1)
    const now = Date.parse('2026-11-02T03:00:00Z')
    expect((await docTrangThaiLoiDau(d.env, SBD, Q, '2026-11-02'))?.loiHoc.trangThai).toBe('duy_tri')
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, now)).daXacNhan).toBe(true)
  })
})

describe('race, rollback và sai lại', () => {
  it('sai lại sau khi đãđóng tạo đợt mới ngay dù không có chua_loi_nop cũ', async () => {
    duHaiNgay(); await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)
    lan('sai-lai', '2026-10-04', 0)
    expect(dot()).toHaveLength(2)
    expect(dot().filter(d => d.dong_luc === null)).toHaveLength(1)
    expect(dot().find(d => d.dong_luc === null)?.trang_thai_day).not.toBe('da_tu_sua')
  })
  it('wrong mới xen giữa replay vàchốt: không đóng; không đè sai mới dù cap_nhat đợt chưa đổi', async () => {
    duHaiNgay(); chenTruocChot(() => lan('wrong-xen', '2026-10-03', 0))
    expect(await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).toEqual({ daXacNhan: false, soDotDong: 0, soYeuCauDong: 0 })
    expect(dot()[0].dong_luc).toBeNull(); expect(help()?.trang_thai).toBe('can_thay')
  })
  it('lượt wrong cósẵn vừa côngbố (rowid giữ nguyên) cũng ngăn chốt stale', async () => {
    duHaiNgay(); lan('wrong-giau', '2026-10-01', 0, { visibility: 'embargoed' })
    chenTruocChot(() => d.sql.prepare("UPDATE su_kien_hoc SET visibility='released' WHERE khoa='wrong-giau'").run())
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
    expect(dot()[0].dong_luc).toBeNull()
  })
  it('revision đợt đổi hoặc nguồn đổi trong lúc replay thì CAS không đóng', async () => {
    duHaiNgay(); chenTruocChot(() => d.sql.prepare('UPDATE chua_loi_dot SET revision=revision+1 WHERE sbd=?').run(SBD))
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
    expect(help()?.trang_thai).toBe('can_thay')
  })
  it('source version đổi giữa replay vàupdate bị SQLguard chặn', async () => {
    duHaiNgay(); chenTruocChot(() => d.sql.prepare("UPDATE game_v2_question SET version='v2' WHERE qid=?").run(Q))
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
    expect(dot()[0].dong_luc).toBeNull()
  })
  it('dấu hỗ trợ xen giữa replay vàchốt ngăn cập nhật projection', async () => {
    duHaiNgay(); chenTruocChot(() => d.sql.prepare('INSERT INTO loi_giai_hoi(sbd,qid,nguon,luc,co_ho_so) VALUES(?,?,?,?,0)')
      .run(SBD, Q, 'hoi_thay:tro_ly', '2026-10-02T02:00:00Z'))
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
    expect(dot()[0].dong_luc).toBeNull()
  })
  it('cậpnhật request lỗi thì toàn transaction rollback, dot chưađóng; retry sau đó thành công', async () => {
    duHaiNgay()
    d.sql.exec("CREATE TRIGGER chan_help BEFORE UPDATE ON hoi_thay_can_giup BEGIN SELECT RAISE(ABORT,'help loi'); END")
    await expect(dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).rejects.toThrow('help loi')
    expect(dot()[0].dong_luc).toBeNull(); expect(dot()[0].revision).toBe(0)
    d.sql.exec('DROP TRIGGER chan_help')
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(true)
  })
})

describe('bằng chứng hỗn hợp từ kiểm riêng và ôn chung', () => {
  it('hai ngày ôn chung đủcurrent-version không cần có hai receipt HTK', async () => {
    lan('on1', '2026-09-30', 1); lan('on2', '2026-10-02', 1, { variant: true })
    expect(d.dem('hoi_thay_kiem')).toBe(0)
    expect(await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).toMatchObject({ daXacNhan: true, soDotDong: 1, soYeuCauDong: 1 })
  })
  it('một HTK và một game khác ngày được gộp bằng chứng', async () => {
    htk('kiem1', '2026-09-30'); lan('on2', '2026-10-02', 1, { variant: true })
    expect(d.dem('hoi_thay_kiem')).toBe(1)
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(true)
  })
  it('một HTKassisted + hai lần ôn chung đủ thì tựdọn hạnkiểm, không cần mở lại hộp', async () => {
    htk('aided', '2026-09-30', { assistance: 'assisted' })
    receipt('cu', '2026-09-30', 1, { version: 'v0' })
    d.sql.prepare('UPDATE hoi_thay_kiem SET den_han=?').run(NOW + 86400000)
    lan('on1', '2026-09-30', 1); lan('on2', '2026-10-02', 1, { variant: true })
    expect(await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).toMatchObject({ daXacNhan: true, soYeuCauDong: 1 })
    expect(d.sql.prepare("SELECT den_han FROM hoi_thay_kiem WHERE id='aided'").get()?.den_han).toBeNull()
    expect(d.sql.prepare("SELECT den_han FROM hoi_thay_kiem WHERE id='cu'").get()?.den_han).toBe(NOW + 86400000)
  })
  it('hai HTK khớp ledger vàreceipt được chấp nhận; không cộng đôi receipt thành hai ngày', async () => {
    htk('kiem1', '2026-10-02')
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
    htk('kiem2', '2026-09-30')
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(true)
  })
  it.each([null, 'v0'])('ledger thiếu/khácversion (%s) không đủ bằng chứng bản hiện tại', async version => {
    lan('on1', '2026-09-30', 1, { version }); lan('on2', '2026-10-02', 1, { variant: true, version })
    expect((await docTrangThaiLoiDau(d.env, SBD, Q, '2026-10-03'))?.loiHoc.trangThai).toBe('dong')
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
  })
  it('HK giả phienId hoặc lệch version_kiem không thành proof từ versiongốc', async () => {
    htk('kiem1', '2026-09-30', { phienId: 'khong-co' }); htk('kiem2', '2026-10-02', { rawVersion: 'v1' })
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
  })
  it('marker thật trên câu HK trước nộp12h loại bằng chứng dù ledger/receipt đều none', async () => {
    htk('kiem1', '2026-09-30'); htk('kiem2', '2026-10-02')
    d.sql.prepare('INSERT INTO loi_giai_hoi(sbd,qid,nguon,luc,co_ho_so) VALUES(?,?,?,?,0)').run(SBD, 'hk:kiem2', 'hoi_thay:tro_ly', '2026-10-02T02:00:00Z')
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
  })
  it('chưa từng có lỗi: bằng chứng ôn chung đủ thì xác nhận câu, không tựđóngrequestcầnthầy', async () => {
    d.sql.exec("DELETE FROM chua_loi_dot; DELETE FROM su_kien_hoc")
    lan('on1', '2026-09-30', 1); lan('on2', '2026-10-02', 1, { variant: true })
    expect(await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).toEqual({ daXacNhan: true, soDotDong: 0, soYeuCauDong: 0 })
    expect(help()?.trang_thai).toBe('can_thay')
  })
  it.each(['chan_doan', 'chua_buoc', 'xem_loi_giai', 'luot'])('purpose %s không thành proof toàn bài', async purpose => {
    lan('on1', '2026-09-30', 1); lan('on2', '2026-10-02', 1, { variant: true, purpose })
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
  })
  it('ca chưa công bố, luyện đề chưa nộp và embargo không tạo proof độc lập', async () => {
    lan('on1', '2026-09-30', 1); lan('on2', '2026-10-02', 1, { variant: true })
    for (const nguon of ['thi', 'luyen']) {
      d.sql.prepare('UPDATE su_kien_hoc SET nguon=? WHERE khoa=?').run(nguon, 'on2')
      expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
    }
    d.sql.prepare("UPDATE su_kien_hoc SET nguon='game',visibility='embargoed' WHERE khoa='on2'").run()
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
  })
  it('raw.tc trỏ gốc nhưng qid không phải biến thể đúnggốc không được giả proof', async () => {
    lan('on1', '2026-09-30', 1); lan('on2', '2026-10-02', 1, { variant: true })
    d.sql.prepare("UPDATE su_kien_hoc SET qid='CAU-KHAC~ss1' WHERE khoa='on2'").run()
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
  })
  it.each(['bt', 'yd', 'ss'])('qảo~%s vàraw.tc đúnggốc/version được nhận trong ôn chung', async loai => {
    lan('on1', '2026-09-30', 1); lan('on2', '2026-10-02', 1, { variant: true })
    d.sql.prepare('UPDATE su_kien_hoc SET qid=? WHERE khoa=?').run(`${Q}~${loai}7`, 'on2')
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(true)
  })
  it('chưa đủhai ngày thì không gọi truy vấn replay lịch sử lỗi', async () => {
    lan('on1', '2026-10-02', 1, { variant: true })
    const prepare = d.env.DB.prepare.bind(d.env.DB), queries: string[] = []
    vi.spyOn(d.env.DB, 'prepare').mockImplementation(q => { queries.push(q); return prepare(q) })
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
    expect(queries.some(q => q.includes('SELECT s.qid,s.nguon,s.luc,s.ngay_vn,s.ket_qua'))).toBe(false)
  })
  it('không có song sinh thì giữ miễn biến thể: hai ngày đúnggốc currentversion đủ đóng', async () => {
    d.sql.prepare('DELETE FROM chua_loi_hoc_lieu WHERE qid_chuan=?').run(Q)
    lan('on1', '2026-09-30', 1); lan('on2', '2026-10-02', 1)
    expect((await docTrangThaiLoiDau(d.env, SBD, Q, '2026-10-03'))?.loiHoc).toMatchObject({ trangThai: 'dong', daDungSongSinh: false })
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(true)
  })
  it('có song sinh thì không mượn variantoldversion đểđóng hai ngày đúnggốc bản mới', async () => {
    lan('cu', '2026-09-30', 1, { variant: true, version: 'v0' })
    lan('on1', '2026-10-01', 1); lan('on2', '2026-10-02', 1)
    expect((await docTrangThaiLoiDau(d.env, SBD, Q, '2026-10-03'))?.loiHoc.trangThai).toBe('dong')
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
    lan('on3', '2026-10-03', 1, { variant: true })
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(true)
  })
  it('wrong xenngang không được dọn hạn kiểm đang có', async () => {
    duHaiNgay(); d.sql.prepare('UPDATE hoi_thay_kiem SET den_han=?').run(NOW + 86400000)
    chenTruocChot(() => lan('sai-xen', '2026-10-03', 0))
    expect((await dongBoSuaLoiHoiThay(d.env, SBD, Q, NOW)).daXacNhan).toBe(false)
    expect(d.sql.prepare('SELECT COUNT(*) n FROM hoi_thay_kiem WHERE den_han IS NOT NULL').get()?.n).toBe(2)
  })
})

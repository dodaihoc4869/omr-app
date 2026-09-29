// @vitest-environment node
// CỬA HÀNG PHỤ KIỆN · MÁY CHỦ (S2): 5 lệnh /game-v2/… — cờ, đổi vàng nguyên tử (không âm, giữ ≥ 200 EXP, bấm đúp, đua), mua (giá thay, hết cái cuối, hai em cùng mua, hai lệnh song song), mặc đồ, không đụng luật EXP.
// Hợp đồng: docs/hop-dong-shop-phu-kien-2109.md. Mọi đối tượng ghi (ví, sổ, đồ) đều được đối chiếu THẲNG trong D1 giả (node:sqlite, lược đồ thật).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gameV2 } from '../server/src/game-v2'
import { shopBatCho } from '../server/src/game-v2-shop'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { LUAT_CAP_MOI } from '../src/lib/hap-thu-ngay'
import { DANH_MUC_PHU_KIEN } from '../src/lib/phu-kien-danh-muc'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const T0 = Date.parse('2026-09-22T12:00:00+07:00')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())

const K = (n: string) => `khoa-${n}-abcdefgh` // khoaYeuCau hợp lệ (8–64 ký tự)
function dung(o: { wallet?: number; em?: string[]; co?: unknown; khongCo?: boolean } = {}): D1That {
  const d = taoD1That()
  for (const sbd of o.em ?? ['S1', 'S2']) {
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12','mk','x')").run(sbd, `Em ${sbd}`)
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run(sbd, JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 40, wallet: o.wallet ?? 620, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z', luatCap: LUAT_CAP_MOI }), 'x')
  }
  if (!o.khongCo) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('shop_phu_kien',?,'x')").run(JSON.stringify(o.co ?? { bat: true }))
  return d
}
const goi = async (d: D1That, sbd: string, action: string, b: Record<string, unknown> = {}): Promise<any> => gameV2(d.env, action, { token: await gameToken(d.env, sbd), ...b })
const vangSo = (d: D1That, sbd: string): number => (d.sql.prepare('SELECT COALESCE(SUM(so_vang),0) v FROM vang_so WHERE sbd=?').get(sbd) as { v: number }).v
const cap = (d: D1That, sbd: string, v: number, khoa = `hoan-${sbd}-${v}-${Math.random()}`) => d.sql.prepare("INSERT INTO vang_so(sbd,loai,so_vang,exp_tru,ma_mon,khoa_yeu_cau,luc) VALUES(?,'hoan',?,0,NULL,?,'x')").run(sbd, v, khoa) // cấp vàng để thử mua
const hoSo = (d: D1That, sbd: string) => { const r = d.sql.prepare('SELECT revision, json FROM game_v2_profile WHERE sbd=?').get(sbd) as { revision: number; json: string }; return { revision: r.revision, p: JSON.parse(r.json) as Record<string, unknown> } }
const dem = (d: D1That, bang: string, sbd?: string): number => (d.sql.prepare(`SELECT COUNT(*) n FROM ${bang}${sbd ? ' WHERE sbd=?' : ''}`).get(...(sbd ? [sbd] : [])) as { n: number }).n
/** Cho em đủ chuỗi `n` ngày đạt liền trước hôm nay (22/09). */
function chuoi(d: D1That, sbd: string, n: number): void {
  for (let i = 1; i <= n; i++) {
    const ngay = new Date(Date.parse('2026-09-22T00:00:00+07:00') - i * 86_400_000 + 7 * 3_600_000).toISOString().slice(0, 10)
    d.sql.prepare("INSERT INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,ket_qua,cap_nhat_luc) VALUES(?,?,?,1,1,'{}','[]','[]','dat','x')").run(`kh-${sbd}-${ngay}`, sbd, ngay)
  }
}
const anSang = (d: D1That, sbd: string, n: number) => { for (let i = 0; i < n; i++) d.sql.prepare("INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,moc_on_ke,moc_moi_sai,cap_nhat_luc) VALUES(?,?,?,20,0,20,0,0,1,NULL,NULL,'x')").run(`nk-${sbd}-${i}`, sbd, `A.${i}`) }

describe('cờ shop_phu_kien', () => {
  it('vắng cờ hoặc bat:false ⇒ vang-xem {bat:false}; vang-doi / shop-danh-sach / shop-mua ⇒ tam_dong; KHÔNG ghi gì', async () => {
    for (const d of [dung({ khongCo: true }), dung({ co: { bat: false } })]) {
      expect(await goi(d, 'S1', 'vang-xem')).toEqual({ ok: true, bat: false })
      for (const [a, b] of [['vang-doi', { soExp: 10, khoaYeuCau: K('1') }], ['shop-danh-sach', {}], ['shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('2') }]] as const) {
        const r = await goi(d, 'S1', a, b); expect(r).toMatchObject({ ok: false, ma: 'tam_dong' }); expect(r.loi).toBe('Cửa hàng đang tạm đóng. Đồ em đã mua vẫn còn nguyên.')
      }
      expect(dem(d, 'vang_so')).toBe(0); expect(hoSo(d, 'S1').p.wallet).toBe(620)
    }
  })
  it('chiSbd: chỉ em trong danh sách thấy cửa hàng mở; mảng rỗng ⇒ không ai', async () => {
    const d = dung({ co: { bat: true, chiSbd: ['S1'] } })
    expect((await goi(d, 'S1', 'vang-xem')).bat).toBe(true); expect(await goi(d, 'S2', 'vang-xem')).toEqual({ ok: true, bat: false })
    expect((await goi(dung({ co: { bat: true, chiSbd: [] } }), 'S1', 'vang-xem')).bat).toBe(false)
  })
  it('cờ tắt: thu-mac-do vẫn chạy (đồ đã mua không biến mất)', async () => {
    const d = dung({ co: { bat: false } })
    d.sql.prepare("INSERT INTO phu_kien_so_huu(sbd,ma_mon,mua,gia,khoa_yeu_cau,luc) VALUES('S1','VD-04','m1',120,'k','x')").run()
    expect(await goi(d, 'S1', 'thu-mac-do', { oGan: 'vet', maMon: 'VD-04' })).toMatchObject({ ok: true, dangMac: { vet: 'VD-04' } })
  })
  it('chưa chạy migration (bảng shop chưa có) ⇒ coi như đóng, không ném lỗi kỹ thuật', async () => {
    const d = dung(); for (const b of ['phu_kien_dang_mac', 'phu_kien_so_huu', 'vang_so']) d.sql.exec(`DROP TABLE ${b}`)
    expect(await goi(d, 'S1', 'vang-xem')).toEqual({ ok: true, bat: false })
    expect(await goi(d, 'S1', 'shop-danh-sach')).toMatchObject({ ok: false, ma: 'tam_dong' })
    expect(await goi(d, 'S1', 'thu-mac-do', { oGan: 'vet', maMon: 'VD-04' })).toMatchObject({ ok: false, ma: 'chua_co' })
  })
})

describe('vang-xem', () => {
  // SỬA CÓ CHỦ Ý 29/09 (luật v4): không còn ống nghiệm / đổi tay ⇒ ongNghiem, giuLai, doiToiDa, ngayAn = 0; thêm expMoiVang 5, tuDong.
  it('số liệu (v4): vàng = tổng sổ; không còn ống/đổi tay; chuỗi + ấn thạch đọc thật', async () => {
    const d = dung(); cap(d, 'S1', 340); chuoi(d, 'S1', 9); anSang(d, 'S1', 3)
    expect(await goi(d, 'S1', 'vang-xem')).toEqual({ ok: true, bat: true, vang: 340, ongNghiem: 0, giuLai: 0, doiToiDa: 0, ngayAn: 0, expMoiVang: 5, tuDong: true, chuoiNgay: 9, anThachSang: 3, mua: 'm1' })
  })
  it('chuỗi tính cả hôm nay nếu đã đạt nhiệm vụ ngày (exp_so dat_ngay)', async () => {
    const d = dung({ wallet: 150 }); chuoi(d, 'S1', 4)
    d.sql.prepare("INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,exp,luc) VALUES('e1','S1','2026-09-22','dat_ngay',10,'x')").run()
    expect(await goi(d, 'S1', 'vang-xem')).toMatchObject({ chuoiNgay: 5, ongNghiem: 0, doiToiDa: 0, ngayAn: 0, vang: 0 })
  })
  it('vàng TỰ ĐỘNG (v4): hồ sơ có mốc vàng ⇒ vang-xem đúc floor((earned − mocVang)/5) trước khi đọc; đọc lại không đúc đôi', async () => {
    const d = dung(); cap(d, 'S1', 340)
    d.sql.prepare("UPDATE game_v2_profile SET json=json_set(json,'$.earned',1207,'$.mocVang',200) WHERE sbd='S1'").run()
    expect(await goi(d, 'S1', 'vang-xem')).toMatchObject({ vang: 340 + 201 })
    expect(await goi(d, 'S1', 'vang-xem')).toMatchObject({ vang: 541 }); expect(dem(d, 'vang_so')).toBe(2)
  })
  it('chuỗi đọc được TRÊN 7 ngày (cửa sổ dài, không bị cắt như kế hoạch ngày): 30 ngày đạt liền ⇒ 30; một ngày không đạt làm đứt; ngày nghỉ không đứt', async () => {
    const d = dung(); chuoi(d, 'S1', 30)
    expect((await goi(d, 'S1', 'vang-xem')).chuoiNgay).toBe(30)
    d.sql.prepare("UPDATE ke_hoach_ngay SET ket_qua='khong' WHERE sbd='S1' AND ngay='2026-09-15'").run()          // đứt ở ngày thứ 7 lùi
    expect((await goi(d, 'S1', 'vang-xem')).chuoiNgay).toBe(6)
    d.sql.prepare("UPDATE ke_hoach_ngay SET ket_qua=NULL,la_ngay_nghi=1 WHERE sbd='S1' AND ngay='2026-09-15'").run()             // ngày nghỉ (không kết quả): bỏ qua, không đứt
    expect((await goi(d, 'S1', 'vang-xem')).chuoiNgay).toBe(29)
  })
  it('em chưa chọn thần thú ⇒ lời báo như các lệnh game khác (không ghi)', async () => {
    const d = dung(); d.sql.prepare("UPDATE game_v2_profile SET json=json_set(json,'$.choice',1) WHERE sbd='S1'").run()
    await expect(goi(d, 'S1', 'vang-xem')).rejects.toThrow(/chọn thần thú/)
  })
})

// SỬA CÓ CHỦ Ý 29/09 (luật v4): BỎ đổi tay EXP → vàng ⇒ tám test "vang-doi · nguyên tử" và một test "vang-doi · đua tất định" (khoá luật đã bỏ) thay bằng test này.
describe('vang-doi · luật v4 đã bỏ', () => {
  it('cửa mở ⇒ da_bo (lời nói vàng tự vào ví), KHÔNG ghi vàng, KHÔNG đụng hồ sơ; đầu vào gì cũng vậy', async () => {
    const d = dung(); const truoc = hoSo(d, 'S1')
    for (const b of [{ soExp: 180, khoaYeuCau: K('a') }, { soExp: 0 }, {}]) {
      expect(await goi(d, 'S1', 'vang-doi', b)).toEqual({ ok: false, ma: 'da_bo', loi: 'Vàng nay tự vào ví: cứ 5 EXP em kiếm được thì có 1 vàng. Em không cần đổi nữa.' })
    }
    expect(dem(d, 'vang_so')).toBe(0); expect(hoSo(d, 'S1')).toEqual(truoc)
  })
})

describe('shop-danh-sach', () => {
  it('chỉ món đợt 1 (24); trường đúng hợp đồng; điều kiện học + số cái; đồ đã có / đang mặc', async () => {
    const d = dung(); cap(d, 'S1', 340); chuoi(d, 'S1', 9)
    d.sql.prepare("INSERT INTO phu_kien_so_huu(sbd,ma_mon,mua,gia,khoa_yeu_cau,luc) VALUES('S1','VD-04','m1',120,'k','x')").run()
    d.sql.prepare("INSERT INTO phu_kien_dang_mac(sbd,o_gan,ma_mon,luc) VALUES('S1','vet','VD-04','x')").run()
    d.sql.prepare("INSERT INTO phu_kien_so_huu(sbd,ma_mon,mua,gia,khoa_yeu_cau,luc) VALUES('S2','KT-08','m1',6000,'k2','x')").run()
    const r = await goi(d, 'S1', 'shop-danh-sach')
    expect(r).toMatchObject({ ok: true, phienBan: 'm1-v1', vang: 340, emCo: { chuoiNgay: 9, anThachSang: 0 }, dangMac: { vet: 'VD-04', 'hao-quang': null, khung: null, dau: null, 'co-lung': null } })
    expect(r.mon).toHaveLength(24); expect(r.mon.map((m: any) => m.ma)).toEqual(DANH_MUC_PHU_KIEN.filter((m) => m.moBan === 1).map((m) => m.ma))
    const mon = (ma: string) => r.mon.find((m: any) => m.ma === ma)
    expect(mon('VD-04')).toEqual({ ma: 'VD-04', gia: 250, daCo: true, dangMac: true, moKhoa: true, thieu: null, suatCon: null, suatTong: null })
    expect(mon('KT-08')).toEqual({ ma: 'KT-08', gia: 2210, daCo: false, dangMac: false, moKhoa: false, thieu: 'Cần chuỗi 14 ngày', suatCon: 29, suatTong: 30 }) // S2 đã mua 1 cái
    expect(mon('HQ-08')).toMatchObject({ moKhoa: false, thieu: 'Cần chuỗi 14 ngày + 5 ấn thạch sáng', suatCon: 20, suatTong: 20 })
    expect(mon('HQ-07')).toMatchObject({ moKhoa: true, thieu: null }); expect(mon('VD-08')).toMatchObject({ moKhoa: false, thieu: 'Cần chuỗi 21 ngày', suatCon: 25 }); expect(mon('HQ-01')).toMatchObject({ moKhoa: true, thieu: null }) // chuỗi 9 ≥ 7 ⇒ Sử thi mở; Huyền thoại 21 ngày còn khoá
    expect(r.mon.some((m: any) => /^(DA|CL)-/.test(m.ma))).toBe(false)                    // đợt 2 chưa bán
  })
  it('đủ chuỗi 14 ngày nhưng thiếu ấn thạch ⇒ HQ-08 vẫn khoá, KT-08 mở; đủ cả hai ⇒ mở', async () => {
    const d = dung(); chuoi(d, 'S1', 14)
    let r = await goi(d, 'S1', 'shop-danh-sach'); expect(r.mon.find((m: any) => m.ma === 'HQ-08')).toMatchObject({ moKhoa: false, thieu: 'Cần chuỗi 14 ngày + 5 ấn thạch sáng' }); expect(r.mon.find((m: any) => m.ma === 'KT-08').moKhoa).toBe(true)
    anSang(d, 'S1', 5); r = await goi(d, 'S1', 'shop-danh-sach'); expect(r.mon.find((m: any) => m.ma === 'HQ-08')).toMatchObject({ moKhoa: true, thieu: null }); expect(r.emCo).toEqual({ chuoiNgay: 14, anThachSang: 5 })
  })
})

describe('shop-mua', () => {
  it('mua VD-04 (250, giá v4) khi có 340 vàng: −250, sở hữu, sổ −250, TỰ MẶC; số vàng tính từ sổ', async () => {
    const d = dung(); cap(d, 'S1', 340)
    const r = await goi(d, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('m1') })
    expect(r).toEqual({ ok: true, maMon: 'VD-04', vang: 90, daMac: true, lapLai: false })
    expect(d.sql.prepare("SELECT ma_mon, gia, mua FROM phu_kien_so_huu WHERE sbd='S1'").all()).toEqual([{ ma_mon: 'VD-04', gia: 250, mua: 'm1' }])
    expect(d.sql.prepare("SELECT loai, so_vang, ma_mon FROM vang_so WHERE sbd='S1' AND loai='mua'").all()).toEqual([{ loai: 'mua', so_vang: -250, ma_mon: 'VD-04' }])
    expect(d.sql.prepare("SELECT o_gan, ma_mon FROM phu_kien_dang_mac WHERE sbd='S1'").all()).toEqual([{ o_gan: 'vet', ma_mon: 'VD-04' }])
    expect(hoSo(d, 'S1').p.wallet).toBe(620); expect(dem(d, 'exp_so')).toBe(0)             // phụ kiện KHÔNG đụng EXP
  })
  it('món mới thay món đang mặc ở CÙNG chỗ đeo, giữ món cũ trong Tủ đồ', async () => {
    const d = dung(); cap(d, 'S1', 1000)
    await goi(d, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('m1') }); await goi(d, 'S1', 'shop-mua', { maMon: 'VD-05', giaThay: 370, khoaYeuCau: K('m2') })
    expect(d.sql.prepare("SELECT ma_mon FROM phu_kien_dang_mac WHERE sbd='S1' AND o_gan='vet'").all()).toEqual([{ ma_mon: 'VD-05' }]); expect(dem(d, 'phu_kien_so_huu', 'S1')).toBe(2); expect(vangSo(d, 'S1')).toBe(380)
  })
  it('bấm đúp tuần tự và SONG SONG (cùng khoá): một lần trừ, lần kia lapLai:true', async () => {
    const d = dung(); cap(d, 'S1', 340)
    const tuan = await goi(d, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('t') }); expect(tuan.lapLai).toBe(false)
    expect(await goi(d, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('t') })).toMatchObject({ ok: true, vang: 90, lapLai: true })
    const d2 = dung(); cap(d2, 'S1', 340)
    const [a, b] = await Promise.all([goi(d2, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('s') }), goi(d2, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('s') })])
    expect([a.ok, b.ok]).toEqual([true, true]); expect([a.lapLai, b.lapLai].sort()).toEqual([false, true])
    expect(dem(d2, 'phu_kien_so_huu')).toBe(1); expect(vangSo(d2, 'S1')).toBe(90); expect(dem(d2, 'vang_so')).toBe(2)   // 1 cấp + 1 mua
  })
  it('hai lệnh song song KHÁC khoá cùng món ⇒ một được, một da_co; vàng chỉ trừ một lần', async () => {
    const d = dung(); cap(d, 'S1', 500)
    const rs = await Promise.all([goi(d, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('a') }), goi(d, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('b') })])
    expect(rs.filter((r) => r.ok)).toHaveLength(1); expect(rs.find((r) => !r.ok)).toMatchObject({ ma: 'da_co' }); expect(vangSo(d, 'S1')).toBe(250); expect(dem(d, 'phu_kien_so_huu')).toBe(1)
  })
  it('vàng KHÔNG BAO GIỜ âm: 300 vàng, hai món song song (VD-04 250 + HQ-03 300) ⇒ đúng một món; số dư ≥ 0', async () => {
    const d = dung(); cap(d, 'S1', 300)
    const rs = await Promise.all([goi(d, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('a') }), goi(d, 'S1', 'shop-mua', { maMon: 'HQ-03', giaThay: 300, khoaYeuCau: K('b') })])
    expect(rs.filter((r) => r.ok)).toHaveLength(1); expect(rs.find((r) => !r.ok)).toMatchObject({ ma: 'thieu_vang' })
    expect(vangSo(d, 'S1')).toBeGreaterThanOrEqual(0); expect(dem(d, 'phu_kien_so_huu')).toBe(1)
  })
  it('giaThay lệch giá máy chủ ⇒ gia_doi, không ghi; thiếu vàng nói số thiếu; đã có ⇒ da_co', async () => {
    const d = dung(); cap(d, 'S1', 100)
    expect(await goi(d, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 100, khoaYeuCau: K('a') })).toMatchObject({ ok: false, ma: 'gia_doi', loi: 'Giá vừa thay đổi, em xem lại rồi mua nhé.' })
    expect(await goi(d, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('b') })).toMatchObject({ ok: false, ma: 'thieu_vang', loi: 'Chưa đủ vàng — còn thiếu 150 vàng.' })
    expect(dem(d, 'phu_kien_so_huu')).toBe(0); expect(dem(d, 'vang_so')).toBe(1)
    cap(d, 'S1', 500); await goi(d, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('c') })
    expect(await goi(d, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('d') })).toMatchObject({ ok: false, ma: 'da_co', loi: 'Em đã có món này rồi. Vào Tủ đồ để mặc.' })
  })
  it('mã lạ ⇒ khong_co_mon; món đợt 2 ⇒ sap_mo; đầu vào sai ⇒ sai_dau_vao; lời đúng chữ Boss chốt', async () => {
    const d = dung(); cap(d, 'S1', 5000)
    expect(await goi(d, 'S1', 'shop-mua', { maMon: 'ZZ-99', giaThay: 10, khoaYeuCau: K('a') })).toMatchObject({ ma: 'khong_co_mon', loi: 'Cửa hàng không có món này. Em tải lại Cửa hàng rồi chọn lại nhé.' })
    expect(await goi(d, 'S1', 'shop-mua', { maMon: 'DA-01', giaThay: 30, khoaYeuCau: K('b') })).toMatchObject({ ma: 'sap_mo', loi: 'Món này sắp mở bán. Em ghé lại sau nhé.' })
    for (const b of [{ giaThay: 1, khoaYeuCau: K('c') }, { maMon: 'VD-04', khoaYeuCau: K('c') }, { maMon: 'VD-04', giaThay: 120.5, khoaYeuCau: K('c') }, { maMon: 'VD-04', giaThay: 250 }, { maMon: 'VD-04', giaThay: 250, khoaYeuCau: 'x' }]) {
      const r = await goi(d, 'S1', 'shop-mua', b); expect(r, JSON.stringify(b)).toMatchObject({ ok: false, ma: 'sai_dau_vao', loi: 'Có gì đó chưa đúng. Em tải lại trang rồi thử lại nhé.' })
    }
    expect(dem(d, 'phu_kien_so_huu')).toBe(0)
  })
  it('điều kiện học: thiếu chuỗi ⇒ chua_mo (nói số em đang có); đủ chuỗi thiếu ấn thạch ⇒ chua_mo ấn thạch; đủ cả hai ⇒ mua được', async () => {
    const d = dung(); cap(d, 'S1', 20000); chuoi(d, 'S1', 3)
    expect(await goi(d, 'S1', 'shop-mua', { maMon: 'KT-08', giaThay: 2210, khoaYeuCau: K('a') })).toMatchObject({ ok: false, ma: 'chua_mo', loi: 'Món này cần chuỗi 14 ngày. Em đang chuỗi 3 ngày.' })
    d.sql.prepare("DELETE FROM ke_hoach_ngay WHERE sbd='S1'").run(); chuoi(d, 'S1', 14)
    expect(await goi(d, 'S1', 'shop-mua', { maMon: 'HQ-08', giaThay: 2990, khoaYeuCau: K('b') })).toMatchObject({ ok: false, ma: 'chua_mo', loi: 'Món này cần 5 ấn thạch sáng. Em đang có 0.' })
    anSang(d, 'S1', 5)
    expect(await goi(d, 'S1', 'shop-mua', { maMon: 'HQ-08', giaThay: 2990, khoaYeuCau: K('c') })).toMatchObject({ ok: true, maMon: 'HQ-08', vang: 17010, daMac: true })
  })
  it('món giới hạn số cái: hết ⇒ het_suat (lời có số cái của mùa); HAI EM cùng mua CÁI CUỐI ⇒ đúng một em được, tổng đã bán không vượt 30', async () => {
    const d = dung({ em: ['S1', 'S2', 'S3'] }); for (const s of ['S1', 'S2']) { cap(d, s, 6000); chuoi(d, s, 14) }
    const them = d.sql.prepare("INSERT INTO phu_kien_so_huu(sbd,ma_mon,mua,gia,khoa_yeu_cau,luc) VALUES(?,'KT-08','m1',6000,?,'x')")
    for (let i = 0; i < 29; i++) them.run(`X${i}`, `kx${i}`)                                // đã bán 29/30
    const rs = await Promise.all([goi(d, 'S1', 'shop-mua', { maMon: 'KT-08', giaThay: 2210, khoaYeuCau: K('a') }), goi(d, 'S2', 'shop-mua', { maMon: 'KT-08', giaThay: 2210, khoaYeuCau: K('b') })])
    expect(rs.filter((r) => r.ok)).toHaveLength(1)
    expect(rs.find((r) => !r.ok)).toMatchObject({ ma: 'het_suat', loi: 'Món này đã hết. Mùa 1 chỉ có 30 cái.' })
    expect((d.sql.prepare("SELECT COUNT(*) n FROM phu_kien_so_huu WHERE ma_mon='KT-08'").get() as { n: number }).n).toBe(30)
    const nguoiThua = rs[0]!.ok ? 'S2' : 'S1'; expect(vangSo(d, nguoiThua)).toBe(6000)      // người hụt: vàng còn nguyên, không có dòng mua
    expect(await goi(d, 'S2', 'shop-danh-sach')).toBeTruthy()
    const dsach = await goi(d, nguoiThua, 'shop-danh-sach'); expect(dsach.mon.find((m: any) => m.ma === 'KT-08')).toMatchObject({ suatCon: 0, suatTong: 30 })
  })
  it('mọi lô mua là MỘT batch nguyên tử: chỉ có 3 câu ghi, sở hữu ⇒ sổ ⇒ mặc; hồ sơ game KHÔNG bị ghi', async () => {
    const d = dung(); cap(d, 'S1', 340); const truoc = hoSo(d, 'S1')
    const ghi: string[] = []; const goc = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = ((q: string) => { if (/^\s*(INSERT|UPDATE|DELETE|REPLACE)/i.test(q)) ghi.push(q.replace(/\s+/g, ' ')); return goc(q) }) as typeof d.env.DB.prepare
    await goi(d, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('a') })
    expect(ghi).toHaveLength(3); expect(ghi[0]).toMatch(/INTO phu_kien_so_huu/); expect(ghi[1]).toMatch(/INTO vang_so/); expect(ghi[2]).toMatch(/INTO phu_kien_dang_mac/)   // sở hữu ⇒ sổ ⇒ mặc
    expect(hoSo(d, 'S1')).toEqual(truoc)
  })
})

/** Chạy `viecKia` (một lượt KHÁC vừa xong) đúng vào khoảng giữa các câu kiểm trước và lô ghi của lượt đang thử — cách dựng đua TẤT ĐỊNH (Promise.all trong D1 giả không xen đúng lúc). */
function truocLo(d: D1That, viecKia: () => void): void {
  const goc = d.env.DB.batch.bind(d.env.DB); let xong = false
  d.env.DB.batch = (async (ds: unknown[]) => { if (!xong) { xong = true; viecKia() } return goc(ds as never) }) as typeof d.env.DB.batch
}
describe('shop-mua · đua tất định: lượt khác xong NGAY TRƯỚC lô ghi', () => {
  it('lượt khác vừa tiêu vàng ⇒ số dư không còn đủ: lô KHÔNG ghi (không có dòng sở hữu, sổ không âm) và em nhận thieu_vang', async () => {
    const d = dung(); cap(d, 'S1', 300)
    truocLo(d, () => cap(d, 'S1', -100))                                                     // còn 200 vàng (giá v4 VD-04 = 250)
    const r = await goi(d, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('a') })
    expect(r).toMatchObject({ ok: false, ma: 'thieu_vang', loi: 'Chưa đủ vàng — còn thiếu 50 vàng.' })
    expect(dem(d, 'phu_kien_so_huu')).toBe(0); expect(vangSo(d, 'S1')).toBe(200); expect(dem(d, 'phu_kien_dang_mac')).toBe(0)
  })
  it('lượt khác vừa bán cái cuối (29 → 30) ⇒ lô KHÔNG ghi, em nhận het_suat; số cái đã bán KHÔNG vượt 30; vàng còn nguyên', async () => {
    const d = dung({ em: ['S1', 'S2'] }); cap(d, 'S1', 6000); chuoi(d, 'S1', 14)
    const them = d.sql.prepare("INSERT INTO phu_kien_so_huu(sbd,ma_mon,mua,gia,khoa_yeu_cau,luc) VALUES(?,'KT-08','m1',6000,?,'x')")
    for (let i = 0; i < 29; i++) them.run(`X${i}`, `kx${i}`)
    truocLo(d, () => { them.run('S2', 'kcuoi') })                                            // em khác mua nốt cái thứ 30
    const r = await goi(d, 'S1', 'shop-mua', { maMon: 'KT-08', giaThay: 2210, khoaYeuCau: K('a') })
    expect(r).toMatchObject({ ok: false, ma: 'het_suat', loi: 'Món này đã hết. Mùa 1 chỉ có 30 cái.' })
    expect((d.sql.prepare("SELECT COUNT(*) n FROM phu_kien_so_huu WHERE ma_mon='KT-08'").get() as { n: number }).n).toBe(30); expect(vangSo(d, 'S1')).toBe(6000)
  })
  it('lượt khác (cùng em, khác khoá) vừa mua đúng món này ⇒ da_co, vàng chỉ trừ một lần', async () => {
    const d = dung(); cap(d, 'S1', 500)
    truocLo(d, () => {
      d.sql.prepare("INSERT INTO phu_kien_so_huu(sbd,ma_mon,mua,gia,khoa_yeu_cau,luc) VALUES('S1','VD-04','m1',250,'kkia','t')").run(); cap(d, 'S1', -250, 'kkia')
    })
    expect(await goi(d, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('a') })).toMatchObject({ ok: false, ma: 'da_co' })
    expect(vangSo(d, 'S1')).toBe(250); expect(dem(d, 'phu_kien_so_huu', 'S1')).toBe(1)
  })
  it('khoá yêu cầu này đã được dùng cho một lệnh ĐỔI (cùng em) ngay trước lô ⇒ KHÔNG cho món miễn phí: không có dòng sở hữu', async () => {
    const d = dung(); cap(d, 'S1', 500)
    truocLo(d, () => { d.sql.prepare("INSERT INTO vang_so(sbd,loai,so_vang,exp_tru,ma_mon,khoa_yeu_cau,luc) VALUES('S1','doi',10,10,NULL,?,'t')").run(K('a')) })
    expect(await goi(d, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('a') })).toMatchObject({ ok: false, ma: 'sai_dau_vao' })
    expect(dem(d, 'phu_kien_so_huu')).toBe(0); expect(vangSo(d, 'S1')).toBe(510)
  })
})

describe('thu-mac-do', () => {
  it('mặc món đã có; món chưa có / sai chỗ đeo ⇒ chua_co; cởi bằng maMon:null; oGan lạ ⇒ sai_dau_vao; trả đủ 5 chỗ đeo', async () => {
    const d = dung(); cap(d, 'S1', 1000)
    await goi(d, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('a') }); await goi(d, 'S1', 'shop-mua', { maMon: 'KT-03', giaThay: 170, khoaYeuCau: K('b') })
    await goi(d, 'S1', 'thu-mac-do', { oGan: 'vet', maMon: null })
    expect(await goi(d, 'S1', 'thu-mac-do', { oGan: 'khung', maMon: 'KT-03' })).toEqual({ ok: true, dangMac: { 'hao-quang': null, vet: null, khung: 'KT-03', dau: null, 'co-lung': null } })
    expect(await goi(d, 'S1', 'thu-mac-do', { oGan: 'vet', maMon: 'VD-04' })).toMatchObject({ ok: true, dangMac: { vet: 'VD-04', khung: 'KT-03' } })
    expect(await goi(d, 'S1', 'thu-mac-do', { oGan: 'vet', maMon: 'VD-05' })).toMatchObject({ ok: false, ma: 'chua_co', loi: 'Em chưa có món này nên chưa mặc được.' })
    expect(await goi(d, 'S1', 'thu-mac-do', { oGan: 'khung', maMon: 'VD-04' })).toMatchObject({ ok: false, ma: 'chua_co' })      // VD-04 là đồ chỗ "vet", không mặc vào "khung"
    expect(await goi(d, 'S2', 'thu-mac-do', { oGan: 'vet', maMon: 'VD-04' })).toMatchObject({ ok: false, ma: 'chua_co' })        // đồ của bạn khác không mặc được
    expect(await goi(d, 'S1', 'thu-mac-do', { oGan: 'tay', maMon: 'VD-04' })).toMatchObject({ ok: false, ma: 'sai_dau_vao' })
    expect(await goi(d, 'S1', 'thu-mac-do', { oGan: 'vet', maMon: 5 })).toMatchObject({ ok: false, ma: 'sai_dau_vao' })
    expect(await goi(d, 'S1', 'thu-mac-do', { oGan: 'vet', maMon: null })).toMatchObject({ ok: true, dangMac: { vet: null, khung: 'KT-03' } })
  })
})

describe('shopBat — cửa vào cửa hàng không tốn lượt gọi thêm (Code 2, B4)', () => {
  it('recommendations mang shopBat: vắng cờ / bat:false ⇒ false; bat:true ⇒ true; chiSbd chỉ em trong danh sách', async () => {
    const chay = async (o: Parameters<typeof dung>[0], sbd = 'S1') => (await goi(dung(o), sbd, 'recommendations') as any).shopBat
    expect(await chay({ khongCo: true })).toBe(false); expect(await chay({ co: { bat: false } })).toBe(false); expect(await chay({ co: { bat: true } })).toBe(true)
    expect(await chay({ co: { bat: true, chiSbd: ['S1'] } }, 'S1')).toBe(true); expect(await chay({ co: { bat: true, chiSbd: ['S1'] } }, 'S2')).toBe(false); expect(await chay({ co: { bat: true, chiSbd: [] } })).toBe(false)
  })
  it('/hs/ke-hoach-ngay: khối thanThu mang shopBat (lượt thật VÀ lượt đệm), không có thanThu thì không thêm; không ghi bẩn đệm kế hoạch', async () => {
    const d = dung({ co: { bat: true } })
    const a = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' }); expect(a.thanThu).toMatchObject({ pet: 'lua_phuong', shopBat: true })
    const b = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' }); expect(b.thanThu).toMatchObject({ shopBat: true })   // lượt đệm
    d.sql.prepare("UPDATE cau_hinh SET gia_tri = ? WHERE khoa = 'shop_phu_kien'").run(JSON.stringify({ bat: false })); vi.setSystemTime(T0 + 31_000)
    const c = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' }); expect(c.thanThu.shopBat).toBe(false)              // cờ tắt hiện sau đệm 30 s
    const e = dung({ khongCo: true }); d.sql.exec('SELECT 1')
    expect((await goiWorker(worker, e.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })).thanThu.shopBat).toBe(false)
  })
  it('cờ đọc từ đệm 30 giây: hai lượt một truy vấn; sau 30 giây đọc lại; lệnh mua/đổi vẫn kiểm cờ TƯƠI (tắt là ngừng bán ngay)', async () => {
    const d = dung({ co: { bat: true } }); cap(d, 'S1', 500)
    let n = 0; const goc = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = ((q: string) => { if (/FROM cau_hinh WHERE khoa = 'shop_phu_kien'/.test(q)) n++; return goc(q) }) as typeof d.env.DB.prepare
    expect(await shopBatCho(d.env, 'S1')).toBe(true); expect(await shopBatCho(d.env, 'S2')).toBe(true); expect(n).toBe(1)
    d.sql.prepare("UPDATE cau_hinh SET gia_tri = ? WHERE khoa = 'shop_phu_kien'").run(JSON.stringify({ bat: false }))
    expect(await shopBatCho(d.env, 'S1')).toBe(true)                                            // còn đệm
    expect(await goi(d, 'S1', 'shop-mua', { maMon: 'VD-04', giaThay: 250, khoaYeuCau: K('t') })).toMatchObject({ ok: false, ma: 'tam_dong' })   // mua: cờ tươi
    vi.setSystemTime(T0 + 30_000); expect(await shopBatCho(d.env, 'S1')).toBe(false)
    const thieu = dung({ co: { bat: true } }); for (const b of ['phu_kien_dang_mac', 'phu_kien_so_huu', 'vang_so']) thieu.sql.exec(`DROP TABLE ${b}`)
    expect(await shopBatCho(thieu.env, 'S1')).toBe(true)                                        // cờ đọc được ⇒ hiện; mua sẽ báo tam_dong khi chưa có bảng
  })
})

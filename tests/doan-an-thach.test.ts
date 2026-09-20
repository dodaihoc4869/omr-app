// @vitest-environment node
// ĐOÀN HỘ TỐNG — bước 6: ấn thạch dạng (đọc hồ sơ thật, dùng đúng định nghĩa "dạng yếu" của hồ sơ), bạn đồng hành bù nhau, hào quang/danh hiệu, bảng cho thầy.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { gameV2 } from '../server/src/game-v2'
import { adminGame } from '../server/src/game-v2-reports'
import { gameToken } from '../server/src/game-v2-auth'
import { trangThaiAn, conCauDeSang, haoQuang, anChoSanh, docAnThach, docHienThi, goiYBanDongHanh } from '../server/src/game-v2-doan-an'
import { DEM_NGUOC_MS, NGHI_GIUA_HIEP_MS, tenGoi } from '../server/src/game-v2-doan'
import { dangYeu, type NamKtDang } from '../server/src/ho-so-nam-kt'
import { taoD1That, type D1That } from './_d1-that'

const T0 = Date.parse('2026-09-23T12:00:00+07:00'), HOM_NAY = '2026-09-23'
let bayGio = T0
const troi = (ms: number) => { bayGio += ms; vi.setSystemTime(bayGio) }
beforeEach(() => { bayGio = T0; vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())
const dang = (o: Partial<NamKtDang>): NamKtDang => ({ sbd: 'S1', maDang: 'ES.A.X', soGap: 0, soSai: 0, soDaKhacPhuc: 0, soMoiSai: 0, soChuaThaySai: 0, bac: 0, mocOnKe: null, mocMoiSai: null, ...o })

describe('Bước 6 · ấn thạch (hàm thuần, tính tay)', () => {
  it('ấn NỨT ⇔ dạng yếu theo ĐÚNG định nghĩa của hồ sơ; ấn SÁNG = đủ 4 câu đã gặp và không yếu; chưa đủ căn cứ → chưa có ấn', () => {
    const yeu = dang({ soGap: 10, soSai: 5, soDaKhacPhuc: 1, soChuaThaySai: 5 }), khoe = dang({ soGap: 10, soSai: 2, soDaKhacPhuc: 2, soChuaThaySai: 8 }), it3 = dang({ soGap: 3, soChuaThaySai: 3 })
    const toiHan = dang({ soGap: 2, soSai: 1, soMoiSai: 1, mocMoiSai: '2026-09-22' }), chuaToi = dang({ soGap: 5, soSai: 1, soMoiSai: 1, soChuaThaySai: 4, mocMoiSai: '2026-09-30' })
    expect([yeu, khoe, it3, toiHan, chuaToi].map(d => trangThaiAn(d, HOM_NAY))).toEqual(['nut', 'sang', null, 'nut', 'sang'])
    for (const d of [yeu, khoe, it3, toiHan, chuaToi]) expect(trangThaiAn(d, HOM_NAY) === 'nut').toBe(dangYeu(d, HOM_NAY))
  })
  it('"còn N câu nữa là sáng": 10 câu đã gặp, 6 câu ổn → cần 7 → còn 1; 4 ổn → còn 3; chỉ vì câu mới sai tới hạn → đúng số câu mới sai; ấn sáng → 0', () => {
    expect(conCauDeSang(dang({ soGap: 10, soDaKhacPhuc: 1, soChuaThaySai: 5 }), HOM_NAY)).toBe(1)
    expect(conCauDeSang(dang({ soGap: 10, soDaKhacPhuc: 1, soChuaThaySai: 3 }), HOM_NAY)).toBe(3)
    expect(conCauDeSang(dang({ soGap: 2, soMoiSai: 2, mocMoiSai: '2026-09-20' }), HOM_NAY)).toBe(2)
    expect(conCauDeSang(dang({ soGap: 10, soChuaThaySai: 9, soDaKhacPhuc: 1 }), HOM_NAY)).toBe(0)
  })
  it('hào quang theo số ấn SÁNG: < 3 không · 3–5 bạc · ≥ 6 vàng; Sảnh hiện tối đa 6 ấn, nứt trước, kèm ấn gần sáng nhất + tên biến thể kỹ năng', () => {
    expect([0, 2, 3, 5, 6, 9].map(haoQuang)).toEqual(['khong', 'khong', 'bac', 'bac', 'vang', 'vang'])
    const ds = [{ dang: 'a', ten: 'Ester', trangThai: 'nut' as const, conCau: 3 }, ...Array.from({ length: 7 }, (_, i) => ({ dang: `s${i}`, ten: `D${i}`, trangThai: 'sang' as const, conCau: 0 }))]
    expect(anChoSanh(ds, 2)).toMatchObject({ sang: 7, nut: 1, ganSang: { ten: 'Ester', conCau: 3, kyNang: 'Liệt Diễm Xuyên Giáp' } }); expect(anChoSanh(ds, 2).ds).toHaveLength(6)
    expect(anChoSanh([], 2)).toEqual({ sang: 0, nut: 0, ds: [], ganSang: null })
  })
})

// ───────────────────────── D1 ─────────────────────────
const DAP = (i: number) => 'ABCD'[i % 4]!
function truong(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong','{\"toanBo\":true}','x')").run()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',40,'kho/DE1.json',0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  for (let i = 0; i < 24; i++) {
    const es = i < 12, q = { qid: `${es ? 'E' : 'A'}${i}`, maDe: 'DE1', version: 'v1', group: `g${i}`, phan: 'I', text: `Đề ${i}`, choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [], dang: es ? 'ES.A.X' : 'AN.B.Y', tenDang: es ? 'Ester' : 'Ancol', mucDo: 'biet', sao: 1, kienThuc: ['K1'], correct: DAP(i), solution: 'x', reviewed: true }
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', q.qid, 'v1', q.group, q.dang, JSON.stringify(q))
  }
  for (const [sbd, ten, pet] of [['S1', 'Trần Minh', 'lua_phuong'], ['S2', 'Nguyễn Thu Hà', 'nuoc_long'], ['S3', 'Lê Nam', 'khi_lang']] as const) {
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12A','mk','x')").run(sbd, ten)
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run(sbd, JSON.stringify({ pet, choice: false, legacy: null, cap: 12, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  }
  return d
}
/** Ghi thẳng hồ sơ dạng: `on` = số câu ổn (đã khắc phục + chưa từng sai) trên 10 câu đã gặp. */
const hoSo = (d: D1That, sbd: string, maDang: string, on: number) => d.sql.prepare('INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,moc_on_ke,moc_moi_sai,cap_nhat_luc) VALUES(?,?,?,10,?,0,0,?,0,NULL,NULL,?)').run(`${sbd}|${maDang}`, sbd, maDang, 10 - on, on, 'x')
const goi = async (d: D1That, sbd: string, lenh: string, b: Record<string, unknown> = {}) => gameV2(d.env, `doan-${lenh}`, { token: await gameToken(d.env, sbd), ...b }) as Promise<any>

describe('Bước 6 · ấn thạch trong game (SQLite thật)', () => {
  it('Sảnh: ấn nứt trước rồi ấn sáng, tên dạng lấy từ kho, "còn N câu nữa là sáng → mở <biến thể kỹ năng của thần thú em>"; chưa có hồ sơ → rỗng, không lỗi', async () => {
    const d = truong(); hoSo(d, 'S1', 'ES.A.X', 4); hoSo(d, 'S1', 'AN.B.Y', 9)
    const r = await goi(d, 'S1', 'sanh')
    expect(r.anThach).toEqual({ sang: 1, nut: 1, ds: [{ dang: 'ES.A.X', ten: 'Ester', trangThai: 'nut', conCau: 3 }, { dang: 'AN.B.Y', ten: 'Ancol', trangThai: 'sang', conCau: 0 }], ganSang: { ten: 'Ester', conCau: 3, kyNang: 'Liệt Diễm Xuyên Giáp' } })
    expect((await goi(d, 'S3', 'sanh')).anThach).toEqual({ sang: 0, nut: 0, ds: [], ganSang: null })
    d.sql.exec('DROP TABLE nam_kt_dang'); expect(await docAnThach(d.env, 'S1', HOM_NAY)).toEqual([])
  })
  it('câu thuộc dạng ẤN SÁNG → gói tin báo `an:true` và Kỹ năng ở hiệp ấy ×1,25 (30 thay vì 24), tên biến thể; câu dạng nứt thì không', async () => {
    const d = truong(); hoSo(d, 'S1', 'AN.B.Y', 9) // Ancol đã sáng; S1 chỉ có bằng chứng ở Ancol nên cả 6 câu là Ancol
    d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,ma_dang,chuyen_de,muc_do) VALUES('k1','S1','A12','btvn','B',1,1,?,?,'AN.B.Y','','biet')").run(new Date(T0 - 72 * 3_600_000).toISOString(), '2026-09-20')
    d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,chuyen_de,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,ket_qua_cuoi,nguon_cuoi,luc_cuoi,moc_on_ke,trang_thai,can_day_lai,cap_nhat_luc) VALUES('S1|A12','S1','A12','AN.B.Y','',1,0,0,1,1,1,'btvn',?,NULL,'chua_thay_sai',0,'x')").run(new Date(T0 - 72 * 3_600_000).toISOString())
    const ma = (await goi(d, 'S1', 'mo')).doan.ma as string; troi(DEM_NGUOC_MS)
    let xem = await goi(d, 'S1', 'xem', { ma }); const satThuong: number[] = []
    for (let v = 0; xem.doan.tran.hiep < 4 && v < 30; v++) {
      const t = xem.doan.tran
      if (t.moSauMs > 0 || !xem.doan.cau) troi(Math.max(t.moSauMs, 500))
      else { expect(xem.doan.cau.an).toBe(true); const r = await goi(d, 'S1', 'nop', { ma, hiep: t.hiep, answer: DAP(Number(String(xem.doan.cau.qid).slice(1))), hanhDong: t.nangLuong >= 2 ? 'ky_nang' : 'danh' }); satThuong.push(r.doan.hiepVuaXong.cuaEm.satThuong); if (t.nangLuong >= 2) expect(r.doan.hiepVuaXong.cuaEm).toMatchObject({ tenChieu: 'Liệt Diễm Xuyên Giáp', heSo: { anThach: 1.25 } }) }
      xem = await goi(d, 'S1', 'xem', { ma })
    }
    expect(satThuong).toEqual([24, 24, 30]) // Đánh thường không ăn ấn; Kỹ năng ở dạng đã khắc phục = 16 × 1,5 × 1,25
  })
  it('bạn đồng hành BÙ NHAU: em nứt Ester + sáng Ancol ↔ bạn sáng Ester + nứt Ancol; chỉ nói điều mỗi bên VỮNG; không ai bù → null; bạn chưa chọn thú → bỏ qua', async () => {
    const d = truong(); hoSo(d, 'S1', 'ES.A.X', 4); hoSo(d, 'S1', 'AN.B.Y', 9); hoSo(d, 'S2', 'ES.A.X', 9); hoSo(d, 'S2', 'AN.B.Y', 3); hoSo(d, 'S3', 'ES.A.X', 9)
    const r = await goi(d, 'S1', 'sanh')
    expect(r.banDongHanh).toEqual({ ten: 'Thu Hà', pet: 1, cap: 12, banVung: 'Ester', emVung: 'Ancol' }); expect(JSON.stringify(r.banDongHanh)).not.toMatch(/S2|yếu|nứt/)
    expect((await goi(d, 'S3', 'sanh')).banDongHanh).toBeNull() // S3 không có ấn nứt nào
    d.sql.prepare("UPDATE game_v2_profile SET json=json_set(json,'$.choice',json('true')) WHERE sbd='S2'").run()
    expect(await goiYBanDongHanh(d.env, 'S1', '12A', HOM_NAY, tenGoi)).toBeNull()
  })
  it('hiển thị ngoài game: hào quang theo ấn sáng, danh hiệu "Người tiếp sức" khi ≥ 3 lần giúp THÀNH CÔNG trong 7 ngày (lần cũ hơn / lần không thành không tính)', async () => {
    const d = truong(); for (const [i, m] of ['D1', 'D2', 'D3'].entries()) hoSo(d, 'S1', `${m}.A.${i}`, 9)
    const ins = d.sql.prepare('INSERT INTO doan_tiep_suc(ma_chang,hiep,den_sbd,tu_sbd,the,thanh_cong,luc) VALUES(?,?,?,?,?,?,?)')
    ins.run('C1', 1, 'S2', 'S1', 'x', 1, new Date(T0 - 86_400_000).toISOString()); ins.run('C1', 2, 'S2', 'S1', 'x', 1, new Date(T0 - 2 * 86_400_000).toISOString()); ins.run('C2', 1, 'S3', 'S1', 'x', 0, new Date(T0).toISOString()); ins.run('C0', 1, 'S2', 'S1', 'x', 1, new Date(T0 - 9 * 86_400_000).toISOString())
    expect((await goi(d, 'S1', 'hien-thi')).hienThi).toEqual({ anSang: 3, anNut: 0, haoQuang: 'bac', danhHieu: null })
    ins.run('C3', 1, 'S3', 'S1', 'x', 1, new Date(T0).toISOString())
    expect(await docHienThi(d.env, 'S1', T0, HOM_NAY)).toMatchObject({ haoQuang: 'bac', danhHieu: 'Người tiếp sức' })
  })
  it('bảng cho thầy: ai giúp ai, Người tiếp sức của tuần, lớp yếu dạng nào qua CÂU TRÙM (không có tên em nào ở phần câu trùm); thiếu bảng → rỗng, không lỗi', async () => {
    const d = truong()
    const ins = d.sql.prepare('INSERT INTO doan_tiep_suc(ma_chang,hiep,den_sbd,tu_sbd,the,thanh_cong,luc) VALUES(?,?,?,?,?,?,?)'), nay = new Date(T0).toISOString()
    ins.run('C1', 1, 'S2', 'S1', 'x', 1, nay); ins.run('C1', 2, 'S2', 'S1', 'x', 0, nay); ins.run('C2', 1, 'S1', 'S3', 'x', 1, nay); ins.run('C9', 1, 'S1', 'may', 'x', 1, nay)
    const t = d.sql.prepare('INSERT INTO doan_trum_cau(ma_chang,hiep,lop,ngay_vn,ma_dang,qid,y_dung,so_ghe) VALUES(?,?,?,?,?,?,?,?)'); t.run('C1', 4, '12A', HOM_NAY, 'ES.A.X', 'E1', 1, 2); t.run('C2', 4, '12A', HOM_NAY, 'ES.A.X', 'E2', 2, 3); t.run('C2', 8, '12A', HOM_NAY, 'AN.B.Y', 'A13', 4, 3)
    const r = await adminGame(d.env, { action: 'doan-bao-cao', lop: '12A' }) as any
    expect(r.tiepSuc).toEqual([{ tu: 'S1', tenTu: 'Trần Minh', den: 'S2', tenDen: 'Nguyễn Thu Hà', soLan: 2, thanhCong: 1 }, { tu: 'S3', tenTu: 'Lê Nam', den: 'S1', tenDen: 'Trần Minh', soLan: 1, thanhCong: 1 }]) // bạn máy không có trong bảng
    expect(r.nguoiTiepSucCuaTuan.map((x: any) => [x.sbd, x.soLan, x.thanhCong])).toEqual([['S1', 2, 1], ['S3', 1, 1]])
    expect(r.trum).toEqual([{ maDang: 'ES.A.X', soLan: 2, yDungTB: 1.5, voGiap: 0, ten: 'Ester' }, { maDang: 'AN.B.Y', soLan: 1, yDungTB: 4, voGiap: 1, ten: 'Ancol' }]); expect(JSON.stringify(r.trum)).not.toMatch(/S1|S2|S3/)
    d.sql.exec('DROP TABLE doan_trum_cau'); expect((await adminGame(d.env, { action: 'doan-bao-cao' }) as any).trum).toEqual([])
    d.sql.exec('DROP TABLE doan_tiep_suc'); expect(await adminGame(d.env, { action: 'doan-bao-cao' })).toMatchObject({ ok: true, tiepSuc: [], nguoiTiepSucCuaTuan: [] })
  })
})

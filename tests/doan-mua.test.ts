// @vitest-environment node
// ĐOÀN HỘ TỐNG — bước 5: mồi hằng ngày (vé, Đoàn lớp theo mùa, rương chuỗi, Trùm lớp). Hàm thuần tính tay + luồng D1 trên SQLite thật.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { muaHienTai, changMoiTram, tramCuaLop, chuoiNgay, quaRuong, khungTrumLop, docSanh, soVe, LOI_HET_VE, SO_TRAM } from '../server/src/game-v2-doan-mua'
import { DEM_NGUOC_MS, NGHI_GIUA_HIEP_MS } from '../server/src/game-v2-doan'
import { taoD1That, type D1That } from './_d1-that'

const vn = (s: string) => Date.parse(`${s}+07:00`)

describe('Bước 5 · hàm thuần (tính tay)', () => {
  it('mùa 4 tuần tính từ NGÀY ghi trong mùa game (Code 3 ghi lúc reset) — không gắn cứng ngày nào', () => {
    expect(muaHienTai('2026-09-21-mua-1', '2026-09-21')).toEqual({ khoa: '2026-09-21-mua-1|m1|2026-09-21', so: 1, tuNgay: '2026-09-21', denNgay: '2026-10-18', conNgay: 28 })
    expect(muaHienTai('2026-09-21-mua-1', '2026-10-18')).toMatchObject({ so: 1, conNgay: 1 })
    expect(muaHienTai('2026-09-21-mua-1', '2026-10-19')).toMatchObject({ so: 2, tuNgay: '2026-10-19', denNgay: '2026-11-15', conNgay: 28 })
    expect(muaHienTai('2026-10-05-mua-1', '2026-10-06')).toMatchObject({ so: 1, tuNgay: '2026-10-05' }) // reset dời sang ngày khác → mùa 1 dời theo
    const chua = muaHienTai('', '2026-09-23'); expect(chua.so).toBeGreaterThan(0); expect(new Date(`${chua.tuNgay}T00:00:00Z`).getUTCDay()).toBe(1); expect(chua.tuNgay <= '2026-09-23' && chua.denNgay >= '2026-09-23').toBe(true)
    expect(muaHienTai('2026-12-01-mua-1', '2026-09-23')).toMatchObject({ tuNgay: chua.tuNgay }) // ngày mùa ở TƯƠNG LAI → chưa tính, dùng khối lịch
  })
  it('Đoàn lớp 30 trạm: lớp 30 em cần 12 chặng thắng mỗi trạm, 32 em → 13, lớp vài em → tối thiểu 2; không vượt 30', () => {
    expect([30, 32, 3, 1, 0].map(changMoiTram)).toEqual([12, 13, 2, 2, 2])
    expect([0, 11, 12, 35, 360, 9999].map(n => tramCuaLop(n, 30))).toEqual([0, 0, 1, 2, 30, SO_TRAM])
  })
  it('chuỗi ngày: liên tiếp tới hôm nay; hôm nay chưa đi thì chuỗi tới hôm qua vẫn sống; hở một ngày là đứt', () => {
    expect(chuoiNgay(['2026-09-21', '2026-09-22', '2026-09-23'], '2026-09-23')).toEqual({ ngay: 3, daDiHomNay: true })
    expect(chuoiNgay(['2026-09-21', '2026-09-22'], '2026-09-23')).toEqual({ ngay: 2, daDiHomNay: false })
    expect(chuoiNgay(['2026-09-20', '2026-09-22', '2026-09-23'], '2026-09-23')).toEqual({ ngay: 2, daDiHomNay: true })
    expect(chuoiNgay(['2026-09-20'], '2026-09-23')).toEqual({ ngay: 0, daDiHomNay: false }); expect(chuoiNgay([], '2026-09-23').ngay).toBe(0)
  })
  it('rương chuỗi 3/7/14 = 1/2/3 vé (+1 nếu "may mắn"), TẤT ĐỊNH theo (sbd, ngày, mùa); khoảng 1/3 số em may mắn', () => {
    for (const [moc, ve] of [[3, 1], [7, 2], [14, 3]] as const) { const q = quaRuong('S1', '2026-09-23', 'm', moc); expect(q.ve).toBe(ve + (q.mayMan ? 1 : 0)); expect(quaRuong('S1', '2026-09-23', 'm', moc)).toEqual(q) }
    const may = Array.from({ length: 600 }, (_, i) => quaRuong(`S${i}`, '2026-09-23', 'm', 7).mayMan).filter(Boolean).length
    expect(may).toBeGreaterThan(150); expect(may).toBeLessThan(250)
    expect(new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(m => quaRuong('S1', '2026-09-23', m, 7).mayMan)).size).toBe(2) // đổi mùa thì đổi vận
  })
  it('Trùm lớp: Chủ nhật 20:00–20:20 theo GIỜ VIỆT NAM', () => {
    expect(khungTrumLop(vn('2026-09-27T20:00:00'))).toMatchObject({ dangMo: true, chuNhat: '2026-09-27', moSauMs: 0, conMs: 20 * 60_000 })
    expect(khungTrumLop(vn('2026-09-27T20:19:59'))).toMatchObject({ dangMo: true, conMs: 1000 })
    expect(khungTrumLop(vn('2026-09-27T20:20:00'))).toMatchObject({ dangMo: false, chuNhat: '2026-10-04' })
    expect(khungTrumLop(vn('2026-09-27T19:59:00'))).toMatchObject({ dangMo: false, chuNhat: '2026-09-27', moSauMs: 60_000 })
    expect(khungTrumLop(vn('2026-09-21T09:00:00'))).toMatchObject({ dangMo: false, chuNhat: '2026-09-27' })
    expect(khungTrumLop(vn('2026-09-27T02:00:00'))).toMatchObject({ dangMo: false, chuNhat: '2026-09-27' }) // 02:00 Chủ nhật VN = 19:00 thứ Bảy UTC
  })
})

// ───────────────────────── Luồng D1 ─────────────────────────
const T0 = vn('2026-09-23T12:00:00') // thứ Tư
let bayGio = T0
const troi = (ms: number) => { bayGio += ms; vi.setSystemTime(bayGio) }
const datGio = (ms: number) => { bayGio = ms; vi.setSystemTime(ms) }
beforeEach(() => { bayGio = T0; vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())

const DAP = (i: number) => 'ABCD'[i % 4]!
function truong(soEm = 3): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong','{\"toanBo\":true}','x')").run()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: '2026-09-01T00:00:00.000Z', dsSbd: [], toanBo: true }))
  d.sql.prepare("INSERT INTO game_v2_settings(key,json) VALUES('season',?)").run(JSON.stringify({ id: '2026-09-21-mua-1' }))
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',40,'kho/DE1.json',0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  for (let i = 0; i < 40; i++) {
    const q = { qid: `X${i}`, maDe: 'DE1', version: 'v1', group: `g${i}`, phan: 'I', text: `Đề ${i}`, choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [], dang: 'ES.A.X', tenDang: 'Ester', mucDo: 'biet', sao: 1, kienThuc: ['K1'], correct: DAP(i), solution: 'x', reviewed: true }
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', q.qid, 'v1', q.group, q.dang, JSON.stringify(q))
  }
  for (let k = 1; k <= soEm; k++) {
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,'mk','x')").run(`S${k}`, `Em Số ${k}`, '12A')
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run(`S${k}`, JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z', season: '2026-09-21-mua-1' }), 'x') // cùng mùa game, nếu không hồ sơ sẽ bị đặt lại về "chưa chọn thú"
  }
  return d
}
async function bangChung(d: D1That, sbd: string) {
  await ghiSuKien(d.env, [{ nguon: 'btvn', maNguon: `BT-${sbd}`, sbd, qid: 'X0', lan: 1, ketQua: 0, luc: new Date(T0 - 72 * 3_600_000).toISOString(), maDang: 'ES.A.X' }])
  await dungLaiHoSo(d.env, [sbd], new Date(T0).toISOString())
}
const goi = async (d: D1That, sbd: string, lenh: string, b: Record<string, unknown> = {}) => gameV2(d.env, `doan-${lenh}`, { token: await gameToken(d.env, sbd), ...b }) as Promise<any>
const dem = (d: D1That, sql: string, ...a: unknown[]) => Number((d.sql.prepare(sql).get(...(a as never[])) as { n: number }).n)
/** Đi trọn một chặng một mình, làm đúng hết (thắng). */
async function diTronChang(d: D1That, sbd: string) {
  const ma = (await goi(d, sbd, 'mo')).doan.ma as string; troi(DEM_NGUOC_MS)
  let xem = await goi(d, sbd, 'xem', { ma })
  for (let vong = 0; !xem.doan.tran.ketThuc && vong < 80; vong++) {
    const t = xem.doan.tran
    if (t.moSauMs > 0 || (!t.laTrum && !xem.doan.cau)) troi(Math.max(t.moSauMs, 500)) // chờ hiệp mở
    else if (t.laTrum) troi(60_000 + 2000) // kho mẫu không có câu Phần II → trùm tự giải theo phong độ
    else { const i = Number(String(xem.doan.cau.qid).slice(1)); await goi(d, sbd, 'nop', { ma, hiep: t.hiep, answer: DAP(i), hanhDong: 'danh' }) }
    xem = await goi(d, sbd, 'xem', { ma })
  }
  return { ma, xem }
}
const ghiExp = (d: D1That, sbd: string, khoa: string, loai: string, exp: number, ngay = '2026-09-23') => d.sql.prepare('INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,qid,ma_nguon,exp,luc,ghi_chu) VALUES(?,?,?,?,NULL,?,?,?,?)').run(`${sbd}|${khoa}`, sbd, ngay, loai, khoa.split('|')[1] ?? null, exp, new Date(T0).toISOString(), 'x')

describe('Bước 5 · vé hộ tống', () => {
  it('chặng đầu ngày MIỄN PHÍ; chặng thứ hai khi hết vé bị từ chối bằng lời chỉ cách kiếm vé và KHÔNG mở chặng; đạt nhiệm vụ ngày → +2 vé → đi tiếp được, trừ đúng 1', async () => {
    const d = truong(); await bangChung(d, 'S1')
    expect((await goi(d, 'S1', 'sanh')).sanh).toMatchObject({ ve: 0, mienPhiHomNay: true, tenDoan: 'Đoàn Hộ Tống 12A', mua: { so: 1, conNgay: 26 } })
    const { xem } = await diTronChang(d, 'S1'); expect(xem.doan.ketChang.thang).toBe(true)
    expect((await goi(d, 'S1', 'sanh')).sanh).toMatchObject({ ve: 0, mienPhiHomNay: false })
    await expect(goi(d, 'S1', 'mo')).rejects.toThrow(LOI_HET_VE); expect(LOI_HET_VE).toMatch(/đạt nhiệm vụ ngày \+2 vé/); expect(dem(d, 'SELECT COUNT(*) n FROM doan_chang')).toBe(1)
    ghiExp(d, 'S1', 'dat|2026-09-23', 'dat_ngay', 20) // em làm xong nhiệm vụ ngày — sổ EXP của Code 3 ghi, game chỉ ĐỌC
    const sanh = (await goi(d, 'S1', 'sanh')).sanh
    expect(sanh.ve).toBe(2); expect(sanh.quaMoi).toEqual([{ loai: 'dat', ve: 2, ghiChu: 'Em đạt nhiệm vụ ngày' }])
    const ma2 = (await goi(d, 'S1', 'mo')).doan.ma; expect(await soVe(d.env, 'S1')).toBe(1)
    expect(d.sql.prepare("SELECT so,ma_nguon FROM doan_ve_so WHERE loai='tieu'").all()).toEqual([{ so: -1, ma_nguon: ma2 }])
  })
  it('nạp lại sổ HAI lần không cộng trùng: vé từ đạt ngày + lô đúng nhịp (lô trễ nhịp exp 4 KHÔNG có vé); hôm qua ghi bù vẫn nhận', async () => {
    const d = truong(); await bangChung(d, 'S1')
    ghiExp(d, 'S1', 'dat|2026-09-23', 'dat_ngay', 20); ghiExp(d, 'S1', 'lo|BT1|0', 'lo', 10); ghiExp(d, 'S1', 'lo|BT1|1', 'lo', 4); ghiExp(d, 'S1', 'lo|BT0|2', 'lo', 10, '2026-09-22')
    for (let i = 0; i < 3; i++) expect((await goi(d, 'S1', 'sanh')).sanh.ve).toBe(4)
    expect(d.sql.prepare("SELECT khoa,so FROM doan_ve_so ORDER BY khoa").all()).toEqual([{ khoa: 'S1|dat|2026-09-23', so: 2 }, { khoa: 'S1|lo|BT0|2', so: 1 }, { khoa: 'S1|lo|BT1|0', so: 1 }])
    expect((await goi(d, 'S1', 'sanh')).sanh.quaMoi).toEqual([]) // lần xem sau không báo lại quà cũ
  })
  it('cờ EXP mới TẮT cho em → không có vé nào (game không tự tính "đạt ngày"); vẫn được chặng miễn phí mỗi ngày', async () => {
    const d = truong(); await bangChung(d, 'S1'); d.sql.prepare("DELETE FROM cau_hinh WHERE khoa='exp_moi'").run()
    ghiExp(d, 'S1', 'dat|2026-09-23', 'dat_ngay', 20)
    expect((await goi(d, 'S1', 'sanh')).sanh).toMatchObject({ ve: 0, mienPhiHomNay: true })
    await diTronChang(d, 'S1'); await expect(goi(d, 'S1', 'mo')).rejects.toThrow('chưa có vé')
    datGio(vn('2026-09-24T07:00:00')); expect((await goi(d, 'S1', 'sanh')).sanh.mienPhiHomNay).toBe(true); expect((await goi(d, 'S1', 'mo')).doan.batDau).toBe(true)
  })
  it('sảnh bỏ dở không đốt chặng miễn phí; vào đoàn thứ hai khi đang ở đoàn khác bị từ chối; rời sảnh trước khi lên đường → HOÀN vé', async () => {
    const d = truong(); for (const s of ['S1', 'S2']) await bangChung(d, s)
    const maA = (await goi(d, 'S1', 'mo', { cheDo: 'phong' })).doan.ma
    expect((await goi(d, 'S1', 'sanh'))).toMatchObject({ dangDo: maA, sanh: { mienPhiHomNay: true } })
    const maB = (await goi(d, 'S2', 'mo', { cheDo: 'phong' })).doan.ma
    await expect(goi(d, 'S1', 'vao', { ma: maB })).rejects.toThrow('đang ở một đoàn khác')
    await goi(d, 'S1', 'roi', { ma: maA })
    // S1 đã đi một chặng hôm nay + có 1 vé → vào đoàn B tốn 1 vé; rời sảnh → vé quay lại
    await diTronChang(d, 'S1'); ghiExp(d, 'S1', 'lo|BT1|0', 'lo', 10); await goi(d, 'S1', 'sanh')
    await goi(d, 'S1', 'vao', { ma: maB }); expect(await soVe(d.env, 'S1')).toBe(0)
    await goi(d, 'S1', 'roi', { ma: maB }); expect(await soVe(d.env, 'S1')).toBe(1)
  })
  it('chưa chạy migration bước 5 (thiếu bảng vé): game vẫn chơi được một chặng miễn phí mỗi ngày, Sảnh trả sanh:null, không lỗi thô', async () => {
    const d = truong(); await bangChung(d, 'S1'); d.sql.exec('DROP TABLE doan_ve_so'); d.sql.exec('DROP TABLE doan_trum_lop')
    expect(await goi(d, 'S1', 'sanh')).toMatchObject({ ok: true, sanh: null })
    const { xem } = await diTronChang(d, 'S1'); expect(xem.doan.ketChang.thang).toBe(true); expect(xem.doan.ketChang.doanLop).toMatchObject({ tramSau: 0, trumLop: null }) // trạm lớp đọc từ sổ lượt của bước 2 nên vẫn có
    await expect(goi(d, 'S1', 'mo')).rejects.toThrow('chưa có vé')
  })
})

describe('Bước 5 · Đoàn lớp, rương chuỗi, Trùm lớp', () => {
  it('chặng THẮNG đẩy Linh Tâm của lớp: lớp 3 em cần 2 chặng thắng mỗi trạm; kết chặng báo trạm trước → sau và em là bạn thứ mấy; bạn máy không bao giờ được tính', async () => {
    const d = truong(3); for (const s of ['S1', 'S2']) await bangChung(d, s)
    const a = (await diTronChang(d, 'S1')).xem.doan.ketChang.doanLop
    expect(a).toMatchObject({ tramTruoc: 0, tramSau: 0, tongTram: 30, banThu: 1, siSo: 3, conTramToiMoc: 10, tenMocKe: 'Rừng Xúc Tác' })
    troi(60_000); const b = (await diTronChang(d, 'S2')).xem.doan.ketChang.doanLop
    expect(b).toMatchObject({ tramTruoc: 0, tramSau: 1, banThu: 2 })
    expect((await goi(d, 'S1', 'sanh')).sanh.doanLop).toMatchObject({ lop: '12A', tram: 1, changThang: 2, changMoiTram: 2, conChangToiTramKe: 2, gopSucHomNay: 2, siSo: 3, mocKe: 10 })
    expect(dem(d, "SELECT COUNT(*) n FROM doan_luot WHERE sbd LIKE 'may%'")).toBe(0)
  })
  it('chặng THUA không đẩy trạm; chặng ngoài mùa (trước ngày bắt đầu mùa) không tính', async () => {
    const d = truong(3); await bangChung(d, 'S1')
    d.sql.prepare("INSERT INTO doan_luot(ma_chang,sbd,ngay_vn,lop,ghe,thang,vao_luc,ket_luc) VALUES('CU1','S2','2026-09-20','12A',0,1,'x','x'),('CU2','S3','2026-09-20','12A',0,1,'x','x'),('TH1','S2','2026-09-22','12A',0,0,'x','x'),('TH2','S3','2026-09-22','12A',0,0,'x','x')").run()
    expect((await goi(d, 'S1', 'sanh')).sanh.doanLop).toMatchObject({ tram: 0, changThang: 0 })
  })
  it('rương chuỗi mở ĐÚNG ngày thứ 3 (tất định), xem lại không mở lần hai; cả lớp tới mốc trạm 10 → em ĐÃ GÓP SỨC nhận 1 vé, em chưa góp thì không', async () => {
    const d = truong(3); for (const s of ['S1', 'S2']) await bangChung(d, s)
    d.sql.prepare("INSERT INTO doan_luot(ma_chang,sbd,ngay_vn,lop,ghe,thang,vao_luc,ket_luc) VALUES('N1','S1','2026-09-21','12A',0,1,'x','x'),('N2','S1','2026-09-22','12A',0,0,'x','x')").run()
    expect((await goi(d, 'S1', 'sanh')).sanh.chuoi).toEqual({ ngay: 2, daDiHomNay: false, mocKe: 3, conNgay: 1 })
    await diTronChang(d, 'S1')
    const s = (await goi(d, 'S1', 'sanh')).sanh, mong = quaRuong('S1', '2026-09-23', '2026-09-21-mua-1|m1|2026-09-21', 3)
    expect(s.chuoi).toEqual({ ngay: 3, daDiHomNay: true, mocKe: 7, conNgay: 4 }); expect(s.quaMoi).toEqual([{ loai: 'ruong', ve: mong.ve, ghiChu: 'Rương chuỗi 3 ngày' }]); expect(s.ve).toBe(mong.ve)
    await goi(d, 'S1', 'sanh'); expect(dem(d, "SELECT COUNT(*) n FROM doan_ve_so WHERE loai='ruong'")).toBe(1)
    // đẩy lớp tới trạm 10: cần 20 chặng thắng (đã có 2 của S1: N1 + hôm nay)
    const ins = d.sql.prepare("INSERT INTO doan_luot(ma_chang,sbd,ngay_vn,lop,ghe,thang,vao_luc,ket_luc) VALUES(?,'S3','2026-09-22','12A',0,1,'x','x')"); for (let i = 0; i < 18; i++) ins.run(`M${i}`)
    const s1 = (await goi(d, 'S1', 'sanh')).sanh; expect(s1.doanLop).toMatchObject({ tram: 10, mocKe: 20, tenMocKe: 'Hồ Cân Bằng' }); expect(s1.quaMoi).toEqual([{ loai: 'moc', ve: 1, ghiChu: 'Cả lớp tới Rừng Xúc Tác' }])
    expect((await goi(d, 'S2', 'sanh')).sanh.quaMoi).toEqual([]) // S2 chưa thắng chặng nào trong mùa
    await goi(d, 'S1', 'sanh'); expect(dem(d, "SELECT COUNT(*) n FROM doan_ve_so WHERE loai='moc'")).toBe(1)
  })
  it('Trùm lớp (bản gọn): chặng THẮNG kết thúc trong khung Chủ nhật 20:00–20:20 góp sát thương của em; ngoài khung không góp; lớp đạt mục tiêu → em đã góp nhận 1 vé', async () => {
    const d = truong(3); await bangChung(d, 'S1')
    expect((await goi(d, 'S1', 'sanh')).sanh.trumLop).toMatchObject({ dangMo: false, chuNhat: '2026-09-27', daGop: 0, mucTieu: 300, daHa: false })
    expect((await diTronChang(d, 'S1')).xem.doan.ketChang.doanLop.trumLop).toBeNull(); expect(dem(d, 'SELECT COUNT(*) n FROM doan_trum_lop')).toBe(0)
    datGio(vn('2026-09-27T20:01:00')); await bangChung(d, 'S2')
    const k = (await diTronChang(d, 'S2')).xem.doan.ketChang
    expect(k.doanLop.trumLop).toBe(k.cuaEm.satThuong); expect(k.cuaEm.satThuong).toBe(144)
    await goi(d, 'S2', 'xem', { ma: String((d.sql.prepare('SELECT khoa FROM doan_trum_lop').get() as any).khoa).split('|')[0] }); expect(dem(d, 'SELECT COUNT(*) n FROM doan_trum_lop')).toBe(1) // xem lại không góp lần hai
    d.sql.prepare("INSERT INTO doan_trum_lop(khoa,lop,chu_nhat,sbd,sat_thuong,luc) VALUES('X|S3','12A','2026-09-27','S3',160,'x')").run()
    const s2 = (await goi(d, 'S2', 'sanh')).sanh; expect(s2.trumLop).toMatchObject({ dangMo: true, daGop: 304, daHa: true }); expect(s2.quaMoi).toContainEqual({ loai: 'trum', ve: 1, ghiChu: 'Lớp em đã hạ Trùm lớp' })
    expect((await goi(d, 'S1', 'sanh')).sanh.quaMoi.some((q: any) => q.loai === 'trum')).toBe(false) // S1 không góp tối nay
    datGio(vn('2026-09-28T08:00:00')); expect((await goi(d, 'S2', 'sanh')).sanh.trumLop).toMatchObject({ dangMo: false, chuNhat: '2026-10-04', daGop: 304, daHa: true }) // sáng thứ Hai vẫn thấy kết quả tối qua
  })
  it('docSanh không ném lỗi khi em không có lớp → Đoàn "Tự do"', async () => {
    const d = truong(1); d.sql.prepare("UPDATE hoc_sinh SET lop=NULL").run()
    expect(await docSanh(d.env, 'S1', T0)).toMatchObject({ lop: '', tenDoan: 'Đoàn Hộ Tống Tự do', doanLop: { siSo: 1 } })
  })
})

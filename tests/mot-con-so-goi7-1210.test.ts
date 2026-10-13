// @vitest-environment node
// MỘT CON SỐ — thầy 12/10 (nguyên văn): "Xem xét lại kĩ lưỡng việc giao câu của code, ví dụ trong ảnh học sinh làm 24 câu nhưng lại báo 31 câu làm …
// check lại kĩ số câu lười chăm từng ngày" · "trên app học sinh báo 24 câu nhưng đo theo ngày hôm nay lại hiện 0/36 câu" · "hiển thị thật chính xác".
// TEST ĐỐI CHIẾU trên D1 THẬT (node:sqlite, lược đồ repo — tests/_d1-that.ts; kho giả tests/omni-3-ke-hoach-chung.ts). Mỗi ca chứng minh MỨC HÔM NAY M,
// ĐÃ LÀM, CÒN THIẾU, ĐỦ MỨC giống hệt nhau ở: sảnh học sinh (`hoc-tap-sanh` thật) = thầy (`ngayBaiCuaMotEm`, `/gv/bai-hang-ngay`, `/gv/ho-so-thai-do`,
// `/gv/nhip-hoc`) = `/hs/nhip-hoc` = `/ph/con-tong-quan`.
//   Ca 1 · Hành trình (mức đã chốt `hanh_trinh_v3_ngay`).
//   Ca 2 · Gói 7, lịch câu mới 3 < mức tầng 24 ⇒ M = 24.
//   Ca 3 · Gói 7, lịch câu mới 32 > mức tầng 24 ⇒ M = 32 (ảnh thầy: "2 trên 24 câu" + "31 câu tự làm" + "lịch tối thiểu 32 câu").
// Thêm: `chonGoi7` có trần ⇒ đúng M − đã làm câu · hai phép đếm "đã làm" (máy em / máy thầy) cho cùng số · ngày cũ chưa chốt ⇒ `uoc-goi7` ·
// luật Lười dùng M mới (24/24 thành đủ mức, không còn 24/36 "thiếu 12"). Tên em là tên giả.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich, lam, lucVn, type KhoOmni } from './omni-3-ke-hoach-chung'
import { taoD1That } from './_d1-that'
import { dongBoGoi7, lapGoi7 } from '../server/src/goi-bai-7'
import { chonGoi7, mucNgayGoi7, type CauGoi7 } from '../server/src/goi-bai-7-loi'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { layKeHoachHomNay, qidGoc, sanh2, xoaDemChienDich } from '../server/src/srs2-d1'
import { dongBoBaHanhTrinh } from '../server/src/hanh-trinh-hop-nhat'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { gvBaiHangNgay, gvHoSoThaiDo, ngayBaiCuaMotEm, ngayVnCua } from '../server/src/bai-hang-ngay'
import { gvNhipHoc } from '../server/src/nhip-hoc'
import { hsNhipHoc } from '../server/src/nhip-hoc-em'
import { phConTongQuan } from '../server/src/ph-con-tong-quan'
import { CAU_TOI_THIEU } from '../server/src/hanh-trinh-ngay'
import type { KetQuaBaiHangNgay, KetQuaHoSoThaiDo, NgayBaiEm } from '../server/src/bai-hang-ngay-kieu'
import type { KetQuaNhipHoc, KetQuaNhipHocEm } from '../server/src/nhip-hoc-kieu'
import type { KetQuaConTongQuan } from '../server/src/ph-con-tong-quan-kieu'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-12T02:00:00Z') // 09:00 Thứ Hai 12/10 giờ VN
const HOM_NAY = '2026-10-12'
const PHUT = 60_000
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe() })

/** Một ngày (hôm nay) nhìn từ MỘT phía: mức · đã làm · còn thiếu · đủ mức. */
interface Mot { muc: number; daLam: number; con: number; du: boolean }
const tuNgay = (n: Pick<NgayBaiEm, 'mucToiThieu' | 'daLam' | 'thieu' | 'datMuc'>): Mot => ({ muc: n.mucToiThieu, daLam: n.daLam, con: n.thieu, du: n.datMuc })

/** Đọc HÔM NAY của em ở mọi phía của thầy / em (Nhịp học) / phụ huynh — mỗi phía một bản `Mot`. */
async function phiaKhac(env: Env, sbd: string, token: string, now = NOW): Promise<Record<string, Mot> & { _ngay: NgayBaiEm }> {
  const chung = await ngayBaiCuaMotEm(env, sbd, '2026-10-01', ngayVnCua(now), ngayVnCua(now))
  expect(chung, 'ngayBaiCuaMotEm không được null (đọc thiếu bảng)').not.toBeNull()
  const nay = chung!.find((n) => n.homNay)!
  const bang = (await gvBaiHangNgay(env, {}, now)) as KetQuaBaiHangNgay
  expect(bang.ok).toBe(true)
  const nayBang = bang.em.find((e) => e.sbd === sbd)!.ngay.find((n) => n.homNay)!
  const hs = (await gvHoSoThaiDo(env, { sbd }, now)) as KetQuaHoSoThaiDo
  expect(hs.ok).toBe(true)
  const nayHs = hs.ngay.find((n) => n.homNay)!
  const nhip = (await gvNhipHoc(env, {}, now)) as KetQuaNhipHoc
  expect(nhip.ok).toBe(true)
  const eNhip = nhip.em.find((e) => e.sbd === sbd)!
  const iNay = nhip.ngay.indexOf(ngayVnCua(now))
  const em = (await hsNhipHoc(env, { token }, now)) as KetQuaNhipHocEm
  expect(em.ok).toBe(true)
  const ph = (await phConTongQuan(env, { sbd }, now)) as KetQuaConTongQuan
  expect(ph.ok).toBe(true)
  const nayPh = ph.ngay.find((n) => n.homNay)!
  const muc = (m: number, l: number): Mot => ({ muc: m, daLam: l, con: Math.max(0, m - l), du: l >= m })
  return {
    _ngay: nay,
    'thầy · ngayBaiCuaMotEm': tuNgay(nay),
    'thầy · /gv/bai-hang-ngay': tuNgay(nayBang),
    'thầy · /gv/ho-so-thai-do': tuNgay(nayHs),
    'thầy · /gv/nhip-hoc': muc(eNhip.muc[iNay]!, eNhip.lam[iNay]!),
    'em · /hs/nhip-hoc': muc(em.homNayMuc!.muc, em.homNayMuc!.lam),
    'phụ huynh · /ph/con-tong-quan': { ...muc(nayPh.muc, nayPh.daLam), du: nayPh.trangThai === 'du' },
  }
}
/** Mọi phía phải bằng `mong`; tên phía hiện trong thông báo lỗi. */
function cungMotSo(phia: Record<string, Mot>, mong: Mot) {
  for (const [ten, v] of Object.entries(phia)) if (!ten.startsWith('_')) expect(v, ten).toEqual(mong)
}

// ------------------------------------------------------------------ GÓI 7
/**
 * Lớp thật: S1–S3 khối 12 chưa gán tên lớp ⇒ "12 - Lớp Thường" (đúng lỗi tên lớp 12/10 — bảng thầy trước đây so `hoc_sinh.lop` = khối nên KHÔNG thấy em
 * ở Gói 7). Bài 7 Ester tick 01/10 (bài cũ ⇒ câu ôn bài cũ), Bài 8 Amine tick 11/10 18:00 ⇒ gói 11/10 → 17/10 (6 ngày còn tính từ 12/10).
 */
async function khoGoi7(soCauGoi: number): Promise<KhoOmni & { token: string }> {
  const k = taoKhoOmni({ 'DH-B7': 40, 'DH-B8': soCauGoi }, 3)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q) // bảng chốt Hành trình có sẵn như D1 thật (thầy đọc cả hai chế độ)
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',${soCauGoi},0,'v1'),('DH-B7','Bài 7. Ester',40,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x'),('DH-B7','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  const tick = k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
  tick.run('ester', '12 - Lớp Thường', 'B7', 'Bài 7. Ester', 7, '["DH-B7"]', '2026-10-01T02:00:00Z')
  tick.run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8-TN","DH-B8-DS","DH-B8-TLN"]', '2026-10-11T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1', 'S2', 'S3'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return { ...k, token: await gameToken(k.env, 'S1') }
}
interface SanhGoi7 { goi7: { toiThieu: number; daLamHomNay: number; tuLamCon: number; tiepCanCon: number; thieuNgay: number; goi: { quota: number; gapHomNay: number }[] }; theLuc: { con: number } }
const sanh = async (env: Env, token: string, now: number) => { vi.setSystemTime(now); return (await gameV2(env, 'hoc-tap-sanh', { token })) as unknown as SanhGoi7 }
/** Phía học sinh — ĐÚNG phép của màn Hôm nay (HocTapHomNay): vòng "daLam trên M", "còn M − daLam", đạt khi daLam ≥ M. */
const phiaEm = (s: SanhGoi7): Mot => ({ muc: s.goi7.toiThieu, daLam: s.goi7.daLamHomNay, con: Math.max(0, s.goi7.toiThieu - s.goi7.daLamHomNay), du: s.goi7.daLamHomNay >= s.goi7.toiThieu })
/** Tổng việc tiêu đề (tự làm + có hỗ trợ + chờ bổ sung) = M − đã làm — không số nào mâu thuẫn vòng tròn. */
const tongTieuDe = (s: SanhGoi7) => s.goi7.tuLamCon + s.goi7.tiepCanCon + s.goi7.thieuNgay
const mucChot = (k: KhoOmni, sbd = 'S1', ngay = HOM_NAY) => k.d.sql.prepare('SELECT tang,toi_thieu_tang,quota,muc FROM goi_bai_7_muc_ngay WHERE sbd=? AND ngay=?').get(sbd, ngay)

describe('Ca 3 · Gói 7, lịch câu mới 32 > mức tầng 24 (ảnh thầy 12/10)', () => {
  it('M = 32 chốt lần mở đầu; em · thầy · Nhịp học · phụ huynh cùng "đã làm / 32"; kế hoạch đúng 32 − đã làm câu; đủ mức khi làm đủ 32', async () => {
    const k = await khoGoi7(192) // 192 câu chưa gặp / 6 ngày còn ⇒ lịch 32 câu mới hôm nay
    // Trước khi em mở bài: chưa có dòng chốt ⇒ thầy thấy mức ƯỚC TÍNH (có cờ), không bịa tầng Hành trình.
    const truoc = await ngayBaiCuaMotEm(k.env, 'S1', '2026-10-11', HOM_NAY, HOM_NAY)
    expect(truoc!.find((n) => n.homNay)).toMatchObject({ cheDo: 'goi7', nguonMuc: 'uoc-goi7', mucUocTinh: true, mucToiThieu: 24 })

    const s0 = await sanh(k.env, k.token, NOW)
    expect(s0.goi7.goi[0]).toMatchObject({ quota: 32, gapHomNay: 0 })
    expect(phiaEm(s0)).toEqual({ muc: 32, daLam: 0, con: 32, du: false })
    expect(mucChot(k)).toEqual({ tang: 1, toi_thieu_tang: CAU_TOI_THIEU[1], quota: 32, muc: 32 })
    expect(s0.theLuc.con).toBe(32)
    expect(tongTieuDe(s0)).toBe(32)

    // Em làm 2 câu ôn bài cũ (ngoài gói) — ảnh thầy: "2 trên …". Trước 12/10 máy xếp ĐỦ 32 câu mới (vượt phần còn lại 30 của mức) ⇒ "31 câu tự làm".
    const cu = k.qids('DH-B7')
    await lam(k.env, 'S1', cu[0]!, NOW + PHUT, true)
    await lam(k.env, 'S1', cu[1]!, NOW + 2 * PHUT, false)
    const s1 = await sanh(k.env, k.token, NOW + 3 * PHUT)
    expect(phiaEm(s1)).toEqual({ muc: 32, daLam: 2, con: 30, du: false })
    expect(s1.theLuc.con).toBe(30) // = M − đã làm (không còn 32)
    expect(tongTieuDe(s1)).toBe(30)
    cungMotSo(await phiaKhac(k.env, 'S1', k.token, NOW + 3 * PHUT), phiaEm(s1))

    // Làm thêm 10 câu mới của gói + 1 câu học có hướng dẫn (chưa có trong sổ) + 1 câu hướng dẫn TRÙNG câu đã làm (không cộng hai lần).
    const lap = await lapGoi7(k.env, 'S1', NOW + 4 * PHUT)
    const moi = lap!.plan.viec.map((v) => v.qid)
    for (const [i, q] of moi.slice(0, 10).entries()) await lam(k.env, 'S1', q, NOW + (5 + i) * PHUT, i % 3 !== 0, { cauVersion: 'v1' })
    const gap = k.d.sql.prepare('INSERT INTO goi_bai_7_gap(receipt,goi_id,sbd,qid,version,kieu,luc) VALUES(?,?,?,?,?,?,?)')
    gap.run('r-a', 'g7:amine', 'S1', moi[10]!, 'v1', 'co_ho_tro', new Date(NOW + 20 * PHUT).toISOString())
    gap.run('r-b', 'g7:amine', 'S1', moi[0]!, 'v1', 'co_ho_tro', new Date(NOW + 21 * PHUT).toISOString())
    const s2 = await sanh(k.env, k.token, NOW + 22 * PHUT)
    expect(phiaEm(s2)).toEqual({ muc: 32, daLam: 13, con: 19, du: false })
    expect(s2.theLuc.con).toBe(19)
    const p2 = await phiaKhac(k.env, 'S1', k.token, NOW + 22 * PHUT)
    cungMotSo(p2, phiaEm(s2))
    expect(p2._ngay).toMatchObject({ nguonMuc: 'da-chot', mucUocTinh: false, tang: 1, cheDo: 'goi7' })

    // Làm hết phần còn lại ⇒ đủ mức ở MỌI phía; kế hoạch về 0 (không giao thêm vượt mức).
    const conLai = (await lapGoi7(k.env, 'S1', NOW + 23 * PHUT))!.plan.viec
    expect(conLai).toHaveLength(19)
    for (const [i, v] of conLai.entries()) await lam(k.env, 'S1', qidGoc(v.qid), NOW + (24 + i) * PHUT, true, { cauVersion: 'v1' })
    const s3 = await sanh(k.env, k.token, NOW + 50 * PHUT)
    expect(phiaEm(s3)).toEqual({ muc: 32, daLam: 32, con: 0, du: true })
    expect(s3.theLuc.con).toBe(0)
    cungMotSo(await phiaKhac(k.env, 'S1', k.token, NOW + 50 * PHUT), phiaEm(s3))
  })
})

describe('Ca 2 · Gói 7, lịch câu mới 3 < mức tầng', () => {
  /** Hôm qua (11/10, 20:00) em mở bài và gặp 22/40 câu ⇒ hôm nay còn 18 câu chưa gặp / 6 ngày ⇒ lịch 3 câu mới; 22 câu đã gặp thành câu ôn / sửa. */
  async function homQua22() {
    const k = await khoGoi7(40)
    const HQ = Date.parse('2026-10-11T13:00:00Z')
    const s = await sanh(k.env, k.token, HQ)
    expect(s.goi7.toiThieu).toBe(24)
    const viec = (await lapGoi7(k.env, 'S1', HQ + PHUT))!.plan.viec
    for (const [i, v] of viec.slice(0, 22).entries()) await lam(k.env, 'S1', qidGoc(v.qid), HQ + (2 + i) * PHUT, i % 4 !== 1, { cauVersion: 'v1' })
    return k
  }
  it('M = mức tầng (lịch 3 nhỏ hơn); kế hoạch = M − đã làm câu, 3 câu mới theo lịch đứng đầu; mọi phía cùng số — hôm nay và hôm qua (22/24 thiếu 2)', async () => {
    const k = await homQua22()
    const s0 = await sanh(k.env, k.token, NOW)
    expect(s0.goi7.goi[0]).toMatchObject({ quota: 3, gapHomNay: 0 })
    const chot = mucChot(k) as { tang: 1 | 2 | 3 | 4; quota: number; muc: number }
    expect(chot.quota).toBe(3)
    expect(chot.muc).toBe(CAU_TOI_THIEU[chot.tang]) // lịch 3 < mức tầng ⇒ M là mức tầng
    const M = chot.muc
    expect(phiaEm(s0)).toEqual({ muc: M, daLam: 0, con: M, du: false })
    expect(s0.theLuc.con).toBe(M)
    expect(tongTieuDe(s0)).toBe(M)
    const lap = await lapGoi7(k.env, 'S1', NOW + PHUT)
    const moiGoi = new Set(k.qids('DH-B8'))
    expect(lap!.plan.viec.slice(0, 3).every((v) => moiGoi.has(v.qid) && (v.vai === 'moi' || v.vai === 'tiep_can'))).toBe(true)
    for (const [i, v] of lap!.plan.viec.slice(0, 7).entries()) await lam(k.env, 'S1', qidGoc(v.qid), NOW + (2 + i) * PHUT, true, { cauVersion: 'v1' })
    const s1 = await sanh(k.env, k.token, NOW + 10 * PHUT)
    expect(phiaEm(s1)).toEqual({ muc: M, daLam: 7, con: M - 7, du: false })
    expect(s1.theLuc.con).toBe(M - 7)
    expect(tongTieuDe(s1)).toBe(M - 7)
    cungMotSo(await phiaKhac(k.env, 'S1', k.token, NOW + 10 * PHUT), phiaEm(s1))
    // hôm qua: dòng chốt 24 (lịch 6 < 24), làm 22 ⇒ thiếu 2 ở mọi bảng thầy
    const hq = (await ngayBaiCuaMotEm(k.env, 'S1', '2026-10-11', '2026-10-11', HOM_NAY))![0]!
    expect([hq.mucToiThieu, hq.daLam, hq.thieu, hq.datMuc, hq.nguonMuc]).toEqual([24, 22, 2, false, 'da-chot'])
  })

  it('mức đã chốt KHÔNG nhảy trong ngày (lịch gói đổi giữa ngày vẫn đọc lại số chốt); ngày mới chốt lại', async () => {
    const k = await khoGoi7(18)
    const s0 = await sanh(k.env, k.token, NOW)
    expect(s0.goi7.toiThieu).toBe(24)
    k.d.sql.prepare("UPDATE goi_bai_7_ngay SET quota=40 WHERE sbd='S1' AND ngay=?").run(HOM_NAY) // lịch đổi giữa ngày
    const s = await sanh(k.env, k.token, NOW + 5 * PHUT)
    expect(s.goi7.goi[0]!.quota).toBe(40)
    expect(s.goi7.toiThieu).toBe(24) // số đã chốt
    expect((await ngayBaiCuaMotEm(k.env, 'S1', HOM_NAY, HOM_NAY, HOM_NAY))![0]).toMatchObject({ mucToiThieu: 24, nguonMuc: 'da-chot' })
    await sanh(k.env, k.token, NOW + 86_400_000)
    expect(mucChot(k, 'S1', '2026-10-13')).toMatchObject({ quota: 4, muc: 24 }) // 18 câu chưa gặp / 5 ngày
  })
})

// ------------------------------------------------------------------ HÀNH TRÌNH
describe('Ca 1 · Hành trình: vòng tròn em (bangHanhTrinh / tienDoHanhTrinh) = daLamKeHoach phía thầy', () => {
  it('mức đã chốt + đã làm câu kế hoạch giống nhau ở em · thầy · Nhịp học · phụ huynh (kể cả câu em tự làm ngoài kế hoạch mà lần chọn lại sau chặng gộp vào)', async () => {
    const T = Date.parse('2026-10-05T02:00:00Z'), NGAY = '2026-10-05'
    vi.setSystemTime(T)
    const k = taoKhoOmni({ 'DH-B0': 0, 'DH-B1': 60, 'DH-B2': 0, 'DH-B3': 12, 'KHO-A': 0 })
    for (const r of k.d.sql.prepare('SELECT qid,json FROM game_v2_question').all() as { qid: string; json: string }[])
      k.d.sql.prepare('UPDATE game_v2_question SET json=? WHERE qid=?').run(JSON.stringify({ ...JSON.parse(r.json), mucDo: 'NB' }), r.qid)
    k.d.sql.exec("UPDATE hoc_sinh SET mat_khau='mk'")
    themChienDich(k.d, { id: 'nguon', maDe: ['DH-B1'], qids: k.qids('DH-B1'), sbd: ['S1', 'S2'], taoLuc: '2026-10-01T02:00:00Z', hanNop: '2026-10-09' })
    k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)').run('T-B1', '12A1', 'B1', 'Bài 1. Este', 1, '["DH-B1"]', '2026-10-01T00:00:00.000Z')
    await dongBoBaHanhTrinh(k.env, T)
    const token = await gameToken(k.env, 'S1')
    const { kh } = await layKeHoachHomNay(k.env, 'S1', T)
    expect(kh.hanhTrinh).toMatchObject({ toiThieu: 24 })
    const khoa = [...kh.conDoan, ...kh.conDao]
    for (const [i, q] of khoa.slice(0, 9).entries()) await lam(k.env, 'S1', qidGoc(q), T + (i + 1) * PHUT, i !== 4)
    await lam(k.env, 'S1', k.qids('DH-B3')[0]!, T + 20 * PHUT, true) // ngoài kế hoạch lúc làm
    const s = (await sanh2(k.env, 'S1', T + 30 * PHUT)) as { hanhTrinh: { toiThieu: number; daLam: number } }
    const em: Mot = { muc: s.hanhTrinh.toiThieu, daLam: s.hanhTrinh.daLam, con: Math.max(0, s.hanhTrinh.toiThieu - s.hanhTrinh.daLam), du: s.hanhTrinh.daLam >= s.hanhTrinh.toiThieu }
    expect(em.muc).toBe(24)
    expect(em.daLam).toBeGreaterThanOrEqual(9)
    expect(em.du).toBe(false)
    const p = await phiaKhac(k.env, 'S1', token, T + 30 * PHUT)
    cungMotSo(p, em)
    expect(p._ngay).toMatchObject({ ngay: NGAY, cheDo: 'hanh-trinh', nguonMuc: 'da-chot', mucUocTinh: false })
  })
})

// ------------------------------------------------------------------ PHÉP THUẦN
describe('chonGoi7 có trần (chiTrongMuc) — đúng M − đã làm câu khi đủ câu', () => {
  const cau = Array.from({ length: 60 }, (_, i) => ({ qid: `q${String(i).padStart(2, '0')}`, group: `g${i}`, maDe: 'x', version: 'v1', phan: 'I', kho: false, tinhToan: false, kyNang: ['a'] }) as CauGoi7)
  const co = { cau, daGap: new Set<string>(), daLamNgay: new Set(['cu1', 'cu2']), quotaCon: 0, sanSang: new Set([...cau.map((c) => c.qid), 'o1', 'o2']), chan: new Set<string>(), sua: [], on: ['o1', 'o2'], nhomPhu: [{ qids: cau.map((c) => c.qid), quota: 32 }] }
  it('lịch 32 > phần còn lại 30 ⇒ 30 việc (câu mới theo lịch đứng đầu); không truyền trần ⇒ hành vi cũ (32)', () => {
    const p = chonGoi7({ ...co, mucTieuNgay: 30, chiTrongMuc: true })
    expect(p.viec).toHaveLength(30)
    expect(p.viec.every((v) => v.vai === 'moi')).toBe(true)
    expect(chonGoi7({ ...co, mucTieuNgay: 30 }).viec).toHaveLength(32) // không đổi hành vi khi không truyền
  })
  it('lịch 3 < phần còn lại 22 ⇒ 22 việc: 3 câu mới theo lịch đứng đầu rồi ôn + câu mới bù', () => {
    const p = chonGoi7({ ...co, nhomPhu: [{ qids: cau.map((c) => c.qid), quota: 3 }], mucTieuNgay: 22, chiTrongMuc: true })
    expect(p.viec).toHaveLength(22)
    expect(p.viec.slice(0, 3).map((v) => v.qid)).toEqual(['q00', 'q01', 'q02'])
    expect(p.viec.filter((v) => v.vai === 'on').map((v) => v.qid)).toEqual(['o1', 'o2'])
  })
  it('đã đủ mức ⇒ 0 việc; mucNgayGoi7 = max(mức tầng, Σ lịch)', () => {
    expect(chonGoi7({ ...co, mucTieuNgay: 0, chiTrongMuc: true }).viec).toEqual([])
    expect([mucNgayGoi7(24, 3), mucNgayGoi7(24, 32), mucNgayGoi7(36, 32), mucNgayGoi7(24, -5)]).toEqual([24, 32, 36, 24])
  })
})

// ------------------------------------------------------------------ ĐÃ LÀM: hai phép đếm, cùng số
describe('đã làm hôm nay: phép của máy em (lapGoi7.daLamNgay) = phép của thầy (SQL_DEM_GOI7 + SQL_DEM_GAP) trên cùng dữ liệu', () => {
  it('lượt trùng · chưa có kết quả · đọc lời giải · còn giấu · ca chưa công bố · ca đã công bố · ca đã xoá · học có hướng dẫn (mới / trùng sổ) · hôm qua', async () => {
    const k = await khoGoi7(60)
    await sanh(k.env, k.token, NOW)
    const q = k.qids('DH-B8'), cu = k.qids('DH-B7')
    k.d.sql.exec(`INSERT INTO ca (ma_ca, ten_ca, trang_thai, cong_bo, cap_nhat_luc) VALUES ('C-CHUA', 'Ca chưa công bố', 'dong', 'khong', 'x'), ('C-DA', 'Ca đã công bố', 'dong', 'ngay', 'x'), ('C-XOA', 'Ca đã xoá', 'da_xoa', 'ngay', 'x')`)
    const t = (p: number) => NOW + p * PHUT
    await lam(k.env, 'S1', q[0]!, t(1), true, { cauVersion: 'v1' })
    await lam(k.env, 'S1', q[0]!, t(2), false, { cauVersion: 'v1' }) // cùng câu ⇒ một
    await lam(k.env, 'S1', q[1]!, t(3), null, { cauVersion: 'v1' }) // chưa có kết quả ⇒ không tính
    await lam(k.env, 'S1', q[2]!, t(4), true, { cauVersion: 'v1', purpose: 'xem_loi_giai' }) // đọc lời giải ⇒ không tính
    await lam(k.env, 'S1', q[3]!, t(5), true, { cauVersion: 'v1', visibility: 'embargoed' }) // còn giấu ⇒ không tính
    await lam(k.env, 'S1', cu[0]!, t(6), true, { nguon: 'thi', maNguon: 'C-CHUA' }) // ca chưa công bố ⇒ không tính
    await lam(k.env, 'S1', cu[1]!, t(7), false, { nguon: 'thi', maNguon: 'C-DA' }) // ca đã công bố ⇒ tính
    await lam(k.env, 'S1', cu[2]!, t(8), true, { nguon: 'thi', maNguon: 'C-XOA' }) // ca đã xoá ⇒ không tính
    await lam(k.env, 'S1', cu[3]!, t(9), true) // ôn bài cũ ⇒ tính
    await lam(k.env, 'S1', q[5]!, NOW - 86_400_000, true, { cauVersion: 'v1' }) // hôm qua ⇒ không tính hôm nay
    const gap = k.d.sql.prepare('INSERT INTO goi_bai_7_gap(receipt,goi_id,sbd,qid,version,kieu,luc) VALUES(?,?,?,?,?,?,?)')
    gap.run('g1', 'g7:amine', 'S1', q[6]!, 'v1', 'co_ho_tro', new Date(t(10)).toISOString()) // hướng dẫn, sổ chưa có ⇒ +1
    gap.run('g2', 'g7:amine', 'S1', q[0]!, 'v1', 'co_ho_tro', new Date(t(11)).toISOString()) // trùng câu đã có trong sổ ⇒ không cộng
    gap.run('g3', 'g7:amine', 'S1', q[7]!, 'v1', 'cho_thay', new Date(t(12)).toISOString()) // chờ thầy chữa ⇒ đã gặp, +1
    const lap = await lapGoi7(k.env, 'S1', t(13))
    expect(lap!.daLamNgay).toBe(5) // q0 · cu1 · cu3 · q6 · q7
    const thay = (await ngayBaiCuaMotEm(k.env, 'S1', HOM_NAY, HOM_NAY, HOM_NAY))![0]!
    expect(thay.daLam).toBe(lap!.daLamNgay)
    expect(thay.mucToiThieu).toBe(lap!.toiThieu)
  })
})

// ------------------------------------------------------------------ NGÀY CŨ + LUẬT LƯỜI
const luc = (ngay: string, gioVn = 9, phut = 0) => new Date(Date.parse(`${ngay}T00:00:00+07:00`) + (gioVn * 60 + phut) * 60_000).toISOString()
/** Em L (12 - Tinh Hoa): Hành trình tới 05/10 (tầng 3 Vận dụng, mức 36), Gói 7 từ 06/10, mỗi ngày 06–11/10 làm 24 câu khác nhau, lịch câu mới 19/ngày. */
function khoLuoi() {
  const d = taoD1That()
  for (const q of [...SQL_BANG_HANH_TRINH, ...SQL_GOI7]) d.sql.exec(q)
  d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run('L', 'Ngô Giả Lập', '2009', '12', 'x')
  d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, mat_khau, tao_luc, cap_nhat_luc) VALUES (?,?,?,?,?,?,?)').run('L', 'Ngô Giả Lập', '12', '12 - Tinh Hoa', 'mk', '2026-10-06T01:00:00Z', 'x')
  d.sql.prepare("INSERT INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, tao_luc, trang_thai) VALUES (?,?,?,?,?,?,?,?, 'dang_chay')")
    .run('hanh-trinh-v3-khoi-12', 'Hành trình · Khối 12', 'Khối 12', '["L"]', '[]', '[]', '9999-12-31', '2026-10-01T00:00:00Z')
  d.sql.prepare('INSERT INTO hanh_trinh_v3_ngay (sbd, ngay, tang, toi_thieu) VALUES (?,?,?,?)').run('L', '2026-10-05', 3, 36)
  d.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('goi_bai_7_v1', ?, 'x')").run(JSON.stringify({ bat: true, batDau: '2026-10-06' }))
  d.sql.prepare("INSERT INTO bai_da_day (id, lop, khoa_bai, ten_bai, vi_tri, ma_to_json, tick_luc) VALUES ('t1', '12 - Tinh Hoa', 'b6', 'Bài 6', 1, '[]', 'x')").run()
  d.sql.prepare("INSERT INTO goi_bai_7 (id, tick_id, lop, khoa_bai, ten, bat_dau, han, tao_luc) VALUES ('g7:t1', 't1', '12 - Tinh Hoa', 'b6', 'Bài 6', '2026-10-06', '2026-10-12', 'x')").run()
  d.sql.prepare("INSERT INTO goi_bai_7_em (goi_id, sbd, bat_dau, han) VALUES ('g7:t1', 'L', '2026-10-06', '2026-10-12')").run()
  let n = 0
  for (const ng of ['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']) {
    d.sql.prepare('INSERT INTO goi_bai_7_ngay (goi_id, sbd, ngay, quota) VALUES (?,?,?,?)').run('g7:t1', 'L', ng, 19)
    for (let i = 0; i < 24; i++)
      d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES (?,?,?,?,?,?,?,?,?,?)')
        .run(`k${++n}`, 'L', `Q-${ng}-${i}`, 'game', 'P', 1, 1, 40, luc(ng, 9, i), ng)
  }
  return { d, env: d.env as unknown as Env }
}

describe('ngày Gói 7 cũ chưa chốt ⇒ ước tính uoc-goi7; luật Lười dùng M mới', () => {
  it('ảnh thầy "24/36 thiếu 12": ngày Gói 7 cũ nay 24/24 đủ mức (uoc-goi7, tầng 1) — không lấy tầng 3 của Hành trình; 6 ngày đủ ⇒ Chăm (trước: Lười)', async () => {
    const T = Date.parse('2026-10-12T05:00:00Z')
    vi.setSystemTime(T)
    const { env } = khoLuoi()
    const h = (await gvHoSoThaiDo(env, { sbd: 'L', tu: '2026-10-05' }, T)) as KetQuaHoSoThaiDo
    expect(h.ok).toBe(true)
    const o = Object.fromEntries(h.ngay.map((n) => [n.ngay, [n.mucToiThieu, n.daLam, n.thieu, n.datMuc, n.nguonMuc, n.tang, n.cheDo]]))
    expect(o['2026-10-05']).toEqual([36, 0, 36, false, 'da-chot', 3, 'hanh-trinh'])
    for (const ng of ['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'])
      expect(o[ng], ng).toEqual([24, 24, 0, true, 'uoc-goi7', 1, 'goi7'])
    expect(o['2026-10-12']).toEqual([24, 0, 24, false, 'uoc-goi7', 1, 'goi7']) // hôm nay chưa mở bài ⇒ ước tính, có cờ
    expect(h.nhomNhip).toBe('cham') // 6 ngày Gói 7 đủ, chuỗi 6 — trước 12/10 mỗi ngày 24/36 "thiếu 12" ⇒ 0 ngày đủ ⇒ Lười
    expect(h.ketLuan.nhan).not.toBe('luoi')
    const em = (await hsNhipHoc(env, { token: await gameToken(env, 'L') }, T)) as KetQuaNhipHocEm
    expect(em).toMatchObject({ ok: true, nhom: 'cham', soNgayDu: 6, soNgayQua: 7 }) // ngày vào 05/10 (dấu vết Hành trình): 6/7 đủ ⇒ Chăm
    const nhip = (await gvNhipHoc(env, { tu: '2026-10-05' }, T)) as KetQuaNhipHoc
    const eL = nhip.em.find((e) => e.sbd === 'L')!
    expect(eL.muc).toEqual([36, 24, 24, 24, 24, 24, 24, 24])
    expect(eL.lam).toEqual([0, 24, 24, 24, 24, 24, 24, 0])
    // 13/10: chip cạnh tên nhóm trên hồ sơ = CÙNG độ tin cậy của nhóm ở bảng em và dòng thầy (không mượn số của nhãn thái độ).
    expect(em.doTinCay).toBeGreaterThan(0)
    expect(h.tinCayNhom?.doTinCay).toBe(em.doTinCay)
    expect(h.tinCayNhom?.canThem).toBe(em.canThem)
    expect((eL as { doTinCay?: number }).doTinCay).toBe(em.doTinCay)
  })

  it('lịch câu mới ngày cũ lớn hơn 24 ⇒ ước tính theo lịch (32); có dòng chốt ⇒ đúng số chốt (da-chot), không ước tính', async () => {
    const T = Date.parse('2026-10-12T05:00:00Z')
    vi.setSystemTime(T)
    const { d, env } = khoLuoi()
    d.sql.prepare("UPDATE goi_bai_7_ngay SET quota=32 WHERE ngay='2026-10-10'").run()
    d.sql.prepare('INSERT INTO goi_bai_7_muc_ngay (sbd, ngay, tang, toi_thieu_tang, quota, muc, luc) VALUES (?,?,?,?,?,?,?)').run('L', '2026-10-11', 2, 30, 19, 30, 'x')
    const r = await ngayBaiCuaMotEm(env, 'L', '2026-10-10', '2026-10-11', '2026-10-12')
    expect(r!.map((n) => [n.ngay, n.mucToiThieu, n.daLam, n.datMuc, n.nguonMuc, n.mucUocTinh, n.tang])).toEqual([
      ['2026-10-10', 32, 24, false, 'uoc-goi7', true, 1],
      ['2026-10-11', 30, 24, false, 'da-chot', false, 2],
    ])
  })
})

// @vitest-environment node
// ĐOÀN HỘ TỐNG 2.0 · EM HẾT CÂU RIÊNG TRƯỚC BẠN (thầy 28/09 "cho trợ lý làm cho hợp lý luôn").
// Hiện trạng + nguyên nhân: docs/doan-het-cau-2809/HIEN-TRANG.md. Luật mới:
//  * hiệp thường em không còn câu riêng ⇒ máy coi em đã chốt vai GIỮ KHIÊN (+8 khiên như bạn máy chắn, không đúng/sai),
//    hiệp giải ngay khi các bạn nộp xong; em vẫn tiếp sức được bạn đang cần; không độn câu mới;
//  * hiệp trùm vẫn chia ý cho em; cả đoàn hết câu riêng ⇒ bỏ qua hiệp trống, đi thẳng tới trùm kế / kết chặng;
//  * tổng kết đếm câu thật; khoản thắng chặng theo tỉ lệ câu ôn thật / 6 (vỡ giáp là việc cả đội — giữ nguyên).
// Máy chủ chạy trên SQLITE THẬT (tests/_d1-that.ts); bộ câu ngắn tạo bằng cách cắt `nguoi[k].cau` đúng như startDoan2 trả ít câu.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { DEM_NGUOC_MS, NGHI_GIUA_HIEP_MS } from '../server/src/game-v2-doan'
import { traoExpKetChang } from '../server/src/game-v2-doan-exp'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import {
  moChang, giaiHiep, tomTatChang, khungNhinHiep, boQuaHiepTrong, khoanKetChang, thuongTheoSoCau, hiepLaTrum,
  CHAN, HP_QUAI, SO_CAU_RIENG_CHANG, type Chang, type NopHiep, type TomTatChang,
} from '../src/game/than-thu-v2/doan-core'
import { taoD1That, type D1That } from './_d1-that'

// ───────────────────────── LÕI THUẦN ─────────────────────────
const doi = (n: number) => moChang({ hatGiong: 'het-cau', nguoi: Array.from({ length: n }, (_, i) => ({ id: `hs${i}`, ten: `Em ${i}`, pet: i })) })
const danh = (ghe: number, them: Partial<NopHiep> = {}): NopHiep => ({ ghe, dung: true, hanhDong: 'danh', ...them })

describe('lõi · vai GIỮ KHIÊN khi em hết câu riêng', () => {
  it('ghế hoTro: đã chốt, khiên +8, không đúng/sai, không năng lượng; bạn thấy "chắn" như bạn máy chắn', () => {
    const c = giaiHiep(doi(3), { nop: [danh(0), { ghe: 1, dung: false, hanhDong: 'chan', hoTro: true }, danh(2)] })
    const kq = c.lichSu[0]!, r = kq.ghe[1]!
    expect(r).toMatchObject({ nop: true, dung: false, hoTro: true, hanhDong: 'chan', chan: CHAN, satThuong: 0, nangLuongSau: 0 })
    expect(kq.tongChan).toBe(CHAN)
    // 3 quái, 2 đòn đúng hạ 2 ⇒ 1 quái tồn đánh 4, khiên 8 đỡ hết ⇒ Linh Tâm không mất máu.
    expect(kq.linhTamMat).toBe(0)
    expect(khungNhinHiep(kq, 0).ban.find(b => b.ghe === 1)).toMatchObject({ ra: 'chan', satThuong: 0 })
  })
  it('ghế hoTro KHÔNG nhận thẻ tiếp sức (không có câu) nhưng VẪN tiếp sức được bạn: Liên Kích nổ cho bạn làm lại đúng', () => {
    const c = giaiHiep(doi(2), { nop: [{ ghe: 0, dung: false, hanhDong: 'chan', hoTro: true }, danh(1, { tiepSucBoi: 0 })] })
    const kq = c.lichSu[0]!
    expect(kq.ghe[1]).toMatchObject({ duocGiupBoi: 0, lienKich: true, satThuong: 48 })
    expect(kq.ghe[0]).toMatchObject({ giup: 1, giupThanhCong: true, chan: CHAN })
    const c2 = giaiHiep(doi(2), { nop: [danh(0), { ghe: 1, dung: false, hanhDong: 'chan', hoTro: true, tiepSucBoi: 0 }] })
    expect(c2.lichSu[0]!.ghe[1]).toMatchObject({ duocGiupBoi: null, tuLam: true })
    expect(c2.ghe[1]!.daNhanTiepSuc).toBe(0)
  })
  it('tổng kết: số câu = câu THẬT; hiệp giữ khiên đếm riêng, khiên và lượt tiếp sức vẫn được ghi công', () => {
    let c = doi(2)
    c = giaiHiep(c, { nop: [danh(0), danh(1)] })
    c = giaiHiep(c, { nop: [{ ghe: 0, dung: false, hanhDong: 'chan', hoTro: true }, danh(1, { tiepSucBoi: 0 })] })
    const t = tomTatChang(c).ghe[0]!
    expect(t).toMatchObject({ soCau: 1, soDung: 1, soHiepGiuKhien: 1, chan: CHAN, soLanGiup: 1, soLanGiupThanhCong: 1 })
    expect(tomTatChang(c).ghe[1]).toMatchObject({ soCau: 2, soHiepGiuKhien: 0 })
  })
})

describe('lõi · bỏ qua hiệp riêng trống', () => {
  it('gỡ đúng lứa quái vừa sinh của hiệp bị bỏ, giữ quái tồn; sang hiệp kế; không thêm dòng lịch sử', () => {
    let c: Chang = doi(2)
    c = giaiHiep(c, { nop: [danh(0), { ghe: 1, dung: false, hanhDong: 'chan' }] }) // hạ 1, tồn 1; vào hiệp 2 sinh thêm 2
    expect(c.hiep).toBe(2); expect(c.quai.length).toBe(3)
    const ton = c.quai[0]!.ma
    const b = boQuaHiepTrong(c)
    expect(b.hiep).toBe(3); expect(b.lichSu.length).toBe(1)
    // hiệp 3 sinh lứa mới (2 con) — lứa của hiệp 2 bị bỏ đã gỡ
    expect(b.quai.map(q => q.ma)).toEqual([ton, ...b.quai.slice(1).map(q => q.ma)])
    expect(b.quai.length).toBe(3); expect(b.quai.every(q => q.hp === HP_QUAI)).toBe(true)
    expect(b.linhTam).toEqual(c.linhTam)
  })
  it('bỏ qua tới hiệp trùm ⇒ có chia ý; hiệp trùm / hiệp cuối không bỏ qua được', () => {
    let c: Chang = doi(2)
    for (let h = 1; h < 3; h++) c = giaiHiep(c, { nop: [danh(0), danh(1)] })
    const t = boQuaHiepTrong(c)
    expect(t.hiep).toBe(4); expect(hiepLaTrum(t.hiep)).toBe(true); expect(t.giaoY.length).toBe(4)
    expect(t.quai.length).toBe(0) // lứa hiệp 3 gỡ, trùm không sinh quái
    expect(() => boQuaHiepTrong(t)).toThrow()
  })
  it('phòng cũ (không có quaiMoiTu) ⇒ không gỡ con nào, không vỡ', () => {
    const c = doi(2); delete c.quaiMoiTu
    expect(boQuaHiepTrong(c).quai.length).toBe(c.quai.length + 2)
  })
})

describe('lõi · EXP thắng chặng theo số câu thật', () => {
  it('đủ 6 câu / không khai ⇒ như cũ; 2/6 câu ⇒ một phần ba (làm tròn lên); vỡ giáp giữ nguyên', () => {
    expect(SO_CAU_RIENG_CHANG).toBe(6)
    const tt = { thang: true, sao: 3, trumVoGiap: [true, true] }
    expect(khoanKetChang(tt, true)).toEqual({ chang: 15, voGiap: 6, tong: 21 })
    expect(khoanKetChang(tt, true, 6)).toEqual({ chang: 15, voGiap: 6, tong: 21 })
    expect(khoanKetChang(tt, true, 2)).toEqual({ chang: 5, voGiap: 6, tong: 11 })
    expect(khoanKetChang(tt, false, 1)).toEqual({ chang: 2, voGiap: 6, tong: 8 }) // nửa (8) × 1/6 → 2
    expect(thuongTheoSoCau(10, 5)).toBe(9)
    expect(khoanKetChang({ thang: false, sao: 0, trumVoGiap: [true, false] }, true, 2)).toEqual({ chang: 0, voGiap: 3, tong: 3 })
  })
})

// ───────────────────────── MÁY CHỦ (SQLite thật) ─────────────────────────
const T0 = Date.parse('2026-09-28T12:00:00+07:00')
let bayGio = T0
const troi = (ms: number) => { bayGio += ms; vi.setSystemTime(bayGio) }
beforeEach(() => { bayGio = T0; vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())
const KHO = [
  ...Array.from({ length: 9 }, (_, i) => ({ qid: `X${i + 1}`, dang: 'ES.A.X', correct: 'ABCD'[i % 4]! })),
  ...Array.from({ length: 9 }, (_, i) => ({ qid: `Y${i + 1}`, dang: 'AN.B.Y', correct: 'DCBA'[i % 4]! })),
  ...Array.from({ length: 9 }, (_, i) => ({ qid: `Z${i + 1}`, dang: 'HC.C.Z', correct: 'BADC'[i % 4]! })),
]
const dapAn = new Map(KHO.map(c => [c.qid, c.correct]))
function dungTruong(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong',?,'x')").run(JSON.stringify({ toanBo: true }))
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',?,?,0,'v1')").run(KHO.length, 'kho/DE1.json')
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  for (const c of KHO) {
    const q = { qid: c.qid, maDe: 'DE1', version: 'v1', group: `g-${c.qid}`, phan: 'I', text: `Đề ${c.qid}`, choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [], dang: c.dang, tenDang: 'Dạng', mucDo: 'biet', sao: 1, kienThuc: ['K1'], correct: c.correct, solution: `LG-${c.qid}`, reviewed: true }
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', q.qid, 'v1', q.group, q.dang, JSON.stringify(q))
  }
  for (const [sbd, ten] of [['S1', 'Nguyễn Thu Hà'], ['S2', 'Trần Văn Nam'], ['S3', 'Lê Minh An']] as const) {
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12A','mk','x')").run(sbd, ten)
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run(sbd, JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  }
  return d
}
/** Mỗi em có sổ học ở cả ba dạng ⇒ máy chủ có câu vừa sức để phát (đủ 6 câu riêng). */
async function coSo(d: D1That) {
  for (const sbd of ['S1', 'S2', 'S3']) await ghiSuKien(d.env, ['X1', 'Y1', 'Z1'].map((qid, k) => ({ nguon: 'btvn', maNguon: `BT-${sbd}-${k}`, sbd, qid, lan: 1, ketQua: 0, luc: new Date(T0 - 72 * 3_600_000).toISOString(), maDang: KHO.find(c => c.qid === qid)!.dang })))
  await dungLaiHoSo(d.env, ['S1', 'S2', 'S3'], new Date(T0).toISOString())
}
type KN = { ok: boolean; doan: any; ketQuaCau?: any }
const goi = async (d: D1That, sbd: string, lenh: string, b: Record<string, unknown> = {}) => gameV2(d.env, `doan-${lenh}`, { token: await gameToken(d.env, sbd), ...b }) as Promise<KN>
const phong = (d: D1That, ma: string) => JSON.parse((d.sql.prepare('SELECT json FROM doan_chang WHERE ma=?').get(ma) as { json: string }).json)
/** Cắt bộ câu riêng của một em còn `n` câu (đúng như startDoan2 trả ít câu: soCauThieu = 6 − n). */
function catCau(d: D1That, ma: string, ghe: number, n: number) {
  const p = phong(d, ma); p.nguoi[ghe].cau = p.nguoi[ghe].cau.slice(0, n); p.nguoi[ghe].soCauThieu = 6 - n
  d.sql.prepare('UPDATE doan_chang SET json=? WHERE ma=?').run(JSON.stringify(p), ma)
}
const soAttempt = (d: D1That, sbd: string) => (d.sql.prepare('SELECT COUNT(*) n FROM game_v2_attempt WHERE sbd=?').get(sbd) as { n: number }).n
async function lam(d: D1That, sbd: string, ma: string) {
  const xem = await goi(d, sbd, 'xem', { ma }); const qid = xem.doan.cau?.qid
  if (!qid || xem.doan.cau.daChot) return xem
  return goi(d, sbd, 'nop', { ma, hiep: xem.doan.tran.hiep, answer: dapAn.get(qid), hanhDong: 'danh' })
}
async function doiDoan(d: D1That, n: number) {
  const ma = (await goi(d, 'S1', 'mo', { cheDo: 'phong' })).doan.ma as string
  for (const s of ['S2', 'S3'].slice(0, n - 1)) await goi(d, s, 'vao', { ma })
  await goi(d, 'S1', 'bat-dau', { ma })
  return ma
}
/** Chơi tới hết chặng: mỗi vòng các em đều làm câu (em hết câu thì chỉ xem), rồi qua giờ nghỉ.
 *  Kho thử không có câu chung Phần II ⇒ hiệp trùm giải theo phong độ ngay khi mở. Trả lại các hiệp ĐÃ GIẢI (lịch sử chặng). */
async function choiHet(d: D1That, ma: string, dsSbd: string[]) {
  for (let k = 0; k < 20; k++) {
    const x = await goi(d, dsSbd[0]!, 'xem', { ma })
    if (x.doan.tran.ketThuc) return (phong(d, ma).chang.lichSu as { hiep: number }[]).map(h => h.hiep)
    if (x.doan.tran.moSauMs > 0) { troi(x.doan.tran.moSauMs); continue }
    for (const s of dsSbd) await lam(d, s, ma)
    troi(NGHI_GIUA_HIEP_MS)
  }
  throw new Error('Chặng không kết thúc — bị kẹt')
}

describe('máy chủ · đoàn 3 em, một em chỉ có 2 câu ôn', () => {
  it('hiệp 3: em hết câu = đã chốt vai giữ khiên (không chờ, không nộp được, không độn câu); vẫn tiếp sức được bạn; hiệp giải ngay khi các bạn nộp', async () => {
    const d = dungTruong(); await coSo(d); const ma = await doiDoan(d, 3)
    catCau(d, ma, 1, 2); troi(DEM_NGUOC_MS)
    for (let h = 1; h <= 2; h++) { for (const s of ['S1', 'S2', 'S3']) await lam(d, s, ma); troi(NGHI_GIUA_HIEP_MS) }
    const attemptTruoc = soAttempt(d, 'S2')
    const x2 = await goi(d, 'S2', 'xem', { ma })
    expect(x2.doan.tran.hiep).toBe(3)
    expect(x2.doan.cau).toMatchObject({ het: true, giuKhien: true, chan: CHAN, loiNhan: 'Em đã ôn xong câu hôm nay — hiệp này em giữ khiên cho đoàn.' })
    expect(x2.doan.cau.qid).toBeUndefined(); expect(x2.doan.cau.de).toBeUndefined() // không độn câu, không đề nào xuống máy
    // Bạn thấy em "đã chốt" ngay từ đầu hiệp — không ai phải chờ em.
    const x1 = await goi(d, 'S1', 'xem', { ma })
    expect(x1.doan.ghe[1].trangThai).toBe('da_chot'); expect(x1.doan.ghe[0].trangThai).toBe('dang_lam')
    await expect(goi(d, 'S2', 'nop', { ma, hiep: 3, hanhDong: 'chan', boTrong: true })).rejects.toThrow(/giữ khiên/)
    await expect(goi(d, 'S2', 'tin-hieu', { ma, tinHieu: 'can_tiep_suc' })).rejects.toThrow(/giữ khiên/)
    // S1 xin tiếp sức ⇒ S2 (đang giữ khiên) thấy nút và gửi được thẻ.
    await goi(d, 'S1', 'tin-hieu', { ma, tinHieu: 'can_tiep_suc' })
    const x2b = await goi(d, 'S2', 'xem', { ma })
    expect(x2b.doan.tiepSuc.banCan).toEqual([0])
    const goiY = await goi(d, 'S2', 'the-goi-y', { ma, den: 0 })
    const the = (goiY as any).goiY.the[0].loai
    await goi(d, 'S2', 'tiep-suc', { ma, den: 0, hiep: 3, the })
    await lam(d, 'S1', ma)
    const sau = await lam(d, 'S3', ma) // bạn cuối cùng nộp ⇒ hiệp giải NGAY, không chờ đồng hồ
    expect(sau.doan.tran.hiep).toBe(4)
    const vua = sau.doan.hiepVuaXong
    expect(vua.hiep).toBe(3)
    expect(vua.ban.find((b: any) => b.ghe === 1)).toMatchObject({ ra: 'chan' })
    expect(vua.tongChan).toBe(CHAN)
    expect(vua.linhTamMat).toBe(0) // 2 quái bị hạ, quái thứ ba bị khiên của S2 đỡ
    expect(soAttempt(d, 'S2')).toBe(attemptTruoc) // không ghi bài làm nào cho S2
  })

  it('cả chặng: các bạn vẫn đủ 8 hiệp / 6 câu; em 2 câu tổng kết đúng 2 câu + 4 hiệp giữ khiên; trùm vẫn chia ý cho em', async () => {
    const d = dungTruong(); await coSo(d); const ma = await doiDoan(d, 3)
    catCau(d, ma, 1, 2); troi(DEM_NGUOC_MS)
    const hiepMo = await choiHet(d, ma, ['S1', 'S2', 'S3'])
    expect(hiepMo).toEqual([1, 2, 3, 4, 5, 6, 7, 8]) // chặng của các bạn không ngắn đi
    const p = phong(d, ma)
    expect(p.chang.lichSu.length).toBe(8)
    for (const h of p.chang.lichSu.filter((x: any) => x.laTrum)) expect(h.ghe[1].yGiu.length).toBeGreaterThan(0) // trùm có ý của S2
    const k2 = (await goi(d, 'S2', 'xem', { ma })).doan.ketChang, k1 = (await goi(d, 'S1', 'xem', { ma })).doan.ketChang
    expect(k2.cuaEm).toMatchObject({ soCau: 2, soHiepGiuKhien: 4, chan: 4 * CHAN })
    expect(k1.cuaEm).toMatchObject({ soCau: 6, soHiepGiuKhien: 0 })
    const luot = d.sql.prepare('SELECT sbd,so_cau FROM doan_luot WHERE ma_chang=? ORDER BY sbd').all(ma) as { sbd: string; so_cau: number }[]
    expect(luot).toEqual([{ sbd: 'S1', so_cau: 6 }, { sbd: 'S2', so_cau: 2 }, { sbd: 'S3', so_cau: 6 }])
  })
})

describe('máy chủ · cả đoàn hết câu riêng trước hiệp 8', () => {
  it('hai em cùng 2 câu: sau hiệp 2 đi thẳng tới trùm 4, sau trùm 4 đi thẳng tới trùm 8 — không chờ đồng hồ hiệp trống', async () => {
    const d = dungTruong(); await coSo(d); const ma = await doiDoan(d, 2)
    catCau(d, ma, 0, 2); catCau(d, ma, 1, 2); troi(DEM_NGUOC_MS)
    await choiHet(d, ma, ['S1', 'S2']).then(h => expect(h).toEqual([1, 2, 4, 8]))
    const p = phong(d, ma)
    expect(p.chang.lichSu.map((h: any) => h.hiep)).toEqual([1, 2, 4, 8])
    expect(p.chang.ketThuc).toBe(true)
  })
  it('một em 3 câu, một em 2 câu: hiệp 3 vẫn chơi (em 2 câu giữ khiên), hiệp 5–7 trống cả đoàn ⇒ bỏ qua', async () => {
    const d = dungTruong(); await coSo(d); const ma = await doiDoan(d, 2)
    catCau(d, ma, 0, 3); catCau(d, ma, 1, 2); troi(DEM_NGUOC_MS)
    await choiHet(d, ma, ['S1', 'S2']).then(h => expect(h).toEqual([1, 2, 3, 4, 8]))
  })
  it('bạn còn câu rời giữa hiệp, những bạn ở lại đều hết câu ⇒ bỏ qua hiệp đó ngay', async () => {
    const d = dungTruong(); await coSo(d); const ma = await doiDoan(d, 2)
    catCau(d, ma, 1, 2); troi(DEM_NGUOC_MS)
    for (let h = 1; h <= 2; h++) { for (const s of ['S1', 'S2']) await lam(d, s, ma); troi(NGHI_GIUA_HIEP_MS) }
    expect((await goi(d, 'S2', 'xem', { ma })).doan.tran.hiep).toBe(3)
    await goi(d, 'S1', 'roi', { ma })
    // Không phải ngồi chờ hết 40+ giây của hiệp 3: hiệp 3 bị bỏ qua ngay (không có dòng lịch sử), trùm 4 mở liền.
    const x = await goi(d, 'S2', 'xem', { ma })
    expect(x.doan.tran.hiep).toBeGreaterThanOrEqual(4)
    expect(phong(d, ma).chang.lichSu.map((h: any) => h.hiep)).toEqual(x.doan.tran.hiep === 4 ? [1, 2] : [1, 2, 4])
  })
})

describe('máy chủ · đi một mình (1 em + bạn máy) chỉ có 2 câu', () => {
  it('chặng ngắn lại 1 · 2 · 4 · 8 và kết thúc, không kẹt; khoản thắng chặng theo 2/6 câu ôn', async () => {
    const d = dungTruong(); await coSo(d)
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: '2026-09-01T00:00:00.000Z', dsSbd: ['S1'] }))
    const ma = (await goi(d, 'S1', 'mo')).doan.ma as string
    catCau(d, ma, 0, 2); troi(DEM_NGUOC_MS)
    expect(await choiHet(d, ma, ['S1'])).toEqual([1, 2, 4, 8])
    const k = (await goi(d, 'S1', 'xem', { ma })).doan.ketChang
    expect(k.cuaEm).toMatchObject({ soCau: 2, soHiepGiuKhien: 0 })
    const dong = d.sql.prepare("SELECT exp, ghi_chu FROM exp_so WHERE sbd='S1' AND loai='doan_chang'").all() as { exp: number; ghi_chu: string }[]
    expect(k).toMatchObject({ thang: true, sao: 3 }) // Linh Tâm không bị quái của hiệp trống đánh ⇒ về đích đủ máu
    expect(dong).toEqual([{ exp: 5, ghi_chu: 'Thắng chặng 3 sao +5 EXP (2/6 câu ôn)' }])
    expect(k.expChang.find((x: any) => x.loai === 'doan_chang')).toMatchObject({ exp: 5 })
  })
  it('Hóa 2.0 (chờ em bấm ĐÁNH TIẾP): hiệp trống không bắt em bấm tiếp từng hiệp — nhảy thẳng tới trùm', async () => {
    const d = dungTruong(); await coSo(d)
    const ma = (await goi(d, 'S1', 'mo')).doan.ma as string
    d.sql.prepare("UPDATE doan_chang SET json=json_set(json,'$.choEmBamTiep',json('true')) WHERE ma=?").run(ma)
    catCau(d, ma, 0, 2); troi(DEM_NGUOC_MS)
    await lam(d, 'S1', ma); await goi(d, 'S1', 'tiep', { ma })
    const sau2 = await lam(d, 'S1', ma)
    expect(sau2.doan.tran).toMatchObject({ hiep: 4, choTiep: true })
  })
})

describe('EXP kết chặng · traoExpKetChang nhận số câu riêng', () => {
  it('em 2 câu nhận 1/3 khoản thắng chặng, bạn đủ câu nhận đủ; vỡ giáp như nhau', async () => {
    const d = dungTruong()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: '2026-09-01T00:00:00.000Z', dsSbd: ['S1', 'S2'] }))
    const tt = { thang: true, sao: 3, trumVoGiap: [true, false], ghe: [{ id: 'S1', laMay: false }, { id: 'S2', laMay: false }] } as unknown as TomTatChang
    await traoExpKetChang(d.env, 'M1', T0, tt, T0, new Map([['S2', 2]]))
    const khoan = (sbd: string) => d.sql.prepare("SELECT loai, exp, ghi_chu FROM exp_so WHERE sbd=? AND loai IN ('doan_chang','doan_giap') ORDER BY loai").all(sbd)
    expect(khoan('S1')).toEqual([{ loai: 'doan_chang', exp: 15, ghi_chu: 'Thắng chặng 3 sao +15 EXP' }, { loai: 'doan_giap', exp: 3, ghi_chu: 'Vỡ giáp 1 trùm +3 EXP' }])
    expect(khoan('S2')).toEqual([{ loai: 'doan_chang', exp: 5, ghi_chu: 'Thắng chặng 3 sao +5 EXP (2/6 câu ôn)' }, { loai: 'doan_giap', exp: 3, ghi_chu: 'Vỡ giáp 1 trùm +3 EXP' }])
  })
})

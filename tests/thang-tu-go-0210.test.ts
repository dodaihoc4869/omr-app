// @vitest-environment node
// THANG TỰ GỠ — Vòng học khép kín v2, GĐ2 phía học sinh (server/src/thang-tu-go.ts): câu kiểm từng bước chấm ở máy chủ, không lộ đáp án
// trước khi em trả lời; cổng nỗ lực 5 điều kiện (đủ / thiếu từng điều kiện); trần 5 thẻ/ngày; ca mở ⇒ chặn; luyện nền chấm máy chủ.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { chamCauKiem, chamCauNen, docSo, locCauNen } from '../server/src/thang-tu-go'
import { docQidSaiV2 } from '../server/src/hang-chua-loi'
import type { Env } from '../server/src/kieu'

const GOC = path.resolve(__dirname, '..')
const MAU = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json'), 'utf8')) as Record<string, { cau: Record<string, unknown> }>
const RA2 = path.join(GOC, 'docs/loi-giai-a/chay-thu-2/ra')
const cauThat = (qid: string, so: number) => ({ ...MAU[qid].cau, so })
const DE_A = '12-THU-A'
const GOI_A = { cau: [cauThat('12-KT-C1-D4-I-6', 6), cauThat('12-KT-C1-D4-II-4', 4)] }
const QA = { tn: `${DE_A}-I-6`, ds: `${DE_A}-II-4` }

const thay = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b, true)
const em = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b)

const BUOC = ['n(CO₂) = 5,6 : 22,4 = 0,25 mol', 'Bảo toàn nguyên tố C: n(C) = n(CO₂)', 'Khối lượng m = 0,25 · 12 = 3 gam']
const CAU_KIEM = [
  { buoc: 0, kieu: 'so', hoi: 'Số mol CO₂ bằng bao nhiêu?', dap_an: '0,25', sai_so: '0.01' },
  { buoc: 1, kieu: 'chon', hoi: 'Bước tiếp theo nên dùng gì?', lua_chon: ['Bảo toàn khối lượng', 'Bảo toàn nguyên tố C', 'Bảo toàn electron'], dung: 1 },
]
const NHAN_NEN = [{ buoc: 0, nen: 'doi_mol_khoi_luong' }, { buoc: 1, nen: 'bao_toan_nguyen_to' }]
const SS = [{ de: 'Song sinh 0', dap_an: 'DSDS' }, { de: 'Song sinh 1', dap_an: 'SDSD' }]
const NGAN_HANG = [
  { id: 'doi_mol_khoi_luong-01', nhan: 'doi_mol_khoi_luong', muc: 1, kieu: 'so', de: 'Tính số mol NaCl trong 11,7 gam NaCl.', dap_an: '0,2', gia_tri_dung: '0.2', giai: ['n = 11,7 : 58,5 = 0,2 mol'], meo: 'n = m : M' },
  { id: 'doi_mol_khoi_luong-02', nhan: 'doi_mol_khoi_luong', muc: 1, kieu: 'tn', de: 'Khối lượng của 0,15 mol CaCO₃ là', pa: { A: '10,2 gam', B: '15 gam', C: '12,6 gam', D: '6 gam' }, dap_an: 'B', gia_tri_dung: '15', giai: ['m = 0,15 · 100 = 15 gam'], meo: 'Nhân chỉ số.' },
  { id: 'doi_mol_khoi_luong-03', nhan: 'doi_mol_khoi_luong', muc: 2, kieu: 'so', de: 'Tính số mol Fe trong 5,6 gam sắt.', dap_an: '0,1', gia_tri_dung: '0.1', giai: ['n = 5,6 : 56 = 0,1 mol'], meo: '' },
  { id: 'hong', nhan: 'doi_mol_khoi_luong', kieu: 'tn', de: 'thiếu phương án', dap_an: 'A' },
]

function hoSoTu(tep: string, qid: string, bam: string) {
  const h = JSON.parse(fs.readFileSync(path.join(RA2, tep), 'utf8'))
  const { canThayChot: _c, de: _de, ...r } = h
  void _c; void _de
  return { ...r, qid, bam, co: [] }
}
const bamCua = (d: D1That, qid: string) => (d.sql.prepare('SELECT bam FROM loi_giai_cau WHERE qid=?').get(qid) as { bam: string }).bam
const iso = (phut: number) => new Date(Date.now() + phut * 60_000).toISOString()
const ngay = (s: string) => new Date(Date.parse(s) + 7 * 3600_000).toISOString().slice(0, 10)
let dem = 0
function ghiSo(d: D1That, qid: string, nguon: string, kq: number | null, luc: string, them: { assistance?: string; purpose?: string } = {}) {
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,purpose) VALUES(?,?,?,?,?,1,?,?,?,?,?)')
    .run(`${nguon}|${qid}|${++dem}`, 'E1', qid, nguon, 'M', kq, luc, ngay(luc), them.assistance ?? null, them.purpose ?? null)
}

async function chuanBi(boTro = true) {
  const d = taoD1That()
  await thay(d, '/kho/day', { maDe: DE_A, lop: '12', de: GOI_A, cau: [] })
  const bam = bamCua(d, QA.ds)
  expect(await thay(d, '/kho/loi-giai/nop', { qid: QA.ds, bam, hoSo: hoSoTu('04-12-KT-C1-D4-II-4.json', QA.ds, bam) })).toMatchObject({ ok: true })
  const bamTn = bamCua(d, QA.tn)
  expect(await thay(d, '/kho/loi-giai/nop', { qid: QA.tn, bam: bamTn, hoSo: hoSoTu('02-12-KT-C1-D4-I-6.json', QA.tn, bamTn) })).toMatchObject({ ok: true })
  if (boTro) {
    d.sql.prepare('INSERT INTO cau_bo_tro(bam,qid_mau,song_sinh_json,cau_kiem_json,nhan_nen_json,buoc_json,cap_nhat_luc) VALUES(?,?,?,?,?,?,?)')
      .run(bam, QA.ds, JSON.stringify(SS), JSON.stringify(CAU_KIEM), JSON.stringify(NHAN_NEN), JSON.stringify(BUOC), 'x')
  }
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('E1','Em E1','12','mk','x')").run()
  return { d, bam, token: await gameToken(d.env, 'E1') }
}
/** Đi hết bậc 1–3 cho câu QA.ds: sai tự làm, hỏi thầy, đọc hết các bước, câu kiểm bước 0 sai 2 lần, làm lại song sinh 2 lần (1 sai). */
async function quaHetCong(d: D1That, token: string) {
  ghiSo(d, QA.ds, 'luyen', 0, iso(-60))
  await em(d, '/hs/hoi-thay', { token, qid: QA.ds, nguon: 'on_lai' })
  await em(d, '/hs/cau-kiem', { token, qid: QA.ds, buoc: 0, traLoi: '0,5', giay: 20 })
  await em(d, '/hs/cau-kiem', { token, qid: QA.ds, buoc: 0, traLoi: '0,4', giay: 20 })
  await em(d, '/hs/cau-kiem', { token, qid: QA.ds, buoc: 0, traLoi: '0,25', giay: 20 })
  await em(d, '/hs/cau-kiem', { token, qid: QA.ds, buoc: 1, traLoi: '1', giay: 20 })
  const t = Date.now()
  await em(d, '/hs/doc-loi-giai', { token, qid: QA.ds, giay: 90, suKien: [0, 1, 2].map((i) => ({ k: 'mo_buoc', y: String(i), t: t + i })) })
  ghiSo(d, `${QA.ds}~ss0`, 'game', 0, iso(1))
  ghiSo(d, `${QA.ds}~ss1`, 'game', 1, iso(2))
}
/** Bỏ `serverNow` (mọi phản hồi máy chủ đều kèm) để so cả đối tượng. */
const bo = (r: Record<string, unknown>) => { const { serverNow: _n, ...x } = r; void _n; return x }
const viec = (r: Record<string, unknown>, ma: string) => (r.cong as { ma: string; dat: boolean; viec: string }[]).find((c) => c.ma === ma)

describe('thuần: đọc số, chấm câu kiểm, chấm câu nền, lọc câu nền', () => {
  it('đọc số kiểu Việt Nam, phân số, dấu trừ', () => {
    expect([docSo('0,25'), docSo('0.25'), docSo(' −1,5 '), docSo('1/4'), docSo('2,5e-3'), docSo('abc'), docSo('1/0')]).toEqual([0.25, 0.25, -1.5, 0.25, 0.0025, null, null])
  })
  it('câu kiểm số: sai số tương đối; câu chọn: chỉ số', () => {
    const so = { buoc: 0, kieu: 'so' as const, hoi: '', dap_an: '0,25', sai_so: '0.01' }
    expect([chamCauKiem(so, '0,2524'), chamCauKiem(so, '0,26'), chamCauKiem(so, ''), chamCauKiem(so, '1/4')]).toEqual([true, false, false, true])
    const chon = { buoc: 1, kieu: 'chon' as const, hoi: '', lua_chon: ['a', 'b', 'c'], dung: 1 }
    expect([chamCauKiem(chon, '1'), chamCauKiem(chon, '0'), chamCauKiem(chon, 'b')]).toEqual([true, false, false])
  })
  it('câu nền: số đã làm tròn hoặc lệch ≤ 0,5% giá trị đúng; trắc nghiệm theo chữ cái', () => {
    const c = { kieu: 'so', dap_an: '3,4', gia_tri_dung: '67/20' }
    expect([chamCauNen(c, '3,4'), chamCauNen(c, '3,35'), chamCauNen(c, '3,3'), chamCauNen({ kieu: 'tn', dap_an: 'B' }, 'b')]).toEqual([true, true, false, true])
    expect(locCauNen(NGAN_HANG[3])).toBeNull()
    expect(locCauNen({ ...NGAN_HANG[0], nhan: 'Sai Nhãn' })).toBeNull()
  })
})

describe('/hs/hoi-thay kèm "Đọc từng bước" — không lộ đáp án câu kiểm', () => {
  it('có học liệu ⇒ kiem: chữ bước + câu kiểm KHÔNG đáp án + lời thầy gỡ; không có học liệu ⇒ không có kiem', async () => {
    const { d, bam, token } = await chuanBi()
    d.sql.prepare("INSERT INTO loi_go(id,bam,buoc,kieu,noi_dung,luc) VALUES('g1',?,1,'ngan','C trong CO₂ đi đâu?',?)").run(bam, iso(-5))
    const r = await em(d, '/hs/hoi-thay', { token, qid: QA.ds })
    expect(r).toMatchObject({ ok: true, coLoiGiai: true, kiem: { buoc: BUOC, loiGo: [{ buoc: 1, noiDung: 'C trong CO₂ đi đâu?' }] } })
    const kiem = r.kiem as { cauKiem: Record<string, unknown>[] }
    expect(kiem.cauKiem).toEqual([
      { buoc: 0, kieu: 'so', hoi: 'Số mol CO₂ bằng bao nhiêu?' },
      { buoc: 1, kieu: 'chon', hoi: 'Bước tiếp theo nên dùng gì?', lua_chon: CAU_KIEM[1].lua_chon },
    ])
    const chu = JSON.stringify(r.kiem)
    for (const cam of ['dap_an', 'sai_so', '"dung"', 'nhan_nen', 'doi_mol']) expect(chu).not.toContain(cam)
    const tn = await em(d, '/hs/hoi-thay', { token, qid: QA.tn })
    expect(tn).toMatchObject({ ok: true, coLoiGiai: true })
    expect(tn.kiem).toBeUndefined()
  })
})

describe('/hs/cau-kiem — chấm ở máy chủ', () => {
  it('chưa mở lời giải ⇒ không chấm, không ghi', async () => {
    const { d, token } = await chuanBi()
    expect(await em(d, '/hs/cau-kiem', { token, qid: QA.ds, buoc: 0, traLoi: '0,25' })).toMatchObject({ ok: false })
    expect(d.dem('cau_kiem_lam')).toBe(0)
  })
  it('sai lần đầu: chỉ báo sai (không đáp án) + kiến thức nền; sai lần hai: kèm đáp án; đúng trong sai số; câu chọn; bước không có câu kiểm', async () => {
    const { d, token } = await chuanBi()
    await em(d, '/hs/hoi-thay', { token, qid: QA.ds })
    const s1 = await em(d, '/hs/cau-kiem', { token, qid: QA.ds, buoc: 0, traLoi: '0,5', giay: 12 })
    expect(bo(s1)).toEqual({ ok: true, dung: false, nhanNen: 'doi_mol_khoi_luong', tenNen: 'Đổi số mol ↔ khối lượng' })
    expect(await em(d, '/hs/cau-kiem', { token, qid: QA.ds + '#2', buoc: 0, traLoi: '0,3' })).toMatchObject({ ok: true, dung: false, dapAn: '0,25' })
    expect(bo(await em(d, '/hs/cau-kiem', { token, qid: QA.ds, buoc: 0, traLoi: '0.2501' }))).toEqual({ ok: true, dung: true })
    expect(await em(d, '/hs/cau-kiem', { token, qid: QA.ds, buoc: 1, traLoi: '0' })).toMatchObject({ ok: true, dung: false })
    expect(bo(await em(d, '/hs/cau-kiem', { token, qid: QA.ds, buoc: 1, traLoi: '1' }))).toEqual({ ok: true, dung: true })
    expect(await em(d, '/hs/cau-kiem', { token, qid: QA.ds, buoc: 2, traLoi: '3' })).toMatchObject({ ok: false })
    expect(d.dem('cau_kiem_lam', `sbd='E1' AND qid='${QA.ds}'`)).toBe(5)
    expect(d.dem('cau_kiem_lam', 'dung=1')).toBe(2)
    expect(d.dem('cau_kiem_lam', 'giay=12')).toBe(1)
  })
  it('token giả ⇒ không ghi', async () => {
    const { d } = await chuanBi()
    expect((await em(d, '/hs/cau-kiem', { token: 'gia.mao', qid: QA.ds, buoc: 0, traLoi: '0,25' })).ok).not.toBe(true)
    expect(d.dem('cau_kiem_lam')).toBe(0)
  })
})

describe('/hs/thang-go — cổng nỗ lực từng điều kiện', () => {
  it('câu không có học liệu ⇒ coThang false', async () => {
    const { d, token } = await chuanBi(false)
    expect(bo(await em(d, '/hs/thang-go', { token, qid: QA.ds }))).toEqual({ ok: true, coThang: false })
  })

  it('đi từng bậc: [1] tự làm sai → [2] đọc hết (bước, câu kiểm, không lướt) → [3]/[4] làm lại kín, luyện nền → bậc 5 gửi được', async () => {
    const { d, token } = await chuanBi()
    await em(d, '/hs/hoi-thay', { token, qid: QA.ds })
    let r = await em(d, '/hs/thang-go', { token, qid: QA.ds })
    expect(r).toMatchObject({ ok: true, coThang: true, bac: 1, coTheGui: false, soBuoc: 3 })
    expect(viec(r, 'tu_lam')).toMatchObject({ dat: false, viec: 'Em tự làm câu này trước đã' })
    expect(r.bangChung).toBeUndefined()

    // [1]: lượt có hỗ trợ / đọc lời giải KHÔNG tính; lượt tự làm sai mới tính.
    ghiSo(d, QA.ds, 'game', 0, iso(-90), { assistance: 'assisted' })
    ghiSo(d, QA.ds, 'on_lai', 0, iso(-80), { purpose: 'xem_loi_giai' })
    expect(viec(await em(d, '/hs/thang-go', { token, qid: QA.ds }), 'tu_lam')?.dat).toBe(false)
    ghiSo(d, `${QA.ds}#2`, 'luyen', 0, iso(-60))
    r = await em(d, '/hs/thang-go', { token, qid: QA.ds })
    expect(r).toMatchObject({ bac: 2 })
    expect(viec(r, 'doc_het')).toMatchObject({ dat: false, viec: 'Em đọc nốt bước 1' })

    // [2]: đã đóng một lần đọc mở bước 1–2; lần đang mở (chưa đóng) mở tới bước 3 nhưng chưa trả lời câu kiểm.
    const t = Date.now()
    await em(d, '/hs/doc-loi-giai', { token, qid: QA.ds, giay: 4, suKien: [{ k: 'mo_buoc', y: '0', t }, { k: 'mo_buoc', y: '1', t: t + 1 }] })
    expect(viec(await em(d, '/hs/thang-go', { token, qid: QA.ds }), 'doc_het')?.viec).toBe('Em đọc nốt bước 3')
    const dang = { giay: 5, suKien: [{ k: 'mo_buoc', y: '2', t: t + 2 }] }
    expect(viec(await em(d, '/hs/thang-go', { token, qid: QA.ds, dang }), 'doc_het')?.viec).toBe('Em trả lời câu kiểm ở bước 1')
    await em(d, '/hs/cau-kiem', { token, qid: QA.ds, buoc: 0, traLoi: '1' })
    await em(d, '/hs/cau-kiem', { token, qid: QA.ds, buoc: 0, traLoi: '2' })
    await em(d, '/hs/cau-kiem', { token, qid: QA.ds, buoc: 0, traLoi: '0,25' })
    expect(viec(await em(d, '/hs/thang-go', { token, qid: QA.ds, dang }), 'doc_het')?.viec).toBe('Em trả lời câu kiểm ở bước 2') // 1/2 < 80%
    await em(d, '/hs/cau-kiem', { token, qid: QA.ds, buoc: 1, traLoi: '1' })
    r = await em(d, '/hs/thang-go', { token, qid: QA.ds, dang }) // 4 + 5 giây cho 3 bước ⇒ lướt
    expect(viec(r, 'doc_het')).toMatchObject({ dat: false, viec: 'Em đọc chậm lại từng bước rồi thử lại' })
    r = await em(d, '/hs/thang-go', { token, qid: QA.ds, dang: { ...dang, giay: 40 } })
    expect(viec(r, 'doc_het')?.dat).toBe(true)
    // [3] chưa làm lại; [4] đã đạt nhờ câu kiểm bước 1 hỏng 2 lần. Chưa có câu nền ⇒ bậc 3.
    expect(r).toMatchObject({ bac: 3, buocVuong: 0, coTheGui: false })
    expect(viec(r, 'lam_lai')).toMatchObject({ dat: false, viec: 'Em thử câu tương tự này trước' })
    expect(viec(r, 'chi_buoc')?.dat).toBe(true)
    expect(r.nhanNenVuong).toBeUndefined()

    // Thầy nạp ngân hàng câu nền ⇒ bậc 4, có kiến thức nền đang vướng.
    expect(await thay(d, '/kho/nen/day', { cau: NGAN_HANG })).toMatchObject({ ok: true, soCau: 3, boQua: 1 })
    r = await em(d, '/hs/thang-go', { token, qid: QA.ds, dang: { ...dang, giay: 40 } })
    expect(r).toMatchObject({ bac: 4, nhanNenVuong: 'doi_mol_khoi_luong', tenNenVuong: 'Đổi số mol ↔ khối lượng' })

    // [3]: song sinh làm TRƯỚC khi đọc / có hỗ trợ không tính; 1 câu nền sai + 1 song sinh đúng sau khi đọc ⇒ đạt (2 lần, còn sai).
    ghiSo(d, `${QA.ds}~ss0`, 'game', 0, iso(-30))
    ghiSo(d, `${QA.ds}~ss1`, 'game', 0, iso(1), { assistance: 'assisted' })
    expect(viec(await em(d, '/hs/thang-go', { token, qid: QA.ds, dang: { ...dang, giay: 40 } }), 'lam_lai')?.dat).toBe(false)
    expect(await em(d, '/hs/luyen-nen/nop', { token, id: 'doi_mol_khoi_luong-01', traLoi: '0,3', qid: QA.ds })).toMatchObject({ ok: true, dung: false })
    ghiSo(d, `${QA.ds}~ss0`, 'game', 1, iso(2))
    r = await em(d, '/hs/thang-go', { token, qid: QA.ds, dang: { ...dang, giay: 40 } })
    expect(viec(r, 'lam_lai')?.dat).toBe(true)
    expect(r).toMatchObject({ bac: 5, coTheGui: true })
    expect((r.cong as { dat: boolean }[]).every((c) => c.dat)).toBe(true)
  })

  it('làm lại kín 2 lần đều đúng ⇒ [3] không đạt: chưa cần gửi thầy', async () => {
    const { d, token } = await chuanBi()
    await quaHetCong(d, token)
    ghiSo(d, `${QA.ds}~ss0`, 'game', 1, iso(3))
    d.sql.prepare("DELETE FROM su_kien_hoc WHERE qid = ? AND ket_qua = 0").run(`${QA.ds}~ss0`)
    expect(viec(await em(d, '/hs/thang-go', { token, qid: QA.ds }), 'lam_lai')).toMatchObject({ dat: false, viec: 'Em đã làm đúng câu tương tự, chưa cần gửi thầy' })
  })
})

describe('/hs/gui-thay — chỉ khi qua cổng', () => {
  it('thiếu điều kiện ⇒ ok:false kèm cổng, không ghi thẻ', async () => {
    const { d, token } = await chuanBi()
    await em(d, '/hs/hoi-thay', { token, qid: QA.ds })
    const r = await em(d, '/hs/gui-thay', { token, qid: QA.ds, buoc: 0, viet: 'Em không hiểu vì sao số mol CO₂ lại tính như vậy ạ thầy ơi' })
    expect(r).toMatchObject({ ok: false })
    expect(viec(r, 'tu_lam')?.dat).toBe(false)
    expect(d.dem('nut_that')).toBe(0)
  })

  it('đủ cổng ⇒ một thẻ chờ thầy kèm bằng chứng; gửi lại cùng câu ⇒ chặn', async () => {
    const { d, bam, token } = await chuanBi()
    await quaHetCong(d, token)
    const r = await em(d, '/hs/gui-thay', { token, qid: QA.ds, buoc: 0, viet: '' })
    expect(r).toMatchObject({ ok: true, id: expect.any(String) })
    const the = d.sql.prepare('SELECT * FROM nut_that').get() as Record<string, unknown>
    expect(the).toMatchObject({ sbd: 'E1', qid: QA.ds, bam, buoc: 0, trang_thai: 'cho' })
    expect(JSON.parse(String(the.bang_chung_json))).toMatchObject({ soLanSai: 1, soBuoc: 3, soBuocDaMo: 3, soCauKiem: 2, soCauKiemDaTraLoi: 2, soLanLamLai: 2, soLanLamLaiSai: 1, buocVuong: 0 })
    const lai = await em(d, '/hs/gui-thay', { token, qid: QA.ds, buoc: 0, viet: '' })
    expect(lai).toMatchObject({ ok: false })
    expect(viec(lai, 'khong_bua')?.viec).toBe('Câu này em đã gửi thầy, chờ thầy gỡ nhé')
    expect(d.dem('nut_that')).toBe(1)
  })

  it('[4] chọn bước khác bước vướng: phải viết ≥ 10 chữ', async () => {
    const { d, token } = await chuanBi()
    await quaHetCong(d, token)
    const ngan = await em(d, '/hs/gui-thay', { token, qid: QA.ds, buoc: 2, viet: 'em chưa hiểu' })
    expect(ngan).toMatchObject({ ok: false })
    expect(viec(ngan, 'chi_buoc')).toMatchObject({ dat: false, viec: 'Em viết em hiểu đến đâu (ít nhất 10 chữ)' })
    expect(await em(d, '/hs/gui-thay', { token, qid: QA.ds, buoc: 7, viet: '' })).toMatchObject({ ok: false, error: 'Em chọn bước em chưa hiểu.' })
    expect(await em(d, '/hs/gui-thay', { token, qid: QA.ds, buoc: 2, viet: 'Em tính được số mol C rồi nhưng không biết nhân với gì để ra khối lượng' })).toMatchObject({ ok: true })
  })

  it('trần 5 thẻ/ngày', async () => {
    const { d, token } = await chuanBi()
    await quaHetCong(d, token)
    const homNay = ngay(new Date().toISOString())
    for (let i = 0; i < 5; i++) {
      d.sql.prepare("INSERT INTO nut_that(id,sbd,qid,bam,buoc,gui_luc,ngay_vn,trang_thai,cap_nhat_luc) VALUES(?,'E1','Q','B',0,'x',?,'cho','x')").run(`t${i}`, homNay)
    }
    const r = await em(d, '/hs/thang-go', { token, qid: QA.ds })
    expect(r).toMatchObject({ coTheGui: false })
    expect(viec(r, 'khong_bua')?.viec).toBe('Hôm nay em đã gửi đủ 5 câu')
    expect(await em(d, '/hs/gui-thay', { token, qid: QA.ds, buoc: 0, viet: '' })).toMatchObject({ ok: false })
    expect(d.dem('nut_that')).toBe(5)
  })

  it('đang có ca kiểm tra mở ⇒ chặn gửi và chặn luyện nền', async () => {
    const { d, token } = await chuanBi()
    await quaHetCong(d, token)
    await thay(d, '/kho/nen/day', { cau: NGAN_HANG })
    d.sql.prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,bat_dau,het_han_vao,thoi_gian_phut,pham_vi,danh_sach_chon_json,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
      .run('CA-MO', 'Ca mở', 'mo', 'thi', '12', iso(-60), iso(120), 45, 'tu_do', null, 'x')
    const r = await em(d, '/hs/thang-go', { token, qid: QA.ds })
    expect(viec(r, 'khong_bua')?.viec).toBe('Em đang có ca kiểm tra, làm xong rồi gửi nhé')
    expect(await em(d, '/hs/gui-thay', { token, qid: QA.ds, buoc: 0, viet: '' })).toMatchObject({ ok: false })
    expect(await em(d, '/hs/luyen-nen', { token, nhan: 'doi_mol_khoi_luong' })).toMatchObject({ ok: false, khoa: 'dang_kiem_tra' })
    expect(await em(d, '/hs/luyen-nen/nop', { token, id: 'doi_mol_khoi_luong-01', traLoi: '0,2' })).toMatchObject({ ok: false, khoa: 'dang_kiem_tra' })
    expect(d.dem('nut_that')).toBe(0)
  })

  it('bước đã có lời thầy gỡ (sau lần em đọc) ⇒ phải đọc lời gỡ trước', async () => {
    const { d, bam, token } = await chuanBi()
    await quaHetCong(d, token)
    d.sql.prepare("INSERT INTO loi_go(id,bam,buoc,kieu,noi_dung,luc) VALUES('g1',?,0,'ngan','Đổi 5,6 lít ra mol trước',?)").run(bam, iso(1))
    const r = await em(d, '/hs/thang-go', { token, qid: QA.ds })
    expect(viec(r, 'khong_bua')?.viec).toBe('Em đọc lời thầy gỡ ở bước 1 trước')
    expect(await em(d, '/hs/gui-thay', { token, qid: QA.ds, buoc: 0, viet: '' })).toMatchObject({ ok: false })
    const doc = { giay: 10, suKien: [{ k: 'mo_buoc', y: '0', t: Date.now() + 120_000 }] }
    expect(viec(await em(d, '/hs/thang-go', { token, qid: QA.ds, dang: doc }), 'khong_bua')?.dat).toBe(true)
    await em(d, '/hs/doc-loi-giai', { token, qid: QA.ds, ...doc })
    expect(await em(d, '/hs/gui-thay', { token, qid: QA.ds, buoc: 0, viet: '' })).toMatchObject({ ok: true })
  })

  it('NỐI NHÁNH (02/10): đọc lời gỡ qua /hs/loi-go của Bàn gỡ nút thắt cũng tính là đã đọc', async () => {
    const { d, bam, token } = await chuanBi()
    await quaHetCong(d, token)
    d.sql.prepare("INSERT INTO loi_go(id,bam,buoc,kieu,noi_dung,luc) VALUES('g1',?,0,'ngan','Đổi 5,6 lít ra mol trước',?)").run(bam, iso(1))
    expect(viec(await em(d, '/hs/thang-go', { token, qid: QA.ds }), 'khong_bua')?.dat).toBe(false)
    expect(await em(d, '/hs/loi-go', { token, qid: QA.ds })).toMatchObject({ ok: true })
    expect(viec(await em(d, '/hs/thang-go', { token, qid: QA.ds }), 'khong_bua')?.dat).toBe(true)
  })
})

describe('luyện kiến thức nền — chấm máy chủ', () => {
  it('nạp ngân hàng cần mã bí mật của thầy', async () => {
    const { d } = await chuanBi()
    expect(await em(d, '/kho/nen/day', { cau: NGAN_HANG })).toMatchObject({ ok: false, error: 'Sai mã bí mật' })
  })

  it('lấy 3–5 câu KHÔNG đáp án; nộp: chấm máy chủ, ghi sổ nguồn nen (có hỗ trợ ⇒ không vào hàng chữa lỗi); trả lời giải sau khi nộp', async () => {
    const { d, token } = await chuanBi()
    expect(await thay(d, '/kho/nen/day', { cau: NGAN_HANG })).toMatchObject({ ok: true, soCau: 3 })
    expect(await thay(d, '/kho/nen/day', { cau: [{ ...NGAN_HANG[0], de: 'Đề sửa' }] })).toMatchObject({ ok: true, soCau: 1 })
    expect(d.dem('cau_nen')).toBe(3)
    const r = await em(d, '/hs/luyen-nen', { token, nhan: 'doi_mol_khoi_luong' })
    expect(r).toMatchObject({ ok: true, ten: 'Đổi số mol ↔ khối lượng' })
    const ds = r.cau as Record<string, unknown>[]
    expect(ds.map((c) => c.id)).toEqual(['doi_mol_khoi_luong-01', 'doi_mol_khoi_luong-02', 'doi_mol_khoi_luong-03'])
    expect(ds[0]).toEqual({ id: 'doi_mol_khoi_luong-01', muc: 1, kieu: 'so', de: 'Đề sửa' })
    expect(ds[1]).toMatchObject({ kieu: 'tn', pa: NGAN_HANG[1].pa })
    for (const cam of ['dap_an', 'dapAn', 'giai', 'meo', 'gia_tri']) expect(JSON.stringify(r)).not.toContain(cam)

    expect(await em(d, '/hs/luyen-nen/nop', { token, id: 'doi_mol_khoi_luong-01', traLoi: '0,3', qid: QA.ds })).toMatchObject({ ok: true, dung: false, dapAn: '0,2' })
    expect(await em(d, '/hs/luyen-nen/nop', { token, id: 'doi_mol_khoi_luong-01', traLoi: '0.2', qid: QA.ds })).toMatchObject({ ok: true, dung: true, giai: ['n = 11,7 : 58,5 = 0,2 mol'], meo: 'n = m : M' })
    expect(await em(d, '/hs/luyen-nen/nop', { token, id: 'doi_mol_khoi_luong-02', traLoi: 'B' })).toMatchObject({ ok: true, dung: true, dapAn: 'B. 15 gam' })
    expect(await em(d, '/hs/luyen-nen/nop', { token, id: 'khong-co', traLoi: '1' })).toMatchObject({ ok: false })
    expect(d.dem('su_kien_hoc', "nguon='nen' AND qid='nen:doi_mol_khoi_luong-01' AND ma_nguon='12-THU-A-II-4' AND assistance='assisted' AND purpose='luyen_nen'")).toBe(2)
    expect(d.dem('su_kien_hoc', "nguon='nen' AND ma_nguon='nen'")).toBe(1)
    // Câu nền sai không thành "câu sai cần làm lại" ở hàng chữa lỗi.
    expect([...(await docQidSaiV2(d.env as unknown as Env, 'E1')).keys()]).toEqual([])
    // Câu em đã làm đúng xếp sau.
    const lai = await em(d, '/hs/luyen-nen', { token, nhan: 'doi_mol_khoi_luong' })
    expect((lai.cau as { id: string }[]).map((c) => c.id)).toEqual(['doi_mol_khoi_luong-03', 'doi_mol_khoi_luong-01', 'doi_mol_khoi_luong-02'])
    expect(await em(d, '/hs/luyen-nen', { token, nhan: 'Nhan Sai' })).toMatchObject({ ok: false })
  })
})

// @vitest-environment node
// CHẤM BÙ Ở MÁY CHỦ (30/10 tối, thầy «nay có 5 bạn không chấm được bài») — server/src/cham-bu.ts.
//
// SỰ CỐ THẬT (ca 269333, đo chỉ-đọc .github/workflows/do-cham-bai-3010.yml): 5/32 lượt `tong` NULL. Cả 5 là lượt còn `dang_lam` khi thầy
// bấm Khoá ca (máy em nộp tự động lúc hết giờ hỏng vì D1 nghẽn) ⇒ `khoaCa` nộp hộ bằng bản lưu tạm và KHÔNG chấm; mọi đường ghi điểm còn
// lại là lệnh máy khách bắn-một-lần. Test chạy trên SQLite THẬT (`_d1-that.ts`): `chamDiem` thật ghi `luot`, `chi_tiet_cau`, `tien_do_*`.
import { beforeEach, describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { cronChamBu, xoaHenChamBu, GIO_CUA_SO_CHAM_BU, PHUT_CHO_CHAM_BU, type GhiDiemCa } from '../server/src/cham-bu'
import type { NganHangDapAn } from '../server/src/cham-lai-ca'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const MA = 'CB1'
const NOW = Date.parse('2026-10-30T12:30:00.000Z') // 19:30 VN
const iso = (phutTruoc: number) => new Date(NOW - phutTruoc * 60_000).toISOString()

const NH: NganHangDapAn = {
  phanI: [{ id: `${MA}-I-1`, text: 'I1', choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Este', mucDo: 'biet' }],
  phanII: [{ id: `${MA}-II-1`, text: 'II1', ideas: ['1', '2', '3', '4'], correct: ['D', 'S', 'D', 'S'], chuyenDe: 'Điện hoá', mucDo: 'hieu' }],
  phanIII: [{ id: `${MA}-III-1`, text: 'III1', correct: '0.54', chuyenDe: 'Este', mucDo: 'van_dung' }],
  soCau: { I: 1, II: 1, III: 1 },
}
const DUNG = { phanI: { [`${MA}-I-1`]: 'A' }, phanII: { [`${MA}-II-1`]: ['D', 'S', 'D', 'S'] }, phanIII: { [`${MA}-III-1`]: '0,540' } }

/** Ghi qua ĐÚNG đường thật `/cham-diem` (chamDiem) của Worker. */
const ghiQuaWorker: GhiDiemCa = async (env, b) => new Response(JSON.stringify(await goiWorker(worker, env, '/cham-diem', b, true)))

function dung(trangThaiCa = 'dong', capNhatCa = iso(10)): D1That {
  const d = taoD1That()
  d.sql
    .prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,so_cau_json,sinh_tai_d1,cap_nhat_luc) VALUES(?,?,?,?,?,?,1,?)')
    .run(MA, 'Ca chấm bù', trangThaiCa, 'thi', 'ca_lop_xong', JSON.stringify({ I: 1, II: 1, III: 1 }), capNhatCa)
  d.objects.set(`key/${MA}.json`, NH)
  return d
}
function themLuot(d: D1That, sbd: string, o: { tt?: string; nop?: string | null; tong?: number | null; dapAn?: unknown } = {}) {
  const tt = o.tt ?? 'da_nop'
  d.sql
    .prepare('INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,cap_nhat_luc,tong,dap_an_json) VALUES(?,?,?,?,?,?,?,?,?,?)')
    .run(`${MA}|${sbd}|1`, MA, sbd, 1, iso(60), o.nop === undefined ? iso(10) : o.nop, tt, iso(10), o.tong === undefined ? null : o.tong, JSON.stringify(o.dapAn ?? DUNG))
}
const diem = (d: D1That, sbd: string) => (d.sql.prepare('SELECT tong FROM luot WHERE ma_ca = ? AND sbd = ?').get(MA, sbd) as { tong: number | null }).tong
const soChiTiet = (d: D1That, sbd: string) => d.dem('chi_tiet_cau', `ma_ca = '${MA}' AND sbd = '${sbd}'`)

beforeEach(() => xoaHenChamBu())

describe('cron chấm bù — lượt đã nộp mà chưa có điểm', () => {
  it('chấm + ghi đủ (điểm, chi tiết câu) CHỈ lượt nộp ≥ 2 phút, trong 3 giờ, chưa có điểm; không đụng lượt đã có điểm / đang làm / quá cửa sổ', async () => {
    const d = dung()
    themLuot(d, 'CO_DIEM', { tong: 7 }) // đã có điểm (dù chấm lại ra 10) ⇒ GIỮ NGUYÊN
    themLuot(d, 'THIEU') // nộp 10 phút trước, chưa điểm ⇒ chấm bù
    themLuot(d, 'VUA_NOP', { nop: iso(PHUT_CHO_CHAM_BU - 1) }) // để đường máy em / máy thầy ghi trước
    themLuot(d, 'DANG_LAM', { tt: 'dang_lam', nop: null })
    themLuot(d, 'CU', { nop: iso(GIO_CUA_SO_CHAM_BU * 60 + 5) }) // ngoài cửa sổ ⇒ việc của `/ca/cham-bu` thầy bấm, không tự ghi
    const r = await cronChamBu(d.env, NOW, ghiQuaWorker)
    expect(r).toMatchObject({ soLuot: 1, soCa: 1, soGhi: 1, soTuChoi: 0, loi: 0 })
    expect(diem(d, 'THIEU')).toBe(10)
    expect(soChiTiet(d, 'THIEU')).toBe(3)
    expect(diem(d, 'CO_DIEM')).toBe(7)
    expect(soChiTiet(d, 'CO_DIEM')).toBe(0)
    expect(diem(d, 'VUA_NOP')).toBeNull()
    expect(diem(d, 'DANG_LAM')).toBeNull()
    expect(diem(d, 'CU')).toBeNull()
  })

  it('TÁI HIỆN SỰ CỐ 30/10: em còn đang làm lúc thầy Khoá ca ⇒ khoaCa nộp hộ bản lưu tạm, KHÔNG có điểm; 2 phút sau cron chấm bù xong', async () => {
    const d = dung('mo', iso(50))
    themLuot(d, 'NOP_KIP', { tong: 10 })
    themLuot(d, 'DANG_LAM', { tt: 'dang_lam', nop: null })
    const k = await goiWorker(worker, d.env, '/goi', { action: 'khoaCa', maCa: MA }, true)
    expect(k.ok).toBe(true)
    expect(k.soEmBiNop).toBe(1)
    expect(diem(d, 'DANG_LAM')).toBeNull() // khoaCa nộp hộ mà không chấm — đúng hiện trạng gây sự cố
    const nopLuc = Date.parse((d.sql.prepare('SELECT nop_luc FROM luot WHERE sbd = ?').get('DANG_LAM') as { nop_luc: string }).nop_luc)
    expect((await cronChamBu(d.env, nopLuc + 30_000, ghiQuaWorker)).soGhi).toBe(0) // chưa đủ 2 phút
    const r = await cronChamBu(d.env, nopLuc + (PHUT_CHO_CHAM_BU + 1) * 60_000, ghiQuaWorker)
    expect(r.soGhi).toBe(1)
    expect(diem(d, 'DANG_LAM')).toBe(10)
    expect(soChiTiet(d, 'DANG_LAM')).toBe(3)
  })

  it('không chấm được (bộ câu lệch bài làm) ⇒ KHÔNG ghi gì, hẹn 30 phút — phút sau không đọc lại ca', async () => {
    const d = dung()
    // Bản đồ đề riêng giao em câu không có trong tờ đáp án ⇒ lõi chấm từ chối (thieu_trong_kho).
    d.sql.prepare('UPDATE ca SET bo_theo_em_json = ? WHERE ma_ca = ?').run(JSON.stringify({ bo: { LECH: ['KHONG-CO-1', 'KHONG-CO-2', 'KHONG-CO-3'] } }), MA)
    themLuot(d, 'LECH')
    const r1 = await cronChamBu(d.env, NOW, ghiQuaWorker)
    expect(r1).toMatchObject({ soLuot: 1, soGhi: 0, soTuChoi: 1 })
    expect(diem(d, 'LECH')).toBeNull()
    expect(soChiTiet(d, 'LECH')).toBe(0)
    const truoc = d.soLenh.prepare
    const r2 = await cronChamBu(d.env, NOW + 60_000, ghiQuaWorker)
    expect(r2.soLuot).toBe(0)
    expect(d.soLenh.prepare - truoc).toBe(1) // chỉ câu tìm lượt
  })

  it('không có việc ⇒ ĐÚNG MỘT câu đọc (cron mỗi phút không thêm tải D1)', async () => {
    const d = dung()
    themLuot(d, 'CO_DIEM', { tong: 7 })
    const truoc = d.soLenh.prepare
    const r = await cronChamBu(d.env, NOW, ghiQuaWorker)
    expect(r.soLuot).toBe(0)
    expect(d.soLenh.prepare - truoc).toBe(1)
  })

  it('ghi lỗi (D1 nghẽn) ⇒ không ném ra cron, hẹn lại 3 phút rồi chấm được', async () => {
    const d = dung()
    themLuot(d, 'THIEU')
    const hong: GhiDiemCa = async () => { throw new Error('D1_ERROR: canceled') }
    const r1 = await cronChamBu(d.env, NOW, hong)
    expect(r1.loi).toBe(1)
    expect((await cronChamBu(d.env, NOW + 60_000, ghiQuaWorker)).soLuot).toBe(0) // đang hẹn
    const r3 = await cronChamBu(d.env, NOW + 4 * 60_000, ghiQuaWorker)
    expect(r3.soGhi).toBe(1)
    expect(diem(d, 'THIEU')).toBe(10)
  })
})

describe('/ca/cham-bu (lệnh thầy) — chấm bù một ca, xem trước rồi ghi', () => {
  it('xem trước KHÔNG ghi; ghi thì chỉ lượt chưa điểm (kể cả ngoài cửa sổ 3 giờ), không đụng điểm đã có', async () => {
    const d = dung()
    themLuot(d, 'CO_DIEM', { tong: 7 })
    themLuot(d, 'CU', { nop: iso(24 * 60) })
    const xt = await goiWorker(worker, d.env, '/ca/cham-bu', { maCa: MA, xemTruoc: true }, true)
    expect(xt).toMatchObject({ ok: true, xemTruoc: true, soCan: 1, soGhi: 0 })
    expect(xt.bai.map((x: { sbd: string }) => x.sbd)).toEqual(['CU'])
    expect(xt.bai[0].diem.tong).toBe(10)
    expect(diem(d, 'CU')).toBeNull()
    const ghi = await goiWorker(worker, d.env, '/ca/cham-bu', { maCa: MA }, true)
    expect(ghi).toMatchObject({ ok: true, soCan: 1, soGhi: 1 })
    expect(diem(d, 'CU')).toBe(10)
    expect(diem(d, 'CO_DIEM')).toBe(7)
  })

  it('cần mã bí mật của thầy', async () => {
    const d = dung()
    themLuot(d, 'CU')
    const r = await goiWorker(worker, d.env, '/ca/cham-bu', { maCa: MA }, false)
    expect(r.ok).toBe(false)
    expect(diem(d, 'CU')).toBeNull()
  })
})

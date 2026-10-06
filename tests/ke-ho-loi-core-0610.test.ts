// @vitest-environment node
// 06/10 — ba kẽ hở của lõi hàng chữa lỗi / kế hoạch ngày / rút đề ca (D1 thật bằng node:sqlite, lược đồ đủ migration):
//   (3) câu "Cần thầy dạy lại" (catTia) KHÔNG vào ô chữa lỗi của ca kiểm tra; sau "Chữa xong" thì được vào lại; thầy vẫn thấy số câu bị giữ lại.
//   (4) cùng ngày không quay lại game câu em vừa TỰ làm ở kênh khác `game` (kế hoạch chốt trong D1 giữ nguyên; câu ấy tính là đã xong ⇒ Rương không kẹt).
//   (5) câu TRÙNG NỘI DUNG khác mã (`content_group`) là MỘT câu: `docDaGap`, rút đề ca của một em, kế hoạch ngày.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { docHoSo2, layKeHoachHomNay, sanh2, ghiMocDayLai } from '../server/src/srs2-d1'
import { startDao2 } from '../server/src/srs2-game'
import { docDaGap, loiDenHan, loiTuHoSo } from '../server/src/rut-de-v2'
import { docNhomTheoQid as nhomNoiDungTheoQid } from '../server/src/nhom-noi-dung'
import { gvChienDich } from '../server/src/srs2-gv'
import { rutDeV2, type CauKhoV2 } from '../src/lib/rut-de-v2'

const cau = (qid: string, nhom = `g-${qid}`) => JSON.stringify({
  qid, maDe: 'DE1', lop: '12', version: 'v1', group: nhom, phan: 'I', text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'TH',
  sao: 1, kienThuc: ['k'], correct: 'B', reviewed: true, solution: { chot: `Cốt lõi ${qid}`, tungPa: {} },
})
function dung(qids: string[], nhomCua: Record<string, string> = {}) {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12A1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const q of qids) st.run('DE1', q, 'v1', nhomCua[q] ?? `g-${q}`, 'D1', cau(q, nhomCua[q] ?? `g-${q}`))
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  return { d, env }
}
type D = ReturnType<typeof taoD1That>
let dem = 0
const ghi = (d: D, qid: string, nguon: string, kq: number | null, ngay: string, them: { assistance?: string; purpose?: string; visibility?: string; maNguon?: string } = {}, gio = '03:00:00') =>
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,purpose,visibility) VALUES(?,?,?,?,?,1,?,?,?,?,?,?)')
    .run(`${nguon}|${qid}|${ngay}|${++dem}`, 'S1', qid, nguon, them.maNguon ?? 'M', kq, `${ngay}T${gio}.000Z`, ngay, them.assistance ?? null, them.purpose ?? null, them.visibility ?? null)

// =====================================================================================================
describe('việc 3 — câu "Cần thầy dạy lại" (catTia) không vào ô chữa lỗi của ca kiểm tra', () => {
  const NGAY = '2026-10-06'
  async function boCanh() {
    const { d, env } = dung(['X1', 'X2'])
    // X1: sai 4 lần tự làm (≥ NGUONG_CAT_TIA) và lần cuối vẫn sai ⇒ catTia. X2: sai 1 lần ⇒ lỗi thường đến hạn.
    for (const ng of ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']) ghi(d, 'X1', 'luyen', 0, ng)
    ghi(d, 'X2', 'luyen', 0, '2026-10-02')
    return { d, env }
  }

  it('hồ sơ: X1 là catTia; loiTuHoSo bỏ X1 nhưng vẫn giữ X2', async () => {
    const { env } = await boCanh()
    const hs = await docHoSo2(env, 'S1', NGAY)
    expect(hs.tt.get('X1')).toMatchObject({ catTia: true, thanhThao: false })
    expect(hs.loiV2?.has('X1')).toBe(true) // luật đóng lỗi vẫn thấy X1 là lỗi — chỉ ô chữa lỗi của ca mới không rút nó
    expect(loiTuHoSo(hs).map((l) => l.qid)).toEqual(['X2'])
  })

  it('/ca/loi-den-han: danh sách lỗi không có X1, và thầy vẫn thấy "canDayLai" = 1 (không mất thông tin)', async () => {
    const { env } = await boCanh()
    const r = await loiDenHan(env, { sbd: ['S1'], ngay: NGAY }) as { em: Record<string, { qid: string }[]>; canDayLai?: Record<string, string[]> }
    expect(r.em.S1!.map((l) => l.qid)).toEqual(['X2'])
    expect(r.canDayLai).toEqual({ S1: ['X1'] })
  })

  it('thầy bấm "Chữa xong" (mốc dạy lại) ⇒ hết catTia ⇒ X1 được rút vào ô chữa lỗi lại', async () => {
    const { env } = await boCanh()
    await ghiMocDayLai(env, 'S1', 'X1', '2026-10-05T03:00:00.000Z')
    const hs = await docHoSo2(env, 'S1', NGAY)
    expect(hs.tt.get('X1')?.catTia).toBe(false)
    expect(loiTuHoSo(hs).map((l) => l.qid).sort()).toEqual(['X1', 'X2'])
    const r = await loiDenHan(env, { sbd: ['S1'], ngay: NGAY }) as { canDayLai?: unknown }
    expect(r.canDayLai).toBeUndefined()
  })
})

// =====================================================================================================
describe('việc 4 — cùng ngày không quay lại game câu em vừa tự làm ở kênh khác', () => {
  const T0 = Date.parse('2026-09-30T07:59:00Z') // 14:59 Thứ Tư 30/09 giờ VN
  const HOM_NAY = '2026-09-30'
  async function boCanh(soCau = 8, nhomCua: Record<string, string> = {}) {
    const { d, env } = dung(Array.from({ length: soCau }, (_, i) => `Q${i + 1}`), nhomCua)
    const r = await gvChienDich(env, { action: 'tao', ten: 'Ester', lop: '12A1', maDe: ['DE1'], hanNop: '2026-10-04', raiDeu: false }, T0 - 86_400_000)
    d.sql.prepare('INSERT INTO srs2_ke_hoach(sbd,ngay,chien_dich_id,dao_json,doan_json,huyet_chien,tong,tao_luc) VALUES(?,?,?,?,?,0,4,?)')
      .run('S1', HOM_NAY, String(r.id), '["Q1","Q2","Q3","Q4"]', '[]', new Date(T0).toISOString())
    return { d, env }
  }
  const conDao = async (env: Env) => (await layKeHoachHomNay(env, 'S1', T0)).kh

  it('em làm Q2 ở Lên bảng (đúng) và Q3 ở Luyện (sai) hôm nay ⇒ Đảo không phát Q2/Q3; kế hoạch trong D1 giữ nguyên; tong và tiến độ tính đã xong', async () => {
    const { d, env } = await boCanh()
    ghi(d, 'Q2', 'len_bang', 1, HOM_NAY)
    ghi(d, 'Q3', 'luyen', 0, HOM_NAY)
    const kh = await conDao(env)
    expect(kh.conDao).toEqual(['Q1', 'Q4'])
    expect(kh.dao).toEqual(['Q1', 'Q2', 'Q3', 'Q4']) // kế hoạch giữ nguyên
    expect(kh.tong).toBe(4)
    const luot = await startDao2(env, 'S1', T0)
    expect((luot.questions as { qid: string }[]).map((q) => q.qid).sort()).toEqual(['Q1', 'Q4'])
    const raw = d.sql.prepare('SELECT dao_json FROM srs2_ke_hoach WHERE sbd = ?').get('S1') as { dao_json: string }
    expect(JSON.parse(raw.dao_json)).toEqual(['Q1', 'Q2', 'Q3', 'Q4']) // D1 không bị ghi đè
    expect(await sanh2(env, 'S1', T0)).toMatchObject({ theLuc: { con: 2, tong: 4 }, ruong: { daLam: 2, tong: 4, moDuoc: false } })
  })

  it('RƯƠNG không kẹt: Q1, Q4 làm ở kênh khác nốt ⇒ xong kế hoạch, mở được rương', async () => {
    const { d, env } = await boCanh()
    for (const q of ['Q1', 'Q2', 'Q3']) ghi(d, q, 'len_bang', 1, HOM_NAY)
    ghi(d, 'Q4', 'game', 1, HOM_NAY)
    expect(await sanh2(env, 'S1', T0)).toMatchObject({ theLuc: { con: 0, tong: 4 }, ruong: { daLam: 4, tong: 4, moDuoc: true } })
  })

  it('KHÔNG tính là đã làm: có gợi ý, đọc lời giải, bị che (ca chưa công bố), ngày khác, kết quả bỏ trống ở kênh không phải thi', async () => {
    const { d, env } = await boCanh()
    ghi(d, 'Q1', 'luyen', 1, HOM_NAY, { assistance: 'assisted' })
    ghi(d, 'Q2', 'luyen', 1, HOM_NAY, { purpose: 'xem_loi_giai' })
    ghi(d, 'Q3', 'len_bang', 1, HOM_NAY, { visibility: 'embargoed' })
    ghi(d, 'Q4', 'luyen', 1, '2026-09-29')
    ghi(d, 'Q1', 'luyen', null, HOM_NAY)
    expect((await conDao(env)).conDao).toEqual(['Q1', 'Q2', 'Q3', 'Q4'])
  })

  it('ca kiểm tra: chỉ khi ĐÃ công bố mới tính; câu bản song sinh (~ss) quy về câu gốc', async () => {
    const { d, env } = await boCanh()
    d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cong_bo,cap_nhat_luc) VALUES('CA1','Ca 1','dong','khong','x'),('CA2','Ca 2','dong','ngay','x')")
    ghi(d, 'Q1', 'thi', 1, HOM_NAY, { maNguon: 'CA1' }) // chưa công bố
    ghi(d, 'Q2', 'thi', 1, HOM_NAY, { maNguon: 'CA2' }) // đã công bố
    ghi(d, 'Q3', 'thi', null, HOM_NAY, { maNguon: 'CA2' }) // bỏ trống ở ca thi = đã gặp, không làm
    ghi(d, 'Q4~ss0', 'len_bang', 1, HOM_NAY)
    expect((await conDao(env)).conDao).toEqual(['Q1'])
  })
})

// =====================================================================================================
describe('việc 5 — câu trùng nội dung khác mã là MỘT câu', () => {
  it('(a) docDaGap: mọi qid cùng content_group chung MỘT mốc (MAX ngày); câu khác nhóm / không có bản ghi giữ nguyên', async () => {
    const { d, env } = dung(['A1', 'A2', 'B1'], { A2: 'g-A1' })
    ghi(d, 'A1', 'luyen', 1, '2026-10-01')
    ghi(d, 'A2', 'luyen', 1, '2026-09-20')
    ghi(d, 'ZZ', 'luyen', 1, '2026-10-02') // không có bản ghi game_v2_question ⇒ không đoán
    ghi(d, 'B1', 'luyen', 1, '2026-09-10')
    const r = await docDaGap(env, ['S1'], '2026-10-06', null)
    expect(r.S1).toMatchObject({ A1: '2026-10-01', A2: '2026-10-01', B1: '2026-09-10', ZZ: '2026-10-02' })
    // bó theo qid: hỏi riêng A2 vẫn thấy mốc của bản trùng A1
    const rieng = await docDaGap(env, ['S1'], '2026-10-06', ['A2'])
    expect(rieng.S1!.A2).toBe('2026-10-01')
    expect(rieng.S1!.B1).toBeUndefined()
  })

  it('nhomNoiDungTheoQid: chỉ trả qid có nhóm khác rỗng', async () => {
    const { env } = dung(['A1', 'A2'], { A2: 'g-A1' })
    const m = await nhomNoiDungTheoQid(env, ['A1', 'A2', 'ZZ'])
    expect(Object.fromEntries(m)).toEqual({ A1: 'g-A1', A2: 'g-A1' })
  })

  it('(b) rút đề ca của MỘT em không đưa hai câu cùng nhóm; không có nhóm ⇒ coi là khác nhau', () => {
    const kho: CauKhoV2[] = ['A1', 'A2', 'B1', 'C1', 'C2'].map((id) => ({ id, phan: 'I', mucDo: 'hieu', dang: 'D0', lyThuyet: false }))
    const nhomTrung = { A1: 'gA', A2: 'gA' } // B1, C1, C2: không có nhóm
    const dsPhan = (kq: ReturnType<typeof rutDeV2>) => kq.theoEm.S1!.map((x) => x.qid)
    const co = rutDeV2({ kho, soCau: { I: 4, II: 0, III: 0 }, dsSbd: ['S1'], hoSo: {}, ngay: '2026-10-06', cheDo: 'ca', seed: 'CA1', nhomTrung })
    const ds = dsPhan(co)
    expect(ds).toHaveLength(4) // 5 câu − 1 bản trùng = đúng 4 câu dùng được
    expect(ds.includes('A1') && ds.includes('A2')).toBe(false)
    const khong = rutDeV2({ kho, soCau: { I: 5, II: 0, III: 0 }, dsSbd: ['S1'], hoSo: {}, ngay: '2026-10-06', cheDo: 'ca', seed: 'CA1' })
    expect(dsPhan(khong)).toHaveLength(5) // không truyền nhóm ⇒ y như cũ
  })

  it('(b) ô chữa lỗi: lỗi A1 đã chiếm chỗ ⇒ câu ô còn lại không phải bản trùng A2; câu đã gặp tính theo nhóm', () => {
    const kho: CauKhoV2[] = ['A1', 'A2', 'B1', 'B2'].map((id) => ({ id, phan: 'I', mucDo: 'hieu', dang: 'D0', lyThuyet: false }))
    const nhomTrung = { A1: 'gA', A2: 'gA' }
    const kq = rutDeV2({
      kho, soCau: { I: 3, II: 0, III: 0 }, dsSbd: ['S1'], ngay: '2026-10-06', cheDo: 'ca', seed: 'CA1', nhomTrung,
      hoSo: { S1: { loi: [{ qid: 'A1', denHan: '2026-10-05', trangThai: 'mo' }], daGap: { A1: '2026-10-01' } } },
    })
    const ds = kq.theoEm.S1!.map((x) => x.qid)
    expect(ds).toContain('A1')
    expect(ds).not.toContain('A2')
    // câu bản trùng của câu em vừa gặp không ra như "câu mới": A2 đã gặp theo nhóm
    const moi = rutDeV2({
      kho: [{ id: 'A2', phan: 'I', mucDo: 'hieu', dang: 'D0', lyThuyet: false }, { id: 'B1', phan: 'I', mucDo: 'hieu', dang: 'D0', lyThuyet: false }],
      soCau: { I: 1, II: 0, III: 0 }, dsSbd: ['S1'], ngay: '2026-10-06', cheDo: 'ca', seed: 'CA1', nhomTrung,
      hoSo: { S1: { loi: [], daGap: { A1: '2026-10-01' } } },
    })
    expect(moi.theoEm.S1![0]).toMatchObject({ qid: 'B1', bac: 'moi' })
  })

  it('(c) kế hoạch ngày: hai câu cùng nhóm ⇒ chỉ giữ câu đứng trước; tong và tiến độ theo đó; D1 giữ nguyên', async () => {
    const T0 = Date.parse('2026-09-30T07:59:00Z')
    const { d, env } = dung(['Q1', 'Q2', 'Q3', 'Q4'], { Q3: 'g-Q2' })
    const r = await gvChienDich(env, { action: 'tao', ten: 'Ester', lop: '12A1', maDe: ['DE1'], hanNop: '2026-10-04', raiDeu: false }, T0 - 86_400_000)
    d.sql.prepare('INSERT INTO srs2_ke_hoach(sbd,ngay,chien_dich_id,dao_json,doan_json,huyet_chien,tong,tao_luc) VALUES(?,?,?,?,?,0,4,?)')
      .run('S1', '2026-09-30', String(r.id), '["Q1","Q2","Q3","Q4"]', '[]', new Date(T0).toISOString())
    const kh = (await layKeHoachHomNay(env, 'S1', T0)).kh
    expect(kh.conDao).toEqual(['Q1', 'Q2', 'Q4'])
    expect(kh.dao).toEqual(['Q1', 'Q2', 'Q4'])
    expect(kh.tong).toBe(3)
    expect((await startDao2(env, 'S1', T0)).questions as unknown[]).toHaveLength(3)
    const raw = d.sql.prepare('SELECT dao_json FROM srs2_ke_hoach WHERE sbd = ?').get('S1') as { dao_json: string }
    expect(JSON.parse(raw.dao_json)).toEqual(['Q1', 'Q2', 'Q3', 'Q4'])
  })

  it('(c) bản trùng của câu đã làm xong trong game hôm nay cũng không ra thêm; cùng qid lần 2 (#2) thì KHÔNG bị coi là trùng', async () => {
    const T0 = Date.parse('2026-09-30T07:59:00Z')
    const { d, env } = dung(['Q1', 'Q2', 'Q3'], { Q3: 'g-Q2' })
    const r = await gvChienDich(env, { action: 'tao', ten: 'Ester', lop: '12A1', maDe: ['DE1'], hanNop: '2026-10-04', raiDeu: false }, T0 - 86_400_000)
    d.sql.prepare('INSERT INTO srs2_ke_hoach(sbd,ngay,chien_dich_id,dao_json,doan_json,huyet_chien,tong,tao_luc) VALUES(?,?,?,?,?,0,4,?)')
      .run('S1', '2026-09-30', String(r.id), '["Q1","Q2","Q3","Q1#2"]', '[]', new Date(T0).toISOString())
    ghi(d, 'Q2', 'game', 1, '2026-09-30')
    const kh = (await layKeHoachHomNay(env, 'S1', T0)).kh
    expect(kh.conDao).toEqual(['Q1', 'Q1#2'])
    expect(kh.tong).toBe(3) // Q1, Q2 (đã làm), Q1#2; Q3 là bản trùng của Q2 đã làm ⇒ bỏ
  })
})

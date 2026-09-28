// @vitest-environment node
// SỬA CHIẾN DỊCH ĐANG MỞ (thầy 28/09): "thêm đề, thêm bớt học sinh, chỉnh lại hạn; lưu lại thì phân bổ lại số câu nếu thêm đề".
// Máy chủ `server/src/srs2-sua.ts` (`POST /gv/chien-dich/sua`, sau cổng thầy) chạy THẬT trên SQLite lược đồ thật (`_d1-that`).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { gvSuaChienDich } from '../server/src/srs2-sua'
import { docChienDichCuaEm, docHoSo2, layKeHoachHomNay, qidGoc } from '../server/src/srs2-d1'
import { chuTomTatSua } from '../src/lib/tom-tat-sua-chien-dich'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-09-30T02:00:00Z') // 09:00 VN 30/09
const GIO = 3_600_000
const HOM_NAY = '2026-09-30'
const cau = (qid: string, ma: string, tuLuan = false) => JSON.stringify({
  qid, maDe: ma, version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: [],
  hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'NB', sao: 1, kienThuc: ['k'], correct: 'B', reviewed: true, solution: { chot: 'c' }, ...(tuLuan ? { kieu: 'tu_luan' } : {}),
})

function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12','x'),('S2','Bảo','12','x'),('S3','Chi','12','x'),('S4','Dũng','12','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x')`)
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= 6; i++) st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, 'D1', cau(`Q${i}`, 'DE1'))
  // DE2: Q1 TRÙNG với DE1, Q7 + Q8 mới, Q9 TỰ LUẬN (không bao giờ vào chiến dịch).
  st.run('DE2', 'Q1', 'v1', 'g-Q1', 'D1', cau('Q1', 'DE2'))
  st.run('DE2', 'Q7', 'v1', 'g-Q7', 'D1', cau('Q7', 'DE2'))
  st.run('DE2', 'Q8', 'v1', 'g-Q8', 'D1', cau('Q8', 'DE2'))
  st.run('DE2', 'Q9', 'v1', 'g-Q9', 'D1', cau('Q9', 'DE2', true))
  let k = 0
  const lam = (sbd: string, qid: string, ms: number, dung = true) =>
    d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES (?,?,?,'game','G',1,?,30,?,?)")
      .run(`k${++k}`, sbd, qid, dung ? 1 : 0, new Date(ms).toISOString(), new Date(ms + 7 * GIO).toISOString().slice(0, 10))
  const dem = (bang: string) => (d.sql.prepare(`SELECT COUNT(*) AS n FROM ${bang}`).get() as { n: number }).n
  return { d, env, lam, dem }
}
const tao = async (env: Env, sbd: string[], maDe: string[], hanNop = '2026-10-05', nowMs = T0) =>
  ((await gvChienDich(env, { action: 'tao', ten: 'Luyện chương 1', sbd, maDe, hanNop }, nowMs)) as { id: string }).id
const hang = (d: ReturnType<typeof dung>['d'], id: string) => d.sql.prepare('SELECT * FROM chien_dich WHERE id = ?').get(id) as Record<string, string>

describe('tóm tắt thay đổi', () => {
  it('"+2 đề, +3 em, −1 em, hạn 30/09 → 05/10"; không đổi gì ⇒ rỗng', () => {
    expect(chuTomTatSua({ themDe: 2, themEm: 3, botEm: 1, hanCu: '2026-09-30', hanMoi: '2026-10-05' })).toBe('+2 đề, +3 em, −1 em, hạn 30/09 → 05/10')
    expect(chuTomTatSua({ themDe: 0, themEm: 0, botEm: 0, hanCu: '2026-09-30', hanMoi: '2026-09-30' })).toBe('')
  })
})

describe('thêm đề ⇒ phân bổ lại số câu', () => {
  it('câu mới nối sau câu cũ, bỏ trùng + bỏ TỰ LUẬN; câu em đã làm giữ nguyên; sổ làm bài không mất dòng nào', async () => {
    const { d, env, lam, dem } = dung()
    const id = await tao(env, ['S1', 'S2'], ['DE1'])
    lam('S1', 'Q1', T0 + GIO)
    lam('S1', 'Q2', T0 + GIO, false)
    const soTruoc = dem('su_kien_hoc')

    const xem = await gvSuaChienDich(env, { action: 'xem-truoc', id, themMaDe: ['DE2'] }, T0 + 2 * GIO)
    expect(xem).toMatchObject({ ok: true, soCauCu: 6, soCauThem: 2, soCauSau: 8, soCauTheoTo: { DE2: 2 }, tomTat: '+1 đề' })
    expect(JSON.parse(hang(d, id).qid_json)).toHaveLength(6) // xem trước KHÔNG ghi

    const r = await gvSuaChienDich(env, { action: 'luu', id, themMaDe: ['DE2'] }, T0 + 2 * GIO)
    expect(r).toMatchObject({ ok: true, soCauThem: 2, soCauSau: 8 })
    const row = hang(d, id)
    expect(JSON.parse(row.qid_json)).toEqual(['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'])
    expect(JSON.parse(row.qid_json)).not.toContain('Q9')
    expect(JSON.parse(row.ma_de_json)).toEqual(['DE1', 'DE2'])
    expect(dem('su_kien_hoc')).toBe(soTruoc)

    // Tiến độ của S1 giữ nguyên: Q1, Q2 đã làm (không phải câu mới); 6 câu còn lại là câu mới.
    const hs = await docHoSo2(env, 'S1', HOM_NAY)
    expect(hs.chienDich?.id).toBe(id)
    expect(hs.ttChienDich).toHaveLength(8)
    expect(hs.tt.get('Q1')!.laMoi).toBe(false)
    expect(hs.tt.get('Q2')!.laMoi).toBe(false)
    expect(['Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'].every((q) => hs.tt.get(q)!.laMoi)).toBe(true)
    expect(hs.cau.map((c) => c.qid)).not.toContain('Q9')
  })

  it('kế hoạch hôm nay đã chốt được LẬP LẠI theo đúng thuật toán (giống hệt chiến dịch giao từ đầu với đủ đề), giữ câu đã làm hôm nay', async () => {
    const { d, env, lam } = dung()
    const id = await tao(env, ['S1', 'S2'], ['DE1'])
    const truoc = await layKeHoachHomNay(env, 'S2', T0 + GIO)
    expect(truoc.kh.chienDichId).toBe(id)
    // S1 mở, làm câu đầu tiên của kế hoạch.
    const kh1 = (await layKeHoachHomNay(env, 'S1', T0 + GIO)).kh
    const dauTien = qidGoc([...kh1.dao, ...kh1.doan][0]!)
    d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES ('x1','S1',?,'game','G',1,1,30,?,?)")
      .run(dauTien, new Date(T0 + GIO + 60_000).toISOString(), HOM_NAY)
    void lam

    await gvSuaChienDich(env, { action: 'luu', id, themMaDe: ['DE2'] }, T0 + 2 * GIO)
    expect((d.sql.prepare("SELECT chien_dich_id FROM srs2_ke_hoach WHERE sbd='S2'").get() as { chien_dich_id: string }).chien_dich_id).toBe(`${id}#sua`)

    // S2 (chưa làm gì): kế hoạch mới = kế hoạch của một em mới toanh nhận chiến dịch DE1+DE2 cùng hạn.
    const sau = await layKeHoachHomNay(env, 'S2', T0 + 3 * GIO)
    expect(sau.kh.chienDichId).toBe(id)
    const idMau = await tao(env, ['S4'], ['DE1', 'DE2'], '2026-10-05', T0 + 3 * GIO)
    const mau = await layKeHoachHomNay(env, 'S4', T0 + 3 * GIO)
    expect(mau.kh.chienDichId).toBe(idMau)
    const tap = (k: { dao: string[]; doan: string[] }) => [...k.dao, ...k.doan].map(qidGoc).sort()
    expect(tap(sau.kh)).toEqual(tap(mau.kh))
    expect(sau.kh.tong).toBeGreaterThanOrEqual(truoc.kh.tong)
    expect(tap(sau.kh)).not.toContain('Q9')

    // S1: câu đã làm hôm nay vẫn đứng trong kế hoạch (đã xong, trừ vào lượt) — không mất.
    const s1 = await layKeHoachHomNay(env, 'S1', T0 + 3 * GIO)
    expect(s1.kh.chienDichId).toBe(id)
    expect([...s1.kh.dao, ...s1.kh.doan]).toContain(dauTien)
    expect([...s1.kh.conDao, ...s1.kh.conDoan]).not.toContain(dauTien)
  })

  it('tờ chỉ có câu trùng / tự luận ⇒ báo không có câu mới, không ghi', async () => {
    const { d, env } = dung()
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE3', 'Q9', 'v1', 'g-Q9', 'D1', cau('Q9', 'DE3', true))
    const id = await tao(env, ['S1'], ['DE1'])
    const r = await gvSuaChienDich(env, { id, themMaDe: ['DE3'] }, T0 + GIO)
    expect(r.ok).toBe(false)
    expect(String(r.error)).toMatch(/không có câu mới/)
    expect(JSON.parse(hang(d, id).qid_json)).toHaveLength(6)
  })
})

describe('thêm / bớt em', () => {
  it('em mới được chia câu như giao từ đầu (lần làm TRƯỚC lúc được thêm không tính); bớt em ⇒ ẩn chiến dịch, sổ còn nguyên; thêm lại ⇒ giữ tiến độ', async () => {
    const { d, env, lam, dem } = dung()
    const id = await tao(env, ['S1', 'S2'], ['DE1'])
    lam('S2', 'Q1', T0 + GIO)
    lam('S3', 'Q3', T0 + GIO) // S3 làm Q3 (nguồn khác) TRƯỚC khi được thêm
    const soSo = dem('su_kien_hoc')

    const r = await gvSuaChienDich(env, { id, themSbd: ['S3', 'S1'], botSbd: ['S2'] }, T0 + 2 * GIO)
    expect(r).toMatchObject({ ok: true, themSbd: ['S3'], botSbd: ['S2'], soEmSau: 2, tomTat: '+1 em, −1 em' })
    expect(JSON.parse(hang(d, id).sbd_json)).toEqual(['S1', 'S3'])

    // S3: mọi câu là câu MỚI (Q3 làm trước lúc thêm không tính); làm sau lúc thêm thì tính.
    lam('S3', 'Q4', T0 + 3 * GIO)
    const hs3 = await docHoSo2(env, 'S3', HOM_NAY)
    expect(hs3.chienDich?.id).toBe(id)
    expect(hs3.tt.get('Q3')!.laMoi).toBe(true)
    expect(hs3.tt.get('Q4')!.laMoi).toBe(false)
    const kh3 = await layKeHoachHomNay(env, 'S3', T0 + 3 * GIO)
    expect(kh3.kh.chienDichId).toBe(id)
    expect(kh3.kh.tong).toBeGreaterThan(0)
    // Bảng chiến dịch của thầy dùng cùng mốc: S3 đã làm qua đúng 1 câu.
    const b = await gvChienDich(env, { action: 'bang', id }, T0 + 3 * GIO) as { em: { sbd: string; coXat: number }[] }
    expect(b.em.find((e) => e.sbd === 'S3')?.coXat).toBe(1)

    // S2: không còn thấy chiến dịch, sổ làm bài giữ nguyên.
    expect(await docChienDichCuaEm(env, 'S2')).toHaveLength(0)
    expect((await docHoSo2(env, 'S2', HOM_NAY)).chienDich).toBeNull()
    expect(dem('su_kien_hoc')).toBe(soSo + 1)

    // Thêm lại S2 ⇒ giữ mốc giao từ đầu: Q1 đã làm vẫn tính.
    await gvSuaChienDich(env, { id, themSbd: ['S2'] }, T0 + 4 * GIO)
    const hs2 = await docHoSo2(env, 'S2', HOM_NAY)
    expect(hs2.chienDich?.id).toBe(id)
    expect(hs2.tt.get('Q1')!.laMoi).toBe(false)
  })

  it('không được bớt hết em', async () => {
    const { env } = dung()
    const id = await tao(env, ['S1'], ['DE1'])
    expect(await gvSuaChienDich(env, { id, botSbd: ['S1'] }, T0 + GIO)).toMatchObject({ ok: false, error: 'Chiến dịch phải còn ít nhất một em.' })
  })
})

describe('sửa hạn', () => {
  it('hạn mới phải ≥ hôm nay; lùi hạn ghi đúng; không đổi gì ⇒ báo', async () => {
    const { d, env } = dung()
    const id = await tao(env, ['S1'], ['DE1'])
    expect(await gvSuaChienDich(env, { id, hanNop: '2026-09-29' }, T0)).toMatchObject({ ok: false, error: 'Hạn nộp mới phải từ hôm nay trở đi.' })
    expect(await gvSuaChienDich(env, { id, hanNop: '2026-10-05' }, T0)).toMatchObject({ ok: false, error: 'Chưa có thay đổi nào.' })
    expect(await gvSuaChienDich(env, { id, hanNop: '2026-09-30' }, T0)).toMatchObject({ ok: true, hanNop: '2026-09-30', moLai: false, tomTat: 'hạn 05/10 → 30/09' })
    expect(hang(d, id).han_nop).toBe('2026-09-30')
  })

  it('chiến dịch đã hết hạn (hoặc đã kết thúc): sửa hạn = MỞ LẠI; chưa chọn hạn mới thì không thêm đề được; đã huỷ ⇒ từ chối', async () => {
    const { d, env } = dung()
    const id = await tao(env, ['S1'], ['DE1'], '2026-10-01')
    const sau = Date.parse('2026-10-03T02:00:00Z')
    expect((await docHoSo2(env, 'S1', '2026-10-03')).chienDich).toBeNull()
    expect((await gvSuaChienDich(env, { id, themMaDe: ['DE2'] }, sau)).ok).toBe(false)
    expect(await gvSuaChienDich(env, { id, hanNop: '2026-10-08', themMaDe: ['DE2'] }, sau)).toMatchObject({ ok: true, moLai: true, soCauThem: 2 })
    expect(hang(d, id).trang_thai).toBe('dang_chay')
    expect((await docHoSo2(env, 'S1', '2026-10-03')).chienDich?.id).toBe(id)

    await gvChienDich(env, { action: 'dong', id }, sau)
    expect(hang(d, id).trang_thai).toBe('da_dong')
    expect(await gvSuaChienDich(env, { id, hanNop: '2026-10-09' }, sau)).toMatchObject({ ok: true, moLai: true })
    expect(hang(d, id).trang_thai).toBe('dang_chay')
    expect(hang(d, id).dong_luc).toBeNull()

    await gvChienDich(env, { action: 'huy', id }, sau)
    expect((await gvSuaChienDich(env, { id, hanNop: '2026-10-10' }, sau)).ok).toBe(false)
  })
})

describe('nhật ký + quyền', () => {
  it('mỗi lần lưu ghi một dòng nhật ký (ai, lúc nào, đổi gì); `doc` trả nhật ký', async () => {
    const { d, env } = dung()
    const id = await tao(env, ['S1'], ['DE1'])
    await gvSuaChienDich(env, { id, themMaDe: ['DE2'], themSbd: ['S2'], hanNop: '2026-10-07', nguoi: 'thầy Học' }, T0 + GIO)
    const nk = d.sql.prepare('SELECT * FROM chien_dich_sua WHERE chien_dich_id = ?').all(id) as Record<string, string>[]
    expect(nk).toHaveLength(1)
    expect(nk[0]).toMatchObject({ ai: 'thầy Học', tom_tat: '+1 đề, +1 em, hạn 05/10 → 07/10', luc: new Date(T0 + GIO).toISOString() })
    expect(JSON.parse(nk[0]!.thay_doi_json)).toMatchObject({ themMaDe: ['DE2'], soCauThem: 2, themSbd: ['S2'], hanCu: '2026-10-05', hanMoi: '2026-10-07' })
    const doc = await gvSuaChienDich(env, { action: 'doc', id }, T0 + GIO)
    expect(doc).toMatchObject({ ok: true, chienDich: { sbd: ['S1', 'S2'], hanNop: '2026-10-07', soCau: 8 }, nhatKy: [{ ai: 'thầy Học' }] })
    // Không gửi đáp án/lời giải về.
    expect(JSON.stringify(doc)).not.toMatch(/correct|solution/)
  })

  it('không phải thầy (không mã bí mật) ⇒ 403, chiến dịch không đổi; có mã ⇒ lưu được', async () => {
    const { d, env } = dung()
    const id = await tao(env, ['S1'], ['DE1'])
    const truoc = JSON.stringify(hang(d, id))
    const r = await goiWorker(worker, env, '/gv/chien-dich/sua', { id, themMaDe: ['DE2'], hanNop: '2026-10-09' }, false)
    expect(r).toMatchObject({ ok: false, error: 'Sai mã bí mật' })
    expect(JSON.stringify(hang(d, id))).toBe(truoc)
    const ok = await goiWorker(worker, env, '/gv/chien-dich/sua', { id, themSbd: ['S2'] }, true)
    expect(ok).toMatchObject({ ok: true, themSbd: ['S2'] })
  })

  it('đường `/gv/chien-dich/sua` nằm SAU cổng laThay trong mã nguồn', () => {
    const src = readFileSync('server/src/index.ts', 'utf8')
    const iGate = src.indexOf('if (!laThay(req, env, b))')
    expect(iGate).toBeGreaterThan(0)
    expect(src.indexOf("p === '/gv/chien-dich/sua'")).toBeGreaterThan(iGate)
  })
})

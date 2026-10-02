// @vitest-environment node
// Vòng học v2 — hàng chữa lỗi (thầy 02/10: "đảm bảo tất cả các câu sai phải được xử lý triệt để", "chỉ tính từ 29/09").
// Nguồn thứ 4 của kế hoạch ngày: câu sai TỰ LÀM ở MỌI kênh từ 29/09 ⇒ nợ; luật đóng lỗi chung; làm lại bằng câu song sinh.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { docHoSo2, docKeHoachDaChot } from '../server/src/srs2-d1'
import { napDayDuMem } from '../server/src/game-v2-bank'
import { publicQuestion } from '../src/game/than-thu-v2/core'
import type { Env } from '../server/src/kieu'
import { damBaoBangBoTro } from '../server/src/cau-bo-tro'
import { damBaoBangLoiGiai } from '../server/src/loi-giai'

const cau = (qid: string) => JSON.stringify({
  qid, maDe: 'DE9', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu gốc ${qid}`, choices: ['a', 'b', 'c', 'd'], hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'TH',
  correct: 'B', reviewed: true, solution: { chot: 'Bảo toàn khối lượng' },
})
const SS = [
  { de: 'Song sinh 0: tính m', pa: { A: '1,2', B: '2,4', C: '3,6', D: '4,8' }, dap_an: 'C', buoc: ['n = 0,1', 'm = 3,6'], gia_tri_dung: '3.6' },
  { de: 'Song sinh 1: tính m', pa: { A: '5,0', B: '6,0', C: '7,0', D: '8,0' }, dap_an: 'A', buoc: ['n = 0,2', 'm = 5,0'], gia_tri_dung: '5' },
]
async function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const q of ['X1', 'X2', 'X3', 'X4']) st.run('DE9', q, 'v1', `g-${q}`, 'D1', cau(q))
  await damBaoBangLoiGiai(env); await damBaoBangBoTro(env)
  d.sql.prepare("INSERT INTO loi_giai_cau(qid,bam,ma_de,dang,cap_nhat_luc) VALUES('X1','BAM1','DE9','tn','x')").run()
  d.sql.prepare("INSERT INTO cau_bo_tro(bam,qid_mau,song_sinh_json,cau_kiem_json,nhan_nen_json,buoc_json,cap_nhat_luc) VALUES('BAM1','X1',?,'[]','[]','[]','x')").run(JSON.stringify(SS))
  return { d, env }
}
const ghi = (d: ReturnType<typeof taoD1That>, qid: string, nguon: string, kq: number | null, ngay: string, them: { assistance?: string; purpose?: string } = {}) =>
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,purpose) VALUES(?,?,?,?,?,1,?,?,?,?,?)')
    .run(`${nguon}|${qid}|${ngay}|${Math.random()}`, 'S1', qid, nguon, 'M', kq, `${ngay}T03:00:00.000Z`, ngay, them.assistance ?? null, them.purpose ?? null)

describe('hàng chữa lỗi — nguồn thứ 4 + luật chung + song sinh', () => {
  it('chỉ chọn biến thể đủ dữ kiện; biến thể thiếu bảng không làm vòng sửa sai kẹt mãi', async () => {
    const { d, env } = await dung()
    const thieu = { ...SS[0], de: 'Cho các giá trị trong bảng sau. Tính m.' }
    d.sql.prepare("UPDATE cau_bo_tro SET song_sinh_json=? WHERE bam='BAM1'").run(JSON.stringify([thieu, SS[1]]))
    ghi(d, 'X1', 'luyen', 0, '2026-09-30')
    expect((await docHoSo2(env, 'S1', '2026-10-01')).songSinhCho?.get('X1')).toBe(1)
    d.sql.prepare("UPDATE cau_bo_tro SET song_sinh_json=? WHERE bam='BAM1'").run(JSON.stringify([thieu, thieu]))
    expect((await docHoSo2(env, 'S1', '2026-10-01')).songSinhCho?.has('X1')).toBe(false)
  })
  it('làm biến thể xong thì hết câu ôn cuối; cộng cả gốc và hai biến thể đúng ngày, đúng em', async () => {
    const { d, env } = await dung()
    const ngay = '2026-10-02', now = Date.parse(`${ngay}T08:00:00Z`)
    d.sql.prepare('INSERT INTO srs2_ke_hoach(sbd,ngay,dao_json,doan_json,huyet_chien,tong,tao_luc) VALUES(?,?,?,?,0,3,?)')
      .run('S1', ngay, '["X2"]', '["X1","X1#2"]', new Date(now).toISOString())
    ghi(d, 'X1~ss0', 'game', 1, ngay)
    expect((await docKeHoachDaChot(env, 'S1', now))?.conDoan).toEqual(['X1#2'])
    ghi(d, 'X1~ss1', 'game', 0, ngay)
    const kh = await docKeHoachDaChot(env, 'S1', now)
    expect(kh?.conDoan).toEqual([])
    expect(kh?.conDao).toEqual(['X2'])
    expect(kh?.tong).toBe(3)
    expect((await docKeHoachDaChot(env, 'S1', now + 86400000))).toBeNull()
  })
  it('sai tự làm ở kênh bất kỳ từ 29/09 ⇒ vào nợ; trước 29/09, có hỗ trợ, đọc lời giải ⇒ không', async () => {
    const { d, env } = await dung()
    ghi(d, 'X1', 'luyen', 0, '2026-09-30')
    ghi(d, 'X2', 'luyen', 0, '2026-09-27')
    ghi(d, 'X3', 'game', 0, '2026-09-30', { assistance: 'assisted' })
    ghi(d, 'X4', 'on_lai', 0, '2026-09-30', { purpose: 'xem_loi_giai' })
    const hs = await docHoSo2(env, 'S1', '2026-10-01')
    expect([...(hs.qidSaiV2 ?? [])]).toEqual(['X1'])
    expect(hs.cau.find((c) => c.qid === 'X1')).toMatchObject({ nguon: 'no_cu' })
    expect(hs.tt.get('X1')).toMatchObject({ thanhThao: false, henOn: '2026-10-01' })
    expect(hs.loiV2?.get('X1')).toMatchObject({ trangThai: 'mo', nenSongSinh: true })
    expect(hs.songSinhCho?.get('X1')).toBe(0)
  })

  it('kho game phục vụ song sinh theo qid ảo: đề/phương án/đáp án của song sinh, đáp án không ra máy em', async () => {
    const { env } = await dung()
    const m = await napDayDuMem(env, [{ maDe: 'DE9', qid: 'X1~ss1', version: 'v1' }, { maDe: 'DE9', qid: 'X2', version: 'v1' }])
    const ss = m.get('DE9|X1~ss1|v1')!
    expect(ss).toMatchObject({ qid: 'X1~ss1', text: 'Song sinh 1: tính m', choices: ['5,0', '6,0', '7,0', '8,0'], correct: 'A', hinhAnh: [] })
    expect(m.get('DE9|X2|v1')?.text).toBe('Câu gốc X2')
    const pub = publicQuestion(ss) as unknown as Record<string, unknown>
    expect(pub.correct).toBeUndefined(); expect(pub.solution).toBeUndefined()
    expect((await napDayDuMem(env, [{ maDe: 'DE9', qid: 'X2~ss0', version: 'v1' }])).size).toBe(0) // không có song sinh ⇒ vắng
  })

  it('đóng lỗi: song sinh đúng 30/09 + câu gốc đúng 03/10 (cách lần sai ≥ 3 ngày) ⇒ thành thạo, hẹn kiểm duy trì 14 ngày', async () => {
    const { d, env } = await dung()
    ghi(d, 'X1', 'luyen', 0, '2026-09-29')
    ghi(d, 'X1~ss0', 'game', 1, '2026-09-30')
    const giua = await docHoSo2(env, 'S1', '2026-10-01')
    expect(giua.loiV2?.get('X1')).toMatchObject({ trangThai: 'cho_kiem', denHan: '2026-10-02', daDungSongSinh: true })
    expect(giua.songSinhCho?.has('X1')).toBe(false) // đã đúng song sinh ⇒ lượt sau là câu gốc
    ghi(d, 'X1', 'game', 1, '2026-10-03')
    const sau = await docHoSo2(env, 'S1', '2026-10-03')
    expect(sau.loiV2?.get('X1')).toMatchObject({ trangThai: 'dong', denHan: '2026-10-17' })
    expect(sau.tt.get('X1')).toMatchObject({ thanhThao: true, henOn: '2026-10-17' })
  })
})

// @vitest-environment node
// Bong bóng A.I Đỗ Đại Học — máy chủ (thầy 24/10; docs/DAC-TA-AI-DDH-APP-HS-2410.md). D1 THẬT (SQLite, lược đồ repo).
// Ghim: công tắc (tắt / thử theo lớp / bật) · em gửi ⇒ hàng chờ văn phòng ⇒ trả lời về em · bấm lặp một tin · trần 50/ngày · KHOÁ khi chặng kiểm tra
// cá nhân đang chạy · câu đề kiểm tra cá nhân chưa nộp ⇒ chỉ gợi ý + nằm trong danh sách tránh khi rút đề · văn phòng nghỉ > 60 giây · cần mã GV.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { gameToken } from '../server/src/game-v2-auth'
import { dauNgayVn, hsGuiAiDdh, hsMoAiDdh, TRAN_TIN_NGAY } from '../server/src/ai-ddh'

const NOW = Date.parse('2026-10-24T13:00:00Z')
function moi() {
  const d = taoD1That()
  d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, mat_khau, cap_nhat_luc) VALUES (?,?,?,?,?)').run('A1', 'Nguyễn Văn An', '12', 'mk123456', 'x')
  return { d, env: d.env as unknown as Env }
}
const gv = (env: Env, duong: string, body: Record<string, unknown> = {}) => goiWorker(worker, env, duong, body, true)

describe('bong bóng A.I Đỗ Đại Học — máy chủ', () => {
  it('mặc định TẮT: em mở thấy bat=false, gửi bị từ chối; «thử» chỉ lớp trong danh sách', async () => {
    const { env } = moi()
    const token = await gameToken(env, 'A1')
    expect(await hsMoAiDdh(env, { token }, NOW)).toMatchObject({ ok: true, bat: false })
    expect((await hsGuiAiDdh(env, { token, maTin: 'abcdefgh1', chu: 'giải giúp e' }, NOW)).ok).toBe(false)
    await gv(env, '/gv/ai-ddh/che-do', { cheDo: 'thu', lop: ['11'] })
    expect(await hsMoAiDdh(env, { token }, NOW)).toMatchObject({ bat: false })
    await gv(env, '/gv/ai-ddh/che-do', { cheDo: 'thu', lop: ['12'] })
    expect(await hsMoAiDdh(env, { token }, NOW)).toMatchObject({ bat: true, khoa: null, vanPhongTruc: false, conLuot: TRAN_TIN_NGAY })
  })

  it('em gửi ⇒ văn phòng lấy hàng chờ (kèm tên, lớp) ⇒ trả lời ⇒ em thấy; bấm lặp chỉ một tin; văn phòng trực', async () => {
    const { env } = moi()
    await gv(env, '/gv/ai-ddh/che-do', { cheDo: 'bat' })
    const token = await gameToken(env, 'A1')
    const g1 = await hsGuiAiDdh(env, { token, maTin: 'tin-0001x', chu: 'e ra 8,2 mà đáp án 10,2 ạ' }, NOW)
    const g2 = await hsGuiAiDdh(env, { token, maTin: 'tin-0001x', chu: 'e ra 8,2 mà đáp án 10,2 ạ' }, NOW + 1000)
    expect(g1).toMatchObject({ ok: true, tin: { ben: 'em', trangThai: 'cho' } })
    expect((g2.tin as { id: string }).id).toBe((g1.tin as { id: string }).id)
    const hc = await gv(env, '/gv/ai-ddh/hang-cho')
    expect(hc.tin).toHaveLength(1)
    expect(hc.tin[0]).toMatchObject({ sbd: 'A1', hoTen: 'Nguyễn Văn An', chu: 'e ra 8,2 mà đáp án 10,2 ạ' })
    expect((await gv(env, '/gv/ai-ddh/hang-cho')).tin).toHaveLength(0) // đã lấy ⇒ không lấy hai lần
    const id = hc.tin[0].id
    await gv(env, '/gv/ai-ddh/tra-loi', { id, tin: [{ chu: '**<do>Đáp án: m = 10,2 gam</do>**', nguon: 'kho' }, { chu: 'e mở cái này xem cho dễ hình dung', trangUrl: 'https://ddh-tai-lieu.pages.dev/t/abc/' }] })
    const mo = await hsMoAiDdh(env, { token }, Date.now())
    expect(mo.vanPhongTruc).toBe(true)
    const tin = mo.tin as { ben: string; chu: string; trangThai: string; trangUrl: string; nguon: string }[]
    expect(tin.map((x) => x.ben)).toEqual(['em', 'vp', 'vp'])
    expect(tin[0]!.trangThai).toBe('xong')
    expect(tin[1]).toMatchObject({ nguon: 'kho' })
    expect(tin[2]!.trangUrl).toContain('ddh-tai-lieu')
    const moiTin = await goiWorker(worker, env, '/hs/ai-ddh/tin', { token, sau: tin[0]!.luc ?? 0 })
    expect(moiTin.ok).toBe(true)
  })

  it(`trần ${TRAN_TIN_NGAY} tin/ngày; ngày mới hỏi tiếp`, async () => {
    const { d, env } = moi()
    await gv(env, '/gv/ai-ddh/che-do', { cheDo: 'bat' })
    await hsMoAiDdh(env, { token: await gameToken(env, 'A1') }, NOW) // dựng bảng
    const ins = d.sql.prepare("INSERT INTO ai_ddh_tin (id, sbd, ben, chu, luc) VALUES (?, 'A1', 'em', 'x', ?)")
    for (let i = 0; i < TRAN_TIN_NGAY; i++) ins.run(`A1-old${i}xx`, dauNgayVn(NOW) + i)
    const token = await gameToken(env, 'A1')
    expect(await hsGuiAiDdh(env, { token, maTin: 'tin-quatran', chu: 'câu 51' }, NOW)).toMatchObject({ ok: false, khoa: 'het_luot' })
    expect((await hsGuiAiDdh(env, { token, maTin: 'tin-ngaymoi', chu: 'câu mới' }, NOW + 86_400_000)).ok).toBe(true)
  })

  it('KHOÁ khi em đang làm chặng kiểm tra cá nhân; câu đề ấy chỉ gợi ý + nằm trong danh sách tránh', async () => {
    const { d, env } = moi()
    await gv(env, '/gv/ai-ddh/che-do', { cheDo: 'bat' })
    await goiWorker(worker, env, '/gv/ktcn/khong-co', {}, true).catch(() => null)
    d.sql.exec(`CREATE TABLE IF NOT EXISTS kiem_tra_ca_nhan (id TEXT PRIMARY KEY,sbd TEXT NOT NULL,lop TEXT NOT NULL,ngay TEXT NOT NULL,mo_luc INTEGER NOT NULL,han_luc INTEGER NOT NULL,trang_thai TEXT NOT NULL,json TEXT NOT NULL,tra_json TEXT NOT NULL DEFAULT '{}',revision INTEGER NOT NULL DEFAULT 0,nop_luc INTEGER,diem REAL,da_ghi INTEGER NOT NULL DEFAULT 0,cap_nhat_luc INTEGER NOT NULL,UNIQUE(sbd,ngay));
      CREATE TABLE IF NOT EXISTS kiem_tra_ca_nhan_chang (bai_id TEXT NOT NULL,stt INTEGER NOT NULL,bat_dau INTEGER NOT NULL,han INTEGER NOT NULL,chot_luc INTEGER,PRIMARY KEY(bai_id,stt));`)
    d.sql.prepare("INSERT INTO kiem_tra_ca_nhan (id,sbd,lop,ngay,mo_luc,han_luc,trang_thai,json,cap_nhat_luc) VALUES ('k1','A1','12','2026-10-24',?,?,'mo',?,0)")
      .run(NOW - 3600_000, NOW + 3600_000, JSON.stringify({ cau: [{ q: { qid: 'DH-12-C1-B2-I-5' } }] }))
    d.sql.prepare('INSERT INTO kiem_tra_ca_nhan_chang (bai_id,stt,bat_dau,han) VALUES (?,?,?,?)').run('k1', 1, NOW - 60_000, NOW + 600_000)
    const token = await gameToken(env, 'A1')
    expect(await hsMoAiDdh(env, { token }, NOW)).toMatchObject({ bat: true, khoa: 'kiem_tra' })
    expect(await hsGuiAiDdh(env, { token, maTin: 'tin-dangthi', chu: 'câu này sao ạ' }, NOW)).toMatchObject({ ok: false, khoa: 'kiem_tra' })
    // Hết chặng (chưa nộp cả bài): mở lại được, nhưng câu của đề vẫn chỉ gợi ý.
    expect(await hsMoAiDdh(env, { token }, NOW + 700_000)).toMatchObject({ khoa: null })
    const kc = await gv(env, '/gv/ai-ddh/kiem-cau', { sbd: 'A1', qids: ['DH-12-C1-B2-I-5', 'DH-12-C1-B2-I-6'] })
    expect(kc.chiGoiY).toEqual(['DH-12-C1-B2-I-5'])
    expect((await gv(env, '/gv/ai-ddh/tranh', { sbd: 'A1' })).qids).toContain('DH-12-C1-B2-I-5')
  })

  it('lệnh văn phòng cần mã GV; khoá ảnh lạ bị từ chối', async () => {
    const { env } = moi()
    expect((await goiWorker(worker, env, '/gv/ai-ddh/hang-cho', {}, false)).ok).toBe(false)
    expect((await gv(env, '/gv/ai-ddh/anh', { khoa: '../kho/goc.json' })).ok).toBe(false)
  })
})

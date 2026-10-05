// @vitest-environment node
// OMNI 3 · NGHIỆM THU XUYÊN LÀN (điều phối, 05/10) — KHÔNG tiêm/giả lớp nào: mọi lệnh đi qua đúng đường Worker thật (`server/src/index.ts`)
// trên D1 thật (node:sqlite, đủ migration). Kiểm các mảnh do nhiều làn viết KHỚP nhau:
//   thầy tick bài (B1, chọn em) ⇒ chiến dịch + A.I Đỗ Đại Học tự gắn vi kỹ năng cho tờ (D1, móc điều phối, chạy nền qua ctx.waitUntil)
//   ⇒ Sảnh có `omni` (B2) ⇒ 3 câu sai liền chung bước nền ⇒ Trạm hồi phục (B3) đúng bước chung, CÓ câu nền (câu nền tự sinh, móc điều phối)
//   ⇒ `/hs/luyen-nen` trả câu nền KHÔNG kèm đáp án ⇒ nộp đúng giá trị ⇒ chấm đúng ⇒ Bảng bài của thầy (B2) đọc được
//   ⇒ tắt công tắc OMNI ⇒ Sảnh và `answer` không còn khoá `omni` (tiêu chí 9).
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import type { Env } from '../server/src/kieu'

const CAU = [1, 2, 3, 4, 5, 6].map((i) => {
  const m = 6 * i // gam acid
  const n = m / 60
  const mEste = Math.round(n * 88 * 0.5 * 100) / 100 // hiệu suất 50 %
  return {
    qid: `HS${i}`,
    text: `Đun nóng ${String(m).replace('.', ',')} gam acetic acid với ethanol dư (xúc tác H₂SO₄ đặc), thu được ${String(mEste).replace('.', ',')} gam ethyl acetate. Hiệu suất của phản ứng ester hoá là`,
    choices: ['25%', '50%', '62,5%', '75%'],
    correct: 'B',
    solution: { chot: `n(acid) = ${String(m).replace('.', ',')} : 60 = ${String(n).replace('.', ',')} mol ⇒ m(ester lí thuyết) = ${String(n * 88).replace('.', ',')} gam. Hiệu suất H = ${String(mEste).replace('.', ',')} : ${String(n * 88).replace('.', ',')} × 100% = 50%.` },
  }
})

function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','mk1','x'),('S2','Trần Bảo','12A1','mk2','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  // Em đã chọn thần thú (chưa chọn thì Sảnh chỉ trả `canChonThu`, như em thật lần đầu vào).
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('omni','{"bat":true,"lop":[],"sbd":[]}','x')`)
  d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B1','Bài 1 · Ester',${CAU.length},0,'v1')`)
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B1','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const c of CAU) {
    st.run('DH-B1', c.qid, 'v1', `g-${c.qid}`, 'HSE', JSON.stringify({
      qid: c.qid, maDe: 'DH-B1', version: 'v1', group: `g-${c.qid}`, phan: 'I', text: c.text, choices: c.choices, ideas: [], hinhAnh: [],
      dang: 'HSE', tenDang: 'Hiệu suất phản ứng ester hoá', mucDo: 'VD', sao: 2, kienThuc: ['Phản ứng ester hoá'], correct: c.correct, reviewed: true, solution: c.solution,
    }))
  }
  return { d, env }
}
const thay = (env: Env, duong: string, b: Record<string, unknown>) => goiWorker(worker, env, duong, b, true)
const em = (env: Env, duong: string, b: Record<string, unknown>) => goiWorker(worker, env, duong, b)

describe('OMNI 3 · nghiệm thu xuyên làn (không giả lớp nào)', () => {
  it('tick bài (chọn em) ⇒ tự gắn vi kỹ năng ⇒ Sảnh omni ⇒ Trạm có câu nền tự sinh ⇒ luyện nền chấm đúng ⇒ Bảng bài ⇒ tắt công tắc y như cũ', async () => {
    xoaDemCaBaoVe()
    const { d, env } = dung()

    // 1. Thầy tick bài, CHỈ giao cho S1 (thầy nhắn 05/10: chọn em giao) — kèm một SBD lạ phải bị lọc bỏ.
    const tick = await thay(env, '/gv/bai-da-day', { action: 'tick', lop: '12A1', khoaBai: 'B1', tenBai: 'Bài 1 · Ester', viTri: 1, maDe: ['DH-B1'], phamVi: [], sbd: ['S1', 'KHONG-CO'] })
    expect(tick.ok, JSON.stringify(tick)).toBe(true)
    expect(typeof tick.chienDichId).toBe('string')
    const cd = d.sql.prepare('SELECT sbd_json, qid_json FROM chien_dich WHERE id = ?').get(tick.chienDichId) as { sbd_json: string; qid_json: string }
    expect(JSON.parse(cd.sbd_json)).toEqual(['S1'])
    expect((JSON.parse(cd.qid_json) as string[]).length).toBe(CAU.length)
    // Tick lần hai cùng bài ⇒ không tạo chiến dịch mới.
    const tick2 = await thay(env, '/gv/bai-da-day', { action: 'tick', lop: '12A1', khoaBai: 'B1', tenBai: 'Bài 1 · Ester', viTri: 1, maDe: ['DH-B1'], phamVi: [], sbd: ['S1', 'S2'] })
    expect(tick2.daCo, JSON.stringify(tick2)).toBe(true)
    expect(Number((d.sql.prepare('SELECT COUNT(*) n FROM chien_dich').get() as { n: number }).n)).toBe(1)

    // 2. A.I Đỗ Đại Học đã gắn vi kỹ năng cho tờ ngay lúc tick (móc điều phối): dang: + nen:hieu_suat, nguồn gợi ý tự động.
    const q = d.sql.prepare("SELECT qid, vkn_json, nguon FROM omni_q WHERE y = -1 ORDER BY qid").all() as { qid: string; vkn_json: string; nguon: string }[]
    expect(q.map((x) => x.qid)).toEqual(CAU.map((c) => c.qid).sort())
    for (const x of q) {
      expect(x.nguon).toBe('goi_y')
      const v = JSON.parse(x.vkn_json) as string[]
      expect(v[0]).toMatch(/^dang:/)
      expect(v).toContain('nen:hieu_suat')
    }

    // 3. Sảnh của S1 có `omni` (công tắc bật, Hoá 2.0 bật cho lớp).
    const token = await gameToken(env, 'S1')
    const sanh = await em(env, '/game-v2/hoa2-sanh', { token })
    expect(sanh.ok, JSON.stringify(sanh).slice(0, 300)).toBe(true)
    expect(sanh.omni?.bat).toBe(true)

    // 4. Ba câu sai liền trong một chuyến Đảo ⇒ Trạm hồi phục: bước "hiệu suất", CÓ câu nền (A.I tự sinh vì kho câu nền đang trống).
    expect(Number((d.sql.prepare('SELECT COUNT(*) n FROM cau_nen').get() as { n: number } | undefined)?.n ?? 0)).toBe(0)
    d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('P1', 'S1', JSON.stringify({
      mode: 'adventure', created: Date.now(), hoa2: 1,
      questions: CAU.map((c) => ({ qid: c.qid, maDe: 'DH-B1', version: 'v1', group: `g-${c.qid}`, novel: true, role: 'moi' })),
    }), new Date().toISOString())
    let cuoi: Record<string, any> = {}
    for (const c of CAU.slice(0, 3)) {
      cuoi = await em(env, '/game-v2/answer', { token, session: 'P1', qid: c.qid, answer: 'A', msLam: 60_000, tuTin: 'chac' })
      expect(cuoi.ok, JSON.stringify(cuoi).slice(0, 300)).toBe(true)
      expect(cuoi.correct).toBe(false)
      expect(cuoi.omni?.luot).toBe(false)
    }
    expect(cuoi.omni?.tram, JSON.stringify(cuoi.omni)).toBeTruthy()
    // Chỗ vướng = một bước nền CHUNG của cả 3 câu sai (A.I gắn cả "đổi khối lượng ra số mol" lẫn "hiệu suất" — trạm chọn bước P thấp nhất).
    const nenCua = (qid: string) => (JSON.parse((d.sql.prepare('SELECT vkn_json FROM omni_q WHERE qid = ? AND y = -1').get(qid) as { vkn_json: string }).vkn_json) as string[]).filter((x) => x.startsWith('nen:'))
    const chung = nenCua('HS1').filter((x) => nenCua('HS2').includes(x) && nenCua('HS3').includes(x)).map((x) => x.slice(4))
    const nhan = String(cuoi.omni.tram.nhan)
    expect(chung).toContain(nhan)
    expect(cuoi.omni.tram.coCauNen).toBe(true)
    expect(String(cuoi.omni.tram.chu)).toContain('A.I Đỗ Đại Học')
    expect(String(cuoi.omni.tram.chu)).not.toMatch(/vi kỹ năng|nen:|dang:/)
    const sinh = d.sql.prepare('SELECT id, gia_tri_dung FROM cau_nen WHERE nhan = ? ORDER BY id').all(nhan) as { id: string; gia_tri_dung: string }[]
    expect(sinh.length).toBeGreaterThanOrEqual(5)
    for (const x of sinh) expect(x.id).toMatch(new RegExp(`^sinh\\.${nhan}\\.\\d+$`))

    // 5. Câu nền qua đúng lệnh có sẵn: KHÔNG kèm đáp án; nộp đúng giá trị ⇒ chấm đúng, sổ ghi nguồn 'nen'.
    const nen = await em(env, '/hs/luyen-nen', { token, nhan })
    expect(nen.ok, JSON.stringify(nen).slice(0, 300)).toBe(true)
    const ds = (nen.cau ?? nen.ds ?? []) as Record<string, unknown>[]
    expect(ds.length).toBeGreaterThanOrEqual(3)
    expect(JSON.stringify(ds)).not.toMatch(/dap_an|dapAn|gia_tri_dung|giaTriDung|giai_json/)
    const dau = ds[0]!
    const dapAn = (d.sql.prepare('SELECT kieu, dap_an, gia_tri_dung FROM cau_nen WHERE id = ?').get(String(dau.id)) as { kieu: string; dap_an: string; gia_tri_dung: string })
    const nop = await em(env, '/hs/luyen-nen/nop', { token, id: dau.id, traLoi: dapAn.kieu === 'tn' ? dapAn.dap_an : dapAn.dap_an, qid: 'HS3' })
    expect(nop).toMatchObject({ ok: true, dung: true })
    expect(Number((d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd = 'S1' AND nguon = 'nen'").get() as { n: number }).n)).toBe(1)

    // 6. Bảng bài của thầy đọc được chiến dịch vừa tick.
    const bang = await thay(env, '/gv/omni', { action: 'bang', chienDichId: tick.chienDichId })
    expect(bang.ok, JSON.stringify(bang).slice(0, 300)).toBe(true)

    // 7. Tắt công tắc OMNI ⇒ Sảnh và `answer` không còn khoá `omni` (tiêu chí 9).
    d.sql.prepare("UPDATE cau_hinh SET gia_tri = '{\"bat\":false}' WHERE khoa = 'omni'").run()
    xoaDemCauHinh(env) // đệm cờ 15 giây của isolate — máy thật đổi cờ thì chậm nhất 15 giây có hiệu lực
    const sanhTat = await em(env, '/game-v2/hoa2-sanh', { token })
    expect(sanhTat.ok).toBe(true)
    expect('omni' in sanhTat, 'Sảnh còn omni khi công tắc tắt').toBe(false)
    const tlTat = await em(env, '/game-v2/answer', { token, session: 'P1', qid: 'HS4', answer: 'B', msLam: 60_000 })
    expect(tlTat.ok).toBe(true)
    expect('omni' in tlTat, 'answer còn omni khi công tắc tắt').toBe(false)
    xoaDemCaBaoVe()
  }, 60_000)
})

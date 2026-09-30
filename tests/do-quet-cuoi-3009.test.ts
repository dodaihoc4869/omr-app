// @vitest-environment node
// ĐO "QUÉT TOÀN BỘ LẦN CUỐI" 30/09 (thầy: "xem chỗ nào cần tối ưu tốc độ, mượt mà, ổn định, máy chủ"). Chạy được trên CẢ origin/main (trước) lẫn
// nhánh quet-toi-uu-cuoi-3009 (sau): chỉ dùng hàm có ở cả hai; in dòng `DO|tên|vòng|đợt|ghi chú` để lập bảng trước/sau trong PR.
// Ngưỡng `expect` là của bản SAU (trên main cũ các ngưỡng này đỏ — đó là bằng chứng). Số ms là CPU trên SQLite trong bộ nhớ (không trễ mạng).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { demVongD1 } from './_dem-vong-d1'
import worker from '../server/src/index'
import { docExpHomNay } from '../server/src/exp-d1'
import { gameToken } from '../server/src/game-v2-auth'
import * as chiMuc from '../server/src/chi-muc-luc-chay'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-09-30T14:00:00Z') // 21:00 giờ VN — giữa cao điểm
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => { vi.useRealTimers() })
const in1 = (ten: string, d: { vong: number; dot: number }, them = '') => console.log(`DO|${ten}|${d.vong}|${d.dot}|${them}`)
const post = (duong: string, body: Record<string, unknown>) => new Request(`https://x.dev${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
const ke = (d: D1That, q: string) => (d.sql.prepare('EXPLAIN QUERY PLAN ' + q).all() as { detail: string }[]).map((r) => r.detail).join(' · ')

describe('ĐO quét cuối 30/09 (in ra để so trước/sau)', () => {
  it('/daily-honors: 60 em mở Bảng nhiệm vụ trong một phút ⇒ số vòng D1 cộng dồn', async () => {
    const d = taoD1That()
    d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,thoi_gian_phut,cap_nhat_luc) VALUES('CV','Ca vinh danh','dong','thi','ngay',45,'x')")
    const lu = d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,tong,cap_nhat_luc,ho_ten) VALUES(?,?,?,1,?,?,'da_nop',?,'x','Em')")
    for (let e = 1; e <= 300; e++) lu.run(`CV|E${e}|1`, 'CV', `E${e}`, new Date(T0 - 3_600_000).toISOString(), new Date(T0 - 3_600_000 + e * 10_000).toISOString(), e % 11)
    const { env, d: dem } = demVongD1(d.env as unknown as Env)
    const dau = await (await worker.fetch(post('/daily-honors', {}), env as any)).json() as { ok: boolean; winners: unknown[] }
    expect(dau.ok).toBe(true)
    expect(dau.winners.length).toBe(3)
    const v1 = dem.vong
    for (let i = 0; i < 59; i++) {
      vi.setSystemTime(T0 + i * 1000) // 60 em mở trong 60 giây
      const r = await (await worker.fetch(post('/daily-honors', {}), env as any)).json() as { winners: unknown[] }
      expect(r.winners).toEqual(dau.winners)
    }
    in1('daily-honors-60-em', dem, `lượt đầu ${v1} vòng; quét luot: ${ke(d, "SELECT 1 FROM luot l WHERE l.nop_luc>=? AND l.nop_luc<?")}`)
    expect(dem.vong).toBeLessThanOrEqual(v1 + 2) // SAU: đệm 60 s dùng chung cho mọi em (dữ liệu không riêng em nào)
  }, 30_000)

  it('/ca/nhip: ca 300 em đang thi, máy thầy hỏi 3 s/lần', async () => {
    const d = taoD1That()
    d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,thoi_gian_phut,cap_nhat_luc) VALUES('C1','Ca 1','mo','thi',45,'2026-09-30T13:00:00.000Z')")
    const lu = d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,dap_an_json,cap_nhat_luc) VALUES(?,?,?,1,'2026-09-30T13:30:00.000Z',?,'{}','x')")
    const tt = d.sql.prepare("INSERT INTO trang_thai(sbd,ma_ca,lop,dang_lam,bat_dau_luc,da_lam_cau_hoi,tong_cau_hoi,so_lan_roi_app,blocked,cap_nhat_luc) VALUES(?,?,'12A',1,'2026-09-30T13:30:00.000Z',?,28,0,0,?)")
    for (let e = 1; e <= 300; e++) {
      lu.run(`C1|E${e}|1`, 'C1', `E${e}`, e % 5 ? 'dang_lam' : 'da_nop')
      tt.run(`E${e}`, 'C1', e % 28, new Date(T0 - (300 - e) * 1000).toISOString())
    }
    // 20 ca cũ (mỗi ca 300 lượt) — bảng luot cỡ thật
    for (let c = 2; c <= 20; c++) for (let e = 1; e <= 300; e++) lu.run(`C${c}|E${e}|1`, `C${c}`, `E${e}`, 'da_nop')
    await worker.fetch(post('/ca/nhip', { maCa: 'C1', sau: '', secret: 'bi-mat-thu' }), d.env as any) // làm nóng đệm cờ cau_hinh (15 s/isolate)
    const { env, d: dem } = demVongD1(d.env as unknown as Env)
    const t0 = performance.now()
    const r1 = await (await worker.fetch(post('/ca/nhip', { maCa: 'C1', sau: '', secret: 'bi-mat-thu' }), env as any)).json() as { ok: boolean; tt: unknown[]; moc: string }
    const ms1 = performance.now() - t0
    expect(r1.ok).toBe(true)
    expect(r1.tt.length).toBe(300)
    const v1 = { vong: dem.vong, dot: dem.dot }
    if (process.env.IN_SQL) console.log(dem.sqlDot.map((x) => x.slice(0, 160)).join('\n'))
    const cpu: number[] = []
    for (let i = 0; i < 20; i++) {
      const { env: e2 } = { env: d.env as unknown as Env }
      const a = performance.now()
      const r = await (await worker.fetch(post('/ca/nhip', { maCa: 'C1', sau: r1.moc, secret: 'bi-mat-thu' }), e2 as any)).json() as { tt: unknown[] }
      cpu.push(performance.now() - a)
      expect(r.tt.length).toBeLessThanOrEqual(2)
    }
    cpu.sort((a, b) => a - b)
    in1('ca-nhip-300-em', v1, `lần đầu ${Math.round(ms1)} ms (có trễ giả 25 ms/vòng); lần sau CPU trung vị ${cpu[10]!.toFixed(1)} ms; kế hoạch luot: ${ke(d, "SELECT COUNT(*) FROM luot WHERE ma_ca = 'C1'")}`)
    expect(v1.vong).toBe(1)
  })

  it('docExpHomNay (/hs/ke-hoach-ngay mỗi lần em mở app): bảng game_v2_reward 120 nghìn dòng', async () => {
    const d = taoD1That()
    d.sql.exec('DROP INDEX IF EXISTS idx_game_v2_reward_sbd') // D1 thật trước cron 00:01: chưa có chỉ mục (migration chỉ để chạy tay)
    const rw = d.sql.prepare('INSERT INTO game_v2_reward(id,sbd,amount,created_at) VALUES(?,?,?,?)')
    d.sql.exec('BEGIN')
    for (let k = 0; k < 120_000; k++) rw.run(`R${k}`, `E${k % 300}`, k % 3, new Date(T0 - (k % 10) * 86_400_000 - k).toISOString())
    d.sql.exec('COMMIT')
    const env = d.env as unknown as Env
    const Q = "SELECT COALESCE(SUM(amount),0) AS e, COUNT(*) AS n FROM game_v2_reward WHERE sbd=? AND created_at>=? AND created_at<? AND amount>0"
    const doMs = async () => { const t: number[] = []; for (let i = 0; i < 15; i++) { const a = performance.now(); await docExpHomNay(env, `E${i}`, T0); t.push(performance.now() - a) } t.sort((a, b) => a - b); return t[7]! }
    const truoc = await doMs()
    const keTruoc = ke(d, Q)
    // Chỉ mục CHỈ-THÊM dựng trong cron 00:01 VN (danh sách CHI_MUC_CRON_DEM) — không trên đường lệnh của em.
    const ds = (chiMuc as { CHI_MUC_CRON_DEM?: readonly string[] }).CHI_MUC_CRON_DEM ?? []
    for (const s of ds) d.sql.exec(s)
    const sau = await doMs()
    const keSau = ke(d, Q)
    const kq = await docExpHomNay(env, 'E1', T0)
    expect(kq).toBeTruthy()
    in1('docExpHomNay-120k', { vong: 0, dot: 0 }, `trung vị ${truoc.toFixed(2)} ms → sau cron 00:01 ${sau.toFixed(2)} ms; kế hoạch: ${keTruoc} → ${keSau}`)
    expect(keSau).toMatch(/SEARCH game_v2_reward USING INDEX/)
  })

  it('Tu luyện `nguon` (mở Tu luyện): đợt nối tiếp', async () => {
    const d = taoD1That()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('HS1','Em Một','12','x','x')")
    const token = await gameToken(d.env as unknown as Env, 'HS1')
    // lượt làm nóng: dựng bảng tu_luyen_* (một lần mỗi isolate) + đệm xác thực
    await worker.fetch(post('/hs/tu-luyen/nguon', { token }), d.env as any)
    const { env, d: dem } = demVongD1(d.env as unknown as Env)
    const r = await (await worker.fetch(post('/hs/tu-luyen/nguon', { token }), env as any)).json() as { ok: boolean }
    expect(r.ok).toBe(true)
    in1('tu-luyen-nguon', dem)
    if (process.env.IN_SQL) console.log(dem.sqlDot.map((x) => x.slice(0, 160)).join('\n'))
    expect(dem.dot).toBeLessThanOrEqual(3)
  })

  it('Bi-a `bia-loi-moi` (hỏi 6 s/lần ở Sảnh Bi-a) + vào bàn bằng mã: kế hoạch truy vấn', async () => {
    const d = taoD1That()
    d.sql.exec('DROP INDEX IF EXISTS bi_a_moi_tu; DROP INDEX IF EXISTS bi_a_van_cho')
    const q1 = "SELECT m.id FROM bi_a_moi m WHERE m.tu_sbd = ? AND m.trang_thai IN ('tu_choi', 'nhan') AND m.tao_luc >= ?"
    const q2 = "SELECT id FROM bi_a_van WHERE trang_thai = 'cho' AND json_extract(json,'$.ma') = ? AND tao_luc >= ? ORDER BY tao_luc DESC LIMIT 1"
    const truoc = `${ke(d, q1)} | ${ke(d, q2)}`
    for (const s of (chiMuc as { CHI_MUC_CRON_DEM?: readonly string[] }).CHI_MUC_CRON_DEM ?? []) d.sql.exec(s)
    const sau = `${ke(d, q1)} | ${ke(d, q2)}`
    in1('bi-a-ke-hoach', { vong: 0, dot: 0 }, `${truoc} → ${sau}`)
    expect(sau).not.toMatch(/SCAN bi_a_moi|SCAN bi_a_van/)
  })
})

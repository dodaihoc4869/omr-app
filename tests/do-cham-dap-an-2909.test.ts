// @vitest-environment node
// ĐO đường "CHỐT ĐÁP ÁN" (thầy 29/09: "bấm chốt đáp án nó hiện đang chấm 1 lúc mới được"): một lần `answer` của Đảo 2 (hoa2) trên D1 giả
// cỡ gần thật — 200 đề (2000 câu), 40 ca (5 ca đang mở có đề R2), 500 lượt game cũ, sổ + EXP bật. Đếm VÒNG D1, ĐỢT NỐI TIẾP (≈ độ trễ:
// mỗi đợt ≈ 1 lượt đi-về D1), số lần đọc R2, thời gian CPU (không trễ giả). In `DO|…` để lập bảng trước/sau trong PR.
// Ngưỡng `expect` là của bản SAU tối ưu (trên main cũ các ngưỡng đợt đỏ — bằng chứng trước/sau).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { writeFileSync } from 'node:fs'
import { taoD1That, type D1That } from './_d1-that'
import { demVongD1 } from './_dem-vong-d1'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { gvChienDich } from '../server/src/srs2-gv'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-09-30T09:00:00+07:00')
let bayGio = T0
beforeEach(() => { bayGio = T0; vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); xoaDemCaBaoVe() })
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

const SO_DE = 200, CAU_MOI_DE = 10, SO_CA = 40, CA_MO = 5
const ma = (i: number) => `DE${String(i).padStart(3, '0')}`
const cau = (maDe: string, i: number) => {
  const phan = i % 5 === 4 ? 'II' : 'I'
  return { qid: `${maDe}-${phan}-${i}`, maDe, version: 'v1', group: `g-${maDe}-${i}`, phan, text: `Câu ${i} của ${maDe} ${'x'.repeat(400)}`,
    choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [], hinhAnh: [], dang: `ES.A.D${i % 7}`, tenDang: 'Dạng', mucDo: 'hieu', sao: 2,
    kienThuc: ['k'], correct: phan === 'I' ? 'B' : 'DSDS', solution: { chot: 'Giải '.repeat(80) }, reviewed: true }
}
const bank = (c: number) => ({ phanI: Array.from({ length: 40 }, (_, i) => ({ id: `CA${c}-I-${i + 1}`, text: 'x', choices: ['A. a', 'B. b', 'C. c', 'D. d'], correct: 'B', dang: { ma: 'ES.A.X' }, mucDo: 'hieu', kienThuc: ['k1'] })) })

async function dung(): Promise<{ d: D1That; token: string; qs: ReturnType<typeof cau>[] }> {
  const d = taoD1That()
  const s = d.sql
  s.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','An','12A','mk','x')")
  s.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x'),('exp_moi','{"tu":"2026-09-01T00:00:00Z","toanBo":true}','x'),('nang_luc_v1','bat','x')`)
  const dk = s.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'12',?,?,0,'v1')")
  const gi = s.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')")
  const gq = s.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= SO_DE; i++) {
    dk.run(ma(i), ma(i), CAU_MOI_DE, `kho/${ma(i)}.json`); gi.run(ma(i))
    for (let j = 1; j <= CAU_MOI_DE; j++) { const q = cau(ma(i), j); gq.run(q.maDe, q.qid, q.version, q.group, q.dang, JSON.stringify(q)) }
  }
  const ca = s.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES(?,?,?,?,?,45,'thi',?,?,?)")
  const lu = s.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,cap_nhat_luc,ho_ten) VALUES(?,?,?,1,'x',?,'x','Em')")
  for (let c = 1; c <= SO_CA; c++) {
    const mo = c <= CA_MO
    ca.run(`CA${c}`, `Ca ${c}`, mo ? 'mo' : 'dong', new Date(T0 - (mo ? 60_000 : 86400_000 * c)).toISOString(), new Date(T0 + (mo ? 3600_000 : -86400_000 * c)).toISOString(), mo ? 'khong' : 'ngay', `key/CA${c}.json`, `v${c}`)
    await d.env.DE.put(`key/CA${c}.json`, JSON.stringify(bank(c)))
    for (let e = 1; e <= 30; e++) lu.run(`CA${c}|E${e}|1`, `CA${c}`, `E${e}`, e % 3 ? 'da_nop' : 'dang_lam')
  }
  const token = await gameToken(d.env, 'S1')
  // hồ sơ + chuyển đổi lười làm TRƯỚC (em đã chơi): đo là lần chốt đáp án thường ngày, không phải lần mở hồ sơ đầu tiên
  await gameV2(d.env, 'profile', { token }).catch(() => null)
  const at = s.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
  for (let k = 0; k < 500; k++) {
    const q = cau(ma(100 + (k % 100)), (k % CAU_MOI_DE) + 1)
    at.run(`OLD${k}|${q.qid}`, 'S1', `OLD${k}`, q.qid, q.group, JSON.stringify({ attempt: { id: `OLD${k}|${q.qid}`, qid: q.qid, group: q.group, dang: q.dang, correct: k % 2 === 0, assisted: false, at: T0 - k * 60_000 } }), new Date(T0 - k * 60_000).toISOString())
  }
  const qs = Array.from({ length: CAU_MOI_DE }, (_, j) => cau(ma(1), j + 1))
  s.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('LUOT1', 'S1', JSON.stringify({ mode: 'adventure', created: T0, hoa2: 1, questions: qs.map((q) => ({ qid: q.qid, maDe: q.maDe, version: 'v1', group: q.group, novel: true, role: 'moi' })) }), new Date(T0).toISOString())
  return { d, token, qs }
}

/** Ngưỡng của bản SAU tối ưu (đặt sau khi đo). */
const NGUONG = (_x: unknown[]) => {}
type Do = { vong: number; dot: number; r2: number; ms: number; sql: string[] }
async function doMotLan(d: D1That, token: string, qid: string, answer: string, treGia: boolean): Promise<{ r: Record<string, unknown>; m: Do }> {
  let r2 = 0
  const getGoc = d.env.DE.get.bind(d.env.DE)
  const env0 = { ...d.env, DE: { ...d.env.DE, get: (k: string) => { r2++; return getGoc(k) } } } as unknown as Env
  const { env, d: dem } = treGia ? demVongD1(env0) : { env: env0, d: { vong: 0, dot: 0, sql: [] as string[], sqlDot: [] as string[] } }
  // ctx giả như Worker thật: việc phụ (`waitUntil`) KHÔNG tính vào thời gian trả lời em — đo lúc có phản hồi, rồi mới đợi việc phụ xong.
  const cho: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => { cho.push(p) } }
  const t = performance.now()
  const r = await (gameV2 as (...a: unknown[]) => Promise<Record<string, unknown>>)(env, 'answer', { token, session: 'LUOT1', qid, answer }, ctx)
  const m = { vong: dem.vong, dot: dem.dot, r2, ms: performance.now() - t, sql: [...dem.sqlDot] }
  await Promise.all(cho)
  return { r, m }
}
/** Giữa hai lần chốt: 20 s trôi, một em khác vào ca đang mở (vân tay ca thi đổi — đúng cảnh giờ thi). */
function troi(d: D1That, k: number) {
  bayGio += 20_000; vi.setSystemTime(bayGio)
  d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,cap_nhat_luc,ho_ten) VALUES(?,?,?,1,'x','dang_lam','x','Em')").run(`CA1|N${k}|1`, 'CA1', `N${k}`)
}

describe('ĐO chốt đáp án (answer Đảo 2)', () => {
  it('10 câu liên tiếp: vòng/đợt D1, đọc R2, ms CPU (tách câu đúng / câu sai)', async () => {
    const trungVi = (xs: number[]) => xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]! : NaN
    const chay = async (treGia: boolean) => {
      const { d, token, qs } = await dung()
      const ra: (Do & { dung: boolean; k: number })[] = []
      for (let k = 0; k < qs.length; k++) {
        troi(d, k)
        const q = qs[k]!
        const dapAn = q.phan === 'I' ? (k % 3 ? 'B' : 'A') : 'DSDS'
        const { r, m } = await doMotLan(d, token, q.qid, dapAn, treGia)
        expect(r.ok).toBe(true)
        expect(r.correct).toBe(dapAn === q.correct)
        expect(r.answer).toBe(q.correct) // đáp án chỉ về SAU khi chấm (như cũ)
        ra.push({ ...m, dung: dapAn === q.correct, k })
      }
      // Gọi lại cùng câu (máy em mất mạng bấm lại) ⇒ trả đúng bản cũ, không cộng đôi
      const lai = await gameV2(d.env, 'answer', { token, session: 'LUOT1', qid: qs[1]!.qid, answer: 'C' }) as Record<string, any>
      expect(lai.replayed).toBe(true)
      return { ra, d, qs }
    }
    const { ra: tre } = await chay(true)
    const { ra: cpu } = await chay(false)
    const nhom = (dung: boolean) => {
      const t = tre.filter((x) => x.dung === dung && x.k > 0), c = cpu.filter((x) => x.dung === dung && x.k > 0)
      return `vong=${trungVi(t.map((x) => x.vong))}|dot=${trungVi(t.map((x) => x.dot))}|r2=${trungVi(t.map((x) => x.r2))}|cpuMs=${trungVi(c.map((x) => x.ms)).toFixed(1)}`
    }
    const dong = [`DO|answer-dung|${nhom(true)}`, `DO|answer-sai|${nhom(false)}`, `DO|answer-lan-dau-isolate-lanh|vong=${tre[0]!.vong}|dot=${tre[0]!.dot}|r2=${tre[0]!.r2}`]
    for (const x of dong) console.log(x)
    writeFileSync(`${process.env.DO_RA ?? '/tmp'}/do-cham-dap-an-sql.txt`, dong.join('\n') + '\n' + tre.map((x) => `--- câu ${x.k} ${x.dung ? 'ĐÚNG' : 'SAI'}: vòng ${x.vong} đợt ${x.dot} r2 ${x.r2}\n${x.sql.map((s) => s.replace(/\s+/g, ' ').slice(0, 160)).join('\n')}`).join('\n'))
    NGUONG(tre)
  }, 120_000)
})

describe('ĐO đường nóng khác của app HS (qua gameV2, như máy em gọi)', () => {
  it('hoa2-sanh (lần 2 trong ngày), start Đảo 2, recommendations, sync', async () => {
    const { d, token } = await dung()
    await gvChienDich(d.env, { action: 'tao', ten: 'CD', sbd: ['S1'], maDe: [ma(2), ma(3), ma(4)], hanNop: '2026-10-05' }, T0)
    await gameV2(d.env, 'choose', { token, pet: 'dat_quy' }).catch(() => null)
    await gameV2(d.env, 'hoa2-sanh', { token })
    for (const lenh of ['hoa2-sanh', 'start', 'recommendations', 'sync']) {
      bayGio += 20_000; vi.setSystemTime(bayGio)
      const { env, d: dem } = demVongD1(d.env)
      const r = await gameV2(env, lenh, { token, mode: 'adventure' }).catch((e: Error) => ({ ok: false, error: e.message })) as Record<string, unknown>
      console.log(`DO|${lenh}|ok=${r.ok}|vong=${dem.vong}|dot=${dem.dot}`)
      writeFileSync(`${process.env.DO_RA ?? '/tmp'}/do-${lenh}-sql.txt`, dem.sqlDot.map((s) => s.replace(/\s+/g, ' ').slice(0, 160)).join('\n'))
    }
  }, 60_000)
})

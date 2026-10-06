// @vitest-environment node
// OMNI 3 — TRẠM HỒI PHỤC Ở ĐOÀN MỘT NGƯỜI THẬT, ĐẦU-CUỐI (thầy 06/10: "Tôi làm thử chiến dịch sai 3 câu liên tiếp trong đoàn không thấy về trạm hồi phục").
// Worker thật (`server/src/index.ts`) + D1 thật (node:sqlite, đủ migration), Hóa 2.0 + OMNI BẬT như bản sống: em MỘT mình mở chặng Đoàn (`doan-mo`), mỗi hiệp xem câu
// (`doan-xem`) rồi nộp (`doan-nop`) — chính đường `doan-nop` → `answer` nội bộ mang cờ `motMinh` (game-v2-doan.ts) mà tests/omni-3-tra-loi.test.ts chỉ giả lập.
// Câu SAI tự làm thứ ba liền ⇒ `ketQuaCau.omni.tram` (có câu nền); hai câu đầu không có; câu ĐÚNG cắt chuỗi; mỗi chặng tối đa một Trạm; không lộ đáp án.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemOmni } from '../server/src/omni-d1'
import { xoaDemCauNghi, xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { DEM_NGUOC_MS } from '../server/src/game-v2-doan'
import type { Env } from '../server/src/kieu'

const TO11 = 'DH-11-B1'
const NHAN = 'doi_mol_khoi_luong'
const SO_CAU = 24
const QIDS = Array.from({ length: SO_CAU }, (_, i) => `C${i + 1}`)
const luc = (ngay: string, gio = '08:00') => Date.parse(`${ngay}T${gio}:00+07:00`)

function dung(): { d: D1That; env: Env } {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','11A1','mk1','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["11A1"]}','x'),('doan_ho_tong','{"toanBo":true}','x'),('omni','{"bat":true,"lop":[],"sbd":[]}','x'),('chan_doan_buoc_sai','{"bat":false}','x')`)
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,0,?)').run(TO11, `Tờ ${TO11}`, '11', SO_CAU, 'v1')
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(TO11)
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  const vkn = d.sql.prepare("INSERT INTO omni_q(qid,y,vkn_json,nguon) VALUES(?,-1,?,'thay')")
  for (const qid of QIDS) {
    const q = { qid, maDe: TO11, version: 'v1', group: `g-${qid}`, phan: 'I', text: `Đề câu ${qid}`, choices: ['A', 'B', 'C', 'D'].map((k) => `${qid} — giá trị ${k}`), ideas: [], hinhAnh: [], dang: 'D1', tenDang: 'Dạng D1', mucDo: 'TH', sao: 1, kienThuc: ['K1'], correct: 'B', reviewed: true, solution: { chot: 'Bảo toàn khối lượng cho cả quá trình.' } }
    st.run(TO11, qid, 'v1', q.group, 'D1', JSON.stringify(q))
    vkn.run(qid, JSON.stringify(['dang:D1', `nen:${NHAN}`]))
  }
  // 12 câu em đã SAI hôm qua (câu nợ) ⇒ kế hoạch ngày xếp chúng vào kênh Đoàn (em chưa mở Đảo tuần này).
  const ghi = d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance) VALUES(?,?,?,?,?,1,?,?,?,?)')
  QIDS.slice(0, 12).forEach((qid, i) => { const ms = luc('2026-10-05', '10:00') + i * 1000; ghi.run(`luyen|S1|${qid}|${ms}`, 'S1', qid, 'luyen', `M-${ms}`, 0, new Date(ms).toISOString(), '2026-10-05', 'none') })
  d.sql.prepare("INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('T1','11A1','B1','Bài 1',1,?,'2026-10-01T00:00:00.000Z')").run(JSON.stringify([TO11]))
  d.sql.prepare("INSERT INTO chien_dich(id,ten,lop,sbd_json,ma_de_json,qid_json,han_nop,tao_luc) VALUES('CD1','Ôn chương 1','11A1','[\"S1\"]',?,?,'2026-10-30','2026-10-01T00:00:00.000Z')")
    .run(JSON.stringify([TO11]), JSON.stringify(QIDS))
  return { d, env }
}

const em = async (env: Env, duong: string, b: Record<string, unknown> = {}) => goiWorker(worker, env, duong, { token: await gameToken(env, 'S1'), ...b })
const phienCua = (d: D1That, ma: string) => {
  const phong = JSON.parse((d.sql.prepare('SELECT json FROM doan_chang WHERE ma = ?').get(ma) as { json: string }).json) as { nguoi: { phien: string }[] }
  return JSON.parse((d.sql.prepare('SELECT json FROM game_v2_session WHERE id = ?').get(phong.nguoi[0]!.phien) as { json: string }).json) as { tram?: number; doan?: number; hoa2?: number }
}

interface KetQuaHiep { correct: boolean; omni?: { tram?: { chu: string; coCauNen: boolean; nhan: string | null; tenLoi: string | null; ten: string | null; vkn: string | null } } }
/** Tới hiệp CÓ câu riêng của em: hiệp đang chờ ĐÁNH TIẾP thì bấm (`doan-tiep`); hiệp Trùm không có câu riêng nên tự giải và dừng ở hiệp kế — bấm tiếp. */
async function xemHiepCoCau(env: Env, ma: string) {
  for (let lan = 0; lan < 4; lan++) {
    const xem = await em(env, '/game-v2/doan-xem', { ma })
    expect(xem.ok, JSON.stringify(xem).slice(0, 300)).toBe(true)
    if (xem.doan.cau?.qid) return xem
    expect(xem.doan.tran.choTiep, `hiệp ${xem.doan.tran.hiep} không có câu mà cũng không chờ ĐÁNH TIẾP`).toBe(true)
    vi.setSystemTime(Date.now() + 2_000)
    const tiep = await em(env, '/game-v2/doan-tiep', { ma })
    expect(tiep.ok, JSON.stringify(tiep).slice(0, 300)).toBe(true)
  }
  throw new Error('không tới được hiệp có câu riêng của em')
}
/** Một hiệp của em: tới hiệp có câu rồi nộp ĐÚNG / SAI. Đáp án đúng gốc của kho là B; chữ hiển thị tìm theo NỘI DUNG phương án (câu làm lại có thể bị xáo). `msLam` 40 s ⇒ không phải "lướt". */
async function lamHiep(env: Env, ma: string, dung: boolean): Promise<KetQuaHiep> {
  const xem = await xemHiepCoCau(env, ma)
  const hiep = xem.doan.tran.hiep as number
  const chu = (xem.doan.cau.de.choices as string[]).map((t) => String(t))
  const viTriDung = chu.findIndex((t) => t.endsWith('giá trị B'))
  expect(viTriDung, `hiệp ${hiep}: tìm được phương án đúng trong ${JSON.stringify(chu)}`).toBeGreaterThanOrEqual(0)
  const dapDung = 'ABCD'[viTriDung]!, dapSai = 'ABCD'[(viTriDung + 1) % 4]!
  const nop = await em(env, '/game-v2/doan-nop', { ma, hiep, answer: dung ? dapDung : dapSai, hanhDong: 'danh', msLam: 40_000 })
  expect(nop.ok, JSON.stringify(nop).slice(0, 300)).toBe(true)
  const ket = nop.ketQuaCau as KetQuaHiep
  expect(ket.correct).toBe(dung)
  vi.setSystemTime(Date.now() + 2_000)
  return ket
}
async function moChang(env: Env): Promise<string> {
  vi.setSystemTime(luc('2026-10-06'))
  const mo = await em(env, '/game-v2/doan-mo', {})
  expect(mo.ok, JSON.stringify(mo).slice(0, 400)).toBe(true)
  vi.setSystemTime(Date.now() + DEM_NGUOC_MS + 500)
  return String(mo.doan.ma)
}

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); xoaDemCaBaoVe(); xoaDemChienDich(); xoaDemPhamVi(); xoaDemCauNghi(); xoaDemChanKhoi(); xoaDemOmni() })
afterEach(() => vi.useRealTimers())

describe('Đoàn MỘT NGƯỜI THẬT · Trạm hồi phục đầu-cuối (Worker thật + D1 thật, Hóa 2.0 + OMNI bật)', () => {
  it('sai 3 câu tự làm liền ⇒ câu thứ ba có Trạm (có câu nền); hai câu đầu không; sau Trạm không có Trạm thứ hai; phiên đánh dấu tram:1; không lộ đáp án', async () => {
    const { d, env } = dung()
    const ma = await moChang(env)
    expect(phienCua(d, ma)).toMatchObject({ doan: 1, hoa2: 1 })
    const ds: KetQuaHiep[] = []
    for (let i = 0; i < 4; i++) ds.push(await lamHiep(env, ma, false))
    expect(ds[0]!.omni?.tram).toBeUndefined()
    expect(ds[1]!.omni?.tram).toBeUndefined()
    const tram = ds[2]!.omni?.tram
    expect(tram, 'câu sai thứ ba liền phải có Trạm').toBeTruthy()
    expect(tram!.coCauNen).toBe(true)
    expect(tram!.nhan).toBeTruthy()
    expect(tram!.chu).toMatch(/3 câu/)
    expect(ds[3]!.omni?.tram, 'một chặng tối đa một Trạm').toBeUndefined()
    expect(phienCua(d, ma).tram).toBe(1)
    // Thẻ Trạm chỉ mang nhãn + chữ hiển thị (kiểu `TramHoiPhuc`), KHÔNG mang câu nền hay đáp án nào — câu nền lấy riêng ở `/hs/luyen-nen`. (Kết quả câu vừa nộp vốn có lời giải: đã nộp rồi.)
    expect(Object.keys(tram!).sort()).toEqual(['chu', 'coCauNen', 'nhan', 'ten', 'tenLoi', 'vkn'])
    for (const k of ['correct', 'solution', 'dapAn', 'answer', 'choices']) expect(JSON.stringify(tram), `thẻ Trạm lộ ${k}`).not.toContain(`"${k}"`)
  })

  it('câu ĐÚNG ở giữa cắt chuỗi: sai, sai, ĐÚNG, sai, sai ⇒ chưa Trạm; sai thêm một câu (ba liền sau câu đúng) ⇒ Trạm', async () => {
    const { env } = dung()
    const ma = await moChang(env)
    const ket: KetQuaHiep[] = []
    for (const dungHiep of [false, false, true, false, false]) ket.push(await lamHiep(env, ma, dungHiep))
    for (const k of ket) expect(k.omni?.tram).toBeUndefined()
    const sau = await lamHiep(env, ma, false)
    expect(sau.omni?.tram?.coCauNen).toBe(true)
  })
})

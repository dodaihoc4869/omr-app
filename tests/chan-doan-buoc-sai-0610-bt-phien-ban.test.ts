// @vitest-environment node
// (2c) GHIM PHIÊN BẢN THAM CHIẾU `~bt` (06/10, lệnh thầy "Làm chuẩn đoán bước sai, còn nhỏ") — D1 thật (node:sqlite, đủ migration), đường Worker thật.
// Tham chiếu `<Q>~bt<k>` không lưu nội dung: chấm / resume / Đoàn SINH LẠI. Nay ref phiên mang phiên bản bộ sinh (`btv`, BT_PHIEN_BAN = 1); bảng đăng ký
// `BANG_PHIEN_BAN_BT`; tham chiếu CŨ (không `btv`) ⇒ phiên bản 1; số lạ ⇒ LÙI VỀ CÂU GỐC (không ném lỗi, không chấm theo câu sinh lệch).
// KHOÁ PHIÊN BẢN 1: bản băm nội dung bộ sinh hiện tại — ai sửa bộ sinh TẠI CHỖ (không thêm phiên bản mới) thì test này đỏ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createHash } from 'node:crypto'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCauNghi, xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { BANG_PHIEN_BAN_BT, BT_PHIEN_BAN, PHIEN_BAN_BIEN_THE, apBienThe, apBienTheTheoPhienBan, cacDangCoBoSinh, cacHoDe, phienBanBt, sinhBienThe } from '../server/src/bien-the-sinh'
import { bienTheTheoQid, luiVeCauGoc, phuQidAoMoi } from '../server/src/ban-khac-ao'
import { DEM_NGUOC_MS } from '../server/src/game-v2-doan'
import type { PrivateQuestion } from '../src/game/than-thu-v2/core'
import type { Env } from '../server/src/kieu'

const TO11 = 'DH-11-B1'
const HO11 = cacHoDe().find((h) => h.khoiChuong === 11)!
const DANG_BT = HO11.cacDang.find((dg) => sinhBienThe(dg, 'thử', 'III', 'hieu', { maDe: TO11 }) !== null)!
const cauJson = (qid: string) => ({
  qid, maDe: TO11, version: 'v1', group: `g-${qid}`, phan: 'III', text: `Đề câu ${qid}`, choices: [], ideas: [], hinhAnh: [], dang: DANG_BT, tenDang: `Dạng ${DANG_BT}`,
  mucDo: 'TH', sao: 1, kienThuc: ['K1'], correct: '4,5', reviewed: true, solution: { chot: 'Bảo toàn khối lượng cho cả quá trình.' },
})
const ngayVnCua = (ms: number) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
const luc = (ngay: string, gio = '08:00') => Date.parse(`${ngay}T${gio}:00+07:00`)

function dung(): { d: D1That; env: Env } {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','11A1','mk1','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["11A1"]}','x'),('doan_ho_tong','{"toanBo":true}','x')`)
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,0,?)').run(TO11, 'Tờ', '11', 1, 'v1')
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(TO11)
  d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(TO11, 'Q3', 'v1', 'g-Q3', DANG_BT, JSON.stringify(cauJson('Q3')))
  d.sql.prepare("INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('T1','11A1','B1','Bài 1',1,?,'2026-10-01T00:00:00.000Z')").run(JSON.stringify([TO11]))
  d.sql.prepare("INSERT INTO chien_dich(id,ten,lop,sbd_json,ma_de_json,qid_json,han_nop,tao_luc) VALUES('CD1','Ôn','11A1','[\"S1\"]',?,?,'2026-10-30','2026-10-01T00:00:00.000Z')").run(JSON.stringify([TO11]), JSON.stringify(['Q3']))
  // em sai Q3 hôm qua (câu Phần III có bộ sinh, không song sinh) ⇒ lượt làm lại hôm nay là `Q3~bt0`
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance) VALUES(?,?,?,?,?,1,0,?,?,?)').run('k0', 'S1', 'Q3', 'luyen', 'M', new Date(luc('2026-10-05', '10:00')).toISOString(), '2026-10-05', 'none')
  // nhịp kênh: 7 ngày qua em chỉ mở Đảo ⇒ câu ôn Phần III vào Đảo
  d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('CU1', 'S1', JSON.stringify({ mode: 'adventure', created: luc('2026-10-04'), hoa2: 1, questions: [] }), new Date(luc('2026-10-04')).toISOString())
  return { d, env }
}
const em = async (env: Env, duong: string, b: Record<string, unknown> = {}) => goiWorker(worker, env, duong, { token: await gameToken(env, 'S1'), ...b })
const phien = (d: D1That, id: string) => JSON.parse((d.sql.prepare('SELECT json FROM game_v2_session WHERE id = ?').get(id) as { json: string }).json) as { questions: Record<string, unknown>[] }
const suaRef = (d: D1That, id: string, sua: (r: Record<string, unknown>) => void) => {
  const p = phien(d, id); sua(p.questions[0]!)
  d.sql.prepare('UPDATE game_v2_session SET json = ? WHERE id = ?').run(JSON.stringify(p), id)
}
const gocQ3 = (d: D1That) => JSON.parse((d.sql.prepare("SELECT json FROM game_v2_question WHERE qid = 'Q3'").get() as { json: string }).json) as PrivateQuestion

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); xoaDemCaBaoVe(); xoaDemChienDich(); xoaDemPhamVi(); xoaDemCauNghi(); xoaDemChanKhoi() })
afterEach(() => vi.useRealTimers())

describe('(2c) bảng đăng ký + đọc số phiên bản (thuần)', () => {
  it('BT_PHIEN_BAN = 1 = bộ sinh hiện tại; vắng số ⇒ 1; số lạ / sai kiểu ⇒ null', () => {
    expect(BT_PHIEN_BAN).toBe(1)
    expect(BANG_PHIEN_BAN_BT[1]).toEqual({ ma: PHIEN_BAN_BIEN_THE, ap: apBienThe })
    for (const v of [undefined, null, '']) expect(phienBanBt(v)).toBe(1)
    expect(phienBanBt(1)).toBe(1); expect(phienBanBt('1')).toBe(1)
    for (const v of [0, 2, 99, -1, 1.5, 'abc', '1a', {}, true]) expect(phienBanBt(v)).toBeNull()
  })
  it('apBienTheTheoPhienBan: phiên bản 1 = apBienThe; phiên bản lạ ⇒ { la: true }; ban-khac-ao lùi về câu gốc (giữ qid ảo)', async () => {
    const g = { ...cauJson('Q3'), lop: '11' } as unknown as PrivateQuestion
    expect(apBienTheTheoPhienBan(g, 'Q3~bt1', 11)).toEqual({ q: apBienThe(g, 'Q3~bt1', 11) })
    expect(apBienTheTheoPhienBan(g, 'Q3~bt1', 11, 1)).toEqual({ q: apBienThe(g, 'Q3~bt1', 11) })
    expect(apBienTheTheoPhienBan(g, 'Q3~bt1', 11, 7)).toEqual({ la: true })
    expect(bienTheTheoQid(g, 'Q3~bt1', 11, 7)).toBeNull()
    const env = taoD1That().env as unknown as Env
    expect(await phuQidAoMoi(env, g, 'Q3~bt1')).toEqual({ ...apBienThe(g, 'Q3~bt1', 11)!, version: 'v1', group: 'g-Q3' })
    expect(await phuQidAoMoi(env, g, 'Q3~bt1', 7)).toEqual(luiVeCauGoc(g, 'Q3~bt1'))
    expect(luiVeCauGoc(g, 'Q3~bt1')).toMatchObject({ qid: 'Q3~bt1', text: 'Đề câu Q3', correct: '4,5' })
  })
  it('KHOÁ PHIÊN BẢN 1: nội dung bộ sinh hiện tại không đổi (đổi bộ sinh ⇒ thêm phiên bản mới vào BANG_PHIEN_BAN_BT, KHÔNG sửa tại chỗ)', () => {
    const ds: unknown[] = []
    for (const dang of cacDangCoBoSinh()) for (const phan of ['I', 'III'] as const) for (const hat of ['Q~bt0', 'Q~bt1', 'X~bt7']) {
      const c = sinhBienThe(dang, hat, phan, undefined, { maDe: 'DH-12-K' })
      ds.push(c ? [dang, phan, hat, c.text, c.choices, c.correct, c.bienThe.mau] : [dang, phan, hat, null])
    }
    const bam = createHash('sha1').update(JSON.stringify(ds)).digest('hex')
    expect(bam, 'Bộ sinh biến thể đã đổi nội dung: đăng ký phiên bản mới (BANG_PHIEN_BAN_BT) thay vì sửa phiên bản 1').toBe('53ea396359dad2368b289b95cc9ef8e302447bb4')
  })
})

describe('(2c) tham chiếu `~bt` trong chuyến: phát mang btv; cũ vẫn chấm đúng; số lạ lùi về câu gốc', () => {
  async function batDau() {
    const { d, env } = dung()
    vi.setSystemTime(luc('2026-10-06'))
    const r = await em(env, '/game-v2/start', { mode: 'adventure' })
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect(r.questions.map((q: { qid: string }) => q.qid)).toEqual(['Q3~bt0'])
    expect(JSON.stringify(r)).not.toContain('"btv"') // khoá nội bộ không xuống máy em
    return { d, env, r, bt0: apBienThe(gocQ3(d), 'Q3~bt0', 11)! }
  }
  it('ref phiên mới mang btv = 1 (cùng tc = Q3); chấm theo đúng câu đã phát', async () => {
    const { d, env, r, bt0 } = await batDau()
    expect(phien(d, r.id).questions[0]).toMatchObject({ qid: 'Q3~bt0', tc: 'Q3', btv: 1 })
    const t = await em(env, '/game-v2/answer', { session: r.id, qid: 'Q3~bt0', answer: bt0.correct })
    expect(t.correct).toBe(true)
    // sổ y hệt hôm nay: không ghi btv
    const so = d.sql.prepare("SELECT raw_json FROM su_kien_hoc WHERE qid = 'Q3~bt0'").get() as { raw_json: string }
    expect(JSON.parse(so.raw_json)).toEqual({ ht_cau_version:'v1', chon: bt0.correct, tc: 'Q3' })
  })
  it('tham chiếu CŨ (phiên tạo trước 06/10, không có btv) ⇒ phiên bản 1: resume / chuyến chờ / chấm y hệt câu đã phát', async () => {
    const { d, env, r, bt0 } = await batDau()
    suaRef(d, r.id, (x) => { delete x.btv })
    expect('btv' in phien(d, r.id).questions[0]!).toBe(false)
    const rs = await em(env, '/game-v2/resume', {})
    expect(rs.questions[0]).toMatchObject({ qid: 'Q3~bt0', text: bt0.text })
    const lai = await em(env, '/game-v2/start', { mode: 'adventure' })
    expect(lai.id).toBe(r.id); expect(lai.questions[0].text).toBe(bt0.text)
    expect((await em(env, '/game-v2/answer', { session: r.id, qid: 'Q3~bt0', answer: bt0.correct })).correct).toBe(true)
  })
  it('số phiên bản LẠ ⇒ lùi về câu gốc: resume / chuyến chờ hiện câu gốc (qid ảo giữ nguyên), chấm theo đáp án câu gốc, không lỗi', async () => {
    const { d, env, r, bt0 } = await batDau()
    suaRef(d, r.id, (x) => { x.btv = 99 })
    const rs = await em(env, '/game-v2/resume', {})
    expect(rs.ok).toBe(true)
    expect(rs.questions[0]).toMatchObject({ qid: 'Q3~bt0', text: 'Đề câu Q3' })
    expect(JSON.stringify(rs)).not.toContain('"correct"')
    const lai = await em(env, '/game-v2/start', { mode: 'adventure' })
    expect(lai.questions[0]).toMatchObject({ qid: 'Q3~bt0', text: 'Đề câu Q3' })
    const t = await em(env, '/game-v2/answer', { session: r.id, qid: 'Q3~bt0', answer: '4,5' })
    expect(t.ok, JSON.stringify(t).slice(0, 300)).toBe(true)
    expect(t.correct).toBe(true)
    expect(t.answer).toBe('4,5')
    expect(bt0.correct).not.toBe('4,5')
  })
  it('Đoàn: ref câu của chặng mang btv = 1; phiên bản lạ ⇒ chặng hiện câu gốc (không rút câu, không lỗi)', async () => {
    const { d, env } = dung()
    d.sql.exec('DELETE FROM game_v2_session') // không có nhịp Đảo ⇒ câu ôn vào Đoàn
    vi.setSystemTime(luc('2026-10-06'))
    const mo = await em(env, '/game-v2/doan-mo', {})
    expect(mo.ok, JSON.stringify(mo).slice(0, 400)).toBe(true)
    const ma = String(mo.doan.ma)
    const row = d.sql.prepare('SELECT json FROM doan_chang WHERE ma = ?').get(ma) as { json: string }
    const phong = JSON.parse(row.json) as { nguoi: { cau: Record<string, unknown>[] }[] }
    expect(phong.nguoi[0]!.cau[0]).toMatchObject({ qid: 'Q3~bt0', btv: 1 })
    vi.setSystemTime(Date.now() + DEM_NGUOC_MS + 500)
    const bt0 = apBienThe(gocQ3(d), 'Q3~bt0', 11)!
    expect((await em(env, '/game-v2/doan-xem', { ma })).doan.cau.de.text).toBe(bt0.text)
    phong.nguoi[0]!.cau[0]!.btv = 99
    d.sql.prepare('UPDATE doan_chang SET json = ? WHERE ma = ?').run(JSON.stringify(phong), ma)
    const xem = await em(env, '/game-v2/doan-xem', { ma })
    expect(xem.ok).toBe(true)
    expect(xem.doan.cau).toMatchObject({ qid: 'Q3~bt0', de: { text: 'Đề câu Q3' } })
    expect(xem.doan.cau.rut).toBeUndefined()
  })
})

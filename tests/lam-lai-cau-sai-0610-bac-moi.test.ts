// @vitest-environment node
// LÀM LẠI CÂU SAI — ĐỢT 2 (06/10, làn A): thang MỚI = song sinh → BIẾN THỂ BẰNG MÃ (`~bt`, Phần I/III có bộ sinh) | Ý ĐÚNG–SAI MỚI (`~yd`, Phần II) →
// câu anh em (DẠY HỌC rồi TU LUYỆN) → bản xáo → nguyên văn; và câu NGHI sai đáp án bị loại ở cổng cuối của em. Nghiệm thu trên D1 THẬT (node:sqlite, đủ migration),
// mọi lệnh của em đi qua đúng đường Worker thật (`server/src/index.ts`). Đặc tả: DE-XUAT-LAM-LAI-CAU-SAI-0510.md; tệp đợt 1: lam-lai-cau-sai-0510-d1.test.ts.
// Kho thử: tờ khối 11 (của em), tờ khối 10 / 12, kho TU LUYỆN (mã `DB-…` ⇒ luật lùi TU_LUYEN) — CÙNG dạng, cùng mức, chưa gặp ⇒ chỉ luật khối chặn được câu khác khối.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { xoaDemPhamVi } from '../server/src/bai-da-day'
import { docHoSo2, docLanLam, xoaDemChienDich } from '../server/src/srs2-d1'
import { DEM_NGUOC_MS } from '../server/src/game-v2-doan'
import { damBaoBangYDs, docYDsTheoQid } from '../server/src/cau-y-ds'
import { damBaoBangTuHoanThien, dsCauNghi } from '../server/src/tu-hoan-thien'
import { chanKhacKhoiDong, chanKhacKhoiEm, chanKhacKhoiLop, chanKhacKhoiTheoEm, congKhoi, demChanKhoi, docCauNghiDem, xoaDemCauNghi, xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { apBienThe, cacHoDe, sinhBienThe } from '../server/src/bien-the-sinh'
import { apYDsMoi, bienTheTheoQid, chonBanKhacMoi, deCoHinh, nhomYDs, phuQidAoMoi } from '../server/src/ban-khac-ao'
import { loaiQidAo, tachSongSinh } from '../server/src/loi-hoc-luat'
import { tiepBanKhacMoi } from '../server/src/lam-lai-so'
import { grade, publicQuestion, type PrivateQuestion } from '../src/game/than-thu-v2/core'
import type { Env } from '../server/src/kieu'

type Phan = 'I' | 'II' | 'III'
interface CauThu { qid: string; maDe: string; phan: Phan; dang: string; mucDo: string; correct: string; group?: string; solution?: unknown; text?: string }
const TO11 = 'DH-11-B1', TO10 = 'DH-10-B1', TO12 = 'DH-12-B1'
const TL11 = 'DB-11-T1', TL10 = 'DB-10-T1', TL11X = 'DB-11-T2' // kho TU LUYỆN (không bắt đầu bằng DH- ⇒ TU_LUYEN); TL11X: mã khối 11 nhưng cột lớp ghi 10 (mâu thuẫn)
const LOP_TO: Record<string, string | null> = { [TO11]: '11', [TO10]: '10', [TO12]: '12', [TL11]: '11', [TL10]: '10', [TL11X]: '10' }
const PA = (qid: string, k: string) => `${qid} — giá trị ${'ABCD'.indexOf(k) + 1}`
const Y = (qid: string, i: number) => `${qid} — ý ${i + 1}`
const cauJson = (c: CauThu) => ({
  qid: c.qid, maDe: c.maDe, version: 'v1', group: c.group ?? `g-${c.qid}`, phan: c.phan, text: c.text ?? `Đề câu ${c.qid}`,
  choices: c.phan === 'I' ? ['A', 'B', 'C', 'D'].map((k) => PA(c.qid, k)) : [], ideas: c.phan === 'II' ? [0, 1, 2, 3].map((i) => Y(c.qid, i)) : [],
  hinhAnh: [], dang: c.dang, tenDang: `Dạng ${c.dang}`, mucDo: c.mucDo, sao: 1, kienThuc: ['K1'], correct: c.correct, reviewed: true,
  solution: c.solution ?? { chot: 'Bảo toàn khối lượng cho cả quá trình.' },
})
const ngayVnCua = (ms: number) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
const luc = (ngay: string, gio = '08:00') => Date.parse(`${ngay}T${gio}:00+07:00`)

interface TuyChonKho { ngoaiPhamVi?: string[]; loTo?: Record<string, string | null> }
/** Em S1 lớp 11A1 (khối 11), Game Hóa 2.0 + Đoàn bật, phạm vi đã dạy = mọi tờ của kho TRỪ `ngoaiPhamVi`, chiến dịch CD1 chứa các câu `cd`. */
function dung(kho: CauThu[], cd: string[], tuyChon: TuyChonKho = {}): { d: D1That; env: Env } {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','11A1','mk1','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["11A1"]}','x'),('doan_ho_tong','{"toanBo":true}','x')`)
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  const lopTo = { ...LOP_TO, ...(tuyChon.loTo ?? {}) }
  const to = [...new Set(kho.map((c) => c.maDe))]
  for (const m of to) {
    d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,0,?)').run(m, `Tờ ${m}`, lopTo[m] ?? null, kho.filter((c) => c.maDe === m).length, 'v1')
    d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(m)
  }
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const c of kho) st.run(c.maDe, c.qid, 'v1', c.group ?? `g-${c.qid}`, c.dang, JSON.stringify(cauJson(c)))
  const trongBai = to.filter((m) => !(tuyChon.ngoaiPhamVi ?? []).includes(m))
  d.sql.prepare("INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('T1','11A1','B1','Bài 1',1,?,'2026-10-01T00:00:00.000Z')").run(JSON.stringify(trongBai))
  d.sql.prepare("INSERT INTO chien_dich(id,ten,lop,sbd_json,ma_de_json,qid_json,han_nop,tao_luc) VALUES('CD1','Ôn chương 1','11A1','[\"S1\"]',?,?,'2026-10-30','2026-10-01T00:00:00.000Z')")
    .run(JSON.stringify([TO11]), JSON.stringify(cd))
  return { d, env }
}
/** Một lượt TỰ LÀM của S1 (sổ chuẩn). */
function ghi(d: D1That, qid: string, kq: 0 | 1, ms: number, nguon = 'luyen') {
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance) VALUES(?,?,?,?,?,1,?,?,?,?)')
    .run(`${nguon}|S1|${qid}|${ms}`, 'S1', qid, nguon, `M-${ms}`, kq, new Date(ms).toISOString(), ngayVnCua(ms), 'none')
}
const em = async (env: Env, duong: string, b: Record<string, unknown> = {}) => goiWorker(worker, env, duong, { token: await gameToken(env, 'S1'), ...b })
const dao = (env: Env) => em(env, '/game-v2/start', { mode: 'adventure' })
const phien = (d: D1That, id: string) => JSON.parse((d.sql.prepare('SELECT json FROM game_v2_session WHERE id = ?').get(id) as { json: string }).json) as { questions: Record<string, unknown>[] }
const soCua = (d: D1That, qid: string) => d.sql.prepare("SELECT qid, ket_qua, ngay_vn, raw_json, subitem_json FROM su_kien_hoc WHERE sbd = 'S1' AND qid = ? AND nguon = 'game' ORDER BY luc").all(qid) as { qid: string; ket_qua: number; ngay_vn: string; raw_json: string | null; subitem_json: string | null }[]
/** Không khoá nào của đáp án / lời giải / khoá làm lại nội bộ trong phản hồi. */
function khongLoDapAn(r: unknown) {
  const s = JSON.stringify(r)
  for (const k of ['"correct"', '"solution"', '"answer"', '"dapAn"', '"tc"', '"xt"', '"nv"', '"traLoiGoc"', '"bienThe"', '"yd_moi"', '"bien_the"']) expect(s, `phản hồi lộ ${k}`).not.toContain(k)
}
const gocCua = (d: D1That, qid: string) => JSON.parse((d.sql.prepare('SELECT json FROM game_v2_question WHERE qid = ?').get(qid) as { json: string }).json) as PrivateQuestion
const luotMoi = (env: Env, d: D1That) => { d.sql.exec('DELETE FROM game_v2_session'); return dao(env) }

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); xoaDemCaBaoVe(); xoaDemChienDich(); xoaDemPhamVi(); xoaDemCauNghi(); xoaDemChanKhoi() })
afterEach(() => vi.useRealTimers())

// ───────────────────────── A1 · BIẾN THỂ BẰNG MÃ (~bt) ─────────────────────────
const HO11 = cacHoDe().find((h) => h.khoiChuong === 11)!
const DANG_BT = HO11.cacDang.find((dg) => sinhBienThe(dg, 'thử', 'III', 'hieu', { maDe: TO11 }) !== null && sinhBienThe(dg, 'thử', 'I', 'hieu', { maDe: TO11 }) !== null)!
const Q3: CauThu = { qid: 'Q3', maDe: TO11, phan: 'III', dang: DANG_BT, mucDo: 'TH', correct: '4,5' }
const Q3I: CauThu = { qid: 'Q3I', maDe: TO11, phan: 'I', dang: DANG_BT, mucDo: 'TH', correct: 'B' }

describe('A1 · khối 11 sai câu Phần III có bộ sinh, không song sinh ⇒ lượt làm lại là `~bt` ĐÚNG KHỐI', () => {
  async function dungBT(kho: CauThu[] = [Q3], cd = ['Q3']) {
    const r = dung(kho, cd)
    // Nhịp kênh: 7 ngày qua em chỉ mở chuyến Đảo (không Đoàn) ⇒ kế hoạch đưa câu ôn Phần I/III vào Đảo.
    r.d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('CU1', 'S1', JSON.stringify({ mode: 'adventure', created: luc('2026-10-04'), hoa2: 1, questions: [] }), new Date(luc('2026-10-04')).toISOString())
    return r
  }
  it('bộ sinh có cho dạng đã chọn (Phần I và III); câu gốc của khối 11', () => {
    expect(DANG_BT).toBeTruthy()
    expect(HO11.khoiChuong).toBe(11)
  })

  it('Đảo: lượt là Q3~bt0 (đề KHÁC câu gốc, vai ôn lại), không lộ đáp án; phiên ghi tc = Q3 + version/group của câu gốc; resume sinh LẠI đúng câu', async () => {
    const { d, env } = await dungBT()
    ghi(d, 'Q3', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const r = await dao(env)
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect(r.questions.map((q: { qid: string }) => q.qid)).toEqual(['Q3~bt0'])
    expect(r.questions[0]).toMatchObject({ vai: 'on_lai', phan: 'III', version: 'v1', group: 'g-Q3', maDe: TO11 })
    expect(r.questions[0].text).not.toBe('Đề câu Q3')
    khongLoDapAn(r)
    expect(phien(d, r.id).questions[0]).toMatchObject({ qid: 'Q3~bt0', tc: 'Q3', role: 'on_lai', version: 'v1', group: 'g-Q3', maDe: TO11 })
    // Tất định: cùng (qid ảo, câu gốc) ⇒ cùng câu — chuyến chờ trả lại + resume.
    const lai = await dao(env)
    expect(lai.id).toBe(r.id)
    expect(lai.questions[0].text).toBe(r.questions[0].text)
    const rs = await em(env, '/game-v2/resume', {})
    expect(rs.id).toBe(r.id)
    expect(rs.questions[0].text).toBe(r.questions[0].text)
    khongLoDapAn(rs)
    // Sinh bằng mã độc lập với máy chủ: cùng hạt giống ⇒ cùng đề.
    expect(apBienThe(gocCua(d, 'Q3'), 'Q3~bt0', 11)!.text).toBe(r.questions[0].text)
  })

  it('chấm theo câu SINH LẠI: sai ⇒ sai; đúng ⇒ đúng; sổ ghi dưới qid ảo + tc = Q3 + đáp án em chọn; đúng độc lập ⇒ phatLaiLoi(Q3) tiến như lượt song sinh; ngày sau là ~bt1', async () => {
    const { d, env } = await dungBT()
    ghi(d, 'Q3', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const r1 = await dao(env)
    const bt0 = apBienThe(gocCua(d, 'Q3'), 'Q3~bt0', 11)!
    const sai = await em(env, '/game-v2/answer', { session: r1.id, qid: 'Q3~bt0', answer: '99999' })
    expect(sai.ok, JSON.stringify(sai).slice(0, 300)).toBe(true)
    expect(sai.correct).toBe(false)
    expect(sai.answer).toBe(bt0.correct) // đáp án chỉ về SAU khi chấm
    // Lượt đã trả lời: nộp lại cùng câu ⇒ phát lại (replayed), không chấm lại.
    expect((await em(env, '/game-v2/answer', { session: r1.id, qid: 'Q3~bt0', answer: bt0.correct })).replayed).toBe(true)
    const so1 = soCua(d, 'Q3~bt0')
    expect(so1.map((x) => ({ kq: x.ket_qua, raw: JSON.parse(x.raw_json ?? '{}') }))).toEqual([{ kq: 0, raw: { chon: '99999', tc: 'Q3' } }])
    expect(soCua(d, 'Q3')).toEqual([]) // câu gốc không bao giờ ra nguyên văn trong cửa sổ lỗi
    // Ngày 2: sai lần hai (lỗi MỞ LẠI) ⇒ k kế tiếp = 1 ⇒ Q3~bt1 (đề khác bt0).
    vi.setSystemTime(luc('2026-10-07'))
    const r2 = await dao(env)
    expect(r2.questions.map((q: { qid: string }) => q.qid)).toEqual(['Q3~bt1'])
    expect(r2.questions[0].text).not.toBe(r1.questions[0].text)
    const bt1 = apBienThe(gocCua(d, 'Q3'), 'Q3~bt1', 11)!
    expect(bt1.text).toBe(r2.questions[0].text)
    expect((await em(env, '/game-v2/answer', { session: r2.id, qid: 'Q3~bt1', answer: bt1.correct })).correct).toBe(true)
    const hs2 = await docHoSo2(env, 'S1', '2026-10-07')
    expect(hs2.loiV2?.get('Q3')).toMatchObject({ trangThai: 'cho_kiem', soLanSai: 2, ngayDung: ['2026-10-07'], daDungSongSinh: true })
    expect(hs2.banKhacTiep?.get('Q3')).toEqual({ bt: 2, yd: 0 })
    // Lịch sử của Q3: hai lượt song sinh quy về gốc, mang qid ảo thật.
    expect((await docLanLam(env, 'S1', ['Q3'])).filter((x) => x.songSinh).map((x) => ({ qid: x.qid, dung: x.dung, ao: x.cauAnhEm }))).toEqual([{ qid: 'Q3', dung: false, ao: 'Q3~bt0' }, { qid: 'Q3', dung: true, ao: 'Q3~bt1' }])
    // Hôm nay Q3 đã làm (qua bản biến thể) ⇒ hết việc Đảo hôm nay.
    expect((await dao(env)).questions).toEqual([])
    // Ngày 4 (10/10 — cách lần sai cuối ≥ 3 ngày, ngày đúng thứ hai): bt2 đúng ⇒ ĐÓNG LỖI đúng luật, y hệt một lượt song sinh.
    vi.setSystemTime(luc('2026-10-10'))
    const r3 = await dao(env)
    expect(r3.questions.map((q: { qid: string }) => q.qid)).toEqual(['Q3~bt2'])
    const bt2 = apBienThe(gocCua(d, 'Q3'), 'Q3~bt2', 11)!
    expect((await em(env, '/game-v2/answer', { session: r3.id, qid: 'Q3~bt2', answer: bt2.correct })).correct).toBe(true)
    expect((await docHoSo2(env, 'S1', '2026-10-10')).loiV2?.get('Q3')).toMatchObject({ trangThai: 'dong', dongNgay: '2026-10-10', ngayDung: ['2026-10-07', '2026-10-10'] })
  })

  it('Phần I cũng ra biến thể (đủ 4 phương án mới, không lộ đáp án); chấm đúng chữ cái của câu SINH LẠI', async () => {
    const { d, env } = await dungBT([Q3I], ['Q3I'])
    ghi(d, 'Q3I', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const r = await dao(env)
    expect(r.questions.map((q: { qid: string }) => q.qid)).toEqual(['Q3I~bt0'])
    expect(r.questions[0].choices).toHaveLength(4)
    expect(r.questions[0].choices).not.toEqual(['A', 'B', 'C', 'D'].map((k) => PA('Q3I', k)))
    khongLoDapAn(r)
    const bt = apBienThe(gocCua(d, 'Q3I'), 'Q3I~bt0', 11)!
    expect(['A', 'B', 'C', 'D']).toContain(bt.correct)
    const t = await em(env, '/game-v2/answer', { session: r.id, qid: 'Q3I~bt0', answer: bt.correct })
    expect(t.correct).toBe(true)
    expect(JSON.parse(soCua(d, 'Q3I~bt0')[0]!.raw_json!)).toEqual({ chon: bt.correct, tc: 'Q3I' })
  })

  it('Đoàn: chặng cho Phần III là ~bt0 (đề riêng, không lộ đáp án); nộp đúng ⇒ sổ ghi dưới ~bt0 + tc, Q3 tiến luật đóng lỗi', async () => {
    const { d, env } = dung([Q3], ['Q3'])
    ghi(d, 'Q3', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const mo = await em(env, '/game-v2/doan-mo', {})
    expect(mo.ok, JSON.stringify(mo).slice(0, 400)).toBe(true)
    const ma = String(mo.doan.ma)
    vi.setSystemTime(Date.now() + DEM_NGUOC_MS + 500)
    const xem = await em(env, '/game-v2/doan-xem', { ma })
    expect(xem.ok, JSON.stringify(xem).slice(0, 400)).toBe(true)
    const cau = xem.doan.cau as { qid: string; de: { text: string } }
    expect(cau.qid).toBe('Q3~bt0')
    expect(cau.de.text).not.toBe('Đề câu Q3')
    khongLoDapAn(xem)
    const bt = apBienThe(gocCua(d, 'Q3'), 'Q3~bt0', 11)!
    expect(cau.de.text).toBe(bt.text)
    const nop = await em(env, '/game-v2/doan-nop', { ma, hiep: xem.doan.tran.hiep, answer: bt.correct, hanhDong: 'danh' })
    expect(nop.ok, JSON.stringify(nop).slice(0, 300)).toBe(true)
    expect(nop.ketQuaCau.correct).toBe(true)
    expect(soCua(d, 'Q3~bt0').map((x) => ({ kq: x.ket_qua, tc: JSON.parse(x.raw_json ?? '{}').tc }))).toEqual([{ kq: 1, tc: 'Q3' }])
    expect((await docHoSo2(env, 'S1', '2026-10-06')).loiV2?.get('Q3')).toMatchObject({ trangThai: 'cho_kiem', daDungSongSinh: true })
  })

  it('tắt khoá lam_lai_khac ⇒ y hệt hôm nay: Q3 nguyên văn, phiên và sổ không có khoá làm lại nào', async () => {
    const { d, env } = await dungBT()
    d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('lam_lai_khac','{"bat":false}','x')`)
    xoaDemCauHinh(env)
    ghi(d, 'Q3', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const r = await dao(env)
    expect(r.questions.map((q: { qid: string }) => q.qid)).toEqual(['Q3'])
    expect(r.questions[0].text).toBe('Đề câu Q3')
    const ref = phien(d, r.id).questions[0]!
    for (const k of ['tc', 'xt', 'nv']) expect(k in ref, `phiên có khoá ${k}`).toBe(false)
    const t = await em(env, '/game-v2/answer', { session: r.id, qid: 'Q3', answer: '4,5' })
    expect(t.correct).toBe(true)
    expect(JSON.parse(soCua(d, 'Q3')[0]!.raw_json!)).toEqual({ chon: '4,5' })
  })

  it('OMNI BẬT (bản sống đang bật cho mọi em): nộp ~bt ⇒ kết quả có omni, sổ ghi tc + {ms, tt, td}, câu đúng tính cho Q3; sai nhanh vẫn xét lướt như câu thường', async () => {
    const { d, env } = await dungBT()
    d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('omni','{"bat":true,"lop":[],"sbd":[]}','x')`)
    xoaDemCauHinh(env)
    ghi(d, 'Q3', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const r = await dao(env)
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect((r.questions as { qid: string }[]).map((q) => q.qid)).toContain('Q3~bt0')
    khongLoDapAn(r)
    const bt = apBienThe(gocCua(d, 'Q3'), 'Q3~bt0', 11)!
    const t = await em(env, '/game-v2/answer', { session: r.id, qid: 'Q3~bt0', answer: bt.correct, msLam: 90_000, tuTin: 'chac' })
    expect(t.ok, JSON.stringify(t).slice(0, 300)).toBe(true)
    expect(t.correct).toBe(true)
    expect('omni' in t).toBe(true)
    const so = soCua(d, 'Q3~bt0')
    expect(so).toHaveLength(1)
    expect(JSON.parse(so[0]!.raw_json!)).toMatchObject({ chon: bt.correct, tc: 'Q3', ms: 90_000, tt: 'chac' })
    expect((await docHoSo2(env, 'S1', '2026-10-06')).loiV2?.get('Q3')).toMatchObject({ trangThai: 'cho_kiem', daDungSongSinh: true })
  })

  it('dạng KHÔNG có bộ sinh (D5) ⇒ không ~bt: rơi xuống nguyên văn có đếm (Phần III, không anh em)', async () => {
    const Q5: CauThu = { qid: 'Q5', maDe: TO11, phan: 'III', dang: 'D5', mucDo: 'TH', correct: '4,5' }
    const { d, env } = await dungBT([Q5], ['Q5'])
    ghi(d, 'Q5', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const r = await dao(env)
    expect(r.questions.map((q: { qid: string }) => q.qid)).toEqual(['Q5'])
    expect(phien(d, r.id).questions[0]).toMatchObject({ qid: 'Q5', nv: 1 })
  })
})

describe('A1 · LUẬT KHỐI của bậc mới (thầy 05/10: chặn 100% không rút nhầm khối khác)', () => {
  const goc = (maDe: string, k: number): PrivateQuestion => ({ ...(cauJson({ qid: `G${k}`, maDe, phan: 'III', dang: DANG_BT, mucDo: 'TH', correct: '4,5' }) as unknown as PrivateQuestion) })
  it('chonBanKhacMoi: chỉ câu ĐÚNG khối em; em lớp 11 không nhận biến thể câu lớp 10 / 12 / không rõ khối; khối em không rõ ⇒ rỗng', async () => {
    const env = taoD1That().env as unknown as Env
    // cX: mã tờ khối 11 nhưng cột `lop` ghi 12 ⇒ nguồn khối MÂU THUẪN ⇒ không rõ khối ⇒ không em nào nhận.
    const c11 = goc(TO11, 11), c10 = goc(TO10, 10), c12 = goc(TO12, 12), cX = { ...goc(TO11, 0), qid: 'GX', lop: '12' } as PrivateQuestion
    const ra = await chonBanKhacMoi(env, [c11, c10, c12, cX], undefined, 11)
    expect([...ra.keys()]).toEqual(['G11'])
    expect(ra.get('G11')!.qid).toBe('G11~bt0')
    expect([...(await chonBanKhacMoi(env, [c11, c10, c12], undefined, 10)).keys()]).toEqual(['G10'])
    expect([...(await chonBanKhacMoi(env, [c11, c10, c12], undefined, 12)).keys()]).toEqual(['G12'])
    expect((await chonBanKhacMoi(env, [c11, c10, c12], undefined, null)).size).toBe(0)
    // Khoá khối ở MỌI mức: bienTheTheoQid cũng tự chặn (apBienThe).
    expect(bienTheTheoQid(c11, 'G11~bt0', 12)).toBeNull()
    expect(bienTheTheoQid(c11, 'G11~bt0', 10)).toBeNull()
    expect(bienTheTheoQid(c11, 'G11~bt0', 11)).not.toBeNull()
  })
  it('tiếp theo k: hạt kế tiếp lấy từ banKhacTiep; biến thể giữ version + group của câu gốc, không còn khoá bienThe', async () => {
    const env = taoD1That().env as unknown as Env
    const c11 = goc(TO11, 11)
    const k2 = (await chonBanKhacMoi(env, [c11], new Map([['G11', { bt: 2, yd: 0 }]]), 11)).get('G11')!
    expect(k2.qid).toBe('G11~bt2')
    expect(k2).toMatchObject({ version: 'v1', group: 'g-G11', maDe: TO11 })
    expect('bienThe' in k2).toBe(false)
    expect(JSON.stringify(publicQuestion(k2))).not.toContain('"correct"')
    expect(k2.text).not.toBe(c11.text)
  })
})

// ───────────────────────── A2 · Ý ĐÚNG–SAI MỚI (~yd) ─────────────────────────
const Q2: CauThu = { qid: 'Q2', maDe: TO11, phan: 'II', dang: 'D2', mucDo: 'TH', correct: 'DSSD' }
const A2: CauThu = { qid: 'A2', maDe: TO11, phan: 'II', dang: 'D2', mucDo: 'TH', correct: 'SDDS' } // anh em cùng mức (bậc 2 khi hết ý mới)
const KHAC_KHOI: CauThu[] = [
  { qid: 'L10', maDe: TO10, phan: 'II', dang: 'D2', mucDo: 'TH', correct: 'SSDD' },
  { qid: 'L12', maDe: TO12, phan: 'II', dang: 'D2', mucDo: 'TH', correct: 'SSDD' },
]
const MAU_Y = ['DDSS', 'SDSD', 'SSSD', 'DSDS', 'DDDS', 'SDDD', 'DSSS', 'SSDS'] // đáp án 8 ý giả
const yMoi = (i: number) => `Ý mới số ${i + 1} của câu Q2`
/** Kho ý Đ–S giả: `n` ý của câu Q2 (băm BAMQ2); `lop`/`maDe` mặc định là của câu gốc (khối 11). */
async function nhapKhoY(d: D1That, env: Env, n: number, opt: { lop?: string; maDe?: string; qidHoi?: string } = {}) {
  await damBaoBangYDs(env)
  d.sql.prepare("INSERT OR IGNORE INTO loi_giai_cau(qid,bam,ma_de,dang,cap_nhat_luc) VALUES(?, 'BAMQ2', ?, 'ds', 'x')").run(opt.qidHoi ?? 'Q2', TO11)
  const st = d.sql.prepare("INSERT INTO cau_y_ds(bam,khoa_y,stt,noi_dung,gia_tri,ly_do,nguon,luc,qid_mau,ma_de,lop,kiem_json) VALUES('BAMQ2',?,?,?,?,?,'may_soan_2_luot','2026-10-05T00:00:00.000Z','Q2',?,?,NULL)")
  for (let i = 0; i < n; i++) st.run(`khoa${i}`, i + 1, yMoi(i), MAU_Y[i % 8]![0] === 'D' ? 'D' : 'S', `Lý do ý ${i + 1}`, opt.maDe ?? TO11, opt.lop ?? '11')
}
/** Đáp án Đ/S của nhóm ý k (4 ý liền nhau) theo kho giả. */
const mauNhom = (k: number) => [0, 1, 2, 3].map((i) => (MAU_Y[k * 4 + i]![0] === 'D' ? 'D' : 'S')).join('')

describe('A2 · Phần II: đủ ý trong kho ⇒ `~yd` (4 ý CHƯA gặp của đúng đề dẫn); kho rỗng / thiếu ý ⇒ rơi xuống, không lỗi', () => {
  it('8 ý trong kho: Đảo ra Q2~yd0 (4 ý đầu, thứ tự stt), không lộ đáp án; resume y hệt; chấm đúng theo ý MỚI; sổ ghi dưới ~yd0 + tc, KHÔNG ghi từng ý', async () => {
    const { d, env } = dung([Q2, A2, ...KHAC_KHOI], ['Q2'])
    await nhapKhoY(d, env, 8)
    ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const r = await dao(env)
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect(r.questions.map((q: { qid: string }) => q.qid)).toEqual(['Q2~yd0'])
    expect(r.questions[0]).toMatchObject({ vai: 'on_lai', phan: 'II', text: 'Đề câu Q2', ideas: [0, 1, 2, 3].map(yMoi), version: 'v1', group: 'g-Q2' })
    khongLoDapAn(r)
    expect(JSON.stringify(r)).not.toContain('Q2 — ý') // không còn ý gốc của Q2
    expect(phien(d, r.id).questions[0]).toMatchObject({ qid: 'Q2~yd0', tc: 'Q2', role: 'on_lai' })
    const rs = await em(env, '/game-v2/resume', {})
    expect(rs.questions[0].ideas).toEqual([0, 1, 2, 3].map(yMoi))
    khongLoDapAn(rs)
    // Chấm theo ý MỚI: mẫu gốc của Q2 (DSSD) không còn nghĩa.
    const t = await em(env, '/game-v2/answer', { session: r.id, qid: 'Q2~yd0', answer: mauNhom(0) })
    expect(t.ok, JSON.stringify(t).slice(0, 300)).toBe(true)
    expect(t.correct).toBe(true)
    expect(t.answer).toBe(mauNhom(0))
    expect(t.solution.tung_y.a).toMatchObject({ dung: mauNhom(0)[0] === 'D', vi_sao: 'Lý do ý 1' })
    const so = soCua(d, 'Q2~yd0')
    expect(so).toHaveLength(1)
    expect(JSON.parse(so[0]!.raw_json!)).toEqual({ chon: mauNhom(0), tc: 'Q2' })
    expect(so[0]!.subitem_json).toBeNull() // ý mới khác ý gốc ⇒ không ghi kết quả từng ý theo khung của câu gốc
    expect(soCua(d, 'Q2')).toEqual([])
    // Y HỆT một lượt song sinh đúng: lỗi Q2 chờ kiểm, banKhacTiep.yd = 1.
    const hs = await docHoSo2(env, 'S1', '2026-10-06')
    expect(hs.loiV2?.get('Q2')).toMatchObject({ trangThai: 'cho_kiem', ngayDung: ['2026-10-06'], daDungSongSinh: true, denHan: '2026-10-08' })
    expect(hs.banKhacTiep?.get('Q2')).toEqual({ bt: 0, yd: 1 })
    // Ngày 3: nhóm ý kế (ý 5–8) = ý CHƯA gặp; đúng lần hai ⇒ đóng lỗi.
    vi.setSystemTime(luc('2026-10-08'))
    const r3 = await dao(env)
    expect(r3.questions.map((q: { qid: string }) => q.qid)).toEqual(['Q2~yd1'])
    expect(r3.questions[0].ideas).toEqual([4, 5, 6, 7].map(yMoi))
    expect((await em(env, '/game-v2/answer', { session: r3.id, qid: 'Q2~yd1', answer: mauNhom(1) })).correct).toBe(true)
    expect((await docHoSo2(env, 'S1', '2026-10-08')).loiV2?.get('Q2')).toMatchObject({ trangThai: 'dong', dongNgay: '2026-10-08' })
    // Kiểm duy trì (≥ 14 ngày): hết ý chưa gặp (kho chỉ 8 ý) ⇒ RƠI XUỐNG câu anh em A2, không lỗi.
    vi.setSystemTime(luc('2026-10-23'))
    const r4 = await dao(env)
    expect(r4.ok, JSON.stringify(r4).slice(0, 300)).toBe(true)
    expect(r4.questions.map((q: { qid: string }) => q.qid)).toEqual(['A2'])
    expect(phien(d, r4.id).questions[0]).toMatchObject({ qid: 'A2', tc: 'Q2' })
  })

  it('kho ý RỖNG (bảng có, không dòng) hoặc CHƯA có bảng ⇒ rơi xuống câu anh em A2, không lỗi', async () => {
    for (const coBang of [true, false]) {
      const { d, env } = dung([Q2, A2, ...KHAC_KHOI], ['Q2'])
      if (coBang) await damBaoBangYDs(env)
      else d.sql.exec('DROP TABLE IF EXISTS cau_y_ds')
      ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
      vi.setSystemTime(luc('2026-10-06'))
      const r = await dao(env)
      expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
      expect(r.questions.map((q: { qid: string }) => q.qid), coBang ? 'bảng rỗng' : 'chưa có bảng').toEqual(['A2'])
    }
  })

  it('chỉ 6 ý (< 8): nhóm 1 dùng được, nhóm 2 thiếu ý chưa gặp ⇒ lượt sau rơi xuống anh em', async () => {
    const { d, env } = dung([Q2, A2, ...KHAC_KHOI], ['Q2'])
    await nhapKhoY(d, env, 6)
    ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const r = await dao(env)
    expect(r.questions.map((q: { qid: string }) => q.qid)).toEqual(['Q2~yd0'])
    await em(env, '/game-v2/answer', { session: r.id, qid: 'Q2~yd0', answer: mauNhom(0).split('').map((x) => (x === 'D' ? 'S' : 'D')).join('') }) // sai ⇒ lỗi mở lại
    vi.setSystemTime(luc('2026-10-07'))
    const r2 = await dao(env)
    expect(r2.questions.map((q: { qid: string }) => q.qid)).toEqual(['A2'])
  })

  it('LUẬT KHỐI: ý soạn từ câu cùng băm ở tờ KHỐI 12 (lop 12) ⇒ không bao giờ phát cho em khối 11 (rơi xuống anh em)', async () => {
    const { d, env } = dung([Q2, A2, ...KHAC_KHOI], ['Q2'])
    await nhapKhoY(d, env, 8, { lop: '12', maDe: TO12 })
    ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const r = await dao(env)
    expect(r.questions.map((q: { qid: string }) => q.qid)).toEqual(['A2'])
    // Đối chứng: cùng kho ý nhưng lop 11 ⇒ ra ~yd0 (bộ chọn có ứng viên — ý bị loại chỉ vì khối).
    const k = dung([Q2, A2, ...KHAC_KHOI], ['Q2'])
    await nhapKhoY(k.d, k.env, 8)
    ghi(k.d, 'Q2', 0, luc('2026-10-05', '10:00'))
    expect((await dao(k.env)).questions.map((q: { qid: string }) => q.qid)).toEqual(['Q2~yd0'])
  })

  it('câu có HÌNH / ảnh trong đề ⇒ không dùng ý mới (máy soạn chỉ thấy chữ) — rơi xuống anh em; câu đang nghi đáp án ⇒ kho ý không dùng', async () => {
    const goc = gocCuaTho(Q2)
    expect(deCoHinh(goc)).toBe(false)
    expect(deCoHinh({ ...goc, hinhAnh: [{ src: 'data:image/png;base64,AAAA', viTri: 'sau_de' }] })).toBe(true)
    expect(deCoHinh({ ...goc, hinhAnh: [{ src: 'data:image/png;base64,AAAA', viTri: 'sau_loi_giai' }] })).toBe(false)
    expect(deCoHinh({ ...goc, thanCauImg: 'x' })).toBe(true)
    const ys = [0, 1, 2, 3].map((i) => ({ bam: 'B', stt: i + 1, t: yMoi(i), d: MAU_Y[i]![0] === 'D' ? 'D' as const : 'S' as const, lyDo: 'l', nguon: 'n', luc: 'x', qid: 'Q2', maDe: TO11, lop: '11' }))
    expect(apYDsMoi({ ...goc, hinhAnh: [{ src: 'data:image/png;base64,AAAA', viTri: 'sau_de' }] }, 'Q2~yd0', ys)).toBeNull()
    expect(apYDsMoi(goc, 'Q2~yd0', ys.slice(0, 3))).toBeNull()
    const q = apYDsMoi(goc, 'Q2~yd0', ys)!
    expect(q).toMatchObject({ qid: 'Q2~yd0', ideas: [0, 1, 2, 3].map(yMoi), correct: mauNhom(0), version: 'v1', group: 'g-Q2' })
    expect(Object.keys(publicQuestion(q))).not.toEqual(expect.arrayContaining(['correct', 'solution']))
    // nghi đáp án: docYDsTheoQid bỏ ý của câu nghi (trừ khi boNghi: false).
    const { d, env } = dung([Q2], ['Q2'])
    await nhapKhoY(d, env, 8)
    await damBaoBangTuHoanThien(env)
    expect((await docYDsTheoQid(env, ['Q2'])).get('Q2')).toHaveLength(8)
    d.sql.exec("INSERT INTO cau_nghi_dap_an(qid,so_lan,so_sai,ty_le_sai,trang_thai,luc) VALUES('Q2',9,9,1,'nghi','x')")
    expect((await docYDsTheoQid(env, ['Q2'])).size).toBe(0)
    expect((await docYDsTheoQid(env, ['Q2'], { boNghi: false })).get('Q2')).toHaveLength(8)
  })

  it('OMNI BẬT: nộp ~yd ⇒ có omni trong kết quả nhưng sổ KHÔNG ghi từng ý (ý mới không khớp ma trận Q của ý gốc); câu Phần II thường vẫn ghi từng ý', async () => {
    const { d, env } = dung([Q2, A2, ...KHAC_KHOI], ['Q2'])
    d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('omni','{"bat":true,"lop":[],"sbd":[]}','x')`)
    xoaDemCauHinh(env)
    await nhapKhoY(d, env, 8)
    ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const r = await dao(env)
    expect((r.questions as { qid: string }[]).map((q) => q.qid)).toContain('Q2~yd0') // OMNI bật có thể thêm câu ôn khác vào chuyến
    const t = await em(env, '/game-v2/answer', { session: r.id, qid: 'Q2~yd0', answer: mauNhom(0), msLam: 60_000, tuTin: 'chac' })
    expect(t.ok, JSON.stringify(t).slice(0, 300)).toBe(true)
    expect('omni' in t).toBe(true)
    const so = soCua(d, 'Q2~yd0')
    expect(so[0]!.subitem_json).toBeNull()
    expect(JSON.parse(so[0]!.raw_json!)).toMatchObject({ chon: mauNhom(0), tc: 'Q2' })
  })
})
function gocCuaTho(c: CauThu): PrivateQuestion { return cauJson(c) as unknown as PrivateQuestion }

describe('qid ảo `~bt` / `~yd`: một nơi đọc quy về câu gốc (như song sinh) ở MỌI nơi dùng tachSongSinh', () => {
  it('tachSongSinh / loaiQidAo / tiepBanKhacMoi', () => {
    expect(tachSongSinh('DH-11-B1-III-5~bt3')).toEqual({ goc: 'DH-11-B1-III-5', songSinh: 3 })
    expect(tachSongSinh('Q2~yd0#2')).toEqual({ goc: 'Q2', songSinh: 0 })
    expect(tachSongSinh('Q2~ss1')).toEqual({ goc: 'Q2', songSinh: 1 })
    expect(tachSongSinh('Q2')).toEqual({ goc: 'Q2', songSinh: null })
    expect(tachSongSinh('Q2~3')).toEqual({ goc: 'Q2~3', songSinh: null }) // bản Tu luyện `~n` không phải qid ảo của thang
    expect(loaiQidAo('Q2~bt12')).toEqual({ goc: 'Q2', loai: 'bt', k: 12 })
    expect(loaiQidAo('Q2~yd0')).toEqual({ goc: 'Q2', loai: 'yd', k: 0 })
    expect(loaiQidAo('Q2~ss2')).toEqual({ goc: 'Q2', loai: 'ss', k: 2 })
    expect(loaiQidAo('Q2')).toBeNull()
    expect(tiepBanKhacMoi([])).toEqual({ bt: 0, yd: 0 })
    expect(tiepBanKhacMoi([{ cauAnhEm: 'Q~bt0' }, { cauAnhEm: 'Q~bt3' }, { cauAnhEm: 'Q~yd1' }, { cauAnhEm: 'S' }, {}])).toEqual({ bt: 4, yd: 2 })
    expect(nhomYDs([], 0)).toBeNull()
  })
  it('phuQidAoMoi: ~bt tất định theo qid ảo; không rõ khối câu gốc / Phần II không có ý ⇒ null', async () => {
    const env = taoD1That().env as unknown as Env
    const g = gocCuaTho(Q3)
    const a = await phuQidAoMoi(env, g, 'Q3~bt1'), b = await phuQidAoMoi(env, g, 'Q3~bt1'), c = await phuQidAoMoi(env, g, 'Q3~bt2')
    expect(a).toEqual(b)
    expect(a!.text).not.toBe(c!.text)
    expect(await phuQidAoMoi(env, g, 'Q3')).toBeNull()
    expect(await phuQidAoMoi(env, g, 'Q3~ss0')).toBeNull() // song sinh do phuSongSinhTheoQid lo
    expect(await phuQidAoMoi(env, { ...g, lop: '12' } as PrivateQuestion, 'Q3~bt1')).toBeNull() // khối câu mâu thuẫn (mã tờ 11, cột lớp 12) ⇒ không rõ
    expect(await phuQidAoMoi(env, gocCuaTho(Q2), 'Q2~yd0')).toBeNull() // kho ý không có
  })
})

// ───────────────────────── A3 · CÂU ANH EM từ kho TU LUYỆN ─────────────────────────
const Q1: CauThu = { qid: 'Q1', maDe: TO11, phan: 'I', dang: 'D1', mucDo: 'TH', correct: 'B' }
const TL_A: CauThu = { qid: 'TLA', maDe: TL11, phan: 'I', dang: 'D1', mucDo: 'TH', correct: 'C' }
const TL_KHAC_KHOI: CauThu[] = [
  { qid: 'TL10', maDe: TL10, phan: 'I', dang: 'D1', mucDo: 'TH', correct: 'A' }, // tờ khối 10
  { qid: 'TLMT', maDe: TL11X, phan: 'I', dang: 'D1', mucDo: 'TH', correct: 'A' }, // mã khối 11, cột lớp 10 (mâu thuẫn)
]

describe('A3 · câu anh em: DẠY HỌC thiếu ⇒ kho TU LUYỆN cùng dạng, cùng mức, ĐÚNG KHỐI, em chưa gặp', () => {
  const NGOAI = [TL11, TL10, TL11X] // kho luyện tập không nằm trong phạm vi đã dạy
  async function moDoan(env: Env) {
    const mo = await em(env, '/game-v2/doan-mo', {})
    expect(mo.ok, JSON.stringify(mo).slice(0, 400)).toBe(true)
    const ma = String(mo.doan.ma)
    vi.setSystemTime(Date.now() + DEM_NGUOC_MS + 500)
    const xem = await em(env, '/game-v2/doan-xem', { ma })
    expect(xem.ok, JSON.stringify(xem).slice(0, 400)).toBe(true)
    return { ma, xem, cau: xem.doan.cau as { qid: string; de: { qid: string; choices: string[] } } }
  }
  it('Đoàn: không còn câu anh em DẠY HỌC ⇒ câu TU LUYỆN khối 11 chưa gặp (TLA), không lộ đáp án; sổ ghi dưới TLA + tc = Q1; không bao giờ lấy câu tờ khối 10 / tờ mâu thuẫn khối', async () => {
    const { d, env } = dung([Q1, TL_A, ...TL_KHAC_KHOI], ['Q1'], { ngoaiPhamVi: NGOAI })
    ghi(d, 'Q1', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    expect((await dao(env)).lyDo).toBe('khoa_cho_doan')
    const { ma, xem, cau } = await moDoan(env)
    expect(cau.qid).toBe('TLA')
    expect(cau.de.choices).toEqual(['A', 'B', 'C', 'D'].map((k) => PA('TLA', k)))
    khongLoDapAn(xem)
    expect(JSON.stringify(xem)).not.toContain('Q1')
    const nop = await em(env, '/game-v2/doan-nop', { ma, hiep: xem.doan.tran.hiep, answer: 'C', hanhDong: 'danh' })
    expect(nop.ketQuaCau.correct).toBe(true)
    expect(soCua(d, 'TLA').map((x) => ({ kq: x.ket_qua, tc: JSON.parse(x.raw_json ?? '{}').tc }))).toEqual([{ kq: 1, tc: 'Q1' }])
    expect((await docHoSo2(env, 'S1', '2026-10-06')).loiV2?.get('Q1')).toMatchObject({ trangThai: 'cho_kiem', daDungSongSinh: true })
  })

  it('LUẬT KHỐI: chỉ còn ứng viên TU LUYỆN khối 10 / tờ mâu thuẫn ⇒ KHÔNG lấy (rơi xuống bản xáo của chính Q1); thêm TLA khối 11 ⇒ chính nó thành câu anh em', async () => {
    const { d, env } = dung([Q1, ...TL_KHAC_KHOI], ['Q1'], { ngoaiPhamVi: NGOAI })
    ghi(d, 'Q1', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const { xem, cau } = await moDoan(env)
    expect(cau.qid).toBe('Q1') // bản xáo (bậc 3)
    for (const sai of ['TL10', 'TLMT']) expect(JSON.stringify(xem)).not.toContain(sai)
    // Đối chứng: thêm TLA (tờ khối 11 đúng) vào kho ⇒ có ứng viên.
    d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,0,?)').run(TL11, 'Tờ TL', '11', 1, 'v1')
    d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(TL11)
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(TL11, 'TLA', 'v1', 'g-TLA', 'D1', JSON.stringify(cauJson(TL_A)))
    d.sql.exec('DELETE FROM game_v2_session; DELETE FROM doan_chang; DELETE FROM doan_luot')
    vi.setSystemTime(luc('2026-10-07'))
    const sau = await moDoan(env)
    expect(sau.cau.qid).toBe('TLA')
  })

  it('DẠY HỌC còn câu anh em ⇒ ưu tiên DẠY HỌC (TU LUYỆN chỉ khi thiếu); TU LUYỆN em ĐÃ gặp ⇒ không lấy', async () => {
    const DH: CauThu = { qid: 'DH1', maDe: TO11, phan: 'I', dang: 'D1', mucDo: 'TH', correct: 'C' }
    const a = dung([Q1, DH, TL_A], ['Q1'], { ngoaiPhamVi: NGOAI })
    ghi(a.d, 'Q1', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    expect((await moDoan(a.env)).cau.qid).toBe('DH1')
    const b = dung([Q1, TL_A], ['Q1'], { ngoaiPhamVi: NGOAI })
    ghi(b.d, 'Q1', 0, luc('2026-10-05', '10:00'))
    ghi(b.d, 'TLA', 1, luc('2026-10-04', '10:00')) // đã gặp 2 ngày trước
    vi.setSystemTime(luc('2026-10-06'))
    expect((await moDoan(b.env)).cau.qid).toBe('Q1') // TU LUYỆN đã gặp ⇒ không phải "chưa gặp" ⇒ rơi xuống bản xáo
  })

  it('câu TU LUYỆN đang NGHI sai đáp án không thành câu anh em (chọn câu kế)', async () => {
    const TL_B: CauThu = { qid: 'TLB', maDe: TL11, phan: 'I', dang: 'D1', mucDo: 'TH', correct: 'D' }
    const { d, env } = dung([Q1, TL_A, TL_B], ['Q1'], { ngoaiPhamVi: NGOAI })
    await damBaoBangTuHoanThien(env)
    d.sql.exec("INSERT INTO cau_nghi_dap_an(qid,so_lan,so_sai,ty_le_sai,trang_thai,luc) VALUES('TLA',9,9,1,'nghi','x'),('TLB',9,9,1,'nghi','x')")
    ghi(d, 'Q1', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    expect((await moDoan(env)).cau.qid).toBe('Q1') // cả hai ứng viên đều nghi ⇒ bản xáo
    d.sql.exec("UPDATE cau_nghi_dap_an SET trang_thai = 'dung_dap_an' WHERE qid = 'TLA'")
    xoaDemCauNghi()
    d.sql.exec('DELETE FROM game_v2_session; DELETE FROM doan_chang; DELETE FROM doan_luot')
    vi.setSystemTime(luc('2026-10-07'))
    expect((await moDoan(env)).cau.qid).toBe('TLA')
  })
})

// ───────────────────────── A4 · câu NGHI sai đáp án ở cổng cuối của em ─────────────────────────
describe('A4 · cổng cuối của em loại câu NGHI sai đáp án (lý do `nghi_dap_an`); cổng lớp / thầy tự chọn giữ nguyên', () => {
  const ds = ['DH-11-B1-I-1', 'DH-11-B1-I-2', 'DH-11-B1-I-3~ss0', 'DH-11-B1-I-4~bt1']
  function dem(env: Env, mau: RegExp) {
    let n = 0
    const db = env.DB as unknown as { prepare: (q: string) => unknown }
    const p = new Proxy(db, { get(t, k) { if (k === 'prepare') return (q: string) => { if (mau.test(q)) n++; return t.prepare(q) }; return (t as never)[k as never] } })
    return { env: { ...env, DB: p } as Env, so: () => n }
  }
  const nghi = (d: D1That, ...qid: string[]) => { for (const q of qid) d.sql.prepare("INSERT OR REPLACE INTO cau_nghi_dap_an(qid,so_lan,so_sai,ty_le_sai,trang_thai,luc) VALUES(?,9,9,1,'nghi','x')").run(q) }

  it('bảng chưa có ⇒ không lỗi, không loại câu nào; có bảng ⇒ loại câu nghi (cả qid ảo của câu nghi), đếm nghi_dap_an, ghi console', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    expect(await chanKhacKhoiEm(env, 'k_thu', { khoiEm: 11 }, ds)).toEqual(ds)
    expect(demChanKhoi()['em:k_thu']).toMatchObject({ giu: 4, nghi_dap_an: 0 })
    await damBaoBangTuHoanThien(env)
    nghi(d, 'DH-11-B1-I-2', 'DH-11-B1-I-3', 'DH-11-B1-I-4')
    xoaDemCauNghi(); xoaDemChanKhoi()
    expect(await chanKhacKhoiEm(env, 'k_thu', { khoiEm: 11 }, ds)).toEqual(['DH-11-B1-I-1'])
    expect(demChanKhoi()['em:k_thu']).toMatchObject({ giu: 1, nghi_dap_an: 3, khac_khoi: 0 })
    expect(log.mock.calls.some((c) => c[0] === '[chan-khac-khoi]' && JSON.parse(String(c[1])).nghi_dap_an === 3)).toBe(true)
    log.mockRestore()
  })

  it('MỌI kênh của em đi qua cùng cổng: Đảo · Đoàn · Tu luyện · Bi-a · ôn lại · khắc phục · lượt cũ ⇒ câu nghi bị loại ở từng kênh; rút đề ca thi (dsCauNghi) vẫn đọc đúng danh sách', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    await damBaoBangTuHoanThien(env)
    nghi(d, 'DH-11-B1-I-2')
    for (const kenh of ['dao2', 'doan2', 'tu_luyen', 'tu_luyen_kho_sai', 'bia', 'on_lai', 'khac_phuc', 'game_cu', 'ph_giao_them']) {
      const ra = await chanKhacKhoiEm(env, kenh, { khoiEm: 11 }, [{ qid: 'DH-11-B1-I-1', maDe: TO11 }, { qid: 'DH-11-B1-I-2', maDe: TO11 }], { cauCua: (x) => x })
      expect(ra.map((x) => x.qid), kenh).toEqual(['DH-11-B1-I-1'])
      expect(demChanKhoi()[`em:${kenh}`], kenh).toMatchObject({ giu: 1, nghi_dap_an: 1 })
    }
    // Lượt ĐÃ phát (resume): câu đã qua cổng lúc phát — không lọc nghi (và không tốn truy vấn mỗi lần mở app).
    const resume = await chanKhacKhoiEm(env, 'luot_cu', { khoiEm: 11 }, [{ qid: 'DH-11-B1-I-1', maDe: TO11 }, { qid: 'DH-11-B1-I-2', maDe: TO11 }], { cauCua: (x) => x })
    expect(resume.map((x) => x.qid)).toEqual(['DH-11-B1-I-1', 'DH-11-B1-I-2'])
    expect(await dsCauNghi(env)).toEqual({ ok: true, qid: ['DH-11-B1-I-2'] }) // ca thi: cổng riêng của rút đề, không đổi
  })

  it('lý do khối đứng TRƯỚC (câu khác khối ⇒ khac_khoi, không đếm nghi); câu thầy giao khi em chưa rõ khối vẫn bị loại nếu nghi', () => {
    const nghiSet = new Set(['DH-12-B1-I-1', 'DH-11-B1-I-2'])
    expect(congKhoi('em', 'x_1', 11, ['DH-12-B1-I-1', 'DH-11-B1-I-2', 'DH-11-B1-I-3'], {}, undefined, nghiSet)).toEqual(['DH-11-B1-I-3'])
    expect(demChanKhoi()['em:x_1']).toMatchObject({ khac_khoi: 1, nghi_dap_an: 1, giu: 1 })
    expect(congKhoi('em', 'x_2', [], ['DH-11-B1-I-2', 'DH-11-B1-I-3'], { thayGiao: () => true }, undefined, nghiSet)).toEqual(['DH-11-B1-I-3'])
    expect(demChanKhoi()['em:x_2']).toMatchObject({ qua_thay_giao: 1, nghi_dap_an: 1 })
    // Không truyền `nghi` (cổng lớp / nơi thầy tự chọn) ⇒ y hệt cũ.
    expect(congKhoi('lop', 'x_3', 11, ['DH-11-B1-I-2', 'DH-11-B1-I-3'])).toEqual(['DH-11-B1-I-2', 'DH-11-B1-I-3'])
  })

  it('cổng LỚP (danh sách của thầy) và chanKhacKhoiLop KHÔNG lọc câu nghi; TheoEm / Dong (luật A nhiều em) có lọc', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    await damBaoBangTuHoanThien(env)
    nghi(d, 'DH-11-B1-I-2')
    expect(await chanKhacKhoiLop(env, 'ds_lop', { lop: '11A1' }, ['DH-11-B1-I-1', 'DH-11-B1-I-2'])).toEqual(['DH-11-B1-I-1', 'DH-11-B1-I-2'])
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','An','11A1','m','x')")
    const theoEm = await chanKhacKhoiTheoEm(env, 'theo_em', new Map([['S1', ['DH-11-B1-I-1', 'DH-11-B1-I-2']]]))
    expect(theoEm.get('S1')).toEqual(['DH-11-B1-I-1'])
    const dong = await chanKhacKhoiDong(env, 'dong', new Map([['S1', 11 as const]]), [{ sbd: 'S1', qid: 'DH-11-B1-I-1' }, { sbd: 'S1', qid: 'DH-11-B1-I-2' }])
    expect(dong.map((x) => x.qid)).toEqual(['DH-11-B1-I-1'])
    expect(demChanKhoi()['lop:ds_lop']?.nghi_dap_an ?? 0).toBe(0)
  })

  it('đệm 60 giây: nhiều lượt cổng chỉ MỘT truy vấn; hết 60 giây (hoặc xoá đệm) ⇒ đọc lại; thầy chốt câu nghi ⇒ em thấy lại câu', async () => {
    const d = taoD1That()
    await damBaoBangTuHoanThien(d.env as unknown as Env)
    nghi(d, 'DH-11-B1-I-2')
    const { env, so } = dem(d.env as unknown as Env, /cau_nghi_dap_an/)
    vi.setSystemTime(luc('2026-10-06'))
    for (let i = 0; i < 3; i++) expect(await chanKhacKhoiEm(env, 'dem', { khoiEm: 11 }, ds)).toEqual(['DH-11-B1-I-1', 'DH-11-B1-I-3~ss0', 'DH-11-B1-I-4~bt1'])
    expect(so()).toBe(1)
    d.sql.exec("UPDATE cau_nghi_dap_an SET trang_thai = 'dung_dap_an'")
    expect(await chanKhacKhoiEm(env, 'dem', { khoiEm: 11 }, ds)).toHaveLength(3) // vẫn trong 60 giây
    vi.setSystemTime(luc('2026-10-06', '08:01') + 1000)
    expect(await chanKhacKhoiEm(env, 'dem', { khoiEm: 11 }, ds)).toEqual(ds)
    expect(so()).toBe(2)
    expect((await docCauNghiDem(env, Date.now())).size).toBe(0)
    xoaDemCauNghi()
    await docCauNghiDem(env, Date.now())
    expect(so()).toBe(3)
    // em chưa rõ khối ⇒ cổng chặn hết như cũ và KHÔNG tốn truy vấn câu nghi
    xoaDemCauNghi()
    const truoc = so()
    expect(await chanKhacKhoiEm(env, 'dem', { khoiEm: null }, ds)).toEqual([])
    expect(so()).toBe(truoc)
  })

  it('KẾ HOẠCH: câu nghi là câu TẠM HOÃN (như câu ca bảo vệ) — không đếm "còn N câu", rương mở được khi xong các câu còn lại; mọi câu đều nghi ⇒ "Hôm nay em xong rồi" (không báo "chưa tải được câu", không log lỗi tải)', async () => {
    const Q8: CauThu = { qid: 'Q8', maDe: TO11, phan: 'II', dang: 'D8', mucDo: 'TH', correct: 'DDSS' }
    const loi = vi.spyOn(console, 'error').mockImplementation(() => {})
    // (1) Kế hoạch = Q2 (câu sai ⇒ câu anh em A2) + Q8 (câu mới). Q8 nghi: kế hoạch còn 1 việc; làm xong A2 ⇒ hết việc và rương MỞ. Đối chứng không nghi: 2 việc, rương chưa mở.
    for (const coNghi of [false, true]) {
      const { d, env } = dung([Q2, A2, Q8], ['Q2', 'Q8'])
      if (coNghi) { await damBaoBangTuHoanThien(env); nghi(d, 'Q8') }
      ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
      vi.setSystemTime(luc('2026-10-06'))
      const r = await dao(env)
      expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
      expect(r.theLuc, coNghi ? 'có nghi' : 'không nghi').toEqual(coNghi ? { con: 1, tong: 1 } : { con: 2, tong: 2 })
      expect((r.questions as { qid: string }[]).map((q) => q.qid).sort()).toEqual(coNghi ? ['A2'] : ['A2', 'Q8'])
      const t = await em(env, '/game-v2/answer', { session: r.id, qid: 'A2', answer: 'SDDS' })
      expect(t.correct).toBe(true)
      if (!coNghi) { expect((await em(env, '/game-v2/hoa2-ruong-mo', {})).ok).toBe(false); continue }
      const sau = await dao(env)
      expect(sau.lyDo).toBe('xong_ke_hoach')
      expect(String(sau.message)).toContain('Hôm nay em xong rồi')
      expect(sau.theLuc).toEqual({ con: 0, tong: 1 })
      const ruong = await em(env, '/game-v2/hoa2-ruong-mo', {})
      expect(ruong.ok, JSON.stringify(ruong).slice(0, 300)).toBe(true)
    }
    // (2) Mọi câu của kế hoạch đều nghi.
    {
      const { d, env } = dung([Q8], ['Q8'])
      await damBaoBangTuHoanThien(env); nghi(d, 'Q8')
      vi.setSystemTime(luc('2026-10-06'))
      const r = await dao(env)
      expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
      expect(r.questions).toEqual([])
      expect(r.lyDo).toBe('xong_ke_hoach')
      expect(String(r.message)).toContain('Hôm nay em xong rồi')
      expect(String(r.message)).not.toContain('Chưa tải được')
      expect(r.theLuc).toEqual({ con: 0, tong: 0 })
    }
    expect(loi.mock.calls.filter((c) => String(c[0]).includes('nap-cau-game'))).toEqual([])
    loi.mockRestore()
  })

  it('Đảo: câu của kế hoạch đang nghi bị loại khỏi chuyến (câu kia vẫn ra); không nghi ⇒ cả hai; câu anh em đang nghi không được chọn', async () => {
    const Q8: CauThu = { qid: 'Q8', maDe: TO11, phan: 'II', dang: 'D8', mucDo: 'TH', correct: 'DDSS' }
    const A2V: CauThu = { qid: 'A2V', maDe: TO11, phan: 'II', dang: 'D2', mucDo: 'VD', correct: 'DDSS' }
    for (const coNghi of [false, true]) {
      const { d, env } = dung([Q2, A2, A2V, Q8], ['Q2', 'Q8'])
      if (coNghi) { await damBaoBangTuHoanThien(env); nghi(d, 'Q8', 'A2') }
      ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
      vi.setSystemTime(luc('2026-10-06'))
      const r = await dao(env)
      expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
      const qids = (r.questions as { qid: string }[]).map((q) => q.qid).sort()
      expect(qids, coNghi ? 'có nghi' : 'không nghi').toEqual(coNghi ? ['A2V'] : ['A2', 'Q8'])
    }
  })
})

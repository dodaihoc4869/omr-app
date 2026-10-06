// @vitest-environment node
// (1) CHẨN ĐOÁN BƯỚC SAI TRƯỚC KHI LÀM LẠI (06/10, lệnh thầy "Làm chuẩn đoán bước sai") — D1 THẬT (node:sqlite, đủ migration), OMNI BẬT như bản sống,
// mọi lệnh của em đi qua đúng đường Worker thật (`server/src/index.ts`). Thiết kế: server/src/chan-doan-buoc-sai.ts + docs/chan-doan-buoc-sai-0610.md.
// Lượt làm lại ĐẦU TIÊN của câu lỗi Q (lỗi mở, chưa chẩn đoán) trong chuyến Đảo / chặng Đoàn ⇒ THAY bằng MỘT câu chẩn đoán (câu nền của bước yếu nhất — bước em
// tự khai trước; hoặc chìa khoá + 2 ý Đ/S cho câu lý thuyết khi kho ý có), KHÔNG thêm câu; lượt làm lại dời sang lần phát kế. Ghi sổ purpose 'chan_doan'
// (quan sát OMNI, không tính luật đóng lỗi); sai ⇒ một dòng omni_buoc_sai. Công tắc `chan_doan_buoc_sai` {"bat":false} ⇒ y hệt hôm nay.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { xoaDemPhamVi } from '../server/src/bai-da-day'
import { docHoSo2, docKeHoachDaChot, docLanLam, xoaDemChienDich } from '../server/src/srs2-d1'
import { hoSoOmniEm, xoaDemOmni } from '../server/src/omni-d1'
import { chanMetaKhacKhoi, xoaDemCauNghi, xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { DEM_NGUOC_MS } from '../server/src/game-v2-doan'
import { LENH_TAO_BANG_CAN_THAN } from '../server/src/omni-can-than'
import { damBaoBangYDs } from '../server/src/cau-y-ds'
import { damBaoBangLoiGiai } from '../server/src/loi-giai'
import { CHAN_DOAN_TOI_DA_LUOT, canChanDoan, cauTuCauNen, cauTuHaiY, chamCauChanDoan, chonChanDoanTrongLuot, giaiCauChanDoan, nhomYTuDong, taoCauChanDoan, vknCauChanDoan, type DuLieuChanDoan } from '../server/src/chan-doan-buoc-sai'
import { laQidChanDoan, nhanQidChanDoan } from '../server/src/lam-lai-so'
import { sinhCauNen, soCauKhongGian } from '../server/src/omni-cau-nen-sinh'
import { SQL_LA_LAN_LAM } from '../server/src/omni-kieu'
import { laCauTuLuan } from '../src/lib/cau-tu-luan'
import type { PrivateQuestion } from '../src/game/than-thu-v2/core'
import type { Env } from '../server/src/kieu'

type Phan = 'I' | 'II' | 'III'
interface CauThu { qid: string; maDe: string; phan: Phan; dang: string; mucDo: string; correct: string; text?: string; solution?: unknown; ideas?: string[] }
const TO11 = 'DH-11-B1'
const PA = (qid: string, k: string) => `${qid} — giá trị ${'ABCD'.indexOf(k) + 1}`
const cauJson = (c: CauThu) => ({
  qid: c.qid, maDe: c.maDe, version: 'v1', group: `g-${c.qid}`, phan: c.phan, text: c.text ?? `Đề câu ${c.qid}`,
  choices: c.phan === 'I' ? ['A', 'B', 'C', 'D'].map((k) => PA(c.qid, k)) : [], ideas: c.phan === 'II' ? (c.ideas ?? [0, 1, 2, 3].map((i) => `${c.qid} ý ${i + 1}`)) : [],
  hinhAnh: [], dang: c.dang, tenDang: `Dạng ${c.dang}`, mucDo: c.mucDo, sao: 1, kienThuc: ['K1'], correct: c.correct, reviewed: true,
  solution: c.solution ?? { chot: 'Bảo toàn khối lượng cho cả quá trình.' },
})
const ngayVnCua = (ms: number) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
const luc = (ngay: string, gio = '08:00') => Date.parse(`${ngay}T${gio}:00+07:00`)

// Q1: câu TÍNH TOÁN (Phần I) gắn hai bước nền có bộ sinh câu nền. QL: câu LÝ THUYẾT Phần I (dạng DL, không bước nền). Dạng D1/DL không có bộ sinh biến thể, không câu anh em
// ⇒ thang làm lại hôm nay của Q1 là BẢN XÁO (`xt`).
const Q1: CauThu = { qid: 'Q1', maDe: TO11, phan: 'I', dang: 'D1', mucDo: 'TH', correct: 'B' }
const QL: CauThu = { qid: 'QL', maDe: TO11, phan: 'I', dang: 'DL', mucDo: 'TH', correct: 'C' }
const NHAN_A = 'doi_mol_khoi_luong', NHAN_B = 'hieu_suat'

interface TuyChon { omni?: boolean; tat?: boolean; vkn?: Record<string, string[]>; nhipDao?: boolean }
function dung(kho: CauThu[], cd: string[], t: TuyChon = {}): { d: D1That; env: Env } {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','11A1','mk1','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["11A1"]}','x'),('doan_ho_tong','{"toanBo":true}','x')`)
  if (t.omni !== false) d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('omni','{"bat":true,"lop":[],"sbd":[]}','x')`)
  if (t.tat) d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('chan_doan_buoc_sai','{"bat":false}','x')`)
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  for (const m of [...new Set(kho.map((c) => c.maDe))]) {
    d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,0,?)').run(m, `Tờ ${m}`, '11', kho.filter((c) => c.maDe === m).length, 'v1')
    d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(m)
  }
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const c of kho) st.run(c.maDe, c.qid, 'v1', `g-${c.qid}`, c.dang, JSON.stringify(cauJson(c)))
  const vkn = t.vkn ?? { Q1: ['dang:D1', `nen:${NHAN_A}`, `nen:${NHAN_B}`] }
  for (const [q, ds] of Object.entries(vkn)) d.sql.prepare("INSERT INTO omni_q(qid,y,vkn_json,nguon) VALUES(?,-1,?,'thay')").run(q, JSON.stringify(ds))
  d.sql.prepare("INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('T1','11A1','B1','Bài 1',1,?,'2026-10-01T00:00:00.000Z')").run(JSON.stringify([...new Set(kho.map((c) => c.maDe))]))
  d.sql.prepare("INSERT INTO chien_dich(id,ten,lop,sbd_json,ma_de_json,qid_json,han_nop,tao_luc) VALUES('CD1','Ôn chương 1','11A1','[\"S1\"]',?,?,'2026-10-30','2026-10-01T00:00:00.000Z')")
    .run(JSON.stringify([TO11]), JSON.stringify(cd))
  for (const s of LENH_TAO_BANG_CAN_THAN) d.sql.exec(s)
  // Nhịp kênh: 7 ngày qua em chỉ mở Đảo ⇒ câu ôn Phần I/III vào Đảo (như tests/lam-lai-cau-sai-0610-bac-moi.test.ts).
  if (t.nhipDao !== false) d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('CU1', 'S1', JSON.stringify({ mode: 'adventure', created: luc('2026-10-04'), hoa2: 1, questions: [] }), new Date(luc('2026-10-04')).toISOString())
  return { d, env }
}
function ghi(d: D1That, qid: string, kq: 0 | 1, ms: number, nguon = 'luyen') {
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance) VALUES(?,?,?,?,?,1,?,?,?,?)')
    .run(`${nguon}|S1|${qid}|${ms}`, 'S1', qid, nguon, `M-${ms}`, kq, new Date(ms).toISOString(), ngayVnCua(ms), 'none')
}
const em = async (env: Env, duong: string, b: Record<string, unknown> = {}) => goiWorker(worker, env, duong, { token: await gameToken(env, 'S1'), ...b })
const dao = (env: Env) => em(env, '/game-v2/start', { mode: 'adventure' })
const phien = (d: D1That, id: string) => JSON.parse((d.sql.prepare('SELECT json FROM game_v2_session WHERE id = ?').get(id) as { json: string }).json) as { questions: Record<string, unknown>[] }
const soCua = (d: D1That, qid: string) => d.sql.prepare("SELECT qid, ket_qua, purpose, raw_json, ma_dang FROM su_kien_hoc WHERE sbd = 'S1' AND qid = ? ORDER BY luc").all(qid) as { qid: string; ket_qua: number | null; purpose: string | null; raw_json: string | null; ma_dang: string | null }[]
const buocSai = (d: D1That) => d.sql.prepare("SELECT qid, ma_vkn FROM omni_buoc_sai WHERE sbd = 'S1' ORDER BY luc").all() as { qid: string; ma_vkn: string }[]
function khongLoDapAn(r: unknown) {
  const s = JSON.stringify(r)
  for (const k of ['"correct"', '"solution"', '"answer"', '"dapAn"', '"tc"', '"xt"', '"nv"', '"cd"', '"traLoiGoc"', '"chan_doan"', '"gtd"']) expect(s, `phản hồi lộ ${k}`).not.toContain(k)
}
/** Đáp án đúng của câu chẩn đoán (giải mã như máy chủ — chỉ test biết). */
async function dapAnCua(env: Env, ref: Record<string, unknown>): Promise<PrivateQuestion> {
  const q = await giaiCauChanDoan(env, { qid: String(ref.qid), maDe: String(ref.maDe), version: String(ref.version) })
  expect(q, `giải mã được ${String(ref.qid)}`).not.toBeNull()
  return q!
}

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); xoaDemCaBaoVe(); xoaDemChienDich(); xoaDemPhamVi(); xoaDemCauNghi(); xoaDemChanKhoi(); xoaDemOmni() })
afterEach(() => vi.useRealTimers())

// ───────────────────────── thuần ─────────────────────────
describe('(1) câu chẩn đoán — phần thuần', () => {
  it('qid chẩn đoán: nen:sinh.<nhãn>.<số> / nen:yds.<băm16>.<stt>.<stt>; qid thường, song sinh, câu nền của Trạm (nen:<id> thầy nạp) không phải', () => {
    expect(laQidChanDoan('nen:sinh.doi_mol_khoi_luong.3')).toBe(true)
    expect(laQidChanDoan('nen:yds.0123456789abcdef.2.7')).toBe(true)
    for (const q of ['Q1', 'Q1~ss0', 'Q1~bt2', 'nen:n1', 'nen:sinh.Doi.3', 'nen:yds.xyz.1.2', 'nen:sinh.doi_mol_khoi_luong', '', null, 7]) expect(laQidChanDoan(q)).toBe(false)
    expect(nhanQidChanDoan('nen:sinh.hieu_suat.12')).toBe('hieu_suat')
    expect(nhanQidChanDoan('nen:yds.0123456789abcdef.2.7')).toBeNull()
  })
  it('câu nền ⇒ câu game: tn ⇒ Phần I (4 phương án), so ⇒ Phần III; không tự luận; version = băm nội dung; chấm Phần III lệch ≤ 0,5 %', () => {
    let coTn = false, coSo = false
    for (const nhan of [NHAN_A, NHAN_B, 'cong_thuc_phan_tu', 'bao_toan_electron']) for (let so = 1; so <= Math.min(12, soCauKhongGian(nhan)); so++) {
      const c = sinhCauNen(nhan, so)!
      const q = cauTuCauNen(c, TO11)!
      expect(q, `${nhan}.${so}`).not.toBeNull()
      expect(q.qid).toBe(`nen:sinh.${nhan}.${so}`)
      expect(laCauTuLuan(q)).toBe(false)
      expect(q.version).toMatch(/^cd-[0-9a-f]{16}$/)
      expect(cauTuCauNen(sinhCauNen(nhan, so)!, 'X')!.version).toBe(q.version) // không phụ thuộc tờ
      if (c.kieu === 'tn') { coTn = true; expect(q.phan).toBe('I'); expect(q.choices).toHaveLength(4); expect(chamCauChanDoan(q, q.correct)).toBe(true) }
      else {
        coSo = true; expect(q.phan).toBe('III'); expect(q.choices).toEqual([])
        expect(chamCauChanDoan(q, q.correct)).toBe(true)
        const g = Number(String(c.gia_tri_dung).replace(',', '.'))
        if (g > 0) { expect(chamCauChanDoan(q, String(g * 1.003).replace('.', ','))).toBe(true); expect(chamCauChanDoan(q, String(g * 1.02).replace('.', ','))).toBe(false) }
      }
      expect(vknCauChanDoan(q)).toBe(`nen:${nhan}`)
    }
    expect(coTn && coSo).toBe(true)
  })
  const hs = (trangThai: string, them: Record<string, unknown> = {}) => ({
    loiV2: new Map([['Q1', { trangThai, saiCuoi: '2026-10-05' }], ['Q2', { trangThai: 'mo', saiCuoi: '2026-10-05' }], ['Q3', { trangThai: 'mo', saiCuoi: '2026-10-04' }]]) as never,
    meta: new Map(['Q1', 'Q2', 'Q3'].map((q) => [q, { qid: q, maDe: TO11, version: 'v1', group: `g-${q}`, phan: 'I', mucDo: 'TH', dang: 'D1', tenDang: 'D1', sao: 1, tuLuan: false }])) as never,
    ...them,
  })
  it('điều kiện: chỉ lỗi MỞ (lượt làm lại đầu tiên sau lần sai cuối), chưa chẩn đoán, có siêu dữ liệu, qid thật', () => {
    expect(canChanDoan(hs('mo'), 'Q1')).toBe(true)
    for (const t of ['cho_kiem', 'dong', 'duy_tri']) expect(canChanDoan(hs(t), 'Q1')).toBe(false)
    expect(canChanDoan(hs('mo', { chanDoanXong: new Set(['Q1']) }), 'Q1')).toBe(false)
    expect(canChanDoan(hs('mo'), 'Q1~ss0')).toBe(false)
    expect(canChanDoan(hs('mo'), 'Q9')).toBe(false)
  })
  const du = (them: Partial<DuLieuChanDoan> = {}): DuLieuChanDoan => ({
    q: new Map(['Q1', 'Q2', 'Q3'].map((q) => [q, { qid: q, phan: 'I', maDang: 'D1', mucDo: 'TH', vkn: ['dang:D1', `nen:${NHAN_A}`, `nen:${NHAN_B}`], nguon: 'thay' }])) as never,
    p: {}, khai: [], y: [], ...them,
  })
  const ds = (qids: string[]) => qids.map((q) => ({ q: cauJson({ qid: q, maDe: TO11, phan: 'I', dang: 'D1', mucDo: 'TH', correct: 'B' }) as unknown as PrivateQuestion, m: { qid: q, maDe: TO11, version: 'v1', group: `g-${q}`, phan: 'I' as const, mucDo: 'TH', dang: 'D1', tenDang: 'D1', sao: 1, tuLuan: false } }))
  it('bước yếu nhất: bước em TỰ KHAI trước, rồi P thấp nhất, hoà ⇒ mã; tất định theo (em, câu, ngày sai cuối)', () => {
    const muoi = 'S1|Q1|2026-10-05|chan_doan'
    expect(nhanQidChanDoan(taoCauChanDoan(du(), 'Q1', ds(['Q1'])[0]!.q, muoi, new Set())!.q.qid)).toBe(NHAN_A) // P bằng nhau ⇒ theo mã
    expect(nhanQidChanDoan(taoCauChanDoan(du({ p: { [`nen:${NHAN_A}`]: 0.8, [`nen:${NHAN_B}`]: 0.2 } }), 'Q1', ds(['Q1'])[0]!.q, muoi, new Set())!.q.qid)).toBe(NHAN_B)
    const khai = [{ qid: 'QX', ngay: '2026-10-05', maVkn: `nen:${NHAN_A}`, luc: '2026-10-05T01:00:00.000Z' }]
    expect(nhanQidChanDoan(taoCauChanDoan(du({ p: { [`nen:${NHAN_A}`]: 0.8, [`nen:${NHAN_B}`]: 0.2 }, khai }), 'Q1', ds(['Q1'])[0]!.q, muoi, new Set())!.q.qid)).toBe(NHAN_A)
    const a = taoCauChanDoan(du(), 'Q1', ds(['Q1'])[0]!.q, muoi, new Set())!, b = taoCauChanDoan(du(), 'Q1', ds(['Q1'])[0]!.q, muoi, new Set())!
    expect(a.q).toEqual(b.q)
    // không bước nền có bộ sinh, câu Phần III ⇒ không chẩn đoán
    expect(taoCauChanDoan(du({ q: new Map([['Q1', { qid: 'Q1', phan: 'III', maDang: 'D1', mucDo: 'TH', vkn: ['dang:D1', 'nen:tinh_chat_hoa_hoc'], nguon: 'thay' }]]) as never }), 'Q1', { ...ds(['Q1'])[0]!.q, phan: 'III' }, muoi, new Set())).toBeNull()
  })
  it('trần mỗi lượt, mỗi nhãn một câu, không chèn ải Trùm (câu cuối khi lượt đủ 6)', () => {
    const r = chonChanDoanTrongLuot(du(), ds(['Q1', 'Q2', 'Q3']), hs('mo'), 'S1')
    expect(r.size).toBe(CHAN_DOAN_TOI_DA_LUOT)
    expect(new Set([...r.values()].map((x) => nhanQidChanDoan(x.q.qid))).size).toBe(r.size) // mỗi nhãn một câu
    expect([...r.values()].every((x) => x.lamLai.cd === 1 && !!x.lamLai.tc && x.m.maDe === TO11)).toBe(true)
    const sau = ds(['A', 'B', 'C', 'D', 'E', 'Q1'])
    expect(chonChanDoanTrongLuot(du(), sau, hs('mo'), 'S1', 6).size).toBe(0) // Q1 là ải Trùm
    expect(chonChanDoanTrongLuot(du(), sau, hs('mo'), 'S1').get(5)?.lamLai.tc).toBe('Q1') // Đoàn: không Trùm
  })
  it('khối: câu chẩn đoán phải qua mọi cổng khối như câu lỗi — tờ không mang khối trong mã, em chưa rõ khối, khác khối ⇒ không chèn; đúng khối ⇒ chèn', async () => {
    // Tờ "100" (khối chỉ có ở cột de_kho.lop): ref {qid nen:…, maDe} lúc chấm không đọc ra khối ⇒ cổng `luot_cu` sẽ chặn ⇒ không chèn (thang làm lại như hôm nay).
    const h100 = hs('mo'); for (const [q, m] of h100.meta as unknown as Map<string, Record<string, unknown>>) (h100.meta as unknown as Map<string, unknown>).set(q, { ...m, maDe: '100' })
    expect(canChanDoan(h100, 'Q1')).toBe(false)
    expect(chonChanDoanTrongLuot(du(), ds(['Q1']).map((x) => ({ q: { ...x.q, maDe: '100' }, m: { ...x.m, maDe: '100' } })), h100, 'S1').size).toBe(0)
    // Hồ sơ ĐÃ lọc khối (docHoSo2 → chanMetaKhacKhoi ghi khối em cho `meta`): em chưa rõ khối / khối 12 với tờ khối 11 ⇒ không chèn; khối 11 ⇒ chèn.
    const daLoc = async (k: 11 | 12 | null) => {
      const h = hs('mo'), meta = new Map<string, unknown>()
      await chanMetaKhacKhoi({} as Env, 'test_chan_doan', k, meta) // meta rỗng ⇒ chỉ ghi khối em, không đọc D1
      for (const [q, m] of h.meta as unknown as Map<string, unknown>) meta.set(q, m)
      return { ...h, meta: meta as never }
    }
    for (const k of [null, 12] as const) {
      const h = await daLoc(k)
      expect(canChanDoan(h, 'Q1')).toBe(false)
      expect(chonChanDoanTrongLuot(du(), ds(['Q1', 'Q2']), h, 'S1').size).toBe(0)
    }
    const h11 = await daLoc(11)
    expect(chonChanDoanTrongLuot(du(), ds(['Q1']), h11, 'S1').get(0)?.lamLai).toEqual({ tc: 'Q1', cd: 1 })
    // Câu lỗi mang `lop` MÂU THUẪN với mã tờ (câu ấy tự bị cổng chặn) ⇒ không chèn câu chẩn đoán thay nó.
    expect(chonChanDoanTrongLuot(du(), ds(['Q1']).map((x) => ({ q: { ...x.q, lop: '12' } as unknown as PrivateQuestion, m: x.m })), h11, 'S1').size).toBe(0)
  })
  it('(b) lý thuyết: chìa khoá + 2 ý Đ/S CÙNG dạng, cùng khối, có chìa khoá, đề không hình; kho rỗng ⇒ không chèn', () => {
    const qL = cauJson(QL) as unknown as PrivateQuestion
    const duL = (y: DuLieuChanDoan['y']) => du({ q: new Map([['QL', { qid: 'QL', phan: 'I', maDang: 'DL', mucDo: 'TH', vkn: ['dang:DL'], nguon: 'thay' }]]) as never, y })
    expect(taoCauChanDoan(duL([]), 'QL', qL, 'm', new Set())).toBeNull()
    const dong = (stt: number, d: string, them: Record<string, unknown> = {}) => ({ bam: '0123456789abcdef', stt, noi_dung: `Phát biểu ${stt}`, gia_tri: d, ly_do: `Lí do ${stt}`, lop: '11', dang: 'DL', ten_dang: 'Dạng DL', de: 'Đề dẫn: chất X là este no, đơn chức.', sol: JSON.stringify({ chot: 'Este no đơn chức có công thức CnH2nO2.' }), ...them })
    const n = nhomYTuDong([dong(1, 'D'), dong(2, 'S'), dong(2, 'S'), dong(3, 'D')])
    expect(n).toHaveLength(1); expect(n[0]!.ys.map((y) => y.stt)).toEqual([1, 2, 3])
    const r = taoCauChanDoan(duL(n), 'QL', qL, 'S1|QL|x|chan_doan', new Set())!
    expect(r.q.qid).toMatch(/^nen:yds\.0123456789abcdef\.\d\.\d$/)
    expect(r.q.text).toContain('Chìa khoá: Este no đơn chức có công thức CnH2nO2.')
    expect(r.q.choices).toHaveLength(4)
    expect(laCauTuLuan(r.q)).toBe(false)
    expect(vknCauChanDoan(r.q)).toBe('dang:DL')
    // chỉ MỘT ý / khác dạng / khác khối / không chìa khoá / đề có hình ⇒ không chèn
    expect(taoCauChanDoan(duL(nhomYTuDong([dong(1, 'D')])), 'QL', qL, 'm', new Set())).toBeNull()
    expect(taoCauChanDoan(duL(nhomYTuDong([dong(1, 'D', { dang: 'DX' }), dong(2, 'S', { dang: 'DX' })])), 'QL', qL, 'm', new Set())).toBeNull()
    expect(taoCauChanDoan(duL(nhomYTuDong([dong(1, 'D', { lop: '12' }), dong(2, 'S', { lop: '12' })])), 'QL', qL, 'm', new Set())).toBeNull()
    expect(taoCauChanDoan(duL(nhomYTuDong([dong(1, 'D', { sol: '{}' }), dong(2, 'S', { sol: '{}' })])), 'QL', qL, 'm', new Set())).toBeNull()
    expect(taoCauChanDoan(duL(nhomYTuDong([dong(1, 'D', { tci: 'data:x' }), dong(2, 'S', { tci: 'data:x' })])), 'QL', qL, 'm', new Set())).toBeNull()
    // bốn tổ hợp ⇒ bốn chữ cái
    const y = (stt: number, d: 'D' | 'S') => ({ stt, t: `P${stt}`, d, lyDo: '' })
    const nn = n[0]!
    expect([cauTuHaiY(nn, y(1, 'D'), y(2, 'D'), TO11)!.correct, cauTuHaiY(nn, y(1, 'D'), y(2, 'S'), TO11)!.correct, cauTuHaiY(nn, y(1, 'S'), y(2, 'D'), TO11)!.correct, cauTuHaiY(nn, y(1, 'S'), y(2, 'S'), TO11)!.correct]).toEqual(['A', 'B', 'C', 'D'])
  })
  it('dòng sổ purpose chan_doan bị mọi bộ đọc "lần làm" bỏ (SQL_LA_LAN_LAM)', () => {
    expect(SQL_LA_LAN_LAM).toContain("'chan_doan'")
  })
})

// ───────────────────────── Đảo ─────────────────────────
describe('(1) Đảo: lượt làm lại đầu tiên của câu lỗi ⇒ câu chẩn đoán thay chỗ (không thêm câu)', () => {
  async function batDau(t: TuyChon = {}, kho: CauThu[] = [Q1], cd = ['Q1']) {
    const r = dung(kho, cd, t)
    if (t.tat) xoaDemCauHinh(r.env)
    ghi(r.d, 'Q1', 0, luc('2026-10-05', '10:00')) // Q1: lỗi MỞ (em sai hôm qua)
    vi.setSystemTime(luc('2026-10-06'))
    return r
  }
  it('chuyến ra câu nền của bước yếu nhất thay Q1 (đúng 1 câu như cũ), vai ôn lại, không lộ đáp án; phiên ghi tc = Q1, cd = 1; chuyến chờ / resume trả lại đúng câu', async () => {
    const { d, env } = await batDau()
    const r = await dao(env)
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect(r.questions).toHaveLength(1)
    const q = r.questions[0]
    expect(q.qid).toMatch(new RegExp(`^nen:sinh\\.${NHAN_A}\\.\\d+$`)) // P hai bước bằng nhau ⇒ theo mã
    expect(q).toMatchObject({ vai: 'on_lai', maDe: TO11 })
    expect(q.text).not.toBe('Đề câu Q1')
    khongLoDapAn(r)
    const ref = phien(d, r.id).questions[0]!
    expect(ref).toMatchObject({ qid: q.qid, tc: 'Q1', cd: 1, maDe: TO11, role: 'on_lai' })
    expect('xt' in ref || 'nv' in ref).toBe(false) // thang làm lại không chạy cho Q1 ở lượt này
    const lai = await dao(env)
    expect(lai.id).toBe(r.id); expect(lai.questions[0].text).toBe(q.text)
    const rs = await em(env, '/game-v2/resume', {})
    expect(rs.questions[0]).toMatchObject({ qid: q.qid, text: q.text })
    khongLoDapAn(rs)
  })
  it('nộp ĐÚNG: chấm theo câu nền; sổ purpose chan_doan + tc + cd; P bước ấy được quan sát; Q1 VẪN lỗi mở (không tính luật đóng lỗi); hết chỗ Q1 hôm nay; mai là lượt làm lại thật', async () => {
    const { d, env } = await batDau()
    const r = await dao(env)
    const ref = phien(d, r.id).questions[0]!
    const cau = await dapAnCua(env, ref)
    xoaDemOmni()
    const truoc = await hoSoOmniEm(env, 'S1', Date.now())
    const t = await em(env, '/game-v2/answer', { session: r.id, qid: ref.qid, answer: cau.correct, msLam: 60_000, tuTin: 'chac' })
    expect(t.ok, JSON.stringify(t).slice(0, 300)).toBe(true)
    expect(t.correct).toBe(true)
    expect(t.answer).toBe(cau.correct)
    expect(t.omni?.dang).toBeUndefined()
    const so = soCua(d, String(ref.qid))
    expect(so).toHaveLength(1)
    expect(so[0]!).toMatchObject({ ket_qua: 1, purpose: 'chan_doan' })
    expect(JSON.parse(so[0]!.raw_json!)).toMatchObject({ chon: cau.correct, tc: 'Q1', cd: 1, ms: 60_000 })
    expect(buocSai(d)).toEqual([]) // đúng ⇒ không ghi bước sai
    // OMNI: thêm ĐÚNG một quan sát cho bước nen:<nhãn> của câu chẩn đoán (P tăng vì đúng); bước khác của Q1 không đổi
    xoaDemOmni()
    const ho = await hoSoOmniEm(env, 'S1', Date.now())
    expect(ho.vkn[`nen:${NHAN_A}`]!.nTuLam).toBe((truoc.vkn[`nen:${NHAN_A}`]?.nTuLam ?? 0) + 1)
    expect(ho.vkn[`nen:${NHAN_A}`]!.p).toBeGreaterThan(truoc.vkn[`nen:${NHAN_A}`]!.p)
    for (const k of ['dang:D1', `nen:${NHAN_B}`]) expect(ho.vkn[k]?.nTuLam, k).toBe(truoc.vkn[k]?.nTuLam)
    // luật đóng lỗi: dòng chẩn đoán không phải lần làm của Q1
    const hs = await docHoSo2(env, 'S1', '2026-10-06')
    expect(hs.loiV2?.get('Q1')).toMatchObject({ trangThai: 'mo', ngayDung: [], soLanSai: 1 })
    expect(hs.chanDoanXong?.has('Q1')).toBe(true)
    expect((await docLanLam(env, 'S1', ['Q1'])).length).toBe(1) // chỉ lần sai gốc
    // kế hoạch hôm nay: chỗ của Q1 đã dùng (không thêm câu) ⇒ hết câu Đảo
    const kh = await docKeHoachDaChot(env, 'S1', Date.now())
    expect(kh?.tong).toBe(1); expect(kh?.conDao).toEqual([])
    expect((await dao(env)).questions).toEqual([])
    // ngày mai: lượt làm lại THẬT của Q1 (bản xáo của thang hôm nay), không chẩn đoán lại
    vi.setSystemTime(luc('2026-10-07'))
    const mai = await dao(env)
    expect(mai.questions.map((x: { qid: string }) => x.qid)).toEqual(['Q1'])
    expect(phien(d, mai.id).questions[0]).toMatchObject({ qid: 'Q1' })
    expect(phien(d, mai.id).questions[0]!.cd).toBeUndefined()
  })
  it('nộp SAI ⇒ một dòng omni_buoc_sai cho Q1 (bước của câu chẩn đoán); Trạm / chẩn đoán lần sau ưu tiên bước đó', async () => {
    const { d, env } = await batDau()
    const r = await dao(env)
    const ref = phien(d, r.id).questions[0]!
    const cau = await dapAnCua(env, ref)
    const sai = cau.phan === 'I' ? (['A', 'B', 'C', 'D'].find((k) => k !== cau.correct)!) : '999999'
    const t = await em(env, '/game-v2/answer', { session: r.id, qid: ref.qid, answer: sai, msLam: 60_000 })
    expect(t.ok, JSON.stringify(t).slice(0, 300)).toBe(true)
    expect(t.correct).toBe(false)
    expect(buocSai(d)).toEqual([{ qid: 'Q1', ma_vkn: `nen:${NHAN_A}` }])
    expect(soCua(d, String(ref.qid))[0]).toMatchObject({ ket_qua: 0, purpose: 'chan_doan' })
    // vẫn chỉ một lần sai của Q1 (dòng chẩn đoán không mở lại / không đếm lần sai)
    expect((await docHoSo2(env, 'S1', '2026-10-06')).loiV2?.get('Q1')).toMatchObject({ trangThai: 'mo', soLanSai: 1 })
    // nộp lại (mạng chập chờn) ⇒ không thêm dòng
    expect((await em(env, '/game-v2/answer', { session: r.id, qid: ref.qid, answer: sai, msLam: 60_000 })).replayed).toBe(true)
    expect(buocSai(d)).toHaveLength(1)
    expect(soCua(d, String(ref.qid))).toHaveLength(1)
  })
  it('em đã tự khai bước hieu_suat ⇒ câu chẩn đoán là câu nền hieu_suat', async () => {
    const { d, env } = await batDau()
    d.sql.prepare('INSERT INTO omni_buoc_sai(sbd,qid,ngay,ma_vkn,luc) VALUES(?,?,?,?,?)').run('S1', 'QX', '2026-10-05', `nen:${NHAN_B}`, new Date(luc('2026-10-05', '11:00')).toISOString())
    const r = await dao(env)
    expect(r.questions[0].qid).toMatch(new RegExp(`^nen:sinh\\.${NHAN_B}\\.\\d+$`))
  })
  it('câu có SONG SINH: lượt đầu là câu chẩn đoán (thay bản song sinh); hôm sau mới là song sinh ss0 (bản chưa phục vụ)', async () => {
    const { d, env } = await batDau()
    await damBaoBangLoiGiai(env)
    const { damBaoBangBoTro } = await import('../server/src/cau-bo-tro')
    await damBaoBangBoTro(env)
    d.sql.prepare("INSERT INTO loi_giai_cau(qid,bam,ma_de,dang,cap_nhat_luc) VALUES('Q1','BAMQ1',?,'tn','x')").run(TO11)
    const ss = (k: number) => ({ de: `Song sinh ${k} của Q1: tính m`, pa: { A: `${k}1`, B: `${k}2`, C: `${k}3`, D: `${k}4` }, dap_an: 'C', buoc: ['n', 'm'], gia_tri_dung: '1' })
    d.sql.prepare("INSERT INTO cau_bo_tro(bam,qid_mau,song_sinh_json,cau_kiem_json,nhan_nen_json,buoc_json,cap_nhat_luc) VALUES('BAMQ1','Q1',?,'[]','[]','[]','x')").run(JSON.stringify([ss(0), ss(1)]))
    const r = await dao(env)
    const ref = phien(d, r.id).questions[0]!
    expect(String(ref.qid)).toMatch(/^nen:sinh\./)
    expect(ref).toMatchObject({ tc: 'Q1', cd: 1 })
    const cau = await dapAnCua(env, ref)
    expect((await em(env, '/game-v2/answer', { session: r.id, qid: ref.qid, answer: cau.correct })).correct).toBe(true)
    vi.setSystemTime(luc('2026-10-07'))
    const mai = await dao(env)
    expect(mai.questions.map((x: { qid: string }) => x.qid)).toEqual(['Q1~ss0'])
  })
  it('khoá lam_lai_khac TẮT (thang về đường cũ) mà chan_doan_buoc_sai bật ⇒ vẫn chẩn đoán (hai công tắc độc lập); hôm sau Q1 nguyên văn như đường cũ', async () => {
    const { d, env } = await batDau()
    d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('lam_lai_khac','{"bat":false}','x')`)
    xoaDemCauHinh(env)
    const r = await dao(env)
    const ref = phien(d, r.id).questions[0]!
    expect(ref).toMatchObject({ tc: 'Q1', cd: 1 })
    const cau = await dapAnCua(env, ref)
    await em(env, '/game-v2/answer', { session: r.id, qid: ref.qid, answer: cau.correct })
    vi.setSystemTime(luc('2026-10-07'))
    const mai = await dao(env)
    expect(mai.questions.map((x: { qid: string }) => x.qid)).toEqual(['Q1'])
    const refMai = phien(d, mai.id).questions[0]!
    for (const k of ['tc', 'xt', 'nv', 'cd']) expect(k in refMai, `khoá ${k}`).toBe(false)
  })
  it('TẮT công tắc chan_doan_buoc_sai ⇒ y hệt hôm nay (lượt làm lại Q1 là bản xáo của thang, không câu nền)', async () => {
    const { d, env } = await batDau({ tat: true })
    const r = await dao(env)
    expect(r.questions.map((x: { qid: string }) => x.qid)).toEqual(['Q1'])
    const ref = phien(d, r.id).questions[0]!
    expect(ref.cd).toBeUndefined()
    expect(ref.xt).toBeTruthy()
  })
  it('OMNI TẮT cho em ⇒ không chẩn đoán (y hệt hôm nay)', async () => {
    const { d, env } = await batDau({ omni: false })
    const r = await dao(env)
    expect(r.questions.map((x: { qid: string }) => x.qid)).toEqual(['Q1'])
    expect(phien(d, r.id).questions[0]!.cd).toBeUndefined()
  })
  it('câu không có bước nền có bộ sinh + kho ý RỖNG (câu lý thuyết) ⇒ không chèn, không lỗi', async () => {
    const { d, env } = await batDau({ vkn: { QL: ['dang:DL'] } }, [QL], ['QL'])
    ghi(d, 'QL', 0, luc('2026-10-05', '10:00'))
    const r = await dao(env)
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect(r.questions.map((x: { qid: string }) => x.qid)).toEqual(['QL'])
    expect(phien(d, r.id).questions[0]!.cd).toBeUndefined()
  })
  it('câu lý thuyết + kho ý có ≥ 2 ý cùng dạng ⇒ chìa khoá + 2 ý Đ/S (Phần I); chấm đúng chữ cái; sổ ghi dạng của câu (quan sát dang:DL)', async () => {
    const QY: CauThu = { qid: 'QY', maDe: TO11, phan: 'II', dang: 'DL', mucDo: 'TH', correct: 'DSDS', text: 'Đề dẫn QY: X là este no, đơn chức, mạch hở.', solution: { chot: 'Este no, đơn chức, mạch hở: CnH2nO2 (n ≥ 2).' } }
    const { d, env } = await batDau({ vkn: { QL: ['dang:DL'] } }, [QL, QY], ['QL'])
    ghi(d, 'QL', 0, luc('2026-10-05', '10:00'))
    await damBaoBangYDs(env); await damBaoBangLoiGiai(env)
    const y = d.sql.prepare("INSERT INTO cau_y_ds(bam,khoa_y,stt,noi_dung,gia_tri,ly_do,nguon,luc,qid_mau,ma_de,lop) VALUES('0123456789abcdef',?,?,?,?,?,'may_soan_2_luot','x','QY',?,'11')")
    y.run('k1', 1, 'X có công thức chung CnH2nO2.', 'D', 'Este no đơn chức.', TO11)
    y.run('k2', 2, 'X làm mất màu nước brom.', 'S', 'Este no không có liên kết C=C.', TO11)
    const r = await dao(env)
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    const q = r.questions[0]
    expect(q.qid).toMatch(/^nen:yds\.0123456789abcdef\.[12]\.[12]$/)
    expect(q.phan).toBe('I'); expect(q.choices).toHaveLength(4)
    expect(q.text).toContain('Chìa khoá: Este no, đơn chức, mạch hở')
    khongLoDapAn(r)
    const ref = phien(d, r.id).questions[0]!
    expect(ref).toMatchObject({ tc: 'QL', cd: 1 })
    const cau = await dapAnCua(env, ref)
    const t = await em(env, '/game-v2/answer', { session: r.id, qid: ref.qid, answer: cau.correct })
    expect(t.correct).toBe(true)
    expect(soCua(d, String(ref.qid))[0]).toMatchObject({ purpose: 'chan_doan', ma_dang: 'DL' })
  })
})

// ───────────────────────── Đoàn ─────────────────────────
describe('(1) Đoàn: chặng cũng thay lượt làm lại đầu tiên bằng câu chẩn đoán', () => {
  it('chặng hiện câu nền thay Q1 (không lộ đáp án); nộp ⇒ sổ purpose chan_doan + tc; Q1 vẫn lỗi mở', async () => {
    const { d, env } = dung([Q1], ['Q1'], { nhipDao: false })
    ghi(d, 'Q1', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const mo = await em(env, '/game-v2/doan-mo', {})
    expect(mo.ok, JSON.stringify(mo).slice(0, 400)).toBe(true)
    const ma = String(mo.doan.ma)
    vi.setSystemTime(Date.now() + DEM_NGUOC_MS + 500)
    const xem = await em(env, '/game-v2/doan-xem', { ma })
    expect(xem.ok, JSON.stringify(xem).slice(0, 400)).toBe(true)
    const cau = xem.doan.cau as { qid: string; de: { text: string; phan: string } }
    expect(cau.qid).toMatch(/^nen:sinh\./)
    khongLoDapAn(xem)
    const phong = JSON.parse((d.sql.prepare('SELECT json FROM doan_chang WHERE ma = ?').get(ma) as { json: string }).json) as { nguoi: { phien: string; cau: Record<string, unknown>[] }[] }
    const refPhien = phien(d, phong.nguoi[0]!.phien).questions[0]!
    expect(refPhien).toMatchObject({ qid: cau.qid, tc: 'Q1', cd: 1 })
    const q = await dapAnCua(env, refPhien)
    expect(cau.de.text).toBe(q.text)
    const nop = await em(env, '/game-v2/doan-nop', { ma, hiep: xem.doan.tran.hiep, answer: q.correct, hanhDong: 'danh' })
    expect(nop.ok, JSON.stringify(nop).slice(0, 300)).toBe(true)
    expect(nop.ketQuaCau.correct).toBe(true)
    expect(soCua(d, cau.qid)[0]).toMatchObject({ ket_qua: 1, purpose: 'chan_doan' })
    expect(JSON.parse(soCua(d, cau.qid)[0]!.raw_json!)).toMatchObject({ tc: 'Q1', cd: 1 })
    expect((await docHoSo2(env, 'S1', '2026-10-06')).loiV2?.get('Q1')).toMatchObject({ trangThai: 'mo' })
  })
})

// ───────────────────────── giải mã ─────────────────────────
describe('(1) giải mã tham chiếu câu chẩn đoán', () => {
  it('version lệch (bộ sinh đổi) ⇒ null (câu đổi), không chấm theo câu khác; ý thiếu ⇒ null; kho chưa có bảng ⇒ null', async () => {
    const env = taoD1That().env as unknown as Env
    const c = sinhCauNen(NHAN_A, 2)!
    const q = cauTuCauNen(c, TO11)!
    expect(await giaiCauChanDoan(env, { qid: q.qid, maDe: TO11, version: q.version })).toEqual(q)
    expect(await giaiCauChanDoan(env, { qid: q.qid, maDe: TO11, version: 'cd-khac' })).toBeNull()
    expect(await giaiCauChanDoan(env, { qid: 'nen:yds.0123456789abcdef.1.2', maDe: TO11, version: 'cd-x' })).toBeNull()
    expect(await giaiCauChanDoan(env, { qid: 'Q1', maDe: TO11, version: 'v1' })).toBeNull()
  })
})

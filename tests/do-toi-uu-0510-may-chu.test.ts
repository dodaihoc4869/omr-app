// @vitest-environment node
// ĐO MÁY CHỦ 05/10 (làn P3 "nhanh gấp 2, chưa đẩy"): số VÒNG D1, số ĐỢT NỐI TIẾP (≈ độ trễ; mỗi đợt ≈ 300–400 ms trên D1 thật),
// ms CPU (độ trễ giả 0) và KB phản hồi của ĐÚNG các lệnh app học sinh / phụ huynh / thầy gọi — trên dữ liệu GẦN THẬT
// (1 lớp 40 em, kho 8 đề × 30 câu Phần I/II/III, 3 chiến dịch tick qua /gv/bai-da-day, em S01 làm ~200 câu qua 11 ngày bằng đường
// thật resume/sync/start/answer/complete, có trận Đoàn), khi OMNI TẮT và khi BẬT.
//
// CHẠY ĐƯỢC TRÊN CẢ BẢN TRƯỚC LẪN BẢN SAU: chỉ đi đường `worker.fetch` (không import hàm nội bộ nào ngoài `taoD1That`).
//  - In mỗi lệnh một dòng `DO|kịch bản|tên|vòng|đợt|ms|KB` (đợt tính theo ĐƯỜNG GĂNG: lệnh D1 bắt đầu sau khi lệnh khác xong ⇒ đợt sau).
//  - `DO_GHI=<tệp.json>`: ghi PHẢN HỒI (đã chuẩn hoá) của mọi lệnh + ẢNH CHỤP mọi bảng D1 sau kịch bản (lượt độ trễ 0, tất định).
//  - `DO_SO=<tệp.json>`: so bằng nhau sâu với tệp đã ghi ở bản trước ⇒ chứng minh không đổi kết quả (phản hồi + dữ liệu ghi D1).
//  - `DO_KQ=<tệp.json>`: ghi bảng số đo (để dựng docs/toi-uu-0510/MAY-CHU.md).
// Ngẫu nhiên (Math.random, crypto.randomUUID/getRandomValues) được gieo hạt; đồng hồ là Date giả ⇒ hai lượt chạy cùng bản ra y hệt nhau.
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { taoD1That } from './_d1-that'
import worker from '../server/src/index'
import type { Env } from '../server/src/kieu'

type Obj = Record<string, any>

// ───────────────────────── ngẫu nhiên gieo hạt + đồng hồ giả ─────────────────────────
let hat = 1
const rnd = () => { hat |= 0; hat = (hat + 0x6d2b79f5) | 0; let t = Math.imul(hat ^ (hat >>> 15), 1 | hat); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
let soUuid = 0
function gieoHat() { hat = 20261005; soUuid = 0 }
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.spyOn(Math, 'random').mockImplementation(() => rnd())
  vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(() => { soUuid++; return `00000000-0000-4000-8000-${soUuid.toString(16).padStart(12, '0')}` as `${string}-${string}-${string}-${string}-${string}` })
  vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(<T extends ArrayBufferView | null>(a: T): T => {
    const m = a as unknown as { length: number; BYTES_PER_ELEMENT: number; [i: number]: number | bigint }
    for (let i = 0; i < m.length; i++) m[i] = m.BYTES_PER_ELEMENT === 8 ? BigInt(Math.floor(rnd() * 2 ** 32)) : Math.floor(rnd() * 2 ** (8 * m.BYTES_PER_ELEMENT))
    return a
  })
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })
const gio = (ngay: string, hhmm: string) => Date.parse(`${ngay}T${hhmm}:00+07:00`)
let bayGio = 0
const datGio = (ms: number) => { bayGio = ms; vi.setSystemTime(ms) }
const troi = (ms: number) => datGio(bayGio + ms)

// ───────────────────────── bộ đếm vòng / đợt (tự chứa — chạy y hệt trên cả hai bản) ─────────────────────────
type Lenh = { sql: string; batDau: number; xong: number }
type Dem = { lenh: Lenh[] }
let demHienTai: Dem | null = null
let treMs = 0
const ngu = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve())
const gon = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 150)
function bocD1(goc: Obj): Obj {
  const thatCua = new WeakMap<object, Obj>()
  const sqlCua = new WeakMap<object, string>()
  const goi = <T>(sql: string, f: () => Promise<T>): Promise<T> => {
    const d = demHienTai
    const l: Lenh = { sql, batDau: performance.now(), xong: Number.POSITIVE_INFINITY }
    d?.lenh.push(l)
    return ngu(d ? treMs : 0).then(f).finally(() => { l.xong = performance.now() })
  }
  const bocSt = (st: Obj, sql: string): Obj => {
    const p: Obj = new Proxy(st, {
      get(t, k) {
        const v = t[k as string]
        if (k === 'bind') return (...a: unknown[]) => bocSt(v.apply(t, a), sql)
        if (k === 'first' || k === 'all' || k === 'run' || k === 'raw') return (...a: unknown[]) => goi(gon(sql), () => v.apply(t, a))
        return typeof v === 'function' ? v.bind(t) : v
      },
    })
    thatCua.set(p, st)
    sqlCua.set(p, sql)
    return p
  }
  const db: Obj = {
    prepare: (sql: string) => bocSt(goc.prepare(sql), sql),
    batch: (ds: Obj[]) => goi(`batch[${ds.map((x) => gon(sqlCua.get(x) ?? '?').slice(0, 60)).join(' ;; ')}]`, () => goc.batch(ds.map((x) => thatCua.get(x) ?? x))),
    exec: (s: string) => goi(gon(s), () => goc.exec(s)),
    withSession: () => db,
    [Symbol.for('omr.d1Goc')]: goc, // đệm theo isolate khoá theo D1 gốc (như bản withSession thật)
  }
  return db
}
function bocR2(goc: Obj): Obj {
  const goi = <T>(ten: string, f: () => Promise<T>): Promise<T> => {
    const d = demHienTai
    const l: Lenh = { sql: `R2 ${ten}`, batDau: performance.now(), xong: Number.POSITIVE_INFINITY }
    d?.lenh.push(l)
    return ngu(d ? treMs : 0).then(f).finally(() => { l.xong = performance.now() })
  }
  return {
    get: (k: string) => goi(`get ${k}`, () => goc.get(k)),
    put: (k: string, v: unknown, o?: unknown) => goi(`put ${k}`, () => goc.put(k, v, o)),
    delete: (k: string | string[]) => goi(`delete ${String(k)}`, () => goc.delete(k)),
    head: (k: string) => goi(`head ${k}`, () => (goc.head ? goc.head(k) : goc.get(k))),
    list: (o?: unknown) => goi('list', () => (goc.list ? goc.list(o) : Promise.resolve({ objects: [] }))),
  }
}
/** Đợt theo ĐƯỜNG GĂNG: lệnh i bắt đầu sau khi lệnh j XONG (thời gian thật) ⇒ i phụ thuộc j. đợt(i) = 1 + max đợt(j). Không bị CPU giữa các lệnh làm phình.
 *  `luc` = lúc máy chủ TRẢ phản hồi: chỉ lệnh XONG trước lúc ấy mới tính (việc nền `ctx.waitUntil` chạy sau phản hồi không làm em chờ) — lệnh nền được đánh dấu [nền]. */
function tinhDot(ds: Lenh[], luc = Number.POSITIVE_INFINITY): { dot: number; theoDot: string[] } {
  const xep = [...ds].sort((a, b) => a.batDau - b.batDau)
  const dotCua = new Map<Lenh, number>()
  let toiDa = 0
  for (const l of xep) {
    let d = 0
    for (const [k, dk] of dotCua) if (k.xong <= l.batDau && dk > d) d = dk
    dotCua.set(l, d + 1)
    if (l.xong <= luc && d + 1 > toiDa) toiDa = d + 1
  }
  return { dot: toiDa, theoDot: xep.map((l) => `[đ${dotCua.get(l)}]${l.xong <= luc ? '' : '[nền]'} ${l.sql}`) }
}

// ───────────────────────── dữ liệu gần thật ─────────────────────────
const LOP = '12A1'
const EM = Array.from({ length: 40 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`)
const LOP2 = '12A2'
const EM2 = Array.from({ length: 10 }, (_, i) => `S${i + 41}`)
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi']
const TEN = ['An', 'Bảo', 'Châu', 'Dũng', 'Giang', 'Hà', 'Khánh', 'Linh', 'Minh', 'Nam']
type CauKho = { qid: string; maDe: string; phan: 'I' | 'II' | 'III'; correct: string }
const DE = Array.from({ length: 8 }, (_, i) => `DH-0${i + 1}`)
const BAI = [
  { khoa: 'B1', ten: 'Bài 1 · Ester – Lipid', de: DE.slice(0, 3) },
  { khoa: 'B2', ten: 'Bài 2 · Carbohydrate', de: DE.slice(3, 6) },
  { khoa: 'B3', ten: 'Bài 3 · Amine – Amino acid', de: DE.slice(6, 8) },
]
const DANG_THEO_BAI: Record<string, string[]> = { B1: ['ES.TP', 'ES.DC', 'ES.HS', 'ES.CB'], B2: ['CB.GL', 'CB.TB', 'CB.LM'], B3: ['AM.TC', 'AM.AA', 'AM.PT'] }
const MUC = ['biet', 'hieu', 'van_dung']
function cauJson(maDe: string, i: number, baiKhoa: string): { json: Obj; kho: CauKho; dang: string } {
  const qid = `${maDe}-${String(i + 1).padStart(2, '0')}`
  const phan: 'I' | 'II' | 'III' = i < 20 ? 'I' : i < 24 ? 'II' : 'III'
  const dangs = DANG_THEO_BAI[baiKhoa]!
  const dang = dangs[i % dangs.length]!
  const m = 6 * ((i % 5) + 1)
  const n = m / 60
  const mEste = Math.round(n * 88 * 0.5 * 100) / 100
  const so = (x: number) => String(x).replace('.', ',')
  const text = phan === 'I' && i % 3 === 0
    ? `Đun nóng ${so(m)} gam acetic acid với ethanol dư (xúc tác H₂SO₄ đặc), thu được ${so(mEste)} gam ethyl acetate. Hiệu suất của phản ứng ester hoá là`
    : `Câu ${i + 1} (${maDe}): Thuỷ phân hoàn toàn ${so(m)} gam một ester đơn chức X trong dung dịch NaOH dư, đun nóng, thu được muối và ${so(Math.round(n * 46 * 100) / 100)} gam alcohol. Cho các nhận định về X, chất béo và phản ứng xà phòng hoá; chọn phát biểu đúng.`
  const correct = phan === 'I' ? 'ABCD'[i % 4]! : phan === 'II' ? ['DSDS', 'SDDS', 'DDSS', 'SSDD'][i % 4]! : so(Math.round((n * 100 + i) * 10) / 10)
  const json = {
    qid, maDe, version: 'v1', group: `g-${qid}`, phan, text,
    choices: phan === 'I' ? ['25%', '50%', '62,5%', '75%'].map((x, k) => (i % 3 === 0 ? x : `Phát biểu ${k + 1} về ester và chất béo của câu ${i + 1}`)) : [],
    ideas: phan === 'II' ? ['a) Ester bị thuỷ phân trong môi trường kiềm.', 'b) Chất béo là triester.', 'c) Xà phòng hoá là phản ứng một chiều.', 'd) Ethyl acetate tan tốt trong nước.'] : [],
    hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo: MUC[i % 3], sao: 1 + (i % 3), kienThuc: [`KT-${dang}`], correct, reviewed: true,
    solution: { chot: `n(acid) = ${so(m)} : 60 = ${so(n)} mol ⇒ m(ester lí thuyết) = ${so(n * 88)} gam. Hiệu suất H = ${so(mEste)} : ${so(n * 88)} × 100% = 50%. Đáp án ${correct}.` },
  }
  return { json, kho: { qid, maDe, phan, correct }, dang }
}

type The = { d: ReturnType<typeof taoD1That>; env: Env; kho: Map<string, CauKho>; token: Map<string, string>; chienDich: string[] }
async function goiTho(env: Env, duong: string, than: Obj, thay = false): Promise<{ j: Obj; kb: number; msTraLoi: number; msTong: number; lucTraLoi: number }> {
  const viec: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => { viec.push(p) }, passThroughOnException() {} }
  const t0 = performance.now()
  const r = await worker.fetch(new Request(`https://omr.test${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(thay ? { ...than, secret: 'bi-mat-thu' } : than) }), env, ctx as never)
  const chu = await r.text()
  const t1 = performance.now()
  await Promise.all(viec)
  const t2 = performance.now()
  let j: Obj
  try { j = JSON.parse(chu) as Obj } catch { j = { khongPhaiJson: chu.slice(0, 200), status: r.status } }
  return { j, kb: Buffer.byteLength(chu) / 1024, msTraLoi: t1 - t0, msTong: t2 - t0, lucTraLoi: t1 }
}

/** Dựng thế giới tất định: lớp 40 em, kho 8 đề, 3 chiến dịch tick theo ngày, S01 chơi 11 ngày (~200 câu) + vài em khác, có Đoàn. */
async function dungThe(omni: boolean): Promise<The> {
  gieoHat()
  datGio(gio('2026-09-23', '20:00'))
  const d = taoD1That()
  const env = { ...(d.env as unknown as Obj), DB: bocD1(d.env.DB as unknown as Obj), DE: bocR2(d.env.DE as unknown as Obj) } as unknown as Env
  const s = d.sql
  const themEm = s.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,nam_sinh,cap_nhat_luc) VALUES(?,?,?,?,?,?)')
  EM.forEach((sbd, i) => themEm.run(sbd, `${HO[i % 8]} ${TEN[i % 10]} ${i + 1}`, LOP, `mk-${sbd}`, '2008', '2026-09-01T00:00:00.000Z'))
  // Lớp thứ hai (trung tâm có nhiều lớp): 10 em, chiến dịch riêng — chỉ để bảng chung có dữ liệu của lớp khác như máy thật.
  EM2.forEach((sbd, i) => themEm.run(sbd, `${HO[(i + 3) % 8]} ${TEN[(i + 5) % 10]} ${i + 41}`, LOP2, `mk-${sbd}`, '2008', '2026-09-01T00:00:00.000Z'))
  s.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["${LOP}"]}','x'),('doan_ho_tong','{"toanBo":true}','x'),('shop_phu_kien','{"bat":true}','x')`)
  if (omni) s.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('omni','{"bat":true,"lop":[],"sbd":[]}','x')`)
  const kho = new Map<string, CauKho>()
  const themDe = s.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,'12',30,0,'v1')")
  const themIdx = s.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')")
  const themCau = s.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const bai of BAI) for (const maDe of bai.de) {
    themDe.run(maDe, `${bai.ten} · tờ ${maDe}`)
    themIdx.run(maDe)
    for (let i = 0; i < 30; i++) { const c = cauJson(maDe, i, bai.khoa); kho.set(c.kho.qid, c.kho); themCau.run(maDe, c.kho.qid, 'v1', `g-${c.kho.qid}`, c.dang, JSON.stringify(c.json)) }
  }
  const the: The = { d, env, kho, token: new Map(), chienDich: [] }
  // Em đăng nhập lần đầu (đường thật) + chọn thần thú.
  for (const sbd of EM.slice(0, 8)) {
    const dn = (await goiTho(env, '/hs/dang-nhap', { sbd, matKhau: `mk-${sbd}` })).j
    expect(dn.ok && dn.token, JSON.stringify(dn).slice(0, 200)).toBeTruthy()
    the.token.set(sbd, String(dn.token))
    await goiTho(env, '/game-v2/profile', { token: dn.token })
    const ch = (await goiTho(env, '/game-v2/choose', { token: dn.token, pet: ['lua_phuong', 'nuoc_long', 'dat_quy', 'khi_lang'][EM.indexOf(sbd) % 4] })).j
    expect(ch.ok, JSON.stringify(ch).slice(0, 200)).toBe(true)
    troi(1000)
  }
  // Ba chiến dịch: thầy tick bài đã dạy (đường thật /gv/bai-da-day) vào ba ngày khác nhau; em chơi mỗi tối.
  const lich: { ngay: string; tick?: number }[] = []
  for (let k = 0; k < 12; k++) { const ngay = new Date(Date.UTC(2026, 8, 24 + k)).toISOString().slice(0, 10); lich.push({ ngay, tick: ngay === '2026-09-24' ? 0 : ngay === '2026-09-28' ? 1 : ngay === '2026-10-02' ? 2 : undefined }) }
  for (const { ngay, tick } of lich) {
    if (ngay >= '2026-10-05') break
    if (tick !== undefined) {
      datGio(gio(ngay, '08:00'))
      const bai = BAI[tick]!
      let t = (await goiTho(env, '/gv/bai-da-day', { action: 'tick', lop: LOP, khoaBai: bai.khoa, tenBai: bai.ten, viTri: tick + 1, maDe: bai.de, phamVi: [] }, true)).j
      // main c74100ef chưa có /gv/bai-da-day (OMNI 3) ⇒ giao chiến dịch đúng tham số tick dùng, qua lệnh có sẵn /gv/chien-dich.
      if (!t.ok && !t.chienDichId) {
        const han = new Date(Date.parse(`${ngay}T00:00:00Z`) + 6 * 86_400_000).toISOString().slice(0, 10)
        const t2 = (await goiTho(env, '/gv/chien-dich', { action: 'tao', ten: bai.ten, lop: LOP, sbd: EM, maDe: bai.de, hanNop: han, huyetChien: true, raiDeu: true, batDau: ngay }, true)).j
        t = { ok: t2.ok, chienDichId: t2.id }
      }
      expect(t.ok, JSON.stringify(t).slice(0, 300)).toBe(true)
      the.chienDich.push(String(t.chienDichId))
    }
    if (ngay === '2026-10-01') {
      // Thầy giao trước cho lớp 12A2 (bắt đầu 07/10) và thêm một em học ghép vào chiến dịch đang chạy của 12A1 (đường thật /gv/chien-dich, /gv/chien-dich/sua).
      datGio(gio(ngay, '09:00'))
      const t3 = (await goiTho(env, '/gv/chien-dich', { action: 'tao', ten: 'Giao trước · Ester 12A2', lop: LOP2, sbd: EM2, maDe: [DE[0]!, DE[1]!], hanNop: '2026-10-14', huyetChien: true, raiDeu: true, batDau: '2026-10-07' }, true)).j
      expect(t3.ok, JSON.stringify(t3).slice(0, 300)).toBe(true)
      const sua = (await goiTho(env, '/gv/chien-dich/sua', { action: 'luu', id: the.chienDich[1], themSbd: [EM2[0]] }, true)).j
      expect(sua.ok, JSON.stringify(sua).slice(0, 300)).toBe(true)
    }
    datGio(gio(ngay, '19:00'))
    await choiNgay(the, 'S01', 4, omni)
    if (ngay === '2026-10-01') {
      // Bảng `loi_giai_hoi` có sẵn trên máy thật (nút "Hỏi thầy" chạy từ 29/09); D1 giả chỉ có bảng của migration ⇒ dựng bằng đúng DDL lúc chạy
      // của máy chủ (lệnh /hs/hoi-thay chạy DDL trước khi kiểm câu; thiếu câu ⇒ trả lời ngay, không ghi gì).
      const h = (await goiTho(env, '/hs/hoi-thay', { token: the.token.get('S03'), qid: '', nguon: 'dao' })).j
      expect(h.ok).toBe(false)
    }
    // S02 chơi Đảo bốn tối đầu rồi bận một tuần (05/10 quay lại: kế hoạch dồn câu ôn nợ sang Đoàn ⇒ có trận Đoàn để đo).
    if (ngay <= '2026-09-27') await choiNgay(the, 'S02', 4, omni)
    for (const sbd of EM.slice(2, 6)) await choiNgay(the, sbd, 1, omni)
  }
  return the
}

function traLoiCho(the: The, qid: string, phan: string | undefined, k: number): string {
  const c = the.kho.get(qid.replace(/~ss\d+$/, ''))
  const p = c?.phan ?? phan ?? 'I'
  const dung = (k * 7 + qid.length * 3) % 10 < 7
  if (!c) return p === 'II' ? 'DSDS' : p === 'III' ? '1' : 'A'
  if (dung) return c.correct
  return p === 'I' ? 'ABCD'[('ABCD'.indexOf(c.correct) + 1) % 4]! : p === 'II' ? (c.correct === 'DDDD' ? 'SSSS' : 'DDDD') : '999'
}
async function choiNgay(the: The, sbd: string, soChuyen: number, omni: boolean) {
  const token = the.token.get(sbd)!
  const g = (duong: string, than: Obj = {}) => goiTho(the.env, duong, { token, ...than }).then((x) => x.j)
  await g('/game-v2/hoa2-sanh')
  troi(2000)
  for (let c = 0; c < soChuyen; c++) {
    const cu = await g('/game-v2/resume')
    if (cu.id && cu.questions?.length) await g('/game-v2/complete', { session: cu.id })
    let sy = await g('/game-v2/sync')
    for (let i = 0; i < 50 && (sy.remaining ?? 0) > 0; i++) sy = await g('/game-v2/sync')
    const st = await g('/game-v2/start', { mode: 'adventure' })
    if (!st.ok || !st.id || !st.questions?.length) return
    let k = 0
    for (const q of st.questions as Obj[]) {
      troi(40_000)
      await g('/game-v2/answer', { session: st.id, qid: q.qid, answer: traLoiCho(the, String(q.qid), q.phan, k++), assisted: false, ...(omni ? { msLam: 38_000 + k * 1000, tuTin: 'chac' } : {}) })
    }
    await g('/game-v2/complete', { session: st.id })
    troi(60_000)
  }
}
// ───────────────────────── chuẩn hoá phản hồi + ảnh chụp D1 ─────────────────────────
function chuanHoa(j: Obj): Obj {
  const x = JSON.parse(JSON.stringify(j)) as Obj
  delete x.nhipDeNghi // hệ số nhịp theo sức khoẻ máy (đo bằng thời gian thật) — không tất định
  return x
}
function anhChupD1(the: The): Record<string, string> {
  const bang = (the.d.sql.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[]).map((x) => x.name)
  const ra: Record<string, string> = {}
  for (const b of bang) {
    if (b === 'nhat_ky_may' || b === 'suc_khoe_may') continue // số đo thời gian thật của máy chủ — không tất định
    const cot = (the.d.sql.prepare(`SELECT name FROM pragma_table_info('${b}')`).all() as { name: string }[]).map((x) => `"${x.name}"`)
    const dong = the.d.sql.prepare(`SELECT * FROM "${b}" ORDER BY ${cot.join(',')}`).all()
    if (dong.length) ra[b] = JSON.stringify(dong)
  }
  return ra
}
const bam = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16)

// ───────────────────────── kịch bản ĐO (ngày 05/10, 19:30) ─────────────────────────
type DongDo = { kb: string; ten: string; vong: number; dot: number; ms: number; msTraLoi: number; kbPhanHoi: number; theoDot: string[] }
async function kichBanDo(the: The, omni: boolean, tre: number, ghi: (ten: string, j: Obj) => void): Promise<DongDo[]> {
  const ketQua: DongDo[] = []
  const tenKb = omni ? 'omni-bat' : 'omni-tat'
  const S1 = 'S01'
  const env = the.env
  const goi = async (ten: string, duong: string, than: Obj, thay = false): Promise<Obj> => {
    const dem: Dem = { lenh: [] }
    demHienTai = dem
    treMs = tre
    let r: Awaited<ReturnType<typeof goiTho>>
    try { r = await goiTho(env, duong, than, thay) } finally { demHienTai = null; treMs = 0 }
    const { dot, theoDot } = tinhDot(dem.lenh, r.lucTraLoi)
    ketQua.push({ kb: tenKb, ten, vong: dem.lenh.length, dot, ms: r.msTong, msTraLoi: r.msTraLoi, kbPhanHoi: r.kb, theoDot })
    ghi(ten, chuanHoa(r.j))
    troi(3000)
    return r.j
  }
  datGio(gio('2026-10-05', '19:30'))
  // MỞ APP: đăng nhập → (Sảnh ‖ kế hoạch ngày ‖ đồng bộ EXP) — app gọi song song sau đăng nhập; đo từng lệnh.
  const dn = await goi('dang-nhap', '/hs/dang-nhap', { sbd: S1, matKhau: `mk-${S1}` })
  const token = String(dn.token)
  const em = (ten: string, duong: string, than: Obj = {}) => goi(ten, duong, { token, ...than })
  await em('hoa2-sanh-1', '/game-v2/hoa2-sanh')
  await em('ke-hoach-ngay', '/hs/ke-hoach-ngay', { sbd: S1 })
  await em('academic-sync', '/game-v2/academic-sync')
  await em('profile', '/game-v2/profile')
  await em('hoa2-sanh-2', '/game-v2/hoa2-sanh')
  await em('recommendations', '/game-v2/recommendations')
  await em('so-tay', '/game-v2/so-tay')
  // Lên Đảo: resume → sync → start → 6 câu → complete.
  await em('resume', '/game-v2/resume')
  await em('sync', '/game-v2/sync')
  const st = await em('start', '/game-v2/start', { mode: 'adventure' })
  expect(st.ok, JSON.stringify(st).slice(0, 300)).toBe(true)
  const cau = (st.questions ?? []) as Obj[]
  expect(cau.length, JSON.stringify(st).slice(0, 300)).toBeGreaterThan(0)
  let k = 0
  for (const q of cau) {
    troi(40_000)
    await em(`answer-${k + 1}`, '/game-v2/answer', { session: st.id, qid: q.qid, answer: traLoiCho(the, String(q.qid), q.phan, k), assisted: false, ...(omni ? { msLam: 38_000 + k * 1000, tuTin: 'chac' } : {}) })
    k++
  }
  await em('complete', '/game-v2/complete', { session: st.id })
  const daLam = await em('hoa2-cau-da-lam', '/game-v2/hoa2-cau-da-lam')
  const qids = ((daLam.cau ?? []) as Obj[]).slice(0, 12).map((x) => String(x.qid))
  await em('hoa2-cau-chi-tiet', '/game-v2/hoa2-cau-chi-tiet', qids.length ? { qids } : { qid: cau[0]!.qid })
  // Đoàn: S02 (nghỉ một tuần, câu ôn nợ dồn sang Đoàn) đăng nhập → Sảnh → Sảnh Đoàn → Lên đường → xem → nộp hai hiệp.
  const dn2 = await goi('dang-nhap-S02', '/hs/dang-nhap', { sbd: 'S02', matKhau: 'mk-S02' })
  const em2 = (ten: string, duong: string, than: Obj = {}) => goi(ten, duong, { token: String(dn2.token), ...than })
  const sanhS02 = await em2('hoa2-sanh-S02', '/game-v2/hoa2-sanh')
  expect(sanhS02.doan?.con, JSON.stringify(sanhS02).slice(0, 300)).toBeGreaterThan(0)
  await em2('doan-sanh', '/game-v2/doan-sanh')
  const mo = await em2('doan-mo', '/game-v2/doan-mo')
  const ma = mo.doan?.ma
  expect(ma, JSON.stringify(mo).slice(0, 300)).toBeTruthy()
  for (let h = 1; h <= 2; h++) {
    let xem = await em2(`doan-xem-${h}`, '/game-v2/doan-xem', { ma })
    if ((xem.doan?.tran?.moSauMs ?? 0) > 0) { troi(Number(xem.doan.tran.moSauMs) + 500); xem = await em2(`doan-xem-${h}b`, '/game-v2/doan-xem', { ma }) }
    const t2 = xem.doan?.tran, c2 = xem.doan?.cau
    expect(c2?.de, JSON.stringify(xem).slice(0, 400)).toBeTruthy()
    troi(20_000)
    const nop = await em2(`doan-nop-${h}`, '/game-v2/doan-nop', { ma, hiep: t2.hiep, answer: traLoiCho(the, String(c2.qid), c2.de?.phan, h), hanhDong: 'danh', ...(omni ? { msLam: 20_000, tuTin: 'chac' } : {}) })
    expect(nop.ok, JSON.stringify(nop).slice(0, 300)).toBe(true)
    troi(15_000)
  }
  await em('vang-xem', '/game-v2/vang-xem')
  await em('shop-danh-sach', '/game-v2/shop-danh-sach')
  await em('luyen-nen', '/hs/luyen-nen', { nhan: 'hieu_suat' })
  // Phụ huynh (SBD trần như app /ph khi chưa có mã liên kết).
  await goi('ph-tat-ca-ve-con', '/ph/tat-ca-ve-con', { sbd: S1 })
  await goi('ph-hoc-2', '/ph/hoc-2', { sbd: S1 })
  await goi('ph-loi-thay', '/ph/loi-thay', { sbd: S1 })
  // Thầy.
  await goi('gv-omni-co-doc', '/gv/omni', { action: 'co-doc' }, true)
  await goi('gv-omni-bang', '/gv/omni', { action: 'bang', chienDichId: the.chienDich[the.chienDich.length - 1] }, true)
  await goi('gv-chien-dich', '/gv/chien-dich', { action: 'danh-sach' }, true)
  await goi('gv-chien-dich-thong-ke', '/gv/chien-dich', { action: 'danh-sach', thongKe: true }, true)
  await goi('gv-bai-da-day', '/gv/bai-da-day', { action: 'danh-sach', lop: LOP }, true)
  return ketQua
}

// ───────────────────────── chạy + in + ghi/so ─────────────────────────
const TRE = 25
const tatCa: { omni: boolean; dong: DongDo[]; msDong: DongDo[] }[] = []
const mau: Record<string, unknown> = {}
const CHUOI_MO = ['dang-nhap', 'hoa2-sanh-1', 'ke-hoach-ngay', 'academic-sync']
const CHUOI_CHOI = ['start', 'answer-1', 'answer-2', 'answer-3', 'answer-4', 'complete', 'doan-nop-1', 'doan-nop-2']

async function chay(omni: boolean) {
  // Lượt 1: độ trễ giả TRE ms/vòng ⇒ đếm vòng + đợt (đường găng).
  const a = await dungThe(omni)
  const dong = await kichBanDo(a, omni, TRE, () => {})
  // Lượt 2: thế giới y hệt, độ trễ 0 ⇒ ms CPU + PHẢN HỒI tất định để so trước/sau.
  const b = await dungThe(omni)
  const phanHoi: Record<string, Obj> = {}
  const msDong = await kichBanDo(b, omni, 0, (ten, j) => { phanHoi[ten] = j })
  tatCa.push({ omni, dong, msDong })
  const kb = omni ? 'omni-bat' : 'omni-tat'
  for (const x of dong) {
    const m = msDong.find((y) => y.ten === x.ten)
    console.log(`DO|${kb}|${x.ten}|${x.vong}|${x.dot}|${(m?.ms ?? NaN).toFixed(1)}|${x.kbPhanHoi.toFixed(1)}`)
  }
  const tong = (ds: string[]) => ds.reduce((s, t) => s + (dong.find((x) => x.ten === t)?.dot ?? 0), 0)
  console.log(`DO|${kb}|TONG-MO(${CHUOI_MO.join('+')})|-|${tong(CHUOI_MO)}|-|-`)
  console.log(`DO|${kb}|GANG-MO(dang-nhap + max song song)|-|${(dong.find((x) => x.ten === 'dang-nhap')?.dot ?? 0) + Math.max(...CHUOI_MO.slice(1).map((t) => dong.find((x) => x.ten === t)?.dot ?? 0))}|-|-`)
  console.log(`DO|${kb}|TONG-CHOI(${CHUOI_CHOI.join('+')})|-|${tong(CHUOI_CHOI)}|-|-`)
  mau[kb] = { phanHoi, d1: anhChupD1(b) }
  return { dong, msDong }
}

describe('ĐO máy chủ 05/10 — lệnh app gọi, dữ liệu gần thật', () => {
  it('OMNI TẮT', async () => {
    const { dong } = await chay(false)
    expect(dong.length).toBeGreaterThan(20)
  }, 300_000)
  it('OMNI BẬT', async () => {
    const { dong } = await chay(true)
    expect(dong.length).toBeGreaterThan(20)
  }, 300_000)
  it('ghi / so phản hồi + ảnh chụp D1 với bản trước', () => {
    const tepGhi = process.env.DO_GHI, tepSo = process.env.DO_SO, tepKq = process.env.DO_KQ
    if (tepKq) writeFileSync(tepKq, JSON.stringify(tatCa.map((x) => ({ omni: x.omni, dong: x.dong.map((d) => ({ ...d, ms: x.msDong.find((m) => m.ten === d.ten)?.ms, msTraLoi: x.msDong.find((m) => m.ten === d.ten)?.msTraLoi })) })), null, 1))
    if (tepGhi) writeFileSync(tepGhi, JSON.stringify(mau))
    if (tepSo) {
      const truoc = JSON.parse(readFileSync(tepSo, 'utf8')) as Record<string, { phanHoi: Record<string, Obj>; d1: Record<string, string> }>
      const lech: string[] = []
      for (const kb of Object.keys(truoc)) {
        const sau = mau[kb] as { phanHoi: Record<string, Obj>; d1: Record<string, string> } | undefined
        if (!sau) { lech.push(`${kb}: thiếu kịch bản`); continue }
        for (const ten of new Set([...Object.keys(truoc[kb]!.phanHoi), ...Object.keys(sau.phanHoi)])) {
          const a = JSON.stringify(truoc[kb]!.phanHoi[ten]), b = JSON.stringify(sau.phanHoi[ten])
          if (a !== b) lech.push(`${kb} · phản hồi ${ten}: ${bam(a ?? '')} ≠ ${bam(b ?? '')}`)
        }
        for (const bg of new Set([...Object.keys(truoc[kb]!.d1), ...Object.keys(sau.d1)])) {
          if (truoc[kb]!.d1[bg] !== sau.d1[bg]) lech.push(`${kb} · bảng ${bg}: ${bam(truoc[kb]!.d1[bg] ?? '')} ≠ ${bam(sau.d1[bg] ?? '')}`)
        }
      }
      console.log(`SO|${lech.length ? 'LECH' : 'KHOP'}|${lech.length}`)
      for (const l of lech.slice(0, 40)) console.log(`SO|${l}`)
      expect(lech).toEqual([])
    }
  })
})
afterAll(() => { demHienTai = null })

// @vitest-environment node
// TỐI ƯU CA KIỂM TRA 30/09 (docs/do-toi-uu-ca-3009.md) — chốt BẤT BIẾN của đường nóng sau khi gộp vòng D1 + đệm isolate:
//   · số vòng đi-về D1 của /vao-thi (2), /nop (1; ca "chỉ nộp phút cuối" 2), /phong-cho, /de/ (0 lượt R2 khi đệm còn đúng phiên);
//   · bản đồ đề riêng cắt trong D1 cho ra ĐÚNG phần mà `locGoiDeRiengChoEm(JSON.parse(cả cột))` cho ra — mọi dạng cột, kể cả dạng lạ;
//   · đáp án KHÔNG ra đường công khai trước khi nộp; tờ đáp án sau khi nộp luôn là bản MỚI NHẤT trên R2 (đệm hỏi lại có điều kiện);
//   · luật "chỉ nộp trong 1 phút cuối" y như cũ; nộp lại không ghi đè; không mất đáp án đã lưu;
//   · CHẤM Y HỆT: điểm tính từ bài đã cất bằng `gradeFromKeyBank` trùng điểm tính từ bài máy em gửi; `/cham-diem` gộp batch cho ra bảng
//     tiến độ đúng như vòng lặp cũ (mỗi em: tien_do_hs = tổng tien_do_ca theo chuyên đề).
import { describe, expect, it } from 'vitest'
import worker, { locGoiDeRiengChoEm } from '../server/src/index'
import { taoD1That } from './_d1-that'
import { gradeFromKeyBank } from '../src/lib/exam-grade'
import type { AnswerRecord } from '../src/lib/exam-db'
import { damBaoChiMuc } from '../server/src/chi-muc-luc-chay'

type Any = Record<string, any>
const MAT = 'bi-mat-thu'

/** R2 giả CÓ etag + `onlyIf.etagDoesNotMatch` như R2 thật; đếm lượt đọc và lượt có thân. */
function r2Gia() {
  const kho = new Map<string, { text: string; etag: string }>()
  let n = 0
  const dem = { get: 0, coThan: 0 }
  return {
    dem,
    kho,
    async get(key: string, tuyChon?: { onlyIf?: { etagDoesNotMatch?: string } }) {
      dem.get++
      const v = kho.get(key)
      if (!v) return null
      if (tuyChon?.onlyIf?.etagDoesNotMatch === v.etag) return { key, etag: v.etag, httpEtag: `"${v.etag}"` }
      dem.coThan++
      return { key, etag: v.etag, httpEtag: `"${v.etag}"`, body: new Response(v.text).body, arrayBuffer: async () => new TextEncoder().encode(v.text).buffer }
    },
    async put(key: string, value: string) {
      kho.set(key, { text: typeof value === 'string' ? value : JSON.stringify(value), etag: `e${++n}` })
      return {}
    },
    async delete(key: string) { kho.delete(key) },
  }
}

/** Bọc D1 giả để đếm VÒNG ĐI-VỀ: mỗi first/all/run = 1, mỗi batch = 1. */
function demVong(db: Any) {
  const dem = { vong: 0 }
  const boc = {
    prepare(q: string) {
      const st = db.prepare(q)
      const w: Any = {
        _q: q,
        __st: st,
        bind(...a: unknown[]) { st.bind(...a); return w },
        async first() { dem.vong++; return st.first() },
        async all() { dem.vong++; return st.all() },
        async run() { dem.vong++; return st.run() },
      }
      return w
    },
    async batch(ds: Any[]) { dem.vong++; return db.batch(ds.map((d) => d.__st ?? d)) },
    withSession() { return boc },
  }
  return { boc, dem }
}

async function dung(opts: { deRieng?: string | null; congBo?: string; chiNop?: number; phongCho?: number } = {}) {
  const d = taoD1That()
  const r2 = r2Gia()
  const v = demVong(d.env.DB)
  const env = { ...d.env, DB: v.boc, DE: r2 } as unknown as Any
  const nay = new Date().toISOString()
  d.sql.prepare(`INSERT INTO ca (ma_ca, ten_ca, trang_thai, thoi_gian_phut, loai, cong_bo, nguong_lan, nguong_giay, bank_r2, so_cau_json, bo_theo_em_json,
      cap_nhat_luc, lop, phong_cho, de_rieng, chi_nop_3_phut_cuoi, dong_bo_gio)
    VALUES ('C1','Ca thử','mo',45,'thi',?,3,30,'de/C1.json',?,?,?,'12A',?,?,?,0)`).run(
    opts.congBo ?? 'khong', JSON.stringify({ I: 2, II: 1, III: 1 }), opts.deRieng === undefined ? null : opts.deRieng, nay,
    opts.phongCho ?? 0, opts.deRieng ? 1 : 0, opts.chiNop ?? 0,
  )
  // Chỉ mục tạo lúc chạy (một lần mỗi isolate, ngoài đường đo) — dựng trước để đếm vòng không lẫn.
  await damBaoChiMuc(env as never)
  // Một lượt khởi động: đệm cờ `cau_hinh` theo isolate (cửa sổ làm mới, sức khoẻ máy…) đọc lần đầu ở lượt này, không lẫn vào số đo.
  await worker.fetch(new Request('https://x.test/khoe'), env as never)
  await worker.fetch(new Request('https://x.test/phong-cho?maCa=KHONG'), env as never)
  return { d, env, r2, dem: v.dem }
}
async function goi(env: Any, duong: string, than?: Any, dau: Record<string, string> = {}) {
  const req = than === undefined
    ? new Request('https://x.test' + duong, { headers: dau })
    : new Request('https://x.test' + duong, { method: 'POST', headers: { 'content-type': 'application/json', ...dau }, body: JSON.stringify(than) })
  const r = await worker.fetch(req, env)
  const txt = await r.text()
  let j: Any = {}
  try { j = txt ? JSON.parse(txt) : {} } catch { j = { raw: txt } }
  return { status: r.status, j, txt, r }
}

const BANK = {
  phanI: [{ id: 'q1', text: 'Câu 1', choices: ['a', 'b', 'c', 'd'] }, { id: 'q2', text: 'Câu 2', choices: ['a', 'b', 'c', 'd'] }],
  phanII: [{ id: 'q3', text: 'Câu 3', ideas: ['a', 'b', 'c', 'd'] }],
  phanIII: [{ id: 'q4', text: 'Câu 4' }],
  soCau: { I: 2, II: 1, III: 1 },
}
const KEY = {
  phanI: [{ ...BANK.phanI[0], correct: 'B', solution: 'LG1' }, { ...BANK.phanI[1], correct: 'D', solution: 'LG2' }],
  phanII: [{ ...BANK.phanII[0], correct: ['D', 'S', 'D', 'S'], solution: 'LG3' }],
  phanIII: [{ ...BANK.phanIII[0], correct: '2.5', solution: 'LG4' }],
  soCau: { I: 2, II: 1, III: 1 },
}

describe('/vao-thi — MỘT batch đọc + MỘT câu ghi; bản đồ đề riêng cắt trong D1 = cắt trên cả cột', () => {
  const GOI_MOI = { bo: { '10001': ['q1', 'q3'], '10002': ['q2'] }, lap: { '10001': ['q1'] }, dem: { '10001': { q1: 2 } }, daLam: { '10001': { q1: '12/09' } }, bb: { ghiChu: 'biên bản của thầy' } }
  const DANG: [string, string | null][] = [
    ['mới đủ bốn bản đồ', JSON.stringify(GOI_MOI)],
    ['mới thiếu lap/dem/daLam', JSON.stringify({ bo: { '10001': ['q1'] } })],
    ['mới: lap là mảng, dem là mảng', JSON.stringify({ bo: { '10001': ['q1'] }, lap: ['x'], dem: { '10001': [1, 2] } })],
    ['cũ phẳng sbd → qid[]', JSON.stringify({ '10001': ['q2', 'q4'] })],
    ['mới nhưng thiếu em', JSON.stringify({ bo: { '10002': ['q2'] } })],
    ['phẳng thiếu em', JSON.stringify({ '10002': ['q2'] })],
    ['cột NULL', null],
    ['cột rỗng', ''],
    ['JSON null', 'null'],
  ]
  for (const [ten, cot] of DANG) {
    it(`dạng ${ten}`, async () => {
      const { env, dem } = await dung({ deRieng: cot })
      const truocVong = dem.vong
      const r = await goi(env, '/vao-thi', { maCa: 'C1', sbd: '10001', idThietBi: 'm1' })
      const goc = cot ? (JSON.parse(cot) as Record<string, unknown> | null) : null
      const mong = locGoiDeRiengChoEm(goc, '10001')
      if (cot && goc && !mong) {
        expect(r.j).toMatchObject({ ok: false, lyDo: 'thieu_bo_cau' })
      } else {
        expect(r.j.ok).toBe(true)
        expect(r.j.boTheoEm ?? null).toEqual(mong)
        // biên bản của thầy và bộ câu của bạn khác KHÔNG xuống máy em
        expect(r.txt).not.toContain('biên bản')
        expect(r.txt).not.toContain('"10002"')
        // 1 batch đọc + 1 câu ghi lượt (dạng lạ "JSON null" đọc lại cột ở vòng riêng)
        expect(dem.vong - truocVong).toBe(cot === 'null' ? 3 : 2)
      }
    })
  }
  it('cột hỏng ⇒ lỗi máy chủ như bản cũ (JSON.parse ném), không phát đề sai', async () => {
    const { env } = await dung({ deRieng: '{hỏng' })
    const r = await goi(env, '/vao-thi', { maCa: 'C1', sbd: '10001', idThietBi: 'm1' })
    expect(r.status).toBe(500)
  })
  it('phòng chờ: MỘT batch đọc + MỘT câu ghi phòng chờ; hỏi phòng chờ MỘT câu, không kéo bản đồ', async () => {
    const { env, dem } = await dung({ deRieng: JSON.stringify(GOI_MOI), phongCho: 1 })
    const t = dem.vong
    const r = await goi(env, '/vao-thi', { maCa: 'C1', sbd: '10001', idThietBi: 'm1' })
    expect(r.j).toMatchObject({ ok: true, cach: 'cho' })
    expect(dem.vong - t).toBe(2)
    const t2 = dem.vong
    const p = await goi(env, '/phong-cho?maCa=C1')
    expect(p.j).toMatchObject({ ok: true, phongCho: true, batDau: false, batDauLuc: '', trangThai: 'mo' })
    expect(dem.vong - t2).toBe(1)
  })
  it('cổng danh sách lớp vẫn chặn + ghi sổ chặn', async () => {
    const { d, env } = await dung()
    d.sql.prepare("INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES ('20001','A','2008','12A','x')").run()
    const r = await goi(env, '/vao-thi', { maCa: 'C1', sbd: '10001', idThietBi: 'm1', hoTen: 'Lạ' })
    expect(r.j).toMatchObject({ ok: false, lyDo: 'khong_co_sbd' })
    expect(d.dem('chan_vao', "sbd = '10001'")).toBe(1)
    const ok = await goi(env, '/vao-thi', { maCa: 'C1', sbd: '20001', idThietBi: 'm1' })
    expect(ok.j.ok).toBe(true)
  })
})

describe('/de/:ca — đệm isolate theo (bank_r2, cap_nhat_luc), không đáp án', () => {
  it('300 lượt cùng phiên ⇒ MỘT lượt R2 có thân; đổi đề (đổi cap_nhat_luc) ⇒ đọc lại ngay; If-None-Match ⇒ 304', async () => {
    const { d, env, r2 } = await dung()
    await r2.put('de/C1.json', JSON.stringify(BANK))
    await r2.put('key/C1.json', JSON.stringify(KEY))
    const kq = await Promise.all(Array.from({ length: 30 }, () => goi(env, '/de/C1')))
    for (const k of kq) {
      expect(k.status).toBe(200)
      expect(JSON.parse(k.txt)).toEqual(BANK)
      expect(k.txt).not.toContain('correct')
      expect(k.txt).not.toContain('LG1')
    }
    expect(r2.dem.coThan).toBe(1)
    const etag = kq[0]!.r.headers.get('etag')!
    const k304 = await goi(env, '/de/C1', undefined, { 'if-none-match': etag })
    expect(k304.status).toBe(304)
    // Thầy nối thêm câu (đường ghi đổi R2 rồi đổi cap_nhat_luc)
    const moi = { ...BANK, phanIII: [...BANK.phanIII, { id: 'q5', text: 'Câu 5' }] }
    await r2.put('de/C1.json', JSON.stringify(moi))
    d.sql.prepare("UPDATE ca SET cap_nhat_luc = 'moi-hon' WHERE ma_ca = 'C1'").run()
    const sau = await goi(env, '/de/C1')
    expect(JSON.parse(sau.txt)).toEqual(moi)
  })
})

describe('/nop — một vòng D1, luật cũ giữ nguyên, tờ đáp án luôn mới nhất', () => {
  const DA: AnswerRecord = { phanI: { q1: 'B', q2: 'A' }, phanII: { q3: ['D', 'S', null, 'S'] }, phanIII: { q4: '2,5' } }
  async function vaoVaLam(env: Any, sbd = '10001') {
    const v = await goi(env, '/vao-thi', { maCa: 'C1', sbd, idThietBi: 'm' + sbd })
    expect(v.j.ok).toBe(true)
    const l = await goi(env, '/luu-tam', { maCa: 'C1', sbd, dapAn: { phanI: { q1: 'B' }, phanII: {}, phanIII: {} }, giayCau: { q1: 12 } })
    expect(l.j.ok).toBe(true)
  }
  it('ca thường: MỘT vòng D1; nộp lại ⇒ daNhan cùng giờ nộp, không ghi đè; bài cất đúng từng ô', async () => {
    const { d, env, dem } = await dung()
    await vaoVaLam(env)
    const t = dem.vong
    const n = await goi(env, '/nop', { maCa: 'C1', sbd: '10001', dapAn: DA, giayCau: { q1: 30 }, integrity: { leaveCount: 1, totalHiddenMs: 2400 } })
    expect(n.j).toMatchObject({ ok: true, congBo: 'khong' })
    expect(n.j.keyBank).toBeUndefined()
    expect(dem.vong - t).toBe(1)
    const lai = await goi(env, '/nop', { maCa: 'C1', sbd: '10001', dapAn: { phanI: {}, phanII: {}, phanIII: {} } })
    expect(lai.j).toMatchObject({ ok: true, daNhan: true, nopLuc: n.j.nopLuc })
    const row = d.sql.prepare("SELECT dap_an_json, giay_cau_json, so_lan_roi_man, tong_giay_roi_man, trang_thai FROM luot WHERE sbd = '10001'").get() as Any
    expect(JSON.parse(row.dap_an_json)).toEqual(DA)
    expect(JSON.parse(row.giay_cau_json)).toEqual({ q1: 30 })
    expect(row).toMatchObject({ so_lan_roi_man: 1, tong_giay_roi_man: 2, trang_thai: 'da_nop' })
  })
  it('không có lượt ⇒ khong_tim_thay (y như cũ)', async () => {
    const { env } = await dung()
    const n = await goi(env, '/nop', { maCa: 'C1', sbd: '99999', dapAn: DA })
    expect(n.j).toMatchObject({ ok: false, lyDo: 'khong_tim_thay' })
  })
  it('ca "chỉ nộp phút cuối": còn > 70 s ⇒ 400 và KHÔNG ghi; bị khoá (blocked) ⇒ vẫn nộp được', async () => {
    const { d, env } = await dung({ chiNop: 1 })
    await vaoVaLam(env)
    const n = await goi(env, '/nop', { maCa: 'C1', sbd: '10001', dapAn: DA })
    expect(n.status).toBe(400)
    expect(n.j).toMatchObject({ ok: false, lyDo: 'chua_den_1_phut_cuoi' })
    expect(d.dem('luot', "trang_thai = 'dang_lam'")).toBe(1)
    const k = await goi(env, '/nop', { maCa: 'C1', sbd: '10001', dapAn: DA, integrity: { blocked: true } })
    expect(k.j.ok).toBe(true)
    expect(d.dem('luot', "trang_thai = 'khoa'")).toBe(1)
  })
  it('cờ "chỉ nộp phút cuối" lưu kiểu CHỮ (\'1\') vẫn chặn; cờ \'0\' kiểu chữ vẫn nộp được', async () => {
    const { d, env } = await dung({ chiNop: 1 })
    await vaoVaLam(env)
    d.sql.prepare("UPDATE ca SET chi_nop_3_phut_cuoi = CAST('1' AS TEXT) WHERE ma_ca = 'C1'").run()
    const n = await goi(env, '/nop', { maCa: 'C1', sbd: '10001', dapAn: DA })
    expect(n.j).toMatchObject({ ok: false, lyDo: 'chua_den_1_phut_cuoi' })
    d.sql.prepare("UPDATE ca SET chi_nop_3_phut_cuoi = CAST('0' AS TEXT) WHERE ma_ca = 'C1'").run()
    const ok = await goi(env, '/nop', { maCa: 'C1', sbd: '10001', dapAn: DA })
    expect(ok.j.ok).toBe(true)
  })
  it('ca "chỉ nộp phút cuối": còn ≤ 70 s ⇒ nộp được (hai vòng D1)', async () => {
    const { d, env, dem } = await dung({ chiNop: 1 })
    await vaoVaLam(env)
    d.sql.prepare("UPDATE luot SET het_gio_luc = ? WHERE sbd = '10001'").run(new Date(Date.now() + 60_000).toISOString())
    const t = dem.vong
    const n = await goi(env, '/nop', { maCa: 'C1', sbd: '10001', dapAn: DA })
    expect(n.j.ok).toBe(true)
    expect(dem.vong - t).toBe(2)
    expect(d.dem('luot', "trang_thai = 'da_nop'")).toBe(1)
  })
  it('công bố ngay: tờ đáp án trả SAU nộp, đúng nguyên văn R2; thầy sửa đáp án ⇒ em nộp sau nhận bản MỚI; chấm y hệt', async () => {
    const { d, env, r2 } = await dung({ congBo: 'ngay' })
    await r2.put('key/C1.json', JSON.stringify(KEY))
    await vaoVaLam(env, '10001')
    await vaoVaLam(env, '10002')
    // trước khi nộp: không đường công khai nào của em mang đáp án
    const truoc = await goi(env, '/luu-tam', { maCa: 'C1', sbd: '10002', dapAn: DA })
    expect(truoc.txt).not.toContain('LG1')
    const n1 = await goi(env, '/nop', { maCa: 'C1', sbd: '10001', dapAn: DA, giayCau: { q1: 5 } })
    expect(n1.j.congBo).toBe('ngay')
    expect(n1.j.keyBank).toEqual(KEY)
    expect(typeof n1.j.serverNow).toBe('number')
    const KEY2 = { ...KEY, phanI: [{ ...KEY.phanI[0], correct: 'A' }, KEY.phanI[1]] }
    await r2.put('key/C1.json', JSON.stringify(KEY2))
    const n2 = await goi(env, '/nop', { maCa: 'C1', sbd: '10002', dapAn: DA })
    expect(n2.j.keyBank).toEqual(KEY2)
    // CHẤM Y HỆT: điểm từ bài đã cất (D1) = điểm từ bài máy em gửi, cùng tờ đáp án máy em nhận
    const cat = JSON.parse((d.sql.prepare("SELECT dap_an_json FROM luot WHERE sbd = '10001'").get() as Any).dap_an_json) as AnswerRecord
    const boEm = ['q1', 'q2', 'q3', 'q4']
    const gCat = gradeFromKeyBank(n1.j.keyBank, 'C1', '10001', cat, boEm)
    const gGui = gradeFromKeyBank(KEY as never, 'C1', '10001', DA, boEm)
    expect(gCat.score).toEqual(gGui.score)
    // nộp lại (mất sóng) vẫn nhận tờ đáp án
    const lai = await goi(env, '/nop', { maCa: 'C1', sbd: '10001', dapAn: DA })
    expect(lai.j).toMatchObject({ ok: true, daNhan: true, congBo: 'ngay' })
    expect(lai.j.keyBank).toEqual(KEY2)
  })
  it('công bố ngay mà tờ đáp án hỏng/vắng ⇒ keyBank null (máy em tự hỏi lại), không vỡ phản hồi', async () => {
    const { env, r2 } = await dung({ congBo: 'ngay' })
    await vaoVaLam(env)
    const n = await goi(env, '/nop', { maCa: 'C1', sbd: '10001', dapAn: DA })
    expect(n.j).toMatchObject({ ok: true, congBo: 'ngay', keyBank: null })
    await vaoVaLam(env, '10003')
    await r2.put('key/C1.json', '{hỏng')
    const h = await goi(env, '/nop', { maCa: 'C1', sbd: '10003', dapAn: DA })
    expect(h.j).toMatchObject({ ok: true, congBo: 'ngay', keyBank: null })
  })
})

describe('/cham-diem — gộp batch tiến độ tổng cho ra bảng y như vòng lặp cũ', () => {
  it('tien_do_hs của mỗi em = tổng tien_do_ca theo chuyên đề; điểm lượt đúng từng em', async () => {
    const { d, env } = await dung()
    for (const sbd of ['10001', '10002', '10003']) await goi(env, '/vao-thi', { maCa: 'C1', sbd, idThietBi: 'm' + sbd })
    // ca cũ của 10001 đã có tiến độ ⇒ tổng phải cộng cả hai ca
    d.sql.prepare("INSERT INTO tien_do_ca (khoa, ma_ca, sbd, chuyen_de, so_cau, so_sai, cap_nhat_luc) VALUES ('C0|10001|Ester','C0','10001','Ester',4,1,'x')").run()
    const bai = ['10001', '10002', '10003'].map((sbd, k) => ({
      sbd, lanThu: 1, hoTen: 'Em ' + sbd, diem: { I: k, II: 1, III: 0.5, tong: k + 1.5 },
      cau: [
        { phan: 'I', soCau: 1, qid: 'q1', chuyenDe: 'Ester', mucDo: 'biet', dapAnChon: 'B', dapAnDung: 'B', dungSai: true, giay: 10 },
        { phan: 'I', soCau: 2, qid: 'q2', chuyenDe: 'Amin', mucDo: 'hieu', dapAnChon: 'A', dapAnDung: 'D', dungSai: k === 0, giay: 20 },
        { phan: 'III', soCau: 1, qid: 'q4', chuyenDe: 'Ester', mucDo: 'van_dung', dapAnChon: '2', dapAnDung: '2.5', dungSai: false, giay: 30 },
      ],
    }))
    const r = await goi(env, '/cham-diem', { maCa: 'C1', bai }, { 'x-ma-bi-mat': MAT })
    expect(r.j.ok).toBe(true)
    for (const [k, sbd] of ['10001', '10002', '10003'].entries()) {
      expect(d.sql.prepare('SELECT tong FROM luot WHERE sbd = ?').get(sbd)).toMatchObject({ tong: k + 1.5 })
      const hs = d.sql.prepare('SELECT chuyen_de, so_cau, so_sai FROM tien_do_hs WHERE sbd = ? ORDER BY chuyen_de').all(sbd)
      const mong = d.sql.prepare('SELECT chuyen_de, SUM(so_cau) AS so_cau, SUM(so_sai) AS so_sai FROM tien_do_ca WHERE sbd = ? GROUP BY chuyen_de ORDER BY chuyen_de').all(sbd)
      expect(hs).toEqual(mong)
    }
    expect(d.sql.prepare("SELECT so_cau, so_sai FROM tien_do_hs WHERE sbd = '10001' AND chuyen_de = 'Ester'").get()).toEqual({ so_cau: 6, so_sai: 2 })
  })
})

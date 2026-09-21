// BỘ NÃO — HAI MÃ LỆNH `scripts/bo-nao/{lay,nop}.mjs` + `chung.mjs` (Code 1, 21/09/2026).
// Chạy TRỌN đường: máy chủ GIẢ = lệnh `server/src/bo-nao.ts` thật trên D1 SQLite thật (`_d1-that.ts`), gọi qua `taoGoiMayChu` với `fetch` giả (kiểm cả header mã bí mật).
// Nghiệm thu: AI chỉ thấy bí danh (không SBD/tên) · mã bí mật không lộ ở đâu · chạy lại giữ nguyên bí danh · kiểm khuôn cục bộ loại đúng · nộp nhiều lô · bóng không đổi byte bảng học sinh · CLI thật qua http.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { execFile } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { taoD1That, type D1That } from './_d1-that'
import { boNaoBoDieuChinh, boNaoCauHinh, boNaoDemQua, boNaoHoSoNgay, boNaoNhatKy, boNaoNop } from '../server/src/bo-nao'
import { themNgay } from '../src/lib/bo-nao-dac-trung'
// @ts-expect-error — mã lệnh .mjs không có khai báo kiểu
import { LoiBoNao, capBiDanh, chiaTep, docMaBiMat, giauSbd, homNayVn, laNgay, maBiDanh, ngayChayBu, taoGoiMayChu } from '../scripts/bo-nao/chung.mjs'
// @ts-expect-error
import { chayLay, dongTomTat as dongLay } from '../scripts/bo-nao/lay.mjs'
// @ts-expect-error
import { chayNop, dongTomTat as dongNop, docTheDaLay, docThuMucRa, kiemBanTinCucBo, kiemCacEm } from '../scripts/bo-nao/nop.mjs'

const NGAY = '2026-09-22'
const NOW = Date.parse('2026-09-21T21:00:00.000Z') // 04:00 sáng 22/09 giờ Việt Nam
const MA = 'ma-thu-nghiem-khong-that'
const truoc = (n: number) => themNgay(NGAY, -n)

let d: D1That
let tam: string
let goc: string
beforeEach(() => {
  d = taoD1That()
  tam = mkdtempSync(join(tmpdir(), 'bo-nao-thu-'))
  goc = join(tam, 'bo-nao')
  mkdirSync(goc, { recursive: true })
})
afterEach(() => rmSync(tam, { recursive: true, force: true }))

// ───────────────────────── máy chủ giả ─────────────────────────
type Nhat = { duong: string; than: any }
function mayChuGia() {
  const nhatKy: Nhat[] = []
  const fetchFn = async (url: string, init: { headers: Record<string, string>; body: string }) => {
    const duong = new URL(url).pathname
    if (init.headers['x-ma-bi-mat'] !== MA) return new Response(JSON.stringify({ ok: false, error: 'Không có quyền' }), { status: 403 })
    const than = JSON.parse(init.body)
    nhatKy.push({ duong, than })
    const tra = async () => {
      switch (duong) {
        case '/ai/cau-hinh': return boNaoCauHinh(d.env, than)
        case '/ai/ho-so-ngay': return boNaoHoSoNgay(d.env, than, NOW)
        case '/ai/dieu-chinh/nop': return boNaoNop(d.env, than, NOW)
        case '/ai/dem-qua': return boNaoDemQua(d.env, than, NOW)
        case '/ai/nhat-ky': return boNaoNhatKy(d.env, than)
        case '/ai/dieu-chinh/bo': return boNaoBoDieuChinh(d.env, than)
        default: return { ok: false, error: 'không có lệnh' }
      }
    }
    return new Response(JSON.stringify(await tra()), { status: 200 })
  }
  const goi = taoGoiMayChu({ ma: MA, diaChi: 'https://may-chu.thu', fetchFn, nghi: async () => {} })
  return { goi, nhatKy }
}

// ───────────────────────── dữ liệu mẫu ─────────────────────────
let dem = 0
const themEm = (sbd: string, ten: string, lop = '12A1') => d.sql.exec(`INSERT OR REPLACE INTO hoc_sinh (sbd, ho_ten, lop, trang_thai, cap_nhat_luc) VALUES ('${sbd}', '${ten}', '${lop}', 'da_duyet', '2026-09-01T00:00:00Z')`)
function ngayHoc(sbd: string, nTruoc: number, k: number, dung: number) {
  const ngay = truoc(nTruoc)
  for (let i = 0; i < k; i++) d.sql.exec(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES ('k${++dem}', '${sbd}', 'q${sbd}-${nTruoc}-${i}', 'btvn', 'm', 1, ${i < dung ? 1 : 0}, NULL, '${ngay}T02:00:00.000Z', '${ngay}')`)
}
/** `n` em học đều (thẻ nhanh, một phần thành sâu do xoay vòng), 5 em vắng 4 ngày, 3 em chưa từng học. SBD dạng 20xxx, tên "Học Sinh Thử <số>". */
function dungLop(n = 20) {
  const sbds: string[] = []
  for (let i = 0; i < n; i++) {
    const sbd = `20${String(i).padStart(3, '0')}`
    sbds.push(sbd)
    themEm(sbd, `Học Sinh Thử ${i}`, i % 2 ? '12A1' : '12A2')
    ngayHoc(sbd, 1, 6, 5)
    ngayHoc(sbd, 3, 6, 4)
    ngayHoc(sbd, 5, 6, 5)
  }
  for (let i = 0; i < 5; i++) {
    const sbd = `21${String(i).padStart(3, '0')}`
    sbds.push(sbd)
    themEm(sbd, `Vắng Bốn Ngày ${i}`)
    ngayHoc(sbd, 5, 6, 4)
  }
  for (let i = 0; i < 3; i++) themEm(`22${String(i).padStart(3, '0')}`, `Chưa Học ${i}`)
  // một em đang LÊN rõ (≥ 15 câu/7 ngày, ≥ 85 % đúng, xu hướng lên) ⇒ SBD xuất hiện trong `lop.emNoiLen` của máy chủ (mã lệnh phải đổi sang bí danh)
  themEm('24000', 'Em Nổi Lên'); ngayHoc('24000', 5, 8, 5); ngayHoc('24000', 3, 8, 8); ngayHoc('24000', 1, 8, 8)
  sbds.push('24000')
  return sbds
}
const nkCau = (sbd: string, qid: string, dang: string, lanSai: number, trangThai: string, nTruoc = 1) =>
  d.sql.exec(
    `INSERT INTO nam_kt_cau (khoa, sbd, qid, ma_dang, chuyen_de, lan_gap, lan_sai, lan_trong, dung_lien_tiep, ngay_dung_khac_nhau, ket_qua_cuoi, nguon_cuoi, luc_cuoi, moc_on_ke, trang_thai, can_day_lai, giay_tb, cap_nhat_luc)
     VALUES ('${sbd}|${qid}', '${sbd}', '${qid}', '${dang}', 'CĐ', 2, ${lanSai}, 0, 0, 0, 0, 'btvn', '${truoc(nTruoc)}T02:00:00.000Z', '${truoc(0)}', '${trangThai}', 0, NULL, '${truoc(nTruoc)}T02:00:00.000Z')`,
  )
const suKienSai = (sbd: string, nTruoc: number, qid: string) =>
  d.sql.exec(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES ('k${++dem}', '${sbd}', '${qid}', 'btvn', 'm', 1, 0, NULL, '${truoc(nTruoc)}T02:00:00.000Z', '${truoc(nTruoc)}')`)
/** Em học đều + 3 lần sai lặp cùng dạng `ma` (cả lớp cùng sai). */
function emSaiLapCaLop(sbd: string, ma: string) {
  themEm(sbd, `Em Sai ${sbd}`)
  ngayHoc(sbd, 1, 6, 5)
  for (let i = 0; i < 3; i++) {
    nkCau(sbd, `s${sbd}-${i}`, ma, 1, 'moi_sai')
    suKienSai(sbd, 2 + i, `s${sbd}-${i}`)
  }
}
const tatCaTep = (thuMuc: string, kq: string[] = []): string[] => {
  for (const f of readdirSync(thuMuc)) {
    const p = join(thuMuc, f)
    statSync(p).isDirectory() ? tatCaTep(p, kq) : kq.push(p)
  }
  return kq
}
const docTatCaVao = (ngay = NGAY) => tatCaTep(join(goc, ngay, 'vao')).flatMap((f) => JSON.parse(readFileSync(f, 'utf8')) as any[])
/** Phần tử `ra` hợp lệ tối thiểu cho một em (lời nhắn KHÔNG có chữ số ⇒ không bao giờ có số lạ). */
const raHopLe = (biDanh: string, o: Record<string, unknown> = {}) => ({
  biDanh,
  doTinCay: 0.8,
  nhip: { lech: 0, khoiDong: 2 },
  dang: [],
  khacPhuc: [],
  co: 'khong',
  loiNhanChoEm: 'Hôm qua em đã mở bài và làm việc đều đặn. Mai mình giữ nhịp như vậy nhé.',
  loiNhanChoPhuHuynh: '',
  thuTuan: '',
  goiYChoThay: { chu: '', hanhDong: 'khong', dang: '' },
  ghiChuHlv: '',
  canSau: false,
  ...o,
})
const ghiRa = (ten: string, noiDung: unknown, ngay = NGAY) => {
  mkdirSync(join(goc, ngay, 'ra'), { recursive: true })
  writeFileSync(join(goc, ngay, 'ra', ten), typeof noiDung === 'string' ? noiDung : JSON.stringify(noiDung))
}
const BANG_HOC_SINH = ['ke_hoach_ngay', 'btvn', 'btvn_em', 'su_kien_hoc', 'nam_kt_cau', 'nam_kt_dang', 'exp_so', 'hoc_sinh']

// ───────────────────────── chung.mjs ─────────────────────────
describe('mã bí mật + gọi máy chủ', () => {
  it('đọc mã từ tệp: cắt khoảng trắng; thiếu tệp / rỗng ⇒ LoiBoNao bằng lời (mã thoát 2), KHÔNG in mã; cảnh báo quyền khi tệp mở cho người khác', () => {
    const t = join(tam, 'ma')
    mkdirSync(t)
    expect(() => docMaBiMat(t)).toThrowError(/Chưa có tệp mã bí mật/)
    try { docMaBiMat(t) } catch (e: any) { expect(e).toBeInstanceOf(LoiBoNao); expect(e.maThoat).toBe(2) }
    writeFileSync(join(t, 'ma-bi-mat'), '  \n')
    expect(() => docMaBiMat(t)).toThrowError(/đang rỗng/)
    writeFileSync(join(t, 'ma-bi-mat'), `  ${MA}\n`, { mode: 0o644 })
    chmodSync(join(t, 'ma-bi-mat'), 0o644)
    const r = docMaBiMat(t)
    expect(r.ma).toBe(MA)
    expect(r.canhBao).toContain('chmod 600')
    expect(r.canhBao).not.toContain(MA)
    chmodSync(join(t, 'ma-bi-mat'), 0o600)
    expect(docMaBiMat(t).canhBao).toBe('')
  })
  it('gửi mã bằng HEADER x-ma-bi-mat (không nằm trong thân); từ chối địa chỉ không https (trừ localhost); mã sai ⇒ nói thẳng bị từ chối, không lộ mã', async () => {
    const thay: { h?: Record<string, string>; b?: string } = {}
    const f = async (_u: string, init: any) => { thay.h = init.headers; thay.b = init.body; return new Response('{"ok":true}') }
    await taoGoiMayChu({ ma: MA, diaChi: 'https://x.thu', fetchFn: f })('/ai/dem-qua', { a: 1 })
    expect(thay.h!['x-ma-bi-mat']).toBe(MA)
    expect(thay.b).toBe('{"a":1}')
    expect(() => taoGoiMayChu({ ma: MA, diaChi: 'http://may-chu.thu' })).toThrowError(/https/)
    expect(() => taoGoiMayChu({ ma: MA, diaChi: 'http://localhost:8787' })).not.toThrow()
    expect(() => taoGoiMayChu({ ma: MA, diaChi: 'http://127.0.0.1:8787' })).not.toThrow()
    expect(() => taoGoiMayChu({ ma: '' })).toThrowError(/Thiếu mã/)
    const sai = taoGoiMayChu({ ma: 'mã-sai', diaChi: 'https://x.thu', fetchFn: async () => new Response('{}', { status: 403 }) })
    await expect(sai('/ai/dem-qua')).rejects.toThrowError(/từ chối mã bí mật/)
    await sai('/ai/dem-qua').catch((e) => expect(String(e.message)).not.toContain('mã-sai'))
  })
  it('thử lại khi mạng lỗi / 5xx / 429 (tối đa 3 lần), rồi báo bằng lời; ok:false ⇒ lỗi máy chủ; không phải JSON ⇒ lỗi rõ', async () => {
    let lan = 0
    const nghi: number[] = []
    const f = async () => { lan++; if (lan < 3) throw new Error('ECONNRESET secret-in-error'); return new Response('{"ok":true,"x":1}') }
    expect(await taoGoiMayChu({ ma: MA, diaChi: 'https://x.thu', fetchFn: f as any, nghi: async (ms: number) => void nghi.push(ms) })('/p')).toEqual({ ok: true, x: 1 })
    expect(lan).toBe(3)
    expect(nghi).toEqual([1500, 3000])
    const hong = taoGoiMayChu({ ma: MA, diaChi: 'https://x.thu', fetchFn: (async () => new Response('', { status: 503 })) as any, nghi: async () => {} })
    await expect(hong('/p')).rejects.toThrowError(/không được sau 3 lần: máy chủ báo lỗi tạm thời \(mã 503\)/)
    const mang = taoGoiMayChu({ ma: MA, diaChi: 'https://x.thu', fetchFn: (async () => { throw new Error('boom') }) as any, nghi: async () => {} })
    await mang('/p').catch((e) => { expect(e.message).toContain('không nối được máy chủ'); expect(e.message).not.toContain('boom') })
    await expect(taoGoiMayChu({ ma: MA, diaChi: 'https://x.thu', fetchFn: (async () => new Response('{"ok":false,"error":"Bộ não đang tắt"}')) as any })('/p')).rejects.toThrowError('Máy chủ báo lỗi ở /p: Bộ não đang tắt')
    await expect(taoGoiMayChu({ ma: MA, diaChi: 'https://x.thu', fetchFn: (async () => new Response('<html>')) as any })('/p')).rejects.toThrowError(/không phải JSON/)
  })
})

describe('bí danh', () => {
  const rngCoDinh = (mau: number[]) => { let i = 0; return (n: number) => mau[i++ % mau.length] % n }
  it('mỗi SBD một bí danh Exxx duy nhất; đảo ngược đúng; thứ tự KHÔNG theo SBD (ngẫu nhiên)', () => {
    const sbds = Array.from({ length: 50 }, (_, i) => `1${String(i).padStart(4, '0')}`)
    const { bang, dao } = capBiDanh(sbds, {}, rngCoDinh([7, 3, 11, 2, 19, 5]))
    expect(Object.keys(bang)).toHaveLength(50)
    expect(new Set(Object.keys(bang)).size).toBe(50)
    for (const b of Object.keys(bang)) expect(b).toMatch(/^E\d{3}$/)
    for (const [s, b] of dao) expect(bang[b]).toBe(s)
    const theoSbd = sbds.map((s) => dao.get(s)!)
    expect(theoSbd).not.toEqual([...theoSbd].sort()) // không lộ thứ tự SBD
    expect(new Set(Object.keys(bang))).toEqual(new Set(Array.from({ length: 50 }, (_, i) => maBiDanh(i + 1))))
  })
  it('CHẠY LẠI giữ nguyên bí danh em cũ; em mới nhận số chưa dùng; không trùng; > 999 em vẫn được', () => {
    const a = capBiDanh(['1', '2', '3'], {}, rngCoDinh([1, 0]))
    const b = capBiDanh(['3', '1', '2', '4', '5'], a.bang, rngCoDinh([0, 1, 0]))
    for (const s of ['1', '2', '3']) expect(b.dao.get(s)).toBe(a.dao.get(s))
    expect(new Set(Object.values(b.bang))).toEqual(new Set(['1', '2', '3', '4', '5']))
    expect(new Set(Object.keys(b.bang)).size).toBe(5)
    const nhieu = capBiDanh(Array.from({ length: 1200 }, (_, i) => `s${i}`), {}, () => 0)
    expect(new Set(Object.keys(nhieu.bang)).size).toBe(1200)
    expect(maBiDanh(1000)).toBe('E1000')
  })
  it('giauSbd thay MỌI SBD trong chuỗi; chiaTep chia đúng; laNgay / homNayVn / ngayChayBu', () => {
    expect(giauSbd('em 20001 và 20002 và 20001', new Map([['20001', 'E001'], ['20002', 'E002']]))).toBe('em E001 và E002 và E001')
    expect(chiaTep([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chiaTep([], 3)).toEqual([])
    expect(laNgay('2026-09-22')).toBe(true)
    for (const x of ['2026-9-22', '2026-02-30', '22/09/2026', '', null, 5]) expect(laNgay(x), String(x)).toBe(false)
    expect(homNayVn(NOW)).toBe('2026-09-22')
    expect(homNayVn(Date.parse('2026-09-21T16:59:59Z'))).toBe('2026-09-21')
    expect(homNayVn(Date.parse('2026-09-21T17:00:00Z'))).toBe('2026-09-22')
    expect(ngayChayBu(null, NGAY)).toEqual([])
    expect(ngayChayBu({ nopNgay: '2026-09-21' }, NGAY)).toEqual([])
    expect(ngayChayBu({ nopNgay: '2026-09-18' }, NGAY)).toEqual(['2026-09-19', '2026-09-20', '2026-09-21'])
    expect(ngayChayBu({ nopNgay: '2026-09-10' }, NGAY)).toEqual(['2026-09-19', '2026-09-20', '2026-09-21']) // tối đa 3 ngày gần nhất
  })
})

// ───────────────────────── lay.mjs ─────────────────────────
describe('lay.mjs — lấy dữ liệu đêm', () => {
  it('CHỐT LUỒNG CẢ LỚP: 20/30 em cùng sai lặp một dạng ⇒ lop.json có dangCaLopYeu MỘT lần, sâu ≤ 25 % (7/30), em bị nhường chỗ nằm ở tệp nhanh (không còn hoSo)', async () => {
    for (let i = 0; i < 20; i++) emSaiLapCaLop(`50${String(i).padStart(3, '0')}`, 'DON.CHAT.NITROGEN')
    for (let i = 0; i < 10; i++) { themEm(`51${String(i).padStart(3, '0')}`, `Em thường ${i}`); ngayHoc(`51${String(i).padStart(3, '0')}`, 1, 6, 5) }
    const { goi } = mayChuGia()
    const kq = await chayLay({ ngay: NGAY, goc, goi, bayGio: NOW })
    expect(kq.dem.soEmCoThe).toBe(30)
    expect(kq.dem.sau).toBeLessThanOrEqual(7)
    expect(kq.dem.sau + kq.dem.nhanh).toBe(30)
    const lop = JSON.parse(readFileSync(join(goc, NGAY, 'lop.json'), 'utf8')).lop
    expect(lop.dangCaLopYeu).toEqual([{ ma: 'DON.CHAT.NITROGEN', soEm: 20, phanTram: 67, tongSai: 60 }])
    const vao = docTatCaVao()
    expect(vao.filter((e) => e.luong === 'sau')).toHaveLength(kq.dem.sau)
    expect(vao.filter((e) => e.luong === 'nhanh').every((e) => !('hoSo' in e))).toBe(true)
    // các em còn ở sâu KHÔNG vì dạng cả lớp
    for (const e of vao.filter((x) => x.luong === 'sau')) expect(e.lyDoLuong).toEqual(['tới lượt soi kỹ xoay vòng hằng tuần'])
    expect(dongLay(kq).join('\n')).toContain('sâu ' + kq.dem.sau)
  })
  it('NÉN: thẻ nhanh ≤ 1,2 KB, hồ sơ sâu ≤ 3 KB, thẻ vắng ≤ 0,4 KB (byte); vao/ không có null / mảng rỗng / ngay; `.the-day-du.json` giữ thẻ ĐẦY ĐỦ (quyền 600)', async () => {
    dungLop(20)
    const { goi } = mayChuGia()
    await chayLay({ ngay: NGAY, goc, goi, bayGio: NOW })
    const vao = docTatCaVao()
    const kich = (x: unknown) => Buffer.byteLength(JSON.stringify(x), 'utf8')
    for (const e of vao) {
      if (e.luong === 'nhanh') expect(kich(e), e.biDanh).toBeLessThanOrEqual(1300) // thẻ 1,2 KB + biDanh/luong
      if (e.luong === 'sau') expect(kich(e), e.biDanh).toBeLessThanOrEqual(3100)
      if (e.luong === 'vang') expect(kich(e), e.biDanh).toBeLessThanOrEqual(450)
      expect(JSON.stringify(e)).not.toMatch(/:null|:\[\]|:\{\}|:false/)
      expect(e.the.ngay).toBeUndefined()
      if (e.luong === 'vang') expect(e.lyDoLuong).toBeUndefined()
    }
    const t = join(goc, NGAY, '.the-day-du.json')
    expect(statSync(t).mode & 0o777).toBe(0o600)
    const dayDu = JSON.parse(readFileSync(t, 'utf8'))
    const bd = JSON.parse(readFileSync(join(goc, NGAY, '.bi-danh.json'), 'utf8')).bang as Record<string, string>
    expect(Object.keys(dayDu.the).sort()).toEqual(Object.keys(bd).sort()) // đủ mọi em có thẻ
    const mot = Object.values(dayDu.the)[0] as Record<string, unknown>
    expect(mot.ngay).toBe(NGAY) // thẻ đầy đủ còn `ngay`, `luotSoiKyTuan`… mà kiểm khuôn cần
    expect(mot).toHaveProperty('luotSoiKyTuan')
    expect(mot).toHaveProperty('khiNaoVietPhuHuynh')
  })
  it('ghi đúng bố cục: lop.json, vao/{nhanh,sau,vang}, ra/, .bi-danh.json (600), tom-tat.json; đếm khớp máy chủ', async () => {
    const sbds = dungLop(20)
    const { goi, nhatKy } = mayChuGia()
    const kq = await chayLay({ ngay: NGAY, goc, goi, bayGio: NOW })
    expect(kq.dem).toMatchObject({ soEmCoThe: 26, vang: 5, boQua: 3 })
    expect(kq.dem.nhanh + kq.dem.sau).toBe(21)
    const t = join(goc, NGAY)
    for (const f of ['lop.json', 'tom-tat.json', '.bi-danh.json', 'vao', 'ra']) expect(existsSync(join(t, f)), f).toBe(true)
    expect(statSync(join(t, '.bi-danh.json')).mode & 0o777).toBe(0o600)
    expect(readdirSync(join(t, 'ra'))).toEqual([]) // để trống cho AI
    expect(readdirSync(join(t, 'vao')).sort()).toEqual(expect.arrayContaining(['vang.json']))
    const vao = docTatCaVao()
    expect(vao).toHaveLength(26)
    expect(vao.filter((e) => e.luong === 'vang')).toHaveLength(5)
    expect(vao.filter((e) => e.luong === 'sau').every((e) => e.hoSo && Array.isArray(e.lyDoLuong))).toBe(true)
    expect(vao.filter((e) => e.luong === 'nhanh').every((e) => !('hoSo' in e))).toBe(true)
    // bảng bí danh phủ đúng 26 SBD có thẻ, không có em bỏ qua
    const bd = JSON.parse(readFileSync(join(t, '.bi-danh.json'), 'utf8'))
    expect(bd.ngay).toBe(NGAY)
    expect(new Set(Object.values(bd.bang))).toEqual(new Set([...sbds.slice(0, 25), '24000']))
    // gọi máy chủ: cấu hình, đủ trang (26 em có thẻ + 3 bỏ qua = 29 ≤ 40 ⇒ 1 trang), bức tranh lớp
    expect(nhatKy.map((x) => x.duong)).toEqual(['/ai/cau-hinh', '/ai/ho-so-ngay', '/ai/ho-so-ngay'])
    expect(nhatKy[1].than).toEqual({ ngay: NGAY, trang: 1, coTrang: 40 })
    expect(nhatKy[2].than).toEqual({ ngay: NGAY, phan: 'lop' })
    expect(JSON.parse(readFileSync(join(t, 'tom-tat.json'), 'utf8'))).toMatchObject({ ngay: NGAY, soEmCoThe: 26 })
  })
  it('AI KHÔNG thấy SBD hay tên: mọi tệp trừ .bi-danh.json sạch; lời in ra sạch; bức tranh lớp dùng bí danh', async () => {
    const sbds = dungLop(20)
    const { goi } = mayChuGia()
    const kq = await chayLay({ ngay: NGAY, goc, goi, bayGio: NOW })
    const tep = tatCaTep(join(goc, NGAY)).filter((f) => !f.endsWith('.bi-danh.json'))
    expect(tep.length).toBeGreaterThan(3)
    const noiDung = [...tep.map((f) => readFileSync(f, 'utf8')), ...dongLay(kq)].join('\n')
    for (const s of sbds) expect(noiDung, `SBD ${s}`).not.toContain(s)
    expect(noiDung).not.toMatch(/Học Sinh Thử|Vắng Bốn Ngày|Chưa Học|12A1|12A2/)
    expect(noiDung).not.toContain(MA)
    const noiLen = JSON.parse(readFileSync(join(goc, NGAY, 'lop.json'), 'utf8')).lop.emNoiLen as string[]
    expect(noiLen.length).toBeGreaterThan(0) // có em nổi lên thật ⇒ kiểm không rỗng
    expect(noiLen.every((b) => /^E\d{3}$/.test(b))).toBe(true)
  })
  it('CHIA TỆP: ≤ 40 thẻ nhanh/tệp, ≤ 12 hồ sơ sâu/tệp, vắng > 40 tách nhiều tệp; nhiều trang máy chủ được gộp đủ', async () => {
    const sbds = dungLop(95)
    for (let i = 5; i < 50; i++) { const sbd = `21${String(i).padStart(3, '0')}`; sbds.push(sbd); themEm(sbd, `Vắng ${i}`); ngayHoc(sbd, 5, 6, 4) } // tổng 50 em vắng (5 + 45)
    const { goi, nhatKy } = mayChuGia()
    const kq = await chayLay({ ngay: NGAY, goc, goi, bayGio: NOW })
    expect(nhatKy.filter((x) => x.duong === '/ai/ho-so-ngay' && x.than.trang).length).toBeGreaterThanOrEqual(3)
    const vao = join(goc, NGAY, 'vao')
    for (const f of readdirSync(vao)) {
      const n = (JSON.parse(readFileSync(join(vao, f), 'utf8')) as unknown[]).length
      if (f.startsWith('nhanh-')) expect(n, f).toBeLessThanOrEqual(40)
      if (f.startsWith('sau-')) expect(n, f).toBeLessThanOrEqual(12)
      if (f.startsWith('vang')) expect(n, f).toBeLessThanOrEqual(40)
    }
    expect(readdirSync(vao).filter((f) => f.startsWith('vang-')).length).toBe(2) // 50 em vắng ⇒ 2 tệp (40 + 10)
    expect(readdirSync(vao)).not.toContain('vang.json')
    expect(kq.dem.soEmCoThe).toBe(96 + 50)
    expect(docTatCaVao()).toHaveLength(146)
    expect(kq.dem.tep.sau).toBe(Math.ceil(kq.dem.sau / 12))
    expect(kq.dem.sau).toBeGreaterThan(0)
  })
  it('CHẠY LẠI cùng ngày: bí danh em cũ giữ nguyên (tệp ra đã viết còn khớp); tệp vao cũ được dọn, ra/ không bị đụng', async () => {
    dungLop(20)
    const { goi } = mayChuGia()
    await chayLay({ ngay: NGAY, goc, goi, bayGio: NOW })
    const truocBd = readFileSync(join(goc, NGAY, '.bi-danh.json'), 'utf8')
    writeFileSync(join(goc, NGAY, 'ra', 'nhanh-01.json'), '[]')
    writeFileSync(join(goc, NGAY, 'vao', 'thua.json'), '[]')
    themEm('23000', 'Em Mới'); ngayHoc('23000', 1, 6, 5)
    await chayLay({ ngay: NGAY, goc, goi, bayGio: NOW })
    const sau = JSON.parse(readFileSync(join(goc, NGAY, '.bi-danh.json'), 'utf8'))
    const cu = JSON.parse(truocBd)
    for (const [b, s] of Object.entries(cu.bang)) expect(sau.bang[b]).toBe(s)
    expect(Object.keys(sau.bang)).toHaveLength(Object.keys(cu.bang).length + 1)
    expect(existsSync(join(goc, NGAY, 'ra', 'nhanh-01.json'))).toBe(true)
    expect(existsSync(join(goc, NGAY, 'vao', 'thua.json'))).toBe(false)
  })
  it('đang TẮT (bat:false) ⇒ dừng bằng lời (mã 4), không tạo thư mục; lỗi máy chủ ⇒ LoiBoNao; không có em nào ⇒ vẫn ghi thư mục và nhắc "ghi bao-cao.md rồi dừng"', async () => {
    const { goi } = mayChuGia()
    await boNaoCauHinh(d.env, { bat: false })
    const loi = await chayLay({ ngay: NGAY, goc, goi }).catch((e) => e)
    expect(loi).toBeInstanceOf(LoiBoNao)
    expect(loi.maThoat).toBe(4)
    expect(existsSync(join(goc, NGAY))).toBe(false)
    await boNaoCauHinh(d.env, { bat: true })
    const kq = await chayLay({ ngay: NGAY, goc, goi, bayGio: NOW })
    expect(kq.dem.soEmCoThe).toBe(0)
    expect(dongLay(kq).join('\n')).toContain('bao-cao.md')
    expect(readdirSync(join(goc, NGAY, 'vao'))).toEqual([])
  })
  it('CHẠY BÙ: đã nộp ngày cũ, lỡ vài đêm ⇒ dòng lưu ý liệt kê ngày lỡ (tối đa 3)', async () => {
    dungLop(20)
    writeFileSync(join(goc, 'lan-cuoi.json'), JSON.stringify({ nopNgay: '2026-09-19' }))
    const { goi } = mayChuGia()
    const kq = await chayLay({ ngay: NGAY, goc, goi, bayGio: NOW })
    expect(kq.chayBu).toEqual(['2026-09-20', '2026-09-21'])
    expect(dongLay(kq).join('\n')).toContain('2026-09-20, 2026-09-21')
    expect(JSON.parse(readFileSync(join(goc, 'lan-cuoi.json'), 'utf8'))).toMatchObject({ nopNgay: '2026-09-19', layNgay: NGAY })
  })
})

// ───────────────────────── nop.mjs ─────────────────────────
describe('nop.mjs — kiểm khuôn, đổi bí danh, nộp', () => {
  /** Lấy dữ liệu rồi trả bí danh của các em nhanh/sâu/vắng để viết `ra`. */
  async function layXong(soEm = 20) {
    const sbds = dungLop(soEm)
    const may = mayChuGia()
    await chayLay({ ngay: NGAY, goc, goi: may.goi, bayGio: NOW })
    const vao = docTatCaVao()
    return { ...may, sbds, vao, biDanhCoHoatDong: vao.filter((e) => e.luong !== 'vang').map((e) => e.biDanh as string), bd: JSON.parse(readFileSync(join(goc, NGAY, '.bi-danh.json'), 'utf8')).bang as Record<string, string> }
  }

  it('nộp trọn đường: SBD (không phải bí danh) tới máy chủ; điều chỉnh lưu ở chế độ BÓNG (ap_dung 0); bảng học sinh KHÔNG đổi một byte; tóm tắt không có SBD', async () => {
    const { goi, nhatKy, biDanhCoHoatDong, bd, sbds } = await layXong()
    const truocBang = BANG_HOC_SINH.map((b) => d.chup(b))
    ghiRa('nhanh-01.json', biDanhCoHoatDong.map((b) => raHopLe(b)))
    const kq = await chayNop({ ngay: NGAY, goc, goi, bayGio: NOW })
    expect(kq).toMatchObject({ soPhanTu: 21, nhan: 21, chiGhiSo: 21, soApDung: 0, biLoaiCucBo: 0, biLoaiMayChu: 0 })
    const guiNop = nhatKy.find((x) => x.duong === '/ai/dieu-chinh/nop')!
    expect(guiNop.than.cacEm).toHaveLength(21)
    expect(guiNop.than.cacEm.every((e: any) => /^2[04]\d{3}$/.test(e.sbd) && !('biDanh' in e))).toBe(true)
    expect(new Set(guiNop.than.cacEm.map((e: any) => e.sbd))).toEqual(new Set(biDanhCoHoatDong.map((b) => bd[b])))
    expect(d.dem('ai_dieu_chinh', "che_do = 'bong' AND ap_dung = 0")).toBe(21)
    expect(BANG_HOC_SINH.map((b) => d.chup(b))).toEqual(truocBang)
    const noiDung = [...tatCaTep(join(goc, NGAY)).filter((f) => !f.endsWith('.bi-danh.json')).map((f) => readFileSync(f, 'utf8')), ...dongNop(kq)].join('\n')
    for (const s of sbds) expect(noiDung, `SBD ${s}`).not.toContain(s)
    expect(noiDung).not.toContain(MA)
    expect(JSON.parse(readFileSync(join(goc, 'lan-cuoi.json'), 'utf8')).nopNgay).toBe(NGAY)
    expect(JSON.parse(readFileSync(join(goc, NGAY, 'nop-ket-qua.json'), 'utf8'))).toMatchObject({ nhan: 21, biLoaiCucBo: 0 })
  })
  it('KIỂM KHUÔN CỤC BỘ: loại đúng (bí danh lạ, trùng em, số không có trong thẻ, từ cấm, biên độ) kèm lý do, KHÔNG gọi máy chủ cho phần tử bị loại; phần hợp lệ vẫn đi', async () => {
    const { goi, nhatKy, biDanhCoHoatDong } = await layXong()
    const [a, b, c, e] = biDanhCoHoatDong
    ghiRa('nhanh-01.json', [
      raHopLe(a),
      raHopLe(b, { loiNhanChoEm: 'Hôm qua em đúng 99 câu, giỏi lắm.' }),
      raHopLe(c, { nhip: { lech: 5, khoiDong: 2 } }),
      raHopLe('E999'),
      raHopLe(a, { loiNhanChoEm: 'Phần tử trùng em.' }),
      raHopLe(e, { loiNhanChoEm: 'Em còn yếu ở phần này.' }),
      'không phải đối tượng',
      { khongCoBiDanh: true },
    ])
    const kq = await chayNop({ ngay: NGAY, goc, goi, bayGio: NOW })
    expect(kq).toMatchObject({ soPhanTu: 8, nhan: 1, biLoaiCucBo: 7, biLoaiMayChu: 0 })
    const lyDo = (bd: string) => kq.loai.filter((l: any) => l.biDanh === bd).map((l: any) => l.lyDo.join(' | ')).join(' || ')
    expect(lyDo(b)).toContain('số không có trong thẻ: 99')
    expect(lyDo(c)).toContain('nhip.lech')
    expect(lyDo('E999')).toContain('không có trong dữ liệu đêm')
    expect(lyDo(a)).toContain('trùng em')
    expect(lyDo(e)).toContain('từ cấm')
    expect(kq.loai.filter((l: any) => l.biDanh === '?')).toHaveLength(2) // hai phần tử không có bí danh
    const guiNop = nhatKy.filter((x) => x.duong === '/ai/dieu-chinh/nop')
    expect(guiNop).toHaveLength(1)
    expect(guiNop[0].than.cacEm).toHaveLength(1)
    expect(d.dem('ai_dieu_chinh')).toBe(1)
    const dong = dongNop(kq).join('\n')
    expect(dong).toContain('nhận 1/8')
    expect(dong).toContain('loại 7')
  })
  it('IN ÍT: tối đa 10 dòng lý do, phần còn lại chỉ đếm và chỉ sang nop-ket-qua.json (đầy đủ)', async () => {
    const { goi, biDanhCoHoatDong } = await layXong()
    ghiRa('nhanh-01.json', biDanhCoHoatDong.slice(0, 16).map((b) => raHopLe(b, { doTinCay: 9 })))
    const kq = await chayNop({ ngay: NGAY, goc, goi, bayGio: NOW })
    const dong = dongNop(kq)
    expect(kq.biLoaiCucBo).toBe(16)
    expect(dong).toHaveLength(1 + 10 + 1)
    expect(dong[dong.length - 1]).toContain('và 7 dòng nữa') // 16 phần tử bị loại + 1 ghi chú "chưa có ra/lop.json" = 17 dòng, in 10
    expect(JSON.parse(readFileSync(join(goc, NGAY, 'nop-ket-qua.json'), 'utf8')).loai).toHaveLength(16)
  })
  it('tệp ra hỏng: JSON sai / không phải mảng ⇒ báo TÊN TỆP và lý do, các tệp khác vẫn nộp; hỗ trợ {"cacEm":[…]}; không có tệp nào ⇒ mã 6', async () => {
    const { goi, biDanhCoHoatDong } = await layXong()
    const nghi = await chayNop({ ngay: NGAY, goc, goi }).catch((e) => e)
    expect(nghi).toBeInstanceOf(LoiBoNao)
    expect(nghi.maThoat).toBe(6)
    ghiRa('a-hong.json', '{ không phải json')
    ghiRa('b-khong-mang.json', { x: 1 })
    ghiRa('c-bao-boc.json', { cacEm: [raHopLe(biDanhCoHoatDong[0])] })
    ghiRa('ghi-chu.txt', 'bỏ qua tệp không phải .json')
    const kq = await chayNop({ ngay: NGAY, goc, goi, bayGio: NOW })
    expect(kq.nhan).toBe(1)
    expect(kq.loiTep.join('\n')).toMatch(/a-hong\.json: không phải JSON hợp lệ/)
    expect(kq.loiTep.join('\n')).toMatch(/b-khong-mang\.json: cần MẢNG/)
    expect(kq.loiTep.join('\n')).not.toContain('ghi-chu')
    expect(docThuMucRa(join(goc, NGAY, 'ra')).phanTu).toHaveLength(1)
  })
  it('chưa lấy dữ liệu (thiếu .bi-danh.json) ⇒ mã 5 và chỉ đường chạy lay.mjs; bảng của ngày khác không dùng nhầm', async () => {
    const { goi } = mayChuGia()
    const l = await chayNop({ ngay: NGAY, goc, goi }).catch((e) => e)
    expect(l).toBeInstanceOf(LoiBoNao)
    expect(l.maThoat).toBe(5)
    expect(l.message).toContain(`lay.mjs ${NGAY}`)
    mkdirSync(join(goc, NGAY), { recursive: true })
    writeFileSync(join(goc, NGAY, '.bi-danh.json'), JSON.stringify({ ngay: '2026-01-01', bang: { E001: '20000' } }))
    expect(((await chayNop({ ngay: NGAY, goc, goi }).catch((e) => e)) as LoiBoNao).maThoat).toBe(5)
  })
  it('BẢN TIN: từng dòng được kiểm (dòng sai chỉ bỏ dòng đó, báo số dòng); bí danh → SBD cho máy chủ ghép tên; > 6 dòng chỉ nhận 6; số bịa bị bỏ', async () => {
    const { goi, nhatKy, biDanhCoHoatDong, bd } = await layXong()
    const em = biDanhCoHoatDong[0]
    const dong = (o: Record<string, unknown> = {}) => ({ loai: 'ca_lop', biDanh: '', chu: 'Đêm nay có 5 em vắng nhiều ngày', hanhDong: 'khong', dang: '', ...o })
    ghiRa('nhanh-01.json', [raHopLe(em)])
    ghiRa('lop.json', { cacDong: [dong(), dong({ chu: 'Có 77 em cần chú ý' }), dong({ loai: 'can_thay_y', biDanh: em, chu: 'Có 5 em vắng lâu', hanhDong: 'xem_ho_so' }), dong({ biDanh: 'E999' }), 'rác'] })
    const kq = await chayNop({ ngay: NGAY, goc, goi, bayGio: NOW })
    expect(kq.loiTep).toEqual([]) // lop.json là bản tin, KHÔNG bị đọc như tệp kết quả từng em
    expect(kq.banTin.nhan).toBe(2)
    expect(kq.banTin.loi.join('\n')).toMatch(/bản tin dòng 2: số không có trong số liệu lớp: 77/)
    expect(kq.banTin.loi.join('\n')).toMatch(/bản tin dòng 4: biDanh không có trong dữ liệu đêm/)
    expect(kq.banTin.loi.join('\n')).toMatch(/bản tin dòng 5:/)
    const guiNop = nhatKy.find((x) => x.duong === '/ai/dieu-chinh/nop')!
    expect(guiNop.than.banTin.cacDong).toEqual([
      { loai: 'ca_lop', chu: 'Đêm nay có 5 em vắng nhiều ngày', hanhDong: 'khong', dang: '', sbd: '' },
      { loai: 'can_thay_y', chu: 'Có 5 em vắng lâu', hanhDong: 'xem_ho_so', dang: '', sbd: bd[em] },
    ])
    const dq = (await boNaoDemQua(d.env, {}, NOW)) as any
    expect(dq.banTin.cacDong).toHaveLength(2)
    expect(dq.banTin.cacDong[1].hoTen).toMatch(/^(Học Sinh Thử \d+|Em Nổi Lên)$/) // máy chủ ghép tên từ SBD
    // > 6 dòng
    ghiRa('lop.json', { cacDong: Array.from({ length: 8 }, () => dong()) })
    const kq2 = await chayNop({ ngay: NGAY, goc, goi, bayGio: NOW })
    expect(kq2.banTin.nhan).toBe(6)
    expect(kq2.banTin.loi.join('\n')).toContain('chỉ nhận 6 dòng đầu')
  })
  it('thiếu ra/lop.json ⇒ vẫn nộp điều chỉnh, ghi chú "chưa có ra/lop.json"; lop.json hỏng ⇒ báo, không nộp bản tin', async () => {
    const { goi, biDanhCoHoatDong } = await layXong()
    ghiRa('nhanh-01.json', [raHopLe(biDanhCoHoatDong[0])])
    const kq = await chayNop({ ngay: NGAY, goc, goi, bayGio: NOW })
    expect(kq.nhan).toBe(1)
    expect(kq.banTin.nhan).toBe(0)
    expect(kq.loiTep.join('\n')).toContain('chưa có ra/lop.json')
    ghiRa('lop.json', '{hỏng')
    expect((await chayNop({ ngay: NGAY, goc, goi, bayGio: NOW })).loiTep.join('\n')).toContain('không phải JSON hợp lệ')
    ghiRa('lop.json', { khac: 1 })
    expect((await chayNop({ ngay: NGAY, goc, goi, bayGio: NOW })).loiTep.join('\n')).toContain('{"cacDong":[…]}')
    expect(d.dem('ai_ban_tin')).toBe(0)
  })
  it('NHIỀU LÔ: 130 em ⇒ hai lượt gọi (≤ 100 em/lượt), bản tin đi cùng lượt CUỐI; số "đã hỗ trợ" của bản tin đếm đủ 130', async () => {
    const { goi, nhatKy, biDanhCoHoatDong } = await layXong(140)
    expect(biDanhCoHoatDong.length).toBeGreaterThanOrEqual(130)
    ghiRa('nhanh-01.json', biDanhCoHoatDong.slice(0, 130).map((b) => raHopLe(b)))
    ghiRa('lop.json', { cacDong: [{ loai: 'ca_lop', biDanh: '', chu: 'Đêm nay có 5 em vắng nhiều ngày', hanhDong: 'khong', dang: '' }] })
    const kq = await chayNop({ ngay: NGAY, goc, goi, bayGio: NOW })
    const guiNop = nhatKy.filter((x) => x.duong === '/ai/dieu-chinh/nop')
    expect(guiNop.map((x) => x.than.cacEm.length)).toEqual([100, 30])
    expect(guiNop.map((x) => 'banTin' in x.than)).toEqual([false, true])
    expect(kq).toMatchObject({ nhan: 130, soPhanTu: 130, banTin: { nhan: 1 } })
    expect((d.sql.prepare('SELECT so_nhan FROM ai_ban_tin').get() as any).so_nhan).toBe(130)
  })
  it('NỘP LẠI vô hại: kết quả ghi đè theo (em, ngày), không nhân đôi; lỗi máy chủ (ví dụ bộ não tắt giữa chừng) ⇒ LoiBoNao có lời', async () => {
    const { goi, biDanhCoHoatDong } = await layXong()
    ghiRa('nhanh-01.json', biDanhCoHoatDong.map((b) => raHopLe(b)))
    await chayNop({ ngay: NGAY, goc, goi, bayGio: NOW })
    await chayNop({ ngay: NGAY, goc, goi, bayGio: NOW })
    expect(d.dem('ai_dieu_chinh')).toBe(21)
    await boNaoCauHinh(d.env, { bat: false })
    const l = await chayNop({ ngay: NGAY, goc, goi }).catch((e) => e)
    expect(l).toBeInstanceOf(LoiBoNao)
    expect(l.message).toContain('Bộ não đang tắt')
  })
  it('KHÔNG lộ SBD ra thông báo: lý do / cảnh báo / lỗi bản tin do MÁY CHỦ trả có SBD ⇒ đổi thành bí danh; loại toàn bộ và không có bản tin ⇒ không gọi máy chủ nộp', async () => {
    const { goi: goiThat, biDanhCoHoatDong, bd } = await layXong()
    const em = biDanhCoHoatDong[0]
    const sbdEm = bd[em]
    ghiRa('nhanh-01.json', [raHopLe(em)])
    const goiGia = async (duong: string, than: any) => duong === '/ai/dieu-chinh/nop'
      ? { ok: true, nhan: 0, chiGhiSo: 0, soApDung: 0, biLoai: 1, loai: [{ sbd: sbdEm, lyDo: [`em ${sbdEm} sai khuôn`] }], canhBao: [], banTin: { nhan: 0, loi: [`dòng 1: em ${sbdEm} không hợp lệ`] } }
      : goiThat(duong, than)
    ghiRa('lop.json', { cacDong: [{ loai: 'ca_lop', biDanh: '', chu: 'Đêm nay có 5 em vắng nhiều ngày', hanhDong: 'khong', dang: '' }] })
    const kq = await chayNop({ ngay: NGAY, goc, goi: goiGia, bayGio: NOW })
    const chu = JSON.stringify(kq) + dongNop(kq).join('\n')
    expect(chu).not.toContain(sbdEm)
    expect(kq.loai[0]).toEqual({ biDanh: em, lyDo: [`em ${em} sai khuôn`] })
    expect(kq.banTin.loi).toEqual([`dòng 1: em ${em} không hợp lệ`])
    // toàn bộ phần tử bị loại và không có bản tin ⇒ không gọi /ai/dieu-chinh/nop
    let soGoiNop = 0
    const dem = async (duong: string, than: any) => { if (duong === '/ai/dieu-chinh/nop') soGoiNop++; return goiThat(duong, than) }
    rmSync(join(goc, NGAY, 'ra', 'lop.json'))
    ghiRa('nhanh-01.json', [raHopLe(em, { doTinCay: 7 }), raHopLe('E999')])
    const kq2 = await chayNop({ ngay: NGAY, goc, goi: dem, bayGio: NOW })
    expect(soGoiNop).toBe(0)
    expect(kq2).toMatchObject({ nhan: 0, soPhanTu: 2, biLoaiCucBo: 2 })
  })
  it('em `bo_qua` không bao giờ được lưu, dù máy chủ có lỡ kèm thẻ; tệp không phải .json trong vao/ không bị dọn', async () => {
    const goiGia = async (duong: string) => {
      if (duong === '/ai/cau-hinh') return { ok: true, cauHinh: { bat: true, cheDo: 'bong', lopThat: [] } }
      if (duong === '/ai/ho-so-ngay') return { ok: true, soTrang: 1, cacEm: [{ sbd: '31000', lop: 'x', luong: 'bo_qua', lyDoLuong: [], the: { x: 1 } }, { sbd: '31001', lop: 'x', luong: 'nhanh', lyDoLuong: [], the: { y: 2 } }], lop: { soEm: 1, emNoiLen: ['31000', '31001'] } }
      throw new Error('gọi lạ')
    }
    mkdirSync(join(goc, NGAY, 'vao'), { recursive: true })
    writeFileSync(join(goc, NGAY, 'vao', 'ghi-chu.txt'), 'giữ')
    const kq = await chayLay({ ngay: NGAY, goc, goi: goiGia, bayGio: NOW })
    expect(kq.dem).toMatchObject({ soEmCoThe: 1, nhanh: 1, boQua: 1 })
    expect(Object.values(JSON.parse(readFileSync(join(goc, NGAY, '.bi-danh.json'), 'utf8')).bang)).toEqual(['31001'])
    expect(JSON.parse(readFileSync(join(goc, NGAY, 'lop.json'), 'utf8')).lop.emNoiLen).toHaveLength(1) // em không có bí danh bị bỏ khỏi emNoiLen, không lộ SBD
    expect(readFileSync(join(goc, NGAY, 'lop.json'), 'utf8')).not.toContain('3100')
    expect(readFileSync(join(goc, NGAY, 'vao', 'ghi-chu.txt'), 'utf8')).toBe('giữ')
  })
  it('THẺ ĐẦY ĐỦ từ `.the-day-du.json` (không phải vao/ đã nén); không có tệp ấy (lượt lấy cũ) thì rơi về vao/', async () => {
    const { goi, biDanhCoHoatDong } = await layXong()
    const dayDu = JSON.parse(readFileSync(join(goc, NGAY, '.the-day-du.json'), 'utf8'))
    const the = docTheDaLay(join(goc, NGAY))
    expect(the.get(biDanhCoHoatDong[0]).the).toEqual(dayDu.the[biDanhCoHoatDong[0]])
    expect(the.get(biDanhCoHoatDong[0]).the).toHaveProperty('ngay')
    // lượt lấy CŨ: xoá tệp đầy đủ, vao/ ghi thẻ đầy đủ theo khuôn cũ
    rmSync(join(goc, NGAY, '.the-day-du.json'))
    writeFileSync(join(goc, NGAY, 'vao', 'nhanh-01.json'), JSON.stringify(Object.entries(dayDu.the).map(([b, t]) => ({ biDanh: b, luong: 'nhanh', the: t }))))
    for (const f of readdirSync(join(goc, NGAY, 'vao'))) if (f !== 'nhanh-01.json') rmSync(join(goc, NGAY, 'vao', f))
    const cu = docTheDaLay(join(goc, NGAY))
    expect(cu.size).toBe(Object.keys(dayDu.the).length)
    ghiRa('nhanh-01.json', [raHopLe(biDanhCoHoatDong[0])])
    expect((await chayNop({ ngay: NGAY, goc, goi, bayGio: NOW })).nhan).toBe(1)
  })
  it('kiemCacEm / kiemBanTinCucBo thuần: thứ tự giữ nguyên; khuôn chạy y hệt máy chủ (thẻ + bí danh)', async () => {
    await layXong()
    const the = docTheDaLay(join(goc, NGAY)) as Map<string, any>
    const [a, b] = [...the.keys()]
    const bang = { [a]: '1', [b]: '2' }
    const r = kiemCacEm([{ tep: 'x', x: raHopLe(b) }, { tep: 'x', x: raHopLe(a, { doTinCay: 2 }) }], bang, the)
    expect(r.hopLe.map((h: any) => h.biDanh)).toEqual([b])
    expect(r.loai).toHaveLength(1)
    expect(kiemBanTinCucBo(join(tam, 'khong-co.json'), {}, bang)).toMatchObject({ banTin: null, loi: [] })
  })
})

// ───────────────────────── CLI thật qua http ─────────────────────────
describe('CLI thật (node scripts/bo-nao/lay.mjs · nop.mjs) qua http tới máy chủ giả', () => {
  const LAY = join(process.cwd(), 'scripts/bo-nao/lay.mjs')
  const NOP = join(process.cwd(), 'scripts/bo-nao/nop.mjs')
  let server: Server
  let cong = 0
  const nhatKyHeader: (string | undefined)[] = []
  beforeEach(async () => {
    nhatKyHeader.length = 0
    server = createServer((req, res) => {
      const chunks: Buffer[] = []
      req.on('data', (c) => chunks.push(c))
      req.on('end', async () => {
        nhatKyHeader.push(req.headers['x-ma-bi-mat'] as string | undefined)
        if (req.headers['x-ma-bi-mat'] !== MA) { res.statusCode = 403; return void res.end('{"ok":false}') }
        const than = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
        const r = req.url === '/ai/cau-hinh' ? await boNaoCauHinh(d.env, than)
          : req.url === '/ai/ho-so-ngay' ? await boNaoHoSoNgay(d.env, than, NOW)
          : req.url === '/ai/dieu-chinh/nop' ? await boNaoNop(d.env, than, NOW)
          : { ok: false, error: 'không có lệnh' }
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(r))
      })
    })
    await new Promise<void>((xong) => server.listen(0, '127.0.0.1', xong))
    cong = (server.address() as { port: number }).port
  })
  afterEach(async () => void (await new Promise((xong) => server.close(xong))))

  const chay = (mjs: string, args: string[], env: Record<string, string> = {}) =>
    new Promise<{ ma: number; ra: string; loi: string }>((xong) => {
      execFile('node', [mjs, ...args], { env: { PATH: process.env.PATH!, HOME: tam, OMR_BO_NAO_GOC: goc, OMR_BO_NAO_THU_MUC: join(tam, 'ma'), OMR_MAY_CHU: `http://127.0.0.1:${cong}`, ...env }, cwd: tam }, (e, ra, loi) =>
        xong({ ma: e ? Number((e as { code?: number }).code ?? 1) : 0, ra, loi }))
    })
  const datMa = (noiDung = MA) => { mkdirSync(join(tam, 'ma'), { recursive: true }); writeFileSync(join(tam, 'ma', 'ma-bi-mat'), noiDung + '\n', { mode: 0o600 }) }

  it('lay.mjs rồi nop.mjs chạy được ở thư mục bất kỳ: in đường dẫn + số đếm, KHÔNG in SBD/tên/mã; header mã bí mật tới máy chủ; điều chỉnh vào D1', async () => {
    const sbds = dungLop(20)
    datMa()
    const lay = await chay(LAY, [NGAY])
    expect(lay.loi).toBe('')
    expect(lay.ma).toBe(0)
    expect(lay.ra).toContain(`Đã lấy dữ liệu ngày ${NGAY} → bo-nao/${NGAY}/`)
    expect(lay.ra).toMatch(/Có thẻ 26 em/)
    const vao = docTatCaVao()
    ghiRa('nhanh-01.json', vao.filter((e) => e.luong !== 'vang').map((e) => raHopLe(e.biDanh)))
    const nop = await chay(NOP, [NGAY])
    expect(nop.loi).toBe('')
    expect(nop.ma).toBe(0)
    expect(nop.ra).toContain('nhận 21/21')
    expect(d.dem('ai_dieu_chinh')).toBe(21)
    for (const s of sbds) { expect(lay.ra + nop.ra, s).not.toContain(s) }
    expect(lay.ra + nop.ra + lay.loi + nop.loi).not.toContain(MA)
    expect(nhatKyHeader.every((h) => h === MA)).toBe(true)
  })
  it('lỗi có lời và mã thoát đúng: thiếu tệp mã ⇒ 2; ngày sai ⇒ 1; mã sai ⇒ 3 (không lộ mã); nop chưa lấy ⇒ 5', async () => {
    const a = await chay(LAY, [NGAY])
    expect([a.ma, a.loi]).toEqual([2, expect.stringContaining('Chưa có tệp mã bí mật')])
    datMa()
    const b = await chay(LAY, ['22/09/2026'])
    expect(b.ma).toBe(1)
    expect(b.loi).toContain('YYYY-MM-DD')
    datMa('mã-sai-hoàn-toàn')
    const c = await chay(LAY, [NGAY])
    expect(c.ma).toBe(3)
    expect(c.loi).toContain('từ chối mã bí mật')
    expect(c.loi + c.ra).not.toContain('mã-sai-hoàn-toàn')
    datMa()
    const e = await chay(NOP, [NGAY])
    expect(e.ma).toBe(5)
    expect(e.loi).toContain(`lay.mjs ${NGAY}`)
    const f = await chay(LAY, [NGAY], { OMR_MAY_CHU: 'http://may-chu-khong-https.thu' })
    expect(f.ma).toBe(2)
    expect(f.loi).toContain('https')
    for (const x of [a, b, c, e, f]) expect(x.loi + x.ra, 'mã bí mật không được lộ ở bất kỳ lỗi nào').not.toContain(MA)
  })
})

// ───────────────────────── khoá nguồn ─────────────────────────
describe('khoá nguồn của mã lệnh', () => {
  const doc = (f: string) => readFileSync(`scripts/bo-nao/${f}`, 'utf8').split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n')
  it('không in mã bí mật / bảng bí danh / SBD; mã chỉ đi bằng header; chỉ đọc tệp mã ở ~/.omr-bo-nao; không ghi mã ra tệp', () => {
    for (const f of ['chung.mjs', 'lay.mjs', 'nop.mjs']) {
      const ma = doc(f)
      expect(ma, f).not.toMatch(/console\.(log|error|warn|info)\([^)]*\b(ma|bang|dao|sbd|secret)\b[^.]/)
      expect(ma, f).not.toMatch(/\bset -x\b|process\.env\.MA_BI_MAT|localStorage/)
    }
    const chung = doc('chung.mjs')
    expect(chung).toContain("'x-ma-bi-mat': ma")
    expect(chung).not.toMatch(/secret\s*:/) // không đưa mã vào thân
    expect(chung).toContain(".omr-bo-nao")
    expect(doc('lay.mjs') + doc('nop.mjs')).not.toMatch(/writeFileSync|ghiJson\([^)]*\bma\b/) // hai mã lệnh không ghi mã
    expect(doc('nop.mjs')).toContain("from '../../src/lib/bo-nao-khuon.ts'") // đúng bộ kiểm khuôn với máy chủ
  })
  it('.gitignore chặn dữ liệu từng đêm (số liệu học sinh) và trạng thái chạy', () => {
    const gi = readFileSync('.gitignore', 'utf8')
    expect(gi).toContain('bo-nao/20*/')
    expect(gi).toContain('bo-nao/lan-cuoi.json')
  })
})

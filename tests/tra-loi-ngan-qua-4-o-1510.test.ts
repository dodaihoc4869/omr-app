// @vitest-environment jsdom
// LỖI "4 Ô KHÔNG NHẬP ĐƯỢC 10000" (em SBD 10000 báo 15/10 04:38, Thầy giao bàn Kiểm thử; việc văn phòng v_a0e2849afa84). TEST ĐỎ TRƯỚC KHI SỬA.
//
// Câu thật `DH-10-C1-B1-III-18` (phần III, lớp 10, "phóng đại nguyên tử Gold … gấp bao nhiêu lần"): đáp án "10000" (5 kí tự). Màn làm bài dot13 (12/10)
// có `TOI_DA_KY_TU = 4` trong src/components/hoc-tap/lam-bai.ts ⇒ `nhanPhim` nuốt kí tự thứ 5 (bàn phím số lẫn phím máy tính) ⇒ em gõ 10000 thì gửi "1000",
// máy chủ chấm sai. Trước 12/10 em nhập "10000" vẫn được chấm đúng (hồi quy). Kho còn 42 câu phần III đáp số thuần dài hơn 4 kí tự (danh sách thật ở dưới).
//
// ĐẶC TẢ (viết theo HÀNH VI, không khoá tên hàm chưa có):
//   a) câu đáp số "10000": em nhập đủ "10000" bằng bàn phím số VÀ bằng phím máy tính ⇒ giá trị gửi đi là "10000" ⇒ lệnh máy chủ `answer` chấm ĐÚNG.
//   b) câu đáp số ≤ 4 kí tự: GIỮ 4 ô như phiếu (kí tự thứ 5 không vào, phím mờ khi đủ 4) — không đổi giao diện câu thường; đáp án KHÔNG xuống máy em trước khi nộp.
//      CẬP NHẬT 15/10 ~10:30 (Lập trình, việc v_a254c6118c6b) theo lệnh thầy "tuỳ vào đáp án mà hiển thị đúng số ô cần điền": số ô = ĐÚNG số kí tự đáp số
//      ("7,5" ⇒ 3 ô, "-0,5" / "2024" ⇒ 4 ô); kí tự vượt số ô không vào, phím mờ khi đủ. Phần "đáp án không xuống máy em" giữ nguyên.
//   c) chốt chặn: không câu phần III nào được phát cho em mà đáp số (dạng gõ được bằng bàn phím số) dài hơn số ô nhập; câu đáp án chữ / tự luận gắn nhầm
//      phần III không lọt vào đề trả lời ngắn.
//
// GIẢ ĐỊNH CHO LẬP TRÌNH KHỚP (ghi rõ theo yêu cầu):
//   G1. Câu xuống máy em đi qua `publicQuestion` (src/game/than-thu-v2/core.ts) — cửa chung của mọi kênh phát câu. Muốn máy em biết câu nào cần hơn 4 ô thì
//       gắn thông tin (vd số ô) VÀO KẾT QUẢ `publicQuestion`; test lấy câu công khai từ chính `publicQuestion` hoặc từ lệnh máy chủ `start` thật, nên tên trường
//       tuỳ Lập trình đặt. TUYỆT ĐỐI không gửi `correct` / `solution` / chuỗi đáp án.
//   G2. "Số ô nhập" đo bằng HÀNH VI trên màn `ManLamBaiTap`: bấm phím 9 thật nhiều lần, đếm số kí tự ô giữ lại. Không đọc hằng `TOI_DA_KY_TU`.
//   G3. Chốt chặn (c) đo ở LỆNH MÁY CHỦ `start` thật (D1 giả node:sqlite, lược đồ thật): câu nào máy chủ phát ra đều phải gõ vừa ô. Câu ×10ⁿ quá dài để gõ
//       (vd "1,108.10²³") Lập trình tự chọn cách: chặn khỏi kênh bàn phím số, hoặc thêm cách nhập — test chỉ đòi "phát ra thì phải gõ được và chấm đúng".
//   G4. Màn học sinh mở câu bằng `hoc-tap-start` → nộp bằng `answer` (goiHoa2) — giữ như hiện nay.
// KHI SỬA XONG: ca "phím thứ 5 không vào" ở tests/man-lam-bai-1210d.test.tsx (nhanPhim không kèm gợi ý số ô) vẫn phải xanh = câu thường 4 ô.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
import { publicQuestion, type PrivateQuestion } from '../src/game/than-thu-v2/core'
import { khopPhanIII } from '../src/lib/cham-so'
import { dinhTriKhoa } from '../src/lib/cham-so-policy'
import { laCauTuLuan } from '../src/lib/cau-tu-luan'
import { docSoPhanIII } from '../src/lib/doc-so-phan-iii'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { taoD1That, type D1That } from './_d1-that'

vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
afterEach(() => { cleanup(); vi.mocked(goiHoa2).mockReset(); localStorage.clear() })

// ───────────────────────────── DỮ LIỆU ─────────────────────────────
const DE_10000 = 'Nếu phóng đại một nguyên tử gold lên một tỉ lần thì đường kính của nó tương đương một quả bóng 30 cm, đường kính hạt nhân là 0,003 cm. Đường kính nguyên tử gấp bao nhiêu lần đường kính hạt nhân?'
/** Câu như chỉ mục game (`PrivateQuestion`), khuôn thật của `game_v2_question.json`. */
function cauRieng(qid: string, correct: string, text = 'Tính giá trị cần tìm (làm tròn theo đề).', maDe = 'DE-TLN'): PrivateQuestion & { lop: string } {
  return { qid, maDe, lop: '10', version: 'v1', group: `g-${qid}`, phan: 'III', text, choices: [], ideas: [], hinhAnh: [], dang: 'NT.MO_HINH.X', tenDang: 'Mô hình nguyên tử', mucDo: 'biet', sao: 1, kienThuc: ['K1'], correct, solution: `Đáp số ${correct}.`, reviewed: true }
}
/** 42 câu phần III THẬT của kho có đáp số thuần dài hơn 4 kí tự (Trưởng phòng tra D1 15/10, `game_v2_question.json.correct`). */
const KHO_THAT_QUA_4: [string, string][] = [['11-C5-B20-III-6', '2116,4'], ['12-C1-B2-III-21', '9166,7'], ['DB-10-B1-D1-III-163', '10000'], ['DB-10-B1-D1-III-169', '100,0'], ['DB-11-B1-D1-III-197', '311,31'], ['DB-11-B1-D1-III-198', '0,2744'], ['DB-11-B1-D1-III-201', '3,125'], ['DB-11-B1-D1-III-204', '311,3'], ['DB-11-B6-D1-III-14', '74370'], ['DB-11-B6-D2-III-93', '37185'], ['DB-11-B7-D1-III-11', '12395'], ['DB-11-B7-D1-III-12', '12395'], ['DB-11-B7-D3-III-3', '169,8'], ['DB-11-B8-D3-III-21', '-96,9'], ['DB-11-B8-D3-III-24', '-96,9'], ['DB-12-B1-P2-D1-III-48', '9166,7'], ['DB-12-B4-D2-III-122', '13507,3'], ['DB-12-B5-D2-III-316', '208,5'], ['DB-12-B9-P1-D2-III-124', '112,2'], ['DH-10-C1-B1-III-18', '10000'], ['DH-10-C1-B1-III-26', '100,0'], ['DH-10-C1-B1-VD-III-1', '10000'], ['DH-11-C1-B1-III-19', '311,31'], ['DH-11-C1-B1-III-20', '0,2744'], ['DH-11-C1-B1-III-23', '3,125'], ['DH-11-C1-B1-III-26', '311,3'], ['DH-11-C2-B6-III-24', '74370'], ['DH-11-C2-B6-III-36', '6724,2'], ['DH-11-C2-B7-DT-III-2', '37185'], ['DH-11-C2-B7-DT-III-6', '-96,9'], ['DH-11-C2-B7-III-23', '37185'], ['DH-11-C2-B7-III-24', '12395'], ['DH-11-C2-B7-III-27', '-96,9'], ['DH-11-C2-B7-III-37', '12395'], ['DH-11-C2-B7-III-39', '169,8'], ['DH-11-C2-B7-III-40', '-96,9'], ['DH-12-C2-B4-DT-III-13', '13507,3'], ['DH-12-C2-B4-III-49', '13507,3'], ['DH-12-C2-B5-DT-III-4', '208,5'], ['DH-12-C2-B5-III-31', '208,5'], ['DH-12-C3-B9-P1-DT-III-2', '112,2'], ['DH-12-C3-B9-P1-III-39', '112,2']]
/** Đáp án chữ / tự luận gắn nhầm phần III (mẫu lấy nguyên văn từ 256 câu thật cùng đợt tra). */
const TU_LUAN_THAT = ['a) proton và neutron; b) neutron; c) proton; d) electron', '13,1 g; 14,1 g; 0,007 g', 'Mg: +12; O: +8', 'AlCl₃', 'Mg: 12 proton, 12 neutron, 12 electron']

/** Dạng em GÕ được bằng bàn phím số (chữ số, một dấu phẩy, dấu trừ đầu) của một đáp án — số thập phân chính xác, null nếu không đọc được thành số. */
function dangBanPhim(dapAn: string): string | null {
  if (/^-?\d+(,\d+)?$/.test(dapAn)) return dapAn
  // Lập trình 15/10: khoá ×10ⁿ ⇒ em gõ ĐỊNH TRỊ (luật chấm 01/10 trong cham-so.ts: "1,2375×10⁹ kJ" ghi "1,2375" là đúng — ô số không gõ được ×10ⁿ).
  // Vẫn phải qua `khopPhanIII(go, dapAn)` ở dưới, nên không nới hành vi: dạng gõ nào máy chủ chấm sai thì vẫn đỏ.
  const dinhTri = dinhTriKhoa(dapAn)
  if (dinhTri && /^-?\d+(,\d+)?$/.test(dinhTri)) return dinhTri
  const so = docSoPhanIII(dapAn)?.so
  return so && /^-?\d+(\.\d+)?$/.test(so) ? so.replace('.', ',') : null
}

// ───────────────────────────── MÀN LÀM BÀI THẬT (jsdom) ─────────────────────────────
const TEN_PHIM: Record<string, string> = { ',': 'Dấu phẩy', '-': 'Dấu trừ' }
const banPhim = () => within(screen.getByRole('group', { name: 'Bàn phím số' }))
const oTraLoi = () => screen.getByRole('region', { name: 'Ô trả lời' })
/** Giá trị ô đang giữ (đọc dòng đọc-màn-hình "Đáp án của em: …"; dấu trừ hiện "−" đổi lại "-"). */
const giaTriO = () => { const t = oTraLoi().querySelector('output')?.textContent ?? ''; return t.startsWith('Đáp án của em: ') ? t.slice(15).replace(/−/g, '-') : '' }
const soO = () => oTraLoi().querySelectorAll('.ht2-lam-o').length

/** Mở màn làm bài với ĐÚNG một câu công khai (như `hoc-tap-start` trả). `answer` ghi lại thân lệnh để test đưa sang máy chủ thật. */
async function moManCau(cauCongKhai: object, cham: (tra: string) => { correct: boolean; answer: string }) {
  const daGui: Record<string, unknown>[] = []
  vi.mocked(goiHoa2).mockImplementation(async (lenh: string, _tk: string, du: Record<string, unknown> = {}) => {
    if (lenh === 'hoc-tap-start') return { ok: true, id: 'p1', questions: [cauCongKhai] }
    if (lenh === 'answer') { daGui.push(du); return { ok: true, ...cham(String(du.answer ?? '')) } }
    return { ok: true }
  })
  render(createElement(ManLamBaiTap, { token: 'tk', sbd: 's1', onVe: vi.fn(), onCapNhat: vi.fn(), onChua: vi.fn(), homNay: null }))
  await screen.findByRole('region', { name: 'Ô trả lời' })
  return daGui
}
const goBanPhimSo = (chuoi: string) => { for (const c of chuoi) fireEvent.click(banPhim().getByRole('button', { name: TEN_PHIM[c] ?? c })) }
const goMayTinh = (chuoi: string) => { for (const c of chuoi) fireEvent.keyDown(document.body, { key: c }) }
async function nop(daGui: Record<string, unknown>[]): Promise<string> {
  fireEvent.click(screen.getByRole('button', { name: /^Nộp câu/ }))
  await waitFor(() => expect(daGui.length).toBe(1))
  return String(daGui[0]!.answer)
}
/** Số ô nhập của câu, đo bằng hành vi: bấm "9" 30 lần, đếm số kí tự ô giữ lại. */
async function soONhap(cauCongKhai: object): Promise<number> {
  await moManCau(cauCongKhai, () => ({ correct: false, answer: '' }))
  for (let i = 0; i < 30; i++) fireEvent.click(banPhim().getByRole('button', { name: '9' }))
  const n = giaTriO().length
  cleanup(); vi.mocked(goiHoa2).mockReset(); localStorage.clear()
  return n
}

// ───────────────────────────── MÁY CHỦ THẬT (D1 giả node:sqlite, lược đồ thật) ─────────────────────────────
const T0 = Date.parse('2026-10-15T08:00:00+07:00')
function dungKho(cau: (PrivateQuestion & { lop: string })[], maDe = 'DE-TLN'): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'10',?,?,0,'v1')").run(maDe, maDe, cau.length, `kho/${maDe}.json`)
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(maDe)
  for (const q of cau) {
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(maDe, q.qid, q.version, q.group, q.dang, JSON.stringify(q))
    d.sql.prepare("INSERT INTO cau_hoi(qid,ma_de,chuyen_de,muc_do,phan,lop,co_loi_giai,cap_nhat_luc) VALUES(?,?,'CD1','biet','III','10',0,'x')").run(q.qid, maDe)
  }
  d.objects.set(`kho/${maDe}.json`, { ma_de: maDe, cau: cau.map((q, i) => ({ phan: 'III', so: i + 1, de: q.text, dap_an: q.correct, dang: { ma: q.dang, ten: q.tenDang }, chuyen_de: 'CD1', muc_do: 'biet' })) })
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em Thử','10A1','mk','x')").run()
  return d
}
/** Em đã SAI các câu này ở bài về nhà 3 ngày trước ⇒ lượt ôn câu sai (`start` mode repair) phát lại đúng các câu ấy — như em SBD 10000 làm lại câu 10000. */
async function daGap(d: D1That, qids: string[]) {
  const r = await ghiSuKien(d.env, qids.map((qid, i) => ({ nguon: 'btvn' as const, maNguon: 'B', sbd: 'S1', qid, lan: i + 1, ketQua: 0 as const, luc: new Date(T0 - 3 * 86_400_000).toISOString(), maDang: 'NT.MO_HINH.X' })))
  expect(r.ok).toBe(true)
  await dungLaiHoSo(d.env, ['S1'], new Date(T0).toISOString())
}
type CauRa = Record<string, unknown> & { qid: string; phan: string }
async function phatCau(d: D1That, lan = 6): Promise<{ id: string; cau: Map<string, CauRa> }> {
  const token = await gameToken(d.env, 'S1')
  const cau = new Map<string, CauRa>(); let id = ''
  for (let i = 0; i < lan; i++) {
    const r = await gameV2(d.env, 'start', { token, mode: 'repair' }) as { ok: boolean; id: string; questions: CauRa[] }
    expect(r.ok).toBe(true)
    for (const q of r.questions) if (!cau.has(q.qid)) cau.set(q.qid, q)
    id = r.id
    if (i < lan - 1) d.sql.exec('DELETE FROM game_v2_session; DELETE FROM game_v2_attempt')
  }
  return { id, cau }
}
async function chamMayChu(d: D1That, session: string, qid: string, answer: string) {
  return gameV2(d.env, 'answer', { token: await gameToken(d.env, 'S1'), session, qid, answer }) as Promise<{ correct: boolean; answer: string }>
}

// ═════════════════════════════ a) ĐÁP SỐ 5 KÍ TỰ "10000" ═════════════════════════════
describe('a) câu đáp số "10000" (DH-10-C1-B1-III-18): em nhập đủ 5 kí tự, gửi "10000", máy chủ chấm đúng', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
  afterEach(() => vi.useRealTimers())
  const Q = cauRieng('DH-10-C1-B1-III-18', '10000', DE_10000)

  it('bàn phím số: bấm 1-0-0-0-0 ⇒ ô giữ "10000", hiện 5 ô, nút Nộp ghi "Nộp câu · 10000", gửi đi "10000"', async () => {
    const daGui = await moManCau(publicQuestion(Q), (tra) => ({ correct: khopPhanIII(tra, Q.correct), answer: Q.correct }))
    goBanPhimSo('10000')
    expect(giaTriO()).toBe('10000')
    expect(soO()).toBeGreaterThanOrEqual(5)
    expect(screen.getByRole('button', { name: /^Nộp câu/ }).textContent).toContain('10000')
    expect(await nop(daGui)).toBe('10000')
  })

  it('phím máy tính: gõ 10000 ⇒ ô giữ "10000", gửi đi "10000"', async () => {
    const daGui = await moManCau(publicQuestion(Q), (tra) => ({ correct: khopPhanIII(tra, Q.correct), answer: Q.correct }))
    goMayTinh('10000')
    expect(giaTriO()).toBe('10000')
    expect(await nop(daGui)).toBe('10000')
  })

  it('đầu cuối: câu do lệnh máy chủ `start` THẬT phát ra → màn thật gõ 10000 → lệnh `answer` THẬT chấm ĐÚNG (không còn "Em trả lời 1000 · đáp án 10000")', async () => {
    const d = dungKho([Q]); await daGap(d, [Q.qid])
    const { id, cau } = await phatCau(d, 1)
    const ra = cau.get(Q.qid)
    expect(ra, 'đối chứng: máy chủ phải phát câu 10000 cho em').toBeTruthy()
    const daGui = await moManCau(ra!, (tra) => ({ correct: khopPhanIII(tra, Q.correct), answer: Q.correct }))
    goBanPhimSo('10000')
    const guiDi = await nop(daGui)
    const kq = await chamMayChu(d, id, Q.qid, guiDi)
    expect({ guiDi, dung: kq.correct }).toEqual({ guiDi: '10000', dung: true })
  })

  it('máy chủ chấm: "10000" đúng, "1000" (bản cũ bị cắt) sai — luật chấm không đổi', () => {
    expect(khopPhanIII('10000', '10000')).toBe(true)
    expect(khopPhanIII('1000', '10000')).toBe(false)
  })
})

// ═════════════════════════════ b) CÂU THƯỜNG ≤ 4 KÍ TỰ GIỮ NGUYÊN ═════════════════════════════
describe('b) câu đáp số ≤ 4 kí tự: đúng số ô theo đáp số (thầy 15/10); đáp án không xuống máy em trước khi nộp', () => {
  const THUONG = [cauRieng('DE-TLN-III-1', '7,5'), cauRieng('DE-TLN-III-2', '-0,5'), cauRieng('DE-TLN-III-3', '2024')]

  it.each(THUONG.map((q) => [q.correct, q] as const))('đáp số "%s": số ô = số kí tự đáp số; kí tự vượt số ô không vào (bàn phím số + phím máy tính), phím số mờ khi đủ', async (d, q) => {
    const daGui = await moManCau(publicQuestion(q), (tra) => ({ correct: khopPhanIII(tra, q.correct), answer: q.correct }))
    const n = d.length // "7,5" ⇒ 3, "-0,5" ⇒ 4, "2024" ⇒ 4
    expect(soO()).toBe(n)
    goBanPhimSo('1234'); goBanPhimSo('5'); goMayTinh('6')
    expect(giaTriO()).toBe('123456'.slice(0, n))
    expect(soO()).toBe(n)
    expect((banPhim().getByRole('button', { name: '7' }) as HTMLButtonElement).disabled).toBe(true)
    expect(await nop(daGui)).toBe('123456'.slice(0, n))
  })

  it('câu công khai (câu thường lẫn câu 10000) không mang correct / solution / chuỗi đáp án; màn chưa nộp không hiện đáp án', async () => {
    for (const q of [...THUONG, cauRieng('DH-10-C1-B1-III-18', '10000', DE_10000)]) {
      const pub = publicQuestion(q) as unknown as Record<string, unknown>
      expect(pub.correct).toBeUndefined(); expect(pub.solution).toBeUndefined()
      expect(JSON.stringify(pub)).not.toContain(JSON.stringify(q.correct))
    }
    await moManCau(publicQuestion(cauRieng('DH-10-C1-B1-III-18', '10000', DE_10000)), () => ({ correct: false, answer: '' }))
    expect(document.body.textContent).not.toContain('10000')
    expect(vi.mocked(goiHoa2).mock.calls.map((c) => c[0])).toEqual(['hoc-tap-start'])
  })
})

// ═════════════════════════════ c) CHỐT CHẶN ═════════════════════════════
describe('c) chốt chặn: không câu phần III nào phát ra mà đáp số dài hơn số ô nhập; tự luận gắn nhầm phần III không lọt', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
  afterEach(() => vi.useRealTimers())

  it('42 câu THẬT của kho (đáp số thuần 5–7 kí tự): đáp số gõ vừa ô, gửi đúng nguyên văn, chấm đúng', async () => {
    const hong: string[] = []
    for (const [qid, dapAn] of KHO_THAT_QUA_4) {
      const q = cauRieng(qid, dapAn)
      const daGui = await moManCau(publicQuestion(q), (tra) => ({ correct: khopPhanIII(tra, dapAn), answer: dapAn }))
      goBanPhimSo(dapAn)
      const giu = giaTriO()
      const guiDi = giu === dapAn ? await nop(daGui) : giu
      if (guiDi !== dapAn || !khopPhanIII(guiDi, dapAn)) hong.push(`${qid}: đáp số ${dapAn} → ô giữ ${guiDi}`)
      cleanup(); vi.mocked(goiHoa2).mockReset(); localStorage.clear()
    }
    expect(hong).toEqual([])
  }, 60_000)

  it('lệnh máy chủ `start` THẬT: mọi câu phần III phát ra đều gõ vừa ô (×10ⁿ dài như "1,108.10²³" phải bị chặn hoặc nhập được); tự luận không ra', async () => {
    const CAU = [
      cauRieng('DE-TLN-III-1', '10000', DE_10000), // dài 5 kí tự — phải gõ được
      cauRieng('DE-TLN-III-2', '7,5'), // câu thường — đối chứng
      cauRieng('DE-TLN-III-3', '1,108.10²³', 'Tính số nguyên tử có trong mẫu.'), // ×10ⁿ: dạng gõ 24 chữ số
      cauRieng('DE-TLN-III-4', '5,74×10⁻¹²', 'Tính bán kính nguyên tử (cm).'),
      ...TU_LUAN_THAT.map((c, i) => cauRieng(`DE-TLN-III-${5 + i}`, c, 'Trả lời các câu hỏi sau.')),
    ]
    const d = dungKho(CAU); await daGap(d, CAU.map((q) => q.qid))
    const { cau } = await phatCau(d)
    expect(cau.has('DE-TLN-III-2'), 'đối chứng: máy chủ vẫn phát câu thường').toBe(true)
    const tuLuanRa = [...cau.keys()].filter((qid) => TU_LUAN_THAT.includes(CAU.find((q) => q.qid === qid)!.correct))
    expect(tuLuanRa).toEqual([])
    const tran: string[] = []
    for (const [qid, ra] of cau) {
      if (ra.phan !== 'III') continue
      const dapAn = CAU.find((q) => q.qid === qid)!.correct
      const go = dangBanPhim(dapAn)
      const toiDa = await soONhap(ra)
      if (!go || go.length > toiDa || !khopPhanIII(go, dapAn)) tran.push(`${qid}: đáp án ${dapAn} cần gõ ${go ?? '(không gõ được)'} (${go?.length ?? '∞'} kí tự) > ${toiDa} ô`)
    }
    expect(tran).toEqual([])
  }, 60_000)

  it('đối chứng thuần: đáp án chữ / tự luận gắn nhầm phần III bị định nghĩa chung `laCauTuLuan` chặn', () => {
    for (const c of TU_LUAN_THAT) expect(laCauTuLuan(cauRieng('X', c)), c).toBe(true)
    for (const [, c] of KHO_THAT_QUA_4) expect(laCauTuLuan(cauRieng('X', c)), c).toBe(false)
  })
})

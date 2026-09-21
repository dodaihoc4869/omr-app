// PHIẾU BTVN "NÂNG ĐỠ" (bài ca_nhan) — phía máy em. Hợp đồng: docs/hop-dong-btvn-nang-do-2109.md.
//
// Bốn điều phải giữ:
//  1. Phiếu KHÔNG khai `caNhan` ra ĐÚNG như trước (không một dấu vết của bản mới).
//  2. Máy em KHÔNG có đáp án của câu chưa nộp: không data-dung, không dapAn trong #du-nop, không .sa-answer, không lời giải.
//  3. Nộp CHẶNG đi qua host (postMessage), không chấm tại chỗ, không gọi mạng từ trong phiếu, không window.confirm.
//  4. Câu đã chấm ở máy chủ: đáp án đúng/sai tô đúng thẻ ấy, khoá lại, không bấm/gõ được nữa.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'
import { boLoiGiai, dungPhieu, type ThongTinPhieu } from '../src/lib/html-phieu'
import { CSS_PHIEU_CA_NHAN, type DauBaiCaNhanVao } from '../src/lib/html-phieu-ca-nhan'
import type { NhanCauEm } from '../src/lib/btvn-ca-nhan-em'

const C = (o: Partial<CauLuyen>): CauLuyen =>
  ({ phan: 'I', id: 'x', maDe: 'X', chuyenDe: 'Ester – lipid', dang: 'chua_ro', sao: 0, mucDo: 'hieu', text: 'Đề', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'A', chot: 'c', lyDo: null, buoc: ['Bước một.'], ketQua: '', ...o }) as CauLuyen

/** Câu CHƯA có đáp án — đúng như `dungPhieuBtvn` dựng: đã qua `boLoiGiai` rồi gắn cờ `chuaCoDapAn`. */
const chua = (o: Partial<CauLuyen>, nhan?: NhanCauEm): CauLuyen => ({ ...boLoiGiai(C(o)), caNhan: { nhan, chuaCoDapAn: true } })

const CHUA: CauLuyen[] = [
  chua({ id: 'q1', text: 'Chất nào sau đây là ester?' }, 'khoi_dong'),
  chua({ id: 'q2', phan: 'II', text: 'Xét đúng sai từng ý:', luaChon: ['ý a', 'ý b', 'ý c', 'ý d'] }, 'loi'),
  chua({ id: 'q3', phan: 'III', luaChon: null, text: 'Tính giá trị m (gam).' }, 'dang_yeu'),
  chua({ id: 'q4', text: 'Câu thử thách.' }, 'thu_thach'),
  chua({ id: 'q5', text: 'Câu lõi cao.' }, 'loi_cao'),
]

const TT: ThongTinPhieu = { hoTen: '', sbd: '12121212', ngay: new Date(2026, 8, 21), tenChuyenDe: 'Bài tập về nhà', ketQua: '', hienDapAn: false, nhanBia: 'BÀI TẬP VỀ NHÀ', oBia: [{ nhan: 'Hạn nộp', gia: '20:00 ngày 28/09' }] }
const NOP = { ma: 'BTVN-abc', sbd: '12121212', url: 'https://may-chu.thu/goi' }
const DAU: DauBaiCaNhanVao = {
  tong: 52,
  soChang: 7,
  phutMoiNgay: 10,
  han: '28/09',
  chang: [0, 1, 2, 3, 4, 5, 6].map((chiSo) => ({ chiSo, daXong: false })),
  chiSoHienThi: 0,
  nhanChang: { 0: 'Hôm nay', 1: 'Mai' },
}
const CN = (o: Record<string, unknown> = {}) => ({ chiSo: 0, daCham: {}, dauBai: DAU, ghiCho: '', tienTo: 'Chặng 1/7 · ', nutNop: 'Nộp chặng', nutTat: false, ...o })
const phieu = (cau: CauLuyen[] = CHUA, o: Record<string, unknown> = {}) => dungPhieu(TT, cau, { nop: NOP, caNhan: CN(o) })
/** Phần thân trang (trước thẻ script dữ liệu) — nơi đáp án sẽ lộ nếu có lỗi. */
const than = (html: string) => html.slice(html.indexOf('<body'), html.indexOf('<script type="application/json" id="du-nop">'))
const duNop = (html: string) => JSON.parse(/<script type="application\/json" id="du-nop">([\s\S]*?)<\/script>/.exec(html)![1].replace(/\\u003c/g, '<'))

// ─────────────────────────── 1. PHIẾU CŨ KHÔNG ĐỔI ───────────────────────────
describe('phiếu không khai caNhan: không một dấu vết của bản mới', () => {
  it('phiếu BTVN thường (nộp được) không có hero, nhãn, lớp ca-nhan, CSS riêng, khoá caNhan', () => {
    const html = dungPhieu(TT, [C({ id: 'q1' }), C({ id: 'q2', phan: 'III', luaChon: null, dapAn: '3' })], { nop: NOP, laBtvn: true, soCauSang: 1 })
    expect(html).not.toContain('gcn-')
    expect(html).not.toContain(CSS_PHIEU_CA_NHAN)
    expect(html).not.toContain('ca-nhan')
    expect(html).toContain('<body class="co-lam chua-nop">')
    expect(duNop(html).caNhan).toBeUndefined()
    expect(duNop(html).cau[0]).toEqual({ id: 'q1', phan: 'I', dapAn: 'A' })
    expect(html).toContain('Hiện tất cả 2 câu') // nút cũ của bài thường vẫn còn
  })
})

// ─────────────────────────── 2. KHÔNG ĐÁP ÁN Ở MÁY EM ───────────────────────────
describe('phiếu ca_nhan: câu chưa nộp KHÔNG mang đáp án nào', () => {
  const html = phieu()
  const thanTrang = than(html)

  it('không data-dung, không .sa-answer, không lời giải, không dapAn trong #du-nop', () => {
    expect(thanTrang).not.toContain('data-dung')
    expect(thanTrang).not.toContain('sa-answer')
    expect(thanTrang).not.toContain('sol-box')
    expect(thanTrang).not.toContain('q-nut-giai')
    expect(thanTrang).not.toContain('Bước một.')
    const du = duNop(html)
    expect(du.cau).toHaveLength(5)
    for (const c of du.cau) expect(Object.keys(c).sort()).toEqual(['id', 'phan'])
    expect(du.caNhan).toEqual({ chiSo: 0, daCham: {} })
  })

  it('Phần II không gắn dấu đáp án giả lên ô "S" (ysDung rỗng ⇒ mọi ý sai — không được lộ ra thành data-dung)', () => {
    const q2 = /<article[^>]*data-qid="q2"[\s\S]*?<\/article>/.exec(thanTrang)![0]
    expect(q2).toContain('tf-badge')
    expect(q2).not.toContain('data-dung')
  })

  it('không còn cơ chế lô cũ: không "Hiện tất cả", không "Mục tiêu hôm nay", không Vòng 1/2/3, không khoá lô', () => {
    for (const chuoi of ['Hiện tất cả', 'thanh-phan-tang-btvn', 'nut-mo-het-cau', 'Mục tiêu hôm nay', 'Vòng 1', 'Vòng 2', 'Vòng 3', 'dimmed-pacing-banner', 'q-card-dimmed', 'Phân loại mức độ']) {
      expect(thanTrang, chuoi).not.toContain(chuoi)
    }
    expect(duNop(html).soCauMocLo).toBeUndefined()
  })

  it('thân trang: lớp ca-nhan, KHÔNG chua-nop, KHÔNG dòng "lời giải mở ra sau khi nộp bài"', () => {
    expect(html).toContain('<body class="co-lam ca-nhan">')
    expect(thanTrang).not.toContain('giai-khoa')
  })
})

// ─────────────────────────── 3. ĐẦU BÀI + NHÃN ───────────────────────────
describe('đầu bài "Bài của riêng em" và nhãn từng câu', () => {
  const html = phieu()
  const thanTrang = than(html)

  it('hero có số đếm của CHÍNH em, số phút, hạn, 7 chặng, 4 nhãn chú giải; thanh trên có "Chặng 1/7 · Đã làm 0/5 câu"', () => {
    const hero = /<section class="gcn-hero"[\s\S]*?<\/section>/.exec(thanTrang)![0]
    expect(hero).toContain('Bài của riêng em')
    expect(hero).toContain('<b>52</b> câu')
    expect(hero).toContain('<b>7</b> chặng')
    expect(hero).toContain('Khoảng 10 phút mỗi ngày · Hạn nộp: 28/09')
    expect(hero.match(/<li class="gcn-c/g)).toHaveLength(7)
    expect(hero).toContain('aria-current="step"')
    expect(hero).toContain('Hôm nay')
    expect(hero).toContain('Mai')
    for (const chu of ['Khởi động', 'Cốt lõi', 'Dành riêng cho em', 'Thử thách']) expect(hero).toContain(chu)
    expect(thanTrang).toContain('Chặng 1/7 · Đã làm <b id="gd-dem">0</b>/<span id="gd-tong">5</span> câu')
  })

  it('mỗi thẻ mang đúng nhãn; câu thưởng (thử thách, lõi cao) có dải "sai không sao"; câu thường thì không', () => {
    const the = (qid: string) => new RegExp(`<article[^>]*data-qid="${qid}"[\\s\\S]*?</article>`).exec(thanTrang)![0]
    expect(the('q1')).toContain('data-nhan="khoi_dong"')
    expect(the('q2')).toContain('data-nhan="loi"')
    expect(the('q3')).toContain('data-nhan="dang_yeu"')
    expect(the('q4')).toContain('data-nhan="thu_thach"')
    expect(the('q5')).toContain('Cốt lõi · câu cao')
    for (const q of ['q4', 'q5']) expect(the(q)).toContain('sai không sao')
    for (const q of ['q1', 'q2', 'q3']) expect(the(q)).not.toContain('gcn-ghi')
  })

  it('không lộ số câu của bạn khác, không xếp hạng, không chữ "nắm chắc"', () => {
    const chu = thanTrang.replace(/<[^>]+>/g, ' ')
    expect(chu).not.toMatch(/bạn khác|cả lớp có|xếp hạng|hạng \d|nắm chắc/i)
  })

  it('nút nộp ghi "Nộp chặng"; khi không còn câu nào để nộp thì tắt và ghi "Đã xong chặng"', () => {
    expect(thanTrang).toContain('id="nut-nop">Nộp chặng</button>')
    const xong = than(phieu(CHUA, { nutNop: 'Đã xong chặng', nutTat: true }))
    expect(xong).toContain('id="nut-nop" disabled>Đã xong chặng</button>')
  })

  it('dòng chờ "Chặng 2 mở ngày mai" hiện khi phiếu truyền ghiCho', () => {
    expect(than(phieu(CHUA, { ghiCho: 'Chặng 2 mở ngày mai.' }))).toContain('Chặng 2 mở ngày mai.')
    expect(thanTrang).not.toContain('gcn-cho')
  })

  it('CSS riêng chỉ có khi khai caNhan, và KHÔNG có mã màu thô (check:mau)', () => {
    expect(html).toContain(CSS_PHIEU_CA_NHAN)
    expect(CSS_PHIEU_CA_NHAN).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(CSS_PHIEU_CA_NHAN).not.toContain('`')
    expect(CSS_PHIEU_CA_NHAN).not.toContain('${')
    expect(CSS_PHIEU_CA_NHAN).toContain('html.gd-m3 body.ca-nhan .thanh:not(#thanh-nop) { display: none; }')
    expect(CSS_PHIEU_CA_NHAN).toContain('html.gd-m3 body.ca-nhan .q-tags { align-items: center; }')
  })
})

// ─────────────────────────── 4. CÂU ĐÃ CHẤM Ở MÁY CHỦ ───────────────────────────
describe('câu đã chấm: hiện kết quả máy chủ trả về, và CHỈ thẻ ấy có đáp án', () => {
  /** q1 chấm ĐÚNG (em chọn B), q3 chấm SAI (em điền 9); còn lại chưa chấm. */
  const cau = [
    C({ id: 'q1', dapAn: 'B', text: 'Chất nào sau đây là ester?', chot: 'Nhóm chức ester nằm giữa hai gốc hiđrocacbon.', caNhan: { nhan: 'khoi_dong', daCham: { dung: true, chon: 'B' } } }),
    CHUA[1],
    C({ id: 'q3', phan: 'III', luaChon: null, dapAn: '12,5', text: 'Tính giá trị m (gam).', chot: 'Áp dụng bảo toàn khối lượng cho phản ứng.', caNhan: { nhan: 'dang_yeu', daCham: { dung: false, chon: '9' } } }),
    CHUA[3],
  ]
  const daCham = { q1: { dung: true, chon: 'B' }, q3: { dung: false, chon: '9' } }
  const html = phieu(cau, { daCham })
  const thanTrang = than(html)

  it('thẻ đã chấm có da-cham + cau-dung/cau-sai + chữ Đúng/Sai + lời giải; thẻ chưa chấm không có gì', () => {
    const the = (qid: string) => new RegExp(`<article[^>]*data-qid="${qid}"[\\s\\S]*?</article>`).exec(thanTrang)![0]
    expect(the('q1')).toMatch(/class="q-card[^"]*da-cham cau-dung/)
    expect(the('q1')).toContain('<div class="lam-ket">Đúng</div>')
    expect(the('q1')).toContain('Nhóm chức ester nằm giữa hai gốc hiđrocacbon.')
    expect(the('q3')).toMatch(/class="q-card[^"]*da-cham cau-sai/)
    expect(the('q3')).toContain('<div class="lam-ket">Sai</div>')
    for (const q of ['q2', 'q4']) {
      expect(the(q)).not.toContain('da-cham')
      expect(the(q)).not.toContain('data-dung')
      expect(the(q)).not.toContain('lam-ket')
    }
  })

  it('#du-nop mang daCham và KHÔNG mang dapAn của bất kỳ câu nào (kể cả câu đã chấm)', () => {
    const du = duNop(html)
    expect(du.caNhan.daCham).toEqual(daCham)
    for (const c of du.cau) expect(c).not.toHaveProperty('dapAn')
  })
})

// ─────────────────────────── 5. CHẠY THẬT TRONG JSDOM ───────────────────────────
let boNghe: Array<[string, EventListenerOrEventListenerObject, unknown]> = []
function moPhieu(html: string) {
  for (const [ten, ham, ch] of boNghe) document.removeEventListener(ten, ham, ch as boolean)
  boNghe = []
  for (const k of Object.keys(localStorage)) if (k.indexOf('ddh.lam.') === 0) localStorage.removeItem(k)
  const themGoc = document.addEventListener.bind(document)
  document.addEventListener = ((ten: string, ham: EventListenerOrEventListenerObject, ch?: unknown) => {
    boNghe.push([ten, ham, ch])
    themGoc(ten as keyof DocumentEventMap, ham as EventListener, ch as boolean)
  }) as typeof document.addEventListener
  const thanH = html.slice(html.indexOf('<body'), html.lastIndexOf('</body>'))
  document.documentElement.innerHTML = thanH.replace(/<\/?body[^>]*>/g, '')
  document.body.className = /<body class="([^"]*)"/.exec(html)?.[1] ?? ''
  const js = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n')
  new Function(js)()
}
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!
const chonI = (qid: string, k: number) => document.querySelectorAll<HTMLElement>(`.q-card[data-qid="${qid}"] .q-opt.lam-o`)[k].click()
const gõ = (qid: string, v: string) => {
  const i = $<HTMLInputElement>(`.q-card[data-qid="${qid}"] .lam-nhap`)
  i.value = v
  i.dispatchEvent(new Event('input', { bubbles: true }))
}
const cho = () => new Promise((r) => setTimeout(r, 0))

describe('chạy trong trình duyệt giả: khoá thẻ đã chấm, nộp chặng qua host', () => {
  let guiHost: ReturnType<typeof vi.fn>
  let confirmSpy: ReturnType<typeof vi.fn>
  let fetchSpy: ReturnType<typeof vi.fn>
  let cha: { postMessage: ReturnType<typeof vi.fn> }

  /** Chỉ các tin NỘP CHẶNG (phiếu còn gửi tin nháp `ddh-btvn-draft` mỗi lần em chọn ô — chuyện cũ, không phải đối tượng test này). */
  const nopChang = () => guiHost.mock.calls.filter((c) => c[0]?.type === 'ddh-btvn-nop-chang')

  const cauHon = [
    C({ id: 'q1', dapAn: 'B', buoc: ['Giải q1.'], caNhan: { nhan: 'khoi_dong', daCham: { dung: true, chon: 'B' } } }),
    CHUA[1],
    C({ id: 'q3', phan: 'III', luaChon: null, dapAn: '12,5', buoc: ['Giải q3.'], caNhan: { nhan: 'dang_yeu', daCham: { dung: false, chon: '9' } } }),
    CHUA[3],
  ]
  const daCham = { q1: { dung: true, chon: 'B' }, q3: { dung: false, chon: '9' } }

  beforeEach(() => {
    guiHost = vi.fn()
    cha = { postMessage: guiHost }
    Object.defineProperty(window, 'parent', { value: cha, configurable: true })
    confirmSpy = vi.fn(() => true)
    window.confirm = confirmSpy as unknown as typeof window.confirm
    fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as unknown as typeof fetch
    localStorage.clear()
  })

  it('thẻ đã chấm: đáp án em đã nộp được điền lại, ô đúng tô xanh CHỈ ở thẻ đó, ô nhập bị khoá', () => {
    moPhieu(phieu(cauHon, { daCham }))
    expect($('.q-card[data-qid="q1"] .q-opt.lam-o[aria-checked="true"]').getAttribute('data-chon')).toBe('B')
    expect($<HTMLInputElement>('.q-card[data-qid="q3"] .lam-nhap').value).toBe('9')
    expect($<HTMLInputElement>('.q-card[data-qid="q3"] .lam-nhap').readOnly).toBe(true)
    expect(document.querySelectorAll('.q-opt.dung')).toHaveLength(1)
    expect(document.querySelector('.q-card[data-qid="q1"] .q-opt.dung')?.getAttribute('data-chon')).toBe('B')
    expect(document.querySelector('.q-card[data-qid="q2"] [data-dung]')).toBeNull()
    expect($('#nop-dem').textContent).toBe('2') // hai câu đã làm (đã chấm) được đếm
  })

  it('bấm/gõ vào thẻ đã chấm KHÔNG đổi gì; thẻ chưa chấm vẫn chọn được', () => {
    moPhieu(phieu(cauHon, { daCham }))
    chonI('q1', 0)
    expect($('.q-card[data-qid="q1"] .q-opt.lam-o[aria-checked="true"]').getAttribute('data-chon')).toBe('B')
    gõ('q3', '77')
    expect($<HTMLInputElement>('.q-card[data-qid="q3"] .lam-nhap').value).toBe('77') // ô hiển thị đổi, nhưng…
    // …bộ nhớ của phiếu (nháp) KHÔNG nhận: lưu nháp không có 77
    const nhap = Object.entries(localStorage).filter(([k]) => k.startsWith('ddh.lam.')).map(([, v]) => JSON.parse(v as string))
    for (const n of nhap) expect(n.q3).not.toBe('77')
    chonI('q4', 1)
    expect($('.q-card[data-qid="q4"] .q-opt.lam-o[aria-checked="true"]').getAttribute('data-chon')).toBe('B')
  })

  it('chưa làm câu nào mới ⇒ báo lỗi, KHÔNG gửi gì cho host', () => {
    moPhieu(phieu(cauHon, { daCham }))
    $('#nut-nop').click()
    expect($('#nop-loi').hidden).toBe(false)
    expect($('#nop-loi').textContent).toContain('chưa làm câu nào')
    expect(nopChang()).toHaveLength(0)
  })

  it('còn câu trống: lần bấm đầu HỎI TRÊN TRANG (không window.confirm), lần hai mới gửi; gói chỉ có câu MỚI làm', async () => {
    moPhieu(phieu(cauHon, { daCham }))
    chonI('q4', 1) // q2 (II) để trống
    $('#nut-nop').click()
    await cho()
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(nopChang()).toHaveLength(0)
    expect($('#nop-loi').hidden).toBe(false)
    expect($('#nop-loi').textContent).toContain('Còn 1 câu chưa làm')
    expect($('#nut-nop').textContent).toBe('Nộp chặng')
    $('#nut-nop').click()
    await cho()
    expect(nopChang()).toHaveLength(1)
    expect(nopChang()[0][0]).toEqual({ type: 'ddh-btvn-nop-chang', ma: 'BTVN-abc', sbd: '12121212', chiSo: 0, dapAn: { q4: 'B' } })
    expect(nopChang()[0][1]).toBe('*')
    expect($('#nut-nop').textContent).toBe('Đang nộp…')
    expect(($('#nut-nop') as HTMLButtonElement).disabled).toBe(true)
    expect(fetchSpy).not.toHaveBeenCalled() // phiếu KHÔNG tự gọi mạng
    expect(confirmSpy).not.toHaveBeenCalled()
  })

  it('làm đủ: gửi ngay một lần, không hỏi; không gửi lại đáp án của câu đã chấm', async () => {
    moPhieu(phieu(cauHon, { daCham }))
    chonI('q4', 2)
    // q2 (Phần II) đủ 4 ý
    for (const y of ['a', 'b', 'c', 'd']) $(`.q-card[data-qid="q2"] .tf-item[data-y="${y}"] .tf-badge.lam-o[data-chon="${y === 'a' ? 'D' : 'S'}"]`).click()
    $('#nut-nop').click()
    await cho()
    expect(nopChang()).toHaveLength(1)
    const goi = nopChang()[0][0]
    expect(goi.dapAn).toEqual({ q2: 'DSSS', q4: 'C' })
    expect(Object.keys(goi.dapAn)).not.toContain('q1')
    expect(Object.keys(goi.dapAn)).not.toContain('q3')
  })

  it('lúc đang nộp, bấm thêm ô hoặc nút KHÔNG gửi lần hai', async () => {
    moPhieu(phieu(cauHon, { daCham }))
    chonI('q4', 0)
    $('#nut-nop').click() // hỏi (q2 trống)
    $('#nut-nop').click() // gửi
    await cho()
    $('#nut-nop').click()
    await cho()
    expect(nopChang()).toHaveLength(1)
  })

  it('host báo lỗi: nút quay lại "Nộp chặng", có lời báo, bài làm vẫn giữ; bấm lại gửi được', async () => {
    moPhieu(phieu(cauHon, { daCham }))
    chonI('q4', 3)
    $('#nut-nop').click()
    $('#nut-nop').click()
    await cho()
    expect(nopChang()).toHaveLength(1)
    const ev = new MessageEvent('message', { data: { type: 'ddh-btvn-nop-chang-ket', ok: false, error: 'Không nối được máy chủ' } })
    Object.defineProperty(ev, 'source', { value: cha })
    window.dispatchEvent(ev)
    expect($('#nut-nop').textContent).toBe('Nộp chặng')
    expect(($('#nut-nop') as HTMLButtonElement).disabled).toBe(false)
    expect($('#nop-loi').hidden).toBe(false)
    expect($('#nop-loi').textContent).toBe('Không nối được máy chủ')
    expect($('.q-card[data-qid="q4"] .q-opt.lam-o[aria-checked="true"]').getAttribute('data-chon')).toBe('D')
    $('#nut-nop').click()
    await cho()
    expect(nopChang()).toHaveLength(2)
  })

  it('tin nhắn "kết quả" từ trang KHÁC (không phải trang cha) bị bỏ qua', async () => {
    moPhieu(phieu(cauHon, { daCham }))
    chonI('q4', 0)
    $('#nut-nop').click()
    $('#nut-nop').click()
    await cho()
    const ev = new MessageEvent('message', { data: { type: 'ddh-btvn-nop-chang-ket', ok: false, error: 'giả mạo' } })
    Object.defineProperty(ev, 'source', { value: { postMessage: vi.fn() } })
    window.dispatchEvent(ev)
    expect($('#nut-nop').textContent).toBe('Đang nộp…')
  })

  it('mở phiếu ngoài app (không có trang cha): báo lỗi rõ ràng, không treo nút', async () => {
    Object.defineProperty(window, 'parent', { value: window, configurable: true })
    moPhieu(phieu(cauHon, { daCham }))
    chonI('q4', 0)
    $('#nut-nop').click()
    $('#nut-nop').click()
    await cho()
    expect($('#nut-nop').textContent).toBe('Nộp chặng')
    expect($('#nop-loi').textContent).toContain('mở bài trong app')
  })
})

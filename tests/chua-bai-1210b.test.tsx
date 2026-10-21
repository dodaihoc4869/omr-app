// CHỮA BÀI 12/10B (thầy: "thu gọn tối giản hết lại thành 2 mục" · "chữa câu khó và tính toán cũng phải chiếu lên bảng theo chuẩn nhé" — bản vẽ duyệt):
//   · ỨNG VIÊN mỗi câu = em của lớp làm SAI câu ấy (lần mới nhất), có mặt trước, người đầu rải đều; "Gọi em khác" ⇒ em kế; máy chủ cũ ⇒ tra từng câu;
//   · tờ chuẩn Chiếu lên bảng: ô CÓ EM (người đầu) + danh sách gọi thay; câu có chuyên đề ⇒ Đạt / Chưa đạt ghi qua cầu nối (khoá đúng em đang gọi);
//     thiếu chuyên đề ⇒ không nút, D / K chỉ báo; thẻ tên "Sai câu này N lần · gần nhất dd/mm · số giây";
//   · SỬA CÓ CHỦ ĐÍCH 13/10: trộn chung tính toán/khó/lớp sai nhiều; gọi em tự đúng hoặc dự đoán cao nhất, giữ đủ đề.
//   · giao diện: hai khối (A) Học sinh cần chữa · (B) Chữa câu khó & tính toán; (A) số thứ tự trong ô màu + thanh số em + nút ≥ 48; (B) dòng
//     "Gọi lên bảng: <em> (có mặt, làm sai câu này) · còn N em sai khác", nút chính "Chiếu lên bảng".
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { JSDOM, VirtualConsole } from 'jsdom'
import type { TeacherExamSource } from '../src/data/examContent'

const g = vi.hoisted(() => ({ goi: vi.fn(), kho: vi.fn(), tk: vi.fn(), toast: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => g.goi(duong, body) }))
vi.mock('../src/lib/exam-db', () => ({
  loadExamSources: () => g.kho(),
  loadAllSessionTeacherBanks: async () => [],
  loadScriptUrl: async () => 'https://may-chu.test',
  loadTeacherSecret: async () => 'bi-mat',
}))
vi.mock('../src/lib/ho-so-em-thay', () => ({ layThongKeLopCau: (sbd: string[], qid: string[]) => g.tk(sbd, qid), layHoSoLenBang: async () => null }))
vi.mock('../src/components/KhungXemPhieu', () => ({ default: ({ html, ten }: { html: string; ten?: string }) => <pre data-testid="to-chieu" data-ten={ten}>{html}</pre> }))
vi.mock('../src/lib/chua-cau-sai-thay-api', () => ({ goiChuaThay: async () => ({ ok: true, bat: false, ds: [], conNua: false }) }))
vi.mock('../src/lib/nut-that-api', () => ({ gvDsNutThat: async () => ({ ok: true, nhom: [], kemRieng: [] }), gvGoNutThat: vi.fn() }))

// Cố định mã buổi để kiểm đúng tờ, vẫn chạy Fisher–Yates thật (không mock bộ xếp).
vi.mock('../src/lib/thiet-bi', async (goc) => ({ ...(await goc<Record<string, unknown>>()), sinhMaNgauNhien: () => 'chua-cb-13' }))

import { cauCuaDe, xepThuTuChua } from '../src/lib/thay-tu-chua'
import { dongGoiLenBang, gomLuotSai, laySaiNhieuCau, nhanTheTen, xepUngVien, type SaiCuaCau } from '../src/lib/ung-vien-chua-cau'
import { dungToThayTuChua } from '../src/components/chien-dich/thay-tu-chua-to'
import { chenGoiEmKhac } from '../src/components/chien-dich/to-chieu-goi-em-khac'
import { TIN_TO_CHIEU } from '../src/lib/to-chieu-cau-noi'
import { useAppStore } from '../src/store/appStore'
import ThayTuChua from '../src/components/chien-dich/ThayTuChua'
import TheCanThayChua from '../src/components/chien-dich/TheCanThayChua'

// ───────────────────────── đề mẫu: Bài 8 khối 12 (TN 2 · Đúng–sai 2 · Trả lời ngắn 1); câu Đúng–sai II-1 THIẾU chuyên đề ─────────────────────────
const BAI8: TeacherExamSource = {
  maDe: 'DH-12-C3-B8',
  nhom: '12 · DẠY HỌC/C3 - Amine',
  nguon: 'Bài 8. Amine',
  phanI: [
    { id: 'DH-12-C3-B8-I-1', text: 'Chất nào sau đây là amine bậc hai?', choices: ['a', 'b', 'c', 'd'], correct: 'B', chuyenDe: 'Amine', mucDo: 'biet' },
    { id: 'DH-12-C3-B8-I-2', text: 'Cho 4,5 gam ethylamine tác dụng vừa đủ với dung dịch HCl. Khối lượng muối thu được là', choices: ['8,15 gam', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Amine', mucDo: 'van_dung' },
  ],
  phanII: [
    { id: 'DH-12-C3-B8-II-1', text: 'Cho các phát biểu về tính base của amine:', ideas: ['a', 'b', 'c', 'd'], correct: ['D', 'S', 'D', 'S'] },
    { id: 'DH-12-C3-B8-II-2', text: 'Đốt cháy hoàn toàn 0,1 mol một amine no, đơn chức, mạch hở X thu được 0,3 mol CO2.', ideas: ['a', 'b', 'c', 'd'], correct: ['D', 'D', 'S', 'S'], chuyenDe: 'Amine' },
  ],
  phanIII: [{ id: 'DH-12-C3-B8-III-1', text: 'Cho 0,1 mol aniline tác dụng với nước bromine dư. Khối lượng kết tủa là bao nhiêu gam?', correct: '33', chuyenDe: 'Amine' }],
} as unknown as TeacherExamSource
/** Mã buổi cố định: ba câu tính toán trộn ở đầu, hai câu còn lại giữ thứ tự đề. */
const THU_TU = ['DH-12-C3-B8-II-2', 'DH-12-C3-B8-I-2', 'DH-12-C3-B8-III-1', 'DH-12-C3-B8-I-1', 'DH-12-C3-B8-II-1']
const LOP = [{ tenLop: '12A1', khoi: '12', soEm: 4, sbd: ['S1', 'S2', 'S3', 'S4'] }]
const em = (sbd: string, ten: string, soLanSai: number, lucSai: string, giay: number | null = null) => ({ sbd, ten, soLanSai, lucSai, giay })
/** Máy chủ `/gv/ai-sai-nhieu-cau`: II-2 có ba em sai; II-1 hai em; I-2 một em; III-1 không ai sai (đã làm); I-1 chưa ai làm. */
const SAI_LO: Record<string, SaiCuaCau> = {
  'DH-12-C3-B8-II-2': { lam: 4, sai: [em('S1', 'Đỗ Ngọc Ánh', 2, '2026-10-08T03:00:00Z', 80), em('S2', 'Chu Hương Cúc', 1, '2026-10-09T03:00:00Z', 45), em('S3', 'Lê Khánh Vy', 1, '2026-10-05T03:00:00Z')] },
  'DH-12-C3-B8-II-1': { lam: 3, sai: [em('S1', 'Đỗ Ngọc Ánh', 1, '2026-10-07T03:00:00Z', 30), em('S4', 'Trần Gia Bảo', 1, '2026-10-06T03:00:00Z', 50)] },
  'DH-12-C3-B8-I-2': { lam: 4, sai: [em('S2', 'Chu Hương Cúc', 3, '2026-10-10T03:00:00Z', 95)] },
  'DH-12-C3-B8-III-1': { lam: 2, sai: [] },
}

beforeEach(() => {
  g.goi.mockReset()
  g.kho.mockReset()
  g.tk.mockReset()
  g.toast.mockReset()
  g.kho.mockResolvedValue([BAI8])
  g.tk.mockResolvedValue({})
  g.goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/lop') return { ok: true, du: { lop: LOP } }
    if (duong === '/gv/chien-dich' && b.action === 'danh-sach') return { ok: true, du: { homNay: '2026-10-12', chienDich: [] } }
    if (duong === '/gv/ung-vien-chieu') return { ok: true, du: { cau: {
      'DH-12-C3-B8-II-2': [{ sbd: 'S2', ten: 'Chu Hương Cúc', loai: 'da_dung', p: null, luc: '2026-10-13T00:00:00Z' }],
      'DH-12-C3-B8-I-2': [{ sbd: 'S2', ten: 'Chu Hương Cúc', loai: 'da_dung', p: null, luc: '2026-10-13T00:00:00Z' }],
      'DH-12-C3-B8-II-1': [{ sbd: 'S4', ten: 'Trần Gia Bảo', loai: 'du_bao', p: 0.8, luc: null }],
    } } }
    if (duong === '/gv/ai-sai-nhieu-cau') return { ok: true, du: { ok: true, cau: SAI_LO, conNua: false } }
    // buổi điểm danh đang mở hôm nay: S2 và S4 có mặt
    if (duong === '/gv/buoi-hoc' && b.action === 'gan-day')
      return { ok: true, du: { buoi: [{ id: 'b1', ten: 'Buổi tối', lop: '12A1', moLuc: new Date().toISOString(), hetHan: '', dongLuc: null, dangMo: true, coMat: ['S2', 'S4'] }] } }
    return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
  })
  useAppStore.setState({ showToast: g.toast } as never)
  try {
    localStorage.clear()
  } catch {
    /* bỏ qua */
  }
})
afterEach(cleanup)

// ───────────────────────── ứng viên (thuần) ─────────────────────────
describe('ứng viên mỗi câu: em làm sai, ưu tiên có mặt, gọi em khác', () => {
  it('có mặt trước; người đầu rải đều (không dồn một em) nhưng có mặt luôn thắng; không có điểm danh ⇒ theo số lần sai, coMat null', () => {
    const qids = ['DH-12-C3-B8-II-2', 'DH-12-C3-B8-II-1', 'DH-12-C3-B8-I-2', 'DH-12-C3-B8-III-1', 'DH-12-C3-B8-I-1']
    const coMat = new Set(['S2', 'S4'])
    const x = xepUngVien(qids, SAI_LO, coMat)
    // II-2: S2 có mặt ⇒ đầu, rồi S1 (2 lần sai) · S3
    expect(x.get('DH-12-C3-B8-II-2')!.map((e) => [e.sbd, e.coMat])).toEqual([['S2', true], ['S1', false], ['S3', false]])
    // II-1: S4 có mặt ⇒ đầu
    expect(x.get('DH-12-C3-B8-II-1')!.map((e) => e.sbd)).toEqual(['S4', 'S1'])
    // I-2: chỉ S2 (đã là người đầu câu II-2) ⇒ vẫn S2 (không có ai khác)
    expect(x.get('DH-12-C3-B8-I-2')!.map((e) => e.sbd)).toEqual(['S2'])
    expect(x.get('DH-12-C3-B8-III-1')).toEqual([])
    expect(x.get('DH-12-C3-B8-I-1')).toEqual([])
    // không có buổi điểm danh: theo số lần sai; câu sau tránh người đầu câu trước
    const y = xepUngVien(['A', 'B'], { A: { lam: 3, sai: [em('S1', 'An', 3, '2026-10-01T00:00:00Z'), em('S2', 'Bình', 1, '2026-10-02T00:00:00Z')] }, B: { lam: 3, sai: [em('S1', 'An', 2, '2026-10-01T00:00:00Z'), em('S2', 'Bình', 1, '2026-10-02T00:00:00Z')] } }, null)
    expect(y.get('A')!.map((e) => [e.sbd, e.coMat])).toEqual([['S1', null], ['S2', null]])
    expect(y.get('B')!.map((e) => e.sbd)).toEqual(['S2', 'S1'])
  })

  it('chữ thẻ tên + dòng "Gọi lên bảng" đúng bản vẽ; giây ước tính nói "khoảng"', () => {
    expect(nhanTheTen(em('S1', 'Đỗ Ngọc Ánh', 2, '2026-10-08T03:00:00Z', 80))).toBe('Sai câu này 2 lần · gần nhất 08/10 · 1 phút 20 giây')
    expect(nhanTheTen({ soLanSai: 1, lucSai: '2026-10-07T20:00:00Z', giay: 42, uocTinh: true })).toBe('Sai câu này 1 lần · gần nhất 08/10 · khoảng 42 giây')
    expect(nhanTheTen({ soLanSai: 1, lucSai: '', giay: null })).toBe('Sai câu này 1 lần')
    const x = xepUngVien(['DH-12-C3-B8-II-2'], SAI_LO, new Set(['S2']))
    expect(dongGoiLenBang(x.get('DH-12-C3-B8-II-2')!)).toBe('Gọi lên bảng: Chu Hương Cúc (có mặt, làm sai câu này) · còn 2 em sai khác')
    const y = xepUngVien(['DH-12-C3-B8-II-2'], SAI_LO, new Set(['S9']))
    expect(dongGoiLenBang(y.get('DH-12-C3-B8-II-2')!)).toBe('Gọi lên bảng: Đỗ Ngọc Ánh (chưa điểm danh hôm nay, làm sai câu này) · còn 2 em sai khác')
    expect(dongGoiLenBang(xepUngVien(['DH-12-C3-B8-I-2'], SAI_LO, null).get('DH-12-C3-B8-I-2')!)).toBe('Gọi lên bảng: Chu Hương Cúc (làm sai câu này)')
    expect(dongGoiLenBang([])).toBe('')
  })

  it('MỘT lệnh theo lô cho cả đề; máy chủ cũ (404) ⇒ lùi về /gv/ai-sai-cau từng câu, chỉ em của lớp, gom số lần sai + lần gần nhất', async () => {
    const r = await laySaiNhieuCau(['S1', 'S2'], ['Q1', 'Q2'])
    expect(g.goi).toHaveBeenCalledWith('/gv/ai-sai-nhieu-cau', { sbd: ['S1', 'S2'], qids: ['Q1', 'Q2'] })
    expect(r).toMatchObject({ ok: true, tungCau: false })
    g.goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
      if (duong === '/gv/ung-vien-chieu') return { ok: true, du: { cau: {
      'DH-12-C3-B8-II-2': [{ sbd: 'S2', ten: 'Chu Hương Cúc', loai: 'da_dung', p: null, luc: '2026-10-13T00:00:00Z' }],
      'DH-12-C3-B8-I-2': [{ sbd: 'S2', ten: 'Chu Hương Cúc', loai: 'da_dung', p: null, luc: '2026-10-13T00:00:00Z' }],
      'DH-12-C3-B8-II-1': [{ sbd: 'S4', ten: 'Trần Gia Bảo', loai: 'du_bao', p: 0.8, luc: null }],
    } } }
    if (duong === '/gv/ai-sai-nhieu-cau') return { ok: false, loai: 'chua_co_lenh', chu: 'chưa có' }
      if (duong === '/gv/ai-sai-cau')
        return {
          ok: true,
          du: {
            ok: true,
            ds:
              (b.qids as string[])[0] === 'Q1'
                ? [
                    { sbd: 'S1', ten: 'An', luc: '2026-10-01T00:00:00Z', noi: 'Đảo', giay: 20 },
                    { sbd: 'S1', ten: 'An', luc: '2026-10-03T00:00:00Z', noi: 'Ca', giay: 70 },
                    { sbd: 'X9', ten: 'Lớp khác', luc: '2026-10-04T00:00:00Z', noi: 'Đảo', giay: 5 },
                  ]
                : [],
          },
        }
      return { ok: false, loai: 'chua_co_lenh', chu: '?' }
    })
    const lui = await laySaiNhieuCau(['S1', 'S2'], ['Q1', 'Q2'])
    expect(lui).toEqual({ ok: true, tungCau: true, cau: { Q1: { lam: null, sai: [{ sbd: 'S1', ten: 'An', soLanSai: 2, lucSai: '2026-10-03T00:00:00Z', giay: 70 }] }, Q2: { lam: null, sai: [] } } })
    expect(gomLuotSai([{ sbd: 'S2', ten: 'Bình', luc: 'x', giay: 0 }], new Set(['S2']))).toEqual([{ sbd: 'S2', ten: 'Bình', soLanSai: 1, lucSai: 'x', giay: null }])
  })
})

// ───────────────────────── tờ chiếu có em ─────────────────────────
async function dungTo() {
  const ds = xepThuTuChua(cauCuaDe([BAI8]), null, 'chua-cb-13')
  const uv = xepUngVien(ds.map((c) => c.qid), SAI_LO, new Set(['S2', 'S4']))
  const soLop = new Map([['DH-12-C3-B8-II-2', { sai: 3, lam: 4 }]])
  return { ds, ...(await dungToThayTuChua(ds, [BAI8], { tenBuoi: 'Chữa câu khó · Bài 8', khoi: 12, maPhien: 'PHIEN-cb', soGop: null, ungVien: uv, soLop })) }
}

describe('tờ chuẩn Chiếu lên bảng: ô có em ⇒ Đạt / Chưa đạt khi có chuyên đề; thứ tự câu', () => {
  it('thứ tự câu giữ luật; câu có em sai ⇒ ô CÓ EM (người đầu) + nút Đạt / Chưa đạt khoá đúng em; mọi em gọi thay là ô ghi được; thiếu chuyên đề ⇒ không nút, đếm để báo', async () => {
    const { ds, html, o, soKhongGhi } = await dungTo()
    expect(ds.map((c) => c.qid), JSON.stringify(ds.map(c=>({id:c.qid,tinh:c.tinhToan})))).toEqual(THU_TU)
    const doc = new JSDOM(html).window.document
    const dot = [...doc.querySelectorAll<HTMLElement>('.mc-dot')]
    expect(dot).toHaveLength(5)
    expect(dot.map((d) => d.querySelector('.mc-ten')!.textContent)).toEqual(['Chu Hương Cúc', 'Chu Hương Cúc', 'Cả lớp', 'Cả lớp', 'Trần Gia Bảo'])
    // đợt 1 (II-2, có chuyên đề): nút chấm khoá em đầu; thẻ tên có dòng lịch sử sai
    expect(dot[0]!.querySelector('.mc-cham')!.getAttribute('data-khoa')).toBe('S2|DH-12-C3-B8-II-2')
    expect(dot[0]!.querySelectorAll('.mc-cham-nut')).toHaveLength(2)
    expect(dot[0]!.querySelector('.mc-ls-chu')!.textContent).toBe('Sai câu này 1 lần · gần nhất 09/10 · 45 giây')
    const goiEm = JSON.parse(dot[0]!.getAttribute('data-goi-em')!)
    expect(goiEm).toMatchObject({ coGhi: true, chuLop: '3/4 em lớp sai câu này' })
    expect(goiEm.em.map((e: { sbd: string; khoa: string }) => e.khoa)).toEqual(['S2|DH-12-C3-B8-II-2', 'S1|DH-12-C3-B8-II-2', 'S3|DH-12-C3-B8-II-2'])
    expect(o.get('S1|DH-12-C3-B8-II-2')).toEqual({ sbd: 'S1', hoTen: 'Đỗ Ngọc Ánh', qid: 'DH-12-C3-B8-II-2', chuyenDe: 'Amine' })
    // đợt 2 (II-1, THIẾU chuyên đề): không nút chấm / Thầy chữa; mốc khoá ẩn của em cho X; báo trước 1 câu
    expect(dot[4]!.querySelector('.mc-cham')).toBeNull()
    expect(dot[4]!.querySelector('.mc-thay-chua-nut')).toBeNull()
    expect(dot[4]!.querySelector('.mc-moc-ca-lop')!.getAttribute('data-khoa-tc')).toBe('S4|DH-12-C3-B8-II-1')
    expect(JSON.parse(dot[4]!.getAttribute('data-goi-em')!)).toMatchObject({ coGhi: false })
    expect(soKhongGhi).toBe(1)
    // câu không ai sai ⇒ "Cả lớp" như trước (mốc `|qid`)
    expect(dot[2]!.querySelector('.mc-moc-ca-lop')!.getAttribute('data-khoa-tc')).toBe('|DH-12-C3-B8-III-1')
    expect(dot[2]!.hasAttribute('data-goi-em')).toBe(false)
    // nút "Gọi em khác" được nạp vào tờ (mảnh riêng), Đạt / Chưa đạt có cầu nối
    expect(html).toContain('Gọi em khác')
    expect(doc.body.getAttribute('data-cau-noi')).toBe('PHIEN-cb')
  })

  it('tờ chạy thật: L gọi em đầu (thẻ tên + dòng sai); E "Gọi em khác" ⇒ em kế, ô chấm đổi khoá, bấm Đạt gửi CHAM đúng em; đợt thiếu chuyên đề: D không ghi, ẩn D / K', async () => {
    const { html } = await dungTo()
    const GOC = 'http://localhost:3000'
    const cha = new JSDOM('<!doctype html><body></body>', { url: `${GOC}/` }).window as unknown as Window & { postMessage: (m: unknown) => void }
    const gui: Record<string, unknown>[] = []
    cha.postMessage = ((m: Record<string, unknown>) => void gui.push(m)) as never
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      virtualConsole: new VirtualConsole(),
      beforeParse(w) {
        Object.defineProperty(w, 'parent', { get: () => cha, configurable: true })
        w.setTimeout = (() => 0) as never
        w.setInterval = (() => 0) as never
        w.HTMLElement.prototype.scrollTo = () => {}
        // giảm chuyển động ⇒ bỏ màn gọi tên, sang pha "đang chữa" ngay
        w.matchMedia = (() => ({ matches: true, addEventListener() {}, removeEventListener() {} })) as never
      },
    })
    const d = dom.window.document
    const tuCha = (data: unknown) =>
      dom.window.dispatchEvent(new (dom.window as unknown as { MessageEvent: typeof MessageEvent }).MessageEvent('message', { data, origin: GOC, source: cha as unknown as MessageEventSource }))
    const phim = (key: string) => d.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true }))
    tuCha({ type: TIN_TO_CHIEU.KET_NOI, maPhien: 'PHIEN-cb' })
    const nutEm = d.querySelector<HTMLButtonElement>('#mc-phim-nhom .mc-nut-em-khac')!
    expect(nutEm.textContent).toBe('EGọi em khác')
    expect(nutEm.hidden).toBe(true) // chờ gọi: chưa lộ ai
    expect(d.body.getAttribute('data-pha')).toBe('cho')
    expect(d.querySelector('.mc-tc-lop-sai')!.textContent).toBe('3/4 em lớp sai câu này')
    phim('l')
    expect(d.body.getAttribute('data-pha')).toBe('chua')
    const dot1 = d.querySelectorAll('.mc-dot')[0]!
    expect(dot1.querySelector('.mc-em')!.hasAttribute('hidden')).toBe(false)
    expect(dot1.querySelector('.mc-ten')!.textContent).toBe('Chu Hương Cúc')
    expect(nutEm.hidden).toBe(false)
    phim('e')
    expect(dot1.querySelector('.mc-ten')!.textContent).toBe('Đỗ Ngọc Ánh')
    expect(dot1.querySelector('.mc-ls-chu')!.textContent).toBe('Sai câu này 2 lần · gần nhất 08/10 · 1 phút 20 giây')
    expect(dot1.querySelector('.mc-cham')!.getAttribute('data-khoa')).toBe('S1|DH-12-C3-B8-II-2')
    expect(dot1.querySelector('.mc-nua')!.getAttribute('data-khoa')).toBe('S1|DH-12-C3-B8-II-2')
    dot1.querySelector<HTMLButtonElement>('.mc-cham-nut[data-kq="1"]')!.click()
    expect(gui.filter((t) => t.type === TIN_TO_CHIEU.CHAM).at(-1)).toMatchObject({ khoa: 'S1|DH-12-C3-B8-II-2', dat: true, maPhien: 'PHIEN-cb' })
    // đang chờ ghi ⇒ chưa cho đổi em
    phim('e')
    expect(dot1.querySelector('.mc-ten')!.textContent).toBe('Đỗ Ngọc Ánh')
    tuCha({ type: TIN_TO_CHIEU.PHAN_HOI, maPhien: 'PHIEN-cb', khoa: 'S1|DH-12-C3-B8-II-2', kq: 'da_ghi', dat: true })
    // em kế (vòng hết danh sách) ⇒ ô chấm dựng lại cho em mới
    phim('e')
    expect(dot1.querySelector('.mc-ten')!.textContent).toBe('Lê Khánh Vy')
    expect(dot1.querySelector('.mc-cham')!.getAttribute('data-cham')).toBe('cho')
    expect(dot1.querySelectorAll('.mc-cham-nut')).toHaveLength(2)
    // sang đợt 2 (thiếu chuyên đề): gọi em ⇒ D chỉ báo, không gửi CHAM; D / K ẩn bằng thuộc tính thân tờ
    phim('ArrowRight')
    phim('ArrowRight')
    phim('ArrowRight')
    phim('ArrowRight')
    phim('l')
    const truoc = gui.filter((t) => t.type === TIN_TO_CHIEU.CHAM).length
    phim('d')
    expect(gui.filter((t) => t.type === TIN_TO_CHIEU.CHAM)).toHaveLength(truoc)
    expect(d.body.hasAttribute('data-tc-khong-ghi')).toBe(true)
    expect(d.querySelector('.mc-bao')!.textContent).toBe('Câu này chưa có chuyên đề — chưa ghi Đạt / Chưa đạt vào sổ được')
    // X vẫn tra được ai sai theo khoá em
    phim('x')
    expect(gui.filter((t) => t.type === TIN_TO_CHIEU.AI_SAI).at(-1)).toMatchObject({ khoa: 'S4|DH-12-C3-B8-II-1' })
  })

  it('chèn an toàn: số đợt không khớp ⇒ trả nguyên tờ; CSS chỉ biến màu sẵn có của tờ (không màu thô)', async () => {
    const h = '<body><div class="mc-dot mc-dot-don" data-dot="1"></div></body>'
    expect(chenGoiEmKhac(h, [null, { em: [], coGhi: false, chuLop: 'x' }])).toBe(h)
    expect(chenGoiEmKhac(h, [null])).toBe(h)
    const tep = readFileSync(resolve(__dirname, '../src/components/chien-dich/to-chieu-goi-em-khac.ts'), 'utf8')
    expect(tep).not.toMatch(/rgba?\(|#[0-9a-fA-F]{3,8}\b/)
  })
})

// ───────────────────────── giao diện ─────────────────────────
describe('giao diện hai khối + nút "Chiếu lên bảng"', () => {
  it('(B): người tự đúng/dự đoán, số sai thật cả lớp nhỏ; trộn ưu tiên chung, giữ đủ câu; Chiếu đúng người và báo câu thiếu chuyên đề', async () => {
    render(<ThayTuChua />)
    fireEvent.change(await screen.findByRole('combobox', { name: /Bài trong Dạy học/ }), { target: { value: 'DH-12-C3-B8' } })
    const ds = screen.getByRole('list', { name: 'Thứ tự câu sẽ chiếu' })
    const dong = () => [...ds.querySelectorAll<HTMLElement>('li[data-qid]')]
    expect(dong().map((l) => l.dataset.qid)).toEqual(THU_TU)
    await waitFor(() => expect(dong()[0]!.querySelector('.gvv2-ttc-goi')?.textContent).toBe('Gọi lên bảng: Chu Hương Cúc · Đã tự làm đúng câu này'))
    expect(dong()[4]!.querySelector('.gvv2-ttc-goi')!.textContent).toBe('Gọi lên bảng: Trần Gia Bảo · Dự kiến làm được câu này')
    expect(dong()[0]!.querySelector('.gvv2-ttc-sai')!.textContent).toBe('75% lớp sai3/4 em sai')
    expect(dong()[2]!.querySelector('.gvv2-ttc-goi')!.textContent).toBe('Chưa đủ dữ liệu chọn em — thầy chữa cho cả lớp')
    expect(dong()[3]!.querySelector('.gvv2-ttc-sai')!.textContent).toBe('chưa em nào làm')
    expect([...document.querySelectorAll('.gvv2-ttc-o-so')].map((o) => o.textContent)).toEqual(['5 câu sẽ chiếu', '2 câu Đúng–sai', '3 câu có tính toán', '1 câu khó', '2 câu lớp sai từ 30%'])
    expect(screen.getByText('Câu tính toán, câu khó và câu nhiều em sai được trộn trong nhóm ưu tiên. Gọi em đã tự làm đúng; nếu chưa có, chọn em dự kiến làm được.')).toBeTruthy()
    expect(g.goi.mock.calls.filter(([dd]) => dd === '/gv/ai-sai-nhieu-cau')).toHaveLength(1)

    const nut = screen.getByRole('button', { name: 'Chiếu lên bảng' })
    expect(nut.className).toContain('gvv2-nut-chinh')
    fireEvent.click(nut)
    const to = await screen.findByTestId('to-chieu')
    const doc = new JSDOM(to.textContent!).window.document
    expect(doc.querySelectorAll('.mc-dot')[0]!.querySelector('.mc-cham')!.getAttribute('data-khoa')).toBe('S2|DH-12-C3-B8-II-2')
    expect(g.toast).toHaveBeenCalledWith('1 câu chưa có chuyên đề — trên tờ các câu ấy không có nút Đạt / Chưa đạt (chưa ghi sổ được)', 'warn')
  })

  // SỬA CÓ CHỦ ĐÍCH 21/10 (Hành trình một trang, bước 4 "Chữa câu khó & tính toán" — bản vẽ docs/ban-ve-hanh-trinh-2110): khối câu khó (B) đứng TRƯỚC.
  it('mục Chữa bài: (A) số thứ tự trong ô màu theo loại + thanh số em + nút ≥ 48; (B) mở sẵn, đứng trước; mở một dòng ⇒ hai khối ẩn (không gỡ)', async () => {
    g.goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
      if (duong === '/gv/lop') return { ok: true, du: { lop: LOP } }
      if (duong === '/gv/chien-dich' && b.action === 'danh-sach') return { ok: true, du: { homNay: '2026-10-12', chienDich: [] } }
      return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
    })
    const { container } = render(<TheCanThayChua />)
    const a = screen.getByRole('region', { name: 'Học sinh cần chữa' })
    const b = screen.getByRole('region', { name: 'Chữa câu khó & tính toán' })
    expect(b.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(a).getByRole('button', { name: 'Làm mới' })).toBeTruthy()
    expect(await screen.findByText('Chưa có câu nào cần thầy chữa.')).toBeTruthy()
    // CSS: ô số thứ tự 48, thanh số em, nút ≥ 48 (thang chung), khối B chỉ biến --gvm-*
    const css = readFileSync(resolve(__dirname, '../src/components/chien-dich/thay-tu-chua.css'), 'utf8')
    expect(css).toContain('.gvv2-cb-a .gvv2-cc-bieu { width: 48px; height: 48px; }')
    expect(css).toContain('.gvv2-cb-a .gvv2-cc-nut > button { min-height: var(--nut-phu-cao, 48px); }')
    expect(css).not.toMatch(/rgba?\(|#[0-9a-fA-F]{3,8}\b/)
    expect(container.querySelector('.gvv2-cb-hai')!.hasAttribute('hidden')).toBe(false)
  })
})

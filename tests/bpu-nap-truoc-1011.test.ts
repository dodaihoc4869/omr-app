// @vitest-environment node
// Bình Phản Ứng — NẠP TRƯỚC ứng viên «Lên bảng» (tác tử tốc độ 10/11): em nộp đầu tiên ⇒ bảng nạp sẵn; bấm L / N dùng lại, không chờ chuyến máy chủ.
// Khoá: (1) nạp trước rồi gọi cho danh sách em NHỎ HƠN ⇒ máy chủ chỉ bị gọi MỘT lần và kết quả chỉ có em trong danh sách; (2) câu khác / lớp khác / em ngoài danh sách đã nạp ⇒
// gọi lại; (3) nạp trước lỗi ⇒ bấm L gọi như cũ (không kẹt); (4) kênh khác không dùng đệm.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const goi = vi.hoisted(() => ({ n: 0, loi: false, ds: [] as string[][] }))
vi.mock('../src/lib/goi-lenh-thay', () => ({
  goiLenh: async (_d: string, b: { qids: string[]; sbd: string[] }) => {
    goi.n++; goi.ds.push(b.sbd)
    if (goi.loi) return { ok: false, chu: 'mạng' }
    return { ok: true, du: { ok: true, cau: Object.fromEntries(b.qids.map((q) => [q, b.sbd.map((s) => ({ sbd: s, ten: `Em ${s}`, loai: 'da_dung', p: 1, luc: null }))])), mucDo: {}, em: Object.fromEntries(b.sbd.map((s) => [s, { ten: `Em ${s}`, soLan14: 0, lanCuoiLenBang: null }])), soSai: {}, bpu: { tenDang: '', chuyenDe: '', lbDu: true, em: {} } } }
  },
}))
vi.mock('../src/store/appStore', () => ({ useAppStore: { getState: () => ({ showToast: () => {} }) } }))

beforeEach(() => { goi.n = 0; goi.loi = false; goi.ds = []; vi.resetModules() })
const cho = () => new Promise((r) => setTimeout(r, 5))

describe('đệm ứng viên Bình Phản Ứng', () => {
  it('nạp trước cả lớp rồi gọi cho em có mặt ⇒ MỘT lần gọi máy chủ, kết quả chỉ có em có mặt', async () => {
    const m = await import('../src/lib/ung-vien-chieu')
    m.napTruocBpu(['q1'], ['A', 'B', 'C', 'D'], '12A1')
    const r = await m.napEmChieu(['q1'], ['A', 'B', 'C', 'D'], new Set(['A', 'C']), '12A1', 'bpu')
    expect(goi.n).toBe(1)
    expect(r!.ds.get('q1')!.map((e) => e.sbd).sort()).toEqual(['A', 'C'])
    const r2 = await m.napEmChieu(['q1'], ['A', 'B', 'C', 'D'], new Set(['B']), '12A1', 'bpu') // «Em khác» (N): bỏ em vừa gọi
    expect(goi.n).toBe(1)
    expect(r2!.ds.get('q1')!.map((e) => e.sbd)).toEqual(['B'])
  })
  it('câu khác, lớp khác, hoặc em ngoài danh sách đã nạp ⇒ gọi lại', async () => {
    const m = await import('../src/lib/ung-vien-chieu')
    m.napTruocBpu(['q1'], ['A', 'B'], '12A1')
    await m.napEmChieu(['q2'], ['A'], null, '12A1', 'bpu'); expect(goi.n).toBe(2)
    await m.napEmChieu(['q1'], ['A'], null, '12A2', 'bpu'); expect(goi.n).toBe(3)
    await m.napEmChieu(['q1'], ['A', 'Z'], null, '12A1', 'bpu'); expect(goi.n).toBe(4)
  })
  it('nạp trước lỗi ⇒ bấm L vẫn gọi lại như cũ', async () => {
    const m = await import('../src/lib/ung-vien-chieu')
    goi.loi = true
    m.napTruocBpu(['q1'], ['A', 'B'], '12A1')
    await cho()
    goi.loi = false
    const r = await m.napEmChieu(['q1'], ['A'], new Set(['A']), '12A1', 'bpu')
    expect(goi.n).toBe(2)
    expect(r).not.toBeNull()
  })
  it('kênh khác không dùng đệm; nạp trước hai lần liên tiếp cùng danh sách chỉ gọi một lần', async () => {
    const m = await import('../src/lib/ung-vien-chieu')
    m.napTruocBpu(['q1'], ['A', 'B'], '12A1'); m.napTruocBpu(['q1'], ['A', 'B'], '12A1')
    expect(goi.n).toBe(1)
    await m.napEmChieu(['q1'], ['A'], null, '12A1', 'chua-cau'); expect(goi.n).toBe(2)
  })
})

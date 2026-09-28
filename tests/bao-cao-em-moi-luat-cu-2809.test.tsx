// LUẬT CHUYỂN TỪ BÁO CÁO CŨ SANG BẢN MỚI (28/09, thầy "cho xoá bản báo cáo cũ"). `BaoCaoCaThiHocSinhModal` đã xoá; mọi lối mở báo cáo
// ca của em đi qua `ca-thi/BaoCaoCaCuaEm` → `BaoCaoChiTiet` chế độ em. Tệp này khoá trên bản mới những luật mà bản cũ từng giữ và cần
// DỮ LIỆU GIẢ của máy chủ để kiểm (các luật soi mã nằm lại ở tệp test gốc). Bảng xử lý: docs/hs-lich-su-ca-2809/XOA-BAN-CU.md.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CA_MAU, CAU_MAU, nguonBaoCaoEmMoi, veBaoCaoEmMoi } from './_bao-cao-em-moi'

const m = vi.hoisted(() => ({ ls: null as unknown, cau: null as unknown, goiCau: [] as unknown[][] }))
vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  hsLichSuCaApi: async () => (m.ls instanceof Error ? Promise.reject(m.ls) : m.ls),
  hsCauDaThiApi: async (...a: unknown[]) => {
    m.goiCau.push(a)
    return m.cau instanceof Error ? Promise.reject(m.cau) : m.cau
  },
}))
import BaoCaoCaCuaEm from '../src/components/ca-thi/BaoCaoCaCuaEm'

afterEach(() => {
  cleanup()
  m.goiCau = []
})

const LS_OK = { ok: true, items: [{ ...CA_MAU, tenCa: 'Kiểm tra 45 phút', nopLuc: '2026-09-26T02:42:00Z' }], chuaCongBo: [] }
const CAU_OK = { ok: true, items: CAU_MAU }
const mo = (maCa = 'CA-MAU') => render(<BaoCaoCaCuaEm maCa={maCa} sbd="12001" scriptUrl="" onDong={() => {}} onKhacPhuc={() => {}} />)
const chu = () => document.body.textContent || ''

describe('cấm nuốt lỗi im lặng (luật 15/09 của báo cáo cũ)', () => {
  it('lịch sử hỏng ⇒ HIỆN lý do, không nói dối "chưa có điểm đã công bố"; mã nội bộ máy chủ không lên màn', async () => {
    m.ls = { ok: false, error: 'MAY_CHU_CHUA_CO_LENH' }
    m.cau = CAU_OK
    mo()
    await waitFor(() => expect(chu()).toContain('Chưa tải được kết quả của em.'))
    expect(chu()).not.toContain('Ca này chưa có điểm đã công bố')
    expect(chu()).not.toContain('MAY_CHU_CHUA_CO_LENH')
    expect(screen.getByRole('alert').textContent).toContain('Em kiểm tra mạng')
    // lỗi = lý do thật + THỬ LẠI (chuẩn giao diện mục 2): bấm ⇒ hỏi lại máy chủ, được thì báo cáo hiện ra
    m.ls = LS_OK
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(chu()).toContain('7,25'))
    expect(chu()).not.toContain('Chưa tải được')
  })

  it('lý do máy chủ viết bằng chữ thì chép ra cho em đọc; lỗi mạng tiếng Anh của trình duyệt thì không', async () => {
    m.ls = { ok: false, error: 'Sai mật khẩu học sinh.' }
    m.cau = CAU_OK
    mo()
    await waitFor(() => expect(chu()).toContain('Chưa tải được kết quả của em. Sai mật khẩu học sinh.'))
    cleanup()
    m.ls = new TypeError('Failed to fetch')
    mo()
    await waitFor(() => expect(chu()).toContain('Chưa tải được kết quả của em.'))
    expect(chu()).not.toContain('Failed to fetch')
  })

  it('từng câu hỏng ⇒ vẫn có điểm, nhưng nói rõ chưa tải được câu — KHÔNG "Em đúng trọn mọi câu", không nút làm lại', async () => {
    m.ls = LS_OK
    m.cau = { ok: false, error: 'MAY_CHU_CHUA_CO_LENH' }
    mo()
    await waitFor(() => expect(chu()).toContain('7,25'))
    expect(chu()).toContain('Chưa tải được từng câu của ca này.')
    expect(chu()).not.toContain('Em đúng trọn')
    expect(chu()).not.toMatch(/Làm lại \d+ câu/)
    expect(chu()).not.toContain('MAY_CHU_CHUA_CO_LENH')
  })

  it('đủ dữ liệu ⇒ không có dòng lỗi nào', async () => {
    m.ls = LS_OK
    m.cau = CAU_OK
    mo()
    await waitFor(() => expect(chu()).toContain('Làm lại 2 câu cần chữa'))
    expect(chu()).not.toContain('Chưa tải được')
  })
})

describe('chỉ sau công bố (luật báo cáo cũ giữ nguyên)', () => {
  it('ca còn chờ công bố — kể cả máy chủ lỡ gửi điểm — KHÔNG hiện điểm, không câu, không nút làm lại', async () => {
    m.ls = { ok: true, items: [], chuaCongBo: [{ maCa: 'CA-CHO', tenCa: 'Kiểm tra Ammonia', nopLuc: '2026-09-28T01:20:00Z', tong: 9.5, soCauDung: 27 }] }
    m.cau = { ok: true, items: [{ ...CAU_MAU[1], maCa: 'CA-CHO' }] }
    mo('CA-CHO')
    await waitFor(() => expect(chu()).toContain('Ca này chưa có điểm đã công bố.'))
    expect(chu()).not.toMatch(/9,5|9\.5|Làm lại|Câu hai/)
  })
})

describe('không lộ em khác, không mã nội bộ trên màn em', () => {
  it('báo cáo em không nhận danh sách lớp / bảng cả lớp — không có nguồn nào mang tên hay điểm em khác', () => {
    const n = nguonBaoCaoEmMoi()
    expect(n).toContain('dsEm={[]}')
    expect(n).toContain('lop={null}')
    expect(n).toContain('them={null}')
    expect(n).not.toMatch(/gvBaoCaoCa|\/gv\//)
  })

  it('màn em không in mã ca, mã câu (qid), SBD hay chữ BTVN cũ ("Vòng 1/2/3"…)', () => {
    const { container } = veBaoCaoEmMoi()
    const t = container.textContent || ''
    expect(t).not.toMatch(/CA-MAU|\bq[1-4]\b|SBD|12001/)
    expect(t).not.toMatch(/Vòng [123]|Lõi Căn Bản|Trọng Tâm Cá Nhân|Thử Thách Bứt Phá/)
  })
})

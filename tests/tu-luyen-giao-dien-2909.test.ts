// @vitest-environment node
// TU LUYỆN — nối giao diện (29/09): cửa ở Sảnh đúng chữ, màn nạp lười, máy em không tự chấm (không có hàm chấm / đáp án trong màn làm).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const doc = (p: string) => readFileSync(p, 'utf8')

const cong = doc('src/screens/StudentPortalScreen.tsx')
const man = doc('src/components/tu-luyen/ManTuLuyen.tsx')
const may = doc('server/src/index.ts')

describe('Tu luyện — nối vào app', () => {
  it('cổng học sinh nạp LƯỜI màn Tu luyện và mở từ cửa Sảnh', () => {
    expect(cong).toContain("const ManTuLuyen = lazy(() => import('../components/tu-luyen/ManTuLuyen'))")
    expect(cong).toContain("onTuLuyen={() => setTab('tuluyen')}")
  })
  it('màn làm bài KHÔNG chấm tại máy, không nhập kho đề có đáp án; chấm/đáp án đến từ máy chủ sau nộp', () => {
    expect(man).not.toMatch(/chamCauTuLuyen|khopPhanIII|napKhoChoMayEm|hsCauSaiApi|deTheoDangBai|cauKhacPhuc/)
    expect(man).toContain("cheDo: 'thi' as const")
    expect(man).toContain("cheDo: 'xem_lai' as const")
    // SỬA CÓ CHỦ Ý 18/10: giữ nguyên mã chấm/lặp và lượt. Máy chủ mới xác minh mã NỘI DUNG thực tế, thay vì mở nhầm câu gốc.
    // Hành vi Câu7/câu anh em, lượt cũ và ~2 được chạy thật trong hoi-thay-*-1810, không chỉ so chuỗi nguồn.
    expect(man).toContain("hoiThay: { qid: c.qid, nguon: 'tu_luyen', luotId")
  })
  it('máy chủ định tuyến /hs/tu-luyen/*', () => {
    expect(may).toContain("if (p.startsWith('/hs/tu-luyen/')) return ra(await tuLuyen(env, p.slice('/hs/tu-luyen/'.length), b))")
  })
  it('máy chủ Tu luyện không nhập mô-đun EXP / sổ sự kiện / kế hoạch ngày', () => {
    const tl = doc('server/src/tu-luyen.ts')
    const nhap = tl.split('\n').filter((d) => d.startsWith('import')).join('\n')
    expect(nhap).not.toMatch(/exp-|su-kien-hoc|ke-hoach-ngay|cnh-exp|game-v2-luot|qid_da_lam/)
    expect(tl).not.toMatch(/INSERT[^`]*(su_kien_hoc|exp_|qid_da_lam|ke_hoach)/)
  })
})

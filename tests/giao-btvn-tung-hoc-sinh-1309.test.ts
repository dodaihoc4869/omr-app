// BÀI KIỂM TRA: Giao bài tập về nhà cho từng học sinh có ô tick
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const PC = doc('src/screens/PhanCongScreen.tsx')
const BTVN_LIB = doc('src/lib/btvn-may-chu-moi.ts')
const SERVER = doc('server/src/index.ts')

describe('GIAO BTVN CHO TỪNG HỌC SINH', () => {
  // 02/11: cập nhật theo cf1384ed6 (chế độ chọn từng em nay tên «Theo em» = 'theo_em'; 'hoc_sinh' thành «Gửi theo khối lớp»)
  it('PhanCongScreen có chế độ Theo ca kiểm tra và chế độ chọn từng em («Theo em»)', () => {
    expect(PC).toContain('Theo ca kiểm tra')
    expect(PC).toContain('Theo em')
    expect(PC).toContain("const [cheDo, setCheDo] = useState<'ca' | 'hoc_sinh' | 'theo_em'>('ca')")
  })

  it('PhanCongScreen ẩn chọn ca thi khi ở chế độ giao cho từng học sinh', () => {
    expect(PC).toContain("{cheDo === 'ca' && (")
    // 02/11: cập nhật theo cf1384ed6 (nút Giao khoá theo từng chế độ: chế độ Theo em chưa tick em nào, hoặc chưa tick tờ đề ⇒ khoá)
    expect(PC).toContain("(cheDo === 'theo_em' && sbdChonTheoEm.size === 0) ||")
    expect(PC).toMatch(/\|\|\s*daChon\.size === 0\s*\}/)
  })

  it('PhanCongScreen hiển thị ô danh sách học sinh có ô tick và tìm kiếm', () => {
    // 02/11: cập nhật theo cf1384ed6 (khối chọn từng em của chế độ Theo em: tiêu đề, ô tìm, ô tick toggleSbdTheoEm)
    expect(PC).toContain('Chọn học sinh nhận bài tập')
    expect(PC).toContain('Chọn tất cả (')
    expect(PC).toContain('Bỏ chọn')
    expect(PC).toContain('placeholder="Tìm tên hoặc số báo danh…"')
    expect(PC).toContain('role="checkbox"')
    expect(PC).toContain('toggleSbdTheoEm(e.sbd)')
  })

  it('giaoBtvn ở client thư viện hỗ trợ dsSbd và cho phép ca rỗng', () => {
    expect(BTVN_LIB).toContain('dsSbd?: string[]')
    expect(BTVN_LIB).toContain('coSbd')
    // 02/11: cập nhật theo b52706159 (thêm dsSbdThem — em chọn thêm ngoài ca — cũng đủ để giao khi không tick ca)
    expect(BTVN_LIB).toContain('if (dsMaCa.length === 0 && !coSbd && !dsSbdThem?.length)')
  })

  it('Server giaoBtvn tiếp nhận dsSbd và lọc đúng học sinh được chọn', () => {
    expect(SERVER).toContain('const dsSbd = Array.isArray(b.dsSbd)')
    expect(SERVER).toContain('if (dsMaCa.length === 0 && dsSbd.length > 0)')
    expect(SERVER).toContain('setSbd.has(String(e.sbd))')
  })

  it('hsBtvn truy vấn đúng các cột thực tế của bảng btvn và btvn_em', () => {
    const GOI_CU = doc('server/src/goi-cu.ts')
    expect(GOI_CU).toContain('SELECT be.ma_btvn, be.sbd, be.nop_luc, be.so_dung, be.so_cau AS em_so_cau')
    expect(GOI_CU).toContain('b.ma_ca, b.ma_de, b.han_nop, b.so_cau, b.giao_luc')
    expect(GOI_CU).not.toContain('be.diem, be.so_dung, be.so_sai')
  })

  it('StudentPortalScreen có nút làm mới bài tập và nút vào làm bài trực tiếp', () => {
    const PORTAL = doc('src/screens/StudentPortalScreen.tsx')
    expect(PORTAL).toContain('napLaiBtvn')
    expect(PORTAL).toContain('moBaiTap')
    expect(PORTAL).toContain('Tải lại danh sách')
  })

  it('StudentPortalScreen hỗ trợ nút Làm lại bài tập tối đa 3 lần kèm xác nhận', () => {
    const PORTAL = doc('src/screens/StudentPortalScreen.tsx')
    expect(PORTAL).toContain('Xem lại bài')
    expect(PORTAL).toContain('Làm lại (còn')
    expect(PORTAL).toContain('Đã hết lượt làm lại')
    expect(PORTAL).toContain('Cần Thầy gia hạn để làm lại')
    expect(PORTAL).toContain('Em đã dùng hết 3 lượt làm lại bài tập về nhà này')
    expect(PORTAL).toContain('moBaiTap(bt, true)')
  })

  it('Server và Client BTVN hỗ trợ nộp lại tối đa 3 lần', () => {
    const GOI_CU = doc('server/src/goi-cu.ts')
    expect(GOI_CU).toContain('daLam >= 4')
    expect(GOI_CU).toContain('Em đã dùng hết 3 lượt làm lại bài tập này')
    const CHO_EM = doc('src/lib/btvn-cho-em.ts')
    // 02/11: cập nhật theo 21d88c572 (tuyChon thêm soCauSang; cờ lamLai giữ nguyên)
    expect(CHO_EM).toContain('tuyChon?: { lamLai?: boolean; soCauSang?: number }')
    expect(CHO_EM).toContain('Thầy cho phép làm lại tối đa 3 lần')
  })
})

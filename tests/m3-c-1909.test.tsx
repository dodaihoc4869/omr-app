// Việc C · nhóm C (Code 4): báo cáo ca kiểm tra + tiến bộ — BaoCaoCaThiPhuHuynhModal (chỉ phụ huynh), BieuDoTienBoGoogle (biểu đồ, còn app giáo viên dùng), TheTienBo.
// 27/10: BaoCaoCaThiPhuHuynhModal và TheTienBo đã gỡ khỏi src/ vì không màn nào dùng ⇒ bỏ các khối vẽ hai thành phần ấy (biểu đồ BieuDoTienBoGoogle còn kiểm ở bieu-do-tien-bo-theo-diem-tu-cham-0909).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
// @ts-expect-error — tệp .mjs của scripts/, không có khai báo kiểu
import { TEP } from '../scripts/sinh-m3-tuong-thich.mjs'

const goc = process.cwd()
const doc = (p: string) => fs.readFileSync(path.join(goc, p), 'utf8')

describe('phạm vi bộ sinh lớp tương thích (nhóm B + C + A2)', () => {
  // 28/09: BaoCaoCaThiHocSinhModal ĐÃ XOÁ (thầy cho phép) ⇒ bỏ khỏi phạm vi quét; các lớp màu chỉ nó mang được GIỮ trong `LOP_GIU_LAI`
  // của bộ sinh nên tệp CSS sinh ra không mất luật nào (các màn khác trong vỏ `.m3` vẫn dùng).
  it('9 tệp của cổng học sinh/phụ huynh (nhóm B + C + A2 + C8 + C9; bỏ modal học sinh cũ, BaoCaoCaThiPhuHuynhModal, KhoiBaPhan đã xoá) + 15 tệp APP GIÁO VIÊN (G1 21/09)', () => {
    const ten = TEP.map((t: string) => path.basename(t)).sort()
    const HS_PH = ['BangTinPhuHuynh.tsx', 'BieuDoTienBoGoogle.tsx', 'DongDemCau.tsx', 'KhoiCauSai.tsx', 'KhoiKhacPhuc3CheDo.tsx', 'LuyenDeChuan.tsx', 'ModalKhacPhucCauSai.tsx', 'ParentPortalScreen.tsx', 'PhongChoGame.tsx']
    const GIAO_VIEN = ['CaiDatScreen.tsx', 'CauHoiScreen.tsx', 'ClassListScreen.tsx', 'ExamHubScreen.tsx', 'ExamMonitorScreen.tsx', 'ExamSetupScreen.tsx', 'GoiLenBangScreen.tsx', 'HocSinhScreen.tsx', 'HopChonDe.tsx', 'KhoiMatKhauApp.tsx', 'KhoiMayChuMoi.tsx', 'LichSuCaScreen.tsx', 'NganHangDeScreen.tsx', 'NutQuayLai.tsx', 'PhanCongScreen.tsx']
    expect(ten).toEqual([...HS_PH, ...GIAO_VIEN].sort())
  })
  it('ánh xạ cả màu gradient (from-/via-/to-) → biến điểm dừng --tw-gradient-*, mọi luật vẫn có tiền tố `.m3 `', () => {
    const css = doc('src/components/m3/m3-tuong-thich.css')
    expect(css).toMatch(/\.m3 \.from-slate-50 \{ --tw-gradient-from: var\(--m3-surface-container-low\); \}/)
    expect(css).toMatch(/\.m3 \.to-blue-50\\\/40 \{ --tw-gradient-to: var\(--m3-primary-container\); \}/)
    expect(css).toMatch(/\.m3 \.via-white \{ --tw-gradient-via: var\(--m3-surface-container-lowest\); \}/)
  })
})

// KHẮC PHỤC CÂU SAI — MỘT NGUỒN DUY NHẤT CHO MỌI MÁY. 14/09.
//
// Thầy báo: "Tạo câu khắc phục trên điện thoại của học sinh và máy tính đang
// lệch nhau. Kiểm tra kĩ xem đúng sai ở đâu sửa và đồng bộ chính xác."
//
// ─────────────────────────────────────────────────────────────────────────
// ĐO THẬT (ảnh thầy chụp) — CÙNG một em, CÙNG ca Test6, CÙNG 10 câu sai:
//
//                        điện thoại        máy tính
//   Số câu rút luyện tập  31 / 60          20 / 579
//   Câu 1 (I)             tối đa  2        tối đa  3
//   Câu 2 (I)             tối đa  2        tối đa  3
//   Câu 3 (I)             tối đa  0        tối đa  0
//   Câu 4 (I)             tối đa 14        tối đa 75
//
// NGUYÊN NHÂN GỐC: `ModalKhacPhucCauSai` đọc `loadExamSources()` TRƯỚC, chỉ
// khi máy rỗng mới xin máy chủ. `loadExamSources()` là kho trong IndexedDB
// CỦA CHÍNH MÁY ĐANG MỞ:
//   · Điện thoại em rỗng (đồng bộ kho đòi mã bí mật) ⇒ xin máy chủ ⇒ trần 60.
//   · Máy tính thầy có KHO ĐẦY ĐỦ. Cổng học sinh mở trên máy ấy dùng chung
//     gốc nên đọc luôn kho của thầy ⇒ 579.
//
// Không con số nào "tính sai" — HAI NGUỒN KHÁC NHAU. Và nguồn thứ hai còn sai
// ranh giới dữ liệu: màn của EM không được đọc kho của THẦY chỉ vì tình cờ mở
// trên máy thầy.
//
// Tệp này chốt: chỉ còn MỘT nguồn, và hai trần hai bên bằng nhau.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { SO_CAU_XIN_KHO } from '../src/lib/kho-cho-may-em'

const GOC = process.cwd()
const doc = (p: string) => fs.readFileSync(path.join(GOC, p), 'utf8')
/** Bỏ chú thích trước khi soi MÃ CHẠY. Chính tệp modal GIẢI THÍCH vì sao
 * không đọc `loadExamSources()` nữa, nên chữ ấy còn trong chú thích — và phải
 * còn, để phiên sau đọc là biết đừng viết lại. */
const boChuThich = (ma: string) => ma.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
const MODAL_DAY_DU = doc('src/components/ModalKhacPhucCauSai.tsx')
const MODAL = boChuThich(MODAL_DAY_DU)
const SRV = doc('server/src/goi-cu.ts')

describe('Một nguồn duy nhất', () => {
  it('modal KHÔNG còn đọc kho trong máy đang mở', () => {
    // Đây là dòng đã làm hai máy lệch nhau. Còn nó là còn lệch.
    expect(MODAL).not.toContain('loadExamSources')
    // Và cũng không được nhập lại hàm ấy vào tệp.
    expect(MODAL_DAY_DU).not.toMatch(/^import .*loadExamSources/m)
  })

  it('modal LUÔN xin máy chủ khi có câu sai, không đợi máy rỗng mới xin', () => {
    expect(MODAL).toContain('if (dsCauSai.length > 0) {')
    expect(MODAL).toContain('await napKhoChoMayEm(url || \'\', sbd, dsCauSai)')
    // Điều kiện cũ "chỉ xin khi máy rỗng" phải biến mất hẳn.
    expect(MODAL).not.toContain('sources.length === 0 && dsCauSai.length > 0')
  })

  it('modal chỉ dùng ở màn của EM và PHỤ HUYNH — không cướp kho màn của thầy', () => {
    const dung = ['src/screens/StudentPortalScreen.tsx', 'src/screens/ParentPortalScreen.tsx', 'src/components/BaoCaoCaThiHocSinhModal.tsx', 'src/components/BaoCaoCaThiPhuHuynhModal.tsx']
    for (const f of dung) expect(doc(f), f).toContain('ModalKhacPhucCauSai')
  })
})

describe('Hai trần hai bên phải BẰNG NHAU', () => {
  it('máy chủ khai trần thành hằng có tên, không rải số trần trong mã', () => {
    expect(SRV).toContain('export const TRAN_CAU_KHAC_PHUC = 200')
    expect(SRV).toContain('Math.min(TRAN_CAU_KHAC_PHUC, Number(b.soCau) || 20)')
    // Số 60 cũ không được còn sót lại ở cửa này.
    expect(SRV).not.toContain('Math.min(60, Number(b.soCau) || 20)')
  })

  it('máy em xin ĐÚNG bằng trần máy chủ — xin quá là hiện số máy chủ không trả nổi', () => {
    const m = SRV.match(/export const TRAN_CAU_KHAC_PHUC = (\d+)/)
    expect(m, 'không đọc được trần máy chủ').not.toBeNull()
    expect(SO_CAU_XIN_KHO).toBe(Number(m![1]))
  })

  it('vùng đọc tờ đề đã nới, vì nay đây là vùng chọn duy nhất của mọi máy', () => {
    const m = SRV.match(/const TRAN_TO_DE_THEO_DANG = (\d+)/)
    expect(m).not.toBeNull()
    expect(Number(m![1])).toBeGreaterThanOrEqual(40)
  })

  it('vẫn CÒN trần — bỏ trần là gói to, máy em tải cả phút', () => {
    expect(SO_CAU_XIN_KHO).toBeLessThanOrEqual(300)
    const m = SRV.match(/const TRAN_TO_DE_THEO_DANG = (\d+)/)
    expect(Number(m![1])).toBeLessThanOrEqual(60)
  })
})

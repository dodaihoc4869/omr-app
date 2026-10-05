// ĐỒNG BỘ THƯ MỤC MỤC ĐÍCH CỦA KHO LÊN MÁY CHỦ (OMNI 3 · hợp đồng docs/hop-dong-omni-3.md mục B `/kho/thu-muc`; đặc tả mục 2).
// App thầy mở (đã mở khoá) ⇒ tối đa MỘT lần mỗi ngày (nhớ ngày Việt Nam bằng localStorage, mọi đọc/ghi bọc try/catch) gửi thư mục của MỌI tờ
// trong kho trên máy (DAY_HOC / TU_LUYEN, `cay-muc-dich.ts`) theo lô ≤ 400 mã. Chạy nền, KHÔNG hiện gì, không ném lỗi:
//   · gửi đủ ⇒ ghi ngày · máy chủ chưa có lệnh / từ chối ⇒ cũng ghi ngày (mai thử lại, không gõ cửa mỗi lần mở app)
//   · mất mạng / chậm / trả lời lạ ⇒ KHÔNG ghi ngày (lần mở sau thử lại) · kho trống ⇒ không gửi, không ghi.
import type { TeacherExamSource } from '../data/examContent'
import { guiThuMucKho } from '../components/chien-dich/api-omni'
import { ngayVn } from '../components/chien-dich/ngay'
import { chiaLo, dsThuMucKho, LO_THU_MUC } from './cay-muc-dich'

export const KHOA_NGAY_THU_MUC = 'ddh.thuMucKho.ngay'

function docNgay(): string {
  try {
    return globalThis.localStorage?.getItem(KHOA_NGAY_THU_MUC) ?? ''
  } catch {
    return ''
  }
}
function ghiNgay(ngay: string) {
  try {
    globalThis.localStorage?.setItem(KHOA_NGAY_THU_MUC, ngay)
  } catch {
    /* máy chặn bộ nhớ: lần mở sau gửi lại — vô hại (máy chủ ghi đè cùng giá trị) */
  }
}
async function napKhoMacDinh(): Promise<TeacherExamSource[]> {
  const { loadExamSources } = await import('./exam-db')
  return loadExamSources()
}

export type KetQuaDongBoThuMuc = 'da_gui' | 'hom_nay_roi' | 'kho_trong' | 'may_chu_tu_choi' | 'loi_tam'

/** Gửi thư mục mục đích của kho lên máy chủ nếu hôm nay chưa gửi. `nap` cho test thay nguồn kho. */
export async function dongBoThuMucKho(nowMs: number = Date.now(), nap: () => Promise<TeacherExamSource[]> = napKhoMacDinh): Promise<KetQuaDongBoThuMuc> {
  const homNay = ngayVn(nowMs)
  if (docNgay() === homNay) return 'hom_nay_roi'
  let ds: TeacherExamSource[]
  try {
    ds = await nap()
  } catch {
    return 'loi_tam'
  }
  const dong = dsThuMucKho(ds ?? [])
  if (!dong.length) return 'kho_trong'
  for (const lo of chiaLo(dong, LO_THU_MUC)) {
    const r = await guiThuMucKho(lo)
    if (!r.ok) {
      if (r.loai === 'chua_co_lenh' || r.loai === 'tu_choi') {
        ghiNgay(homNay)
        return 'may_chu_tu_choi'
      }
      return 'loi_tam'
    }
  }
  ghiNgay(homNay)
  return 'da_gui'
}

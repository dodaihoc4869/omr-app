// BẢNG BÀI OMNI trong Bảng chiến dịch (OMNI 3 · hình docs/omni-0510/GV-BangBai.jpg — chỉ lấy NỘI DUNG, bố cục giữ đúng bảng chiến dịch sẵn có).
// Phần TÍNH THUẦN: màu ô theo P (dùng lại 4 lớp màu `cd-o--L1…L4` của thang đang dùng), ghép cột dạng của bảng cũ (tên dạng) với dạng OMNI (mã + tên),
// trung bình lớp, ba nhóm "Cần thầy chữa". Không IO. Test: `tests/omni-3-thay-bang-bai.test.tsx`.
import { THAM_SO_OMNI, type BangOmni, type CanThayChua } from '../../../server/src/omni-kieu'
import { qidCuaDong, type CauCanDayLai, type HangEm } from './api'

/** Ngưỡng màu ô P (chú giải hình GV-BangBai): ≥ 0,95 vững (đúng ngưỡng K của chứng chỉ) · 0,80–0,95 · 0,50–0,80 · dưới 0,50. Chỉ để tô màu. */
export const NGUONG_MAU_P = Object.freeze({ vung: THAM_SO_OMNI.K_P_VKN, cao: 0.8, giua: 0.5 })

/** Lớp màu của ô P — cùng 4 lớp màu thang hạng đang dùng (nhạt → đậm). */
export function mucP(p: number): HangEm {
  return p >= NGUONG_MAU_P.vung ? 'L4' : p >= NGUONG_MAU_P.cao ? 'L3' : p >= NGUONG_MAU_P.giua ? 'L2' : 'L1'
}
/** Chú giải màu ô P (chữ kèm màu — màu không là kênh duy nhất). */
export const CHU_GIAI_P: { hang: HangEm; chu: string }[] = [
  { hang: 'L1', chu: 'P dưới 0,50' },
  { hang: 'L2', chu: 'P 0,50–0,80' },
  { hang: 'L3', chu: 'P 0,80–0,95' },
  { hang: 'L4', chu: 'P từ 0,95 (vững)' },
]

/** Một cột dạng của bảng khi có OMNI: `ten` = khoá cột của bảng cũ (tên dạng), `ma` = mã dạng OMNI (null ⇒ dạng không có số P). */
export interface CotDang {
  ten: string
  ma: string | null
  /** Dạng chỉ OMNI có (bảng cũ không có cột) — thêm vào cuối. */
  moi: boolean
}

/** Ghép cột: giữ NGUYÊN thứ tự cột cũ (theo tên dạng), mỗi cột tìm dạng OMNI cùng tên hoặc cùng mã; dạng OMNI chưa khớp cột nào thêm vào cuối. */
export function ghepCotDang(cotCu: readonly string[], dangOmni: readonly { ma: string; ten: string }[]): CotDang[] {
  const daDung = new Set<string>()
  const ra: CotDang[] = cotCu.map((ten) => {
    const d = dangOmni.find((x) => !daDung.has(x.ma) && (x.ten === ten || x.ma === ten))
    if (d) daDung.add(d.ma)
    return { ten, ma: d?.ma ?? null, moi: false }
  })
  for (const d of dangOmni) if (!daDung.has(d.ma)) ra.push({ ten: d.ten || d.ma, ma: d.ma, moi: true })
  return ra
}

/** P trung bình lớp ở một dạng (chỉ em có số); không em nào có ⇒ null. */
export function tbPLop(om: Pick<BangOmni, 'o'>, ma: string | null): number | null {
  if (!ma) return null
  const ds = Object.values(om.o)
    .map((h) => h?.[ma]?.p)
    .filter((p): p is number => typeof p === 'number' && Number.isFinite(p))
  return ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : null
}

/** Sơ ý trung bình lớp (em có số). */
export function tbSoY(om: Pick<BangOmni, 'sEm'>): number | null {
  const ds = Object.values(om.sEm).filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
  return ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : null
}

/** Em sơ ý cao (cùng ngưỡng nhóm "Cần thầy chữa" loại 3). */
export const laSoYCao = (s: number | null | undefined): boolean => typeof s === 'number' && s > THAM_SO_OMNI.SO_Y_CAO

export type LoaiCanThayChua = CanThayChua['loai']
/**
 * Ba nhóm "Cần thầy chữa" — nghĩa theo đặc tả (mục 0). THỨ TỰ (thầy lệnh 05/10, làm lại 06/10): câu sai từ 4 lần đã rời kế hoạch lên ĐẦU thẻ
 * (câu em bỏ rồi — việc thầy chữa gấp nhất), rồi vi kỹ năng có thẻ nút thắt, rồi em sơ ý cao. Máy chủ (`omni-gv.ts` `bang`) dựng cùng thứ tự.
 */
export const NHOM_CAN_THAY_CHUA: { loai: LoaiCanThayChua; ten: string; rong: string }[] = [
  { loai: 'cat_tia', ten: 'Câu sai từ 4 lần, đã rời kế hoạch', rong: 'Chưa có câu nào sai từ 4 lần.' },
  { loai: 'nut_that', ten: 'Vi kỹ năng có thẻ nút thắt (em đã qua thang tự gỡ mà vẫn vướng)', rong: 'Chưa có vi kỹ năng nào vướng.' },
  { loai: 'so_y', ten: 'Em sơ ý cao dù kiến thức vững', rong: 'Chưa em nào sơ ý cao.' },
]

/** Mức độ trong kho → chữ chuẩn (cùng bảng của thẻ "Cần thầy dạy lại"). */
const TEN_MUC_DO: Record<string, string> = { biet: 'Nhận biết', hieu: 'Thông hiểu', van_dung: 'Vận dụng' }

/** Gom danh sách "Cần thầy chữa" theo ba nhóm. Máy chủ chưa gửi dòng nào loại `cat_tia` ⇒ dựng từ "Cần thầy dạy lại" sẵn có (cùng nghĩa: sai ≥ 4 lần). */
export function nhomCanThayChua(ds: readonly CanThayChua[], canDayLai: readonly CauCanDayLai[]): { loai: LoaiCanThayChua; ten: string; rong: string; dong: CanThayChua[] }[] {
  return NHOM_CAN_THAY_CHUA.map((n) => {
    let dong = ds.filter((x) => x.loai === n.loai)
    if (n.loai === 'cat_tia' && dong.length === 0)
      // Câu gộp từ nhiều bản trùng nội dung (`qidCung`, thầy 05/10) ⇒ "Chữa xong" mở khoá đủ cả nhóm.
      dong = canDayLai.map((c) => ({
        loai: 'cat_tia' as const,
        tieuDe: `Câu ${c.stt} · ${c.dang}`,
        phu: c.mucDo ? (TEN_MUC_DO[c.mucDo] ?? String(c.mucDo)) : '',
        soEm: c.soEm,
        qids: qidCuaDong(c),
      }))
    return { ...n, dong }
  })
}

// HỢP ĐỒNG CHUNG CỦA MỌI ĐƯỜNG PHÁT CÂU — CNH-1.0 P06 (02 §7.1 + 06 T42 "không sót đường gọi").
//
// VÌ SAO tệp này: T42 đòi "mọi adapter đi shared engine HOẶC ngoại lệ teacher/exam có tên". Muốn kiểm được
// điều đó thì phải có DANH SÁCH ĐƯỜNG PHÁT CÂU ở MỘT chỗ, kèm cách dùng hợp đồng chung:
//   · `engine`   = đi `chonCauChoLuot` (scope → trần độ khó → lặp → điểm §7.2 → ngân sách → giành chỗ);
//   · `ke_hoach` = đi bộ điều phối NGÀY (`lapKeHoachNgay`) — đã có scope (P02) + ngân sách ngày + hạn gốc;
//   · `ngoai_le` = ngoại lệ CÓ TÊN (thi/ca · giáo viên ghim bài) — nêu rõ tên + vì sao không nới sang kênh khác.
//
// Hợp đồng chung gồm 6 phần: scope · difficulty · repeat · budget · reserve · score (xem `HOP_DONG`).
import type { Env } from './kieu'

export const HOP_DONG = ['scope', 'difficulty', 'repeat', 'budget', 'reserve', 'score'] as const
export type PhanHopDong = (typeof HOP_DONG)[number]

export type CachDung = 'engine' | 'ke_hoach' | 'ngoai_le'

export interface DuongPhatCau {
  /** Đường trong `server/src/index.ts` (khớp `p === '<path>'` hoặc tiền tố). */
  path: string
  /** Tiền tố (khớp `p.startsWith`) hay khớp chính xác. */
  tienTo?: boolean
  cach: CachDung
  /** Phần hợp đồng đã áp ở đường này. */
  hopDong: readonly PhanHopDong[]
  /** Bắt buộc khi `cach = 'ngoai_le'`: tên ngoại lệ + giới hạn phạm vi. */
  ngoaiLeTen?: string
  ghiChu?: string
}

/**
 * DANH SÁCH ĐƯỜNG PHÁT CÂU (chọn/thả câu cho học sinh). Thêm đường mới phải khai ở đây; test
 * `tests/cnh-1-0-hop-dong-chung-p06.test.ts` đối chiếu hai chiều với `server/src/index.ts`.
 */
export const DUONG_PHAT_CAU: readonly DuongPhatCau[] = [
  { path: '/game-v2', tienTo: true, cach: 'engine', hopDong: [...HOP_DONG], ghiChu: 'lượt Đảo/Đoàn qua `chonCauChoLuot` khi cờ `ngan_sach_luot` BẬT' },
  { path: '/hs/ke-hoach-ngay', cach: 'ke_hoach', hopDong: ['scope', 'budget', 'score'], ghiChu: 'bộ điều phối NGÀY: việc ôn/BTVN/Mom lấy từ kế hoạch đã chốt' },
  { path: '/hs/thu-thach-hom-nay', tienTo: true, cach: 'ngoai_le', hopDong: ['scope'], ngoaiLeTen: 'thu_thach_rieng_bo_nao', ghiChu: 'thẻ thử thách do Bộ não chốt trước; chưa đi bộ chọn chung ⇒ ghi nhận là ngoại lệ tạm, có tên' },
  { path: '/hs/on-lai', tienTo: true, cach: 'ngoai_le', hopDong: ['scope', 'repeat'], ngoaiLeTen: 'on_lai_nop_theo_qid', ghiChu: 'NỘP câu đã phát (`layCauChoEm` kiểm đã gặp + bảo vệ), không tự chọn câu mới' },
  { path: '/vo-dai', tienTo: true, cach: 'ngoai_le', hopDong: ['scope'], ngoaiLeTen: 'vo_dai_doi_khang', ghiChu: 'đấu đối kháng theo ca/giải; câu do luật võ đài chọn, không dùng để tính đạt ngày' },
  { path: '/luyen-de', tienTo: true, cach: 'ngoai_le', hopDong: ['scope'], ngoaiLeTen: 'luyen_de_tron_de', ghiChu: 'luyện TRỌN ĐỀ theo yêu cầu: giữ nội dung đề, KHÔNG dùng để tính đạt ngày' },
  { path: '/goi', cach: 'ngoai_le', hopDong: [], ngoaiLeTen: 'kenh_cu_appscript', ghiChu: 'kênh CŨ (Apps Script) — giữ để lùi, không cấp câu mới theo cá nhân' },
]

/** Tra đường theo `path` (khớp chính xác hoặc tiền tố). */
export function traDuong(p: string): DuongPhatCau | undefined {
  return DUONG_PHAT_CAU.find((d) => (d.tienTo ? p === d.path || p.startsWith(`${d.path}/`) || p.startsWith(d.path) : p === d.path))
}

/**
 * Cổng vào CÓ THỂ PHÁT CÂU cho học sinh (đường nào chọn/thả câu hoặc chọn đề).
 * Danh sách TIỀN TỐ này là định nghĩa dùng cho phép kiểm T42: quét `index.ts`, đường nào khớp mà CHƯA khai
 * trong `DUONG_PHAT_CAU` ⇒ coi như SÓT (test đỏ). Thêm kênh mới phải cập nhật cả hai chỗ.
 */
export const MAU_PHAT_CAU: readonly string[] = [
  '/game-v2', '/luyen-de', '/vo-dai', '/hs/thu-thach-hom-nay', '/hs/ke-hoach-ngay', '/goi', '/hs/on-lai',
]

/** Đường này có phải cổng vào có thể phát câu/đề (theo `MAU_PHAT_CAU`). */
export function laDuongPhatCau(p: string): boolean {
  return MAU_PHAT_CAU.some((m) => p === m || p.startsWith(`${m}/`))
}

/** Đường này có đi hợp đồng chung (engine/kế hoạch) hay là ngoại lệ có tên. */
export function kiemMotDuong(p: string): { duong?: DuongPhatCau; lyDo: 'ok' | 'chua_khai' | 'ngoai_le_thieu_ten' } {
  const d = traDuong(p)
  if (!d) return { lyDo: 'chua_khai' }
  if (d.cach === 'ngoai_le' && !String(d.ngoaiLeTen ?? '').trim()) return { duong: d, lyDo: 'ngoai_le_thieu_ten' }
  return { duong: d, lyDo: 'ok' }
}

/**
 * Các CỜ đang chạy ảnh hưởng đường phát câu. Cờ TẮT phải giữ NGUYÊN hành vi cũ (đã kiểm ở từng gói);
 * danh sách này để T42 kiểm "tắt AI vẫn học được" ở mức đường gọi.
 */
export const CO_DUONG_PHAT_CAU = {
  pham_vi_hoc: 'lọc phạm vi cá nhân cho các danh sách tự động của kế hoạch ngày',
  ngan_sach_luot: 'cắt lượt theo ngân sách còn lại + bộ chọn chung §7.1',
  cau_snapshot: 'giữ snapshot câu theo phiên bản đã phát',
  quyen_toan_chuong_trinh: 'mở quyền xem toàn chương trình',
  nang_luc_v1: 'bản dựng năng lực theo kỹ năng (nguồn: sổ sự kiện)',
} as const

export async function docCoDangBat(env: Env): Promise<Record<string, boolean>> {
  const ra: Record<string, boolean> = {}
  try {
    const r = await env.DB.prepare('SELECT khoa, gia_tri FROM cau_hinh WHERE khoa IN (SELECT value FROM json_each(?))')
      .bind(JSON.stringify(Object.keys(CO_DUONG_PHAT_CAU))).all<{ khoa: string; gia_tri: string }>()
    for (const x of r.results ?? []) ra[String(x.khoa)] = String(x.gia_tri).trim() === 'bat'
  } catch {
    /* chưa đọc được ⇒ coi như TẮT (đường cũ) */
  }
  return ra
}

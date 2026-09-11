// KIỂU TỐI THIỂU CỦA CLOUDFLARE — khai tại chỗ, KHÔNG kéo `@cloudflare/workers-types`.
//
// Lý do: máy dựng bản này không ra được internet (npm trả 403), mà chỉ cần đúng
// mấy kiểu dưới đây. Khi thầy cài `wrangler` thật thì bỏ file này và dùng kiểu
// chính thức — một dòng trong `server/tsconfig.json`.

export interface D1Result<T = unknown> {
  results: T[]
  success: boolean
  meta: { changes: number; last_row_id: number; rows_read: number; rows_written: number }
}
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(col?: string): Promise<T | null>
  run<T = unknown>(): Promise<D1Result<T>>
  all<T = unknown>(): Promise<D1Result<T>>
}
export interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
}
export interface R2Object {
  body: ReadableStream
  httpEtag: string
}
export interface R2Bucket {
  get(key: string): Promise<R2Object | null>
  put(key: string, value: ArrayBuffer | string | ReadableStream): Promise<unknown>
}
export interface Env {
  DB: D1Database
  DE: R2Bucket
  /** Mã bí mật của thầy — đặt bằng `wrangler secret put MA_BI_MAT`, KHÔNG vào git. */
  MA_BI_MAT: string
}

/** Một dòng `luot` — tên trường khớp cột D1 và cột sheet `LuotThi`. */
export interface DongLuot {
  khoa: string
  ma_ca: string
  sbd: string
  lan_thu: number
  ma_de: string | null
  id_thiet_bi: string | null
  vao_luc: string
  het_gio_luc: string | null
  nop_luc: string | null
  trang_thai: 'dang_lam' | 'da_nop' | 'khoa'
  dap_an_json: string | null
  giay_cau_json: string | null
  integrity_json: string | null
  so_lan_roi_man: number
  tong_giay_roi_man: number
  ghi_chu: string | null
  cap_nhat_luc: string
  da_day_sheet: number
}

export interface DongCa {
  ma_ca: string
  ten_ca: string | null
  trang_thai: string
  bat_dau: string | null
  het_han_vao: string | null
  thoi_gian_phut: number | null
  loai: string | null
  han_nop: string | null
  cong_bo: string | null
  nguong_lan: number | null
  nguong_giay: number | null
  bank_r2: string | null
  so_cau_json: string | null
  bo_theo_em_json: string | null
  cap_nhat_luc: string
  lop: string | null
  phong_cho: number | null
  bat_dau_thi_luc: string | null
  giu_de_doc: number | null
  an_han_giay: number | null
  /** Cờ ca ĐỀ RIÊNG TỪNG EM (12/09). Ca mở trước đó không có cột ⇒ null. */
  de_rieng: number | null
  /** Phạm vi gửi ca: tu_do · khoi · chon · sbd. */
  pham_vi: string | null
  /** Danh sách SBD thầy tích (phạm vi `chon`) hoặc năm sinh (phạm vi `khoi`). */
  danh_sach_chon_json: string | null
}

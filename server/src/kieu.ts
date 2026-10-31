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
/** Sessions API D1 (Boss 22/09, lượt 2): `env.DB.withSession('first-unconstrained')` cho lệnh CHỈ ĐỌC — Cloudflare tự chọn bản sao (replica) gần nhất
 *  thay vì bắt buộc đi tới primary, giảm tải D1 chính mà không đổi cú pháp gọi (cùng `.prepare()/.batch()`). `withSession` tuỳ chọn: D1 thật luôn có,
 *  D1 giả trong test có thể bỏ qua (trả nguyên `env.DB` gốc) — nơi gọi PHẢI kiểm `env.DB.withSession` có mặt trước khi dùng. */
export interface D1DatabaseSession {
  prepare(query: string): D1PreparedStatement
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  /** Dấu trang của phiên (mốc mới nhất phiên đã thấy) — mở phiên sau bằng dấu này ⇒ đọc thấy mọi thứ phiên trước đã ghi. D1 giả có thể vắng. */
  getBookmark?(): string | null
}
export interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  withSession?(constraintOrBookmark?: 'first-primary' | 'first-unconstrained' | string): D1DatabaseSession
}
export interface R2Object {
  body: ReadableStream
  httpEtag: string
  /** Kho ảnh đề (kho-anh.ts) đọc kiểu nội dung đã cất. */
  httpMetadata?: { contentType?: string; cacheControl?: string }
}
export interface R2Bucket {
  get(key: string): Promise<R2Object | null>
  put(key: string, value: ArrayBuffer | ArrayBufferView | string | ReadableStream, opts?: { httpMetadata?: { contentType?: string; cacheControl?: string } }): Promise<unknown>
  /** Chỉ hỏi có/không (kho ảnh đề). R2 thật luôn có; bản giả trong test có thể vắng ⇒ kho-anh.ts lui về `get`. */
  head?(key: string): Promise<unknown | null>
  delete(keys: string | string[]): Promise<void>
}
/** Durable Object (Bi-a Phản Ứng GĐ2 — phòng đấu `BanBiA`): chỉ khai đúng phần dùng tới. */
export interface DurableObjectId { toString(): string }
export interface DurableObjectStub { fetch(req: Request): Promise<Response> }
export interface DurableObjectNamespace { idFromName(ten: string): DurableObjectId; get(id: DurableObjectId, tuy?: { locationHint?: string }): DurableObjectStub }
/** WebSocket phía máy chủ (Hibernation API): gắn dữ liệu nhỏ vào kết nối, sống qua lúc phòng ngủ. */
export interface WsMayChu {
  send(chu: string | ArrayBuffer | ArrayBufferView): void
  close(ma?: number, lyDo?: string): void
  serializeAttachment(v: unknown): void
  deserializeAttachment(): unknown
}
/** SQLite riêng của một Durable Object lớp SQLite (ngăn riêng học sinh): chỉ phần dùng tới. */
export interface SqlNgan { exec(q: string, ...b: unknown[]): { toArray(): Record<string, unknown>[] } }
/** Kho riêng của MỘT em trong ngăn của em (server/src/ngan-hoc-sinh.ts): dòng sổ đã đọc từ D1 + mốc (n, r) — sống qua lúc ngăn ngủ, không tốn bộ nhớ isolate. */
export interface KhoEm {
  sbd: string
  docSo(): { rows: Record<string, unknown>[]; n: number; r: number } | null
  ghiSo(rows: readonly Record<string, unknown>[], n: number, r: number, chiThem: boolean): void
}
export interface DurableObjectStorage {
  sql?: SqlNgan
  get<T = unknown>(khoa: string): Promise<T | undefined>
  put(khoa: string, v: unknown): Promise<void>
  delete(khoa: string): Promise<boolean>
  setAlarm(luc: number): Promise<void>
  getAlarm(): Promise<number | null>
  deleteAlarm(): Promise<void>
}
export interface DurableObjectState {
  storage: DurableObjectStorage
  acceptWebSocket(ws: WsMayChu, tags?: string[]): void
  getWebSockets(tag?: string): WsMayChu[]
  setWebSocketAutoResponse?(cap: unknown): void
  /** Lần cuối phòng TỰ trả lời gói ping của kết nối này (không cần thức dậy); chưa có ⇒ null. */
  getWebSocketAutoResponseTimestamp?(ws: WsMayChu): Date | null
  /** Giữ ngăn sống tới khi việc nền xong (ngăn riêng học sinh — `ctx.waitUntil` của lệnh chạy trong ngăn). */
  waitUntil(p: Promise<unknown>): void
}
export interface Env {
  PUSH_PUBLIC_KEY?: string
  PUSH_PRIVATE_KEY?: string
  DB: D1Database
  DE: R2Bucket
  /** Phòng đấu Bi-a online (GĐ2). Vắng ⇒ Worker chưa có Durable Object ⇒ Sảnh Bi-a ghi "Sắp mở" cho chơi với bạn. */
  BAN_BIA?: DurableObjectNamespace
  /** Trạm gọi Gemini ghim châu Đại Dương (server/src/tram-gemini.ts) — chỉ dùng khi Google chặn vị trí trạm đang chạy. Vắng ⇒ gọi thẳng. */
  TRAM_GEMINI?: DurableObjectNamespace
  /** Ngăn riêng từng học sinh (server/src/ngan-hoc-sinh.ts, 30/10): mọi lệnh app học sinh của một em vào cùng một Durable Object ⇒ đệm luôn ấm. Vắng ⇒ đường cũ. */
  NGAN_HS?: DurableObjectNamespace
  /** Công tắc khẩn: có giá trị ⇒ KHÔNG đi qua ngăn riêng (đường cũ y nguyên). */
  TAT_NGAN_HS?: string
  /** Công tắc ngăn trung chuyển (ngan-hoc-sinh.ts): có giá trị ⇒ ngăn `apac|` như cũ, không bốc thăm. */
  TAT_NGAN_DINH?: string
  /** Công tắc gom lệnh D1 trong ngăn (gom-d1.ts): có giá trị ⇒ mỗi lệnh một yêu cầu như cũ. */
  TAT_GOM_D1?: string
  /** 31/10: ngăn gom D1 liên isolate (gom-lien-ngan.ts). Công tắc `BAT_GOM_LIEN_NGAN` ('1' hoặc số ngăn gom 2–64) + binding `GOM_D1`; vắng ⇒ gửi thẳng. */
  BAT_GOM_LIEN_NGAN?: string
  GOM_D1?: DurableObjectNamespace
  /** 31/10: tắt bảng tra thành viên chiến dịch (chien-dich-tv.ts) ⇒ đường của em đọc cả dòng chien_dich như cũ. */
  TAT_CHIEN_DICH_TV?: string
  /** Công tắc đệm phản hồi lệnh hỏi định kỳ trong ngăn (ngan-hoc-sinh.ts). */
  TAT_DEM_PHAN_HOI?: string
  /** Bật đọc qua bản sao D1 gần nhất trong ngăn học sinh (Sessions API + dấu trang riêng của em, ngan-hoc-sinh.ts). Mặc định tắt. */
  BAT_BAN_SAO_NGAN?: string
  /** Phòng đấu «Đấu Nguyên Tử» của phòng chờ thi (server/src/phong-dau-ion.ts, 30/10): một Durable Object mỗi ca. Vắng ⇒ không phát vé, máy em chỉ Tập với A.I. */
  PHONG_DAU_ION?: DurableObjectNamespace
  /** Công tắc tắt Đấu Nguyên Tử trên mạng: có giá trị ⇒ không phát vé, cửa trả 410, phòng đang mở bị đóng (máy em còn Tập với A.I cục bộ). */
  TAT_DAU_ION?: string
  /** Chỉ có khi lệnh chạy TRONG ngăn của em (ngan-hoc-sinh.ts): kho riêng của đúng em đó. */
  KHO_EM?: KhoEm
  /** Mã bí mật của thầy — đặt bằng `wrangler secret put MA_BI_MAT`, KHÔNG vào git. */
  MA_BI_MAT: string
  /** Khoá Gemini (Google AI Studio) cho phần hỏi thêm Thầy (server/src/hoi-tro-ly.ts) — Worker secret, KHÔNG vào git. Vắng ⇒ phần này tắt. */
  GEMINI_API_KEY?: string
  /** Workers AI (binding `[ai]` trong wrangler.toml, 27/10): máy soạn sơ đồ dùng khi Gemini hết hạn mức. Vắng ⇒ không dùng. */
  AI?: { run(model: string, input: unknown): Promise<unknown> }
}

/**
 * Kiểu tối thiểu của `ExecutionContext` (Boss 22/09, tốc độ tối đa): `fetch(req, env, ctx)` — Cloudflare LUÔN truyền
 * tham số thứ ba này ở Worker thật dù chữ ký cũ không khai nó ra. `waitUntil` cho việc PHỤ chạy SAU khi đã trả lời
 * (không nằm trong hợp đồng phản hồi) — response trả nhanh hơn, việc phụ vẫn chắc chắn chạy xong trước khi Worker dừng.
 * TUỲ CHỌN ở mọi chữ ký `fetch`/hàm dùng nó: nơi gọi cũ (test gọi `worker.fetch(req, env)` không có ctx) vẫn chạy —
 * việc phụ khi đó chạy NGAY (await tại chỗ) thay vì hoãn, không mất tác dụng, chỉ mất phần "trả lời nhanh hơn".
 */
export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void
  passThroughOnException?(): void
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
  mat_khau?: string | null
  dong_bo_gio?: number | null
  chi_nop_3_phut_cuoi?: number | null
}

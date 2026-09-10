// LÕI ĐO TẢI — KHACPHUCTREOHANGLOAT.md mục 1 ("CẤM SỬA KHI CHƯA ĐO").
//
// Tách riêng khỏi `scripts/do-tai.mjs` vì hai lý do, lý do thứ hai mới là chính:
//
//   1. Lõi tách ra thì KIỂM ĐƯỢC. Phép tính phân vị mà sai thì cả bảng nghiệm
//      thu sai theo, và không ai nhận ra — con số vẫn trông như con số.
//   2. TRONG MÔI TRƯỜNG NÀY, `scripts/do-tai.mjs` KHÔNG CHẠY ĐƯỢC. Đo 10/09
//      khuya: cả máy trong đám mây lẫn máy thầy đều không ra được
//      `script.google.com` (HTTP 000, từ chối ngay trong 4 mili giây). Chỉ tab
//      trình duyệt gọi được Apps Script. Lõi nằm ở đây thì lượt đo chạy trong
//      tab dùng ĐÚNG phép tính mà script Node sẽ dùng — cùng một bảng số, không
//      phải hai đường tính rồi so nhau.
//
// KHÔNG có gì trong tệp này biết về Apps Script: nó nhận một hàm "bắn một lượt"
// rồi lo phần bắn đồng thời, đo giờ, và tính phân vị.

/** Kết quả MỘT lượt gọi. `ms` luôn có, kể cả khi hỏng — thời gian tới lúc hỏng
 * cũng là số liệu (hỏng ở giây thứ 25 khác hẳn hỏng ở giây thứ nhất). */
export interface MotLuot {
  ms: number
  ok: boolean
  loi?: string
  /** Thời gian VÙNG KHOÁ máy chủ báo về, mili giây. Có thì mới đo được T. */
  khoaMs?: number
}

export interface TomTatDo {
  hanhDong: string
  n: number
  soHong: number
  tiLeHong: number
  p50: number
  p95: number
  max: number
  /** Vùng khoá: p50 và tệ nhất. Chỉ có khi máy chủ báo `khoaMs`. */
  khoaP50: number | null
  khoaMax: number | null
  loi: string[]
}

/** PHÂN VỊ THEO KIỂU "GẦN NHẤT, LÀM TRÒN LÊN".
 *
 * Cố ý KHÔNG nội suy: với 10 mẫu, p95 nội suy ra một con số không ứng với lượt
 * gọi nào có thật. Ở đây p95 luôn là thời gian của MỘT lượt gọi đã xảy ra —
 * đọc bảng xong chỉ vào đúng được lượt nào. */
export function phanVi(ds: number[], p: number): number {
  if (ds.length === 0) return 0
  const x = [...ds].sort((a, b) => a - b)
  const i = Math.min(x.length - 1, Math.max(0, Math.ceil((p / 100) * x.length) - 1))
  return x[i]
}

/** Gộp các lượt thành một dòng bảng. */
export function tomTat(hanhDong: string, ds: MotLuot[]): TomTatDo {
  const ms = ds.map((x) => x.ms)
  const hong = ds.filter((x) => !x.ok)
  const khoa = ds.map((x) => x.khoaMs).filter((x): x is number => typeof x === 'number')
  return {
    hanhDong,
    n: ds.length,
    soHong: hong.length,
    tiLeHong: ds.length ? hong.length / ds.length : 0,
    p50: phanVi(ms, 50),
    p95: phanVi(ms, 95),
    max: ms.length ? Math.max(...ms) : 0,
    khoaP50: khoa.length ? phanVi(khoa, 50) : null,
    khoaMax: khoa.length ? Math.max(...khoa) : null,
    // Gộp các câu lỗi KHÁC NHAU. Ba mươi lượt cùng một lỗi thì đọc một dòng là
    // đủ; nhưng nếu có hai loại lỗi khác nhau thì phải thấy cả hai.
    loi: [...new Set(hong.map((x) => x.loi || 'không rõ'))],
  }
}

/** BẮN N LƯỢT ĐỒNG THỜI, đo từng lượt.
 *
 * ĐỒNG THỜI THẬT: mọi lượt khởi hành trong cùng một vòng lặp sự kiện, không xếp
 * hàng. Đó chính là cảnh cả lớp bấm "Vào thi" trong hai giây vì thầy vừa hô —
 * bắn tuần tự thì không tái hiện được cái treo, và bảng số sẽ đẹp một cách vô
 * dụng.
 *
 * `banMot(i)` phải TỰ NUỐT lỗi của nó và trả về `{ok:false}`; ném ra ngoài là
 * mất luôn số liệu của cả lô. */
export async function banDongThoi(n: number, banMot: (i: number) => Promise<MotLuot>): Promise<MotLuot[]> {
  const viec: Promise<MotLuot>[] = []
  for (let i = 0; i < n; i++) {
    viec.push(
      banMot(i).catch((e: unknown) => ({
        ms: 0,
        ok: false,
        loi: e instanceof Error ? e.message : String(e),
      })),
    )
  }
  return Promise.all(viec)
}

/** Bọc một lượt gọi: bấm giờ, nuốt lỗi, đọc `khoaMs` nếu máy chủ có báo. */
export async function doMot(goi: () => Promise<{ ok?: boolean; error?: string; khoaMs?: number }>): Promise<MotLuot> {
  const t0 = Date.now()
  try {
    const r = await goi()
    return {
      ms: Date.now() - t0,
      ok: r?.ok !== false,
      loi: r?.ok === false ? r.error || 'máy chủ từ chối' : undefined,
      khoaMs: typeof r?.khoaMs === 'number' ? r.khoaMs : undefined,
    }
  } catch (e) {
    return { ms: Date.now() - t0, ok: false, loi: e instanceof Error ? e.message : String(e) }
  }
}

/** SBD giả của lượt đo. Tiền tố `TEST` để đối chiếu và dọn được — mục 4 cấm
 * chạm SBD thật, và mục 3 dòng 12 đòi đếm lại còn 0 dòng `TEST%`. */
export const TIEN_TO_SBD_THU = 'TEST'

export function sbdThu(i: number): string {
  return `${TIEN_TO_SBD_THU}${String(i + 1).padStart(4, '0')}`
}

/** In một dòng bảng cho dễ đọc trong nhật ký. */
export function dongBang(t: TomTatDo): string {
  const g = (ms: number) => `${(ms / 1000).toFixed(2)}s`
  const k = t.khoaP50 === null ? '—' : `${g(t.khoaP50)}/${g(t.khoaMax ?? 0)}`
  return `${t.hanhDong.padEnd(10)} n=${String(t.n).padStart(3)} · hỏng ${String(Math.round(t.tiLeHong * 100)).padStart(3)}% · p50 ${g(t.p50)} · p95 ${g(t.p95)} · max ${g(t.max)} · khoá ${k}`
}

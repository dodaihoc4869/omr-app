// TÊN DẠNG cạnh MÃ DẠNG cho màn của THẦY (chuẩn từ ngữ luật 4: mã nội bộ không hiện cho thầy) — Code 3, 21/09/2026.
// Các lệnh `/ai/nhat-ky` và `/ai/dem-qua` (Code 1, `bo-nao.ts`) trả MÃ dạng cho app thầy; lớp mỏng này BỔ SUNG tên, KHÔNG sửa lõi Bộ não:
//   · `/ai/nhat-ky`: `ds[].dang[].ten` và `ds[].khacPhuc[].tenDang`;  · `/ai/dem-qua`: `banTin.cacDong[].tenDang` (khi dòng có `dang`).
// Tên lấy từ chỉ mục game (`game_v2_question.json.tenDang`, cùng nguồn với hồ sơ mạnh–yếu); mã chuyên đề `CD:<tên>` thì tên chính là phần sau `CD:`. Không biết tên ⇒ KHÔNG thêm khoá (app hiện "dạng chưa đặt tên").
// Chỉ ĐỌC: một truy vấn (chia lô 60 mã). Lỗi đọc ⇒ trả nguyên kết quả cũ (không bao giờ làm hỏng lệnh Bộ não).
import type { Env } from './kieu'

type Obj = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()
const laDoiTuong = (x: unknown): x is Obj => x !== null && typeof x === 'object' && !Array.isArray(x)

/** Tên của các mã dạng (mã không biết tên vắng khỏi bản đồ). */
export async function tenCuaCacDang(env: Env, dsMa: string[]): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  const that: string[] = []
  for (const m of new Set(dsMa.map(chuoi).filter(Boolean))) {
    if (m.startsWith('CD:')) { if (chuoi(m.slice(3))) ra.set(m, chuoi(m.slice(3))) } else that.push(m)
  }
  for (let i = 0; i < that.length; i += 60) {
    try {
      const r = await env.DB.prepare("SELECT dang, MAX(json_extract(json, '$.tenDang')) AS ten FROM game_v2_question WHERE dang IN (SELECT value FROM json_each(?)) GROUP BY dang")
        .bind(JSON.stringify(that.slice(i, i + 60))).all<Obj>()
      for (const x of r.results ?? []) if (chuoi(x.ten)) ra.set(chuoi(x.dang), chuoi(x.ten))
    } catch {
      /* không tra được tên: giữ mã */
    }
  }
  return ra
}

/** `/ai/nhat-ky` + tên dạng. */
export async function themTenDangNhatKy(env: Env, kq: Obj): Promise<Obj> {
  if (kq.ok !== true || !Array.isArray(kq.ds)) return kq
  const ds = kq.ds as Obj[]
  const ma = ds.flatMap((x) => [
    ...(Array.isArray(x.dang) ? (x.dang as Obj[]).map((d) => chuoi(d?.ma)) : []),
    ...(Array.isArray(x.khacPhuc) ? (x.khacPhuc as Obj[]).map((k) => chuoi(k?.dang)) : []),
  ])
  const ten = await tenCuaCacDang(env, ma)
  if (ten.size === 0) return kq
  return {
    ...kq,
    ds: ds.map((x) => ({
      ...x,
      ...(Array.isArray(x.dang) ? { dang: (x.dang as Obj[]).map((d) => (laDoiTuong(d) && ten.has(chuoi(d.ma)) ? { ...d, ten: ten.get(chuoi(d.ma)) } : d)) } : {}),
      ...(Array.isArray(x.khacPhuc) ? { khacPhuc: (x.khacPhuc as Obj[]).map((k) => (laDoiTuong(k) && ten.has(chuoi(k.dang)) ? { ...k, tenDang: ten.get(chuoi(k.dang)) } : k)) } : {}),
    })),
  }
}

/** `/ai/dem-qua` + tên dạng của các dòng bản tin. */
export async function themTenDangDemQua(env: Env, kq: Obj): Promise<Obj> {
  const bt = kq.banTin
  if (kq.ok !== true || !laDoiTuong(bt) || !Array.isArray(bt.cacDong)) return kq
  const dong = bt.cacDong as Obj[]
  const ten = await tenCuaCacDang(env, dong.map((d) => chuoi(d?.dang)))
  if (ten.size === 0) return kq
  return { ...kq, banTin: { ...bt, cacDong: dong.map((d) => (laDoiTuong(d) && ten.has(chuoi(d.dang)) ? { ...d, tenDang: ten.get(chuoi(d.dang)) } : d)) } }
}

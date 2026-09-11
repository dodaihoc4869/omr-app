// ĐỒNG BỘ NGƯỢC — kéo bài từ máy chủ mới về Sheet (MAY-CHU-MOI.md mục 9).
//
// VÌ SAO CẦN: lúc nộp, máy em cất bài vào D1 TRƯỚC rồi mới gọi Apps Script. Gần
// như mọi lần cả hai đều xong. Nhưng đúng cái lúc Apps Script treo — cả lớp bấm
// Nộp trong mười giây cuối — thì lượt đó chỉ nằm ở D1. Hàm này đưa nốt về.
//
// BA LUẬT:
//   1. Chỉ ĐẨY, không xoá gì ở D1. Đánh dấu `da_day_sheet = 1` sau khi Sheet
//      xác nhận nhận được — Sheet hỏng giữa chừng thì lần sau kéo lại.
//   2. Đẩy TỪNG lượt bằng đúng lệnh `submit` cũ. Khoá chống trùng
//      `maCa|sbd|lanThu` bên Apps Script lo phần gửi lại — đẩy hai lần vẫn ra
//      một dòng.
//   3. Lượt còn `dang_lam` thì BỎ QUA. Em đang làm bài dở, đẩy về Sheet là
//      chốt sổ sớm cho em.
import { submitAnswers } from './exam-api'
import type { CauHinhMayChu } from './cau-hinh-may-chu'

export interface LuotChuaDay {
  khoa: string
  ma_ca: string
  sbd: string
  lan_thu: number
  ma_de: string | null
  dap_an_json: string | null
  giay_cau_json: string | null
  integrity_json: string | null
  trang_thai: string
  nop_luc: string | null
}

export interface KetQuaDongBoNguoc {
  con: number
  daDay: number
  hong: { sbd: string; vi_sao: string }[]
  boQua: number
}

function doc<T>(s: string | null, macDinh: T): T {
  if (!s) return macDinh
  try {
    return JSON.parse(s) as T
  } catch {
    return macDinh
  }
}

/** Hỏi máy chủ mới: ca này còn lượt nào chưa về Sheet. */
export async function demChuaDay(ch: CauHinhMayChu, maBiMat: string, maCa: string): Promise<LuotChuaDay[] | null> {
  if (!ch.BAT || !ch.URL) return null
  try {
    const res = await fetch(`${ch.URL}/chua-day`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': maBiMat },
      body: JSON.stringify({ maCa }),
    })
    if (!res.ok) return null
    const j = (await res.json()) as { ok?: boolean; luot?: LuotChuaDay[] }
    return j?.ok ? (j.luot ?? []) : null
  } catch {
    return null
  }
}

/**
 * Kéo hết lượt chưa đẩy của một ca về Sheet.
 *
 * Chạy TUẦN TỰ, không bắn song song: đây là việc sau ca, không ai chờ, mà bắn
 * ba mươi lượt `submit` cùng lúc vào Apps Script thì lại đúng cái treo mình vừa
 * chữa xong.
 */
export async function dongBoNguoc(
  ch: CauHinhMayChu,
  scriptUrl: string,
  maBiMat: string,
  maCa: string,
): Promise<KetQuaDongBoNguoc> {
  const ds = await demChuaDay(ch, maBiMat, maCa)
  if (!ds) return { con: 0, daDay: 0, hong: [{ sbd: '', vi_sao: 'Không hỏi được máy chủ mới' }], boQua: 0 }

  const xong: string[] = []
  const hong: { sbd: string; vi_sao: string }[] = []
  let boQua = 0

  for (const l of ds) {
    // Em đang làm bài dở — để yên, lần sau kéo.
    if (l.trang_thai === 'dang_lam') {
      boQua += 1
      continue
    }
    try {
      await submitAnswers(
        scriptUrl,
        l.ma_ca,
        l.sbd,
        String(l.ma_de ?? ''),
        doc(l.dap_an_json, {}),
        doc(l.integrity_json, {}),
        l.lan_thu,
        '',
        doc(l.giay_cau_json, undefined) as Record<string, number> | undefined,
      )
      xong.push(l.khoa)
    } catch (e) {
      hong.push({ sbd: l.sbd, vi_sao: e instanceof Error ? e.message : String(e) })
    }
  }

  // ĐÁNH DẤU SAU CÙNG, và chỉ những lượt Sheet ĐÃ xác nhận. Đánh dấu trước là
  // Sheet hỏng giữa chừng thì bài bốc hơi khỏi cả hai nơi.
  if (xong.length > 0) {
    try {
      await fetch(`${ch.URL}/da-day`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-ma-bi-mat': maBiMat },
        body: JSON.stringify({ khoa: xong }),
      })
    } catch {
      // Đánh dấu hỏng thì lần sau kéo lại — `submit` gửi lại vô hại nhờ khoá
      // chống trùng. Thà kéo thừa còn hơn mất bài.
    }
  }

  return { con: ds.length - xong.length - boQua, daDay: xong.length, hong, boQua }
}

/**
 * DÒNG ĐỎ — chặn mở ca mới khi còn bài chưa về Sheet.
 *
 * Mở ca mới lúc ca cũ còn lượt kẹt ở D1 là cách chắc chắn nhất để quên chúng.
 * Trả về chuỗi cảnh báo, hoặc rỗng nếu sạch.
 */
export async function canhBaoTruocKhiMoCa(
  ch: CauHinhMayChu,
  maBiMat: string,
  maCaCu: string,
): Promise<string> {
  const ds = await demChuaDay(ch, maBiMat, maCaCu)
  if (!ds) return ''
  const daNop = ds.filter((l) => l.trang_thai !== 'dang_lam')
  if (daNop.length === 0) return ''
  return `Ca ${maCaCu} còn ${daNop.length} bài đã nộp nhưng chưa về Sheet. Kéo về trước khi mở ca mới.`
}

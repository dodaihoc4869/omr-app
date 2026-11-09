// «VÌ SAO EM SAI?» — khối B đợt 2 (thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911 ảnh dt-sang-2b: «duyệt, build và đẩy lên bản sống luôn»;
// «làm hết sạch đẩy luôn lên bản sống»). Câu luyện tập ở Lộ trình em làm SAI ⇒ dải kết quả có 3 ô lý do; phải chạm MỘT ô mới «Tiếp tục» (chạm lại
// đổi ý, giữ lần cuối). Kho bẫy phương án (bayPA, làn Codex) chưa có ⇒ không chọn sẵn, không đoán (màn 2b).
// TỐC ĐỘ (thầy: «tức thì», «tải hết xuống máy học sinh», «không lỗi máy chủ»): 0 lệnh mới — lý do xếp hàng trên máy (localStorage), đi KÈM lệnh nộp câu
// kế (`ly` trong thân lệnh, máy chủ ghi cùng dòng sổ câu lệnh ấy đang ghi); mất mạng / tắt app ⇒ còn trong hàng, lần nộp sau gửi tiếp. Tệp nằm trong mảnh
// màn làm bài (nạp sẵn qua kho tải ngầm), không thêm byte đường mở app. Giao diện: KetSaiDuo.tsx; kiểu: vi-sao-sai.css (@import trong styles/trong-lam-bai.css).
import { useSyncExternalStore } from 'react'

export type LyDoSai = 'tinh' | 'cach' | 'nham'
export const LY_DO_SAI: readonly (readonly [LyDoSai, string])[] = [['tinh', 'Tính / đọc đề sai'], ['cach', 'Chưa biết cách'], ['nham', 'Hiểu nhầm']]
export const laLyDoSai = (x: unknown): x is LyDoSai => x === 'tinh' || x === 'cach' || x === 'nham'
/** Chữ nút chính khi em chưa chạm lý do. */
export const CHU_CHO_LY_DO = 'Chọn một lý do để tiếp tục'

const KHOA = 'ddh.lyDoSai'
const TOI_DA_GUI = 20 // một lệnh nộp mang tối đa 20 lý do (hàng dài hơn ⇒ các lệnh sau mang tiếp)
const daChon = new Map<string, LyDoSai>() // lý do em đã chạm, chưa gửi (qid → lý do)
const cho = new Set<string>() // câu sai đang hiện dải, em chưa chạm lý do
const nghe = new Set<() => void>()
let ban = 0
let daNap = false
const bao = () => { ban++; for (const f of nghe) f() }
const nap = () => {
  if (daNap) return
  daNap = true
  try {
    const a: unknown = JSON.parse(localStorage.getItem(KHOA) ?? '[]')
    if (Array.isArray(a)) for (const x of a) if (Array.isArray(x) && typeof x[0] === 'string' && laLyDoSai(x[1]) && !daChon.has(x[0])) daChon.set(x[0], x[1])
  } catch { /* máy chặn lưu ⇒ chỉ giữ trong phiên */ }
}
const luu = () => { try { if (daChon.size) localStorage.setItem(KHOA, JSON.stringify([...daChon].slice(-200))); else localStorage.removeItem(KHOA) } catch { /* bỏ qua */ } }

/** Em chạm một lý do (chạm lại ⇒ đổi, giữ lần cuối). */
export function chonLyDoSai(qid: string, ly: LyDoSai): void {
  nap()
  daChon.delete(qid)
  daChon.set(qid, ly)
  cho.delete(qid)
  luu()
  bao()
}
/** Có câu sai đang hiện mà em chưa chạm lý do ⇒ «Tiếp tục» (nút / phím Enter) chưa đi. */
export const choLyDoSai = (): boolean => cho.size > 0
// «CHƯA CHẮC» (khối B lát 5, bản vẽ dt-sang-5): chip trên câu SỬA trước khi «Kiểm tra» (mặc định Chắc). Bật ⇒ lệnh nộp câu ấy mang `tuTin: 'chua_chac'`; máy chủ
// (ly-do-sai.ts ghiChuaChac) đánh dấu câu sửa làm đúng mà chưa chắc ⇒ ngày Sửa sau xếp lại; làm đúng và chắc ⇒ xoá dấu.
const chuaChac = new Set<string>()
export function datChuaChac(qid: string, bat: boolean): void { if (bat) chuaChac.add(qid); else chuaChac.delete(qid); bao() }
export const useChuaChac = (qid: string): boolean => { useSyncExternalStore(dangKy, () => ban, () => 0); return chuaChac.has(qid) }
/** Phần THÊM của thân lệnh nộp câu: `{ ly: [[qid, lý do], …] }` (vắng hàng ⇒ {}) + `tuTin: 'chua_chac'` nếu em bật chip cho câu `qid` (đọc là dùng hết). */
export function thanLyDoSai(qid?: string): { ly?: [string, LyDoSai][]; tuTin?: 'chua_chac' } {
  nap()
  const cc = !!qid && chuaChac.delete(qid)
  return { ...(daChon.size ? { ly: [...daChon].slice(0, TOI_DA_GUI) } : {}), ...(cc ? { tuTin: 'chua_chac' as const } : {}) }
}
/** Lệnh nộp đã được máy chủ nhận ⇒ bỏ những lý do vừa gửi (lý do bị đổi sau lúc gửi thì giữ lại để gửi bản mới). */
export function daGuiLyDoSai(gui: { ly?: [string, LyDoSai][] }): void {
  if (!gui.ly?.length) return
  for (const [q, l] of gui.ly) if (daChon.get(q) === l) daChon.delete(q)
  luu()
}
const dangKy = (f: () => void) => { nghe.add(f); return () => { nghe.delete(f) } }
/** Nút «Tiếp tục» đọc: còn câu chờ lý do không. */
export const useChoLyDoSai = (): boolean => useSyncExternalStore(dangKy, () => cho.size > 0, () => false)
/** Lý do em đã chạm cho câu (đọc lại khi kho đổi). */
export const useLyDoSai = (qid: string): LyDoSai | undefined => { useSyncExternalStore(dangKy, () => ban, () => 0); nap(); return daChon.get(qid) }
/** Dải câu sai hiện (chưa có lý do) ⇒ bắt đầu chờ; trả hàm thôi chờ (rời câu / ô lý do không chạm được). */
export function choCauSai(qid: string): () => void {
  nap()
  if (daChon.has(qid)) return () => {}
  cho.add(qid)
  bao()
  return () => { if (cho.delete(qid)) bao() }
}


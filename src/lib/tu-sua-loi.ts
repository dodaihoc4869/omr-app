// TỰ SỬA LỖI — MỘT nguồn số "câu em cần sửa" cho cả app học sinh (đợt 18, thầy 13/10: "Mời gọi học sinh tự sửa lỗi, trong hồ sơ của học sinh những câu
// chưa sửa lỗi mà có trong tự sửa lỗi mới hiện sửa câu này, nếu chưa có thì chưa hiện. Làm nổi bật phần tự sửa lỗi lên và mời gọi thân thiện").
//   · `nhomMucChua`: luật nhóm DUY NHẤT của một mục trong danh sách Tự sửa lỗi — 'can' (sửa được ngay) · 'cho' (chờ lần gặp lại 2, chưa tới giờ) ·
//     'xong' (đã tự sửa). Màn Tự sửa lỗi (ManTuChua), thẻ mời ở Hôm nay và hồ sơ của em cùng đếm bằng hàm này ⇒ ba chỗ cùng MỘT con số.
//     "Chờ chữa trên lớp" (`can_thay`) vẫn là 'can': em sửa trước được trên câu gốc (ChuaTrucTiep), y như màn Tự sửa lỗi đang ghi.
//   · Bộ nhớ trong phiên (mỗi token một bản, 10 phút như Nhịp học ở Hôm nay): thẻ Hôm nay và hồ sơ dùng lại, không gọi lại máy chủ mỗi lần vẽ.
//     Màn Tự sửa lỗi luôn tải MỚI (`moi`) và ghi đè bản nhớ ⇒ em sửa xong quay về Hôm nay là số đã đúng (người nghe được báo ngay).
//   · Lỗi mạng / máy chủ ⇒ KHÔNG ghi bản nhớ (lần sau thử lại); nơi dùng coi như không có số (thẻ mời ẩn, hồ sơ không hiện nút sửa).
// Nguồn: đúng lệnh sẵn có `apiDanhSachTuChua` (`/hs/chua-cau-sai/co` rồi `danh-sach`) — không lệnh máy chủ mới.
import { useEffect, useState } from 'react'
import type { KetQuaDanhSachChua, MocDanhSachChua, MucChua } from './chua-cau-sai-api'

export type NhomMucChua = 'can' | 'cho' | 'xong'

/** Nhóm của một mục Tự sửa lỗi: đã tự sửa ⇒ 'xong'; chờ lần gặp lại 2 mà chưa tới giờ hẹn (hoặc chưa có giờ hẹn) ⇒ 'cho'; còn lại ⇒ 'can'. */
export function nhomMucChua(m: Pick<MucChua, 'trangThai' | 'denHan'>, nayMs: number): NhomMucChua {
  if (m.trangThai === 'da_tu_sua') return 'xong'
  if (m.trangThai === 'cho_gap_lai_2') {
    const ms = m.denHan ? Date.parse(m.denHan) : NaN
    return Number.isFinite(ms) && ms <= nayMs ? 'can' : 'cho'
  }
  return 'can'
}

/** Mục em sửa được ngay (nhóm 'can'). Vòng chữa tắt / lỗi ⇒ []. */
export function mucCanSua(kq: KetQuaDanhSachChua | null | undefined, nayMs: number): MucChua[] {
  return kq?.trangThai === 'bat' ? kq.ds.filter((m) => nhomMucChua(m, nayMs) === 'can') : []
}

/** Số câu em cần sửa; `null` khi chưa có danh sách (đang tải, lỗi, vòng chữa chưa mở cho em). */
export function soCauCanSua(kq: KetQuaDanhSachChua | null | undefined, nayMs: number): number | null {
  return kq?.trangThai === 'bat' ? kq.dem?.can ?? mucCanSua(kq, nayMs).length : null
}

/** Bản nhớ giữ 10 phút (cùng nhịp với Nhịp học ở Hôm nay — giờ cao điểm bớt lượt gọi máy chủ). */
export const NHO_TU_SUA_MS = 600_000
const NHO = new Map<string, { kq: KetQuaDanhSachChua; luc: number }>()
const DANG = new Map<string, Promise<KetQuaDanhSachChua>>()
const NGHE = new Set<(token: string, kq: KetQuaDanhSachChua) => void>()

/** Chỉ cho test: xoá bản nhớ. */
export function xoaNhoTuSua(): void {
  NHO.clear()
  DANG.clear()
}

/** Bản nhớ còn hạn (`toiDaMs`) của token, không có ⇒ null. */
export function docNhoTuSua(token: string, toiDaMs = NHO_TU_SUA_MS): KetQuaDanhSachChua | null {
  const c = NHO.get(token)
  return c && Date.now() - c.luc < toiDaMs ? c.kq : null
}

/** Nghe mỗi lần danh sách được tải mới (màn Tự sửa lỗi tải lại sau khi em sửa) ⇒ trả hàm gỡ. */
export function ngheTuSua(fn: (token: string, kq: KetQuaDanhSachChua) => void): () => void {
  NGHE.add(fn)
  return () => {
    NGHE.delete(fn)
  }
}

/** Danh sách Tự sửa lỗi của em. `moi` ⇒ luôn hỏi máy chủ (màn Tự sửa lỗi); không thì dùng bản nhớ còn hạn `toiDaMs`, hoặc chung lượt đang chờ. */
export function taiTuSuaLoi(token: string, tuy: { moi?: boolean; toiDaMs?: number; sau?: MocDanhSachChua } = {}): Promise<KetQuaDanhSachChua> {
  if (!tuy.moi && !tuy.sau) {
    const c = docNhoTuSua(token, tuy.toiDaMs)
    if (c) return Promise.resolve(c)
    const d = DANG.get(token)
    if (d) return d
  }
  const p: Promise<KetQuaDanhSachChua> = Promise.resolve()
    .then(() => import('./chua-cau-sai-api'))
    .then(({ apiDanhSachTuChua }) => tuy.sau ? apiDanhSachTuChua(token, tuy.sau) : apiDanhSachTuChua(token))
    .catch((): KetQuaDanhSachChua => ({ trangThai: 'loi', loi: 'Chưa nối được máy chủ. Em kiểm tra mạng rồi thử lại.' }))
    .then((kq) => {
      // Một lần tải mới hơn đã bắt đầu: phản hồi cũ không ghi đè bản nhớ hoặc phát số cũ cho Hôm nay.
      if (DANG.get(token) !== p) return kq
      // Trang tiếp được nhập vào bản nhớ, không thay danh sách bằng riêng 100 câu cuối.
      const cu = tuy.sau ? NHO.get(token)?.kq : null
      if (cu?.trangThai === 'bat' && kq.trangThai === 'bat') {
        const ds = new Map<string, MucChua>()
        for (const m of [...cu.ds, ...kq.ds]) ds.set(m.dotId ?? m.qid, m)
        kq = { ...kq, ds: [...ds.values()], ...(kq.dem ? {} : cu.dem ? { dem: cu.dem } : {}),
          ...(kq.kiemLaiHoiThay ? {} : cu.kiemLaiHoiThay ? { kiemLaiHoiThay: cu.kiemLaiHoiThay } : {}),
        }
      }
      DANG.delete(token)
      if (kq.trangThai !== 'loi') {
        NHO.set(token, { kq, luc: Date.now() })
        for (const f of NGHE) f(token, kq)
      }
      return kq
    })
  DANG.set(token, p)
  return p
}

/** Số câu em cần sửa cho thẻ mời ở Hôm nay: tải LƯỜI khi `bat` (Hôm nay đã có số của mình), dùng bản nhớ; `khoa` đổi (em vừa làm thêm câu) ⇒ xem lại
 *  bản nhớ, hết hạn mới hỏi máy chủ. Lỗi / chưa mở / đang tải ⇒ null (thẻ mời không hiện, không bao giờ chặn thẻ Hôm nay). */
export function useSoCauCanSua(token: string | undefined, bat: boolean, khoa?: unknown): number | null {
  const [kq, setKq] = useState<KetQuaDanhSachChua | null>(() => (token ? docNhoTuSua(token) : null))
  useEffect(() => {
    if (!token) return
    return ngheTuSua((t, moi) => {
      if (t === token) setKq(moi)
    })
  }, [token])
  useEffect(() => {
    if (!token || !bat) return
    let huy = false
    void taiTuSuaLoi(token).then((r) => {
      if (!huy && r.trangThai !== 'loi') setKq(r)
    })
    return () => {
      huy = true
    }
  }, [token, bat, khoa])
  return token ? soCauCanSua(kq, Date.now()) : null
}

// Gọi máy chủ cho Bảng nhiệm vụ: kế hoạch ngày + "có ca đang mở". Mọi lỗi → null/false, KHÔNG ném:
// màn phải sống được khi mất mạng (rơi về nguồn trợ lý, hoặc hiện bản cuối kèm "kế hoạch lúc …").
import { useEffect, useMemo, useRef, useState } from 'react'
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import { donKhiDoiMocReset } from './don-moc-reset'
import { dongGoiBanNho, laKeHoachNgayHopLe, phucHoiBanNho, type DuLieuBangNhiemVu, type KeHoachNgayMayChu } from '../../lib/nhiem-vu-adapter'

export interface DinhDanh {
  /** Có token thì SBD lấy từ chữ ký (ưu tiên). Không thì SBD (phụ huynh). */
  token?: string
  sbd?: string
}

async function goiPost(duong: string, body: unknown, giay: number): Promise<any | null> {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), giay * 1000)
  try {
    const url = await layDiaChiMayChu()
    if (!url) return null
    const r = await fetch(`${url}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: c.signal })
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

const thanDinhDanh = (d: DinhDanh) => (d.token ? { token: d.token } : { sbd: d.sbd })

/**
 * Lúc job reset chạy (đóng băng từ 00:00 VN tới khi xong hoặc 01:00) máy chủ trả HTTP 200 `{ ok:false, error, dangLamMoi:true }`
 * (docs/moc-reset-1909.md mục 2). Đó KHÔNG phải lỗi đăng nhập hay mất mạng: giữ phiên, giữ bản nhớ, hiện dải "đang làm mới"
 * (chữ do 0.Planer chốt, nằm ở BangNhiemVu), tự thử lại theo nhịp 60 s. Chỉ `=== true` mới tính — trường vắng/chuỗi "true" thì không.
 */
export function laDangLamMoi(r: unknown): boolean {
  return !!r && typeof r === 'object' && (r as { dangLamMoi?: unknown }).dangLamMoi === true
}

export interface KetQuaKeHoach {
  keHoach: KeHoachNgayMayChu | null
  dangLamMoi: boolean
}

/** `POST /hs/ke-hoach-ngay` — máy chủ tính lại mỗi lần gọi. `keHoach` null nếu lỗi hoặc JSON không đủ phần; `dangLamMoi` true khi máy chủ đang làm mới. */
export async function taiKeHoachNgayChiTiet(d: DinhDanh): Promise<KetQuaKeHoach> {
  const r = await goiPost('/hs/ke-hoach-ngay', thanDinhDanh(d), 10)
  // Máy chủ báo mốc đặt lại mùa ("YYYY-MM-DD"): mốc mới thì DỌN bộ nhớ trong máy TRƯỚC khi ai đó dựng bản nhớ/nháp (don-moc-reset.ts).
  if (r && typeof r === 'object') donKhiDoiMocReset((r as { mocReset?: unknown }).mocReset)
  return { keHoach: laKeHoachNgayHopLe(r) ? r : null, dangLamMoi: laDangLamMoi(r) }
}

/** Như trên nhưng chỉ lấy kế hoạch (null nếu lỗi / đang làm mới). */
export async function taiKeHoachNgay(d: DinhDanh): Promise<KeHoachNgayMayChu | null> {
  return (await taiKeHoachNgayChiTiet(d)).keHoach
}

/** `POST /hs/ca-dang-mo` → { ok, coCaMo, soCa }. Lỗi/404/thiếu trường → false. */
export async function taiCaDangMo(d: DinhDanh): Promise<boolean> {
  const r = await goiPost('/hs/ca-dang-mo', thanDinhDanh(d), 8)
  if (r && typeof r === 'object') donKhiDoiMocReset((r as { mocReset?: unknown }).mocReset)
  return !!r && r.ok === true && r.coCaMo === true
}

const nguoiCua = (d: DinhDanh) => d.token || d.sbd || ''

/** Nhịp gọi lại: mở màn, mỗi 60 s khi tab đang hiện, khi quay lại tab, và khi `khoa` đổi. */
function useNhipGoi(chay: () => void, bat: boolean, khoa: string) {
  const ref = useRef(chay)
  ref.current = chay
  useEffect(() => {
    if (!bat) return
    const goi = () => {
      if (typeof document === 'undefined' || !document.hidden) ref.current()
    }
    goi()
    const t = setInterval(goi, 60_000)
    window.addEventListener('focus', goi)
    document.addEventListener('visibilitychange', goi)
    return () => {
      clearInterval(t)
      window.removeEventListener('focus', goi)
      document.removeEventListener('visibilitychange', goi)
    }
  }, [bat, khoa])
}

export interface TrangThaiKeHoach {
  keHoach: KeHoachNgayMayChu | null
  /** Lượt gọi ĐẦU đã có kết quả (thành công hay lỗi) — trước đó màn vẽ skeleton. */
  daXong: boolean
  /** Lần gọi mới nhất lỗi mà còn bản cuối ⇒ đang hiện bản cuối. */
  cu: boolean
  /** Máy chủ đang làm mới (reset). Hết ngay khi một lượt gọi sau trả bình thường; lỗi mạng thường thì KHÔNG bật. */
  dangLamMoi: boolean
}
const BAN_DAU: TrangThaiKeHoach & { nguoi: string } = { keHoach: null, daXong: false, cu: false, dangLamMoi: false, nguoi: '' }

export function useKeHoachNgay(d: DinhDanh, bat: boolean, lamMoi: number): TrangThaiKeHoach {
  const nguoi = nguoiCua(d)
  const [t, setT] = useState(BAN_DAU)
  const dangGoi = useRef(false)
  useNhipGoi(
    () => {
      if (dangGoi.current) return
      dangGoi.current = true
      void taiKeHoachNgayChiTiet(d).then(({ keHoach: kq, dangLamMoi }) => {
        dangGoi.current = false
        setT((truoc) => {
          const cung = truoc.nguoi === nguoi
          const cuBan = cung ? truoc.keHoach : null
          return kq ? { keHoach: kq, daXong: true, cu: false, dangLamMoi: false, nguoi } : { keHoach: cuBan, daXong: true, cu: cuBan !== null, dangLamMoi, nguoi }
        })
      })
    },
    bat && !!nguoi,
    `${nguoi}|${lamMoi}`,
  )
  return t.nguoi === nguoi ? t : BAN_DAU
}

export function useCaDangMo(d: DinhDanh, bat: boolean): boolean {
  const nguoi = nguoiCua(d)
  const [co, setCo] = useState(false)
  useNhipGoi(
    () => {
      void taiCaDangMo(d).then(setCo)
    },
    bat && !!nguoi,
    nguoi,
  )
  return bat && !!nguoi ? co : false
}

/** Tăng 1 mỗi lần `dangMo` chuyển từ true → false (vừa đóng một màn/sheet): lúc đó nên hỏi lại kế hoạch. */
export function useLamMoiKhiDong(dangMo: boolean): number {
  const [n, setN] = useState(0)
  const truoc = useRef(dangMo)
  useEffect(() => {
    if (truoc.current && !dangMo) setN((x) => x + 1)
    truoc.current = dangMo
  }, [dangMo])
  return n
}

/** true sau khung hình đầu tiên đã vẽ: dùng để KHÔNG kéo ảnh sprite thần thú (3 MB) trước khi có chữ + thẻ. */
export function useSauVeDauTien(): boolean {
  const [xong, setXong] = useState(false)
  useEffect(() => {
    let huy = false
    const chay = () => {
      if (!huy) setXong(true)
    }
    const w = window as any
    const id = typeof w.requestIdleCallback === 'function' ? w.requestIdleCallback(chay, { timeout: 2000 }) : setTimeout(chay, 150)
    return () => {
      huy = true
      if (typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(id)
      else clearTimeout(id)
    }
  }, [])
  return xong
}

// ─── bản nhớ trong máy (theo SBD) ───────────────────────────────────────────────────────
const khoaNho = (sbd: string) => `omr_bnv_ke_hoach:${sbd}`

export function docBanNho(sbd: string, now: number): DuLieuBangNhiemVu | null {
  try {
    const t = localStorage.getItem(khoaNho(sbd))
    return t ? phucHoiBanNho(JSON.parse(t), now) : null
  } catch {
    return null
  }
}

export function luuBanNho(sbd: string, duLieu: DuLieuBangNhiemVu, now: number): void {
  const b = dongGoiBanNho(duLieu, now)
  if (!b) return
  try {
    localStorage.setItem(khoaNho(sbd), JSON.stringify(b))
  } catch {
    /* Máy đầy/chế độ riêng tư: không nhớ được thì thôi, màn vẫn chạy. */
  }
}

/**
 * Bản nhớ CÙNG NGÀY (đọc một lần cho mỗi SBD) và tự lưu khi có bản MỚI dựng từ máy chủ.
 * `moi` chỉ truyền vào khi mọi dữ liệu đã về và bản đó không phải bản cuối/nguồn trợ lý.
 */
export function useBanNho(sbd: string | undefined, moi: DuLieuBangNhiemVu | null): DuLieuBangNhiemVu | null {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const nho = useMemo(() => (sbd ? docBanNho(sbd, Date.now()) : null), [sbd])
  useEffect(() => {
    if (sbd && moi) luuBanNho(sbd, moi, Date.now())
  }, [sbd, moi])
  return nho
}

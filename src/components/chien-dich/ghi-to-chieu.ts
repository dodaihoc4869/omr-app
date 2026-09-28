// GHI ĐẠT / KHÔNG ĐẠT TỪ TỜ MÁY CHIẾU CỦA CHIẾN DỊCH — dùng LẠI đúng đường của màn Gọi lên bảng:
//   · tờ chiếu có nút nhờ `cauNoi` (`to-chieu-cau-noi.ts`), bấm nút chỉ gửi tin về khung cha;
//   · mọi tin qua `kiemTinToChieu` (đúng khung iframe tờ chiếu, đúng gốc, đúng mã phiên, ô có trên tờ) — tin lạ bỏ lặng lẽ;
//   · ghi bằng CÙNG lệnh `ghiLenBang` (máy chủ ghi `len_bang` + sổ) — không có lệnh máy chủ mới;
//   · chống ghi đôi theo khoá `sbd|qid` (ô đã ghi trả "đã ghi" ngay; ô đang chờ thì chờ đúng lượt ấy);
//   · trả `da_ghi` / `loi` cho tờ; mở tờ mới thì ô đã ghi khoá ngay (`DA_GHI`).
// Kết quả đã ghi nhớ trên máy này theo chiến dịch (localStorage) để Buổi chữa hiện lại "Đạt" / "Không đạt" cạnh tên em.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { TIN_TO_CHIEU, gocGuiLai, kiemTinToChieu, taoMaPhienChieu } from '../../lib/to-chieu-cau-noi'
import type { OGhiToChieu } from './to-chieu'

export type KetQuaLenBang = 'dat' | 'khong_dat'
/** Khoá `sbd|qid` ⇒ kết quả đã ghi. */
export type BangKetQua = Record<string, KetQuaLenBang>

const TIEN_TO_NHO = 'ddh.ketQuaLenBangChienDich.'

export function docKetQuaNho(chienDichId: string): BangKetQua {
  if (!chienDichId) return {}
  try {
    const s = globalThis.localStorage?.getItem(TIEN_TO_NHO + chienDichId)
    const j = s ? (JSON.parse(s) as unknown) : null
    if (!j || typeof j !== 'object' || Array.isArray(j)) return {}
    const ra: BangKetQua = {}
    for (const [k, v] of Object.entries(j as Record<string, unknown>)) if (v === 'dat' || v === 'khong_dat') ra[k] = v
    return ra
  } catch {
    return {}
  }
}

function ghiKetQuaNho(chienDichId: string, bang: BangKetQua) {
  if (!chienDichId) return
  try {
    globalThis.localStorage?.setItem(TIEN_TO_NHO + chienDichId, JSON.stringify(bang))
  } catch {
    /* máy chặn bộ nhớ: kết quả vẫn đã ghi lên máy chủ, chỉ mất phần hiện lại */
  }
}

/** Ghi một ô lên máy chủ bằng lệnh `ghiLenBang` (cùng lệnh màn Gọi lên bảng). Nạp động để mảnh chiến dịch không kéo cả `exam-api`. */
export async function ghiMotO(o: OGhiToChieu, dat: boolean, giayThuc?: number): Promise<{ ok: true } | { ok: false; chu: string }> {
  try {
    const [{ ghiLenBang }, { loadScriptUrl, loadTeacherSecret }] = await Promise.all([import('../../lib/exam-api'), import('../../lib/exam-db')])
    const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
    if (!url.trim() || !mat.trim()) return { ok: false, chu: 'Chưa cấu hình máy chủ — vào Cài đặt → Kết nối máy chủ' }
    await ghiLenBang(url.trim(), mat.trim(), { sbd: o.sbd, chuyenDe: o.chuyenDe, dat, qid: o.qid, ...(giayThuc !== undefined ? { giayThuc } : {}) })
    return { ok: true }
  } catch (e) {
    return { ok: false, chu: e instanceof Error ? e.message : 'Không ghi được kết quả' }
  }
}

interface Phien {
  ma: string
  o: Map<string, OGhiToChieu>
  cuaSo: Window | null
  goc: string
}

/** Hook của màn Lên bảng chiến dịch: giữ bảng kết quả của chiến dịch đang chọn và nghe tờ chiếu đang mở. */
export function useGhiToChieu(chienDichId: string) {
  const showToast = useAppStore((s) => s.showToast)
  const [ketQua, setKetQua] = useState<BangKetQua>(() => docKetQuaNho(chienDichId))
  const ketQuaRef = useRef(ketQua)
  ketQuaRef.current = ketQua
  useEffect(() => {
    const m = docKetQuaNho(chienDichId)
    ketQuaRef.current = m
    setKetQua(m)
  }, [chienDichId])

  const phien = useRef<Phien | null>(null)
  const [maDangMo, setMaDangMo] = useState('')
  const dangGhi = useRef(new Map<string, Promise<boolean>>())

  /** Bắt đầu một phiên cho tờ sắp mở; trả mã phiên để dựng tờ. */
  const moPhien = useCallback(() => {
    const ma = taoMaPhienChieu()
    phien.current = { ma, o: new Map(), cuaSo: null, goc: '*' }
    return ma
  }, [])
  /** Gắn các ô có nút (sau khi dựng tờ) và bật nghe. */
  const ganO = useCallback((ma: string, o: Map<string, OGhiToChieu>) => {
    if (phien.current?.ma !== ma) return
    phien.current.o = o
    setMaDangMo(o.size > 0 ? ma : '')
  }, [])
  const dongPhien = useCallback(() => {
    phien.current = null
    setMaDangMo('')
  }, [])

  const ghiTheoKhoa = useCallback(
    async (khoa: string, o: OGhiToChieu, dat: boolean, giayThuc?: number): Promise<boolean> => {
      if (ketQuaRef.current[khoa]) return true
      const dang = dangGhi.current.get(khoa)
      if (dang) return dang
      const luot = (async () => {
        const r = await ghiMotO(o, dat, giayThuc)
        if (!r.ok) {
          showToast(r.chu, 'error')
          return false
        }
        showToast(`${o.hoTen || o.sbd}: ${dat ? 'đạt' : 'không đạt'} — đã ghi vào ${o.chuyenDe}`, dat ? 'success' : 'warn')
        const moi = { ...ketQuaRef.current, [khoa]: dat ? 'dat' : 'khong_dat' } as BangKetQua
        ketQuaRef.current = moi
        setKetQua(moi)
        ghiKetQuaNho(chienDichId, moi)
        return true
      })()
      dangGhi.current.set(khoa, luot)
      try {
        return await luot
      } finally {
        dangGhi.current.delete(khoa)
      }
    },
    [chienDichId, showToast],
  )
  const ghiRef = useRef(ghiTheoKhoa)
  ghiRef.current = ghiTheoKhoa

  useEffect(() => {
    if (!maDangMo) return
    const gui = (p: Phien, msg: Record<string, unknown>) => {
      if (!p.cuaSo) return
      try {
        p.cuaSo.postMessage({ ...msg, maPhien: p.ma }, p.goc)
      } catch {
        /* khung đã đóng */
      }
    }
    const nghe = (e: MessageEvent) => {
      const p = phien.current
      if (!p || p.ma !== maDangMo) return
      const tin = kiemTinToChieu(e, {
        maPhien: p.ma,
        gocApp: window.location.origin,
        laKhungToChieu: (nguon) => !!nguon && [...document.querySelectorAll<HTMLIFrameElement>('.lop-xem-phieu iframe')].some((f) => f.contentWindow === nguon),
        khoaHopLe: (khoa) => p.o.has(khoa),
      })
      if (!tin) return
      const cuaSo = e.source as Window
      const goc = gocGuiLai(e.origin)
      if (tin.loai === 'san_sang') {
        p.cuaSo = cuaSo
        p.goc = goc
        gui(p, { type: TIN_TO_CHIEU.KET_NOI })
        for (const khoa of p.o.keys()) if (ketQuaRef.current[khoa]) gui(p, { type: TIN_TO_CHIEU.DA_GHI, khoa })
        return
      }
      const o = p.o.get(tin.khoa)
      if (!o) return
      void ghiRef.current(tin.khoa, o, tin.dat, tin.giayThuc?.giay).then((ok) => {
        if (phien.current !== p) return
        try {
          cuaSo.postMessage({ type: TIN_TO_CHIEU.PHAN_HOI, maPhien: p.ma, khoa: tin.khoa, kq: ok ? 'da_ghi' : 'loi', dat: ok ? tin.dat : undefined }, goc)
        } catch {
          /* khung đã đóng */
        }
      })
    }
    window.addEventListener('message', nghe)
    return () => window.removeEventListener('message', nghe)
  }, [maDangMo])

  return { ketQua, moPhien, ganO, dongPhien }
}

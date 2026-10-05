// GHI ĐẠT / KHÔNG ĐẠT TỪ TỜ MÁY CHIẾU CỦA CHIẾN DỊCH — dùng LẠI đúng đường của màn Gọi lên bảng:
//   · tờ chiếu có nút nhờ `cauNoi` (`to-chieu-cau-noi.ts`), bấm nút chỉ gửi tin về khung cha;
//   · mọi tin qua `kiemTinToChieu` (đúng khung iframe tờ chiếu, đúng gốc, đúng mã phiên, ô có trên tờ) — tin lạ bỏ lặng lẽ;
//   · ghi bằng CÙNG lệnh `ghiLenBang` (máy chủ ghi `len_bang` + sổ) — không có lệnh máy chủ mới;
//   · chống ghi đôi theo khoá `sbd|qid` (ô đã ghi trả "đã ghi" ngay; ô đang chờ thì chờ đúng lượt ấy);
//   · trả `da_ghi` / `loi` cho tờ; mở tờ mới thì ô đã ghi khoá ngay (`DA_GHI`).
// Kết quả đã ghi nhớ trên máy này theo chiến dịch (localStorage) để Buổi chữa hiện lại "Đạt" / "Chưa đạt" cạnh tên em.
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

/** Hàm ghi một ô — mặc định `ghiMotO` (lệnh `ghiLenBang`). Kiểm tra đầu giờ (29/09) truyền hàm riêng ghi qua `/gv/dau-gio` (sổ nguon='dau_gio'). */
export type GhiMotO = (o: OGhiToChieu, dat: boolean, giayThuc?: number) => Promise<{ ok: true } | { ok: false; chu: string }>

/** Nút "Thầy chữa" trên tờ (thầy 05/10): ghi ô này là THẦY ĐÃ CHỮA (không gọi em). Mỗi màn truyền đường ghi của mình;
 * mặc định `/gv/thay-chua-cau` (nhãn "Thầy đã chữa" + mốc dạy lại) với nguồn `len_bang`. */
export type ThayChuaMotO = (o: OGhiToChieu) => Promise<{ ok: true } | { ok: false; chu: string }>

/** Một lượt làm sai (nút X "Ai sai" trên tờ, thầy 05/10). */
export interface LuotSaiToChieu { sbd: string; ten: string; luc: string; noi: string; giay: number | null }

/** Lệnh thầy CHỈ ĐỌC `/gv/ai-sai-cau` — em đã làm sai các bản `qids` của một câu. */
export async function aiSaiQuaMayChu(qids: readonly string[]): Promise<{ ok: true; ds: LuotSaiToChieu[]; conNua: boolean } | { ok: false; chu: string }> {
  try {
    const [{ layCauHinhMayChu }, { loadTeacherSecret }] = await Promise.all([import('../../lib/may-chu-moi'), import('../../lib/exam-db')])
    const [ch, mat] = await Promise.all([layCauHinhMayChu(), loadTeacherSecret()])
    if (!ch.URL) return { ok: false, chu: 'Chưa kết nối được máy chủ.' }
    const res = await fetch(`${ch.URL}/gv/ai-sai-cau`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': mat || '' },
      body: JSON.stringify({ qids }),
    })
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; ds?: LuotSaiToChieu[]; conNua?: boolean }
    return j.ok === true && Array.isArray(j.ds) ? { ok: true, ds: j.ds, conNua: j.conNua === true } : { ok: false, chu: j.error || 'Không đọc được danh sách làm sai.' }
  } catch {
    return { ok: false, chu: 'Không nối được máy chủ.' }
  }
}

/** Gửi kết quả `AI_SAI` về đúng khung tờ chiếu (dùng chung cho mọi màn nghe tờ). */
export function traAiSai(cuaSo: Window, goc: string, maPhien: string, id: string, r: Awaited<ReturnType<typeof aiSaiQuaMayChu>>) {
  try {
    cuaSo.postMessage({ type: TIN_TO_CHIEU.AI_SAI_TRA, maPhien, id, ...(r.ok ? { ds: r.ds, conNua: r.conNua } : { loi: r.chu }) }, goc)
  } catch {
    /* khung đã đóng */
  }
}

/** Lệnh máy chủ chung `/gv/thay-chua-cau` — Gọi lên bảng / Dạy học. */
export async function thayChuaQuaMayChu(o: { sbd: string; qid: string }, nguon: 'len_bang' | 'day_hoc', maNguon: string): Promise<{ ok: true } | { ok: false; chu: string }> {
  try {
    const [{ layCauHinhMayChu }, { loadTeacherSecret }] = await Promise.all([import('../../lib/may-chu-moi'), import('../../lib/exam-db')])
    const [ch, mat] = await Promise.all([layCauHinhMayChu(), loadTeacherSecret()])
    if (!ch.URL) return { ok: false, chu: 'Chưa kết nối được máy chủ.' }
    const res = await fetch(`${ch.URL}/gv/thay-chua-cau`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': mat || '' },
      body: JSON.stringify({ sbd: o.sbd, qid: o.qid, nguon, maNguon }),
    })
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
    return j.ok === true ? { ok: true } : { ok: false, chu: j.error || 'Không ghi được "Thầy đã chữa".' }
  } catch {
    return { ok: false, chu: 'Không nối được máy chủ — chưa ghi "Thầy đã chữa".' }
  }
}

/** Hook của màn Lên bảng chiến dịch: giữ bảng kết quả của chiến dịch đang chọn và nghe tờ chiếu đang mở. */
/** `aiSaiQids` (nút X): các qid cần tra cho ô `o` — chiến dịch truyền cả nhóm câu trùng nội dung; mặc định `[o.qid]`. */
export function useGhiToChieu(chienDichId: string, ghiO: GhiMotO = ghiMotO, thayChuaO?: ThayChuaMotO, aiSaiQids?: (o: OGhiToChieu) => string[]) {
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
  /** Ô đã bấm "Thầy chữa" thành công trong lúc màn này mở (khoá `sbd|qid`) — gửi lại lúc tờ bắt tay để tờ mới khoá ngay. */
  const daThayChua = useRef(new Set<string>())
  const dangThayChua = useRef(new Map<string, Promise<boolean>>())
  const thayChuaRef = useRef(thayChuaO)
  thayChuaRef.current = thayChuaO
  const aiSaiRef = useRef(aiSaiQids)
  aiSaiRef.current = aiSaiQids
  useEffect(() => {
    daThayChua.current = new Set()
  }, [chienDichId])
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
        const r = await ghiO(o, dat, giayThuc)
        if (!r.ok) {
          showToast(r.chu, 'error')
          return false
        }
        showToast(`${o.hoTen || o.sbd}: ${dat ? 'đạt' : 'không đạt'} — đã ghi vào ${o.chuyenDe || 'sổ học'}`, dat ? 'success' : 'warn')
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
    [chienDichId, showToast, ghiO],
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
        for (const khoa of p.o.keys()) if (daThayChua.current.has(khoa)) gui(p, { type: TIN_TO_CHIEU.THAY_CHUA_XONG, khoa, kq: 'da_ghi' })
        return
      }
      const o = p.o.get(tin.khoa)
      if (!o) return
      if (tin.loai === 'ai_sai') {
        const id = tin.id
        void aiSaiQuaMayChu(aiSaiRef.current?.(o) ?? [o.qid]).then((r) => {
          if (phien.current === p) traAiSai(cuaSo, goc, p.ma, id, r)
        })
        return
      }
      if (tin.loai === 'thay_chua') {
        const khoa = tin.khoa
        const tra = (ok: boolean) => {
          if (phien.current !== p) return
          try {
            cuaSo.postMessage({ type: TIN_TO_CHIEU.THAY_CHUA_XONG, maPhien: p.ma, khoa, kq: ok ? 'da_ghi' : 'loi' }, goc)
          } catch {
            /* khung đã đóng */
          }
        }
        if (daThayChua.current.has(khoa)) return tra(true)
        let luot = dangThayChua.current.get(khoa)
        if (!luot) {
          const ham = thayChuaRef.current ?? ((x: OGhiToChieu) => thayChuaQuaMayChu(x, 'len_bang', chienDichId || 'len-bang'))
          luot = ham(o).then((r) => {
            if (!r.ok) {
              showToast(r.chu, 'error')
              return false
            }
            daThayChua.current.add(khoa)
            showToast(`Câu của ${o.hoTen || o.sbd}: đã ghi "Thầy đã chữa"`, 'success')
            return true
          })
          dangThayChua.current.set(khoa, luot)
          void luot.finally(() => dangThayChua.current.delete(khoa))
        }
        void luot.then(tra)
        return
      }
      if (tin.loai === 'ho_so') {
        // Bảng chi tiết em trên tờ chiếu (bản vẽ 28/09): app gọi lệnh thầy chỉ-đọc rồi trả về đúng khung.
        void import('../../lib/ho-so-em-thay').then(({ layHoSoLenBang }) => layHoSoLenBang(o.sbd, o.qid)).catch(() => null).then((hoSo) => {
          if (phien.current !== p) return
          try {
            cuaSo.postMessage({ type: TIN_TO_CHIEU.HO_SO_TRA, maPhien: p.ma, id: tin.id, ...(hoSo ? { hoSo } : { loi: 'loi' }) }, goc)
          } catch {
            /* khung đã đóng */
          }
        })
        return
      }
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
  }, [maDangMo, chienDichId, showToast])

  // `ghi`: nút Đúng / Sai NGAY TRÊN MÀN THẦY (bảng Dạy học, 28/09) — cùng khoá `sbd|qid`, cùng chống ghi đôi, cùng lệnh `ghiLenBang` như nút trên tờ.
  return { ketQua, moPhien, ganO, dongPhien, ghi: ghiTheoKhoa }
}

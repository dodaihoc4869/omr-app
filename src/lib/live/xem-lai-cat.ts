// XEM LẠI LIVE — TỰ CẮT ĐOẠN + TỰ CHỌN ĐOẠN ĐÁNG XEM (đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.4, 4.5). Thuần: không mạng, không đồng hồ.
// Mọi mốc ở đây là mili-giây trên TRỤC TIẾNG cuối cùng (0 = đầu `tieng.mp3`; các lần tắt / bật live nối liền; khoảng của câu chưa mở đáp án ĐÃ bị cắt
// trước khi vào đây — luật 7 nằm ở xem-lai-dung.ts). Đoạn, lặng, vạch chỉ là CHỈ MỤC: đổi luật thì dựng lại, không mất gì.
import type { KhoangMs, LoaiDoanLive } from './xem-lai-kieu'
import { MUC_MS, mucTuDb } from './xem-lai-khuc'

export const LUAT_CAT = {
  /** Đoạn «lên bảng» bắt đầu 2 giây trước lúc thầy gọi. */
  luiGoiMs: 2000,
  /** Đoạn «thầy chữa» bắt đầu 3 giây trước nét đầu. */
  luiNetMs: 3000,
  /** Cụm nét: các nét cách nhau dưới 8 giây; từ 5 nét VÀ (từ 10 giây có tiếng HOẶC buổi không có tiếng) — 11/11 hạ từ 30 giây cho hợp buổi thật. */
  cumNetMs: 8000,
  cumNetSo: 5,
  chuaTiengMs: 10_000,
  /** Lặng từ 6 giây ⇒ vào chỉ mục (giữ 0,5 giây hai đầu); lặng từ 90 giây giữa đoạn ⇒ đoạn dừng, có tiếng / nét lại thì mở phần 2. */
  langMs: 6000,
  langGiuMs: 500,
  langNgatMs: 90_000,
  /** Đoạn vụn bị bỏ; GIỮ đoạn khi có từ 8 giây tiếng sau khi bỏ lặng HOẶC từ 3 nét (11/11, trước: dưới 20 giây tiếng là bỏ — buổi mic câm mất hết đoạn). */
  vunMs: 8000,
  vunNetSo: 3,
  /** Ngưỡng lặng khởi điểm −45 dBFS (hiệu chỉnh ở đợt X3). */
  nguong: mucTuDb(-45),
  /** Buổi không có tiếng: một ô coi là «có hoạt động» khi có nét trong vòng 4 giây. */
  quanhNetMs: 4000,
} as const

export interface LuotCat {
  /** Số lượt của phòng. */
  so: number
  /** Chương của câu: từ «mở câu» tới trước lượt kế. */
  t0: number
  t1: number
  /** Lúc mở đáp án (null = không rõ ⇒ coi như cuối chương). */
  moDapAn: number | null
  /** Các lúc thầy BẬT TAY bảng live (không gọi ai). */
  bangTay: number[]
  /** Các lần gọi em lên bảng. */
  goi: { t: number; sbd: string }[]
}
export interface DauVaoCat {
  msLive: number
  /** Chỉ các lượt được vào trang xem lại (đã mở đáp án, hoặc đã chữa trên bảng — khi đó `moDapAn` = null), theo thứ tự thời gian. */
  luot: LuotCat[]
  /** Mốc nối giữa hai lần live (tắt rồi bật lại) — đoạn không vắt qua. */
  ranh: number[]
  /** Nét thầy VIẾT (không tính nét dựng lại tức thì): lúc bắt đầu + thời lượng. Xếp theo `t`. */
  net: { t: number; ms: number }[]
  /** Mức âm mỗi 0,5 giây trên trục tiếng (0..255). */
  muc: ArrayLike<number>
  coTieng: boolean
  nguong?: number
}
export interface DoanCat {
  loai: LoaiDoanLive
  luot: number
  sbd: string | null
  t0: number
  t1: number
  /** Phần thứ mấy (1 = không bị ngắt). */
  phan: number
  giayCoTieng: number
  soNet: number
}

const giao = (a0: number, a1: number, b0: number, b1: number): number => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0))

/** Các khoảng LẶNG thô (chưa trừ 0,5 giây hai đầu): mức âm dưới ngưỡng VÀ không có nét, liền từ 6 giây. */
export function timLang(v: Pick<DauVaoCat, 'msLive' | 'net' | 'muc' | 'coTieng' | 'nguong'>): KhoangMs[] {
  const soO = Math.ceil(v.msLive / MUC_MS), nguong = v.nguong ?? LUAT_CAT.nguong
  if (soO <= 0) return []
  const coNet = new Uint8Array(soO), quanh = v.coTieng ? 0 : LUAT_CAT.quanhNetMs
  for (const n of v.net) {
    const a = Math.max(0, Math.floor((n.t - quanh) / MUC_MS)), z = Math.min(soO - 1, Math.floor((n.t + Math.max(0, n.ms) + quanh) / MUC_MS))
    for (let i = a; i <= z; i++) coNet[i] = 1
  }
  const ra: KhoangMs[] = []
  let dau = -1
  for (let i = 0; i <= soO; i++) {
    const lang = i < soO && !coNet[i] && (!v.coTieng || (v.muc[i] ?? 0) < nguong)
    if (lang && dau < 0) dau = i
    if (!lang && dau >= 0) {
      const t0 = dau * MUC_MS, t1 = Math.min(v.msLive, i * MUC_MS)
      if (t1 - t0 >= LUAT_CAT.langMs) ra.push([t0, t1])
      dau = -1
    }
  }
  return ra
}
/** Chỉ mục lặng cho trình phát: giữ 0,5 giây hai đầu. */
export const langChiMuc = (tho: readonly KhoangMs[]): KhoangMs[] => tho.map(([a, b]) => [a + LUAT_CAT.langGiuMs, b - LUAT_CAT.langGiuMs] as KhoangMs).filter(([a, b]) => b > a)

/** Cắt đoạn theo luật 1–6. Trả đoạn xếp theo thời gian + chỉ mục lặng. */
export function catDoan(v: DauVaoCat): { doan: DoanCat[]; lang: KhoangMs[]; langTho: KhoangMs[] } {
  const langTho = timLang(v), lang = langChiMuc(langTho)
  const ranh = [...v.ranh].filter((r) => r > 0 && r < v.msLive).sort((a, b) => a - b)
  const net = [...v.net].sort((a, b) => a.t - b.t)
  const tiengMs = (a: number, b: number): number => (b - a) - lang.reduce((s, [x, y]) => s + giao(a, b, x, y), 0)
  /** Mốc nối gần nhất không vượt `t` (0 nếu không có) / mốc nối đầu tiên sau `t` (Infinity nếu không có). */
  const ranhTruoc = (t: number): number => { let r = 0; for (const x of ranh) if (x <= t) r = x; return r }
  const ranhSau = (t: number): number => { for (const x of ranh) if (x > t) return x; return Infinity }

  const tho: { loai: LoaiDoanLive; luot: number; sbd: string | null; t0: number; t1: number }[] = []
  for (const l of v.luot) {
    if (!(l.t1 > l.t0)) continue
    // Luật 2 — «lên bảng»: 2 giây trước lúc gọi ⇒ lượt mới / lần gọi kế / tắt live. Chấm và mở đáp án KHÔNG kết thúc đoạn.
    const goi = l.goi.filter((g) => g.t >= l.t0 && g.t < l.t1).sort((a, b) => a.t - b.t)
    const lenBang: [number, number][] = []
    goi.forEach((g, i) => {
      const truoc = lenBang.length ? lenBang[lenBang.length - 1]![1] : l.t0
      const t0 = Math.max(l.t0, truoc, ranhTruoc(g.t), g.t - LUAT_CAT.luiGoiMs)
      const t1 = Math.min(i + 1 < goi.length ? goi[i + 1]!.t : l.t1, ranhSau(g.t))
      if (t1 > t0) { lenBang.push([t0, t1]); tho.push({ loai: 'len_bang', luot: l.so, sbd: g.sbd, t0, t1 }) }
    })
    // Luật 3 — «thầy chữa»: sau khi mở đáp án hoặc khi bảng live bật tay, ngoài các đoạn lên bảng.
    const moc = [l.moDapAn ?? l.t1, ...l.bangTay].filter((t) => t >= l.t0 && t < l.t1)
    if (!moc.length) continue
    let cua: [number, number][] = [[Math.min(...moc), l.t1]]
    for (const [a, b] of lenBang) cua = cua.flatMap(([x, y]) => (b <= x || a >= y ? [[x, y]] : [[x, a], [b, y]]) as [number, number][])
    for (const r of ranh) cua = cua.flatMap(([x, y]) => (r > x && r < y ? [[x, r], [r, y]] : [[x, y]]) as [number, number][])
    for (const [a, b] of cua) {
      const trong = net.filter((n) => n.t >= a && n.t < b)
      // cụm đầu tiên đủ 5 nét
      let dau = 0, cum: { t: number; ms: number }[] | null = null
      for (let i = 1; i <= trong.length; i++) {
        if (i === trong.length || trong[i]!.t - (trong[i - 1]!.t + trong[i - 1]!.ms) >= LUAT_CAT.cumNetMs) {
          if (i - dau >= LUAT_CAT.cumNetSo) { cum = trong.slice(dau, i); break }
          dau = i
        }
      }
      if (!cum) continue
      const t0 = Math.max(a, cum[0]!.t - LUAT_CAT.luiNetMs)
      // đuôi: tới hoạt động cuối (nét hoặc tiếng) trong cửa — bỏ khoảng lặng thô chạm cuối cửa
      let t1 = b
      for (const [x, y] of langTho) if (y >= b && x > t0 && x < t1) t1 = Math.min(b, x + LUAT_CAT.langGiuMs)
      if (!v.coTieng || tiengMs(t0, t1) >= LUAT_CAT.chuaTiengMs) tho.push({ loai: 'thay_chua', luot: l.so, sbd: null, t0, t1 })
    }
  }

  // Luật 4 — lặng từ 90 giây giữa đoạn ⇒ đoạn dừng ở đó, hết lặng thì mở phần kế. Luật 5 — phần vụn (dưới 8 giây tiếng VÀ dưới 3 nét) bị bỏ.
  const doan: DoanCat[] = []
  for (const d of tho.sort((a, b) => a.t0 - b.t0)) {
    let manh: [number, number][] = [[d.t0, d.t1]]
    for (const [x, y] of langTho) {
      if (y - x < LUAT_CAT.langNgatMs) continue
      manh = manh.flatMap(([a, b]) => {
        if (y <= a || x >= b) return [[a, b]] as [number, number][]
        const ra: [number, number][] = []
        if (x + LUAT_CAT.langGiuMs > a && x > a) ra.push([a, Math.min(b, x + LUAT_CAT.langGiuMs)])
        if (y - LUAT_CAT.langGiuMs < b && y < b) ra.push([Math.max(a, y - LUAT_CAT.langGiuMs), b])
        return ra
      })
    }
    let phan = 0
    for (const [a, b] of manh) {
      const coTieng = tiengMs(a, b), soNet = net.filter((n) => n.t >= a && n.t < b).length
      if (b <= a || (coTieng < LUAT_CAT.vunMs && soNet < LUAT_CAT.vunNetSo)) continue
      phan += 1
      doan.push({ loai: d.loai, luot: d.luot, sbd: d.sbd, t0: Math.round(a), t1: Math.round(b), phan, giayCoTieng: Math.round(coTieng / 1000), soNet })
    }
  }
  return { doan: doan.sort((a, b) => a.t0 - b.t0), lang, langTho }
}

// ── ĐOẠN ĐÁNG XEM (mục 4.5): luật đo được, không đoán nội dung ──
export const LUAT_DANG_XEM = { guiToiThieu: 10, tiLeKho: 0.6, netToiThieu: 30, netGapTrungVi: 1.5, giangLauGiay: 240, diemToiThieu: 2, itDoan: 3 } as const
export interface DoanDiem { stt: number; luot: number; loai: LoaiDoanLive; dat: boolean | null; t0: number; t1: number; soNet: number; giayCoTieng: number }
export interface CauDiem { luot: number; soDung: number; soGui: number; tuLuan: boolean }

/** Chấm điểm bốn luật L1–L4 rồi lấy tối đa 2 đoạn điểm cao nhất, điểm từ 2 (buổi có ≤ 3 đoạn: tối đa 1); hoà điểm ⇒ đoạn dài hơn.
 *  Trả `stt` ⇒ chữ lý do (luật nhiều điểm nhất mà đoạn đạt). Không đoạn nào đủ điểm ⇒ Map rỗng (không gắn nhãn, không ép). */
export function chonDangXem(doan: readonly DoanDiem[], cau: readonly CauDiem[]): Map<number, { lyDo: string; diem: number }> {
  const L = LUAT_DANG_XEM, ra = new Map<number, { lyDo: string; diem: number }>()
  if (!doan.length) return ra
  const tiLe = new Map<number, number>()
  for (const c of cau) if (!c.tuLuan && c.soGui > 0) tiLe.set(c.luot, c.soDung / c.soGui)
  // L1: câu tỉ lệ đúng thấp nhất buổi (từ 10 em gửi, ≤ 60 %) — hoà thì câu chiếu trước.
  let cauKho: number | null = null, thap = Infinity
  for (const c of cau) { const r = tiLe.get(c.luot); if (r != null && c.soGui >= L.guiToiThieu && r <= L.tiLeKho && r < thap) { thap = r; cauKho = c.luot } }
  // L2: đoạn nhiều nét nhất (từ 30 nét và ≥ 1,5 lần trung vị).
  const xepNet = doan.map((d) => d.soNet).sort((a, b) => a - b)
  const trungVi = xepNet.length % 2 ? xepNet[(xepNet.length - 1) / 2]! : (xepNet[xepNet.length / 2 - 1]! + xepNet[xepNet.length / 2]!) / 2
  const nhieuNet = [...doan].sort((a, b) => b.soNet - a.soNet || (b.t1 - b.t0) - (a.t1 - a.t0) || a.stt - b.stt)[0]!
  const coL2 = nhieuNet.soNet >= L.netToiThieu && nhieuNet.soNet >= L.netGapTrungVi * trungVi
  // L4: đoạn có tiếng dài nhất sau khi bỏ lặng (từ 4 phút).
  const lauNhat = [...doan].sort((a, b) => b.giayCoTieng - a.giayCoTieng || a.stt - b.stt)[0]!
  const coL4 = lauNhat.giayCoTieng >= L.giangLauGiay
  const cham = doan.map((d) => {
    const ly: [number, string][] = []
    if (cauKho != null && d.luot === cauKho) ly.push([3, 'cả lớp sai nhiều nhất'])
    if (coL2 && d.stt === nhieuNet.stt) ly.push([2, `thầy viết nhiều nhất (${d.soNet} nét)`])
    if (d.loai === 'len_bang' && d.dat === true && (tiLe.get(d.luot) ?? 1) <= L.tiLeKho) ly.push([2, 'bạn lên bảng Đạt ở câu khó'])
    if (coL4 && d.stt === lauNhat.stt) ly.push([1, 'thầy giảng lâu nhất'])
    return { d, diem: ly.reduce((s, x) => s + x[0], 0), lyDo: ly.length ? ly.sort((a, b) => b[0] - a[0])[0]![1] : '' }
  })
  const toiDa = doan.length <= L.itDoan ? 1 : 2
  for (const x of cham.filter((x) => x.diem >= L.diemToiThieu).sort((a, b) => b.diem - a.diem || (b.d.t1 - b.d.t0) - (a.d.t1 - a.d.t0) || a.d.stt - b.d.stt).slice(0, toiDa)) ra.set(x.d.stt, { lyDo: x.lyDo, diem: x.diem })
  return ra
}

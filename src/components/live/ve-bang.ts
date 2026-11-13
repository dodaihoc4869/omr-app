// LIVE BẢNG — VẼ NÉT TRÊN MÁY EM (đặc tả mục 4.4). Cùng bộ dựng nét với máy thầy (`taoLoiBut()` chạy chính chuỗi JS của tờ chiếu) ⇒ cùng dữ liệu, cùng hình.
// Hai lớp canvas: «đã chốt» (vẽ một lần; chỉ vẽ lại khi đổi cỡ / xoá / bảng mới) và «đang viết» (mỗi khung xoá đúng ô vừa vẽ rồi vẽ lại đoạn đuôi nét dở).
// Lớp «đang viết» là một canvas NHỎ ĐI THEO ĐẦU BÚT (không phủ cả màn): mỗi khung trình duyệt phải chép lại cả mặt canvas vừa đổi ⇒ canvas nhỏ thì việc mỗi
// khung nhỏ theo (đo máy em CPU ×4: luồng chính bận 73 % với canvas phủ màn). Đuôi nét dở dài quá khổ canvas ⇒ in sớm phần đã ổn định xuống lớp chốt.
// Nét dở dài thì phần đầu đã ổn định in dần xuống lớp đã chốt (`mocDong`) ⇒ mỗi khung chỉ dựng đoạn đuôi, như máy thầy.
// Khung quy chiếu = «cửa sổ thầy ảo» (bo-cuc.ts): canvas chỉ phủ vùng chiếu nên mọi nét dời (−ox, −oy).
//
// 11/11 (thầy thử máy thật: «đồng bộ nét bút tức thì mượt mà cực mượt mà» · «bảng đen khi live có cuộn vô hạn»):
//   · ĐUÔI nét dở luôn vẽ đúng dáng nét xong (đã thon cuối) ⇒ lúc nét chốt hình không đổi (bản trước: nhấc bút là cuối nét co lại);
//   · BẢNG ĐEN CUỘN: nét bảng (mã «b_…», y tính theo bảng, có thể > 1) đã chốt nằm trong một KHUNG CẮT đặt đúng ô bảng đen; bên trong là một canvas cao
//     2,2 lần ô bảng, dời bằng transform (chỉ việc của bộ ghép hình, không vẽ lại) ⇒ cuộn mượt cả trên máy yếu. Canvas chỉ vẽ lại khi tầm nhìn sắp ra
//     khỏi nó, vào lúc đã đứng yên. Máy em TỰ TRÔI THEO BÚT của thầy: đầu nét / con trỏ ra khỏi tầm nhìn thì trôi tới (`theo`).
//     Nét trên giấy đề (mã thường) đứng yên như cũ. Không thêm loại khung mạng nào: độ cuộn của thầy tới qua gói con trỏ có x = 2 (`datBut(…, cuon)`)
//     ⇒ máy em soi đúng chỗ thầy đang soi; chưa nhận được (em vào muộn, xem lại buổi live) thì suy ra từ chính toạ độ nét / con trỏ.
//   · BÀN TAY CẦM BÚT của thầy (thay chấm tròn vàng; tro-but.ts) vẽ ngay trên lớp «đang viết», cùng lượt với đuôi nét: hình bàn tay dựng MỘT lần vào một
//     canvas rời (không gắn vào trang; dựng lại chỉ khi đổi cỡ / dáng / màu mực), mỗi khung dán một lệnh `drawImage` — không đụng DOM, không thêm lớp.
//     Khung nào không có đuôi nét mà bàn tay y như khung trước thì KHÔNG vẽ gì. `datBut` mỗi khung trước `veSong`.
//   · LỚP RỖNG THÌ ẨN (11/11): mỗi khung hình trình duyệt phải nộp lại MỌI canvas đang hiện, vẽ hay không (đo máy em CPU ×4, 5,2 giây viết: 1552 ms cho ba
//     lớp, còn 741 ms khi ẩn lớp giấy đang rỗng). Lớp giấy chưa có nét ⇒ `visibility: hidden`; khung bảng cuộn chưa có nét ⇒ cũng ẩn.
//   · GIẤY VÀ BẢNG CO GIÃN ĐỘC LẬP (11/11 chiều, thầy: «Làm chuẩn cái này luôn nhé. Tối ưu cho hs nhất có thể»): `KhungVe.dl` có ⇒ HAI phép biến đổi —
//     nét giấy theo (Wv, Hv, ox, oy) như cũ nhưng lớp chốt của giấy là ĐÚNG TẤM GIẤY (nằm trong khung cuộn của giấy, trình duyệt cuộn nó cùng chữ đề),
//     nét bảng «b_…» theo cửa sổ thầy ảo riêng (`dl.bWv…`). Lớp «đang viết» vẫn là MỘT canvas chạy trong cả hình: đuôi nét giấy trừ độ cuộn của giấy
//     (`datCuonGiay`), đuôi nét bảng trừ độ cuộn của bảng, mỗi đuôi cắt theo ô nhìn của vùng nó. Ô nhìn của bảng thấp hơn tầm nhìn của thầy (bảng phóng
//     to) ⇒ máy em tự trôi theo bút TRONG tầm nhìn của thầy. Em tự vuốt bảng xem lại: `vuotBang`. `dl` vắng ⇒ y như trước (một phép co).
import type { KhungBut, LoiBut, NetBut, SuKienBut, XuLyBut } from '../../lib/but-bang-loi'
import { giaiTrang, VUNG_MAC_DINH, type O4 } from './bo-cuc'
import { LAZE_R, LAZE_TRE_MS, O_TAY, coTay, taoTroBut, tiLeTay, veLaze, veTay, type DangTay, type MauBut } from './tro-but'

type G2 = CanvasRenderingContext2D
/** Trần diện tích của lớp chốt (điểm ảnh thật). */
const TRAN_DIEM_ANH = 8e6
type Hop = [number, number, number, number]
interface NetCoNho extends NetBut { _k?: string; _d?: Path2D | number[] }
/** Nét đang viết: `net.diem` lớn dần; `st` = trạng thái xử lý dần; `dong` = mốc đã in xuống lớp chốt; `bang` = nét bảng (cuộn). */
interface NetDo { net: NetBut; st: XuLyBut; dong: number; dau: [number, number] | null; bang: boolean }

export interface KhungVe {
  /** Cửa sổ thầy ảo (px CSS của máy em, đã nhân tỉ lệ co). */
  Wv: number
  Hv: number
  /** Góc vùng chiếu trong cửa sổ ảo (px CSS). */
  ox: number
  oy: number
  /** Cỡ canvas (px CSS) + mật độ điểm ảnh. */
  w: number
  h: number
  dpr: number
  /** Bố cục độc lập (bo-cuc-doc-lap.ts): có ⇒ các số ở trên là của GIẤY (canvas chốt = tấm giấy), bảng đen theo phép riêng. Vắng ⇒ một phép co như cũ. */
  dl?: KhungDocLap
}
/** Mọi số là px CSS trong HÌNH (hình = cả lớp bảng live của máy em). */
export interface KhungDocLap {
  /** Khổ hình — lớp «đang viết» chạy trong cả hình. */
  hw: number
  hh: number
  /** Ô NHÌN của giấy: góc = chỗ góc tấm giấy lúc chưa cuộn; đuôi nét trên giấy cắt theo ô này. */
  gx: number
  gy: number
  gw: number
  gh: number
  /** Cửa sổ thầy ảo của BẢNG + góc của nó trong hình (như Wv, Hv, ox, oy, cho nét «b_…»). */
  bWv: number
  bHv: number
  box: number
  boy: number
  /** Bề cao NHÌN THẤY của bảng đen trên máy em (có thể thấp hơn ô bảng của thầy đã phóng). */
  bh: number
  /** Góc của khung chứa khung cuộn bảng (`noiBang` của `taoVeBang`) trong hình. */
  kx: number
  ky: number
}

/** Nét dở dồn đủ ngần này điểm mới in xuống lớp chốt (chữ viết thường không tới ⇒ cả nét là MỘT đa giác, chốt xong không đổi điểm ảnh nào). */
const IT_NET = 160
/** Canvas bảng cao gấp ngần này lần ô bảng đen. */
const CAO_BANG = 2.2
/** Trôi theo bút: hằng số thời gian (ms). */
const TROI_MS = 110

/** `noiBang`: phần tử chứa khung cuộn của bảng đen (bố cục độc lập: chính là khung bảng, để khung cuộn đi cùng khi khung bảng trượt / nở). Vắng ⇒ đặt cạnh lớp «đang viết» như cũ. */
export function taoVeBang(loi: LoiBut, cvChot: HTMLCanvasElement, cvSong: HTMLCanvasElement, noiBang?: HTMLElement | null) {
  const nguCanh = (c: HTMLCanvasElement): G2 | null => { try { return c.getContext('2d') } catch { return null } }
  const gC = nguCanh(cvChot), gS = nguCanh(cvSong)
  const coPath = typeof Path2D === 'function'
  let kv: KhungVe | null = null, KH: KhungBut | null = null
  /** BỐ CỤC ĐỘC LẬP: khung của nét BẢNG (một phép co ⇒ trùng `KH`) · cửa sổ thầy ảo của bảng + góc · góc tấm giấy trong hình · khổ hình · góc khung chứa. */
  let dl: KhungDocLap | null = null, KHB: KhungBut | null = null
  let bW = 1, bH = 1, bOx = 0, bOy = 0, gX = 0, gY = 0, hW = 1, hH = 1, kX = 0, kY = 0
  /** Độ cuộn của khung GIẤY (px CSS) — nơi dựng báo qua `datCuonGiay`. */
  let cuonG = 0
  /** Em đang tự vuốt bảng: tầm nhìn đứng ở `tayY` (không trôi theo bút) · trần vuốt xuống. */
  let tuTay = false, tayY = 0, tayTran = 0
  let daDocMau = false
  let ds: NetCoNho[] = []
  const doDang = new Map<string, NetDo>()
  /** Ô vừa vẽ trên lớp sống (px thiết bị) — khung sau xoá đúng chỗ này. */
  let ban: Hop | null = null
  /** Lớp sống: cạnh (px CSS) + góc trên-trái trong hình (px CSS, đã làm tròn theo điểm ảnh thiết bị). Một lớp cho cả nét giấy, nét bảng và cây bút. */
  let canh = 320, sx = 0, sy = 0
  // ── BÀN TAY CẦM BÚT CỦA THẦY: hình dựng sẵn trong canvas rời, mỗi khung dán vào lớp «đang viết» ──
  const yeu = typeof document !== 'undefined' && document.documentElement.classList.contains('may-yeu')
  const but = taoTroBut({ yeu })
  let butDich: { x: number; y: number; cham: boolean; net?: string; mau?: string; sat?: boolean } | null = null
  const mauBut: MauBut = { than: 'white', dai: 'orange', bong: 'black', muc: '' }
  let cvTay: HTMLCanvasElement | null = null, gTay: G2 | null = null
  // CHẤM LAZE (13/11): thầy nhấc bút quá LAZE_TRE_MS ⇒ thay cây bút bằng chấm đỏ đúng chỗ ngòi (nhấc giữa hai nét của một chữ thì vẫn là cây bút)
  let cvLaze: HTMLCanvasElement | null = null, gLaze: G2 | null = null, hinhLaze = '', mauLaze = 'red', lucChamBut = -1e12, laze = false
  /** Dáng tay · cỡ tay (px CSS) · khoá hình đã dựng · chỗ ngòi trong hình dựng sẵn (px thiết bị) · khoá của khung vừa vẽ khi lớp sống CHỈ có bàn tay. */
  let dangTay: DangTay = 'but', coT = 18, hinhTay = '', tayAx = 0, tayAy = 0, tayVe = ''
  /** Lớp giấy / khung bảng đang có nét không · đang hiện không (lớp rỗng thì ẩn). */
  let coGiay = false, coBang = false, hienGiay = true, hienBang = true

  // ── BẢNG ĐEN CUỘN ──
  /** Ô bảng đen 0..1 theo cửa sổ thầy (đi cùng khoá trang). */
  let B: O4 = VUNG_MAC_DINH.bang
  let khung: HTMLDivElement | null = null, trong: HTMLDivElement | null = null, cvB: HTMLCanvasElement | null = null, gB: G2 | null = null
  /** Ô bảng trong hình (px CSS, tròn theo điểm ảnh thiết bị) · bề cao canvas bảng · gốc nội dung của canvas bảng (px CSS kể từ mép trên ô bảng lúc chưa cuộn). */
  let bx = 0, by = 0, bw = 0, bh = 0, HB = 0, goc = 0
  /** Độ cuộn hiện tại / đích, tính bằng số lần bề dọc cửa sổ thầy (cùng đơn vị với y của nét). */
  let cuon = 0, dich = 0, lucCuon = 0
  /** Độ cuộn của THẦY (thư viện live báo qua `datBut`); null = chưa biết ⇒ tự trôi theo bút. */
  let cuonThay: number | null = null
  const doc = cvSong.ownerDocument, cha = noiBang ?? cvSong.parentNode
  if (doc && cha) {
    // lớp vẽ dựng lại (đổi vé, đổi phòng) ⇒ gỡ khung cuộn của lần trước
    for (const c of Array.from(cha.childNodes)) if ((c as HTMLElement).className === 'lv-cuon') cha.removeChild(c)
    khung = doc.createElement('div'); trong = doc.createElement('div'); cvB = doc.createElement('canvas')
    khung.className = 'lv-cuon'; khung.setAttribute('aria-hidden', 'true')
    khung.style.cssText = 'position:absolute;left:0;top:0;overflow:hidden;pointer-events:none;contain:strict'
    trong.style.cssText = 'position:absolute;left:0;top:0;will-change:transform'
    cvB.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none'
    trong.appendChild(cvB); khung.appendChild(trong)
    // khung cuộn nằm DƯỚI lớp «đang viết» (đuôi nét dở + cây bút luôn ở trên cùng, không bị ô bảng cắt)
    if (noiBang) noiBang.appendChild(khung); else cha.insertBefore(khung, cvSong)
    gB = nguCanh(cvB)
    cvTay = doc.createElement('canvas')
    gTay = nguCanh(cvTay)
    cvLaze = doc.createElement('canvas'); gLaze = nguCanh(cvLaze)
  }
  /** Nét thuộc BẢNG: mã «b_…»; bố cục độc lập còn tính cả nét mã thường BẮT ĐẦU trong ô bảng đen (bản ghi / máy thầy trước khi có mã «b_»: nét ấy vốn nằm
   *  trên cột bảng, toạ độ theo cửa sổ thầy = toạ độ bảng lúc chưa cuộn) — hai khung co riêng nên nét phải theo phép của khung nó nằm trên. */
  const laBang = (n: { id: string; diem?: readonly (readonly number[])[] }): boolean => {
    if (!gB) return false
    if (loi.laBang(n)) return true
    const p = dl && n.diem ? n.diem[0] : undefined
    return !!p && p[0]! >= B[0] && p[0]! <= B[2] && p[1]! >= B[1] && p[1]! <= B[3]
  }
  const tron = (v: number): number => { const d = kv!.dpr; return Math.round(v * d) / d }
  const cuonPx = (): number => tron(cuon * bH)
  /** Tầm nhìn của máy em trên bảng (số lần bề dọc cửa sổ thầy) — bố cục độc lập có thể THẤP hơn tầm nhìn của thầy. */
  const nhinBang = (): number => (dl ? bh / bH : B[3] - B[1])

  /** Dựng hình bàn tay cầm bút vào canvas rời — CHỈ khi cỡ / dáng / màu / mật độ đổi. Hình ĐẶC; độ rõ đặt lúc dán. */
  function dungHinhTay(): void {
    const d = kv!.dpr, khoa = `${coT}|${dangTay}|${mauBut.muc}|${mauBut.than}|${d}`
    if (khoa === hinhTay || !cvTay || !gTay) return
    hinhTay = khoa
    const s = tiLeTay(coT) * d
    tayAx = Math.ceil(-O_TAY.trai * s) + 1; tayAy = Math.ceil(-O_TAY.tren * s) + 1
    cvTay.width = tayAx + Math.ceil(O_TAY.phai * s) + 1; cvTay.height = tayAy + Math.ceil(O_TAY.duoi * s) + 1
    gTay.setTransform(s, 0, 0, s, tayAx, tayAy)
    veTay(gTay, dangTay, mauBut, !yeu)
  }
  /** Dựng chấm laze vào canvas rời — chỉ khi màu / mật độ đổi. Tâm chấm = tâm canvas. */
  function dungHinhLaze(): void {
    const d = kv!.dpr, khoa = `${mauLaze}|${mauBut.than}|${d}|${yeu}`
    if (khoa === hinhLaze || !cvLaze || !gLaze) return
    hinhLaze = khoa
    const canh = Math.ceil((LAZE_R + 1) * 2 * d)
    cvLaze.width = canh; cvLaze.height = canh
    gLaze.setTransform(d, 0, 0, d, canh / 2, canh / 2)
    veLaze(gLaze, mauLaze, mauBut.than, yeu)
  }
  /** Lớp rỗng thì ẩn, có nét thì hiện (chỉ đụng DOM đúng lúc đổi). */
  function hienLop(): void {
    if (coGiay !== hienGiay) { hienGiay = coGiay; cvChot.style.visibility = coGiay ? '' : 'hidden' }
    if (khung && coBang !== hienBang) { hienBang = coBang; khung.style.visibility = coBang ? '' : 'hidden' }
  }
  function dichSong(x: number, y: number): void {
    sx = tron(x); sy = tron(y)
    cvSong.style.transform = `translate3d(${sx}px,${sy}px,0)`
  }
  /** Tô đa giác `p` (px ở màn 1920) lên `g`, gốc canvas nằm ở (gx, gy) px CSS của cửa sổ thầy ảo. */
  function to(g: G2, p: number[], mau: string, tay: boolean, gx: number, gy: number, kk: number = KH!.k): void {
    if (!p.length) return
    const s = kv!.dpr * kk
    g.setTransform(s, 0, 0, s, -gx * kv!.dpr, -gy * kv!.dpr)
    g.globalCompositeOperation = tay ? 'destination-out' : 'source-over'; g.fillStyle = mau
    g.beginPath(); loi.veDaGiac(g, p); g.fill()
    // bù sáng cho nét phấn (như máy thầy, `LoiBut.buSang`): thêm một lượt tô mờ ⇒ mép đều sáng, nét mảnh không lổn nhổn
    const bu = tay ? 0 : loi.buSang(mau)
    if (bu) { g.globalAlpha = bu; g.fill(); g.globalAlpha = 1 }
    g.globalCompositeOperation = 'source-over'
  }
  /** Tô xuống lớp ĐÃ CHỐT của đúng vùng (giấy / bảng). */
  function toChot(bang: boolean, p: number[], mau: string, tay: boolean): void {
    if (!p.length) return
    if (bang) { to(gB!, p, mau, tay, bOx + bx, bOy + by + goc, KHB!.k); coBang = true }
    else { to(gC!, p, mau, tay, kv!.ox, kv!.oy); coGiay = true }
    hienLop()
  }
  /** Nét bảng có nằm trong tầm canvas bảng không (nét ngoài tầm không vẽ — tới khi canvas dời tới đó). */
  function trongTam(n: NetBut): boolean {
    const h = loi.hop(n), y0 = (bOy + by + goc) / bH, le = 8 / bH
    return h[3] >= y0 - le && h[1] <= y0 + HB / bH + le
  }
  function veNetChot(n: NetCoNho): void {
    if (!gC || !KH || !KHB) return
    const bang = laBang(n), K = bang ? KHB : KH
    if (bang && !trongTam(n)) return
    const khoa = `${K.rw}x${K.rh}`
    if (n._k !== khoa) {
      const p = loi.dungNet(n, K)
      n._k = khoa
      if (coPath) { const d = new Path2D(); loi.veDaGiac(d, p); n._d = d } else n._d = p
    }
    const g = bang ? gB! : gC, s = kv!.dpr * K.k
    if (bang) coBang = true; else coGiay = true
    hienLop()
    g.setTransform(s, 0, 0, s, -(bang ? bOx + bx : kv!.ox) * kv!.dpr, -(bang ? bOy + by + goc : kv!.oy) * kv!.dpr)
    g.globalCompositeOperation = n.cong === 'tay' ? 'destination-out' : 'source-over'; g.fillStyle = n.mau
    if (coPath) g.fill(n._d as Path2D)
    else { g.beginPath(); loi.veDaGiac(g, n._d as number[]); g.fill() }
    const bu = n.cong === 'tay' ? 0 : loi.buSang(n.mau)
    if (bu) { g.globalAlpha = bu; if (coPath) g.fill(n._d as Path2D); else g.fill(); g.globalAlpha = 1 }
    g.globalCompositeOperation = 'source-over'
  }
  function xoaSong(): void {
    if (gS && ban) { gS.setTransform(1, 0, 0, 1, 0, 0); gS.clearRect(ban[0], ban[1], ban[2], ban[3]) }
    ban = null; tayVe = ''
  }
  const xoaHetSong = xoaSong
  /** Vẽ lại canvas BẢNG từ vectơ (canvas dời gốc, đổi cỡ, xoá, bảng mới). */
  function veBang(): void {
    if (!gB || !cvB || !kv || !KH) return
    gB.setTransform(1, 0, 0, 1, 0, 0); gB.clearRect(0, 0, cvB.width, cvB.height)
    coBang = false
    for (const n of ds) if (laBang(n)) veNetChot(n)
    for (const d of doDang.values()) if (d.bang && d.dong > 0) toChot(true, loi.vien(d.st, 0, d.dong + 2, null, false), d.net.mau, false)
    hienLop()
  }
  /** Vẽ lại cả lớp đã chốt từ vectơ (đổi cỡ, xoá, hoàn tác, bảng mới). Phần đã in của nét dở cũng in lại. */
  function veLai(): void {
    if (!gC || !kv || !KH) return
    gC.setTransform(1, 0, 0, 1, 0, 0); gC.clearRect(0, 0, cvChot.width, cvChot.height)
    coGiay = false
    for (const n of ds) if (!laBang(n)) veNetChot(n)
    for (const d of doDang.values()) if (!d.bang && d.dong > 0) toChot(false, loi.vien(d.st, 0, d.dong + 2, null, false), d.net.mau, false)
    veBang()
  }
  /** Đặt gốc canvas bảng sao cho tầm nhìn nằm trong canvas. `ep` = đặt lại dù còn trong tầm. Trả true nếu gốc đổi (phải vẽ lại canvas bảng). */
  function datGoc(ep: boolean): boolean {
    if (!cvB || !kv) return false
    const cy = cuonPx()
    if (!ep && cy >= goc && cy + bh <= goc + HB) return false
    // thầy thường đi xuống ⇒ chừa phía dưới nhiều hơn phía trên
    const moi = Math.max(0, tron(cy - (HB - bh) * 0.3))
    if (moi === goc && !ep) return false
    goc = moi
    cvB.style.transform = `translate3d(0,${goc}px,0)`
    return true
  }
  function apCuon(): void {
    if (!trong || !kv) return
    trong.style.transform = `translate3d(0,${-cuonPx()}px,0)`
    // đang trôi: chỉ vẽ lại khi tầm nhìn ra khỏi canvas; đã đứng yên: dời sẵn gốc khi tầm nhìn sát mép (vẽ lại lúc rảnh, không lúc đang trôi)
    const cy = cuonPx(), sat = cuon === (tuTay ? tayY : dich) && ((goc > 0 && cy - goc < bh * 0.15) || goc + HB - (cy + bh) < bh * 0.3)
    if (datGoc(sat)) veBang()
  }
  /** Xếp khung cuộn theo ô bảng + khung vẽ hiện tại. */
  function datBang(): void {
    if (!kv || !khung || !cvB || !gB) return
    const d = kv.dpr
    bx = tron(B[0] * bW - bOx); by = tron(B[1] * bH - bOy); bw = tron((B[2] - B[0]) * bW); bh = tron(dl ? dl.bh : (B[3] - B[1]) * bH)
    HB = tron(Math.min(bh * CAO_BANG, 4096 / d))
    khung.style.width = `${bw}px`; khung.style.height = `${bh}px`; khung.style.transform = `translate3d(${tron(bx - kX)}px,${tron(by - kY)}px,0)`
    cvB.width = Math.max(1, Math.round(bw * d)); cvB.height = Math.max(1, Math.round(HB * d))
    cvB.style.width = `${bw}px`; cvB.style.height = `${HB}px`
    datGoc(true)
    trong!.style.transform = `translate3d(0,${-cuonPx()}px,0)`
  }
  /** Bút của thầy đang ở y (theo bảng): ra ngoài tầm nhìn ⇒ đặt đích trôi sao cho bút về khoảng giữa bảng (xuống: 55 % · lên: 30 %). `ngay` = tới luôn. */
  function theo(y: number, ngay = false): void {
    if (!kv || !gB) return
    // đã biết độ cuộn của thầy ⇒ soi đúng theo thầy (bút của thầy luôn nằm trong tầm nhìn của thầy), không cần đoán —
    // trừ khi tầm nhìn của máy em THẤP hơn của thầy (bảng phóng to, bố cục độc lập): khi đó trôi theo bút, nhưng không ra ngoài tầm nhìn của thầy
    const caoThay = B[3] - B[1], cao = Math.min(caoThay, nhinBang()), hep = cao < caoThay - 1e-6
    if (cuonThay != null && !hep) { dich = cuonThay; if (ngay && !tuTay && cuon !== dich) { cuon = dich; apCuon() } return }
    const p = (y - B[1] - dich) / cao
    if (p > 0.9) dich = Math.max(0, y - B[1] - cao * 0.55)
    else if (p < 0.04) dich = Math.max(0, y - B[1] - cao * 0.3)
    if (cuonThay != null) dich = Math.max(cuonThay, Math.min(cuonThay + caoThay - cao, dich))
    if (ngay && !tuTay && cuon !== dich) { cuon = dich; apCuon() }
  }
  /** Một bước trôi (gọi mỗi khung). */
  function buocCuon(nay: number): void {
    const dt = Math.min(64, Math.max(0, nay - lucCuon))
    lucCuon = nay
    const den = tuTay ? tayY : dich
    if (cuon === den || !kv) return
    cuon += (den - cuon) * (1 - Math.exp(-dt / TROI_MS))
    if (Math.abs(den - cuon) * bH < 0.5) cuon = den
    apCuon()
  }
  /** Đổi cỡ / tỉ lệ: đặt lại hai canvas, dựng lại trạng thái nét dở theo khung mới, vẽ lại. */
  function datKhung(k0: KhungVe): void {
    // MẬT ĐỘ ĐIỂM ẢNH THẬT (11/11, thầy: «nét bút sắc nét và mịn tuyệt đối»): nơi gọi kẹp mật độ ở 2,5 (máy yếu 1,5) ⇒ điện thoại mật độ 3 bị trình duyệt
    // kéo giãn canvas 1,2 lần (máy yếu: 2 lần) — nét mờ. Ở đây nâng lên mật độ thật của màn, trần 3 (máy yếu: trần 2).
    const that = typeof devicePixelRatio === 'number' && devicePixelRatio > 0 ? devicePixelRatio : k0.dpr
    let k = that > k0.dpr ? { ...k0, dpr: Math.min(that, k0.dpr <= 1.5 ? 2 : 3) } : k0
    // KẸP THEO DIỆN TÍCH (12/11): WebKit trên iPhone / iPad có trần bộ nhớ canvas (mỗi canvas ≈ 16,7 triệu điểm ảnh, cả trang cũng có trần) — vượt thì vẽ
    // chậm hoặc trắng. Lớp chốt (to bằng cả hình) không quá 8 triệu điểm ảnh; hơn thì hạ mật độ cho vừa. iPhone nằm ngang 932 × 430 ở mật độ 3 =
    // 3,6 triệu, iPad 1366 × 1024 ở mật độ 2 = 5,6 triệu: chưa chạm trần này.
    if (k.w * k.h * k.dpr * k.dpr > TRAN_DIEM_ANH) k = { ...k, dpr: Math.max(1, Math.floor(Math.sqrt(TRAN_DIEM_ANH / (k.w * k.h)) * 4) / 4) }
    kv = k
    KH = loi.khung(k.Wv, k.Hv)
    dl = k.dl ?? null
    KHB = dl ? loi.khung(dl.bWv, dl.bHv) : KH
    bW = dl ? dl.bWv : k.Wv; bH = dl ? dl.bHv : k.Hv; bOx = dl ? dl.box : k.ox; bOy = dl ? dl.boy : k.oy
    gX = dl ? dl.gx : 0; gY = dl ? dl.gy : 0; hW = dl ? dl.hw : k.w; hH = dl ? dl.hh : k.h; kX = dl ? dl.kx : 0; kY = dl ? dl.ky : 0
    if (!dl) cuonG = 0
    cvChot.width = Math.max(1, Math.round(k.w * k.dpr)); cvChot.height = Math.max(1, Math.round(k.h * k.dpr))
    // cỡ HIỆN = đúng cỡ nền / mật độ (không để 100 %): cỡ điểm ảnh lẻ thì 100 % lệch cỡ nền chưa tới một điểm ảnh, đủ để cả lớp bị co giãn, mờ từng quãng
    cvChot.style.width = `${cvChot.width / k.dpr}px`; cvChot.style.height = `${cvChot.height / k.dpr}px`
    // lớp sống: vuông, cạnh theo cỡ nét trên máy này (đuôi nét dở thường ≤ ~540 px ở màn 1920), không lớn hơn hình
    // (bố cục độc lập: khung nở / thu đổi phép co liên tục ⇒ cạnh lớp sống lấy theo mức lớn nhất, không theo phép co đang áp — khỏi cấp lại canvas mỗi lần nở)
    canh = Math.round(Math.max(200, Math.min(520, dl ? 520 : 700 * KH.k, hW, hH)))
    const canhDa = Math.max(1, Math.round(canh * k.dpr))
    if (!dl || cvSong.width !== canhDa) {
      cvSong.width = cvSong.height = canhDa
      cvSong.style.width = cvSong.style.height = `${cvSong.width / k.dpr}px`
      dichSong(0, 0)
    } else xoaSong()
    ban = null
    // màu cây bút: biến màu sẵn có của bảng live (gắn tại gốc `.lv`), đọc một lần mỗi lần xếp lại (bố cục độc lập: MỘT lần — đọc kiểu buộc trình duyệt tính lại
    // kiểu cả cây ngay giữa lúc khung đang đổi chỗ)
    if (!dl || !daDocMau) try {
      const cs = getComputedStyle(cvSong), lay = (ten: string, thay: string): string => cs.getPropertyValue(ten).trim() || thay
      mauBut.than = lay('--tr-chieu-giay', 'white'); mauBut.bong = lay('--tr-chieu-bang', 'black'); mauBut.dai = lay('--p-cam', 'orange'); mauLaze = lay('--p-do', 'red')
      daDocMau = true
    } catch { /* không có kiểu (test) ⇒ màu dự phòng */ }
    datBang()
    // cỡ bàn tay theo bề cao bảng đen (≈ 5,5 %)
    coT = Math.round(coTay(bh > 0 ? bh : k.h * 0.9) * 2) / 2
    for (const d of doDang.values()) { d.st = loi.moXuLy(d.net, d.bang ? KHB : KH); loi.xuLyThem(d.st, d.net.diem, d.net.diem.length); d.dong = 0 }
    veLai()
  }
  /** Đặt cả bảng (vào live, nối lại, bảng mới). Nét dở bỏ hết. Bảng cuộn: tới thẳng chỗ nét bảng mới nhất. */
  function datNet(net: readonly NetBut[]): void {
    ds = net.map((n) => n as NetCoNho)
    doDang.clear(); xoaHetSong()
    cuon = dich = 0; cuonThay = null; tuTay = false
    if (kv && gB) {
      for (let i = ds.length - 1; i >= 0; i--) if (laBang(ds[i]!)) { const p = ds[i]!.diem[ds[i]!.diem.length - 1]; if (p) theo(p[1]); break }
      cuon = dich
      trong!.style.transform = `translate3d(0,${-cuonPx()}px,0)`
      datGoc(true)
    }
    veLai()
  }
  /** Một nét đã chốt tới từ sổ nét (chèn ở `vt`; bỏ trống = cuối). */
  function themNet(net: NetBut, vt?: number | null): void {
    const n = net as NetCoNho, cu = ds.findIndex((x) => x.id === n.id)
    if (doDang.delete(n.id)) xoaHetSong()
    if (cu >= 0) { ds[cu] = n; veLai(); return }
    const cuoi = vt == null || vt >= ds.length
    if (cuoi) ds.push(n); else ds.splice(Math.max(0, vt), 0, n)
    if (!KH) return
    // nét bảng tới nguyên cả nét (em vào muộn, xem lại): trôi tới chỗ nó
    if (cuoi && laBang(n) && n.diem.length) theo(n.diem[n.diem.length - 1]![1])
    if (cuoi) veNetChot(n); else veLai()
  }
  /** Nét dở đã phát đủ điểm ⇒ chốt tại chỗ: in nốt đoạn đuôi xuống lớp đã chốt, không vẽ lại cả lớp. Đuôi vốn đã vẽ đúng dáng nét xong ⇒ hình không đổi. */
  function chotNet(id: string): void {
    const d = doDang.get(id)
    if (!d) return
    doDang.delete(id); xoaHetSong()
    ds.push(d.net as NetCoNho)
    if (!KH || !gC) return
    loi.xuLyThem(d.st, d.net.diem, d.net.diem.length)
    if (d.dong > 0) toChot(d.bang, loi.vien(d.st, d.dong, -1, null, true), d.net.mau, d.net.cong === 'tay')
    else veNetChot(d.net as NetCoNho)
  }
  function xoaNet(ids: readonly string[]): void {
    let chot = false, doi = false
    for (const id of ids) {
      const d = doDang.get(id)
      if (d) { doDang.delete(id); doi = true; if (d.dong > 0) chot = true }
      const k = ds.findIndex((x) => x.id === id)
      if (k >= 0) { ds.splice(k, 1); chot = true }
    }
    if (doi) xoaHetSong()
    if (chot) veLai()
  }
  /** Áp MỘT sự kiện của bộ máy bút (thư viện live phát theo đúng thứ tự). `trang` ⇒ nơi gọi đặt lại bố cục trước rồi mới gọi hàm này. */
  function ap(sk: SuKienBut): void {
    if (sk.loai === 'trang') {
      const b = giaiTrang(sk.trang).vung.bang
      if (b.join() !== B.join()) { B = b; datBang() }
      datNet(sk.net)
    }
    else if (sk.loai === 'net-moi') {
      if (sk.xong) { themNet({ ...sk.net, diem: sk.net.diem.slice() }, sk.vt); return }
      if (!KH) return
      const net: NetBut = { id: sk.net.id, cong: sk.net.cong, mau: sk.net.mau, co: sk.net.co, diem: sk.net.diem.slice() }
      const bang = laBang(net)
      doDang.set(net.id, { net, st: loi.moXuLy(net, bang && KHB ? KHB : KH), dong: 0, dau: null, bang })
    }
    else if (sk.loai === 'them-diem') { const d = doDang.get(sk.id); if (d) for (const p of sk.diem) d.net.diem.push(p) }
    else if (sk.loai === 'net-xong') chotNet(sk.id)
    else if (sk.loai === 'xoa') xoaNet(sk.id)
  }
  /** Đầu nét nội suy của khung này (toạ độ 0..1) — vẽ làm đuôi của nét dở. Nét không có trong `dau` ⇒ bỏ đuôi. */
  function datDau(dau: readonly { id: string; x: number; y: number }[]): void {
    for (const d of doDang.values()) d.dau = null
    for (const h of dau) { const d = doDang.get(h.id); if (d) d.dau = [h.x, h.y] }
  }
  /** Đuôi nét dở dài quá khổ lớp sống ⇒ in sớm phần đã ổn định (chừa đoạn cuối dài hơn đoạn thon cuối nét, như `mocDong`) xuống lớp chốt. */
  function inSom(d: NetDo): boolean {
    const st = d.st, m = st.X.length, giu = st.ban * 2 * 6 * 3
    let den = m - 4
    while (den > d.dong + 4 && st.L[m - 1]! - st.L[den]! < giu) den -= 2
    if (den <= d.dong + 4 || !gC) return false
    toChot(d.bang, loi.vien(st, d.dong, den, null, false), d.net.mau, d.net.cong === 'tay')
    d.dong = den - 2
    return true
  }
  function hop(p: number[], h: Hop): void {
    for (let i = 0; i < p.length; i += 2) { const x = p[i]!, y = p[i + 1]!; if (x < h[0]) h[0] = x; if (x > h[2]) h[2] = x; if (y < h[1]) h[1] = y; if (y > h[3]) h[3] = y }
  }
  /** MỘT khung vẽ của lớp «đang viết»: đuôi các nét dở + cây bút của thầy (+ một bước trôi của bảng cuộn). `nay` = đồng hồ khung hình (ms). Trả số nét dở đã vẽ. */
  function veSong(nay: number = typeof performance !== 'undefined' ? performance.now() : Date.now()): number {
    if (!gC || !gS || !KH || !KHB || !kv) return 0
    // bút ở trên bảng cuộn ⇒ máy em trôi theo trước, rồi mới tính chỗ vẽ
    const caoThay = B[3] - B[1], nhin = nhinBang()
    if (cuonThay != null && nhin >= caoThay - 1e-6) dich = cuonThay
    else {
      if (butDich) theoBut(butDich.x, butDich.y, butDich.net)
      // thầy cuộn bảng mà không viết: tầm nhìn (thấp hơn) của máy em vẫn phải nằm trong tầm nhìn của thầy
      if (cuonThay != null) dich = Math.max(cuonThay, Math.min(cuonThay + caoThay - nhin, dich))
    }
    buocCuon(nay)
    const cy = cuonPx(), dd = kv.dpr, leTay = 14 + (O_TAY.phai - O_TAY.trai) * tiLeTay(coT)
    /** Góc cửa sổ thầy ảo của vùng (giấy / bảng) tính trong HÌNH, đã cộng độ cuộn của vùng. */
    const gocX = (bang: boolean): number => (bang ? bOx : kv!.ox - gX), gocY = (bang: boolean): number => (bang ? bOy + cy : kv!.oy - gY + cuonG)
    // h = hộp bao mọi thứ sẽ vẽ, px CSS trong hình (nét bảng đã trừ độ cuộn)
    const h: Hop = [1e9, 1e9, -1e9, -1e9], ve: [number[], string, boolean][] = []
    // đuôi luôn vẽ đúng dáng nét XONG (thon cuối): đầu nét là chỗ thon, đi tiếp thì chỗ cũ dày lên — chốt nét không đổi hình
    const duoi = (d: NetDo): number[] => { const K = d.bang ? KHB! : KH!; return loi.vien(d.st, d.dong, -1, d.dau ? [[d.dau[0] * K.rw, d.dau[1] * K.rh]] : null, true) }
    for (const d of doDang.values()) {
      loi.xuLyThem(d.st, d.net.diem, d.net.diem.length)
      const den = loi.mocDong(d.st, d.dong, IT_NET)
      if (den > 0) { toChot(d.bang, loi.vien(d.st, d.dong, den, null, false), d.net.mau, d.net.cong === 'tay'); d.dong = den - 2 }
      // nét bảng đang chạy: máy em trôi theo đầu nét (có hiệu lực từ khung sau)
      if (d.bang) { const c = d.dau ?? d.net.diem[d.net.diem.length - 1]; if (c) theo(c[1]!) }
      let p = duoi(d)
      if (!p.length) continue
      const k = d.bang ? KHB.k : KH.k
      const h1: Hop = [1e9, 1e9, -1e9, -1e9]
      hop(p, h1)
      if (((h1[2] - h1[0]) * k > canh - leTay || (h1[3] - h1[1]) * k > canh - leTay) && inSom(d)) { p = duoi(d); h1[0] = h1[1] = 1e9; h1[2] = h1[3] = -1e9; hop(p, h1) }
      ve.push([p, d.net.mau, d.bang])
      const ox = gocX(d.bang), oy = gocY(d.bang)
      const x0 = h1[0] * k - ox, y0 = h1[1] * k - oy, x1 = h1[2] * k - ox, y1 = h1[3] * k - oy
      if (x0 < h[0]) h[0] = x0; if (y0 < h[1]) h[1] = y0; if (x1 > h[2]) h[2] = x1; if (y1 > h[3]) h[3] = y1
    }
    // bàn tay cầm bút: chỗ ngòi theo đệm phát (đã trừ độ cuộn của máy em) ⇒ một bước chuyển động ⇒ chỗ dán hình
    let hb = null, px = 0, py = 0, khoa = ''
    if (gTay) {
      if (butDich) { const q = toiPx(butDich.x, butDich.y, butDich.net); if (butDich.mau) mauBut.muc = butDich.mau; hb = but.buoc({ x: q[0], y: q[1], cham: butDich.cham, sat: butDich.sat }, nay) }
      else but.buoc(null, nay)
    }
    if (butDich?.cham) lucChamBut = nay
    laze = !!hb && !!butDich && !butDich.cham && nay - lucChamBut > LAZE_TRE_MS
    if (hb && laze) {
      dungHinhLaze()
      px = Math.round(hb.x * dd); py = Math.round(hb.y * dd)
      if (butDich?.sat && !yeu) { px = Math.round(hb.x * dd * 8) / 8; py = Math.round(hb.y * dd * 8) / 8 }
      khoa = `L|${px}|${py}|${hb.mo}|${hinhLaze}`
      if (!ve.length && khoa === tayVe) return 0
      const r = LAZE_R + 4
      if (hb.x - r < h[0]) h[0] = hb.x - r; if (hb.y - r < h[1]) h[1] = hb.y - r; if (hb.x + r > h[2]) h[2] = hb.x + r; if (hb.y + r > h[3]) h[3] = hb.y + r
    } else if (hb) {
      dungHinhTay()
      // ngòi làm tròn theo điểm ảnh thiết bị (hình dán không bị nhoè); lơ lửng thì nhấc chếch phải-trên một chút
      px = (hb.x + 0.07 * coT * hb.nang) * dd; py = (hb.y - 0.15 * coT * hb.nang) * dd
      // (13/11) trình phát xem lại tự lướt bút giữa hai nét (`sat`): giữ phần lẻ điểm ảnh — quãng lướt giữa hai nét của một chữ chỉ vài px, làm tròn thì
      // trên màn mật độ 1 cây bút đi nhát gừng (đứng một khung, nhích một khung)
      if (butDich?.sat && !yeu) { px = Math.round(px * 8) / 8; py = Math.round(py * 8) / 8 } else { px = Math.round(px); py = Math.round(py) }
      khoa = `${px}|${py}|${hb.goc.toFixed(3)}|${hb.mo}|${hinhTay}`
      // lớp sống chỉ có bàn tay và nó y như khung trước ⇒ không vẽ gì (trình duyệt khỏi nộp lại lớp)
      if (!ve.length && khoa === tayVe) return 0
      const x0 = (px - tayAx) / dd - 3, y0 = (py - tayAy) / dd - 3, x1 = x0 + cvTay!.width / dd + 6, y1 = y0 + cvTay!.height / dd + 6
      if (x0 < h[0]) h[0] = x0; if (y0 < h[1]) h[1] = y0; if (x1 > h[2]) h[2] = x1; if (y1 > h[3]) h[3] = y1
    }
    xoaSong()
    if (!ve.length && !hb) return 0
    // hộp bao không còn nằm trọn trong lớp sống ⇒ dời lớp cho hộp vào giữa (kẹp trong hình)
    if (h[0] < sx + 4 || h[1] < sy + 4 || h[2] > sx + canh - 4 || h[3] > sy + canh - 4) {
      dichSong(Math.max(0, Math.min(hW - canh, (h[0] + h[2] - canh) / 2)), Math.max(0, Math.min(hH - canh, (h[1] + h[3] - canh) / 2)))
    }
    for (const [p, mau, bang] of ve) {
      // bố cục độc lập: đuôi nét của vùng nào cắt theo ô nhìn của vùng ấy (nét giấy không tràn sang bảng và ngược lại)
      if (dl) {
        gS.save(); gS.setTransform(1, 0, 0, 1, 0, 0); gS.beginPath()
        if (bang) gS.rect((bx - sx) * dd, (by - sy) * dd, bw * dd, bh * dd); else gS.rect((dl.gx - sx) * dd, (dl.gy - sy) * dd, dl.gw * dd, dl.gh * dd)
        gS.clip()
      }
      to(gS, p, mau, false, gocX(bang) + sx, gocY(bang) + sy, bang ? KHB.k : KH.k)
      if (dl) gS.restore()
    }
    if (hb && laze) {
      // chấm laze: không ngả, tâm đúng chỗ ngòi
      gS.setTransform(1, 0, 0, 1, px - Math.round(sx * dd), py - Math.round(sy * dd))
      gS.globalAlpha = Math.min(1, hb.mo * 8) // chấm chỉ bài LUÔN sáng hết cỡ, kể cả khi thầy giữ yên để giảng (cây bút lơ lửng thì mờ dần); chỉ mờ ở nhịp bút ẩn hẳn
      gS.drawImage(cvLaze!, -cvLaze!.width / 2, -cvLaze!.height / 2)
      gS.globalAlpha = 1
    } else if (hb) {
      // dán hình bàn tay: gốc = ngòi bút, ngả quanh đúng ngòi, độ rõ đều cả hình
      const c = Math.cos(hb.goc), s2 = Math.sin(hb.goc)
      gS.setTransform(c, s2, -s2, c, px - Math.round(sx * dd), py - Math.round(sy * dd))
      gS.globalAlpha = hb.mo
      gS.drawImage(cvTay!, -tayAx, -tayAy)
      gS.globalAlpha = 1
    }
    ban = [Math.floor((h[0] - sx) * dd) - 3, Math.floor((h[1] - sy) * dd) - 3, Math.ceil((h[2] - h[0]) * dd) + 6, Math.ceil((h[3] - h[1]) * dd) + 6]
    tayVe = ve.length ? '' : khoa
    return ve.length
  }
  /** Điểm (x, y) có tính theo BẢNG CUỘN không: biết mã nét thì theo mã, không thì theo hoành độ (nằm trong cột bảng đen). */
  const theoBang = (x: number, net?: string): boolean => { const d = net ? doDang.get(net) : undefined; return !!gB && (d ? d.bang : net && !dl ? laBang({ id: net }) : (!!net && loi.laBang({ id: net })) || (x >= B[0] && x <= B[2])) }
  /** Toạ độ 0..1 (cửa sổ thầy) ⇒ px CSS trong vùng chiếu của máy em. Điểm trên bảng cuộn đã trừ độ cuộn của máy em. `net` = mã nét đang viết (nếu có). */
  function toiPx(x: number, y: number, net?: string): [number, number] {
    if (!kv) return [0, 0]
    return theoBang(x, net) ? [x * bW - bOx, y * bH - bOy - cuonPx()] : [x * kv.Wv - kv.ox + gX, y * kv.Hv - kv.oy + gY - cuonG]
  }
  /** Cây bút của thầy đang ở (x, y): nếu ở trên bảng cuộn thì máy em trôi theo (cả khi bút chỉ lơ lửng). */
  function theoBut(x: number, y: number, net?: string): void { if (theoBang(x, net)) theo(y) }
  /** Chỗ cây bút của thầy ở khung này (`KhungLiveEm.but` của thư viện live; toạ độ 0..1) — gọi TRƯỚC `veSong`. null = ẩn bút.
   *  `cuonCuaThay` = `KhungLiveEm.cuon`: độ cuộn bảng đen của thầy (null = chưa biết ⇒ tự trôi theo bút; bỏ trống = giữ như cũ). */
  function datBut(b: { x: number; y: number; cham: boolean; net?: string; mau?: string; sat?: boolean } | null, cuonCuaThay?: number | null): void { butDich = b; if (cuonCuaThay !== undefined) cuonThay = cuonCuaThay }
  /** Độ cuộn của khung GIẤY (px CSS; bố cục độc lập) — đuôi nét và cây bút trên giấy dời theo. */
  function datCuonGiay(px: number): void { if (dl && px !== cuonG) { cuonG = px; tayVe = '' } }
  /** Em tự vuốt bảng đen xem lại: dời tầm nhìn `dy` px (dương = xem phần dưới). `null` = thôi, về chỗ thầy đang viết. Đang tự vuốt ⇒ bảng không tự trôi theo bút. */
  function vuotBang(dy: number | null): void {
    if (!kv || !gB) return
    if (dy == null) { tuTay = false; return }
    if (!tuTay) {
      tuTay = true; tayY = cuon
      // trần vuốt xuống: tới hết nét bảng thấp nhất (chừa 60 % tầm nhìn), không thấp hơn chỗ thầy đang đứng
      let day = 0
      for (const n of ds) if (laBang(n)) { const y = loi.hop(n)[3]!; if (y > day) day = y }
      for (const d of doDang.values()) if (d.bang) for (const p of d.net.diem) if (p[1] > day) day = p[1]
      tayTran = Math.max(0, dich, cuon, day - B[1] - nhinBang() * 0.6)
    }
    tayY = Math.max(0, Math.min(Math.max(tayTran, dich), tayY + dy / bH))
    if (cuon !== tayY) { cuon = tayY; apCuon() }
  }
  return {
    datKhung, ap, datDau, veSong, veLai, toiPx, theoBut, datBut, datCuonGiay, vuotBang,
    /** Ngòi cây bút đang hiện ở đâu (px CSS trong hình); null = đang ẩn. */
    viTriBut: (): [number, number] | null => but.viTri(),
    /** Đổi dáng bàn tay (`nam` mặc định · `gon` · `vien`) — để chụp so các phương án. */
    datDangTay: (d: DangTay): void => { dangTay = d },
    soNet: (): number => ds.length, soDo: (): number => doDang.size,
    /** Bảng cuộn: độ cuộn hiện tại / đích (số lần bề dọc cửa sổ thầy) + ô bảng trong hình (px CSS). */
    cuon: () => ({ y: cuon, dich, tay: tuTay, bang: { x: bx, y: by, w: bw, h: bh } }),
  }
}
export type VeBang = ReturnType<typeof taoVeBang>

// LIVE BẢNG — MÁY THẦY, PHẦN NỐI Ở CỬA SỔ APP (đợt 1B; đặc tả docs/dac-ta-live-bang-1011.md mục 2.1, 3, 4.5, 5). Nạp lười từ src/lib/bpu/nghe-to-chieu.ts
// khi tờ chiếu chào (`loai: 'live'`) ⇒ không nằm trong đường mở /gv. Thư viện nặng (WebRTC, mã hoá nét — src/lib/live, đợt 1A) chỉ nạp khi phòng báo
// công tắc live bật (`viewBang.live` khác null).
// VÌ SAO MIC + WebRTC Ở APP, KHÔNG Ở TỜ: tờ là khung HTML dựng lại mỗi lần thầy chọn câu (nối ở tờ ⇒ rớt live mỗi lần đổi câu), khung `srcdoc` / tờ mở
// cửa sổ riêng không chắc có quyền mic, và WebSocket của phòng vốn ở app (BangBinhPhanUng, qua cau-live.ts).
// Ba mối nối:  tờ ⇄ tệp này: postMessage (giao thức ở đầu src/lib/live-to-chieu.ts)  ·  tệp này ⇄ phòng: cau-live.ts  ·  tệp này ⇄ SFU: taoLiveThay.
import { taoLoiBut, type NetBut, type SuKienBut } from '../../lib/but-bang-loi'
import { DOI_BPU, kyHieu, type ViewBang } from '../../lib/bpu/phong'
import type { KetQuaBat, LiveThay, TrangThaiLiveThay } from '../../lib/live'
import { layBangCuoi, layPhong, nghePhong, ngheTin } from '../bpu/cau-live'
import { maTrang } from './bo-cuc'

/** Trạng thái gửi sang tờ để vẽ (tờ không tự suy gì). */
export interface TtLiveTo {
  /** Có phòng + công tắc live bật ⇒ tờ hiện nút «Live». */
  co: boolean
  pha: 'tat' | 'dang-bat' | 'live'
  tu: number | null
  xem: number
  tong: number
  lop: string
  /** Worker đã có khoá tiếng (SFU). Chưa ⇒ live chỉ có hình. */
  coTieng: boolean
  khongTieng: boolean
  micIm: boolean
  noiLai: boolean
  mayKhac: boolean
  /** Bảng có đang xuống máy em không (cờ phòng `live.bang`: tự bật khi gọi em lên bảng, tự tắt khi mở lượt mới; thầy bật / tắt tay bằng công tắc). */
  bang: boolean
  /** Em lên bảng đang mở mic (`live.noi`) — thẻ «Đang nói» + «Thu mic». */
  noi: { sbd: string; ten: string; ky: string; doi: string; mau: string }[]
  /** Máy thầy có đang phát tiếng em ra loa lớp không (mặc định chỉ khi em ở xa — chống hú). */
  ngheEm: boolean
  /** Lượt đang mở mà còn em chưa gửi — viên live nhắc (đặc tả mục 5). */
  chuaGui: number
  the: { ds: { id: string; ten: string }[]; chon: string; loi: string; tiengLop: boolean } | null
  roi: { sbd: string; ten: string; ky: string; doi: string; mau: string; luc: number }[]
}

const KHOA_MIC = 'ddh.live.mic', KHOA_DA_BAT = 'ddh.live.da-bat'
const nho = (k: string): string => { try { return localStorage.getItem(k) || '' } catch { return '' } }
const ghi = (k: string, v: string): void => { try { localStorage.setItem(k, v) } catch { /* đầy / chặn */ } }

let to: Window | null = null
let lt: LiveThay | null = null
let dangNap: Promise<void> | null = null
let ttLt: TrangThaiLiveThay | null = null
let view: ViewBang | null = null
let the: TtLiveTo['the'] = null
let dangBat = false
let henHuy: ReturnType<typeof setTimeout> | undefined
let henMuc: ReturnType<typeof setInterval> | undefined
/** Gương của bảng thầy (ảnh trạng thái cho thư viện: bật live sau khi đã viết, phòng xin lại sổ). */
const loi = taoLoiBut()
const guong: { khoa: string; tiLe: number; net: NetBut[] } = { khoa: '', tiLe: 16 / 9, net: [] }
/** Khoá trang của bộ máy bút ⇒ khoá đã ghép ô giấy / ô bảng (bo-cuc.ts `maTrang`). */
const maCua = new Map<string, string>()
/** Em đang rời màn: số báo danh ⇒ giờ máy thầy thấy lần đầu. */
const lucRoi = new Map<string, number>()
let daNghe = false

const ma = (khoa: string): string => maCua.get(khoa) ?? maTrang(khoa, null, false)
const anh = () => ({ trang: ma(guong.khoa), tiLe: guong.tiLe, net: guong.net })
const mauDoi = (d: number): string => { try { return getComputedStyle(document.documentElement).getPropertyValue(DOI_BPU[d]?.mau ?? '').trim() } catch { return '' } }

function trangThai(): TtLiveTo {
  const l = view?.live ?? null, p = layPhong()
  const ds = view?.ds ?? [], roiNay = l?.bat ? (view?.roiNay ?? []) : []
  for (const s of [...lucRoi.keys()]) if (!roiNay.includes(s)) lucRoi.delete(s)
  const roi = roiNay.map((sbd) => {
    if (!lucRoi.has(sbd)) lucRoi.set(sbd, Date.now())
    const e = ds.find((x) => x.sbd === sbd)
    return { sbd, ten: e?.ten ?? sbd, ky: kyHieu(e?.ten ?? sbd), doi: e ? (DOI_BPU[e.doi]?.ten ?? '') : '', mau: e ? mauDoi(e.doi) : '', luc: lucRoi.get(sbd)! }
  })
  const lu = view?.luot ?? null
  const live = !!l?.bat
  const noi = (live ? (l?.noi ?? []) : []).map((n) => ({ sbd: n.sbd, ten: n.ten, ky: kyHieu(n.ten), doi: n.xa ? 'Em ở xa' : (DOI_BPU[n.doi]?.ten ?? ''), mau: n.xa ? '' : mauDoi(n.doi) }))
  return {
    co: !!l && (!!p || live), pha: live ? 'live' : dangBat ? 'dang-bat' : 'tat', tu: l?.tu ?? null,
    xem: ttLt?.xem ?? l?.xem ?? 0, tong: ds.filter((e) => e.vao).length, lop: view?.lop ?? '',
    coTieng: l?.tieng !== 'chua-cau-hinh', khongTieng: ttLt?.tieng === 'khong' || ttLt?.tieng === 'loi', micIm: !!ttLt?.micIm,
    noiLai: live && !p, mayKhac: !!ttLt?.mayKhacLive,
    bang: live && !!l?.bang, noi, ngheEm: !!ttLt?.ngheEm,
    chuaGui: live && lu && lu.pha === 'tra-loi' ? Math.max(0, ds.filter((e) => e.vao).length - lu.daGui.length) : 0,
    the, roi,
  }
}
function guiTo(tin: Record<string, unknown>): void { try { to?.postMessage({ nguon: 'bpu-bang', ...tin }, '*') } catch { /* tờ đã đóng */ } }
let ttCu = ''
function bao(): void {
  const tt = trangThai()
  // Nút Live trên bảng Bình Phản Ứng + thẻ gọn thay viền đỏ toàn màn khi đang giảng trên tờ.
  void import('../bpu/gan-gv').then((m) => m.datLive({ co: tt.co, bat: tt.pha === 'live' })).catch(() => {})
  const k = JSON.stringify(tt)
  if (k !== ttCu) { ttCu = k; guiTo({ lenh: 'live-tt', tt }) }
  // vạch mức mic: chỉ chạy khi thẻ mic đang mở hoặc đang live có tiếng
  const canMuc = !!lt && (!!the || (tt.pha === 'live' && tt.coTieng && !tt.khongTieng))
  if (canMuc && !henMuc) henMuc = setInterval(() => { guiTo({ lenh: 'live-muc', v: lt?.mucAm() ?? 0 }) }, 90)
  else if (!canMuc && henMuc) { clearInterval(henMuc); henMuc = undefined }
}

/** Có phòng + công tắc bật ⇒ nạp thư viện, nối sẵn (track câm) để bấm Live là live ngay. */
function dam(): Promise<void> {
  const p = layPhong()
  if (lt || !p || !view?.live) return Promise.resolve()
  if (dangNap) return dangNap
  dangNap = import('../../lib/live').then(({ taoLiveThay }) => {
    const p2 = layPhong()
    if (lt || !p2) return
    lt = taoLiveThay({
      ve: p2.ve, goc: p2.goc,
      kenh: { gui: (t) => { layPhong()?.gui(t) }, guiNhiPhan: (k) => { layPhong()?.guiNhiPhan(k) } },
      layAnh: anh,
      khiTrangThai: (t) => { ttLt = t; if (t.pha === 'live' || t.pha === 'san') dangBat = false; bao() },
    })
    if (view) lt.nhanTinPhong(view)
    void lt.noiSan()
    if (guong.khoa || guong.net.length) lt.guiAnh(anh())
  }).catch(() => {}).finally(() => { dangNap = null })
  return dangNap
}
function huy(): void {
  lt?.huy(); lt = null; ttLt = null; the = null; dangBat = false
  bao()
}
function nghe(): void {
  if (daNghe) return
  daNghe = true
  ngheTin((tin) => {
    if (tin && typeof tin === 'object' && !(tin instanceof ArrayBuffer)) {
      const m = tin as { t?: string }
      if (m.t === 'bang') { view = tin as ViewBang; void dam() }
      lt?.nhanTinPhong(tin)
      if (m.t === 'bang' || m.t === 'live-xem' || m.t === 'live-kq') bao()
    }
  })
  nghePhong(() => {
    clearTimeout(henHuy)
    if (layPhong()) { lt?.khiNoiLai(); void dam() }
    // phòng rớt: chờ nối lại 25 giây (mạng chập chờn, thầy chọn câu khác); quá ⇒ bảng đã đóng hẳn ⇒ tắt live, thả mic
    else henHuy = setTimeout(() => { if (!layPhong()) { view = null; huy() } }, 25_000)
    bao()
  })
  view = (layBangCuoi() as ViewBang | null) ?? view
  void dam()
}

async function moThe(): Promise<void> {
  await dam()
  const l = view?.live
  if (!lt || !l) return
  the = { ds: [], chon: nho(KHOA_MIC), loi: '', tiengLop: !!l.tiengLop }
  bao()
  if (l.tieng === 'chua-cau-hinh') return
  let kq = await lt.moMic(the.chon || null)
  // mic đã nhớ không còn cắm ⇒ thử mic mặc định, quên mic cũ
  if (!kq.ok && kq.lyDo === 'khong-mic' && the?.chon) { ghi(KHOA_MIC, ''); the = { ...the, chon: '' }; kq = await lt.moMic(null) }
  if (!the) { lt.thaMic(); return }
  if (!kq.ok) the = { ...the, loi: kq.lyDo }
  else the = { ...the, loi: '', ds: await lt.dsMic().catch(() => []) }
  bao()
}
async function bat(khongTieng: boolean): Promise<void> {
  await dam()
  if (!lt) return
  dangBat = true; bao()
  // thẻ đang mở ⇒ mic đã mở sẵn (vạch mức âm đang chạy) — không xin lại; bấm Live thẳng ⇒ mic đã nhớ
  const kq: KetQuaBat = await lt.bat({ mic: the && !the.loi ? null : nho(KHOA_MIC) || null, khongTieng })
  dangBat = false
  if (kq.ok) { the = null; ghi(KHOA_DA_BAT, '1') }
  else if (kq.lyDo === 'mic-tu-choi' || kq.lyDo === 'khong-mic' || kq.lyDo === 'mic-loi') the = { ds: the?.ds ?? [], chon: the?.chon ?? '', loi: kq.lyDo, tiengLop: !!view?.live?.tiengLop }
  bao()
}
/** Bấm «Live» (trên tờ hoặc trên bảng). Đang live ⇒ mở lại thẻ mic. Lần đầu ⇒ thẻ chọn mic; các lần sau live ngay với mic đã nhớ. */
function bam(): void {
  const l = view?.live
  if (!l || !layPhong()) return
  if (l.bat) { if (the) { the = null; bao() } else void moThe(); return }
  if (the) { the = null; bao(); return }
  if (nho(KHOA_DA_BAT) && l.tieng !== 'chua-cau-hinh') void bat(false)
  else void moThe()
}

type TinTo = { viec?: unknown; id?: unknown; v?: unknown; sk?: unknown; trang?: unknown; tiLe?: unknown; net?: unknown; vung?: unknown; giayToi?: unknown }
const vungCua = (v: unknown) => (v && typeof v === 'object' ? (v as { giay?: number[]; bang?: number[] }) : null)

/** Tin `{ nguon: 'to-chieu', loai: 'live', viec, … }` từ tờ chiếu (nghe-to-chieu.ts chuyển vào). */
export function nhanTinTo(d: unknown, nguon: Window | null): void {
  const m = (d ?? {}) as TinTo
  nghe()
  if (nguon && nguon !== to) { to = nguon; ttCu = '' }
  switch (m.viec) {
    case 'chao': bao(); break
    case 'bam': bam(); break
    case 'the-dong': if (the) { the = null; lt?.thaMic(); bao() } break
    case 'chon-mic': if (the && typeof m.id === 'string') { the = { ...the, chon: m.id }; ghi(KHOA_MIC, m.id); bao(); void lt?.moMic(m.id).then((kq) => { if (the && !kq.ok) { the = { ...the, loi: kq.lyDo }; bao() } }) } break
    case 'bat-dau': if (the?.chon) ghi(KHOA_MIC, the.chon); void bat(false); break
    case 'khong-tieng': void bat(true); break
    case 'thu-lai': void moThe(); break
    case 'tieng-lop': if (the) { the = { ...the, tiengLop: m.v === true }; lt?.dat({ tiengLop: m.v === true }); bao() } break
    case 'tat': lt?.tat(); the = null; bao(); break
    // công tắc «Bảng → máy em» (bật / tắt tay cờ `live.bang`) · «Thu mic» em đang nói — phòng xử (đợt 1C)
    case 'bang': lt?.dat({ bang: m.v === true }); break
    case 'thu-mic': lt?.thuMic(); break
    case 'nghe-em': lt?.datNgheEm(m.v === true); break
    case 'anh': {
      guong.khoa = String(m.trang ?? ''); guong.tiLe = Number(m.tiLe) || 16 / 9; guong.net = Array.isArray(m.net) ? (m.net as NetBut[]) : []
      maCua.set(guong.khoa, maTrang(guong.khoa, vungCua(m.vung), m.giayToi === true))
      lt?.guiAnh(anh())
      break
    }
    case 'vung': {
      const khoa = String(m.trang ?? ''), moi = maTrang(khoa, vungCua(m.vung), m.giayToi === true)
      if (maCua.get(khoa) === moi) break
      maCua.set(khoa, moi)
      if (khoa === guong.khoa) lt?.guiAnh(anh())
      break
    }
    case 'but': {
      const sk = m.sk as SuKienBut | undefined
      if (!sk || typeof sk !== 'object') break
      if (sk.loai === 'trang') {
        guong.khoa = sk.trang; guong.tiLe = sk.tiLe
        maCua.set(sk.trang, maTrang(sk.trang, vungCua(m.vung), m.giayToi === true))
      }
      if (sk.loai !== 'tro') loi.apSuKien(guong.net, sk)
      lt?.nhanSuKienBut(sk.loai === 'trang' ? { ...sk, trang: ma(sk.trang) } : sk)
      break
    }
  }
}
/** Nút «Live» trên bảng Bình Phản Ứng (màn đua). Live = TIẾNG chạy suốt buổi nên bảng KHÔNG cần lui: đã từng bật (mic đã nhớ) ⇒ live ngay tại chỗ.
 *  Trả true khi phải lui về tờ chiếu: lần đầu (thẻ chọn mic nằm trên tờ), hoặc đang live (cụm điều khiển: mic, «Bảng → máy em», «Tắt live» ở tờ). */
export function bamTuBang(): boolean {
  nghe()
  const l = view?.live
  if (!l || !layPhong()) return false
  if (l.bat) return true
  if (nho(KHOA_DA_BAT) && l.tieng !== 'chua-cau-hinh') { void bat(false); return false }
  void moThe()
  return true
}
/** Cho test: xoá trạng thái mô-đun. */
export function _datLaiLiveThay(): void {
  clearTimeout(henHuy); clearInterval(henMuc); henMuc = undefined
  lt?.huy(); lt = null; to = null; ttLt = null; view = null; the = null; dangBat = false; ttCu = ''
  guong.khoa = ''; guong.net = []; maCua.clear(); lucRoi.clear()
}

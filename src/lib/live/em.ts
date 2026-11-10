// LIVE BẢNG — MÁY EM (đặc tả docs/dac-ta-live-bang-1011.md mục 4.1, 4.4, 4.5, 4.7). Nạp lười (không vào đường mở /hs): chỉ khi `viewEm.live.san`.
// Việc: (1) tải ngầm sổ nét của phòng (bắt kịp khi vào muộn / nối lại) và giữ BẢNG hiện tại;
// (2) nối ngầm tới Cloudflare Realtime SFU khi phòng báo có phiên của thầy: kéo track tiếng (đệm jitter thấp nhất), mở kênh điểm đang viết;
//     SFU chưa cấu hình / nối hỏng ⇒ điểm đang viết đến qua WebSocket của phòng, hình vẫn chạy;
// (3) đệm phát + nội suy nét (noi-suy.ts), đồng bộ tiếng–nét, trả ra đúng SỰ KIỆN của bộ máy bút ⇒ lớp vẽ chỉ việc `taoLoiBut().apSuKien(ds, sk)`;
// (4) mở khoá phát tiếng ở lần chạm đầu; rời màn ⇒ ngừng tiếng; (5) số đo `live-do` 10 giây một lần.
// AN TOÀN: thư viện này không nhận, không giữ gì về đáp án — đề trên máy em vẫn dựng từ `viewEm.luot.cau` như cũ.
import type { NetBut, SuKienBut } from '../but-bang-loi'
import { nhomKhung, type ViewLiveEm } from '../bpu/phong-live'
import { giaiGoi, giaiSo } from './ma-net'
import { taoDemPhat } from './noi-suy'
import { apMuc, datLai, taoBang, type BangNet } from './so-net'
import { taoSoDo } from './so-do'
import { choKenhMo, choNoi, docSoWebRtc, goiCua, moiTruongMacDinh, traLoiMoi, type KenhPhong, type MoiTruongLive } from './sfu'

export interface TuyChonLiveEm {
  /** Vé phòng của em (`/hs/bpu/ve` hoặc `/hs/bpu/cua-em`). */
  ve: string
  goc: string
  kenh: KenhPhong
  /** Sự kiện bút cho LỚP ĐÃ CHỐT + nét đang viết: áp bằng `taoLoiBut().apSuKien(ds, sk)` rồi vẽ. Gọi theo đúng thứ tự. */
  khiBut?: (sk: SuKienBut) => void
  khiTrangThai?: (tt: TrangThaiLiveEm) => void
  /** Máy yếu (`ddh.mayYeu`): đệm phát + 16 ms. */
  mayYeu?: boolean
  moiTruong?: Partial<MoiTruongLive>
}
export interface TrangThaiLiveEm {
  /** Công tắc live bật và em được xem. */
  duocXem: boolean
  san: boolean
  /** Thầy đang live ⇒ bật lớp bảng live. */
  bat: boolean
  tu: number | null
  /** chua-cau-hinh = Worker chưa có khoá SFU · cho = chưa nối · dang-noi · co = đang có tiếng · bi-chan = trình duyệt chặn tự phát («Chạm để bật tiếng thầy») · loi = nối hỏng */
  tieng: 'chua-cau-hinh' | 'cho' | 'dang-noi' | 'co' | 'bi-chan' | 'loi'
  /** Em đang BẬT nghe tiếng (mặc định theo phòng: em trong lớp tắt, em ở xa bật — điểm quyết 3). */
  nghe: boolean
  /** Điểm đang viết đến qua: dc = DataChannel · ws = WebSocket của phòng. */
  kenhNet: 'dc' | 'ws'
  /** Sổ nét đã bắt kịp phòng. */
  duBang: boolean
}
export interface KhungLiveEm {
  /** Đầu nét nội suy của từng nét đang viết (vẽ làm đuôi sau các điểm đã phát qua `khiBut`). */
  dau: { id: string; x: number; y: number; apLuc: number }[]
  /** Con trỏ bút lơ lửng của thầy; null = ẩn. */
  tro: { x: number; y: number } | null
}

const CAM = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
const NHIP_SO_MS = 1000
const NHIP_DO_MS = 10_000
const RAI_NOI_MS = 20_000
const RAI_BU_MS = 3000

export function taoLiveEm(tuy: TuyChonLiveEm) {
  const mt: MoiTruongLive = { ...moiTruongMacDinh(), ...tuy.moiTruong }
  const tt: TrangThaiLiveEm = { duocXem: false, san: false, bat: false, tu: null, tieng: 'cho', nghe: false, kenhNet: 'ws', duBang: false }
  const bang: BangNet = taoBang()
  const dem = taoDemPhat({ mayYeu: tuy.mayYeu })
  const soDo = taoSoDo()
  let live: ViewLiveEm = null
  let huyRoi = false, roiMan = false, ngheDat: boolean | null = null, daCham = false
  let pc: RTCPeerConnection | null = null, dc: RTCDataChannel | null = null, nguonNoi = '', doi = 0, henNoi: unknown = null
  let am: HTMLAudioElement | null = null, thu: RTCRtpReceiver | null = null
  let okPhien = -1, okDc: boolean | null = null
  let henBu: unknown = null, choSo = false, lucXinBu = -1e9
  let henSo: unknown = null, lucDo = 0, demTruoc: { tong: number; so: number } | null = null, mucAmThay = 0, rtt: number | null = null
  /** Nét đang viết đã phát ra lớp vẽ: id → số điểm đã phát. */
  const dangVe = new Map<string, number>()

  const bao = (): void => { tuy.khiTrangThai?.({ ...tt }) }
  const dat = (o: Partial<TrangThaiLiveEm>): void => {
    let doiTt = false
    for (const k of Object.keys(o) as (keyof TrangThaiLiveEm)[]) if (tt[k] !== o[k]) { (tt as unknown as Record<string, unknown>)[k] = o[k]; doiTt = true }
    if (doiTt) bao()
  }
  const but = (sk: SuKienBut): void => { try { tuy.khiBut?.(sk) } catch { /* lớp vẽ lỗi không làm hỏng luồng nhận */ } }
  const dcMo = (): boolean => !!dc && dc.readyState === 'open'

  // ── TIẾNG ──
  const capNhatTieng = (): void => { if (am) am.muted = !tt.nghe || roiMan }
  function phatTieng(): void {
    if (!am || !am.srcObject) return
    capNhatTieng()
    void am.play().then(() => { dat({ tieng: 'co' }) }, () => { dat({ tieng: 'bi-chan' }) })
  }
  /** GỌI TRONG LẦN CHẠM ĐẦU của em trong buổi (vd. cú chạm vào toàn màn hình): mở khoá phát tiếng ⇒ sau này có tiếng thật không cần chạm nữa. */
  async function moKhoaTieng(): Promise<boolean> {
    daCham = true
    try {
      am = am ?? document.createElement('audio')
      am.autoplay = true
      am.setAttribute('playsinline', '')
      if (am.srcObject) { capNhatTieng(); await am.play(); dat({ tieng: 'co' }); return true }
      // Chưa có luồng tiếng: phát một tệp câm trong cú chạm để trình duyệt ghi nhận thẻ này đã được người dùng cho phát.
      am.src = CAM; am.muted = true
      await am.play().catch(() => undefined)
      return true
    } catch { return false }
  }
  /** Em bật / tắt nghe tiếng thầy (nút «Tiếng: Đang bật / Đang tắt»). */
  function datTieng(nghe: boolean): void { ngheDat = nghe; dat({ nghe }); capNhatTieng(); if (nghe) phatTieng() }
  /** Rời màn (đặc tả 4.7): tiếng NGỪNG trong lúc em ở app khác; về lại nghe tiếp từ hiện tại, không phát bù. */
  function datRoiMan(roi: boolean): void { roiMan = roi; capNhatTieng(); if (!roi) { dem.xoa(); phatTieng() } }

  // ── SFU ──
  function dongSfu(): void {
    doi += 1
    mt.huyHen(henNoi); henNoi = null
    try { dc?.close() } catch { /* đã đóng */ }
    try { pc?.close() } catch { /* đã đóng */ }
    pc = null; dc = null; thu = null; nguonNoi = ''; demTruoc = null
    if (am) am.srcObject = null
    dat({ kenhNet: 'ws', tieng: live?.tieng === 'chua-cau-hinh' ? 'chua-cau-hinh' : 'cho' })
  }
  async function noiSfu(ss: NonNullable<NonNullable<ViewLiveEm>['ss']>): Promise<void> {
    const doiNay = ++doi
    nguonNoi = ss.id
    dat({ tieng: 'dang-noi' })
    let p: RTCPeerConnection | null = null
    const con = (): boolean => !huyRoi && doiNay === doi
    try {
      p = mt.taoPc({ iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }], bundlePolicy: 'max-bundle' })
      const pcNay = p
      p.addEventListener('track', (e) => {
        if (!con() || e.track.kind !== 'audio') return
        thu = e.receiver
        // Đệm jitter thấp nhất, để trình duyệt tự thích ứng (đặc tả 4.2).
        try { (e.receiver as unknown as { jitterBufferTarget?: number }).jitterBufferTarget = 0 } catch { /* không hỗ trợ */ }
        try { (e.receiver as unknown as { playoutDelayHint?: number }).playoutDelayHint = 0 } catch { /* không hỗ trợ */ }
        am = am ?? document.createElement('audio')
        am.autoplay = true
        am.setAttribute('playsinline', '')
        am.removeAttribute('src')
        am.srcObject = new MediaStream([e.track])
        phatTieng()
      })
      const r = await goiCua(mt, tuy.goc, 'noi', { ve: tuy.ve, nguon: ss.id, ten: [ss.tieng ?? 'thay'] })
      if (!con()) { p.close(); return }
      if (!r.ok || !r.phien || !r.sdp) throw new Error(r.lyDo ?? 'sfu')
      const phien = r.phien
      let d = await goiCua(mt, tuy.goc, 'dap', { ve: tuy.ve, phien, sdp: await traLoiMoi(p, mt, r.sdp), kenh: ss.kenh != null })
      if (!con()) { p.close(); return }
      if (!d.ok && !d.dapXong) throw new Error(d.lyDo ?? 'dap')
      // Có lời mời mới = đường DataChannel đã dựng ⇒ trả lời lần hai.
      let coKenh = d.ok && !!d.sdp
      if (coKenh) { d = await goiCua(mt, tuy.goc, 'dap', { ve: tuy.ve, phien, sdp: await traLoiMoi(p, mt, d.sdp!) }); coKenh = d.ok }
      if (!con()) { p.close(); return }
      if (!(await choNoi(p, mt))) throw new Error('khong-noi')
      if (!con()) { p.close(); return }
      pc = p
      p.addEventListener('connectionstatechange', () => {
        if (pc !== pcNay || !con()) return
        // Mất kết nối quá 5 giây ⇒ tạo phiên mới (đặc tả mục 5).
        if (pcNay.connectionState === 'failed') noiLaiSfu(0)
        else if (pcNay.connectionState === 'disconnected') mt.hen(() => { if (pc === pcNay && pcNay.connectionState !== 'connected') noiLaiSfu(0) }, 5000)
      })
      if (coKenh && ss.kenh) {
        const c = await goiCua(mt, tuy.goc, 'kenh', { ve: tuy.ve, phien, ten: ss.kenh, nguon: ss.id })
        if (!con()) return
        if (c.ok && typeof c.id === 'number') {
          const k = p.createDataChannel(ss.kenh, { negotiated: true, id: c.id, ordered: false, maxRetransmits: 0 })
          k.binaryType = 'arraybuffer'
          k.addEventListener('message', (e) => { if (e.data instanceof ArrayBuffer) nhanDiem(e.data) })
          k.addEventListener('close', () => { if (dc === k) { dc = null; dat({ kenhNet: 'ws' }); baoOk() } })
          if (await choKenhMo(k, mt)) { if (!con()) return; dc = k; dat({ kenhNet: 'dc' }) } else { try { k.close() } catch { /* đã đóng */ } }
        }
      }
      baoOk()
    } catch {
      try { p?.close() } catch { /* đã đóng */ }
      if (!con()) return
      pc = null; dc = null; nguonNoi = ''
      dat({ tieng: 'loi', kenhNet: 'ws' })
      baoOk()
      noiLaiSfu(8000)
    }
  }
  function noiLaiSfu(sauMs: number): void {
    if (huyRoi) return
    dongSfu()
    const ss = live?.ss
    if (!ss || !live?.duocXem || live.tieng === 'chua-cau-hinh') return
    henNoi = mt.hen(() => { henNoi = null; const s = live?.ss; if (s && !pc && !huyRoi) void noiSfu(s) }, sauMs)
  }

  // ── BẢNG ──
  /** Báo phòng em đã sẵn sàng xem (để đếm «em xem») + em có DataChannel hay cần điểm qua WebSocket. Gửi lại khi phiên / đường điểm đổi. */
  function baoOk(): void {
    if (!live?.bat || huyRoi) return
    const coDc = dcMo()
    if (okPhien === live.phien && okDc === coDc) return
    okPhien = live.phien; okDc = coDc
    tuy.kenh.gui({ t: 'live-ok', dc: coDc })
  }
  function xinBu(): void {
    henBu = null
    if (huyRoi || !live?.duocXem) return
    lucXinBu = mt.dongHo(); choSo = true
    tuy.kenh.gui({ t: 'live-bu', net: bang.cuoi })
  }
  /** Bản chốt của một nét đã tới: nét dở cùng id đã phát đủ điểm ⇒ chỉ báo `net-xong`; thiếu / đang phát dở ⇒ thay bằng bản chốt. */
  function apSo(khung: ArrayBuffer | Uint8Array): void {
    const m = giaiSo(khung)
    if (!m) return
    // Nét nhiều khung chưa đủ thì `apMuc` chưa trả sự kiện — nét dở trên lớp vẽ giữ nguyên tới lúc đó.
    const ds = apMuc(bang, m)
    if (!ds.length) return
    if (m.k === 'net' && ds.length === 1 && ds[0]!.loai === 'net-moi') {
      const net: NetBut = ds[0]!.net, daPhat = dangVe.get(net.id)
      dem.boNet(net.id); dangVe.delete(net.id)
      if (daPhat === net.diem.length) { but({ loai: 'net-xong', trang: bang.trang, id: net.id }); return }
      if (daPhat != null) but({ loai: 'xoa', trang: bang.trang, id: [net.id] })
      but(ds[0]!)
      return
    }
    if (m.k === 'net') { dem.boNet(m.net.id); dangVe.delete(m.net.id) }
    if (m.k === 'xoa') for (const id of m.id) { dem.boNet(id); dangVe.delete(id) }
    if (m.k === 'xoa-het' || m.k === 'bang') { dem.xoa(); dangVe.clear() }
    for (const sk of ds) but(sk)
  }
  function nhanDiem(goi: ArrayBuffer | Uint8Array): void {
    if (!live?.bat || roiMan) return
    const g = giaiGoi(goi, live.phien)
    if (!g) return
    // Nét đã có bản chốt trong bảng ⇒ gói điểm tới muộn của nó bỏ.
    if (g.k === 'diem' && !dangVe.has(g.dau.id) && bang.net.some((x) => x.id === g.dau.id)) return
    dem.nap(g, mt.dongHo())
  }
  /** GỌI MỖI KHUNG HÌNH khi đang live: phát các điểm tới hạn ra `khiBut` (net-moi / them-diem) và trả đầu nét nội suy + con trỏ để vẽ lớp «đang viết». */
  function khung(nay: number = mt.dongHo()): KhungLiveEm {
    const k = dem.khung(nay), dau: KhungLiveEm['dau'] = []
    for (const n of k.net) {
      if (n.moi.length) {
        if (!dangVe.has(n.dau.id)) but({ loai: 'net-moi', trang: bang.trang, net: { ...n.dau, diem: n.moi.slice() } })
        else but({ loai: 'them-diem', trang: bang.trang, id: n.dau.id, diem: n.moi })
        dangVe.set(n.dau.id, n.daCo + n.moi.length)
      }
      if (n.head && !n.xong) dau.push({ id: n.dau.id, ...n.head })
    }
    return { dau, tro: k.tro }
  }

  // ── SỐ ĐO + ĐỒNG BỘ TIẾNG–NÉT ──
  function nhipSo(): void {
    henSo = null
    if (huyRoi || !live?.bat) return
    const nay = mt.dongHo()
    const xong = (): void => {
      const s = dem.soDo(nay)
      soDo.ghi('d', s.d); soDo.ghi('j', s.jitter); if (s.muon) soDo.ghi('m', s.muonToiDa)
      soDo.ghi('tn', s.d + (rtt ?? 0) / 2)
      if (nay - lucDo >= NHIP_DO_MS && !roiMan) { lucDo = nay; const tin = soDo.tinKy(dcMo()); if (tin) tuy.kenh.gui(tin) }
      // Phòng báo có mục mới mà quá 2 giây chưa thấy khung nào ⇒ xin bù (kết nối vừa nối lại, tin lạc).
      if (live && live.soNet > bang.cuoi && henBu == null && nay - lucXinBu > (choSo ? 5000 : 2000)) xinBu()
      henSo = mt.hen(nhipSo, NHIP_SO_MS)
    }
    if (!pc) { xong(); return }
    void pc.getStats().then((bc) => {
      const s = docSoWebRtc(bc)
      rtt = s.rtt
      soDo.ghi('rtt', s.rtt); soDo.ghi('jt', s.jitter)
      if (s.mucAm != null) mucAmThay = s.mucAm
      if (s.demTong != null && s.demSo != null) {
        if (demTruoc && s.demSo > demTruoc.so) {
          // Trễ tiếng phía máy em ≈ đệm jitter + ~45 ms thu, mã hoá + ~20 ms loa ⇒ D nét = kẹp(trễ tiếng − 60, D theo dao động, 150).
          const treTieng = ((s.demTong - demTruoc.tong) / (s.demSo - demTruoc.so)) * 1000 + 65
          soDo.ghi('tt', treTieng); dem.datDTheoTieng(tt.nghe && !roiMan ? treTieng : null)
        }
        demTruoc = { tong: s.demTong, so: s.demSo }
      }
    }).catch(() => undefined).then(xong)
  }
  /** Mức âm tiếng thầy 0..1 (cho sóng «Thầy đang nói»). */
  function mucAm(): number {
    try { const n = thu?.getSynchronizationSources?.()[0]?.audioLevel; if (typeof n === 'number') return n } catch { /* không hỗ trợ */ }
    return mucAmThay
  }

  // ── TIN TỪ PHÒNG ──
  /** Mỗi `viewEm` mới của phòng: chuyển `view.live` vào đây (null / vắng = công tắc tắt hoặc phòng bản cũ). */
  function nhanView(l: ViewLiveEm | undefined): void {
    const truoc = live
    live = l ?? null
    if (!live || !live.duocXem) {
      if (pc || henNoi) dongSfu()
      if (truoc?.bat) { dem.xoa(); dangVe.clear() }
      dat({ duocXem: false, san: false, bat: false, tu: null })
      return
    }
    const nghe = ngheDat ?? live.tieng === 'bat', duBang = tt.duBang || bang.cuoi === live.soNet
    // Sổ nét: tải ngầm ngay khi phòng sẵn sàng (rải 0–3 giây để 300 máy không dồn); đang live thì xin ngay.
    if ((live.san || live.bat) && !duBang && !choSo && henBu == null) henBu = mt.hen(xinBu, live.bat ? 0 : mt.ngauNhien() * RAI_BU_MS)
    // SFU: nối ngầm khi có phiên của thầy (rải 0–20 giây khi chưa live; đang live ⇒ nối ngay). Phiên của thầy đổi ⇒ nối lại.
    const ss = live.tieng === 'chua-cau-hinh' ? null : live.ss
    if (!ss) { if (pc || henNoi || nguonNoi) dongSfu() }
    else if (nguonNoi !== ss.id) {
      if (pc || nguonNoi) dongSfu()
      mt.huyHen(henNoi)
      if (live.bat) { henNoi = null; void noiSfu(ss) }
      else henNoi = mt.hen(() => { henNoi = null; const s = live?.ss; if (s && !pc && !nguonNoi) void noiSfu(s) }, mt.ngauNhien() * RAI_NOI_MS)
    } else if (live.bat && henNoi != null) { mt.huyHen(henNoi); henNoi = null; void noiSfu(ss) }
    if (live.bat && (!truoc?.bat || truoc.phien !== live.phien)) { dem.xoa(); dangVe.clear(); demTruoc = null; lucDo = mt.dongHo() }
    if (!live.bat && truoc?.bat) { dem.xoa(); for (const id of dangVe.keys()) but({ loai: 'xoa', trang: bang.trang, id: [id] }); dangVe.clear(); okPhien = -1 }
    dat({ duocXem: true, san: live.san, bat: live.bat, tu: live.tu, nghe, duBang, ...(live.tieng === 'chua-cau-hinh' ? { tieng: 'chua-cau-hinh' as const } : tt.tieng === 'chua-cau-hinh' ? { tieng: 'cho' as const } : {}) })
    capNhatTieng()
    if (live.bat) { baoOk(); if (henSo == null) henSo = mt.hen(nhipSo, NHIP_SO_MS); if (daCham) phatTieng() }
  }
  /** Đợt 1B chuyển MỌI tin của phòng vào đây: khung nhị phân (ArrayBuffer), chuỗi JSON, hoặc đối tượng đã parse. Tin không liên quan ⇒ bỏ qua. */
  function nhanTinPhong(d: unknown): void {
    if (d instanceof ArrayBuffer || d instanceof Uint8Array) {
      const b = d instanceof Uint8Array ? d : new Uint8Array(d)
      if (!b.length) return
      const nhom = nhomKhung(b[0]!)
      if (nhom === 'so') apSo(b)
      else if (nhom === 'diem') nhanDiem(b)
      return
    }
    let m: Record<string, unknown> | null = null
    if (typeof d === 'string') { if (!d.includes('"live') && !d.includes('"em"')) return; try { m = JSON.parse(d) as Record<string, unknown> } catch { return } }
    else if (d && typeof d === 'object') m = d as Record<string, unknown>
    if (!m) return
    if (m.t === 'em') nhanView(m.live as ViewLiveEm | undefined)
    else if (m.t === 'live-so') {
      // Phòng sắp gửi `muc` mục bù ngay sau tin này. `lamLai` ⇒ bảng trắng, nhận lại từ đầu sổ.
      choSo = false
      if (m.lamLai === true) { dem.xoa(); dangVe.clear(); but(datLai(bang)) }
      dat({ duBang: true })
    }
  }
  /** WebSocket của phòng vừa nối lại ⇒ xin bù sổ nét từ số thứ tự cuối đã có + báo lại `live-ok`. */
  function khiNoiLai(): void {
    okPhien = -1; okDc = null; choSo = false
    if (!live?.duocXem) return
    mt.huyHen(henBu); henBu = null
    xinBu()
    baoOk()
  }
  function huy(): void {
    huyRoi = true
    mt.huyHen(henBu); mt.huyHen(henSo); henBu = henSo = null
    dongSfu()
    if (am) { try { am.pause() } catch { /* chưa phát */ } am.srcObject = null; am.removeAttribute('src') }
    am = null
  }

  return {
    trangThai: (): TrangThaiLiveEm => ({ ...tt }),
    nhanView, nhanTinPhong, khiNoiLai,
    moKhoaTieng, datTieng, datRoiMan,
    /** Bảng đã chốt (khoá trang, tỉ lệ vùng viết, mọi nét) — dùng khi lớp vẽ cần dựng lại từ đầu (đổi cỡ, phóng bảng). */
    bang: (): BangNet => bang,
    khung, mucAm,
    /** Số đo đã thu (trung vị / p95 / lớn nhất): d, j, m, rtt, jt, tt, tn — xem so-do.ts. */
    soDo: () => ({ ...soDo.doc(), kenhNet: tt.kenhNet }),
    huy,
  }
}
export type LiveEm = ReturnType<typeof taoLiveEm>

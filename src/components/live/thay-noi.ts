// LIVE BẢNG — MÁY THẦY, PHẦN NỐI Ở CỬA SỔ APP (đợt 1B; đặc tả docs/dac-ta-live-bang-1011.md mục 2.1, 3, 4.5, 5). Nạp lười từ src/lib/bpu/nghe-to-chieu.ts
// khi tờ chiếu chào (`loai: 'live'`) ⇒ không nằm trong đường mở /gv. Thư viện nặng (WebRTC, mã hoá nét — src/lib/live, đợt 1A) chỉ nạp khi phòng báo
// công tắc live bật (`viewBang.live` khác null).
// VÌ SAO MIC + WebRTC Ở APP, KHÔNG Ở TỜ: tờ là khung HTML dựng lại mỗi lần thầy chọn câu (nối ở tờ ⇒ rớt live mỗi lần đổi câu), khung `srcdoc` / tờ mở
// cửa sổ riêng không chắc có quyền mic, và WebSocket của phòng vốn ở app (BangBinhPhanUng, qua cau-live.ts).
// Ba mối nối:  tờ ⇄ tệp này: postMessage (giao thức ở đầu src/lib/live-to-chieu.ts)  ·  tệp này ⇄ phòng: cau-live.ts  ·  tệp này ⇄ SFU: taoLiveThay.
import { taoLoiBut, type NetBut, type SuKienBut } from '../../lib/but-bang-loi'
import { DOI_BPU, kyHieu, type KieuRoi, type ViewBang } from '../../lib/bpu/phong'
import type { ChanDoanMic, CheDoLoc, KetQuaBat, LiveThay, MucLocOn, TinhMic, TrangThaiLiveThay } from '../../lib/live'
import { TRE_CHUOI, TRE_CO_DINH_EM, treKhungOpus, treTiengUocTinh } from '../../lib/live/so-do'
import { dongMay, viSaoCam } from '../../lib/live/so-tieng'
import { GIAO_DIEN_DOT_2 } from '../../lib/bpu/phong-live'
import { chiThayCo } from '../../lib/live/chi-thay'
import { layBangCuoi, layPhong, nghePhong, ngheTin } from '../bpu/cau-live'
import { maTrang } from './bo-cuc'

/** Trạng thái gửi sang tờ để vẽ (tờ không tự suy gì). */
export interface TtLiveTo {
  /** Có phòng + công tắc live bật + buổi là LIVE THEO KHỐI (12/11: buổi dạy trên lớp không còn Live) ⇒ tờ hiện nút «Live». */
  co: boolean
  /** Live theo khối, thầy đang ở chế độ «Bảng» ⇒ tờ ẩn giấy đề, bảng kín màn. */
  cheBang?: boolean
  /** Phòng đang là buổi live theo khối (tờ: nền bảng xanh than, không cần nút «Live» — tiếng tự bật). Chỉ có khi phòng CÒN NỐI và báo rõ. */
  khoi?: boolean
  pha: 'tat' | 'dang-bat' | 'live'
  tu: number | null
  xem: number
  /** Số em đang NGHE tiếng thầy qua máy (máy em báo loa đang phát thật). */
  nghe: number
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
  /** Tiếng em tới mà thẻ phát của máy thầy bị trình duyệt chặn / đứng (lưới an toàn) ⇒ tờ hiện «Chạm để nghe». */
  emKet: boolean
  /** Lượt đang mở mà còn em chưa gửi — viên live nhắc (đặc tả mục 5). */
  chuaGui: number
  /** ĐO TIẾNG TỪ XA (11/11 tối): một dòng gọn cho máy thầy + mỗi máy em (do-tieng.ts / so-tieng.ts); máy câm đứng đầu. Rỗng khi chưa live. */
  doTieng: string[]
  /** `loa` = ô chọn đầu ra âm thanh (null = trình duyệt không chọn được ⇒ ẩn); `thu` = kết quả lần «Thử loa» gần nhất; `trung` = tên loa mặc định nếu đó là
   *  CHÍNH thiết bị của mic (bộ thu USB — Windows hay tự đặt làm loa mặc định ⇒ tiếng app ra jack tai nghe của bộ thu, thầy không nghe thấy). */
  the: { ds: { id: string; ten: string }[]; chon: string; loi: string; tiengLop: boolean; xa: boolean; loa?: { ds: { id: string; ten: string }[]; chon: string; thu?: 'dang' | 'ok' | 'loi'; trung?: string } | null } | null
  /** `kieu` (11/11): em rời bằng cách nào — chữ đã soạn sẵn theo tín hiệu máy em báo; '' = máy em bản cũ không báo. */
  roi: { sbd: string; ten: string; ky: string; doi: string; mau: string; luc: number; kieu: string }[]
  /** ĐỢT 2 (đặc tả 4.8): hàng giơ tay theo thứ tự · em đang được mời mà chưa bật mic · tên em vừa không bật được mic ('' = không). */
  tay: { sbd: string; ten: string; ky: string; doi: string; mau: string; luc: number }[]
  moi: { sbd: string; ten: string; ky: string; doi: string; mau: string } | null
  micLoi: string
  /** Thầy đang TẠM DỪNG live (11/11): viên Live ghi «TẠM DỪNG», cửa sổ nút Live có «Tiếp tục». */
  nghi: boolean
  /** Giao diện đợt 2 (công tắc «Cho em ở xa vào xem») đã mở chưa — cờ `GIAO_DIEN_DOT_2`. */
  dot2: boolean
  /** MIC (11/11): tình trạng mic đang mở, tên, khử vọng + lọc ồn có đang áp không, chế độ thầy chọn (tự động / luôn bật / luôn tắt). null = chưa mở mic. */
  /** `locOn` = mức lọc ồn riêng thầy chọn; `locOnChay` = tình trạng thật của bộ lọc ('chay' / 'tai' / 'tat' / 'loi' / 'khong'). */
  /** `khac` = tên mic thầy đã chọn mà không mở được (đang dùng mic `ten` của máy) — '' = đúng mic đã chọn. `kieuTieng` = «Làm rõ» / «Chuẩn trình duyệt». */
  /** `coThay` = hiện mức «Chỉ giọng thầy» (cờ chưa phát hành, src/lib/live/chi-thay.ts); `tg` = dòng trạng thái mô hình (bản, ngày luyện, hệ số thời gian thực trên máy này). */
  mic: { tinh: TinhMic; ten: string; loc: boolean; cheDo: CheDoLoc; locOn: MucLocOn; locOnChay: string; khac: string; kieuTieng: 'lam-ro' | 'chuan'; coThay?: boolean; tg?: string } | null
  /** Vì sao viên Live ghi không có tiếng ('' = đang có tiếng): chưa có quyền mic / không thấy mic / mic chưa có tín hiệu / chưa nối máy chủ tiếng… */
  lyDoKT: string
  /** Xem lại Live (11/11): trạng thái máy ghi theo phòng — vắng = công tắc tắt (viên Live không có ngăn ghi). */
  ghi?: 'dang-ghi' | 'loi' | 'tat'
  /** Lần đầu máy này ghi buổi live: thẻ nhắc một lần «Thầy không cần bấm gì thêm» (tự tắt sau 9 giây). */
  nhacGhi?: boolean
}
/** Chữ báo tình trạng mic trên cửa sổ nút Live ('' = mic tốt). Mic câm là do ĐƯỜNG TIẾNG của trình duyệt (đã tự thử các cách mở khác), không kết luận thiết bị hỏng. */
export const CHU_TINH_MIC: Record<TinhMic, string> = {
  chua: '', tot: '',
  'bi-tat': 'Trình duyệt báo mic đang bị tắt tiếng (nút tắt tiếng trên mic / bộ thu, hoặc Windows đang tắt tiếng mic này).',
  im: 'Mic này chưa có tín hiệu qua trình duyệt dù đã thử mọi cách mở. Mic không dây: bật bộ phát, kiểm tra đã ghép với bộ thu. Hoặc thầy chọn mục mic đích danh (không phải «Mặc định») hoặc chụp dòng chẩn đoán bên dưới gửi lại.',
  mat: 'Mic vừa bị rút. Đang chờ cắm lại — hoặc thầy chọn mic khác.',
}
/** Chữ của từng KIỂU RỜI (máy em báo theo tín hiệu tat-man.ts — không đoán kiểu máy không phân biệt được). */
export const CHU_KIEU_ROI: Record<KieuRoi, string> = { thoat: 'thoát app', an: 'thoát app hoặc khoá màn', noi: 'cửa sổ nổi', chia: 'chia đôi màn hình' }

const KHOA_MIC = 'ddh.live.mic', KHOA_MIC_TEN = 'ddh.live.mic-ten', KHOA_DA_BAT = 'ddh.live.da-bat', KHOA_LOC = 'ddh.live.loc', KHOA_NHAC_GHI = 'ddh.live.ghi-da-nhac'
const nho = (k: string): string => { try { return localStorage.getItem(k) || '' } catch { return '' } }
const ghi = (k: string, v: string): void => { try { localStorage.setItem(k, v) } catch { /* đầy / chặn */ } }
/** Dòng trạng thái «Chỉ giọng thầy»: mô hình bản nào, luyện ngày nào, hệ số thời gian thực ĐO TRÊN MÁY NÀY; tự tắt thì nói lý do. Không chạy ⇒ ''. */
function dongChiThay(c: ChanDoanMic | undefined): string {
  if (!c || c.locOn !== 'thay') return ''
  const t = c.tgTin, ly: Record<string, string> = { 'cam-thay': 'thầy đang nói mà tiếng ra im', 'cam-ky-thuat': 'tiếng ra im do lỗi', cham: 'máy chạy không kịp', 'so-hong': 'tính toán hỏng', 'loi-chay': 'lỗi khi chạy', ngung: 'tiếng ngừng chảy', 'tải mô hình': 'không tải được mô hình' }
  if (c.tg === 'tai') return 'Đang tải mô hình giọng thầy…'
  if (c.tg === 'loi' || c.tg === 'tu-tat') return `Đã tự tắt (${ly[t?.ly ?? ''] ?? t?.ly ?? 'lỗi'}) — lớp nghe tiếng như trước`
  if (!t) return ''
  return `Mô hình ${t.ban}${t.ngay ? ` · luyện ${t.ngay.split('-').reverse().slice(0, 2).join('/')}` : ''}${typeof t.rtf === 'number' ? ` · máy này chạy ${Math.round(t.rtf * 100)} % thời gian thực` : ''}`
}
/** «Lọc ồn» thầy chọn lần trước (mặc định Vừa). */
const mucLocOn = (): MucLocOn => { const v = nho('ddh.live.loc-on'); return v === 'manh' || v === 'tat' ? v : v === 'thay' && chiThayCo() ? 'thay' : 'vua' }
/** «Tiếng» thầy chọn lần trước: 'chuan' = chuẩn trình duyệt (dự phòng kiểu Meet); mặc định «Làm rõ». */
// 11/11 tối (thầy + nhiều học sinh thử bản sống: đường truyền thông, máy em «loa đang phát» mà KHÔNG nghe thấy gì; Meet trên cùng máy, cùng mic chạy bình thường)
// ⇒ MẶC ĐỊNH «Chuẩn trình duyệt» (gửi thẳng mic, khử vọng + lọc ồn + tự chỉnh âm lượng của trình duyệt — kiểu Meet); «Làm rõ» (chuỗi khung) chỉ khi thầy chọn.
const kieuTieng = (): 'lam-ro' | 'chuan' => (nho('ddh.live.kieu-tieng') === 'lam-ro' ? 'lam-ro' : 'chuan')
const cheDoLoc = (): CheDoLoc => { const v = nho(KHOA_LOC); return v === 'bat' || v === 'tat' ? v : 'tu' }

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
/** Em đang giơ tay: số báo danh ⇒ giờ máy thầy thấy lần đầu (đồng hồ máy thầy — không lệch với đồng hồ máy chủ). */
const lucTay = new Map<string, number>()
/** «Chưa bật được mic»: khoá của lần báo ⇒ giờ máy thầy thấy; hiện 15 giây rồi tự mất. */
let micLoiThay: { khoa: string; luc: number } | null = null
let henMicLoi: ReturnType<typeof setTimeout> | undefined
/** Bố cục giấy đề gần nhất của tờ (chuỗi JSON) — gửi phòng khi đổi, khi phòng nối lại, khi vừa bật live. */
let giayCuoi = '', giayDaGui = '', liveTruoc = false
/** Lý do lần mở mic gần nhất hỏng ('' = không hỏng) — viên Live ghi đúng lý do thay cho «Không tiếng» chung chung. */
let loiMic = ''
let demMuc = 0
let daNghe = false

const ma = (khoa: string): string => maCua.get(khoa) ?? maTrang(khoa, null, false)
const anh = () => ({ trang: ma(guong.khoa), tiLe: guong.tiLe, net: guong.net })
const mauDoi = (d: number): string => { try { return getComputedStyle(document.documentElement).getPropertyValue(DOI_BPU[d]?.mau ?? '').trim() } catch { return '' } }

let nhacGhiDen = 0
/** Thẻ nhắc một lần: lần đầu thấy «đang ghi» trên máy này ⇒ hiện 9 giây rồi thôi mãi (nhớ ở máy). */
function nhacGhi(dangGhi: boolean): boolean {
  if (dangGhi && !nhacGhiDen && !nho(KHOA_NHAC_GHI)) { nhacGhiDen = Date.now() + 9000; ghi(KHOA_NHAC_GHI, '1'); setTimeout(bao, 9100) }
  return nhacGhiDen > Date.now()
}
function trangThai(): TtLiveTo {
  const l = view?.live ?? null, p = layPhong()
  const ds = view?.ds ?? [], roiNay = l?.bat ? (view?.roiNay ?? []) : []
  for (const s of [...lucRoi.keys()]) if (!roiNay.includes(s)) lucRoi.delete(s)
  /** Tên + ký hiệu + đội của một em (em ở xa — chưa điểm danh — không có đội). */
  const em = (sbd: string) => { const e = ds.find((x) => x.sbd === sbd), xa = !!e && !e.vao; return { sbd, ten: e?.ten ?? sbd, ky: kyHieu(e?.ten ?? sbd), doi: !e ? '' : xa ? 'Em ở xa' : (DOI_BPU[e.doi]?.ten ?? ''), mau: e && !xa ? mauDoi(e.doi) : '' } }
  const roi = roiNay.map((sbd) => {
    if (!lucRoi.has(sbd)) lucRoi.set(sbd, Date.now())
    const k = view?.roiKieu?.[sbd]
    return { ...em(sbd), luc: lucRoi.get(sbd)!, kieu: k ? (CHU_KIEU_ROI[k] ?? '') : '' }
  })
  const lu = view?.luot ?? null
  const live = !!l?.bat
  const noi = (live ? (l?.noi ?? []) : []).map((n) => ({ sbd: n.sbd, ten: n.ten, ky: kyHieu(n.ten), doi: n.xa ? 'Em ở xa' : (DOI_BPU[n.doi]?.ten ?? ''), mau: n.xa ? '' : mauDoi(n.doi) }))
  // ĐỢT 2: hàng giơ tay · em đang được mời (chưa bật mic) · em vừa không bật được mic.
  const dsTay = live ? (l?.tay ?? []) : []
  for (const s of [...lucTay.keys()]) if (!dsTay.some((x) => x.sbd === s)) lucTay.delete(s)
  const tay = dsTay.map((x) => { if (!lucTay.has(x.sbd)) lucTay.set(x.sbd, Date.now()); return { ...em(x.sbd), luc: lucTay.get(x.sbd)! } })
  const moi = live && l?.moi && !noi.some((n) => n.sbd === l.moi!.sbd) ? em(l.moi.sbd) : null
  const ml = live ? (l?.micLoi ?? null) : null
  if (!ml) micLoiThay = null
  else if (micLoiThay?.khoa !== `${ml.sbd}:${ml.luc}`) { micLoiThay = { khoa: `${ml.sbd}:${ml.luc}`, luc: Date.now() }; clearTimeout(henMicLoi); henMicLoi = setTimeout(bao, 15_200) }
  const micLoi = ml && micLoiThay && Date.now() - micLoiThay.luc < 15_000 ? em(ml.sbd).ten : ''
  return {
    co: !!l && (!!p || live) && (live || !!l.khoi), cheBang: l?.khoi?.che === 'bang', khoi: !!l?.khoi, pha: live ? 'live' : dangBat ? 'dang-bat' : 'tat', tu: l?.tu ?? null,
    xem: ttLt?.xem ?? l?.xem ?? 0, nghe: ttLt?.xemNghe ?? l?.nghe ?? 0, tong: ds.filter((e) => e.vao).length, lop: view?.lop ?? '',
    coTieng: l?.tieng !== 'chua-cau-hinh', khongTieng: ttLt?.tieng === 'khong' || ttLt?.tieng === 'loi', micIm: !!ttLt?.micIm,
    noiLai: live && !p, mayKhac: !!ttLt?.mayKhacLive,
    bang: live && !!l?.bang, noi, ngheEm: !!ttLt?.ngheEm, emKet: !!ttLt?.amEmKet,
    chuaGui: live && lu && lu.pha === 'tra-loi' ? Math.max(0, ds.filter((e) => e.vao).length - lu.daGui.length) : 0,
    doTieng: live ? dongTieng(em) : [],
    the: the ? { ...the, xa: !!l?.xa } : null, roi, tay, moi, micLoi, nghi: live && !!l?.nghi, dot2: GIAO_DIEN_DOT_2,
    mic: ttLt && ttLt.micTinh !== 'chua' ? { tinh: ttLt.micTinh, ten: ttLt.micTen, loc: ttLt.loc, cheDo: cheDoLoc(), locOn: mucLocOn(), locOnChay: lt?.chanDoan?.().locOnChay ?? 'khong', khac: ttLt.micKhac ?? '', kieuTieng: kieuTieng(), ...(chiThayCo() ? { coThay: true, tg: dongChiThay(lt?.chanDoan?.()) } : {}) } : null,
    lyDoKT: !live || l?.tieng === 'chua-cau-hinh' ? '' : ttLt?.tieng === 'loi' ? (ttLt.loi === 'khong-noi' ? 'Mạng chặn đường tiếng' : 'Chưa nối máy chủ tiếng')
      : ttLt?.tieng === 'khong' ? (loiMic === 'mic-tu-choi' ? 'Chưa có quyền mic' : loiMic === 'khong-mic' ? 'Không thấy mic' : loiMic === 'mic-ban' ? 'Mic đang bị ứng dụng khác giữ' : loiMic ? 'Mic chưa mở được' : 'Live không tiếng')
      : ttLt?.micTinh === 'im' ? 'Mic chưa có tín hiệu' : ttLt?.micTinh === 'bi-tat' ? 'Mic bị tắt tiếng' : ttLt?.micTinh === 'mat' ? 'Mic bị rút' : '',
    ...(live && l?.ghi !== undefined ? { ghi: l.ghi } : {}),
    ...(live && nhacGhi(l?.ghi === 'dang-ghi') ? { nhacGhi: true } : {}),
  }
}
/** Gửi phòng bố cục giấy đề của tờ (chỉ khi đang live, khi đổi / vừa bật live / phòng nối lại). */
/** Dòng đo tiếng từ xa: máy thầy (gửi + nghe em) rồi từng máy em — máy có vấn đề lên đầu, tối đa 40 dòng. */
function dongTieng(em: (sbd: string) => { ten: string }): string[] {
  const tm = lt?.tiengMay?.()
  if (!tm) return []
  const g = tm.thay?.g, ds: string[] = ttLt?.tieng === 'loi' ? [`Máy thầy: ⚠ ${ttLt.loi === 'khong-noi' ? 'ICE hỏng — mạng chặn đường tiếng (UDP); bảng vẫn chạy' : `chưa nối máy chủ tiếng${ttLt.loi ? ` (${ttLt.loi})` : ''}`}`] : [`Máy thầy gửi: ${g ? `${g.kb} kb/s · mức nguồn ${Math.round(g.muc * 100)}` : 'chưa đo'}${tm.thay ? ` · ICE ${tm.thay.ice}${tm.thay.uv ? ` (${tm.thay.uv})` : ''}` : ''}`]
  // DÒNG MÁY THẦY NHẬN TIẾNG EM (11/11 tối): luôn có khi đang live — có kéo track em không, vì sao không, kb/s, dBFS giải mã, thẻ phát
  const e1 = ttLt?.emNoi, n = tm.thay?.n
  if (!e1) ds.push('Máy thầy nhận tiếng em: chưa có em nào đang nói')
  else if (!ttLt?.ngheEm) ds.push(`Máy thầy nhận tiếng ${e1.ten}: ⚠ phát tiếng em ra loa bị tắt bằng lệnh cũ (mặc định 11/11: luôn phát) — không kéo tiếng em`)
  else if (!n) ds.push(`Máy thầy nhận tiếng ${e1.ten}: ⚠ chưa kéo được tiếng em${tm.loiKeo ? ` (lỗi ${tm.loiKeo})` : tm.keo ? ' (đang kéo…)' : ''}`)
  else {
    // chỉ là chữ GỢI Ý: tiếng em đã giải mã đủ to + thẻ đang phát mà thầy vẫn không nghe ⇒ khả năng cao là loa / âm lượng của máy (trình duyệt không đọc được)
    const goiY = n.db != null && n.db > -50 && n.pt && !n.pt.d && !n.pt.m && n.pt.v > 0 ? ` · Máy thầy đang phát tiếng em ở ${n.db} dBFS — nếu không nghe thấy, kiểm loa / âm lượng máy` : ''
    ds.push(dongMay(`Máy thầy nhận tiếng ${e1.ten}`, tm.thay, 'tiếng em') + goiY)
  }
  const may = tm.em.map((x) => ({ d: dongMay(em(x.s).ten, x.ti), xau: viSaoCam(x.ti) !== '' }))
  may.sort((a, b) => Number(b.xau) - Number(a.xau))
  return [...ds, ...may.slice(0, 40).map((x) => x.d)]
}
function guiGiay(lai = false): void {
  if (lai) giayDaGui = ''
  if (!lt || !view?.live?.bat || giayCuoi === giayDaGui) return
  giayDaGui = giayCuoi
  let g: unknown = null
  try { g = giayCuoi ? JSON.parse(giayCuoi) : null } catch { g = null }
  lt.dat({ giay: g })
}
function guiTo(tin: Record<string, unknown>): void { try { to?.postMessage({ nguon: 'bpu-bang', ...tin }, '*') } catch { /* tờ đã đóng */ } }
let ttCu = '', coEmNoi = false
// XEM LẠI LIVE (11/11): máy ghi là mảnh nạp lười riêng, chỉ tải khi máy này đang giữ live; tự chạy khi live bật, tự dừng khi live tắt. Lỗi ghi không chặn live.
let ghiNap = false, ghiMoc: ((sk: SuKienBut) => void) | null = null
function soatGhi(): void {
  if (!ghiNap && !(lt && ttLt?.pha === 'live' && view?.live?.bat && view.live.ghi !== undefined)) return
  ghiNap = true
  void import('../../lib/live/may-ghi').then((m) => {
    ghiMoc = m.danhDauNet
    m.soatMayGhi({ layLuong: lt ? lt.luongGhi : null, pha: ttLt?.pha, live: view?.live, phong: layPhong(), buoiId: view?.buoiId, gui: (t) => { layPhong()?.gui(t) } })
  }).catch(() => {})
}
/** Đọc lại danh sách loa cho cửa sổ nút Live (mở cửa sổ, cắm / rút thiết bị, đổi mic). Loa đã chọn không còn ⇒ về «Mặc định của máy». */
async function napLoa(): Promise<void> {
  if (!the || !lt?.coLoa?.()) return
  const ds = await lt.dsLoa().catch(() => [])
  const trung = (await lt.loaTrungMic(ttLt?.micTen || '')) || (await lt.loaTrungMic(nho(KHOA_MIC_TEN)))
  if (!the || !lt) return
  let chon = lt.loa()
  if (chon && !ds.some((d) => d.id === chon)) { chon = ''; void lt.datLoa('') }
  the = { ...the, loa: ds.length ? { ds, chon, thu: the.loa?.thu, trung } : null }
  bao()
}
function bao(): void {
  const tt = trangThai()
  soatGhi()
  // Nút Live trên bảng Bình Phản Ứng + thẻ gọn thay viền đỏ toàn màn khi đang giảng trên tờ.
  void import('../bpu/gan-gv').then((m) => m.datLive({ co: tt.co, bat: tt.pha === 'live' })).catch(() => {})
  const k = JSON.stringify(tt)
  if (k !== ttCu) { ttCu = k; guiTo({ lenh: 'live-tt', tt }) }
  // vạch mức mic: chỉ chạy khi thẻ mic đang mở hoặc đang live có tiếng
  const canMuc = !!lt && (!!the || (tt.pha === 'live' && tt.coTieng && !tt.khongTieng))
  coEmNoi = tt.noi.length > 0
  // vừa bật live ⇒ gửi bố cục giấy đề đang có
  if ((tt.pha === 'live') !== liveTruoc) { liveTruoc = tt.pha === 'live'; if (liveTruoc) guiGiay(true) }
  // kèm dòng chẩn đoán mic (≈ 1 lần / giây, chỉ khi cửa sổ nút Live đang mở)
  if (canMuc && !henMuc) henMuc = setInterval(() => { guiTo({ lenh: 'live-muc', v: lt?.mucAm() ?? 0, em: coEmNoi ? (lt?.mucAmEm() ?? 0) : 0, ...(the && ++demMuc % 11 === 0 ? { cd: dongChanDoan() } : {}) }) }, 90)
  else if (!canMuc && henMuc) { clearInterval(henMuc); henMuc = undefined }
}

/** DÒNG CHẨN ĐOÁN MIC trong cửa sổ nút Live (thầy chụp gửi khi còn lỗi): tên mic · trạng thái track · cấu hình trình duyệt đang chạy · mức âm tại mic và
 *  mức đang gửi (0–100) · tốc độ bit · đã nối máy chủ tiếng chưa. */
export function dongChanDoan(): string {
  const c = lt?.chanDoan()
  if (!c) return ''
  const bt = (v: boolean | null) => (v == null ? '?' : v ? 'bật' : 'tắt'), pt = (v: number | null) => (v == null ? '—' : String(Math.round(v * 100)))
  const track = { live: 'đang chạy', muted: 'BỊ TẮT TIẾNG', ended: 'ĐÃ NGẮT', tat: 'thầy đang tắt tiếng', khong: 'chưa mở' }[c.track]
  return [(c.ten || 'chưa có mic') + (c.the ? ' (mục mặc định của máy câm ⇒ đang mở thẳng mic này)' : ''), `luồng ${track}`, `${c.hz ?? '?'} Hz · ${c.kenh ?? '?'} kênh`, `khử vọng ${bt(c.vong)} · lọc ồn ${bt(c.on)} · tự chỉnh ${bt(c.agc)}`, `cách mở ${c.bac + 1}/3`,
    `mức tại mic ${pt(c.muc)} · đang gửi ${pt(c.mucGui)}`, c.kbps == null ? 'chưa gửi' : `${c.kbps} kb/s`, c.gan ? 'bộ gửi cầm mic' : 'bộ gửi CHƯA cầm mic', c.sfu ? 'máy chủ tiếng đã nối' : 'máy chủ tiếng CHƯA nối',
    `làm rõ tiếng ${c.chuoi ? `bật (${c.kieu})` : 'tắt'}`, `lọc ồn ${c.locOn} (${c.locOnChay})`, `bộ đo ${c.ctx}`, dongTre(c)].filter(Boolean).join(' · ')
}
/** «Trễ tiếng ước tính ~N ms» (thầy 11/11 «tức thì»): chỉ cộng số đo được — bộ đệm thu trình duyệt báo, chuỗi làm rõ tiếng, khung Opus, nửa RTT máy thầy ↔ máy
 *  chủ tiếng, và từ máy em báo về: nửa RTT + đệm rung (trung vị cả lớp). Chưa gồm loa / tai nghe của máy em. */
function dongTre(c: ChanDoanMic): string {
  const m = lt?.mang()
  if (!m || !c.sfu) return ''
  const so = (o: unknown, k: string): number | null => { const v = (o as Record<string, { tv?: unknown } | null> | null)?.[k]?.tv; return typeof v === 'number' ? v : null }
  const tt = so(m.em, 'tieng'), rttEm = so(m.em, 'rtt')
  const u = treTiengUocTinh({ thu: c.treThu ?? 10, chuoi: c.chuoi ? TRE_CHUOI[c.kieu] ?? 0 : 0, ma: treKhungOpus(m.ptime), mangThay: m.rtt, mangEm: rttEm, demEm: tt == null ? null : Math.max(0, tt - TRE_CO_DINH_EM) })
  return `đường nối ${m.duong ?? '?'} · RTT ${m.rtt == null ? '?' : Math.round(m.rtt)} ms · ${u.ms <= 0 ? 'trễ tiếng chưa đo được' : u.du ? `trễ tiếng ước tính ~${u.ms} ms (chưa gồm loa máy em)` : `trễ tiếng phần máy thầy ~${u.ms} ms (chưa có số từ máy em)`}`
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
      kenh: { gui: (t) => { layPhong()?.gui(t) }, guiNhiPhan: (k) => { layPhong()?.guiNhiPhan(k) }, hangCho: () => layPhong()?.hangCho() ?? 0 },
      layAnh: anh, loc: cheDoLoc(), locOn: mucLocOn(), kieuTieng: kieuTieng(), chuoi: nho('ddh.live.chuoi') !== 'tat', // công tắc lùi khẩn của chuỗi làm rõ tiếng: localStorage `ddh.live.chuoi` = `tat`
      // cắm / rút mic ⇒ ô chọn mic đang mở đọc lại danh sách
      khiThietBi: () => { if (the && lt) void lt.dsMic().then((ds) => { if (the) { the = { ...the, ds }; bao() } }).catch(() => {}); void napLoa() },
      micTen: nho(KHOA_MIC_TEN), khiMicMoi: (id) => { ghi(KHOA_MIC, id); if (the) the = { ...the, chon: id } }, // mic đã chọn đổi mã (cắm cổng khác) ⇒ nhớ mã mới
      khiTrangThai: (t) => { if (the && t.micTen !== ttLt?.micTen) setTimeout(() => { void napLoa() }, 0); ttLt = t; if (t.micTen && !t.micKhac && nho(KHOA_MIC)) ghi(KHOA_MIC_TEN, t.micTen); if (t.pha === 'live' || t.pha === 'san') dangBat = false; bao() },
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
      if (m.t === 'bang' || m.t === 'live-xem' || m.t === 'live-kq' || m.t === 'live-do') bao()
    }
  })
  nghePhong(() => {
    clearTimeout(henHuy)
    if (layPhong()) { lt?.khiNoiLai(); guiGiay(true); void dam() }
    // phòng rớt: chờ nối lại 25 giây (mạng chập chờn, thầy chọn câu khác); quá ⇒ bảng đã đóng hẳn ⇒ tắt live, thả mic
    else henHuy = setTimeout(() => { if (!layPhong()) { view = null; huy() } }, 25_000)
    bao()
  })
  view = (layBangCuoi() as ViewBang | null) ?? view
  void dam()
  // Xem lại Live: khúc tiếng kẹt từ lần live trước (mất mạng) ⇒ tải bù khi thầy mở lại tờ chiếu (chỉ nạp mảnh khi có cờ).
  try { if (localStorage.getItem('ddh.live.ghi-ket') === '1') void import('../../lib/live/may-ghi').then((m) => m.taiBuKhucKet()).catch(() => {}) } catch { /* không có kho */ }
}

async function moThe(): Promise<void> {
  await dam()
  const l = view?.live
  if (!lt || !l) return
  the = { ds: [], chon: nho(KHOA_MIC), loi: '', tiengLop: !!l.tiengLop, xa: !!l.xa }
  bao()
  if (l.tieng === 'chua-cau-hinh') return
  // GIỮ mic đang mở nếu còn tốt (11/11: mở cửa sổ lúc đang live từng dừng luôn track đang gửi ⇒ cả lớp mất tiếng)
  let kq = await lt.moMic(the.chon || null, { giu: true })
  // mic đã nhớ không còn cắm ⇒ thử mic mặc định, quên mic cũ
  if (!kq.ok && kq.lyDo === 'khong-mic' && the?.chon) { ghi(KHOA_MIC, ''); the = { ...the, chon: '' }; kq = await lt.moMic(null) }
  if (!the) { lt.thaMic(); return }
  loiMic = kq.ok ? '' : kq.lyDo
  if (!kq.ok) the = { ...the, loi: kq.lyDo }
  else the = { ...the, loi: '', ds: await lt.dsMic().catch(() => []) }
  void napLoa() // ô «Loa» (sau khi có quyền mic thì trình duyệt mới cho tên thiết bị)
  bao()
}
async function bat(khongTieng: boolean): Promise<void> {
  await dam()
  if (!lt) return
  dangBat = true; bao()
  // thẻ đang mở ⇒ mic đã mở sẵn (vạch mức âm đang chạy) — không xin lại; bấm Live thẳng ⇒ mic đã nhớ
  const kq: KetQuaBat = await lt.bat({ mic: the && !the.loi ? null : nho(KHOA_MIC) || null, khongTieng })
  dangBat = false
  loiMic = kq.ok ? (khongTieng ? loiMic : '') : kq.lyDo
  if (kq.ok) { the = null; ghi(KHOA_DA_BAT, '1') }
  else if (kq.lyDo === 'mic-tu-choi' || kq.lyDo === 'khong-mic' || kq.lyDo === 'mic-loi' || kq.lyDo === 'mic-ban') the = { ds: the?.ds ?? [], chon: the?.chon ?? '', loi: kq.lyDo, tiengLop: !!view?.live?.tiengLop, xa: !!view?.live?.xa }
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

type TinTo = { viec?: unknown; id?: unknown; v?: unknown; sk?: unknown; trang?: unknown; tiLe?: unknown; net?: unknown; vung?: unknown; giayToi?: unknown; sbd?: unknown; giay?: unknown }
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
    case 'chon-loa': if (the?.loa && typeof m.id === 'string') { the = { ...the, loa: { ...the.loa, chon: m.id, thu: undefined } }; bao(); void lt?.datLoa(m.id).then(() => napLoa()) } break
    case 'thu-loa': if (the?.loa && lt) { the = { ...the, loa: { ...the.loa, thu: 'dang' } }; bao(); void lt.thuLoa().then((ok) => { if (the?.loa) { the = { ...the, loa: { ...the.loa, thu: ok ? 'ok' : 'loi' } }; bao() } }) } break
    // chọn mic ⇒ áp NGAY cho cả vạch đo lẫn luồng đang gửi (thư viện gắn luồng mới vào bộ gửi), nhớ cho lần sau
    case 'chon-mic': if (the && typeof m.id === 'string') { the = { ...the, chon: m.id }; ghi(KHOA_MIC, m.id); bao(); void lt?.moMic(m.id).then((kq) => { loiMic = kq.ok ? '' : kq.lyDo; if (the && !kq.ok) the = { ...the, loi: kq.lyDo }; bao() }) } break
    // «Lọc tiếng ồn + khử vọng»: tự động / luôn bật / luôn tắt
    case 'loc-on': { const v: MucLocOn = m.v === 'manh' || m.v === 'tat' ? m.v : m.v === 'thay' && chiThayCo() ? 'thay' : 'vua'; ghi('ddh.live.loc-on', v === 'vua' ? '' : v); lt?.datLocOn(v); bao(); setTimeout(bao, 900); break }
    case 'loc': { const v: CheDoLoc = m.v === 'bat' || m.v === 'tat' ? m.v : 'tu'; ghi(KHOA_LOC, v === 'tu' ? '' : v); lt?.datLoc(v); bao(); break }
    case 'bat-dau': if (the?.chon) ghi(KHOA_MIC, the.chon); void bat(false); break
    case 'khong-tieng': void bat(true); break
    case 'thu-lai': void moThe(); break
    case 'tieng-lop': if (the) { the = { ...the, tiengLop: m.v === true }; lt?.dat({ tiengLop: m.v === true }); bao() } break
    case 'tat': lt?.tat(); the = null; bao(); break
    // công tắc «Bảng → máy em» (bật / tắt tay cờ `live.bang`) · «Thu mic» em đang nói — phòng xử (đợt 1C)
    case 'bang': lt?.dat({ bang: m.v === true }); break
    // «Thu mic» một em (kèm `sbd`) / «Tắt mic tất cả» (không `sbd`) · đợt 2: «Mời nói», «Hạ hết tay», công tắc «Cho em ở xa vào xem», bố cục giấy đề
    case 'thu-mic': lt?.thuMic(typeof m.sbd === 'string' && m.sbd ? m.sbd : undefined); break
    case 'moi': if (typeof m.sbd === 'string' && m.sbd) lt?.moiNoi(m.sbd); break
    case 'ha-tay': lt?.haTay(typeof m.sbd === 'string' && m.sbd ? m.sbd : undefined); break
    case 'xa': if (GIAO_DIEN_DOT_2) lt?.dat({ xa: m.v === true }); break
    // «Tạm dừng» / «Tiếp tục» trong cửa sổ nút Live (thầy 11/11); «Kết thúc live» = `tat` ở trên
    case 'tam-dung': lt?.tamDung(m.v === true); break
    case 'giay': { let k = ''; try { k = m.giay && typeof m.giay === 'object' ? JSON.stringify(m.giay) : '' } catch { k = '' } if (k.length <= 1500) { giayCuoi = k; guiGiay() } break }
    case 'nghe-em': lt?.datNgheEm(m.v === true); break
    case 'nghe-em-lai': lt?.phatLaiEm(); break
    // «Tiếng: Làm rõ / Chuẩn trình duyệt» — áp NGAY, nhớ ở máy
    case 'kieu-tieng': { const v = m.v === 'chuan' ? 'chuan' : 'lam-ro'; ghi('ddh.live.kieu-tieng', v === 'chuan' ? '' : 'lam-ro'); lt?.datKieuTieng(v === 'chuan'); bao(); setTimeout(bao, 900); break }
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
      ghiMoc?.(sk) // Xem lại Live: mốc giờ bắt đầu nét (cùng đồng hồ với khúc tiếng)
      lt?.nhanSuKienBut(sk.loai === 'trang' ? { ...sk, trang: ma(sk.trang) } : sk)
      break
    }
  }
}
/** Nút «Live» trên bảng Bình Phản Ứng (màn đua). Live = TIẾNG chạy suốt buổi nên bảng KHÔNG cần lui: đã từng bật (mic đã nhớ) ⇒ live ngay tại chỗ.
 *  Trả true khi phải lui về tờ chiếu: lần đầu (thẻ chọn mic nằm trên tờ), hoặc đang live (cụm điều khiển: mic, «Bảng → máy em», «Tắt live» ở tờ). */
/** LIVE THEO KHỐI (thầy 12/11: «đang live … lại phải bấm live ở đây»): bật tiếng NGAY khi thầy bấm «Bắt đầu live» — không cần tờ, không cần thẻ chọn mic
 *  (mic đã nhớ, chưa nhớ thì mic mặc định; trình duyệt tự hỏi quyền lần đầu). Trả 'cho' nếu chưa nối phòng (nơi gọi thử lại), 'dang' = đang bật / đã bật. */
export function batLiveKhoi(): 'cho' | 'dang' {
  nghe()
  const l = view?.live
  if (!l || !layPhong()) return 'cho'
  if (!l.bat && !dangBat) void bat(l.tieng === 'chua-cau-hinh')
  return 'dang'
}
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
  lt?.huy(); lt = null; to = null; ttLt = null; view = null; the = null; dangBat = false; ttCu = ''; ghiNap = false; ghiMoc = null; nhacGhiDen = 0
  guong.khoa = ''; guong.net = []; maCua.clear(); lucRoi.clear(); lucTay.clear(); micLoiThay = null; clearTimeout(henMicLoi); giayCuoi = giayDaGui = ''; liveTruoc = false; coEmNoi = false; loiMic = ''; demMuc = 0
}

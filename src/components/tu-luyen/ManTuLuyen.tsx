// MÀN TU LUYỆN (29/09, thầy chốt: "đặt ở sảnh bật lại 4 chế độ, giữ nguyên thuật toán của từng chế độ, thiết kế lại giao diện cho đẹp
// mắt hơn … giao diện làm bài đồng bộ với giao diện của app mới, hiển thị đáp án đúng chuẩn … không tính exp … có thêm tổng hợp đánh giá").
// Mở từ cửa "Tu luyện" trên Sảnh (SanhBanDo), nạp lười (StudentPortalScreen). Ba chặng: CHỌN chế độ → LÀM (TheCau chế độ `thi`, không đáp án)
// → KẾT QUẢ (máy chủ chấm; TheCau `xem_lai`: đáp án + lời giải chuẩn). Thẻ "Tổng hợp" ở đầu màn: tiến bộ của em (TongHopTuLuyen.tsx).
// Nền đêm cùng bộ với Sảnh / Câu đã làm; thẻ câu dưới `.m3` (bảng màu M3 dùng chung). Máy chủ: server/src/tu-luyen.ts.
// v3 (30/09): không thẻ nào "Đang khoá" vì kho câu sai trống (máy chủ tự dự phòng); bộ đếm "Đã khắc phục X/Y câu sai"; công tắc
// "Chấm từng câu" (nhớ theo máy) ⇒ mỗi câu bấm Kiểm tra, máy chủ chấm + khoá câu, hiện đúng/sai + lời giải + nút Câu tiếp.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
const ManChuaCauSai = lazy(() => import('../chua-cau-sai/ManChuaCauSai'))
import ChoChuaCuaEm from '../chua-cau-sai/ChoChuaCuaEm'
import { apiCoChua } from '../../lib/chua-cau-sai-api'
import TheCau from '../TheCau'
import { hoiXacNhan } from '../hop-thoai'
import '../m3'
import '../hoa2/phong-baloo'
import './tu-luyen.css'
import './tu-luyen-rong.css'
import ChonNguonSai from './ChonNguonSai'
import { chonMacDinh, demChon, docNhoNguon, ghiNhoNguon, type MaNguonSai } from './nguon-cau-sai'
import type { HinhAnh } from '../../data/examContent'
import { chiSoDuoiRo } from '../hoa2/cau-chuyen'
import {
  NHAN_PHAN_TU_LUYEN,
  SO_CAU_MAC_DINH,
  TEN_CHE_DO,
  chuThoiGian,
  timDangTrongDanhMuc,
  kepSoCauCheDo2,
  kepSoCauCheDo3,
  kepSoCauCheDo4,
  tongHopTuLuyen,
  type CauCongKhai,
  type CheDoTuLuyen,
  type KetQuaCau,
  type TongHopTuLuyen as TomTatTongHop,
} from '../../lib/tu-luyen'
import { chamCau, nopBai, rutCau, taiNguon, taiTongHop, xemLuot, xemTruoc, type KetQuaNop, type LuotDangLam, type NguonDangEm, type NguonTuLuyen, type ThamSoRut } from './api'
import TongHopTuLuyen from './TongHopTuLuyen'
import { taiDieuKienLuyenDe, type DieuKienLuyenDe } from '../luyen-de/dung-luyen-de'
import { giuTrangKhongTaiLai } from '../../lib/cap-nhat-app'
import { taoGoiSom } from '../hoa2/nap-truoc-man'
import { BanDoKetQua, KhungLamRong, cuonToiCau, useBoCuc, type BoCuc, type LocXem, type NhomBang } from './bo-cuc'

// Thẻ "Luyện đề cấu trúc" (30/09): mảnh NẠP LƯỜI khi em mở thẻ (ngoài precache — vite.config.ts globIgnores). Cổng + lý do khoá lấy từ
// máy chủ `/luyen-de/dieu-kien` ngay khi mở Tu luyện (thẻ hiện ổ khoá, không ẩn).
const LuyenDeCauTruc = lazy(() => import('./LuyenDeCauTruc'))

export interface ManTuLuyenProps {
  token: string
  sbd: string
  onVe: () => void
}

type Chu = 'A' | 'B' | 'C' | 'D'
type DS = 'D' | 'S'

const MO_TA: Record<CheDoTuLuyen, { phu: string; y: string }> = {
  1: { phu: 'Làm lại câu em đã sai từ 29/09', y: 'Ca kiểm tra, chiến dịch, Luyện đề, Tu luyện' },
  2: { phu: 'Câu mới cùng dạng với câu em sai', y: 'Chia theo tỉ lệ câu sai từng dạng' },
  3: { phu: 'Chọn Lớp → Bài → Dạng để luyện sâu', y: 'Theo sách giáo khoa, không vượt khối em' },
  4: { phu: 'Rút ngẫu nhiên, lọc theo sao và loại câu', y: 'Lý thuyết hay bài tập tuỳ em' },
}
const LUA_CHON_TU_DO: { id: string; ten: string }[] = [
  { id: 'ngau_nhien', ten: 'Ngẫu nhiên' },
  { id: 'sao_2', ten: '2 sao' },
  { id: 'sao_1', ten: '1 sao' },
  { id: 'ly_thuyet', ten: 'Lý thuyết' },
  { id: 'bai_tap', ten: 'Bài tập' },
]

/** Bài đang làm dở — giữ trên máy em để lỡ tải lại trang không mất (chỉ câu công khai + lựa chọn của em, không có đáp án). */
interface BaiDangLam extends LuotDangLam {
  traLoi: Record<string, string>
  giay: number
  giayCau: Record<string, number>
  coGoiY: string[]
  /** "Chấm từng câu" (chốt lúc rút): câu đã Kiểm tra ⇒ kết quả máy chủ trả (chỉ câu ấy có đáp án), khoá không sửa. */
  chamTungCau?: boolean
  daCham?: Record<string, KetQuaCau>
}
const khoaNho = (sbd: string) => `ddh.tuluyen.dang.${sbd}`
function docNho(sbd: string): BaiDangLam | null {
  try {
    const o = JSON.parse(localStorage.getItem(khoaNho(sbd)) || 'null') as BaiDangLam | null
    return o && typeof o.luotId === 'string' && Array.isArray(o.cau) ? o : null
  } catch {
    return null
  }
}
function ghiNho(sbd: string, b: BaiDangLam | null) {
  try {
    if (b) localStorage.setItem(khoaNho(sbd), JSON.stringify(b))
    else localStorage.removeItem(khoaNho(sbd))
  } catch {
    /* hết chỗ / chế độ riêng tư: bỏ qua, bài vẫn làm được */
  }
}

/** Công tắc "Chấm từng câu" — nhớ theo máy (localStorage; chế độ riêng tư / chặn lưu ⇒ mặc định tắt). */
const KHOA_CHAM_TUNG_CAU = 'ddh.tuluyen.chamtungcau'
function docChamTungCau(): boolean {
  try { return localStorage.getItem(KHOA_CHAM_TUNG_CAU) === '1' } catch { return false }
}
function ghiChamTungCau(bat: boolean) {
  try { localStorage.setItem(KHOA_CHAM_TUNG_CAU, bat ? '1' : '0') } catch { /* bỏ qua */ }
}

const bon = <T,>(a: T[] | null | undefined, lap: T): [T, T, T, T] => [a?.[0] ?? lap, a?.[1] ?? lap, a?.[2] ?? lap, a?.[3] ?? lap]
const daTraLoi = (c: CauCongKhai, v: string | undefined): boolean => {
  if (!v) return false
  if (c.phan === 'II') return v.replace(/[^DS]/g, '').length === 4
  return v.trim().length > 0
}
const dongHo = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
/** Mã câu trong lượt có thể mang đuôi bản lặp `~2` (chế độ 1) — Hỏi thầy / lời giải đi theo câu GỐC. */
const qidGoc = (qid: string) => qid.replace(/~\d+$/, '')
const pt = (x: number) => `${x.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`
const PHAN: CauCongKhai['phan'][] = ['I', 'II', 'III']
/** Nhóm câu theo phần cho bảng câu bên phải (số câu giữ đúng thứ tự trong lượt). */
function nhomTheoPhan(cau: readonly CauCongKhai[], traLoi: Record<string, string>): NhomBang[] {
  return PHAN.map((p) => ({
    phan: p,
    ten: NHAN_PHAN_TU_LUYEN[p],
    cau: cau.flatMap((c, i) => (c.phan === p ? [{ id: c.qid, so: i + 1, phan: p, giaTri: traLoi[c.qid] ?? '', daLam: daTraLoi(c, traLoi[c.qid]) }] : [])),
  })).filter((n) => n.cau.length)
}
/** Nhãn chế độ 1 trên thẻ câu: "Luyện lại lần K" + "Còn 1 lần đúng nữa là khắc phục" + dòng "Sai gốc: …" (máy chủ gửi sẵn chữ). */
function NhanLuyen({ c }: { c: CauCongKhai }) {
  if (!c.nhanLuyen && !c.saiGoc && !c.conMotLan) return null
  return (
    <>
      {c.nhanLuyen && <span className="tlu-nhan" data-kieu="luyen">{c.nhanLuyen}</span>}
      {c.conMotLan && <span className="tlu-nhan" data-kieu="con-mot">{c.conMotLan}</span>}
      {c.saiGoc && <span className="tlu-sai-goc">{c.saiGoc}</span>}
    </>
  )
}

/** Bộ đếm nổi bật "Đã khắc phục X/Y câu sai" + thanh tiến độ (thẻ Sửa câu sai, Tổng hợp). */
export function DemKhacPhuc({ da, tong, gon = false }: { da: number; tong: number; gon?: boolean }) {
  if (tong <= 0) return null
  return (
    <span className="tlu-dem-kp" data-gon={gon ? 'true' : 'false'}>
      <span className="tlu-dem-kp-chu">Đã khắc phục <b className="tlu-tab">{da}/{tong}</b> câu sai</span>
      <span className="tlu-thanh" role="progressbar" aria-label="Số câu sai đã khắc phục" aria-valuemin={0} aria-valuemax={tong} aria-valuenow={da}>
        <span style={{ transform: `scaleX(${Math.min(1, da / tong)})` }} />
      </span>
    </span>
  )
}

function IconKhoaNho() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  )
}
function IconVe() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}
/** Biểu tượng của từng chế độ (nét đơn, màu theo chữ). */
function IconCheDo({ cheDo }: { cheDo: CheDoTuLuyen }) {
  const p = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, focusable: false }
  if (cheDo === 1) return <svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></svg>
  if (cheDo === 2) return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><path d="M17.5 14v7M14 17.5h7" /></svg>
  if (cheDo === 3) return <svg {...p}><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 9h8M8 13h6" /></svg>
  return <svg {...p}><path d="M15 3h6v6" /><path d="M21 3l-7 7" /><path d="M9 21H3v-6" /><path d="M3 21l7-7" /></svg>
}

function IconTongHop() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M6 20v-6M12 20V4M18 20v-10M2 20h20" />
    </svg>
  )
}
function IconLuyenDeThe() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M6 3h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M14 3v5h5" />
      <path d="M8 12h8M8 15.5h8M8 19h5" />
    </svg>
  )
}

// GỌI SỚM (chuyển màn nhanh 05/10, components/hoa2/man-sanh-luoi.ts · moManTuLuyenNhanh): chạm "Tu luyện" ở Sảnh khi mảnh này đã nạp trước
// ⇒ bắn NGAY hai lệnh mở màn (nguồn câu + điều kiện Luyện đề) song song với lúc vẽ màn; lượt tải ĐẦU của màn nhận lại lời hứa — số lệnh không đổi.
const somNguon = taoGoiSom<Awaited<ReturnType<typeof taiNguon>>>()
const somDieuKien = taoGoiSom<DieuKienLuyenDe | null>()
export function goiSomTuLuyen(token: string): void {
  if (!token) return
  somNguon.ban(token, () => taiNguon(token))
  somDieuKien.ban(token, () => taiDieuKienLuyenDe(token))
}
const xoaSom = () => {
  somNguon.xoa()
  somDieuKien.xoa()
}

export default function ManTuLuyen({ token, sbd, onVe }: ManTuLuyenProps) {
  const boCuc = useBoCuc()
  const rong = boCuc !== 'doc'
  const [thePhu, setThePhu] = useState<'luyen' | 'tong-hop' | 'luyen-de'>('luyen')
  const [dieuKien, setDieuKien] = useState<DieuKienLuyenDe | null>(null)
  const [dangTaiDk, setDangTaiDk] = useState(true)
  const [lamMoiDk, setLamMoiDk] = useState(0)
  useEffect(() => {
    let song = true
    setDangTaiDk(true)
    void (somDieuKien.nhan(token) ?? taiDieuKienLuyenDe(token)).then((d) => {
      if (!song) return
      setDieuKien(d)
      setDangTaiDk(false)
    })
    return () => { song = false }
  }, [token, lamMoiDk])
  useEffect(() => xoaSom, []) // rời màn ⇒ bỏ lệnh sớm chưa ai nhận
  const doiLuyenDe = useCallback(() => setLamMoiDk((n) => n + 1), [])
  const [nguon, setNguon] = useState<NguonTuLuyen | null>(null)
  const [loiNguon, setLoiNguon] = useState('')
  const [dangTaiNguon, setDangTaiNguon] = useState(true)
  const [cheDo, setCheDo] = useState<CheDoTuLuyen | null>(null)
  const [bai, setBai] = useState<BaiDangLam | null>(() => docNho(sbd))
  // Đang làm một lượt ⇒ app KHÔNG tự tải lại vì bản mới (quét ổn định 30/09, như Bi-a #95): bản mới chờ tới lúc em nộp/rời lượt.
  const coBai = bai !== null
  useEffect(() => (coBai ? giuTrangKhongTaiLai() : undefined), [coBai])
  const [ketQua, setKetQua] = useState<{ nop: KetQuaNop; cau: CauCongKhai[] } | null>(null)
  const [dangRut, setDangRut] = useState(false)
  const [dangNop, setDangNop] = useState(false)
  const [loi, setLoi] = useState('')
  const [lamMoiTongHop, setLamMoiTongHop] = useState(0)
  const [dangMoLuot, setDangMoLuot] = useState('')
  const [loiXemLuot, setLoiXemLuot] = useState('')
  // Số liệu nhanh cho thẻ "Tổng hợp" + từng chế độ ở màn chọn NGANG / MÁY TÍNH (một lượt đọc, cùng lệnh thẻ Tổng hợp dùng). Màn dọc không tải.
  const [tomTat, setTomTat] = useState<TomTatTongHop | null>(null)
  const [soDeLd, setSoDeLd] = useState(0)
  useEffect(() => {
    let song = true
    void taiTongHop(token).then((r) => { if (song && r.ok) { setTomTat(tongHopTuLuyen(r.du.luot, r.du.cau, Date.now())); setSoDeLd(r.du.luyenDe.length) } })
    return () => { song = false }
  }, [token, lamMoiTongHop])
  const [chamTungCau, setChamTungCau] = useState(docChamTungCau)
  const [dangCham, setDangCham] = useState('')

  // tham số từng chế độ
  const [soCau1, setSoCau1] = useState(SO_CAU_MAC_DINH)
  // Chế độ 1 — nguồn câu sai em tick (30/09); nhớ theo máy.
  const [nguon1, setNguon1] = useState<Set<MaNguonSai>>(new Set())
  const [soCau2, setSoCau2] = useState(SO_CAU_MAC_DINH)
  const [lop3, setLop3] = useState('')
  const [bai3, setBai3] = useState('')
  const [dang3, setDang3] = useState<Set<string>>(new Set())
  const [soCau3, setSoCau3] = useState(SO_CAU_MAC_DINH)
  const [mucDo4, setMucDo4] = useState<Set<string>>(new Set(['ngau_nhien']))
  const [soCau4, setSoCau4] = useState(SO_CAU_MAC_DINH)
  const [xt, setXt] = useState<{ khoa: string; tong: number; loi: string; thongKe: { tenDang: string; soCauSai: number; soUngVien: number }[]; dang: boolean; nguonDang?: NguonDangEm | null } | null>(null)

  const napNguon = useCallback(async () => {
    setDangTaiNguon(true)
    setLoiNguon('')
    const r = await (somNguon.nhan(token) ?? taiNguon(token))
    setDangTaiNguon(false)
    if (!r.ok) { setLoiNguon(r.loi); return }
    setNguon(r.du)
    setSoCau1(Math.min(SO_CAU_MAC_DINH, Math.max(1, 2 * (r.du.khoCauSai?.tong ?? r.du.soCauSai))))
    if (r.du.khoCauSai?.theoNguon) setNguon1(chonMacDinh(r.du.khoCauSai.theoNguon, docNhoNguon(sbd)))
    const l = r.du.danhMuc[r.du.danhMuc.length - 1] // danh mục đã lọc theo khối em, xếp tăng ⇒ lớp cuối = khối em
    if (l) {
      setLop3(l.lop)
      const b = l.bais[0]
      if (b) { setBai3(b.tenBai); setDang3(new Set(b.dangs[0] ? [b.dangs[0].ma] : [])) }
    }
  }, [token, sbd])
  useEffect(() => { void napNguon() }, [napNguon])

  // ---- tham số gửi máy chủ cho chế độ đang chọn
  const thamSo = useMemo<ThamSoRut | null>(() => {
    // Luật 30/09: máy chủ tự gom kho câu sai từ 29/09; `dsMaCa` chỉ để máy chủ bản cũ (trước khi đẩy Worker mới) vẫn rút được.
    // Chọn nguồn (30/09): chỉ gửi `nguon` khi máy chủ đã trả đếm theo nguồn (máy chủ bản cũ ⇒ rút cả kho như trước).
    if (cheDo === 1) return { cheDo: 1, soCau: soCau1, dsMaCa: nguon?.cacCa.map((c) => c.maCa) ?? [], ...(nguon?.khoCauSai?.theoNguon ? { nguon: [...nguon1] } : {}) }
    if (cheDo === 2) return { cheDo: 2, soCau: soCau2 }
    if (cheDo === 3) return { cheDo: 3, dsDang: [...dang3], soCau: soCau3 }
    if (cheDo === 4) return { cheDo: 4, mucDo: [...mucDo4], soCau: soCau4 }
    return null
  }, [cheDo, soCau1, nguon, nguon1, soCau2, dang3, soCau3, mucDo4, soCau4])
  // Khoá xem trước KHÔNG gồm số câu (đổi thanh chọn không phải hỏi lại máy chủ).
  const khoaXt = useMemo(() => {
    if (cheDo === 2) return '2|kho-chung'
    if (cheDo === 3) return `3|${[...dang3].sort().join(',')}`
    if (cheDo === 4) return `4|${[...mucDo4].sort().join(',')}`
    return ''
  }, [cheDo, dang3, mucDo4])

  useEffect(() => {
    if (!khoaXt || !thamSo) return
    if (cheDo === 3 && dang3.size === 0) { setXt({ khoa: khoaXt, tong: 0, loi: 'Em chọn ít nhất 1 dạng bài.', thongKe: [], dang: false }); return }
    let conSong = true
    setXt((x) => ({ khoa: khoaXt, tong: x?.khoa === khoaXt ? x.tong : 0, loi: '', thongKe: x?.thongKe ?? [], dang: true, nguonDang: x?.khoa === khoaXt ? x.nguonDang : null }))
    const hen = setTimeout(async () => {
      const r = await xemTruoc(token, thamSo)
      if (!conSong) return
      if (!r.ok) { setXt({ khoa: khoaXt, tong: 0, loi: r.loi, thongKe: [], dang: false }); return }
      setXt({ khoa: khoaXt, tong: r.du.tongToiDa, loi: r.du.loi, thongKe: r.du.thongKe, dang: false, nguonDang: r.du.nguonDang })
      if (cheDo === 2) setSoCau2((t) => kepSoCauCheDo2(t, r.du.tongToiDa, Math.max(1, r.du.thongKe.reduce((n, x) => n + x.soCauSai, 0))))
      if (cheDo === 3) setSoCau3((t) => kepSoCauCheDo3(t, r.du.tongToiDa))
      if (cheDo === 4) setSoCau4((t) => kepSoCauCheDo4(t, r.du.tongToiDa))
    }, 250)
    return () => { conSong = false; clearTimeout(hen) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoaXt, token])

  // ---- đồng hồ bài đang làm. Đếm trong REF (không setState mỗi giây ⇒ danh sách thẻ câu KHÔNG vẽ lại mỗi giây — máy yếu);
  // chỉ ô đồng hồ nhỏ (`DongHo`) tự vẽ lại. Bài dở ghi xuống máy khi em chọn đáp án và mỗi 15 giây.
  const cauDangNhin = useRef<string>('')
  const giayRef = useRef(0)
  const giayCauRef = useRef<Record<string, number>>({})
  const baiRef = useRef<BaiDangLam | null>(bai)
  baiRef.current = bai
  const luuDo = useCallback(() => {
    const b = baiRef.current
    if (b) ghiNho(sbd, { ...b, giay: giayRef.current, giayCau: { ...giayCauRef.current } })
  }, [sbd])
  useEffect(() => {
    if (!bai || ketQua) return
    giayRef.current = bai.giay
    giayCauRef.current = { ...bai.giayCau }
    let dem = 0
    const t = setInterval(() => {
      giayRef.current++
      const q = cauDangNhin.current
      if (q) giayCauRef.current[q] = (giayCauRef.current[q] ?? 0) + 1
      if (++dem % 15 === 0) luuDo()
    }, 1000)
    return () => clearInterval(t)
  }, [bai?.luotId, ketQua]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!ketQua && bai) luuDo() }, [bai?.traLoi, bai?.coGoiY, bai?.luotId, ketQua, luuDo]) // eslint-disable-line react-hooks/exhaustive-deps

  const batDau = async (ts: ThamSoRut | null = thamSo) => {
    if (!ts) return
    setDangRut(true)
    setLoi('')
    const r = await rutCau(token, ts)
    setDangRut(false)
    if (!r.ok) { setLoi(r.loi); return }
    setKetQua(null)
    setBai({ ...r.du, traLoi: {}, giay: 0, giayCau: {}, coGoiY: [], chamTungCau, daCham: {} })
    window.scrollTo?.({ top: 0 })
  }

  const traLoi = (qid: string, v: string) => {
    cauDangNhin.current = qid
    // Câu đã "Kiểm tra" là KHOÁ (máy chủ cũng khoá) — phím tắt / phiếu trả lời không đổi được.
    setBai((b) => (b && !b.daCham?.[qid] ? { ...b, traLoi: { ...b.traLoi, [qid]: v } } : b))
  }

  /** CHẤM TỪNG CÂU: gửi đúng một câu lên máy chủ; nhận kết quả + lời giải của riêng câu đó. */
  const kiemTra = async (qid: string) => {
    const b = baiRef.current
    if (!b || dangCham || b.daCham?.[qid]) return
    setDangCham(qid)
    setLoi('')
    const r = await chamCau(token, b.luotId, qid, b.traLoi[qid] ?? '')
    setDangCham('')
    if (!r.ok) { setLoi(r.loi); return }
    setBai((x) => (x && x.luotId === b.luotId ? { ...x, daCham: { ...(x.daCham ?? {}), [qid]: r.du } } : x))
  }
  /** "Câu tiếp": cuộn tới câu CHƯA kiểm tra kế sau (hết thì về câu chưa kiểm tra đầu tiên, rồi nút Nộp). */
  const cauTiep = (qid: string) => {
    const b = baiRef.current
    if (!b) return
    const i = b.cau.findIndex((c) => c.qid === qid)
    const sau = [...b.cau.slice(i + 1), ...b.cau.slice(0, i)].find((c) => !b.daCham?.[c.qid])
    if (sau) { cauDangNhin.current = sau.qid; cuonToiCau(domIdLam(sau.qid)); return }
    document.querySelector<HTMLButtonElement>('.tlu-nut-nop-bai')?.focus()
  }

  const nop = async () => {
    if (!bai) return
    const conTrong = bai.cau.filter((c) => !bai.daCham?.[c.qid] && !daTraLoi(c, bai.traLoi[c.qid])).length
    const daKiemHet = !!bai.chamTungCau && bai.cau.every((c) => bai.daCham?.[c.qid])
    const dongY = await hoiXacNhan({
      tieuDe: daKiemHet ? 'Xem tổng kết lượt này?' : 'Nộp bài tu luyện?',
      noiDung: daKiemHet ? 'Em đã kiểm tra hết các câu. Nộp để lưu lượt này và xem tổng kết. Lượt tự luyện được theo dõi riêng.' : conTrong > 0 ? `Em còn ${conTrong} câu chưa làm — câu bỏ trống tính là sai. Nộp xong em xem ngay đáp án và lời giải. Lượt tự luyện được theo dõi riêng.` : 'Nộp xong em xem ngay đáp án và lời giải từng câu. Lượt tự luyện được theo dõi riêng.',
      nhanDongY: 'Nộp bài',
      nhanKhong: 'Làm tiếp',
      vo: 'm3',
    })
    if (!dongY) return
    setDangNop(true)
    setLoi('')
    const r = await nopBai(token, bai.luotId, bai.traLoi, giayRef.current, { ...giayCauRef.current }, bai.coGoiY)
    setDangNop(false)
    if (!r.ok) { setLoi(r.loi); return }
    // 30/09: máy chủ bỏ câu tự luận khỏi kết quả (không chấm, không tính sai) ⇒ màn kết quả chỉ hiện câu được chấm.
    const coKq = new Set(r.du.cau.map((k) => k.qid))
    setKetQua({ nop: r.du, cau: r.du.cau.length ? bai.cau.filter((c) => coKq.has(c.qid)) : bai.cau })
    ghiNho(sbd, null)
    setLamMoiTongHop((n) => n + 1)
    window.scrollTo?.({ top: 0 })
  }

  const boBai = async () => {
    const dongY = await hoiXacNhan({ tieuDe: 'Bỏ bài đang làm?', noiDung: 'Các câu em đã chọn sẽ mất, lượt này không được chấm. Em có thể rút bài mới bất cứ lúc nào.', nhanDongY: 'Bỏ bài', nhanKhong: 'Làm tiếp', nguyHiem: true, vo: 'm3' })
    if (!dongY) return
    ghiNho(sbd, null)
    setBai(null)
  }

  const veChon = () => { setBai(null); setKetQua(null); setLoi('') }

  // ================================================================== KẾT QUẢ
  if (ketQua) return <ManKetQua boCuc={boCuc} kq={ketQua.nop} cau={ketQua.cau} token={token} onVe={onVe} onLuyenTiep={() => { setKetQua(null); setBai(null); setThePhu('luyen') }} onTongHop={() => { veChon(); setThePhu('tong-hop') }} />

  // ================================================================== ĐANG LÀM
  if (bai) {
    const daLam = bai.cau.filter((c) => bai.daCham?.[c.qid] || daTraLoi(c, bai.traLoi[c.qid])).length
    const theCau = bai.cau.map((c, i) => {
      const kq = bai.daCham?.[c.qid]
      return (
        <article key={c.qid} id={`tlu-lam-${c.qid}`} className="tlu-the-cau m3" data-dung={kq ? (kq.dung ? 'true' : 'false') : undefined} onFocusCapture={() => { cauDangNhin.current = c.qid }} onPointerDown={() => { cauDangNhin.current = c.qid }}>
          <div className="tlu-the-cau-dau">
            <span className="tlu-so-cau">Câu {i + 1}</span>
            {kq ? <span className="tlu-nhan" data-kieu={kq.dung ? 'dung' : 'sai'}>{kq.dung ? 'Đúng' : c.phan === 'II' && kq.yDung ? `Đúng ${kq.yDung}/4 ý` : 'Sai'}</span> : <span className="tlu-nhan">{NHAN_PHAN_TU_LUYEN[c.phan]}</span>}
            {c.sao > 0 && <span className="tlu-nhan" data-kieu="sao">{c.sao} sao</span>}
            {c.tenDang && <span className="tlu-nhan tlu-nhan-dang">{c.tenDang}</span>}
            <NhanLuyen c={kq ? { ...c, conMotLan: undefined } : c} />
          </div>
          {kq ? (
            kq.anDapAn ? <p className="tlu-ghi">Câu này vừa vào một ca kiểm tra chưa công bố — đáp án và lời giải hiện lại sau khi thầy công bố điểm.</p> : <TheCauXem cau={c} kq={kq} stt={i + 1} onHoi={() => setBai((b) => (b && !b.coGoiY.includes(c.qid) ? { ...b, coGoiY: [...b.coGoiY, c.qid] } : b))} />
          ) : (
            <TheCauLam cau={c} stt={i + 1} giaTri={bai.traLoi[c.qid]} onDoi={(v) => traLoi(c.qid, v)} />
          )}
          {kq?.khacPhuc && <p className="tlu-khac-phuc" data-dung={kq.dung ? 'true' : 'false'} role="status">{kq.khacPhuc}</p>}
          {bai.chamTungCau && (
            <div className="tlu-kiem-tra">
              {kq ? (
                <button type="button" className="tlu-nut-phu" onClick={() => cauTiep(c.qid)}>Câu tiếp</button>
              ) : (
                <button type="button" className="tlu-nut-phu tlu-nut-kiem" disabled={!daTraLoi(c, bai.traLoi[c.qid]) || !!dangCham} onClick={() => void kiemTra(c.qid)}>
                  {dangCham === c.qid ? 'Đang chấm…' : 'Kiểm tra câu này'}
                </button>
              )}
            </div>
          )}
        </article>
      )
    })
    const daKiem = bai.chamTungCau ? bai.cau.filter((c) => bai.daCham?.[c.qid]).length : 0
    const nutNop = (
      <button type="button" className="tlu-nut-chinh tlu-nut-nop-bai" onClick={nop} disabled={dangNop}>
        {dangNop ? 'Đang chấm…' : 'Nộp bài'}
      </button>
    )
    const dauLam = (
      <div className="tlu-hang">
        <button type="button" className="tlu-ve" aria-label="Bỏ bài, về chọn chế độ" onClick={boBai}><IconVe /></button>
        <div className="tlu-tieu-khoi">
          <h1 className="tlu-tieu tlu-tieu-nho">{bai.tieuDe || TEN_CHE_DO[bai.cheDo]}</h1>
          <p className="tlu-phu">Tu luyện · {TEN_CHE_DO[bai.cheDo]}{bai.chamTungCau ? ` · chấm từng câu (${daKiem}/${bai.cau.length} câu đã kiểm tra)` : ''}</p>
        </div>
      </div>
    )
    if (boCuc !== 'doc') {
      return (
        <div className="tlu tlu-rong" data-chang="lam" data-bo-cuc={boCuc}>
          <KhungLamRong
            boCuc={boCuc}
            dau={dauLam}
            nhom={nhomTheoPhan(bai.cau, bai.traLoi)}
            domId={domIdLam}
            gocCuon={null}
            dongHo={<b className="tlu-ben-lon"><DongHo giayRef={giayRef} /></b>}
            nhanDongHo="Thời gian làm"
            daLam={daLam}
            tong={bai.cau.length}
            loi={loi ? <p className="tlu-loi-nho" role="alert">{loi}</p> : null}
            nutNop={nutNop}
            onChon={traLoi}
          >
            <div className="tlu-ds-cau">{theCau}</div>
          </KhungLamRong>
        </div>
      )
    }
    return (
      <div className="tlu" data-chang="lam">
        <header className="tlu-dau tlu-dau-lam">
          {dauLam}
          <div className="tlu-tien-do" role="progressbar" aria-label="Số câu đã làm" aria-valuemin={0} aria-valuemax={bai.cau.length} aria-valuenow={daLam}>
            <span style={{ transform: `scaleX(${bai.cau.length ? daLam / bai.cau.length : 0})` }} />
          </div>
        </header>
        <main className="tlu-than tlu-ds-cau">{theCau}</main>
        <footer className="tlu-thanh-nop">
          <div className="tlu-thanh-nop-trong">
            <div className="tlu-thanh-so">
              <b className="tlu-so-lon">{daLam}/{bai.cau.length}</b>
              <span>câu đã làm · <DongHo giayRef={giayRef} /></span>
            </div>
            {loi && <p className="tlu-loi-nho" role="alert">{loi}</p>}
            {nutNop}
          </div>
        </footer>
      </div>
    )
  }

  // ================================================================== CHỌN CHẾ ĐỘ
  const khoa = !!nguon?.dangThi
  const lopHT = nguon?.danhMuc.find((l) => l.lop === lop3)
  const baiHT = lopHT?.bais.find((b) => b.tenBai === bai3)
  const tongXt = xt && xt.khoa === khoaXt ? xt : null
  // Chế độ 1 (luật 30/09): kho câu sai từ 29/09 do máy chủ gom (máy chủ bản cũ chưa gửi ⇒ tạm dùng tổng câu sai của các ca).
  const khoSai = nguon?.khoCauSai ?? null
  const n1Kho = khoSai ? khoSai.tong : nguon?.soCauSai ?? 0
  // n1 = số câu DUY NHẤT trong các nguồn em tick — tính ngay trên máy từ bảng mặt nạ nguồn, không hỏi lại máy chủ.
  const theoNguon1 = khoSai?.theoNguon ?? null
  const n1 = theoNguon1 && khoSai ? demChon(khoSai.theoMat, nguon1) : n1Kho
  const chuaChonNguon = !!theoNguon1 && n1Kho > 0 && nguon1.size === 0
  const tran1 = Math.min(100, 2 * n1)
  const soCauChon = cheDo === 1 ? Math.min(soCau1, tran1) : cheDo === 2 ? soCau2 : cheDo === 3 ? soCau3 : soCau4
  const coTheBatDau = !!cheDo && !khoa && !dangRut && (cheDo === 1 ? n1 > 0 && soCauChon > 0 : !!tongXt && !tongXt.dang && tongXt.tong > 0 && soCauChon > 0)
  // Bộ đếm khắc phục (máy chủ bản cũ không gửi ⇒ tongTuMoc = số câu trong kho, đã khắc phục 0).
  const tongKp = khoSai?.tongTuMoc ?? n1Kho
  const daKp = khoSai?.daKhacPhuc ?? 0
  // Dạng nên luyện khi chưa có câu sai (nút gợi ý của chế độ 1): có trong danh mục Dạng bài ⇒ rút Dạng bài; không ⇒ sang Dạng câu sai.
  const nenLuyen = nguon?.dangNenLuyen ?? null
  const oNenLuyen = nenLuyen && nguon ? timDangTrongDanhMuc(nguon.danhMuc, nenLuyen.ma, nenLuyen.ten) : null

  /** v3 — KHÔNG khoá vì kho câu sai trống (máy chủ tự dự phòng). Chỉ khoá khi máy chủ báo thật sự không thể (vd tài khoản chưa có lớp). */
  const khoaCheDo = (m: CheDoTuLuyen): string => {
    if (!nguon) return ''
    if (m === 2 && nguon.dangCauSai?.loi) return nguon.dangCauSai.loi
    if (m === 4 && nguon.tuDo?.loi) return nguon.tuDo.loi
    if (m === 3 && nguon.danhMuc.length === 0) return nguon.loiDanhMuc || 'Kho chưa có dạng bài'
    return ''
  }
  /** Dòng phụ trên thẻ: nguồn đang dùng (chế độ 2, 4) / trạng thái kho (chế độ 1). */
  const phuThe = (m: CheDoTuLuyen): string => {
    if (m === 1 && nguon && n1Kho === 0) return tongKp > 0 ? `Em đã khắc phục hết ${tongKp} câu sai từ 29/09` : 'Em chưa sai câu nào từ 29/09'
    if (m === 2 && nguon?.dangCauSai?.nhan) return nguon.dangCauSai.nhan
    if (m === 4 && nguon?.tuDo?.nhan) return nguon.tuDo.nhan
    return MO_TA[m].phu
  }

  const thanhChon = (gt: number, dat: (n: number) => void, min: number, max: number) => (
    <div className="tlu-thanh-chon">
      <div className="tlu-thanh-chon-dau">
        <label htmlFor="tlu-so-cau">Số câu</label>
        <b className="tlu-tab">{gt} <span>/ tối đa {max}</span></b>
      </div>
      <input id="tlu-so-cau" type="range" min={Math.min(min, max)} max={Math.max(1, max)} step={1} value={gt} disabled={max <= 0} onChange={(e) => dat(Number(e.target.value))} />
    </div>
  )
  const nhanXt = tongXt?.dang ? <p className="tlu-ghi" role="status">Đang đếm câu trong kho…</p> : tongXt?.loi ? <p className="tlu-ghi" data-kieu="loi">{tongXt.loi}</p> : null
  const nguonXt = (tongXt?.nguonDang?.nhan ? tongXt.nguonDang : null) ?? (cheDo === 2 ? nguon?.dangCauSai : cheDo === 4 ? nguon?.tuDo : null) ?? null
  const GIAI_NGUON: Record<string, string> = {
    cau_sai: 'Lấy từ kho câu sai của em từ 29/09 (ca kiểm tra, chiến dịch, Luyện đề, Tu luyện).',
    yeu: 'Em chưa có câu sai từ 29/09 — lấy các dạng em làm đúng ít nhất (mỗi dạng đã làm ít nhất 3 lần).',
    chuong: 'Em chưa có câu sai và chưa đủ số liệu — lấy các dạng của chương em đang học trong chiến dịch.',
    pho_bien: 'Em chưa có câu sai và chưa có chiến dịch — lấy các dạng có nhiều câu nhất của lớp em.',
    toan_kho: 'Em chưa có câu sai từ 29/09 — rút từ toàn kho lớp em.',
  }
  const oNguon = nguonXt?.nhan ? (
    <div className="tlu-nguon" role="status">
      <span className="tlu-nhan" data-kieu={nguonXt.kieu === 'cau_sai' ? 'luyen' : 'du-phong'}>{nguonXt.nhan}</span>
      {GIAI_NGUON[nguonXt.kieu] && <span className="tlu-ghi">{GIAI_NGUON[nguonXt.kieu]}</span>}
    </div>
  ) : null
  const congTac = (
    <label className="tlu-cong-tac">
      <input type="checkbox" role="switch" checked={chamTungCau} aria-checked={chamTungCau} onChange={(e) => { setChamTungCau(e.target.checked); ghiChamTungCau(e.target.checked) }} />
      <span className="tlu-cong-tac-chu">
        <b>Chấm từng câu</b>
        <span>{chamTungCau ? 'Bấm Kiểm tra sau mỗi câu — biết đúng sai và xem lời giải ngay.' : 'Tắt: làm hết rồi nộp cả lượt.'}</span>
      </span>
    </label>
  )

  // Hai cột khi màn rộng: TRÁI = chọn nguồn (ca / lớp–bài–dạng / loại câu), PHẢI = số câu + nút bắt đầu. Màn dọc: hai khối `display: contents` ⇒ y như cũ.
  const bangCheDo = cheDo && (
    <section className="tlu-cau-hinh" aria-label={`Cài đặt ${TEN_CHE_DO[cheDo]}`}>
      <div className="tlu-ch-trai">
        {rong && <p className="tlu-ch-ten"><span className="tlu-ch-icon" data-che-do={cheDo}><IconCheDo cheDo={cheDo} /></span>{TEN_CHE_DO[cheDo]}</p>}
        {cheDo === 1 && n1Kho === 0 && nguon && (
          <div className="tlu-chuc-mung" role="status">
            <b className="baloo">{tongKp > 0 ? `Em đã khắc phục hết ${tongKp} câu sai!` : 'Em chưa sai câu nào từ 29/09!'}</b>
            <p>{tongKp > 0 ? 'Kho câu sai của em đang trống. Câu nào em làm sai sau này sẽ tự vào đây để luyện lại.' : 'Làm tốt lắm. Câu nào em làm sai ở ca kiểm tra, chiến dịch, Luyện đề hay Tu luyện sẽ tự vào đây để luyện lại.'}</p>
            <DemKhacPhuc da={daKp} tong={tongKp} />
            {oNenLuyen ? (
              <button type="button" className="tlu-nut-chinh" onClick={() => {
                setLop3(oNenLuyen.lop); setBai3(oNenLuyen.tenBai); setDang3(new Set([oNenLuyen.dang.ma])); setSoCau3(SO_CAU_MAC_DINH)
                setCheDo(3)
              }}>Luyện dạng {oNenLuyen.dang.ten}</button>
            ) : (
              <button type="button" className="tlu-nut-chinh" onClick={() => setCheDo(2)}>{nenLuyen ? `Luyện dạng ${nenLuyen.ten}` : 'Luyện dạng nên luyện'}</button>
            )}
          </div>
        )}
        {cheDo === 1 && n1Kho > 0 && (
          <>
            <h2 className="tlu-muc">Kho câu sai của em</h2>
            <div className="tlu-kho-sai" role="status" aria-live="polite">
              <b className="baloo tlu-tab">{n1}</b>
              <span className="tlu-kho-sai-chu">
                <span>{theoNguon1 ? 'câu sai trong nguồn em chọn' : 'câu sai còn phải sửa'}</span>
                {theoNguon1 && <span className="tlu-tab tlu-kho-sai-them">Kho câu sai của em: {n1Kho} câu</span>}
                {khoSai && !theoNguon1 && (
                  <span className="tlu-tab">
                    {[`${khoSai.tuCa} từ ca kiểm tra`, `${khoSai.tuChienDich} từ chiến dịch`, khoSai.tuLuyenDe ? `${khoSai.tuLuyenDe} từ Luyện đề` : '', khoSai.tuTuLuyen ? `${khoSai.tuTuLuyen} từ Tu luyện` : ''].filter(Boolean).join(' · ')}
                  </span>
                )}
              </span>
            </div>
            {theoNguon1 && (
              <ChonNguonSai theoNguon={theoNguon1} chon={nguon1} onDoi={(s) => { setNguon1(s); ghiNhoNguon(sbd, s, theoNguon1) }} />
            )}
            <DemKhacPhuc da={daKp} tong={tongKp} />
            {!!khoSai?.toiHan && <p className="tlu-ghi" data-kieu="lap">{khoSai.toiHan} câu đã tới hẹn ôn lại — được lấy trước.</p>}
            <p className="tlu-ghi">Làm đúng một câu ⇒ hẹn gặp lại sau 1 ngày; đúng lần nữa vào ngày khác ⇒ câu đó được khắc phục và rời kho. Câu chưa luyện lấy trước, câu khó và dễ xếp xen kẽ. Bỏ câu tự luận.</p>
          </>
        )}
        {cheDo === 2 && (
          <>
            <h2 className="tlu-muc">Nguồn dạng</h2>
            {oNguon ?? <p className="tlu-ghi" role="status">Đang tìm dạng cho em…</p>}
            {tongXt && tongXt.thongKe.length > 0 && (
              <ul className="tlu-ds-dang-sai" aria-label="Dạng câu sai của em">
                {tongXt.thongKe.slice(0, 6).map((t) => (
                  <li key={t.tenDang}><span>{t.tenDang || 'Chưa gắn dạng'}</span><span className="tlu-tab">{nguonXt?.kieu === 'cau_sai' || !nguonXt ? `${t.soCauSai} câu sai` : `${t.soCauSai} câu mẫu`} · kho có {t.soUngVien} câu</span></li>
                ))}
              </ul>
            )}
          </>
        )}
        {cheDo === 3 && nguon && (
          <>
            <h2 className="tlu-muc">Lớp</h2>
            <div className="tlu-chip-hang" role="radiogroup" aria-label="Lớp">
              {nguon.danhMuc.map((l) => (
                <button key={l.lop} type="button" role="radio" aria-checked={lop3 === l.lop} className="tlu-chip" onClick={() => {
                  setLop3(l.lop)
                  const b = l.bais[0]
                  setBai3(b?.tenBai ?? '')
                  setDang3(new Set(b?.dangs[0] ? [b.dangs[0].ma] : []))
                }}>Lớp {l.lop}</button>
              ))}
            </div>
            <h2 className="tlu-muc"><label htmlFor="tlu-bai">Bài</label></h2>
            <div className="tlu-chon-bai">
              <select id="tlu-bai" value={bai3} onChange={(e) => {
                setBai3(e.target.value)
                const b = lopHT?.bais.find((x) => x.tenBai === e.target.value)
                setDang3(new Set(b?.dangs[0] ? [b.dangs[0].ma] : []))
              }}>
                {lopHT?.bais.map((b) => <option key={b.tenBai} value={b.tenBai}>{b.tenBai}</option>)}
              </select>
            </div>
            <h2 className="tlu-muc">Dạng bài <span className="tlu-muc-phu">chọn được nhiều dạng</span></h2>
            <div className="tlu-ds-chon">
              {baiHT?.dangs.map((d) => (
                <label key={d.ma} className="tlu-o-chon">
                  <input type="checkbox" checked={dang3.has(d.ma)} onChange={() => setDang3((s) => { const n = new Set(s); if (n.has(d.ma)) n.delete(d.ma); else n.add(d.ma); return n })} />
                  <span className="tlu-o-chon-chu">{d.ten}</span>
                </label>
              ))}
            </div>
          </>
        )}
        {cheDo === 4 && (
          <>
            {oNguon}
            <h2 className="tlu-muc">Loại câu</h2>
            <div className="tlu-chip-hang" role="group" aria-label="Loại câu">
              {LUA_CHON_TU_DO.map((m) => (
                <button key={m.id} type="button" aria-pressed={mucDo4.has(m.id)} className="tlu-chip" onClick={() => setMucDo4((prev) => {
                  // Đúng luật chọn của khối cũ: "Ngẫu nhiên" loại trừ mọi lựa chọn khác; bỏ hết ⇒ về "Ngẫu nhiên".
                  if (m.id === 'ngau_nhien') return new Set(['ngau_nhien'])
                  const s = new Set(prev)
                  s.delete('ngau_nhien')
                  if (s.has(m.id)) s.delete(m.id)
                  else s.add(m.id)
                  if (s.size === 0) s.add('ngau_nhien')
                  return s
                })}>{m.ten}</button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="tlu-ch-phai">
        {cheDo === 1 && n1Kho > 0 && (
          <>
            {thanhChon(soCauChon, setSoCau1, 1, tran1)}
            {chuaChonNguon ? (
              <p className="tlu-ghi" data-kieu="loi" role="status">Em chọn ít nhất 1 nguồn câu sai để bắt đầu.</p>
            ) : soCauChon > n1 ? (
              <p className="tlu-ghi" data-kieu="lap" role="status">Em chọn nhiều hơn {n1} câu trong nguồn đã chọn: sẽ có {soCauChon - n1} câu lặp lại trong lượt này.</p>
            ) : (
              <p className="tlu-ghi">Kéo quá {n1} câu nếu em muốn luyện lặp (mỗi câu tối đa 2 lần trong một lượt).</p>
            )}
          </>
        )}
        {cheDo === 2 && (
          <>
            {nhanXt}
            {thanhChon(soCau2, setSoCau2, 1, tongXt?.tong ?? 0)}
            <p className="tlu-ghi">Số câu mỗi dạng chia theo tỉ lệ câu em sai ở dạng đó.</p>
          </>
        )}
        {cheDo === 3 && nguon && (
          <>
            {nhanXt}
            {thanhChon(soCau3, setSoCau3, Math.min(5, tongXt?.tong ?? 5), Math.min(50, tongXt?.tong ?? 0))}
          </>
        )}
        {cheDo === 4 && (
          <>
            {nhanXt}
            {thanhChon(soCau4, setSoCau4, 1, Math.min(50, tongXt?.tong ?? 0))}
            <p className="tlu-ghi">{nguonXt?.kieu === 'toan_kho' ? 'Rút ngẫu nhiên từ toàn kho lớp em.' : 'Rút từ kho câu cùng chuyên đề với các câu em từng sai.'}</p>
          </>
        )}
        {!(cheDo === 1 && n1Kho === 0) && (
          <>
            {congTac}
            {loi && <p className="tlu-ghi" data-kieu="loi" role="alert">{loi}</p>}
            <button type="button" className="tlu-nut-chinh tlu-nut-rong" disabled={!coTheBatDau} onClick={() => batDau()}>
              {dangRut ? 'Đang rút câu…' : cheDo === 1 && chuaChonNguon ? 'Chọn nguồn để luyện' : cheDo === 1 ? `Luyện ${soCauChon} câu sai` : `Bắt đầu luyện · ${soCauChon} câu`}
            </button>
          </>
        )}
      </div>
    </section>
  )

  /** Số liệu nhanh có nhãn trên thẻ (chỉ màn ngang / máy tính). */
  const soLieuThe = (m: CheDoTuLuyen): { so: string; nhan: string }[] => {
    const daLuyen = tomTat?.theoCheDo[m]
    const luot = daLuyen && daLuyen.soLuot > 0 ? [{ so: pt(daLuyen.tiLe), nhan: `đúng · ${daLuyen.soLuot} lượt đã luyện` }] : []
    if (!nguon) return luot
    if (m === 1) return [{ so: String(n1Kho), nhan: 'câu sai còn phải sửa' }, ...luot]
    if (m === 2) return n1Kho > 0 ? [{ so: String(n1Kho), nhan: 'câu sai làm nguồn dạng' }, ...luot] : luot
    if (m === 3) {
      const soDang = nguon.danhMuc.reduce((t, l) => t + l.bais.reduce((u, b) => u + b.dangs.length, 0), 0)
      return [{ so: String(soDang), nhan: `dạng bài · ${nguon.danhMuc.length} lớp` }, ...luot]
    }
    return [{ so: '50', nhan: 'câu tối đa mỗi lượt' }, ...luot]
  }
  /** Chữ phụ + bộ đếm khắc phục trong thẻ Sửa câu sai. */
  const demTrenThe = (m: CheDoTuLuyen, gon: boolean) => (m === 1 && nguon ? <DemKhacPhuc da={daKp} tong={tongKp} gon={gon} /> : null)
  const ldDaNop = (dieuKien?.items ?? []).filter((x) => x.status === 'submitted' && typeof x.score === 'number') as { score: number }[]
  const ldKhoa = dieuKien?.trangThai === 'khoa'

  const luoiRong = (
    <div className="tlu-luoi-the">
      <div className="tlu-luoi-the-nhom" role="radiogroup" aria-label="Chọn cách luyện">
        {([1, 2, 3, 4] as CheDoTuLuyen[]).map((m) => {
          const lyDoKhoa = khoaCheDo(m)
          return (
            <button key={m} type="button" role="radio" aria-checked={cheDo === m} className="tlu-the-che-do tlu-the-lon" data-che-do={m} disabled={!!lyDoKhoa} onClick={() => { setCheDo(m); setLoi('') }}>
              <span className="tlu-the-hinh" aria-hidden="true"><IconCheDo cheDo={m} /></span>
              <span className="tlu-the-dau">
                <span className="tlu-the-che-do-icon"><IconCheDo cheDo={m} /></span>
                {lyDoKhoa && <span className="tlu-the-khoa"><IconKhoaNho />Đang khoá</span>}
              </span>
              <span className="tlu-the-che-do-chu">
                <span className="tlu-the-che-do-ten">{TEN_CHE_DO[m]}</span>
                <span className="tlu-the-che-do-phu">{lyDoKhoa || phuThe(m)}</span>
              </span>
              {demTrenThe(m, true)}
              <span className="tlu-the-so">
                {soLieuThe(m).map((x) => <span key={x.nhan} className="tlu-the-so-o"><b className="tlu-tab">{x.so}</b><span>{x.nhan}</span></span>)}
              </span>
            </button>
          )
        })}
      </div>
      <button type="button" className="tlu-the-che-do tlu-the-lon" data-che-do="th" onClick={() => setThePhu('tong-hop')}>
        <span className="tlu-the-hinh" aria-hidden="true"><IconTongHop /></span>
        <span className="tlu-the-dau"><span className="tlu-the-che-do-icon"><IconTongHop /></span></span>
        <span className="tlu-the-che-do-chu">
          <span className="tlu-the-che-do-ten">Tổng hợp</span>
          <span className="tlu-the-che-do-phu">Tỉ lệ đúng theo tuần, dạng mạnh nhất, dạng cần luyện thêm</span>
        </span>
        <span className="tlu-the-so">
          {tomTat && (tomTat.soCau > 0 || soDeLd > 0) ? (
            <>
              {tomTat.soCau > 0 && <span className="tlu-the-so-o"><b className="tlu-tab">{pt(tomTat.tiLe)}</b><span>câu đúng · {tomTat.soLuot} lượt đã nộp</span></span>}
              {soDeLd > 0 && <span className="tlu-the-so-o"><b className="tlu-tab">{soDeLd}</b><span>đề luyện cấu trúc đã nộp</span></span>}
            </>
          ) : (
            <span className="tlu-the-so-o"><span>{tomTat ? 'Chưa có lượt nào — nộp một lượt để xem' : 'Đang tải số liệu…'}</span></span>
          )}
          {tongKp > 0 && <span className="tlu-the-so-o"><b className="tlu-tab">{daKp}/{tongKp}</b><span>câu sai đã khắc phục</span></span>}
        </span>
      </button>
      <button type="button" className="tlu-the-che-do tlu-the-lon" data-che-do="ld" data-khoa={ldKhoa ? 'true' : 'false'} onClick={() => setThePhu('luyen-de')}>
        <span className="tlu-the-hinh" aria-hidden="true"><IconLuyenDeThe /></span>
        <span className="tlu-the-dau">
          <span className="tlu-the-che-do-icon"><IconLuyenDeThe /></span>
          {ldKhoa && <span className="tlu-the-khoa"><IconKhoaNho />Đang khoá</span>}
        </span>
        <span className="tlu-the-che-do-chu">
          <span className="tlu-the-che-do-ten">Luyện đề cấu trúc</span>
          <span className="tlu-the-che-do-phu">{ldKhoa ? dieuKien?.lyDo || 'Mục này đang khoá với em.' : '50 phút · 28 câu đúng cấu trúc đề Bộ'}</span>
        </span>
        <span className="tlu-the-so">
          {ldDaNop.length > 0 ? (
            <>
              <span className="tlu-the-so-o"><b className="tlu-tab">{ldDaNop.length}</b><span>đề đã nộp</span></span>
              <span className="tlu-the-so-o"><b className="tlu-tab">{ldDaNop[0]!.score.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}/10</b><span>điểm gần nhất</span></span>
            </>
          ) : (
            <span className="tlu-the-so-o"><span>{dangTaiDk ? 'Đang kiểm tra quyền…' : 'Chưa có đề nào đã nộp'}</span></span>
          )}
        </span>
      </button>
    </div>
  )

  return (
    <div className={rong ? 'tlu tlu-rong' : 'tlu'} data-chang="chon" data-bo-cuc={boCuc}>
      <header className="tlu-dau">
        <div className="tlu-hang">
          <button type="button" className="tlu-ve" aria-label="Về Hôm nay" onClick={onVe}><IconVe /></button>
          <div className="tlu-tieu-khoi">
            <h1 className="tlu-tieu baloo">Tu luyện</h1>
            <p className="tlu-phu">Luyện tự do · luyện theo nhu cầu</p>
          </div>
        </div>
        <div className="tlu-the-phu" data-so="3" role="tablist" aria-label="Tu luyện">
          <button type="button" role="tab" aria-selected={thePhu === 'luyen'} className="tlu-the-phu-nut" onClick={() => setThePhu('luyen')}>Luyện</button>
          <button type="button" role="tab" aria-selected={thePhu === 'tong-hop'} className="tlu-the-phu-nut" onClick={() => setThePhu('tong-hop')}>Tổng hợp</button>
          <button type="button" role="tab" aria-selected={thePhu === 'luyen-de'} className="tlu-the-phu-nut tlu-the-phu-ldct" data-khoa={dieuKien?.trangThai === 'khoa' ? 'true' : 'false'} onClick={() => setThePhu('luyen-de')}>
            {dieuKien?.trangThai === 'khoa' && <IconKhoaNho />}
            <span>Luyện đề cấu trúc</span>
            {dieuKien?.trangThai === 'khoa' && <span className="tlu-an">(đang khoá)</span>}
          </button>
        </div>
      </header>

      {thePhu === 'luyen-de' ? (
        <main className="tlu-than" key="ld">
          <Suspense fallback={<div className="tlu-luoi-che-do" role="status" aria-label="Đang mở Luyện đề cấu trúc"><div className="tlu-xuong" /><div className="tlu-xuong" /></div>}>
            <LuyenDeCauTruc token={token} sbd={sbd} dieuKien={dieuKien} dangTaiDieuKien={dangTaiDk} onDoi={doiLuyenDe} />
          </Suspense>
        </main>
      ) : thePhu === 'tong-hop' ? (
        <main className="tlu-than" key="th">
          {loiXemLuot && <p className="tlu-bao" data-kieu="loi" role="alert">{loiXemLuot}</p>}
          <TongHopTuLuyen
            token={token}
            lamMoi={lamMoiTongHop}
            danhMuc={nguon?.danhMuc ?? []}
            dangMoLuot={dangMoLuot}
            rong={rong}
            onMoLuyenDe={() => setThePhu('luyen-de')}
            luyenDeCu={dieuKien?.items ?? []}
            onXemLuot={async (id) => {
              setDangMoLuot(id)
              setLoiXemLuot('')
              const r = await xemLuot(token, id)
              setDangMoLuot('')
              if (!r.ok) { setLoiXemLuot(r.loi); return }
              setKetQua(r.du)
              window.scrollTo?.({ top: 0 })
            }}
            onLuyenDang={(lop, tenBai, ma) => {
              setLop3(lop); setBai3(tenBai); setDang3(new Set([ma])); setSoCau3(SO_CAU_MAC_DINH)
              setCheDo(3); setThePhu('luyen')
              void batDau({ cheDo: 3, dsDang: [ma], soCau: SO_CAU_MAC_DINH })
            }}
          />
        </main>
      ) : (
        <main className="tlu-than" key="luyen">
          <ChoChuaCuaEm token={token} />
          {khoa && <p className="tlu-bao" data-kieu="khoa" role="status">Em đang có ca kiểm tra mở nên Tu luyện tạm khoá. Làm xong ca kiểm tra rồi luyện tiếp nhé.</p>}
          {dangTaiNguon && !nguon ? (
            <div className="tlu-luoi-che-do" aria-busy="true" role="status" aria-label="Đang tải">
              {[1, 2, 3, 4].map((i) => <div key={i} className="tlu-xuong" />)}
            </div>
          ) : loiNguon && !nguon ? (
            <div className="tlu-bao" data-kieu="loi" role="alert">
              <p>{loiNguon}</p>
              <button type="button" className="tlu-nut-phu" onClick={() => void napNguon()}>Thử lại</button>
            </div>
          ) : (
            <>
              <h2 className="tlu-muc tlu-muc-dau">Chọn cách luyện</h2>
              {luoiRong}
              {cheDo ? bangCheDo : <p className="tlu-ghi tlu-ghi-giua">Chọn một cách luyện để bắt đầu. Làm xong em xem ngay đáp án, lời giải và tiến độ của mình ở thẻ Tổng hợp.</p>}
            </>
          )}
        </main>
      )}
    </div>
  )
}

const domIdLam = (qid: string) => `tlu-lam-${qid}`

/** Ô đồng hồ tự vẽ lại mỗi giây (đọc ref) — phần còn lại của màn không vẽ lại. */
function DongHo({ giayRef }: { giayRef: { current: number } }) {
  const [, setNhip] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setNhip((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])
  return <span className="tlu-tab" aria-label="Thời gian làm">{dongHo(giayRef.current)}</span>
}

/** Một câu ở chế độ LÀM: TheCau `thi` — không truyền `correct`/lời giải (máy em không có). */
function TheCauLam({ cau: c, stt, giaTri, onDoi }: { cau: CauCongKhai; stt: number; giaTri: string | undefined; onDoi: (v: string) => void }) {
  const chung = {
    cheDo: 'thi' as const,
    stt,
    id: `tlu-cau-${stt}`,
    text: chiSoDuoiRo(c.text),
    thanCauImg: c.anhThanCau,
    table: c.bang ?? undefined,
    hinhAnh: c.hinh as HinhAnh[] | undefined,
  }
  if (c.phan === 'I') {
    const v = String(giaTri ?? '')
    return (
      <TheCau
        {...chung}
        phan="I"
        choices={bon(c.luaChon, '').map(chiSoDuoiRo) as [string, string, string, string]}
        choiceImgs={c.anhLuaChon ? (bon(c.anhLuaChon, undefined) as [string?, string?, string?, string?]) : undefined}
        choicePerm={[0, 1, 2, 3]}
        selected={/^[A-D]$/.test(v) ? (v as Chu) : null}
        onSelect={(o) => onDoi(o)}
      />
    )
  }
  if (c.phan === 'II') {
    const mang = (giaTri || '----').padEnd(4, '-').slice(0, 4).split('')
    return (
      <TheCau
        {...chung}
        phan="II"
        ideas={bon(c.luaChon, '').map(chiSoDuoiRo) as [string, string, string, string]}
        ideaImgs={c.anhLuaChon ? (bon(c.anhLuaChon, undefined) as [string?, string?, string?, string?]) : undefined}
        selected={mang.map((x) => (x === 'D' || x === 'S' ? x : null)) as (DS | null)[]}
        onSelect={(j, v) => { const m = [...mang]; m[j] = v; onDoi(m.join('')) }}
      />
    )
  }
  return <TheCau {...chung} phan="III" selected={giaTri ?? ''} onChange={(t) => onDoi(t)} />
}

/** Một câu SAU NỘP: TheCau `xem_lai` — đáp án đúng (máy chủ chấm) + lời giải chuẩn. */
function TheCauXem({ cau: c, kq, stt, onHoi }: { cau: CauCongKhai; kq: KetQuaCau | undefined; stt: number; onHoi?: () => void }) {
  const chung = {
    cheDo: 'xem_lai' as const,
    // Hỏi thầy nằm trong khối lời giải của TheCau (thầy lệnh 30/09: chỉ hiện khi lời giải đang hiện).
    hoiThay: { qid: qidGoc(c.qid), nguon: 'tu_luyen', onHoi, gon: true },
    stt,
    text: chiSoDuoiRo(c.text),
    thanCauImg: c.anhThanCau,
    table: c.bang ?? undefined,
    hinhAnh: c.hinh as HinhAnh[] | undefined,
    loiGiai: kq?.loiGiai,
  }
  const tl = String(kq?.traLoi ?? '').trim().toUpperCase().replace(/Đ/g, 'D')
  const da = String(kq?.dapAn ?? '').trim().toUpperCase().replace(/Đ/g, 'D')
  if (c.phan === 'I') {
    return (
      <TheCau
        {...chung}
        phan="I"
        choices={bon(c.luaChon, '').map(chiSoDuoiRo) as [string, string, string, string]}
        choiceImgs={c.anhLuaChon ? (bon(c.anhLuaChon, undefined) as [string?, string?, string?, string?]) : undefined}
        choicePerm={[0, 1, 2, 3]}
        selected={/^[A-D]$/.test(tl) ? (tl as Chu) : null}
        correct={/^[A-D]$/.test(da) ? (da as Chu) : undefined}
      />
    )
  }
  if (c.phan === 'II') {
    const tach = (s: string) => s.replace(/[^DS-]/g, '').padEnd(4, '-').slice(0, 4).split('').map((x) => (x === 'D' || x === 'S' ? x : null)) as (DS | null)[]
    const dung = tach(da)
    return (
      <TheCau
        {...chung}
        phan="II"
        ideas={bon(c.luaChon, '').map(chiSoDuoiRo) as [string, string, string, string]}
        ideaImgs={c.anhLuaChon ? (bon(c.anhLuaChon, undefined) as [string?, string?, string?, string?]) : undefined}
        selected={tach(tl)}
        correct={dung.every((x) => x !== null) ? (dung as [DS, DS, DS, DS]) : undefined}
      />
    )
  }
  return <TheCau {...chung} phan="III" selected={kq?.traLoi ?? ''} correct={kq?.dapAn || undefined} />
}

function ManKetQua({ boCuc, kq, cau, token, onVe, onLuyenTiep, onTongHop }: { boCuc: BoCuc; kq: KetQuaNop; cau: CauCongKhai[]; token: string; onVe: () => void; onLuyenTiep: () => void; onTongHop: () => void }) {
  const [loc, setLoc] = useState<LocXem>('tat')
  const [coChua,setCoChua] = useState(false)
  useEffect(()=>{let song=true;void apiCoChua(token).then(x=>{if(song)setCoChua(x)});return()=>{song=false}},[token])
  const [chuaQid, setChuaQid] = useState<string | null>(null)
  const theoQid = useMemo(() => new Map(kq.cau.map((k) => [k.qid, k])), [kq])
  const tiLe = kq.soCau ? Math.round((100 * kq.soDung) / kq.soCau) : 0
  const ds = cau.map((c, i) => ({ c, i, k: theoQid.get(c.qid) })).filter((x) => loc === 'tat' || (loc === 'sai' ? !x.k?.dung : !!x.k?.dung))
  const chuVi = 2 * Math.PI * 44
  const rong = boCuc !== 'doc'
  const domId = (qid: string) => `tlu-kq-${qid}`
  const nhay = (qid: string) => {
    const k = theoQid.get(qid)
    if ((loc === 'sai' && k?.dung) || (loc === 'dung' && !k?.dung)) setLoc('tat')
    setTimeout(() => cuonToiCau(domId(qid)), 30)
  }

  const vong = (
    <span className="tlu-vong" role="img" aria-label={`Đúng ${kq.soDung} trên ${kq.soCau} câu`}>
      <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden="true" focusable="false">
        <circle cx="56" cy="56" r="44" className="tlu-vong-nen" strokeWidth="10" fill="none" />
        <circle cx="56" cy="56" r="44" className="tlu-vong-dat" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={`${((chuVi * tiLe) / 100).toFixed(1)} ${chuVi.toFixed(1)}`} transform="rotate(-90 56 56)" />
      </svg>
      <span className="tlu-vong-chu"><b className="baloo tlu-tab">{kq.soDung}/{kq.soCau}</b><span>câu đúng</span></span>
    </span>
  )
  const diem = (
    <section className="tlu-diem" aria-label="Kết quả lượt này">
      {vong}
      <dl className="tlu-diem-so">
        <div><dt>Điểm lượt này</dt><dd className="tlu-tab">{kq.diem.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} / 10</dd></div>
        <div><dt>Tỉ lệ đúng</dt><dd className="tlu-tab">{tiLe}%</dd></div>
        <div><dt>Thời gian làm</dt><dd className="tlu-tab">{chuThoiGian(kq.giay)}</dd></div>
      </dl>
      <p className="tlu-ghi">Luyện tự do giúp em củng cố kiến thức; kế hoạch được giao vẫn được theo dõi riêng.</p>
    </section>
  )
  const soSai = kq.soCau - kq.soDung
  const chip = (
    <div className="tlu-chip-hang" role="group" aria-label="Lọc câu">
      <button type="button" className="tlu-chip" aria-pressed={loc === 'tat'} onClick={() => setLoc('tat')}>Tất cả {kq.soCau} câu</button>
      <button type="button" className="tlu-chip" aria-pressed={loc === 'sai'} onClick={() => setLoc('sai')}>Câu sai · {soSai}</button>
      <button type="button" className="tlu-chip" aria-pressed={loc === 'dung'} onClick={() => setLoc('dung')}>Câu đúng · {kq.soDung}</button>
    </div>
  )
  const danhSach = (
    <div className="tlu-ds-cau">
      {ds.length === 0 && <p className="tlu-ghi tlu-ghi-giua">{loc === 'sai' ? 'Không có câu sai nào. Em làm tốt lắm!' : 'Chưa có câu đúng nào trong lượt này — xem lời giải ở thẻ Câu sai rồi luyện lượt mới nhé.'}</p>}
      {ds.map(({ c, i, k }) => (
        <article key={c.qid} id={domId(c.qid)} className="tlu-the-cau m3" data-dung={k?.dung ? 'true' : 'false'}>
          <div className="tlu-the-cau-dau">
            <span className="tlu-so-cau">Câu {i + 1}</span>
            <span className="tlu-nhan" data-kieu={k?.dung ? 'dung' : 'sai'}>{k?.dung ? 'Đúng' : c.phan === 'II' && k?.yDung ? `Đúng ${k.yDung}/4 ý` : 'Sai'}</span>
            {c.tenDang && <span className="tlu-nhan tlu-nhan-dang">{c.tenDang}</span>}
            <NhanLuyen c={c} />
          </div>
          {k?.anDapAn ? (
            <p className="tlu-ghi">Câu này vừa vào một ca kiểm tra chưa công bố — đáp án và lời giải hiện lại sau khi thầy công bố điểm.</p>
          ) : (
            <TheCauXem cau={c} kq={k} stt={i + 1} />
          )}
          {k?.khacPhuc && <p className="tlu-khac-phuc" data-dung={k.dung ? 'true' : 'false'}>{k.khacPhuc}</p>}
          {coChua && !k?.dung && !k?.anDapAn && (
            <button type="button" className="tlu-nut-chua" onClick={() => setChuaQid(c.qid)}>
              Sửa từng bước
            </button>
          )}
        </article>
      ))}
    </div>
  )
  if (chuaQid) {
    const cauSai = cau.find((c) => c.qid === chuaQid)
    return (
      <Suspense fallback={<div className="tlu" style={{ padding: '2rem', textAlign: 'center' }}>Đang tải…</div>}>
        <ManChuaCauSai
          token={token}
          qid={chuaQid}
          tenCau={cauSai ? `Câu ${(cau.indexOf(cauSai) + 1)} · ${cauSai.tenDang ?? ''}`.trim() : undefined}
          onVe={() => setChuaQid(null)}
        />
      </Suspense>
    )
  }
  const nut = (
    <div className="tlu-hang-nut">
      <button type="button" className="tlu-nut-chinh" onClick={onLuyenTiep}>Luyện lượt mới</button>
      <button type="button" className="tlu-nut-phu" onClick={onTongHop}>Xem tổng hợp</button>
    </div>
  )
  const dau = (
    <header className={rong ? 'tlu-dau tlu-dau-rong' : 'tlu-dau'}>
      <div className="tlu-hang">
        <button type="button" className="tlu-ve" aria-label="Về Hôm nay" onClick={onVe}><IconVe /></button>
        <div className="tlu-tieu-khoi">
          <h1 className="tlu-tieu tlu-tieu-nho">Kết quả tu luyện</h1>
          <p className="tlu-phu">{kq.tieuDe}</p>
        </div>
      </div>
    </header>
  )

  if (rong) {
    // Tóm tắt theo phần (biểu đồ thanh) + bản đồ câu: bên TRÁI dính; danh sách xem lại + lọc: bên PHẢI.
    const kieu = (c: CauCongKhai): 'dung' | 'sai' | 'trong' | 'mot_phan' => {
      const k = theoQid.get(c.qid)
      if (k?.dung) return 'dung'
      if (!String(k?.traLoi ?? '').replace(/-/g, '').trim()) return 'trong'
      return c.phan === 'II' && (k?.yDung ?? 0) > 0 ? 'mot_phan' : 'sai'
    }
    const nhom = PHAN.map((p) => ({ phan: p, ten: NHAN_PHAN_TU_LUYEN[p], cau: cau.flatMap((c, i) => (c.phan === p ? [{ id: c.qid, so: i + 1, kieu: kieu(c) }] : [])) }))
    return (
      <div className="tlu tlu-rong" data-chang="ket-qua" data-bo-cuc={boCuc}>
        {dau}
        <div className="tlu-kq-luoi">
          <aside className="tlu-kq-trai" aria-label="Tóm tắt kết quả">
            {diem}
            <section className="tlu-khoi" aria-labelledby="tlu-h-ban-do">
              <h2 id="tlu-h-ban-do" className="tlu-muc">Bản đồ câu <span className="tlu-muc-phu">bấm một ô để xem lại câu đó</span></h2>
              <BanDoKetQua nhom={nhom} onNhay={nhay} />
            </section>
            <section className="tlu-khoi" aria-labelledby="tlu-h-kq-phan">
              <h2 id="tlu-h-kq-phan" className="tlu-muc">Theo phần</h2>
              <ul className="tlu-ds-thanh">
                {nhom.filter((n) => n.cau.length).map((n) => {
                  const dung = n.cau.filter((c) => c.kieu === 'dung').length
                  return (
                    <li key={n.phan} className="tlu-hang-thanh">
                      <div className="tlu-hang-thanh-dau">
                        <span className="tlu-hang-thanh-nhan">Phần {n.phan} · {n.ten}</span>
                        <span className="tlu-tab tlu-hang-thanh-so">{dung}/{n.cau.length} câu đúng</span>
                      </div>
                      <span className="tlu-thanh" aria-hidden="true"><span style={{ transform: `scaleX(${n.cau.length ? dung / n.cau.length : 0})` }} /></span>
                    </li>
                  )
                })}
              </ul>
            </section>
            {nut}
          </aside>
          <main className="tlu-kq-phai" aria-label="Xem lại từng câu">
            <div className="tlu-kq-loc">{chip}</div>
            {danhSach}
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="tlu" data-chang="ket-qua">
      {dau}
      <main className="tlu-than">
        {diem}
        {chip}
        {danhSach}
        {nut}
      </main>
    </div>
  )
}

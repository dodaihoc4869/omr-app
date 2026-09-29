// MÀN TU LUYỆN (29/09, thầy chốt: "đặt ở sảnh bật lại 4 chế độ, giữ nguyên thuật toán của từng chế độ, thiết kế lại giao diện cho đẹp
// mắt hơn … giao diện làm bài đồng bộ với giao diện của app mới, hiển thị đáp án đúng chuẩn … không tính exp … có thêm tổng hợp đánh giá").
// Mở từ cửa "Tu luyện" trên Sảnh (SanhBanDo), nạp lười (StudentPortalScreen). Ba chặng: CHỌN chế độ → LÀM (TheCau chế độ `thi`, không đáp án)
// → KẾT QUẢ (máy chủ chấm; TheCau `xem_lai`: đáp án + lời giải chuẩn). Thẻ "Tổng hợp" ở đầu màn: tiến bộ của em (TongHopTuLuyen.tsx).
// Nền đêm cùng bộ với Sảnh / Câu đã làm; thẻ câu dưới `.m3` (bảng màu M3 dùng chung). Máy chủ: server/src/tu-luyen.ts.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TheCau from '../TheCau'
import NutHoiThay from '../loi-giai/NutHoiThay'
import { hoiXacNhan } from '../hop-thoai'
import '../m3'
import '../hoa2/phong-baloo'
import './tu-luyen.css'
import type { HinhAnh } from '../../data/examContent'
import { chiSoDuoiRo } from '../hoa2/cau-chuyen'
import {
  NHAN_PHAN_TU_LUYEN,
  SO_CAU_MAC_DINH,
  TEN_CHE_DO,
  chuThoiGian,
  kepSoCauCheDo2,
  kepSoCauCheDo3,
  kepSoCauCheDo4,
  type CauCongKhai,
  type CheDoTuLuyen,
  type KetQuaCau,
} from '../../lib/tu-luyen'
import { nopBai, rutCau, taiNguon, xemTruoc, type KetQuaNop, type LuotDangLam, type NguonTuLuyen, type ThamSoRut } from './api'
import TongHopTuLuyen from './TongHopTuLuyen'

export interface ManTuLuyenProps {
  token: string
  sbd: string
  onVe: () => void
}

type Chu = 'A' | 'B' | 'C' | 'D'
type DS = 'D' | 'S'

const MO_TA: Record<CheDoTuLuyen, { phu: string; y: string }> = {
  1: { phu: 'Làm lại đúng những câu em đã sai', y: 'Chọn ca kiểm tra đã công bố điểm' },
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

const bon = <T,>(a: T[] | null | undefined, lap: T): [T, T, T, T] => [a?.[0] ?? lap, a?.[1] ?? lap, a?.[2] ?? lap, a?.[3] ?? lap]
const daTraLoi = (c: CauCongKhai, v: string | undefined): boolean => {
  if (!v) return false
  if (c.phan === 'II') return v.replace(/[^DS]/g, '').length === 4
  return v.trim().length > 0
}
const dongHo = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

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
  if (cheDo === 1) return <svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M9 12l2 2 4-4" /></svg>
  if (cheDo === 2) return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><path d="M17.5 14v7M14 17.5h7" /></svg>
  if (cheDo === 3) return <svg {...p}><path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M8 7h7M8 11h5" /></svg>
  return <svg {...p}><path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" /></svg>
}

export default function ManTuLuyen({ token, sbd, onVe }: ManTuLuyenProps) {
  const [thePhu, setThePhu] = useState<'luyen' | 'tong-hop'>('luyen')
  const [nguon, setNguon] = useState<NguonTuLuyen | null>(null)
  const [loiNguon, setLoiNguon] = useState('')
  const [dangTaiNguon, setDangTaiNguon] = useState(true)
  const [cheDo, setCheDo] = useState<CheDoTuLuyen | null>(null)
  const [bai, setBai] = useState<BaiDangLam | null>(() => docNho(sbd))
  const [ketQua, setKetQua] = useState<{ nop: KetQuaNop; cau: CauCongKhai[] } | null>(null)
  const [dangRut, setDangRut] = useState(false)
  const [dangNop, setDangNop] = useState(false)
  const [loi, setLoi] = useState('')
  const [lamMoiTongHop, setLamMoiTongHop] = useState(0)

  // tham số từng chế độ
  const [caChon1, setCaChon1] = useState<Set<string>>(new Set())
  const [caChon2, setCaChon2] = useState<Set<string>>(new Set())
  const [soCau2, setSoCau2] = useState(SO_CAU_MAC_DINH)
  const [lop3, setLop3] = useState('')
  const [bai3, setBai3] = useState('')
  const [dang3, setDang3] = useState<Set<string>>(new Set())
  const [soCau3, setSoCau3] = useState(SO_CAU_MAC_DINH)
  const [mucDo4, setMucDo4] = useState<Set<string>>(new Set(['ngau_nhien']))
  const [soCau4, setSoCau4] = useState(SO_CAU_MAC_DINH)
  const [xt, setXt] = useState<{ khoa: string; tong: number; loi: string; thongKe: { tenDang: string; soCauSai: number; soUngVien: number }[]; dang: boolean } | null>(null)

  const napNguon = useCallback(async () => {
    setDangTaiNguon(true)
    setLoiNguon('')
    const r = await taiNguon(token)
    setDangTaiNguon(false)
    if (!r.ok) { setLoiNguon(r.loi); return }
    setNguon(r.du)
    const tatCa = new Set(r.du.cacCa.map((c) => c.maCa))
    setCaChon1(tatCa)
    setCaChon2(new Set(tatCa))
    const l = r.du.danhMuc[r.du.danhMuc.length - 1] // danh mục đã lọc theo khối em, xếp tăng ⇒ lớp cuối = khối em
    if (l) {
      setLop3(l.lop)
      const b = l.bais[0]
      if (b) { setBai3(b.tenBai); setDang3(new Set(b.dangs[0] ? [b.dangs[0].ma] : [])) }
    }
  }, [token])
  useEffect(() => { void napNguon() }, [napNguon])

  // ---- tham số gửi máy chủ cho chế độ đang chọn
  const thamSo = useMemo<ThamSoRut | null>(() => {
    if (cheDo === 1) return { cheDo: 1, dsMaCa: [...caChon1] }
    if (cheDo === 2) return { cheDo: 2, dsMaCa: [...caChon2], soCau: soCau2 }
    if (cheDo === 3) return { cheDo: 3, dsDang: [...dang3], soCau: soCau3 }
    if (cheDo === 4) return { cheDo: 4, mucDo: [...mucDo4], soCau: soCau4 }
    return null
  }, [cheDo, caChon1, caChon2, soCau2, dang3, soCau3, mucDo4, soCau4])
  // Khoá xem trước KHÔNG gồm số câu (đổi thanh chọn không phải hỏi lại máy chủ).
  const khoaXt = useMemo(() => {
    if (cheDo === 2) return `2|${[...caChon2].sort().join(',')}`
    if (cheDo === 3) return `3|${[...dang3].sort().join(',')}`
    if (cheDo === 4) return `4|${[...mucDo4].sort().join(',')}`
    return ''
  }, [cheDo, caChon2, dang3, mucDo4])

  useEffect(() => {
    if (!khoaXt || !thamSo) return
    if (cheDo === 3 && dang3.size === 0) { setXt({ khoa: khoaXt, tong: 0, loi: 'Em chọn ít nhất 1 dạng bài.', thongKe: [], dang: false }); return }
    if (cheDo === 2 && caChon2.size === 0) { setXt({ khoa: khoaXt, tong: 0, loi: 'Em tick chọn ít nhất một ca kiểm tra có câu sai.', thongKe: [], dang: false }); return }
    let conSong = true
    setXt((x) => ({ khoa: khoaXt, tong: x?.khoa === khoaXt ? x.tong : 0, loi: '', thongKe: x?.thongKe ?? [], dang: true }))
    const hen = setTimeout(async () => {
      const r = await xemTruoc(token, thamSo)
      if (!conSong) return
      if (!r.ok) { setXt({ khoa: khoaXt, tong: 0, loi: r.loi, thongKe: [], dang: false }); return }
      setXt({ khoa: khoaXt, tong: r.du.tongToiDa, loi: r.du.loi, thongKe: r.du.thongKe, dang: false })
      if (cheDo === 2) setSoCau2((t) => kepSoCauCheDo2(t, r.du.tongToiDa, caChon2.size))
      if (cheDo === 3) setSoCau3((t) => kepSoCauCheDo3(t, r.du.tongToiDa))
      if (cheDo === 4) setSoCau4((t) => kepSoCauCheDo4(t, r.du.tongToiDa))
    }, 250)
    return () => { conSong = false; clearTimeout(hen) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoaXt, token])

  // ---- đồng hồ bài đang làm
  const cauDangNhin = useRef<string>('')
  useEffect(() => {
    if (!bai || ketQua) return
    const t = setInterval(() => {
      setBai((b) => {
        if (!b) return b
        const q = cauDangNhin.current
        const moi = { ...b, giay: b.giay + 1, giayCau: q ? { ...b.giayCau, [q]: (b.giayCau[q] ?? 0) + 1 } : b.giayCau }
        return moi
      })
    }, 1000)
    return () => clearInterval(t)
  }, [bai?.luotId, ketQua]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!ketQua) ghiNho(sbd, bai) }, [bai, sbd, ketQua])

  const batDau = async (ts: ThamSoRut | null = thamSo) => {
    if (!ts) return
    setDangRut(true)
    setLoi('')
    const r = await rutCau(token, ts)
    setDangRut(false)
    if (!r.ok) { setLoi(r.loi); return }
    setKetQua(null)
    setBai({ ...r.du, traLoi: {}, giay: 0, giayCau: {}, coGoiY: [] })
    window.scrollTo?.({ top: 0 })
  }

  const traLoi = (qid: string, v: string) => {
    cauDangNhin.current = qid
    setBai((b) => (b ? { ...b, traLoi: { ...b.traLoi, [qid]: v } } : b))
  }

  const nop = async () => {
    if (!bai) return
    const conTrong = bai.cau.filter((c) => !daTraLoi(c, bai.traLoi[c.qid])).length
    const dongY = await hoiXacNhan({
      tieuDe: 'Nộp bài tu luyện?',
      noiDung: conTrong > 0 ? `Em còn ${conTrong} câu chưa làm — câu bỏ trống tính là sai. Nộp xong em xem ngay đáp án và lời giải. Tu luyện không tính EXP.` : 'Nộp xong em xem ngay đáp án và lời giải từng câu. Tu luyện không tính EXP.',
      nhanDongY: 'Nộp bài',
      nhanKhong: 'Làm tiếp',
      vo: 'm3',
    })
    if (!dongY) return
    setDangNop(true)
    setLoi('')
    const r = await nopBai(token, bai.luotId, bai.traLoi, bai.giay, bai.giayCau, bai.coGoiY)
    setDangNop(false)
    if (!r.ok) { setLoi(r.loi); return }
    setKetQua({ nop: r.du, cau: bai.cau })
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
  if (ketQua) return <ManKetQua kq={ketQua.nop} cau={ketQua.cau} onVe={onVe} onLuyenTiep={() => { setKetQua(null); setBai(null) }} onTongHop={() => { veChon(); setThePhu('tong-hop') }} />

  // ================================================================== ĐANG LÀM
  if (bai) {
    const daLam = bai.cau.filter((c) => daTraLoi(c, bai.traLoi[c.qid])).length
    return (
      <div className="tl" data-chang="lam">
        <header className="tl-dau tl-dau-lam">
          <div className="tl-hang">
            <button type="button" className="tl-ve" aria-label="Bỏ bài, về chọn chế độ" onClick={boBai}><IconVe /></button>
            <div className="tl-tieu-khoi">
              <h1 className="tl-tieu tl-tieu-nho">{bai.tieuDe || TEN_CHE_DO[bai.cheDo]}</h1>
              <p className="tl-phu">Tu luyện · {TEN_CHE_DO[bai.cheDo]} · không tính EXP</p>
            </div>
          </div>
          <div className="tl-tien-do" role="progressbar" aria-label="Số câu đã làm" aria-valuemin={0} aria-valuemax={bai.cau.length} aria-valuenow={daLam}>
            <span style={{ transform: `scaleX(${bai.cau.length ? daLam / bai.cau.length : 0})` }} />
          </div>
        </header>
        <main className="tl-than tl-ds-cau">
          {bai.cau.map((c, i) => (
            <article key={c.qid} className="tl-the-cau m3" onFocusCapture={() => { cauDangNhin.current = c.qid }} onPointerDown={() => { cauDangNhin.current = c.qid }}>
              <div className="tl-the-cau-dau">
                <span className="tl-so-cau">Câu {i + 1}</span>
                <span className="tl-nhan">{NHAN_PHAN_TU_LUYEN[c.phan]}</span>
                {c.sao > 0 && <span className="tl-nhan" data-kieu="sao">{c.sao} sao</span>}
                {c.tenDang && <span className="tl-nhan tl-nhan-dang">{c.tenDang}</span>}
              </div>
              <TheCauLam cau={c} stt={i + 1} giaTri={bai.traLoi[c.qid]} onDoi={(v) => traLoi(c.qid, v)} />
              <NutHoiThay qid={c.qid} nguon="tu_luyen" gon onHoi={() => setBai((b) => (b && !b.coGoiY.includes(c.qid) ? { ...b, coGoiY: [...b.coGoiY, c.qid] } : b))} />
            </article>
          ))}
        </main>
        <footer className="tl-thanh-nop">
          <div className="tl-thanh-nop-trong">
            <div className="tl-thanh-so">
              <b className="tl-so-lon">{daLam}/{bai.cau.length}</b>
              <span>câu đã làm · <span className="tl-tab">{dongHo(bai.giay)}</span></span>
            </div>
            {loi && <p className="tl-loi-nho" role="alert">{loi}</p>}
            <button type="button" className="tl-nut-chinh" onClick={nop} disabled={dangNop}>
              {dangNop ? 'Đang chấm…' : 'Nộp bài'}
            </button>
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
  const soCauChon = cheDo === 1 ? (nguon?.cacCa.filter((c) => caChon1.has(c.maCa)).reduce((n, c) => n + c.soCauSai, 0) ?? 0) : cheDo === 2 ? soCau2 : cheDo === 3 ? soCau3 : soCau4
  const coTheBatDau = !!cheDo && !khoa && !dangRut && (cheDo === 1 ? soCauChon > 0 : !!tongXt && !tongXt.dang && tongXt.tong > 0 && soCauChon > 0)

  const khoaCheDo = (m: CheDoTuLuyen): string => {
    if (!nguon) return ''
    if ((m === 1 || m === 2 || m === 4) && nguon.cacCa.length === 0) return 'Chưa có câu sai ở ca đã công bố'
    if (m === 3 && nguon.danhMuc.length === 0) return nguon.loiDanhMuc || 'Kho chưa có dạng bài'
    return ''
  }

  const thanhChon = (gt: number, dat: (n: number) => void, min: number, max: number) => (
    <div className="tl-thanh-chon">
      <div className="tl-thanh-chon-dau">
        <label htmlFor="tl-so-cau">Số câu</label>
        <b className="tl-tab">{gt} <span>/ tối đa {max}</span></b>
      </div>
      <input id="tl-so-cau" type="range" min={Math.min(min, max)} max={Math.max(1, max)} step={1} value={gt} disabled={max <= 0} onChange={(e) => dat(Number(e.target.value))} />
    </div>
  )
  const nhanXt = tongXt?.dang ? <p className="tl-ghi" role="status">Đang đếm câu trong kho…</p> : tongXt?.loi ? <p className="tl-ghi" data-kieu="loi">{tongXt.loi}</p> : null

  const bangCheDo = cheDo && (
    <section className="tl-cau-hinh" aria-label={`Cài đặt ${TEN_CHE_DO[cheDo]}`}>
      {cheDo === 1 && (
        <>
          <h2 className="tl-muc">Chọn ca kiểm tra</h2>
          <div className="tl-ds-chon">
            {nguon?.cacCa.map((c) => (
              <label key={c.maCa} className="tl-o-chon">
                <input type="checkbox" checked={caChon1.has(c.maCa)} onChange={() => setCaChon1((s) => { const n = new Set(s); if (n.has(c.maCa)) n.delete(c.maCa); else n.add(c.maCa); return n })} />
                <span className="tl-o-chon-chu">{c.tenCa}</span>
                <span className="tl-o-chon-so tl-tab">{c.soCauSai} câu sai</span>
              </label>
            ))}
          </div>
          <p className="tl-ghi">Bỏ câu tự luận. Mỗi câu hiện lại nguyên đề, em tự làm lại rồi xem lời giải.</p>
        </>
      )}
      {cheDo === 2 && (
        <>
          <h2 className="tl-muc">Lấy câu sai từ ca nào</h2>
          <div className="tl-ds-chon">
            {nguon?.cacCa.map((c) => (
              <label key={c.maCa} className="tl-o-chon">
                <input type="checkbox" checked={caChon2.has(c.maCa)} onChange={() => setCaChon2((s) => { const n = new Set(s); if (n.has(c.maCa)) n.delete(c.maCa); else n.add(c.maCa); return n })} />
                <span className="tl-o-chon-chu">{c.tenCa}</span>
                <span className="tl-o-chon-so tl-tab">{c.soCauSai} câu sai</span>
              </label>
            ))}
          </div>
          {tongXt && tongXt.thongKe.length > 0 && (
            <ul className="tl-ds-dang-sai" aria-label="Dạng câu sai của em">
              {tongXt.thongKe.slice(0, 6).map((t) => (
                <li key={t.tenDang}><span>{t.tenDang || 'Chưa gắn dạng'}</span><span className="tl-tab">{t.soCauSai} câu sai · kho có {t.soUngVien} câu</span></li>
              ))}
            </ul>
          )}
          {nhanXt}
          {thanhChon(soCau2, setSoCau2, 1, tongXt?.tong ?? 0)}
          <p className="tl-ghi">Số câu mỗi dạng chia theo tỉ lệ câu em sai ở dạng đó.</p>
        </>
      )}
      {cheDo === 3 && nguon && (
        <>
          <h2 className="tl-muc">Lớp</h2>
          <div className="tl-chip-hang" role="radiogroup" aria-label="Lớp">
            {nguon.danhMuc.map((l) => (
              <button key={l.lop} type="button" role="radio" aria-checked={lop3 === l.lop} className="tl-chip" onClick={() => {
                setLop3(l.lop)
                const b = l.bais[0]
                setBai3(b?.tenBai ?? '')
                setDang3(new Set(b?.dangs[0] ? [b.dangs[0].ma] : []))
              }}>Lớp {l.lop}</button>
            ))}
          </div>
          <h2 className="tl-muc"><label htmlFor="tl-bai">Bài</label></h2>
          <div className="tl-chon-bai">
            <select id="tl-bai" value={bai3} onChange={(e) => {
              setBai3(e.target.value)
              const b = lopHT?.bais.find((x) => x.tenBai === e.target.value)
              setDang3(new Set(b?.dangs[0] ? [b.dangs[0].ma] : []))
            }}>
              {lopHT?.bais.map((b) => <option key={b.tenBai} value={b.tenBai}>{b.tenBai}</option>)}
            </select>
          </div>
          <h2 className="tl-muc">Dạng bài <span className="tl-muc-phu">chọn được nhiều dạng</span></h2>
          <div className="tl-ds-chon">
            {baiHT?.dangs.map((d) => (
              <label key={d.ma} className="tl-o-chon">
                <input type="checkbox" checked={dang3.has(d.ma)} onChange={() => setDang3((s) => { const n = new Set(s); if (n.has(d.ma)) n.delete(d.ma); else n.add(d.ma); return n })} />
                <span className="tl-o-chon-chu">{d.ten}</span>
              </label>
            ))}
          </div>
          {nhanXt}
          {thanhChon(soCau3, setSoCau3, Math.min(5, tongXt?.tong ?? 5), Math.min(50, tongXt?.tong ?? 0))}
        </>
      )}
      {cheDo === 4 && (
        <>
          <h2 className="tl-muc">Loại câu</h2>
          <div className="tl-chip-hang" role="group" aria-label="Loại câu">
            {LUA_CHON_TU_DO.map((m) => (
              <button key={m.id} type="button" aria-pressed={mucDo4.has(m.id)} className="tl-chip" onClick={() => setMucDo4((prev) => {
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
          {nhanXt}
          {thanhChon(soCau4, setSoCau4, 1, Math.min(50, tongXt?.tong ?? 0))}
          <p className="tl-ghi">Rút từ kho câu cùng chuyên đề với các câu em từng sai.</p>
        </>
      )}
      {loi && <p className="tl-ghi" data-kieu="loi" role="alert">{loi}</p>}
      <button type="button" className="tl-nut-chinh tl-nut-rong" disabled={!coTheBatDau} onClick={() => batDau()}>
        {dangRut ? 'Đang rút câu…' : cheDo === 1 ? `Làm lại ${soCauChon} câu sai` : `Bắt đầu luyện · ${soCauChon} câu`}
      </button>
    </section>
  )

  return (
    <div className="tl" data-chang="chon">
      <header className="tl-dau">
        <div className="tl-hang">
          <button type="button" className="tl-ve" aria-label="Về Sảnh" onClick={onVe}><IconVe /></button>
          <div className="tl-tieu-khoi">
            <h1 className="tl-tieu baloo">Tu luyện</h1>
            <p className="tl-phu">Luyện tự do · không tính EXP · không ảnh hưởng game</p>
          </div>
        </div>
        <div className="tl-the-phu" role="tablist" aria-label="Tu luyện">
          <button type="button" role="tab" aria-selected={thePhu === 'luyen'} className="tl-the-phu-nut" onClick={() => setThePhu('luyen')}>Luyện</button>
          <button type="button" role="tab" aria-selected={thePhu === 'tong-hop'} className="tl-the-phu-nut" onClick={() => setThePhu('tong-hop')}>Tổng hợp</button>
        </div>
      </header>

      {thePhu === 'tong-hop' ? (
        <main className="tl-than">
          <TongHopTuLuyen
            token={token}
            lamMoi={lamMoiTongHop}
            danhMuc={nguon?.danhMuc ?? []}
            onLuyenDang={(lop, tenBai, ma) => {
              setLop3(lop); setBai3(tenBai); setDang3(new Set([ma])); setSoCau3(SO_CAU_MAC_DINH)
              setCheDo(3); setThePhu('luyen')
              void batDau({ cheDo: 3, dsDang: [ma], soCau: SO_CAU_MAC_DINH })
            }}
          />
        </main>
      ) : (
        <main className="tl-than">
          {khoa && <p className="tl-bao" data-kieu="khoa" role="status">Em đang có ca kiểm tra mở nên Tu luyện tạm khoá. Làm xong ca kiểm tra rồi luyện tiếp nhé.</p>}
          {dangTaiNguon && !nguon ? (
            <div className="tl-luoi-che-do" aria-busy="true" role="status" aria-label="Đang tải">
              {[1, 2, 3, 4].map((i) => <div key={i} className="tl-xuong" />)}
            </div>
          ) : loiNguon && !nguon ? (
            <div className="tl-bao" data-kieu="loi" role="alert">
              <p>{loiNguon}</p>
              <button type="button" className="tl-nut-phu" onClick={() => void napNguon()}>Thử lại</button>
            </div>
          ) : (
            <>
              <h2 className="tl-muc tl-muc-dau">Chọn cách luyện</h2>
              <div className="tl-luoi-che-do" role="radiogroup" aria-label="Chọn cách luyện">
                {([1, 2, 3, 4] as CheDoTuLuyen[]).map((m) => {
                  const lyDoKhoa = khoaCheDo(m)
                  return (
                    <button key={m} type="button" role="radio" aria-checked={cheDo === m} className="tl-the-che-do" data-che-do={m} disabled={!!lyDoKhoa} onClick={() => { setCheDo(m); setLoi('') }}>
                      <span className="tl-the-che-do-icon"><IconCheDo cheDo={m} /></span>
                      <span className="tl-the-che-do-chu">
                        <span className="tl-the-che-do-ten">{TEN_CHE_DO[m]}</span>
                        <span className="tl-the-che-do-phu">{lyDoKhoa || MO_TA[m].phu}</span>
                      </span>
                      <span className="tl-the-che-do-y">{MO_TA[m].y}</span>
                    </button>
                  )
                })}
              </div>
              {cheDo ? bangCheDo : <p className="tl-ghi tl-ghi-giua">Chọn một cách luyện để bắt đầu. Làm xong em xem ngay đáp án, lời giải và tiến bộ của mình ở thẻ Tổng hợp.</p>}
            </>
          )}
        </main>
      )}
    </div>
  )
}

/** Một câu ở chế độ LÀM: TheCau `thi` — không truyền `correct`/lời giải (máy em không có). */
function TheCauLam({ cau: c, stt, giaTri, onDoi }: { cau: CauCongKhai; stt: number; giaTri: string | undefined; onDoi: (v: string) => void }) {
  const chung = {
    cheDo: 'thi' as const,
    stt,
    id: `tl-cau-${stt}`,
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
function TheCauXem({ cau: c, kq, stt }: { cau: CauCongKhai; kq: KetQuaCau | undefined; stt: number }) {
  const chung = {
    cheDo: 'xem_lai' as const,
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

function ManKetQua({ kq, cau, onVe, onLuyenTiep, onTongHop }: { kq: KetQuaNop; cau: CauCongKhai[]; onVe: () => void; onLuyenTiep: () => void; onTongHop: () => void }) {
  const [chiSai, setChiSai] = useState(false)
  const theoQid = useMemo(() => new Map(kq.cau.map((k) => [k.qid, k])), [kq])
  const tiLe = kq.soCau ? Math.round((100 * kq.soDung) / kq.soCau) : 0
  const ds = cau.map((c, i) => ({ c, i, k: theoQid.get(c.qid) })).filter((x) => !chiSai || !x.k?.dung)
  const chuVi = 2 * Math.PI * 44
  return (
    <div className="tl" data-chang="ket-qua">
      <header className="tl-dau">
        <div className="tl-hang">
          <button type="button" className="tl-ve" aria-label="Về Sảnh" onClick={onVe}><IconVe /></button>
          <div className="tl-tieu-khoi">
            <h1 className="tl-tieu tl-tieu-nho">Kết quả tu luyện</h1>
            <p className="tl-phu">{kq.tieuDe}</p>
          </div>
        </div>
      </header>
      <main className="tl-than">
        <section className="tl-diem" aria-label="Kết quả lượt này">
          <span className="tl-vong" role="img" aria-label={`Đúng ${kq.soDung} trên ${kq.soCau} câu`}>
            <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden="true" focusable="false">
              <circle cx="56" cy="56" r="44" className="tl-vong-nen" strokeWidth="10" fill="none" />
              <circle cx="56" cy="56" r="44" className="tl-vong-dat" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={`${((chuVi * tiLe) / 100).toFixed(1)} ${chuVi.toFixed(1)}`} transform="rotate(-90 56 56)" />
            </svg>
            <span className="tl-vong-chu"><b className="baloo tl-tab">{kq.soDung}/{kq.soCau}</b><span>câu đúng</span></span>
          </span>
          <dl className="tl-diem-so">
            <div><dt>Điểm lượt này</dt><dd className="tl-tab">{kq.diem.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} / 10</dd></div>
            <div><dt>Tỉ lệ đúng</dt><dd className="tl-tab">{tiLe}%</dd></div>
            <div><dt>Thời gian làm</dt><dd className="tl-tab">{chuThoiGian(kq.giay)}</dd></div>
          </dl>
          <p className="tl-ghi">Tu luyện không tính EXP và không đổi câu trong game.</p>
        </section>
        <div className="tl-chip-hang" role="group" aria-label="Lọc câu">
          <button type="button" className="tl-chip" aria-pressed={!chiSai} onClick={() => setChiSai(false)}>Tất cả {kq.soCau} câu</button>
          <button type="button" className="tl-chip" aria-pressed={chiSai} onClick={() => setChiSai(true)}>Câu sai · {kq.soCau - kq.soDung}</button>
        </div>
        <div className="tl-ds-cau">
          {ds.length === 0 && <p className="tl-ghi tl-ghi-giua">Không có câu sai nào. Em làm tốt lắm!</p>}
          {ds.map(({ c, i, k }) => (
            <article key={c.qid} className="tl-the-cau m3" data-dung={k?.dung ? 'true' : 'false'}>
              <div className="tl-the-cau-dau">
                <span className="tl-so-cau">Câu {i + 1}</span>
                <span className="tl-nhan" data-kieu={k?.dung ? 'dung' : 'sai'}>{k?.dung ? 'Đúng' : c.phan === 'II' && k?.yDung ? `Đúng ${k.yDung}/4 ý` : 'Sai'}</span>
                {c.tenDang && <span className="tl-nhan tl-nhan-dang">{c.tenDang}</span>}
              </div>
              {k?.anDapAn ? (
                <p className="tl-ghi">Câu này vừa vào một ca kiểm tra chưa công bố — đáp án và lời giải hiện lại sau khi thầy công bố điểm.</p>
              ) : (
                <TheCauXem cau={c} kq={k} stt={i + 1} />
              )}
              <NutHoiThay qid={c.qid} nguon="tu_luyen" gon />
            </article>
          ))}
        </div>
        <div className="tl-hang-nut">
          <button type="button" className="tl-nut-chinh" onClick={onLuyenTiep}>Luyện lượt mới</button>
          <button type="button" className="tl-nut-phu" onClick={onTongHop}>Xem tổng hợp</button>
        </div>
      </main>
    </div>
  )
}

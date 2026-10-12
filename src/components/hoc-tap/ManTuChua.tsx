// TỰ CHỮA LỖI — danh sách câu cần chữa (mở từ Hôm nay › "Tự chữa lỗi", từ màn làm câu › "Tự chữa câu này", từ hồ sơ › câu chưa chữa).
// 12/10 (thầy: "mục chữa lỗi hiển thị cho thật chuẩn để học sinh chữa lỗi được"): mỗi câu có TÊN (dạng bài + phần + lần sai gần nhất, lấy từ
// "Câu đã làm") và TRẠNG THÁI bằng chữ; lỗi tải có Thử lại; rỗng thì gợi ý việc tiếp.
// TRÙNG TU 12/10 đợt 16 (thầy: "Trùng tu toàn diện giao diện tự sửa lỗi, mời gọi hs sửa lỗi, phải siêu đẹp, siêu thân thiện, rất khoa học.
// Tối ưu cho cả màn hình dọc, ngang máy tính." · "chỗ các câu học sinh chưa chữa đc bấm vào phải nảy vào đúng chỗ tự sửa"):
//   · THẺ TỔNG đầu màn: số câu cần chữa (số lớn có nhãn), thanh "Đã tự sửa x/y câu", vì sao nên chữa (lịch ôn 1 · 3 · 7 ngày — chữ app đã
//     dùng ở màn làm câu), cách tự chữa ba bước, và MỘT nút chính "Bắt đầu chữa" mở câu đứng đầu nhóm Cần chữa THEO THỨ TỰ MÁY CHỦ
//     (máy chủ xếp: lần gặp lại đã tới trước, rồi câu giao gần nhất, câu đã tự sửa cuối) — màn không tự xếp lại;
//   · THẺ CÂU: tên dạng · phần · lần sai gần nhất · trạng thái bằng chữ · động từ (Chữa / Chữa tiếp / Xem / Xem lại); không mã nội bộ;
//   · MỞ THẲNG MỘT CÂU (`qid`): chờ danh sách ⇒ có câu ⇒ mở đúng đợt của câu đó (khớp cả bản đổi số "~n"/"#n"); không có trong danh sách
//     ⇒ vẫn thử mở (vòng chữa tự lập đợt cho câu sai đã công bố — lệnh `mo-dot` như cũ), mở không được ⇒ về danh sách kèm lời báo thật
//     + "Thử mở lại"; danh sách lỗi ⇒ báo lỗi + Thử lại (không màn trắng, không kẹt). Mở câu ⇒ cuộn về đầu màn chữa; quay ra ⇒ về đúng chỗ
//     trong danh sách (đã tải lại trạng thái);
//   · dọc: một cột; ngang và máy tính: hai cột (thẻ tổng bên trái, danh sách bên phải). Chỉ biến màu sẵn có — kiểu ở tu-chua.css.
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Clock3, Lock, PencilLine, RotateCcw } from 'lucide-react'
import { apiDanhSachTuChua, type KetQuaDanhSachChua, type MucChua } from '../../lib/chua-cau-sai-api'
import { taiCauDaLam, NHAN_NGUON_LAN, type CauDaLamMuc } from '../hoa2/api'
import { henGapLai } from '../../lib/chua-truc-tiep'
import { khoaMoChua } from '../../../server/src/ho-so-em-hs-loc'
import './hoc-tap.css'
import './tu-chua.css'
const ManChua = lazy(() => import('../chua-cau-sai/ManChuaCauSai'))

/** Trạng thái đợt chữa ⇒ chữ em đọc được (bảng từ chuẩn: không mã nội bộ). */
export const CHU_TRANG_THAI_CHUA: Record<string, string> = {
  can_chan_doan: 'Chưa bắt đầu · tìm chỗ vướng',
  dang_chua_buoc: 'Đang gỡ từng bước',
  dang_ghep_bai: 'Đang ghép lại cả bài',
  dang_kiem_chung: 'Lần gặp lại 2 · tự làm bản mới',
  cho_gap_lai_2: 'Chờ lần gặp lại 2',
  can_thay: 'Chờ chữa trên lớp · chữa trực tiếp được',
  thieu_hoc_lieu: 'Chữa trực tiếp câu gốc',
  cau_thay_doi: 'Câu vừa cập nhật · chữa trực tiếp được',
  tam_khoa: 'Tạm khoá · tiến độ được giữ',
  da_tu_sua: 'Đã tự sửa',
}
const TEN_PHAN: Record<string, string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }
/** Khoá mở Tự chữa từ Hồ sơ ("g<số>" — `khoaMoChua`). */
export const laKhoaHoSo = (q: string) => /^g\d+$/.test(q)
/** Mã gốc của câu: bỏ đuôi bản đổi số (~n, #n) và tiền tố "tc:" — để khớp câu mở thẳng với đợt trong danh sách. */
export const goc = (q: string) => q.replace(/(~\d+|#\d+)$/, '').replace(/^tc:/, '')
const ngayNgan = (ymd: string) => (/^\d{4}-\d{2}-\d{2}$/.test(ymd) ? `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}` : '')
const cau = (s: string) => (/[.!?…]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`)
const DANG_LAM = new Set(['dang_chua_buoc', 'dang_ghep_bai', 'dang_kiem_chung'])

type Nhom = 'can' | 'cho' | 'xong'
interface DongChua {
  m: MucChua
  ten: string
  phu: string
  trangThai: string
  nhom: Nhom
  /** Động từ trên thẻ: Chữa · Chữa tiếp · Xem · Xem lại. */
  lam: string
}

/** Tên + dòng phụ của một câu: dạng bài (Câu đã làm) · phần · lần sai gần nhất ở đâu. Không có ⇒ "Câu sai số N". */
export function dungDong(m: MucChua, i: number, cdl: ReadonlyMap<string, CauDaLamMuc>, nayMs: number): DongChua {
  const c = cdl.get(goc(m.qid))
  const saiCuoi = c ? [...c.lichSu].filter((l) => !l.dung).sort((a, b) => (a.ngay < b.ngay ? 1 : -1))[0] : undefined
  const phu = [
    c ? TEN_PHAN[c.phan] : '',
    saiCuoi ? `sai lần gần nhất ${ngayNgan(saiCuoi.ngay)}${saiCuoi.nguon ? ` · ${NHAN_NGUON_LAN[saiCuoi.nguon]}` : ''}` : '',
  ].filter(Boolean).join(' · ')
  const hen = m.trangThai === 'cho_gap_lai_2' ? henGapLai(m.denHan, nayMs) : null
  const nhom: Nhom = m.trangThai === 'da_tu_sua' ? 'xong' : m.trangThai === 'cho_gap_lai_2' && !hen?.daToi ? 'cho' : 'can'
  const trangThai = m.trangThai === 'cho_gap_lai_2'
    ? hen?.daToi ? 'Đã tới lần gặp lại 2 · tự làm bản mới' : hen ? `Lần gặp lại 2 mở lúc ${hen.luc}` : CHU_TRANG_THAI_CHUA.cho_gap_lai_2
    : CHU_TRANG_THAI_CHUA[m.trangThai] ?? 'Tiếp tục tự chữa'
  const lam = nhom === 'xong' ? 'Xem lại' : nhom === 'cho' ? 'Xem' : DANG_LAM.has(m.trangThai) ? 'Chữa tiếp' : 'Chữa'
  return { m, ten: c?.tenDang || `Câu sai số ${i + 1}`, phu, trangThai, nhom, lam }
}

/** Đợt ứng với câu mở thẳng: cùng mã gốc; có cả đợt đã đóng lẫn đợt đang mở thì lấy đợt đang mở. */
export function timMucChua(ds: readonly MucChua[], qid: string): MucChua | undefined {
  // Từ Hồ sơ (đợt 16): khoá băm "g<số>" của mã gốc ⇒ băm từng câu trong danh sách bằng CÙNG hàm của máy chủ để khớp (không có mã nội bộ trong hồ sơ).
  if (laKhoaHoSo(qid)) {
    const cung = ds.filter((m) => khoaMoChua(m.qid) === qid)
    return cung.find((m) => m.trangThai !== 'da_tu_sua') ?? cung[0]
  }
  const g = goc(qid)
  const cung = ds.filter((m) => goc(m.qid) === g)
  return cung.find((m) => m.trangThai !== 'da_tu_sua') ?? cung[0]
}

/** Khung cuộn gần nhất (vỏ app học sinh bọc màn trong một lớp `overflow-y-auto`); không có thì cuộn cả trang. */
function khungCuon(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement ?? null; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY
    if (o === 'auto' || o === 'scroll') return p
  }
  return (document.scrollingElement as HTMLElement | null) ?? null
}

function BieuTuong({ d }: { d: DongChua }) {
  const sac = d.nhom === 'xong' ? 'muc' : d.nhom === 'cho' ? 'vang' : 'cham'
  const Icon = d.nhom === 'xong' ? CheckCircle2 : d.nhom === 'cho' ? Clock3 : d.m.trangThai === 'tam_khoa' ? Lock : PencilLine
  return <span className="ht2-dong-bt" data-sac={sac}><Icon size={20} aria-hidden="true" /></span>
}

const TEN_NHOM: Record<Nhom, string> = { can: 'Cần chữa', cho: 'Đang chờ lần gặp lại', xong: 'Đã tự sửa' }
/** Một dòng giải thích dưới tiêu đề nhóm (chỉ điều app đang làm thật — ChuaTrucTiep: chờ lần gặp lại vẫn tự làm lại được câu gốc). */
const PHU_NHOM: Partial<Record<Nhom, string>> = {
  cho: 'Lần gặp lại 2 là bản mới của câu, mở theo giờ hẹn ghi trên thẻ. Trong lúc chờ, em vẫn tự làm lại được câu gốc.',
}

type Chon = { qid: string; /** câu mở thẳng KHÔNG có trong danh sách: mở không được thì về danh sách kèm lời báo */ thu?: boolean }

export default function ManTuChua({ token, qid, onVe, onTuLuyen }: { token: string; qid?: string; onVe: () => void; onTuLuyen?: () => void }) {
  const [chon, setChon] = useState<Chon | null>(null)
  /** Câu mở thẳng đang chờ danh sách để tìm đúng đợt. */
  const [doi, setDoi] = useState(qid ?? '')
  /** Lời báo khi không mở được câu em chọn (giữ mã câu để "Thử mở lại"). */
  const [bao, setBao] = useState<{ qid: string; loi: string } | null>(null)
  const [qidTruoc, setQidTruoc] = useState(qid)
  if (qid !== qidTruoc) {
    // Vỏ đổi câu mở thẳng khi màn đang mở ⇒ làm lại từ đầu với câu mới.
    setQidTruoc(qid)
    setDoi(qid ?? '')
    setChon(null)
    setBao(null)
  }
  const [kq, setKq] = useState<KetQuaDanhSachChua | null>(null)
  const [cdl, setCdl] = useState<ReadonlyMap<string, CauDaLamMuc>>(new Map())
  const [lan, setLan] = useState(0)
  const gocRef = useRef<HTMLDivElement>(null)
  const viTri = useRef<{ top: number; khoa: string } | null>(null)
  /** Tải lại "lặng" khi em quay ra từ một câu: giữ danh sách cũ trên màn tới khi bản mới về (không nháy khung chờ, giữ chỗ cuộn). */
  const lang = useRef(false)

  useEffect(() => {
    let huy = false
    if (!lang.current) setKq(null)
    lang.current = false
    void apiDanhSachTuChua(token).then((r) => { if (!huy) setKq(r) })
    // Tên câu: lấy từ "Câu đã làm" (cùng tên dạng em đã thấy ở đó); hỏng thì giữ tên dự phòng — không chặn danh sách.
    void taiCauDaLam(token).then((r) => {
      if (!huy && r.cheDo2) setCdl(new Map(r.cau.map((c) => [goc(c.qid), c])))
    }).catch(() => {})
    return () => { huy = true }
  }, [token, lan])
  const dong = useMemo(() => (kq?.trangThai === 'bat' ? kq.ds.map((m, i) => dungDong(m, i, cdl, Date.now())) : []), [kq, cdl])

  // Câu mở thẳng: danh sách về ⇒ mở đúng đợt (hoặc thử mở câu chưa có đợt); vòng chữa tắt ⇒ bỏ, hiện màn "chưa mở cho em".
  useEffect(() => {
    if (!doi || !kq) return
    if (kq.trangThai === 'bat') {
      const m = timMucChua(kq.ds, doi)
      // Khoá từ Hồ sơ không có trong danh sách (đã sửa xong / chưa vào vòng chữa) ⇒ không "thử mở" bằng khoá băm: hiện danh sách kèm lời báo.
      if (!m && laKhoaHoSo(doi)) setBao({ qid: doi, loi: 'Câu này hiện chưa có trong danh sách Tự chữa của em — có thể em đã sửa xong, hoặc câu chưa vào vòng chữa.' })
      else setChon(m ? { qid: m.qid } : { qid: doi, thu: true })
      setDoi('')
    } else if (kq.trangThai === 'tat') setDoi('')
  }, [kq, doi])
  // Mở câu ⇒ màn chữa bắt đầu từ đầu (không kẹt ở giữa vì danh sách đã cuộn xuống).
  useEffect(() => {
    if (!chon) return
    const k = khungCuon(gocRef.current)
    if (k) k.scrollTop = 0
  }, [chon])
  // Quay ra ⇒ danh sách về đúng chỗ em đang đứng, con trỏ bàn phím ở lại thẻ câu vừa chữa.
  useEffect(() => {
    if (chon || kq?.trangThai !== 'bat' || !viTri.current) return
    const { top, khoa } = viTri.current
    viTri.current = null
    const k = khungCuon(gocRef.current)
    if (k) k.scrollTop = top
    const the = [...(gocRef.current?.querySelectorAll<HTMLElement>('[data-khoa]') ?? [])].find((x) => x.dataset.khoa === khoa)
    the?.focus({ preventScroll: true })
  }, [chon, kq])

  const moCau = (d: DongChua) => {
    viTri.current = { top: khungCuon(gocRef.current)?.scrollTop ?? 0, khoa: d.m.dotId ?? d.m.qid }
    setBao(null)
    setChon({ qid: d.m.qid })
  }

  if (chon) {
    const d = dong.find((x) => goc(x.m.qid) === goc(chon.qid))
    const ten = d?.ten ?? (cdl.get(goc(chon.qid))?.tenDang || undefined)
    return (
      <div ref={gocRef}>
        <Suspense fallback={<div className="ht-app ht2 tcl-man"><p className="ht-noi-dung tcl-cho-mo" role="status">Đang mở câu chữa…</p></div>}>
          <ManChua
            token={token}
            qid={chon.qid}
            tenCau={ten}
            onVe={() => { lang.current = true; setChon(null); setLan((n) => n + 1) }}
            onKhongMo={chon.thu ? (loi) => { setChon(null); setBao({ qid: chon.qid, loi }) } : undefined}
          />
        </Suspense>
      </div>
    )
  }

  const can = dong.filter((d) => d.nhom === 'can')
  const soCho = dong.filter((d) => d.nhom === 'cho').length
  const soXong = dong.filter((d) => d.nhom === 'xong').length
  const dangMoThang = !!doi && (!kq || kq.trangThai === 'bat')
  const coCauChua = can.length + soCho > 0
  return (
    <div ref={gocRef} className="ht-app ht2 tcl-man">
      <header className="ht-thanh tcl-dau-trang">
        <button type="button" className="ht-nut-phu" onClick={onVe}><ArrowLeft size={18} aria-hidden="true" />Hôm nay</button>
        <strong className="tcl-dau-trang-ten">Tự chữa lỗi</strong>
      </header>
      <main className="ht-noi-dung ht2-noi-dung tcl-noi-dung">
        {bao && (
          <div className="tcl-bao" role="alert">
            <AlertCircle size={22} aria-hidden="true" />
            <span className="tcl-bao-chu">
              <strong>Chưa mở được câu em chọn</strong>
              <small>{bao.loi ? `${cau(bao.loi)} ` : ''}{coCauChua ? 'Em chọn một câu trong danh sách để chữa.' : ''}</small>
            </span>
            {!laKhoaHoSo(bao.qid) && <button type="button" className="ht-nut-phu" onClick={() => { setBao(null); setChon({ qid: bao.qid, thu: true }) }}>
              <RotateCcw size={16} aria-hidden="true" />Thử mở lại
            </button>}
          </div>
        )}
        {dangMoThang || !kq ? (
          <div className="tcl-bo-cuc" aria-busy="true">
            <div className="tcl-tong tcl-xuong" role="status">
              <p className="tcl-cho-mo">{dangMoThang ? 'Đang mở câu em chọn…' : 'Đang tải câu cần chữa…'}</p>
            </div>
            <div className="tcl-ds" aria-hidden="true">
              <div className="tcl-nhom"><div className="tcl-the tcl-xuong" /><div className="tcl-the tcl-xuong" /><div className="tcl-the tcl-xuong" /></div>
            </div>
          </div>
        ) : kq.trangThai === 'loi' ? (
          <section className="tcl-trong" aria-labelledby="tcl-loi-tieu">
            <span className="tcl-trong-bt" data-sac="do"><AlertCircle size={26} aria-hidden="true" /></span>
            <h1 id="tcl-loi-tieu">Chưa tải được câu cần chữa</h1>
            <div className="ht-thong-bao ht2-loi tcl-loi" role="alert">
              <span>{doi ? 'Chưa mở được câu em chọn vì chưa tải được danh sách câu cần chữa. ' : ''}{kq.loi}</span>
              <button type="button" className="ht-nut-chinh" onClick={() => setLan((n) => n + 1)}>Thử lại</button>
            </div>
          </section>
        ) : kq.trangThai === 'tat' ? (
          <section className="tcl-trong" aria-labelledby="tcl-tat-tieu">
            <span className="tcl-trong-bt" data-sac="cham"><Lock size={26} aria-hidden="true" /></span>
            <h1 id="tcl-tat-tieu">Tự chữa lỗi chưa mở cho em</h1>
            <p className="ht2-phu">Em vẫn xem được đáp án và lời giải của câu đã làm ở Ôn &amp; sửa › Câu đã làm, và hỏi thầy ở từng câu.</p>
            <div className="ht2-hang-nut">
              <button type="button" className="ht-nut-chinh ht2-nut-lon" onClick={onVe}>Về Hôm nay</button>
            </div>
          </section>
        ) : !dong.length || (!can.length && !soCho) ? (
          <div className={soXong ? 'tcl-bo-cuc' : undefined}>
            <section className="tcl-trong" aria-labelledby="tcl-xong-tieu">
              <span className="tcl-trong-bt" data-sac="xanh"><CheckCircle2 size={28} aria-hidden="true" /></span>
              <h1 id="tcl-xong-tieu">Em không còn câu nào cần chữa</h1>
              {soXong > 0 && <p className="tcl-trong-so">Đã tự sửa: <b>{soXong} câu</b></p>}
              <p className="ht2-phu">Câu em làm sai sẽ tự vào đây. Việc tiếp theo: làm kế hoạch hôm nay{onTuLuyen ? ', hoặc luyện thêm ở Tu luyện' : ''}.</p>
              <div className="ht2-hang-nut">
                <button type="button" className="ht-nut-chinh ht2-nut-lon" onClick={onVe}>Về Hôm nay</button>
                {onTuLuyen && <button type="button" className="ht-nut-phu" onClick={onTuLuyen}>Luyện thêm ở Tu luyện</button>}
              </div>
            </section>
            {soXong > 0 && <div className="tcl-ds"><DanhSach nhom="xong" ds={dong} onChon={moCau} /></div>}
          </div>
        ) : (
          <div className="tcl-bo-cuc">
            <TheTong can={can} soCho={soCho} soXong={soXong} tong={dong.length} onChon={moCau} onVe={onVe} />
            <div className="tcl-ds">
              {(['can', 'cho', 'xong'] as Nhom[]).map((n) => {
                const ds = dong.filter((d) => d.nhom === n)
                return ds.length ? <DanhSach key={n} nhom={n} ds={ds} onChon={moCau} /> : null
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

/** Thẻ tổng: điểm nhấn của màn (số câu cần chữa) + tiến độ + vì sao + MỘT nút chính + cách tự chữa. */
function TheTong({ can, soCho, soXong, tong, onChon, onVe }: {
  can: DongChua[]
  soCho: number
  soXong: number
  tong: number
  onChon: (d: DongChua) => void
  onVe: () => void
}) {
  const dau = can[0]
  const phan = (n: number) => `${Math.round((n / Math.max(1, tong)) * 1000) / 10}%`
  return (
    <section className="tcl-tong" aria-labelledby="tcl-tong-tieu">
      <h1 id="tcl-tong-tieu">Câu em cần chữa</h1>
      <div className="tcl-tong-dau">
        <p className="tcl-so"><b>{can.length}</b><small>câu cần chữa</small></p>
        <p className="tcl-vi-sao">
          {dau
            ? 'Câu sai sẽ quay lại theo lịch ôn 1 · 3 · 7 ngày. Tự chữa ngay để lần gặp lại em tự làm được.'
            : 'Lúc này chưa có câu cần chữa ngay. Câu đang chờ lần gặp lại mở theo giờ hẹn ghi trên thẻ.'}
        </p>
      </div>
      <div className="tcl-tien-do">
        <p className="tcl-tien-do-chu"><span>Đã tự sửa</span><b>{soXong}/{tong} câu</b></p>
        <div className="tcl-thanh" role="img" aria-label={`Đã tự sửa ${soXong} trong ${tong} câu${soCho ? `, ${soCho} câu chờ lần gặp lại` : ''}`}>
          {soXong > 0 && <i data-tt="xong" style={{ width: phan(soXong) }} />}
          {soCho > 0 && <i data-tt="cho" style={{ width: phan(soCho) }} />}
        </div>
        {soCho > 0 && <p className="tcl-chu-giai"><span data-tt="xong">Đã tự sửa</span><span data-tt="cho">Chờ lần gặp lại: {soCho} câu</span></p>}
      </div>
      {dau ? (
        <div className="tcl-bat-dau">
          <button type="button" className="ht-nut-chinh ht2-nut-lon tcl-nut-chinh" aria-describedby="tcl-cau-dau" onClick={() => onChon(dau)}>
            <span>{DANG_LAM.has(dau.m.trangThai) ? 'Chữa tiếp' : 'Bắt đầu chữa'}</span><ArrowRight size={20} aria-hidden="true" />
          </button>
          <p className="tcl-cau-dau" id="tcl-cau-dau">Câu đầu tiên: <b>{dau.ten}</b></p>
        </div>
      ) : (
        <button type="button" className="ht-nut-chinh ht2-nut-lon tcl-nut-chinh" onClick={onVe}>
          <span>Về Hôm nay</span><ArrowRight size={20} aria-hidden="true" />
        </button>
      )}
      <div className="tcl-cach">
        <p className="tcl-cach-tieu">Cách tự chữa một câu</p>
        <ol>
          <li><span aria-hidden="true">1</span><p><b>Xem lại câu gốc</b> · tìm chỗ em sai</p></li>
          <li><span aria-hidden="true">2</span><p><b>Tự làm lại</b> · trước khi xem đáp án</p></li>
          <li><span aria-hidden="true">3</span><p><b>Đáp án và lời giải</b> · đối chiếu cách làm</p></li>
        </ol>
      </div>
    </section>
  )
}

function DanhSach({ nhom, ds, onChon }: { nhom: Nhom; ds: DongChua[]; onChon: (d: DongChua) => void }) {
  const cua = ds.filter((d) => d.nhom === nhom)
  const ten = TEN_NHOM[nhom]
  return (
    <section className="tcl-nhom" data-nhom={nhom} aria-label={`${ten}: ${cua.length} câu`}>
      <div className="tcl-nhom-dau">
        <h2>{ten}</h2>
        <span className="tcl-dem">{cua.length} câu</span>
      </div>
      {PHU_NHOM[nhom] && <p className="tcl-nhom-phu">{PHU_NHOM[nhom]}</p>}
      {cua.map((d) => (
        <button type="button" className="tcl-the" key={d.m.dotId ?? d.m.qid} data-khoa={d.m.dotId ?? d.m.qid} data-nhom={d.nhom} onClick={() => onChon(d)}>
          <BieuTuong d={d} />
          <span className="tcl-the-chu">
            <strong className="tcl-the-ten">{d.ten}</strong>
            {d.phu && <small className="tcl-the-phu">{d.phu}</small>}
            <small className="tcl-the-tt" data-nhom={d.nhom}>{d.trangThai}</small>
          </span>
          <span className="tcl-the-lam" data-nhom={d.nhom}>{d.lam}<ChevronRight size={18} aria-hidden="true" /></span>
        </button>
      ))}
    </section>
  )
}

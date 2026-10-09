// APP PHỤ HUYNH MỚI 28/09 — thầy: "Trùng tu toàn bộ app phụ huynh, app phụ huynh không có giao bài cho con nữa chỉ xem được báo cáo mọi thứ về con".
// Bản vẽ đã chốt: https://claude.ai/artifact/2HShm51xEiuVKcTAUpfeFT (Hôm nay · Điểm số · Chi tiết ca · Tiến bộ · Lời thầy; nền tối; xoay ngang; máy tính).
// BẢN VẼ TỐI GIẢN THẦY CHỐT 09/10 (thay bốn mục 28/09): BA mục điều hướng bằng liên kết `#…` (nút Quay lại của máy chạy đúng):
// #hom-nay (mặc định) · #tien-bo · #ca-kiem-tra (+ #ca/<mã ca>). Mục "Lời thầy" đã bỏ: lời thầy mới nhất ở cuối Hôm nay, lời thầy từng ca ở thẻ ca và màn chi tiết ca.
// Dữ liệu (CHỈ ĐỌC, không một lệnh ghi nào của phụ huynh): /ph/tat-ca-ve-con (hook sẵn có, làm mới 180 s) + /ph/hoc-2 + /ph/loi-thay + /ph/bao-cao-ca (khi mở một ca) + cảnh báo của thầy (/ph/ke-hoach).
import { Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import { AnhLogo } from '../LogoVai'
import { chuBanApp } from '../../lib/cap-nhat-app'
import { useTatCaVeCon } from '../../lib/ph-moi/use-tat-ca-ve-con'
import { chuCaiTen } from '../../lib/ph-moi/dinh-dang'
import { taiHoc2, taiLoiThay } from '../../lib/ph-v3/api'
import type { Hoc2, NhanXetCa } from '../../lib/ph-v3/du-lieu'
import { taiThongTinPhuHuynh } from '../../lib/tai-thong-tin-ph'
import { baoDaXemPhuHuynh } from '../../lib/canh-bao-thay-may-chu'
import type { CanhBaoThay } from '../../lib/canh-bao-thay-hien-thi'
import { BtBang, BtHomNay, BtTienBo } from './BieuTuong'
import ManHomNay from './ManHomNay'
import ManDiemSo from './ManDiemSo'
import ManTienBo from './ManTienBo'
import { docTuyen, type Muc, type Tuyen } from './tien-ich'
import { DangTai } from './dung-chung'
import './ph-v3.css'


const MUC: { muc: Muc; ten: string; bt: () => ReactElement }[] = [
  { muc: 'hom-nay', ten: 'Hôm nay', bt: () => <BtHomNay /> },
  { muc: 'tien-bo', ten: 'Tiến bộ', bt: () => <BtTienBo /> },
  { muc: 'ca-kiem-tra', ten: 'Ca kiểm tra', bt: () => <BtBang /> },
]

// Màn chi tiết ca kéo ChemText (công thức, lời giải): GÓI TẢI LƯỜI riêng — lần mở app đầu tiên không phải tải.
const ManChiTietCa = lazy(() => import('./ManChiTietCa'))

function useTuyen(): Tuyen {
  const [t, setT] = useState<Tuyen>(() => docTuyen(typeof location === 'undefined' ? '' : location.hash))
  useEffect(() => {
    const doi = () => {
      setT(docTuyen(location.hash))
      window.scrollTo?.(0, 0)
    }
    window.addEventListener('hashchange', doi)
    return () => window.removeEventListener('hashchange', doi)
  }, [])
  return t
}

/** Menu nút tròn tài khoản: "Đổi số báo danh" + số bản app (chữ nhỏ). Esc / bấm ra ngoài ⇒ đóng. */
function TaiKhoan({ ten, onDoiSbd }: { ten: string; onDoiSbd: () => void }) {
  const [mo, setMo] = useState(false)
  const goc = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!mo) return
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') setMo(false) }
    const bam = (e: MouseEvent) => { if (goc.current && !goc.current.contains(e.target as Node)) setMo(false) }
    document.addEventListener('keydown', phim)
    document.addEventListener('mousedown', bam)
    return () => { document.removeEventListener('keydown', phim); document.removeEventListener('mousedown', bam) }
  }, [mo])
  return (
    <div className="ph3-tron" ref={goc}>
      <button type="button" className="ph3-tron__nut" aria-label="Tài khoản: mở để đổi số báo danh" aria-haspopup="menu" aria-expanded={mo} onClick={() => setMo((x) => !x)}>
        {chuCaiTen(ten) || 'PH'}
      </button>
      {mo && (
        <div className="ph3-menu" role="menu">
          <button type="button" role="menuitem" onClick={onDoiSbd}>Đổi số báo danh</button>
          <p data-vung="ban-app">{chuBanApp()}</p>
        </div>
      )}
    </div>
  )
}

export default function AppPhuHuynh({ sbd, hoTen, lop, onDoiSbd }: { sbd: string; hoTen: string; lop: string; onDoiSbd: () => void }) {
  const tuyen = useTuyen()
  const v = useTatCaVeCon(sbd)
  const ten = v.pm?.hoTen || hoTen
  const moc = v.pm?.serverNow ?? null

  // Game Hoá 2.0 của con: nạp cùng nhịp với "mọi thứ về con" (mỗi lần bản mới về). Lỗi ⇒ giữ bản cũ; chưa từng có ⇒ khối chiến dịch vắng.
  const [hoc2, setHoc2] = useState<Hoc2 | null>(null)
  useEffect(() => {
    let huy = false
    void taiHoc2(sbd).then((r) => { if (!huy && r.kieu === 'ok') setHoc2(r.v) })
    return () => { huy = true }
  }, [sbd, moc])

  const [loiThay, setLoiThay] = useState<{ ds: NhanXetCa[] | null; chuLoi: string }>({ ds: null, chuLoi: '' })
  const napLoiThay = useCallback(() => {
    setLoiThay((x) => ({ ...x, chuLoi: '' }))
    void taiLoiThay(sbd).then((r) => setLoiThay(r.kieu === 'ok' ? { ds: r.v, chuLoi: '' } : (x) => (x.ds ? x : { ds: null, chuLoi: r.chu })))
  }, [sbd])
  useEffect(() => { napLoiThay() }, [napLoiThay, moc])

  // Cảnh báo của thầy cho phụ huynh (cửa sổ 72 giờ, chỉ đúng con; lệnh /ph/ke-hoach — cần liên kết riêng, SBD trần ⇒ rỗng).
  const [canhBao, setCanhBao] = useState<CanhBaoThay[]>([])
  useEffect(() => {
    let huy = false
    void taiThongTinPhuHuynh().then((x) => { if (!huy) setCanhBao(x.canhBao) })
    return () => { huy = true }
  }, [sbd])
  const daXemCanhBao = useCallback((id: string) => {
    setCanhBao((ds) => ds.map((c) => (c.id === id ? { ...c, daXem: true } : c)))
    void baoDaXemPhuHuynh(id)
  }, [])

  let man: ReactElement
  if (tuyen.maCa) man = <Suspense fallback={<DangTai chu="Đang mở báo cáo ca kiểm tra…" />}><ManChiTietCa key={tuyen.maCa} sbd={sbd} maCa={tuyen.maCa} /></Suspense>
  else if (tuyen.muc === 'ca-kiem-tra') man = <ManDiemSo v={v} loiThay={loiThay.ds} />
  else if (tuyen.muc === 'tien-bo') man = <ManTienBo v={v} hoc2={hoc2} />
  else man = <ManHomNay v={v} hoc2={hoc2} loiThay={loiThay} thuLaiLoiThay={napLoiThay} canhBao={canhBao.filter((c) => !c.daXem)} onDaXem={daXemCanhBao} />

  return (
    <div className="ph3" data-app="ph3">
      <div className="ph3-khung">
        <nav className="ph3-dieu-huong" aria-label="Các mục chính">
          <span className="ph3-dieu-huong__logo" aria-hidden="true"><AnhLogo vai="ph" size={36} /></span>
          <div className="ph3-dieu-huong__con">
            <AnhLogo vai="ph" size={44} alt="Logo Đỗ Đại Học" />
            <div>
              <span>Phụ huynh em</span>
              <b>{ten}</b>
              {lop && <span>Lớp {lop}</span>}
            </div>
          </div>
          {MUC.map((m) => (
            <a key={m.muc} href={`#${m.muc}`} className="ph3-muc" aria-current={tuyen.muc === m.muc ? 'page' : undefined}>
              <span className="ph3-muc__bt">{m.bt()}</span>
              {m.ten}
            </a>
          ))}
          <button type="button" className="ph3-dieu-huong__doi" onClick={onDoiSbd}>Đổi số báo danh</button>
        </nav>
        <main className="ph3-chinh">
          {!tuyen.maCa && (
            <header className="ph3-dau">
              <span className="ph3-dau__logo"><AnhLogo vai="ph" size={40} alt="Logo Đỗ Đại Học" /></span>
              <div className="ph3-dau__ten">
                <span>Phụ huynh em</span>
                <b data-vung="ten-con">{ten}{lop ? ` · Lớp ${lop}` : ''}</b>
              </div>
              <TaiKhoan ten={ten} onDoiSbd={onDoiSbd} />
            </header>
          )}
          {man}
        </main>
      </div>
    </div>
  )
}

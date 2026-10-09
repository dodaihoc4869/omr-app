// Bộ bản vẽ đầy đủ đã duyệt 09/10: Hôm nay, Tiến bộ, Lịch sử và Lời thầy.
// Nguồn đọc và quyền công bố được giữ; khối vắng dữ liệu không dựng số minh họa.
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
import './giao-dien-day-du.css'
import ManLoiThay from './ManLoiThay'


const MUC: { muc: Muc; ten: string; bt: () => ReactElement }[] = [
  { muc: 'hom-nay', ten: 'Hôm nay', bt: () => <BtHomNay /> },
  { muc: 'tien-bo', ten: 'Tiến bộ', bt: () => <BtTienBo /> },
  { muc: 'ca-kiem-tra', ten: 'Lịch sử', bt: () => <BtBang /> },
  { muc: 'loi-thay', ten: 'Lời thầy', bt: () => <BtBang /> },
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
          <p>Phụ huynh em <b>{ten}</b></p><a role="menuitem" className="ph3-dong-lk" href="#thong-tin" onClick={() => setMo(false)}>Thông tin và giao diện</a><button type="button" role="menuitem" onClick={onDoiSbd}>Đổi số báo danh</button>
          <p data-vung="ban-app">{chuBanApp()}</p>
        </div>
      )}
    </div>
  )
}

type ThongTinPhuHuynh = { sbd: string; hoTen: string; lop: string; onDoiSbd: () => void }

export default function AppPhuHuynh(p: ThongTinPhuHuynh) {
  // Đổi con tạo phiên đọc mới: không giữ báo cáo, cảnh báo hoặc phản hồi muộn của em trước.
  return <PhienBaoCao key={p.sbd} {...p} />
}

function PhienBaoCao({ sbd, hoTen, lop, onDoiSbd }: ThongTinPhuHuynh) {
  const tuyen = useTuyen()
  const v = useTatCaVeCon(sbd)
  const ten = v.pm?.hoTen || hoTen
  const moc = v.pm?.serverNow ?? null

  // Game Hoá 2.0 của con: nạp cùng nhịp với "mọi thứ về con" (mỗi lần bản mới về). Lỗi ⇒ giữ bản cũ; chưa từng có ⇒ khối chiến dịch vắng.
  const [loiHoc2, setLoiHoc2] = useState('')
  const [nhapHoc2, setNhapHoc2] = useState(0)
  const [hoc2, setHoc2] = useState<Hoc2 | null>(null)
  useEffect(() => {
    let huy = false
    void taiHoc2(sbd).then((r) => {
      if (huy) return
      if (r.kieu === 'ok') { setHoc2(r.v); setLoiHoc2('') }
      else setLoiHoc2(r.chu)
    })
    return () => { huy = true }
  }, [sbd, moc, nhapHoc2])

  const [loiThay, setLoiThay] = useState<{ ds: NhanXetCa[] | null; chuLoi: string }>({ ds: null, chuLoi: '' })
  const luotLoiThay = useRef(0)
  useEffect(() => () => { luotLoiThay.current += 1 }, [])
  const napLoiThay = useCallback(() => {
    const luot = ++luotLoiThay.current
    setLoiThay((x) => ({ ...x, chuLoi: '' }))
    void taiLoiThay(sbd).then((r) => {
      if (luot !== luotLoiThay.current) return
      setLoiThay(r.kieu === 'ok' ? { ds: r.v, chuLoi: '' } : (x) => ({ ...x, chuLoi: r.chu }))
    })
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
  else if (tuyen.muc === 'thong-tin') man = <section><div className="ph3-tieu-de"><h1>Thông tin và giao diện</h1></div><div className="ph3-luoi"><article className="ph3-the ph3-o-rong"><h2>Phụ huynh em {ten}</h2>{lop && <p>Lớp {lop}</p>}<p>{chuBanApp()}</p><p>Giao diện sáng hoặc tối theo cài đặt của thiết bị.</p><button type="button" className="ph3-nut-vien" onClick={onDoiSbd}>Đổi số báo danh</button></article></div></section>
  else if (tuyen.muc === 'loi-thay') man = <ManLoiThay ds={loiThay.ds} loi={loiThay.chuLoi} thuLai={napLoiThay} />
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
          {v.pm && v.chuLoi && <div className="ph3-lam-moi-loi" role="status"><span>Báo cáo đang hiển thị bản đã tải. {v.chuLoi}</span><button type="button" onClick={v.thuLai}>Thử lại báo cáo</button></div>}
          {loiHoc2 && <div className="ph3-lam-moi-loi" role="status"><span>{hoc2 ? 'Tiến độ học đang hiển thị bản đã tải. ' : 'Chưa tải được tiến độ học. '}{loiHoc2}</span><button type="button" onClick={() => setNhapHoc2((x) => x + 1)}>Thử lại tiến độ</button></div>}
          {man}
        </main>
      </div>
    </div>
  )
}

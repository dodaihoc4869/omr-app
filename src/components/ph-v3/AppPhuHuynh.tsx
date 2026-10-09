// TRUNG TU GIAO DIỆN THẦY DUYỆT 09/10 (bản vẽ PH-HomNay · PH-TienBo · PH-CaKiemTra): BA mục Hôm nay · Tiến bộ · Ca kiểm tra, ba biểu tượng khác nhau.
// "Nhận xét của thầy" không còn là mục: thẻ lời mới nhất ở Hôm nay + màn con `#loi-thay` (có nút quay lại). "Đổi số báo danh" CHỈ ở menu Tài khoản và hỏi lại trước khi làm.
// Đổi mục: mờ dần + trượt 8px (.tt-vao-muc), mỗi mục giữ chỗ cuộn riêng (kể cả khi quay lại từ chi tiết ca). Nguồn đọc và quyền công bố giữ nguyên.
import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactElement } from 'react'
import { AnhLogo } from '../LogoVai'
import HopXacNhan from '../HopXacNhan'
import { chuBanApp } from '../../lib/cap-nhat-app'
import { useTatCaVeCon } from '../../lib/ph-moi/use-tat-ca-ve-con'
import { chuCaiTen } from '../../lib/ph-moi/dinh-dang'
import { taiHoc2, taiLoiThay } from '../../lib/ph-v3/api'
import type { Hoc2, NhanXetCa } from '../../lib/ph-v3/du-lieu'
import { taiThongTinPhuHuynh } from '../../lib/tai-thong-tin-ph'
import { baoDaXemPhuHuynh } from '../../lib/canh-bao-thay-may-chu'
import type { CanhBaoThay } from '../../lib/canh-bao-thay-hien-thi'
import { BtBang, BtHomNay, BtTienBo, BtTrai } from './BieuTuong'
import ManHomNay from './ManHomNay'
import ManDiemSo from './ManDiemSo'
import ManTienBo from './ManTienBo'
import { docTuyen, khoaCuon, laManCon, mucSang, type Muc, type Tuyen } from './tien-ich'
import { DangTai } from './dung-chung'
import './ph-v3.css'
import './giao-dien-day-du.css'
import ManLoiThay from './ManLoiThay'

const MUC: { muc: Muc; ten: string; bt: () => ReactElement }[] = [
  { muc: 'hom-nay', ten: 'Hôm nay', bt: () => <BtHomNay /> },
  { muc: 'tien-bo', ten: 'Tiến bộ', bt: () => <BtTienBo /> },
  { muc: 'ca-kiem-tra', ten: 'Ca kiểm tra', bt: () => <BtBang /> },
]

// Màn chi tiết ca kéo ChemText (công thức, lời giải): GÓI TẢI LƯỜI riêng — lần mở app đầu tiên không phải tải.
const ManChiTietCa = lazy(() => import('./ManChiTietCa'))

/** Tuyến theo `#…` + giữ chỗ cuộn: rời một mục ⇒ nhớ chỗ đang cuộn; về lại mục ⇒ trả đúng chỗ; màn con luôn mở từ đầu. */
function useTuyen(): Tuyen {
  const [t, setT] = useState<Tuyen>(() => docTuyen(typeof location === 'undefined' ? '' : location.hash))
  const cuon = useRef(new Map<string, number>())
  const dangXem = useRef(t)
  const lanDau = useRef(true)
  useEffect(() => {
    const doi = () => {
      const cu = dangXem.current
      if (!laManCon(cu)) cuon.current.set(khoaCuon(cu), window.scrollY || 0)
      const moi = docTuyen(location.hash)
      dangXem.current = moi
      setT(moi)
    }
    window.addEventListener('hashchange', doi)
    return () => window.removeEventListener('hashchange', doi)
  }, [])
  useLayoutEffect(() => {
    if (lanDau.current) { lanDau.current = false; return }
    window.scrollTo?.(0, laManCon(t) ? 0 : cuon.current.get(khoaCuon(t)) ?? 0)
  }, [t])
  return t
}

/** Menu nút tròn tài khoản: "Thông tin và giao diện" · "Đổi số báo danh" + số bản app (chữ nhỏ). Esc / bấm ra ngoài ⇒ đóng. */
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
      <button type="button" className="ph3-tron__nut tt-nhan" aria-label="Tài khoản: mở để đổi số báo danh" aria-haspopup="menu" aria-expanded={mo} onClick={() => setMo((x) => !x)}>
        {chuCaiTen(ten) || 'PH'}
      </button>
      {mo && (
        <div className="ph3-menu tt-mo-lop" role="menu">
          <p>Phụ huynh em <b>{ten}</b></p>
          <a role="menuitem" className="ph3-menu__muc tt-nhan" href="#thong-tin" onClick={() => setMo(false)}>Thông tin và giao diện</a>
          <button type="button" role="menuitem" className="tt-nhan" onClick={() => { setMo(false); onDoiSbd() }}>Đổi số báo danh</button>
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
  const [hoiDoiSbd, setHoiDoiSbd] = useState(false)

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
  if (tuyen.maCa) man = <Suspense fallback={<DangTai chu="Đang mở báo cáo ca kiểm tra…" hinh="chi-tiet" />}><ManChiTietCa key={tuyen.maCa} sbd={sbd} maCa={tuyen.maCa} /></Suspense>
  else if (tuyen.muc === 'ca-kiem-tra') man = <ManDiemSo v={v} loiThay={loiThay.ds} />
  else if (tuyen.muc === 'thong-tin') man = <ThongTin ten={ten} lop={lop} />
  else if (tuyen.muc === 'loi-thay') man = <ManLoiThay ds={loiThay.ds} loi={loiThay.chuLoi} thuLai={napLoiThay} />
  else if (tuyen.muc === 'tien-bo') man = <ManTienBo v={v} hoc2={hoc2} />
  else man = <ManHomNay v={v} hoc2={hoc2} loiThay={loiThay} thuLaiLoiThay={napLoiThay} canhBao={canhBao.filter((c) => !c.daXem)} onDaXem={daXemCanhBao} />

  const sang = mucSang(tuyen)
  const manCon = laManCon(tuyen)
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
            <a key={m.muc} href={`#${m.muc}`} className="ph3-muc tt-nhan" aria-current={sang === m.muc ? 'page' : undefined}>
              <span className="ph3-muc__bt">{m.bt()}</span>
              {m.ten}
            </a>
          ))}
        </nav>
        <main className="ph3-chinh">
          {!manCon && (
            <header className="ph3-dau">
              <span className="ph3-dau__logo"><AnhLogo vai="ph" size={40} alt="Logo Đỗ Đại Học" /></span>
              <div className="ph3-dau__ten">
                <span>Phụ huynh em</span>
                <b data-vung="ten-con">{ten}{lop ? ` · Lớp ${lop}` : ''}</b>
              </div>
              <TaiKhoan ten={ten} onDoiSbd={() => setHoiDoiSbd(true)} />
            </header>
          )}
          {v.pm && v.chuLoi && <div className="ph3-lam-moi-loi" role="status"><span>Báo cáo đang hiển thị bản đã tải. {v.chuLoi}</span><button type="button" className="tt-nhan" onClick={v.thuLai}>Thử lại báo cáo</button></div>}
          {loiHoc2 && <div className="ph3-lam-moi-loi" role="status"><span>{hoc2 ? 'Tiến độ học đang hiển thị bản đã tải. ' : 'Chưa tải được tiến độ học. '}{loiHoc2}</span><button type="button" className="tt-nhan" onClick={() => setNhapHoc2((x) => x + 1)}>Thử lại tiến độ</button></div>}
          <div key={khoaCuon(tuyen)} className={manCon ? 'tt-mo-lop' : 'tt-vao-muc'}>{man}</div>
        </main>
      </div>
      {hoiDoiSbd && (
        <HopXacNhan
          tieuDe="Đổi số báo danh?"
          noiDung={<p>Máy này sẽ quên số báo danh của con và bỏ liên kết riêng của phụ huynh đang lưu trên máy. Muốn xem lại báo cáo của con, anh/chị mở lại liên kết riêng thầy gửi hoặc nhập số báo danh.</p>}
          nhanHuy="Ở lại"
          nhanXacNhan="Đổi số báo danh"
          onHuy={() => setHoiDoiSbd(false)}
          onXacNhan={() => { setHoiDoiSbd(false); onDoiSbd() }}
        />
      )}
    </div>
  )
}

/** Màn con "Thông tin và giao diện" (mở từ menu Tài khoản): tên con, lớp, số bản app, chế độ sáng/tối. */
function ThongTin({ ten, lop }: { ten: string; lop: string }) {
  return (
    <section data-vung="man-thong-tin">
      <a className="ph3-lui tt-nhan" href="#hom-nay"><BtTrai co={24} day={2.5} />Hôm nay</a>
      <div className="ph3-tieu-de ph3-tieu-de--ca"><h1>Thông tin và giao diện</h1></div>
      <div className="ph3-luoi">
        <article className="ph3-the ph3-o-rong">
          <h2 className="ph3-the__ten">Phụ huynh em {ten}</h2>
          {lop && <p>Lớp {lop}</p>}
          <p>{chuBanApp()}</p>
          <p>Giao diện sáng hoặc tối theo cài đặt của thiết bị.</p>
        </article>
      </div>
    </section>
  )
}

// TRUNG TU GIAO DIỆN THẦY DUYỆT 09/10 (bản vẽ PH-HomNay · PH-TienBo · PH-CaKiemTra): BA mục Hôm nay · Tiến bộ · Ca kiểm tra, ba biểu tượng khác nhau.
// "Nhận xét của thầy" không còn là mục: thẻ lời mới nhất ở Hôm nay + màn con `#loi-thay` (có nút quay lại). "Đổi số báo danh" CHỈ ở menu Tài khoản và hỏi lại trước khi làm.
// Đợt 16: Hôm nay có thẻ "Nhịp học của con" (Lười / Chăm như app học sinh) — ManHomNay nhận `nhipCon` (SBD · tên · lớp) để tự nạp `/ph/nhip-hoc`.
// Đổi mục: mờ dần + trượt 8px (.tt-vao-muc), mỗi mục giữ chỗ cuộn riêng (kể cả khi quay lại từ chi tiết ca). Nguồn đọc và quyền công bố giữ nguyên.
// ĐỢT 19 · LÀN R (thầy duyệt bản vẽ docs/ban-ve-dot19/app-phu-huynh.html 13/10): mục Hôm nay thành MỘT trang cuộn "Hôm nay của con" (TrangVeCon.tsx) có
// đủ mọi phần; thanh điều hướng thành danh sách PHẦN của trang (điện thoại: thanh mục dính trên đầu trang · xoay ngang: thanh trái 88 px · máy tính: thanh
// bên 264 px) — bấm mục ⇒ cuộn tới phần, không đổi tuyến. Màn con Tiến bộ (`#tien-bo`) · Ca kiểm tra (`#ca-kiem-tra`) · chi tiết ca · nhận xét · thông tin
// vẫn mở từ liên kết trong trang (có nút quay lại), nạp khi mở. App giữ số của hai lệnh nạp khi cuộn tới (`/ph/ho-so-thai-do`, `/ph/lich-su-lam-cau` —
// gọi SONG SONG một lần) và của `/ph/nhip-hoc` (nạp lúc mở, cùng nhịp với "mọi thứ về con").
import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactElement } from 'react'
import { AnhLogo } from '../LogoVai'
import HopXacNhan from '../HopXacNhan'
import { chuBanApp } from '../../lib/cap-nhat-app'
import { useTatCaVeCon } from '../../lib/ph-moi/use-tat-ca-ve-con'
import { usePassPhuHuynh } from '../../lib/ph-moi/use-pass'
import { chuCaiTen } from '../../lib/ph-moi/dinh-dang'
import { taiConTongQuan, taiHoc2, taiLoiThay } from '../../lib/ph-v3/api'
import type { ConTongQuan } from '../../lib/ph-v3/con-tong-quan'
import type { TaiTongQuan } from './ConTongQuan'
import type { Hoc2, NhanXetCa } from '../../lib/ph-v3/du-lieu'
import { taiThongTinPhuHuynh } from '../../lib/tai-thong-tin-ph'
import { baoDaXemPhuHuynh } from '../../lib/canh-bao-thay-may-chu'
import type { CanhBaoThay } from '../../lib/canh-bao-thay-hien-thi'
import { BtTrai } from './BieuTuong'
import { docTuyen, khoaCuon, laManCon, type Tuyen } from './tien-ich'
import { DangTai } from './dung-chung'
import { HO_SO_TRONG, PHAN, docPhanTuHash, idPhan, phanCo, type IdPhan, type TaiHoSo } from './trang-ve-con-chung'
import { layHoSoThaiDoCon, layLichSuLamCauCon, layNhipHocCon } from '../../lib/ho-so-con-ph-api'
import type { KetQuaNhipHocApp } from '../../lib/nhip-hoc-em'
import { gioVn, ngayChuoiNgan, ngayDayDuVn } from '../../lib/ph-moi/dinh-dang'
import './ph-v3.css'
import './giao-dien-day-du.css'
import './con-tong-quan.css'
import ManLoiThay from './ManLoiThay'

// Màn chi tiết ca kéo ChemText (công thức, lời giải): GÓI TẢI LƯỜI riêng — lần mở app đầu tiên không phải tải. Đợt 19: Tiến bộ · Ca kiểm tra là màn con
// mở từ trang ⇒ cũng nạp khi mở (tải đầu app nhẹ hơn).
const ManChiTietCa = lazy(() => import('./ManChiTietCa'))
const ManTienBo = lazy(() => import('./ManTienBo'))
const ManDiemSo = lazy(() => import('./ManDiemSo'))
// «CHỈ ĐỌC» (thầy chốt bản vẽ 26/10, DocPh.tsx — thay màn «Một trang» 8 ô): main.tsx gắn <html data-trong="ph"> (lùi một máy: localStorage
// ddh.trong='tat' ⇒ trang cũ y như trước, không tải mảnh này). Bật ⇒ mảnh màn chỉ đọc tải NGAY lúc mô-đun này chạy (song song các lệnh lúc mở); tải hỏng ⇒ vẽ trang cũ.
type ModMot = typeof import('./DocPh')
const laMotTrang = (): boolean => typeof document !== 'undefined' && document.documentElement.dataset.trong === 'ph'
let huaMot: Promise<ModMot | null> | null = null
const napMot = (): Promise<ModMot | null> => (huaMot ??= import('./DocPh').catch(() => ((huaMot = null), null)))
if (laMotTrang()) void napMot()
// TRANG CŨ «Hôm nay của con» (TrangVeCon + trang-con.css) NẠP LƯỜI (26/10, luật tốc độ: đường /ph chỉ nhẹ đi) — màn «Chỉ đọc» không cần nó; chỉ tải khi
// vỏ cũ hiện (ddh.trong='tat', màn con mở từ trang, hoặc mảnh chỉ đọc tải hỏng). Tắt giao diện mới ⇒ tải NGAY lúc mô-đun chạy như mảnh chỉ đọc.
type ModCu = typeof import('./TrangVeCon')
let huaCu: Promise<ModCu | null> | null = null
/** Mảnh trang cũ đã về (lần vẽ sau dùng ngay, không qua một lượt chờ). */
let modCuDaCo: ModCu | undefined
const napCu = (): Promise<ModCu | null> => (huaCu ??= import('./TrangVeCon').then((m) => (modCuDaCo = m), () => ((huaCu = null), null)))
if (!laMotTrang()) void napCu()
/** Số lượt làm câu tối đa tải cho phần "Số giây theo mức độ câu" (câu sai và tổng thì máy chủ tính trên mọi lượt). */
const GIOI_HAN_LUOT = 600

/** Màn con (mở từ trang, có nút quay lại, luôn mở từ đầu): chi tiết ca · nhận xét · thông tin · Tiến bộ · Ca kiểm tra (đợt 19). */
const laCon = (t: Tuyen): boolean => laManCon(t) || t.muc === 'tien-bo' || t.muc === 'ca-kiem-tra'
/** Nút quay lại trang "Hôm nay của con" trên màn con Tiến bộ / Ca kiểm tra. */
const NutVe = () => <a className="ph3-lui tt-nhan" href="#hom-nay"><BtTrai co={24} day={2.5} />Hôm nay</a>

/** Tuyến theo `#…` + giữ chỗ cuộn: rời một mục ⇒ nhớ chỗ đang cuộn; về lại mục ⇒ trả đúng chỗ; màn con luôn mở từ đầu. */
function useTuyen(): Tuyen {
  const [t, setT] = useState<Tuyen>(() => docTuyen(typeof location === 'undefined' ? '' : location.hash))
  const cuon = useRef(new Map<string, number>())
  const dangXem = useRef(t)
  const lanDau = useRef(true)
  useEffect(() => {
    const doi = () => {
      const cu = dangXem.current
      if (!laCon(cu)) cuon.current.set(khoaCuon(cu), window.scrollY || 0)
      const moi = docTuyen(location.hash)
      dangXem.current = moi
      setT(moi)
    }
    window.addEventListener('hashchange', doi)
    return () => window.removeEventListener('hashchange', doi)
  }, [])
  useLayoutEffect(() => {
    if (lanDau.current) { lanDau.current = false; return }
    window.scrollTo?.(0, laCon(t) ? 0 : cuon.current.get(khoaCuon(t)) ?? 0)
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
  const pass = usePassPhuHuynh()
  // Đổi con/liên kết tạo phiên đọc mới cho cả năm khối. Key chỉ thuộc React, không đưa liên kết ra DOM.
  return <PhienBaoCao key={JSON.stringify([p.sbd, pass])} {...p} />
}

function PhienBaoCao({ sbd, hoTen, lop, onDoiSbd }: ThongTinPhuHuynh) {
  const tuyen = useTuyen()
  const v = useTatCaVeCon(sbd)
  const ten = v.pm?.hoTen || hoTen
  // Bốn lệnh phụ đã nạp song song lúc mở. Chỉ lượt đọc thật kế tiếp mới làm mới;
  // serverNow của bản đầu xuất hiện không tạo thêm bốn yêu cầu trùng.
  const lanLamMoi = v.lanLamMoi ?? 0
  const [hoiDoiSbd, setHoiDoiSbd] = useState(false)
  const [mot, setMot] = useState(laMotTrang)
  const [modMot, setModMot] = useState<ModMot | null>(null)
  useEffect(() => {
    if (!mot) return
    let huy = false
    void napMot().then((m) => { if (!huy) { if (m) setModMot(() => m); else setMot(false) } })
    return () => { huy = true }
  }, [mot])

  // Tiến độ học của con: nạp cùng nhịp với "mọi thứ về con". Lỗi ⇒ giữ bản cũ; chưa từng có ⇒ khối vắng.
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
  }, [sbd, lanLamMoi, nhapHoc2])

  // LÀN PHỤ HUYNH 12/10: tổng quan về con (`/ph/con-tong-quan`, CHỈ ĐỌC) — cùng nhịp với "mọi thứ về con". Lỗi ⇒ giữ bản cũ + "Thử lại" ngay ở khối Gợi ý nhắc con;
  // máy chủ cũ chưa có lệnh ⇒ v null, các khối mới vắng (không báo lỗi giả).
  const [tq, setTq] = useState<{ v: ConTongQuan | null; daTai: boolean; chuLoi: string }>({ v: null, daTai: false, chuLoi: '' })
  const [nhapTq, setNhapTq] = useState(0)
  useEffect(() => {
    let huy = false
    void taiConTongQuan(sbd).then((r) => {
      if (huy) return
      setTq((x) => (r.kieu === 'ok' ? { v: r.v, daTai: true, chuLoi: '' } : { ...x, daTai: true, chuLoi: r.chu }))
    })
    return () => { huy = true }
  }, [sbd, lanLamMoi, nhapTq])
  const thuLaiTq = useCallback(() => { setTq((x) => ({ ...x, chuLoi: '' })); setNhapTq((x) => x + 1) }, [])
  const taiTq: TaiTongQuan = { ...tq, thuLai: thuLaiTq }

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
  useEffect(() => { napLoiThay() }, [napLoiThay, lanLamMoi])

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

  // Nhịp học của con (`/ph/nhip-hoc`): nạp lúc mở, cùng nhịp với "mọi thứ về con"; lỗi ⇒ giữ bản đã tải + lý do + Tải lại.
  const [nhip, setNhip] = useState<{ k: KetQuaNhipHocApp | null; dangTai: boolean; loi: string }>({ k: null, dangTai: true, loi: '' })
  const [nhapNhip, setNhapNhip] = useState(0)
  useEffect(() => {
    let huy = false
    setNhip((x) => ({ ...x, dangTai: true }))
    void layNhipHocCon(sbd).then((r) => {
      if (huy) return
      setNhip((x) => (r.ok ? { k: r.du, dangTai: false, loi: '' } : { k: x.k, dangTai: false, loi: r.chu }))
    })
    return () => { huy = true }
  }, [sbd, lanLamMoi, nhapNhip])
  const thuLaiNhip = useCallback(() => setNhapNhip((x) => x + 1), [])

  // Hai lệnh của phần dưới trang (Thái độ · Câu sai · Thời gian): gọi khi phần ấy SẮP cuộn tới, SONG SONG, mỗi lệnh cập nhật ngay khi về.
  const [hoSo, setHoSo] = useState<TaiHoSo>(HO_SO_TRONG)
  const luotHoSo = useRef(0)
  useEffect(() => () => { luotHoSo.current += 1 }, [])
  const napHoSo = useCallback(() => {
    const luot = ++luotHoSo.current
    setHoSo((x) => ({ ...x, daGoi: true, dangTaiTd: true, dangTaiLs: true, loiTd: '', loiLs: '' }))
    void layHoSoThaiDoCon(sbd).then((r) => {
      if (luot === luotHoSo.current) setHoSo((x) => ({ ...x, dangTaiTd: false, ...(r.ok ? { td: r.du, loiTd: '' } : { loiTd: r.chu }) }))
    })
    void layLichSuLamCauCon(sbd, GIOI_HAN_LUOT).then((r) => {
      if (luot === luotHoSo.current) setHoSo((x) => ({ ...x, dangTaiLs: false, ...(r.ok ? { ls: r.du, loiLs: '' } : { loiLs: r.chu }) }))
    })
  }, [sbd])

  // Phần đang đọc (thanh mục sáng) + phần cần cuộn tới (bấm mục ở thanh bên khi đang ở màn con, hoặc mở thẳng `#phan-…`).
  const [phanHien, setPhanHien] = useState<IdPhan>('hom-nay')
  const [denPhan, setDenPhan] = useState<{ id: IdPhan; lan: number } | null>(() => {
    const id = docPhanTuHash(typeof location === 'undefined' ? '' : location.hash)
    return id ? { id, lan: 0 } : null
  })
  const daDenPhan = useCallback(() => setDenPhan(null), [])
  const manChinh = tuyen.muc === 'hom-nay' && !tuyen.maCa
  // Vỏ cũ cần mảnh trang cũ (cả CSS của thanh bên) — chờ mảnh về rồi mới vẽ, tránh thanh bên chưa có kiểu; tải hỏng ⇒ ChanLoi báo như mọi mảnh lười.
  const canCu = !(mot && manChinh)
  const [modCu, setModCu] = useState<ModCu | null | undefined>(() => modCuDaCo)
  useEffect(() => {
    if (!canCu || modCu) return
    let huy = false
    void napCu().then((m) => { if (!huy) setModCu(() => m) })
    return () => { huy = true }
  }, [canCu, modCu])
  if (modCu === null) throw new Error('Chưa tải được trang «Hôm nay của con». Anh/chị tải lại trang.')
  const diToiPhan = (id: IdPhan) => {
    setPhanHien(id)
    if (manChinh) setDenPhan({ id, lan: Date.now() })
    else {
      setDenPhan({ id, lan: Date.now() })
      location.hash = 'hom-nay'
    }
  }

  const pTrang = {
    v, hoc2, tongQuan: taiTq, nhip: { ...nhip, thuLai: thuLaiNhip }, loiThay, thuLaiLoiThay: napLoiThay,
    canhBao: canhBao.filter((c) => !c.daXem), onDaXem: daXemCanhBao, hoSo, napHoSo, sbd, tenCon: ten, lop, denPhan, daDenPhan,
  }
  const thongBao = (
    <>
      {v.pm && v.chuLoi && <div className="ph3-lam-moi-loi" role="status"><span>Báo cáo đang hiển thị bản đã tải. {v.chuLoi}</span><button type="button" className="tt-nhan" onClick={v.thuLai}>Thử lại báo cáo</button></div>}
      {loiHoc2 && <div className="ph3-lam-moi-loi" role="status"><span>{hoc2 ? 'Tiến độ học đang hiển thị bản đã tải. ' : 'Chưa tải được tiến độ học. '}{loiHoc2}</span><button type="button" className="tt-nhan" onClick={() => setNhapHoc2((x) => x + 1)}>Thử lại tiến độ</button></div>}
    </>
  )
  const hopDoiSbd = hoiDoiSbd && (
    <HopXacNhan
      tieuDe="Đổi số báo danh?"
      noiDung={<p>Máy này sẽ quên số báo danh của con và bỏ liên kết riêng của phụ huynh đang lưu trên máy. Muốn xem lại, anh/chị mở liên kết thầy gửi hoặc nhập lại số báo danh.</p>}
      nhanHuy="Ở lại"
      nhanXacNhan="Đổi số báo danh"
      onHuy={() => setHoiDoiSbd(false)}
      onXacNhan={() => { setHoiDoiSbd(false); onDoiSbd() }}
    />
  )
  if (mot && manChinh)
    return (
      <div className="ph3 tvc-app" data-app="ph3" data-mot-trang="">
        {modMot ? <modMot.default {...pTrang} taiKhoan={<TaiKhoan ten={ten} onDoiSbd={() => setHoiDoiSbd(true)} />} thongBao={thongBao} /> : <DangTai chu="Đang mở…" />}
        {hopDoiSbd}
      </div>
    )

  if (!modCu)
    return (
      <div className="ph3 tvc-app" data-app="ph3" data-mot-trang="">
        <DangTai chu="Đang mở…" />
        {hopDoiSbd}
      </div>
    )
  const TrangVeCon = modCu.default
  let man: ReactElement
  const choMan = <DangTai chu="Đang mở…" hinh="tien-bo" />
  if (tuyen.maCa) man = <Suspense fallback={<DangTai chu="Đang mở báo cáo ca kiểm tra…" hinh="chi-tiet" />}><ManChiTietCa key={tuyen.maCa} sbd={sbd} maCa={tuyen.maCa} /></Suspense>
  else if (tuyen.muc === 'ca-kiem-tra') man = <><NutVe /><Suspense fallback={choMan}><ManDiemSo v={v} loiThay={loiThay.ds} /></Suspense></>
  else if (tuyen.muc === 'thong-tin') man = <ThongTin ten={ten} lop={lop} />
  else if (tuyen.muc === 'loi-thay') man = <ManLoiThay ds={loiThay.ds} loi={loiThay.chuLoi} thuLai={napLoiThay} />
  else if (tuyen.muc === 'tien-bo') man = <><NutVe /><Suspense fallback={choMan}><ManTienBo v={v} hoc2={hoc2} tq={tq.v} /></Suspense></>
  else
    man = (
      <TrangVeCon {...pTrang} phanHien={phanHien} onPhanHien={setPhanHien} />
    )

  const manCon = laCon(tuyen)
  const coPhan = phanCo(v.pm, tq.v)
  const nay = v.pm?.serverNow ?? null
  const mocSo = tq.v?.moc ?? nhip.k?.tu ?? null
  return (
    <div className="ph3 tvc-app" data-app="ph3">
      <div className="ph3-khung">
        <nav className="tvc-ben" aria-label="Các phần về con">
          <div className="tvc-ben-logo">
            <AnhLogo vai="ph" size={40} alt="Logo Đỗ Đại Học" />
            <div className="tvc-ben-con">
              <span>Phụ huynh em</span>
              <b>{ten}</b>
              {lop && <small>Lớp {lop}</small>}
            </div>
          </div>
          {PHAN.filter((x) => coPhan.includes(x.id)).map((x) => (
            <a
              key={x.id}
              href={`#${idPhan(x.id)}`}
              className="tvc-ben-muc tt-nhan"
              aria-current={manChinh && phanHien === x.id ? 'true' : undefined}
              onClick={(e) => { e.preventDefault(); diToiPhan(x.id) }}
            >
              <x.bt co={20} />
              <span>{x.ten}</span>
            </a>
          ))}
          {nay !== null && <p className="tvc-ben-cap">Cập nhật {gioVn(nay)} · {ngayDayDuVn(nay)}{mocSo ? <><br />Số liệu từ {ngayChuoiNgan(mocSo)}</> : null}</p>}
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
          {thongBao}
          <div key={khoaCuon(tuyen)} className={manCon ? 'tt-mo-lop' : 'tt-vao-muc'}>{man}</div>
        </main>
      </div>
      {hopDoiSbd}
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
          <p>Giao diện: sáng hoặc tối theo máy.</p>
        </article>
      </div>
    </section>
  )
}

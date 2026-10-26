import { lazy, Suspense, use, useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, Atom, BookOpen, ChevronRight, ClipboardCheck, History, Home, LineChart, LogOut, Mail, RefreshCw, Route, Users, X } from 'lucide-react'
import type { KetQuaSanh } from '../hoa2/api'
import type { TomTatGoi7 } from '../../lib/goi-bai-7'
import './hoc-tap.css'
import TheGoi7 from './TheGoi7'
const TheKiemTraCaNhan=lazy(()=>import('./TheKiemTraCaNhan'))
import TheHomNayEm, { chuNutHoc } from './TheHomNayEm'
import { soHomNay } from './lam-bai'
import { useSoCauCanSua } from '../../lib/tu-sua-loi'
import { napTrongHs, type HuaTrongHs } from './nap-trong-hs'
void napTrongHs() // «Trong» bật ⇒ nạp mảnh trình bày ngay lúc mô-đun cổng chạy (song song lệnh Sảnh)

// ĐỢT 19 (13/10 — làn N): hai tab Hành trình · Ôn & sửa thiết kế lại và biểu tượng Tự sửa lỗi vẽ riêng (BieuTuongTuSua.tsx — MỘT hình ở thẻ mời, dòng Hôm
// nay và Ôn & sửa) đều ở khối NẠP LƯỜI (luật tốc độ: không thêm byte tải mở app); nạp trước lúc rảnh sau khi Hôm nay có số ⇒ bấm tab / thẻ mời hiện là có.
const napHanhTrinhOnSua = () => import('./HanhTrinhOnSua')
const HanhTrinhOnSua = lazy(napHanhTrinhOnSua)
const HinhTuSua = lazy(() => import('./BieuTuongTuSua').then((m) => ({ default: m.BieuTuongTuSua })))
const hinhTuSua = (hien?: boolean) => <Suspense fallback={null}><HinhTuSua hien={hien} /></Suspense>

// TRÙNG TU 11/10 (thầy duyệt bản vẽ https://claude.ai/artifact/5v8vXw5zBzw53FkpCvMknC — "buid và đẩy luôn nhé"):
// 4 mục Hôm nay · Hành trình · Ôn & sửa · Kết quả; "Của em" là tấm mở từ ảnh đại diện; "Vào ca kiểm tra" luôn ở góc trên
// (ca đang mở ⇒ dải ca + nút chính là Vào ca kiểm tra, "Tiếp tục học" lùi thành nút viền). Một màn — một nút chính; mọi việc khác là dòng.
// ĐỢT 18 (13/10 — thầy: "Mời gọi học sinh tự sửa lỗi … Làm nổi bật phần tự sửa lỗi lên và mời gọi thân thiện" · "Tối ưu lại câu từ cho dễ hiểu ở mọi
// [màn]. Bỏ hết các gợi ý hướng dẫn"): thẻ mời "Tự sửa lỗi" ngay dưới thẻ Hôm nay khi còn câu cần sửa (số có nhãn + MỘT nút viền "Sửa lỗi ngay" — nút
// chính của màn vẫn là nút học); hết câu ⇒ thẻ ẩn, dòng "Tự sửa lỗi" thường hiện lại. Số từ `useSoCauCanSua` (src/lib/tu-sua-loi.ts — tải lười SAU khi
// Hôm nay có số, nhớ trong phiên, lỗi ⇒ ẩn, không bao giờ chặn thẻ Hôm nay). Dòng việc: chữ phụ ngắn (không lời dặn); bỏ câu giải thích ở Hành trình
// và tấm "Của em".
type Muc = 'hom-nay' | 'hanh-trinh' | 'on-lai' | 'ket-qua'
interface Props {
  dangLamMoi?: boolean; nguon?: string; onKetQua?: () => void; onLuyenLai?: () => void; onBangTin?: () => void;
  thongBao?: ReactNode; canhBao?: ReactNode; tienDoCu?: { daLam: number; mucTieu: number };
  ten: string; lop: string; ketQua: KetQuaSanh | null; dangTai: boolean; loi: string
  onHoc: () => void; onXemLai: () => void; onChua: (qid?: string) => void; onThi: () => void
  onTuLuyen: () => void; onLichSu: () => void; onBaiTap: () => void; onGiaDinh: () => void
  onTaiLai: () => void; onDangXuat: () => void; coCa: boolean
  /** Số bài tập về nhà thầy đang giao (dòng ở Hôm nay chỉ hiện khi > 0). */
  soBaiTap?: number
  /** Có bài tập về nhà nào (kể cả đã nộp) ⇒ Hôm nay giữ lối vào để xem lại / làm lại. */
  coBaiTap?: boolean
  /** Token phiên của em — phần Nhịp học của thẻ "Hôm nay của em" (12/10) đọc `/hs/nhip-hoc`; không có ⇒ phần ấy không hiện. */
  token?: string
  /** Có ⇒ khối Nhịp học trong thẻ "Hôm nay của em" bấm được, mở hồ sơ làm bài của em (thầy 12/10: "Cho hs bấm vào bảng lười chăm"). */
  onMoHoSo?: () => void
  onKiemTra?: () => void
}
/** Tên ngắn 4 tầng của Hành trình (thầy chốt bản vẽ 11/10). */
export const TANG = ['Nền', 'Hiểu', 'Vận dụng', 'Tổng hợp']
const MENU = [{ id: 'hom-nay', ten: 'Hôm nay', icon: Home }, { id: 'hanh-trinh', ten: 'Hành trình', icon: Route }, { id: 'on-lai', ten: 'Ôn & sửa', icon: History }, { id: 'ket-qua', ten: 'Kết quả', icon: LineChart }] as const
const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const homNayChu = () => { const d = new Date(); return `${THU[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` }
const chuCaiDau = (ten: string) => { const p = ten.trim().split(/\s+/).filter(Boolean); return ((p.length > 1 ? p[p.length - 2]![0] : '') + (p[p.length - 1]?.[0] ?? 'E')).toUpperCase() }

/** Tiêu đề việc còn lại của ngày Gói 7: tự làm + có hỗ trợ (+ câu chờ bổ sung khi kho thiếu) = mức − đã làm, không số nào mâu thuẫn vòng tròn. */
export function chuViecGoi7(g: Pick<TomTatGoi7, 'tuLamCon' | 'tiepCanCon' | 'thieuNgay'>): string {
  return `${g.tuLamCon} câu tự làm · ${g.tiepCanCon} câu học có hỗ trợ${g.thieuNgay > 0 ? ` · ${g.thieuNgay} câu chờ thầy bổ sung` : ''}`
}

/** Dòng việc: biểu tượng · tên · chữ phụ ngắn (nếu có) · số (nếu có) · mũi tên. */
function Dong({ ten, chu, icon: Icon, hinh, sac, so, donVi, onClick }: { ten: string; chu?: string; icon?: typeof Home; hinh?: ReactNode; sac?: 'cham' | 'vang' | 'muc'; so?: number; donVi?: string; onClick: () => void }) {
  return <button className="ht2-dong" onClick={onClick}>
    <span className="ht2-dong-bt" data-sac={sac} aria-hidden="true">{hinh ?? (Icon && <Icon size={20} />)}</span>
    <span className="ht2-dong-chu"><strong>{ten}</strong>{chu && <small>{chu}</small>}</span>
    {so !== undefined && <b className="ht2-dong-so">{so}<small> {donVi}</small></b>}
    <ChevronRight size={20} aria-hidden="true" className="ht2-dong-mui" />
  </button>
}

/** Tên mục Tự sửa lỗi (chữ của thầy 13/10) — MỘT tên ở Hôm nay, Ôn & sửa và đầu màn Tự sửa lỗi. */
export const TEN_TU_SUA = 'Tự sửa lỗi'

/** Thẻ mời Tự sửa lỗi ở Hôm nay (thầy 20/10: "Hôm nay sửa 12 câu", chia chặng — thay cho một con số lớn làm em nản). Vỏ mỏng: thẻ thật (cả thẻ cũ lẫn việc hôm nay) ở khối NẠP LƯỜI
 *  `TheMoiTuSua.tsx` (đi cùng khối mã màn Tự sửa lỗi), nạp trước lúc trình duyệt rảnh (cùng lượt nạp Hành trình / Ôn & sửa) ⇒ không thêm byte tải mở app; chưa nạp xong thì chưa vẽ thẻ (như khi chưa có số). Chỉ hiện khi biết chắc còn câu cần sửa. */
const napTheMoi = () => import('./ManTuChua')
const TheMoi = lazy(() => napTheMoi().then((m) => ({ default: m.TheMoiTuSua })))
export function TheMoiTuSua(p: { so: number | null; token?: string; onChua: (qid?: string) => void }) {
  if (!p.so || p.so <= 0) return null
  return <Suspense fallback={null}><TheMoi {...p} /></Suspense>
}

export default function HocTapHomNay(p: Props) {
  const [muc, setMuc] = useState<Muc>('hom-nay')
  const [moCuaEm, setMoCuaEm] = useState(false)
  const nutCuaEm = useRef<HTMLButtonElement>(null)
  const tamCuaEm = useRef<HTMLDivElement>(null)
  const sanh = p.ketQua?.cheDo2 && 'sanh' in p.ketQua ? p.ketQua.sanh : null
  const ht = sanh?.hanhTrinh
  const goi7 = sanh?.goi7
  const kiem=sanh?.kiemTraCaNhan, ngayKiem=kiem?.homNay===true&&!kiem.baiNgayToiThieu, kiemHomNay=kiem?.homNay===true
  // MỘT CON SỐ (thầy 12/10: "học sinh làm 24 câu nhưng lại báo 31 câu"): M và đã làm của hôm nay lấy MỘT chỗ — `soHomNay` (Gói 7 → Hành trình → thể
  // lực → kế hoạch cũ), cùng hàm màn làm bài dùng. "Đủ mức" khi đã làm ≥ M — đúng `datMuc` phía thầy / phụ huynh / Nhịp học; câu mới theo lịch còn lại
  // của gói KHÔNG chặn chữ đạt (máy chủ đã xếp chúng trong mức; phần chưa gặp dồn sang ngày sau).
  const so = soHomNay(p.ketQua, p.tienDoCu)
  // `theLuc.con` = số việc kế hoạch XẾP ĐƯỢC lúc này. Gói 7 (khẩn 12/10 21h30): kho thiếu câu sẵn sàng (giữ cho ca kiểm tra, BTVN, chờ duyệt…) ⇒ con
  // có thể nhỏ hơn M − đã làm. Em VẪN bấm học được phần đã xếp; CHỈ khoá khi hết hẳn việc xếp được (con = 0), lúc ấy chưa đủ mức thì nút nói rõ
  // "Hôm nay còn N câu chờ thầy bổ sung" (N = M − đã làm). "Còn N câu" phía trên luôn theo M (`soHomNay`), không theo `theLuc`.
  const con = sanh?.theLuc.con ?? null
  const khoaHoc = p.dangLamMoi || p.dangTai && !sanh || con === 0
  const conMuc = so ? Math.max(0, so.muc - so.daLam) : 0
  const kho = goi7 ? { choBoSung: con === 0 ? conMuc : 0, sanSang: con ?? undefined } : undefined
  // Thẻ mời Tự sửa lỗi: tải lười khi Hôm nay đã có số (không tranh lượt với Sảnh); em làm thêm câu ⇒ xem lại bản nhớ (hết hạn mới hỏi máy chủ).
  const soSua = useSoCauCanSua(p.token, !!sanh || !p.dangTai, so?.daLam)
  const coMoiSua = !!soSua && soSua > 0
  // Mở chặng trước (thầy 16/10 "load lâu quá … tối ưu tốc độ tức thì"): Hôm nay đã có số, nút Học tiếp bấm được ⇒ gọi sẵn lệnh mở chặng để em bấm là có câu
  // ngay (mo-chang-truoc.ts — kết quả y hệt gọi lúc bấm; mỗi token tối đa một lượt mỗi 10 phút). Nạp ĐỘNG mảnh màn làm bài (cùng mảnh nút Học tiếp mở): không
  // thêm tệp vào lượt mở app / precache, và màn làm bài được nạp sẵn luôn.
  const coTheHoc = !!sanh && !ngayKiem && !khoaHoc && !!con && con > 0 && !p.coCa
  useEffect(() => { if (coTheHoc && p.token) { const token = p.token; void import('./ManLamBaiTap').then((m) => m.moChangTruoc(token)).catch(() => {}) } }, [coTheHoc, p.token])

  // Tấm "Của em": Esc đóng, focus vào tấm khi mở và trả về ảnh đại diện khi đóng.
  useEffect(() => {
    if (!moCuaEm) return
    tamCuaEm.current?.focus()
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoCuaEm(false) }
    window.addEventListener('keydown', f)
    return () => { window.removeEventListener('keydown', f); nutCuaEm.current?.focus() }
  }, [moCuaEm])
  const dongTam = (fn: () => void) => () => { setMoCuaEm(false); fn() }
  // GIAO DIỆN «TRONG» (bản vẽ hs-hom-nay.html, thầy chốt 26/10): logo thật ở thanh trên; Hôm nay chia CỘT CHÍNH (thẻ Hôm nay · Kiểm tra ôn tập · Bài học
  // 7 ngày) | CỘT PHỤ (Tự sửa lỗi · Nhịp học · Ôn và sửa) — trình bày ở src/styles/trong-hs.css; điện thoại một cột cùng thứ tự. Lùi (ddh.trong = 'tat') ⇒ y cũ.
  // Nhóm "Ôn và sửa" — MỘT khối JSX cho cả hai giao diện (cũ: cuối màn; «Trong»: cuối cột phụ).
  const nhomOnSua = <section className="ht2-nhom" aria-label="Ôn và sửa">
    <h2>Ôn và sửa</h2>
    {!coMoiSua && <Dong ten={TEN_TU_SUA} chu={soSua === 0 ? 'Không còn câu cần sửa' : 'Câu em làm sai'} hinh={hinhTuSua()} onClick={p.onChua} />}
    <Dong ten="Câu đã làm" chu="Lời giải và lịch ôn từng câu" icon={History} sac="vang" onClick={p.onXemLai} />
    {/* Lối DUY NHẤT vào Bài tập về nhà (thầy 13/10 bỏ ở Kết quả): còn bài chưa nộp ⇒ "Thầy đang giao" + số bài; chỉ còn bài đã nộp ⇒ vẫn hiện để em
        xem điểm / làm lại lượt còn. */}
    {(!!p.soBaiTap || !!p.coBaiTap) && <Dong ten="Bài tập về nhà" chu={p.soBaiTap ? 'Thầy đang giao' : 'Xem lại bài đã nộp'} icon={BookOpen} sac="muc" so={p.soBaiTap || undefined} donVi="bài" onClick={p.onBaiTap} />}
  </section>
  const [oNhip, datONhip] = useState<HTMLDivElement | null>(null)
  // Nạp trước khối Hành trình / Ôn & sửa lúc trình duyệt rảnh, sau khi Hôm nay đã có số (không tranh lượt tải đầu).
  const coSanh = !!sanh
  useEffect(() => {
    if (!coSanh) return
    const w = window as Window & { requestIdleCallback?: (f: () => void) => number; cancelIdleCallback?: (id: number) => void }
    const nap = () => { void napHanhTrinhOnSua().catch(() => {}); void napTheMoi().catch(() => {}) }
    if (w.requestIdleCallback) { const id = w.requestIdleCallback(nap); return () => w.cancelIdleCallback?.(id) }
    const id = window.setTimeout(nap, 1500); return () => window.clearTimeout(id)
  }, [coSanh])

  // «Trong»: mảnh trình bày nạp lười (nap-trong-hs.ts) — chờ có rồi mới vẽ (không chớp bản thiếu kiểu); không bật / tải hỏng ⇒ bản cũ y nguyên.
  const huaTrong = napTrongHs()
  const ve = (trong: boolean) => { return <div className="ht-app ht2" data-nguon={p.nguon}>
    <header className="ht-thanh ht2-thanh">
      <a className="ht-thuong-hieu" href="/hs"><span className="ht2-logo" aria-hidden="true"><Atom size={22} /></span><span>Đỗ Đại Học<small>Học Hoá mỗi ngày</small></span></a>
      <div className="ht2-thanh-phai">
        {!p.coCa && <button className="ht2-nut-thi" onClick={p.onThi}><ClipboardCheck size={18} aria-hidden="true" />Vào ca kiểm tra</button>}
        {p.thongBao}
        <button className="ht-nut-bieu-tuong" onClick={p.onTaiLai} aria-label="Cập nhật bài học" disabled={p.dangTai}><RefreshCw size={19} aria-hidden="true" /></button>
        <button ref={nutCuaEm} className="ht2-anh" onClick={() => setMoCuaEm(true)} aria-label="Của em" aria-haspopup="dialog" aria-expanded={moCuaEm}>{chuCaiDau(p.ten || 'Em')}</button>
      </div>
    </header>
    <div className="ht-khung">
      <nav className="ht-menu" aria-label="Điều hướng học sinh">{MENU.map(({ id, ten, icon: Icon }) => <button key={id} onClick={() => setMuc(id)} aria-current={muc === id ? 'page' : undefined}><Icon size={21} aria-hidden="true" /><span>{ten}</span></button>)}</nav>
      <main className="ht-noi-dung ht2-noi-dung tt-vao-muc" key={muc}>
        <div className="ht2-mo-dau"><p>{homNayChu()}{p.lop ? ` · ${p.lop}` : ''}{muc === 'hanh-trinh' && sanh?.chienDich?.ten ? ` · ${sanh.chienDich.ten}` : ''}</p><h1>{muc === 'hom-nay' ? `Chào ${p.ten || 'em'}` : MENU.find(x => x.id === muc)?.ten}</h1></div>
        {p.canhBao}
        {p.dangLamMoi && <p className="ht-thong-bao" data-vung="dang-lam-moi" role="status">App đang làm mới, khoảng 1–5 phút. Em cứ để app mở, app tự vào lại.</p>}
        {p.loi && <div className="ht-thong-bao ht2-loi" role="alert"><span>{p.loi}</span><button className="ht-nut-phu" onClick={p.onTaiLai}>Thử lại</button></div>}
        {p.coCa && <section className="ht2-ca" aria-label="Ca kiểm tra đang mở"><span className="ht2-dong-bt" data-sac="cham" aria-hidden="true"><ClipboardCheck size={20} /></span><span className="ht2-ca-chu"><strong>Ca kiểm tra đang mở</strong><small>Nhập mã ca và mật khẩu thầy cung cấp để vào phòng kiểm tra.</small></span><button className="ht-nut-chinh ht2-nut-lon" onClick={p.onThi}>Vào ca kiểm tra<ArrowRight size={20} aria-hidden="true" /></button></section>}

        {muc === 'hom-nay' && (trong ? <div className="tr-hn-luoi">
          <div className="tr-hn-cot">
            {kiem&&kiemHomNay&&<Suspense fallback={<p role="status">Đang mở lịch kiểm tra…</p>}><TheKiemTraCaNhan du={kiem} onMo={p.onKiemTra} disabled={p.coCa}/></Suspense>}
            {!ngayKiem&&<><TheHomNayEm so={so} dangTai={p.dangTai && !sanh} ngayChu={homNayChu()} tenBai={goi7?.goi[0]?.ten || sanh?.chienDich?.ten || undefined}
              viec={goi7 ? chuViecGoi7(goi7) : ht ? `${TANG[ht.tang - 1] || 'Bài học'} · Chặng ${ht.changHienTai}/${ht.soChang}` : undefined}
              onHoc={p.onHoc} khoaHoc={khoaHoc} hetCau={con === 0} choBoSung={kho?.choBoSung} sanSang={kho?.sanSang} nutPhu={p.coCa} token={p.token} onMoHoSo={p.onMoHoSo} noiNhip={oNhip} />
            {kiem&&!kiemHomNay&&<Suspense fallback={null}><TheKiemTraCaNhan du={kiem} onMo={p.onKiemTra} disabled={p.coCa}/></Suspense>}
            {goi7 && <TheGoi7 du={goi7} />}
            {!!ht?.conThieu && <div className="ht-thong-bao">Hôm nay còn thiếu {ht.conThieu} câu phù hợp. Em vẫn làm được phần đã có.</div>}
            {!!sanh?.tamGiuCa && <div className="ht-thong-bao">Một số câu đang được giữ cho ca kiểm tra.</div>}</>}
          </div>
          <div className="tr-hn-cot">
            {!ngayKiem&&<><TheMoiTuSua so={soSua} token={p.token} onChua={p.onChua} />
            <div ref={datONhip} className="tr-o-nhip" />
            {nhomOnSua}</>}
          </div>
        </div> : <>
          {/* Thầy 12/10: "gộp 2 phần làm bài này vào làm một … tập trung vào việc nhắc học sinh làm bao nhiêu câu" — MỘT thẻ thay vòng "Mục tiêu hôm nay"
              và bảng "Nhịp học của em": Còn N câu · vạch chặng · MỘT nút học · Nhịp học gọn (lỗi ⇒ ẩn gọn). */}
          {/* Đợt 20 (bản vẽ docs/ban-ve-dot20): ngày kiểm tra ⇒ thẻ kiểm tra là khối CHÍNH; ngày khác (sắp đến / đang chuẩn bị) ⇒ thẻ phụ NẰM SAU khối học.
              Thầy 14/10 ("khi nào tới lịch kiểm tra thì hiển bảng đó lên đầu và mở nút bắt đầu kiểm tra"): ngày kiểm tra có kèm kế hoạch học nhẹ cũng đưa thẻ
              kiểm tra (nút Làm bài kiểm tra) lên ĐẦU, khối học nhẹ nằm sau. */}
          {kiem&&kiemHomNay&&<Suspense fallback={<p role="status">Đang mở lịch kiểm tra…</p>}><TheKiemTraCaNhan du={kiem} onMo={p.onKiemTra} disabled={p.coCa}/></Suspense>}
          {!ngayKiem&&<><TheHomNayEm so={so} dangTai={p.dangTai && !sanh} ngayChu={homNayChu()} tenBai={goi7?.goi[0]?.ten || sanh?.chienDich?.ten || undefined}
            viec={goi7 ? chuViecGoi7(goi7) : ht ? `${TANG[ht.tang - 1] || 'Bài học'} · Chặng ${ht.changHienTai}/${ht.soChang}` : undefined}
            onHoc={p.onHoc} khoaHoc={khoaHoc} hetCau={con === 0} choBoSung={kho?.choBoSung} sanSang={kho?.sanSang} nutPhu={p.coCa} token={p.token} onMoHoSo={p.onMoHoSo} />
          {kiem&&!kiemHomNay&&<Suspense fallback={null}><TheKiemTraCaNhan du={kiem} onMo={p.onKiemTra} disabled={p.coCa}/></Suspense>}
          <TheMoiTuSua so={soSua} token={p.token} onChua={p.onChua} />
          {goi7 && <TheGoi7 du={goi7} />}
          {!!ht?.conThieu && <div className="ht-thong-bao">Hôm nay còn thiếu {ht.conThieu} câu phù hợp. Em vẫn làm được phần đã có.</div>}
          {!!sanh?.tamGiuCa && <div className="ht-thong-bao">Một số câu đang được giữ cho ca kiểm tra.</div>}
          {nhomOnSua}
          </>}
        </>)}

        {(muc === 'hanh-trinh' || muc === 'on-lai') && <Suspense fallback={<div className="ht2-cho-tab" role="status" aria-busy="true" aria-label="Đang mở" />}>
          <HanhTrinhOnSua muc={muc} sanh={sanh} dangTai={p.dangTai} soSua={soSua}
            // Ngày có lịch kiểm tra cá nhân (PR258): thẻ kiểm tra thay nút Học tiếp — như bản trước khi trùng tu Hành trình.
            nut={ngayKiem && kiem
              ? <Suspense fallback={<p role="status">Đang mở lịch kiểm tra…</p>}><TheKiemTraCaNhan du={kiem} onMo={p.onKiemTra} disabled={p.coCa} /></Suspense>
              : <button type="button" className="htn-nut" data-phu={p.coCa || undefined} onClick={p.onHoc} disabled={khoaHoc}>{chuNutHoc(so, con === 0, kho)}<ArrowRight size={20} aria-hidden="true" /></button>}
            onChua={p.onChua} onXemLai={p.onXemLai} onTuLuyen={p.onTuLuyen} onLuyenLai={p.onLuyenLai} />
        </Suspense>}

        {muc === 'ket-qua' && <section className="ht2-nhom" aria-label="Kết quả">
          <h2>Điểm thầy đã công bố</h2>
          <Dong ten="Ca kiểm tra" chu="Điểm và lời giải ca đã công bố" icon={LineChart} sac="cham" onClick={p.onLichSu} />
          {p.onKetQua && <Dong ten="Kết quả bài đã nộp" chu="Điểm và báo cáo đã công bố" icon={ClipboardCheck} sac="vang" onClick={p.onKetQua} />}
        </section>}
      </main>
    </div>

    {moCuaEm && <div className="ht2-phu-nen">
      <div ref={tamCuaEm} className="ht2-tam" role="dialog" aria-modal="true" aria-label="Của em" tabIndex={-1}>
        <div className="ht2-tam-dau">
          <span className="ht2-anh ht2-anh-lon" aria-hidden="true">{chuCaiDau(p.ten || 'Em')}</span>
          <span className="ht2-tam-ten"><strong>{p.ten || 'Học sinh'}</strong><small>{p.lop || 'Học sinh'}</small></span>
          <button className="ht-nut-bieu-tuong" onClick={() => setMoCuaEm(false)} aria-label="Đóng"><X size={18} aria-hidden="true" /></button>
        </div>
        <div className="ht2-nhom ht2-nhom-tam">
          <Dong ten="Bài gia đình giao" icon={Mail} sac="muc" onClick={dongTam(p.onGiaDinh)} />
          {p.onBangTin && <Dong ten="Thông tin từ gia đình" chu="Lời nhắn và thông báo" icon={Users} sac="muc" onClick={dongTam(p.onBangTin)} />}
        </div>
        <button className="ht-nut-phu ht2-dang-xuat" onClick={dongTam(p.onDangXuat)}><LogOut size={18} aria-hidden="true" />Đăng xuất</button>
      </div>
    </div>}
  </div> }
  if (!huaTrong) return ve(false)
  return <Suspense fallback={<div className="ht-app ht2" aria-busy="true" />}><CongTrong hua={huaTrong} ve={ve} /></Suspense>
}

/** Cổng «Trong»: đọc lời hứa nạp mảnh trình bày (React 19 `use` — đã xong thì vẽ ngay); null (tải hỏng) ⇒ bản cũ. */
function CongTrong({ hua, ve }: { hua: HuaTrongHs; ve: (trong: boolean) => ReactNode }) {
  return <>{ve(!!use(hua))}</>
}

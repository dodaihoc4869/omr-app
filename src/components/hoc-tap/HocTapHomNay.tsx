import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, Atom, BookOpen, Check, ChevronRight, ClipboardCheck, FileClock, History, Home, LineChart, LogOut, Mail, PenLine, RefreshCw, Route, Target, Users, X } from 'lucide-react'
import type { KetQuaSanh } from '../hoa2/api'
import type { TomTatGoi7 } from '../../lib/goi-bai-7'
import './hoc-tap.css'
import TheGoi7 from './TheGoi7'
import TheHomNayEm, { chuNutHoc } from './TheHomNayEm'
import { soHomNay } from './lam-bai'
import { useSoCauCanSua } from '../../lib/tu-sua-loi'

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
  onHoc: () => void; onXemLai: () => void; onChua: () => void; onThi: () => void
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
function Dong({ ten, chu, icon: Icon, sac, so, donVi, onClick }: { ten: string; chu?: string; icon: typeof Home; sac: 'cham' | 'vang' | 'muc'; so?: number; donVi?: string; onClick: () => void }) {
  return <button className="ht2-dong" onClick={onClick}>
    <span className="ht2-dong-bt" data-sac={sac} aria-hidden="true"><Icon size={20} /></span>
    <span className="ht2-dong-chu"><strong>{ten}</strong>{chu && <small>{chu}</small>}</span>
    {so !== undefined && <b className="ht2-dong-so">{so}<small> {donVi}</small></b>}
    <ChevronRight size={20} aria-hidden="true" className="ht2-dong-mui" />
  </button>
}

/** Tên mục Tự sửa lỗi (chữ của thầy 13/10) — MỘT tên ở Hôm nay, Ôn & sửa và đầu màn Tự sửa lỗi. */
export const TEN_TU_SUA = 'Tự sửa lỗi'

/** Thẻ mời Tự sửa lỗi ở Hôm nay: chỉ hiện khi biết chắc còn câu cần sửa (`so` > 0); 0 / chưa có số ⇒ không vẽ gì. */
export function TheMoiTuSua({ so, onChua }: { so: number | null; onChua: () => void }) {
  if (!so || so <= 0) return null
  return <section className="ht2-moi-sua" aria-labelledby="ht2-moi-sua-tieu">
    <span className="ht2-moi-sua-bt" aria-hidden="true"><PenLine size={24} /></span>
    <div className="ht2-moi-sua-chu">
      <span className="ht2-moi-sua-nhan">{TEN_TU_SUA}</span>
      <h2 id="ht2-moi-sua-tieu"><b>{so}</b> câu đang chờ em sửa</h2>
    </div>
    <button type="button" className="ht2-moi-sua-nut" onClick={onChua}>Sửa lỗi ngay<ArrowRight size={20} aria-hidden="true" /></button>
  </section>
}

export default function HocTapHomNay(p: Props) {
  const [muc, setMuc] = useState<Muc>('hom-nay')
  const [moCuaEm, setMoCuaEm] = useState(false)
  const nutCuaEm = useRef<HTMLButtonElement>(null)
  const tamCuaEm = useRef<HTMLDivElement>(null)
  const sanh = p.ketQua?.cheDo2 && 'sanh' in p.ketQua ? p.ketQua.sanh : null
  const ht = sanh?.hanhTrinh
  const goi7 = sanh?.goi7
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
  const baiXep = [...(ht?.bai ?? [])].sort((a, b) => b.tangMo - a.tangMo)
  // Thẻ mời Tự sửa lỗi: tải lười khi Hôm nay đã có số (không tranh lượt với Sảnh); em làm thêm câu ⇒ xem lại bản nhớ (hết hạn mới hỏi máy chủ).
  const soSua = useSoCauCanSua(p.token, !!sanh || !p.dangTai, so?.daLam)
  const coMoiSua = !!soSua && soSua > 0

  // Tấm "Của em": Esc đóng, focus vào tấm khi mở và trả về ảnh đại diện khi đóng.
  useEffect(() => {
    if (!moCuaEm) return
    tamCuaEm.current?.focus()
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoCuaEm(false) }
    window.addEventListener('keydown', f)
    return () => { window.removeEventListener('keydown', f); nutCuaEm.current?.focus() }
  }, [moCuaEm])
  const dongTam = (fn: () => void) => () => { setMoCuaEm(false); fn() }

  const nutHoc = (phu: boolean) => <button className={phu ? 'ht-nut-phu ht2-nut-lon' : 'ht-nut-chinh ht2-nut-lon'} onClick={p.onHoc} disabled={khoaHoc}>{chuNutHoc(so, con === 0, kho)}<ArrowRight size={20} aria-hidden="true" /></button>

  return <div className="ht-app ht2" data-nguon={p.nguon}>
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
        {p.dangLamMoi && <p className="ht-thong-bao" data-vung="dang-lam-moi" role="status">Hệ thống đang làm mới, khoảng 1–5 phút. Em cứ để app mở, app tự vào lại.</p>}
        {p.loi && <div className="ht-thong-bao ht2-loi" role="alert"><span>{p.loi}</span><button className="ht-nut-phu" onClick={p.onTaiLai}>Thử lại</button></div>}
        {p.coCa && <section className="ht2-ca" aria-label="Ca kiểm tra đang mở"><span className="ht2-dong-bt" data-sac="cham" aria-hidden="true"><ClipboardCheck size={20} /></span><span className="ht2-ca-chu"><strong>Ca kiểm tra đang mở</strong><small>Nhập mã ca và mật khẩu thầy cung cấp để vào phòng kiểm tra.</small></span><button className="ht-nut-chinh ht2-nut-lon" onClick={p.onThi}>Vào ca kiểm tra<ArrowRight size={20} aria-hidden="true" /></button></section>}

        {muc === 'hom-nay' && <>
          {/* Thầy 12/10: "gộp 2 phần làm bài này vào làm một … tập trung vào việc nhắc học sinh làm bao nhiêu câu" — MỘT thẻ thay vòng "Mục tiêu hôm nay"
              và bảng "Nhịp học của em": Còn N câu · vạch chặng · MỘT nút học · Nhịp học gọn (lỗi ⇒ ẩn gọn). */}
          <TheHomNayEm so={so} dangTai={p.dangTai && !sanh} ngayChu={homNayChu()} tenBai={goi7?.goi[0]?.ten || sanh?.chienDich?.ten || undefined}
            viec={goi7 ? chuViecGoi7(goi7) : ht ? `${TANG[ht.tang - 1] || 'Bài học'} · Chặng ${ht.changHienTai}/${ht.soChang}` : undefined}
            onHoc={p.onHoc} khoaHoc={khoaHoc} hetCau={con === 0} choBoSung={kho?.choBoSung} sanSang={kho?.sanSang} nutPhu={p.coCa} token={p.token} onMoHoSo={p.onMoHoSo} />
          <TheMoiTuSua so={soSua} onChua={p.onChua} />
          {goi7 && <TheGoi7 du={goi7} />}
          {!!ht?.conThieu && <div className="ht-thong-bao">Hôm nay còn thiếu {ht.conThieu} câu phù hợp. Em vẫn làm được phần đã có.</div>}
          {!!sanh?.tamGiuCa && <div className="ht-thong-bao">Một số câu đang được giữ cho ca kiểm tra.</div>}
          <section className="ht2-nhom" aria-label="Ôn và sửa">
            <h2>Ôn và sửa</h2>
            {!coMoiSua && <Dong ten={TEN_TU_SUA} chu={soSua === 0 ? 'Không còn câu cần sửa' : 'Câu em làm sai'} icon={PenLine} sac="cham" onClick={p.onChua} />}
            <Dong ten="Câu đã làm" chu="Lời giải và lịch ôn từng câu" icon={History} sac="vang" onClick={p.onXemLai} />
            {/* Lối DUY NHẤT vào Bài tập về nhà (thầy 13/10 bỏ ở Kết quả): còn bài chưa nộp ⇒ "Thầy đang giao" + số bài; chỉ còn bài đã nộp ⇒ vẫn hiện để em
                xem điểm / làm lại lượt còn. */}
            {(!!p.soBaiTap || !!p.coBaiTap) && <Dong ten="Bài tập về nhà" chu={p.soBaiTap ? 'Thầy đang giao' : 'Xem lại bài đã nộp'} icon={BookOpen} sac="muc" so={p.soBaiTap || undefined} donVi="bài" onClick={p.onBaiTap} />}
          </section>
        </>}

        {muc === 'hanh-trinh' && <>
          <section className="ht2-the">
            <p className="ht2-nhan">Thang 4 tầng của mỗi bài</p>
            <ol className="ht2-thang" aria-label={ht ? `Tầng đang luyện: ${TANG[ht.tang - 1] ?? ''}` : 'Thang 4 tầng'}>
              {TANG.map((t, i) => { const tt = !ht ? 'cho' : i + 1 < ht.tang ? 'vung' : i + 1 === ht.tang ? 'dang' : 'cho'; return <li key={t} data-tt={tt}><span>{tt === 'vung' ? <Check size={16} aria-label="Đã vững" /> : i + 1}</span>{t}</li> })}
            </ol>
          </section>
          <section className="ht2-nhom" aria-label="Các bài trong Hành trình">
            <h2>{baiXep.length ? `${baiXep.length} bài trong Hành trình` : sanh?.chienDich?.ten || 'Bài học được giao'}</h2>
            {baiXep.length ? baiXep.map(b => <div className="ht2-bai" key={b.khoa}>
              <div className="ht2-bai-dau"><strong>{b.ten}</strong><span className="ht2-chip" data-sac="cham">{TANG[b.tangMo - 1]}</span></div>
              <div className="ht2-bai-nac" aria-label={`Đang luyện tầng ${TANG[b.tangMo - 1]}`}>{TANG.map((t, i) => <i key={t} data-tt={i + 1 < b.tangMo ? 'vung' : i + 1 === b.tangMo ? 'dang' : 'cho'} />)}</div>
            </div>) : <p className="ht-trong">Chưa có danh sách bài.</p>}
            <p className="ht-chu-phu">Vàng trầm: đã vững · chàm: đang luyện · xám: còn khoá.</p>
          </section>
          {nutHoc(p.coCa)}
        </>}

        {muc === 'on-lai' && <section className="ht2-nhom" aria-label="Ôn và sửa">
          <Dong ten={TEN_TU_SUA} chu={soSua === 0 ? 'Không còn câu cần sửa' : coMoiSua ? 'Câu đang chờ em sửa' : 'Câu em làm sai'} icon={PenLine} sac="cham" so={coMoiSua ? soSua : undefined} donVi="câu" onClick={p.onChua} />
          <Dong ten="Câu đã làm" chu="Lời giải và lịch ôn từng câu" icon={History} sac="vang" onClick={p.onXemLai} />
          <Dong ten="Tu luyện" chu="Luyện thêm theo chương, dạng, mức" icon={Target} sac="muc" onClick={p.onTuLuyen} />
          {p.onLuyenLai && <Dong ten="Luyện lại từ bài kiểm tra" chu="Câu sai trong các bài kiểm tra" icon={FileClock} sac="muc" onClick={p.onLuyenLai} />}
        </section>}

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
  </div>
}

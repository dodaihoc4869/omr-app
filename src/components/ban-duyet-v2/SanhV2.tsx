// BẢN DUYỆT V2 · MÀN 00/01 — "HÔM NAY" CỦA HỌC SINH (thầy ra lệnh 09/10/2026: "Màn hình chính học sinh (hỗ trợ cả dọc mobile và ngang desktop)").
// Bố cục theo bản duyệt: ảnh anh hùng (cảnh đảo + thần thú của em) · thẻ "Hôm nay" (số câu + 3 bước + MỘT nút vàng) · thẻ Rương · "Đang mạnh lên" ·
// thanh dưới 4 mục (Hôm nay / Hành trình / Thần thú / Câu đã làm). Dọc: xếp chồng; ngang/máy tính: ảnh anh hùng trên, hai cột dưới.
// MỌI con số lấy từ máy chủ (`hoa2-sanh` + kế hoạch ngày) — không tự tính, không bịa. Bản duyệt có vài số MINH HOẠ mà máy chủ CHƯA gửi
// (phút học hôm nay, mục tiêu 8,5+, chấm từng câu của từng bước, danh sách chủ đề "đang mạnh lên"): màn KHÔNG vẽ những số đó;
// ô "Đang mạnh lên" chỉ hiện khi OMNI gửi `dangVung` (Dạng vững a/b). Nút, luồng, khoá Đảo, Huyết Chiến, Bi-a, Tu luyện, lối vào ca kiểm tra giữ nguyên
// (dùng lại đúng khối của Sảnh cũ — src/components/hoa2/SanhBanDo.tsx). Lỗi bất kỳ trong màn này ⇒ SanhHomNay rơi về Sảnh cũ.
import { useState, type ReactNode } from 'react'
import { BookOpenCheck, CalendarDays, Compass, Home, Map as BanDo, PawPrint, Sparkles, TrendingUp, Lock } from 'lucide-react'
import { anhThu } from '../../game/than-thu-v2/dao/anh'
import type { SanhBanDoProps } from '../hoa2/SanhBanDo'
import {
  DaiVaoThi,
  DongChienDich,
  IconCa,
  IconChuoi,
  IconCuaHang,
  IconDangXuat,
  IconTui,
  NutBia,
  NutOmniThem,
  NutThuSucThem,
  NutTuLuyen,
  TheCaGanNhatSanh,
  TheHuyetChien,
  TheMetGio,
  XongHomNay,
  chuChuaCoChienDich,
  chuKhongConCau,
} from '../hoa2/SanhBanDo'
import type { SanhHoa2 } from '../hoa2/api'
import { chuDangVung } from '../../lib/omni-chu'
import { useBoCucNgang } from '../hoa2/bo-cuc-ngang'
import { boCuaNhanh, useNapTruocManSanh } from '../hoa2/man-sanh-luoi'
import BanDoHanhTrinh from '../bat-linh/BanDoHanhTrinh'
import '../hoa2/phong-baloo'
import '../../styles/ban-duyet-v2.css'
import './sanh-v2.css'

export interface SanhV2Props extends SanhBanDoProps {
  /** Họ tên đầy đủ của em (phiên đăng nhập). */
  tenEm: string
  /** Tên lớp (vd "12A1", "12 - Tinh Hoa") — chỉ để đọc khối 10/11/12. */
  lop: string
}

const TEN_TANG = ['Nền', 'Hiểu', 'Vận dụng', 'Tổng hợp'] as const

/** Tên gọi trong lời chào: hai chữ cuối của họ tên ba chữ trở lên ("Nguyễn Minh Anh" → "Minh Anh"), còn lại giữ nguyên. */
export function tenGoi(hoTen: string): string {
  const chu = hoTen.trim().split(/\s+/).filter(Boolean)
  if (chu.length === 0) return ''
  return chu.length >= 3 ? chu.slice(-2).join(' ') : chu.join(' ')
}

/** Khối 10/11/12 đọc từ tên lớp ("12A1", "12 - Tinh Hoa", "Lớp 11B"); không đọc được ⇒ null (tiêu đề không ghi khối). */
export function khoiTuLop(lop: string): 10 | 11 | 12 | null {
  const m = /(?:^|\D)(1[012])(?!\d)/.exec(lop ?? '')
  return m ? (Number(m[1]) as 10 | 11 | 12) : null
}

/** Số câu "đã làm / cần làm" hôm nay: Hành trình ⇒ tối thiểu của ngày; chiến dịch ⇒ thể lực (đã dùng / tổng). */
export function soCauHomNay(s: SanhHoa2): { da: number; tong: number } {
  if (s.hanhTrinh) return { da: s.hanhTrinh.daLam, tong: s.hanhTrinh.toiThieu }
  return { da: Math.max(0, s.theLuc.tong - s.theLuc.con), tong: s.theLuc.tong }
}

type TrangThaiBuoc = 'xong' | 'dang' | 'cho' | 'khoa'
interface Buoc {
  so: 1 | 2 | 3
  nhan: string
  phu: string
  tt: TrangThaiBuoc
}

/** Ba bước của ngày, dựng từ đúng số máy chủ gửi (không có số "đã làm" từng bước ⇒ chỉ nói còn bao nhiêu / xong / chờ). */
export function baBuoc(s: SanhHoa2): Buoc[] {
  const xong = s.theLuc.tong > 0 && s.theLuc.con === 0
  const b1: Buoc =
    s.doan.con > 0
      ? { so: 1, nhan: `Gỡ ${s.doan.con} lỗi cũ`, phu: 'Đoàn Hộ Tống', tt: 'dang' }
      : { so: 1, nhan: 'Gỡ lỗi cũ', phu: 'Không còn lỗi cũ', tt: 'xong' }
  const b2: Buoc =
    s.dao.con > 0
      ? { so: 2, nhan: `Luyện ${s.dao.con} câu mới`, phu: s.khoaDao ? 'Mở sau khi gỡ lỗi cũ' : 'Bát Linh Đảo', tt: s.khoaDao ? 'khoa' : s.doan.con > 0 ? 'cho' : 'dang' }
      : { so: 2, nhan: 'Luyện câu mới', phu: xong ? 'Đã xong' : 'Không còn câu mới', tt: 'xong' }
  const coThuSuc = s.thuSucThem.duoc && s.thuSucThem.soCau > 0
  const b3: Buoc = xong
    ? coThuSuc
      ? { so: 3, nhan: `Thử thách +1 bậc`, phu: `${s.thuSucThem.soCau} câu · không bắt buộc`, tt: 'dang' }
      : { so: 3, nhan: 'Thử thách +1 bậc', phu: 'Không bắt buộc', tt: 'xong' }
    : { so: 3, nhan: 'Thử thách +1 bậc', phu: 'Mở khi xong kế hoạch', tt: 'cho' }
  return [b1, b2, b3]
}

const CHU_TT: Record<TrangThaiBuoc, string> = { xong: 'đã xong', dang: 'đang làm', cho: 'chưa tới lượt', khoa: 'đang khoá' }

function BuocHomNay({ buoc }: { buoc: Buoc[] }) {
  return (
    <ol className="v2s-buoc" aria-label="Ba bước hôm nay">
      {buoc.map((b, i) => (
        <li key={b.so} className="v2s-buoc-o" data-tt={b.tt} aria-label={`Bước ${b.so}: ${b.nhan} — ${CHU_TT[b.tt]}. ${b.phu}`}>
          <span className="v2s-buoc-hang" aria-hidden="true">
            <span className="v2s-buoc-so v2-so">{b.tt === 'khoa' ? <Lock size={18} /> : b.so}</span>
            {i < buoc.length - 1 && <span className="v2s-buoc-noi" data-tt={b.tt} />}
          </span>
          <span className="v2s-buoc-nhan">{b.nhan}</span>
          <span className="v2s-buoc-phu">{b.phu}</span>
        </li>
      ))}
    </ol>
  )
}

/** Khối cũ nhúng trong màn V2 (giữ đúng hành vi + kiểm thử của Sảnh cũ; biến màu --h2-* được đổi sang Bảng G ở sanh-v2.css). */
function Nhung({ children, lop = '' }: { children: ReactNode; lop?: string }) {
  return <div className={`h2-sanh v2s-nhung ${lop}`}>{children}</div>
}

function NutBatDau({ p, s }: { p: SanhBanDoProps; s: SanhHoa2 }) {
  if (s.doan.con > 0) {
    return (
      <>
        <button type="button" className="v2-nut-chinh v2s-nut-bat-dau" onClick={p.onPhaPhucKich}>
          <PlayIcon />
          <span>
            Bắt đầu · gỡ {s.doan.con} lỗi cũ
            <small>Đoàn Hộ Tống · {s.doan.con} câu ôn</small>
          </span>
        </button>
        {s.dao.con > 0 && (
          <button type="button" className="v2-nut-phu v2s-nut-dao" disabled={s.khoaDao} onClick={s.khoaDao ? undefined : p.onKhamPhaDao}>
            {s.khoaDao && <Lock size={16} aria-hidden="true" />}
            <span>
              Khám phá Bát Linh Đảo · {s.dao.con} câu
              {s.khoaDao && s.loiKhoaDao && <small className="v2s-nut-dao-khoa">{s.loiKhoaDao}</small>}
            </span>
          </button>
        )}
      </>
    )
  }
  if (s.dao.con > 0) {
    return (
      <button type="button" className="v2-nut-chinh v2s-nut-bat-dau" onClick={p.onKhamPhaDao}>
        <PlayIcon />
        <span>
          Bắt đầu · {s.dao.con} câu mới
          <small>Bát Linh Đảo · đã gỡ hết lỗi cũ</small>
        </span>
      </button>
    )
  }
  return null
}

function PlayIcon() {
  return (
    <svg width="22" height="24" viewBox="0 0 22 24" aria-hidden="true" focusable="false">
      <path d="M3 2.6v18.8c0 1.5 1.6 2.4 2.9 1.6l15-9.4c1.2-.8 1.2-2.5 0-3.2l-15-9.4C4.6.2 3 1.1 3 2.6z" fill="currentColor" />
    </svg>
  )
}

function TheHomNay({ p, s }: { p: SanhBanDoProps; s: SanhHoa2 }) {
  const { da, tong } = soCauHomNay(s)
  const xong = s.theLuc.tong > 0 && s.theLuc.con === 0
  const trong = s.theLuc.tong === 0
  const h = s.hanhTrinh
  return (
    <section className="v2-the v2s-hom-nay" aria-labelledby="v2s-hom-nay-tieu">
      <div className="v2s-hom-nay-dau">
        <span className="v2s-o-bieu" aria-hidden="true">
          <CalendarDays size={26} />
        </span>
        <h2 id="v2s-hom-nay-tieu" className="v2s-hom-nay-tieu">
          Hôm nay
          {tong > 0 && (
            <>
              {' · '}
              <b className="v2-so">
                {da}/{tong} câu
              </b>
            </>
          )}
        </h2>
        <Sparkles className="v2s-lap-lanh" size={26} aria-hidden="true" />
      </div>
      {h && (
        <p className="v2s-dong-phu">
          Tầng {TEN_TANG[h.tang - 1] ?? h.tang} ·{' '}
          {h.daLam >= h.toiThieu ? 'Đã đủ mức tối thiểu hôm nay' : `Chặng ${h.changHienTai}/${h.soChang} · còn ${h.cauTrongChang} câu trong chặng`}
          {h.conThieu > 0 ? ` · thiếu ${h.conThieu} câu phù hợp` : ''}
        </p>
      )}
      {!trong && <BuocHomNay buoc={baBuoc(s)} />}
      {xong ? (
        <Nhung lop="v2s-nhung-xong">
          <XongHomNay s={s} exp={p.exp} token={p.token} onTaiLai={p.onTaiLai} them={<NutOmniThem s={s} onKhamPhaDao={p.onKhamPhaDao} />} />
          <NutBia p={p} s={s} />
        </Nhung>
      ) : trong ? (
        <Nhung>
          {s.chienDich || s.hanhTrinh ? (
            <>
              <p className="h2-tam-chu" data-khoi={s.tamGiuCa > 0 ? 'tam-giu-ca' : undefined}>
                {chuKhongConCau(s)}
              </p>
              <NutThuSucThem s={s} token={p.token} onTaiLai={p.onTaiLai} />
              <NutOmniThem s={s} onKhamPhaDao={p.onKhamPhaDao} />
            </>
          ) : (
            <NutOmniThem s={s} onKhamPhaDao={p.onKhamPhaDao} />
          )}
        </Nhung>
      ) : (
        <div className="v2s-hanh-dong">
          <NutBatDau p={p} s={s} />
          <Nhung>
            <NutBia p={p} s={s} />
            <TheMetGio s={s} token={p.token} onTaiLai={p.onTaiLai} />
          </Nhung>
        </div>
      )}
    </section>
  )
}

function RuongCo({ co = 92 }: { co?: number }) {
  return (
    <svg className="v2s-ruong-hinh" width={co} height={co} viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      <ellipse cx="48" cy="86" rx="38" ry="6" className="v2s-r-bong" />
      <path d="M12 44h72v34a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6z" className="v2s-r-than" />
      <path d="M12 44c0-16 16-28 36-28s36 12 36 28z" className="v2s-r-nap" />
      <path d="M12 44h72v8H12z" className="v2s-r-dai" />
      <path d="M42 16h12v68H42z" className="v2s-r-dai" />
      <path d="M48 40l9 9-9 13-9-13z" className="v2s-r-ngoc" />
      <path d="M48 44l5 5-5 7-5-7z" className="v2s-r-ngoc-sang" />
    </svg>
  )
}

function TheRuong({ r }: { r: SanhHoa2['ruong'] }) {
  const co = Math.min(r.daLam, r.tong)
  const khuc = r.tong > 0 && r.tong <= 12
  return (
    <section className="v2s-ruong" aria-labelledby="v2s-ruong-tieu">
      <RuongCo />
      <div className="v2s-ruong-chu">
        <h2 id="v2s-ruong-tieu" className="v2-tieu-de v2s-ruong-tieu">
          Rương hôm nay
        </h2>
        <p className="v2s-ruong-phu">{r.daMo ? 'Em đã mở rương hôm nay' : r.moDuoc ? 'Rương đã sẵn sàng để mở' : `Hoàn thành ${r.tong} câu để mở`}</p>
        <div className="v2s-ruong-thanh">
          {khuc ? (
            <span className="v2-khuc" role="progressbar" aria-label="Câu đã làm để mở rương" aria-valuemin={0} aria-valuemax={r.tong} aria-valuenow={co}>
              {Array.from({ length: r.tong }, (_, i) => (
                <i key={i} data-xong={i < co ? 'true' : 'false'} />
              ))}
            </span>
          ) : (
            <span className="v2-thanh" data-mau="vang" role="progressbar" aria-label="Câu đã làm để mở rương" aria-valuemin={0} aria-valuemax={r.tong} aria-valuenow={co}>
              <i style={{ width: `${r.tong > 0 ? Math.round((100 * co) / r.tong) : 0}%` }} />
            </span>
          )}
          <b className="v2-so">
            {co}/{r.tong}
          </b>
        </div>
      </div>
    </section>
  )
}

function TheManhLen({ s }: { s: SanhHoa2 }) {
  const v = s.omni?.dangVung
  if (!v || v.b <= 0) return null
  const pt = Math.round((100 * Math.min(v.a, v.b)) / v.b)
  return (
    <section className="v2-the v2s-manh-len" aria-labelledby="v2s-manh-len-tieu">
      <div className="v2s-manh-len-dau">
        <span className="v2s-o-bieu" aria-hidden="true">
          <TrendingUp size={24} />
        </span>
        <span>
          <h2 id="v2s-manh-len-tieu" className="v2-tieu-de v2s-manh-len-tieu">
            Đang mạnh lên
          </h2>
          <span className="v2s-dong-phu">Những dạng em đã vững trong bài đang luyện</span>
        </span>
      </div>
      <div className="v2s-manh-len-hang">
        <span className="v2s-manh-len-so v2-so">{chuDangVung(v.a, v.b)}</span>
        <span className="v2-thanh" role="progressbar" aria-label="Dạng vững" aria-valuemin={0} aria-valuemax={v.b} aria-valuenow={Math.min(v.a, v.b)}>
          <i style={{ width: `${pt}%` }} />
        </span>
      </div>
    </section>
  )
}

function ThanhDuoi({ dang, onHomNay, onHanhTrinh, onThanThu, onCauDaLam }: { dang: 'hom-nay' | 'hanh-trinh'; onHomNay: () => void; onHanhTrinh: () => void; onThanThu: () => void; onCauDaLam: () => void }) {
  const muc: { k: string; nhan: string; bieu: ReactNode; on: () => void; dang: boolean }[] = [
    { k: 'hom-nay', nhan: 'Hôm nay', bieu: <Home size={24} />, on: onHomNay, dang: dang === 'hom-nay' },
    { k: 'hanh-trinh', nhan: 'Hành trình', bieu: <BanDo size={24} />, on: onHanhTrinh, dang: dang === 'hanh-trinh' },
    { k: 'than-thu', nhan: 'Thần thú', bieu: <PawPrint size={24} />, on: onThanThu, dang: false },
    { k: 'cau-da-lam', nhan: 'Câu đã làm', bieu: <BookOpenCheck size={24} />, on: onCauDaLam, dang: false },
  ]
  return (
    <nav className="v2s-thanh-duoi" aria-label="Điều hướng chính">
      {muc.map((m) => (
        <button key={m.k} type="button" className="v2s-thanh-duoi-nut" aria-current={m.dang ? 'page' : undefined} onClick={m.on}>
          {m.bieu}
          <span>{m.nhan}</span>
        </button>
      ))}
    </nav>
  )
}

function AnhHung({ p, tenEm, khoi, s, chonThu }: { p: SanhBanDoProps; tenEm: string; khoi: 10 | 11 | 12 | null; s: SanhHoa2 | null; chonThu: boolean }) {
  const thu = chonThu ? null : p.thu
  const goi = tenGoi(tenEm)
  const chip = s?.hanhTrinh ? `Tầng ${TEN_TANG[s.hanhTrinh.tang - 1] ?? s.hanhTrinh.tang}` : s?.chienDich ? `Chiến dịch ${s.chienDich.ten}` : null
  return (
    <header className="v2s-anh-hung">
      <div className="v2s-canh" aria-hidden="true" />
      <div className="v2s-dau">
        <button type="button" className="v2s-avatar" onClick={chonThu ? p.onChonThu : p.onMoThanThu} aria-label={thu ? `Mở thần thú của em: ${thu.ten} · Cấp ${thu.cap}` : 'Chọn thần thú của em'}>
          {thu ? <img src={anhThu(thu.index, thu.cap, true)} alt="" width={96} height={96} /> : <PawPrint size={30} aria-hidden="true" />}
          {thu && <span className="v2s-avatar-cap v2-so">{thu.cap}</span>}
        </button>
        <div className="v2s-chao">
          <p className="v2s-chao-ten">{goi ? `Chào ${goi}` : 'Chào em'}</p>
          <span className="v2s-chuoi" aria-label={`Chuỗi ${p.chuoiNgay} ngày học liên tiếp`}>
            <IconChuoi />
            <span className="v2-so">Chuỗi {p.chuoiNgay} ngày</span>
          </span>
        </div>
        <div className="v2s-dau-phai">
          <button type="button" className="v2s-nut-ca" data-noi-bat={p.caDangMo ? 'true' : undefined} onClick={p.onVaoThi}>
            <IconCa co={20} />
            <span>{p.caDangMo ? 'Ca đang mở · Vào thi' : 'Ca kiểm tra'}</span>
          </button>
          <button type="button" className="v2-nut-tron" onClick={p.onDangXuat} aria-label="Đăng xuất" title="Đăng xuất">
            <IconDangXuat co={20} />
          </button>
        </div>
      </div>
      <div className="v2s-tieu-khoi">
        <h1 className="v2-tieu-de v2s-tieu">
          Hành trình
          <br />
          giỏi <em>Hóa{khoi ? ` ${khoi}` : ''}</em>
        </h1>
        {chip && (
          <span className="v2s-muc-tieu">
            <Compass size={22} aria-hidden="true" />
            <span>{chip}</span>
          </span>
        )}
      </div>
      {thu ? (
        <button type="button" className="v2s-thu" onClick={p.onMoThanThu} aria-label={`Gặp ${thu.ten}, cấp ${thu.cap}`}>
          <span className="v2s-thu-hao" aria-hidden="true" />
          <img src={anhThu(thu.index, thu.cap)} alt="" width={320} height={320} decoding="async" fetchPriority="high" />
          <span className="v2s-thu-ten">
            {thu.ten} <small>Cấp {thu.cap}</small>
          </span>
        </button>
      ) : (
        <div className="v2s-thu v2s-thu-trong" aria-hidden="true">
          <Sparkles size={56} />
        </div>
      )}
    </header>
  )
}

function KhuHanhTrinh({ s, onVe }: { s: SanhHoa2 | null; onVe: () => void }) {
  return (
    <section className="v2-the v2s-ban-do" aria-labelledby="v2s-ban-do-tieu">
      <div className="v2s-ban-do-dau">
        <h2 id="v2s-ban-do-tieu" className="v2-tieu-de v2s-ban-do-tieu">
          Bản đồ hành trình
        </h2>
        <button type="button" className="v2-nut-phu" onClick={onVe}>
          Về hôm nay
        </button>
      </div>
      <div className="v2s-ban-do-canh">
        <BanDoHanhTrinh s={s} />
      </div>
    </section>
  )
}

export default function SanhV2(goc: SanhV2Props) {
  const p = boCuaNhanh(goc)
  const bc = useBoCucNgang()
  const [khu, setKhu] = useState<'hom-nay' | 'hanh-trinh'>('hom-nay')
  const kq = p.ketQua
  const s = kq && kq.cheDo2 && !kq.canChonThu ? kq.sanh : null
  const chonThu = !!kq && kq.cheDo2 && kq.canChonThu === true
  useNapTruocManSanh(!!s, !!s && s.doan.con > 0)
  const khoi = khoiTuLop(p.lop)
  const xong = !!s && s.theLuc.tong > 0 && s.theLuc.con === 0
  const coThu = !chonThu
  return (
    <div
      className="v2 v2-sanh"
      data-bo-cuc={bc.ngang ? 'ngang' : 'doc'}
      data-thap={bc.thap ? 'true' : 'false'}
      data-trang-thai={s ? 'co' : chonThu ? 'chon-thu' : p.loi ? 'loi' : 'dang-tai'}
      data-khu={khu}
    >
      <div className="v2s-khung">
        <AnhHung p={p} tenEm={p.tenEm} khoi={khoi} s={s} chonThu={chonThu} />
        <main className="v2s-luoi" aria-busy={p.dangTai && !s}>
          {khu === 'hanh-trinh' ? (
            <KhuHanhTrinh s={s} onVe={() => setKhu('hom-nay')} />
          ) : (
            <>
              <div className="v2s-cot-trai">
                {p.caDangMo && (
                  <Nhung>
                    <DaiVaoThi onVaoThi={p.onVaoThi} />
                  </Nhung>
                )}
                {s ? (
                  <TheHomNay p={p} s={s} />
                ) : chonThu ? (
                  <section className="v2-the v2s-hom-nay">
                    <p className="v2s-dong-phu">Em chọn thần thú đồng hành trước khi lên đường. Thần thú lớn lên theo EXP em học được.</p>
                    <button type="button" className="v2-nut-chinh v2s-nut-bat-dau" onClick={p.onChonThu}>
                      <PawPrint size={22} aria-hidden="true" />
                      <span>
                        Chọn thần thú của em
                        <small>Một lần chọn, đồng hành cả năm học</small>
                      </span>
                    </button>
                  </section>
                ) : p.loi ? (
                  <section className="v2-the v2s-hom-nay" role="alert">
                    <p className="v2s-dong-phu">{p.loi}</p>
                    <button type="button" className="v2-nut-phu" onClick={p.onTaiLai}>
                      Thử lại
                    </button>
                  </section>
                ) : (
                  <section className="v2-the v2s-hom-nay" role="status">
                    <span className="v2-xuong" style={{ height: 28, width: '62%' }} />
                    <span className="v2-xuong" style={{ height: 64, marginTop: 18 }} />
                    <span className="v2-xuong" style={{ height: 56, marginTop: 18 }} />
                    <span className="v2-an">Đang mở kế hoạch hôm nay…</span>
                  </section>
                )}
                {s && p.loi && (
                  <p className="v2s-cu" role="status">
                    Chưa cập nhật được: {p.loi}
                  </p>
                )}
              </div>
              <div className="v2s-cot-phai">
                {s && !xong && s.ruong.tong > 0 && <TheRuong r={s.ruong} />}
                {s && <TheManhLen s={s} />}
                {s && (
                  <Nhung lop="v2s-nhung-chien-dich">
                    {s.huyetChien && !xong ? <TheHuyetChien s={s} now={p.now} /> : s.chienDich ? <DongChienDich s={s} now={p.now} /> : !s.hanhTrinh ? (
                      <p className="h2-tam-chu" data-khoi="sap-bat-dau">
                        {chuChuaCoChienDich(s)}
                      </p>
                    ) : null}
                  </Nhung>
                )}
                <Nhung lop="v2s-nhung-loi-tat">
                  <TheCaGanNhatSanh p={p} />
                  <NutTuLuyen p={p} />
                </Nhung>
                {coThu && (
                  <div className="v2s-loi-tat" aria-label="Thần thú">
                    <button type="button" className="v2-nut-phu" onClick={p.onTuiDo}>
                      <IconTui co={20} />
                      Túi đồ
                    </button>
                    {p.shopBat && (
                      <button type="button" className="v2-nut-phu" onClick={p.onCuaHang}>
                        <IconCuaHang co={20} />
                        Cửa hàng
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
        <ThanhDuoi
          dang={khu}
          onHomNay={() => setKhu('hom-nay')}
          onHanhTrinh={() => setKhu('hanh-trinh')}
          onThanThu={chonThu ? p.onChonThu : p.onMoThanThu}
          onCauDaLam={p.onCauDaLam}
        />
      </div>
    </div>
  )
}

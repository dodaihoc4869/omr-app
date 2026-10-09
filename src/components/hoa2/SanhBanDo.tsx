import DongHanh from '../bat-linh/DongHanh'
// GAME HÓA 2.0 — SẢNH BẢN ĐỒ BÁT LINH (bản vẽ đã chốt: docs/ban-ve-game-hoa-2-2709/Moi-SanhBanDo.dc.html;
// Huyết Chiến theo HS-HuyetChien.dc.html; hết kế hoạch theo HS-XongHomNay.dc.html).
// LỚP HÌNH 28/09: bản vẽ động "tươi sáng, 3D" (docs/ban-ve-sanh-dong-2809/Sanh-Dong.html) — cảnh ở CanhSanh3D.tsx,
// hiệu ứng (hạt sáng, pháo sáng, mở màn một lần mỗi phiên) ở hieu-ung-sanh.ts. Dữ liệu, nút, luồng giữ nguyên.
// Màn chính DUY NHẤT của app học sinh khi máy chủ bật `cheDo2`. Trả lời một câu: "hôm nay em làm gì?" — đúng MỘT nút chính (vàng):
//   · còn ổ phục kích (câu ôn ở Đoàn)  → "PHÁ N Ổ PHỤC KÍCH" (mở Đoàn Hộ Tống); nút Đảo khoá kèm đúng câu `loiKhoaDao` của máy chủ;
//   · hết ổ phục kích, còn câu ở Đảo   → "KHÁM PHÁ BÁT LINH ĐẢO · N câu";
//   · hết kế hoạch                     → "Hôm nay em xong rồi" + nút Rương Bát Linh (khi mở được và chưa mở);
//                                        rương đã mở (hoặc kế hoạch rỗng) + máy chủ cho ⇒ nút phụ "Thử sức thêm (không bắt buộc)" (thầy 30/09).
// Mọi con số lấy từ máy chủ (`hoa2-sanh`, thần thú/EXP/chuỗi ngày từ /hs/ke-hoach-ngay) — không tự tính, không bịa.
// Dải "Vào thi" chỉ hiện khi có ca kiểm tra đang mở; bấm là vào đúng luồng PhongVaoThi → ExamTakeScreen có sẵn.
// OMNI 3 (05/10): khi `hoa2-sanh` có `omni` — vài DÒNG NHỎ trong thẻ chiến dịch + nút PHỤ cạnh "Thử sức thêm" (khối OMNI ngay trên XongHomNay). Vắng ⇒ y hệt cũ.
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as SuKienTro, type ReactNode } from 'react'
import { anhThu } from '../../game/than-thu-v2/dao/anh'
import { thanhExp } from '../../game/than-thu-hoa-hoc/kinh-nghiem'
import { goiBangToken, moRuong, omniDoiThuTu, thuSucThem, type KetQuaSanh, type SanhHoa2 } from './api'
import { CHU_CHO_BAI_MOI, GOI_Y_VE, NUT_DE_MAI, NUT_LAM_LUON, chuChungChi, chuConDangDe8, chuDangVung, chuDeThu, chuMetGio, chuOnBaiCu, chuSoY, chuVe } from '../../lib/omni-chu'
import { datViecOmniDao, type ViecOmniDao } from '../../lib/omni-hs'
import type { SanhOmni } from '../../../server/src/omni-kieu'
import { useBoCucNgang, type BoCucNgang } from './bo-cuc-ngang'
import { chuHanNop, ngaySau, ngayThang, thuNgayThang } from './thoi-gian'
import BanDoHanhTrinh from '../bat-linh/BanDoHanhTrinh'
import HopDoiTen from './HopDoiTen'
import { hat, hatBay, loatPhao, MAU_PHAO, nhanLuotMoMan, timFx, veToaDoFx } from './hieu-ung-sanh'
import './sanh-ban-do.css'
import './phong-baloo'
import { boCuaNhanh, useNapTruocManSanh } from './man-sanh-luoi'

/** Câu thứ mấy trở đi em không nhận EXP ở ngày Huyết Chiến = trần EXP ngày thường (40 câu, srs2-loi.ts TRAN_NGAY) + 1. */
export const CAU_HET_EXP_HUYET_CHIEN = 41
export { diemTrenDuong, viTriOPhucKich, TOI_DA_O_VE } from './CanhSanh3D'

export interface ThuTrenHud {
  /** Chỉ số thú trong PETS (0..7). */
  index: number
  cap: number
  ten: string
}

export interface SanhBanDoProps {
  /** null = đang chờ máy chủ lần đầu. */
  ketQua: KetQuaSanh | null
  loi: string
  dangTai: boolean
  thu: ThuTrenHud | null
  /** EXP từ /hs/ke-hoach-ngay: `homNay` + `conThieu` (EXP còn thiếu để lên cấp, null nếu máy chủ không gửi). null = máy chủ chưa bật EXP. */
  exp: { homNay: number; conThieu: number | null } | null
  chuoiNgay: number
  caDangMo: boolean
  now: number
  token: string
  /** Cửa hàng phụ kiện mở cho em (máy chủ báo `thanThu.shopBat`). */
  shopBat: boolean
  onVaoThi: () => void
  onPhaPhucKich: () => void
  onKhamPhaDao: () => void
  onCauDaLam: () => void
  /** Cửa thứ ba: Bi-a Phản Ứng (chỉ vẽ khi máy chủ gửi `bia`). */
  onChoiBia?: () => void
  onTuiDo: () => void
  onCuaHang: () => void
  onMoThanThu: () => void
  /** Đổi tên thần thú (máy chủ `rename`). Có ⇒ HUD vẽ nút bút chì "Đổi tên" cạnh tên. Ném lỗi ⇒ hộp báo ngay dưới ô. */
  onDoiTen?: (ten: string) => Promise<void>
  onChonThu: () => void
  onDangXuat: () => void
  onTaiLai: () => void
  /** Thẻ nhỏ "Ca kiểm tra gần nhất: 7,25 điểm · 26/09" (CHỈ ca đã công bố; chưa có ⇒ "Chưa có ca đã công bố"). null/thiếu = chưa biết ⇒ không vẽ. */
  caGanNhat?: { chu: string; coDiem: boolean } | null
  /** Bấm thẻ ⇒ màn Lịch sử ca kiểm tra. */
  onLichSuCa?: () => void
  /** Cửa "Tu luyện" (29/09): 4 chế độ luyện tự do, không tính EXP. Thiếu ⇒ không vẽ cửa. */
  onTuLuyen?: () => void
}

const phanTram = (a: number, b: number) => (b > 0 ? Math.round((100 * Math.min(a, b)) / b) : 0)

/** HUD thần thú. Bản ngang: `theLuc` và `chuoiNgay` = null (Thể lực có thẻ riêng ở cột phải, Chuỗi ngày ở hàng trên — một thông tin một chỗ). */
function Hud({ thu, exp, theLuc, chuoiNgay, onMoThanThu, onDoiTen }: Pick<SanhBanDoProps, 'thu' | 'exp' | 'onMoThanThu' | 'onDoiTen'> & { chuoiNgay: number | null; theLuc: { con: number; tong: number } | null }) {
  const [moDoiTen, setMoDoiTen] = useState(false)
  const can = thu ? thanhExp(thu.cap) : 0
  const co = exp && exp.conThieu !== null && can > 0 ? Math.max(0, Math.min(can, can - exp.conThieu)) : null
  const tiLe = co !== null && can > 0 ? co / can : 0
  const nhanThu = thu ? `${thu.ten} · Cấp ${thu.cap}` : 'Thần thú của em'
  return (
    <header className="h2-hud h2-kinh">
      <button type="button" className="h2-hud-thu" onClick={onMoThanThu} aria-label={thu ? `Mở thần thú của em: ${nhanThu}` : 'Mở thần thú của em'}>
        <span className="h2-luc-giac">
          <span className="h2-vong-hao-sang" aria-hidden="true" />
          <span className="h2-vong-hao" aria-hidden="true" />
          <span className="h2-mat-thu" aria-hidden="true" />
          {thu && <img src={anhThu(thu.index, thu.cap, true)} alt="" width={44} height={44} />}
          {thu && (
            <span className="h2-cap baloo" aria-hidden="true">
              {thu.cap}
            </span>
          )}
        </span>
        <span className="h2-hud-giua">
          <span className="h2-hud-ten" data-dai={thu && [...thu.ten].length > 10 ? 'true' : undefined}>{nhanThu}</span>
          {co !== null && (
            <span className="h2-thanh-exp" role="progressbar" aria-label="EXP của thần thú tới cấp sau" aria-valuemin={0} aria-valuemax={can} aria-valuenow={co}>
              <span style={{ width: `${Math.round(tiLe * 100)}%` }} />
              <i className="h2-exp-luot" aria-hidden="true" />
            </span>
          )}
          {exp && (
            <span className="h2-hud-phu">{co !== null ? `${co}/${can} EXP · +${exp.homNay} hôm nay` : `+${exp.homNay} EXP hôm nay`}</span>
          )}
        </span>
      </button>
      {thu && onDoiTen && (
        <button type="button" className="h2-hud-doi-ten" onClick={() => setMoDoiTen(true)} aria-label={`Đổi tên thần thú (đang là ${thu.ten})`} title="Đổi tên">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
      )}
      {moDoiTen && thu && onDoiTen && <HopDoiTen tenHienTai={thu.ten} onLuu={onDoiTen} onDong={() => setMoDoiTen(false)} />}
      {(theLuc || chuoiNgay !== null) && (
      <span className="h2-hud-phai">
        {theLuc && (
          <span className="h2-hud-so h2-the-luc" aria-label={`Thể lực hôm nay: còn ${theLuc.con}/${theLuc.tong} câu`}>
            <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true" focusable="false">
              <polygon points="7,0 14,5 11,16 3,16 0,5" fill="rgb(0 170 175)" />
            </svg>
            <span className="h2-chip-chu">
              <span className="h2-nhan-nho">Thể lực</span> <b>{theLuc.con}/{theLuc.tong}</b>
            </span>
          </span>
        )}
        {chuoiNgay !== null && (
          <span className="h2-hud-so h2-chuoi" aria-label={`Chuỗi ${chuoiNgay} ngày`}>
            <IconChuoi />
            <span className="h2-chip-chu">
              <span className="h2-nhan-nho">Chuỗi</span> <b>{chuoiNgay} ngày</b>
            </span>
          </span>
        )}
      </span>
      )}
    </header>
  )
}

function NutRay({ nhan, onClick, children, noiBat }: { nhan: string; onClick: () => void; children: ReactNode; noiBat?: boolean }) {
  return (
    <button type="button" className="h2-nut-ray" data-noi-bat={noiBat ? 'true' : undefined} onClick={onClick}>
      <span className="h2-kinh h2-nut-ray-o" aria-hidden="true">
        {children}
      </span>
      <span className="h2-nut-ray-chu">{nhan}</span>
    </button>
  )
}

/** Bảng kẹp giấy có dấu tích — lối vào Ca kiểm tra (thầy 28/09: "app học sinh chưa có chỗ bấm để vào ca kiểm tra"). */
function IconCa({ co = 22 }: { co?: number }) {
  return (
    <svg width={co} height={co} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M9 4h6v3H9zM8 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2M9 14l2 2 4-4" />
    </svg>
  )
}

const NET = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, focusable: false }
function IconSo({ co = 22 }: { co?: number }) {
  return (
    <svg width={co} height={co} {...NET}>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <path d="M4 21V5" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  )
}
function IconTui({ co = 22 }: { co?: number }) {
  return (
    <svg width={co} height={co} {...NET}>
      <path d="M5 8h14l-1 12H6z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  )
}
function IconCuaHang({ co = 22 }: { co?: number }) {
  return (
    <svg width={co} height={co} {...NET}>
      <path d="M4 10h16l-1-5H5z" />
      <path d="M5 10v10h14V10M10 20v-6h4v6" />
    </svg>
  )
}
function IconDangXuat({ co = 22 }: { co?: number }) {
  return (
    <svg width={co} height={co} {...NET}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}
function IconChuoi() {
  return (
    <svg width="14" height="16" viewBox="0 0 24 24" fill="rgb(255 122 69)" aria-hidden="true" focusable="false">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}

function Ray(p: Pick<SanhBanDoProps, 'onCauDaLam' | 'onTuiDo' | 'onCuaHang' | 'onDangXuat' | 'shopBat' | 'onVaoThi' | 'caDangMo'> & { coThu: boolean }) {
  return (
    <nav className="h2-ray" aria-label="Lối tắt">
      <NutRay nhan={p.caDangMo ? 'Ca đang mở' : 'Ca kiểm tra'} onClick={p.onVaoThi} noiBat={p.caDangMo}>
        <IconCa />
      </NutRay>
      <NutRay nhan="Câu đã làm" onClick={p.onCauDaLam}>
        <IconSo />
      </NutRay>
      {p.coThu && (
        <NutRay nhan="Túi đồ" onClick={p.onTuiDo}>
          <IconTui />
        </NutRay>
      )}
      {p.coThu && p.shopBat && (
        <NutRay nhan="Cửa hàng" onClick={p.onCuaHang}>
          <IconCuaHang />
        </NutRay>
      )}
      <NutRay nhan="Đăng xuất" onClick={p.onDangXuat}>
        <IconDangXuat />
      </NutRay>
    </nav>
  )
}

/** Vòng Cọ xát % + tên chiến dịch + hạn nộp + Cọ xát/Thành thạo (tấm dưới, ngày thường). */
function DongChienDich({ s, now }: { s: SanhHoa2; now: number }) {
  if (s.hanhTrinh) return <TheHanhTrinh s={s} />
  const cd = s.chienDich!
  const p = phanTram(cd.coXat, cd.tong)
  const chuVi = 2 * Math.PI * 25
  return (
    <div className="h2-cd">
      <span className="h2-vong" role="img" aria-label={`Cọ xát ${p}%`}>
        <svg width="58" height="58" viewBox="0 0 58 58" aria-hidden="true" focusable="false">
          <circle cx="29" cy="29" r="25" stroke="rgb(40 50 110 / 0.1)" strokeWidth="6" fill="none" />
          <circle cx="29" cy="29" r="25" stroke="rgb(0 170 175)" strokeWidth="6" fill="none" strokeDasharray={`${((chuVi * p) / 100).toFixed(1)} ${chuVi.toFixed(1)}`} strokeLinecap="round" transform="rotate(-90 29 29)" />
          <circle cx="29" cy="29" r="16" stroke="rgb(40 50 110 / 0.1)" strokeWidth="5" fill="none" />
        </svg>
        <span className="baloo">{p}%</span>
      </span>
      <span className="h2-cd-chu">
        <span className="h2-cd-ten baloo">Chiến dịch {cd.ten}</span>
        {cd.hanNop && <span className="h2-cd-han">Hạn nộp: {chuHanNop(cd.hanNop, now)}</span>}
        <span className="h2-cd-so">
          <span className="h2-so-coxat">
            Cọ xát {cd.coXat}/{cd.tong}
          </span>
          {' · '}
          <span className="h2-so-thanhthao">
            Thành thạo {cd.thanhThao}/{cd.tong}
          </span>
          {cd.thanhThao === 0 && cd.thanhThaoTangTu && <span className="h2-cd-phu"> (tăng từ {ngayThang(cd.thanhThaoTangTu)})</span>}
        </span>
        {s.omni && <DongOmniChienDich o={s.omni} cdId={cd.id} lop="h2-cd-phu" />}
      </span>
    </div>
  )
}

/** Thẻ đỏ Huyết Chiến (HS-HuyetChien.dc.html). */
function TheHuyetChien({ s, now }: { s: SanhHoa2; now: number }) {
  const cd = s.chienDich
  return (
    <section className="h2-huyet" aria-label="Huyết Chiến">
      <div className="h2-huyet-dau">
        <span className="h2-huyet-o" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
            <path d="M4 21V9l4-3 4 3 4-3 4 3v12z" />
            <path d="M10 21v-5h4v5" />
          </svg>
        </span>
        <span className="h2-huyet-tieu">
          <span className="h2-huyet-nho">{cd ? `Chiến dịch ${cd.ten} · Huyết Chiến` : 'Huyết Chiến'}</span>
          <span className="h2-huyet-lon">Thành trì bị vây hãm</span>
        </span>
      </div>
      <p className="h2-huyet-chu">
        {cd?.hanNop ? `Hạn nộp: ${chuHanNop(cd.hanNop, now)}. ` : ''}Hôm nay em cần {s.theLuc.tong} câu để kịp hạn nộp. Từ câu thứ {CAU_HET_EXP_HUYET_CHIEN} trở đi em không nhận EXP.
      </p>
      {cd && (
        <p className="h2-huyet-so">
          Cọ xát {cd.coXat}/{cd.tong} câu · Thành thạo {cd.thanhThao}/{cd.tong} câu
          {cd.thanhThao === 0 && cd.thanhThaoTangTu ? ` (tăng từ ${ngayThang(cd.thanhThaoTangTu)})` : ''}
        </p>
      )}
    </section>
  )
}

function DaiVaoThi({ onVaoThi }: { onVaoThi: () => void }) {
  return (
    <div className="h2-ca" role="status">
      <span className="h2-ca-chu">
        <span className="h2-ca-lon">Ca kiểm tra đang mở</span>
      </span>
      <button type="button" className="h2-nut-ca" onClick={onVaoThi}>
        Vào thi
      </button>
    </div>
  )
}

/** Thẻ nhỏ cạnh lối vào Ca kiểm tra: điểm ca ĐÃ CÔNG BỐ gần nhất; bấm ⇒ Lịch sử ca kiểm tra (thầy lệnh 28/09). */
function TheCaGanNhatSanh({ p }: { p: SanhBanDoProps }) {
  if (!p.caGanNhat || !p.onLichSuCa) return null
  return (
    <button type="button" className="h2-ca-gan" data-co-diem={p.caGanNhat.coDiem ? 'true' : 'false'} onClick={p.onLichSuCa}>
      <span className="h2-ca-gan-o" aria-hidden="true">
        <IconCa co={20} />
      </span>
      <span className="h2-ca-gan-chu">
        <span className="h2-ca-gan-lon">{p.caGanNhat.chu}</span>
        <span className="h2-ca-gan-nho">Xem lịch sử ca kiểm tra</span>
      </span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  )
}

function IconKiem() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2" />
    </svg>
  )
}
function IconRuong() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="9" width="18" height="11" rx="2" />
      <path d="M3 13h18M12 11v4M5 9a7 5 0 0 1 14 0" />
    </svg>
  )
}
function IconKhoa() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

/**
 * THỬ SỨC THÊM (thầy chốt 30/09): nút PHỤ (không phải nút chính vàng) — em xong kế hoạch hôm nay thì lấy trước một lô câu mới của ngày mai.
 * Chỉ vẽ khi máy chủ cho (`thuSucThem.duoc`, số câu dương); bấm ⇒ máy chủ thêm lô ⇒ tải lại Sảnh ⇒ nút Đảo có câu. Lỗi ⇒ câu của máy chủ ngay dưới nút.
 */
function NutThuSucThem({ s, token, onTaiLai }: { s: SanhHoa2; token: string; onTaiLai: () => void }) {
  const [dangGoi, setDangGoi] = useState(false)
  const [loi, setLoi] = useState('')
  const t = s.thuSucThem
  if (!t?.duoc || t.soCau <= 0) return null
  const bam = async () => {
    if (dangGoi) return
    setDangGoi(true)
    setLoi('')
    try {
      await thuSucThem(token)
      onTaiLai()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa lấy thêm được câu. Em thử lại.')
    } finally {
      setDangGoi(false)
    }
  }
  return (
    <>
      <button type="button" className="h2-nut-dao h2-nut-thu-suc" data-khoi="thu-suc-them" onClick={() => void bam()} aria-disabled={dangGoi} aria-busy={dangGoi}>
        <span className="h2-nut-dao-chu">
          <span className="h2-nut-dao-lon">{dangGoi ? 'Đang lấy câu…' : 'Thử sức thêm (không bắt buộc)'}</span>
          <span className="h2-nut-thu-suc-phu">Lấy trước {t.soCau} câu mới của ngày mai</span>
        </span>
      </button>
      {loi && (
        <p className="h2-loi" role="alert">
          {loi}
        </p>
      )}
    </>
  )
}

// ═══════════════════ OMNI 3 (05/10 · docs/hop-dong-omni-3.md mục A) ═══════════════════
// Thầy lệnh 05/10: "giữ nguyên mọi giao diện hiện tại … thêm những mục cần thiết đồng bộ với giao diện hiện tại". Mọi phần dưới đây là DÒNG CHỮ
// hoặc NÚT PHỤ nằm trong thẻ/khung SẴN CÓ, dùng đúng lớp h2-* đang có; chữ lấy từ src/lib/omni-chu.ts (một nguồn). Chỉ vẽ khi `hoa2-sanh`
// có `omni` — cờ tắt ⇒ không thêm một phần tử nào, DOM y hệt trước.

/** 'YYYY-MM-DD' ⇒ '05/10' (luật A1.6); chữ khác (máy chủ đã viết sẵn) giữ nguyên. */
const ngayNgan = (d: string): string => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? ngayThang(d) : d)

/** Dòng nhỏ trong THẺ CHIẾN DỊCH sẵn có: "Dạng vững a/b · Sơ ý …" · "Còn N dạng cần vững để chạm mốc 8" (có chứng chỉ ⇒ dòng chứng chỉ gần nhất)
 *  · nhiều bài song song ⇒ thẻ giữ bài hạn gần nhất + "Đang luyện thêm: <bài kia>". */
function DongOmniChienDich({ o, cdId, lop }: { o: SanhOmni; cdId: string; lop: string }) {
  const dong1 = [o.dangVung.b > 0 ? chuDangVung(o.dangVung.a, o.dangVung.b) : null, chuSoY(o.sEm, o.sMucTieu)].filter(Boolean).join(' · ')
  const cc = o.chungChi[0]
  const dong2 = cc ? chuChungChi(cc.ten, cc.doTin, ngayNgan(cc.ngay)) : chuConDangDe8(o.conDangDe8)
  const coThe = o.baiDangLuyen.some((b) => b.id === cdId)
  const them = o.baiDangLuyen.filter((b, i) => (coThe ? b.id !== cdId : i > 0)).map((b) => b.ten)
  return (
    <>
      {dong1 && <span className={lop} data-khoi="omni-dang-vung">{dong1}</span>}
      {dong2 && <span className={lop} data-khoi="omni-moc-8">{dong2}</span>}
      {them.length > 0 && <span className={lop} data-khoi="omni-luyen-them">Đang luyện thêm: {them.join(', ')}</span>}
    </>
  )
}

/** Cạnh nút "Thử sức thêm" sẵn có: nút PHỤ cùng dáng — "Vé thử thách c/t" (hết vé ⇒ nút mờ) và "Đề thử …" (khi máy chủ cho).
 *  Bấm ⇒ mở Đảo y như nút Đảo; Đảo đọc khoá `game-v2:omni-dao` MỘT lần: vé ⇒ `start` kèm `ve: 'auto'`, đề thử ⇒ luồng đề thử của Đảo. */
function NutOmniThem({ s, onKhamPhaDao }: { s: SanhHoa2; onKhamPhaDao: () => void }) {
  const o = s.omni
  if (!o) return null
  const mo = (viec: ViecOmniDao) => {
    datViecOmniDao(viec)
    onKhamPhaDao()
  }
  return (
    <>
      {o.ve.tong > 0 && (
        <button type="button" className="h2-nut-dao h2-nut-thu-suc" data-khoi="ve-thu-thach" disabled={o.ve.con <= 0} onClick={o.ve.con > 0 ? () => mo('ve') : undefined}>
          <span className="h2-nut-dao-chu">
            <span className="h2-nut-dao-lon">{chuVe(o.ve.con, o.ve.tong)}</span>
            <span className="h2-nut-thu-suc-phu">{GOI_Y_VE}</span>
          </span>
        </button>
      )}
      {o.deThu.duoc && (
        <button type="button" className="h2-nut-dao h2-nut-thu-suc" data-khoi="de-thu" onClick={() => mo('de-thu')}>
          <span className="h2-nut-dao-chu">
            <span className="h2-nut-dao-lon">{chuDeThu(o.deThu.soCau, o.deThu.phut)}</span>
          </span>
        </button>
      )}
    </>
  )
}

/** Giờ này em hay sai nhanh hơn lúc học tốt nhất: MỘT dòng + hai nút nhỏ "Để mai" / "Làm luôn" (máy chủ xếp lại kế hoạch ⇒ tải lại Sảnh). */
function TheMetGio({ s, token, onTaiLai, ngang = false }: { s: SanhHoa2; token: string; onTaiLai: () => void; ngang?: boolean }) {
  const [dangGoi, setDangGoi] = useState(false)
  const [daQuyet, setDaQuyet] = useState(false)
  const [loi, setLoi] = useState('')
  const mg = s.omni?.metGio
  if (!mg) return null
  const chon = async (quyet: 'de_mai' | 'lam_luon') => {
    if (dangGoi) return
    setDangGoi(true)
    setLoi('')
    try {
      await omniDoiThuTu(goiBangToken(token), quyet)
      setDaQuyet(true)
      onTaiLai()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa đổi được thứ tự câu. Em thử lại.')
    } finally {
      setDangGoi(false)
    }
  }
  const than = (
    <>
      <p className={ngang ? 'h2-ng-phu' : 'h2-tam-chu'} data-khoi="met-gio">{chuMetGio(mg.tiLe, mg.tiLeTot)}</p>
      {mg.coTheDoi && !daQuyet && (
        <div className="h2-omni-hang">
          <button type="button" className="h2-nut-phu" disabled={dangGoi} aria-busy={dangGoi} onClick={() => void chon('de_mai')}>{NUT_DE_MAI}</button>
          <button type="button" className="h2-nut-phu" disabled={dangGoi} aria-busy={dangGoi} onClick={() => void chon('lam_luon')}>{NUT_LAM_LUON}</button>
        </div>
      )}
      {loi && <p className="h2-loi" role="alert">{loi}</p>}
    </>
  )
  return ngang ? <section className="h2-ng-the h2-omni-khoi" aria-label="Giờ học hôm nay">{than}</section> : than
}

/** "Hôm nay em tiến thêm gì" (2–5 dòng máy chủ viết sẵn, chỉ khi xong kế hoạch) nối dưới lời mừng / rương sẵn có. */
function DongNhatKy({ s, lop }: { s: SanhHoa2; lop: string }) {
  const nk = s.omni?.nhatKy
  if (!nk?.length) return null
  return (
    <>
      {nk.map((d, i) => (
        <p key={i} className={lop} data-khoi="nhat-ky">
          {d}
        </p>
      ))}
    </>
  )
}

/** Hết kế hoạch hôm nay: lời mừng + Rương Bát Linh (HS-XongHomNay.dc.html). */
function XongHomNay({ s, exp, token, onTaiLai, ngang = false, thu = null, them = null }: { s: SanhHoa2; exp: SanhBanDoProps['exp']; token: string; onTaiLai: () => void; ngang?: boolean; thu?: ThuTrenHud | null; /** OMNI 3: nút phụ đặt ngay sau "Thử sức thêm" (vắng ⇒ không có gì). */ them?: ReactNode }) {
  const [dangMo, setDangMo] = useState(false)
  const [loi, setLoi] = useState('')
  const [vangVuaNhan, setVangVuaNhan] = useState<number | null>(null)
  const refRuong = useRef<HTMLSpanElement | SVGSVGElement | null>(null)
  const huyPhao = useRef<() => void>(() => {})
  useEffect(() => () => huyPhao.current(), [])
  /** Pháo sáng khi mở rương: hạt nổ ở rương + loạt pháo (không có ở máy giảm chuyển động). */
  const phaoMoRuong = () => {
    const el = refRuong.current
    const fx = timFx(el)
    if (!el || !fx) return
    const r = el.getBoundingClientRect()
    const [x, y] = veToaDoFx(fx, r.left + r.width / 2, r.top + r.height / 2)
    hat(fx, x, y, 40, MAU_PHAO[0], 90, 7, 1.2, 20)
    huyPhao.current()
    huyPhao.current = loatPhao(fx)
  }
  const r = s.ruong
  const moDuoc = r.moDuoc && !r.daMo && vangVuaNhan === null
  const vangDaCo = vangVuaNhan ?? r.qua?.vang ?? null
  const mo = async () => {
    if (dangMo) return
    setDangMo(true)
    setLoi('')
    try {
      const kq = await moRuong(token)
      setVangVuaNhan(kq.vang)
      phaoMoRuong()
      onTaiLai()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa mở được rương. Em thử lại.')
    } finally {
      setDangMo(false)
    }
  }
  const mai = s.ngay ? ngaySau(s.ngay) : ''
  const daLam = r.tong > 0 ? r.daLam : s.theLuc.tong - s.theLuc.con
  const tongKh = r.tong > 0 ? r.tong : s.theLuc.tong
  const tinRuong = vangDaCo !== null && (r.daMo || vangVuaNhan !== null) && (
    <p className="h2-ruong-da" role="status">
      Rương Bát Linh đã mở · +{vangDaCo} vàng (dùng ở Cửa hàng phụ kiện)
    </p>
  )
  const tinLoi = loi && (
    <p className="h2-loi" role="alert">
      {loi}
    </p>
  )
  const nutMo = moDuoc && (
    <button type="button" className="h2-nut-chinh" onClick={() => void mo()} disabled={dangMo} aria-busy={dangMo}>
      <span className="h2-nut-chinh-chu">
        <span className="h2-nut-chinh-lon baloo">{dangMo ? 'ĐANG MỞ RƯƠNG…' : 'MỞ RƯƠNG BÁT LINH'}</span>
        <span className="h2-nut-chinh-nho">Quà xong trọn kế hoạch hôm nay · vàng mua phụ kiện</span>
      </span>
      <IconRuong />
    </button>
  )
  if (ngang) {
    // Ngang-XongHomNay: cột bản đồ thành màn mừng — thần thú EM ĐÃ CHỌN (ảnh thật, đúng dạng theo cấp) + rương + 2 số có nhãn + nút mở rương.
    return (
      <section className="h2-ng-xong" aria-label="Hôm nay em xong rồi">
        <p className="h2-ng-nho">Kế hoạch hôm nay{s.ngay ? ` · ${thuNgayThang(s.ngay)}` : ''}</p>
        <h2 className="h2-ng-xong-lon baloo">Hôm nay em xong rồi!</h2>
        <p className="h2-ng-xong-chu">{moDuoc ? 'Em làm trọn kế hoạch — Rương Bát Linh đã sẵn sàng mở' : 'Em làm trọn kế hoạch hôm nay'}</p>
        <div className="h2-ng-xong-tranh" aria-hidden="true">
          {thu && <img className="h2-ng-xong-thu" src={anhThu(thu.index, thu.cap)} alt="" width={200} height={200} />}
          <svg className="h2-ng-xong-ruong" ref={(e) => { refRuong.current = e }} data-mo={vangDaCo !== null ? 'true' : 'false'} width="190" height="170" viewBox="0 0 190 170" focusable="false">
            <path d="M16 70 a79 56 0 0 1 158 0 v14 h-158 z" fill="rgb(176 122 62)" stroke="rgb(90 53 20)" strokeWidth="6" />
            <rect x="16" y="80" width="158" height="80" rx="10" fill="rgb(150 98 46)" stroke="rgb(90 53 20)" strokeWidth="6" />
            <rect x="10" y="74" width="170" height="16" rx="4" fill="rgb(255 201 64)" />
            <rect x="16" y="80" width="10" height="80" fill="rgb(255 201 64)" />
            <rect x="164" y="80" width="10" height="80" fill="rgb(255 201 64)" />
            <rect x="78" y="66" width="34" height="40" rx="6" fill="rgb(255 214 107)" stroke="rgb(90 53 20)" strokeWidth="4" />
            <circle cx="95" cy="86" r="6" fill="rgb(90 53 20)" />
          </svg>
        </div>
        <div className="h2-ng-xong-so">
          <span className="h2-ng-o-so">
            <b className="baloo">
              {daLam}/{tongKh}
            </b>
            <span>câu kế hoạch</span>
          </span>
          {exp && (
            <span className="h2-ng-o-so" data-mau="vang">
              <b className="baloo">+{exp.homNay}</b>
              <span>EXP{thu ? ` cho ${thu.ten}` : ' hôm nay'}</span>
            </span>
          )}
        </div>
        {s.tamGiuCa > 0 && <p className="h2-ng-phu" data-khoi="tam-giu-ca">{chuTamGiu(s.tamGiuCa)}</p>}
        {tinRuong}
        <DongNhatKy s={s} lop="h2-ng-phu" />
        {tinLoi}
        {nutMo}
        <NutThuSucThem s={s} token={token} onTaiLai={onTaiLai} />
        {them}
      </section>
    )
  }
  return (
    <>
      <section className="h2-xong" aria-label="Hôm nay em xong rồi">
        <div className="h2-xong-dau">
          <span className="h2-ruong-3d" ref={(e) => { refRuong.current = e }} data-mo={vangDaCo !== null ? 'true' : 'false'} aria-hidden="true">
            <span className="h2-tia-ruong" />
            <svg viewBox="0 0 64 64" focusable="false">
              <g className="h2-than-ruong">
                <ellipse cx="32" cy="58" rx="24" ry="4" fill="rgb(30 90 60 / .25)" />
                <rect x="8" y="30" width="48" height="26" rx="4" fill="rgb(206 130 50)" stroke="rgb(120 66 20)" strokeWidth="2.5" />
                <rect x="8" y="38" width="48" height="5" fill="rgb(255 200 60)" />
                <rect x="28" y="34" width="8" height="12" rx="2" fill="rgb(255 226 120)" stroke="rgb(150 90 10)" strokeWidth="1.5" />
                <g className="h2-nap-ruong">
                  <path d="M8 32 V26 a24 12 0 0 1 48 0 V32 Z" fill="rgb(230 160 80)" stroke="rgb(120 66 20)" strokeWidth="2.5" />
                  <path d="M8 29 h48" stroke="rgb(255 200 60)" strokeWidth="4" />
                  <path d="M14 22 q18 -12 36 0" stroke="rgb(255 240 200 / .8)" strokeWidth="2" fill="none" />
                </g>
              </g>
            </svg>
          </span>
          <span className="h2-xong-lon baloo">Hôm nay em xong rồi</span>
        </div>
        <p className="h2-xong-chu">
          {r.tong > 0 ? `${r.daLam}/${r.tong} câu` : `${s.theLuc.tong - s.theLuc.con}/${s.theLuc.tong} câu`}
          {exp ? ` · +${exp.homNay} EXP hôm nay` : ''}
        </p>
        {s.tamGiuCa > 0 && <p className="h2-xong-phu" data-khoi="tam-giu-ca">{chuTamGiu(s.tamGiuCa)}</p>}
        {mai && <p className="h2-xong-phu">Kế hoạch ngày mai sẵn lúc 00:00 {thuNgayThang(mai)}: câu đến lịch ôn lại và câu mới.</p>}
        {tinRuong}
        <DongNhatKy s={s} lop="h2-xong-phu" />
        {tinLoi}
      </section>
      {nutMo}
      <NutThuSucThem s={s} token={token} onTaiLai={onTaiLai} />
      {them}
    </>
  )
}

/** OMNI 3 · chế độ chờ bài mới (thầy chưa tick bài mới): dòng "chưa có câu" đổi thành "Hôm nay ôn bài cũ: N câu" / "Đang ôn bài cũ, chờ thầy giao bài mới." */
const chuChoBaiMoi = (s: SanhHoa2): string | null => (s.omni?.choBaiMoi ? (s.omni.onBaiCu > 0 ? chuOnBaiCu(s.omni.onBaiCu) : CHU_CHO_BAI_MOI) : null)
/** Kế hoạch hôm nay không còn câu: câu tạm giữ vì ca kiểm tra (30/09) ⇒ nói rõ, khỏi tưởng lỗi. */
const chuKhongConCau = (s: SanhHoa2): string =>
  s.tamGiuCa > 0 ? `Có ${s.tamGiuCa} câu hôm nay đang tạm giữ vì lớp đang có ca kiểm tra. Câu sẽ tự mở lại sau khi ca kết thúc.` : chuChoBaiMoi(s) ?? 'Hôm nay chưa có câu nào trong kế hoạch của em. Em quay lại sau nhé.'
/** Dòng nhỏ dưới số câu kế hoạch ở màn xong: câu tạm giữ vì ca kiểm tra. */
const chuTamGiu = (n: number): string => `+${n} câu tạm giữ vì ca kiểm tra, mở lại sau ca`

/** Chưa có chiến dịch đang chạy: chiến dịch sắp bắt đầu (thầy 28/09) ⇒ báo ngày; không thì câu cũ. */
const chuChuaCoChienDich = (s: SanhHoa2): string =>
  s.sapBatDau ? `Chiến dịch ${s.sapBatDau.ten} bắt đầu ${thuNgayThang(s.sapBatDau.batDau)}. Tới ngày đó bản đồ sẽ mở đảo mới ở đây.` : chuChoBaiMoi(s) ?? 'Thầy chưa giao chiến dịch nào cho em. Khi thầy giao, bản đồ sẽ mở đảo mới ở đây.'

function TamDuoi({ p, s }: { p: SanhBanDoProps; s: SanhHoa2 }) {
  const xong = s.theLuc.tong > 0 && s.theLuc.con === 0
  const trong = s.theLuc.tong === 0
  return (
    <>
      {xong ? (
        <>
          <XongHomNay s={s} exp={p.exp} token={p.token} onTaiLai={p.onTaiLai} them={<NutOmniThem s={s} onKhamPhaDao={p.onKhamPhaDao} />} />
          <NutBia p={p} s={s} />
        </>
      ) : trong ? (
        s.chienDich ? (
          <>
            <p className="h2-tam-chu" data-khoi={s.tamGiuCa > 0 ? 'tam-giu-ca' : undefined}>{chuKhongConCau(s)}</p>
            <NutThuSucThem s={s} token={p.token} onTaiLai={p.onTaiLai} />
            <NutOmniThem s={s} onKhamPhaDao={p.onKhamPhaDao} />
          </>
        ) : (
          <NutOmniThem s={s} onKhamPhaDao={p.onKhamPhaDao} />
        )
      ) : (
        <>
          <NutViec p={p} s={s} />
          <TheMetGio s={s} token={p.token} onTaiLai={p.onTaiLai} />
        </>
      )}
      {s.huyetChien && !xong ? <TheHuyetChien s={s} now={p.now} /> : s.chienDich ? <DongChienDich s={s} now={p.now} /> : (
        <p className="h2-tam-chu" data-khoi="sap-bat-dau">{chuChuaCoChienDich(s)}</p>
      )}
      <NutTuLuyen p={p} />
    </>
  )
}

/** Nút việc hôm nay (còn ổ phục kích ⇒ PHÁ N Ổ; hết ổ ⇒ KHÁM PHÁ ĐẢO) — dùng chung bản dọc và bản ngang. */
/** Cửa Bi-a Phản Ứng (đặc tả Bi-a mục 8.1): còn câu ⇒ "Bi-a Phản Ứng · còn c/t câu"; hết trần ⇒ mờ; xong kế hoạch ⇒ Bàn giao hữu; có ca ⇒ mờ. */
function NutBia({ p, s }: { p: SanhBanDoProps; s: SanhHoa2 }) {
  const b = s.bia
  if (!b || !p.onChoiBia) return null
  const coCa = b.lyDoKhoa === 'dang_co_ca'
  const giaoHuu = b.giaoHuu.mo
  const mo = !coCa && (b.con > 0 || giaoHuu)
  const lon = coCa ? 'Bi-a Phản Ứng · đang có ca kiểm tra' : giaoHuu ? `Bàn giao hữu Bi-a · còn ${b.giaoHuu.con}/2 ván` : b.con > 0 ? `Bi-a Phản Ứng · còn ${b.con}/${b.tong} câu` : 'Hết câu Bi-a hôm nay'
  const nho = coCa ? 'Bi-a mở lại khi ca kết thúc' : giaoHuu ? 'Không câu, không EXP · em đã xong kế hoạch' : b.con > 0 ? 'Kim loại đấu Phi kim · mỗi bi một câu' : `Đoàn còn ${s.doan.con} câu · Đảo còn ${s.dao.con} câu`
  return (
    <button type="button" className="h2-nut-dao h2-nut-bia" disabled={!mo} onClick={mo ? p.onChoiBia : undefined}>
      <span className="h2-nut-dao-chu">
        <span className="h2-nut-dao-lon">{lon}</span>
        <span className="h2-nut-dao-khoa">{nho}</span>
      </span>
    </button>
  )
}

/** Cửa TU LUYỆN (thầy chốt 29/09; 30/09 thầy lệnh "đẹp như một MÓN QUÀ cho học sinh chăm chỉ", phụ đề "Chỉ dành cho học sinh Nỗ lực"):
 * thẻ quà nền đêm + ánh kim đúng bảng màu màn Tu luyện (`tu-luyen.css`), biểu tượng hộp quà gắn bia tập bắn (biểu tượng cũ của Tu luyện).
 * Không đổi logic: bấm ⇒ `onTuLuyen` (máy chủ tự chặn khi em có ca kiểm tra mở). Không số liệu (muốn có phải thêm lệnh máy chủ). */
function NutTuLuyen({ p }: { p: SanhBanDoProps }) {
  if (!p.onTuLuyen) return null
  return <CuaQuaTuLuyen onClick={p.onTuLuyen} lop="h2-nut-tu-luyen" />
}
function NutTuLuyenNgang({ onClick }: { onClick: () => void }) {
  return <CuaQuaTuLuyen onClick={onClick} lop="h2-ng-tu-luyen h2-qua-tl-ngang" />
}
function CuaQuaTuLuyen({ onClick, lop }: { onClick: () => void; lop: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <button type="button" className={`h2-qua-tl ${lop}`} onClick={onClick}>
      <span className="h2-qua-tl-lap" aria-hidden="true" />
      <span className="h2-qua-tl-bieu" aria-hidden="true">
        <HopQuaTuLuyen id={id} />
      </span>
      <span className="h2-qua-tl-chu">
        <span className="h2-qua-tl-ten baloo">Tu luyện</span>
        <span className="h2-qua-tl-phu">Chỉ dành cho học sinh Nỗ lực</span>
      </span>
      <span className="h2-qua-tl-mui" aria-hidden="true">
        <svg width="20" height="20" {...NET} strokeWidth={2.6}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </button>
  )
}
/** Hộp quà vàng buộc nơ ngọc, mặt hộp gắn bia tập bắn (luyện trúng đích) + hai đốm sao lấp lánh. Màu qua lớp CSS (token `--qtl-*`). */
function HopQuaTuLuyen({ id }: { id: string }) {
  return (
    <svg width="52" height="52" viewBox="0 0 48 48" focusable="false">
      <defs>
        <linearGradient id={`${id}-nap`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="h2-qtl-s-vang-sang" />
          <stop offset="1" className="h2-qtl-s-vang-dam" />
        </linearGradient>
        <linearGradient id={`${id}-than`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="h2-qtl-s-nen-3" />
          <stop offset="1" className="h2-qtl-s-nen" />
        </linearGradient>
      </defs>
      <rect x="8.5" y="22" width="31" height="20" rx="3.5" fill={`url(#${id}-than)`} className="h2-qtl-vien" />
      <rect x="21" y="22" width="6" height="20" className="h2-qtl-ngoc" />
      <rect x="6" y="15.5" width="36" height="8" rx="2.5" fill={`url(#${id}-nap)`} />
      <rect x="21" y="15.5" width="6" height="8" className="h2-qtl-ngoc-dam" />
      <path d="M24 15.5c-3-6.5-10.5-8-11-3.4-.4 3.3 5.8 3.8 11 3.4z" className="h2-qtl-ngoc" />
      <path d="M24 15.5c3-6.5 10.5-8 11-3.4.4 3.3-5.8 3.8-11 3.4z" className="h2-qtl-ngoc" />
      <circle cx="24" cy="15" r="2.4" className="h2-qtl-ngoc-dam" />
      <circle cx="24" cy="32" r="6.6" className="h2-qtl-bia" />
      <circle cx="24" cy="32" r="3.8" className="h2-qtl-bia-vong" />
      <circle cx="24" cy="32" r="1.4" className="h2-qtl-bia-tam" />
      <path d="M41 4.5l1.1 2.9 2.9 1.1-2.9 1.1-1.1 2.9-1.1-2.9-2.9-1.1 2.9-1.1z" className="h2-qtl-sao h2-qtl-sao-1" />
      <path d="M5.5 5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" className="h2-qtl-sao h2-qtl-sao-2" />
    </svg>
  )
}

function NutViec({ p, s }: { p: SanhBanDoProps; s: SanhHoa2 }) {
  return <><NutViecChinh p={p} s={s} /><NutBia p={p} s={s} /></>
}
function NutViecChinh({ p, s }: { p: SanhBanDoProps; s: SanhHoa2 }) {
  return s.doan.con > 0 ? (
        <>
          <button type="button" className="h2-nut-chinh" onClick={p.onPhaPhucKich}>
            <span className="h2-nut-chinh-chu">
              <span className="h2-nut-chinh-lon baloo">PHÁ {s.doan.con} Ổ PHỤC KÍCH</span>
              <span className="h2-nut-chinh-nho">Đoàn Hộ Tống · {s.doan.con} câu ôn</span>
            </span>
            <IconKiem />
          </button>
          {s.dao.con > 0 && (
            <button type="button" className="h2-nut-dao" disabled={s.khoaDao} onClick={s.khoaDao ? undefined : p.onKhamPhaDao}>
              {s.khoaDao && <IconKhoa />}
              <span className="h2-nut-dao-chu">
                <span className="h2-nut-dao-lon">Khám phá Bát Linh Đảo · {s.dao.con} câu</span>
                {s.khoaDao && s.loiKhoaDao && <span className="h2-nut-dao-khoa">{s.loiKhoaDao}</span>}
              </span>
            </button>
          )}
        </>
      ) : s.dao.con > 0 ? (
        <button type="button" className="h2-nut-chinh" onClick={p.onKhamPhaDao}>
          <span className="h2-nut-chinh-chu">
            <span className="h2-nut-chinh-lon baloo">
              KHÁM PHÁ BÁT LINH ĐẢO <span className="h2-nw">· {s.dao.con} câu</span>
            </span>
            <span className="h2-nut-chinh-nho">Đã phá hết ổ phục kích · cầu sang đảo đã hạ</span>
          </span>
          <IconKiem />
        </button>
      ) : null
}

// ═══════════════════ BẢN NGANG (docs/ban-ve-ngang-2809/Ngang-Sanh + Ngang-XongHomNay) ═══════════════════
// Lưới 7/5: cột 7 = bản đồ (hoặc màn mừng khi xong kế hoạch); cột 5 = thẻ chiến dịch · Thể lực · nút chính · Rương · Câu đã làm.
// Cùng dữ liệu, cùng nút, cùng luồng với bản dọc — chỉ đổi sắp đặt.

function Thanh({ nhan, co, tong, mau }: { nhan: string; co: number; tong: number; mau: 'ngoc' | 'vang' }) {
  return (
    <span className="h2-ng-thanh" data-mau={mau}>
      <span className="h2-ng-thanh-dau">
        <span>{nhan}</span>
        <b>
          {co}/{tong} câu
        </b>
      </span>
      <span className="h2-ng-ray" data-mau={mau} role="progressbar" aria-label={nhan} aria-valuemin={0} aria-valuemax={tong} aria-valuenow={co}>
        <span style={{ width: `${phanTram(co, tong)}%` }} />
      </span>
    </span>
  )
}

function TheChienDichNgang({ s, now }: { s: SanhHoa2; now: number }) {
  if (s.hanhTrinh) return <TheHanhTrinh s={s} />
  const cd = s.chienDich!
  const p = phanTram(cd.coXat, cd.tong)
  const chuVi = 2 * Math.PI * 40
  return (
    <section className="h2-ng-the h2-ng-cd" aria-label="Chiến dịch đang mở">
      <span className="h2-ng-vong" role="img" aria-label={`Cọ xát ${p}%`}>
        <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
          <circle cx="48" cy="48" r="40" stroke="rgb(40 50 110 / 0.1)" strokeWidth="9" fill="none" />
          <circle cx="48" cy="48" r="40" stroke="rgb(0 170 175)" strokeWidth="9" fill="none" strokeDasharray={`${((chuVi * p) / 100).toFixed(1)} ${chuVi.toFixed(1)}`} strokeLinecap="round" transform="rotate(-90 48 48)" />
        </svg>
        <span className="h2-ng-vong-chu">
          <b className="baloo">{p}%</b>
          <span>Cọ xát</span>
        </span>
      </span>
      <span className="h2-ng-cd-chu">
        <span className="h2-ng-nho">Chiến dịch đang mở</span>
        <span className="h2-ng-cd-ten baloo">Chiến dịch {cd.ten}</span>
        {cd.hanNop && <span className="h2-ng-phu">Hạn nộp: {chuHanNop(cd.hanNop, now)}</span>}
        <span className="h2-ng-hai-thanh">
          <Thanh nhan="Cọ xát" co={cd.coXat} tong={cd.tong} mau="ngoc" />
          <Thanh nhan="Thành thạo" co={cd.thanhThao} tong={cd.tong} mau="vang" />
        </span>
        {cd.thanhThao === 0 && cd.thanhThaoTangTu && <span className="h2-ng-phu h2-ng-an-thap">Thành thạo bắt đầu tăng từ {thuNgayThang(cd.thanhThaoTangTu)}.</span>}
        {s.omni && <DongOmniChienDich o={s.omni} cdId={cd.id} lop="h2-ng-phu h2-ng-an-thap" />}
      </span>
    </section>
  )
}

function TheTheLucNgang({ s }: { s: SanhHoa2 }) {
  const { con, tong } = s.theLuc
  return (
    <section className="h2-ng-the h2-ng-tl" aria-label="Thể lực hôm nay">
      <span className="h2-ng-tl-o" aria-hidden="true">
        <svg width="24" height="26" viewBox="0 0 14 16" focusable="false">
          <polygon points="7,0 14,5 11,16 3,16 0,5" fill="rgb(0 170 175)" />
        </svg>
      </span>
      <span className="h2-ng-tl-chu">
        <span className="h2-ng-tl-dau">
          <b>Thể lực hôm nay</b>
          <b className="h2-ng-tl-so baloo">
            {con}/{tong} câu còn lại
          </b>
        </span>
        <span className="h2-ng-ray" data-mau="ngoc" role="progressbar" aria-label="Thể lực còn lại" aria-valuemin={0} aria-valuemax={tong} aria-valuenow={con}>
          <span style={{ width: `${phanTram(con, tong)}%` }} />
        </span>
        <span className="h2-ng-phu h2-ng-an-thap">
          {con === 0 ? `Đã làm ${tong} câu · xong kế hoạch hôm nay` : `Đã làm ${tong - con} câu · ${s.doan.con} câu ôn + ${s.dao.con} câu mới đang chờ`}
        </span>
      </span>
    </section>
  )
}

function TheRuongNgang({ r }: { r: SanhHoa2['ruong'] }) {
  return (
    <section className="h2-ng-the h2-ng-ruong" aria-label="Rương Bát Linh">
      <span className="h2-ng-ruong-o" aria-hidden="true">
        <IconRuong />
      </span>
      <span className="h2-ng-tl-chu">
        <b>Rương Bát Linh</b>
        <span className="h2-ng-phu h2-ng-an-thap">{r.daMo ? 'Rương hôm nay đã mở' : `Xong ${r.tong}/${r.tong} câu hôm nay → mở rương, nhận vàng mua phụ kiện`}</span>
        <span className="h2-ng-ruong-hang">
          <span className="h2-ng-ray" data-mau="vang" role="progressbar" aria-label="Câu đã làm cho Rương Bát Linh" aria-valuemin={0} aria-valuemax={r.tong} aria-valuenow={r.daLam}>
            <span style={{ width: `${phanTram(r.daLam, r.tong)}%` }} />
          </span>
          <b className="h2-ng-ruong-so">
            {r.daLam}/{r.tong} câu
          </b>
        </span>
      </span>
    </section>
  )
}

function NutCauDaLamNgang({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="h2-ng-the h2-ng-cdl" onClick={onClick}>
      <IconSo co={24} />
      <span className="h2-ng-cdl-chu">
        <b>Câu đã làm</b>
        <span className="h2-ng-phu"> · xem lại đề, đáp án, lời giải · Tải PDF</span>
      </span>
      <svg width="22" height="22" {...NET} strokeWidth={2.4}>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  )
}

function NutTron({ nhan, onClick, children }: { nhan: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="h2-kinh h2-ng-nut-tron" aria-label={nhan} title={nhan} onClick={onClick}>
      {children}
    </button>
  )
}

function TheHanhTrinh({ s }: { s: SanhHoa2 }) {
  const h = s.hanhTrinh!
  return <section className="h2-ng-the" aria-label="Hành trình hôm nay">
    <b>Hành trình giỏi hoá · {['Nền', 'Hiểu', 'Vận dụng', 'Tổng hợp'][h.tang - 1]}</b>
    <p className="h2-ng-phu">Hôm nay: {h.daLam}/{h.toiThieu} câu tối thiểu</p>
    <p className="h2-ng-phu">{h.daLam >= h.toiThieu ? 'Đã hoàn thành nhiệm vụ hôm nay' : `Chặng ${h.changHienTai}/${h.soChang} · còn ${h.cauTrongChang} câu trong chặng`}</p>
    {h.conThieu > 0 && <p className="h2-ng-phu">Còn thiếu {h.conThieu} câu phù hợp cho kế hoạch hôm nay.</p>}
  </section>
}

function CotPhaiNgang({ p, s }: { p: SanhBanDoProps; s: SanhHoa2 }) {
  const xong = s.theLuc.tong > 0 && s.theLuc.con === 0
  const trong = s.theLuc.tong === 0
  const mai = s.ngay ? ngaySau(s.ngay) : ''
  return (
    <>
      {s.huyetChien && !xong ? (
        <TheHuyetChien s={s} now={p.now} />
      ) : s.chienDich ? (
        <TheChienDichNgang s={s} now={p.now} />
      ) : (
        <p className="h2-ng-the h2-tam-chu" data-khoi="sap-bat-dau">{chuChuaCoChienDich(s)}</p>
      )}
      {!trong && <TheTheLucNgang s={s} />}
      {xong ? (
        <>
          {mai && (
            <section className="h2-ng-the h2-ng-mai" aria-label="Kế hoạch ngày mai">
              <b>Kế hoạch ngày mai</b>
              <span className="h2-ng-phu">Sẵn lúc 00:00 {thuNgayThang(mai)}: câu đến lịch ôn lại và câu mới.</span>
            </section>
          )}
          <NutBia p={p} s={s} />
        </>
      ) : trong ? (
        s.chienDich ? (
          <>
            <p className="h2-ng-the h2-tam-chu" data-khoi={s.tamGiuCa > 0 ? 'tam-giu-ca' : undefined}>{chuKhongConCau(s)}</p>
            <NutThuSucThem s={s} token={p.token} onTaiLai={p.onTaiLai} />
            <NutOmniThem s={s} onKhamPhaDao={p.onKhamPhaDao} />
          </>
        ) : (
          <NutOmniThem s={s} onKhamPhaDao={p.onKhamPhaDao} />
        )
      ) : (
        <>
          <NutViec p={p} s={s} />
          <TheMetGio s={s} token={p.token} onTaiLai={p.onTaiLai} ngang />
        </>
      )}
      {!xong && s.ruong.tong > 0 && <TheRuongNgang r={s.ruong} />}
      <span className="h2-ng-dan" aria-hidden="true" />
      <NutCauDaLamNgang onClick={p.onCauDaLam} />
      {p.onTuLuyen && <NutTuLuyenNgang onClick={p.onTuLuyen} />}
    </>
  )
}

/** Cảnh mở màn ~2 giây: chỉ LẦN ĐẦU Sảnh có dữ liệu trong phiên (sessionStorage), không chạy ở máy giảm chuyển động. */
function useMoMan(coDuLieu: boolean): boolean {
  const [dang, setDang] = useState(false)
  const daXet = useRef(false)
  const hen = useRef(0)
  useLayoutEffect(() => {
    if (!coDuLieu || daXet.current) return
    daXet.current = true
    if (!nhanLuotMoMan()) return
    setDang(true)
    hen.current = window.setTimeout(() => setDang(false), 2600)
  }, [coDuLieu])
  useEffect(() => () => clearTimeout(hen.current), [])
  return dang
}

/** Hạt sáng bay lên khi rê / chạm nút chính vàng (một bộ nghe ở gốc Sảnh cho mọi `.h2-nut-chinh`). */
let lanReCuoi = 0
function phunHatNut(e: SuKienTro<HTMLDivElement>, n: number) {
  const nut = (e.target as Element | null)?.closest?.('.h2-nut-chinh')
  if (!nut || (nut as HTMLButtonElement).disabled) return
  if (n < 5) {
    if (e.pointerType !== 'mouse') return
    const bay = performance.now()
    if (bay - lanReCuoi < 70) return
    lanReCuoi = bay
  }
  const fx = timFx(nut)
  if (!fx) return
  const [x, y] = veToaDoFx(fx, e.clientX, e.clientY)
  for (let i = 0; i < n; i++) hatBay(fx, x + (Math.random() - 0.5) * 40, y)
}
const nghePhun = {
  onPointerMove: (e: SuKienTro<HTMLDivElement>) => phunHatNut(e, 2),
  onPointerDown: (e: SuKienTro<HTMLDivElement>) => phunHatNut(e, 12),
}

function SanhNgang({ p, bc, moMan }: { p: SanhBanDoProps; bc: BoCucNgang; moMan: boolean }) {
  const kq = p.ketQua
  const s = kq && kq.cheDo2 && !kq.canChonThu ? kq.sanh : null
  const chonThu = !!kq && kq.cheDo2 && kq.canChonThu === true
  const xong = !!s && s.theLuc.tong > 0 && s.theLuc.con === 0
  const coThu = !chonThu
  const kieu = bc.thap ? ({ '--h2-ti-le': String(bc.tiLe) } as CSSProperties) : undefined
  return (
    <div className="h2-sanh h2-ngang" data-bo-cuc="ngang" data-thap={bc.thap ? 'true' : 'false'} data-mo-man={moMan ? 'true' : 'false'} data-trang-thai={s ? 'co' : chonThu ? 'chon-thu' : p.loi ? 'loi' : 'dang-tai'} style={kieu} {...nghePhun}>
      <div className="h2-fx" aria-hidden="true" />
      <div className="h2-ng-khung">
        <div className="h2-ng-tren">
          <Hud thu={chonThu ? null : p.thu} exp={chonThu ? null : p.exp} chuoiNgay={null} theLuc={null} onMoThanThu={chonThu ? p.onChonThu : p.onMoThanThu} onDoiTen={chonThu ? undefined : p.onDoiTen} />
          <nav className="h2-ng-tren-phai" aria-label="Lối tắt">
            <span className="h2-kinh h2-ng-chuoi h2-chuoi" aria-label={`Chuỗi ${p.chuoiNgay} ngày`}>
              <IconChuoi />
              Chuỗi {p.chuoiNgay} ngày
            </span>
            <button type="button" className="h2-kinh h2-ng-nut-ca" data-noi-bat={p.caDangMo ? 'true' : undefined} onClick={p.onVaoThi}>
              <IconCa co={20} />
              {p.caDangMo ? 'Ca đang mở · Vào thi' : 'Ca kiểm tra'}
            </button>
            {coThu && (
              <NutTron nhan="Túi đồ" onClick={p.onTuiDo}>
                <IconTui />
              </NutTron>
            )}
            {coThu && p.shopBat && (
              <NutTron nhan="Cửa hàng" onClick={p.onCuaHang}>
                <IconCuaHang />
              </NutTron>
            )}
            <NutTron nhan="Đăng xuất" onClick={p.onDangXuat}>
              <IconDangXuat />
            </NutTron>
          </nav>
        </div>
        <section className="h2-ng-trai" data-xong={xong ? 'true' : 'false'} aria-label={xong ? 'Kế hoạch hôm nay' : 'Bản đồ Bát Linh'}>
          {s && xong ? (
            <XongHomNay s={s} exp={p.exp} token={p.token} onTaiLai={p.onTaiLai} ngang thu={p.thu} them={<NutOmniThem s={s} onKhamPhaDao={p.onKhamPhaDao} />} />
          ) : (
            <>
              <DongHanh thu={chonThu ? null : p.thu} onMo={chonThu ? p.onChonThu : p.onMoThanThu} />
              <details className="bl-ban-do"><summary>Bản đồ hành trình <span>Khám phá & ôn tập</span></summary><div className="bl-ban-do__canh"><BanDoHanhTrinh s={s} /></div></details>
            </>
          )}
        </section>
        <aside className="h2-ng-phai" aria-label="Việc hôm nay" aria-busy={p.dangTai && !s}>
          {p.caDangMo && <DaiVaoThi onVaoThi={p.onVaoThi} />}
          <TheCaGanNhatSanh p={p} />
          {s ? (
            <CotPhaiNgang p={p} s={s} />
          ) : chonThu ? (
            <>
              <p className="h2-ng-the h2-tam-chu">Em chọn thần thú đồng hành trước khi lên đường. Thần thú lớn lên theo EXP em học được.</p>
              <button type="button" className="h2-nut-chinh" onClick={p.onChonThu}>
                <span className="h2-nut-chinh-chu">
                  <span className="h2-nut-chinh-lon baloo">CHỌN THẦN THÚ CỦA EM</span>
                  <span className="h2-nut-chinh-nho">Một lần chọn, đồng hành cả năm học</span>
                </span>
              </button>
            </>
          ) : p.loi ? (
            <div className="h2-ng-the h2-loi-khoi" role="alert">
              <p className="h2-tam-chu">{p.loi}</p>
              <button type="button" className="h2-nut-phu" onClick={p.onTaiLai}>
                Thử lại
              </button>
            </div>
          ) : (
            <div className="h2-ng-the h2-xuong" role="status">
              <span className="h2-xuong-dong" />
              <span className="h2-xuong-dong ngan" />
              <span className="h2-xuong-nut" />
              <span className="h2-an">Đang mở bản đồ…</span>
            </div>
          )}
          {s && p.loi && (
            <p className="h2-cu" role="status">
              Chưa cập nhật được: {p.loi}
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}

export default function SanhBanDo(goc: SanhBanDoProps) {
  // Chuyển màn nhanh (05/10, man-sanh-luoi.ts): cửa Câu đã làm / Tu luyện bắn lệnh mở màn ngay lúc chạm rồi gọi đúng hàm cửa cũ.
  const p = boCuaNhanh(goc)
  const bc = useBoCucNgang()
  const kq = p.ketQua
  const moMan = useMoMan(!!kq && kq.cheDo2 && !kq.canChonThu && !!kq.sanh)
  // Chuyển màn nhanh (05/10): Sảnh có số ⇒ lúc rảnh nạp sẵn mảnh Đảo / Đoàn / Câu đã làm / Tu luyện (man-sanh-luoi.ts). Không đổi gì trên màn.
  const sanhCo = kq && kq.cheDo2 && !kq.canChonThu ? kq.sanh : null
  useNapTruocManSanh(!!sanhCo, !!sanhCo && sanhCo.doan.con > 0)
  if (bc.ngang) return <SanhNgang p={p} bc={bc} moMan={moMan} />
  return <SanhDoc p={p} moMan={moMan} />
}

/** Bản dọc (điện thoại): bản đồ 3D phủ cả khung, HUD trên, lối tắt phải, tấm kính dưới. */
function SanhDoc({ p, moMan }: { p: SanhBanDoProps; moMan: boolean }) {
  const kq = p.ketQua
  const s = kq && kq.cheDo2 && !kq.canChonThu ? kq.sanh : null
  const chonThu = !!kq && kq.cheDo2 && kq.canChonThu === true
  return (
    <div className="h2-sanh" data-mo-man={moMan ? 'true' : 'false'} data-trang-thai={s ? 'co' : chonThu ? 'chon-thu' : p.loi ? 'loi' : 'dang-tai'} {...nghePhun}>
      <div className="h2-fx" aria-hidden="true" />
      <div className="h2-khung">
        <Hud thu={chonThu ? null : p.thu} exp={chonThu ? null : p.exp} chuoiNgay={p.chuoiNgay} theLuc={s ? s.theLuc : null} onMoThanThu={chonThu ? p.onChonThu : p.onMoThanThu} onDoiTen={chonThu ? undefined : p.onDoiTen} />
        <DongHanh thu={chonThu ? null : p.thu} xong={!!s && s.theLuc.tong > 0 && s.theLuc.con === 0} onMo={chonThu ? p.onChonThu : p.onMoThanThu} />
        <div className="h2-dem" aria-hidden="true" />
        <section className="h2-tam" aria-label="Việc hôm nay" aria-busy={p.dangTai && !s}>
          <div className="bl-ke-hoach"><span className="bl-eyebrow">TỪNG BƯỚC TIẾN BỘ</span><h2>Hành trình hôm nay</h2></div>
          {p.caDangMo && <DaiVaoThi onVaoThi={p.onVaoThi} />}
          <TheCaGanNhatSanh p={p} />
          {s ? (
            <TamDuoi p={p} s={s} />
          ) : chonThu ? (
            <>
              <p className="h2-tam-chu">Em chọn thần thú đồng hành trước khi lên đường. Thần thú lớn lên theo EXP em học được.</p>
              <button type="button" className="h2-nut-chinh" onClick={p.onChonThu}>
                <span className="h2-nut-chinh-chu">
                  <span className="h2-nut-chinh-lon baloo">CHỌN THẦN THÚ CỦA EM</span>
                  <span className="h2-nut-chinh-nho">Một lần chọn, đồng hành cả năm học</span>
                </span>
              </button>
            </>
          ) : p.loi ? (
            <div className="h2-loi-khoi" role="alert">
              <p className="h2-tam-chu">{p.loi}</p>
              <button type="button" className="h2-nut-phu" onClick={p.onTaiLai}>
                Thử lại
              </button>
            </div>
          ) : (
            <div className="h2-xuong" role="status">
              <span className="h2-xuong-dong" />
              <span className="h2-xuong-dong ngan" />
              <span className="h2-xuong-nut" />
              <span className="h2-an">Đang mở bản đồ…</span>
            </div>
          )}
          {s && p.loi && (
            <p className="h2-cu" role="status">
              Chưa cập nhật được: {p.loi}
            </p>
          )}
        </section>
        <details className="bl-ban-do"><summary>Bản đồ hành trình <span>Khám phá & ôn tập</span></summary><div className="bl-ban-do__canh"><BanDoHanhTrinh s={s} /></div></details>
        <Ray onCauDaLam={p.onCauDaLam} onTuiDo={p.onTuiDo} onCuaHang={p.onCuaHang} onDangXuat={p.onDangXuat} shopBat={p.shopBat} onVaoThi={p.onVaoThi} caDangMo={p.caDangMo} coThu={!chonThu} />
      </div>
    </div>
  )
}

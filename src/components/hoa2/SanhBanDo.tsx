// GAME HÓA 2.0 — SẢNH BẢN ĐỒ BÁT LINH (bản vẽ đã chốt: docs/ban-ve-game-hoa-2-2709/Moi-SanhBanDo.dc.html;
// Huyết Chiến theo HS-HuyetChien.dc.html; hết kế hoạch theo HS-XongHomNay.dc.html).
// Màn chính DUY NHẤT của app học sinh khi máy chủ bật `cheDo2`. Trả lời một câu: "hôm nay em làm gì?" — đúng MỘT nút chính (vàng):
//   · còn ổ phục kích (câu ôn ở Đoàn)  → "PHÁ N Ổ PHỤC KÍCH" (mở Đoàn Hộ Tống); nút Đảo khoá kèm đúng câu `loiKhoaDao` của máy chủ;
//   · hết ổ phục kích, còn câu ở Đảo   → "KHÁM PHÁ BÁT LINH ĐẢO · N câu";
//   · hết kế hoạch                     → "Hôm nay em xong rồi" + nút Rương Bát Linh (khi mở được và chưa mở).
// Mọi con số lấy từ máy chủ (`hoa2-sanh`, thần thú/EXP/chuỗi ngày từ /hs/ke-hoach-ngay) — không tự tính, không bịa.
// Dải "Vào thi" chỉ hiện khi có ca kiểm tra đang mở; bấm là vào đúng luồng PhongVaoThi → ExamTakeScreen có sẵn.
import { useEffect, useState, type ReactNode } from 'react'
import { anhThu } from '../../game/than-thu-v2/dao/anh'
import { thanhExp } from '../../game/than-thu-hoa-hoc/kinh-nghiem'
import { moRuong, type KetQuaSanh, type SanhHoa2 } from './api'
import { chuHanNop, ngaySau, ngayThang, thuNgayThang } from './thoi-gian'
import './sanh-ban-do.css'

/** Câu thứ mấy trở đi em không nhận EXP ở ngày Huyết Chiến = trần EXP ngày thường (40 câu, srs2-loi.ts TRAN_NGAY) + 1. */
export const CAU_HET_EXP_HUYET_CHIEN = 41
/** Hiện tối đa bấy nhiêu ổ phục kích trên đường (chữ vẫn nói đủ số thật). */
const TOI_DA_O_VE = 6

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
  onTuiDo: () => void
  onCuaHang: () => void
  onMoThanThu: () => void
  onChonThu: () => void
  onDangXuat: () => void
  onTaiLai: () => void
}

/** Phông tiêu đề game 'Baloo 2' (Google Fonts) — nạp một lần bằng thẻ <link>; mất mạng thì rơi về Be Vietnam Pro. */
function napPhongBaloo() {
  if (typeof document === 'undefined' || document.getElementById('h2-phong-baloo')) return
  const l = document.createElement('link')
  l.id = 'h2-phong-baloo'
  l.rel = 'stylesheet'
  l.href = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&display=swap'
  document.head.appendChild(l)
}

// ─── đường hộ tống: hai đoạn Bézier của bản vẽ (bến → cầu) ─────────────────────────────────────────
type Diem = [number, number]
const DOAN_1: [Diem, Diem, Diem, Diem] = [[84, 470], [120, 430], [104, 370], [146, 334]]
const DOAN_2: [Diem, Diem, Diem, Diem] = [[146, 334], [168, 314], [176, 296], [186, 272]]
function bezier([p0, p1, p2, p3]: [Diem, Diem, Diem, Diem], t: number): Diem {
  const u = 1 - t
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]
}
/** Điểm trên đường ở tỉ lệ t (0 = bến, 1 = chân cầu). Đoạn 1 dài hơn nên chiếm 70%. */
export function diemTrenDuong(t: number): Diem {
  const k = Math.max(0, Math.min(1, t))
  return k < 0.7 ? bezier(DOAN_1, k / 0.7) : bezier(DOAN_2, (k - 0.7) / 0.3)
}
/** Vị trí n ổ phục kích rải đều trên đường (bỏ đoạn sát bến và sát cầu). */
export function viTriOPhucKich(n: number): Diem[] {
  const so = Math.max(0, Math.min(TOI_DA_O_VE, Math.floor(n)))
  if (so === 0) return []
  if (so === 1) return [diemTrenDuong(0.55)]
  return Array.from({ length: so }, (_, i) => diemTrenDuong(0.14 + (0.8 * i) / (so - 1)))
}

const phanTram = (a: number, b: number) => (b > 0 ? Math.round((100 * Math.min(a, b)) / b) : 0)
const pct = (x: number, tong: number) => `${(100 * x) / tong}%`

// 8 đảo mờ của quần đảo Bát Linh (tranh nền, không mang số liệu).
const DAO_MO: { d?: string; cx?: number; cy?: number; r?: number; mo: number }[] = [
  { d: 'M26,106 C28,86 52,76 74,82 C98,88 108,108 100,126 C92,144 64,150 44,142 C28,136 24,122 26,106 Z', mo: 0.55 },
  { d: 'M266,98 C268,86 282,80 294,84 C306,88 310,100 304,110 C298,118 280,120 272,114 C266,110 265,104 266,98 Z', mo: 0.45 },
  { d: 'M326,330 C328,316 344,310 356,316 C368,322 370,336 362,344 C352,352 334,350 328,344 C324,340 325,336 326,330 Z', mo: 0.4 },
  { cx: 30, cy: 262, r: 12, mo: 0.3 },
  { cx: 350, cy: 420, r: 9, mo: 0.3 },
  { cx: 240, cy: 420, r: 8, mo: 0.3 },
  { cx: 362, cy: 232, r: 10, mo: 0.3 },
  { cx: 318, cy: 520, r: 11, mo: 0.3 },
]
const VIEN_DAO = 'M150,200 C150,140 200,110 250,118 C300,124 330,160 322,205 C316,250 280,275 235,272 C190,270 150,255 150,200 Z'

function BanDo({ s }: { s: SanhHoa2 | null }) {
  const cd = s?.chienDich ?? null
  const p = cd ? phanTram(cd.coXat, cd.tong) : 0
  // Sương mù trên đảo chiến dịch: càng cọ xát nhiều câu, sương càng tan.
  const suong = cd ? Math.max(0, 0.92 * (1 - p / 100)) : 0.92
  const oPk = s ? viTriOPhucKich(s.doan.con) : []
  const khoa = !!s?.khoaDao
  return (
    <div className="h2-ban-do" data-khoa-dao={khoa ? 'true' : 'false'}>
      <svg viewBox="0 0 390 600" preserveAspectRatio="xMidYMin meet" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="h2sb-bien" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(13 42 94)" />
            <stop offset="0.6" stopColor="rgb(10 31 74)" />
            <stop offset="1" stopColor="rgb(7 18 41)" />
          </linearGradient>
          <radialGradient id="h2sb-dat" cx="40%" cy="35%">
            <stop offset="0" stopColor="rgb(70 209 154)" />
            <stop offset="0.6" stopColor="rgb(31 140 102)" />
            <stop offset="1" stopColor="rgb(19 96 72)" />
          </radialGradient>
          <radialGradient id="h2sb-mo" cx="40%" cy="35%">
            <stop offset="0" stopColor="rgb(58 110 126)" />
            <stop offset="1" stopColor="rgb(28 63 82)" />
          </radialGradient>
          <radialGradient id="h2sb-linh-tam" cx="40%" cy="35%">
            <stop offset="0" stopColor="rgb(255 255 255)" />
            <stop offset="0.35" stopColor="rgb(191 244 255)" />
            <stop offset="1" stopColor="rgb(47 168 224)" />
          </radialGradient>
          <pattern id="h2sb-luoi" width="14" height="12" patternUnits="userSpaceOnUse">
            <path d="M3.5 0 L10.5 0 L14 6 L10.5 12 L3.5 12 L0 6 Z" fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="0.8" />
          </pattern>
          <clipPath id="h2sb-cat-dao">
            <path d={VIEN_DAO} />
          </clipPath>
          <filter id="h2sb-nhoe" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id="h2sb-sang" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        <rect width="390" height="600" fill="url(#h2sb-bien)" />
        <path
          d="M0 150 q20 -6 40 0 t40 0 t40 0 M220 330 q20 -6 40 0 t40 0 t40 0 t40 0 M0 400 q20 -6 40 0 t40 0 M260 470 q20 -6 40 0 t40 0 t40 0 M120 540 q20 -6 40 0 t40 0 t40 0"
          stroke="rgb(140 200 255 / 0.14)"
          strokeWidth="2"
          fill="none"
        />
        <g data-ve="dao-mo">
          {DAO_MO.map((d, i) =>
            d.d ? (
              <path key={i} d={d.d} opacity={d.mo} fill="url(#h2sb-mo)" stroke="rgb(143 183 196)" strokeWidth="3" />
            ) : (
              <circle key={i} cx={d.cx} cy={d.cy} r={d.r} opacity={d.mo} fill="url(#h2sb-mo)" />
            ),
          )}
        </g>

        {/* Đảo chiến dịch: viền cát, đất, lưới lục giác, sương mù theo % cọ xát */}
        <path d={VIEN_DAO} fill="none" stroke="rgb(233 207 148)" strokeWidth="10" />
        <path d={VIEN_DAO} fill="url(#h2sb-dat)" />
        <g clipPath="url(#h2sb-cat-dao)">
          <rect x="140" y="100" width="200" height="190" fill="url(#h2sb-luoi)" />
          <ellipse cx="205" cy="170" rx="30" ry="16" fill="rgb(42 168 119)" opacity="0.8" />
          <ellipse cx="190" cy="228" rx="26" ry="12" fill="rgb(23 115 86)" opacity="0.8" />
          <circle cx="176" cy="190" r="6" fill="rgb(15 90 64)" />
          <circle cx="222" cy="206" r="5" fill="rgb(15 90 64)" />
          <circle cx="200" cy="150" r="5" fill="rgb(15 90 64)" />
          <g data-ve="suong" filter="url(#h2sb-nhoe)" fill="rgb(220 232 245)" opacity={suong.toFixed(2)}>
            <circle cx="290" cy="165" r="44" />
            <circle cx="305" cy="215" r="40" />
            <circle cx="262" cy="246" r="34" />
            <circle cx="268" cy="132" r="30" />
            <circle cx="248" cy="195" r="22" />
          </g>
        </g>

        {/* Đường hộ tống + ổ phục kích (= câu ôn còn ở Đoàn) */}
        <path d="M84,470 C120,430 104,370 146,334 C168,314 176,296 186,272" stroke="rgb(255 201 64)" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" fill="none" />
        <g data-ve="o-phuc-kich" data-so={oPk.length}>
          {oPk.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="15" fill="rgb(255 92 138)" opacity="0.35" filter="url(#h2sb-sang)" />
              <circle cx={x} cy={y} r="11" fill="rgb(232 61 109)" stroke="rgb(58 10 26)" strokeWidth="2" />
              <circle cx={x - 4} cy={y - 2} r="2" fill="rgb(255 255 255)" />
              <circle cx={x + 4} cy={y - 2} r="2" fill="rgb(255 255 255)" />
            </g>
          ))}
        </g>

        {/* Cầu sang đảo: kéo lên + ổ khoá khi khoaDao; hạ xuống khi đã phá hết ổ phục kích */}
        <rect x="180" y="258" width="5" height="22" rx="2" fill="rgb(139 90 43)" />
        <rect x="196" y="252" width="5" height="22" rx="2" fill="rgb(139 90 43)" />
        {khoa ? (
          <g data-ve="cau-keo-len">
            <rect x="182" y="238" width="16" height="26" rx="2" fill="rgb(176 122 62)" stroke="rgb(90 53 20)" strokeWidth="2" transform="rotate(-22 190 262)" />
            <circle cx="206" cy="284" r="9" fill="rgb(26 42 85)" stroke="rgb(255 201 64)" strokeWidth="2" />
            <path d="M202 284 h8 v6 h-8 z M204 284 v-3 a2 2 0 0 1 4 0 v3" stroke="rgb(255 201 64)" strokeWidth="1.6" fill="none" />
          </g>
        ) : (
          <g data-ve="cau-ha">
            <rect x="176" y="262" width="30" height="10" rx="2" fill="rgb(176 122 62)" stroke="rgb(90 53 20)" strokeWidth="2" transform="rotate(-24 190 267)" />
          </g>
        )}

        {/* Bến Hộ Tống: xe hàng + Linh Tâm của lớp */}
        <rect x="30" y="486" width="70" height="10" rx="3" fill="rgb(139 90 43)" />
        <rect x="36" y="496" width="4" height="14" fill="rgb(90 53 20)" />
        <rect x="88" y="496" width="4" height="14" fill="rgb(90 53 20)" />
        <path d="M44 480 h40 l6 -12 h-50 z" fill="rgb(201 138 62)" stroke="rgb(90 53 20)" strokeWidth="2" />
        <circle cx="52" cy="484" r="5" fill="rgb(58 42 26)" />
        <circle cx="80" cy="484" r="5" fill="rgb(58 42 26)" />
        <circle cx="64" cy="456" r="16" fill="rgb(111 227 255)" opacity="0.35" filter="url(#h2sb-sang)" />
        <circle cx="64" cy="456" r="9" fill="url(#h2sb-linh-tam)" />
      </svg>

      {cd && (
        <span className="h2-nhan-bd h2-kinh h2-nhan-dao" style={{ left: pct(148, 390), top: pct(88, 600) }}>
          Đảo {cd.ten} · {p}% đã khai phá
        </span>
      )}
      {s && s.doan.con > 0 && (
        <span className="h2-nhan-bd h2-kinh h2-nhan-phuc-kich" style={{ left: pct(196, 390), top: pct(290, 600) }}>
          {s.doan.con} ổ phục kích chặn cầu
        </span>
      )}
      {s && s.doan.con === 0 && s.dao.con > 0 && (
        <span className="h2-nhan-bd h2-kinh h2-nhan-cau-ha" style={{ left: pct(196, 390), top: pct(290, 600) }}>
          Cầu sang đảo đã hạ
        </span>
      )}
      <span className="h2-nhan-bd h2-kinh h2-nhan-ben" style={{ left: pct(108, 390), top: pct(470, 600) }}>
        Bến Hộ Tống · Linh Tâm của lớp
      </span>
    </div>
  )
}

function Hud({ thu, exp, theLuc, chuoiNgay, onMoThanThu }: Pick<SanhBanDoProps, 'thu' | 'exp' | 'chuoiNgay' | 'onMoThanThu'> & { theLuc: { con: number; tong: number } | null }) {
  const can = thu ? thanhExp(thu.cap) : 0
  const co = exp && exp.conThieu !== null && can > 0 ? Math.max(0, Math.min(can, can - exp.conThieu)) : null
  const tiLe = co !== null && can > 0 ? co / can : 0
  const nhanThu = thu ? `${thu.ten} · Cấp ${thu.cap}` : 'Thần thú của em'
  return (
    <header className="h2-hud h2-kinh">
      <button type="button" className="h2-hud-thu" onClick={onMoThanThu} aria-label={thu ? `Mở thần thú của em: ${nhanThu}` : 'Mở thần thú của em'}>
        <span className="h2-luc-giac">
          <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
            <polygon points="24,2 44,13 44,35 24,46 4,35 4,13" fill="rgb(27 47 102)" stroke="rgb(255 201 64)" strokeWidth="2.5" />
          </svg>
          {thu && <img src={anhThu(thu.index, thu.cap, true)} alt="" width={36} height={36} />}
          {thu && (
            <span className="h2-cap baloo" aria-hidden="true">
              {thu.cap}
            </span>
          )}
        </span>
        <span className="h2-hud-giua">
          <span className="h2-hud-ten">{nhanThu}</span>
          {co !== null && (
            <span className="h2-thanh-exp" role="progressbar" aria-label="EXP của thần thú tới cấp sau" aria-valuemin={0} aria-valuemax={can} aria-valuenow={co}>
              <span style={{ width: `${Math.round(tiLe * 100)}%` }} />
            </span>
          )}
          {exp && (
            <span className="h2-hud-phu">{co !== null ? `${co}/${can} EXP · +${exp.homNay} hôm nay` : `+${exp.homNay} EXP hôm nay`}</span>
          )}
        </span>
      </button>
      <span className="h2-hud-phai">
        {theLuc && (
          <span className="h2-hud-so h2-the-luc" aria-label={`Thể lực hôm nay: còn ${theLuc.con}/${theLuc.tong} câu`}>
            <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true" focusable="false">
              <polygon points="7,0 14,5 11,16 3,16 0,5" fill="rgb(55 226 213)" />
            </svg>
            <span className="h2-nhan-nho">Thể lực</span> {theLuc.con}/{theLuc.tong}
          </span>
        )}
        <span className="h2-hud-so h2-chuoi" aria-label={`Chuỗi ${chuoiNgay} ngày`}>
          <svg width="14" height="16" viewBox="0 0 24 24" fill="rgb(255 122 69)" aria-hidden="true" focusable="false">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
          Chuỗi {chuoiNgay} ngày
        </span>
      </span>
    </header>
  )
}

function NutRay({ nhan, onClick, children }: { nhan: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="h2-nut-ray" onClick={onClick}>
      <span className="h2-kinh h2-nut-ray-o" aria-hidden="true">
        {children}
      </span>
      <span className="h2-nut-ray-chu">{nhan}</span>
    </button>
  )
}

function Ray(p: Pick<SanhBanDoProps, 'onCauDaLam' | 'onTuiDo' | 'onCuaHang' | 'onDangXuat' | 'shopBat'> & { coThu: boolean }) {
  const net = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, focusable: false }
  return (
    <nav className="h2-ray" aria-label="Lối tắt">
      <NutRay nhan="Câu đã làm" onClick={p.onCauDaLam}>
        <svg {...net}>
          <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
          <path d="M4 21V5" />
          <path d="M9 8h6M9 12h6" />
        </svg>
      </NutRay>
      {p.coThu && (
        <NutRay nhan="Túi đồ" onClick={p.onTuiDo}>
          <svg {...net}>
            <path d="M5 8h14l-1 12H6z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
        </NutRay>
      )}
      {p.coThu && p.shopBat && (
        <NutRay nhan="Cửa hàng" onClick={p.onCuaHang}>
          <svg {...net}>
            <path d="M4 10h16l-1-5H5z" />
            <path d="M5 10v10h14V10M10 20v-6h4v6" />
          </svg>
        </NutRay>
      )}
      <NutRay nhan="Đăng xuất" onClick={p.onDangXuat}>
        <svg {...net}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5M21 12H9" />
        </svg>
      </NutRay>
    </nav>
  )
}

/** Vòng Cọ xát % + tên chiến dịch + hạn nộp + Cọ xát/Thành thạo (tấm dưới, ngày thường). */
function DongChienDich({ s, now }: { s: SanhHoa2; now: number }) {
  const cd = s.chienDich!
  const p = phanTram(cd.coXat, cd.tong)
  const chuVi = 2 * Math.PI * 25
  return (
    <div className="h2-cd">
      <span className="h2-vong" role="img" aria-label={`Cọ xát ${p}%`}>
        <svg width="58" height="58" viewBox="0 0 58 58" aria-hidden="true" focusable="false">
          <circle cx="29" cy="29" r="25" stroke="rgb(255 255 255 / 0.12)" strokeWidth="6" fill="none" />
          <circle cx="29" cy="29" r="25" stroke="rgb(55 226 213)" strokeWidth="6" fill="none" strokeDasharray={`${((chuVi * p) / 100).toFixed(1)} ${chuVi.toFixed(1)}`} strokeLinecap="round" transform="rotate(-90 29 29)" />
          <circle cx="29" cy="29" r="16" stroke="rgb(255 255 255 / 0.12)" strokeWidth="5" fill="none" />
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
        <span className="h2-ca-nho">Bấm Vào thi để làm bài kiểm tra của thầy.</span>
      </span>
      <button type="button" className="h2-nut-ca" onClick={onVaoThi}>
        Vào thi
      </button>
    </div>
  )
}

function IconKiem() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2" />
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

/** Hết kế hoạch hôm nay: lời mừng + Rương Bát Linh (HS-XongHomNay.dc.html). */
function XongHomNay({ s, exp, token, onTaiLai }: { s: SanhHoa2; exp: SanhBanDoProps['exp']; token: string; onTaiLai: () => void }) {
  const [dangMo, setDangMo] = useState(false)
  const [loi, setLoi] = useState('')
  const [vangVuaNhan, setVangVuaNhan] = useState<number | null>(null)
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
      onTaiLai()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa mở được rương. Em thử lại.')
    } finally {
      setDangMo(false)
    }
  }
  const mai = s.ngay ? ngaySau(s.ngay) : ''
  return (
    <>
      <section className="h2-xong" aria-label="Hôm nay em xong rồi">
        <div className="h2-xong-dau">
          <span className="h2-xong-o" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" focusable="false">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </span>
          <span className="h2-xong-lon baloo">Hôm nay em xong rồi</span>
        </div>
        <p className="h2-xong-chu">
          {r.tong > 0 ? `${r.daLam}/${r.tong} câu` : `${s.theLuc.tong - s.theLuc.con}/${s.theLuc.tong} câu`}
          {exp ? ` · +${exp.homNay} EXP hôm nay` : ''}
        </p>
        {mai && <p className="h2-xong-phu">Kế hoạch ngày mai sẵn lúc 00:00 {thuNgayThang(mai)}: câu đến lịch ôn lại và câu mới.</p>}
        {vangDaCo !== null && (r.daMo || vangVuaNhan !== null) && (
          <p className="h2-ruong-da" role="status">
            Rương Bát Linh đã mở · +{vangDaCo} vàng (dùng ở Cửa hàng phụ kiện)
          </p>
        )}
        {loi && (
          <p className="h2-loi" role="alert">
            {loi}
          </p>
        )}
      </section>
      {moDuoc && (
        <button type="button" className="h2-nut-chinh" onClick={() => void mo()} disabled={dangMo} aria-busy={dangMo}>
          <span className="h2-nut-chinh-chu">
            <span className="h2-nut-chinh-lon baloo">{dangMo ? 'ĐANG MỞ RƯƠNG…' : 'MỞ RƯƠNG BÁT LINH'}</span>
            <span className="h2-nut-chinh-nho">Quà xong trọn kế hoạch hôm nay · vàng mua phụ kiện</span>
          </span>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <rect x="3" y="9" width="18" height="11" rx="2" />
            <path d="M3 13h18M12 11v4M5 9a7 5 0 0 1 14 0" />
          </svg>
        </button>
      )}
    </>
  )
}

function TamDuoi({ p, s }: { p: SanhBanDoProps; s: SanhHoa2 }) {
  const xong = s.theLuc.tong > 0 && s.theLuc.con === 0
  const trong = s.theLuc.tong === 0
  return (
    <>
      {s.huyetChien && !xong ? <TheHuyetChien s={s} now={p.now} /> : s.chienDich ? <DongChienDich s={s} now={p.now} /> : (
        <p className="h2-tam-chu">Thầy chưa giao chiến dịch nào cho em. Khi thầy giao, bản đồ sẽ mở đảo mới ở đây.</p>
      )}
      {xong ? (
        <XongHomNay s={s} exp={p.exp} token={p.token} onTaiLai={p.onTaiLai} />
      ) : trong ? (
        s.chienDich ? <p className="h2-tam-chu">Hôm nay chưa có câu nào trong kế hoạch của em. Em quay lại sau nhé.</p> : null
      ) : s.doan.con > 0 ? (
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
            <span className="h2-nut-chinh-lon baloo">KHÁM PHÁ BÁT LINH ĐẢO · {s.dao.con} câu</span>
            <span className="h2-nut-chinh-nho">Đã phá hết ổ phục kích · cầu sang đảo đã hạ</span>
          </span>
          <IconKiem />
        </button>
      ) : null}
    </>
  )
}

export default function SanhBanDo(p: SanhBanDoProps) {
  useEffect(() => {
    napPhongBaloo()
  }, [])
  const kq = p.ketQua
  const s = kq && kq.cheDo2 && !kq.canChonThu ? kq.sanh : null
  const chonThu = !!kq && kq.cheDo2 && kq.canChonThu === true
  return (
    <div className="h2-sanh" data-trang-thai={s ? 'co' : chonThu ? 'chon-thu' : p.loi ? 'loi' : 'dang-tai'}>
      <div className="h2-khung">
        <BanDo s={s} />
        <Hud thu={chonThu ? null : p.thu} exp={chonThu ? null : p.exp} chuoiNgay={p.chuoiNgay} theLuc={s ? s.theLuc : null} onMoThanThu={chonThu ? p.onChonThu : p.onMoThanThu} />
        <Ray onCauDaLam={p.onCauDaLam} onTuiDo={p.onTuiDo} onCuaHang={p.onCuaHang} onDangXuat={p.onDangXuat} shopBat={p.shopBat} coThu={!chonThu} />
        <div className="h2-dem" aria-hidden="true" />
        <section className="h2-tam" aria-label="Việc hôm nay" aria-busy={p.dangTai && !s}>
          {p.caDangMo && <DaiVaoThi onVaoThi={p.onVaoThi} />}
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
      </div>
    </div>
  )
}

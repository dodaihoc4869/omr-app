// THẦN THÚ MẶC ĐỒ — thành phần vẽ thú kèm phụ kiện, DÙNG CHUNG cho Bảng nhiệm vụ, Đảo, Đoàn, Bảng vinh danh, sân thử đồ (đề xuất DE-XUAT-SHOP-PHU-KIEN-2109.md mục 6).
// BỌC `ThuHinh` sẵn có (không vẽ lại sprite thú) và thêm năm lớp:
//   ĐỢT 1 (không cần điểm neo theo loài): hào quang / nền (SAU thú, tâm tại tâm thú) · vệt di chuyển (SAU-DƯỚI, ngược hướng nhìn, sát chân) · khung tên (DƯỚI chân).
//   ĐỢT 2 (đặt theo bảng neo 8 loài × 6 giai đoạn `phu-kien-neo.ts`): trên đầu (TRƯỚC thú, ngồi đỉnh đầu, không che mặt) · trên lưng (khăn, vòng cổ, áo, ba lô ở TRƯỚC; cánh, áo choàng ở SAU thú).
// Nhận `dangMac` đúng hình máy chủ trả (`phuKien` / lệnh `thu-mac-do`): `{ 'hao-quang': 'HQ-03', vet: null, khung: 'KT-08', dau: 'DA-07', 'co-lung': 'CL-05' }` — mã lạ / sai ô BỊ BỎ QUA, không ném lỗi.
// MỘT thú tối đa 3 món chuyển động cùng lúc: nếu mặc nhiều hơn, chỉ 3 món bậc cao nhất được động (bằng bậc: theo thứ tự hào quang, vệt, khung, đầu, lưng), món còn lại đứng yên (`pk-dung`).
// Máy em chỉ VẼ điều máy chủ nói: không tính giá, không tự quyết món nào được mặc. Chữ (tên thú, dòng nhỏ) do nơi gọi truyền vào; ở đây không có chữ cứng của món.
// Nạp lười: hình SVG của món nào chỉ tải khi có thú mặc món ấy. `tinh` = vẽ bản TĨNH (trận Đoàn nhiều thú; "giảm chuyển động" cũng tĩnh nhờ CSS).
import { Suspense, useId } from 'react'
import type { CSSProperties } from 'react'
import { ThuHinh } from '../DoanHinh'
import { hinhCuaMon } from './nap-hinh'
import { kiHieuNguyenTo, monCuaO, type MonHinh } from './phu-kien-mon'
import { neoCua, type DiemNeo } from './phu-kien-neo'
import './phu-kien.css'

/** Ô → mã món (đúng khoá của `dangMac` do máy chủ trả). */
export type DangMac = Partial<Record<'hao-quang' | 'vet' | 'khung' | 'dau' | 'co-lung', string | null>>

export interface ThuMacDoProps {
  pet: number
  cap: number
  /** Cạnh hộp thú (px). Hào quang rộng 1,7 lần; khung tên nằm dưới hộp — nơi gọi chừa chỗ (`CAO_KHUNG_TEN`). */
  size: number
  quayTrai?: boolean
  dangMac?: DangMac | null
  /** Tên thú trên khung tên (không có ⇒ không vẽ khung). */
  ten?: string
  /** Dòng nhỏ trên tên (vd "Thần thú của em"). */
  nhan?: string
  /** Vẽ bản tĩnh (không chuyển động): trận Đoàn nhiều thú, ảnh chụp. */
  tinh?: boolean
  className?: string
  style?: CSSProperties
}

/** Chiều cao cần chừa DƯỚI hộp thú khi có khung tên (px): 6 khoảng cách + 44 khung. */
export const CAO_KHUNG_TEN = 52

/** Số món chuyển động cùng lúc tối đa trên MỘT thú (đề xuất mục 6). */
export const TOI_DA_DONG = 3

const lop = (m: MonHinh) => `pk-m-${m.ma.toLowerCase()}`

/** Bề rộng hộp hình món đợt 2 tính theo số đo của bảng neo (đầu rộng 80/100 hộp · cổ 35/100 · thân 80/100): nhân `r` với hệ số này. */
const HE_SO_HOP = { dau: 1.25, co: 2.9, lung: 1.25 } as const
const TAM_DOC = { dau: 70, co: 50, lung: 50 } as const

function LopSvg({ mon, id, ten, dung }: { mon: MonHinh; id: string; ten: 'pk-hq' | 'pk-vet'; dung: boolean }) {
  const Hinh = hinhCuaMon(mon.ma)
  if (!Hinh) return null
  return (
    <div className={`pk-lop ${ten} pk-b${mon.bac} ${lop(mon)}${dung ? ' pk-dung' : ''}`} data-mon={mon.ma}>
      <Suspense fallback={null}>
        <Hinh id={id} />
      </Suspense>
    </div>
  )
}

/** Món đợt 2: hộp vuông đặt tâm tại điểm neo (đầu: đỉnh đầu ở 70% chiều cao hộp), xoay theo góc, lật theo hướng nhìn nhờ `.pk-thu[data-huong]`. */
function LopNeo({ mon, id, diem, dung }: { mon: MonHinh; id: string; diem: DiemNeo; dung: boolean }) {
  const Hinh = hinhCuaMon(mon.ma)
  const cho = mon.neo
  if (!Hinh || !cho) return null
  const style = { left: `${diem.x * 100}%`, top: `${diem.y * 100}%`, width: `${diem.r * HE_SO_HOP[cho] * 100}%`, transform: `translate(-50%, -${TAM_DOC[cho]}%) rotate(${diem.g}deg)`, transformOrigin: `50% ${TAM_DOC[cho]}%` }
  return (
    <div className={`pk-lop pk-neo pk-neo-${mon.lop ?? 'truoc'} pk-b${mon.bac} ${lop(mon)}${dung ? ' pk-dung' : ''}`} data-mon={mon.ma} data-neo={cho} style={style}>
      <Suspense fallback={null}>
        <Hinh id={id} />
      </Suspense>
    </div>
  )
}

function KhungTen({ mon, ten, nhan, dung }: { mon: MonHinh; ten: string; nhan?: string; dung: boolean }) {
  const kiHieu = mon.kieu === 'gold' ? 'Au' : mon.kieu === 'o-nguyen-to' ? kiHieuNguyenTo(ten) : ''
  return (
    <div className={`pk-khung-cho${dung ? ' pk-dung' : ''}`} data-mon={mon.ma}>
      <div className={`pk-khung pk-b${mon.bac} pk-k-${mon.kieu}`}>
        {kiHieu && (
          <span className="pk-ki-hieu" aria-hidden="true">
            {kiHieu}
          </span>
        )}
        <span className="pk-khung-chu">
          {nhan && <small>{nhan}</small>}
          <strong>{ten}</strong>
        </span>
      </div>
    </div>
  )
}

export function ThuMacDo({ pet, cap, size, quayTrai = false, dangMac, ten, nhan, tinh = false, className = '', style }: ThuMacDoProps) {
  const id = useId().replace(/:/g, '')
  const hq = monCuaO('hao-quang', dangMac?.['hao-quang'])
  const vet = monCuaO('vet', dangMac?.vet)
  const khung = ten ? monCuaO('khung', dangMac?.khung) : null
  const dau = monCuaO('dau', dangMac?.dau)
  const lung = monCuaO('co-lung', dangMac?.['co-lung'])
  const neo = dau || lung ? neoCua(pet, cap, quayTrai) : null
  // chỉ 3 món bậc cao nhất được động (bậc 1 không bao giờ có chuyển động ⇒ không tính)
  const duocDong = new Set(
    [hq, vet, khung, dau, lung]
      .filter((m): m is MonHinh => !!m && m.bac >= 2)
      .map((m, i) => ({ ma: m.ma, bac: m.bac, i }))
      .sort((a, b) => b.bac - a.bac || a.i - b.i)
      .slice(0, TOI_DA_DONG)
      .map((m) => m.ma),
  )
  const dung = (m: MonHinh) => !duocDong.has(m.ma)
  const lopNeo = (m: MonHinh | null, k: string) => (m && neo && m.neo ? <LopNeo key={k} mon={m} id={`${id}${k}`} diem={neo[m.neo]} dung={dung(m)} /> : null)
  return (
    <div className={`pk-thu${tinh ? ' pk-tinh' : ''} ${className}`.trim()} data-huong={quayTrai ? 'trai' : 'phai'} style={{ width: size, height: size, ...style }}>
      {hq && <LopSvg mon={hq} id={`${id}h`} ten="pk-hq" dung={dung(hq)} />}
      {vet && <LopSvg mon={vet} id={`${id}v`} ten="pk-vet" dung={dung(vet)} />}
      {lopNeo(lung?.lop === 'sau' ? lung : null, 'ls')}
      <ThuHinh pet={pet} cap={cap} quayTrai={quayTrai} />
      {lopNeo(lung?.lop === 'sau' ? null : lung, 'lt')}
      {khung && ten && <KhungTen mon={khung} ten={ten} nhan={nhan} dung={dung(khung)} />}
      {lopNeo(dau, 'd')}
    </div>
  )
}

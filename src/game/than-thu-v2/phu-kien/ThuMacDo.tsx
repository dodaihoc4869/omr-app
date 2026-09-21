// THẦN THÚ MẶC ĐỒ — thành phần vẽ thú kèm phụ kiện, DÙNG CHUNG cho Bảng nhiệm vụ, Đảo, Đoàn, Bảng vinh danh, sân thử đồ (đề xuất DE-XUAT-SHOP-PHU-KIEN-2109.md mục 6).
// BỌC `ThuHinh` sẵn có (không vẽ lại sprite thú) và thêm ba lớp ĐỢT 1, không cần điểm neo theo loài:
//   hào quang / nền (SAU thú, tâm tại tâm thú) · vệt di chuyển (SAU-DƯỚI, ngược hướng nhìn, sát chân) · khung tên (DƯỚI chân).
// Nhận `dangMac` đúng hình máy chủ trả (`phuKien` / lệnh `thu-mac-do`): `{ 'hao-quang': 'HQ-03', vet: null, khung: 'KT-08', dau, 'co-lung' }` — ô của đợt 2 (dau, co-lung) và mã lạ / sai ô BỊ BỎ QUA, không ném lỗi.
// Máy em chỉ VẼ điều máy chủ nói: không tính giá, không tự quyết món nào được mặc. Chữ (tên thú, dòng nhỏ) do nơi gọi truyền vào; ở đây không có chữ cứng của món.
// Nạp lười: hình SVG của món nào chỉ tải khi có thú mặc món ấy. `tinh` = vẽ bản TĨNH (trận Đoàn nhiều thú; "giảm chuyển động" cũng tĩnh nhờ CSS).
import { Suspense, useId } from 'react'
import type { CSSProperties } from 'react'
import { ThuHinh } from '../DoanHinh'
import { hinhCuaMon } from './nap-hinh'
import { kiHieuNguyenTo, monCuaO, type MonHinh } from './phu-kien-mon'
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

const lop = (m: MonHinh) => `pk-m-${m.ma.toLowerCase()}`

function LopSvg({ mon, id, ten }: { mon: MonHinh; id: string; ten: 'pk-hq' | 'pk-vet' }) {
  const Hinh = hinhCuaMon(mon.ma)
  if (!Hinh) return null
  return (
    <div className={`pk-lop ${ten} pk-b${mon.bac} ${lop(mon)}`} data-mon={mon.ma}>
      <Suspense fallback={null}>
        <Hinh id={id} />
      </Suspense>
    </div>
  )
}

function KhungTen({ mon, ten, nhan }: { mon: MonHinh; ten: string; nhan?: string }) {
  const kiHieu = mon.kieu === 'gold' ? 'Au' : mon.kieu === 'o-nguyen-to' ? kiHieuNguyenTo(ten) : ''
  return (
    <div className="pk-khung-cho" data-mon={mon.ma}>
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
  return (
    <div className={`pk-thu${tinh ? ' pk-tinh' : ''} ${className}`.trim()} data-huong={quayTrai ? 'trai' : 'phai'} style={{ width: size, height: size, ...style }}>
      {hq && <LopSvg mon={hq} id={`${id}h`} ten="pk-hq" />}
      {vet && <LopSvg mon={vet} id={`${id}v`} ten="pk-vet" />}
      <ThuHinh pet={pet} cap={cap} quayTrai={quayTrai} />
      {khung && ten && <KhungTen mon={khung} ten={ten} nhan={nhan} />}
    </div>
  )
}

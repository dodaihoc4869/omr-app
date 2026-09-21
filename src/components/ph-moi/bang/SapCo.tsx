// Thẻ "Bảng sẽ đầy dần khi con học thêm" + dòng "Độ chăm hôm nay" của bảng "Mọi thứ về con" kiểu Apple (mẫu docs/ban-ve-ph-apple-2109/ph-e-bang-thua.html, phần `phm-sap` và `phm-do-cham`).
// Chỉ liệt kê khối THẬT SỰ VẮNG trong dữ liệu (điểm mạnh · cần luyện, ca kiểm tra, bài tập về nhà); khối nào đã có thì không nhắc. "Độ chăm" là dòng duy nhất được phép nói thứ hạng của con trong lớp (mẫu chốt), không tên bạn nào.
import type { ReactNode } from 'react'
import type { PhMoi } from '../../../lib/ph-moi/du-lieu'
import { BtCot, BtDanhSach, BtNguoi, BtSach } from './bieu-tuong'
import { coBtvn } from './Btvn'
import { coCa } from './Ca'
import { coDang } from './Dang'

interface Vang {
  ten: string
  khiNao: string
  icon: ReactNode
}

/** Các khối đang vắng, đúng thứ tự mẫu: Điểm mạnh · cần luyện → Ca kiểm tra gần nhất → Bài tập về nhà. */
export function khoiDangVang(pm: PhMoi): Vang[] {
  const ra: Vang[] = []
  if (!coDang(pm)) ra.push({ ten: 'Điểm mạnh · cần luyện', khiNao: 'hiện khi con làm thêm câu, đủ để A.I Đỗ Đại Học nhận ra từng dạng', icon: <BtCot /> })
  if (!coCa(pm)) ra.push({ ten: 'Ca kiểm tra gần nhất', khiNao: 'hiện khi thầy công bố điểm ca kiểm tra đầu tiên của con', icon: <BtDanhSach /> })
  if (!coBtvn(pm)) ra.push({ ten: 'Bài tập về nhà', khiNao: 'hiện khi thầy giao bài cho lớp của con', icon: <BtSach /> })
  return ra
}

export const coSapCo = (pm: PhMoi): boolean => khoiDangVang(pm).length > 0

export function SapCo({ pm }: { pm: PhMoi; chuaHoc?: boolean }) {
  const ds = khoiDangVang(pm)
  if (ds.length === 0) return null
  return (
    <section className="phm-muc" aria-label="Bảng sẽ đầy dần khi con học thêm">
      <div className="phm-the phm-the--dem">
        <p className="phm-nhan-muc" data-mau="xam">
          Bảng sẽ đầy dần khi con học thêm
        </p>
        <ul className="phm-sap">
          {ds.map((v) => (
            <li key={v.ten}>
              {v.icon}
              <span>
                {v.ten}
                <small>{v.khiNao}</small>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Có hạng thật và lớp từ 2 bạn trở lên (lớp 1 bạn thì "thứ 1 trong 1" không nói được điều gì) ⇒ mới vẽ. */
export const coDoCham = (pm: PhMoi): boolean => !!pm.doCham && pm.doCham.hang >= 1 && pm.doCham.siSo >= 2 && pm.doCham.hang <= pm.doCham.siSo

export function DoCham({ pm }: { pm: PhMoi }) {
  if (!coDoCham(pm) || !pm.doCham) return null
  return (
    <p className="phm-do-cham">
      <BtNguoi />
      <span>
        Độ chăm hôm nay: con đứng thứ <b>{pm.doCham.hang}</b> trong <b>{pm.doCham.siSo}</b> bạn của lớp
      </span>
    </p>
  )
}

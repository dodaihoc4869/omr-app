// THẺ "NHỊP HỌC CỦA CON" — app phụ huynh, mục Hôm nay (đợt 16, thầy 12/10: "App ph cũng phải hiển thị lười chăm đầy đủ như app hs").
// CÙNG bảng của app học sinh (`BangNhipHoc` — dải ô ngày từ 01/10 + chú giải, nhóm Chăm / Chưa đều / Lười / Chưa đủ dữ liệu, "Ra khỏi nhóm Lười … k/6
// ngày", "Việc tiếp", tốc độ khi đáng lo) ở ngôi "con"; số từ `POST /ph/nhip-hoc` (src/lib/ho-so-con-ph-api.ts — hợp đồng y hệt `/hs/nhip-hoc`).
// Bấm dải ngày ("Xem hồ sơ ›") ⇒ mở CÙNG tấm "Hồ sơ làm bài" như thầy và em thấy (HoSoCuaConPh, nạp lười).
// Năm trạng thái: đang tải (khung xương đúng chỗ) · có số · lỗi lần đầu ("Chưa tải được nhịp học của con." + lý do thật + nút "Tải lại nhịp học") · lỗi khi
// đã có số (giữ bản đã tải + dòng báo + nút) · máy chủ chưa có lệnh (404 ⇒ cùng câu lỗi nói thật). Không bao giờ làm hỏng màn Hôm nay.
// MỘT CON SỐ (như thẻ của em, `nhipTheoSanh`): có số hôm nay của khối chính (`/ph/con-tong-quan`: đã làm / mức tối thiểu) ⇒ ô hôm nay, nhóm, chuỗi và
// "Việc tiếp" tính lại từ CÙNG số ấy — phụ huynh không thấy hai số câu hôm nay khác nhau trên một màn.
// MÀU: nhip-hoc-con.css (chỉ biến --ph3-* sẵn có).
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, Check, Hourglass, TriangleAlert } from 'lucide-react'
import BangNhipHoc from '../hoc-tap/BangNhipHoc'
import { layNhipHocCon } from '../../lib/ho-so-con-ph-api'
import { ngayNgan, nhipTheoSanh, TEN_NHOM_NHIP, type KetQuaNhipHocEm, type NhomNhip } from '../../lib/nhip-hoc-em'
import { BtLich } from './BieuTuong'
import { The, type Mau } from './dung-chung'
import './nhip-hoc-con.css'

const HoSoCuaConPh = lazy(() => import('./HoSoCuaConPh'))

const ICON_NHOM: Record<NhomNhip, typeof Check> = { cham: Check, 'chua-deu': Activity, luoi: TriangleAlert, 'chua-du': Hourglass }
const MAU_NHOM: Record<NhomNhip, Mau> = { cham: 'xl', 'chua-deu': 'hp', luoi: 'ho', 'chua-du': 'xd' }

type TrangThai = { k: KetQuaNhipHocEm | null; dangTai: boolean; loi: string }

export default function NhipHocCon({ sbd, tenCon, lop, homNay }: { sbd: string; tenCon: string; lop?: string; homNay?: { muc: number; daLam: number } | null }) {
  const [tt, setTt] = useState<TrangThai>({ k: null, dangTai: true, loi: '' })
  const [lan, setLan] = useState(0)
  const [mo, setMo] = useState(false)
  useEffect(() => {
    let huy = false
    setTt((x) => ({ ...x, dangTai: true, loi: '' }))
    void layNhipHocCon(sbd).then((r) => {
      if (huy) return
      setTt((x) => (r.ok ? { k: r.du, dangTai: false, loi: '' } : { k: x.k, dangTai: false, loi: r.chu }))
    })
    return () => {
      huy = true
    }
  }, [sbd, lan])
  const taiLai = useCallback(() => setLan((x) => x + 1), [])

  const muc = homNay?.muc
  const daLam = homNay?.daLam
  const k = useMemo(() => (tt.k ? nhipTheoSanh(tt.k, muc !== undefined && daLam !== undefined ? { muc, daLam } : null) : null), [tt.k, muc, daLam])
  if (!k && tt.dangTai)
    return (
      <div className="ph3-xuong tt-xuong ph3-o-du" data-hinh="the" data-vung="nhip-con-dang-tai" role="status" aria-label="Đang tải nhịp học của con">
        <span />
        <span />
        <span />
      </div>
    )
  if (!k)
    return (
      <section className="ph3-the ph3-trong ph3-o-du ph3-nhip-loi" data-vung="nhip-con-loi" aria-label="Nhịp học của con">
        <p role="status">Chưa tải được nhịp học của con. {tt.loi}</p>
        <button type="button" className="ph3-nut-vien tt-nhan" onClick={taiLai} disabled={tt.dangTai}>
          Tải lại nhịp học
        </button>
      </section>
    )
  const Icon = ICON_NHOM[k.nhom]
  return (
    <>
      <The
        id="ph3-nhip-con"
        className="ph3-o-du ph3-nhip"
        vung="nhip-hoc-con"
        bieuTuong={<BtLich co={22} />}
        mau={MAU_NHOM[k.nhom]}
        tieuDe="Nhịp học của con"
        phu={`Lười hay chăm tính theo số ngày đủ mức, từ ${ngayNgan(k.tu)}`}
        chip={
          <span className="ph3-chip ph3-nhip__nhom" data-mau={MAU_NHOM[k.nhom]}>
            <Icon size={16} strokeWidth={2.6} aria-hidden="true" />
            {TEN_NHOM_NHIP[k.nhom]}
          </span>
        }
      >
        {tt.loi && (
          <div className="ph3-lam-moi-loi" role="status">
            <span>Nhịp học đang hiển thị bản đã tải. {tt.loi}</span>
            <button type="button" className="tt-nhan" onClick={taiLai} disabled={tt.dangTai}>
              Tải lại nhịp học
            </button>
          </div>
        )}
        <BangNhipHoc k={k} ngoi="con" onMoHoSo={() => setMo(true)} />
      </The>
      {mo && (
        <Suspense fallback={null}>
          <HoSoCuaConPh sbd={sbd} tenCon={tenCon} lop={lop} onDong={() => setMo(false)} />
        </Suspense>
      )}
    </>
  )
}

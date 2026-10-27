// THẺ «HỌC CÙNG BẠN» TRÊN LỘ TRÌNH (thầy 27/10: «làm không bỏ sót, tự làm theo đề xuất thông minh»; kiểu lời nhắc bạn bè của Duolingo) — lối vào thứ hai của
// màn Học cùng bạn (ngoài ô ở Thành tích). Nằm trong mảnh «Trong» (TrongHs), KHÔNG kéo mảnh ManThuong; danh sách bạn nạp SAU khi Lộ trình đã vẽ (useTai chạy
// trong effect, song song lệnh khác; vẽ ngay từ bản gần nhất ở máy nếu có) ⇒ không làm chậm mở Lộ trình.
//   · Có bạn CHƯA xong bài hôm nay ⇒ MỘT thẻ gọn: «Minh chưa học hôm nay · Lửa đôi 9 ngày» + nút «Gõ cửa» (chỉ khi em đã học mà bạn chưa — cùng luật màn
//     Học cùng bạn: 1 lần/ngày/bạn, máy chủ giữ khoá) + cùng hiệu ứng. Bấm phần chữ ⇒ mở màn Học cùng bạn.
//   · Có lời mời đang chờ ⇒ «Lan mời em học cùng» ⇒ mở màn.
//   · Chưa có bạn ⇒ lời mời nhẹ «Học cùng bạn để giữ lửa đôi», có nút đóng; đóng (hoặc bấm vào) ⇒ ẩn tới hết ngày (localStorage, có try/catch).
//   · Công tắc «bạn bè» tắt / chưa biết công tắc ⇒ không vẽ gì. Chỉ hiện tên bạn + lửa đôi + đã học hôm nay chưa (không điểm, không nguyên tử).
import { useRef, useState } from 'react'
import { Users, X } from 'lucide-react'
import { DUONG, goCua, layDsBan, ngayVn } from '../../lib/thuong-api'
import { baoMoi, useTai } from './dung-thuong'
import { banCanNhac, banChuaHoc, hieuUngGoCua, tenNgan } from './ban-gon'

const KHO_DONG = 'ddh.thuong.moi-ban-an'
const daDongHomNay = (): boolean => { try { return localStorage.getItem(KHO_DONG) === ngayVn() } catch { return false } }
const ghiDong = (): void => { try { localStorage.setItem(KHO_DONG, ngayVn()) } catch { /* bị chặn: chỉ ẩn trong lượt này */ } }

export interface PropsTheBanLoTrinh {
  token?: string
  /** Công tắc «bạn bè» từ tổng quan thưởng (`tq.bat.banBe`): chỉ `true` mới vẽ. */
  bat?: boolean
  /** Mở màn Học cùng bạn. */
  onMo: () => void
}

export function TheBanLoTrinh({ token, bat, onMo }: PropsTheBanLoTrinh) {
  const { du: ds } = useTai(token, DUONG.ban, layDsBan, !!token && bat !== false)
  const [an, setAn] = useState(daDongHomNay)
  const [daGo, setDaGo] = useState<Record<string, true>>({})
  const [dangGo, setDangGo] = useState(false)
  const [loi, setLoi] = useState('')
  const nut = useRef<HTMLButtonElement>(null)
  if (!token || bat !== true || !ds || ds.tat) return null
  const moVaAn = () => { ghiDong(); setAn(true); onMo() }

  const b = banCanNhac(ds.ban)
  if (b) {
    const go = !!b.daGoCua || !!daGo[b.ma]
    const them = ds.ban.filter(banChuaHoc).length - 1
    const ten = tenNgan(b.ten)
    const chuaCaHai = b.homNay === 'ca_hai_chua'
    const goCuaBan = async () => {
      if (dangGo || go) return
      setDangGo(true); setLoi('')
      hieuUngGoCua(nut.current)
      const r = await goCua(token, b.ma)
      setDangGo(false)
      if (!r.ok) return setLoi(r.chu)
      setDaGo((x) => ({ ...x, [b.ma]: true }))
      void layDsBan(token).then((x) => { if (x.ok) baoMoi(DUONG.ban, token) })
    }
    const tieuDe = chuaCaHai ? `${ten} cũng chưa học hôm nay` : `${ten} chưa học hôm nay`
    const phu = [chuaCaHai ? `Học 1 chặng để giữ lửa đôi ${b.chuoiDoi} ngày` : `Lửa đôi ${b.chuoiDoi} ngày`, them > 0 ? `+${them} bạn chưa học` : ''].filter(Boolean).join(' · ')
    return <section className="da-ban" aria-label="Học cùng bạn">
      <button type="button" className="da-ban-mo" onClick={onMo} aria-label={`${tieuDe}. ${phu}. Mở Học cùng bạn`}>
        <span className="da-ban-av" aria-hidden="true">{(ten[0] ?? '').toUpperCase()}</span>
        <span className="giua"><b>{tieuDe}</b><span>{phu}</span></span>
      </button>
      {b.homNay === 'ban_chua' && <button ref={nut} type="button" className="da-ban-go" disabled={go || dangGo} onClick={() => void goCuaBan()}>{go ? 'Đã gõ cửa' : 'Gõ cửa'}</button>}
      {loi && <p className="da-ban-loi" role="status">{loi}</p>}
    </section>
  }
  const moi = ds.loiMoi[0]
  if (moi) return <section className="da-ban" aria-label="Lời mời học cùng">
    <button type="button" className="da-ban-mo" onClick={onMo}>
      <span className="da-ban-av" aria-hidden="true">{(tenNgan(moi.ten)[0] ?? '').toUpperCase()}</span>
      <span className="giua"><b>{tenNgan(moi.ten)} mời em học cùng</b><span>Đồng ý để cùng giữ lửa đôi</span></span>
    </button>
  </section>
  if (ds.ban.length > 0 || ds.daMoi.length > 0 || an) return null
  return <section className="da-ban" data-k="moi" aria-label="Mời bạn học cùng">
    <button type="button" className="da-ban-mo" onClick={moVaAn}>
      <span className="da-ban-av" aria-hidden="true"><Users size={20} /></span>
      <span className="giua"><b>Học cùng bạn để giữ lửa đôi</b><span>Cả hai cùng học mỗi ngày, lửa đôi tăng</span></span>
    </button>
    <button type="button" className="da-ban-dong" aria-label="Đóng lời mời học cùng bạn" onClick={() => { ghiDong(); setAn(true) }}><X size={20} aria-hidden="true" /></button>
  </section>
}

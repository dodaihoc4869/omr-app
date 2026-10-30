// TẤM HƯỚNG DẪN BIỂU TƯỢNG (thầy 30/10 «hs khi bấm vào các biểu tượng tinh thể nguyên tử lửa đều có hướng dẫn dễ hiểu»): chạm lửa / nguyên tử / tinh thể
// (hàng số trong menu Lộ trình, ô nguyên tử trên màn làm chặng) ⇒ thẻ trượt ra từ mép trái, ghim góc trên trái (thầy duyệt 30/10): biểu tượng to + số của em · «là gì» một câu · cách có (đúng số của luật) ·
// dùng để làm gì · nút sang màn chi tiết («Đã hiểu» đóng). Số luật lấy CÙNG nguồn màn chi tiết (LUAT_CHUOI, thuong-api, bảng «Cách kiếm tinh thể»,
// exp-cau-hinh.ts phía máy chủ) — không bịa. Công tắc tắt (giải tuần, Kim cương, thăng hoa) ⇒ dòng đó ẩn. Đi trong mảnh nạp lười ManThuong (CSS ở
// trong-thuong.css) ⇒ không thêm byte mở app, không thêm tệp precache. Chạm nền mờ / Esc = đóng; mở ⇒ con trỏ vào nút chính, đóng ⇒ trả về chỗ cũ.
import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { DAT_CUOC, giaBinh, vongMucTieu, type TongQuanThuong } from '../../lib/thuong-api'
import { IcLua, IcNguyenTu, IcTinhThe } from './hinh'
import '../../styles/trong-thuong.css'

export type LoaiBieuTuong = 'lua' | 'nt' | 'tt'
/** Màn chi tiết nút chính mở (cùng tên màn của ManThuong). */
export type ManHuongDan = 'chuoi' | 'giai' | 'nhiem-vu' | 'cua-hang'
export interface DongHuongDan { chu: string; so?: string }
export interface NoiDungHuongDan {
  tieu: string
  la: string
  /** Trạng thái hôm nay của em (chỉ lửa). */
  nay?: string
  cachTen: string
  cach: DongHuongDan[]
  dungTen: string
  dung: string[]
  luuY?: string
  nut?: { chu: string; man: ManHuongDan }
}

const so = (n: number) => n.toLocaleString('vi-VN')

/** Hàm thuần: chữ của tấm theo loại + số của em. `tq` vắng (màn làm chặng chưa có tổng quan) ⇒ chỉ phần luật chung, ẩn dòng phụ thuộc công tắc. */
export function noiDungHuongDan(loai: LoaiBieuTuong, tq?: TongQuanThuong | null, soBai?: number): NoiDungHuongDan {
  if (loai === 'lua') {
    const c = tq?.chuoiNgay, mt = vongMucTieu(tq?.mucTieu)
    const n = c?.so ?? 0
    return {
      tieu: n > 0 ? `Chuỗi ${so(n)} ngày` : 'Chưa có chuỗi ngày',
      la: 'Lửa đếm số ngày liền em làm đủ mức hôm nay.',
      nay: mt ? (mt.dat ? 'Hôm nay em đã giữ được chuỗi.' : `Hôm nay còn ${so(mt.can - mt.da)} ${mt.donVi} nữa là giữ được chuỗi.`) : undefined,
      cachTen: 'Cách giữ lửa',
      cach: [
        { chu: 'Làm đủ mức hôm nay (vòng Mục tiêu đầy)', so: '+1 ngày' },
        { chu: c ? `Lỡ một ngày: bình giữ chuỗi tự đỡ (em đang có ${c.giuChuoi} bình)` : 'Lỡ một ngày: bình giữ chuỗi tự đỡ' },
        { chu: 'Hết bình: hôm sau làm đủ mức rồi học bù thêm 2 chặng là cứu được chuỗi' },
      ],
      dungTen: 'Thưởng mốc chuỗi',
      dung: ['7 ngày: +10 tinh thể', '30 ngày: +30 tinh thể và 1 bình giữ chuỗi', '100 ngày: +100 tinh thể'],
      nut: { chu: 'Xem lịch chuỗi', man: 'chuoi' },
    }
  }
  if (loai === 'nt') {
    const giai = !!tq?.bat.giai
    const n = soBai ?? tq?.nguyenTuHomNay
    return {
      tieu: soBai !== undefined ? `${so(soBai)} nguyên tử bài này` : n !== undefined ? `${so(n)} nguyên tử hôm nay` : 'Nguyên tử',
      la: 'Nguyên tử là điểm công sức: mỗi câu em làm thật trong bài học đều được cộng.',
      cachTen: 'Mỗi câu được',
      cach: [
        { chu: 'Đúng, tự làm', so: '+10' },
        { chu: 'Câu khó làm đúng', so: 'thêm +5' },
        { chu: 'Đúng liền từ 3 câu / từ 5 câu', so: 'thêm +2 / +5' },
        { chu: 'Đúng nhờ gợi ý', so: '+5' },
        { chu: 'Sai nhưng làm nghiêm túc', so: '+2' },
        { chu: 'Cả chặng đúng hết (từ 3 câu)', so: '+20' },
        { chu: 'Tự sửa đúng câu cũ (tối đa 12 câu mỗi ngày)', so: '+2' },
      ],
      dungTen: 'Lưu ý',
      dung: [
        'Câu em đã làm hôm nay, làm lại lần nữa không được cộng thêm.',
        ...(giai ? ['Nguyên tử cả tuần dùng để xếp hạng Giải tuần (câu có gợi ý không tính hạng).'] : []),
      ],
      nut: giai ? { chu: 'Xem Giải tuần', man: 'giai' } : { chu: 'Xem nhiệm vụ ngày', man: 'nhiem-vu' },
    }
  }
  const n = tq?.tinhThe
  return {
    tieu: n !== undefined ? `${so(n)} tinh thể` : 'Tinh thể',
    la: 'Tinh thể là phần thưởng để đổi đồ trong Cửa hàng.',
    cachTen: 'Cách kiếm tinh thể',
    cach: [
      { chu: 'Mỗi nhiệm vụ ngày', so: '+5 – 10' },
      { chu: 'Rương ngày (xong 3 nhiệm vụ)', so: '+15' },
      { chu: 'Đạt mục tiêu ngày', so: '+5' },
      { chu: 'Mốc chuỗi 7 / 30 / 100 ngày', so: '+10 / 30 / 100' },
      ...(tq?.bat.giai ? [{ chu: 'Lên hạng Giải tuần', so: '+20 – 60' }] : []),
      ...(tq?.bat.kimCuong ? [{ chu: 'Thử thách Kim cương', so: '+40' }] : []),
    ],
    dungTen: 'Dùng để',
    dung: [
      `Mua bình giữ chuỗi: ${so(giaBinh(tq))} tinh thể, mỗi tuần 1 bình.`,
      `Cược chuỗi 7 ngày: đặt ${DAT_CUOC}, giữ chuỗi đủ 7 ngày nhận về ${DAT_CUOC * 2}.`,
    ],
    luuY: tq?.bat.thangHoa ? '2 ngày liền không xong chặng nào và không có bình giữ chuỗi thì 10% tinh thể bay hơi mất.' : undefined,
    nut: { chu: 'Mở Cửa hàng', man: 'cua-hang' },
  }
}

export interface PropsTamHuongDan {
  loai: LoaiBieuTuong
  tq?: TongQuanThuong | null
  /** Màn làm chặng: số nguyên tử của bài đang làm (thay số hôm nay). */
  soBai?: number
  /** Có ⇒ nút chính mở màn chi tiết (rồi đóng tấm); không ⇒ chỉ «Đã hiểu» (đang làm chặng không rời bài). */
  onMo?: (man: ManHuongDan) => void
  onDong: () => void
}

export function TamHuongDan({ loai, tq, soBai, onMo, onDong }: PropsTamHuongDan) {
  const id = useId()
  const nut = useRef<HTMLButtonElement>(null)
  const nd = noiDungHuongDan(loai, tq, soBai)
  const dongRef = useRef(onDong)
  dongRef.current = onDong
  useEffect(() => {
    const truoc = document.activeElement instanceof HTMLElement ? document.activeElement : null
    nut.current?.focus({ preventScroll: true })
    const f = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); dongRef.current() } }
    window.addEventListener('keydown', f, true)
    return () => { window.removeEventListener('keydown', f, true); if (truoc?.isConnected) truoc.focus({ preventScroll: true }) }
  }, [])
  const giuTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const ds = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button')]
    const dau = ds[0], cuoi = ds[ds.length - 1]
    if (e.shiftKey && document.activeElement === dau) { e.preventDefault(); cuoi?.focus() }
    else if (!e.shiftKey && document.activeElement === cuoi) { e.preventDefault(); dau?.focus() }
  }
  const Ic = loai === 'lua' ? <IcLua tat={(tq?.chuoiNgay?.so ?? 0) === 0 && !!tq?.chuoiNgay} /> : loai === 'nt' ? <IcNguyenTu /> : <IcTinhThe />
  const chinh = onMo && nd.nut
  return <div className="tp-hd" data-k={loai}>
    <div className="tp-hd-nen" aria-hidden="true" onClick={onDong} />
    <section className="tp-hd-tam" role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} aria-describedby={`${id}-l`} onKeyDown={giuTab}>
      <div className="tp-hd-dau">
        <span className="tp-hd-hinh" aria-hidden="true">{Ic}</span>
        <div><h2 id={`${id}-t`}>{nd.tieu}</h2><p id={`${id}-l`}>{nd.la}</p></div>
      </div>
      {nd.nay && <p className="tp-hd-nay">{nd.nay}</p>}
      <h3>{nd.cachTen}</h3>
      <ul className="tp-hd-ds">{nd.cach.map((d) => <li key={d.chu}><span>{d.chu}</span>{d.so && <b>{d.so}</b>}</li>)}</ul>
      <h3>{nd.dungTen}</h3>
      <ul className="tp-hd-dung">{nd.dung.map((d) => <li key={d}>{d}</li>)}</ul>
      {nd.luuY && <p className="tp-hd-luu">{nd.luuY}</p>}
      <div className="tp-hd-nut">
        {chinh
          ? <><button ref={nut} type="button" className="tp-nut-lon" onClick={() => { onDong(); onMo(nd.nut!.man) }}>{nd.nut!.chu}</button>
            <button type="button" className="tp-hd-hieu" onClick={onDong}>Đã hiểu</button></>
          : <button ref={nut} type="button" className="tp-nut-lon" onClick={onDong}>Đã hiểu</button>}
      </div>
    </section>
  </div>
}

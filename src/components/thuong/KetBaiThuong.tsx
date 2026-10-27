// MÀN KẾT BÀI (bản vẽ tp-3, thầy chốt 26/10) — một màn trả lời đủ 3 câu của em: được bao nhiêu nguyên tử (và vì sao) · hôm nay còn mấy bài · đứng thứ
// mấy trong giải. Đọc trường `ketBai` của phản hồi `answer` câu cuối (hợp đồng 4.1): {tong, dong[], soDung, soCau, chinhXac, giay, hoanHao, mucTieu?, giai?}.
// Dòng tách nguyên tử lấy ĐÚNG nhãn máy chủ gửi (không tự tính lại). Thiếu `mucTieu` / `giai` ⇒ thẻ đó ẩn; công tắc giải tắt ⇒ ẩn thẻ giải.
// Hiệu ứng: B1 ba thẻ bật lần lượt + số đếm · B2 bài hoàn hảo: tinh thể kết tinh + tia xoay · B3 Bi mừng + hoa giấy · B4 vòng mục tiêu tô dần, đầy thì nổ hạt.
// NẠP LƯỜI (host: lazy(() => import('./thuong/KetBaiThuong'))). Bấm «Tiếp tục» giữa hiệu ứng ⇒ nhảy tới trạng thái cuối.
import { useRef } from 'react'
import { Clock, Target } from 'lucide-react'
import { Bi } from '../linh-vat/Bi'
import { bungHat, demSo, hoaGiay, hoatAnh, phanHoiThuong, xongHieuUng } from '../../lib/hieu-ung-thuong'
import { phatThuong } from '../../lib/am-thanh-thuong'
import { hangSau, type CongTac, type HangGiai, type KetBai } from '../../lib/thuong-api'
import { HuyHieuKimLoai, IcNguyenTu, IcTinhThe, TEN_HANG, Tia } from './hinh'
import { useHieuUng } from './chung'

const CHU_VI = 175.9 // 2π·28
const phutGiay = (g: number) => `${Math.floor(g / 60)}:${String(g % 60).padStart(2, '0')}`

export interface PropsKetBai {
  ketBai: KetBai
  /** Dòng phụ dưới tiêu đề, vd. «Amine · tầng Hiểu · chặng 3 · 6 câu». */
  phu?: string
  /** Hạng giải hiện tại (từ /hs/thuong `giai.hang`) — để vẽ huy hiệu + tên nhóm. */
  hang?: HangGiai
  bat?: CongTac
  onTiep: () => void
  chuNut?: string
}

export default function KetBaiThuong({ ketBai: k, phu, hang, bat, onTiep, chuNut = 'Tiếp tục' }: PropsKetBai) {
  const hh = k.hoanHao
  const mt = k.mucTieu, dat = !!mt && mt.daXong >= mt.can
  const g = bat?.giai === false ? undefined : k.giai
  const ba = useRef<HTMLDivElement>(null), bi = useRef<HTMLDivElement>(null), kt = useRef<HTMLDivElement>(null), vong = useRef<HTMLDivElement>(null), chip = useRef<HTMLSpanElement>(null)
  useHieuUng((h) => {
    ba.current?.querySelectorAll(':scope > div').forEach((d, i) => hoatAnh(d, [{ transform: 'translateY(16px) scale(.85)', opacity: 0 }, { transform: 'scale(1.05)', opacity: 1, offset: 0.6 }, { transform: 'none', opacity: 1 }], 420, { tre: 200 + i * 120 }))
    // 27/10 (thầy «làm lại cho ngon như Duolingo»): ba thẻ số đếm lên ease-out 900 ms, «tích» nhẹ khi số tăng (màn kiểm tra tự im — cờ dangCheDoThi),
    // thẻ TỔNG nảy khi đếm xong. Số lấy nguyên từ máy chủ (ketBai). Giảm chuyển động ⇒ demSo hiện ngay số cuối.
    const dem = ba.current?.querySelectorAll<HTMLElement>('[data-dem]') ?? []
    let tich = 0
    dem.forEach((s, i) => {
      const toi = Number(s.dataset.dem), duoi = s.dataset.duoi ?? '', dau = s.dataset.dau ?? '', gio = s.dataset.gio !== undefined
      const dinh = (v: number) => (gio ? phutGiay(v) : `${dau}${v}${duoi}`)
      s.textContent = dinh(0)
      h.sau(260 + i * 120, () => void demSo(s, 0, toi, 900, (v) => { const n = performance.now(); if (v > 0 && n - tich > 55) { tich = n; phatThuong('tick') } return dinh(v) })
        .then(() => { if (s.dataset.tong !== undefined) hoatAnh(s.closest('[role=group]'), [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(.98)' }, { transform: 'scale(1)' }], 320) }))
    })
    document.querySelectorAll('.tp-tach .hang-t').forEach((r, i) => hoatAnh(r, [{ transform: 'translateX(-12px)', opacity: 0 }, { transform: 'none', opacity: 1 }], 260, { tre: 500 + i * 90 }))
    if (hh) {
      phanHoiThuong('hoanHao')
      hoatAnh(kt.current, [{ transform: 'scale(0) rotate(-30deg)', opacity: 0 }, { transform: 'scale(.4) rotate(-10deg)', opacity: 1, offset: 0.3 }, { transform: 'scale(1.12) rotate(4deg)', opacity: 1, offset: 0.8 }, { transform: 'none', opacity: 1 }], 1200)
      hoatAnh(document.querySelector('.tp-ket-hinh .tp-tia'), [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'none' }], 900, { tre: 300 })
      hoatAnh(bi.current, [{ transform: 'translateY(0)' }, { transform: 'translateY(-26px)' }, { transform: 'translateY(0)' }, { transform: 'translateY(-14px)' }, { transform: 'translateY(0)' }], 1000, { tre: 400 })
      h.sau(650, () => { bungHat(kt.current, { n: 12, r: 120, mau: ['kc', 'tt', 'sao'] }); hoaGiay(30, 1200) })
    } else {
      phanHoiThuong('xong')
      hoatAnh(bi.current, [{ transform: 'translateY(0)' }, { transform: 'translateY(-18px)' }, { transform: 'translateY(0)' }], 500, { tre: 200 })
    }
    if (mt) {
      const c = vong.current?.querySelector('.chay'), tu = Math.max(0, (mt.daXong - 1) / mt.can), toi = Math.min(1, mt.daXong / mt.can)
      if (c && typeof requestAnimationFrame === 'function') h.sau(900, () => {
        const t0 = performance.now()
        const f = (t: number) => { const p = Math.min(1, (t - t0) / 600), x = tu + (toi - tu) * (1 - Math.pow(1 - p, 3)); c.setAttribute('stroke-dasharray', `${x * CHU_VI} 200`); if (p < 1) requestAnimationFrame(f); else if (dat) { phanHoiThuong('mucTieu'); bungHat(vong.current, { n: 14, r: 70 }); hoatAnh(chip.current, [{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1 }, { transform: 'none', opacity: 1 }], 360) } }
        c.setAttribute('stroke-dasharray', `${tu * CHU_VI} 200`); requestAnimationFrame(f)
      })
    }
  }, [])
  const dong = k.dong.length ? k.dong : [{ nhan: 'Nguyên tử của chặng', so: k.tong }]
  return <div className="tp-goc tp-ket" data-hh={hh || undefined}>
    <main className="tp-man" data-hai="">
      <div className="cot-a">
        {hh ? <div className="tp-ket-hinh"><Tia className="quay" /><div ref={kt} className="kt-o"><HuyHieuKimLoai hang="kimcuong" an /></div><div ref={bi} className="bi-o"><Bi cam="mung" size={80} /></div></div>
          : <div className="tp-hinh"><div ref={bi}><Bi cam="vui" size={120} /></div></div>}
        <h1 style={hh ? { color: 'var(--tr-sao-chu)' } : undefined}>{hh ? 'Hoàn hảo!' : 'Xong chặng!'}</h1>
        {(phu || hh) && <p className="tp-phu">{hh ? `${k.soCau}/${k.soCau} câu đúng, tự làm${phu ? ` · ${phu}` : ''}` : phu}</p>}
        <div ref={ba} className="tp-3o">
          {/* thẻ kiểu Duolingo «Lesson complete»: viền màu + tiêu đề nhỏ in hoa — TỔNG NGUYÊN TỬ vàng · CHÍNH XÁC xanh lá · THỜI GIAN xanh dương */}
          <div data-sac="sao" role="group" aria-label={`Tổng nguyên tử: +${k.tong}`}><p>Tổng nguyên tử</p><b aria-hidden="true"><IcNguyenTu /><span data-dem={k.tong} data-dau="+" data-tong="">+{k.tong}</span></b></div>
          <div role="group" aria-label={`Chính xác: ${k.chinhXac}%`}><p>Chính xác</p><b aria-hidden="true"><Target /><span data-dem={k.chinhXac} data-duoi="%">{k.chinhXac}%</span></b></div>
          <div data-sac="tin" role="group" aria-label={`Thời gian: ${phutGiay(k.giay)}`}><p>Thời gian</p><b aria-hidden="true"><Clock /><span data-dem={k.giay} data-gio="">{phutGiay(k.giay)}</span></b></div>
        </div>
      </div>
      <div className="cot-b">
        <section className="tp-the tp-tach" aria-label="Nguyên tử của chặng">
          <h2>Nguyên tử của chặng</h2>
          {dong.map((d, i) => <div key={i} className="hang-t" data-khong={d.so === 0 || undefined} data-hh={/hoàn hảo/i.test(d.nhan) && d.so > 0 || undefined}><span>{d.nhan}</span><b>{d.so >= 0 ? '+' : ''}{d.so}</b></div>)}
          <div className="hang-t" data-tong=""><span>Tổng</span><b>+{k.tong} <IcNguyenTu /></b></div>
        </section>
        {(mt || g) && <div className="tp-hai">
          {mt && <section className="tp-the" aria-label="Mục tiêu ngày">
            <div className="tp-dong">
              <div ref={vong} className="tp-vong" data-dat={dat || undefined} role="img" aria-label={`Mục tiêu ngày ${mt.daXong}/${mt.can} chặng`}>
                <svg viewBox="0 0 64 64" aria-hidden="true"><circle className="nen" cx="32" cy="32" r="28" /><circle className="chay" cx="32" cy="32" r="28" strokeDasharray={`${Math.min(1, mt.daXong / mt.can) * CHU_VI} 200`} /></svg><b aria-hidden="true">{mt.daXong}/{mt.can}</b></div>
              <div className="giua">{dat ? <><b>Đạt mục tiêu! · {mt.daXong}/{mt.can} chặng</b><span ref={chip} className="tp-dat">+5 <IcTinhThe /> tinh thể</span></>
                : <><b>Mục tiêu ngày · {mt.daXong}/{mt.can} chặng</b><span>Thêm {mt.can - mt.daXong} chặng nữa là đạt, nhận +5 <IcTinhThe /></span></>}</div>
            </div>
          </section>}
          {g && <section className="tp-the" aria-label="Giải tuần">
            <div className="tp-giai-dong">{hang && <HuyHieuKimLoai hang={hang} an />}
              <div className="giua"><b>{g.doi > 0 ? 'Lên hạng' : 'Hạng'} {g.thuHang} trong nhóm{hang ? ` ${TEN_HANG[hang]}` : ' giải tuần'}{g.doi !== 0 && <> <span className="tp-len-hang" data-roi={g.doi < 0 || undefined}>{g.doi > 0 ? '↑' : '↓'}{Math.abs(g.doi)}</span></>}</b>
                {hang && hangSau(hang) && <span>Top 5 cuối tuần được lên Giải {TEN_HANG[hangSau(hang)!]}</span>}</div>
            </div>
          </section>}
        </div>}
      </div>
    </main>
    <div className="tp-day"><div className="tp-day-giua"><button type="button" className="tp-nut-lon" onClick={() => { xongHieuUng(); onTiep() }}>{chuNut}</button></div></div>
  </div>
}

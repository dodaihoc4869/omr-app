// Khối "Lịch ôn lại" của bảng "Mọi thứ về con" kiểu Apple (mẫu docs/ban-ve-ph-apple-2109/ph-d-bang-day-du.html #muc-on + ph-e-bang-thua.html #muc-on-ch): số câu đến lịch ôn, vòng "đã khắc phục a trong b câu từng sai", cột 7 ngày tới.
// Cảnh con CHƯA học hôm nay và còn câu đến lịch hôm nay ⇒ nói "hôm nay" (không có phút ước tính cho hôm nay ⇒ bỏ vế phút). Chưa khắc phục câu nào ⇒ KHÔNG vẽ vòng "0" mà giải thích cách tính. Thiếu tongTungSai ⇒ mẫu số = đã khắc phục + còn sai.
import type { CSSProperties } from 'react'
import { ngayDayDuVn } from '../../../lib/ph-moi/dinh-dang'
import type { PhMoi } from '../../../lib/ph-moi/du-lieu'
import { BtTichVong, BtXoay } from './bieu-tuong'
import { conChuaHoc } from './dung-chung'
import { congNgay, mocMay, ngayVnChuoi, nhanThuNgay } from './c-chung'
import './khoi-c.css'

export const coLichOn = (pm: PhMoi): boolean => {
  const l = pm.lichOn
  return !!l && (l.homNay > 0 || l.ngayMai > 0 || l.daKhacPhuc14Ngay > 0 || l.conSaiChuaKhacPhuc > 0 || !!l.bayNgayToi?.some((d) => d.soCau > 0))
}

const CHU_VI_VONG = 270.2 // 2π · 43 (bán kính vòng trong mẫu)
const CAO_TOI_DA = 10 // cột 7 ngày tới cao tối đa bằng 10 "bậc" (mẫu chỉ có tới 7): ngày nhiều câu hơn thì co tỉ lệ, số chữ vẫn là số thật

export function LichOn({ pm, chuaHoc }: { pm: PhMoi; chuaHoc?: boolean }) {
  const l = pm.lichOn
  if (!l || !coLichOn(pm)) return null
  const nay = mocMay(pm)
  const homNayChuoi = ngayVnChuoi(nay)
  const chua = chuaHoc ?? conChuaHoc(pm)
  const veHomNay = chua && l.homNay > 0

  const so = veHomNay ? l.homNay : l.ngayMai
  const nhan = veHomNay ? 'câu đến lịch ôn hôm nay' : 'câu đến lịch ôn ngày mai'
  const ngayMoc = veHomNay ? ngayDayDuVn(nay) : ngayDayDuVn(nay + 86_400_000)
  const phut = !veHomNay && l.phutNgayMai !== null && l.phutNgayMai > 0 ? `khoảng ${Math.round(l.phutNgayMai)} phút` : ''
  const phu = [ngayMoc, phut].filter(Boolean).join(' · ')

  const tong = l.tongTungSai !== null && l.tongTungSai >= l.daKhacPhuc14Ngay ? l.tongTungSai : l.daKhacPhuc14Ngay + l.conSaiChuaKhacPhuc
  const coVong = l.daKhacPhuc14Ngay > 0 && tong > 0
  const dai = coVong ? Math.min(1, l.daKhacPhuc14Ngay / tong) * CHU_VI_VONG : 0

  const tuan = l.bayNgayToi && l.bayNgayToi.length > 0 ? l.bayNgayToi : null
  const daiNhat = tuan ? Math.max(...tuan.map((d) => d.soCau)) : 0
  const ngayMaiChuoi = congNgay(homNayChuoi, 1)

  return (
    <section className="phm-muc" id="muc-on" aria-label="Lịch ôn lại">
      <header className="phm-muc__dau">
        <h2>Lịch ôn lại</h2>
        <p>các câu con từng làm sai</p>
      </header>
      <div className="phm-the phm-the--dem">
        <div className="phm-on">
          <p className="phm-on__so">
            <b>{so}</b>
            <span>{nhan}</span>
            <small>{phu}</small>
            {!veHomNay && l.homNay > 0 && <small>{`Hôm nay còn ${l.homNay} câu đến lịch ôn`}</small>}
          </p>
          {coVong && (
            <div className="phm-vong1" role="img" aria-label={`Đã khắc phục ${l.daKhacPhuc14Ngay} trong ${tong} câu từng sai`}>
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle className="phm-v-nen" cx="50" cy="50" r="43" />
                <circle className="phm-v-dat" cx="50" cy="50" r="43" strokeDasharray={`${dai.toFixed(1)} ${CHU_VI_VONG}`} />
              </svg>
              <div>
                {l.daKhacPhuc14Ngay}/{tong}
                <small>câu</small>
              </div>
            </div>
          )}
        </div>
        {coVong ? (
          <p className="phm-on__kp">
            <BtTichVong />
            <span>
              Đã khắc phục {l.daKhacPhuc14Ngay} trong {tong} câu từng sai
              {l.conSaiChuaKhacPhuc > 0 && <small>còn {l.conSaiChuaKhacPhuc} câu đang trong lịch ôn</small>}
            </span>
          </p>
        ) : (
          l.conSaiChuaKhacPhuc > 0 && (
            <p className="phm-on__kp" data-mau="xam">
              <BtXoay />
              <span>
                {l.conSaiChuaKhacPhuc} câu con từng sai đang trong lịch ôn
                <small>câu nào con làm đúng lại đủ lịch sẽ được tính là đã khắc phục</small>
              </span>
            </p>
          )
        )}
        {tuan && (
          <div className="phm-tuan">
            <h3>Số câu đến lịch ôn · {tuan.length} ngày tới</h3>
            <ol>
              {tuan.map((d, i) => (
                <li
                  key={d.ngay}
                  data-mai={d.ngay === ngayMaiChuoi ? '' : undefined}
                  data-khong={d.soCau === 0 ? '' : undefined}
                  aria-label={`${nhanThuNgay(d.ngay)}/${d.ngay.slice(5, 7)}: ${d.soCau} câu`}
                  style={{ '--c': daiNhat > CAO_TOI_DA ? Math.round((d.soCau / daiNhat) * CAO_TOI_DA * 100) / 100 : d.soCau, '--k': i } as CSSProperties}
                >
                  <b>{d.soCau}</b>
                  <i />
                  {nhanThuNgay(d.ngay)}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  )
}

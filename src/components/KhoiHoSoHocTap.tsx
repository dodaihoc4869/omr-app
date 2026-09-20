import { useEffect, useState, type ReactNode } from 'react'
import { layHoSoNamKt, layKeHoachEm, lichOn, ngayVn, tomTatKeHoach, type HoSoNamKt, type KeHoachEm } from '../lib/ho-so-em-thay'

/** HỒ SƠ HỌC TẬP MỘT EM cho thầy (G3, bản vẽ docs/ban-ve-app-giao-vien-2109/3-ho-so-hoc-sinh.jpg): cột trái "Mạnh · yếu" (khối có sẵn,
 *  truyền vào) + "Lịch ôn 1 · 3 · 7 ngày"; cột phải "Kế hoạch hôm nay của em" + "Thần thú · EXP". CHỈ ĐỌC. Khối nào chưa có số thì nói
 *  "đang chờ máy chủ" — không bịa. Số liệu: `src/lib/ho-so-em-thay.ts`. */
const CHO = 'đang chờ máy chủ'

export default function KhoiHoSoHocTap({ sbd, chuyenDe }: { sbd: string; chuyenDe: ReactNode }) {
  const [namKt, setNamKt] = useState<HoSoNamKt | null | undefined>(undefined)
  const [kh, setKh] = useState<KeHoachEm | null | undefined>(undefined)
  useEffect(() => {
    let huy = false
    setNamKt(undefined)
    setKh(undefined)
    void layHoSoNamKt(sbd).then((r) => !huy && setNamKt(r))
    void layKeHoachEm(sbd).then((r) => !huy && setKh(r))
    return () => {
      huy = true
    }
  }, [sbd])

  const lich = namKt ? lichOn(namKt.cau, ngayVn()) : null
  const tt = kh ? tomTatKeHoach(kh) : null

  return (
    <div className="hs-luoi" data-khoi="ho-so-hoc-tap">
      <div className="hs-cot">
        {chuyenDe}
        <section className="hs-the" aria-labelledby="hs-lich-on">
          <h3 id="hs-lich-on" className="hs-the-tieu-de">
            LỊCH ÔN 1 · 3 · 7 NGÀY
          </h3>
          {namKt === undefined ? (
            <p className="hs-the-phu">Đang tải…</p>
          ) : !lich ? (
            <p className="hs-the-phu">Lịch ôn: {CHO}.</p>
          ) : namKt && namKt.cau.length === 0 ? (
            <p className="hs-the-phu">Em chưa có câu nào trong hồ sơ ôn.</p>
          ) : (
            <div className="hs-o-luoi">
              {(
                [
                  ['moi-sai', lich.moiSai, 'mới sai'],
                  ['dang-on', lich.dangOn, 'đang ôn'],
                  ['toi-han', lich.toiHan, 'tới hạn hôm nay'],
                  ['khac-phuc', lich.daKhacPhuc, 'đã khắc phục'],
                ] as const
              ).map(([ma, so, nhan]) => (
                <div key={ma} className={`hs-o hs-o--${ma}`}>
                  <span className="hs-o-so">{so}</span>
                  <span className="hs-o-nhan">{nhan}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="hs-cot">
        <section className="hs-the hs-the--ke-hoach" aria-labelledby="hs-ke-hoach">
          <div className="hs-the-dau">
            <h3 id="hs-ke-hoach" className="hs-the-tieu-de">
              KẾ HOẠCH HÔM NAY CỦA EM
            </h3>
            {tt?.chip && <span className="hs-chip-nho">{tt.chip}</span>}
          </div>
          {kh === undefined ? (
            <p className="hs-the-phu">Đang tải…</p>
          ) : !tt ? (
            <p className="hs-the-phu">Kế hoạch hôm nay: {CHO}.</p>
          ) : tt.chuaCo ? (
            <p className="hs-the-phu">Chưa có kế hoạch hôm nay của em (lập lúc 00:01 hoặc khi em mở app).</p>
          ) : tt.nghi ? (
            <p className="hs-the-phu">Hôm nay là ngày nghỉ của em.</p>
          ) : tt.dong.length === 0 ? (
            <p className="hs-the-phu">Hôm nay chưa có việc nào cho em.</p>
          ) : (
            <ol className="hs-viec">
              {tt.dong.map((d) => (
                <li key={d.thuTu} className={`hs-viec-dong${d.mo ? ' hs-viec-dong--mo' : ''}`}>
                  <b>{d.thuTu}.</b> {d.chu}
                  {d.xong ? ' — đã xong' : ''}
                </li>
              ))}
            </ol>
          )}
          {tt?.tienDo && <p className="hs-the-phu">{tt.tienDo}</p>}
        </section>

        <section className="hs-the" aria-labelledby="hs-than-thu">
          <h3 id="hs-than-thu" className="hs-the-tieu-de">
            THẦN THÚ · EXP
          </h3>
          {kh === undefined ? (
            <p className="hs-the-phu">Đang tải…</p>
          ) : !tt ? (
            <p className="hs-the-phu">Thần thú: {CHO}.</p>
          ) : tt.chuaCo ? (
            <p className="hs-the-phu">Chưa có số liệu hôm nay.</p>
          ) : !tt.thanThu ? (
            <p className="hs-the-phu">Em chưa chọn thần thú.</p>
          ) : (
            <div>
              <div className="hs-than-thu-ten">
                {tt.thanThu.ten || 'Thần thú'}
                {tt.thanThu.cap !== null ? ` · cấp ${tt.thanThu.cap}` : ''}
              </div>
              <div className="hs-the-phu">{tt.thanThu.expHomNay !== null ? `hôm nay +${tt.thanThu.expHomNay} EXP` : 'chưa có EXP hôm nay'}</div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

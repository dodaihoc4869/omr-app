// "Bài tập về nhà đang chạy" kiểu SỔ LỆNH: mỗi bài một thanh ba đoạn (chưa mở / đang làm / đã nộp) + ĐẾM NGƯỢC hạn nộp đến từng giây + lượt nhắc kế của A.I Đỗ Đại Học.
// Tên bài là TÊN CHUYÊN ĐỀ + lớp (máy chủ trả từ kho đề), không mã kỹ thuật. Chỉ ĐỌC. Đoạn nào đổi (em vừa nộp) thì nháy sáng một nhịp.
import { useEffect, useRef, useState } from 'react'
import type { BaiTapBangTin } from '../../lib/bang-tin-thay'
import { gioPhutVN } from '../../lib/em-toan-canh'

const TOI_DA_BAI = 4

const hai = (n: number): string => String(n).padStart(2, '0')
/** Đếm ngược tới hạn nộp: "2 ngày 20:33:07" / "05:41:45"; quá hạn ⇒ thời gian ĐÃ trôi. `hanNop` hỏng ⇒ null (không bịa). */
export function conLaiHan(hanNop: string, nowMs: number): { qua: boolean; chu: string } | null {
  const han = Date.parse(hanNop)
  if (!Number.isFinite(han)) return null
  const d = han - nowMs
  const s = Math.floor(Math.abs(d) / 1000)
  const ngay = Math.floor(s / 86400)
  const hms = `${hai(Math.floor((s % 86400) / 3600))}:${hai(Math.floor((s % 3600) / 60))}:${hai(s % 60)}`
  return { qua: d < 0, chu: `${ngay > 0 ? `${ngay} ngày ` : ''}${hms}` }
}

const NHAN = ['chưa mở', 'đang làm', 'đã nộp'] as const
/** Chữ trên MỘT đoạn của thanh: chỉ SỐ em (nhãn "chưa mở / đang làm / đã nộp" nằm ở chú giải trên đầu khối — khung hẹp không đủ chỗ cho nhãn trên từng đoạn). */
export const chuDoan = (so: number): string => String(so)

export function SoLenhBai({ baiTap, nowMs }: { baiTap: readonly BaiTapBangTin[]; nowMs: number }) {
  const ds = [...baiTap].sort((a, b) => (Date.parse(a.hanNop) || Infinity) - (Date.parse(b.hanNop) || Infinity)).slice(0, TOI_DA_BAI)
  const conLai = baiTap.length - ds.length
  const tongNop = baiTap.reduce((t, b) => t + b.daNop, 0)
  // đoạn "đã nộp" nháy sáng khi số em nộp tăng
  const truoc = useRef(new Map<string, number>())
  const [nhay, setNhay] = useState<Record<string, number>>({})
  useEffect(() => {
    const moi: Record<string, number> = {}
    for (const b of baiTap) {
      const cu = truoc.current.get(b.ma)
      if (cu !== undefined && b.daNop > cu) moi[b.ma] = (nhay[b.ma] ?? 0) + 1
      truoc.current.set(b.ma, b.daNop)
    }
    if (Object.keys(moi).length > 0) setNhay((n) => ({ ...n, ...moi }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baiTap])
  return (
    <article className="bts-the" data-khoi="bai-tap">
      <div className="bts-the-dau">
        <h2 className="bts-ten">Bài tập về nhà đang chạy</h2>
        <span className="bts-the-phu">{tongNop} em đã nộp</span>
      </div>
      <p className="bts-chu-giai-bai" aria-hidden="true">
        <span><i className="bts-cg bts-cg-xam" />chưa mở</span>
        <span><i className="bts-cg bts-cg-vang" />đang làm</span>
        <span><i className="bts-cg bts-cg-la" />đã nộp</span>
      </p>
      <ul className="bts-so-lenh">
        {ds.map((b) => {
          const han = conLaiHan(b.hanNop, nowMs)
          const so = [b.chuaMo, b.dangLam, b.daNop]
          return (
            <li className="bts-bai" key={b.ma}>
              <div className="bts-bai-ten">
                <b>{b.ten}</b> <span>· {b.tenLop}</span>
              </div>
              <div className="bts-thanh" role="img" aria-label={`${b.chuaMo} em chưa mở, ${b.dangLam} em đang làm, ${b.daNop} em đã nộp`}>
                {so.map((n, i) => (
                  <i
                    key={i === 2 ? `nop-${nhay[b.ma] ?? 0}` : i}
                    className={`bts-d-${['chua', 'dang', 'nop'][i]}${i === 2 && (nhay[b.ma] ?? 0) > 0 ? ' bts-nhay' : ''}`}
                    style={{ flexGrow: Math.max(n, 0.001) }}
                    title={`${n} em ${NHAN[i]}`}
                  >
                    {chuDoan(n)}
                  </i>
                ))}
              </div>
              <div className="bts-bai-chan bts-so">
                <span>
                  {han ? (
                    <>
                      {han.qua ? 'Quá hạn ' : 'Hạn nộp còn '}
                      <b>{han.chu}</b>
                    </>
                  ) : (
                    ''
                  )}
                </span>
                {b.nhac?.luotKe && <span>lượt nhắc kế {gioPhutVN(b.nhac.luotKe)}</span>}
              </div>
            </li>
          )
        })}
      </ul>
      {conLai > 0 && <p className="bts-them">+{conLai} bài nữa (xem ở mục Giao bài tập về nhà)</p>}
    </article>
  )
}

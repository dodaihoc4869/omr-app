// HÀNH TRÌNH › DẠY HỌC & ĐẦU GIỜ › bước "Tick bài vừa dạy" › bảng "BÀI ĐANG GIAO" (thầy 12/10, bản vẽ HanhTrinh-DayHoc đã duyệt): mỗi lớp/gói còn
// hạn một dòng — Lớp · số em · Bài · Hạn nộp · thanh "Đã gặp câu gốc %" · thanh "Đã tự làm %". Dữ liệu: `/gv/goi-bai-7` (lệnh đầu trả danh sách gói +
// chi tiết gói đầu; gói còn lại đọc theo `goiId`, tối đa 2 lệnh song song). Lớp chưa em nào nhận bài ⇒ "Chưa em nào nhận bài · kiểm lại danh sách
// lớp" thay vì 0% (lỗi thầy chỉ ra 12/10: "Học sinh nhận bài 0" — máy chủ so lớp em theo KHỐI thay vì tên lớp; đã sửa ở goi-bai-7.ts).
// Cuối bảng: lối sang mục Chữa bài (câu nhiều em sai của các bài này). Năm trạng thái: đang tải · lỗi + Thử lại · chưa bật · trống · có dữ liệu.
// Màu: chỉ biến --gvm-* (gv-v2.css).
import { useEffect, useId, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { goiLenh } from '../../lib/goi-lenh-thay'
import { ngayVn, type DuGoi7, type GoiDu } from './goi7-ui'
import { chuDemGiao, chuHanDong, dongBaiDangGiao, goiDangGiao, TOI_DA_DONG_GIAO, type DongBaiDangGiao } from './buoi-day-ui'

const CHU_CHUA_CO_LENH = 'Máy chủ chưa có bảng bài 7 ngày.'
/** Số lệnh đọc chi tiết gói chạy cùng lúc (đỡ dồn máy chủ). */
const SONG_SONG = 2

type Trang = { loai: 'tai' } | { loai: 'loi'; chu: string } | { loai: 'tat' } | { loai: 'co'; goi: GoiDu[]; conNua: number }
type ChiTiet = Record<string, DongBaiDangGiao | 'loi'>

const laDu = (d: unknown): d is DuGoi7 => !!d && typeof d === 'object' && Array.isArray((d as DuGoi7).em) && Array.isArray((d as DuGoi7).cau)

function Thanh({ p, nhan, loai }: { p: number | null; nhan: string; loai: 'gap' | 'tu-lam' }) {
  if (p === null) return <span className="gvv2-bdg-khong">Chưa có số</span>
  return (
    <span className="gvv2-bdg-thanh-o">
      <span className="gvv2-bdg-thanh" data-loai={loai} role="img" aria-label={`${nhan} ${p}%`}>
        <i style={{ width: `${Math.max(0, Math.min(100, p))}%` }} />
      </span>
      <b className="gvv2-so">{p}%</b>
    </span>
  )
}

export default function BangBaiDangGiao({ onMoChuaBai }: { onMoChuaBai?: () => void }) {
  const [trang, setTrang] = useState<Trang>({ loai: 'tai' })
  const [chiTiet, setChiTiet] = useState<ChiTiet>({})
  const [lan, setLan] = useState(0)
  const idTieuDe = useId()
  const homNay = ngayVn()

  useEffect(() => {
    let huy = false
    setTrang({ loai: 'tai' })
    setChiTiet({})
    void (async () => {
      const r = await goiLenh('/gv/goi-bai-7', { lop: '' }, CHU_CHUA_CO_LENH)
      if (huy) return
      if (!r.ok) {
        setTrang({ loai: 'loi', chu: r.chu })
        return
      }
      const d = r.du as unknown as Partial<DuGoi7>
      if (d.bat !== true) {
        setTrang({ loai: 'tat' })
        return
      }
      const tatCa = goiDangGiao(Array.isArray(d.goi) ? d.goi : [], ngayVn())
      const goi = tatCa.slice(0, TOI_DA_DONG_GIAO)
      setTrang({ loai: 'co', goi, conNua: tatCa.length - goi.length })
      // Gói máy chủ vừa trả kèm chi tiết (gói đầu) — dùng luôn, không gọi lại.
      const dau = goi.find((g) => g.id === d.goiId)
      if (dau && laDu(d)) setChiTiet((cu) => ({ ...cu, [dau.id]: dongBaiDangGiao(dau, d) }))
      const can = goi.filter((g) => g !== dau)
      let i = 0
      const chay = async () => {
        while (!huy && i < can.length) {
          const g = can[i++]!
          const x = await goiLenh('/gv/goi-bai-7', { lop: '', goiId: g.id }, CHU_CHUA_CO_LENH)
          if (huy) return
          const du = x.ok ? (x.du as unknown) : null
          setChiTiet((cu) => ({ ...cu, [g.id]: x.ok && laDu(du) && (du as DuGoi7).goiId === g.id ? dongBaiDangGiao(g, du as DuGoi7) : 'loi' }))
        }
      }
      await Promise.all(Array.from({ length: Math.min(SONG_SONG, can.length) }, chay))
    })()
    return () => {
      huy = true
    }
  }, [lan])

  const dong = trang.loai === 'co' ? trang.goi : []
  const capNhat = (
    <button type="button" className="gvv2-nut-chu" onClick={() => setLan((n) => n + 1)} disabled={trang.loai === 'tai'}>
      <RefreshCw size={16} aria-hidden="true" /> Cập nhật
    </button>
  )

  return (
    <div className="gvv2-bdg" data-khoi="bai-dang-giao" role="region" aria-labelledby={idTieuDe}>
      <div className="gvv2-bdg-dau">
        <h3 id={idTieuDe} className="gvv2-bdg-ten">
          Bài đang giao{trang.loai === 'co' && dong.length > 0 ? ` · ${chuDemGiao(dong)}` : ''}
        </h3>
        {trang.loai === 'co' && dong.length > 0 && <span className="gvv2-bdg-chu-thich">Mỗi thanh: phần câu gốc cả lớp đã gặp / đã tự làm</span>}
        {trang.loai === 'co' && capNhat}
      </div>

      {trang.loai === 'tai' ? (
        <div className="gvv2-bdg-xuong" role="status" aria-label="Đang tải bài đang giao">
          {[0, 1, 2].map((k) => (
            <span key={k} className="tt-xuong" style={{ display: 'block', width: '100%', height: 44, borderRadius: 12 }} />
          ))}
        </div>
      ) : trang.loai === 'loi' ? (
        <p className="dh-loi" role="alert">
          Chưa tải được bài đang giao: {trang.chu}
        </p>
      ) : trang.loai === 'tat' ? (
        <p className="dh-phu">Máy chủ chưa bật giao bài 7 ngày — bảng này hiện khi app bắt đầu giao bài theo bài thầy tick.</p>
      ) : dong.length === 0 ? (
        <p className="dh-phu">Chưa lớp nào đang có bài giao. Tick bài vừa dạy ở trên: app giao bài đó cho lớp trong 7 ngày.</p>
      ) : (
        <>
          <div className="gvv2-bdg-cuon">
            <table className="gvv2-bdg-bang">
              <thead>
                <tr>
                  <th scope="col">Lớp</th>
                  <th scope="col">Bài</th>
                  <th scope="col">Hạn nộp</th>
                  <th scope="col">Đã gặp câu gốc</th>
                  <th scope="col">Đã tự làm</th>
                </tr>
              </thead>
              <tbody>
                {dong.map((g) => {
                  const ct = chiTiet[g.id]
                  const han = chuHanDong(g.han, homNay)
                  return (
                    <tr key={g.id} data-khoi="dong-giao" data-so-em={ct && ct !== 'loi' ? ct.soEm : undefined}>
                      <td data-nhan="Lớp">
                        <span className="gvv2-bdg-lop">
                          <b>{g.lop || 'Chưa rõ lớp'}</b>
                          {ct && ct !== 'loi' && <small className="gvv2-so">{ct.soEm} em</small>}
                        </span>
                      </td>
                      <td data-nhan="Bài">
                        <span className="gvv2-bdg-bai">{g.ten}</span>
                      </td>
                      <td data-nhan="Hạn nộp">
                        <span className="gvv2-bdg-han" title={han.du}>
                          <span className="gvv2-so">{han.ngan}</span>
                          {han.con && <small>{han.con}</small>}
                        </span>
                      </td>
                      {!ct ? (
                        <td colSpan={2} data-nhan="Tiến độ">
                          <span className="tt-xuong" role="status" aria-label={`Đang tải số liệu ${g.lop}`} style={{ display: 'block', width: '100%', height: 10, borderRadius: 999 }} />
                        </td>
                      ) : ct === 'loi' ? (
                        <td colSpan={2} data-nhan="Tiến độ" className="gvv2-bdg-canh">
                          Chưa tải được số liệu của bài này — bấm Cập nhật.
                        </td>
                      ) : ct.soEm === 0 ? (
                        <td colSpan={2} data-nhan="Tiến độ" className="gvv2-bdg-canh" data-khoi="chua-em-nhan">
                          Chưa em nào nhận bài · kiểm lại danh sách lớp
                        </td>
                      ) : (
                        <>
                          <td data-nhan="Đã gặp câu gốc">
                            <Thanh p={ct.pGap} nhan="Đã gặp câu gốc" loai="gap" />
                          </td>
                          <td data-nhan="Đã tự làm">
                            <Thanh p={ct.pTuLam} nhan="Đã tự làm" loai="tu-lam" />
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {trang.conNua > 0 && <p className="dh-phu">Còn {trang.conNua} bài đang giao khác (bảng hiện {TOI_DA_DONG_GIAO} bài hạn nộp gần nhất).</p>}
          {onMoChuaBai && (
            <button type="button" className="gvv2-nut-chu gvv2-bdg-sang" onClick={onMoChuaBai}>
              Câu nhiều em sai của các bài này nằm ở mục Chữa bài ›
            </button>
          )}
        </>
      )}
      {trang.loai === 'loi' && (
        <button type="button" className="gvv2-nut-vien" onClick={() => setLan((n) => n + 1)}>
          Thử lại
        </button>
      )}
    </div>
  )
}

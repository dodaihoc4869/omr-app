import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Info, Sparkles, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { NHAN_KET_QUA, boDieuChinh, conHieuLuc, layNhatKy, moTaNum, ngayNgan, type DongNhatKy, type KetQuaLenh } from '../lib/bo-nao-thay'
import '../styles/bo-nao-m3.css'

const TEN_CO: Record<string, string> = { tut_nhip: 'Tụt nhịp', qua_tai: 'Quá tải', lam_cho_xong: 'Làm cho xong', nghi_chep: 'Nghi chép — chỉ báo thầy' }
/** NGUYÊN VĂN các lời Bộ não A.I viết (thầy xem được, kèm ngày): [trường, nhãn khi ĐÃ gửi, nhãn khi CHƯA gửi (chạy thử / chưa áp)]. */
const LOI_GUI = [
  ['loiNhanChoEm', 'Lời đã gửi cho em', 'Lời dự kiến cho em (CHƯA gửi — chạy thử)'],
  ['loiNhanChoPhuHuynh', 'Lời đã gửi cho phụ huynh', 'Lời dự kiến cho phụ huynh (CHƯA gửi — chạy thử)'],
  ['thuTuan', 'Thư tuần đã gửi cho phụ huynh', 'Thư tuần dự kiến (CHƯA gửi — chạy thử)'],
] as const
const phanTram = (x: number) => x.toLocaleString('vi-VN', { maximumFractionDigits: 2 })

/** TRẠNG THÁI THẬT của một dòng nhật ký (không nói "đã áp" khi chưa áp). */
function trangThai(d: DongNhatKy): { chu: string; vai: 'tot' | 'bong' | 'xau' | '' } {
  if (d.daBo) return { chu: 'Thầy đã bỏ', vai: '' }
  if (d.tuGo) return { chu: 'Bộ não A.I đã tự gỡ (kết quả chưa tốt)', vai: 'xau' }
  if (d.apDung === true) return { chu: 'Đã áp cho em', vai: 'tot' }
  if (d.cheDo === 'bong') return { chu: 'Chỉ ghi sổ — chạy thử', vai: 'bong' }
  return { chu: `Chỉ ghi sổ — độ tin cậy thấp (${phanTram(d.doTin)})`, vai: 'bong' }
}

/** NHẬT KÝ ĐIỀU CHỈNH của MỘT em trong hồ sơ (bản vẽ docs/ban-ve-bo-nao-2109/2-…jpg): ngày · núm · lý do bằng số · kết quả hôm sau + "Bỏ điều chỉnh này" (chỉ khi còn hiệu lực).
 *  CHỈ thầy thấy. Bộ não TỰ HÀNH (thầy chốt 21/09): bỏ là TUỲ thầy. Nói thật trạng thái từng dòng (đã áp / chỉ ghi sổ / tự gỡ / đã bỏ) và núm bị lõi BTVN bỏ vì không kịp hạn.
 *  Hợp đồng `docs/hop-dong-bo-nao-2109.md`; máy chủ chưa có lệnh ⇒ hiện đúng lý do, không dựng số. */
export default function NhatKyDieuChinh({ sbd }: { sbd: string }) {
  const showToast = useAppStore((s) => s.showToast)
  const [kq, setKq] = useState<KetQuaLenh<DongNhatKy[]> | undefined>(undefined)
  const [nayMs, setNayMs] = useState(() => Date.now())
  const [xacNhan, setXacNhan] = useState<string | null>(null)
  const [dangBo, setDangBo] = useState(false)

  const tai = useCallback(() => {
    let con = true
    setKq(undefined)
    setXacNhan(null)
    void layNhatKy(sbd).then((r) => {
      if (!con) return
      setNayMs(Date.now())
      setKq(r)
    })
    return () => {
      con = false
    }
  }, [sbd])
  useEffect(() => tai(), [tai])

  const bo = async (d: DongNhatKy) => {
    setDangBo(true)
    const r = await boDieuChinh(sbd, d.ngay)
    setDangBo(false)
    if (r.ok && r.du) {
      showToast(`Đã bỏ điều chỉnh ngày ${ngayNgan(d.ngay)}.`)
      tai()
    } else if (r.ok) {
      setXacNhan(null)
      showToast(`Không có điều chỉnh ngày ${ngayNgan(d.ngay)} để bỏ (có thể đã được bỏ hoặc Bộ não A.I đã tự gỡ).`, 'warn')
      tai()
    } else {
      setXacNhan(null)
      showToast(r.chu, 'warn')
    }
  }

  const dau = (chip?: React.ReactNode, phu = 'Chỉ thầy thấy') => (
    <div className="bnao-dau">
      <span className="bnao-huy-hieu" aria-hidden="true">
        <Sparkles size={24} />
      </span>
      <div className="bnao-dau-chu">
        <h3 className="bnao-tieu-de">NHẬT KÝ ĐIỀU CHỈNH · BỘ NÃO A.I</h3>
        <p className="bnao-phu">{phu}</p>
      </div>
      {chip}
    </div>
  )

  if (kq === undefined) {
    return (
      <section className="bnao" data-khoi="nhat-ky-dieu-chinh" aria-busy="true" aria-label="Nhật ký điều chỉnh">
        {dau(undefined, 'Đang tải…')}
      </section>
    )
  }
  if (!kq.ok) {
    return (
      <section className="bnao" data-khoi="nhat-ky-dieu-chinh" aria-label="Nhật ký điều chỉnh">
        {dau(undefined, kq.loai === 'chua_co_lenh' ? 'Máy chủ chưa có nhật ký điều chỉnh' : 'Chưa đọc được nhật ký điều chỉnh')}
        <p className={`bnao-ghi-chu ${kq.loai === 'chua_co_lenh' ? 'bnao-ghi-chu--loi' : 'bnao-ghi-chu--canh'}`} role="status">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>
            <b>{kq.chu}</b> Chưa có số nào để hiện.
          </span>
        </p>
        <div className="bnao-hang-nut">
          <button type="button" className="bnao-nut bnao-nut--vien" onClick={tai}>
            Thử lại
          </button>
        </div>
      </section>
    )
  }

  const ds = kq.du
  if (ds.length === 0) {
    return (
      <section className="bnao" data-khoi="nhat-ky-dieu-chinh" aria-label="Nhật ký điều chỉnh">
        {dau(undefined, 'Chưa có điều chỉnh nào cho em này')}
        <p className="bnao-ghi-chu">
          <Info size={18} aria-hidden="true" />
          <span>Bộ não A.I chưa điều chỉnh gì cho em này (em ổn, chưa có dữ liệu, hoặc Bộ não A.I chưa chạy).</span>
        </p>
      </section>
    )
  }

  const chip =
    ds[0].cheDo === 'bong' ? (
      <span className="bnao-chip bnao-chip--bong">
        <Sparkles size={16} aria-hidden="true" />
        CHẠY THỬ — chưa tác động tới học sinh
      </span>
    ) : undefined

  return (
    <section className="bnao" data-khoi="nhat-ky-dieu-chinh" aria-label="Nhật ký điều chỉnh">
      {dau(chip, `${ds.length} lần gần nhất · chỉ thầy thấy`)}

      <div className="bnao-nk" role="table" aria-label="Điều chỉnh của Bộ não A.I cho em này">
        <div className="bnao-nk-hang bnao-nk-hang--dau" role="row">
          <span role="columnheader">NGÀY</span>
          <span role="columnheader">NÚM BỘ NÃO VẶN</span>
          <span role="columnheader">LÝ DO (BẰNG SỐ)</span>
          <span role="columnheader">KẾT QUẢ HÔM SAU</span>
          <span role="columnheader" />
        </div>
        {ds.map((d) => {
          const num = moTaNum(d)
          const tt = trangThai(d)
          const lyDo = d.dang.map((x) => x.lyDo).filter(Boolean)
          const kqNhan = NHAN_KET_QUA[d.ketQua ?? 'cho']
          const choBo = conHieuLuc(d, nayMs)
          return (
            <div key={d.ngay} className="bnao-nk-hang" role="row" data-ngay={d.ngay}>
              <div className="bnao-nk-o" role="cell">
                <span className="bnao-nk-nhan">NGÀY</span>
                <b>{ngayNgan(d.ngay)}</b>
                <small>{d.daBo || d.tuGo ? 'đã hết hiệu lực' : choBo ? `còn hiệu lực tới ${ngayNgan(d.hetHan)}` : 'đã hết hạn'}</small>
                <span className={`bnao-chip bnao-chip--nho${tt.vai === 'tot' ? ' bnao-chip--tot' : tt.vai === 'bong' ? ' bnao-chip--bong' : tt.vai === 'xau' ? ' bnao-chip--xau' : ''}`}>{tt.chu}</span>
              </div>
              <div className="bnao-nk-o" role="cell">
                <span className="bnao-nk-nhan">NÚM BỘ NÃO VẶN</span>
                {num.chinh && <b>{num.chinh}</b>}
                {num.phu.map((t) => (
                  <span key={t}>{t}</span>
                ))}
                {d.co && d.co !== 'khong' && <small>Cờ: {TEN_CO[d.co] ?? d.co}</small>}
              </div>
              <div className="bnao-nk-o" role="cell">
                <span className="bnao-nk-nhan">LÝ DO (BẰNG SỐ)</span>
                <span>{lyDo.length > 0 ? lyDo.join('; ') : 'Không nêu lý do bằng số.'}</span>
              </div>
              <div className="bnao-nk-o" role="cell">
                <span className="bnao-nk-nhan">KẾT QUẢ HÔM SAU</span>
                <span>
                  <span className={`bnao-chip bnao-chip--nho${kqNhan.vai === 'tot' ? ' bnao-chip--tot' : kqNhan.vai === 'xau' ? ' bnao-chip--xau' : ''}`}>{kqNhan.chu}</span>
                </span>
                {d.ketQuaChu && <small>{d.ketQuaChu}</small>}
              </div>
              <div className="bnao-nk-nut" role="cell">
                {choBo &&
                  (xacNhan === d.ngay ? (
                    <div className="bnao-nut-nhom" role="group" aria-label={`Bỏ điều chỉnh ngày ${ngayNgan(d.ngay)}`}>
                      <span className="bnao-phu">Bỏ điều chỉnh này?</span>
                      <button type="button" className="bnao-nut bnao-nut--bo" disabled={dangBo} onClick={() => void bo(d)}>
                        {dangBo ? 'Đang bỏ…' : 'Bỏ'}
                      </button>
                      <button type="button" className="bnao-nut bnao-nut--vien" disabled={dangBo} onClick={() => setXacNhan(null)}>
                        Giữ
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="bnao-nut bnao-nut--bo" aria-label={`Bỏ điều chỉnh ngày ${ngayNgan(d.ngay)}`} onClick={() => setXacNhan(d.ngay)}>
                      <Trash2 size={18} aria-hidden="true" />
                      Bỏ điều chỉnh này
                    </button>
                  ))}
              </div>
              {(d.loiNhanChoEm || d.loiNhanChoPhuHuynh || d.thuTuan || d.ghiChuHlv || d.goiYChoThay || d.lyDoBo.length > 0) && (
                <div className="bnao-nk-duoi" role="cell">
                  {LOI_GUI.map(([truong, nhanDaGui, nhanChuaGui]) =>
                    d[truong] ? (
                      <blockquote key={truong} className={`bnao-loi${d.apDung === true ? ' bnao-loi--da-gui' : ''}`} data-loi={truong}>
                        <span className="bnao-loi-nhan">
                          {d.apDung === true ? nhanDaGui : nhanChuaGui} · {ngayNgan(d.ngay)}
                        </span>
                        <span className="bnao-loi-chu">{d[truong]}</span>
                      </blockquote>
                    ) : null,
                  )}
                  {(d.ghiChuHlv || d.goiYChoThay || d.lyDoBo.length > 0) && (
                    <div className="bnao-nk-hop">
                      {d.ghiChuHlv && (
                        <div>
                          <b>Bộ não A.I đang thử:</b> {d.ghiChuHlv}
                        </div>
                      )}
                      {d.goiYChoThay && (
                        <div>
                          <b>Gợi ý cho thầy:</b> {d.goiYChoThay.chu}
                        </div>
                      )}
                      {d.lyDoBo.length > 0 && (
                        <div>
                          <b>Núm bị bỏ vì không kịp hạn nộp:</b> {d.lyDoBo.join('; ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="bnao-ghi-chu">
        <Info size={18} aria-hidden="true" />
        <span>
          <b>Bỏ điều chỉnh này</b>: kế hoạch của em về đúng như thuật toán tự chọn; Bộ não A.I ghi nhận thầy đã bỏ. Bỏ là <b>tuỳ thầy</b> — Bộ não A.I đã tự giữ deadline, không đổi hạn nộp và tự gỡ điều chỉnh nếu hôm sau kết quả chưa tốt.
        </span>
      </p>
    </section>
  )
}

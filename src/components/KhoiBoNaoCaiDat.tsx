import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, Info, Sparkles } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { cheDoHieuLuc, datCauHinhBoNao, doiCheDoLop, gioChayCuoi, layCauHinhBoNao, layDemQua, truocDay, type CauHinhBoNao, type CheDoBoNao, type KetQuaLenh } from '../lib/bo-nao-thay'
import '../styles/bo-nao-m3.css'

/** CÀI ĐẶT BỘ NÃO (bản vẽ docs/ban-ve-bo-nao-2109/2-…jpg mục C): công tắc BẬT/TẮT + chế độ Chạy bóng / Thật THEO TỪNG LỚP. Cờ ở máy chủ (`POST /ai/cau-hinh`, hợp đồng
 *  docs/hop-dong-bo-nao-2109.md): thân {} = đọc, có `bat?/cheDo?/lopThat?` = ghi. Chế độ hiệu lực của lớp L = `lopThat.includes(L) ? 'that' : cheDo`.
 *  NÓI THẬT: chưa đọc được cờ / chưa lưu được ⇒ hiện đúng lý do, KHÔNG giả là đã lưu; chỉ cập nhật màn khi máy chủ đã xác nhận. Chuyển sang THẬT (đổi hành vi với học sinh thật) phải xác nhận. */
export default function KhoiBoNaoCaiDat() {
  const classList = useAppStore((s) => s.classList)
  const showToast = useAppStore((s) => s.showToast)
  const [ch, setCh] = useState<KetQuaLenh<CauHinhBoNao> | undefined>(undefined)
  const [lanChay, setLanChay] = useState<string | null>(null)
  const [nayMs, setNayMs] = useState(() => Date.now())
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState('')
  const [xacNhanLop, setXacNhanLop] = useState<string | null>(null)

  const tai = useCallback(() => {
    let con = true
    setCh(undefined)
    setLoi('')
    void layCauHinhBoNao().then((r) => con && setCh(r))
    void layDemQua().then((r) => {
      if (!con) return
      setNayMs(Date.now())
      setLanChay(r.ok ? r.du.chayLanCuoi : null)
    })
    return () => {
      con = false
    }
  }, [])
  useEffect(() => tai(), [tai])

  const cacLop = useMemo(() => {
    const dem = new Map<string, number>()
    for (const h of classList) if (h.lop) dem.set(h.lop, (dem.get(h.lop) ?? 0) + 1)
    return [...dem.entries()].map(([lop, so]) => ({ lop, so })).sort((a, b) => a.lop.localeCompare(b.lop, 'vi', { numeric: true }))
  }, [classList])

  const luu = async (moi: Partial<CauHinhBoNao>, thanhCong: string) => {
    setDangLuu(true)
    setLoi('')
    const r = await datCauHinhBoNao(moi)
    setDangLuu(false)
    setXacNhanLop(null)
    if (r.ok) {
      setCh(r)
      showToast(thanhCong)
    } else {
      setLoi(`Chưa lưu được: ${r.chu}`)
    }
  }

  return (
    <section className="bnao" data-khoi="cai-dat-bo-nao" aria-label="Bộ não A.I">
      <div className="bnao-hang-cai">
        <span className="bnao-huy-hieu" aria-hidden="true">
          <Sparkles size={24} />
        </span>
        <div className="bnao-dau-chu">
          <h2 className="bnao-tieu-de bnao-tieu-de--to">Bộ não A.I</h2>
          <p className="bnao-phu">
            Mỗi đêm đọc số liệu học của từng em rồi tự điều chỉnh nhịp/dạng và viết báo cáo cho thầy. Chạy trên máy thầy; thầy không phải làm gì — chỉ đọc báo cáo và tắt ở đây khi cần.
          </p>
        </div>
        {ch?.ok && (
          <button
            type="button"
            role="switch"
            aria-checked={ch.du.bat}
            aria-label="Bật bộ não"
            className="bnao-cong-tac"
            data-bat={ch.du.bat ? 'co' : 'khong'}
            disabled={dangLuu}
            onClick={() => void luu({ bat: !ch.du.bat }, ch.du.bat ? 'Đã tắt bộ não.' : 'Đã bật bộ não.')}
          >
            <span className="bnao-cong-tac-nut" />
          </button>
        )}
      </div>

      {ch === undefined && <p className="bnao-phu">Đang đọc cài đặt…</p>}

      {ch && !ch.ok && (
        <>
          <p className={`bnao-ghi-chu ${ch.loai === 'chua_co_lenh' ? 'bnao-ghi-chu--loi' : 'bnao-ghi-chu--canh'}`} role="status">
            <AlertTriangle size={18} aria-hidden="true" />
            <span>
              <b>{ch.chu}</b> Chưa lưu được công tắc — học sinh vẫn học bình thường.
            </span>
          </p>
          <div className="bnao-hang-nut">
            <button type="button" className="bnao-nut bnao-nut--vien" onClick={tai}>
              Thử lại
            </button>
          </div>
        </>
      )}

      {ch?.ok && (
        <>
          <div className="bnao-hang-nut">
            <span className={`bnao-chip ${lanChay ? 'bnao-chip--tot' : ''}`}>{lanChay ? `Đã chạy ${gioChayCuoi(lanChay, nayMs)} · ${truocDay(lanChay, nayMs)}` : 'Chưa chạy lần nào'}</span>
          </div>

          <div>
            <h3 className="bnao-tieu-de">CHẾ ĐỘ THEO LỚP</h3>
            {cacLop.length === 0 && <p className="bnao-phu">Chưa có danh sách lớp trên máy này.</p>}
            {cacLop.map(({ lop, so }) => {
              const che = cheDoHieuLuc(ch.du, lop)
              const chon = (moi: CheDoBoNao) => {
                if (moi === che || dangLuu) return
                if (moi === 'that') return setXacNhanLop(lop)
                void luu(doiCheDoLop(ch.du, cacLop.map((x) => x.lop), lop, 'bong'), `Lớp ${lop} về chạy thử.`)
              }
              return (
                <div key={lop} className="bnao-lop" data-lop={lop}>
                  <span className="bnao-lop-ten">
                    <b>{lop}</b> <small>· {so} em</small>
                  </span>
                  <div role="radiogroup" aria-label={`Chế độ lớp ${lop}`} className="bnao-seg">
                    {(
                      [
                        ['bong', 'Chạy thử'],
                        ['that', 'Thật'],
                      ] as const
                    ).map(([v, ten]) => (
                      <button key={v} type="button" role="radio" aria-checked={che === v} disabled={dangLuu || !ch.du.bat} onClick={() => chon(v)}>
                        {che === v && <Check size={16} aria-hidden="true" />}
                        {ten}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {xacNhanLop && (
            <div className="bnao-xac-nhan" role="alertdialog" aria-label={`Chuyển lớp ${xacNhanLop} sang chế độ thật`}>
              <b>Chuyển lớp {xacNhanLop} sang chạy THẬT?</b>
              <span>
                “Thật” cho phép điều chỉnh của bộ não tác động tới học sinh lớp này (nhịp, dạng ưu tiên, câu khắc phục) và học sinh thấy lời nhắn của Bộ não A.I. Không đổi hạn nộp. Nếu máy chủ chưa bật phần áp dụng thì mới chỉ ghi nhận — màn Hôm nay sẽ nói rõ điều chỉnh nào đã được áp. Thầy quay lại “Chạy thử” được bất cứ lúc nào.
              </span>
              <div className="bnao-hang-nut">
                <button
                  type="button"
                  className="bnao-nut bnao-nut--chinh"
                  disabled={dangLuu}
                  onClick={() => void luu(doiCheDoLop(ch.du, cacLop.map((x) => x.lop), xacNhanLop, 'that'), `Lớp ${xacNhanLop} chạy thật.`)}
                >
                  {dangLuu ? 'Đang lưu…' : 'Chuyển sang Thật'}
                </button>
                <button type="button" className="bnao-nut bnao-nut--vien" disabled={dangLuu} onClick={() => setXacNhanLop(null)}>
                  Giữ chạy thử
                </button>
              </div>
            </div>
          )}

          <p className="bnao-ghi-chu bnao-ghi-chu--canh">
            <Info size={18} aria-hidden="true" />
            <span>
              <b>Chạy thử</b>: bộ não vẫn đọc và viết điều chỉnh, nhưng <b>không tầng nào đọc</b> — kế hoạch ngày và bài tập của học sinh không đổi một byte. <b>Thật</b>: điều chỉnh đạt kiểm khuôn được phép áp cho em (khi máy chủ đã bật phần áp dụng); chuyển sẽ hỏi xác nhận.
            </span>
          </p>
          {!ch.du.bat && (
            <p className="bnao-ghi-chu">
              <Info size={18} aria-hidden="true" />
              <span>Bộ não đang <b>tắt</b>: không viết báo cáo và không điều chỉnh gì.</span>
            </p>
          )}
        </>
      )}

      {loi && (
        <p className="bnao-ghi-chu bnao-ghi-chu--loi" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>{loi}</span>
        </p>
      )}
    </section>
  )
}

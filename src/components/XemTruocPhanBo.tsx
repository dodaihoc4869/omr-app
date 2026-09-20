import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { CauGiao } from '../lib/btvn-nang-do'
import { EM_MOI_LUOT, TEN_MUC, nhanCuaCau, xemTruocPhanBo, type ChiTietEmXemTruoc, type DauVaoXemTruoc, type EmXemTruoc } from '../lib/btvn-nang-do-thay'
import '../screens/btvn-nang-do-m3.css'

/** XEM TRƯỚC PHÂN BỔ (bản vẽ docs/ban-ve-btvn-nang-do-2109/2-xem-truoc-phan-bo.jpg, thầy duyệt 21/09): tấm phủ toàn màn — bảng từng em (tổng · lõi/riêng · bậc Biết/Hiểu/Vận dụng · số
 *  chặng), bấm một em ⇒ danh sách câu theo chặng kèm nhãn lý do. Số liệu do MÁY CHỦ tính (`/btvn/xem-truoc`, hợp đồng docs/hop-dong-btvn-nang-do-2109.md mục 5: chỉ đọc, ≤ 50 em mỗi lượt,
 *  danh sách câu chỉ cho MỘT em); chưa có lệnh ⇒ nói thật, không bịa số. Chỉ SỐ ĐẾM, KHÔNG xếp hạng em với em (thứ tự đúng như danh sách người nhận). Bộ thật của em chốt khi em mở bài lần đầu. */
export default function XemTruocPhanBo({
  dau,
  dsSbd,
  cau,
  dangGiao,
  loiGiao,
  onDong,
  onGiao,
}: {
  dau: Omit<DauVaoXemTruoc, 'dsSbd' | 'sbdChiTiet'>
  /** Người nhận bài, đúng thứ tự màn Giao đang có. */
  dsSbd: string[]
  cau: CauGiao[]
  dangGiao: boolean
  /** Lỗi của lần bấm Giao ngay trong tấm phủ (màn bên dưới bị che nên phải hiện ở đây). */
  loiGiao?: string
  onDong: () => void
  onGiao: () => void
}) {
  const [ds, setDs] = useState<EmXemTruoc[]>([])
  const [soCauBai, setSoCauBai] = useState(0)
  const [soLoi, setSoLoi] = useState(0)
  const [loi, setLoi] = useState('')
  const [dangTai, setDangTai] = useState(dsSbd.length > 0)
  const [daLay, setDaLay] = useState(0)
  const [chon, setChon] = useState(dsSbd[0] ?? '')
  const [chiTiet, setChiTiet] = useState<Record<string, ChiTietEmXemTruoc>>({})
  const [dangTaiCT, setDangTaiCT] = useState(false)
  const nutDong = useRef<HTMLButtonElement>(null)
  const daiDien = useRef({ dau, dsSbd })
  const viTri = useMemo(() => new Map(cau.map((c, i) => [c.qid, { c, so: i + 1 }])), [cau])

  /** Tải một lượt em (≤ 50); `sbdChiTiet` xin luôn danh sách câu của một em trong lượt ấy. */
  const tai = async (tu: number, sbdChiTiet?: string) => {
    const { dau: d, dsSbd: tatCa } = daiDien.current
    const lat = tatCa.slice(tu, tu + EM_MOI_LUOT)
    if (lat.length === 0) return
    setDangTai(true)
    setLoi('')
    try {
      const r = await xemTruocPhanBo({ ...d, dsSbd: lat, sbdChiTiet })
      setDs((truoc) => (tu > 0 ? [...truoc, ...r.ds] : r.ds))
      setSoCauBai(r.soCauBai)
      setSoLoi(r.soLoi)
      setDaLay(tu + lat.length)
      if (r.chiTiet) setChiTiet((c) => ({ ...c, [r.chiTiet!.sbd]: r.chiTiet! }))
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa xem trước được.')
    } finally {
      setDangTai(false)
    }
  }
  useEffect(() => {
    void tai(0, daiDien.current.dsSbd[0])
    const truoc = document.activeElement as HTMLElement | null
    nutDong.current?.focus()
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onDong()
      }
    }
    window.addEventListener('keydown', phim, true)
    return () => {
      window.removeEventListener('keydown', phim, true)
      truoc?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chonEm = async (sbd: string) => {
    setChon(sbd)
    if (chiTiet[sbd]) return
    setDangTaiCT(true)
    setLoi('')
    try {
      const r = await xemTruocPhanBo({ ...daiDien.current.dau, dsSbd: [sbd], sbdChiTiet: sbd })
      if (r.chiTiet) setChiTiet((c) => ({ ...c, [sbd]: r.chiTiet! }))
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa xem được danh sách câu của em.')
    } finally {
      setDangTaiCT(false)
    }
  }

  const em = ds.find((x) => x.sbd === chon)
  const ct = chiTiet[chon]
  const moTaCau = (qid: string) => {
    const v = viTri.get(qid)
    return v ? `Câu ${v.so} · ${v.c.chuyenDe || (v.c.dang ?? 'chưa gắn dạng')} · ${TEN_MUC[v.c.mucDo]} · phần ${v.c.phan}` : qid
  }

  return (
    <div className="bn-tam-phu" role="dialog" aria-modal="true" aria-label="Xem trước phân bổ">
      <div className="bn-tp-dau">
        <div>
          <h2 className="bn-tp-tieu-de">Xem trước phân bổ</h2>
          <p className="bn-tp-phu-de">Từng em nhận bao nhiêu câu, ở bậc nào, chia mấy chặng — trước khi giao.</p>
        </div>
        <div className="bn-tp-nut">
          <button ref={nutDong} type="button" className="bn-nut bn-nut--vien" onClick={onDong}>
            <X size={18} aria-hidden="true" />
            Đóng xem trước
          </button>
          <button type="button" className="bn-nut bn-nut--chinh" disabled={dangGiao} onClick={onGiao}>
            {dangGiao ? 'Đang giao bài…' : dsSbd.length > 0 ? `Giao bài cho ${dsSbd.length} em` : 'Giao bài'}
          </button>
        </div>
      </div>

      <div className="bn-tp-chips">
        <span className="bn-chip bn-chip--chinh">
          {dau.dsMaDe.length} tờ đề · {soCauBai || cau.length} câu
        </span>
        {ds.length > 0 && <span className="bn-chip bn-chip--tot">Lõi chung {soLoi} câu</span>}
        <span className="bn-chip bn-chip--trung">{dsSbd.length} em</span>
        <span className="bn-chip bn-chip--canh">Xem trước — chưa ghi gì</span>
      </div>

      {loiGiao && (
        <p className="bn-tp-loi" role="alert">
          {loiGiao}
        </p>
      )}
      {dsSbd.length === 0 && <p className="bn-tp-trang">Chưa có học sinh nào để xem trước — chọn ca, lớp hoặc học sinh nhận bài trước.</p>}
      {dangTai && ds.length === 0 && dsSbd.length > 0 && !loi && <p className="bn-tp-trang">Đang tính phân bổ…</p>}
      {loi && (
        <p className="bn-tp-loi" role="alert">
          {loi}
        </p>
      )}

      {ds.length > 0 && (
        <div className="bn-tp-luoi">
          <section className="bn-tp-bang" aria-label="Bảng phân bổ từng em">
            <div className="bn-tp-hang bn-tp-hang--dau" aria-hidden="true">
              <span>HỌC SINH</span>
              <span>TỔNG</span>
              <span>LÕI / RIÊNG</span>
              <span>BẬC</span>
              <span>CHẶNG</span>
            </div>
            {ds.map((x) => {
              const t = x.tomTat
              return (
                <button key={x.sbd} type="button" className={`bn-tp-hang${x.sbd === chon ? ' bn-tp-hang--chon' : ''}`} aria-pressed={x.sbd === chon} onClick={() => void chonEm(x.sbd)}>
                  <span className="bn-tp-ten">
                    <b>{x.hoTen || `SBD ${x.sbd}`}</b>
                    <small>{x.sbd}</small>
                    {!x.coHoSo && <em className="bn-chip bn-chip--trung bn-chip--nho">chưa có hồ sơ</em>}
                    {x.coHoSo && t.soDangYeu > 0 && <em className="bn-chip bn-chip--loi bn-chip--nho">đang yếu {t.soDangYeu} dạng</em>}
                    {x.daChot && <em className="bn-chip bn-chip--tot bn-chip--nho">đã chốt</em>}
                  </span>
                  <span className="bn-tp-tong">{t.tong}</span>
                  <span className="bn-tp-thanh">
                    <i className="bn-tp-thanh-nen" aria-hidden="true">
                      <i style={{ width: `${(t.soLoi / Math.max(1, t.tong)) * 100}%` }} className="bn-tp-doan bn-tp-doan--loi" />
                      <i style={{ width: `${((t.soRieng + t.soThuThach) / Math.max(1, t.tong)) * 100}%` }} className="bn-tp-doan bn-tp-doan--rieng" />
                    </i>
                    <small>
                      {t.soLoi} lõi · {t.soRieng + t.soThuThach} riêng
                    </small>
                  </span>
                  <span className="bn-tp-bac">
                    {(
                      [
                        ['Biết', t.soBiet],
                        ['Hiểu', t.soHieu],
                        ['Vận dụng', t.soVanDung],
                      ] as const
                    ).map(([ten, so]) => (
                      <span key={ten} className="bn-tp-bac-o">
                        <b>{so}</b>
                        <small>{ten}</small>
                      </span>
                    ))}
                  </span>
                  <span className="bn-tp-chang">
                    <b>{t.soChang}</b>
                    <small>chặng</small>
                  </span>
                </button>
              )
            })}
            {daLay < dsSbd.length && (
              <button type="button" className="bn-nut bn-nut--vien bn-tp-them" disabled={dangTai} onClick={() => void tai(daLay)}>
                {dangTai ? 'Đang tải…' : `Xem thêm em (${dsSbd.length - daLay} em nữa)`}
              </button>
            )}
            <p className="bn-phu">
              Số liệu tính theo hồ sơ hôm nay; <b>bộ thật của em chốt khi em mở bài lần đầu</b>. Bảng xem {EM_MOI_LUOT} em mỗi lượt. Không hiện thứ hạng giữa các em.
            </p>
          </section>

          {em && (
            <section className="bn-tp-chi-tiet" aria-label={`Danh sách câu của ${em.hoTen || em.sbd}`}>
              <h3 className="bn-tp-em-ten">
                {em.hoTen || `SBD ${em.sbd}`} <small>· {em.sbd}</small>
              </h3>
              <p className="bn-phu">
                {em.tomTat.tong} câu · {em.tomTat.soChang} chặng · lõi {em.tomTat.soLoi} + riêng {em.tomTat.soRieng} · thử thách {em.tomTat.soThuThach}
              </p>
              {!ct && dangTaiCT && <p className="bn-phu">Đang tải danh sách câu…</p>}
              {ct?.chang.map((qids, i) => (
                <div key={i} className="bn-tp-chang-khoi">
                  <h4 className="bn-tp-chang-ten">
                    Chặng {i + 1} <small>· {qids.length} câu</small>
                  </h4>
                  {qids.map((qid) => {
                    const nh = nhanCuaCau(ct.nhan[qid])
                    return (
                      <div key={qid} className="bn-tp-cau">
                        <div className="bn-tp-cau-chu">
                          <span>{moTaCau(qid)}</span>
                          {nh.ly && <small>{nh.ly}</small>}
                        </div>
                        <span className={`bn-chip bn-chip--nhan-${nh.loai} bn-chip--nho`}>{nh.chu}</span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  )
}

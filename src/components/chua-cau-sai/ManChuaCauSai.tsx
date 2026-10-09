// Một việc mỗi màn; receipt bất biến, phản hồi do em chủ động đọc và tiếp tục.
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  apiMoDot,
  apiPhatItem,
  apiNopItem,
  apiXinGoiY,
  type KetQuaDot,
  type KetQuaNop,
  type ItemCongKhai,
} from '../../lib/chua-cau-sai-api'
import { ChemText } from '../../lib/chem-format'
import OSoTraLoi from '../OSoTraLoi'
import { sinhMaNgauNhien } from '../../lib/thiet-bi'
import { khopPhanIII } from '../../lib/cham-so'
import TheCau from '../TheCau'
import { BangSoLieu, ZoomableImage } from '../QuestionMedia'
import '../tu-luyen/tu-luyen.css'
import './chua-cau-sai.css'
export interface PropsChuaCauSai {
  token: string
  qid: string
  tenCau?: string
  onVe: () => void
}
const tenPha: Record<string, string> = {
  chan_doan: 'Tìm chỗ vướng',
  phan_biet: 'Hiểu cách làm',
  kiem_ly_do: 'Vì sao cách này đúng?',
  kiem_lai: 'Tự làm',
  chuyen_giao: 'Thử điều vừa hiểu với bài mới',
  ghep_bai: 'Nối lại cả bài',
  kiem_chung: 'Lần gặp lại 2 · Tự làm bản mới',
}
function Nhap({
  item,
  value,
  onChange,
  khoa,
}: {
  item: ItemCongKhai
  value: string
  onChange: (v: string) => void
  khoa: boolean
}) {
  const chung = {
    cheDo: 'thi' as const,
    stt: 1,
    text: item.hoi,
    table: item.bang,
    hinhAnh: item.hinhAnh,
  }
  if (item.kieu === 'ds' && item.y?.length === 4)
    return (
      <div className="m3">
        <TheCau
          {...chung}
          phan="II"
          ideas={item.y as [string, string, string, string]}
          selected={Array.from({ length: 4 }, (_, i) =>
            value[i] === 'D' ? 'D' : value[i] === 'S' ? 'S' : null,
          )}
          onSelect={
            khoa
              ? undefined
              : (i, v) => {
                  const a = value.padEnd(4, '-').split('')
                  a[i] = v
                  onChange(a.join(''))
                }
          }
        />
      </div>
    )
  if (
    item.kieu === 'chon' &&
    item.luaChon?.length === 4 &&
    item.luaChon.every((x, i) => x.ky === 'ABCD'[i])
  )
    return (
      <div className="m3">
        <TheCau
          {...chung}
          phan="I"
          choices={
            item.luaChon.map((x) => x.noi) as [string, string, string, string]
          }
          choicePerm={[0, 1, 2, 3]}
          selected={value ? (value as 'A' | 'B' | 'C' | 'D') : null}
          onSelect={khoa ? undefined : onChange}
        />
      </div>
    )
  return (
    <div className="ccs-hoi">
      <div className="ccs-hoi-text">
        <ChemText text={item.hoi} />
      </div>
      {item.bang && <BangSoLieu table={item.bang} />}
      {item.hinhAnh?.map((h, i) => (
        <ZoomableImage key={i} src={h.src} alt={h.alt ?? 'Hình câu hỏi'} />
      ))}
      {item.kieu === 'so' ? (
        <div className="ccs-nhap-so">
          <OSoTraLoi
            value={value}
            onChange={onChange}
            disabled={khoa}
            ariaLabel="Câu trả lời của em"
            inputClassName="ccs-input"
          />
          {item.donVi && <ChemText text={item.donVi} />}
        </div>
      ) : (
        <fieldset className="ccs-nhom-chon" disabled={khoa}>
          <legend className="sr-only">Chọn câu trả lời</legend>
          {(item.kieu === 'ds'
            ? [
                { ky: 'D', noi: 'Đúng' },
                { ky: 'S', noi: 'Sai' },
              ]
            : (item.luaChon ?? [])
          ).map((l) => (
            <label
              className="ccs-chon-muc"
              data-chon={value === l.ky ? 'true' : 'false'}
              key={l.ky}
            >
              <input
                type="radio"
                name={item.id}
                value={l.ky}
                checked={value === l.ky}
                onChange={() => onChange(l.ky)}
              />
              <span className="ccs-chon-ky">{l.ky}</span>
              <ChemText text={l.noi} />
            </label>
          ))}
        </fieldset>
      )}
    </div>
  )
}
function DeGoc({ c }: { c: NonNullable<KetQuaDot['cauGoc']> }) {
  return (
    <>
      <ChemText text={c.text} />
      {c.thanCauImg && <ZoomableImage src={c.thanCauImg} alt="Ảnh đề gốc" />}
      {c.table && <BangSoLieu table={c.table} />}{' '}
      {c.imageDataUrl && (
        <ZoomableImage src={c.imageDataUrl} alt="Hình trong đề gốc" />
      )}
      {c.choices?.map((x, i) => (
        <p key={`c${i}`}>
          <strong>{'ABCD'[i]}. </strong>
          <ChemText text={x} />
          {c.choiceImgs?.[i] && (
            <ZoomableImage
              src={c.choiceImgs[i]!}
              alt={`Phương án ${'ABCD'[i]}`}
            />
          )}
        </p>
      ))}
      {c.ideas?.map((x, i) => (
        <p key={`y${i}`}>
          <strong>{'abcd'[i]}) </strong>
          <ChemText text={x} />
          {c.ideaImgs?.[i] && (
            <ZoomableImage src={c.ideaImgs[i]!} alt={`Ý ${'abcd'[i]}`} />
          )}
        </p>
      ))}
      {c.hinhAnh?.map((h, i) => (
        <ZoomableImage key={i} src={h.src} alt={h.alt ?? 'Hình câu gốc'} />
      ))}
    </>
  )
}
type LanNop = { attemptId: string; traLoi: string; itemId: string }
const khoaNop = (id: string) => `chua-nop:${id}`
function docNop(id: string): LanNop | null {
  try {
    return JSON.parse(localStorage.getItem(khoaNop(id)) ?? 'null')
  } catch {
    return null
  }
}
export default function ManChuaCauSai({
  token,
  qid,
  tenCau,
  onVe,
}: PropsChuaCauSai) {
  const [ph, setPh] = useState<KetQuaDot | null>(null),
    [tai, setTai] = useState(true),
    [loi, setLoi] = useState(''),
    [tra, setTra] = useState(''),
    [hoi, setHoi] = useState<KetQuaNop | null>(null),
    [goi, setGoi] = useState(''),
    [ban, setBan] = useState(false),
    [cho, setCho] = useState<LanNop | null>(null),
    [lanTai, setLanTai] = useState(0)
  const mucGoi = useRef(0)
  const song = useRef(true),
    buocRef = useRef<HTMLHeadingElement>(null),
    goiRef = useRef(0)
  useEffect(() => {
    song.current = true
    return () => {
      song.current = false
    }
  }, [])
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !ban) onVe()
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [onVe, ban])
  const ap = useCallback((r: KetQuaDot) => {
    setPh(r)
    setHoi(r.phanHoiTruoc ?? null)
    setGoi('')
    mucGoi.current = r.item?.mucHoTro ?? 0
    setLoi('')
    const c = r.item && !r.phanHoiTruoc ? docNop(r.item.id) : null
    if (r.item && r.phanHoiTruoc) {
      try {
        localStorage.removeItem(khoaNop(r.item.id))
      } catch {}
    }
    setCho(c)
    setTra(r.traLoiDaNop ?? c?.traLoi ?? '')
  }, [])
  useEffect(() => {
    let huy = false
    const n = ++goiRef.current
    ;(async () => {
      const r = await apiMoDot(token, qid)
      if (huy || n !== goiRef.current) return
      if (!r.ok || !r.dotId) {
        setLoi(r.loi ?? 'Chưa mở được câu chữa.')
        setTai(false)
        return
      }
      const sau = await apiPhatItem(token, r.dotId)
      if (huy || n !== goiRef.current) return
      if (sau.ok) ap(sau)
      else setLoi(sau.loi ?? 'Chưa tải được câu chữa.')
      setTai(false)
    })()
    return () => {
      huy = true
    }
  }, [token, qid, ap, lanTai])
  const tiep = async (tiepDoan = false) => {
    if (!ph?.dotId || ban) return
    setBan(true)
    const r = await apiPhatItem(token, ph.dotId, true, tiepDoan)
    if (!song.current) return
    setBan(false)
    if (r.ok) {
      ap(r)
      requestAnimationFrame(() => buocRef.current?.focus())
    } else setLoi(r.loi ?? 'Chưa tải được bước tiếp.')
  }
  const nop = async () => {
    if (!ph?.item || !ph.dotId || ban || hoi) return
    const payload = cho ?? {
      attemptId: sinhMaNgauNhien(),
      traLoi: tra.trim(),
      itemId: ph.item.id,
    }
    if (
      !payload.traLoi ||
      (payload.traLoi.includes('-') && ph.item.kieu === 'ds')
    )
      return
    setCho(payload)
    try {
      localStorage.setItem(khoaNop(payload.itemId), JSON.stringify(payload))
    } catch {
      /* giữ trong bộ nhớ nếu trình duyệt không cho ghi */
    }
    setBan(true)
    setLoi('')
    const r = await apiNopItem(
      token,
      ph.dotId,
      payload.itemId,
      payload.traLoi,
      payload.attemptId,
    )
    if (!song.current) return
    setBan(false)
    if (!r.ok) {
      if (r.ma === 'CAU_TRA_LOI_CHUA_HOP_LE') {
        setCho(null)
        try {
          localStorage.removeItem(khoaNop(payload.itemId))
        } catch {}
      }
      setLoi(r.loi ?? 'Chưa lưu được. Em thử gửi lại đúng câu trả lời này.')
      return
    }
    try {
      localStorage.removeItem(khoaNop(payload.itemId))
    } catch {}
    setCho(null)
    setHoi(r)
  }
  const xin = async () => {
    if (!ph?.item || !ph.dotId || ban || hoi || cho) return
    setBan(true)
    const r = await apiXinGoiY(
      token,
      ph.dotId,
      ph.item.id,
      Math.min(3, mucGoi.current + 1),
    )
    if (!song.current) return
    setBan(false)
    if (r.ok) {
      setGoi(r.noiDungGoiY ?? '')
      mucGoi.current = r.mucHoTro ?? mucGoi.current
    } else setLoi(r.loi ?? 'Chưa mở được gợi ý.')
  }
  const tt = ph?.trangThai,
    phanHoi = hoi ?? ph?.phanHoiTruoc,
    soBuoc = ph?.tienDoChiTiet?.length ?? ph?.tienDo?.soBuocCanKiem ?? 0,
    soBuocDaQua = ph?.tienDoChiTiet?.filter(
      (x) => x.trangThai === 'co_bang_chung_hieu_trong_phien',
    ).length ?? ph?.tienDo?.soBuocDaQua ?? 0
  const nhanCho =
    tt === 'cho_gap_lai_2'
      ? 'Em đã ghép lại được cả bài'
      : tt === 'da_tu_sua'
        ? 'Em đã tự làm được bản mới'
        : tt === 'can_thay'
          ? 'Cùng thầy gỡ chỗ còn vướng'
          : tt === 'thieu_hoc_lieu'
            ? 'Cần thêm bài luyện đúng chỗ'
            : tt === 'tam_khoa'
              ? 'Tiến độ đang được giữ'
              : tt === 'cau_thay_doi'
                ? 'Câu đã được cập nhật'
                : ''
  const dong = !ph?.item || !!nhanCho
  return (
    <div className="tlu ccs" aria-label="Chữa câu sai">
      <header className="ccs-dau">
        <button
          className="ccs-ve"
          type="button"
          onClick={onVe}
          disabled={ban}
          aria-label="Quay lại"
        >
          ←
        </button>
        <div className="ccs-dau-giua">
          <h1 className="ccs-tieu">{tenCau ?? 'Cùng gỡ câu này'}</h1>
          <span className="ccs-nhan-trang-thai">
            Hiểu chỗ vướng · Tự sửa · Thử bản mới
          </span>
        </div>
        {soBuoc > 0 && (
          <div
            className="ccs-dau-tien-do"
            aria-label={`Đã hiểu ${soBuocDaQua} trong ${soBuoc} bước`}
          >
            <strong>{soBuocDaQua}/{soBuoc}</strong>
            <span>bước đã hiểu</span>
          </div>
        )}
      </header>
      <main className="ccs-than">
        {tai ? (
          <div className="ccs-dang-tai" role="status">
            <span className="ccs-dang-tai-vong" aria-hidden="true" />
            <strong>Đang tìm đúng chỗ em cần gỡ</strong>
          </div>
        ) : (
          <div className="ccs-bo-cuc">
            <aside className="ccs-cot-phu" aria-label="Tiến độ và đề gốc">
              <section className="ccs-the-tien-do">
                <div className="ccs-the-tien-do-dau">
                  <span>Đường tự gỡ</span>
                  {soBuoc > 0 && <strong>{soBuocDaQua}/{soBuoc}</strong>}
                </div>
                {ph?.tienDoChiTiet && ph.tienDoChiTiet.length > 0 ? (
                  <ol className="ccs-lo-trinh" aria-label="Những bước đã kiểm">
                    {ph.tienDoChiTiet.map((x, i) => (
                      <li
                        key={x.buocId}
                        data-da={x.trangThai === 'co_bang_chung_hieu_trong_phien'}
                        data-hien-tai={
                          x.trangThai !== 'co_bang_chung_hieu_trong_phien' &&
                          i === soBuocDaQua
                        }
                      >
                        <span aria-hidden="true">
                          {x.trangThai === 'co_bang_chung_hieu_trong_phien'
                            ? '✓'
                            : i + 1}
                        </span>
                        <b>{x.tieuDe}</b>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="ccs-the-tien-do-trong">
                    Tiến độ sẽ hiện khi bắt đầu.
                  </p>
                )}
              </section>
              {ph?.cauGoc && (
                <details className="ccs-cau-goc">
                  <summary>
                    <span>Xem lại đề gốc</span>
                    <span aria-hidden="true">＋</span>
                  </summary>
                  <div className="ccs-cau-goc-noi">
                    <DeGoc c={ph.cauGoc} />
                  </div>
                </details>
              )}
            </aside>
            <section className="ccs-khu-lam" aria-label="Bước đang luyện">
              {ph?.loiThay && (
                <aside className="ccs-goi-y">
                  <strong>Thầy cùng em gỡ</strong>
                  <ChemText text={ph.loiThay} />
                </aside>
              )}
              {ph?.canNghi ? (
                <section className="ccs-trang-thai">
                  <h2 ref={buocRef} tabIndex={-1}>
                    Mình nghỉ một chút nhé
                  </h2>
                  <p>
                    Những bước em đã hiểu đã được lưu. Em chọn tiếp một đoạn
                    ngắn hoặc quay lại sau.
                  </p>
                  <button
                    className="ccs-nut-chinh"
                    onClick={() => void tiep(true)}
                    disabled={ban}
                  >
                    Em muốn tiếp thêm một đoạn
                  </button>
                </section>
              ) : dong ? (
                <section className="ccs-trang-thai">
                  <h2 ref={buocRef} tabIndex={-1}>
                    {nhanCho || 'Chữa câu sai'}
                  </h2>
                  {tt === 'cho_gap_lai_2' && (
                    <>
                    <p>
                      Hôm nay em đã sửa từng bước và ghép lại cả bài. Lần sau,
                      em sẽ tự thử một bản mới.
                    </p>
                    <p>
                      Hẹn em:{' '}
                      {ph?.denHan
                        ? new Date(ph.denHan).toLocaleString('vi-VN')
                        : 'sau ít nhất 24 giờ'}
                      .
                    </p>
                    <button
                      className="ccs-nut-phu"
                      onClick={() => void tiep()}
                      disabled={ban}
                    >
                      Kiểm tra đã đến giờ chưa
                    </button>
                    </>
                  )}
                  {tt === 'da_tu_sua' && (
                    <p>
                      Em vừa giải bản mới mà không cần gợi ý. Lịch ôn chung sẽ
                      kiểm tra tiếp ở những ngày khác để xác nhận đã khắc phục
                      bền vững.
                    </p>
                  )}
                  {tt === 'can_thay' && (
                    <p role="status">
                      Bước còn mắc đã được xếp vào buổi chữa trên lớp, kèm các
                      bước em đã hiểu. Em không cần gửi riêng cho thầy. Sau buổi
                      chữa, mở lại câu này để tự kiểm bước vừa gỡ.
                    </p>
                  )}
                  {['thieu_hoc_lieu', 'cau_thay_doi'].includes(tt ?? '') && (
                    <p>
                      Các bước em đã làm được vẫn được giữ. Hệ thống đang chờ
                      học liệu mới đã được kiểm; em có thể tiếp tục chữa câu
                      khác.
                    </p>
                  )}
                  {tt === 'tam_khoa' && (
                    <p>
                      Câu hiện chưa được phép luyện. Em có thể quay lại sau;
                      tiến độ vẫn được lưu.
                    </p>
                  )}
                </section>
              ) : (
                ph?.item && (
                  <div className="ccs-bai-lam">
                    <div className="ccs-bai-lam-dau">
                      <p className="ccs-ghi">
                        {ph.item.loai === 'kiem_chung'
                          ? `Lần gặp lại ${ph.lanGapLai ?? 2} · Tự làm bản mới`
                          : (tenPha[ph.item.loai] ?? 'Cùng sửa một bước')}
                      </p>
                      <h2
                        className="ccs-buoc-text"
                        tabIndex={-1}
                        ref={buocRef}
                      >
                        {ph.item.tieuDe}
                      </h2>
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        void nop()
                      }}
                    >
                    <Nhap
                      item={ph.item}
                      value={tra}
                      onChange={setTra}
                      khoa={ban || !!phanHoi || !!cho}
                    />
                    {goi && (
                      <aside className="ccs-goi-y" role="status">
                        <strong>Một gợi mở</strong>
                        <ChemText text={goi} />
                      </aside>
                    )}
                    {phanHoi && (
                      <section
                        className="ccs-phan-hoi"
                        data-dung={phanHoi.dung}
                        role="status"
                        aria-live="polite"
                      >
                        <h3>
                          {phanHoi.dung
                            ? 'Bước này em làm được rồi'
                            : 'Ta đã thấy chỗ cần gỡ'}
                        </h3>
                        {[
                          phanHoi.phanGiuDuoc,
                          phanHoi.giaThiet,
                          phanHoi.diemlech,
                          phanHoi.hanhDongTiep,
                        ]
                          .filter(Boolean)
                          .map((t, i) => (
                            <p key={i}>
                              <ChemText text={t!} />
                            </p>
                          ))}
                        {phanHoi.dieuCanHieu && (
                          <details>
                            <summary>Hiểu bước này trong bài</summary>
                            {phanHoi.dieuCanHieu &&
                              Object.values(phanHoi.dieuCanHieu).map((t, i) => (
                                <p key={i}>
                                  <ChemText text={t} />
                                </p>
                              ))}
                          </details>
                        )}
                      </section>
                    )}
                    <div className="ccs-hang-nut">
                      {phanHoi ? (
                        <button
                          type="button"
                          className="ccs-nut-chinh"
                          disabled={ban}
                          onClick={() => void tiep()}
                        >
                          Em sẵn sàng · Tiếp tục
                        </button>
                      ) : (
                        <>
                          <button
                            type="submit"
                            className="ccs-nut-chinh"
                            disabled={
                              ban ||
                              !tra.trim() ||
                              (ph.item.kieu === 'so' &&
                                !khopPhanIII(tra, tra)) ||
                              (ph.item.kieu === 'ds' && tra.includes('-'))
                            }
                          >
                            {ban
                              ? 'Đang lưu…'
                              : cho
                                ? 'Gửi lại câu trả lời đã giữ'
                                : 'Tự thử lại'}
                          </button>
                          {!['ghep_bai', 'kiem_chung'].includes(
                            ph.item.loai,
                          ) && (
                            <button
                              type="button"
                              className="ccs-nut-phu"
                              disabled={ban || !!cho}
                              onClick={() => void xin()}
                            >
                              Cần gợi ý
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    </form>
                  </div>
                )
              )}
              {loi && (
                <div className="ccs-loi" role="alert">
                  <p>{loi}</p>
                  {!tai && (
                    <button
                      className="ccs-nut-phu"
                      onClick={() =>
                        ph?.dotId ? void tiep() : setLanTai((x) => x + 1)
                      }
                      disabled={ban}
                    >
                      Tải lại tiến độ
                    </button>
                  )}
                </div>
              )}
              <button
                type="button"
                className="ccs-nut-phu ccs-nghi"
                onClick={onVe}
                disabled={ban}
              >
                Lưu và nghỉ
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

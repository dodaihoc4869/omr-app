// Một việc mỗi màn; receipt bất biến, phản hồi do em chủ động đọc và tiếp tục.
// 12/10 (thầy: "mục chữa lỗi hiển thị cho thật chuẩn để học sinh chữa lỗi được"): không còn trạng thái nào chỉ báo chữ rồi bỏ đó —
// đợt không có bước để làm (chờ học liệu, chờ chữa trên lớp, tạm khoá, câu vừa cập nhật, chờ lần gặp lại 2, đã tự sửa) ⇒ "Chữa trực tiếp
// câu gốc" (ChuaTrucTiep.tsx). Giao diện theo ngôn ngữ Hôm nay (.ht2): dải "Đường tự gỡ" có từng bước, khung làm bước, nút chính sát đáy.
// ĐỢT 18 (13/10 — thầy: "Tối ưu lại câu từ cho dễ hiểu … Bỏ hết các gợi ý hướng dẫn"): dòng phụ đầu màn là TÊN lối đang đi ("Sửa từng bước" /
// "Sửa trên câu gốc", chữ "sửa" như mục Tự sửa lỗi); bỏ lời dặn khi nghỉ; nút "Tiếp tục" gọn. Giữ nguyên "Cần gợi ý" (công cụ học, không phải hướng dẫn).
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
import ChuaTrucTiep, { propsCauLam } from './ChuaTrucTiep'
import { TrongManChua } from './trong-man-chua'
import { canChuaTrucTiep } from '../../lib/chua-truc-tiep'
import '../tu-luyen/tu-luyen.css'
import './chua-cau-sai.css'
export interface PropsChuaCauSai {
  token: string
  qid: string
  tenCau?: string
  onVe: () => void
  /** Nhãn nút rời màn khi em chữa xong / chưa làm được câu này (mặc định "Sang câu khác"). */
  nhanVe?: string
  /** Đợt 16 (12/10): câu mở thẳng KHÔNG có trong danh sách Tự chữa — lệnh mở đợt (`mo-dot`, y như cũ) không mở được thì giao lời báo cho màn
   *  gọi (về danh sách kèm lời báo thật) thay cho khung "Chưa mở được câu này". Vắng ⇒ như cũ. */
  onKhongMo?: (loi: string) => void
}
function IconVe() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
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
  nhanVe = 'Sang câu khác',
  onKhongMo,
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
  const khongMoRef = useRef(onKhongMo)
  khongMoRef.current = onKhongMo
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
        if (khongMoRef.current) {
          khongMoRef.current(r.loi ?? 'Chưa mở được câu chữa.')
          return
        }
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
  const phanHoi = hoi ?? ph?.phanHoiTruoc,
    soBuoc = ph?.tienDoChiTiet?.length ?? ph?.tienDo?.soBuocCanKiem ?? 0,
    soBuocDaQua = ph?.tienDoChiTiet?.filter(
      (x) => x.trangThai === 'co_bang_chung_hieu_trong_phien',
    ).length ?? ph?.tienDo?.soBuocDaQua ?? 0
  const trucTiep = !tai && canChuaTrucTiep(ph)
  const loiThay = ph?.loiThay ? (
    <aside className="ccs-goi-y">
      <strong>Thầy cùng em gỡ</strong>
      <ChemText text={ph.loiThay} />
    </aside>
  ) : null
  const cauGocDe =
    ph?.cauGoc && ['I', 'II', 'III'].includes(ph.cauGoc.phan) && ph.cauGoc.text
      ? propsCauLam({ ...ph.cauGoc, phan: ph.cauGoc.phan as 'I' | 'II' | 'III', hinhAnh: ph.cauGoc.hinhAnh as { src: string; viTri: string; alt?: string }[] | undefined }, '')
      : null
  return (
    <TrongManChua.Provider value={true}>
    <div className="tlu ccs" data-tuyen={trucTiep ? 'truc-tiep' : 'tung-buoc'} aria-label="Chữa câu sai">
      <header className="ccs-dau">
        <button
          className="ccs-ve"
          type="button"
          onClick={onVe}
          disabled={ban}
          aria-label="Quay lại"
        >
          <IconVe />
          <span className="ccs-ve-chu" aria-hidden="true">Quay lại</span>
        </button>
        <div className="ccs-dau-giua">
          <h1 className="ccs-tieu">{tenCau ?? 'Sửa câu này'}</h1>
          <span className="ccs-nhan-trang-thai">
            {trucTiep ? 'Sửa trên câu gốc' : 'Sửa từng bước'}
          </span>
        </div>
        {soBuoc > 0 && !trucTiep && (
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
            <strong>Đang mở câu…</strong>
          </div>
        ) : trucTiep && ph ? (
          <ChuaTrucTiep
            token={token}
            qid={qid}
            ph={ph}
            ban={ban}
            nhanVe={nhanVe}
            onVe={onVe}
            onLamGapLai={() => void tiep()}
            dau={
              <>
                {loiThay}
                {loi && (
                  <div className="ccs-loi" role="alert">
                    <p>{loi}</p>
                  </div>
                )}
              </>
            }
          />
        ) : !ph ? (
          <section className="ccs-khu-lam ccs-khu-loi" aria-label="Chưa mở được câu chữa">
            <div className="ccs-trang-thai">
              <h2 ref={buocRef} tabIndex={-1}>Chưa mở được câu này</h2>
              <p role="alert">{loi || 'Chưa mở được câu chữa.'}</p>
            </div>
            <div className="ccs-hang-nut ccs-day">
              <button type="button" className="ccs-nut-chinh" onClick={() => { setTai(true); setLoi(''); setLanTai((x) => x + 1) }}>
                Thử lại
              </button>
              <button type="button" className="ccs-nut-phu" onClick={onVe}>
                {nhanVe}
              </button>
            </div>
          </section>
        ) : (
          <div className="ccs-bo-cuc" data-tuyen="tung-buoc">
            <aside className="ccs-cot-phu" aria-label="Tiến độ và đề gốc">
              <section className="ccs-the-tien-do">
                <div className="ccs-the-tien-do-dau">
                  <span>Đường tự gỡ</span>
                  {soBuoc > 0 && <strong className="ccs-so">{soBuocDaQua}/{soBuoc} bước</strong>}
                </div>
                {ph.tienDoChiTiet && ph.tienDoChiTiet.length > 0 ? (
                  <ol className="ccs-lo-trinh" aria-label="Những bước đã kiểm">
                    {ph.tienDoChiTiet.map((x, i) => (
                      <li
                        key={x.buocId}
                        data-da={x.trangThai === 'co_bang_chung_hieu_trong_phien'}
                        data-hien-tai={
                          x.trangThai !== 'co_bang_chung_hieu_trong_phien' &&
                          i === soBuocDaQua
                        }
                        aria-current={
                          x.trangThai !== 'co_bang_chung_hieu_trong_phien' && i === soBuocDaQua ? 'step' : undefined
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
                    Bước sẽ hiện sau khi tìm ra chỗ vướng.
                  </p>
                )}
              </section>
              {cauGocDe && (
                <details className="ccs-cau-goc">
                  <summary>
                    <span>Xem lại đề gốc</span>
                    <span aria-hidden="true">＋</span>
                  </summary>
                  <div className="ccs-cau-goc-noi m3">
                    <TheCau {...cauGocDe} />
                  </div>
                </details>
              )}
            </aside>
            <section className="ccs-khu-lam" aria-label="Bước đang luyện">
              {loiThay}
              {ph.canNghi ? (
                <section className="ccs-trang-thai">
                  <h2 ref={buocRef} tabIndex={-1}>
                    Mình nghỉ một chút nhé
                  </h2>
                  <p>Những bước em đã hiểu đã được lưu.</p>
                  <div className="ccs-hang-nut ccs-day">
                    <button
                      className="ccs-nut-chinh"
                      onClick={() => void tiep(true)}
                      disabled={ban}
                    >
                      Làm tiếp một đoạn
                    </button>
                  </div>
                </section>
              ) : (
                ph.item && (
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
                    <div className="ccs-hang-nut ccs-day">
                      {phanHoi ? (
                        <button
                          type="button"
                          className="ccs-nut-chinh"
                          disabled={ban}
                          onClick={() => void tiep()}
                        >
                          Tiếp tục
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
                  <button
                    className="ccs-nut-phu"
                    onClick={() => void tiep()}
                    disabled={ban}
                  >
                    Tải lại tiến độ
                  </button>
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
    </TrongManChua.Provider>
  )
}

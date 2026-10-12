import { useEffect, useState, type CSSProperties } from 'react'
import { Activity, ArrowRight, Check, Clock, Eye, Hourglass, TriangleAlert } from 'lucide-react'
import {
  chuDaiOEm,
  chuDieuKienEm,
  chuMotOEm,
  chuNutHocNgay,
  chuThoatLuoi,
  chuTocDo,
  chuViecTiep,
  layNhipHocEm,
  loaiONgay,
  LUAT_NHOM_NHIP,
  ngayNgan,
  oSoEm,
  TEN_LOAI_O_EM,
  TEN_NHOM_NHIP,
  type KetQuaNhipHocEm,
  type NhomNhip,
} from '../../lib/nhip-hoc-em'

// BẢNG "NHỊP HỌC CỦA EM · TỪ 01/10" — đầu màn Hôm nay của app học sinh (thầy 12/10 duyệt bản vẽ HS-Cham / HS-Luoi: "hiện rõ một bảng ngay đầu thông
// tin lười hay chăm chỉ … ghi thêm 1 câu trong bảng thầy cũng thấy điều này"; "6 ngày liền làm đủ mới thoát nhóm lười nhé").
// Nhãn nhóm màu · "Em đủ mức x/y ngày" + % + điều kiện · dải ô ngày · 3 ô số · dòng tốc độ làm bài · Việc tiếp (Chăm / Chưa đều) hoặc khối "Cách ra
// khỏi nhóm Lười" (thanh 6 ô + nút Học ngay gọi `onHoc` sẵn có) · dòng cuối "Thầy cũng thấy bảng này.". Đang tải: khung xương. Lỗi: ẩn gọn (không
// chặn màn). Số do máy chủ tính (`/hs/nhip-hoc`, cùng phép thuần với Hôm nay của thầy). Màu: chỉ biến app học sinh (hoc-tap.css, khối `.ht2-nhe`).

const ICON_NHOM: Record<NhomNhip, typeof Check> = { cham: Check, 'chua-deu': Activity, luoi: TriangleAlert, 'chua-du': Hourglass }

/** Khoảng ngày cuối câu ("(06–09/10)") không bị ngắt dòng giữa chừng trên điện thoại. */
function ChuLien({ chu }: { chu: string }) {
  const m = /^(.*)(\([^()]*\))$/.exec(chu)
  return m ? (
    <>
      {m[1]}
      <span className="ht2-nhe-lien">{m[2]}</span>
    </>
  ) : (
    <>{chu}</>
  )
}

function Xuong() {
  return (
    <section className="ht2-nhe ht2-nhe-xuong" aria-busy="true" aria-label="Đang tải nhịp học của em">
      <span style={{ width: '58%', height: 16 }} />
      <span style={{ width: '72%', height: 30 }} />
      <span style={{ width: '100%', height: 22 }} />
      <span style={{ width: '100%', height: 68 }} />
    </section>
  )
}

export function BangNhipHocEm({ kq, onHoc, tatHoc }: { kq: KetQuaNhipHocEm; onHoc: () => void; tatHoc?: boolean }) {
  const Icon = ICON_NHOM[kq.nhom]
  const can = LUAT_NHOM_NHIP.ngayLienThoatLuoi
  const co = Math.min(kq.chuoiDuGanNhat, can)
  const nut = kq.nhom === 'luoi' ? chuNutHocNgay(kq) : null
  return (
    <section className="ht2-nhe" data-nhom={kq.nhom} aria-labelledby="ht2-nhe-tieu">
      <div className="ht2-nhe-dau">
        <h2 id="ht2-nhe-tieu" className="ht2-nhe-tieu">
          Nhịp học của em · từ {ngayNgan(kq.tu)}
        </h2>
        <span className="ht2-nhe-nhom" data-nhom={kq.nhom}>
          <Icon size={16} strokeWidth={2.6} aria-hidden="true" />
          {TEN_NHOM_NHIP[kq.nhom]}
        </span>
      </div>

      <div className="ht2-nhe-than">
        <div className="ht2-nhe-trai">
          <div className="ht2-nhe-lon-khoi">
            <p className="ht2-nhe-lon">
              {kq.soNgayQua > 0 ? (
                <>
                  Em đủ mức{' '}
                  <span className="ht2-nhe-ti">
                    {kq.soNgayDu}/{kq.soNgayQua}
                  </span>{' '}
                  ngày
                </>
              ) : (
                'Bảng bắt đầu đếm từ hôm nay'
              )}
            </p>
            <p className="ht2-nhe-dk">
              <ChuLien chu={chuDieuKienEm(kq)} />
            </p>
          </div>

          <div className="ht2-nhe-dai">
            {/* Số cột = số ngày, tối đa 14 (điện thoại) / 21 (máy tính) rồi xuống hàng; ít ngày thì ô không kéo giãn (bề rộng tối đa theo số cột). */}
            <div className="ht2-nhe-dai-o" style={{ '--cot': Math.min(Math.max(kq.ngay.length, 1), 14), '--cot-rong': Math.min(Math.max(kq.ngay.length, 1), 21) } as CSSProperties}>
              <div className="ht2-nhe-o-ngay" role="img" aria-label={chuDaiOEm(kq)}>
                {kq.ngay.map((x) => (
                  <i key={x.ngay} data-loai={loaiONgay(x, kq.homNay)} data-hom-nay={x.ngay === kq.homNay ? 'true' : undefined} title={chuMotOEm(x, kq.homNay)} />
                ))}
              </div>
              <p className="ht2-nhe-moc" aria-hidden="true">
                <span>{ngayNgan(kq.tu)}</span>
                <span>hôm nay</span>
              </p>
            </div>
            <ul className="ht2-nhe-chu-thich" aria-label="Chú thích màu ô ngày">
              {(Object.keys(TEN_LOAI_O_EM) as (keyof typeof TEN_LOAI_O_EM)[]).map((l) => (
                <li key={l}>
                  <i data-loai={l} aria-hidden="true" />
                  {TEN_LOAI_O_EM[l]}
                </li>
              ))}
              <li>
                <i data-loai="cho" data-vien="true" aria-hidden="true" />
                Hôm nay
              </li>
            </ul>
          </div>
        </div>

        <div className="ht2-nhe-phai">
          <dl className="ht2-nhe-o">
            {oSoEm(kq).map((o) => (
              <div key={o.nhan} className="ht2-nhe-o-mot">
                <dt>{o.nhan}</dt>
                <dd data-sac={o.sac || undefined}>{o.so}</dd>
              </div>
            ))}
          </dl>

          {kq.tocDo && (
            <p className="ht2-nhe-toc" data-muc={kq.tocDo.muc}>
              <Clock size={18} aria-hidden="true" />
              <span>{chuTocDo(kq.tocDo)}</span>
            </p>
          )}

          {kq.nhom === 'luoi' ? (
            <div className="ht2-nhe-thoat">
              <p>
                <b>Cách ra khỏi nhóm Lười:</b> làm đủ mức {can} ngày liền. {chuThoatLuoi(kq)}
              </p>
              <div className="ht2-nhe-sau" role="img" aria-label={`${co} trên ${can} ngày liền đủ mức`}>
                {Array.from({ length: can }, (_, i) => (
                  <i key={i} data-xong={i < co ? 'true' : undefined} />
                ))}
              </div>
              {nut && (
                <button type="button" className="ht2-nhe-nut" onClick={onHoc} disabled={tatHoc}>
                  {nut}
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              )}
            </div>
          ) : (
            <p className="ht2-nhe-tiep">
              <b>Việc tiếp:</b> {chuViecTiep(kq)}
            </p>
          )}
        </div>
      </div>

      <p className="ht2-nhe-thay">
        <Eye size={18} aria-hidden="true" />
        Thầy cũng thấy bảng này.
      </p>
    </section>
  )
}

/** Bản nhớ trong phiên (mỗi token một bản, 60 giây, gắn với `lamMoi`): em chuyển qua lại các mục rồi về Hôm nay thì vẽ ngay, không gọi lại máy
 *  chủ (bớt lượt D1); số câu hôm nay đổi ⇒ khoá khác ⇒ nạp lại. */
const NHO = new Map<string, { kq: KetQuaNhipHocEm; luc: number; khoa: number | null | undefined }>()
const NHO_MS = 60_000
/** Chỉ cho test: xoá bản nhớ. */
export const xoaNhoNhipHocEm = (): void => NHO.clear()

/** Nạp `/hs/nhip-hoc` rồi vẽ bảng. `lamMoi` đổi (vd số câu đã làm hôm nay) ⇒ nạp lại; lỗi khi đã có số ⇒ giữ số cũ. Không token / lỗi lần đầu ⇒ ẩn. */
export default function NhipHocEm({ token, onHoc, tatHoc, lamMoi }: { token?: string; onHoc: () => void; tatHoc?: boolean; lamMoi?: number | null }) {
  const [kq, setKq] = useState<KetQuaNhipHocEm | null>(() => (token ? (NHO.get(token)?.kq ?? null) : null))
  const [hong, setHong] = useState(false)
  useEffect(() => {
    if (!token) return
    const c = NHO.get(token)
    if (c && c.khoa === lamMoi && Date.now() - c.luc < NHO_MS) {
      setKq(c.kq)
      return
    }
    let huy = false
    void layNhipHocEm(token).then((r) => {
      if (huy) return
      if (r) {
        NHO.set(token, { kq: r, luc: Date.now(), khoa: lamMoi })
        setKq(r)
        setHong(false)
      } else setHong(true)
    })
    return () => {
      huy = true
    }
  }, [token, lamMoi])
  if (!token) return null
  if (kq) return <BangNhipHocEm kq={kq} onHoc={onHoc} tatHoc={tatHoc} />
  return hong ? null : <Xuong />
}

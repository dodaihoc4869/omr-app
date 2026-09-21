import { useMemo, useState } from 'react'
import { Eye, Info, Pin, Plus, X } from 'lucide-react'
import type { CauGiao } from '../lib/btvn-nang-do'
import { chonLoi } from '../lib/btvn-nang-do'
import { GHIM_TOI_DA, TEN_CAU_MAT, maDangCuaThay, moTaCauChoThay } from '../lib/btvn-nang-do-thay'
import '../screens/btvn-nang-do-m3.css'

/** LÕI CHUNG tính ngay ở máy thầy khi lõi thuần của Code 1 đã cài; chưa cài (hoặc lỗi) ⇒ `null` và khối nói "≈ 30 %", KHÔNG bịa con số. */
export function tinhLoiMayThay(cau: CauGiao[], ghim: string[]): string[] | null {
  if (cau.length === 0) return null
  try {
    const l = chonLoi(cau, ghim)
    return Array.isArray(l) ? l : null
  } catch {
    return null
  }
}

/** KHỐI "CÁ NHÂN HOÁ" của màn Giao bài (bản vẽ docs/ban-ve-btvn-nang-do-2109/1-giao-bai-ca-nhan-hoa.jpg, thầy duyệt 21/09).
 *  Công tắc (mặc định BẬT, khuyên dùng; tắt = như cũ, cả lớp đủ câu) + con số đo được của bài + GHIM CÂU cả lớp bắt buộc (TUỲ CHỌN — không ghim vẫn giao
 *  và xem trước bình thường; tối đa 10 câu) + nút "Xem trước phân bổ". Chỉ SỐ ĐẾM; không nói gì về từng em ở đây. */
export default function KhoiCaNhanHoa({ bat, doi, cau, ghim, doiGhim, onXemTruoc }: { bat: boolean; doi: (b: boolean) => void; cau: CauGiao[]; ghim: string[]; doiGhim: (g: string[]) => void; onXemTruoc: () => void }) {
  const [moChon, setMoChon] = useState(false)
  const soDang = useMemo(() => new Set(cau.map((c) => maDangCuaThay(c))).size, [cau])
  const loi = useMemo(() => (bat ? tinhLoiMayThay(cau, ghim) : null), [bat, cau, ghim])
  const viTri = useMemo(() => new Map(cau.map((c, i) => [c.qid, i + 1])), [cau])
  const nhanCau = (c: CauGiao) => moTaCauChoThay(viTri.get(c.qid) ?? 0, c)
  const daDay = ghim.length >= GHIM_TOI_DA
  const bo = (qid: string) => doiGhim(ghim.filter((g) => g !== qid))
  const them = (qid: string) => !daDay && !ghim.includes(qid) && doiGhim([...ghim, qid])

  return (
    <section className="bn-khoi" aria-labelledby="bn-ca-nhan-hoa">
      <div className="bn-dau">
        <div className="bn-dau-chu">
          <div className="bn-tieu-de-hang">
            <h3 id="bn-ca-nhan-hoa" className="bn-tieu-de">
              Cá nhân hoá
            </h3>
            <span className="bn-chip bn-chip--tot">Khuyên dùng</span>
          </div>
          <p className="bn-mo-ta">
            Mỗi em nhận bộ câu <b>vừa sức</b> theo hồ sơ của em: <b>câu cốt lõi chung</b> (cả lớp giống nhau, phủ hết các dạng) + <b>câu dành riêng cho em</b>, chia thành chặng mỗi ngày. Em yếu không nhận câu vượt bậc; em khá bỏ bớt câu dễ đã đúng lại.
          </p>
        </div>
        <button type="button" role="switch" aria-checked={bat} aria-label="Cá nhân hoá (khuyên dùng)" className="bn-cong-tac" data-bat={bat ? 'co' : 'khong'} onClick={() => doi(!bat)}>
          <span className="bn-cong-tac-nut" />
        </button>
      </div>

      {!bat ? (
        <p className="bn-tat">Đang tắt — cả lớp nhận đủ {cau.length > 0 ? `${cau.length} câu` : 'các câu của tờ đề'} như cũ.</p>
      ) : (
        <>
          <div className="bn-ghi-chu" role="note">
            <Info size={18} aria-hidden="true" />
            <span>
              <b>Bộ câu của em chốt khi em mở bài lần đầu</b> — xem trước chỉ là ước tính theo hồ sơ hôm nay. Sau khi giao, không sửa thứ tự câu trong đề của bài này.
            </span>
          </div>

          <div className="bn-o-luoi">
            <div className="bn-o bn-o--tot">
              <span className="bn-o-so">{loi ? `${loi.length}/${cau.length}` : '≈ 30 %'}</span>
              <span className="bn-o-nhan">câu LÕI chung</span>
              <span className="bn-o-phu">{loi ? `≈ ${Math.round((loi.length / Math.max(1, cau.length)) * 100)} % · tự tính theo số dạng` : 'số câu chính xác hiện ở Xem trước'}</span>
            </div>
            <div className="bn-o bn-o--chinh">
              <span className="bn-o-so">{soDang}</span>
              <span className="bn-o-nhan">dạng trong bài</span>
              <span className="bn-o-phu">mỗi dạng 1–2 câu đại diện</span>
            </div>
            <div className="bn-o bn-o--phu">
              <span className="bn-o-so">{ghim.length}</span>
              <span className="bn-o-nhan">câu ghim</span>
              <span className="bn-o-phu">cả lớp bắt buộc · không bắt buộc ghim</span>
            </div>
          </div>

          <div className="bn-ghim">
            <h4 className="bn-nhan">Ghim câu cả lớp bắt buộc (không bắt buộc ghim)</h4>
            <div className="bn-ghim-hang">
              {ghim.map((qid) => {
                const c = cau.find((x) => x.qid === qid)
                return (
                  <span key={qid} className="bn-chip bn-chip--ghim">
                    <Pin size={14} aria-hidden="true" />
                    {c ? nhanCau(c) : TEN_CAU_MAT}
                    <button type="button" className="bn-chip-bo" aria-label={`Bỏ ghim ${c ? nhanCau(c) : TEN_CAU_MAT}`} onClick={() => bo(qid)}>
                      <X size={14} aria-hidden="true" />
                    </button>
                  </span>
                )
              })}
              <button type="button" className="bn-nut bn-nut--vien" aria-expanded={moChon} disabled={cau.length === 0} onClick={() => setMoChon((v) => !v)}>
                <Plus size={16} aria-hidden="true" />
                {moChon ? 'Xong' : 'Chọn câu để ghim…'}
              </button>
            </div>
            <p className="bn-phu">Câu ghim luôn nằm trong bộ của MỌI em (thêm vào câu cốt lõi). Tối đa {GHIM_TOI_DA} câu. Không ghim câu nào vẫn giao và xem trước bình thường.</p>

            {moChon && (
              <div className="bn-chon" role="group" aria-label="Chọn câu để ghim">
                {daDay && <p className="bn-phu bn-phu--canh">Đã ghim tối đa {GHIM_TOI_DA} câu — bỏ bớt một câu để ghim câu khác.</p>}
                {cau.map((c) => {
                  const dang = ghim.includes(c.qid)
                  return (
                    <label key={c.qid} className={`bn-chon-dong${dang ? ' bn-chon-dong--chon' : ''}`}>
                      <input type="checkbox" checked={dang} disabled={!dang && daDay} onChange={() => (dang ? bo(c.qid) : them(c.qid))} />
                      <span>{nhanCau(c)}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bn-hanh-dong">
            <button type="button" className="bn-nut bn-nut--tonal" disabled={cau.length === 0} onClick={onXemTruoc}>
              <Eye size={18} aria-hidden="true" />
              Xem trước phân bổ
            </button>
            <span className="bn-phu">Tắt công tắc = như cũ: cả lớp nhận đủ {cau.length} câu.</span>
          </div>
        </>
      )}
    </section>
  )
}

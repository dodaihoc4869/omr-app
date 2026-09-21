// TAB "BÀI GIA ĐÌNH GIAO" (bài của Mẹ) của cổng học sinh (việc C · C4) — bản Material 3, hai màn: DANH SÁCH và ĐANG LÀM BÀI.
// StudentPortalScreen giữ NGUYÊN mọi hàm và trạng thái (đồng hồ 120 phút, nháp localStorage `omr_mom_draft_*`, lưu máy chủ, nộp, mở kết
// quả); ở đây chỉ là VẺ NGOÀI + gọi lại các hàm ấy. Câu trả lời giữ đúng định dạng cũ: Phần I một chữ A–D; Phần II 4 ký tự D/S ("-" = chưa
// chọn); Phần III chữ tự do. KHÔNG dùng position:fixed (sheet có transform từ animate-google-fade ⇒ con fixed trôi theo nội dung): thanh
// đồng hồ dính bằng `position: sticky` dưới thanh trên của sheet.
import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check, Eye, Heart, Hourglass, Pause, RefreshCw, Timer, X } from 'lucide-react'
import '../m3'
import './mom-m3.css'
import { MomOption, MomQuestionStem } from '../MomQuestionMedia'
import ONhapDapSo from '../ONhapDapSo'

export interface BaiMomM3 {
  id: string
  tieuDe?: string
  ngayGiao?: string
  soCau?: number
  trangThai?: string
  diem?: number | null
  dsCau?: any[]
  cau?: any[]
  [k: string]: unknown
}

const KY_TU = ['A', 'B', 'C', 'D', 'E', 'F']

// ─────────────────────────── DANH SÁCH ───────────────────────────
export function MomDanhSachM3({
  ds,
  daTai,
  loi,
  thongBaoNop,
  onDongThongBao,
  onLamMoi,
  ngayGio,
  onBatDau,
  onXemKetQua,
}: {
  ds: BaiMomM3[]
  daTai: boolean
  loi: string
  thongBaoNop: string | null
  onDongThongBao: () => void
  onLamMoi: () => void
  ngayGio: (iso: string) => string
  onBatDau: (bai: BaiMomM3) => void
  onXemKetQua: (bai: BaiMomM3) => void
}) {
  return (
    <div className="mom">
      <div className="mom-tieu">
        <div className="mom-tieu-chu">
          <h2 className="mom-h">
            <Heart size={22} aria-hidden="true" className="mom-tim" />
            <span>Bài gia đình giao (thời gian làm 2 giờ)</span>
          </h2>
          <p className="mom-phu">Phụ huynh tạo bài từ Cổng Phụ Huynh dựa trên các câu con sai trước đó để con ôn luyện khắc phục.</p>
        </div>
        <button type="button" onClick={onLamMoi} className="m3-nut-vien mom-lam-moi">
          <RefreshCw size={18} aria-hidden="true" />
          <span>Làm mới</span>
        </button>
      </div>

      {loi && (
        <div role="alert" className="mom-loi">
          {loi}
        </div>
      )}
      {thongBaoNop && (
        <div className="mom-ok" role="status">
          <span>{thongBaoNop}</span>
          <button type="button" onClick={onDongThongBao} aria-label="Đóng thông báo" className="mom-ok-dong">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}

      {ds.length === 0 ? (
        <div className="mom-trong">
          <span className="mom-trong-bt" aria-hidden="true">
            <Heart size={26} />
          </span>
          <h3 className="mom-trong-ten">{daTai ? 'Chưa có bài gia đình giao nào' : loi ? 'Chưa tải được danh sách bài' : 'Đang nhận bài gia đình giao…'}</h3>
          <p className="mom-phu">
            Phụ huynh có thể vào <strong>Cổng Phụ Huynh (/phu-huynh)</strong> chỉ bằng Số báo danh của con, kéo thanh chọn câu (tối đa 99 câu) để tự động tạo và gửi bài cho con làm bất kỳ lúc nào.
          </p>
        </div>
      ) : (
        <div role="region" aria-label="Bài gia đình giao" className="mom-ds">
          {ds.map((bai) => {
            const daNop = bai.trangThai === 'da_nop'
            const dangLam = bai.trangThai === 'dang_lam'
            return (
              <article key={bai.id} className="mom-the" aria-label={bai.tieuDe}>
                <div className="mom-the-dau">
                  <span className="mom-gio">{bai.ngayGiao ? ngayGio(String(bai.ngayGiao)) : ''}</span>
                  {daNop ? (
                    <span className="m3-chip mom-chip-xong"><Check size={14} aria-hidden="true" /> Đã nộp ({bai.diem}/10đ)</span>
                  ) : dangLam ? (
                    <span className="m3-chip mom-chip-canh-bao"><Hourglass size={14} aria-hidden="true" /> Đang làm</span>
                  ) : (
                    <span className="m3-chip mom-chip-loi">Chưa làm</span>
                  )}
                </div>
                <h3 className="mom-ten">{bai.tieuDe}</h3>
                <div className="mom-meta">
                  <span>
                    Số câu: <strong>{bai.soCau || (bai.dsCau || bai.cau || []).length}</strong> câu
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="mom-han">
                    <Timer size={16} aria-hidden="true" />
                    <span>Thời gian làm: 2 giờ</span>
                  </span>
                </div>
                <div className="mom-nut">
                  {daNop ? (
                    <button type="button" onClick={() => onXemKetQua(bai)} className="m3-nut-vien">
                      <Eye size={18} aria-hidden="true" />
                      <span>Xem kết quả & Lời giải HTML</span>
                    </button>
                  ) : (
                    <button type="button" onClick={() => onBatDau(bai)} className="m3-nut-chinh">
                      <span>{dangLam ? 'Tiếp tục làm bài' : 'Bắt đầu làm bài (2 tiếng)'}</span>
                      <ArrowRight size={18} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────── ĐANG LÀM BÀI ───────────────────────────
export function MomLamBaiM3({
  tieuDe,
  giayConLai,
  dinhDangThoiGian,
  soDaLam,
  dsCau,
  traLoi,
  datTraLoi,
  loi,
  onQuayLai,
  onTamDung,
  onNop,
}: {
  tieuDe?: string
  giayConLai: number
  dinhDangThoiGian: (giay: number) => string
  /** Số ô đã có mục trong bản trả lời (đúng cách đếm cũ: `Object.keys(cauTraLoi).length`). */
  soDaLam: number
  dsCau: any[]
  traLoi: Record<string, string>
  datTraLoi: (idCau: string, giaTri: string) => void
  loi: string
  onQuayLai: () => void
  onTamDung: () => void
  onNop: () => void
}): ReactNode {
  return (
    <div className="mom mom-lam">
      {/* Đầu bài: trôi theo trang (không ghim) — đường về danh sách, Tạm dừng, tên bài */}
      <div className="mom-dau-bai">
        <div className="mom-dau-bai-nut">
          <button type="button" onClick={onQuayLai} className="m3-nut-vien">
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Danh sách bài</span>
          </button>
          <button type="button" onClick={onTamDung} className="m3-nut-tonal" title="Tạm dừng và lưu tiến độ để làm tiếp sau">
            <Pause size={18} aria-hidden="true" />
            <span>Tạm dừng</span>
          </button>
        </div>
        {tieuDe && <h2 className="mom-tieu-bai">{tieuDe}</h2>}
      </div>

      {/* Thanh ghim dưới thanh trên của sheet: CHỈ đồng hồ + số câu đã làm + Nộp — một hàng gọn để câu hỏi còn chỗ */}
      <div className="mom-dong-ho" data-gap={giayConLai < 900 ? true : undefined}>
        <div className="mom-dong-ho-tren">
          <span className="mom-dong-ho-so" role="timer" aria-label="Thời gian còn lại">
            <Timer size={18} aria-hidden="true" />
            <span>Thời gian làm còn: {dinhDangThoiGian(giayConLai)}</span>
          </span>
          <span className="mom-dong-ho-da">
            Đã làm: <strong>{soDaLam}</strong>/{dsCau.length}
          </span>
        </div>
        <button type="button" onClick={onNop} className="m3-nut-chinh mom-dong-ho-nop" aria-label="Nộp bài gia đình giao">
          <Check size={18} aria-hidden="true" />
          <span>Nộp bài</span>
        </button>
      </div>

      <ol className="mom-cau-ds">
        {dsCau.map((cau: any, idx: number) => {
          const daChon = traLoi[cau.id]
          const id = String(cau.id ?? idx)
          const ten = `mom-c-${id}`
          return (
            <li key={cau.id || idx} className="mom-cau" aria-labelledby={`${ten}-ten`}>
              <div className="mom-cau-dau">
                <h3 id={`${ten}-ten`} className="mom-cau-ten">
                  Câu {idx + 1}
                </h3>
                {cau.chuyenDe && <span className="m3-chip">{cau.chuyenDe}</span>}
              </div>
              <div className="mom-de">
                <MomQuestionStem q={cau} />
              </div>

              {cau.phan === 'II' ? (
                <div className="mom-nhom">
                  {(cau.ideas || cau.luaChon || cau.choices || []).map((idea: string, i: number) => {
                    const cur = daChon?.[i]
                    return (
                      <div key={i} className="mom-y" role="radiogroup" aria-labelledby={`${ten}-y${i}`}>
                        <div id={`${ten}-y${i}`} className="mom-y-nd">
                          <MomOption q={cau} index={i} text={`${String.fromCharCode(97 + i)}) ${idea}`} tf />
                        </div>
                        <div className="mom-doan">
                          {(['D', 'S'] as const).map((v) => (
                            <label key={v} className="mom-doan-o" data-chon={cur === v || undefined}>
                              <input
                                type="radio"
                                name={`${ten}-y${i}`}
                                value={v}
                                checked={cur === v}
                                onChange={() => {
                                  const a = (daChon || '----').split('')
                                  a[i] = v
                                  datTraLoi(cau.id, a.join(''))
                                }}
                              />
                              <span>{v === 'D' ? 'Đúng' : 'Sai'}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : Array.isArray(cau?.choices) && cau.choices.length > 0 ? (
                <div className="mom-nhom" role="radiogroup" aria-labelledby={`${ten}-ten`}>
                  {cau.choices.map((choice: string, k: number) => {
                    const ky = KY_TU[k] ?? String.fromCharCode(65 + k)
                    const chon = daChon === ky
                    return (
                      <label key={k} className="mom-lua" data-chon={chon || undefined}>
                        <input type="radio" name={ten} value={ky} checked={chon} onChange={() => datTraLoi(cau.id, ky)} />
                        <span className="mom-ky" aria-hidden="true">
                          {ky}
                        </span>
                        <span className="mom-nd">
                          <MomOption q={cau} index={k} text={choice} />
                        </span>
                      </label>
                    )
                  })}
                </div>
              ) : (
                <div className="mom-nhom">
                  <div className="mom-nhap">
                    <label className="mom-nhap-nhan" htmlFor={`mom-tl-${cau.id}`}>Điền câu trả lời ngắn:</label>
                    <ONhapDapSo id={`mom-tl-${cau.id}`} inputMode="text" value={daChon || ''} onChange={(v) => datTraLoi(cau.id, v)} placeholder="Nhập đáp án số hoặc chữ..." />
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {loi && (
        <div role="alert" className="mom-loi">
          {loi}
        </div>
      )}

      <div className="mom-nop">
        <div className="mom-nop-ten">Em đã hoàn thành bài gia đình giao chưa?</div>
        <p className="mom-phu">Khi nộp bài, hệ thống sẽ tự động chấm điểm, tạo cấu trúc lời giải chi tiết chuẩn HTML và gửi kết quả về cho phụ huynh xem.</p>
        <button type="button" onClick={onNop} className="m3-nut-chinh">
          <Check size={18} aria-hidden="true" />
          <span>Nộp bài ngay</span>
        </button>
      </div>
    </div>
  )
}

// THẺ "BUỔI CHỮA TỐI NAY (ĐÃ XẾP SẴN)" — đầu mục 2 màn Gọi lên bảng (B6, Code 1, 21/09/2026; cập nhật 25/09/2026
// theo LUẬT MỚI rút câu BTVN: phủ hết + sàn 80 % + lượt thêm cho em).
//
// Chỉ TRÌNH BÀY kết quả của `deXuatBuoiChuaPhuKienThuc` (số THẬT: câu chữa · câu chỉ đọc đáp án · phút · sàn 80 % ·
// em lên bảng · cảnh báo). Máy chỉ CHUẨN BỊ sẵn; thầy xem rồi muốn tự làm thì bấm "Tự chọn lại" (luồng cũ). Không có
// đề xuất (`co: false`) ⇒ KHÔNG vẽ gì (không báo lỗi đỏ).
// Chữ theo `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`: con số nào cũng có nhãn + đơn vị, nút = động từ + kết quả, không nhãn
// năng lực, không emoji, màu chỉ qua token (không hex thô). Mục "Xem N câu" bung/thu gọn liệt kê câu đúng THỨ TỰ CHỮA.
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Nhan, NutChinh, OThongBao } from './DesignSystem'
import type { DeXuatBuoiChua, HangCauDeXuat } from '../lib/buoi-chua-de-xuat'

/** Số tên em hiện trực tiếp; còn lại gom thành "và N em khác". */
export const SO_TEN_EM_HIEN = 6

const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }

/** Câu chữ "em lên bảng": tên (hoặc SBD nếu thiếu tên) của ≤ 6 em đầu, rồi "và N em khác". */
export function chuEmCanChuY(em: readonly { sbd: string; hoTen: string }[]): string {
  const ten = em.map((e) => e.hoTen.trim() || e.sbd)
  if (ten.length <= SO_TEN_EM_HIEN) return ten.join(', ')
  return `${ten.slice(0, SO_TEN_EM_HIEN).join(', ')} và ${ten.length - SO_TEN_EM_HIEN} em khác`
}

/** Tên gọi một dòng câu: phần + số câu (từ chuẩn, không mã nội bộ). */
const tenCau = (h: HangCauDeXuat) => `Phần ${h.phan} câu ${h.qid}`

export default function TheBuoiChuaXepSan({ deXuat, onTuChon }: { deXuat: DeXuatBuoiChua | null; onTuChon: () => void }) {
  const [moRong, setMoRong] = useState(false)
  if (!deXuat || !deXuat.co) return null
  const { boQua } = deXuat
  const soDocDapAn = deXuat.soCauDocDapAn ?? 0
  const hang = deXuat.hang ?? []
  const soEmNhieuLuot = deXuat.soEmNhieuLuot ?? 0
  const canhBao = deXuat.canhBao ?? []
  return (
    <section
      data-buoi-xep-san
      aria-label="Buổi chữa tối nay đã xếp sẵn"
      style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3) var(--k4)', marginBottom: 'var(--k3)' }}
    >
      {/* Đầu thẻ: tiêu đề + nhãn sàn 80 % (xanh = đạt · cam = chưa đạt). */}
      <div className="flex flex-wrap items-center" style={{ gap: 'var(--k2) var(--k3)' }}>
        <div style={{ flex: '1 1 auto', minWidth: 0, fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)', fontWeight: 700, color: 'var(--muc)' }}>
          Buổi chữa tối nay (đã xếp sẵn)
        </div>
        {typeof deXuat.dat80 === 'boolean' && (
          <Nhan tone={deXuat.dat80 ? 'xanh' : 'cam'} data-nhan="san-80">
            {deXuat.dat80 ? 'Đạt sàn 80 %' : 'Chưa đạt sàn 80 %'}
          </Nhan>
        )}
      </div>

      {/* Con số lớn — MỘT điểm nhấn của thẻ: số câu CHỮA (gọi em lên bảng). */}
      <div style={{ marginTop: 'var(--k2)' }}>
        <div style={{ ...SO, fontFamily: 'var(--serif)', fontSize: 'var(--cx-5)', fontWeight: 700, lineHeight: 1.1, color: 'var(--muc)' }}>
          {deXuat.soCau} câu chữa
        </div>
        <div style={{ ...SO, marginTop: 2, fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
          {soDocDapAn > 0 ? (
            <>
              <b>{soDocDapAn}</b> câu chỉ đọc đáp án ·{' '}
            </>
          ) : null}
          khoảng <b>{deXuat.phut}</b> phút
        </div>
        {deXuat.cacLyDo.length > 0 && (
          <div style={{ ...NHAN_NHO, marginTop: 'var(--k1)' }}>{deXuat.cacLyDo.join(' · ')}</div>
        )}
      </div>

      {/* Cảnh báo cần HÀNH ĐỘNG: câu cả lớp sai chưa chữa kịp (kèm số phút cần thêm), em chưa có lượt… */}
      {canhBao.length > 0 && (
        <div style={{ marginTop: 'var(--k2)', display: 'grid', gap: 'var(--k1)' }}>
          {canhBao.map((c) => (
            <OThongBao key={c} tone="cam">
              {c}
            </OThongBao>
          ))}
        </div>
      )}

      {deXuat.em.length > 0 && (
        <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)', minWidth: 0, overflowWrap: 'anywhere' }} data-em-can-chu-y>
          <span style={SO}>{deXuat.soEm}</span> em lên bảng
          {soEmNhieuLuot > 0 ? (
            <>
              {' '}
              · <span style={SO}>{soEmNhieuLuot}</span> em nhiều lượt
            </>
          ) : null}
          : {chuEmCanChuY(deXuat.em)}
        </div>
      )}

      {boQua.khongCoTrongKho > 0 && (
        <div style={{ ...NHAN_NHO, marginTop: 'var(--k1)' }}>
          <span style={SO}>{boQua.khongCoTrongKho}</span> câu chưa có trên máy này — đồng bộ đề ở Ngân hàng câu hỏi để thêm.
        </div>
      )}
      {boQua.tuLuan > 0 && (
        <div style={{ ...NHAN_NHO, marginTop: 'var(--k1)' }}>
          <span style={SO}>{boQua.tuLuan}</span> câu tự luận không đưa vào buổi xếp sẵn — thầy vẫn thêm tay được.
        </div>
      )}

      <div className="flex flex-wrap items-center" style={{ gap: 'var(--k2) var(--k3)', marginTop: 'var(--k3)' }}>
        {hang.length > 0 && (
          <button
            type="button"
            onClick={() => setMoRong((m) => !m)}
            aria-expanded={moRong}
            className="tap-target inline-flex items-center gap-1 font-bold cursor-pointer"
            style={{ minHeight: 44, padding: '0 var(--k2)', background: 'none', border: 'none', color: 'var(--gg-xanh)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)' }}
          >
            {moRong ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {moRong ? 'Thu gọn' : `Xem ${hang.length} câu (thứ tự chữa)`}
          </button>
        )}
        <div style={{ flex: '1 1 240px', maxWidth: 360, minWidth: 0, marginLeft: 'auto' }}>
          <NutChinh variant="phu" onClick={onTuChon}>
            Tự chọn lại
          </NutChinh>
        </div>
      </div>

      {/* Danh sách câu theo ĐÚNG thứ tự chữa: nhóm CHỮA (kèm em được gọi) rồi nhóm CHỈ ĐỌC ĐÁP ÁN. */}
      {moRong && hang.length > 0 && (
        <ol data-ds-cau style={{ margin: 'var(--k3) 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 'var(--k1)' }}>
          {hang.map((h, i) => (
            <li key={`${h.nhom}-${h.qid}-${i}`} style={{ ...NHAN_NHO, display: 'flex', gap: 'var(--k2)', minWidth: 0 }}>
              <span style={{ ...SO, color: 'var(--nhat)', minWidth: 18, textAlign: 'right' }}>{i + 1}.</span>
              <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                <b style={{ color: 'var(--muc)' }}>{tenCau(h)}</b>
                {h.nhom === 'chua' ? (
                  <>
                    {' → '}
                    {h.hoTen?.trim() || h.sbd}
                    {h.luotCuaEm && h.luotCuaEm > 1 ? ` (lượt ${h.luotCuaEm})` : ''}
                  </>
                ) : (
                  ' · chỉ đọc đáp án'
                )}
                {h.lyDo ? ` · ${h.lyDo}` : ''}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}


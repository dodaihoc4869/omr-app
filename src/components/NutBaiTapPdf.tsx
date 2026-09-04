// NÚT TẠO PHIẾU BÀI TẬP PDF cho một em, đặt trong hồ sơ chi tiết của em.
//
// Khác nút "Giao bài tập": giao bài tập tạo một CA trong app cho em làm và chấm
// tự động; nút này ra một TỜ GIẤY thầy tải về, in ra hoặc gửi thẳng qua Zalo cho
// em nào không dùng app.
//
// Chọn câu và bậc tiến bộ nằm ở lib/bai-tap-pdf.ts, vẽ PDF ở lib/ve-bai-tap-pdf.ts
// — ở đây chỉ lo bấm nút, báo trạng thái và nói thật kết quả (thiếu câu, phải
// lấy lại câu cũ) thay vì im lặng đưa ra một tờ giấy không đúng ý.
import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { NutChinh, OThongBao } from './DesignSystem'
import { chonCauLuyen, tenTepBaiTap, type CauLuyen } from '../lib/bai-tap-pdf'
import { veBaiTapPdf } from '../lib/ve-bai-tap-pdf'
import { loadExamSources, loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { qidDaLam } from '../lib/exam-api'
import type { ChuyenDeEm } from '../lib/exam-api'
import { laYeu } from './HoSoEmView'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }

export const SO_CAU_PDF = 10

export default function NutBaiTapPdf({
  sbd,
  hoTen,
  lop,
  chuyenDe,
  showToast,
}: {
  sbd: string
  hoTen: string
  lop: string
  chuyenDe: ChuyenDeEm[]
  showToast: (chu: string, kieu?: 'success' | 'error' | 'warn') => void
}) {
  const [dang, setDang] = useState(false)
  const [ketQua, setKetQua] = useState<{ soCau: number; lapLai: number; thieu: number; ten: string } | null>(null)

  // Chuyên đề để luyện: ưu tiên chuyên đề ĐỦ DỮ LIỆU và đang yếu (laYeu dùng
  // chung một ngưỡng với bảng mạnh–yếu, hai chỗ không được nói khác nhau).
  // Không có chuyên đề nào đủ yếu thì lấy chuyên đề sai nhiều nhất, còn chưa có
  // dữ liệu gì thì để rỗng và rút từ cả kho.
  const yeu = chuyenDe.filter((c) => laYeu(c))
  const dungDe = (yeu.length > 0 ? yeu : [...chuyenDe].filter((c) => c.soSai > 0).sort((a, b) => b.tiLeSai - a.tiLeSai).slice(0, 2)).map((c) => ({
    ten: c.ten,
    tiLeSai: c.tiLeSai,
  }))

  const tao = async () => {
    setDang(true)
    setKetQua(null)
    try {
      const nguon = await loadExamSources()
      if (nguon.length === 0) throw new Error('Máy này chưa có đề nào. Vào Ngân hàng câu hỏi bấm Đồng bộ trước.')

      // Câu em đã làm — để tránh phát lại. Mất mạng thì vẫn ra phiếu, chỉ là
      // không tránh được câu cũ; nói rõ chứ không giấu.
      let daLam: string[] = []
      try {
        const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
        if (url.trim() && mat.trim()) daLam = await qidDaLam(url.trim(), mat.trim(), sbd)
      } catch {
        daLam = []
      }

      const kq = chonCauLuyen(nguon, { chuyenDe: dungDe, qidDaLam: daLam, soCau: SO_CAU_PDF })
      if (kq.cau.length === 0) {
        throw new Error(
          dungDe.length > 0
            ? `Kho đề chưa có câu nào thuộc ${dungDe.map((c) => c.ten).join(', ')} (câu có hình không đưa vào phiếu in).`
            : 'Kho đề chưa có câu nào dùng được cho phiếu in.',
        )
      }

      const doc = veBaiTapPdf({
        hoTen,
        sbd,
        lop,
        ngay: new Date(),
        chuyenDe: (yeu.length > 0 ? yeu : chuyenDe).map((c) => ({ ten: c.ten, soCau: c.soCau, soSai: c.soSai })),
        cau: kq.cau as CauLuyen[],
        lapLai: kq.lapLai,
      })
      const ten = tenTepBaiTap(hoTen, sbd)
      doc.save(ten)
      setKetQua({ soCau: kq.cau.length, lapLai: kq.lapLai, thieu: kq.thieu, ten })
      showToast(`Đã tải ${ten}`, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không tạo được phiếu bài tập', 'error')
    } finally {
      setDang(false)
    }
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
      <NutChinh variant="phu" onClick={() => void tao()} disabled={dang}>
        <span className="inline-flex items-center" style={{ gap: 6 }}>
          {dang ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
          {dang ? 'Đang dựng phiếu…' : `Tải phiếu bài tập PDF (${SO_CAU_PDF} câu)`}
        </span>
      </NutChinh>
      <div style={NHAN_NHO}>
        {dungDe.length > 0
          ? `Rút từ kho đề theo chuyên đề em đang yếu: ${dungDe.map((c) => c.ten).join(', ')}. Ưu tiên câu em chưa làm, xếp từ dễ lên khó.`
          : 'Em chưa đủ dữ liệu để chọn chuyên đề yếu — phiếu sẽ rút từ cả kho đề.'}
      </div>
      {ketQua && (
        <OThongBao tone={ketQua.thieu > 0 || ketQua.lapLai > 0 ? 'cam' : 'xanh'}>
          {`Đã tải ${ketQua.ten}: ${ketQua.soCau} câu kèm lời giải.`}
          {ketQua.lapLai > 0 && ` Trong đó ${ketQua.lapLai} câu em đã từng làm (kho hết câu mới).`}
          {ketQua.thieu > 0 && ` Còn thiếu ${ketQua.thieu} câu so với ${SO_CAU_PDF} câu.`}
        </OThongBao>
      )}
    </div>
  )
}

import TheCau from '../TheCau'
import type { CauDayHoc } from '../../lib/day-hoc-len-bang'
import { chuanHoaLoiGiaiCau } from '../../lib/chuan-hoa-loi-giai'

/**
 * Hiển thị câu hỏi kèm lời giải chi tiết ĐÚNG CHUẨN theo component TheCau (chế độ xem_lai)
 * dùng chung cho cả mục Dạy học và Kiểm tra đầu giờ.
 */
export default function TheCauHienThi({ c, stt }: { c: CauDayHoc; stt?: number }) {
  const q = c.q as any
  const exp = q.explanation || q.huongDanGiai || q.loiGiaiChiTiet
  let lg: any = q.loiGiai
  if (!lg && (exp || q.kienThucCotLoi || q.giaiThich)) {
    const raw = exp || q.kienThucCotLoi || q.giaiThich
    const ch = chuanHoaLoiGiaiCau(raw, c.phan, q.correct)
    if (!ch.thieu) {
      const tungPa: Record<string, { dung: boolean; viSao: string }> = {}
      const tungY: Record<string, { dung: boolean; viSao: string }> = {}
      if (ch.lyDo) {
        for (const ld of ch.lyDo) {
          if (c.phan === 'I') tungPa[ld.khoa] = { dung: ld.dung, viSao: ld.ly }
          if (c.phan === 'II') tungY[ld.khoa.toLowerCase()] = { dung: ld.dung, viSao: ld.ly }
        }
      }
      lg = {
        chot: ch.chot,
        tungPa: Object.keys(tungPa).length ? tungPa : undefined,
        tungY: Object.keys(tungY).length ? tungY : undefined,
        buoc: ch.buoc ?? undefined,
        ketQua: ch.ketQua || undefined,
      }
    } else if (q.kienThucCotLoi) {
      lg = { chot: q.kienThucCotLoi }
    }
  }
  const tieuDe = c.tenDang || c.chuyenDe || q.tieuDe

  if (c.phan === 'I') {
    return (
      <div style={{ marginTop: 8, marginBottom: 8 }}>
        <TheCau
          cheDo="xem_lai"
          phan="I"
          stt={stt ?? 1}
          tieuDe={tieuDe}
          text={q.text || ''}
          thanCauImg={q.thanCauImg || q.promptImg}
          table={q.table}
          imageDataUrl={q.imageDataUrl}
          hinhAnh={q.hinhAnh}
          choices={q.choices || []}
          choiceImgs={q.choiceImgs}
          correct={q.correct}
          selected={null}
          choicePerm={[0, 1, 2, 3]}
          explanation={exp}
          loiGiai={lg}
          nhanLoiGiai={q.loiGiaiTrangThai}
        />
      </div>
    )
  }

  if (c.phan === 'II') {
    return (
      <div style={{ marginTop: 8, marginBottom: 8 }}>
        <TheCau
          cheDo="xem_lai"
          phan="II"
          stt={stt ?? 1}
          tieuDe={tieuDe}
          text={q.text || ''}
          thanCauImg={q.thanCauImg || q.promptImg}
          table={q.table}
          imageDataUrl={q.imageDataUrl}
          hinhAnh={q.hinhAnh}
          ideas={q.ideas || []}
          ideaImgs={q.ideaImgs}
          correct={q.correct || [null, null, null, null]}
          selected={[null, null, null, null]}
          explanation={exp}
          loiGiai={lg}
          nhanLoiGiai={q.loiGiaiTrangThai}
        />
      </div>
    )
  }

  return (
    <div style={{ marginTop: 8, marginBottom: 8 }}>
      <TheCau
        cheDo="xem_lai"
        phan="III"
        stt={stt ?? 1}
        tieuDe={tieuDe}
        text={q.text || ''}
        thanCauImg={q.thanCauImg || q.promptImg}
        table={q.table}
        imageDataUrl={q.imageDataUrl}
        hinhAnh={q.hinhAnh}
        correct={q.correct ?? null}
        selected={null}
        explanation={exp}
        loiGiai={lg}
        tuLuan={c.tuLuan}
        nhanLoiGiai={q.loiGiaiTrangThai}
      />
    </div>
  )
}

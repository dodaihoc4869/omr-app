// KHỐI GỬI PHỤ HUYNH — tin nhắn chữ + ẢNH PHIẾU, dùng chung ở hồ sơ em và ở
// chi tiết ca. Một khối, hai lối vào: sửa một chỗ là cả hai màn đổi theo.
//
// Ba việc thầy làm ở đây, đúng thứ tự thật khi ngồi chấm xong:
//   1. sửa dòng "việc cần làm" (máy không biết nguyên nhân, đoán là bịa),
//   2. copy tin nhắn chữ,
//   3. chạm vào ảnh phiếu → chia sẻ thẳng sang Zalo, hoặc tải về.
//
// Dòng "việc cần làm" đi vào CẢ tin nhắn lẫn ảnh — sửa một lần, hai thứ khớp nhau.
//
// ĐỔI 04-09: thứ gửi qua Zalo là TIN NHẮN CHỮ KÈM LINK PHIẾU, không gửi ảnh
// nữa. Ảnh vẫn dựng ở đây để thầy xem và tải khi cần (in ra, lưu hồ sơ), nhưng
// không nằm trong luồng gửi.
import { useEffect, useMemo, useRef, useState } from 'react'
import { ClipboardCopy, Check, Download, Eye, Share2 } from 'lucide-react'
import { TheNoiDung, OThongBao, NutChinh } from './DesignSystem'
import { classify } from '../engine/score'
import { soanPhieuZalo, viecCanLamMacDinh, demChu, NHAC_TRUOC_KHI_GUI, NHAN_KHOI, type DuLieuPhieu } from '../lib/phieu-zalo'
import { veAnhPhieu, tenTepPhieu, type DuLieuAnhPhieu } from '../lib/anh-phieu'
import { taoLinkPhieu } from '../lib/phieu-link'
import { dungPhieu } from '../lib/phieu-du-lieu'
import { luuPhieu, qidDaLam, sinhMaPhieu, xoaPhieu, type ChiTietCauRow } from '../lib/exam-api'
import { loadExamSources, loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import type { TeacherExamSource } from '../data/examContent'
import type { HoSoEm } from '../lib/exam-api'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const TIEU_DE: React.CSSProperties = { fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', fontWeight: 700 }

/** Ca dùng để soạn phiếu: mặc định ca gần nhất đã chấm; màn Chi tiết ca truyền
 * đúng mã ca đang mở để phiếu nói về CA ĐÓ, không phải ca mới nhất của em. */
function chonCa(hoSo: HoSoEm, maCa?: string) {
  if (maCa) {
    const c = hoSo.ca.find((x) => x.maCa === maCa && x.tong !== null)
    if (c) return c
  }
  return hoSo.caGanNhat
}

export default function PhieuZaloEm({
  hoSo,
  maCa,
  showToast,
  rows,
  banks,
  diemLop,
  thoiLuongPhut,
  vaoLuc,
}: {
  hoSo: HoSoEm
  /** Mã ca cần làm phiếu. Bỏ trống = ca gần nhất đã chấm. */
  maCa?: string
  showToast: (chu: string, kieu?: 'success' | 'error' | 'warn') => void
  /** Bảng chấm từng câu của em trong ca này. Thiếu thì báo cáo bỏ phần cách làm
   * bài và phần câu sai — không dựng phần rỗng. */
  rows?: ChiTietCauRow[] | null
  banks?: TeacherExamSource[] | null
  /** Điểm mọi em trong ca (không kèm tên) để vẽ phân bố lớp. */
  diemLop?: number[] | null
  thoiLuongPhut?: number | null
  vaoLuc?: string | null
}) {
  const ca = chonCa(hoSo, maCa)
  const khungAnh = useRef<HTMLDivElement | null>(null)
  const [daCopy, setDaCopy] = useState(false)
  const [dangTai, setDangTai] = useState(false)

  // Chuyên đề mất điểm CỦA RIÊNG CA NÀY. Phiếu gửi phụ huynh mà lấy số cộng dồn
  // mọi ca là nói sai về bài vừa làm.
  const chuyenDeCa = useMemo(
    () => hoSo.chuyenDeCaGanNhat.filter((c) => c.soSai > 0).sort((a, b) => b.soSai - a.soSai),
    [hoSo.chuyenDeCaGanNhat],
  )

  const duPhieu: DuLieuPhieu | null = useMemo(() => {
    if (!ca || ca.tong === null) return null
    const yeuNhat = chuyenDeCa[0] ?? null
    return {
      hoTen: hoSo.em.hoTen || `SBD ${hoSo.em.sbd}`,
      ngay: ca.nopLuc,
      diem: ca.tong,
      xepLoai: classify(ca.tong),
      diemPhan: ca.diemI !== null && ca.diemII !== null && ca.diemIII !== null ? { I: ca.diemI, II: ca.diemII, III: ca.diemIII } : null,
      soCauSai: hoSo.soCauSaiCaGanNhat,
      chuyenDeSai: yeuNhat ? { ten: yeuNhat.ten, soSai: yeuNhat.soSai } : null,
      baiTapDaGiao: null,
    }
  }, [ca, chuyenDeCa, hoSo])

  const [viec, setViec] = useState('')
  useEffect(() => {
    setViec(duPhieu ? viecCanLamMacDinh(duPhieu) : '')
  }, [duPhieu])

  const [link, setLink] = useState('')
  const tin = duPhieu ? soanPhieuZalo(duPhieu, viec.trim() || undefined, link) : ''

  const duAnh: DuLieuAnhPhieu | null = useMemo(() => {
    if (!ca || ca.tong === null || !duPhieu) return null
    const tong = chuyenDeCa.reduce((s, c) => s + c.soCau, 0)
    return {
      hoTen: hoSo.em.hoTen,
      sbd: hoSo.em.sbd,
      lop: hoSo.em.lop || ca.lop,
      tenCa: ca.tenCa,
      ngay: ca.nopLuc,
      diem: ca.tong,
      xepLoai: classify(ca.tong),
      diemPhan: duPhieu.diemPhan,
      toiDaPhan: null,
      soCauSai: hoSo.soCauSaiCaGanNhat,
      tongSoCau: tong > 0 ? tong : null,
      hang: ca.hang,
      siSo: ca.siSo,
      chuyenDe: chuyenDeCa,
      vieCanLam: viec.trim() || viecCanLamMacDinh(duPhieu),
    }
  }, [ca, chuyenDeCa, duPhieu, hoSo, viec])

  // LINK BÁO CÁO: đẩy báo cáo lên kho rồi lấy mã 16 ký tự. Mã giữ nguyên cho
  // một cặp (em, ca) trong suốt phiên — thầy sửa dòng "việc cần làm" thì báo
  // cáo được GHI ĐÈ lên đúng mã cũ, không đẻ ra một phiếu mồ côi mỗi lần gõ.
  // Chờ 1,2 giây sau lần gõ cuối rồi mới đẩy, kẻo mỗi chữ một lần gọi máy chủ.
  const maRef = useRef<{ khoa: string; ma: string } | null>(null)
  useEffect(() => {
    if (!duPhieu || !ca) {
      setLink('')
      return
    }
    let con = true
    const hen = setTimeout(() => {
      void (async () => {
        try {
          const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
          if (!url.trim() || !mat.trim()) {
            if (con) setLink('')
            return
          }
          const khoa = `${hoSo.em.sbd}:${ca.maCa}`
          if (maRef.current?.khoa !== khoa) maRef.current = { khoa, ma: sinhMaPhieu() }
          const ma = maRef.current.ma
          // Kho đề + câu em đã làm: để rút sẵn 10 câu luyện gói vào báo cáo, cho
          // phụ huynh bấm một nút là tải được phiếu PDF trên máy mình.
          const [khoDe, qidCu] = await Promise.all([
            loadExamSources().catch(() => []),
            qidDaLam(url.trim(), mat.trim(), hoSo.em.sbd).catch(() => [] as string[]),
          ])
          const phieu = dungPhieu({
            hoSo,
            ca,
            chuyenDeCa,
            vieCanLam: viec.trim() || viecCanLamMacDinh(duPhieu),
            rows,
            banks,
            diemLop,
            thoiLuongPhut,
            vaoLuc,
            khoDe,
            qidDaLam: qidCu,
          })
          await luuPhieu(url.trim(), mat.trim(), { ma, maCa: ca.maCa, sbd: hoSo.em.sbd, hoTen: hoSo.em.hoTen, phieu })
          if (con) setLink(taoLinkPhieu(`${location.origin}${import.meta.env.BASE_URL}`, ma))
        } catch {
          // Mất mạng hoặc chưa cấu hình: tin nhắn chữ vẫn gửi được, chỉ mất
          // khối XEM PHIẾU. KHÔNG dán một link chết vào tin của thầy.
          if (con) setLink('')
        }
      })()
    }, 1200)
    return () => {
      con = false
      clearTimeout(hen)
    }
  }, [duPhieu, ca, hoSo, chuyenDeCa, viec, rows, banks, diemLop, thoiLuongPhut, vaoLuc])

  /** Thu hồi: xoá mã trên kho là link đã gửi chết ngay. Đây là thứ cách cũ
   * (nhét dữ liệu vào link) không làm được. */
  const thuHoi = async () => {
    const ma = maRef.current?.ma
    if (!ma) return
    try {
      const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
      await xoaPhieu(url.trim(), mat.trim(), ma)
      maRef.current = null
      setLink('')
      showToast('Đã thu hồi. Link đã gửi cho phụ huynh không mở được nữa.', 'success')
    } catch (e) {
      showToast(`Chưa thu hồi được: ${e instanceof Error ? e.message : 'lỗi không rõ'}`, 'error')
    }
  }

  // Vẽ lại ảnh mỗi khi số liệu hoặc dòng "việc cần làm" đổi. Vẽ vào DOM luôn để
  // thầy thấy đúng thứ sẽ tải về, không phải tải rồi mới biết nó ra sao.
  useEffect(() => {
    const o = khungAnh.current
    if (!o || !duAnh) return
    o.replaceChildren()
    try {
      const cv = veAnhPhieu(duAnh)
      cv.style.width = '100%'
      cv.style.height = 'auto'
      cv.style.display = 'block'
      cv.style.borderRadius = 'var(--bo-2)'
      cv.setAttribute('role', 'img')
      cv.setAttribute('aria-label', `Ảnh phiếu kết quả của ${duAnh.hoTen || duAnh.sbd}`)
      o.appendChild(cv)
    } catch {
      /* máy không vẽ được canvas — khối ảnh để trống, tin nhắn chữ vẫn dùng được */
    }
  }, [duAnh])

  const copyTin = async () => {
    try {
      await navigator.clipboard.writeText(tin)
      setDaCopy(true)
      setTimeout(() => setDaCopy(false), 2500)
      showToast(`Đã copy tin nhắn. ${NHAC_TRUOC_KHI_GUI}`, 'success')
    } catch {
      showToast(tin, 'success')
    }
  }

  /** Chạm vào ảnh: máy có chia sẻ tệp thì mở thẳng bảng chia sẻ (chọn Zalo là
   * xong, không phải qua thư viện ảnh); không có thì tải về máy. */
  const luuAnh = async () => {
    const cv = khungAnh.current?.querySelector('canvas') as HTMLCanvasElement | null
    if (!cv || !duAnh) return
    setDangTai(true)
    try {
      const blob = await new Promise<Blob | null>((ok) => cv.toBlob(ok, 'image/png'))
      if (!blob) throw new Error('Không tạo được ảnh')
      const ten = tenTepPhieu(duAnh.hoTen, duAnh.sbd, duAnh.ngay)
      const tep = new File([blob], ten, { type: 'image/png' })
      const nv = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
      if (nv.share && nv.canShare?.({ files: [tep] })) {
        await nv.share({ files: [tep], title: `Phiếu kết quả ${duAnh.hoTen}` })
        return
      }
      const u = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = u
      a.download = ten
      a.click()
      setTimeout(() => URL.revokeObjectURL(u), 4000)
      showToast(`Đã tải ${ten}`, 'success')
    } catch (e) {
      // Người dùng bấm Huỷ ở bảng chia sẻ cũng ném lỗi — không báo đỏ vô cớ.
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        showToast(e instanceof Error ? e.message : 'Không lưu được ảnh', 'error')
      }
    } finally {
      setDangTai(false)
    }
  }

  if (!ca || ca.tong === null) {
    return (
      <TheNoiDung>
        <div style={TIEU_DE}>Gửi phụ huynh</div>
        <OThongBao tone="cam">Em chưa có ca nào đã chấm điểm — chưa soạn được phiếu.</OThongBao>
      </TheNoiDung>
    )
  }

  return (
    <TheNoiDung>
      <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
        <div style={TIEU_DE}>Gửi phụ huynh</div>
        <div style={NHAN_NHO}>
          Bài {ca.tenCa || `mã ${ca.maCa}`} · {ca.tong.toFixed(2).replace('.', ',')} điểm
        </div>

        {/* VIỆC CẦN LÀM — máy không biết nguyên nhân em sai, đoán là bịa. Thầy
            gõ vào đây; chữ này vào cả tin nhắn lẫn ảnh. */}
        <label className="flex flex-col" style={{ gap: 'var(--k1)' }}>
          <span style={NHAN_NHO}>Việc cần làm (thầy sửa trước khi gửi — dòng này vào cả tin nhắn và ảnh)</span>
          <textarea
            value={viec}
            onChange={(e) => setViec(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: 'var(--k3)',
              borderRadius: 'var(--bo-1)',
              border: '1px solid var(--vien-dam)',
              background: 'var(--the-2)',
              color: 'var(--muc)',
              fontFamily: 'var(--serif)',
              fontSize: 'var(--cx-2)',
              lineHeight: 1.5,
              resize: 'vertical',
            }}
          />
        </label>

        {/* TIN NHẮN CHỮ — xem trước ĐÚNG như phụ huynh sẽ thấy: xuống dòng
            thật, các khối tách nhau. Nhãn khối tô đậm ở đây cho dễ đọc; bản
            copy đi vẫn là chữ thuần, vì Zalo không hiện chữ đậm. */}
        <div
          style={{
            padding: 'var(--k4)',
            borderRadius: 'var(--bo-1)',
            background: 'var(--the-2)',
            fontFamily: 'var(--serif)',
            fontSize: 'var(--cx-2)',
            lineHeight: 1.6,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--k2)',
          }}
        >
          {tin.split('\n').map((dong, i) => {
            const nhan = NHAN_KHOI.find((n) => dong.startsWith(n))
            if (!dong.trim()) return <div key={i} style={{ height: 2 }} />
            return (
              <div key={i}>
                {nhan ? (
                  <>
                    <b>{nhan}</b>
                    {dong.slice(nhan.length)}
                  </>
                ) : (
                  dong
                )}
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between" style={{ gap: 'var(--k2)' }}>
          <span style={NHAN_NHO}>{demChu(tin)} chữ</span>
          <button
            type="button"
            onClick={() => void copyTin()}
            className="tap-target inline-flex items-center font-bold"
            style={{ gap: 6, minHeight: 40, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: daCopy ? 'var(--xanh-nen)' : 'var(--the-2)', color: daCopy ? 'var(--xanh)' : 'var(--muc)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', border: 'none' }}
          >
            {daCopy ? <Check size={16} /> : <ClipboardCopy size={16} />} {daCopy ? 'Đã copy' : 'Copy tin nhắn'}
          </button>
        </div>

        {/* XEM BÁO CÁO: thầy mở đúng thứ phụ huynh sẽ thấy, trước khi gửi đi.
            Gửi rồi mới phát hiện sai thì đã muộn. */}
        {link && (
          <div className="flex items-center flex-wrap justify-between" style={{ gap: 'var(--k2)', marginTop: 'calc(var(--k2) * -1)' }}>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target inline-flex items-center font-bold"
              style={{ gap: 6, minHeight: 36, padding: '0 var(--k4)', borderRadius: 'var(--bo-tron)', background: 'var(--phu)', color: 'var(--phu-dam)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', textDecoration: 'none' }}
            >
              <Eye size={16} /> Xem báo cáo
            </a>
            <button
              type="button"
              onClick={() => void thuHoi()}
              className="tap-target inline-flex items-center font-bold"
              style={{ gap: 6, minHeight: 36, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: 'var(--do-nen)', color: 'var(--do)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', border: 'none' }}
            >
              Thu hồi link
            </button>
          </div>
        )}

        {/* ẢNH PHIẾU — PHƯƠNG ÁN DỰ PHÒNG, thầy chọn gửi kiểu nào tuỳ lúc: tin
            nhắn kèm link, hay tin nhắn kèm ảnh. Ảnh mở được cả khi phụ huynh
            mất mạng và không cần bấm vào đâu. */}
        <div style={NHAN_NHO}>Ảnh phiếu — dự phòng khi thầy muốn gửi ảnh thay vì link. Chạm để tải về hoặc chia sẻ.</div>
        <button
          type="button"
          onClick={() => void luuAnh()}
          disabled={dangTai}
          aria-label="Chạm để tải ảnh phiếu về máy"
          style={{ display: 'block', width: '100%', padding: 0, border: 'none', background: 'transparent', borderRadius: 'var(--bo-2)', boxShadow: 'var(--bong-2)', cursor: 'pointer', opacity: dangTai ? 0.6 : 1 }}
        >
          <div ref={khungAnh} />
        </button>
        <NutChinh variant="phu" onClick={() => void luuAnh()} disabled={dangTai}>
          <span className="inline-flex items-center" style={{ gap: 6 }}>
            {typeof navigator !== 'undefined' && 'share' in navigator ? <Share2 size={18} /> : <Download size={18} />}
            {dangTai ? 'Đang lưu ảnh…' : 'Gửi / tải ảnh phiếu'}
          </span>
        </NutChinh>
      </div>
    </TheNoiDung>
  )
}

// NÚT TẠO PHIẾU BÀI TẬP PDF cho một em, đặt trong hồ sơ chi tiết của em.
//
// Khác nút "Giao bài tập": giao bài tập tạo một CA trong app cho em làm và chấm
// tự động; nút này ra một TỜ GIẤY thầy tải về, in ra hoặc gửi thẳng qua Zalo cho
// em nào không dùng app.
//
// LẦN SAU KHÁC LẦN TRƯỚC: mã câu đã in ra phiếu được nhớ lại ngay trên máy thầy
// (exam-db: qidRaPhieu). Máy chủ chỉ biết câu em đã NỘP, mà phiếu in ra thì em
// đã cầm rồi dù chưa nộp — thiếu sổ này là lần sau phát lại đúng đề cũ.
//
// jsPDF và font nhúng nặng gần 300KB, nên cả bộ vẽ được NẠP ĐỘNG lúc thầy bấm
// nút: người không dùng tới không phải tải.
import { useEffect, useState } from 'react'
import { OThongBao } from './DesignSystem'
import NutPhieuHtml from './NutPhieuHtml'
import { tenTepBaiTap } from '../lib/bai-tap-pdf'
import ThanhSoCauChua from './ThanhSoCauChua'
import { SO_CAU_MAC_DINH } from '../lib/cau-hinh-chua'
import { rutDeChua, rutTuDo, type PoolCauSai, type SuatThieu } from '../lib/rut-de-chua'
import type { ChiTietCauRow } from '../lib/exam-api'
import { LOC_DANG_MAC_DINH, MOI_LOC_DANG, TEN_LOC_DANG, type LocDang } from '../lib/dang-cau'
import { docQidRaPhieu, loadExamSources, loadScriptUrl, loadTeacherSecret, themQidRaPhieu, xoaQidRaPhieu } from '../lib/exam-db'
import { qidDaLam } from '../lib/exam-api'
import type { ChuyenDeEm } from '../lib/exam-api'
import { laYeu } from './HoSoEmView'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }

/** v4 mục 9 cấm trần cứng số câu chữa: `SO_CAU_PDF_TOI_DA`/`TOI_THIEU` đã bỏ,
 * trần nay là `tongUngVien` do kho quyết định. Giữ mặc định để màn không có câu
 * sai (bài luyện thường) vẫn có điểm khởi đầu. */
export const SO_CAU_PDF_MAC_DINH = 10
/** Mức chọn nhanh — thầy bấm một cái là xong, khỏi kéo thanh trượt. */
export const MUC_SO_CAU = [10, 20, 30, 40, 50, 60]

export default function NutBaiTapPdf({
  sbd,
  hoTen,
  chuyenDe,
  chuyenDeCa = [],
  maCa,
  rows,
  showToast,
}: {
  sbd: string
  hoTen: string
  /** Giữ trong kiểu để nơi gọi không phải sửa; bìa phiếu không in lớp. */
  lop?: string
  chuyenDe: ChuyenDeEm[]
  /** MỌI chuyên đề của ca em vừa thi — kể cả chuyên đề em làm đúng hết.
   *
   * Thầy chốt 06/09: "phải rút đúng chuyên đề đã chọn thi ca đó, không được
   * rút ngoài". Rỗng = không biết ca nào (màn Học sinh mở từ hồ sơ chung) ⇒
   * giữ nguyên luật cũ. */
  chuyenDeCa?: string[]
  /** Ca em vừa thi. Có `maCa` + `rows` thì phiếu đi qua cổng `rutDeChua()`:
   * rút đúng đề đã tích và gắn nhãn "chữa câu mấy" cho từng câu. */
  maCa?: string
  rows?: ChiTietCauRow[] | null
  showToast: (chu: string, kieu?: 'success' | 'error' | 'warn') => void
}) {
  const [soCau, setSoCau] = useState(SO_CAU_MAC_DINH)
  const [dang, setDang] = useState<LocDang>(LOC_DANG_MAC_DINH)
  // Mặc định BÓ trong ca. Thầy vẫn nới ra được khi muốn ôn rộng, nhưng phải
  // chủ động bấm — im lặng rút ngoài ca là thứ thầy vừa bắt được.
  const [boTrongCa, setBoTrongCa] = useState(true)
  const [thieuChua, setThieuChua] = useState<{ soCau: number; tenDang: string; vi: string }[]>([])
  // Chữa được khi biết ca nào VÀ có bảng chấm từng câu. Thiếu một trong hai thì
  // không có câu sai để gắn nhãn, và đặc tả cấm câu không nhãn vào phiếu chữa.
  const chuaDuoc = Boolean(maCa && rows && rows.some((r) => r.dungSai === false))
  const coPhamViCa = chuyenDeCa.length > 0
  const phamVi = coPhamViCa && boTrongCa ? chuyenDeCa : undefined
  const [daRa, setDaRa] = useState(0)
  const [ketQua, setKetQua] = useState<{ soCau: number; lapLai: number; thieu: number; ten: string } | null>(null)
  /** ĐẾM ỨNG VIÊN (v4 mục 4.2) — max của thanh kéo. Chạy thuần trên máy, không
   * gọi mạng: đếm phải xong trước khi thầy kịp nhìn thanh. */
  const [dem, setDem] = useState<{ tongUngVien: number; poolTheoCauSai: PoolCauSai[]; thieu: SuatThieu[] } | null>(null)
  useEffect(() => {
    let con = true
    void (async () => {
      if (!chuaDuoc) {
        if (con) setDem(null)
        return
      }
      const nguon = await loadExamSources()
      const daInRa = await docQidRaPhieu(sbd)
      const kq = rutDeChua({ khoDe: nguon, rows: rows ?? [], qidTranh: daInRa, soCau: 0 })
      if (!con) return
      setDem({ tongUngVien: kq.tongUngVien, poolTheoCauSai: kq.poolTheoCauSai, thieu: kq.thieu })
      // Kẹp vị trí thanh xuống max mới — không để thanh chỉ 60 khi kho chỉ có 8.
      setSoCau((n) => Math.min(n, Math.max(1, kq.tongUngVien)))
    })()
    return () => {
      con = false
    }
  }, [chuaDuoc, rows, sbd])

  useEffect(() => {
    let con = true
    void docQidRaPhieu(sbd).then((ds) => con && setDaRa(ds.length))
    return () => {
      con = false
    }
  }, [sbd])

  // Chuyên đề để luyện: ưu tiên chuyên đề ĐỦ DỮ LIỆU và đang yếu (laYeu dùng
  // chung một ngưỡng với bảng mạnh–yếu, hai chỗ không được nói khác nhau).
  const yeu = chuyenDe.filter((c) => laYeu(c))
  const dungDe = (yeu.length > 0 ? yeu : [...chuyenDe].filter((c) => c.soSai > 0).sort((a, b) => b.tiLeSai - a.tiLeSai).slice(0, 2)).map((c) => ({
    ten: c.ten,
    tiLeSai: c.tiLeSai,
  }))

  // Rút câu rồi trả GÓI phiếu cho hai nút Xem / Copy link. Không dựng HTML ở
  // đây: hai nút cần cùng một bộ câu, dựng hai lần là ra hai bộ khác nhau.
  const dungGoi = async () => {
    setKetQua(null)
    try {
      const nguon = await loadExamSources()
      if (nguon.length === 0) throw new Error('Máy này chưa có đề nào. Vào Ngân hàng câu hỏi bấm Đồng bộ trước.')

      // Hai nguồn "câu em đã gặp": máy chủ biết câu em đã NỘP, máy thầy nhớ câu
      // đã IN RA PHIẾU. Thiếu vế nào cũng phát lại câu cũ.
      let daNop: string[] = []
      try {
        const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
        if (url.trim() && mat.trim()) daNop = await qidDaLam(url.trim(), mat.trim(), sbd)
      } catch {
        daNop = []
      }
      const daInRa = await docQidRaPhieu(sbd)
      const tranh = [...new Set([...daNop, ...daInRa])]

      // ĐI QUA CỔNG (v3 mục 2). Nguồn là CẢ KHO — ranh giới không còn là đề
      // đã tích nữa mà là MÃ DẠNG của chính câu em sai.
      const kqChua = chuaDuoc ? rutDeChua({ khoDe: nguon, rows: rows ?? [], qidTranh: tranh, soCau }) : null
      setThieuChua(kqChua?.thieu ?? [])
      const kq = kqChua ?? rutTuDo(nguon, { chuyenDe: dungDe, chuyenDeCa: phamVi, dang, qidDaLam: tranh, soCau })
      if (kq.cau.length === 0) {
        throw new Error(
          dungDe.length > 0
            ? `Kho đề chưa có câu nào thuộc ${dungDe.map((c) => c.ten).join(', ')}${dang === 'ngau_nhien' ? '' : ` ở dạng ${TEN_LOC_DANG[dang].toLowerCase()}`} (câu có hình không đưa vào phiếu in).`
            : `Kho đề chưa có câu nào dùng được cho phiếu in${dang === 'ngau_nhien' ? '' : ` ở dạng ${TEN_LOC_DANG[dang].toLowerCase()}`}.`,
        )
      }

      const nhomYeu = (yeu.length > 0 ? yeu : chuyenDe).filter((c) => c.soSai > 0)
      const tt = {
        hoTen,
        sbd,
        ngay: new Date(),
        tenChuyenDe: dungDe[0]?.ten || nhomYeu[0]?.ten || 'Hoá học',
        ketQua: nhomYeu.length > 0 ? `Sai ${nhomYeu.reduce((n, c) => n + c.soSai, 0)}/${nhomYeu.reduce((n, c) => n + c.soCau, 0)} câu` : '',
        hienDapAn: false,
      }
      await themQidRaPhieu(sbd, kq.cau.map((c) => c.id))
      setDaRa((n) => n + kq.cau.length)
      setKetQua({ soCau: kq.cau.length, lapLai: 'lapLai' in kq ? kq.lapLai : 0, thieu: kq.thieu.length, ten: tenTepBaiTap(hoTen, sbd) })
      return { tt, cau: kq.cau, sbd, maCa, thieuChua: kqChua?.thieu ?? [] }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không tạo được phiếu bài tập', 'error')
      return null
    }
  }

  const quenLichSu = async () => {
    await xoaQidRaPhieu(sbd)
    setDaRa(0)
    showToast('Đã xoá lịch sử phiếu của em này. Lần sau được phép lấy lại câu cũ.', 'success')
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
      {coPhamViCa && (
        <button
          type="button"
          role="switch"
          aria-checked={boTrongCa}
          onClick={() => setBoTrongCa((v) => !v)}
          className="tap-target flex items-center justify-between w-full"
          style={{ minHeight: 44, padding: '0 var(--k3)', borderRadius: 'var(--bo-1)', border: '1px solid var(--vien)', background: 'none', color: 'var(--muc)', fontFamily: 'var(--sans)', textAlign: 'left' }}
        >
          <span style={{ fontSize: 'var(--cx-1)' }}>
            Chỉ rút trong {chuyenDeCa.length} chuyên đề của ca này
          </span>
          <span className="font-bold" style={{ fontSize: 'var(--cx-0)', color: boTrongCa ? 'var(--phu-dam)' : 'var(--nhat)' }}>
            {boTrongCa ? 'ĐANG BẬT' : 'ĐANG TẮT'}
          </span>
        </button>
      )}

      {/* SUẤT CHỮA KHÔNG RÚT ĐƯỢC CÂU NÀO. Bỏ trống và nói lý do, tuyệt đối
          không thay bằng câu chuyên đề khác. */}
      {thieuChua.length > 0 && (
        <OThongBao tone="cam">
          Chưa chữa được {thieuChua.length} câu sai:{' '}
          {thieuChua.map((t) => t.vi).join('; ')}.
        </OThongBao>
      )}

      {/* DẠNG CÂU — thầy chốt 06/09, cùng ba lựa chọn với màn Rút đề. */}
      <div>
        <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>Dạng câu</div>
        <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }} role="radiogroup" aria-label="Dạng câu trong phiếu bài tập">
          {MOI_LOC_DANG.map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={dang === d}
              onClick={() => setDang(d)}
              className="tap-target font-bold"
              style={{
                minHeight: 40,
                padding: '0 var(--k4)',
                borderRadius: 'var(--bo-tron)',
                border: 'none',
                background: dang === d ? 'var(--phu-dam)' : 'var(--the-2)',
                color: dang === d ? 'var(--muc-nguoc)' : 'var(--muc)',
                fontFamily: 'var(--sans)',
                fontSize: 'var(--cx-1)',
              }}
            >
              {TEN_LOC_DANG[d]}
            </button>
          ))}
        </div>
        <div style={{ ...NHAN_NHO, marginTop: 'var(--k1)' }}>
          Nhãn lý thuyết / bài tập lấy thẳng từ kho. Đề nào chưa tải lại thì máy tạm phân loại từ mặt chữ, câu chưa chắc chỉ vào phiếu khi chọn Ngẫu nhiên.
        </div>
      </div>

      {/* THANH KÉO DÙNG CHUNG (v4 mục 6). Trần là `tongUngVien`, không phải
          một con số cứng của riêng màn này. */}
      {chuaDuoc && dem ? (
        <ThanhSoCauChua
          soCau={soCau}
          onDoi={setSoCau}
          tongUngVien={dem.tongUngVien}
          poolTheoCauSai={dem.poolTheoCauSai}
          thieu={dem.thieu}
          soCauSai={dem.poolTheoCauSai.length}
          
        />
      ) : (
        <div>
          <div style={{ ...NHAN_NHO, marginBottom: 'var(--k2)' }}>Số câu trong phiếu</div>
          <div className="flex flex-wrap" style={{ gap: 'var(--k2)' }}>
            {MUC_SO_CAU.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSoCau(n)}
                className="tap-target font-bold"
                style={{
                  minHeight: 40,
                  padding: '0 var(--k4)',
                  borderRadius: 'var(--bo-tron)',
                  border: 'none',
                  background: soCau === n ? 'var(--phu-dam)' : 'var(--the-2)',
                  color: soCau === n ? 'var(--muc-nguoc)' : 'var(--muc)',
                  fontFamily: 'var(--sans)',
                  fontSize: 'var(--cx-2)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div style={NHAN_NHO}>Ca này chưa có câu sai nào để chữa — phiếu là bài luyện thường.</div>
        </div>
      )}

      <NutPhieuHtml dungGoi={dungGoi} nhanXem={`Xem phiếu ${soCau} câu`} showToast={showToast} />

      <div style={NHAN_NHO}>
        {dungDe.length > 0
          ? `Rút từ kho đề theo chuyên đề em đang yếu: ${dungDe.map((c) => c.ten).join(', ')}. Xếp từ dễ lên khó.`
          : 'Em chưa đủ dữ liệu để chọn chuyên đề yếu — phiếu sẽ rút từ cả kho đề.'}
      </div>

      {daRa > 0 && (
        <div className="flex items-center justify-between" style={{ gap: 'var(--k2)' }}>
          <span style={NHAN_NHO}>Đã in {daRa} câu cho em này, phiếu sau tự tránh những câu đó.</span>
          <button
            type="button"
            onClick={() => void quenLichSu()}
            className="tap-target"
            style={{ ...NHAN_NHO, textDecoration: 'underline', background: 'none', border: 'none', flex: '0 0 auto' }}
          >
            Cho phép lấy lại
          </button>
        </div>
      )}

      {ketQua && (
        <OThongBao tone={ketQua.thieu > 0 || ketQua.lapLai > 0 ? 'cam' : 'xanh'}>
          {`Phiếu ${ketQua.soCau} câu kèm lời giải.`}
          {ketQua.lapLai > 0 && ` Trong đó ${ketQua.lapLai} câu em đã gặp (kho hết câu mới).`}
          {ketQua.thieu > 0 && ` Còn thiếu ${ketQua.thieu} câu so với ${soCau} câu đã chọn.`}
        </OThongBao>
      )}
    </div>
  )
}

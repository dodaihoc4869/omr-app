// CA CHẨN ĐOÁN — hai khối chọn đề, bật tắt ĐỘC LẬP, mỗi khối là CÂY BỐN TẦNG.
//
// Đặc tả MOCAVAGOILENBANG.md mục 3, có BA CHỖ THẦY CHỐT KHÁC (05/09 chiều):
//
//   1. Đặc tả: "khối ĐỀ MỚI chỉ tích được một đề". Thầy chốt: CẢ HAI KHỐI đều
//      tích được tới từng bài và từng dạng (trắc nghiệm · đúng sai · trả lời
//      ngắn), y như màn Mở ca kiểm tra. Một buổi hiếm khi bó trong một mã, và
//      "chỉ trắc nghiệm của bài này" là việc thầy làm thật.
//      Lõi chung vẫn lấy câu 2 sao trong ĐÚNG phần ĐỀ MỚI đã tích, nên mục đích
//      ban đầu (lõi nằm trong bài các em vừa làm ở nhà) vẫn giữ.
//   2. Đặc tả: ca chẩn đoán không vào sổ điểm, tắt chống gian lận. Thầy chốt:
//      GHI DỮ LIỆU ĐẦY ĐỦ như ca kiểm tra để còn gửi báo cáo hằng ngày cho phụ
//      huynh, và BẢO MẬT HAI BÊN GIỐNG NHAU.
//   3. Vì vậy khối này chỉ còn lo đúng một việc: CHỌN ĐỀ và RÚT CÂU theo hồ sơ.
//      Lớp, thời gian, công bố điểm, chống gian lận, phạm vi mời đều dùng chung
//      các ô của màn Mở ca — một nguồn sự thật, không dựng hai bản.
//
// Mọi luật chọn câu nằm trong `src/lib/ca-chan-doan.ts`, có test. Ở đây chỉ vẽ.
import { useEffect, useMemo, useState } from 'react'
import { CheckSquare, Square, Eye } from 'lucide-react'
import { TheNoiDung, OThongBao } from './DesignSystem'
import HopChonDe from './HopChonDe'
import type { TeacherExamSource } from '../data/examContent'
import { dungUngVien, type CauUngVien } from '../lib/rut-de'
import { CHE_DO, cheDoTu, rutCaKiemChung, tomTatCheDo, type CaKiemChung, type CheDo, type HoSoEm } from '../lib/ca-chan-doan'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }

export interface EmChanDoan {
  sbd: string
  hoTen: string
}

/** Bộ đề thầy đã tích, gửi ngược lên màn Mở ca để nút Mở ca dùng. */
export interface BoChanDoan {
  moi: TeacherExamSource[]
  cu: TeacherExamSource[]
  cheDo: CheDo | null
}

export interface KhoiCaChanDoanProps {
  /** Kho đề ĐÃ TÁCH THEO PHẦN — mỗi bài thành ba mã TN · DS · TLN. */
  dsDeTach: TeacherExamSource[]
  nhomLoc?: string
  dsEm: EmChanDoan[]
  /** Hồ sơ chuyên đề từng em. Em chưa có dữ liệu thì trả rỗng — KHÔNG đoán. */
  layHoSo: (dsEm: EmChanDoan[]) => Promise<HoSoEm[]>
  onDoi: (bo: BoChanDoan) => void
  showToast: (chu: string, kieu?: 'success' | 'error' | 'warn') => void
}

/** Gộp ba phần thành một danh sách phẳng — `rutCaKiemChung` nhận mảng phẳng. */
export function phang(ds: TeacherExamSource[]): CauUngVien[] {
  const uv = dungUngVien(ds)
  return [...uv.I, ...uv.II, ...uv.III]
}

function OTich({ chon }: { chon: boolean }) {
  const I = chon ? CheckSquare : Square
  return <I size={18} style={{ color: chon ? 'var(--xanh)' : 'var(--mo)', flex: '0 0 auto' }} />
}

function demCau(ds: TeacherExamSource[]): number {
  return ds.reduce((n, s) => n + s.phanI.length + s.phanII.length + s.phanIII.length, 0)
}

/** KHÔNG định nghĩa trong thân component: mỗi lần vẽ lại sẽ là một kiểu
 * component MỚI, React tháo cả cây con và HopChonDe mất sạch chữ đang gõ lẫn
 * nhánh đang mở. Đã dính đúng lỗi này ở màn khác. */
function Khoi({ id, bat, setBat, ten, phu, tich, setTich, de, dsDeTach, nhomLoc }: { id: string; bat: boolean; setBat: (v: boolean) => void; ten: string; phu: string; tich: Set<string>; setTich: (s: Set<string>) => void; de: TeacherExamSource[]; dsDeTach: TeacherExamSource[]; nhomLoc: string }) {
  return (
    <TheNoiDung>
      <button
        type="button"
        onClick={() => setBat(!bat)}
        className="tap-target w-full text-left inline-flex items-center"
        style={{ gap: 'var(--k3)', minHeight: 44, background: 'none', border: 'none', padding: 0 }}
        aria-pressed={bat}
        aria-label={`Bật khối ${ten.toLowerCase()}`}
      >
        <OTich chon={bat} />
        <span className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}>
          {ten}
        </span>
        <span className="flex-1 min-w-0 truncate" style={NHAN_NHO}>
          {phu}
        </span>
        {de.length > 0 && (
          <span style={{ ...NHAN_NHO, ...SO }}>
            {de.length} mã · {demCau(de)} câu
          </span>
        )}
      </button>
      {bat && (
        <div style={{ marginTop: 'var(--k3) ' }} data-khoi={id}>
          <HopChonDe
            ds={dsDeTach}
            daChon={tich}
            onChon={(ma) => {
              const s = new Set(tich)
              if (s.has(ma)) s.delete(ma)
              else s.add(ma)
              setTich(s)
            }}
            nhomLoc={nhomLoc}
            chonNhieu
            onChonTatCa={(ma) => setTich(new Set(ma))}
            cao={260}
          />
        </div>
      )}
    </TheNoiDung>
  )
}

export default function KhoiCaChanDoan({ dsDeTach, nhomLoc = '', dsEm, layHoSo, onDoi, showToast }: KhoiCaChanDoanProps) {
  const [batMoi, setBatMoi] = useState(true)
  const [tichMoi, setTichMoi] = useState<Set<string>>(new Set())
  const [batCu, setBatCu] = useState(true)
  const [tichCu, setTichCu] = useState<Set<string>>(new Set())
  const [dangRut, setDangRut] = useState(false)
  const [xemTruoc, setXemTruoc] = useState<CaKiemChung | null>(null)

  const deMoi = useMemo(() => dsDeTach.filter((s) => tichMoi.has(s.maDe)), [dsDeTach, tichMoi])
  const deCu = useMemo(() => dsDeTach.filter((s) => tichCu.has(s.maDe)), [dsDeTach, tichCu])
  const coMoi = batMoi && deMoi.length > 0
  const coCu = batCu && deCu.length > 0
  const cheDo: CheDo | null = cheDoTu(coMoi, coCu)
  const tom = cheDo ? tomTatCheDo(CHE_DO[cheDo]) : null

  // Báo ngược lên màn Mở ca mỗi khi bộ tích đổi — nút Mở ca của màn dùng bộ này.
  useEffect(() => {
    onDoi({ moi: coMoi ? deMoi : [], cu: coCu ? deCu : [], cheDo })
    // onDoi là hàm của màn cha, không đưa vào deps để khỏi chạy vòng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deMoi, deCu, coMoi, coCu, cheDo])

  const bamXemTruoc = async () => {
    if (!cheDo) return
    setDangRut(true)
    try {
      const hoSo = await layHoSo(dsEm)
      setXemTruoc(rutCaKiemChung(coMoi ? phang(deMoi) : [], coCu ? phang(deCu) : [], hoSo, CHE_DO[cheDo]))
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không rút thử được', 'error')
    } finally {
      setDangRut(false)
    }
  }

  const emMau = xemTruoc ? Object.keys(xemTruoc.theoEm)[0] : ''

  return (
    <div className="flex flex-col" style={{ gap: 'var(--k4)' }}>
      <OThongBao tone="cam">
        Ca chẩn đoán lấy <b>dữ liệu để phân công lên bảng</b>: mỗi em một bộ câu chọn theo hồ sơ em ấy, 15 phút, không Phần III. Điểm và chi tiết từng câu vẫn ghi đầy đủ như ca kiểm tra để còn gửi
        báo cáo cho phụ huynh; chống gian lận và phạm vi mời cũng đặt ở phần bên dưới, giống hệt ca kiểm tra.
      </OThongBao>

      <Khoi id="moi" bat={batMoi} setBat={setBatMoi} ten="ĐỀ MỚI" phu="bài vừa giao về nhà — lõi chung lấy từ đây" tich={tichMoi} setTich={setTichMoi} de={deMoi} dsDeTach={dsDeTach} nhomLoc={nhomLoc} />
      <Khoi id="cu" bat={batCu} setBat={setBatCu} ten="ĐỀ CŨ" phu="kho ôn lại — càng rộng càng dễ tìm đúng chuyên đề đến hạn đo" tich={tichCu} setTich={setTichCu} de={deCu} dsDeTach={dsDeTach} nhomLoc={nhomLoc} />

      {/* DÒNG TỔNG — đọc thẳng từ hằng chế độ, không đếm tay */}
      <TheNoiDung>
        <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-3)' }} data-dong-tong>
          {tom ? (
            <>
              <span style={SO}>{tom.soCau}</span> câu · ước <span style={SO}>{Math.round(tom.giay / 60)}</span> phút · <span style={SO}>{tom.tinHieu}</span> tín hiệu chẩn đoán
            </>
          ) : (
            'Chưa tích khối nào'
          )}
        </div>
        <div style={{ ...NHAN_NHO, marginTop: 'var(--k1)' }}>
          {cheDo === 'ca_hai'
            ? 'Chữa bài mới và ôn cũ.'
            : cheDo === 'chi_moi'
              ? 'Chỉ chữa bài mới — lõi chung dày hơn để đo được cả lớp.'
              : cheDo === 'chi_cu'
                ? 'Buổi ôn, không có đề mới — đo sâu hai chuyên đề.'
                : 'Tích ĐỀ MỚI hoặc ĐỀ CŨ (hoặc cả hai) rồi mới mở được ca.'}
        </div>
        <button
          type="button"
          onClick={bamXemTruoc}
          disabled={!cheDo || dangRut}
          className="tap-target font-bold inline-flex items-center justify-center w-full"
          style={{ minHeight: 48, gap: 6, marginTop: 'var(--k4)', borderRadius: 'var(--bo-1)', background: 'var(--the-2)', border: '1.5px solid var(--vien)', color: cheDo ? 'var(--muc)' : 'var(--mo)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}
        >
          <Eye size={16} /> {dangRut ? 'Đang rút thử…' : 'Xem trước một em'}
        </button>
      </TheNoiDung>

      {/* XEM TRƯỚC — bảng câu của một em, kèm LÝ DO chọn từng câu */}
      {xemTruoc && (
        <TheNoiDung>
          <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)', marginBottom: 'var(--k3)' }}>
            Xem trước · {dsEm.find((e) => e.sbd === emMau)?.hoTen || `SBD ${emMau}`}
          </div>
          {xemTruoc.canhBao.map((c, i) => (
            <OThongBao key={i} tone="cam">
              {c}
            </OThongBao>
          ))}
          <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)' }}>
            Ước <span style={SO}>{xemTruoc.giayUocTinh}</span>s · <span style={SO}>{xemTruoc.soTinHieu}</span> tín hiệu · chuyên đề cũ đo: {(xemTruoc.chuyenDeDo[emMau] || []).join(', ') || '(chưa có hồ sơ)'}
          </div>
          <div className="flex flex-col" style={{ gap: 4, marginTop: 'var(--k3)' }}>
            {[
              ...xemTruoc.loiChung.map((c) => ({ c, vi: 'lõi chung — cả lớp cùng làm, để tính được tỉ lệ đúng và độ chụm' })),
              ...(xemTruoc.theoEm[emMau] || []).map((c) => ({ c, vi: c.sao === 2 ? 'riêng của em — câu 2 sao' : 'riêng của em — theo chuyên đề đến hạn đo' })),
            ].map(({ c, vi }) => (
              <div key={c.id} style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
                  Phần {c.phan} · {c.chuyenDe} {'★'.repeat(c.sao)}
                </div>
                <div style={NHAN_NHO}>{vi}</div>
              </div>
            ))}
          </div>
        </TheNoiDung>
      )}
    </div>
  )
}

// TỰ CHỮA LỖI (mở từ Hôm nay › "Tự chữa lỗi" và từ màn làm câu › "Tự chữa câu này").
// 12/10 (thầy: "mục chữa lỗi hiển thị cho thật chuẩn để học sinh chữa lỗi được"): danh sách câu cần chữa có TÊN câu (dạng bài + phần +
// lần sai gần nhất, lấy từ "Câu đã làm") và TRẠNG THÁI bằng chữ rõ; lỗi tải có Thử lại; rỗng thì gợi ý việc tiếp. Chọn một câu ⇒ màn chữa
// (ManChuaCauSai); quay ra ⇒ về lại danh sách (đã tải lại trạng thái). Ngôn ngữ giao diện Hôm nay (.ht2).
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, ChevronRight, Clock3, Lock, PencilLine } from 'lucide-react'
import { apiDanhSachTuChua, type KetQuaDanhSachChua, type MucChua } from '../../lib/chua-cau-sai-api'
import { taiCauDaLam, NHAN_NGUON_LAN, type CauDaLamMuc } from '../hoa2/api'
import { henGapLai } from '../../lib/chua-truc-tiep'
import './hoc-tap.css'
const ManChua = lazy(() => import('../chua-cau-sai/ManChuaCauSai'))

/** Trạng thái đợt chữa ⇒ chữ em đọc được (bảng từ chuẩn: không mã nội bộ). */
export const CHU_TRANG_THAI_CHUA: Record<string, string> = {
  can_chan_doan: 'Chưa bắt đầu · tìm chỗ vướng',
  dang_chua_buoc: 'Đang gỡ từng bước',
  dang_ghep_bai: 'Đang ghép lại cả bài',
  dang_kiem_chung: 'Lần gặp lại 2 · tự làm bản mới',
  cho_gap_lai_2: 'Chờ lần gặp lại 2',
  can_thay: 'Chờ chữa trên lớp · chữa trực tiếp được',
  thieu_hoc_lieu: 'Chữa trực tiếp câu gốc',
  cau_thay_doi: 'Câu vừa cập nhật · chữa trực tiếp được',
  tam_khoa: 'Tạm khoá · tiến độ được giữ',
  da_tu_sua: 'Đã tự sửa',
}
const TEN_PHAN: Record<string, string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }
const goc = (q: string) => q.replace(/(~\d+|#\d+)$/, '').replace(/^tc:/, '')
const ngayNgan = (ymd: string) => (/^\d{4}-\d{2}-\d{2}$/.test(ymd) ? `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}` : '')

type Nhom = 'can' | 'cho' | 'xong'
interface DongChua {
  m: MucChua
  ten: string
  phu: string
  trangThai: string
  nhom: Nhom
}

/** Tên + dòng phụ của một câu: dạng bài (Câu đã làm) · phần · lần sai gần nhất ở đâu. Không có ⇒ "Câu sai số N". */
export function dungDong(m: MucChua, i: number, cdl: ReadonlyMap<string, CauDaLamMuc>, nayMs: number): DongChua {
  const c = cdl.get(goc(m.qid))
  const saiCuoi = c ? [...c.lichSu].filter((l) => !l.dung).sort((a, b) => (a.ngay < b.ngay ? 1 : -1))[0] : undefined
  const phu = [
    c ? TEN_PHAN[c.phan] : '',
    saiCuoi ? `sai lần gần nhất ${ngayNgan(saiCuoi.ngay)}${saiCuoi.nguon ? ` · ${NHAN_NGUON_LAN[saiCuoi.nguon]}` : ''}` : '',
  ].filter(Boolean).join(' · ')
  const hen = m.trangThai === 'cho_gap_lai_2' ? henGapLai(m.denHan, nayMs) : null
  const nhom: Nhom = m.trangThai === 'da_tu_sua' ? 'xong' : m.trangThai === 'cho_gap_lai_2' && !hen?.daToi ? 'cho' : 'can'
  const trangThai = m.trangThai === 'cho_gap_lai_2'
    ? hen?.daToi ? 'Đã tới lần gặp lại 2 · tự làm bản mới' : hen ? `Lần gặp lại 2 mở lúc ${hen.luc}` : CHU_TRANG_THAI_CHUA.cho_gap_lai_2
    : CHU_TRANG_THAI_CHUA[m.trangThai] ?? 'Tiếp tục tự chữa'
  return { m, ten: c?.tenDang || `Câu sai số ${i + 1}`, phu, trangThai, nhom }
}

function BieuTuong({ d }: { d: DongChua }) {
  const sac = d.nhom === 'xong' ? 'muc' : d.nhom === 'cho' ? 'vang' : 'cham'
  const Icon = d.nhom === 'xong' ? CheckCircle2 : d.nhom === 'cho' ? Clock3 : d.m.trangThai === 'tam_khoa' ? Lock : PencilLine
  return <span className="ht2-dong-bt" data-sac={sac}><Icon size={20} aria-hidden="true" /></span>
}

const TEN_NHOM: Record<Nhom, string> = { can: 'Cần chữa', cho: 'Đang chờ lần gặp lại', xong: 'Đã tự sửa' }

export default function ManTuChua({ token, qid, onVe, onTuLuyen }: { token: string; qid?: string; onVe: () => void; onTuLuyen?: () => void }) {
  const [chon, setChon] = useState(qid || '')
  const [kq, setKq] = useState<KetQuaDanhSachChua | null>(null)
  const [cdl, setCdl] = useState<ReadonlyMap<string, CauDaLamMuc>>(new Map())
  const [lan, setLan] = useState(0)
  useEffect(() => {
    let huy = false
    setKq(null)
    void apiDanhSachTuChua(token).then((r) => { if (!huy) setKq(r) })
    // Tên câu: lấy từ "Câu đã làm" (cùng tên dạng em đã thấy ở đó); hỏng thì giữ tên dự phòng — không chặn danh sách.
    void taiCauDaLam(token).then((r) => {
      if (!huy && r.cheDo2) setCdl(new Map(r.cau.map((c) => [goc(c.qid), c])))
    }).catch(() => {})
    return () => { huy = true }
  }, [token, lan])
  const dong = useMemo(() => (kq?.trangThai === 'bat' ? kq.ds.map((m, i) => dungDong(m, i, cdl, Date.now())) : []), [kq, cdl])

  if (chon && kq?.trangThai !== 'tat') {
    const d = dong.find((x) => goc(x.m.qid) === goc(chon))
    return (
      <Suspense fallback={<div className="ht-app ht2"><p className="ht-noi-dung" role="status">Đang mở câu chữa…</p></div>}>
        <ManChua token={token} qid={chon} tenCau={d?.ten} onVe={() => { setChon(''); setLan((n) => n + 1) }} />
      </Suspense>
    )
  }

  const can = dong.filter((d) => d.nhom === 'can')
  const soCho = dong.filter((d) => d.nhom === 'cho').length
  const soXong = dong.filter((d) => d.nhom === 'xong').length
  return (
    <div className="ht-app ht2 ht2-tu-chua">
      <header className="ht-thanh">
        <button type="button" className="ht-nut-phu" onClick={onVe}><ArrowLeft size={18} aria-hidden="true" />Hôm nay</button>
        <strong>Tự chữa lỗi</strong>
      </header>
      <main className="ht-noi-dung ht2-noi-dung">
        <div className="ht2-mo-dau">
          {kq?.trangThai === 'bat' && dong.length > 0 && (
            <p className="ht2-so">{[`${can.length} câu cần chữa`, ...(soCho ? [`${soCho} câu đang chờ`] : []), ...(soXong ? [`${soXong} câu đã tự sửa`] : [])].join(' · ')}</p>
          )}
          <h1>Câu em cần chữa</h1>
        </div>
        <p className="ht2-phu">Chọn một câu: em xem lại câu gốc, tự làm lại, rồi đối chiếu đáp án và lời giải từng bước.</p>
        {!kq ? (
          <div className="ht2-nhom" role="status" aria-label="Đang tải danh sách câu cần chữa">
            <div className="ht2-dong ht2-dong-xuong" /><div className="ht2-dong ht2-dong-xuong" /><div className="ht2-dong ht2-dong-xuong" />
          </div>
        ) : kq.trangThai === 'loi' ? (
          <div className="ht-thong-bao ht2-loi" role="alert">
            <span>Chưa tải được danh sách câu cần chữa. {kq.loi}</span>
            <button type="button" className="ht-nut-phu" onClick={() => setLan((n) => n + 1)}>Thử lại</button>
          </div>
        ) : kq.trangThai === 'tat' ? (
          <section className="ht2-the ht2-trong-chua">
            <h2>Tự chữa lỗi chưa mở cho em</h2>
            <p className="ht2-phu">Em vẫn xem được đáp án và lời giải của câu đã làm ở Ôn &amp; sửa › Câu đã làm, và hỏi thầy ở từng câu.</p>
            <button type="button" className="ht-nut-chinh ht2-nut-lon" onClick={onVe}>Về Hôm nay</button>
          </section>
        ) : !dong.length || (!can.length && !dong.some((d) => d.nhom === 'cho')) ? (
          <>
            <section className="ht2-the ht2-trong-chua">
              <span className="ht2-dong-bt" data-sac="cham"><CheckCircle2 size={22} aria-hidden="true" /></span>
              <h2>Em không còn câu nào cần chữa</h2>
              <p className="ht2-phu">Câu em làm sai sẽ tự vào đây. Việc tiếp theo: làm kế hoạch hôm nay{onTuLuyen ? ', hoặc luyện thêm ở Tu luyện' : ''}.</p>
              <div className="ht2-hang-nut">
                <button type="button" className="ht-nut-chinh ht2-nut-lon" onClick={onVe}>Về Hôm nay</button>
                {onTuLuyen && <button type="button" className="ht-nut-phu" onClick={onTuLuyen}>Luyện thêm ở Tu luyện</button>}
              </div>
            </section>
            {dong.length > 0 && <DanhSach ten={TEN_NHOM.xong} ds={dong} onChon={setChon} />}
          </>
        ) : (
          (['can', 'cho', 'xong'] as Nhom[]).map((n) => {
            const ds = dong.filter((d) => d.nhom === n)
            return ds.length ? <DanhSach key={n} ten={TEN_NHOM[n]} ds={ds} onChon={setChon} /> : null
          })
        )}
      </main>
    </div>
  )
}

function DanhSach({ ten, ds, onChon }: { ten: string; ds: DongChua[]; onChon: (qid: string) => void }) {
  return (
    <section className="ht2-nhom" aria-label={`${ten}: ${ds.length} câu`}>
      <h2>{ten} · <span className="ht2-so">{ds.length} câu</span></h2>
      {ds.map((d) => (
        <button type="button" className="ht2-dong ht2-dong-chua" key={d.m.dotId ?? d.m.qid} data-nhom={d.nhom} onClick={() => onChon(d.m.qid)}>
          <BieuTuong d={d} />
          <span className="ht2-dong-chu">
            <strong>{d.ten}</strong>
            {d.phu && <small>{d.phu}</small>}
            <small className="ht2-dong-trang-thai" data-nhom={d.nhom}>{d.trangThai}</small>
          </span>
          <ChevronRight className="ht2-dong-mui" size={20} aria-hidden="true" />
        </button>
      ))}
    </section>
  )
}

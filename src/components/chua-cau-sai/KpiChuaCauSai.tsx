// Bảng vận hành pilot: phạm vi, giao đủ mẫu số, độ phủ và hàng giúp đỡ thật.
import { useEffect, useState } from 'react'
import {
  goiChuaThay as goi,
  KHOA_MO_CAU_CAN_CHUA,
} from '../../lib/chua-cau-sai-thay-api'
import { useAppStore } from '../../store/appStore'
import './chua-cau-sai.css'
type Obj = Record<string, any>
const NHAN_HANG: Record<string, string> = {
  san_sang_soan: 'Sẵn sàng soạn',
  da_co_hoc_lieu_moi: 'Đã có bộ mới · chờ đồng bộ',
  cau_chua_duyet: 'Câu gốc chưa duyệt',
  cau_goc_hong: 'Câu gốc lỗi dữ liệu',
  tu_luan_khong_tu_dong: 'Tự luận · không chạy tự động',
  thieu_cau_goc: 'Không còn câu gốc đang dùng',
}
export default function KpiChuaCauSai() {
  const setScreen = useAppStore((s) => s.setScreen)
  const [k, setK] = useState<Obj | null>(null),
    [cfg, setCfg] = useState<Obj | null>(null),
    [choLieu, setChoLieu] = useState<Obj[]>([]),
    [tongChoLieu, setTongChoLieu] = useState<Record<string, Obj>>({}),
    [deSoan, setDeSoan] = useState<Obj | null>(null),
    [loi, setLoi] = useState(''),
    [ban, setBan] = useState(true),
    [cohort, setCohort] = useState(''),
    [lop, setLop] = useState(''),
    [sbd, setSbd] = useState(''),
    [tatCa, setTatCa] = useState(false),
    [bat, setBat] = useState(false),
    [h, setH] = useState(''),
    [nguoi, setNguoi] = useState(''),
    [duyet, setDuyet] = useState(false),
    [thongBao, setThongBao] = useState('')
  const tai = async () => {
    const [a, b, d] = await Promise.all([
      goi('thong-ke'),
      goi('cau-hinh'),
      goi('hang-hoc-lieu'),
    ])
    setK(a)
    setCfg(b.cauHinh)
    setCohort(b.cauHinh.cohortId)
    setLop(b.cauHinh.lop.join(', '))
    setSbd(b.cauHinh.sbd.join(', '))
    setBat(b.cauHinh.bat)
    setTatCa(b.cauHinh.phamVi === 'tat_ca')
    setChoLieu(d.ds)
    setTongChoLieu(d.tongHop ?? {})
  }
  useEffect(() => {
    let song = true
    ;(async () => {
      try {
        const [a, b, d] = await Promise.all([
          goi('thong-ke'),
          goi('cau-hinh'),
          goi('hang-hoc-lieu'),
        ])
        if (!song) return
        setK(a)
        setCfg(b.cauHinh)
        setCohort(b.cauHinh.cohortId)
        setLop(b.cauHinh.lop.join(', '))
        setSbd(b.cauHinh.sbd.join(', '))
        setBat(b.cauHinh.bat)
        setTatCa(b.cauHinh.phamVi === 'tat_ca')
        setChoLieu(d.ds)
        setTongChoLieu(d.tongHop ?? {})
      } catch (e) {
        if (song) setLoi((e as Error).message)
      } finally {
        if (song) setBan(false)
      }
    })()
    return () => {
      song = false
    }
  }, [])
  const lam = async (fn: () => Promise<void>) => {
    setBan(true)
    setLoi('')
    setThongBao('')
    try {
      await fn()
      await tai()
    } catch (e) {
      setLoi((e as Error).message)
    } finally {
      setBan(false)
    }
  }
  const dongBoCu = () =>
    lam(async () => {
      const khoa = `chua-tu-cu:${cohort}`
      let cursor = localStorage.getItem(khoa) ?? '',
        con = true,
        so = 0
      for (let i = 0; i < 1000; i++) {
        const r = await goi('dong-bo-tu-cu', { cursor })
        cursor = r.cursor
        con = r.con
        so++
        localStorage.setItem(khoa, cursor)
        setThongBao(`Đang đưa kết quả Tu luyện cũ vào sổ chung: ${so} lượt.`)
        if (!con) {
          localStorage.removeItem(khoa)
          break
        }
      }
      setThongBao(
        con
          ? 'Đã lưu vị trí rà Tu luyện. Bấm tiếp để hoàn tất.'
          : 'Đã rà hết kết quả Tu luyện trong phạm vi; bây giờ giao các câu sai cũ.',
      )
    })
  const giao = () =>
    lam(async () => {
      let offset = Number(localStorage.getItem(`chua-giao:${cohort}`)) || 0,
        so = 0,
        con = true
      for (let i = 0; i < 1000; i++) {
        const r = await goi('giao-pilot', { offset })
        so += r.ds.filter((x: Obj) => x.ok).length
        offset = r.tiepOffset
        con = r.con
        localStorage.setItem(`chua-giao:${cohort}`, String(offset))
        setThongBao(`Đang rà và giao câu sai: đã xử lý ${offset} mục.`)
        if (!r.con) {
          localStorage.removeItem(`chua-giao:${cohort}`)
          break
        }
      }
      setThongBao(
        `Đã rà soát và giao ${so} đợt lỗi trong phạm vi đã chọn. Đợt cũ giữ nguyên ngày giao.${con ? ' Còn dữ liệu; bấm giao tiếp để tiếp đúng vị trí đã lưu.' : ' Đã rà hết phạm vi.'}`,
      )
    })
  return (
    <section className="ccs-kpi" aria-label="Vận hành vòng chữa câu sai">
      <h2>Vòng chữa câu sai</h2>
      <p>
        Đo khả năng tự giải bản mới ở lần gặp lại 2 đầu tiên, sau ít nhất 24 giờ
        nghỉ.
      </p>
      {loi && (
        <p className="ccs-loi" role="alert">
          {loi}
        </p>
      )}
      {thongBao && <p role="status">{thongBao}</p>}
      {k && (
        <>
          <div className="ccs-kpi-hang">
            <div className="ccs-kpi-o">
              <strong className="ccs-kpi-so">
                {k.kpiPhanTram == null
                  ? 'Chưa có dữ liệu'
                  : `${k.kpiPhanTram}%`}
              </strong>
              <span className="ccs-kpi-nhan">
                Tự sửa lần kiểm đầu · mục tiêu 90%
              </span>
            </div>
            <div className="ccs-kpi-o">
              <strong>
                {k.tuSo}/{k.mauSo}
              </strong>
              <span className="ccs-kpi-nhan">
                Đạt / mọi đợt đã đủ {k.cuaSoDoNgay} ngày đo
              </span>
            </div>
          </div>
          <p>
            {k.giao} đợt đã giao · {k.choTruongThanh} đang trong cửa sổ đo ·{' '}
            {k.thieuHocLieu} thiếu học liệu · {k.choKiemHocLieu} chờ kiểm học
            liệu · {k.canThay} cần thầy.
          </p>
          <p className="ccs-ghi">{k.canhBao}</p>
          <p>
            {k.duQuyMoPilot
              ? 'Đủ quy mô theo dõi vận hành tối thiểu.'
              : 'Chưa đủ 30 học sinh và 300 đợt trưởng thành để đánh giá vòng chữa.'}{' '}
            Cần quan sát học sinh thật để đánh giá hiểu sâu và trải nghiệm.
          </p>
        </>
      )}
      <details>
        <summary>Phạm vi sử dụng và giao câu sai</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void lam(async () => {
              const ds = (s: string) =>
                s
                  .split(',')
                  .map((x) => x.trim())
                  .filter(Boolean)
              await goi('cau-hinh', {
                luu: true,
                cauHinh: {
                  ...cfg,
                  cohortId: cohort,
                  lop: ds(lop),
                  sbd: ds(sbd),
                  phamVi: tatCa ? 'tat_ca' : 'pilot',
                  bat,
                },
              })
              setThongBao('Đã lưu phạm vi sử dụng.')
            })
          }}
        >
          <label>
            Mã đợt theo dõi
            <input
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              required
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={tatCa}
              onChange={(e) => setTatCa(e.target.checked)}
            />
            Dùng cho tất cả học sinh
          </label>
          <label>
            Lớp (ngăn cách dấu phẩy)
            <input value={lop} onChange={(e) => setLop(e.target.value)} />
          </label>
          <label>
            SBD (ngăn cách dấu phẩy)
            <input value={sbd} onChange={(e) => setSbd(e.target.value)} />
          </label>
          <label>
            <input
              type="checkbox"
              checked={bat}
              onChange={(e) => setBat(e.target.checked)}
            />
            Bật cho đúng phạm vi trên
          </label>
          <button disabled={ban} type="submit">
            Lưu phạm vi
          </button>
        </form>
        <button disabled={ban || !cfg?.bat} onClick={() => void dongBoCu()}>
          Đồng bộ kết quả Tu luyện cũ
        </button>
        <button disabled={ban || !cfg?.bat} onClick={() => void giao()}>
          Giao mọi câu sai hợp lệ cho nhóm đã chọn
        </button>
        <p>
          Giao cho cả những em chưa mở màn chữa, để mẫu số giữ được các đợt bỏ
          dở và thiếu học liệu.
        </p>
      </details>
      <details>
        <summary>Nhập và duyệt học liệu từng bước</summary>
        <p>
          Học liệu cần có câu chẩn đoán, xác nhận nguyên nhân, lý do, vận dụng
          mới và hai bản toàn bài tương đương. Thầy duyệt chuyên môn trước khi
          dùng.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void lam(async () => {
              await goi('hoc-lieu', {
                luu: true,
                hocLieu: JSON.parse(h),
                nguoiDuyet: nguoi,
                duyetChuyenMon: duyet,
              })
              setThongBao(
                'Học liệu đã qua kiểm cấu trúc và được lưu với người duyệt.',
              )
            })
          }}
        >
          <label>
            Học liệu theo mẫu JSON
            <textarea
              value={h}
              onChange={(e) => setH(e.target.value)}
              required
              spellCheck={false}
            />
          </label>
          <label>
            Người duyệt
            <input
              value={nguoi}
              onChange={(e) => setNguoi(e.target.value)}
              required
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={duyet}
              onChange={(e) => setDuyet(e.target.checked)}
            />
            Tôi đã kiểm đáp án, điều kiện áp dụng, độ khó và tính tương đương
            của bản mới
          </label>
          <button disabled={ban || !duyet} type="submit">
            Kiểm và lưu học liệu
          </button>
        </form>
      </details>
      <details>
        <summary>Hàng học liệu · {choLieu.length} nhóm câu</summary>
        <div className="ccs-hang-tom-tat" aria-label="Tóm tắt hàng học liệu">
          <span data-loai="san-sang">
            <strong>{tongChoLieu.san_sang_soan?.soNhomCau ?? 0}</strong>
            Sẵn sàng soạn
          </span>
          <span>
            <strong>{tongChoLieu.cau_chua_duyet?.soNhomCau ?? 0}</strong>
            Chưa duyệt
          </span>
          <span>
            <strong>
              {(tongChoLieu.thieu_cau_goc?.soNhomCau ?? 0) +
                (tongChoLieu.cau_goc_hong?.soNhomCau ?? 0)}
            </strong>
            Lỗi nguồn
          </span>
          <span>
            <strong>
              {tongChoLieu.tu_luan_khong_tu_dong?.soNhomCau ?? 0}
            </strong>
            Không tự động
          </span>
        </div>
        <div className="ccs-hang-danh-sach">
          {choLieu.map((x, i) => (
            <article key={`${x.qid}-${x.version}-${i}`}>
              <div>
                <strong>
                  {x.qid} · {x.soEm} em
                </strong>
                <span>{NHAN_HANG[x.loaiHang] ?? x.lyDo}</span>
                {x.daDoi && <span>Phiên bản mới: {x.versionMoi}</span>}
              </div>
              {x.loaiHang === 'san_sang_soan' && (
                <button
                  disabled={ban}
                  onClick={() =>
                    void lam(async () => {
                      const r = await goi('hoc-lieu', { qid: x.qid })
                      setDeSoan(r.cauGocRieng)
                    })
                  }
                >
                  Mở câu gốc
                </button>
              )}
            </article>
          ))}
        </div>
        {deSoan && (
          <details open>
            <summary>Đề gốc và lời giải — chỉ thầy xem</summary>
            <pre>{JSON.stringify(deSoan, null, 2)}</pre>
          </details>
        )}
      </details>
      <h3>Chữa bước cuối trên lớp</h3>
      <p>
        {k?.canThay ?? 0} bước còn mắc. Các em cùng lớp, cùng bước được gom ở
        mục chiếu lên bảng.
      </p>
      <button
        onClick={() => {
          sessionStorage.setItem(KHOA_MO_CAU_CAN_CHUA, '1')
          setScreen('goilenbang')
        }}
      >
        Mở Chiếu lên bảng → Câu cần chữa
      </button>
      <button disabled={ban} onClick={() => void lam(async () => {})}>
        {ban ? 'Đang xử lý…' : 'Làm mới số liệu'}
      </button>
    </section>
  )
}

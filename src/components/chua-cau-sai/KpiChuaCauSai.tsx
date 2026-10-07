// Bảng vận hành pilot: phạm vi, giao đủ mẫu số, độ phủ và hàng giúp đỡ thật.
import { useEffect, useState } from 'react'
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import { loadTeacherSecret } from '../../lib/exam-db'
import './chua-cau-sai.css'
type Obj = Record<string, any>
async function goi(lenh: string, body: Obj = {}): Promise<Obj> {
  const [goc, secret] = await Promise.all([
    layDiaChiMayChu(),
    loadTeacherSecret(),
  ])
  if (!goc || !secret) throw new Error('Cần cấu hình kết nối giáo viên.')
  const dk = new AbortController(),
    hen = setTimeout(() => dk.abort(), 20000)
  try {
    const r = await fetch(`${goc}/gv/chua-cau-sai/${lenh}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...body, secret }),
      signal: dk.signal,
    })
    const j = await r.json()
    if (!r.ok || !j.ok)
      throw new Error(
        [j.mo ?? j.error ?? 'Chưa lưu được', ...(j.loiHocLieu ?? [])].join(
          '\n',
        ),
      )
    return j
  } finally {
    clearTimeout(hen)
  }
}
export default function KpiChuaCauSai() {
  const [k, setK] = useState<Obj | null>(null),
    [cfg, setCfg] = useState<Obj | null>(null),
    [hang, setHang] = useState<Obj[]>([]),
    [choLieu, setChoLieu] = useState<Obj[]>([]),
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
    [traThay, setTraThay] = useState<Record<string, string>>({}),
    [buocThay, setBuocThay] = useState<Record<string, string>>({}),
    [thongBao, setThongBao] = useState('')
  const tai = async () => {
    const [a, b, c, d] = await Promise.all([
      goi('thong-ke'),
      goi('cau-hinh'),
      goi('hang-thay'),
      goi('hang-hoc-lieu'),
    ])
    setK(a)
    setCfg(b.cauHinh)
    setCohort(b.cauHinh.cohortId)
    setLop(b.cauHinh.lop.join(', '))
    setSbd(b.cauHinh.sbd.join(', '))
    setBat(b.cauHinh.bat)
    setTatCa(b.cauHinh.phamVi === 'tat_ca')
    setHang(c.ds)
    setChoLieu(d.ds)
  }
  useEffect(() => {
    let song = true
    ;(async () => {
      try {
        const [a, b, c, d] = await Promise.all([
          goi('thong-ke'),
          goi('cau-hinh'),
          goi('hang-thay'),
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
        setHang(c.ds)
        setChoLieu(d.ds)
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
        <summary>Ưu tiên chuẩn bị học liệu ({choLieu.length} nhóm câu)</summary>
        <p>
          Các đợt chưa kiểm học liệu cũng có mặt ở đây. Ưu tiên câu ảnh hưởng
          nhiều em và gần hạn đo.
        </p>
        {choLieu.map((x, i) => (
          <article key={i}>
            <strong>
              {x.qid} · {x.soEm} em
            </strong>
            <p>
              {x.lyDo === 'can_kiem_hoc_lieu'
                ? 'Cần kiểm học liệu đã duyệt'
                : x.lyDo}{' '}
              · {x.version}
            </p>
            <button
              disabled={ban}
              onClick={() =>
                void lam(async () => {
                  const r = await goi('hoc-lieu', { qid: x.qid })
                  setDeSoan(r.cauGocRieng)
                })
              }
            >
              Lấy đề gốc để soạn
            </button>
          </article>
        ))}
        {deSoan && (
          <details open>
            <summary>Đề gốc và lời giải — chỉ thầy xem</summary>
            <pre>{JSON.stringify(deSoan, null, 2)}</pre>
          </details>
        )}
      </details>
      <h3>Học sinh đang cần giúp</h3>
      {hang.length === 0 ? (
        <p>Chưa có yêu cầu đang chờ.</p>
      ) : (
        hang.map((x) => (
          <article key={x.dotId}>
            <strong>
              {x.hoTen ?? x.sbd} · {x.qid}
            </strong>
            <p>{x.lyDoThieu || 'Em đang cần gỡ bước còn vướng.'}</p>
            {x.baiLam?.map((n: Obj, i: number) => (
              <p key={i}>
                {n.cau.hoi} → Em trả lời: {n.traLoi} (
                {n.dung ? 'đúng' : 'chưa đúng'}
                {n.coHoTro ? ', có hỗ trợ' : ''})
              </p>
            ))}
            <label>
              Lời thầy gỡ
              <textarea
                value={traThay[x.dotId] ?? ''}
                onChange={(e) =>
                  setTraThay((v) => ({ ...v, [x.dotId]: e.target.value }))
                }
              />
            </label>
            <label>
              Bước cần luyện tiếp
              <select
                value={buocThay[x.dotId] ?? ''}
                onChange={(e) =>
                  setBuocThay((v) => ({ ...v, [x.dotId]: e.target.value }))
                }
              >
                <option value="">Chỉ gửi lời gỡ</option>
                {(JSON.parse(x.bangChung).tienDo ?? []).map((t: Obj) => (
                  <option value={t.buocId} key={t.buocId}>
                    {t.tieuDe}
                  </option>
                ))}
              </select>
            </label>
            <button
              disabled={ban || !traThay[x.dotId]?.trim()}
              onClick={() =>
                void lam(async () => {
                  await goi('hang-thay', {
                    dotId: x.dotId,
                    loiGo: traThay[x.dotId],
                    moLai: !!buocThay[x.dotId],
                    buocId: buocThay[x.dotId],
                  })
                })
              }
            >
              Gửi lời gỡ và cho em tiếp
            </button>
            <details>
              <summary>Xem bằng chứng bước và câu trả lời</summary>
              <pre>{JSON.stringify(JSON.parse(x.bangChung), null, 2)}</pre>
            </details>
            <button
              disabled={ban}
              onClick={() =>
                void lam(async () => {
                  await goi('hang-thay', { xong: true, dotId: x.dotId })
                })
              }
            >
              Đã xem yêu cầu
            </button>
          </article>
        ))
      )}
      <button disabled={ban} onClick={() => void lam(async () => {})}>
        {ban ? 'Đang xử lý…' : 'Làm mới số liệu'}
      </button>
    </section>
  )
}

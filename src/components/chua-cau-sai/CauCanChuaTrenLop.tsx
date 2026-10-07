import { useCallback, useEffect, useRef, useState } from 'react'
import type { NhomChuaTrenLop } from '../../../server/src/chua-cau-sai-chieu-kieu'
import { goiChuaThay } from '../../lib/chua-cau-sai-thay-api'
import { oChuaCuoi } from '../../lib/chua-cau-sai-chieu'
import { khoaToChieu } from '../../lib/to-chieu-cau-noi'
import { ChemText } from '../../lib/chem-format'
import { sinhMaNgauNhien } from '../../lib/thiet-bi'
import { BuocDiemDanh, useDiemDanhBuoi } from '../day-hoc/DiemDanhBuoi'
import { useGhiToChieu } from '../chien-dich/ghi-to-chieu'
import KhungXemPhieu from '../KhungXemPhieu'
import './chua-cau-sai.css'

export default function CauCanChuaTrenLop() {
  const dd = useDiemDanhBuoi()
  const [ds, setDs] = useState<NhomChuaTrenLop[]>([]),
    [bat, setBat] = useState(false),
    [ban, setBan] = useState(false),
    [loi, setLoi] = useState(''),
    [bao, setBao] = useState(''),
    [html, setHtml] = useState(''),
    [conNua, setConNua] = useState(false),
    [buoc, setBuoc] = useState<Record<string, string>>({})
  const phien = useRef<
    {
      buoiId: string
      nhom: NhomChuaTrenLop
      buocId: string
      em: NhomChuaTrenLop['em']
    }[]
  >([])
  const maGui = useRef(new Map<string, string>())
  const luotTai = useRef(0)
  const huyTai = useCallback(() => {
    luotTai.current++
  }, [])
  const lopBuoi = dd.tt?.buoi.lop ?? ''
  const tai = useCallback(async () => {
    const luot = ++luotTai.current
    try {
      const r = await goiChuaThay('hang-chieu', { lop: lopBuoi })
      if (luot !== luotTai.current) return
      setDs(r.ds)
      setBat(r.bat)
      setConNua(r.conNua)
      setLoi('')
    } catch (e) {
      if (luot === luotTai.current) setLoi((e as Error).message)
    }
  }, [lopBuoi])
  useEffect(() => {
    let huy = false
    void Promise.resolve().then(() => {
      if (!huy) void tai()
    })
    return () => {
      huy = true
      huyTai()
    }
  }, [tai, huyTai])
  const thayChua = useCallback(
    async (o: { qid: string }) => {
      const p = phien.current.find((x) => x.nhom.id === o.qid)
      if (!p)
        return {
          ok: false as const,
          chu: 'Tờ chiếu đã đổi; mở lại đúng câu cần chữa.',
        }
      let so = 0,
        cho = 0
      const cacKhoa: string[] = []
      try {
        for (let i = 0; i < p.em.length; i += 6) {
          const dot = p.em
            .slice(i, i + 6)
            .map((e) => ({ dotId: e.dotId, revision: e.revision }))
          // Cùng nhóm, phiên và tiến độ: retry luôn gửi cùng mã, kể cả đóng/mở lại tờ.
          const khoa = `ccs.chuaLop.${p.buoiId}.${p.nhom.id}.${JSON.stringify(dot)}.${p.buocId}`
          cacKhoa.push(khoa)
          let requestId = maGui.current.get(khoa)
          try {
            requestId ||= localStorage.getItem(khoa) ?? undefined
          } catch {}
          if (!requestId) requestId = sinhMaNgauNhien()
          maGui.current.set(khoa, requestId)
          try {
            localStorage.setItem(khoa, requestId)
          } catch {}
          const r = await goiChuaThay('da-chua-tren-lop', {
            requestId,
            buoiId: p.buoiId,
            nhomId: p.nhom.id,
            dot,
            buocId: p.buocId,
          })
          so += r.soEm
          cho += r.choHocLieu
        }
        setBao(
          `Đã ghi buổi chữa cho ${so} em có mặt. Các em tiếp tục tự kiểm bước vừa chữa.${cho ? ` ${cho} em đang chờ thêm câu mới đã duyệt.` : ''}`,
        )
        for (const khoa of cacKhoa) {
          maGui.current.delete(khoa)
          try {
            localStorage.removeItem(khoa)
          } catch {}
        }
        void tai()
        return { ok: true as const }
      } catch (e) {
        const chu = (e as Error).message
        if (so)
          setBao(
            `Đã ghi buổi chữa cho ${so} em. Phần còn lại chưa được xác nhận; thử lại trên tờ này để tiếp, không ghi đôi.`,
          )
        setLoi(chu)
        return { ok: false as const, chu }
      }
    },
    [tai],
  )
  const { moPhien, ganO, dongPhien } = useGhiToChieu(
    `chua-cuoi:${dd.idBuoi}`,
    async () => ({
      ok: false,
      chu: 'Bước này chỉ ghi Thầy chữa; học sinh sẽ tự kiểm trên app.',
    }),
    thayChua,
  )
  const chieu = async (nhom: NhomChuaTrenLop[]) => {
    setBan(true)
    setLoi('')
    try {
      const coMat = new Set(dd.coMat.map((e) => e.sbd))
      phien.current = nhom
        .map((g) => ({
          buoiId: dd.idBuoi,
          nhom: g,
          buocId: g.buocId === '__ghep_bai__' ? buoc[g.id] : g.buocId,
          em: g.em.filter((e) => coMat.has(e.sbd)),
        }))
        .filter((p) => p.em.length)
      if (!dd.idBuoi || dd.buoiXong || !phien.current.length)
        throw new Error('Điểm danh các em có mặt trước khi mở tờ chữa.')
      if (phien.current.some((p) => !p.buocId))
        throw new Error('Chọn bước cần gỡ ở câu tổng hợp trước khi chiếu.')
      const ma = moPhien(),
        o = phien.current.map((p, i) => oChuaCuoi(p.nhom, i + 1))
      const { taoHtmlMayChieu } = await import('../../lib/html-may-chieu')
      const h = taoHtmlMayChieu(o, {
        tenBuoi: 'Câu cần chữa · Cùng gỡ bước cuối',
        cauNoi: { maPhien: ma },
        nutAiSai: false,
      })
      ganO(
        ma,
        new Map(
          o.map((x) => [
            khoaToChieu(x.sbd, x.qid!),
            { sbd: x.sbd, hoTen: 'Chữa chung', qid: x.qid!, chuyenDe: '' },
          ]),
        ),
      )
      setHtml(h)
    } catch (e) {
      setLoi((e as Error).message)
    } finally {
      setBan(false)
    }
  }
  const coMat = new Set(dd.coMat.map((e) => e.sbd))
  const chieuDuoc = ds.filter(
    (g) =>
      g.em.some((e) => coMat.has(e.sbd)) &&
      (g.buocId !== '__ghep_bai__' || !!buoc[g.id]),
  )
  return (
    <div className="ccs-kpi">
      <h2>Câu cần chữa · Bước cuối trên lớp</h2>
      <p>
        Hệ thống đã giúp em tự gỡ từng bước. Thầy chữa chung chỗ vẫn mắc, bấm
        “Thầy chữa” trên tờ; app cho từng em tự kiểm lại.
      </p>
      {loi && (
        <p className="ccs-loi" role="alert">
          {loi}
        </p>
      )}
      {bao && <p role="status">{bao}</p>}
      {!bat ? (
        <p>
          Vòng tự chữa chưa bật. Bật phạm vi sử dụng ở Tổng quan để nhận câu cần
          chữa.
        </p>
      ) : (
        <>
          <BuocDiemDanh dd={dd} idTieuDe="ccs-diem-danh" />
          <button disabled={ban} onClick={() => void tai()}>
            Làm mới câu cần chữa
          </button>
          <button
            disabled={ban || dd.buoiXong || !chieuDuoc.length}
            onClick={() => void chieu(chieuDuoc)}
          >
            Chiếu lên bảng câu cần chữa ({chieuDuoc.length})
          </button>
          {!ds.length && (
            <p>
              Chưa có bước còn mắc sau vòng tự chữa. Những câu em đang tự gỡ
              tiếp chưa đưa vào buổi chữa.
            </p>
          )}
          {conNua && (
            <p>
              Còn câu chờ ngoài lượt này; chữa xong rồi làm mới để nhận tiếp.
            </p>
          )}
          {ds.map((g) => (
            <article key={g.id}>
              <h3>
                {g.lop} · {g.tieuDe} · {g.em.length} em
              </h3>
              <p>
                <ChemText text={g.diemVuong} />
              </p>
              <p>
                {g.maLoi
                  ? 'Nguyên nhân đã được xác nhận từ câu phân biệt.'
                  : 'Chưa xác nhận nguyên nhân; thầy dùng câu hỏi gợi mở để kiểm cách nghĩ.'}
              </p>
              <p>
                <ChemText text={g.cauGoc.text} />
              </p>
              {g.buocId === '__ghep_bai__' && (
                <label>
                  Bước cần gỡ trong bài tổng hợp
                  <select
                    value={buoc[g.id] ?? ''}
                    onChange={(e) =>
                      setBuoc((v) => ({ ...v, [g.id]: e.target.value }))
                    }
                  >
                    <option value="">Chọn bước để các em tự kiểm lại</option>
                    {g.buoc.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.tieuDe}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <details>
                <summary>Xem chỗ các em mắc — chỉ thầy xem</summary>
                {g.em.map((e) => (
                  <div key={e.dotId}>
                    <strong>
                      {e.hoTen} · {coMat.has(e.sbd) ? 'Có mặt' : 'Chưa có mặt'}
                    </strong>
                    <p>
                      Đã hiểu:{' '}
                      {e.daHieu.join('; ') || 'Chưa đủ bằng chứng hiểu bước'}.
                    </p>
                    <p>
                      <ChemText text={e.hoi} /> → Em trả lời: {e.traLoi};{' '}
                      {e.soVongHoTro} vòng hỗ trợ.
                    </p>
                  </div>
                ))}
              </details>
              <button
                disabled={ban || dd.buoiXong || !chieuDuoc.includes(g)}
                onClick={() => void chieu([g])}
              >
                Chiếu bước này để chữa chung
              </button>
            </article>
          ))}
        </>
      )}
      {html && (
        <KhungXemPhieu
          html={html}
          ten="Tờ máy chiếu — Câu cần chữa"
          dong={() => {
            dongPhien()
            setHtml('')
            void tai()
          }}
        />
      )}
    </div>
  )
}

// VI KỸ NĂNG CỦA BÀI (ma trận Q, OMNI 3) — thầy lệnh 05/10: "tự động chuẩn xác luôn nhé. Ko cần tôi" ⇒ A.I Đỗ Đại Học TỰ gắn vi kỹ năng cho từng câu,
// thầy KHÔNG phải duyệt, không có nhắc "chưa duyệt". Bảng chiến dịch chỉ có MỘT dòng chữ nhỏ ở cuối: "Vi kỹ năng: A.I Đỗ Đại Học đã gắn tự động · Xem".
// Bấm "Xem" mới mở khối thu gọn CHỈ-XEM (từng câu + vi kỹ năng đã gắn, `/gv/omni q-lo`). Trong khối vẫn cho SỬA nếu thầy muốn (bật/tắt vi kỹ năng,
// thêm vi kỹ năng mới có tên lỗi hay gặp) ⇒ `q-duyet` chỉ gửi câu thầy đã đổi. Mặc định đóng; lỗi máy chủ ⇒ hiện đúng lời máy chủ trong khối.
import { useState } from 'react'
import type { Vkn } from '../../../server/src/omni-kieu'
import { TEN_AI } from '../../lib/omni-chu'
import { useAppStore } from '../../store/appStore'
import { docLoQ, duyetLoQ, type CauQ, type LoQ } from './api-omni'

const TEN_PHAN: Record<CauQ['phan'], string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }
const giong = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x))

/** Id vi kỹ năng mới của một dạng: `<mã dạng>#<số>` (số kế tiếp sau mọi id đang có của dạng ấy). */
export function idVknMoi(maDang: string, coSan: readonly Pick<Vkn, 'id'>[]): string {
  const dau = `${maDang}#`
  let lon = 0
  for (const v of coSan) {
    if (!v.id.startsWith(dau)) continue
    const n = Number(v.id.slice(dau.length))
    if (Number.isFinite(n) && n > lon) lon = n
  }
  return `${dau}${lon + 1}`
}

export default function ViKyNangBai({ chienDichId }: { chienDichId: string }) {
  const showToast = useAppStore((s) => s.showToast)
  const [mo, setMo] = useState(false)
  const [lo, setLo] = useState<LoQ | null>(null)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState('')
  const [sua, setSua] = useState(false)
  const [chon, setChon] = useState<Record<string, string[]>>({})
  const [vknMoi, setVknMoi] = useState<Vkn[]>([])
  const [dangMoi, setDangMoi] = useState('')
  const [tenMoi, setTenMoi] = useState('')
  const [tenLoiMoi, setTenLoiMoi] = useState('')
  const [dangLuu, setDangLuu] = useState(false)
  const [loiLuu, setLoiLuu] = useState('')

  const tai = async (sau?: string) => {
    setDangTai(true)
    setLoi('')
    const r = await docLoQ(chienDichId, sau)
    setDangTai(false)
    if (!r.ok) {
      setLoi(r.chu)
      return
    }
    setLo((cu) => {
      if (!sau || !cu) return r.du
      const daCo = new Set(cu.vkn.map((v) => v.id))
      return { cau: [...cu.cau, ...r.du.cau.filter((c) => !cu.cau.some((x) => x.qid === c.qid))], vkn: [...cu.vkn, ...r.du.vkn.filter((v) => !daCo.has(v.id))], conLai: r.du.conLai }
    })
    setChon((cu) => ({ ...Object.fromEntries(r.du.cau.map((c) => [c.qid, c.goiY])), ...(sau ? cu : {}) }))
  }
  const moXem = () => {
    const moi = !mo
    setMo(moi)
    if (moi && !lo && !dangTai) void tai()
  }

  const tatCaVkn = [...(lo?.vkn ?? []), ...vknMoi]
  const tenVkn = (id: string) => tatCaVkn.find((v) => v.id === id)?.ten ?? id
  /** Vi kỹ năng chọn được cho một câu: cùng dạng (danh mục + thầy vừa thêm) và mọi vi kỹ năng đang gắn. */
  const vknCua = (c: CauQ): Vkn[] => {
    const ds = tatCaVkn.filter((v) => (c.maDang ? v.maDang === c.maDang : false) || (chon[c.qid] ?? c.goiY).includes(v.id))
    const thieu = (chon[c.qid] ?? c.goiY).filter((id) => !ds.some((v) => v.id === id))
    return [...ds, ...thieu.map((id) => ({ id, maDang: c.maDang ?? '', ten: id, thuTu: 0 }))]
  }
  const doi = (qid: string, id: string) =>
    setChon((cu) => {
      const ds = cu[qid] ?? []
      return { ...cu, [qid]: ds.includes(id) ? ds.filter((x) => x !== id) : [...ds, id] }
    })

  const daDoi = (lo?.cau ?? []).filter((c) => !giong(chon[c.qid] ?? c.goiY, c.goiY))
  const cauRong = daDoi.filter((c) => (chon[c.qid] ?? []).length === 0)
  const dsDang = [...new Map((lo?.cau ?? []).filter((c) => c.maDang).map((c) => [c.maDang!, c.tenDang || c.maDang!])).entries()]

  const themVkn = () => {
    const maDang = dangMoi || dsDang[0]?.[0] || ''
    const ten = tenMoi.trim()
    if (!maDang || !ten) return
    const v: Vkn = { id: idVknMoi(maDang, tatCaVkn), maDang, ten, tenLoi: tenLoiMoi.trim() || null, nhanNen: null, thuTu: tatCaVkn.filter((x) => x.maDang === maDang).length + 1 }
    setVknMoi((cu) => [...cu, v])
    setTenMoi('')
    setTenLoiMoi('')
  }

  const luu = async () => {
    if (dangLuu || (!daDoi.length && !vknMoi.length) || cauRong.length) return
    setDangLuu(true)
    setLoiLuu('')
    const r = await duyetLoQ(
      daDoi.map((c) => ({ qid: c.qid, vkn: chon[c.qid] ?? [], ...(c.vknY ? { vknY: c.vknY } : {}) })),
      vknMoi,
    )
    setDangLuu(false)
    if (!r.ok) {
      setLoiLuu(r.chu)
      return
    }
    showToast(`Đã lưu vi kỹ năng thầy sửa: ${r.du.daDuyet} câu`, 'success')
    // Câu đã sửa thành vi kỹ năng đang gắn mới; vi kỹ năng mới vào danh mục.
    setLo((cu) => (cu ? { ...cu, cau: cu.cau.map((c) => ({ ...c, goiY: chon[c.qid] ?? c.goiY })), vkn: [...cu.vkn, ...vknMoi] } : cu))
    setVknMoi([])
    setSua(false)
  }

  return (
    <>
      <p className="cd-phu" data-khoi="vi-ky-nang-bai">
        Vi kỹ năng: {TEN_AI} đã gắn tự động ·{' '}
        <button
          type="button"
          className="m3-nut-chu cd-nut-nho"
          style={{ padding: '0 8px', display: 'inline-flex', verticalAlign: 'baseline' }}
          aria-expanded={mo}
          aria-controls="cd-vkn-than"
          onClick={moXem}
        >
          {mo ? 'Thu gọn' : 'Xem'}
        </button>
      </p>
      {mo && (
        <section id="cd-vkn-than" className="cd-the" aria-labelledby="cd-vkn-tieu-de" data-khoi="vi-ky-nang-than">
          <div className="cd-the-dau">
            <h2 id="cd-vkn-tieu-de">Vi kỹ năng của bài</h2>
            {lo && lo.cau.length > 0 && (
              <button type="button" className="m3-nut-vien cd-nut-nho" aria-pressed={sua} onClick={() => setSua((x) => !x)}>
                {sua ? 'Thôi sửa' : 'Sửa vi kỹ năng'}
              </button>
            )}
          </div>
          <p className="cd-phu">Mỗi câu cần những vi kỹ năng nào — {TEN_AI} gắn từ nhãn kho. Thầy không cần làm gì; muốn đổi thì bấm “Sửa vi kỹ năng”.</p>
          {dangTai && !lo ? (
            <p className="cd-phu" aria-busy="true">
              Đang tải câu và vi kỹ năng…
            </p>
          ) : loi && !lo ? (
            <div className="cd-thanh-hanh-dong">
              <p className="cd-loi" role="alert">
                {loi}
              </p>
              <button type="button" className="m3-nut-vien cd-nut-nho" onClick={() => void tai()}>
                Thử lại
              </button>
            </div>
          ) : !lo || lo.cau.length === 0 ? (
            <p className="cd-phu">Chưa có câu nào để xem vi kỹ năng.</p>
          ) : (
            <>
              <ol className="cd-ds-cau" aria-label="Câu và vi kỹ năng đã gắn">
                {lo.cau.map((c) => {
                  const dangGan = chon[c.qid] ?? c.goiY
                  return (
                    <li key={c.qid} data-q={c.qid}>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 auto' }}>
                        <span>
                          <b>Câu {c.stt}</b> · {c.tenDang || 'Chưa có dạng'} <small className="cd-phu">· {TEN_PHAN[c.phan]}</small>
                        </span>
                        {c.de && <span className="cd-phu">{c.de}</span>}
                        {sua ? (
                          <span className="cd-hang-chip" role="group" aria-label={`Vi kỹ năng câu ${c.stt}`}>
                            {vknCua(c).map((v) => (
                              <button key={v.id} type="button" className="cd-chip" aria-pressed={dangGan.includes(v.id)} onClick={() => doi(c.qid, v.id)}>
                                {v.ten}
                              </button>
                            ))}
                          </span>
                        ) : (
                          <span className="cd-phu" data-vkn-gan={c.qid}>
                            Vi kỹ năng: {dangGan.length ? dangGan.map(tenVkn).join(' · ') : 'chưa gắn'}
                          </span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ol>
              {lo.conLai > 0 && (
                <div>
                  <button type="button" className="m3-nut-chu cd-nut-nho" disabled={dangTai} onClick={() => void tai(lo.cau[lo.cau.length - 1]?.qid)}>
                    {dangTai ? 'Đang tải…' : `Xem thêm câu (còn ${lo.conLai} câu)`}
                  </button>
                </div>
              )}
              {loi && lo && (
                <p className="cd-loi" role="alert">
                  {loi}
                </p>
              )}
              {sua && (
                <fieldset className="cd-truong cd-khung-tron" data-khoi="them-vkn">
                  <legend className="cd-nhan-nhom">Thêm vi kỹ năng mới</legend>
                  <div className="cd-luoi-2">
                    {dsDang.length > 1 && (
                      <div className="cd-chon">
                        <label htmlFor="cd-vkn-dang">Dạng</label>
                        <select id="cd-vkn-dang" value={dangMoi || dsDang[0]?.[0] || ''} onChange={(e) => setDangMoi(e.target.value)}>
                          {dsDang.map(([ma, ten]) => (
                            <option key={ma} value={ma}>
                              {ten}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <label className="cd-truong">
                      Tên vi kỹ năng
                      <input type="text" value={tenMoi} maxLength={80} placeholder="Ví dụ: Hệ số NaOH với ester của phenol" onChange={(e) => setTenMoi(e.target.value)} />
                    </label>
                    <label className="cd-truong">
                      Tên lỗi hay gặp (không bắt buộc)
                      <input type="text" value={tenLoiMoi} maxLength={80} placeholder="Ví dụ: quên phenol phản ứng 2 NaOH" onChange={(e) => setTenLoiMoi(e.target.value)} />
                    </label>
                  </div>
                  <div className="cd-hang-nut">
                    <button type="button" className="m3-nut-tonal cd-nut-nho" disabled={!tenMoi.trim() || !dsDang.length} onClick={themVkn}>
                      Thêm vi kỹ năng
                    </button>
                  </div>
                  {vknMoi.length > 0 && <small className="cd-phu">Vừa thêm: {vknMoi.map((v) => v.ten).join(' · ')} — bật cho câu cần ở trên.</small>}
                </fieldset>
              )}
              {sua && (
                <div className="cd-thanh-hanh-dong">
                  <p className="cd-phu">
                    {cauRong.length
                      ? `Câu ${cauRong.map((c) => c.stt).join(', ')} chưa có vi kỹ năng nào — bật ít nhất một.`
                      : daDoi.length || vknMoi.length
                        ? `Thầy đã đổi ${daDoi.length} câu${vknMoi.length ? ` · thêm ${vknMoi.length} vi kỹ năng` : ''}.`
                        : 'Chưa đổi gì.'}
                  </p>
                  {loiLuu && (
                    <p className="cd-loi" role="alert">
                      {loiLuu}
                    </p>
                  )}
                  <button type="button" className="m3-nut-chinh" disabled={dangLuu || cauRong.length > 0 || (!daDoi.length && !vknMoi.length)} onClick={() => void luu()}>
                    {dangLuu ? 'Đang lưu…' : 'Lưu vi kỹ năng đã sửa'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </>
  )
}

// EM NÀO ĐÃ MỞ PHIẾU KHẮC PHỤC — khối đứng ngay ở màn Ca thi (thầy chốt 08/09).
//
// ĐO ĐƯỢC GÌ, NÓI ĐÚNG THẾ. Máy chủ ghi mỗi phiếu bài tập hai thứ: mở mấy lần
// và lần cuối mở lúc nào. Nó KHÔNG ghi em làm được mấy câu — phiếu khắc phục
// là tệp HTML tĩnh, không có nút nộp. Nên khối này nói "mở" chứ không nói
// "làm"; gọi số lần mở là số câu đã luyện là bịa một con số thầy sẽ nhắn cho
// phụ huynh.
//
// BẤM LÀ ĐỒNG BỘ THẬT: hỏi lại máy chủ ngay tại lúc bấm, không đọc bản cũ
// trong bộ nhớ. Một lệnh cho một ca, quét mọi ca để dựng "lần 1, lần 2…".
import { useMemo, useState } from 'react'
import { ChevronDown, RefreshCw, Search } from 'lucide-react'
import { OThongBao, TheNoiDung } from './DesignSystem'
import { danhSachCa, phieuTheoCa } from '../lib/exam-api'

const SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }
const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }

export interface BaiKhacPhuc {
  maCa: string
  tenCa: string
  moLuc: string
  soLanXem: number
  xemLanCuoi: string
}

export interface EmLuyen {
  sbd: string
  hoTen: string
  /** Tổng số lần mở phiếu khắc phục, cộng mọi ca. 0 = chưa mở lần nào. */
  tongMo: number
  /** Số bài CÓ mở ít nhất một lần — "đã làm câu khắc phục ca nào". */
  soBaiDaMo: number
  bai: BaiKhacPhuc[]
}

function gioNgan(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Bỏ dấu để gõ "duy" tìm ra "Triệu Đức Duy". Cùng cách chuẩn hoá với cổng vào
 * thi: `ð`/`Ð` nhìn y hệt `đ`/`Đ` nên phải gộp cả bốn. */
export function khongDau(v: string): string {
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐðÐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** GOM LỊCH SỬ MỞ PHIẾU KHẮC PHỤC của mọi em, mọi ca.
 *
 * Tách khỏi component để test được bằng dữ liệu thật, không cần dựng React.
 * `dsCa` phải là danh sách ca CŨ TỚI MỚI — "lần 1" là bài đầu tiên. */
export function gomLuyen(dsCa: { maCa: string; tenCa: string; moLuc: string }[], phieuCua: Map<string, { sbd: string; hoTen: string; soLanXem: number; xemLanCuoi: string; loai: string }[]>): EmLuyen[] {
  const theoEm = new Map<string, EmLuyen>()
  for (const c of dsCa) {
    // Một em có thể có NHIỀU bản phiếu bài tập của cùng một ca (thầy dựng lại
    // nhiều lượt). Cộng số lần mở của mọi bản: em mở bản nào cũng là đã mở.
    const gom = new Map<string, { soLanXem: number; xemLanCuoi: string; hoTen: string }>()
    for (const p of (phieuCua.get(c.maCa) ?? []).filter((x) => x.loai === 'baitap')) {
      const cu = gom.get(p.sbd) ?? { soLanXem: 0, xemLanCuoi: '', hoTen: '' }
      cu.soLanXem += p.soLanXem
      if (p.xemLanCuoi > cu.xemLanCuoi) cu.xemLanCuoi = p.xemLanCuoi
      if (!cu.hoTen && p.hoTen) cu.hoTen = p.hoTen
      gom.set(p.sbd, cu)
    }
    gom.forEach((v, sbd) => {
      const em = theoEm.get(sbd) ?? { sbd, hoTen: v.hoTen, tongMo: 0, soBaiDaMo: 0, bai: [] }
      if (!em.hoTen && v.hoTen) em.hoTen = v.hoTen
      em.tongMo += v.soLanXem
      if (v.soLanXem > 0) em.soBaiDaMo += 1
      em.bai.push({ maCa: c.maCa, tenCa: c.tenCa || `Ca ${c.maCa}`, moLuc: c.moLuc, soLanXem: v.soLanXem, xemLanCuoi: v.xemLanCuoi })
      theoEm.set(sbd, em)
    })
  }
  // EM CHƯA MỞ LẦN NÀO LÊN ĐẦU — đó là danh sách thầy cần nhắc, không phải
  // danh sách em ngoan.
  return [...theoEm.values()].sort((a, b) => a.tongMo - b.tongMo || (a.hoTen || a.sbd).localeCompare(b.hoTen || b.sbd, 'vi'))
}

export default function KhoiLuyenKhacPhuc({ scriptUrl, maBiMat }: { scriptUrl: string; maBiMat: string }) {
  const [mo, setMo] = useState(false)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState('')
  const [luc, setLuc] = useState('')
  const [ds, setDs] = useState<EmLuyen[] | null>(null)
  const [tim, setTim] = useState('')
  const [emMo, setEmMo] = useState('')

  const tai = async () => {
    if (!scriptUrl.trim() || !maBiMat.trim()) return setLoi('Chưa có link Apps Script hoặc mã bí mật')
    setDangTai(true)
    setLoi('')
    try {
      const ca = (await danhSachCa(scriptUrl.trim(), maBiMat.trim()))
        .filter((c) => c.trangThai !== 'da_xoa')
        .sort((a, b) => String(a.moLuc ?? '').localeCompare(String(b.moLuc ?? '')))
      const phieuCua = new Map<string, { sbd: string; hoTen: string; soLanXem: number; xemLanCuoi: string; loai: string }[]>()
      for (const c of ca) phieuCua.set(c.maCa, await phieuTheoCa(scriptUrl.trim(), maBiMat.trim(), c.maCa))
      setDs(gomLuyen(ca.map((c) => ({ maCa: c.maCa, tenCa: c.tenCa, moLuc: c.moLuc })), phieuCua))
      setLuc(new Date().toISOString())
      setMo(true)
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không đọc được')
    } finally {
      setDangTai(false)
    }
  }

  const hien = useMemo(() => {
    const q = khongDau(tim)
    if (!q) return ds ?? []
    return (ds ?? []).filter((e) => khongDau(e.hoTen).includes(q) || e.sbd.includes(tim.trim()))
  }, [ds, tim])

  const chuaMo = (ds ?? []).filter((e) => e.tongMo === 0).length

  return (
    <TheNoiDung>
      <button
        type="button"
        onClick={() => (mo ? setMo(false) : void tai())}
        disabled={dangTai}
        aria-expanded={mo}
        className="tap-target font-bold w-full flex items-center"
        style={{ ...SO, gap: 'var(--k3)', textAlign: 'left', minHeight: 48, padding: 0, background: 'none', border: 'none', color: 'var(--muc)', fontSize: 'var(--cx-3)', fontFamily: 'var(--serif)' }}
      >
        <span className="flex-1 min-w-0">
          Luyện câu khắc phục
          <span style={{ ...NHAN_NHO, display: 'block', fontFamily: 'var(--sans)', fontWeight: 400 }}>
            {dangTai
              ? 'Đang hỏi máy chủ…'
              : mo && ds
                ? `${ds.length} em · ${chuaMo} em chưa mở lần nào · số liệu lúc ${gioNgan(luc)}`
                : 'Bấm để đồng bộ ngay từ máy chủ, quét mọi ca'}
          </span>
        </span>
        {dangTai ? <RefreshCw size={18} className="shrink-0" /> : <ChevronDown size={18} className="shrink-0" style={{ transform: mo ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }} />}
      </button>

      {loi && (
        <div style={{ marginTop: 'var(--k3)' }}>
          <OThongBao tone="do">{loi}</OThongBao>
        </div>
      )}

      {mo && ds && (
        <div className="flex flex-col" style={{ gap: 'var(--k3)', marginTop: 'var(--k3)' }}>
          {/* NÓI THẲNG GIỚI HẠN, ngay chỗ thầy đọc số. */}
          <OThongBao tone="cam">
            Máy đếm được em MỞ phiếu khắc phục mấy lần, KHÔNG đếm được em làm mấy câu — phiếu khắc phục là tệp tĩnh, không có nút nộp. Muốn đếm đúng số câu đã làm thì phải cho phiếu khắc phục nộp được như một ca bài tập.
          </OThongBao>

          <div className="relative">
            <Search size={18} className="absolute" style={{ left: 14, top: 15, color: 'var(--mo)' }} />
            <input
              value={tim}
              onChange={(e) => setTim(e.target.value)}
              placeholder="Tìm tên học sinh hoặc số báo danh…"
              inputMode="search"
              aria-label="Tìm học sinh"
              style={{
                height: 48,
                borderRadius: 'var(--bo-1)',
                padding: '0 var(--k4) 0 44px',
                background: 'var(--the-2)',
                border: '1.5px solid transparent',
                fontFamily: 'var(--sans)',
                fontSize: 'var(--cx-2)',
                color: 'var(--muc)',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          {ds.length === 0 && <div style={NHAN_NHO}>Chưa ca nào có phiếu khắc phục.</div>}
          {ds.length > 0 && hien.length === 0 && <div style={NHAN_NHO}>Không có em nào khớp “{tim}”.</div>}

          <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
            {hien.map((e) => {
              const dangMo = emMo === e.sbd
              return (
                <div key={e.sbd} style={{ background: e.tongMo === 0 ? 'var(--cam-nen)' : 'var(--the-2)', borderRadius: 'var(--bo-1)', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setEmMo(dangMo ? '' : e.sbd)}
                    aria-expanded={dangMo}
                    className="tap-target w-full flex items-center"
                    style={{ gap: 'var(--k3)', textAlign: 'left', minHeight: 48, padding: 'var(--k3)', background: 'none', border: 'none', color: 'var(--muc)' }}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="font-bold block" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }}>
                        {e.hoTen || `SBD ${e.sbd}`}
                      </span>
                      <span style={{ ...NHAN_NHO, ...SO, display: 'block' }}>
                        SBD {e.sbd} ·{' '}
                        {e.tongMo === 0 ? (
                          <span style={{ color: 'var(--cam)' }}>chưa mở phiếu khắc phục nào, cả {e.bai.length} bài</span>
                        ) : (
                          `mở ${e.tongMo} lần, ${e.soBaiDaMo}/${e.bai.length} bài`
                        )}
                      </span>
                    </span>
                    <ChevronDown size={16} className="shrink-0" style={{ color: 'var(--nhat)', transform: dangMo ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }} />
                  </button>

                  {dangMo && (
                    <div className="flex flex-col" style={{ gap: 4, padding: '0 var(--k3) var(--k3)' }}>
                      {e.bai.map((b, i) => (
                        <div key={b.maCa} style={{ ...NHAN_NHO, ...SO, color: 'var(--muc)' }}>
                          <b>Lần {i + 1}</b> · {b.tenCa} ·{' '}
                          {b.soLanXem === 0 ? <span style={{ color: 'var(--cam)' }}>chưa mở</span> : `mở ${b.soLanXem} lần${b.xemLanCuoi ? `, lần cuối ${gioNgan(b.xemLanCuoi)}` : ''}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </TheNoiDung>
  )
}

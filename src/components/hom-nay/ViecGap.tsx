import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, ChevronRight, Check, AlertTriangle } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { dinhDangDeCayThuMuc } from '../../screens/PhanCongScreen'
import { baiViecGap, guiCanhBaoNopBai, hanNopChu, layBtvnDangChay, loiCanhBaoMacDinh, tongChuaNop, type BaiViecGap, type EmChuaNop } from '../../lib/hom-nay-v2'
import type { KetQuaLenh } from '../../lib/goi-lenh-thay'
import type { DongTheoDoiBtvn } from '../../lib/btvn-may-chu-moi'
import '../../styles/hom-nay-v2.css'

const gioPhut = (ms: number) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(ms)
const SO_EM_MAC_DINH = 5

interface PhamVi {
  /** Em được chọn (theo bài) — một em, cả bài, hoặc cả các bài. */
  bai: BaiViecGap[]
  tieuDe: string
}

/** Ô VIỆC GẤP — CHƯA NỘP BÀI TẬP VỀ NHÀ (ô lớn nhất; bản vẽ docs/ban-ve-hom-nay-v2-2109/, thầy chốt 21/09): từng bài đang chạy — hạn nộp (HH:mm · Thứ … dd/mm/yyyy), đã nộp x/y, thanh tiến độ, danh sách em CHƯA NỘP
 *  xếp theo mức gấp, mỗi em một trạng thái THẬT (chưa mở bài / dở chặng 2 trong 7 chặng) + nút "Gửi cảnh báo"; nút gộp "Gửi cảnh báo cả N em".
 *  Nguồn: lệnh thầy sẵn có `/btvn/theo-doi`. Gửi cảnh báo = lệnh GHI `/gv/canh-bao-nop-bai` (Code 3): CHƯA có ⇒ nói thật, KHÔNG giả "đã gửi". Chỉ thầy bấm mới gửi; lời mặc định tế nhị, thầy sửa được. */
export default function ViecGap() {
  const classList = useAppStore((s) => s.classList)
  const showToast = useAppStore((s) => s.showToast)
  const [kq, setKq] = useState<KetQuaLenh<DongTheoDoiBtvn[]> | undefined>(undefined)
  const [nayMs, setNayMs] = useState(() => Date.now())
  // Bài nào đang mở (mặc định chỉ bài đầu = gấp nhất) và bài nào xem hết danh sách em.
  const [mo, setMo] = useState<Record<string, boolean>>({})
  const [xemHet, setXemHet] = useState<Set<string>>(new Set())
  const [pham, setPham] = useState<PhamVi | null>(null)
  const [loi, setLoi] = useState('')
  const [daSua, setDaSua] = useState(false)
  const [dangGui, setDangGui] = useState(false)
  const [ketQuaGui, setKetQuaGui] = useState<{ ok: boolean; chu: string } | null>(null)
  const [daGui, setDaGui] = useState<Record<string, string>>({})

  const tai = useCallback(() => {
    let con = true
    setKq(undefined)
    void layBtvnDangChay().then((r) => {
      if (!con) return
      setNayMs(Date.now())
      setKq(r)
    })
    return () => {
      con = false
    }
  }, [])
  useEffect(() => tai(), [tai])

  const lopCua = useCallback((sbd: string) => classList.find((h) => h.sbd === sbd)?.lop ?? '', [classList])
  const bai = useMemo(() => (kq?.ok ? baiViecGap(kq.du, nayMs, lopCua) : []), [kq, nayMs, lopCua])
  const tong = useMemo(() => tongChuaNop(bai), [bai])
  const tenBai = (b: BaiViecGap) => dinhDangDeCayThuMuc(b.maDe) || b.maDe

  const moHop = (p: PhamVi) => {
    setPham(p)
    setDaSua(false)
    setKetQuaGui(null)
    setLoi(loiCanhBaoMacDinh(tenBai(p.bai[0]), p.bai[0].han))
  }
  const soEmPham = pham ? new Set(pham.bai.flatMap((b) => b.chuaNop.map((e) => e.sbd))).size : 0

  const gui = async () => {
    if (!pham) return
    setDangGui(true)
    setKetQuaGui(null)
    let tongGui = 0
    const boQua: string[] = []
    let loiDau = ''
    const moi: Record<string, string> = {}
    for (const b of pham.bai) {
      // một lệnh cho mỗi dòng bài (bài giao theo nhiều ca có nhiều mã)
      const theoMa = new Map<string, string[]>()
      for (const e of b.chuaNop) theoMa.set(e.maBtvn, [...(theoMa.get(e.maBtvn) ?? []), e.sbd])
      for (const [ma, ds] of theoMa) {
        const r = await guiCanhBaoNopBai(ma, ds, daSua ? loi : loiCanhBaoMacDinh(tenBai(b), b.han))
        if (!r.ok) {
          loiDau = loiDau || r.chu
          continue
        }
        tongGui += r.du.daGui
        for (const x of r.du.boQua) boQua.push(`${x.sbd}: ${x.lyDo}`)
        const boSet = new Set(r.du.boQua.map((x) => x.sbd))
        for (const s of ds) if (!boSet.has(s)) moi[s] = r.du.luc ? gioPhut(Date.parse(r.du.luc)) : gioPhut(Date.now())
      }
    }
    setDangGui(false)
    setDaGui((c) => ({ ...c, ...moi }))
    if (loiDau && tongGui === 0) setKetQuaGui({ ok: false, chu: loiDau })
    else
      setKetQuaGui({
        ok: !loiDau,
        chu: `Đã gửi cảnh báo cho ${tongGui} em (thẻ nhắc ở app học sinh + thông báo cho phụ huynh).${boQua.length ? ` Bỏ qua ${boQua.length} em: ${boQua.join('; ')}.` : ''}${loiDau ? ` Một phần chưa gửi được: ${loiDau}` : ''}`,
      })
    if (tongGui > 0) showToast(`Đã gửi cảnh báo cho ${tongGui} em.`)
  }

  const chuaCoLenh = kq && !kq.ok && kq.loai === 'chua_co_lenh'

  const dong = (b: BaiViecGap, e: EmChuaNop) => (
    <div className="hn2-em" key={`${b.ma}-${e.sbd}`} data-sbd={e.sbd}>
      <span className={`hn2-em-chu hn2-em-chu--${e.muc}`} aria-hidden="true">
        {e.hoTen.trim().split(/\s+/).pop()?.[0]?.toUpperCase() ?? '?'}
      </span>
      <div className="hn2-em-thong-tin">
        <span className="hn2-em-ten">
          {e.hoTen} {e.lop && <span className="hn2-em-lop">· {e.lop}</span>}
        </span>
        <span className={`hn2-em-tt hn2-em-tt--${e.muc}`}>{e.chu}</span>
        {daGui[e.sbd] && (
          <span className="hn2-em-da-gui">
            <Check size={14} aria-hidden="true" /> Đã gửi cảnh báo {daGui[e.sbd]}
          </span>
        )}
      </div>
      {daGui[e.sbd] ? (
        <span className="hn2-chip hn2-chip--tot">
          <Check size={14} aria-hidden="true" /> Đã gửi
        </span>
      ) : (
        <button type="button" className="hn2-nut hn2-nut--canh hn2-nut--nho" aria-label={`Gửi cảnh báo cho ${e.hoTen}`} onClick={() => moHop({ bai: [{ ...b, chuaNop: [e] }], tieuDe: e.hoTen })}>
          <Bell size={16} aria-hidden="true" /> Gửi cảnh báo
        </button>
      )}
    </div>
  )

  return (
    <section className="hn2-the hn2-viec-gap" data-khoi="viec-gap" aria-labelledby="hn2-viec-gap-tieu-de">
      <div className="hn2-viec-dau">
        <span className="hn2-huy-hieu hn2-huy-hieu--canh" aria-hidden="true">
          <Bell size={30} />
        </span>
        <div className="hn2-viec-chu">
          <h2 id="hn2-viec-gap-tieu-de" className="hn2-tieu-de hn2-tieu-de--canh">
            Việc gấp · chưa nộp bài tập về nhà (BTVN)
          </h2>
          <p className="hn2-so-to">{kq === undefined ? '…' : kq.ok ? `${tong.soEm} em` : '—'}</p>
          <p className="hn2-phu">
            {kq === undefined ? 'Đang đọc bài tập về nhà…' : kq.ok ? (tong.soEm > 0 ? `chưa nộp · ${tong.soBai} bài đang chạy` : 'Không có em nào chưa nộp bài đang chạy.') : 'Chưa đọc được bài tập về nhà.'}
          </p>
        </div>
        {kq?.ok && tong.soEm > 0 && (
          <button type="button" className="hn2-nut hn2-nut--canh-dam" onClick={() => moHop({ bai, tieuDe: `cả ${tong.soEm} em` })}>
            <Bell size={18} aria-hidden="true" /> Gửi cảnh báo cả {tong.soEm} em
          </button>
        )}
      </div>

      {kq?.ok && tong.soEm > 0 && (
        <p className="hn2-ghi-chu">“Gửi cảnh báo” = thẻ nhắc ở app học sinh + thông báo cho phụ huynh · thầy sửa lời trước khi gửi · tối đa 1 lần/em/bài/ngày. Chỉ thầy bấm mới gửi.</p>
      )}

      {kq && !kq.ok && (
        <div className={`hn2-ghi-chu hn2-ghi-chu--${chuaCoLenh ? 'loi' : 'canh'}`} role="status">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>
            <b>{kq.chu}</b> Chưa có số nào để hiện — không phải lỗi của học sinh.{' '}
            <button type="button" className="hn2-lien-ket" onClick={tai}>
              Thử lại
            </button>
          </span>
        </div>
      )}

      {kq?.ok && bai.length === 0 && (
        <p className="hn2-trong">Hôm nay chưa có em nào chưa nộp bài đang chạy. Bài mới giao sẽ hiện ở đây khi có em chưa nộp.</p>
      )}

      {bai.map((b, i) => {
        const dangMo = mo[b.ma] ?? i === 0
        const hetEm = xemHet.has(b.ma)
        const hien = dangMo ? b.chuaNop.slice(0, hetEm ? 999 : SO_EM_MAC_DINH) : []
        const pc = b.tong > 0 ? Math.round((b.daNop / b.tong) * 100) : 0
        const lop = [...new Set(b.chuaNop.map((e) => e.lop).filter(Boolean))].join(', ')
        return (
          <div className={`hn2-bai${dangMo ? ' hn2-bai--mo' : ''}`} key={b.ma} data-bai={b.ma}>
            <div className="hn2-bai-dau">
              <div className="hn2-bai-ten">
                <b>{tenBai(b)}</b>
                {lop && <span className="hn2-em-lop"> · {lop}</span>}
                {b.quaHan && <span className="hn2-chip hn2-chip--loi hn2-chip--nho">QUÁ HẠN</span>}
                <span className={`hn2-bai-han${b.quaHan ? ' hn2-bai-han--qua' : ''}`}>{hanNopChu(b.han, nayMs)}</span>
              </div>
              <div className="hn2-bai-so">
                <b>{b.daNop}</b>
                <span>/{b.tong} đã nộp</span>
              </div>
            </div>
            <div className="hn2-thanh" role="img" aria-label={`${b.daNop} trên ${b.tong} em đã nộp`}>
              <i style={{ width: `${pc}%` }} />
            </div>
            {dangMo ? (
              <>
                {hien.map((e) => dong(b, e))}
                <div className="hn2-bai-chan">
                  <span className="hn2-phu">
                    {b.chuaNop.length > hien.length ? `Còn ${b.chuaNop.length - hien.length} em chưa nộp bài này` : `${b.chuaNop.length} em chưa nộp bài này`}
                  </span>
                  <span className="hn2-bai-chan-nut">
                    {b.chuaNop.length > SO_EM_MAC_DINH && (
                      <button
                        type="button"
                        className="hn2-lien-ket"
                        onClick={() =>
                          setXemHet((c) => {
                            const m = new Set(c)
                            if (m.has(b.ma)) m.delete(b.ma)
                            else m.add(b.ma)
                            return m
                          })
                        }
                      >
                        {hetEm ? 'Thu gọn' : `Xem cả ${b.chuaNop.length} em chưa nộp`}
                        <ChevronRight size={16} aria-hidden="true" />
                      </button>
                    )}
                    <button type="button" className="hn2-nut hn2-nut--canh hn2-nut--nho" onClick={() => moHop({ bai: [b], tieuDe: `${b.chuaNop.length} em bài này` })}>
                      <Bell size={16} aria-hidden="true" /> Gửi cảnh báo cả {b.chuaNop.length}
                    </button>
                  </span>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="hn2-lien-ket hn2-bai-xem"
                onClick={() => setMo((c) => ({ ...c, [b.ma]: true }))}
              >
                Xem {b.chuaNop.length} em chưa nộp
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        )
      })}

      {pham && (
        <div className="hn2-hop" role="dialog" aria-modal="true" aria-label="Gửi cảnh báo nộp bài tập về nhà">
          <div className="hn2-hop-noi">
            <h3 className="hn2-hop-tieu-de">Gửi cảnh báo cho {pham.tieuDe}?</h3>
            <p className="hn2-phu">
              Em sẽ thấy thẻ nhắc ở đầu bảng nhiệm vụ trong app học sinh, phụ huynh nhận thông báo. Mỗi em tối đa 1 cảnh báo cho mỗi bài mỗi ngày. Chỉ thầy bấm mới gửi.
            </p>
            <label className="hn2-hop-nhan" htmlFor="hn2-loi-nhan">
              Lời nhắn (thầy sửa được)
            </label>
            <textarea id="hn2-loi-nhan" className="hn2-hop-o" rows={4} maxLength={300} value={loi} onChange={(e) => (setLoi(e.target.value), setDaSua(true))} />
            {pham.bai.length > 1 && !daSua && <p className="hn2-phu">Thầy không sửa thì mỗi bài có lời riêng, ghi đúng tên bài và hạn nộp của bài ấy.</p>}
            {ketQuaGui && (
              <p className={`hn2-ghi-chu hn2-ghi-chu--${ketQuaGui.ok ? 'tot' : 'loi'}`} role={ketQuaGui.ok ? 'status' : 'alert'}>
                {ketQuaGui.chu}
              </p>
            )}
            <div className="hn2-hang-nut">
              {!ketQuaGui?.ok && (
                <button type="button" className="hn2-nut hn2-nut--canh-dam" disabled={dangGui || soEmPham === 0} onClick={() => void gui()}>
                  <Bell size={18} aria-hidden="true" /> {dangGui ? 'Đang gửi…' : `Gửi cảnh báo cho ${soEmPham} em`}
                </button>
              )}
              <button type="button" className="hn2-nut hn2-nut--vien" disabled={dangGui} onClick={() => setPham(null)}>
                {ketQuaGui?.ok ? 'Đóng' : 'Không gửi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

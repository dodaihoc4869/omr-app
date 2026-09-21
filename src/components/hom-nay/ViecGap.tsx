import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, ChevronRight, Check, AlertTriangle, RefreshCw } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { dinhDangDeCayThuMuc } from '../../screens/PhanCongScreen'
import { baiViecGap, chuTuDongNhac, daiNhacCuaEm, demTuNhacHomNay, guiCanhBaoNopBai, hanNopChu, khoaNhac, layBtvnDangChay, layTuDongNhac, loiCanhBaoMacDinh, tongChuaNop, type BaiViecGap, type EmChuaNop, type TuDongNhac } from '../../lib/hom-nay-v2'
import KhungCuon from './KhungCuon'
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

/** Ô VIỆC GẤP — CHƯA NỘP BÀI TẬP VỀ NHÀ (bản vẽ docs/ban-ve-hom-nay-v2-2109/, thầy chốt 21/09; BẢN B 21/09: khung cuộn, đầu dính, MÁY CHỦ TỰ NHẮC — thầy chỉ xem): từng bài đang chạy — hạn nộp (HH:mm · Thứ … dd/mm/yyyy), đã nộp x/y, thanh tiến độ, danh sách em CHƯA NỘP
 *  xếp theo mức gấp, mỗi em một trạng thái THẬT (chưa mở bài / dở chặng 2 trong 7 chặng) + nút "Gửi cảnh báo"; nút gộp "Gửi cảnh báo cả N em".
 *  Nguồn: lệnh thầy sẵn có `/btvn/theo-doi`. Gửi cảnh báo = lệnh GHI `/gv/canh-bao-nop-bai` (Code 3): CHƯA có ⇒ nói thật, KHÔNG giả "đã gửi". Chỉ thầy bấm mới gửi; lời mặc định tế nhị, thầy sửa được. */
export default function ViecGap() {
  const classList = useAppStore((s) => s.classList)
  const showToast = useAppStore((s) => s.showToast)
  const moToanCanh = useAppStore((s) => s.moToanCanh)
  const [kq, setKq] = useState<KetQuaLenh<DongTheoDoiBtvn[]> | undefined>(undefined)
  const [td, setTd] = useState<KetQuaLenh<TuDongNhac> | undefined>(undefined)
  const setScreen = useAppStore((s) => s.setScreen)
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
    setTd(undefined)
    void layBtvnDangChay().then((r) => {
      if (!con) return
      setNayMs(Date.now())
      setKq(r)
    })
    // trạng thái tự động nhắc là phần THÊM: chậm/lỗi không được làm hỏng danh sách em chưa nộp
    void layTuDongNhac().then((r) => con && setTd(r))
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
        chu: `Đã nhắc ${tongGui} em (thẻ nhắc ở app học sinh + thông báo cho phụ huynh).${boQua.length ? ` Bỏ qua ${boQua.length} em: ${boQua.join('; ')}.` : ''}${loiDau ? ` Một phần chưa nhắc được: ${loiDau}` : ''}`,
      })
    if (tongGui > 0) showToast(`Đã nhắc ${tongGui} em.`)
  }

  const chuaCoLenh = kq && !kq.ok && kq.loai === 'chua_co_lenh'

  const dong = (b: BaiViecGap, e: EmChuaNop) => {
    const dai = td?.ok ? daiNhacCuaEm(td.du.theoEm[khoaNhac(e.maBtvn, e.sbd)], nayMs) : null
    return (
      <div className="hn2-em" key={`${b.ma}-${e.sbd}`} data-sbd={e.sbd}>
        <span className={`hn2-em-chu hn2-em-chu--${e.muc}`} aria-hidden="true">
          {e.hoTen.trim().split(/\s+/).pop()?.[0]?.toUpperCase() ?? '?'}
        </span>
        <div className="hn2-em-thong-tin">
          <button type="button" className="hn2-em-ten hn2-em-ten--nut" title={e.hoTen} onClick={() => moToanCanh(e.sbd)} aria-label={`${e.hoTen}${e.lop ? ` · ${e.lop}` : ''} — mở toàn cảnh`}>
            {e.hoTen} {e.lop && <span className="hn2-em-lop">· {e.lop}</span>}
          </button>
          <span className={`hn2-em-tt hn2-em-tt--${e.muc}`}>{e.chu}</span>
          {dai && <span className={`hn2-em-dai hn2-em-dai--${dai.vai}`}>{dai.chu}</span>}
          {daGui[e.sbd] && (
            <span className="hn2-em-da-gui">
              <Check size={14} aria-hidden="true" /> Đã nhắc {daGui[e.sbd]}
            </span>
          )}
        </div>
        {daGui[e.sbd] ? (
          <span className="hn2-chip hn2-chip--tot">
            <Check size={14} aria-hidden="true" /> Đã nhắc
          </span>
        ) : (
          <button type="button" className="hn2-nut hn2-nut--vien hn2-nut--nho" aria-label={`Nhắc ngay cho ${e.hoTen}`} onClick={() => moHop({ bai: [{ ...b, chuaNop: [e] }], tieuDe: e.hoTen })}>
            <Bell size={16} aria-hidden="true" /> Nhắc ngay
          </button>
        )}
      </div>
    )
  }

  const homNay = td?.ok ? demTuNhacHomNay(td.du, nayMs) : null

  return (
    <section className="hn2-the hn2-khung hn2-viec-gap" data-khoi="viec-gap" aria-labelledby="hn2-viec-gap-tieu-de">
      <div className="hn2-khung-dau">
        <div className="hn2-viec-dau">
          <span className="hn2-huy-hieu hn2-huy-hieu--canh" aria-hidden="true">
            <Bell size={24} />
          </span>
          <div className="hn2-viec-chu">
            <h2 id="hn2-viec-gap-tieu-de" className="hn2-tieu-de hn2-tieu-de--canh hn2-tieu-de--1dong" title="Việc gấp · chưa nộp bài tập về nhà">
              Việc gấp · chưa nộp bài tập về nhà
            </h2>
            <p className="hn2-so-dong">
              <b className="hn2-so-to">{kq === undefined ? '…' : kq.ok ? `${tong.soEm} em` : '—'}</b>
              <span className="hn2-phu">
                {kq === undefined ? 'Đang đọc bài tập về nhà…' : kq.ok ? (tong.soEm > 0 ? `chưa nộp · ${tong.soBai} bài đang chạy` : 'Không có em nào chưa nộp bài đang chạy.') : 'Chưa đọc được bài tập về nhà.'}
              </span>
            </p>
          </div>
        </div>
        {td?.ok && (
          <p className="hn2-tu-dong" data-khoi="tu-dong">
            <RefreshCw size={14} aria-hidden="true" />
            <span>
              <b>{chuTuDongNhac(td.du, nayMs)}</b>
              {homNay && (
                <>
                  {' '}
                  · Hôm nay đã tự nhắc <span className="hn2-nw">{homNay.soEm} em</span> · <span className="hn2-nw">{homNay.soPhuHuynh} phụ huynh</span>
                  {homNay.tuDanhSach && ' (trong danh sách này)'}
                </>
              )}
            </span>
          </p>
        )}
        {td && !td.ok && (
          <p className="hn2-tu-dong hn2-tu-dong--chua" data-khoi="tu-dong">
            <RefreshCw size={14} aria-hidden="true" />
            <span>{td.chu}</span>
          </p>
        )}
      </div>

      <KhungCuon nhan="Danh sách em chưa nộp bài tập về nhà">
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
                    <button type="button" className="hn2-lien-ket" onClick={() => moHop({ bai: [b], tieuDe: `${b.chuaNop.length} em bài này` })}>
                      <Bell size={16} aria-hidden="true" /> Nhắc ngay cả {b.chuaNop.length}
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

      </KhungCuon>
      {kq?.ok && (
        <div className="hn2-khung-chan">
          <span className="hn2-phu">{bai.length > 0 ? `${bai.length} bài đang chạy có em chưa nộp` : ''}</span>
          <button type="button" className="hn2-lien-ket" onClick={() => setScreen('giaobtvn')}>
            Xem tất cả
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {pham && (
        <div className="hn2-hop" role="dialog" aria-modal="true" aria-label="Nhắc ngay em chưa nộp bài tập về nhà">
          <div className="hn2-hop-noi">
            <h3 className="hn2-hop-tieu-de">Nhắc ngay {pham.tieuDe}?</h3>
            <p className="hn2-phu">
              Em sẽ thấy thẻ nhắc ở đầu bảng nhiệm vụ trong app học sinh, phụ huynh nhận thông báo. Máy chủ vẫn tự nhắc theo các mốc; “Nhắc ngay” là thêm một lần ngoài mốc. Mỗi em tối đa 1 lần nhắc cho mỗi bài mỗi ngày (kể cả lần tự động).
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
                  <Bell size={18} aria-hidden="true" /> {dangGui ? 'Đang nhắc…' : `Nhắc ngay ${soEmPham} em`}
                </button>
              )}
              <button type="button" className="hn2-nut hn2-nut--vien" disabled={dangGui} onClick={() => setPham(null)}>
                {ketQuaGui?.ok ? 'Đóng' : 'Không nhắc'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

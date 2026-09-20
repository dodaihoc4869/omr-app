// ĐOÀN HỘ TỐNG — khung điều khiển phía máy em: Sảnh → Trong trận / Trùm → Tung chưởng → Kết chặng.
// Đồng bộ bằng hỏi-đáp ngắn 1,5 s với /game-v2/doan-xem (giả định đã chốt, chưa dùng WebSocket). Mọi luật, mọi phép chấm ở MÁY CHỦ;
// ở đây chỉ vẽ đúng thứ máy chủ trả về. Vẽ vào document.body (cổng) để là lớp phủ toàn màn, không dính kiểu nút của game cũ.
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Question } from './core'
import type { HanhDong, KhungNhinHiep } from './doan-core'
import { HIEP_TRUM } from './doan-core'
import type { AnXem, BanDongHanhXem, DoanXem, GoiDoan, GoiYTiepSuc, KetQuaCau, PhanHoiDoan, SanhXem } from './doan-kieu'
import DoanSanh, { type GoiYHomNay } from './DoanSanh'
import DoanTran, { type CauVuaLam, type LoiGiaiTrum } from './DoanTran'
import DoanTungChuong from './DoanTungChuong'
import DoanKetChang from './DoanKetChang'
import DoanTiepSuc from './DoanTiepSuc'
import { ManHinhAnh } from '../../components/QuestionMedia'
import { unlockBattleAudio } from './battle-audio'
import './doan.css'

export const NHIP_HOI_MS = 1500
const khoaLuu = (sbd: string) => `doan:${sbd}`
const loiCua = (e: unknown) => (e instanceof Error ? e.message : 'Chưa kết nối được. Em thử lại nhé.')

export default function DoanHoTong({ call, sbd, pet, cap, onDong, onVeBangNhiemVu }: { call: GoiDoan; sbd: string; pet: number; cap: number; onDong: () => void; onVeBangNhiemVu: () => void }) {
  const [xem, setXem] = useState<DoanXem | null>(null)
  const [goiY, setGoiY] = useState<GoiYHomNay | null>(null), [sanh, setSanh] = useState<SanhXem | null>(null)
  const [anThach, setAnThach] = useState<AnXem | null>(null), [banDongHanh, setBanDongHanh] = useState<BanDongHanhXem | null>(null)
  const [ban, setBan] = useState(false), [loi, setLoi] = useState(''), [zoom, setZoom] = useState('')
  const [chon, setChon] = useState(''), [hanhDong, setHanhDong] = useState<HanhDong>('danh'), [yChon, setYChon] = useState<Record<number, 'D' | 'S'>>({})
  const [ketQuaCau, setKetQuaCau] = useState<KetQuaCau | null>(null), [cauVuaLam, setCauVuaLam] = useState<CauVuaLam | null>(null)
  const [tungChuong, setTungChuong] = useState<KhungNhinHiep | null>(null), [loiGiaiTrum, setLoiGiaiTrum] = useState<LoiGiaiTrum | null>(null)
  const [goiYThe, setGoiYTiepSuc] = useState<GoiYTiepSuc | null>(null), [expTiepSuc, setExpTiepSuc] = useState(0)
  const [expNhan, setExpNhan] = useState(0), [, setNhip] = useState(0), [choRoi, setChoRoi] = useState(false)
  const de = useRef(new Map<string, Question>()), moc = useRef({ luc: 0, conMs: 0, moSauMs: 0 }), phienBan = useRef({ ma: '', revision: -1 })
  const hiepDaChieu = useRef(0), hiepDangLam = useRef(0), khoa = useRef(false), song = useRef(true)
  const tinh = (() => { try { return localStorage.getItem('game-v2-low') === '1' } catch { return false } })()

  useEffect(() => { song.current = true; return () => { song.current = false } }, [])

  const apDung = useCallback((r: PhanHoiDoan) => {
    const d = r.doan
    if (!d || !song.current) return
    if (d.ma === phienBan.current.ma && d.revision < phienBan.current.revision) return // gói tin cũ tới trễ
    phienBan.current = { ma: d.ma, revision: d.revision }
    try { sessionStorage.setItem(khoaLuu(sbd), d.ma) } catch { /* máy chặn lưu: vẫn chơi được */ }
    if (d.cau?.de && d.cau.qid) de.current.set(d.cau.qid, d.cau.de)
    if (d.trum?.de && d.trum.qid) de.current.set(d.trum.qid, d.trum.de)
    moc.current = { luc: performance.now(), conMs: d.tran?.conMs ?? 0, moSauMs: d.tran?.moSauMs ?? 0 }
    const hiep = d.tran?.hiep ?? 0
    if (hiep !== hiepDangLam.current) { hiepDangLam.current = hiep; setChon(''); setHanhDong('danh'); setYChon({}); setKetQuaCau(null); setChoRoi(false); setGoiYTiepSuc(null); setExpTiepSuc(0) }
    const vua = d.hiepVuaXong
    if (vua && vua.hiep > hiepDaChieu.current) { hiepDaChieu.current = vua.hiep; setTungChuong(vua); setLoiGiaiTrum(null) }
    setXem(d)
  }, [sbd])

  const goi = useCallback(async (lenh: string, data: Record<string, unknown> = {}) => {
    if (khoa.current) return null
    khoa.current = true; setBan(true); setLoi('')
    try { const r = await call(lenh, data) as PhanHoiDoan; apDung(r); return r } catch (e) { if (song.current) setLoi(loiCua(e)); return null } finally { khoa.current = false; if (song.current) setBan(false) }
  }, [call, apDung])

  // Mở lại chặng đang dở (tải lại trang / đổi tab) và đọc "câu của riêng em hôm nay" cho thẻ Chặng hôm nay.
  useEffect(() => {
    let ma = ''; try { ma = sessionStorage.getItem(khoaLuu(sbd)) ?? '' } catch { /* bỏ qua */ }
    // Sảnh: vé, chuỗi/rương, Đoàn lớp, Trùm lớp — và chặng đang dở trên máy KHÁC (máy này chưa có mã lưu) thì mở lại luôn.
    void call('doan-sanh').then(r => { const x = r as PhanHoiDoan; if (!song.current) return; setSanh(x.sanh ?? null); setAnThach(x.anThach ?? null); setBanDongHanh(x.banDongHanh ?? null); if (!ma && x.dangDo) void call('doan-xem', { ma: x.dangDo }).then(v => apDung(v as PhanHoiDoan)).catch(() => {}) }).catch(() => { /* máy chủ cũ chưa có lệnh: Sảnh giữ ô SẮP MỞ */ })
    if (ma) void call('doan-xem', { ma }).then(r => apDung(r as PhanHoiDoan)).catch(() => { try { sessionStorage.removeItem(khoaLuu(sbd)) } catch { /* bỏ qua */ } })
    void call('recommendations').then(r => {
      const x = r as { suggestions?: { title: string }[]; remaining?: number }
      const dem = new Map<string, number>(); for (const s of x.suggestions ?? []) dem.set(s.title, (dem.get(s.title) ?? 0) + 1)
      if (song.current) setGoiY({ tong: x.suggestions?.length ?? 0, nhom: [...dem].map(([ten, so]) => ({ ten, so })).slice(0, 3), hetLuot: x.remaining === 0 })
    }).catch(() => { /* không có gợi ý: thẻ dùng lời chung */ })
  }, [sbd, call, apDung])

  const dangDi = !!xem && (!xem.batDau || !xem.tran?.ketThuc)
  // Hỏi-đáp ngắn: chỉ khi đang có đoàn, tab đang hiện, không có lệnh khác đang bay.
  useEffect(() => {
    if (!dangDi || !xem) return
    const ma = xem.ma
    const hoi = async () => {
      if (document.hidden || khoa.current) return
      const qid = xem.cau?.qid ?? xem.trum?.qid
      try { apDung(await call('doan-xem', { ma, coCau: qid && de.current.has(qid) ? qid : undefined }) as PhanHoiDoan) } catch { /* mạng chập chờn: lần hỏi sau thử lại */ }
    }
    const t = setInterval(() => void hoi(), NHIP_HOI_MS)
    return () => clearInterval(t)
  }, [dangDi, xem?.ma, xem?.cau?.qid, xem?.trum?.qid, call, apDung]) // eslint-disable-line react-hooks/exhaustive-deps

  // Đồng hồ vẽ lại 4 lần/giây từ mốc máy chủ trả (không tin đồng hồ máy em cho việc chấm — chỉ để vẽ).
  useEffect(() => { if (!xem?.batDau || xem.tran?.ketThuc) return; const t = setInterval(() => setNhip(n => n + 1), 250); return () => clearInterval(t) }, [xem?.batDau, xem?.tran?.ketThuc])
  const troi = performance.now() - moc.current.luc
  const moSauGiay = Math.ceil(Math.max(0, moc.current.moSauMs - troi) / 1000)
  const conGiay = Math.ceil(Math.max(0, moc.current.conMs - Math.max(0, troi - moc.current.moSauMs)) / 1000)
  // Hiệp vừa mở hoặc vừa hết giờ → hỏi ngay, không chờ nhịp.
  const daMo = moSauGiay <= 0
  useEffect(() => { if (xem?.batDau && !xem.tran?.ketThuc && !khoa.current) void call('doan-xem', { ma: xem.ma }).then(r => apDung(r as PhanHoiDoan)).catch(() => {}) }, [daMo, conGiay <= 0]) // eslint-disable-line react-hooks/exhaustive-deps

  const tran = xem?.tran
  const deHienTai = xem?.cau?.qid ? de.current.get(xem.cau.qid) : undefined
  const deTrum = xem?.trum?.qid ? de.current.get(xem.trum.qid) : undefined

  const chot = async (boTrong: boolean) => {
    if (!xem || !tran) return
    unlockBattleAudio()
    const r = await goi('doan-nop', boTrong ? { ma: xem.ma, hiep: tran.hiep, boTrong: true, hanhDong: 'chan' } : { ma: xem.ma, hiep: tran.hiep, answer: chon, hanhDong })
    if (!r) return
    const kq = r.ketQuaCau ?? null
    // Đi một mình thì chốt xong hiệp giải NGAY và máy chủ đã sang hiệp mới: kết quả này thuộc hiệp cũ, chỉ hiện ở quãng nghỉ (cauVuaLam).
    if (r.doan?.tran?.hiep === tran.hiep) setKetQuaCau(kq)
    if (kq?.reward) setExpNhan(n => n + (kq.reward ?? 0))
    setCauVuaLam(deHienTai ? { q: deHienTai, chon: boTrong ? '' : chon, ketQua: kq } : null)
  }
  const moTiepSuc = async (ghe: number) => { if (!xem) return; const r = await goi('doan-the-goi-y', { ma: xem.ma, den: ghe }); if (r?.goiY) setGoiYTiepSuc(r.goiY) }
  const guiThe = async (loai: string) => {
    if (!xem || !tran || !goiYThe) return
    const r = await goi('doan-tiep-suc', { ma: xem.ma, hiep: tran.hiep, den: goiYThe.den, the: loai })
    if (r) { setGoiYTiepSuc(null); setExpTiepSuc(r.expTiepSuc?.exp ?? 0) }
  }
  const chotY = (y: number) => { if (xem && tran && yChon[y]) void goi('doan-nop-y', { ma: xem.ma, hiep: tran.hiep, y, answer: yChon[y] }) }
  const roi = async () => {
    if (!xem) return
    if (xem.batDau && !xem.tran?.ketThuc && !choRoi) { setChoRoi(true); setLoi('Chạm "Rời chặng" lần nữa để rời. Máy sẽ đỡ thay em, đội không bị phạt.'); return }
    const r = await goi('doan-roi', { ma: xem.ma })
    if (r?.daRoi) veSanh()
  }
  const veSanh = () => {
    try { sessionStorage.removeItem(khoaLuu(sbd)) } catch { /* bỏ qua */ }
    phienBan.current = { ma: '', revision: -1 }; hiepDaChieu.current = 0; hiepDangLam.current = 0
    setXem(null); setTungChuong(null); setCauVuaLam(null); setLoiGiaiTrum(null); setExpNhan(0); setLoi('')
    void call('doan-sanh').then(r => { if (song.current) setSanh((r as PhanHoiDoan).sanh ?? null) }).catch(() => {})
  }
  const xongChuong = () => {
    const kq = tungChuong; setTungChuong(null)
    // Sau hiệp trùm có câu chung: giờ mới được xin đáp án + lời giải (máy chủ chỉ mở sau khi hiệp ấy đã giải).
    if (kq?.laTrum && xem && HIEP_TRUM.includes(kq.hiep)) void call('doan-loi-giai-trum', { ma: xem.ma, hiep: kq.hiep }).then(r => { const lg = (r as PhanHoiDoan).loiGiaiTrum; if (lg && song.current) setLoiGiaiTrum(lg) }).catch(() => {})
  }

  // Chặng vừa kết thúc → hỏi lại Sảnh một lần để nút "Đi thêm một chặng · 1 vé" nói đúng số vé em đang có.
  const daKet = !!xem?.tran?.ketThuc
  const [veSauChang, setVeSauChang] = useState<number | null | undefined>(undefined)
  useEffect(() => { if (!daKet) { setVeSauChang(undefined); return } void call('doan-sanh').then(r => { if (song.current) { const x = (r as PhanHoiDoan).sanh; setSanh(x ?? null); setVeSauChang(x ? x.ve : undefined) } }).catch(() => {}) }, [daKet, call])
  const trongTran = !!xem?.batDau && !!tran && !(tran.ketThuc && !tungChuong)
  const loaiQuaiVuaDanh = tungChuong && !tungChuong.laTrum ? (tungChuong.hiep < HIEP_TRUM[0]! ? 0 : 1) : 0
  const than = !xem || !xem.batDau || !tran ? (
    <DoanSanh pet={pet} cap={cap} tenDoan="Đoàn Hộ Tống" goiY={goiY} sanh={sanh} anThach={anThach} banDongHanh={banDongHanh} phong={xem} ban={ban} loi={loi}
      onLenDuong={() => { unlockBattleAudio(); void goi('doan-mo') }} onMoPhong={() => { unlockBattleAudio(); void goi('doan-mo', { cheDo: 'phong' }) }}
      onVaoPhong={ma => { unlockBattleAudio(); void goi('doan-vao', { ma }) }} onBatDau={() => xem && void goi('doan-bat-dau', { ma: xem.ma })} onRoi={() => void roi()} onDong={onDong} />
  ) : tran.ketThuc && !tungChuong && xem.ketChang ? (
    <DoanKetChang xem={xem} expNhan={expNhan} ve={veSauChang} ban={ban} onVe={() => { veSanh(); onVeBangNhiemVu() }} onDiTiep={veSanh} />
  ) : (
    <DoanTran xem={xem} de={deHienTai} deTrum={deTrum} conGiay={conGiay} moSauGiay={moSauGiay} chon={chon} onChon={setChon} hanhDong={hanhDong} onHanhDong={setHanhDong}
      yChon={yChon} onYChon={(y, v) => setYChon(o => ({ ...o, [y]: v }))} onChot={b => void chot(b)} onChotY={chotY} onTinHieu={t => void goi('doan-tin-hieu', { ma: xem.ma, tinHieu: t })}
      onXinTiepSuc={bat => void goi('doan-tin-hieu', { ma: xem.ma, tinHieu: bat ? 'can_tiep_suc' : '' })} onMoTiepSuc={g => void moTiepSuc(g)} expTiepSuc={expTiepSuc}
      onRoi={() => void roi()} onZoom={setZoom} ban={ban} loi={goiYThe ? '' : loi} ketQuaCau={ketQuaCau} cauVuaLam={cauVuaLam} loiGiaiTrum={loiGiaiTrum} />
  )

  return createPortal(
    <div className={`dh ${tinh ? 'dh-tinh' : ''} ${trongTran ? 'dh-tran' : ''}`} data-man={!xem?.batDau ? 'sanh' : tran?.ketThuc && !tungChuong ? 'ket-chang' : tran?.laTrum ? 'trum' : 'tran'}>
      {than}
      {tungChuong && xem && tran && <DoanTungChuong kq={tungChuong} ghe={xem.ghe} loaiQuai={tran.loaiQuai[loaiQuaiVuaDanh] ?? 'bun_acid'} tenQuai={tran.tenQuai[loaiQuaiVuaDanh] ?? 'Tạp Chất'} tinh={tinh} onXong={xongChuong} />}
      {goiYThe && trongTran && !tungChuong && <DoanTiepSuc goiY={goiYThe} ban={ban} loi={loi} onChon={l => void guiThe(l)} onDong={() => { setGoiYTiepSuc(null); setLoi('') }} />}
      {zoom && <ManHinhAnh src={zoom} alt="Ảnh của câu" onClose={() => setZoom('')} />}
    </div>,
    document.body,
  )
}

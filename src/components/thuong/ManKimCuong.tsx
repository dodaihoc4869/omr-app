// THỬ THÁCH KIM CƯƠNG (bản vẽ tp-12, thầy chốt 26/10): mời → làm 10 câu khó (3 ống nghiệm = mạng) → trượt (khoá 24 giờ) / đạt (+40 tinh thể, huy hiệu).
// Hợp đồng 4.4: POST /hs/kim-cuong/bat-dau {chuyenDe} → {phien, cau[10] KHÔNG đáp án, ong: 3}; nộp qua lệnh `answer` sẵn có kèm `phien`; phản hồi thêm
// `kimCuong: {ongCon, xong?, dat?}` (+ `thuong` nguyên tử như mọi câu). Đáp án không xuống máy trước khi nộp. Công tắc «Kim cương» tắt ⇒ màn ẩn.
// Hiệu ứng: mời — huy hiệu bật lên · H2 ống nghiệm vỡ: nứt, mảnh rơi, chất lỏng tràn · trượt — Bi buồn, ống rung · D3 đạt — huy hiệu lật 3D, hoa giấy.
import { useRef, useState } from 'react'
import { Check, Clock, RefreshCw, Target, Trophy } from 'lucide-react'
import { ChemText } from '../../lib/chem-format'
import { Bi } from '../linh-vat/Bi'
import { goiHoa2, guiLaiKhiKetMang } from '../hoa2/api'
import { bayToi, bungHat, hoaGiay, hoatAnh, phanHoiThuong } from '../../lib/hieu-ung-thuong'
import { DUONG, batDauKimCuong, docKimCuongCau, docThuongCau, layDsKimCuong, type CauKimCuong, type MucKimCuong, type PhienKimCuong, type ThuongCau } from '../../lib/thuong-api'
import { HuyHieuKimLoai, IcTinhThe, OngMang, Tia } from './hinh'
import { OngNghiem, TamThuong } from './TamThuong'
import { capNhatTongQuan, useTai, useTongQuan } from './dung-thuong'
import { Cho, Loi, ManToan, NutDay, gioVn, oTinhThe, thuNgayVn, useHieuUng } from './chung'
import { DauVe } from './ManChuoi'

type Buoc = 'moi' | 'lam' | 'truot' | 'dat'
export interface PropsKimCuong {
  token?: string; chuyenDe: string; tenChuyenDe: string; onDong: () => void; onOnLai?: () => void
  /** Chỉ cảnh chụp / test: mở sẵn một bước với phiên giả. */
  batDau?: { buoc: Buoc; phien?: PhienKimCuong; viTri?: number; vo?: number; dung?: number }
}

function MangBa({ con, tong = 3, id }: { con: number; tong?: number; id?: string }) {
  return <span className="tp-mang" id={id} role="img" aria-label={`Còn ${con}/${tong} ống nghiệm`}>{Array.from({ length: tong }, (_, i) => <OngMang key={i} vo={i < tong - con} className={i === tong - con - 1 ? 'vua-vo' : ''} />)}</span>
}

export function ManKimCuong({ token, chuyenDe, tenChuyenDe, onDong, onOnLai, batDau }: PropsKimCuong) {
  const tq = useTongQuan(token).du
  const [buoc, setBuoc] = useState<Buoc>(batDau?.buoc ?? 'moi')
  const [phien, setPhien] = useState<PhienKimCuong | null>(batDau?.phien ?? null)
  const [viTri, setViTri] = useState(batDau?.viTri ?? 0)
  const [ongCon, setOngCon] = useState(3 - (batDau?.vo ?? 0))
  const [soDung, setSoDung] = useState(batDau?.dung ?? 0)
  const [tra, setTra] = useState('')
  const [kq, setKq] = useState<{ dung: boolean; thuong: ThuongCau | null; xong?: boolean; dat?: boolean } | null>(null)
  const [loi, setLoi] = useState('')
  const [gui, setGui] = useState(false)
  const t0 = useRef(Date.now())
  const hh = useRef<HTMLDivElement>(null), bi = useRef<HTMLDivElement>(null)
  useHieuUng((h) => {
    if (buoc === 'moi') {
      hoatAnh(hh.current, [{ transform: 'translateY(30px) scale(.6)', opacity: 0 }, { transform: 'translateY(-8px) scale(1.06)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }], 700)
      hoatAnh(document.querySelector('.tp-toan .tp-tia'), [{ opacity: 0 }, { opacity: 1 }], 700, { tre: 300 })
      h.sau(500, () => bungHat(hh.current, { n: 10, r: 100, mau: ['kc', 'bang', 'trang'] }))
    } else if (buoc === 'truot') {
      phanHoiThuong('truot')
      hoatAnh(document.getElementById('tp-kc-ba-vo'), [{ transform: 'none' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], 420, { tre: 200 })
      hoatAnh(bi.current, [{ transform: 'translateY(-10px)', opacity: 0 }, { transform: 'none', opacity: 1 }], 500)
    } else if (buoc === 'dat') {
      phanHoiThuong('huyHieu')
      hoatAnh(hh.current, [{ transform: 'perspective(500px) rotateY(-180deg) scale(.5)', opacity: 0 }, { transform: 'perspective(500px) rotateY(-90deg) scale(.8)', opacity: 1, offset: 0.4 }, { transform: 'perspective(500px) rotateY(20deg) scale(1.1)', offset: 0.8 }, { transform: 'perspective(500px) rotateY(0) scale(1)' }], 800)
      hoatAnh(document.querySelector('.tp-toan .tp-tia'), [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'none' }], 700, { tre: 500 })
      hoatAnh(bi.current, [{ transform: 'translateY(0)' }, { transform: 'translateY(-24px)' }, { transform: 'translateY(0)' }, { transform: 'translateY(-10px)' }, { transform: 'translateY(0)' }], 900, { tre: 600 })
      h.sau(650, () => { bungHat(hh.current, { n: 14, r: 110, mau: ['kc', 'bang', 'tt', 'trang'] }); hoaGiay(28, 1200) })
    }
  }, [buoc])
  if (tq && !tq.bat.kimCuong) return null

  const vo = () => {
    phanHoiThuong('vo')
    const o = document.querySelector('.tp-toan .tp-mang .vua-vo')
    hoatAnh(o, [{ transform: 'none' }, { transform: 'translateX(-2px) rotate(-6deg)', offset: 0.25 }, { transform: 'translateX(2px) rotate(6deg)', offset: 0.5 }, { transform: 'scale(1.1)', offset: 0.8 }, { transform: 'none' }], 300)
    setTimeout(() => { bungHat(o, { n: 7, r: 40, co: 6, roi: 24, mau: ['chu3'] }); bungHat(o, { n: 4, r: 24, tron: true, co: 7, roi: 18, mau: ['kc'] }) }, 250)
  }
  const batDauLam = async () => {
    if (!token || gui) return
    setGui(true); setLoi('')
    const r = await batDauKimCuong(token, chuyenDe)
    setGui(false)
    if (!r.ok) return setLoi(r.chu)
    setPhien(r.du); setOngCon(r.du.ong); setViTri(0); setSoDung(0); setTra(''); setKq(null); setBuoc('lam'); t0.current = Date.now()
  }
  const q: CauKimCuong | undefined = phien?.cau[viTri]
  const du = !!q && (q.phan === 'I' ? /^[ABCD]$/.test(tra) : q.phan === 'II' ? /^[DS]{4}$/.test(tra) : /\d/.test(tra))
  const kiemTra = async () => {
    if (!token || !phien || !q || !du || gui || kq) return
    setGui(true); setLoi('')
    try {
      const r = await guiLaiKhiKetMang(() => goiHoa2('answer', token, { session: phien.phien, phien: phien.phien, qid: q.qid, answer: tra, assisted: false, msLam: Date.now() - t0.current }, 15))
      const kc = docKimCuongCau(r.kimCuong)
      const dung = r.correct === true
      setKq({ dung, thuong: docThuongCau(r.thuong), xong: kc?.xong, dat: kc?.dat })
      if (dung) { setSoDung((n) => n + 1); phanHoiThuong('combo', 1) }
      if (kc) { if (kc.ongCon < ongCon) { setOngCon(kc.ongCon); requestAnimationFrame(vo) } } else if (!dung) { setOngCon((n) => Math.max(0, n - 1)); requestAnimationFrame(vo) }
    } catch (e) { setLoi(e instanceof Error ? e.message : 'Chưa nộp được câu. Em thử lại nhé.') }
    finally { setGui(false) }
  }
  const tiep = () => {
    if (!kq || !phien) return
    const het = kq.xong || ongCon <= 0 || viTri + 1 >= phien.cau.length
    if (het) { setBuoc(kq.dat ?? (ongCon > 0) ? 'dat' : 'truot'); if (token) void capNhatTongQuan(token); return }
    setViTri((i) => i + 1); setTra(''); setKq(null); t0.current = Date.now()
  }

  if (buoc === 'lam' && phien && q) {
    const n = phien.cau.length
    const chon = (v: string) => { if (!kq) setTra(v) }
    return <ManToan nhan={`Thử thách Kim cương · ${tenChuyenDe}`} onDong={onDong}
      tren={<><OngNghiem phanTram={(100 * (viTri + (kq ? 1 : 0))) / n} kimCuong nhan={`Đã xong ${viTri + (kq ? 1 : 0)}/${n} câu`} /><MangBa con={ongCon} tong={phien.ong} /></>}
      day={kq ? <NutDay chu="Tiếp tục" onClick={tiep} /> : <NutDay chu={gui ? 'Đang kiểm tra…' : 'Kiểm tra'} tat={!du || gui} onClick={() => void kiemTra()} />}>
      <main className="tp-kc-lam">
        <p className="tp-kc-nhan">Thử thách Kim cương · {tenChuyenDe} <span className="tp-chip">Câu {viTri + 1}/{n}</span></p>
        <p className="tp-kc-de"><ChemText text={q.text} /></p>
        {q.phan === 'I' && <div className="tp-pa" data-luoi={q.choices.every((c) => c.length < 12) || undefined} role="group" aria-label="Chọn đáp án">
          {q.choices.map((c, i) => { const k = 'ABCD'[i]!; return <button key={k} type="button" aria-pressed={tra === k} disabled={!!kq} onClick={() => chon(k)}><b>{k}</b><span><ChemText text={c} /></span></button> })}
        </div>}
        {q.phan === 'II' && <div className="tp-ds">{q.ideas.map((y, i) => <div key={i}><span><b>{'abcd'[i]})</b> <ChemText text={y} /></span>
          <span className="tp-hai-nut" role="group" aria-label={`Chọn cho ý ${'abcd'[i]}`}>{(['D', 'S'] as const).map((v) => <button key={v} type="button" className="tp-nut" aria-pressed={tra[i] === v} data-sac={tra[i] === v ? 'chinh' : undefined} disabled={!!kq}
            onClick={() => { const a = tra.padEnd(4, '-').split(''); a[i] = v; chon(a.join('')) }}>{v === 'D' ? 'Đúng' : 'Sai'}</button>)}</span></div>)}</div>}
        {q.phan === 'III' && <label className="tp-ds"><span className="tp-mo">Đáp số</span><input className="tp-o-so" inputMode="decimal" autoComplete="off" value={tra} disabled={!!kq} onChange={(e) => chon(e.target.value.replace(/[^\d,.-]/g, '').slice(0, 8))} /></label>}
        {kq && <div className="tp-kq-kc" data-kq={kq.dung ? 'dung' : 'sai'} role="status">{kq.dung ? 'Chính xác!' : `Chưa đúng · vỡ 1 ống nghiệm${ongCon > 0 ? ` · còn ${ongCon} ống` : ''}`}</div>}
        {kq?.thuong && <TamThuong thuong={kq.thuong} />}
        {loi && <Loi chu={loi} />}
      </main>
    </ManToan>
  }
  if (buoc === 'truot') {
    const lai = Date.now() + 24 * 3600e3
    const lam = viTri + 1
    return <ManToan nhan="Chưa qua thử thách" onDong={onDong}
      day={<>{onOnLai ? <NutDay chu="Ôn lại câu sai" onClick={onOnLai} /> : <NutDay chu="Về Lộ trình" onClick={onDong} />}{onOnLai && <NutDay chu="Về Lộ trình" phu onClick={onDong} />}</>}>
      <main className="tp-man" data-hai="">
        <div className="cot-a">
          <div className="tp-hinh tp-hinh-to"><div className="hh-to"><HuyHieuKimLoai hang="kimcuong" khoa an /></div><div ref={bi} className="bi-o"><Bi cam="sai" size={100} /></div></div>
          <h1>Chưa qua lần này</h1>
          <p className="tp-phu">Vỡ đủ {phien?.ong ?? 3} ống ở câu {lam}/{phien?.cau.length ?? 10} · em đúng {soDung}/{lam} câu.</p>
          <MangBa con={0} tong={phien?.ong ?? 3} id="tp-kc-ba-vo" />
        </div>
        <div className="cot-b">
          <section className="tp-the" aria-label="Làm lại">
            <div className="tp-dau"><h2>Làm lại sau 24 giờ</h2><span className="tp-mo-lai"><Clock aria-hidden="true" />từ {gioVn(lai)} {thuNgayVn(lai)}</span></div>
            <p className="tp-phu" style={{ fontSize: 14 }}>Trượt không mất gì: tinh thể và nguyên tử của các câu đúng vẫn giữ. Ôn lại các câu sai rồi thử lại nhé.</p>
          </section>
        </div>
      </main>
    </ManToan>
  }
  if (buoc === 'dat') {
    const n = phien?.cau.length ?? 10, voSo = (phien?.ong ?? 3) - ongCon
    const nhan = () => { void bayToi(document.getElementById('tp-kc-tt'), oTinhThe(), { n: 6 }); onDong() }
    return <ManToan nhan="Đạt Kim cương" onDong={onDong} day={<NutDay chu="Nhận 40 tinh thể" sac="tt" onClick={nhan} />}>
      <main className="tp-man" data-hai="">
        <div className="cot-a">
          <div className="tp-hinh tp-hinh-to"><Tia className="quay kc" /><div ref={hh} className="hh-to"><HuyHieuKimLoai hang="kimcuong" /></div><div ref={bi} className="bi-o"><Bi cam="mung" size={100} /></div></div>
          <h1 style={{ color: 'var(--tp-kl-kimcuong-2)' }}>Đạt Kim cương!</h1>
          <p className="tp-phu">{tenChuyenDe} · đúng {soDung}/{n} câu, vỡ {voSo}/{phien?.ong ?? 3} ống nghiệm.</p>
        </div>
        <div className="cot-b">
          <section className="tp-the" aria-label="Thưởng">
            <div className="tp-dong"><span className="tp-o" data-sac="tt" id="tp-kc-tt"><IcTinhThe /></span><div className="giua"><b>+40 tinh thể</b><span>thưởng Thử thách Kim cương</span></div></div>
            <div className="tp-dong"><span className="tp-nut-kc" aria-hidden="true"><Check /></span><div className="giua"><b>Nút chặng {tenChuyenDe} đã đổi sang lục giác kim cương</b><span>xem trên Lộ trình</span></div></div>
          </section>
        </div>
      </main>
    </ManToan>
  }
  // MỜI
  return <ManToan nhan="Thử thách Kim cương" onDong={onDong}
    day={<><NutDay chu={gui ? 'Đang mở…' : 'Bắt đầu thử thách'} sac="kc" tat={gui || !token} onClick={() => void batDauLam()} /><NutDay chu="Để sau" phu onClick={onDong} /></>}>
    <main className="tp-man" data-hai="">
      <div className="cot-a">
        <div className="tp-hinh tp-hinh-to"><Tia className="quay kc" /><div ref={hh} className="hh-to"><HuyHieuKimLoai hang="kimcuong" /></div><div className="bi-o"><Bi cam="chao" size={100} /></div></div>
        <h1>Thử thách Kim cương</h1>
        <p className="tp-phu">{tenChuyenDe} · em đã vững chuyên đề này. Thử sức với 10 câu khó nhất nhé?</p>
        {loi && <Loi chu={loi} />}
      </div>
      <div className="cot-b">
        <section className="tp-the" aria-label="Luật thử thách">
          <h2>Luật</h2>
          <div className="tp-dong"><span className="tp-o" data-sac="tin"><Target aria-hidden="true" /></span><div className="giua"><b>10 câu khó của {tenChuyenDe}</b><span>làm liền một lượt</span></div></div>
          <div className="tp-dong"><span className="tp-o" data-sac="xam"><span className="tp-ong-ba"><OngMang /><OngMang /><OngMang /></span></span><div className="giua"><b>3 ống nghiệm</b><span>sai một câu vỡ một ống · vỡ đủ 3 ống là dừng</span></div></div>
          <div className="tp-dong"><span className="tp-o" data-sac="sao"><RefreshCw aria-hidden="true" /></span><div className="giua"><b>Chưa qua thì làm lại sau 24 giờ</b><span>không mất tinh thể, không mất nguyên tử</span></div></div>
        </section>
        <section className="tp-the" aria-label="Thưởng khi đạt">
          <h2>Thưởng khi đạt</h2>
          <div className="tp-dong"><span className="tp-o" data-sac="tt"><IcTinhThe /></span><div className="giua"><b>+40 tinh thể</b></div></div>
          <div className="tp-dong"><span className="tp-nut-kc" aria-hidden="true"><Trophy /></span><div className="giua"><b>Huy hiệu Kim cương · {tenChuyenDe}</b><span>nút chặng trên Lộ trình đổi sang lục giác kim cương</span></div></div>
        </section>
      </div>
    </main>
  </ManToan>
}

/** LỐI VÀO Thử thách Kim cương (27/10 — ô «Thử thách Kim cương» ở Thành tích): danh sách chuyên đề em ĐÃ VỮNG (máy chủ /hs/kim-cuong/ds, cùng luật mở của
 *  lệnh bắt đầu) + lượt đang dở / đang khoá 24 giờ / đã đạt. Bấm «Thử thách» / «Làm tiếp» ⇒ màn mời của chuyên đề đó; đóng ⇒ về danh sách (đọc lại).
 *  Chưa vững chuyên đề nào ⇒ nói thật cách mở. Công tắc Kim cương tắt ⇒ ẩn hẳn. */
export function ManKimCuongDs({ token, onVe }: { token?: string; onVe?: () => void }) {
  const tq = useTongQuan(token).du
  const tat = tq?.bat.kimCuong === false
  const { du, tai, loi, thuLai } = useTai(token, DUONG.kimCuongDs, layDsKimCuong, !tat)
  const [chon, setChon] = useState<MucKimCuong | null>(null)
  if (tat || du?.tat) return null
  if (chon) return <ManKimCuong token={token} chuyenDe={chon.ma} tenChuyenDe={chon.ten} onDong={() => { setChon(null); thuLai() }} />
  if (!du) return <div className="tp-goc tp-vo"><DauVe onVe={onVe} />{tai ? <Cho /> : <Loi chu={loi || 'Chưa xem được Thử thách Kim cương.'} onThuLai={thuLai} />}</div>
  const chuTt = (m: MucKimCuong) => m.tt === 'dang' ? 'Em đang làm dở lượt này'
    : m.tt === 'khoa' ? (m.moLaiLuc ? `Làm lại từ ${gioVn(Date.parse(m.moLaiLuc))} ${thuNgayVn(Date.parse(m.moLaiLuc))}` : 'Làm lại sau 24 giờ')
    : m.tt === 'chua_vung' ? 'Vững lại chuyên đề để thử lần nữa' : m.daDat ? 'Đã đạt · thử lại được' : '10 câu khó · 3 ống nghiệm'
  return <div className="tp-goc tp-vo" data-man="kim-cuong-ds">
    <DauVe onVe={onVe} />
    {loi && <Loi chu={loi} onThuLai={thuLai} />}
    <div><h1 className="tp-tieu">Thử thách Kim cương</h1>
      <p className="tp-phu" style={{ marginTop: 4 }}>Mở khi em vững một chuyên đề trên Lộ trình. Đạt lần đầu: +40 tinh thể và huy hiệu Kim cương.</p></div>
    {du.ds.length === 0 ? <div className="tp-trong"><Bi cam="chao" size={72} /><b>Chưa có chuyên đề nào mở thử thách</b>
      <span>Học đều trên Lộ trình. Khi em vững một chuyên đề, thử thách của chuyên đề đó sẽ hiện ở đây.</span></div>
      : <section className="tp-the" aria-label="Chuyên đề">{du.ds.map((m) => <div key={m.ma} className="tp-dong tp-kc-muc" data-tt={m.tt}>
        <span className="tp-kc-hh" aria-hidden="true"><HuyHieuKimLoai hang="kimcuong" khoa={!m.daDat} an /></span>
        <div className="giua"><b>{m.ten}</b><span>{chuTt(m)}</span></div>
        {(m.tt === 'mo' || m.tt === 'dang') && token ? <button type="button" className="tp-nut" data-sac={m.tt === 'dang' ? 'chinh' : 'kc'} onClick={() => setChon(m)} aria-label={`${m.tt === 'dang' ? 'Làm tiếp' : 'Thử thách'} ${m.ten}`}>{m.tt === 'dang' ? 'Làm tiếp' : 'Thử thách'}</button>
          : m.daDat ? <span className="tp-chip">Đã đạt</span> : <span className="tp-mo-lai"><Clock aria-hidden="true" />Đang khoá</span>}
      </div>)}</section>}
  </div>
}

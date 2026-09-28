// ĐOÀN HỘ TỐNG · GAME HÓA 2.0 — KẾT CHẶNG theo bản vẽ Moi-DoanThang: nền tia vàng, 3 sao, "PHỤC KÍCH ĐÃ BỊ PHÁ!", cầu gỗ hạ sang đảo.
// Thẻ "Cầu sang Bát Linh Đảo đã hạ · N câu đang chờ" CHỈ khi `hoa2-sanh` (đọc lại SAU chặng) báo hết câu ôn hôm nay (`doan.con === 0`);
// còn câu ôn ⇒ cầu vẫn kéo lên, nút chính là phá tiếp. Mọi con số do máy chủ trả; thiếu số nào thì ô ấy không hiện (không bịa, kể cả "mảnh khiên").
import type { CSSProperties } from 'react'
import type { DoanXem } from '../doan-kieu'
import { PETS } from '../core'
import { SaoHinh, ThuHinh } from '../DoanHinh'
import { chuDuTran, coKhoanBiCat, dongKhoanExp, tongKhoanExp } from '../doan-khoan-exp'
import type { Hoa2Xem } from './kieu2'

interface Props {
  xem: DoanXem; expNhan: number
  /** `hoa2-sanh` đọc lại sau chặng: undefined = đang đọc · null = không đọc được · có = số thật. */ cau: Hoa2Xem | null | undefined
  ban: boolean; onRaDao: () => void; onVeBanDo: () => void; onDiTiep: () => void
}

const TIA = [[0, 0], [110, 0], [280, 0], [390, 0], [390, 140], [0, 140]] as const
const GIAY = [
  { x: 60, y: 60, g: 20, m: 'rgb(255,92,138)' }, { x: 320, y: 84, g: -30, m: 'rgb(255,92,138)' }, { x: 96, y: 120, g: -18, m: 'rgb(55,226,213)' },
  { x: 290, y: 40, g: 40, m: 'rgb(55,226,213)' }, { x: 40, y: 170, g: 10, m: 'rgb(255,201,64)' }, { x: 344, y: 160, g: -12, m: 'rgb(255,201,64)' },
] as const

/** Tranh kết chặng: tia vàng + hoa giấy khi thắng, sóng biển, đảo có kho báu, cầu gỗ — HẠ nằm ngang khi hết câu ôn, còn KÉO LÊN khi còn ổ phục kích. */
function TranhThang({ thang, ha }: { thang: boolean; ha: boolean }) {
  return (
    <svg viewBox="0 0 390 360" aria-hidden="true">
      <defs>
        <radialGradient id="dh2-hao" cx="50%" cy="38%" r="65%"><stop offset="0" stopColor="rgb(47,91,217)" /><stop offset=".5" stopColor="rgb(26,44,110)" /><stop offset="1" stopColor="rgb(7,18,41)" /></radialGradient>
        <radialGradient id="dh2-dat" cx="40%" cy="35%"><stop offset="0" stopColor="rgb(70,209,154)" /><stop offset="1" stopColor="rgb(19,96,72)" /></radialGradient>
        <filter id="dh2-mem" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" /></filter>
      </defs>
      <rect width="390" height="360" fill="url(#dh2-hao)" />
      {thang && <g stroke="rgb(255,214,107)" strokeWidth="10" opacity=".1">{TIA.map(([x, y], i) => <path key={i} d={`M195 150 L${x} ${y}`} />)}</g>}
      {thang && GIAY.map((c, i) => <rect key={i} x={c.x} y={c.y} width="8" height="14" rx="2" fill={c.m} opacity=".9" transform={`rotate(${c.g} ${c.x + 4} ${c.y + 7})`} />)}
      <path d="M0 340 q24 -8 48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0 L390 420 L0 420 Z" fill="rgb(13,42,94)" />
      <path d="M250,330 C250,300 280,286 310,288 C346,290 372,306 372,330 L372 360 L250 360 Z" fill="url(#dh2-dat)" stroke="rgb(233,207,148)" strokeWidth="6" />
      <circle cx="316" cy="300" r="22" fill="rgb(255,224,138)" opacity=".4" filter="url(#dh2-mem)" />
      <path d="M306 300 l10 -12 l10 12 z M300 312 h32 v4 h-32 z M304 304 h24 v8 h-24 z" fill="rgb(255,201,64)" />
      <rect x="40" y="322" width="60" height="10" rx="3" fill="rgb(139,90,43)" />
      <g transform={ha ? undefined : 'rotate(-28 96 324)'} data-cau={ha ? 'ha' : 'keo-len'}>
        <rect x="96" y="318" width="160" height="12" rx="3" fill="rgb(201,138,62)" stroke="rgb(74,44,16)" strokeWidth="2" />
        <g stroke="rgb(74,44,16)" strokeWidth="2"><path d="M116 318 v12 M136 318 v12 M156 318 v12 M176 318 v12 M196 318 v12 M216 318 v12 M236 318 v12" /></g>
        <path d="M96 300 L256 300" stroke="rgb(255,214,107)" strokeWidth="2" strokeDasharray="4 6" />
      </g>
      {ha && <circle cx="176" cy="324" r="40" fill="rgb(255,214,107)" opacity=".18" filter="url(#dh2-mem)" />}
    </svg>
  )
}

export default function KetChang2({ xem, expNhan, cau, ban, onRaDao, onVeBanDo, onDiTiep }: Props) {
  const k = xem.ketChang!, em = xem.ghe.find(g => g.laEm)!, banBe = xem.ghe.filter(g => !g.laEm).slice(0, 2), tb = k.tienBo
  const khoan = dongKhoanExp(k.expChang, k.sao, k.trumVoGiap.filter(Boolean).length), tongKhoan = tongKhoanExp(khoan)
  const exp = khoan.length ? tongKhoan : expNhan
  const tenThu = PETS[em.pet]?.name ?? 'thần thú'
  const ha = !!cau && cau.doanCon === 0
  const voGiap = k.trumVoGiap.filter(Boolean).length
  return (
    <div className="dh-khung dh2-thang" data-vung="ket-chang-2">
      {/* Tranh 390×360 theo đúng toạ độ bản vẽ (khung giữ tỉ lệ ⇒ % trong khung = toạ độ bản vẽ); tiêu đề + dòng phụ nằm TRÊN tranh như bản vẽ. */}
      {/* Bố cục NGANG (Ngang-DoanKetChang, doan2-ngang.css): cột trái = tranh thắng; cột phải = cầu · phần thưởng · Linh Tâm lớp · nút chính.
          Hai cột bọc `display:contents` ⇒ màn dọc y nguyên. */}
      <div className="dh2-cot dh2-cot-trai" data-vung="cot-trai">
      <div className="dh2-thang-canh">
        <TranhThang thang={k.thang} ha={ha} />
        {banBe[0] && <ThuHinh pet={banBe[0].pet} cap={banBe[0].cap} className="dh-noi-2" style={{ left: '5.6%', top: '35.6%', width: '20.5%', aspectRatio: '1' } as CSSProperties} />}
        <ThuHinh pet={em.pet} cap={em.cap} className="dh-noi" style={{ left: '28.2%', top: '19.4%', width: '43.6%', aspectRatio: '1' } as CSSProperties} />
        {banBe[1] && <ThuHinh pet={banBe[1].pet} cap={banBe[1].cap} quayTrai className="dh-noi-2" style={{ right: '5.6%', top: '36.7%', width: '19.5%', aspectRatio: '1' } as CSSProperties} />}
        <div className="dh2-sao" role="img" aria-label={`${k.sao} trên 3 sao`}>
          {[1, 2, 3].map(i => <SaoHinh key={i} size={i === 2 ? 44 : 32} sang={k.sao >= i} />)}
        </div>
        <div className="dh2-thang-chu">
          <h1 className="dh2-thang-tieu-de dh2-baloo">{k.thang ? 'PHỤC KÍCH ĐÃ BỊ PHÁ!' : 'Linh Tâm cần nghỉ'}</h1>
          <p className="dh2-thang-phu">
            {k.thang ? `Linh Tâm về đích với Máu ${k.linhTam.hp}/${k.linhTam.toiDa} · cả đội hạ ${k.quaiHaGuc} Tạp Chất${voGiap ? ` · vỡ giáp ${voGiap} trùm` : ''}`
              : 'Thua không mất gì cả: mọi câu em tự làm đúng hôm nay vẫn được ghi nhận.'}
          </p>
        </div>
      </div>
      </div>

      <div className="dh2-cot dh2-cot-phai" data-vung="cot-phai">
      {cau === undefined ? (
        <div className="dh2-kinh dh2-cau-the" role="status" data-vung="cau-dang-doc"><span>Đang kiểm tra số ổ phục kích còn lại hôm nay…</span></div>
      ) : ha ? (
        <section className="dh2-kinh dh2-cau-the dh2-cau-ha" aria-label="Cầu sang Bát Linh Đảo" data-vung="cau-ha">
          <i aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17h18M5 17V9M19 17V9M5 9h14M9 9v8M15 9v8" /></svg></i>
          <span>
            <b className="dh2-baloo">Cầu sang Bát Linh Đảo đã hạ</b>
            <small>Em đã phá hết ổ phục kích hôm nay{cau.daoCon > 0 ? ` · ${cau.daoCon} câu đang chờ khám phá` : ' · đảo hôm nay cũng đã khám phá xong'}</small>
          </span>
        </section>
      ) : cau ? (
        <section className="dh2-kinh dh2-cau-the" aria-label="Cầu sang Bát Linh Đảo" data-vung="cau-keo-len">
          <span>
            <b className="dh2-baloo">Còn {cau.doanCon} ổ phục kích chặn cầu</b>
            <small>Phá hết ổ phục kích hôm nay thì cầu sang Bát Linh Đảo hạ xuống.</small>
          </span>
        </section>
      ) : null}

      <div className="dh2-qua" aria-label="Phần thưởng và tiến bộ">
        <div className="dh2-kinh"><b className="dh2-baloo dh2-vang">+{exp}</b><small>EXP</small></div>
        <div className="dh2-kinh"><b className="dh2-baloo dh2-lam">{tb.tuLamDung}/{tb.soCau}</b><small>câu ôn tự làm đúng</small></div>
        {tb.lenBac !== null
          ? <div className="dh2-kinh"><b className="dh2-baloo dh2-hong">{tb.lenBac}</b><small>câu chuyển sang lịch ôn xa hơn</small></div>
          : <div className="dh2-kinh"><b className="dh2-baloo dh2-hong">{k.soLienKich}</b><small>lần Liên Kích của cả đội</small></div>}
      </div>
      {khoan.length > 0 && (
        <details className="dh2-kinh dh2-khoan">
          <summary>Xem từng khoản EXP của chuyến</summary>
          <div className="dh-khoan" data-vung="khoan-exp">
            <ul aria-label="Từng khoản EXP của chuyến này">{khoan.map(d => <li key={d.ma} data-ma={d.ma}><span>{d.nhan}</span><b>+{d.exp} EXP</b></li>)}</ul>
            <div className="dh-khoan-tong"><span>Tổng cộng</span><b>+{tongKhoan} EXP</b></div>
            {coKhoanBiCat(khoan) && <small data-vung="khoan-du-tran">+{tongKhoan} EXP · {chuDuTran(tenThu)}</small>}
          </div>
        </details>
      )}

      {k.doanLop && (
        <section className="dh2-kinh dh2-lop" aria-label="Linh Tâm của lớp">
          <i aria-hidden="true" />
          <span>
            <b>Linh Tâm của lớp: trạm {k.doanLop.tramTruoc}{k.doanLop.tramSau > k.doanLop.tramTruoc ? <> → <em>{k.doanLop.tramSau}</em></> : null}/{k.doanLop.tongTram}</b>
            <span className="dh-mau"><i style={{ width: `${Math.round(k.doanLop.tramSau * 100 / Math.max(1, k.doanLop.tongTram))}%` }} /></span>
            <small>{k.doanLop.banThu > 0 ? `Em là bạn thứ ${k.doanLop.banThu} góp sức hôm nay` : 'Chuyến thắng mới đẩy Linh Tâm của lớp'}{k.doanLop.conTramToiMoc ? ` · còn ${k.doanLop.conTramToiMoc} trạm tới ${k.doanLop.tenMocKe}` : ''}</small>
          </span>
        </section>
      )}

      {k.cuaEm.soLanGiup > 0 && <p className="dh2-ghi-chu">Em tiếp sức {k.cuaEm.soLanGiup} lần{k.cuaEm.soLanGiupThanhCong > 0 ? ` · ${k.cuaEm.soLanGiupThanhCong} lần bạn làm lại đúng` : ''}.</p>}
      {tb.soCau > tb.tuLamDung && <p className="dh2-ghi-chu">Câu em chưa đúng hôm nay sẽ quay lại thành ổ phục kích theo lịch ôn lại.</p>}

      <div className="dh2-nut-cuoi">
        {ha
          ? <button type="button" className="dh2-nut-chinh dh2-baloo" onClick={onRaDao}>QUA CẦU · KHÁM PHÁ ĐẢO</button>
          : <button type="button" className="dh2-nut-chinh dh2-baloo" disabled={ban} onClick={onDiTiep}>{cau && cau.doanCon > 0 ? `PHÁ TIẾP · CÒN ${cau.doanCon} Ổ PHỤC KÍCH` : 'PHÁ TIẾP Ổ PHỤC KÍCH'}</button>}
        <button type="button" className="dh2-nut-phu" onClick={onVeBanDo}>Về bản đồ</button>
      </div>
      </div>
    </div>
  )
}

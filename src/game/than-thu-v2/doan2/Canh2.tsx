// ĐOÀN HỘ TỐNG · GAME HÓA 2.0 — nửa trên màn TRONG TRẬN theo bản vẽ Moi-DoanTran: cảnh hoàng hôn núi + đường + xe chở Linh Tâm phát sáng
// (vòng Máu quanh cầu), quái phục kích màu hồng, số sát thương đòn vừa rồi; HUD kính "HIỆP k/8" + vạch 8 hiệp có kim cương hiệp trùm + đồng hồ vòng;
// huy hiệu LIÊN KÍCH; đồng đội góc phải (CHỈ trạng thái, không bao giờ đáp án hay chữ "sai" của bạn). Mọi con số do máy chủ trả.
// Tranh vẽ bằng SVG tĩnh trong mã (không ảnh nạp trễ ⇒ không xô lệch); hoạt ảnh duy nhất là thú nổi nhẹ, tắt sạch khi giảm chuyển động.
import NutToanManHinh from '../../../components/NutToanManHinh'
import { useId } from 'react'
import { HE_LIEN_KICH, HIEP_TRUM, HP_QUAI } from '../doan-core'
import { CHU_TRANG_THAI, type DoanXem, type TranXem } from '../doan-kieu'
import { ThuHinh, TrumHinh } from '../DoanHinh'

interface Props {
  xem: DoanXem; tran: TranXem
  /** Giây còn của hiệp (vẽ từ mốc máy chủ) và hiệp đã mở chưa. */ con: number; mo: boolean
  /** Số "ổ phục kích" (câu ôn) còn lại hôm nay theo `hoa2-sanh`; null = chưa biết ⇒ không hiện. */ oPhucKich: number | null
  onRoi: () => void
}

const R_DONG_HO = 21, C_DONG_HO = 2 * Math.PI * R_DONG_HO
const R_MAU = 24, C_MAU = 2 * Math.PI * R_MAU
/** Chỗ đứng của bạn trong cảnh (theo % khung tranh 390×340): em đứng trước, to nhất; bạn đứng sau, nhỏ hơn. */
const CHO_BAN = [{ left: '1.5%', top: '44%', width: '16%' }, { left: '30%', top: '44%', width: '14.5%' }, { left: '17%', top: '37%', width: '13%' }]
/** Quái phục kích: ô đầu to nhất đứng trước; tối đa 3 con trên tranh. */
const CHO_QUAI = [{ x: 300, y: 290, s: 1 }, { x: 354, y: 296, s: .72 }, { x: 330, y: 262, s: .55 }]

function QuaiHong({ x, y, s, mau }: { x: number; y: number; s: number; mau: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="-4" rx="34" ry="5" fill="rgba(0,0,0,.35)" />
      <path d="M-30 -8 C-38 -40 -20 -66 0 -66 C22 -66 38 -40 30 -8 C26 2 -26 2 -30 -8Z" fill={`url(#${mau})`} />
      <path d="M-18 -44 L-4 -38 M18 -44 L4 -38" stroke="rgb(58,10,26)" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="-9" cy="-28" rx="5" ry="6" fill="rgb(255,255,255)" /><ellipse cx="9" cy="-28" rx="5" ry="6" fill="rgb(255,255,255)" />
      <circle cx="-8" cy="-27" r="2.6" fill="rgb(58,10,26)" /><circle cx="8" cy="-27" r="2.6" fill="rgb(58,10,26)" />
    </g>
  )
}

export default function Canh2({ xem, tran, con, mo, oPhucKich, onRoi }: Props) {
  const id = useId(), troi = `${id}-troi`, nui = `${id}-nui`, duong = `${id}-duong`, cau = `${id}-cau`, bun = `${id}-bun`, phat = `${id}-phat`
  const em = xem.ghe.find(g => g.laEm), ban = xem.ghe.filter(g => !g.laEm)
  const phanMau = Math.max(0, Math.min(1, tran.linhTam.hp / Math.max(1, tran.linhTam.toiDa)))
  const phanGio = mo ? Math.max(0, Math.min(1, con / Math.max(1, tran.giay))) : 1
  const soTrum = HIEP_TRUM.indexOf(tran.hiep)
  // Đòn của em ở hiệp VỪA xong (máy chủ gửi `hiepVuaXong`): chỉ hiện khi đó đúng là hiệp liền trước và có sát thương thật.
  const vua = xem.hiepVuaXong, donEm = vua && vua.hiep === tran.hiep - 1 && vua.cuaEm && vua.cuaEm.satThuong > 0 ? vua.cuaEm : null
  const nhanDon = donEm ? (donEm.lienKich ? 'LIÊN KÍCH' : donEm.haGuc > 0 ? 'HẠ GỤC' : 'ĐÒN CỦA EM') : ''
  // Huy hiệu Liên Kích: sẵn sàng (bạn vừa được em tiếp sức) hoặc đòn vừa rồi của em nổ Liên Kích — hai dòng cho gọn một ô.
  const lienKich = xem.tiepSuc?.lienKichSanSang && mo ? 'sẵn sàng' : donEm?.lienKich ? 'vừa nổ' : ''
  const quai = tran.quai.slice(0, CHO_QUAI.length), dau = quai[0], tenQuai = tran.tenQuai[tran.hiep < HIEP_TRUM[0]! ? 0 : 1] ?? 'Tạp Chất'
  return (
    <div className={`dh2-canh ${tran.laTrum ? 'dh2-canh-trum' : ''}`} data-vung="canh-2">
      <div className="dh2-ve" aria-label={tran.laTrum ? `Trùm ${tran.tenTrum[soTrum] ?? ''} chặn đường, Linh Tâm còn Máu ${tran.linhTam.hp}/${tran.linhTam.toiDa}` : `Linh Tâm trên xe còn Máu ${tran.linhTam.hp}/${tran.linhTam.toiDa}, ${tran.quai.length} Tạp Chất phục kích`} role="img">
        <svg viewBox="0 0 390 340" aria-hidden="true">
          <defs>
            <linearGradient id={troi} x1="0" y1="0" x2="0" y2="1">
              {tran.laTrum
                ? <><stop offset="0" stopColor="rgb(27,12,64)" /><stop offset=".55" stopColor="rgb(66,28,122)" /><stop offset="1" stopColor="rgb(170,70,140)" /></>
                : <><stop offset="0" stopColor="rgb(27,21,84)" /><stop offset=".55" stopColor="rgb(59,42,122)" /><stop offset="1" stopColor="rgb(224,112,106)" /></>}
            </linearGradient>
            <linearGradient id={nui} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgb(42,36,102)" /><stop offset="1" stopColor="rgb(26,23,69)" /></linearGradient>
            <linearGradient id={duong} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgb(107,74,52)" /><stop offset="1" stopColor="rgb(58,38,24)" /></linearGradient>
            <radialGradient id={cau} cx="40%" cy="35%"><stop offset="0" stopColor="rgb(255,255,255)" /><stop offset=".35" stopColor="rgb(191,244,255)" /><stop offset="1" stopColor="rgb(47,168,224)" /></radialGradient>
            <radialGradient id={bun} cx="38%" cy="28%"><stop offset="0" stopColor="rgb(255,179,200)" /><stop offset=".55" stopColor="rgb(232,61,109)" /><stop offset="1" stopColor="rgb(106,15,46)" /></radialGradient>
            <filter id={phat} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="8" /></filter>
          </defs>
          <rect width="390" height="340" fill={`url(#${troi})`} />
          <circle cx="300" cy="96" r="30" fill="rgb(255,217,168)" opacity=".55" />
          <g fill="rgb(255,255,255)" opacity=".7"><circle cx="40" cy="70" r="1.4" /><circle cx="96" cy="44" r="1" /><circle cx="170" cy="86" r="1.2" /><circle cx="230" cy="40" r="1" /><circle cx="352" cy="58" r="1.4" /></g>
          <path d="M0 210 L60 150 L110 190 L170 120 L240 196 L300 146 L390 206 L390 340 L0 340 Z" fill={`url(#${nui})`} />
          <path d="M0 250 L80 206 L150 240 L220 200 L300 246 L390 214 L390 340 L0 340 Z" fill="rgb(20,18,56)" />
          <path d="M-10 340 C90 300 180 286 400 270 L400 340 Z" fill={`url(#${duong})`} />
          <path d="M20 330 C120 300 220 290 390 282" stroke="rgb(166,123,82)" strokeWidth="2" strokeDasharray="10 12" fill="none" />
          {/* Xe chở Linh Tâm + cầu sáng + vòng Máu */}
          <path d="M150 262 h64 l10 -20 h-84 z" fill="rgb(201,138,62)" stroke="rgb(74,44,16)" strokeWidth="2.5" />
          <circle cx="164" cy="266" r="9" fill="rgb(42,26,14)" stroke="rgb(201,138,62)" strokeWidth="2" /><circle cx="204" cy="266" r="9" fill="rgb(42,26,14)" stroke="rgb(201,138,62)" strokeWidth="2" />
          <circle cx="182" cy="218" r="30" fill="rgb(111,227,255)" opacity=".5" filter={`url(#${phat})`} />
          <circle cx="182" cy="218" r="17" fill={`url(#${cau})`} />
          <circle cx="182" cy="218" r={R_MAU} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="4" />
          <circle className="dh2-vong-mau" cx="182" cy="218" r={R_MAU} fill="none" stroke="rgb(91,240,165)" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${(C_MAU * phanMau).toFixed(1)} ${C_MAU.toFixed(1)}`} transform="rotate(-90 182 218)" />
          {/* Quái phục kích (hiệp thường) — thanh Máu trên con đứng đầu */}
          {!tran.laTrum && [...quai].reverse().map((q, i) => { const c = CHO_QUAI[quai.length - 1 - i]!; return <QuaiHong key={q.ma} {...c} mau={bun} /> })}
          {!tran.laTrum && dau && <g><rect x="271" y="212" width="58" height="6" rx="3" fill="rgba(0,0,0,.4)" /><rect x="271" y="212" width={Math.round(58 * Math.max(0, Math.min(1, dau.hp / 24)))} height="6" rx="3" fill="rgb(255,92,138)" /></g>}
          {donEm && <path d="M250 250 l16 -8 l-6 10 l14 -2 l-16 10 l6 -8 z" fill="rgb(255,224,138)" />}
        </svg>
        {tran.laTrum && <div className="dh2-trum"><TrumHinh loai={tran.loaiTrum[soTrum] ?? ''} size={150} className="dh-noi" /></div>}
        {em && <ThuHinh pet={em.pet} cap={em.cap} className="dh-noi" style={{ left: '9%', top: '52%', width: '33%', aspectRatio: '1' }} />}
        {ban.slice(0, CHO_BAN.length).map((g, i) => <ThuHinh key={g.ghe} pet={g.pet} cap={g.cap} className="dh-noi-2" style={{ ...CHO_BAN[i], aspectRatio: '1', animationDelay: `${i * .4}s` }} />)}
        {donEm && (
          <div className="dh2-sat-thuong" aria-label={`Đòn của em hiệp ${vua!.hiep}: ${donEm.satThuong} sát thương`}>
            <b>-{donEm.satThuong}</b><span>{nhanDon}</span>
          </div>
        )}
        {/* Màn NGANG (doan2-ngang.css): nhãn Máu từng quái xếp thành cột ở khoảng trời trống phía trên bầy quái — không hình nào che; màn dọc ẩn (giữ y bản vẽ dọc). */}
        {!tran.laTrum && quai.length > 0 && (
          <ul className="dh2-nhan-quai" aria-label="Máu từng Tạp Chất" data-vung="mau-quai">
            {quai.map(q => <li key={q.ma} className="dh2-kinh">{tenQuai} · Máu {Math.max(0, q.hp)}/{HP_QUAI}</li>)}
          </ul>
        )}
        <span className="dh2-kinh dh2-nhan-canh dh2-nhan-mau">Máu Linh Tâm {tran.linhTam.hp}/{tran.linhTam.toiDa}</span>
        {tran.laTrum
          ? <span className="dh2-kinh dh2-nhan-canh dh2-nhan-o">Trùm · giáp 4 đoạn</span>
          : oPhucKich !== null && <span className="dh2-kinh dh2-nhan-canh dh2-nhan-o" data-vung="o-phuc-kich">Ổ phục kích còn {oPhucKich}</span>}
      </div>

      <header className="dh2-hud">
        <div className="dh2-kinh dh2-hud-hiep">
          <span className="dh2-hud-dong"><b className="dh2-baloo">HIỆP {tran.hiep}/{tran.soHiep}</b>{tran.laTrum ? <span className="dh2-dang-trum">◆ đang ở hiệp trùm</span> : <span>◆ = hiệp trùm</span>}</span>
          <span className="dh2-vach" role="img" aria-label={`Đang ở hiệp ${tran.hiep} trên ${tran.soHiep}; hiệp ${HIEP_TRUM.join(' và ')} là hiệp trùm`}>
            {Array.from({ length: tran.soHiep }, (_, i) => i + 1).map(h => (
              <i key={h} className={`${HIEP_TRUM.includes(h) ? 'dh2-kc' : ''} ${tran.ketThuc || h < tran.hiep ? 'dh2-xong' : h === tran.hiep ? 'dh2-dang' : ''}`} />
            ))}
          </span>
        </div>
        {!tran.ketThuc && <button type="button" className="dh2-kinh dh2-roi" onClick={onRoi} title="Máy sẽ đỡ thay, đội không bị phạt">Rời chuyến</button>}
        <span className={`dh2-kinh dh2-dong-ho ${mo && con <= 10 ? 'dh2-gap' : ''}`} role="timer" aria-label={mo ? `Còn ${con} giây` : 'Chưa tính giờ'}>
          <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r={R_DONG_HO} stroke="rgba(255,255,255,.15)" strokeWidth="5" fill="none" />
            <circle cx="26" cy="26" r={R_DONG_HO} strokeWidth="5" fill="none" strokeLinecap="round" transform="rotate(-90 26 26)"
              strokeDasharray={`${(C_DONG_HO * phanGio).toFixed(1)} ${C_DONG_HO.toFixed(1)}`} />
          </svg>
          <b className="dh2-baloo">{mo ? con : '·'}</b>
        </span>
        <NutToanManHinh />
      </header>

      <div className="dh2-hang">
        {lienKich && <span className="dh2-lien-kich"><b className="dh2-baloo">LIÊN KÍCH ×{HE_LIEN_KICH}</b><small>{lienKich}</small></span>}
        {/* KHÔNG BAO GIỜ có chữ "sai" hay đáp án của bạn ở đây — chỉ trạng thái. */}
        <div className="dh2-ban" aria-label="Đồng đội">
          {ban.map(g => (
            <span key={g.ghe} className="dh2-kinh dh2-chip" data-tt={g.trangThai}>
              <ThuHinh pet={g.pet} cap={g.cap} size={24} />
              <span><b>{g.ten}</b><small>{CHU_TRANG_THAI[g.trangThai]}</small></span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

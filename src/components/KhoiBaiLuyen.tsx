// KHỐI BÀI LUYỆN TRONG BÁO CÁO PHỤ HUYNH — dùng chung cho cả hai bố cục.
//
// Tách khỏi `PhieuScreen` ngày 07/09 khi dựng bố cục v3: thầy chốt "giữ nguyên
// mục rút bài trong phiếu mới đầy đủ như trong phiếu cũ". Chép sang bản mới là
// hai bản sao của cùng một khối, và sớm muộn lệch nhau — nên chỉ có MỘT bản,
// hai bố cục cùng gọi.
//
// Class CSS của khối này nằm trong `src/lib/css-bao-cao.ts`; bố cục nào dùng
// khối này thì phải nhúng CSS đó.
import { useState } from 'react'
import KhungXemPhieu from './KhungXemPhieu'
import { napDong } from '../lib/nap-manh'
import { chanSoCau, docLinkPhieu, SO_CAU_MIN } from '../lib/phieu-link'
import { loadScriptUrlHoacMacDinh } from '../lib/exam-db'
import type { PhieuDayDu } from '../lib/phieu-du-lieu'
import type { CauLuyen } from '../lib/bai-tap-pdf'
import { dangCua, hopDang, LOC_DANG_MAC_DINH, MOI_LOC_DANG, TEN_LOC_DANG, type LocDang } from '../lib/dang-cau'
import { hopSao, LOC_SAO_MAC_DINH, MOI_LOC_SAO, TEN_LOC_SAO_NGAN, type LocSao } from '../lib/loc-sao'
import { cauCanhBaoHetHang, cauGiaiThichThanh, cauKhongRutDuoc, soLieuThanhChua } from '../lib/noi-dung-thanh-chua'

export default /** HAI VIỆC KHÁC NHAU, HAI NÚT (thầy chốt 04-09).
 *
 * Bản trước gộp làm một nút "Xem phiếu bài tập": phụ huynh bấm là phiếu mở ra
 * trong máy MÌNH, xong không biết đưa cho con bằng cách nào — chụp màn hình,
 * hoặc chuyển tiếp cả báo cáo có điểm và nhận xét của thầy sang cho con.
 *
 *   · XEM — phụ huynh tự xem trước xem thầy giao gì.
 *   · COPY LINK GỬI CHO CON — link CHỈ có phiếu bài tập, không kèm điểm, không
 *     kèm nhận xét. Nút này nhấp nháy vì đây mới là việc phụ huynh cần làm.
 *
 * Link do máy thầy cất sẵn lúc dựng báo cáo (`linkBaiTap`); trang này không có
 * mã bí mật nên không tự ghi lên máy chủ được. Chưa có link thì chỉ hiện nút
 * Xem — không dựng một nút copy ra rồi copy chuỗi rỗng. */
function NutTaiBaiTap({ du, laCuaEm = false, xinLink }: { du: PhieuDayDu; laCuaEm?: boolean; xinLink?: () => Promise<string> }) {
  const [dang, setDang] = useState(false)
  /** Link vừa XIN ĐƯỢC tại chỗ, khi báo cáo chưa chở sẵn link nào.
   *
   * Báo cáo em xem NGAY SAU KHI NỘP do chính máy em dựng, link bài tập phải đi
   * xin máy chủ nên về SAU khi màn hình đã hiện. Bản trước dựng phiếu bằng
   * `du.linkBaiTap` đọc ngay lúc bấm: em bấm nhanh hơn mạng là phiếu dựng ra
   * KHÔNG có mã ⇒ không thanh nộp, không bấm chọn được đáp án, lời giải mở
   * toang (thầy bắt được 08/09). Nay bấm là CHỜ xin xong mới dựng. */
  const [linkTuXin, setLinkTuXin] = useState('')
  const linkBai = du.linkBaiTap || linkTuXin
  const [loi, setLoi] = useState('')
  const [daCopy, setDaCopy] = useState(false)
  /** Máy chặn copy tự động thì hiện link ra cho phụ huynh bôi đen copy tay. */
  const [linkTay, setLinkTay] = useState('')
  // Phiếu hiện NGAY TRONG trang, không mở thẻ mới: phụ huynh mở link từ Zalo
  // thì đang ở trình duyệt trong ứng dụng Zalo, ở đó `window.open` bị chặn.
  const [html, setHtml] = useState('')
  /** Vì sao phiếu vừa dựng KHÔNG nộp được. Rỗng = nộp được. */
  const [khongNop, setKhongNop] = useState('')

  // SỐ CÂU DO PHỤ HUYNH CHỌN. Báo cáo chở sẵn tới 40 câu đã rút theo đúng
  // chuyên đề em mất điểm, xếp dễ lên khó; kéo thanh là lấy bấy nhiêu câu ĐẦU,
  // nên chọn 10 vẫn ra 10 câu dễ nhất chứ không phải 10 câu bốc ngẫu nhiên.
  // BA LỰA CHỌN DẠNG CÂU ngay trong báo cáo (thầy chốt 06/09). Lọc trên đúng
  // bộ câu đã chở sẵn trong báo cáo — trang này không có kho đề và không có mã
  // bí mật để rút thêm.
  //
  // BÁO CÁO CŨ CŨNG CHẠY, không phải ghi đè gì trên máy chủ. Thầy hỏi đúng câu
  // đó 06/09: "đẩy luôn lên cả báo cáo cũ các ca thi trước".
  //
  // Cách rẻ nhất và không rủi ro nhất là PHÂN LOẠI NGAY LÚC MỞ, không phải chép
  // thêm một trường vào hàng trăm bản ghi cũ: mỗi câu trong báo cáo vốn đã chở
  // `phan · text · luaChon · dapAn · mucDo` — đúng và đủ thứ `dangCua` cần.
  // Nhãn cất sẵn (báo cáo mới) vẫn được ưu tiên, nên hai đường cho cùng kết
  // quả và về sau kho có nhãn thật thì báo cáo mới tự dùng nhãn thật.
  //
  // Ghi đè báo cáo cũ còn là chuyện KHÔNG NÊN LÀM: mỗi bản ghi mang nhận xét
  // thầy tự gõ cho từng em; chạy lại hàng loạt là đặt cược chỗ đó, đổi lấy một
  // hàng nút.
  const [locDang, setLocDang] = useState<LocDang>(LOC_DANG_MAC_DINH)
  // MỨC SAO — thầy chốt 07/09. Chồng lên lọc dạng, không thay nó.
  const [locSao, setLocSao] = useState<LocSao>(LOC_SAO_MAC_DINH)
  const dangCuaCau = (c: CauLuyen) =>
    c.dang ?? dangCua({ phan: c.phan, text: c.text, luaChon: c.luaChon ?? [], dapAn: c.phan === 'III' ? c.dapAn : '', mucDo: c.mucDo })
  const dsDaLoc = (du.baiTap ?? []).filter((c) => hopDang(dangCuaCau(c), locDang) && hopSao(c.sao, locSao))
  const coSan = dsDaLoc.length
  // SÀN – TRẦN – KIM lấy từ ĐÚNG một nguồn với màn thầy (`noi-dung-thanh-chua`),
  // thầy chốt 07/09: "đồng bộ phần rút câu ở đây sang hai chỗ báo cáo phụ huynh
  // và học sinh". Trước đây màn này tự đặt sàn 10 cứng và tự viết câu chữ, nên
  // cùng một em ra hai con số khác nhau ở hai màn.
  const soCauSai = du.cauSai?.length ?? 0
  const [soCau, setSoCau] = useState(SO_CAU_MIN)
  const { san, tran, n: lay, hienThanh } = soLieuThanhChua({ soCau, soCauSai, coSan })
  const xung: 'em' | 'con' = laCuaEm ? 'em' : 'con'
  // Cảnh báo và dòng giải thích: dựng bằng cùng hàm với màn thầy.
  const cauGiaiThich = cauGiaiThichThanh({
    tongUngVien: du.tongUngVien ?? coSan,
    soCauSai,
    san,
    coSan,
    xung,
  })
  const canhBaoHetHang = cauCanhBaoHetHang(du.poolChua, xung)

  // Link đã cất sẵn là `.../p#<mã>`; gắn thêm `~<số câu>` và chữ cuối là xong,
  // không phải ghi lại phiếu nào lên máy chủ (trang này không có mã bí mật để
  // ghi). HAI LINK (thầy chốt 04-09 khuya): `d` = chỉ có ĐỀ cho con tự làm,
  // `g` = có LỜI GIẢI để con dò sau khi làm xong.
  const linkDe = linkBai ? `${linkBai}~${chanSoCau(lay, san)}d` : ''
  const linkGiai = linkBai ? `${linkBai}~${chanSoCau(lay, san)}g` : ''
  const [daCopyGiai, setDaCopyGiai] = useState(false)

  const copyLink = async (link: string, giai: boolean) => {
    if (!link) return
    const bao = giai ? setDaCopyGiai : setDaCopy
    try {
      if (!navigator.clipboard?.writeText) throw new Error('không có clipboard')
      await navigator.clipboard.writeText(link)
      bao(true)
      setTimeout(() => bao(false), 3000)
    } catch {
      setLinkTay(link)
    }
  }

  const tai = async () => {
    setDang(true)
    setLoi('')
    try {
      const { dungPhieu } = await napDong(() => import('../lib/html-phieu'))
      // NỘP ĐƯỢC NGAY TRONG BÁO CÁO (thầy chốt 08/09: "câu khắc phục trong xem
      // báo cáo của học sinh sau thi ca test33 vừa rồi vẫn không có nộp được").
      //
      // Bản trước chỉ nối được thanh nộp vào phiếu mở bằng LINK RIÊNG; phiếu
      // dựng ngay tại đây thì không, nên đúng chỗ em hay bấm nhất lại là chỗ
      // không nộp được.
      //
      // Mã phiếu nằm sẵn trong `linkBaiTap` (`…/p#<mã>`); thiếu mã, thiếu số
      // báo danh hoặc thiếu địa chỉ máy chủ thì phiếu vẫn dựng nhưng KHÔNG có
      // thanh nộp — không dựng nút bấm vào là hỏng.
      //
      // CHƯA CÓ LINK THÌ ĐI XIN, RỒI MỚI DỰNG. Đây là chỗ hỏng thầy bắt được
      // 08/09: báo cáo ngay sau khi nộp phải xin mã ở máy chủ, em bấm nhanh
      // hơn mạng là dựng ra phiếu không mã — không thanh nộp, không bấm chọn
      // được đáp án, lời giải mở toang.
      let link = linkBai
      if (!link && xinLink) link = (await xinLink().catch(() => '')) || ''
      if (link && link !== linkTuXin && link !== du.linkBaiTap) setLinkTuXin(link)
      const maPhieu = link ? docLinkPhieu(link.slice(link.indexOf('#') + 1)).ma : ''
      const urlNop = (await loadScriptUrlHoacMacDinh().catch(() => '')).trim()
      const nop = maPhieu && du.sbd && urlNop ? { ma: maPhieu, sbd: du.sbd, url: urlNop } : null
      // NÓI RA KHI KHÔNG NỘP ĐƯỢC. Trước đây thiếu mã thì phiếu vẫn mở ra bình
      // thường, chỉ là không có thanh nộp — thầy bấm mãi không thấy nút mà
      // không có một dòng nào giải thích (thầy bắt được 08/09).
      setKhongNop(nop ? '' : !maPhieu ? 'thieu_ma' : !du.sbd ? 'thieu_sbd' : 'thieu_link')
      const sai = du.chuyenDeCa.filter((c) => c.soSai > 0)
      const tt = {
        hoTen: du.hoTen,
        sbd: du.sbd,
        ngay: new Date(),
        tenChuyenDe: sai[0]?.ten || du.chuyenDeCa[0]?.ten || 'Hoá học',
        ketQua: sai.length > 0 ? `Sai ${sai.reduce((n, c) => n + c.soSai, 0)}/${sai.reduce((n, c) => n + c.soCau, 0)} câu` : '',
        hienDapAn: false,
        nhanBia: laCuaEm ? 'Câu khắc phục lỗi sai' : 'Phiếu Bài Tập Riêng',
      }
      // MỘT lần dựng. Bản trước dựng hai lần (đề, lời giải) rồi nối chuỗi nên
      // phụ huynh tải về thấy bìa và trang tổng quan LẶP HAI LẦN.
      setHtml(dungPhieu(tt, dsDaLoc.slice(0, lay), { nop }))
    } catch {
      setLoi('Máy chưa mở được phiếu. Phụ huynh thử lại khi có mạng ổn định.')
    } finally {
      setDang(false)
    }
  }
  return (
    <div style={{ marginTop: 14 }}>
      <div className="bc-tieu">{laCuaEm ? 'Bộ câu khắc phục lỗi sai' : 'Bài luyện theo đúng chỗ em mất điểm'}</div>
      {laCuaEm && (
        <div className="bc-viec-chu" style={{ marginTop: 6 }}>
          Em hãy tạo câu khắc phục lỗi sai để luyện tập. Máy rút đúng chuyên đề em vừa mất điểm, xếp từ dễ lên khó.
        </div>
      )}

      {(du.baiTap?.length ?? 0) > 0 && (
        <>
          <div className="bc-dang" role="radiogroup" aria-label="Dạng câu">
            {MOI_LOC_DANG.map((d) => (
              <button key={d} type="button" role="radio" aria-checked={locDang === d} onClick={() => setLocDang(d)}>
                {TEN_LOC_DANG[d]}
              </button>
            ))}
          </div>
          {/* MỨC SAO — nhãn ngắn vì màn phụ huynh chạy trên điện thoại 360px. */}
          <div className="bc-dang" role="radiogroup" aria-label="Mức sao">
            {MOI_LOC_SAO.map((v) => (
              <button key={v} type="button" role="radio" aria-checked={locSao === v} onClick={() => setLocSao(v)}>
                {TEN_LOC_SAO_NGAN[v]}
              </button>
            ))}
          </div>
        </>
      )}

      {/* THANH KÉO — cùng luật, cùng câu chữ với màn thầy. Chỉ khác lớp CSS vì
          trang phiếu có bảng màu `--p-*` riêng, không dùng token của app. */}
      {hienThanh && (
        <div className="bc-so">
          <div className="bc-so-dau">
            <span className="bc-so-nhan">{laCuaEm ? 'Em làm bao nhiêu câu?' : 'Cho con làm bao nhiêu câu?'}</span>
            <span className="bc-so-gia">{lay} câu</span>
          </div>
          {/* Nút nhảy nhanh, đúng như màn thầy. */}
          <div className="bc-so-nhay">
            {[10, 20, 50].filter((m) => m > san && m < tran).map((m) => (
              <button key={m} type="button" aria-pressed={lay === m} onClick={() => setSoCau(m)}>
                {m}
              </button>
            ))}
            <button type="button" aria-pressed={lay === tran} onClick={() => setSoCau(tran)}>
              Tối đa
            </button>
          </div>
          <input
            type="range"
            min={san}
            max={tran}
            step={1}
            value={lay}
            onChange={(e) => setSoCau(chanSoCau(e.target.value, san))}
            aria-label={laCuaEm ? 'Số câu em làm' : 'Số câu cho con làm'}
          />
          <div className="bc-so-moc">
            <span>{san}</span>
            <span>{tran}</span>
          </div>
          <div className="bc-so-vi">{cauGiaiThich}</div>
          {canhBaoHetHang !== '' && <div className="bc-so-vi bc-so-canh">{canhBaoHetHang}</div>}
        </div>
      )}

      {/* KHÔNG RÚT ĐƯỢC CÂU NÀO — nói đúng lý do, y như màn thầy, thay vì im. */}
      {coSan === 0 && (du.thieuChuaChiTiet?.length ?? 0) > 0 && (
        <div className="bc-so bc-so-do">
          <b>Chưa rút được câu chữa nào</b>
          <ul>
            {cauKhongRutDuoc(du.thieuChuaChiTiet).map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bc-nut-doi">
        {coSan > 0 && (
          <button type="button" className="bc-nut vien" onClick={() => void tai()} disabled={dang}>
            {dang ? 'Đang dựng…' : laCuaEm ? `Tạo ${lay} câu khắc phục` : `Xem trước ${lay} câu`}
          </button>
        )}
      </div>
      {linkBai && (
        <div className="bc-nut-doi" style={{ marginTop: 8 }}>
          <button type="button" className={`bc-nut vang${daCopy ? '' : ' bc-nhay'}`} onClick={() => void copyLink(linkDe, false)}>
            {daCopy ? `Đã copy link đề ${lay} câu` : 'Copy link gửi ĐỀ cho con'}
          </button>
          <button type="button" className="bc-nut vang" onClick={() => void copyLink(linkGiai, true)}>
            {daCopyGiai ? `Đã copy link lời giải ${lay} câu` : 'Copy link gửi LỜI GIẢI cho con'}
          </button>
        </div>
      )}
      <div style={{ fontSize: 12, color: 'var(--p-nhat)', marginTop: 8, lineHeight: 1.6 }}>
        {/* Nói đúng cách rút hiện tại. Câu cũ ghi "theo đúng chuyên đề em mất
            điểm" là mô tả cách làm ĐÃ BỎ — nay rút theo MÃ DẠNG của chính câu
            em sai, tìm trong CẢ KHO chứ không bó trong chuyên đề của ca. */}
        Rút từ cả kho, theo đúng dạng của từng câu em làm sai, xếp từ dễ lên khó.
        {/* NÓI RÕ SỐ CÂU KHO CÒN, thay vì để thanh kéo dừng ở một con số lạ mà
            không ai biết vì sao (thầy hỏi đúng câu này ngày 06/09). */}
        {du.tongUngVien && du.tongUngVien > coSan ? ` Kho còn ${du.tongUngVien} câu cùng dạng với những câu em sai.` : ''}
        {linkBai
          ? ' Gửi con link ĐỀ trước để em tự làm vào vở; em làm xong mới gửi link LỜI GIẢI để em dò. Hai link chỉ có bài tập, không kèm điểm và nhận xét.'
          : ' Em làm hết rồi mới bấm vào từng câu xem lời giải.'}
      </div>
      {linkTay && (
        <div style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.6 }}>
          <div style={{ color: 'var(--p-nhat)' }}>Máy không cho copy tự động. Phụ huynh bôi đen dòng dưới rồi copy:</div>
          <div style={{ marginTop: 4, padding: '8px 10px', borderRadius: 10, background: 'var(--p-chim)', wordBreak: 'break-all', fontVariantNumeric: 'tabular-nums' }}>{linkTay}</div>
        </div>
      )}
      {loi && <div style={{ fontSize: 12.5, color: 'var(--p-do)', marginTop: 6 }}>{loi}</div>}
      {khongNop !== '' && html !== '' && (
        <div style={{ fontSize: 12.5, color: 'var(--p-cam)', marginTop: 6, lineHeight: 1.6 }}>
          {khongNop === 'thieu_ma'
            ? 'Phiếu này chưa có mã bài tập nên chưa nộp được — Thầy vào Lịch sử ca, bấm "Đồng bộ lại phiếu mọi ca", rồi mở lại link này.'
            : khongNop === 'thieu_sbd'
              ? 'Phiếu này thiếu số báo danh nên chưa nộp được. Báo Thầy để dựng lại phiếu.'
              : 'Máy chưa có địa chỉ máy chủ nên chưa nộp được. Mở lại link khi có mạng.'}
        </div>
      )}
      {html && <KhungXemPhieu html={html} ten="Phiếu bài tập" dong={() => setHtml('')} />}
    </div>
  )
}

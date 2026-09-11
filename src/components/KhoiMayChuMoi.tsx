// CÀI ĐẶT → MÁY CHỦ.
//
// 12/09: Google đã bị cắt hẳn, nên khối này chỉ còn ba việc còn sống —
// ĐỊA CHỈ · LẬP LẠI MỤC LỤC KHO · ĐẾM DỮ LIỆU. Những nút của thời hai máy chủ
// (bật/tắt cờ, chuyển ca cũ, chuyển kho đề) đã làm xong việc của chúng và bị gỡ:
// một nút không còn tác dụng nhưng vẫn nằm đó là thứ thầy sẽ bấm nhầm giữa giờ
// dạy.
import { useEffect, useState } from 'react'
import { NutChinh, OThongBao } from './DesignSystem'
import { loadCauHinhMayChu, loadTeacherSecret, saveCauHinhMayChu } from '../lib/exam-db'
import { MAC_DINH_MAY_CHU, type CauHinhMayChu } from '../lib/cau-hinh-may-chu'
import { quenCauHinhMayChu, thuKetNoi } from '../lib/may-chu-moi'
import { CHUA_DUNG, daChuyenXong, dungBangDoiChieu, laySoMayChuMoi, type DongDoiChieu } from '../lib/doi-chieu-hai-ben'
import { dungLaiChiMucKho } from '../lib/chuyen-kho-de'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', lineHeight: 1.6 }
const O_NHAP: React.CSSProperties = {
  height: 46,
  width: '100%',
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k4)',
  background: 'var(--the-2)',
  border: '1.5px solid transparent',
  fontFamily: 'var(--serif)',
  fontSize: 'var(--cx-2)',
  color: 'var(--muc)',
  outline: 'none',
}

export default function KhoiMayChuMoi({ showToast }: { showToast: (chu: string, kieu?: 'success' | 'error' | 'warn') => void }) {
  const [ch, setCh] = useState<CauHinhMayChu>(MAC_DINH_MAY_CHU)
  const [dangThu, setDangThu] = useState(false)
  const [ketQua, setKetQua] = useState<{ ok: boolean; chu: string } | null>(null)
  const [dangDo, setDangDo] = useState(false)
  const [bang, setBang] = useState<DongDoiChieu[] | null>(null)
  const [loiDo, setLoiDo] = useState('')

  useEffect(() => {
    // NUỐT LỖI Ở ĐÂY LÀ CỐ Ý. Khối cài đặt này nằm trong màn Ngân hàng đề —
    // IndexedDB hỏng hoặc bị chặn mà để lỗi ném ra thì React gỡ nguyên cả màn,
    // thầy mất luôn chỗ nạp đề vì một ô cấu hình phụ. Đọc không được thì dùng
    // mặc định (cờ TẮT), đúng thứ an toàn nhất.
    Promise.resolve()
      .then(loadCauHinhMayChu)
      .then(setCh)
      .catch(() => setCh(MAC_DINH_MAY_CHU))
  }, [])

  async function luu(moi: CauHinhMayChu) {
    setCh(moi)
    await saveCauHinhMayChu(moi).catch(() => showToast('Không ghi được cấu hình vào máy', 'error'))
    // Bộ nhớ tạm sống 5 giây; xoá ngay để thầy gạt cờ là có tác dụng tức thì.
    quenCauHinhMayChu()
  }

  async function thu() {
    setDangThu(true)
    setKetQua(null)
    const r = await thuKetNoi(ch.URL)
    setKetQua(r)
    setDangThu(false)
  }

  // DỰNG LẠI CHỈ MỤC CÂU. Tách khỏi nút chuyển kho vì hai việc khác nhau: một
  // bên chuyển GÓI ĐỀ sang, một bên lập MỤC LỤC cho gói đã sang. Kho có đủ 118
  // tờ mà mục lục rỗng thì rút câu khắc phục, câu hỏi lại và đề riêng đều trả
  // về gần như rỗng — đúng thứ thầy thấy tối 11/09 ("đặt 8/2/2 mà ra 3/1/1").
  const [dangChiMuc, setDangChiMuc] = useState(false)
  const [tienChiMuc, setTienChiMuc] = useState('')
  const [ketChiMuc, setKetChiMuc] = useState<{ ok: boolean; chu: string } | null>(null)

  async function lapChiMuc() {
    setDangChiMuc(true)
    setKetChiMuc(null)
    setTienChiMuc('Đang đọc kho…')
    try {
      const kq = await dungLaiChiMucKho(setTienChiMuc)
      const con = kq.hong.length
      setKetChiMuc({
        ok: con === 0,
        chu:
          `Đã lập chỉ mục ${kq.soDe} tờ đề · tổng ${kq.tongCau} câu tra được` +
          (con > 0 ? ` · HỎNG ${con}: ${kq.hong.slice(0, 5).map((h) => h.maDe).join(', ')}${con > 5 ? '…' : ''}` : '.'),
      })
    } catch (e) {
      setKetChiMuc({ ok: false, chu: e instanceof Error ? e.message : 'Không lập được chỉ mục' })
    } finally {
      setDangChiMuc(false)
      setTienChiMuc('')
    }
  }



  /** ĐẾM DỮ LIỆU TRÊN MÁY CHỦ.
   *
   * Chỉ ĐỌC, không ghi một dòng nào. Gọi bao nhiêu lần cũng được. */
  async function doHaiBen() {
    setDangDo(true)
    setBang(null)
    setLoiDo('')
    try {
      const mat = (await loadTeacherSecret()) ?? ''
      if (!mat) throw new Error('Thiếu mã bí mật')
      const moi = await laySoMayChuMoi(ch, mat)
      if (!moi) throw new Error('Máy chủ không trả lời — kiểm địa chỉ rồi bấm Thử kết nối')
      setBang(dungBangDoiChieu(moi))
    } catch (e) {
      setLoiDo(e instanceof Error ? e.message : 'Không đo được')
    } finally {
      setDangDo(false)
    }
  }





  return (
    <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
      <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}>
        Máy chủ mới (Cloudflare)
      </div>

      <div>
        <div style={{ ...NHAN_NHO, marginBottom: 'var(--k1)' }}>Địa chỉ Worker</div>
        <input
          style={O_NHAP}
          value={ch.URL}
          onChange={(e) => setCh({ ...ch, URL: e.target.value })}
          onBlur={() => luu(ch)}
          placeholder="https://omr.ttadodaihoc.workers.dev"
          autoComplete="off"
        />
      </div>

      <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
        <NutChinh variant="phu" onClick={thu} disabled={dangThu || !ch.URL.trim()}>
          {dangThu ? 'Đang thử…' : 'Thử kết nối'}
        </NutChinh>
        <span style={NHAN_NHO}>{ch.URL.trim() ? 'Có địa chỉ là app chạy — không còn cờ bật/tắt.' : 'Chưa có địa chỉ thì app không gọi được lệnh nào.'}</span>
      </div>

      {ketQua && <OThongBao tone={ketQua.ok ? 'xanh' : 'do'}>{ketQua.chu}</OThongBao>}

      <div style={{ height: 1, background: 'var(--vien)', margin: 'var(--k2) 0' }} />

      <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
        <NutChinh variant="phu" onClick={() => void lapChiMuc()} disabled={dangChiMuc || !ch.URL.trim()}>
          {dangChiMuc ? 'Đang lập chỉ mục…' : 'Lập lại chỉ mục câu của kho'}
        </NutChinh>
        {dangChiMuc && <span style={NHAN_NHO}>{tienChiMuc}</span>}
      </div>

      {ketChiMuc && <OThongBao tone={ketChiMuc.ok ? 'xanh' : 'do'}>{ketChiMuc.chu}</OThongBao>}

      <div style={NHAN_NHO}>
        Chỉ mục câu là MỤC LỤC của kho: rút câu khắc phục, câu hỏi lại và đề riêng đều
        {' '}tra ở đó. Bấm lại sau mỗi lần nạp đề mới. Nút này KHÔNG đẩy lại đề — nó đọc
        {' '}gói đã nằm trên máy chủ, và chạy lại bao nhiêu lần cũng an toàn.
      </div>

      <div style={{ height: 1, background: 'var(--vien)', margin: 'var(--k2) 0' }} />

      <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
        <NutChinh variant="phu" onClick={doHaiBen} disabled={dangDo || !ch.URL.trim()}>
          {dangDo ? 'Đang đo…' : 'Đếm dữ liệu trên máy chủ'}
        </NutChinh>
      </div>

      {loiDo && <OThongBao tone="do">{loiDo}</OThongBao>}

      {bang && (
        <div>
          <OThongBao tone={daChuyenXong(bang) ? 'xanh' : 'cam'}>
            {daChuyenXong(bang)
              ? 'Mọi bảng đã dựng trên máy chủ. Bảng rỗng là đúng nếu thầy vừa xoá sạch ca.'
              : 'Còn bảng CHƯA DỰNG — xem dòng nào ở bảng dưới.'}
          </OThongBao>
          <div style={{ marginTop: 'var(--k2)', display: 'grid', gap: 'var(--k2)' }}>
            {bang.map((d) => (
              <div key={d.ten} style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)' }}>
                <div className="flex items-center" style={{ justifyContent: 'space-between', gap: 'var(--k2)' }}>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--muc)' }}>{d.ten}</span>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', whiteSpace: 'nowrap' }}>
                    {d.mayChuMoi === CHUA_DUNG ? (
                      <b style={{ color: 'var(--do)' }}>chưa dựng</b>
                    ) : (
                      <b style={{ color: 'var(--muc)' }}>{d.mayChuMoi}</b>
                    )}
                  </span>
                </div>
                <div style={{ ...NHAN_NHO, marginTop: 4 }}>{d.nghia}</div>
              </div>
            ))}
          </div>
          <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)' }}>
            Số là số dòng đang nằm trên máy chủ. "chưa dựng" khác hẳn số 0: 0 là bảng
            {' '}có mà rỗng, chưa dựng là bảng chưa tồn tại. Nút này chỉ ĐỌC, không sửa gì.
          </div>
        </div>
      )}

      <div style={NHAN_NHO}>
        Nút đếm chỉ ĐỌC, không sửa gì. Dùng nó khi muốn biết máy chủ đang giữ bao nhiêu
        {' '}ca, bao nhiêu lượt, bao nhiêu câu tra được.
      </div>

    </div>
  )
}

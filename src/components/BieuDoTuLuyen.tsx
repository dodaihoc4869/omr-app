// KHỐI BIỂU ĐỒ BÀI TỰ LUYỆN — dùng ở HAI chỗ, cùng một bộ số:
//   · đầu trang link bài luyện, để em thấy mình đã đi tới đâu;
//   · trong báo cáo gửi phụ huynh, tách khỏi phần mạnh–yếu của ca thi.
//
// SVG THUẦN, không thư viện: khối này chạy trong báo cáo phụ huynh vốn mở trên
// mọi loại máy, và nạp thêm một thư viện vẽ chỉ để dựng tám cái cột là đắt.
//
// BỐN HÌNH, mỗi hình một việc (không hình nào lặp việc của hình khác):
//   1. Số lớn — tỉ lệ đúng buổi mới nhất. Một con số đọc trong một giây.
//   2. Cột theo buổi — đường tiến bộ. Cột đầy = số câu, phần tô = số đúng.
//   3. Thanh ngang theo chuyên đề — mạnh yếu. Yếu nhất trên cùng.
//   4. Thanh ngang theo mức độ và theo phần — cách làm bài.
//
// KHÔNG dùng hai trục, không dùng màu cầu vồng, không tô số lên mọi cột. Mỗi
// cột có nhãn thẳng vì màu nền nhạt không đủ tương phản để đứng một mình.
import type { NhomDem, TomTatTuLuyen } from '../lib/tu-luyen'

const NHAN: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const SO: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' }

/** Cột hẹp nhất còn đọc được nhãn ngày trên màn 360 px. */
const RONG_COT = 34
const CAO_COT = 92

function phanTram(x: number): string {
  return `${Math.round(x * 100)}%`
}

/** Ba bậc, dùng chung cho mọi thanh: dưới 50% là chỗ phải kèm, trên 80% là
 * chỗ đã vững. Ngưỡng đặt một chỗ, không rải vào từng hình. */
function bac(tiLe: number): 'yeu' | 'giua' | 'tot' {
  if (tiLe < 0.5) return 'yeu'
  if (tiLe < 0.8) return 'giua'
  return 'tot'
}

function mauBac(b: 'yeu' | 'giua' | 'tot'): string {
  return b === 'yeu' ? 'var(--do)' : b === 'giua' ? 'var(--cam)' : 'var(--xanh)'
}

/** Một dòng thanh ngang: tên · thanh · số đúng/số câu. Số LUÔN hiện thành chữ,
 * không để màu đứng một mình — nền nhạt không đủ tương phản, và người phân biệt
 * màu kém vẫn phải đọc được. */
function ThanhNgang({ d }: { d: NhomDem }) {
  const b = bac(d.tiLeDung)
  return (
    <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
      <div className="truncate" style={{ ...NHAN, flex: '1 1 40%', color: 'var(--muc)' }} title={d.ten}>
        {d.ten}
      </div>
      <div style={{ flex: '1 1 45%', height: 10, borderRadius: 'var(--bo-tron)', background: 'var(--the-2)', overflow: 'hidden' }}>
        <div style={{ width: phanTram(d.tiLeDung), height: '100%', background: mauBac(b), borderRadius: 'var(--bo-tron)' }} />
      </div>
      <div style={{ ...NHAN, ...SO, flex: '0 0 auto', minWidth: 52, textAlign: 'right', color: 'var(--muc)' }}>
        {d.soDung}/{d.soCau}
      </div>
    </div>
  )
}

function Muc({ ten, children }: { ten: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
      <div style={{ ...NHAN, fontWeight: 700, color: 'var(--muc)' }}>{ten}</div>
      {children}
    </div>
  )
}

export default function BieuDoTuLuyen({ tt, tieuDe = 'Bài tập tự luyện đã làm' }: { tt: TomTatTuLuyen; tieuDe?: string }) {
  // Chưa có buổi nào thì KHÔNG dựng khối rỗng — nói thẳng một dòng rồi thôi.
  if (tt.soBuoi === 0) {
    return (
      <div data-bieu-do-tu-luyen style={NHAN}>
        Em chưa làm bài tự luyện nào. Bài này là buổi đầu tiên.
      </div>
    )
  }

  const caoNhat = Math.max(1, ...tt.cot.map((c) => c.soCau))
  const bMoi = tt.moiNhat ? bac(tt.moiNhat.tiLeDung) : 'giua'

  return (
    <div data-bieu-do-tu-luyen className="flex flex-col" style={{ gap: 'var(--k4)' }}>
      <div className="flex items-baseline flex-wrap" style={{ gap: 'var(--k2)' }}>
        <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', color: 'var(--muc)' }}>
          {tieuDe}
        </div>
        <div style={NHAN}>
          <span style={SO}>{tt.soBuoi}</span> buổi · <span style={SO}>{tt.tongDung}</span>/<span style={SO}>{tt.tongCau}</span> câu đúng
        </div>
      </div>

      {/* 1. SỐ LỚN — buổi mới nhất. Đọc trong một giây, không phải dò biểu đồ. */}
      {tt.moiNhat && (
        <div className="flex items-baseline" style={{ gap: 'var(--k3)' }}>
          <div className="font-bold" style={{ ...SO, fontFamily: 'var(--sans)', fontSize: 'var(--cx-6)', lineHeight: 1, color: mauBac(bMoi) }}>
            {phanTram(tt.moiNhat.tiLeDung)}
          </div>
          <div style={NHAN}>
            đúng ở buổi mới nhất ({tt.moiNhat.nhan}) · <span style={SO}>{tt.moiNhat.soDung}</span>/<span style={SO}>{tt.moiNhat.soCau}</span> câu
          </div>
        </div>
      )}

      {/* 2. CỘT THEO BUỔI. Cột đầy = số câu của buổi, phần tô = số đúng. Không
          quy về phần trăm hết: buổi 10 câu và buổi 40 câu không cùng sức nặng,
          vẽ cột cao thấp khác nhau là nói ra điều đó. */}
      {tt.cot.length > 1 && (
        <Muc ten="Từng buổi, cũ đến mới">
          <div className="flex items-end" style={{ gap: 'var(--k2)', overflowX: 'auto', paddingBottom: 2 }}>
            {tt.cot.map((c) => {
              const cao = Math.round((c.soCau / caoNhat) * CAO_COT)
              const tô = Math.round(cao * c.tiLeDung)
              return (
                <div key={c.ma} className="flex flex-col items-center" style={{ gap: 4, flex: `0 0 ${RONG_COT}px` }}>
                  <div style={{ ...NHAN, ...SO, color: 'var(--muc)' }}>{phanTram(c.tiLeDung)}</div>
                  <div
                    style={{ width: 20, height: Math.max(cao, 6), background: 'var(--the-2)', borderRadius: 'var(--bo-1)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}
                    title={`${c.nhan}: ${c.soDung}/${c.soCau} câu đúng`}
                  >
                    <div style={{ height: Math.max(tô, c.soDung > 0 ? 4 : 0), background: mauBac(bac(c.tiLeDung)), borderRadius: 'var(--bo-1)' }} />
                  </div>
                  <div style={{ ...NHAN, ...SO }}>{c.nhan}</div>
                </div>
              )
            })}
          </div>
          <div style={NHAN}>Cột cao thấp theo số câu của buổi; phần tô màu là số câu làm đúng.</div>
        </Muc>
      )}

      {/* 3. MẠNH YẾU THEO CHUYÊN ĐỀ, cộng dồn mọi buổi. */}
      {tt.chuyenDe.length > 0 && (
        <Muc ten="Chuyên đề, cộng cả các buổi">
          <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
            {tt.chuyenDe.map((d) => (
              <ThanhNgang key={d.ten} d={d} />
            ))}
          </div>
        </Muc>
      )}

      {/* 4. CÁCH LÀM BÀI — theo bậc nhận thức và theo phần đề. */}
      {tt.theoMucDo.length > 0 && (
        <Muc ten="Theo mức độ">
          <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
            {tt.theoMucDo.map((d) => (
              <ThanhNgang key={d.ten} d={d} />
            ))}
          </div>
        </Muc>
      )}

      {tt.theoPhan.length > 1 && (
        <Muc ten="Theo phần đề">
          <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
            {tt.theoPhan.map((d) => (
              <ThanhNgang key={d.ten} d={d} />
            ))}
          </div>
        </Muc>
      )}
    </div>
  )
}

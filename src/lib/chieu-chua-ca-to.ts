// TỜ CHIẾU «CHỮA BÀI SAU CA» (thầy chốt 01/11, docs/ban-ve-chieu-chua-ca-0111) — mảnh markup + CSS + JS gắn vào tờ chiếu chuẩn (`html-may-chieu.ts`) khi
// `TuyChonMayChieu.chuaBai`. Tờ vẫn là tờ Chiếu lên bảng (đề 2/3, phím G/T/B/Tab/?, cài đặt nền/cỡ chữ); chỉ khác:
//   · góc trên cột phải: THẺ «n/N em chưa đúng câu này» + tên em (màu trung tính, không đỏ — luật tế nhị trước lớp);
//   · THU GỌN (thầy 01/11: «phần tên em sai phải thu gọn lại được để lấy diện tích chữa bảng»): bấm thẻ / nút «Thu gọn tên» / phím H ⇒ thẻ co thành một dải
//     nhỏ «n/N em chưa đúng · Hiện tên», cả cột phải để trống cho thầy viết; trạng thái giữ khi lật câu; bấm lại thì hiện;
//   · đầu đề có chip mức độ; thanh dưới «Câu n/N», pha «CHỮA BÀI»; không có «Lên bảng» (phím L tắt) — không gọi em, không ghi điểm.
import type { TheChuaDung } from './chieu-chua-ca'

/** Tên mức độ trên chip (để riêng ở đây: tờ chiếu không kéo phần xếp câu của app vào mảnh của nó). */
const TEN_MUC_DO: Record<string, string> = { van_dung_cao: 'Vận dụng cao', van_dung: 'Vận dụng', hieu: 'Hiểu', biet: 'Biết' }

const thoat = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Thẻ tên em chưa đúng (nằm TRONG `section.mc-cot-lam-bai` của đợt). */
export function theChuaDungHtml(t: TheChuaDung): string {
  const n = t.ten.length + (t.them > 0 ? 1 : 0)
  const cot = n <= 18 ? 2 : 3
  const co = n <= 8 ? 1.6 : n <= 18 ? 1.3 : 1.15
  const ds = t.ten.map((x) => `<li>${thoat(x)}</li>`).join('') + (t.them > 0 ? `<li class="mc-st-them">+${t.them} em</li>` : '')
  return `<aside class="mc-st" aria-label="Em chưa đúng câu này"><button type="button" class="mc-st-dau" aria-expanded="true"><b>${t.tong}<small>/${t.lam}</small></b><span class="mc-st-nhan">em chưa đúng câu này</span><span class="mc-st-gon-chu">· Hiện tên</span></button><ol class="mc-st-ds" style="--cd-cot:${cot};--cd-co:calc(var(--u) * ${co})">${ds}</ol></aside>`
}

/** Chip mức độ ở đầu đề (chỉ tờ chữa bài). Mức lạ / rỗng ⇒ không chip. */
export function chipMucDoHtml(mucDo: string | undefined): string {
  const ten = TEN_MUC_DO[String(mucDo ?? '')]
  return ten ? `<span class="mc-de-phan mc-st-muc">${ten}</span>` : ''
}

/** Nút thanh dưới (thay chỗ «Lên bảng»). Không dùng `data-k` — phím H của tờ chuẩn là Home. */
export const NUT_THU_GON = '<button type="button" class="mc-nut-phim" id="mc-st-nut" aria-pressed="false"><kbd>H</kbd><span class="mc-nut-chu">Thu gọn tên</span></button>'

export const CSS_CHUA_BAI = `
body[data-chua-bai] .mc-cot-lam-bai::before,body[data-chua-bai] .mc-cot-lam-bai::after{content:none!important}
body[data-chua-bai] .mc-nut-hien-em{display:none!important}
.mc-st{position:absolute;top:0;left:0;right:0;z-index:5;margin:0;text-align:left;padding:calc(var(--u)*1.1) calc(var(--u)*1.4) calc(var(--u)*1.1);border-radius:clamp(14px,1.72vw,30px);background:var(--mc-giay);color:var(--mc-chu);box-shadow:0 0 0 1px var(--mc-vien)}
.mc-st-dau{display:flex;align-items:baseline;flex-wrap:wrap;column-gap:calc(var(--u)*.7);row-gap:0;width:100%;min-height:44px;margin:0 0 calc(var(--u)*.8);padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}
.mc-st-dau b{font:800 calc(var(--u)*2.6)/1 var(--mc-sans,system-ui);letter-spacing:-.02em}
.mc-st-dau b small{font-size:.5em;font-weight:700;color:var(--mc-phu);letter-spacing:0}
.mc-st-nhan,.mc-st-gon-chu{font:600 calc(var(--u)*1.2)/1.25 var(--mc-sans,system-ui);color:var(--mc-phu)}
.mc-st-gon-chu{display:none}
.mc-st-ds{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(var(--cd-cot),minmax(0,1fr));gap:calc(var(--u)*.35) calc(var(--u)*1)}
.mc-st-ds li{font:600 var(--cd-co)/1.3 var(--mc-sans,system-ui);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mc-st-ds .mc-st-them{color:var(--mc-phu)}
.mc-st-muc{margin-left:calc(var(--u)*.5)}
body.mc-st-gon .mc-st{left:auto;padding:calc(var(--u)*.45) calc(var(--u)*1.1)}
body.mc-st-gon .mc-st-dau{margin:0;align-items:center}
body.mc-st-gon .mc-st-dau b{font-size:calc(var(--u)*1.5)}
body.mc-st-gon .mc-st-ds{display:none}
body.mc-st-gon .mc-st-gon-chu{display:inline}
body.mc-st-gon .mc-st-nhan{font-size:calc(var(--u)*1.05)}
@media print{.mc-st-dau{cursor:default}}
`

/** Hành vi: thu gọn / hiện tên (bấm thẻ, nút H trên thanh, phím H), chặn phím L (tờ chữa bài không gọi em), chữ «Câu n/N» + «CHỮA BÀI» do JS chính đọc `data-chua-bai`. */
export const JS_CHUA_BAI = `(function(){
  var b=document.body,nut=document.getElementById('mc-st-nut');
  function dat(gon){
    b.classList.toggle('mc-st-gon',gon);
    Array.prototype.forEach.call(document.querySelectorAll('.mc-st-dau'),function(x){x.setAttribute('aria-expanded',gon?'false':'true')});
    if(nut){nut.setAttribute('aria-pressed',gon?'true':'false');var c=nut.querySelector('.mc-nut-chu');if(c)c.textContent=gon?'Hiện tên':'Thu gọn tên'}
  }
  function doi(){dat(!b.classList.contains('mc-st-gon'))}
  document.addEventListener('click',function(e){var t=e.target&&e.target.closest&&e.target.closest('.mc-st-dau,#mc-st-nut');if(t){e.preventDefault();doi()}});
  window.addEventListener('keydown',function(e){
    if(e.target&&e.target.closest&&e.target.closest('input,textarea,select'))return;
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    var k=e.key;
    if(k==='h'||k==='H'){e.preventDefault();e.stopImmediatePropagation();doi();return}
    if(k==='l'||k==='L'){e.preventDefault();e.stopImmediatePropagation()}
  },true);
  dat(false);
})();`

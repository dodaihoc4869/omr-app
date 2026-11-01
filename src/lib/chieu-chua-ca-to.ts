// TỜ CHIẾU «CHỮA BÀI SAU CA» (thầy chốt 01/11, docs/ban-ve-chieu-chua-ca-0111) — mảnh markup + CSS + JS gắn vào tờ chiếu chuẩn (`html-may-chieu.ts`) khi
// `TuyChonMayChieu.chuaBai`. Tờ vẫn là tờ Chiếu lên bảng (đề 2/3, phím G/T/B/Tab/?, cài đặt nền/cỡ chữ); chỉ khác:
//   · góc trên cột phải: THẺ «n/N em chưa đúng câu này» — mỗi em một viên: tên đậm + ô SỐ GIÂY làm câu (số đều nhau), xếp NGẮN NHẤT trước, em không
//     có số giây «—» đứng cuối (thầy 01/11 tối). Màu trung tính, không đỏ — luật tế nhị trước lớp. Chỉ biến màu sẵn có của tờ (`--mc-*`);
//   · THU GỌN (thầy 01/11: «phần tên em sai phải thu gọn lại được để lấy diện tích chữa bảng»): bấm thẻ / nút «Thu gọn tên» / phím H ⇒ thẻ co thành một dải
//     nhỏ «n/N em chưa đúng · Hiện tên», cả cột phải để trống cho thầy viết; trạng thái giữ khi lật câu; bấm lại thì hiện;
//   · GỌI LÊN BẢNG (thầy 01/11 tối: «Gọi lên bảng chọn học sinh làm đúng câu đó, nếu ko có ai thì thầy chữa»; góp ý sau PR 730: «Tên lên bảng làm giống
//     hiệu ứng của các màn khác»): nút «Gọi lên bảng» / phím L chọn NGẪU NHIÊN một em ĐÃ LÀM ĐÚNG câu đang chiếu (tránh em vừa gọi ở câu trước khi còn
//     lựa chọn), điền tên + «Làm đúng trong n giây» vào THẺ TÊN CHUẨN của đợt rồi chạy ĐÚNG màn gọi tên của tờ chuẩn (`__mcLenBang` → `goiTen`:
//     vòng sáng, hạt, «Mời em lên bảng», tên lớn, bay về thẻ tên, pha ĐANG CHỮA). Đổi em: nút «Gọi em khác» (phím E) của tờ chuẩn
//     (`components/chien-dich/to-chieu-goi-em-khac.ts`, dữ liệu `data-goi-em` do `dung-to-chua-ca.ts` chèn). Không em nào đúng ⇒ «Thầy chữa» đúng kiểu
//     tờ chuẩn (cột phải «Thầy chữa», thanh dưới THẦY CHỮA), không gọi tên. THUẦN TẠI TỜ: không gọi mạng, không ghi điểm (D/K chặn), không số báo danh;
//   · đầu đề có chip mức độ; thanh dưới «Câu n/N», pha «CHỮA BÀI».
import type { TheChuaDung } from './chieu-chua-ca'

/** Tên mức độ trên chip (để riêng ở đây: tờ chiếu không kéo phần xếp câu của app vào mảnh của nó). */
const TEN_MUC_DO: Record<string, string> = { van_dung_cao: 'Vận dụng cao', van_dung: 'Vận dụng', hieu: 'Hiểu', biet: 'Biết' }

const thoat = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Ô số giây của một viên tên. */
function giayHtml(g: number | null): string {
  return g == null ? '<span class="mc-st-giay mc-st-giay-trong" title="Chưa có số giây">—</span>' : `<span class="mc-st-giay" title="${g} giây">${g}<small> s</small></span>`
}

/** Thẻ tên em chưa đúng (nằm TRONG `section.mc-cot-lam-bai` của đợt). Danh sách em LÀM ĐÚNG không nằm ở đây: nó là `data-goi-em` của đợt (`dung-to-chua-ca.ts`). */
export function theChuaDungHtml(t: TheChuaDung): string {
  const n = t.em.length + (t.them > 0 ? 1 : 0)
  const cot = n <= 6 ? 1 : 2
  const co = n <= 6 ? 1.6 : n <= 14 ? 1.3 : 1.12
  const coGiay = t.em.some((e) => e.giay != null)
  const ds = t.em.map((e) => `<li class="mc-st-em"><span class="mc-st-ten">${thoat(e.ten)}</span>${coGiay ? giayHtml(e.giay) : ''}</li>`).join('') + (t.them > 0 ? `<li class="mc-st-em mc-st-them">+${t.them} em</li>` : '')
  return `<aside class="mc-st" aria-label="Em chưa đúng câu này"><button type="button" class="mc-st-dau" aria-expanded="true"><b>${t.tong}<small>/${t.lam}</small></b><span class="mc-st-nhan">em chưa đúng câu này</span><span class="mc-st-gon-chu">· Hiện tên</span></button>${coGiay ? '<p class="mc-st-chu-thich">Số giây làm câu · nhanh nhất trước</p>' : ''}<ol class="mc-st-ds" style="--cd-cot:${cot};--cd-co:calc(var(--u) * ${co})">${ds}</ol></aside>`
}

/** Chip mức độ ở đầu đề (chỉ tờ chữa bài). Mức lạ / rỗng ⇒ không chip. */
export function chipMucDoHtml(mucDo: string | undefined): string {
  const ten = TEN_MUC_DO[String(mucDo ?? '')]
  return ten ? `<span class="mc-de-phan mc-st-muc">${ten}</span>` : ''
}

/** Nút thanh dưới «Thu gọn tên». Không dùng `data-k` — phím H của tờ chuẩn là Home. */
export const NUT_THU_GON = '<button type="button" class="mc-nut-phim" id="mc-st-nut" aria-pressed="false"><kbd>H</kbd><span class="mc-nut-chu">Thu gọn tên</span></button>'

/** Nút thanh dưới «Gọi lên bảng» (phím L) — thay nút «Lên bảng» của tờ chuẩn: chọn em LÀM ĐÚNG câu này rồi chạy màn gọi tên chuẩn (JS_CHUA_BAI).
 *  Không `data-k`; ẩn khi đã gọi (pha gọi/đang chữa — «Gọi em khác» thay chỗ, như tờ chiến dịch) và ở câu Thầy chữa. */
export const NUT_GOI = '<button type="button" class="mc-nut-phim mc-nut-goi" id="mc-goi-nut"><kbd>L</kbd><span class="mc-nut-chu">Gọi lên bảng</span></button>'

/** CHỌN EM LÊN BẢNG — hàm THUẦN, TỰ CHỨA (chép nguyên văn vào tờ bằng `toString()`, như `leoBacBoCuc`): chọn ngẫu nhiên một chỉ số trong `ten`,
 *  lần lượt tránh từng nhóm của `tranh` (nhóm đứng trước tránh trước) chừng nào vẫn còn lựa chọn. `r` ∈ [0, 1). Danh sách rỗng ⇒ -1. */
export function chonEmGoi(ten: readonly string[], tranh: readonly (readonly string[])[], r: number): number {
  let con: number[] = []
  for (let i = 0; i < ten.length; i++) con.push(i)
  if (!con.length) return -1
  for (let k = 0; k < tranh.length; k++) {
    const bo = tranh[k] || []
    const loc = con.filter((i) => bo.indexOf(ten[i] as string) < 0)
    if (loc.length) con = loc
  }
  return con[Math.min(con.length - 1, Math.max(0, Math.floor(r * con.length)))] as number
}

export const CSS_CHUA_BAI = `
body[data-chua-bai] .mc-dot-don:not([data-thay-chua]) .mc-cot-lam-bai::before,body[data-chua-bai] .mc-cot-lam-bai::after{content:none!important}
body[data-chua-bai] .mc-nut-hien-em{display:none!important}
.mc-st{position:absolute;top:0;left:0;right:0;z-index:5;box-sizing:border-box;max-height:100%;overflow:hidden;margin:0;text-align:left;padding:calc(var(--u)*1.1) calc(var(--u)*1.2) calc(var(--u)*1.25);border-radius:clamp(14px,1.72vw,30px);background:var(--mc-giay);color:var(--mc-chu);box-shadow:0 0 0 1px var(--mc-vien)}
.mc-st-dau{display:flex;align-items:baseline;flex-wrap:wrap;column-gap:calc(var(--u)*.7);row-gap:0;width:100%;min-height:44px;margin:0;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}
.mc-st-dau b{font:800 calc(var(--u)*2.6)/1 var(--mc-sans,system-ui);letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.mc-st-dau b small{font-size:.5em;font-weight:700;color:var(--mc-phu);letter-spacing:0}
.mc-st-nhan,.mc-st-gon-chu{font:600 calc(var(--u)*1.2)/1.25 var(--mc-sans,system-ui);color:var(--mc-phu)}
.mc-st-gon-chu{display:none}
.mc-st-chu-thich{margin:calc(var(--u)*.2) 0 0;font:500 calc(var(--u)*.95)/1.3 var(--mc-sans,system-ui);color:var(--mc-phu)}
.mc-st-ds{list-style:none;margin:calc(var(--u)*.8) 0 0;padding:0;display:grid;grid-template-columns:repeat(var(--cd-cot),minmax(0,1fr));gap:calc(var(--u)*.42) calc(var(--u)*.55);font:var(--cd-co)/1.15 var(--mc-sans,system-ui)}
.mc-st-em{display:flex;align-items:center;gap:.5em;min-width:0;padding:.3em .34em .3em .78em;border-radius:999px;background:var(--mc-the);color:var(--mc-chu)}
.mc-st-ten{flex:1 1 auto;min-width:0;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mc-st-giay{flex:none;box-sizing:border-box;min-width:3.3em;padding:.16em .55em;border-radius:999px;background:var(--mc-giay);color:var(--mc-phu);font-size:.78em;font-weight:700;line-height:1.2;font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}
.mc-st-giay small{font-size:.86em;font-weight:600}
.mc-st-giay-trong{text-align:center}
.mc-st-them{justify-content:center;padding-left:.34em;background:transparent;box-shadow:inset 0 0 0 1px var(--mc-vien);color:var(--mc-phu);font-weight:700}
.mc-st-muc{margin-left:calc(var(--u)*.5)}
body.mc-st-gon .mc-st{left:auto;padding:calc(var(--u)*.45) calc(var(--u)*1.1)}
body.mc-st-gon .mc-st-dau{margin:0;align-items:center}
body.mc-st-gon .mc-st-dau b{font-size:calc(var(--u)*1.5)}
body.mc-st-gon .mc-st-ds,body.mc-st-gon .mc-st-chu-thich{display:none}
body.mc-st-gon .mc-st-gon-chu{display:inline}
body.mc-st-gon .mc-st-nhan{font-size:calc(var(--u)*1.05)}
/* nút «Gọi lên bảng»: viền sáng, chữ luôn hiện (cả máy chiếu hẹp) */
body.mc .mc-phim-nhom .mc-nut-goi{border-color:var(--mc-bang-chu)}
body.mc .mc-phim-nhom .mc-nut-goi .mc-nut-chu{display:inline!important}
/* GỌI LÊN BẢNG = màn gọi tên CHUẨN (.mc-goi của tờ chuẩn). Đã gọi / Thầy chữa ⇒ ẩn nút (tờ chiến dịch cũng ẩn «Lên bảng» khi đã gọi). */
body[data-chua-bai][data-pha="goi"] #mc-goi-nut,body[data-chua-bai][data-pha="chua"] #mc-goi-nut,body[data-chua-bai][data-dot-thay-chua] #mc-goi-nut{display:none}
/* thẻ tên em được gọi: tờ chữa bài không có bảng chi tiết học sinh (không nối app) ⇒ không «Chi tiết ›», không con trỏ bấm */
body[data-chua-bai] .mc-em{cursor:default}
body[data-chua-bai] .mc-em .mc-xem-ct{display:none!important}
/* tờ chữa bài không có ảnh thần thú: dòng «Làm đúng trong n giây» thẳng hàng dưới tên (tên đã chiếm cả hai cột đầu khi không có thú) */
body[data-chua-bai] .mc-em:not(:has(.mc-thu)) .mc-em-phu{grid-column:1 / span 2}
/* THẦY CHỮA (không em nào làm đúng): đúng chữ / cỡ / màu cột phải của tờ chuẩn, dòng hai nói vì sao */
body[data-chua-bai] .mc-dot-don[data-thay-chua] .mc-cot-lam-bai::before{content:"Thầy chữa\\A Chưa em nào làm đúng câu này"!important}
@media print{.mc-st-dau{cursor:default}}

`

/** Hành vi: thu gọn / hiện tên (bấm thẻ, nút H trên thanh, phím H); GỌI LÊN BẢNG bằng màn gọi tên CHUẨN (`__mcLenBang`) cho một em làm đúng; câu không
 *  em nào đúng ⇒ Thầy chữa; chặn D/K (tờ chữa bài không ghi điểm). Gọi em / Thầy chữa tự thu gọn thẻ em chưa đúng (chỗ viết bảng), sang câu khác thì mở lại.
 *  Nghe phím ở pha BẮT (capture) để phím L của tờ chuẩn không gọi «Cả lớp». */
export const JS_CHUA_BAI = `(function(){
  var b=document.body,nut=document.getElementById('mc-st-nut'),tuGon=false;
  function dat(gon){
    b.classList.toggle('mc-st-gon',gon);
    Array.prototype.forEach.call(document.querySelectorAll('.mc-st-dau'),function(x){x.setAttribute('aria-expanded',gon?'false':'true')});
    if(nut){nut.setAttribute('aria-pressed',gon?'true':'false');var c=nut.querySelector('.mc-nut-chu');if(c)c.textContent=gon?'Hiện tên':'Thu gọn tên'}
  }
  function doi(){tuGon=false;dat(!b.classList.contains('mc-st-gon'))}
  function gonTam(){if(!b.classList.contains('mc-st-gon')){tuGon=true;dat(true)}}
  // ── GỌI LÊN BẢNG (màn gọi tên chuẩn) ──
  var chonEmGoi=(${chonEmGoi.toString()});
  var lichSu=[];
  function chiSo(){return window.__mcChiSo?window.__mcChiSo():0}
  function dotDang(){return window.__mcDot?window.__mcDot():null}
  function pha(){return b.getAttribute('data-pha')||''}
  function bao(chu){var x=document.querySelector('.mc-bao');if(!x)return;x.textContent=chu;x.classList.add('mc-hien');clearTimeout(bao.h);bao.h=setTimeout(function(){x.classList.remove('mc-hien')},1800)}
  function emDung(d){
    if(!d)return [];
    if(d.__cbDung===undefined){var x=null;try{x=JSON.parse(d.getAttribute('data-goi-em')||'null')}catch(e){x=null}
      d.__cbDung=x&&Array.isArray(x.em)?x.em.map(function(e){return {ten:String(e.ten||''),giay:typeof e.giay==='number'?e.giay:null}}):[]}
    return d.__cbDung;
  }
  /** Điền em vào THẺ TÊN CHUẨN của đợt: tên + dòng phụ «Làm đúng trong n giây» (màn gọi tên chuẩn chép dòng này xuống dưới tên lớn). */
  function dienThe(d,e){
    var the=d.querySelector('.mc-em[id]');if(!the)return;
    var ten=the.querySelector('.mc-ten');if(ten)ten.textContent=e.ten;
    var phu=the.querySelector('.mc-em-phu');
    if(e.giay===null){if(phu)phu.remove()}
    else{if(!phu){phu=document.createElement('div');phu.className='mc-em-phu';the.insertBefore(phu,the.querySelector('.mc-xem-ct'))}phu.textContent='Làm đúng trong '+e.giay+' giây'}
    var goi=e.ten.split(/\\s+/).pop()||e.ten;
    Array.prototype.forEach.call(d.querySelectorAll('[data-nhan-em]'),function(x){x.setAttribute('data-nhan-em','Phần làm bài của '+goi)});
  }
  function thayChua(d){
    gonTam();
    if(!d.hasAttribute('data-thay-chua')){d.setAttribute('data-thay-chua','');document.dispatchEvent(new CustomEvent('mc-doi-pha'))}
    bao('Chưa em nào làm đúng câu này — Thầy chữa');
  }
  function goi(){
    var d=dotDang();if(!d)return;
    var ds=emDung(d);
    if(!ds.length){thayChua(d);return}
    if(pha()!=='cho')return;
    var i=chiSo(),daGoi=lichSu.filter(function(x){return x.dot===i}).map(function(x){return x.ten}),truoc=null;
    for(var k=lichSu.length-1;k>=0;k--){if(lichSu[k].dot!==i){truoc=lichSu[k].ten;break}}
    var j=chonEmGoi(ds.map(function(e){return e.ten}),[truoc?[truoc]:[],daGoi],Math.random()),e=ds[j];
    lichSu.push({dot:i,ten:e.ten});
    if(window.__mcGoiEmDat)window.__mcGoiEmDat(j);
    dienThe(d,e);gonTam();
    if(window.__mcLenBang)window.__mcLenBang();
  }
  window.__mcGoiChuaBai={goi:goi,lichSu:function(){return lichSu.slice()}};
  // «Gọi em khác» (phím E, mảnh chuẩn) vừa đổi tên trên thẻ ⇒ đổi dòng giây cho đúng em mới, nhớ em vừa gọi.
  document.addEventListener('mc-doi-em',function(){
    var d=dotDang(),the=d&&d.querySelector('.mc-em[id]'),t=the&&the.querySelector('.mc-ten');if(!t)return;
    var e=emDung(d).filter(function(x){return x.ten===t.textContent})[0];
    if(e){dienThe(d,e);lichSu.push({dot:chiSo(),ten:e.ten})}
  });
  document.addEventListener('mc-vao-dot',function(){if(tuGon){tuGon=false;dat(false)}});
  document.addEventListener('click',function(e){
    var t=e.target&&e.target.closest?e.target:null;if(!t)return;
    if(t.closest('.mc-st-dau,#mc-st-nut')){e.preventDefault();doi();return}
    if(t.closest('#mc-goi-nut')){e.preventDefault();goi();return}
    if(t.closest('#mc-ray .mc-em[id]'))e.stopPropagation();
  },true);
  window.addEventListener('keydown',function(e){
    if(e.target&&e.target.closest&&e.target.closest('input,textarea,select'))return;
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    var k=e.key;
    if((k==='l'||k==='L')&&pha()==='cho'){e.preventDefault();e.stopImmediatePropagation();goi();return}
    if(k==='h'||k==='H'){e.preventDefault();e.stopImmediatePropagation();doi();return}
    if((k==='d'||k==='D'||k==='k'||k==='K')&&(pha()==='chua'||pha()==='goi')){e.preventDefault();e.stopImmediatePropagation();bao('Tờ chữa bài không ghi Đạt / Chưa đạt')}
  },true);
  dat(false);
})();`

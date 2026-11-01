// TỜ CHIẾU «CHỮA BÀI SAU CA» (thầy chốt 01/11, docs/ban-ve-chieu-chua-ca-0111) — mảnh markup + CSS + JS gắn vào tờ chiếu chuẩn (`html-may-chieu.ts`) khi
// `TuyChonMayChieu.chuaBai`. Tờ vẫn là tờ Chiếu lên bảng (đề 2/3, phím G/T/B/Tab/?, cài đặt nền/cỡ chữ); chỉ khác:
//   · góc trên cột phải: THẺ «n/N em chưa đúng câu này» — mỗi em một viên: tên đậm + ô SỐ GIÂY làm câu (số đều nhau), xếp NGẮN NHẤT trước, em không
//     có số giây «—» đứng cuối (thầy 01/11 tối). Màu trung tính, không đỏ — luật tế nhị trước lớp. Chỉ biến màu sẵn có của tờ (`--mc-*`);
//   · THU GỌN (thầy 01/11: «phần tên em sai phải thu gọn lại được để lấy diện tích chữa bảng»): bấm thẻ / nút «Thu gọn tên» / phím H ⇒ thẻ co thành một dải
//     nhỏ «n/N em chưa đúng · Hiện tên», cả cột phải để trống cho thầy viết; trạng thái giữ khi lật câu; bấm lại thì hiện;
//   · GỌI LÊN BẢNG (thầy 01/11 tối: «Gọi lên bảng chọn học sinh làm đúng câu đó, nếu ko có ai thì thầy chữa»): nút thanh dưới / phím L ⇒ tấm lớn
//     «Mời <tên> lên bảng chữa câu này» (+ «làm đúng trong n giây»), chọn NGẪU NHIÊN một em ĐÃ LÀM ĐÚNG câu đang chiếu, tránh em vừa gọi ở câu trước
//     khi còn lựa chọn; «Gọi bạn khác» (L) chọn em đúng khác; «Đóng» (Esc). Không em nào đúng ⇒ «Chưa em nào làm đúng câu này — Thầy chữa».
//     THUẦN TẠI TỜ: không gọi mạng, không ghi điểm; danh sách em đúng chỉ có tên gọn + giây (không số báo danh);
//   · đầu đề có chip mức độ; thanh dưới «Câu n/N», pha «CHỮA BÀI».
import type { EmTrenTo, TheChuaDung } from './chieu-chua-ca'

/** Tên mức độ trên chip (để riêng ở đây: tờ chiếu không kéo phần xếp câu của app vào mảnh của nó). */
const TEN_MUC_DO: Record<string, string> = { van_dung_cao: 'Vận dụng cao', van_dung: 'Vận dụng', hieu: 'Hiểu', biet: 'Biết' }

const thoat = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Ô số giây của một viên tên. */
function giayHtml(g: number | null): string {
  return g == null ? '<span class="mc-st-giay mc-st-giay-trong" title="Chưa có số giây">—</span>' : `<span class="mc-st-giay" title="${g} giây">${g}<small> s</small></span>`
}

/** Thẻ tên em chưa đúng (nằm TRONG `section.mc-cot-lam-bai` của đợt). Kèm danh sách em làm đúng (ẩn) cho «Gọi lên bảng». */
export function theChuaDungHtml(t: TheChuaDung): string {
  const n = t.em.length + (t.them > 0 ? 1 : 0)
  const cot = n <= 6 ? 1 : 2
  const co = n <= 6 ? 1.6 : n <= 14 ? 1.3 : 1.12
  const coGiay = t.em.some((e) => e.giay != null)
  const ds = t.em.map((e) => `<li class="mc-st-em"><span class="mc-st-ten">${thoat(e.ten)}</span>${coGiay ? giayHtml(e.giay) : ''}</li>`).join('') + (t.them > 0 ? `<li class="mc-st-em mc-st-them">+${t.them} em</li>` : '')
  const dung = (t.dung ?? []).map((e: EmTrenTo) => `<li${e.giay != null ? ` data-giay="${e.giay}"` : ''}>${thoat(e.ten)}</li>`).join('')
  return `<aside class="mc-st" aria-label="Em chưa đúng câu này"><button type="button" class="mc-st-dau" aria-expanded="true"><b>${t.tong}<small>/${t.lam}</small></b><span class="mc-st-nhan">em chưa đúng câu này</span><span class="mc-st-gon-chu">· Hiện tên</span></button>${coGiay ? '<p class="mc-st-chu-thich">Số giây làm câu · nhanh nhất trước</p>' : ''}<ol class="mc-st-ds" style="--cd-cot:${cot};--cd-co:calc(var(--u) * ${co})">${ds}</ol><ul class="mc-st-dung" hidden>${dung}</ul></aside>`
}

/** Chip mức độ ở đầu đề (chỉ tờ chữa bài). Mức lạ / rỗng ⇒ không chip. */
export function chipMucDoHtml(mucDo: string | undefined): string {
  const ten = TEN_MUC_DO[String(mucDo ?? '')]
  return ten ? `<span class="mc-de-phan mc-st-muc">${ten}</span>` : ''
}

/** Nút thanh dưới «Thu gọn tên». Không dùng `data-k` — phím H của tờ chuẩn là Home. */
export const NUT_THU_GON = '<button type="button" class="mc-nut-phim" id="mc-st-nut" aria-pressed="false"><kbd>H</kbd><span class="mc-nut-chu">Thu gọn tên</span></button>'

/** Nút thanh dưới «Gọi lên bảng» (phím L). Không `data-k`: tờ chuẩn gọi em theo đợt, tờ chữa bài chọn em ĐÚNG câu này (JS_CHUA_BAI). */
export const NUT_GOI = '<button type="button" class="mc-nut-phim mc-nut-goi" id="mc-goi-nut" aria-haspopup="dialog"><kbd>L</kbd><span class="mc-nut-chu">Gọi lên bảng</span></button>'

/** Tấm «Mời … lên bảng» / «Thầy chữa» (một tấm cho cả tờ, JS điền chữ). */
export const TAM_GOI = `<div class="mc-goi" id="mc-goi" hidden><div class="mc-goi-the" role="dialog" aria-modal="true" aria-labelledby="mc-goi-ten" aria-describedby="mc-goi-viec">
<p class="mc-goi-ke" id="mc-goi-ke"></p><p class="mc-goi-moi" id="mc-goi-moi">Mời</p><h2 class="mc-goi-ten" id="mc-goi-ten"></h2><p class="mc-goi-viec" id="mc-goi-viec">lên bảng chữa câu này</p>
<p class="mc-goi-giay" id="mc-goi-giay" hidden></p>
<div class="mc-goi-hang"><button type="button" class="mc-goi-nut mc-goi-khac" id="mc-goi-khac">Gọi bạn khác <kbd>L</kbd></button><button type="button" class="mc-goi-nut mc-goi-dong" id="mc-goi-dong">Đóng <kbd>Esc</kbd></button></div>
</div></div>`

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
body[data-chua-bai] .mc-cot-lam-bai::before,body[data-chua-bai] .mc-cot-lam-bai::after{content:none!important}
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
.mc-st-dung{display:none!important}
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
/* TẤM GỌI LÊN BẢNG — giấy ấm giữa bảng tối, tên thật to đọc được từ cuối lớp */
.mc-goi{position:fixed;inset:0;z-index:60;display:grid;place-items:center;box-sizing:border-box;padding:calc(var(--u)*2.5);background:color-mix(in srgb,var(--mc-bang) 80%,transparent)}
.mc-goi[hidden]{display:none}
.mc-goi-the{box-sizing:border-box;width:min(100%,calc(var(--u)*66));max-height:100%;overflow:auto;padding:calc(var(--u)*3) calc(var(--u)*3.6) calc(var(--u)*2.6);border-radius:calc(var(--u)*2.4);background:var(--mc-giay);color:var(--mc-chu);text-align:center;font-family:var(--mc-sans,system-ui);box-shadow:0 0 0 1px var(--mc-vien),0 calc(var(--u)*1.4) calc(var(--u)*5) color-mix(in srgb,var(--mc-den) 45%,transparent);animation:mc-goi-vao .22s cubic-bezier(.2,.9,.3,1.15)}
.mc-goi-ke{margin:0 0 calc(var(--u)*1.4);font:700 calc(var(--u)*1.2)/1.3 var(--mc-sans,system-ui);color:var(--mc-phu);font-variant-numeric:tabular-nums}
.mc-goi-moi{margin:0;font:600 calc(var(--u)*2.1)/1.2 var(--mc-sans,system-ui);color:var(--mc-nhan)}
.mc-goi-ten{margin:calc(var(--u)*.3) 0 calc(var(--u)*.5);font:800 calc(var(--u)*6.2)/1.05 var(--mc-sans,system-ui);letter-spacing:-.02em;color:var(--mc-chu);overflow-wrap:anywhere}
.mc-goi-ten.mc-goi-doi{animation:mc-goi-ten .24s ease-out}
.mc-goi-viec{margin:0;font:600 calc(var(--u)*2.1)/1.25 var(--mc-sans,system-ui);color:var(--mc-chu)}
.mc-goi-giay{display:inline-block;margin:calc(var(--u)*1.5) 0 0;padding:calc(var(--u)*.42) calc(var(--u)*1.2);border-radius:999px;background:var(--mc-chip);color:var(--mc-chip-chu);font:700 calc(var(--u)*1.3)/1.25 var(--mc-sans,system-ui);font-variant-numeric:tabular-nums}
.mc-goi-giay[hidden]{display:none}
.mc-goi-hang{display:flex;flex-wrap:wrap;justify-content:center;gap:calc(var(--u)*1);margin-top:calc(var(--u)*2.2)}
.mc-goi-nut{display:inline-flex;align-items:center;gap:.55em;min-height:max(44px,calc(var(--u)*3.3));padding:0 calc(var(--u)*1.6);border-radius:999px;font:700 max(14px,calc(var(--u)*1.3))/1 var(--mc-sans,system-ui);cursor:pointer}
.mc-goi-nut[hidden]{display:none}
.mc-goi-nut kbd{font:inherit;font-size:.74em;padding:.12em .45em;border-radius:.3em;box-shadow:inset 0 0 0 1px currentColor}
.mc-goi-khac{border:0;background:var(--mc-chu);color:var(--mc-giay)}
.mc-goi-dong{border:1px solid var(--mc-vien);background:transparent;color:var(--mc-chu)}
.mc-goi-nut:focus-visible{outline:3px solid var(--mc-nhan);outline-offset:3px}
.mc-goi.mc-goi-thay .mc-goi-moi{color:var(--mc-phu);font-weight:600}
.mc-goi.mc-goi-thay .mc-goi-viec{display:none}
@keyframes mc-goi-vao{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:none}}
@keyframes mc-goi-ten{from{opacity:.2;transform:translateY(.12em)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.mc-goi-the,.mc-goi-ten.mc-goi-doi{animation:none}}
@media print{.mc-st-dau{cursor:default}.mc-goi{display:none!important}}
`

/** Hành vi: thu gọn / hiện tên (bấm thẻ, nút H trên thanh, phím H); GỌI LÊN BẢNG (nút, phím L, «Gọi bạn khác», Esc đóng); chữ «Câu n/N» + «CHỮA BÀI»
 *  do JS chính đọc `data-chua-bai`. Nghe phím ở pha BẮT (capture) để phím L / Esc / Space của tờ chuẩn không chạy chồng. */
export const JS_CHUA_BAI = `(function(){
  var b=document.body,nut=document.getElementById('mc-st-nut'),goiNut=document.getElementById('mc-goi-nut'),tam=document.getElementById('mc-goi');
  function dat(gon){
    b.classList.toggle('mc-st-gon',gon);
    Array.prototype.forEach.call(document.querySelectorAll('.mc-st-dau'),function(x){x.setAttribute('aria-expanded',gon?'false':'true')});
    if(nut){nut.setAttribute('aria-pressed',gon?'true':'false');var c=nut.querySelector('.mc-nut-chu');if(c)c.textContent=gon?'Hiện tên':'Thu gọn tên'}
  }
  function doi(){dat(!b.classList.contains('mc-st-gon'))}
  // ── GỌI LÊN BẢNG ──
  var chonEmGoi=(${chonEmGoi.toString()});
  var lichSu=[],dang=null;
  function $(id){return document.getElementById(id)}
  function chiSo(){return window.__mcTrangThai?window.__mcTrangThai().dot:0}
  function dotDang(){return document.querySelectorAll('#mc-ray > .mc-dot')[chiSo()]||null}
  function emDung(d){return Array.prototype.map.call(d?d.querySelectorAll('.mc-st-dung li'):[],function(li){var g=li.getAttribute('data-giay');return {ten:li.textContent||'',giay:g===null||g===''?null:+g}})}
  function moGoi(){
    var d=dotDang();if(!d||!tam)return;
    var i=chiSo(),ds=emDung(d),so=d.querySelector('.mc-de-so'),cau=so?String(so.textContent||'').trim():'';
    var ten=$('mc-goi-ten'),giay=$('mc-goi-giay'),khac=$('mc-goi-khac');
    tam.classList.toggle('mc-goi-thay',!ds.length);
    if(!ds.length){
      dang=null;
      $('mc-goi-ke').textContent=cau;
      $('mc-goi-moi').textContent='Chưa em nào làm đúng câu này';
      ten.textContent='Thầy chữa';
      giay.hidden=true;khac.hidden=true;
    }else{
      var daGoi=lichSu.filter(function(x){return x.dot===i}).map(function(x){return x.ten});
      var truoc=null;for(var k=lichSu.length-1;k>=0;k--){if(lichSu[k].dot!==i){truoc=lichSu[k].ten;break}}
      var j=chonEmGoi(ds.map(function(e){return e.ten}),[dang&&dang.dot===i?[dang.ten]:[],truoc?[truoc]:[],daGoi],Math.random());
      var e=ds[j];dang={dot:i,ten:e.ten};lichSu.push(dang);
      $('mc-goi-ke').textContent=(cau?cau+' · ':'')+ds.length+' em làm đúng';
      $('mc-goi-moi').textContent='Mời';
      ten.textContent=e.ten;ten.classList.remove('mc-goi-doi');void ten.offsetWidth;ten.classList.add('mc-goi-doi');
      giay.hidden=e.giay===null;giay.textContent=e.giay===null?'':'Làm đúng trong '+e.giay+' giây';
      khac.hidden=ds.length<2;
    }
    var moi=tam.hidden;tam.hidden=false;b.classList.add('mc-goi-mo');
    if(moi){var f=khac.hidden?$('mc-goi-dong'):khac;try{f.focus({preventScroll:true})}catch(x){}}
  }
  function dongGoi(){
    if(!tam||tam.hidden)return;
    tam.hidden=true;b.classList.remove('mc-goi-mo');dang=null;
    if(goiNut)try{goiNut.focus({preventScroll:true})}catch(x){}
  }
  window.__mcGoiChuaBai={mo:moGoi,dong:dongGoi,lichSu:function(){return lichSu.slice()}};
  document.addEventListener('click',function(e){
    var t=e.target&&e.target.closest?e.target:null;if(!t)return;
    if(t.closest('.mc-st-dau,#mc-st-nut')){e.preventDefault();doi();return}
    if(t.closest('#mc-goi-nut,#mc-goi-khac')){e.preventDefault();moGoi();return}
    if(t.closest('#mc-goi-dong')||t===tam){e.preventDefault();dongGoi()}
  });
  document.addEventListener('mc-vao-dot',dongGoi);
  window.addEventListener('keydown',function(e){
    if(e.target&&e.target.closest&&e.target.closest('input,textarea,select'))return;
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    var k=e.key,mo=tam&&!tam.hidden;
    if(mo&&k==='Escape'){e.preventDefault();e.stopImmediatePropagation();dongGoi();return}
    if(k==='l'||k==='L'){e.preventDefault();e.stopImmediatePropagation();moGoi();return}
    if(k==='h'||k==='H'){e.preventDefault();e.stopImmediatePropagation();doi();return}
    // tấm đang mở: Tab / Enter / Space dành cho hai nút của tấm (tờ chuẩn dùng Tab = tổng quan, Space = lật trang)
    if(mo&&(k==='Tab'||k==='Enter'||k===' ')){e.stopImmediatePropagation()}
  },true);
  dat(false);
})();`

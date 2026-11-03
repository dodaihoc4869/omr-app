# Bộ MẪU phong cách thầy chốt (hình «Cho 3,75 gam glycine … NaOH dư …») — dựng lại hình theo ĐÚNG kiểu này

Phong cách: tranh phẳng bo tròn, màu dịu; thuỷ tinh lavender nhạt có vệt sáng trắng; dung dịch màu đặc (xanh / lục / vàng); nắp xám tím; **bóng chân** là elip mờ dưới mỗi vật; mũi tên và dấu «+» màu tím nhạt, nét dày bo tròn; thẻ vàng nhạt cho đại lượng («3,75 g», «?»); nhãn chất bên dưới, chữ đậm. Mọi hình đều CÙNG gu này (không dùng nét đen mảnh kiểu ảnh scan). Lớp màu: `f-kinh` thuỷ tinh · `f-nap` nắp · `f-bong` bóng chân · `f-dd1` lục · `f-dd2` xanh · `f-dd3` vàng · `f-dd4` đỏ (dung dịch) · `f-muoi` trắng · `f-the` thẻ vàng nhạt + chữ `t-the` · `s-sang` vệt sáng (kèm stroke-width) · `s-mui` mũi tên / nét tím nhạt (stroke-width 5) · `t-dau` dấu «+» · chữ nhãn `t-chu t-dam`.

## Mẫu dụng cụ (toạ độ khung 330 × 129; dời bằng `<g transform="translate(x y)">`)
Bình tam giác (có dung dịch xanh + thẻ vàng):
```
<ellipse cx="62" cy="104" rx="40" ry="5" class="f-bong"/>
<path d="M50 14h24v8h-3v22l26 48a8 8 0 0 1-7 12H34a8 8 0 0 1-7-12l26-48V22h-3z" class="f-kinh"/>
<path d="M40 66h44l13 26a8 8 0 0 1-7 12H34a8 8 0 0 1-7-12z" class="f-dd2"/>
<path d="M58 30v18" class="s-sang" stroke-width="4"/>
<rect x="47" y="10" width="30" height="8" rx="4" class="f-nap"/>
<rect x="32" y="72" width="60" height="20" rx="10" class="f-the"/><text x="62" y="87" text-anchor="middle" class="t-the">3,75 g</text>
<text x="62" y="120" text-anchor="middle" class="t-chu t-dam">H₂NCH₂COOH</text>
```
Ống nghiệm (nhóm dời đến (150,6)):
```
<ellipse cx="14" cy="98" rx="18" ry="4" class="f-bong"/>
<path d="M4 8h20v76a10 10 0 0 1-20 0z" class="f-kinh"/>
<path d="M4 44h20v40a10 10 0 0 1-20 0z" class="f-dd2"/>
<rect x="0" y="2" width="28" height="8" rx="4" class="f-nap"/>
<path d="M10 18v18" class="s-sang" stroke-width="3.5"/>
```
Dấu cộng và mũi tên: `<text x="118" y="66" text-anchor="middle" class="t-dau">+</text>` · `<path d="M196 58h34m-10-9 10 9-10 9" class="s-mui" stroke-width="5"/>` (điều kiện / xúc tác: `<text x="213" y="44" text-anchor="middle" class="t-mui">FeBr₃</text>` TRÊN mũi tên, `t°` DƯỚI mũi tên).
Cốc có sản phẩm (nhóm dời đến (248,20)):
```
<ellipse cx="34" cy="84" rx="38" ry="5" class="f-bong"/>
<path d="M4 6h60l-6 70a8 8 0 0 1-8 7H18a8 8 0 0 1-8-7z" class="f-kinh"/>
<path d="M10 50h48l-2 26a8 8 0 0 1-8 7H20a8 8 0 0 1-8-7z" class="f-muoi"/>
<path d="M14 14v26" class="s-sang" stroke-width="4"/>
<rect x="18" y="20" width="32" height="20" rx="10" class="f-the"/><text x="34" y="35" text-anchor="middle" class="t-the">?</text>
```
Chỉ cần đổi hình dạng cho đúng dụng cụ trong ảnh gốc (đèn cồn, ống sinh hàn, phễu, bình cầu, ống dẫn khí, pin, điện cực…), GIỮ gu: bo tròn, bóng chân, vệt sáng, màu dịu. Mô hình phân tử: cầu tròn tô màu (C `f-chu`, H `f-nen`+viền `s-vien`, O `f-dd4`, N `f-dd2`, S `f-dd3`) nối bằng nét `s-mui` dày, chữ nguyên tố đậm trắng/đen nằm TRONG cầu.

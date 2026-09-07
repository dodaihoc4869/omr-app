// CSS CỦA BÁO CÁO GỬI PHỤ HUYNH — tách khỏi màn để hai bố cục dùng chung.
//
// Bản v2 (bố cục 10 mục, phụ huynh đã cầm link) và bản v3 (ba tầng) vẽ khác
// nhau nhưng dùng chung nền, thẻ, bảng và thẻ câu. Để hai bản mỗi bản một bản
// sao CSS là hai chỗ sửa, và sớm muộn lệch nhau.
//
// Màu lấy từ nhóm `--p-*` và `--p3-*` trong tokens.css, hai nhóm đó CỐ Ý không
// định nghĩa lại ở khối nền tối: báo cáo rời máy thầy, mở trên máy lạ, nên luôn
// phải là giấy trắng mực đen.
import { CSS_THE_CAU } from '../components/TheCauChiTiet'

export const CSS_BAO_CAO = `
.bc{min-height:100vh;background:var(--p-nen);color:var(--p-muc);font-family:var(--sans);
  -webkit-font-smoothing:antialiased;padding-bottom:56px;line-height:1.55}
.bc *{box-sizing:border-box}
.bc-trong{max-width:560px;margin:0 auto}

.bc-dau{position:relative;overflow:hidden;background:linear-gradient(135deg,var(--p-tim),var(--p-tim-2));
  padding:34px 22px 88px;color:var(--p-trang)}
.bc-dau::before,.bc-dau::after{content:'';position:absolute;width:300px;height:300px;border-radius:50%;
  filter:blur(60px);opacity:.4;will-change:transform}
.bc-dau::before{background:var(--p-trang);top:-150px;left:-100px;animation:bc-troi1 19s ease-in-out infinite}
.bc-dau::after{background:var(--p-tim);bottom:-180px;right:-120px;animation:bc-troi2 23s ease-in-out infinite}
@keyframes bc-troi1{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(60px,36px,0) scale(1.15)}}
@keyframes bc-troi2{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-50px,-32px,0) scale(1.22)}}
.bc-dau-noi{position:relative}
.bc-hieu{font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;opacity:.85}
.bc-ten{font-family:var(--serif);font-size:29px;font-weight:700;line-height:1.15;margin-top:10px}
.bc-phu{margin-top:8px;font-size:13px;opacity:.92}

.bc-the{margin:16px 14px 0;background:var(--p-giay);border-radius:20px;padding:20px 18px;border:1px solid var(--p-vien)}
.bc-the.noi{position:relative;z-index:1;margin-top:-64px;border:none;box-shadow:var(--p-bong)}
.bc-tieu{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--p-nhat)}
.bc-tieu-lon{font-family:var(--serif);font-size:19px;font-weight:700;margin-top:2px}

.bc-diem-hang{display:flex;align-items:center;gap:16px;margin-top:16px}
.bc-diem-dau{margin-top:0}
.bc-vong{position:relative;width:116px;height:116px;flex:0 0 auto}
.bc-vong svg{width:116px;height:116px;transform:rotate(-90deg)}
.bc-vong-in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.bc-so{font-family:var(--serif);font-size:32px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}
.bc-tren{font-size:10.5px;color:var(--p-mo);margin-top:3px}
.bc-canh{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}
.bc-nhan{display:inline-flex;align-items:center;align-self:flex-start;height:27px;padding:0 12px;border-radius:999px;
  font-size:12.5px;font-weight:700;background:var(--p-chim)}
.bc-doi{display:flex;justify-content:space-between;gap:10px;font-size:13px}
.bc-doi>span:first-child{color:var(--p-nhat)}
.bc-doi>span:last-child{font-weight:700;font-variant-numeric:tabular-nums}

.bc-dong{margin-top:13px}
.bc-dong:first-of-type{margin-top:12px}
.bc-dtren{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:13.5px}
.bc-dten{font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bc-dso{font-weight:700;font-variant-numeric:tabular-nums;flex:0 0 auto;font-size:12.5px}
.bc-ray{height:8px;border-radius:999px;background:var(--p-chim);margin-top:6px;overflow:hidden}
.bc-day{height:100%;border-radius:999px;width:0;transition:width 1s cubic-bezier(.22,.9,.28,1)}

.bc-o3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.bc-o{background:var(--p-chim);border-radius:12px;padding:11px 8px;text-align:center}
.bc-o-so{font-family:var(--serif);font-size:19px;font-weight:700;font-variant-numeric:tabular-nums}
.bc-o-ten{font-size:10.5px;color:var(--p-nhat);margin-top:3px;line-height:1.35}



.bc-tin{border-radius:14px;border:1px solid var(--p-vien);padding:13px 14px;margin-top:10px}
.bc-tin:first-of-type{margin-top:12px}
.bc-tin-nhan{font-family:var(--serif);font-size:15.5px;font-weight:700}
.bc-tin-so{font-size:13px;color:var(--p-nhat);margin-top:5px;line-height:1.6}
.bc-tin-khuyen{font-size:13.5px;margin-top:9px;line-height:1.62;background:var(--p-chim);border-radius:10px;padding:10px 11px}

.bc-soan{margin-top:12px}
.bc-soan-cd{font-size:12px;font-weight:700;color:var(--p-tim);letter-spacing:.02em}
.bc-soan-y{display:flex;gap:9px;font-size:13.5px;line-height:1.62;margin-top:7px}
.bc-soan-o{flex:0 0 auto;width:15px;height:15px;border:1.5px solid var(--p-mo);border-radius:4px;margin-top:3px}

.bc-viec{margin:16px 14px 0;background:var(--p-giay);border-radius:18px;padding:18px 18px 18px 20px;
  border:1px solid var(--p-vien);border-left:4px solid var(--p-tim)}
.bc-viec-chu{font-family:var(--serif);font-size:15.5px;line-height:1.62;margin-top:9px}
.bc-chan{margin:24px 16px 0;text-align:center;color:var(--p-mo);font-size:11.5px;line-height:1.75}
.bc-chan b{color:var(--p-nhat)}

.bc-vao{opacity:0;transform:translate3d(0,18px,0);transition:opacity .6s ease,transform .6s cubic-bezier(.22,.9,.28,1)}
.bc-vao.ra{opacity:1;transform:none}

/* NÚT NHẤP NHÁY. Hai lớp: chữ mờ dần rồi rõ lại, kèm một vòng sáng loang ra từ
   mép nút. Chỉ động vào opacity và transform nên không bắt trình duyệt tính
   lại bố cục — mượt cả trên điện thoại cũ của phụ huynh. */
.bc-nhay{position:relative;isolation:isolate;animation:bc-tho 1.5s ease-in-out infinite}
.bc-nhay::after{content:'';position:absolute;inset:0;border-radius:inherit;background:currentColor;
  z-index:-1;opacity:0;animation:bc-loang 1.5s ease-out infinite}
@keyframes bc-tho{0%,100%{opacity:1}50%{opacity:.72}}
@keyframes bc-loang{0%{opacity:.32;transform:scale(1)}70%,100%{opacity:0;transform:scale(1.08)}}

/* VI PHẠM — khối bằng chứng rời màn. */
.bc-vp{margin-top:14px}
.bc-vp-nut{width:100%;min-height:46px;border-radius:12px;border:1.5px solid var(--p-do);background:var(--p-giay);
  color:var(--p-do);font-family:var(--sans);font-size:14.5px;font-weight:700;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:8px;padding:0 12px}
.bc-vp-cham{width:9px;height:9px;border-radius:50%;background:currentColor;flex:0 0 auto}
.bc-vp-in{margin-top:11px;border:1px solid var(--p-vien);border-radius:12px;padding:13px 14px}
.bc-vp-so{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.bc-vp-hang{display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:7px 0;
  border-top:1px solid var(--p-vien);font-variant-numeric:tabular-nums}
.bc-vp-hang:first-of-type{border-top:none}
.bc-vp-noi{font-size:12.5px;color:var(--p-nhat);line-height:1.65;margin-top:10px}

.bc-nut-doi{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.bc-nut{flex:1 1 150px;min-height:46px;border-radius:12px;font-family:var(--sans);font-size:14px;font-weight:700;
  cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:0 12px;border:none}
.bc-nut.chinh{background:var(--p-tim);color:var(--p-trang)}
/* NÚT VÀNG (thầy chốt 04-09 tối): chữ đen trên nền hổ phách, tương phản cao
   hơn hẳn chữ trắng — nút này nhấp nháy nên phải đọc được ở mọi pha sáng. */
.bc-nut.vang{background:var(--p-cam);color:var(--p-muc)}
.bc-nut.vien{background:var(--p-giay);color:var(--p-tim);border:1.5px solid var(--p-tim)}
.bc-dang{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.bc-dang button{flex:1 1 90px;min-height:40px;border-radius:10px;border:none;font-family:var(--sans);font-size:13.5px;
  font-weight:700;background:var(--p-chim);color:var(--p-nhat)}
.bc-dang button[aria-checked="true"]{background:var(--p-tim);color:var(--p-trang)}
.bc-nut[disabled]{opacity:.55;cursor:default}

/* CHỌN SỐ CÂU cho con — thanh kéo 10..40. */
.bc-so{margin-top:12px;background:var(--p-chim);border-radius:12px;padding:12px 13px}
.bc-so-dau{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.bc-so-nhan{font-size:12.5px;color:var(--p-nhat)}
.bc-so-gia{font-family:var(--serif);font-size:21px;font-weight:700;font-variant-numeric:tabular-nums}
.bc-so input[type=range]{width:100%;margin-top:8px;accent-color:var(--p-cam);height:26px}
.bc-so-moc{display:flex;justify-content:space-between;font-size:11px;color:var(--p-mo);font-variant-numeric:tabular-nums}
.bc-so-vi{margin-top:4px;font-size:11px;line-height:1.5;color:var(--p-mo)}
.bc-so-canh{color:var(--p-cam)}
.bc-so-nhay{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
.bc-so-nhay button{min-height:32px;padding:0 12px;border:none;border-radius:999px;background:var(--p-giay);color:var(--p-muc);font-family:var(--sans);font-size:12px;font-weight:700}
.bc-so-nhay button[aria-pressed="true"]{background:var(--p-tim);color:var(--p-trang)}
.bc-so-do{border-left:3px solid var(--p-cam)}
.bc-so-do ul{margin:6px 0 0;padding-left:18px;font-size:11px;line-height:1.5;color:var(--p-mo)}

@media (prefers-reduced-motion:reduce){
  .bc-dau::before,.bc-dau::after{animation:none}
  .bc-vao{transition:none;opacity:1;transform:none}
  .bc-day,.bc-hop,.bc-mui{transition:none}
  .bc-nhay,.bc-nhay::after{animation:none}
}
` + CSS_THE_CAU

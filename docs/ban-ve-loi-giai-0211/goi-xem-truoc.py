# Gói 4 trang bản vẽ thành MỘT tệp HTML tự đủ (CSS, phông, JS nhúng sẵn) để xem trên điện thoại. Dùng: python3 goi-xem-truoc.py <ra.html>
import re,base64,os,sys
R='/home/user/omr-app/docs/'
B=R+'ban-ve-loi-giai-0211/'
def doc(p): return open(p,encoding='utf-8').read()
def css(p):
    s=doc(p); d=os.path.dirname(p)
    def imp(m): return css(os.path.normpath(os.path.join(d,m.group(1))))
    s=re.sub(r"@import url\('([^']+)'\);",imp,s)
    def font(m):
        f=os.path.normpath(os.path.join(d,m.group(1)))
        return "url('data:font/woff2;base64,"+base64.b64encode(open(f,'rb').read()).decode()+"')"
    s=re.sub(r"url\('([^']+\.woff2)'\)",font,s)
    return s
C=css(B+'lg.css')
# hỗ trợ data-theme: tách khối @media dark
def tach(s):
    out=[];i=0;dark=[]
    while True:
        j=s.find('@media (prefers-color-scheme: dark)',i)
        if j<0: out.append(s[i:]);break
        out.append(s[i:j]); k=s.index('{',j); dep=1; t=k+1
        while dep:
            if s[t]=='{':dep+=1
            elif s[t]=='}':dep-=1
            t+=1
        inner=s[k+1:t-1]
        out.append('@media (prefers-color-scheme: dark){'+inner.replace(":root[data-trong='hs']",":root[data-trong='hs']:not([data-theme='light'])")+'}')
        dark.append(inner.replace(":root[data-trong='hs']",":root[data-trong='hs'][data-theme='dark']"))
        i=t
    return ''.join(out)+'\n'+'\n'.join(dark)
C=tach(C)
C+="""
:root[data-trong='hs'][data-theme='dark']{color-scheme:dark}
body{background-color:var(--tr-nen)}
.lam{min-height:auto}
.thanh-tab{position:sticky;top:env(safe-area-inset-top,0px);z-index:20;padding:10px max(16px,env(safe-area-inset-left,0px)) 6px max(16px,env(safe-area-inset-right,0px));-webkit-backdrop-filter:var(--mo);backdrop-filter:var(--mo);background:var(--kinh)}
.thanh-tab .phan{max-width:620px;margin:0 auto}
.thanh-tab p{max-width:620px;margin:0 auto 8px;font-size:13.5px;font-weight:750;color:var(--tr-chu-2)}
a.nut{text-decoration:none}
"""
JS=''.join(doc(p)+';\n' for p in [R+'ban-ve-ban-sac-hs-0211/ve.js',R+'ban-ve-ban-sac-hs-0211/v2/kve.js'])
JS2=doc(B+'lg.js')+';\n'+doc(B+'mo-hinh.js')+';'
LINK={'Bài 1.C1 · Ester':'https://www.youtube.com/watch?v=OAV45qDm6vs','Bài 1.C1 · Cân bằng hoá học':'https://www.youtube.com/watch?v=INJFF24ePfU','Kĩ thuật giải bài toán sulfur':'https://www.youtube.com/watch?v=5aBoCq5Q6tk'}
def than(p,ten):
    s=doc(B+p)
    a=s.index('<div class="lam">'); b=s.index('<script')
    s=s[a:b]
    s=re.sub(r'<header class="lam-tren">.*?</header>','',s,flags=re.S)
    for k,v in LINK.items():
        if k in s: s=re.sub(r'(<b>'+re.escape(k)+r'</b>.*?)<button class="nut" data-l="kinh" type="button">Xem thầy giảng</button>', lambda m: m.group(1)+f'<a class="nut" data-l="kinh" href="{v}" target="_blank" rel="noopener">Xem thầy giảng</a>', s, flags=re.S)
    return f'<section id="v-{ten}" class="view">{s}</section>'
# thẻ nhớ: mặt trước có nút chấm sau khi lật
tn=than('the-nho-lat.html','the-nho').replace('<div class="the-lat" data-mo>','<div class="the-lat">')
V=than('p1-ester.html','phan-1')+than('p2-can-bang.html','phan-2')+than('p3-hieu-suat.html','phan-3')+tn
html=f'''<title>Lời giải Kính</title>
<meta name="claude:viewport-fit-sides" content="cover">
<script>document.documentElement.setAttribute('data-trong','hs')</script>
<style>{C}</style>
<div class="thanh-tab"><p>Bản vẽ chờ thầy chốt · dữ liệu mẫu · chạm vạch để nhảy bước</p><div class="phan kinh" role="tablist">
<button role="tab" data-v="phan-1">Phần I</button><button role="tab" data-v="phan-2">Phần II</button><button role="tab" data-v="phan-3">Phần III</button><button role="tab" data-v="the-nho">Thẻ nhớ</button></div></div>
{V}
<script>{JS}</script>
<script>
(function(){{const ds=['phan-1','phan-2','phan-3','the-nho'];
function hien(){{const h=(location.hash||'').slice(1);const v=ds.includes(h)?h:'phan-1';
for(const s of document.querySelectorAll('.view'))s.hidden=s.id!=='v-'+v;
for(const b of document.querySelectorAll('[data-v]'))b.setAttribute('aria-selected',String(b.dataset.v===v));window.scrollTo(0,0)}}
for(const b of document.querySelectorAll('[data-v]'))b.addEventListener('click',()=>{{location.hash=b.dataset.v;hien()}});
addEventListener('hashchange',hien);hien()}})();
</script>
<script>{JS2}
for (const t of document.querySelectorAll('.the-lat')) {{ const ms = [...t.querySelectorAll('.m')]; const h = Math.max(...ms.map((m) => m.scrollHeight)); ms.forEach((m) => (m.style.minHeight = h + 'px')) }}
</script>'''
o=sys.argv[1]; open(o,'w',encoding='utf-8').write(html); print(len(html))

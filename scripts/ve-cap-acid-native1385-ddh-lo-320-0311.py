"""Hai acid1385: giữ mạch phải16C và chú thích nguyên văn, không sửa theo tên."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='f9ea7bc1d087a80238f4fc802cf994e0192647705c4c750278d373051c3fad6f';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d):return f'<path d="{d}" fill="none" stroke="#111" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
b=path('M8 141L26 108L8 74L27 41H61L80 7H114L133 41H166L185 75L163 108L179 142H215L234 108L217 75L236 41H271L289 7H326L343 41H377L386 59')
b+=path('M17 74L33 47 M85 15H109 M163 48L176 75 M185 134H210 M226 75L240 48 M295 15H320')
b+=F.label(383,81,'COOH',26,anchor='start',fill='#111')
b+=path('M561 131L594 111L628 131L662 111L696 131L729 111V74L762 54L794 73L827 54L859 73L891 54L924 73L956 54L989 73L1016 54L1041 66 M736 78L763 62 M1012 56V30 M1019 55V30')
b+=F.label(1016,27,'O',26,fill='#111')+F.label(1044,81,'OH',26,anchor='start',fill='#111')
b+=F.label(31,182,'DHA (nhiệt độ nóng chảy - 44°C)',25,anchor='start',fill='#111',weight='dam')
b+=F.label(629,182,'Oleic acid (nhiệt độ nóng chảy 14°C)',25,anchor='start',fill='#111',weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1086" height="189" viewBox="0 0 1086 189"><title>Hai cấu trúc theo nguồn1385</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='cap-acid-native1385-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1385,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='LEFT21bareC+COOHfirstC=22C6CCdouble/RIGHT16bareC1CCdouble1COdouble2splitfeet/4Ototal/regularchemical2trueDAMuprightcaptions/DHA (nhiệt độ nóng chảy - 44°C)/Oleic acid (nhiệt độ nóng chảy 14°C)/literalASCIIhyphenspace/no18Cnormalization/noaddedH-CH3-nums-answer/noalias1145')
(K/'cau-truc-cap-acid-native1385-ddh-lo-320-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))

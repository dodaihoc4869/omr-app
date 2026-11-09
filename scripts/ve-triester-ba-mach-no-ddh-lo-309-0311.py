"""Nguồn1342: ba mạch ester no, đếm riêng từng đỉnh theo ảnh gốc."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='f302843ee940c3a0f766906162edfdbeeece05e56a255b60a1b60f8463cdb990';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
v=[[(122,78),(154,60),(187,78),(220,60),(253,78),(286,60),(319,78),(352,60),(385,78),(418,60),(451,78),(484,60),(517,78),(550,60),(583,78),(616,60),(649,78),(679,60)],[(222,174),(253,191),(286,173),(319,191),(352,173),(385,191),(418,173),(451,191),(484,173),(517,191),(550,173),(583,191),(616,173),(649,191),(682,173),(715,191),(748,173),(779,191)],[(90,249),(90,286),(123,304),(156,286),(189,304),(222,286),(255,304),(288,286),(321,304),(354,286),(387,304),(420,286),(453,304),(486,286),(519,304),(552,286),(585,304),(616,286)]]
assert all(len(a)==18 for a in v)
def path(d):return '<path d="'+d+'" fill="none" stroke="#202020" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>'
b=''.join(path('M'+'L'.join(f'{x} {y}'for x,y in a))for a in v)
b+=path('M122 78V103 M135 124L154 135V174L122 192V216 M154 174L177 186 M202 186L222 174 M111 237L90 249')
# Hai chân carbonyl gặp hai tia lân cận như bản in, không thêm cầu ngang.
b+=path('M100 70L121 80 M105 64L125 76 M217 149V177 M224 149V175 M68 241L89 251 M73 235L93 247')
for x,y in [(90,72),(123,128),(222,147),(190,203),(123,241),(58,241)]:b+=F.label(x,y,'O',28,fill='#202020')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="820" height="345" viewBox="0 0 820 345"><title>Ba mạch ester theo nguồn1342</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='triester-ba-mach-no-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1342,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3acyl18bareCeach+3bareglycerolC=57C6O/3COdouble2splitfeetEACH/0CCdouble/3freeRIGHTends/bottomfirstCCvertical/allthinregularDDH/noaddedH-CH2-nums-stereo-name-caption-answer')
(K/'cau-truc-triester-ba-mach-no-ddh-lo-309-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))

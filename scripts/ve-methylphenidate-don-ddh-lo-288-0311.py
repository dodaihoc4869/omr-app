"""Nguồn1074: cấu tạo riêng, giữ ClH₂N không điện tích và chú thích đậm nghiêng."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='c182c74e0e86373e93c3478f643f86973961e4ff9ee6f8bceb1b22829b581c63';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M159 114L124 134V175L159 196L194 175V134Z M159 123L131 139 M187 139V170 M159 187L131 171 M194 134L227 114L262 134L298 114L335 134V175L298 196L275 183 M262 134V154 M227 114V80" fill="none" stroke="#252440" stroke-width="2.1" stroke-linejoin="round"/>'
b+=F.label(227-F.advance('C',24)/2,69,'COOCH₃',24,'start')
b+=F.label(262+F.advance('N',24)/2,187,'ClH₂N',24,'end')
y=234;b+=f'<g transform="translate({math.tan(math.radians(10))*y:.5f} 0) skewX(-10)">'+F.label(224,y,'Methylphenidate hydrochloride',22,weight='dam')+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="448" height="290" viewBox="0 0 448 290"><title>Cấu tạo theo nguồn methylphenidate hydrochloride</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='methylphenidate-don-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1074,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='1phenyl3INNERdoubles+1piperidine5C1N/14C2O1N1Cl/COOCH3FIRSTCanchor/ClH2NliteralNanchorNOcharge/regularchemical-labels/captionactualDAMitalicuppercaseMethylphenidate hydrochloride/noalias118777/noaddedstereo-bond-to-Cl-charge-answer.')
(K/'cau-truc-methylphenidate-don-ddh-lo-288-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)

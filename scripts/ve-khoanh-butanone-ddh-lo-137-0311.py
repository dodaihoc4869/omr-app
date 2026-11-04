"""Giữ ba kiểu highlight và ba nhãn của nguồn; ellipse C cắt ở mép như ảnh gốc."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-molecule-lo-130.json').read_text())if r['i']==568)
b='<defs><clipPath id="crop"><rect width="300" height="175"/></clipPath></defs><g transform="translate(40 40) scale(4)"><g clip-path="url(#crop)"><rect x="8" y="49" width="190" height="126" rx="20" fill="#ffe79c"/><ellipse cx="61" cy="64" rx="54" ry="62" fill="none" stroke="#aa2828" stroke-width="2.4" stroke-dasharray=".1 4.5" stroke-linecap="round"/><ellipse cx="212" cy="112" rx="84" ry="80" fill="none" stroke="#aa2828" stroke-width="2.5" stroke-dasharray="12 7"/>'
b+=F.label(13,93,'C₂H₅',38,'start')+F.label(164,93,'C',38)+F.label(218,93,'CH₃',38,'start')+F.label(164,160,'O',38)
b+='<path d="M114 80H142M185 80H211M159 100V127M167 100V127" fill="none" stroke="#252440" stroke-width="2.4"/>'
for x,y,t in[(36,160,'(A)'),(60,32,'(B)'),(244,158,'(C)')]:b+=F.label(x,y,t,23,weight='dam')
b+='</g></g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="780" viewBox="0 0 1280 780"><title>Ba nhóm nguyên tử được đánh dấu trong butanone</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='butanone-khoanh-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap',ghiChuDung='A nềnvàngbo gócbaoC2H5COkhôngCH3;BovalCHẤMđỏC2H5;CovalNÉTĐỨTđỏCOCH3cắtởmépdướinhưsource.3nhãnđậmthậtDDH/khôngcharge.')
(M/'cau-truc-butanone-ddh-lo-137-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))

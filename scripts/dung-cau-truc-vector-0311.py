"""Dựng SVG hóa học từ cấu trúc đã đọc ảnh nguồn; kết quả luôn chờ soát bản vẽ độc lập.
python scripts/dung-cau-truc-vector-0311.py <tệp dữ liệu JSON>
"""
from pathlib import Path
import sys,json,hashlib,html,re,math,xml.etree.ElementTree as ET
from rdkit import Chem,rdBase
from rdkit.Chem import rdMolDescriptors
from rdkit.Chem.Draw import rdMolDraw2D
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';S=G/'docs/hinh-vector-0311/nguon'
A=sorted(json.loads((S/'kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);BY_HASH={a['hash']:a for a in A}
def special(kind):
 def text(x,y,s,anchor='middle'):return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="DejaVu Sans,Arial,sans-serif" font-size="34" fill="#252440">{s}</text>'
 def line(x,y,xx,yy):return f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round"/>'
 if kind=='glutamic-cross':
  b=''.join(text(x,232,t)for x,t in [(120,'HO₂C'),(300,'CH₂'),(480,'CH₂'),(650,'C'),(800,'CO₂H')])
  b+=''.join(line(x,220,xx,220)for x,xx in [(169,259),(341,439),(522,630),(671,745)])
  b+=text(650,112,'NH₂')+line(650,130,650,190)+text(650,352,'H')+line(650,245,650,310)
 elif kind=='alkyl12-sulfonic':
  pts=[(550,220),(500,133),(400,133),(350,220),(400,307),(500,307)];b=''
  for i in range(6):b+=line(*pts[i],*pts[(i+1)%6])
  inner=[(450+(x-450)*.8,220+(y-220)*.8)for x,y in pts]
  for i in [1,3,5]:b+=line(*inner[i],*inner[(i+1)%6])
  b+=text(40,232,'CH₃[CH₂]₁₁','start')+line(250,220,350,220)+line(550,220,625,220)+text(650,232,'S')
  b+=text(650,112,'OH')+line(650,130,650,195)+text(775,232,'O')+line(675,215,745,215)+line(675,225,745,225)
  b+=text(650,332,'O')+line(645,245,645,292)+line(655,245,655,292)
 else:raise ValueError('Chưa có cách dựng đặc biệt '+kind)
 return '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="400" viewBox="0 0 900 400"><title>Biểu diễn cấu tạo theo hình nguồn</title>'+b+'</svg>'
def build(source):
 results=[]
 for row in source:
  r=dict(row)
  try:
   if r.get('tamGiu'):
    r['trangThai']='can-soat-dang-bieu-dien';results.append(r);continue
   if r['hash']not in BY_HASH:raise ValueError('Không tìm thấy hash nguồn đã đọc')
   params=Chem.SmilesParserParams();params.removeHs=not r.get('giuHTuongMinh',False)
   mol=Chem.MolFromSmiles(r['smiles'],params)
   if mol is None:raise ValueError('Cấu trúc không qua kiểm hóa trị của RDKit')
   # Mọi chỉ định lập thể/đồng vị/điện tích trong dữ liệu đọc nguồn được giữ.
   width=720 if mol.GetNumHeavyAtoms()>20 else 600;height=340
   d=rdMolDraw2D.MolDraw2DSVG(width,height);o=d.drawOptions()
   o.clearBackground=False;o.setAtomPalette({i:(37/255,36/255,64/255)for i in range(1,119)})
   o.bondLineWidth=2.5;o.minFontSize=20;o.maxFontSize=30;o.padding=.12;o.legendFontSize=22;o.legendFraction=.15
   o.setLegendColour((8/255,127/255,142/255))
   legend='\n'.join(r.get('caption',[]))
   rdMolDraw2D.PrepareAndDrawMolecule(d,mol,legend=legend)
   d.FinishDrawing();svg=d.GetDrawingText().replace("encoding='iso-8859-1'", "encoding='UTF-8'")
   if r.get('vongThomDangTron'):
    ns='http://www.w3.org/2000/svg';ET.register_namespace('',ns);root=ET.fromstring(svg)
    for ring in mol.GetRingInfo().AtomRings():
     if len(ring)!=6 or not all(mol.GetAtomWithIdx(a).GetIsAromatic() and mol.GetAtomWithIdx(a).GetAtomicNum()==6 for a in ring):continue
     bonds=[mol.GetBondBetweenAtoms(ring[k],ring[(k+1)%6]).GetIdx() for k in range(6)]
     for bi in bonds:
      paths=[x for x in root if x.tag.endswith('path') and re.match(rf'^bond-{bi}(?: |$)',x.attrib.get('class',''))]
      if len(paths)>1:
       def length(p):
        v=[float(x)for x in re.findall(r'-?\d+(?:\.\d+)?',p.attrib.get('d',''))]
        return math.hypot(v[-2]-v[0],v[-1]-v[1])if len(v)>=4 else 0
       keep=max(paths,key=length)
       for p in paths:
        if p is not keep:root.remove(p)
     xy=[d.GetDrawCoords(a)for a in ring];cx=sum(p.x for p in xy)/6;cy=sum(p.y for p in xy)/6;radius=sum(math.hypot(p.x-cx,p.y-cy)for p in xy)/6*.6
     ET.SubElement(root,'{'+ns+'}circle',{'cx':f'{cx:.2f}','cy':f'{cy:.2f}','r':f'{radius:.2f}','fill':'none','stroke':'#252440','stroke-width':'2.5'})
    svg=ET.tostring(root,encoding='unicode')
   at=svg.find('>',svg.find('<svg'))+1;svg=svg[:at]+'<title>Công thức cấu tạo theo hình nguồn</title>'+svg[at:]
   if r['smiles']=='[H]O[H]':
    svg='<svg xmlns="http://www.w3.org/2000/svg" width="300" height="110" viewBox="0 0 300 110"><title>Liên kết trong phân tử nước</title><g fill="#252440" font-family="DejaVu Sans,Arial,sans-serif" font-size="32" text-anchor="middle"><text x="45" y="66">H</text><text x="150" y="66">O</text><text x="255" y="66">H</text></g><path d="M65 55H125M175 55H235" stroke="#252440" stroke-width="2.5"/></svg>'
   if r.get('bieuThucChu'):
    svg='<svg xmlns="http://www.w3.org/2000/svg" width="660" height="110" viewBox="0 0 660 110"><title>Biểu thức cấu tạo theo hình nguồn</title><text x="24" y="68" font-family="DejaVu Sans,Arial,sans-serif" font-size="32" fill="#252440">'+html.escape(r['bieuThucChu'])+'</text></svg>'
   if r.get('kieuDacBiet'):svg=special(r['kieuDacBiet'])
   b=svg.encode();digest=hashlib.sha256(b).hexdigest();fn='cau-truc-'+digest+'.svg';(M/fn).write_bytes(b)
   r.update(svg=fn,hashSvg=digest,byteSvg=len(b),smilesChuan=Chem.MolToSmiles(mol),congThuc=rdMolDescriptors.CalcMolFormula(mol),soNguyenTuNang=mol.GetNumHeavyAtoms(),rdkit=rdBase.rdkitVersion,trangThai='cho-soat-doc-lap')
  except Exception as e:r.update(trangThai='loi-dung',loi=str(e))
  results.append(r)
 return results
if __name__=='__main__':
 p=Path(sys.argv[1]);r=build(json.loads(p.read_text()));out=p.with_name(p.stem+'-ban-dung.json');out.write_text(json.dumps(r,ensure_ascii=False,indent=2));print('Đã dựng',sum(a['trangThai']=='cho-soat-doc-lap'for a in r),'/',len(r),'hình; chờ so nguồn từng bản mới.',out)

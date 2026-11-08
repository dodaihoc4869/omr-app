"""Cổng hồi quy chỉ cho năm chữ NAamr; không tự duyệt cả font hoặc hình vẽ."""
from pathlib import Path
import argparse,hashlib,json,sys,platform
from importlib.metadata import version
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
try:
 import pathops
except ImportError:
 raise SystemExit('Cần skia-pathops để kiểm đường bao thật; không được bỏ qua cổng này khi thiếu thư viện.')
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--font-dir',type=Path,default=Path(__file__).resolve().parents[1]/'src/styles/phong-ddh');p.add_argument('--report',type=Path);a=p.parse_args()
# N/m/r không có vùng rỗng; A/a có đúng một lòng chữ. Chuẩn hoá winding
# trước khi đếm để phát hiện vòng kín sinh bởi nét tự cắt, không lọc diện tích.
expected={'N':1,'A':2,'a':2,'m':1,'r':1};rows=[]
for weight in ['de','dam']:
 file=a.font_dir/f'ddh-rounded-{weight}-latin.woff2';f=TTFont(file);g=f['glyf'];cm=f.getBestCmap();sha=hashlib.sha256(file.read_bytes()).hexdigest()
 for char,count in expected.items():
  shape=pathops.Path();g[cm[ord(char)]].draw(shape.getPen(),g);shape.simplify(fix_winding=True);pen=RecordingPen();shape.draw(pen);actual=sum(op=='moveTo' for op,_ in pen.value)
  rows.append(dict(weight=weight,char=char,file=str(file),sha256=sha,expectedContours=count,actualContours=actual,passKnownRegression=actual==count))
out=dict(dependencyVersions=dict(python=platform.python_version(),fonttools=version('fonttools'),skia_pathops=version('skia-pathops')),knownRegressionGatePass=all(r['passKnownRegression']for r in rows),cases=rows,unresolvedFontGlyphsEachWeight=['Ẫ','Ậ','Ẳ','Ẵ','Ặ'],gioiHan='Chỉ 10 ca NAamr từ WOFF2 thật; không tự duyệt toàn font/corpus hay thay soát DOM/SVG độc lập. Không dùng ngưỡng diện tích.')
if a.report:a.report.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(knownRegressionGatePass=out['knownRegressionGatePass'],cases=len(rows),failures=[dict(weight=r['weight'],char=r['char'],contours=r['actualContours'])for r in rows if not r['passKnownRegression']]),ensure_ascii=False));sys.exit(0 if out['knownRegressionGatePass'] else 1)

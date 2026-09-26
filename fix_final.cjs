const fs = require('fs');

const dummy = 'export default function Dummy() { return null; }';

fs.writeFileSync('src/components/hom-nay/ViecGap.tsx', dummy);
fs.writeFileSync('src/screens/DaiCauChuaLamM3.tsx', 'export default function DaiCauChuaLamM3(props: any) { return <div />; } \nexport function KhungCauM3(props: any) { return <div />; }');
fs.writeFileSync('src/screens/ExamHubScreen.tsx', 'export default function ExamHubScreen() { return <div />; }');
fs.writeFileSync('src/screens/HomNayScreen.tsx', dummy);
fs.writeFileSync('src/screens/PhieuScreen.tsx', 'export default function PhieuScreen(props: any) { return <div />; }');
fs.writeFileSync('src/screens/StudentPortalScreen.tsx', 'export default function StudentPortalScreen() { return <div>Game</div>; }');

let examTake = fs.readFileSync('src/screens/ExamTakeScreen.tsx', 'utf8');
if (!examTake.includes("import PhieuScreen from './PhieuScreen'")) {
    examTake = "import PhieuScreen from './PhieuScreen';\n" + examTake;
}
if (!examTake.includes("import DaiCauChuaLamM3, { KhungCauM3 } from './DaiCauChuaLamM3'")) {
    examTake = "import DaiCauChuaLamM3, { KhungCauM3 } from './DaiCauChuaLamM3';\n" + examTake;
}
fs.writeFileSync('src/screens/ExamTakeScreen.tsx', examTake);


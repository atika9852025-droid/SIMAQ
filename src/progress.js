/** SIMAQ: persentase berdasarkan cakupan AYAT yang benar-benar berstatus tuntas.
 * Catatan: pencapaian juz dihitung hanya jika ada setoran juz tuntas.
 * Target kelas digunakan jika cocok, bukan mengganti nilai jumlah surah siswa.
 */
export function mergeIntervals(intervals, maxAyah) {
  const clean = intervals.map(([a,b]) => [Math.max(1,Number(a)),Math.min(maxAyah,Number(b))])
    .filter(([a,b]) => Number.isFinite(a)&&Number.isFinite(b)&&a<=b).sort((x,y)=>x[0]-y[0]);
  const merged=[];
  for(const [a,b] of clean){const last=merged[merged.length-1];if(last&&a<=last[1]+1) last[1]=Math.max(last[1],b);else merged.push([a,b]);}
  return merged;
}
export function intervalOverlap(merged, start, end) {
  return merged.reduce((sum,[a,b])=>sum+Math.max(0,Math.min(b,end)-Math.max(a,start)+1),0);
}
function normalizedClass(value){const text=String(value??'').trim().toUpperCase();return ({I:'1',II:'2',III:'3',IV:'4',V:'5',VI:'6',VII:'7',VIII:'8',IX:'9',X:'10',XI:'11',XII:'12'})[text]||text;}
export function studentProgress(student, targets, records, surahs) {
  const matching=(targets||[]).filter(t=>t.school_id===student.school_id&&(!t.class_name||normalizedClass(t.class_name)===normalizedClass(student.class_name)));
  const eligible=(records||[]).filter(r=>r.student_id===student.id&&r.status==='tuntas');
  const known=new Map((surahs||[]).map(s=>[Number(s.number),Number(s.numberOfAyahs)]));
  const bySurah=new Map();
  for(const r of eligible){
    const num=Number(r.surah_number);if(!num||!known.has(num))continue;
    const max=known.get(num),from=Number(r.ayah_from||1),to=Number(r.ayah_to||(r.mode==='surah'?max:0));
    if(!bySurah.has(num))bySurah.set(num,[]);
    bySurah.get(num).push([from,to]);
  }
  const coverage=(num,a,b)=>intervalOverlap(mergeIntervals(bySurah.get(num)||[],known.get(num)||0),a,b);
  let earned=0,total=0,unknown=0;
  for(const t of matching){
    if(t.mode==='juz') {total++;if(eligible.some(r=>r.mode==='juz'&&Number(r.juz_number)===Number(t.juz_number)))earned++;continue;}
    const num=Number(t.surah_number),max=known.get(num);
    if(!max){unknown++;continue;}
    const start=t.mode==='ayat'?Number(t.ayah_from):1,end=t.mode==='ayat'?Number(t.ayah_to):max;
    if(!(start>=1&&end>=start&&end<=max)){unknown++;continue;}
    total+=end-start+1;earned+=coverage(num,start,end);
  }
  if(matching.length){
    if(!total)return {done:0,target:0,pct:null,label:'Menunggu data surah',detail:'Katalog surah/target belum tersedia'};
    return {done:earned,target:total,pct:Math.min(100,Math.round(100*earned/total)),label:`${earned}/${total} unit target tuntas`,detail:unknown?'Sebagian target belum bisa dihitung':'Capaian ayat; target juz hanya dinilai tuntas penuh'};
  }
  // Tanpa target terstruktur, tampilkan pencapaian surah LENGKAP, bukan surah parsial.
  const done=[...bySurah.keys()].filter(num=>coverage(num,1,known.get(num))===known.get(num)).length;
  const target=Math.max(1,Number(student.target_surahs)||10);
  return {done,target,pct:known.size?Math.min(100,Math.round(done/target*100)):null,label:`${done}/${target} surah lengkap`,detail:'Berdasarkan target jumlah surah siswa'};
}

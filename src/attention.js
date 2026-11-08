// SIMAQ: target per jenjang; bukan akumulasi antarjenjang.
export const PROGRAMS={
 SD:{juz:[30],grades:{1:15,2:30,3:45,4:65,5:85,6:100}},
 SMP:{juz:[30,29],grades:{7:50,8:75,9:100}},
 SMA:{juz:[29,1],grades:{10:50,11:75,12:100}}
};
const roman={I:1,II:2,III:3,IV:4,V:5,VI:6,VII:7,VIII:8,IX:9,X:10,XI:11,XII:12};
export function gradeOf(value){const txt=String(value??'').trim().toUpperCase();const lead=txt.match(/^(\d{1,2}|XII|XI|IX|VIII|VII|VI|IV|III|II|I|V|X)(?:\b|\s|[-_.])/);return lead?Number(lead[1])||roman[lead[1]]:null;}
export function levelOf(school){const v=String(school?.level||'').toUpperCase();if(['SD','MI'].includes(v))return 'SD';if(['SMP','MTS'].includes(v))return 'SMP';if(['SMA','MA','SMK'].includes(v))return 'SMA';return null;}
export function programParts(juz){if(juz===30)return Array.from({length:37},(_,i)=>[i+78,1,null]);if(juz===29)return Array.from({length:11},(_,i)=>[i+67,1,null]);if(juz===1)return [[1,1,7],[2,1,141]];return []}
function merge(intervals,max){const sorted=intervals.map(([a,b])=>[Math.max(1,+a),Math.min(max,+b)]).filter(([a,b])=>a<=b&&Number.isFinite(a)&&Number.isFinite(b)).sort((a,b)=>a[0]-b[0]);const out=[];for(const [a,b] of sorted){const last=out[out.length-1];if(last&&a<=last[1]+1)last[1]=Math.max(last[1],b);else out.push([a,b])}return out;}
export function attainment(student,school,records,surahs){
 const level=levelOf(school),g=gradeOf(student.class_name),program=PROGRAMS[level];
 if(!program||!program.grades[g])return {valid:false,reason:'Kelas/jenjang belum dikenali'};
 const nums=new Map(surahs.map(x=>[+x.number,+x.numberOfAyahs]));
 const pieces=program.juz.flatMap(j=>programParts(j).map(([num,start,end])=>({num,start,end,j})));
 if(pieces.some(p=>!nums.has(p.num)))return {valid:false,reason:'Katalog Al-Qur’an belum lengkap'};
 const bySurah=new Map(),completeJuz=new Set();
 for(const r of records){if(r.student_id!==student.id||r.status!=='tuntas')continue;
  if(r.mode==='juz'&&program.juz.includes(+r.juz_number)){completeJuz.add(+r.juz_number);continue;}
  const num=+r.surah_number,max=nums.get(num);if(!max)continue;
  const from=+r.ayah_from||1,to=+r.ayah_to||(r.mode==='surah'?max:0);
  if(!bySurah.has(num))bySurah.set(num,[]);bySurah.get(num).push([from,to]);
 }
 let achieved=0,total=0;
 for(const p of pieces){const start=p.start,end=p.end??nums.get(p.num);total+=end-start+1;
  if(completeJuz.has(p.j)){achieved+=end-start+1;continue;}
  const covered=merge(bySurah.get(p.num)||[],nums.get(p.num));
  for(const [a,b] of covered) achieved+=Math.max(0,Math.min(b,end)-Math.max(a,start)+1);
 }
 const weights=Object.fromEntries(program.juz.map(j=>[j,pieces.filter(p=>p.j===j).reduce((n,p)=>n+(p.end??nums.get(p.num))-p.start+1,0)]));
 let endpoints=program.grades;
 if(level==='SMP')endpoints={7:100*weights[30]/total,8:100*(weights[30]+0.5*weights[29])/total,9:100};
 if(level==='SMA')endpoints={10:100*weights[29]/total,11:100*(weights[29]+0.5*weights[1])/total,12:100};
 return {valid:true,level,grade:g,achieved,total,actual:total?achieved/total*100:0,graduate:endpoints[g],endpoints,juz:program.juz};
}
export function expectedAtGrade(level,grade,semester){const grades=PROGRAMS[level]?.grades;if(!grades||!grades[grade])return null;const prev=grades[grade-1]??0;return semester==='ganjil'?prev+(grades[grade]-prev)*0.5:grades[grade]}
export function evaluateStudent(result,semester){if(!result.valid)return {...result,status:'unknown',expected:null,ratio:null};const current=result.endpoints[result.grade],previous=result.endpoints[result.grade-1]??0,expected=semester==='ganjil'?previous+(current-previous)*0.5:current,ratio=expected>0?result.actual/expected*100:100;return {...result,expected,ratio,status:ratio>=85?'green':ratio>=65?'yellow':'red'};}
export function aggregate(students,schools,records,surahs,semester){
 const map=new Map(schools.map(s=>[s.id,s]));const groups=new Map();
 for(const s of students){const school=map.get(s.school_id);if(!school)continue;const assessed=evaluateStudent(attainment(s,school,records,surahs),semester);const level=levelOf(school),grade=gradeOf(s.class_name),key=[s.school_id,grade??'?',s.class_name].join('|');
  if(!groups.has(key))groups.set(key,{key,school:school.name,school_id:school.id,level,grade,klass:String(s.class_name),students:[],counts:{green:0,yellow:0,red:0,unknown:0}});
  const group=groups.get(key);group.students.push({...assessed,id:s.id,name:s.full_name});group.counts[assessed.status]++;
 }
 return [...groups.values()].map(g=>{const valid=g.students.filter(s=>s.valid);const actual=valid.length?valid.reduce((t,s)=>t+s.actual,0)/valid.length:null;const expected=valid.length?valid.reduce((t,s)=>t+s.expected,0)/valid.length:null;const ratio=valid.length?valid.reduce((t,s)=>t+s.ratio,0)/valid.length:null;return {...g,n:g.students.length,actual,expected,ratio,flag:g.counts.unknown?'unknown':g.counts.red?'red':g.counts.yellow?'yellow':'green'} }).sort((a,b)=>a.level?.localeCompare(b.level)||a.school.localeCompare(b.school)||(a.grade??0)-(b.grade??0));
}

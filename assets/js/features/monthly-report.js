/* First-pass Monthly Student Progress Report.
 * This is intentionally sample-data only: it is a visual prototype and does
 * not read or write the ERP database until the design is approved.
 */
const MONTHLY_SAMPLE = {
  student: 'Rahul Kumar', grade: 'Grade 7', section: 'B', school: 'St. Joseph School', month: 'July 2026',
  summary: 'Rahul has shown steady improvement this month. Science is his strongest subject, while English needs additional practice.',
  kpis: [['Overall Average','82%',''],['Tests Conducted','18',''],['Improvement','+7%',''],['Exam Attendance','100%',''],['Focus Subject','English',''],['Discipline','★★★★☆','']],
  subjects: [['Science','4','84%','72%','95%','Above class'],['Math','3','78%','74%','93%','Good'],['English','4','68%','71%','91%','Needs practice'],['SST','3','88%','75%','97%','Excellent'],['Hindi','2','82%','77%','94%','Good']],
  trend: {labels:['Science','Math','English','SST','Hindi'], student:[84,78,68,88,82], klass:[72,74,71,75,77], topper:[95,93,91,97,94]},
  highlights:[['Best performance','Science','Chapter 3','96%','best'],['Needs revision','English','Chapter 2','61%','needs'],['Most improved','Math','Chapter 4','+18%','improved']],
  insight:['Science performance has improved consistently.','English grammar needs more practice.','Homework submission is regular.','Continue attempting more chapter tests.'],
  plan:['Practice English reading','Revise Chapter 2','Solve weekly worksheets','Attempt more practice tests']
};
const escMonthly=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function monthlyTrendSvg(){
  const t=MONTHLY_SAMPLE.trend, w=760,h=230,p={l:42,r:18,t:18,b:34}, max=100,min=0;
  const x=i=>p.l+i*(w-p.l-p.r)/(t.labels.length-1), y=v=>p.t+(max-v)*(h-p.t-p.b)/(max-min);
  const line=(arr,color,dash='')=>`<polyline points="${arr.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="3" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
  const dots=(arr,color)=>arr.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${color}"/>`).join('');
  return `<svg class="monthly-trend-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Student, class and topper growth trend"><g class="grid">${[0,25,50,75,100].map(v=>`<line x1="${p.l}" x2="${w-p.r}" y1="${y(v)}" y2="${y(v)}"/><text x="${p.l-9}" y="${y(v)+4}" text-anchor="end">${v}%</text>`).join('')}</g>${line(t.topper,'#ed9a28','5 5')}${line(t.klass,'#347fd1','5 5')}${line(t.student,'#087454')}${dots(t.topper,'#ed9a28')}${dots(t.klass,'#347fd1')}${dots(t.student,'#087454')}${t.labels.map((l,i)=>`<text x="${x(i)}" y="${h-8}" text-anchor="middle">${l}</text>`).join('')}</svg>`;
}
function monthlyReport(){
  setCrumb('Monthly progress');
  const d=MONTHLY_SAMPLE;
  document.getElementById('app').innerHTML=`<main class="monthly-report" id="monthlyReport">
    <div class="monthly-actions"><button class="primary" onclick="printMonthlyReport()">🖨 Print / Save as PDF</button></div>
    <header class="monthly-cover"><div class="monthly-brand"><img src="assets/images/aveti-logo.png" alt="Aveti Learning Tuition Center"><div><div class="monthly-eyebrow">AVETI LEARNING TUITION CENTER</div><h1>MONTHLY PROGRESS REPORT</h1></div></div><div class="monthly-watermark">A</div></header>
    <section class="monthly-student-meta"><div><span>Student name</span><b>${d.student}</b></div><div><span>Learning at</span><b>Aveti Learning Tuition Center</b></div><div><span>Class</span><b>${d.grade}</b></div><div><span>Section</span><b>${d.section}</b></div><div><span>School</span><b>${d.school}</b></div><div><span>Report month</span><b>${d.month}</b></div></section>
    <section class="monthly-summary"><h2>Executive summary</h2><p>${d.summary}</p></section>
    <section class="monthly-kpis">${d.kpis.map((k,i)=>`<article class="monthly-kpi kpi-${i}"><span class="monthly-kpi-icon">${['▥','✓','↗','◉','◆','★'][i]}</span><div><small>${k[0]}</small><strong>${k[1]}</strong></div></article>`).join('')}</section>
    <section class="monthly-panel"><div class="monthly-section-title"><h2>Subject performance summary</h2><span>July 2026</span></div><div class="monthly-table-wrap"><table class="monthly-subject-table"><thead><tr><th>Subject</th><th>Tests</th><th>Student average</th><th>Class average</th><th>Topper average</th><th>Status</th></tr></thead><tbody>${d.subjects.map(s=>`<tr><td><b>${s[0]}</b></td><td>${s[1]}</td><td>${s[2]}</td><td>${s[3]}</td><td>${s[4]}</td><td><span class="status-${s[5].replace(' ','-')}">${s[5]}</span></td></tr>`).join('')}</tbody></table></div></section>
    <section class="monthly-panel monthly-chart-panel"><div class="monthly-section-title"><h2>Student vs Class vs Topper</h2><div class="monthly-legend"><span class="student-key">Student</span><span class="class-key">Class average</span><span class="topper-key">Topper</span></div></div>${monthlyTrendSvg()}</section>
    <section class="monthly-highlights">${d.highlights.map(h=>`<article class="highlight-${h[4]}"><small>${h[0]}</small><b>${h[1]}</b><span>${h[2]}</span><strong>${h[3]}</strong></article>`).join('')}</section>
    <section class="monthly-panel monthly-insight-plan"><div><h2>Teacher insight</h2><ul>${d.insight.map(x=>`<li>${x}</li>`).join('')}</ul></div><div><h2>Next month plan</h2><div class="monthly-plan-grid">${d.plan.map((x,i)=>`<div><span>${i+1}</span><b>${x}</b></div>`).join('')}</div></div></section>
    <div class="monthly-page-break"></div>
    <section class="monthly-page-two"><h2>Overall summary</h2><div class="monthly-overall">${[['Overall progress','Excellent','good'],['Improvement','Good','good'],['Consistency','Very good','best'],['Discipline','Good','good']].map(x=>`<article class="${x[2]}"><small>${x[0]}</small><strong>${x[1]}</strong></article>`).join('')}</div><h2>Achievement badges</h2><div class="monthly-badges">${['Science star','Most improved student','Perfect exam attendance','Homework champion','Excellent discipline'].map((x,i)=>`<div><span>${['★','↗','✓','▣','◆'][i]}</span><b>${x}</b></div>`).join('')}</div><section class="monthly-parent-guide"><h2>Parent action guide</h2><ul><li>Encourage daily reading.</li><li>Ask one question after every class.</li><li>Help your child attempt more practice tests.</li></ul></section><div class="monthly-signatures"><div><b>Parent signature</b><hr><span>Date: __________________</span></div><div><b>Academic head</b><strong>AVETI Learning Tuition Center</strong><hr><span>Date: __________________</span></div></div></section>
  </main>`;
}
function printMonthlyReport(){printReportWithFilename('Rahul-Kumar-Monthly-Progress-Report-July-2026.pdf')}
window.monthlyReport=monthlyReport; window.printMonthlyReport=printMonthlyReport;

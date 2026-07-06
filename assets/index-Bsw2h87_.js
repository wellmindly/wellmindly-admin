(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`https://api.wellmindly.com/api`,t={token:localStorage.getItem(`admin_token`)||null,activeTab:`overview`,students:[],quizzes:[],feedbacks:[],metrics:null,universityContacts:[],counselorContacts:[],generalContacts:[],activeInquiry:null,activeQuizId:null,activeStudentDetail:null,charts:{submissionsTrend:null,severityDonut:null,moodsBar:null,studentMoodTimeline:null}},n={students:{page:1,pageSize:6},feedbacks:{page:1,pageSize:5},qdSubmissions:{page:1,pageSize:5},studentHistory:{page:1,pageSize:4},universityContacts:{page:1,pageSize:5},counselorContacts:{page:1,pageSize:5},generalContacts:{page:1,pageSize:5}},r={students:``,feedbacks:``,qdSubmissions:``,studentHistory:``,universityContacts:``,counselorContacts:``,generalContacts:``},i={feedbacks:{wouldUse:``,reachFirst:``},qdSubmissions:{severity:``}};document.addEventListener(`DOMContentLoaded`,()=>{a(),o()});function a(){let e=document.getElementById(`login-form`);e&&e.addEventListener(`submit`,s),document.querySelectorAll(`.nav-item`).forEach(e=>{e.addEventListener(`click`,e=>{let t=e.currentTarget.getAttribute(`data-tab`);t!==`quizzes`&&b(),l(t)})});let t=document.getElementById(`logout-btn`);t&&t.addEventListener(`click`,c);let a=document.getElementById(`search-student`);a&&a.addEventListener(`input`,e=>{r.students=e.target.value,n.students.page=1,h()});let o=document.getElementById(`search-feedback`);o&&o.addEventListener(`input`,e=>{r.feedbacks=e.target.value,n.feedbacks.page=1,x()});let u=document.getElementById(`filter-would-use`);u&&u.addEventListener(`change`,e=>{i.feedbacks.wouldUse=e.target.value,n.feedbacks.page=1,x()});let d=document.getElementById(`filter-reach-first`);d&&d.addEventListener(`change`,e=>{i.feedbacks.reachFirst=e.target.value,n.feedbacks.page=1,x()});let f=document.getElementById(`btn-back-to-quizzes`);f&&f.addEventListener(`click`,b);let p=document.getElementById(`search-qd-submissions`);p&&p.addEventListener(`input`,e=>{r.qdSubmissions=e.target.value,n.qdSubmissions.page=1,k()});let m=document.getElementById(`filter-qd-severity`);m&&m.addEventListener(`change`,e=>{i.qdSubmissions.severity=e.target.value,n.qdSubmissions.page=1,k()});let g=document.getElementById(`search-student-history`);g&&g.addEventListener(`input`,e=>{r.studentHistory=e.target.value,n.studentHistory.page=1,O()});let _=document.getElementById(`search-university-contact`);_&&_.addEventListener(`input`,e=>{r.universityContacts=e.target.value,n.universityContacts.page=1,N()});let v=document.getElementById(`search-counselor-contact`);v&&v.addEventListener(`input`,e=>{r.counselorContacts=e.target.value,n.counselorContacts.page=1,F()});let S=document.getElementById(`search-general-contact`);S&&S.addEventListener(`input`,e=>{r.generalContacts=e.target.value,n.generalContacts.page=1,L()}),window.addEventListener(`keydown`,e=>{e.key===`Escape`&&(E(),j(),w(),z())}),window.closeStudentModal=E,window.closeAssessmentModal=j,window.openAssessmentSheet=A,window.openStudentDetails=T,window.closeSurveyModal=w,window.openSurveyModal=C,window.openQuizDetails=y,window.openInquiryDetails=R,window.closeInquiryModal=z,window.deleteInquiry=B;let D=document.getElementById(`btn-open-create-room`),M=document.getElementById(`btn-cancel-create-room`),P=document.getElementById(`create-room-form-container`);D&&P&&D.addEventListener(`click`,()=>{P.classList.remove(`hidden`),D.classList.add(`hidden`)}),M&&P&&D&&M.addEventListener(`click`,()=>{P.classList.add(`hidden`),D.classList.remove(`hidden`);let e=document.getElementById(`new-room-name`),t=document.getElementById(`new-room-desc`);e&&(e.value=``),t&&(t.value=``)});let I=document.getElementById(`btn-submit-create-room`);I&&I.addEventListener(`click`,async e=>{e.preventDefault();let t=document.getElementById(`new-room-name`),n=document.getElementById(`new-room-desc`);if(!t)return;let r=t.value.trim(),i=n?n.value.trim():``;if(!r){alert(`Room name is required.`);return}await H(`/talk/rooms`,{name:r,description:i})&&(t.value=``,n&&(n.value=``),P&&D&&(P.classList.add(`hidden`),D.classList.remove(`hidden`)),W())})}function o(){let e=document.getElementById(`login-container`),n=document.getElementById(`app-container`);t.token?(e.classList.add(`hidden`),n.classList.remove(`hidden`),d()):(e.classList.remove(`hidden`),n.classList.add(`hidden`))}async function s(n){n.preventDefault();let r=document.getElementById(`email`),i=document.getElementById(`password`),a=document.getElementById(`login-error`),s=document.getElementById(`error-message`),c=r.value.trim(),l=i.value;a.classList.add(`hidden`);try{let n=await fetch(`${e}/auth/login`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({email:c,password:l,role:`ADMIN`})}),r=await n.json();if(!n.ok)throw Error(r.error||`Login failed. Please try again.`);t.token=r.token,localStorage.setItem(`admin_token`,r.token),o()}catch(e){console.error(`Login error:`,e),s.textContent=e.message,a.classList.remove(`hidden`)}}function c(){confirm(`Are you sure you want to sign out from the Admin Portal?`)&&(t.token=null,localStorage.removeItem(`admin_token`),m(),o())}function l(e){t.activeTab=e,document.querySelectorAll(`.nav-item`).forEach(t=>{t.getAttribute(`data-tab`)===e?t.classList.add(`active`):t.classList.remove(`active`)}),document.querySelectorAll(`.tab-pane`).forEach(t=>{t.id===`tab-${e}`?t.classList.remove(`hidden`):t.classList.add(`hidden`)});let n=document.getElementById(`view-title`),r=document.getElementById(`view-subtitle`);switch(e){case`overview`:n.textContent=`Dashboard Overview`,r.textContent=`Summary and trends across WellMindly students.`;break;case`university`:n.textContent=`University Onboarding Requests`,r.textContent=`Review and manage collaboration requests from university administrations.`,M();break;case`moderation`:n.textContent=`TalkMindly Moderation`,r.textContent=`Review anonymous peer chat flags, track AI costs, and manage TalkRooms.`,W();break;case`counselors`:n.textContent=`Counselor Applications`,r.textContent=`Review therapist and student coach onboarding applications.`,P();break;case`contacts`:n.textContent=`General Contacts`,r.textContent=`Review and manage general student and visitor support contact inquiries.`,I();break;case`students`:n.textContent=`Student Directory`,r.textContent=`Browse and review student profiles and check-in timelines.`;break;case`quizzes`:n.textContent=`Interactive Assessments`,r.textContent=`Inspect blueprints, and analyze student response sheets.`;break;case`feedback`:n.textContent=`Student Feedback Feed`,r.textContent=`Review survey satisfaction ratings and customize text filters.`;break}}async function u(n){try{let r=await fetch(`${e}${n}`,{headers:{Authorization:`Bearer ${t.token}`}});if(r.status===401||r.status===403)return t.token=null,localStorage.removeItem(`admin_token`),o(),null;if(!r.ok){let e=await r.json();throw Error(e.error||`HTTP error! Status: ${r.status}`)}return await r.json()}catch(e){return console.error(`API Fetch failed for ${n}:`,e),null}}async function d(){let[e,n,r,i]=await Promise.all([u(`/admin/metrics`),u(`/admin/students`),u(`/admin/quizzes`),u(`/admin/feedbacks`)]);e&&(t.metrics=e),n&&(t.students=n.students||[]),r&&(t.quizzes=r.quizzes||[]),i&&(t.feedbacks=i.feedbacks||[]),f(),h(),_(),x()}function f(){if(!t.metrics)return;let e=t.students.length,n=t.metrics.totalSubmissions||0,r=0;t.metrics.classificationMetrics.forEach(e=>{e.classification.toLowerCase().includes(`severe`)&&(r+=e.count)}),document.getElementById(`kpi-students`).textContent=e,document.getElementById(`kpi-submissions`).textContent=n,document.getElementById(`kpi-critical`).textContent=r,document.getElementById(`kpi-mood`).textContent=`3.8 / 5.0`,p()}function p(){m();let e=t.metrics;if(!e)return;let n=document.getElementById(`chart-submissions`).getContext(`2d`),r=[...e.submissionTrend||[]].sort((e,t)=>new Date(e.date)-new Date(t.date)),i=r.map(e=>V(e.date)),a=r.map(e=>e.count);t.charts.submissionsTrend=new Chart(n,{type:`line`,data:{labels:i.length?i:[`No Data`],datasets:[{label:`Submissions`,data:a.length?a:[0],borderColor:`hsl(255, 48%, 60%)`,backgroundColor:`rgba(124, 58, 237, 0.08)`,borderWidth:2.5,fill:!0,tension:.35,pointBackgroundColor:`hsl(255, 48%, 60%)`,pointHoverRadius:6}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{y:{grid:{color:`rgba(255, 255, 255, 0.03)`},ticks:{color:`rgba(255, 255, 255, 0.5)`,stepSize:1}},x:{grid:{display:!1},ticks:{color:`rgba(255, 255, 255, 0.5)`}}}}});let o=document.getElementById(`chart-severity`).getContext(`2d`),s={};e.classificationMetrics.forEach(e=>{let t=e.classification;if(t.startsWith(`{`))try{t=JSON.parse(t).classification||`Completed`}catch{}s[t]=(s[t]||0)+e.count});let c=Object.keys(s),l=Object.values(s),u=c.map(e=>{let t=e.toLowerCase();return t.includes(`severe`)||t.includes(`distress`)||t.includes(`stretch`)||t.includes(`high`)?`hsl(352, 65%, 54%)`:t.includes(`moderate`)||t.includes(`elevated`)||t.includes(`finding`)?`hsl(35, 75%, 54%)`:t.includes(`mild`)||t.includes(`steady`)?`hsl(155, 55%, 46%)`:t.includes(`minimal`)||t.includes(`low`)||t.includes(`doing well`)||t.includes(`excellent`)||t.includes(`positive`)||t.includes(`bright`)||t.includes(`stable`)?`hsl(185, 55%, 50%)`:`hsl(235, 50%, 65%)`});t.charts.severityDonut=new Chart(o,{type:`doughnut`,data:{labels:c.length?c:[`No Assessments`],datasets:[{data:l.length?l:[1],backgroundColor:u.length?u:[`rgba(255, 255, 255, 0.08)`],borderWidth:0,hoverOffset:3}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:`right`,labels:{color:`rgba(255, 255, 255, 0.7)`,font:{size:11}}}},cutout:`70%`}});let d=document.getElementById(`chart-moods`).getContext(`2d`),f={1:1,2:2,3:4,4:6,5:3};t.charts.moodsBar=new Chart(d,{type:`bar`,data:{labels:[`1 (Struggling)`,`2 (Low)`,`3 (Steady)`,`4 (Good)`,`5 (Excellent)`],datasets:[{label:`Logs Count`,data:Object.values(f),backgroundColor:[`rgba(244, 63, 94, 0.5)`,`rgba(245, 158, 11, 0.5)`,`rgba(16, 185, 129, 0.5)`,`rgba(14, 165, 233, 0.5)`,`rgba(168, 85, 247, 0.5)`],borderRadius:6,borderWidth:0}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{y:{grid:{color:`rgba(255, 255, 255, 0.03)`},ticks:{color:`rgba(255, 255, 255, 0.5)`,stepSize:1}},x:{grid:{display:!1},ticks:{color:`rgba(255, 255, 255, 0.5)`}}}}})}function m(){Object.keys(t.charts).forEach(e=>{t.charts[e]&&(t.charts[e].destroy(),t.charts[e]=null)})}function h(){let e=document.getElementById(`students-list`);if(!e)return;e.innerHTML=``;let i=r.students.toLowerCase().trim(),a=t.students.filter(e=>{if(!i)return!0;let t=`${e.firstName} ${e.lastName}`.toLowerCase(),n=(e.email||``).toLowerCase(),r=(e.university?.name||``).toLowerCase();return t.includes(i)||n.includes(i)||r.includes(i)}),o=a.length,s=n.students,c=Math.ceil(o/s.pageSize)||1;s.page>c&&(s.page=c);let l=(s.page-1)*s.pageSize,u=a.slice(l,l+s.pageSize);if(u.length===0){e.innerHTML=`
      <tr>
        <td colspan="5" style="text-align: center; padding: 32px; color: rgba(255, 255, 255, 0.4)">
          <i class="bx bx-user-x" style="font-size: 24px; margin-bottom: 8px; display: block"></i>
          No students found matching your query.
        </td>
      </tr>
    `,g(`students-pagination`,s.page,c,e=>{n.students.page=e,h()});return}u.forEach(t=>{let n=document.createElement(`tr`),r=`${t.firstName} ${t.lastName}`,i=t.university?.name||`Self Registered`,a=V(t.createdAt);n.innerHTML=`
      <td>
        <div class="student-profile-header">
          <div class="profile-avatar">${t.firstName.charAt(0)}${t.lastName.charAt(0)}</div>
          <div>
            <strong style="color: white; display: block">${r}</strong>
          </div>
        </div>
      </td>
      <td><span class="text-secondary">${t.email}</span></td>
      <td><span class="badge-role">${i}</span></td>
      <td><span class="text-secondary">${a}</span></td>
      <td class="text-right">
        <button class="btn-view-details" onclick="openStudentDetails('${t.id}')">
          <i class="bx bx-folder-open"></i> Student File
        </button>
      </td>
    `,e.appendChild(n)}),g(`students-pagination`,s.page,c,e=>{n.students.page=e,h()})}function g(e,t,n,r){let i=document.getElementById(e);if(!i)return;i.innerHTML=``;let a=document.createElement(`button`);a.className=`btn-page`,a.disabled=t===1,a.innerHTML=`<i class="bx bx-chevron-left"></i>`,a.addEventListener(`click`,()=>r(t-1)),i.appendChild(a);for(let e=1;e<=n;e++){let n=document.createElement(`button`);n.className=`btn-page ${e===t?`active`:``}`,n.textContent=e,n.addEventListener(`click`,()=>r(e)),i.appendChild(n)}let o=document.createElement(`button`);o.className=`btn-page`,o.disabled=t===n,o.innerHTML=`<i class="bx bx-chevron-right"></i>`,o.addEventListener(`click`,()=>r(t+1)),i.appendChild(o)}function _(){let e=document.getElementById(`quizzes-list`);if(!e)return;if(e.innerHTML=``,t.quizzes.length===0){e.innerHTML=`<div class="empty-state"><i class="bx bx-book-open"></i>No quizzes configured in database.</div>`;return}let n=[`Emotional check-in`,`Mood snapshot`,`Mental load`,`Headspace`,`Your circle`,`Running on empty`,`Signature strengths`,`Personality profile`,`What matters most`,`Strength & shadow`,`Your season`],r=t.quizzes.filter(e=>n.includes(e.title)),i=t.quizzes.filter(e=>!n.includes(e.title)),a=``;r.length>0&&(a+=`
      <div style="grid-column: 1 / -1; margin-bottom: 8px;">
        <h3 style="color: white; font-size: 16px; font-weight: 700; margin-bottom: 4px;">Active Self-Discovery Blueprints</h3>
        <p class="text-secondary" style="font-size: 12.5px; margin-bottom: 12px;">Current client-approved non-clinical assessments.</p>
      </div>
    `,r.forEach(e=>{a+=v(e)})),i.length>0&&(a+=`
      <div style="grid-column: 1 / -1; margin-top: 24px; margin-bottom: 8px;">
        <h3 style="color: white; font-size: 16px; font-weight: 700; margin-bottom: 4px;">Legacy & Clinical Assessments</h3>
        <p class="text-secondary" style="font-size: 12.5px; margin-bottom: 12px;">Archived or clinical diagnostic tests (e.g. PHQ-9) from previous database states.</p>
      </div>
    `,i.forEach(e=>{a+=v(e)})),e.innerHTML=a,t.quizzes.forEach(e=>{let t=document.getElementById(`quiz-card-${e.id}`);t&&t.addEventListener(`click`,()=>y(e.id))})}function v(e){let t=![`Emotional check-in`,`Mood snapshot`,`Mental load`,`Headspace`,`Your circle`,`Running on empty`,`Signature strengths`,`Personality profile`,`What matters most`,`Strength & shadow`,`Your season`].includes(e.title),n=t?`style="border-color: rgba(255,255,255,0.06); opacity: 0.8;"`:``,r=t?`style="background-color: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6);"`:``;return`
    <div class="quiz-card" id="quiz-card-${e.id}" ${n}>
      <div class="quiz-card-header">
        <h3>${e.title}</h3>
        <span class="quiz-category-badge" ${r}>${e.category}</span>
      </div>
      <p class="description">${e.description||`Self-reflection interactive test.`}</p>
      <div class="quiz-card-footer">
        <div class="quiz-meta-item">Questions blueprint: <span>${e.questions?.length||0}</span></div>
        <div class="quiz-meta-item">Max Score: <span>${e.maxScore}</span></div>
      </div>
    </div>
  `}async function y(e){t.activeQuizId=e;let a=t.quizzes.find(t=>t.id===e);if(!a)return;document.getElementById(`quizzes-hub-view`).classList.add(`hidden`),document.getElementById(`quiz-detail-view`).classList.remove(`hidden`),document.getElementById(`qd-title`).textContent=a.title,document.getElementById(`qd-category`).textContent=a.category,document.getElementById(`qd-description`).textContent=a.description||`Self-reflection interactive test.`;let o=document.getElementById(`qd-questions-list`);o.innerHTML=``,a.questions&&a.questions.length>0?a.questions.forEach(e=>{let t=document.createElement(`div`);t.className=`blueprint-item`;let n=``;e.options&&e.options.length>0&&e.options.forEach(e=>{n+=`<span class="bp-option-pill">${e.label} (${e.points}pts)</span>`}),t.innerHTML=`
        <div class="bp-q-text">${e.index}. ${e.text}</div>
        <div class="bp-options-pills">${n}</div>
      `,o.appendChild(t)}):o.innerHTML=`<p class="text-secondary">No questions blueprints available.</p>`,n.qdSubmissions.page=1,r.qdSubmissions=``,document.getElementById(`search-qd-submissions`).value=``,document.getElementById(`filter-qd-severity`).value=``,i.qdSubmissions.severity=``,k()}function b(){document.getElementById(`quizzes-hub-view`).classList.remove(`hidden`),document.getElementById(`quiz-detail-view`).classList.add(`hidden`),t.activeQuizId=null}function x(){let e=document.getElementById(`feedback-list`);if(!e)return;e.innerHTML=``;let a=r.feedbacks.toLowerCase().trim(),o=i.feedbacks.wouldUse,s=i.feedbacks.reachFirst,c=t.feedbacks.filter(e=>{let t=e.result?.user,n=t?`${t.firstName} ${t.lastName}`.toLowerCase():``,r=t?t.email.toLowerCase():``,i=(e.comments||``).toLowerCase();if(!(!a||n.includes(a)||r.includes(a)||i.includes(a)))return!1;let c=S(e.comments);return!(o&&c.q3!==o||s&&c.q4!==s)}),l=c.filter(e=>e.comments).length,u=0;c.forEach(e=>u+=e.rating);let d=c.length>0?(u/c.length).toFixed(1):`0.0`;document.getElementById(`feedback-total-count`).textContent=l,document.getElementById(`feedback-avg-rating`).textContent=`${d} / 5.0`;let f=document.getElementById(`feedback-stars-display`);f.innerHTML=``;let p=Math.round(Number(d));for(let e=1;e<=5;e++){let t=document.createElement(`i`);t.className=e<=p?`bx bxs-star`:`bx bx-star`,f.appendChild(t)}let m=c.length,h=n.feedbacks,_=Math.ceil(m/h.pageSize)||1;h.page>_&&(h.page=_);let v=(h.page-1)*h.pageSize,y=c.slice(v,v+h.pageSize);if(y.length===0){e.innerHTML=`
      <tr>
        <td colspan="7" style="text-align: center; padding: 32px; color: rgba(255, 255, 255, 0.4)">
          <i class="bx bx-message-square-detail" style="font-size: 24px; margin-bottom: 8px; display: block"></i>
          No feedback matches the selected filters.
        </td>
      </tr>
    `,g(`feedback-pagination`,h.page,_,e=>{n.feedbacks.page=e,x()});return}y.forEach(t=>{let n=document.createElement(`tr`),r=t.result?.user,i=r?`${r.firstName} ${r.lastName}`:`Anonymous`,a=r?r.email:`Unknown`,o=t.result?.quiz?.title||`General`;V(t.createdAt);let s=``;for(let e=1;e<=5;e++)s+=e<=t.rating?`<i class="bx bxs-star" style="color: hsl(35, 75%, 54%)"></i>`:`<i class="bx bx-star" style="color: rgba(255,255,255,0.1)"></i>`;let c=S(t.comments),l=t.rating<=2?`style="border-left: 3px solid hsl(352, 65%, 54%); background-color: rgba(255,0,0,0.02)"`:``,u=c.q1.length>50?c.q1.substring(0,47)+`...`:c.q1||`<em class="text-secondary">No comment</em>`;n.innerHTML=`
      <td ${l}>
        <div style="font-weight: 700; color: white">${i}</div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px">${a}</div>
      </td>
      <td><span class="quiz-category-badge" style="background-color: rgba(255,255,255,0.04); color: white; border: none">${o}</span></td>
      <td><div style="display: flex; gap: 1px">${s}</div></td>
      <td><span class="badge-role" style="background: transparent; color: white; border-color: rgba(255,255,255,0.15)">${c.q3||`N/A`}</span></td>
      <td><span class="badge-role" style="background: transparent; color: white; border-color: rgba(255,255,255,0.15)">${c.q4||`N/A`}</span></td>
      <td><p style="font-size: 12.5px; max-width: 260px; word-break: break-word">${u}</p></td>
      <td class="text-right">
        <button class="btn-view-details" onclick="openSurveyModal('${t.id}')">
          <i class="bx bx-detail"></i> View Survey
        </button>
      </td>
    `,e.appendChild(n)}),g(`feedback-pagination`,h.page,_,e=>{n.feedbacks.page=e,x()})}function S(e){let t={q1:``,q2:``,q3:``,q4:``,q5:``,q6:``};return e?(e.split(`

`).forEach(e=>{let n=e.split(`
`);if(n.length>=2){let e=n[0].toLowerCase(),r=n.slice(1).join(`
`).trim();e.includes(`first few seconds`)?t.q1=r:e.includes(`describing you`)?t.q2=r:e.includes(`actually use`)?t.q3=r:e.includes(`reach for first`)?t.q4=r:e.includes(`felt off`)?t.q5=r:e.includes(`wish it did`)&&(t.q6=r)}}),!t.q1&&!t.q3&&!t.q4&&(t.q1=e),t):t}function C(e){document.getElementById(`modal-survey-details`).classList.remove(`hidden`);let n=t.feedbacks.find(t=>t.id===e);if(!n)return;let r=n.result?.user;document.getElementById(`survey-modal-meta`).textContent=r?`${r.firstName} ${r.lastName} • ${r.email}`:`Anonymous`;let i=S(n.comments),a=document.getElementById(`survey-answers-container`);a.innerHTML=``,[{key:`q1`,text:`1. In the first few seconds, what did you feel?`},{key:`q2`,text:`2. Did anything here feel like it was describing you?`},{key:`q3`,text:`3. Would you actually use something like this?`},{key:`q4`,text:`4. Which would you reach for first?`},{key:`q5`,text:`5. What felt off, fake, or like "just an app"?`},{key:`q6`,text:`6. Anything you'd change or wish it did?`}].forEach(e=>{let t=i[e.key];if(t){let n=document.createElement(`div`);n.className=`survey-question-block`,n.innerHTML=`
        <div class="survey-q-title">${e.text}</div>
        <div class="survey-q-ans">${t}</div>
      `,a.appendChild(n)}})}function w(){document.getElementById(`modal-survey-details`).classList.add(`hidden`)}async function T(e){document.getElementById(`modal-student`).classList.remove(`hidden`),document.getElementById(`modal-student-name`).textContent=`Loading Student File...`,document.getElementById(`modal-student-email`).textContent=``,document.getElementById(`student-quizzes-list`).innerHTML=`<div class="empty-state">Loading...</div>`;let i=await u(`/admin/students/${e}`);if(!i||!i.student){alert(`Failed to retrieve student profile.`),E();return}let a=i.student;t.activeStudentDetail=a,document.getElementById(`modal-student-name`).textContent=`${a.firstName} ${a.lastName}`,document.getElementById(`modal-student-email`).textContent=a.email,document.getElementById(`modal-avatar`).textContent=`${a.firstName.charAt(0)}${a.lastName.charAt(0)}`,D(a.dailyCheckins||[]),n.studentHistory.page=1,r.studentHistory=``,document.getElementById(`search-student-history`).value=``,O()}function E(){let e=document.getElementById(`modal-student`);e&&e.classList.add(`hidden`),t.activeStudentDetail=null,t.charts.studentMoodTimeline&&(t.charts.studentMoodTimeline.destroy(),t.charts.studentMoodTimeline=null)}function D(e){let n=document.getElementById(`student-mood-line-chart`).getContext(`2d`);t.charts.studentMoodTimeline&&t.charts.studentMoodTimeline.destroy();let r=[...e].reverse(),i=r.map(e=>V(e.createdAt)),a=r.map(e=>e.rating);t.charts.studentMoodTimeline=new Chart(n,{type:`line`,data:{labels:i.length?i:[`No Logs`],datasets:[{label:`Mood Rating`,data:a.length?a:[0],borderColor:`hsl(185, 55%, 50%)`,backgroundColor:`rgba(14, 165, 233, 0.08)`,borderWidth:2,fill:!0,tension:.35,pointBackgroundColor:`hsl(185, 55%, 50%)`,pointHoverRadius:5}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{y:{min:1,max:5,grid:{color:`rgba(255, 255, 255, 0.03)`},ticks:{color:`rgba(255, 255, 255, 0.5)`,stepSize:1}},x:{grid:{display:!1},ticks:{color:`rgba(255, 255, 255, 0.5)`}}}}})}function O(){let e=document.getElementById(`student-quizzes-list`);if(!e)return;e.innerHTML=``;let i=t.activeStudentDetail?.quizResults||[],a=r.studentHistory.toLowerCase().trim(),o=i.filter(e=>{if(!a)return!0;let t=(e.quiz?.title||``).toLowerCase(),n=(e.quiz?.category||``).toLowerCase(),r=``;if(e.classification)if(e.classification.startsWith(`{`))try{r=JSON.parse(e.classification).classification||``}catch{}else r=e.classification;return r=r.toLowerCase(),t.includes(a)||n.includes(a)||r.includes(a)}),s=o.length,c=n.studentHistory,l=Math.ceil(s/c.pageSize)||1;c.page>l&&(c.page=l);let u=(c.page-1)*c.pageSize,d=o.slice(u,u+c.pageSize);if(d.length===0){e.innerHTML=`<div class="empty-state"><i class="bx bx-notepad"></i>No assessments matches search.</div>`,g(`student-history-pagination`,c.page,l,e=>{n.studentHistory.page=e,O()});return}d.forEach(t=>{let n=document.createElement(`div`);n.className=`timeline-quiz-item`;let r=t.quiz?.title||`Assessment`,i=V(t.completedAt),a=`Completed`;if(t.classification)if(t.classification.startsWith(`{`))try{a=JSON.parse(t.classification).classification||`Completed`}catch{}else a=t.classification;let o=`style="color: hsl(235, 50%, 65%)"`,s=a.toLowerCase();s.includes(`severe`)?o=`style="color: hsl(352, 65%, 54%)"`:s.includes(`moderate`)?o=`style="color: hsl(35, 75%, 54%)"`:s.includes(`mild`)&&(o=`style="color: hsl(155, 55%, 46%)"`),n.innerHTML=`
      <div class="tq-info">
        <h4>${r}</h4>
        <p>Finished on ${i} • <span ${o}>${a}</span></p>
      </div>
      <div class="tq-score-badge">
        <span class="score-tag">${t.overallScore} / ${t.quiz?.maxScore||100}</span>
        <button class="btn-view-details" style="padding: 5px 10px; font-size: 11px" onclick="openAssessmentSheet('${t.id}')">
          Details
        </button>
      </div>
    `,e.appendChild(n)}),g(`student-history-pagination`,c.page,l,e=>{n.studentHistory.page=e,O()})}async function k(){let e=document.getElementById(`qd-submissions-list`);if(!e)return;e.innerHTML=``;let a=t.activeQuizId,o=t.quizzes.find(e=>e.id===a);if(!o)return;let s=await u(`/admin/quiz-results?quizId=${a}`),c=s&&s.quizResults||[],l=r.qdSubmissions.toLowerCase().trim(),d=i.qdSubmissions.severity.toLowerCase().trim(),f=c.filter(e=>{let t=e.user,n=t?`${t.firstName} ${t.lastName}`.toLowerCase():``,r=t?t.email.toLowerCase():``,i=``;if(e.classification)if(e.classification.startsWith(`{`))try{i=JSON.parse(e.classification).classification||``}catch{}else i=e.classification;i=i.toLowerCase();let a=!l||n.includes(l)||r.includes(l),o=!d||i.includes(d);return a&&o}),p=f.length;document.getElementById(`qd-stat-attempts`).textContent=p;let m=0,h=0;f.forEach(e=>{m+=e.overallScore,e.overallScore>h&&(h=e.overallScore)});let _=p>0?Math.round(m/p):0;document.getElementById(`qd-stat-avg`).textContent=`${_} pts`,document.getElementById(`qd-stat-highest`).textContent=`${h} pts`;let v=n.qdSubmissions,y=Math.ceil(p/v.pageSize)||1;v.page>y&&(v.page=y);let b=(v.page-1)*v.pageSize,x=f.slice(b,b+v.pageSize);if(x.length===0){e.innerHTML=`
      <tr>
        <td colspan="5" style="text-align: center; padding: 24px; color: rgba(255, 255, 255, 0.4)">
          <i class="bx bx-notepad" style="font-size: 24px; margin-bottom: 8px; display: block"></i>
          No submissions found matching filters.
        </td>
      </tr>
    `,g(`qd-submissions-pagination`,v.page,y,e=>{n.qdSubmissions.page=e,k()});return}x.forEach(t=>{let n=document.createElement(`tr`),r=t.user,i=r?`${r.firstName} ${r.lastName}`:`Anonymous`,s=r?r.email:`Unknown`,c=V(t.completedAt),l=`Completed`;if(t.classification)if(t.classification.startsWith(`{`))try{l=JSON.parse(t.classification).classification||`Completed`}catch{}else l=t.classification;let u=`style="color: hsl(235, 50%, 65%)"`,d=l.toLowerCase();d.includes(`severe`)?u=`style="color: hsl(352, 65%, 54%)"`:d.includes(`moderate`)?u=`style="color: hsl(35, 75%, 54%)"`:d.includes(`mild`)&&(u=`style="color: hsl(155, 55%, 46%)"`),n.innerHTML=`
      <td>
        <div style="font-weight: 700; color: white">${i}</div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px">${s}</div>
      </td>
      <td><span class="text-secondary">${c}</span></td>
      <td><strong>${t.overallScore} / ${o.maxScore}</strong></td>
      <td><span ${u} style="font-weight: 600">${l}</span></td>
      <td class="text-right">
        <!-- Re-use assessment details modal (passing full details since it parses correctly) -->
        <button class="btn-view-details" onclick="openAssessmentSheetDirect('${t.id}', '${a}')">
          <i class="bx bx-file-find"></i> Review
        </button>
      </td>
    `,e.appendChild(n)}),g(`qd-submissions-pagination`,v.page,y,e=>{n.qdSubmissions.page=e,k()})}window.openAssessmentSheetDirect=async function(e,n){let r=await u(`/admin/quiz-results?quizId=${n}`),i=r&&r.quizResults||[];if(!i.find(t=>t.id===e)){alert(`Assessment results mapping failed.`);return}t.activeStudentDetail={quizResults:i},A(e)};async function A(e){document.getElementById(`modal-assessment`).classList.remove(`hidden`),document.getElementById(`assessment-modal-title`).textContent=`Loading Assessment Sheet...`,document.getElementById(`assessment-modal-meta`).textContent=``,document.getElementById(`assessment-score-earned`).textContent=`-`,document.getElementById(`assessment-classification`).textContent=``,document.getElementById(`assessment-ai-section`).classList.add(`hidden`);let n=document.getElementById(`assessment-answers-table-body`);n.innerHTML=`<tr><td colspan="4" style="text-align:center;">Loading answers...</td></tr>`;let r=null;if(t.activeStudentDetail&&t.activeStudentDetail.quizResults&&(r=t.activeStudentDetail.quizResults.find(t=>t.id===e)),!r){let n=t.feedbacks.find(t=>t.resultId===e);n&&n.result&&(r=n.result)}if(!r){alert(`Assessment detail page could not be parsed.`),j();return}let i=r.quiz?.title||`Interactive reflection`,a=r.quiz?.category||`Focus`,o=V(r.completedAt),s=r.quiz?.maxScore||100;document.getElementById(`assessment-modal-title`).textContent=i,document.getElementById(`assessment-modal-meta`).textContent=`${a} • Completed on ${o}`,document.getElementById(`assessment-score-earned`).textContent=r.overallScore,document.getElementById(`assessment-score-max`).textContent=s;let c=r.classification||`Completed`,l=c,u=null,d=null;if(c.startsWith(`{`))try{let e=JSON.parse(c);l=e.classification||`Completed`,u=e.aiFeedback||null,d=e.answers||null}catch{}let f=document.getElementById(`assessment-classification`);f.textContent=l;let p=document.getElementById(`assessment-badge-card`),m=l.toLowerCase();p.style.borderLeft=`6px solid hsl(235, 50%, 65%)`,f.style.color=`hsl(235, 50%, 65%)`,m.includes(`severe`)?(p.style.borderLeft=`6px solid hsl(352, 65%, 54%)`,f.style.color=`hsl(352, 65%, 54%)`):m.includes(`moderate`)?(p.style.borderLeft=`6px solid hsl(35, 75%, 54%)`,f.style.color=`hsl(35, 75%, 54%)`):m.includes(`mild`)&&(p.style.borderLeft=`6px solid hsl(155, 55%, 46%)`,f.style.color=`hsl(155, 55%, 46%)`);let h=document.getElementById(`assessment-ai-section`);if(u){h.classList.remove(`hidden`),document.getElementById(`ai-headline`).textContent=u.headline||``,document.getElementById(`ai-narrative`).textContent=u.narrative||``,document.getElementById(`ai-tip`).textContent=u.tip||``;let e=document.getElementById(`ai-insights`);e.innerHTML=``,u.insights&&Array.isArray(u.insights)&&u.insights.forEach(t=>{let n=document.createElement(`div`);n.className=`ai-insight-bullet`,n.innerHTML=`<i class="bx bx-right-arrow-alt"></i> <span>${t}</span>`,e.appendChild(n)})}else h.classList.add(`hidden`);if(n.innerHTML=``,!d){n.innerHTML=`<tr><td colspan="4" style="text-align:center;color:rgba(255,255,255,0.4)">No detailed answers saved in this result.</td></tr>`;return}let g=t.quizzes.find(e=>e.id===r.quizId),_=g?g.questions:[];if(_&&_.length>0)_.forEach((e,t)=>{let r=document.createElement(`tr`),i=`Option Selected`,a=0,o=null;if(d.responses&&Array.isArray(d.responses)?o=d.responses[t]:Array.isArray(d)?o=d[t]:d[e.id]===void 0?d[t]!==void 0&&(o=d[t]):o=d[e.id],o!==null)if(typeof o==`object`)i=o.label||o.text||JSON.stringify(o),a=o.points===void 0?0:o.points;else{let t=Number(o);if(e.options&&e.options.length>0){let n=e.options.find((e,n)=>e.points===t||n===t||e.label===o);n?(i=n.label,a=n.points):(i=`Value: ${o}`,a=isNaN(t)?0:t)}else i=`Response: ${o}`,a=isNaN(t)?0:t}else i=`Not Answered / Skipped`,a=0;r.innerHTML=`
        <td style="font-weight:700;">${e.index}</td>
        <td><strong style="color:white; font-size:12.5px;">${e.text}</strong></td>
        <td><span style="color:hsl(185, 55%, 50%); font-weight:600;"><i class="bx bx-check-double"></i> ${i}</span></td>
        <td class="text-right"><span class="ans-score-pill">+${a} pts</span></td>
      `,n.appendChild(r)});else{let e=``;if(d.scores&&typeof d.scores==`object`&&Object.entries(d.scores).forEach(([t,n],r)=>{let i=d.top&&d.top.includes(t),a=i?`<i class="bx bxs-star" style="color: hsl(35, 75%, 54%)"></i> `:``,o=i?`style="color: hsl(35, 75%, 54%); font-weight:700;"`:``;e+=`
          <tr>
            <td style="font-weight:700;">${r+1}</td>
            <td><strong style="color:white; font-size:12.5px;">Character Strength / Dimension</strong></td>
            <td><span ${o}>${a}${t}</span></td>
            <td class="text-right"><span class="ans-score-pill">${n} pts</span></td>
          </tr>
        `}),d.responses&&Array.isArray(d.responses)&&!d.scores&&d.responses.forEach((t,n)=>{e+=`
          <tr>
            <td style="font-weight:700;">${n+1}</td>
            <td><strong style="color:white; font-size:12.5px;">Response Score</strong></td>
            <td><span>Option Rating</span></td>
            <td class="text-right"><span class="ans-score-pill">+${t} pts</span></td>
          </tr>
        `}),Array.isArray(d)&&d.forEach((t,n)=>{e+=`
          <tr>
            <td style="font-weight:700;">${n+1}</td>
            <td><strong style="color:white; font-size:12.5px;">Question Response</strong></td>
            <td><span>Option: ${t}</span></td>
            <td class="text-right"><span class="ans-score-pill">${t} pts</span></td>
          </tr>
        `}),!e&&typeof d==`object`){let t=1;Object.entries(d).forEach(([n,r])=>{if(n===`scores`||n===`responses`||n===`top`||n===`summary`)return;let i=typeof r==`object`?JSON.stringify(r):r;e+=`
          <tr>
            <td style="font-weight:700;">${t++}</td>
            <td><strong style="color:white; font-size:12.5px;">${n}</strong></td>
            <td><span>${i}</span></td>
            <td class="text-right"><span class="ans-score-pill">${r}</span></td>
          </tr>
        `})}e?n.innerHTML=e:n.innerHTML=`
        <tr>
          <td colspan="4" style="font-family: monospace; white-space: pre-wrap; font-size:11px; background-color: hsl(var(--bg-dark) / 0.8)">
  ${JSON.stringify(d,null,2)}
          </td>
        </tr>
      `}}function j(){let e=document.getElementById(`modal-assessment`);e&&e.classList.add(`hidden`)}async function M(){let e=await u(`/contacts/university?page=${n.universityContacts.page}&limit=${n.universityContacts.pageSize}`);e&&e.requests&&(t.universityContacts=e.requests,N(e.total))}function N(e=t.universityContacts.length){let i=document.getElementById(`university-contact-list`);if(!i)return;i.innerHTML=``;let a=r.universityContacts.toLowerCase().trim(),o=t.universityContacts.filter(e=>a?(e.universityName||``).toLowerCase().includes(a)||(e.name||``).toLowerCase().includes(a)||(e.role||``).toLowerCase().includes(a)||(e.email||``).toLowerCase().includes(a):!0),s=a?o.length:e,c=n.universityContacts,l=Math.ceil(s/c.pageSize)||1,u=a?o.slice((c.page-1)*c.pageSize,c.page*c.pageSize):o;if(u.length===0){i.innerHTML=`<tr><td colspan="7" class="text-secondary" style="text-align:center; padding:32px;">No university requests found.</td></tr>`,g(`university-contact-pagination`,c.page,l,e=>{n.universityContacts.page=e,M()});return}u.forEach(e=>{let t=document.createElement(`tr`);t.innerHTML=`
      <td><strong style="color:white;">${e.universityName}</strong></td>
      <td><span>${e.name}</span></td>
      <td><span class="badge-role">${e.role}</span></td>
      <td><span class="text-secondary">${e.email}</span></td>
      <td><span class="text-secondary">${e.phone||`N/A`}</span></td>
      <td><span>${V(e.createdAt)}</span></td>
      <td class="text-right">
        <button class="btn-view-details" onclick="openInquiryDetails('university', '${e.id}')" style="margin-right: 6px;">
          <i class="bx bx-show"></i> View
        </button>
        <button class="btn-view-details" onclick="deleteInquiry('university', '${e.id}')" style="background: rgba(220, 38, 38, 0.2); border-color: rgba(220, 38, 38, 0.4); color: #ef4444;">
          <i class="bx bx-trash"></i>
        </button>
      </td>
    `,i.appendChild(t)}),g(`university-contact-pagination`,c.page,l,e=>{n.universityContacts.page=e,M()})}async function P(){let e=await u(`/contacts/counselor?page=${n.counselorContacts.page}&limit=${n.counselorContacts.pageSize}`);e&&e.requests&&(t.counselorContacts=e.requests,F(e.total))}function F(e=t.counselorContacts.length){let i=document.getElementById(`counselor-contact-list`);if(!i)return;i.innerHTML=``;let a=r.counselorContacts.toLowerCase().trim(),o=t.counselorContacts.filter(e=>a?(e.name||``).toLowerCase().includes(a)||(e.email||``).toLowerCase().includes(a)||(e.credentials||``).toLowerCase().includes(a):!0),s=a?o.length:e,c=n.counselorContacts,l=Math.ceil(s/c.pageSize)||1,u=a?o.slice((c.page-1)*c.pageSize,c.page*c.pageSize):o;if(u.length===0){i.innerHTML=`<tr><td colspan="6" class="text-secondary" style="text-align:center; padding:32px;">No counselor applications found.</td></tr>`,g(`counselor-contact-pagination`,c.page,l,e=>{n.counselorContacts.page=e,P()});return}u.forEach(e=>{let t=document.createElement(`tr`);t.innerHTML=`
      <td><strong style="color:white;">${e.name}</strong></td>
      <td><span class="text-secondary">${e.email}</span></td>
      <td><span class="text-secondary">${e.phone||`N/A`}</span></td>
      <td><span class="badge-role">${e.credentials}</span></td>
      <td><span>${V(e.createdAt)}</span></td>
      <td class="text-right">
        <button class="btn-view-details" onclick="openInquiryDetails('counselor', '${e.id}')" style="margin-right: 6px;">
          <i class="bx bx-show"></i> View
        </button>
        <button class="btn-view-details" onclick="deleteInquiry('counselor', '${e.id}')" style="background: rgba(220, 38, 38, 0.2); border-color: rgba(220, 38, 38, 0.4); color: #ef4444;">
          <i class="bx bx-trash"></i>
        </button>
      </td>
    `,i.appendChild(t)}),g(`counselor-contact-pagination`,c.page,l,e=>{n.counselorContacts.page=e,P()})}async function I(){let e=await u(`/contacts/general?page=${n.generalContacts.page}&limit=${n.generalContacts.pageSize}`);e&&e.contacts&&(t.generalContacts=e.contacts,L(e.total))}function L(e=t.generalContacts.length){let i=document.getElementById(`general-contact-list`);if(!i)return;i.innerHTML=``;let a=r.generalContacts.toLowerCase().trim(),o=t.generalContacts.filter(e=>a?(e.name||``).toLowerCase().includes(a)||(e.email||``).toLowerCase().includes(a)||(e.subject||``).toLowerCase().includes(a)||(e.message||``).toLowerCase().includes(a):!0),s=a?o.length:e,c=n.generalContacts,l=Math.ceil(s/c.pageSize)||1,u=a?o.slice((c.page-1)*c.pageSize,c.page*c.pageSize):o;if(u.length===0){i.innerHTML=`<tr><td colspan="5" class="text-secondary" style="text-align:center; padding:32px;">No contact inquiries found.</td></tr>`,g(`general-contact-pagination`,c.page,l,e=>{n.generalContacts.page=e,I()});return}u.forEach(e=>{let t=document.createElement(`tr`);t.innerHTML=`
      <td><strong style="color:white;">${e.name}</strong></td>
      <td><span class="text-secondary">${e.email}</span></td>
      <td><span class="badge-role">${e.subject||`General Inquiry`}</span></td>
      <td><span>${V(e.createdAt)}</span></td>
      <td class="text-right">
        <button class="btn-view-details" onclick="openInquiryDetails('general', '${e.id}')" style="margin-right: 6px;">
          <i class="bx bx-show"></i> View
        </button>
        <button class="btn-view-details" onclick="deleteInquiry('general', '${e.id}')" style="background: rgba(220, 38, 38, 0.2); border-color: rgba(220, 38, 38, 0.4); color: #ef4444;">
          <i class="bx bx-trash"></i>
        </button>
      </td>
    `,i.appendChild(t)}),g(`general-contact-pagination`,c.page,l,e=>{n.generalContacts.page=e,I()})}function R(e,n){let r=null,i=``,a=``,o=[];if(e===`university`?(r=t.universityContacts.find(e=>e.id===n),i=`University Onboarding Inquiry`,a=`From ${r?.universityName||`Campus`}`,o=[{label:`Campus / College Name`,value:r?.universityName},{label:`Contact Person Name`,value:r?.name},{label:`Staff Role / Title`,value:r?.role},{label:`Official Email`,value:r?.email},{label:`Phone Number`,value:r?.phone||`Not provided`},{label:`Inquiry Message`,value:r?.message,isTextarea:!0},{label:`Received At`,value:V(r?.createdAt)+` `+new Date(r?.createdAt).toLocaleTimeString()}]):e===`counselor`?(r=t.counselorContacts.find(e=>e.id===n),i=`Counselor Application Details`,a=`From ${r?.name||`Applicant`}`,o=[{label:`Applicant Full Name`,value:r?.name},{label:`Email Address`,value:r?.email},{label:`Phone Number`,value:r?.phone||`Not provided`},{label:`Vetted Credentials & Licenses`,value:r?.credentials},{label:`Professional Experience Summary`,value:r?.experience,isTextarea:!0},{label:`Cover Note / Message`,value:r?.message,isTextarea:!0},{label:`Received At`,value:V(r?.createdAt)+` `+new Date(r?.createdAt).toLocaleTimeString()}]):e===`general`&&(r=t.generalContacts.find(e=>e.id===n),i=`General Contact Inquiry`,a=`From ${r?.name||`Visitor`}`,o=[{label:`Sender Name`,value:r?.name},{label:`Sender Email Address`,value:r?.email},{label:`Subject Category`,value:r?.subject||`General Assistance`},{label:`Message Details`,value:r?.message,isTextarea:!0},{label:`Received At`,value:V(r?.createdAt)+` `+new Date(r?.createdAt).toLocaleTimeString()}]),!r)return;document.getElementById(`inquiry-modal-title`).textContent=i,document.getElementById(`inquiry-modal-subtitle`).textContent=a;let s=document.getElementById(`inquiry-details-container`);s.innerHTML=``,o.forEach(e=>{let t=document.createElement(`div`);t.style.display=`flex`,t.style.flexDirection=`column`,t.style.gap=`6px`,t.style.borderBottom=`1px solid rgba(255, 255, 255, 0.05)`,t.style.paddingBottom=`12px`;let n=document.createElement(`span`);n.style.fontSize=`11px`,n.style.color=`rgba(255, 255, 255, 0.4)`,n.style.textTransform=`uppercase`,n.style.letterSpacing=`0.05em`,n.style.fontWeight=`bold`,n.textContent=e.label;let r;e.isTextarea?(r=document.createElement(`div`),r.style.fontSize=`13.5px`,r.style.color=`#e2e8f0`,r.style.lineHeight=`1.6`,r.style.background=`rgba(0, 0, 0, 0.2)`,r.style.padding=`12px`,r.style.borderRadius=`8px`,r.style.whiteSpace=`pre-wrap`,r.textContent=e.value||`N/A`):(r=document.createElement(`span`),r.style.fontSize=`14px`,r.style.color=`#ffffff`,r.style.fontWeight=`500`,r.textContent=e.value||`N/A`),t.appendChild(n),t.appendChild(r),s.appendChild(t)}),document.getElementById(`modal-inquiry`).classList.remove(`hidden`)}function z(){let e=document.getElementById(`modal-inquiry`);e&&e.classList.add(`hidden`)}async function B(n,r){if(confirm(`Are you sure you want to permanently delete this ${n} inquiry record?`))try{let i=await fetch(`${e}/contacts/${n}/${r}`,{method:`DELETE`,headers:{Authorization:`Bearer ${t.token}`}});if(!i.ok){let e=await i.json();throw Error(e.error||`Failed to delete record.`)}alert(`Record deleted successfully.`),z(),n===`university`?await M():n===`counselor`?await P():n===`general`&&await I()}catch(e){console.error(`Delete inquiry failed:`,e),alert(e.message||`Failed to delete inquiry`)}}function V(e){if(!e)return`N/A`;let t=new Date(e);return isNaN(t.getTime())?e:t.toLocaleDateString(`en-US`,{month:`short`,day:`numeric`,year:`numeric`})}async function H(n,r){try{let i=await fetch(`${e}${n}`,{method:`POST`,headers:{Authorization:`Bearer ${t.token}`,"Content-Type":`application/json`},body:JSON.stringify(r)});if(i.status===401||i.status===403)return t.token=null,localStorage.removeItem(`admin_token`),o(),null;if(!i.ok){let e=await i.json();throw Error(e.error||`HTTP error! Status: ${i.status}`)}return await i.json()}catch(e){return console.error(`API Post failed for ${n}:`,e),null}}async function U(n){try{let r=await fetch(`${e}${n}`,{method:`DELETE`,headers:{Authorization:`Bearer ${t.token}`}});if(r.status===401||r.status===403)return t.token=null,localStorage.removeItem(`admin_token`),o(),null;if(!r.ok){let e=await r.json();throw Error(e.error||`HTTP error! Status: ${r.status}`)}return await r.json()}catch(e){return console.error(`API Delete failed for ${n}:`,e),null}}async function W(){let[e,t,n]=await Promise.all([u(`/talk/rooms`),u(`/talk/moderation`),u(`/admin/talk/metrics`)]);G(e||[]),K(t||{notes:[],replies:[]},n)}function G(e){let t=document.getElementById(`admin-rooms-list`);if(t){if(e.length===0){t.innerHTML=`<div style="color: rgba(255,255,255,0.4); text-align: center; padding: 10px;">No rooms active.</div>`;return}t.innerHTML=e.map(e=>`
    <div class="glass-card" style="padding: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: rgba(255,255,255,0.02);">
      <div style="flex: 1; min-width: 0; text-align: left;">
        <div style="font-weight: 700; color: white; font-size: 13px;">${q(e.name)}</div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${q(e.description||`No description`)}
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button onclick="deleteTalkRoom('${e.id}')" class="btn-secondary" style="padding: 6px 10px; border-radius: 6px; font-size: 11px; border: none; background: rgba(239, 68, 68, 0.1); color: #f87171; cursor: pointer;">
          Delete
        </button>
      </div>
    </div>
  `).join(``)}}function K(e,t){let n=document.getElementById(`flagged-content-list`),r=document.getElementById(`flagged-empty-state`);if(!n)return;let{notes:i=[],replies:a=[]}=e,o=i.length+a.length;if(t)document.getElementById(`kpi-talk-cost`).textContent=`$${t.totalCostUsd.toFixed(4)}`,document.getElementById(`kpi-talk-messages`).textContent=(t.totalNotes+t.totalReplies).toLocaleString(),document.getElementById(`kpi-talk-flagged`).textContent=(t.flaggedNotes+t.flaggedReplies).toLocaleString(),document.getElementById(`kpi-talk-rooms`).textContent=t.totalRooms.toLocaleString();else{let e=0,t=0;i.forEach(n=>{e+=n.inputTokens||0,t+=n.outputTokens||0}),a.forEach(n=>{e+=n.inputTokens||0,t+=n.outputTokens||0});let n=e*75e-9+t*3e-7;document.getElementById(`kpi-talk-cost`).textContent=`$${n.toFixed(4)}`,document.getElementById(`kpi-talk-messages`).textContent=o,document.getElementById(`kpi-talk-flagged`).textContent=o,document.getElementById(`kpi-talk-rooms`).textContent=rooms.length}if(o===0){n.innerHTML=``,r&&r.classList.remove(`hidden`);return}r&&r.classList.add(`hidden`);let s=``;i.forEach(e=>{let t=e.isReported&&e.status===`PENDING`?`User Flagged`:e.moderationReason||`AI Crisis Risk Detected`;s+=`
      <tr>
        <td>
          <span class="badge-role" style="background: rgba(239, 68, 68, 0.15); color: #f87171; font-size: 11px; padding: 2px 6px; border-radius: 4px;">
            Note
          </span>
        </td>
        <td>
          <div style="font-weight: 600; color: white;">${q(e.room?.name||`Unknown Room`)}</div>
          <div style="font-size: 10px; color: rgba(255,255,255,0.4);">${V(e.createdAt)}</div>
        </td>
        <td>
          <span style="font-size: 12px; color: rgba(255,255,255,0.8);">${q(e.nickname)}</span>
        </td>
        <td>
          <div style="font-size: 12px; color: white; max-width: 300px; white-space: normal; word-break: break-word;">
            "${q(e.content)}"
          </div>
        </td>
        <td>
          <span style="font-size: 11px; color: #f87171; font-weight: 500;">${q(t)}</span>
        </td>
        <td class="text-right">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <button onclick="resolveModeration('note', '${e.id}', 'approve')" class="btn-primary small" style="background: #22c55e; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
              Approve
            </button>
            <button onclick="resolveModeration('note', '${e.id}', 'reject')" class="btn-secondary small" style="background: rgba(239, 68, 68, 0.1); color: #f87171; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
              Reject
            </button>
          </div>
        </td>
      </tr>
    `}),a.forEach(e=>{let t=e.status===`PENDING`?`User Flagged`:e.moderationReason||`AI Crisis Risk Detected`;s+=`
      <tr>
        <td>
          <span class="badge-role" style="background: rgba(249, 115, 22, 0.15); color: #fb923c; font-size: 11px; padding: 2px 6px; border-radius: 4px;">
            Reply
          </span>
        </td>
        <td>
          <div style="font-weight: 600; color: white;">Room: ${q(e.note?.room?.name||`Unknown`)}</div>
          <div style="font-size: 10px; color: rgba(255,255,255,0.4); max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            Note: "${q(e.note?.content||``)}"
          </div>
        </td>
        <td>
          <span style="font-size: 12px; color: rgba(255,255,255,0.8);">${q(e.nickname)}</span>
        </td>
        <td>
          <div style="font-size: 12px; color: white; max-width: 300px; white-space: normal; word-break: break-word;">
            "${q(e.content)}"
          </div>
        </td>
        <td>
          <span style="font-size: 11px; color: #fb923c; font-weight: 500;">${q(t)}</span>
        </td>
        <td class="text-right">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <button onclick="resolveModeration('reply', '${e.id}', 'approve')" class="btn-primary small" style="background: #22c55e; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
              Approve
            </button>
            <button onclick="resolveModeration('reply', '${e.id}', 'reject')" class="btn-secondary small" style="background: rgba(239, 68, 68, 0.1); color: #f87171; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
              Reject
            </button>
          </div>
        </td>
      </tr>
    `}),n.innerHTML=s}window.deleteTalkRoom=async function(e){if(confirm(`Are you sure you want to delete this TalkRoom? All messages inside it will be deleted.`)){let t=await U(`/talk/rooms/${e}`);t&&t.success&&W()}},window.resolveModeration=async function(e,t,n){let r=await H(`/talk/moderation/${e}/${t}/resolve`,{action:n});r&&r.success&&W()};function q(e){return e?e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`):``}
(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`http://localhost:5000/api`;e.endsWith(`/`)&&(e=e.slice(0,-1)),e.endsWith(`/api`)||(e+=`/api`);var t=e,n={token:localStorage.getItem(`admin_token`)||null,activeTab:`overview`,students:[],quizzes:[],feedbacks:[],metrics:null,universityContacts:[],counselorContacts:[],generalContacts:[],activeInquiry:null,activeQuizId:null,activeStudentDetail:null,charts:{submissionsTrend:null,severityDonut:null,moodsBar:null,studentMoodTimeline:null}},r={students:{page:1,pageSize:6},feedbacks:{page:1,pageSize:5},qdSubmissions:{page:1,pageSize:5},studentHistory:{page:1,pageSize:4},universityContacts:{page:1,pageSize:5},counselorContacts:{page:1,pageSize:5},generalContacts:{page:1,pageSize:5}},i={students:``,feedbacks:``,qdSubmissions:``,studentHistory:``,universityContacts:``,counselorContacts:``,generalContacts:``},a={feedbacks:{wouldUse:``,reachFirst:``},qdSubmissions:{severity:``}};document.addEventListener(`DOMContentLoaded`,()=>{o(),s()});function o(){let e=document.getElementById(`login-form`);e&&e.addEventListener(`submit`,c),document.querySelectorAll(`.nav-item`).forEach(e=>{e.addEventListener(`click`,e=>{let t=e.currentTarget.getAttribute(`data-tab`);t!==`quizzes`&&T(),u(t)})});let t=document.getElementById(`logout-btn`);t&&t.addEventListener(`click`,l);let n=document.getElementById(`search-student`);n&&n.addEventListener(`input`,e=>{i.students=e.target.value,r.students.page=1,b()});let o=document.getElementById(`search-feedback`);o&&o.addEventListener(`input`,e=>{i.feedbacks=e.target.value,r.feedbacks.page=1,E()});let s=document.getElementById(`filter-would-use`);s&&s.addEventListener(`change`,e=>{a.feedbacks.wouldUse=e.target.value,r.feedbacks.page=1,E()});let d=document.getElementById(`filter-reach-first`);d&&d.addEventListener(`change`,e=>{a.feedbacks.reachFirst=e.target.value,r.feedbacks.page=1,E()});let f=document.getElementById(`btn-back-to-quizzes`);f&&f.addEventListener(`click`,T);let m=document.getElementById(`search-qd-submissions`);m&&m.addEventListener(`input`,e=>{i.qdSubmissions=e.target.value,r.qdSubmissions.page=1,P()});let h=document.getElementById(`filter-qd-severity`);h&&h.addEventListener(`change`,e=>{a.qdSubmissions.severity=e.target.value,r.qdSubmissions.page=1,P()});let g=document.getElementById(`search-student-history`);g&&g.addEventListener(`input`,e=>{i.studentHistory=e.target.value,r.studentHistory.page=1,N()});let _=document.getElementById(`search-university-contact`);_&&_.addEventListener(`input`,e=>{i.universityContacts=e.target.value,r.universityContacts.page=1,R()});let v=document.getElementById(`search-counselor-contact`);v&&v.addEventListener(`input`,e=>{i.counselorContacts=e.target.value,r.counselorContacts.page=1,B()});let y=document.getElementById(`search-general-contact`);y&&y.addEventListener(`input`,e=>{i.generalContacts=e.target.value,r.generalContacts.page=1,H()}),window.addEventListener(`keydown`,e=>{e.key===`Escape`&&(j(),I(),k(),U())}),window.closeStudentModal=j,window.closeAssessmentModal=I,window.openAssessmentSheet=F,window.openStudentDetails=A,window.closeSurveyModal=k,window.openSurveyModal=O,window.openQuizDetails=w,window.openInquiryDetails=ee,window.closeInquiryModal=U,window.deleteInquiry=W;let x=document.getElementById(`btn-open-create-room`),S=document.getElementById(`btn-cancel-create-room`),C=document.getElementById(`create-room-form-container`);x&&C&&x.addEventListener(`click`,()=>{C.classList.remove(`hidden`),x.classList.add(`hidden`)}),S&&C&&x&&S.addEventListener(`click`,()=>{C.classList.add(`hidden`),x.classList.remove(`hidden`);let e=document.getElementById(`new-room-name`),t=document.getElementById(`new-room-desc`);e&&(e.value=``),t&&(t.value=``)});let D=document.getElementById(`btn-submit-create-room`);D&&D.addEventListener(`click`,async e=>{e.preventDefault();let t=document.getElementById(`new-room-name`),n=document.getElementById(`new-room-desc`);if(!t)return;let r=t.value.trim(),i=n?n.value.trim():``;if(!r){alert(`Room name is required.`);return}await p(`/talk/rooms`,{name:r,description:i})&&(t.value=``,n&&(n.value=``),C&&x&&(C.classList.add(`hidden`),x.classList.remove(`hidden`)),K())})}function s(){let e=document.getElementById(`login-container`),t=document.getElementById(`app-container`);n.token?(e.classList.add(`hidden`),t.classList.remove(`hidden`),g()):(e.classList.remove(`hidden`),t.classList.add(`hidden`))}async function c(e){e.preventDefault();let r=document.getElementById(`email`),i=document.getElementById(`password`),a=document.getElementById(`login-error`),o=document.getElementById(`error-message`),c=r.value.trim(),l=i.value;a.classList.add(`hidden`);try{let e=await fetch(`${t}/auth/login`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({email:c,password:l,role:`ADMIN`})}),r=await e.json();if(!e.ok)throw Error(r.error||`Login failed. Please try again.`);n.token=r.token,localStorage.setItem(`admin_token`,r.token),s()}catch(e){console.error(`Login error:`,e),o.textContent=e.message,a.classList.remove(`hidden`)}}function l(){confirm(`Are you sure you want to sign out from the Admin Portal?`)&&(n.token=null,localStorage.removeItem(`admin_token`),y(),s())}function u(e){n.activeTab=e,document.querySelectorAll(`.nav-item`).forEach(t=>{t.getAttribute(`data-tab`)===e?t.classList.add(`active`):t.classList.remove(`active`)}),document.querySelectorAll(`.tab-pane`).forEach(t=>{t.id===`tab-${e}`?t.classList.remove(`hidden`):t.classList.add(`hidden`)});let t=document.getElementById(`view-title`),r=document.getElementById(`view-subtitle`);switch(e){case`overview`:t.textContent=`Dashboard Overview`,r.textContent=`Summary and trends across WellMindly students.`;break;case`university`:t.textContent=`University Onboarding Requests`,r.textContent=`Review and manage collaboration requests from university administrations.`,L();break;case`moderation`:t.textContent=`TalkMindly Moderation`,r.textContent=`Review anonymous peer chat flags, track AI costs, and manage TalkRooms.`,K();break;case`counselors`:t.textContent=`Counselor Applications`,r.textContent=`Review therapist and student coach onboarding applications.`,z();break;case`contacts`:t.textContent=`General Contacts`,r.textContent=`Review and manage general student and visitor support contact inquiries.`,V();break;case`students`:t.textContent=`Student Directory`,r.textContent=`Browse and review student profiles and check-in timelines.`;break;case`quizzes`:t.textContent=`Interactive Assessments`,r.textContent=`Inspect blueprints, and analyze student response sheets.`;break;case`feedback`:t.textContent=`Product Feedback`,r.textContent=`Review student product reviews and experience survey ratings.`,fetchFeedbacks();break;case`counselor-mgmt`:t.textContent=`Counselor Portal Provisioning`,r.textContent=`Invite new counselors, manage credentials, and toggle account statuses.`,Y();break;case`master-calendar`:t.textContent=`Master Sessions Calendar`,r.textContent=`View all scheduled student counseling sessions across all counselors.`,Z();break;case`dual-feedback`:t.textContent=`Dual Feedback Analytics`,r.textContent=`Inspect Student-to-Counselor ratings and Counselor clinical evaluations.`,ne();break}}async function d(e,r={}){try{let i=await fetch(`${t}${e}`,{...r,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${n.token}`,...r.headers||{}}});if(i.status===401&&!e.includes(`/v1/admin`))return n.token=null,localStorage.removeItem(`admin_token`),s(),null;if(!i.ok){let e=await i.json().catch(()=>({}));throw Error(e.error?.message||e.error||`HTTP error! Status: ${i.status}`)}return await i.json()}catch(t){return console.error(`API Fetch failed for ${e}:`,t),null}}async function f(e){return d(e,{method:`GET`})}async function p(e,t){return d(e,{method:`POST`,body:JSON.stringify(t)})}async function m(e,t){return d(e,{method:`PUT`,body:JSON.stringify(t)})}async function h(e){return d(e,{method:`DELETE`})}async function g(){let[e,t,r,i]=await Promise.all([d(`/admin/metrics`),d(`/admin/students`),d(`/admin/quizzes`),d(`/admin/feedbacks`)]);e&&(n.metrics=e),t&&(n.students=t.students||[]),r&&(n.quizzes=r.quizzes||[]),i&&(n.feedbacks=i.feedbacks||[]),_(),b(),S(),E()}function _(){if(!n.metrics)return;let e=n.students.length,t=n.metrics.totalSubmissions||0,r=0;n.metrics.classificationMetrics.forEach(e=>{e.classification.toLowerCase().includes(`severe`)&&(r+=e.count)}),document.getElementById(`kpi-students`).textContent=e,document.getElementById(`kpi-submissions`).textContent=t,document.getElementById(`kpi-critical`).textContent=r,document.getElementById(`kpi-mood`).textContent=`3.8 / 5.0`,v()}function v(){y();let e=n.metrics;if(!e)return;let t=document.getElementById(`chart-submissions`).getContext(`2d`),r=[...e.submissionTrend||[]].sort((e,t)=>new Date(e.date)-new Date(t.date)),i=r.map(e=>G(e.date)),a=r.map(e=>e.count);n.charts.submissionsTrend=new Chart(t,{type:`line`,data:{labels:i.length?i:[`No Data`],datasets:[{label:`Submissions`,data:a.length?a:[0],borderColor:`hsl(255, 48%, 60%)`,backgroundColor:`rgba(124, 58, 237, 0.08)`,borderWidth:2.5,fill:!0,tension:.35,pointBackgroundColor:`hsl(255, 48%, 60%)`,pointHoverRadius:6}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{y:{grid:{color:`rgba(255, 255, 255, 0.03)`},ticks:{color:`rgba(255, 255, 255, 0.5)`,stepSize:1}},x:{grid:{display:!1},ticks:{color:`rgba(255, 255, 255, 0.5)`}}}}});let o=document.getElementById(`chart-severity`).getContext(`2d`),s={};e.classificationMetrics.forEach(e=>{let t=e.classification;if(t.startsWith(`{`))try{t=JSON.parse(t).classification||`Completed`}catch{}s[t]=(s[t]||0)+e.count});let c=Object.keys(s),l=Object.values(s),u=c.map(e=>{let t=e.toLowerCase();return t.includes(`severe`)||t.includes(`distress`)||t.includes(`stretch`)||t.includes(`high`)?`hsl(352, 65%, 54%)`:t.includes(`moderate`)||t.includes(`elevated`)||t.includes(`finding`)?`hsl(35, 75%, 54%)`:t.includes(`mild`)||t.includes(`steady`)?`hsl(155, 55%, 46%)`:t.includes(`minimal`)||t.includes(`low`)||t.includes(`doing well`)||t.includes(`excellent`)||t.includes(`positive`)||t.includes(`bright`)||t.includes(`stable`)?`hsl(185, 55%, 50%)`:`hsl(235, 50%, 65%)`});n.charts.severityDonut=new Chart(o,{type:`doughnut`,data:{labels:c.length?c:[`No Assessments`],datasets:[{data:l.length?l:[1],backgroundColor:u.length?u:[`rgba(255, 255, 255, 0.08)`],borderWidth:0,hoverOffset:3}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:`right`,labels:{color:`rgba(255, 255, 255, 0.7)`,font:{size:11}}}},cutout:`70%`}});let d=document.getElementById(`chart-moods`).getContext(`2d`),f={1:1,2:2,3:4,4:6,5:3};n.charts.moodsBar=new Chart(d,{type:`bar`,data:{labels:[`1 (Struggling)`,`2 (Low)`,`3 (Steady)`,`4 (Good)`,`5 (Excellent)`],datasets:[{label:`Logs Count`,data:Object.values(f),backgroundColor:[`rgba(244, 63, 94, 0.5)`,`rgba(245, 158, 11, 0.5)`,`rgba(16, 185, 129, 0.5)`,`rgba(14, 165, 233, 0.5)`,`rgba(168, 85, 247, 0.5)`],borderRadius:6,borderWidth:0}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{y:{grid:{color:`rgba(255, 255, 255, 0.03)`},ticks:{color:`rgba(255, 255, 255, 0.5)`,stepSize:1}},x:{grid:{display:!1},ticks:{color:`rgba(255, 255, 255, 0.5)`}}}}})}function y(){Object.keys(n.charts).forEach(e=>{n.charts[e]&&(n.charts[e].destroy(),n.charts[e]=null)})}function b(){let e=document.getElementById(`students-list`);if(!e)return;e.innerHTML=``;let t=i.students.toLowerCase().trim(),a=n.students.filter(e=>{if(!t)return!0;let n=`${e.firstName} ${e.lastName}`.toLowerCase(),r=(e.email||``).toLowerCase(),i=(e.university?.name||``).toLowerCase();return n.includes(t)||r.includes(t)||i.includes(t)}),o=a.length,s=r.students,c=Math.ceil(o/s.pageSize)||1;s.page>c&&(s.page=c);let l=(s.page-1)*s.pageSize,u=a.slice(l,l+s.pageSize);if(u.length===0){e.innerHTML=`
      <tr>
        <td colspan="5" style="text-align: center; padding: 32px; color: rgba(255, 255, 255, 0.4)">
          <i class="bx bx-user-x" style="font-size: 24px; margin-bottom: 8px; display: block"></i>
          No students found matching your query.
        </td>
      </tr>
    `,x(`students-pagination`,s.page,c,e=>{r.students.page=e,b()});return}u.forEach(t=>{let n=document.createElement(`tr`),r=`${t.firstName} ${t.lastName}`,i=t.university?.name||`Self Registered`,a=G(t.createdAt);n.innerHTML=`
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
    `,e.appendChild(n)}),x(`students-pagination`,s.page,c,e=>{r.students.page=e,b()})}function x(e,t,n,r){let i=document.getElementById(e);if(!i)return;i.innerHTML=``;let a=document.createElement(`button`);a.className=`btn-page`,a.disabled=t===1,a.innerHTML=`<i class="bx bx-chevron-left"></i>`,a.addEventListener(`click`,()=>r(t-1)),i.appendChild(a);for(let e=1;e<=n;e++){let n=document.createElement(`button`);n.className=`btn-page ${e===t?`active`:``}`,n.textContent=e,n.addEventListener(`click`,()=>r(e)),i.appendChild(n)}let o=document.createElement(`button`);o.className=`btn-page`,o.disabled=t===n,o.innerHTML=`<i class="bx bx-chevron-right"></i>`,o.addEventListener(`click`,()=>r(t+1)),i.appendChild(o)}function S(){let e=document.getElementById(`quizzes-list`);if(!e)return;if(e.innerHTML=``,n.quizzes.length===0){e.innerHTML=`<div class="empty-state"><i class="bx bx-book-open"></i>No quizzes configured in database.</div>`;return}let t=[`Emotional check-in`,`Mood snapshot`,`Mental load`,`Headspace`,`Your circle`,`Running on empty`,`Signature strengths`,`Personality profile`,`What matters most`,`Strength & shadow`,`Your season`],r=n.quizzes.filter(e=>t.includes(e.title)),i=n.quizzes.filter(e=>!t.includes(e.title)),a=``;r.length>0&&(a+=`
      <div style="grid-column: 1 / -1; margin-bottom: 8px;">
        <h3 style="color: white; font-size: 16px; font-weight: 700; margin-bottom: 4px;">Active Self-Discovery Blueprints</h3>
        <p class="text-secondary" style="font-size: 12.5px; margin-bottom: 12px;">Current client-approved non-clinical assessments.</p>
      </div>
    `,r.forEach(e=>{a+=C(e)})),i.length>0&&(a+=`
      <div style="grid-column: 1 / -1; margin-top: 24px; margin-bottom: 8px;">
        <h3 style="color: white; font-size: 16px; font-weight: 700; margin-bottom: 4px;">Legacy & Clinical Assessments</h3>
        <p class="text-secondary" style="font-size: 12.5px; margin-bottom: 12px;">Archived or clinical diagnostic tests (e.g. PHQ-9) from previous database states.</p>
      </div>
    `,i.forEach(e=>{a+=C(e)})),e.innerHTML=a,n.quizzes.forEach(e=>{let t=document.getElementById(`quiz-card-${e.id}`);t&&t.addEventListener(`click`,()=>w(e.id))})}function C(e){let t=![`Emotional check-in`,`Mood snapshot`,`Mental load`,`Headspace`,`Your circle`,`Running on empty`,`Signature strengths`,`Personality profile`,`What matters most`,`Strength & shadow`,`Your season`].includes(e.title),n=t?`style="border-color: rgba(255,255,255,0.06); opacity: 0.8;"`:``,r=t?`style="background-color: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6);"`:``;return`
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
  `}async function w(e){n.activeQuizId=e;let t=n.quizzes.find(t=>t.id===e);if(!t)return;document.getElementById(`quizzes-hub-view`).classList.add(`hidden`),document.getElementById(`quiz-detail-view`).classList.remove(`hidden`),document.getElementById(`qd-title`).textContent=t.title,document.getElementById(`qd-category`).textContent=t.category,document.getElementById(`qd-description`).textContent=t.description||`Self-reflection interactive test.`;let o=document.getElementById(`qd-questions-list`);o.innerHTML=``,t.questions&&t.questions.length>0?t.questions.forEach(e=>{let t=document.createElement(`div`);t.className=`blueprint-item`;let n=``;e.options&&e.options.length>0&&e.options.forEach(e=>{n+=`<span class="bp-option-pill">${e.label} (${e.points}pts)</span>`}),t.innerHTML=`
        <div class="bp-q-text">${e.index}. ${e.text}</div>
        <div class="bp-options-pills">${n}</div>
      `,o.appendChild(t)}):o.innerHTML=`<p class="text-secondary">No questions blueprints available.</p>`,r.qdSubmissions.page=1,i.qdSubmissions=``,document.getElementById(`search-qd-submissions`).value=``,document.getElementById(`filter-qd-severity`).value=``,a.qdSubmissions.severity=``,P()}function T(){document.getElementById(`quizzes-hub-view`).classList.remove(`hidden`),document.getElementById(`quiz-detail-view`).classList.add(`hidden`),n.activeQuizId=null}function E(){let e=document.getElementById(`feedback-list`);if(!e)return;e.innerHTML=``;let t=i.feedbacks.toLowerCase().trim(),o=a.feedbacks.wouldUse,s=a.feedbacks.reachFirst,c=n.feedbacks.filter(e=>{let n=e.result?.user,r=n?`${n.firstName} ${n.lastName}`.toLowerCase():``,i=n?n.email.toLowerCase():``,a=(e.comments||``).toLowerCase();if(!(!t||r.includes(t)||i.includes(t)||a.includes(t)))return!1;let c=D(e.comments);return!(o&&c.q3!==o||s&&c.q4!==s)}),l=c.filter(e=>e.comments).length,u=0;c.forEach(e=>u+=e.rating);let d=c.length>0?(u/c.length).toFixed(1):`0.0`;document.getElementById(`feedback-total-count`).textContent=l,document.getElementById(`feedback-avg-rating`).textContent=`${d} / 5.0`;let f=document.getElementById(`feedback-stars-display`);f.innerHTML=``;let p=Math.round(Number(d));for(let e=1;e<=5;e++){let t=document.createElement(`i`);t.className=e<=p?`bx bxs-star`:`bx bx-star`,f.appendChild(t)}let m=c.length,h=r.feedbacks,g=Math.ceil(m/h.pageSize)||1;h.page>g&&(h.page=g);let _=(h.page-1)*h.pageSize,v=c.slice(_,_+h.pageSize);if(v.length===0){e.innerHTML=`
      <tr>
        <td colspan="7" style="text-align: center; padding: 32px; color: rgba(255, 255, 255, 0.4)">
          <i class="bx bx-message-square-detail" style="font-size: 24px; margin-bottom: 8px; display: block"></i>
          No feedback matches the selected filters.
        </td>
      </tr>
    `,x(`feedback-pagination`,h.page,g,e=>{r.feedbacks.page=e,E()});return}v.forEach(t=>{let n=document.createElement(`tr`),r=t.result?.user,i=r?`${r.firstName} ${r.lastName}`:`Anonymous`,a=r?r.email:`Unknown`,o=t.result?.quiz?.title||`General`;G(t.createdAt);let s=``;for(let e=1;e<=5;e++)s+=e<=t.rating?`<i class="bx bxs-star" style="color: hsl(35, 75%, 54%)"></i>`:`<i class="bx bx-star" style="color: rgba(255,255,255,0.1)"></i>`;let c=D(t.comments),l=t.rating<=2?`style="border-left: 3px solid hsl(352, 65%, 54%); background-color: rgba(255,0,0,0.02)"`:``,u=c.q1.length>50?c.q1.substring(0,47)+`...`:c.q1||`<em class="text-secondary">No comment</em>`;n.innerHTML=`
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
    `,e.appendChild(n)}),x(`feedback-pagination`,h.page,g,e=>{r.feedbacks.page=e,E()})}function D(e){let t={q1:``,q2:``,q3:``,q4:``,q5:``,q6:``};return e?(e.split(`

`).forEach(e=>{let n=e.split(`
`);if(n.length>=2){let e=n[0].toLowerCase(),r=n.slice(1).join(`
`).trim();e.includes(`first few seconds`)?t.q1=r:e.includes(`describing you`)?t.q2=r:e.includes(`actually use`)?t.q3=r:e.includes(`reach for first`)?t.q4=r:e.includes(`felt off`)?t.q5=r:e.includes(`wish it did`)&&(t.q6=r)}}),!t.q1&&!t.q3&&!t.q4&&(t.q1=e),t):t}function O(e){document.getElementById(`modal-survey-details`).classList.remove(`hidden`);let t=n.feedbacks.find(t=>t.id===e);if(!t)return;let r=t.result?.user;document.getElementById(`survey-modal-meta`).textContent=r?`${r.firstName} ${r.lastName} • ${r.email}`:`Anonymous`;let i=D(t.comments),a=document.getElementById(`survey-answers-container`);a.innerHTML=``,[{key:`q1`,text:`1. In the first few seconds, what did you feel?`},{key:`q2`,text:`2. Did anything here feel like it was describing you?`},{key:`q3`,text:`3. Would you actually use something like this?`},{key:`q4`,text:`4. Which would you reach for first?`},{key:`q5`,text:`5. What felt off, fake, or like "just an app"?`},{key:`q6`,text:`6. Anything you'd change or wish it did?`}].forEach(e=>{let t=i[e.key];if(t){let n=document.createElement(`div`);n.className=`survey-question-block`,n.innerHTML=`
        <div class="survey-q-title">${e.text}</div>
        <div class="survey-q-ans">${t}</div>
      `,a.appendChild(n)}})}function k(){document.getElementById(`modal-survey-details`).classList.add(`hidden`)}async function A(e){document.getElementById(`modal-student`).classList.remove(`hidden`),document.getElementById(`modal-student-name`).textContent=`Loading Student File...`,document.getElementById(`modal-student-email`).textContent=``,document.getElementById(`student-quizzes-list`).innerHTML=`<div class="empty-state">Loading...</div>`;let t=await d(`/admin/students/${e}`);if(!t||!t.student){alert(`Failed to retrieve student profile.`),j();return}let a=t.student;n.activeStudentDetail=a,document.getElementById(`modal-student-name`).textContent=`${a.firstName} ${a.lastName}`,document.getElementById(`modal-student-email`).textContent=a.email,document.getElementById(`modal-avatar`).textContent=`${a.firstName.charAt(0)}${a.lastName.charAt(0)}`,M(a.dailyCheckins||[]),r.studentHistory.page=1,i.studentHistory=``,document.getElementById(`search-student-history`).value=``,N()}function j(){let e=document.getElementById(`modal-student`);e&&e.classList.add(`hidden`),n.activeStudentDetail=null,n.charts.studentMoodTimeline&&(n.charts.studentMoodTimeline.destroy(),n.charts.studentMoodTimeline=null)}function M(e){let t=document.getElementById(`student-mood-line-chart`).getContext(`2d`);n.charts.studentMoodTimeline&&n.charts.studentMoodTimeline.destroy();let r=[...e].reverse(),i=r.map(e=>G(e.createdAt)),a=r.map(e=>e.rating);n.charts.studentMoodTimeline=new Chart(t,{type:`line`,data:{labels:i.length?i:[`No Logs`],datasets:[{label:`Mood Rating`,data:a.length?a:[0],borderColor:`hsl(185, 55%, 50%)`,backgroundColor:`rgba(14, 165, 233, 0.08)`,borderWidth:2,fill:!0,tension:.35,pointBackgroundColor:`hsl(185, 55%, 50%)`,pointHoverRadius:5}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{y:{min:1,max:5,grid:{color:`rgba(255, 255, 255, 0.03)`},ticks:{color:`rgba(255, 255, 255, 0.5)`,stepSize:1}},x:{grid:{display:!1},ticks:{color:`rgba(255, 255, 255, 0.5)`}}}}})}function N(){let e=document.getElementById(`student-quizzes-list`);if(!e)return;e.innerHTML=``;let t=n.activeStudentDetail?.quizResults||[],a=i.studentHistory.toLowerCase().trim(),o=t.filter(e=>{if(!a)return!0;let t=(e.quiz?.title||``).toLowerCase(),n=(e.quiz?.category||``).toLowerCase(),r=``;if(e.classification)if(e.classification.startsWith(`{`))try{r=JSON.parse(e.classification).classification||``}catch{}else r=e.classification;return r=r.toLowerCase(),t.includes(a)||n.includes(a)||r.includes(a)}),s=o.length,c=r.studentHistory,l=Math.ceil(s/c.pageSize)||1;c.page>l&&(c.page=l);let u=(c.page-1)*c.pageSize,d=o.slice(u,u+c.pageSize);if(d.length===0){e.innerHTML=`<div class="empty-state"><i class="bx bx-notepad"></i>No assessments matches search.</div>`,x(`student-history-pagination`,c.page,l,e=>{r.studentHistory.page=e,N()});return}d.forEach(t=>{let n=document.createElement(`div`);n.className=`timeline-quiz-item`;let r=t.quiz?.title||`Assessment`,i=G(t.completedAt),a=`Completed`;if(t.classification)if(t.classification.startsWith(`{`))try{a=JSON.parse(t.classification).classification||`Completed`}catch{}else a=t.classification;let o=`style="color: hsl(235, 50%, 65%)"`,s=a.toLowerCase();s.includes(`severe`)?o=`style="color: hsl(352, 65%, 54%)"`:s.includes(`moderate`)?o=`style="color: hsl(35, 75%, 54%)"`:s.includes(`mild`)&&(o=`style="color: hsl(155, 55%, 46%)"`),n.innerHTML=`
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
    `,e.appendChild(n)}),x(`student-history-pagination`,c.page,l,e=>{r.studentHistory.page=e,N()})}async function P(){let e=document.getElementById(`qd-submissions-list`);if(!e)return;e.innerHTML=``;let t=n.activeQuizId,o=n.quizzes.find(e=>e.id===t);if(!o)return;let s=await d(`/admin/quiz-results?quizId=${t}`),c=s&&s.quizResults||[],l=i.qdSubmissions.toLowerCase().trim(),u=a.qdSubmissions.severity.toLowerCase().trim(),f=c.filter(e=>{let t=e.user,n=t?`${t.firstName} ${t.lastName}`.toLowerCase():``,r=t?t.email.toLowerCase():``,i=``;if(e.classification)if(e.classification.startsWith(`{`))try{i=JSON.parse(e.classification).classification||``}catch{}else i=e.classification;i=i.toLowerCase();let a=!l||n.includes(l)||r.includes(l),o=!u||i.includes(u);return a&&o}),p=f.length;document.getElementById(`qd-stat-attempts`).textContent=p;let m=0,h=0;f.forEach(e=>{m+=e.overallScore,e.overallScore>h&&(h=e.overallScore)});let g=p>0?Math.round(m/p):0;document.getElementById(`qd-stat-avg`).textContent=`${g} pts`,document.getElementById(`qd-stat-highest`).textContent=`${h} pts`;let _=r.qdSubmissions,v=Math.ceil(p/_.pageSize)||1;_.page>v&&(_.page=v);let y=(_.page-1)*_.pageSize,b=f.slice(y,y+_.pageSize);if(b.length===0){e.innerHTML=`
      <tr>
        <td colspan="5" style="text-align: center; padding: 24px; color: rgba(255, 255, 255, 0.4)">
          <i class="bx bx-notepad" style="font-size: 24px; margin-bottom: 8px; display: block"></i>
          No submissions found matching filters.
        </td>
      </tr>
    `,x(`qd-submissions-pagination`,_.page,v,e=>{r.qdSubmissions.page=e,P()});return}b.forEach(n=>{let r=document.createElement(`tr`),i=n.user,a=i?`${i.firstName} ${i.lastName}`:`Anonymous`,s=i?i.email:`Unknown`,c=G(n.completedAt),l=`Completed`;if(n.classification)if(n.classification.startsWith(`{`))try{l=JSON.parse(n.classification).classification||`Completed`}catch{}else l=n.classification;let u=`style="color: hsl(235, 50%, 65%)"`,d=l.toLowerCase();d.includes(`severe`)?u=`style="color: hsl(352, 65%, 54%)"`:d.includes(`moderate`)?u=`style="color: hsl(35, 75%, 54%)"`:d.includes(`mild`)&&(u=`style="color: hsl(155, 55%, 46%)"`),r.innerHTML=`
      <td>
        <div style="font-weight: 700; color: white">${a}</div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px">${s}</div>
      </td>
      <td><span class="text-secondary">${c}</span></td>
      <td><strong>${n.overallScore} / ${o.maxScore}</strong></td>
      <td><span ${u} style="font-weight: 600">${l}</span></td>
      <td class="text-right">
        <!-- Re-use assessment details modal (passing full details since it parses correctly) -->
        <button class="btn-view-details" onclick="openAssessmentSheetDirect('${n.id}', '${t}')">
          <i class="bx bx-file-find"></i> Review
        </button>
      </td>
    `,e.appendChild(r)}),x(`qd-submissions-pagination`,_.page,v,e=>{r.qdSubmissions.page=e,P()})}window.openAssessmentSheetDirect=async function(e,t){let r=await d(`/admin/quiz-results?quizId=${t}`),i=r&&r.quizResults||[];if(!i.find(t=>t.id===e)){alert(`Assessment results mapping failed.`);return}n.activeStudentDetail={quizResults:i},F(e)};async function F(e){document.getElementById(`modal-assessment`).classList.remove(`hidden`),document.getElementById(`assessment-modal-title`).textContent=`Loading Assessment Sheet...`,document.getElementById(`assessment-modal-meta`).textContent=``,document.getElementById(`assessment-score-earned`).textContent=`-`,document.getElementById(`assessment-classification`).textContent=``,document.getElementById(`assessment-ai-section`).classList.add(`hidden`);let t=document.getElementById(`assessment-answers-table-body`);t.innerHTML=`<tr><td colspan="4" style="text-align:center;">Loading answers...</td></tr>`;let r=null;if(n.activeStudentDetail&&n.activeStudentDetail.quizResults&&(r=n.activeStudentDetail.quizResults.find(t=>t.id===e)),!r){let t=n.feedbacks.find(t=>t.resultId===e);t&&t.result&&(r=t.result)}if(!r){alert(`Assessment detail page could not be parsed.`),I();return}let i=r.quiz?.title||`Interactive reflection`,a=r.quiz?.category||`Focus`,o=G(r.completedAt),s=r.quiz?.maxScore||100;document.getElementById(`assessment-modal-title`).textContent=i,document.getElementById(`assessment-modal-meta`).textContent=`${a} • Completed on ${o}`,document.getElementById(`assessment-score-earned`).textContent=r.overallScore,document.getElementById(`assessment-score-max`).textContent=s;let c=r.classification||`Completed`,l=c,u=null,d=null;if(c.startsWith(`{`))try{let e=JSON.parse(c);l=e.classification||`Completed`,u=e.aiFeedback||null,d=e.answers||null}catch{}let f=document.getElementById(`assessment-classification`);f.textContent=l;let p=document.getElementById(`assessment-badge-card`),m=l.toLowerCase();p.style.borderLeft=`6px solid hsl(235, 50%, 65%)`,f.style.color=`hsl(235, 50%, 65%)`,m.includes(`severe`)?(p.style.borderLeft=`6px solid hsl(352, 65%, 54%)`,f.style.color=`hsl(352, 65%, 54%)`):m.includes(`moderate`)?(p.style.borderLeft=`6px solid hsl(35, 75%, 54%)`,f.style.color=`hsl(35, 75%, 54%)`):m.includes(`mild`)&&(p.style.borderLeft=`6px solid hsl(155, 55%, 46%)`,f.style.color=`hsl(155, 55%, 46%)`);let h=document.getElementById(`assessment-ai-section`);if(u){h.classList.remove(`hidden`),document.getElementById(`ai-headline`).textContent=u.headline||``,document.getElementById(`ai-narrative`).textContent=u.narrative||``,document.getElementById(`ai-tip`).textContent=u.tip||``;let e=document.getElementById(`ai-insights`);e.innerHTML=``,u.insights&&Array.isArray(u.insights)&&u.insights.forEach(t=>{let n=document.createElement(`div`);n.className=`ai-insight-bullet`,n.innerHTML=`<i class="bx bx-right-arrow-alt"></i> <span>${t}</span>`,e.appendChild(n)})}else h.classList.add(`hidden`);if(t.innerHTML=``,!d){t.innerHTML=`<tr><td colspan="4" style="text-align:center;color:rgba(255,255,255,0.4)">No detailed answers saved in this result.</td></tr>`;return}let g=n.quizzes.find(e=>e.id===r.quizId),_=g?g.questions:[];if(_&&_.length>0)_.forEach((e,n)=>{let r=document.createElement(`tr`),i=`Option Selected`,a=0,o=null;if(d.responses&&Array.isArray(d.responses)?o=d.responses[n]:Array.isArray(d)?o=d[n]:d[e.id]===void 0?d[n]!==void 0&&(o=d[n]):o=d[e.id],o!==null)if(typeof o==`object`)i=o.label||o.text||JSON.stringify(o),a=o.points===void 0?0:o.points;else{let t=Number(o);if(e.options&&e.options.length>0){let n=e.options.find((e,n)=>e.points===t||n===t||e.label===o);n?(i=n.label,a=n.points):(i=`Value: ${o}`,a=isNaN(t)?0:t)}else i=`Response: ${o}`,a=isNaN(t)?0:t}else i=`Not Answered / Skipped`,a=0;r.innerHTML=`
        <td style="font-weight:700;">${e.index}</td>
        <td><strong style="color:white; font-size:12.5px;">${e.text}</strong></td>
        <td><span style="color:hsl(185, 55%, 50%); font-weight:600;"><i class="bx bx-check-double"></i> ${i}</span></td>
        <td class="text-right"><span class="ans-score-pill">+${a} pts</span></td>
      `,t.appendChild(r)});else{let e=``;if(d.scores&&typeof d.scores==`object`&&Object.entries(d.scores).forEach(([t,n],r)=>{let i=d.top&&d.top.includes(t),a=i?`<i class="bx bxs-star" style="color: hsl(35, 75%, 54%)"></i> `:``,o=i?`style="color: hsl(35, 75%, 54%); font-weight:700;"`:``;e+=`
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
        `})}e?t.innerHTML=e:t.innerHTML=`
        <tr>
          <td colspan="4" style="font-family: monospace; white-space: pre-wrap; font-size:11px; background-color: hsl(var(--bg-dark) / 0.8)">
  ${JSON.stringify(d,null,2)}
          </td>
        </tr>
      `}}function I(){let e=document.getElementById(`modal-assessment`);e&&e.classList.add(`hidden`)}async function L(){let e=await d(`/contacts/university?page=${r.universityContacts.page}&limit=${r.universityContacts.pageSize}`);e&&e.requests&&(n.universityContacts=e.requests,R(e.total))}function R(e=n.universityContacts.length){let t=document.getElementById(`university-contact-list`);if(!t)return;t.innerHTML=``;let a=i.universityContacts.toLowerCase().trim(),o=n.universityContacts.filter(e=>a?(e.universityName||``).toLowerCase().includes(a)||(e.name||``).toLowerCase().includes(a)||(e.role||``).toLowerCase().includes(a)||(e.email||``).toLowerCase().includes(a):!0),s=a?o.length:e,c=r.universityContacts,l=Math.ceil(s/c.pageSize)||1,u=a?o.slice((c.page-1)*c.pageSize,c.page*c.pageSize):o;if(u.length===0){t.innerHTML=`<tr><td colspan="7" class="text-secondary" style="text-align:center; padding:32px;">No university requests found.</td></tr>`,x(`university-contact-pagination`,c.page,l,e=>{r.universityContacts.page=e,L()});return}u.forEach(e=>{let n=document.createElement(`tr`);n.innerHTML=`
      <td><strong style="color:white;">${e.universityName}</strong></td>
      <td><span>${e.name}</span></td>
      <td><span class="badge-role">${e.role}</span></td>
      <td><span class="text-secondary">${e.email}</span></td>
      <td><span class="text-secondary">${e.phone||`N/A`}</span></td>
      <td><span>${G(e.createdAt)}</span></td>
      <td class="text-right">
        <button class="btn-view-details" onclick="openInquiryDetails('university', '${e.id}')" style="margin-right: 6px;">
          <i class="bx bx-show"></i> View
        </button>
        <button class="btn-view-details" onclick="deleteInquiry('university', '${e.id}')" style="background: rgba(220, 38, 38, 0.2); border-color: rgba(220, 38, 38, 0.4); color: #ef4444;">
          <i class="bx bx-trash"></i>
        </button>
      </td>
    `,t.appendChild(n)}),x(`university-contact-pagination`,c.page,l,e=>{r.universityContacts.page=e,L()})}async function z(){let e=await d(`/contacts/counselor?page=${r.counselorContacts.page}&limit=${r.counselorContacts.pageSize}`);e&&e.requests&&(n.counselorContacts=e.requests,B(e.total))}function B(e=n.counselorContacts.length){let t=document.getElementById(`counselor-contact-list`);if(!t)return;t.innerHTML=``;let a=i.counselorContacts.toLowerCase().trim(),o=n.counselorContacts.filter(e=>a?(e.name||``).toLowerCase().includes(a)||(e.email||``).toLowerCase().includes(a)||(e.credentials||``).toLowerCase().includes(a):!0),s=a?o.length:e,c=r.counselorContacts,l=Math.ceil(s/c.pageSize)||1,u=a?o.slice((c.page-1)*c.pageSize,c.page*c.pageSize):o;if(u.length===0){t.innerHTML=`<tr><td colspan="6" class="text-secondary" style="text-align:center; padding:32px;">No counselor applications found.</td></tr>`,x(`counselor-contact-pagination`,c.page,l,e=>{r.counselorContacts.page=e,z()});return}u.forEach(e=>{let n=document.createElement(`tr`);n.innerHTML=`
      <td><strong style="color:white;">${e.name}</strong></td>
      <td><span class="text-secondary">${e.email}</span></td>
      <td><span class="text-secondary">${e.phone||`N/A`}</span></td>
      <td><span class="badge-role">${e.credentials}</span></td>
      <td><span>${G(e.createdAt)}</span></td>
      <td class="text-right">
        <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
          <button class="btn-view-details" onclick="openInquiryDetails('counselor', '${e.id}')" title="View Application Details">
            <i class="bx bx-show"></i> View
          </button>
          <button class="btn-view-details" onclick="requestCounselorDocs('${e.id}')" style="background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4); color: #818cf8;" title="Request Certificates & Verification Docs">
            <i class="bx bx-file-find"></i> Docs
          </button>
          <button class="btn-view-details" onclick="approveCounselorApplication('${e.id}')" style="background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.4); color: #34d399;" title="Approve & Onboard Counselor">
            <i class="bx bx-check-shield"></i> Approve
          </button>
          <button class="btn-view-details" onclick="deleteInquiry('counselor', '${e.id}')" style="background: rgba(220, 38, 38, 0.2); border-color: rgba(220, 38, 38, 0.4); color: #ef4444;" title="Delete Application">
            <i class="bx bx-trash"></i>
          </button>
        </div>
      </td>
    `,t.appendChild(n)}),x(`counselor-contact-pagination`,c.page,l,e=>{r.counselorContacts.page=e,z()})}async function V(){let e=await d(`/contacts/general?page=${r.generalContacts.page}&limit=${r.generalContacts.pageSize}`);e&&e.contacts&&(n.generalContacts=e.contacts,H(e.total))}function H(e=n.generalContacts.length){let t=document.getElementById(`general-contact-list`);if(!t)return;t.innerHTML=``;let a=i.generalContacts.toLowerCase().trim(),o=n.generalContacts.filter(e=>a?(e.name||``).toLowerCase().includes(a)||(e.email||``).toLowerCase().includes(a)||(e.subject||``).toLowerCase().includes(a)||(e.message||``).toLowerCase().includes(a):!0),s=a?o.length:e,c=r.generalContacts,l=Math.ceil(s/c.pageSize)||1,u=a?o.slice((c.page-1)*c.pageSize,c.page*c.pageSize):o;if(u.length===0){t.innerHTML=`<tr><td colspan="5" class="text-secondary" style="text-align:center; padding:32px;">No contact inquiries found.</td></tr>`,x(`general-contact-pagination`,c.page,l,e=>{r.generalContacts.page=e,V()});return}u.forEach(e=>{let n=document.createElement(`tr`);n.innerHTML=`
      <td><strong style="color:white;">${e.name}</strong></td>
      <td><span class="text-secondary">${e.email}</span></td>
      <td><span class="badge-role">${e.subject||`General Inquiry`}</span></td>
      <td><span>${G(e.createdAt)}</span></td>
      <td class="text-right">
        <button class="btn-view-details" onclick="openInquiryDetails('general', '${e.id}')" style="margin-right: 6px;">
          <i class="bx bx-show"></i> View
        </button>
        <button class="btn-view-details" onclick="deleteInquiry('general', '${e.id}')" style="background: rgba(220, 38, 38, 0.2); border-color: rgba(220, 38, 38, 0.4); color: #ef4444;">
          <i class="bx bx-trash"></i>
        </button>
      </td>
    `,t.appendChild(n)}),x(`general-contact-pagination`,c.page,l,e=>{r.generalContacts.page=e,V()})}function ee(e,t){let r=null,i=``,a=``,o=[];if(e===`university`?(r=n.universityContacts.find(e=>e.id===t),i=`University Onboarding Inquiry`,a=`From ${r?.universityName||`Campus`}`,o=[{label:`Campus / College Name`,value:r?.universityName},{label:`Contact Person Name`,value:r?.name},{label:`Staff Role / Title`,value:r?.role},{label:`Official Email`,value:r?.email},{label:`Phone Number`,value:r?.phone||`Not provided`},{label:`Inquiry Message`,value:r?.message,isTextarea:!0},{label:`Received At`,value:G(r?.createdAt)+` `+new Date(r?.createdAt).toLocaleTimeString()}]):e===`counselor`?(r=n.counselorContacts.find(e=>e.id===t),i=`Counselor Application Details`,a=`From ${r?.name||`Applicant`}`,o=[{label:`Applicant Full Name`,value:r?.name},{label:`Email Address`,value:r?.email},{label:`Phone Number`,value:r?.phone||`Not provided`},{label:`Vetted Credentials & Licenses`,value:r?.credentials},{label:`Professional Experience Summary`,value:r?.experience,isTextarea:!0},{label:`Cover Note / Message`,value:r?.message,isTextarea:!0},{label:`Received At`,value:G(r?.createdAt)+` `+new Date(r?.createdAt).toLocaleTimeString()}]):e===`general`&&(r=n.generalContacts.find(e=>e.id===t),i=`General Contact Inquiry`,a=`From ${r?.name||`Visitor`}`,o=[{label:`Sender Name`,value:r?.name},{label:`Sender Email Address`,value:r?.email},{label:`Subject Category`,value:r?.subject||`General Assistance`},{label:`Message Details`,value:r?.message,isTextarea:!0},{label:`Received At`,value:G(r?.createdAt)+` `+new Date(r?.createdAt).toLocaleTimeString()}]),!r)return;document.getElementById(`inquiry-modal-title`).textContent=i,document.getElementById(`inquiry-modal-subtitle`).textContent=a;let s=document.getElementById(`inquiry-details-container`);if(s.innerHTML=``,o.forEach(e=>{let t=document.createElement(`div`);t.style.display=`flex`,t.style.flexDirection=`column`,t.style.gap=`6px`,t.style.borderBottom=`1px solid rgba(255, 255, 255, 0.05)`,t.style.paddingBottom=`12px`;let n=document.createElement(`span`);n.style.fontSize=`11px`,n.style.color=`rgba(255, 255, 255, 0.4)`,n.style.textTransform=`uppercase`,n.style.letterSpacing=`0.05em`,n.style.fontWeight=`bold`,n.textContent=e.label;let r;e.isTextarea?(r=document.createElement(`div`),r.style.fontSize=`13.5px`,r.style.color=`#e2e8f0`,r.style.lineHeight=`1.6`,r.style.background=`rgba(0, 0, 0, 0.2)`,r.style.padding=`12px`,r.style.borderRadius=`8px`,r.style.whiteSpace=`pre-wrap`,r.textContent=e.value||`N/A`):(r=document.createElement(`span`),r.style.fontSize=`14px`,r.style.color=`#ffffff`,r.style.fontWeight=`500`,r.textContent=e.value||`N/A`),t.appendChild(n),t.appendChild(r),s.appendChild(t)}),e===`counselor`){let e=document.createElement(`div`);e.style.display=`flex`,e.style.gap=`12px`,e.style.marginTop=`16px`,e.style.justifyContent=`flex-end`,e.innerHTML=`
      <button class="btn-secondary" onclick="requestCounselorDocs('${r.id}')" style="background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4); color: #818cf8; padding: 8px 14px; display: flex; align-items: center; gap: 6px;">
        <i class="bx bx-file-find"></i> Request Certificates & Docs
      </button>
      <button class="btn-primary" onclick="approveCounselorApplication('${r.id}')" style="background: #10b981; border: none; padding: 8px 14px; display: flex; align-items: center; gap: 6px;">
        <i class="bx bx-check-shield"></i> Approve & Onboard Counselor
      </button>
    `,s.appendChild(e)}document.getElementById(`modal-inquiry`).classList.remove(`hidden`)}function U(){let e=document.getElementById(`modal-inquiry`);e&&e.classList.add(`hidden`)}async function W(e,r){if(confirm(`Are you sure you want to permanently delete this ${e} inquiry record?`))try{let i=await fetch(`${t}/contacts/${e}/${r}`,{method:`DELETE`,headers:{Authorization:`Bearer ${n.token}`}});if(!i.ok){let e=await i.json();throw Error(e.error||`Failed to delete record.`)}alert(`Record deleted successfully.`),U(),e===`university`?await L():e===`counselor`?await z():e===`general`&&await V()}catch(e){console.error(`Delete inquiry failed:`,e),alert(e.message||`Failed to delete inquiry`)}}function G(e){if(!e)return`N/A`;let t=new Date(e);return isNaN(t.getTime())?e:t.toLocaleDateString(`en-US`,{month:`short`,day:`numeric`,year:`numeric`})}async function K(){let[e,t,n]=await Promise.all([d(`/talk/rooms`),d(`/talk/moderation`),d(`/admin/talk/metrics`)]);te(e||[]),q(t||{notes:[],replies:[]},n)}function te(e){let t=document.getElementById(`admin-rooms-list`);if(t){if(e.length===0){t.innerHTML=`<div style="color: rgba(255,255,255,0.4); text-align: center; padding: 10px;">No rooms active.</div>`;return}t.innerHTML=e.map(e=>`
    <div class="glass-card" style="padding: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: rgba(255,255,255,0.02);">
      <div style="flex: 1; min-width: 0; text-align: left;">
        <div style="font-weight: 700; color: white; font-size: 13px;">${J(e.name)}</div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${J(e.description||`No description`)}
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button onclick="deleteTalkRoom('${e.id}')" class="btn-secondary" style="padding: 6px 10px; border-radius: 6px; font-size: 11px; border: none; background: rgba(239, 68, 68, 0.1); color: #f87171; cursor: pointer;">
          Delete
        </button>
      </div>
    </div>
  `).join(``)}}function q(e,t){let n=document.getElementById(`flagged-content-list`),r=document.getElementById(`flagged-empty-state`);if(!n)return;let{notes:i=[],replies:a=[]}=e,o=i.length+a.length;if(t)document.getElementById(`kpi-talk-cost`).textContent=`$${t.totalCostUsd.toFixed(4)}`,document.getElementById(`kpi-talk-messages`).textContent=(t.totalNotes+t.totalReplies).toLocaleString(),document.getElementById(`kpi-talk-flagged`).textContent=(t.flaggedNotes+t.flaggedReplies).toLocaleString(),document.getElementById(`kpi-talk-rooms`).textContent=t.totalRooms.toLocaleString();else{let e=0,t=0;i.forEach(n=>{e+=n.inputTokens||0,t+=n.outputTokens||0}),a.forEach(n=>{e+=n.inputTokens||0,t+=n.outputTokens||0});let n=e*75e-9+t*3e-7;document.getElementById(`kpi-talk-cost`).textContent=`$${n.toFixed(4)}`,document.getElementById(`kpi-talk-messages`).textContent=o,document.getElementById(`kpi-talk-flagged`).textContent=o,document.getElementById(`kpi-talk-rooms`).textContent=rooms.length}if(o===0){n.innerHTML=``,r&&r.classList.remove(`hidden`);return}r&&r.classList.add(`hidden`);let s=``;i.forEach(e=>{let t=e.isReported&&e.status===`PENDING`?`User Flagged`:e.moderationReason||`AI Crisis Risk Detected`;s+=`
      <tr>
        <td>
          <span class="badge-role" style="background: rgba(239, 68, 68, 0.15); color: #f87171; font-size: 11px; padding: 2px 6px; border-radius: 4px;">
            Note
          </span>
        </td>
        <td>
          <div style="font-weight: 600; color: white;">${J(e.room?.name||`Unknown Room`)}</div>
          <div style="font-size: 10px; color: rgba(255,255,255,0.4);">${G(e.createdAt)}</div>
        </td>
        <td>
          <span style="font-size: 12px; color: rgba(255,255,255,0.8);">${J(e.nickname)}</span>
        </td>
        <td>
          <div style="font-size: 12px; color: white; max-width: 300px; white-space: normal; word-break: break-word;">
            "${J(e.content)}"
          </div>
        </td>
        <td>
          <span style="font-size: 11px; color: #f87171; font-weight: 500;">${J(t)}</span>
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
          <div style="font-weight: 600; color: white;">Room: ${J(e.note?.room?.name||`Unknown`)}</div>
          <div style="font-size: 10px; color: rgba(255,255,255,0.4); max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            Note: "${J(e.note?.content||``)}"
          </div>
        </td>
        <td>
          <span style="font-size: 12px; color: rgba(255,255,255,0.8);">${J(e.nickname)}</span>
        </td>
        <td>
          <div style="font-size: 12px; color: white; max-width: 300px; white-space: normal; word-break: break-word;">
            "${J(e.content)}"
          </div>
        </td>
        <td>
          <span style="font-size: 11px; color: #fb923c; font-weight: 500;">${J(t)}</span>
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
    `}),n.innerHTML=s}window.deleteTalkRoom=async function(e){if(confirm(`Are you sure you want to delete this TalkRoom? All messages inside it will be deleted.`)){let t=await h(`/talk/rooms/${e}`);t&&t.success&&K()}},window.resolveModeration=async function(e,t,n){let r=await p(`/talk/moderation/${e}/${t}/resolve`,{action:n});r&&r.success&&K()};function J(e){return e?e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`):``}async function Y(){let e=document.getElementById(`counselors-table-body`);if(!e)return;let t=await f(`/v1/admin/counselors`);if(!t||!t.success)return;let n=t.data;if(n.length===0){e.innerHTML=`<tr><td colspan="6" class="text-center py-20 text-secondary">No counselors provisioned yet. Click "Invite New Counselor" to begin.</td></tr>`;return}e.innerHTML=n.map(e=>`
    <tr>
      <td>
        <div style="font-weight: 700; font-size: 14px; color: white;">${J(e.user?.firstName)} ${J(e.user?.lastName)}</div>
        <div style="font-size: 11.5px; color: hsl(var(--text-secondary)); margin-top: 2px;">${J(e.user?.email)}</div>
      </td>
      <td><span class="badge-credentials">${J(e.credentials||`General Wellness`)}</span></td>
      <td><span style="font-size: 12px; font-weight: 600; color: hsl(var(--text-secondary));">${J(e.user?.timezone||`UTC`)}</span></td>
      <td>
        <span class="badge-status ${e.status===`ACTIVE`?`verified`:`pending`}">${e.status}</span>
      </td>
      <td><strong style="color: white;">${e._count?.sessions||0}</strong> <span style="font-size: 12px; color: hsl(var(--text-secondary));">sessions</span></td>
      <td class="text-right">
        <button class="btn-secondary small" onclick="toggleCounselorStatus('${e.id}', '${e.status===`ACTIVE`?`SUSPENDED`:`ACTIVE`}')">
          <i class="bx ${e.status===`ACTIVE`?`bx-block`:`bx-check-circle`}"></i>
          <span>${e.status===`ACTIVE`?`Suspend`:`Activate`}</span>
        </button>
      </td>
    </tr>
  `).join(``)}window.toggleCounselorStatus=async function(e,t){let n=await m(`/v1/admin/counselors/${e}/status`,{status:t});n&&n.success&&Y()},document.addEventListener(`DOMContentLoaded`,()=>{let e=document.getElementById(`btn-open-invite-counselor`),t=document.getElementById(`btn-cancel-invite-counselor`),n=document.getElementById(`invite-counselor-card`),r=document.getElementById(`invite-counselor-form`);e&&n&&e.addEventListener(`click`,()=>n.classList.remove(`hidden`)),t&&n&&t.addEventListener(`click`,()=>n.classList.add(`hidden`)),r&&r.addEventListener(`submit`,async e=>{e.preventDefault();let t=document.getElementById(`invite-first-name`).value,i=document.getElementById(`invite-last-name`).value,a=document.getElementById(`invite-email`).value;Q(`Sending counselor invitation email...`,`info`);let o=await p(`/v1/admin/counselors/invite`,{firstName:t,lastName:i,email:a});if(o&&o.success){let e=o.data?.setupUrl||``;$(`Counselor Invitation Sent!`,`Invitation created for ${t} ${i} (${a}). An email has been sent (BCC: wellmindly@gmail.com).\n\nSetup Registration Link (Copy to share directly):`,e),r.reset(),n&&n.classList.add(`hidden`),Y()}else Q(o?.error?.message||`Failed to send invitation`,`error`)})});var X=[];async function Z(){let e=document.getElementById(`master-calendar-list`);if(!e)return;let t=await f(`/v1/admin/calendar`);if(!(!t||!t.success)){if(X=t.data,X.length===0){e.innerHTML=`<p class="text-secondary" style="grid-column: 1/-1; text-align: center; padding: 40px;">No scheduled counseling sessions found.</p>`;return}e.innerHTML=X.map(e=>{let t=new Date(e.startTime),n=e.status&&e.status.startsWith(`CANCELLED`);return`
      <div class="session-card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 14px; background: hsl(var(--card-glass) / 0.5); border: 1px solid hsl(var(--border-glass)); padding: 18px; border-radius: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="badge-status ${e.status===`CONFIRMED`?`verified`:n?`suspended`:`pending`}">${e.status}</span>
          <span style="font-size: 11px; font-weight: 600; color: hsl(var(--text-secondary)); flex-shrink: 0;">${t.toUTCString()}</span>
        </div>

        <div>
          <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: white;">Student: ${J(e.student?.firstName)} ${J(e.student?.lastName)}</h4>
          <p style="font-size: 12.5px; font-weight: 600; color: hsl(var(--accent-indigo)); margin: 4px 0 0 0;">Counselor: ${J(e.counselor?.user?.firstName)} ${J(e.counselor?.user?.lastName)}</p>
          ${e.cancellationReason?`<p style="font-size: 11.5px; color: hsl(var(--color-rose)); margin: 4px 0 0 0;">Reason: ${J(e.cancellationReason)}</p>`:``}
        </div>

        <div style="padding-top: 12px; border-top: 1px solid hsl(var(--border-glass) / 0.4); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px;">
          <div style="display: flex; gap: 6px;">
            <button onclick="openRescheduleModal('${e.id}')" class="btn-secondary small" style="padding: 6px 10px; font-size: 11.5px;" title="Reschedule Session">
              <i class="bx bx-calendar-edit"></i>
              <span>Reschedule</span>
            </button>

            ${n?``:`
              <button onclick="adminCancelSession('${e.id}')" class="btn-secondary small" style="padding: 6px 10px; font-size: 11.5px; color: hsl(var(--color-rose));" title="Cancel Session">
                <i class="bx bx-x-circle"></i>
                <span>Cancel</span>
              </button>
            `}

            <button onclick="adminDeleteSession('${e.id}')" class="btn-secondary small" style="padding: 6px 10px; font-size: 11.5px; opacity: 0.8;" title="Delete Session">
              <i class="bx bx-trash"></i>
              <span>Delete</span>
            </button>
          </div>

          <a href="${e.meetingLink}" target="_blank" class="btn-primary small" style="padding: 6px 12px; font-size: 11.5px;">
            <i class="bx bx-video"></i>
            <span>Meeting Link</span>
          </a>
        </div>
      </div>
    `}).join(``)}}window.adminCancelSession=async function(e){let t=prompt(`Enter cancellation reason (optional):`,`Cancelled by Administrator from Master Calendar`);if(t===null)return;let n=await m(`/v1/admin/sessions/${e}/cancel`,{reason:t});n&&n.success?Z():alert(n?.error?.message||`Failed to cancel session`)},window.adminDeleteSession=async function(e){if(!confirm(`Are you sure you want to delete this session from the Master Calendar?`))return;let t=await h(`/v1/admin/sessions/${e}`);t&&t.success?Z():alert(t?.error?.message||`Failed to delete session`)},window.openRescheduleModal=async function(e){let t=X.find(t=>t.id===e);if(!t)return;document.getElementById(`reschedule-session-id`).value=t.id;let n=new Date(t.startTime),r=new Date(n.getTime()-n.getTimezoneOffset()*6e4).toISOString().slice(0,16);document.getElementById(`reschedule-start-time`).value=r;let i=document.getElementById(`reschedule-counselor-id`);i.innerHTML=`<option value="">Loading counselors...</option>`;let a=await f(`/v1/admin/counselors?limit=50`);a&&a.success&&(i.innerHTML=a.data.map(e=>`
      <option value="${e.id}" ${e.id===t.counselorId?`selected`:``}>
        ${J(e.user.firstName)} ${J(e.user.lastName)} (${J(e.credentials)})
      </option>
    `).join(``)),document.getElementById(`modal-reschedule-session`).classList.remove(`hidden`)},window.closeRescheduleModal=function(){document.getElementById(`modal-reschedule-session`).classList.add(`hidden`)},document.addEventListener(`DOMContentLoaded`,()=>{let e=document.getElementById(`reschedule-session-form`);e&&e.addEventListener(`submit`,async e=>{e.preventDefault();let t=document.getElementById(`reschedule-session-id`).value,n=document.getElementById(`reschedule-start-time`).value,r=document.getElementById(`reschedule-counselor-id`).value;if(!n||!t)return;let i=new Date(n),a=new Date(i.getTime()+3600*1e3),o=await m(`/v1/admin/sessions/${t}/reschedule`,{startTime:i.toISOString(),endTime:a.toISOString(),counselorId:r});o&&o.success?(closeRescheduleModal(),Z()):alert(o?.error?.message||`Failed to reschedule session. Please check slot availability.`)})});async function ne(){let e=document.getElementById(`student-to-counselor-feedback-list`),t=document.getElementById(`counselor-to-student-feedback-list`),n=await f(`/v1/admin/feedback`);if(!n||!n.success)return;let{studentToCounselor:r,counselorToStudent:i}=n.data;e&&(e.innerHTML=r.length===0?`<p class="text-secondary" style="font-size: 12px;">No student feedback submitted yet.</p>`:r.map(e=>`
          <div style="background: hsl(var(--card-glass) / 0.4); border: 1px solid hsl(var(--border-glass)); border-left: 3px solid hsl(var(--color-green)); padding: 14px; border-radius: 12px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; font-weight: 700; color: white;">
              <span>To: ${J(e.counselor?.user?.firstName)} ${J(e.counselor?.user?.lastName)}</span>
              <span style="color: hsl(var(--color-amber)); font-size: 14px;">${`★`.repeat(e.rating)}${`☆`.repeat(5-e.rating)}</span>
            </div>
            <p style="font-size: 12px; color: hsl(var(--text-secondary)); margin: 8px 0 0 0; line-height: 1.4;">"${J(e.comments||`No comment provided`)}"</p>
          </div>
        `).join(``)),t&&(t.innerHTML=i.length===0?`<p class="text-secondary" style="font-size: 12px;">No counselor evaluations submitted yet.</p>`:i.map(e=>`
          <div style="background: hsl(var(--card-glass) / 0.4); border: 1px solid hsl(var(--border-glass)); border-left: 3px solid hsl(var(--primary-plum)); padding: 14px; border-radius: 12px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; font-weight: 700; color: white;">
              <span>Student: ${J(e.session?.student?.firstName)} ${J(e.session?.student?.lastName)}</span>
              <span style="color: hsl(var(--primary-plum)); font-weight: 800; font-size: 12px;">Rating: ${e.rating}/5</span>
            </div>
            <p style="font-size: 12px; color: hsl(var(--text-secondary)); margin: 8px 0 0 0; line-height: 1.4;">Summary: ${J(e.summaryNote||`No summary note`)}</p>
          </div>
        `).join(``))}function Q(e,t=`success`){let n=document.getElementById(`admin-toast-container`);if(!n)return;let r=document.createElement(`div`);r.className=`admin-toast ${t}`,r.style.cssText=`
    pointer-events: auto;
    background: ${t===`error`?`#ef4444`:t===`info`?`#3b82f6`:`#10b981`};
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    gap: 10px;
    animation: fadeIn 0.3s ease;
    max-width: 420px;
  `,r.innerHTML=`
    <i class="bx ${t===`error`?`bx-error-circle`:t===`info`?`bx-info-circle`:`bx-check-circle`}" style="font-size: 18px;"></i>
    <span style="flex: 1;">${J(e)}</span>
  `,n.appendChild(r),setTimeout(()=>{r.style.opacity=`0`,r.style.transition=`opacity 0.3s ease`,setTimeout(()=>r.remove(),300)},4e3)}function $(e,t,n=null){let r=document.getElementById(`modal-custom-alert`),i=document.getElementById(`custom-alert-title`),a=document.getElementById(`custom-alert-message`),o=document.getElementById(`custom-alert-link-container`),s=document.getElementById(`custom-alert-link-input`),c=document.getElementById(`btn-copy-alert-link`);if(!r||!i||!a){alert(`${e}\n\n${t}${n?`

Link: `+n:``}`);return}i.textContent=e,a.textContent=t,n?(o.classList.remove(`hidden`),s.value=n,c.onclick=()=>{navigator.clipboard.writeText(n),Q(`Registration link copied to clipboard!`,`info`)}):o.classList.add(`hidden`),r.classList.remove(`hidden`)}function re(){let e=document.getElementById(`modal-custom-alert`);e&&e.classList.add(`hidden`)}window.requestCounselorDocs=async function(e){let t=n.counselorContacts.find(t=>t.id===e);Q(`Sending document request email...`,`info`);let r=await p(`/contacts/counselor/${e}/request-docs`,{});r&&r.success?Q(r.message||`Document request email sent to ${t?.email||`applicant`}`,`success`):Q(r?.error?.message||`Failed to send document request email`,`error`)},window.approveCounselorApplication=async function(e){let t=n.counselorContacts.find(t=>t.id===e);Q(`Approving counselor application...`,`info`);let r=await p(`/contacts/counselor/${e}/approve-onboard`,{});r&&r.success?(U(),r.setupUrl?$(`Counselor Application Approved!`,`Application for ${t?.name||`Counselor`} (${t?.email}) has been approved.\n\nAn onboarding registration link has been emailed to the applicant (BCC: wellmindly@gmail.com). You can also copy the link below:`,r.setupUrl):Q(r.message||`Counselor approved and account activated!`,`success`),z()):Q(r?.error?.message||`Failed to approve counselor application`,`error`)},window.uploadCounselorAvatar=async function(e,t,n){let r=e.files?.[0];if(!r)return;Q(`Uploading profile image...`,`info`);let i=new FileReader;i.onload=async e=>{let i=e.target.result,a=await p(`/admin/upload`,{fileName:r.name,mimeType:r.type,base64Data:i,folder:`avatars`});if(a&&a.success&&a.url){if(t){let e=document.getElementById(t);e&&(e.value=a.url)}if(n){let e=document.getElementById(n);e&&(e.src=a.url,e.classList.remove(`hidden`))}Q(`Profile picture uploaded successfully!`,`success`)}else Q(a?.error?.message||`Failed to upload image`,`error`)},i.readAsDataURL(r)},window.showToast=Q,window.showCustomAlert=$,window.closeCustomAlertModal=re;
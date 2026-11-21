/* 새:공간 AI 첫 실행 파트너 V2 — interactive first activity planner. API keys live on server only. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const views = ['choice', 'question', 'ideas', 'loading', 'plan'];
  const demo = new URLSearchParams(location.search).get('demo') === '1';
  const store = { path: null, step: 0, answers: {}, ideas: [], selected: -1, plan: null, busy: false };
  const CHOICE_EXPERIENCE = [
    '사람들과 취향을 나누고 싶어요', '함께 배우고 새로운 걸 경험하고 싶어요',
    '무언가 직접 만들거나 표현하고 싶어요', '새로운 사람들과 연결되고 싶어요'
  ];
  const CHOICE_BARRIER = [
    '어떤 활동으로 시작할지 모르겠어요', '혼자 준비하는 방법이 막막해요',
    '함께할 사람을 모으기 어려워요', '시간이나 비용이 부담돼요'
  ];
  const flows = {
    explore: [
      {key:'interest', kicker:'01 / THE SPARK', title:'요즘 마음이 가는 건\n무엇인가요?', description:'좋아하는 것, 그걸 왜 좋아하는지, 누구와 어떤 시간을 보내고 싶은지도 적어주세요. 구체적으로 말할수록 내 취향과 상황에 더 가까운 제안을 만드는 데 도움이 돼요.', type:'text', placeholder:'예: 커피를 좋아해요. 처음 만나는 사람들과 작은 카페에서 각자 좋아하는 커피 이야기를 나누고 싶어요.', suggestions:['책과 글','커피와 취향','사진과 기록','만들기','동네 이야기']},
      {key:'experience', kicker:'02 / THE FEELING', title:'어떤 시간을\n만들고 싶나요?', description:'무엇을 ‘할지’보다 그 시간에 어떤 경험을 나누고 싶은지 골라보세요.', type:'choice', options:CHOICE_EXPERIENCE},
      {key:'barrier', kicker:'03 / THE HURDLE', title:'시작을 망설이게 하는 건\n무엇인가요?', description:'가장 걸리는 것 하나만 골라주세요. 거기서부터 작게 시작할 방법을 찾아볼게요.', type:'choice', options:CHOICE_BARRIER, extra:'더 알려주고 싶은 상황이 있다면 적어주세요. (선택)'}
    ],
    ready: [
      {key:'activity', kicker:'01 / YOUR IDEA', title:'어떤 활동을\n생각하고 있나요?', description:'활동 내용뿐 아니라 누가 함께하면 좋을지, 어떤 분위기로 해보고 싶은지도 적어주세요. 구체적인 설명이 있으면 더 잘 맞는 첫 기획을 만들 수 있어요.', type:'text', placeholder:'예: 향을 좋아하는 사람 4~6명과 주말 오후에 작은 향수 만들기 클래스를 열고 싶어요.'},
      {key:'experience', kicker:'02 / THE PEOPLE', title:'참여하는 사람에게\n어떤 시간을 선물하고 싶나요?', description:'첫 회차가 어떤 경험으로 남았으면 좋겠는지 골라주세요.', type:'choice', options:CHOICE_EXPERIENCE},
      {key:'barrier', kicker:'03 / THE HURDLE', title:'가장 막막한 부분은\n무엇인가요?', description:'실행을 방해하는 가장 큰 장벽을 먼저 줄여볼게요.', type:'choice', options:CHOICE_BARRIER, extra:'이미 생각해 둔 조건(인원·시간 등)이 있다면 적어주세요. (선택)'}
    ]
  };
  function setView(name) {
    views.forEach(v => { const el = $('view-' + v); el.hidden = v !== name; el.classList.toggle('is-current', v === name); });
    $('global-error').hidden = true;
    const title = $('view-' + name).querySelector('h2');
    if (title) { title.setAttribute('tabindex','-1'); title.focus({ preventScroll: true }); }
    if (name !== 'choice') document.querySelector('.workspace').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
  function setProgress(n, total, label) {
    const percent = Math.round(n / total * 100);
    $('progress-fill').style.width = percent + '%';
    document.querySelector('.progress-track').setAttribute('aria-valuenow', String(percent));
    $('journey-count').textContent = n === 0 ? 'START' : (n >= total ? 'COMPLETE' : `${String(n).padStart(2,'0')} / ${String(total).padStart(2,'0')}`);
    $('journey-label').textContent = label;
  }
  function elt(tag, className, text) {
    const el = document.createElement(tag); if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function setQuestion(index) {
    store.step = index;
    const q = flows[store.path][index];
    $('question-kicker').textContent = q.kicker;
    $('question-title').textContent = q.title;
    $('question-description').textContent = q.description;
    $('question-error').hidden = true;
    const box = $('question-field'); box.replaceChildren();
    if (q.type === 'text') {
      const label = elt('label','input-block',q.key === 'interest' ? '관심사와 해보고 싶은 경험' : '준비하고 싶은 활동과 분위기'); label.setAttribute('for','answer-input');
      const input = elt('textarea','question-input'); input.id = 'answer-input'; input.rows = 3; input.maxLength = 180;
      input.placeholder = q.placeholder; input.value = store.answers[q.key] || '';
      label.appendChild(input); box.appendChild(label);
      if (q.suggestions) {
        const chips = elt('div','suggestion-chips');
        q.suggestions.forEach(s => { const b = elt('button','',s); b.type='button';b.addEventListener('click',()=>{input.value=s;input.focus();});chips.appendChild(b); });
        box.appendChild(chips);
      }
      box.appendChild(elt('p','field-hint','한 단어만 적어도 시작할 수 있어요. 다만 좋아하는 이유나 원하는 경험을 더 구체적으로 적으면, 파트너가 더 잘 맞는 제안을 만드는 데 도움이 돼요. (최대 180자 · 개인정보는 입력하지 마세요.)'));
    } else {
      const group = elt('div','question-choice-group');group.setAttribute('role','radiogroup');group.setAttribute('aria-label',q.title.replace('\n',' '));
      q.options.forEach((option, i)=>{
        const label = elt('label','question-choice');
        const input=elt('input');input.type='radio';input.name='answer';input.value=option; input.checked=store.answers[q.key] === option;
        if(i===0)input.required=true;
        label.append(input,elt('span','',option));group.appendChild(label);
      });
      box.appendChild(group);
      if(q.extra){
        const label=elt('label','input-block',q.extra);label.setAttribute('for','extra-input');
        const area=elt('textarea');area.id='extra-input';area.maxLength=160;area.rows=2;
        area.placeholder='예: 주말 2시간 정도, 5명 이내로 시작하고 싶어요';area.value=store.answers.details||'';
        label.appendChild(area);box.appendChild(label);
      }
    }
    $('question-next').textContent = index === flows[store.path].length-1 ? (store.path==='explore'?'나에게 맞는 활동 아이디어 보기 ↗':'첫 활동 기획안 만들기 ↗') : '다음으로 ↗';
    setProgress(index+1,store.path==='explore'?5:4,'새:공간 파트너 / '+(store.path==='explore'?'아이디어 발견':'첫 회차 기획'));
    setView('question');
  }
  function saveQuestion() {
    const q=flows[store.path][store.step];
    let v='';
    if(q.type==='text') v=($('answer-input').value||'').trim();
    else v=document.querySelector('#question-field input[name="answer"]:checked')?.value||'';
    if(q.type==='text'&&v.length<1){questionError('좋아하는 것이나 하고 싶은 일을 적어주세요.');return false;}
    if(q.type==='choice'&&!v){questionError('마음에 가까운 항목 하나만 골라주세요.');return false;}
    store.answers[q.key]=v;
    if(q.extra)store.answers.details=($('extra-input')?.value||'').trim();
    return true;
  }
  function questionError(message){$('question-error').textContent=message;$('question-error').hidden=false;}
  function globalError(message){$('global-error').textContent=message;$('global-error').hidden=false;}
  function loading(title, desc){$('loading-title').textContent=title;$('loading-description').textContent=desc;setView('loading');}
  async function apiRequest(phase, body){
    const controller = new AbortController(); const timeout=setTimeout(()=>controller.abort(),32000);
    try {
      const response=await fetch('/api/first-action-v2', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phase,path:store.path,data:body}),signal:controller.signal,cache:'no-store'});
      const json=await response.json().catch(()=>{throw new Error('서버 응답을 읽지 못했어요. 배포 상태를 확인해 주세요.');});
      if(!response.ok)throw new Error(json?.error||'AI가 응답하지 못했어요. 다시 시도해 주세요.');
      return json;
    } catch(err) { if(err.name==='AbortError')throw new Error('응답이 오래 걸리고 있어요. 다시 시도해 주세요.');throw err; }
    finally {clearTimeout(timeout);}
  }
  function demoIdeas(a) {
    const t=(a.interest||'취향').trim();
    return {intro:`‘${t}’에서 시작할 수 있는 세 가지 작은 활동이에요.`,ideas:[
      {title:`${t} 한 가지를 나누는 저녁`,premise:`각자 좋아하는 ${t} 이야기를 가져와 나누는 가벼운 모임`,whyFit:'준비물보다 대화에 집중할 수 있어 처음 운영하는 사람도 시도하기 쉬워요.',firstStep:'지인 세 명에게 참여하고 싶은지 물어보기'},
      {title:`처음 만나는 ${t} 실험실`,premise:`작은 체험을 함께 해보고 각자의 경험을 기록하는 60분`,whyFit:'완성도보다 경험을 나누는 데 목적을 두면 부담을 줄일 수 있어요.',firstStep:'참여자가 함께 해볼 작은 과제 하나 적기'},
      {title:`우리 동네 ${t} 취향 지도`,premise:`서로의 취향과 장소를 이야기하고 작은 지도를 만드는 활동`,whyFit:'지역의 일상적인 장소와 관심사를 자연스럽게 연결할 수 있어요.',firstStep:'지도에 올리고 싶은 장소나 경험 3개 적기'}
    ]};
  }
  function demoPlan(a,idea){
    const subject=(idea?.title||a.activity||'내가 준비하는 작은 모임').slice(0,90);
    return {title:subject,oneLiner:idea?.premise||`${subject}을(를) 작은 첫 회차로 시험해 보는 활동`,whyItFits:'처음부터 큰 행사를 만들기보다 주변 사람들과 작게 시험해 볼 수 있는 형태예요.',audience:'비슷한 관심사가 있는 지인 또는 지역 참여자',sizeSuggestion:'4~6명',durationSuggestion:'약 60분',session:[
      {minutes:'0~10분',activity:'서로 소개하고 오늘 나눌 주제를 이야기해요.'},
      {minutes:'10~40분',activity:`${subject}에 대한 이야기를 나누거나 간단한 활동을 함께 해요.`},
      {minutes:'40~60분',activity:'느낀 점을 공유하고 다음에 함께할 활동을 한 가지 골라요.'}
    ],recruitment:`안녕하세요! ${subject}을(를) 함께 해볼 작은 모임을 준비하고 있어요. 경험이 없어도 괜찮아요. 부담 없이 함께 해보고 싶은 분이 있을까요?`,firstAction:{title:'참여 의향을 물어볼 사람 세 명 정하기',detail:'아래 모집 문구를 복사해 가볍게 전달해보세요. 신청이나 결제가 필요한 단계는 아직 아니에요.'},prep:['첫 회차 주제 한 문장 정리','참여자에게 전달할 안내문 마련','후보 일시 2개 정하기'],spaceConsiderations:['참여 인원에 맞는 좌석과 소음 환경','사용 가능한 시간과 취소 규정','음식·음료·준비물 사용 허용 여부'],costConsiderations:['공간 사용료','재료 및 준비물','필요시 인쇄 또는 안내 비용'],caution:'샘플 기획안입니다. 인원·시간은 제안이며 실제 공간의 이용·예약 조건을 보장하지 않습니다.'};
  }
  async function getIdeas() {
    if(store.busy)return;store.busy=true;
    loading('작게 시작할 수 있는\n세 가지 방향을 찾고 있어요.','관심사와 만들고 싶은 경험을 바탕으로 활동 아이디어를 제안할게요.');
    try {
      const result=demo ? demoIdeas(store.answers) : await apiRequest('ideas',store.answers);
      if(!result||!Array.isArray(result.ideas)||result.ideas.length!==3)throw new Error('아이디어를 정상적으로 불러오지 못했어요.');
      store.ideas=result.ideas;store.selected=-1;
      renderIdeas(result.intro);
    } catch(e) {setQuestion(flows.explore.length-1);globalError(e.message||'아이디어 생성에 실패했어요.');}
    finally {store.busy=false;}
  }
  function renderIdeas(intro) {
    $('ideas-intro').textContent=intro||'마음에 가는 시작 하나를 골라보세요.';
    const list=$('idea-list');list.replaceChildren();
    store.ideas.forEach((idea,i)=>{
      const btn=elt('button','idea-option');btn.type='button';btn.setAttribute('aria-pressed',String(i===store.selected));
      if(i===store.selected)btn.classList.add('is-selected');
      const header=elt('div','idea-option__top');header.append(elt('span','',`CONCEPT 0${i+1}`),elt('b','',i===store.selected?'선택됨 ↗':'선택하기 ↗'));
      btn.append(header,elt('strong','',idea.title),elt('p','',idea.premise),elt('small','',`이 아이디어가 맞는 이유 · ${idea.whyFit}`),elt('small','',`이렇게 시작할 수 있어요 · ${idea.firstStep}`));
      btn.addEventListener('click',()=>{store.selected=i;renderIdeas($('ideas-intro').textContent);});list.appendChild(btn);
    });
    $('idea-error').hidden=true;
    setProgress(4,5,'새:공간 파트너 / 아이디어 선택');setView('ideas');
  }
  async function getPlan() {
    if(store.busy)return;
    if(store.path==='explore'&&store.selected<0){$('idea-error').textContent='마음에 드는 아이디어 하나를 선택해 주세요.';$('idea-error').hidden=false;return;}
    store.busy=true;
    const selected=store.path==='explore'?store.ideas[store.selected]:null;
    const body={...store.answers,selectedIdea:selected?{title:selected.title,premise:selected.premise,whyFit:selected.whyFit,firstStep:selected.firstStep}:null,adjustment:store.path==='explore'?$('idea-adjustment').value.trim():''};
    loading('첫 회차를 열어볼 수 있는\n기획안을 만들고 있어요.','모임 구성, 모집 문구, 오늘 해볼 작은 행동까지 정리해볼게요.');
    try{
      const result=demo?{plan:demoPlan(store.answers,selected)}:await apiRequest('plan',body);
      if(!result||!result.plan||!Array.isArray(result.plan.session))throw new Error('기획안을 정상적으로 불러오지 못했어요.');
      store.plan=result.plan;renderPlan(result.plan);
    }catch(e){store.path==='explore'?renderIdeas($('ideas-intro').textContent):setQuestion(flows.ready.length-1);globalError(e.message||'기획안 생성에 실패했어요.');}
    finally{store.busy=false;}
  }
  function fillList(id,items){const list=$(id);list.replaceChildren();(items||[]).forEach(v=>list.appendChild(elt('li','',String(v))));}
  function renderPlan(p){
    const fields={'plan-title':'title','plan-one-liner':'oneLiner','plan-why':'whyItFits','plan-audience':'audience','plan-size':'sizeSuggestion','plan-duration':'durationSuggestion','plan-invite':'recruitment','plan-first-action':'firstAction','plan-caution':'caution'};
    Object.entries(fields).forEach(([id,key])=>{if(id==='plan-first-action')$(id).textContent=p.firstAction?.title||'';else $(id).textContent=p[key]||'';});
    $('plan-first-detail').textContent=p.firstAction?.detail||'';
    const list=$('plan-session');list.replaceChildren();
    (p.session||[]).forEach(item=>{const row=elt('li');row.append(elt('span','',item.minutes),elt('p','',item.activity));list.appendChild(row);});
    fillList('plan-prep',p.prep);fillList('plan-space',p.spaceConsiderations);fillList('plan-cost',p.costConsiderations);
    $('plan-demo').hidden=!demo;$('another-idea').hidden=store.path!=='explore';
    setProgress(store.path==='explore'?5:4,store.path==='explore'?5:4,'새:공간 파트너 / 첫 기획 완성');setView('plan');
  }
  function planText(p){return [p.title,p.oneLiner,`추천 대상: ${p.audience}`,`시작 규모: ${p.sizeSuggestion} (제안)`,`첫 회차 시간: ${p.durationSuggestion} (제안)`,
      '\n[첫 회차 구성]',...p.session.map(x=>`${x.minutes} · ${x.activity}`),'\n[모집 문구]',p.recruitment,'\n[오늘의 첫 행동]',p.firstAction.title,p.firstAction.detail,
      '\n[실행 전 체크]',...p.prep,'\n[공간을 볼 때]',...p.spaceConsiderations,'\n[비용 항목]',...p.costConsiderations,'\n※ 실제 공간 조건은 별도 확인해야 합니다.'].join('\n');}
  async function copy(text,button,label){try{await navigator.clipboard.writeText(text);button.textContent='복사했어요 ✓';setTimeout(()=>button.textContent=label,2000);}catch{const area=elt('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();try{document.execCommand('copy');button.textContent='복사했어요 ✓';setTimeout(()=>button.textContent=label,2000);}catch{button.textContent='복사하지 못했어요';}area.remove();}}
  document.querySelectorAll('[data-path]').forEach(b=>b.addEventListener('click',()=>{store.path=b.dataset.path;store.step=0;store.answers={};store.ideas=[];store.selected=-1;setQuestion(0);}));
  $('question-back').addEventListener('click',()=>{if(store.step===0){setProgress(0,5,'새:공간 파트너 / 시작');setView('choice');}else setQuestion(store.step-1);});
  $('question-next').addEventListener('click',async()=>{if(!saveQuestion())return;if(store.step<flows[store.path].length-1)setQuestion(store.step+1);else if(store.path==='explore')await getIdeas();else await getPlan();});
  $('ideas-back').addEventListener('click',()=>setQuestion(flows.explore.length-1));
  $('ideas-next').addEventListener('click',getPlan);
  $('another-idea').addEventListener('click',()=>renderIdeas('다른 아이디어로도 첫 회차를 구체화해볼 수 있어요.'));
  $('restart').addEventListener('click',()=>{store.path=null;store.answers={};store.ideas=[];store.selected=-1;store.plan=null;setProgress(0,5,'새:공간 파트너 / 시작');setView('choice');window.scrollTo({top:0,behavior:'smooth'});});
  $('copy-plan').addEventListener('click',()=>{if(store.plan)copy(planText(store.plan),$('copy-plan'),'기획안 전체 복사 ↗');});
  $('copy-invite').addEventListener('click',()=>{if(store.plan)copy(store.plan.recruitment,$('copy-invite'),'모집 문구 복사 ↗');});
  if(demo)$('demo-flag').hidden=false;
  setProgress(0,5,'새:공간 파트너 / 시작');setView('choice');
})();

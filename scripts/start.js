/* 새:공간 · first-action guide, client MVP. No API keys or persisted responses here. */
(()=>{
  'use strict';
  const form=document.getElementById('start-form');
  const steps=[...form.querySelectorAll('.start-step')];
  const field=(name)=>form.elements.namedItem(name);
  const error=document.getElementById('form-error');
  const back=document.getElementById('back-btn');
  const next=document.getElementById('next-btn');
  const count=document.getElementById('step-count');
  const fill=document.getElementById('progress-fill');
  const progress=document.querySelector('.start-progress');
  const formView=document.getElementById('form-view');
  const loading=document.getElementById('loading-view');
  const result=document.getElementById('result-view');
  const isDemo=new URLSearchParams(location.search).get('demo')==='1';
  let index=0,output=null,inflight=false;
  function showStep(n){
    index=n;
    steps.forEach((step,i)=>{step.hidden=i!==index;step.classList.toggle('is-active',i===index);});
    error.hidden=true;
    back.disabled=index===0;
    next.innerHTML=index===steps.length-1?'내 활동 정리하기 <span aria-hidden="true">↗</span>':'다음 단계 <span aria-hidden="true">↗</span>';
    count.textContent=String(index+1).padStart(2,'0')+' / '+String(steps.length).padStart(2,'0');
    const percent=Math.round((index+1)/steps.length*100);
    fill.style.width=percent+'%';progress.setAttribute('aria-valuenow',String(percent));
    steps[index].querySelector('h2')?.focus({preventScroll:true});
  }
  function selected(name){return form.querySelector(`[name="${name}"]:checked`)?.value||'';}
  function validate(){
    let message='';
    if(index===0 && !selected('type'))message='진행하고 싶은 활동 유형을 골라주세요.';
    if(index===1 && (!selected('stage') || !field('people').value))message='준비 단계와 참여 인원을 선택해 주세요.';
    if(index===2 && (!field('region').value || !field('budget').value))message='희망 지역과 예산을 선택해 주세요.';
    if(index===4 && !selected('challenge'))message='현재 가장 고민되는 한 가지를 선택해 주세요.';
    if(message){error.textContent=message;error.hidden=false;return false;}
    error.hidden=true;return true;
  }
  function getData(){return {
    type:selected('type'),idea:field('idea').value.trim(),stage:selected('stage'),people:field('people').value,
    region:field('region').value,budget:field('budget').value,
    needs:[...form.querySelectorAll('[name="needs"]:checked')].map(el=>el.value),
    conditionNote:field('conditionNote').value.trim(),challenge:selected('challenge'),notes:field('notes').value.trim()
  };}
  function demoGuide(data){return {
    headline:`${data.type}의 첫 시작을 준비하고 있군요.`,
    summary:`${data.region}에서 ${data.people} 규모의 활동을 계획하고 있어요. 현재 단계(${data.stage})에 맞춰 준비를 작은 단위부터 정리해 보세요.`,
    ready:[`${data.type}라는 활동의 큰 방향을 정했어요.`,`${data.people} 규모를 생각하고 있어요.`],
    priorities:[
      {title:'활동의 핵심 경험 한 문장 작성',why:'참여자가 무엇을 얻는지 선명하게 만들기',action:'모임 소개 문장을 2줄로 적어보세요.'},
      {title:'규모와 일정 초안 만들기',why:'공간·예산 협의를 시작할 최소 조건이 필요해요.',action:'후보 날짜 2개와 진행 시간대를 정해보세요.'},
      {title:`${data.challenge} 해결 계획 세우기`,why:'지금 가장 막막한 부분을 먼저 좁혀볼 수 있어요.',action:'이번 주에 실천할 일 1개를 정해보세요.'}
    ],
    spaceChecklist:[...(data.needs.length?data.needs:['좌석·배치','운영 가능 시간']),'최종 이용 가능 여부 및 이용 제한'],
    costItems:['공간 이용료','재료·운영 준비물','참여자 모집·홍보 관련 비용'],
    nextActions:['참여자에게 설명할 활동 소개 문장 작성','진행 일정과 필요 시설 표 만들기','확인된 지역공간 조건과 비교하기'],
    note:'샘플 화면은 미리보기용 텍스트로 실제 AI 분석 결과가 아닙니다.'
  };}
  function addList(id,items,format){
    const ul=document.getElementById(id);ul.replaceChildren();
    items.forEach(item=>{
      const li=document.createElement('li');
      li.textContent=format?`${item.title} — ${item.action} (${item.why})`:item;
      ul.appendChild(li);
    });
  }
  function renderGuide(data,demo=false){
    if(!data || !Array.isArray(data.priorities) || !Array.isArray(data.spaceChecklist) || !Array.isArray(data.ready) || !Array.isArray(data.costItems) || !Array.isArray(data.nextActions))throw new Error('진단 결과의 형식이 올바르지 않습니다.');
    output=data;
    document.getElementById('result-headline').textContent=data.headline;
    document.getElementById('result-summary').textContent=data.summary;
    addList('result-ready',data.ready);
    addList('result-priorities',data.priorities,true);
    addList('result-space',data.spaceChecklist);
    addList('result-cost',data.costItems);
    addList('result-next',data.nextActions);
    document.getElementById('result-note').textContent=data.note;
    document.getElementById('demo-warning').hidden=!demo;
    formView.hidden=true;loading.hidden=true;result.hidden=false;
    count.textContent='COMPLETE';fill.style.width='100%';progress.setAttribute('aria-valuenow','100');
    result.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});
  }
  async function submit(){
    if(inflight)return;
    inflight=true;next.disabled=true;formView.hidden=true;loading.hidden=false;
    const data=getData();
    try{
      if(isDemo){await new Promise(resolve=>setTimeout(resolve,380));renderGuide(demoGuide(data),true);return;}
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),35000);
      let response;
      try{response=await fetch('/api/first-action-guide',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:controller.signal,cache:'no-store'});}finally{clearTimeout(timer);}
      let payload;
      try{payload=await response.json();}catch{throw new Error('서버 응답을 읽지 못했습니다. 배포 환경을 확인해 주세요.');}
      if(!response.ok)throw new Error(payload?.error || '진단에 실패했어요. 잠시 후 다시 시도해 주세요.');
      renderGuide(payload.guide);
    }catch(e){
      loading.hidden=true;formView.hidden=false;
      error.textContent=e.name==='AbortError'?'응답 시간이 길어졌어요. 잠시 후 다시 시도해 주세요.':(e.message||'네트워크 연결을 확인해 주세요.');
      error.hidden=false;
      error.scrollIntoView({behavior:'auto',block:'center'});
    }finally{inflight=false;next.disabled=false;}
  }
  next.addEventListener('click',()=>{if(!validate())return;if(index<steps.length-1)showStep(index+1);else submit();});
  back.addEventListener('click',()=>{if(index>0)showStep(index-1);});
  form.addEventListener('submit',e=>{e.preventDefault();if(!validate())return;if(index<steps.length-1)showStep(index+1);else submit();});
  document.getElementById('restart-btn').addEventListener('click',()=>{form.reset();output=null;result.hidden=true;formView.hidden=false;showStep(0);window.scrollTo({top:0,behavior:'smooth'});});
  document.getElementById('copy-btn').addEventListener('click',async()=>{
    if(!output)return;
    const a=output;const t=[a.headline,a.summary,'[지금 준비된 부분]',...a.ready,'[우선 할 일]',...a.priorities.map(i=>`${i.title}: ${i.action}`),'[공간 체크]',...a.spaceChecklist,'[예산]',...a.costItems,'[다음 행동]',...a.nextActions,'※ 실제 공간 이용 조건은 별도 확인이 필요합니다.'].join('\n');
    const btn=document.getElementById('copy-btn');
    try{await navigator.clipboard.writeText(t);btn.textContent='복사했어요 ✓';setTimeout(()=>btn.textContent='결과 복사하기 ↗',2500);}catch{btn.textContent='복사할 수 없어요';}
  });
  showStep(0);
})();

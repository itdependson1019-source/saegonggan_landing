/* 새:공간 V8 — local choice preview only. Does not change AI partner input, bookings or API. */
(function(){
  const root=document.querySelector('.sgv8-orbits');
  if(!root)return;
  const buttons=[...root.querySelectorAll('.sgv8-orbit')];
  const label=root.querySelector('#sgv8-selected-tag');
  const desc=root.querySelector('#sgv8-selected-desc');
  if(!buttons.length||!label||!desc)return;
  buttons.forEach((button)=>{
    button.addEventListener('click',()=>{
      const selected=button.getAttribute('aria-pressed')==='true';
      buttons.forEach((b)=>b.setAttribute('aria-pressed','false'));
      if(selected){
        label.textContent='EXPLORE YOUR FIRST STEP';
        desc.textContent='세 가지 중 마음이 가는 시작을 선택해 보세요. 꼭 한 가지 형태로 정할 필요는 없어요.';
        return;
      }
      button.setAttribute('aria-pressed','true');
      label.textContent=button.dataset.short || 'YOUR FIRST STEP';
      desc.textContent=button.dataset.detail || '';
    });
  });
})();

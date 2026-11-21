/* Stage 8 · scroll narrative. All base interactions (tabs/forms/cards) remain owned by index.html. */
(()=>{
  'use strict';
  const journey=document.querySelector('.sg8-journey');
  if(!journey) return;
  const steps=[...journey.querySelectorAll('.sg8-journey__step')];
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  let scheduled=false;
  function update(){
    scheduled=false;
    const rect=journey.getBoundingClientRect();
    const vh=window.innerHeight;
    const denominator=Math.max(1,rect.height-vh*.4);
    const progress=Math.max(0,Math.min(1,(vh*.65-rect.top)/denominator));
    journey.style.setProperty('--sg8-progress',(progress*100).toFixed(2)+'%');
    let nearest=0,closest=Infinity;
    steps.forEach((el,i)=>{
      const d=Math.abs(el.getBoundingClientRect().top-vh*.41);
      if(d<closest){closest=d;nearest=i;}
    });
    steps.forEach((el,i)=>{el.classList.toggle('is-current',i===nearest);el.classList.toggle('is-passed',i<nearest);});
    if(!reduce.matches && window.innerWidth>1049){
      const art=journey.querySelector('.sg8-journey__art');
      if(art)art.style.setProperty('--sg8-art-shift',((progress-.5)*22).toFixed(1)+'px');
    }
  }
  function tick(){if(!scheduled){scheduled=true;requestAnimationFrame(update);}}
  addEventListener('scroll',tick,{passive:true});addEventListener('resize',tick,{passive:true});
  reduce.addEventListener?.('change',tick);
  update();
})();

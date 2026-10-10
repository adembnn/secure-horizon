/* Bascule de thème (démo seulement) : auto -> clair -> sombre. */
(function(){
  var btn=document.getElementById('theme-btn'); if(!btn) return;
  var modes=['auto','light','dark'], names={auto:'Thème : auto',light:'Thème : clair',dark:'Thème : sombre'}, i=0;
  btn.addEventListener('click',function(){
    i=(i+1)%3; var m=modes[i], r=document.documentElement;
    if(m==='auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme',m);
    btn.textContent=names[m];
  });
})();

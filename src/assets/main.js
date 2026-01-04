(function(){
  const yearEl = document.querySelector('[data-year]');
  if(yearEl){ yearEl.textContent = new Date().getFullYear(); }

  // Small enhancement: copy link for sharing on post pages (if button exists)
  const copyBtn = document.querySelector('[data-copy-link]');
  if(copyBtn){
    copyBtn.addEventListener('click', async () => {
      try{
        await navigator.clipboard.writeText(location.href);
        copyBtn.textContent = 'Link copiado';
        setTimeout(()=> copyBtn.textContent = 'Copiar link', 1500);
      }catch(e){
        alert('Não foi possível copiar. Copie manualmente pela barra de endereços.');
      }
    });
  }
})();

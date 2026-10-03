(function(){
'use strict';
var KEY='logos-editor-v1', THEME='logos-editor-theme';
var $=function(id){return document.getElementById(id)};
var ed=$('editor'), titleEl=$('title'), listEl=$('docList');
var state={docs:[],cur:null}, saveTimer=null;

/* ---------- storage ---------- */
function load(){try{var s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.docs)state=s}catch(e){}}
function persist(){
  try{localStorage.setItem(KEY,JSON.stringify(state));$('stSave').textContent='Salvo';$('stSave').classList.remove('dirty')}
  catch(e){$('stSave').textContent='Erro ao salvar (armazenamento cheio?)'}
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function curDoc(){return state.docs.find(function(d){return d.id===state.cur})}

/* ---------- templates ---------- */
var TPL={
 blank:'<p><br></p>',
 ensaio:'<h2>Introdução</h2><p>Apresente o tema, o problema e a tese que será defendida.</p><h2>Tese</h2><p>Enuncie com clareza a sua posição.</p><h2>Desenvolvimento</h2><p>Argumento 1…</p><p>Argumento 2…</p><h2>Objeções e respostas</h2><p>Qual a melhor objeção à tese? Como respondê-la?</p><h2>Conclusão</h2><p>Retome a tese e indique suas consequências.</p>',
 resenha:'<h2>A obra</h2><p>Autor, título, contexto.</p><h2>Resumo</h2><p></p><h2>Análise</h2><p></p><h2>Avaliação</h2><p></p>',
 artigo:'<h2>Resumo</h2><p></p><h2>Introdução</h2><p></p><h2>Fundamentação teórica</h2><p></p><h2>Método</h2><p></p><h2>Discussão</h2><p></p><h2>Conclusão</h2><p></p><h2>Referências</h2><p></p>'
};

/* ---------- sanitize (allowlist) ---------- */
var OK={P:1,H1:1,H2:1,H3:1,H4:1,BLOCKQUOTE:1,UL:1,OL:1,LI:1,B:1,STRONG:1,I:1,EM:1,U:1,A:1,BR:1,SUP:1,MARK:1,SPAN:0,DIV:0};
function clean(html){
  var t=document.createElement('template');t.innerHTML=html;
  (function walk(n){
    Array.prototype.slice.call(n.childNodes).forEach(function(c){
      if(c.nodeType===3)return;
      if(c.nodeType!==1){n.removeChild(c);return}
      var tag=c.tagName;
      if(/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|LINK|META|HEAD|TITLE)$/.test(tag)){n.removeChild(c);return}
      walk(c);
      if(tag==='H5'||tag==='H6'){var h=document.createElement('h4');while(c.firstChild)h.appendChild(c.firstChild);n.replaceChild(h,c);return}
      if(!OK[tag]){while(c.firstChild)n.insertBefore(c.firstChild,c);n.removeChild(c);return}
      var keepHref=tag==='A'?c.getAttribute('href'):null, keepCls=tag==='SUP'&&c.className==='fn'?'fn':null;
      Array.prototype.slice.call(c.attributes).forEach(function(a){c.removeAttribute(a.name)});
      if(keepHref&&/^(https?:|mailto:|#|\/)/i.test(keepHref.trim())){c.setAttribute('href',keepHref.trim());c.setAttribute('rel','noopener')}
      if(keepCls)c.className='fn';
    });
  })(t.content);
  return t.innerHTML;
}

/* ---------- html -> markdown / text ---------- */
function inline(n){
  var s='';
  n.childNodes.forEach(function(c){
    if(c.nodeType===3){s+=c.nodeValue;return}
    if(c.nodeType!==1)return;
    var t=c.tagName,i=inline(c);
    if(t==='B'||t==='STRONG')s+='**'+i+'**';
    else if(t==='I'||t==='EM')s+='*'+i+'*';
    else if(t==='A')s+='['+i+']('+(c.getAttribute('href')||'')+')';
    else if(t==='BR')s+='  \n';
    else if(t==='SUP'&&c.className==='fn')s+='[^'+i.replace(/\D/g,'')+']';
    else s+=i;
  });
  return s;
}
function toMD(html,title){
  var t=document.createElement('div');t.innerHTML=clean(html);
  var out=title?['# '+title,'']:[];
  t.childNodes.forEach(function(c){
    if(c.nodeType===3){if(c.nodeValue.trim())out.push(c.nodeValue.trim(),'');return}
    var tg=c.tagName;
    if(/^H[1-4]$/.test(tg))out.push('#'.repeat(+tg[1]+(title?1:0))+' '+inline(c),'');
    else if(tg==='BLOCKQUOTE')out.push(inline(c).split('\n').map(function(l){return '> '+l}).join('\n'),'');
    else if(tg==='UL')c.querySelectorAll(':scope>li').forEach(function(li){out.push('- '+inline(li))}),out.push('');
    else if(tg==='OL'){var k=0;c.querySelectorAll(':scope>li').forEach(function(li){out.push((++k)+'. '+inline(li))});out.push('')}
    else out.push(inline(c),'');
  });
  return out.join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n';
}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function mdInline(s){
  s=esc(s);
  s=s.replace(/\[\^(\d+)\]/g,'<sup class="fn">$1</sup>');
  s=s.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\*(.+?)\*/g,'<i>$1</i>');
  s=s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,'<a href="$2">$1</a>');
  return s;
}
function fromMD(md){
  var lines=md.replace(/\r/g,'').split('\n'),out=[],list=null,para=[];
  function flushP(){if(para.length){out.push('<p>'+mdInline(para.join(' '))+'</p>');para=[]}}
  function flushL(){if(list){out.push('<'+list.t+'>'+list.i.map(function(x){return '<li>'+mdInline(x)+'</li>'}).join('')+'</'+list.t+'>');list=null}}
  lines.forEach(function(l){
    var m;
    if(!l.trim()){flushP();flushL();return}
    if((m=l.match(/^(#{1,4})\s+(.*)/))){flushP();flushL();out.push('<h'+m[1].length+'>'+mdInline(m[2])+'</h'+m[1].length+'>')}
    else if((m=l.match(/^>\s?(.*)/))){flushP();flushL();out.push('<blockquote>'+mdInline(m[1])+'</blockquote>')}
    else if((m=l.match(/^\s*[-*]\s+(.*)/))){flushP();if(!list||list.t!=='ul'){flushL();list={t:'ul',i:[]}}list.i.push(m[1])}
    else if((m=l.match(/^\s*\d+\.\s+(.*)/))){flushP();if(!list||list.t!=='ol'){flushL();list={t:'ol',i:[]}}list.i.push(m[1])}
    else{flushL();para.push(l.trim())}
  });
  flushP();flushL();return out.join('');
}
function plain(){return ed.innerText.replace(/\n{3,}/g,'\n\n').trim()}

/* ---------- docs ---------- */
function newDoc(tpl){
  var d={id:uid(),title:'',html:TPL[tpl]||TPL.blank,goal:0,updated:Date.now()};
  state.docs.unshift(d);open(d.id);persist();titleEl.focus();
}
function open(id){
  state.cur=id;var d=curDoc();if(!d)return;
  titleEl.value=d.title;ed.innerHTML=d.html||'<p><br></p>';$('goal').value=d.goal||'';
  stats();renderList();persist();
}
function delDoc(id){
  var d=state.docs.find(function(x){return x.id===id});
  if(!confirm('Excluir "'+(d.title||'Sem título')+'"? Isso não pode ser desfeito.'))return;
  state.docs=state.docs.filter(function(x){return x.id!==id});
  if(!state.docs.length)newDoc('blank');else if(state.cur===id)open(state.docs[0].id);
  persist();renderList();
}
function renderList(){
  var q=$('search').value.toLowerCase();listEl.innerHTML='';
  state.docs.filter(function(d){return !q||(d.title+' '+d.html.replace(/<[^>]+>/g,' ')).toLowerCase().indexOf(q)>-1})
   .forEach(function(d){
    var li=document.createElement('li');if(d.id===state.cur)li.className='on';
    var w=d.html.replace(/<[^>]+>/g,' ').trim().split(/\s+/).filter(Boolean).length;
    var box=document.createElement('div');box.style.minWidth=0;
    var a=document.createElement('span');a.className='t';a.textContent=d.title||'Sem título';
    var b=document.createElement('span');b.className='m';b.textContent=w+' palavras · '+new Date(d.updated).toLocaleDateString('pt-BR');
    box.appendChild(a);box.appendChild(b);
    var x=document.createElement('button');x.className='x';x.textContent='✕';x.title='Excluir';x.setAttribute('aria-label','Excluir');
    x.onclick=function(e){e.stopPropagation();delDoc(d.id)};
    li.onclick=function(){open(d.id);if(innerWidth<800)$('side').classList.add('hidden')};
    li.appendChild(box);li.appendChild(x);listEl.appendChild(li);
  });
}
function changed(){
  var d=curDoc();if(!d)return;
  d.title=titleEl.value;d.html=ed.innerHTML;d.updated=Date.now();
  $('stSave').textContent='Salvando…';$('stSave').classList.add('dirty');
  clearTimeout(saveTimer);saveTimer=setTimeout(function(){persist();renderList()},500);
  stats();
}
function stats(){
  var t=ed.innerText.trim(),w=t?t.split(/\s+/).length:0;
  $('stWords').textContent=w+(w===1?' palavra':' palavras');
  $('stChars').textContent=t.length+' caracteres';
  $('stRead').textContent=Math.max(w?1:0,Math.round(w/200))+' min de leitura';
  var g=+$('goal').value||0;$('goalFill').style.width=g?Math.min(100,w/g*100)+'%':'0';
}

/* ---------- formatting ---------- */
document.querySelectorAll('[data-cmd]').forEach(function(b){
  b.addEventListener('mousedown',function(e){e.preventDefault()});
  b.addEventListener('click',function(){document.execCommand(b.dataset.cmd);ed.focus();changed()});
});
$('blockSel').onchange=function(){document.execCommand('formatBlock',false,this.value);ed.focus();changed()};
$('linkBtn').addEventListener('mousedown',function(e){e.preventDefault()});
$('linkBtn').onclick=function(){
  var u=prompt('Endereço do link (https://…):');if(!u)return;
  if(!/^(https?:|mailto:)/i.test(u))u='https://'+u;
  document.execCommand('createLink',false,u);changed();
};
$('noteBtn').addEventListener('mousedown',function(e){e.preventDefault()});
$('noteBtn').onclick=function(){
  var n=ed.querySelectorAll('sup.fn').length+1;
  document.execCommand('insertHTML',false,'<sup class="fn">'+n+'</sup>');changed();
};
ed.addEventListener('input',changed);
titleEl.addEventListener('input',changed);
$('goal').addEventListener('input',function(){var d=curDoc();d.goal=+this.value||0;stats();persist()});
ed.addEventListener('paste',function(e){
  var h=e.clipboardData.getData('text/html');
  if(h){e.preventDefault();document.execCommand('insertHTML',false,clean(h))}
});
ed.addEventListener('keydown',function(e){
  if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();persist()}
  if((e.ctrlKey||e.metaKey)&&e.key==='f'){e.preventDefault();$('findBar').hidden=false;$('findIn').focus()}
});
document.addEventListener('selectionchange',function(){
  var n=getSelection().anchorNode;if(!n||!ed.contains(n))return;
  while(n&&n!==ed&&!/^(P|H1|H2|H3|BLOCKQUOTE)$/.test(n.nodeName))n=n.parentNode;
  if(n&&n!==ed)$('blockSel').value=n.nodeName.toLowerCase();
});

/* ---------- find / replace ---------- */
var findPos=0;
function findNext(){
  var q=$('findIn').value;if(!q)return;
  var full=ed.innerText.toLowerCase(),cnt=full.split(q.toLowerCase()).length-1;
  $('findCount').textContent=cnt+' resultado(s)';
  if(!cnt)return;
  getSelection().removeAllRanges();
  ed.focus();
  if(!window.find(q,false,false,true,false,false,false)){getSelection().removeAllRanges();window.find(q,false,false,true)}
}
function replOne(){
  var q=$('findIn').value,s=getSelection();
  if(q&&s.toString().toLowerCase()===q.toLowerCase()){document.execCommand('insertText',false,$('replIn').value);changed()}
  findNext();
}
function replAll(){
  var q=$('findIn').value;if(!q)return;
  var re=new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),n=0;
  var w=document.createTreeWalker(ed,NodeFilter.SHOW_TEXT),nodes=[];
  while(w.nextNode())nodes.push(w.currentNode);
  nodes.forEach(function(t){var v=t.nodeValue.replace(re,function(){n++;return $('replIn').value});if(v!==t.nodeValue)t.nodeValue=v});
  $('findCount').textContent=n+' substituído(s)';changed();
}
$('findBtn').onclick=function(){$('findBar').hidden=!$('findBar').hidden;if(!$('findBar').hidden)$('findIn').focus()};
$('findClose').onclick=function(){$('findBar').hidden=true};
$('findNext').onclick=findNext;$('replOne').onclick=replOne;$('replAll').onclick=replAll;
$('findIn').addEventListener('keydown',function(e){if(e.key==='Enter')findNext()});

/* ---------- UI ---------- */
$('newDoc').onclick=function(){$('tplDlg').hidden=false};
$('tplCancel').onclick=function(){$('tplDlg').hidden=true};
document.querySelectorAll('[data-tpl]').forEach(function(b){b.onclick=function(){$('tplDlg').hidden=true;newDoc(b.dataset.tpl)}});
$('toggleSide').onclick=function(){$('side').classList.toggle('hidden')};
$('search').addEventListener('input',renderList);
$('focusBtn').onclick=function(){document.body.classList.toggle('focus')};
document.addEventListener('keydown',function(e){if(e.key==='Escape'){document.body.classList.remove('focus');$('exportMenu').hidden=true;$('tplDlg').hidden=true}});
function setTheme(t){document.documentElement.dataset.theme=t;try{localStorage.setItem(THEME,t)}catch(e){}}
$('themeBtn').onclick=function(){setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark')};
$('exportBtn').onclick=function(e){e.stopPropagation();$('exportMenu').hidden=!$('exportMenu').hidden};
document.addEventListener('click',function(){$('exportMenu').hidden=true});

/* ---------- export / import ---------- */
function download(name,mime,data){
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:mime+';charset=utf-8'}));
  a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},1000);
}
function slug(){return (titleEl.value||'texto').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'texto'}
function fullHTML(){
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>'+esc(titleEl.value||'Texto')+'</title><style>body{max-width:42rem;margin:3rem auto;padding:0 1rem;font:1.1rem/1.75 Georgia,serif}blockquote{border-left:3px solid #999;margin-left:0;padding-left:1rem;color:#555}</style></head><body><h1>'+esc(titleEl.value)+'</h1>'+clean(ed.innerHTML)+'</body></html>';
}
document.querySelectorAll('[data-exp]').forEach(function(b){b.onclick=function(){
  var k=b.dataset.exp,n=slug();
  if(k==='md')download(n+'.md','text/markdown',toMD(ed.innerHTML,titleEl.value));
  else if(k==='html')download(n+'.html','text/html',fullHTML());
  else if(k==='txt')download(n+'.txt','text/plain',(titleEl.value?titleEl.value+'\n\n':'')+plain()+'\n');
  else if(k==='doc')download(n+'.doc','application/msword',fullHTML());
  else if(k==='pdf'){document.title=titleEl.value||'Texto';window.print()}
  else if(k==='copy'&&navigator.clipboard)navigator.clipboard.writeText(plain());
}});
$('backup').onclick=function(){download('backup-editor-'+new Date().toISOString().slice(0,10)+'.json','application/json',JSON.stringify(state))};
$('importFile').onchange=function(){
  var f=this.files[0];if(!f)return;var r=new FileReader();
  r.onload=function(){
    var txt=r.result,name=f.name.replace(/\.[^.]+$/,'');
    if(/\.json$/i.test(f.name)){
      try{var s=JSON.parse(txt);if(!s.docs)throw 0;
        s.docs.forEach(function(d){if(!state.docs.some(function(x){return x.id===d.id}))state.docs.push({id:String(d.id),title:String(d.title||''),html:clean(String(d.html||'')),goal:+d.goal||0,updated:+d.updated||Date.now()})});
        persist();renderList();alert('Backup importado.')}catch(e){alert('Arquivo de backup inválido.')}
    }else{
      var html=/\.html?$/i.test(f.name)?clean(txt):fromMD(txt);
      var m=!/\.html?$/i.test(f.name)&&txt.match(/^#\s+(.*)/);
      if(m){name=m[1];html=html.replace(/^<h1>.*?<\/h1>/,'')}
      var d={id:uid(),title:name,html:html||'<p><br></p>',goal:0,updated:Date.now()};
      state.docs.unshift(d);open(d.id);
    }
  };
  r.readAsText(f);this.value='';
};
window.addEventListener('beforeunload',function(){if($('stSave').classList.contains('dirty'))persist()});

/* ---------- init ---------- */
try{setTheme(localStorage.getItem(THEME)||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'))}catch(e){setTheme('light')}
load();
if(!state.docs.length)newDoc('blank');
else open(state.cur&&curDoc()?state.cur:state.docs[0].id);
if(innerWidth<800)$('side').classList.add('hidden');
})();

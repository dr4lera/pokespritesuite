'use strict';
// Preview sharing never uses the editor's display-only shade colors.
const shareMenu=document.createElement('div');
shareMenu.className='share-menu';shareMenu.hidden=true;shareMenu.setAttribute('role','menu');document.body.append(shareMenu);
const shareDialog=document.createElement('dialog');
shareDialog.className='share-dialog';shareDialog.innerHTML='<button class="close" aria-label="Close preview">×</button><h2>Ready to share</h2><p class="share-help"></p><img alt="Exported sprite preview"><div class="actions"><button class="button primary">Save file</button></div>';
document.body.append(shareDialog);
let shareUrl;
shareDialog.querySelector('.close').onclick=()=>shareDialog.close();
shareDialog.addEventListener('close',()=>{if(shareUrl)URL.revokeObjectURL(shareUrl);shareDialog.querySelector('img').removeAttribute('src');shareUrl=null});
function shareReady(target){if(target==='showcase'&&(!showReady||!lineup.length)){toast('Add a Pokémon and choose a variant first');return false}return true}
function previewBlob(target,animated){
 if(!shareReady(target))throw Error('Preview is not ready');
 const c=target==='showcase'?show:preview,x=ctx(c),images=[];
 if(animated){
  const count=target==='showcase'?(selectedVariants().some(v=>v.includes('prismatic')||v==='spectral')?12:2):($('previewEffect').value!=='none'?12:mode==='walk'?2:frames.length);
  try{for(let i=0;i<count;i++){if(target==='showcase')drawShowcase(i);else renderPreview(i,true);images.push(x.getImageData(0,0,c.width,c.height))}}
  finally{if(target==='showcase')drawShowcase(tick%12);else renderPreview()}
  return Promise.resolve(encodeGif(images,Math.round(100/+(target==='showcase'?$('showFps').value:$('fps').value))));
 }
 const frozen=canvas(c.width,c.height);ctx(frozen).drawImage(c,0,0);
 return new Promise((resolve,reject)=>frozen.toBlob(b=>b?resolve(b):reject(Error('Could not create image')),'image/png'));
}
function shareFilename(target,animated){return (target==='showcase'?'pokespritesuite-showcase':slug(name)+'-preview')+(animated?'.gif':'.png')}
function openShareFile(blob,target,animated,message){
 if(shareDialog.open)shareDialog.close();
 shareUrl=URL.createObjectURL(blob);shareDialog.querySelector('img').src=shareUrl;
 shareDialog.querySelector('.share-help').textContent=message||'Right-click or touch and hold the image to copy or save it. Some apps paste GIFs as still images; save and attach the GIF file to keep animation.';
 shareDialog.querySelector('.actions button').onclick=()=>download(blob,shareFilename(target,animated));shareDialog.showModal();
}
async function shareAction(target,action){
 shareMenu.hidden=true;if(!shareReady(target))return;
 const animated=action.includes('gif');
 try{
  const blobPromise=previewBlob(target,animated);
  if(action.startsWith('save')){download(await blobPromise,shareFilename(target,animated));toast(animated?'Animated GIF saved':'Preview image saved');return}
  const type=animated?'image/gif':'image/png';
  if(action.startsWith('open')||!navigator.clipboard?.write||!window.ClipboardItem||(animated&&(!ClipboardItem.supports||!ClipboardItem.supports(type)))){
   openShareFile(await blobPromise,target,animated,animated?'Your animated GIF is ready. Right-click or touch and hold to copy or save. To preserve animation in every app, save and attach the GIF file.':'Right-click or touch and hold this image to copy or save it.');return;
  }
  try{await navigator.clipboard.write([new ClipboardItem({[type]:blobPromise})]);toast(animated?'Animated GIF copied':'Image copied')}
  catch(error){openShareFile(await blobPromise,target,animated,'Your browser could not copy automatically. Right-click or touch and hold the image to copy it, or save the file below.')}
 }catch(error){toast('Could not share preview: '+error.message)}
}
function openShareMenu(target,x,y){
 if(!shareReady(target))return;shareMenu.replaceChildren();
 for(const [action,label] of [['copy-png','Copy image'],['copy-gif','Copy / open animated GIF'],['save-png','Save image (PNG)'],['save-gif','Save animated GIF'],['open-png','Open image preview']]){
  const b=document.createElement('button');b.textContent=label;b.setAttribute('role','menuitem');b.onclick=()=>shareAction(target,action);shareMenu.append(b);
 }
 shareMenu.hidden=false;shareMenu.style.left=Math.max(8,Math.min(x,innerWidth-shareMenu.offsetWidth-8))+'px';shareMenu.style.top=Math.max(8,Math.min(y,innerHeight-shareMenu.offsetHeight-8))+'px';shareMenu.firstElementChild.focus();
}
for(const [element,target] of [[preview,'editor'],[show,'showcase']])element.addEventListener('contextmenu',e=>{e.preventDefault();openShareMenu(target,e.clientX,e.clientY)});
$('copyPreview').onclick=()=>shareAction('editor','copy-png');$('copyShowcase').onclick=()=>shareAction('showcase','copy-png');
$('previewMore').onclick=e=>{const r=e.currentTarget.getBoundingClientRect();openShareMenu('editor',r.left,r.bottom+4)};
document.addEventListener('pointerdown',e=>{if(!shareMenu.contains(e.target))shareMenu.hidden=true});
document.addEventListener('keydown',e=>{if(shareDialog.open){e.stopImmediatePropagation();return}if(shareMenu.hidden)return;if(e.key==='Escape'){shareMenu.hidden=true;e.preventDefault()}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const items=[...shareMenu.children],i=items.indexOf(document.activeElement);items[(i+(e.key==='ArrowDown'?1:items.length-1))%items.length].focus()}},true);

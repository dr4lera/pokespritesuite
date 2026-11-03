'use strict';
// Preview sharing never uses the editor's display-only shade colors.
const shareMenu=document.createElement('div');
shareMenu.className='share-menu';shareMenu.hidden=true;shareMenu.setAttribute('role','menu');document.body.append(shareMenu);
const shareDialog=document.createElement('dialog');
shareDialog.className='share-dialog';shareDialog.innerHTML='<button class="close" aria-label="Close preview">×</button><h2>Ready to share</h2><p class="share-help"></p><img alt="Exported sprite preview"><div class="actions"><button class="button subtle" data-share-copy>Copy image (still)</button><button class="button subtle" data-share-file hidden>Share GIF file</button><button class="button primary" data-share-save>Save file</button></div>';
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
 const help=shareDialog.querySelector('.share-help'),filename=shareFilename(target,animated);
 help.textContent=message||(animated?'Copy image copies a still frame. To send the animation, save the GIF and attach it in chat. This preview is local to your browser; its image address is not a shareable link.':'Copy this image or save the PNG file. This preview is local; its image address is not a shareable link.');
 const copy=shareDialog.querySelector('[data-share-copy]');copy.textContent=animated?'Copy image (still)':'Copy image';
 copy.onclick=async()=>{
  try{
   if(!navigator.clipboard?.write||!window.ClipboardItem)throw Error('Image copying is unavailable in this browser. Save the file instead.');
   const im=shareDialog.querySelector('img'),c=canvas(im.naturalWidth,im.naturalHeight);
   if(!im.complete||!im.naturalWidth)throw Error('The preview is still loading. Try again.');
   ctx(c).drawImage(im,0,0);
   const png=new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('Could not create image')),'image/png'));
   await navigator.clipboard.write([new ClipboardItem({'image/png':png})]);
   help.textContent=animated?'Still image copied. Save and attach the GIF file to send the animation.':'Image copied. Paste it into your chat.';toast(animated?'Still image copied':'Image copied');
  }catch(error){help.textContent=error.message+' Use Save file to download and attach the image.'}
 };
 shareDialog.querySelector('[data-share-save]').onclick=()=>download(blob,filename);
 const file=new File([blob],filename,{type:blob.type}),share=shareDialog.querySelector('[data-share-file]');
 share.hidden=!animated||!navigator.share||!navigator.canShare?.({files:[file]});
 share.onclick=async()=>{try{await navigator.share({files:[file]})}catch(error){if(error.name!=='AbortError')help.textContent='Sharing is unavailable here. Save the GIF and attach it in chat.'}};
 shareDialog.showModal();
}
async function shareAction(target,action){
 shareMenu.hidden=true;if(!shareReady(target))return;
 const animated=action.includes('gif');
 try{
  const blobPromise=previewBlob(target,animated);
  if(action.startsWith('save')){download(await blobPromise,shareFilename(target,animated));toast(animated?'Animated GIF saved':'Preview image saved');return}
  const type=animated?'image/gif':'image/png';
  if(action.startsWith('open')||!navigator.clipboard?.write||!window.ClipboardItem||(animated&&(!ClipboardItem.supports||!ClipboardItem.supports(type)))){
   openShareFile(await blobPromise,target,animated);return;
  }
  try{await navigator.clipboard.write([new ClipboardItem({[type]:blobPromise})]);toast(animated?'Animated GIF copied':'Image copied')}
  catch(error){openShareFile(await blobPromise,target,animated,'Automatic copying was blocked. Try Copy image below, or save and attach the file. The preview address is local and cannot be shared.')}
 }catch(error){toast('Could not share preview: '+error.message)}
}
function openShareMenu(target,x,y){
 if(!shareReady(target))return;shareMenu.replaceChildren();
 for(const [action,label] of [['copy-png','Copy image'],['copy-gif','Open / share animated GIF'],['save-png','Save image (PNG)'],['save-gif','Save animated GIF'],['open-png','Open image preview']]){
  const b=document.createElement('button');b.textContent=label;b.setAttribute('role','menuitem');b.onclick=()=>shareAction(target,action);shareMenu.append(b);
 }
 shareMenu.hidden=false;shareMenu.style.left=Math.max(8,Math.min(x,innerWidth-shareMenu.offsetWidth-8))+'px';shareMenu.style.top=Math.max(8,Math.min(y,innerHeight-shareMenu.offsetHeight-8))+'px';shareMenu.firstElementChild.focus();
}
for(const [element,target] of [[preview,'editor'],[show,'showcase']])element.addEventListener('contextmenu',e=>{e.preventDefault();openShareMenu(target,e.clientX,e.clientY)});
$('copyPreview').onclick=()=>shareAction('editor','copy-png');$('copyShowcase').onclick=()=>shareAction('showcase','copy-png');
$('previewMore').onclick=e=>{const r=e.currentTarget.getBoundingClientRect();openShareMenu('editor',r.left,r.bottom+4)};
document.addEventListener('pointerdown',e=>{if(!shareMenu.contains(e.target))shareMenu.hidden=true});
document.addEventListener('keydown',e=>{if(shareDialog.open){e.stopImmediatePropagation();return}if(shareMenu.hidden)return;if(e.key==='Escape'){shareMenu.hidden=true;e.preventDefault()}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const items=[...shareMenu.children],i=items.indexOf(document.activeElement);items[(i+(e.key==='ArrowDown'?1:items.length-1))%items.length].focus()}},true);

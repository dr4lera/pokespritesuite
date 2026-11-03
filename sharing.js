'use strict';
// Preview sharing never uses the editor's display-only shade colors.
const shareMenu=document.createElement('div');
shareMenu.className='share-menu';shareMenu.hidden=true;shareMenu.setAttribute('role','menu');document.body.append(shareMenu);
const shareDialog=document.createElement('dialog');
shareDialog.className='share-dialog';shareDialog.innerHTML='<button class="close" aria-label="Close preview">×</button><h2>Ready to share</h2><p class="share-help"></p><img alt="Exported sprite preview"><div class="actions"><button class="button subtle" data-share-copy>Copy image (still)</button><button class="button subtle" data-share-file hidden>Share GIF file</button><button class="button primary" data-share-save>Save file</button></div><section class="host-share"><p class="micro">Create link uploads this preview publicly to sxcu.net, a free anonymous image host. Anyone with the link can view it.</p><button class="button primary" data-host-upload>Create share link</button><p class="host-status" role="status" aria-live="polite"></p><div data-host-result hidden><label class="field-label">Direct image link<input data-host-url readonly aria-label="Direct image link"></label><div class="actions"><button class="button subtle" data-host-copy>Copy link</button><a class="button subtle" data-host-open target="_blank" rel="noopener noreferrer">Open link</a><a class="text-button" data-host-delete target="_blank" rel="noopener noreferrer">Manage / delete upload</a></div></div></section>';
document.body.append(shareDialog);
let shareUrl,shareSession=0;
const hostedPreviews=new WeakMap();
shareDialog.querySelector('.close').onclick=()=>shareDialog.close();
shareDialog.addEventListener('close',()=>{shareSession++;if(shareUrl)URL.revokeObjectURL(shareUrl);shareDialog.querySelector('img').removeAttribute('src');shareUrl=null});
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
 const help=shareDialog.querySelector('.share-help'),filename=shareFilename(target,animated),session=++shareSession;
 setupHostedSharing(blob,filename,session);
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
 share.textContent='Share with an app';
 share.onclick=async()=>{help.textContent='Opening your device’s share menu…';try{await navigator.share({files:[file]});help.textContent='Share menu closed. To send a link instead, use Create share link below.'}catch(error){help.textContent=error.name==='AbortError'?'No app selected. Use Create share link below to get a URL.':'Your browser could not open its share menu. Use Create share link below, or save and attach the GIF.'}};
 shareDialog.showModal();
}
function setupHostedSharing(blob,filename,session){
 const upload=shareDialog.querySelector('[data-host-upload]'),status=shareDialog.querySelector('.host-status'),result=shareDialog.querySelector('[data-host-result]'),input=shareDialog.querySelector('[data-host-url]');
 upload.disabled=false;upload.textContent='Create share link';result.hidden=true;status.textContent='';input.value='';
 function present(data){
  input.value=data.url;result.hidden=false;upload.hidden=true;
  shareDialog.querySelector('[data-host-open]').href=data.url;
  const deletion=shareDialog.querySelector('[data-host-delete]');deletion.hidden=!data.del_url;if(data.del_url)deletion.href=data.del_url;else deletion.removeAttribute('href');
  status.textContent='Link ready. Paste it in chat to share the animation. Keep the delete link if you want to remove this upload.';
 }
 upload.hidden=false;if(hostedPreviews.has(blob))present(hostedPreviews.get(blob));
 shareDialog.querySelector('[data-host-copy]').onclick=async()=>{
  try{await navigator.clipboard.writeText(input.value);status.textContent='Link copied. Paste it in your chat.';toast('Share link copied')}
  catch(error){input.focus();input.select();status.textContent='Copy was blocked. The link is selected: press Ctrl+C or ⌘C.'}
 };
 upload.onclick=async()=>{
  if(upload.disabled)return;
  upload.disabled=true;upload.textContent='Uploading…';status.textContent='Uploading your preview to sxcu.net…';
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),45000);
  try{
   if(blob.size>95*1024*1024)throw Error('The preview is over the host’s 95 MB limit. Reduce the showcase size.');
   const body=new FormData();body.append('file',blob,filename);body.append('noembed','true');
   const response=await fetch('https://sxcu.net/api/files/create',{method:'POST',body,signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
   let data;try{data=await response.json()}catch(error){throw Error('The host returned an unreadable response. Try again later.');}
   if(!response.ok||data.error)throw Error(typeof data.error==='string'?data.error:'The host could not accept this preview ('+response.status+').');
   const url=new URL(data.url);if(url.protocol!=='https:'||url.hostname!=='sxcu.net'||!url.pathname.match(/\.(gif|png)$/i))throw Error('The host did not return a valid image link.');
   if(data.del_url){const deletion=new URL(data.del_url);if(deletion.protocol!=='https:'||deletion.hostname!=='sxcu.net')delete data.del_url;}
   hostedPreviews.set(blob,data);
   if(session!==shareSession)return;
   present(data);
  }catch(error){if(session!==shareSession)return;status.textContent=error.name==='AbortError'?'Upload timed out. Try again, or save the file.':'Upload failed: '+error.message+' You can still save the file.';upload.textContent='Retry upload';}
  finally{clearTimeout(timeout);if(session===shareSession)upload.disabled=false;}
 };
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

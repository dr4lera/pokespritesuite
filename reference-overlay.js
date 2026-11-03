'use strict';
// Reference artwork is browser-local and never enters sprite frames or exports.
const referenceToggleLabel=document.createElement('label');referenceToggleLabel.className='reference-toggle';referenceToggleLabel.innerHTML='<input id="referenceToggle" type="checkbox"> Reference image';document.querySelector('.shade-viewbar').insertBefore(referenceToggleLabel,document.querySelector('.shade-viewbar>span'));
const referencePanel=document.createElement('section');referencePanel.id='referencePanel';referencePanel.className='reference-panel';referencePanel.hidden=true;referencePanel.setAttribute('aria-label','Floating reference image');
referencePanel.innerHTML=`<header id="referenceHandle" class="reference-handle" tabindex="0" title="Drag to move. Arrow keys move the panel; Shift moves one pixel."><span class="reference-grip" aria-hidden="true">⠿</span><strong>Reference image</strong><button id="referenceReset" type="button" title="Reset reference position and size" aria-label="Reset reference position">↺</button><button id="referenceClose" type="button" aria-label="Close reference image">×</button></header><div class="reference-controls"><button id="referenceUpload" type="button" class="button subtle">＋ Upload image</button><label>Opacity <input id="referenceOpacity" type="range" min="0" max="100" value="100" aria-label="Reference image opacity"><span id="referenceOpacityValue">100%</span></label></div><div id="referenceDropzone" class="reference-dropzone"><button id="referenceChoose" type="button" class="reference-empty"><span>＋</span>Drop a reference here<br><small>or choose an image · stays on your device</small></button><img id="referenceImage" alt="Reference artwork" draggable="false" hidden></div><footer class="reference-footer"><span id="referenceStatus" role="status">Drag the title bar · resize from the corner</span><label title="Pass clicks through the image to the canvas underneath"><input id="referenceTrace" type="checkbox"> Trace through</label><button id="referenceResize" type="button" aria-label="Resize reference image" title="Drag to resize. Arrow keys resize; Shift changes one pixel.">◢</button></footer><input id="referenceInput" type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif,image/bmp" hidden>`;
document.body.append(referencePanel);
let referenceUrl=null,referenceLoadToken=0,referenceGesture=null;
let referenceLayout={x:20,y:100,width:320,height:360,opacity:100,trace:false};
try{const saved=JSON.parse(localStorage.getItem('pokespritesuite-reference-layout')||'null');if(saved&&['x','y','width','height','opacity'].every(k=>Number.isFinite(saved[k]))){referenceLayout={...referenceLayout,...saved,trace:!!saved.trace}}}catch{}
function referenceBounds(){return {width:document.documentElement.clientWidth,height:window.innerHeight}}
function clampReference(){
 const viewport=referenceBounds(),maxWidth=Math.max(160,viewport.width-16),maxHeight=Math.max(160,viewport.height-16);
 referenceLayout.width=Math.max(Math.min(230,maxWidth),Math.min(maxWidth,referenceLayout.width));referenceLayout.height=Math.max(Math.min(210,maxHeight),Math.min(maxHeight,referenceLayout.height));
 referenceLayout.x=Math.max(8,Math.min(viewport.width-referenceLayout.width-8,referenceLayout.x));referenceLayout.y=Math.max(8,Math.min(viewport.height-referenceLayout.height-8,referenceLayout.y));
 Object.assign(referencePanel.style,{left:referenceLayout.x+'px',top:referenceLayout.y+'px',width:referenceLayout.width+'px',height:referenceLayout.height+'px'});
}
function saveReferenceLayout(){try{localStorage.setItem('pokespritesuite-reference-layout',JSON.stringify(referenceLayout))}catch{}}
function updateReferenceOpacity(){referenceLayout.opacity=Math.max(0,Math.min(100,Number(referenceLayout.opacity)||0));$('referenceOpacity').value=referenceLayout.opacity;$('referenceOpacityValue').textContent=referenceLayout.opacity+'%';$('referenceImage').style.opacity=referenceLayout.opacity/100;saveReferenceLayout()}
function setReferenceVisible(visible){referencePanel.hidden=!visible;$('referenceToggle').checked=visible;if(visible){clampReference();$('referenceHandle').focus()}else referenceGesture=null}
$('referenceToggle').onchange=()=>setReferenceVisible($('referenceToggle').checked);
$('referenceClose').onclick=()=>{setReferenceVisible(false);$('referenceToggle').focus()};
$('referenceReset').onclick=()=>{const viewport=referenceBounds();referenceLayout={...referenceLayout,x:Math.max(8,viewport.width-340),y:100,width:320,height:360};clampReference();saveReferenceLayout()};
$('referenceOpacity').oninput=()=>{referenceLayout.opacity=+$('referenceOpacity').value;updateReferenceOpacity()};
function updateReferenceTrace(){referencePanel.classList.toggle('trace-through',referenceLayout.trace&&!!referenceUrl);$('referenceTrace').disabled=!referenceUrl}
$('referenceTrace').checked=referenceLayout.trace;updateReferenceTrace();
$('referenceTrace').onchange=()=>{referenceLayout.trace=$('referenceTrace').checked;if(referenceLayout.trace&&referenceLayout.opacity===100){referenceLayout.opacity=50;updateReferenceOpacity()}updateReferenceTrace();saveReferenceLayout()};
updateReferenceOpacity();
function startReferenceGesture(e,kind){if(e.button!==0)return;if(kind==='move'&&e.target.closest('button,input,label'))return;e.preventDefault();referenceGesture={kind,id:e.pointerId,startX:e.clientX,startY:e.clientY,...referenceLayout};e.currentTarget.setPointerCapture(e.pointerId);referencePanel.classList.add('moving')}
function moveReferenceGesture(e){if(!referenceGesture||referenceGesture.id!==e.pointerId)return;const dx=e.clientX-referenceGesture.startX,dy=e.clientY-referenceGesture.startY;if(referenceGesture.kind==='move'){referenceLayout.x=referenceGesture.x+dx;referenceLayout.y=referenceGesture.y+dy}else{const viewport=referenceBounds();referenceLayout.width=Math.min(viewport.width-referenceLayout.x-8,referenceGesture.width+dx);referenceLayout.height=Math.min(viewport.height-referenceLayout.y-8,referenceGesture.height+dy)}clampReference()}
function endReferenceGesture(){if(!referenceGesture)return;referenceGesture=null;referencePanel.classList.remove('moving');saveReferenceLayout()}
for(const [id,kind] of [['referenceHandle','move'],['referenceResize','resize']]){const handle=$(id);handle.onpointerdown=e=>startReferenceGesture(e,kind);handle.onpointermove=moveReferenceGesture;handle.onpointerup=handle.onpointercancel=endReferenceGesture;handle.onlostpointercapture=endReferenceGesture;handle.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||e.target!==handle)return;e.preventDefault();const n=e.shiftKey?1:10,dx=e.key==='ArrowLeft'?-n:e.key==='ArrowRight'?n:0,dy=e.key==='ArrowUp'?-n:e.key==='ArrowDown'?n:0;if(kind==='move'){referenceLayout.x+=dx;referenceLayout.y+=dy}else{referenceLayout.width+=dx;referenceLayout.height+=dy}clampReference();saveReferenceLayout()}}
referencePanel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();setReferenceVisible(false);$('referenceToggle').focus()}e.stopPropagation()});
window.addEventListener('resize',()=>{if(!referencePanel.hidden){clampReference();saveReferenceLayout()}});
$('referenceUpload').onclick=$('referenceChoose').onclick=()=>$('referenceInput').click();
async function showReferenceSource(source,name,owned=false){
 const token=++referenceLoadToken,probe=new Image();$('referenceStatus').textContent='Loading reference…';
 try{await new Promise((resolve,reject)=>{probe.onload=resolve;probe.onerror=()=>reject(Error('Could not load that image. Save it and use Upload image instead.'));probe.src=source});if(token!==referenceLoadToken){if(owned)URL.revokeObjectURL(source);return}
  const old=referenceUrl;referenceUrl=source;$('referenceImage').src=source;$('referenceImage').alt='Reference: '+name;$('referenceImage').hidden=false;$('referenceChoose').hidden=true;$('referenceUpload').textContent='↥ Replace image';$('referenceStatus').textContent=name+' · '+probe.naturalWidth+' × '+probe.naturalHeight;$('referenceStatus').title='Reference is not included in sprite exports.';if(old&&old.startsWith('blob:'))URL.revokeObjectURL(old);updateReferenceTrace();
 }catch(error){if(owned)URL.revokeObjectURL(source);if(token===referenceLoadToken)$('referenceStatus').textContent=error.message}
}
async function loadReferenceImage(file){
 if(!file){$('referenceStatus').textContent='Drop an image file or image from a browser.';return}
 const imageType=/^image\/(png|jpeg|gif|webp|avif|bmp|x-ms-bmp)$/i.test(file.type),imageName=/\.(png|jpe?g|gif|webp|avif|bmp)$/i.test(file.name||'');
 if(!imageType&&!imageName){$('referenceStatus').textContent='Choose a PNG, JPEG, GIF, WebP, AVIF or BMP image.';return}
 if(file.size>20*1024*1024){$('referenceStatus').textContent='Choose an image smaller than 20 MB.';return}
 await showReferenceSource(URL.createObjectURL(file),file.name,true);
}
$('referenceInput').onchange=async e=>{await loadReferenceImage(e.target.files[0]);e.target.value=''};
function clearReferenceDrop(){referencePanel.classList.remove('receiving-drop');$('referenceDropzone').classList.remove('drag-over')}
function droppedReferenceUrl(transfer){
 const html=transfer.getData('text/html'),sources=[];
 if(html){const doc=new DOMParser().parseFromString(html,'text/html');sources.push(doc.querySelector('img')?.getAttribute('src')||'')}
 sources.push(...transfer.getData('text/uri-list').split(/\r?\n/).filter(line=>line.trim()&&!line.startsWith('#')),transfer.getData('text/plain'));
 for(const candidate of sources){const source=candidate.trim();if(/^data:image\/(png|jpeg|gif|webp|avif|bmp);/i.test(source))return source;try{const url=new URL(source);if(['http:','https:','blob:'].includes(url.protocol))return url.href}catch{}}
 return null;
}
referencePanel.addEventListener('dragover',e=>{e.preventDefault();e.stopPropagation();if(e.dataTransfer)e.dataTransfer.dropEffect='copy';$('referenceDropzone').classList.add('drag-over')},true);
async function handleReferenceDrop(e){
 e.preventDefault();e.stopPropagation();clearReferenceDrop();const transfer=e.dataTransfer;if(!transfer)return;
 const files=[...transfer.files];for(const item of transfer.items||[])if(item.kind==='file'){const file=item.getAsFile();if(file&&!files.includes(file))files.push(file)}
 const file=files.find(file=>/^image\//i.test(file.type)||/\.(png|jpe?g|gif|webp|avif|bmp)$/i.test(file.name||''))||files[0];
 if(file){await loadReferenceImage(file);return}
 const source=droppedReferenceUrl(transfer);if(!source){$('referenceStatus').textContent='Drop an image file, or save the picture and use Upload image.';return}
 let name='Dropped image';try{name=decodeURIComponent(new URL(source).pathname.split('/').pop())||name}catch{}
 await showReferenceSource(source,name);
}
referencePanel.addEventListener('drop',handleReferenceDrop,true);
window.addEventListener('dragenter',()=>{if(!referencePanel.hidden)referencePanel.classList.add('receiving-drop')});
window.addEventListener('dragover',e=>{if(referencePanel.hidden)return;referencePanel.classList.add('receiving-drop');const r=referencePanel.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='copy'}},true);
window.addEventListener('drop',e=>{if(referencePanel.hidden||referencePanel.contains(e.target))return;const r=referencePanel.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)handleReferenceDrop(e)},true);
window.addEventListener('dragleave',e=>{if(!e.relatedTarget)clearReferenceDrop()});window.addEventListener('dragend',clearReferenceDrop);window.addEventListener('drop',clearReferenceDrop);
window.addEventListener('pagehide',e=>{if(!e.persisted&&referenceUrl?.startsWith('blob:'))URL.revokeObjectURL(referenceUrl)});

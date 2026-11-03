'use strict';
// Composite frames remain compatible with previews and every existing game export.
const frameLayerStacks=new WeakMap();
const MAX_FRAME_LAYERS=32;
let layerClipboard=null;
function cloneLayerCanvas(source,n=source.width){const c=canvas(n);ctx(c).drawImage(source,0,0);return c}
function layersFor(frame=frames[active]){
 let state=frameLayerStacks.get(frame);
 if(!state){state={selected:0,layers:[{name:'Base art',visible:true,locked:false,opacity:1,image:cloneLayerCanvas(frame)}]};frameLayerStacks.set(frame,state)}
 return state;
}
function activeLayer(){const state=layersFor();return state.layers[state.selected]}
function editableLayerCanvas(){return activeLayer().image}
function canEditLayer(){const layer=activeLayer();if(layer.locked||!layer.visible){toast(layer.locked?'Unlock the selected layer to draw.':'Show the selected layer to draw.');return false}return true}
function compositeFrame(frame=frames[active]){const state=frameLayerStacks.get(frame);if(!state)return;const c=ctx(frame);c.clearRect(0,0,frame.width,frame.height);for(const layer of state.layers){if(!layer.visible)continue;c.globalAlpha=layer.opacity;c.drawImage(layer.image,0,0)}c.globalAlpha=1}
function snapshotLayers(){return frames.map(frame=>{const state=layersFor(frame);return {selected:state.selected,layers:state.layers.map(layer=>({name:layer.name,visible:layer.visible,locked:layer.locked,opacity:layer.opacity,png:layer.image.toDataURL()}))}})}
async function restoreLayers(saved){
 if(!saved)return;
 if(!Array.isArray(saved)||saved.length!==frames.length)throw Error('Invalid project layer frames.');
 const states=await Promise.all(saved.map(async state=>{
  if(!Array.isArray(state.layers)||!state.layers.length||state.layers.length>MAX_FRAME_LAYERS)throw Error('A frame must have 1–32 layers.');
  const layers=await Promise.all(state.layers.map(async item=>{
   if(typeof item.png!=='string'||!item.png.startsWith('data:image/png;'))throw Error('Invalid layer image.');
   const im=await imageFrom(item.png);if(im.width!==size||im.height!==size)throw Error('Layer dimensions do not match the frame.');
   const image=canvas(size);ctx(image).drawImage(im,0,0);
   return {name:String(item.name||'Layer').slice(0,60),visible:item.visible!==false,locked:!!item.locked,opacity:Number.isFinite(item.opacity)?Math.max(0,Math.min(1,item.opacity)):1,image};
  }));
  return {selected:Number.isInteger(state.selected)?Math.max(0,Math.min(layers.length-1,state.selected)):0,layers};
 }));
 frames.forEach((frame,i)=>{frameLayerStacks.set(frame,states[i]);compositeFrame(frame)});
}
function duplicateFrameLayers(source,target){const old=layersFor(source);frameLayerStacks.set(target,{selected:old.selected,layers:old.layers.map(layer=>({...layer,image:cloneLayerCanvas(layer.image)}))});compositeFrame(target)}
function resizeLayerFrames(next){return frames.map(frame=>{const old=layersFor(frame),target=canvas(next);frameLayerStacks.set(target,{selected:old.selected,layers:old.layers.map(layer=>{const image=canvas(next);ctx(image).drawImage(layer.image,Math.floor((next-size)/2),next-size);return {...layer,image}})});compositeFrame(target);return target})}
function selectLayer(index){const state=layersFor();if(index<0||index>=state.layers.length)return;state.selected=index;renderLayers();save()}
function layerAction(action){
 const state=layersFor(),index=state.selected,layer=state.layers[index];
 if(['add','duplicate'].includes(action)&&state.layers.length>=MAX_FRAME_LAYERS){toast('Up to 32 layers per frame');return}
 if(action==='delete'&&state.layers.length===1){toast('Keep at least one layer; use Clear layer to erase its pixels.');return}
 if(action==='up'&&index===state.layers.length-1||action==='down'&&index===0)return;
 if(action==='merge'&&(index===0||layer.locked||state.layers[index-1].locked||!layer.visible||!state.layers[index-1].visible)){toast('Merge needs two visible, unlocked layers.');return}
 checkpoint();
 if(action==='add'){state.layers.splice(index+1,0,{name:'Layer '+(state.layers.length+1),visible:true,locked:false,opacity:1,image:canvas(size)});state.selected++}
 if(action==='duplicate'){state.layers.splice(index+1,0,{...layer,name:(layer.name+' copy').slice(0,60),image:cloneLayerCanvas(layer.image)});state.selected++}
 if(action==='delete'){state.layers.splice(index,1);state.selected=Math.min(index,state.layers.length-1)}
 if(action==='up'||action==='down'){const next=index+(action==='up'?1:-1);[state.layers[index],state.layers[next]]=[state.layers[next],state.layers[index]];state.selected=next}
 if(action==='visibility')layer.visible=!layer.visible;
 if(action==='lock')layer.locked=!layer.locked;
 if(action==='merge'){
  const below=state.layers[index-1],image=canvas(size),c=ctx(image);c.globalAlpha=below.opacity;c.drawImage(below.image,0,0);c.globalAlpha=layer.opacity;c.drawImage(layer.image,0,0);below.image=image;below.opacity=1;state.layers.splice(index,1);state.selected--;
 }
 compositeFrame();changed();
}
function copyLayerToClipboard(cut=false){
 const state=layersFor(),layer=activeLayer();
 if(cut&&layer.locked){toast('Unlock the layer before cutting it.');return}
 layerClipboard={...layer,image:cloneLayerCanvas(layer.image)};
 if(cut){
  checkpoint();
  if(state.layers.length===1){state.layers[0]={name:'Base art',visible:true,locked:false,opacity:1,image:canvas(size)}}
  else{state.layers.splice(state.selected,1);state.selected=Math.min(state.selected,state.layers.length-1)}
  compositeFrame();changed();
 }else renderLayers();
 toast((cut?'Cut ':'Copied ')+layer.name+'. Switch frames and paste with Ctrl/⌘V.');
}
function pasteLayerFromClipboard(){
 if(!layerClipboard){toast('Copy or cut a layer first.');return}
 const state=layersFor();if(state.layers.length>=MAX_FRAME_LAYERS){toast('Up to 32 layers per frame');return}
 checkpoint();const image=canvas(size),source=layerClipboard.image;
 ctx(image).drawImage(source,Math.floor((size-source.width)/2),size-source.height);
 state.layers.splice(state.selected+1,0,{...layerClipboard,name:layerClipboard.name.slice(0,60),locked:false,image});state.selected++;
 compositeFrame();changed();toast('Layer pasted into '+frameLabels()[active]);
}
function renderLayers(){
 const state=layersFor(),layer=activeLayer(),list=$('layerList');if(!list)return;
 $('layerFrameName').textContent=frameLabels()[active]+' · '+state.layers.length+'/'+MAX_FRAME_LAYERS;
 list.replaceChildren();
 [...state.layers].reverse().forEach((layer,reverse)=>{
  const index=state.layers.length-1-reverse,row=document.createElement('div');row.className='layer-row'+(index===state.selected?' selected':'');
  const visible=document.createElement('button');visible.className='layer-icon';visible.textContent=layer.visible?'◉':'○';visible.title=(layer.visible?'Hide ':'Show ')+layer.name;visible.setAttribute('aria-label',visible.title);visible.setAttribute('aria-pressed',String(layer.visible));visible.onclick=()=>{checkpoint();layer.visible=!layer.visible;compositeFrame();changed()};
  const pick=document.createElement('button');pick.className='layer-pick';pick.setAttribute('aria-label','Select layer '+layer.name);pick.setAttribute('aria-pressed',String(index===state.selected));
  const thumb=canvas(32);ctx(thumb).imageSmoothingEnabled=false;ctx(thumb).drawImage(layer.image,0,0,32,32);const title=document.createElement('span');title.textContent=layer.name;const info=document.createElement('small');info.textContent=Math.round(layer.opacity*100)+'%'+(layer.locked?' · locked':'');title.append(info);pick.append(thumb,title);pick.onclick=()=>selectLayer(index);
  row.append(visible,pick);list.append(row);
 });
 $('layerName').value=layer.name;$('layerOpacity').value=Math.round(layer.opacity*100);$('layerOpacityValue').textContent=Math.round(layer.opacity*100)+'%';$('layerLocked').checked=layer.locked;
 $('layerUp').disabled=state.selected===state.layers.length-1;$('layerDown').disabled=state.selected===0;
 $('layerMerge').disabled=state.selected===0||layer.locked||state.layers[state.selected-1]?.locked||!layer.visible||!state.layers[state.selected-1]?.visible;
 $('layerDelete').disabled=state.layers.length===1||layer.locked;$('layerCut').disabled=layer.locked;$('layerPaste').disabled=!layerClipboard;
 $('layerAdd').disabled=$('layerDuplicate').disabled=state.layers.length>=MAX_FRAME_LAYERS;
 $('clear').textContent='Clear layer';$('flip').title='Flip selected layer';$('copyFrame').title='Copy all layers from the previous frame';
}
function initLayerControls(){
 $('layerCopy').onclick=()=>copyLayerToClipboard();$('layerCut').onclick=()=>copyLayerToClipboard(true);$('layerPaste').onclick=pasteLayerFromClipboard;
 for(const [id,action] of [['layerAdd','add'],['layerDuplicate','duplicate'],['layerDelete','delete'],['layerUp','up'],['layerDown','down'],['layerMerge','merge']])$(id).onclick=()=>layerAction(action);
 $('layerLocked').onchange=()=>layerAction('lock');
 let renamed=false;$('layerName').onfocus=()=>renamed=false;$('layerName').oninput=()=>{if(!renamed){checkpoint();renamed=true}activeLayer().name=$('layerName').value.slice(0,60)||'Layer';save()};$('layerName').onblur=()=>{renamed=false;renderLayers()};
 let opacityCheckpoint=false;$('layerOpacity').oninput=()=>{if(!opacityCheckpoint){checkpoint();opacityCheckpoint=true}activeLayer().opacity=+$('layerOpacity').value/100;$('layerOpacityValue').textContent=$('layerOpacity').value+'%';compositeFrame();renderEditor();renderTimeline();renderPreview();renderPalette();effectCache.clear();editorVariants={}};
 $('layerOpacity').onchange=()=>{opacityCheckpoint=false;changed()};
 document.addEventListener('keydown',e=>{
  if(view!=='editor'||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||$('help').open||document.querySelector('dialog[open]'))return;
  if((e.ctrlKey||e.metaKey)&&!e.altKey&&!e.shiftKey&&['c','x','v'].includes(e.key.toLowerCase())){e.preventDefault();if(e.key.toLowerCase()==='v')pasteLayerFromClipboard();else copyLayerToClipboard(e.key.toLowerCase()==='x');return}
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const key=e.key.toLowerCase();
  if(e.key==='['||e.key===']'){e.preventDefault();const state=layersFor();selectLayer(Math.max(0,Math.min(state.layers.length-1,state.selected+(e.key===']'?1:-1))));return}
  if(key==='n'){e.preventDefault();layerAction('add')}
  if(key==='d'){e.preventDefault();layerAction('duplicate')}
  if(key==='v'){e.preventDefault();layerAction('visibility')}
  if(key==='l'){e.preventDefault();layerAction('lock')}
 });
}

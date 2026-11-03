'use strict';
const replaceShadeButton=document.createElement('button');replaceShadeButton.id='replaceShadeTrigger';replaceShadeButton.className='shade-replace-trigger';replaceShadeButton.textContent='Replace selected shade…';replaceShadeButton.disabled=true;$('shadeLegend').append(replaceShadeButton);
const shadeReplacePanel=document.createElement('details');shadeReplacePanel.id='shadeReplacePanel';shadeReplacePanel.className='shade-replace-panel';shadeReplacePanel.innerHTML='<summary>Replace exact shade <span id="replaceShadeSource">Select a numbered shade from the guide</span></summary><div class="shade-replace-body"><label class="field-label">Replace with<input id="replaceShadeHex" aria-label="Replacement shade hex" maxlength="9" value="#000002" spellcheck="false"></label><label class="field-label">Apply to<select id="replaceShadeScope"><option value="all">All frames · unlocked layers</option><option value="frame">This frame · unlocked layers</option><option value="layer">Selected layer only</option></select></label><button id="replaceShadeApply" class="button accent" disabled>Replace shade</button></div><p id="replaceShadeStatus" class="micro" role="status">Matches exact pixel RGBA, including hidden layers. Six-digit hex preserves pixel opacity. Undo restores changes.</p>';
document.querySelector('.brush-settings-body').append(shadeReplacePanel);
let replaceShadeSelection=null;
function replaceProjectKey(){return [projectToken,currentId,mode,variant].join('|')}
$('shadeLegendRows').addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button||!$('shadeLegendRows').contains(button))return;
 const number=Number(button.querySelectorAll('i')[1]?.textContent),shade=shadeGuideFor(frames).find(s=>s.number===number);if(!shade)return;
 replaceShadeSelection={rgba:[...shade.rgba],hex:shade.hex,number,key:replaceProjectKey()};
 $('replaceShadeSource').textContent='Shade '+number+' · '+shade.hex+(shade.rgba[3]<255?' · '+Math.round(shade.rgba[3]/255*100)+'% opacity':'');
 $('replaceShadeHex').value=shade.hex;replaceShadeButton.disabled=false;$('replaceShadeApply').disabled=false;
 $('replaceShadeStatus').textContent='Only this exact shade changes. Nearby colors stay untouched. Locked layers are skipped; Undo restores changes.';
});
replaceShadeButton.onclick=()=>{document.querySelector('.brush-settings').open=true;shadeReplacePanel.open=true;$('replaceShadeHex').focus();$('replaceShadeHex').select()};
$('replaceShadeApply').onclick=()=>{
 const selection=replaceShadeSelection;if(!selection||selection.key!==replaceProjectKey()){$('replaceShadeStatus').textContent='Select a shade from this artwork’s guide first.';return}
 const value=$('replaceShadeHex').value.trim();if(!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)){$('replaceShadeStatus').textContent='Enter #RRGGBB or #RRGGBBAA.';return}
 const replacement=[1,3,5].map(i=>parseInt(value.slice(i,i+2),16));replacement.push(value.length===9?parseInt(value.slice(7,9),16):selection.rgba[3]);
 if(replacement.every((v,i)=>v===selection.rgba[i])){$('replaceShadeStatus').textContent='Choose a different replacement color.';return}
 const scope=$('replaceShadeScope').value,targets=scope==='all'?frames:[frames[active]],edits=[];let count=0,skipped=0;
 for(const frame of targets){const state=layersFor(frame),layers=scope==='layer'?[state.layers[state.selected]]:state.layers;
  for(const layer of layers){const c=ctx(layer.image),image=c.getImageData(0,0,size,size),positions=[];
   for(let i=0;i<image.data.length;i+=4)if(selection.rgba.every((v,j)=>image.data[i+j]===v))positions.push(i);
   if(!positions.length)continue;if(layer.locked){skipped+=positions.length;continue}
   count+=positions.length;edits.push({frame,c,image,positions});
  }
 }
 if(!count){$('replaceShadeStatus').textContent=skipped?'Matching pixels are on locked layers. Unlock them to replace.':'No matching pixels in this scope.';return}
 checkpoint();for(const edit of edits){for(const offset of edit.positions)edit.image.data.set(replacement,offset);edit.c.putImageData(edit.image,0,0)}for(const frame of new Set(edits.map(edit=>edit.frame)))compositeFrame(frame);
 changed();setColor(value.slice(0,7),replacement[3]);$('replaceShadeStatus').textContent='Replaced '+count+' exact pixels'+(skipped?'; skipped '+skipped+' locked pixels':'')+'. Undo is available.';toast('Replaced '+count+' exact-shade pixels');
};

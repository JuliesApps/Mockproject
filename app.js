(() => {
  'use strict';
  const KNOWLEDGE=window.CLEARFRAME_DATA;
  const EVIDENCE=window.CLEARFRAME_EVIDENCE;
  const REASONER=window.ClearframeReasoner;
  const STORE=window.ClearframeStore;
  const app=document.getElementById('app');
  const dialog=document.getElementById('detail-dialog');
  const dialogContent=document.getElementById('dialog-content');
  const toastEl=document.getElementById('toast');
  let state=STORE.fresh(), analysis=null, draft='', selectedRoutine='obligation', dictionarySearch='', dictionaryFilter='all', evidenceSearch='', evidenceFilter='all', momentSearch='', importMode='merge', toastTimer, swappedShoes=false;

  const ROLE_THEMES={
    neutral:{guardian:'Guardian',sibling:'Sibling',self:'You'},
    legacy:{guardian:'MotherQ',sibling:'SisterQ',self:'You'},
    storybook:{guardian:'WickedWitch',sibling:'TinMan',self:'DorothyGale'}
  };
  const ROLE_HELP={guardian:'Caretaker, authority figure, or person holding the original power.',sibling:'Peer, witness, messenger, intermediary, or person caught between loyalties.',self:'The person whose response we are trying to understand.'};
  const roles=()=>({...ROLE_THEMES.neutral,...(state.roleTheme?.aliases||{})});
  const roleName=id=>roles()[id]||ROLE_THEMES.neutral[id]||id;
  // Role labels are presentation only. Never use them to determine an inference.
  const roleExample=value=>String(value||'').replace(/\b(mom|mother)\b/gi,roleName('guardian')).replace(/\b(sister)\b/gi,roleName('sibling'));

  // Swap Shoes only changes how Step 3 statements are read. It never changes evidence IDs,
  // selected checkboxes, or the reasoner's inputs. Shared pronouns (we/us/our) stay shared.
  function swapPronouns(value){
    const pairs={i:'they',me:'them',my:'their',mine:'theirs',myself:'themselves',
      they:'I',them:'me',their:'my',theirs:'mine',themselves:'myself'};
    return String(value||'').replace(/\b(?:myself|themselves|theirs|their|mine|they|them|my|me|I)\b/gi,(word,offset,source)=>{
      const replacement=pairs[word.toLowerCase()];
      if(word.toLowerCase()==='i'){
        const beginning=offset===0||/[.!?]\s*$/.test(source.slice(0,offset));
        return beginning?'They':'they';
      }
      if(replacement==='I')return 'I';
      if(word[0]===word[0].toUpperCase())return replacement[0].toUpperCase()+replacement.slice(1);
      return replacement;
    }).replace(/\bI are\b/g,'I am').replace(/\bthey am\b/gi,'they are')
      .replace(/\bI were\b/g,'I was').replace(/\bthey was\b/gi,'they were');
  }

  const uid=()=>crypto.randomUUID?.()||('cf-'+Date.now()+'-'+Math.random().toString(36).slice(2));
  const e=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const titleCase=value=>String(value??'').toLowerCase().replace(/\b[a-z]/g,x=>x.toUpperCase()).replace(/\bQ\b/g,'Q');
  const fmtDate=value=>{try{const date=/^\d{4}-\d{2}-\d{2}$/.test(String(value))?new Date(value+'T12:00:00'):new Date(value);return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(date);}catch{return String(value||'');}};
  const nowLocalDate=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  const normalizeText=value=>String(value??'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").replace(/[^a-z0-9'\s]/g,' ').replace(/\s+/g,' ').trim();
  const normalizeRoutine=(base,edits={})=>({...base,...edits,name:titleCase(edits.name||base.name),roleExamples:{
    guardian:edits.roleExamples?.guardian??edits.mother??base.roleExamples?.guardian??base.mother??'',
    sibling:edits.roleExamples?.sibling??edits.sister??base.roleExamples?.sibling??base.sister??''
  }});
  const routineList=()=>[...KNOWLEDGE.routines.map(r=>normalizeRoutine(r,state.routineEdits[r.id])),...state.customRoutines.map(r=>normalizeRoutine(r))];
  const subList=()=>[...KNOWLEDGE.subroutines.map(s=>({...s,...state.subroutineEdits[s.id]})),...state.customSubroutines].map(s=>({...s,name:titleCase(s.name)}));
  const routine=id=>routineList().find(r=>r.id===id);
  const sub=id=>subList().find(s=>s.id===id);
  const owners=id=>routineList().filter(r=>(r.subroutineIds||[]).includes(id));
  const unique=arr=>[...new Set(arr.filter(Boolean))];
  const pill=(value,kind='quiet')=>`<span class="pill ${kind}">${e(value)}</span>`;
  const label=(value)=>`<span class="mini-kicker">${e(value)}</span>`;
  const routineOptions=(chosen='')=>routineList().map(r=>`<option value="${e(r.id)}" ${chosen===r.id?'selected':''}>${e(r.name)}</option>`).join('');
  function toast(msg){clearTimeout(toastTimer);toastEl.textContent=msg;toastEl.classList.add('show');toastTimer=setTimeout(()=>toastEl.classList.remove('show'),3200);}
  async function persist(){try{await STORE.save(state);}catch(error){toast('Could not save on this device. Export a backup.');console.error(error);}}
  function sectionIntro(overline,name,desc,extra=''){return `<div class="page-title-row"><div><div class="eyebrow">${e(overline)}</div><h1>${e(name)}</h1><p class="page-lede">${e(desc)}</p></div>${extra}</div>`;}

  function route(){const path=(location.hash||'#home').slice(1).split('?')[0];return ['home','atlas','dictionary','evidence','moments','roles','data'].includes(path)?path:'home';}
  function render(){
    const page=route();
    document.querySelectorAll('[data-nav]').forEach(a=>{a.classList.toggle('active',a.dataset.nav===page);a.setAttribute('aria-current',a.dataset.nav===page?'page':'false');});
    const names={home:'Process an emotion',atlas:'Pressure-Point Atlas',dictionary:'Pattern dictionary',evidence:'Present-day signals',moments:'Saved moments',roles:'Roles & themes',data:'Data & privacy'};
    document.getElementById('breadcrumb').textContent='Workspace / '+names[page];
    app.innerHTML=({home:renderHome,atlas:renderAtlas,dictionary:renderDictionary,evidence:renderEvidenceDictionary,moments:renderMoments,roles:renderRoles,data:renderData}[page])();
    document.getElementById('sidebar').classList.remove('open');document.getElementById('menu-toggle').setAttribute('aria-expanded','false');
  }

  function renderHome(){
    return `<div class="home-hero"><div class="hero-intro"><div class="hero-overline"><span class="tiny-star">✳</span><span class="eyebrow">UNDERSTAND THE REACTION, KEEP YOUR AGENCY</span></div><h1>Find the thread.<br>Not the fault.</h1><p>An old warning can feel current. Explore five connected parts: control routine, subroutine, learned expectation, protective response, and present-day reality indicators. No journal required.</p></div><div class="hero-aside"><span class="hero-numeral">5 LINKED FIELDS</span><h3>Five fields. One connected atlas.</h3><p>Trace the old dynamic, understand the protection it taught, test today's evidence, and choose a proportionate response.</p></div></div>
    <div class="grid-2"><section class="card"><div class="card-head"><div><div class="overline">QUICK PROCESSING</div><h2>What's weighing on you?</h2></div>${pill('No account required','green')}</div>
      <div class="input-surface"><textarea id="moment-input" aria-label="Describe your current emotion or situation" placeholder="What happened? Or what thought keeps coming back? One sentence is enough…">${e(draft)}</textarea><div class="input-footer"><span class="subtle">You can start messy. There's no right way to phrase it.</span><button class="button" data-action="analyze">Untangle this <span aria-hidden="true">↗</span></button></div></div>
      <div class="sample-row">${KNOWLEDGE.examples.map(ex=>`<button class="sample-chip" data-action="use-example" data-id="${e(ex.id)}">${e(ex.label)}</button>`).join('')}</div><div class="privacy-line"><span aria-hidden="true">⌁</span> Nothing is saved unless you choose to save it.</div>
    </section><aside class="stack"><div class="card soft"><div class="mini-kicker">THE DIFFERENCE THAT MATTERS</div><h3>A familiar alarm isn't always a present danger.</h3><p class="subtle">And sometimes the present behaviour really is concerning. A comparison should be able to recognize either outcome—or admit it does not know.</p></div><div class="card"><div class="mini-kicker">BUILT-IN DICTIONARIES</div><div class="metric-row" style="grid-template-columns:1fr 1fr 1fr;margin-top:12px;margin-bottom:12px"><div><strong style="font-size:2rem">${routineList().length}</strong><div class="subtle">Routines</div></div><div><strong style="font-size:2rem">${subList().length}</strong><div class="subtle">Subroutines</div></div><div><strong style="font-size:2rem">${EVIDENCE.entries.length}</strong><div class="subtle">Reality signals</div></div></div><p class="subtle">Explore the <a class="linkish" href="#atlas">atlas</a> and <a class="linkish" href="#evidence">present-day evidence dictionary</a>.</p></div><div class="card"><div class="mini-kicker">ROLE-AGNOSTIC EXAMPLES</div><div class="cast-mini">${['guardian','sibling','self'].map(id=>`<div><small>${e(id)}</small><strong>${e(roleName(id))}</strong></div>`).join('')}</div><a class="button small outline" href="#roles">Customize your cast</a></div></aside></div>
    ${analysis?`<section class="result-section analysis-panel">${renderAnalysis()}</section>`:''}
    <div class="footnote">Clearframe offers prompts for reflection, not diagnoses or mind-reading. If someone is threatening, coercing, or repeatedly crossing a boundary, you don't have to explain that behaviour away.</div>`;
  }

  function scoreRoutines(text){
    const norm=normalizeText(text), list=routineList();
    let matches=list.map(r=>{
      let score=0;
      for(const signal of r.signals||[]){
        const needle=normalizeText(signal);
        if(!needle)continue;
        if(norm.includes(needle))score+=needle.includes(' ')?4:2;
      }
      const name=normalizeText(r.name).split(' / ');
      if(name.some(t=>norm.includes(t)&&t.length>6))score+=1;
      return {id:r.id,score};
    }).sort((a,b)=>b.score-a.score);
    if(/pepper|pasta/.test(norm))return ['misunderstood','betrayal','rejection'];
    if(/after everything|come visit/.test(norm))return ['obligation','abandonment','autonomy'];
    const found=matches.filter(m=>m.score>0).slice(0,3).map(m=>m.id);
    return found.length?found:['misunderstood','rejection'];
  }
  function newAnalysis(text){
    const top=scoreRoutines(text), norm=normalizeText(text);
    let selectedSubs=unique(top.flatMap(id=>routine(id)?.subroutineIds||[])).slice(0,7);
    if(/pepper|pasta/.test(norm))selectedSubs=['forgotten-preference','malice-attribution','retaliation-forecast','mind-reading','rejection-forecast'];
    if(/after everything|come visit/.test(norm))selectedSubs=['emotional-debt','sacrifice-ledger','boundary-guilt','fear-disappointment','conditional-affection'];
    return {id:null,text,top,selectedSubs,evidenceMatches:{},showAllEvidence:false,next:'',createdAt:new Date().toISOString()};
  }
  function signalCard(item,a){
    const checked=!!a.evidenceMatches?.[item.id];
    return `<button type="button" class="signal-choice ${checked?'matched':''} ${item.kind}" data-action="toggle-evidence" data-id="${e(item.id)}" aria-pressed="${checked}"><span class="signal-mark">${checked?'✓':'+'}</span><span>${e(swappedShoes?swapPronouns(item.statement):item.statement)}${item.severity==='high'?'<small class="signal-warning">Potential safety or coercion concern</small>':''}</span></button>`;
  }
  function renderAnalysis(){
    const a=analysis, top=(a.top||[]).map(routine).filter(Boolean), subs=(a.selectedSubs||[]).map(sub).filter(Boolean);
    const result=REASONER.evaluate(a,subList(),EVIDENCE.entries);
    const selection=REASONER.candidates(a,EVIDENCE.entries);
    const shown=a.showAllEvidence?[...selection.suggested,...selection.additional]:selection.suggested;
    const others=unique(a.top.flatMap(id=>routine(id)?.subroutineIds||[])).filter(id=>!a.selectedSubs.includes(id));
    const statusText={undetermined:'Not enough present-day evidence',different:'Older expectation challenged',concerning:'Current concern recognized',mixed:'Mixed present-day evidence'};
    const statusColor={undetermined:'quiet',different:'green',concerning:'rose',mixed:'gold'};
    const disposition={untested:'Not tested',supported:'Current behaviour resembles the old pattern',challenged:'Present behaviour challenges the old prediction',mixed:'Conflicting evidence'};
    return `<div class="page-title-row" style="margin-top:22px"><div><div class="eyebrow">YOUR COMPARISON</div><h2>Compare the old rule with today's reality.</h2><p class="page-lede">Nothing here requires a diary. Mark only observable behaviours you recognize. Unmarked statements remain unknown, not false.</p></div>${pill('Transparent local reasoning','green')}</div>
      <div class="card" style="margin-bottom:17px"><div class="card-head"><h3>1 · The moment</h3>${pill('Your own words')}</div><div class="quote-block">“${e(a.text)}”</div><p class="test-hint" style="margin-top:12px">A description may include facts, fears, and assumptions together. Text matching identifies possible topics; it does not verify intentions.</p></div>
      <div class="card" style="margin-bottom:17px"><div class="card-head"><h3>2 · Possible learned rules</h3><span class="counter">${subs.length} subroutines</span></div>
        <div class="tag-cloud">${top.map(t=>`<span class="pill green">${e(t.name)} <button class="linkish" style="margin-left:7px;text-decoration:none" data-action="remove-routine" data-id="${e(t.id)}" aria-label="Remove ${e(t.name)}">×</button></span>`).join('')}</div>
        <div style="margin-top:12px"><select id="analysis-routine-add" aria-label="Add a control routine"><option value="">+ Correct or add a control routine…</option>${routineList().filter(r=>!a.top.includes(r.id)).map(r=>`<option value="${e(r.id)}">${e(r.name)}</option>`).join('')}</select></div>
        <details class="disclosure" style="margin-top:15px"><summary>Review learned expectations and protective responses (${subs.length})</summary><div class="compact-stack" style="margin-top:12px">${subs.map(s=>`<label class="assumption-row"><input type="checkbox" data-assumption="${e(s.id)}" checked><span><strong>${e(s.name)}</strong><small><b>Learned expectation:</b> ${e(s.learned)}</small><small><b>Possible protective response:</b> ${e(s.protective||'Not described yet.')}</small></span></label>`).join('')}</div>${others.length?`<div class="tag-cloud" style="margin-top:11px">${others.map(id=>`<button class="pill interactive" data-action="add-sub" data-id="${e(id)}">+ ${e(sub(id)?.name||id)}</button>`).join('')}</div>`:''}</details></div>
      <div class="card" style="margin-bottom:17px"><div class="card-head"><div><div class="overline">THE PRESENT-DAY DICTIONARY</div><h3>3 · What have you actually observed?</h3></div>${pill(`${result.matched.length} matched`,result.matched.length?'green':'quiet')}</div>
        <div class="swap-shoes-row"><button type="button" class="button small outline" data-action="swap-shoes" aria-pressed="${swappedShoes}" aria-label="Swap Shoes: reverse the pronouns in these statements">⇄ Swap Shoes</button><span class="subtle">${swappedShoes?'Reading from the other perspective.':'Reading from your perspective.'} The evidence and result stay the same.</span></div>
        <p class="subtle" style="margin-bottom:16px">These are prewritten examples, not claims about your family or partner. Tap a statement only if it matches your experience with the person in this situation.</p>
        ${shown.length?`<div class="signal-columns"><div class="signal-column risk"><div class="signal-column-head"><span class="signal-key rose-key"></span><h4>Signs the old pattern may still be active</h4></div>${shown.filter(x=>x.kind==='repeats').map(s=>signalCard(s,a)).join('')||'<p class="subtle">No matching entries in this selection.</p>'}</div><div class="signal-column repair"><div class="signal-column-head"><span class="signal-key green-key"></span><h4>Signs this relationship may be different</h4></div>${shown.filter(x=>x.kind==='differs').map(s=>signalCard(s,a)).join('')||'<p class="subtle">No matching entries in this selection.</p>'}</div></div>`:`<div class="empty-state">No ready-made indicators are linked to the selected custom routine. Explore the dictionary or choose another routine.</div>`}
        ${selection.additional.length?`<button class="button small outline" style="margin-top:15px" data-action="toggle-more-evidence">${a.showAllEvidence?'Show fewer comparisons':`Show ${selection.additional.length} more relevant signals`}</button>`:''}
        <p class="help-text" style="margin-top:12px"><strong>Important:</strong> Not selecting a statement does not mean the opposite happened. This is a recognition tool, not a checklist where silence counts as proof.</p>
      </div>
      <section class="card" style="margin-bottom:17px"><div class="card-head"><h3>4 · What does the comparison actually show?</h3>${pill(result.urgent?'Specific safety concern':statusText[result.status],result.urgent?'rose':statusColor[result.status])}</div><div class="reason-stats"><div><strong>${result.counts.similar}</strong><span>Observed similarities</span></div><div><strong>${result.counts.different}</strong><span>Observed differences</span></div><div><strong>${result.counts.untested}</strong><span>Subroutines not tested</span></div></div>
        <div class="result-synthesis" style="margin-top:17px"><div class="mini-kicker">EVIDENCE-BASED SYNTHESIS</div><p>${e(result.conclusion)}</p></div>
        ${result.matched.length?`<div class="evidence-trail"><div class="mini-kicker">WHY THE RESULT CHANGED</div>${result.matched.map(item=>`<div class="trail-row"><span class="pill ${item.kind==='repeats'?'rose':'green'}">${item.kind==='repeats'?'Resembles old pattern':'Differs from old pattern'}</span><span>${e(item.statement)}</span></div>`).join('')}</div>`:`<div class="callout-quiet" style="margin-top:15px"><strong>No behavioural evidence was selected.</strong> Clearframe cannot justify a reassuring conclusion or a concerning one from the sentence alone.</div>`}
        <details class="disclosure" style="margin-top:17px"><summary>Show how each learned expectation was tested (${result.bySub.length})</summary><div class="compact-stack" style="margin-top:12px">${result.bySub.map(item=>`<div class="hypothesis-row"><div class="summary-bar"><strong>${e(item.title)}</strong>${pill(disposition[item.verdict],item.verdict==='supported'?'rose':item.verdict==='challenged'?'green':item.verdict==='mixed'?'gold':'quiet')}</div><p class="subtle" style="margin-top:8px"><strong>Learned expectation:</strong> ${e(item.learned)}</p><p class="subtle" style="margin-top:7px"><strong>Possible protective response:</strong> ${e(item.protective||'Not described yet.')}</p><p class="test-hint" style="margin-top:7px">${item.support.length?`${item.support.length} matching concern signal(s). `:''}${item.counter.length?`${item.counter.length} contrasting signal(s).`:''}${!item.support.length&&!item.counter.length?'No specific matching indicator selected for this subroutine.':''}</p>${item.verdict==='challenged'?`<p class="subtle" style="margin-top:7px">Possible updated rule: ${e(item.grounded)}</p>`:''}</div>`).join('')}</div></details>
      </section>
      <div class="result-next"><div class="mini-kicker">PROPORTIONATE NEXT STEP</div><p>${e(result.action)}</p></div>
      <div class="warning-box" style="margin-top:13px"><strong>Limits:</strong> The engine compares indicators you recognize; it cannot independently verify facts or intentions. A high-risk behaviour is never cancelled by a kind gesture somewhere else.</div>
      <div class="card" style="margin-top:20px"><div class="card-head"><h3>Keep this comparison? <span class="subtle" style="font-weight:450">Optional</span></h3><span class="pill quiet">Nothing auto-saves</span></div><div class="form-field"><label for="analysis-next">My own next step (optional note)</label><input id="analysis-next" value="${e(a.next)}" placeholder="My choice—not part of the calculation"></div><div class="form-actions"><button class="button" data-action="save-moment">${a.id?'Update saved moment':'Save this comparison'}</button><button class="button ghost" data-action="clear-analysis">Start fresh</button></div></div>`;
  }

  function atlasSvg(){
    const list=routineList(), count=list.length, center={x:380,y:292}, radiusX=275, radiusY=215;
    const positions=list.map((r,i)=>({r,x:center.x+Math.sin(2*Math.PI*i/count)*radiusX,y:center.y-Math.cos(2*Math.PI*i/count)*radiusY}));
    const truncate=name=>name.replace(' / ',' / ').split(' ');
    const lines=positions.map(({r,x,y})=>`<line class="atlas-line ${selectedRoutine===r.id?'highlight':''}" x1="${center.x}" y1="${center.y}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`).join('');
    const nodes=positions.map(({r,x,y})=>{
      const words=truncate(r.name);let upper='',lower='';
      if(words.length===1)upper=words[0];
      else {const at=Math.ceil(words.length/2);upper=words.slice(0,at).join(' ');lower=words.slice(at).join(' ');}
      const selected=r.id===selectedRoutine;
      return `<g class="atlas-node ${selected?'selected':''}" role="button" tabindex="0" aria-label="View ${e(r.name)}" data-action="select-routine" data-id="${e(r.id)}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="49"/><text x="${x.toFixed(1)}" y="${lower?(y-4).toFixed(1):(y+4).toFixed(1)}" text-anchor="middle"><tspan>${e(upper)}</tspan>${lower?`<tspan x="${x.toFixed(1)}" dy="15">${e(lower)}</tspan>`:''}</text></g>`;
    }).join('');
    return `<svg class="atlas-svg" viewBox="0 0 760 584" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Interactive hub-and-spoke map of relational control routines"><circle cx="380" cy="292" r="198" fill="none" stroke="#dce0ed" stroke-width="1" stroke-dasharray="4 6"/>${lines}<circle class="atlas-core" cx="380" cy="292" r="77"/><text class="atlas-core-text" x="380" y="285" text-anchor="middle">Pressure-Point</text><text class="atlas-core-text" x="380" y="305" text-anchor="middle">Atlas</text><text class="atlas-core-sub" x="380" y="325" text-anchor="middle">${count} connected routines</text>${nodes}</svg>`;
  }
  function renderInspector(){
    const r=routine(selectedRoutine)||routineList()[0];if(!r)return '';
    const children=(r.subroutineIds||[]).map(sub).filter(Boolean);
    const signals=EVIDENCE.entries.filter(x=>x.routineIds.includes(r.id));
    return `<div class="atlas-inspector"><div class="inspector-head"><div><div class="mini-kicker">FIELD 1 · CONTROL ROUTINE · ${e(r.domain||'Personal')}</div><h2>${e(r.name)}</h2><p>${e(r.summary)}</p></div><button class="button small outline" data-action="edit-routine" data-id="${e(r.id)}">✎ Edit routine</button></div>
      <div class="inspector-body"><div>${label('Why it may have been protective then')}<p>${e(r.then||'An earlier response may have protected you in a different environment.')}</p></div><div>${label('What to examine now')}<p>${e(r.now||'Consider what the present evidence supports.')}</p></div></div>
      <div class="mini-kicker">ROLE-BASED FICTIONAL EXAMPLES · NOT PERSONAL RECORDS</div><div class="example-lines"><div class="example-line"><strong>${e(roleName('guardian'))} <small class="role-key">Guardian role</small></strong> ${e(roleExample(r.roleExamples?.guardian||'No example yet.'))}</div><div class="example-line"><strong>${e(roleName('sibling'))} <small class="role-key">Sibling role</small></strong> ${e(roleExample(r.roleExamples?.sibling||'No example yet.'))}</div></div><p class="test-hint" style="margin:10px 0 22px">Changing the cast names never changes a routine, a subroutine, or the comparison logic. <a class="linkish" href="#roles">Edit role names</a>.</p>
      <div class="section-header"><div><div class="mini-kicker">FIELDS 2–5 · SHARED RECORDS</div><h3>Connected subroutines (${children.length})</h3></div><button class="button small light" data-action="add-sub-dialog" data-routine="${e(r.id)}">+ Add a subroutine</button></div>
      <div class="thread-list">${children.map((s,i)=>{const related=signals.filter(x=>x.subroutineIds.includes(s.id));return `<details class="thread-card" ${i===0?'open':''}><summary><strong>${e(s.name)}</strong><span>${related.length} linked reality signals</span></summary><div class="thread-grid"><div class="thread-field"><small>1 · Control Routine</small><p>${e(r.name)}</p></div><div class="thread-field"><small>2 · Subroutine</small><p>${e(s.meaning)}</p></div><div class="thread-field"><small>3 · Learned Expectation</small><p>${e(s.learned||'Not yet described.')}</p></div><div class="thread-field"><small>4 · Protective Response</small><p>${e(s.protective||'Not yet described.')}</p></div></div><div class="thread-signals"><small>5 · Present-Day Reality Indicators</small>${related.length?`<div class="signal-columns"><div class="signal-column risk"><div class="signal-column-head"><span class="signal-key rose-key"></span><h4>Possible continuity</h4></div>${related.filter(x=>x.kind==='repeats').map(x=>`<p class="thread-indicator">${e(x.statement)}</p>`).join('')||'<p class="subtle">No linked indicators.</p>'}</div><div class="signal-column repair"><div class="signal-column-head"><span class="signal-key green-key"></span><h4>Possible difference</h4></div>${related.filter(x=>x.kind==='differs').map(x=>`<p class="thread-indicator">${e(x.statement)}</p>`).join('')||'<p class="subtle">No linked indicators.</p>'}</div></div>`:'<p class="subtle">No built-in reality indicators are linked to this subroutine yet.</p>'}</div><div class="thread-foot"><button class="button small outline" data-action="show-sub" data-id="${e(s.id)}">View / edit this shared definition</button></div></details>`;}).join('')||'<div class="empty-state">No subroutines linked yet. Add one above to build this branch.</div>'}</div>
      <div class="form-actions"><button class="button small" data-action="try-routine" data-id="${e(r.id)}">Use this routine in a comparison</button></div></div>`;
  }
  function renderAtlas(){
    return `${sectionIntro('THE FIVE-FIELD KNOWLEDGE LAYER','Pressure-Point Atlas','One hub, many control routines. Each shared subroutine connects a learned expectation, a possible protective response, and present-day behavioural indicators.',`<button class="button outline" data-action="add-routine">+ New control routine</button>`)}
      <div class="atlas-stage">${atlasSvg()}</div><p class="test-hint" style="margin:12px 0 20px">Tap a node to inspect it. Each subroutine has one source definition, linked wherever it applies.</p>${renderInspector()}
      <div class="section-header"><h3>Browse all routines</h3><span class="counter">${routineList().length} total</span></div><div class="dot-grid">${routineList().map(r=>`<button class="routine-tile" data-action="select-routine" data-id="${e(r.id)}"><span class="mini-kicker">${e(r.domain||'Personal')}</span><strong>${e(r.name)}</strong><small>${(r.subroutineIds||[]).length} connected subroutines</small></button>`).join('')}</div>`;
  }
  function renderDictionary(){
    const data=subList().filter(s=>(dictionaryFilter==='all'||owners(s.id).some(r=>r.id===dictionaryFilter))&&(!dictionarySearch||[s.name,s.meaning,s.learned,s.protective,s.check].join(' ').toLowerCase().includes(dictionarySearch.toLowerCase())));
    return `${sectionIntro('REUSABLE KNOWLEDGE, NOT DUPLICATED NOTES','Pattern dictionary','Each subroutine is defined once and linked to every control routine that uses it.',`<button class="button" data-action="add-sub-dialog">+ New subroutine</button>`)}
      <div class="search-row"><input id="dictionary-search" type="search" placeholder="Find a pattern, thought, or meaning…" value="${e(dictionarySearch)}" aria-label="Search dictionary"><select id="dictionary-filter" aria-label="Filter by control routine"><option value="all">All control routines</option>${routineOptions(dictionaryFilter)}</select><span class="counter">${data.length} shown · ${subList().length} total</span></div>
      <div class="dictionary-list">${data.length?data.map(s=>`<button class="dictionary-item" data-action="show-sub" data-id="${e(s.id)}"><strong>${e(s.name)} ↗</strong><p>${e(s.meaning)}</p><p class="subtle" style="margin-top:8px"><strong>Learned:</strong> ${e(s.learned||'Not yet described.')}</p><p class="subtle" style="margin-top:5px"><strong>Protective response:</strong> ${e(s.protective||'Not yet described.')}</p><div class="mini-links">Linked to: ${e(owners(s.id).map(r=>r.name).join(' · ')||'No routines yet')}</div></button>`).join(''):`<div class="empty-state">No subroutines match that search.</div>`}</div><p class="footnote">The dictionary offers possibilities to test, not facts about any individual. You can edit a definition or its links without creating duplicate records.</p>`;
  }

  function renderEvidenceDictionary(){
    const entries=EVIDENCE.entries.filter(item=>(evidenceFilter==='all'||item.routineIds.includes(evidenceFilter))&&(!evidenceSearch||[item.statement,...item.subroutineIds.map(id=>sub(id)?.name||'')].join(' ').toLowerCase().includes(evidenceSearch.toLowerCase())));
    return `${sectionIntro('A SECOND, STATIC DICTIONARY','Present-day signals','Observable examples to compare against your actual relationships. The entries are not your history and do not require you to record anything.')}
    <div class="info-block" style="margin-bottom:18px"><strong>How to use this dictionary</strong><p>Look for anything that matches your reality. One side illustrates behaviour resembling the old controlling environment; the other illustrates behaviour that challenges that learned expectation. Both can be true of the same person. Nothing is assumed unless you recognize it yourself.</p></div>
    <div class="search-row"><input type="search" id="evidence-search" placeholder="Search observable behaviours…" value="${e(evidenceSearch)}" aria-label="Search present-day signals"><select id="evidence-filter" aria-label="Filter signals by routine"><option value="all">All control routines</option>${routineOptions(evidenceFilter)}</select><span class="counter">${entries.length} of ${EVIDENCE.entries.length} signals</span></div>
    <div class="signal-columns catalog-columns"><div class="signal-column risk"><div class="signal-column-head"><span class="signal-key rose-key"></span><h3>Signs of continuity</h3></div><p class="subtle">Observations that might mean the old pattern is still operating.</p>${entries.filter(x=>x.kind==='repeats').map(item=>`<div class="signal-static catalog-card">${pill(routine(item.routineIds[0])?.name||'Pattern','rose')}<p>${e(item.statement)}</p><small>Related subroutines: ${e(item.subroutineIds.map(id=>sub(id)?.name).filter(Boolean).join(' · '))}</small></div>`).join('')||'<p class="subtle">No matches.</p>'}</div><div class="signal-column repair"><div class="signal-column-head"><span class="signal-key green-key"></span><h3>Signs of difference</h3></div><p class="subtle">Observations that might challenge the old prediction.</p>${entries.filter(x=>x.kind==='differs').map(item=>`<div class="signal-static catalog-card">${pill(routine(item.routineIds[0])?.name||'Pattern','green')}<p>${e(item.statement)}</p><small>Related subroutines: ${e(item.subroutineIds.map(id=>sub(id)?.name).filter(Boolean).join(' · '))}</small></div>`).join('')||'<p class="subtle">No matches.</p>'}</div></div><p class="footnote">These are non-diagnostic examples for reflection. A single observation cannot establish a person's motives or the overall safety of a relationship.</p>`;
  }

  function renderMoments(){
    const search=momentSearch.trim().toLowerCase();
    const rows=[...state.moments].filter(m=>!search||[m.text,m.selectedSubs?.map(id=>sub(id)?.name).join(' ')].join(' ').toLowerCase().includes(search)).sort((a,b)=>new Date(b.updatedAt||b.createdAt)-new Date(a.updatedAt||a.createdAt));
    return `${sectionIntro('YOUR OWN INFORMATION, KEPT SEPARATE','Saved moments','Only the reflections you choose to keep appear here. Reopen one to revise its assumptions, evidence, and next step.',`<a href="#home" class="button">+ Process an emotion</a>`)}
      <div class="search-row"><input id="moment-search" type="search" placeholder="Search saved moments…" value="${e(momentSearch)}" aria-label="Search moments"><span class="counter">${rows.length} saved</span></div>
      <div class="record-list">${rows.length?rows.map(m=>{const outcome=REASONER.evaluate(m,subList(),EVIDENCE.entries);const outcomeLabel=outcome.urgent?'Safety concern noted':{undetermined:'No evidence selected',different:'Old expectation challenged',concerning:'Current concern',mixed:'Mixed evidence'}[outcome.status];const outcomeColor=outcome.urgent?'rose':{undetermined:'quiet',different:'green',concerning:'rose',mixed:'gold'}[outcome.status];return `<article class="record-row"><div class="record-top"><strong>${e((m.text||'Untitled moment').slice(0,110))}${(m.text||'').length>110?'…':''}</strong>${pill(fmtDate(m.createdAt),'quiet')}</div><div class="tag-list">${pill(outcomeLabel,outcomeColor)}${(m.top||[]).map(id=>routine(id)).filter(Boolean).map(r=>pill(r.name,'green')).join('')}</div><p>${e((m.selectedSubs||[]).map(id=>sub(id)?.name).filter(Boolean).slice(0,5).join(' · ')||'No selected subroutines')}</p><div class="record-actions"><button class="button small outline" data-action="resume-moment" data-id="${e(m.id)}">Reopen & edit</button><button class="button small ghost" data-action="delete-moment" data-id="${e(m.id)}">Delete</button></div></article>`;}).join(''):`<div class="empty-state"><h3>Nothing filed yet.</h3><p>That's completely fine. You can use Clearframe without saving a single moment.</p></div>`}</div>`;
  }
  function renderRoles(){
    const sample=routine('obligation');
    return `${sectionIntro('IDENTITIES ARE LABELS, NOT THE THEORY','Roles & themes','The atlas stores role slots, not people. Rename them for a fictional cast, a pseudonymous family map, or a neutral example without changing the underlying definitions.')}
      <div class="card" style="margin-bottom:18px"><div class="card-head"><div><div class="overline">ONE-TAP THEMES</div><h2>Choose a cast.</h2></div>${pill(state.roleTheme?.preset==='custom'?'Custom names':'Preset: '+(state.roleTheme?.preset||'neutral'))}</div><div class="theme-choices">${Object.keys(ROLE_THEMES).map(id=>`<button type="button" class="theme-choice ${state.roleTheme?.preset===id?'active':''}" data-action="apply-role-preset" data-id="${e(id)}" aria-pressed="${state.roleTheme?.preset===id}"><strong>${e({neutral:'Neutral',legacy:'MotherQ / SisterQ',storybook:'Storybook'}[id])}</strong><small>${e(Object.values(ROLE_THEMES[id]).join(' · '))}</small></button>`).join('')}</div></div>
      <div class="grid-2"><section class="card"><div class="overline">CUSTOM ROLE NAMES</div><h2>Make the names yours.</h2><p class="page-lede">These are interchangeable character labels, not records about real people. The role keys stay stable.</p><form id="roles-form" class="cast-form">${['guardian','sibling','self'].map(id=>`<div class="form-field"><label for="role-${id}">${e({guardian:'Guardian / Authority role',sibling:'Sibling / Intermediary role',self:'Self / Observer role'}[id])}</label><input id="role-${id}" name="${id}" required maxlength="60" value="${e(roleName(id))}"><p class="help-text">${e(ROLE_HELP[id])}</p></div>`).join('')}<button class="button" type="submit">Save role names</button></form></section>
      <aside class="card soft"><div class="overline">LIVE EXAMPLE</div><h2>Same pattern, different cast.</h2><p class="page-lede">Notice that only names change. The control routine and connected learned responses stay identical.</p><div class="role-preview"><div><small>Guardian role</small><strong>${e(roleName('guardian'))}</strong><p>${e(roleExample(sample?.roleExamples?.guardian))}</p></div><div><small>Sibling role</small><strong>${e(roleName('sibling'))}</strong><p>${e(roleExample(sample?.roleExamples?.sibling))}</p></div><div><small>Self / Observer</small><strong>${e(roleName('self'))}</strong><p>Evaluates the same protective response against observable present-day indicators.</p></div></div><p class="test-hint">Role assignment is a metaphor for the example, not an assumption about diagnosis, gender, or who is right.</p></aside></div>`;
  }
  function renderData(){
    return `${sectionIntro('YOU CONTROL YOUR RECORDS','Data & privacy','The dictionaries are built into the app. Only your optional saved comparisons, dictionary edits, and role labels are stored on this device.')}
    <div class="grid-equal"><div class="card"><div class="overline">YOUR DATA</div><h2>Make a backup.</h2><p class="page-lede">Export a portable JSON file whenever you like. It includes your role labels, saved comparisons, custom definitions, edits, and any older archived records.</p><div class="form-actions"><button class="button" data-action="export">↓ Export JSON backup</button></div><div class="divider"></div><h3>Bring a backup back</h3><p class="subtle" style="margin:9px 0 15px">Merge adds records with new IDs and keeps your current role theme. Replace restores all saved settings and records from the backup. Older version 1 backups are supported.</p><div class="data-actions"><button class="button outline" data-action="import-merge">Import & merge</button><button class="button outline" data-action="import-replace">Import & replace</button><input type="file" id="backup-file" accept="application/json,.json" hidden></div></div>
    <div class="card"><div class="overline">WHAT WE STORE</div><h2>On this device only.</h2><div class="compact-stack" style="margin-top:20px"><div class="info-block"><strong>${state.moments.length} optional saved comparisons</strong><p>Nothing is saved automatically during processing.</p></div><div class="info-block"><strong>${e(roleName('guardian'))} · ${e(roleName('sibling'))} · ${e(roleName('self'))}</strong><p>Your interchangeable role labels.</p></div><div class="info-block"><strong>${state.customRoutines.length+state.customSubroutines.length} custom definitions</strong><p>Your additions to the built-in knowledge.</p></div>${state.people.length||state.observations.length?`<div class="info-block"><strong>Archived records retained: ${state.people.length} old people · ${state.observations.length} old observations</strong><p>The People & Evidence feature is removed from the interface. Its older data is preserved in JSON backup for possible recovery; no new entries are created.</p></div>`:''}</div><p class="footnote">Stored in IndexedDB (or localStorage where needed). No cloud sync, no account, no analytics, and no external JavaScript. This storage is not encrypted. Clearing site data can permanently remove entries; export backups to a private location.</p></div></div>
    <div class="danger-zone" style="margin-top:24px"><div class="card-head"><div><h3>Erase my local records</h3><p class="subtle">Removes all saved comparisons, custom definitions, role labels, and legacy archived data. Does not remove the built-in dictionary.</p></div><button class="button danger" data-action="erase-data">Erase local data</button></div></div>`;
  }

  function modal(html){dialogContent.innerHTML=`<div class="modal-inner">${html}</div>`;if(!dialog.open)dialog.showModal();}
  function closeModal(){if(dialog.open)dialog.close();}
  function modalHeader(overline,heading){return `<div class="modal-head"><div><div class="mini-kicker">${e(overline)}</div><h2>${e(heading)}</h2></div><button class="icon-button" type="button" data-action="close-dialog" aria-label="Close dialog">✕</button></div>`;}
  function showSub(id){
    const s=sub(id);if(!s)return;
    const links=owners(id),signals=EVIDENCE.entries.filter(x=>x.subroutineIds.includes(id));
    modal(`${modalHeader('ONE DEFINITION · MULTIPLE CONNECTIONS',s.name)}<div class="modal-content"><div>${label('2 · What this subroutine describes')}<p>${e(s.meaning)}</p></div><div class="info-block">${label('3 · Learned expectation')}<strong>${e(s.learned||'Not yet described.')}</strong></div><div class="info-block">${label('4 · Possible protective response')}<strong>${e(s.protective||'Not yet described.')}</strong></div><div>${label('5 · Present-day indicators')}<p>${signals.length} indicator(s) reference this definition.</p><div class="compact-stack" style="margin-top:10px">${signals.map(x=>`<div class="signal-static">${pill(x.kind==='repeats'?'Resembles old pattern':'Challenges old pattern',x.kind==='repeats'?'rose':'green')}<p style="margin-top:7px">${e(x.statement)}</p></div>`).join('')||'<p class="subtle">No built-in indicators linked yet.</p>'}</div></div><div>${label('Question to consider')}<p>${e(s.check)}</p></div><div class="result-synthesis" style="padding:16px"><div class="mini-kicker">POSSIBLE UPDATED EXPECTATION</div><p style="font-size:.9rem">${e(s.grounded)}</p></div>${s.source?`<div>${label('Source / reference')}<p>${e(s.source)}</p></div>`:''}<div>${label('1 · Linked control routines')}<div class="tag-cloud">${links.length?links.map(r=>pill(r.name,'green')).join(''):pill('Not yet linked')}</div></div></div><div class="modal-actions"><button class="button outline" data-action="edit-sub" data-id="${e(id)}">✎ Edit definition & links</button><button class="button light" data-action="close-dialog">Close</button></div>`);
  }
  function editSub(id='',preferredRoutine=''){
    const s=sub(id), linked=s?owners(s.id).map(r=>r.id):preferredRoutine?[preferredRoutine]:[];
    modal(`${modalHeader('PATTERN DICTIONARY',s?'Edit subroutine':'Add a subroutine')}<form id="sub-form" data-id="${e(id)}" class="modal-content"><div class="form-field"><label for="sub-name">2 · Subroutine name</label><input id="sub-name" name="name" required maxlength="90" value="${e(s?.name||'')}" placeholder="e.g., Fear of Disappointment"></div><div class="form-field"><label for="sub-meaning">What does it describe?</label><textarea id="sub-meaning" name="meaning" required rows="2">${e(s?.meaning||'')}</textarea></div><div class="form-field"><label for="sub-learned">3 · Learned expectation</label><textarea id="sub-learned" name="learned" rows="2" placeholder="I learned that…">${e(s?.learned||'')}</textarea></div><div class="form-field"><label for="sub-protective">4 · Possible protective response</label><textarea id="sub-protective" name="protective" rows="2" placeholder="I learned to do…">${e(s?.protective||'')}</textarea></div><div class="form-field"><label for="sub-check">Reality-check question</label><textarea id="sub-check" name="check" rows="2">${e(s?.check||'')}</textarea></div><div class="form-field"><label for="sub-grounded">Possible updated expectation</label><textarea id="sub-grounded" name="grounded" rows="2">${e(s?.grounded||'')}</textarea></div><div class="form-field"><label for="sub-source">Source / reference (optional)</label><input id="sub-source" name="source" value="${e(s?.source||'')}" maxlength="250" placeholder="Book title, chapter, page, or your own definition"><p class="help-text">Keep a source trail as we expand the atlas from books.</p></div><div><label>1 · Connect this shared subroutine to any number of routines</label><div class="tag-cloud">${routineList().map(r=>`<label class="inline-checkbox pill quiet" style="cursor:pointer"><input type="checkbox" name="links" value="${e(r.id)}" ${linked.includes(r.id)?'checked':''}> ${e(r.name)}</label>`).join('')}</div></div><p class="help-text">5 · Present-day reality indicators are linked by stable IDs in the built-in dictionary. Their content is not changed by renaming a role.</p><div class="modal-actions">${s&&!KNOWLEDGE.subroutines.some(x=>x.id===s.id)?`<button type="button" class="button ghost" data-action="delete-custom-sub" data-id="${e(s.id)}">Delete subroutine</button>`:''}<button class="button light" type="button" data-action="close-dialog">Cancel</button><button class="button" type="submit">Save subroutine</button></div></form>`);
  }
  function editRoutine(id=''){
    const r=routine(id);
    modal(`${modalHeader('PRESSURE-POINT ATLAS',r?'Edit control routine':'New control routine')}<form id="routine-form" data-id="${e(id)}" class="modal-content"><div class="field-grid"><div class="form-field"><label for="routine-name">1 · Control routine name</label><input id="routine-name" name="name" value="${e(r?.name||'')}" required maxlength="90"></div><div class="form-field"><label for="routine-domain">Category</label><input id="routine-domain" name="domain" value="${e(r?.domain||'Personal')}" maxlength="35"></div><div class="form-field wide"><label for="routine-summary">What pattern does it describe?</label><textarea id="routine-summary" name="summary" required rows="2">${e(r?.summary||'')}</textarea></div><div class="form-field wide"><label for="routine-then">Then: Why could it have been protective?</label><textarea id="routine-then" name="then" rows="2">${e(r?.then||'')}</textarea></div><div class="form-field wide"><label for="routine-now">Now: What is worth testing?</label><textarea id="routine-now" name="now" rows="2">${e(r?.now||'')}</textarea></div><div class="form-field wide"><label for="routine-guardian">Guardian-role fictional statement · ${e(roleName('guardian'))}</label><textarea id="routine-guardian" name="guardianExample" rows="2">${e(r?.roleExamples?.guardian||'')}</textarea></div><div class="form-field wide"><label for="routine-sibling">Sibling-role fictional statement · ${e(roleName('sibling'))}</label><textarea id="routine-sibling" name="siblingExample" rows="2">${e(r?.roleExamples?.sibling||'')}</textarea><p class="help-text">Write statements using role names or neutral terms. Role labels are editable separately in Roles & themes.</p></div><div class="form-field wide"><label for="routine-signals">Matching phrases · separated by commas</label><textarea id="routine-signals" name="signals" rows="2">${e((r?.signals||[]).join(', '))}</textarea><p class="help-text">Used for transparent on-device suggestions when you describe a moment.</p></div></div><div class="modal-actions">${r&&!KNOWLEDGE.routines.some(x=>x.id===r.id)?`<button class="button ghost" type="button" data-action="delete-custom-routine" data-id="${e(r.id)}">Delete routine</button>`:''}<button class="button light" type="button" data-action="close-dialog">Cancel</button><button class="button" type="submit">Save routine</button></div></form>`);
  }
  function updateRoutine(id,changes){
    if(KNOWLEDGE.routines.some(r=>r.id===id))state.routineEdits[id]={...(state.routineEdits[id]||{}),...changes};
    else {const i=state.customRoutines.findIndex(r=>r.id===id);if(i>=0)state.customRoutines[i]={...state.customRoutines[i],...changes};}
  }
  function updateSubroutine(id,changes){
    if(KNOWLEDGE.subroutines.some(s=>s.id===id))state.subroutineEdits[id]={...(state.subroutineEdits[id]||{}),...changes};
    else {const i=state.customSubroutines.findIndex(s=>s.id===id);if(i>=0)state.customSubroutines[i]={...state.customSubroutines[i],...changes};}
  }
  function saveNewConnections(subId,desired){
    for(const r of routineList()){
      const existing=r.subroutineIds||[];
      const next=desired.includes(r.id)?unique([...existing,subId]):existing.filter(id=>id!==subId);
      if(next.join('|')!==existing.join('|'))updateRoutine(r.id,{subroutineIds:next});
    }
  }
  async function handleFormSubmit(form){
    const data=new FormData(form),id=form.dataset.id||'';
    if(form.id==='roles-form'){
      const aliases={};for(const key of ['guardian','sibling','self'])aliases[key]=String(data.get(key)||'').trim().slice(0,60);
      if(Object.values(aliases).some(x=>!x)){toast('Give each role a name.');return;}
      state.roleTheme={preset:'custom',aliases};await persist();render();toast('Character names saved. Pattern definitions are unchanged.');
    }
    if(form.id==='routine-form'){
      const changes={name:titleCase(String(data.get('name')||'').trim()),domain:titleCase(String(data.get('domain')||'').trim()),summary:String(data.get('summary')||'').trim(),then:String(data.get('then')||'').trim(),now:String(data.get('now')||'').trim(),roleExamples:{guardian:String(data.get('guardianExample')||'').trim(),sibling:String(data.get('siblingExample')||'').trim()},signals:unique(String(data.get('signals')||'').split(',').map(x=>x.trim()).filter(Boolean))};
      if(!changes.name||!changes.summary)return;
      const target=id||uid();
      if(id)updateRoutine(id,changes);else state.customRoutines.push({id:target,...changes,subroutineIds:[]});
      selectedRoutine=target;await persist();closeModal();render();toast('Routine saved.');
    }
    if(form.id==='sub-form'){
      const changes={name:titleCase(String(data.get('name')||'').trim()),meaning:String(data.get('meaning')||'').trim(),learned:String(data.get('learned')||'').trim(),protective:String(data.get('protective')||'').trim(),check:String(data.get('check')||'').trim(),grounded:String(data.get('grounded')||'').trim(),source:String(data.get('source')||'').trim()};
      if(!changes.name||!changes.meaning)return;
      const target=id||uid();
      if(id)updateSubroutine(id,changes);else state.customSubroutines.push({id:target,...changes});
      saveNewConnections(target,data.getAll('links').map(String));
      await persist();closeModal();render();toast('Subroutine and links saved.');
    }
  }

  async function exportBackup(){
    const payload={...state,exportedAt:new Date().toISOString(),app:'Clearframe'};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='clearframe-backup-'+nowLocalDate()+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('JSON backup downloaded.');
  }
  async function importBackup(file){
    if(!file)return;
    try{
      if(file.size>10*1024*1024)throw new Error('This file is too large (10 MB limit).');
      const imported=STORE.normalize(JSON.parse(await file.text()));
      if(importMode==='replace'&&!confirm('Replace ALL local comparisons, role names, dictionary edits, and archived legacy records with this backup? This cannot be undone without another backup.'))return;
      state=importMode==='replace'?imported:STORE.merge(state,imported);
      await persist();analysis=null;render();toast(importMode==='replace'?'Backup restored.':'Backup merged.');
    }catch(error){alert('Could not import the file: '+error.message);}
    finally{const input=document.getElementById('backup-file');if(input)input.value='';}
  }

  document.addEventListener('click',async ev=>{
    const t=ev.target.closest('[data-action]');if(!t)return;
    const action=t.dataset.action,id=t.dataset.id||'';
    if(t.tagName==='BUTTON')ev.preventDefault();
    switch(action){
      case 'use-example': {const sample=KNOWLEDGE.examples.find(x=>x.id===id);if(sample){draft=sample.text;analysis=null;swappedShoes=false;render();document.getElementById('moment-input')?.focus();}break;}
      case 'analyze':{
        const input=document.getElementById('moment-input');if(input)draft=input.value;
        if(draft.trim().length<8){toast('Enter at least one short sentence or thought.');input?.focus();break;}
        analysis=newAnalysis(draft.trim());swappedShoes=false;render();document.querySelector('.analysis-panel')?.scrollIntoView({behavior:'smooth',block:'start'});break;
      }
      case 'clear-analysis':analysis=null;draft='';swappedShoes=false;render();window.scrollTo({top:0,behavior:'smooth'});break;
      case 'show-routine':selectedRoutine=id;location.hash='#atlas';break;
      case 'select-routine':selectedRoutine=id;render();document.querySelector('.atlas-inspector')?.scrollIntoView({behavior:'smooth',block:'nearest'});break;
      case 'show-sub':showSub(id);break;
      case 'edit-sub':editSub(id);break;
      case 'add-sub-dialog':editSub('',t.dataset.routine||'');break;
      case 'edit-routine':editRoutine(id);break;
      case 'add-routine':editRoutine();break;
      case 'apply-role-preset':if(ROLE_THEMES[id]){state.roleTheme={preset:id,aliases:{...ROLE_THEMES[id]}};await persist();render();toast('Theme applied. Your learned-pattern definitions are unchanged.');}break;
      case 'close-dialog':closeModal();break;
      case 'add-sub':if(analysis&&!analysis.selectedSubs.includes(id)){analysis.selectedSubs.push(id);render();}break;
      case 'remove-routine':if(analysis){analysis.top=analysis.top.filter(x=>x!==id);render();}break;
      case 'swap-shoes':if(analysis){const y=window.scrollY;swappedShoes=!swappedShoes;render();window.scrollTo(0,y);document.querySelector('[data-action="swap-shoes"]')?.focus({preventScroll:true});}break;
      case 'toggle-evidence':if(analysis){const y=window.scrollY;analysis.evidenceMatches??={};analysis.evidenceMatches[id]=!analysis.evidenceMatches[id];render();window.scrollTo(0,y);}break;
      case 'toggle-more-evidence':if(analysis){const y=window.scrollY;analysis.showAllEvidence=!analysis.showAllEvidence;render();window.scrollTo(0,y);}break;
      case 'try-routine':{
        const r=routine(id);if(r){draft=roleExample(r.roleExamples?.guardian)||r.summary;analysis=newAnalysis(draft);swappedShoes=false;analysis.top=[id];analysis.selectedSubs=(r.subroutineIds||[]).slice(0,6);location.hash='#home';if(route()==='home')render();}break;
      }
      case 'save-moment':{
        if(!analysis)break;
        const record={...analysis,updatedAt:new Date().toISOString()};
        if(record.id){const index=state.moments.findIndex(m=>m.id===record.id);if(index>=0)state.moments[index]=record;else state.moments.push(record);}
        else{record.id=uid();analysis.id=record.id;state.moments.push(record);}
        await persist();render();toast('Moment saved on this device.');break;
      }
      case 'resume-moment':{
        const m=state.moments.find(x=>x.id===id);if(m){analysis={...newAnalysis(m.text||''),...JSON.parse(JSON.stringify(m)),top:Array.isArray(m.top)?m.top:[],selectedSubs:Array.isArray(m.selectedSubs)?m.selectedSubs:[],evidenceMatches:m.evidenceMatches&&typeof m.evidenceMatches==='object'?m.evidenceMatches:{}};draft=m.text||'';swappedShoes=false;location.hash='#home';if(route()==='home')render();window.scrollTo({top:0,behavior:'smooth'});}break;
      }
      case 'delete-moment':if(confirm('Delete this saved moment?')){state.moments=state.moments.filter(m=>m.id!==id);await persist();render();toast('Moment deleted.');}break;
      case 'delete-custom-sub':if(confirm('Delete this custom subroutine and remove its links?')){
        state.customSubroutines=state.customSubroutines.filter(s=>s.id!==id);saveNewConnections(id,[]);await persist();closeModal();render();toast('Custom subroutine deleted.');
      }break;
      case 'delete-custom-routine':if(confirm('Delete this custom control routine?')){
        state.customRoutines=state.customRoutines.filter(r=>r.id!==id);selectedRoutine='obligation';await persist();closeModal();render();toast('Custom routine deleted.');
      }break;
      case 'export':exportBackup();break;
      case 'import-merge':case 'import-replace':importMode=action==='import-merge'?'merge':'replace';document.getElementById('backup-file')?.click();break;
      case 'erase-data':if(confirm('Permanently erase ALL saved comparisons, role names, dictionary edits, and archived legacy records stored in this browser? Export a backup first if you might need them.')){
        state=STORE.fresh();analysis=null;await persist();render();toast('Local data erased.');
      }break;
    }
  });

  document.addEventListener('submit',async ev=>{
    if(!ev.target.matches('#sub-form,#routine-form,#roles-form'))return;
    ev.preventDefault();try{await handleFormSubmit(ev.target);}catch(error){toast('Unable to save: '+error.message);}
  });
  document.addEventListener('input',ev=>{
    const t=ev.target;
    if(t.id==='moment-input')draft=t.value;
    if(t.id==='analysis-next'&&analysis)analysis.next=t.value;
    if(['dictionary-search','moment-search','evidence-search'].includes(t.id)){
      if(t.id==='dictionary-search')dictionarySearch=t.value;else if(t.id==='evidence-search')evidenceSearch=t.value;else momentSearch=t.value;
      const id=t.id,pos=t.selectionStart;render();const input=document.getElementById(id);input?.focus();if(input&&pos!=null)input.setSelectionRange(pos,pos);
    }
  });
  document.addEventListener('change',async ev=>{
    const t=ev.target;
    if(t.dataset.assumption&&analysis){
      if(!t.checked)analysis.selectedSubs=analysis.selectedSubs.filter(id=>id!==t.dataset.assumption);
      else if(!analysis.selectedSubs.includes(t.dataset.assumption))analysis.selectedSubs.push(t.dataset.assumption);
      render();
    }
    if(t.id==='analysis-routine-add'&&analysis&&t.value){analysis.top.push(t.value);analysis.selectedSubs=unique([...analysis.selectedSubs,...(routine(t.value)?.subroutineIds||[]).slice(0,3)]);render();}
    if(t.id==='dictionary-filter'){dictionaryFilter=t.value;render();}
    if(t.id==='evidence-filter'){evidenceFilter=t.value;render();}
    if(t.id==='backup-file')await importBackup(t.files?.[0]);
  });
  dialog.addEventListener('click',event=>{if(event.target===dialog)closeModal();});
  document.getElementById('menu-toggle').addEventListener('click',()=>{
    const side=document.getElementById('sidebar'),opened=side.classList.toggle('open');document.getElementById('menu-toggle').setAttribute('aria-expanded',String(opened));
  });
  document.addEventListener('keydown',event=>{
    if((event.key==='Enter'||event.key===' ')&&event.target.classList.contains('atlas-node')){event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}
    if(event.key==='Escape')document.getElementById('sidebar').classList.remove('open');
  });
  window.addEventListener('hashchange',render);

  async function start(){
    try{state=await STORE.get();}catch(error){state=STORE.fresh();toast('Storage unavailable. Use JSON export for backups.');}
    if(!routine(selectedRoutine))selectedRoutine=routineList()[0]?.id||'obligation';
    render();
    if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
  start();
})();

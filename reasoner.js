/* Transparent comparison engine. Never infers motives, diagnoses or numerical probabilities.
   Only affirmative, user-recognized observations are treated as evidence. */
window.ClearframeReasoner = (() => {
  const unique=values=>[...new Set(values)];
  function relevantEntries(analysis,entries){
    const subs=new Set(analysis.selectedSubs||[]),routines=new Set(analysis.top||[]);
    return entries.filter(item=>(item.routineIds||[]).some(id=>routines.has(id))||(item.subroutineIds||[]).some(id=>subs.has(id)));
  }
  function candidates(analysis,entries){
    const linked=relevantEntries(analysis,entries);
    const selectedSubs=new Set(analysis.selectedSubs||[]);
    const ranked=linked.map((entry,index)=>({entry,index,
      score:(entry.routineIds||[]).includes(analysis.top?.[0])?4:0,
      subScore:(entry.subroutineIds||[]).filter(id=>selectedSubs.has(id)).length
    })).sort((a,b)=>(b.score+b.subScore)-(a.score+a.subScore)||a.index-b.index);
    const chosen=[];
    for(const kind of ['repeats','differs'])for(const row of ranked.filter(x=>x.entry.kind===kind)){
      if(chosen.filter(x=>x.kind===kind).length>=3)break;
      chosen.push(row.entry);
    }
    return {suggested:chosen,additional:linked.filter(entry=>!chosen.some(x=>x.id===entry.id))};
  }
  function evaluate(analysis,subroutines,entries){
    const relevant=relevantEntries(analysis,entries);
    const lookup=new Set(relevant.map(x=>x.id));
    const matched=relevant.filter(x=>lookup.has(x.id)&&analysis.evidenceMatches?.[x.id]);
    const repeats=matched.filter(x=>x.kind==='repeats');
    const differs=matched.filter(x=>x.kind==='differs');
    const urgent=repeats.some(x=>x.severity==='high');
    const status=repeats.length&&differs.length?'mixed':repeats.length?'concerning':differs.length?'different':'undetermined';
    const bySub=(analysis.selectedSubs||[]).map(id=>{
      const s=subroutines.find(x=>x.id===id);if(!s)return null;
      const linked=matched.filter(x=>(x.subroutineIds||[]).includes(id));
      const support=linked.filter(x=>x.kind==='repeats');
      const counter=linked.filter(x=>x.kind==='differs');
      const verdict=support.length&&counter.length?'mixed':support.length?'supported':counter.length?'challenged':'untested';
      return {id,title:s.name,learned:s.learned,protective:s.protective,grounded:s.grounded,support,counter,verdict};
    }).filter(Boolean);
    let conclusion,action;
    if(urgent){
      conclusion='You recognized a concrete warning sign involving threats, intimidation, coercion, or a serious boundary violation. Evidence of kindness elsewhere does not cancel that observation. The safest interpretation is to take the specific behaviour seriously without needing to prove anyone’s overall character or motive.';
      action='Prioritize your safety and practical autonomy. Name the specific behaviour, choose a boundary you can enforce, and seek support if you are threatened or unsafe.';
    }else if(status==='mixed'){
      conclusion='Your selections contain both behaviour resembling the old pattern and behaviour that differs from it. Neither set cancels the other. The accurate picture is mixed: evaluate the specific concern, any repair, and whether the concerning behaviour continues.';
      action='Address the observed behaviour directly. Acknowledge the care you have received without using it to excuse a boundary crossing. Watch what happens after the issue is raised.';
    }else if(status==='concerning'){
      conclusion='You recognized present-day behaviour resembling a learned controlling pattern. Your concern therefore has a current observation behind it; it should not automatically be dismissed as an outdated fear. This still does not establish the other person’s motive.';
      action='Name what occurred and state what you need or will do if it continues. Pay attention to their response and whether the behaviour changes.';
    }else if(status==='different'){
      conclusion='You recognized specific behaviour that contrasts with the older controlling pattern. That challenges the expectation that the same consequence must happen again. The protective alarm can feel real even when the current relationship behaves differently.';
      action='Pause before assigning an intention. Ask a neutral question about the immediate event, then compare the answer and behaviour with the evidence you recognized.';
    }else{
      conclusion='No present-day comparison has been established yet. The feeling may be connected to a learned expectation, but this input does not show whether the current person is repeating it or acting differently. Both possibilities remain open.';
      action='Clarify one observable fact before judging intention. If you want, choose any statements from the built-in evidence dictionary that you have actually observed.';
    }
    const strongest=bySub.filter(x=>x.verdict!=='untested');
    return {status,urgent,matched,repeats,differs,bySub,strongest,conclusion,action,
      counts:{similar:repeats.length,different:differs.length,untested:bySub.filter(x=>x.verdict==='untested').length}
    };
  }
  return {evaluate,relevantEntries,candidates};
})();

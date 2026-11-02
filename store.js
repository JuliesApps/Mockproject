/* Sensitive user records remain on-device. There are no network calls in this store. */
window.ClearframeStore = (() => {
  const DB_NAME = 'clearframe-private-v1';
  const LS_KEY = 'clearframe-private-backup-v1';
  // Role IDs are stable. The labels are editable presentation, not identities or diagnoses.
  const defaultTheme = () => ({preset:'neutral',aliases:{guardian:'Guardian',sibling:'Sibling',self:'You'}});
  // Retain hidden legacy people/observations in older backups for lossless migration.
  const fresh = () => ({version:2,roleTheme:defaultTheme(),people:[],moments:[],observations:[],customRoutines:[],customSubroutines:[],routineEdits:{},subroutineEdits:{}});
  const copy = value => JSON.parse(JSON.stringify(value));
  let connection = null;
  let idbAvailable = true;

  function open() {
    if (connection) return connection;
    connection = new Promise((resolve,reject) => {
      if (!('indexedDB' in window)) { reject(new Error('No IndexedDB')); return; }
      const request = indexedDB.open(DB_NAME,1);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('documents')) request.result.createObjectStore('documents'); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Storage unavailable'));
    });
    return connection;
  }
  async function get() {
    if (!idbAvailable) return readLocal();
    try {
      const db = await open();
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction('documents','readonly');
        const req=tx.objectStore('documents').get('owner');
        req.onsuccess=()=>resolve(req.result ? normalize(req.result) : fresh());
        req.onerror=()=>reject(req.error);
      });
    } catch { idbAvailable=false; return readLocal(); }
  }
  function readLocal() { try { const raw=localStorage.getItem(LS_KEY); return raw?normalize(JSON.parse(raw)):fresh(); } catch { return fresh(); } }
  async function save(state) {
    const payload=normalize(state);
    if (!idbAvailable) { localStorage.setItem(LS_KEY,JSON.stringify(payload)); return; }
    try {
      const db=await open();
      await new Promise((resolve,reject)=>{
        const tx=db.transaction('documents','readwrite');
        tx.objectStore('documents').put(payload,'owner');
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error);
      });
    } catch (error) {
      idbAvailable=false;
      try {localStorage.setItem(LS_KEY,JSON.stringify(payload));} catch {throw error;}
    }
  }
  function normalize(raw) {
    if (!raw || typeof raw!=='object' || Array.isArray(raw)) throw new Error('The data file is not a Clearframe backup.');
    if (![1,2].includes(raw.version)) throw new Error('This backup uses an unsupported data version.');
    if (!Array.isArray(raw.moments)) throw new Error('Missing saved moments.');
    const result={version:2};
    for (const key of ['people','moments','observations','customRoutines','customSubroutines']) {
      const source=raw[key]||[];
      if(!Array.isArray(source)) throw new Error('Invalid '+key+' records.');
      if (source.length>15000) throw new Error('Too many '+key+' records.');
      result[key]=source.filter(x=>x&&typeof x==='object'&&typeof x.id==='string'&&x.id.length<120).map(x=>copy(x));
    }
    for(const key of ['routineEdits','subroutineEdits']) result[key]=raw[key]&&typeof raw[key]==='object'&&!Array.isArray(raw[key])?copy(raw[key]):{};
    const theme=raw.roleTheme&&typeof raw.roleTheme==='object'&&!Array.isArray(raw.roleTheme)?raw.roleTheme:{};
    const baseline=defaultTheme();
    result.roleTheme={preset:['neutral','legacy','storybook','custom'].includes(theme.preset)?theme.preset:'neutral',aliases:{}};
    for(const key of ['guardian','sibling','self']){
      const value=theme.aliases?.[key];
      result.roleTheme.aliases[key]=typeof value==='string'&&value.trim()?value.trim().slice(0,60):baseline.aliases[key];
    }
    return result;
  }
  function merge(existing,imported) {
    const result=copy(existing);
    for (const key of ['people','moments','observations','customRoutines','customSubroutines']) {
      const ids=new Set(result[key].map(x=>x.id));
      for (const item of imported[key]) if(!ids.has(item.id)){result[key].push(item);ids.add(item.id);}
    }
    result.routineEdits={...result.routineEdits,...imported.routineEdits};
    result.subroutineEdits={...result.subroutineEdits,...imported.subroutineEdits};
    return result;
  }
  return {fresh,get,save,normalize,merge};
})();


/* app.js - React single-file (JSX). Listens to global events for file upload/clear to support the top-level input in index.html */
function App(){
  const [products,setProducts] = React.useState([]);
  const [allergens,setAllergens] = React.useState([]);
  const [selected,setSelected] = React.useState(new Set());
  const [mode,setMode] = React.useState('suitable');
  const [search,setSearch] = React.useState('');
  const [message,setMessage] = React.useState('');

  // load from localStorage on start
  React.useEffect(()=>{
    const saved = localStorage.getItem('allergenAppData');
    if(saved){
      try{
        const parsed = JSON.parse(saved);
        normalizeAndSet(parsed);
        setMessage('Geladene lokale Daten gefunden.');
      }catch(e){
        console.warn('Saved parse error', e);
      }
    }
  },[]);

  // Listen for global file event from index.html
  React.useEffect(()=>{
    function onFile(ev){
      const file = ev.detail;
      if(!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        try{
          const parsed = JSON.parse(e.target.result);
          normalizeAndSet(parsed);
          localStorage.setItem('allergenAppData', JSON.stringify(parsed));
          setMessage('JSON erfolgreich geladen und gespeichert.');
        }catch(err){
          setMessage('Fehler beim Parsen der JSON: ' + (err.message||err));
        }
      };
      reader.onerror = ()=> setMessage('Fehler beim Lesen der Datei.');
      reader.readAsText(file, 'utf-8');
    }
    function onClear(){
      localStorage.removeItem('allergenAppData');
      setProducts([]); setAllergens([]); setSelected(new Set()); setMessage('Lokale Daten gelöscht.');
    }
    window.addEventListener('pwa-file-selected', onFile);
    window.addEventListener('pwa-clear-data', onClear);
    return ()=>{ window.removeEventListener('pwa-file-selected', onFile); window.removeEventListener('pwa-clear-data', onClear); };
  },[]);

  function normalizeAndSet(parsed){
    let prods = [];
    if(Array.isArray(parsed)) prods = parsed;
    else if(parsed && typeof parsed === 'object'){
      if(Array.isArray(parsed.products)) prods = parsed.products;
      else {
        // find objects with name property
        const vals = Object.values(parsed).filter(v=>v && typeof v === 'object' && (v.name || v.id));
        if(vals.length) prods = vals;
        else if(parsed.name && parsed.components) prods=[parsed];
      }
    }
    prods = prods.map((p,idx)=>({
      id: p.id ?? `p_${idx}`,
      name: p.name ?? `Produkt ${idx+1}`,
      components: Array.isArray(p.components) ? p.components.map((c,ci)=>({
        name: c.name ?? `Komponente ${ci+1}`,
        ingredients: Array.isArray(c.ingredients) ? c.ingredients.map((ing,ii)=>({
          name: ing.name ?? `Zutat ${ii+1}`,
          allergens: Array.isArray(ing.allergens) ? ing.allergens : (ing.allergen ? [ing.allergen] : [])
        })) : []
      })) : []
    }));
    setProducts(prods);
    const alls = new Set();
    prods.forEach(p=> p.components?.forEach(c=> c.ingredients?.forEach(i=> i.allergens?.forEach(a=> alls.add(a)))));
    setAllergens([...alls].sort((a,b)=>a.localeCompare(b,'de')));
  }

  function toggleAll(a){
    setSelected(s=>{
      const copy = new Set(s);
      if(copy.has(a)) copy.delete(a); else copy.add(a);
      return copy;
    });
  }

  function matchesContains(p, sel){
    for(const c of p.components||[]) for(const i of c.ingredients||[]) for(const a of i.allergens||[]) if(sel.has(a)) return true;
    return false;
  }

  const filtered = React.useMemo(()=>{
    if(selected.size===0) return products;
    if(mode==='contains') return products.filter(p=> matchesContains(p,selected));
    return products.filter(p=> !matchesContains(p,selected));
  },[products,selected,mode]);

  function renderTable(p){
    const rows = [];
    for(const c of p.components||[]){
      if(!c.ingredients || c.ingredients.length===0) rows.push({comp:c.name,ing:'—',alls:[]});
      else for(const ing of c.ingredients) rows.push({comp:c.name,ing:ing.name,alls:ing.allergens||[]});
    }
    return (
      <div style={{overflowX:'auto'}}>
        <table>
          <thead><tr><th>Komponente</th><th>Zutat</th><th>Allergene</th></tr></thead>
          <tbody>
            {rows.map((r,idx)=>(
              <tr key={idx}><td>{r.comp}</td><td>{r.ing}</td><td>{r.alls.length? r.alls.join(', ') : '—'}</td></tr>
            ))}
          </tbody>
        </table>
        <details style={{marginTop:8}}><summary>Rohdaten (JSON)</summary><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(p,null,2)}</pre></details>
      </div>
    );
  }

  const searchAllergens = React.useMemo(()=>{
    if(!search) return null;
    const p = products.find(x=> (x.name||'').toLowerCase()===search.toLowerCase() || (x.id||'').toLowerCase()===search.toLowerCase());
    if(!p) return [];
    const s = new Set();
    for(const c of p.components||[]) for(const i of c.ingredients||[]) for(const a of i.allergens||[]) s.add(a);
    return [...s];
  },[search,products]);

  return (
    <div>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{minWidth:200}}>
          <strong>Allergene</strong>
          <div style={{marginTop:6}}>
            {allergens.length===0 && <div style={{color:'#6b7280'}}>Keine Allergene geladen</div>}
            {allergens.map(a=>(
              <label key={a} style={{display:'block',fontSize:14,marginBottom:6}}>
                <input type="checkbox" checked={selected.has(a)} onChange={()=>toggleAll(a)} /> {' '} {a}
              </label>
            ))}
          </div>
        </div>

        <div style={{flex:1,minWidth:260}}>
          <strong>Modus</strong>
          <div style={{marginTop:6}}>
            <label style={{marginRight:8}}><label><input type="radio" checked={mode==='suitable'} onChange={()=>setMode('suitable')} /> Zum Verzehr geeignet</label>
              <input type="radio" checked={mode==='contains'} onChange={()=>setMode('contains')} /> Enthält Allergene</label>
          </div>

          <div style={{marginTop:12}}>
            <strong>Suche Produkt</strong>
            <div style={{display:'flex',gap:8,marginTop:6}}>
              <input placeholder="Produktname oder ID" value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,padding:6}} />
              <button onClick={()=>{ /* no-op */ }}>OK</button>
            </div>
            {search && searchAllergens && (
              <div style={{marginTop:8}}>
                <div><strong>Gefundene Allergene:</strong> {searchAllergens.length? searchAllergens.join(', ') : 'Keine'}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{marginTop:16}}>
        <strong>Produkte</strong>
        <div style={{marginTop:8}}>
          {filtered.length===0 && <div style={{color:'#92400e'}}>Keine Produkte gefunden.</div>}
          {filtered.map(p=>(
            <div key={p.id} style={{marginBottom:12}} className="card">
              <details>
                <summary style={{fontSize:16,marginBottom:8}}>{p.name} <span style={{fontSize:12,color:'#6b7280'}}>({p.id})</span></summary>
                {renderTable(p)}
              </details>
            </div>
          ))}
        </div>
      </div>

      {message && <div style={{marginTop:12,color:'#065f46'}}>{message}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

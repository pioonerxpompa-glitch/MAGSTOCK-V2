import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
async function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("magstock_token");
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "BLAD_API");
  return data;
}
type User={id:string;name:string;role:"ADMIN"|"WORKER"};
type Product={id:string;name:string;ean?:string|null;eurocashIndex?:string|null;unit:string;volume?:string|null;category?:{id:string;name:string}|null;stocks:{quantity:string;warehouse:{id:string;name:string}}[]};
type Category={id:string;name:string;_count?:{products:number}};
type Warehouse={id:string;name:string;code:string};

function Login({onLogin}:{onLogin:(u:User)=>void}){
 const[pin,setPin]=useState(""),[error,setError]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();setError("");try{const d=await api("/auth/login",{method:"POST",body:JSON.stringify({pin})});localStorage.setItem("magstock_token",d.token);onLogin(d.user);}catch(err){setError(err instanceof Error?err.message:"BLAD");}}
 return <main className="login"><form className="login-card" onSubmit={submit}><div className="brand">MAG<span>STOCK</span><small>v2</small></div><p>System zarzadzania magazynem</p><label>PIN</label><input autoFocus type="password" inputMode="numeric" value={pin} onChange={e=>setPin(e.target.value)}/>{error&&<div className="error">{error}</div>}<button>ZALOGUJ</button></form></main>;
}

export function App(){
 const[user,setUser]=useState<User|null>(null),[page,setPage]=useState("dashboard"),[dashboard,setDashboard]=useState<any>(null),[products,setProducts]=useState<Product[]>([]),[categories,setCategories]=useState<Category[]>([]),[warehouses,setWarehouses]=useState<Warehouse[]>([]),[search,setSearch]=useState(""),[error,setError]=useState("");
 async function load(){try{const[d,p,c,w]=await Promise.all([api("/dashboard"),api("/products"),api("/categories"),api("/warehouses")]);setDashboard(d);setProducts(p);setCategories(c);setWarehouses(w);setError("");}catch(e){setError(e instanceof Error?e.message:"BLAD");}}
 useEffect(()=>{const t=localStorage.getItem("magstock_token");if(!t)return;api("/me").then(setUser).catch(()=>localStorage.removeItem("magstock_token"));},[]);
 useEffect(()=>{if(user)load();},[user]);
 const filtered=useMemo(()=>{const q=search.trim().toLowerCase();return products.filter(p=>!q||p.name.toLowerCase().includes(q)||(p.ean||"").includes(q)||(p.eurocashIndex||"").toLowerCase().includes(q));},[products,search]);
 if(!user)return <Login onLogin={setUser}/>;
 const logout=()=>{localStorage.removeItem("magstock_token");setUser(null)};
 return <div className="app"><aside><div className="side-brand">MAGSTOCK <small>v2</small></div><nav>{[["dashboard","Dashboard"],["products","Produkty"],["categories","Kategorie"],["inventory","Magazyn"],["scanner","Skaner EAN"],["history","Historia"],["duplicates","Duplikaty"],...(user.role==="ADMIN"?[["licenses","Licencje"]]:[])].map(([k,l])=><button key={k} className={page===k?"active":""} onClick={()=>setPage(k)}>{l}</button>)}</nav><div className="userbox">{user.name}<small>{user.role}</small></div><button className="logout" onClick={logout}>Wyloguj</button></aside><main className="content"><header><div><h1>{page==="dashboard"?"Dashboard":page==="products"?"Produkty":page==="categories"?"Kategorie":page==="inventory"?"Operacje magazynowe":page==="scanner"?"Skaner EAN":page==="history"?"Historia":page==="duplicates"?"Duplikaty":"Licencje"}</h1><span>MAGSTOCK v2</span></div><span className="status">● API ONLINE</span></header>{error&&<div className="error-banner">{error}</div>}{page==="dashboard"&&<><section className="cards"><div className="stat">AKTYWNE PRODUKTY<strong>{dashboard?.products??"—"}</strong></div><div className="stat">KATEGORIE<strong>{dashboard?.categories??"—"}</strong></div><div className="stat">OPERACJE<strong>{dashboard?.transactions??"—"}</strong></div><div className="stat">NISKIE STANY<strong>{dashboard?.lowStock??"—"}</strong></div></section><section className="grid"><div className="panel"><h2>Magazyny</h2>{warehouses.map(w=><div className="row" key={w.id}><b>{w.name}</b><span>{w.code}</span></div>)}</div><div className="panel"><h2>Szybkie operacje</h2><div className="quick"><button onClick={()=>setPage("inventory")}>＋ Przyjecie</button><button onClick={()=>setPage("inventory")}>− Rozchod</button><button onClick={()=>setPage("inventory")}>⇄ Przesuniecie</button><button onClick={()=>setPage("inventory")}>▣ Inwentaryzacja</button></div></div></section></>}{page==="products"&&<Products products={filtered} search={search} setSearch={setSearch} categories={categories} isAdmin={user.role==="ADMIN"} reload={load}/>} {page==="categories"&&<Categories categories={categories} isAdmin={user.role==="ADMIN"} reload={load}/>} {page==="inventory"&&<Inventory products={products} warehouses={warehouses} reload={load}/>} {page==="scanner"&&<Scanner/>} {page==="history"&&<History/>} {page==="duplicates"&&<Duplicates/>} {page==="licenses"&&<Licenses/>}</main></div>;
}

function Products({products,search,setSearch,categories,isAdmin,reload}:any){
 const[form,setForm]=useState<any>({name:"",ean:"",unit:"szt",minStock:0}),[show,setShow]=useState(false);
 async function save(){try{await api("/products",{method:"POST",body:JSON.stringify({...form,minStock:Number(form.minStock)})});setForm({name:"",ean:"",unit:"szt",minStock:0});setShow(false);reload();}catch(e){alert(e instanceof Error?e.message:"BLAD");}}
 return <section className="panel"><div className="toolbar"><input placeholder="Szukaj po nazwie, EAN, indeksie..." value={search} onChange={e=>setSearch(e.target.value)}/>{isAdmin&&<button onClick={()=>setShow(v=>!v)}>＋ Dodaj produkt</button>}<button onClick={downloadProductsCsv}>Eksport CSV</button></div>{show&&<div className="form-grid">{[["name","Nazwa"],["ean","EAN-13"],["eurocashIndex","Indeks Eurocash"],["aen","AEN"],["unit","Jednostka"],["volume","Objetosc"],["minStock","Stan minimalny"]].map(([k,l])=><label key={k}>{l}<input value={form[k]||""} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}<label>Kategoria<select value={form.categoryId||""} onChange={e=>setForm({...form,categoryId:e.target.value||null})}><option value="">Brak</option>{categories.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button onClick={save}>Zapisz</button></div>}<div className="table"><div className="thead"><span>Nazwa</span><span>EAN</span><span>Kategoria</span><span>Stany</span></div>{products.map((p:Product)=><div className="tr" key={p.id}><span><b>{p.name}</b><small>{p.volume||p.unit}</small></span><span>{p.ean||"—"}</span><span>{p.category?.name||"—"}</span><span>{p.stocks.length?p.stocks.map(s=><small key={s.warehouse.id}>{s.warehouse.name}: {s.quantity}</small>):"0"}</span></div>)}</div></section>;
}
function Categories({categories,isAdmin,reload}:any){
 const[name,setName]=useState("");async function add(){if(!name.trim())return;await api("/categories",{method:"POST",body:JSON.stringify({name})});setName("");reload();}async function remove(id:string){if(!confirm("Usunac kategorie?"))return;try{await api("/categories/"+id,{method:"DELETE"});reload();}catch(e){alert(e instanceof Error?e.message:"BLAD");}}
 return <section className="panel"><div className="toolbar"><input placeholder="Nowa kategoria" value={name} onChange={e=>setName(e.target.value)}/>{isAdmin&&<button onClick={add}>＋ Dodaj</button>}</div><div className="category-list">{categories.map(c=><div className="row" key={c.id}><div><b>{c.name}</b><small>{c._count?.products??0} produktow</small></div>{isAdmin&&<button onClick={()=>remove(c.id)}>Usun</button>}</div>)}</div></section>;
}
function Inventory({products,warehouses,reload}:any){
 const[data,setData]=useState<any>({productId:"",warehouseId:"",type:"RECEIPT",quantity:1,note:""});
 async function submit(){try{await api("/inventory/transaction",{method:"POST",body:JSON.stringify({...data,quantity:Number(data.quantity)})});setData({...data,quantity:1,note:""});reload();alert("Operacja zapisana");}catch(e){alert(e instanceof Error?e.message:"BLAD");}}
 return <section className="panel"><h2>Przyjecie / Rozchod</h2><div className="form-grid"><label>Produkt<select value={data.productId} onChange={e=>setData({...data,productId:e.target.value})}><option value="">Wybierz</option>{products.map((p:Product)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Magazyn<select value={data.warehouseId} onChange={e=>setData({...data,warehouseId:e.target.value})}><option value="">Wybierz</option>{warehouses.map((w:Warehouse)=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label><label>Typ<select value={data.type} onChange={e=>setData({...data,type:e.target.value})}><option value="RECEIPT">Przyjecie</option><option value="ISSUE">Rozchod</option></select></label><label>Ilosc<input type="number" min="0.001" step="0.001" value={data.quantity} onChange={e=>setData({...data,quantity:e.target.value})}/></label><label>Uwagi<input value={data.note} onChange={e=>setData({...data,note:e.target.value})}/></label><button onClick={submit} disabled={!data.productId||!data.warehouseId}>Zapisz operacje</button></div></section>;
}
function History(){
 const[rows,setRows]=useState<any[]>([]);useEffect(()=>{api("/inventory/history").then(setRows).catch(()=>{});},[]);
 return <section className="panel"><h2>Ostatnie operacje</h2><div className="table"><div className="thead"><span>Data</span><span>Produkt</span><span>Magazyn</span><span>Typ / Ilosc</span></div>{rows.map(r=><div className="tr" key={r.id}><span>{new Date(r.createdAt).toLocaleString()}</span><span>{r.product.name}</span><span>{r.warehouse.name}</span><span>{r.type} / {r.quantity}</span></div>)}</div></section>;
}
function Licenses(){
 const[rows,setRows]=useState<any[]>([]),[users,setUsers]=useState<any[]>([]),[form,setForm]=useState({userId:"",key:""});
 const load=()=>Promise.all([api("/licenses"),api("/users")]).then(([l,u])=>{setRows(l);setUsers(u.filter((x:any)=>x.role==="WORKER"));}).catch(()=>{});
 useEffect(load,[]);
 async function save(){await api("/licenses",{method:"POST",body:JSON.stringify(form)});setForm({userId:"",key:""});load();}
 return <section className="panel"><h2>Licencje pracownikow</h2><div className="form-grid"><label>Pracownik<select value={form.userId} onChange={e=>setForm({...form,userId:e.target.value})}><option value="">Wybierz</option>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label><label>Klucz licencji<input value={form.key} onChange={e=>setForm({...form,key:e.target.value})}/></label><button onClick={save} disabled={!form.userId||!form.key}>Nadaj licencje</button></div><div className="table">{rows.map(r=><div className="tr" key={r.id}><span>{r.user.name}</span><span>{r.key}</span><span>{r.active?"AKTYWNA":"NIEAKTYWNA"}</span><span>{r.expiresAt?new Date(r.expiresAt).toLocaleDateString():"BEZTERMINOWA"}</span></div>)}</div></section>;
}


async function downloadProductsCsv(){
 const token=localStorage.getItem("magstock_token");
 const response=await fetch(API+"/products/export.csv",{headers:{Authorization:`Bearer ${token}`}});
 if(!response.ok){alert("Nie mozna pobrac CSV");return;}
 const blob=await response.blob();const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="magstock-products.csv";a.click();URL.revokeObjectURL(url);
}

function Scanner(){
 const [ean,setEan]=useState(""); const [message,setMessage]=useState(""); const [product,setProduct]=useState<any>(null); const [running,setRunning]=useState(false); const videoRef=useRef<HTMLVideoElement|null>(null);
 async function lookup(code:string){try{const p=await api("/products/by-ean/"+encodeURIComponent(code));setProduct(p);setMessage("Znaleziono produkt.");}catch(e){setProduct(null);setMessage(e instanceof Error?e.message:"BLAD");}}
 async function startCamera(){
  if(!("BarcodeDetector" in window)){setMessage("Ta przegladarka nie obsluguje automatycznego skanowania. Uzyj pola EAN.");return;}
  const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}}});
  const video=videoRef.current;if(!video)return;video.srcObject=stream;await video.play();setRunning(true);
  const Detector=(window as any).BarcodeDetector;const detector=new Detector({formats:["ean_13"]});
  const loop=async()=>{if(!running)return;try{const found=await detector.detect(video);if(found?.[0]?.rawValue){await lookup(found[0].rawValue);setRunning(false);stream.getTracks().forEach(t=>t.stop());return;}}catch{}requestAnimationFrame(loop);};requestAnimationFrame(loop);
 }
 return <section className="panel scanner"><h2>Skaner EAN-13</h2><div className="scan-box"><video ref={videoRef} muted playsInline/></div><div className="scan-actions"><button onClick={startCamera}>Uruchom kamere</button><input inputMode="numeric" maxLength={13} value={ean} onChange={e=>setEan(e.target.value)} placeholder="Wpisz EAN-13"/><button onClick={()=>lookup(ean)}>Szukaj</button></div>{message&&<div className="scan-message">{message}</div>}{product&&<div className="scan-product"><b>{product.name}</b><span>EAN: {product.ean}</span>{product.stocks?.map((s:any)=><span key={s.warehouse.id}>{s.warehouse.name}: {String(s.quantity)}</span>)}</div>}</section>;
}

function Duplicates(){
 const [groups,setGroups]=useState<any[]>([]); const [busy,setBusy]=useState(true);
 const load=()=>{setBusy(true);api("/products/duplicates").then(setGroups).catch(()=>setGroups([])).finally(()=>setBusy(false));};
 useEffect(load,[]);
 async function merge(group:any){if(!confirm("Scalic te produkty, pozostawiajac pierwszy?"))return;try{await api("/products/merge",{method:"POST",body:JSON.stringify({survivorId:group.items[0].id,duplicateIds:group.items.slice(1).map((p:any)=>p.id)})});load();}catch(e){alert(e instanceof Error?e.message:"BLAD");}}
 if(busy)return <section className="panel"><h2>Duplikaty</h2><p>Skanowanie...</p></section>;
 return <section className="panel"><h2>Duplikaty produktów</h2>{groups.length===0?<p>Nie znaleziono duplikatow.</p>:groups.map((g:any)=><div className="duplicate-group" key={g.key}><div><b>{g.key}</b>{g.items.map((p:any)=><div className="row" key={p.id}><span>{p.name}</span><span>{p.ean||p.eurocashIndex||"—"}</span></div>)}</div><button onClick={()=>merge(g)}>Scal</button></div>)}</section>;
}

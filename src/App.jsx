import {useState,useEffect,useMemo} from 'react'
import { supabase } from './supabase'
const useLS=(k,d)=>{const[v,s]=useState(()=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}});useEffect(()=>localStorage.setItem(k,JSON.stringify(v)),[k,v]);return[v,s]}
// Demo data: replace with your backend API. lat/lng are real Hyderabad localities, p = {litres: price in ₹}
const TANKERS=[
{id:1,n:'Tarnaka Water Carriers',a:'Tarnaka',lat:17.4286,lng:78.5370,r:3.8,p:{5000:920,10000:1700,15000:2400}},
{id:2,n:'Uppal Aqua Supply',a:'Uppal',lat:17.4058,lng:78.5591,r:4.4,p:{5000:880,10000:1650,20000:3100}},
{id:3,n:'Secunderabad Blue Tankers',a:'Secunderabad',lat:17.4399,lng:78.4983,r:4.1,p:{10000:1800,15000:2500,25000:3900}},
{id:4,n:'Kukatpally Jal Seva',a:'Kukatpally',lat:17.4948,lng:78.3996,r:4.6,p:{5000:950,10000:1750,20000:3200}},
{id:5,n:'Gachibowli Pure Water',a:'Gachibowli',lat:17.4401,lng:78.3489,r:4.2,p:{5000:1000,15000:2600,25000:4000}},
{id:6,n:'LB Nagar Water Works',a:'LB Nagar',lat:17.3457,lng:78.5522,r:3.9,p:{5000:900,10000:1680,20000:3050}},
{id:7,n:'Mehdipatnam Tankers',a:'Mehdipatnam',lat:17.3950,lng:78.4400,r:4.0,p:{10000:1720,15000:2450,25000:3850}}]
const QTY=[5000,10000,15000,20000,25000]
const UPI=[['Google Pay','G','#2f6fed','com.google.android.apps.nbu.paisa.user'],['PhonePe','P','#6d2fd0','com.phonepe.app'],['Paytm','Pt','#0b84e0','net.one97.paytm'],['Navi','N','#3c5be0','com.naviapp'],['MobiKwik','M','#e33a2c','com.mobikwik_new'],['CRED','C','#222b30','com.dreamplug.androidapp'],['Any UPI app','UPI','#10685f','']]
const MERCHANT='bookmytanker@upi'
const km=(a,b)=>{const R=6371,t=x=>x*Math.PI/180,dl=t(b.lat-a.lat),dg=t(b.lng-a.lng);const h=Math.sin(dl/2)**2+Math.cos(t(a.lat))*Math.cos(t(b.lat))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
const f12=h=>{h%=24;return(h%12||12)+(h<12?' am':' pm')}
const SLOTS=[0,3,6,9,12,15,18,21].map(s=>({s,l:`${f12(s)} – ${f12(s+3)}`}))
const day=o=>{const d=new Date();d.setDate(d.getDate()+o);return d.toISOString().slice(0,10)}
const inr=n=>'₹'+n.toLocaleString('en-IN')

function Back({t,go}){return<div className="back"><button onClick={go}>‹</button>{t}</div>}

function Track({b}){ // GPS tracking is live only during the booked slot
 const[pos,setPos]=useState(null),now=new Date(),h=now.getHours()
 const live=b.date===day(0)&&h>=b.s&&h<b.s+3
 useEffect(()=>{if(!live||!navigator.geolocation)return;const w=navigator.geolocation.watchPosition(p=>setPos(p.coords),()=>{},{enableHighAccuracy:true});return()=>navigator.geolocation.clearWatch(w)},[live])
 if(!live)return<div className="mut">GPS tracking turns on during your slot.</div>
 return<div style={{color:'#1f9d55',fontWeight:600}}>● Live tracking on {pos&&<a href={`https://maps.google.com/?q=${pos.latitude},${pos.longitude}`} target="_blank">Open map</a>}</div>}

export default function App(){
const[user,setUser]=useState(null),[authLoading,setAuthLoading]=useState(true),[bal,setBal]=useLS('bal',0),[pwd,setPwd]=useLS('pwd',''),[bks,setBks]=useLS('bks',[]),[pend,setPend]=useLS('pend',[])
 const[scr,setScr]=useState('home'),[sel,setSel]=useState(null),[loc,setLoc]=useState(null),[place,setPlace]=useState('Detecting…')
 const[sort,setSort]=useState('d'),[qty,setQty]=useState(0),[fil,setFil]=useState(false),[toast,setToast]=useState('')
 const getLoc=()=>{if(!navigator.geolocation)return setPlace('Location not available');setPlace('Detecting…')
  navigator.geolocation.getCurrentPosition(async p=>{const c={lat:p.coords.latitude,lng:p.coords.longitude};setLoc(c)
   try{const r=await(await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${c.lat}&lon=${c.lng}`)).json();setPlace(r.display_name.split(',').slice(0,3).join(','))}catch{setPlace(`${c.lat.toFixed(3)}, ${c.lng.toFixed(3)}`)}},
   ()=>{setLoc(null);setPlace('Location not available')},{enableHighAccuracy:true})}
   const getAppUser = u => u ? ({
 name: u.user_metadata?.name || u.email?.split('@')[0] || 'User',
 phone: u.user_metadata?.phone || '',
 email: u.email || ''
}) : null

useEffect(()=>{
 let mounted = true

 supabase.auth.getSession().then(({data,error})=>{
  if(!mounted)return
  if(error)console.error(error)
  setUser(getAppUser(data.session?.user))
  setAuthLoading(false)
 })

 const {data:{subscription}} = supabase.auth.onAuthStateChange(
  (_event,session)=>{
   if(!mounted)return
   setUser(getAppUser(session?.user))
   setAuthLoading(false)
  }
 )

 return ()=>{
  mounted = false
  subscription.unsubscribe()
 }
},[])
 useEffect(()=>{if(user)getLoc()},[user])
 const list=useMemo(()=>!loc?[]:TANKERS.map(t=>({...t,d:km(loc,t)})).filter(t=>t.d<=7&&(!qty||t.p[qty])).map(t=>({...t,q:qty||+Object.keys(t.p)[0]})).sort((a,b)=>sort==='p'?a.p[a.q]-b.p[b.q]:sort==='r'?b.r-a.r:a.d-b.d),[loc,qty,sort])
 const say=m=>{setToast(m);setTimeout(()=>setToast(''),3000)}

if(authLoading)return <Wrap><div className="card mut">Checking login...</div></Wrap>
if(!user)return<Signup done={setUser}/>
 const ini=user.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
 const go=s=>()=>setScr(s)

 if(scr==='wallet')return<Wrap><Back t="Wallet" go={go('home')}/>
  <Wallet bal={bal} pend={pend} setPend={setPend} say={say} goA={go('approvals')}/><Toast t={toast}/></Wrap>
 if(scr==='approvals')return<Wrap><Back t="Wallet top-up approvals" go={go('profile')}/>
  <p className="mut">Confirm once your UPI payment is successful. (In production this is done automatically by your payment server.)</p>
  {!pend.length&&<div className="card mut">No pending top-ups.</div>}
  {pend.map(p=><div className="card" key={p.id}><div className="row sp"><b>{inr(p.amt)} via {p.app}</b><span className="mut">{p.id}</span></div>
   <div className="row"><button className="btn" onClick={()=>{setBal(bal+p.amt);setPend(pend.filter(x=>x.id!==p.id));say('Money added to wallet')}}>Confirm paid</button>
   <button className="btn red" onClick={()=>setPend(pend.filter(x=>x.id!==p.id))}>Cancel</button></div></div>)}<Toast t={toast}/></Wrap>
 if(scr==='bookings')return<Wrap><Back t="My bookings" go={go('profile')}/>
  {!bks.length&&<div className="card mut">No bookings yet.</div>}
  {[...bks].reverse().map(b=><div className="card" key={b.id}><b style={{fontSize:18}}>{b.n}</b><div className="mut">{b.q.toLocaleString('en-IN')} L · {b.date} · {b.l}</div>
   <div style={{margin:'8px 0'}}>📍 {b.addr}</div><div className="row sp"><b>{inr(b.total)}</b><Track b={b}/></div></div>)}</Wrap>
 if(scr==='password')return<Wrap><Back t="Manage password" go={go('profile')}/><PwdSet pwd={pwd} setPwd={p=>{setPwd(p);say('Password saved');setScr('profile')}}/><Toast t={toast}/></Wrap>
 if(scr==='profile')return<Wrap><Back t="Profile" go={go('home')}/>
  <div className="row" style={{margin:'8px 0 20px'}}><div className="av" style={{width:88,height:88,fontSize:30}}>{ini}</div><div><h2>{user.name}</h2><div className="mut">+91 {user.phone}</div></div></div>
  <div className="card row sp"><div><div className="cap" style={{margin:0}}>Wallet balance</div><div className="serif" style={{fontSize:40}}>{inr(bal)}</div></div><button className="book" style={{background:'var(--teal)',color:'#fff'}} onClick={go('wallet')}>＋ Add</button></div>
  <div className="card" style={{padding:'0 18px'}}>{[['🧾','My bookings','Slots, addresses and tracking','bookings'],['🔒','Manage password','Set a 4-digit wallet password','password'],['🛡️','Wallet top-up approvals','Confirm UPI payments','approvals']].map(([i,t,s,k])=>
   <div className="li" key={k} onClick={go(k)}><div className="pin">{i}</div><div style={{flex:1}}><b style={{fontSize:19}}>{t}</b><div className="mut">{s}</div></div>›</div>)}</div>
  <button className="btn red" onClick={async()=>{
 const {error}=await supabase.auth.signOut()
 if(error){say(error.message);return}
 setUser(null)
 setScr('home')
}}>⎋ Sign out</button></Wrap>

 return<Wrap>
  <div className="top"><button className="pin" onClick={getLoc}>◎</button><div className="loc"><div className="cap" style={{margin:0}}>Your location</div><b>{place}</b></div>
   <div className="chip">{inr(bal)}<button className="plus" onClick={go('wallet')}>+</button></div><button className="av" onClick={go('profile')}>{ini}</button></div>
  <div className="eyebrow">Hyderabad · Live availability</div><h1 style={{margin:'12px 0'}}>Tankers near you</h1>
  <p className="mut" style={{fontSize:18}}>Verified water tanker suppliers within 7 km. Book a slot, pay from your wallet.</p>
  <p style={{fontSize:18,margin:'28px 0 14px'}}><b>{list.length}</b> tankers available</p>
  <div className="row"><select className="pill" value={sort} onChange={e=>setSort(e.target.value)}><option value="d">Distance: Nearest</option><option value="p">Price: Low to High</option><option value="r">Rating: High to Low</option></select>
   <button className="pill" onClick={()=>setFil(!fil)}>⚙ Filters{qty?' (1)':''}</button></div>
  {fil&&<div className="card" style={{marginTop:12}}><div className="cap" style={{marginTop:0}}>Quantity</div><div className="row" style={{flexWrap:'wrap'}}>
   {QTY.map(q=><button key={q} className={'pill'+(qty===q?' on':'')} onClick={()=>setQty(qty===q?0:q)}>{q.toLocaleString('en-IN')} L</button>)}</div></div>}
  <div style={{marginTop:16}}>{!loc&&<div className="card mut">Location not available. Enable location and tap the pin to see tankers within 7 km.</div>}
  {list.map(t=><div className="card" key={t.id}><div className="row" style={{alignItems:'flex-start'}}><div className="logo">{t.n.split(' ').slice(0,2).map(w=>w[0]).join('')}</div>
   <div style={{flex:1}}><div className="row sp" style={{alignItems:'flex-start'}}><b style={{fontSize:20}}>{t.n}</b><span className="rate">{t.r}</span></div>
   <div className="mut">📍 {t.a} · {t.d.toFixed(1)} km</div>
   <div className="row sp" style={{marginTop:14}}><div className="price">{inr(t.p[t.q])} <small>/ {t.q.toLocaleString('en-IN')} L</small></div><button className="book" onClick={()=>setSel(t)}>Book ↗</button></div></div></div></div>)}</div>
  {sel&&<Sheet t={sel} close={()=>setSel(null)} bal={bal} pwd={pwd} user={user} pay={(b)=>{setBal(bal-b.total);setBks([...bks,b])}} goW={()=>{setSel(null);say('Add money to continue');setScr('wallet')}} goP={()=>{setSel(null);say('Set a wallet password first');setScr('password')}}/>}
  <Toast t={toast}/></Wrap>}

const Wrap=({children})=><div className="app">{children}</div>
const Toast=({t})=>t?<div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:'#14242b',color:'#fff',padding:'12px 20px',borderRadius:99,zIndex:20}}>{t}</div>:null


function Signup({done}) {
 const [n,setN] = useState('')
 const [p,setP] = useState('')
 const [email,setEmail] = useState('')
 const [o,setO] = useState('')
 const [sent,setSent] = useState(false)
 const [e,setE] = useState('')
 const [loading,setLoading] = useState(false)

 const send = async () => {
  if (!n.trim() || !/^[6-9]\d{9}$/.test(p)) {
   return setE('Enter your name and a valid 10-digit mobile number')
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
   return setE('Enter a valid email address')
  }

  setLoading(true)
  setE('')

  const {error} = await supabase.auth.signInWithOtp({
   email: email.trim().toLowerCase(),
   options: {
    shouldCreateUser: true,
    data: {
     name: n.trim(),
     phone: p
    }
   }
  })

  setLoading(false)

  if (error) {
   setE(error.message)
   return
  }

  setSent(true)
 }

 const verify = async () => {
  if (!o.trim()) return setE('Enter the OTP')

  setLoading(true)
  setE('')

  const {data,error} = await supabase.auth.verifyOtp({
   email: email.trim().toLowerCase(),
   token: o.trim(),
   type: 'email'
  })

  setLoading(false)

  if (error) {
   setE(error.message)
   return
  }

  done({
   name: n.trim(),
   phone: p,
   email: email.trim().toLowerCase()
  })
 }

 return <Wrap>
  <div style={{paddingTop:60}}>
   <div className="eyebrow">Hyderabad</div>
   <h1 style={{margin:'12px 0'}}>Book My Tanker</h1>
   <p className="mut" style={{fontSize:18}}>
    Sign up to book verified water tankers near you.
   </p>

   <div className="cap">Name</div>
   <input className="input" value={n}
    onChange={x=>setN(x.target.value)}
    placeholder="Your name"/>

   <div className="cap">Mobile number</div>
   <input className="input" inputMode="numeric"
    maxLength={10} value={p}
    onChange={x=>setP(x.target.value.replace(/\D/g,''))}
    placeholder="10-digit number"/>

   <div className="cap">Email address</div>
   <input className="input" type="email"
    value={email}
    onChange={x=>setEmail(x.target.value)}
    placeholder="Your email address"/>

   {sent && <>
    <div className="cap">Enter 6-digit OTP</div>
    <input className="input" inputMode="numeric"
     maxLength={6} value={o}
     onChange={x=>setO(x.target.value.replace(/\D/g,''))}
     placeholder="Enter OTP"/>
   </>}

   {e && <p style={{color:'#d93a2b'}}>{e}</p>}

   <button className="btn" disabled={loading}
    onClick={sent?verify:send}>
    {loading?'Please wait...':sent?'Verify & continue':'Send OTP'}
   </button>
  </div>
 </Wrap>
}


function Wallet({bal,pend,setPend,say,goA}){
 const[amt,setAmt]=useState(500),[app,setApp]=useState(1)
 const pay=()=>{if(amt<1)return say('Enter an amount');const[name,,,pkg]=UPI[app],id='TXN'+Date.now().toString().slice(-8)
  const q=`pa=${MERCHANT}&pn=Book%20My%20Tanker&tn=Wallet%20top-up&am=${amt}&cu=INR&tr=${id}`
  setPend([...pend,{id,amt:+amt,app:name}])
  location.href=pkg?`intent://pay?${q}#Intent;scheme=upi;package=${pkg};end`:`upi://pay?${q}`}
 return<><div className="hero"><div className="cap" style={{color:'#cfe5e1',margin:0}}>Wallet balance</div><div className="serif">{inr(bal)}</div><p>Bookings are paid from this balance plus a 3% platform commission.</p></div>
 <div className="card" style={{marginTop:16}}><h2>Add money</h2><div className="cap">Amount</div><input className="input" inputMode="numeric" value={'₹ '+amt} onChange={e=>setAmt(+e.target.value.replace(/\D/g,'')||0)}/>
 <div className="row" style={{flexWrap:'wrap',marginTop:12}}>{[500,1000,2000,5000].map(a=><button key={a} className={'pill'+(amt===a?' on':'')} onClick={()=>setAmt(a)}>{inr(a)}</button>)}</div>
 <div className="cap">Choose your UPI app</div><div className="grid">{UPI.map(([n,l,c],i)=><div key={n} className={'pill opt'+(app===i?' on':'')} onClick={()=>setApp(i)}><span className="dot" style={{background:c}}>{l}</span>{n}</div>)}</div>
 <button className="btn" onClick={pay}>Pay {inr(+amt)} with {UPI[app][0]}</button>
 <div className="mut" style={{background:'#f3f1ee',borderRadius:18,padding:14,marginTop:14}}>Paying <b style={{color:'#000'}}>{MERCHANT}</b> directly? After paying, confirm it in <a onClick={goA} style={{color:'var(--teal)'}}>Top-up approvals</a>.</div></div></>}

function Sheet({t,close,bal,pwd,user,pay,goW,goP}){
 const[q,setQ]=useState(t.q),[d,setD]=useState(0),[s,setS]=useState(null),[addr,setAddr]=useState(''),[ask,setAsk]=useState(false),[pw,setPw]=useState(''),[done,setDone]=useState(null),[err,setErr]=useState('')
 const price=t.p[q],comm=Math.round(price*.03),total=price+comm,h=new Date().getHours()
 const confirm=()=>{if(s===null||addr.trim().length<5)return setErr('Choose a time slot and type your exact location');setErr('')
  if(bal<total)return goW();if(!pwd)return goP();setAsk(true)}
 const final=()=>{if(pw!==pwd){setErr('Wrong password');return}const sl=SLOTS.find(x=>x.s===s)
  const b={id:Date.now(),n:t.n,q,date:day(d),s,l:sl.l,addr,price,comm,total};pay(b);setAsk(false);setDone(b)}
 if(done)return<div className="sheet"><div><div className="ok"><div style={{fontSize:56}}>✓</div><h2>Booking confirmed!</h2><p>{done.n}<br/>{done.q.toLocaleString('en-IN')} L · {done.date} · {done.l}</p><b>{inr(done.total)} paid from wallet</b><p>GPS tracking will start automatically during your slot.</p></div><button className="btn" onClick={close}>Done</button></div></div>
 return<div className="sheet" onClick={e=>e.target===e.currentTarget&&close()}><div>
  <div className="row sp"><h2>{t.n}</h2><span className="rate">{t.r}</span></div><div className="mut">📍 {t.a} · {t.d.toFixed(1)} km away</div>
  <div className="cap">Quantity</div><div className="row" style={{flexWrap:'wrap'}}>{Object.keys(t.p).map(k=><button key={k} className={'pill'+(+k===q?' on':'')} onClick={()=>setQ(+k)}>{(+k).toLocaleString('en-IN')} L · {inr(t.p[k])}</button>)}</div>
  <div className="cap">Day</div><div className="row">{['Today','Tomorrow'].map((x,i)=><button key={x} className={'pill'+(d===i?' on':'')} onClick={()=>{setD(i);setS(null)}}>{x}</button>)}</div>
  <div className="cap">Time slot</div><div className="grid">{SLOTS.map(x=>{const past=d===0&&h>=x.s+3;return<button key={x.s} disabled={past} className={'pill'+(s===x.s?' on':'')} style={{opacity:past?.4:1}} onClick={()=>setS(x.s)}>{x.l}</button>})}</div>
  <div className="cap">Your exact location</div><textarea className="input" value={addr} onChange={e=>setAddr(e.target.value)} placeholder="House no., street, landmark, area…"/>
  <div className="card" style={{marginTop:16}}><div className="tot"><span>Tanker amount</span><span>{inr(price)}</span></div><div className="tot"><span>Platform commission (3%)</span><span>{inr(comm)}</span></div><div className="tot b"><span>Total</span><span>{inr(total)}</span></div></div>
  {err&&<p style={{color:'#d93a2b'}}>{err}</p>}<button className="btn" onClick={confirm}>Confirm booking</button>
  {ask&&<div className="sheet" style={{zIndex:12}}><div><h2>Enter wallet password</h2><input className="input" style={{marginTop:14}} type="password" inputMode="numeric" maxLength={4} autoFocus value={pw} onChange={e=>setPw(e.target.value.replace(/\D/g,''))}/>{err&&<p style={{color:'#d93a2b'}}>{err}</p>}<button className="btn" onClick={final}>Pay {inr(total)}</button><button className="btn red" onClick={()=>setAsk(false)}>Cancel</button></div></div>}
 </div></div>}

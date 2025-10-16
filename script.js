/* === costanti di configurazione === */
const DEFAULT_CENTER={lat:41.90,lng:12.50};
const DEFAULT_ZOOM=6;
const STORAGE_KEY='chaccp-crm-data';
const COLORS={
  potential:'#ff4444',
  contacted:'#ffbb33',
  interested:'#00c851',
  closed:'#607d8b'
};

/* === stato applicazione === */
let map,placesService,autocomplete,db={locals:{},visits:{}},tempMarker=null;

/* === caricamento database === */
function loadDatabase(){
  const raw=localStorage.getItem(STORAGE_KEY);
  if(raw){
    try{db=JSON.parse(raw);}catch(e){console.error(e);}
  }
}

/* === salvataggio database === */
function saveDatabase(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(db));
}

/* === inizializzazione mappa === */
function initMap(){
  loadDatabase();
  map=new google.maps.Map(document.getElementById('map'),{
    center:DEFAULT_CENTER,
    zoom:DEFAULT_ZOOM,
    mapTypeControl:false,
    streetViewControl:false,
    fullscreenControl:false
  });
  placesService=new google.maps.places.PlacesService(map);
  buildAutocomplete();
  renderStoredMarkers();
}

/* === autocomplete setup === */
function buildAutocomplete(){
  const input=document.getElementById('search');
  autocomplete=new google.maps.places.Autocomplete(input,{componentRestrictions:{country:'it'}});
  autocomplete.addListener('place_changed',()=>{
    const place=autocomplete.getPlace();
    if(!place.place_id)return;
    map.panTo(place.geometry.location);
    map.setZoom(17);
    if(tempMarker)tempMarker.setMap(null);
    tempMarker=new google.maps.Marker({
      position:place.geometry.location,
      map,
      title:place.name,
      icon:getPin('potential')
    });
    tempMarker.addListener('click',()=>openPanel(place,true));
    openPanel(place,true);
  });
}

/* === costruzione pin colorato === */
function getPin(state){
  const svg=`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" 
   width="24" height="40"><path fill="${COLORS[state]}" 
   d="M12 0C5.4 0 0 5.4 0 12c0 8.3 12 28 12 28s12-19.7 12-28C24 5.4 18.6 0 12 0z"/></svg>`;
  return {url:svg,scaledSize:new google.maps.Size(24,40)};
}

/* === apertura pannello === */
function openPanel(place,isTemp){
  const panel=document.getElementById('panel');
  panel.innerHTML='';
  const h=document.createElement('h2');h.textContent=place.name||db.locals[place.place_id].name;
  panel.appendChild(h);
  const p=document.createElement('p');p.textContent=place.formatted_address||db.locals[place.place_id].address;
  panel.appendChild(p);
  if(isTemp){
    const btn=document.createElement('button');
    btn.textContent='Salva nel CRM';
    btn.onclick=()=>savePlace(place);
    panel.appendChild(btn);
  }else{
    const btnEdit=document.createElement('button');
    btnEdit.textContent='Nuova visita';
    btnEdit.onclick=()=>newVisit(place.place_id);
    panel.appendChild(btnEdit);
    const btnDel=document.createElement('button');
    btnDel.textContent='Elimina';
    btnDel.onclick=()=>deletePlace(place.place_id);
    panel.appendChild(btnDel);
  }
  panel.classList.add('visible');
}

/* === salvataggio locale === */
function savePlace(place){
  db.locals[place.place_id]={
    id:place.place_id,
    name:place.name,
    address:place.formatted_address,
    phone:place.formatted_phone_number||'ND',
    rating:place.rating||0,
    lat:place.geometry.location.lat(),
    lng:place.geometry.location.lng(),
    state:'potential',
    created:new Date().toISOString()
  };
  saveDatabase();
  placeSavedFeedback(place.place_id);
}

/* === feedback visuale === */
function placeSavedFeedback(id){
  if(tempMarker){
    tempMarker.setIcon(getPin('potential'));
    tempMarker.addListener('click',()=>openPanel(db.locals[id],false));
  }
  renderStoredMarkers();
  document.getElementById('panel').classList.remove('visible');
}

/* === rendering pin esistenti === */
function renderStoredMarkers(){
  Object.values(db.locals).forEach(loc=>{
    if(loc.marker)return;
    loc.marker=new google.maps.Marker({
      position:{lat:loc.lat,lng:loc.lng},
      map,
      title:loc.name,
      icon:getPin(loc.state)
    });
    loc.marker.addListener('click',()=>openPanel(loc,false));
  });
}

/* === nuova visita === */
function newVisit(id){
  const loc=db.locals[id];
  const note=prompt('Inserisci commento visita:');
  if(note===null)return;
  const interesse=parseInt(prompt('Interesse 0-10?'),10)||0;
  const v={ts:new Date().toISOString(),note,score:interesse};
  if(!db.visits[id])db.visits[id]=[];
  db.visits[id].push(v);
  if(interesse>=8)loc.state='interested';
  else if(interesse>=5)loc.state='contacted';
  else loc.state='closed';
  saveDatabase();
  loc.marker.setIcon(getPin(loc.state));
  alert('Visita salvata con successo');
}

/* === eliminazione locale === */
function deletePlace(id){
  if(!confirm('Eliminare il locale dal CRM?'))return;
  const loc=db.locals[id];
  loc.marker.setMap(null);
  delete db.locals[id];
  delete db.visits[id];
  saveDatabase();
  document.getElementById('panel').classList.remove('visible');
}
// ESPOSTA PER GOOGLE MAPS
window.initMap = initMap;


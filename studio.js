/* MetalGui Studio: browser-based 2D scene editor + Supabase persistence. */
const SUPABASE_URL = 'https://mgpbgpmlgkpfptbwszar.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_P2vdbpnAbX0-zjyKhD4i9g_X5TW3Iel';
const { createClient } = window.supabase || {};
const db = createClient ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const state = { user:null, projects:[], project:null, selectedId:null, zoom:1, tool:'select', playing:false, keys:{}, dirty:false, saveTimer:null, playFrame:null, lastTime:0 };
const colors = { block:'#8ce65d', player:'#507fdb', coin:'#f4c64d', enemy:'#e87c6a', text:'#30372b' };
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())+Math.random().toString(16).slice(2));
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2600)}
function message(el,text,error=false){el.textContent=text;el.classList.toggle('error',error)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function defaultScene(template='empty',settings={}){return {version:1,script:['# MetalGui game script','# Called every frame. dt is elapsed time in seconds.','def update(game, dt):','    pass',''].join('\\n'),objects:[],settings:{background:'#eaf2e5',gravity:9.8,resolution:settings.resolution||'1280x720',orientation:settings.orientation||'landscape',platform:settings.platform||'web',renderMode:'2d',template:'empty'}}}
function setAuthMode(mode){$$('[data-auth-mode]').forEach(b=>b.classList.toggle('active',b.dataset.authMode===mode));$('#authSubmit').innerHTML=mode==='signup'?'Create account <span>↗</span>':'Log in <span>↗</span>';$('#password').autocomplete=mode==='signup'?'new-password':'current-password';message($('#authMessage'),'')}
$$('[data-auth-mode]').forEach(b=>b.addEventListener('click',()=>setAuthMode(b.dataset.authMode)));
$('#authForm').addEventListener('submit',async e=>{e.preventDefault();if(!db){message($('#authMessage'),'Supabase client did not load. Check your connection and refresh.',true);return}const mode=$('.auth-tabs .active').dataset.authMode;const email=$('#email').value.trim();const password=$('#password').value;const submit=$('#authSubmit');submit.disabled=true;submit.textContent=mode==='signup'?'Creating account…':'Signing in…';message($('#authMessage'),'');try{const result=mode==='signup'?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});if(result.error)throw result.error;if(mode==='signup'&&!result.data.session){message($('#authMessage'),'Account created. Check your email to confirm it, then log in.');setAuthMode('signin')}else if(result.data.user){await startApp(result.data.user)}}catch(err){message($('#authMessage'),friendlyError(err.message),true)}finally{submit.disabled=false;submit.innerHTML=$('.auth-tabs .active').dataset.authMode==='signup'?'Create account <span>↗</span>':'Log in <span>↗</span>'}});
function friendlyError(s){if(/Invalid login credentials/i.test(s))return 'Email or password is incorrect.';if(/already registered/i.test(s))return 'This email already has an account. Try logging in.';if(/Email not confirmed/i.test(s))return 'Confirm your email using the link we sent you.';return s||'Something went wrong. Try again.'}
async function startApp(user){state.user=user;$('#authScreen').hidden=true;$('#app').hidden=false;$('#userEmail').textContent=user.email||'Creator';$('#accountButton').textContent=(user.email||'Account').split('@')[0]+' ↗';await loadProjects();showHome()}
db?.auth.onAuthStateChange((event,session)=>{if(session?.user&&$('#app').hidden)startApp(session.user);else if(!session?.user&&event==='SIGNED_OUT'){state.user=null;$('#app').hidden=true;$('#authScreen').hidden=false}});
$('#signOut').addEventListener('click',async()=>{if(state.dirty&&state.project)await saveProject(true);await db.auth.signOut();state.user=null;state.project=null;state.projects=[];$('#app').hidden=true;$('#authScreen').hidden=false;showHome()});
$('#accountButton').addEventListener('click',()=>toast(state.user?.email||'MetalGui account'));
async function loadProjects(){const {data,error}=await db.from('game_projects').select('*').order('updated_at',{ascending:false});if(error){toast('Could not load projects: '+error.message);return}state.projects=data||[];renderProjects()}
function renderProjects(){const grid=$('#projectGrid');grid.innerHTML='';$('#projectCount').textContent=state.projects.length+' PROJECT'+(state.projects.length===1?'':'S');$('#emptyState').hidden=state.projects.length>0;state.projects.forEach((p,i)=>{const card=document.createElement('article');card.className='project-card';card.innerHTML='<div class="project-art '+(i%3===1?'purple':i%3===2?'orange':'')+'"><span class="orb"></span><span class="platform"></span><span class="cube"></span></div><div class="project-card-content"><h3>'+esc(p.name)+'</h3><p>'+esc(p.description||'A new game idea, ready to explore.')+'</p><div class="card-bottom"><span>UPDATED '+new Date(p.updated_at).toLocaleDateString()+'</span><div class="card-actions"><button class="open-card">Open ↗</button><button class="delete-card" title="Delete project">×</button></div></div></div>';card.querySelector('.open-card').addEventListener('click',()=>openProject(p.id));card.querySelector('.delete-card').addEventListener('click',()=>deleteProject(p.id));grid.append(card)});const side=$('#sideProjects');side.innerHTML='';state.projects.forEach(p=>{const b=document.createElement('button');b.className='side-project';b.innerHTML='<span class="tiny-dot"></span><span>'+esc(p.name)+'</span>';b.addEventListener('click',()=>openProject(p.id));side.append(b)})}
function showHome(){state.project=null;$('#projectHome').hidden=false;$('#editorView').hidden=true;$('#pageTitle').textContent='Your workspace';$('#saveState').innerHTML='<i></i> All changes saved';renderProjects()}
$('#showProjects').addEventListener('click',showHome);$('#createProject').addEventListener('click',openProjectModal);$('#firstProject').addEventListener('click',openProjectModal);$('#closeModal').addEventListener('click',closeProjectModal);$('#projectModal').addEventListener('click',e=>{if(e.target===$('#projectModal'))closeProjectModal()});function openProjectModal(){$('#projectModal').hidden=false;$('#projectName').focus();message($('#projectMessage'),'')}function closeProjectModal(){$('#projectModal').hidden=true;$('#projectForm').reset()}
$('#projectForm').addEventListener('submit',async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;btn.textContent='Creating…';try{const name=$('#projectName').value.trim();const settings={platform:$('#projectPlatform').value,resolution:$('#projectResolution').value,orientation:$('#projectOrientation').value};if(!name)throw new Error('Give your project a name.');const {data,error}=await db.from('game_projects').insert({user_id:state.user.id,name,description:'',scene:defaultScene('empty',settings)}).select().single();if(error)throw error;state.projects.unshift(data);renderProjects();closeProjectModal();openProject(data.id);toast('Project created. Start building!')}catch(err){message($('#projectMessage'),friendlyError(err.message),true)}finally{btn.disabled=false;btn.innerHTML='Create project <span>↗</span>'}});
async function deleteProject(id){const p=state.projects.find(x=>x.id===id);if(!p||!confirm('Delete "'+p.name+'"? This cannot be undone.'))return;const {error}=await db.from('game_projects').delete().eq('id',id);if(error){toast('Could not delete project: '+error.message);return}if(state.project?.id===id)showHome();state.projects=state.projects.filter(x=>x.id!==id);renderProjects();toast('Project deleted')}
function normalizeScene(scene){const base=scene&&Array.isArray(scene.objects)?scene:defaultScene();return {...base,script:typeof base.script==='string'?base.script:'',objects:base.objects.map(o=>({...o,id:o.id||newId(),type:o.type||'block',x:Number(o.x)||0,y:Number(o.y)||0,w:Math.max(8,Number(o.w)||40),h:Math.max(8,Number(o.h)||40),color:o.color||colors[o.type]||colors.block,solid:o.solid!==false,visible:o.visible!==false}))}}
async function openProject(id){if(state.dirty&&state.project)await saveProject(true);const p=state.projects.find(x=>x.id===id);if(!p)return;state.project={...p,scene:normalizeScene(p.scene)};$('#pythonCode').value=state.project.scene.script||'# MetalGui game script\ndef update(game, dt):\n    pass\n';$('#pythonSaveState').textContent='Saved with project';state.selectedId=null;state.dirty=false;state.playing=false;$('#projectHome').hidden=true;$('#editorView').hidden=false;$('#pageTitle').textContent=p.name;$('#saveState').innerHTML='<i></i> All changes saved';$('#playOverlay').hidden=true;renderEditor();drawScene()}
function selected(){return state.project?.scene.objects.find(o=>o.id===state.selectedId)||null}
function markDirty(){if(!state.project)return;state.dirty=true;$('#saveState').innerHTML='<i style="background:#e3a84c"></i> Unsaved changes';$('#autosaveStatus').textContent='Changes pending…';clearTimeout(state.saveTimer);state.saveTimer=setTimeout(()=>saveProject(true),1200)}
async function saveProject(silent=false){if(!state.project||!state.dirty)return;const project=state.project;$('#saveState').innerHTML='<i style="background:#e3a84c"></i> Saving…';const {data,error}=await db.from('game_projects').update({name:project.name,description:project.description,scene:project.scene}).eq('id',project.id).select().single();if(error){$('#saveState').textContent='Save failed';$('#autosaveStatus').textContent='Save failed · retry';if(!silent)toast('Save failed: '+error.message);return}Object.assign(project,data,{scene:normalizeScene(data.scene)});state.projects=state.projects.map(p=>p.id===data.id?data:p).sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at));state.dirty=false;$('#saveState').innerHTML='<i></i> All changes saved';$('#autosaveStatus').textContent='Autosaved just now';$('#pageTitle').textContent=project.name;if(!silent)toast('Project saved');renderProjects()}

$('#saveProject').addEventListener('click',()=>saveProject(false));
$('#togglePython').addEventListener('click',()=>{const panel=$('#pythonPanel');panel.hidden=!panel.hidden;if(!panel.hidden)$('#pythonCode').focus()});
$('#pythonCode').addEventListener('input',()=>{if(!state.project)return;state.project.scene.script=$('#pythonCode').value;$('#pythonSaveState').textContent='Unsaved script changes';markDirty()});
$('#insertPythonExample').addEventListener('click',()=>{const example=['# MetalGui Python script','# Runs every frame. dt is elapsed time in seconds.','def update(game, dt):','    player = game.player','    if player is None:','        return',"    if game.keys['left']:",'        game.move(player, -240 * dt, 0)',"    if game.keys['right']:",'        game.move(player, 240 * dt, 0)',''].join('\\n');$('#pythonCode').value=example;if(state.project){state.project.scene.script=example;$('#pythonSaveState').textContent='Unsaved script changes';markDirty()}});
$('#exportBuild').addEventListener('click',exportWindowsBuild);
async function exportWindowsBuild(){
 if(!state.project)return;
 if(!window.JSZip){toast('Could not load ZIP exporter. Refresh and try again.');return}
 const button=$('#exportBuild');button.disabled=true;button.textContent='Preparing…';
 try{
  state.project.scene.script=$('#pythonCode').value;
  if(state.dirty)await saveProject(true);
  if(state.dirty)throw new Error('Project could not be saved. Fix the save error before exporting.');
  const projectName=state.project.name||'MetalGuiGame';
  const safeName=projectName.replace(/[^a-z0-9_-]/gi,'_').replace(/^_+|_+$/g,'')||'MetalGuiGame';
  const mainPy=[
'import json, pygame',
'from pathlib import Path',
'from game_runtime import Game',
'BASE = Path(__file__).resolve().parent',
'def main():',
'    scene = json.loads((BASE / "scene.json").read_text(encoding="utf-8"))',
'    width, height = 1000, 620',
'    try: width, height = [int(v) for v in scene.get("settings", {}).get("resolution", "1280x720").split("x", 1)]',
'    except (ValueError, AttributeError): pass',
'    width, height = min(width, 1600), min(height, 1000)',
'    pygame.init()',
'    screen = pygame.display.set_mode((width, height), pygame.RESIZABLE)',
'    pygame.display.set_caption(__TITLE__)',
'    clock = pygame.time.Clock()',
'    game = Game(scene.get("objects", []), width, height)',
'    try:',
'        import game_script',
'        game.script = game_script',
'    except Exception as exc: print("Python script load error:", exc)',
'    running = True',
'    while running:',
'        dt = min(clock.tick(120) / 1000.0, 0.05)',
'        for event in pygame.event.get():',
'            if event.type == pygame.QUIT: running = False',
'            elif event.type == pygame.KEYDOWN and game.script and hasattr(game.script, "on_key_down"):',
'                try: game.script.on_key_down(game, event.key)',
'                except Exception as exc: print("on_key_down error:", exc)',
'        game.update(dt)',
'        screen.fill(scene.get("settings", {}).get("background", "#eaf2e5"))',
'        for obj in game.objects:',
'            if not obj.get("visible", True): continue',
'            try: color = pygame.Color(obj.get("color", "#8ce65d"))',
'            except ValueError: color = pygame.Color("#8ce65d")',
'            rect = pygame.Rect(round(obj.get("x",0)), round(obj.get("y",0)), max(1,round(obj.get("w",40))), max(1,round(obj.get("h",40))))',
'            if obj.get("type") == "coin": pygame.draw.ellipse(screen, color, rect)',
'            elif obj.get("type") == "enemy": pygame.draw.polygon(screen, color, [(rect.centerx,rect.top),(rect.right,rect.bottom),(rect.left,rect.bottom)])',
'            elif obj.get("type") == "text": screen.blit(pygame.font.Font(None,max(16,rect.height)).render(str(obj.get("name","Text")),True,color),rect.topleft)',
'            else: pygame.draw.rect(screen,color,rect,border_radius=3 if obj.get("type")=="player" else 0)',
'        pygame.display.flip()',
'    pygame.quit()',
'if __name__ == "__main__": main()'
].join('\n').replace('__TITLE__',JSON.stringify(projectName));
  const runtimePy=[
'import traceback, pygame',
'class Game:',
'    def __init__(self, objects, width, height):',
'        self.objects=objects; self.width=width; self.height=height; self.script=None',
'        self.keys={"left":False,"right":False,"up":False,"down":False,"space":False}',
'        self.player=next((o for o in objects if o.get("type")=="player"),None)',
'    def move(self,obj,dx,dy):',
'        if obj in self.objects:',
'            obj["x"]=max(0,min(self.width-obj.get("w",1),obj.get("x",0)+dx))',
'            obj["y"]=max(0,min(self.height-obj.get("h",1),obj.get("y",0)+dy))',
'    def spawn(self,name="Object",x=100,y=100,width=40,height=40,color="#8ce65d"):',
'        obj={"name":name,"type":"block","x":x,"y":y,"w":width,"h":height,"color":color,"visible":True,"solid":True}; self.objects.append(obj); return obj',
'    def quit(self): pygame.event.post(pygame.event.Event(pygame.QUIT))',
'    def update(self,dt):',
'        pressed=pygame.key.get_pressed()',
'        self.keys.update({"left":pressed[pygame.K_LEFT] or pressed[pygame.K_a],"right":pressed[pygame.K_RIGHT] or pressed[pygame.K_d],"up":pressed[pygame.K_UP] or pressed[pygame.K_w],"down":pressed[pygame.K_DOWN] or pressed[pygame.K_s],"space":pressed[pygame.K_SPACE]})',
'        if self.script and hasattr(self.script,"update"):',
'            try: self.script.update(self,dt)',
'            except Exception: traceback.print_exc(); self.script=None'
].join('\n');
  const buildBat='@echo off\r\nsetlocal\r\ncd /d "%~dp0"\r\npy -3 --version >nul 2>&1\r\nif errorlevel 1 (echo Install Python 3.11+ from https://www.python.org/downloads/windows/ and enable Add Python to PATH. & pause & exit /b 1)\r\npy -3 -m pip install --upgrade pip\r\nif errorlevel 1 goto failed\r\npy -3 -m pip install -r requirements.txt\r\nif errorlevel 1 goto failed\r\necho Building Windows executable...\r\npy -3 -m PyInstaller --noconfirm --clean --onefile --windowed --name "'+safeName+'" --collect-all pygame --hidden-import game_script --add-data "scene.json;." main.py\r\nif errorlevel 1 goto failed\r\necho Build complete: dist\\'+safeName+'.exe\r\npause\r\nexit /b 0\r\n:failed\r\necho Build failed. Read the error above.\r\npause\r\nexit /b 1\r\n';
  const script=state.project.scene.script||'# MetalGui Python script\ndef update(game, dt):\n    pass\n';
  const readme='# '+projectName+' - MetalGui Windows export\n\n1. Install Python 3.11+ from https://www.python.org/downloads/windows/ and enable Add Python to PATH.\n2. Double-click build_windows.bat.\n3. The executable will be created at dist/'+safeName+'.exe.\n\nThe first build needs internet to install pygame and PyInstaller. The resulting EXE runs independently of MetalGui Studio.\n\nPython API: update(game, dt) runs every frame; game.player is the first Player object; game.keys has left/right/up/down/space; game.move(object, dx, dy) moves an object; game.spawn(name, x, y, width, height, color) creates a rectangle; game.quit() closes the game.\n\nThis initial 2D runtime does not yet include a full physics/collision engine, audio editor, asset importer or remote one-click build service.';
  const zip=new JSZip();
  zip.file('scene.json',JSON.stringify(state.project.scene,null,2));
  zip.file('game.py',script);
  zip.file('game_script.py',script);
  zip.file('main.py',mainPy);
  zip.file('game_runtime.py',runtimePy);
  zip.file('requirements.txt','pygame>=2.5,<3\npyinstaller>=6.0,<7\n');
  zip.file('build_windows.bat',buildBat);
  zip.file('README.md',readme);
  const blob=await zip.generateAsync({type:'blob'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=safeName+'_Windows_Source.zip';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  toast('Windows export package downloaded. Run build_windows.bat to create the .exe.');
 }catch(err){toast('Export failed: '+(err?.message||String(err)))}
 finally{button.disabled=false;button.textContent='Export Windows'}
}

function addObject(type){if(!state.project)return;const names={block:'Block',player:'Player',coin:'Coin',enemy:'Enemy',text:'Text'};const size=type==='player'?[34,52]:type==='coin'?[26,26]:type==='text'?[160,35]:[100,55];const o={id:newId(),name:names[type]+' '+(state.project.scene.objects.filter(x=>x.type===type).length+1),type,x:430+Math.round(Math.random()*80),y:type==='block'?430:340,w:size[0],h:size[1],color:colors[type]||colors.block,solid:type==='block'||type==='player'||type==='enemy',visible:true};state.project.scene.objects.push(o);state.selectedId=o.id;markDirty();renderEditor();drawScene()}
$('#addBlock').addEventListener('click',()=>addObject('block'));$('#addPlayer').addEventListener('click',()=>addObject('player'));$('#addCoin').addEventListener('click',()=>addObject('coin'));$('#addEnemy').addEventListener('click',()=>addObject('enemy'));$('#addText').addEventListener('click',()=>addObject('text'));$('#addObjectQuick').addEventListener('click',()=>addObject('block'));
function renderEditor(){if(!state.project)return;const list=$('#objectList');list.innerHTML='';state.project.scene.objects.forEach(o=>{const b=document.createElement('button');b.className='object-item'+(o.id===state.selectedId?' selected':'');const icons={block:'▰',player:'♟',coin:'✦',enemy:'◆',text:'T'};b.innerHTML='<span class="object-icon">'+icons[o.type]+'</span><span>'+esc(o.name)+'</span>';b.addEventListener('click',()=>selectObject(o.id));list.append(b)});$('#objectCount').textContent=state.project.scene.objects.length+' objects';const o=selected();$('#inspectorEmpty').hidden=!!o;$('#inspectorForm').hidden=!o;$('#selectedType').textContent=o?o.type.toUpperCase():'NONE';if(o){$('#objectName').value=o.name;$('#objectX').value=Math.round(o.x);$('#objectY').value=Math.round(o.y);$('#objectW').value=Math.round(o.w);$('#objectH').value=Math.round(o.h);$('#objectColor').value=o.color;$('#colorValue').textContent=o.color.toUpperCase();$('#objectSolid').checked=o.solid;$('#objectVisible').checked=o.visible}$('#zoomLabel').textContent=Math.round(state.zoom*100)+'%'}
function selectObject(id){state.selectedId=id;renderEditor();drawScene()}
const propInputs={objectName:'name',objectX:'x',objectY:'y',objectW:'w',objectH:'h',objectColor:'color',objectSolid:'solid',objectVisible:'visible'};
Object.entries(propInputs).forEach(([id,key])=>{$('#'+id).addEventListener('input',()=>{const o=selected();if(!o)return;let value=$('#'+id).type==='checkbox'?$('#'+id).checked:$('#'+id).value;if(['x','y','w','h'].includes(key))value=Number(value);if(['w','h'].includes(key))value=Math.max(8,Math.min(key==='w'?1000:620,value||8));if(key==='name')value=value.slice(0,50)||'Object';o[key]=value;if(key==='color')$('#colorValue').textContent=value.toUpperCase();markDirty();if(key==='name'||key==='visible')renderEditor();drawScene()})});
$('#deleteObject').addEventListener('click',()=>{const o=selected();if(!o)return;state.project.scene.objects=state.project.scene.objects.filter(x=>x.id!==o.id);state.selectedId=null;markDirty();renderEditor();drawScene()});
$$('[data-tool]').forEach(b=>b.addEventListener('click',()=>{state.tool=b.dataset.tool;$$('[data-tool]').forEach(x=>x.classList.toggle('active',x===b));$('#canvasHint').textContent=state.tool==='move'?'Drag an object to move it':'Select an object · Drag to move'}));
const canvas=$('#sceneCanvas'),ctx=canvas.getContext('2d');function drawObject(c,o,selectedNow=false){if(!o.visible)return;c.save();c.fillStyle=o.color;c.strokeStyle=selectedNow?'#24311d':'#00000014';c.lineWidth=selectedNow?3:1;const x=o.x,y=o.y,w=o.w,h=o.h;if(o.type==='coin'){c.beginPath();c.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#fff6c8';c.beginPath();c.ellipse(x+w/2-w*.12,y+h*.32,w*.12,h*.18,-.5,0,Math.PI*2);c.fill()}else if(o.type==='player'){c.fillRect(x+w*.12,y+h*.28,w*.76,h*.7);c.beginPath();c.arc(x+w/2,y+h*.17,w*.22,0,Math.PI*2);c.fill();c.strokeRect(x+w*.12,y+h*.28,w*.76,h*.7)}else if(o.type==='enemy'){c.beginPath();c.moveTo(x+w/2,y);c.lineTo(x+w,y+h*.85);c.lineTo(x,y+h*.85);c.closePath();c.fill();c.stroke()}else if(o.type==='text'){c.font='700 '+Math.max(14,h*.6)+'px DM Sans';c.textBaseline='middle';c.fillText(o.name,x,y+h/2);c.strokeRect(x-3,y-3,Math.max(w,ctx.measureText(o.name).width)+6,h+6)}else{c.fillRect(x,y,w,h);c.strokeRect(x,y,w,h);c.fillStyle='#ffffff26';c.fillRect(x,y,w,Math.min(5,h*.15))}if(selectedNow){c.strokeStyle='#344c27';c.setLineDash([5,4]);c.lineWidth=1.5;c.strokeRect(x-4,y-4,w+8,h+8);c.setLineDash([]);c.fillStyle='#fff';c.strokeStyle='#344c27';c.fillRect(x+w-4,y+h-4,8,8);c.strokeRect(x+w-4,y+h-4,8,8)}c.restore()}
function drawScene(){if(!state.project)return;const scene=state.project.scene;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle=scene.settings?.background||'#eaf2e5';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.strokeStyle='#8ea78320';ctx.lineWidth=1;for(let x=0;x<canvas.width;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke()}for(let y=0;y<canvas.height;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke()}ctx.restore();scene.objects.forEach(o=>drawObject(ctx,o,!state.playing&&o.id===state.selectedId));$('#objectCount').textContent=scene.objects.length+' objects'}
function canvasPoint(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}}
let drag=null;canvas.addEventListener('pointerdown',e=>{if(!state.project||state.playing)return;const p=canvasPoint(e);const hit=[...state.project.scene.objects].reverse().find(o=>o.visible&&p.x>=o.x&&p.x<=o.x+o.w&&p.y>=o.y&&p.y<=o.y+o.h);if(!hit){state.selectedId=null;renderEditor();drawScene();return}selectObject(hit.id);drag={id:hit.id,x:p.x,y:p.y,ox:hit.x,oy:hit.y};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!drag||!state.project)return;const p=canvasPoint(e);const o=state.project.scene.objects.find(x=>x.id===drag.id);if(!o)return;o.x=Math.round(Math.max(0,Math.min(canvas.width-o.w,drag.ox+p.x-drag.x)));o.y=Math.round(Math.max(0,Math.min(canvas.height-o.h,drag.oy+p.y-drag.y)));state.selectedId=o.id;markDirty();renderEditor();drawScene()});canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
$('#zoomIn').addEventListener('click',()=>{state.zoom=Math.min(1.5,state.zoom+.1);canvas.style.width=(state.zoom*100)+'%';renderEditor()});$('#zoomOut').addEventListener('click',()=>{state.zoom=Math.max(.5,state.zoom-.1);canvas.style.width=(state.zoom*100)+'%';renderEditor()});
function startPlay(){if(!state.project)return;state.playing=true;$('#playOverlay').hidden=false;$('#canvasHint').hidden=true;$('#playButton').textContent='▶ Playing';state.project.scene.objects.forEach(o=>{o._startX=o.x;o._startY=o.y});state.lastTime=performance.now();state.playFrame=requestAnimationFrame(playLoop);toast('Play mode started. Use A/D or arrow keys and Space to jump.')}
function stopPlay(){state.playing=false;cancelAnimationFrame(state.playFrame);state.keys={};state.project?.scene.objects.forEach(o=>{if('_startX'in o){o.x=o._startX;o.y=o._startY;delete o._startX;delete o._startY}});$('#playOverlay').hidden=true;$('#canvasHint').hidden=false;$('#playButton').innerHTML='▶ Play';drawScene()}
function playLoop(now){if(!state.playing||!state.project)return;const dt=Math.min(.033,(now-state.lastTime)/1000);state.lastTime=now;const objects=state.project.scene.objects;const player=objects.find(o=>o.type==='player');const platforms=objects.filter(o=>o.solid&&o!==player);if(player){if(state.keys.ArrowLeft||state.keys.a)player.x-=220*dt;if(state.keys.ArrowRight||state.keys.d)player.x+=220*dt;player.x=Math.max(0,Math.min(canvas.width-player.w,player.x));if(state.keys.Space&&!player._jump){player._vy=-390;player._jump=true}player._vy=(player._vy||0)+900*dt;player.y+=player._vy*dt;for(const p of platforms){if(player.x+player.w>p.x&&player.x<p.x+p.w&&player.y+player.h>=p.y&&player.y+player.h<=p.y+p.h+Math.max(10,player._vy*dt)&&player._vy>=0){player.y=p.y-player.h;player._vy=0;player._jump=false}}if(player.y+player.h>canvas.height){player.y=canvas.height-player.h;player._vy=0;player._jump=false}}ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle=state.project.scene.settings?.background||'#eaf2e5';ctx.fillRect(0,0,canvas.width,canvas.height);objects.forEach(o=>drawObject(ctx,o,false));state.playFrame=requestAnimationFrame(playLoop)}
$('#playButton').addEventListener('click',()=>state.playing?stopPlay():startPlay());$('#stopPlay').addEventListener('click',stopPlay);window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Space'].includes(e.code)&&state.playing)e.preventDefault();state.keys[e.code]=true;state.keys[e.key.toLowerCase()]=true;if(e.key==='Escape'&&state.playing)stopPlay()});window.addEventListener('keyup',e=>{state.keys[e.code]=false;state.keys[e.key.toLowerCase()]=false});window.addEventListener('beforeunload',e=>{if(state.dirty){e.preventDefault();e.returnValue=''}});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.dirty)saveProject(true)});
(async function init(){if(!db){message($('#authMessage'),'Could not load Supabase. Check your internet connection.',true);return}const {data}=await db.auth.getSession();if(data.session?.user)await startApp(data.session.user)})();

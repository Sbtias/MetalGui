const bubbleButton = document.querySelector('#bubbleButton');
const bubbleMenu = document.querySelector('#bubbleMenu');
const toast = document.querySelector('#toast');
const newProjectButton = document.querySelector('#newProject');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

bubbleButton?.addEventListener('click', () => {
  const opening = bubbleMenu.hidden;
  bubbleMenu.hidden = !opening;
  bubbleButton.setAttribute('aria-expanded', String(opening));
});

document.addEventListener('click', (event) => {
  if (!bubbleMenu || bubbleMenu.hidden) return;
  if (!bubbleMenu.contains(event.target) && !bubbleButton.contains(event.target)) {
    bubbleMenu.hidden = true;
    bubbleButton.setAttribute('aria-expanded', 'false');
  }
});

bubbleMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    bubbleMenu.hidden = true;
    bubbleButton.setAttribute('aria-expanded', 'false');
  });
});

newProjectButton?.addEventListener('click', () => {
  showToast('Project creation is a preview. Connect Supabase to save real projects.');
});

document.querySelectorAll('.project-open').forEach((button) => {
  button.addEventListener('click', () => {
    const name = button.closest('.project-row')?.querySelector('.project-info b')?.textContent || 'Project';
    showToast(`${name} is a sample project preview.`);
  });
});

document.querySelectorAll('a[href="#get-started"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showToast('Sign-in is the next step. Supabase Auth is not connected yet.');
  });
});

document.querySelectorAll('.hero-actions a[href="#workspace"], .closing a[href="#get-started"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (link.getAttribute('href') === '#workspace') {
      event.preventDefault();
      document.querySelector('#workspace')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('Workspace preview — real projects will connect to Supabase.');
    }
  });
});


// Real-time Three.js island. CSS artwork remains as a graceful fallback.
(function initMetalGui3D() {
  const host = document.querySelector('.art-scene');
  if (!host || !window.THREE) return;

  try {
    const THREE = window.THREE;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(7.5, 6.2, 9.2);
    camera.lookAt(0, 0.55, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'metal-3d-canvas';
    renderer.domElement.setAttribute('aria-label', 'Animated three-dimensional floating island');
    renderer.domElement.setAttribute('role', 'img');
    host.prepend(renderer.domElement);
    host.classList.add('has-3d');

    scene.add(new THREE.HemisphereLight(0xf5ffdf, 0x81985b, 2.0));
    const keyLight = new THREE.DirectionalLight(0xfff4d1, 3.2);
    keyLight.position.set(5, 9, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xd8d2ff, 1.4);
    rimLight.position.set(-6, 3, -5);
    scene.add(rimLight);

    const world = new THREE.Group();
    scene.add(world);

    const mat = (color, roughness = 0.78, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const grassTop = mat(0xc8e99a);
    const grassSide = mat(0x91b966);
    const earth = mat(0xb98664);
    const earthLight = mat(0xd7a67b);
    const stone = mat(0xeee9d2);
    const lime = mat(0xd8f47a, 0.38);
    const lilac = mat(0xb9a8e9, 0.4);
    const coral = mat(0xf3a987, 0.5);
    const leaf = mat(0x709b4d);
    const trunk = mat(0x987351);
    const water = mat(0x9ed7cf, 0.28, 0.12);

    // Layered floating island with a soft, faceted underside.
    const islandTop = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 2.45, 0.62, 9, 1), grassTop);
    islandTop.position.y = 0.2;
    islandTop.rotation.y = 0.18;
    islandTop.castShadow = true; islandTop.receiveShadow = true;
    world.add(islandTop);
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(2.48, 1.25, 1.05, 8, 1), earth);
    soil.position.y = -0.58; soil.rotation.y = 0.18; soil.castShadow = true;
    world.add(soil);
    const lowerRock = new THREE.Mesh(new THREE.ConeGeometry(1.26, 1.15, 7, 1), grassSide);
    lowerRock.position.y = -1.45; lowerRock.rotation.y = 0.35; lowerRock.castShadow = true;
    world.add(lowerRock);

    // A small pond, stepping stones and playful props.
    const pond = new THREE.Mesh(new THREE.CylinderGeometry(0.67, 0.67, 0.035, 32), water);
    pond.scale.set(1.0, 1, 0.66); pond.position.set(-0.82, 0.535, 0.28); world.add(pond);
    const pathPoints = [[-0.15,0.53,0.7],[0.2,0.54,0.92],[0.55,0.55,1.02]];
    pathPoints.forEach((p,i)=>{
      const s=new THREE.Mesh(new THREE.DodecahedronGeometry(0.19,0),stone);
      s.position.set(...p); s.scale.set(1,.28,.78); s.rotation.y=i*.6; s.castShadow=true; world.add(s);
    });

    // Tiny stylized trees: trunk + stacked soft geometric canopies.
    function tree(x,z,scale=1) {
      const group = new THREE.Group(); group.position.set(x,0.48,z); group.scale.setScalar(scale);
      const t = new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,.42,6),trunk); t.position.y=.2; t.castShadow=true; group.add(t);
      const a = new THREE.Mesh(new THREE.ConeGeometry(.36,.62,7),leaf); a.position.y=.57; a.castShadow=true; group.add(a);
      const b = new THREE.Mesh(new THREE.ConeGeometry(.26,.48,7),grassTop); b.position.y=.87; b.castShadow=true; group.add(b);
      world.add(group); return group;
    }
    const trees=[tree(-1.75,-.35,.9),tree(1.45,-.8,.75),tree(.95,.95,.58),tree(-1.55,1.0,.62)];

    // Little character orb, deliberately toy-like and readable at small sizes.
    const character = new THREE.Group(); character.position.set(.05,.93,-.1); world.add(character);
    const body = new THREE.Mesh(new THREE.SphereGeometry(.38,24,18),lime); body.scale.y=1.08; body.castShadow=true; character.add(body);
    const eyeMat = new THREE.MeshStandardMaterial({color:0x35452b,roughness:.5});
    [-.12,.12].forEach(x=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),eyeMat);e.position.set(x,.035,.335);character.add(e)});
    const cheekMat = mat(0xf4b5a0);
    [-.21,.21].forEach(x=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.045,10,8),cheekMat);e.position.set(x,-.08,.31);character.add(e)});

    // Floating blocks with bevel-like geometry, plus a thin orbit ring.
    const blockGeo = new THREE.BoxGeometry(.46,.46,.46);
    const blocks=[];
    [[-2.25,1.3,.1,lilac],[2.25,1.75,-.35,coral],[.15,2.15,-.75,stone]].forEach((p,i)=>{
      const b=new THREE.Mesh(blockGeo,p[3]); b.position.set(p[0],p[1],p[2]); b.rotation.set(.3+i*.25,.5+i,.25); b.castShadow=true; world.add(b); blocks.push({mesh:b,baseY:p[1],phase:i*1.7});
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.5,.012,8,100),new THREE.MeshBasicMaterial({color:0xf8ffe9,transparent:true,opacity:.85}));
    ring.rotation.set(1.02,.1,.22); ring.position.y=.6; world.add(ring);

    // A few tiny stars give the composition depth without turning it into a screensaver.
    const stars = new THREE.Group(); world.add(stars);
    for(let i=0;i<24;i++){
      const g=new THREE.Mesh(new THREE.SphereGeometry(.025+(i%3)*.008,8,8),i%2?stone:lime);
      const angle=i*2.399;
      const radius=2.4+(i%5)*.28;
      g.position.set(Math.cos(angle)*radius,.45+(i%6)*.43,Math.sin(angle)*radius);
      stars.add(g);
    }

    let pointerX=0, pointerY=0, targetX=0, targetY=0;
    host.addEventListener('pointermove', e=>{
      const r=host.getBoundingClientRect();
      targetX=((e.clientX-r.left)/r.width-.5)*.55;
      targetY=((e.clientY-r.top)/r.height-.5)*.22;
    }, {passive:true});
    host.addEventListener('pointerleave',()=>{targetX=0;targetY=0},{passive:true});

    const resize = () => {
      const w=Math.max(1,host.clientWidth), h=Math.max(1,host.clientHeight);
      renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
    };
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
    else window.addEventListener('resize',resize);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clock = new THREE.Clock();
    function animate(){
      requestAnimationFrame(animate);
      const t=clock.getElapsedTime();
      pointerX += (targetX-pointerX)*.035; pointerY += (targetY-pointerY)*.035;
      world.rotation.y = (reduced ? 0 : t*.11) + pointerX;
      world.rotation.x = pointerY;
      character.position.y=.93+(reduced?0:Math.sin(t*1.8)*.07);
      character.rotation.y=Math.sin(t*.65)*.16;
      blocks.forEach(({mesh,baseY,phase})=>{mesh.position.y=baseY+(reduced?0:Math.sin(t*1.15+phase)*.12);if(!reduced)mesh.rotation.y+=.0025});
      stars.rotation.y=reduced?0:-t*.035;
      renderer.render(scene,camera);
    }
    animate();
  } catch (error) {
    console.warn('MetalGui 3D scene could not initialize; using CSS fallback.', error);
  }
})();

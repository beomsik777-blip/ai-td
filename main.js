// --- 1. 기본 설정 및 데이터 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const goldDisplay = document.getElementById('gold');
const livesDisplay = document.getElementById('lives');
const waveDisplay = document.getElementById('wave-display');
const gridSize = 40;
const cols = 800 / gridSize;
const rows = 600 / gridSize;

let gold = 1000;
let lives = 20;
let selectedTowerType = null;
let towers = [];
let enemies = [];
let projectiles = [];
let enemyPath = [];
let waveActive = false;
let spawning = false;
let waveLevel = 1;
let mousePos = { x: -100, y: -100 };
let frameCount = 0;
let selectedTowerObj = null;
let pendingPos = null;
let gameStarted = false;

const COLORS = {
    accent: "#38bdf8",
    gold: "#fbbf24",
    fire: "#f43f5e",
    ice: "#0ea5e9",
    earth: "#84cc16",
    electric: "#eab308"
};

// --- 고퀄리티 프리미엄 게임 에셋 (5단계 진화) ---
const towerData = {
    fire: { 
        name: "피닉스 아처", color: COLORS.fire, type: "arrow", baseCost: 100,
        levels: [
            { damage: 60, range: 150, attackSpeed: 550, imgSrc: "https://img.icons8.com/isometric/512/fire-elemental.png" }, 
            { damage: 150, range: 165, attackSpeed: 500, imgSrc: "https://img.icons8.com/isometric/512/archer.png" }, 
            { damage: 380, range: 180, attackSpeed: 450, imgSrc: "https://img.icons8.com/isometric/512/phoenix.png" }, 
            { damage: 1000, range: 200, attackSpeed: 400, imgSrc: "https://img.icons8.com/isometric/512/fire-knight.png" }, 
            { damage: 3500, range: 240, attackSpeed: 300, imgSrc: "https://img.icons8.com/isometric/512/sun-god.png" }
        ]
    },
    ice: { 
        name: "프로스트 퀸", color: COLORS.ice, type: "crystal", baseCost: 120,
        levels: [
            { damage: 35, range: 120, attackSpeed: 850, slow: 0.45, imgSrc: "https://img.icons8.com/isometric/512/ice-elemental.png" }, 
            { damage: 90, range: 135, attackSpeed: 800, slow: 0.55, imgSrc: "https://img.icons8.com/isometric/512/ice-mage.png" }, 
            { damage: 220, range: 150, attackSpeed: 750, slow: 0.65, imgSrc: "https://img.icons8.com/isometric/512/frozen-crown.png" }, 
            { damage: 550, range: 175, attackSpeed: 700, slow: 0.75, imgSrc: "https://img.icons8.com/isometric/512/ice-queen.png" }, 
            { damage: 1800, range: 210, attackSpeed: 600, slow: 0.9, imgSrc: "https://img.icons8.com/isometric/512/ice-goddess.png" }
        ]
    },
    earth: { 
        name: "타이탄 나이트", color: COLORS.earth, type: "stone", baseCost: 150,
        levels: [
            { damage: 160, range: 220, attackSpeed: 1400, imgSrc: "https://img.icons8.com/isometric/512/rock-golem.png" }, 
            { damage: 450, range: 245, attackSpeed: 1300, imgSrc: "https://img.icons8.com/isometric/512/armored-warrior.png" }, 
            { damage: 1250, range: 270, attackSpeed: 1200, imgSrc: "https://img.icons8.com/isometric/512/earth-shield.png" }, 
            { damage: 3200, range: 300, attackSpeed: 1050, imgSrc: "https://img.icons8.com/isometric/512/mountain-giant.png" }, 
            { damage: 9500, range: 350, attackSpeed: 900, imgSrc: "https://img.icons8.com/isometric/512/earth-god.png" }
        ]
    },
    electric: { 
        name: "라이트닝 쉐도우", color: COLORS.electric, type: "bolt", baseCost: 130,
        levels: [
            { damage: 55, range: 170, attackSpeed: 280, imgSrc: "https://img.icons8.com/isometric/512/lightning-bolt.png" }, 
            { damage: 125, range: 190, attackSpeed: 230, imgSrc: "https://img.icons8.com/isometric/512/ninja.png" }, 
            { damage: 280, range: 210, attackSpeed: 180, imgSrc: "https://img.icons8.com/isometric/512/storm-cloud.png" }, 
            { damage: 850, range: 240, attackSpeed: 130, imgSrc: "https://img.icons8.com/isometric/512/thunder-god.png" }, 
            { damage: 2600, range: 280, attackSpeed: 80, imgSrc: "https://img.icons8.com/isometric/512/zeus.png" }
        ]
    }
};

const enemyTypes = {
    orc: { name: "워리어", color: "#4ade80", hp: 1.0, speed: 1.3, size: 20, imgSrc: "https://img.icons8.com/isometric/512/orc.png" },
    ogre: { name: "기사", color: "#fca5a5", hp: 6.5, speed: 0.95, size: 28, imgSrc: "https://img.icons8.com/isometric/512/skeleton-warrior.png" },
    boss: { name: "드래곤", color: "#fbbf24", hp: 28.0, speed: 0.65, size: 45, imgSrc: "https://img.icons8.com/isometric/512/dragon.png" }
};

// --- 이미지 및 오디오 초기화 ---
const towerImgs = {};
Object.keys(towerData).forEach(type => {
    towerImgs[type] = towerData[type].levels.map(lv => { const img = new Image(); img.src = lv.imgSrc; return img; });
});
const enemyImgs = {};
Object.keys(enemyTypes).forEach(key => { const img = new Image(); img.src = enemyTypes[key].imgSrc; enemyImgs[key] = img; });

const lobbyBGM = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3');
const battleBGM = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');
lobbyBGM.loop = battleBGM.loop = true;
lobbyBGM.volume = 0.3; battleBGM.volume = 0.4;
let audioCtx, isMuted = false, audioInitialized = false;

function initAudio() {
    if (audioInitialized) return; audioInitialized = true;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (!isMuted) lobbyBGM.play(); } catch(e) {}
}

function playSFX(type) {
    if (!audioCtx || isMuted) return;
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    if (type === 'upgrade') { osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(1000, now+0.2); gain.gain.setValueAtTime(0.1, now); osc.start(now); osc.stop(now+0.2); }
    else { osc.frequency.setValueAtTime(600, now); gain.gain.setValueAtTime(0.05, now); osc.start(now); osc.stop(now+0.1); }
}

function switchMusic(isBattle) {
    if (isMuted || !audioInitialized) return;
    if (isBattle) { lobbyBGM.pause(); battleBGM.play().catch(()=>{}); }
    else { battleBGM.pause(); lobbyBGM.play().catch(()=>{}); }
}

window.toggleMute = function() {
    isMuted = !isMuted; const btn = document.getElementById('mute-btn');
    if (isMuted) { lobbyBGM.pause(); battleBGM.pause(); btn.textContent = "打 Music Off"; }
    else { if (waveActive) battleBGM.play(); else lobbyBGM.play(); btn.textContent = "🎵 Music On"; }
};

// --- 2. 클래스 정의 ---
class Projectile {
    constructor(x, y, target, spec, level) {
        this.x = x; this.y = y; this.target = target; this.spec = spec; this.level = level;
        this.speed = spec.type === "bolt" ? 40 : 14 + level; this.dead = false; this.radius = 6 + level;
    }
    update() {
        if (this.target.dead) { this.dead = true; return; }
        const dx = this.target.x - this.x, dy = this.target.y - this.y, dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < this.speed) {
            this.target.health -= this.spec.levels[this.level].damage;
            if (this.spec.levels[this.level].slow) this.target.speed *= (1 - this.spec.levels[this.level].slow);
            if (this.target.health <= 0 && !this.target.dead) { gold += this.target.goldReward; this.target.dead = true; updateStats(); }
            this.dead = true;
        } else { this.x += (dx/dist) * this.speed; this.y += (dy/dist) * this.speed; }
    }
    draw() {
        ctx.save(); ctx.translate(this.x, this.y - 25); ctx.shadowBlur = 15; ctx.shadowColor = this.spec.color; ctx.fillStyle = this.spec.color;
        if (this.spec.type === "bolt") { ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo((Math.random()-0.5)*40, (Math.random()-0.5)*40); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.fill(); }
        ctx.restore();
    }
}

class Enemy {
    constructor(level, typeKey) {
        const type = enemyTypes[typeKey]; this.typeKey = typeKey;
        this.maxHealth = (90 * Math.pow(1.4, level - 1)) * type.hp;
        this.health = this.maxHealth; this.baseSpeed = type.speed + (level * 0.02);
        this.speed = this.baseSpeed; this.pathIndex = 0; this.dead = false; this.radius = type.size;
        this.goldReward = Math.floor((40 + (level * 7)) * (typeKey === 'boss' ? 15 : 1));
        const start = enemyPath[0]; this.x = start.x * gridSize + 20; this.y = start.y * gridSize + 20;
    }
    update() {
        if (this.pathIndex >= enemyPath.length - 1) { lives -= (this.typeKey === 'boss' ? 15 : 1); updateStats(); this.dead = true; return; }
        const target = enemyPath[this.pathIndex + 1], tx = target.x * gridSize + 20, ty = target.y * gridSize + 20;
        const dx = tx - this.x, dy = ty - this.y, dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < this.speed) { this.pathIndex++; } else { this.x += (dx/dist) * this.speed; this.y += (dy/dist) * this.speed; }
        this.speed = this.baseSpeed;
    }
    draw() {
        ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.beginPath(); ctx.ellipse(this.x, this.y, this.radius*1.2, this.radius*0.6, 0, 0, Math.PI*2); ctx.fill();
        ctx.save(); ctx.translate(this.x, this.y - 20 + Math.sin(Date.now()*0.01)*5);
        const img = enemyImgs[this.typeKey];
        if (img && img.complete) { ctx.shadowBlur = 15; ctx.shadowColor = enemyTypes[this.typeKey].color; ctx.drawImage(img, -this.radius, -this.radius, this.radius*2, this.radius*2); }
        const bw = this.radius*2.2; ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(-bw/2, -this.radius-15, bw, 6);
        ctx.fillStyle = this.typeKey === 'boss' ? COLORS.gold : "#f43f5e"; ctx.fillRect(-bw/2, -this.radius-15, bw * (this.health/this.maxHealth), 6);
        ctx.restore();
    }
}

// --- 3. 유틸리티 및 시스템 ---
function findPath(tempTowers = towers) {
    const start = { x: Math.floor(cols / 2), y: 0 }, queue = [[start]], visited = new Set([`${start.x},0`]);
    const blocked = new Set(tempTowers.map(t => `${Math.floor(t.x/gridSize)},${Math.floor(t.y/gridSize)}`));
    if (blocked.has(`${start.x},0`)) return null;
    while (queue.length > 0) {
        const path = queue.shift(), curr = path[path.length - 1];
        if (curr.y === rows - 1) return path;
        for (const d of [{x:0,y:1},{x:1,y:0},{x:-1,y:0},{x:0,y:-1}]) {
            const nx = curr.x+d.x, ny = curr.y+d.y, key = `${nx},${ny}`;
            if (nx>=0 && nx<cols && ny>=0 && ny<rows && !blocked.has(key) && !visited.has(key)) { visited.add(key); queue.push([...path, {x:nx, y:ny}]); }
        }
    } return null;
}

function updateStats() { goldDisplay.textContent = gold.toLocaleString(); livesDisplay.textContent = lives; if (lives <= 0) { alert("GAME OVER!"); localStorage.removeItem('heroDefenseSave'); location.reload(); } }
function saveGame() { localStorage.setItem('heroDefenseSave', JSON.stringify({ gold, lives, waveLevel, towers: towers.map(t => ({ x: t.x, y: t.y, type: t.type, level: t.level, invested: t.invested })) })); }

// --- 4. 렌더링 루프 ---
function drawHero(t, now, isPreview = false) {
    const spec = towerData[t.type], lv = t.level, tx = t.x + 20, ty = t.y + 20;
    ctx.save(); ctx.translate(tx, ty); if (isPreview) ctx.globalAlpha = 0.5;
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.beginPath(); ctx.ellipse(0, 8, 22, 11, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#334155"; ctx.beginPath(); ctx.ellipse(0, 6, 20, 10, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#475569"; ctx.beginPath(); ctx.ellipse(0, 3, 20, 10, 0, 0, Math.PI*2); ctx.fill();
    ctx.save(); ctx.translate(0, -35 - lv*3);
    if (selectedTowerObj === t) { ctx.strokeStyle = "white"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI*2); ctx.stroke(); }
    const auraGrad = ctx.createRadialGradient(0,0,0,0,0,30+lv*8); auraGrad.addColorStop(0, spec.color+"88"); auraGrad.addColorStop(1, "transparent");
    ctx.fillStyle = auraGrad; ctx.beginPath(); ctx.arc(0,0,30+lv*8,0,Math.PI*2); ctx.fill();
    const img = towerImgs[t.type][lv];
    if (img && img.complete) { ctx.shadowBlur = 20; ctx.shadowColor = spec.color; ctx.drawImage(img, -25, -25, 50, 50); }
    ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.beginPath(); ctx.arc(20, 20, 10, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = COLORS.gold; ctx.font = "bold 10px sans-serif"; ctx.textAlign="center"; ctx.fillText(`L${lv+1}`, 20, 24);
    ctx.restore(); ctx.restore();
}

function gameLoop() {
    frameCount++; const now = Date.now(); ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!gameStarted) { requestAnimationFrame(gameLoop); return; }
    
    // 격자 및 경로 렌더링
    ctx.strokeStyle = "rgba(56, 189, 248, 0.1)"; ctx.lineWidth = 1;
    for(let i=0; i<=cols; i++) { ctx.beginPath(); ctx.moveTo(i*gridSize, 0); ctx.lineTo(i*gridSize, 600); ctx.stroke(); }
    for(let i=0; i<=rows; i++) { ctx.beginPath(); ctx.moveTo(0, i*gridSize); ctx.lineTo(800, i*gridSize); ctx.stroke(); }
    if (enemyPath) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
        enemyPath.forEach(p => ctx.fillRect(p.x * gridSize + 2, p.y * gridSize + 2, gridSize - 4, gridSize - 4));
    }

    enemies.forEach(e => e.update()); enemies = enemies.filter(e => !e.dead); enemies.forEach(e => e.draw());
    projectiles.forEach(p => p.update()); projectiles = projectiles.filter(p => !p.dead); projectiles.forEach(p => p.draw());
    
    if (waveActive && !spawning && enemies.length === 0) { waveActive = false; document.getElementById('wave-start').disabled = false; switchMusic(false); saveGame(); }
    
    towers.forEach(t => {
        drawHero(t, now); const lvSpec = towerData[t.type].levels[t.level];
        if (now - t.lastShot > lvSpec.attackSpeed) {
            const target = enemies.find(e => Math.sqrt(Math.pow(e.x-(t.x+20),2)+Math.pow(e.y-(t.y+20),2)) <= lvSpec.range);
            if (target) { projectiles.push(new Projectile(t.x+20, t.y+20, target, towerData[t.type], t.level)); t.lastShot = now; }
        }
    });
    requestAnimationFrame(gameLoop);
}

// --- 5. 초기화 및 이벤트 ---
window.startGame = function(isContinue) {
    if (isContinue) {
        const data = JSON.parse(localStorage.getItem('heroDefenseSave'));
        if(data) { gold = data.gold; lives = data.lives; waveLevel = data.waveLevel; towers = data.towers.map(t=>({...t, lastShot:0})); }
    }
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('game-view').classList.add('visible');
    gameStarted = true; initAudio(); enemyPath = findPath(); updateStats();
};

window.goHome = function() { saveGame(); location.reload(); };

canvas.addEventListener('mousedown', (e) => {
    if (!gameStarted) return;
    const rect = canvas.getBoundingClientRect(), cx = (e.clientX - rect.left) * (800 / rect.width), cy = (e.clientY - rect.top) * (600 / rect.height);
    const gx = Math.floor(cx / gridSize) * gridSize, gy = Math.floor(cy / gridSize) * gridSize;
    const existing = towers.find(t => t.x === gx && t.y === gy);
    if (existing) { openHeroMenu(existing, e.clientX, e.clientY); selectedTowerObj = existing; }
    else if (selectedTowerType) {
        const cost = towerData[selectedTowerType].baseCost;
        if (gold >= cost) {
            const temp = [...towers, {x:gx, y:gy}], path = findPath(temp);
            if (path) { gold -= cost; towers.push({x:gx, y:gy, type:selectedTowerType, level:0, lastShot:0, invested:cost}); enemyPath = path; updateStats(); saveGame(); }
        }
    } else document.getElementById('hero-menu').style.display = 'none';
});

window.selectTower = function(type) { selectedTowerType = type; document.querySelectorAll('.tower-card').forEach(c => c.classList.toggle('selected', c.innerText.includes(towerData[type].name.split(' ')[0]))); };
window.startWave = function() { waveActive = true; spawning = true; document.getElementById('wave-start').disabled = true; switchMusic(true); let count = 0, total = 12 + waveLevel*2; const iv = setInterval(() => { enemies.push(new Enemy(waveLevel, waveLevel%5===0?'boss':(waveLevel>10?'ogre':'orc'))); if(++count>=total){clearInterval(iv); spawning=false;} }, 500); waveLevel++; };
window.handleMenuAction = function(action) {
    if (action === 'upgrade') {
        const cost = Math.floor(towerData[selectedTowerObj.type].baseCost * Math.pow(1.8, selectedTowerObj.level + 1));
        if (gold >= cost && selectedTowerObj.level < 4) { gold -= cost; selectedTowerObj.level++; selectedTowerObj.invested += cost; updateStats(); playSFX('upgrade'); saveGame(); }
    } else { gold += Math.floor(selectedTowerObj.invested * 0.5); towers = towers.filter(t => t !== selectedTowerObj); enemyPath = findPath(); updateStats(); saveGame(); }
    document.getElementById('hero-menu').style.display = 'none';
};

function openHeroMenu(h, x, y) { const m = document.getElementById('hero-menu'); m.style.display = 'flex'; m.style.left = `${x-24}px`; m.style.top = `${y-110}px`; }

document.addEventListener('DOMContentLoaded', () => {
    const uiPanel = document.getElementById('ui-panel');
    const homeBtn = document.createElement('button');
    homeBtn.id = 'home-btn'; homeBtn.className = 'action-btn'; homeBtn.textContent = 'EXIT TO HOME'; homeBtn.onclick = goHome;
    uiPanel.appendChild(homeBtn);
    if (localStorage.getItem('heroDefenseSave')) document.getElementById('continue-btn').style.display = 'block';
});

gameLoop();

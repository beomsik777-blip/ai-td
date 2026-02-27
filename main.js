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

// 색상 정의 (CSS 변수 대신 JS 변수 사용)
const COLORS = {
    accent: "#38bdf8",
    gold: "#fbbf24",
    fire: "#f43f5e",
    ice: "#0ea5e9",
    earth: "#84cc16",
    electric: "#eab308"
};

// 프리미엄 게임 에셋
const towerData = {
    fire: { name: "피닉스 아처", icon: "🏹", baseCost: 100, color: COLORS.fire, secondary: COLORS.gold, type: "arrow", 
        imgSrc: "https://cdn-icons-png.flaticon.com/512/3665/3665910.png", levels: [{ damage: 60, range: 150, attackSpeed: 550 }, { damage: 150, range: 165, attackSpeed: 500 }, { damage: 380, range: 180, attackSpeed: 450 }, { damage: 1000, range: 200, attackSpeed: 400 }, { damage: 3500, range: 240, attackSpeed: 300 }
    ]},
    ice: { name: "프로스트 퀸", icon: "🧙‍♀️", baseCost: 120, color: COLORS.ice, secondary: "#f0f9ff", type: "crystal", 
        imgSrc: "https://cdn-icons-png.flaticon.com/512/4754/4754432.png", levels: [{ damage: 35, range: 120, attackSpeed: 850, slow: 0.45 }, { damage: 90, range: 135, attackSpeed: 800, slow: 0.55 }, { damage: 220, range: 150, attackSpeed: 750, slow: 0.65 }, { damage: 550, range: 175, attackSpeed: 700, slow: 0.75 }, { damage: 1800, range: 210, attackSpeed: 600, slow: 0.9 }
    ]},
    earth: { name: "타이탄 나이트", icon: "🛡️", baseCost: 150, color: COLORS.earth, secondary: "#3f6212", type: "stone", 
        imgSrc: "https://cdn-icons-png.flaticon.com/512/8039/8039434.png", levels: [{ damage: 160, range: 220, attackSpeed: 1400 }, { damage: 450, range: 245, attackSpeed: 1300 }, { damage: 1250, range: 270, attackSpeed: 1200 }, { damage: 3200, range: 300, attackSpeed: 1050 }, { damage: 9500, range: 350, attackSpeed: 900 }
    ]},
    electric: { name: "라이트닝 쉐도우", icon: "🗡️", baseCost: 130, color: COLORS.electric, secondary: "#422006", type: "bolt", 
        imgSrc: "https://cdn-icons-png.flaticon.com/512/3665/3665955.png", levels: [{ damage: 55, range: 170, attackSpeed: 280 }, { damage: 125, range: 190, attackSpeed: 230 }, { damage: 280, range: 210, attackSpeed: 180 }, { damage: 850, range: 240, attackSpeed: 130 }, { damage: 2600, range: 280, attackSpeed: 80 }
    ]}
};

const enemyTypes = {
    orc: { name: "다크 워리어", icon: "👹", color: "#4ade80", hp: 1.0, speed: 1.3, size: 18, imgSrc: "https://cdn-icons-png.flaticon.com/512/620/620783.png" },
    ogre: { name: "데스 나이트", icon: "🐗", color: "#fca5a5", hp: 6.5, speed: 0.95, size: 26, imgSrc: "https://cdn-icons-png.flaticon.com/512/2610/2610260.png" },
    boss: { name: "어비설 드래곤", icon: "👑", color: "#fbbf24", hp: 28.0, speed: 0.65, size: 42, imgSrc: "https://cdn-icons-png.flaticon.com/512/2610/2610280.png" }
};

// 이미지 미리 로드
Object.keys(towerData).forEach(key => {
    const img = new Image(); img.src = towerData[key].imgSrc; towerData[key].img = img;
});
Object.keys(enemyTypes).forEach(key => {
    const img = new Image(); img.src = enemyTypes[key].imgSrc; enemyTypes[key].img = img;
});

// --- 2. 클래스 정의 ---
class Projectile {
    constructor(x, y, target, spec, level) {
        this.x = x; this.y = y; this.target = target; this.spec = spec; this.level = level;
        this.speed = spec.type === "bolt" ? 38 : 13 + level; this.dead = false; this.radius = 6 + level;
        this.height = 25;
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
        ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.beginPath(); ctx.ellipse(this.x, this.y, 5, 2.5, 0, 0, Math.PI*2); ctx.fill();
        ctx.save(); ctx.translate(this.x, this.y - this.height);
        ctx.shadowBlur = 15; ctx.shadowColor = this.spec.color; ctx.fillStyle = this.spec.color;
        
        if (this.spec.type === "stone") { ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.fill(); }
        else if (this.spec.type === "crystal") { ctx.rotate(Math.atan2(this.target.y - this.y, this.target.x - this.x)); ctx.beginPath(); ctx.moveTo(this.radius*2.5, 0); ctx.lineTo(-this.radius, -this.radius); ctx.lineTo(-this.radius, this.radius); ctx.fill(); }
        else if (this.spec.type === "bolt") { ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo((Math.random()-0.5)*50, (Math.random()-0.5)*50); ctx.stroke(); }
        else if (this.spec.type === "arrow") { ctx.rotate(Math.atan2(this.target.y - this.y, this.target.x - this.x)); ctx.fillStyle = "#fff"; ctx.fillRect(-this.radius*1.5, -1, this.radius*3, 2); ctx.fillStyle = this.spec.color; ctx.beginPath(); ctx.moveTo(this.radius*1.5, 0); ctx.lineTo(this.radius*1.5-6, -4); ctx.lineTo(this.radius*1.5-6, 4); ctx.fill(); }
        ctx.restore();
    }
}

class Enemy {
    constructor(level, typeKey) {
        const type = enemyTypes[typeKey]; this.typeKey = typeKey;
        this.maxHealth = (85 * Math.pow(1.38, level - 1)) * type.hp;
        this.health = this.maxHealth; this.baseSpeed = type.speed + (level * 0.02);
        this.speed = this.baseSpeed; this.pathIndex = 0; this.dead = false; this.radius = type.size;
        this.goldReward = Math.floor((35 + (level * 6)) * (typeKey === 'boss' ? 12 : 1));
        if (enemyPath && enemyPath.length > 0) { this.x = (enemyPath[0].x * gridSize) + gridSize/2; this.y = (enemyPath[0].y * gridSize) + gridSize/2; }
        else { this.x = 400; this.y = 0; }
        this.bobOffset = 0;
    }
    update() {
        if (!enemyPath || this.pathIndex >= enemyPath.length - 1) { lives -= (this.typeKey === 'boss' ? 12 : 1); updateStats(); this.dead = true; return; }
        const target = enemyPath[this.pathIndex + 1];
        const dx = target.x * gridSize + gridSize/2 - this.x, dy = target.y * gridSize + gridSize/2 - this.y, dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < this.speed) { this.pathIndex++; } else { this.x += (dx/dist) * this.speed; this.y += (dy/dist) * this.speed; }
        this.speed = this.baseSpeed;
        this.bobOffset = Math.sin(Date.now() * 0.012) * 6;
    }
    draw() {
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.beginPath(); ctx.ellipse(this.x, this.y, this.radius * 1.3, this.radius * 0.6, 0, 0, Math.PI*2); ctx.fill();
        ctx.save(); ctx.translate(this.x, this.y - 18 + this.bobOffset);
        
        const type = enemyTypes[this.typeKey];
        if (type.img && type.img.complete) {
            ctx.shadowBlur = 15; ctx.shadowColor = type.color;
            ctx.drawImage(type.img, -this.radius, -this.radius, this.radius*2, this.radius*2);
        } else {
            ctx.fillStyle = type.color; ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "white"; ctx.font = `${this.radius * 1.4}px Arial`; ctx.textAlign = "center";
            ctx.fillText(type.icon, 0, this.radius * 0.4);
        }
        
        const bw = this.radius * 2.4, bh = (this.typeKey === 'boss' ? 10 : 5);
        ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(-bw/2, -this.radius - 18, bw, bh);
        ctx.fillStyle = (this.typeKey === 'boss' ? COLORS.gold : COLORS.fire);
        ctx.fillRect(-bw/2, -this.radius - 18, bw * (this.health/this.maxHealth), bh);
        ctx.restore();
    }
}

// --- 3. 유틸리티 함수 ---
function findPath(tempTowers = towers) {
    const start = { x: Math.floor(cols / 2), y: 0 };
    const queue = [[start]]; const visited = new Set([`${start.x},0`]);
    const blocked = new Set(tempTowers.map(t => `${Math.floor(t.x/gridSize)},${Math.floor(t.y/gridSize)}`));
    if (blocked.has(`${start.x},0`)) return null;
    while (queue.length > 0) {
        const path = queue.shift(), curr = path[path.length - 1];
        if (curr.y === rows - 1) return path;
        const neighbors = [{x:0,y:1},{x:1,y:0},{x:-1,y:0},{x:0,y:-1}];
        for (const d of neighbors) {
            const nx = curr.x + d.x, ny = curr.y + d.y, key = `${nx},${ny}`;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !blocked.has(key) && !visited.has(key)) {
                visited.add(key); queue.push([...path, {x:nx, y:ny}]);
            }
        }
    }
    return null;
}

function updateBuildButton() {
    const btn = document.getElementById('build-btn');
    if (pendingPos && selectedTowerType) {
        btn.style.display = 'block'; btn.textContent = `설치하기 (${towerData[selectedTowerType].baseCost}G)`;
    } else btn.style.display = 'none';
}

function updateStats() { goldDisplay.textContent = gold.toLocaleString(); livesDisplay.textContent = lives; if (lives <= 0) { alert("GAME OVER!"); localStorage.removeItem('heroDefenseSave'); location.reload(); } }

// --- 4. 오디오 시스템 ---
let audioCtx;
const lobbyBGM = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3');
const battleBGM = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');
lobbyBGM.loop = true; battleBGM.loop = true;
lobbyBGM.volume = 0.3; battleBGM.volume = 0.4;
let isMuted = false; let audioInitialized = false;

function initAudio() {
    if (audioInitialized) return; audioInitialized = true;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (!isMuted) lobbyBGM.play().catch(() => { audioInitialized = false; });
    } catch(e) { console.error("Audio initialization failed", e); }
}

function playSFX(type) {
    if (!audioCtx || isMuted) return;
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    switch(type) {
        case 'select': osc.frequency.setValueAtTime(800, now); gain.gain.setValueAtTime(0.1, now); osc.start(now); osc.stop(now + 0.1); break;
        case 'upgrade': osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(1000, now + 0.2); gain.gain.setValueAtTime(0.1, now); osc.start(now); osc.stop(now + 0.2); break;
        case 'sell': osc.frequency.setValueAtTime(600, now); gain.gain.setValueAtTime(0.1, now); osc.start(now); osc.stop(now + 0.1); break;
        default: osc.frequency.setValueAtTime(200, now); gain.gain.setValueAtTime(0.02, now); osc.start(now); osc.stop(now + 0.05);
    }
}

window.toggleMute = function() {
    isMuted = !isMuted;
    const btn = document.getElementById('mute-btn');
    if (isMuted) { lobbyBGM.pause(); battleBGM.pause(); btn.textContent = "打 Music Off"; }
    else { if (waveActive) battleBGM.play(); else lobbyBGM.play(); btn.textContent = "🎵 Music On"; }
};

function switchMusic(isBattle) {
    if (isMuted) return;
    if (isBattle) { lobbyBGM.pause(); battleBGM.play(); }
    else { battleBGM.pause(); lobbyBGM.play(); }
}

// --- 5. UI 및 조작 핸들러 ---
window.selectTower = function(type) {
    initAudio(); playSFX('select');
    if (selectedTowerType === type) {
        selectedTowerType = null;
        document.querySelectorAll('.tower-card').forEach(card => card.classList.remove('selected'));
        pendingPos = null; updateBuildButton();
    } else {
        selectedTowerType = type; closeHeroMenu();
        document.querySelectorAll('.tower-card').forEach(card => {
            card.classList.remove('selected');
            if (card.innerText.includes(towerData[type].name.split(' ')[0])) card.classList.add('selected');
        });
    }
};

window.confirmBuild = function() {
    if (!pendingPos || !selectedTowerType) return;
    const cost = towerData[selectedTowerType].baseCost;
    if (gold >= cost) {
        const temp = [...towers, {x: pendingPos.x, y: pendingPos.y}], path = findPath(temp);
        if (path) {
            gold -= cost; towers.push({x: pendingPos.x, y: pendingPos.y, type: selectedTowerType, level: 0, lastShot: 0, invested: cost});
            enemyPath = path; updateStats(); playSFX('select'); pendingPos = null; selectedTowerType = null;
            document.querySelectorAll('.tower-card').forEach(card => card.classList.remove('selected'));
            updateBuildButton();
            saveGame();
        } else alert("길을 막을 수 없습니다!");
    } else alert("골드가 부족합니다!");
};

canvas.addEventListener('mousedown', (e) => {
    if (!gameStarted) return;
    initAudio();
    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / rect.width, scaleY = 600 / rect.height;
    const cx = (e.clientX - rect.left) * scaleX, cy = (e.clientY - rect.top) * scaleY;
    const gx = Math.floor(cx / gridSize) * gridSize, gy = Math.floor(cy / gridSize) * gridSize;
    const existing = towers.find(t => t.x === gx && t.y === gy);
    if (existing) {
        openHeroMenu(existing, e.clientX, e.clientY);
        selectedTowerObj = existing; selectedTowerType = null; pendingPos = null;
        document.querySelectorAll('.tower-card').forEach(card => card.classList.remove('selected'));
        updateBuildButton();
    } else {
        closeHeroMenu(); if (selectedTowerType) { pendingPos = {x: gx, y: gy}; updateBuildButton(); }
    }
});

function openHeroMenu(hero, clientX, clientY) {
    const menu = document.getElementById('hero-menu'); menu.style.display = 'flex';
    menu.style.left = `${clientX - 24}px`; menu.style.top = `${clientY - 110}px`;
    document.getElementById('menu-up-btn').style.display = hero.level >= 4 ? 'none' : 'flex';
}

function closeHeroMenu() { document.getElementById('hero-menu').style.display = 'none'; selectedTowerObj = null; }

window.handleMenuAction = function(action) {
    if (!selectedTowerObj) return;
    if (action === 'upgrade') {
        const cost = Math.floor(towerData[selectedTowerObj.type].baseCost * Math.pow(1.8, selectedTowerObj.level + 1));
        if (gold >= cost) { gold -= cost; selectedTowerObj.level++; selectedTowerObj.invested += cost; updateStats(); playSFX('upgrade'); closeHeroMenu(); saveGame(); }
        else alert("골드가 부족합니다!");
    } else if (action === 'sell') {
        gold += Math.floor(selectedTowerObj.invested * 0.5);
        towers = towers.filter(t => t !== selectedTowerObj);
        enemyPath = findPath(); updateStats(); playSFX('sell'); closeHeroMenu(); saveGame();
    }
};

window.startWave = function() {
    initAudio(); if (waveActive || spawning) return;
    const path = findPath(); if (!path) return alert("입구가 막혔습니다!");
    enemyPath = path; waveActive = true; spawning = true;
    document.getElementById('wave-start').disabled = true;
    waveDisplay.textContent = `WAVE ${waveLevel}`; switchMusic(true);
    let et = waveLevel % 5 === 0 ? 'boss' : (waveLevel > 10 ? 'ogre' : 'orc');
    let count = 0, total = 12 + waveLevel * 2;
    const iv = setInterval(() => {
        enemies.push(new Enemy(waveLevel, et));
        if (++count >= total) { clearInterval(iv); spawning = false; }
    }, 500); waveLevel++;
    saveGame();
};

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / rect.width, scaleY = 600 / rect.height;
    mousePos.x = (e.clientX - rect.left) * scaleX; mousePos.y = (e.clientY - rect.top) * scaleY;
});

// --- 6. 렌더링 및 루프 ---
function drawHero(t, now, isPreview = false) {
    const spec = towerData[t.type], lv = t.level, tx = t.x + 20, ty = t.y + 20;
    ctx.save(); ctx.translate(tx, ty); if (isPreview) ctx.globalAlpha = 0.5;

    // 2.5D 그림자 및 받침대
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.beginPath(); ctx.ellipse(0, 8, 22, 11, 0, 0, Math.PI*2); ctx.fill();
    const grad = ctx.createLinearGradient(-18, 0, 18, 10); grad.addColorStop(0, "#1e293b"); grad.addColorStop(1, "#334155");
    ctx.fillStyle = grad; ctx.beginPath(); ctx.ellipse(0, 6, 20, 10, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#475569"; ctx.beginPath(); ctx.ellipse(0, 3, 20, 10, 0, 0, Math.PI*2); ctx.fill();

    // 영웅 본체
    const heightOffset = -30 - (lv * 3);
    ctx.save(); ctx.translate(0, heightOffset);
    if (selectedTowerObj === t) { 
        ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 3; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
    }
    
    // 마법 아우라
    const auraSize = 25 + lv * 5;
    const auraGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, auraSize);
    auraGrad.addColorStop(0, spec.color + "66"); auraGrad.addColorStop(1, "transparent");
    ctx.fillStyle = auraGrad; ctx.beginPath(); ctx.arc(0, 0, auraSize, 0, Math.PI*2); ctx.fill();

    if (spec.img && spec.img.complete) {
        ctx.shadowBlur = 20; ctx.shadowColor = spec.color;
        ctx.drawImage(spec.img, -22, -22, 44, 44);
    } else {
        ctx.fillStyle = spec.color; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "white"; ctx.font = "24px Arial"; ctx.textAlign = "center"; ctx.fillText(spec.icon, 0, 8);
    }
    
    // 레벨 뱃지
    ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.beginPath(); ctx.arc(15, 15, 10, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = COLORS.gold; ctx.font = "bold 10px Arial"; ctx.textAlign = "center"; ctx.fillText(`L${lv+1}`, 15, 18);
    ctx.restore();

    if (isPreview || selectedTowerObj === t) {
        const range = spec.levels[lv].range;
        ctx.strokeStyle = spec.color + "66"; ctx.lineWidth = 2; ctx.setLineDash([10, 5]);
        ctx.beginPath(); ctx.arc(0, 0, range, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = spec.color + "11"; ctx.fill(); ctx.setLineDash([]);
    }
    ctx.restore();
}

function gameLoop() {
    frameCount++; const now = Date.now(); ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!gameStarted) { requestAnimationFrame(gameLoop); return; }
    
    // 격자 배경
    ctx.strokeStyle = "rgba(56, 189, 248, 0.08)"; ctx.lineWidth = 1;
    for(let i=0; i<=cols; i++) { ctx.beginPath(); ctx.moveTo(i*gridSize, 0); ctx.lineTo(i*gridSize, 600); ctx.stroke(); }
    for(let i=0; i<=rows; i++) { ctx.beginPath(); ctx.moveTo(0, i*gridSize); ctx.lineTo(800, i*gridSize); ctx.stroke(); }

    if (enemyPath) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.05)";
        enemyPath.forEach(p => ctx.fillRect(p.x * gridSize + 1, p.y * gridSize + 1, gridSize - 2, gridSize - 2));
    }

    if (pendingPos && selectedTowerType) drawHero({x: pendingPos.x, y: pendingPos.y, type: selectedTowerType, level: 0}, now, true);
    
    enemies.forEach(e => e.update()); enemies = enemies.filter(e => !e.dead); enemies.forEach(e => e.draw());
    projectiles.forEach(p => p.update()); projectiles = projectiles.filter(p => !p.dead); projectiles.forEach(p => p.draw());
    
    if (waveActive && !spawning && enemies.length === 0) { waveActive = false; document.getElementById('wave-start').disabled = false; switchMusic(false); saveGame(); }
    
    towers.forEach(t => {
        drawHero(t, now); const lvSpec = towerData[t.type].levels[t.level];
        if (now - t.lastShot > lvSpec.attackSpeed) {
            const target = enemies.find(e => Math.sqrt(Math.pow(e.x-(t.x+20),2)+Math.pow(e.y-(t.y+20),2)) <= lvSpec.range);
            if (target) { projectiles.push(new Projectile(t.x+20, t.y+20, target, towerData[t.type], t.level)); t.lastShot = now; playSFX(t.type); }
        }
    });
    requestAnimationFrame(gameLoop);
}

// --- 7. 저장 및 불러오기 기능 ---
function saveGame() {
    const saveData = {
        gold, lives, waveLevel, towers: towers.map(t => ({ x: t.x, y: t.y, type: t.type, level: t.level, invested: t.invested }))
    };
    localStorage.setItem('heroDefenseSave', JSON.stringify(saveData));
    checkSaveData();
}

function loadGame() {
    const dataString = localStorage.getItem('heroDefenseSave');
    if (!dataString) return;
    const data = JSON.parse(dataString);
    gold = data.gold; lives = data.lives; waveLevel = data.waveLevel;
    towers = data.towers.map(t => ({ ...t, lastShot: 0 }));
    enemyPath = findPath();
    updateStats();
    waveDisplay.textContent = `WAVE ${waveLevel}`;
}

function checkSaveData() {
    const btn = document.getElementById('continue-btn');
    if (localStorage.getItem('heroDefenseSave')) { if(btn) btn.style.display = 'block'; }
    else { if(btn) btn.style.display = 'none'; }
}

window.startGame = function(isContinue) {
    if (!isContinue) {
        gold = 1000; lives = 20; waveLevel = 1; towers = [];
        localStorage.removeItem('heroDefenseSave');
    } else {
        loadGame();
    }
    
    const homeScreen = document.getElementById('home-screen');
    const gameView = document.getElementById('game-view');
    if (homeScreen) homeScreen.classList.add('hidden');
    if (gameView) gameView.classList.add('visible');
    
    initAudio();
    gameStarted = true;
};

window.goHome = function() {
    saveGame();
    const homeScreen = document.getElementById('home-screen');
    const gameView = document.getElementById('game-view');
    if (homeScreen) homeScreen.classList.remove('hidden');
    if (gameView) gameView.classList.remove('visible');
    gameStarted = false;
    if (battleBGM) battleBGM.pause(); 
    if (lobbyBGM) lobbyBGM.pause(); 
    audioInitialized = false;
};

// UI 초기화
document.addEventListener('DOMContentLoaded', () => {
    const uiPanel = document.getElementById('ui-panel');
    if (uiPanel) {
        const homeBtn = document.createElement('button');
        homeBtn.id = 'home-btn';
        homeBtn.className = 'action-btn';
        homeBtn.textContent = 'EXIT TO HOME';
        homeBtn.onclick = goHome;
        uiPanel.appendChild(homeBtn);
    }
    checkSaveData();
});

enemyPath = findPath();
updateStats();
gameLoop();

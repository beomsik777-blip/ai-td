const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const goldDisplay = document.getElementById('gold');
const livesDisplay = document.getElementById('lives');

// Game Configuration
const gridSize = 40;
const cols = canvas.width / gridSize;
const rows = canvas.height / gridSize;

// Game State
let gold = 1000;
let lives = 20;
let selectedTowerType = null;
let towers = [];
let enemies = [];
let enemyPath = [];
let waveActive = false;
let spawning = false;
let frameCount = 0;
let waveLevel = 1;

// Tower Data
const towerData = {
    fire: { name: "불 (Fire)", icon: "🔥", baseCost: 100, color: "#ef4444", levels: [
        { damage: 15, range: 120, attackSpeed: 800 },
        { damage: 35, range: 130, attackSpeed: 750 },
        { damage: 70, range: 140, attackSpeed: 700 },
        { damage: 150, range: 150, attackSpeed: 650 },
        { damage: 400, range: 170, attackSpeed: 500 }
    ]},
    ice: { name: "얼음 (Ice)", icon: "❄️", baseCost: 120, color: "#38bdf8", levels: [
        { damage: 5, range: 100, attackSpeed: 1000, slow: 0.3 },
        { damage: 15, range: 110, attackSpeed: 950, slow: 0.4 },
        { damage: 30, range: 120, attackSpeed: 900, slow: 0.5 },
        { damage: 60, range: 130, attackSpeed: 850, slow: 0.6 },
        { damage: 150, range: 150, attackSpeed: 700, slow: 0.8 }
    ]},
    earth: { name: "땅 (Earth)", icon: "⛰️", baseCost: 150, color: "#a8a29e", levels: [
        { damage: 30, range: 100, attackSpeed: 1500 },
        { damage: 80, range: 110, attackSpeed: 1400 },
        { damage: 180, range: 120, attackSpeed: 1300 },
        { damage: 400, range: 130, attackSpeed: 1200 },
        { damage: 1000, range: 150, attackSpeed: 1000 }
    ]},
    electric: { name: "전기 (Electric)", icon: "⚡", baseCost: 130, color: "#fbbf24", levels: [
        { damage: 10, range: 160, attackSpeed: 400 },
        { damage: 25, range: 170, attackSpeed: 350 },
        { damage: 60, range: 180, attackSpeed: 300 },
        { damage: 130, range: 190, attackSpeed: 250 },
        { damage: 350, range: 220, attackSpeed: 150 }
    ]}
};

// Enemy Class
class Enemy {
    constructor(level) {
        this.maxHealth = 50 * Math.pow(1.25, level - 1);
        this.health = this.maxHealth;
        this.baseSpeed = 1.2 + (level * 0.05);
        this.speed = this.baseSpeed;
        this.pathIndex = 0;
        this.dead = false;
        
        if (enemyPath && enemyPath.length > 0) {
            this.x = enemyPath[0].x * gridSize + gridSize / 2;
            this.y = enemyPath[0].y * gridSize + gridSize / 2;
        } else {
            this.x = (cols / 2) * gridSize + gridSize / 2;
            this.y = 0;
        }
        this.goldReward = 15 + (level * 2);
    }

    update() {
        if (!enemyPath || this.pathIndex >= enemyPath.length - 1) {
            lives--;
            updateStats();
            this.dead = true;
            return;
        }

        const target = enemyPath[this.pathIndex + 1];
        const targetX = target.x * gridSize + gridSize / 2;
        const targetY = target.y * gridSize + gridSize / 2;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
            this.x = targetX;
            this.y = targetY;
            this.pathIndex++;
        } else {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
        
        // Reset speed for next frame (slow effects applied in update)
        this.speed = this.baseSpeed;
    }

    draw() {
        ctx.fillStyle = "#f43f5e";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        const barWidth = 30;
        ctx.fillStyle = "#334155";
        ctx.fillRect(this.x - barWidth/2, this.y - 22, barWidth, 5);
        ctx.fillStyle = "#10b981";
        ctx.fillRect(this.x - barWidth/2, this.y - 22, barWidth * (this.health / this.maxHealth), 5);
    }
}

// BFS Pathfinding
function findPath(tempTowers = towers) {
    const start = { x: Math.floor(cols / 2), y: 0 };
    const endY = rows - 1;
    const queue = [[start]];
    const visited = new Set();
    visited.add(`${start.x},${start.y}`);

    const blockedCoords = new Set(tempTowers.map(t => `${Math.floor(t.x / gridSize)},${Math.floor(t.y / gridSize)}`));

    while (queue.length > 0) {
        const path = queue.shift();
        const current = path[path.length - 1];

        if (current.y === endY) return path;

        const neighbors = [
            { x: current.x, y: current.y + 1 },
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y - 1 }
        ];

        for (const n of neighbors) {
            const key = `${n.x},${n.y}`;
            if (n.x >= 0 && n.x < cols && n.y >= 0 && n.y < rows && !blockedCoords.has(key) && !visited.has(key)) {
                visited.add(key);
                queue.push([...path, n]);
            }
        }
    }
    return null;
}

// UI Controllers
window.selectTower = function(type) {
    selectedTowerType = type;
    document.querySelectorAll('.tower-card').forEach(card => {
        card.classList.remove('selected');
        if (card.innerText.includes(towerData[type].name.split(' ')[0])) {
            card.classList.add('selected');
        }
    });
};

window.startWave = function() {
    if (waveActive || spawning) return;
    
    enemyPath = findPath(); // Ensure path exists
    if (!enemyPath) return alert("적의 이동 경로가 없습니다! 타워 배치를 확인하세요.");

    waveActive = true;
    spawning = true;
    let count = 0;
    const maxCount = 10 + waveLevel * 2;
    
    const interval = setInterval(() => {
        enemies.push(new Enemy(waveLevel));
        count++;
        if (count >= maxCount) {
            clearInterval(interval);
            spawning = false;
        }
    }, 800);
    
    waveLevel++;
    console.log(`Wave ${waveLevel - 1} Started!`);
};

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / gridSize) * gridSize;
    const y = Math.floor((e.clientY - rect.top) / gridSize) * gridSize;

    const existing = towers.find(t => t.x === x && t.y === y);
    if (existing) {
        upgradeTower(existing);
    } else if (selectedTowerType) {
        placeTower(x, y, selectedTowerType);
    }
});

function placeTower(x, y, type) {
    const data = towerData[type];
    if (gold < data.baseCost) return alert("골드가 부족합니다!");

    // Check path blocking
    const tempTowers = [...towers, { x, y }];
    const newPath = findPath(tempTowers);
    if (!newPath) return alert("길을 완전히 막을 수 없습니다!");

    gold -= data.baseCost;
    towers.push({ x, y, type, level: 0, lastShot: 0 });
    enemyPath = newPath;
    updateStats();
}

function upgradeTower(tower) {
    if (tower.level >= 4) return alert("최고 레벨입니다!");
    const cost = Math.floor(towerData[tower.type].baseCost * Math.pow(1.6, tower.level + 1));
    if (gold < cost) return alert("골드가 부족합니다!");

    gold -= cost;
    tower.level++;
    updateStats();
}

function updateStats() {
    goldDisplay.textContent = gold.toLocaleString();
    livesDisplay.textContent = lives;
    if (lives <= 0) {
        alert("GAME OVER!");
        location.reload();
    }
}

// Game Loop
function gameLoop() {
    frameCount++;
    
    // Update Enemies
    enemies.forEach(e => e.update());
    enemies = enemies.filter(e => !e.dead);
    
    if (waveActive && !spawning && enemies.length === 0) {
        waveActive = false;
        console.log("Wave Cleared!");
    }

    // Update Towers (Attack)
    towers.forEach(tower => {
        const spec = towerData[tower.type];
        const levelSpec = spec.levels[tower.level];
        
        const now = Date.now();
        if (now - tower.lastShot > levelSpec.attackSpeed) {
            // Find target
            const target = enemies.find(e => {
                const d = Math.sqrt(Math.pow(e.x - (tower.x + gridSize/2), 2) + Math.pow(e.y - (tower.y + gridSize/2), 2));
                return d <= levelSpec.range;
            });

            if (target) {
                target.health -= levelSpec.damage;
                if (levelSpec.slow) {
                    target.speed *= (1 - levelSpec.slow);
                }
                tower.lastShot = now;
                
                // Attack effect (Laser/Bullet)
                tower.targetPos = { x: target.x, y: target.y, time: now };
                
                if (target.health <= 0) {
                    gold += target.goldReward;
                    target.dead = true;
                    updateStats();
                }
            }
        }
    });

    render();
    requestAnimationFrame(gameLoop);
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= cols; i++) { ctx.beginPath(); ctx.moveTo(i * gridSize, 0); ctx.lineTo(i * gridSize, canvas.height); ctx.stroke(); }
    for (let i = 0; i <= rows; i++) { ctx.beginPath(); ctx.moveTo(0, i * gridSize); ctx.lineTo(canvas.width, i * gridSize); ctx.stroke(); }

    // Path
    if (enemyPath) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        enemyPath.forEach((p, i) => {
            const px = p.x * gridSize + gridSize/2;
            const py = p.y * gridSize + gridSize/2;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.stroke();
    }

    // Towers
    towers.forEach(t => {
        const spec = towerData[t.type];
        ctx.fillStyle = spec.color;
        ctx.shadowBlur = 15; ctx.shadowColor = spec.color;
        ctx.fillRect(t.x + 4, t.y + 4, gridSize - 8, gridSize - 8);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = "white"; ctx.font = "bold 12px Arial"; ctx.textAlign = "center";
        ctx.fillText(`Lv.${t.level + 1}`, t.x + gridSize/2, t.y + gridSize - 6);
        ctx.font = "20px Arial"; ctx.fillText(spec.icon, t.x + gridSize/2, t.y + gridSize/2 + 6);

        // Draw attack line
        if (t.targetPos && Date.now() - t.targetPos.time < 100) {
            ctx.strokeStyle = spec.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(t.x + gridSize/2, t.y + gridSize/2);
            ctx.lineTo(t.targetPos.x, t.targetPos.y);
            ctx.stroke();
        }
    });

    // Enemies
    enemies.forEach(e => e.draw());

    if (!waveActive && !spawning) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "22px Arial";
        ctx.textAlign = "center";
        ctx.fillText("타워를 배치하고 WAVE START를 누르세요", canvas.width / 2, canvas.height / 2);
    }
}

// Init
enemyPath = findPath();
updateStats();
gameLoop();

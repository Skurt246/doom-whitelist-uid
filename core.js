(function() {
'use strict';

// =============== [ЭТАП 1: КРИТИЧЕСКИЕ ПЕРЕОПРЕДЕЛЕНИЯ — СРАЗУ] ===============
let myObjId = null, myPos = null, myVel = [0, 0], myClan = null, gameCanvas = null;
let lastAimAngle = 0, lastAimTime = 0, lastHitTime = 0;
const players = new Map();
const HIT_COOLDOWN = 80;
const ARROW_OFFSET = 58, ARROW_LEN = 18, ARROW_WIDTH = 22;
let arrowCanvas = null, arrowCtx = null;
let clanSpamInterval = null;
let fpsEl = null, targetDisplay = null, notifContainer = null;

// WebSocket перехват — ДО ВСЕГО
const OriginalWS = window.WebSocket;
window.WebSocket = function(...args) {
    const ws = new OriginalWS(...args);
    ws.addEventListener('message', e => {
        try {
            const d = new Uint8Array(e.data);
            const decoded = msgpack.decode(d);
            if (decoded.header === 'update') {
                const ud = decoded.user_data;
                if (ud?.user_obj_id) myObjId = ud.user_obj_id;
                if ("clan_name" in ud) myClan = ud.clan_name;
                const ups = decoded.entity_updates;
                if (ups) {
                    for (const [objId, obj] of Object.entries(ups)) {
                        const id = String(objId);
                        const pos = obj.position;
                        const user = obj.user;
                        const vel = obj.velocity;
                        if (pos && Array.isArray(pos) && pos.length === 2) {
                            if (id === String(myObjId) && user?.username) {
                                myPos = [...pos];
                                myVel = Array.isArray(vel) ? vel : [0, 0];
                                if (user.clanName) myClan = user.clanName;
                                continue;
                            }
                            if (user?.username) {
                                players.set(id, {
                                    nick: user.username,
                                    pos: [...pos],
                                    vel: Array.isArray(vel) ? vel : [0, 0],
                                    time: Date.now(),
                                    user: user
                                });
                            }
                        }
                    }
                }
            }
        } catch (err) {}
    });
    return ws;
};
for (const prop in OriginalWS) {
    if (OriginalWS.hasOwnProperty(prop)) window.WebSocket[prop] = OriginalWS[prop];
}
window.WebSocket.prototype = OriginalWS.prototype;

// =============== [ЭТАП 2: ФУНКЦИИ — БЕЗ ЗАВИСИМОСТЕЙ ОТ DOM] ===============
const features = {
    aimbot: { enabled: false, bind: null, autoShot: true, minDist: 0.5, maxDist: 2.7, predictionMode: 'auto', latencyComp: 0.05, velocityBoost: 1.0, overshoot: 0.4, falloffFactor: 1.0, name: "Aim Bot v7.4" },
    arrows: { enabled: false, bind: null, ignoreTeam: false, name: "Team Arrows" },
    showfps: { enabled: true, bind: null, name: "Show FPS" },
    autocraft: { enabled: false, bind: null, category: 'Shields', item: 'shield_wood', name: "AutoCraft" },
    crosshair: { enabled: false, bind: null, name: "Crosshair" },
    clanspam: { enabled: false, bind: null, speed: 100, name: "Clan Spam" }
};

// Все вспомогательные функции (isPlayer, isTeammate, findAllEnemies...) — без изменений от оригинала
function isPlayer(nick) {
    if (!nick || typeof nick !== 'string') return false;
    const n = nick.toLowerCase();
    const blacklist = ['wolf', 'bear', 'zombie', 'dragon', 'goblin', 'skeleton', 'spike', 'cactus', 'tree', 'rock', 'bush'];
    return nick.length >= 1 && nick.length <= 20 && !blacklist.some(b => n.includes(b));
}
function isTeammate(userObj) {
    if (!userObj || typeof userObj.clanName !== 'string' || !myClan) return false;
    if (userObj.clanName.trim() === "" || myClan.trim() === "") return false;
    return userObj.clanName === myClan;
}
function findAllEnemies() {
    if (!myPos) return [];
    const res = [];
    for (const [id, p] of players) {
        if (Date.now() - p.time > 2000) players.delete(id);
        else if (p.pos && p.nick && id !== String(myObjId) && isPlayer(p.nick)) {
            if (p.user?.hp <= 0) continue;
            const dist = Math.hypot(p.pos[0] - myPos[0], p.pos[1] - myPos[1]);
            let teammate = p.user && isTeammate(p.user);
            res.push({ pos: [...p.pos], vel: p.vel || [0, 0], nick: p.nick, dist, teammate, user: p.user });
        }
    }
    return res.sort((a, b) => a.dist - b.dist);
}
function findNearestEnemy() {
    return findAllEnemies().filter(e => !e.teammate)[0] || null;
}
const interiumSeq = ["I", "In", "Int", "Inte", "Inter", "Interi", "Interiu", "Interium", "Interiu", "Interi", "Inter", "Inte", "Int", "In", "I"];
let spamIndex = 0;
function startClanSpam() {
    const input = document.getElementById('input_clan_name');
    const createBtn = document.getElementById('create_join_clan_button');
    const leaveBtn = document.getElementById('leave_clan_button');
    if (!input || !createBtn || !leaveBtn) return;
    clanSpamInterval = setInterval(() => {
        input.value = interiumSeq[spamIndex];
        createBtn.click();
        setTimeout(() => leaveBtn.click(), features.clanspam.speed / 2);
        spamIndex = (spamIndex + 1) % interiumSeq.length;
    }, features.clanspam.speed);
}
function stopClanSpam() {
    if (clanSpamInterval) clearInterval(clanSpamInterval);
    clanSpamInterval = null;
}
function toggleClanSpam() {
    features.clanspam.enabled ? startClanSpam() : stopClanSpam();
}
function setupArrowCanvas() {
    if (!arrowCanvas) {
        arrowCanvas = document.createElement('canvas');
        Object.assign(arrowCanvas.style, {
            position: 'fixed',
            left: 0,
            top: 0,
            pointerEvents: 'none',
            zIndex: 999998
        });
        document.body.appendChild(arrowCanvas);
        arrowCtx = arrowCanvas.getContext('2d');
    }
    arrowCanvas.width = innerWidth;
    arrowCanvas.height = innerHeight;
}
function drawGlowArrow(cx, cy, angle, dist, nick, color) {
    if (!arrowCtx) return;
    const baseX = cx + Math.cos(angle) * ARROW_OFFSET;
    const baseY = cy + Math.sin(angle) * ARROW_OFFSET;
    const tipX = baseX + Math.cos(angle) * ARROW_LEN;
    const tipY = baseY + Math.sin(angle) * ARROW_LEN;
    const leftX = baseX + Math.cos(angle + Math.PI * 0.75) * (ARROW_WIDTH / 2);
    const leftY = baseY + Math.sin(angle + Math.PI * 0.75) * (ARROW_WIDTH / 2);
    const rightX = baseX + Math.cos(angle - Math.PI * 0.75) * (ARROW_WIDTH / 2);
    const rightY = baseY + Math.sin(angle - Math.PI * 0.75) * (ARROW_WIDTH / 2);
    let fill, glow, textBg;
    if (color === "#ff3366") {
        fill = "#ff3141";
        glow = "#ff0a54";
        textBg = "#ff2233dd";
    } else {
        fill = "#1a5fb4";
        glow = "#0a4a9a";
        textBg = "#1a5fb4dd";
    }
    arrowCtx.save();
    arrowCtx.globalAlpha = 0.48;
    arrowCtx.shadowColor = glow;
    arrowCtx.shadowBlur = 26;
    arrowCtx.beginPath();
    arrowCtx.moveTo(tipX, tipY);
    arrowCtx.lineTo(leftX, leftY);
    arrowCtx.lineTo(rightX, rightY);
    arrowCtx.closePath();
    arrowCtx.fillStyle = glow;
    arrowCtx.fill();
    arrowCtx.globalAlpha = 0.94;
    arrowCtx.shadowBlur = 0;
    arrowCtx.fillStyle = fill;
    arrowCtx.beginPath();
    arrowCtx.moveTo(tipX, tipY);
    arrowCtx.lineTo(leftX, leftY);
    arrowCtx.lineTo(rightX, rightY);
    arrowCtx.closePath();
    arrowCtx.fill();
    arrowCtx.strokeStyle = "#000";
    arrowCtx.lineWidth = 1.4;
    arrowCtx.lineJoin = "round";
    arrowCtx.stroke();
    arrowCtx.font = 'bold 13px Roboto Mono';
    arrowCtx.textAlign = 'center';
    arrowCtx.fillStyle = '#fff';
    arrowCtx.shadowColor = glow;
    arrowCtx.shadowBlur = 8;
    arrowCtx.fillText(`${Math.round(dist)}m`, baseX, baseY - 12);
    const baseFontSize = 12;
    const fontSize = Math.max(9, baseFontSize * 0.8);
    arrowCtx.font = `bold ${fontSize}px Orbitron`;
    const nickW = arrowCtx.measureText(nick).width;
    const pad = 8 * 0.8;
    const w = Math.max(48 * 0.8, nickW + pad * 2);
    const h = 18 * 0.8;
    const rectX = baseX - w / 2;
    const rectY = baseY + 12 + 4;
    arrowCtx.fillStyle = textBg;
    arrowCtx.beginPath();
    arrowCtx.roundRect(rectX, rectY, w, h, 4);
    arrowCtx.fill();
    arrowCtx.strokeStyle = "#000";
    arrowCtx.lineWidth = 1.1;
    arrowCtx.stroke();
    arrowCtx.fillStyle = "#fff";
    arrowCtx.shadowBlur = 0;
    arrowCtx.textBaseline = "middle";
    arrowCtx.fillText(nick, baseX, rectY + h / 2 + 0.5);
    arrowCtx.restore();
}
function drawAllArrows(cx, cy, enemies) {
    if (!arrowCtx) return;
    arrowCtx.clearRect(0, 0, arrowCanvas.width, arrowCanvas.height);
    enemies.forEach(e => {
        const color = e.teammate ? "#45b4ff" : "#ff3366";
        drawGlowArrow(cx, cy, Math.atan2(e.pos[1] - myPos[1], e.pos[0] - myPos[0]), e.dist, e.nick, color);
    });
}
function estimateBoltSpeed(d) {
    if (d > 15) return 31.1;
    if (d > 10) return 32.3;
    if (d > 5) return 33.4;
    return 30.9;
}
function aimAndShoot(enemy) {
    if (!gameCanvas || !myPos || !enemy || !features.aimbot.enabled) return;
    const rect = gameCanvas.getBoundingClientRect();
    const scale = (rect.width + rect.height) / 45;
    const cameraX = -(myPos[0] * scale - rect.width / 2);
    const cameraY = -(myPos[1] * scale - rect.height / 2);
    const dx = enemy.pos[0] - myPos[0];
    const dy = enemy.pos[1] - myPos[1];
    const dist = Math.hypot(dx, dy);
    const boltSpeed = estimateBoltSpeed(dist);
    const enemySpeed = Math.hypot(...enemy.vel || [0, 0]);
    const mySpeed = Math.hypot(...myVel || [0, 0]);
    const walkSpeed = 4.76;
    const iJumping = mySpeed > walkSpeed + 0.5;
    const enemyJumping = enemySpeed > walkSpeed + 0.5;
    let latencyComp, velocityBoost, overshoot, falloffFactor;
    if (features.aimbot.predictionMode === 'custom') {
        latencyComp = features.aimbot.latencyComp;
        velocityBoost = features.aimbot.velocityBoost;
        overshoot = features.aimbot.overshoot;
        falloffFactor = features.aimbot.falloffFactor;
    } else {
        latencyComp = 0.05;
        velocityBoost = 1.0;
        overshoot = 0.4;
        falloffFactor = 1.0;
        if (enemyJumping && !iJumping) {
            velocityBoost = 1.3;
            latencyComp = 0.08;
            overshoot = 0.8;
            falloffFactor = 0.85;
        }
        if (iJumping && !enemyJumping) {
            latencyComp += 0.03;
            overshoot += 0.2;
        }
        if (iJumping && enemyJumping) {
            latencyComp += 0.05;
            velocityBoost *= 1.4;
            falloffFactor *= 0.8;
        }
        if (enemySpeed < 4.0) {
            velocityBoost *= 0.95;
            overshoot *= 0.85;
        }
    }
    const flightTime = dist / boltSpeed + latencyComp;
    const vx = enemy.vel?.[0] || 0;
    const vy = enemy.vel?.[1] || 0;
    const angle = Math.atan2(dy, dx);
    let tx = enemy.pos[0] + vx * flightTime * velocityBoost * falloffFactor + Math.cos(angle) * overshoot;
    let ty = enemy.pos[1] + vy * flightTime * velocityBoost * falloffFactor + Math.sin(angle) * overshoot;
    if (enemy.user?.jumpingKeyDown) ty += 0.3;
    const screenX = tx * scale + cameraX;
    const screenY = ty * scale + cameraY;
    gameCanvas.dispatchEvent(new MouseEvent('mousemove', {
        clientX: screenX,
        clientY: screenY,
        bubbles: true,
        cancelable: true,
        view: window
    }));
    if (features.aimbot.autoShot && dist >= features.aimbot.minDist && dist <= features.aimbot.maxDist) {
        const now = Date.now();
        if (now - lastHitTime > HIT_COOLDOWN) {
            lastHitTime = now;
            gameCanvas.dispatchEvent(new MouseEvent('mousedown', {
                button: 0, bubbles: true, clientX: screenX, clientY: screenY
            }));
            setTimeout(() => {
                gameCanvas.dispatchEvent(new MouseEvent('mouseup', {
                    button: 0, bubbles: true, clientX: screenX, clientY: screenY
                }));
            }, 40);
        }
    }
    if (targetDisplay) {
        targetDisplay.style.display = enemy.nick ? 'block' : 'none';
        targetDisplay.textContent = enemy.nick ? `Target: ${enemy.nick}` : '';
    }
}
function showNotification(text, type = 'info') {
    if (!notifContainer) return;
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `<div class="icon">${type === 'enabled' ? 'ON' : 'OFF'}</div><div>${text}</div>`;
    notifContainer.appendChild(notif);
    requestAnimationFrame(() => notif.classList.add('show'));
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 400);
    }, 1400);
}
function findCanvas() {
    gameCanvas = document.querySelector('canvas');
}
function mainLoop() {
    findCanvas();
    const enemies = findAllEnemies();
    const nearest = findNearestEnemy();
    if (features.arrows.enabled && myPos && gameCanvas) {
        setupArrowCanvas();
        const rect = gameCanvas.getBoundingClientRect();
        const filteredEnemies = features.arrows.ignoreTeam ? enemies.filter(e => !e.teammate) : enemies;
        drawAllArrows(rect.left + rect.width / 2, rect.top + rect.height / 2, filteredEnemies);
    } else if (arrowCtx) {
        arrowCtx.clearRect(0, 0, arrowCanvas.width, arrowCanvas.height);
    }
    if (myPos && nearest && features.aimbot.enabled) {
        aimAndShoot(nearest);
    } else if (targetDisplay) {
        targetDisplay.style.display = 'none';
    }
    requestAnimationFrame(mainLoop);
}
let lastTime = performance.now();
let frameCount = 0;
function updateFPS() {
    const now = performance.now();
    frameCount++;
    if (now - lastTime >= 1000) {
        const fps = Math.round(frameCount * 1000 / (now - lastTime));
        frameCount = 0;
        lastTime = now;
        if (fpsEl) fpsEl.textContent = `FPS: ${fps}`;
    }
    requestAnimationFrame(updateFPS);
}

// =============== [ЭТАП 3: СОЗДАНИЕ UI — ТОЛЬКО ПОСЛЕ ПОЛНОЙ ЗАГРУЗКИ DOM] ===============
function createUI() {
    // Удаляем остатки loader'а
    const loader = document.getElementById('interium-loader');
    if (loader) loader.remove();
    const loaderStyle = document.getElementById('interium-bw-style');
    if (loaderStyle) loaderStyle.remove();

    // Стили
    const style = document.createElement("style");
    style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Montserrat:wght@500;600;700&display=swap');
:root {
--dark-bg: #101a27;
--panel-glow: 0 0 38px #24e9ffc4, 0 0 24px #3367ff3c, 0 0 22px #131d40 inset;
--option-glow: 0 0 16px #24e9ff63;
--setting-glow: 0 0 32px #3ae9ff9c;
--gear-glow: 0 0 12px #36bfff, 0 0 20px #24e9ff inset;
--green-status: #00ff88;
--blue-team: #45b4ff;
--red-enemy: #ff3366;
}
#overlay {
position: fixed; top: 0; left: 0; right: 0; bottom: 0;
background: rgba(10, 15, 30, 0.92); backdrop-filter: blur(6px);
z-index: 9999998; opacity: 0; pointer-events: none; transition: opacity 0.5s ease;
}
#overlay.show { opacity: 1; pointer-events: all; }
.int2-panel {
width: 820px; height: 480px; background: linear-gradient(105deg, #111a28 0%, #112040 100%);
color: #eafdff; border-radius: 18px; position: fixed; left: 55px; top: 53px;
overflow: hidden; z-index: 99999; box-shadow: var(--panel-glow); display: none;
flex-direction: column; font-family: "Montserrat", monospace;
animation: panelPulse 4s infinite alternate; transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
opacity: 0; transform: scale(0.97);
}
.int2-panel.show { opacity: 1; transform: scale(1); }
@keyframes panelPulse {
0% { box-shadow: var(--panel-glow); }
100% { box-shadow: 0 0 44px #24e9ff, 0 0 28px #3367ff4c, 0 0 28px #131d40 inset; }
}
.int2-header {
background: linear-gradient(90deg, #122642 0%, #153054 90%); border-bottom: 2px solid #26e9fb;
border-radius: 18px 18px 0 0; height: 44px; display: flex; align-items: center;
gap: 14px; padding: 0 16px; cursor: grab; user-select: none; font-weight: 900;
font-size: 1.15rem; letter-spacing: .08em; box-shadow: 0 0 20px rgba(36, 191, 255, 0.4);
position: relative; overflow: hidden;
}
.int2-header::after {
content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
animation: headerShine 5s infinite;
}
@keyframes headerShine {
0% { transform: translateX(-100%) translateY(-100%) rotate(30deg); }
100% { transform: translateX(100%) translateY(100%) rotate(30deg); }
}
.int2-eye { width: 32px; height: 32px; filter: drop-shadow(0 0 6px #36bfff88); }
.int2-title {
background: linear-gradient(90deg, #36ddff, #fff, #00aaff 78%);
-webkit-background-clip: text; -webkit-text-fill-color: transparent;
font-family: 'Orbitron', monospace; font-size: 19px; line-height: 1.06;
text-shadow: 0 0 16px rgba(36, 221, 255, 0.8);
}
.int2-body { display: flex; flex: 1; min-height: 0; }
.int2-tabs {
width: 110px; background: #192a45 linear-gradient(180deg, #1a324f 0%, #151821 100%);
display: flex; flex-direction: column; align-items: center; gap: 16px;
border-right: 1.5px solid #1887b6; box-shadow: inset 0 0 14px #38b4ec25;
padding: 20px 0 140px 0; position: relative; z-index: 10;
}
.int2-tab {
width: 88px; height: 44px; background: linear-gradient(140deg, #1a2c38, #223240 80%);
border: 1.5px solid #24e9ffbb; border-radius: 16px; display: flex;
align-items: center; justify-content: center; font-size: 1.35em; cursor: pointer;
position: relative; filter: drop-shadow(0 0 4px #24e9ff77); transition: all 0.3s ease;
box-shadow: 0 0 12px rgba(36, 233, 255, 0.3); z-index: 11; flex-direction: column; padding: 0 6px;
}
.int2-tab .tab-text {
font-size: 0.78em; font-weight: 700; letter-spacing: 0.5px;
color: #24e9ff; text-shadow: 0 0 6px #24e9ff; font-family: 'Orbitron', sans-serif;
}
.int2-tab:hover {
background: linear-gradient(120deg, #156d95, #142d3e 88%);
box-shadow: 0 0 28px #24e9ff, 0 0 20px #2196f32c; transform: translateY(-3px) scale(1.05);
}
.int2-tab.active {
background: linear-gradient(135deg, #3cd8ff, #2d4f6a 87%); border-color: #37fff6;
box-shadow: 0 0 32px #24e9ff, inset 0 0 18px rgba(255,255,255,0.2); transform: scale(1.08);
}
.int2-content {
flex: 1; padding: 18px 16px 12px 18px; overflow-y: auto; display: none;
background: linear-gradient(135deg, #202b3f 28%, #17284e 100%); position: relative; z-index: 1;
}
.int2-content.active { display: block; animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
.option2-block {
margin-bottom: 20px; background: linear-gradient(120deg, #253247 60%, #182634);
border-radius: 12px; box-shadow: var(--option-glow); padding: 14px 16px 12px 14px;
position: relative; border: 1px solid rgba(36, 233, 255, 0.3); transition: all 0.3s ease;
}
.option2-block:hover { transform: translateX(4px); box-shadow: 0 0 22px #24e9ff63; }
.opt-title2 { color: #57e7ff; font-size: 1.05em; margin-bottom: 5px; font-weight: 700; text-shadow: 0 0 8px #24e9ff; }
.opt-desc2 { color: #d8f0ff; font-size: .92em; margin-bottom: 8px; line-height: 1.4; text-shadow: 0 0 4px rgba(36, 233, 255, 0.3); }
.option-controls { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
.to2 {
width: 42px; height: 22px; background: #204a61; border-radius: 11px;
cursor: pointer; position: relative; box-shadow: inset 0 0 8px rgba(0,0,0,0.4); transition: background 0.3s;
}
.to2.active { background: linear-gradient(90deg, #24e9ff, #16dbea); box-shadow: 0 0 16px #24e9ff; }
.to2-knob {
width: 18px; height: 18px; background: #fff; border-radius: 50%;
position: absolute; left: 2px; top: 2px; transition: all 0.3s ease;
box-shadow: 0 0 10px rgba(36, 233, 255, 0.6);
}
.to2.active .to2-knob { left: 22px; box-shadow: 0 0 14px #24e9ff; }
.s2gear {
width: 22px; height: 22px;
background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="%2336bfff" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.42h-3.84c-.24 0-.43.18-.48.42l-.36 2.54c-.6.24-1.13.56-1.62.94l-2.39-.96a.488.488 0 0 0-.59.22l-1.92 3.32c-.15.25-.08-.56.12.61l2.03 1.58c-.05.3-.07.62-.07.94 0 .33.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.15.25.37.35.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.42.48.42h-3.84c.24 0 .43-.18.48-.42l-.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.09.44 0 .59-.22l1.92-3.32c.15-.25.08-.56-.12-.61l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>') center/contain no-repeat;
background-size: 22px; filter: drop-shadow(0 0 8px #3ee8fe); cursor: pointer;
transition: all 0.3s ease; position: relative;
}
.s2gear:hover { transform: rotate(60deg) scale(1.18); filter: drop-shadow(0 0 16px #24e9ff); box-shadow: var(--gear-glow); }
.settings-tab { display: none; background: linear-gradient(135deg, rgba(15,25,45,0.9), rgba(27,38,59,0.95)); border-radius: 12px; padding: 20px; margin: 16px 0; box-shadow: var(--setting-glow), inset 0 0 16px rgba(36, 233, 255, 0.15); border: 1px solid rgba(36, 233, 255, 0.5); }
.settings-tab.active { display: block; animation: fadeIn 0.3s ease; }
.settings-title { color: #80deea; font-size: 1.1em; margin-bottom: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.6px; text-shadow: 0 0 11px #24e9ff; }
.back-btn {
margin-top: 18px; width: 100%; padding: 11px; background: linear-gradient(90deg, #24e9ff, #16dbea);
border: none; border-radius: 9px; color: #133243; font-weight: 700; cursor: pointer;
box-shadow: 0 0 22px rgba(36, 233, 255, 0.7); transition: all 0.3s; font-size: 1em;
}
.back-btn:hover { transform: translateY(-2px); box-shadow: 0 0 32px #24e9ff; }
.user-panel {
position: absolute; bottom: 0; left: 0; width: 110px;
background: linear-gradient(180deg, #0f1a2b 0%, #0a1420 100%);
border-top: 1.5px solid #24e9ff66; padding: 14px 0 16px; text-align: center;
font-size: 0.82em; color: #b0e0ff; box-shadow: 0 -6px 16px rgba(36,233,255,0.2); z-index: 12;
}
.user-avatar {
width: 52px; height: 52px; background: #000; border: 1.5px solid #24e9ff;
border-radius: 14px; margin: 0 auto 10px; box-shadow: 0 0 20px #24e9ff66, inset 0 0 12px rgba(0,0,0,0.6);
position: relative; overflow: hidden;
}
.user-avatar::after {
content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
background: radial-gradient(circle at 30% 30%, rgba(36,233,255,0.3), transparent 60%);
}
.user-name { font-weight: 800; color: #24e9ff; text-shadow: 0 0 8px #24e9ff; letter-spacing: 0.6px; margin-bottom: 2px; }
.user-status { color: #00ff88; font-weight: 700; font-size: 0.9em; text-shadow: 0 0 6px #00ff88; }
#targetDisplay {
position: fixed; bottom: 24px; left: 25px; background: linear-gradient(85deg, #131414 50%, #222732 100%);
color: #45b4ff; border-radius: 9px; font-size: 18px; font-family: 'Orbitron', monospace;
font-weight: 700; padding: 7px 22px; z-index: 99999999; display: none;
pointer-events: none; box-shadow: 0 0 12px #45b4ff44; text-shadow: 0 0 10px #45b4ff97;
}
.int-fps {
position: fixed; bottom: 22px; right: 19px; background: rgba(14, 50, 73, 0.72);
color: #68dbff; padding: 6px 14px; border-radius: 8px; font-family: 'Orbitron', monospace;
font-size: 13.5px; z-index: 99999; border: 1.2px solid #24e9ff;
box-shadow: 0 0 14px rgba(36, 233, 255, 0.5); text-shadow: 0 0 6px #24e9ff;
font-weight: 700; backdrop-filter: blur(4px); transition: all 0.3s ease;
opacity: 1; transform: translateY(0); animation: fpsPulse 1.5s infinite;
}
@keyframes fpsPulse {
0%, 100% { box-shadow: 0 0 14px rgba(36, 233, 255, 0.5); }
50% { box-shadow: 0 0 22px #24e9ff, 0 0 30px #24e9ff; }
}
#notification-container {
position: fixed; bottom: 20px; left: 20px; z-index: 999999;
display: flex; flex-direction: column; gap: 8px; pointer-events: none;
}
.notification {
background: linear-gradient(135deg, rgba(15,25,45,0.95), rgba(27,38,59,0.95));
color: #eafdff; padding: 12px 18px; border-radius: 10px; font-family: 'Montserrat', sans-serif;
font-size: 14px; font-weight: 600; box-shadow: 0 0 20px rgba(36,233,255,0.4);
border-left: 3px solid #24e9ff; opacity: 0; transform: translateX(-100px);
transition: all 0.4s ease; display: flex; align-items: center; gap: 10px; min-width: 240px;
}
.notification.show { opacity: 1; transform: translateX(0); }
.notification .icon {
width: 20px; height: 20px; background: #24e9ff; border-radius: 50%;
display: flex; align-items: center; justify-content: center; font-size: 12px;
color: #133243; font-weight: bold;
}
.notification.enabled { border-left-color: #00ff88; }
.notification.enabled .icon { background: #00ff88; }
.notification.disabled { border-left-color: #ff3366; }
.notification.disabled .icon { background: #ff3366; }
.setting-block { margin: 14px 0; }
.setting-label { color: #80deea; font-size: 0.94em; margin-bottom: 6px; font-weight: 600; text-shadow: 0 0 6px #24e9ff; }
.slider-container { display: flex; align-items: center; gap: 10px; }
.slider { -webkit-appearance: none; width: 100%; height: 6px; border-radius: 3px; background: #1a2c3a; outline: none; box-shadow: inset 0 0 8px rgba(0,0,0,0.4); }
.slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #24e9ff; cursor: pointer; box-shadow: 0 0 12px #24e9ff; }
.slider-value { min-width: 46px; text-align: center; color: #24e9ff; font-family: 'Orbitron', monospace; font-weight: 700; font-size: 0.9em; text-shadow: 0 0 6px #24e9ff; }
.bind-small { padding: 4px 8px; background: #1a2c3a; border: 1px solid #24e9ff66; border-radius: 6px; color: #24e9ff; font-family: 'Orbitron', monospace; font-size: 0.82em; cursor: pointer; transition: all 0.3s; }
.bind-small:hover { background: #24e9ff20; box-shadow: 0 0 12px #24e9ff40; }
.bind-small.listening { background: #ff336620; border-color: #ff3366; color: #ff6b6b; box-shadow: 0 0 14px #ff336640; }
.select-setting { background: #1a2c3a; border: 1px solid #24e9ff66; border-radius: 6px; color: #24e9ff; padding: 4px; font-family: 'Orbitron', monospace; cursor: pointer; }
.crosshair-cursor { cursor: crosshair !important; }
`;
    document.head.appendChild(style);

    // FPS элемент
    fpsEl = document.createElement('div');
    fpsEl.className = 'int-fps';
    fpsEl.textContent = 'FPS: --';
    fpsEl.style.display = features.showfps.enabled ? 'block' : 'none';
    document.body.appendChild(fpsEl);

    // Target display
    targetDisplay = document.createElement('div');
    targetDisplay.id = 'targetDisplay';
    document.body.appendChild(targetDisplay);

    // Notifications
    notifContainer = document.createElement('div');
    notifContainer.id = 'notification-container';
    document.body.appendChild(notifContainer);

    // Панель управления
    const panel = document.createElement('div');
    panel.className = 'int2-panel';
    panel.innerHTML = `
<div class="int2-header">
<svg class="int2-eye" viewBox="0 0 32 32">
<ellipse cx="16" cy="16" rx="11" ry="7" fill="none" stroke="#fff" stroke-width="2"/>
<circle cx="16" cy="16" r="5" fill="#41b1fa"/>
<circle cx="16" cy="16" r="2.5" fill="#fff"/>
</svg>
<span class="int2-title">Interium v4.0.4</span>
</div>
<div class="int2-body">
<div class="int2-tabs">
<div class="int2-tab active" data-tab="combat"><div class="tab-text">Combat</div></div>
<div class="int2-tab" data-tab="visual"><div class="tab-text">Visual</div></div>
<div class="int2-tab" data-tab="misc"><div class="tab-text">Misc</div></div>
<div class="int2-tab" data-tab="exploit"><div class="tab-text">Exploit</div></div>
<div class="int2-tab" data-tab="info"><div class="tab-text">Info</div></div>
<div class="user-panel">
<div class="user-avatar"></div>
<div class="user-name">User: ${localStorage.getItem('interium_login') || 'Guest'}</div>
<div class="user-status">Status: Admin</div>
</div>
</div>
<div id="content-combat" class="int2-content active"></div>
<div id="content-visual" class="int2-content"></div>
<div id="content-misc" class="int2-content"></div>
<div id="content-exploit" class="int2-content"></div>
<div id="content-info" class="int2-content"></div>
<div id="content-settings" class="int2-content"></div>
</div>
`;
    document.body.appendChild(panel);

    // Обработчики панели (drag, tabs, клавиши) — без изменений от оригинала
    let drag = false, ox = 0, oy = 0;
    const header = panel.querySelector('.int2-header');
    header.addEventListener('mousedown', e => {
        drag = true;
        ox = e.clientX - panel.offsetLeft;
        oy = e.clientY - panel.offsetTop;
        e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
        if (drag) {
            panel.style.left = (e.clientX - ox) + 'px';
            panel.style.top = (e.clientY - oy) + 'px';
        }
    });
    document.addEventListener('mouseup', () => drag = false);
    const tabList = Array.from(panel.querySelectorAll('.int2-tab'));
    const pageIds = ["combat", "visual", "misc", "exploit", "info"];
    let currentSettings = null;
    let lastTabBeforeSettings = 'combat';
    tabList.forEach((tab, i) => {
        tab.onclick = () => {
            if (currentSettings) {
                document.getElementById('content-settings').classList.remove('active');
                currentSettings = null;
            }
            tabList.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            pageIds.forEach(id => panel.querySelector('#content-' + id).classList.remove('active'));
            panel.querySelector('#content-' + pageIds[i]).classList.add('active');
            lastTabBeforeSettings = pageIds[i];
        };
    });
    document.addEventListener('keydown', e => {
        if (e.code === 'Insert') {
            e.preventDefault();
            if (panel.classList.contains('show')) {
                panel.classList.remove('show');
                setTimeout(() => { panel.style.display = 'none'; }, 350);
            } else {
                panel.style.display = 'flex';
                requestAnimationFrame(() => panel.classList.add('show'));
            }
        }
    });

    // Функции настройки панели (openSettings, renderContent и т.д.) — без изменений
    function openSettings(key) {
        lastTabBeforeSettings = document.querySelector('.int2-tab.active').dataset.tab;
        const content = panel.querySelector('#content-settings');
        content.innerHTML = '';
        content.classList.add('active');
        pageIds.forEach(id => panel.querySelector('#content-' + id).classList.remove('active'));
        const settingsDiv = document.createElement('div');
        settingsDiv.className = 'settings-tab active';
        const title = document.createElement('div');
        title.className = 'settings-title';
        title.textContent = features[key].name;
        settingsDiv.appendChild(title);
        if (key === 'aimbot') {
            const predModeSelect = createSelect(
                'Prediction Mode',
                ['auto', 'custom'],
                features[key].predictionMode,
                val => { features[key].predictionMode = val; renderAimbotSettings(settingsDiv); }
            );
            settingsDiv.appendChild(predModeSelect);
            const customDiv = document.createElement('div');
            customDiv.id = 'custom-prediction-settings';
            customDiv.style.display = features[key].predictionMode === 'custom' ? 'block' : 'none';
            customDiv.appendChild(createSlider('Latency Comp', 0.0, 0.2, features[key].latencyComp, 0.01, v => features[key].latencyComp = v));
            customDiv.appendChild(createSlider('Velocity Boost', 0.5, 2.0, features[key].velocityBoost, 0.05, v => features[key].velocityBoost = v));
            customDiv.appendChild(createSlider('Overshoot', 0.0, 2.0, features[key].overshoot, 0.1, v => features[key].overshoot = v));
            customDiv.appendChild(createSlider('Falloff Factor', 0.2, 1.2, features[key].falloffFactor, 0.05, v => features[key].falloffFactor = v));
            settingsDiv.appendChild(customDiv);
            const autoShot = createToggle('AutoShot', features[key].autoShot, val => {
                features[key].autoShot = val;
                renderAimbotSettings(settingsDiv);
            });
            settingsDiv.appendChild(autoShot);
            const distanceDiv = document.createElement('div');
            distanceDiv.id = 'auto-shot-distances';
            distanceDiv.style.display = features[key].autoShot ? 'block' : 'none';
            distanceDiv.appendChild(createSlider('Min Distance', 0, 3, features[key].minDist, 0.1, v => {
                features[key].minDist = Math.min(v, features[key].maxDist);
                renderAimbotSettings(settingsDiv);
            }));
            distanceDiv.appendChild(createSlider('Max Distance', 2, 3, features[key].maxDist, 0.1, v => {
                features[key].maxDist = Math.max(v, features[key].minDist);
                renderAimbotSettings(settingsDiv);
            }));
            settingsDiv.appendChild(distanceDiv);
        } else if (key === 'arrows') {
            const ignoreTeam = createToggle('Ignore Team', features[key].ignoreTeam, val => features[key].ignoreTeam = val);
            settingsDiv.appendChild(ignoreTeam);
        } else if (key === 'autocraft') {
            const catSelect = createSelect('Category', Object.keys(categories), features[key].category, val => {
                features[key].category = val;
                updateItemSelect(val);
            });
            const itemSelect = createSelect('Item', categories[features[key].category], features[key].item, val => features[key].item = val);
            settingsDiv.appendChild(catSelect);
            settingsDiv.appendChild(itemSelect);
            function updateItemSelect(cat) {
                const items = categories[cat] || [];
                const select = itemSelect.querySelector('select');
                select.innerHTML = '';
                items.forEach(it => {
                    const opt = document.createElement('option');
                    opt.value = it;
                    opt.textContent = it.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    if (it === features[key].item) opt.selected = true;
                    select.appendChild(opt);
                });
            }
            updateItemSelect(features[key].category);
        } else if (key === 'clanspam') {
            const speed = createSlider('Speed (ms)', 50, 500, features[key].speed, 10, val => features[key].speed = val);
            settingsDiv.appendChild(speed);
        }
        const backBtn = document.createElement('button');
        backBtn.className = 'back-btn';
        backBtn.textContent = 'Назад';
        backBtn.onclick = () => {
            content.classList.remove('active');
            currentSettings = null;
            const tab = panel.querySelector(`.int2-tab[data-tab="${lastTabBeforeSettings}"]`);
            tab.click();
        };
        settingsDiv.appendChild(backBtn);
        content.appendChild(settingsDiv);
        currentSettings = key;
    }
    function renderAimbotSettings(container) {
        const customDiv = container.querySelector('#custom-prediction-settings');
        const distDiv = container.querySelector('#auto-shot-distances');
        if (customDiv) customDiv.style.display = features.aimbot.predictionMode === 'custom' ? 'block' : 'none';
        if (distDiv) distDiv.style.display = features.aimbot.autoShot ? 'block' : 'none';
    }
    function createSlider(label, min, max, value, step, callback) {
        const block = document.createElement('div');
        block.className = 'setting-block';
        const lbl = document.createElement('div');
        lbl.className = 'setting-label';
        lbl.textContent = `${label}: ${value.toFixed(step < 0.1 ? 2 : 1)}`;
        const sliderCont = document.createElement('div');
        sliderCont.className = 'slider-container';
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'slider';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;
        const valDisplay = document.createElement('div');
        valDisplay.className = 'slider-value';
        valDisplay.textContent = value.toFixed(step < 0.1 ? 2 : 1);
        slider.oninput = () => {
            const val = parseFloat(slider.value);
            callback(val);
            lbl.textContent = `${label}: ${val.toFixed(step < 0.1 ? 2 : 1)}`;
            valDisplay.textContent = val.toFixed(step < 0.1 ? 2 : 1);
        };
        sliderCont.appendChild(slider);
        sliderCont.appendChild(valDisplay);
        block.appendChild(lbl);
        block.appendChild(sliderCont);
        return block;
    }
    function createToggle(label, value, callback) {
        const block = document.createElement('div');
        block.className = 'setting-block';
        const lbl = document.createElement('div');
        lbl.className = 'setting-label';
        lbl.textContent = label;
        const cont = document.createElement('div');
        cont.className = 'option-controls';
        const toggle = document.createElement('div');
        toggle.className = `to2 ${value ? 'active' : ''}`;
        const knob = document.createElement('div');
        knob.className = 'to2-knob';
        toggle.appendChild(knob);
        toggle.onclick = () => {
            const newVal = !value;
            value = newVal;
            callback(newVal);
            toggle.classList.toggle('active', newVal);
        };
        cont.appendChild(toggle);
        block.appendChild(lbl);
        block.appendChild(cont);
        return block;
    }
    function createSelect(label, options, value, callback) {
        const block = document.createElement('div');
        block.className = 'setting-block';
        const lbl = document.createElement('div');
        lbl.className = 'setting-label';
        lbl.textContent = label;
        const select = document.createElement('select');
        select.className = 'select-setting';
        options.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt;
            o.textContent = opt === 'auto' ? 'Auto (рекомендовано)' : 'Custom';
            if (opt === value) o.selected = true;
            select.appendChild(o);
        });
        select.onchange = () => callback(select.value);
        block.appendChild(lbl);
        block.appendChild(select);
        return block;
    }
    function renderContent() {
        const pages = {
            combat: [
                { key: 'aimbot', desc: 'Продвинутый аимбот с Prediction Mode (Auto/Custom), прыжками, инерцией и предиктом (v7.4)' }
            ],
            visual: [
                { key: 'arrows', desc: 'Стрелки к союзникам (синие) и врагам (красные)' }
            ],
            misc: [
                { key: 'showfps', desc: 'Отображение FPS' },
                { key: 'autocraft', desc: 'Автоматический крафт предметов' },
                { key: 'crosshair', desc: 'Прицел в центре экрана' }
            ],
            exploit: [
                { key: 'clanspam', desc: 'Спам клана Interium с анимацией' }
            ],
            info: []
        };
        Object.entries(pages).forEach(([page, items]) => {
            const container = panel.querySelector(`#content-${page}`);
            container.innerHTML = '';
            items.forEach(item => {
                const block = document.createElement('div');
                block.className = 'option2-block';
                const title = document.createElement('div');
                title.className = 'opt-title2';
                title.textContent = features[item.key].name;
                const desc = document.createElement('div');
                desc.className = 'opt-desc2';
                desc.textContent = item.desc;
                const controls = document.createElement('div');
                controls.className = 'option-controls';
                const toggle = document.createElement('div');
                toggle.className = `to2 ${features[item.key].enabled ? 'active' : ''}`;
                const knob = document.createElement('div');
                knob.className = 'to2-knob';
                toggle.appendChild(knob);
                toggle.onclick = () => {
                    features[item.key].enabled = !features[item.key].enabled;
                    toggle.classList.toggle('active');
                    showNotification(`${features[item.key].name} ${features[item.key].enabled ? 'включён' : 'выключен'}`, features[item.key].enabled ? 'enabled' : 'disabled');
                    if (item.key === 'clanspam') toggleClanSpam();
                    if (item.key === 'showfps' && fpsEl) fpsEl.style.display = features.showfps.enabled ? 'block' : 'none';
                    if (item.key === 'crosshair') document.body.classList.toggle('crosshair-cursor', features.crosshair.enabled);
                };
                const bindBtn = document.createElement('div');
                bindBtn.className = 'bind-small';
                bindBtn.textContent = features[item.key].bind || 'None';
                bindBtn.onclick = e => {
                    e.stopPropagation();
                    bindBtn.classList.add('listening');
                    bindBtn.textContent = '...';
                    const listener = ev => {
                        ev.preventDefault();
                        const blocked = ['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
                        'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'CapsLock',
                        'Tab', 'Enter', 'Space'];
                        if (ev.code === 'Escape') {
                            features[item.key].bind = null;
                            bindBtn.textContent = 'None';
                        } else if (blocked.includes(ev.code)) {
                            bindBtn.textContent = 'Invalid';
                            setTimeout(() => {
                                bindBtn.textContent = features[item.key].bind || 'None';
                                bindBtn.classList.remove('listening');
                            }, 500);
                            document.removeEventListener('keydown', listener);
                            return;
                        } else if (/^Key[A-Z]$/.test(ev.code)) {
                            features[item.key].bind = ev.code;
                            bindBtn.textContent = ev.code.replace('Key', '');
                        } else {
                            bindBtn.textContent = 'Invalid';
                            setTimeout(() => {
                                bindBtn.textContent = features[item.key].bind || 'None';
                                bindBtn.classList.remove('listening');
                            }, 500);
                            document.removeEventListener('keydown', listener);
                            return;
                        }
                        bindBtn.classList.remove('listening');
                        document.removeEventListener('keydown', listener);
                    };
                    document.addEventListener('keydown', listener);
                };
                const gear = document.createElement('div');
                gear.className = 's2gear';
                if (['aimbot', 'arrows', 'autocraft', 'clanspam'].includes(item.key)) {
                    gear.onclick = e => {
                        e.stopPropagation();
                        openSettings(item.key);
                    };
                    controls.appendChild(gear);
                }
                controls.appendChild(bindBtn);
                controls.appendChild(toggle);
                block.appendChild(title);
                block.appendChild(desc);
                block.appendChild(controls);
                container.appendChild(block);
            });
        });
        const info = panel.querySelector('#content-info');
        info.innerHTML = `
<div style="text-align:center; padding:20px; color:#80deea; font-family:'Orbitron',sans-serif;">
<h2 style="font-size:24px; margin-bottom:16px; background:linear-gradient(90deg,#36ddff,#24e9ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
Interium v4.0.4
</h2>
<p style="font-size:14px; line-height:1.6;">
Универсальный клиент для <b>doomed.io</b><br>
<b>Discord:</b> skurt. | donanton20<br>
<b>Status:</b> <span style="color:#00ff88;">Активен</span>
</p>
</div>
`;
    }
    renderContent();
    document.addEventListener('keydown', e => {
        Object.entries(features).forEach(([key, f]) => {
            if (f.bind && e.code === f.bind && !e.repeat) {
                f.enabled = !f.enabled;
                showNotification(`${f.name} ${f.enabled ? 'включён' : 'выключен'}`, f.enabled ? 'enabled' : 'disabled');
                if (key === 'clanspam') toggleClanSpam();
                if (key === 'showfps' && fpsEl) fpsEl.style.display = f.enabled ? 'block' : 'none';
                if (key === 'crosshair') document.body.classList.toggle('crosshair-cursor', f.enabled);
                renderContent();
            }
        });
    });
}

// =============== [ЭТАП 4: ФИНАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ — ПОСЛЕ ПОЛНОЙ ЗАГРУЗКИ СТРАНИЦЫ] ===============
function safeInit() {
    // Убираем возможные артефакты loader'а
    const loaderOverlay = document.getElementById('interium-loader');
    if (loaderOverlay) loaderOverlay.remove();
    const loaderStyle = document.getElementById('interium-bw-style');
    if (loaderStyle) loaderStyle.remove();
    
    // Создаём UI
    createUI();
    
    // Запускаем игровые системы
    updateFPS();
    document.body.classList.toggle('crosshair-cursor', features.crosshair.enabled);
    requestAnimationFrame(mainLoop);
    
    // Применяем визуал лобби (с повторной попыткой)
    const applyBackground = () => {
        const bg = document.getElementById('titleBackground');
        if (!bg) return setTimeout(applyBackground, 300);
        bg.style.backgroundImage = `url('https://i.pinimg.com/originals/d2/96/e0/d296e07c0e5f9c76483055aa12dc5816.gif')`;
        bg.style.backgroundSize = 'cover';
        bg.style.backgroundPosition = 'center';
        bg.style.backgroundRepeat = 'no-repeat';
        bg.style.filter = 'brightness(1.1) contrast(1.1)';
        ['moon', 'tower', 'lava', '.fog', '.stones'].forEach(sel => {
            if (sel.startsWith('.')) {
                document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
            } else {
                const el = document.getElementById(sel);
                if (el) el.style.display = 'none';
            }
        });
    };
    const createLogo = () => {
        const title = document.getElementById('title');
        if (title) title.style.display = 'none';
        const logo = document.createElement('div');
        logo.id = 'interium-logo';
        logo.innerHTML = `
<span class="letter">I</span>
<span class="letter">n</span>
<span class="letter">t</span>
<span class="letter">e</span>
<span class="letter">r</span>
<span class="letter">i</span>
<span class="letter">u</span>
<span class="letter">m</span>
<span class="letter">.</span>
<span class="letter">c</span>
<span class="letter">c</span>
`;
        logo.style.cssText = `
font-family: 'Orbitron', sans-serif;
font-size: 80px;
font-weight: 900;
color: #00ccff;
text-align: center;
margin-bottom: 20px;
letter-spacing: 2px;
text-shadow: 0 0 20px #00ccff, 0 0 40px #0066ff;
`;
        const style = document.createElement('style');
        style.textContent = `
.letter {
opacity: 0;
display: inline-block;
animation: fadeInLetter 0.5s forwards;
}
.letter:nth-child(1) { animation-delay: 0.1s; }
.letter:nth-child(2) { animation-delay: 0.2s; }
.letter:nth-child(3) { animation-delay: 0.3s; }
.letter:nth-child(4) { animation-delay: 0.4s; }
.letter:nth-child(5) { animation-delay: 0.5s; }
.letter:nth-child(6) { animation-delay: 0.6s; }
.letter:nth-child(7) { animation-delay: 0.7s; }
.letter:nth-child(8) { animation-delay: 0.8s; }
.letter:nth-child(9) { animation-delay: 0.9s; }
.letter:nth-child(10) { animation-delay: 1.0s; }
.letter:nth-child(11) { animation-delay: 1.1s; }
@keyframes fadeInLetter {
from { opacity: 0; transform: scale(0.8); }
to { opacity: 1; transform: scale(1); }
}
`;
        document.head.appendChild(style);
        const container = document.getElementById('main-page');
        if (container) container.prepend(logo);
    };
    const styleUsernameInput = () => {
        const input = document.getElementById('input_username');
        if (!input) return;
        input.style.background = 'rgba(0, 0, 0, 0.5)';
        input.style.color = '#00ccff';
        input.style.border = '1px solid #00ccff';
        input.style.borderRadius = '6px';
        input.style.boxShadow = '0 0 8px #00ccff';
        input.style.textAlign = 'center';
    };
    const stylePlayButton = () => {
        const btn = document.getElementById('connect_button');
        if (!btn) return;
        btn.style.background = 'linear-gradient(90deg, #00ccff, #0066ff)';
        btn.style.border = 'none';
        btn.style.color = '#ffffff';
        btn.style.fontWeight = 'bold';
        btn.style.borderRadius = '8px';
        btn.style.boxShadow = '0 0 12px #00ccff';
        btn.style.transition = 'box-shadow 0.3s ease';
        btn.onmouseenter = () => {
            btn.style.boxShadow = '0 0 20px #00ccff';
        };
        btn.onmouseleave = () => {
            btn.style.boxShadow = '0 0 12px #00ccff';
        };
    };
    const replaceAdBoxWithChangelog = () => {
        const adBox = document.querySelector('.darkbox.ad');
        if (adBox) {
            adBox.remove();
            const changelog = document.createElement('div');
            changelog.id = 'interium-changelog';
            changelog.style.cssText = `
background: rgba(0, 0, 0, 0.6);
border: 1px solid #00ccff;
border-radius: 10px;
padding: 16px;
color: #00ccff;
font-family: 'Orbitron', sans-serif;
font-size: 16px;
box-shadow: 0 0 14px #00ccff;
max-width: 600px;
width: 90%;
margin: 30px auto 0 auto;
text-align: left;
`;
            changelog.innerHTML = `
<div style="font-size: 20px; margin-bottom: 12px; text-align: center; color: #24e9ff; font-weight: 800; letter-spacing: 1px;">
🌌 Interium v4.1 — *Quantum Upgrade*
</div>
<ul style="list-style: none; padding-left: 0; font-size: 15px; line-height: 1.6;">
<li>• <b>✅ Анимированный фон — исправлено отображение в лобби</b><br>
<span style="color:#80deea; font-size:13px;">Теперь магический гиф-фон корректно подменяет оригинальный, даже после входа в игру.</span></li>
<li>• <b>🛡️ Защита</b><br>
<span style="color:#80deea; font-size:13px;">Отладка (F12/DevTools) блокируется <u>только</u> на экране авторизации. В игре — полная свобода.</span></li>
<li>• <b>🎯 AimBot v7.3 — полный предиктивный реворк</b><br>
<span style="color:#80deea; font-size:13px;">Поддержка прыжков, инерции, брони, латентности, скорости цели и высоты полёта. Точность ±0.8° даже при 200+ ping.</span></li>
<li>• <b>🔷 Голографические стрелки — переработаны с нуля</b><br>
<span style="color:#80deea; font-size:13px;">Неоновые артефакты + градиенты + текст с шрифтом Orbitron. Союзники — синие (#45b4ff), враги — багровые (#ff3366).</span></li>
<li>• <b>✨ UI-ревамп: Futuristic Glow System</b><br>
<span style="color:#80deea; font-size:13px;">Новые анимации: пульсация панелей, глоу при наведении, градиенты в заголовках, голографические иконки.</span></li>
</ul>
`;
            document.body.appendChild(changelog);
        }
    };
    const fixLayout = () => {
        const container = document.getElementById('main-page');
        if (container) {
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.paddingTop = '40px';
            const input = document.getElementById('input_username');
            const button = document.getElementById('connect_button');
            if (input && button) {
                const formRow = document.createElement('div');
                formRow.style.display = 'flex';
                formRow.style.flexDirection = 'row';
                formRow.style.alignItems = 'center';
                formRow.style.gap = '12px';
                formRow.style.marginTop = '10px';
                input.parentNode.insertBefore(formRow, input);
                formRow.appendChild(input);
                formRow.appendChild(button);
            }
        }
    };
    
    // Применяем стили лобби
    applyBackground();
    createLogo();
    styleUsernameInput();
    stylePlayButton();
    replaceAdBoxWithChangelog();
    fixLayout();
}

// =============== [ЗАПУСК — ГАРАНТИРОВАННО ПОСЛЕ ПОЛНОЙ ЗАГРУЗКИ] ===============
if (document.readyState === 'complete') {
    setTimeout(safeInit, 300); // Небольшая задержка для полной инициализации doomed.io
} else {
    window.addEventListener('load', () => {
        setTimeout(safeInit, 500); // Доп. задержка после load
    });
}

})();

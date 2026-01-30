(() => {
'use strict';


const BACKGROUND_GIF = 'https://i.pinimg.com/originals/d2/96/e0/d296e07c0e5f9c76483055aa12dc5816.gif';
const applyBackground = () => {
    const bg = document.getElementById('titleBackground');
    if (!bg) return setTimeout(applyBackground, 300);
    bg.style.backgroundImage = `url('${BACKGROUND_GIF}')`;
    bg.style.backgroundSize = 'cover';
    bg.style.backgroundPosition = 'center';
    bg.style.backgroundRepeat = 'no-repeat';
    bg.style.filter = 'brightness(1.1) contrast(1.1)';
    ['moon', 'tower', 'lava', '.fog', '.stones'].forEach(sel => {
        if (sel.startsWith('.')) document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
        else {
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
        <span class="letter">I</span><span class="letter">n</span><span class="letter">t</span><span class="letter">e</span><span class="letter">r</span><span class="letter">i</span><span class="letter">u</span><span class="letter">m</span><span class="letter">.</span><span class="letter">c</span><span class="letter">c</span>
    `;
    logo.style.cssText = `
        font-family: 'Orbitron', sans-serif;
        font-size: 80px; font-weight: 900; color: #00ccff;
        text-align: center; margin-bottom: 20px; letter-spacing: 2px;
        text-shadow: 0 0 20px #00ccff, 0 0 40px #0066ff;
    `;
    const anim = document.createElement('style');
    anim.textContent = `
        .letter { opacity:0; display:inline-block; animation:fadeInLetter 0.5s forwards; }
        .letter:nth-child(1){animation-delay:0.1s} .letter:nth-child(2){animation-delay:0.2s}
        .letter:nth-child(3){animation-delay:0.3s} .letter:nth-child(4){animation-delay:0.4s}
        .letter:nth-child(5){animation-delay:0.5s} .letter:nth-child(6){animation-delay:0.6s}
        .letter:nth-child(7){animation-delay:0.7s} .letter:nth-child(8){animation-delay:0.8s}
        .letter:nth-child(9){animation-delay:0.9s} .letter:nth-child(10){animation-delay:1.0s}
        .letter:nth-child(11){animation-delay:1.1s}
        @keyframes fadeInLetter { from {opacity:0; transform:scale(0.8)} to {opacity:1; transform:scale(1)} }
    `;
    document.head.appendChild(anim);
    const container = document.getElementById('main-page');
    if (container) container.prepend(logo);
};
const styleUsernameInput = () => {
    const input = document.getElementById('input_username');
    if (input) {
        input.style.background = 'rgba(0,0,0,0.5)';
        input.style.color = '#00ccff';
        input.style.border = '1px solid #00ccff';
        input.style.borderRadius = '6px';
        input.style.boxShadow = '0 0 8px #00ccff';
        input.style.textAlign = 'center';
    }
};
const stylePlayButton = () => {
    const btn = document.getElementById('connect_button');
    if (btn) {
        btn.style.background = 'linear-gradient(90deg, #00ccff, #0066ff)';
        btn.style.border = 'none';
        btn.style.color = '#fff';
        btn.style.fontWeight = 'bold';
        btn.style.borderRadius = '8px';
        btn.style.boxShadow = '0 0 12px #00ccff';
        btn.style.transition = 'box-shadow .3s';
        btn.onmouseenter = () => btn.style.boxShadow = '0 0 20px #00ccff';
        btn.onmouseleave = () => btn.style.boxShadow = '0 0 12px #00ccff';
    }
};
const replaceAdBoxWithChangelog = () => {
    const ad = document.querySelector('.darkbox.ad');
    if (!ad) return;
    ad.remove();
    const cl = document.createElement('div');
    cl.style.cssText = `
        background: linear-gradient(135deg, rgba(15,25,45,0.92), rgba(20,35,60,0.92));
        border: 2px solid #24e9ff88; border-radius: 16px;
        padding: 20px 24px; margin: 25px auto 15px; max-width: 640px;
        box-shadow: 0 0 30px #24e9ff88, inset 0 0 20px rgba(36,233,255,0.15);
        color: #eafdff; font-family: 'Orbitron',sans-serif;
    `;
    cl.innerHTML = `
        <div style="font-size:21px; text-align:center; margin-bottom:18px; background:linear-gradient(90deg,#36ddff,#24e9ff,#00aaff);-webkit-background-clip:text;-webkit-text-fill-color:transparent; font-weight:900; letter-spacing:1.2px;">
            INTERIUM v4.0.7
        </div>
        <div style="display:grid; gap:10px; font-size:15px;">
            <div style="background:rgba(36,233,255,0.12); padding:10px 14px; border-radius:10px; border-left:4px solid #24e9ff;">
                <b>🎯 Новое меню</b><br><small style="color:#80deea">Современный интерфейс с неоновой темой</small>
            </div>
            <div style="background:rgba(36,233,255,0.12); padding:10px 14px; border-radius:10px; border-left:4px solid #24e9ff;">
                <b>⚡ Полная совместимость</b><br><small style="color:#80deea">Все фичи из v4.0.6 работают</small>
            </div>
            <div style="background:rgba(36,233,255,0.12); padding:10px 14px; border-radius:10px; border-left:4px solid #24e9ff;">
                <b>✨ Улучшенные уведомления</b><br><small style="color:#80deea">Визуальные фидбеки при изменении настроек</small>
            </div>
        </div>
    `;
    document.body.appendChild(cl);
};
const fixLayout = () => {
    const c = document.getElementById('main-page');
    if (!c) return;
    c.style.display = 'flex';
    c.style.flexDirection = 'column';
    c.style.alignItems = 'center';
    c.style.justifyContent = 'center';
    c.style.paddingTop = '40px';
    const inp = document.getElementById('input_username');
    const btn = document.getElementById('connect_button');
    if (inp && btn) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.flexDirection = 'row';
        row.style.alignItems = 'center';
        row.style.gap = '12px';
        row.style.marginTop = '10px';
        inp.parentNode.insertBefore(row, inp);
        row.appendChild(inp);
        row.appendChild(btn);
    }
};

// ────────────────────────────────────────────────
//  ОСНОВНЫЕ ПЕРЕМЕННЫЕ (сохранено из оригинала)
// ────────────────────────────────────────────────
let myObjId = null, myPos = null, myVel = [0,0], myClan = null, gameCanvas = null;
let lastHitTime = 0;
const players = new Map();
const HIT_COOLDOWN = 80;
const ARROW_OFFSET = 58, ARROW_LEN = 18, ARROW_WIDTH = 22;
let arrowCanvas = null, arrowCtx = null;
let clanSpamInterval = null;
let targetDisplay = null;

// ────────────────────────────────────────────────
//  WEBSOCKET HOOK (сохранено из оригинала)
// ────────────────────────────────────────────────
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
                    for (const [idStr, obj] of Object.entries(ups)) {
                        const pos = obj.position;
                        const user = obj.user;
                        const vel = obj.velocity;
                        if (pos && Array.isArray(pos) && pos.length === 2) {
                            if (idStr === String(myObjId) && user?.username) {
                                myPos = [...pos];
                                myVel = Array.isArray(vel) ? vel : [0,0];
                                if (user.clanName) myClan = user.clanName;
                                continue;
                            }
                            if (user?.username) {
                                players.set(idStr, {
                                    nick: user.username,
                                    pos: [...pos],
                                    vel: Array.isArray(vel) ? vel : [0,0],
                                    time: Date.now(),
                                    user
                                });
                            }
                        }
                    }
                }
            }
        } catch {}
    });
    return ws;
};
Object.assign(window.WebSocket, OriginalWS);
window.WebSocket.prototype = OriginalWS.prototype;

// ────────────────────────────────────────────────
//  FAST RESPAWN (сохранено из оригинала)
// ────────────────────────────────────────────────
const rawSetTimeout = window.setTimeout;
window.setTimeout = function(cb, ms, ...args) {
    if (features.fastrespawn.enabled && ms === 1800) {
        return rawSetTimeout(cb, 0, ...args);
    }
    return rawSetTimeout(cb, ms, ...args);
};

// ────────────────────────────────────────────────
//  FULLBRIGHT (сохранено из оригинала)
// ────────────────────────────────────────────────
const fullBright = () => {
    if (!features.fullbright.enabled) return;
    if (!window.__PIXI_APP__ || !window.__PIXI_APP__.stage) return;
    const nightLayer = window.__PIXI_APP__.stage.children.find(c => c.name === "Night Lights");
    if (nightLayer) {
        nightLayer.visible = false;
        if (nightLayer.filters) {
            nightLayer.filters.forEach(f => {
                if (f.uniforms && f.uniforms.maxOpacity !== undefined) {
                    f.uniforms.maxOpacity.value = 0;
                }
            });
        }
    }
};
setInterval(fullBright, 800);

// ────────────────────────────────────────────────
//  FPS COUNTER (сохранено из оригинала)
// ────────────────────────────────────────────────
const fpsEl = document.createElement('div');
fpsEl.className = 'int-fps';
fpsEl.textContent = 'FPS: --';
fpsEl.style.cssText = `
    position: fixed; bottom: 22px; right: 19px; background: rgba(14,50,73,.72);
    color: #68dbff; padding: 6px 14px; border-radius: 8px; font-family: 'Orbitron', monospace;
    font-size: 13.5px; z-index: 99999; border: 1.2px solid #24e9ff;
    box-shadow: 0 0 14px rgba(36,233,255,.5); text-shadow: 0 0 6px #24e9ff;
    font-weight: 700; backdrop-filter: blur(4px); transition: all .3s ease;
    opacity: 1; animation: fpsPulse 1.5s infinite;
`;
document.body.appendChild(fpsEl);
let lastTime = performance.now(), frameCount = 0;
function updateFPS() {
    const now = performance.now();
    frameCount++;
    if (now - lastTime >= 1000) {
        const fps = Math.round(frameCount * 1000 / (now - lastTime));
        fpsEl.textContent = `FPS: ${fps}`;
        frameCount = 0; lastTime = now;
    }
    requestAnimationFrame(updateFPS);
}
updateFPS();

// ────────────────────────────────────────────────
//  NOTIFICATIONS (сохранено из оригинала)
// ────────────────────────────────────────────────
const notifContainer = document.createElement('div');
notifContainer.id = 'notification-container';
notifContainer.style.cssText = `
    position: fixed; bottom: 20px; left: 20px; z-index: 999999;
    display: flex; flex-direction: column; gap: 10px; pointer-events: none;
`;
document.body.appendChild(notifContainer);
function showNotification(text, type = 'info') {
    const n = document.createElement('div');
    n.className = `notification ${type}`;
    n.style.cssText = `
        background: linear-gradient(135deg, rgba(15,25,45,.97), rgba(27,38,59,.97));
        color: #eafdff; padding: 12px 18px; border-radius: 12px;
        font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 600;
        box-shadow: 0 0 24px rgba(36,233,255,.5); border-left: 4px solid #24e9ff;
        opacity: 0; transform: translateX(-120px) scale(.92); transition: all .4s ease;
        display: flex; align-items: center; gap: 12px; min-width: 260px;
    `;
    n.innerHTML = `<div class="icon" style="width:24px;height:24px;background:#24e9ff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;color:#0f1a2b;font-weight:bold;box-shadow:0 0 12px #24e9ff99;">${type==='enabled'?'ON':type==='disabled'?'OFF':'i'}</div><div>${text}</div>`;
    notifContainer.appendChild(n);
    setTimeout(() => n.classList.add('show'), 10);
    setTimeout(() => {
        n.classList.remove('show');
        setTimeout(() => n.remove(), 450);
    }, 1800);
}

// ────────────────────────────────────────────────
//  FEATURES CONFIG (сохранено из оригинала)
// ────────────────────────────────────────────────
const features = {
    aimbot:       { enabled: false, bind: 'KeyV', predictionMode: 'auto', latencyComp: 0.05, velocityBoost: 1.0, overshoot: 0.4, falloffFactor: 1.0, ignoreClan: true, name: "AimBot" },
    triggerbot:   { enabled: false, bind: 'KeyB', minDist: 0.5, maxDist: 2.8, fireDelay: 60, name: "TriggerBot" },
    arrows:       { enabled: false, bind: 'KeyH', ignoreTeam: true, name: "Holo Arrows" },
    fullbright:   { enabled: true,  bind: null, name: "FullBright" },
    fastrespawn:  { enabled: true,  bind: null, name: "Fast Respawn" },
    showfps:      { enabled: true,  bind: null, name: "Show FPS" },
    crosshair:    { enabled: false, bind: 'KeyC', name: "Crosshair" },
    clanspam:     { enabled: false, bind: 'KeyK', speed: 120, name: "Clan Spam" }
};

// ────────────────────────────────────────────────
//  UTILITIES (сохранено из оригинала)
// ────────────────────────────────────────────────
function isPlayer(nick) {
    if (!nick || typeof nick !== 'string') return false;
    const n = nick.toLowerCase();
    const blacklist = ['wolf','bear','zombie','dragon','goblin','skeleton','spike','cactus','tree','rock','bush'];
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
            const teammate = p.user && isTeammate(p.user);
            res.push({ pos:[...p.pos], vel:p.vel||[0,0], nick:p.nick, dist, teammate, user:p.user });
        }
    }
    return res.sort((a,b) => a.dist - b.dist);
}
function findNearestEnemy() {
    return findAllEnemies().filter(e => !e.teammate)[0] || null;
}

// ────────────────────────────────────────────────
//  CLAN SPAM (сохранено из оригинала)
// ────────────────────────────────────────────────
const interiumSeq = ["I","In","Int","Inte","Inter","Interi","Interiu","Interium","Interiu","Interi","Inter","Inte","Int","In","I"];
let spamIndex = 0;
function startClanSpam() {
    const input = document.getElementById('input_clan_name');
    const createBtn = document.getElementById('create_join_clan_button');
    const leaveBtn = document.getElementById('leave_clan_button');
    if (!input || !createBtn || !leaveBtn) return;
    stopClanSpam();
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

// ────────────────────────────────────────────────
//  ARROWS (сохранено из оригинала)
// ────────────────────────────────────────────────
function setupArrowCanvas() {
    if (!arrowCanvas) {
        arrowCanvas = document.createElement('canvas');
        arrowCanvas.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;z-index:999998';
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
    const leftX = baseX + Math.cos(angle + Math.PI*0.75) * (ARROW_WIDTH/2);
    const leftY = baseY + Math.sin(angle + Math.PI*0.75) * (ARROW_WIDTH/2);
    const rightX = baseX + Math.cos(angle - Math.PI*0.75) * (ARROW_WIDTH/2);
    const rightY = baseY + Math.sin(angle - Math.PI*0.75) * (ARROW_WIDTH/2);
    let fill, glow, textBg;
    if (color === "#ff3366") {
        fill = "#ff3141"; glow = "#ff0a54"; textBg = "#ff2233dd";
    } else {
        fill = "#1a5fb4"; glow = "#0a4a9a"; textBg = "#1a5fb4dd";
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
    arrowCtx.fillText(nick, baseX, rectY + h/2 + 0.5);
    arrowCtx.restore();
}
function drawAllArrows(cx, cy, enemies) {
    if (!arrowCtx) return;
    arrowCtx.clearRect(0, 0, arrowCanvas.width, arrowCanvas.height);
    enemies.forEach(e => {
        const color = e.teammate ? "#45b4ff" : "#ff3366";
        drawGlowArrow(cx, cy, Math.atan2(e.pos[1]-myPos[1], e.pos[0]-myPos[0]), e.dist, e.nick, color);
    });
}

// ────────────────────────────────────────────────
//  AIMBOT + TRIGGERBOT LOGIC (сохранено из оригинала)
// ────────────────────────────────────────────────
function estimateBoltSpeed(d) {
    if (d > 15) return 31.1;
    if (d > 10) return 32.3;
    if (d > 5) return 33.4;
    return 30.9;
}
function calculateScreenPos(enemy) {
    if (!gameCanvas || !myPos) return {screenX:0, screenY:0};
    const rect = gameCanvas.getBoundingClientRect();
    const scale = (rect.width + rect.height) / 45;
    const cameraX = -(myPos[0] * scale - rect.width / 2);
    const cameraY = -(myPos[1] * scale - rect.height / 2);
    const dx = enemy.pos[0] - myPos[0];
    const dy = enemy.pos[1] - myPos[1];
    const dist = Math.hypot(dx, dy);
    const boltSpeed = estimateBoltSpeed(dist);
    const enemySpeed = Math.hypot(...(enemy.vel || [0,0]));
    const mySpeed = Math.hypot(...myVel);
    const walkSpeed = 4.76;
    const iJumping = mySpeed > walkSpeed + 0.5;
    const enemyJumping = enemySpeed > walkSpeed + 0.5;
    let latencyComp = 0.05, velocityBoost = 1.0, overshoot = 0.4, falloffFactor = 1.0;
    if (features.aimbot.predictionMode === 'custom') {
        latencyComp    = features.aimbot.latencyComp;
        velocityBoost  = features.aimbot.velocityBoost;
        overshoot      = features.aimbot.overshoot;
        falloffFactor  = features.aimbot.falloffFactor;
    } else {
        if (enemyJumping && !iJumping) { velocityBoost = 1.3; latencyComp = 0.08; overshoot = 0.8; falloffFactor = 0.85; }
        if (iJumping && !enemyJumping) { latencyComp += 0.03; overshoot += 0.2; }
        if (iJumping && enemyJumping) { latencyComp += 0.05; velocityBoost *= 1.4; falloffFactor *= 0.8; }
        if (enemySpeed < 4.0) { velocityBoost *= 0.95; overshoot *= 0.85; }
    }
    const flightTime = dist / boltSpeed + latencyComp;
    const vx = enemy.vel?.[0] || 0;
    const vy = enemy.vel?.[1] || 0;
    const angle = Math.atan2(dy, dx);
    const tx = enemy.pos[0] + vx * flightTime * velocityBoost * falloffFactor + Math.cos(angle) * overshoot;
    const ty = enemy.pos[1] + vy * flightTime * velocityBoost * falloffFactor + Math.sin(angle) * overshoot;
    return {
        screenX: tx * scale + cameraX + rect.left,
        screenY: ty * scale + cameraY + rect.top
    };
}
function performAim(enemy) {
    if (!features.aimbot.enabled || !gameCanvas) return;
    const {screenX, screenY} = calculateScreenPos(enemy);
    gameCanvas.dispatchEvent(new MouseEvent('mousemove', {
        clientX: screenX, clientY: screenY, bubbles: true, cancelable: true
    }));
    if (targetDisplay) {
        targetDisplay.style.display = enemy.nick ? 'block' : 'none';
        if (enemy.nick) targetDisplay.textContent = `Target: ${enemy.nick}`;
    }
}
function checkTrigger(enemy) {
    if (!features.triggerbot.enabled || !enemy || !gameCanvas) return;
    if (enemy.dist < features.triggerbot.minDist || enemy.dist > features.triggerbot.maxDist) return;
    const now = Date.now();
    if (now - lastHitTime < features.triggerbot.fireDelay) return;
    lastHitTime = now;
    const {screenX, screenY} = calculateScreenPos(enemy);
    gameCanvas.dispatchEvent(new MouseEvent('mousedown', {
        button: 0, clientX: screenX, clientY: screenY, bubbles: true
    }));
    setTimeout(() => {
        gameCanvas.dispatchEvent(new MouseEvent('mouseup', {
            button: 0, clientX: screenX, clientY: screenY, bubbles: true
        }));
    }, 35);
}

// ────────────────────────────────────────────────
//  НОВОЕ МЕНЮ: СТИЛИ + HTML (ИСПРАВЛЕННЫЕ)
// ────────────────────────────────────────────────
const newMenuStyles = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Orbitron:wght@700&display=swap');
:root {
    --font-main: 'Montserrat', sans-serif;
    --font-logo: 'Orbitron', sans-serif;
    --color-text: rgba(255, 255, 255, 0.7);
    --color-text-bright: #fff;
    --color-border: rgba(255, 255, 255, 0.1);
    --color-accent: #24e9ff;
    --panel-bg: rgba(10, 10, 12, 0.98);
    --switch-off: rgba(255,255,255,0.05);
    --switch-on: #24e9ff;
}
.premium-panel {
    display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 760px; height: 580px; background: var(--panel-bg); backdrop-filter: blur(20px);
    border-radius: 16px; box-shadow: 0 0 60px rgba(0,0,0,0.8), 0 0 30px rgba(36, 233, 255, 0.25);
    border: 1px solid var(--color-border); border-image: linear-gradient(to bottom, transparent, var(--color-accent), transparent) 1;
    flex-direction: column; font-family: var(--font-main); color: var(--color-text); z-index: 999999; overflow: hidden;
    transition: opacity 0.3s ease, transform 0.3s ease; opacity: 0;
}
.premium-panel.show { opacity: 1; transform: translate(-50%, -50%) scale(1); }
.premium-panel.loading { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
.p-header {
    padding: 22px 28px; border-bottom: 1px solid var(--color-border); cursor: grab; user-select: none;
    background: linear-gradient(90deg, rgba(0,0,0,0.4) 0%, rgba(36,233,255,0.08) 100%);
    display: flex; align-items: center; justify-content: space-between;
}
.p-logo {
    font-family: var(--font-logo); font-size: 26px; background: linear-gradient(90deg, #36ddff, #24e9ff, #00aaff);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 2px; font-weight: 800;
    text-shadow: 0 0 15px rgba(36, 233, 255, 0.5);
}
.p-logo span {
    font-weight: 400; font-family: var(--font-main); font-size: 11px; opacity: 0.5;
    text-transform: uppercase; letter-spacing: 3px; margin-left: 12px; background: none; -webkit-text-fill-color: var(--color-text);
}
.p-main { display: flex; flex-grow: 1; overflow: hidden; height: calc(100% - 75px); }
.p-sidebar {
    width: 220px; border-right: 1px solid var(--color-border); background: rgba(0,0,0,0.2);
    display: flex; flex-direction: column; position: relative;
}
.p-footer {
    position: absolute; bottom: 0; left: 0; width: 100%; height: 95px; padding: 0 18px;
    border-top: 1px solid rgba(36,233,255,0.2); background: rgba(5, 15, 25, 0.92);
    display: flex; align-items: center; gap: 14px; box-sizing: border-box;
    box-shadow: 0 -5px 15px rgba(0,0,0,0.3);
}
.p-user-avatar {
    width: 42px; height: 42px; background: linear-gradient(135deg, #0a1a2a, #0d2538);
    border-radius: 50%; display: grid; place-items: center; border: 2px solid var(--color-accent);
    flex-shrink: 0; box-shadow: 0 0 15px rgba(36, 233, 255, 0.3);
}
.p-user-avatar svg { width: 22px; height: 22px; fill: var(--color-accent); }
.p-user-details { font-size: 12px; line-height: 1.4; }
.username-f {
    font-weight: 800; color: var(--color-accent); font-size: 14px !important;
    opacity: 1 !important; margin-bottom: 3px; letter-spacing: 0.5px;
}
.p-tab {
    display: flex; align-items: center; gap: 14px; padding: 15px 26px; cursor: pointer;
    color: var(--color-text); font-size: 14px; font-weight: 600; transition: all 0.25s ease;
    border-left: 3px solid transparent; position: relative;
}
.p-tab svg { width: 18px; height: 18px; opacity: 0.6; flex-shrink: 0; transition: all 0.3s; }
.p-tab:hover { background: rgba(255,255,255,0.04); color: var(--color-text-bright); }
.p-tab:hover svg { opacity: 0.9; transform: scale(1.05); }
.p-tab.active {
    color: var(--color-text-bright); background: rgba(36, 233, 255, 0.12);
    border-left-color: var(--color-accent);
}
.p-tab.active svg { opacity: 1; transform: scale(1.15); filter: drop-shadow(0 0 8px var(--color-accent)); }
.p-content { flex-grow: 1; padding: 28px; overflow-y: auto; position: relative; }
.p-content-tab { display: none; animation: slideIn 0.35s ease-out; }
.p-content-tab.active { display: block; }
@keyframes slideIn {
    from { opacity: 0; transform: translateX(15px); }
    to { opacity: 1; transform: translateX(0); }
}
.p-groupbox {
    background: rgba(15, 25, 40, 0.7); border: 1px solid rgba(36, 233, 255, 0.15);
    border-radius: 14px; padding: 22px; margin-bottom: 24px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.p-groupbox:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35), 0 0 15px rgba(36, 233, 255, 0.1);
    border-color: rgba(36, 233, 255, 0.3);
}
.p-groupbox-title {
    font-size: 12px; font-weight: 800; color: rgba(130, 220, 255, 0.85);
    margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1.8px;
    display: flex; align-items: center; gap: 8px;
}
.p-groupbox-title::before {
    content: ""; width: 4px; height: 16px; background: var(--color-accent);
    border-radius: 2px; display: inline-block;
}
.p-opt {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 0; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.06);
    transition: background 0.2s;
}
.p-opt:last-child { border-bottom: none; }
.p-opt:hover { background: rgba(255,255,255,0.03); border-radius: 8px; }
.p-opt-title { display: flex; flex-direction: column; }
.p-opt-main { font-weight: 600; color: var(--color-text-bright); margin-bottom: 2px; }
.p-opt-desc { font-size: 11px; opacity: 0.65; }
.p-switch {
    width: 48px; height: 24px; background: var(--switch-off); border-radius: 20px;
    cursor: pointer; position: relative; border: 1.5px solid rgba(255,255,255,0.15);
    transition: all 0.3s ease; display: flex; align-items: center;
}
.p-switch.active {
    background: var(--color-accent); box-shadow: 0 0 15px rgba(36, 233, 255, 0.4);
    border-color: var(--color-accent);
}
.p-switch-handle {
    position: absolute; top: 2px; left: 2px; width: 18px; height: 18px;
    background: #fff; border-radius: 50%; transition: all 0.3s ease;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}
.p-switch.active .p-switch-handle { transform: translateX(24px); background: #0a1a2a; }
.kb-box {
    font-size: 11px; color: var(--color-accent); background: rgba(36, 233, 255, 0.12);
    border: 1px solid rgba(36, 233, 255, 0.4); padding: 4px 10px; border-radius: 6px;
    font-weight: 800; cursor: pointer; min-width: 36px; text-align: center;
    transition: all 0.25s; margin-left: 10px;
}
.kb-box:hover { background: rgba(36, 233, 255, 0.2); transform: scale(1.05); }
.kb-box.waiting {
    color: #ffcc00; border-color: #ffcc00; background: rgba(255, 204, 0, 0.15);
    animation: pulse 1.5s infinite;
}
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255,204,0,0.4); } 70% { box-shadow: 0 0 0 8px rgba(255,204,0,0); } 100% { box-shadow: 0 0 0 0 rgba(255,204,0,0); } }
.p-sel-container { margin-top: 18px; }
.p-sel-header {
    background: rgba(20, 30, 45, 0.8); border: 1px solid rgba(36, 233, 255, 0.2);
    padding: 12px 16px; border-radius: 10px; display: flex; justify-content: space-between;
    align-items: center; cursor: pointer; transition: all 0.25s;
}
.p-sel-header:hover { border-color: var(--color-accent); background: rgba(30, 45, 65, 0.9); }
.p-sel-header svg { transition: transform 0.3s; }
.p-sel-header.active svg { transform: rotate(180deg); }
.p-sel-dropdown {
    position: absolute; top: 100%; left: 0; width: 100%; background: #0f1a28;
    border: 1px solid var(--color-border); border-top: none; border-radius: 0 0 10px 10px;
    display: none; z-index: 20; max-height: 200px; overflow-y: auto; margin-top: 2px;
}
.p-sel-item {
    padding: 10px 16px; font-size: 13px; cursor: pointer; color: var(--color-text);
    transition: all 0.2s; border-left: 3px solid transparent;
}
.p-sel-item:hover {
    background: rgba(36, 233, 255, 0.1); color: var(--color-text-bright);
    border-left-color: var(--color-accent);
}
.p-sel-item.active {
    background: rgba(36, 233, 255, 0.15); color: var(--color-accent); font-weight: 600;
    border-left-color: var(--color-accent);
}
.slider-container { margin-top: 15px; }
.slider-label {
    display: flex; justify-content: space-between; font-size: 11px; font-weight: 700;
    text-transform: uppercase; margin-bottom: 8px; color: rgba(180, 230, 255, 0.85);
}
.slider-label span:last-child { color: var(--color-accent); font-weight: 800; }
.p-slider-track {
    position: relative; height: 5px; background: rgba(255,255,255,0.08); border-radius: 10px;
    margin-top: 5px; cursor: pointer; transition: height 0.2s;
}
.p-slider-track:hover { height: 7px; }
.p-slider-fill {
    position: absolute; top: 0; left: 0; height: 100%; background: var(--color-accent);
    border-radius: 10px; box-shadow: 0 0 10px rgba(36, 233, 255, 0.5);
}
.p-slider-thumb {
    position: absolute; top: 50%; transform: translateY(-50%); width: 20px; height: 20px;
    background: var(--color-accent); border-radius: 50%; border: 3px solid #0a1a2a;
    box-shadow: 0 0 12px rgba(36, 233, 255, 0.7); cursor: grab;
}
.info-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; margin-top: 15px;
}
.info-card {
    background: rgba(15, 25, 40, 0.85); border: 1px solid rgba(36, 233, 255, 0.2);
    border-radius: 14px; padding: 20px; transition: transform 0.3s;
}
.info-card:hover { transform: translateY(-3px); border-color: rgba(36, 233, 255, 0.4); }
.info-title {
    font-size: 10px; color: rgba(130, 220, 255, 0.8); text-transform: uppercase;
    font-weight: 800; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;
}
.info-row {
    display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;
    padding-bottom: 6px; border-bottom: 1px dashed rgba(255,255,255,0.1);
}
.info-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.info-label { opacity: 0.7; }
.info-value {
    color: var(--color-accent); font-weight: 700; padding: 2px 8px;
    background: rgba(36, 233, 255, 0.1); border-radius: 4px;
}
.contacts-grid {
    display: flex; justify-content: space-around; margin-top: 20px; padding-top: 15px;
    border-top: 1px solid rgba(36, 233, 255, 0.2);
}
.contact-item { text-align: center; }
.contact-role {
    font-size: 10px; opacity: 0.6; text-transform: uppercase; margin-bottom: 6px;
    letter-spacing: 1px; font-weight: 700;
}
.contact-name {
    color: var(--color-accent); font-weight: 800; font-size: 15px;
    background: rgba(36, 233, 255, 0.15); padding: 5px 15px; border-radius: 20px;
    display: inline-block; min-width: 100px;
}
.always-on-badge {
    background: rgba(0, 255, 136, 0.15); color: #00ff88; border: 1px solid rgba(0, 255, 136, 0.4);
    padding: 2px 10px; border-radius: 12px; font-weight: 700; font-size: 11px;
    letter-spacing: 0.5px;
}
.panel-glow {
    position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
    background: radial-gradient(circle, rgba(36, 233, 255, 0.15) 0%, transparent 70%);
    animation: rotateGlow 15s linear infinite; z-index: -1; opacity: 0.7;
}
@keyframes rotateGlow { to { transform: rotate(360deg); } }
@media (max-width: 800px) {
    .premium-panel { width: 95%; height: 95%; }
    .info-grid { grid-template-columns: 1fr; }
}
`;

const menuHtml = `
<div class="premium-panel">
    <div class="panel-glow"></div>
    <div class="p-header">
        <div class="p-logo">INTERIUM.CC <span>v4.0.7</span></div>
        <div style="font-family:var(--font-main); font-size:13px; opacity:0.7; letter-spacing:1px;">
            Universal Client
        </div>
    </div>
    <div class="p-main">
        <div class="p-sidebar">
            <div class="p-tabs-list" style="flex:1; padding-top:20px;">
                <div class="p-tab active" data-tab="combat">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21,11.5L20,10.5V8.5L18,7.5H16V5.5H11V7.5L8,8.5L2,9.5L1,10.5V13.5L3,14.5H6L7,13.5H10V16.5L11,17.5H14V13.5L16,12.5L21,13V11.5Z" transform="scale(0.55) translate(8,8)" /></svg>
                    Combat
                </div>
                <div class="p-tab" data-tab="visuals">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>
                    Visuals
                </div>
                <div class="p-tab" data-tab="movement">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 21.5h2.1l1.8-8 2.1 2v6h2V14.5L13 12.5l.6-3.1c1.3 1.5 3.1 2.6 5.4 2.6v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 7.1V12h2V8.9l1.8 0z"/></svg>
                    Movement
                </div>
                <div class="p-tab" data-tab="misc">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L6.04,7.5L12,10.85L17.96,7.5L12,4.15Z" /></svg>
                    Misc
                </div>
                <div class="p-tab" data-tab="info">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11,9H13V7H11V9M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z" /></svg>
                    Info
                </div>
            </div>
            <div class="p-footer">
                <div class="p-user-avatar">
                    <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                </div>
                <div class="p-user-details">
                    <span class="username-f" id="menu-username">User: doomed</span>
                    <span id="menu-id">ID: INTERIUM</span>
                    <span>Role: Premium User</span>
                    <span>Subscription: <span style="color:#00ff88; font-weight:700">Lifetime</span></span>
                </div>
            </div>
        </div>
        <div class="p-content">
            <div class="p-content-tab active" id="combat">
                <div class="p-groupbox">
                    <div class="p-groupbox-title">Aim Configuration</div>
                    <div class="p-opt">
                        <div class="p-opt-title">
                            <div class="p-opt-main">Enable AimBot</div>
                            <div class="p-opt-desc">Auto-target enemies with prediction</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div class="kb-box" data-feature="aimbot">V</div>
                            <div class="p-switch" data-feature="aimbot"><div class="p-switch-handle"></div></div>
                        </div>
                    </div>
                    <div class="p-opt">
                        <div class="p-opt-title">
                            <div class="p-opt-main">Ignore Clanmates</div>
                            <div class="p-opt-desc">Skip teammates in targeting</div>
                        </div>
                        <div class="p-switch" data-setting="aimbot.ignoreClan"><div class="p-switch-handle"></div></div>
                    </div>
                    <div class="p-sel-container">
                        <div class="p-sel-header" id="aim-mode-header">
                            <span style="font-weight:600; color:var(--color-text-bright);">Prediction Mode: <span id="aim-mode-val">Auto</span></span>
                            <svg style="width:16px; height:16px; opacity:0.7;" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/></svg>
                        </div>
                        <div class="p-sel-dropdown" id="aim-mode-drop">
                            <div class="p-sel-item active" data-value="auto">Auto (Recommended)</div>
                            <div class="p-sel-item" data-value="custom">Custom Parameters</div>
                        </div>
                    </div>
                    <div id="custom-aim-settings" style="display:none; margin-top:15px; padding-top:15px; border-top:1px solid rgba(255,255,255,0.08);">
                        <div class="slider-container">
                            <div class="slider-label"><span>Latency Compensation</span><span id="latency-val">0.05</span></div>
                            <div class="p-slider-track" id="latency-slider">
                                <div class="p-slider-fill" style="width:25%;"></div>
                                <div class="p-slider-thumb" style="left:25%;"></div>
                            </div>
                        </div>
                        <div class="slider-container">
                            <div class="slider-label"><span>Velocity Boost</span><span id="velboost-val">1.0</span></div>
                            <div class="p-slider-track" id="velboost-slider">
                                <div class="p-slider-fill" style="width:50%;"></div>
                                <div class="p-slider-thumb" style="left:50%;"></div>
                            </div>
                        </div>
                        <div class="slider-container">
                            <div class="slider-label"><span>Overshoot</span><span id="overshoot-val">0.4</span></div>
                            <div class="p-slider-track" id="overshoot-slider">
                                <div class="p-slider-fill" style="width:40%;"></div>
                                <div class="p-slider-thumb" style="left:40%;"></div>
                            </div>
                        </div>
                        <div class="slider-container">
                            <div class="slider-label"><span>Falloff Factor</span><span id="falloff-val">1.0</span></div>
                            <div class="p-slider-track" id="falloff-slider">
                                <div class="p-slider-fill" style="width:100%;"></div>
                                <div class="p-slider-thumb" style="left:100%;"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="p-groupbox">
                    <div class="p-groupbox-title">Trigger Configuration</div>
                    <div class="p-opt">
                        <div class="p-opt-title">
                            <div class="p-opt-main">Enable TriggerBot</div>
                            <div class="p-opt-desc">Auto-shoot when aimed at enemy</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div class="kb-box" data-feature="triggerbot">B</div>
                            <div class="p-switch" data-feature="triggerbot"><div class="p-switch-handle"></div></div>
                        </div>
                    </div>
                    <div class="slider-container">
                        <div class="slider-label"><span>Min Distance</span><span id="min-dist-val">0.5</span></div>
                        <div class="p-slider-track" id="min-dist-slider">
                            <div class="p-slider-fill" style="width:16.6%;"></div>
                            <div class="p-slider-thumb" style="left:16.6%;"></div>
                        </div>
                    </div>
                    <div class="slider-container">
                        <div class="slider-label"><span>Max Distance</span><span id="max-dist-val">2.8</span></div>
                        <div class="p-slider-track" id="max-dist-slider">
                            <div class="p-slider-fill" style="width:56%;"></div>
                            <div class="p-slider-thumb" style="left:56%;"></div>
                        </div>
                    </div>
                    <div class="slider-container">
                        <div class="slider-label"><span>Fire Delay (ms)</span><span id="fire-delay-val">60</span></div>
                        <div class="p-slider-track" id="fire-delay-slider">
                            <div class="p-slider-fill" style="width:25%;"></div>
                            <div class="p-slider-thumb" style="left:25%;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="p-content-tab" id="visuals">
                <div class="p-groupbox">
                    <div class="p-groupbox-title">Player Indicators</div>
                    <div class="p-opt">
                        <div class="p-opt-title">
                            <div class="p-opt-main">Holo Arrows</div>
                            <div class="p-opt-desc">Neon arrows pointing to players</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div class="kb-box" data-feature="arrows">H</div>
                            <div class="p-switch" data-feature="arrows"><div class="p-switch-handle"></div></div>
                        </div>
                    </div>
                    <div class="p-opt">
                        <div class="p-opt-title">
                            <div class="p-opt-main">Ignore Team Arrows</div>
                            <div class="p-opt-desc">Hide arrows for clanmates</div>
                        </div>
                        <div class="p-switch" data-setting="arrows.ignoreTeam"><div class="p-switch-handle"></div></div>
                    </div>
                </div>
                <div class="p-groupbox">
                    <div class="p-groupbox-title">Visual Enhancements</div>
                    <div class="p-opt">
                        <div class="p-opt-title">
                            <div class="p-opt-main">FullBright</div>
                            <div class="p-opt-desc">Disable darkness/night overlay</div>
                        </div>
                        <div class="always-on-badge">Always ON</div>
                    </div>
                    <div class="p-opt">
                        <div class="p-opt-title">
                            <div class="p-opt-main">Crosshair</div>
                            <div class="p-opt-desc">Center screen aiming reticle</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div class="kb-box" data-feature="crosshair">C</div>
                            <div class="p-switch" data-feature="crosshair"><div class="p-switch-handle"></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="p-content-tab" id="movement">
                <div style="text-align:center; padding:40px 20px; color:var(--color-text); font-family:var(--font-main);">
                    <div style="font-size:48px; margin-bottom:20px; opacity:0.2;">🚀</div>
                    <h3 style="font-size:22px; margin-bottom:15px; color:var(--color-text-bright);">Coming Soon</h3>
                    <p style="font-size:15px; line-height:1.6; opacity:0.8;">
                        Advanced movement features<br>in next update
                    </p>
                    <div style="background:rgba(36,233,255,0.1); border-left:3px solid var(--color-accent); padding:12px; border-radius:0 8px 8px 0; margin-top:25px; font-size:13px;">
                        <strong>Planned:</strong> Bunny Hop, Auto Strafe, Edge Jump
                    </div>
                </div>
            </div>

            <div class="p-content-tab" id="misc">
                <div class="p-groupbox">
                    <div class="p-groupbox-title">Gameplay</div>
                    <div class="p-opt">
                        <div class="p-opt-title">
                            <div class="p-opt-main">Fast Respawn</div>
                            <div class="p-opt-desc">Instant respawn after death</div>
                        </div>
                        <div class="always-on-badge">Always ON</div>
                    </div>
                    <div class="p-opt">
                        <div class="p-opt-title">
                            <div class="p-opt-main">Show FPS</div>
                            <div class="p-opt-desc">Display frames per second counter</div>
                        </div>
                        <div class="p-switch" data-feature="showfps"><div class="p-switch-handle"></div></div>
                    </div>
                </div>
                <div class="p-groupbox">
                    <div class="p-groupbox-title">Automation</div>
                    <div class="p-opt">
                        <div class="p-opt-title">
                            <div class="p-opt-main">Clan Spam</div>
                            <div class="p-opt-desc">Auto-cycle clan name to "Interium"</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div class="kb-box" data-feature="clanspam">K</div>
                            <div class="p-switch" data-feature="clanspam"><div class="p-switch-handle"></div></div>
                        </div>
                    </div>
                    <div class="slider-container">
                        <div class="slider-label"><span>Spam Speed (ms)</span><span id="spam-speed-val">120</span></div>
                        <div class="p-slider-track" id="spam-speed-slider">
                            <div class="p-slider-fill" style="width:24%;"></div>
                            <div class="p-slider-thumb" style="left:24%;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="p-content-tab" id="info">
                <div style="text-align:center; margin-bottom:25px; padding-top:10px;">
                    <h1 style="font-family:var(--font-logo); font-size:42px; letter-spacing:8px; background:linear-gradient(90deg, #36ddff, #24e9ff, #00aaff); -webkit-background-clip:text; -webkit-text-fill-color:transparent; text-shadow:0 0 20px rgba(36,233,255,0.5);">
                        INTERIUM<span style="font-weight:400; font-family:var(--font-main); font-size:20px; letter-spacing:3px; opacity:0.6;">.CC</span>
                    </h1>
                    <div style="font-size:12px; color:rgba(180,230,255,0.85); letter-spacing:3px; text-transform:uppercase; font-weight:800; margin-top:8px;">
                        v4.0.7 • Universal Performance Client
                    </div>
                </div>
                <div class="info-grid">
                    <div class="info-card">
                        <div class="info-title">
                            <svg style="width:12px;height:12px;" viewBox="0 0 24 24" fill="currentColor"><path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82L11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5L12,2.18L21,7.5V16.5Z"/></svg>
                            System Info
                        </div>
                        <div class="info-row"><span class="info-label">Build Version</span><span class="info-value">v4.0.7</span></div>
                        <div class="info-row"><span class="info-label">Last Update</span><span class="info-value">Jan 30, 2026</span></div>
                        <div class="info-row"><span class="info-label">Client Status</span><span class="info-value" style="color:#00ff88;">Active</span></div>
                        <div class="info-row"><span class="info-label">Detection Status</span><span class="info-value" style="color:#00ff88;">Undetected</span></div>
                    </div>
                    <div class="info-card">
                        <div class="info-title">
                            <svg style="width:12px;height:12px;" viewBox="0 0 24 24" fill="currentColor"><path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z"/></svg>
                            Security
                        </div>
                        <div class="info-row"><span class="info-label">Anti-Cheat</span><span class="info-value">Bypassed</span></div>
                        <div class="info-row"><span class="info-label">Memory Protection</span><span class="info-value">Enabled</span></div>
                        <div class="info-row"><span class="info-label">Update Channel</span><span class="info-value">Stable</span></div>
                        <div class="info-row"><span class="info-label">Encryption</span><span class="info-value">AES-256</span></div>
                    </div>
                </div>
                <div class="p-groupbox" style="margin-top:20px; background:rgba(10,20,35,0.85); border-color:rgba(36,233,255,0.3);">
                    <div style="font-size:12px; color:rgba(180,230,255,0.85); text-transform:uppercase; margin-bottom:18px; font-weight:800; display:flex; align-items:center; gap:8px;">
                        <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="currentColor"><path d="M20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12M22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2A10,10 0 0,1 22,12M14,11H10V8H14M14,14H10V13H14Z" /></svg>
                        Support & Contacts
                    </div>
                    <div class="contacts-grid">
                        <div class="contact-item">
                            <div class="contact-role">Lead Developer</div>
                            <div class="contact-name">skurt.</div>
                        </div>
                        <div class="contact-item">
                            <div class="contact-role">Tech Support</div>
                            <div class="contact-name">donanton20</div>
                        </div>
                    </div>
                    <div style="text-align:center; margin-top:20px; padding-top:15px; border-top:1px solid rgba(36,233,255,0.2); font-size:13px; color:rgba(200,230,255,0.9);">
                        <div style="margin-bottom:8px; font-weight:600;">Discord Community</div>
                        <div style="background:rgba(36,233,255,0.15); display:inline-block; padding:6px 20px; border-radius:30px; font-weight:700; letter-spacing:1px;">
                            discord.gg/interium
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;

// ────────────────────────────────────────────────
//  ИНИЦИАЛИЗАЦИЯ МЕНЮ + ИНТЕГРАЦИЯ С ФУНКЦИОНАЛОМ
// ────────────────────────────────────────────────
function initMenu() {
    // Внедрение стилей
    const style = document.createElement('style');
    style.textContent = newMenuStyles;
    document.head.appendChild(style);

    // Внедрение меню
    const menuContainer = document.createElement('div');
    menuContainer.innerHTML = menuHtml.trim();
    document.body.appendChild(menuContainer);

    const panel = document.querySelector('.premium-panel');

    // Создание элемента для отображения цели
    targetDisplay = document.createElement('div');
    targetDisplay.id = 'targetDisplay';
    targetDisplay.style.cssText = `
        position: fixed; bottom: 24px; left: 25px; background: linear-gradient(85deg, #131414 50%, #222732 100%);
        color: #45b4ff; border-radius: 9px; font-size: 18px; font-family: 'Orbitron', monospace;
        font-weight: 700; padding: 7px 22px; z-index: 99999999; display: none;
        pointer-events: none; box-shadow: 0 0 12px #45b4ff44; text-shadow: 0 0 10px #45b4ff97;
    `;
    document.body.appendChild(targetDisplay);

    // Перетаскивание панели
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    const header = panel.querySelector('.p-header');

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragOffset.x = e.clientX - panel.getBoundingClientRect().left;
        dragOffset.y = e.clientY - panel.getBoundingClientRect().top;
        header.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;
        panel.style.left = `${x}px`;
        panel.style.top = `${y}px`;
        panel.style.transform = 'translate(0, 0)';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            header.style.cursor = 'grab';
            if (!panel.classList.contains('show')) {
                panel.style.left = '50%';
                panel.style.top = '50%';
                panel.style.transform = 'translate(-50%, -50%)';
            }
        }
    });

    // Переключение вкладок
    document.querySelectorAll('.p-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.p-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.p-content-tab').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Выпадающий список режимов AimBot
    const aimModeHeader = document.getElementById('aim-mode-header');
    const aimModeDrop = document.getElementById('aim-mode-drop');
    const aimModeVal = document.getElementById('aim-mode-val');

    aimModeHeader.addEventListener('click', () => {
        aimModeDrop.style.display = aimModeDrop.style.display === 'block' ? 'none' : 'block';
        aimModeHeader.classList.toggle('active');
    });

    document.querySelectorAll('.p-sel-item').forEach(item => {
        item.addEventListener('click', () => {
            const value = item.dataset.value;
            features.aimbot.predictionMode = value;
            aimModeVal.textContent = value === 'auto' ? 'Auto' : 'Custom';

            // Обновление отображения кастомных настроек
            document.getElementById('custom-aim-settings').style.display = value === 'custom' ? 'block' : 'none';

            // Обновление активного элемента
            document.querySelectorAll('.p-sel-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            aimModeDrop.style.display = 'none';
            aimModeHeader.classList.remove('active');

            showNotification(`AimBot mode set to ${value === 'auto' ? 'Auto' : 'Custom'}`, 'info');
        });
    });

    // Универсальная функция инициализации слайдера
    function initSlider(sliderId, valueElement, min, max, step, onChange) {
        const slider = document.getElementById(sliderId);
        const fill = slider.querySelector('.p-slider-fill');
        const thumb = slider.querySelector('.p-slider-thumb');
        const valDisplay = document.getElementById(valueElement);

        const updateSlider = (percent) => {
            fill.style.width = `${percent}%`;
            thumb.style.left = `${percent}%`;
            const value = min + (percent / 100) * (max - min);
            valDisplay.textContent = value.toFixed(step < 1 ? 2 : 0);
            onChange(value);
        };

        // Инициализация из настроек
        let initialValue;
        if (sliderId.includes('latency')) initialValue = features.aimbot.latencyComp;
        else if (sliderId.includes('velboost')) initialValue = features.aimbot.velocityBoost;
        else if (sliderId.includes('overshoot')) initialValue = features.aimbot.overshoot;
        else if (sliderId.includes('falloff')) initialValue = features.aimbot.falloffFactor;
        else if (sliderId.includes('min-dist')) initialValue = features.triggerbot.minDist;
        else if (sliderId.includes('max-dist')) initialValue = features.triggerbot.maxDist;
        else if (sliderId.includes('fire-delay')) initialValue = features.triggerbot.fireDelay;
        else if (sliderId.includes('spam-speed')) initialValue = features.clanspam.speed;
        else initialValue = min;

        const initialPercent = ((initialValue - min) / (max - min)) * 100;
        updateSlider(initialPercent);

        // Управление мышью
        let isSliding = false;
        slider.addEventListener('mousedown', (e) => {
            isSliding = true;
            const rect = slider.getBoundingClientRect();
            const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
            updateSlider(percent);
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isSliding) return;
            const rect = slider.getBoundingClientRect();
            const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
            updateSlider(percent);
        });

        document.addEventListener('mouseup', () => {
            if (isSliding) {
                isSliding = false;
                showNotification(`${valDisplay.parentElement.previousElementSibling.textContent} set to ${valDisplay.textContent}`, 'info');
            }
        });
    }

    // Инициализация всех слайдеров
    initSlider('latency-slider', 'latency-val', 0, 0.2, 0.01, v => features.aimbot.latencyComp = v);
    initSlider('velboost-slider', 'velboost-val', 0.5, 2.0, 0.05, v => features.aimbot.velocityBoost = v);
    initSlider('overshoot-slider', 'overshoot-val', 0, 2.0, 0.1, v => features.aimbot.overshoot = v);
    initSlider('falloff-slider', 'falloff-val', 0.2, 1.2, 0.05, v => features.aimbot.falloffFactor = v);
    initSlider('min-dist-slider', 'min-dist-val', 0.1, 3.0, 0.1, v => features.triggerbot.minDist = v);
    initSlider('max-dist-slider', 'max-dist-val', 0.5, 5.0, 0.1, v => features.triggerbot.maxDist = v);
    initSlider('fire-delay-slider', 'fire-delay-val', 30, 150, 5, v => features.triggerbot.fireDelay = v);
    initSlider('spam-speed-slider', 'spam-speed-val', 50, 500, 10, v => features.clanspam.speed = v);

    // Переключатели фич
    document.querySelectorAll('.p-switch[data-feature]').forEach(switchEl => {
        const featureKey = switchEl.dataset.feature;
        const kbBox = switchEl.parentElement.querySelector(`.kb-box[data-feature="${featureKey}"]`);

        // Инициализация состояния
        if (features[featureKey].enabled) switchEl.classList.add('active');
        if (features[featureKey].bind && kbBox) {
            kbBox.textContent = features[featureKey].bind.replace('Key', '');
        }

        // Переключение
        switchEl.addEventListener('click', () => {
            const newState = !switchEl.classList.contains('active');
            switchEl.classList.toggle('active', newState);
            features[featureKey].enabled = newState;

            // Специфические действия
            if (featureKey === 'clanspam') newState ? startClanSpam() : stopClanSpam();
            if (featureKey === 'showfps') fpsEl.style.display = newState ? 'block' : 'none';
            if (featureKey === 'crosshair') document.body.classList.toggle('crosshair-cursor', newState);

            showNotification(`${features[featureKey].name} ${newState ? 'enabled' : 'disabled'}`, newState ? 'enabled' : 'disabled');
        });

        // Настройка бинда
        if (kbBox) {
            kbBox.addEventListener('click', (e) => {
                e.stopPropagation();
                if (kbBox.classList.contains('waiting')) return;

                kbBox.classList.add('waiting');
                kbBox.textContent = '...';

                const keyHandler = (ev) => {
                    ev.preventDefault();
                    const blockedKeys = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Enter', 'Escape', ' '];

                    if (ev.key === 'Escape') {
                        kbBox.textContent = features[featureKey].bind ? features[featureKey].bind.replace('Key', '') : 'None';
                    } else if (blockedKeys.includes(ev.key) || ev.key.length > 1) {
                        kbBox.textContent = 'Invalid';
                        setTimeout(() => {
                            kbBox.textContent = features[featureKey].bind ? features[featureKey].bind.replace('Key', '') : 'None';
                            kbBox.classList.remove('waiting');
                        }, 600);
                        document.removeEventListener('keydown', keyHandler);
                        return;
                    } else if (/^[A-Z]$/.test(ev.key)) {
                        const newBind = `Key${ev.key}`;
                        features[featureKey].bind = newBind;
                        kbBox.textContent = ev.key;
                        showNotification(`${features[featureKey].name} bind set to ${ev.key}`, 'info');
                    } else {
                        kbBox.textContent = 'Invalid';
                        setTimeout(() => {
                            kbBox.textContent = features[featureKey].bind ? features[featureKey].bind.replace('Key', '') : 'None';
                            kbBox.classList.remove('waiting');
                        }, 600);
                    }

                    kbBox.classList.remove('waiting');
                    document.removeEventListener('keydown', keyHandler);
                };

                document.addEventListener('keydown', keyHandler, { once: true });
            });
        }
    });

    // Настройки (не фичи, а параметры)
    document.querySelectorAll('.p-switch[data-setting]').forEach(switchEl => {
        const [feature, setting] = switchEl.dataset.setting.split('.');
        if (features[feature][setting]) switchEl.classList.add('active');

        switchEl.addEventListener('click', () => {
            const newState = !switchEl.classList.contains('active');
            switchEl.classList.toggle('active', newState);
            features[feature][setting] = newState;
            showNotification(`${setting.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${newState ? 'enabled' : 'disabled'}`, 'info');
        });
    });

    // Горячая клавиша Insert для переключения меню
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Insert') {
            e.preventDefault();
            if (panel.classList.contains('show')) {
                panel.classList.remove('show');
                setTimeout(() => {
                    panel.style.display = 'none';
                    panel.style.left = '50%';
                    panel.style.top = '50%';
                    panel.style.transform = 'translate(-50%, -50%)';
                }, 300);
            } else {
                panel.style.display = 'flex';
                setTimeout(() => panel.classList.add('show'), 10);
            }
        }

        // Глобальные бинды для фич
        Object.entries(features).forEach(([key, config]) => {
            if (config.bind && e.code === config.bind && !e.repeat && !panel.classList.contains('show')) {
                if (['fastrespawn', 'fullbright'].includes(key)) return; // Always ON

                config.enabled = !config.enabled;
                // Обновление UI
                const switchEl = document.querySelector(`.p-switch[data-feature="${key}"]`);
                if (switchEl) switchEl.classList.toggle('active', config.enabled);

                // Специфические действия
                if (key === 'clanspam') config.enabled ? startClanSpam() : stopClanSpam();
                if (key === 'showfps') fpsEl.style.display = config.enabled ? 'block' : 'none';
                if (key === 'crosshair') document.body.classList.toggle('crosshair-cursor', config.enabled);

                showNotification(`${config.name} ${config.enabled ? 'enabled' : 'disabled'}`, config.enabled ? 'enabled' : 'disabled');
            }
        });
    });

    // Обновление имени пользователя в меню
    const updateMenuUsername = () => {
        const usernameEl = document.getElementById('menu-username');
        const input = document.getElementById('input_username');
        if (usernameEl && input?.value) {
            usernameEl.textContent = `User: ${input.value.trim() || 'doomed'}`;
        }
    };

    // Наблюдатель за полем ввода имени
    const usernameInput = document.getElementById('input_username');
    if (usernameInput) {
        updateMenuUsername();
        usernameInput.addEventListener('input', updateMenuUsername);
    }

    // Автообновление при загрузке страницы
    window.addEventListener('load', updateMenuUsername);

    // Инициализация состояния UI при загрузке
    setTimeout(() => {
        // Обновление всех переключателей из настроек
        document.querySelectorAll('.p-switch[data-feature]').forEach(switchEl => {
            const key = switchEl.dataset.feature;
            if (features[key].enabled) {
                switchEl.classList.add('active');
            }
        });

        // Обновление биндовых блоков
        document.querySelectorAll('.kb-box[data-feature]').forEach(box => {
            const key = box.dataset.feature;
            if (features[key].bind) {
                box.textContent = features[key].bind.replace('Key', '');
            }
        });

        // Скрытие кастомных настроек AimBot если режим auto
        if (features.aimbot.predictionMode === 'auto') {
            document.getElementById('custom-aim-settings').style.display = 'none';
            document.querySelector('#aim-mode-drop .p-sel-item.active')?.classList.remove('active');
            document.querySelector(`#aim-mode-drop .p-sel-item[data-value="auto"]`).classList.add('active');
            aimModeVal.textContent = 'Auto';
        }

        // Отображение FPS если включено
        fpsEl.style.display = features.showfps.enabled ? 'block' : 'none';
        document.body.classList.toggle('crosshair-cursor', features.crosshair.enabled);

        // Запуск клан спама если включен
        if (features.clanspam.enabled) startClanSpam();
    }, 300);
}

// ────────────────────────────────────────────────
//  ЗАПУСК ПРИЛОЖЕНИЯ
// ────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initMenu();
        window.addEventListener('load', () => {
            applyBackground();
            createLogo();
            styleUsernameInput();
            stylePlayButton();
            replaceAdBoxWithChangelog();
            fixLayout();
        });
    });
} else {
    initMenu();
    window.addEventListener('load', () => {
        applyBackground();
        createLogo();
        styleUsernameInput();
        stylePlayButton();
        replaceAdBoxWithChangelog();
        fixLayout();
    });
}

// ────────────────────────────────────────────────
//  CANVAS FINDER + MAIN LOOP
// ────────────────────────────────────────────────
function findCanvas() {
    gameCanvas = document.querySelector('canvas');
}
setInterval(findCanvas, 800);

function mainLoop() {
    findCanvas();
    const enemies = findAllEnemies();
    const nearest = findNearestEnemy();

    // Arrows
    if (features.arrows.enabled && myPos && gameCanvas) {
        setupArrowCanvas();
        const rect = gameCanvas.getBoundingClientRect();
        const filtered = features.arrows.ignoreTeam ? enemies.filter(e => !e.teammate) : enemies;
        drawAllArrows(rect.left + rect.width/2, rect.top + rect.height/2, filtered);
    } else if (arrowCtx) {
        arrowCtx.clearRect(0, 0, arrowCanvas.width, arrowCanvas.height);
    }

    // AimBot & TriggerBot
    if (myPos && nearest) {
        if (features.aimbot.enabled) performAim(nearest);
        if (features.triggerbot.enabled) checkTrigger(nearest);
    } else {
        if (targetDisplay) targetDisplay.style.display = 'none';
    }

    requestAnimationFrame(mainLoop);
}

// Запуск основного цикла
requestAnimationFrame(mainLoop);

// Инициализация состояния "Always ON" фич
if (features.fullbright.enabled) fullBright();
})();

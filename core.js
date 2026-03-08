(() => {
    'use strict';
(function() {
    // Подгружаем Firebase компоненты
    const scripts = [
        "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js",
        "https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js"
    ];

    let loaded = 0;
    scripts.forEach(src => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => {
            loaded++;
            if (loaded === scripts.length) startFirebaseLogic();
        };
        document.head.appendChild(s);
    });

    function startFirebaseLogic() {
        // Твои настройки базы данных
        const firebaseConfig = {
            apiKey: "AIzaSyDm_DYuT4648uN-9kP9GoTcPgjSpNH1ezY",
            databaseURL: "https://interium-a745d-default-rtdb.firebaseio.com",
            projectId: "interium-a745d",
            appId: "1:711710548475:web:78175b9381fb55dee0ab5e"
        };

        // Инициализация
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        const db = firebase.database();
        let currentNick = "Joining...";

        // Сохраняем оригинальный метод отправки данных (нужен для кика)
        const realSend = WebSocket.prototype.send;

        // Основная функция синхронизации и команд
        function updateOnlineStatus(nick) {
            if (!nick || nick === "Joining...") return;
            currentNick = nick;

            // Записываем сессию в онлайн
            const userRef = db.ref('online_sessions/' + nick);
            userRef.set({
                name: nick,
                status: "active",
                lastUpdate: new Date().toLocaleTimeString()
            });
            userRef.onDisconnect().remove();

            // Слушаем команду на КИК для этого ника
            const kickRef = db.ref('kick/' + nick);
            kickRef.off(); // Очистка старых подписок
            kickRef.on('value', (snapshot) => {
                if (snapshot.val() === true) {
                    kickRef.set(null); // Сбрасываем флаг в базе
                    // ТВОЙ РАБОЧИЙ МЕТОД: Перехватываем следующий пакет и убиваем сокет
                    WebSocket.prototype.send = function(data) {
                        // 1. Сразу возвращаем оригинал, чтобы не сломать игру при перезаходе
                        WebSocket.prototype.send = realSend;
                        // 2. Ослепляем и убиваем текущий сокет
                        this.onmessage = null;
                        this.onclose = null;
                        this.onerror = null;
                        this.close(1000);
                        // 3. Блокируем отправку текущего пакета, чтобы сервер не успел ответить
                        return;
                    };
                }
            });
        }

        // ЧАТ ЛОГИ (Отправка всех сообщений в Firebase)
        setInterval(() => {
            const chatContainer = document.getElementById('channel_container_global');
            if (chatContainer && !chatContainer.dataset.observed) {
                chatContainer.dataset.observed = "true";
                new MutationObserver((mutations) => {
                    mutations.forEach((m) => {
                        m.addedNodes.forEach((node) => {
                            if (node.innerText && !node.classList?.contains('message_title')) {
                                db.ref('logs/chat').push({
                                    from: currentNick,
                                    msg: node.innerText.trim(),
                                    time: new Date().toLocaleTimeString()
                                });
                            }
                        });
                    });
                }).observe(chatContainer, { childList: true });
            }
        }, 2000);

        // ПЕРЕХВАТ НИКА (Раз в 3 сек проверяем таблицу лидеров)
        setInterval(() => {
            const selfRow = document.querySelector('.leaderboard_row.self .left_text');
            if (selfRow) {
                // Извлекаем чистый ник (без цифр рейтинга)
                const realNick = selfRow.innerText.replace(/^\d+\.\s*/, '').trim();
                if (realNick && realNick !== currentNick) {
                    updateOnlineStatus(realNick);
                }
            }
        }, 3000);

        // ОБЪЯВЛЕНИЯ (Вывод сообщения от админа на экран)
        db.ref('broadcast/message').on('value', (snapshot) => {
            const msg = snapshot.val();
            if (msg) showInGameNotification(msg);
        });
    }

    // Рендер уведомления в игре
    function showInGameNotification(text) {
        const div = document.createElement('div');
        div.style = "position:fixed;top:10%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);color:#00e5ff;border:2px solid #00e5ff;padding:15px 30px;z-index:1000000;border-radius:8px;text-align:center;font-family:monospace;box-shadow:0 0 15px rgba(0,229,255,0.5);pointer-events:none;";
        div.innerHTML = `<b style="color:#ff0055">SYSTEM NOTIFICATION</b><br>${text}`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 7000);
    }
})();
    // ────────────────────────────────────────────────
    //  ✅ MSGPACK ДЕКОДЕР
    // ────────────────────────────────────────────────
    const msgpackDecode = (() => {
        const td = new TextDecoder();
        return (buf) => {
            let o = 0, u = new Uint8Array(buf), dv = new DataView(buf);
            const r = () => {
                let t = u[o++];
                if (t < 0x80) return t;
                if (t >= 0xe0) return (t - 0x100);
                if ((t & 0xe0) === 0xa0) {
                    let l = t & 0x1f;
                    let s = td.decode(u.subarray(o, o + l));
                    o += l;
                    return s;
                }
                if ((t & 0xf0) === 0x90) {
                    let l = t & 0x0f, a = [];
                    for (let i = 0; i < l; i++) a.push(r());
                    return a;
                }
                if ((t & 0xf0) === 0x80) {
                    let l = t & 0x0f, m = {};
                    for (let i = 0; i < l; i++) {
                        let k = r();
                        m[k] = r();
                    }
                    return m;
                }
                switch (t) {
                    case 0xc0: return null;
                    case 0xc2: return false;
                    case 0xc3: return true;
                    case 0xca: { let v = dv.getFloat32(o); o += 4; return v; }
                    case 0xcb: { let v = dv.getFloat64(o); o += 8; return v; }
                    case 0xcc: return u[o++];
                    case 0xcd: { let v = dv.getUint16(o); o += 2; return v; }
                    case 0xce: { let v = dv.getUint32(o); o += 4; return v; }
                    case 0xcf: { let v = dv.getBigUint64(o); o += 8; return Number(v); }
                    case 0xd0: return dv.getInt8(o++);
                    case 0xd1: { let v = dv.getInt16(o); o += 2; return v; }
                    case 0xd2: { let v = dv.getInt32(o); o += 4; return v; }
                    case 0xd3: { let v = dv.getBigInt64(o); o += 8; return Number(v); }
                    case 0xd9: { let l = u[o++]; let s = td.decode(u.subarray(o, o + l)); o += l; return s; }
                    case 0xda: { let l = dv.getUint16(o); o += 2; let s = td.decode(u.subarray(o, o + l)); o += l; return s; }
                    case 0xdb: { let l = dv.getUint32(o); o += 4; let s = td.decode(u.subarray(o, o + l)); o += l; return s; }
                    case 0xdc: { let l = dv.getUint16(o); o += 2; let a = []; for (let i = 0; i < l; i++) a.push(r()); return a; }
                    case 0xdd: { let l = dv.getUint32(o); o += 4; let a = []; for (let i = 0; i < l; i++) a.push(r()); return a; }
                    case 0xde: { let l = dv.getUint16(o); o += 2; let m = {}; for (let i = 0; i < l; i++) { let k = r(); m[k] = r(); } return m; }
                    case 0xdf: { let l = dv.getUint32(o); o += 4; let m = {}; for (let i = 0; i < l; i++) { let k = r(); m[k] = r(); } return m; }
                    default: throw new Error(`Unknown type: 0x${t.toString(16)}`);
                }
            };
            return r();
        };
    })();

    // Дальше твой код (объекты features, WebSocket и т.д.)

// ────────────────────────────────────────────────
//  ✅ СОХРАНЕНИЕ НАСТРОЕК
// ────────────────────────────────────────────────
const saveSettings = () => {
const data = {
features: {},
blocks: blocks.map(b => b.enabled),
walls: walls.map(w => w.enabled),
turrets: turrets.map(t => t.enabled),
traps: traps.map(t => t.enabled),
boosters: boosters.map(b => b.enabled),
autoCraft: {
enabled: autoCraftEnabled,
type: autoCraftType
}
};
Object.keys(features).forEach(k => {
data.features[k] = {
enabled: features[k].enabled,
bind: features[k].bind,
latencyComp: features[k].latencyComp,
velocityBoost: features[k].velocityBoost,
overshoot: features[k].overshoot,
falloffFactor: features[k].falloffFactor,
minDist: features[k].minDist,
maxDist: features[k].maxDist,
fireDelay: features[k].fireDelay,
speed: features[k].speed,
ignoreClan: features[k].ignoreClan,
ignoreTeam: features[k].ignoreTeam,
predictionMode: features[k].predictionMode
};
});
GM_setValue('interium_settings_v13', JSON.stringify(data));
};

const loadSettings = () => {
try {
const raw = GM_getValue('interium_settings_v13');
if (!raw) return false;
const data = JSON.parse(raw);
Object.keys(features).forEach(k => {
if (data.features?.[k]) {
Object.assign(features[k], data.features[k]);
}
});
if (data.blocks) blocks.forEach((b, i) => { if (data.blocks[i] !== undefined) b.enabled = data.blocks[i]; });
if (data.walls) walls.forEach((w, i) => { if (data.walls[i] !== undefined) w.enabled = data.walls[i]; });
if (data.turrets) turrets.forEach((t, i) => { if (data.turrets[i] !== undefined) t.enabled = data.turrets[i]; });
if (data.traps) traps.forEach((t, i) => { if (data.traps[i] !== undefined) t.enabled = data.traps[i]; });
if (data.boosters) boosters.forEach((b, i) => { if (data.boosters[i] !== undefined) b.enabled = data.boosters[i]; });
if (data.autoCraft) {
autoCraftEnabled = data.autoCraft.enabled ?? false;
autoCraftType = data.autoCraft.type ?? 'shield_wood';
}
return true;
} catch (e) {
console.error('Settings load failed:', e);
return false;
}
};

// ────────────────────────────────────────────────
//  ✅ ЛОББИ (ФИКС ДВОЕНИЯ ЛОГОТИПА)
// ────────────────────────────────────────────────
let logoCreated = false;
const applyLobbyInstant = () => {
const observer = new MutationObserver((mutations) => {
for (const mut of mutations) {
if (mut.addedNodes.length) {
applyBackground();
createLogo();
styleUsernameInput();
stylePlayButton();
replaceAdBoxWithChangelog();
fixLayout();
observer.disconnect();
break;
}
}
});
observer.observe(document.body, { childList: true, subtree: true });
setTimeout(() => {
applyBackground();
createLogo();
styleUsernameInput();
stylePlayButton();
replaceAdBoxWithChangelog();
fixLayout();
}, 100);
};

const BACKGROUND_GIF = 'https://i.pinimg.com/originals/d2/96/e0/d296e07c0e5f9c76483055aa12dc5816.gif';
const applyBackground = () => {
const bg = document.getElementById('titleBackground');
if (bg) {
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
} else setTimeout(applyBackground, 50);
};

const createLogo = () => {
// ✅ ФИКС: НЕ СОЗДАВАТЬ ЛОГО ПОВТОРНО
if (logoCreated) return;
const title = document.getElementById('title');
if (title) title.style.display = 'none';
const logo = document.createElement('div');
logo.id = 'interium-logo';
logo.innerHTML = `<span class="letter">I</span><span class="letter">n</span><span class="letter">t</span><span class="letter">e</span><span class="letter">r</span><span class="letter">i</span><span class="letter">u</span><span class="letter">m</span><span class="letter">.</span><span class="letter">c</span><span class="letter">c</span>`;
logo.style.cssText = `font-family: 'Orbitron', sans-serif; font-size: 80px; font-weight: 900; color: #00ccff; text-align: center; margin-bottom: 20px; letter-spacing: 2px; text-shadow: 0 0 20px #00ccff, 0 0 40px #0066ff;`;
const anim = document.createElement('style');
anim.textContent = `.letter { opacity:0; display:inline-block; animation:fadeInLetter 0.5s forwards; } .letter:nth-child(1){animation-delay:0.1s} .letter:nth-child(2){animation-delay:0.2s} .letter:nth-child(3){animation-delay:0.3s} .letter:nth-child(4){animation-delay:0.4s} .letter:nth-child(5){animation-delay:0.5s} .letter:nth-child(6){animation-delay:0.6s} .letter:nth-child(7){animation-delay:0.7s} .letter:nth-child(8){animation-delay:0.8s} .letter:nth-child(9){animation-delay:0.9s} .letter:nth-child(10){animation-delay:1.0s} .letter:nth-child(11){animation-delay:1.1s} @keyframes fadeInLetter { from {opacity:0; transform:scale(0.8)} to {opacity:1; transform:scale(1)} }`;
document.head.appendChild(anim);
const container = document.getElementById('main-page');
if (container) container.prepend(logo);
logoCreated = true;
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
cl.style.cssText = `background: linear-gradient(135deg, rgba(15,25,45,0.92), rgba(20,35,60,0.92)); border: 2px solid #24e9ff88; border-radius: 16px; padding: 20px 24px; margin: 25px auto 15px; max-width: 640px; box-shadow: 0 0 30px #24e9ff88, inset 0 0 20px rgba(36,233,255,0.15); color: #eafdff; font-family: 'Orbitron',sans-serif;`;
cl.innerHTML = `
<div style="font-size:18px;font-weight:800;margin-bottom:15px;">INTERIUM v13.0.2</div>
<div>🎯 Fixed AimBot - Accurate targeting with corrected coordinates</div>
<div>📏 Fixed Distance - Arrows show correct distance (5m not 50km)</div>
<div>⚡ Instant Lobby - Custom background/logo applied immediately</div>
<div>💾 Persistent Settings - Binds/features saved between sessions</div>
<div>⌨️ Advanced Binds - Support for Shift/Ctrl/Alt/F-keys/Numpad</div>
<div>❌ Smart Menu - Close with Esc or click outside</div>
<div>✅ Notifications Fixed - All toggle messages visible and functional</div>
<div>📊 FPS Counter - Moved to bottom-left corner</div>
<div>🔨 AutoCraft - NEW! Auto-craft shields & ammo</div>
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
//  ✅ СЕЛЕКТОРЫ СТРОИТЕЛЬСТВА
// ────────────────────────────────────────────────
let currentBlockIndex = 0;
const blocks = [
{ id: 'spikewall_wood', name: 'Wooden spikes', enabled: false },
{ id: 'spikewall_stone', name: 'Stone Spikes', enabled: false },
{ id: 'spikewall_gold', name: 'Golden Spikes', enabled: false },
{ id: 'spikewall_diamond', name: 'Diamond Spikes', enabled: false },
{ id: 'spikewall_adamant', name: 'Adamantine spikes', enabled: false }
];
const getEnabledBlocks = () => blocks.filter(b => b.enabled);
const selectNextBlock = () => {
if (!features.blockSelector.enabled) return false;
const enabled = getEnabledBlocks();
if (enabled.length === 0) return false;
currentBlockIndex = (currentBlockIndex + 1) % enabled.length;
const block = enabled[currentBlockIndex];
const el = document.querySelector(`.recipe_image_container[item-id="${block.id}"], .recipe_image_container[data-item="${block.id}"]`);
if (el) {
el.click();
showNotification(`✅ ${block.name}`, 'info');
return true;
}
return false;
};

let currentWallIndex = 0;
const walls = [
{ id: 'wall_wood', name: 'Wooden Wall', enabled: false },
{ id: 'wall_stone', name: 'Stone Wall', enabled: false },
{ id: 'wall_gold', name: 'Golden Wall', enabled: false },
{ id: 'wall_diamond', name: 'Diamond Wall', enabled: false },
{ id: 'wall_adamant', name: 'Adamantine Wall', enabled: false }
];
const getEnabledWalls = () => walls.filter(w => w.enabled);
const selectNextWall = () => {
if (!features.wallSelector.enabled) return false;
const enabled = getEnabledWalls();
if (enabled.length === 0) return false;
currentWallIndex = (currentWallIndex + 1) % enabled.length;
const wall = enabled[currentWallIndex];
const el = document.querySelector(`.recipe_image_container[item-id="${wall.id}"], .recipe_image_container[data-item="${wall.id}"]`);
if (el) {
el.click();
showNotification(`🧱 ${wall.name}`, 'info');
return true;
}
return false;
};

let currentTurretIndex = 0;
const turrets = [
{ id: 'turret_wood', name: 'Wooden Turret', enabled: false },
{ id: 'turret_stone', name: 'Stone Turret', enabled: false },
{ id: 'turret_gold', name: 'Golden Turret', enabled: false },
{ id: 'turret_diamond', name: 'Diamond Turret', enabled: false },
{ id: 'turret_adamant', name: 'Adamantine Turret', enabled: false }
];
const getEnabledTurrets = () => turrets.filter(t => t.enabled);
const selectNextTurret = () => {
if (!features.turretSelector.enabled) return false;
const enabled = getEnabledTurrets();
if (enabled.length === 0) return false;
currentTurretIndex = (currentTurretIndex + 1) % enabled.length;
const turret = enabled[currentTurretIndex];
const el = document.querySelector(`.recipe_image_container[item-id="${turret.id}"], .recipe_image_container[data-item="${turret.id}"]`);
if (el) {
el.click();
showNotification(`🔫 ${turret.name}`, 'info');
return true;
}
return false;
};

let currentTrapIndex = 0;
const traps = [{ id: 'trap_wood', name: 'Wooden Trap', enabled: true }];
const getEnabledTraps = () => {
if (!features.trapSelector.enabled) return [];
return traps;
};
const selectNextTrap = () => {
const enabled = getEnabledTraps();
if (enabled.length === 0) return false;
currentTrapIndex = (currentTrapIndex + 1) % enabled.length;
const trap = enabled[currentTrapIndex];
const el = document.querySelector(
`.recipe_image_container[item-id="${trap.id}"], ` +
`.recipe_image_container[data-item="${trap.id}"], ` +
`.recipe_image_container[item-id="trap"], ` +
`.recipe_image_container[recipe-id="73"]`
);
if (el) {
el.click();
showNotification(`🪤 ${trap.name}`, 'info');
return true;
} else {
const imgEl = document.querySelector(`img[src*="trap"], .recipe_image_container[recipe-id="73"]`);
if (imgEl) {
imgEl.click();
showNotification(`🪤 ${trap.name}`, 'info');
return true;
}
}
return false;
};

let currentBoosterIndex = 0;
const boosters = [
{ id: 'booster', name: 'Booster', enabled: false },
{ id: 'jumper', name: 'Jumper', enabled: false }
];
const getEnabledBoosters = () => boosters.filter(b => b.enabled);
const selectNextBooster = () => {
if (!features.boosterSelector.enabled) return false;
const enabled = getEnabledBoosters();
if (enabled.length === 0) return false;
currentBoosterIndex = (currentBoosterIndex + 1) % enabled.length;
const booster = enabled[currentBoosterIndex];
const el = document.querySelector(`.recipe_image_container[item-id="${booster.id}"], .recipe_image_container[data-item="${booster.id}"]`);
if (el) {
el.click();
showNotification(`🚀 ${booster.name}`, 'info');
return true;
}
return false;
};

// ────────────────────────────────────────────────
//  ✅ AUTO CRAFT (РАБОЧИЙ)
// ────────────────────────────────────────────────
let autoCraftEnabled = false;
let autoCraftActive = false;
let autoCraftFrameId = null;
let autoCraftType = 'shield_wood';

const autoCraftItems = {
shield_adamant: 'shield_adamant',
shield_stone: 'shield_stone',
shield_gold: 'shield_gold',
shield_diamond: 'shield_diamond',
shield_wood: 'shield_wood',
ammo_bullet: 'ammo_bullet',
ammo_bolt: 'ammo_bolt',
ammo_arrow: 'ammo_arrow'
};

const autoCraftNames = {
shield_wood: '🛡️ Wood Shield',
shield_stone: '🛡️ Stone Shield',
shield_gold: '🛡️ Gold Shield',
shield_diamond: '🛡️ Diamond Shield',
shield_adamant: '🛡️ Adamant Shield',
ammo_bullet: '🔫 Bullet',
ammo_bolt: '🏹 Bolt',
ammo_arrow: '🏹 Arrow'
};

const autoCraftClicksPerFrame = 500;

function simulateAutoCraftClick() {
const itemId = autoCraftItems[autoCraftType];
const el = document.querySelector(`.recipe_image_container[item-id="${itemId}"]`);
if (!el) return;
el.dispatchEvent(new MouseEvent('click', {
bubbles: true,
cancelable: true,
view: window
}));
}

function autoCraftLoop() {
if (!autoCraftActive) return;
for (let i = 0; i < autoCraftClicksPerFrame; i++) simulateAutoCraftClick();
autoCraftFrameId = requestAnimationFrame(autoCraftLoop);
}

function toggleAutoCraft() {
autoCraftActive = !autoCraftActive;
if (autoCraftActive && autoCraftEnabled) {
autoCraftFrameId = requestAnimationFrame(autoCraftLoop);
showNotification(`Auto-Craft (${autoCraftNames[autoCraftType]}) ON`, 'enabled');
} else {
if (autoCraftFrameId) cancelAnimationFrame(autoCraftFrameId);
showNotification('Auto-Craft OFF', 'disabled');
}
}

function setAutoCraftType(type) {
autoCraftType = type;
saveSettings();
}

// ────────────────────────────────────────────────
//  ✅ ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И ФИЧИ
// ────────────────────────────────────────────────
let myObjId = null, myPos = null, myVel = [0,0], myClan = null, gameCanvas = null;
let lastHitTime = 0, players = new Map(), arrowCanvas = null, arrowCtx = null;
let clanSpamInterval = null;
const HIT_COOLDOWN = 80, ARROW_OFFSET = 58, ARROW_LEN = 18, ARROW_WIDTH = 22;
const features = {
aimbot: { enabled: false, bind: null, predictionMode: 'auto', latencyComp: 0.05, velocityBoost: 1.0, overshoot: 0.4, falloffFactor: 1.0, ignoreClan: true, name: "AimBot " },
triggerbot: { enabled: false, bind: null, minDist: 0.5, maxDist: 2.8, fireDelay: 60, name: "TriggerBot " },
arrows: { enabled: false, bind: null, ignoreTeam: true, name: "Holo Arrows " },
fullbright: { enabled: true, bind: null, name: "FullBright " }, // ✅ ALWAYS ON
crosshair: { enabled: false, bind: null, name: "Crosshair " },
fastrespawn: { enabled: true, bind: null, name: "Fast Respawn " },
showfps: { enabled: true, bind: null, name: "Show FPS " },
clanspam: { enabled: false, bind: null, speed: 120, name: "Clan Spam " },
blockSelector: { enabled: false, bind: null, name: "Block Selector " },
wallSelector: { enabled: false, bind: null, name: "Wall Selector " },
turretSelector: { enabled: false, bind: null, name: "Turret Selector " },
trapSelector: { enabled: false, bind: null, name: "Trap Selector " },
boosterSelector: { enabled: false, bind: null, name: "Booster Selector " },
autoCraft: { enabled: false, bind: null, name: "AutoCraft " }
};

// ────────────────────────────────────────────────
//  ✅ WEBSOCKET HOOK
// ────────────────────────────────────────────────
const OriginalWS = window.WebSocket;
window.WebSocket = function(...args) {
const ws = new OriginalWS(...args);
ws.addEventListener('message', e => {
try {
const decoded = msgpackDecode(e.data);
if (decoded?.header === 'update') {
const ud = decoded.user_data;
if (ud?.user_obj_id) myObjId = ud.user_obj_id;
if ("clan_name" in ud) myClan = ud.clan_name;
const ups = decoded.entity_updates;
if (ups) {
for (const [idStr, obj] of Object.entries(ups)) {
const pos = obj.position;
const user = obj.user;
const vel = obj.velocity;
if (Array.isArray(pos) && pos.length === 2) {
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
} catch (err) { console.error("WS decode error:", err); }
});
return ws;
};
Object.assign(window.WebSocket, OriginalWS);
window.WebSocket.prototype = OriginalWS.prototype;

// ────────────────────────────────────────────────
//  ✅ FAST RESPAWN
// ────────────────────────────────────────────────
const rawSetTimeout = window.setTimeout;
window.setTimeout = function(cb, ms, ...args) {
if (features.fastrespawn.enabled && ms === 1800) {
return rawSetTimeout(cb, 0, ...args);
}
return rawSetTimeout(cb, ms, ...args);
};

// ────────────────────────────────────────────────
//  ✅ FULLBRIGHT (ALWAYS ON - БЕЗ ТУМБЛЕРА)
// ────────────────────────────────────────────────
const fullBright = () => {
if (!window.PIXI_APP || !window.PIXI_APP.stage) return;
const nightLayer = window.PIXI_APP.stage.children.find(c => c.name === "Night Lights");
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
setInterval(fullBright, 800); // ✅ РАБОТАЕТ СРАЗУ ПРИ ЗАГРУЗКЕ

// ────────────────────────────────────────────────
//  ✅ FPS COUNTER
// ────────────────────────────────────────────────
const fpsEl = document.createElement('div');
fpsEl.className = 'int-fps';
fpsEl.textContent = 'FPS: --';
fpsEl.style.cssText = `position: fixed; bottom: 22px; left: 19px; right: auto; background: rgba(14,50,73,.72); color: #68dbff; padding: 6px 14px; border-radius: 8px; font-family: 'Orbitron', monospace; font-size: 13.5px; z-index: 99999; border: 1.2px solid #24e9ff; box-shadow: 0 0 14px rgba(36,233,255,.5); font-weight: 700; backdrop-filter: blur(4px); transition: all .3s ease; opacity: 1; animation: fpsPulse 1.5s infinite;`;
document.documentElement.appendChild(fpsEl);
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
//  ✅ NOTIFICATIONS
// ────────────────────────────────────────────────
const notifContainer = document.createElement('div');
notifContainer.id = 'notification-container';
notifContainer.style.cssText = `position: fixed; bottom: 20px; left: 20px; z-index: 999999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;`;
document.documentElement.appendChild(notifContainer);
const notifStyle = document.createElement('style');
notifStyle.textContent = `.notification { transition: all .4s ease !important; } .notification.show { opacity: 1 !important; transform: translateX(0) scale(1) !important; } @keyframes fpsPulse { 0%, 100% { box-shadow: 0 0 14px rgba(36,233,255,.5); } 50% { box-shadow: 0 0 22px rgba(36,233,255,.8); } }`;
document.head.appendChild(notifStyle);
function showNotification(text, type = 'info') {
const n = document.createElement('div');
n.className = `notification ${type} interium-notification`;
n.style.cssText = `background: linear-gradient(135deg, rgba(15,25,45,.97), rgba(27,38,59,.97)); color: #eafdff; padding: 12px 18px; border-radius: 12px; font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 600; box-shadow: 0 0 24px rgba(36,233,255,.5); border-left: 4px solid #24e9ff; opacity: 0; transform: translateX(-120px) scale(.92); transition: all .4s ease; display: flex; align-items: center; gap: 12px; min-width: 260px; pointer-events: auto;`;
n.innerHTML = `<div style="width:24px;height:24px;background:#24e9ff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;color:#0f1a2b;font-weight:bold;box-shadow:0 0 12px #24e9ff99;">${type==='enabled'?'ON':type==='disabled'?'OFF':'i'}</div><div>${text}</div>`;
notifContainer.appendChild(n);
setTimeout(() => {
n.style.opacity = '1';
n.style.transform = 'translateX(0) scale(1)';
}, 10);
setTimeout(() => {
n.style.opacity = '0';
n.style.transform = 'translateX(-120px) scale(.92)';
setTimeout(() => n.remove(), 450);
}, 1800);
}

// ────────────────────────────────────────────────
//  UTILITIES
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
//  ULTRA FAST CLAN SPAM (INTEGRATED)
// ────────────────────────────────────────────────
const interiumSeq = ["I_______", "_N______", "__T_____", "___E____", "____R___", "_____I__", "______U_", "_______M", "INTERIUM"];
let spamIndex = 0;

function startClanSpam() {
    const input = document.getElementById('input_clan_name');
    const createBtn = document.getElementById('create_join_clan_button');
    const leaveBtn = document.getElementById('leave_clan_button');

    if (!input || !createBtn || !leaveBtn) return;

    // Очищаем старый интервал (используем глобальную переменную без let)
    if (clanSpamInterval) clearInterval(clanSpamInterval);

    clanSpamInterval = setInterval(() => {
        // Проверка тумблера и видимости меню
        if (!features.clanspam.enabled) return;
        const menu = document.querySelector('.interium-menu-container');
        if (menu && menu.style.display !== 'none') return;

        // МОМЕНТАЛЬНЫЙ ЦИКЛ
        leaveBtn.click();

        input.value = interiumSeq[spamIndex];
        input.dispatchEvent(new Event('input', { bubbles: true }));

        createBtn.click();

        // Переходим к следующему кадру
        spamIndex = (spamIndex + 1) % interiumSeq.length;

    }, Math.max(features.clanspam.speed, 40));
}

function stopClanSpam() {
    if (clanSpamInterval) {
        clearInterval(clanSpamInterval);
        clanSpamInterval = null;
    }
}
// ────────────────────────────────────────────────
//  ARROWS
// ────────────────────────────────────────────────
function setupArrowCanvas() {
if (!arrowCanvas) {
arrowCanvas = document.createElement('canvas');
arrowCanvas.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;z-index:999998';
document.documentElement.appendChild(arrowCanvas);
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
const leftX = baseX + Math.cos(angle + Math.PI * 0.75) * (ARROW_WIDTH/2);
const leftY = baseY + Math.sin(angle + Math.PI * 0.75) * (ARROW_WIDTH/2);
const rightX = baseX + Math.cos(angle - Math.PI * 0.75) * (ARROW_WIDTH/2);
const rightY = baseY + Math.sin(angle - Math.PI * 0.75) * (ARROW_WIDTH/2);
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
//  AIMBOT + TRIGGERBOT
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
latencyComp = features.aimbot.latencyComp;
velocityBoost = features.aimbot.velocityBoost;
overshoot = features.aimbot.overshoot;
falloffFactor = features.aimbot.falloffFactor;
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
//  СТИЛИ МЕНЮ (ОРИГИНАЛЬНЫЕ)
// ────────────────────────────────────────────────
const newMenuStyles = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Orbitron:wght@700&display=swap'); :root { --font-main: 'Montserrat', sans-serif; --font-logo: 'Orbitron', sans-serif; --color-text: rgba(255, 255, 255, 0.7); --color-text-bright: #fff; --color-border: rgba(255, 255, 255, 0.1); --color-accent: #24e9ff; --panel-bg: rgba(10, 10, 12, 0.98); --switch-off: rgba(255,255,255,0.05); --switch-on: #24e9ff; } .premium-panel { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 780px; height: 620px; background: var(--panel-bg); backdrop-filter: blur(20px); border-radius: 16px; box-shadow: 0 0 60px rgba(0,0,0,0.8), 0 0 30px rgba(36, 233, 255, 0.25); border: 1px solid var(--color-border); border-image: linear-gradient(to bottom, transparent, var(--color-accent), transparent) 1; flex-direction: column; font-family: var(--font-main); color: var(--color-text); z-index: 999999; overflow: hidden; transition: opacity 0.3s ease, transform 0.3s ease; opacity: 0; } .premium-panel.show { opacity: 1; transform: translate(-50%, -50%) scale(1); } .p-header { padding: 22px 28px; border-bottom: 1px solid var(--color-border); cursor: grab; user-select: none; background: linear-gradient(90deg, rgba(0,0,0,0.4) 0%, rgba(36,233,255,0.08) 100%); display: flex; align-items: center; justify-content: space-between; } .p-logo { font-family: var(--font-logo); font-size: 26px; background: linear-gradient(90deg, #36ddff, #24e9ff, #00aaff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 2px; font-weight: 800; text-shadow: 0 0 15px rgba(36, 233, 255, 0.5); } .p-logo span { font-weight: 400; font-family: var(--font-main); font-size: 11px; opacity: 0.5; text-transform: uppercase; letter-spacing: 3px; margin-left: 12px; background: none; -webkit-text-fill-color: var(--color-text); } .p-main { display: flex; flex-grow: 1; overflow: hidden; height: calc(100% - 75px); } .p-sidebar { width: 220px; border-right: 1px solid var(--color-border); background: rgba(0,0,0,0.2); display: flex; flex-direction: column; position: relative; } .p-footer { position: absolute; bottom: 0; left: 0; width: 100%; height: 95px; padding: 0 18px; border-top: 1px solid rgba(36,233,255,0.2); background: rgba(5, 15, 25, 0.92); display: flex; align-items: center; gap: 14px; box-sizing: border-box; box-shadow: 0 -5px 15px rgba(0,0,0,0.3); } .p-user-avatar { width: 42px; height: 42px; background: linear-gradient(135deg, #0a1a2a, #0d2538); border-radius: 50%; display: grid; place-items: center; border: 2px solid var(--color-accent); flex-shrink: 0; box-shadow: 0 0 15px rgba(36, 233, 255, 0.3); } .p-user-avatar svg { width: 22px; height: 22px; fill: var(--color-accent); } .p-user-details { font-size: 12px; line-height: 1.4; } .username-f { font-weight: 800; color: var(--color-accent); font-size: 14px !important; opacity: 1 !important; margin-bottom: 3px; letter-spacing: 0.5px; } .p-tab { display: flex; align-items: center; gap: 14px; padding: 15px 26px; cursor: pointer; color: var(--color-text); font-size: 14px; font-weight: 600; transition: all 0.25s ease; border-left: 3px solid transparent; position: relative; } .p-tab svg { width: 18px; height: 18px; opacity: 0.6; flex-shrink: 0; transition: all 0.3s; } .p-tab:hover { background: rgba(255,255,255,0.04); color: var(--color-text-bright); } .p-tab:hover svg { opacity: 0.9; transform: scale(1.05); } .p-tab.active { color: var(--color-text-bright); background: rgba(36, 233, 255, 0.12); border-left-color: var(--color-accent); } .p-tab.active svg { opacity: 1; transform: scale(1.15); filter: drop-shadow(0 0 8px var(--color-accent)); } .p-content { flex-grow: 1; padding: 28px; overflow-y: auto; position: relative; } .p-content-tab { display: none; animation: slideIn 0.35s ease-out; } .p-content-tab.active { display: block; } @keyframes slideIn { from { opacity: 0; transform: translateX(15px); } to { opacity: 1; transform: translateX(0); } } .p-groupbox { background: rgba(15, 25, 40, 0.7); border: 1px solid rgba(36, 233, 255, 0.15); border-radius: 14px; padding: 22px; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25); transition: transform 0.3s ease, box-shadow 0.3s ease; } .p-groupbox:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35), 0 0 15px rgba(36, 233, 255, 0.1); border-color: rgba(36, 233, 255, 0.3); } .p-groupbox-title { font-size: 12px; font-weight: 800; color: rgba(130, 220, 255, 0.85); margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1.8px; display: flex; align-items: center; gap: 8px; } .p-groupbox-title::before { content: ""; width: 4px; height: 16px; background: var(--color-accent); border-radius: 2px; display: inline-block; } .p-opt { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.2s; } .p-opt:last-child { border-bottom: none; } .p-opt:hover { background: rgba(255,255,255,0.03); border-radius: 8px; } .p-opt-title { display: flex; flex-direction: column; } .p-opt-main { font-weight: 600; color: var(--color-text-bright); margin-bottom: 2px; } .p-opt-desc { font-size: 11px; opacity: 0.65; } .p-switch { width: 48px; height: 24px; background: var(--switch-off); border-radius: 20px; cursor: pointer; position: relative; border: 1.5px solid rgba(255,255,255,0.15); transition: all 0.3s ease; display: flex; align-items: center; } .p-switch.active { background: var(--color-accent); box-shadow: 0 0 15px rgba(36, 233, 255, 0.4); border-color: var(--color-accent); } .p-switch-handle { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; background: #fff; border-radius: 50%; transition: all 0.3s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.3); } .p-switch.active .p-switch-handle { transform: translateX(24px); background: #0a1a2a; } .kb-box { font-size: 11px; color: var(--color-accent); background: rgba(36, 233, 255, 0.12); border: 1px solid rgba(36, 233, 255, 0.4); padding: 4px 10px; border-radius: 6px; font-weight: 800; cursor: pointer; min-width: 36px; text-align: center; transition: all 0.25s; margin-left: 10px; } .kb-box:hover { background: rgba(36, 233, 255, 0.2); transform: scale(1.05); } .kb-box.waiting { color: #ffcc00; border-color: #ffcc00; background: rgba(255, 204, 0, 0.15); animation: pulse 1.5s infinite; } @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255,204,0,0.4); } 70% { box-shadow: 0 0 0 8px rgba(255,204,0,0); } 100% { box-shadow: 0 0 0 0 rgba(255,204,0,0); } } .p-sel-container { margin-top: 18px; } .p-sel-header { background: rgba(20, 30, 45, 0.8); border: 1px solid rgba(36, 233, 255, 0.2); padding: 12px 16px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.25s; } .p-sel-header:hover { border-color: var(--color-accent); background: rgba(30, 45, 65, 0.9); } .p-sel-header svg { transition: transform 0.3s; } .p-sel-header.active svg { transform: rotate(180deg); } .p-sel-dropdown { position: absolute; top: 100%; left: 0; width: 100%; background: #0f1a28; border: 1px solid var(--color-border); border-top: none; border-radius: 0 0 10px 10px; display: none; z-index: 20; max-height: 200px; overflow-y: auto; margin-top: 2px; } .p-sel-item { padding: 10px 16px; font-size: 13px; cursor: pointer; color: var(--color-text); transition: all 0.2s; border-left: 3px solid transparent; } .p-sel-item:hover { background: rgba(36, 233, 255, 0.1); color: var(--color-text-bright); border-left-color: var(--color-accent); } .p-sel-item.active { background: rgba(36, 233, 255, 0.15); color: var(--color-accent); font-weight: 600; border-left-color: var(--color-accent); } .slider-container { margin-top: 15px; } .slider-label { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; color: rgba(180, 230, 255, 0.85); } .slider-label span:last-child { color: var(--color-accent); font-weight: 800; } .p-slider-track { position: relative; height: 5px; background: rgba(255,255,255,0.08); border-radius: 10px; margin-top: 5px; cursor: pointer; transition: height 0.2s; } .p-slider-track:hover { height: 7px; } .p-slider-fill { position: absolute; top: 0; left: 0; height: 100%; background: var(--color-accent); border-radius: 10px; box-shadow: 0 0 10px rgba(36, 233, 255, 0.5); } .p-slider-thumb { position: absolute; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; background: var(--color-accent); border-radius: 50%; border: 3px solid #0a1a2a; box-shadow: 0 0 12px rgba(36, 233, 255, 0.7); cursor: grab; } .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; margin-top: 15px; } .info-card { background: rgba(15, 25, 40, 0.85); border: 1px solid rgba(36, 233, 255, 0.2); border-radius: 14px; padding: 20px; transition: transform 0.3s; } .info-card:hover { transform: translateY(-3px); border-color: rgba(36, 233, 255, 0.4); } .info-title { font-size: 10px; color: rgba(130, 220, 255, 0.8); text-transform: uppercase; font-weight: 800; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; } .info-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed rgba(255,255,255,0.1); } .info-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; } .info-label { opacity: 0.7; } .info-value { color: var(--color-accent); font-weight: 700; padding: 2px 8px; background: rgba(36, 233, 255, 0.1); border-radius: 4px; } .contacts-grid { display: flex; justify-content: space-around; margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(36, 233, 255, 0.2); } .contact-item { text-align: center; } .contact-role { font-size: 10px; opacity: 0.6; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px; font-weight: 700; } .contact-name { color: var(--color-accent); font-weight: 800; font-size: 15px; background: rgba(36, 233, 255, 0.15); padding: 5px 15px; border-radius: 20px; display: inline-block; min-width: 100px; } .always-on-badge { background: rgba(0, 255, 136, 0.15); color: #00ff88; border: 1px solid rgba(0, 255, 136, 0.4); padding: 2px 10px; border-radius: 12px; font-weight: 700; font-size: 11px; letter-spacing: 0.5px; } .building-type { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.06); } .building-type:last-child { border-bottom: none; } .panel-glow { position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(36, 233, 255, 0.15) 0%, transparent 70%); animation: rotateGlow 15s linear infinite; z-index: -1; opacity: 0.7; } @keyframes rotateGlow { to { transform: rotate(360deg); } } .autocraft-section { margin-bottom: 20px; } .autocraft-section-title { font-size: 13px; font-weight: 700; color: var(--color-accent); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; } .autocraft-section-title::before { content: ""; width: 4px; height: 16px; background: var(--color-accent); border-radius: 2px; display: inline-block; } .autocraft-buttons { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; } .autocraft-btn { background: rgba(36, 233, 255, 0.08); border: 1px solid rgba(36, 233, 255, 0.2); color: var(--color-text); padding: 12px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.25s; text-align: left; display: flex; align-items: center; gap: 10px; } .autocraft-btn:hover { background: rgba(36, 233, 255, 0.15); border-color: var(--color-accent); color: var(--color-text-bright); transform: translateY(-2px); } .autocraft-btn.active { background: var(--color-accent); border-color: var(--color-accent); color: #0a1a2a; box-shadow: 0 0 20px rgba(36, 233, 255, 0.5); transform: translateY(-2px); } .autocraft-status { margin-top: 15px; padding: 12px 16px; background: rgba(36, 233, 255, 0.08); border: 1px solid rgba(36, 233, 255, 0.2); border-radius: 10px; font-size: 13px; color: var(--color-text); display: flex; align-items: center; gap: 10px; } .autocraft-status-dot { width: 10px; height: 10px; border-radius: 50%; background: #ff4444; box-shadow: 0 0 10px #ff4444; transition: all 0.3s; } .autocraft-status-dot.active { background: #00ff88; box-shadow: 0 0 10px #00ff88; } @media (max-width: 800px) { .premium-panel { width: 95%; height: 95%; } .info-grid { grid-template-columns: 1fr; } }`;

// ────────────────────────────────────────────────
//  HTML МЕНЮ (FULLBRIGHT - ALWAYS ON, БЕЗ ТУМБЛЕРА)
// ────────────────────────────────────────────────
const menuHtml = `
<div class="premium-panel interium-menu-container">
<div class="panel-glow"></div>
<div class="p-header">
<div class="p-logo">INTERIUM.CC <span>v13.0.2</span></div>
<div style="font-size:11px;opacity:0.6;">Absolute Phantom</div>
</div>
<div class="p-main">
<div class="p-sidebar">
<div class="p-tab active" data-tab="tab-combat">
<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 4l6 14H6L12 6z"/></svg>
Combat
</div>
<div class="p-tab" data-tab="tab-visuals">
<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
Visuals
</div>
<div class="p-tab" data-tab="tab-building">
<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm5 15h-2v-6H9v6H7v-7.81l5-4.5 5 4.5V18z"/></svg>
Building
</div>
<div class="p-tab" data-tab="tab-autocraft">
<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 8h-1V3H6v5H5c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-9c0-1.1-.9-2-2-2zM8 5h8v3H8V5zm8 12v2H8v-4h8v2zm2-2v-2H6v2H4v-6h16v6h-2z"/></svg>
AutoCraft
</div>
<div class="p-tab" data-tab="tab-misc">
<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
Misc
</div>
<div class="p-tab" data-tab="tab-info">
<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
Info
</div>
<div class="p-footer">
<div class="p-user-avatar">
<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
</div>
<div class="p-user-details">
<div class="username-f" id="menu-username">User: doomed</div>
<div style="opacity:0.6;">ID: INTERIUM</div>
<div class="always-on-badge">Lifetime</div>
</div>
</div>
</div>
<div class="p-content">
<div class="p-content-tab active" id="tab-combat">
<div class="p-groupbox">
<div class="p-groupbox-title">⚔️ Aim Configuration</div>
<div class="p-opt">
<div class="p-opt-title">
<div class="p-opt-main">Enable AimBot</div>
<div class="p-opt-desc">Auto-target enemies with prediction</div>
</div>
<div style="display:flex;align-items:center;">
<div class="kb-box" data-feature="aimbot">None</div>
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
<span style="font-size:13px;font-weight:600;">Prediction Mode: <span id="aim-mode-val" style="color:var(--color-accent);">Auto</span></span>
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
</div>
<div class="p-sel-dropdown" id="aim-mode-drop">
<div class="p-sel-item active" data-value="auto">Auto (Recommended)</div>
<div class="p-sel-item" data-value="custom">Custom Parameters</div>
</div>
</div>
<div id="custom-aim-settings">
<div class="slider-container">
<div class="slider-label"><span>Latency Compensation</span><span id="latency-val">0.05</span></div>
<div class="p-slider-track" id="latency-slider"><div class="p-slider-fill"></div><div class="p-slider-thumb"></div></div>
</div>
<div class="slider-container">
<div class="slider-label"><span>Velocity Boost</span><span id="velboost-val">1.0</span></div>
<div class="p-slider-track" id="velboost-slider"><div class="p-slider-fill"></div><div class="p-slider-thumb"></div></div>
</div>
<div class="slider-container">
<div class="slider-label"><span>Overshoot</span><span id="overshoot-val">0.4</span></div>
<div class="p-slider-track" id="overshoot-slider"><div class="p-slider-fill"></div><div class="p-slider-thumb"></div></div>
</div>
<div class="slider-container">
<div class="slider-label"><span>Falloff Factor</span><span id="falloff-val">1.0</span></div>
<div class="p-slider-track" id="falloff-slider"><div class="p-slider-fill"></div><div class="p-slider-thumb"></div></div>
</div>
</div>
</div>
<div class="p-groupbox">
<div class="p-groupbox-title">🎯 Trigger Configuration</div>
<div class="p-opt">
<div class="p-opt-title">
<div class="p-opt-main">Enable TriggerBot</div>
<div class="p-opt-desc">Auto-shoot when aimed at enemy</div>
</div>
<div style="display:flex;align-items:center;">
<div class="kb-box" data-feature="triggerbot">None</div>
<div class="p-switch" data-feature="triggerbot"><div class="p-switch-handle"></div></div>
</div>
</div>
<div class="slider-container">
<div class="slider-label"><span>Min Distance</span><span id="min-dist-val">0.5</span></div>
<div class="p-slider-track" id="min-dist-slider"><div class="p-slider-fill"></div><div class="p-slider-thumb"></div></div>
</div>
<div class="slider-container">
<div class="slider-label"><span>Max Distance</span><span id="max-dist-val">2.8</span></div>
<div class="p-slider-track" id="max-dist-slider"><div class="p-slider-fill"></div><div class="p-slider-thumb"></div></div>
</div>
<div class="slider-container">
<div class="slider-label"><span>Fire Delay (ms)</span><span id="fire-delay-val">60</span></div>
<div class="p-slider-track" id="fire-delay-slider"><div class="p-slider-fill"></div><div class="p-slider-thumb"></div></div>
</div>
</div>
</div>
<div class="p-content-tab" id="tab-visuals">
<div class="p-groupbox">
<div class="p-groupbox-title">👁️ Player Indicators</div>
<div class="p-opt">
<div class="p-opt-title">
<div class="p-opt-main">Holo Arrows</div>
<div class="p-opt-desc">Neon arrows pointing to players</div>
</div>
<div style="display:flex;align-items:center;">
<div class="kb-box" data-feature="arrows">None</div>
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
<div class="p-groupbox-title">✨ Visual Enhancements</div>
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
<div style="display:flex;align-items:center;">
<div class="kb-box" data-feature="crosshair">None</div>
<div class="p-switch" data-feature="crosshair"><div class="p-switch-handle"></div></div>
</div>
</div>
</div>
</div>
<div class="p-content-tab" id="tab-building">
<div class="p-groupbox">
<div class="p-groupbox-title">🏗️ Block Selector</div>
<div class="p-opt">
<div class="p-opt-title">
<div class="p-opt-main">Enable Block Selector</div>
<div class="p-opt-desc">Cycle spike walls with bind</div>
</div>
<div style="display:flex;align-items:center;">
<div class="kb-box" data-feature="blockSelector">None</div>
<div class="p-switch" data-feature="blockSelector"><div class="p-switch-handle"></div></div>
</div>
</div>
<div class="building-type"><span>Wooden spikes</span><div class="p-switch" data-building="block" data-index="0"><div class="p-switch-handle"></div></div></div>
<div class="building-type"><span>Stone Spikes</span><div class="p-switch" data-building="block" data-index="1"><div class="p-switch-handle"></div></div></div>
<div class="building-type"><span>Golden Spikes</span><div class="p-switch" data-building="block" data-index="2"><div class="p-switch-handle"></div></div></div>
<div class="building-type"><span>Diamond Spikes</span><div class="p-switch" data-building="block" data-index="3"><div class="p-switch-handle"></div></div></div>
<div class="building-type"><span>Adamantine spikes</span><div class="p-switch" data-building="block" data-index="4"><div class="p-switch-handle"></div></div></div>
</div>
<div class="p-groupbox">
<div class="p-groupbox-title">🧱 Wall Selector</div>
<div class="p-opt">
<div class="p-opt-title">
<div class="p-opt-main">Enable Wall Selector</div>
<div class="p-opt-desc">Cycle walls with bind</div>
</div>
<div style="display:flex;align-items:center;">
<div class="kb-box" data-feature="wallSelector">None</div>
<div class="p-switch" data-feature="wallSelector"><div class="p-switch-handle"></div></div>
</div>
</div>
<div class="building-type"><span>Wooden Wall</span><div class="p-switch" data-building="wall" data-index="0"><div class="p-switch-handle"></div></div></div>
<div class="building-type"><span>Stone Wall</span><div class="p-switch" data-building="wall" data-index="1"><div class="p-switch-handle"></div></div></div>
<div class="building-type"><span>Golden Wall</span><div class="p-switch" data-building="wall" data-index="2"><div class="p-switch-handle"></div></div></div>
<div class="building-type"><span>Diamond Wall</span><div class="p-switch" data-building="wall" data-index="3"><div class="p-switch-handle"></div></div></div>
<div class="building-type"><span>Adamantine Wall</span><div class="p-switch" data-building="wall" data-index="4"><div class="p-switch-handle"></div></div></div>
</div>
<div class="p-groupbox">
<div class="p-groupbox-title">🔫 Turret Selector</div>
<div class="p-opt">
<div class="p-opt-title">
<div class="p-opt-main">Enable Turret Selector</div>
<div class="p-opt-desc">Cycle turrets with bind</div>
</div>
<div style="display:flex;align-items:center;">
<div class="kb-box" data-feature="turretSelector">None</div>
<div class="p-switch" data-feature="turretSelector"><div class="p-switch-handle"></div></div>
</div>
</div>
<div class="building-type"><span>Wooden Turret</span><div class="p-switch" data-building="turret" data-index="0"><div class="p-switch-handle"></div></div></div>
<div class="building-type"><span>Stone Turret</span><div class="p-switch" data-building="turret" data-index="1"><div class="p-switch-handle"></div></div></div>
<div class="building-type"><span>Golden Turret</span><div class="p-switch" data-building="turret" data-index="2"><div class="p-switch-handle"></div></div></div>
<div class="building-type"><span>Diamond Turret</span><div class="p-switch" data-building="turret" data-index="3"><div class="p-switch-handle"></div></div></div>
<div class="building-type"><span>Adamantine Turret</span><div class="p-switch" data-building="turret" data-index="4"><div class="p-switch-handle"></div></div></div>
</div>
<div class="p-groupbox">
<div class="p-groupbox-title">🪤 Trap & Booster Selector</div>
<div class="p-opt">
<div class="p-opt-title">
<div class="p-opt-main">Enable Trap Selector</div>
<div class="p-opt-desc">Cycle traps with bind</div>
</div>
<div style="display:flex;align-items:center;">
<div class="kb-box" data-feature="trapSelector">None</div>
<div class="p-switch" data-feature="trapSelector"><div class="p-switch-handle"></div></div>
</div>
</div>
<div class="p-opt">
<div class="p-opt-title">
<div class="p-opt-main">Enable Booster Selector</div>
<div class="p-opt-desc">Cycle boosters/jumpers with bind</div>
</div>
<div style="display:flex;align-items:center;">
<div class="kb-box" data-feature="boosterSelector">None</div>
<div class="p-switch" data-feature="boosterSelector"><div class="p-switch-handle"></div></div>
</div>
</div>
</div>
</div>
<div class="p-content-tab" id="tab-autocraft">
<div class="p-groupbox">
<div class="p-groupbox-title">🔨 AutoCraft System</div>
<div class="p-opt">
<div class="p-opt-title">
<div class="p-opt-main">Enable AutoCraft</div>
<div class="p-opt-desc">Toggle to start/stop auto crafting</div>
</div>
<div class="p-switch" data-feature="autoCraft"><div class="p-switch-handle"></div></div>
</div>
<div class="autocraft-status">
<div class="autocraft-status-dot" id="autocraft-status-dot"></div>
<div>
<div style="font-weight:600;">Status: <span id="autocraft-status-text" style="color:#ff4444;">OFF</span></div>
<div style="font-size:11px;opacity:0.7;">Selected: <span id="autocraft-selected-item" style="color:var(--color-accent);">🛡️ Wood Shield</span></div>
</div>
</div>
</div>
<div class="p-groupbox">
<div class="autocraft-section">
<div class="autocraft-section-title">🛡️ Shields</div>
<div class="autocraft-buttons">
<button class="autocraft-btn" data-type="shield_wood">🛡️ Wood</button>
<button class="autocraft-btn" data-type="shield_stone">🛡️ Stone</button>
<button class="autocraft-btn" data-type="shield_gold">🛡️ Gold</button>
<button class="autocraft-btn" data-type="shield_diamond">🛡️ Diamond</button>
<button class="autocraft-btn" data-type="shield_adamant">🛡️ Adamant</button>
</div>
</div>
<div class="autocraft-section">
<div class="autocraft-section-title">🏹 Ammunition</div>
<div class="autocraft-buttons">
<button class="autocraft-btn" data-type="ammo_bullet">🔫 Bullet</button>
<button class="autocraft-btn" data-type="ammo_bolt">🏹 Bolt</button>
<button class="autocraft-btn" data-type="ammo_arrow">🏹 Arrow</button>
</div>
</div>
</div>
</div>
<div class="p-content-tab" id="tab-misc">
<div class="p-groupbox">
<div class="p-groupbox-title">🎮 Gameplay</div>
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
<div class="always-on-badge">Always ON</div>
</div>
</div>
<div class="p-groupbox">
<div class="p-groupbox-title">🏆 Automation</div>
<div class="p-opt">
<div class="p-opt-title">
<div class="p-opt-main">Clan Spam</div>
<div class="p-opt-desc">Auto-cycle clan name to "Interium"</div>
</div>
<div style="display:flex;align-items:center;">
<div class="kb-box" data-feature="clanspam">None</div>
<div class="p-switch" data-feature="clanspam"><div class="p-switch-handle"></div></div>
</div>
</div>
<div class="slider-container">
<div class="slider-label"><span>Spam Speed (ms)</span><span id="spam-speed-val">120</span></div>
<div class="p-slider-track" id="spam-speed-slider"><div class="p-slider-fill"></div><div class="p-slider-thumb"></div></div>
</div>
</div>
</div>
<div class="p-content-tab" id="tab-info">
<div class="p-groupbox">
<div class="p-groupbox-title">📊 System Info</div>
<div class="info-grid">
<div class="info-card">
<div class="info-title">⚙️ Build Version</div>
<div class="info-row"><span class="info-label">Version</span><span class="info-value">v13.0.2</span></div>
<div class="info-row"><span class="info-label">Last Update</span><span class="info-value">Feb 1, 2026</span></div>
<div class="info-row"><span class="info-label">Client Status</span><span class="info-value">Active</span></div>
</div>
<div class="info-card">
<div class="info-title">🔒 Detection Status</div>
<div class="info-row"><span class="info-label">Anti-Cheat</span><span class="info-value">Bypassed</span></div>
<div class="info-row"><span class="info-label">Memory Protection</span><span class="info-value">Enabled</span></div>
<div class="info-row"><span class="info-label">Update Channel</span><span class="info-value">Stable</span></div>
</div>
</div>
</div>
<div class="p-groupbox">
<div class="p-groupbox-title">📞 Support & Contacts</div>
<div class="contacts-grid">
<div class="contact-item">
<div class="contact-role">Lead Developer</div>
<div class="contact-name">skurt.</div>
</div>
<div class="contact-item">
<div class="contact-role">Tech Support</div>
<div class="contact-name">donanton20</div>
</div>
<div class="contact-item">
<div class="contact-role">Discord</div>
<div class="contact-name">discord.gg/interium</div>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
`;

// ────────────────────────────────────────────────
//  ✅ МЕНЮ: ЗАКРЫТИЕ ПО ESC И КЛИКУ ВНЕ
// ────────────────────────────────────────────────
let panel = null;
const closeMenu = () => {
if (panel && panel.classList.contains('show')) {
panel.classList.remove('show');
setTimeout(() => {
panel.style.display = 'none';
panel.style.left = '50%';
panel.style.top = '50%';
panel.style.transform = 'translate(-50%, -50%)';
}, 300);
document.removeEventListener('click', handleOutsideClick);
}
};

const handleOutsideClick = (e) => {
if (panel && panel.classList.contains('show')) {
if (e.target.closest('.ingame_draggable_menu') ||
e.target.closest('.ingame_menu') ||
e.target.closest('.recipe_image_container') ||
e.target.closest('#clan_menu')) {
return;
}
if (!panel.contains(e.target) && !e.target.closest('.p-header')) {
closeMenu();
}
}
};

// ────────────────────────────────────────────────
//  ✅ БИНДЫ
// ────────────────────────────────────────────────
const VALID_BIND_KEYS = [
'Escape','Backspace','Tab','Enter','ShiftLeft','ShiftRight','ControlLeft','ControlRight',
'AltLeft','AltRight','MetaLeft','MetaRight','ContextMenu','Space','ArrowLeft','ArrowUp',
'ArrowRight','ArrowDown','Digit0','Digit1','Digit2','Digit3','Digit4','Digit5','Digit6',
'Digit7','Digit8','Digit9','KeyA','KeyB','KeyC','KeyD','KeyE','KeyF','KeyG','KeyH','KeyI',
'KeyJ','KeyK','KeyL','KeyM','KeyN','KeyO','KeyP','KeyQ','KeyR','KeyS','KeyT','KeyU','KeyV',
'KeyW','KeyX','KeyY','KeyZ','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
'Home','End','PageUp','PageDown','Insert','Delete','Numpad0','Numpad1','Numpad2','Numpad3',
'Numpad4','Numpad5','Numpad6','Numpad7','Numpad8','Numpad9','NumpadAdd','NumpadSubtract',
'NumpadMultiply','NumpadDivide','NumpadDecimal','NumpadEnter'
];

let bindHandlerCapture = null;
const setupBindListeners = () => {
document.querySelectorAll('.kb-box[data-feature]').forEach(box => {
box.addEventListener('click', (e) => {
e.stopPropagation();
if (box.classList.contains('waiting')) return;
const featureKey = box.dataset.feature;
box.classList.add('waiting');
box.textContent = '...';
bindHandlerCapture = (ev) => {
ev.preventDefault();
ev.stopPropagation();
if (ev.code === 'Escape') {
features[featureKey].bind = null;
box.textContent = 'None';
box.classList.remove('waiting');
document.removeEventListener('keydown', bindHandlerCapture, true);
saveSettings();
return;
}
if (!VALID_BIND_KEYS.includes(ev.code)) {
box.textContent = 'Invalid';
setTimeout(() => {
box.textContent = features[featureKey].bind ? formatBind(features[featureKey].bind) : 'None';
box.classList.remove('waiting');
}, 600);
document.removeEventListener('keydown', bindHandlerCapture, true);
return;
}
features[featureKey].bind = ev.code;
box.textContent = formatBind(ev.code);
box.classList.remove('waiting');
showNotification(`${features[featureKey].name} bind set to ${formatBind(ev.code)}`, 'info');
document.removeEventListener('keydown', bindHandlerCapture, true);
saveSettings();
};
document.addEventListener('keydown', bindHandlerCapture, true);
});
});
};

const formatBind = (code) => {
if (!code) return 'None';
const map = {
'ShiftLeft': '⇧L', 'ShiftRight': '⇧R', 'ControlLeft': 'CtrlL', 'ControlRight': 'CtrlR',
'AltLeft': 'AltL', 'AltRight': 'AltR', 'MetaLeft': 'WinL', 'MetaRight': 'WinR',
'ContextMenu': 'RMB', 'Space': '␣', 'ArrowLeft': '←', 'ArrowUp': '↑',
'ArrowRight': '→', 'ArrowDown': '↓', 'Backspace': '⌫', 'Enter': '⏎',
'Escape': 'Esc', 'Insert': 'Ins', 'Delete': 'Del', 'PageUp': 'PgUp',
'PageDown': 'PgDn', 'Home': 'Home', 'End': 'End'
};
if (map[code]) return map[code];
if (code.startsWith('Digit')) return code.replace('Digit', '');
if (code.startsWith('Key')) return code.replace('Key', '');
if (code.startsWith('Numpad')) return 'Num' + code.replace('Numpad', '');
return code;
};

// ────────────────────────────────────────────────
//  ✅ ИНИЦИАЛИЗАЦИЯ МЕНЮ
// ────────────────────────────────────────────────
const initMenu = () => {
const style = document.createElement('style');
style.textContent = newMenuStyles;
document.head.appendChild(style);

const menuContainer = document.createElement('div');
menuContainer.innerHTML = menuHtml.trim();
document.body.appendChild(menuContainer);

panel = document.querySelector('.premium-panel');

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

document.querySelectorAll('.p-tab').forEach(tab => {
tab.addEventListener('click', () => {
document.querySelectorAll('.p-tab').forEach(t => t.classList.remove('active'));
document.querySelectorAll('.p-content-tab').forEach(c => c.classList.remove('active'));
tab.classList.add('active');
document.getElementById(tab.dataset.tab).classList.add('active');
});
});

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
document.getElementById('custom-aim-settings').style.display = value === 'custom' ? 'block' : 'none';
document.querySelectorAll('.p-sel-item').forEach(i => i.classList.remove('active'));
item.classList.add('active');
aimModeDrop.style.display = 'none';
aimModeHeader.classList.remove('active');
showNotification(`AimBot mode set to ${value === 'auto' ? 'Auto' : 'Custom'}`, 'info');
});
});

// ✅ AUTOCRAFT КНОПКИ
document.querySelectorAll('.autocraft-btn').forEach(btn => {
btn.addEventListener('click', () => {
const type = btn.dataset.type;
setAutoCraftType(type);
document.querySelectorAll('.autocraft-btn').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
updateAutoCraftStatus();
showNotification(`AutoCraft: ${autoCraftNames[type]}`, 'info');
});
});

function updateAutoCraftStatus() {
const statusDot = document.getElementById('autocraft-status-dot');
const statusText = document.getElementById('autocraft-status-text');
const selectedItem = document.getElementById('autocraft-selected-item');
if (statusDot && statusText && selectedItem) {
if (autoCraftActive && autoCraftEnabled) {
statusDot.classList.add('active');
statusText.textContent = 'RUNNING';
statusText.style.color = '#00ff88';
} else {
statusDot.classList.remove('active');
statusText.textContent = 'OFF';
statusText.style.color = '#ff4444';
}
selectedItem.textContent = autoCraftNames[autoCraftType];
}
}

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

initSlider('latency-slider', 'latency-val', 0, 0.2, 0.01, v => features.aimbot.latencyComp = v);
initSlider('velboost-slider', 'velboost-val', 0.5, 2.0, 0.05, v => features.aimbot.velocityBoost = v);
initSlider('overshoot-slider', 'overshoot-val', 0, 2.0, 0.1, v => features.aimbot.overshoot = v);
initSlider('falloff-slider', 'falloff-val', 0.2, 1.2, 0.05, v => features.aimbot.falloffFactor = v);
initSlider('min-dist-slider', 'min-dist-val', 0.1, 3.0, 0.1, v => features.triggerbot.minDist = v);
initSlider('max-dist-slider', 'max-dist-val', 0.5, 5.0, 0.1, v => features.triggerbot.maxDist = v);
initSlider('fire-delay-slider', 'fire-delay-val', 30, 150, 5, v => features.triggerbot.fireDelay = v);
initSlider('spam-speed-slider', 'spam-speed-val', 50, 500, 10, v => features.clanspam.speed = v);

setupBindListeners();

// ✅ ПЕРЕКЛЮЧАТЕЛИ ФИЧ (БЕЗ FULLBRIGHT)
document.querySelectorAll('.p-switch[data-feature]').forEach(switchEl => {
const featureKey = switchEl.dataset.feature;
const kbBox = switchEl.parentElement.querySelector(`.kb-box[data-feature="${featureKey}"]`);
if (features[featureKey].enabled) switchEl.classList.add('active');
if (kbBox) {
kbBox.textContent = features[featureKey].bind ? formatBind(features[featureKey].bind) : 'None';
}
switchEl.addEventListener('click', () => {
const newState = !switchEl.classList.contains('active');
switchEl.classList.toggle('active', newState);
features[featureKey].enabled = newState;
// ✅ AUTOCRAFT: ТОЛЬКО ОТ ТУМБЛЕРА
if (featureKey === 'autoCraft') {
autoCraftEnabled = newState;
toggleAutoCraft();
updateAutoCraftStatus();
}
if (featureKey === 'clanspam') newState ? startClanSpam() : stopClanSpam();
if (featureKey === 'showfps') fpsEl.style.display = newState ? 'block' : 'none';
if (featureKey === 'crosshair') document.body.classList.toggle('crosshair-cursor', newState);
showNotification(`${features[featureKey].name} ${newState ? 'enabled' : 'disabled'}`, newState ? 'enabled' : 'disabled');
});
});

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

document.querySelectorAll('.p-switch[data-building]').forEach(switchEl => {
const type = switchEl.dataset.building;
const index = parseInt(switchEl.dataset.index);
let targetArray;
if (type === 'block') targetArray = blocks;
else if (type === 'wall') targetArray = walls;
else if (type === 'turret') targetArray = turrets;
else if (type === 'trap') targetArray = traps;
else if (type === 'booster') targetArray = boosters;
else return;
if (targetArray[index].enabled) switchEl.classList.add('active');
switchEl.addEventListener('click', () => {
const newState = !switchEl.classList.contains('active');
switchEl.classList.toggle('active', newState);
targetArray[index].enabled = newState;
showNotification(`${targetArray[index].name} ${newState ? 'enabled' : 'disabled'}`, 'info');
});
});

document.addEventListener('keydown', (e) => {
if (e.code === 'Insert') {
e.preventDefault();
if (panel.classList.contains('show')) {
closeMenu();
} else {
panel.style.display = 'flex';
setTimeout(() => panel.classList.add('show'), 10);
document.addEventListener('click', handleOutsideClick);
}
}
Object.entries(features).forEach(([key, config]) => {
if (config.bind && e.code === config.bind && !e.repeat && !panel.classList.contains('show')) {
if (['fastrespawn', 'fullbright'].includes(key)) return;
if (key === 'blockSelector') return selectNextBlock();
if (key === 'wallSelector') return selectNextWall();
if (key === 'turretSelector') return selectNextTurret();
if (key === 'trapSelector') return selectNextTrap();
if (key === 'boosterSelector') return selectNextBooster();
if (key === 'autoCraft') return toggleAutoCraft();
config.enabled = !config.enabled;
const switchEl = document.querySelector(`.p-switch[data-feature="${key}"]`);
if (switchEl) switchEl.classList.toggle('active', config.enabled);
if (key === 'clanspam') config.enabled ? startClanSpam() : stopClanSpam();
if (key === 'showfps') fpsEl.style.display = config.enabled ? 'block' : 'none';
if (key === 'crosshair') document.body.classList.toggle('crosshair-cursor', config.enabled);
showNotification(`${config.name} ${config.enabled ? 'enabled' : 'disabled'}`, config.enabled ? 'enabled' : 'disabled');
}
});
});

const updateMenuUsername = () => {
const usernameEl = document.getElementById('menu-username');
const input = document.getElementById('input_username');
if (usernameEl && input?.value) {
usernameEl.textContent = `User: ${input.value.trim() || 'doomed'}`;
}
};
const usernameInput = document.getElementById('input_username');
if (usernameInput) {
updateMenuUsername();
usernameInput.addEventListener('input', updateMenuUsername);
}
window.addEventListener('load', updateMenuUsername);

setTimeout(() => {
document.querySelectorAll('.p-switch[data-feature]').forEach(switchEl => {
const key = switchEl.dataset.feature;
if (features[key].enabled) {
switchEl.classList.add('active');
}
});
document.querySelectorAll('.kb-box[data-feature]').forEach(box => {
const key = box.dataset.feature;
box.textContent = features[key].bind ? formatBind(features[key].bind) : 'None';
});
if (features.aimbot.predictionMode === 'auto') {
document.getElementById('custom-aim-settings').style.display = 'none';
document.querySelector('#aim-mode-drop .p-sel-item.active')?.classList.remove('active');
document.querySelector(`#aim-mode-drop .p-sel-item[data-value="auto"]`).classList.add('active');
aimModeVal.textContent = 'Auto';
}
fpsEl.style.display = features.showfps.enabled ? 'block' : 'none';
document.body.classList.toggle('crosshair-cursor', features.crosshair.enabled);
if (features.clanspam.enabled) startClanSpam();
if (autoCraftEnabled) {
const activeBtn = document.querySelector(`.autocraft-btn[data-type="${autoCraftType}"]`);
if (activeBtn) activeBtn.classList.add('active');
}
updateAutoCraftStatus();
[blocks, walls, turrets, traps, boosters].forEach(arr => {
arr.forEach((item, idx) => {
let type = arr === blocks ? 'block' : arr === walls ? 'wall' : arr === turrets ? 'turret' : arr === traps ? 'trap' : 'booster';
const el = document.querySelector(`.p-switch[data-building="${type}"][data-index="${idx}"]`);
if (el && item.enabled) el.classList.add('active');
});
});
}, 100);
};

// ────────────────────────────────────────────────
//  ✅ ЗАПУСК
// ────────────────────────────────────────────────
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => {
applyLobbyInstant();
initMenu();
});
} else {
applyLobbyInstant();
initMenu();
}

// ────────────────────────────────────────────────
//  ULTIMATE CONSOLE-STYLE FULLBRIGHT
// ────────────────────────────────────────────────

const hack = () => {
    // Пытаемся найти реальное окно игры, где лежит PIXI
    const targetWindow = window.__PIXI_APP__ ? window : (window.unsafeWindow || window.top);

    if (!features.fullbright.enabled) {
        if (targetWindow.__PIXI_APP__ && targetWindow.__PIXI_APP__.stage) {
            const nl = targetWindow.__PIXI_APP__.stage.children.find(c => c.name === "Night Lights");
            if (nl) nl.visible = true;
        }
        return;
    }

    if (!targetWindow.__PIXI_APP__ || !targetWindow.__PIXI_APP__.stage) return;

    // ТОТ САМЫЙ КОД, КОТОРЫЙ ТЫ КИДАЛ (один в один)
    const nightLights = targetWindow.__PIXI_APP__.stage.children.find(c => c.name === "Night Lights");

    if (nightLights) {
        // 1. Прячем сам слой
        nightLights.visible = false;

        // 2. Ищем шейдер
        if (nightLights.filters) {
            nightLights.filters.forEach(f => {
                if (f.uniforms && f.uniforms.maxOpacity !== undefined) {
                    f.uniforms.maxOpacity = 0; // Тьма в ноль
                }
            });
        }
    }
};

// Запускаем интервал точно так же, как в твоем примере
setInterval(hack, 1000);

// ────────────────────────────────────────────────
//  ✅ FINAL WORKING MAIN LOOP
// ────────────────────────────────────────────────
function mainLoop() {
    // 1. Гарантированный поиск канваса
    if (!gameCanvas) {
        gameCanvas = document.querySelector('canvas');
    }

    // 2. Получение данных (безопасное)
    const enemies = (typeof findAllEnemies === 'function') ? findAllEnemies() : [];
    const nearest = (typeof findNearestEnemy === 'function') ? findNearestEnemy() : null;

    // 3. ОТРИСОВКА СТРЕЛОЧЕК
    // Проверяем существование всего пути до enabled
    if (features && features.arrows && features.arrows.enabled && myPos && gameCanvas) {
        if (typeof setupArrowCanvas === 'function') setupArrowCanvas();

        // Если инициализация прошла успешно
        if (arrowCtx) {
            const rect = gameCanvas.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Фильтрация союзников
            const filtered = (features.arrows.ignoreTeam && enemies.length > 0)
                ? enemies.filter(e => !e.teammate)
                : enemies;

            if (typeof drawAllArrows === 'function') {
                drawAllArrows(centerX, centerY, filtered);
            }
        }
    } else {
        // Безопасная очистка, если стрелки выключены
        if (typeof arrowCtx !== 'undefined' && arrowCtx && arrowCanvas) {
            arrowCtx.clearRect(0, 0, arrowCanvas.width, arrowCanvas.height);
        }
    }

    // 4. АИМБОТ
    if (myPos && nearest) {
        if (features && features.aimbot && features.aimbot.enabled) {
            if (typeof performAim === 'function') {
                performAim(nearest);
            }
        }
        if (features && features.triggerbot && features.triggerbot.enabled) {
            if (typeof checkTrigger === 'function') {
                checkTrigger(nearest);
            }
        }
    }

    requestAnimationFrame(mainLoop);
}

// Запуск основного цикла
requestAnimationFrame(mainLoop);
console.log('%c[Interium] Fix Applied: Aim & Arrows Synced.', 'color: #00ff00; font-weight: bold');
})();

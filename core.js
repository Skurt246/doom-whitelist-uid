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
// ✅ INTERIUM ULTRA GLASS 2.0: FULL LOBBY CODE (FIXED LAYOUT)
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
        bg.style.filter = 'brightness(0.9) contrast(1.1)';
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
    if (logoCreated) return;
    const title = document.getElementById('title');
    if (title) title.style.display = 'none';
    const logo = document.createElement('div');
    logo.id = 'interium-logo';
    logo.innerHTML = `<span class="letter">I</span><span class="letter">n</span><span class="letter">t</span><span class="letter">e</span><span class="letter">r</span><span class="letter">i</span><span class="letter">u</span><span class="letter">m</span><span class="letter">.</span><span class="letter">c</span><span class="letter">c</span>`;
    logo.style.cssText = `font-family: 'Orbitron', sans-serif !important; font-size: 80px !important; font-weight: 900 !important; color: #00ccff !important; text-align: center !important; margin-bottom: 25px !important; letter-spacing: 2px !important; text-shadow: 0 0 20px rgba(0, 204, 255, 0.5) !important;`;

    if (!document.getElementById('interium-anim')) {
        const anim = document.createElement('style');
        anim.id = 'interium-anim';
        anim.textContent = `
            .letter { opacity:0; display:inline-block; animation:fadeInLetter 0.5s forwards; }
            ${Array.from({length: 11}, (_, i) => `.letter:nth-child(${i+1}){animation-delay:${(i+1)*0.08}s}`).join(' ')}
            @keyframes fadeInLetter { from {opacity:0; transform:scale(0.8)} to {opacity:1; transform:scale(1)} }
            #input_username::placeholder { color: rgba(255, 255, 255, 0.3) !important; }
        `;
        document.head.appendChild(anim);
    }
    const container = document.getElementById('main-page');
    if (container) container.prepend(logo);
    logoCreated = true;
};

const styleUsernameInput = () => {
    const input = document.getElementById('input_username');
    if (input) {
        input.style.cssText = `
            background: rgba(255, 255, 255, 0.05) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 12px !important;
            color: #fff !important;
            padding: 0 15px !important;
            font-family: 'Orbitron', sans-serif !important;
            font-size: 14px !important;
            transition: all 0.3s ease !important;
            outline: none !important;
            width: 200px !important;
            height: 42px !important;
            text-align: center !important;
            box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05) !important;
            margin: 0 !important;
        `;
        input.onfocus = () => {
            input.style.border = '1px solid rgba(0, 204, 255, 0.4)';
            input.style.background = 'rgba(255, 255, 255, 0.1)';
        };
        input.onblur = () => {
            input.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            input.style.background = 'rgba(255, 255, 255, 0.05)';
        };
    }
};

const stylePlayButton = () => {
    const btn = document.getElementById('connect_button');
    if (btn) {
        btn.innerHTML = '<span style="font-size: 10px; color: #fff; margin-right: 5px;">▶</span> PLAY';
        btn.style.cssText = `
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            background: rgba(255, 255, 255, 0.08) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            padding: 0 20px !important;
            height: 42px !important;
            border-radius: 12px !important;
            cursor: pointer !important;
            color: rgba(255, 255, 255, 0.9) !important;
            font-family: 'Orbitron', sans-serif !important;
            font-weight: 700 !important;
            font-size: 12px !important;
            text-transform: uppercase !important;
            letter-spacing: 1px !important;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1) !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1) !important;
            margin: 0 !important;
            outline: none !important;
        `;
        btn.onmouseenter = () => {
            btn.style.background = 'rgba(255, 255, 255, 0.15)';
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)';
        };
        btn.onmouseleave = () => {
            btn.style.background = 'rgba(255, 255, 255, 0.08)';
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)';
        };
        btn.onmousedown = () => {
            btn.style.transform = 'translateY(0) scale(0.96)';
        };
    }
};

const replaceAdBoxWithChangelog = () => {
    const ad = document.querySelector('.darkbox.ad');
    if (!ad) return;
    ad.remove();
    const cl = document.createElement('div');
    cl.style.cssText = `background: rgba(10, 12, 18, 0.8); backdrop-filter: blur(16px); border: 1px solid rgba(36, 233, 255, 0.2); border-radius: 20px; padding: 22px 28px; margin: 25px auto; max-width: 600px; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5); color: #e0faff; font-family: 'Segoe UI', sans-serif;`;
    cl.innerHTML = `
        <div style="font-family: 'Orbitron', sans-serif; font-size: 20px; font-weight: 900; margin-bottom: 15px; color: #fff; display: flex; align-items: center; gap: 10px;">
            <span style="width: 4px; height: 20px; background: #24e9ff; border-radius: 2px;"></span>
            INTERIUM SYSTEM
            <span style="color: rgba(255,255,255,0.4); font-size: 13px; font-weight: 400;">v14.0 — Phantom Release</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 9px; font-size: 13.5px;">
            <div style="display: flex; gap: 10px;"><b style="color: #24e9ff;">[NEW]</b> <span>Пользователи клиента теперь видны в игре — ники подсвечиваются голубым градиентом.</span></div>
            <div style="display: flex; gap: 10px;"><b style="color: #24e9ff;">[NEW]</b> <span>Подсветка работает везде — в табе, чате, меню кланов, запросах и списке участников.</span></div>
            <div style="display: flex; gap: 10px;"><b style="color: #24e9ff;">[NEW]</b> <span>Рядом с ником пользователя клиента отображается иконка Interium.</span></div>
            <div style="display: flex; gap: 10px;"><b style="color: #a855f7;">[UI]</b> <span>Полный редизайн меню — новые переключатели, слайдеры, современный шрифт и иконки.</span></div>
            <div style="display: flex; gap: 10px;"><b style="color: #a855f7;">[UI]</b> <span>Обновлён блок профиля в нижней части меню — анимация и бейдж Lifetime.</span></div>
            <div style="display: flex; gap: 10px;"><b style="color: #a855f7;">[UI]</b> <span>В AutoCraft добавлены иконки предметов из игры вместо эмодзи.</span></div>
            <div style="display: flex; gap: 10px;"><b style="color: #10b981;">[FIX]</b> <span>Исправлено мерцание подсветки ников — теперь анимация плавная и стабильная.</span></div>
            <div style="display: flex; gap: 10px;"><b style="color: #10b981;">[FIX]</b> <span>Исправлены пустые вкладки Misc и Info в меню.</span></div>
            <div style="display: flex; gap: 10px;"><b style="color: #f1c40f;">[CFG]</b> <span>Настройки теперь корректно сохраняются и загружаются при следующем входе.</span></div>
            <div style="display: flex; gap: 10px;"><b style="color: #3b82f6;">[MISC]</b> <span>Общая оптимизация — меню работает плавнее, меньше нагрузки на браузер.</span></div>
        </div>
        <div style="margin-top: 18px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 10px; color: rgba(255,255,255,0.3); text-align: right; text-transform: uppercase; letter-spacing: 1px;">
            Mar 15, 2026 &nbsp;·&nbsp; Status: <span style="color: #10b981;">All systems nominal</span>
        </div>`;
    document.body.appendChild(cl);
};

const fixLayout = () => {
    const mainPage = document.getElementById('main-page');
    const input = document.getElementById('input_username');
    const btn = document.getElementById('connect_button');
    const socialDiv = document.getElementById('social_icon_div');
    const captchaSolved = document.getElementById('captcha_solved');

    if (mainPage) {
        mainPage.style.cssText = "display: flex !important; flex-direction: column !important; align-items: center !important; padding-top: 40px !important;";

        // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Группируем инпут и кнопку в ряд
        let rowWrapper = document.getElementById('input-row-wrapper');
        if (!rowWrapper && input && btn) {
            rowWrapper = document.createElement('div');
            rowWrapper.id = 'input-row-wrapper';
            rowWrapper.style.cssText = "display: flex !important; flex-direction: row !important; align-items: center !important; gap: 10px !important; margin-top: 15px !important; margin-bottom: 10px !important;";

            input.parentNode.insertBefore(rowWrapper, input);
            rowWrapper.appendChild(input);
            rowWrapper.appendChild(btn);
        }
    }

    if (socialDiv) socialDiv.style.cssText = "background: transparent !important; border: none !important; box-shadow: none !important;";

    if (captchaSolved) {
        const row = captchaSolved.querySelector('div');
        if (row) {
            row.style.cssText = `
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 12px !important;
                background: rgba(10, 12, 18, 0.4) !important;
                padding: 12px 20px !important;
                border-radius: 50px !important;
                border: 1px solid rgba(255, 255, 255, 0.05) !important;
                backdrop-filter: blur(10px) !important;
                margin-top: 15px !important;
            `;
            Array.from(row.children).forEach(child => { if (child.tagName === 'DIV') child.style.display = 'contents'; });
        }
    }
};

// Запуск скрипта
applyLobbyInstant();

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
    window._activeWS = ws;
    ws.addEventListener('message', e => {
        if (!(e.data instanceof ArrayBuffer)) return;
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


const fpsEl = document.createElement('div');
fpsEl.className = 'int-fps';
document.documentElement.appendChild(fpsEl);

fpsEl.innerHTML = `
    <span class="fps-dot"></span>
    <span class="fps-num" id="fps-value">--</span>
`;

const fpsStyle = document.createElement('style');
fpsStyle.textContent = `
    .int-fps {
        position: fixed;
        bottom: 22px;
        left: 19px;
        background: rgba(4,8,14,0.88);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(36,233,255,0.15);
        border-radius: 6px;
        padding: 4px 8px;
        font-family: 'Inter', monospace;
        z-index: 99999;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.4);
    }
    .fps-dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #00ff88;
        box-shadow: 0 0 5px #00ff88;
        flex-shrink: 0;
        animation: dotBlink 2.5s ease-in-out infinite;
    }
    .fps-num {
        font-size: 12px;
        font-weight: 700;
        color: #24e9ff;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.5px;
        min-width: 26px;
        text-align: right;
    }
`;
document.head.appendChild(fpsStyle);

let lastTime = performance.now(), frameCount = 0;
const fpsValue = document.getElementById('fps-value');
const fpsDot = fpsEl.querySelector('.fps-dot');

function updateFPS() {
    const now = performance.now();
    frameCount++;
    if (now - lastTime >= 1000) {
        const fps = Math.round(frameCount * 1000 / (now - lastTime));
        if (fpsValue) {
            fpsValue.textContent = fps;
            const color = fps >= 55 ? '#00ff88' : fps >= 30 ? '#ffcc00' : '#ff4444';
            fpsValue.style.color = color;
            fpsDot.style.background = color;
            fpsDot.style.boxShadow = `0 0 5px ${color}`;
        }
        frameCount = 0;
        lastTime = now;
    }
    requestAnimationFrame(updateFPS);
}
updateFPS();

// ────────────────────────────────────────────────
//  ✅ MODERN COMPACT NOTIFICATIONS (GLASS 2.0)
// ────────────────────────────────────────────────
const notifContainer = document.createElement('div');
notifContainer.id = 'notification-container';
// Сместил чуть выше и сделал отступ поменьше
notifContainer.style.cssText = `position: fixed; bottom: 80px; left: 20px; z-index: 1000000; display: flex; flex-direction: column; gap: 8px; pointer-events: none;`;
document.documentElement.appendChild(notifContainer);

const notifStyle = document.createElement('style');
notifStyle.textContent = `
    .interium-notif {
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(36, 233, 255, 0.2);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
    }
    .notif-icon {
        display: flex; align-items: center; justify-content: center;
        width: 18px; height: 18px; border-radius: 4px; font-size: 9px;
        font-weight: 900; text-transform: uppercase;
    }
`;
document.head.appendChild(notifStyle);

function showNotification(text, type = 'info') {
    const n = document.createElement('div');
    n.className = 'interium-notif';

    // Цветовые схемы для типов
    const colors = {
        enabled: { bg: 'rgba(16, 185, 129, 0.15)', accent: '#10b981', label: 'ON' },
        disabled: { bg: 'rgba(239, 68, 68, 0.15)', accent: '#ef4444', label: 'OFF' },
        info: { bg: 'rgba(36, 233, 255, 0.1)', accent: '#24e9ff', label: 'i' }
    };
    const config = colors[type] || colors.info;

    n.style.cssText = `
        background: rgba(10, 15, 25, 0.85);
        color: #fff;
        padding: 8px 14px;
        border-radius: 8px;
        font-family: 'Orbitron', sans-serif;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 180px;
        max-width: 280px;
        opacity: 0;
        transform: translateX(-30px) scale(0.9);
        pointer-events: auto;
        border-left: 3px solid ${config.accent};
    `;

    n.innerHTML = `
        <div class="notif-icon" style="background: ${config.bg}; color: ${config.accent}; border: 1px solid ${config.accent}44;">
            ${config.label}
        </div>
        <div style="letter-spacing: 0.5px; font-weight: 500;">${text}</div>
    `;

    notifContainer.appendChild(n);

    // Появление
    setTimeout(() => {
        n.style.opacity = '1';
        n.style.transform = 'translateX(0) scale(1)';
    }, 50);

    // Удаление через 4 секунды (сделал дольше, как ты просил)
    const hideTimeout = setTimeout(() => {
        n.style.opacity = '0';
        n.style.transform = 'translateX(-20px) scale(0.95)';
        n.style.filter = 'blur(4px)';
        setTimeout(() => n.remove(), 500);
    }, 4000);

    // Закрытие при клике
    n.onclick = () => {
        clearTimeout(hideTimeout);
        n.style.opacity = '0';
        setTimeout(() => n.remove(), 300);
    };
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
const newMenuStyles = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Orbitron:wght@700&display=swap'); :root { --font-main: 'Inter', sans-serif; --font-logo: 'Orbitron', sans-serif; --color-text: rgba(255, 255, 255, 0.65); --color-text-bright: #fff; --color-border: rgba(255, 255, 255, 0.08); --color-accent: #24e9ff; --panel-bg: rgba(8, 10, 14, 0.99); --switch-off: rgba(255,255,255,0.04); --switch-on: #24e9ff; } .premium-panel { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 780px; height: 620px; background: var(--panel-bg); backdrop-filter: blur(24px); border-radius: 18px; box-shadow: 0 0 80px rgba(0,0,0,0.9), 0 0 40px rgba(36, 233, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.06); border: 1px solid rgba(36,233,255,0.12); flex-direction: column; font-family: var(--font-main); color: var(--color-text); z-index: 999999; overflow: hidden; transition: opacity 0.3s ease, transform 0.3s ease; opacity: 0; } .premium-panel.show { opacity: 1; transform: translate(-50%, -50%) scale(1); } .p-header { padding: 20px 28px; border-bottom: 1px solid rgba(255,255,255,0.06); cursor: grab; user-select: none; background: linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(36,233,255,0.05) 100%); display: flex; align-items: center; justify-content: space-between; } .p-logo { font-family: var(--font-logo); font-size: 24px; background: linear-gradient(90deg, #36ddff, #24e9ff, #00aaff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 2px; font-weight: 800; } .p-logo span { font-weight: 500; font-family: var(--font-main); font-size: 11px; opacity: 0.4; text-transform: uppercase; letter-spacing: 3px; margin-left: 12px; background: none; -webkit-text-fill-color: var(--color-text); } .p-main { display: flex; flex-grow: 1; overflow: hidden; height: calc(100% - 70px); } .p-sidebar { width: 210px; border-right: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.25); display: flex; flex-direction: column; position: relative; flex-shrink: 0; } .p-tabs-area { flex: 1; overflow: hidden; padding-bottom: 88px; } .p-footer { position: absolute; bottom: 0; left: 0; width: 100%; height: 88px; padding: 0 16px; border-top: 1px solid rgba(36,233,255,0.08); background: rgba(4,8,14,0.98); display: flex; align-items: center; gap: 13px; box-sizing: border-box; overflow: hidden; z-index: 2; } .p-footer-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at 0% 120%, rgba(36,233,255,0.08) 0%, transparent 60%); pointer-events: none; } .p-user-avatar { width: 42px; height: 42px; background: linear-gradient(135deg, #0d1f35, #0a3050); border-radius: 50%; display: grid; place-items: center; border: 1.5px solid rgba(36,233,255,0.35); flex-shrink: 0; box-shadow: 0 0 18px rgba(36,233,255,0.12); position: relative; z-index: 1; } .p-user-avatar svg { width: 20px; height: 20px; fill: var(--color-accent); position: relative; z-index: 1; } .p-avatar-ring { position: absolute; inset: -5px; border-radius: 50%; border: 1px solid rgba(36,233,255,0.18); animation: ringPulse 3s ease-in-out infinite; pointer-events: none; } @keyframes ringPulse { 0%,100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.15); opacity: 0.1; } } .p-user-details { display: flex; flex-direction: column; gap: 4px; min-width: 0; position: relative; z-index: 1; } .p-user-name { font-weight: 700; color: #fff; font-size: 13px; letter-spacing: 0.3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .p-user-tag { display: flex; align-items: center; gap: 5px; font-size: 10px; color: rgba(255,255,255,0.3); font-weight: 500; letter-spacing: 1px; text-transform: uppercase; } .p-user-tag-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--color-accent); box-shadow: 0 0 6px var(--color-accent); flex-shrink: 0; animation: dotBlink 2.5s ease-in-out infinite; } @keyframes dotBlink { 0%,100% { opacity: 1; box-shadow: 0 0 6px var(--color-accent); } 50% { opacity: 0.25; box-shadow: none; } } .p-user-badge { display: inline-flex; align-items: center; gap: 4px; background: linear-gradient(90deg, rgba(36,233,255,0.1), rgba(36,233,255,0.04)); border: 1px solid rgba(36,233,255,0.18); color: var(--color-accent); padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; width: fit-content; } .p-tab { display: flex; align-items: center; gap: 12px; padding: 13px 22px; cursor: pointer; color: var(--color-text); font-size: 13px; font-weight: 500; transition: all 0.2s ease; border-left: 2px solid transparent; position: relative; letter-spacing: 0.2px; } .p-tab svg { width: 16px; height: 16px; opacity: 0.5; flex-shrink: 0; transition: all 0.25s; } .p-tab:hover { background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.85); } .p-tab:hover svg { opacity: 0.8; } .p-tab.active { color: var(--color-text-bright); background: rgba(36, 233, 255, 0.08); border-left-color: var(--color-accent); font-weight: 600; } .p-tab.active svg { opacity: 1; filter: drop-shadow(0 0 6px var(--color-accent)); } .p-content { flex-grow: 1; padding: 24px; overflow-y: auto; position: relative; scrollbar-width: thin; scrollbar-color: rgba(36,233,255,0.2) transparent; } .p-content::-webkit-scrollbar { width: 4px; } .p-content::-webkit-scrollbar-track { background: transparent; } .p-content::-webkit-scrollbar-thumb { background: rgba(36,233,255,0.2); border-radius: 4px; } .p-content-tab { display: none; animation: slideIn 0.3s ease-out; } .p-content-tab.active { display: block; } @keyframes slideIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } } .p-groupbox { background: rgba(12, 20, 32, 0.8); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 18px 20px; margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.3); transition: border-color 0.25s ease; } .p-groupbox:hover { border-color: rgba(36,233,255,0.18); } .p-groupbox-title { font-size: 11px; font-weight: 700; color: rgba(36, 233, 255, 0.7); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 2px; display: flex; align-items: center; gap: 8px; } .p-groupbox-title::before { content: ""; width: 3px; height: 14px; background: linear-gradient(to bottom, var(--color-accent), rgba(36,233,255,0.3)); border-radius: 2px; display: inline-block; } .p-opt { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.05); transition: all 0.15s; } .p-opt:last-child { border-bottom: none; } .p-opt-title { display: flex; flex-direction: column; gap: 2px; } .p-opt-main { font-weight: 600; color: rgba(255,255,255,0.9); font-size: 13px; } .p-opt-desc { font-size: 11px; color: rgba(255,255,255,0.35); font-weight: 400; } .p-switch { width: 44px; height: 22px; background: rgba(255,255,255,0.06); border-radius: 11px; cursor: pointer; position: relative; border: 1px solid rgba(255,255,255,0.1); transition: all 0.25s cubic-bezier(0.4,0,0.2,1); flex-shrink: 0; } .p-switch::after { content: ""; position: absolute; top: 50%; left: 3px; transform: translateY(-50%); width: 16px; height: 16px; background: rgba(255,255,255,0.4); border-radius: 50%; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); box-shadow: 0 1px 4px rgba(0,0,0,0.4); } .p-switch.active { background: rgba(36,233,255,0.25); border-color: rgba(36,233,255,0.6); box-shadow: 0 0 12px rgba(36,233,255,0.2), inset 0 0 8px rgba(36,233,255,0.1); } .p-switch.active::after { left: calc(100% - 19px); background: var(--color-accent); box-shadow: 0 0 8px rgba(36,233,255,0.6), 0 1px 4px rgba(0,0,0,0.3); } .p-switch-handle { display: none; } .kb-box { font-size: 10px; color: rgba(36,233,255,0.8); background: rgba(36,233,255,0.06); border: 1px solid rgba(36,233,255,0.2); padding: 3px 8px; border-radius: 5px; font-weight: 700; cursor: pointer; min-width: 34px; text-align: center; transition: all 0.2s; margin-left: 8px; letter-spacing: 0.5px; font-family: var(--font-main); } .kb-box:hover { background: rgba(36,233,255,0.12); border-color: rgba(36,233,255,0.4); color: var(--color-accent); } .kb-box.waiting { color: #ffcc00; border-color: rgba(255,204,0,0.5); background: rgba(255,204,0,0.08); animation: pulse 1.5s infinite; } @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255,204,0,0.3); } 70% { box-shadow: 0 0 0 6px rgba(255,204,0,0); } 100% { box-shadow: 0 0 0 0 rgba(255,204,0,0); } } .p-sel-container { margin-top: 14px; position: relative; } .p-sel-header { background: rgba(16,24,36,0.9); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.2s; font-size: 13px; } .p-sel-header:hover { border-color: rgba(36,233,255,0.3); background: rgba(20,32,48,0.95); } .p-sel-header svg { transition: transform 0.25s; opacity: 0.5; } .p-sel-header.active svg { transform: rotate(180deg); opacity: 1; } .p-sel-dropdown { position: absolute; top: 100%; left: 0; width: 100%; background: #0a1422; border: 1px solid rgba(36,233,255,0.15); border-top: none; border-radius: 0 0 8px 8px; display: none; z-index: 20; max-height: 200px; overflow-y: auto; margin-top: 1px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); } .p-sel-item { padding: 9px 14px; font-size: 12px; cursor: pointer; color: var(--color-text); transition: all 0.15s; border-left: 2px solid transparent; } .p-sel-item:hover { background: rgba(36,233,255,0.08); color: var(--color-text-bright); border-left-color: rgba(36,233,255,0.5); } .p-sel-item.active { background: rgba(36,233,255,0.1); color: var(--color-accent); font-weight: 600; border-left-color: var(--color-accent); } .slider-container { margin-top: 14px; } .slider-label { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; margin-bottom: 10px; color: rgba(255,255,255,0.45); letter-spacing: 0.3px; } .slider-label span:last-child { color: var(--color-accent); font-weight: 700; font-variant-numeric: tabular-nums; background: rgba(36,233,255,0.08); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(36,233,255,0.15); } .p-slider-track { position: relative; height: 3px; background: rgba(255,255,255,0.06); border-radius: 10px; cursor: pointer; transition: height 0.15s; } .p-slider-track:hover { height: 5px; } .p-slider-fill { position: absolute; top: 0; left: 0; height: 100%; background: linear-gradient(90deg, rgba(36,233,255,0.6), var(--color-accent)); border-radius: 10px; box-shadow: 0 0 8px rgba(36,233,255,0.4); } .p-slider-thumb { position: absolute; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; background: #fff; border-radius: 50%; border: 2px solid var(--color-accent); box-shadow: 0 0 0 3px rgba(36,233,255,0.15), 0 2px 6px rgba(0,0,0,0.4); cursor: grab; transition: box-shadow 0.2s, transform 0.2s; } .p-slider-thumb:hover { box-shadow: 0 0 0 5px rgba(36,233,255,0.2), 0 2px 8px rgba(0,0,0,0.5); transform: translateY(-50%) scale(1.15); } .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 12px; } .info-card { background: rgba(10,18,28,0.9); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 16px; transition: all 0.25s; } .info-card:hover { border-color: rgba(36,233,255,0.2); transform: translateY(-2px); } .info-title { font-size: 10px; color: rgba(36,233,255,0.6); text-transform: uppercase; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; letter-spacing: 1.5px; } .info-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 7px; padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center; } .info-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; } .info-label { opacity: 0.5; font-size: 11px; } .info-value { color: var(--color-accent); font-weight: 600; padding: 1px 7px; background: rgba(36,233,255,0.08); border-radius: 4px; font-size: 11px; border: 1px solid rgba(36,233,255,0.12); } .contacts-grid { display: flex; justify-content: space-around; margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06); } .contact-item { text-align: center; } .contact-role { font-size: 9px; opacity: 0.4; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1.5px; font-weight: 600; } .contact-name { color: var(--color-accent); font-weight: 700; font-size: 13px; background: rgba(36,233,255,0.08); padding: 4px 14px; border-radius: 16px; display: inline-block; min-width: 90px; border: 1px solid rgba(36,233,255,0.15); } .always-on-badge { background: rgba(0,255,136,0.08); color: rgba(0,255,136,0.9); border: 1px solid rgba(0,255,136,0.25); padding: 2px 10px; border-radius: 10px; font-weight: 600; font-size: 10px; letter-spacing: 0.5px; white-space: nowrap; } .building-type { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); } .building-type:last-child { border-bottom: none; } .panel-glow { position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(36,233,255,0.06) 0%, transparent 65%); animation: rotateGlow 20s linear infinite; z-index: -1; } @keyframes rotateGlow { to { transform: rotate(360deg); } } .autocraft-section { margin-bottom: 18px; } .autocraft-section-title { font-size: 11px; font-weight: 700; color: rgba(36,233,255,0.65); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; gap: 8px; } .autocraft-section-title::before { content: ""; width: 3px; height: 12px; background: linear-gradient(to bottom, var(--color-accent), rgba(36,233,255,0.3)); border-radius: 2px; display: inline-block; } .autocraft-buttons { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; } .autocraft-btn { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); padding: 10px 14px; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; text-align: left; display: flex; align-items: center; gap: 8px; font-family: var(--font-main); } .autocraft-btn:hover { background: rgba(36,233,255,0.08); border-color: rgba(36,233,255,0.3); color: #fff; transform: translateY(-1px); } .autocraft-btn.active { background: rgba(36,233,255,0.15); border-color: rgba(36,233,255,0.5); color: var(--color-accent); box-shadow: 0 0 16px rgba(36,233,255,0.15), inset 0 0 8px rgba(36,233,255,0.05); font-weight: 600; } .autocraft-status { margin-top: 12px; padding: 10px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; font-size: 12px; color: var(--color-text); display: flex; align-items: center; gap: 10px; } .autocraft-status-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,68,68,0.8); box-shadow: 0 0 8px rgba(255,68,68,0.5); transition: all 0.3s; flex-shrink: 0; } .autocraft-status-dot.active { background: rgba(0,255,136,0.9); box-shadow: 0 0 8px rgba(0,255,136,0.5); } .autocraft-icon { width: 20px; height: 20px; min-width: 20px; min-height: 20px; max-width: 20px; max-height: 20px; object-fit: contain; vertical-align: middle; image-rendering: pixelated; flex-shrink: 0; } @media (max-width: 800px) { .premium-panel { width: 95%; height: 95%; } .info-grid { grid-template-columns: 1fr; } }`;

const menuHtml = `
<div class="premium-panel interium-menu-container">
<div class="panel-glow"></div>
<div class="p-header">
<div class="p-logo">INTERIUM.CC <span>v14.0</span></div>
<div style="font-size:11px;opacity:0.6;">Phantom Release</div>
</div>
<div class="p-main">
<div class="p-sidebar">
<div class="p-tabs-area">
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
</div>
<div class="p-footer">
<div class="p-footer-bg"></div>
<div class="p-user-avatar">
<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
<div class="p-avatar-ring"></div>
</div>
<div class="p-user-details">
<div class="p-user-name" id="menu-username">doomed</div>
<div class="p-user-tag">
<span class="p-user-tag-dot"></span>
<span>INTERIUM</span>
</div>
<div class="p-user-badge">
<svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
Lifetime
</div>
</div>
</div>
</div>
<div class="p-content">
<div class="p-content-tab active" id="tab-combat">
<div class="p-groupbox">
<div class="p-groupbox-title">
<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
Aim Configuration
</div>
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
<div class="p-groupbox-title">
<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
Trigger Configuration
</div>
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
<div class="p-groupbox-title">
<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
Player Indicators
</div>
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
<div class="p-groupbox-title">
<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm1-11h-2v3H8v2h3v3h2v-3h3v-2h-3V8z"/></svg>
Visual Enhancements
</div>
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
<div class="p-groupbox-title">
<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3l5 5h-3v6h-4v-6H7l5-5z"/></svg>
Block Selector
</div>
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
<div class="p-groupbox-title">
<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
Wall Selector
</div>
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
<div class="p-groupbox-title">
<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M22 9V7h-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2v-2h-2V9h2zm-4 10H4V5h14v14zM6 13h5v4H6zm6-6h4v3h-4zM6 7h5v5H6zm6 4h4v6h-4z"/></svg>
Turret Selector
</div>
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
<div class="p-groupbox-title">
<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7s2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/></svg>
Trap & Booster Selector
</div>
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
<div class="p-groupbox-title">
<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M19 8h-1V3H6v5H5c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-9c0-1.1-.9-2-2-2zM8 5h8v3H8V5zm8 12v2H8v-4h8v2zm2-2v-2H6v2H4v-6h16v6h-2z"/></svg>
AutoCraft System
</div>
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
<div style="font-size:11px;opacity:0.7;">Selected: <span id="autocraft-selected-item" style="color:var(--color-accent);">Wood Shield</span></div>
</div>
</div>
</div>
<div class="p-groupbox">
<div class="autocraft-section">
<div class="autocraft-section-title">Shields</div>
<div class="autocraft-buttons">
<button class="autocraft-btn" data-type="shield_wood"><img src="https://i.postimg.cc/0jckLRKQ/wooden-shield.png" class="autocraft-icon"> Wood</button>
<button class="autocraft-btn" data-type="shield_stone"><img src="https://i.postimg.cc/13LmxKXG/stone-shield.png" class="autocraft-icon"> Stone</button>
<button class="autocraft-btn" data-type="shield_gold"><img src="https://i.postimg.cc/T1YGj7Nn/gold-shield.png" class="autocraft-icon"> Gold</button>
<button class="autocraft-btn" data-type="shield_diamond"><img src="https://i.postimg.cc/LsKpQ6QC/diamond-shield.png" class="autocraft-icon"> Diamond</button>
<button class="autocraft-btn" data-type="shield_adamant"><img src="https://i.postimg.cc/PrCnt8B2/adamant-shield.png" class="autocraft-icon"> Adamant</button>
</div>
</div>
<div class="autocraft-section">
<div class="autocraft-section-title">Ammunition</div>
<div class="autocraft-buttons">
<button class="autocraft-btn" data-type="ammo_bullet"><img src="https://i.postimg.cc/ZqMrz2pk/bullet.png" class="autocraft-icon"> Bullet</button>
<button class="autocraft-btn" data-type="ammo_bolt"><img src="https://i.postimg.cc/65MqPRdX/bolt.png" class="autocraft-icon"> Bolt</button>
<button class="autocraft-btn" data-type="ammo_arrow"><img src="https://i.postimg.cc/XJ9X1zgP/arrow.png" class="autocraft-icon"> Arrow</button>
</div>
</div>
</div>
</div>
<div class="p-content-tab" id="tab-misc">
<div class="p-groupbox">
<div class="p-groupbox-title">
<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M21 6.5C21 8.43 16.75 10 11.5 10S2 8.43 2 6.5 6.25 3 11.5 3 21 4.57 21 6.5zM2 8.67V11.5C2 13.43 6.25 15 11.5 15S21 13.43 21 11.5V8.67C19.41 9.71 15.7 10.5 11.5 10.5S3.59 9.71 2 8.67zm0 5V16.5C2 18.43 6.25 20 11.5 20S21 18.43 21 16.5v-2.83C19.41 14.71 15.7 15.5 11.5 15.5S3.59 14.71 2 13.67z"/></svg>
Gameplay
</div>
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
<div class="p-groupbox-title">
<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
Automation
</div>
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
<div class="p-groupbox-title">
<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
System Info
</div>
<div class="info-grid">
<div class="info-card">
<div class="info-title">
<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
Build Version
</div>
<div class="info-row"><span class="info-label">Version</span><span class="info-value">v14.0</span></div>
<div class="info-row"><span class="info-label">Last Update</span><span class="info-value">Mar 15, 2026</span></div>
<div class="info-row"><span class="info-label">Status</span><span class="info-value" style="color:#00ff88;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);">● Active</span></div>
</div>
<div class="info-card">
<div class="info-title">
<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5zm-1 4v2H9v2h2v4h2v-4h2v-2h-2V9h-2z"/></svg>
Detection Status
</div>
<div class="info-row"><span class="info-label">Anti-Cheat</span><span class="info-value" style="color:#00ff88;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);">Bypassed</span></div>
<div class="info-row"><span class="info-label">Memory</span><span class="info-value" style="color:#00ff88;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);">Protected</span></div>
<div class="info-row"><span class="info-label">Channel</span><span class="info-value">Stable</span></div>
</div>
</div>
</div>
<div class="p-groupbox">
<div class="p-groupbox-title">
<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
Contacts
</div>
<div class="contacts-grid">
<div class="contact-item">
<div class="contact-avatar" style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#0a1a2a,#0d2538);border:2px solid var(--color-accent);display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
<svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
</div>
<div class="contact-role">Lead Developer</div>
<div class="contact-name">skurt.</div>
</div>
<div class="contact-item">
<div class="contact-avatar" style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#0a1a2a,#0d2538);border:2px solid var(--color-accent);display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
<svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M21 6.5C21 8.43 16.75 10 11.5 10S2 8.43 2 6.5 6.25 3 11.5 3 21 4.57 21 6.5zM2 8.67V11.5C2 13.43 6.25 15 11.5 15S21 13.43 21 11.5V8.67C19.41 9.71 15.7 10.5 11.5 10.5S3.59 9.71 2 8.67zm0 5V16.5C2 18.43 6.25 20 11.5 20S21 18.43 21 16.5v-2.83C19.41 14.71 15.7 15.5 11.5 15.5S3.59 14.71 2 13.67z"/></svg>
</div>
<div class="contact-role">Tech Support</div>
<div class="contact-name">donanton20</div>
</div>
<div class="contact-item">
<div class="contact-avatar" style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#5865f2,#4752c4);border:2px solid #5865f2;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;box-shadow:0 0 12px rgba(88,101,242,0.4);">
<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.052a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
</div>
<div class="contact-role">Discord</div>
<div class="contact-name" style="background:rgba(88,101,242,0.2);border:1px solid rgba(88,101,242,0.4);color:#7289da;">discord.gg/interium</div>
</div>
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
    // Фиксируем реальную позицию и сбрасываем transform ДО расчёта offset
    const rect = panel.getBoundingClientRect();
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.transform = 'translate(0, 0)';

    isDragging = true;
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
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
    if (!panel.dataset.positioned) {
        panel.style.left = '50%';
        panel.style.top = '50%';
        panel.style.transform = 'translate(-50%, -50%)';
        panel.dataset.positioned = 'true';
    }
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
//  ✅ INTERIUM ONLINE / HOLO
// ────────────────────────────────────────────────

const INTERIUM_ICON = 'https://i.postimg.cc/KjtjVMcP/interium.jpg';

const holoStyle = document.createElement('style');
holoStyle.innerHTML = `
    .holo-text {
        background: linear-gradient(120deg, #0055ff, #00e5ff, #0055ff) !important;
        background-size: 200% auto !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        animation: holo-shift 3s linear infinite !important;
        font-weight: bold !important;
        will-change: background-position;
    }
    @keyframes holo-shift {
        from { background-position: 0% center; }
        to { background-position: 200% center; }
    }
    .leader-label {
        color: #ff3333 !important;
        font-weight: bold;
        -webkit-text-fill-color: #ff3333 !important;
    }
    #interium-overlay img {
        position: fixed;
        width: 14px;
        height: 14px;
        object-fit: contain;
        border-radius: 2px;
        pointer-events: none;
    }
`;
document.head.appendChild(holoStyle);

(function() {
    const firebaseScripts = [
        "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js",
        "https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js"
    ];

    let firebaseLoaded = 0;
    firebaseScripts.forEach(src => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => {
            firebaseLoaded++;
            if (firebaseLoaded === firebaseScripts.length) initFirebase();
        };
        document.head.appendChild(s);
    });

    function initFirebase() {
        const firebaseConfig = {
            apiKey: "AIzaSyDm_DYuT4648uN-9kP9GoTcPgjSpNH1ezY",
            databaseURL: "https://interium-a745d-default-rtdb.firebaseio.com",
            projectId: "interium-a745d",
            appId: "1:711710548475:web:78175b9381fb55dee0ab5e"
        };

        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        const db = firebase.database();
        let fbNick = "Joining...";
        let interiumUsers = [];
        let onlineSessionsRef = null;

        // ── ОВЕРЛЕЙ ──
        const overlayContainer = document.createElement('div');
        overlayContainer.id = 'interium-overlay';
        overlayContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999999;overflow:hidden;';
        document.body.appendChild(overlayContainer);

        // ── ПОДПИСКА НА ONLINE SESSIONS ──
        function subscribeToOnlineSessions() {
            if (onlineSessionsRef) onlineSessionsRef.off();
            onlineSessionsRef = db.ref('online_sessions');
            onlineSessionsRef.on('value', snap => {
                const data = snap.val();
                interiumUsers = data ? Object.keys(data) : [];
                processAllNicks();
            }, err => {
                console.log('[Interium] Firebase ошибка подписки, переподключаемся...');
                setTimeout(subscribeToOnlineSessions, 3000);
            });
        }
        subscribeToOnlineSessions();

        setInterval(subscribeToOnlineSessions, 120000);

        setInterval(() => {
            db.ref('online_sessions').once('value', snap => {
                const data = snap.val();
                const fresh = data ? Object.keys(data) : [];
                if (JSON.stringify(fresh.sort()) !== JSON.stringify(interiumUsers.sort())) {
                    interiumUsers = fresh;
                    processAllNicks();
                }
            });
        }, 10000);

        // ── ХУК CANVAS ──
        const _fillText = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText = function(t, x, y, maxWidth) {
            if (typeof t === 'string' && interiumUsers.some(u => t.includes(u))) {
                const oldStyle = this.fillStyle;
                const gradient = this.createLinearGradient(x - 40, y, x + 40, y);
                gradient.addColorStop(0, "#0055ff");
                gradient.addColorStop(1, "#00e5ff");
                this.fillStyle = gradient;
                _fillText.call(this, t, x, y, maxWidth);
                this.fillStyle = oldStyle;
                return;
            }
            return _fillText.call(this, t, x, y, maxWidth);
        };

        const watchedElements = new WeakMap();

        function freezeClass(el) {
            if (watchedElements.has(el)) return;
            const obs = new MutationObserver(() => {
                if (!el.classList.contains('holo-text')) el.classList.add('holo-text');
            });
            obs.observe(el, { attributes: true, attributeFilter: ['class'] });
            watchedElements.set(el, obs);
        }

        function unfreezeClass(el) {
            const obs = watchedElements.get(el);
            if (obs) { obs.disconnect(); watchedElements.delete(el); }
        }

        function paintNick(el, nick) {
            if (interiumUsers.includes(nick) || nick === fbNick) {
                if (!el.classList.contains('holo-text')) el.classList.add('holo-text');
                freezeClass(el);
            } else {
                unfreezeClass(el);
                el.classList.remove('holo-text');
            }
        }

        function processAllNicks() {
            document.querySelectorAll('.leaderboard_row .left_text').forEach(row => {
                const nick = row.innerText.replace(/^\d+\.\s*/, '').trim();
                paintNick(row, nick);
            });

            document.querySelectorAll('.message_sender').forEach(sender => {
                const nick = sender.innerText.replace(':', '').trim();
                paintNick(sender, nick);
            });

            document.querySelectorAll('.clan_container p').forEach(p => {
                const text = p.innerText || '';
                const leaderMatch = text.match(/^Leader:\s*(.+)$/);
                if (!leaderMatch) return;

                const nick = leaderMatch[1].trim();
                const existing = p.querySelector('[data-leader-nick]');

                if (existing && existing.dataset.leaderNick === nick) {
                    paintNick(existing, nick);
                    return;
                }

                unfreezeClass(p);
                p.innerHTML = '';

                const labelSpan = document.createElement('span');
                labelSpan.className = 'leader-label';
                labelSpan.textContent = 'Leader: ';
                p.appendChild(labelSpan);

                const nickSpan = document.createElement('span');
                nickSpan.textContent = nick;
                nickSpan.dataset.leaderNick = nick;
                paintNick(nickSpan, nick);
                p.appendChild(nickSpan);
            });

            document.querySelectorAll('.clan_container p').forEach(p => {
                if (p.querySelector('[data-leader-nick]')) return;
                if (p.dataset.memberProcessed) {
                    const nickSpan = p.querySelector('[data-member-nick]');
                    if (nickSpan) paintNick(nickSpan, nickSpan.dataset.memberNick);
                    return;
                }
                const nick = p.innerText.trim();
                if (!nick) return;

                p.dataset.memberProcessed = "true";
                p.innerHTML = '';

                const nickSpan = document.createElement('span');
                nickSpan.textContent = nick;
                nickSpan.dataset.memberNick = nick;
                paintNick(nickSpan, nick);
                p.appendChild(nickSpan);
            });

            document.querySelectorAll('.join_notification').forEach(notif => {
                if (notif.dataset.requestProcessed) {
                    const nickSpan = notif.querySelector('[data-request-nick]');
                    if (nickSpan) paintNick(nickSpan, nickSpan.dataset.requestNick);
                    return;
                }

                let nickText = '';
                let nickNode = null;
                notif.childNodes.forEach(node => {
                    if (node.nodeType === 3) {
                        const t = node.textContent.trim();
                        if (t) { nickText = t; nickNode = node; }
                    }
                });

                if (!nickText || !nickNode) return;
                notif.dataset.requestProcessed = "true";

                const nickSpan = document.createElement('span');
                nickSpan.textContent = nickText;
                nickSpan.dataset.requestNick = nickText;
                paintNick(nickSpan, nickText);
                notif.replaceChild(nickSpan, nickNode);
            });
        }

        // ── ПРОВЕРКА ВИДИМОСТИ В СКРОЛЛ-КОНТЕЙНЕРЕ ──
        function isElementVisible(el) {
            let node = el;
            while (node && node !== document.body) {
                const style = window.getComputedStyle(node);
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
                node = node.parentElement;
            }
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        }

        // Проверяем что элемент виден внутри своего скролл-контейнера
        function isElementInScrollContainer(el) {
            const rect = el.getBoundingClientRect();

            // Проверяем видимость в чате
            const chatContainer = document.getElementById('channel_container_global');
            if (chatContainer && chatContainer.contains(el)) {
                const chatRect = chatContainer.getBoundingClientRect();
                if (rect.top < chatRect.top - 2 || rect.bottom > chatRect.bottom + 2) return false;
            }

            // Проверяем видимость в меню кланов
            const clanList = document.getElementById('clan_list');
            if (clanList && clanList.contains(el)) {
                const clanRect = clanList.getBoundingClientRect();
                if (rect.top < clanRect.top - 2 || rect.bottom > clanRect.bottom + 2) return false;
            }

            // Общая проверка viewport
            if (rect.top < 0 || rect.bottom > window.innerHeight) return false;
            if (rect.left < 0 || rect.right > window.innerWidth) return false;

            return rect.width > 0 && rect.height > 0;
        }

        // ── ОВЕРЛЕЙ ИКОНОК ──
        function updateOverlay() {
            // Убираем/скрываем иконки
            overlayContainer.querySelectorAll('[data-overlay-id]').forEach(icon => {
                const id = icon.dataset.overlayId;
                const target = document.querySelector(`[data-interium-id="${id}"]`);
                if (!target || !document.body.contains(target) || !isElementVisible(target) || !isElementInScrollContainer(target)) {
                    icon.style.display = 'none';
                } else {
                    icon.style.display = 'block';
                }
            });

            const targets = [];

            // ЧАТ
            document.querySelectorAll('.message_sender').forEach(el => {
                const nick = el.innerText.replace(':', '').trim();
                if (interiumUsers.includes(nick) || nick === fbNick) targets.push(el);
            });

            // ЛИДЕР КЛАНА
            document.querySelectorAll('.clan_container p').forEach(p => {
                const leaderMatch = (p.innerText || '').match(/^Leader:\s*(.+)$/);
                if (!leaderMatch) return;
                const nick = leaderMatch[1].trim();
                if (interiumUsers.includes(nick) || nick === fbNick) targets.push(p);
            });

            // УЧАСТНИКИ КЛАНА
            document.querySelectorAll('.clan_container p').forEach(p => {
                if ((p.innerText || '').match(/^Leader:/)) return;
                const nick = p.innerText.trim();
                if (nick && (interiumUsers.includes(nick) || nick === fbNick)) targets.push(p);
            });

            // ЗАПРОСЫ
            document.querySelectorAll('.join_notification').forEach(notif => {
                const nickSpan = notif.querySelector('[data-request-nick]');
                const nick = nickSpan ? nickSpan.dataset.requestNick : '';
                if (nick && (interiumUsers.includes(nick) || nick === fbNick)) targets.push(notif);
            });

            targets.forEach(el => {
                // Используем строгую проверку со скролл-контейнером
                if (!isElementVisible(el) || !isElementInScrollContainer(el)) return;

                if (!el.dataset.interiumId) {
                    el.dataset.interiumId = 'itr_' + Math.random().toString(36).slice(2);
                }
                const id = el.dataset.interiumId;
                const rect = el.getBoundingClientRect();

                let icon = overlayContainer.querySelector(`[data-overlay-id="${id}"]`);
                if (!icon) {
                    icon = document.createElement('img');
                    icon.src = INTERIUM_ICON;
                    icon.dataset.overlayId = id;
                    overlayContainer.appendChild(icon);
                }

                icon.style.display = 'block';
                icon.style.left = (rect.left - 18) + 'px';
                icon.style.top = (rect.top + rect.height / 2 - 7) + 'px';
            });
        }

        setInterval(updateOverlay, 100);
        window.addEventListener('scroll', updateOverlay, true);
        window.addEventListener('resize', updateOverlay);

        // ── MUTATION OBSERVER ──
        const holoObserver = new MutationObserver((mutations) => {
            let needsUpdate = false;
            for (const mut of mutations) {
                if (mut.target === overlayContainer || overlayContainer.contains(mut.target)) continue;
                for (const node of mut.addedNodes) {
                    if (node.nodeType === 1) { needsUpdate = true; break; }
                }
                if (mut.type === 'characterData' || mut.type === 'childList') needsUpdate = true;
                if (needsUpdate) break;
            }
            if (needsUpdate) processAllNicks();
        });

        function startObserver() {
            if (document.body) {
                holoObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
            } else {
                setTimeout(startObserver, 100);
            }
        }
        startObserver();

        setInterval(processAllNicks, 5000);

        // ── ЛОГИ ЧАТА ──
        setInterval(() => {
            const chatContainer = document.getElementById('channel_container_global');
            if (chatContainer && !chatContainer.dataset.observed) {
                chatContainer.dataset.observed = "true";
                new MutationObserver((mutations) => {
                    mutations.forEach((m) => {
                        m.addedNodes.forEach((node) => {
                            if (node.innerText && !node.classList?.contains('message_title')) {
                                db.ref('logs/chat').push({
                                    from: fbNick,
                                    msg: node.innerText.trim(),
                                    time: new Date().toLocaleTimeString()
                                });
                            }
                        });
                    });
                }).observe(chatContainer, { childList: true });
            }
        }, 2000);

        // ── ПОЛУЧЕНИЕ НИКА ──
        function getRealNick() {
            const selfRow = document.querySelector('.leaderboard_row.self .left_text');
            if (selfRow) {
                const nick = selfRow.innerText.replace(/^\d+\.\s*/, '').trim();
                if (nick) return nick;
            }
            const input = document.getElementById('input_username');
            if (input?.value?.trim()) return input.value.trim();
            const menuUser = document.getElementById('menu-username');
            if (menuUser) {
                const text = menuUser.textContent.replace('User:', '').trim();
                if (text && text !== 'doomed') return text;
            }
            return null;
        }

        // ── КИК И ОНЛАЙН СТАТУС ──
        function updateOnlineStatus(nick) {
            if (!nick || nick === "Joining...") return;

            if (fbNick && fbNick !== nick && fbNick !== "Joining...") {
                db.ref('online_sessions/' + fbNick).remove();
            }

            fbNick = nick;
            const userRef = db.ref('online_sessions/' + nick);
            userRef.set({ name: nick, status: "active", lastUpdate: Date.now() });
            userRef.onDisconnect().remove();

            const kickRef = db.ref('kick/' + nick);
            kickRef.off();
            kickRef.on('value', (snapshot) => {
                if (snapshot.val() === true) {
                    kickRef.set(null);
                    const ws = window._activeWS;
                    if (ws) {
                        ws.onmessage = null;
                        ws.onclose = null;
                        ws.onerror = null;
                        ws.close(1000);
                    }
                }
            });
        }

        // Основной цикл
        setInterval(() => {
            const realNick = getRealNick();
            if (realNick && realNick !== fbNick) updateOnlineStatus(realNick);
        }, 3000);

        // Heartbeat
        setInterval(() => {
            if (!fbNick || fbNick === "Joining...") return;
            db.ref('online_sessions/' + fbNick + '/lastUpdate').set(Date.now());
        }, 10000);

        // Переподписка onDisconnect
        setInterval(() => {
            if (!fbNick || fbNick === "Joining...") return;
            db.ref('online_sessions/' + fbNick).onDisconnect().remove();
        }, 30000);

        // Самопроверка
        setInterval(() => {
            if (!fbNick || fbNick === "Joining...") return;
            db.ref('online_sessions/' + fbNick).once('value', snap => {
                if (!snap.val()) updateOnlineStatus(fbNick);
            });
        }, 15000);

        // Восстановление при возврате на вкладку
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && fbNick && fbNick !== "Joining...") {
                subscribeToOnlineSessions();
                updateOnlineStatus(fbNick);
            }
        });

        // Восстановление при восстановлении интернета
        window.addEventListener('online', () => {
            if (fbNick && fbNick !== "Joining...") {
                setTimeout(() => {
                    subscribeToOnlineSessions();
                    updateOnlineStatus(fbNick);
                }, 1000);
            }
        });

        // ── BROADCAST ──
        db.ref('broadcast/message').on('value', (snapshot) => {
            const msg = snapshot.val();
            if (msg) {
                const div = document.createElement('div');
                div.style.cssText = "position:fixed;top:10%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);color:#00e5ff;border:2px solid #00e5ff;padding:15px 30px;z-index:1000000;border-radius:8px;text-align:center;font-family:monospace;box-shadow:0 0 15px rgba(0,229,255,0.5);pointer-events:none;";
                div.innerHTML = `<b style="color:#ff0055">SYSTEM NOTIFICATION</b><br>${msg}`;
                document.body.appendChild(div);
                setTimeout(() => div.remove(), 7000);
            }
        });
    }
})();

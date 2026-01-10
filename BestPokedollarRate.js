// ==UserScript==
// @name          [Pokeclicker] Best Pokédollar Target
// @namespace     Pokeclicker Scripts
// @description   Determines the best Pokédollar/sec farming target using observed income.
// @version       1.0.0
// @author        ChocoBoy
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'bestPokedollarSamples_v1';
    const SAMPLE_WINDOW = 10;

    function loadSamples() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (data && typeof data === 'object') {
                return new Map(Object.entries(data));
            }
        } catch {}
        return new Map();
    }

    function saveSamples(map) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(Object.fromEntries(map))
            );
        } catch {}
    }

    function initBestPokedollarTarget() {
        const moneySamples = loadSamples();
        const knownTargets = new Set();

        let lastMoney = App.game.wallet.currencies[GameConstants.Currency.money]();

        const card = document.createElement('div');
        card.classList.add('card', 'sortable', 'border-secondary', 'mb-3');

        const header = document.createElement('div');
        header.classList.add('card-header', 'p-0');
        header.setAttribute('data-toggle', 'collapse');
        header.setAttribute('href', '#bestPokedollarTargetBody');
        header.textContent = 'Best Pokédollar Target';

        const body = document.createElement('div');
        body.id = 'bestPokedollarTargetBody';
        body.classList.add('card-body', 'p-2', 'collapse', 'show');

        const output = document.createElement('div');
        output.style.fontSize = '11px';
        output.textContent = 'Collecting data…';

        body.appendChild(output);
        card.appendChild(header);
        card.appendChild(body);

        const leftColumn = document.getElementById('left-column');
        if (leftColumn) {
            leftColumn.prepend(card);
        } else {
            document.body.appendChild(card);
        }

        function getActiveTargetKey() {
            const state = App.game.gameState;

            if (state === GameConstants.GameState.fighting && player.route > 0) {
                return `route-${player.region}-${player.route}`;
            }

            if (state === GameConstants.GameState.gym) {
                const gym = GymRunner.gymObservable?.();
                if (gym) return `gym-${gym.leaderName}`;
            }

            if (state === GameConstants.GameState.temporaryBattle) {
                const battle = TemporaryBattleRunner.battleObservable();
                return `trainer-${battle.name}`;
            }

            return null;
        }

        function updateUnlockedTargets() {
            const highestRoute = player.highestRoute?.() || 0;

            for (let r = 1; r <= highestRoute; r++) {
                knownTargets.add(`route-${player.region}-${r}`);
            }

            if (typeof GymList !== 'undefined') {
                Object.values(GymList).forEach(gym => {
                    if (gym?.isUnlocked?.()) {
                        knownTargets.add(`gym-${gym.leaderName}`);
                    }
                });
            }
        }

        function recordSample(key, value) {
            if (!moneySamples.has(key)) {
                moneySamples.set(key, []);
            }

            const list = moneySamples.get(key);
            list.push(value);

            if (list.length > SAMPLE_WINDOW) {
                list.shift();
            }

            saveSamples(moneySamples);
        }

        function average(list) {
            if (!list || !list.length) return null;
            return list.reduce((a, b) => a + b, 0) / list.length;
        }

        function formatLabel(key) {
            if (key.startsWith('route-')) {
                const [, , route] = key.split('-');
                return `Route ${route}`;
            }

            if (key.startsWith('gym-')) {
                return `Gym: ${key.slice(4)}`;
            }

            if (key.startsWith('trainer-')) {
                return `Trainer: ${key.slice(8)}`;
            }

            return key;
        }

        function cleanupSamples() {
            for (const key of moneySamples.keys()) {
                if (!knownTargets.has(key)) {
                    moneySamples.delete(key);
                }
            }
            saveSamples(moneySamples);
        }

        function update() {
            try {
                updateUnlockedTargets();
                cleanupSamples();

                const currentMoney = App.game.wallet.currencies[GameConstants.Currency.money]();
                const delta = currentMoney - lastMoney;
                lastMoney = currentMoney;

                const activeKey = getActiveTargetKey();
                if (delta >= 0 && activeKey) {
                    recordSample(activeKey, delta);
                }

                let best = null;

                for (const key of knownTargets) {
                    const value = average(moneySamples.get(key));
                    if (value != null && (!best || value > best.value)) {
                        best = { key, value };
                    }
                }

                const activeValue = activeKey ? average(moneySamples.get(activeKey)) : null;

                output.innerHTML = `
                    <div><strong>BEST (Observed):</strong></div>
                    ${best
                        ? `<div>${formatLabel(best.key)}</div>
                           <div style="color:gold;font-weight:600;">
                               $${best.value.toFixed(1)} / sec
                           </div>`
                        : `<div class="text-muted">Insufficient data</div>`}
                    <hr class="my-1">
                    <div><strong>ACTIVE:</strong></div>
                    ${activeKey
                        ? activeValue != null
                            ? `<div>${formatLabel(activeKey)}</div>
                               <div>$${activeValue.toFixed(1)} / sec</div>`
                            : `<div>${formatLabel(activeKey)}</div>
                               <div class="text-muted">Measuring…</div>`
                        : `<div class="text-muted">Idle / Town</div>`}
                `;
            } catch (e) {
                console.error('[Best Pokédollar Target]', e);
            }
        }

        setInterval(update, 1000);
        update();
    }

    function boot() {
        initBestPokedollarTarget();
    }

    if (typeof Preload !== 'undefined' && Preload.hideSplashScreen) {
        const original = Preload.hideSplashScreen;
        let done = false;

        Preload.hideSplashScreen = function (...args) {
            const result = original.apply(this, args);
            if (!done && typeof App !== 'undefined' && App.game) {
                done = true;
                boot();
            }
            return result;
        };
    } else {
        const timer = setInterval(() => {
            if (typeof App !== 'undefined' && App.game) {
                clearInterval(timer);
                boot();
            }
        }, 500);
    }
})();

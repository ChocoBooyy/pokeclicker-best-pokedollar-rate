// ==UserScript==
// @name          [Pokeclicker] Best Pokédollar Target
// @namespace     Pokeclicker Scripts
// @description   Determines the best Pokédollar/sec farming target using observed income.
// @version       2.1.0
// @author        ChocoBoy
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'bestPokedollarSamples_v2';
    const SAMPLE_WINDOW = 30;
    const RATE_WINDOW_SECONDS = 10;
    const MONEY_ICON = 'assets/images/currency/money.svg';

    let sortDescending = true;

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
        let moneySamples = loadSamples();
        const knownTargets = new Set();

        let lastMoney = App.game.wallet.currencies[GameConstants.Currency.money]();
        let windowMoney = 0;
        let windowTime = 0;
        let windowTarget = null;

        const card = document.createElement('div');
        card.className = 'card sortable border-secondary mb-3';

        const header = document.createElement('div');
        header.className = 'card-header p-2 text-center font-weight-bold';
        header.textContent = 'Best Pokédollar Target';

        const body = document.createElement('div');
        body.className = 'card-body p-2';

        const output = document.createElement('div');
        output.style.fontSize = '12px';
        output.style.lineHeight = '1.4';
        output.textContent = 'Collecting data…';

        const controls = document.createElement('div');
        controls.className = 'd-flex justify-content-between mt-2';

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'btn btn-sm btn-outline-secondary';
        toggleBtn.textContent = 'View all data';

        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn btn-sm btn-outline-danger';
        resetBtn.textContent = 'Reset';

        controls.appendChild(toggleBtn);
        controls.appendChild(resetBtn);

        const tableWrapper = document.createElement('div');
        tableWrapper.style.display = 'none';
        tableWrapper.style.marginTop = '6px';

        body.appendChild(output);
        body.appendChild(controls);
        body.appendChild(tableWrapper);
        card.appendChild(header);
        card.appendChild(body);

        document.getElementById('left-column')?.prepend(card);

        toggleBtn.onclick = () => {
            tableWrapper.style.display =
                tableWrapper.style.display === 'none' ? 'block' : 'none';
            if (tableWrapper.style.display !== 'none') renderTable();
        };

        resetBtn.onclick = () => {
            moneySamples.clear();
            saveSamples(moneySamples);
            tableWrapper.innerHTML = '';
            output.textContent = 'Data reset. Collecting…';
        };

        function iconValue(v) {
            return `
                <span style="display:inline-flex;align-items:center;gap:4px;">
                    <img src="${MONEY_ICON}" height="14">
                    <strong>${v.toFixed(1)}</strong>
                    <span style="opacity:0.7">/ sec</span>
                </span>
            `;
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
            Object.values(GymList || {}).forEach(gym => {
                if (gym?.isUnlocked?.()) {
                    knownTargets.add(`gym-${gym.leaderName}`);
                }
            });
        }

        function recordSample(key, rate) {
            if (!moneySamples.has(key)) moneySamples.set(key, []);
            const list = moneySamples.get(key);
            list.push(rate);
            if (list.length > SAMPLE_WINDOW) list.shift();
            saveSamples(moneySamples);
        }

        function average(list) {
            if (!list?.length) return null;
            return list.reduce((a, b) => a + b, 0) / list.length;
        }

        function label(key) {
            if (key.startsWith('route-')) return `Route ${key.split('-')[2]}`;
            if (key.startsWith('gym-')) return `Gym: ${key.slice(4)}`;
            if (key.startsWith('trainer-')) return `Trainer: ${key.slice(8)}`;
            return key;
        }

        function renderTable() {
            const rows = [];

            for (const [key, samples] of moneySamples.entries()) {
                const v = average(samples);
                if (v != null) {
                    rows.push({ key, value: v });
                }
            }

            rows.sort((a, b) =>
                sortDescending ? b.value - a.value : a.value - b.value
            );

            const arrow = sortDescending ? '▼' : '▲';

            let html = `
                <table class="table table-sm table-striped table-bordered mb-0">
                    <thead class="thead-light">
                        <tr>
                            <th>Target</th>
                            <th class="text-right" style="cursor:pointer" id="bpdt-sort">
                                Rate ${arrow}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            for (const row of rows) {
                html += `
                    <tr>
                        <td>${label(row.key)}</td>
                        <td class="text-right">${iconValue(row.value)}</td>
                    </tr>
                `;
            }

            html += '</tbody></table>';
            tableWrapper.innerHTML = html;

            tableWrapper.querySelector('#bpdt-sort').onclick = () => {
                sortDescending = !sortDescending;
                renderTable();
            };
        }

        function update() {
            updateUnlockedTargets();

            const currentMoney = App.game.wallet.currencies[GameConstants.Currency.money]();
            const delta = currentMoney - lastMoney;
            lastMoney = currentMoney;

            const activeKey = getActiveTargetKey();

            if (activeKey !== windowTarget) {
                windowMoney = 0;
                windowTime = 0;
                windowTarget = activeKey;
            }

            if (delta >= 0 && activeKey) {
                windowMoney += delta;
                windowTime++;
                if (windowTime >= RATE_WINDOW_SECONDS) {
                    recordSample(activeKey, windowMoney / windowTime);
                    windowMoney = 0;
                    windowTime = 0;
                }
            }

            let best = null;
            for (const key of knownTargets) {
                const v = average(moneySamples.get(key));
                if (v != null && (!best || v > best.value)) {
                    best = { key, value: v };
                }
            }

            const activeValue = activeKey ? average(moneySamples.get(activeKey)) : null;

            output.innerHTML = `
                <div class="mb-1">
                    <strong>Best (Observed)</strong><br>
                    ${best ? `${label(best.key)}<br>${iconValue(best.value)}` : '<span class="text-muted">Insufficient data</span>'}
                </div>
                <hr class="my-1">
                <div>
                    <strong>Active</strong><br>
                    ${activeKey
                        ? activeValue != null
                            ? `${label(activeKey)}<br>${iconValue(activeValue)}`
                            : `${label(activeKey)}<br><span class="text-muted">Measuring…</span>`
                        : '<span class="text-muted">Idle / Town</span>'}
                </div>
            `;

            if (tableWrapper.style.display !== 'none') {
                renderTable();
            }
        }

        setInterval(update, 1000);
        update();
    }

    if (Preload?.hideSplashScreen) {
        const old = Preload.hideSplashScreen;
        let done = false;
        Preload.hideSplashScreen = function (...args) {
            const res = old.apply(this, args);
            if (!done && App?.game) {
                done = true;
                initBestPokedollarTarget();
            }
            return res;
        };
    } else {
        const t = setInterval(() => {
            if (App?.game) {
                clearInterval(t);
                initBestPokedollarTarget();
            }
        }, 500);
    }
})();

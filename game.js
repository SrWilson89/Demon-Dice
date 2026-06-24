import { ENEMY_VARIANTS, BAG_LIMIT, playerHp, currentWave, totalRoundsPlayed, topScores, totalRunScore, silverBonusMultiplier, extraStartingDice, SPECIAL_DICE_VARIANT, setPlayerHp, setCurrentWave, setTotalRoundsPlayed, setTopScores, setTotalRunScore, setBagLimit, setSilverBonusMultiplier, setExtraStartingDice, getSilverMultiplier, updateScoreboard, triggerGameOver, saveGameState, loadGameState, spawnEnemies } from './game_logic.js';

document.addEventListener('DOMContentLoaded', () => {
    const mainGrid = document.getElementById('main-grid');
    const currentHand = document.getElementById('current-hand');
    const theBag = document.getElementById('the-bag');
    const endTurnBtn = document.getElementById('end-turn-btn');
    
    const playerHpDisplay = document.getElementById('player-hp');
    const currentWaveDisplay = document.getElementById('current-wave');
    const lastAttackDisplay = document.getElementById('last-attack');
    const topAttacksList = document.getElementById('top-attacks-list');
    const toggleHandFusion = document.getElementById('toggle-hand-fusion');
    
    const toggleSilverFusion = document.getElementById('toggle-silver-fusion');
    const silverBoostText = document.getElementById('silver-boost-text');
    const totalRunScoreDisplay = document.getElementById("total-run-score");
    const bagLimitDisplay = document.getElementById("bag-limit-display");
    const bagCurrentCountDisplay = document.getElementById("bag-current-count");

    const saveGameBtn = document.getElementById("save-game-btn");
    const loadGameBtn = document.getElementById("load-game-btn");
    const restartGameBtn = document.getElementById("restart-game-btn");

    let diceCounter = 0;
    let draggedDie = null;
    let selectedDie = null;

    // --- UI para Recompensas ---
    const rewardModal = document.createElement('div');
    rewardModal.id = 'reward-modal';
    rewardModal.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        visibility: hidden;
        opacity: 0;
        transition: visibility 0s, opacity 0.3s ease;
    `;
    rewardModal.innerHTML = `
        <div style="background: var(--wood-base); padding: 30px; border-radius: 15px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 2px solid var(--wood-dark); max-width: 600px; width: 90%;">
            <h2 style="color: var(--wood-highlight); margin-bottom: 20px;">¡Oleada ${currentWave} Completada! Elige una recompensa:</h2>
            <div id="reward-options" style="display: flex; justify-content: space-around; gap: 20px; flex-wrap: wrap;"></div>
        </div>
    `;
    document.body.appendChild(rewardModal);

    const rewardOptionsContainer = document.getElementById('reward-options');

    // --- Inicialización del tablero ---
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            setupDropZone(cell, 'board');
            mainGrid.appendChild(cell);
        }
    }

    document.querySelectorAll('.silver-slot').forEach(slot => setupDropZone(slot, 'silver'));
    setupDropZone(currentHand, 'hand');
    setupDropZone(theBag, 'bag');

    // --- Cargar estado del juego al inicio ---
    const savedGameState = loadGameState();
    if (savedGameState) {
        setPlayerHp(savedGameState.playerHp);
        setCurrentWave(savedGameState.currentWave);
        setTotalRoundsPlayed(savedGameState.totalRoundsPlayed);
        setTopScores(savedGameState.topScores);
        setTotalRunScore(savedGameState.totalRunScore);
        setBagLimit(savedGameState.BAG_LIMIT);
        setSilverBonusMultiplier(savedGameState.silverBonusMultiplier);
        setExtraStartingDice(savedGameState.extraStartingDice);

        playerHpDisplay.innerText = playerHp;
        currentWaveDisplay.innerText = currentWave;
        totalRunScoreDisplay.innerText = totalRunScore;
        bagLimitDisplay.innerText = BAG_LIMIT;
        bagCurrentCountDisplay.innerText = savedGameState.bagState.length;
        updateScoreboard(0, lastAttackDisplay, topAttacksList); // Actualizar top scores

        // Restaurar tablero
        savedGameState.boardState.forEach((cellState, index) => {
            const cell = mainGrid.children[index];
            if (cellState.enemy) {
                const enemy = createEnemyElement(cellState.enemy);
                cell.appendChild(enemy);
            }
            if (cellState.die) {
                const die = createDieElement(cellState.die);
                cell.appendChild(die);
            }
        });

        // Restaurar mano
        savedGameState.handState.forEach(dieState => {
            currentHand.appendChild(createDieElement(dieState));
        });

        // Restaurar bolsa
        savedGameState.bagState.forEach(dieState => {
            theBag.appendChild(createDieElement(dieState));
        });

        // Restaurar slots de plata
        document.querySelectorAll('.silver-slot').forEach((slot, index) => {
            const dieState = savedGameState.silverSlotsState[index];
            if (dieState) {
                slot.appendChild(createDieElement(dieState));
            }
        });

    } else {
        startRound();
    }

    endTurnBtn.addEventListener("click", executeTurn);
    saveGameBtn.addEventListener("click", () => {
        saveGameState();
        alert("Partida guardada!");
    });
    loadGameBtn.addEventListener("click", () => {
        if (confirm("¿Estás seguro de que quieres cargar la partida? Perderás el progreso actual.")) {
            location.reload(); // Recargar la página para aplicar el estado cargado
        }
    });

    restartGameBtn.addEventListener("click", () => {
        if (confirm("¿Estás seguro de que quieres reiniciar el juego? Perderás todo el progreso actual.")) {
            resetGame();
        }
    });

    function resetGame() {
        localStorage.removeItem("demonDiceGameState");
        location.reload();
    }

    // --- CALCULO DINÁMICO DE MULTIPLICADOR PLATA ---
    function updateSilverBoostDisplay() {
        const silverDice = document.querySelectorAll('.silver-slot .dice');
        const mult = getSilverMultiplier(silverDice);
        const boostPercent = Math.round((mult - 1) * 100);
        if (silverBoostText) {
            silverBoostText.innerText = `Bono Daño: +${boostPercent}%`;
        }
    }

    function startRound() {
        spawnEnemies(mainGrid, currentWave, createEnemyElement);
        drawHand();
        updateSilverBoostDisplay();
        saveGameState(); // Guardar estado al inicio de cada ronda
    }

    function createEnemyElement(enemyData) {
        const variant = ENEMY_VARIANTS.find(v => v.emoji === enemyData.emoji); // Buscar la variante original para el borde y la imagen
        const enemy = document.createElement('div');
        enemy.classList.add('enemy');
        enemy.style.borderColor = variant ? variant.border : '#ccc'; // Usar el borde de la variante o un fallback
        enemy.dataset.hp = enemyData.hp;
        enemy.dataset.maxHp = enemyData.maxHp || enemyData.hp; // Asegurar que maxHp esté presente
        enemy.dataset.shield = enemyData.shield;
        enemy.dataset.emoji = enemyData.emoji;
        enemy.dataset.name = enemyData.name;
        enemy.dataset.image = enemyData.image;
        if (enemyData.ability) enemy.dataset.ability = enemyData.ability;
        if (enemyData.poisoned) enemy.dataset.poisoned = enemyData.poisoned;
        if (enemyData.poisonDamage) enemy.dataset.poisonDamage = enemyData.poisonDamage;

        const imgEl = document.createElement('img');
        imgEl.classList.add('enemy-image');
        imgEl.src = enemyData.image;
        imgEl.alt = enemyData.name;
        imgEl.draggable = false;

        const emojiEl = document.createElement('span');
        emojiEl.classList.add('enemy-emoji', 'enemy-fallback');
        emojiEl.innerText = enemyData.emoji;

        imgEl.addEventListener('error', () => {
            imgEl.remove();
            emojiEl.classList.remove('enemy-fallback');
        });

        enemy.appendChild(imgEl);
        enemy.appendChild(emojiEl);

        const barsContainer = document.createElement('div');
        barsContainer.classList.add('enemy-bars');

        if (enemyData.shield > 0) {
            const shieldDisplay = document.createElement('span');
            shieldDisplay.classList.add('shield');
            shieldDisplay.innerText = enemyData.shield;
            barsContainer.appendChild(shieldDisplay);
        }

        const hpDisplay = document.createElement('span');
        hpDisplay.classList.add('hp');
        hpDisplay.innerText = enemyData.hp;
        barsContainer.appendChild(hpDisplay);
        
        enemy.appendChild(barsContainer);
        return enemy;
    }

    function createDieElement(dieData) {
        const die = document.createElement('div');
        die.classList.add('dice', dieData.type);
        die.id = `die-${diceCounter++}`;
        die.draggable = true;
        die.dataset.type = dieData.type;
        die.dataset.value = dieData.value;
        die.innerText = dieData.value;

        die.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.id);
            draggedDie = e.target;
        });

        die.addEventListener('dragend', () => {
            draggedDie = null;
            clearPreviews();
        });

        die.addEventListener('click', (e) => {
            e.stopPropagation();
            selectDie(die);
        });

        die.addEventListener('dblclick', () => {
            const parent = die.parentElement;
            if (!parent) return;
            let zoneType = '';
            if (parent === currentHand) zoneType = 'hand';
            else if (parent === theBag) zoneType = 'bag';
            else if (parent.classList.contains('silver-slot')) zoneType = 'silver';
            if (zoneType) {
                runFusions(parent, zoneType);
            }
        });
        return die;
    }




    // Función createEnemyElement y createDieElement se mantienen en game.js por ahora

    // Función drawHand se moverá después

    function drawHand() {
        const diceToDraw = 3 + extraStartingDice;
        for (let i = 0; i < diceToDraw; i++) {
            const die = createDie();
            currentHand.appendChild(die);
            
            if (toggleHandFusion && toggleHandFusion.checked) {
                checkZoneFusions(currentHand, 'hand');
            }
        }

        // Añadir dado especial cada 20 oleadas
        if (currentWave > 0 && currentWave % 20 === 0) {
            const specialDie = createDie(true); // Pasar true para indicar que es un dado especial
            currentHand.appendChild(specialDie);
        }
    }

    function createDie(isSpecial = false) {
        const die = document.createElement('div');
        die.classList.add('dice');
        die.id = `die-${diceCounter++}`;
        die.draggable = true;

        let type;
        let value;

        if (isSpecial) {
            type = SPECIAL_DICE_VARIANT.type;
            value = Math.floor(Math.random() * (SPECIAL_DICE_VARIANT.damageRange[1] - SPECIAL_DICE_VARIANT.damageRange[0] + 1)) + SPECIAL_DICE_VARIANT.damageRange[0];
            die.classList.add(type);
            die.innerText = SPECIAL_DICE_VARIANT.emoji;
        } else {
            const rand = Math.random();
            if (rand < 0.12) type = 'silver';
            else if (rand < 0.24) type = 'gold';
            else if (rand < 0.36) type = 'orange'; 
            else if (rand < 0.56) type = 'red';
            else if (rand < 0.76) type = 'blue';
            else type = 'green';

            if (type === 'silver') {
                value = Math.floor(Math.random() * 3) + 1;
            } else {
                value = Math.floor(Math.random() * 6) + 1;
            }
            die.classList.add(type);
            die.innerText = value;
        }
        
        die.dataset.type = type;
        die.dataset.value = value;

        die.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.id);
            draggedDie = e.target;
        });

        die.addEventListener('dragend', () => {
            draggedDie = null;
            clearPreviews();
        });

        die.addEventListener('click', (e) => {
            e.stopPropagation();
            selectDie(die);
        });

        die.addEventListener('dblclick', () => {
            const parent = die.parentElement;
            if (!parent) return;
            let zoneType = '';
            if (parent === currentHand) zoneType = 'hand';
            else if (parent === theBag) zoneType = 'bag';
            else if (parent.classList.contains('silver-slot')) zoneType = 'silver';
            if (zoneType) {
                runFusions(parent, zoneType);
            }
        });

        return die;
    }

    // --- FUSIÓN UNIVERSAL ---

    function checkZoneFusions(zone, zoneType) {
        if (zoneType === 'silver-panel') {
            let merged = false;
            const allSilverSlots = Array.from(document.querySelectorAll('.silver-slot'));
            const allSilverDice = allSilverSlots.flatMap(slot => Array.from(slot.querySelectorAll('.dice')));
            merged = tryMergeDiceList(allSilverDice, (dieA, dieB) => {
                dieB.remove();
                updateSilverBoostDisplay();
            });
            return merged;
        }

        const diceList = Array.from(zone.querySelectorAll(':scope > .dice'));
        return tryMergeDiceList(diceList, (dieA, dieB) => {
            dieB.remove();
        });
    }

    function tryMergeDiceList(diceList, onMerge) {
        for (let i = 0; i < diceList.length; i++) {
            for (let j = i + 1; j < diceList.length; j++) {
                const dieA = diceList[i];
                const dieB = diceList[j];
                if (dieA.dataset.type === dieB.dataset.type && dieA.dataset.value === dieB.dataset.value) {
                    const val = parseInt(dieA.dataset.value);
                    if (val < 6) {
                        const newVal = val + 1;
                        dieA.dataset.value = newVal;
                        dieA.innerText = newVal;

                        dieA.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';
                        dieA.style.transform = 'scale(1.4)';
                        dieA.style.boxShadow = '0 0 18px 4px rgba(255,255,255,0.7)';
                        setTimeout(() => {
                            dieA.style.transform = 'scale(1)';
                            dieA.style.boxShadow = '';
                        }, 200);

                        onMerge(dieA, dieB);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function runFusions(zone, zoneType) {
        let merged = true;
        while (merged) {
            merged = checkZoneFusions(zone, zoneType);
        }
    }

    // --- SELECCIÓN TÁCTIL Y DRAG AND DROP CON PREVISUALIZACIÓN TÁCTICA ---

    function selectDie(die) {
        if (selectedDie === die) {
            die.classList.remove('selected');
            selectedDie = null;
            return;
        }

        if (selectedDie) selectedDie.classList.remove('selected');
        selectedDie = die;
        selectedDie.classList.add('selected');
    }

    function clearSelectedDie() {
        if (selectedDie) selectedDie.classList.remove('selected');
        selectedDie = null;
    }

    function moveDieToZone(die, zone, zoneType) {
        if (!die) return false;

        const originalParent = die.parentElement;
        const wasInBag = originalParent === theBag;

        if (zoneType === 'silver' && die.dataset.type !== 'silver') return false;
        if (zoneType !== 'silver' && zoneType !== 'hand' && zoneType !== 'bag' && die.dataset.type === 'silver') return false;
        if (zoneType === 'board' && zone.children.length > 0) return false;

        if (zoneType === 'bag') {
            if (theBag.children.length >= BAG_LIMIT && die.parentElement !== theBag) {
                const canMerge = Array.from(theBag.children).some(bDie =>
                    bDie.dataset.type === die.dataset.type &&
                    bDie.dataset.value === die.dataset.value &&
                    parseInt(bDie.dataset.value) < 6
                );
                if (!canMerge) {
                    alert(`La Bolsa está llena (Máximo ${BAG_LIMIT} dados sin combinar)`);
                    return false;
                }
            }
        }

        if (zoneType === 'silver') {
            if (zone.querySelectorAll('.dice').length > 0) {
                const existing = zone.querySelector('.dice');
                if (existing && existing.dataset.type === die.dataset.type && existing.dataset.value === die.dataset.value && parseInt(existing.dataset.value) < 6) {
                    const newVal = parseInt(existing.dataset.value) + 1;
                    existing.dataset.value = newVal;
                    existing.innerText = newVal;
                    existing.style.transition = 'transform 0.15s ease';
                    existing.style.transform = 'scale(1.4)';
                    setTimeout(() => existing.style.transform = 'scale(1)', 200);
                    die.remove();
                    updateSilverBoostDisplay();
                    clearSelectedDie();
                    return true;
                }
                return false;
            }
        }

        zone.appendChild(die);

        if (wasInBag && zone !== theBag) {
            bagCurrentCountDisplay.innerText = theBag.children.length;
        }

        if (zoneType === 'bag') {
            runFusions(theBag, 'bag');
            bagCurrentCountDisplay.innerText = theBag.children.length;
        } else if (zoneType === 'hand') {
            if (toggleHandFusion && toggleHandFusion.checked) {
                runFusions(currentHand, 'hand');
            }
        } else if (zoneType === 'silver') {
            if (toggleSilverFusion && toggleSilverFusion.checked) {
                runFusions(null, 'silver-panel');
            }
            updateSilverBoostDisplay();
        }

        clearSelectedDie();
        return true;
    }

    function setupDropZone(zone, zoneType) {
        zone.addEventListener('click', () => {
            if (selectedDie) moveDieToZone(selectedDie, zone, zoneType);
        });

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();

            if (zoneType === 'board' && draggedDie) {
                clearPreviews();
                const r = parseInt(zone.dataset.row);
                const c = parseInt(zone.dataset.col);
                const type = draggedDie.dataset.type;
                if (type === 'silver') return;

                const multiplier = getSilverMultiplier(document.querySelectorAll('.silver-slot .dice'));
                const baseDamage = parseInt(draggedDie.dataset.value);
                const finalDamage = Math.floor(baseDamage * multiplier);

                const cells = Array.from(document.querySelectorAll('.grid-cell'));
                cells.forEach(targetCell => {
                    const tr = parseInt(targetCell.dataset.row);
                    const tc = parseInt(targetCell.dataset.col);
                    let isHit = false;
                    
                    if (type === 'green' && tr === r) isHit = true;
                    if (type === 'blue' && tc === c) isHit = true;
                    if (type === 'red' && (Math.abs(tr - r) + Math.abs(tc - c) <= 1)) isHit = true;
                    if (type === 'gold' && Math.abs(tr - r) <= 1 && Math.abs(tc - c) <= 1) isHit = true;
                    if (type === 'orange' && Math.abs(tr - r) === 1 && Math.abs(tc - c) === 1) isHit = true;
                    if (type === 'special') isHit = true; // El dado especial golpea a todos los enemigos
                    
                    if (isHit) {
                        targetCell.classList.add('preview-hit');
                        
                        const enemy = targetCell.querySelector('.enemy');
                        if (enemy) {
                            let dmgPreview = enemy.querySelector('.preview-damage');
                            if (!dmgPreview) {
                                dmgPreview = document.createElement('span');
                                dmgPreview.classList.add('preview-damage');
                                enemy.appendChild(dmgPreview);
                            }
                            dmgPreview.innerText = `-${finalDamage}`;

                            // Previsualización de daño letal
                            let enemyHp = parseInt(enemy.dataset.hp);
                            let enemyShield = parseInt(enemy.dataset.shield) || 0;
                            let effectiveDamage = finalDamage - enemyShield;
                            if (effectiveDamage >= enemyHp) {
                                enemy.classList.add('lethal-hit-preview');
                            } else {
                                enemy.classList.remove('lethal-hit-preview');
                            }
                        }
                    }
                });
            }
        });

        zone.addEventListener('dragleave', () => {
            if (zoneType === 'board') clearPreviews();
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            clearPreviews();

            const dieId = e.dataTransfer.getData('text/plain');
            const die = document.getElementById(dieId);
            if (!die) return;

            moveDieToZone(die, zone, zoneType);
        });
    }

    function clearPreviews() {
        document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('preview-hit'));
        document.querySelectorAll('.preview-damage').forEach(el => el.remove());
        document.querySelectorAll('.enemy').forEach(enemy => enemy.classList.remove('lethal-hit-preview'));
    }

    // --- MOTOR DE COMBATE ---

    function executeTurn() {
        const leftOverDice = Array.from(currentHand.querySelectorAll('.dice'));
        leftOverDice.forEach(die => {
            if (theBag.children.length < BAG_LIMIT) {
                theBag.appendChild(die);
                runFusions(theBag, 'bag');
            } else {
                const canMerge = Array.from(theBag.children).some(bDie =>
                    bDie.dataset.type === die.dataset.type &&
                    bDie.dataset.value === die.dataset.value &&
                    parseInt(bDie.dataset.value) < 6
                );
                if (canMerge) {
                    theBag.appendChild(die);
                    runFusions(theBag, 'bag');
                    bagCurrentCountDisplay.innerText = theBag.children.length;
                } else {
                    die.remove(); 
                    bagCurrentCountDisplay.innerText = theBag.children.length; // Actualizar después de procesar los dados restantes
                }
            }
        });

        let multiplier = getSilverMultiplier(document.querySelectorAll('.silver-slot .dice'));

        const cells = Array.from(document.querySelectorAll('.grid-cell'));
        let attacks = [];
        let totalDamageThisTurn = 0;

        // Aplicar daño de veneno al inicio del turno
        cells.forEach(cell => {
            const enemy = cell.querySelector(".enemy");
            if (enemy && enemy.dataset.poisoned === "true") {
                let poisonDamage = parseInt(enemy.dataset.poisonDamage) || 1;
                let hp = parseInt(enemy.dataset.hp);
                hp -= poisonDamage;
                enemy.dataset.hp = hp;
                enemy.querySelector(".hp").innerText = hp;

                // Actualizar visualmente el daño de veneno
                const dmgDisplay = document.createElement("span");
                dmgDisplay.classList.add("preview-damage", "poison-damage");
                dmgDisplay.innerText = `-${poisonDamage} (Veneno)`;
                enemy.appendChild(dmgDisplay);
                setTimeout(() => dmgDisplay.remove(), 800);

                if (hp <= 0) {
                    enemy.classList.add("lethal-hit");
                    setTimeout(() => enemy.remove(), 300);
                }
            }
        });

        cells.forEach(cell => {
            const die = cell.querySelector('.dice');
            if (die) {
                const r = parseInt(cell.dataset.row);
                const c = parseInt(cell.dataset.col);
                const type = die.dataset.type;
                
                const baseDamage = parseInt(die.dataset.value);
                const finalDamage = Math.floor(baseDamage * multiplier);
                attacks.push({ r, c, type, damage: finalDamage, dieElement: die });
            }
        });

        attacks.forEach(attack => {
            let targets = [];
            cells.forEach(targetCell => {
                const tr = parseInt(targetCell.dataset.row);
                const tc = parseInt(targetCell.dataset.col);
                let isHit = false;
                if (attack.type === 'green' && tr === attack.r) isHit = true;
                if (attack.type === 'blue' && tc === attack.c) isHit = true;
                if (attack.type === 'red' && (Math.abs(tr - attack.r) + Math.abs(tc - attack.c) <= 1)) isHit = true;
                if (attack.type === 'gold' && Math.abs(tr - attack.r) <= 1 && Math.abs(tc - attack.c) <= 1) isHit = true;
                if (attack.type === 'orange' && Math.abs(tr - attack.r) === 1 && Math.abs(tc - attack.c) === 1) isHit = true;
                if (attack.type === 'special') isHit = true; // El dado especial golpea a todos los enemigos
                
                if (isHit) targets.push(targetCell);
            });

            targets.forEach(tCell => {
                tCell.classList.remove('attack-hit');
                void tCell.offsetWidth;
                tCell.classList.add('attack-hit');

                const enemy = tCell.querySelector('.enemy');
                if (enemy) {
                    let currentDmg = attack.damage;
                    let shield = parseInt(enemy.dataset.shield) || 0;
                    let hp = parseInt(enemy.dataset.hp);
                    const enemyAbility = enemy.dataset.ability;

                    // Habilidad: Evade (Murciélago)
                    if (enemyAbility === 'evade' && Math.random() < 0.3) { // 30% de probabilidad de evadir
                        // console.log(`${enemy.dataset.name} evadió el ataque!`);
                        return; // El enemigo evade el daño
                    }

                    // Habilidad: Resist Area (Ogro)
                    if (enemyAbility === 'resist_area' && (attack.type === 'gold' || attack.type === 'special')) {
                        currentDmg = Math.floor(currentDmg * 0.5); // Reduce el daño de área a la mitad
                    }

                    totalDamageThisTurn += currentDmg;



                    // Habilidad: Poison (Serpiente)
                    if (enemyAbility === 'poison' && attack.type === 'orange' && currentDmg > 0) { // Los dados naranjas envenenan
                        enemy.dataset.poisoned = "true";
                        enemy.dataset.poisonDamage = parseInt(enemy.dataset.poisonDamage || 0) + 1; // Aumenta el daño de veneno
                        enemy.classList.add("poisoned");
                    }

                    if (shield > 0) {
                        if (currentDmg >= shield) {
                            currentDmg -= shield;
                            shield = 0;
                        } else {
                            shield -= currentDmg;
                            currentDmg = 0;
                        }
                    }

                    hp -= currentDmg;

                    // Mostrar el daño total infligido
                    const dmgDisplay = document.createElement('span');
                    dmgDisplay.classList.add('preview-damage');
                    dmgDisplay.innerText = `-${currentDmg}`;
                    enemy.appendChild(dmgDisplay);
                    setTimeout(() => dmgDisplay.remove(), 800);

                    if (hp <= 0) {
                        enemy.classList.remove('lethal-hit-preview'); // Remover preview si el enemigo es eliminado
                        enemy.classList.add('lethal-hit'); // Añadir clase para animación de daño letal
                        setTimeout(() => enemy.remove(), 300);
                    } else {
                        enemy.dataset.hp = hp;
                        enemy.dataset.shield = shield;
                        const shieldSpan = enemy.querySelector('.shield');
                        if (shield > 0) {
                            if (shieldSpan) shieldSpan.innerText = shield;
                            else {
                                const newShieldSpan = document.createElement('span');
                                newShieldSpan.classList.add('shield');
                                newShieldSpan.innerText = shield;
                                enemy.querySelector('.enemy-bars').prepend(newShieldSpan);
                            }
                        } else if (shieldSpan) {
                            shieldSpan.remove();
                        }
                        enemy.querySelector('.hp').innerText = hp;
                    }
                }
            });

            attack.dieElement.remove();
        });

        if (totalDamageThisTurn > 0) {
            setTotalRunScore(totalRunScore + totalDamageThisTurn);
            totalRunScoreDisplay.innerText = totalRunScore;
        }
        updateScoreboard(totalDamageThisTurn, lastAttackDisplay, topAttacksList);

        setTimeout(() => {
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    const cell = document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
                    const enemy = cell ? cell.querySelector('.enemy') : null;

                    if (enemy) {
                        if (c === 0) {
                            enemy.remove();
                            setPlayerHp(playerHp - 1);
                            playerHpDisplay.innerText = playerHp;

                            if (playerHp <= 0) {
                                triggerGameOver(totalRunScore);
                                return;
                            }
                        } else {
                            const nextCell = document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c-1}"]`);
                            if (nextCell && nextCell.children.length === 0) {
                                nextCell.appendChild(enemy);
                            }
                        }
                    }
                }
            }

            setTotalRoundsPlayed(totalRoundsPlayed + 1);
            if (totalRoundsPlayed % 3 === 0) {
                setCurrentWave(currentWave + 1);
                currentWaveDisplay.innerText = currentWave;

                if (currentWave % 5 === 0) {
                    triggerRewardSelection();
                    return; // Detener el turno para la selección de recompensa
                }
            }

            document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('attack-hit'));
            startRound();
        }, 600);
    }

    function triggerRewardSelection() {
        rewardModal.style.visibility = 'visible';
        rewardModal.style.opacity = '1';
        rewardOptionsContainer.innerHTML = '';

        const rewards = generateRewards();
        rewards.forEach(reward => {
            const rewardDiv = document.createElement('div');
            rewardDiv.classList.add('reward-option');
            rewardDiv.style.cssText = `
                background: var(--wood-light);
                padding: 15px;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s ease;
                width: 150px;
                text-align: center;
                color: var(--wood-dark);
                font-weight: bold;
            `;
            rewardDiv.innerHTML = `<h3>${reward.name}</h3><p>${reward.description}</p>`;
            rewardDiv.addEventListener('click', () => applyReward(reward));
            rewardOptionsContainer.appendChild(rewardDiv);
        });
    }

    function generateRewards() {
        const availableRewards = [
            { name: 'Vida Extra', description: '+5 HP', apply: () => setPlayerHp(playerHp + 5) },
            { name: 'Bolsa Ampliada', description: '+3 Espacios en Bolsa', apply: () => setBagLimit(BAG_LIMIT + 3) },
            { name: 'Multiplicador de Plata', description: '+0.1 Multiplicador Base', apply: () => setSilverBonusMultiplier(silverBonusMultiplier + 0.1) },
            { name: 'Dado Inicial Extra', description: '+1 Dado al inicio de cada ronda', apply: () => setExtraStartingDice(extraStartingDice + 1) }
        ];
        // Seleccionar 3 recompensas aleatorias
        return availableRewards.sort(() => 0.5 - Math.random()).slice(0, 3);
    }

    function applyReward(reward) {
        reward.apply();
        playerHpDisplay.innerText = playerHp;
        bagLimitDisplay.innerText = BAG_LIMIT;
        rewardModal.style.visibility = 'hidden';
        rewardModal.style.opacity = '0';
        startRound();
    }
});

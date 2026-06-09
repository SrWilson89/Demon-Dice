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
    
    // NUEVOS ELEMENTOS CAPTURADOS
    const toggleSilverFusion = document.getElementById('toggle-silver-fusion');
    const silverBoostText = document.getElementById('silver-boost-text');
    const totalRunScoreDisplay = document.getElementById('total-run-score');

    let diceCounter = 0;
    const BAG_LIMIT = 15;
    let draggedDie = null;
    let selectedDie = null;

    let playerHp = 20;
    let currentWave = 1;
    let totalRoundsPlayed = 0;
    let topScores = [];
    
    // NUEVA VARIABLE DE SCORE TOTAL
    let totalRunScore = 0;

    const ENEMY_VARIANTS = [
        { emoji: '👹', name: 'Ogro',       image: 'assets/enemies/ogro.png',       border: '#e74c3c' },
        { emoji: '💀', name: 'Calavera',   image: 'assets/enemies/calavera.png',   border: '#9b59b6' },
        { emoji: '🐲', name: 'Dragón',     image: 'assets/enemies/dragon.png',     border: '#e67e22' },
        { emoji: '🧟', name: 'Zombi',      image: 'assets/enemies/zombi.png',      border: '#27ae60' },
        { emoji: '🦇', name: 'Murciélago', image: 'assets/enemies/murcielago.png', border: '#2c3e50' },
        { emoji: '🕷️', name: 'Araña',      image: 'assets/enemies/arana.png',      border: '#8e44ad' },
        { emoji: '👾', name: 'Alien',      image: 'assets/enemies/alien.png',      border: '#16a085' },
        { emoji: '🧙', name: 'Brujo',      image: 'assets/enemies/brujo.png',      border: '#c0392b' },
        { emoji: '🐍', name: 'Serpiente',  image: 'assets/enemies/serpiente.png',  border: '#2ecc71' },
        { emoji: '🦂', name: 'Escorpión',  image: 'assets/enemies/escorpion.png',  border: '#f39c12' },
    ];

    // Tablero 5x5
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

    startRound();
    endTurnBtn.addEventListener('click', executeTurn);

    // --- CALCULO DINÁMICO DE MULTIPLIPLICADOR PLATA ---
    function getSilverMultiplier() {
        const silverDice = document.querySelectorAll('.silver-slot .dice');
        let totalValue = 0;
        silverDice.forEach(die => {
            totalValue += parseInt(die.dataset.value) || 0;
        });
        // Cada punto de valor sumado en los dados de plata añade un +25% de daño base
        return 1 + (totalValue * 0.25);
    }

    function updateSilverBoostDisplay() {
        const mult = getSilverMultiplier();
        const boostPercent = Math.round((mult - 1) * 100);
        if (silverBoostText) {
            silverBoostText.innerText = `Bono Daño: +${boostPercent}%`;
        }
    }

    function startRound() {
        spawnEnemies();
        drawHand();
        updateSilverBoostDisplay();
    }

    function spawnEnemies() {
        const cells = Array.from(document.querySelectorAll('.grid-cell'));
        const emptySpawnCells = cells.filter(cell => parseInt(cell.dataset.col) === 4 && cell.children.length === 0);
        if (emptySpawnCells.length === 0) return;

        const numToSpawn = Math.min(emptySpawnCells.length, Math.floor(Math.random() * 2) + 1 + (currentWave > 4 ? 1 : 0));
        emptySpawnCells.sort(() => Math.random() - 0.5);

        for (let i = 0; i < numToSpawn; i++) {
            const variant = ENEMY_VARIANTS[Math.floor(Math.random() * ENEMY_VARIANTS.length)];
            const enemy = document.createElement('div');
            enemy.classList.add('enemy');
            enemy.style.borderColor = variant.border;
            
            const baseHp = Math.floor(Math.random() * 4) + 3;
            const hpValue = baseHp + Math.floor(currentWave * 0.8);
            enemy.dataset.hp = hpValue;
            enemy.dataset.emoji = variant.emoji;
            enemy.dataset.name = variant.name;
            enemy.dataset.image = variant.image;

            let shieldValue = 0;
            if (currentWave >= 2) {
                shieldValue = Math.floor(currentWave / 2) + (Math.random() > 0.5 ? 1 : 0);
            }
            enemy.dataset.shield = shieldValue;

            const imgEl = document.createElement('img');
            imgEl.classList.add('enemy-image');
            imgEl.src = variant.image;
            imgEl.alt = variant.name;
            imgEl.draggable = false;

            const emojiEl = document.createElement('span');
            emojiEl.classList.add('enemy-emoji', 'enemy-fallback');
            emojiEl.innerText = variant.emoji;

            imgEl.addEventListener('error', () => {
                imgEl.remove();
                emojiEl.classList.remove('enemy-fallback');
            });

            enemy.appendChild(imgEl);
            enemy.appendChild(emojiEl);

            const barsContainer = document.createElement('div');
            barsContainer.classList.add('enemy-bars');

            if (shieldValue > 0) {
                const shieldDisplay = document.createElement('span');
                shieldDisplay.classList.add('shield');
                shieldDisplay.innerText = shieldValue;
                barsContainer.appendChild(shieldDisplay);
            }

            const hpDisplay = document.createElement('span');
            hpDisplay.classList.add('hp');
            hpDisplay.innerText = hpValue;
            barsContainer.appendChild(hpDisplay);
            
            enemy.appendChild(barsContainer);
            emptySpawnCells[i].appendChild(enemy);
        }
    }

    function drawHand() {
        for (let i = 0; i < 3; i++) {
            const die = createDie();
            currentHand.appendChild(die);
            
            if (toggleHandFusion && toggleHandFusion.checked) {
                checkZoneFusions(currentHand, 'hand');
            }
        }
    }

    function createDie() {
        const die = document.createElement('div');
        die.classList.add('dice');
        die.id = `die-${diceCounter++}`;
        die.draggable = true;

        const rand = Math.random();
        let type = '';
        if (rand < 0.12) type = 'silver';
        else if (rand < 0.24) type = 'gold';
        else if (rand < 0.36) type = 'orange'; 
        else if (rand < 0.56) type = 'red';
        else if (rand < 0.76) type = 'blue';
        else type = 'green';

        let value;
        if (type === 'silver') {
            value = Math.floor(Math.random() * 3) + 1;
        } else {
            value = Math.floor(Math.random() * 6) + 1;
        }
        
        die.classList.add(type);
        die.dataset.type = type;
        die.dataset.value = value;
        die.innerText = value;

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

        if (zoneType === 'bag') {
            runFusions(theBag, 'bag');
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

                const multiplier = getSilverMultiplier();
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
                } else {
                    die.remove(); 
                }
            }
        });

        let multiplier = getSilverMultiplier();

        const cells = Array.from(document.querySelectorAll('.grid-cell'));
        let attacks = [];
        let totalDamageThisTurn = 0;

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

                    totalDamageThisTurn += currentDmg;

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

                    if (hp <= 0) {
                        enemy.remove();
                    } else {
                        enemy.dataset.hp = hp;
                        enemy.dataset.shield = shield;
                        const shieldSpan = enemy.querySelector('.shield');
                        if (shield > 0) {
                            if (shieldSpan) shieldSpan.innerText = shield;
                        } else if (shieldSpan) {
                            shieldSpan.remove();
                        }
                        enemy.querySelector('.hp').innerText = hp;
                    }
                }
            });

            attack.dieElement.remove();
        });

        // ACTUALIZAR REGISTROS Y ACUMULAR PUNTUACIÓN GENERAL
        if (totalDamageThisTurn > 0) {
            totalRunScore += totalDamageThisTurn;
            totalRunScoreDisplay.innerText = totalRunScore;
        }
        updateScoreboard(totalDamageThisTurn);

        setTimeout(() => {
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    const cell = document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
                    const enemy = cell ? cell.querySelector('.enemy') : null;

                    if (enemy) {
                        if (c === 0) {
                            enemy.remove();
                            playerHp--;
                            playerHpDisplay.innerText = playerHp;

                            if (playerHp <= 0) {
                                triggerGameOver();
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

            totalRoundsPlayed++;
            if (totalRoundsPlayed % 3 === 0) {
                currentWave++;
                currentWaveDisplay.innerText = currentWave;
            }

            document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('attack-hit'));
            startRound();
        }, 600);
    }

    function updateScoreboard(damage) {
        lastAttackDisplay.innerText = damage;
        if (damage > 0) {
            topScores.push(damage);
            topScores.sort((a, b) => b - a);
            topScores = topScores.slice(0, 5);

            topAttacksList.innerHTML = '';
            for (let i = 0; i < 5; i++) {
                const li = document.createElement('li');
                li.innerText = topScores[i] !== undefined ? `${topScores[i]} Ptos` : '-';
                topAttacksList.appendChild(li);
            }
        }
    }

    // --- NUEVO SISTEMA LOCALSTORAGE: FIN DE JUEGO (TOP 10) ---
    function triggerGameOver() {
        // Recuperar registros del navegador o crear un arreglo vacío
        let localLeaderboard = JSON.parse(localStorage.getItem('dice_tactics_leaderboard')) || [];
        
        // Guardar la puntuación total actual
        localLeaderboard.push(totalRunScore);
        
        // Organizar de mayor a menor y descartar a partir del puesto 10
        localLeaderboard.sort((a, b) => b - a);
        localLeaderboard = localLeaderboard.slice(0, 10);
        
        // Guardar la lista actualizada en el almacenamiento local
        localStorage.setItem('dice_tactics_leaderboard', JSON.stringify(localLeaderboard));

        // Preparar y pintar el panel del Top 10 histórico
        let message = `💥 ¡JUEGO TERMINADO! Tu vida llegó a 0.\n\n`;
        message += `🎯 Puntuación Total de esta partida: ${totalRunScore} Ptos\n\n`;
        message += `🏆 TOP 10 HISTÓRICO DE PUNTAJES:\n`;
        
        localLeaderboard.forEach((score, index) => {
            message += `${index + 1}.   ${score} Ptos ${score === totalRunScore ? '⭐ (Tu récord)' : ''}\n`;
        });
        
        alert(message);
        location.reload();
    }
});
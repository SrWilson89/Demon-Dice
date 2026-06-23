export const ENEMY_VARIANTS = [
    { emoji: '👹', name: 'Ogro',       image: 'assets/enemies/ogro.png',       border: '#e74c3c', ability: 'resist_area' }, // Resiste daño de área
    { emoji: '💀', name: 'Calavera',   image: 'assets/enemies/calavera.png',   border: '#9b59b6', ability: 'lifesteal' }, // Roba vida al jugador
    { emoji: '🐲', name: 'Dragón',     image: 'assets/enemies/dragon.png',     border: '#e67e22' },
    { emoji: '🧟', name: 'Zombi',      image: 'assets/enemies/zombi.png',      border: '#27ae60' },
    { emoji: '🦇', name: 'Murciélago', image: 'assets/enemies/murcielago.png', border: '#2c3e50', ability: 'evade' }, // Probabilidad de evadir daño
    { emoji: '🕷️', name: 'Araña',      image: 'assets/enemies/arana.png',      border: '#8e44ad' },
    { emoji: '👾', name: 'Alien',      image: 'assets/enemies/alien.png',      border: '#16a085' },
    { emoji: '🧙', name: 'Brujo',      image: 'assets/enemies/brujo.png',      border: '#c0392b' },
    { emoji: '🐍', name: 'Serpiente',  image: 'assets/enemies/serpiente.png',  border: '#2ecc71', ability: 'poison' }, // Aplica veneno (daño por turno)
    { emoji: '🦂', name: 'Escorpión',  image: 'assets/enemies/escorpion.png',  border: '#f39c12' },
];

export let BAG_LIMIT = 15;

export let playerHp = 20;
export let currentWave = 1;
export let totalRoundsPlayed = 0;
export let topScores = [];
export let totalRunScore = 0;
export let silverBonusMultiplier = 0; // Bonus base para el multiplicador de plata
export let extraStartingDice = 0; // Dados extra al inicio de cada ronda

export const SPECIAL_DICE_VARIANT = { type: 'special', emoji: '💥', name: 'Dado de Hito', damageRange: [3, 6] };

export function setPlayerHp(value) { playerHp = value; }
export function setCurrentWave(value) { currentWave = value; }
export function setTotalRoundsPlayed(value) { totalRoundsPlayed = value; }
export function setTopScores(value) { topScores = value; }
export function setTotalRunScore(value) { totalRunScore = value; }
export function setBagLimit(value) { BAG_LIMIT = value; }
export function setSilverBonusMultiplier(value) { silverBonusMultiplier = value; }
export function setExtraStartingDice(value) { extraStartingDice = value; }

export function getSilverMultiplier(silverDiceElements) {
    let totalValue = 0;
    silverDiceElements.forEach(die => {
        totalValue += parseInt(die.dataset.value) || 0;
    });
    return 1 + (totalValue * 0.25) + silverBonusMultiplier;
}

export function updateScoreboard(damage, lastAttackDisplay, topAttacksList) {
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

export function triggerGameOver(totalRunScore) {
    let localLeaderboard = JSON.parse(localStorage.getItem('dice_tactics_leaderboard')) || [];
    localLeaderboard.push(totalRunScore);
    localLeaderboard.sort((a, b) => b - a);
    localLeaderboard = localLeaderboard.slice(0, 10);
    localStorage.setItem('dice_tactics_leaderboard', JSON.stringify(localLeaderboard));

    let message = `💥 ¡JUEGO TERMINADO! Tu vida llegó a 0.\n\n`;
    message += `🎯 Puntuación Total de esta partida: ${totalRunScore} Ptos\n\n`;
    message += `🏆 TOP 10 HISTÓRICO DE PUNTAJES:\n`;
    
    localLeaderboard.forEach((score, index) => {
        message += `${index + 1}.   ${score} Ptos ${score === totalRunScore ? '⭐ (Tu récord)' : ''}\n`;
    });
    
    alert(message);
    location.reload();
}

export function saveGameState() {
    const gameState = {
        playerHp,
        currentWave,
        totalRoundsPlayed,
        topScores,
        totalRunScore,
        BAG_LIMIT,
        silverBonusMultiplier,
        extraStartingDice,
        // Guardar el estado del tablero, mano y bolsa
        boardState: Array.from(document.querySelectorAll('.grid-cell')).map(cell => {
            const enemy = cell.querySelector('.enemy');
            const die = cell.querySelector('.dice');
            return {
                enemy: enemy ? { hp: enemy.dataset.hp, shield: enemy.dataset.shield, emoji: enemy.dataset.emoji, name: enemy.dataset.name, image: enemy.dataset.image, ability: enemy.dataset.ability, poisoned: enemy.dataset.poisoned, poisonDamage: enemy.dataset.poisonDamage } : null,
                die: die ? { type: die.dataset.type, value: die.dataset.value } : null
            };
        }),
        handState: Array.from(document.getElementById('current-hand').querySelectorAll('.dice')).map(die => ({ type: die.dataset.type, value: die.dataset.value })),
        bagState: Array.from(document.getElementById('the-bag').querySelectorAll('.dice')).map(die => ({ type: die.dataset.type, value: die.dataset.value })),
        silverSlotsState: Array.from(document.querySelectorAll('.silver-slot')).map(slot => {
            const die = slot.querySelector('.dice');
            return die ? { type: die.dataset.type, value: die.dataset.value } : null;
        })
    };
    localStorage.setItem('demonDiceGameState', JSON.stringify(gameState));
    console.log('Game state saved!');
}

export function loadGameState() {
    const savedState = localStorage.getItem('demonDiceGameState');
    if (savedState) {
        const gameState = JSON.parse(savedState);
        playerHp = gameState.playerHp;
        currentWave = gameState.currentWave;
        totalRoundsPlayed = gameState.totalRoundsPlayed;
        topScores = gameState.topScores;
        totalRunScore = gameState.totalRunScore;
        BAG_LIMIT = gameState.BAG_LIMIT;
        silverBonusMultiplier = gameState.silverBonusMultiplier;
        extraStartingDice = gameState.extraStartingDice;

        // Restaurar UI (esto se hará en game.js)
        return gameState;
    }
    return null;
}

export function spawnEnemies(mainGrid, currentWave, createEnemyElement) {
    const cells = Array.from(mainGrid.querySelectorAll(".grid-cell"));
    const emptySpawnCells = cells.filter(cell => parseInt(cell.dataset.col) === 4 && cell.children.length === 0);
    if (emptySpawnCells.length === 0) return;

    const numToSpawn = Math.min(emptySpawnCells.length, Math.floor(Math.random() * 2) + 1 + (currentWave > 4 ? 1 : 0));
    emptySpawnCells.sort(() => Math.random() - 0.5);

    for (let i = 0; i < numToSpawn; i++) {
        const variant = ENEMY_VARIANTS[Math.floor(Math.random() * ENEMY_VARIANTS.length)];
        const enemy = createEnemyElement({
            emoji: variant.emoji,
            name: variant.name,
            image: variant.image,
            hp: Math.floor(Math.random() * 4) + 3 + Math.floor(Math.pow(currentWave, 1.2) * 0.6), // Curva exponencial suave
            shield: (currentWave >= 3) ? (Math.floor(Math.pow(currentWave, 1.1) / 3) + (Math.random() > 0.5 ? 1 : 0)) : 0, // Escudo aparece más tarde y escala más lento
            ability: variant.ability
        });
        emptySpawnCells[i].appendChild(enemy);
    }
}

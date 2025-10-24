const symbols = ['🎮', '🎯', '🎨', '🎪', '🎭', '🎬', '🎸', '🎺'];

function createInitialState() {
    const cards = [...symbols, ...symbols]
        .map((symbol, index) => ({ id: index, symbol, matched: false, revealed: false }))
        .sort(() => Math.random() - 0.5);
    
    return {
        cards,
        flippedCards: [],
        moves: 0,
        isProcessing: false,
        startTime: null
    };
}

let lightModeState = createInitialState();
let darkModeState = createInitialState();
let currentMode = 'light';

function loadState() {
    try {
        const savedLightState = localStorage.getItem('memoryGameLightState');
        const savedDarkState = localStorage.getItem('memoryGameDarkState');
        const savedMode = localStorage.getItem('memoryGameMode');
        
        if (savedLightState) lightModeState = JSON.parse(savedLightState);
        if (savedDarkState) darkModeState = JSON.parse(savedDarkState);
        if (savedMode) {
            currentMode = savedMode;
            if (currentMode === 'dark') document.body.classList.add('dark-mode');
        }
    } catch (e) {
        console.error('Failed to load saved state:', e);
    }
}

function saveState() {
    try {
        localStorage.setItem('memoryGameLightState', JSON.stringify(lightModeState));
        localStorage.setItem('memoryGameDarkState', JSON.stringify(darkModeState));
        localStorage.setItem('memoryGameMode', currentMode);
    } catch (e) {
        console.error('Failed to save state:', e);
    }
}

function getCurrentState() {
    return currentMode === 'light' ? lightModeState : darkModeState;
}

function setCurrentState(newState) {
    currentMode === 'light' ? lightModeState = newState : darkModeState = newState;
    saveState();
}

function flipCard(state, cardId) {
    const card = state.cards.find(c => c.id === cardId);
    if (!card || card.matched || state.flippedCards.some(c => c.id === cardId)) return state;
    
    const flippedCards = [...state.flippedCards, card];
    const moves = flippedCards.length === 2 ? state.moves + 1 : state.moves;
    
    return {
        ...state,
        flippedCards,
        moves,
        isProcessing: flippedCards.length === 2,
        startTime: state.startTime || Date.now()
    };
}

function checkMatch(state) {
    if (state.flippedCards.length !== 2) return state;
    
    const [card1, card2] = state.flippedCards;
    const isMatch = card1.symbol === card2.symbol;
    
    const cards = state.cards.map(c => {
        if (c.id === card1.id || c.id === card2.id) {
            return isMatch ? { ...c, matched: true } : { ...c, revealed: true };
        }
        return c;
    });
    
    return {
        ...state,
        cards,
        flippedCards: [],
        isProcessing: false
    };
}

function isGameComplete(state) {
    return state.cards.every(c => c.matched);
}

function getHighscores(mode = 'light') {
    const key = mode === 'light' ? 'memoryGameHighscores' : 'memoryGameHighscoresDark';
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
}

function getBestScore() {
    const currentHighscores = getHighscores(currentMode);
    if (currentHighscores.length > 0) {
        return { ...currentHighscores[0], mode: currentMode };
    }
    
    const otherMode = currentMode === 'light' ? 'dark' : 'light';
    const otherHighscores = getHighscores(otherMode);
    if (otherHighscores.length > 0) {
        return { ...otherHighscores[0], mode: otherMode };
    }
    
    return null;
}

function createShareVisual(moves, mode) {
    const bg = mode === 'light' ? '⬜' : '⬛';
    const fg = mode === 'light' ? '🟦' : '🟨';
    
    const digits = {
        '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
        '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
        '2': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
        '3': [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
        '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
        '5': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
        '6': [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
        '7': [[1,1,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]],
        '8': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
        '9': [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]]
    };
    
    const movesStr = moves.toString();
    const digitPatterns = movesStr.split('').map(d => digits[d]);
    
    let lines = ['', '', '', '', ''];
    for (let row = 0; row < 5; row++) {
        for (let digitIdx = 0; digitIdx < digitPatterns.length; digitIdx++) {
            for (let col = 0; col < 3; col++) {
                lines[row] += digitPatterns[digitIdx][row][col] ? fg : bg;
            }
            if (digitIdx < digitPatterns.length - 1) {
                lines[row] += bg;
            }
        }
    }
    
    return lines.join('\n');
}

function handleShare() {
    const bestScore = getBestScore();
    if (!bestScore) {
        alert('No scores yet! Play a game first.');
        return;
    }
    
    const emoji = bestScore.mode === 'light' ? '💙' : '💛';
    const otherEmoji = bestScore.mode === 'light' ? '💛' : '💙';
    const visual = createShareVisual(bestScore.moves, bestScore.mode);
    const message = `${emoji} It only took me ${bestScore.time}s to solve in ${bestScore.moves} moves!\n${otherEmoji} Check it out on olzhas.de/vibes\n\n${visual}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).catch(() => {
            fallbackCopy(message);
        });
    } else {
        fallbackCopy(message);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
    } catch (e) {
        alert('Could not copy. Here is your share text:\n\n' + text);
    }
    document.body.removeChild(textarea);
}

function saveHighscore(score, mode = 'light') {
    const key = mode === 'light' ? 'memoryGameHighscores' : 'memoryGameHighscoresDark';
    const highscores = getHighscores(mode);
    highscores.push(score);
    highscores.sort((a, b) => {
        if (a.moves !== b.moves) return a.moves - b.moves;
        return a.time - b.time;
    });
    const top10 = highscores.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(top10));
    return top10;
}

function isBestScore(score, mode = 'light') {
    const highscores = getHighscores(mode);
    if (highscores.length === 0) return true;
    const best = highscores[0];
    return score.moves < best.moves || (score.moves === best.moves && score.time < best.time);
}

const DOM = {
    gameBoard: document.getElementById('game-board'),
    congratsScreen: document.getElementById('congratulations-screen'),
    finalMovesDisplay: document.getElementById('final-moves'),
    finalTimeDisplay: document.getElementById('final-time'),
    highscoreList: document.getElementById('highscore-list'),
    highscoresSection: document.getElementById('highscores-section'),
    gameView: document.getElementById('game-view'),
    pageTitle: document.getElementById('page-title'),
    lightModeBtn: document.getElementById('light-mode-btn'),
    darkModeBtn: document.getElementById('dark-mode-btn'),
    shareBtn: document.getElementById('share-btn'),
    showHighscoresBtn: document.getElementById('show-highscores-btn'),
    resetBtn: document.getElementById('reset-btn')
};

function renderBoard(state, isDarkMode = false) {
    const existingCards = Array.from(DOM.gameBoard.querySelectorAll('.card'));
    
    state.cards.forEach(card => {
        const existingCard = existingCards.find(el => parseInt(el.dataset.id) === card.id);
        const isFlipped = state.flippedCards.some(c => c.id === card.id);
        
        let className, content;
        if (card.matched) {
            className = 'card matched';
            content = card.symbol;
        } else if (isFlipped) {
            if (isDarkMode && card.revealed) {
                className = 'card selected';
                content = '';
            } else {
                className = 'card flipped';
                content = card.symbol;
            }
        } else {
            className = 'card hidden';
            content = '';
        }
        
        if (existingCard) {
            existingCard.className = className;
            existingCard.textContent = content;
            existingCard.blur();
        } else {
            const cardElement = document.createElement('div');
            cardElement.className = className;
            cardElement.dataset.id = card.id;
            cardElement.textContent = content;
            DOM.gameBoard.appendChild(cardElement);
        }
    });
}

function renderHighscores(lastScore = null) {
    const highscores = getHighscores(currentMode);
    
    if (highscores.length === 0) {
        DOM.highscoreList.innerHTML = '<p class="empty-message">No games completed yet. Start playing!</p>';
        return;
    }
    
    DOM.highscoreList.innerHTML = highscores.map((score, index) => {
        const isLastScore = lastScore?.timestamp === score.timestamp;
        return `
            <div class="highscore-item ${isLastScore ? 'highlighted' : ''}">
                <span class="highscore-rank">#${index + 1}</span>
                <div class="highscore-stats">
                    <span>${score.moves} moves</span>
                    <span>${score.time}s</span>
                </div>
            </div>
        `;
    }).join('');
}

function showGameView() {
    DOM.gameView.classList.remove('hidden');
    DOM.highscoresSection.classList.add('hidden');
    DOM.pageTitle.textContent = currentMode === 'dark' ? 'Hard Mode' : 'Memory Game';
    DOM.lightModeBtn.classList.toggle('active', currentMode === 'light');
    DOM.darkModeBtn.classList.toggle('active', currentMode === 'dark');
    DOM.showHighscoresBtn.classList.remove('active');
}

function showHighscoresView() {
    DOM.gameView.classList.add('hidden');
    DOM.highscoresSection.classList.remove('hidden');
    DOM.pageTitle.textContent = 'Highscores';
    DOM.showHighscoresBtn.classList.add('active');
}

function showCongratsModal(score) {
    DOM.finalMovesDisplay.textContent = score.moves;
    DOM.finalTimeDisplay.textContent = `${score.time}s`;
    DOM.congratsScreen.classList.remove('hidden');
}

function hideCongratsModal() {
    DOM.congratsScreen.classList.add('hidden');
}

function getElapsedTime(state) {
    return state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;
}

function handleCardClick(cardId) {
    const state = getCurrentState();
    if (state.isProcessing) return;
    
    const newState = flipCard(state, cardId);
    if (newState === state) return;
    
    setCurrentState(newState);
    renderBoard(newState, currentMode === 'dark');
    
    if (newState.flippedCards.length === 2) {
        setTimeout(() => {
            const matchedState = checkMatch(getCurrentState());
            setCurrentState(matchedState);
            renderBoard(matchedState, currentMode === 'dark');
            
            if (isGameComplete(matchedState)) {
                handleGameComplete(matchedState);
            }
        }, 600);
    }
}

function handleGameComplete(state) {
    const score = { moves: state.moves, time: getElapsedTime(state), timestamp: Date.now() };
    const isBest = isBestScore(score, currentMode);
    
    saveHighscore(score, currentMode);
    setCurrentState(createInitialState());
    renderBoard(getCurrentState(), currentMode === 'dark');
    
    if (isBest) {
        showCongratsModal(score);
        setTimeout(hideCongratsModal, 3000);
    }
    
    setTimeout(() => {
        renderHighscores(score);
        showHighscoresView();
    }, isBest ? 3200 : 300);
}

function handleNewGame() {
    setCurrentState(createInitialState());
    renderBoard(getCurrentState(), currentMode === 'dark');
    showGameView();
}

function handleShowHighscores() {
    renderHighscores();
    showHighscoresView();
}

function switchToLightMode() {
    if (currentMode === 'light') return showGameView();
    
    currentMode = 'light';
    document.body.classList.remove('dark-mode');
    saveState();
    renderBoard(getCurrentState(), false);
    showGameView();
}

function switchToDarkMode() {
    if (currentMode === 'dark') return showGameView();
    
    currentMode = 'dark';
    document.body.classList.add('dark-mode');
    saveState();
    renderBoard(getCurrentState(), true);
    showGameView();
}

loadState();

DOM.gameBoard.addEventListener('click', (e) => {
    const cardElement = e.target.closest('.card');
    if (!cardElement) return;
    
    const cardId = parseInt(cardElement.dataset.id);
    if (isNaN(cardId) || cardElement.classList.contains('matched') || cardElement.classList.contains('flipped')) return;
    
    handleCardClick(cardId);
});

DOM.resetBtn.addEventListener('click', handleNewGame);
DOM.lightModeBtn.addEventListener('click', switchToLightMode);
DOM.darkModeBtn.addEventListener('click', switchToDarkMode);
DOM.shareBtn.addEventListener('click', handleShare);
DOM.showHighscoresBtn.addEventListener('click', handleShowHighscores);

document.addEventListener('mousedown', (e) => {
    const target = e.target.closest('.card, .toolbar-btn, button');
    if (!target) return;
    if (target.classList.contains('card') && (target.classList.contains('matched') || target.classList.contains('flipped'))) return;
    
    const rect = target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    target.style.setProperty('--ripple-x', `${x}%`);
    target.style.setProperty('--ripple-y', `${y}%`);
});

renderBoard(getCurrentState(), currentMode === 'dark');
showGameView();

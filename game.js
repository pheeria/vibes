// ============================================================================
// GAME STATE & LOGIC
// ============================================================================

const symbols = ['🎮', '🎯', '🎨', '🎪', '🎭', '🎬', '🎸', '🎺'];

function createInitialState() {
    const cardSymbols = [...symbols, ...symbols];
    const cards = cardSymbols
        .map((symbol, index) => ({ id: index, symbol, matched: false, revealed: false }))
        .sort(() => Math.random() - 0.5);
    
    return {
        cards,
        flippedCards: [],
        moves: 0,
        matches: 0,
        isProcessing: false,
        startTime: null,
        elapsedTime: 0,
        lastScore: null
    };
}

// Separate state for each mode
let lightModeState = createInitialState();
let darkModeState = createInitialState();
let currentMode = 'light'; // 'light' or 'dark'
let isRendering = false;

// Load saved state from localStorage
function loadState() {
    try {
        const savedLightState = localStorage.getItem('memoryGameLightState');
        const savedDarkState = localStorage.getItem('memoryGameDarkState');
        const savedMode = localStorage.getItem('memoryGameMode');
        
        if (savedLightState) {
            lightModeState = JSON.parse(savedLightState);
        }
        if (savedDarkState) {
            darkModeState = JSON.parse(savedDarkState);
        }
        if (savedMode) {
            currentMode = savedMode;
            if (currentMode === 'dark') {
                document.body.classList.add('dark-mode');
            }
        }
    } catch (e) {
        console.error('Failed to load saved state:', e);
    }
}

// Save state to localStorage
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
    if (currentMode === 'light') {
        lightModeState = newState;
    } else {
        darkModeState = newState;
    }
    saveState();
}

function flipCard(state, cardId) {
    if (state.isProcessing) return state;
    
    const card = state.cards.find(c => c.id === cardId);
    if (!card || card.matched || state.flippedCards.some(c => c.id === cardId)) {
        return state;
    }
    
    const newFlippedCards = [...state.flippedCards, card];
    const newStartTime = state.startTime || Date.now();
    
    return {
        ...state,
        flippedCards: newFlippedCards,
        moves: newFlippedCards.length === 2 ? state.moves + 1 : state.moves,
        isProcessing: newFlippedCards.length === 2,
        startTime: newStartTime
    };
}

function checkMatch(state) {
    if (state.flippedCards.length !== 2) return state;
    
    const [card1, card2] = state.flippedCards;
    const isMatch = card1.symbol === card2.symbol;
    const newMatches = isMatch ? state.matches + 1 : state.matches;
    const isComplete = newMatches === symbols.length;
    
    const newCards = state.cards.map(c => {
        if (c.id === card1.id || c.id === card2.id) {
            if (isMatch) return { ...c, matched: true };
            if (!c.revealed) return { ...c, revealed: true };
        }
        return c;
    });
    
    return {
        ...state,
        cards: newCards,
        flippedCards: [],
        matches: newMatches,
        isProcessing: false,
        elapsedTime: isComplete ? Math.floor((Date.now() - state.startTime) / 1000) : state.elapsedTime
    };
}

function isGameComplete(state) {
    return state.matches === symbols.length;
}

// ============================================================================
// STORAGE
// ============================================================================

function getHighscores(mode = 'light') {
    const key = mode === 'light' ? 'memoryGameHighscores' : 'memoryGameHighscoresDark';
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
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

// ============================================================================
// DOM REFERENCES
// ============================================================================

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
    showHighscoresBtn: document.getElementById('show-highscores-btn'),
    resetBtn: document.getElementById('reset-btn')
};

// ============================================================================
// RENDERING
// ============================================================================

function renderBoard(state, isDarkMode = false) {
    if (isRendering) return;
    isRendering = true;
    
    DOM.gameBoard.innerHTML = '';
    
    state.cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.id = card.id;
        
        const isFlipped = state.flippedCards.some(c => c.id === card.id);
        const isFirstReveal = !card.revealed;
        
        if (card.matched) {
            cardElement.classList.add('matched');
            cardElement.textContent = card.symbol;
        } else if (isFlipped && (!isDarkMode || isFirstReveal)) {
            cardElement.classList.add('flipped');
            cardElement.textContent = card.symbol;
        } else if (isFlipped && isDarkMode) {
            cardElement.classList.add('selected');
        } else {
            cardElement.classList.add('hidden');
        }
        
        DOM.gameBoard.appendChild(cardElement);
    });
    
    setTimeout(() => { isRendering = false; }, 0);
}

function renderHighscores(lastScore) {
    const highscores = getHighscores(currentMode);
    
    if (highscores.length === 0) {
        DOM.highscoreList.innerHTML = `<p class="empty-message">No games completed yet. Start playing!</p>`;
        return;
    }
    
    const scoresList = highscores.map((score, index) => {
        const isLastScore = lastScore && 
            score.moves === lastScore.moves && 
            score.time === lastScore.time &&
            score.timestamp === lastScore.timestamp;
        
        const highlightClass = isLastScore ? 'highlighted' : '';
        
        return `
            <div class="highscore-item ${highlightClass}">
                <span class="highscore-rank">#${index + 1}</span>
                <div class="highscore-stats">
                    <span>${score.moves} moves</span>
                    <span>${score.time}s</span>
                </div>
            </div>
        `;
    }).join('');
    
    DOM.highscoreList.innerHTML = scoresList;
}

// ============================================================================
// VIEW MANAGEMENT
// ============================================================================

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

// ============================================================================
// TIMER
// ============================================================================

let timerInterval = null;

function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        const state = getCurrentState();
        if (state.startTime) {
            const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
            setCurrentState({ ...state, elapsedTime: elapsed });
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

function handleCardClick(cardId) {
    const state = getCurrentState();
    if (state.isProcessing) return;
    
    const card = state.cards.find(c => c.id === cardId);
    if (!card || card.matched || state.flippedCards.some(c => c.id === cardId)) return;
    
    const isDarkMode = currentMode === 'dark';
    const newState = flipCard(state, cardId);
    if (newState === state) return;
    
    setCurrentState(newState);
    renderBoard(newState, isDarkMode);
    
    if (newState.flippedCards.length === 1 && !timerInterval) {
        startTimer();
    }
    
    if (newState.flippedCards.length === 2) {
        setTimeout(() => {
            const matchedState = checkMatch(getCurrentState());
            setCurrentState(matchedState);
            renderBoard(matchedState, isDarkMode);
            
            if (isGameComplete(matchedState)) {
                stopTimer();
                handleGameComplete(matchedState);
            }
        }, 600);
    }
}

function handleGameComplete(state) {
    const score = { moves: state.moves, time: state.elapsedTime, timestamp: Date.now() };
    setCurrentState({ ...state, lastScore: score });
    
    // Check if best BEFORE saving
    const isBest = isBestScore(score, currentMode);
    
    // Now save the score
    saveHighscore(score, currentMode);
    
    // Reset the board immediately
    const newState = createInitialState();
    setCurrentState(newState);
    renderBoard(newState, currentMode === 'dark');
    
    // Show congratulations modal if best score
    if (isBest) {
        showCongratsModal(score);
        // Auto-hide after 3 seconds
        setTimeout(() => {
            hideCongratsModal();
        }, 3000);
    }
    
    // Navigate to highscores after a short delay
    setTimeout(() => {
        renderHighscores(score);
        showHighscoresView();
    }, isBest ? 3200 : 300);
}

function handleNewGame() {
    stopTimer();
    setCurrentState(createInitialState());
    renderBoard(getCurrentState(), currentMode === 'dark');
    showGameView();
}

function handlePlayAgain() {
    hideCongratsModal();
    setCurrentState(createInitialState());
    renderBoard(getCurrentState(), currentMode === 'dark');
    showGameView();
}

function handlePlayAgain() {
    hideCongratsModal();
    setCurrentState(createInitialState());
    renderBoard(getCurrentState(), currentMode === 'dark');
    showGameView();
}

function handleShowHighscores() {
    const state = getCurrentState();
    renderHighscores(state.lastScore);
    showHighscoresView();
}

function switchToLightMode() {
    if (currentMode === 'light') return showGameView();
    
    currentMode = 'light';
    document.body.classList.remove('dark-mode');
    stopTimer();
    saveState();
    renderBoard(getCurrentState(), false);
    showGameView();
}

function switchToDarkMode() {
    if (currentMode === 'dark') return showGameView();
    
    currentMode = 'dark';
    document.body.classList.add('dark-mode');
    stopTimer();
    saveState();
    renderBoard(getCurrentState(), true);
    showGameView();
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Load saved state
loadState();

// Use event delegation for card clicks
DOM.gameBoard.addEventListener('click', (e) => {
    const cardElement = e.target.closest('.card');
    if (!cardElement) return;
    
    const cardId = parseInt(cardElement.dataset.id);
    if (isNaN(cardId)) return;
    
    // Don't handle clicks on matched or flipped cards
    if (cardElement.classList.contains('matched') || cardElement.classList.contains('flipped')) {
        return;
    }
    
    handleCardClick(cardId);
});

DOM.resetBtn.addEventListener('click', handleNewGame);
DOM.lightModeBtn.addEventListener('click', switchToLightMode);
DOM.darkModeBtn.addEventListener('click', switchToDarkMode);
DOM.showHighscoresBtn.addEventListener('click', handleShowHighscores);

// Add ripple effect tracking
document.addEventListener('mousedown', (e) => {
    const target = e.target.closest('.card, .toolbar-btn, button');
    if (target) {
        // Don't apply ripple to matched or flipped cards
        if (target.classList.contains('card') && 
            (target.classList.contains('matched') || target.classList.contains('flipped'))) {
            return;
        }
        
        const rect = target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        target.style.setProperty('--ripple-x', `${x}%`);
        target.style.setProperty('--ripple-y', `${y}%`);
    }
});

renderBoard(getCurrentState(), currentMode === 'dark');
showGameView();

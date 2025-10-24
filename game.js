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

function getCurrentState() {
    return currentMode === 'light' ? lightModeState : darkModeState;
}

function setCurrentState(newState) {
    if (currentMode === 'light') {
        lightModeState = newState;
    } else {
        darkModeState = newState;
    }
}

function flipCard(state, cardId, isDarkMode = false) {
    if (state.isProcessing) return state;
    
    const card = state.cards.find(c => c.id === cardId);
    if (!card || card.matched || state.flippedCards.some(c => c.id === cardId)) {
        return state;
    }
    
    const newFlippedCards = [...state.flippedCards, card];
    const newStartTime = state.startTime || Date.now();
    
    // Don't mark as revealed yet - we'll do it after showing
    
    if (newFlippedCards.length === 2) {
        return {
            ...state,
            cards: state.cards,
            flippedCards: newFlippedCards,
            moves: state.moves + 1,
            isProcessing: true,
            startTime: newStartTime
        };
    }
    
    return {
        ...state,
        cards: state.cards,
        flippedCards: newFlippedCards,
        startTime: newStartTime
    };
}

function checkMatch(state) {
    if (state.flippedCards.length !== 2) return state;
    
    const [card1, card2] = state.flippedCards;
    const isMatch = card1.symbol === card2.symbol;
    
    if (isMatch) {
        const newCards = state.cards.map(c => 
            c.id === card1.id || c.id === card2.id 
                ? { ...c, matched: true }
                : c
        );
        
        const newMatches = state.matches + 1;
        const isComplete = newMatches === symbols.length;
        
        return {
            ...state,
            cards: newCards,
            flippedCards: [],
            matches: newMatches,
            isProcessing: false,
            elapsedTime: isComplete ? Math.floor((Date.now() - state.startTime) / 1000) : state.elapsedTime
        };
    }
    
    // No match - mark both cards as revealed in dark mode
    const newCards = state.cards.map(c => 
        (c.id === card1.id || c.id === card2.id) && !c.revealed
            ? { ...c, revealed: true }
            : c
    );
    
    return {
        ...state,
        cards: newCards,
        flippedCards: [],
        isProcessing: false
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
    playAgainBtn: document.getElementById('play-again-btn'),
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
    if (isRendering) {
        console.log('Skipping render - already rendering');
        return;
    }
    isRendering = true;
    
    DOM.gameBoard.innerHTML = '';
    
    state.cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.id = card.id;
        
        const isFlipped = state.flippedCards.some(c => c.id === card.id);
        const isFirstReveal = !card.revealed; // First time seeing this card
        
        if (card.matched) {
            // Always show matched cards
            cardElement.classList.add('matched');
            cardElement.textContent = card.symbol;
        } else if (isFlipped && (!isDarkMode || isFirstReveal)) {
            // Show emoji when flipped IF:
            // - Light mode: always show
            // - Dark mode: only show if first reveal (not revealed before)
            cardElement.classList.add('flipped');
            cardElement.textContent = card.symbol;
        } else if (isFlipped && isDarkMode && !isFirstReveal) {
            // Dark mode: card is selected but hidden (already revealed before)
            cardElement.classList.add('selected');
        } else {
            // Hidden cards
            cardElement.classList.add('hidden');
        }
        
        DOM.gameBoard.appendChild(cardElement);
    });
    
    // Use setTimeout to release the lock after rendering completes
    setTimeout(() => {
        isRendering = false;
    }, 0);
}

function renderHighscores(lastScore) {
    const highscores = getHighscores(currentMode);
    const modeLabel = currentMode === 'dark' ? ' (Hard Mode)' : '';
    
    if (highscores.length === 0) {
        DOM.highscoreList.innerHTML = `<p class="empty-message">No games completed yet${modeLabel}. Start playing!</p>`;
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
    DOM.pageTitle.textContent = currentMode === 'dark' ? 'Memory Game (Hard Mode)' : 'Memory Game';
    DOM.lightModeBtn.classList.toggle('active', currentMode === 'light');
    DOM.darkModeBtn.classList.toggle('active', currentMode === 'dark');
    DOM.showHighscoresBtn.classList.remove('active');
}

function showHighscoresView() {
    DOM.gameView.classList.add('hidden');
    DOM.highscoresSection.classList.remove('hidden');
    const modeLabel = currentMode === 'dark' ? ' (Hard Mode)' : '';
    DOM.pageTitle.textContent = `Highscores${modeLabel}`;
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
    if (!card || card.matched || state.flippedCards.some(c => c.id === cardId)) {
        return; // Already flipped or matched
    }
    
    const isDarkMode = currentMode === 'dark';
    const newState = flipCard(state, cardId, isDarkMode);
    if (newState === state) return; // No state change
    
    setCurrentState(newState);
    renderBoard(newState, isDarkMode);
    
    if (newState.flippedCards.length === 1 && !timerInterval) {
        startTimer();
    }
    
    if (newState.flippedCards.length === 2) {
        setTimeout(() => {
            const currentState = getCurrentState();
            const matchedState = checkMatch(currentState);
            setCurrentState(matchedState);
            renderBoard(matchedState, isDarkMode);
            
            if (isGameComplete(matchedState)) {
                stopTimer();
                handleGameComplete(matchedState);
            }
        }, 1000);
    }
}

function handleGameComplete(state) {
    const score = {
        moves: state.moves,
        time: state.elapsedTime,
        timestamp: Date.now()
    };
    
    const updatedState = { ...state, lastScore: score };
    setCurrentState(updatedState);
    
    const highscores = saveHighscore(score, currentMode);
    const isBest = isBestScore(score, currentMode);
    
    if (isBest) {
        showCongratsModal(score);
    }
    
    setTimeout(() => {
        const newState = createInitialState();
        setCurrentState(newState);
        const isDarkMode = currentMode === 'dark';
        renderBoard(newState, isDarkMode);
        renderHighscores(score);
        showHighscoresView();
    }, isBest ? 500 : 300);
}

function handleNewGame() {
    stopTimer();
    const newState = createInitialState();
    setCurrentState(newState);
    const isDarkMode = currentMode === 'dark';
    renderBoard(newState, isDarkMode);
    showGameView();
}

function handlePlayAgain() {
    hideCongratsModal();
    handleNewGame();
}

function handleShowHighscores() {
    const state = getCurrentState();
    renderHighscores(state.lastScore);
    showHighscoresView();
}

function switchToLightMode() {
    if (currentMode === 'light') {
        showGameView();
        return;
    }
    
    currentMode = 'light';
    document.body.classList.remove('dark-mode');
    stopTimer();
    renderBoard(lightModeState, false);
    showGameView();
}

function switchToDarkMode() {
    if (currentMode === 'dark') {
        showGameView();
        return;
    }
    
    currentMode = 'dark';
    document.body.classList.add('dark-mode');
    stopTimer();
    renderBoard(darkModeState, true);
    showGameView();
}

// ============================================================================
// INITIALIZATION
// ============================================================================

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
DOM.playAgainBtn.addEventListener('click', handlePlayAgain);
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

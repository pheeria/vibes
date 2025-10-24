// ============================================================================
// GAME STATE & LOGIC (Pure Functions)
// ============================================================================

const symbols = ['🎮', '🎯', '🎨', '🎪', '🎭', '🎬', '🎸', '🎺'];

function createInitialState() {
    return {
        cards: shuffleCards([...symbols, ...symbols]),
        flippedCards: [],
        moves: 0,
        matches: 0,
        isProcessing: false,
        startTime: null,
        elapsedTime: 0,
        lastScore: null
    };
}

function shuffleCards(cardSymbols) {
    return cardSymbols
        .map((symbol, index) => ({ id: index, symbol, matched: false }))
        .sort(() => Math.random() - 0.5);
}

function flipCard(state, cardId) {
    if (state.isProcessing) return state;
    
    const card = state.cards.find(c => c.id === cardId);
    if (!card || card.matched || state.flippedCards.includes(card)) {
        return state;
    }
    
    const newFlippedCards = [...state.flippedCards, card];
    const newStartTime = state.startTime || Date.now();
    
    if (newFlippedCards.length === 2) {
        return {
            ...state,
            flippedCards: newFlippedCards,
            moves: state.moves + 1,
            isProcessing: true,
            startTime: newStartTime
        };
    }
    
    return {
        ...state,
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
        const isGameComplete = newMatches === symbols.length;
        
        return {
            ...state,
            cards: newCards,
            flippedCards: [],
            matches: newMatches,
            isProcessing: false,
            elapsedTime: isGameComplete ? Math.floor((Date.now() - state.startTime) / 1000) : state.elapsedTime
        };
    }
    
    return {
        ...state,
        flippedCards: [],
        isProcessing: false
    };
}

function isGameComplete(state) {
    return state.matches === symbols.length;
}

// ============================================================================
// HIGHSCORE LOGIC (Pure Functions)
// ============================================================================

function saveHighscore(moves, time) {
    const highscores = getHighscores();
    const newScore = { moves, time, date: new Date().toISOString() };
    
    const isBestScore = highscores.length === 0 || 
                       moves < highscores[0].moves || 
                       (moves === highscores[0].moves && time < highscores[0].time);
    
    highscores.push(newScore);
    highscores.sort((a, b) => {
        if (a.moves !== b.moves) return a.moves - b.moves;
        return a.time - b.time;
    });
    
    const topScores = highscores.slice(0, 10);
    localStorage.setItem('memoryGameHighscores', JSON.stringify(topScores));
    
    return { isBestScore, score: newScore };
}

function getHighscores() {
    return JSON.parse(localStorage.getItem('memoryGameHighscores') || '[]');
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// VIEW LAYER (DOM Updates)
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
    showGameBtn: document.getElementById('show-game-btn'),
    showHighscoresBtn: document.getElementById('show-highscores-btn'),
    resetBtn: document.getElementById('reset-btn')
};

function renderBoard(state) {
    DOM.gameBoard.innerHTML = '';
    
    state.cards.forEach((card) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card hidden';
        cardElement.dataset.id = card.id;
        cardElement.textContent = card.symbol;
        
        if (card.matched) {
            cardElement.classList.add('matched');
            cardElement.classList.remove('hidden');
        }
        
        if (state.flippedCards.includes(card)) {
            cardElement.classList.remove('hidden');
            cardElement.classList.add('flipped');
        }
        
        cardElement.addEventListener('click', () => handleCardClick(card.id));
        DOM.gameBoard.appendChild(cardElement);
    });
}

function renderHighscores(lastScore) {
    const highscores = getHighscores();
    
    if (highscores.length === 0) {
        DOM.highscoreList.innerHTML = '<p class="empty-message">No games completed yet. Start playing!</p>';
        return;
    }
    
    DOM.highscoreList.innerHTML = highscores.map((score, index) => {
        const isLastScore = lastScore && 
                           score.moves === lastScore.moves && 
                           score.time === lastScore.time;
        const highlightClass = isLastScore ? ' highlighted' : '';
        
        return `
            <div class="highscore-item${highlightClass}">
                <span class="highscore-rank">#${index + 1}</span>
                <div class="highscore-stats">
                    <span>${score.moves} moves</span>
                    <span>${formatTime(score.time)}</span>
                </div>
            </div>
        `;
    }).join('');
}

function showCongratsModal(moves, time) {
    DOM.finalMovesDisplay.textContent = moves;
    DOM.finalTimeDisplay.textContent = formatTime(time);
    DOM.congratsScreen.classList.remove('hidden');
}

function hideCongratsModal() {
    DOM.congratsScreen.classList.add('hidden');
}

function showGameView() {
    DOM.gameView.classList.remove('hidden');
    DOM.highscoresSection.classList.add('hidden');
    DOM.pageTitle.textContent = 'Memory Game';
    DOM.showGameBtn.classList.add('active');
    DOM.showHighscoresBtn.classList.remove('active');
}

function showHighscoresView() {
    DOM.gameView.classList.add('hidden');
    DOM.highscoresSection.classList.remove('hidden');
    DOM.pageTitle.textContent = 'Highscores';
    DOM.showGameBtn.classList.remove('active');
    DOM.showHighscoresBtn.classList.add('active');
}

// ============================================================================
// APPLICATION STATE & CONTROLLERS
// ============================================================================

let gameState = createInitialState();
let timerInterval = null;

function startTimer() {
    timerInterval = setInterval(() => {
        gameState = {
            ...gameState,
            elapsedTime: Math.floor((Date.now() - gameState.startTime) / 1000)
        };
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function handleCardClick(cardId) {
    if (gameState.isProcessing) return;
    
    const newState = flipCard(gameState, cardId);
    if (newState === gameState) return; // No state change
    
    gameState = newState;
    renderBoard(gameState);
    
    if (newState.flippedCards.length === 1 && !timerInterval) {
        startTimer();
    }
    
    if (newState.flippedCards.length === 2) {
        setTimeout(() => {
            const matchedState = checkMatch(gameState);
            gameState = matchedState;
            renderBoard(gameState);
            
            if (isGameComplete(matchedState)) {
                stopTimer();
                handleGameComplete(matchedState);
            }
        }, 500);
    }
}

function handleGameComplete(state) {
    const { isBestScore, score } = saveHighscore(state.moves, state.elapsedTime);
    gameState = { ...state, lastScore: score };
    
    if (isBestScore) {
        showCongratsModal(state.moves, state.elapsedTime);
    }
    
    setTimeout(() => {
        gameState = createInitialState();
        renderBoard(gameState);
        renderHighscores(score);
        showHighscoresView();
    }, isBestScore ? 500 : 300);
}

function handleNewGame() {
    stopTimer();
    gameState = createInitialState();
    renderBoard(gameState);
    showGameView();
}

function handleShowGame() {
    showGameView();
}

function handleShowHighscores() {
    renderHighscores(gameState.lastScore);
    showHighscoresView();
}

function handlePlayAgain() {
    hideCongratsModal();
    handleNewGame();
}

// ============================================================================
// INITIALIZATION
// ============================================================================

DOM.resetBtn.addEventListener('click', handleNewGame);
DOM.playAgainBtn.addEventListener('click', handlePlayAgain);
DOM.showGameBtn.addEventListener('click', handleShowGame);
DOM.showHighscoresBtn.addEventListener('click', handleShowHighscores);

renderBoard(gameState);
showGameView();

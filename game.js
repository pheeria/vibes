const gameBoard = document.getElementById('game-board');
const resetBtn = document.getElementById('reset-btn');
const congratsScreen = document.getElementById('congratulations-screen');
const finalMovesDisplay = document.getElementById('final-moves');
const finalTimeDisplay = document.getElementById('final-time');
const playAgainBtn = document.getElementById('play-again-btn');
const highscoreList = document.getElementById('highscore-list');
const highscoresSection = document.getElementById('highscores-section');
const gameView = document.getElementById('game-view');
const pageTitle = document.getElementById('page-title');
const toggleHighscoresBtn = document.getElementById('toggle-highscores-btn');
const toggleIcon = document.getElementById('toggle-icon');

const symbols = ['🎮', '🎯', '🎨', '🎪', '🎭', '🎬', '🎸', '🎺'];
let cards = [];
let flippedCards = [];
let moves = 0;
let matches = 0;
let isProcessing = false;
let startTime = null;
let timerInterval = null;
let elapsedTime = 0;
let showingHighscores = false;
let lastScore = null;

function initGame() {
    cards = [...symbols, ...symbols]
        .map((symbol, index) => ({ id: index, symbol, matched: false }))
        .sort(() => Math.random() - 0.5);
    
    flippedCards = [];
    moves = 0;
    matches = 0;
    isProcessing = false;
    startTime = null;
    elapsedTime = 0;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    showingHighscores = false;
    gameView.classList.remove('hidden');
    pageTitle.textContent = 'Memory Game';
    highscoresSection.classList.add('hidden');
    toggleIcon.textContent = '🏆';
    lastScore = null;
    renderBoard();
}

function renderBoard() {
    gameBoard.innerHTML = '';
    
    cards.forEach((card) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card hidden';
        cardElement.dataset.id = card.id;
        cardElement.textContent = card.symbol;
        
        if (card.matched) {
            cardElement.classList.add('matched');
            cardElement.classList.remove('hidden');
        }
        
        cardElement.addEventListener('click', () => handleCardClick(card, cardElement));
        gameBoard.appendChild(cardElement);
    });
}

function handleCardClick(card, element) {
    if (isProcessing || card.matched || flippedCards.includes(card)) {
        return;
    }
    
    if (!startTime) {
        startTime = Date.now();
        startTimer();
    }
    
    flippedCards.push(card);
    element.classList.remove('hidden');
    element.classList.add('flipped');
    
    if (flippedCards.length === 2) {
        isProcessing = true;
        moves++;
        checkMatch();
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    
    if (card1.symbol === card2.symbol) {
        card1.matched = true;
        card2.matched = true;
        matches++;
        
        setTimeout(() => {
            renderBoard();
            flippedCards = [];
            isProcessing = false;
            
            if (matches === symbols.length) {
                clearInterval(timerInterval);
                setTimeout(() => {
                    showCongratulations();
                    resetBoardAndShowHighscores();
                }, 300);
            }
        }, 500);
    } else {
        setTimeout(() => {
            const elements = document.querySelectorAll('.card');
            elements.forEach(el => {
                const cardId = parseInt(el.dataset.id);
                const card = cards.find(c => c.id === cardId);
                if (!card.matched) {
                    el.classList.add('hidden');
                    el.classList.remove('flipped');
                }
            });
            
            flippedCards = [];
            isProcessing = false;
        }, 1000);
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    }, 1000);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showCongratulations() {
    finalMovesDisplay.textContent = moves;
    finalTimeDisplay.textContent = formatTime(elapsedTime);
    lastScore = { moves, time: elapsedTime };
    const isBestScore = saveHighscore(moves, elapsedTime);
    loadHighscores();
    
    if (isBestScore) {
        congratsScreen.classList.remove('hidden');
    }
}

function saveHighscore(moves, time) {
    const highscores = JSON.parse(localStorage.getItem('memoryGameHighscores') || '[]');
    const newScore = { moves, time, date: new Date().toISOString() };
    
    let isBestScore = highscores.length === 0;
    
    if (!isBestScore) {
        const bestScore = highscores[0];
        if (moves < bestScore.moves || (moves === bestScore.moves && time < bestScore.time)) {
            isBestScore = true;
        }
    }
    
    highscores.push(newScore);
    highscores.sort((a, b) => {
        if (a.moves !== b.moves) return a.moves - b.moves;
        return a.time - b.time;
    });
    const topScores = highscores.slice(0, 10);
    localStorage.setItem('memoryGameHighscores', JSON.stringify(topScores));
    
    return isBestScore;
}

function loadHighscores() {
    const highscores = JSON.parse(localStorage.getItem('memoryGameHighscores') || '[]');
    
    if (highscores.length === 0) {
        highscoreList.innerHTML = '<p class="empty-message">No games completed yet. Start playing!</p>';
        return;
    }
    
    highscoreList.innerHTML = highscores.map((score, index) => {
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

function hideCongratulations() {
    congratsScreen.classList.add('hidden');
}

function resetBoardAndShowHighscores() {
    cards = [...symbols, ...symbols]
        .map((symbol, index) => ({ id: index, symbol, matched: false }))
        .sort(() => Math.random() - 0.5);
    
    flippedCards = [];
    moves = 0;
    matches = 0;
    isProcessing = false;
    startTime = null;
    elapsedTime = 0;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    renderBoard();
    
    showingHighscores = true;
    gameView.classList.add('hidden');
    pageTitle.textContent = 'Highscores';
    highscoresSection.classList.remove('hidden');
    toggleIcon.textContent = '🎮';
}

function toggleHighscores() {
    showingHighscores = !showingHighscores;
    
    if (showingHighscores) {
        gameView.classList.add('hidden');
        pageTitle.textContent = 'Highscores';
        highscoresSection.classList.remove('hidden');
        toggleIcon.textContent = '🎮';
        loadHighscores();
    } else {
        gameView.classList.remove('hidden');
        pageTitle.textContent = 'Memory Game';
        highscoresSection.classList.add('hidden');
        toggleIcon.textContent = '🏆';
    }
}

resetBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', () => {
    hideCongratulations();
    initGame();
});
toggleHighscoresBtn.addEventListener('click', toggleHighscores);

initGame();

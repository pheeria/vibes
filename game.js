const gameBoard = document.getElementById('game-board');
const movesDisplay = document.getElementById('moves');
const matchesDisplay = document.getElementById('matches');
const resetBtn = document.getElementById('reset-btn');
const congratsScreen = document.getElementById('congratulations-screen');
const finalMovesDisplay = document.getElementById('final-moves');
const playAgainBtn = document.getElementById('play-again-btn');

const symbols = ['🎮', '🎯', '🎨', '🎪', '🎭', '🎬', '🎸', '🎺'];
let cards = [];
let flippedCards = [];
let moves = 0;
let matches = 0;
let isProcessing = false;

function initGame() {
    cards = [...symbols, ...symbols]
        .map((symbol, index) => ({ id: index, symbol, matched: false }))
        .sort(() => Math.random() - 0.5);
    
    flippedCards = [];
    moves = 0;
    matches = 0;
    isProcessing = false;
    
    updateStats();
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
    
    flippedCards.push(card);
    element.classList.remove('hidden');
    element.classList.add('flipped');
    
    if (flippedCards.length === 2) {
        isProcessing = true;
        moves++;
        updateStats();
        checkMatch();
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    
    if (card1.symbol === card2.symbol) {
        card1.matched = true;
        card2.matched = true;
        matches++;
        updateStats();
        
        setTimeout(() => {
            renderBoard();
            flippedCards = [];
            isProcessing = false;
            
            if (matches === symbols.length) {
                setTimeout(() => {
                    showCongratulations();
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

function updateStats() {
    movesDisplay.textContent = moves;
    matchesDisplay.textContent = matches;
}

function showCongratulations() {
    finalMovesDisplay.textContent = moves;
    congratsScreen.classList.remove('hidden');
}

function hideCongratulations() {
    congratsScreen.classList.add('hidden');
}

resetBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', () => {
    hideCongratulations();
    initGame();
});

initGame();

const WORDS = [
    { word: "COUPOLES", image: "images/coupoles.jpg", description: "Ce sont de grands toits arrondis, comme des bols retournés, qui couvrent le bâtiment." },
    { word: "CIRCULAIRES", image: "images/circulaires.jpg", description: "Cela veut dire que c'est tout rond, comme un cercle !" },
    { word: "ROTONDE", image: "images/rotonde.jpg", description: "Une grande salle ronde. C'est le cœur de la Bourse de Commerce." },
    { word: "VERRE", image: "images/verre.jpg", description: "La grande coupole est faite de verre pour laisser passer la lumière du soleil." },
    { word: "METAL", image: "images/metal.jpg", description: "C'est la structure solide qui tient tout le verre de la coupole." },
    { word: "LUMIERE", image: "images/lumiere.jpg", description: "Elle entre par la coupole et change tout au long de la journée." },
    { word: "BOURSE", image: "images/bourse.jpg", description: "Avant, on y échangeait du blé et de la farine. Aujourd'hui, on y voit de l'art !" },
    { word: "OISEAU", image: "images/oiseau.jpg", description: "Parfois, des oiseaux entrent sous la coupole ou sont représentés dans les décorations." },
    { word: "EVOLUTION", image: "images/evolution.jpg", description: "Le bâtiment a beaucoup changé à travers l'histoire pour devenir ce qu'il est." }
];

const GRID_SIZE = 12; // 12x12 grid
const DIRECTIONS = [
    { x: 1, y: 0 },   // Horizontal
    { x: 0, y: 1 },   // Vertical
    { x: 1, y: 1 },   // Diagonal Down-Right
    { x: 1, y: -1 }   // Diagonal Up-Right
];

let grid = [];
let foundWords = new Set();
let isSelecting = false;
let selectionStart = null;
let selectionEnd = null;
let selectionPath = [];

// DOM Elements
const gridContainer = document.getElementById('grid-container');
const wordsListContainer = document.getElementById('words-list');
const selectionLayer = document.getElementById('selection-layer');
const progressText = document.getElementById('progress-text');
const celebrationOverlay = document.getElementById('celebration-overlay');
const celebrationCard = document.getElementById('celebration-card');

function initGame() {
    // defined grid size in CSS to match JS grid size
    gridContainer.style.gridTemplateColumns = `repeat(${GRID_SIZE}, minmax(0, 1fr))`;

    // Initialize empty grid
    for (let y = 0; y < GRID_SIZE; y++) {
        let row = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            row.push('');
        }
        grid.push(row);
    }

    // Place words
    placeWords();

    // Fill empty spaces
    fillEmptySpaces();

    // Render Grid
    renderGrid();

    // Render Word List
    renderWordList();

    // Setup Event Listeners
    setupInteraction();
}

function placeWords() {
    // Sort words by length descending to place longer words first (easier to find space)
    const sortedWords = [...WORDS].sort((a, b) => b.word.length - a.word.length);

    for (const item of sortedWords) {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 100) {
            const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
            const startX = Math.floor(Math.random() * GRID_SIZE);
            const startY = Math.floor(Math.random() * GRID_SIZE);

            if (canPlaceWord(item.word, startX, startY, direction)) {
                doPlaceWord(item.word, startX, startY, direction);
                placed = true;
            }
            attempts++;
        }
        if (!placed) {
            console.warn(`Could not place word: ${item.word}`);
            // Fallback: try placing linearly if random fails, or just skip
        }
    }
}

function canPlaceWord(word, startX, startY, direction) {
    for (let i = 0; i < word.length; i++) {
        const x = startX + i * direction.x;
        const y = startY + i * direction.y;

        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
            return false;
        }

        const currentCell = grid[y][x];
        if (currentCell !== '' && currentCell !== word[i]) {
            return false;
        }
    }
    return true;
}

function doPlaceWord(word, startX, startY, direction) {
    for (let i = 0; i < word.length; i++) {
        const x = startX + i * direction.x;
        const y = startY + i * direction.y;
        grid[y][x] = word[i];
    }
}

function fillEmptySpaces() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x] === '') {
                grid[y][x] = letters.charAt(Math.floor(Math.random() * letters.length));
            }
        }
    }
}

function renderGrid() {
    gridContainer.innerHTML = '';
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.textContent = grid[y][x];
            cell.dataset.x = x;
            cell.dataset.y = y;
            gridContainer.appendChild(cell);
        }
    }
}

function renderWordList() {
    wordsListContainer.innerHTML = '';
    WORDS.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('word-card');
        div.dataset.word = item.word;

        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.word;

        const span = document.createElement('span');
        span.textContent = item.word;

        div.appendChild(img);
        div.appendChild(span);
        wordsListContainer.appendChild(div);
    });
    updateProgress();
}

function setupInteraction() {
    const handleStart = (e) => {
        isSelecting = true;
        // Use closest for initial touch/click to ensure we get the cell even if child elements are clicked
        const target = e.target.closest('.grid-cell') || getTargetCell(e);

        if (target) {
            selectionStart = { x: parseInt(target.dataset.x), y: parseInt(target.dataset.y) };
            updateSelectionVisual(target);
        }
    };

    const handleMove = (e) => {
        if (!isSelecting || !selectionStart) return;
        const target = getTargetCell(e);
        if (target) {
            selectionEnd = { x: parseInt(target.dataset.x), y: parseInt(target.dataset.y) };
            drawSelectionLine(selectionStart, selectionEnd);
        }
    };

    const handleEnd = () => {
        if (!isSelecting) return;
        isSelecting = false;
        clearSelectionLine();
        document.querySelectorAll('.selecting').forEach(el => el.classList.remove('selecting'));

        if (selectionStart && selectionEnd) {
            checkSelection(selectionStart, selectionEnd);
        }
        selectionStart = null;
        selectionEnd = null;
    };

    // Mouse Events
    gridContainer.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    // Touch Events
    gridContainer.addEventListener('touchstart', (e) => {
        // Find if the touch started on a grid cell
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.closest('.grid-cell')) {
            e.preventDefault(); // Prevent scrolling while playing ONLY if touching grid
            // Manually trigger handleStart with a mock event object that has the target
            handleStart({ target: target, clientX: touch.clientX, clientY: touch.clientY });
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (isSelecting) {
            e.preventDefault();
            handleMove(e.touches[0]);
        }
    }, { passive: false });

    window.addEventListener('touchend', handleEnd);
}

function getTargetCell(e) {
    // Use elementsFromPoint to "pierce" through the SVG overlay or other elements
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    for (const element of elements) {
        if (element.classList.contains('grid-cell')) {
            return element;
        }
    }
    return null;
}

function drawSelectionLine(start, end) {
    // Simple Bresenham or just straight SVG line
    selectionLayer.innerHTML = ''; // Clear previous
    // Calculate center of start and end cells
    const startEl = document.querySelector(`.grid-cell[data-x="${start.x}"][data-y="${start.y}"]`);
    const endEl = document.querySelector(`.grid-cell[data-x="${end.x}"][data-y="${end.y}"]`);

    if (!startEl || !endEl) return;

    const containerRect = document.getElementById('game-board').getBoundingClientRect();
    const startRect = startEl.getBoundingClientRect();
    const endRect = endEl.getBoundingClientRect();

    const x1 = startRect.left + startRect.width / 2 - containerRect.left;
    const y1 = startRect.top + startRect.height / 2 - containerRect.top;
    const x2 = endRect.left + endRect.width / 2 - containerRect.left;
    const y2 = endRect.top + endRect.height / 2 - containerRect.top;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('class', 'selection-line');
    selectionLayer.appendChild(line);
}

function clearSelectionLine() {
    selectionLayer.innerHTML = '';
}

function updateSelectionVisual(target) {
    // Optional: highlight starting cell
    // Clear previous generic highlights if any (though usually managed by line)
    // We can add a temporary class 'selecting'
    document.querySelectorAll('.selecting').forEach(el => el.classList.remove('selecting'));
    target.classList.add('selecting');
}

function checkSelection(start, end) {
    // Determine word selected
    const word = getWordFromSelection(start, end);
    if (word && isWordInList(word) && !foundWords.has(word)) {
        foundWords.add(word);
        markWordFound(word, start, end);
        updateProgress();
        checkWin();
    }
}

function getWordFromSelection(start, end) {
    // Calculate direction
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Check if valid direction (horizontal, vertical, diagonal)
    // Normalize step
    const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
    const stepY = dy === 0 ? 0 : dy / Math.abs(dy);

    // If it's not a straight line (diagonal must have equal abs dx and dy)
    if (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy)) return null;

    let str = "";
    let x = start.x;
    let y = start.y;

    // Length including end
    const length = Math.max(Math.abs(dx), Math.abs(dy)) + 1;

    for (let i = 0; i < length; i++) {
        str += grid[y][x];
        x += stepX;
        y += stepY;
    }

    return str;
}

function isWordInList(word) {
    // Check normal and reverse
    return WORDS.some(w => w.word === word) || WORDS.some(w => w.word === word.split('').reverse().join(''));
}

function markWordFound(word, start, end) {
    // Check if reversed
    let actualWord = word;
    if (!WORDS.some(w => w.word === word)) {
        actualWord = word.split('').reverse().join('');
    }

    // Highlight Grid Cells
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
    const stepY = dy === 0 ? 0 : dy / Math.abs(dy);
    const length = Math.max(Math.abs(dx), Math.abs(dy)) + 1;

    let x = start.x;
    let y = start.y;
    for (let i = 0; i < length; i++) {
        const cell = document.querySelector(`.grid-cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) cell.classList.add('found');
        x += stepX;
        y += stepY;
    }

    // Cross off from list
    const card = document.querySelector(`.word-card[data-word="${actualWord}"]`);
    if (card) {
        card.classList.add('found');
    }

    // Show Explanation
    const wordData = WORDS.find(w => w.word === actualWord);
    if (wordData) {
        showExplanation(wordData);
    }
}

// Explanation Modal Logic
const explanationOverlay = document.getElementById('explanation-overlay');
const explanationTitle = document.getElementById('explanation-title');
const explanationImage = document.getElementById('explanation-image');
const explanationText = document.getElementById('explanation-text');
const closeExplanationBtn = document.getElementById('close-explanation');
const continueBtn = document.getElementById('continue-btn');

function showExplanation(wordData) {
    explanationTitle.textContent = wordData.word;
    explanationImage.src = wordData.image;
    explanationText.textContent = wordData.description;

    explanationOverlay.classList.add('modal-active');
}

function closeExplanation() {
    explanationOverlay.classList.remove('modal-active');
}

closeExplanationBtn?.addEventListener('click', closeExplanation);
continueBtn?.addEventListener('click', closeExplanation);

function updateProgress() {
    progressText.textContent = `${foundWords.size} / ${WORDS.length}`;
}

function checkWin() {
    if (foundWords.size === WORDS.length) {
        setTimeout(() => {
            celebrationOverlay.classList.add('celebrate-active');
            celebrationCard.classList.add('pop-in');
            launchConfetti(); // Optional but fun
        }, 1000); // Wait a bit after the last explanation
    }
}

function launchConfetti() {
    // Simple confetti effect (optional, maybe not needed since not requested but adds "Wow")
}

// Start
initGame();

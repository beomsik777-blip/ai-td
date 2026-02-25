const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const roundSpan = document.getElementById('round');
const livesSpan = document.getElementById('lives');
const moneySpan = document.getElementById('money');

const towerButtons = document.querySelectorAll('.tower-button');
const startRoundButton = document.getElementById('start-round');

// Game state
let round = 1;
let lives = 20;
let money = 100;

// Game loop (placeholder)
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw game objects (towers, enemies, projectiles)

    requestAnimationFrame(gameLoop);
}

// Event Listeners
startRoundButton.addEventListener('click', () => {
    if (round <= 5) {
        console.log(`Starting round ${round}`);
        // Add logic to start the round (e.g., spawn enemies)
        round++;
        roundSpan.textContent = round;
    } else {
        alert('You have completed all rounds!');
    }
});

towerButtons.forEach(button => {
    button.addEventListener('click', () => {
        const towerType = button.dataset.tower;
        console.log(`Selected ${towerType} tower`);
        // Add logic to place the tower
    });
});

// Start the game loop
// gameLoop();

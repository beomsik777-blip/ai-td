// Function to switch between views
function switchView(viewId) {
    console.log("Attempting to switch to:", viewId);
    
    // 1. All views and buttons
    const views = document.querySelectorAll('.view');
    const navButtons = document.querySelectorAll('.nav-btn');

    // 2. Reset states
    views.forEach(v => v.classList.remove('active'));
    navButtons.forEach(b => b.classList.remove('active'));

    // 3. Activate target view
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
        console.log("View activated:", viewId);
    }

    // 4. Activate target nav button
    const targetBtn = document.querySelector(`.nav-btn[data-target="${viewId}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }

    // 5. Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Premium Hub Initialized");

    // --- Navigation ---
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.dataset.target);
        });
    });

    // --- Hero Buttons (Home Screen) ---
    const heroLottoBtn = document.getElementById('hero-lotto-btn');
    const heroAboutBtn = document.getElementById('hero-about-btn');
    const backHomeBtn = document.getElementById('back-home-btn');

    if (heroLottoBtn) {
        heroLottoBtn.addEventListener('click', () => switchView('lotto-view'));
    }
    if (heroAboutBtn) {
        heroAboutBtn.addEventListener('click', () => switchView('about-view'));
    }
    if (backHomeBtn) {
        backHomeBtn.addEventListener('click', () => switchView('home-view'));
    }

    // --- Lotto Generator ---
    const generateBtn = document.getElementById('generate-btn');
    const resultsContainer = document.getElementById('results-container');

    function getBallClass(num) {
        if (num <= 10) return 'ball-1';
        if (num <= 20) return 'ball-2';
        if (num <= 30) return 'ball-3';
        if (num <= 40) return 'ball-4';
        return 'ball-5';
    }

    function generateLottoNumbers() {
        const numbers = new Set();
        while (numbers.size < 6) {
            numbers.add(Math.floor(Math.random() * 45) + 1);
        }
        return Array.from(numbers).sort((a, b) => a - b);
    }

    if (generateBtn && resultsContainer) {
        generateBtn.addEventListener('click', () => {
            resultsContainer.innerHTML = '';
            for (let i = 0; i < 3; i++) {
                const numbers = generateLottoNumbers();
                const row = document.createElement('div');
                row.className = 'lotto-row';
                
                numbers.forEach((num, delayIdx) => {
                    const ball = document.createElement('div');
                    ball.className = `ball ${getBallClass(num)}`;
                    ball.textContent = num;
                    ball.style.transitionDelay = `${delayIdx * 0.1}s`;
                    row.appendChild(ball);
                });

                resultsContainer.appendChild(row);
                setTimeout(() => row.classList.add('show'), i * 200);
            }
        });
    }
});
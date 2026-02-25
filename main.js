// Global SwitchView Function
function switchView(viewId) {
    const views = document.querySelectorAll('.view');
    const navButtons = document.querySelectorAll('.nav-btn');

    // 1. Hide all views and deactivate all nav buttons
    views.forEach(view => {
        view.classList.remove('active');
    });
    navButtons.forEach(btn => {
        btn.classList.remove('active');
    });

    // 2. Show the target view
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    }

    // 3. Highlight the corresponding nav button
    const targetBtn = document.querySelector(`.nav-btn[data-target="${viewId}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }

    // 4. Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    // Navigation Buttons Click Event
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.dataset.target;
            switchView(target);
        });
    });

    // Lotto Generator Logic
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

    function createRow() {
        const numbers = generateLottoNumbers();
        const row = document.createElement('div');
        row.className = 'lotto-row';
        
        numbers.forEach((num, i) => {
            const ball = document.createElement('div');
            ball.className = `ball ${getBallClass(num)}`;
            ball.textContent = num;
            ball.style.transitionDelay = `${i * 0.1}s`;
            row.appendChild(ball);
        });

        return row;
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            resultsContainer.innerHTML = '';
            
            for (let i = 0; i < 3; i++) {
                const row = createRow();
                resultsContainer.appendChild(row);
                
                // Trigger animation after a short delay for DOM insertion
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        row.classList.add('show');
                    }, i * 200);
                });
            }
        });
    }
});
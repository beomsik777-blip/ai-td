document.addEventListener('DOMContentLoaded', () => {
    // View Switching Logic
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    function switchView(viewId) {
        views.forEach(view => {
            view.classList.remove('active');
            if (view.id === viewId) {
                setTimeout(() => view.classList.add('active'), 50);
            }
        });

        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.target === viewId) {
                btn.classList.add('active');
            }
        });
        
        // Scroll to top when switching
        window.scrollTo(0, 0);
    }

    // Attach switchView to global for inline onclick
    window.switchView = switchView;

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
                
                setTimeout(() => {
                    row.classList.add('show');
                }, i * 200);
            }
        });
    }
});
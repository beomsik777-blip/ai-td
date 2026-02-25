document.addEventListener('DOMContentLoaded', () => {
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

    function createRow(index) {
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

    generateBtn.addEventListener('click', () => {
        // Clear previous results with a quick fade
        resultsContainer.innerHTML = '';
        
        // Generate 3 sets
        for (let i = 0; i < 3; i++) {
            const row = createRow(i);
            resultsContainer.appendChild(row);
            
            // Trigger animation
            setTimeout(() => {
                row.classList.add('show');
            }, i * 200);
        }
    });
});
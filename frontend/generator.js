/**
 * Arcania Generator Manager (REFACTORED)
 * Handles all functionality for the generator.html page.
 * Modernized to remove deprecated execCommand fallback.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const outputEl = document.getElementById('generated-output');
    const copyBtn = document.getElementById('copy-output-btn');
    const regenerateBtn = document.getElementById('regenerate-btn');
    const typeButtons = document.querySelectorAll('.type-btn');
    const optionsPanels = document.querySelectorAll('.options-panel');

    // Password Elements
    const lengthSlider = document.getElementById('length');
    const lengthValue = document.getElementById('length-value');
    const includeUppercase = document.getElementById('include-uppercase');
    const includeLowercase = document.getElementById('include-lowercase');
    const includeNumbers = document.getElementById('include-numbers');
    const includeSymbols = document.getElementById('include-symbols');

    // Passphrase Elements
    const wordCountSlider = document.getElementById('word-count');
    const wordCountValue = document.getElementById('word-count-value');
    const separatorInput = document.getElementById('separator');
    const capitalizeCheckbox = document.getElementById('capitalize');

    // --- State ---
    let currentGenerator = 'password';

    // --- Word lists for Passphrase & Username ---
    const adjectives = ['Ancient', 'Bright', 'Clever', 'Daring', 'Eager', 'Flying', 'Golden', 'Happy', 'Iron', 'Jolly', 'Keen', 'Lucky', 'Magic', 'Noble', 'Open', 'Proud', 'Quick', 'Royal', 'Silent', 'True', 'Useful', 'Vivid', 'Wise', 'Young', 'Zesty'];
    const nouns = ['Castle', 'Dragon', 'Eagle', 'Forest', 'Griffin', 'Harbor', 'Island', 'Jungle', 'Key', 'Lion', 'Mountain', 'Nectar', 'Ocean', 'Phoenix', 'Quest', 'River', 'Shield', 'Tower', 'Unicorn', 'Viper', 'Willow', 'Yeti', 'Zephyr'];

    // --- Core Generation Logic ---

    /**
     * Generates a random, unbiased value using the Web Crypto API
     */
    function getRandom(max) {
        const range = 2**32;
        const maxValid = Math.floor(range / max) * max;
        let randomValue;
        
        do {
            const randomValues = new Uint32Array(1);
            window.crypto.getRandomValues(randomValues);
            randomValue = randomValues[0];
        } while (randomValue >= maxValid);

        return randomValue % max;
    }

    function generatePassword() {
        const length = parseInt(lengthSlider.value);
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const nums = '0123456789';
        const syms = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let charset = '';
        if (includeUppercase.checked) charset += upper;
        if (includeLowercase.checked) charset += lower;
        if (includeNumbers.checked) charset += nums;
        if (includeSymbols.checked) charset += syms;
        
        if (charset === '') {
            charset = lower;
            includeLowercase.checked = true;
        }

        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset[getRandom(charset.length)];
        }
        outputEl.value = password;
    }

    function generatePassphrase() {
        const wordCount = parseInt(wordCountSlider.value);
        const separator = separatorInput.value || '-';
        const capitalize = capitalizeCheckbox.checked;

        let passphrase = [];
        for (let i = 0; i < wordCount; i++) {
            const wordList = (i % 2 === 0) ? adjectives : nouns;
            let word = wordList[getRandom(wordList.length)];
            
            if (capitalize) {
                word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            } else {
                 word = word.toLowerCase();
            }
            passphrase.push(word);
        }
        outputEl.value = passphrase.join(separator);
    }
    
    function generateUsername() {
        const adj = adjectives[getRandom(adjectives.length)];
        const noun = nouns[getRandom(nouns.length)];
        const num = getRandom(100);
        outputEl.value = `${adj}${noun}${num}`;
    }

    // --- Main Controller ---
    function generate() {
        switch (currentGenerator) {
            case 'password':
                generatePassword();
                break;
            case 'passphrase':
                generatePassphrase();
                break;
            case 'username':
                generateUsername();
                break;
        }
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        typeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const type = button.dataset.type;
                currentGenerator = type;

                typeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                optionsPanels.forEach(panel => {
                    panel.style.display = panel.id === `${type}-options` ? 'block' : 'none';
                });

                generate();
            });
        });

        document.querySelectorAll('.generator-options input').forEach(input => {
            input.addEventListener('input', generate);
        });

        lengthSlider.addEventListener('input', () => {
            lengthValue.textContent = lengthSlider.value;
            generate();
        });
        
        wordCountSlider.addEventListener('input', () => {
            wordCountValue.textContent = wordCountSlider.value;
            generate();
        });

        regenerateBtn.addEventListener('click', () => {
            generate();
            regenerateBtn.style.transform = 'rotate(180deg)';
            setTimeout(() => {
                regenerateBtn.style.transform = 'rotate(0deg)';
            }, 300);
        });

        // --- REFACTOR: Modern Clipboard API (Fallback Removed) ---
        copyBtn.addEventListener('click', () => {
            if (!outputEl.value) return;

            navigator.clipboard.writeText(outputEl.value).then(() => {
                const originalIcon = copyBtn.innerHTML;
                copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                setTimeout(() => {
                    copyBtn.innerHTML = originalIcon;
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                // The old fallback logic (execCommand) has been removed as requested.
                alert('Failed to copy to clipboard. Please copy manually.'); // Simple alert as last resort.
            });
        });
    }

    // --- Initialization ---
    setupEventListeners();
    generate();
});
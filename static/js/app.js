document.addEventListener('DOMContentLoaded', () => {
    /* FORM & API LOGIC */

    /* FORM & API LOGIC */
    const form = document.getElementById('agent-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');
    
    const resultsSection = document.getElementById('results');
    const outputText = document.getElementById('output-text');
    const errorCard = document.getElementById('error-message');
    const statusText = document.getElementById('status-text');

    // Tabs Navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.add('hidden'));

            btn.classList.add('active');
            
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.remove('hidden');
        });
    });

    // Input Mode Toggle
    const inputModeRadios = document.querySelectorAll('input[name="inputMode"]');
    const modeUrlSection = document.getElementById('mode-url-section');
    const modeTextSection = document.getElementById('mode-text-section');
    const urlInput = document.getElementById('url');
    const rawTextInput = document.getElementById('raw-text');

    inputModeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if(e.target.value === 'url') {
                modeUrlSection.classList.remove('hidden');
                modeTextSection.classList.add('hidden');
                urlInput.required = true;
                rawTextInput.required = false;
            } else {
                modeUrlSection.classList.add('hidden');
                modeTextSection.classList.remove('hidden');
                urlInput.required = false;
                rawTextInput.required = true;
            }
        });
    });

    // Fake status messages
    const statuses = [
        ">_ Analyzing target URL...",
        ">_ Bypassing external protocols...",
        ">_ Scraping raw DOM elements...",
        ">_ Engaging Llama 3.1 70B AI...",
        ">_ Parsing context windows...",
        ">_ Extracting core internship details...",
        ">_ Formatting output modules..."
    ];
    let statusInterval;

    function startStatusSimulation() {
        statusText.classList.remove('hidden');
        let i = 0;
        statusText.innerText = statuses[0];
        statusInterval = setInterval(() => {
            i++;
            if(i < statuses.length) {
                statusText.innerText = statuses[i];
            } else {
                statusText.innerText = ">_ Awaiting final response...";
            }
        }, 1200 + Math.random() * 800);
    }

    function stopStatusSimulation() {
        clearInterval(statusInterval);
        statusText.classList.add('hidden');
    }

    // Typewriter effect function
    async function typeWriter(element, text, speed = 8) {
        element.textContent = "";
        element.classList.add('typing-cursor');
        for (let i = 0; i < text.length; i++) {
            element.textContent += text.charAt(i);
            const randomDelay = speed + (Math.random() * 15);
            await new Promise(r => setTimeout(r, randomDelay));
        }
        element.classList.remove('typing-cursor');
    }

    // Copy to clipboard
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const content = document.getElementById(targetId).innerText;
            navigator.clipboard.writeText(content).then(() => {
                const originalText = btn.innerText;
                btn.innerText = 'Copied!';
                btn.style.color = 'var(--success)';
                setTimeout(() => { 
                    btn.innerText = originalText; 
                    btn.style.color = '';
                }, 2000);
            });
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset/init UI states
        errorCard.classList.add('hidden');
        resultsSection.classList.add('hidden');
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        submitBtn.disabled = true;
        
        startStatusSimulation();

        const inputMode = document.querySelector('input[name="inputMode"]:checked').value;
        let payload = {};

        if (inputMode === 'url') {
            payload = { url: document.getElementById('url').value };
        } else {
            payload = { 
                url: document.getElementById('optional-url').value || "No URL Provided",
                raw_text: document.getElementById('raw-text').value
            };
        }

        try {
            const isLocalhost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
            const PROD_BACKEND_URL = "https://intern-agent.onrender.com"; 
            const API_ENDPOINT = isLocalhost ? '/api/generate' : `${PROD_BACKEND_URL}/api/generate`;

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Connection Failed or Parsing Error');
            }

            // Success Confetti Effect
            const myConfetti = window.confetti.create(document.getElementById('confetti-canvas'), {
                resize: true,
                useWorker: true
            });
            myConfetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#8b5cf6', '#10b981']
            });

            // Parse response naive approach based on prompt text
            const rawContent = data.content;
            
            let posterContent = rawContent;
            let whatsappContent = "";

            if(rawContent.includes("TASK 2: WHATSAPP CAPTION")) {
                const parts = rawContent.split("TASK 2: WHATSAPP CAPTION");
                posterContent = parts[0].replace("TASK 1: POSTER CONTENT", "").trim();
                whatsappContent = parts[1].trim();
            } else {
                posterContent = rawContent;
            }

            // Clear previous QR code
            document.getElementById('qrcode').innerHTML = "";
            
            // Generate new QR code
            new QRCode(document.getElementById("qrcode"), {
                text: payload.url && payload.url !== "No URL Provided" ? payload.url : "https://example.com/no-url-provided",
                width: 128,
                height: 128,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });

            // Reveal cards and trigger typewriter
            resultsSection.classList.remove('hidden');
            posterText.textContent = '';
            whatsappText.textContent = '';
            
            setTimeout(() => {
                Promise.all([
                    typeWriter(posterText, posterContent, 5),
                    typeWriter(whatsappText, whatsappContent || "Information not provided by AI.", 5)
                ]);
            }, 300);

        } catch (error) {
            errorCard.textContent = `[System Failure] ${error.message}`;
            errorCard.classList.remove('hidden');
            
            // Error shake effect can be re-triggered by removing and adding class
            errorCard.classList.remove('fade-in');
            void errorCard.offsetWidth; // trigger reflow
            errorCard.classList.add('fade-in');

        } finally {
            stopStatusSimulation();
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
            submitBtn.disabled = false;
        }
    });
});

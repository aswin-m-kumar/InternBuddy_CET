document.addEventListener('DOMContentLoaded', () => {
    // Configuration constants
    const CONFIG = {
        PROD_BACKEND_URL: 'https://intern-agent.onrender.com',
        STATUS_UPDATE_INTERVAL: 1200,
        TYPEWRITER_SPEED: 5,
        TYPEWRITER_RANDOM_DELAY: 15,
        CONFETTI_PARTICLE_COUNT: 150,
        CONFETTI_SPREAD: 80,
        QR_CODE_SIZE: 128,
        COPY_FEEDBACK_DURATION: 2000
    };

    const form = document.getElementById('agent-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');

    const resultsSection = document.getElementById('results');
    const posterText = document.getElementById('poster-text');
    const whatsappText = document.getElementById('whatsapp-text');
    const errorCard = document.getElementById('error-message');
    const statusText = document.getElementById('status-text');
    const qrcodeContainer = document.getElementById('qrcode');

    // Track submission state to prevent rapid-fire requests
    let isSubmitting = false;

    // URL validation helper
    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

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
            if (i < statuses.length) {
                statusText.innerText = statuses[i];
            } else {
                statusText.innerText = ">_ Awaiting final response...";
            }
        }, CONFIG.STATUS_UPDATE_INTERVAL + Math.random() * 800);
    }

    function stopStatusSimulation() {
        clearInterval(statusInterval);
        statusText.classList.add('hidden');
    }

    // Typewriter effect function
    async function typeWriter(element, text, speed = CONFIG.TYPEWRITER_SPEED) {
        element.textContent = "";
        element.classList.add('typing-cursor');
        for (let i = 0; i < text.length; i++) {
            element.textContent += text.charAt(i);
            await new Promise(r => setTimeout(r, speed + Math.random() * CONFIG.TYPEWRITER_RANDOM_DELAY));
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
                }, CONFIG.COPY_FEEDBACK_DURATION);
            });
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Prevent rapid-fire submissions
        if (isSubmitting) return;
        isSubmitting = true;

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
            const urlValue = document.getElementById('url').value.trim();
            if (!isValidUrl(urlValue)) {
                throw new Error('Invalid URL format. Please enter a valid http/https URL.');
            }
            payload = { url: urlValue };
        } else {
            const rawTextValue = document.getElementById('raw-text').value.trim();
            if (!rawTextValue) {
                throw new Error('Raw text content is required.');
            }
            const optionalUrl = document.getElementById('optional-url').value.trim();
            payload = {
                url: isValidUrl(optionalUrl) ? optionalUrl : "No URL Provided",
                raw_text: rawTextValue
            };
        }

        try {
            const isLocalhost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
            const API_ENDPOINT = isLocalhost ? '/api/generate' : `${CONFIG.PROD_BACKEND_URL}/api/generate`;

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
                particleCount: CONFIG.CONFETTI_PARTICLE_COUNT,
                spread: CONFIG.CONFETTI_SPREAD,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#8b5cf6', '#10b981']
            });

            // Parse response and split into chunks resiliently
            const rawContent = data.content || "";
            let posterContent = rawContent;
            let whatsappContent = "";

            // Robust parsing using Regex to catch LLM hallucinated markdown headers + our strict SPLIT token
            const splitRegex = /===SPLIT===|TASK 2:\s*WHATSAPP CAPTION|\*\*Whatsapp Caption:?\*\*|\*\*WhatsApp Caption:?\*\*/i;
            if (splitRegex.test(rawContent)) {
                const parts = rawContent.split(splitRegex);
                const part1Regex = /TASK 1:\s*POSTER CONTENT|\*\*Poster Content:?\*\*/i;
                posterContent = parts[0].replace(part1Regex, "").trim();
                whatsappContent = parts[1].trim();
            } else {
                posterContent = rawContent;
            }

            // Clear previous QR code
            document.getElementById('qrcode').innerHTML = "";

            // Validate URL for QR code
            let qrUrl = payload.url;
            if (!qrUrl || qrUrl === "No URL Provided") {
                qrUrl = "https://example.com";
            }

            // Generate new QR code
            new QRCode(document.getElementById("qrcode"), {
                text: qrUrl,
                width: CONFIG.QR_CODE_SIZE,
                height: CONFIG.QR_CODE_SIZE,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });

            // Reveal cards and trigger typewriter
            resultsSection.classList.remove('hidden');
            posterText.textContent = '';
            whatsappText.textContent = '';

            setTimeout(() => {
                Promise.all([
                    typeWriter(posterText, posterContent),
                    typeWriter(whatsappText, whatsappContent || "Information not provided by AI.")
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
            isSubmitting = false;
        }
    });
});

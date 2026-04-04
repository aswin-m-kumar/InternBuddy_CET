# Intern Agent

**Intern Agent** is an automated, AI-powered communications engine that extracts details from any internship URL and synthesizes them into organized marketing material, including an Instagram Poster and WhatsApp community captions. 

It is designed with a decoupled architecture to maintain strict security across client and server logic.

### Key Features
- **Intelligent Parsing:** Bypasses complex website structures and extracts useful text data utilizing `BeautifulSoup`.
- **AI Synthesis:** Leverages generative AI models to condense raw text into snappy promotional copy.
- **Link QR Codes:** Automatically generates scannable QR codes matching the compiled URL using `qrcode.js`.
- **Secure Architecture:** Built to isolate sensitive backend API keys from client-side execution, utilizing a robust CORS-enabled architecture to host the interface via typical static sites.

## Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JS (qrcode.js, canvas-confetti)
- **Backend:** Python, Flask, Flask-CORS, BeautifulSoup4, Requests
- **LLM Provider:** Inference via the NVIDIA API endpoints (OpenAI SDK compatibility layer).

## Local Setup

Ensure you have your environment ready with Python installed.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aswin-m-kumar/Intern_Agent.git
   cd Intern_Agent
   ```

2. **Create and Activate a Virtual Environment:**
   ```bash
   python -m venv venv
   
   # Windows:
   venv\Scripts\activate
   # Unix:
   source venv/bin/activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Secrets:**
   Create a `.env` file at the root of the project directory. It should contain:
   ```env
   NVIDIA_API_KEY=your_api_key_here
   ```

5. **Run the Backend locally:**
   ```bash
   python app.py
   ```
   The application will be accessible at `http://127.0.0.1:5000/`. When running via localhost, the frontend will dynamically detect the environment and use the local endpoint.

## Deployment Roadmap
- **Client Side:** Can be freely hosted statically on [GitHub Pages](https://pages.github.com/).
- **Server Side:** Easily configured using `gunicorn app:app` upon hosting providers like [Render](https://render.com/).

# Gemini Chatbot Web Application

A fully functional, elegant, and modern AI chatbot web application powered by Google's latest Gemini API using a Python Flask backend and an HTML/CSS/JavaScript frontend.

## Features

- **Gemini 2.5 Flash Model:** Leverages Google's latest high-speed, cost-efficient, and intelligent model.
- **Glassmorphism Dark UI:** Ultra-modern, premium obsidian styling with vibrant violet/indigo glowing accents and smooth micro-animations.
- **Context-Aware Multi-Turn Conversations:** Chat interface remembers conversation context and history during a session.
- **Markdown & Code Syntax Highlighting:** Automatically formats headings, bullet points, blockquotes, tables, and lists, and provides syntax-highlighted code blocks (using Prism.js).
- **Prompt Starters:** One-click template chips to quickly start chatting with ready-made prompts.
- **Fully Responsive:** Perfectly optimized layout for both desktop monitors and mobile devices.
- **Server Health Check:** Built-in connection status indicator to show if the Flask backend is active.

---

## Directory Structure

```text
gemini-chatbot/
│
├── backend/
│   ├── app.py             # Flask API server
│   ├── requirements.txt   # Python dependency list
│   ├── .env               # Environment configurations (API key)
│   └── .env.example       # Template environment configurations
│
├── frontend/
│   ├── index.html         # Main user interface
│   ├── style.css          # Design styles
│   └── script.js          # Chat interactions & API calls
│
└── README.md              # Project documentation
```

---

## Setup Instructions

### Prerequisites
- [Python 3.9+](https://www.python.org/downloads/) installed.
- A modern web browser.
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/). *(Note: The `.env` file in this workspace has already been set up with your existing Gemini API Key).*

---

### Step 1: Set Up the Backend

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd gemini-chatbot/backend
   ```

2. Create a Python virtual environment:
   - **Windows:**
     ```bash
     python -m venv venv
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv venv
     ```

3. Activate the virtual environment:
   - **Windows (Command Prompt):**
     ```cmd
     venv\Scripts\activate.cmd
     ```
   - **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\activate.ps1
     ```
   - **macOS / Linux:**
     ```bash
     source venv/bin/activate
     ```

4. Install the backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Verify that your `backend/.env` file is set up and contains your key:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```

6. Run the Flask server:
   ```bash
   python app.py
   ```
   The backend server will launch and run locally at `http://127.0.0.1:5000`.

---

### Step 2: Set Up the Frontend

The frontend is built entirely using vanilla web technologies, so no installation or build steps are required.

1. Locate the `gemini-chatbot/frontend/` folder.
2. Open `index.html` in your web browser of choice:
   - **Double-click** the file in your system file explorer, or
   - **Drag and drop** `index.html` into your browser tab.
3. Once opened, look at the sidebar footer status:
   - It will display **Backend Status: Online** if the Flask server is running correctly.
   - You can now start typing in the chatbox or select a prompt starter to begin conversing!

---

## Troubleshooting

- **CORS Errors:** Ensure `flask-cors` is installed and initialized in `app.py` (which it is by default).
- **Backend Status is Offline:** Ensure your Python Flask app is running at `http://127.0.0.1:5000`. If you use custom ports, update the `BACKEND_URL` in `frontend/script.js` and the `PORT` in `backend/.env`.
- **Gemini API Error (502):** Double-check that your API key is correctly specified in the `backend/.env` file and has not expired or been deleted.

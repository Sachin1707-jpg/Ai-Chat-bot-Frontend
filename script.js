// API Configuration
const BACKEND_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:5000'
    : 'https://ai-chat-bot-backend-3652.onrender.com/'; 

// State Management
let conversationHistory = [];
let isGenerating = false;

// DOM Elements
const sidebar = document.getElementById('sidebar');
const menuToggleBtn = document.getElementById('menuToggleBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const chatHistoryContainer = document.getElementById('chatHistoryContainer');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const chatForm = document.getElementById('chatForm');
const sendBtn = document.getElementById('sendBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const clearChatBtn = document.getElementById('clearChatBtn');
const newChatBtn = document.getElementById('newChatBtn');
const backendStatus = document.getElementById('backendStatus');
const statusDot = document.querySelector('.status-dot');
const suggestionChips = document.querySelectorAll('.suggestion-chip');

// Create mobile overlay
const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
document.body.appendChild(overlay);

// Configure marked.js for safe markdown parsing
if (typeof marked !== 'undefined') {
    marked.setOptions({
        gfm: true,
        breaks: true,
        headerIds: false,
        mangle: false
    });
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    checkBackendHealth();
    setupEventListeners();
    userInput.focus();
});

// Event Listeners Set up
function setupEventListeners() {
    // Mobile Sidebar controls
    menuToggleBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);

    // Chat Actions
    chatForm.addEventListener('submit', handleFormSubmit);
    clearChatBtn.addEventListener('click', clearConversation);
    newChatBtn.addEventListener('click', clearConversation);

    // Input area enhancements (Shift+Enter for newline, Enter for submit)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.requestSubmit();
        }
    });

    // Automatically expand textarea height as text grows
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = (userInput.scrollHeight - 16) + 'px';
    });

    // Suggestion prompt chips selection
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const prompt = chip.getAttribute('data-prompt');
            userInput.value = prompt;
            userInput.dispatchEvent(new Event('input'));
            userInput.focus();
            
            // Auto submit prompt starter for premium feel
            setTimeout(() => {
                chatForm.requestSubmit();
            }, 100);
            
            // Close sidebar if on mobile
            if (sidebar.classList.contains('active')) {
                toggleSidebar();
            }
        });
    });
}

// Sidebar Drawer Control (Mobile)
function toggleSidebar() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Check Flask Backend Health Status
async function checkBackendHealth() {
    backendStatus.textContent = "Connecting...";
    statusDot.className = "status-dot loading";
    
    try {
        const response = await fetch(`${BACKEND_URL}/health`, { method: 'GET' });
        if (response.ok) {
            backendStatus.textContent = "Online";
            statusDot.className = "status-dot online";
        } else {
            backendStatus.textContent = "Error";
            statusDot.className = "status-dot";
        }
    } catch (error) {
        console.error("Backend health check failed:", error);
        backendStatus.textContent = "Offline";
        statusDot.className = "status-dot";
    }
}

// Reset Conversation History and Chat Area
function clearConversation() {
    conversationHistory = [];
    
    // Clear chat window except for the initial greeting message
    chatMessages.innerHTML = `
        <div class="message bot-message message-fade-in">
            <div class="message-avatar">
                <i class="fa-solid fa-robot"></i>
            </div>
            <div class="message-content-wrapper">
                <div class="message-content">
                    <p>Hello! I am your Gemini-powered AI Assistant. How can I help you today? You can ask me questions, request code help, or try one of the prompt starters in the sidebar.</p>
                </div>
                <span class="message-time">Just now</span>
            </div>
        </div>
    `;
    userInput.value = '';
    userInput.style.height = 'auto';
    userInput.focus();
}

// Handle Form Submission (Send Message)
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const messageText = userInput.value.trim();
    if (!messageText || isGenerating) return;
    
    // Reset textarea sizing
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Add user message to UI and history
    appendMessage('user', messageText);
    
    // Toggle Loading State
    setGeneratingState(true);
    
    try {
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: messageText,
                history: conversationHistory // send existing history before this turn
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.response) {
            // Append Gemini's response
            appendMessage('model', data.response);
            
            // Save this turn to conversation history
            conversationHistory.push({ role: 'user', text: messageText });
            conversationHistory.push({ role: 'model', text: data.response });
        } else {
            const errMsg = data.error || "Failed to generate a response. Please try again.";
            appendMessage('model', `**Error:** ${errMsg}`);
        }
    } catch (error) {
        console.error("Chat generation failed:", error);
        appendMessage('model', "**Connection Error:** Could not connect to the backend server. Please verify that your Flask backend is running and correct.");
    } finally {
        setGeneratingState(false);
    }
}

// Toggle Send button & typing loading state
function setGeneratingState(generating) {
    isGenerating = generating;
    sendBtn.disabled = generating;
    userInput.disabled = generating;
    
    if (generating) {
        loadingIndicator.style.display = 'block';
    } else {
        loadingIndicator.style.display = 'none';
    }
    
    scrollToBottom();
}

// Add message bubble to screen
function appendMessage(role, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message message-fade-in`;
    
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let contentHTML = '';
    if (role === 'model') {
        // Parse markdown text using marked
        if (typeof marked !== 'undefined') {
            contentHTML = marked.parse(text);
        } else {
            // fallback plain text formatting
            contentHTML = `<p>${escapeHTML(text)}</p>`;
        }
    } else {
        // User message: keep it plain text and escape to prevent XSS
        contentHTML = `<p>${escapeHTML(text).replace(/\n/g, '<br>')}</p>`;
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fa-solid ${role === 'user' ? 'fa-user' : 'fa-robot'}"></i>
        </div>
        <div class="message-content-wrapper">
            <div class="message-content">${contentHTML}</div>
            <span class="message-time">${timeString}</span>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    
    // Trigger syntax highlighting for code blocks inside bot response
    if (role === 'model' && typeof Prism !== 'undefined') {
        Prism.highlightAllUnder(messageDiv);
    }
    
    scrollToBottom();
}

// Scroll chat window to bottom
function scrollToBottom() {
    chatHistoryContainer.scrollTo({
        top: chatHistoryContainer.scrollHeight,
        behavior: 'smooth'
    });
}

// Escape HTML utility function to prevent XSS
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

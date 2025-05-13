// Replace 'YOUR_API_KEY' with your actual Google Gemini API key
const API_KEY = 'AIzaSyC9k3hFvDbc-d1-BneQf4axJkWjfxJMM_w';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Get DOM elements
const generateBtn = document.getElementById('generate-btn');
const promptInput = document.getElementById('prompt');
const genreSelect = document.getElementById('genre');
const toneSelect = document.getElementById('tone');
const wordCountSelect = document.getElementById('wordCount');
const storyContent = document.getElementById('story-content');
const loading = document.getElementById('loading');
const languageSelect = document.getElementById('language');

// Theme handling
function changeTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('preferred-theme', theme);
}

// Load saved theme
const savedTheme = localStorage.getItem('preferred-theme');
if (savedTheme) {
    changeTheme(savedTheme);
    document.getElementById('theme').value = savedTheme;
}

generateBtn.addEventListener('click', generateStory);

async function generateStory() {
    // Input validation
    if (!promptInput.value.trim()) {
        showError('Please enter a story prompt!');
        promptInput.focus();
        return;
    }

    // Show loading state
    loading.classList.remove('hidden');
    storyContent.innerHTML = '';
    generateBtn.disabled = true;

    const prompt = promptInput.value.trim();
    const genre = genreSelect.value;
    const tone = toneSelect.value;
    const wordCount = wordCountSelect.value;
    const language = languageSelect.value;

    const promptText = `Write a ${tone} ${genre} story about ${prompt} in ${language}. 
                       Keep the story approximately ${wordCount} words long.
                       Structure the story with a clear beginning, middle, and end.
                       Make it engaging and creative.`;

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: promptText
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to connect to the story generation service. Please try again.');
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const generatedStory = data.candidates[0].content.parts[0].text;
            
            // Format the story with paragraphs
            const formattedStory = generatedStory
                .split('\n')
                .filter(para => para.trim() !== '')
                .map(para => `<p>${para}</p>`)
                .join('');
            
            // Add story and word count
            const actualWordCount = generatedStory.split(/\s+/).length;
            storyContent.innerHTML = `
                ${formattedStory}
                <div class="word-count" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color); color: var(--text-color); font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i> Word count: ${actualWordCount}
                </div>
                <div class="speech-controls" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button id="read-btn" class="speech-btn" style="padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-play"></i> Read Aloud
                    </button>
                    <button id="stop-btn" class="speech-btn" style="padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-stop"></i> Stop
                    </button>
                </div>`;
            
            // Add event listeners for speech buttons
            document.getElementById('read-btn').addEventListener('click', readStoryAloud);
            document.getElementById('stop-btn').addEventListener('click', stopReading);

            // Scroll to story
            storyContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            throw new Error('Invalid response format from the API');
        }
    } catch (error) {
        showError(error.message);
    } finally {
        loading.classList.add('hidden');
        generateBtn.disabled = false;
    }
}

// Error handling
function showError(message) {
    storyContent.innerHTML = `
        <div class="error" style="color: #e74c3c; padding: 1rem; background: #fde2e2; border-radius: 8px; text-align: center;">
            <i class="fas fa-exclamation-circle"></i> ${message}
        </div>`;
}

// Text-to-speech functionality
function readStoryAloud() {
    const storyText = storyContent.textContent;
    if (!storyText || storyText.includes('Your story will appear here') || storyText.includes('error')) {
        showError('No story available to read');
        return;
    }
    
    const speech = new SpeechSynthesisUtterance();
    speech.text = storyText;
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 1;
    
    // Set language based on user selection
    const selectedLanguage = languageSelect.value;
    speech.lang = selectedLanguage;
    
    // Get available voices and wait if not loaded
    const voices = window.speechSynthesis.getVoices();
    
    if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = function() {
            const loadedVoices = window.speechSynthesis.getVoices();
            selectAndSpeak(loadedVoices, speech, selectedLanguage);
        };
        return;
    }
    
    selectAndSpeak(voices, speech, selectedLanguage);
}

function selectAndSpeak(voices, speech, language) {
    // Find best matching voice for the selected language
    const matchingVoices = voices.filter(voice => 
        voice.lang.startsWith(language) || 
        voice.lang.split('-')[0] === language.split('-')[0]
    );
    
    if (matchingVoices.length > 0) {
        // Prefer default voice if available, otherwise use first matching
        const defaultVoice = matchingVoices.find(v => v.default) || matchingVoices[0];
        speech.voice = defaultVoice;
    }
    
    window.speechSynthesis.speak(speech);
}

// Stop speech function
function stopReading() {
    window.speechSynthesis.cancel();
}

// Add input animations
const inputs = document.querySelectorAll('input, textarea, select');
inputs.forEach(input => {
    input.addEventListener('focus', () => {
        input.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', () => {
        input.parentElement.classList.remove('focused');
    });
});

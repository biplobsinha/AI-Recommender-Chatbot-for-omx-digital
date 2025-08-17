// State management
let conversationState = {
  stage: 'welcome',
  answers: {}
};

// DOM elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const suggestedQuestions = document.getElementById('suggested-questions');

// Initialize chat
window.addEventListener('DOMContentLoaded', () => {
  startOnboarding();
});

// Core functions
function startOnboarding() {
  addMessage("Welcome to OMX Digital! I'll help you find the right solution.", 'bot');
  setTimeout(() => askBusinessType(), 1500);
}

function askBusinessType() {
  fetch('/api/onboarding')
    .then(res => res.json())
    .then(data => {
      addMessage("What type of business do you run?", 'bot');
      showOptions(data.business_types, 'business_type');
    });
}

function askBusinessSize() {
  fetch('/api/onboarding')
    .then(res => res.json())
    .then(data => {
      addMessage("What's your business size?", 'bot');
      showOptions(data.business_sizes, 'business_size');
    });
}

function askGoals() {
  fetch('/api/onboarding')
    .then(res => res.json())
    .then(data => {
      addMessage("What are your main goals? (Select all that apply)", 'bot');
      showOptions(data.goals, 'goals', true);
    });
}

function showOptions(options, answerKey, multiSelect = false) {
  suggestedQuestions.innerHTML = '';

  options.forEach(option => {
    const btn = document.createElement('div');
    btn.className = 'suggestion';
    btn.textContent = option;
    btn.addEventListener('click', () => {
      if (multiSelect) {
        if (!conversationState.answers[answerKey]) {
          conversationState.answers[answerKey] = [];
        }
        // ✅ Prevent duplicates
        if (!conversationState.answers[answerKey].includes(option)) {
          conversationState.answers[answerKey].push(option);
        }
        btn.style.backgroundColor = '#C8E6C9';
      } else {
        conversationState.answers[answerKey] = option;
        handleNextStep(answerKey);
      }
    });
    suggestedQuestions.appendChild(btn);
  });

  if (multiSelect) {
    const doneBtn = document.createElement('div');
    doneBtn.className = 'suggestion';
    doneBtn.textContent = 'Done selecting';
    doneBtn.style.backgroundColor = '#2E7D32';
    doneBtn.style.color = 'white';
    doneBtn.addEventListener('click', () => {
      if (conversationState.answers[answerKey] && conversationState.answers[answerKey].length > 0) {
        handleNextStep(answerKey);
      } else {
        addMessage('⚠️ Please select at least one option before continuing.', 'bot');
      }
    });
    suggestedQuestions.appendChild(doneBtn);
  }
}

function handleNextStep(currentStep) {
  if (currentStep === 'business_type') {
    addMessage(`Business type: ${conversationState.answers.business_type}`, 'user');
    conversationState.stage = 'business_size';
    setTimeout(askBusinessSize, 800);
  } 
  else if (currentStep === 'business_size') {
    addMessage(`Business size: ${conversationState.answers.business_size}`, 'user');
    conversationState.stage = 'goals';
    setTimeout(askGoals, 800);
  }
  else if (currentStep === 'goals') {
    addMessage(`Goals: ${conversationState.answers.goals.join(', ')}`, 'user');
    conversationState.stage = 'recommendation';
    getRecommendation();
  }
}

function getRecommendation() {
  const typing = showTypingIndicator();

  fetch('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(conversationState.answers)
  })
  .then(res => res.json())
  .then(data => {
    typing.remove();

    addMessage(`Based on your needs, I recommend: ${data.recommendation}`, 'bot');
    addMessage(data.product.description, 'bot');

    // Show product features
    const features = data.product.key_features.map(f => `✓ ${f}`).join('\n');
    addMessage(`Key features:\n${features}`, 'bot');

    addMessage(`Pricing: ${data.product.pricing}`, 'bot');

    // Show demo link
    addMessage(`👉 <a href="${data.product.demo_link}" target="_blank">Click here to explore a demo</a>`, 'bot');

    conversationState.stage = 'faq'; // ✅ enter FAQ mode after recommendation
    showFAQSuggestions();
  });
}

function showFAQSuggestions() {
  fetch('/api/faq')
    .then(res => res.json())
    .then(faqs => {
      suggestedQuestions.innerHTML = '';

      // Show 3 random FAQs as suggestions
      const randomFaqs = [...faqs].sort(() => 0.5 - Math.random()).slice(0, 3);

      randomFaqs.forEach(faq => {
        const btn = document.createElement('div');
        btn.className = 'suggestion';
        btn.textContent = faq.question;
        btn.addEventListener('click', () => handleFAQ(faq.question));
        suggestedQuestions.appendChild(btn);
      });
    });
}

function handleFAQ(question) {
  addMessage(question, 'user');
  const typing = showTypingIndicator();

  fetch('/api/faq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  })
  .then(res => res.json())
  .then(response => {
    typing.remove();

    if (response.contact) {
      // Fallback or direct contact scenario
      addMessage(response.answer, 'bot');

      const contactCard = document.createElement('div');
      contactCard.className = 'contact-card';
      contactCard.innerHTML = `
        <p>For further assistance, please reach out to our team:</p>
        <button class="contact-btn" onclick="window.open('mailto:${response.contact.email}')">
          Email Support
        </button>
        <button class="contact-btn" onclick="window.open('tel:${response.contact.phone}')">
          Call Sales
        </button>
      `;
      chatMessages.appendChild(contactCard);
    } else {
      addMessage(response.answer, 'bot');
    }

    showFAQSuggestions();
  });
}

// Helper functions
function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;
  messageDiv.innerHTML = text; // allow HTML (for demo link)
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'typing-indicator';
  typingDiv.innerHTML = `
    <div class="typing-dot" style="animation-delay: 0s"></div>
    <div class="typing-dot" style="animation-delay: 0.2s"></div>
    <div class="typing-dot" style="animation-delay: 0.4s"></div>
  `;
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return typingDiv;
}

// Event listeners
sendBtn.addEventListener('click', () => {
  const message = userInput.value.trim();
  if (message) {
    if (conversationState.stage === 'faq') {
      handleFAQ(message);
    } else {
      addMessage(message, 'user');
    }
    userInput.value = '';
  }
});

userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendBtn.click();
  }
});

<template>
  <div class="chat-tactico-container" :class="{ 'chat-open': isOpen }">
    <!-- Bubble Toggler -->
    <div class="chat-toggler" @click="toggleChat">
      <span class="chat-icon">💬</span>
      <span v-if="!isOpen" class="chat-badge">AI</span>
    </div>

    <!-- Chat Box -->
    <div class="chat-window" v-if="isOpen">
      <div class="chat-header">
        <div class="chat-title">COMUNICACIONES TÁCTICAS</div>
        <div class="chat-subtitle">Motor NLP Táctico SQL (Offline)</div>
        <button class="chat-close" @click="toggleChat">✖</button>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <div 
          v-for="(msg, idx) in messages" 
          :key="idx"
          class="chat-bubble"
          :class="msg.sender === 'user' ? 'bubble-user' : 'bubble-ai'"
        >
          <div class="bubble-sender">{{ msg.sender === 'user' ? 'COMANDANTE' : 'SISTEMA EXPERTO' }}</div>
          <p class="bubble-text" v-html="formatResponse(msg.text)"></p>
        </div>
        <div v-if="loading" class="chat-bubble bubble-ai">
          <div class="bubble-sender">SISTEMA EXPERTO</div>
          <div class="chat-typing">Generando SQL y consolidando registros<span>.</span><span>.</span><span>.</span></div>
        </div>
      </div>

      <div class="chat-input-area">
        <input 
          v-model="newMessage" 
          @keyup.enter="sendMessage" 
          placeholder="Ej: Cuántas alertas críticas hay..." 
          class="chat-input"
          :disabled="loading"
        />
        <button @click="sendMessage" class="chat-send" :disabled="loading || !newMessage.trim()">▶</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import api from '../services/api';

const isOpen = ref(false);
const newMessage = ref('');
const loading = ref(false);
const messagesContainer = ref(null);

const messages = ref([
  { sender: 'ai', text: 'Conexión segura establecida a la Base de Datos. ¿En qué puedo asistirle?' }
]);

const formatResponse = (text) => {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if(isOpen.value) {
    scrollToBottom();
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || loading.value) return;

  const msgText = newMessage.value.trim();
  messages.value.push({ sender: 'user', text: msgText });
  newMessage.value = '';
  loading.value = true;
  scrollToBottom();

  try {
    const res = await api.post('/chat', { mensaje: msgText });
    messages.value.push({ sender: 'ai', text: res.data.respuesta });
  } catch (err) {
    messages.value.push({ sender: 'ai', text: 'Error de comunicación táctica (Backend fallido).' });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};
</script>

<style scoped>
.chat-tactico-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 5000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.chat-toggler {
  width: 56px;
  height: 56px;
  background: var(--primary-neon);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(160, 216, 74, 0.4);
  position: relative;
  transition: transform 0.2s;
}

.chat-toggler:hover {
  transform: scale(1.05);
}

.chat-icon {
  font-size: 1.5rem;
}

.chat-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ff4757;
  color: white;
  font-size: 0.6rem;
  font-weight: 800;
  padding: 2px 5px;
  border-radius: 10px;
}

.chat-window {
  width: 380px;
  height: 520px;
  background: rgba(15, 17, 21, 0.95);
  border: 1px solid var(--primary-neon);
  border-radius: 12px;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0,0,0,0.8);
  backdrop-filter: blur(10px);
  animation: slideUpFade 0.3s ease;
  overflow: hidden;
}

.chat-header {
  background: rgba(160, 216, 74, 0.15);
  border-bottom: 1px solid rgba(160, 216, 74, 0.3);
  padding: 1rem;
  position: relative;
}

.chat-title {
  color: var(--primary-neon);
  font-weight: 800;
  font-size: 0.9rem;
}

.chat-subtitle {
  color: var(--text-muted);
  font-size: 0.65rem;
  font-family: monospace;
}

.chat-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: var(--text-main);
  font-size: 0.9rem;
  cursor: pointer;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-thumb { background: rgba(160, 216, 74, 0.3); }

.chat-bubble {
  max-width: 85%;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  line-height: 1.4;
}

.bubble-user {
  background: rgba(160, 216, 74, 0.1);
  border: 1px solid rgba(160, 216, 74, 0.3);
  color: var(--text-main);
  align-self: flex-end;
  border-bottom-right-radius: 0;
}

.bubble-ai {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  color: var(--text-main);
  align-self: flex-start;
  border-bottom-left-radius: 0;
}

.bubble-sender {
  font-size: 0.6rem;
  font-weight: 800;
  margin-bottom: 4px;
  opacity: 0.7;
}
.bubble-user .bubble-sender { color: var(--primary-neon); text-align: right; }
.bubble-ai .bubble-sender { color: #4a9eff; }

.chat-input-area {
  display: flex;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid var(--glass-border);
}

.chat-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-main);
  font-size: 0.9rem;
  padding: 0.5rem;
  outline: none;
}

.chat-send {
  background: var(--primary-neon);
  color: #000;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}

.chat-send:disabled {
  background: #555;
  cursor: not-allowed;
}

.chat-typing span {
  animation: typing 1.4s infinite cubic-bezier(0.2, 0.8, 1, 0.8);
}
.chat-typing span:nth-child(2) { animation-delay: 0.2s; }
.chat-typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0% { opacity: 0; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-2px); }
  100% { opacity: 0; transform: translateY(0); }
}

@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>

<template>
  <div class="chat-tactico-container" :class="{ 'chat-open': isOpen }">
    <!-- Bubble Toggler -->
    <div class="chat-toggler" @click="toggleChat">
      <span class="chat-icon">💬</span>
      <span v-if="!isOpen" class="chat-badge">AI</span>
    </div>

    <!-- Chat Box -->
    <div class="chat-window" v-if="isOpen">
      <!-- Header adaptativo -->
      <div class="chat-header">
        <button v-if="currentMode !== 'menu'" class="chat-back" @click="goBack" title="Volver al menú">⬅</button>
        <div class="chat-header-info" :class="{ 'with-back': currentMode !== 'menu' }">
          <div class="chat-title">COMUNICACIONES TÁCTICAS</div>
          <div class="chat-subtitle" v-if="currentMode === 'menu'">Seleccione un contexto de trabajo</div>
          <div class="chat-subtitle" v-else-if="currentMode === 'sistema'">📊 Base de Datos Operativa</div>
          <div class="chat-subtitle" v-else-if="currentMode === 'ley'">📖 Nueva Ley de Minas</div>
          <div class="chat-subtitle" v-else-if="currentMode === 'manual'">📘 Manual de Organización Policial</div>
          <div class="chat-subtitle" v-else-if="currentMode === 'reglamento'">📋 Reglamento General de la Ley de Minas</div>
          <div class="chat-subtitle" v-else-if="currentMode === 'coordenadas'">📡 Procedimiento GPS — Localización de Delitos</div>
        </div>
        <button class="chat-close" @click="toggleChat">✖</button>
      </div>

      <!-- VISTA: MENÚ PRINCIPAL -->
      <div class="chat-menu" v-if="currentMode === 'menu'">
        <p class="menu-prompt">¿Sobre qué desea consultar?</p>
        <button class="menu-btn menu-btn--sistema" @click="selectMode('sistema')">
          <span class="menu-btn-icon">📊</span>
          <div class="menu-btn-info">
            <span class="menu-btn-title">Sistema Operativo</span>
            <span class="menu-btn-desc">Alertas, incidentes y estadísticas en tiempo real</span>
          </div>
        </button>
        <button class="menu-btn menu-btn--ley" @click="selectMode('ley')">
          <span class="menu-btn-icon">📖</span>
          <div class="menu-btn-info">
            <span class="menu-btn-title">Nueva Ley de Minas</span>
            <span class="menu-btn-desc">Consultas legales sobre minería en Venezuela</span>
          </div>
        </button>
        <button class="menu-btn menu-btn--manual" @click="selectMode('manual')">
          <span class="menu-btn-icon">📘</span>
          <div class="menu-btn-info">
            <span class="menu-btn-title">Manual de Organización</span>
            <span class="menu-btn-desc">Procedimientos de Policía Administrativa y Resguardo Minero</span>
          </div>
        </button>
        <button class="menu-btn menu-btn--reglamento" @click="selectMode('reglamento')">
          <span class="menu-btn-icon">📋</span>
          <div class="menu-btn-info">
            <span class="menu-btn-title">Reglamento Ley de Minas</span>
            <span class="menu-btn-desc">Reglamento General — artículos, títulos y disposiciones</span>
          </div>
        </button>
        <button class="menu-btn menu-btn--coordenadas" @click="selectMode('coordenadas')">
          <span class="menu-btn-icon">📡</span>
          <div class="menu-btn-info">
            <span class="menu-btn-title">Coordenadas GPS</span>
            <span class="menu-btn-desc">Procedimiento de georreferenciación y localización del delito</span>
          </div>
        </button>
      </div>

      <!-- VISTA: CHAT DE CONTEXTO -->
      <template v-else>
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
            <div class="chat-typing">Consultando fuente táctica<span>.</span><span>.</span><span>.</span></div>
          </div>
        </div>

        <div class="chat-input-area">
          <input
            v-model="newMessage"
            @keyup.enter="sendMessage"
            :placeholder="getPlaceholder()"
            class="chat-input"
            :disabled="loading"
          />
          <button @click="sendMessage" class="chat-send" :disabled="loading || !newMessage.trim()">▶</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import api from '../services/api';

const isOpen = ref(false);
const newMessage = ref('');
const loading = ref(false);
const messagesContainer = ref(null);
const currentMode = ref('menu');
const messages = ref([]);

const modeWelcome = {
  sistema:     'Conexión a **Base de Datos Operativa** establecida. Puede consultar sobre alertas, incidentes críticos y estadísticas en tiempo real.',
  ley:         'Base de Conocimiento cargada: **Nueva Ley de Minas de Venezuela**. Responderé exclusivamente sobre esta legislación. ¿Qué artículo o tema desea consultar?',
  manual:      'Base de Conocimiento cargada: **Manual de Organización de Servicios de Policía Administrativa Especial y de Investigación Penal para el Resguardo Minero**. ¿En qué procedimiento puedo asistirle?',
  reglamento:  'Base de Conocimiento cargada: **Reglamento General de la Ley de Minas**. Puedo consultar artículos, títulos y disposiciones del Decreto N° 1.234 (Gaceta Oficial N° 37.155). ¿Qué artículo desea consultar?',
  coordenadas: 'Módulo activado: **Procedimiento de Georreferenciación y Coordenadas GPS para Localización de Delitos Mineros**. Puedo guiarle sobre toma de coordenadas, datum WGS-84, registro en acta policial y georeferenciación de los 6 tipos de eventos del Arco Minero. ¿Qué necesita consultar?',
};

const formatResponse = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^> (.*)/gm, '<blockquote>$1</blockquote>');
};

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value && currentMode.value !== 'menu') scrollToBottom();
};

const selectMode = (mode) => {
  currentMode.value = mode;
  messages.value = [{ sender: 'ai', text: modeWelcome[mode] }];
  nextTick(scrollToBottom);
};

const goBack = () => {
  currentMode.value = 'menu';
  messages.value = [];
};

const getPlaceholder = () => {
  const placeholders = {
    sistema:     'Ej: ¿Cuántas alertas críticas hay?',
    ley:         'Ej: ¿Qué dice la ley sobre deforestación?',
    manual:      'Ej: ¿Cuál es el procedimiento ante una incursión?',
    reglamento:  'Ej: ¿Qué dice el artículo 117 del reglamento?',
    coordenadas: 'Ej: ¿Cómo tomo coordenadas GPS de maquinaria retenida?',
  };
  return placeholders[currentMode.value] || 'Escriba su consulta...';
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
    const res = await api.post('/chat', { mensaje: msgText, contexto: currentMode.value });
    messages.value.push({ sender: 'ai', text: res.data.respuesta });
  } catch (err) {
    console.error('Error táctico:', err.response?.data || err.message);
    const detail = err.response?.data?.detalle || err.message;
    messages.value.push({
      sender: 'ai',
      text: `Error de comunicación táctica.<br><small>${detail}</small>`
    });
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
.chat-toggler:hover { transform: scale(1.05); }
.chat-icon { font-size: 1.5rem; }
.chat-badge {
  position: absolute; top: 0; right: 0;
  background: #ff4757; color: white;
  font-size: 0.6rem; font-weight: 800;
  padding: 2px 5px; border-radius: 10px;
}

/* VENTANA */
.chat-window {
  width: 390px;
  min-height: 420px;
  max-height: 560px;
  background: rgba(15, 17, 21, 0.97);
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

/* HEADER */
.chat-header {
  background: rgba(160, 216, 74, 0.12);
  border-bottom: 1px solid rgba(160, 216, 74, 0.3);
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}
.chat-header-info { flex: 1; }
.chat-header-info.with-back { margin-left: 0.25rem; }
.chat-title { color: var(--primary-neon); font-weight: 800; font-size: 0.85rem; }
.chat-subtitle { color: var(--text-muted); font-size: 0.65rem; font-family: monospace; margin-top: 2px; }

.chat-back {
  background: rgba(160, 216, 74, 0.15);
  border: 1px solid rgba(160, 216, 74, 0.4);
  color: var(--primary-neon);
  border-radius: 6px;
  width: 28px; height: 28px;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.chat-back:hover { background: rgba(160, 216, 74, 0.3); }
.chat-close {
  background: transparent; border: none;
  color: var(--text-muted); font-size: 0.9rem;
  cursor: pointer; margin-left: auto;
  flex-shrink: 0;
}
.chat-close:hover { color: var(--text-main); }

/* MENÚ PRINCIPAL */
.chat-menu {
  flex: 1;
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
.menu-prompt {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.menu-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}
.menu-btn:hover { transform: translateX(4px); }
.menu-btn--sistema:hover     { border-color: rgba(74, 158, 255, 0.6); background: rgba(74, 158, 255, 0.08); }
.menu-btn--ley:hover         { border-color: rgba(255, 196, 74, 0.6); background: rgba(255, 196, 74, 0.08); }
.menu-btn--manual:hover      { border-color: rgba(160, 216, 74, 0.6); background: rgba(160, 216, 74, 0.08); }
.menu-btn--reglamento:hover  { border-color: rgba(200, 100, 255, 0.6); background: rgba(200, 100, 255, 0.08); }
.menu-btn--coordenadas:hover { border-color: rgba(0, 220, 200, 0.6); background: rgba(0, 220, 200, 0.08); }

.menu-btn-icon { font-size: 1.4rem; flex-shrink: 0; }
.menu-btn-info { display: flex; flex-direction: column; gap: 2px; }
.menu-btn-title { color: var(--text-main); font-weight: 700; font-size: 0.82rem; }
.menu-btn-desc  { color: var(--text-muted); font-size: 0.68rem; line-height: 1.3; }

/* CHAT */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-thumb { background: rgba(160, 216, 74, 0.3); }

.chat-bubble {
  max-width: 88%;
  padding: 0.65rem 0.8rem;
  border-radius: 8px;
  font-size: 0.83rem;
  line-height: 1.45;
}
.bubble-user {
  background: rgba(160, 216, 74, 0.1);
  border: 1px solid rgba(160, 216, 74, 0.3);
  color: var(--text-main);
  align-self: flex-end;
  border-bottom-right-radius: 0;
}
.bubble-ai {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  color: var(--text-main);
  align-self: flex-start;
  border-bottom-left-radius: 0;
}
.bubble-sender {
  font-size: 0.58rem; font-weight: 800;
  margin-bottom: 4px; opacity: 0.65;
}
.bubble-user .bubble-sender { color: var(--primary-neon); text-align: right; }
.bubble-ai  .bubble-sender  { color: #4a9eff; }
.bubble-text { margin: 0; }
.bubble-text blockquote {
  border-left: 3px solid rgba(160, 216, 74, 0.5);
  padding-left: 0.5rem;
  margin: 0.4rem 0;
  font-style: italic;
  color: rgba(255,255,255,0.7);
  font-size: 0.78rem;
}

.chat-input-area {
  display: flex;
  padding: 0.65rem 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid var(--glass-border);
  gap: 0.5rem;
}
.chat-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-main);
  font-size: 0.88rem;
  padding: 0.4rem;
  outline: none;
}
.chat-send {
  background: var(--primary-neon); color: #000;
  border: none; width: 36px; height: 36px;
  border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: 0.2s; flex-shrink: 0;
}
.chat-send:disabled { background: #555; cursor: not-allowed; }

.chat-typing span { animation: typing 1.4s infinite cubic-bezier(0.2, 0.8, 1, 0.8); }
.chat-typing span:nth-child(2) { animation-delay: 0.2s; }
.chat-typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%   { opacity: 0; transform: translateY(0); }
  50%  { opacity: 1; transform: translateY(-2px); }
  100% { opacity: 0; transform: translateY(0); }
}
@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
</style>

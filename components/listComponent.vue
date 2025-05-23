<template>
  <div v-if="isVisible">
    <transition name="fade-slide">
      <div v-if="isExpanded" class="icon-container">
        <div class="icon-wrapper" @click="toggleExpand">
          <div class="icon-circle">
            <Icon name="mdi-arrow-left" />
          </div>
          <span class="icon-label">Contraer</span>
        </div>
        <div v-for="(icon, index) in icons" :key="index" class="icon-wrapper"
          :class="{
            'active': activeIcons.includes(index),
            'pause-active': icon === 'mdi-play-circle' && isPaused,
            'pause-disabled': icon === 'mdi-pause-circle' && (!isRecording || isPaused),
            'record-disabled': icon === 'mdi-record-circle' && isRecording,
            'save-disabled': icon === 'mdi-content-save' && !videoUrl,
            'stop-disabled': icon === 'mdi-stop-circle' && !isRecording
          }"
          :style="{ pointerEvents: (icon === 'mdi-stop-circle' && !isRecording) ? 'none' : 'auto' }"
          @click="toggleIcon(index, icon)">
          <div class="icon-circle">
            <Icon :name="getIconName(index, icon)" />
          </div>
          <span class="icon-label">{{ iconLabels[icon] || 'Acción' }}</span>
        </div>
        <div class="icon-wrapper" @click="hideComponent">
          <div class="icon-circle">
            <Icon name="mdi-close-circle" class="close-list-icon" />
          </div>
          <span class="icon-label">Cerrar</span>
        </div>
        <!-- Selector de dispositivos de audio -->
        <div v-if="showDeviceSelector" class="device-selector">
          <label>Seleccionar micrófono:</label>
          <select v-model="selectedAudioDevice" @change="updateAudioDevice">
            <option value="">Micrófono predeterminado</option>
            <option v-for="device in audioDevices" :key="device.deviceId" :value="device.deviceId">
              {{ device.label || `Micrófono ${device.deviceId.slice(0, 8)}` }}
            </option>
          </select>
          <button @click="loadAudioDevices">Actualizar dispositivos</button>
          <button @click="startRecordingWithSelectedDevice">Grabar</button>
          <button @click="showDeviceSelector = false">Cancelar</button>
        </div>
      </div>
      <div v-else class="collapse-button" @click="toggleExpand">
        <Icon name="mdi-arrow-right" />
      </div>
    </transition>
    <save-alertComponent
      v-if="showSaveAlert"
      @close="showSaveAlert = false"
      @stop-recording="stopRecording"
      @continue-recording="continueRecording"
      @delete-recording="deleteRecording"
      @save-recording="saveRecording"
      :is-continue-enabled="isRecording"
      :is-recording="isRecording"
      class="floating-alert"
    ></save-alertComponent>
    <save-type-alertComponent
      v-if="showSaveTypeAlert"
      @close="showSaveTypeAlert = false"
      @save-audio="saveAsAudio"
      @save-video="saveAsVideo"
      class="floating-alert"
    />
    <share-alertComponent
      v-if="showShareAlert"
      @close="showShareAlert = false"
      @share-gmail="shareViaGmail"
      @share-link="copyLink"
      class="floating-alert"
    />
    <div v-if="notificationMessage" class="notification">
      {{ notificationMessage }}
    </div>
  </div>
  <div v-if="isRecording" class="recording-indicator">
    <Icon name="mdi-record-circle" class="recording-icon" />
    <span>{{ recordingTime }}</span>
    <Icon
      :name="isMicrophoneActive ? 'mdi-microphone' : 'mdi-microphone-off'"
      class="microphone-icon"
    />
  </div>
  <div v-if="isCropping" class="crop-overlay" @mousedown="startCrop" @mousemove="updateCrop" @mouseup="endCrop">
    <div
      v-if="cropArea"
      class="crop-area"
      :style="{
        left: cropArea.startX + 'px',
        top: cropArea.startY + 'px',
        width: cropArea.width + 'px',
        height: cropArea.height + 'px'
      }">
    </div>
  </div>
</template>

<script>
import SaveAlertComponent from './save-alertComponent.vue';
import SaveTypeAlertComponent from './save-type-alertComponent.vue';
import ShareAlertComponent from './share-alertComponent.vue';

export default {
  name: "ListComponent",
  components: {
    SaveAlertComponent,
    SaveTypeAlertComponent,
    ShareAlertComponent,
  },
  emits: ['saveRecording', 'deleteRecording', 'navigateToNav'],
  data() {
    return {
      icons: [
        "mdi-stop-circle",
        "mdi-pause-circle",
        "mdi-microphone-off",
        "mdi-crop",
        "mdi-record-circle",
        "mdi-content-save",
        "mdi-share-variant",
      ],
      iconLabels: {
        'mdi-stop-circle': 'Detener',
        'mdi-pause-circle': 'Pausar',
        'mdi-play-circle': 'Reanudar',
        'mdi-microphone-off': 'Grabar sin audio',
        'mdi-crop': 'Recortar',
        'mdi-record-circle': 'Grabar con audio',
        'mdi-content-save': 'Guardar',
        'mdi-share-variant': 'Compartir',
        'mdi-arrow-left': 'Contraer',
        'mdi-close-circle': 'Cerrar',
      },
      mediaRecorder: null,
      recordedChunks: [],
      videoUrl: null,
      stream: null,
      audioStream: null,
      activeIcons: [],
      isExpanded: true,
      showSaveAlert: false,
      isVisible: true,
      isRecording: false,
      recordingTime: "00:00",
      isMicrophoneActive: false,
      isPaused: false,
      isCropping: false,
      cropArea: null,
      cropStart: null,
      notificationMessage: null,
      showSaveTypeAlert: false,
      showShareAlert: false,
      recordingSeconds: 0,
      recordingInterval: null,
      pendingStartRecording: false,
      audioDevices: [],
      selectedAudioDevice: '',
      showDeviceSelector: false,
    };
  },
  methods: {
    async loadAudioDevices() {
      try {
        console.log('Solicitando permisos de micrófono...');
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.audioDevices = devices.filter(device => device.kind === 'audioinput');
        console.log('Dispositivos de audio detectados:', this.audioDevices.map(d => ({
          deviceId: d.deviceId,
          label: d.label,
          kind: d.kind,
        })));
        if (this.audioDevices.length === 0) {
          this.notificationMessage = 'No se detectaron micrófonos. Conecta un dispositivo de audio.';
          setTimeout(() => (this.notificationMessage = null), 5000);
        }
        return this.audioDevices;
      } catch (err) {
        console.error('Error al enumerar dispositivos:', err);
        this.notificationMessage = 'No se pudieron listar los micrófonos: ' + err.message;
        setTimeout(() => (this.notificationMessage = null), 5000);
        throw err;
      }
    },
    updateAudioDevice() {
      console.log('Dispositivo de audio seleccionado:', this.selectedAudioDevice);
    },
    startRecordingWithSelectedDevice() {
      this.showDeviceSelector = false;
      this.startRecording(true);
    },
    async startRecording(withAudio = true) {
      try {
        console.log('Iniciando grabación, con audio:', withAudio);
        this.isMicrophoneActive = withAudio;
        this.recordedChunks = []; // Reiniciar chunks
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        this.stream = displayStream;
        console.log('Stream de pantalla:', displayStream.getTracks());
        console.log('Tracks de video:', displayStream.getVideoTracks().map(t => ({
          label: t.label,
          enabled: t.enabled,
          muted: t.muted,
        })));

        let combinedStream = displayStream;
        if (withAudio) {
          try {
            const audioConstraints = this.selectedAudioDevice
              ? { deviceId: { exact: this.selectedAudioDevice } }
              : true;
            console.log('Solicitando audio con constraints:', audioConstraints);
            this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
            const audioTracks = this.audioStream.getAudioTracks();
            console.log('Stream de audio:', audioTracks);
            console.log('Tracks de audio:', audioTracks.map(t => ({
              label: t.label,
              enabled: t.enabled,
              muted: t.muted,
            })));
            if (audioTracks.length === 0) {
              this.notificationMessage = 'No se detectaron tracks de audio. Grabando sin audio.';
              setTimeout(() => (this.notificationMessage = null), 5000);
              this.isMicrophoneActive = false;
            } else {
              audioTracks.forEach(track => {
                track.enabled = true;
              });
              combinedStream = new MediaStream([
                ...displayStream.getVideoTracks(),
                ...audioTracks,
              ]);
              console.log('Stream combinado:', combinedStream.getTracks());
            }
          } catch (audioErr) {
            console.error('Error al obtener audio:', audioErr);
            this.notificationMessage = 'No se pudo acceder al micrófono: ' + audioErr.message + '. Grabando sin audio.';
            setTimeout(() => (this.notificationMessage = null), 5000);
            this.isMicrophoneActive = false;
          }
        }

        this.mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType: 'video/webm;codecs=vp8,opus',
        });
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            this.recordedChunks.push(e.data);
            console.log('Datos recibidos:', e.data.size, 'bytes', 'Total chunks:', this.recordedChunks.length);
          }
        };

        this.mediaRecorder.onstop = () => {
          console.log('Grabación detenida. Chunks acumulados:', this.recordedChunks.length);
          const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
          this.videoUrl = URL.createObjectURL(blob);
          console.log('Video generado:', this.videoUrl);
        };

        this.mediaRecorder.start(100);
        console.log('MediaRecorder iniciado, estado:', this.mediaRecorder.state);
        this.startRecordingTimer();
        this.isRecording = true;
        this.activeIcons = [...this.activeIcons, this.icons.indexOf('mdi-record-circle')];
      } catch (err) {
        console.error('Error al iniciar la grabación:', err);
        this.notificationMessage = err.name === 'NotAllowedError'
          ? 'Permiso denegado para capturar pantalla o micrófono.'
          : 'Error al iniciar la grabación: ' + err.message;
        setTimeout(() => (this.notificationMessage = null), 5000);
        this.isRecording = false;
      }
    },
    saveRecording() {
      if (!this.videoUrl || typeof this.videoUrl !== 'string') {
        this.notificationMessage = 'No hay video para guardar.';
        setTimeout(() => (this.notificationMessage = null), 3000);
        return;
      }
      console.log('Guardando video, chunks:', this.recordedChunks.length);
      const a = document.createElement('a');
      a.href = this.videoUrl;
      a.download = `grabacion_${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      this.showSaveAlert = false;
      this.notificationMessage = 'Grabación guardada.';
      setTimeout(() => (this.notificationMessage = null), 3000);
    },
    pauseRecording() {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.pause();
        this.isPaused = true;
        clearInterval(this.recordingInterval);
        if (this.stream) {
          this.stream.getVideoTracks().forEach(track => track.enabled = false);
        }
        console.log('Grabación pausada, chunks acumulados:', this.recordedChunks.length);
      }
    },
    continueRecording() {
      if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
        this.mediaRecorder.resume();
        this.isPaused = false;
        this.resumeRecordingTimer();
        if (this.stream) {
          this.stream.getVideoTracks().forEach(track => track.enabled = true);
        }
        console.log('Grabación reanudada, estado:', this.mediaRecorder.state);
      }
    },
    toggleExpand() {
      console.log('Toggling expand, current state:', this.isExpanded);
      this.isExpanded = !this.isExpanded;
    },
    async toggleIcon(index, icon) {
      if (icon === 'mdi-share-variant') {
        this.showShareAlert = true;
      } else if (icon === 'mdi-record-circle') {
        if (this.isRecording) return;
        try {
          const devices = await this.loadAudioDevices();
          if (devices.length > 1) {
            this.showDeviceSelector = true;
          } else if (devices.length === 1) {
            this.selectedAudioDevice = devices[0].deviceId;
            this.startRecording(true);
          } else {
            this.notificationMessage = 'No se detectaron micrófonos. Conecta un dispositivo de audio.';
            setTimeout(() => (this.notificationMessage = null), 5000);
          }
        } catch (err) {
          // Error ya manejado en loadAudioDevices
        }
      } else if (icon === 'mdi-pause-circle') {
        if (!this.isRecording || this.isPaused) return;
        this.pauseRecording();
        this.icons[index] = 'mdi-play-circle';
      } else if (icon === 'mdi-play-circle') {
        if (!this.isRecording) return;
        this.continueRecording();
        this.icons[index] = 'mdi-pause-circle';
      } else if (icon === 'mdi-microphone-off' || icon === 'mdi-microfono') {
        if (this.isRecording) return;
        this.startRecording(false);
        this.activeIcons = this.activeIcons.includes(index)
          ? this.activeIcons.filter(i => i !== index)
          : [...this.activeIcons, index];
      } else if (icon === 'mdi-stop-circle') {
        if (!this.isRecording) return;
        this.showSaveAlert = true;
        this.stopRecording();
      } else if (icon === 'mdi-crop') {
        this.isCropping = !this.isCropping;
        if (!this.isCropping) {
          this.cropArea = null;
        }
      } else if (icon === 'mdi-content-save') {
        if (!this.videoUrl) return;
        this.showSaveTypeAlert = true;
      } else {
        this.activeIcons = this.activeIcons.includes(index)
          ? this.activeIcons.filter(i => i !== index)
          : [...this.activeIcons, index];
      }
    },
    startRecordingTimer() {
      this.recordingSeconds = 0;
      this.recordingInterval = setInterval(() => {
        this.recordingSeconds++;
        const minutes = String(Math.floor(this.recordingSeconds / 60)).padStart(2, '0');
        const seconds = String(this.recordingSeconds % 60).padStart(2, '0');
        this.recordingTime = `${minutes}:${seconds}`;
      }, 1000);
    },
    resumeRecordingTimer() {
      this.recordingInterval = setInterval(() => {
        this.recordingSeconds++;
        const minutes = String(Math.floor(this.recordingSeconds / 60)).padStart(2, '0');
        const seconds = String(this.recordingSeconds % 60).padStart(2, '0');
        this.recordingTime = `${minutes}:${seconds}`;
      }, 1000);
    },
    stopRecordingTimer() {
      clearInterval(this.recordingInterval);
      this.recordingTime = '00:00';
    },
    getIconName(index, icon) {
      if (icon === 'mdi-microphone-off' || icon === 'mdi-microfono') {
        return this.isMicrophoneActive ? 'mdi-microfono' : 'mdi-microfono-off';
      }
      return icon;
    },
    hideComponent() {
      this.isVisible = false;
      this.$emit('navigate-to-nav');
    },
    stopRecording() {
      this.isRecording = false;
      this.isPaused = false;
      this.isCropping = false;
      this.stopRecordingTimer();
      this.cropArea = null;
      this.cropStart = null;
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        console.log('Deteniendo MediaRecorder, estado actual:', this.mediaRecorder.state);
        this.mediaRecorder.stop();
      }
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop());
        this.audioStream = null;
      }
      this.activeIcons = this.activeIcons.filter(
        index => this.icons[index] !== 'mdi-record-circle'
      );
      if (this.pendingStartRecording) {
        this.pendingStartRecording = false;
        setTimeout(() => {
          this.isRecording = true;
          this.startRecording(this.isMicrophoneActive);
        }, 300);
      }
    },
    startCrop(event) {
      if (!this.isCropping) return;
      this.cropStart = { x: event.clientX, y: event.clientY };
      this.cropArea = { startX: event.clientX, startY: event.clientY, width: 0, height: 0 };
    },
    updateCrop(event) {
      if (!this.isCropping || !this.cropStart) return;
      const endX = event.clientX;
      const endY = event.clientY;
      this.cropArea = {
        startX: Math.min(this.cropStart.x, endX),
        startY: Math.min(this.cropStart.y, endY),
        width: Math.abs(this.cropStart.x - endX),
        height: Math.abs(this.cropStart.y - endY),
      };
    },
    endCrop() {
      if (!this.isCropping) return;
      console.log('Área seleccionada:', this.cropArea);
      this.cropStart = null;
    },
    handleSave() {
      this.showSaveAlert = false;
      this.notificationMessage = 'Grabación guardada.';
      setTimeout(() => (this.notificationMessage = null), 3000);
    },
    continueRecording() {
      this.showSaveAlert = false;
      if (this.isRecording) {
        this.resumeRecordingTimer();
      }
    },
    deleteRecording() {
      this.stopRecording();
      this.showSaveAlert = false;
      this.notificationMessage = 'Grabación eliminada con éxito.';
      setTimeout(() => (this.notificationMessage = null), 3000);
    },
    saveAsAudio() {
      this.showSaveTypeAlert = false;
      this.stopRecording();
      this.notificationMessage = 'Función de guardado como audio no implementada.';
      setTimeout(() => (this.notificationMessage = null), 3000);
    },
    saveAsVideo() {
      this.showSaveTypeAlert = false;
      this.saveRecording();
    },
    shareViaGmail() {
      if (!this.videoUrl) {
        this.notificationMessage = 'No hay video para compartir.';
        setTimeout(() => (this.notificationMessage = null), 3000);
        return;
      }
      const subject = encodeURIComponent('Grabación de pantalla');
      const body = encodeURIComponent(`Mira esta grabación: ${this.videoUrl}`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
      this.showShareAlert = false;
    },
    copyLink() {
      if (!this.videoUrl) {
        this.notificationMessage = 'No hay video para compartir.';
        setTimeout(() => (this.notificationMessage = null), 3000);
        return;
      }
      navigator.clipboard.writeText(this.videoUrl);
      this.notificationMessage = 'Enlace copiado al portapapeles.';
      setTimeout(() => (this.notificationMessage = null), 3000);
      this.showShareAlert = false;
    },
  },
};
</script>

<style scoped>
/* Fondo flotante semitransparente centrado y más ancho */
.icon-container {
  position: fixed;
  left: 50%;
  bottom: 40px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-end;
  gap: 28px;
  padding: 16px 60px 12px 60px;
  background: rgba(30, 30, 30, 0.96);
  border-radius: 40px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.22);
  min-width: 0;
  max-width: 1200px;
  width: 80vw;
  pointer-events: auto;
  z-index: 1100;
}

/* Cada icono y su texto */
.icon-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-width: 80px;
  max-width: 140px;
  height: 90px;
  cursor: pointer;
  text-align: center;
  overflow: visible;
  background: transparent;
  padding: 0 4px;
  position: relative;
}

/* Círculo del icono */
.icon-circle {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  box-shadow: 0 1.5px 4px rgba(0,0,0,0.12);
  transition: background 0.2s;
}

.icon-wrapper:hover .icon-circle {
  background: #e0e0e0;
}

.icon-wrapper.active .icon-circle,
.icon-wrapper.pause-active .icon-circle {
  background: #ff4d4d;
}

.icon-wrapper.active .icon-circle Icon,
.icon-wrapper.pause-active .icon-circle Icon {
  color: #fff;
}

.icon-wrapper.save-disabled,
.icon-wrapper.stop-disabled,
.icon-wrapper.pause-disabled,
.icon-wrapper.record-disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

.icon-wrapper.save-disabled .icon-circle,
.icon-wrapper.stop-disabled .icon-circle,
.icon-wrapper.pause-disabled .icon-circle,
.icon-wrapper.record-disabled .icon-circle {
  background: #e0e0e0;
}

.icon-wrapper.save-disabled .icon-label,
.icon-wrapper.stop-disabled .icon-label,
.icon-wrapper.pause-disabled .icon-wrapper.record-disabled .icon-label {
  color: #b0b0b0;
}

.icon-wrapper.save-disabled .icon-circle Icon,
.icon-wrapper.stop-disabled .icon-circle Icon,
.icon-wrapper.pause-disabled .icon-circle Icon,
.icon-wrapper.record-disabled .icon-circle Icon {
  color: #b0b0b0;
}

/* Texto debajo del icono */
.icon-label {
  font-size: 14px;
  color: #fff;
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
  line-height: 1.2;
  max-width: 120px;
  margin-top: 2px;
  word-break: break-word;
  text-align: center;
  font-weight: 400;
  letter-spacing: 0.01em;
}

.icon-wrapper.active .icon-label {
  color: #ff4d4d;
}

/* Botón de cerrar */
.close-list-icon {
  font-size: 28px;
  color: #dc3545;
}

.icon-wrapper:hover .close-list-icon {
  color: #c82333;
}

/* Botón flotante para contraer */
.collapse-button {
  position: fixed;
  bottom: 40px;
  right: 40px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(30, 30, 30, 0.96);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.22);
  cursor: pointer;
  z-index: 1200;
  transition: background 0.2s;
}

.collapse-button:hover {
  background: #ff4d4d;
}

.collapse-button Icon {
  font-size: 28px;
  color: #fff;
}

/* Selector de dispositivos de audio */
.device-selector {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  min-width: 340px;
  max-width: 95vw;
  background: #232323;
  color: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.32);
  padding: 32px 36px 24px 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1400;
  font-size: 16px;
}

.device-selector label {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 18px;
  color: #fff;
}

.device-selector select {
  width: 95%;
  padding: 12px 14px;
  margin-bottom: 18px;
  border-radius: 7px;
  border: 1.5px solid #aaa;
  font-size: 16px;
  background: #fff;
  color: #232323;
}

.device-selector button {
  margin: 10px 10px 0 10px;
  padding: 12px 28px;
  border: none;
  border-radius: 7px;
  font-size: 17px;
  cursor: pointer;
  background: #444;
  color: #fff;
  transition: background 0.2s, color 0.2s;
  font-weight: 500;
  min-width: 120px;
}

/* Botón "Actualizar dispositivos" */
.device-selector button:first-of-type {
  background: #444;
  color: #fff;
}
.device-selector button:first-of-type:hover {
  background: #666;
}

/* Botón "Grabar" en rojo */
.device-selector button:nth-of-type(2) {
  background: #ff4d4d;
  color: #fff;
  font-weight: bold;
}
.device-selector button:nth-of-type(2):hover {
  background: #c82333;
}

/* Botón "Cancelar" en blanco con borde y texto rojo */
.device-selector button:last-of-type {
  background: #fff;
  color: #dc3545;
  border: 1.5px solid #dc3545;
  font-weight: bold;
}
.device-selector button:last-of-type:hover {
  background: #ffeaea;
  color: #b52a37;
  border-color: #b52a37;
}

/* ALERTAS flotantes */
.floating-alert {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 340px;
  max-width: 95vw;
  background: #232323; /* Cambiado a fondo oscuro para evitar doble fondo */
  color: #fff;
  box-shadow: 0 8px 32px rgba(0,0,0,0.32);
  border-radius: 18px;
  z-index: 1500;
  padding: 32px 36px 24px 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.floating-alert p,
.floating-alert h3 {
  color: #fff;
  margin-bottom: 18px;
  text-align: center;
}

.floating-alert button {
  margin: 8px 8px 0 8px;
  padding: 10px 22px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  background: #444;
  color: #fff;
  transition: background 0.2s;
}

.floating-alert button:first-of-type {
  background: #28a745;
  color: #fff;
}
.floating-alert button:nth-of-type(2) {
  background: #ffc107;
  color: #222;
}
.floating-alert button:last-of-type {
  background: #fff;
  color: #dc3545;
  border: 1.5px solid #dc3545;
  font-weight: bold;
}
.floating-alert button:last-of-type:hover {
  background: #ffeaea;
  color: #b52a37;
  border-color: #b52a37;
}

/* Ajustes para dispositivos pequeños */
@media (max-width: 900px) {
  .icon-container {
    gap: 14px;
    padding: 10px 10vw 8px 10vw;
    max-width: 98vw;
    width: 98vw;
  }
  .icon-wrapper {
    min-width: 60px;
    max-width: 90px;
    height: 70px;
  }
  .icon-label {
    font-size: 11px;
    max-width: 80px;
  }
  .icon-circle {
    width: 38px;
    height: 38px;
  }
  .close-list-icon {
    font-size: 20px;
  }
  .collapse-button {
    width: 44px;
    height: 44px;
    bottom: 20px;
    right: 20px;
  }
}
</style>

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
      </div>
      <div v-else class="collapse-button" @click="toggleExpand">
        <Icon name="mdi-arrow-right" />
      </div>
    </transition>
    <!-- Mueve el selector de micrófono fuera de la barra y hazlo flotante -->
    <div
      v-if="showDeviceSelector"
      class="device-selector-floating"
    >
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
  <div v-if="isCropping" class="crop-overlay"
    @mousedown="startCrop"
  >
    <div
      v-if="cropArea"
      class="crop-area"
      :style="{
        left: cropArea.startX + 'px',
        top: cropArea.startY + 'px',
        width: cropArea.width + 'px',
        height: cropArea.height + 'px'
      }"
    ></div>
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
      cropConfirmed: false, // NUEVO: estado para saber si el usuario confirmó el área
      notificationMessage: null,
      showSaveTypeAlert: false,
      showShareAlert: false,
      recordingSeconds: 0,
      recordingInterval: null,
      pendingStartRecording: false,
      audioDevices: [],
      selectedAudioDevice: '',
      showDeviceSelector: false,
      isDraggingCrop: false, // NUEVO: para saber si se está arrastrando
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
        this.isMicrophoneActive = withAudio;
        this.recordedChunks = [];
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        this.stream = displayStream;
        let combinedStream = displayStream;
        // Si hay un área de recorte definida, crear un canvas y grabar solo esa zona
        if (this.cropArea && this.cropArea.width > 0 && this.cropArea.height > 0) {
          const videoTrack = displayStream.getVideoTracks()[0];
          const video = document.createElement('video');
          video.srcObject = new MediaStream([videoTrack]);
          await video.play();
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = this.cropArea.width;
          cropCanvas.height = this.cropArea.height;
          const cropCtx = cropCanvas.getContext('2d');
          let animationFrame;
          const draw = () => {
            cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
            cropCtx.drawImage(
              video,
              this.cropArea.startX, this.cropArea.startY, this.cropArea.width, this.cropArea.height,
              0, 0, this.cropArea.width, this.cropArea.height
            );
            animationFrame = requestAnimationFrame(draw);
          };
          draw();
          const cropStream = cropCanvas.captureStream(30);
          // Si hay audio, añadirlo
          if (withAudio) {
            try {
              const audioConstraints = this.selectedAudioDevice
                ? { deviceId: { exact: this.selectedAudioDevice } }
                : true;
              this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
              const audioTracks = this.audioStream.getAudioTracks();
              audioTracks.forEach(track => cropStream.addTrack(track));
              this.isMicrophoneActive = audioTracks.length > 0;
            } catch (audioErr) {
              this.notificationMessage = 'No se pudo acceder al micrófono: ' + audioErr.message + '. Grabando sin audio.';
              setTimeout(() => (this.notificationMessage = null), 5000);
              this.isMicrophoneActive = false;
            }
          }
          combinedStream = cropStream;
          // Limpiar recursos al detener
          this._cropCleanup = () => {
            cancelAnimationFrame(animationFrame);
            video.pause();
            video.srcObject = null;
          };
        } else if (withAudio) {
          try {
            const audioConstraints = this.selectedAudioDevice
              ? { deviceId: { exact: this.selectedAudioDevice } }
              : true;
            this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
            const audioTracks = this.audioStream.getAudioTracks();
            combinedStream = new MediaStream([
              ...displayStream.getVideoTracks(),
              ...audioTracks,
            ]);
            this.isMicrophoneActive = audioTracks.length > 0;
          } catch (audioErr) {
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
          }
        };
        this.mediaRecorder.onstop = () => {
          if (this._cropCleanup) {
            this._cropCleanup();
            this._cropCleanup = null;
          }
          // Detener el stream de pantalla al parar la grabación
          if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
          }
          const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
          this.videoUrl = URL.createObjectURL(blob);
        };
        this.mediaRecorder.start(100);
        this.startRecordingTimer();
        this.isRecording = true;
        this.activeIcons = [...this.activeIcons, this.icons.indexOf('mdi-record-circle')];
      } catch (err) {
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
      this.showSaveAlert = false;
      if (this.isRecording) {
        this.resumeRecordingTimer();
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
        if (this.isCropping && !this.cropConfirmed) {
          this.cancelCrop();
          return;
        }
        this.isCropping = true;
        this.cropConfirmed = false;
        document.body.style.cursor = 'crosshair';
        this.cropArea = null;
        this.cropStart = null;
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
    // --- RECORTE DE PANTALLA ---
    startCrop(event) {
      if (!this.isCropping) return;
      if (event.button !== 0) return;
      this.cropStart = { x: event.clientX, y: event.clientY };
      this.cropArea = { startX: event.clientX, startY: event.clientY, width: 0, height: 0 };
      this.cropConfirmed = false;
      this.isDraggingCrop = true;
      document.body.style.cursor = 'crosshair';
      window.addEventListener('mousemove', this.updateCrop, true);
      window.addEventListener('mouseup', this.endCrop, true);
    },
    updateCrop(event) {
      if (!this.isCropping || !this.cropStart || !this.isDraggingCrop) return;
      const endX = event.clientX;
      const endY = event.clientY;
      this.cropArea = {
        startX: Math.min(this.cropStart.x, endX),
        startY: Math.min(this.cropStart.y, endY),
        width: Math.abs(this.cropStart.x - endX),
        height: Math.abs(this.cropStart.y - endY),
      };
    },
    endCrop(event) {
      if (!this.isCropping || !this.isDraggingCrop) return;
      this.isDraggingCrop = false;
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', this.updateCrop, true);
      window.removeEventListener('mouseup', this.endCrop, true);
      // Si el área de recorte es muy pequeña, descartarla
      if (!this.cropArea || this.cropArea.width < 10 || this.cropArea.height < 10) {
        this.cropArea = null;
        this.isCropping = false;
        this.cropConfirmed = false;
        return;
      }
      this.cropConfirmed = false;
    },
    confirmCrop() {
      this.cropConfirmed = true;
      this.isCropping = false; // Oculta el overlay, pero el área queda lista para grabar
      document.body.style.cursor = ''; // Restaurar cursor
    },
    cancelCrop() {
      this.cropArea = null;
      this.cropConfirmed = false;
      this.isCropping = false;
      document.body.style.cursor = ''; // Restaurar cursor
    },
    getIconName(index, icon) {
      // Lógica para obtener el nombre del icono basado en el estado actual
      if (icon === 'mdi-play-circle' && this.isPaused) {
        return 'mdi-play-circle';
      }
      if (icon === 'mdi-pause-circle' && this.isPaused) {
        return 'mdi-pause-circle';
      }
      if (icon === 'mdi-microphone-off' && this.isMicrophoneActive) {
        return 'mdi-microfono';
      }
      return icon;
    },
    hideComponent() {
      this.isVisible = false;
      this.activeIcons = [];
      this.stopRecording();
      this.showSaveAlert = false;
      this.showSaveTypeAlert = false;
      this.showShareAlert = false;
      this.$emit('navigateToNav'); // Notifica al padre para mostrar el navcomponent
    },
    async shareViaGmail() {
      if (!this.videoUrl) return;
      const email = 'tu_correo@gmail.com';
      const subject = 'Grabación de pantalla';
      const body = `He grabado un video que quiero compartir contigo. Puedes verlo o descargarlo desde el siguiente enlace: ${this.videoUrl}`;
      window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    },
    copyLink() {
      if (!this.videoUrl) return;
      navigator.clipboard.writeText(this.videoUrl)
        .then(() => {
          this.notificationMessage = 'Enlace copiado al portapapeles.';
          setTimeout(() => (this.notificationMessage = null), 3000);
        })
        .catch(err => {
          console.error('Error al copiar el enlace:', err);
          this.notificationMessage = 'Error al copiar el enlace.';
          setTimeout(() => (this.notificationMessage = null), 3000);
        });
    },
    saveAsAudio() {
      if (!this.videoUrl) return;
      const a = document.createElement('a');
      a.href = this.videoUrl;
      a.download = `grabacion_${new Date().toISOString()}.opus`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      this.showSaveTypeAlert = false;
      this.notificationMessage = 'Grabación guardada como audio.';
      setTimeout(() => (this.notificationMessage = null), 3000);
    },
    saveAsVideo() {
      if (!this.videoUrl) return;
      const a = document.createElement('a');
      a.href = this.videoUrl;
      a.download = `grabacion_${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      this.showSaveTypeAlert = false;
      this.notificationMessage = 'Grabación guardada como video.';
      setTimeout(() => (this.notificationMessage = null), 3000);
    },
    stopRecording() {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
        this.isRecording = false;
        this.activeIcons = this.activeIcons.filter(i => i !== this.icons.indexOf('mdi-record-circle'));
        this.stopRecordingTimer();
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
        document.body.style.cursor = ''; // Restaurar cursor siempre al detener
        console.log('Grabación detenida, chunks finales:', this.recordedChunks.length);
      }
    },
    async deleteRecording() {
      this.showSaveAlert = false;
      this.videoUrl = null;
      this.recordedChunks = [];
      this.notificationMessage = 'Grabación eliminada.';
      setTimeout(() => (this.notificationMessage = null), 3000);
    },
  },
  mounted() {
    this.loadAudioDevices();
  },
};
</script>

<style scoped>
.icon-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  position: fixed;
  left: 50%;
  bottom: 30px;
  transform: translateX(-50%);
  padding: 10px 24px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 18px;
  backdrop-filter: blur(10px);
  z-index: 3000;
  box-shadow: 0 4px 24px rgba(0,0,0,0.25);
  min-width: 340px;
  max-width: 90vw;
  gap: 10px;
}

/* Botón de colapso flotante, redondo y a la derecha */
.collapse-button {
  position: fixed;
  right: 40px;
  bottom: 40px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  box-shadow: 0 4px 24px rgba(0,0,0,0.25);
  width: 56px;
  height: 56px;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: background 0.2s;
  padding: 0;
}

.collapse-button:hover {
  background: rgba(0,0,0,0.85);
}

.icon-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  margin: 0 8px;
  position: relative;
}

.icon-circle {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 4px;
  transition: background 0.3s, color 0.3s, box-shadow 0.3s;
  font-size: 22px;
}

/* Fondo blanco para iconos activos/usables */
.icon-wrapper:not(.active):not(.pause-active):not(.pause-disabled):not(.record-disabled):not(.save-disabled):not(.stop-disabled):hover .icon-circle,
.icon-wrapper:not(.active):not(.pause-active):not(.pause-disabled):not(.record-disabled):not(.save-disabled):not(.stop-disabled) .icon-circle {
  background: #fff;
  color: #222;
}

/* Fondo rojo para icono seleccionado */
.icon-wrapper.active .icon-circle,
.icon-wrapper.pause-active .icon-circle {
  background: #e53935;
  color: #fff;
  box-shadow: 0 0 0 2px #e53935;
}

/* Iconos deshabilitados (gris) */
.icon-wrapper.pause-disabled .icon-circle,
.icon-wrapper.record-disabled .icon-circle,
.icon-wrapper.save-disabled .icon-circle,
.icon-wrapper.stop-disabled .icon-circle {
  background: #bbb !important;
  color: #fff !important;
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-label {
  color: #fff;
  font-size: 16px;
  white-space: nowrap;
  text-align: center;
}

.close-list-icon {
  color: #ff4d4d;
}

.device-selector {
  /* Elimina estilos antiguos, solo para barra interna si se usa */
}

/* Nuevo: selector de micrófono flotante fuera de la barra */
.device-selector-floating {
  position: fixed;
  top: 100px;
  right: 40px;
  z-index: 4002;
  background: rgba(30, 30, 30, 0.97);
  color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.35);
  padding: 8px 10px 6px 10px; /* Más pequeño aún */
  min-width: 120px;
  max-width: 90vw;
  border: 1px solid rgba(255,255,255,0.10);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.device-selector-floating label {
  color: #fff;
  margin-bottom: 2px;
  font-size: 11px;
}

.device-selector-floating select {
  padding: 4px;
  border: none;
  border-radius: 4px;
  width: 100%;
  margin-bottom: 6px;
  font-size: 11px;
}

.device-selector-floating button {
  padding: 5px 0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 4px;
  font-size: 11px;
  transition: background 0.2s, color 0.2s;
  width: 100%;
}

/* Botón actualizar blanco */
.device-selector-floating button:nth-child(3) {
  background: #fff;
  color: #222;
  font-weight: 500;
}
.device-selector-floating button:nth-child(3):hover {
  background: #e0e0e0;
}

/* Botón grabar rojo */
.device-selector-floating button:nth-child(4) {
  background: #e53935;
  color: #fff;
  font-weight: 500;
}
.device-selector-floating button:nth-child(4):hover {
  background: #b71c1c;
}

/* Botón cancelar gris */
.device-selector-floating button:nth-child(5) {
  background: #444;
  color: #fff;
}
.device-selector-floating button:nth-child(5):hover {
  background: #666;
}

.floating-alert {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 4001; /* Más alto que el overlay */
  max-width: 300px;
  width: 100%;
  background: rgba(30, 30, 30, 0.95);
  color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.35);
  padding: 18px 18px 14px 18px;
  font-size: 15px;
  border: 1px solid rgba(255,255,255,0.08);
}

.notification {
  position: fixed;
  top: 80px;
  right: 20px;
  background: rgba(30, 30, 30, 0.95);
  color: #fff;
  padding: 12px 18px;
  border-radius: 8px;
  z-index: 4001; /* Más alto que el overlay */
  box-shadow: 0 4px 24px rgba(0,0,0,0.25);
  font-size: 15px;
  border: 1px solid rgba(255,255,255,0.08);
  transition: opacity 0.3s;
}

/* Indicador de grabación flotante, pequeño y arriba a la izquierda */
.recording-indicator {
  position: fixed;
  top: 18px;
  left: 18px;
  background: rgba(30, 30, 30, 0.95);
  color: #fff;
  padding: 5px 13px 5px 10px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  z-index: 4100;
  font-size: 13px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.18);
  gap: 7px;
  min-width: 0;
  min-height: 0;
}

.recording-icon {
  color: #e53935;
  font-size: 16px;
  margin-right: 4px;
}

.microphone-icon {
  margin-left: 6px;
  font-size: 15px;
  color: #fff;
  opacity: 0.8;
}

.crop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  cursor: crosshair;
  z-index: 2000; /* Cambiado de 4000 a 2000 para quedar detrás de los botones y notificaciones */
}

.crop-area {
  position: absolute;
  border: 2px dashed #fff;
  background: rgba(255, 255, 255, 0.2);
  pointer-events: none;
}
</style>

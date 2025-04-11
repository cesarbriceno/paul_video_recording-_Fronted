<template>
    <div v-if="isVisible">
        <transition name="fade-slide">
            <div class="overlay" v-if="isExpanded">
                <ul class="icon-list">
                    <li @click="toggleExpand">
                        <Icon name="mdi-arrow-left" />
                    </li>
                    <li 
                        v-for="(icon, index) in icons" 
                        :key="index" 
                        :class="{
                            'active': activeIcons.includes(index), 
                            'pause-active': icon === 'mdi-play-circle' && isPaused, 
                            'pause-disabled': icon === 'mdi-pause-circle' && (!isRecording || isPaused),
                            'record-disabled': icon === 'mdi-record-circle' && isRecording
                        }" 
                        :style="{ pointerEvents: (icon === 'mdi-record-circle' && isRecording) || (icon === 'mdi-pause-circle' && (!isRecording || isPaused)) ? 'none' : 'auto' }"
                        @click="toggleIcon(index, icon)">
                        <Icon :name="getIconName(index, icon)" />
                    </li>
                    <li @click="hideComponent">
                        <Icon name="mdi-close-circle" class="close-list-icon" />
                    </li>
                </ul>
            </div>
            <div v-else class="expand-button" @click="toggleExpand">
                <Icon name="mdi-arrow-expand" />
            </div>
        </transition>
        <save-alertComponent 
            v-if="showSaveAlert" 
            @close="showSaveAlert = false" 
            @button-click="showSaveAlert = false" 
            @stop-recording="stopRecording" 
            class="floating-alert" 
        />
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

export default {
    name: "ListComponent",
    components: {
        SaveAlertComponent,
    },
    data() {
        return {
            icons: [
                "mdi-stop-circle",
                "mdi-pause-circle",
                "mdi-microphone-off",
                "mdi-crop",
                "mdi-record-circle",
                "mdi-folder",
                "mdi-file",
                "mdi-share-variant",
            ],
            activeIcons: [], // Índices de los íconos activos
            isExpanded: true, // Estado para expandir o contraer la lista
            showSaveAlert: false, // Estado para mostrar el componente save-alertComponent
            isVisible: true, // Estado para mostrar/ocultar el componente por completo
            isRecording: false, // Estado para mostrar el contador de grabación
            recordingTime: "00:00", // Tiempo de grabación en formato mm:ss
            isMicrophoneActive: false, // Estado para mostrar el ícono de micrófono activo
            isPaused: false, // Estado para pausar/reanudar el contador
            isCropping: false, // Estado para activar/desactivar el modo de recorte
            cropArea: null, // Área seleccionada para recortar
            cropStart: null, // Coordenadas iniciales del recorte
        };
    },
    methods: {
        toggleExpand() {
            this.isExpanded = !this.isExpanded; // Alterna entre expandir y contraer
        },
        toggleIcon(index, icon) {
            if (icon === "mdi-record-circle") {
                if (this.isRecording) return; // No permitir clic si ya está grabando
                this.isRecording = !this.isRecording; // Alterna el estado de grabación
                if (this.isRecording) {
                    this.startRecordingTimer();
                } else {
                    this.stopRecordingTimer();
                }
            } else if (icon === "mdi-pause-circle" || icon === "mdi-play-circle") {
                if (!this.isRecording) return; // No permitir pausar si no está grabando
                this.isPaused = !this.isPaused; // Alterna entre pausa y reproducción
                if (this.isPaused) {
                    clearInterval(this.recordingInterval); // Pausa el contador
                } else {
                    this.resumeRecordingTimer(); // Reanuda el contador
                }
                // Cambiar el ícono entre pausa y reproducción
                this.icons[index] = this.isPaused ? "mdi-play-circle" : "mdi-pause-circle";
            } else if (icon === "mdi-microphone-off" || icon === "mdi-microphone") {
                // Alternar entre micrófono encendido y apagado
                if (this.activeIcons.includes(index)) {
                    this.activeIcons = this.activeIcons.filter((i) => i !== index);
                    this.isMicrophoneActive = false;
                } else {
                    this.activeIcons.push(index);
                    this.isMicrophoneActive = true;
                }
            } else if (icon === "mdi-stop-circle") {
                this.showSaveAlert = true; // Muestra el componente save-alertComponent
                this.stopRecording(); // Detener la grabación
            } else if (icon === "mdi-crop") {
                this.isCropping = !this.isCropping; // Alterna el modo de recorte
                if (!this.isCropping) {
                    this.cropArea = null; // Reinicia el área de recorte al salir del modo
                }
            } else {
                // Activar/desactivar otros íconos
                if (this.activeIcons.includes(index)) {
                    this.activeIcons = this.activeIcons.filter((i) => i !== index);
                } else {
                    this.activeIcons.push(index);
                }
            }
        },
        startRecordingTimer() {
            this.recordingSeconds = 0; // Inicializa el contador
            this.recordingInterval = setInterval(() => {
                this.recordingSeconds++;
                const minutes = String(Math.floor(this.recordingSeconds / 60)).padStart(2, "0");
                const seconds = String(this.recordingSeconds % 60).padStart(2, "0");
                this.recordingTime = `${minutes}:${seconds}`;
            }, 1000);
        },
        resumeRecordingTimer() {
            this.recordingInterval = setInterval(() => {
                this.recordingSeconds++;
                const minutes = String(Math.floor(this.recordingSeconds / 60)).padStart(2, "0");
                const seconds = String(this.recordingSeconds % 60).padStart(2, "0");
                this.recordingTime = `${minutes}:${seconds}`;
            }, 1000);
        },
        stopRecordingTimer() {
            clearInterval(this.recordingInterval);
            this.recordingTime = "00:00"; // Reinicia el contador
        },
        getIconName(index, icon) {
            // Cambiar entre micrófono encendido y apagado
            if (icon === "mdi-microphone-off" || icon === "mdi-microphone") {
                return this.activeIcons.includes(index) ? "mdi-microphone" : "mdi-microphone-off";
            }
            return icon;
        },
        hideComponent() {
            this.isVisible = false; // Oculta el componente por completo
            this.$emit('navigate-to-nav'); // Emite un evento para mostrar el NavComponent expandido
        },
        stopRecording() {
            this.isRecording = false; // Detener la grabación
            this.isPaused = false; // Asegurarse de que no esté pausado
            this.isCropping = false; // Desactivar el modo de recorte
            this.stopRecordingTimer(); // Detener el contador
            this.cropArea = null; // Reiniciar el área de recorte
            this.cropStart = null; // Reiniciar las coordenadas iniciales del recorte
            this.activeIcons = this.activeIcons.filter(
                (index) => this.icons[index] !== "mdi-record-circle"
            ); // Desactivar el ícono de grabación
        },
        startCrop(event) {
            if (!this.isCropping) return;
            this.cropStart = { x: event.clientX, y: event.clientY }; // Coordenadas iniciales
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
            console.log("Área seleccionada:", this.cropArea); // Log para depuración
            this.cropStart = null; // Reinicia las coordenadas iniciales
        },
    },
};
</script>

<style scoped>
/* Fondo flotante semitransparente */
.overlay {
    position: fixed;
    bottom: 20px; /* Separación del borde inferior */
    left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 1100;
    pointer-events: none; /* Evita que el fondo interfiera con los clics */
}

/* Lista de íconos */
.icon-list {
    display: flex;
    justify-content: space-around;
    align-items: center;
    list-style: none;
    padding: 15px 20px; /* Más espacio interno */
    margin: 0;
    background-color: rgba(0, 0, 0, 0.7); /* Fondo negro transparente */
    border-radius: 20px; /* Bordes más redondeados */
    box-shadow: 0 -4px 8px rgba(0, 0, 0, 0.2);
    width: 100%; /* Ocupa todo el ancho */
    max-width: 600px; /* Ancho máximo */
    pointer-events: auto; /* Permite interacción con la lista */
}

/* Estilo de cada ícono */
.icon-list li {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: background-color 0.3s ease, color 0.3s ease;
}

/* Efecto hover */
.icon-list li:hover {
    background-color: #e0e0e0;
}

/* Ícono activo (rojo) */
.icon-list li.active {
    background-color: #ff4d4d; /* Fondo rojo */
    color: white; /* Ícono blanco */
}

/* Ícono de pausa activo (rojo) */
.icon-list li.pause-active {
    background-color: #ff4d4d; /* Fondo rojo */
    color: white; /* Ícono blanco */
}

/* Ícono de pausa inactivo (gris) */
.icon-list li.pause-disabled {
    background-color: #e0e0e0; /* Fondo gris */
    color: #a0a0a0; /* Ícono gris */
    cursor: not-allowed; /* Cursor no permitido */
}

/* Ícono de grabar inactivo (rojo) */
.icon-list li.record-disabled {
    background-color: #ff4d4d; /* Fondo rojo */
    color: white; /* Ícono blanco */
    cursor: not-allowed; /* Cursor no permitido */
}

/* Estilo de los íconos */
.icon-list li Icon {
    font-size: 24px;
    color: #333;
    transition: color 0.3s ease;
}

/* Ícono activo (cambia a blanco) */
.icon-list li.active Icon {
    color: white;
}

/* Botón de expandir */
.expand-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    z-index: 1001;
}

.expand-button Icon {
    font-size: 24px;
    color: white;
}

/* Animaciones */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.3s ease;
}

.fade-slide-enter-from {
    opacity: 0;
    transform: translateY(20px);
}

.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Estilo flotante para save-alertComponent */
.floating-alert {
    position: fixed;
    top: 50%; /* Centrado verticalmente */
    left: 50%; /* Centrado horizontalmente */
    transform: translate(-50%, -50%); /* Ajusta el centro */
    width: 50%; /* Reduce el ancho al 50% */
    background-color: white; /* Fondo blanco */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Sombra flotante */
    border-radius: 10px; /* Bordes redondeados */
    z-index: 1100; /* Superpuesto sobre otros elementos */
    padding: 20px; /* Espaciado interno */
}

/* Ajusta el estilo del ícono para cerrar la lista */
.close-list-icon {
    font-size: 24px;
    color: #dc3545;
    cursor: pointer;
    transition: color 0.3s ease;
}

.icon-list li:hover .close-list-icon {
    color: #c82333;
}

/* Indicador de grabación */
.recording-indicator {
    position: fixed;
    top: 10px;
    left: 10px; /* Mover al lado izquierdo */
    display: flex;
    align-items: center;
    background-color: rgba(255, 0, 0, 0.8);
    color: white;
    padding: 5px 10px;
    border-radius: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    z-index: 1100;
}

.recording-icon {
    font-size: 20px;
    margin-right: 5px;
}

.microphone-icon {
    font-size: 20px;
    margin-left: 10px; /* Separación del contador */
    color: white; /* Siempre blanco */
}

/* Superposición para el modo de recorte */
.crop-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000; /* Asegura que esté detrás del listComponent */
cursor: url("data:image/svg+xml,%3Csvg width='23' height='23' viewBox='0 0 23 23' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0.2444 11.3203H22.8718M11.5581 0.006558V22.634' stroke='%23000000' stroke-width='2'/%3E%3C/svg%3E") 12.5 12.5, crosshair;
}

/* Área seleccionada para recortar */
.crop-area {
    position: absolute;
    border: 2px dashed #fff;
    background: rgba(255, 255, 255, 0.3);
    pointer-events: none;
}
</style>

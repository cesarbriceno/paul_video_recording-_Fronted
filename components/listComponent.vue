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
                        :class="{'active': activeIcons.includes(index)}" 
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
            class="floating-alert" 
        />
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
        };
    },
    methods: {
        toggleExpand() {
            this.isExpanded = !this.isExpanded; // Alterna entre expandir y contraer
        },
        toggleIcon(index, icon) {
            if (icon === "mdi-stop-circle") {
                this.showSaveAlert = true; // Muestra el componente save-alertComponent
            } else if (icon === "mdi-microphone-off" || icon === "mdi-microphone") {
                // Alternar entre micrófono encendido y apagado
                if (this.activeIcons.includes(index)) {
                    this.activeIcons = this.activeIcons.filter((i) => i !== index);
                } else {
                    this.activeIcons.push(index);
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
    z-index: 1000;
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
</style>

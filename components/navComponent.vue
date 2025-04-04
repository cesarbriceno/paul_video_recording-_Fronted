<template>
    <!-- Contenedor principal del sidebar -->
    <div v-if="!isRecording" :class="['sidebar', { collapsed: isCollapsed }]">
        <!-- Encabezado del sidebar, visible solo si no está colapsado -->
        <div class="header" v-if="!isCollapsed">
            Video Recording
        </div>
        <!-- Barra de búsqueda, visible solo si no está colapsado -->
        <div class="search-bar" v-if="!isCollapsed">
            <input type="text" placeholder="Buscar..." />
        </div>
        <!-- Botón de grabar o expandir el menú -->
        <button 
            class="record-button" 
            @click="handleRecordButtonClick"
        >
            <!-- Cambia el ícono según el estado del sidebar -->
            <Icon 
                :name="isCollapsed ? 'mdi-menu' : 'mdi-record-circle'" 
                class="record-icon" 
            />
            <!-- Texto "Grabar" visible solo si el sidebar no está colapsado -->
            <span v-if="!isCollapsed">Grabar</span>
        </button>
        <!-- Botón para detener la grabación, visible solo si está grabando -->
        <button v-if="isRecording" class="stop-button" @click="stopRecording">
            <Icon name="mdi-stop-circle" />
            <span v-if="!isCollapsed">Detener</span>
        </button>
        <!-- Componente de alerta para guardar, visible según el estado -->
        <save-alert-component 
            v-if="showSaveAlert" 
            @save-recording="saveRecording" 
            @delete-recording="deleteRecording" 
        />
        <!-- Ícono para colapsar/expandir el sidebar, visible solo si no está colapsado -->
        <div class="toggle-icon" v-if="!isCollapsed" @click="toggleSidebar">
            <Icon name="mdi-menu" />
        </div>
    </div>
    <!-- Componente de lista, visible solo si está grabando -->
    <list-component 
        v-if="isRecording" 
        @save-recording="saveRecording" 
        @delete-recording="deleteRecording" 
        @navigate-to-nav="handleNavigateToNav" 
    />
</template>

<script>
import SaveAlertComponent from './save-alertComponent.vue';
import ListComponent from './listComponent.vue';

export default {
    name: "Sidebar",
    components: {
        SaveAlertComponent, // Componente para mostrar alertas de guardar
        ListComponent, // Componente de lista que se muestra al grabar
    },
    data() {
        return {
            isCollapsed: false, // Estado para determinar si el sidebar está colapsado
            isRecording: false, // Estado para determinar si se está grabando
            showSaveAlert: false, // Estado para mostrar el componente de alerta de guardar
        };
    },
    methods: {
        // Alterna entre colapsar y expandir el sidebar
        toggleSidebar() {
            this.isCollapsed = !this.isCollapsed;
        },
        // Maneja el clic en el botón de grabar o expandir
        handleRecordButtonClick() {
            if (this.isCollapsed) {
                this.toggleSidebar(); // Expande el sidebar si está colapsado
            } else {
                this.isRecording = true; // Activa el estado de grabación y muestra el listComponent
            }
        },
        // Detiene la grabación y muestra la alerta de guardar
        stopRecording() {
            this.showSaveAlert = true;
        },
        // Guarda la grabación y restablece los estados
        saveRecording() {
            this.isCollapsed = false; // Asegura que el sidebar esté expandido
            this.isRecording = false; // Desactiva el estado de grabación
            this.showSaveAlert = false; // Oculta la alerta de guardar
        },
        // Cancela la grabación y oculta la alerta de guardar
        deleteRecording() {
            this.isRecording = false; // Desactiva el estado de grabación
            this.showSaveAlert = false; // Oculta la alerta de guardar
        },
        // Navega de vuelta al sidebar expandido desde el listComponent
        handleNavigateToNav() {
            this.isRecording = false; // Desactiva el estado de grabación
            this.isCollapsed = false; // Asegura que el sidebar esté expandido
        },
    },
};
</script>

<style scoped>
/* Estilo del contenedor principal del sidebar */
.sidebar {
    width: 250px;
    height: 100vh;
    background-color: #f4f4f4;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
    border: 1px solid #ddd;
    transition: all 0.3s ease;
    padding: 20px;
    position: relative;
}

/* Estilo del sidebar cuando está colapsado */
.sidebar.collapsed {
    width: 80px;
    background-color: transparent;
    box-shadow: none;
    border: none;
    padding: 10px;
}

/* Estilo del encabezado */
.header {
    font-size: 18px;
    font-weight: bold;
    text-align: center;
    color: #333;
    margin-bottom: 20px;
}

/* Estilo de la barra de búsqueda */
.search-bar {
    width: 90%;
    margin-bottom: 20px;
    padding: 0 10px;
}

.search-bar input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 5px;
    outline: none;
}

/* Estilo del botón de grabar */
.record-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    background-color: #000000;
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
}

/* Estilo del botón de grabar cuando el sidebar no está colapsado */
.sidebar:not(.collapsed) .record-button {
    width: auto;
    height: auto;
    background-color: #ff4d4d;
    border-radius: 5px;
    padding: 10px;
}

/* Estilo del ícono de grabar */
.record-icon {
    color: rgb(252, 235, 235);
    font-size: 24px;
}

/* Estilo del ícono de grabar cuando el sidebar está colapsado */
.sidebar.collapsed .record-icon {
    color: rgb(230, 216, 216);
}

/* Estilo del ícono para colapsar/expandir */
.toggle-icon {
    cursor: pointer;
    font-size: 20px;
    color: #000000;
    position: absolute;
    bottom: 20px;
}

/* Oculta el ícono de colapsar cuando el sidebar está colapsado */
.sidebar.collapsed .toggle-icon {
    display: none;
}
</style>


```vue
<!-- pages/index.vue -->
<template>
  <div>
    <navComponent />
    <div class="content">
      <h1>Lista de Grabaciones</h1>
      <div v-if="error">Error: {{ error.message }}</div>
      <ul v-else-if="isValidArray(grabaciones)" class="grabaciones-list">
        <li v-for="grabacion in grabaciones" :key="grabacion.id" class="grabacion-item">
          <div class="grabacion-info">
            <strong>Tipo:</strong> {{ grabacion.tipo || 'Sin tipo' }}<br />
            <strong>Formato:</strong> {{ grabacion.formato || 'Sin formato' }}<br />
            <strong>Duración:</strong> {{ formatDuration(grabacion.duracion) }}<br />
            <strong>Fecha:</strong> {{ formatDate(grabacion.fecha) }}<br />
            <strong>Palabras Claves:</strong> {{ grabacion.palabrasClaves?.join(', ') || 'Ninguna' }}<br />
            <strong>Estado:</strong> {{ grabacion.estado || 'Sin estado' }}<br />
            <strong>Pantalla ID:</strong> {{ grabacion.pantallaId || 'Sin ID' }}
          </div>
        </li>
      </ul>
      <div v-else-if="grabaciones && !isValidArray(grabaciones)">Datos inválidos recibidos del servidor</div>
      <div v-else>Cargando...</div>
      <!-- Mostrar datos crudos para depuración -->
      <pre>{{ JSON.stringify(grabaciones, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { useRuntimeConfig } from '#app';

const config = useRuntimeConfig();
const apiUrl = config.public.apiUrl.replace(/\/+$/, '');
const { data: grabaciones, error } = await useFetch(`${apiUrl}/grabaciones`, {
  transform: (data) => {
    if (Array.isArray(data)) {
      return data;
    }
    console.error('Datos no son un array:', data);
    return null;
  }
});

// Validar si los datos son un array
const isValidArray = (data) => {
  return Array.isArray(data) && data.every(item => typeof item === 'object' && item.id);
};

// Formatear duración
const formatDuration = (seconds) => {
  if (!seconds) return '0s';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours > 0 ? hours + 'h ' : ''}${minutes > 0 ? minutes + 'm ' : ''}${secs}s`;
};

// Formatear fecha
const formatDate = (fecha) => {
  if (!fecha) return 'Sin fecha';
  const { dia, mes, anio, hora, minuto } = fecha;
  return `${dia}/${mes}/${anio} ${hora}:${minuto.toString().padStart(2, '0')}`;
};

// Depuración
console.log('URL de la API:', apiUrl);
console.log('URL completa:', `${apiUrl}/grabaciones`);
console.log('Datos:', grabaciones.value);
console.log('Error:', error.value);
</script>

<style scoped>
.content {
  margin-top: 20px;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.grabaciones-list {
  list-style: none;
  padding: 0;
}

.grabacion-item {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
  padding: 15px;
}

.grabacion-info {
  line-height: 1.6;
}

pre {
  background: #f4f4f4;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 14px;
}
</style>

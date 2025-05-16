<!-- pages/index.vue -->
<template>
  <div>
    <navComponent />
    <div class="content">
      <h1>Lista de Grabaciones</h1>
      <div v-if="error">Error: {{ error.message }}</div>
      <ul v-else-if="grabaciones">
        <li v-for="grabacion in grabaciones" :key="grabacion.id">
          {{ grabacion.title || grabacion.name || 'Grabación sin título' }}
        </li>
      </ul>
      <div v-else>Cargando...</div>
    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();
const { data: grabaciones, error } = await useFetch(`${config.public.apiUrl}/grabaciones`);

// Depuración
console.log('URL de la API:', config.public.apiUrl);
console.log('Datos:', grabaciones.value);
console.log('Error:', error.value);
</script>

<style scoped>
.content {
  margin-top: 20px;
  padding: 20px;
}
</style>
  
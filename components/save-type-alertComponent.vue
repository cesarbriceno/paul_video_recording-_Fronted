<template>
  <div class="floating-alert">
    <p>¿Cómo deseas guardar la grabación?</p>
    <button @click="$emit('save-audio')">Guardar como Audio</button>
    <button @click="$emit('save-video')">Guardar como Video</button>
    <button @click="$emit('close')">Cancelar</button>
  </div>
</template>

<script>
export default {
  name: "SaveTypeAlertComponent",
};
</script>

<style scoped>
/* El estilo principal ahora lo hereda de .floating-alert del listComponent.vue */
</style>

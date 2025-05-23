<template>
  <div class="floating-alert">
    <p>¿Qué deseas hacer con la grabación?</p>
    <button @click="$emit('save-recording')">Guardar</button>
    <button 
      @click="$emit('continue-recording')"
      :class="{ disabled: !isContinueEnabled }"
      :disabled="!isContinueEnabled"
    >
      Continuar
    </button>
    <button @click="$emit('delete-recording')">Eliminar</button>
  </div>
</template>

<script>
export default {
  name: "SaveAlertComponent",
  props: {
    isContinueEnabled: {
      type: Boolean,
      required: true,
    },
    isRecording: {
      type: Boolean,
      required: true,
    },
  },
};
</script>

<style scoped>
/* El estilo principal ahora lo hereda de .floating-alert del listComponent.vue */
.floating-alert button.disabled {
  background: #e0e0e0 !important;
  color: #a0a0a0 !important;
  cursor: not-allowed !important;
  border: none !important;
}
</style>
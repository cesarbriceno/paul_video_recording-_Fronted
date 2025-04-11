<template>
  <div class="save-alert">
    <div class="alert-box">
      <p>¿Deseas guardar los cambios?</p>
      <button @click="handleSave">Aceptar</button>
      <button @click="$emit('close')">Cancelar</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "SaveAlertComponent",
  methods: {
    handleSave() {
      this.$emit('button-click'); // Emitir evento de guardar
      this.$emit('stop-recording'); // Emitir evento para detener la grabación
    },
  },
};
</script>

<style scoped>
.alert-box {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}
.alert-box button {
  margin: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.alert-box button:first-of-type {
  background-color: #28a745;
  color: white;
}
.alert-box button:last-of-type {
  background-color: #dc3545;
  color: white;
}
</style>

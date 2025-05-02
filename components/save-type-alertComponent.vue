<template>
  <div class="save-type-alert">
    <div class="alert-box">
      <p>¿Cómo deseas guardar la grabación?</p>
      <button @click="$emit('save-audio')">Guardar como Audio</button>
      <button @click="$emit('save-video')">Guardar como Video</button>
      <button @click="$emit('close')">Cancelar</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "SaveTypeAlertComponent",
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
  background-color: #007bff;
  color: white;
}
.alert-box button:nth-of-type(2) {
  background-color: #28a745;
  color: white;
}
.alert-box button:last-of-type {
  background-color: #dc3545;
  color: white;
}
</style>

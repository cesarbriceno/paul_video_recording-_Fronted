<template>
  <div class="share-alert">
    <div class="alert-box">
      <p>¿Cómo deseas compartir la grabación?</p>
      <button @click="$emit('share-gmail')">
        <Icon name="mdi-gmail" class="share-icon" />
        Compartir vía Gmail
      </button>
      <button @click="$emit('share-link')">
        <Icon name="mdi-link" class="share-icon" />
        Copiar enlace
      </button>
      <button @click="$emit('close')">Cancelar</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "ShareAlertComponent",
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
  display: flex;
  align-items: center;
  gap: 8px;
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
.share-icon {
  font-size: 20px;
}
</style>

<template>
  <div class="save-alert">
    <div class="alert-box">
      <p>¿Qué deseas hacer con la grabación?</p>
      <button @click="$emit('button-click')">Guardar</button>
      <button 
        @click="$emit('continue-recording')"
        :class="{ disabled: !isContinueEnabled }"
      >
        Continuar
      </button>
    
      <button @click="$emit('delete-recording')">Eliminar</button>
    </div>
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
.alert-box button:nth-of-type(2) {
  background-color: #ffc107;
  color: white;
}
.alert-box button:nth-of-type(2).disabled {
  background-color: #e0e0e0;
  color: #a0a0a0;
  cursor: not-allowed;
}
.alert-box button:nth-of-type(3).disabled {
  background-color: #e0e0e0;
  color: #a0a0a0;
  cursor: not-allowed;
}
.alert-box button:last-of-type {
  background-color: #dc3545;
  color: white;
}
</style>

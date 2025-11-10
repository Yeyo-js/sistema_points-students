const { registerAuthHandlers } = require('./authHandlers');
const { registerCourseHandlers } = require('./courseHandlers');
const { registerStudentHandlers } = require('./studentHandlers');
const { registerPointHandlers } = require('./pointHandlers');
const { registerParticipationTypeHandlers } = require('./participationTypeHandlers');

function registerAllHandlers() {
  console.log('📡 Registrando handlers IPC...');
  
  registerAuthHandlers();
  registerCourseHandlers();
  registerStudentHandlers();
  registerPointHandlers();
  registerParticipationTypeHandlers();
  
  console.log('✅ Todos los handlers IPC registrados correctamente');
}

module.exports = { registerAllHandlers };
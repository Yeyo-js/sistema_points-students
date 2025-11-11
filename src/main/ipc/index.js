const { registerAuthHandlers } = require('./authHandlers');
const { registerCourseHandlers } = require('./courseHandlers');
const { registerStudentHandlers } = require('./studentHandlers');
const { registerPointHandlers } = require('./pointHandlers');
const { registerParticipationTypeHandlers } = require('./participationTypeHandlers');
const { registerDashboardHandlers } = require('./dashboardHandlers');
const { registerExcelHandlers } = require('./excelHandlers');
const { registerGroupHandlers } = require('./groupHandlers');

function registerAllHandlers() {
  console.log('📡 Registrando handlers IPC...');

  registerAuthHandlers();
  registerCourseHandlers();
  registerStudentHandlers();
  registerPointHandlers();
  registerParticipationTypeHandlers();
  registerDashboardHandlers();
  registerExcelHandlers();
  registerGroupHandlers();

  console.log('✅ Todos los handlers IPC registrados correctamente');
}

module.exports = { registerAllHandlers };
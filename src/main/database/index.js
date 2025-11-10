const DatabaseSchema = require('./schema.js');

let dbInstance = null;

async function getDatabase() {
  if (!dbInstance) {
    dbInstance = new DatabaseSchema();
    await dbInstance.initDatabase();
  }
  return dbInstance.getDb();
}

function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// Obtener instancia del schema (no solo la DB)
function getDatabaseInstance() {
  if (!dbInstance) {
    throw new Error('Base de datos no inicializada. Llama a initDatabase() primero.');
  }
  return dbInstance;
}

module.exports = {
  getDatabase,
  closeDatabase,
  getDatabaseInstance
};
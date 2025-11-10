class DbTransaction {
  static execute(dbInstance, callback) {
    try {
      // Iniciar transacción
      dbInstance.run('BEGIN TRANSACTION');
      
      // Ejecutar callback
      const result = callback();
      
      // Confirmar transacción
      dbInstance.run('COMMIT');
      
      return result;
    } catch (error) {
      // Revertir en caso de error
      dbInstance.run('ROLLBACK');
      throw error;
    }
  }
}

module.exports = DbTransaction;
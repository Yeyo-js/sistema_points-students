# Guía de Implementación: Import/Export de Excel

## ✅ Backend Completado (100%)

### Archivos Creados/Modificados:

1. **`src/main/services/excelService.js`** ✅
   - `exportStudents()` - Exporta estudiantes con puntos totales
   - `exportPoints()` - Exporta historial de puntos con colores
   - `importStudents()` - Importa con validaciones completas
   - `createImportTemplate()` - Crea plantilla con ejemplos

2. **`src/main/database/repositories/studentRepository.js`** ✅
   - `findByStudentCode()` - Busca por código
   - `findByListNumber()` - Busca por número de lista

3. **`src/main/ipc/excelHandlers.js`** ✅
   - `excel:exportStudents` - Handler de exportación
   - `excel:exportPoints` - Handler de exportación
   - `excel:importStudents` - Handler con diálogo de archivo
   - `excel:createTemplate` - Handler de plantilla

4. **`src/main/ipc/index.js`** ✅
   - Handlers registrados correctamente

5. **`src/renderer/services/excelService.js`** ✅
   - Servicio frontend completo
   - Exportado en `src/renderer/services/index.js`

---

## 🔧 Frontend Pendiente (UI)

### Cambios Necesarios en `students.jsx`

#### 1. Agregar Import de Excel Service

```javascript
import { studentService, courseService, excelService } from '../../services';
```

#### 2. Agregar States para Import

```javascript
const [importing, setImporting] = useState(false);
const [importResult, setImportResult] = useState(null);
const [showImportModal, setShowImportModal] = useState(false);
```

#### 3. Agregar Funciones de Export

```javascript
const handleExportStudents = async () => {
  if (!selectedCourseId) {
    alert('Selecciona un curso primero');
    return;
  }

  const course = courses.find(c => c.id === parseInt(selectedCourseId));
  if (!course) return;

  setLoading(true);
  try {
    const result = await excelService.exportStudents(course.id, course.name);

    if (result.success) {
      alert(`✅ Exportación exitosa!\n\nArchivo: ${result.fileName}\nEstudiantes: ${result.studentsCount}\n\nEl archivo se abrió en tu carpeta de Descargas.`);
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al exportar estudiantes');
  } finally {
    setLoading(false);
  }
};
```

#### 4. Agregar Función de Import

```javascript
const handleImportStudents = async () => {
  if (!selectedCourseId) {
    alert('Selecciona un curso primero');
    return;
  }

  setImporting(true);
  try {
    const result = await excelService.importStudents(parseInt(selectedCourseId));

    if (result.canceled) {
      setImporting(false);
      return;
    }

    if (result.success) {
      setImportResult(result);
      setShowImportModal(true);

      // Recargar estudiantes
      if (result.imported && result.imported.length > 0) {
        loadStudents(selectedCourseId);
      }
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al importar estudiantes');
  } finally {
    setImporting(false);
  }
};
```

#### 5. Agregar Función de Plantilla

```javascript
const handleDownloadTemplate = async () => {
  try {
    const result = await excelService.downloadTemplate();

    if (result.success) {
      alert(`✅ Plantilla descargada!\n\nArchivo: ${result.fileName}\n\nSe abrió en tu carpeta de Descargas.`);
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al descargar plantilla');
  }
};
```

#### 6. Modificar la Sección de Header (Agregar Botones)

Buscar el header con el título "Estudiantes" y agregar los botones:

```javascript
<div className="students-page__header">
  <div className="students-page__header-left">
    <h1 className="students-page__title">Estudiantes</h1>
    <p className="students-page__subtitle">
      Gestiona los estudiantes de tus cursos
    </p>
  </div>

  {selectedCourseId && (
    <div className="students-page__actions">
      <Button
        variant="outline"
        size="medium"
        onClick={handleDownloadTemplate}
        title="Descargar plantilla Excel"
      >
        📥 Plantilla
      </Button>
      <Button
        variant="secondary"
        size="medium"
        onClick={handleImportStudents}
        loading={importing}
        title="Importar desde Excel"
      >
        📤 Importar
      </Button>
      <Button
        variant="secondary"
        size="medium"
        onClick={handleExportStudents}
        loading={loading}
        title="Exportar a Excel"
      >
        📊 Exportar
      </Button>
      <Button
        variant="primary"
        size="medium"
        onClick={handleCreate}
      >
        + Crear Estudiante
      </Button>
    </div>
  )}
</div>
```

#### 7. Agregar Modal de Resultados de Importación

Al final del componente, antes del cierre del return:

```javascript
{showImportModal && importResult && (
  <Modal
    isOpen={showImportModal}
    onClose={() => {
      setShowImportModal(false);
      setImportResult(null);
    }}
    title="Resultado de Importación"
  >
    <div className="import-result">
      <div className="import-result__summary">
        <div className="import-result__stat import-result__stat--success">
          <h3>{importResult.imported?.length || 0}</h3>
          <p>Importados</p>
        </div>
        <div className="import-result__stat import-result__stat--warning">
          <h3>{importResult.duplicates?.length || 0}</h3>
          <p>Duplicados</p>
        </div>
        <div className="import-result__stat import-result__stat--error">
          <h3>{importResult.errors?.length || 0}</h3>
          <p>Errores</p>
        </div>
      </div>

      {importResult.imported && importResult.imported.length > 0 && (
        <div className="import-result__section">
          <h4>✅ Estudiantes Importados ({importResult.imported.length})</h4>
          <ul>
            {importResult.imported.slice(0, 10).map(item => (
              <li key={item.row}>
                Fila {item.row}: {item.data.fullName}
              </li>
            ))}
            {importResult.imported.length > 10 && (
              <li>... y {importResult.imported.length - 10} más</li>
            )}
          </ul>
        </div>
      )}

      {importResult.duplicates && importResult.duplicates.length > 0 && (
        <div className="import-result__section import-result__section--warning">
          <h4>⚠️ Duplicados ({importResult.duplicates.length})</h4>
          <ul>
            {importResult.duplicates.slice(0, 5).map((item, idx) => (
              <li key={idx}>
                Fila {item.row}: {item.data.fullName} - {item.reason}
              </li>
            ))}
            {importResult.duplicates.length > 5 && (
              <li>... y {importResult.duplicates.length - 5} más</li>
            )}
          </ul>
        </div>
      )}

      {importResult.errors && importResult.errors.length > 0 && (
        <div className="import-result__section import-result__section--error">
          <h4>❌ Errores ({importResult.errors.length})</h4>
          <ul>
            {importResult.errors.slice(0, 5).map((item, idx) => (
              <li key={idx}>
                Fila {item.row}: {item.error}
              </li>
            ))}
            {importResult.errors.length > 5 && (
              <li>... y {importResult.errors.length - 5} más</li>
            )}
          </ul>
        </div>
      )}

      <div className="import-result__actions">
        <Button
          variant="primary"
          size="medium"
          onClick={() => {
            setShowImportModal(false);
            setImportResult(null);
          }}
        >
          Cerrar
        </Button>
      </div>
    </div>
  </Modal>
)}
```

#### 8. Agregar Estilos en `students.css`

```css
/* Actions header */
.students-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.students-page__actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Import result modal */
.import-result {
  padding: 1rem;
}

.import-result__summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.import-result__stat {
  text-align: center;
  padding: 1.5rem;
  border-radius: 8px;
  background: var(--bg-secondary);
}

.import-result__stat h3 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.import-result__stat p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.import-result__stat--success h3 {
  color: var(--success);
}

.import-result__stat--warning h3 {
  color: var(--warning);
}

.import-result__stat--error h3 {
  color: var(--danger);
}

.import-result__section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border-radius: 8px;
  background: var(--bg-secondary);
}

.import-result__section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.import-result__section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.import-result__section li {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.875rem;
}

.import-result__section li:last-child {
  border-bottom: none;
}

.import-result__section--warning {
  background: var(--warning-light);
  border: 1px solid var(--warning);
}

.import-result__section--error {
  background: var(--danger-light);
  border: 1px solid var(--danger);
}

.import-result__actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}
```

---

### Cambios Necesarios en `points.jsx`

#### 1. Agregar Import

```javascript
import { pointService, courseService, excelService } from '../../services';
```

#### 2. Agregar Función de Export

```javascript
const handleExportPoints = async () => {
  if (!selectedCourseId) {
    alert('Selecciona un curso primero');
    return;
  }

  const course = courses.find(c => c.id === parseInt(selectedCourseId));
  if (!course) return;

  setLoading(true);
  try {
    const result = await excelService.exportPoints(course.id, course.name);

    if (result.success) {
      alert(`✅ Exportación exitosa!\n\nArchivo: ${result.fileName}\nPuntos: ${result.pointsCount}\n\nEl archivo se abrió en tu carpeta de Descargas.`);
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al exportar puntos');
  } finally {
    setLoading(false);
  }
};
```

#### 3. Agregar Botón en Header

Buscar el header y agregar el botón de exportación junto a los otros botones.

---

## 🧪 Testing

### Exportación de Estudiantes

1. Selecciona un curso con estudiantes
2. Click en "📊 Exportar"
3. Debe abrir la carpeta de Descargas con el archivo Excel
4. Verificar que el archivo contiene:
   - N° Lista, Código, Nombre, Puntos Totales, Fecha
   - Formato correcto
   - Estilos aplicados

### Exportación de Puntos

1. Selecciona un curso con puntos asignados
2. Click en "📊 Exportar" en la página de puntos
3. Verificar archivo con:
   - Fecha, Estudiante, Tipo, Puntos, Razón, Profesor
   - Puntos positivos en verde, negativos en rojo

### Importación de Estudiantes

1. Click en "📥 Plantilla" para descargar ejemplo
2. Editar el Excel con tus datos
3. Click en "📤 Importar"
4. Seleccionar archivo
5. Ver modal con resultados:
   - Importados exitosamente
   - Duplicados (si existen)
   - Errores (si existen)

### Validaciones a Probar

1. Importar con código duplicado → Debe detectar
2. Importar con número de lista duplicado → Debe detectar
3. Importar sin nombre → Debe marcar error
4. Importar archivo corrupto → Debe manejar error

---

## 📝 Notas Importantes

1. **Archivos se guardan en**: Carpeta de Descargas del usuario
2. **Formato de nombres**: `Estudiantes_NombreCurso_timestamp.xlsx`
3. **Auto-open**: Los archivos se muestran automáticamente en el explorador
4. **Validaciones**: Completas en el backend, incluye duplicados
5. **Plantilla**: Tiene ejemplos e instrucciones incorporadas

---

## 🐛 Troubleshooting

### Error: "No hay estudiantes para exportar"
- Asegúrate de que el curso tenga estudiantes registrados

### Error al abrir archivo
- Verifica permisos de escritura en carpeta Descargas
- Verifica que no esté abierto en Excel

### Import no detecta archivo
- Verifica que sea formato .xlsx o .xls
- Verifica que tenga las columnas correctas

---

## ✅ Checklist de Implementación

- [x] Backend completo
- [x] Servicio de Excel (main)
- [x] Handlers IPC
- [x] Servicio de Excel (renderer)
- [ ] UI en students.jsx
- [ ] UI en points.jsx
- [ ] Estilos CSS
- [ ] Testing completo

---

**Estado actual**: Backend 100% completo y funcional. Solo falta implementar la UI siguiendo esta guía.

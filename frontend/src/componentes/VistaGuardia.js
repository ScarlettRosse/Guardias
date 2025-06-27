import React, { useEffect, useState } from 'react';
import API from '../servicios/api';

function VistaGuardia({ usuario }) {
  const [turnos, setTurnos] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [turnoActual, setTurnoActual] = useState(null);
  const [turnoActualError, setTurnoActualError] = useState('');
  const [notificacion, setNotificacion] = useState({ tipo: '', mensaje: '' });
  const [cargando, setCargando] = useState(true);
  
  // Estados para el formulario de reporte
  const [categoria, setCategoria] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [idLocal, setIdLocal] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [locales, setLocales] = useState([]);

  // Calcular turno actual y futuros en el frontend
  const [turnoActualFront, setTurnoActualFront] = useState(null);
  const [turnosFuturos, setTurnosFuturos] = useState([]);

  // Estados para completar tareas
  const [mostrarModalContraseña, setMostrarModalContraseña] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [contraseña, setContraseña] = useState('');
  const [completandoTarea, setCompletandoTarea] = useState(false);

  // Función para cargar todos los datos
  const cargarDatos = async () => {
    console.log("🔍 DEBUG: Usuario recibido:", usuario);
    
    if (!usuario || !usuario.id) {
      console.log("❌ DEBUG: No hay usuario o no tiene ID");
      return;
    }

    setCargando(true);
    
    console.log("🔍 DEBUG: Tipo de usuario.id:", typeof usuario.id);

    try {
      // Probar una petición simple primero
      console.log("🔍 DEBUG: Probando petición a turnos...");
      
      // Cargar turnos, tareas, turno actual, categorías y locales en paralelo
      const [turnosRes, tareasRes, turnoActualRes, categoriasRes, localesRes] = await Promise.allSettled([
        API.get('/turnos/mis-turnos'),
        API.get('/tareas/mis-tareas'),
        API.get('/turnos/mi-turno-actual'),
        API.get('/reportes/categorias'),
        API.get('/locales')
      ]);

      // Procesar turnos
      if (turnosRes.status === 'fulfilled') {
        console.log("✅ DEBUG: Turnos recibidos:", turnosRes.value.data);
        setTurnos(turnosRes.value.data);
      } else {
        console.log("❌ DEBUG: Error en turnos:", turnosRes.reason);
        console.log("❌ DEBUG: Response error:", turnosRes.reason.response?.data);
      }

      // Procesar tareas
      if (tareasRes.status === 'fulfilled') {
        setTareas(tareasRes.value.data);
      }

      // Procesar turno actual
      if (turnoActualRes.status === 'fulfilled') {
        console.log("✅ DEBUG: Turno actual recibido:", turnoActualRes.value.data);
        setTurnoActual(turnoActualRes.value.data);
        setTurnoActualError('');
      } else {
        console.log("❌ DEBUG: Error en turno actual:", turnoActualRes.reason);
        console.log("❌ DEBUG: Response error:", turnoActualRes.reason.response?.data);
        setTurnoActual(null);
        setTurnoActualError(
          turnoActualRes.reason.response?.data?.mensaje ||
          "No se pudo obtener tu turno actual."
        );
      }

      // Procesar categorías
      if (categoriasRes.status === 'fulfilled') {
        setCategorias(categoriasRes.value.data.categorias);
      }

      // Procesar locales
      if (localesRes.status === 'fulfilled') {
        setLocales(localesRes.value.data);
      }

    } catch (error) {
      console.log("❌ DEBUG: Error general:", error);
      setNotificacion({ tipo: 'danger', mensaje: 'Error al cargar los datos' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  // Seleccionar sucursal del turno actual por defecto al cargar turnoActual
  useEffect(() => {
    if (turnoActual && turnoActual.local && turnoActual.local._id) {
      setIdLocal(turnoActual.local._id);
    }
  }, [turnoActual]);

  // Calcular turno actual y futuros en el frontend
  useEffect(() => {
    if (!turnos || turnos.length === 0) {
      setTurnoActualFront(null);
      setTurnosFuturos([]);
      return;
    }
    // Hora chilena actual
    const ahora = new Date();
    const ahoraChile = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Santiago' }));
    const hoyStr = ahoraChile.toISOString().split('T')[0];
    const horaActual = ahoraChile.getHours() * 60 + ahoraChile.getMinutes();

    let actual = null;
    const futuros = [];
    for (const turno of turnos) {
      const [y, m, d] = turno.fecha.split('-');
      const fechaTurno = new Date(y, m - 1, d);
      const fechaTurnoStr = fechaTurno.toISOString().split('T')[0];
      const entrada = parseInt(turno.hora_entrada.split(':')[0]) * 60 + parseInt(turno.hora_entrada.split(':')[1]);
      const salida = parseInt(turno.hora_salida.split(':')[0]) * 60 + parseInt(turno.hora_salida.split(':')[1]);
      if (fechaTurnoStr === hoyStr && horaActual >= entrada && horaActual < salida) {
        actual = turno;
      } else if (
        fechaTurnoStr > hoyStr ||
        (fechaTurnoStr === hoyStr && horaActual < entrada)
      ) {
        futuros.push(turno);
      }
    }
    setTurnoActualFront(actual);
    setTurnosFuturos(futuros);
  }, [turnos]);

  const enviarReporte = async () => {
    if (!usuario || !usuario.id) {
      setNotificacion({ tipo: 'danger', mensaje: 'Usuario no definido' });
      return;
    }

    if (!categoria || !descripcion.trim() || !idLocal) {
      setNotificacion({ tipo: 'warning', mensaje: 'Por favor completa todos los campos del reporte' });
      return;
    }

    try {
      await API.post('/reportes/enviar', {
        categoria,
        descripcion,
        id_local: idLocal,
        fecha: new Date().toISOString()
      });
      
      setNotificacion({ tipo: 'success', mensaje: 'Reporte enviado correctamente' });
      setCategoria('');
      setDescripcion('');
      setIdLocal('');
    } catch (error) {
      setNotificacion({ 
        tipo: 'danger', 
        mensaje: error.response?.data?.error || 'Error al enviar el reporte' 
      });
    }
  };

  // Función para abrir modal de completar tarea
  const abrirModalCompletarTarea = (tarea) => {
    setTareaSeleccionada(tarea);
    setContraseña('');
    setMostrarModalContraseña(true);
  };

  // Función para completar tarea
  const completarTarea = async () => {
    if (!contraseña.trim()) {
      setNotificacion({ tipo: 'warning', mensaje: 'Por favor ingresa tu contraseña' });
      return;
    }

    setCompletandoTarea(true);
    try {
      await API.put(`/tareas/completar/${tareaSeleccionada._id}`, {
        contraseña: contraseña
      });
      
      setNotificacion({ tipo: 'success', mensaje: 'Tarea marcada como realizada correctamente' });
      setMostrarModalContraseña(false);
      setTareaSeleccionada(null);
      setContraseña('');
      
      // Recargar las tareas para mostrar el cambio
      cargarDatos();
    } catch (error) {
      setNotificacion({ 
        tipo: 'danger', 
        mensaje: error.response?.data?.error || 'Error al completar la tarea' 
      });
    } finally {
      setCompletandoTarea(false);
    }
  };

  // Función para cancelar completar tarea
  const cancelarCompletarTarea = () => {
    setMostrarModalContraseña(false);
    setTareaSeleccionada(null);
    setContraseña('');
  };

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    window.location.reload();
  };

  // Limpiar notificación automática
  useEffect(() => {
    if (notificacion.mensaje) {
      const timer = setTimeout(() => setNotificacion({ tipo: '', mensaje: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [notificacion]);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <h3>Panel del Guardia - {usuario?.nombre || 'Sin nombre'}</h3>
        <div>
          <button className="btn btn-danger" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </div>

      {/* Notificación */}
      {notificacion.mensaje && (
        <div className={`alert alert-${notificacion.tipo} mt-3`} role="alert">
          {notificacion.mensaje}
        </div>
      )}

      {/* --- Tarjeta de turno actual --- */}
      <div className="card mt-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">📅 Mi Turno Actual</h5>
        </div>
        <div className="card-body">
          {cargando ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : !turnoActualFront ? (
            <div className="text-center text-muted py-4">
              <i className="fas fa-calendar-times fa-3x mb-3"></i>
              <p>No tienes turno asignado en este momento</p>
            </div>
          ) : (
            <div className="row">
              <div className="col-md-6">
                <h6>🏢 Local Asignado</h6>
                <p><strong>Nombre:</strong> {turnoActualFront.nombre_local || turnoActualFront.local?.nombre}</p>
                <p><strong>Dirección:</strong> {turnoActualFront.direccion_local || turnoActualFront.local?.direccion}</p>
              </div>
              <div className="col-md-6">
                <h6>⏰ Horario</h6>
                <p><strong>Fecha:</strong> {(() => { const [y,m,d]=(turnoActualFront.fecha||'').split('-'); if(!y)return ''; const f=new Date(y,m-1,d); return f.toLocaleDateString('es-CL'); })()}</p>
                <p><strong>Entrada:</strong> {turnoActualFront.hora_entrada}</p>
                <p><strong>Salida:</strong> {turnoActualFront.hora_salida}</p>
              </div>
              {turnoActualFront.tareas && turnoActualFront.tareas.length > 0 && (
                <div className="col-12 mt-3">
                  <h6>🛠️ Tareas del Turno</h6>
                  <ul className="list-group">
                    {turnoActualFront.tareas.map((tarea, index) => (
                      <li key={index} className="list-group-item">
                        <i className="fas fa-tasks me-2"></i>
                        {tarea}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- Mis Turnos Futuros --- */}
      <div className="card mt-4">
        <div className="card-header bg-success text-white">
          <h5 className="mb-0">📋 Mis Turnos Futuros ({turnosFuturos.length})</h5>
        </div>
        <div className="card-body">
          {cargando ? (
            <div className="text-center">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : turnosFuturos.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="fas fa-calendar-alt fa-3x mb-3"></i>
              <p>No tienes turnos futuros asignados</p>
            </div>
          ) : (
            <div className="row">
              {turnosFuturos.map((turno, index) => (
                <div key={turno._id || index} className="col-md-6 col-lg-4 mb-3">
                  <div className="card h-100 border-success">
                    <div className="card-header bg-success text-white">
                      <h6 className="mb-0">Turno #{index + 1}</h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-2">
                        <strong>🏢 Local:</strong> {turno.nombre_local}
                      </div>
                      <div className="mb-2">
                        <strong>📅 Fecha:</strong> {(() => { const [y,m,d]=turno.fecha.split('-'); const f=new Date(y,m-1,d); return f.toLocaleDateString('es-CL'); })()}
                      </div>
                      <div className="mb-2">
                        <strong>⏰ Horario:</strong> {turno.hora_entrada} - {turno.hora_salida}
                      </div>
                      {turno.tareas && turno.tareas.length > 0 && (
                        <div className="mb-2">
                          <strong>🛠️ Tareas:</strong>
                          <ul className="list-unstyled ms-3">
                            {turno.tareas.map((tarea, i) => (
                              <li key={i}><small>• {tarea}</small></li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- Mis Tareas --- */}
      <div className="card mt-4">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">🛠️ Mis Tareas ({tareas.length})</h5>
        </div>
        <div className="card-body">
          {cargando ? (
            <div className="text-center">
              <div className="spinner-border text-info" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : tareas.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="fas fa-tasks fa-3x mb-3"></i>
              <p>No tienes tareas asignadas</p>
            </div>
          ) : (
            <div className="row">
              {tareas.map((tarea, index) => (
                <div key={tarea._id || index} className="col-md-6 col-lg-4 mb-3">
                  <div className="card h-100 border-info">
                    <div className="card-header bg-info text-white">
                      <h6 className="mb-0">Tarea #{index + 1}</h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-2">
                        <strong>🏢 Local:</strong> {tarea.nombre_local}
                      </div>
                      <div className="mb-2">
                        <strong>📅 Fecha:</strong> {(() => { const [y,m,d]=tarea.fecha.split('-'); const f=new Date(y,m-1,d); return f.toLocaleDateString('es-CL'); })()}
                      </div>
                      <div className="mb-2">
                        <strong>📝 Descripción:</strong>
                        <p className="mt-1">{tarea.descripcion}</p>
                      </div>
                      <div className="mb-2">
                        <strong>📊 Estado:</strong>
                        <span className={`badge ms-2 ${
                          tarea.estado === 'realizado' ? 'bg-success' :
                          tarea.estado === 'en_progreso' ? 'bg-warning' : 'bg-secondary'
                        }`}>
                          {tarea.estado === 'realizado' ? 'Realizado' :
                           tarea.estado === 'en_progreso' ? 'En Progreso' : 'Pendiente'}
                        </span>
                      </div>
                      {tarea.estado === 'pendiente' && (
                        <div className="mt-3">
                          <button 
                            className="btn btn-success btn-sm w-100"
                            onClick={() => abrirModalCompletarTarea(tarea)}
                          >
                            <i className="fas fa-check me-2"></i>
                            Marcar como Realizada
                          </button>
                        </div>
                      )}
                      {tarea.estado === 'realizado' && tarea.fecha_completado && (
                        <div className="mt-2">
                          <small className="text-muted">
                            <i className="fas fa-clock me-1"></i>
                            Completada: {new Date(tarea.fecha_completado).toLocaleString('es-CL')}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- Enviar Reporte de Incidente --- */}
      <div className="card mt-4">
        <div className="card-header bg-warning text-dark">
          <h5 className="mb-0">🚨 Reportar Incidente</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Categoría del incidente *</label>
              <select
                className="form-select"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                required
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Sucursal *</label>
              {locales.length > 0 ? (
                <select
                  className="form-select"
                  value={idLocal}
                  onChange={(e) => setIdLocal(e.target.value)}
                  required
                >
                  <option value="">Selecciona una sucursal</option>
                  {locales.map((local) => (
                    <option key={local._id} value={local._id}>
                      {local.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="alert alert-warning py-1 mb-0">No hay sucursales disponibles</div>
              )}
            </div>
            <div className="col-md-4 mb-3 d-flex align-items-end">
              <button 
                className="btn btn-warning w-100" 
                onClick={enviarReporte}
                disabled={!categoria || !descripcion.trim() || !idLocal}
              >
                <i className="fas fa-paper-plane me-2"></i>
                Enviar Reporte
              </button>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Descripción del incidente *</label>
            <textarea
              className="form-control"
              rows="4"
              placeholder="Describe detalladamente lo que sucedió..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
            ></textarea>
          </div>
        </div>
      </div>

      {/* Modal para solicitar contraseña */}
      {mostrarModalContraseña && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-lock me-2"></i>
                  Verificar Contraseña
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={cancelarCompletarTarea}
                  disabled={completandoTarea}
                ></button>
              </div>
              <div className="modal-body">
                <p>Para marcar la tarea como realizada, necesitas confirmar tu contraseña:</p>
                <div className="mb-3">
                  <label className="form-label">Contraseña:</label>
                  <input
                    type="password"
                    className="form-control"
                    value={contraseña}
                    onChange={(e) => setContraseña(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    disabled={completandoTarea}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !completandoTarea) {
                        completarTarea();
                      }
                    }}
                  />
                </div>
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Tarea:</strong> {tareaSeleccionada?.descripcion}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={cancelarCompletarTarea}
                  disabled={completandoTarea}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={completarTarea}
                  disabled={completandoTarea || !contraseña.trim()}
                >
                  {completandoTarea ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Completando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-2"></i>
                      Completar Tarea
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay del modal */}
      {mostrarModalContraseña && (
        <div className="modal-backdrop fade show"></div>
      )}
    </div>
  );
}

export default VistaGuardia;

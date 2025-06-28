import React, { useEffect, useState } from 'react';
import API from '../servicios/api';
import VistaLocales from './VistaLocales';

function VistaSupervisor({ usuario }) {
  // Listas y estado de la app
  const [tareas, setTareas] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [guardias, setGuardias] = useState([]);
  const [locales, setLocales] = useState([]);
  const [notificacion, setNotificacion] = useState({ tipo: '', mensaje: '' });

  // Estado para asignar turno
  const [formTurno, setFormTurno] = useState({
    id_guardia: '',
    id_local: '',
    fecha: '',
    hora_entrada: '',
    hora_salida: '',
  });

  // Estado unificado para tareas
  const [tareasLista, setTareasLista] = useState([]);
  const [formTarea, setFormTarea] = useState({
    id_guardia: '',
    id_local: '',
    descripcion: '',
    fecha: '',
  });

  // Estado para días ocupados del guardia
  const [diasOcupados, setDiasOcupados] = useState([]);
  const [cargandoDias, setCargandoDias] = useState(false);

  // Estado para fechas disponibles de tareas
  const [fechasDisponiblesTareas, setFechasDisponiblesTareas] = useState([]);
  const [cargandoFechasTareas, setCargandoFechasTareas] = useState(false);

  // --- Filtros para tareas asignadas ---
  const [filtroTareaGuardia, setFiltroTareaGuardia] = useState('');
  const [filtroTareaLocal, setFiltroTareaLocal] = useState('');
  const [filtroTareaFecha, setFiltroTareaFecha] = useState('');

  // --- Filtros para turnos asignados ---
  const [filtroTurnoGuardia, setFiltroTurnoGuardia] = useState('');
  const [filtroTurnoLocal, setFiltroTurnoLocal] = useState('');
  const [filtroTurnoFecha, setFiltroTurnoFecha] = useState('');

  // Horarios pre-establecidos éticos y legales
  const horariosPreEstablecidos = [
    {
      nombre: "Turno Mañana",
      hora_entrada: "06:00",
      hora_salida: "14:00",
      descripcion: "Turno de mañana (8 horas)"
    },
    {
      nombre: "Turno Tarde",
      hora_entrada: "14:00",
      hora_salida: "22:00",
      descripcion: "Turno de tarde (8 horas)"
    },
    {
      nombre: "Turno Noche",
      hora_entrada: "22:00",
      hora_salida: "06:00",
      descripcion: "Turno de noche (8 horas)"
    },
    {
      nombre: "Turno Completo",
      hora_entrada: "08:00",
      hora_salida: "18:00",
      descripcion: "Turno completo diurno (10 horas)"
    },
    {
      nombre: "Turno Reducido",
      hora_entrada: "09:00",
      hora_salida: "17:00",
      descripcion: "Turno reducido (8 horas)"
    },
    {
      nombre: "Turno Especial",
      hora_entrada: "12:00",
      hora_salida: "20:00",
      descripcion: "Turno especial (8 horas)"
    }
  ];

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  // Función para cargar todos los datos
  const cargarDatos = async () => {
    try {
      const [tareasRes, turnosRes, guardiasRes, localesRes] = await Promise.all([
        API.get('/tareas'),
        API.get('/turnos'),
        API.get('/usuarios/guardias'),
        API.get('/locales')
      ]);
      
      setTareas(tareasRes.data);
      setTurnos(turnosRes.data);
      setGuardias(guardiasRes.data);
      setLocales(localesRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setNotificacion({ tipo: 'danger', mensaje: 'Error al cargar los datos' });
    }
  };

  // Cerrar sesión
  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    window.location.reload();
  };

  // ----- ASIGNAR TURNO -----
  const handleChangeTurno = e => {
    setFormTurno({ ...formTurno, [e.target.name]: e.target.value });
    
    // Si se seleccionó un guardia, obtener sus días ocupados
    if (e.target.name === 'id_guardia' && e.target.value) {
      obtenerDiasOcupados(e.target.value);
    } else if (e.target.name === 'id_guardia' && !e.target.value) {
      // Si se deseleccionó el guardia, limpiar días ocupados
      setDiasOcupados([]);
    }
  };

  // Función para obtener días ocupados del guardia
  const obtenerDiasOcupados = async (idGuardia) => {
    setCargandoDias(true);
    try {
      // Obtener fecha actual
      const fechaActual = new Date().toISOString().split('T')[0];
      
      // Filtrar turnos del guardia seleccionado (solo fechas actuales y futuras)
      const turnosGuardia = turnos.filter(turno => 
        turno.id_guardia === idGuardia && turno.fecha >= fechaActual
      );
      
      // Extraer fechas únicas y ordenarlas
      const fechasOcupadas = [...new Set(turnosGuardia.map(turno => turno.fecha))].sort();
      
      // Formatear fechas para mostrar
      const diasFormateados = fechasOcupadas.map(fecha => {
        const fechaObj = new Date(fecha);
        return {
          fecha: fecha,
          fechaFormateada: fechaObj.toLocaleDateString('es-CL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          turnos: turnosGuardia.filter(turno => turno.fecha === fecha)
        };
      });
      
      setDiasOcupados(diasFormateados);
    } catch (error) {
      console.error('Error al obtener días ocupados:', error);
      setDiasOcupados([]);
    } finally {
      setCargandoDias(false);
    }
  };

  // Función para verificar si la fecha seleccionada tiene conflictos
  const verificarConflictoFecha = (fechaSeleccionada) => {
    if (!formTurno.id_guardia || !fechaSeleccionada) return false;
    
    const turnosEnFecha = turnos.filter(turno => 
      turno.id_guardia === formTurno.id_guardia && 
      turno.fecha === fechaSeleccionada
    );
    
    // Si hay turnos en esa fecha, verificar si hay conflicto con los horarios seleccionados
    if (turnosEnFecha.length > 0 && formTurno.hora_entrada && formTurno.hora_salida) {
      const conflicto = verificarConflictoHorarios(formTurno.id_guardia, fechaSeleccionada, formTurno.hora_entrada, formTurno.hora_salida);
      return conflicto.hayConflicto;
    }
    
    return turnosEnFecha.length > 0;
  };

  // Función para obtener fechas disponibles para tareas del guardia
  const obtenerFechasDisponiblesTareas = async (idGuardia) => {
    setCargandoFechasTareas(true);
    try {
      // Obtener fecha actual
      const fechaActual = new Date().toISOString().split('T')[0];
      
      // Filtrar turnos del guardia seleccionado (solo fechas actuales y futuras)
      const turnosGuardia = turnos.filter(turno => 
        turno.id_guardia === idGuardia && turno.fecha >= fechaActual
      );
      
      // Extraer fechas únicas y ordenarlas
      const fechasConTurnos = [...new Set(turnosGuardia.map(turno => turno.fecha))].sort();
      
      setFechasDisponiblesTareas(fechasConTurnos);
    } catch (error) {
      console.error('Error al obtener fechas disponibles para tareas:', error);
      setFechasDisponiblesTareas([]);
    } finally {
      setCargandoFechasTareas(false);
    }
  };

  // Función para verificar si el guardia tiene turnos asignados
  const guardiaTieneTurnos = (idGuardia) => {
    const fechaActual = new Date().toISOString().split('T')[0];
    const turnosGuardia = turnos.filter(turno => 
      turno.id_guardia === idGuardia && turno.fecha >= fechaActual
    );
    return turnosGuardia.length > 0;
  };

  // Función para verificar conflicto específico de horarios
  const verificarConflictoHorarios = (idGuardia, fecha, horaEntrada, horaSalida) => {
    if (!idGuardia || !fecha || !horaEntrada || !horaSalida) return false;
    
    const turnosEnFecha = turnos.filter(turno => 
      turno.id_guardia === idGuardia && turno.fecha === fecha
    );
    
    // Convertir horas a minutos para comparación
    const nuevaEntrada = parseInt(horaEntrada.split(':')[0]) * 60 + parseInt(horaEntrada.split(':')[1]);
    const nuevaSalida = parseInt(horaSalida.split(':')[0]) * 60 + parseInt(horaSalida.split(':')[1]);
    
    // Manejar turnos que cruzan la medianoche
    if (nuevaSalida < nuevaEntrada) {
      nuevaSalida += 24 * 60; // Agregar 24 horas
    }
    
    for (const turno of turnosEnFecha) {
      const existenteEntrada = parseInt(turno.hora_entrada.split(':')[0]) * 60 + parseInt(turno.hora_entrada.split(':')[1]);
      const existenteSalida = parseInt(turno.hora_salida.split(':')[0]) * 60 + parseInt(turno.hora_salida.split(':')[1]);
      
      // Manejar turnos que cruzan la medianoche
      if (existenteSalida < existenteEntrada) {
        existenteSalida += 24 * 60; // Agregar 24 horas
      }
      
      // Verificar si hay traslape (cualquier superposición)
      // Hay conflicto si:
      // 1. La nueva entrada está dentro del turno existente
      // 2. La nueva salida está dentro del turno existente  
      // 3. El nuevo turno contiene completamente al existente
      if (
        (nuevaEntrada >= existenteEntrada && nuevaEntrada < existenteSalida) || // Nueva entrada dentro del existente
        (nuevaSalida > existenteEntrada && nuevaSalida <= existenteSalida) ||   // Nueva salida dentro del existente
        (nuevaEntrada <= existenteEntrada && nuevaSalida >= existenteSalida)    // Nuevo turno contiene al existente
      ) {
        return {
          hayConflicto: true,
          turnoConflictivo: turno,
          mensaje: `Conflicto con turno existente: ${turno.hora_entrada} - ${turno.hora_salida}`
        };
      }
    }
    
    return { hayConflicto: false };
  };

  // Función para obtener información detallada de conflictos
  const obtenerInfoConflicto = (idGuardia, fecha, horaEntrada, horaSalida) => {
    if (!idGuardia || !fecha || !horaEntrada || !horaSalida) return null;
    
    const conflicto = verificarConflictoHorarios(idGuardia, fecha, horaEntrada, horaSalida);
    if (conflicto.hayConflicto) {
      return {
        mensaje: `Esta persona ya tiene un turno asignado de ${conflicto.turnoConflictivo.hora_entrada} a ${conflicto.turnoConflictivo.hora_salida} en esta fecha. No se puede asignar un turno de ${horaEntrada} a ${horaSalida}.`,
        turnoConflictivo: conflicto.turnoConflictivo
      };
    }
    return null;
  };

  const handleSubmitTurno = async e => {
    e.preventDefault();
    
    // Verificar conflicto específico de horarios
    const infoConflicto = obtenerInfoConflicto(formTurno.id_guardia, formTurno.fecha, formTurno.hora_entrada, formTurno.hora_salida);
    if (infoConflicto) {
      setNotificacion({ 
        tipo: 'danger', 
        mensaje: infoConflicto.mensaje
      });
      return;
    }
    
    try {
      await API.post('/turnos/asignar', formTurno);
      setNotificacion({ tipo: 'success', mensaje: 'Turno asignado correctamente' });
      setFormTurno({ id_guardia: '', id_local: '', fecha: '', hora_entrada: '', hora_salida: '' });
      setDiasOcupados([]); // Limpiar días ocupados
      // Recargar datos
      await cargarDatos();
    } catch (error) {
      let msg = error.response?.data?.error || 'Error al asignar turno';
      setNotificacion({ tipo: 'danger', mensaje: msg });
    }
  };

  // ----- ASIGNAR TAREA -----
  const handleChangeTarea = e => {
    setFormTarea({ ...formTarea, [e.target.name]: e.target.value });
    
    // Si se seleccionó un guardia, obtener sus fechas disponibles para tareas
    if (e.target.name === 'id_guardia' && e.target.value) {
      obtenerFechasDisponiblesTareas(e.target.value);
    } else if (e.target.name === 'id_guardia' && !e.target.value) {
      // Si se deseleccionó el guardia, limpiar fechas disponibles
      setFechasDisponiblesTareas([]);
      setFormTarea({ ...formTarea, fecha: '' }); // Limpiar fecha seleccionada
    }
  };

  const handleSubmitTarea = async e => {
    e.preventDefault();
    
    try {
      await API.post('/tareas/asignar', formTarea);
      setNotificacion({ tipo: 'success', mensaje: 'Tarea asignada correctamente' });
      setFormTarea({ id_guardia: '', id_local: '', descripcion: '', fecha: '' });
      // Recargar datos
      await cargarDatos();
    } catch (error) {
      let msg = 'Error al asignar tarea';
      if (error.response?.data?.error) {
        msg = error.response.data.error;
      } else if (error.response?.data?.mensaje) {
        msg = error.response.data.mensaje;
      } else if (error.response?.status === 403) {
        msg = 'No tienes permisos para asignar tareas';
      } else if (error.response?.status === 400) {
        msg = 'Datos inválidos en la tarea';
      } else if (error.response?.status === 404) {
        msg = 'Guardia o local no encontrado';
      }
      
      setNotificacion({ tipo: 'danger', mensaje: msg });
    }
  };

  // ----- FUNCIONES PARA HORARIOS PRE-ESTABLECIDOS -----
  const aplicarHorarioPreEstablecido = (horario) => {
    setFormTurno({
      ...formTurno,
      hora_entrada: horario.hora_entrada,
      hora_salida: horario.hora_salida
    });
    setNotificacion({ 
      tipo: 'info', 
      mensaje: `Horario aplicado: ${horario.nombre} (${horario.descripcion})` 
    });
  };

  // ----- FUNCIONES UNIFICADAS PARA TAREAS -----
  const agregarTareaALista = () => {
    if (!formTarea.id_guardia || !formTarea.id_local || !formTarea.descripcion) {
      setNotificacion({ tipo: 'warning', mensaje: 'Por favor completa todos los campos obligatorios' });
      return;
    }

    // Verificar que el guardia tenga turnos asignados
    if (!guardiaTieneTurnos(formTarea.id_guardia)) {
      setNotificacion({ 
        type: 'warning', 
        mensaje: 'Este guardia no tiene turnos asignados. No se le pueden asignar tareas.' 
      });
      return;
    }

    // Verificar que se haya seleccionado una fecha
    if (!formTarea.fecha) {
      setNotificacion({ 
        type: 'warning', 
        mensaje: 'Debes seleccionar una fecha en la que el guardia tenga un turno asignado' 
      });
      return;
    }

    const nuevaTarea = {
      ...formTarea,
      id: Date.now(), // ID temporal para identificar la tarea en la lista
    };

    setTareasLista([...tareasLista, nuevaTarea]);
    setFormTarea({
      ...formTarea,
      descripcion: '' // Solo limpiar la descripción
    });
    setNotificacion({ tipo: 'success', mensaje: 'Tarea agregada a la lista' });
  };

  const eliminarTareaDeLista = (id) => {
    setTareasLista(tareasLista.filter(tarea => tarea.id !== id));
  };

  const enviarTodasLasTareas = async () => {
    if (tareasLista.length === 0) {
      setNotificacion({ tipo: 'warning', mensaje: 'No hay tareas en la lista para enviar' });
      return;
    }

    let tareasExitosas = 0;
    let tareasFallidas = 0;
    let erroresDetallados = [];

    try {
      for (const tarea of tareasLista) {
        try {
          const { id, ...tareaSinId } = tarea; // Remover el ID temporal
          
          await API.post('/tareas/asignar', tareaSinId);
          tareasExitosas++;
        } catch (error) {
          tareasFallidas++;
          console.error('Error al asignar tarea:', error);
          
          let errorMsg = 'Error desconocido';
          if (error.response?.data?.error) {
            errorMsg = error.response.data.error;
          } else if (error.response?.data?.mensaje) {
            errorMsg = error.response.data.mensaje;
          }
          
          erroresDetallados.push(`Tarea ${tareasFallidas}: ${errorMsg}`);
        }
      }

      if (tareasExitosas > 0) {
        let mensaje = `${tareasExitosas} tareas asignadas correctamente`;
        if (tareasFallidas > 0) {
          mensaje += `, ${tareasFallidas} fallaron`;
          if (erroresDetallados.length > 0) {
            console.error('Errores detallados:', erroresDetallados);
          }
        }
        
        setNotificacion({ tipo: 'success', mensaje });
        setTareasLista([]);
        // Recargar datos
        await cargarDatos();
      } else {
        setNotificacion({ 
          tipo: 'danger', 
          mensaje: `No se pudo asignar ninguna tarea. Errores: ${erroresDetallados.join(', ')}` 
        });
      }
    } catch (error) {
      console.error('Error general al enviar tareas:', error);
      setNotificacion({ 
        tipo: 'danger', 
        mensaje: 'Error general al enviar las tareas' 
      });
    }
  };

  // Limpiar notificación automática
  useEffect(() => {
    if (notificacion.mensaje) {
      const timer = setTimeout(() => setNotificacion({ tipo: '', mensaje: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [notificacion]);

  // Tareas filtradas
  const tareasFiltradas = tareas.filter(tarea => {
    const cumpleGuardia = !filtroTareaGuardia || tarea.id_guardia === filtroTareaGuardia;
    const cumpleLocal = !filtroTareaLocal || tarea.id_local === filtroTareaLocal;
    const cumpleFecha = !filtroTareaFecha || (() => { const [y,m,d]=tarea.fecha.split('-'); const f=new Date(y,m-1,d); return f.toLocaleDateString('es-CL') === filtroTareaFecha; })();
    return cumpleGuardia && cumpleLocal && cumpleFecha;
  });

  // Turnos filtrados
  const turnosFiltrados = turnos.filter(turno => {
    const cumpleGuardia = !filtroTurnoGuardia || turno.id_guardia === filtroTurnoGuardia;
    const cumpleLocal = !filtroTurnoLocal || turno.id_local === filtroTurnoLocal;
    const cumpleFecha = !filtroTurnoFecha || (() => { const [y,m,d]=turno.fecha.split('-'); const f=new Date(y,m-1,d); return f.toLocaleDateString('es-CL') === filtroTurnoFecha; })();
    return cumpleGuardia && cumpleLocal && cumpleFecha;
  });

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <h3>Panel del Supervisor - {usuario.nombre}</h3>
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

      {/* FORMULARIO PARA ASIGNAR TURNO */}
      <div className="card mt-4">
        <div className="card-body">
          <h5>📅 Asignar Turno</h5>
          
          {/* Horarios Pre-establecidos */}
          <div className="mb-3">
            <label className="form-label">🕐 Horarios Pre-establecidos (Éticos y Legales):</label>
            <div className="row g-2">
              {horariosPreEstablecidos.map((horario, index) => (
                <div key={index} className="col-md-4 col-lg-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm w-100"
                    onClick={() => aplicarHorarioPreEstablecido(horario)}
                    title={horario.descripcion}
                  >
                    <div className="small">
                      <strong>{horario.nombre}</strong>
                    </div>
                    <div className="small text-muted">
                      {horario.hora_entrada} - {horario.hora_salida}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmitTurno}>
            <div className="row g-2">
              <div className="col-md-3">
                <label className="form-label">👤 Guardia</label>
                <select
                  className="form-select"
                  name="id_guardia"
                  value={formTurno.id_guardia}
                  onChange={handleChangeTurno}
                  required
                >
                  <option value="">Selecciona un guardia</option>
                  {guardias.map(g => (
                    <option key={g._id} value={g._id}>{g.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">🏢 Local</label>
                <select
                  className="form-select"
                  name="id_local"
                  value={formTurno.id_local}
                  onChange={handleChangeTurno}
                  required
                >
                  <option value="">Selecciona un local</option>
                  {locales.map(l => (
                    <option key={l._id} value={l._id}>{l.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label">📅 Fecha</label>
                <input
                  type="date"
                  className={`form-control ${verificarConflictoFecha(formTurno.fecha) ? 'border-warning' : ''}`}
                  name="fecha"
                  value={formTurno.fecha}
                  onChange={handleChangeTurno}
                  required
                />
                {/* Mostrar el día de la semana junto a la fecha seleccionada */}
                {formTurno.fecha && (
                  <div className="form-text text-primary">
                    <i className="fas fa-calendar-day me-1"></i>
                    {(() => {
                      const [year, month, day] = formTurno.fecha.split('-');
                      const fechaObj = new Date(year, month - 1, day);
                      return fechaObj.toLocaleDateString('es-CL', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      });
                    })()}
                  </div>
                )}
                {verificarConflictoFecha(formTurno.fecha) && (
                  <div className="form-text text-warning">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    ⚠️ Este guardia ya tiene turnos asignados en esta fecha
                  </div>
                )}
              </div>
              <div className="col-md-2">
                <label className="form-label">🟢 Hora Entrada</label>
                <input
                  type="time"
                  className="form-control"
                  name="hora_entrada"
                  value={formTurno.hora_entrada}
                  onChange={handleChangeTurno}
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">🔴 Hora Salida</label>
                <input
                  type="time"
                  className="form-control"
                  name="hora_salida"
                  value={formTurno.hora_salida}
                  onChange={handleChangeTurno}
                  required
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="btn btn-success mt-3"
              disabled={verificarConflictoFecha(formTurno.fecha)}
              title={verificarConflictoFecha(formTurno.fecha) ? "No se puede asignar turno: conflicto de horarios" : ""}
            >
              <i className="fas fa-save me-2"></i>
              {verificarConflictoFecha(formTurno.fecha) ? "Conflicto de Horarios" : "Asignar Turno"}
            </button>
          </form>

          {/* Mostrar días ocupados del guardia seleccionado */}
          {formTurno.id_guardia && (
            <div className="mt-3">
              <div className="alert alert-info">
                <h6 className="mb-2">
                  <i className="fas fa-calendar-check me-2"></i>
                  📅 Días con turnos asignados para este guardia:
                </h6>
                {cargandoDias ? (
                  <div className="text-center">
                    <div className="spinner-border spinner-border-sm text-info" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <span className="ms-2">Cargando días ocupados...</span>
                  </div>
                ) : diasOcupados.length > 0 ? (
                  <div className="row">
                    {diasOcupados.map((dia, index) => {
                      // Verificar si hay conflicto potencial con los horarios seleccionados
                      const hayConflictoPotencial = formTurno.fecha === dia.fecha && formTurno.hora_entrada && formTurno.hora_salida;
                      const infoConflicto = hayConflictoPotencial ? 
                        obtenerInfoConflicto(formTurno.id_guardia, dia.fecha, formTurno.hora_entrada, formTurno.hora_salida) : null;
                      // Corregir fecha para horario chileno
                      const [year, month, day] = dia.fecha.split('-');
                      const fechaObj = new Date(year, month - 1, day);
                      const fechaFormateada = fechaObj.toLocaleDateString('es-CL', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      });
                      return (
                        <div key={index} className={`col-md-6 col-lg-4 mb-2`}>
                          <div className={`card ${infoConflicto ? 'border-danger' : 'border-warning'}`}>
                            <div className="card-body py-2">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <strong className={infoConflicto ? 'text-danger' : 'text-warning'}>
                                    <i className={`fas ${infoConflicto ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'} me-1`}></i>
                                    {fechaFormateada}
                                  </strong>
                                  <div className="small text-muted">
                                    {dia.turnos.length} turno{dia.turnos.length > 1 ? 's' : ''} asignado{dia.turnos.length > 1 ? 's' : ''}
                                  </div>
                                  {infoConflicto && (
                                    <div className="small text-danger mt-1">
                                      <i className="fas fa-times-circle me-1"></i>
                                      ⚠️ Conflicto de horarios detectado
                                    </div>
                                  )}
                                </div>
                                <div className="text-end">
                                  {dia.turnos.map((turno, turnoIndex) => (
                                    <div key={turnoIndex} className="small">
                                      <span className={`badge ${infoConflicto && turno._id === infoConflicto.turnoConflictivo._id ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                        {turno.hora_entrada} - {turno.hora_salida}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-muted">
                    <i className="fas fa-calendar-times fa-2x mb-2"></i>
                    <p className="mb-0">Este guardia no tiene turnos asignados en fechas futuras</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FORMULARIO UNIFICADO PARA ASIGNAR TAREAS */}
      <div className="card mt-4">
        <div className="card-body">
          <h5>🛠 Asignar Tareas</h5>
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label">👤 Guardia</label>
              <select
                className="form-select"
                name="id_guardia"
                value={formTarea.id_guardia}
                onChange={handleChangeTarea}
                required
              >
                <option value="">Selecciona un guardia</option>
                {guardias.map(g => (
                  <option key={g._id} value={g._id}>{g.nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">🏢 Local</label>
              <select
                className="form-select"
                name="id_local"
                value={formTarea.id_local}
                onChange={handleChangeTarea}
                required
              >
                <option value="">Selecciona un local</option>
                {locales.map(l => (
                  <option key={l._id} value={l._id}>{l.nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">📝 Descripción de la tarea</label>
              <input
                type="text"
                className="form-control"
                name="descripcion"
                value={formTarea.descripcion}
                onChange={handleChangeTarea}
                placeholder="Describe la tarea a realizar..."
                required
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">📅 Fecha</label>
              <select
                className="form-control"
                name="fecha"
                value={formTarea.fecha}
                onChange={handleChangeTarea}
                disabled={!formTarea.id_guardia || fechasDisponiblesTareas.length === 0}
                required
              >
                <option value="">
                  {!formTarea.id_guardia 
                    ? "Selecciona un guardia primero" 
                    : cargandoFechasTareas 
                      ? "Cargando fechas..." 
                      : fechasDisponiblesTareas.length === 0 
                        ? "Sin turnos asignados" 
                        : "Selecciona una fecha"
                  }
                </option>
                {fechasDisponiblesTareas.map(fecha => {
                  const [y, m, d] = fecha.split('-');
                  const fechaObj = new Date(y, m - 1, d);
                  const fechaFormateada = fechaObj.toLocaleDateString('es-CL', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                  return (
                    <option key={fecha} value={fecha}>
                      {fechaFormateada}
                    </option>
                  );
                })}
              </select>
              {formTarea.id_guardia && !cargandoFechasTareas && fechasDisponiblesTareas.length === 0 && (
                <div className="form-text text-warning">
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  ⚠️ Este guardia no tiene turnos asignados. No se le pueden asignar tareas.
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-3">
            <button 
              type="button" 
              className="btn btn-primary me-2" 
              onClick={agregarTareaALista}
            >
              <i className="fas fa-plus me-1"></i>
              ➕ Agregar a Lista
            </button>
            <button 
              type="button" 
              className="btn btn-success me-2" 
              onClick={enviarTodasLasTareas}
              disabled={tareasLista.length === 0}
            >
              <i className="fas fa-paper-plane me-1"></i>
              📤 Enviar Todas las Tareas ({tareasLista.length})
            </button>
            <button 
              type="button" 
              className="btn btn-warning" 
              onClick={() => {
                setTareasLista([]);
                setNotificacion({ tipo: 'info', mensaje: 'Lista de tareas limpiada' });
              }}
              disabled={tareasLista.length === 0}
            >
              <i className="fas fa-trash me-1"></i>
              🗑️ Limpiar Lista
            </button>
          </div>

          {/* Lista de tareas pendientes */}
          {tareasLista.length > 0 && (
            <div className="mt-3">
              <h6>📋 Tareas en lista ({tareasLista.length}):</h6>
              <div className="list-group">
                {tareasLista.map((tarea, index) => {
                  const guardia = guardias.find(g => g._id === tarea.id_guardia);
                  const local = locales.find(l => l._id === tarea.id_local);
                  return (
                    <div key={tarea.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{index + 1}.</strong> 
                        <span className="text-primary"> {guardia?.nombre}</span> - 
                        <span className="text-success"> {local?.nombre}</span> - 
                        <span className="text-dark"> {tarea.descripcion}</span>
                        {tarea.fecha && (() => { const [y,m,d]=tarea.fecha.split('-'); const f=new Date(y,m-1,d); return <span className="text-muted ms-2">({f.toLocaleDateString('es-CL',{weekday:'short',year:'numeric',month:'short',day:'numeric'})})</span> })()}
                      </div>
                      <button 
                        className="btn btn-sm btn-outline-danger" 
                        onClick={() => eliminarTareaDeLista(tarea.id)}
                        title="Eliminar tarea"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mostrar fechas disponibles para tareas del guardia seleccionado */}
      {formTarea.id_guardia && (
        <div className="card mt-3">
          <div className="card-body">
            <div className="alert alert-success">
              <h6 className="mb-2">
                <i className="fas fa-calendar-plus me-2"></i>
                📅 Fechas disponibles para asignar tareas a este guardia:
              </h6>
              {cargandoFechasTareas ? (
                <div className="text-center">
                  <div className="spinner-border spinner-border-sm text-success" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <span className="ms-2">Cargando fechas disponibles...</span>
                </div>
              ) : fechasDisponiblesTareas.length > 0 ? (
                <div className="row">
                  {fechasDisponiblesTareas.map((fecha, index) => {
                    const [y, m, d] = fecha.split('-');
                    const fechaObj = new Date(y, m - 1, d);
                    const fechaFormateada = fechaObj.toLocaleDateString('es-CL', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                    return (
                      <div key={index} className="col-md-6 col-lg-4 mb-2">
                        <div className="card border-success">
                          <div className="card-body py-2">
                            <div className="d-flex align-items-center">
                              <div>
                                <strong className="text-success">
                                  <i className="fas fa-check-circle me-1"></i>
                                  {fechaFormateada}
                                </strong>
                                <div className="small text-muted">
                                  Disponible para tareas
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted">
                  <i className="fas fa-calendar-times fa-2x mb-2"></i>
                  <p className="mb-0">Este guardia no tiene turnos asignados en fechas futuras</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gestión de Locales */}
      <VistaLocales usuario={usuario} />

      {/* Lista de tareas */}
      <div className="card mt-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">🛠 Tareas Asignadas ({tareasFiltradas.length})</h5>
        </div>
        <div className="card-body">
          {/* Filtros de tareas asignadas */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Filtrar por Guardia:</label>
              <select className="form-select" value={filtroTareaGuardia} onChange={e => setFiltroTareaGuardia(e.target.value)}>
                <option value="">Todos</option>
                {guardias.map(g => (
                  <option key={g._id} value={g._id}>{g.nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Filtrar por Local:</label>
              <select className="form-select" value={filtroTareaLocal} onChange={e => setFiltroTareaLocal(e.target.value)}>
                <option value="">Todos</option>
                {locales.map(l => (
                  <option key={l._id} value={l._id}>{l.nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Filtrar por Fecha:</label>
              <input
                type="date"
                className="form-control"
                value={filtroTareaFecha}
                onChange={e => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split('-');
                    const f = new Date(y, m - 1, d);
                    setFiltroTareaFecha(f.toLocaleDateString('es-CL'));
                  } else {
                    setFiltroTareaFecha('');
                  }
                }}
              />
            </div>
          </div>
          {tareasFiltradas.length > 0 ? (
            <div className="row">
              {tareasFiltradas.map((tarea, i) => (
                <div key={i} className="col-md-6 col-lg-4 mb-3">
                  <div className="card h-100 border-primary">
                    <div className="card-header bg-primary text-white">
                      <h6 className="mb-0">Tarea #{i + 1}</h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-2">
                        <strong>👤 Guardia:</strong> {tarea.nombre_guardia}
                      </div>
                      <div className="mb-2">
                        <strong>🏢 Local:</strong> {tarea.nombre_local}
                      </div>
                      <div className="mb-2">
                        <strong>📝 Descripción:</strong> {tarea.descripcion}
                      </div>
                      {tarea.fecha && (() => { const [y,m,d]=tarea.fecha.split('-'); const f=new Date(y,m-1,d); return (<div className="mb-2"><strong>📅 Fecha:</strong> {f.toLocaleDateString('es-CL')}</div>); })()}
                      {tarea.estado && (
                        <div className="mb-2">
                          <strong>Estado:</strong> 
                          <span className={`badge ms-2 ${
                            tarea.estado === 'completada' ? 'bg-success' : 
                            tarea.estado === 'en_progreso' ? 'bg-warning' : 'bg-secondary'
                          }`}>
                            {tarea.estado}
                          </span>
                        </div>
                      )}
                      {tarea.fecha_creacion && (
                        <div className="text-muted small">
                          <strong>Creada:</strong> {new Date(tarea.fecha_creacion).toLocaleString('es-ES')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted py-4">
              <i className="fas fa-tasks fa-3x mb-3"></i>
              <p>No hay tareas asignadas</p>
            </div>
          )}
        </div>
      </div>

      {/* Lista de turnos */}
      <div className="card mt-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">📅 Turnos Asignados ({turnosFiltrados.length})</h5>
        </div>
        <div className="card-body">
          {/* Filtros de turnos asignados */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Filtrar por Guardia:</label>
              <select className="form-select" value={filtroTurnoGuardia} onChange={e => setFiltroTurnoGuardia(e.target.value)}>
                <option value="">Todos</option>
                {guardias.map(g => (
                  <option key={g._id} value={g._id}>{g.nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Filtrar por Local:</label>
              <select className="form-select" value={filtroTurnoLocal} onChange={e => setFiltroTurnoLocal(e.target.value)}>
                <option value="">Todos</option>
                {locales.map(l => (
                  <option key={l._id} value={l._id}>{l.nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Filtrar por Fecha:</label>
              <input
                type="date"
                className="form-control"
                value={filtroTurnoFecha}
                onChange={e => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split('-');
                    const f = new Date(y, m - 1, d);
                    setFiltroTurnoFecha(f.toLocaleDateString('es-CL'));
                  } else {
                    setFiltroTurnoFecha('');
                  }
                }}
              />
            </div>
          </div>
          {turnosFiltrados.length > 0 ? (
            <div className="row">
              {turnosFiltrados.map((turno, i) => (
                <div key={i} className="col-md-6 col-lg-4 mb-3">
                  <div className="card h-100 border-success">
                    <div className="card-header bg-success text-white">
                      <h6 className="mb-0">Turno #{i + 1}</h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-2">
                        <strong>👤 Guardia:</strong> {turno.nombre_guardia}
                      </div>
                      <div className="mb-2">
                        <strong>🏢 Local:</strong> {turno.nombre_local}
                      </div>
                      <div className="mb-2">
                        <strong>📅 Fecha:</strong> {(() => { const [y,m,d]=turno.fecha.split('-'); const f=new Date(y,m-1,d); return f.toLocaleDateString('es-CL'); })()}
                      </div>
                      <div className="mb-2">
                        <strong>⏰ Horario:</strong>
                        <div className="ms-3">
                          <div>🟢 Entrada: {turno.hora_entrada}</div>
                          <div>🔴 Salida: {turno.hora_salida}</div>
                        </div>
                      </div>
                      {turno.duracion && (
                        <div className="mb-2">
                          <strong>⏱️ Duración:</strong> {turno.duracion} horas
                        </div>
                      )}
                      {turno.estado && (
                        <div className="mb-2">
                          <strong>Estado:</strong> 
                          <span className={`badge ms-2 ${
                            turno.estado === 'activo' ? 'bg-success' : 
                            turno.estado === 'pendiente' ? 'bg-warning' : 
                            turno.estado === 'completado' ? 'bg-info' : 'bg-secondary'
                          }`}>
                            {turno.estado}
                          </span>
                        </div>
                      )}
                      {turno.fecha_creacion && (
                        <div className="text-muted small">
                          <strong>Creado:</strong> {new Date(turno.fecha_creacion).toLocaleString('es-ES')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted py-4">
              <i className="fas fa-calendar-alt fa-3x mb-3"></i>
              <p>No hay turnos asignados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VistaSupervisor;

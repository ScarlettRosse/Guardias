import React, { useEffect, useState } from 'react';
import axios from 'axios';
import VistaLocales from './VistaLocales';

function VistaSupervisor({ usuario }) {
  // Listas y estado de la app
  const [tareas, setTareas] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [guardias, setGuardias] = useState([]);
  const [locales, setLocales] = useState([]);
  const [notificacion, setNotificacion] = useState({ tipo: '', mensaje: '' });

  // Estado del formulario
  const [form, setForm] = useState({
    id_guardia: '',
    id_local: '',
    fecha: '',
    hora_entrada: '',
    hora_salida: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    const headers = { Rol: usuario.rol, Usuario_Id: usuario.id };
    axios.get('http://localhost:5000/tareas', { headers })
      .then(res => setTareas(res.data));
    axios.get('http://localhost:5000/turnos', { headers })
      .then(res => setTurnos(res.data));
    axios.get('http://localhost:5000/usuarios/guardias', { headers })
      .then(res => setGuardias(res.data));
    axios.get('http://localhost:5000/locales', { headers })
      .then(res => setLocales(res.data));
  }, [usuario]);

  // Cerrar sesión
  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    window.location.reload();
  };

  // Manejar campos del formulario
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Manejar cambio de formulario
  // (las tareas se asignarán por separado)

  // Enviar formulario
  const handleSubmit = async e => {
    e.preventDefault();
    const headers = { Rol: usuario.rol, Usuario_Id: usuario.id };
    try {
      const datos = { ...form };
      await axios.post('http://localhost:5000/turnos/asignar', datos, { headers });
      setNotificacion({ tipo: 'success', mensaje: 'Turno asignado correctamente' });
      setForm({
        id_guardia: '',
        id_local: '',
        fecha: '',
        hora_entrada: '',
        hora_salida: ''
      });
      // Recargar turnos
      const res = await axios.get('http://localhost:5000/turnos', { headers });
      setTurnos(res.data);
    } catch (error) {
      let msg = error.response?.data?.error || 'Error al asignar turno';
      setNotificacion({ tipo: 'danger', mensaje: msg });
    }
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
        <h3>Panel del Supervisor - {usuario.nombre}</h3>
        <button className="btn btn-danger" onClick={cerrarSesion}>Cerrar sesión</button>
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
          <h5>Asignar Turno</h5>
          <form onSubmit={handleSubmit}>
            <div className="row g-2">
              <div className="col-md-3">
                <label className="form-label">Guardia</label>
                <select
                  className="form-select"
                  name="id_guardia"
                  value={form.id_guardia}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona</option>
                  {guardias.map(g => (
                    <option key={g._id} value={g._id}>{g.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Local</label>
                <select
                  className="form-select"
                  name="id_local"
                  value={form.id_local}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona</option>
                  {locales.map(l => (
                    <option key={l._id} value={l._id}>{l.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="form-control"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Hora Entrada</label>
                <input
                  type="time"
                  className="form-control"
                  name="hora_entrada"
                  value={form.hora_entrada}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Hora Salida</label>
                <input
                  type="time"
                  className="form-control"
                  name="hora_salida"
                  value={form.hora_salida}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>



            <button type="submit" className="btn btn-success mt-2">Asignar Turno</button>
          </form>
        </div>
      </div>

      {/* Gestión de Locales */}
      <VistaLocales usuario={usuario} />

      {/* Lista de tareas */}
      <h5 className="mt-4">🛠 Tareas</h5>
      <ul className="list-group">
        {tareas.length > 0 ? (
          tareas.map((t, i) => (
            <li key={i} className="list-group-item">
              Guardia: {t.nombre_guardia} - Tarea: {t.descripcion}
            </li>
          ))
        ) : (
          <li className="list-group-item text-muted">No hay tareas asignadas</li>
        )}
      </ul>

      {/* Lista de turnos */}
      <h5 className="mt-4">📅 Turnos</h5>
      <ul className="list-group">
        {turnos.length > 0 ? (
          turnos.map((t, i) => (
            <li key={i} className="list-group-item">
              Guardia: {t.nombre_guardia} - Local: {t.local || t.id_local} - Fecha: {t.fecha}
            </li>
          ))
        ) : (
          <li className="list-group-item text-muted">No hay turnos asignados</li>
        )}
      </ul>
    </div>
  );
}

export default VistaSupervisor;

import React, { useEffect, useState } from 'react';
import axios from 'axios';

function VistaGuardia({ usuario }) {
  const [turnos, setTurnos] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [turnoActual, setTurnoActual] = useState(null);
  const [turnoActualError, setTurnoActualError] = useState('');

  useEffect(() => {
    // Depuración: revisa el usuario recibido
    console.log('Usuario recibido en VistaGuardia:', usuario);

    // Solo ejecuta si usuario existe y tiene id
    if (!usuario || !usuario.id) {
      console.log("Usuario aún no cargado o no tiene id");
      return;
    }

    const headers = {
      Rol: usuario.rol,
      Usuario_Id: usuario.id
    };

    console.log('Headers a enviar:', headers);

    // Turnos asignados
    axios.get('http://localhost:5000/turnos/mis-turnos', { headers })
      .then(res => setTurnos(res.data))
      .catch(err => {
        console.error('Error obteniendo mis-turnos:', err);
      });

    // Turno actual
    axios.get('http://localhost:5000/turnos/mi-turno-actual', { headers })
      .then(res => {
        setTurnoActual(res.data);
        setTurnoActualError('');
      })
      .catch(err => {
        setTurnoActual(null);
        setTurnoActualError(
          err.response?.data?.mensaje ||
          "No se pudo obtener tu turno actual."
        );
      });

  }, [usuario]);

  const enviarReporte = () => {
    if (!usuario || !usuario.id) {
      alert("Usuario no definido");
      return;
    }
    const headers = {
      Rol: usuario.rol,
      Usuario_Id: usuario.id
    };
    axios.post('http://localhost:5000/reportes/enviar', {
      descripcion,
      fecha: new Date().toISOString()
    }, { headers })
      .then(() => {
        alert('Reporte enviado');
        setDescripcion('');
      });
  };

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    window.location.reload();
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center">
        <h3>Bienvenido, {usuario?.nombre || 'Sin nombre'}</h3>
        <button className="btn btn-danger" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>

      {/* --- Tarjeta de turno actual --- */}
      <div className="mt-4 mb-4">
        <div className="card shadow">
          <div className="card-body">
            <h5 className="card-title">Mi turno actual</h5>
            {turnoActualError ? (
              <div className="alert alert-warning mb-0">{turnoActualError}</div>
            ) : turnoActual ? (
              <>
                <p><strong>Lugar:</strong> {turnoActual.local.nombre}</p>
                <p><strong>Dirección:</strong> {turnoActual.local.direccion}</p>
                <p><strong>Fecha:</strong> {turnoActual.turno.fecha}</p>
                <p>
                  <strong>Horario:</strong> {turnoActual.turno.hora_entrada} - {turnoActual.turno.hora_salida}
                </p>
                {/* Mostrar tareas del turno actual */}
                {turnoActual.turno.tareas && turnoActual.turno.tareas.length > 0 && (
                  <div>
                    <b>Tareas:</b>
                    <ul>
                      {turnoActual.turno.tareas.map((tarea, idx) => (
                        <li key={idx}>{tarea}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <span className="spinner-border spinner-border-sm"></span>
            )}
          </div>
        </div>
      </div>

      {/* --- Lista de todos los turnos --- */}
      <h4 className="mt-4">Mis turnos</h4>
      <ul className="list-group">
        {turnos.length === 0 && (
          <li className="list-group-item">No tienes turnos asignados.</li>
        )}
        {turnos.map((t, i) => (
          <li key={i} className="list-group-item">
            <div>
              Local: {t.local ? t.local : t.id_local} <br />
              Fecha: {t.fecha} <br />
              Horario: {t.hora_entrada} a {t.hora_salida}
            </div>
            {/* Mostrar tareas si existen */}
            {t.tareas && t.tareas.length > 0 && (
              <div className="mt-2">
                <b>Tareas:</b>
                <ul className="mb-0">
                  {t.tareas.map((tarea, idx) => (
                    <li key={idx}>{tarea}</li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* --- Reporte de incidentes --- */}
      <h4 className="mt-4">Enviar reporte</h4>
      <textarea
        className="form-control"
        value={descripcion}
        onChange={e => setDescripcion(e.target.value)}
      />
      <button className="btn btn-success mt-2" onClick={enviarReporte}>
        Enviar
      </button>
    </div>
  );
}

export default VistaGuardia;

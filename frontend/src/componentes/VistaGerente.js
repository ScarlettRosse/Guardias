import React, { useEffect, useState } from 'react';
import axios from 'axios';

function VistaGerente({ usuario }) {
  const [reportes, setReportes] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [turnos, setTurnos] = useState([]);

  useEffect(() => {
    const headers = { Rol: usuario.rol };

    axios.get('http://localhost:5000/reportes', { headers }).then(res => setReportes(res.data));
    axios.get('http://localhost:5000/tareas', { headers }).then(res => setTareas(res.data));
    axios.get('http://localhost:5000/turnos', { headers }).then(res => setTurnos(res.data));
  }, [usuario]);

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    window.location.reload();
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <h3>Panel del Gerente - {usuario.nombre}</h3>
        <button className="btn btn-danger" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>

      <h5 className="mt-4">📋 Reportes</h5>
      <ul className="list-group">
        {reportes.map((r, i) => (
          <li key={i} className="list-group-item">
            Guardia: {r.nombre_guardia} - Fecha: {r.fecha}<br />
            {r.descripcion}
          </li>
        ))}
      </ul>

      <h5 className="mt-4">🛠 Tareas</h5>
      <ul className="list-group">
        {tareas.map((t, i) => (
          <li key={i} className="list-group-item">
            Guardia: {t.nombre_guardia} - Tarea: {t.descripcion}
          </li>
        ))}
      </ul>

      <h5 className="mt-4">📅 Turnos</h5>
      <ul className="list-group">
        {turnos.map((t, i) => (
          <li key={i} className="list-group-item">
            Guardia: {t.nombre_guardia} - Local: {t.local} - Fecha: {t.fecha}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default VistaGerente;

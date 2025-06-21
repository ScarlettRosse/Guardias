import React, { useEffect, useState } from 'react';
import axios from 'axios';
import VistaLocales from './VistaLocales';

function VistaGerente({ usuario }) {
  // Estados para otros módulos, si deseas mostrar info adicional
  const [guardias, setGuardias] = useState([]);
  const [turnos, setTurnos] = useState([]);

  useEffect(() => {
    const headers = { Rol: usuario.rol, Usuario_Id: usuario.id };
    axios.get('http://localhost:5000/usuarios/guardias', { headers })
      .then(res => setGuardias(res.data));
    axios.get('http://localhost:5000/turnos', { headers })
      .then(res => setTurnos(res.data));
  }, [usuario]);

  // Cerrar sesión
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

      {/* Gestión de Locales */}
      <VistaLocales usuario={usuario} />

      {/* Lista de Guardias */}
      <h5 className="mt-4">👮‍♂️ Guardias</h5>
      <ul className="list-group">
        {guardias.length > 0 ? (
          guardias.map((g, i) => (
            <li key={i} className="list-group-item">
              {g.nombre} - {g.rut}
            </li>
          ))
        ) : (
          <li className="list-group-item text-muted">No hay guardias registrados</li>
        )}
      </ul>

      {/* Lista de Turnos */}
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

export default VistaGerente;

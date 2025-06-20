import React, { useEffect, useState } from 'react';
import axios from 'axios';

function VistaGuardia({ usuario }) {
  const [turnos, setTurnos] = useState([]);
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/turnos/mis-turnos', {
      headers: {
        Rol: usuario.rol,
        Usuario_Id: usuario.id
      }
    }).then(res => setTurnos(res.data));
  }, [usuario]);

  const enviarReporte = () => {
    axios.post('http://localhost:5000/reportes/enviar', {
      descripcion,
      fecha: new Date().toISOString()
    }, {
      headers: {
        Rol: usuario.rol,
        Usuario_Id: usuario.id
      }
    }).then(() => {
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
        <h3>Bienvenido, {usuario.nombre}</h3>
        <button className="btn btn-danger" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>

      <h4 className="mt-4">Mis turnos</h4>
      <ul className="list-group">
        {turnos.map((t, i) => (
          <li key={i} className="list-group-item">
            Local: {t.local} - Fecha: {t.fecha}
          </li>
        ))}
      </ul>

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

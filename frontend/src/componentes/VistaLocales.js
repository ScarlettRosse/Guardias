import React, { useEffect, useState } from 'react';
import axios from 'axios';

function VistaLocales({ usuario }) {
  const [locales, setLocales] = useState([]);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [editando, setEditando] = useState(null);
  const [nombreEdit, setNombreEdit] = useState('');
  const [direccionEdit, setDireccionEdit] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Cargar locales al montar el componente o cuando cambia el usuario
  useEffect(() => {
    cargarLocales();
    // eslint-disable-next-line
  }, [usuario]);

  const cargarLocales = () => {
    axios.get('http://localhost:5000/locales', {
      headers: { Rol: usuario.rol, Usuario_Id: usuario.id }
    })
    .then(res => setLocales(res.data))
    .catch(() => setLocales([]));
  };

  // Agregar local
  const agregarLocal = () => {
    if (!nombre.trim() || !direccion.trim()) {
      setMensaje('Completa todos los campos');
      return;
    }
    axios.post('http://localhost:5000/locales', {
      nombre,
      direccion
    }, {
      headers: { Rol: usuario.rol, Usuario_Id: usuario.id }
    }).then(() => {
      setNombre('');
      setDireccion('');
      setMensaje('Local agregado correctamente');
      cargarLocales();
    }).catch(err => {
      setMensaje(err.response?.data?.error || 'Error al agregar local');
    });
  };

  // Iniciar edición
  const iniciarEdicion = (local) => {
    setEditando(local._id);
    setNombreEdit(local.nombre);
    setDireccionEdit(local.direccion);
    setMensaje('');
  };

  // Guardar edición
  const guardarEdicion = (id) => {
    if (!nombreEdit.trim() || !direccionEdit.trim()) {
      setMensaje('Completa todos los campos');
      return;
    }
    axios.put(`http://localhost:5000/locales/${id}`, {
      nombre: nombreEdit,
      direccion: direccionEdit
    }, {
      headers: { Rol: usuario.rol, Usuario_Id: usuario.id }
    }).then(() => {
      setEditando(null);
      setMensaje('Local actualizado correctamente');
      cargarLocales();
    }).catch(err => {
      setMensaje(err.response?.data?.error || 'Error al editar local');
    });
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setEditando(null);
    setMensaje('');
  };

  // Eliminar local
  const eliminarLocal = (id) => {
    if (window.confirm('¿Eliminar este local?')) {
      axios.delete(`http://localhost:5000/locales/${id}`, {
        headers: { Rol: usuario.rol, Usuario_Id: usuario.id }
      }).then(() => {
        setMensaje('Local eliminado');
        cargarLocales();
      }).catch(err => {
        setMensaje(err.response?.data?.error || 'Error al eliminar local');
      });
    }
  };

  // Limpiar mensaje tras unos segundos
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(''), 2500);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h5 className="card-title">Gestión de Locales</h5>
        {mensaje && (
          <div className="alert alert-info py-1" role="alert">{mensaje}</div>
        )}
        <ul className="list-group mb-3">
          {locales.map(local => (
            <li key={local._id} className="list-group-item d-flex justify-content-between align-items-center">
              {editando === local._id ? (
                <div className="w-100 d-flex align-items-center">
                  <input
                    className="form-control me-2"
                    value={nombreEdit}
                    onChange={e => setNombreEdit(e.target.value)}
                    placeholder="Nombre"
                  />
                  <input
                    className="form-control me-2"
                    value={direccionEdit}
                    onChange={e => setDireccionEdit(e.target.value)}
                    placeholder="Dirección"
                  />
                  <button className="btn btn-success btn-sm me-1" onClick={() => guardarEdicion(local._id)}>Guardar</button>
                  <button className="btn btn-secondary btn-sm" onClick={cancelarEdicion}>Cancelar</button>
                </div>
              ) : (
                <>
                  <span>
                    <b>{local.nombre}</b> - {local.direccion}
                  </span>
                  {usuario.rol === "supervisor" && (
                    <span>
                      <button className="btn btn-primary btn-sm me-1" onClick={() => iniciarEdicion(local)}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => eliminarLocal(local._id)}>Eliminar</button>
                    </span>
                  )}
                </>
              )}
            </li>
          ))}
          {locales.length === 0 && (
            <li className="list-group-item text-muted">No hay locales registrados</li>
          )}
        </ul>
        {/* Solo para el supervisor: formulario agregar */}
        {usuario.rol === "supervisor" && (
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Nombre del local"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Dirección"
              value={direccion}
              onChange={e => setDireccion(e.target.value)}
            />
            <button className="btn btn-success" onClick={agregarLocal}>Agregar</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VistaLocales;

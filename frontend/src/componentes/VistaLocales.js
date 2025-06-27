import React, { useEffect, useState } from 'react';
import API from '../servicios/api';

function VistaLocales({ usuario }) {
  const [locales, setLocales] = useState([]);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [editando, setEditando] = useState(null);
  const [nombreEdit, setNombreEdit] = useState('');
  const [direccionEdit, setDireccionEdit] = useState('');
  const [telefonoEdit, setTelefonoEdit] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Función de prueba para verificar conexión
  const probarConexion = () => {
    console.log('=== PRUEBA DE CONEXIÓN ===');
    console.log('Usuario actual:', usuario);
    console.log('Rol del usuario:', usuario?.rol);
    console.log('ID del usuario:', usuario?.id);
    
    // Probar GET de locales
    API.get('/locales')
      .then(res => {
        console.log('✅ GET locales exitoso:', res.data);
      })
      .catch(err => {
        console.error('❌ Error en GET locales:', err);
      });
  };

  // Cargar locales al montar el componente o cuando cambia el usuario
  useEffect(() => {
    cargarLocales();
    // eslint-disable-next-line
  }, [usuario]);

  const cargarLocales = () => {
    API.get('/locales')
    .then(res => setLocales(res.data))
    .catch(() => setLocales([]));
  };

  // Agregar local
  const agregarLocal = () => {
    if (!nombre.trim() || !direccion.trim() || !telefono.trim()) {
      setMensaje('Completa todos los campos');
      return;
    }
    
    console.log('Intentando agregar local:', { nombre, direccion, telefono });
    
    API.post('/locales', {
      nombre,
      direccion,
      telefono
    }).then(() => {
      setNombre('');
      setDireccion('');
      setTelefono('');
      setMensaje('Local agregado correctamente');
      cargarLocales();
    }).catch(err => {
      console.error('Error al agregar local:', err);
      console.error('Response data:', err.response?.data);
      console.error('Response status:', err.response?.status);
      
      let errorMsg = 'Error al agregar local';
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.mensaje) {
        errorMsg = err.response.data.mensaje;
      } else if (err.response?.status === 403) {
        errorMsg = 'No tienes permisos para agregar locales';
      } else if (err.response?.status === 400) {
        errorMsg = 'Datos inválidos';
      }
      
      setMensaje(errorMsg);
    });
  };

  // Iniciar edición
  const iniciarEdicion = (local) => {
    setEditando(local._id);
    setNombreEdit(local.nombre);
    setDireccionEdit(local.direccion);
    setTelefonoEdit(local.telefono || '');
    setMensaje('');
  };

  // Guardar edición
  const guardarEdicion = (id) => {
    if (!nombreEdit.trim() || !direccionEdit.trim() || !telefonoEdit.trim()) {
      setMensaje('Completa todos los campos');
      return;
    }
    API.put(`/locales/${id}`, {
      nombre: nombreEdit,
      direccion: direccionEdit,
      telefono: telefonoEdit
    }).then(() => {
      setEditando(null);
      setMensaje('Local actualizado correctamente');
      cargarLocales();
    }).catch(err => {
      console.error('Error al editar local:', err);
      let errorMsg = 'Error al editar local';
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.mensaje) {
        errorMsg = err.response.data.mensaje;
      } else if (err.response?.status === 403) {
        errorMsg = 'No tienes permisos para editar locales';
      }
      setMensaje(errorMsg);
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
      API.delete(`/locales/${id}`).then(() => {
        setMensaje('Local eliminado');
        cargarLocales();
      }).catch(err => {
        console.error('Error al eliminar local:', err);
        let errorMsg = 'Error al eliminar local';
        if (err.response?.data?.error) {
          errorMsg = err.response.data.error;
        } else if (err.response?.data?.mensaje) {
          errorMsg = err.response.data.mensaje;
        } else if (err.response?.status === 403) {
          errorMsg = 'No tienes permisos para eliminar locales';
        }
        setMensaje(errorMsg);
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
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">Gestión de Locales</h5>
        </div>
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
                  <input
                    className="form-control me-2"
                    value={telefonoEdit}
                    onChange={e => setTelefonoEdit(e.target.value)}
                    placeholder="Teléfono"
                  />
                  <button className="btn btn-success btn-sm me-1" onClick={() => guardarEdicion(local._id)}>Guardar</button>
                  <button className="btn btn-secondary btn-sm" onClick={cancelarEdicion}>Cancelar</button>
                </div>
              ) : (
                <>
                  <span>
                    <b>{local.nombre}</b> - {local.direccion} <span className="text-muted">({local.telefono || 'Sin teléfono'})</span>
                  </span>
                  {usuario.rol === "supervisor" || usuario.rol === "gerente" ? (
                    <span>
                      <button className="btn btn-primary btn-sm me-1" onClick={() => iniciarEdicion(local)}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => eliminarLocal(local._id)}>Eliminar</button>
                    </span>
                  ) : null}
                </>
              )}
            </li>
          ))}
          {locales.length === 0 && (
            <li className="list-group-item text-muted">No hay locales registrados</li>
          )}
        </ul>
        {/* Solo para el supervisor y gerente: formulario agregar */}
        {(usuario.rol === "supervisor" || usuario.rol === "gerente") && (
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
            <input
              type="text"
              className="form-control"
              placeholder="Teléfono"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
            />
            <button className="btn btn-success" onClick={agregarLocal}>Agregar</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VistaLocales;

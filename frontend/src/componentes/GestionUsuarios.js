import React, { useState, useEffect } from 'react';
import API from '../servicios/api';

function GestionUsuarios({ usuario }) {
  // Estados para datos
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ tipo: '', mensaje: '' });
  
  // Estados para formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoUsuario, setEditandoUsuario] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rut: '',
    rol: 'guardia',
    telefono: '',
    direccion: ''
  });

  // Estados para filtros
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);

  // Cargar usuarios
  const cargarUsuarios = async () => {
    setCargando(true);
    
    try {
      const response = await API.get('/usuarios/todos');
      setUsuarios(response.data);
      setUsuariosFiltrados(response.data);
    } catch (error) {
      setNotificacion({ tipo: 'danger', mensaje: 'Error al cargar usuarios' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, [usuario]);

  // Filtrar usuarios
  const filtrarUsuarios = () => {
    let filtrados = usuarios;

    if (filtroRol) {
      filtrados = filtrados.filter(user => user.rol === filtroRol);
    }

    if (filtroNombre) {
      filtrados = filtrados.filter(user => 
        user.nombre && user.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
      );
    }

    setUsuariosFiltrados(filtrados);
  };

  useEffect(() => {
    filtrarUsuarios();
  }, [filtroRol, filtroNombre, usuarios]);

  // Limpiar formulario
  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rut: '',
      rol: 'guardia',
      telefono: '',
      direccion: ''
    });
    setEditandoUsuario(null);
  };

  // Abrir formulario para crear
  const abrirFormularioCrear = () => {
    limpiarFormulario();
    setMostrarFormulario(true);
  };

  // Abrir formulario para editar
  const abrirFormularioEditar = (usuario) => {
    setFormData({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      password: '',
      rut: usuario.rut || '',
      rol: usuario.rol || 'guardia',
      telefono: usuario.telefono || '',
      direccion: usuario.direccion || ''
    });
    setEditandoUsuario(usuario);
    setMostrarFormulario(true);
  };

  // Cerrar formulario
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    limpiarFormulario();
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Crear o editar usuario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editandoUsuario) {
        await API.put(`/usuarios/${editandoUsuario._id}`, formData);
        setNotificacion({ tipo: 'success', mensaje: 'Usuario actualizado' });
      } else {
        await API.post('/usuarios', formData);
        setNotificacion({ tipo: 'success', mensaje: 'Usuario creado' });
      }
      cargarUsuarios();
      cerrarFormulario();
    } catch (error) {
      setNotificacion({ tipo: 'danger', mensaje: 'Error al guardar usuario' });
    }
  };

  // Eliminar usuario
  const eliminarUsuario = async (usuarioId, nombreUsuario) => {
    if (!window.confirm(`¿Eliminar usuario "${nombreUsuario}"?`)) return;
    try {
      await API.delete(`/usuarios/${usuarioId}`);
      setNotificacion({ tipo: 'success', mensaje: 'Usuario eliminado' });
      cargarUsuarios();
    } catch (error) {
      setNotificacion({ tipo: 'danger', mensaje: 'Error al eliminar usuario' });
    }
  };

  // Limpiar notificación automática
  useEffect(() => {
    if (notificacion.mensaje) {
      const timer = setTimeout(() => setNotificacion({ tipo: '', mensaje: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [notificacion]);

  // Nombres personalizados para los roles
  const nombresRol = {
    gerente: "Gerente",
    supervisor: "Supervisor",
    guardia: "Guardia"
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Gestión de Usuarios</h5>
          <div>
            <button className="btn btn-primary btn-sm" onClick={abrirFormularioCrear}>
              Nuevo Usuario
            </button>
          </div>
        </div>
        
        <div className="card-body">
          {notificacion.mensaje && (
            <div className={`alert alert-${notificacion.tipo} mb-3`}>
              {notificacion.mensaje}
            </div>
          )}

          {mostrarFormulario && (
            <div className="mb-4 p-3 border rounded bg-light">
              <h6>{editandoUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</h6>
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-2">
                    <input name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Nombre" className="form-control" required />
                  </div>
                  <div className="col-md-6 mb-2">
                    <input name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" type="email" className="form-control" required />
                  </div>
                  <div className="col-md-6 mb-2">
                    <input name="password" value={formData.password} onChange={handleInputChange} placeholder="Contraseña" type="password" className="form-control" required={!editandoUsuario} />
                  </div>
                  <div className="col-md-6 mb-2">
                    <input name="rut" value={formData.rut} onChange={handleInputChange} placeholder="RUT" className="form-control" />
                  </div>
                  <div className="col-md-6 mb-2">
                    <select name="rol" value={formData.rol} onChange={handleInputChange} className="form-select">
                      <option value="guardia">Guardia</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="gerente">Gerente</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-2">
                    <input name="telefono" value={formData.telefono} onChange={handleInputChange} placeholder="Teléfono" className="form-control" />
                  </div>
                  <div className="col-12 mb-2">
                    <input name="direccion" value={formData.direccion} onChange={handleInputChange} placeholder="Dirección" className="form-control" />
                  </div>
                </div>
                <div className="mt-2">
                  <button type="submit" className="btn btn-primary btn-sm me-2">{editandoUsuario ? 'Guardar' : 'Crear'}</button>
                  <button type="button" onClick={cerrarFormulario} className="btn btn-secondary btn-sm">Cancelar</button>
                </div>
              </form>
            </div>
          )}

          <div className="table-responsive">
            <table className="table table-sm">
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-muted">No hay usuarios registrados</td></tr>
                ) : (
                  usuarios.map(user => (
                    <tr key={user._id}>
                      <td>{user.nombre}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={
                          user.rol === "gerente" ? "badge bg-primary" :
                          user.rol === "supervisor" ? "badge bg-dark" :
                          user.rol === "guardia" ? "badge bg-success" :
                          "badge bg-secondary"
                        }>
                          {nombresRol[user.rol] || user.rol}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => abrirFormularioEditar(user)} className="btn btn-outline-primary btn-sm me-1">Editar</button>
                        <button onClick={() => eliminarUsuario(user._id, user.nombre)} className="btn btn-outline-danger btn-sm">Eliminar</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GestionUsuarios; 
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import VistaLocales from './VistaLocales';
import GestionUsuarios from './GestionUsuarios';
import API from '../servicios/api';

function VistaGerente({ usuario }) {
  // Estados para datos
  const [guardias, setGuardias] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [notificacion, setNotificacion] = useState({ tipo: '', mensaje: '' });
  const [cargando, setCargando] = useState(true);

  // Estados para filtros
  const [filtroGuardias, setFiltroGuardias] = useState('');
  const [filtroIncidencias, setFiltroIncidencias] = useState({
    local: '',
    guardia: '',
    fecha: '',
    categoria: '',
    cantidad: 10
  });
  const [locales, setLocales] = useState([]);
  const [categorias, setCategorias] = useState([]);

  // Función para cargar todos los datos
  const cargarDatos = async () => {
    setCargando(true);
    const headers = { Rol: usuario.rol, Usuario_Id: usuario.id };
    
    try {
      const [guardiasRes, supervisoresRes, turnosRes, tareasRes, reportesRes, localesRes] = await Promise.allSettled([
        axios.get('http://localhost:5000/usuarios/guardias', { headers }),
        axios.get('http://localhost:5000/usuarios/supervisores', { headers }),
        axios.get('http://localhost:5000/turnos', { headers }),
        axios.get('http://localhost:5000/tareas', { headers }),
        API.get('/reportes'),
        API.get('/locales')
      ]);

      if (guardiasRes.status === 'fulfilled') setGuardias(guardiasRes.value.data);
      if (supervisoresRes.status === 'fulfilled') setSupervisores(supervisoresRes.value.data);
      if (turnosRes.status === 'fulfilled') setTurnos(turnosRes.value.data);
      if (tareasRes.status === 'fulfilled') setTareas(tareasRes.value.data);
      if (reportesRes.status === 'fulfilled') {
        setReportes(reportesRes.value.data);
        // Extraer categorías únicas
        const categoriasUnicas = [...new Set(reportesRes.value.data.map(r => r.categoria).filter(Boolean))];
        setCategorias(categoriasUnicas);
      }
      if (localesRes.status === 'fulfilled') setLocales(localesRes.value.data);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      setNotificacion({ tipo: 'danger', mensaje: 'Error al cargar los datos' });
    } finally {
      setCargando(false);
    }
  };

  // Función para filtrar guardias por nombre
  const guardiasFiltrados = guardias.filter(guardia =>
    guardia.nombre.toLowerCase().includes(filtroGuardias.toLowerCase()) ||
    guardia.rut.toLowerCase().includes(filtroGuardias.toLowerCase()) ||
    guardia.email.toLowerCase().includes(filtroGuardias.toLowerCase())
  );

  // Función para filtrar incidencias
  const incidenciasFiltradas = reportes.filter(reporte => {
    const cumpleLocal = !filtroIncidencias.local || 
      reporte.nombre_local?.toLowerCase().includes(filtroIncidencias.local.toLowerCase());
    
    const cumpleGuardia = !filtroIncidencias.guardia || 
      reporte.nombre_guardia?.toLowerCase().includes(filtroIncidencias.guardia.toLowerCase());
    
    const cumpleCategoria = !filtroIncidencias.categoria || 
      reporte.categoria === filtroIncidencias.categoria;
    
    const cumpleFecha = !filtroIncidencias.fecha || 
      (() => {
        if (!reporte.fecha) return true;
        let fechaValida = null;
        // Si es formato YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(reporte.fecha)) {
          const [y, m, d] = reporte.fecha.split('-');
          fechaValida = new Date(y, m - 1, d);
        } else {
          // Intentar parsear como ISO u otro formato
          fechaValida = new Date(reporte.fecha);
        }
        return (!isNaN(fechaValida) && fechaValida.getFullYear() > 1970)
          ? fechaValida.toLocaleDateString('es-CL')
          : 'Sin fecha';
      })() === filtroIncidencias.fecha;
    
    return cumpleLocal && cumpleGuardia && cumpleCategoria && cumpleFecha;
  }).slice(0, filtroIncidencias.cantidad);

  // Función para limpiar filtros de incidencias
  const limpiarFiltrosIncidencias = () => {
    setFiltroIncidencias({
      local: '',
      guardia: '',
      fecha: '',
      categoria: '',
      cantidad: 10
    });
  };

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  // Cerrar sesión
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
        <h3>Panel del Gerente - {usuario?.nombre || 'Sin nombre'}</h3>
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

      {/* Resumen de estadísticas */}
      <div className="row mt-4">
        <div className="col-md-3 mb-3">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <h4>{guardias.length}</h4>
              <p className="mb-0">👮‍♂️ Guardias</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card bg-warning text-dark">
            <div className="card-body text-center">
              <h4>{supervisores.length}</h4>
              <p className="mb-0">👨‍💼 Supervisores</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <h4>{turnos.length}</h4>
              <p className="mb-0">📅 Turnos</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card bg-info text-white">
            <div className="card-body text-center">
              <h4>{tareas.length}</h4>
              <p className="mb-0">🛠 Tareas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gestión de Locales */}
      <VistaLocales usuario={usuario} />

      {/* Gestión de Usuarios */}
      <GestionUsuarios usuario={usuario} />

      {/* Lista de Guardias */}
      <div className="card mt-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">👮‍♂️ Guardias Registrados ({guardiasFiltrados.length})</h5>
        </div>
        <div className="card-body">
          {/* Filtro de búsqueda */}
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre, RUT o email..."
                value={filtroGuardias}
                onChange={(e) => setFiltroGuardias(e.target.value)}
              />
              {filtroGuardias && (
                <button 
                  className="btn btn-outline-secondary" 
                  onClick={() => setFiltroGuardias('')}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {cargando ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : guardiasFiltrados.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="fas fa-users fa-3x mb-3"></i>
              <p>{filtroGuardias ? 'No se encontraron guardias con ese criterio' : 'No hay guardias registrados'}</p>
            </div>
          ) : (
            <div className="row">
              {guardiasFiltrados.map((guardia, i) => (
                <div key={i} className="col-md-6 col-lg-4 mb-3">
                  <div className="card h-100 border-primary">
                    <div className="card-body">
                      <h6 className="card-title">
                        <i className="fas fa-user me-2"></i>
                        {guardia.nombre}
                      </h6>
                      <p className="card-text">
                        <strong>RUT:</strong> {guardia.rut}<br/>
                        <strong>Email:</strong> {guardia.email}<br/>
                        <strong>Rol:</strong> {guardia.rol}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lista de Incidencias */}
      <div className="card mt-4">
        <div className="card-header bg-danger text-white">
          <h5 className="mb-0">🚨 Incidencias Registradas ({incidenciasFiltradas.length})</h5>
        </div>
        <div className="card-body">
          {/* Filtros de incidencias */}
          <div className="row mb-3">
            <div className="col-md-2">
              <label className="form-label">Local:</label>
              <select 
                className="form-select"
                value={filtroIncidencias.local}
                onChange={(e) => setFiltroIncidencias({...filtroIncidencias, local: e.target.value})}
              >
                <option value="">Todos los locales</option>
                {locales.map(local => (
                  <option key={local._id} value={local.nombre}>{local.nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Guardia:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar guardia..."
                value={filtroIncidencias.guardia}
                onChange={(e) => setFiltroIncidencias({...filtroIncidencias, guardia: e.target.value})}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Fecha:</label>
              <input
                type="date"
                className="form-control"
                value={filtroIncidencias.fecha}
                onChange={(e) => setFiltroIncidencias({...filtroIncidencias, fecha: e.target.value})}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Categoría:</label>
              <select 
                className="form-select"
                value={filtroIncidencias.categoria}
                onChange={(e) => setFiltroIncidencias({...filtroIncidencias, categoria: e.target.value})}
              >
                <option value="">Todas las categorías</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Cantidad:</label>
              <select 
                className="form-select"
                value={filtroIncidencias.cantidad}
                onChange={(e) => setFiltroIncidencias({...filtroIncidencias, cantidad: parseInt(e.target.value)})}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button 
                className="btn btn-outline-secondary w-100"
                onClick={limpiarFiltrosIncidencias}
              >
                <i className="fas fa-times me-1"></i>
                Limpiar
              </button>
            </div>
          </div>

          {cargando ? (
            <div className="text-center">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : incidenciasFiltradas.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="fas fa-exclamation-triangle fa-3x mb-3"></i>
              <p>No hay incidencias que coincidan con los filtros</p>
            </div>
          ) : (
            <div className="row">
              {incidenciasFiltradas.map((reporte, i) => (
                <div key={reporte._id || i} className="col-md-6 col-lg-4 mb-3">
                  <div className="card h-100 border-danger">
                    <div className="card-header bg-danger text-white">
                      <h6 className="mb-0">Incidencia #{i + 1}</h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-2">
                        <strong>👤 Guardia:</strong> {reporte.nombre_guardia}
                      </div>
                      <div className="mb-2">
                        <strong>🏢 Local:</strong> {reporte.nombre_local}
                      </div>
                      <div className="mb-2">
                        <strong>📅 Fecha:</strong> {(() => {
                          if (!reporte.fecha) return 'Sin fecha';
                          let fechaValida = null;
                          // Si es formato YYYY-MM-DD
                          if (/^\d{4}-\d{2}-\d{2}$/.test(reporte.fecha)) {
                            const [y, m, d] = reporte.fecha.split('-');
                            fechaValida = new Date(y, m - 1, d);
                          } else {
                            // Intentar parsear como ISO u otro formato
                            fechaValida = new Date(reporte.fecha);
                          }
                          return (!isNaN(fechaValida) && fechaValida.getFullYear() > 1970)
                            ? fechaValida.toLocaleDateString('es-CL')
                            : 'Sin fecha';
                        })()}
                      </div>
                      <div className="mb-2">
                        <strong>📝 Categoría:</strong> {reporte.categoria}
                      </div>
                      <div className="mb-2">
                        <strong>Descripción:</strong> {reporte.descripcion}
                      </div>
                      {reporte.fecha_creacion && (
                        <div className="text-muted small">
                          <strong>Creada:</strong> {new Date(reporte.fecha_creacion).toLocaleString('es-ES')}
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
    </div>
  );
}

export default VistaGerente;

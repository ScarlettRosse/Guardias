import React, { useState } from 'react';
import axios from 'axios';

function Login({ setUsuario }) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');

  const manejarLogin = (e) => {
    e.preventDefault();

    axios.post('http://localhost:5000/inicio-sesion', {
      correo, contrasena
    })
    .then(res => {
      const usuario = res.data;
      console.log('Respuesta del backend:', usuario);
      // SOLO USA usuario, porque el id ya viene bien
      if (!usuario.id || !usuario.rol) {
        setError("Respuesta de login inválida.");
        return;
      }
      localStorage.setItem("usuario", JSON.stringify(usuario));
      setUsuario(usuario);
    })
    .catch(() => setError("Correo o contraseña incorrectos."));
  };

  return (
    <div className="container mt-5">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={manejarLogin}>
        <div className="mb-3">
          <label className="form-label">Correo:</label>
          <input
            type="email"
            className="form-control"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Contraseña:</label>
          <input
            type="password"
            className="form-control"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <button type="submit" className="btn btn-primary">Entrar</button>
      </form>
    </div>
  );
}

export default Login;

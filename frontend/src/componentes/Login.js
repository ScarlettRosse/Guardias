import React, { useState } from 'react';
import API from '../servicios/api';

function Login({ setUsuario }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const manejarLogin = (e) => {
    e.preventDefault();

    API.post('/login', {
      email, password
    })
    .then(res => {
      const usuario = res.data.usuario;
      console.log('Respuesta del backend:', usuario);
      
      if (!usuario.id || !usuario.rol) {
        setError("Respuesta de login inválida.");
        return;
      }
      localStorage.setItem("usuario", JSON.stringify(usuario));
      setUsuario(usuario);
    })
    .catch(() => setError("Email o contraseña incorrectos."));
  };

  return (
    <div className="container mt-5">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={manejarLogin}>
        <div className="mb-3">
          <label className="form-label">Email:</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Contraseña:</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

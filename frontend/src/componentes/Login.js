import React, { useState, useEffect } from 'react';
import API from '../servicios/api';
import '../styles/Login.css';
import imagenLogin from '../img/pexels-sevenstorm-juhaszimrus-934504.jpg';

function Login({ setUsuario }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundRepeat = '';
  }, []);

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
    <div className="login-main-container">
      <div className="login-left">
        <div className="login-form-bg">
          <h2 className="login-title">Iniciar Sesión</h2>
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
      </div>
      <div className="login-right">
        <img src={imagenLogin} alt="Login" className="login-image" />
      </div>
    </div>
  );
}

export default Login;

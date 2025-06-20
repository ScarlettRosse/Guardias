import React, { useState, useEffect } from 'react';
import Login from './componentes/Login';
import VistaGerente from './componentes/VistaGerente';
import VistaSupervisor from './componentes/VistaSupervisor';
import VistaGuardia from './componentes/VistaGuardia';

function App() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const guardado = localStorage.getItem("usuario");
    if (guardado) setUsuario(JSON.parse(guardado));
  }, []);

  if (!usuario) return <Login setUsuario={setUsuario} />;

  switch (usuario.rol) {
    case "gerente":
      return <VistaGerente usuario={usuario} />;
    case "supervisor":
      return <VistaSupervisor usuario={usuario} />;
    case "guardia":
      return <VistaGuardia usuario={usuario} />;
    default:
      return <div>Rol no reconocido</div>;
  }
}

export default App;

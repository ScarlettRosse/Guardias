from flask import Flask
from flask_cors import CORS
from modelos.base_datos import inicializar_bd
from rutas.autenticacion import rutas_autenticacion
from rutas.reportes import rutas_reportes
from rutas.tareas import rutas_tareas
from rutas.turnos import rutas_turnos
from rutas.usuarios import rutas_usuarios
from rutas.locales import rutas_locales


app = Flask(__name__)
CORS(app, supports_credentials=True, expose_headers=["usuario-id", "usuario_id", "rol"], allow_headers=["Content-Type", "usuario-id", "usuario_id", "rol"])

# Conexión a MongoDB
inicializar_bd()

# Registro de rutas
app.register_blueprint(rutas_autenticacion)
app.register_blueprint(rutas_reportes)
app.register_blueprint(rutas_tareas)
app.register_blueprint(rutas_turnos)
app.register_blueprint(rutas_usuarios)
app.register_blueprint(rutas_locales)

if __name__ == '__main__':
    app.run(debug=True)

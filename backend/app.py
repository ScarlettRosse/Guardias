from flask import Flask
from flask_cors import CORS
from modelos.base_datos import inicializar_bd
from rutas.autenticacion import rutas_autenticacion
from rutas.reportes import rutas_reportes
from rutas.tareas import rutas_tareas
from rutas.turnos import rutas_turnos
from rutas.usuarios import rutas_usuarios

app = Flask(__name__)
CORS(app)

# Conexión a MongoDB
inicializar_bd()

# Registro de rutas
app.register_blueprint(rutas_autenticacion)
app.register_blueprint(rutas_reportes)
app.register_blueprint(rutas_tareas)
app.register_blueprint(rutas_turnos)
app.register_blueprint(rutas_usuarios)

if __name__ == '__main__':
    app.run(debug=True)

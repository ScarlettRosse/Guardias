from flask import request, jsonify
from functools import wraps

def verificar_rol(*roles_permitidos):
    def decorador(funcion):
        @wraps(funcion)
        def envoltura(*args, **kwargs):
            rol = request.headers.get("Rol")
            if rol not in roles_permitidos:
                return jsonify({"mensaje": "Acceso no autorizado"}), 403
            return funcion(*args, **kwargs)
        return envoltura
    return decorador

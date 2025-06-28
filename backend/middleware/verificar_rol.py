from flask import request, jsonify
from functools import wraps

def verificar_rol(*roles_permitidos):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            rol = request.headers.get("rol")
            
            if not rol:
                return jsonify({"error": "Rol no especificado"}), 401
            
            if rol not in roles_permitidos:
                return jsonify({"error": "Acceso denegado"}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

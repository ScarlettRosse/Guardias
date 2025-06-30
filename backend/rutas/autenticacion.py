from flask import Blueprint, request, jsonify
from modelos.base_datos import bd

rutas_autenticacion = Blueprint("rutas_autenticacion", __name__)

@rutas_autenticacion.route("/login", methods=["POST"])
def login():
    datos = request.get_json()
    email = datos.get("email")
    password = datos.get("password")
    
    # Buscar usuario por email
    usuario = bd.usuarios.find_one({"email": email})
    
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    # Verificar contraseña
    if usuario.get("password") == password:
        # Si se encuentra con formato antiguo, migrar automáticamente
        if "correo" in usuario and "email" not in usuario:
            try:
                bd.usuarios.update_one(
                    {"_id": usuario["_id"]},
                    {
                        "$set": {
                            "email": usuario["correo"],
                            "nombre": usuario.get("nombre", "Usuario"),
                            "rol": usuario.get("rol", "guardia")
                        },
                        "$unset": {"correo": ""}
                    }
                )
                usuario["email"] = usuario["correo"]
                usuario["nombre"] = usuario.get("nombre", "Usuario")
                usuario["rol"] = usuario.get("rol", "guardia")
            except Exception as e:
                return jsonify({"error": f"Error al migrar usuario: {str(e)}"}), 500
        
        return jsonify({
            "mensaje": "Login exitoso",
            "usuario": {
                "id": str(usuario["_id"]),
                "nombre": usuario.get("nombre", "Usuario"),
                "email": usuario.get("email", usuario.get("correo", "")),
                "rol": usuario.get("rol", "guardia")
            }
        })
    else:
        return jsonify({"error": "Contraseña incorrecta"}), 401

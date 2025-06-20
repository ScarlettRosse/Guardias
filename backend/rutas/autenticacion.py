from flask import Blueprint, request, jsonify
from modelos.base_datos import bd

rutas_autenticacion = Blueprint("rutas_autenticacion", __name__)

@rutas_autenticacion.route("/inicio-sesion", methods=["POST"])
def inicio_sesion():
    datos = request.get_json()
    correo = datos.get("correo")
    contrasena = datos.get("contrasena")

    usuario = bd.usuarios.find_one({
        "correo": correo,
        "contrasena": contrasena
    })

    if not usuario:
        return jsonify({"error": "Correo o contraseña incorrectos"}), 401

    return jsonify({
        "id": str(usuario["_id"]),
        "rol": usuario["rol"],
        "nombre": usuario.get("nombre")
    })

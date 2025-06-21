from flask import Blueprint, request, jsonify
from modelos.base_datos import bd
from middleware.verificar_rol import verificar_rol

rutas_usuarios = Blueprint("rutas_usuarios", __name__)

@rutas_usuarios.route("/usuarios/guardias", methods=["GET"])
@verificar_rol("supervisor", "gerente")
def obtener_guardias():
    guardias = list(bd.usuarios.find({"rol": "guardia"}))
    for g in guardias:
        g["_id"] = str(g["_id"])
    return jsonify(guardias)


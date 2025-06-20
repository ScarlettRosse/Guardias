from flask import Blueprint, request, jsonify
from bson import ObjectId
from modelos.base_datos import bd
from middleware.verificar_rol import verificar_rol

rutas_turnos = Blueprint("rutas_turnos", __name__)

@rutas_turnos.route("/turnos", methods=["GET"])
@verificar_rol("gerente", "supervisor")
def obtener_todos_turnos():
    turnos = list(bd.turnos.find())
    for t in turnos:
        for k in t:
            if isinstance(t[k], ObjectId):
                t[k] = str(t[k])
        guardia = bd.usuarios.find_one({"_id": ObjectId(t["id_guardia"])}) if "id_guardia" in t else None
        t["nombre_guardia"] = guardia.get("nombre") if guardia else "Desconocido"
    return jsonify(turnos)



@rutas_turnos.route("/turnos/mis-turnos", methods=["GET"])
@verificar_rol("guardia")
def obtener_turnos_guardia():
    id_guardia = request.headers.get("Usuario_Id")

    
    turnos = list(bd.turnos.find({"id_guardia": ObjectId(id_guardia)}))

    for t in turnos:
        t["_id"] = str(t["_id"])
        t["id_guardia"] = str(t["id_guardia"])
    return jsonify(turnos)

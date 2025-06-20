from flask import Blueprint, request, jsonify
from bson import ObjectId
from modelos.base_datos import bd
from middleware.verificar_rol import verificar_rol

rutas_tareas = Blueprint("rutas_tareas", __name__)

@rutas_tareas.route("/tareas", methods=["GET"])
@verificar_rol("gerente", "supervisor")
def obtener_todas_tareas():
    tareas = list(bd.tareas.find())
    for t in tareas:
        
        for k in t:
            if isinstance(t[k], ObjectId):
                t[k] = str(t[k])

        guardia = bd.usuarios.find_one({"_id": ObjectId(t["id_guardia"])}) if "id_guardia" in t else None
        t["nombre_guardia"] = guardia.get("nombre") if guardia else "Desconocido"
    return jsonify(tareas)



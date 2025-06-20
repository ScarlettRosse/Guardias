from flask import Blueprint, request, jsonify
from bson import ObjectId
from modelos.base_datos import bd
from middleware.verificar_rol import verificar_rol

rutas_reportes = Blueprint("rutas_reportes", __name__)

@rutas_reportes.route("/reportes/enviar", methods=["POST"])
@verificar_rol("guardia")
def enviar_reporte():
    datos = request.get_json()
    descripcion = datos.get("descripcion")
    fecha = datos.get("fecha")
    id_guardia = request.headers.get("Usuario_Id")

    reporte = {
        "descripcion": descripcion,
        "fecha": fecha,
        "id_guardia": id_guardia
    }

    bd.reportes.insert_one(reporte)
    return jsonify({"mensaje": "Reporte enviado correctamente"})

@rutas_reportes.route("/reportes", methods=["GET"])
@verificar_rol("gerente", "supervisor")
def obtener_todos_reportes():
    reportes = list(bd.reportes.find())
    for r in reportes:
        
        for k in r:
            if isinstance(r[k], ObjectId):
                r[k] = str(r[k])
        guardia = bd.usuarios.find_one({"_id": ObjectId(r["id_guardia"])}) if "id_guardia" in r else None
        r["nombre_guardia"] = guardia.get("nombre") if guardia else "Desconocido"
    return jsonify(reportes)


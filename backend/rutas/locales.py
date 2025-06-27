from flask import Blueprint, jsonify
from modelos.base_datos import bd
from middleware.verificar_rol import verificar_rol
from flask import request
from bson import ObjectId
from datetime import datetime


rutas_locales = Blueprint("rutas_locales", __name__)

@rutas_locales.route("/locales", methods=["GET"])
@verificar_rol("supervisor", "guardia", "gerente")
def obtener_locales():
    locales = list(bd.locales.find())
    for local in locales:
        local["_id"] = str(local["_id"])
    return jsonify(locales)

@rutas_locales.route("/locales", methods=["POST"])
@verificar_rol("gerente", "supervisor")
def agregar_local():
    datos = request.get_json()
    
    try:
        nuevo_local = {
            "nombre": datos["nombre"],
            "direccion": datos["direccion"],
            "telefono": datos.get("telefono", ""),
            "fecha_creacion": datetime.now().isoformat()
        }
        
        resultado = bd.locales.insert_one(nuevo_local)
        return jsonify({"mensaje": "Local agregado correctamente"}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@rutas_locales.route("/locales/<id_local>", methods=["PUT"])
@verificar_rol("supervisor", "gerente")
def editar_local(id_local):
    datos = request.get_json()
    nombre = datos.get("nombre")
    direccion = datos.get("direccion")
    if not nombre or not direccion:
        return jsonify({"error": "Faltan datos"}), 400

    resultado = bd.locales.update_one(
        {"_id": ObjectId(id_local)},
        {"$set": {"nombre": nombre, "direccion": direccion}}
    )
    if resultado.matched_count == 0:
        return jsonify({"error": "Local no encontrado"}), 404
    return jsonify({"mensaje": "Local actualizado correctamente"})

@rutas_locales.route("/locales/<id_local>", methods=["DELETE"])
@verificar_rol("supervisor", "gerente")
def eliminar_local(id_local):
    resultado = bd.locales.delete_one({"_id": ObjectId(id_local)})
    if resultado.deleted_count == 0:
        return jsonify({"error": "Local no encontrado"}), 404
    return jsonify({"mensaje": "Local eliminado correctamente"})

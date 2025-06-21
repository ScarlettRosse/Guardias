from flask import Blueprint, jsonify
from modelos.base_datos import bd
from middleware.verificar_rol import verificar_rol
from flask import request
from bson import ObjectId


rutas_locales = Blueprint("rutas_locales", __name__)

@rutas_locales.route("/locales", methods=["GET"])
@verificar_rol("supervisor", "gerente")
def listar_locales():
    locales = list(bd.locales.find())
    for l in locales:
        l["_id"] = str(l["_id"])
    return jsonify(locales)

@rutas_locales.route("/locales", methods=["POST"])
@verificar_rol("supervisor")
def agregar_local():
    datos = request.get_json()
    nombre = datos.get("nombre")
    direccion = datos.get("direccion")
    if not nombre or not direccion:
        return jsonify({"error": "Faltan datos"}), 400
    nuevo_local = {
        "nombre": nombre,
        "direccion": direccion
    }
    bd.locales.insert_one(nuevo_local)
    return jsonify({"mensaje": "Local agregado correctamente"})

@rutas_locales.route("/locales/<id_local>", methods=["PUT"])
@verificar_rol("supervisor")
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
@verificar_rol("supervisor")
def eliminar_local(id_local):
    resultado = bd.locales.delete_one({"_id": ObjectId(id_local)})
    if resultado.deleted_count == 0:
        return jsonify({"error": "Local no encontrado"}), 404
    return jsonify({"mensaje": "Local eliminado correctamente"})

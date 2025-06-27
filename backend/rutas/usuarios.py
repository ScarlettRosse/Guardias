from flask import Blueprint, request, jsonify
from bson import ObjectId
from modelos.base_datos import bd
from middleware.verificar_rol import verificar_rol
from datetime import datetime
import re

rutas_usuarios = Blueprint("rutas_usuarios", __name__)

@rutas_usuarios.route("/usuarios/guardias", methods=["GET"])
@verificar_rol("supervisor", "gerente")
def obtener_guardias():
    guardias = list(bd.usuarios.find({"rol": "guardia"}))
    for guardia in guardias:
        guardia["_id"] = str(guardia["_id"])
    return jsonify(guardias)

@rutas_usuarios.route("/usuarios/supervisores", methods=["GET"])
@verificar_rol("gerente")
def obtener_supervisores():
    supervisores = list(bd.usuarios.find({"rol": "supervisor"}))
    for s in supervisores:
        s["_id"] = str(s["_id"])
    return jsonify(supervisores)

@rutas_usuarios.route("/usuarios/todos", methods=["GET"])
@verificar_rol("gerente")
def obtener_todos_usuarios():
    usuarios = list(bd.usuarios.find({}))
    for u in usuarios:
        u["_id"] = str(u["_id"])
    return jsonify(usuarios)

@rutas_usuarios.route("/usuarios", methods=["POST"])
@verificar_rol("gerente")
def crear_usuario():
    datos = request.get_json()
    
    try:
        # Verificar si el email ya existe
        usuario_existente = bd.usuarios.find_one({"email": datos["email"]})
        if usuario_existente:
            return jsonify({"error": "El email ya está registrado"}), 400
        
        nuevo_usuario = {
            "nombre": datos["nombre"],
            "email": datos["email"],
            "password": datos["password"],
            "rut": datos.get("rut", ""),
            "rol": datos.get("rol", "guardia"),
            "telefono": datos.get("telefono", ""),
            "direccion": datos.get("direccion", ""),
            "fecha_creacion": datetime.now().isoformat(),
            "activo": True
        }
        
        resultado = bd.usuarios.insert_one(nuevo_usuario)
        return jsonify({"mensaje": "Usuario creado correctamente"}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@rutas_usuarios.route("/usuarios/<usuario_id>", methods=["PUT"])
@verificar_rol("gerente")
def editar_usuario(usuario_id):
    datos = request.get_json()
    
    try:
        update_data = {}
        campos_permitidos = ["nombre", "email", "password", "rut", "rol", "telefono", "direccion", "activo"]
        
        for campo in campos_permitidos:
            if campo in datos:
                update_data[campo] = datos[campo]
        
        if not update_data:
            return jsonify({"error": "No hay datos para actualizar"}), 400
        
        resultado = bd.usuarios.update_one(
            {"_id": ObjectId(usuario_id)},
            {"$set": update_data}
        )
        
        if resultado.matched_count == 0:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        return jsonify({"mensaje": "Usuario actualizado correctamente"})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@rutas_usuarios.route("/usuarios/<usuario_id>", methods=["DELETE"])
@verificar_rol("gerente")
def eliminar_usuario(usuario_id):
    try:
        resultado = bd.usuarios.delete_one({"_id": ObjectId(usuario_id)})
        
        if resultado.deleted_count == 0:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        return jsonify({"mensaje": "Usuario eliminado correctamente"})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


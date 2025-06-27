from flask import Blueprint, request, jsonify
from bson import ObjectId
from modelos.base_datos import bd
from middleware.verificar_rol import verificar_rol
from datetime import datetime
import hashlib

rutas_tareas = Blueprint("rutas_tareas", __name__)

@rutas_tareas.route("/tareas", methods=["GET"])
@verificar_rol("supervisor")
def obtener_tareas():
    tareas = list(bd.tareas.find())
    for tarea in tareas:
        tarea["_id"] = str(tarea["_id"])
        tarea["id_guardia"] = str(tarea["id_guardia"])
        tarea["id_local"] = str(tarea["id_local"])
        guardia = bd.usuarios.find_one({"_id": ObjectId(tarea["id_guardia"])});
        tarea["nombre_guardia"] = guardia["nombre"] if guardia else "Desconocido"
        local = bd.locales.find_one({"_id": ObjectId(tarea["id_local"])});
        tarea["nombre_local"] = local["nombre"] if local else "Desconocido"
    return jsonify(tareas)

@rutas_tareas.route("/tareas/asignar", methods=["POST"])
@verificar_rol("supervisor", "gerente")
def asignar_tarea():
    datos = request.get_json()
    
    try:
        nueva_tarea = {
            "id_guardia": ObjectId(datos["id_guardia"]),
            "id_local": ObjectId(datos["id_local"]),
            "descripcion": datos["descripcion"],
            "fecha": datos.get("fecha", datetime.now().strftime("%Y-%m-%d")),
            "estado": "pendiente",
            "fecha_creacion": datetime.now().isoformat()
        }
        
        resultado = bd.tareas.insert_one(nueva_tarea)
        return jsonify({"mensaje": "Tarea asignada correctamente"}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@rutas_tareas.route("/tareas/mis-tareas", methods=["GET"])
@verificar_rol("guardia")
def obtener_tareas_guardia():
    id_guardia = request.headers.get("usuario-id") or request.headers.get("usuario_id")
    if not id_guardia:
        return jsonify([])
    tareas = list(bd.tareas.find({"id_guardia": ObjectId(id_guardia) if ObjectId.is_valid(id_guardia) else id_guardia}))
    for t in tareas:
        t["_id"] = str(t["_id"])
        t["id_guardia"] = str(t["id_guardia"])
        t["id_local"] = str(t["id_local"])
        local = bd.locales.find_one({"_id": ObjectId(t["id_local"])});
        t["nombre_local"] = local["nombre"] if local else "Desconocido"
        guardia = bd.usuarios.find_one({"_id": ObjectId(t["id_guardia"])});
        t["nombre_guardia"] = guardia["nombre"] if guardia else "Tú"
    return jsonify(tareas)

@rutas_tareas.route("/tareas/completar/<tarea_id>", methods=["PUT"])
@verificar_rol("guardia")
def completar_tarea(tarea_id):
    datos = request.get_json()
    contraseña = datos.get("contraseña")
    
    if not contraseña:
        return jsonify({"error": "Se requiere la contraseña para completar la tarea"}), 400
    
    # Obtener el ID del guardia desde los headers
    id_guardia = request.headers.get("usuario-id") or request.headers.get("usuario_id")
    if not id_guardia:
        return jsonify({"error": "Usuario no identificado"}), 401
    
    try:
        # Verificar que la tarea existe y pertenece al guardia
        tarea = bd.tareas.find_one({
            "_id": ObjectId(tarea_id),
            "id_guardia": ObjectId(id_guardia) if ObjectId.is_valid(id_guardia) else id_guardia
        })
        
        if not tarea:
            return jsonify({"error": "Tarea no encontrada o no tienes permisos para modificarla"}), 404
        
        # Verificar que la tarea esté en estado pendiente
        if tarea.get("estado") != "pendiente":
            return jsonify({"error": "Solo se pueden completar tareas en estado pendiente"}), 400
        
        # Verificar la contraseña del usuario
        usuario = bd.usuarios.find_one({"_id": ObjectId(id_guardia) if ObjectId.is_valid(id_guardia) else id_guardia})
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        # Hash de la contraseña proporcionada
        contraseña_hash = hashlib.sha256(contraseña.encode()).hexdigest()
        
        if usuario.get("contraseña") != contraseña_hash:
            return jsonify({"error": "Contraseña incorrecta"}), 401
        
        # Actualizar el estado de la tarea
        resultado = bd.tareas.update_one(
            {"_id": ObjectId(tarea_id)},
            {
                "$set": {
                    "estado": "realizado",
                    "fecha_completado": datetime.now().isoformat()
                }
            }
        )
        
        if resultado.modified_count > 0:
            return jsonify({"mensaje": "Tarea marcada como realizada correctamente"}), 200
        else:
            return jsonify({"error": "No se pudo actualizar la tarea"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500



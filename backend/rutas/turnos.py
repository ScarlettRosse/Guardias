from flask import Blueprint, request, jsonify
from bson import ObjectId
from modelos.base_datos import bd
from middleware.verificar_rol import verificar_rol
from datetime import datetime, timedelta

rutas_turnos = Blueprint("rutas_turnos", __name__)

@rutas_turnos.route("/turnos", methods=["GET"])
@verificar_rol("gerente", "supervisor")
def obtener_todos_turnos():
    turnos = list(bd.turnos.find())
    for t in turnos:
        for k in t:
            if isinstance(t[k], ObjectId):
                t[k] = str(t[k])
        
        # Obtener información del guardia
        guardia = bd.usuarios.find_one({"_id": ObjectId(t["id_guardia"])}) if "id_guardia" in t else None
        t["nombre_guardia"] = guardia.get("nombre") if guardia else "Desconocido"
        
        # Obtener información del local
        local = bd.locales.find_one({"_id": ObjectId(t["id_local"])}) if "id_local" in t else None
        t["nombre_local"] = local.get("nombre") if local else "Desconocido"
        t["direccion_local"] = local.get("direccion") if local else "Sin dirección"
    
    return jsonify(turnos)


@rutas_turnos.route("/turnos/mis-turnos", methods=["GET"])
@verificar_rol("guardia")
def obtener_turnos_guardia():
    # Intentar obtener el ID del guardia con ambos formatos de header
    id_guardia = request.headers.get("usuario-id") or request.headers.get("usuario_id")
    if not id_guardia:
        return jsonify([])
    hoy = datetime.now().strftime("%Y-%m-%d")
    siete_dias_despues = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    consulta = {
        "$or": [
            {"id_guardia": id_guardia},
            {"id_guardia": ObjectId(id_guardia)} if ObjectId.is_valid(id_guardia) else {}
        ],
        "fecha": {"$gte": hoy, "$lte": siete_dias_despues}
    }
    turnos = list(bd.turnos.find(consulta))
    for t in turnos:
        t["_id"] = str(t["_id"])
        t["id_guardia"] = str(t["id_guardia"])
        t["id_local"] = str(t["id_local"])
        local = bd.locales.find_one({"_id": ObjectId(t["id_local"])} if ObjectId.is_valid(t["id_local"]) else {"_id": t["id_local"]})
        t["nombre_local"] = local.get("nombre") if local else "Desconocido"
        t["direccion_local"] = local.get("direccion") if local else "Sin dirección"
    return jsonify(turnos)


@rutas_turnos.route("/turnos/mi-turno-actual", methods=["GET"])
@verificar_rol("guardia")
def turno_actual_guardia():
    id_guardia = request.headers.get("usuario-id") or request.headers.get("usuario_id")
    if not id_guardia:
        return jsonify({"mensaje": "No tienes turnos asignados"}), 404
    ahora = datetime.now()
    fecha_hoy = ahora.strftime("%Y-%m-%d")
    consulta = {
        "id_guardia": id_guardia,
        "fecha": {"$gte": fecha_hoy}
    }
    turno = bd.turnos.find_one(consulta, sort=[("fecha", 1), ("hora_entrada", 1)])
    if not turno:
        return jsonify({"mensaje": "No tienes turnos asignados"}), 404
    local = bd.locales.find_one({"_id": turno["id_local"]})
    turno["_id"] = str(turno["_id"])
    turno["id_guardia"] = str(turno["id_guardia"])
    turno["id_local"] = str(turno["id_local"])
    respuesta = {
        "local": {
            "nombre": local["nombre"] if local else "Desconocido",
            "direccion": local["direccion"] if local else "Sin dirección"
        },
        "turno": {
            "fecha": turno["fecha"],
            "hora_entrada": turno["hora_entrada"],
            "hora_salida": turno["hora_salida"],
            "tareas": turno.get("tareas", [])
        }
    }
    return jsonify(respuesta)

# Ruta para asignar turno a un guardia
@rutas_turnos.route("/turnos/asignar", methods=["POST"])
@verificar_rol("supervisor", "gerente")
def asignar_turno():
    datos = request.get_json()
    
    try:
        id_guardia = ObjectId(datos["id_guardia"])
        fecha = datos["fecha"]  # "YYYY-MM-DD"
        hora_entrada = datos["hora_entrada"]  # "HH:MM"
        hora_salida = datos["hora_salida"]    # "HH:MM"
        
        # Validación: Buscar turnos traslapados para este guardia en la misma fecha
        turnos_existentes = bd.turnos.find({
            "id_guardia": id_guardia,
            "fecha": fecha
        })

        # Convertir horas a objetos datetime para comparar
        nueva_inicio = datetime.strptime(f"{fecha} {hora_entrada}", "%Y-%m-%d %H:%M")
        nueva_fin = datetime.strptime(f"{fecha} {hora_salida}", "%Y-%m-%d %H:%M")
        
        for t in turnos_existentes:
            existente_inicio = datetime.strptime(f"{fecha} {t['hora_entrada']}", "%Y-%m-%d %H:%M")
            existente_fin = datetime.strptime(f"{fecha} {t['hora_salida']}", "%Y-%m-%d %H:%M")
            
            # Si hay traslape, rechazar la asignación
            if not (nueva_fin <= existente_inicio or nueva_inicio >= existente_fin):
                return jsonify({"error": "El guardia ya tiene un turno en este horario"}), 400

        # Si no hay traslape, insertar el nuevo turno
        nuevo_turno = {
            "id_guardia": id_guardia,
            "id_local": ObjectId(datos["id_local"]),
            "fecha": fecha,
            "hora_entrada": hora_entrada,
            "hora_salida": hora_salida,
            "tareas": datos.get("tareas", []),
            "fecha_creacion": datetime.now().isoformat()
        }
        
        resultado = bd.turnos.insert_one(nuevo_turno)
        
        return jsonify({"mensaje": "Turno asignado correctamente"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    

   #Ruta para eliminar turno 
@rutas_turnos.route("/turnos/<turno_id>", methods=["DELETE"])
@verificar_rol("supervisor")
def eliminar_turno(turno_id):
    bd.turnos.delete_one({"_id": ObjectId(turno_id)})
    return jsonify({"mensaje": "Turno eliminado correctamente"})


#Ruta para editar turno
@rutas_turnos.route("/turnos/<turno_id>", methods=["PUT"])
@verificar_rol("supervisor")
def editar_turno(turno_id):
    datos = request.get_json()
    update = {}
    if "fecha" in datos:
        update["fecha"] = datos["fecha"]
    if "hora_entrada" in datos:
        update["hora_entrada"] = datos["hora_entrada"]
    if "hora_salida" in datos:
        update["hora_salida"] = datos["hora_salida"]
    if "tareas" in datos:
        update["tareas"] = datos["tareas"]
    bd.turnos.update_one({"_id": ObjectId(turno_id)}, {"$set": update})
    return jsonify({"mensaje": "Turno actualizado correctamente"})




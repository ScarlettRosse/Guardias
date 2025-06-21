from flask import Blueprint, request, jsonify
from bson import ObjectId
from modelos.base_datos import bd
from middleware.verificar_rol import verificar_rol
from datetime import datetime

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
    print("Usuario_Id recibido:", id_guardia)
    turnos = list(bd.turnos.find({
        "$or": [
            {"id_guardia": ObjectId(id_guardia)},
            {"id_guardia": id_guardia}
        ]
    }))
    for t in turnos:
        t["_id"] = str(t["_id"])
        if isinstance(t["id_guardia"], ObjectId):
            t["id_guardia"] = str(t["id_guardia"])
        if isinstance(t["id_local"], ObjectId):
            t["id_local"] = str(t["id_local"])
    return jsonify(turnos)


@rutas_turnos.route("/turnos/mi-turno-actual", methods=["GET"])
@verificar_rol("guardia")
def turno_actual_guardia():
    id_guardia = request.headers.get("Usuario_Id")
    ahora = datetime.now()
    fecha_hoy = ahora.strftime("%Y-%m-%d")
    hora_hoy = ahora.strftime("%H:%M")

    # Buscar el turno de hoy o el próximo en el futuro (por fecha y hora de entrada)
    turno = bd.turnos.find_one(
        {
            "$or": [
                {"id_guardia": ObjectId(id_guardia)},
                {"id_guardia": id_guardia}
            ],
            "fecha": {"$gte": fecha_hoy}
        },
        sort=[("fecha", 1), ("hora_entrada", 1)]
    )

    if not turno:
        return jsonify({"mensaje": "No tienes turnos asignados"}), 404

    # Buscar información del local asociado
    local = bd.locales.find_one({"_id": turno["id_local"]})

    # Serializar los datos para el frontend
    turno["_id"] = str(turno["_id"])
    turno["id_guardia"] = str(turno["id_guardia"])
    turno["id_local"] = str(turno["id_local"])

    return jsonify({
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
    })

# Ruta para asignar turno a un guardia
@rutas_turnos.route("/turnos/asignar", methods=["POST"])
@verificar_rol("supervisor")
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
            "tareas": datos.get("tareas", [])
        }
        bd.turnos.insert_one(nuevo_turno)
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




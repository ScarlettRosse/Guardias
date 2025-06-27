from flask import Blueprint, request, jsonify
from bson import ObjectId
from modelos.base_datos import bd
from middleware.verificar_rol import verificar_rol
from datetime import datetime, timedelta

rutas_reportes = Blueprint("rutas_reportes", __name__)

# Categorías de incidentes disponibles
CATEGORIAS_INCIDENTES = [
    "robo",
    "persona_sospechosa",
    "vandalismo",
    "accidente",
    "incendio",
    "falla_tecnica",
    "intrusion",
    "amenaza",
    "otro"
]

@rutas_reportes.route("/reportes/categorias", methods=["GET"])
def obtener_categorias():
    """Obtener lista de categorías de incidentes disponibles"""
    return jsonify({
        "categorias": CATEGORIAS_INCIDENTES,
        "descripciones": {
            "robo": "Robo o intento de robo",
            "persona_sospechosa": "Persona sospechosa en el área",
            "vandalismo": "Actos de vandalismo o daños",
            "accidente": "Accidente o lesión",
            "incendio": "Incendio o riesgo de incendio",
            "falla_tecnica": "Falla en sistemas de seguridad",
            "intrusion": "Intrusión no autorizada",
            "amenaza": "Amenaza o intimidación",
            "otro": "Otro tipo de incidente"
        }
    })

@rutas_reportes.route("/reportes/enviar", methods=["POST"])
@verificar_rol("guardia")
def enviar_reporte():
    datos = request.get_json()
    
    try:
        nuevo_reporte = {
            "id_guardia": ObjectId(request.headers.get("usuario-id")),
            "id_local": ObjectId(datos["id_local"]),
            "categoria": datos["categoria"],
            "descripcion": datos["descripcion"],
            "fecha": datos["fecha"],
            "estado": "pendiente",
            "fecha_creacion": datetime.now().isoformat()
        }
        
        resultado = bd.reportes.insert_one(nuevo_reporte)
        return jsonify({"mensaje": "Reporte enviado correctamente"}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@rutas_reportes.route("/reportes", methods=["GET"])
@verificar_rol("gerente", "supervisor")
def obtener_todos_reportes():
    reportes = list(bd.reportes.find())
    for r in reportes:
        for k in r:
            if isinstance(r[k], ObjectId):
                r[k] = str(r[k])
        
        # Obtener información del guardia
        guardia = bd.usuarios.find_one({"_id": ObjectId(r["id_guardia"])}) if "id_guardia" in r else None
        r["nombre_guardia"] = guardia.get("nombre") if guardia else "Desconocido"
        
        # Obtener información del local
        if "id_local" in r and r["id_local"]:
            local = bd.locales.find_one({"_id": ObjectId(r["id_local"])})
            r["nombre_local"] = local.get("nombre") if local else "Desconocido"
            r["direccion_local"] = local.get("direccion") if local else "Sin dirección"
    
    return jsonify(reportes)

@rutas_reportes.route("/reportes/estadisticas", methods=["GET"])
@verificar_rol("gerente", "supervisor")
def obtener_estadisticas_reportes():
    # Obtener estadísticas de los últimos 30 días
    fecha_limite = datetime.now() - timedelta(days=30)
    
    # Total de reportes
    total_reportes = bd.reportes.count_documents({})
    
    # Reportes de los últimos 30 días
    reportes_recientes = bd.reportes.count_documents({
        "fecha": {"$gte": fecha_limite.isoformat()}
    })
    
    # Reportes por guardia
    pipeline = [
        {
            "$lookup": {
                "from": "usuarios",
                "localField": "id_guardia",
                "foreignField": "_id",
                "as": "guardia_info"
            }
        },
        {
            "$group": {
                "_id": "$id_guardia",
                "nombre_guardia": {"$first": {"$arrayElemAt": ["$guardia_info.nombre", 0]}},
                "total_reportes": {"$sum": 1}
            }
        },
        {"$sort": {"total_reportes": -1}}
    ]
    
    reportes_por_guardia = list(bd.reportes.aggregate(pipeline))
    
    # Reportes por día (últimos 7 días)
    pipeline_diario = [
        {
            "$match": {
                "fecha": {"$gte": (datetime.now() - timedelta(days=7)).isoformat()}
            }
        },
        {
            "$group": {
                "_id": {"$substr": ["$fecha", 0, 10]},
                "total": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    reportes_por_dia = list(bd.reportes.aggregate(pipeline_diario))
    
    # Reportes por categoría
    pipeline_categoria = [
        {
            "$group": {
                "_id": "$categoria",
                "total": {"$sum": 1}
            }
        },
        {"$sort": {"total": -1}}
    ]
    
    reportes_por_categoria = list(bd.reportes.aggregate(pipeline_categoria))
    
    estadisticas = {
        "total_reportes": total_reportes,
        "reportes_ultimos_30_dias": reportes_recientes,
        "reportes_por_guardia": reportes_por_guardia,
        "reportes_por_dia": reportes_por_dia,
        "reportes_por_categoria": reportes_por_categoria
    }
    
    return jsonify(estadisticas)


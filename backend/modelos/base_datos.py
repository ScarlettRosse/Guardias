from pymongo import MongoClient

cliente = MongoClient("mongodb://localhost:27017/")
bd = cliente["kovr_bd"]

def inicializar_bd():
    pass

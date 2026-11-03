import os, sys, json
os.environ['QT_QPA_PLATFORM']='offscreen'
from qgis.core import QgsApplication, QgsCoordinateReferenceSystem, QgsCoordinateTransform, QgsProject, QgsPointXY
from osgeo import gdal
import numpy as np
app=QgsApplication([],False); app.initQgis()
crs=QgsCoordinateReferenceSystem('EPSG:6676')
t=QgsCoordinateTransform(QgsCoordinateReferenceSystem('EPSG:4326'),crs,QgsProject.instance())
print(json.dumps({'qgis':QgsApplication.showSettings(),'gdal':gdal.VersionInfo(),'crs':crs.description(),'origin':list(t.transform(QgsPointXY(138.99242,35.15640)))}))

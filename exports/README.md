# exports/ — Extracción local de soportes

Carpeta de salida del extractor de documentos. El contenido generado **no se
versiona** (está en `.gitignore`); solo se versiona este README.

## Uso

```bash
npm run export:encuesta-uno
```

Genera la siguiente estructura, idéntica a la del `.zip` que descarga el
administrador desde **Configuración → Descargar Soportes · Encuesta 1**:

```
exports/documentos-encuesta-1/
├── Maria_Gomez_1012345678/
│   ├── Cedula (frontal).jpg
│   ├── Cedula (reverso).jpg
│   └── Recibo de servicio publico.pdf
├── Juan_Perez_79123456/
│   └── Cedula (frontal).jpg
└── _ARCHIVOS_NO_ENCONTRADOS.txt   (solo si algo no se pudo recuperar)
```

Solo incluye a las personas con registro en la tabla `surveys` (Encuesta Uno).

## Requisitos

- `DATABASE_URL` definida (en `.env` o como variable de entorno).
- Para bajar de la nube: `supabase-config.json` o `SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY`.

## De dónde salen los archivos

1. **Carpeta local** `uploads/` del proyecto (o la ruta de `UPLOADS_DIR`).
2. **Supabase Storage**, bucket `documents`.

La carpeta de cada persona se crea aunque su archivo no se pueda recuperar
todavía, de modo que la estructura queda lista y basta volver a ejecutar el
comando cuando el almacenamiento esté disponible.

> **Nota:** si el proyecto de Supabase está restringido por cuota
> (`exceed_storage_size_quota`), las descargas de la nube fallan y solo se
> extraerá lo que exista en `uploads/`. El detalle de cada fallo queda en
> `_ARCHIVOS_NO_ENCONTRADOS.txt`.

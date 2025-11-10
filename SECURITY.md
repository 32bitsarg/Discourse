# 🔒 Política de Seguridad

## ⚠️ Información Sensible

**NUNCA** subas al repositorio:

- Archivos `.env` o `.env.local` con credenciales reales
- Tokens de API
- Contraseñas de base de datos
- Secrets de sesión
- Claves privadas

## ✅ Archivos Seguros para Subir

- `.env.example` - Template sin credenciales
- Código fuente
- Documentación
- Scripts de migración (sin credenciales hardcodeadas)

## 🔐 Variables de Entorno Requeridas

Todas las credenciales deben estar en `.env.local` (que está en `.gitignore`):

```env
# Base de datos
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Seguridad
SESSION_SECRET=
```

## 🛡️ Buenas Prácticas

1. **Nunca hardcodees credenciales** en el código
2. **Usa variables de entorno** para toda información sensible
3. **Valida que existan** las variables antes de usarlas
4. **Revisa el código** antes de hacer commit
5. **Usa `.env.example`** como template para otros desarrolladores

## 🚨 Si Expusiste Credenciales

1. **Rótalas inmediatamente** (cambia passwords/tokens)
2. **Elimina el commit** del historial de Git si es posible
3. **Notifica al equipo** si trabajas en grupo
4. **Revisa los logs** de acceso a servicios


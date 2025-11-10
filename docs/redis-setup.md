# Configuración de Redis para Cache

## 🚀 ¿Por qué Redis?

Redis mejora el rendimiento de la aplicación:
- ✅ Reduce consultas a la base de datos
- ✅ Respuestas más rápidas (milisegundos vs segundos)
- ✅ Escala a miles de usuarios simultáneos
- ✅ La app funciona aunque Redis no esté disponible (graceful degradation)

## 📦 Instalación

### Opción 1: Redis Local (Desarrollo)
```bash
# Windows (con Chocolatey)
choco install redis-64

# O descargar desde: https://github.com/microsoftarchive/redis/releases

# Iniciar Redis
redis-server
```

### Opción 2: Redis Cloud (Producción)
- **Redis Cloud**: https://redis.com/try-free/
- **Upstash**: https://upstash.com/ (gratis hasta 10K comandos/día)
- **Railway**: https://railway.app/ (tiene Redis)

## ⚙️ Configuración

Agrega a tu `.env.local`:
```env
REDIS_URL=redis://localhost:6379
```

Para producción (ejemplo Upstash):
```env
REDIS_URL=rediss://default:password@host:port
```

## 🔧 Cómo Funciona

### Cache Automático:
- **Stats**: Cache de 1 minuto
- **Comunidades**: Cache de 5 minutos
- **Posts**: Cache de 1-2 minutos (según filtro)

### Invalidación Automática:
- Al crear una comunidad → invalida cache de comunidades y stats
- Al crear un post → invalida cache de posts (se implementará)

## 📊 Beneficios

### Sin Redis:
- Cada request = 1-3 queries a MySQL
- 100 usuarios = 100-300 queries/segundo
- Latencia: 50-200ms por request

### Con Redis:
- Primera request = query a MySQL + guardar en cache
- Requests siguientes = leer de Redis
- 100 usuarios = 1-3 queries/segundo (solo cuando expira cache)
- Latencia: 1-5ms por request (desde cache)

## 🎯 Resultado

**Capacidad estimada:**
- Sin Redis: ~100-500 usuarios simultáneos
- Con Redis: ~10,000+ usuarios simultáneos

## ⚠️ Nota Importante

Si Redis no está disponible, la app **sigue funcionando** normalmente. Solo no tendrá cache, pero todas las funcionalidades funcionan igual.


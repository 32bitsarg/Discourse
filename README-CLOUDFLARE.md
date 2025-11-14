# Configuración para Cloudflare Pages

## Configuración en Cloudflare Pages Dashboard

Para desplegar Next.js en Cloudflare Pages, necesitas configurar lo siguiente en el dashboard de Cloudflare:

### Build Settings:

1. **Framework preset**: `Next.js`
2. **Build command**: `npm run build`
3. **Build output directory**: `.next`
4. **Root directory**: `/` (o la raíz de tu proyecto)

### Variables de Entorno:

Asegúrate de configurar todas las variables de entorno necesarias en Cloudflare Pages:
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `SESSION_SECRET`
- `UPSTASH_REDIS_REST_URL` (opcional)
- `UPSTASH_REDIS_REST_TOKEN` (opcional)
- `NEXT_PUBLIC_ADMINS` (opcional)

### Nota Importante:

Cloudflare Pages detecta automáticamente Next.js y usa su propio sistema de build.
**NO uses Wrangler directamente** para Next.js en Cloudflare Pages.

El error que estás viendo ocurre porque Cloudflare está intentando usar Wrangler en lugar del preset de Next.js.

### Solución:

1. Ve a tu proyecto en Cloudflare Pages Dashboard
2. Settings → Builds & deployments
3. Asegúrate de que el **Framework preset** esté configurado como **Next.js**
4. Si no aparece la opción, selecciona "None" y configura manualmente:
   - Build command: `npm run build`
   - Build output directory: `.next`

### Alternativa: Usar Cloudflare Workers (No recomendado para Next.js completo)

Si necesitas usar Workers, tendrías que:
1. Downgrade a Next.js 15.x
2. Instalar `@cloudflare/next-on-pages`
3. Usar el comando `build:cloudflare`

Pero esto no es necesario - Cloudflare Pages tiene soporte nativo para Next.js.


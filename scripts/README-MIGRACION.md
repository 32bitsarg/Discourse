# Scripts de Migración para Producción

## Migración: Agregar tabla Settings

Este script agrega la tabla `settings` a tu base de datos en producción.

### Pasos para ejecutar:

1. **Asegúrate de tener las variables de entorno configuradas** en `.env.local`:
   ```env
   DB_HOST=tu-host
   DB_PORT=3306
   DB_USER=tu-usuario
   DB_PASSWORD=tu-password
   DB_NAME=tu-base-de-datos
   ```

2. **Ejecutar la migración**:
   ```bash
   npm run migrate:settings
   ```

   O directamente:
   ```bash
   node scripts/migrate-add-settings.js
   ```

3. **Verificar que se creó correctamente**:
   El script mostrará un mensaje de éxito y listará la configuración actual.

### ¿Qué hace este script?

- Crea la tabla `settings` si no existe
- Inserta valores por defecto:
  - `site_name`: 'Discourse'
  - `site_description`: 'Plataforma de foros y comunidades'

### Nota importante:

Este script es **seguro** de ejecutar múltiples veces. Usa `CREATE TABLE IF NOT EXISTS` y `ON DUPLICATE KEY UPDATE`, por lo que no causará errores si la tabla ya existe.

---

## Verificar/Configurar Usuarios Admin

Este script verifica que los usuarios especificados en `NEXT_PUBLIC_ADMINS` existan en la base de datos.

### Pasos:

1. **Configura `NEXT_PUBLIC_ADMINS` en `.env.local`**:
   ```env
   NEXT_PUBLIC_ADMINS=1,2,3
   ```
   O usando usernames:
   ```env
   NEXT_PUBLIC_ADMINS=admin,32BITS
   ```
   O mezclando ambos:
   ```env
   NEXT_PUBLIC_ADMINS=1,admin,32BITS
   ```
   (Puedes usar IDs numéricos, usernames, o una combinación de ambos, separados por comas)

2. **Ejecutar el script**:
   ```bash
   npm run setup:admin
   ```

   O directamente:
   ```bash
   node scripts/setup-admin.js
   ```

3. **Verificar los resultados**:
   El script mostrará qué usuarios admin fueron encontrados y cuáles no.

### Ejemplo de salida:

```
📋 Verificando usuarios admin desde NEXT_PUBLIC_ADMINS: 1,2,3

✅ Usuario admin encontrado: admin (ID: 1, Email: admin@example.com)
✅ Usuario admin encontrado: juan (ID: 2, Email: juan@example.com)
⚠️  Usuario con ID 3 no encontrado en la base de datos

📊 Resumen: 2 de 3 usuarios admin encontrados
```

---

## Orden recomendado para deploy:

1. **Hacer backup de la base de datos** (importante!)
2. Ejecutar `npm run migrate:settings`
3. Verificar que `NEXT_PUBLIC_ADMINS` esté configurado en `.env.local`
4. Ejecutar `npm run setup:admin` para verificar usuarios
5. Hacer deploy del código
6. Verificar que el dashboard funcione en `/dashboard`

---

## Solución de problemas:

### Error: "Faltan variables de entorno"
- Verifica que `.env.local` exista y tenga todas las variables de BD

### Error: "Usuario con ID X no encontrado"
- Verifica que el ID del usuario exista en la tabla `users`
- Puedes consultar los IDs con: `SELECT id, username, email FROM users`

### El dashboard no permite acceso
- Verifica que `NEXT_PUBLIC_ADMINS` esté configurado con el ID correcto
- Verifica que el usuario esté autenticado
- Revisa los logs del servidor para ver errores


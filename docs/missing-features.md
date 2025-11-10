# Funcionalidades Faltantes - Discourse

## 🚨 Crítico - Falta Implementar

### 1. **Crear Posts** ❌
**Estado:** UI existe pero no funciona
**Archivos afectados:**
- `components/CreatePostButton.tsx` - Botón sin funcionalidad
- Falta: `app/api/posts/create/route.ts`

**Qué hacer:**
- Crear API POST `/api/posts/create`
- Crear modal/formulario para crear posts
- Validar que el usuario esté logueado
- Seleccionar comunidad donde publicar

---

### 2. **Sistema de Votos** ⚠️
**Estado:** UI existe pero no guarda en BD
**Archivos afectados:**
- `components/PostCard.tsx` - Tiene UI de votos pero solo local
- Falta: `app/api/posts/[id]/vote/route.ts`

**Qué hacer:**
- Crear API POST `/api/posts/[id]/vote`
- Guardar votos en tabla `votes`
- Actualizar contadores `upvotes`/`downvotes` en posts
- Verificar que un usuario solo vote una vez por post

---

### 3. **Sistema de Comentarios** ❌
**Estado:** Tabla existe pero sin implementación
**Archivos afectados:**
- Falta: `app/api/posts/[id]/comments/route.ts` (GET y POST)
- Falta: Componente para mostrar comentarios
- Falta: Página `/post/[id]` para ver post completo

**Qué hacer:**
- Crear API para obtener comentarios de un post
- Crear API para crear comentarios
- Crear componente de comentarios (con soporte para anidados)
- Crear página de detalle de post
- Actualizar `comment_count` en posts

---

### 4. **Páginas Faltantes** ❌
**Estado:** Rutas no implementadas
**Faltan:**
- `/post/[id]` - Página de detalle de post con comentarios
- `/r/[slug]` - Página de comunidad (ver posts de esa comunidad)
- `/user/[username]` - Perfil de usuario

---

## ⚠️ Mejoras Necesarias

### 5. **Actualización Automática de Contadores**
**Problema:** Los contadores no se actualizan automáticamente
**Afecta:**
- `subforums.member_count` - No se actualiza al unirse/salir
- `subforums.post_count` - No se actualiza al crear posts
- `posts.comment_count` - No se actualiza al crear comentarios
- `posts.upvotes`/`downvotes` - Deberían calcularse desde tabla `votes`

**Solución:**
- Opción A: Triggers MySQL (recomendado)
- Opción B: Actualizar en cada API call

### 6. **Cálculo de `is_hot`**
**Problema:** No hay lógica para marcar posts como "hot"
**Solución:** 
- Calcular basado en: votos recientes + tiempo
- Ejemplo: posts con >50 votos en últimas 24h

### 7. **Validación de Username en Registro**
**Problema:** No se valida si el username ya existe
**Solución:** Agregar verificación en `/api/auth/register`

---

## 📊 Resumen de Estado

| Funcionalidad | Tabla BD | API | UI | Estado |
|--------------|----------|-----|-----|--------|
| Autenticación | ✅ | ✅ | ✅ | ✅ 100% |
| Crear Comunidades | ✅ | ✅ | ✅ | ✅ 100% |
| Listar Comunidades | ✅ | ✅ | ✅ | ✅ 100% |
| Listar Posts | ✅ | ✅ | ✅ | ✅ 100% |
| Crear Posts | ✅ | ❌ | ⚠️ | ❌ 0% |
| Votar Posts | ✅ | ❌ | ✅ | ⚠️ 30% |
| Comentarios | ✅ | ❌ | ❌ | ❌ 0% |
| Página Post | ✅ | ❌ | ❌ | ❌ 0% |
| Página Comunidad | ✅ | ⚠️ | ❌ | ⚠️ 50% |
| Perfil Usuario | ✅ | ❌ | ❌ | ❌ 0% |

---

## 🎯 Prioridades

### Fase 1 (Esencial):
1. ✅ Crear posts
2. ✅ Sistema de votos funcional
3. ✅ Página de detalle de post

### Fase 2 (Importante):
4. ✅ Sistema de comentarios
5. ✅ Página de comunidad
6. ✅ Actualizar contadores automáticamente

### Fase 3 (Mejoras):
7. ✅ Perfil de usuario
8. ✅ Cálculo automático de `is_hot`
9. ✅ Funcionalidad de guardar posts


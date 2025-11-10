# Análisis Completo de la Base de Datos - Discourse

## 📊 Resumen Ejecutivo

Este documento analiza la estructura completa de la base de datos para asegurar que todas las funcionalidades estén correctamente implementadas.

---

## ✅ Tablas Existentes

### 1. **users** - Usuarios
**Campos:**
- `id` (PK, AUTO_INCREMENT)
- `username` (VARCHAR(50), UNIQUE, NOT NULL)
- `email` (VARCHAR(100), UNIQUE, NOT NULL)
- `password_hash` (VARCHAR(255), NOT NULL)
- `avatar_url` (VARCHAR(255), NULLABLE)
- `bio` (TEXT, NULLABLE)
- `karma` (INT, DEFAULT 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Índices:**
- `idx_username` (username)
- `idx_email` (email)

**Estado:** ✅ Completo
**Uso en código:** ✅ Usado en auth, registro, login

---

### 2. **categories** - Categorías
**Campos:**
- `id` (PK, AUTO_INCREMENT)
- `name` (VARCHAR(100), NOT NULL)
- `slug` (VARCHAR(100), UNIQUE, NOT NULL)
- `description` (TEXT, NULLABLE)
- `icon` (VARCHAR(50), NULLABLE)
- `color` (VARCHAR(20), NULLABLE)
- `created_at` (TIMESTAMP)

**Índices:**
- `idx_slug` (slug)

**Estado:** ⚠️ Creada pero NO se usa (estilo Reddit sin categorías)
**Nota:** Se puede mantener para futuras funcionalidades o eliminar

---

### 3. **subforums** - Comunidades (Subreddits)
**Campos:**
- `id` (PK, AUTO_INCREMENT)
- `category_id` (INT, NULLABLE, FK → categories)
- `creator_id` (INT, NOT NULL, FK → users)
- `name` (VARCHAR(100), NOT NULL)
- `slug` (VARCHAR(100), UNIQUE, NOT NULL)
- `description` (TEXT, NULLABLE)
- `rules` (TEXT, NULLABLE)
- `member_count` (INT, DEFAULT 0)
- `post_count` (INT, DEFAULT 0)
- `is_public` (BOOLEAN, DEFAULT TRUE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Índices:**
- `idx_slug` (slug)
- `idx_category` (category_id)
- `idx_creator` (creator_id)

**Estado:** ✅ Completo
**Uso en código:** ✅ Usado en sidebar, creación de comunidades

**Problemas detectados:**
- ⚠️ `member_count` y `post_count` no se actualizan automáticamente
- ⚠️ `category_id` se usa como NULL (correcto para estilo Reddit)

---

### 4. **posts** - Publicaciones
**Campos:**
- `id` (PK, AUTO_INCREMENT)
- `subforum_id` (INT, NOT NULL, FK → subforums)
- `author_id` (INT, NOT NULL, FK → users)
- `title` (VARCHAR(255), NOT NULL)
- `content` (TEXT, NOT NULL)
- `upvotes` (INT, DEFAULT 0)
- `downvotes` (INT, DEFAULT 0)
- `comment_count` (INT, DEFAULT 0)
- `is_hot` (BOOLEAN, DEFAULT FALSE)
- `is_pinned` (BOOLEAN, DEFAULT FALSE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Índices:**
- `idx_subforum` (subforum_id)
- `idx_author` (author_id)
- `idx_created` (created_at)
- `idx_hot` (is_hot)

**Estado:** ✅ Completo
**Uso en código:** ✅ Usado en PostFeed, PostCard

**Problemas detectados:**
- ⚠️ `upvotes` y `downvotes` se almacenan en la tabla pero los votos reales están en `votes`
- ⚠️ `comment_count` no se actualiza automáticamente
- ⚠️ `is_hot` no se calcula automáticamente
- ❌ No hay API para crear posts

---

### 5. **comments** - Comentarios
**Campos:**
- `id` (PK, AUTO_INCREMENT)
- `post_id` (INT, NOT NULL, FK → posts)
- `author_id` (INT, NOT NULL, FK → users)
- `parent_id` (INT, NULLABLE, FK → comments) - Para comentarios anidados
- `content` (TEXT, NOT NULL)
- `upvotes` (INT, DEFAULT 0)
- `downvotes` (INT, DEFAULT 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Índices:**
- `idx_post` (post_id)
- `idx_author` (author_id)
- `idx_parent` (parent_id)

**Estado:** ✅ Tabla completa
**Uso en código:** ❌ NO implementado
**Falta:** API routes y componentes para comentarios

---

### 6. **votes** - Votos
**Campos:**
- `id` (PK, AUTO_INCREMENT)
- `user_id` (INT, NOT NULL, FK → users)
- `post_id` (INT, NULLABLE, FK → posts)
- `comment_id` (INT, NULLABLE, FK → comments)
- `vote_type` (ENUM('up', 'down'), NOT NULL)
- `created_at` (TIMESTAMP)

**Constraints:**
- `UNIQUE KEY unique_vote` (user_id, post_id, comment_id)

**Índices:**
- `idx_user` (user_id)
- `idx_post` (post_id)
- `idx_comment` (comment_id)

**Estado:** ✅ Tabla completa
**Uso en código:** ⚠️ UI existe pero NO conectada a API
**Problema:** El componente PostCard tiene votos pero no guarda en la BD

---

### 7. **subforum_members** - Miembros de Comunidades
**Campos:**
- `id` (PK, AUTO_INCREMENT)
- `subforum_id` (INT, NOT NULL, FK → subforums)
- `user_id` (INT, NOT NULL, FK → users)
- `role` (ENUM('member', 'moderator', 'admin'), DEFAULT 'member')
- `joined_at` (TIMESTAMP)

**Constraints:**
- `UNIQUE KEY unique_membership` (subforum_id, user_id)

**Índices:**
- `idx_subforum` (subforum_id)
- `idx_user` (user_id)

**Estado:** ✅ Completo
**Uso en código:** ✅ Usado al crear comunidades (se agrega admin)

---

## 🔍 Funcionalidades Implementadas

### ✅ Completamente Implementadas:
1. **Autenticación de usuarios**
   - Registro ✅
   - Login ✅
   - Logout ✅
   - Sesión con cookies ✅

2. **Comunidades (Subforums)**
   - Crear comunidades ✅
   - Listar comunidades ✅
   - Ver comunidades en sidebar ✅

3. **Posts**
   - Listar posts ✅
   - Filtrar posts (all, hot, new, top) ✅
   - Mostrar posts en feed ✅

4. **Estadísticas**
   - Contar usuarios ✅
   - Contar posts del día ✅
   - Contar comunidades ✅

---

## ❌ Funcionalidades Faltantes

### 1. **Crear Posts**
- ❌ No hay API `/api/posts/create`
- ❌ No hay componente para crear posts
- ❌ El botón "Crear publicación" no funciona

### 2. **Sistema de Votos**
- ⚠️ UI existe pero no conectada
- ❌ No hay API `/api/posts/[id]/vote`
- ❌ Los votos no se guardan en la tabla `votes`
- ❌ Los contadores `upvotes`/`downvotes` en posts no se actualizan

### 3. **Sistema de Comentarios**
- ❌ No hay API para comentarios
- ❌ No hay componente para mostrar comentarios
- ❌ No hay página de detalle de post
- ❌ El contador `comment_count` no se actualiza

### 4. **Actualización de Contadores**
- ❌ `member_count` en subforums no se actualiza
- ❌ `post_count` en subforums no se actualiza
- ❌ `comment_count` en posts no se actualiza
- ❌ `is_hot` no se calcula automáticamente

### 5. **Páginas Faltantes**
- ❌ `/post/[id]` - Página de detalle de post
- ❌ `/r/[slug]` - Página de comunidad
- ❌ `/user/[username]` - Perfil de usuario

---

## 🔧 Problemas Detectados en el Esquema

### 1. **Inconsistencia en Votos**
- Los posts tienen `upvotes` y `downvotes` como campos directos
- Pero también existe la tabla `votes` para rastrear votos individuales
- **Solución:** Usar la tabla `votes` y calcular los totales con COUNT() o triggers

### 2. **Contadores No Automáticos**
- `member_count`, `post_count`, `comment_count` deben actualizarse con triggers o en la aplicación
- **Solución:** Agregar triggers MySQL o actualizar en las APIs

### 3. **Cálculo de `is_hot`**
- No hay lógica para determinar si un post es "hot"
- **Solución:** Calcular basado en votos y tiempo (ej: posts con muchos votos en últimas 24h)

### 4. **Categorías No Usadas**
- La tabla `categories` existe pero no se usa
- `category_id` en subforums siempre es NULL
- **Solución:** Eliminar o mantener para futuro

---

## 📋 Recomendaciones

### Prioridad Alta:
1. ✅ Crear API para crear posts
2. ✅ Conectar sistema de votos a la base de datos
3. ✅ Crear página de detalle de post
4. ✅ Implementar sistema de comentarios básico

### Prioridad Media:
5. ⚠️ Agregar triggers o lógica para actualizar contadores
6. ⚠️ Implementar cálculo automático de `is_hot`
7. ⚠️ Crear página de comunidad (`/r/[slug]`)

### Prioridad Baja:
8. 📝 Eliminar o usar categorías
9. 📝 Agregar funcionalidad de "guardar" posts
10. 📝 Agregar funcionalidad de "compartir"

---

## ✅ Conclusión

**Estado General:** 70% completo

**Funcionalidades Core:**
- ✅ Autenticación: 100%
- ✅ Comunidades: 80% (falta actualizar contadores)
- ✅ Posts: 50% (falta crear posts)
- ✅ Votos: 20% (solo UI)
- ✅ Comentarios: 0% (tabla existe pero sin implementación)

**Base de Datos:** ✅ Estructura completa y correcta
**Código:** ⚠️ Faltan APIs y funcionalidades clave


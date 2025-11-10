# Discourse - Plataforma de Foros

Plataforma de foros estilo Reddit donde los usuarios pueden crear y administrar sus propias comunidades.

## 🚀 Tecnologías

- **Next.js 16** - Framework de React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Framer Motion** - Animaciones
- **MySQL** - Base de datos
- **mysql2** - Cliente MySQL

## 📦 Instalación

```bash
npm install
```

## 🗄️ Configuración de Base de Datos

1. Copia el archivo `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

2. Edita `.env.local` y completa con tus credenciales reales:

```env
DB_HOST=tu_host_mysql
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql
DB_NAME=tu_nombre_base_datos
UPSTASH_REDIS_REST_URL=tu_url_upstash
UPSTASH_REDIS_REST_TOKEN=tu_token_upstash
SESSION_SECRET=genera_un_secret_aleatorio
```

3. Ejecuta el esquema SQL en tu base de datos MySQL:

```bash
# Opción 1: Usando el script automatizado (recomendado)
node scripts/create-tables.js
```

```bash
# Opción 2: Importar directamente el archivo SQL
mysql -h tu_host -u tu_usuario -p tu_base_datos < lib/database.sql
```

O ejecuta el contenido de `lib/database.sql` directamente en phpMyAdmin o tu cliente MySQL.

4. (Opcional) Inserta datos de ejemplo:

```bash
# Usando el script Node.js
node scripts/seed.js
```

O descomenta la sección de datos de ejemplo en `lib/database.sql` y ejecútala.

**Nota:** Los usuarios de ejemplo tienen la contraseña `password123`:
- juan@example.com / password123
- maria@example.com / password123

## 🏃 Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🏗️ Build

```bash
npm run build
npm start
```

## 📝 Características

- ✨ Interfaz estilo Reddit
- 🎨 Tema claro y moderno
- 🗨️ Sistema de foros y subforos
- 👥 Los usuarios pueden crear sus propias comunidades
- ⬆️ Sistema de votos (upvote/downvote)
- 💬 Sistema de comentarios
- 📱 Totalmente responsive

## 🎮 Estructura de Foros

- **General** - Discusiones generales
- **Tecnología** - Tecnología y programación
- **Comunidad** - Discusiones de la comunidad
- **Soporte** - Ayuda y soporte técnico

Los usuarios registrados pueden crear sus propias comunidades personalizadas.

## 🔧 Características Implementadas

✅ Sistema de autenticación (Login/Registro)
✅ Creación de comunidades por usuarios registrados
✅ Sistema de votos
✅ Interfaz estilo Reddit con tema claro
✅ Conexión a MySQL

## 🔧 Próximos Pasos

1. Sistema de comentarios completo
2. Búsqueda de posts y comunidades
3. Sistema de notificaciones
4. Panel de administración de comunidades
5. Perfiles de usuario

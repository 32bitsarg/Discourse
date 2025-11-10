<div align="center">

# 🗨️ Discourse

![Discourse Badge](https://img.shields.io/badge/Discourse-Community%20Platform-6366f1?style=for-the-badge&logo=discourse&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?style=for-the-badge&logo=redis&logoColor=white)

**Plataforma de foros estilo Reddit donde los usuarios pueden crear y administrar sus propias comunidades.**

[Características](#-características) • [Instalación](#-instalación) • [Configuración](#-configuración) • [Desarrollo](#-desarrollo)

</div>

---

## ✨ Características

- 🎯 **Comunidades Personalizadas** - Crea y administra tus propias comunidades
- 🔐 **Sistema de Membresía** - Unión con aprobación o acceso abierto
- ⬆️⬇️ **Sistema de Votos** - Upvote y downvote para posts y comentarios
- 💬 **Comentarios Anidados** - Discusiones en tiempo real
- 📝 **Editor Rico** - Markdown con soporte para imágenes y videos
- 🔍 **Feed Inteligente** - Posts destacados de tus comunidades
- 📱 **Totalmente Responsive** - Diseño adaptativo para todos los dispositivos
- ⚡ **Optimizado** - Cache con Redis para máximo rendimiento
- 🎨 **Tema Moderno** - Interfaz limpia y minimalista

## 🛠️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Lenguaje** | TypeScript |
| **Estilos** | Tailwind CSS |
| **Animaciones** | Framer Motion |
| **Base de Datos** | MySQL 8.0 |
| **Cache** | Upstash Redis |
| **Autenticación** | Cookie-based Sessions |
| **Markdown** | react-markdown |

## 📦 Instalación

### Requisitos Previos

- Node.js 18+ 
- MySQL 8.0+
- Cuenta de Upstash Redis (gratis)

### Pasos de Instalación

1. **Clona el repositorio**
```bash
git clone https://github.com/tu-usuario/discourse.git
cd discourse
```

2. **Instala las dependencias**
```bash
npm install
```

3. **Configura las variables de entorno**
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:
```env
DB_HOST=tu_host_mysql
DB_PORT=3306
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql
DB_NAME=tu_nombre_base_datos

UPSTASH_REDIS_REST_URL=tu_url_upstash
UPSTASH_REDIS_REST_TOKEN=tu_token_upstash

SESSION_SECRET=genera_un_secret_aleatorio_seguro
```

4. **Crea las tablas de la base de datos**
```bash
npm run create-tables
```

5. **(Opcional) Inserta datos de ejemplo**
```bash
node scripts/seed.js
```

## 🚀 Desarrollo

```bash
# Inicia el servidor de desarrollo
npm run dev

# Abre http://localhost:3000 en tu navegador
```

## 🏗️ Build de Producción

```bash
# Crea el build optimizado
npm run build

# Inicia el servidor de producción
npm start
```

## 📁 Estructura del Proyecto

```
discourse/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── post/              # Páginas de posts
│   ├── r/                 # Páginas de comunidades
│   └── user/              # Páginas de usuarios
├── components/            # Componentes React
├── lib/                   # Utilidades y configuraciones
│   ├── db.ts             # Conexión MySQL
│   ├── redis.ts          # Cliente Redis
│   └── database.sql      # Esquema SQL
├── public/                # Archivos estáticos
└── scripts/              # Scripts de migración
```

## 🔐 Seguridad

- ✅ Variables de entorno para credenciales
- ✅ Passwords hasheados con bcrypt
- ✅ Cookies httpOnly para sesiones
- ✅ Validación de inputs
- ✅ Protección contra SQL injection

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más información.

## 👤 Autor

**32bitsarg**

- GitHub: [@32bitsarg](https://github.com/32bitsarg)
---

<div align="center">

Hecho con ❤️ usando Next.js

[⬆ Volver arriba](#-discourse)

</div>

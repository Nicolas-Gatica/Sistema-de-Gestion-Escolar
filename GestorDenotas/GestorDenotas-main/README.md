# GestorDeNotas: Plataforma de Gestión Escolar

**GestorDeNotas** es una solución integral para la administración escolar, permitiendo gestionar estudiantes, cursos, profesores, calificaciones, asistencia, observaciones y reportes. Incluye frontend minimalista en React + TypeScript y backend robusto en Node.js + Express + Prisma + SQLite.

---

## 📋 **Requisitos Previos**

Antes de comenzar, asegúrate de tener instalado:

### **Software Necesario:**
- **Node.js** (versión 18 o superior) - [Descargar aquí](https://nodejs.org/)
- **npm** (viene con Node.js) o **yarn** (opcional)
- **Git** - [Descargar aquí](https://git-scm.com/)
- **Editor de código** (VS Code recomendado) - [Descargar aquí](https://code.visualstudio.com/)

### **Verificar instalaciones:**
```bash
node --version    # Debe ser 18.x o superior
npm --version     # Debe ser 9.x o superior
git --version     # Cualquier versión reciente
```

---

## 🏗️ **Tecnologías y Frameworks Utilizados**

### **Frontend:**
- **React 18** - Biblioteca para interfaces de usuario
- **TypeScript 5.x** - Tipado estático para JavaScript
- **Vite** - Bundler y servidor de desarrollo ultrarrápido
- **React Router** - Navegación SPA
- **jsPDF + jspdf-autotable** - Generación de PDFs
- **xlsx** - Exportación a Excel
- **Vitest** - Framework de testing

### **Backend:**
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web para APIs
- **TypeScript** - Tipado estático
- **Prisma ORM** - ORM para base de datos
- **SQLite** - Base de datos (desarrollo)
- **CORS** - Middleware para peticiones cross-origin
- **dotenv** - Variables de entorno

### **Base de Datos:**
- **SQLite** - Base de datos ligera (incluida en el proyecto)
- **Prisma Migrations** - Control de versiones de la base de datos

---

## 📦 Estructura del Proyecto

```
GestorDenotas-master/
├── backend/         # API REST, lógica de negocio y base de datos
│   ├── src/        # Código fuente (Express, Prisma, controladores, servicios, repositorios)
│   ├── prisma/     # Esquema, migraciones y seed de la base de datos
│   └── ...         # Configuración y dependencias
├── frontend/        # Cliente web (React + Vite + TypeScript)
│   ├── src/        # Componentes, páginas, servicios, contextos y tests
│   └── ...         # Configuración y dependencias
└── README.md        # Esta guía
```

---

## 🚀 **Instalación y Ejecución Paso a Paso**

### **Paso 1: Clonar el repositorio**
```bash
# Abre una terminal y ejecuta:
git clone https://github.com/Epimete0/GestorDenotas.git
cd GestorDenotas-master
```

### **Paso 2: Configurar el Backend**
```bash
# Navegar al directorio backend
cd backend

# Instalar dependencias
npm install

# Generar el cliente de Prisma
npx prisma generate

# Ejecutar migraciones de la base de datos
npx prisma migrate dev

# Poblar la base de datos con datos de ejemplo
npx prisma db seed

# Iniciar el servidor de desarrollo
npm run dev
```

**✅ El backend estará corriendo en:** `http://localhost:4000`

### **Paso 3: Configurar el Frontend**
```bash
# Abrir una nueva terminal y navegar al directorio frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

**✅ El frontend estará corriendo en:** `http://localhost:3000`

### **Paso 4: Acceder a la aplicación**
1. Abre tu navegador
2. Ve a `http://localhost:3000`
3. Usa las credenciales demo (ver sección de credenciales)

---

## 🏗️ Arquitectura y Lógica de Roles

- **Frontend:** React (SPA), Vite, TypeScript, React Router, Context API para autenticación y roles.
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, SQLite.
- **Roles:**
  - **Administrador:** Acceso total a gestión de cursos, inscripciones, estudiantes, reportes y usuarios.
  - **Profesor:** Acceso solo a sus cursos, estudiantes, calificaciones, asistencias y observaciones.
- **Autenticación:** Basada en tokens simples, gestionada en el backend y almacenada en localStorage en el frontend.
- **Patrones:** Repository, Service, Singleton, Factory, Strategy, Observer.

---

## 🚀 Frameworks y Librerías Usadas

### Frontend
- **React:** Construcción de interfaces de usuario reactivas y componentes reutilizables.
- **Vite:** Bundler ultrarrápido para desarrollo y producción.
- **TypeScript:** Tipado estático para mayor robustez y mantenibilidad.
- **React Router:** Navegación SPA y protección de rutas según rol.
- **jsPDF, jspdf-autotable:** Exportación de reportes y fichas a PDF.
- **xlsx:** Exportación de reportes a Excel.
- **Vitest:** Testing unitario y de integración.

### Backend
- **Express:** API RESTful, middlewares y control de rutas.
- **Prisma ORM:** Acceso y migración de base de datos relacional (SQLite).
- **TypeScript:** Seguridad de tipos y mejor DX.
- **dotenv:** Gestión de variables de entorno.

---

## 🧪 Testing: Cómo se hicieron y cómo probar

### Pruebas Automáticas
- **Vitest** en frontend (`src/tests/`):
  - Ejemplo: test unitario de servicios API y test de integración de exportación de ficha.
  - Ejecuta: `npx vitest run`
  - Resultado esperado: todos los tests pasan.

### Pruebas Manuales
- **Checklist** (ver sección anterior):
  - Login/logout, rutas protegidas, CRUD, exportaciones, feedback de errores, modo oscuro, etc.
- **Cómo se identifican errores:**
  - El frontend muestra mensajes claros y minimalistas ante errores de login, inscripción, formularios y acciones fallidas.
  - El backend retorna errores HTTP con mensajes descriptivos (ej: campos requeridos, duplicados, no encontrado).
  - Se recomienda revisar la consola del navegador y del backend para detalles técnicos.

---

## 👤 Guía de Usuario: ¿Cómo usar la app?

1. **Login:**
   - Ingresa con las credenciales demo (ver abajo) o con un usuario real.
   - El sistema detecta tu rol y muestra solo las opciones relevantes.

2. **Navegación:**
   - El menú lateral te permite acceder a Dashboard, Estudiantes, Calificaciones, Asistencia, Resumen, Cursos (admin), Inscripción (admin) y Calendario.
   - El modo oscuro se activa/desactiva desde el menú.

3. **Dashboard:**
   - Visualiza un resumen de tus cursos, estudiantes, asistencias y calificaciones.
   - Acceso rápido a las principales acciones según tu rol.

4. **Estudiantes:**
   - Lista de estudiantes con búsqueda y acceso a la ficha completa.
   - Desde la ficha puedes ver calificaciones, asistencias, observaciones y exportar todo a PDF.
   - Los profesores pueden agregar, editar y eliminar observaciones.

5. **Cursos y Asignaturas:**
   - Solo el admin puede gestionar cursos y asignaturas.
   - Visualiza detalles y estudiantes inscritos.

6. **Calificaciones y Asistencia:**
   - Gestiona y visualiza calificaciones y asistencias de tus estudiantes.
   - Exporta reportes a PDF o Excel.

7. **Inscripción:**
   - Solo el admin puede inscribir estudiantes en cursos.
   - El sistema valida y muestra feedback inmediato.

8. **Resumen Académico:**
   - Consulta estadísticas globales y top de asignaturas.
   - Exporta el resumen a PDF o Excel.

9. **Errores y Feedback:**
   - Todos los formularios y acciones muestran mensajes claros en caso de error o éxito.
   - El diseño es minimalista y enfocado en la usabilidad.

---

## 👤 Credenciales Demo

- **Administrador**
  - Email: `admin@demo.com`
  - Contraseña: `123456`
- **Profesor 1**
  - Email: `profesor1@demo.com`
  - Contraseña: `123456`
- **Profesor 2**
  - Email: `profesor2@demo.com`
  - Contraseña: `123456`

---

## 🛠️ Troubleshooting y Buenas Prácticas

### **Errores Comunes y Soluciones:**

#### **Error: "command not found: node"**
- **Solución:** Instala Node.js desde [nodejs.org](https://nodejs.org/)

#### **Error: "prisma command not found"**
- **Solución:** Ejecuta `npm install` en el directorio backend

#### **Error: "database locked"**
- **Solución:** Cierra otros procesos que usen la base de datos o reinicia el servidor

#### **Error: "port already in use"**
- **Solución:** Cambia el puerto en el archivo de configuración o cierra otros servicios

#### **Error: "module not found"**
- **Solución:** Ejecuta `npm install` en el directorio correspondiente

#### **Error de compilación TypeScript**
- **Solución:** Verifica que tienes TypeScript instalado: `npm install -g typescript`

### **Comandos Útiles:**
```bash
# Verificar versiones
node --version
npm --version

# Limpiar cache de npm
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Regenerar Prisma
npx prisma generate
npx prisma migrate reset

# Ejecutar tests
npx vitest run

# Compilar para producción
npm run build
```

### **Buenas Prácticas:**
- Siempre ejecuta `npm install` después de clonar el proyecto
- Mantén Node.js actualizado
- Usa un editor con soporte para TypeScript (VS Code recomendado)
- Revisa la consola del navegador y del servidor para errores
- El código sigue buenas prácticas de TypeScript, Express y React

---

## 📄 Documentación y Arquitectura
- Consulta `Arquidiseño.md` para detalles de arquitectura y decisiones de diseño.
- El código está documentado y sigue buenas prácticas de TypeScript y Express.

---

## 👨‍💼 Manual de Usuario para el Administrador

Esta sección describe las principales funciones y el flujo de trabajo para el usuario con rol **Administrador** en la plataforma GestorDeNotas.

### 1. **Acceso y Navegación**
- Ingresa con tu usuario administrador.
- El menú lateral te da acceso a todas las secciones: Dashboard, Cursos, Estudiantes, Profesores, Materias, Calificaciones, Asistencia, Resumen y utilidades como el Calendario.
- Puedes alternar entre modo claro y oscuro desde el botón en la parte inferior del menú.

### 2. **Gestión de Estudiantes**
- Accede a la sección **Estudiantes** para ver el listado completo.
- Puedes **agregar**, **editar** o **eliminar** estudiantes usando los botones correspondientes.
- Haz clic en "Ver Ficha" para ver detalles, calificaciones, asistencias y observaciones de cada estudiante.
- Desde la ficha puedes exportar la información a PDF.
- Usa el botón "Gestionar observaciones" para ver, agregar, editar o eliminar observaciones de cualquier estudiante.

### 3. **Gestión de Profesores**
- En la sección **Profesores** puedes ver, agregar, editar y eliminar profesores.
- El admin puede asignar profesores a materias desde la sección Materias.

### 4. **Gestión de Materias (Asignaturas)**
- En **Materias** puedes crear, editar y eliminar materias.
- Al crear o editar una materia puedes asignar uno o varios profesores.
- Puedes gestionar los profesores de cada materia desde el botón de gestión en la tarjeta de materia.

### 5. **Gestión de Cursos**
- En **Cursos** puedes crear, editar y eliminar cursos.
- Asigna un jefe de curso (profesor responsable) al crear o editar un curso.
- Haz clic en el botón de estudiantes (👥) para ver todos los estudiantes inscritos en ese curso en un modal grande y acceder a su ficha.

### 6. **Calificaciones y Asistencia**
- En **Calificaciones** puedes ver, agregar, editar y eliminar calificaciones de los estudiantes.
- En **Asistencia** puedes gestionar la asistencia diaria de los estudiantes.

### 7. **Resumen Académico y Reportes**
- En la sección **Resumen** puedes ver estadísticas globales: total de estudiantes, cursos, promedio general, tasa de asistencia y top de asignaturas.
- Puedes exportar el resumen a PDF o Excel con un clic.

### 8. **Utilidades y Modo Oscuro**
- Accede al **Calendario** para ver eventos escolares.
- Cambia entre modo claro y oscuro desde el botón en la parte inferior izquierda.

### 9. **Tips de Uso y Accesibilidad**
- El menú lateral es completamente navegable con teclado y accesible.
- Todos los formularios validan los campos antes de enviar.
- Los modales pueden cerrarse con ESC o clic fuera.
- El botón de cerrar sesión está siempre visible al fondo del menú.

### 10. **Seguridad y Roles**
- Solo el administrador puede acceder a la gestión completa de cursos, materias y usuarios.
- Los profesores solo ven y gestionan sus propios cursos y estudiantes.

---

## 👨‍🏫 **Flujo del Profesor (2024)**

El sistema ofrece una experiencia moderna, clara y responsiva para profesores:

### **Dashboard del Profesor**
- Minimalista: solo muestra el título "Panel del Profesor".
- Sin botones ni widgets extra para máxima concentración.

### **Gestión de Cursos**
- Lista de cursos asignados al profesor.
- Botón para ver estudiantes de cada curso: abre un modal responsive con la lista completa.
- Feedback visual de carga y errores.
- Modal accesible y fácil de cerrar.

### **Gestión de Calificaciones**
- Selección en cascada: primero curso, luego estudiante, luego materia.
- Formulario para ingresar calificación, con validaciones y feedback.
- Tabla de calificaciones recientes (máx. 5).
- CRUD completo: crear, editar, eliminar calificaciones.
- Mensajes de éxito/error claros y visibles.
- Layout y controles 100% responsivos.

### **Registro de Asistencia**
- Selección de curso (solo los del profesor).
- Al seleccionar curso, muestra estudiantes automáticamente.
- Checks para marcar asistencia (presente/ausente) con feedback visual inmediato.
- Botón para guardar asistencia, deshabilitado mientras guarda o si no hay estudiantes.
- Mensaje de guardado destacado y visible.

### **Observaciones**
- Listado de observaciones recientes por estudiante.
- Colores diferenciados para positiva, negativa y neutro.
- Acciones rápidas y feedback visual.

### **Responsividad y Accesibilidad**
- Todos los componentes clave se adaptan a pantallas pequeñas.
- Botones y campos con buen tamaño táctil.
- Mensajes de feedback claros y accesibles.

---

## 🧑‍💻 **¿Cómo contribuir o personalizar?**
- El código está modularizado y documentado.
- Puedes agregar nuevas vistas, widgets o flujos fácilmente.
- Sugerencias: agregar paginación, búsqueda, edición en línea, mejoras de accesibilidad, o widgets personalizados en el dashboard.

---

> Proyecto desarrollado por Epimete0 y colaboradores.

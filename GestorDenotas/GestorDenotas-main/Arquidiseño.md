sistema-gestion-escolar/
├── README.md # Descripción general, propósito y guía de arranque
├── docs/ # Documentación de análisis y diseño
│ ├── arquitectura_4plus1.md # Vistas Lógica, Desarrollo, Procesos, Física, Escenarios
│ ├── requisitos.md # Lista de requisitos funcionales y no funcionales
│ └── diseño_uml/ # Diagramas UML en PlantUML o imágenes
│ ├── casos_de_uso.puml
│ ├── clases.puml
│ └── secuencia.puml
├── frontend/ # Aplicación cliente (React)
│ ├── package.json
│ ├── public/
│ │ └── index.html
│ └── src/
│ ├── components/ # Componentes reutilizables
│ ├── pages/ # Vistas principales
│ ├── services/ # Llamadas a API
│ ├── App.jsx
│ └── index.jsx
├── backend/ # API y lógica de negocio (Node.js/Express)
│ ├── package.json
│ ├── src/
│ │ ├── controllers/ # Rutas y controladores HTTP
│ │ ├── services/ # Lógica de dominio (Service Layer)
│ │ ├── repositories/ # Acceso a datos (Repository Pattern)
│ │ ├── models/ # Definición de esquemas y entidades
│ │ └── app.js # Configuración de servidor y middlewares
│ └── config/ # Variables de entorno y configuración DB (Singleton para conexión)
├── database/ # Scripts de base de datos
│ ├── schema.sql # Definición de tablas y relaciones
│ └── seeds.sql # Datos de prueba
├── deploy/ # Despliegue y entornos
│ ├── docker-compose.yml # Orquestación de contenedores
│ ├── Dockerfile.frontend
│ └── Dockerfile.backend
├── tests/ # Pruebas automatizadas
│ ├── frontend/ # Tests unitarios y de integración UI
│ └── backend/ # Tests unitarios de servicios y repositorios

# Arquitectura en Capas (N-Tier)

1. **Capa de Presentación**
   - Carpeta `frontend/` con React + TypeScript.
2. **Capa de Negocio (Service Layer)**
   - `backend/src/services/` implementa la lógica de dominio.
3. **Capa de Persistencia (Data Layer)**
   - `backend/src/repositories/` encapsula acceso a PostgreSQL a través de ORM (Prisma).

Para documentar la arquitectura usaremos el Modelo 4+1 Vistas:

- **Lógica**: Diagrama de clases y relaciones.
- **Desarrollo**: Estructura de módulos y paquetes.
- **Procesos**: Flujos de ejecución y concurrencia.
- **Física**: Despliegue de componentes en servidores y contenedores.
- **Escenarios**: Casos de uso que validan las demás vistas.

# Patrones de Diseño Aplicados

- **Repository**: Interfaces en `backend/src/repositories/` para CRUD en cada entidad.
- **Service**: Clases en `backend/src/services/` que orquestan casos de uso.
- **Singleton**: Única instancia de conexión a BD en `backend/src/config/`.
- **Factory Method**: Creación de reportes (`ReportePDF`, `ReporteExcel`).
- **Observer**: Subscripción a eventos de inasistencia y calificaciones nuevas para notificaciones.
- **Strategy**: Algoritmos intercambiables de cálculo de promedios y estadísticas.

## Demo Local y Tecnologías

### Tecnologías para la versión demo (local)

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **ORM**: Prisma con SQLite (base de datos embebida para demo)
- **BPMN/UML**: PlantUML para diagramas en `docs/diseño_uml/`
- **Scripts**: npm/yarn para scripts de arranque

# App de Autenticación en AWS

API REST de autenticación con JWT desplegada en AWS.

## Demo
![Login](screenshots/login.png)
![Register](screenshots/register.png)

## Arquitectura
- **EC2** (Amazon Linux 2023 + Node.js 18)
- **RDS** MySQL 8.0 (capa privada)
- **IAM** Role con mínimos privilegios
- **Elastic IP** 3.131.240.191

![EC2](screenshots/ec2.png)
![RDS](screenshots/rds.png)
![IAM](screenshots/iam.png)
![Tablas](screenshots/tables.png)
![Data](screenshots/data.png)

## Tecnologías
Express · MySQL2 · bcryptjs · jsonwebtoken · PM2

## Endpoints
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /register | Registro de usuario |
| POST | /login | Login + JWT |

## Configuración
Copia `.env.example` a `.env` y completa tus credenciales.

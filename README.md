# MEDORA — Backend API

FastAPI backend service for the MEDORA AI-assisted chest X-ray annotation workstation.

## Tech Stack
- **Framework**: FastAPI (Python 3.14+)
- **Authentication**: FastAPI Users with JWT Bearer transport
- **Database**: PostgreSQL (Supabase) via SQLAlchemy 2.0 & asyncpg / psycopg3
- **Migrations**: Alembic
- **Storage**: Supabase Storage

## Getting Started

1. Set up virtual environment:
   \\\ash
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   pip install -r requirements.txt
   \\\

2. Configure environment:
   Copy \.env.example\ to \.env\ and add your Supabase credentials:
   \\\ash
   cp .env.example .env
   \\\

3. Run database migrations:
   \\\ash
   alembic upgrade head
   \\\

4. Start development server:
   \\\ash
   uvicorn main:app --reload --port 8000
   \\\

5. API Documentation:
   - Interactive Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

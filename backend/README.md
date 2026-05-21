# Freediary Backend Setup

## Prerequisites
- Python 3.9+
- pip
- (Optional) Virtual environment

## Installation Steps

1. Clone the repository
```bash
git clone https://your-repo-url.git
cd freediary/backend
```

2. Create a virtual environment (recommended)
```bash
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Configure Environment Variables
- Copy `.env.example` to `.env`
- Edit `.env` with your specific configuration
```bash
cp .env.example .env
# Edit .env with your preferred text editor
```

5. Run Database Migrations (if applicable)
```bash
# Add your database migration command here
```

6. Start the Development Server
```bash
uvicorn app.main:app --reload
```

## Environment Variables Explanation
- `DATABASE_URL`: Connection string for your database
- `SECRET_KEY`: Used for security-related operations
- `ALGORITHM`: JWT token encryption algorithm
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time
- `DEBUG`: Enable/disable debug mode
- `CORS_ORIGINS`: Allowed frontend origins

## Deployment Notes
- Never commit your actual `.env` file to version control
- Use environment-specific configurations
- Ensure `SECRET_KEY` is a long, random string in production
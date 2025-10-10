# Medique Hospital Management System - Development Setup

## Quick Start Guide

### 1. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Setup MySQL database
mysql -u root -p
CREATE DATABASE hospital;
USE hospital;
SOURCE hospital.sql;

# Run Flask server
python app.py
```

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 3. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Database Credentials
Update the database connection in `app.py`:
```python
db = mysql.connector.connect(
    host="localhost",
    user="your_username",
    password="your_password",
    database="hospital"
)
```

## Sample Data
The `hospital.sql` file contains sample data for testing:
- 10 patients
- 10 doctors
- 10 appointments
- 10 consultations
- 10 billing records
- 10 queue entries

## Troubleshooting

### Common Issues:
1. **Database Connection Error**: Check MySQL credentials and ensure database exists
2. **CORS Error**: Ensure Flask-CORS is installed and configured
3. **Port Already in Use**: Change ports in app.py or package.json

### Dependencies:
- Python 3.7+
- Node.js 14+
- MySQL 8.0+
- npm or yarn

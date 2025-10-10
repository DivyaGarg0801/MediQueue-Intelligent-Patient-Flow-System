# Medique Hospital Management System

A comprehensive hospital management system built with Flask backend and React frontend.

## Features

- **Patient Management**: Add, edit, delete, and view patient information
- **Doctor Management**: Manage doctor profiles, specializations, and availability
- **Appointment Scheduling**: Schedule appointments with priority levels
- **Consultation Records**: Track symptoms and prescriptions
- **Billing System**: Generate bills and track payment status
- **Queue Management**: Monitor patient queue status
- **Dashboard**: Overview of key metrics and statistics

## Technology Stack

### Backend
- **Flask**: Python web framework
- **MySQL**: Database management
- **Flask-CORS**: Cross-origin resource sharing
- **mysql-connector-python**: MySQL database connector

### Frontend
- **React**: JavaScript library for building user interfaces
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **CSS3**: Styling and responsive design

## Project Structure

```
MediqueProject/
├── app.py                 # Flask backend application
├── hospital.sql           # Database schema and sample data
├── requirements.txt       # Python dependencies
├── frontend/             # React frontend application
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── Dashboard.js
│   │   │   ├── Patients.js
│   │   │   ├── Doctors.js
│   │   │   ├── Appointments.js
│   │   │   ├── Consultations.js
│   │   │   ├── Billing.js
│   │   │   └── Queue.js
│   │   ├── services/
│   │   │   └── api.js    # API service layer
│   │   ├── App.js        # Main React component
│   │   ├── index.js      # React entry point
│   │   └── index.css     # Global styles
│   └── package.json      # Node.js dependencies
└── README.md             # Project documentation
```

## Getting Started

### Prerequisites

- Python 3.7+
- Node.js 14+
- MySQL 8.0+
- npm or yarn

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Setup MySQL database:**
   - Create a MySQL database named `hospital`
   - Import the database schema:
   ```bash
   mysql -u root -p hospital < hospital.sql
   ```

3. **Configure database connection:**
   - Update database credentials in `app.py`:
   ```python
   db = mysql.connector.connect(
       host="localhost",
       user="your_username",
       password="your_password",
       database="hospital"
   )
   ```

4. **Run the Flask server:**
   ```bash
   python app.py
   ```
   The backend will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the React development server:**
   ```bash
   npm start
   ```
   The frontend will be available at `http://localhost:3000`

## Database Schema

The system uses the following main tables:

- **patient**: Patient information (name, age, gender, contact, address)
- **doctor**: Doctor profiles (name, specialization, availability)
- **appointment**: Appointment scheduling (patient, doctor, date, time, priority, status)
- **consultation**: Consultation records (symptoms, prescription)
- **billing**: Billing information (amount, payment status)
- **queue**: Queue management (appointment status)

## API Endpoints

### Patients
- `GET /patients` - Get all patients
- `POST /patients` - Create new patient
- `PUT /patients/<id>` - Update patient
- `DELETE /patients/<id>` - Delete patient

### Doctors
- `GET /doctors` - Get all doctors
- `POST /doctors` - Create new doctor
- `PUT /doctors/<id>` - Update doctor
- `DELETE /doctors/<id>` - Delete doctor

### Appointments
- `GET /appointments` - Get all appointments
- `POST /appointments` - Create new appointment
- `PUT /appointments/<id>` - Update appointment
- `DELETE /appointments/<id>` - Delete appointment

### Consultations
- `GET /consultations` - Get all consultations
- `POST /consultations` - Create new consultation
- `PUT /consultations/<id>` - Update consultation
- `DELETE /consultations/<id>` - Delete consultation

### Billing
- `GET /billing` - Get all bills
- `POST /billing` - Create new bill
- `PUT /billing/<id>` - Update bill
- `DELETE /billing/<id>` - Delete bill

### Queue
- `GET /queue` - Get all queue entries
- `POST /queue` - Add to queue
- `PUT /queue/<id>` - Update queue entry
- `DELETE /queue/<id>` - Delete queue entry

## Features Overview

### Dashboard
- Real-time statistics
- Total patients, doctors, appointments
- Revenue tracking

### Patient Management
- Complete patient profiles
- Contact information
- Medical history tracking

### Doctor Management
- Doctor profiles and specializations
- Availability scheduling
- Department management

### Appointment System
- Priority-based scheduling
- Status tracking (Scheduled, Completed, Cancelled)
- Time slot management

### Consultation Records
- Symptom documentation
- Prescription management
- Medical notes

### Billing System
- Invoice generation
- Payment status tracking
- Revenue analytics

### Queue Management
- Real-time queue status
- Patient flow optimization
- Status updates

## Security Considerations

- Input validation on both frontend and backend
- SQL injection prevention
- CORS configuration
- Error handling and logging

## Deployment

### Backend Deployment
1. Use a production WSGI server like Gunicorn
2. Configure environment variables for database credentials
3. Set up proper logging and monitoring

### Frontend Deployment
1. Build the React application: `npm run build`
2. Serve static files using a web server like Nginx
3. Configure API endpoint URLs for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.

---

**Medique Hospital Management System** - Streamlining healthcare operations with modern technology.

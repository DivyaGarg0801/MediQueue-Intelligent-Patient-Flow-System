from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS
from datetime import date, datetime, timedelta
import os

app = Flask(__name__)
CORS(app)  # Allow React frontend to access APIs

# ----------------------------
# Step 2: Database connection (SQLite)
# ----------------------------
def get_db_connection():
    conn = sqlite3.connect('hospital.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    
    # Create tables
    conn.execute('''
        CREATE TABLE IF NOT EXISTS patient (
            p_id INTEGER PRIMARY KEY AUTOINCREMENT,
            p_name TEXT NOT NULL,
            age INTEGER,
            gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
            contact TEXT,
            address TEXT
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS doctor (
            d_id INTEGER PRIMARY KEY AUTOINCREMENT,
            d_name TEXT NOT NULL,
            specialization TEXT,
            availability TEXT
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS appointment (
            a_id INTEGER PRIMARY KEY AUTOINCREMENT,
            p_id INTEGER,
            d_id INTEGER,
            date TEXT,
            time TEXT,
            priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')),
            a_status TEXT CHECK(a_status IN ('Scheduled', 'Completed', 'Cancelled')),
            FOREIGN KEY (p_id) REFERENCES patient (p_id),
            FOREIGN KEY (d_id) REFERENCES doctor (d_id)
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS consultation (
            c_id INTEGER PRIMARY KEY AUTOINCREMENT,
            a_id INTEGER,
            symptoms TEXT,
            prescription TEXT,
            FOREIGN KEY (a_id) REFERENCES appointment (a_id)
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS billing (
            b_id INTEGER PRIMARY KEY AUTOINCREMENT,
            a_id INTEGER,
            billing_date TEXT,
            amount REAL,
            payment_status TEXT CHECK(payment_status IN ('Pending', 'Paid', 'Cancelled')),
            FOREIGN KEY (a_id) REFERENCES appointment (a_id)
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS queue (
            q_id INTEGER PRIMARY KEY AUTOINCREMENT,
            a_id INTEGER,
            q_status TEXT CHECK(q_status IN ('Waiting', 'In Progress', 'Completed', 'Cancelled')),
            FOREIGN KEY (a_id) REFERENCES appointment (a_id)
        )
    ''')
    
    # Insert sample data if tables are empty
    if not conn.execute('SELECT COUNT(*) FROM patient').fetchone()[0]:
        sample_patients = [
            ('Rahul Sharma', 34, 'Male', '9876543210', 'Delhi'),
            ('Priya Verma', 28, 'Female', '9898989898', 'Mumbai'),
            ('Amit Singh', 45, 'Male', '9123456789', 'Bangalore'),
            ('Sneha Kapoor', 31, 'Female', '9812345678', 'Chennai'),
            ('Rohit Mehta', 52, 'Male', '9900112233', 'Kolkata')
        ]
        conn.executemany('INSERT INTO patient (p_name, age, gender, contact, address) VALUES (?, ?, ?, ?, ?)', sample_patients)
    
    if not conn.execute('SELECT COUNT(*) FROM doctor').fetchone()[0]:
        sample_doctors = [
            ('Dr. Meena Iyer', 'Cardiologist', 'Mon-Fri 10am-4pm'),
            ('Dr. Arjun Rao', 'Dermatologist', 'Tue-Sat 11am-3pm'),
            ('Dr. Kavita Gupta', 'Pediatrician', 'Mon-Sat 9am-5pm'),
            ('Dr. Sameer Khan', 'Orthopedic', 'Mon-Fri 12pm-6pm'),
            ('Dr. Sunita Mishra', 'Neurologist', 'Wed-Sun 10am-2pm')
        ]
        conn.executemany('INSERT INTO doctor (d_name, specialization, availability) VALUES (?, ?, ?)', sample_doctors)
    
    conn.commit()
    conn.close()

# Initialize database
init_db()

# ----------------------------
# Helper: convert dates to str
# ----------------------------
def convert_dates(rows):
    for row in rows:
        for key, value in row.items():
            if isinstance(value, (date, datetime, timedelta)):
                row[key] = str(value)
    return rows


# ----------------------------
# Patient Routes
# ----------------------------
@app.route("/patients", methods=["GET"])
def get_patients():
    conn = get_db_connection()
    patients = conn.execute('SELECT * FROM patient').fetchall()
    conn.close()
    return jsonify([dict(row) for row in patients])

@app.route("/patients", methods=["POST"])
def add_patient():
    data = request.json
    conn = get_db_connection()
    conn.execute('INSERT INTO patient (p_name, age, gender, contact, address) VALUES (?, ?, ?, ?, ?)',
                 (data["p_name"], data["age"], data["gender"], data["contact"], data["address"]))
    conn.commit()
    conn.close()
    return jsonify({"message": "Patient added successfully!"})

@app.route("/patients/<int:p_id>", methods=["PUT"])
def update_patient(p_id):
    data = request.json
    conn = get_db_connection()
    conn.execute('UPDATE patient SET p_name=?, age=?, gender=?, contact=?, address=? WHERE p_id=?',
                 (data["p_name"], data["age"], data["gender"], data["contact"], data["address"], p_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Patient updated successfully!"})

@app.route("/patients/<int:p_id>", methods=["DELETE"])
def delete_patient(p_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM patient WHERE p_id=?', (p_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Patient deleted!"})


# ----------------------------
# Doctor Routes
# ----------------------------
@app.route("/doctors", methods=["GET"])
def get_doctors():
    conn = get_db_connection()
    doctors = conn.execute('SELECT * FROM doctor').fetchall()
    conn.close()
    return jsonify([dict(row) for row in doctors])

@app.route("/doctors", methods=["POST"])
def add_doctor():
    data = request.json
    conn = get_db_connection()
    conn.execute('INSERT INTO doctor (d_name, specialization, availability) VALUES (?, ?, ?)',
                 (data["d_name"], data["specialization"], data["availability"]))
    conn.commit()
    conn.close()
    return jsonify({"message": "Doctor added successfully!"})

@app.route("/doctors/<int:d_id>", methods=["PUT"])
def update_doctor(d_id):
    data = request.json
    conn = get_db_connection()
    conn.execute('UPDATE doctor SET d_name=?, specialization=?, availability=? WHERE d_id=?',
                 (data["d_name"], data["specialization"], data["availability"], d_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Doctor updated successfully!"})

@app.route("/doctors/<int:d_id>", methods=["DELETE"])
def delete_doctor(d_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM doctor WHERE d_id=?', (d_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Doctor deleted!"})


# ----------------------------
# Appointment Routes
# ----------------------------
@app.route("/appointments", methods=["GET"])
def get_appointments():
    conn = get_db_connection()
    appointments = conn.execute('SELECT * FROM appointment').fetchall()
    conn.close()
    return jsonify([dict(row) for row in appointments])

@app.route("/appointments", methods=["POST"])
def add_appointment():
    data = request.json
    conn = get_db_connection()
    conn.execute('INSERT INTO appointment (p_id, d_id, date, time, priority, a_status) VALUES (?, ?, ?, ?, ?, ?)',
                 (data["p_id"], data["d_id"], data["date"], data["time"], data["priority"], data["a_status"]))
    conn.commit()
    conn.close()
    return jsonify({"message": "Appointment created!"})

@app.route("/appointments/<int:a_id>", methods=["PUT"])
def update_appointment(a_id):
    data = request.json
    conn = get_db_connection()
    conn.execute('UPDATE appointment SET p_id=?, d_id=?, date=?, time=?, priority=?, a_status=? WHERE a_id=?',
                 (data["p_id"], data["d_id"], data["date"], data["time"], data["priority"], data["a_status"], a_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Appointment updated!"})

@app.route("/appointments/<int:a_id>", methods=["DELETE"])
def delete_appointment(a_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM appointment WHERE a_id=?', (a_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Appointment deleted!"})


# ----------------------------
# Queue Routes
# ----------------------------
@app.route("/queue", methods=["GET"])
def get_queue():
    conn = get_db_connection()
    queue = conn.execute('SELECT * FROM queue').fetchall()
    conn.close()
    return jsonify([dict(row) for row in queue])

@app.route("/queue", methods=["POST"])
def add_queue():
    data = request.json
    conn = get_db_connection()
    conn.execute('INSERT INTO queue (a_id, q_status) VALUES (?, ?)',
                 (data["a_id"], data["q_status"]))
    conn.commit()
    conn.close()
    return jsonify({"message": "Queue entry added!"})

@app.route("/queue/<int:q_id>", methods=["PUT"])
def update_queue(q_id):
    data = request.json
    conn = get_db_connection()
    conn.execute('UPDATE queue SET a_id=?, q_status=? WHERE q_id=?',
                 (data["a_id"], data["q_status"], q_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Queue updated!"})

@app.route("/queue/<int:q_id>", methods=["DELETE"])
def delete_queue(q_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM queue WHERE q_id=?', (q_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Queue deleted!"})


# ----------------------------
# Consultation Routes
# ----------------------------
@app.route("/consultations", methods=["GET"])
def get_consultations():
    conn = get_db_connection()
    consultations = conn.execute('SELECT * FROM consultation').fetchall()
    conn.close()
    return jsonify([dict(row) for row in consultations])

@app.route("/consultations", methods=["POST"])
def add_consultation():
    data = request.json
    conn = get_db_connection()
    conn.execute('INSERT INTO consultation (a_id, symptoms, prescription) VALUES (?, ?, ?)',
                 (data["a_id"], data["symptoms"], data["prescription"]))
    conn.commit()
    conn.close()
    return jsonify({"message": "Consultation added!"})

@app.route("/consultations/<int:c_id>", methods=["PUT"])
def update_consultation(c_id):
    data = request.json
    conn = get_db_connection()
    conn.execute('UPDATE consultation SET a_id=?, symptoms=?, prescription=? WHERE c_id=?',
                 (data["a_id"], data["symptoms"], data["prescription"], c_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Consultation updated!"})

@app.route("/consultations/<int:c_id>", methods=["DELETE"])
def delete_consultation(c_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM consultation WHERE c_id=?', (c_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Consultation deleted!"})


# ----------------------------
# Billing Routes
# ----------------------------
@app.route("/billing", methods=["GET"])
def get_bills():
    conn = get_db_connection()
    bills = conn.execute('SELECT * FROM billing').fetchall()
    conn.close()
    return jsonify([dict(row) for row in bills])

@app.route("/billing", methods=["POST"])
def add_bill():
    data = request.json
    conn = get_db_connection()
    conn.execute('INSERT INTO billing (a_id, billing_date, amount, payment_status) VALUES (?, ?, ?, ?)',
                 (data["a_id"], data["billing_date"], data["amount"], data["payment_status"]))
    conn.commit()
    conn.close()
    return jsonify({"message": "Bill added!"})

@app.route("/billing/<int:b_id>", methods=["PUT"])
def update_bill(b_id):
    data = request.json
    conn = get_db_connection()
    conn.execute('UPDATE billing SET a_id=?, billing_date=?, amount=?, payment_status=? WHERE b_id=?',
                 (data["a_id"], data["billing_date"], data["amount"], data["payment_status"], b_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Bill updated!"})

@app.route("/billing/<int:b_id>", methods=["DELETE"])
def delete_bill(b_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM billing WHERE b_id=?', (b_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Bill deleted!"})


# ----------------------------
# Step 4: Run Server
# ----------------------------
if __name__ == "__main__":
    print("Medique Hospital Management System")
    print("Backend server starting on http://localhost:5001")
    print("Database: SQLite (hospital.db)")
    app.run(debug=True, host='0.0.0.0', port=5001)

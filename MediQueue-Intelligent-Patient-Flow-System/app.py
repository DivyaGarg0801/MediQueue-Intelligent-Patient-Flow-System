from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import random
from datetime import date, datetime, time, timedelta

app = Flask(__name__)
CORS(app)

# ----------------------------
# DATABASE CONNECTION
# ----------------------------
def get_connection():
    """Create a new MySQL connection for each request."""
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="root",
            database="clinic"
        )
        return conn
    except Error as e:
        print("❌ Database connection error:", e)
        return None


# ----------------------------
# HELPER FUNCTIONS
# ----------------------------
def convert_dates(rows):
    """Convert MySQL date/time objects to strings for JSON serialization."""
    for row in rows:
        for key, value in row.items():
            if isinstance(value, (date, datetime, timedelta)):
                row[key] = str(value)
    return rows


def _get_queue_status_column(conn):
    """Return the column name used to store queue status (q_status or status)."""
    cursor = conn.cursor()
    try:
        cursor.execute("SHOW COLUMNS FROM queue LIKE 'q_status'")
        if cursor.fetchone():
            return "q_status"
        cursor.execute("SHOW COLUMNS FROM queue LIKE 'status'")
        if cursor.fetchone():
            return "status"
    finally:
        cursor.close()
    raise RuntimeError("Queue status column not found")


# ----------------------------
# ROOT
# ----------------------------
@app.route("/")
def home():
    return jsonify({"message": "✅ MediQueue API is running successfully!"})


# ----------------------------
# LOGIN & REGISTRATION
# ----------------------------
otp_storage = {}  # {contact: otp}

@app.route("/send_otp", methods=["POST"])
def send_otp():
    data = request.json
    contact = data.get("contact")

    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)

    # Check contact across patient, doctor, admin
    user_role = None
    user_id = None
    for table, role, id_field in [
        ("patient", "patient", "p_id"),
        ("doctor", "doctor", "d_id"),
        ("admin", "admin", "admin_id")
    ]:
        cursor.execute(f"SELECT {id_field} FROM {table} WHERE contact = %s", (contact,))
        row = cursor.fetchone()
        if row:
            user_role = role
            user_id = row[id_field]
            break

    cursor.close()
    conn.close()

    if not user_role:
        return jsonify({"error": "No user found with this contact. Please register first."}), 404

    otp = random.randint(1000, 9999)
    otp_storage[contact] = otp
    print(f"DEBUG → OTP for {contact} ({user_role}): {otp}")
    return jsonify({"message": "OTP sent successfully", "role": user_role, "id": user_id})


@app.route("/verify_otp", methods=["POST"])
def verify_otp():
    data = request.json
    contact = data.get("contact")
    otp = int(data.get("otp", 0))

    if otp_storage.get(contact) == otp:
        del otp_storage[contact]
        return jsonify({"message": "OTP verified successfully!"})
    else:
        return jsonify({"error": "Invalid OTP!"}), 400


@app.route("/register", methods=["POST"])
def register_patient():
    data = request.json
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor()
    sql = """INSERT INTO patient (p_name, age, gender, contact)
             VALUES (%s, %s, %s, %s)"""
    values = (data["p_name"], data["age"], data["gender"], data["contact"])
    cursor.execute(sql, values)
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Registration successful!"})


# ----------------------------
# PATIENT ROUTES
# ----------------------------
@app.route("/patients", methods=["GET"])
def get_patients():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM patient")
    data = convert_dates(cursor.fetchall())
    cursor.close()
    conn.close()
    return jsonify(data)

@app.route("/patients/<int:p_id>", methods=["GET"])
def get_patient_by_id(p_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM patient WHERE p_id=%s", (p_id,))
    patient = cursor.fetchone()
    cursor.close()
    conn.close()
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify(patient)


@app.route("/patients/<int:p_id>", methods=["PUT"])
def update_patient(p_id):
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    sql = """UPDATE patient
             SET p_name=%s, age=%s, gender=%s, contact=%s, address=%s
             WHERE p_id=%s"""
    values = (data["p_name"], data["age"], data["gender"], data["contact"], data["address"], p_id)
    cursor.execute(sql, values)
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Patient updated successfully!"})


@app.route("/patients/<int:p_id>", methods=["DELETE"])
def delete_patient(p_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        # Check if patient exists
        cursor.execute("SELECT p_id FROM patient WHERE p_id = %s", (p_id,))
        patient = cursor.fetchone()
        if not patient:
            cursor.close()
            conn.close()
            return jsonify({"error": "Patient not found"}), 404
        
        # Check if patient has appointments
        cursor.execute("SELECT a_id FROM appointment WHERE p_id = %s LIMIT 1", (p_id,))
        appointment = cursor.fetchone()
        if appointment:
            cursor.close()
            conn.close()
            return jsonify({"error": "Cannot delete patient with existing appointments"}), 400
        
        # Delete the patient
        cursor.execute("DELETE FROM patient WHERE p_id = %s", (p_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Patient deleted successfully!"})
    except Exception as e:
        print("❌ Error deleting patient:", e)
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Failed to delete patient: {str(e)}"}), 500

@app.route("/health_records/<int:patient_id>", methods=["GET"])
def get_health_records(patient_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    sql = """
        SELECT a.date, d.d_name AS doctor, h.symptoms, h.prescription
        FROM health_record h
        JOIN appointment a ON h.appointment_id = a.appointment_id
        JOIN doctor d ON a.doctor_id = d.doctor_id
        WHERE a.patient_id = %s
        ORDER BY a.date DESC
    """
    cursor.execute(sql, (patient_id,))
    data = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(data)

# ----------------------------
# DOCTOR ROUTES
# ----------------------------
@app.route("/doctors", methods=["GET"])
def get_doctors():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM doctor")
    data = convert_dates(cursor.fetchall())
    cursor.close()
    conn.close()
    return jsonify(data)


@app.route("/doctors", methods=["POST"])
def add_doctor():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    sql = """INSERT INTO doctor (d_name, specialization, availability, contact)
             VALUES (%s, %s, %s, %s)"""
    cursor.execute(sql, (data["d_name"], data["specialization"], data["availability"], data["contact"]))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Doctor added successfully!"})


# ----------------------------
# ADMIN ROUTES
# ----------------------------
@app.route("/admins", methods=["GET"])
def get_admins():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        # Check if admin table exists, if not create it and add default admin
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admin (
                admin_id INT AUTO_INCREMENT PRIMARY KEY,
                admin_name VARCHAR(100) NOT NULL,
                contact VARCHAR(10) NOT NULL UNIQUE,
                CHECK (contact REGEXP '^[0-9]{10}$')
            )
        """)
        
        # Check if admin exists, if not add default admin
        cursor.execute("SELECT admin_id FROM admin WHERE contact = '1234567890'")
        admin_exists = cursor.fetchone()
        if not admin_exists:
            cursor.execute("""
                INSERT INTO admin (admin_name, contact)
                VALUES ('System Admin', '1234567890')
            """)
            conn.commit()
        
        cursor.execute("SELECT * FROM admin")
        data = convert_dates(cursor.fetchall())
        cursor.close()
        conn.close()
        return jsonify(data)
    except Exception as e:
        print("❌ Error fetching admins:", e)
        cursor.close()
        conn.close()
        return jsonify({"error": f"Failed to fetch admins: {str(e)}"}), 500

@app.route("/doctors/<int:d_id>", methods=["DELETE"])
def delete_doctor(d_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        # Check if doctor exists
        cursor.execute("SELECT d_id FROM doctor WHERE d_id = %s", (d_id,))
        doctor = cursor.fetchone()
        if not doctor:
            cursor.close()
            conn.close()
            return jsonify({"error": "Doctor not found"}), 404
        
        # Check if doctor has appointments
        cursor.execute("SELECT a_id FROM appointment WHERE d_id = %s LIMIT 1", (d_id,))
        appointment = cursor.fetchone()
        if appointment:
            cursor.close()
            conn.close()
            return jsonify({"error": "Cannot delete doctor with existing appointments"}), 400
        
        # Delete the doctor
        cursor.execute("DELETE FROM doctor WHERE d_id = %s", (d_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Doctor deleted successfully!"})
    except Exception as e:
        print("❌ Error deleting doctor:", e)
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Failed to delete doctor: {str(e)}"}), 500


# ----------------------------
# APPOINTMENT ROUTES
# ----------------------------
from datetime import timedelta

from datetime import timedelta
from flask import jsonify

from flask import jsonify
import mysql.connector
from datetime import datetime, timedelta

from flask import jsonify
import mysql.connector
from datetime import datetime, timedelta, date, time as dtime

@app.route("/appointments", methods=["GET"])
def get_appointments():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="root",
            database="clinic"
        )
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                a.a_id AS id,
                p.p_name AS patient,
                d.d_name AS doctor,
                DATE(a.date) AS date,       -- ✅ only date part
                a.time AS time,
                a.status AS status
            FROM appointment a
            JOIN patient p ON a.p_id = p.p_id
            JOIN doctor d ON a.d_id = d.d_id
            ORDER BY a.date ASC, a.time ASC;
        """)

        rows = cursor.fetchall()
        cols = [desc[0] for desc in cursor.description]

        data = []
        for row in rows:
            row_dict = {}
            for col, val in zip(cols, row):
                # Convert all non-serializable types to strings
                if isinstance(val, (datetime, timedelta, date, dtime)):
                    val = str(val)
                row_dict[col] = val
            data.append(row_dict)

        cursor.close()
        conn.close()

        return jsonify(data)

    except Exception as e:
        print("❌ Error fetching appointments:", e)
        return jsonify({"error": str(e)})


@app.route("/appointments", methods=["POST"])
def add_appointment():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    sql = """INSERT INTO appointment (p_id, d_id, date, time, priority, a_status)
             VALUES (%s, %s, %s, %s, %s, %s)"""
    cursor.execute(sql, (data["p_id"], data["d_id"], data["date"], data["time"], data["priority"], data["a_status"]))
    conn.commit()

    cursor.execute("SELECT LAST_INSERT_ID() as a_id")
    a_id = cursor.fetchone()["a_id"]

    cursor.execute("SELECT payment_status FROM billing WHERE a_id=%s", (a_id,))
    bill = cursor.fetchone()
    if bill and bill["payment_status"].lower() == "paid":
        cursor.execute("INSERT INTO queue (a_id, q_status) VALUES (%s, %s)", (a_id, "Waiting"))
        conn.commit()

    cursor.close()
    conn.close()
    return jsonify({"message": "Appointment created successfully!"})

from datetime import datetime, time, timedelta

@app.route("/appointments/<int:a_id>/complete", methods=["POST"])
def complete_appointment(a_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Fetch appointment details
    cursor.execute("SELECT date, time, status FROM appointment WHERE a_id=%s", (a_id,))
    appointment = cursor.fetchone()

    if not appointment:
        cursor.close()
        conn.close()
        return jsonify({"error": "Appointment not found"}), 404

    if appointment["status"] == "Completed":
        cursor.close()
        conn.close()
        return jsonify({"message": "Appointment already completed"}), 400

    # Convert time if it's a timedelta
    appt_time = appointment["time"]
    if isinstance(appt_time, timedelta):
        total_seconds = appt_time.total_seconds()
        hours = int(total_seconds // 3600)
        minutes = int((total_seconds % 3600) // 60)
        seconds = int(total_seconds % 60)
        appt_time = time(hours, minutes, seconds)

    # Combine date and time
    appointment_datetime = datetime.combine(appointment["date"], appt_time)
    current_time = datetime.now()

    # Prevent marking before actual time
    if current_time < appointment_datetime:
        cursor.close()
        conn.close()
        return jsonify({"error": "Appointment cannot be marked as completed before scheduled time"}), 400

    # Update status
    cursor.execute("UPDATE appointment SET status='Completed' WHERE a_id=%s", (a_id,))

    try:
        queue_status_column = _get_queue_status_column(conn)
        cursor.execute(
            f"UPDATE queue SET {queue_status_column}=%s WHERE a_id=%s",
            ("Completed", a_id),
        )
    except RuntimeError:
        # Queue table might not exist; ignore gracefully
        pass

    conn.commit()

    cursor.close()
    conn.close()
    return jsonify({"message": "Appointment marked as completed"}), 200

@app.route("/book_appointment", methods=["POST"])
def book_appointment():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Normalize requested time to 30-min slot window [slot_start, slot_end)
    try:
        requested_time = datetime.strptime(data["time"], "%H:%M").time()
    except ValueError:
        # Fallback if seconds are passed
        requested_time = datetime.strptime(data["time"], "%H:%M:%S").time()

    slot_minute = 0 if requested_time.minute < 30 else 30
    slot_start = time(requested_time.hour, slot_minute, 0)
    # Compute slot_end
    slot_start_dt = datetime.combine(datetime.strptime(data["date"], "%Y-%m-%d").date(), slot_start)
    slot_end_dt = slot_start_dt + timedelta(minutes=30)
    slot_end = slot_end_dt.time()

    # Count existing bookings in the same half-hour slot for the doctor
    cursor.execute(
        """
        SELECT COUNT(*) AS cnt
        FROM appointment
        WHERE d_id = %s
          AND date = %s
          AND time >= %s AND time < %s
          AND status IN ('Scheduled','Waiting')
        """,
        (data["d_id"], data["date"], slot_start, slot_end),
    )
    count_row = cursor.fetchone()
    existing_in_slot = count_row["cnt"] if count_row else 0

    if existing_in_slot >= 5:
        cursor.close()
        conn.close()
        return jsonify({
            "error": "Selected time slot is full",
            "details": {
                "slot_start": slot_start.strftime("%H:%M"),
                "slot_end": slot_end.strftime("%H:%M"),
                "capacity": 5
            }
        }), 400

    # Proceed with booking
    sql = """INSERT INTO appointment (p_id, d_id, date, time, status)
             VALUES (%s, %s, %s, %s, %s)"""
    values = (data["p_id"], data["d_id"], data["date"], data["time"], "Scheduled")
    cursor.execute(sql, values)
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Appointment booked successfully!"})

@app.route("/doctors/<int:d_id>/available_slots", methods=["GET"])
def get_available_slots(d_id):
    """Return available half-hour slots for a doctor on a given date.
    Query params: date=YYYY-MM-DD
    Business rule: max 5 appointments per 30-minute slot, counts Scheduled/Waiting.
    Working hours assumed 09:00-17:30.
    """
    query_date = request.args.get("date")
    if not query_date:
        return jsonify({"error": "Missing required query param: date"}), 400

    try:
        day = datetime.strptime(query_date, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Generate half-hour slots from 09:00 to 17:30 (exclusive end 18:00)
    work_start = datetime.combine(day, time(9, 0, 0))
    work_end = datetime.combine(day, time(18, 0, 0))

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    available = []
    current = work_start
    while current < work_end:
        slot_start = current.time()
        slot_end = (current + timedelta(minutes=30)).time()

        cursor.execute(
            """
            SELECT COUNT(*) AS cnt
            FROM appointment
            WHERE d_id = %s
              AND date = %s
              AND time >= %s AND time < %s
              AND status IN ('Scheduled','Waiting')
            """,
            (d_id, day, slot_start, slot_end),
        )
        row = cursor.fetchone()
        cnt = row["cnt"] if row else 0
        if cnt < 5:
            available.append({
                "start": slot_start.strftime("%H:%M"),
                "end": slot_end.strftime("%H:%M"),
                "remaining": 5 - cnt,
            })

        current += timedelta(minutes=30)

    cursor.close()
    conn.close()

    return jsonify({
        "date": query_date,
        "doctor_id": d_id,
        "slots": available
    })

@app.route("/all_appointments/<int:patient_id>")
def all_appointments(patient_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT 
            a.a_id,
            a.date,
            a.time,
            a.status,
            d.d_name AS doctor
        FROM appointment a
        JOIN doctor d ON a.d_id = d.d_id
        WHERE a.p_id = %s
        ORDER BY a.date DESC, a.time DESC;
    """
    cursor.execute(query, (patient_id,))
    result = cursor.fetchall()

    cursor.close()
    conn.close()
    return jsonify(result)


@app.route("/consultations/<int:c_id>/complete", methods=["PUT"])
def complete_consultation(c_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Fetch the associated appointment date
    cursor.execute("""
        SELECT a.date 
        FROM consultation c
        JOIN appointment a ON c.a_id = a.a_id
        WHERE c.c_id = %s
    """, (c_id,))
    result = cursor.fetchone()

    if not result:
        conn.close()
        return jsonify({"error": "Consultation not found"}), 404

    appt_date = result["date"]
    today = date.today()

    # ❌ Prevent marking future consultations as complete
    if appt_date > today:
        conn.close()
        return jsonify({"error": "Cannot complete consultation scheduled for a future date"}), 400

    # ✅ Mark as completed
    cursor.execute("UPDATE consultation SET status='Completed' WHERE c_id=%s", (c_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": f"Consultation {c_id} marked as completed"})

# ----------------------------
# DOCTOR-SPECIFIC APPOINTMENTS
# ----------------------------
@app.route("/doctor/<int:d_id>/appointments", methods=["GET"])
def get_doctor_appointments(d_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT a.a_id, a.date, a.time, a.a_status, a.priority,
                   p.p_name AS patient, d.d_name AS doctor
            FROM appointment a
            JOIN patient p ON a.p_id = p.p_id
            JOIN doctor d ON a.d_id = d.d_id
            WHERE a.d_id = %s
            ORDER BY a.date DESC, a.time ASC
        """, (d_id,))
        data = convert_dates(cursor.fetchall())
        cursor.close()
        conn.close()
        return jsonify(data)
    except Exception as e:
        print("❌ Error fetching doctor appointments:", e)
        return jsonify({"error": "Error fetching doctor appointments"}), 500


# ----------------------------
# CONSULTATION ROUTES
# ----------------------------
@app.route("/consultations", methods=["GET"])
def get_consultations():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                c.c_id AS id,
                c.a_id,  -- include appointment ID
                p.p_name AS patient,
                d.d_name AS doctor,
                DATE(a.date) AS date,
                c.symptoms,
                c.prescription
            FROM consultation c
            JOIN appointment a ON c.a_id = a.a_id
            JOIN patient p ON a.p_id = p.p_id
            JOIN doctor d ON a.d_id = d.d_id
            ORDER BY a.date DESC;
        """)
        consultations = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify(consultations)

    except Exception as e:
        print("Error fetching consultations:", e)
        return jsonify({"error": "Failed to fetch consultations"}), 500

@app.route("/consultations", methods=["POST"])
def add_consultation():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Check if consultation already exists for this appointment
    cursor.execute("SELECT c_id FROM consultation WHERE a_id = %s", (data["a_id"],))
    existing = cursor.fetchone()
    if existing:
        cursor.close()
        conn.close()
        return jsonify({"error": "Consultation already exists for this appointment"}), 400
    
    # Insert consultation with symptoms and prescription (matching database schema)
    sql = """INSERT INTO consultation (a_id, symptoms, prescription)
             VALUES (%s, %s, %s)"""
    cursor.execute(sql, (data["a_id"], data["symptoms"], data["prescription"]))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Consultation added successfully!"})

@app.route("/consultations/<int:c_id>", methods=["DELETE"])
def delete_consultation(c_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        # Check if consultation exists
        cursor.execute("SELECT c_id FROM consultation WHERE c_id = %s", (c_id,))
        consultation = cursor.fetchone()
        if not consultation:
            cursor.close()
            conn.close()
            return jsonify({"error": "Consultation not found"}), 404
        
        # Delete the consultation
        cursor.execute("DELETE FROM consultation WHERE c_id = %s", (c_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Consultation deleted successfully!"})
    except Exception as e:
        print("❌ Error deleting consultation:", e)
        cursor.close()
        conn.close()
        return jsonify({"error": "Failed to delete consultation"}), 500

@app.route("/appointments/<int:a_id>", methods=["DELETE"])
def delete_appointment(a_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        # Check if appointment exists
        cursor.execute("SELECT a_id FROM appointment WHERE a_id = %s", (a_id,))
        appointment = cursor.fetchone()
        if not appointment:
            cursor.close()
            conn.close()
            return jsonify({"error": "Appointment not found"}), 404
        
        # Delete all related records first (in correct order to avoid foreign key constraints)
        # 1. Delete from queue (if exists)
        try:
            cursor.execute("DELETE FROM queue WHERE a_id = %s", (a_id,))
        except Exception as e:
            print(f"Note: No queue entries or queue table doesn't exist: {e}")
        
        # 2. Delete from billing (if exists)
        try:
            cursor.execute("DELETE FROM billing WHERE a_id = %s", (a_id,))
        except Exception as e:
            print(f"Note: No billing entries or billing table doesn't exist: {e}")
        
        # 3. Delete from consultation (if exists)
        try:
            cursor.execute("DELETE FROM consultation WHERE a_id = %s", (a_id,))
        except Exception as e:
            print(f"Note: No consultation entries: {e}")
        
        # 4. Finally, delete the appointment itself
        cursor.execute("DELETE FROM appointment WHERE a_id = %s", (a_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Appointment deleted successfully!"})
    except Exception as e:
        print("❌ Error deleting appointment:", e)
        print(f"Error details: {str(e)}")
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": f"Failed to delete appointment: {str(e)}"}), 500


# ----------------------------
# BILLING ROUTES
# ----------------------------
@app.route("/billing", methods=["GET"])
def get_billing():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM billing")
    data = convert_dates(cursor.fetchall())
    cursor.close()
    conn.close()
    return jsonify(data)


@app.route("/billing", methods=["POST"])
def add_billing():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    sql = """INSERT INTO billing (a_id, billing_date, amount, payment_status)
             VALUES (%s, %s, %s, %s)"""
    cursor.execute(sql, (data["a_id"], data["billing_date"], data["amount"], data["payment_status"]))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Bill added successfully!"})


# ----------------------------
# QUEUE ROUTES
# ----------------------------
@app.route("/queue", methods=["GET"])
def get_queue():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    status_column = _get_queue_status_column(conn)
    cursor.execute(f"""
        SELECT q.q_id,
               q.{status_column} AS q_status,
               q.token_no,
               a.a_id,
               a.date,
               a.time,
               a.status AS appointment_status,
               p.p_name,
               d.d_name
        FROM queue q
        JOIN appointment a ON q.a_id = a.a_id
        JOIN patient p ON a.p_id = p.p_id
        JOIN doctor d ON a.d_id = d.d_id
        ORDER BY a.date ASC, a.time ASC
    """)
    data = convert_dates(cursor.fetchall())
    cursor.close()
    conn.close()
    return jsonify(data)


@app.route("/queue/<int:q_id>", methods=["PUT"])
def update_queue(q_id):
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    status_column = _get_queue_status_column(conn)
    new_status = data.get("q_status") or data.get("status")
    if not new_status:
        cursor.close()
        conn.close()
        return jsonify({"error": "Missing queue status value"}), 400
    cursor.execute(f"UPDATE queue SET {status_column}=%s WHERE q_id=%s", (new_status, q_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Queue updated successfully!"})


def _normalize_time(value):
    """Normalize various MySQL time representations to datetime.time."""
    if isinstance(value, str):
        for fmt in ("%H:%M:%S", "%H:%M"):
            try:
                return datetime.strptime(value, fmt).time()
            except ValueError:
                continue
        return None
    if isinstance(value, timedelta):
        total_seconds = int(value.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        return time(hours, minutes, seconds)
    if isinstance(value, time):
        return value
    return None


def _normalize_date(value):
    """Normalize various MySQL date representations to datetime.date."""
    if isinstance(value, str):
        try:
            return datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError:
            return None
    return value


@app.route("/queue/patient/<int:p_id>", methods=["GET"])
def get_patient_queue_status(p_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        status_column = _get_queue_status_column(conn)
        status_condition = f"q.{status_column}"
        cursor.execute(
            f"""
            SELECT q.*,
                   q.{status_column} AS queue_status,
                   a.a_id AS appointment_id,
                   a.date AS appointment_date,
                   a.time AS appointment_time,
                   a.status AS appointment_status,
                   a.p_id,
                   a.d_id AS doctor_id,
                   p.p_name,
                   d.d_name
            FROM queue q
            JOIN appointment a ON q.a_id = a.a_id
            JOIN patient p ON a.p_id = p.p_id
            JOIN doctor d ON a.d_id = d.d_id
            WHERE a.p_id = %s AND {status_condition} IN ('Waiting','In Progress','Consulting')
            ORDER BY a.date ASC, a.time ASC
            LIMIT 1
            """,
            (p_id,),
        )
        target = cursor.fetchone()

        if not target:
            return jsonify({"inQueue": False})

        queue_status = target.get("queue_status") or target.get("status")
        appt_date_raw = target.get("appointment_date") or target.get("date")
        appt_time_raw = target.get("appointment_time") or target.get("time")
        doctor_id = target.get("doctor_id") or target.get("d_id")
        target_appt_id = target.get("appointment_id") or target.get("a_id")

        appt_date = _normalize_date(appt_date_raw)
        appt_time = _normalize_time(appt_time_raw)

        cursor.execute(
            f"""
            SELECT q.*,
                   q.{status_column} AS queue_status,
                   a.a_id,
                   a.time
            FROM queue q
            JOIN appointment a ON q.a_id = a.a_id
            WHERE a.d_id = %s AND a.date = %s AND {status_condition} IN ('Waiting','In Progress','Consulting')
            ORDER BY a.time ASC
            """,
            (doctor_id, appt_date_raw),
        )
        doctor_queue = cursor.fetchall()

        ahead_count = 0
        for entry in doctor_queue:
            if entry["a_id"] == target_appt_id:
                break
            ahead_count += 1

        queue_status = queue_status or "Waiting"
        position = ahead_count + 1
        normalized_status = queue_status.lower()
        if normalized_status in ("in progress", "consulting"):
            ahead_count = 0
            position = 0

        average_slot_minutes = 15
        now = datetime.now()
        estimated_wait = ahead_count * average_slot_minutes

        appointment_dt = None
        if appt_date and appt_time:
            appointment_dt = datetime.combine(appt_date, appt_time)
            if normalized_status in ("in progress", "consulting"):
                estimated_wait = 0
            elif appointment_dt > now:
                minutes_until = int((appointment_dt - now).total_seconds() // 60)
                estimated_wait = max(estimated_wait, minutes_until)

        response = {
            "inQueue": True,
            "queueStatus": queue_status,
            "position": position,
            "aheadCount": ahead_count,
            "estimatedWaitMinutes": max(0, estimated_wait),
            "appointment": {
                "id": target_appt_id,
                "date": appt_date.isoformat() if appt_date else str(appt_date_raw),
                "time": appt_time.strftime("%H:%M") if appt_time else str(appt_time_raw),
                "status": target.get("appointment_status"),
            },
            "doctor": {
                "id": doctor_id,
                "name": target["d_name"],
            },
            "queueId": target.get("q_id"),
            "lastUpdated": datetime.now().isoformat(),
        }

        if appointment_dt:
            response["expectedStartTime"] = appointment_dt.isoformat()

        return jsonify(response)

    except Exception as e:
        print("❌ Error computing patient queue status:", e)
        return jsonify({"error": "Failed to fetch queue status"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/get_patient_data', methods=['GET'])
def get_patient_data():
    p_id = request.args.get('p_id')
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Upcoming Appointments (Scheduled + date >= today)
    cursor.execute("""
        SELECT a.a_id, a.date, a.time, a.status, d.d_name
        FROM appointment a
        JOIN doctor d ON a.d_id = d.d_id
        WHERE a.p_id = %s AND a.status = 'Scheduled' AND a.date >= CURDATE()
        ORDER BY a.date ASC
    """, (p_id,))
    upcoming = cursor.fetchall()

    # Past Appointments (Completed OR date < today)
    cursor.execute("""
        SELECT a.a_id, a.date, a.time, a.status, d.d_name
        FROM appointment a
        JOIN doctor d ON a.d_id = d.d_id
        WHERE a.p_id = %s AND (a.status = 'Completed' OR a.date < CURDATE())
        ORDER BY a.date DESC
    """, (p_id,))
    past = cursor.fetchall()

    # Consultations (linked to completed appointments)
    cursor.execute("""
        SELECT c.c_id, c.symptoms, c.prescription, a.date, d.d_name
        FROM consultation c
        JOIN appointment a ON c.a_id = a.a_id
        JOIN doctor d ON a.d_id = d.d_id
        WHERE a.p_id = %s
        ORDER BY a.date DESC
    """, (p_id,))
    consultations = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "upcoming_count": len(upcoming),
        "past_count": len(past),
        "consultation_count": len(consultations),
        "upcoming": upcoming,
        "past": past,
        "consultations": consultations
    })

# ----------------------------
# RUN SERVER
# ----------------------------
if __name__ == '__main__':
   app.run(debug=True, port=5050)


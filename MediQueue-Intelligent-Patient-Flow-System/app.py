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


def auto_complete_past_appointments():
    """Automatically mark appointments that are before the current time slot as Completed.
    Does NOT mark appointments in the current time slot as completed."""
    conn = get_connection()
    if not conn:
        print("❌ Cannot auto-complete appointments: Database connection failed")
        return
    
    cursor = conn.cursor(dictionary=True)
    try:
        now = datetime.now()
        today = now.date()
        current_time = now.time()
        
        # Calculate current time slot (30-minute window)
        # Round down to nearest 30-minute slot
        slot_minute = 0 if current_time.minute < 30 else 30
        slot_start = time(current_time.hour, slot_minute, 0)
        
        # Find all appointments that are BEFORE the current time slot and not already completed
        # An appointment is in the past if:
        # 1. date < today, OR
        # 2. date = today AND time < slot_start (before current time slot, not in it)
        cursor.execute("""
            SELECT a.a_id, a.date, a.time
            FROM appointment a
            WHERE a.status IN ('Scheduled', 'Waiting')
              AND (
                a.date < %s
                OR (a.date = %s AND a.time < %s)
              )
        """, (today, today, slot_start))
        
        past_appointments = cursor.fetchall()
        
        if not past_appointments:
            cursor.close()
            conn.close()
            return
        
        # Get queue status column name
        try:
            status_column = _get_queue_status_column(conn)
        except RuntimeError:
            status_column = None
        
        # Mark each past appointment as completed
        completed_count = 0
        for apt in past_appointments:
            a_id = apt['a_id']
            
            # Update appointment status
            cursor.execute("UPDATE appointment SET status='Completed' WHERE a_id=%s", (a_id,))
            
            # Update queue status if queue table exists
            if status_column:
                try:
                    cursor.execute(
                        f"UPDATE queue SET {status_column}='Completed' WHERE a_id=%s",
                        (a_id,)
                    )
                except Exception as e:
                    # Queue entry might not exist, that's okay
                    pass
            
            completed_count += 1
        
        conn.commit()
        if completed_count > 0:
            print(f"✅ Auto-completed {completed_count} past appointment(s) (before current time slot)")
        
    except Exception as e:
        print(f"❌ Error auto-completing past appointments: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()


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

@app.route("/appointments", methods=["GET"])
def get_appointments():
    # Auto-complete past appointments before fetching
    auto_complete_past_appointments()
    
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
                a.status AS status,
                COALESCE(q.token_no, 0) AS token_no
            FROM appointment a
            JOIN patient p ON a.p_id = p.p_id
            JOIN doctor d ON a.d_id = d.d_id
            LEFT JOIN queue q ON a.a_id = q.a_id
            ORDER BY a.date ASC, a.time ASC, q.token_no ASC;
        """)

        rows = cursor.fetchall()
        cols = [desc[0] for desc in cursor.description]

        data = []
        for row in rows:
            row_dict = {}
            for col, val in zip(cols, row):
                # Convert all non-serializable types to strings
                if isinstance(val, (datetime, timedelta, date, time)):
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
    
    # Real-time validation: Prevent booking appointments in the past
    try:
        appointment_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        appointment_time_str = data.get("time", "")
        
        # Parse time - handle both H:M and H:M:S formats
        if isinstance(appointment_time_str, str):
            try:
                appointment_time = datetime.strptime(appointment_time_str, "%H:%M").time()
            except ValueError:
                appointment_time = datetime.strptime(appointment_time_str, "%H:%M:%S").time()
        else:
            appointment_time = appointment_time_str
    except (ValueError, KeyError) as e:
        cursor.close()
        conn.close()
        return jsonify({"error": f"Invalid date or time format: {str(e)}"}), 400

    # Real-time validation: Prevent booking in the past
    now = datetime.now()
    appointment_datetime = datetime.combine(appointment_date, appointment_time)
    
    # Only validate for Scheduled/Waiting appointments (allow past for Completed)
    appointment_status = data.get("a_status") or data.get("status", "Scheduled")
    if appointment_status in ["Scheduled", "Waiting"] and appointment_datetime < now:
        cursor.close()
        conn.close()
        return jsonify({
            "error": "Cannot create appointment in the past",
            "details": {
                "requested_datetime": appointment_datetime.isoformat(),
                "current_datetime": now.isoformat()
            }
        }), 400
    
    sql = """INSERT INTO appointment (p_id, d_id, date, time, priority, a_status)
             VALUES (%s, %s, %s, %s, %s, %s)"""
    cursor.execute(sql, (data["p_id"], data["d_id"], data["date"], data["time"], data.get("priority"), appointment_status))
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

    # Validate date and time format
    try:
        appointment_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        requested_time = datetime.strptime(data["time"], "%H:%M").time()
    except ValueError:
        try:
            requested_time = datetime.strptime(data["time"], "%H:%M:%S").time()
        except ValueError:
            cursor.close()
            conn.close()
            return jsonify({"error": "Invalid date or time format"}), 400

    # Real-time validation: Prevent booking in the past
    now = datetime.now()
    appointment_datetime = datetime.combine(appointment_date, requested_time)
    
    if appointment_datetime < now:
        cursor.close()
        conn.close()
        return jsonify({
            "error": "Cannot book appointment in the past",
            "details": {
                "requested_datetime": appointment_datetime.isoformat(),
                "current_datetime": now.isoformat()
            }
        }), 400

    # Normalize requested time to 30-min slot window [slot_start, slot_end)
    slot_minute = 0 if requested_time.minute < 30 else 30
    slot_start = time(requested_time.hour, slot_minute, 0)
    # Compute slot_end
    slot_start_dt = datetime.combine(appointment_date, slot_start)
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
    
    # Get the appointment ID
    a_id = cursor.lastrowid
    
    # Add to queue table with Waiting status
    try:
        # Get the next token number for this time slot (not for the entire date)
        # This ensures the first appointment in each time slot gets token 1 for that slot
        cursor.execute("""
            SELECT COALESCE(MAX(q.token_no), 0) + 1 AS next_token
            FROM queue q
            JOIN appointment a ON q.a_id = a.a_id
            WHERE a.date = %s
              AND a.time >= %s 
              AND a.time < %s
              AND a.status IN ('Scheduled', 'Waiting')
        """, (appointment_date, slot_start, slot_end))
        token_result = cursor.fetchone()
        token_no = token_result["next_token"] if token_result else 1
        
        cursor.execute("""
            INSERT INTO queue (a_id, token_no, status)
            VALUES (%s, %s, 'Waiting')
        """, (a_id, token_no))
    except Exception as e:
        # If queue table doesn't exist or has issues, continue without it
        print(f"Note: Could not add to queue: {e}")
    
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
    Real-time: Filters out past time slots for today.
    """
    query_date = request.args.get("date")
    if not query_date:
        return jsonify({"error": "Missing required query param: date"}), 400

    try:
        day = datetime.strptime(query_date, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Real-time validation: Don't show slots for past dates
    today = date.today()
    if day < today:
        return jsonify({
            "date": query_date,
            "doctor_id": d_id,
            "slots": [],
            "message": "Cannot book appointments for past dates"
        })

    # Get current time for filtering past slots on today
    now = datetime.now()

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

        # Real-time filtering: Skip past time slots for today
        if day == today:
            slot_datetime = datetime.combine(day, slot_start)
            if slot_datetime < now:
                current += timedelta(minutes=30)
                continue

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


@app.route("/queue/live", methods=["GET"])
def get_live_queue():
    """Return appointments happening in the current time slot (current time ± 30 minutes)."""
    # Auto-complete past appointments before fetching live queue
    auto_complete_past_appointments()
    
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        now = datetime.now()
        today = now.date()
        current_time = now.time()
        
        # Calculate current time slot (30-minute window)
        # Round down to nearest 30-minute slot
        slot_minute = 0 if current_time.minute < 30 else 30
        slot_start = time(current_time.hour, slot_minute, 0)
        slot_end_dt = datetime.combine(today, slot_start) + timedelta(minutes=30)
        slot_end = slot_end_dt.time()
        
        # Query appointments in the current time slot
        status_column = _get_queue_status_column(conn)
        cursor.execute(f"""
            SELECT 
                a.a_id,
                a.date,
                a.time,
                a.status AS appointment_status,
                p.p_name AS patient_name,
                p.p_id AS patient_id,
                d.d_name AS doctor_name,
                d.d_id AS doctor_id,
                q.token_no,
                q.{status_column} AS queue_status,
                q.q_id
            FROM appointment a
            JOIN patient p ON a.p_id = p.p_id
            JOIN doctor d ON a.d_id = d.d_id
            LEFT JOIN queue q ON a.a_id = q.a_id
            WHERE a.date = %s
              AND a.time >= %s 
              AND a.time < %s
              AND a.status IN ('Scheduled', 'Waiting')
            ORDER BY a.time ASC, q.token_no ASC
        """, (today, slot_start, slot_end))
        
        appointments = cursor.fetchall()
        
        # Convert dates/times to strings using convert_dates helper
        converted_appointments = convert_dates(appointments)
        
        # Ensure time is formatted as HH:MM
        for apt in converted_appointments:
            if apt.get('time'):
                time_val = apt['time']
                if isinstance(time_val, timedelta):
                    total_seconds = int(time_val.total_seconds())
                    hours = total_seconds // 3600
                    minutes = (total_seconds % 3600) // 60
                    apt['time'] = f"{hours:02d}:{minutes:02d}"
                elif isinstance(time_val, time):
                    apt['time'] = time_val.strftime("%H:%M")
                elif isinstance(time_val, str) and ':' in time_val:
                    # Already a string, just ensure it's in HH:MM format
                    parts = time_val.split(':')
                    if len(parts) >= 2:
                        apt['time'] = f"{parts[0].zfill(2)}:{parts[1].zfill(2)}"
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "current_time": now.isoformat(),
            "time_slot": {
                "start": slot_start.strftime("%H:%M"),
                "end": slot_end.strftime("%H:%M")
            },
            "appointments": converted_appointments,
            "count": len(converted_appointments),
            "message": f"No appointments scheduled from {slot_start.strftime('%H:%M')} to {slot_end.strftime('%H:%M')}" if len(converted_appointments) == 0 else None
        })
        
    except Exception as e:
        print("❌ Error fetching live queue:", e)
        try:
            cursor.close()
        except:
            pass
        try:
            conn.close()
        except:
            pass
        return jsonify({"error": f"Failed to fetch live queue: {str(e)}"}), 500


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
    # Auto-complete past appointments before fetching patient queue status
    auto_complete_past_appointments()
    
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # First, get the EARLIEST upcoming appointment for this patient
        # This ensures we show the next appointment, not just any appointment in queue
        # We need to check if appointment is in current time slot OR future
        now = datetime.now()
        today = date.today()
        current_time = now.time()
        
        # Calculate current time slot (30-minute window)
        # Round down to nearest 30-minute slot
        slot_minute = 0 if current_time.minute < 30 else 30
        slot_start = time(current_time.hour, slot_minute, 0)
        slot_end_dt = datetime.combine(today, slot_start) + timedelta(minutes=30)
        slot_end = slot_end_dt.time()
        
        # Query: Get appointments that are either:
        # 1. In the current time slot (for today)
        # 2. Future appointments (date > today OR date = today AND time >= slot_end)
        cursor.execute("""
            SELECT a.a_id AS appointment_id,
                   a.date AS appointment_date,
                   a.time AS appointment_time,
                   a.status AS appointment_status,
                   a.p_id,
                   a.d_id AS doctor_id,
                   p.p_name,
                   d.d_name
            FROM appointment a
            JOIN patient p ON a.p_id = p.p_id
            JOIN doctor d ON a.d_id = d.d_id
            WHERE a.p_id = %s 
              AND a.status IN ('Scheduled', 'Waiting')
              AND (
                a.date > %s 
                OR (a.date = %s AND a.time >= %s AND a.time < %s)
                OR (a.date = %s AND a.time >= %s)
              )
            ORDER BY a.date ASC, a.time ASC
            LIMIT 1
        """, (p_id, today, today, slot_start, slot_end, today, slot_end))
        target = cursor.fetchone()
        
        # Debug: Check all upcoming appointments for this patient
        cursor.execute("""
            SELECT a.a_id, a.date, a.time, a.status
            FROM appointment a
            WHERE a.p_id = %s 
              AND a.status IN ('Scheduled', 'Waiting')
            ORDER BY a.date ASC, a.time ASC
        """, (p_id,))
        all_appointments = cursor.fetchall()
        print(f"DEBUG: All appointments for patient {p_id}: {all_appointments}")
        
        # Debug: Print what we found
        if target:
            print(f"DEBUG: Found earliest upcoming appointment for patient {p_id}: Date={target['appointment_date']}, Time={target['appointment_time']}, ID={target['appointment_id']}")
        else:
            print(f"DEBUG: No upcoming appointments found for patient {p_id}")
        
        if not target:
            return jsonify({"inQueue": False})
        
        # Now check if this appointment is in the queue table
        status_column = _get_queue_status_column(conn)
        status_condition = f"q.{status_column}"
        cursor.execute(
            f"""
            SELECT q.*,
                   q.{status_column} AS queue_status
            FROM queue q
            WHERE q.a_id = %s
            """,
            (target["appointment_id"],),
        )
        queue_entry = cursor.fetchone()
        
        # If not in queue table, add it
        if not queue_entry:
            # Get the next token number for this date
            cursor.execute("""
                SELECT COALESCE(MAX(token_no), 0) + 1 AS next_token
                FROM queue q
                JOIN appointment a ON q.a_id = a.a_id
                WHERE a.date = %s
            """, (target["appointment_date"],))
            token_result = cursor.fetchone()
            token_no = token_result["next_token"] if token_result else 1
            
            cursor.execute("""
                INSERT INTO queue (a_id, token_no, status)
                VALUES (%s, %s, 'Waiting')
            """, (target["appointment_id"], token_no))
            conn.commit()
            
            # Re-fetch the queue entry
            cursor.execute(
                f"""
                SELECT q.*,
                       q.{status_column} AS queue_status
                FROM queue q
                WHERE q.a_id = %s
                """,
                (target["appointment_id"],),
            )
            queue_entry = cursor.fetchone()

        if not target:
            return jsonify({"inQueue": False})

        # Get queue status from queue_entry, default to "Waiting"
        queue_status = (queue_entry.get("queue_status") if queue_entry else None) or "Waiting"
        appt_date_raw = target.get("appointment_date") or target.get("date")
        appt_time_raw = target.get("appointment_time") or target.get("time")
        doctor_id = target.get("doctor_id") or target.get("d_id")
        target_appt_id = target.get("appointment_id") or target.get("a_id")

        appt_date = _normalize_date(appt_date_raw)
        appt_time = _normalize_time(appt_time_raw)

        # Calculate time slot for this appointment
        slot_start = None
        slot_end = None
        if appt_time:
            appt_time_obj = appt_time if isinstance(appt_time, time) else _normalize_time(appt_time)
            if appt_time_obj:
                slot_minute = 0 if appt_time_obj.minute < 30 else 30
                slot_start = time(appt_time_obj.hour, slot_minute, 0)
                slot_end_dt = datetime.combine(appt_date, slot_start) + timedelta(minutes=30)
                slot_end = slot_end_dt.time()

        # Get queue for appointments in the same time slot (for position calculation)
        if slot_start and slot_end:
            cursor.execute(
                f"""
                SELECT q.*,
                       q.{status_column} AS queue_status,
                       a.a_id,
                       a.time
                FROM queue q
                JOIN appointment a ON q.a_id = a.a_id
                WHERE a.d_id = %s 
                  AND a.date = %s 
                  AND a.time >= %s 
                  AND a.time < %s
                  AND a.status IN ('Scheduled', 'Waiting')
                  AND {status_condition} IN ('Waiting','In Progress','Consulting')
                ORDER BY a.time ASC, q.token_no ASC
                """,
                (doctor_id, appt_date_raw, slot_start, slot_end),
            )
            time_slot_queue = cursor.fetchall()
        else:
            # Fallback to all appointments if we can't determine time slot
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
            time_slot_queue = cursor.fetchall()

        ahead_count = 0
        for entry in time_slot_queue:
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

        # Check if patient is first in their time slot
        is_first_in_slot = False
        if appt_date and appt_time:
            # Calculate the time slot for this appointment (30-minute window)
            appt_time_obj = appt_time if isinstance(appt_time, time) else _normalize_time(appt_time)
            if appt_time_obj:
                slot_minute = 0 if appt_time_obj.minute < 30 else 30
                slot_start = time(appt_time_obj.hour, slot_minute, 0)
                slot_end_dt = datetime.combine(appt_date, slot_start) + timedelta(minutes=30)
                slot_end = slot_end_dt.time()
                
                # Check if there are any appointments before this one in the same time slot
                # (earlier time OR same time but lower token number)
                cursor.execute(
                    f"""
                    SELECT COUNT(*) as count
                    FROM queue q
                    JOIN appointment a ON q.a_id = a.a_id
                    WHERE a.d_id = %s 
                      AND a.date = %s
                      AND a.time >= %s 
                      AND a.time < %s
                      AND a.status IN ('Scheduled', 'Waiting')
                      AND {status_condition} IN ('Waiting', 'In Progress', 'Consulting')
                      AND (
                        a.time < %s
                        OR (a.time = %s AND q.token_no < %s)
                      )
                    """,
                    (doctor_id, appt_date_raw, slot_start, slot_end, appt_time_obj, appt_time_obj, queue_entry.get("token_no") if queue_entry else 999999)
                )
                earlier_in_slot = cursor.fetchone()
                is_first_in_slot = (earlier_in_slot["count"] if earlier_in_slot else 0) == 0

        appointment_dt = None
        if appt_date and appt_time:
            appointment_dt = datetime.combine(appt_date, appt_time)
            if normalized_status in ("in progress", "consulting"):
                estimated_wait = 0
            elif appointment_dt > now:
                minutes_until = int((appointment_dt - now).total_seconds() // 60)
                estimated_wait = max(estimated_wait, minutes_until)

        # Debug: Log the appointment being returned
        print(f"DEBUG: Returning queue status for patient {p_id}: Appointment ID={target_appt_id}, Date={appt_date.isoformat() if appt_date else appt_date_raw}, Time={appt_time.strftime('%H:%M') if appt_time else appt_time_raw}, IsFirstInSlot={is_first_in_slot}")
        
        response = {
            "inQueue": True,
            "queueStatus": queue_status,
            "position": position,
            "aheadCount": ahead_count,
            "estimatedWaitMinutes": max(0, estimated_wait),
            "isFirstInSlot": is_first_in_slot,
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
            "queueId": queue_entry.get("q_id") if queue_entry else None,
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


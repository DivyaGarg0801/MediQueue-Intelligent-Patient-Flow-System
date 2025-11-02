from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import random
from datetime import date, datetime, timedelta

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
    sql = """INSERT INTO patient (p_name, age, gender, contact, address)
             VALUES (%s, %s, %s, %s, %s)"""
    values = (data["p_name"], data["age"], data["gender"], data["contact"], data["address"])
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
    cursor = conn.cursor()
    cursor.execute("DELETE FROM patient WHERE p_id=%s", (p_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Patient deleted!"})


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
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM admin")
    data = convert_dates(cursor.fetchall())
    cursor.close()
    conn.close()
    return jsonify(data)


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
                p.p_name AS patient,
                d.d_name AS doctor,
                DATE(a.date) AS date,   -- ✅ show only date
                c.symptoms,
                c.prescription
            FROM consultation c
            JOIN appointment a ON c.a_id = a.a_id
            JOIN patient p ON a.p_id = p.p_id
            JOIN doctor d ON a.d_id = d.d_id
            ORDER BY a.date DESC;
        """)

        consultations = cursor.fetchall()

        # ✅ Convert any date/time/timedelta objects to string
        for row in consultations:
            for key, val in row.items():
                if isinstance(val, (datetime, timedelta, date)):
                    row[key] = str(val)

        conn.close()
        return jsonify(consultations)

    except Exception as e:
        print("❌ Error fetching consultations:", e)
        return jsonify({"error": str(e)})

@app.route("/consultations", methods=["POST"])
def add_consultation():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    sql = """INSERT INTO consultation (a_id, notes, prescription, followup_date)
             VALUES (%s, %s, %s, %s)"""
    cursor.execute(sql, (data["a_id"], data["notes"], data["prescription"], data["followup_date"]))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Consultation added successfully!"})


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
    cursor.execute("""
        SELECT q.q_id, q.q_status, a.a_id, a.date, a.time, p.p_name, d.d_name, a.priority
        FROM queue q
        JOIN appointment a ON q.a_id = a.a_id
        JOIN patient p ON a.p_id = p.p_id
        JOIN doctor d ON a.d_id = d.d_id
        ORDER BY a.priority DESC, a.time ASC
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
    cursor.execute("UPDATE queue SET q_status=%s WHERE q_id=%s", (data["q_status"], q_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Queue updated successfully!"})


# ----------------------------
# RUN SERVER
# ----------------------------
if __name__ == "__main__":
    app.run(debug=True)

from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from datetime import date, datetime, timedelta

app = Flask(__name__)
CORS(app)

# ----------------------------
# Database Connection
# ----------------------------
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",         # your MySQL password
    database="clinic"      # your database name
)
cursor = db.cursor(dictionary=True)


# ----------------------------
# Helper: Convert dates for JSON
# ----------------------------
def convert_dates(rows):
    for row in rows:
        for key, value in row.items():
            if isinstance(value, (date, datetime, timedelta)):
                row[key] = str(value)
    return rows


# ----------------------------
# Root Route (API check)
# ----------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "MediQueue API is running successfully ✅"})


# ----------------------------
# PATIENT ROUTES
# ----------------------------
@app.route("/patients", methods=["GET"])
def get_patients():
    cursor.execute("SELECT * FROM patient")
    return jsonify(convert_dates(cursor.fetchall()))


@app.route("/patients", methods=["POST"])
def add_patient():
    data = request.json
    sql = """INSERT INTO patient (p_name, age, gender, contact, address)
             VALUES (%s, %s, %s, %s, %s)"""
    values = (data["p_name"], data["age"], data["gender"], data["contact"], data["address"])
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"message": "Patient added successfully!"})


@app.route("/patients/<int:p_id>", methods=["PUT"])
def update_patient(p_id):
    data = request.json
    sql = """UPDATE patient
             SET p_name=%s, age=%s, gender=%s, contact=%s, address=%s
             WHERE p_id=%s"""
    values = (data["p_name"], data["age"], data["gender"], data["contact"], data["address"], p_id)
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"message": "Patient updated successfully!"})


@app.route("/patients/<int:p_id>", methods=["DELETE"])
def delete_patient(p_id):
    cursor.execute("DELETE FROM patient WHERE p_id=%s", (p_id,))
    db.commit()
    return jsonify({"message": "Patient deleted!"})


@app.route("/patients/mobile/<string:mobile>", methods=["GET"])
def get_patient_by_mobile(mobile):
    cursor.execute("SELECT * FROM patient WHERE contact=%s", (mobile,))
    patient = cursor.fetchone()
    if patient:
        return jsonify(patient)
    else:
        return jsonify({"error": "Patient not found"}), 404


# ----------------------------
# DOCTOR ROUTES
# ----------------------------
@app.route("/doctors", methods=["GET"])
def get_doctors():
    cursor.execute("SELECT * FROM doctor")
    return jsonify(convert_dates(cursor.fetchall()))


@app.route("/doctors", methods=["POST"])
def add_doctor():
    data = request.json
    sql = """INSERT INTO doctor (d_name, specialization, availability)
             VALUES (%s, %s, %s)"""
    values = (data["d_name"], data["specialization"], data["availability"])
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"message": "Doctor added successfully!"})


# ----------------------------
# APPOINTMENT ROUTES
# ----------------------------
@app.route("/appointments", methods=["GET"])
def get_appointments():
    cursor.execute("SELECT * FROM appointment")
    return jsonify(convert_dates(cursor.fetchall()))


@app.route("/appointments", methods=["POST"])
def add_appointment():
    data = request.json
    sql = """INSERT INTO appointment (p_id, d_id, date, time, priority, a_status)
             VALUES (%s, %s, %s, %s, %s, %s)"""
    values = (data["p_id"], data["d_id"], data["date"], data["time"], data["priority"], data["a_status"])
    cursor.execute(sql, values)
    db.commit()

    # add entry in queue automatically
    cursor.execute("SELECT LAST_INSERT_ID() as a_id")
    a_id = cursor.fetchone()["a_id"]
    cursor.execute("INSERT INTO queue (a_id, q_status) VALUES (%s, %s)", (a_id, "Waiting"))
    db.commit()

    return jsonify({"message": "Appointment created and added to queue!"})


@app.route("/appointments/<int:a_id>", methods=["PUT"])
def update_appointment(a_id):
    data = request.json
    sql = """UPDATE appointment
             SET p_id=%s, d_id=%s, date=%s, time=%s, priority=%s, a_status=%s
             WHERE a_id=%s"""
    values = (data["p_id"], data["d_id"], data["date"], data["time"], data["priority"], data["a_status"], a_id)
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"message": "Appointment updated successfully!"})


# ----------------------------
# QUEUE ROUTES
# ----------------------------
@app.route("/queue", methods=["GET"])
def get_queue():
    cursor.execute("""
        SELECT q.q_id, q.q_status, a.a_id, a.date, a.time, p.p_name, d.d_name, a.priority
        FROM queue q
        JOIN appointment a ON q.a_id = a.a_id
        JOIN patient p ON a.p_id = p.p_id
        JOIN doctor d ON a.d_id = d.d_id
        ORDER BY a.priority DESC, a.time ASC
    """)
    return jsonify(convert_dates(cursor.fetchall()))


@app.route("/queue/<int:q_id>", methods=["PUT"])
def update_queue(q_id):
    data = request.json
    sql = "UPDATE queue SET q_status=%s WHERE q_id=%s"
    cursor.execute(sql, (data["q_status"], q_id))
    db.commit()
    return jsonify({"message": "Queue updated!"})


# ----------------------------
# CONSULTATION ROUTES
# ----------------------------
@app.route("/consultations", methods=["GET"])
def get_consultations():
    cursor.execute("""
        SELECT c.*, p.p_name, d.d_name
        FROM consultation c
        JOIN appointment a ON c.a_id = a.a_id
        JOIN patient p ON a.p_id = p.p_id
        JOIN doctor d ON a.d_id = d.d_id
    """)
    return jsonify(convert_dates(cursor.fetchall()))


@app.route("/consultations", methods=["POST"])
def add_consultation():
    data = request.json
    sql = """INSERT INTO consultation (a_id, symptoms, prescription)
             VALUES (%s, %s, %s)"""
    cursor.execute(sql, (data["a_id"], data["symptoms"], data["prescription"]))
    db.commit()
    return jsonify({"message": "Consultation added successfully!"})


# ----------------------------
# BILLING ROUTES
# ----------------------------
@app.route("/billing", methods=["GET"])
def get_bills():
    cursor.execute("SELECT * FROM billing")
    return jsonify(convert_dates(cursor.fetchall()))


@app.route("/billing", methods=["POST"])
def add_bill():
    data = request.json
    sql = """INSERT INTO billing (a_id, billing_date, amount, payment_status)
             VALUES (%s, %s, %s, %s)"""
    cursor.execute(sql, (data["a_id"], data["billing_date"], data["amount"], data["payment_status"]))
    db.commit()
    return jsonify({"message": "Bill added successfully!"})


# ----------------------------
# Run Flask Server
# ----------------------------
if __name__ == "__main__":
    app.run(debug=True)

from flask import Flask, request, jsonify
import mysql.connector
from flask_cors import CORS
from datetime import date, datetime, timedelta

app = Flask(__name__)
CORS(app)  # Allow React frontend to access APIs

# ----------------------------
# Step 2: Database connection
# ----------------------------
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",      # change this to your password
    database="hospital"   # change this to your DB name
)
cursor = db.cursor(dictionary=True)


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
    cursor.execute("SELECT * FROM patient")
    return jsonify(convert_dates(cursor.fetchall()))

@app.route("/patients", methods=["POST"])
def add_patient():
    data = request.json
    sql = "INSERT INTO patient (p_name, age, gender, contact, address) VALUES (%s, %s, %s, %s, %s)"
    values = (data["p_name"], data["age"], data["gender"], data["contact"], data["address"])
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"message": "Patient added successfully!"})

@app.route("/patients/<int:p_id>", methods=["PUT"])
def update_patient(p_id):
    data = request.json
    sql = "UPDATE patient SET p_name=%s, age=%s, gender=%s, contact=%s, address=%s  WHERE p_id=%s"
    values = (data["p_name"], data["age"], data["gender"], data["contact"], data["address"], p_id)
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"message": "Patient updated successfully!"})

@app.route("/patients/<int:p_id>", methods=["DELETE"])
def delete_patient(p_id):
    cursor.execute("DELETE FROM patient WHERE p_id=%s", (p_id,))
    db.commit()
    return jsonify({"message": "Patient deleted!"})


# ----------------------------
# Doctor Routes
# ----------------------------
@app.route("/doctors", methods=["GET"])
def get_doctors():
    cursor.execute("SELECT * FROM doctor")
    return jsonify(convert_dates(cursor.fetchall()))

@app.route("/doctors", methods=["POST"])
def add_doctor():
    data = request.json
    sql = "INSERT INTO doctor (d_name, specialization, availability) VALUES (%s, %s, %s)"
    values = (data["d_name"], data["specialization"], data["availability"])
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"message": "Doctor added successfully!"})

@app.route("/doctors/<int:d_id>", methods=["PUT"])
def update_doctor(d_id):
    data = request.json
    sql = "UPDATE doctor SET d_name=%s, specialization=%s, availability=%s WHERE d_id=%s"
    values = (data["d_name"], data["specialization"], data["availability"], d_id)
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"message": "Doctor updated successfully!"})

@app.route("/doctors/<int:d_id>", methods=["DELETE"])
def delete_doctor(d_id):
    cursor.execute("DELETE FROM doctor WHERE d_id=%s", (d_id,))
    db.commit()
    return jsonify({"message": "Doctor deleted!"})


# ----------------------------
# Appointment Routes
# ----------------------------
@app.route("/appointments", methods=["GET"])
def get_appointments():
    cursor.execute("SELECT * FROM appointment")
    return jsonify(convert_dates(cursor.fetchall()))

@app.route("/appointments", methods=["POST"])
def add_appointment():
    data = request.json
    sql = "INSERT INTO appointment (p_id, d_id, date, time, priority, a_status) VALUES (%s, %s, %s, %s, %s, %s)"
    values = (data["p_id"], data["d_id"], data["date"], data["time"], data["priority"], data["a_status"])
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"message": "Appointment created!"})

@app.route("/appointments/<int:a_id>", methods=["PUT"])
def update_appointment(a_id):
    data = request.json
    sql = "UPDATE appointment SET p_id=%s, d_id=%s, date=%s, time=%s, priority=%s, a_status=%s WHERE a_id=%s"
    values = (data["p_id"], data["d_id"], data["date"], data["time"], data["priority"], data["a_status"], a_id)
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"message": "Appointment updated!"})

@app.route("/appointments/<int:a_id>", methods=["DELETE"])
def delete_appointment(a_id):
    cursor.execute("DELETE FROM appointment WHERE a_id=%s", (a_id,))
    db.commit()
    return jsonify({"message": "Appointment deleted!"})


# ----------------------------
# Queue Routes
# ----------------------------
@app.route("/queue", methods=["GET"])
def get_queue():
    cursor.execute("SELECT * FROM queue")
    return jsonify(cursor.fetchall())

@app.route("/queue", methods=["POST"])
def add_queue():
    data = request.json
    sql = "INSERT INTO queue (a_id, q_status) VALUES (%s, %s)"
    values = (data["a_id"], data["q_status"])
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"message": "Queue entry added!"})

@app.route("/queue/<int:q_id>", methods=["PUT"])
def update_queue(q_id):
    data = request.json
    sql = "UPDATE queue SET a_id=%s, q_status=%s WHERE q_id=%s"
    values = (data["a_id"], data["q_status"], q_id)
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"message": "Queue updated!"})

@app.route("/queue/<int:q_id>", methods=["DELETE"])
def delete_queue(q_id):
    cursor.execute("DELETE FROM queue WHERE q_id=%s", (q_id,))
    db.commit()
    return jsonify({"message": "Queue deleted!"})


# ----------------------------
# Consultation Routes
# ----------------------------
@app.route("/consultations", methods=["GET"])
def get_consultations():
    cursor.execute("SELECT * FROM consultation")
    return jsonify(cursor.fetchall())

@app.route("/consultations", methods=["POST"])
def add_consultation():
    data = request.json
    sql = "INSERT INTO consultation (a_id, symptoms, prescription) VALUES (%s, %s, %s)"
    values = (data["a_id"], data["symptoms"], data["prescription"])
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"message": "Consultation added!"})

@app.route("/consultations/<int:c_id>", methods=["PUT"])
def update_consultation(c_id):
    data = request.json
    sql = "UPDATE consultation SET a_id=%s, symptoms=%s, prescription=%s WHERE c_id=%s"
    values = (data["a_id"], data["symptoms"], data["prescription"], c_id)
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"message": "Consultation updated!"})

@app.route("/consultations/<int:c_id>", methods=["DELETE"])
def delete_consultation(c_id):
    cursor.execute("DELETE FROM consultation WHERE c_id=%s", (c_id,))
    db.commit()
    return jsonify({"message": "Consultation deleted!"})


# ----------------------------
# Billing Routes
# ----------------------------
@app.route("/billing", methods=["GET"])
def get_bills():
    cursor.execute("SELECT * FROM billing")
    return jsonify(convert_dates(cursor.fetchall()))

@app.route("/billing", methods=["POST"])
def add_bill():
    data = request.json
    sql = "INSERT INTO billing (a_id, billing_date, amount, payment_status) VALUES (%s, %s, %s, %s)"
    values = (data["a_id"], data["billing_date"], data["amount"], data["payment_status"])
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"message": "Bill added!"})

@app.route("/billing/<int:b_id>", methods=["PUT"])
def update_bill(b_id):
    data = request.json
    sql = "UPDATE billing SET a_id=%s, billing_date=%s, amount=%s, payment_status=%s WHERE b_id=%s"
    values = (data["a_id"], data["billing_date"], data["amount"], data["payment_status"], b_id)
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"message": "Bill updated!"})

@app.route("/billing/<int:b_id>", methods=["DELETE"])
def delete_bill(b_id):
    cursor.execute("DELETE FROM billing WHERE b_id=%s", (b_id,))
    db.commit()
    return jsonify({"message": "Bill deleted!"})


# ----------------------------
# Step 4: Run Server
# ----------------------------
if __name__ == "__main__":
    app.run(debug=True)

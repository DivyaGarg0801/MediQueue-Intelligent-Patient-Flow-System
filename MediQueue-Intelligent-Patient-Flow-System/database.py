import mysql.connector

# ---------- CONNECT TO MYSQL ----------
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root"  # 🔹 Replace with your MySQL password
)
cursor = conn.cursor()

# ---------- DATABASE CREATION ----------
cursor.execute("DROP DATABASE IF EXISTS clinic;")
cursor.execute("CREATE DATABASE clinic;")
cursor.execute("USE clinic;")

# ---------- TABLES ----------

# 1️⃣ Doctor Table
cursor.execute("""
CREATE TABLE doctor (
    d_id INT AUTO_INCREMENT PRIMARY KEY,
    d_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    availability VARCHAR(100),
    contact VARCHAR(10) NOT NULL UNIQUE,
    CHECK (contact REGEXP '^[0-9]{10}$')
);
""")

# 2️⃣ Patient Table
cursor.execute("""
CREATE TABLE patient (
    p_id INT AUTO_INCREMENT PRIMARY KEY,
    p_name VARCHAR(100) NOT NULL,
    age INT CHECK (age > 0),
    gender ENUM('Male', 'Female', 'Other'),
    contact VARCHAR(10) NOT NULL UNIQUE,
    CHECK (contact REGEXP '^[0-9]{10}$')
);
""")

# 3️⃣ Appointment Table
cursor.execute("""
CREATE TABLE appointment (
    a_id INT AUTO_INCREMENT PRIMARY KEY,
    p_id INT,
    d_id INT,
    date DATE,
    time TIME,
    status ENUM('Scheduled', 'Completed', 'Cancelled','Waiting') DEFAULT 'Scheduled',
    FOREIGN KEY (p_id) REFERENCES patient(p_id),
    FOREIGN KEY (d_id) REFERENCES doctor(d_id)
);
""")

# 4️⃣ Consultation Table (no notes)
cursor.execute("""
CREATE TABLE consultation (
    c_id INT AUTO_INCREMENT PRIMARY KEY,
    a_id INT,
    symptoms VARCHAR(100),
    prescription TEXT,
    FOREIGN KEY (a_id) REFERENCES appointment(a_id)
);
""")

# 5️⃣ Billing Table
cursor.execute("""
CREATE TABLE billing (
    b_id INT AUTO_INCREMENT PRIMARY KEY,
    a_id INT,
    amount DECIMAL(10,2),
    payment_status ENUM('Paid', 'Pending') DEFAULT 'Pending',
    FOREIGN KEY (a_id) REFERENCES appointment(a_id)
);
""")

# 6️⃣ Queue Table
cursor.execute("""
CREATE TABLE queue (
    q_id INT AUTO_INCREMENT PRIMARY KEY,
    a_id INT,
    token_no INT,
    status ENUM('Waiting', 'Consulting', 'Completed') DEFAULT 'Waiting',
    FOREIGN KEY (a_id) REFERENCES appointment(a_id)
);
""")

# 7️⃣ Admin Table
cursor.execute("""
CREATE TABLE admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_name VARCHAR(100) NOT NULL,
    contact VARCHAR(10) NOT NULL UNIQUE,
    CHECK (contact REGEXP '^[0-9]{10}$')
);
""")

# ---------- DATA INSERTION ----------

# Doctor (one entry, now with contact)
cursor.execute("""
INSERT INTO doctor (d_name, specialization, availability, contact)
VALUES ('Dr. Meena Iyer', 'General Physician', 'Mon-Sat 9am-5pm', '9998887776');
""")

# Patients
cursor.executemany("""
INSERT INTO patient (p_name, age, gender, contact)
VALUES (%s, %s, %s, %s);
""", [
    ('Riya Sharma', 28, 'Female', '9876543210'),
    ('Amit Verma', 35, 'Male', '8765432109'),
    ('Sneha Patel', 22, 'Female', '7654321098'),
    ('Rahul Mehta', 40, 'Male', '9988776655'),
    ('Karan Singh', 31, 'Male', '9090909090')
])

# All appointments on same date (real date, not variable)
cursor.executemany("""
INSERT INTO appointment (p_id, d_id, date, time, status)
VALUES (%s, %s, %s, %s, %s);
""", [
    (1, 1, '2025-11-02', '16:00:00', 'Scheduled'),
    (2, 1, '2025-11-02', '16:30:00', 'Scheduled'),
    (3, 1, '2025-11-02', '17:00:00', 'Scheduled'),
    (4, 1, '2025-11-02', '10:30:00', 'Completed'),
    (5, 1, '2025-11-02', '11:00:00', 'Scheduled'),
    (1, 1, '2025-11-01', '11:30:00', 'Completed'),
    (3, 1, '2025-11-03', '12:00:00', 'Scheduled'),
    (2, 1, '2025-11-04', '12:30:00', 'Scheduled')
])

# Consultations (linked to completed appointments only)
cursor.executemany("""
INSERT INTO consultation (a_id, symptoms, prescription)
VALUES (%s, %s, %s);
""", [
    (4, 'Fever', 'Paracetamol 500mg twice a day'),
    (6, 'Cough', 'Cough syrup twice a day')
])

# Billing
cursor.executemany("""
INSERT INTO billing (a_id, amount, payment_status)
VALUES (%s, %s, %s);
""", [
    (1, 500.00, 'Pending'),
    (2, 500.00, 'Pending'),
    (3, 500.00, 'Pending'),
    (4, 500.00, 'Paid'),
    (5, 500.00, 'Pending'),
    (6, 500.00, 'Paid'),
    (7, 500.00, 'Pending'),
    (8, 500.00, 'Pending')
])

# Queue
cursor.executemany("""
INSERT INTO queue (a_id, token_no, status)
VALUES (%s, %s, %s);
""", [
    (1, 1, 'Waiting'),
    (2, 2, 'Waiting'),
    (3, 3, 'Waiting'),
    (4, 4, 'Completed'),
    (5, 5, 'Waiting'),
    (6, 6, 'Completed'),
    (7, 7, 'Waiting'),
    (8, 8, 'Waiting')
])

# Admin
cursor.execute("""
INSERT INTO admin (admin_name, contact)
VALUES ('System Admin', '1234567890');
""")

# ---------- COMMIT & CLOSE ----------
conn.commit()
cursor.close()
conn.close()

print("✅ Clinic database created successfully with one doctor and all appointments on the same date (2025-11-02)!")
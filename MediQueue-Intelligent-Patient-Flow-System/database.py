import mysql.connector
from datetime import date, datetime, time, timedelta

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

# All appointments with real current date/time
# Get current date and time
today = date.today()
now = datetime.now()
current_time = now.time()

# Create appointments:
# - Some in the past (completed)
# - Many today across all time slots (for testing live queue)
# - Some in the future (scheduled)
yesterday = today - timedelta(days=1)
tomorrow = today + timedelta(days=1)
day_after_tomorrow = today + timedelta(days=2)

# Past appointments (completed)
appointments_data = [
    (1, 1, yesterday, time(11, 30, 0), 'Completed'),
    (4, 1, yesterday, time(10, 30, 0), 'Completed'),
]

# Today's appointments - Create appointments across ALL time slots (9:00 AM to 5:30 PM)
# This ensures we can test the live queue feature at any time
# Working hours: 9:00 AM to 5:30 PM (30-minute slots)
time_slots = []
for hour in range(9, 18):  # 9 AM to 5 PM
    time_slots.append(time(hour, 0, 0))   # :00 slot
    time_slots.append(time(hour, 30, 0))  # :30 slot
time_slots.append(time(17, 30, 0))  # 5:30 PM slot

# Distribute appointments across time slots and patients
# Cycle through patients (1-5) and create appointments
patient_ids = [1, 2, 3, 4, 5]
patient_index = 0

for slot_time in time_slots:
    # Create 2-3 appointments per time slot to test queue properly
    num_appointments = 2 if slot_time.minute == 0 else 3  # Alternate between 2 and 3
    
    for i in range(num_appointments):
        patient_id = patient_ids[patient_index % len(patient_ids)]
        appointments_data.append((patient_id, 1, today, slot_time, 'Scheduled'))
        patient_index += 1

# Future appointments
appointments_data.extend([
    (1, 1, tomorrow, time(12, 0, 0), 'Scheduled'),
    (2, 1, day_after_tomorrow, time(12, 30, 0), 'Scheduled'),
    (3, 1, tomorrow, time(15, 0, 0), 'Scheduled'),
])

# Insert appointments and get their IDs
for appt in appointments_data:
    cursor.execute("""
    INSERT INTO appointment (p_id, d_id, date, time, status)
    VALUES (%s, %s, %s, %s, %s);
    """, appt)

# Get appointment IDs for linking other records
cursor.execute("SELECT a_id, status FROM appointment ORDER BY a_id")
appointments = cursor.fetchall()

# Create mappings for consultations, billing, and queue
completed_appt_ids = [a[0] for a in appointments if a[1] == 'Completed']
all_appt_ids = [a[0] for a in appointments]

# Consultations (linked to completed appointments only)
if len(completed_appt_ids) >= 2:
    cursor.executemany("""
    INSERT INTO consultation (a_id, symptoms, prescription)
    VALUES (%s, %s, %s);
    """, [
        (completed_appt_ids[0], 'Fever', 'Paracetamol 500mg twice a day'),
        (completed_appt_ids[1], 'Cough', 'Cough syrup twice a day')
    ])
elif len(completed_appt_ids) >= 1:
    cursor.execute("""
    INSERT INTO consultation (a_id, symptoms, prescription)
    VALUES (%s, %s, %s);
    """, (completed_appt_ids[0], 'Fever', 'Paracetamol 500mg twice a day'))

# Billing - link to all appointments
billing_data = []
for i, a_id in enumerate(all_appt_ids):
    # Mark first 2 completed appointments as paid, others as pending
    payment_status = 'Paid' if a_id in completed_appt_ids[:2] else 'Pending'
    billing_data.append((a_id, 500.00, payment_status))

cursor.executemany("""
INSERT INTO billing (a_id, amount, payment_status)
VALUES (%s, %s, %s);
""", billing_data)

# Queue - link to all appointments
# Get all appointments sorted by date and time to assign tokens properly
cursor.execute("""
    SELECT a_id, date, time, status 
    FROM appointment 
    ORDER BY date ASC, time ASC
""")
all_appointments_sorted = cursor.fetchall()

queue_data = []
token_counter = 1

for a_id, appt_date, appt_time, appt_status in all_appointments_sorted:
    # Mark completed appointments as completed, others as waiting
    queue_status = 'Completed' if appt_status == 'Completed' else 'Waiting'
    queue_data.append((a_id, token_counter, queue_status))
    token_counter += 1

cursor.executemany("""
INSERT INTO queue (a_id, token_no, status)
VALUES (%s, %s, %s);
""", queue_data)

# Admin
cursor.execute("""
INSERT INTO admin (admin_name, contact)
VALUES ('System Admin', '1234567890');
""")

# ---------- COMMIT & CLOSE ----------
conn.commit()
cursor.close()
conn.close()

print(f"Clinic database created successfully with real date/time! (Current date: {date.today()})")
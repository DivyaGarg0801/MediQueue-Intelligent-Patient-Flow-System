-- MySQL dump 10.13  Distrib 9.4.0, for Win64 (x86_64)
--
-- Host: localhost    Database: hospital
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MOsDE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appointment`
--

DROP TABLE IF EXISTS `appointment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment` (
  `a_id` int NOT NULL AUTO_INCREMENT,
  `p_id` int DEFAULT NULL,
  `d_id` int DEFAULT NULL,
  `date` date DEFAULT NULL,
  `time` time DEFAULT NULL,
  `priority` enum('High','Medium','Low') DEFAULT NULL,
  `a_status` enum('Scheduled','Completed','Cancelled') DEFAULT NULL,
  PRIMARY KEY (`a_id`),
  KEY `p_id` (`p_id`),
  KEY `d_id` (`d_id`),
  CONSTRAINT `appointment_ibfk_1` FOREIGN KEY (`p_id`) REFERENCES `patient` (`p_id`),
  CONSTRAINT `appointment_ibfk_2` FOREIGN KEY (`d_id`) REFERENCES `doctor` (`d_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointment`
--

LOCK TABLES `appointment` WRITE;
/*!40000 ALTER TABLE `appointment` DISABLE KEYS */;
INSERT INTO `appointment` VALUES (1,1,1,'2025-10-01','10:30:00','High','Scheduled'),(2,2,2,'2025-10-02','11:15:00','Medium','Completed'),(3,3,3,'2025-10-03','09:45:00','Low','Scheduled'),(4,4,4,'2025-10-04','12:30:00','High','Scheduled'),(5,5,5,'2025-10-05','10:00:00','Medium','Cancelled'),(6,6,6,'2025-10-06','09:15:00','Low','Scheduled'),(7,7,7,'2025-10-07','14:00:00','High','Completed'),(8,8,8,'2025-10-08','15:45:00','Medium','Scheduled'),(9,9,9,'2025-10-09','11:30:00','Low','Scheduled'),(10,10,10,'2025-10-10','13:20:00','High','Scheduled');
/*!40000 ALTER TABLE `appointment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `billing`
--

DROP TABLE IF EXISTS `billing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing` (
  `b_id` int NOT NULL AUTO_INCREMENT,
  `a_id` int DEFAULT NULL,
  `billing_date` date DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `payment_status` enum('Pending','Paid','Cancelled') DEFAULT NULL,
  PRIMARY KEY (`b_id`),
  KEY `a_id` (`a_id`),
  CONSTRAINT `billing_ibfk_1` FOREIGN KEY (`a_id`) REFERENCES `appointment` (`a_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billing`
--

LOCK TABLES `billing` WRITE;
/*!40000 ALTER TABLE `billing` DISABLE KEYS */;
INSERT INTO `billing` VALUES (1,1,'2025-10-01',1500.00,'Pending'),(2,2,'2025-10-02',2000.00,'Paid'),(3,3,'2025-10-03',1200.00,'Pending'),(4,4,'2025-10-04',1800.00,'Paid'),(5,5,'2025-10-05',2500.00,'Cancelled'),(6,6,'2025-10-06',1600.00,'Pending'),(7,7,'2025-10-07',3000.00,'Paid'),(8,8,'2025-10-08',2200.00,'Pending'),(9,9,'2025-10-09',1400.00,'Paid'),(10,10,'2025-10-10',2600.00,'Pending');
/*!40000 ALTER TABLE `billing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation`
--

DROP TABLE IF EXISTS `consultation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation` (
  `c_id` int NOT NULL AUTO_INCREMENT,
  `a_id` int DEFAULT NULL,
  `symptoms` text,
  `prescription` text,
  PRIMARY KEY (`c_id`),
  KEY `a_id` (`a_id`),
  CONSTRAINT `consultation_ibfk_1` FOREIGN KEY (`a_id`) REFERENCES `appointment` (`a_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation`
--

LOCK TABLES `consultation` WRITE;
/*!40000 ALTER TABLE `consultation` DISABLE KEYS */;
INSERT INTO `consultation` VALUES (1,1,'Chest pain, fatigue','ECG advised, aspirin 75mg daily'),(2,2,'Skin rash, itching','Antihistamine cream, cetirizine 10mg'),(3,3,'Fever, cough','Paracetamol 500mg, rest'),(4,4,'Knee pain, swelling','Ibuprofen 400mg, physiotherapy'),(5,5,'Frequent headaches','MRI scan, pain relief medication'),(6,6,'Sore throat, congestion','Antibiotic syrup, steam inhalation'),(7,7,'Pregnancy checkup','Folic acid supplements'),(8,8,'Fatigue, weight loss','Blood tests, vitamin supplements'),(9,9,'High BP','Amlodipine 5mg daily'),(10,10,'Anxiety, stress','Counseling, mild sedative');
/*!40000 ALTER TABLE `consultation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor`
--

DROP TABLE IF EXISTS `doctor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor` (
  `d_id` int NOT NULL AUTO_INCREMENT,
  `d_name` varchar(100) DEFAULT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `availability` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`d_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor`
--

LOCK TABLES `doctor` WRITE;
/*!40000 ALTER TABLE `doctor` DISABLE KEYS */;
INSERT INTO `doctor` VALUES (1,'Dr. Meena Iyer','Cardiologist','Mon-Fri 10am-4pm'),(2,'Dr. Arjun Rao','Dermatologist','Tue-Sat 11am-3pm'),(3,'Dr. Kavita Gupta','Pediatrician','Mon-Sat 9am-5pm'),(4,'Dr. Sameer Khan','Orthopedic','Mon-Fri 12pm-6pm'),(5,'Dr. Sunita Mishra','Neurologist','Wed-Sun 10am-2pm'),(6,'Dr. Rakesh Nair','ENT Specialist','Mon-Sat 9am-1pm'),(7,'Dr. Divya Kapoor','Gynecologist','Tue-Sat 11am-4pm'),(8,'Dr. Manish Patel','Oncologist','Mon-Fri 2pm-6pm'),(9,'Dr. Pooja Sethi','General Physician','Mon-Sat 10am-6pm'),(10,'Dr. Harsh Bansal','Psychiatrist','Mon-Fri 1pm-5pm');
/*!40000 ALTER TABLE `doctor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient`
--

DROP TABLE IF EXISTS `patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient` (
  `p_id` int NOT NULL AUTO_INCREMENT,
  `p_name` varchar(100) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `contact` varchar(15) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`p_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient`
--

LOCK TABLES `patient` WRITE;
/*!40000 ALTER TABLE `patient` DISABLE KEYS */;
INSERT INTO `patient` VALUES (1,'Rahul Sharma',34,'Male','9876543210','Delhi'),(2,'Priya Verma',28,'Female','9898989898','Mumbai'),(3,'Amit Singh',45,'Male','9123456789','Bangalore'),(4,'Sneha Kapoor',31,'Female','9812345678','Chennai'),(5,'Rohit Mehta',52,'Male','9900112233','Kolkata'),(6,'Anjali Das',40,'Female','9765432109','Pune'),(7,'Vikram Joshi',27,'Male','9897001122','Hyderabad'),(8,'Neha Rathi',36,'Female','9811998877','Jaipur'),(9,'Karan Malhotra',60,'Male','9776655443','Ahmedabad'),(10,'Shreya Banerjee',22,'Female','9800123456','Lucknow');
/*!40000 ALTER TABLE `patient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `queue`
--

DROP TABLE IF EXISTS `queue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `queue` (
  `q_id` int NOT NULL AUTO_INCREMENT,
  `a_id` int DEFAULT NULL,
  `q_status` enum('Waiting','In Progress','Completed','Cancelled') DEFAULT NULL,
  PRIMARY KEY (`q_id`),
  KEY `a_id` (`a_id`),
  CONSTRAINT `queue_ibfk_1` FOREIGN KEY (`a_id`) REFERENCES `appointment` (`a_id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `queue`
--

LOCK TABLES `queue` WRITE;
/*!40000 ALTER TABLE `queue` DISABLE KEYS */;
INSERT INTO `queue` VALUES (31,1,'Waiting'),(32,2,'Completed'),(33,3,'Waiting'),(34,4,'In Progress'),(35,5,'Waiting'),(36,6,'Waiting'),(37,7,'Completed'),(38,8,'In Progress'),(39,9,'Waiting'),(40,10,'Waiting');
/*!40000 ALTER TABLE `queue` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-30 23:24:28

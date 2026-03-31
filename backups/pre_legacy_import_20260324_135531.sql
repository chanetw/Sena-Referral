-- MySQL dump 10.13  Distrib 8.0.45, for Linux (aarch64)
--
-- Host: localhost    Database: sena_referral
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `table_name` varchar(50) NOT NULL,
  `record_id` int NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_logs_user_id` (`user_id`),
  KEY `idx_activity_logs_table_record` (`table_name`,`record_id`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (1,2,'CREATE','customers',1,NULL,'{\"email\": \"jirayu@email.com\", \"phone\": \"0901234567\", \"source\": \"referral\", \"status\": \"new\", \"agent_id\": 1, \"last_name\": \"à¸¡à¸±à¹ˆà¸‡à¸¡à¸µ\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"à¸ˆà¸´à¸£à¸²à¸¢à¸¸\", \"project_id\": 1}',NULL,NULL,'2026-03-19 04:33:11'),(2,2,'CREATE','customers',2,NULL,'{\"email\": \"nantana@email.com\", \"phone\": \"0912345678\", \"source\": \"walk_in\", \"status\": \"contacted\", \"agent_id\": 1, \"last_name\": \"à¸ªà¸§à¸¢à¸‡à¸²à¸¡\", \"budget_max\": 10000000.00, \"budget_min\": 6000000.00, \"first_name\": \"à¸™à¸±à¸™à¸—à¸™à¸²\", \"project_id\": 2}',NULL,NULL,'2026-03-19 04:33:11'),(3,3,'CREATE','customers',3,NULL,'{\"email\": \"thanakorn@email.com\", \"phone\": \"0923456789\", \"source\": \"online\", \"status\": \"interested\", \"agent_id\": 2, \"last_name\": \"à¸£à¸§à¸¢à¹€à¸£à¹‡à¸§\", \"budget_max\": 4000000.00, \"budget_min\": 2500000.00, \"first_name\": \"à¸˜à¸™à¸²à¸à¸£\", \"project_id\": 3}',NULL,NULL,'2026-03-19 04:33:11'),(4,3,'CREATE','customers',4,NULL,'{\"email\": \"ariya@email.com\", \"phone\": \"0934567890\", \"source\": \"referral\", \"status\": \"visit_scheduled\", \"agent_id\": 2, \"last_name\": \"à¸›à¸£à¸²à¸”à¹€à¸›à¸£à¸·à¹ˆà¸­à¸‡\", \"budget_max\": 7000000.00, \"budget_min\": 4000000.00, \"first_name\": \"à¸­à¸²à¸£à¸µà¸¢à¸²\", \"project_id\": 1}',NULL,NULL,'2026-03-19 04:33:11'),(5,2,'CREATE','customers',5,NULL,'{\"email\": \"siriporn@email.com\", \"phone\": \"0945678901\", \"source\": \"phone\", \"status\": \"visited\", \"agent_id\": 1, \"last_name\": \"à¹€à¸à¹ˆà¸‡à¸à¸²à¸ˆ\", \"budget_max\": 6000000.00, \"budget_min\": 3500000.00, \"first_name\": \"à¸¨à¸´à¸£à¸´à¸žà¸£\", \"project_id\": 4}',NULL,NULL,'2026-03-19 04:33:11'),(6,2,'UPDATE','customers',1,'{\"email\": \"jirayu@email.com\", \"notes\": \"à¸¥à¸¹à¸à¸„à¹‰à¸²à¸ªà¸™à¹ƒà¸ˆà¸„à¸­à¸™à¹‚à¸” à¸§à¸´à¸§à¸”à¸µ\", \"phone\": \"0901234567\", \"source\": \"referral\", \"status\": \"new\", \"agent_id\": 1, \"last_name\": \"à¸¡à¸±à¹ˆà¸‡à¸¡à¸µ\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"à¸ˆà¸´à¸£à¸²à¸¢à¸¸\", \"project_id\": 1, \"sena_approved\": 0}','{\"email\": \"jirayu@email.com\", \"notes\": \"ลูกค้าสนใจคอนโด วิวดี\", \"phone\": \"0901234567\", \"source\": \"referral\", \"status\": \"new\", \"agent_id\": 1, \"last_name\": \"มั่งมี\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"จิรายุ\", \"project_id\": 1, \"sena_approved\": 0}',NULL,NULL,'2026-03-19 04:39:13'),(7,2,'UPDATE','customers',2,'{\"email\": \"nantana@email.com\", \"notes\": \"à¸ªà¸™à¹ƒà¸ˆà¸šà¹‰à¸²à¸™à¹€à¸”à¸µà¹ˆà¸¢à¸§ à¸¡à¸µà¸ªà¸§à¸™\", \"phone\": \"0912345678\", \"source\": \"walk_in\", \"status\": \"contacted\", \"agent_id\": 1, \"last_name\": \"à¸ªà¸§à¸¢à¸‡à¸²à¸¡\", \"budget_max\": 10000000.00, \"budget_min\": 6000000.00, \"first_name\": \"à¸™à¸±à¸™à¸—à¸™à¸²\", \"project_id\": 2, \"sena_approved\": 0}','{\"email\": \"nantana@email.com\", \"notes\": \"สนใจบ้านเดี่ยว มีสวน\", \"phone\": \"0912345678\", \"source\": \"walk_in\", \"status\": \"contacted\", \"agent_id\": 1, \"last_name\": \"สวยงาม\", \"budget_max\": 10000000.00, \"budget_min\": 6000000.00, \"first_name\": \"นันทนา\", \"project_id\": 2, \"sena_approved\": 0}',NULL,NULL,'2026-03-19 04:39:13'),(8,3,'UPDATE','customers',3,'{\"email\": \"thanakorn@email.com\", \"notes\": \"à¸«à¸²à¸—à¸²à¸§à¸™à¹Œà¹‚à¸®à¸¡ à¹ƒà¸à¸¥à¹‰ BTS\", \"phone\": \"0923456789\", \"source\": \"online\", \"status\": \"interested\", \"agent_id\": 2, \"last_name\": \"à¸£à¸§à¸¢à¹€à¸£à¹‡à¸§\", \"budget_max\": 4000000.00, \"budget_min\": 2500000.00, \"first_name\": \"à¸˜à¸™à¸²à¸à¸£\", \"project_id\": 3, \"sena_approved\": 0}','{\"email\": \"thanakorn@email.com\", \"notes\": \"หาทาวน์โฮม ใกล้ BTS\", \"phone\": \"0923456789\", \"source\": \"online\", \"status\": \"interested\", \"agent_id\": 2, \"last_name\": \"รวยเร็ว\", \"budget_max\": 4000000.00, \"budget_min\": 2500000.00, \"first_name\": \"ธนากร\", \"project_id\": 3, \"sena_approved\": 0}',NULL,NULL,'2026-03-19 04:39:13'),(9,3,'UPDATE','customers',4,'{\"email\": \"ariya@email.com\", \"notes\": \"à¸™à¸±à¸”à¸Šà¸¡à¸«à¹‰à¸­à¸‡à¸•à¸±à¸§à¸­à¸¢à¹ˆà¸²à¸‡ à¸§à¸±à¸™à¹€à¸ªà¸²à¸£à¹Œ\", \"phone\": \"0934567890\", \"source\": \"referral\", \"status\": \"visit_scheduled\", \"agent_id\": 2, \"last_name\": \"à¸›à¸£à¸²à¸”à¹€à¸›à¸£à¸·à¹ˆà¸­à¸‡\", \"budget_max\": 7000000.00, \"budget_min\": 4000000.00, \"first_name\": \"à¸­à¸²à¸£à¸µà¸¢à¸²\", \"project_id\": 1, \"sena_approved\": 0}','{\"email\": \"ariya@email.com\", \"notes\": \"นัดชมห้องตัวอย่าง วันเสาร์\", \"phone\": \"0934567890\", \"source\": \"referral\", \"status\": \"visit_scheduled\", \"agent_id\": 2, \"last_name\": \"ปราดเปรื่อง\", \"budget_max\": 7000000.00, \"budget_min\": 4000000.00, \"first_name\": \"อารียา\", \"project_id\": 1, \"sena_approved\": 0}',NULL,NULL,'2026-03-19 04:39:13'),(10,2,'UPDATE','customers',5,'{\"email\": \"siriporn@email.com\", \"notes\": \"à¸Šà¸¡à¹à¸¥à¹‰à¸§ à¸žà¸­à¹ƒà¸ˆà¸¡à¸²à¸\", \"phone\": \"0945678901\", \"source\": \"phone\", \"status\": \"visited\", \"agent_id\": 1, \"last_name\": \"à¹€à¸à¹ˆà¸‡à¸à¸²à¸ˆ\", \"budget_max\": 6000000.00, \"budget_min\": 3500000.00, \"first_name\": \"à¸¨à¸´à¸£à¸´à¸žà¸£\", \"project_id\": 4, \"sena_approved\": 0}','{\"email\": \"siriporn@email.com\", \"notes\": \"ชมแล้ว พอใจมาก\", \"phone\": \"0945678901\", \"source\": \"phone\", \"status\": \"visited\", \"agent_id\": 1, \"last_name\": \"เก่งกาจ\", \"budget_max\": 6000000.00, \"budget_min\": 3500000.00, \"first_name\": \"ศิริพร\", \"project_id\": 4, \"sena_approved\": 0}',NULL,NULL,'2026-03-19 04:39:13'),(11,2,'UPDATE','customers',2,'{\"email\": \"nantana@email.com\", \"notes\": \"สนใจบ้านเดี่ยว มีสวน\", \"phone\": \"0912345678\", \"source\": \"walk_in\", \"status\": \"contacted\", \"agent_id\": 1, \"last_name\": \"สวยงาม\", \"budget_max\": 10000000.00, \"budget_min\": 6000000.00, \"first_name\": \"นันทนา\", \"project_id\": 2, \"sena_approved\": 0}','{\"email\": \"nantana@email.com\", \"notes\": \"สนใจบ้านเดี่ยว มีสวน\", \"phone\": \"0912345678\", \"source\": \"walk_in\", \"status\": \"approved\", \"agent_id\": 1, \"last_name\": \"สวยงาม\", \"budget_max\": 10000000.00, \"budget_min\": 6000000.00, \"first_name\": \"นันทนา\", \"project_id\": 2, \"sena_approved\": 0}',NULL,NULL,'2026-03-19 09:15:06'),(12,3,'UPDATE','customers',3,'{\"email\": \"thanakorn@email.com\", \"notes\": \"หาทาวน์โฮม ใกล้ BTS\", \"phone\": \"0923456789\", \"source\": \"online\", \"status\": \"interested\", \"agent_id\": 2, \"last_name\": \"รวยเร็ว\", \"budget_max\": 4000000.00, \"budget_min\": 2500000.00, \"first_name\": \"ธนากร\", \"project_id\": 3, \"sena_approved\": 0}','{\"email\": \"thanakorn@email.com\", \"notes\": \"หาทาวน์โฮม ใกล้ BTS\", \"phone\": \"0923456789\", \"source\": \"online\", \"status\": \"approved\", \"agent_id\": 2, \"last_name\": \"รวยเร็ว\", \"budget_max\": 4000000.00, \"budget_min\": 2500000.00, \"first_name\": \"ธนากร\", \"project_id\": 3, \"sena_approved\": 0}',NULL,NULL,'2026-03-19 09:15:06'),(13,2,'UPDATE','customers',5,'{\"email\": \"siriporn@email.com\", \"notes\": \"ชมแล้ว พอใจมาก\", \"phone\": \"0945678901\", \"source\": \"phone\", \"status\": \"visited\", \"agent_id\": 1, \"last_name\": \"เก่งกาจ\", \"budget_max\": 6000000.00, \"budget_min\": 3500000.00, \"first_name\": \"ศิริพร\", \"project_id\": 4, \"sena_approved\": 0}','{\"email\": \"siriporn@email.com\", \"notes\": \"ชมแล้ว พอใจมาก\", \"phone\": \"0945678901\", \"source\": \"phone\", \"status\": \"approved\", \"agent_id\": 1, \"last_name\": \"เก่งกาจ\", \"budget_max\": 6000000.00, \"budget_min\": 3500000.00, \"first_name\": \"ศิริพร\", \"project_id\": 4, \"sena_approved\": 0}',NULL,NULL,'2026-03-19 09:15:06'),(14,2,'UPDATE','customers',1,'{\"email\": \"jirayu@email.com\", \"notes\": \"ลูกค้าสนใจคอนโด วิวดี\", \"phone\": \"0901234567\", \"source\": \"referral\", \"status\": \"new\", \"agent_id\": 1, \"last_name\": \"มั่งมี\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"จิรายุ\", \"project_id\": 1, \"sena_approved\": 0}','{\"email\": \"jirayu@email.com\", \"notes\": \"ลูกค้าสนใจคอนโด วิวดี\", \"phone\": \"0901234567\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 1, \"last_name\": \"มั่งมี\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"จิรายุ\", \"project_id\": 1, \"sena_approved\": 0}',NULL,NULL,'2026-03-19 09:15:06'),(15,3,'UPDATE','customers',4,'{\"email\": \"ariya@email.com\", \"notes\": \"นัดชมห้องตัวอย่าง วันเสาร์\", \"phone\": \"0934567890\", \"source\": \"referral\", \"status\": \"visit_scheduled\", \"agent_id\": 2, \"last_name\": \"ปราดเปรื่อง\", \"budget_max\": 7000000.00, \"budget_min\": 4000000.00, \"first_name\": \"อารียา\", \"project_id\": 1, \"sena_approved\": 0}','{\"email\": \"ariya@email.com\", \"notes\": \"นัดชมห้องตัวอย่าง วันเสาร์\", \"phone\": \"0934567890\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 2, \"last_name\": \"ปราดเปรื่อง\", \"budget_max\": 7000000.00, \"budget_min\": 4000000.00, \"first_name\": \"อารียา\", \"project_id\": 1, \"sena_approved\": 0}',NULL,NULL,'2026-03-19 09:15:06'),(16,4,'CREATE','customers',6,NULL,'{\"email\": null, \"phone\": \"0999999992\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 1, \"last_name\": \"ระบบ\", \"budget_max\": null, \"budget_min\": null, \"first_name\": \"ทดสอบ2\", \"project_id\": null}',NULL,NULL,'2026-03-19 09:17:04'),(17,NULL,'DELETE','customers',6,'{\"email\": null, \"phone\": \"0999999992\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 1, \"last_name\": \"ระบบ\", \"budget_max\": null, \"budget_min\": null, \"first_name\": \"ทดสอบ2\", \"project_id\": null}',NULL,NULL,NULL,'2026-03-19 09:17:19'),(18,4,'CREATE','customers',7,NULL,'{\"email\": null, \"phone\": \"0888888882\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 1, \"last_name\": \"แอดมิน\", \"budget_max\": null, \"budget_min\": null, \"first_name\": \"ทดสอบ\", \"project_id\": null}',NULL,NULL,'2026-03-19 09:26:20'),(19,5,'CREATE','customers',8,NULL,'{\"email\": null, \"phone\": \"0777777771\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 7, \"last_name\": \"ทดสอบ\", \"budget_max\": null, \"budget_min\": null, \"first_name\": \"ลูกค้า\", \"project_id\": null}',NULL,NULL,'2026-03-19 09:27:38'),(20,NULL,'DELETE','customers',7,'{\"email\": null, \"phone\": \"0888888882\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 1, \"last_name\": \"แอดมิน\", \"budget_max\": null, \"budget_min\": null, \"first_name\": \"ทดสอบ\", \"project_id\": null}',NULL,NULL,NULL,'2026-03-19 09:27:45'),(21,NULL,'DELETE','customers',8,'{\"email\": null, \"phone\": \"0777777771\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 7, \"last_name\": \"ทดสอบ\", \"budget_max\": null, \"budget_min\": null, \"first_name\": \"ลูกค้า\", \"project_id\": null}',NULL,NULL,NULL,'2026-03-19 09:27:45'),(22,5,'CREATE','customers',9,NULL,'{\"email\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4}',NULL,NULL,'2026-03-19 09:29:56'),(23,4,'UPDATE','customers',9,'{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}','{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"approved\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}',NULL,NULL,'2026-03-19 09:43:30'),(24,4,'UPDATE','customers',9,'{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"approved\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}','{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}',NULL,NULL,'2026-03-19 09:58:42'),(25,4,'UPDATE','customers',9,'{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}','{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"duplicate\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}',NULL,NULL,'2026-03-19 09:58:52'),(26,4,'UPDATE','customers',9,'{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"duplicate\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}','{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"approved\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}',NULL,NULL,'2026-03-20 06:57:09'),(27,4,'UPDATE','customers',9,'{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"approved\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}','{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"duplicate\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}',NULL,NULL,'2026-03-20 08:16:55'),(28,4,'UPDATE','customers',9,'{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"duplicate\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}','{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"approved\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}',NULL,NULL,'2026-03-20 08:33:10'),(29,4,'UPDATE','customers',1,'{\"email\": \"jirayu@email.com\", \"notes\": \"ลูกค้าสนใจคอนโด วิวดี\", \"phone\": \"0901234567\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 1, \"last_name\": \"มั่งมี\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"จิรายุ\", \"project_id\": 1, \"sena_approved\": 0}','{\"email\": \"jirayu@email.com\", \"notes\": \"ลูกค้าสนใจคอนโด วิวดี\", \"phone\": \"0901234567\", \"source\": \"referral\", \"status\": \"approved\", \"agent_id\": 1, \"last_name\": \"มั่งมี\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"จิรายุ\", \"project_id\": 1, \"sena_approved\": 0}',NULL,NULL,'2026-03-20 08:53:37'),(30,4,'UPDATE','customers',9,'{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"approved\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}','{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"duplicate\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}',NULL,NULL,'2026-03-20 08:54:26'),(31,4,'UPDATE','customers',1,'{\"email\": \"jirayu@email.com\", \"notes\": \"ลูกค้าสนใจคอนโด วิวดี\", \"phone\": \"0901234567\", \"source\": \"referral\", \"status\": \"approved\", \"agent_id\": 1, \"last_name\": \"มั่งมี\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"จิรายุ\", \"project_id\": 1, \"sena_approved\": 0}','{\"email\": \"jirayu@email.com\", \"notes\": \"ลูกค้าสนใจคอนโด วิวดี\", \"phone\": \"0901234567\", \"source\": \"referral\", \"status\": \"duplicate\", \"agent_id\": 1, \"last_name\": \"มั่งมี\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"จิรายุ\", \"project_id\": 1, \"sena_approved\": 0}',NULL,NULL,'2026-03-20 08:54:50'),(32,4,'UPDATE','customers',2,'{\"email\": \"nantana@email.com\", \"notes\": \"สนใจบ้านเดี่ยว มีสวน\", \"phone\": \"0912345678\", \"source\": \"walk_in\", \"status\": \"approved\", \"agent_id\": 1, \"last_name\": \"สวยงาม\", \"budget_max\": 10000000.00, \"budget_min\": 6000000.00, \"first_name\": \"นันทนา\", \"project_id\": 2, \"sena_approved\": 0}','{\"email\": \"nantana@email.com\", \"notes\": \"สนใจบ้านเดี่ยว มีสวน\", \"phone\": \"0912345678\", \"source\": \"walk_in\", \"status\": \"duplicate\", \"agent_id\": 1, \"last_name\": \"สวยงาม\", \"budget_max\": 10000000.00, \"budget_min\": 6000000.00, \"first_name\": \"นันทนา\", \"project_id\": 2, \"sena_approved\": 0}',NULL,NULL,'2026-03-20 08:55:33'),(33,4,'UPDATE','customers',2,'{\"email\": \"nantana@email.com\", \"notes\": \"สนใจบ้านเดี่ยว มีสวน\", \"phone\": \"0912345678\", \"source\": \"walk_in\", \"status\": \"duplicate\", \"agent_id\": 1, \"last_name\": \"สวยงาม\", \"budget_max\": 10000000.00, \"budget_min\": 6000000.00, \"first_name\": \"นันทนา\", \"project_id\": 2, \"sena_approved\": 0}','{\"email\": \"nantana@email.com\", \"notes\": \"สนใจบ้านเดี่ยว มีสวน\", \"phone\": \"0912345678\", \"source\": \"walk_in\", \"status\": \"pending\", \"agent_id\": 1, \"last_name\": \"สวยงาม\", \"budget_max\": 10000000.00, \"budget_min\": 6000000.00, \"first_name\": \"นันทนา\", \"project_id\": 2, \"sena_approved\": 0}',NULL,NULL,'2026-03-20 08:56:17'),(34,4,'UPDATE','customers',3,'{\"email\": \"thanakorn@email.com\", \"notes\": \"หาทาวน์โฮม ใกล้ BTS\", \"phone\": \"0923456789\", \"source\": \"online\", \"status\": \"approved\", \"agent_id\": 2, \"last_name\": \"รวยเร็ว\", \"budget_max\": 4000000.00, \"budget_min\": 2500000.00, \"first_name\": \"ธนากร\", \"project_id\": 3, \"sena_approved\": 0}','{\"email\": \"thanakorn@email.com\", \"notes\": \"หาทาวน์โฮม ใกล้ BTS\", \"phone\": \"0923456789\", \"source\": \"online\", \"status\": \"pending\", \"agent_id\": 2, \"last_name\": \"รวยเร็ว\", \"budget_max\": 4000000.00, \"budget_min\": 2500000.00, \"first_name\": \"ธนากร\", \"project_id\": 3, \"sena_approved\": 0}',NULL,NULL,'2026-03-20 08:56:22'),(35,4,'UPDATE','customers',2,'{\"email\": \"nantana@email.com\", \"notes\": \"สนใจบ้านเดี่ยว มีสวน\", \"phone\": \"0912345678\", \"source\": \"walk_in\", \"status\": \"pending\", \"agent_id\": 1, \"last_name\": \"สวยงาม\", \"budget_max\": 10000000.00, \"budget_min\": 6000000.00, \"first_name\": \"นันทนา\", \"project_id\": 2, \"sena_approved\": 0}','{\"email\": \"nantana@email.com\", \"notes\": \"สนใจบ้านเดี่ยว มีสวน\", \"phone\": \"0912345678\", \"source\": \"walk_in\", \"status\": \"duplicate\", \"agent_id\": 1, \"last_name\": \"สวยงาม\", \"budget_max\": 10000000.00, \"budget_min\": 6000000.00, \"first_name\": \"นันทนา\", \"project_id\": 2, \"sena_approved\": 0}',NULL,NULL,'2026-03-20 08:56:26'),(36,1,'agent_duplicate_idcard_pending','agents',10,NULL,'{\"type\": \"agent_duplicate_idcard_pending\", \"message\": \"มีการสมัครเอเจนต์ด้วยเลขบัตรประชาชนซ้ำ รอการตรวจสอบจากผู้ดูแลระบบ\", \"matchedAgentId\": 8, \"pendingAgentId\": 10, \"submittedEmail\": \"agent_dup_1773997453@test.com\", \"submittedIdCard\": \"0000000000002\", \"matchedAgentCode\": \"AG008\", \"pendingAgentCode\": \"AG010\"}','::ffff:172.20.0.1','curl/8.7.1','2026-03-20 09:04:14'),(37,4,'agent_duplicate_idcard_pending','agents',10,NULL,'{\"type\": \"agent_duplicate_idcard_pending\", \"message\": \"มีการสมัครเอเจนต์ด้วยเลขบัตรประชาชนซ้ำ รอการตรวจสอบจากผู้ดูแลระบบ\", \"matchedAgentId\": 8, \"pendingAgentId\": 10, \"submittedEmail\": \"agent_dup_1773997453@test.com\", \"submittedIdCard\": \"0000000000002\", \"matchedAgentCode\": \"AG008\", \"pendingAgentCode\": \"AG010\"}','::ffff:172.20.0.1','curl/8.7.1','2026-03-20 09:04:14'),(38,1,'agent_duplicate_idcard_pending','agents',11,NULL,'{\"type\": \"agent_duplicate_idcard_pending\", \"message\": \"มีการสมัครเอเจนต์ด้วยเลขบัตรประชาชนซ้ำ รอการตรวจสอบจากผู้ดูแลระบบ\", \"matchedAgentId\": 8, \"pendingAgentId\": 11, \"submittedEmail\": \"agent_dup_1773997464@test.com\", \"submittedIdCard\": \"0000000000002\", \"matchedAgentCode\": \"AG008\", \"pendingAgentCode\": \"AG011\"}','::ffff:172.20.0.1','curl/8.7.1','2026-03-20 09:04:24'),(39,4,'agent_duplicate_idcard_pending','agents',11,NULL,'{\"type\": \"agent_duplicate_idcard_pending\", \"message\": \"มีการสมัครเอเจนต์ด้วยเลขบัตรประชาชนซ้ำ รอการตรวจสอบจากผู้ดูแลระบบ\", \"matchedAgentId\": 8, \"pendingAgentId\": 11, \"submittedEmail\": \"agent_dup_1773997464@test.com\", \"submittedIdCard\": \"0000000000002\", \"matchedAgentCode\": \"AG008\", \"pendingAgentCode\": \"AG011\"}','::ffff:172.20.0.1','curl/8.7.1','2026-03-20 09:04:24'),(40,4,'UPDATE','customers',1,'{\"email\": \"jirayu@email.com\", \"notes\": \"ลูกค้าสนใจคอนโด วิวดี\", \"phone\": \"0901234567\", \"source\": \"referral\", \"status\": \"duplicate\", \"agent_id\": 1, \"last_name\": \"มั่งมี\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"จิรายุ\", \"project_id\": 1, \"sena_approved\": 0}','{\"email\": \"jirayu@email.com\", \"notes\": \"ลูกค้าสนใจคอนโด วิวดี\", \"phone\": \"0901234567\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 1, \"last_name\": \"มั่งมี\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"จิรายุ\", \"project_id\": 1, \"sena_approved\": 0}',NULL,NULL,'2026-03-20 09:57:46'),(41,4,'UPDATE','customers',1,'{\"email\": \"jirayu@email.com\", \"notes\": \"ลูกค้าสนใจคอนโด วิวดี\", \"phone\": \"0901234567\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 1, \"last_name\": \"มั่งมี\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"จิรายุ\", \"project_id\": 1, \"sena_approved\": 0}','{\"email\": \"jirayu@email.com\", \"notes\": \"ลูกค้าสนใจคอนโด วิวดี\", \"phone\": \"0901234567\", \"source\": \"referral\", \"status\": \"approved\", \"agent_id\": 1, \"last_name\": \"มั่งมี\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"จิรายุ\", \"project_id\": 1, \"sena_approved\": 0}',NULL,NULL,'2026-03-20 09:57:48'),(42,4,'UPDATE','customers',9,'{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"duplicate\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}','{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}',NULL,NULL,'2026-03-20 09:59:01'),(43,4,'UPDATE','customers',4,'{\"email\": \"ariya@email.com\", \"notes\": \"นัดชมห้องตัวอย่าง วันเสาร์\", \"phone\": \"0934567890\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 2, \"last_name\": \"ปราดเปรื่อง\", \"budget_max\": 7000000.00, \"budget_min\": 4000000.00, \"first_name\": \"อารียา\", \"project_id\": 1, \"sena_approved\": 0}','{\"email\": \"ariya@email.com\", \"notes\": \"นัดชมห้องตัวอย่าง วันเสาร์\", \"phone\": \"0934567890\", \"source\": \"referral\", \"status\": \"approved\", \"agent_id\": 2, \"last_name\": \"ปราดเปรื่อง\", \"budget_max\": 7000000.00, \"budget_min\": 4000000.00, \"first_name\": \"อารียา\", \"project_id\": 1, \"sena_approved\": 0}',NULL,NULL,'2026-03-20 10:42:00'),(44,4,'UPDATE','customers',9,'{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}','{\"email\": null, \"notes\": null, \"phone\": \"0814443333\", \"source\": \"referral\", \"status\": \"approved\", \"agent_id\": 7, \"last_name\": \"เสนา\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"Sena\", \"project_id\": 4, \"sena_approved\": 0}',NULL,NULL,'2026-03-23 04:51:46'),(45,5,'CREATE','customers',10,NULL,'{\"email\": null, \"phone\": \"09978965432\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 7, \"last_name\": \"livnex\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"คุณลูกค้า\", \"project_id\": 4}',NULL,NULL,'2026-03-24 02:38:15'),(46,4,'CREATE','customers',11,NULL,'{\"email\": \"notify-1774321608575@example.com\", \"phone\": \"0821608575\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 1, \"last_name\": \"แจ้งเตือน1774321608575\", \"budget_max\": null, \"budget_min\": null, \"first_name\": \"ทดสอบ\", \"project_id\": 1}',NULL,NULL,'2026-03-24 03:06:48'),(47,4,'CREATE','customers',12,NULL,'{\"email\": \"notify-1774321678507@example.com\", \"phone\": \"0821678507\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 1, \"last_name\": \"แจ้งเตือน1774321678507\", \"budget_max\": null, \"budget_min\": null, \"first_name\": \"ทดสอบ\", \"project_id\": 1}',NULL,NULL,'2026-03-24 03:07:58'),(48,4,'UPDATE','customers',10,'{\"email\": null, \"notes\": null, \"phone\": \"09978965432\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 7, \"last_name\": \"livnex\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"คุณลูกค้า\", \"project_id\": 4, \"sena_approved\": 0}','{\"email\": null, \"notes\": null, \"phone\": \"09978965432\", \"source\": \"referral\", \"status\": \"approved\", \"agent_id\": 7, \"last_name\": \"livnex\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"คุณลูกค้า\", \"project_id\": 4, \"sena_approved\": 0}',NULL,NULL,'2026-03-24 03:24:44'),(49,NULL,'DELETE','customers',11,'{\"email\": \"notify-1774321608575@example.com\", \"phone\": \"0821608575\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 1, \"last_name\": \"แจ้งเตือน1774321608575\", \"budget_max\": null, \"budget_min\": null, \"first_name\": \"ทดสอบ\", \"project_id\": 1}',NULL,NULL,NULL,'2026-03-24 04:26:39'),(50,4,'UPDATE','customers',10,'{\"email\": null, \"notes\": null, \"phone\": \"09978965432\", \"source\": \"referral\", \"status\": \"approved\", \"agent_id\": 7, \"last_name\": \"livnex\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"คุณลูกค้า\", \"project_id\": 4, \"sena_approved\": 0}','{\"email\": null, \"notes\": null, \"phone\": \"09978965432\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 7, \"last_name\": \"livnex\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"คุณลูกค้า\", \"project_id\": 4, \"sena_approved\": 0}',NULL,NULL,'2026-03-24 04:26:53'),(51,4,'UPDATE','customers',10,'{\"email\": null, \"notes\": null, \"phone\": \"09978965432\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 7, \"last_name\": \"livnex\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"คุณลูกค้า\", \"project_id\": 4, \"sena_approved\": 0}','{\"email\": null, \"notes\": null, \"phone\": \"09978965432\", \"source\": \"referral\", \"status\": \"approved\", \"agent_id\": 7, \"last_name\": \"livnex\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"คุณลูกค้า\", \"project_id\": 4, \"sena_approved\": 0}',NULL,NULL,'2026-03-24 04:36:39'),(52,4,'UPDATE','customers',10,'{\"email\": null, \"notes\": null, \"phone\": \"09978965432\", \"source\": \"referral\", \"status\": \"approved\", \"agent_id\": 7, \"last_name\": \"livnex\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"คุณลูกค้า\", \"project_id\": 4, \"sena_approved\": 0}','{\"email\": null, \"notes\": null, \"phone\": \"09978965432\", \"source\": \"referral\", \"status\": \"pending\", \"agent_id\": 7, \"last_name\": \"livnex\", \"budget_max\": 5000000.00, \"budget_min\": 3000000.00, \"first_name\": \"คุณลูกค้า\", \"project_id\": 4, \"sena_approved\": 0}',NULL,NULL,'2026-03-24 04:37:04');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agent_type_details`
--

DROP TABLE IF EXISTS `agent_type_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agent_type_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `agent_id` int NOT NULL,
  `referral_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'รหัสแนะนำ',
  `house_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'บ้านเลขที่',
  `project_id` int DEFAULT NULL COMMENT 'โครงการที่อาศัย',
  `department` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'สังกัด/หน่วยงาน',
  `division` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'แผนก',
  `company_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'ชื่อบริษัท',
  `occupation` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'อาชีพ',
  `know_sena_from` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'รู้จักเสนาจากช่องทางใด',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `agent_id` (`agent_id`),
  KEY `fk_atd_project` (`project_id`),
  CONSTRAINT `fk_atd_agent` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_atd_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agent_type_details`
--

LOCK TABLES `agent_type_details` WRITE;
/*!40000 ALTER TABLE `agent_type_details` DISABLE KEYS */;
INSERT INTO `agent_type_details` VALUES (1,16,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-24 03:08:23','2026-03-24 03:08:23'),(2,17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-24 03:08:34','2026-03-24 03:08:34');
/*!40000 ALTER TABLE `agent_type_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agent_types`
--

DROP TABLE IF EXISTS `agent_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agent_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name_th` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agent_types`
--

LOCK TABLES `agent_types` WRITE;
/*!40000 ALTER TABLE `agent_types` DISABLE KEYS */;
INSERT INTO `agent_types` VALUES (1,'resident','ลูกบ้าน',1,1,'2026-03-19 07:18:11','2026-03-19 07:18:11'),(2,'livnex_customer','ลูกค้า LIvnex',1,2,'2026-03-19 07:18:11','2026-03-19 07:18:11'),(3,'rentnex_customer','ลูกค้า Rentnex',1,3,'2026-03-19 07:18:11','2026-03-19 07:18:11'),(4,'sena_staff','พนักงานบริษัทเสนาฯ และบริษัทในเครือ',1,4,'2026-03-19 07:18:11','2026-03-19 07:18:11'),(5,'partner','พันธมิตร คู่ค้า',1,5,'2026-03-19 07:18:11','2026-03-19 07:18:11'),(6,'general','บุคคลทั่วไป',1,6,'2026-03-19 07:18:11','2026-03-19 07:18:11'),(7,'legacy_unknown','à¹„à¸¡à¹ˆà¸£à¸°à¸šà¸¸ (Agent à¹€à¸à¹ˆà¸²)',1,99,'2026-03-24 06:32:58','2026-03-24 06:32:58');
/*!40000 ALTER TABLE `agent_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agents`
--

DROP TABLE IF EXISTS `agents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `agent_type_id` int NOT NULL,
  `agent_code` varchar(20) NOT NULL,
  `agent_id_card` varchar(13) DEFAULT NULL,
  `id_card` varchar(13) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `address` text,
  `registration_date` date NOT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `email` varchar(100) DEFAULT NULL,
  `duplicate_lead_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `agent_code` (`agent_code`),
  UNIQUE KEY `id_card` (`id_card`),
  KEY `user_id` (`user_id`),
  KEY `idx_agents_agent_code` (`agent_code`),
  KEY `idx_agents_status` (`status`),
  CONSTRAINT `agents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agents`
--

LOCK TABLES `agents` WRITE;
/*!40000 ALTER TABLE `agents` DISABLE KEYS */;
INSERT INTO `agents` VALUES (1,2,6,'AG001','1234567890123','1234567890123','สมชาย','ใจดี','0801234567','123 ถนนสุขุมวิท กรุงเทพฯ','2024-01-01','active','2026-03-19 04:33:11','2026-03-20 04:51:23','agent001@sena.co.th',NULL),(2,3,6,'AG002','2345678901234','2345678901234','สมหญิง','รักงาน','0812345678','456 ถนนพหลโยธิน กรุงเทพฯ','2024-01-15','active','2026-03-19 04:33:11','2026-03-20 04:51:23','manager@sena.co.th',NULL),(3,4,6,'AG003','3456789012345','3456789012345','วิชัย','ขยันขันแข็ง','0823456789','789 ถนนรัชดาภิเษก กรุงเทพฯ','2024-02-01','active','2026-03-19 04:33:11','2026-03-20 08:59:28','admin@test.com',NULL),(4,8,6,'AG004','1234567903672','1234567903672','Demo','Activation','0873903672',NULL,'2026-03-19','active','2026-03-19 07:01:12','2026-03-20 04:51:23','activate.1773903672@test.com',NULL),(5,9,6,'AG005','1234567903701','1234567903701','Demo','Activation','0873903701',NULL,'2026-03-19','active','2026-03-19 07:01:41','2026-03-20 04:51:23','activate.1773903701@test.com',NULL),(6,10,1,'AG006','2234567904745','2234567904745','Type','Resident','0973904745',NULL,'2026-03-19','active','2026-03-19 07:19:06','2026-03-20 04:51:23','agenttype.1773904745@test.com',NULL),(7,5,1,'AG007','0000000000001','0000000000001','เทส','เอเจนต์หนึ่ง','0912345678',NULL,'2026-03-19','active','2026-03-19 09:27:17','2026-03-24 01:59:44','agent1@test.com',NULL),(8,6,1,'AG008','0000000000002','0000000000002','เทส','เอเจนต์สอง',NULL,NULL,'2026-03-19','active','2026-03-19 09:27:17','2026-03-20 04:51:23','agent2@test.com',NULL),(9,11,6,'AG009','9100000021323','9100000021323','ทดสอบ','ไม่ซ้ำ','0910020459',NULL,'2026-03-20','active','2026-03-20 09:04:14','2026-03-20 09:04:14','agent_auto_1773997453@test.com',NULL),(10,12,6,'AG010','0000000000002','0000000005382','ทดสอบ','ซ้ำ','0810000905',NULL,'2026-03-20','inactive','2026-03-20 09:04:14','2026-03-20 09:04:14','agent_dup_1773997453@test.com','AG008'),(11,13,6,'AG011','0000000000002','0000000009902','ทดสอบ','ซ้ำ','0810017222',NULL,'2026-03-20','inactive','2026-03-20 09:04:24','2026-03-20 09:04:24','agent_dup_1773997464@test.com','AG008'),(12,14,6,'AG012','9100000000729','9100000000729','ทดสอบ','ไม่ซ้ำ','0910021116',NULL,'2026-03-20','active','2026-03-20 09:04:24','2026-03-20 09:04:24','agent_auto_1773997464@test.com',NULL),(13,15,6,'AG013','7100000002031','7100000002031','Auto','Active','0910009034',NULL,'2026-03-20','active','2026-03-20 09:04:30','2026-03-20 09:04:30','agent_auto_1773997470_x@test.com',NULL),(14,16,6,'AG014','1234567890015','1234567890015','ทดสอบ','เอพีไอใหม่','0875116303',NULL,'2026-03-23','active','2026-03-23 07:39:43','2026-03-23 07:39:43','test.register1774251582837@example.com',NULL),(15,17,6,'AG015','1234567890749','1234567890749','ทดสอบ','ระบบใหม่','0812345699',NULL,'2026-03-23','active','2026-03-23 07:45:20','2026-03-23 07:45:20','test1774251920612@example.com',NULL),(16,18,6,'AG016','8774321703398','8774321703398','ทดสอบ','เอเจนต์1774321703398','0921703398',NULL,'2026-03-24','active','2026-03-24 03:08:23','2026-03-24 03:08:23','agent-notify-1774321703398@example.com',NULL),(17,19,6,'AG017','8774321714389','8774321714389','ทดสอบ','เอเจนต์1774321714389','0921714389',NULL,'2026-03-24','active','2026-03-24 03:08:34','2026-03-24 03:08:34','agent-notify-1774321714389@example.com',NULL);
/*!40000 ALTER TABLE `agents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `customer_history`
--

DROP TABLE IF EXISTS `customer_history`;
/*!50001 DROP VIEW IF EXISTS `customer_history`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `customer_history` AS SELECT 
 1 AS `id`,
 1 AS `action`,
 1 AS `customer_id`,
 1 AS `customer_name`,
 1 AS `changed_by`,
 1 AS `old_values`,
 1 AS `new_values`,
 1 AS `created_at`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `customer_product_types`
--

DROP TABLE IF EXISTS `customer_product_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_product_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `product_type_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_customer_product_type` (`customer_id`,`product_type_id`),
  KEY `fk_cpt_product_type` (`product_type_id`),
  CONSTRAINT `fk_cpt_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cpt_product_type` FOREIGN KEY (`product_type_id`) REFERENCES `product_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_product_types`
--

LOCK TABLES `customer_product_types` WRITE;
/*!40000 ALTER TABLE `customer_product_types` DISABLE KEYS */;
INSERT INTO `customer_product_types` VALUES (1,10,3,'2026-03-24 02:38:15'),(2,10,5,'2026-03-24 02:38:15');
/*!40000 ALTER TABLE `customer_product_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_code` varchar(20) DEFAULT NULL,
  `agent_id` int NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `id_card` varchar(13) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `budget_min` decimal(15,2) DEFAULT NULL,
  `budget_max` decimal(15,2) DEFAULT NULL,
  `status` enum('pending','duplicate','approved') DEFAULT 'pending',
  `source` enum('referral','walk_in','online','phone','other') DEFAULT 'referral',
  `referral_type` enum('self','friend') DEFAULT NULL,
  `notes` text,
  `address` text,
  `registration_date` date DEFAULT NULL,
  `is_duplicate` tinyint(1) DEFAULT '0',
  `duplicate_customer_id` int DEFAULT NULL,
  `sena_approved` tinyint(1) DEFAULT '0',
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `duplicate_customer_id` (`duplicate_customer_id`),
  KEY `approved_by` (`approved_by`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_customers_agent_id` (`agent_id`),
  KEY `idx_customers_project_id` (`project_id`),
  KEY `idx_customers_status` (`status`),
  KEY `idx_customers_created_at` (`created_at`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`),
  CONSTRAINT `customers_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `customers_ibfk_3` FOREIGN KEY (`duplicate_customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `customers_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `customers_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `customers_ibfk_6` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,NULL,1,'จิรายุ','มั่งมี','0901234567','1111111111111','jirayu@email.com',1,3000000.00,5000000.00,'approved','referral','friend','ลูกค้าสนใจคอนโด วิวดี',NULL,NULL,0,NULL,0,NULL,NULL,2,'2026-03-19 04:33:11',4,'2026-03-20 09:57:48'),(2,NULL,1,'นันทนา','สวยงาม','0912345678','2222222222222','nantana@email.com',2,6000000.00,10000000.00,'duplicate','walk_in','self','สนใจบ้านเดี่ยว มีสวน',NULL,NULL,0,NULL,0,NULL,NULL,2,'2026-03-19 04:33:11',4,'2026-03-20 08:56:26'),(3,NULL,2,'ธนากร','รวยเร็ว','0923456789','3333333333333','thanakorn@email.com',3,2500000.00,4000000.00,'pending','online','friend','หาทาวน์โฮม ใกล้ BTS',NULL,NULL,0,NULL,0,NULL,NULL,3,'2026-03-19 04:33:11',4,'2026-03-20 08:56:22'),(4,NULL,2,'อารียา','ปราดเปรื่อง','0934567890','4444444444444','ariya@email.com',1,4000000.00,7000000.00,'approved','referral','self','นัดชมห้องตัวอย่าง วันเสาร์',NULL,NULL,0,NULL,0,NULL,NULL,3,'2026-03-19 04:33:11',4,'2026-03-20 10:42:00'),(5,NULL,1,'ศิริพร','เก่งกาจ','0945678901','5555555555555','siriporn@email.com',4,3500000.00,6000000.00,'approved','phone',NULL,'ชมแล้ว พอใจมาก',NULL,NULL,0,NULL,0,NULL,NULL,2,'2026-03-19 04:33:11',2,'2026-03-19 09:15:06'),(9,NULL,7,'Sena','เสนา','0814443333','1122334455678',NULL,4,3000000.00,5000000.00,'approved','referral','self',NULL,NULL,NULL,0,NULL,0,NULL,NULL,5,'2026-03-19 09:29:56',4,'2026-03-23 04:51:46'),(10,NULL,7,'คุณลูกค้า','livnex','09978965432','2211334445566',NULL,4,3000000.00,5000000.00,'pending','referral','self',NULL,NULL,NULL,0,NULL,0,NULL,NULL,5,'2026-03-24 02:38:15',4,'2026-03-24 04:37:04'),(12,NULL,1,'ทดสอบ','แจ้งเตือน1774321678507','0821678507','9774321678507','notify-1774321678507@example.com',1,NULL,NULL,'pending','referral',NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,4,'2026-03-24 03:07:58',4,'2026-03-24 03:07:58');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `customer_after_insert` AFTER INSERT ON `customers` FOR EACH ROW BEGIN
    CALL LogCustomerActivity(
        NEW.created_by,
        'CREATE',
        NEW.id,
        NULL,
        JSON_OBJECT(
            'agent_id', NEW.agent_id,
            'first_name', NEW.first_name,
            'last_name', NEW.last_name,
            'phone', NEW.phone,
            'email', NEW.email,
            'project_id', NEW.project_id,
            'budget_min', NEW.budget_min,
            'budget_max', NEW.budget_max,
            'status', NEW.status,
            'source', NEW.source
        )
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `customer_after_update` AFTER UPDATE ON `customers` FOR EACH ROW BEGIN
    -- เช็คว่ามีการเปลี่ยนแปลงจริงหรือไม่
    IF (OLD.first_name != NEW.first_name OR
        OLD.last_name != NEW.last_name OR
        OLD.phone != NEW.phone OR
        OLD.email != NEW.email OR
        OLD.project_id != NEW.project_id OR
        OLD.budget_min != NEW.budget_min OR
        OLD.budget_max != NEW.budget_max OR
        OLD.status != NEW.status OR
        OLD.source != NEW.source OR
        OLD.notes != NEW.notes OR
        OLD.sena_approved != NEW.sena_approved) THEN

        CALL LogCustomerActivity(
            NEW.updated_by,
            'UPDATE',
            NEW.id,
            JSON_OBJECT(
                'agent_id', OLD.agent_id,
                'first_name', OLD.first_name,
                'last_name', OLD.last_name,
                'phone', OLD.phone,
                'email', OLD.email,
                'project_id', OLD.project_id,
                'budget_min', OLD.budget_min,
                'budget_max', OLD.budget_max,
                'status', OLD.status,
                'source', OLD.source,
                'notes', OLD.notes,
                'sena_approved', OLD.sena_approved
            ),
            JSON_OBJECT(
                'agent_id', NEW.agent_id,
                'first_name', NEW.first_name,
                'last_name', NEW.last_name,
                'phone', NEW.phone,
                'email', NEW.email,
                'project_id', NEW.project_id,
                'budget_min', NEW.budget_min,
                'budget_max', NEW.budget_max,
                'status', NEW.status,
                'source', NEW.source,
                'notes', NEW.notes,
                'sena_approved', NEW.sena_approved
            )
        );
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `customer_after_delete` AFTER DELETE ON `customers` FOR EACH ROW BEGIN
    CALL LogCustomerActivity(
        @current_user_id, -- ต้องกำหนด session variable ใน application
        'DELETE',
        OLD.id,
        JSON_OBJECT(
            'agent_id', OLD.agent_id,
            'first_name', OLD.first_name,
            'last_name', OLD.last_name,
            'phone', OLD.phone,
            'email', OLD.email,
            'project_id', OLD.project_id,
            'budget_min', OLD.budget_min,
            'budget_max', OLD.budget_max,
            'status', OLD.status,
            'source', OLD.source
        ),
        NULL
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Temporary view structure for view `daily_customer_changes`
--

DROP TABLE IF EXISTS `daily_customer_changes`;
/*!50001 DROP VIEW IF EXISTS `daily_customer_changes`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `daily_customer_changes` AS SELECT 
 1 AS `change_date`,
 1 AS `action`,
 1 AS `count`,
 1 AS `changed_by_users`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `email_logs`
--

DROP TABLE IF EXISTS `email_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recipient_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `template_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','sent','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `data` json DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_recipient_email` (`recipient_email`),
  KEY `idx_template_name` (`template_name`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='บันทึกประวัติการส่งอีเมลจากระบบ SENA HAPPY REFER';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_logs`
--

LOCK TABLES `email_logs` WRITE;
/*!40000 ALTER TABLE `email_logs` DISABLE KEYS */;
INSERT INTO `email_logs` VALUES (1,'chanetw@sena.co.th','คุณทดสอบ ระบบ','FGF_Pass_2_agent','ยืนยันการได้รับสิทธิ์ SENA HAPPY REFER [TEST]','sent','{\"isTestMode\": true, \"refereeName\": \"คุณทดสอบ ระบบ\", \"customerName\": \"คุณกรรณิการ์ พวงผกา\", \"originalRecipient\": \"fake@example.com\"}',NULL,'2026-03-20 01:51:25','2026-03-20 08:51:24','2026-03-20 08:51:25'),(2,'chanetw@sena.co.th','สมชาย ใจดี','FGF_Pass_2_agent','ยืนยันการได้รับสิทธิ์ SENA HAPPY REFER [TEST]','sent','{\"isTestMode\": true, \"refereeName\": \"สมชาย ใจดี\", \"customerName\": \"จิรายุ มั่งมี\", \"originalRecipient\": \"agent001@sena.co.th\"}',NULL,'2026-03-20 01:53:37','2026-03-20 08:53:37','2026-03-20 08:53:37'),(3,'chanetw@sena.co.th','สมชาย ใจดี','FGF_NoPass_1_owner','แจ้งผลการไม่ได้รับสิทธิ์ SENA HAPPY REFER (แนะนำตัวเอง) [TEST]','sent','{\"isTestMode\": true, \"refereeName\": \"สมชาย ใจดี\", \"customerName\": \"นันทนา สวยงาม\", \"originalRecipient\": \"agent001@sena.co.th\"}',NULL,'2026-03-20 01:56:27','2026-03-20 08:56:26','2026-03-20 08:56:27'),(4,'chanetw@sena.co.th','สมชาย ใจดี','FGF_Pass_2_agent','ยืนยันการได้รับสิทธิ์ SENA HAPPY REFER [TEST]','sent','{\"isTestMode\": true, \"refereeName\": \"สมชาย ใจดี\", \"customerName\": \"จิรายุ มั่งมี\", \"originalRecipient\": \"agent001@sena.co.th\"}',NULL,'2026-03-20 02:57:49','2026-03-20 09:57:48','2026-03-20 09:57:49'),(5,'chanetw@sena.co.th','สมหญิง รักงาน','FGF_Pass_1_owner','ยืนยันการได้รับสิทธิ์ SENA HAPPY REFER (แนะนำตัวเอง) [TEST]','sent','{\"isTestMode\": true, \"refereeName\": \"สมหญิง รักงาน\", \"customerName\": \"อารียา ปราดเปรื่อง\", \"originalRecipient\": \"manager@sena.co.th\"}',NULL,'2026-03-20 03:42:02','2026-03-20 10:42:00','2026-03-20 10:42:02'),(6,'chanetw@sena.co.th','เทส เอเจนต์หนึ่ง','FGF_Pass_1_owner','ยืนยันการได้รับสิทธิ์ SENA HAPPY REFER (แนะนำตัวเอง) [TEST]','sent','{\"isTestMode\": true, \"refereeName\": \"เทส เอเจนต์หนึ่ง\", \"customerName\": \"Sena เสนา\", \"originalRecipient\": \"agent1@test.com\"}',NULL,'2026-03-22 21:51:46','2026-03-23 04:51:46','2026-03-23 04:51:46'),(7,'chanetw@sena.co.th',NULL,'notification_customer_created','แจ้งเตือน: มีลูกค้าใหม่ในระบบ [TEST]','sent','{\"status\": \"pending\", \"agentName\": \"AG001 สมชาย ใจดี\", \"isTestMode\": true, \"generatedAt\": \"24/3/2569 03:07:58\", \"projectName\": \"The Reserve Phahol-Pradipat\", \"customerCode\": null, \"customerName\": \"ทดสอบ แจ้งเตือน1774321678507\", \"originalRecipient\": \"chanetw@sena.co.th\"}',NULL,'2026-03-23 20:07:59','2026-03-24 03:07:58','2026-03-24 03:07:59'),(8,'chanetw@sena.co.th',NULL,'notification_customer_created','แจ้งเตือน: มีลูกค้าใหม่ในระบบ [TEST]','sent','{\"status\": \"pending\", \"agentName\": \"AG001 สมชาย ใจดี\", \"isTestMode\": true, \"generatedAt\": \"24/3/2569 03:07:58\", \"projectName\": \"The Reserve Phahol-Pradipat\", \"customerCode\": null, \"customerName\": \"ทดสอบ แจ้งเตือน1774321678507\", \"originalRecipient\": \"admin@test.com\"}',NULL,'2026-03-23 20:08:00','2026-03-24 03:07:58','2026-03-24 03:08:00'),(9,'chanetw@sena.co.th',NULL,'notification_agent_registered','แจ้งเตือน: มีเอเจนต์ลงทะเบียนใหม่ [TEST]','sent','{\"email\": \"agent-notify-1774321714389@example.com\", \"status\": \"active\", \"agentCode\": \"AG017\", \"agentName\": \"ทดสอบ เอเจนต์1774321714389\", \"isTestMode\": true, \"generatedAt\": \"24/3/2569 03:08:34\", \"originalRecipient\": \"chanetw@sena.co.th\", \"requiresAdminReview\": false}',NULL,'2026-03-23 20:08:35','2026-03-24 03:08:34','2026-03-24 03:08:35'),(10,'chanetw@sena.co.th',NULL,'notification_customer_created','แจ้งเตือน: มีลูกค้าใหม่ในระบบ [TEST]','sent','{\"isTest\": true, \"status\": \"pending\", \"agentName\": \"admin@test.com\", \"isTestMode\": true, \"generatedAt\": \"24/3/2569 03:18:36\", \"projectName\": \"โครงการทดสอบ\", \"customerCode\": \"TEST-CUST-001\", \"customerName\": \"ลูกค้าทดสอบระบบ\", \"originalRecipient\": \"chanetw@sena.co.th\"}',NULL,'2026-03-23 20:18:36','2026-03-24 03:18:36','2026-03-24 03:18:36'),(11,'chanetw@sena.co.th',NULL,'notification_customer_created','แจ้งเตือน: มีลูกค้าใหม่ในระบบ [TEST]','sent','{\"isTest\": true, \"status\": \"pending\", \"agentName\": \"admin@test.com\", \"isTestMode\": true, \"generatedAt\": \"24/3/2569 03:19:12\", \"projectName\": \"โครงการทดสอบ\", \"customerCode\": \"TEST-CUST-001\", \"customerName\": \"ลูกค้าทดสอบระบบ\", \"originalRecipient\": \"chanetw@sena.co.th\"}',NULL,'2026-03-23 20:19:12','2026-03-24 03:19:12','2026-03-24 03:19:12'),(12,'chanetw@sena.co.th',NULL,'notification_customer_created','แจ้งเตือน: มีลูกค้าใหม่ในระบบ [TEST]','sent','{\"isTest\": true, \"status\": \"pending\", \"agentName\": \"admin@test.com\", \"isTestMode\": true, \"generatedAt\": \"24/3/2569 03:19:27\", \"projectName\": \"โครงการทดสอบ\", \"customerCode\": \"TEST-CUST-001\", \"customerName\": \"ลูกค้าทดสอบระบบ\", \"originalRecipient\": \"chanetw@sena.co.th\"}',NULL,'2026-03-23 20:19:27','2026-03-24 03:19:27','2026-03-24 03:19:27'),(13,'chanetw@sena.co.th',NULL,'notification_agent_registered','แจ้งเตือน: มีเอเจนต์ลงทะเบียนใหม่ [TEST]','sent','{\"email\": \"admin@test.com\", \"isTest\": true, \"status\": \"active\", \"agentCode\": \"TEST-AG001\", \"agentName\": \"เอเจนต์ทดสอบระบบ\", \"isTestMode\": true, \"generatedAt\": \"24/3/2569 03:19:40\", \"originalRecipient\": \"chanetw@sena.co.th\"}',NULL,'2026-03-23 20:19:41','2026-03-24 03:19:40','2026-03-24 03:19:41'),(14,'chanetw@sena.co.th','เทส เอเจนต์หนึ่ง','FGF_Pass_1_owner','ยืนยันการได้รับสิทธิ์ SENA HAPPY REFER (แนะนำตัวเอง) [TEST]','sent','{\"isTestMode\": true, \"refereeName\": \"เทส เอเจนต์หนึ่ง\", \"customerName\": \"คุณลูกค้า livnex\", \"originalRecipient\": \"agent1@test.com\"}',NULL,'2026-03-23 20:24:44','2026-03-24 03:24:44','2026-03-24 03:24:44'),(15,'chanetw@sena.co.th','เทส เอเจนต์หนึ่ง','FGF_Pass_1_owner','ยืนยันการได้รับสิทธิ์ SENA HAPPY REFER (แนะนำตัวเอง) [TEST]','sent','{\"isTestMode\": true, \"refereeName\": \"เทส เอเจนต์หนึ่ง\", \"customerName\": \"คุณลูกค้า livnex\", \"originalRecipient\": \"agent1@test.com\"}',NULL,'2026-03-23 21:36:39','2026-03-24 04:36:39','2026-03-24 04:36:39');
/*!40000 ALTER TABLE `email_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `source` enum('website','facebook','google','referral','walk_in','other') DEFAULT 'other',
  `interest_project_id` int DEFAULT NULL,
  `budget_range` varchar(50) DEFAULT NULL,
  `status` enum('new','contacted','qualified','converted','lost') DEFAULT 'new',
  `notes` text,
  `assigned_to` int DEFAULT NULL,
  `converted_customer_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `interest_project_id` (`interest_project_id`),
  KEY `converted_customer_id` (`converted_customer_id`),
  KEY `idx_leads_assigned_to` (`assigned_to`),
  KEY `idx_leads_status` (`status`),
  CONSTRAINT `leads_ibfk_1` FOREIGN KEY (`interest_project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `leads_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `agents` (`id`),
  CONSTRAINT `leads_ibfk_3` FOREIGN KEY (`converted_customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leads`
--

LOCK TABLES `leads` WRITE;
/*!40000 ALTER TABLE `leads` DISABLE KEYS */;
INSERT INTO `leads` VALUES (1,'มานิต','ใฝ่หา','0956789012','manit@email.com','website',1,'3-5 à¸¥à¹‰à¸²à¸™','new','สนใจคอนโด กรอกข้อมูลจากเว็บ',1,NULL,'2026-03-19 04:33:11','2026-03-19 04:39:13'),(2,'ปิยะดา','มีฝัน','0967890123','piyada@email.com','facebook',2,'8-12 à¸¥à¹‰à¸²à¸™','contacted','ติดต่อผ่าน Facebook',2,NULL,'2026-03-19 04:33:11','2026-03-19 04:39:13');
/*!40000 ALTER TABLE `leads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_rules`
--

DROP TABLE IF EXISTS `notification_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_type` enum('customer_created','agent_registered') COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_emails` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'JSON array of recipients',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notification_rules_action` (`action_type`),
  KEY `idx_notification_rules_active` (`is_active`),
  KEY `fk_notification_rules_created_by` (`created_by`),
  KEY `fk_notification_rules_updated_by` (`updated_by`),
  CONSTRAINT `fk_notification_rules_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_notification_rules_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='à¸à¸•à¸´à¸à¸²à¸à¸²à¸£à¸ªà¹ˆà¸‡à¸­à¸µà¹€à¸¡à¸¥à¹à¸ˆà¹‰à¸‡à¹€à¸•à¸·à¸­à¸™à¸•à¸²à¸¡à¹€à¸«à¸•à¸¸à¸à¸²à¸£à¸“à¹Œà¹ƒà¸™à¸£à¸°à¸šà¸š';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_rules`
--

LOCK TABLES `notification_rules` WRITE;
/*!40000 ALTER TABLE `notification_rules` DISABLE KEYS */;
INSERT INTO `notification_rules` VALUES (3,'customer_created','[\"chanetw@sena.co.th\"]',1,4,4,'2026-03-24 03:04:15','2026-03-24 03:04:15'),(6,'agent_registered','[\"chanetw@sena.co.th\"]',1,4,4,'2026-03-24 03:08:29','2026-03-24 03:08:29');
/*!40000 ALTER TABLE `notification_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_types`
--

DROP TABLE IF EXISTS `product_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_types`
--

LOCK TABLES `product_types` WRITE;
/*!40000 ALTER TABLE `product_types` DISABLE KEYS */;
INSERT INTO `product_types` VALUES (1,'condo','Condo',1,10,'2026-03-24 02:35:42','2026-03-24 02:35:42'),(2,'house','House',1,20,'2026-03-24 02:35:42','2026-03-24 02:35:42'),(3,'livnex','Livnex',1,30,'2026-03-24 02:35:42','2026-03-24 02:35:42'),(4,'rentnex','Rentnex',1,40,'2026-03-24 02:35:42','2026-03-24 02:35:42'),(5,'pre-livnex','Pre-Livnex',1,50,'2026-03-24 02:35:42','2026-03-24 02:35:42');
/*!40000 ALTER TABLE `product_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_code` varchar(20) NOT NULL,
  `project_name` varchar(100) NOT NULL,
  `project_type` enum('condo','house','townhome','commercial') NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `price_range_min` decimal(15,2) DEFAULT NULL,
  `price_range_max` decimal(15,2) DEFAULT NULL,
  `sales_team` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `project_sale` varchar(100) DEFAULT NULL,
  `bud` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_code` (`project_code`)
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'PROJ001','นิช ไอดี แอท ปากเกร็ด สเตชั่น','condo',NULL,NULL,NULL,NULL,1,'2026-03-19 04:33:11','2026-03-24 03:33:04','admin1',2),(2,'PROJ002','นิช ไอดี เพชรเกษม - บางแค','condo',NULL,NULL,NULL,NULL,0,'2026-03-19 04:33:11','2026-03-24 03:33:04','admin1',2),(3,'PROJ003','นิช ไอดี พระราม 2 - ดาวคะนอง','condo',NULL,NULL,NULL,NULL,0,'2026-03-19 04:33:11','2026-03-24 03:33:04','admin1',2),(4,'PROJ004','นิช ไอดี เสรีไทย - วงแหวน','condo',NULL,NULL,NULL,NULL,0,'2026-03-19 04:33:11','2026-03-24 03:33:04','admin1',2),(5,'PROJ005','นิช ไพรด์ เตาปูน - อินเตอร์เชนจ์','condo',NULL,NULL,NULL,NULL,1,'2026-03-19 04:33:11','2026-03-24 03:33:04','admin2',1),(6,'PROJ006','พัทยา คันทรี คลับ โฮม แอนด์ เรสซิเดนซ์','house',NULL,NULL,NULL,NULL,0,'2026-03-19 04:33:11','2026-03-24 03:33:04','admin3',3),(7,'PROJ007','เสนาพาร์ค แกรนด์ รามอินทรา - วงแหวน','house',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:04','2026-03-24 03:33:04','admin3',3),(8,'PROJ008','เสนา แกรนด์โฮม รามอินทรา กม.8','house',NULL,NULL,NULL,NULL,0,'2026-03-24 03:33:04','2026-03-24 03:33:04','admin3',3),(9,'PROJ009','นิช โมโน รัชวิภา','condo',NULL,NULL,NULL,NULL,0,'2026-03-24 03:33:04','2026-03-24 03:33:04','admin1',2),(10,'PROJ010','นิช โมโน สุขุมวิท - แบริ่ง','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:04','2026-03-24 03:33:04','admin1',2),(11,'PROJ011','นิช โมโน สุขุมวิท - ปู่เจ้า','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:04','2026-03-24 03:33:04','admin1',2),(12,'PROJ012','นิช ไพรด์ ทองหล่อ-เพชรบุรี','condo',NULL,NULL,NULL,NULL,0,'2026-03-24 03:33:04','2026-03-24 03:33:04','admin1',2),(13,'PROJ013','เดอะคิทท์ พลัส พหลโยธิน-คูคต','condo',NULL,NULL,NULL,NULL,0,'2026-03-24 03:33:04','2026-03-24 03:33:04','admin1',2),(15,'PROJ015','เสนา แกรนด์โฮม รังสิต-ติวานนท์','house',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:04','2026-03-24 03:33:04','admin3',3),(16,'PROJ016','เสนาทาวน์ รามอินทรา','townhome',NULL,NULL,NULL,NULL,0,'2026-03-24 03:33:04','2026-03-24 03:33:04','admin3',3),(17,'PROJ017','เสนาทาวน์ นวมินทร์','townhome',NULL,NULL,NULL,NULL,0,'2026-03-24 03:33:04','2026-03-24 03:33:04','admin3',3),(18,'PROJ018','เสนา วีว่า เพชรเกษม - พุทธมณฑล สาย 7','townhome',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:04','2026-03-24 03:33:04','admin3',3),(19,'PROJ019','นิช โมโน เจริญนคร','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin2',22),(20,'PROJ020','นิช โมโน แจ้งวัฒนะ','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin2',22),(21,'PROJ021','นิช โมโน พระราม 9','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin4',4),(22,'PROJ022','นิช โมโน เมกะ สเปซ บางนา','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin2',21),(23,'PROJ023','นิช โมโน รามคำแหง','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin2',22),(24,'PROJ024','นิช โมโน อิสรภาพ','condo',NULL,NULL,NULL,NULL,0,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin2',21),(25,'PROJ025','นิช ไอดี พระราม 2','condo',NULL,NULL,NULL,NULL,0,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',22),(26,'PROJ026','เฟล็กซี่ รัตนาธิเบศร์','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin4',4),(27,'PROJ027','เฟล็กซี่ สาทร - เจริญนคร','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin4',4),(28,'PROJ028','เสนา อีโค ทาวน์ รังสิต สเตชั่น','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin3',3),(29,'PROJ029','เดอะคิทท์ พลัส พหลโยธิน คูคต เฟส 2','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(30,'PROJ030','เดอะคิทท์ รังสิต - ติวานนท์ เฟส 3','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(31,'PROJ031','เจ คอนโด สาทร - กัลปพฤกษ์','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin5',5),(32,'PROJ032','เสนา พาร์ค วิลล์ รามอินทรา - วงแหวน','house',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin3',3),(33,'PROJ033','เสนา วิลล์ บรมราชชนนี - สาย 5','house',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin3',3),(34,'PROJ034','เสนา วิลล์ ลำลูกกา - คลอง 6','house',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin3',3),(36,'PROJ036','เสนา อเวนิว รัตนาธิเบศร์ - บางบัวทอง','townhome',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin5',5),(37,'PROJ037','เสนา อเวนิว บางปะกง - บ้านโพธิ์','commercial',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin5',5),(38,'PROJ038','เสนา วิลเลจ รังสิต - ติวานนท์','house',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin3',3),(39,'PROJ039','เฟล็กซี่ เตาปูน - อินเตอร์เชนจ์','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin4',4),(40,'PROJ040','เฟล็กซี่ สุขสวัสดิ์','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin4',4),(41,'PROJ041','เสนา วีว่า ศรีราชา - อัสสัมชัญ','townhome',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin5',5),(42,'PROJ042','เสนาคิทท์ รัตนาธิเบศร์-บางบัวทอง','condo',NULL,NULL,NULL,NULL,0,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',2),(43,'PROJ043','เสนาคิทท์ ฉลองกรุง - ลาดกระบัง','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(44,'PROJ044','เสนาคิทท์ รัตนาธิเบศร์-บางบัวทอง','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(45,'PROJ045','เสนาคิทท์ ศรีนครินทร์-ศรีด่าน','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(46,'PROJ046','เสนาคิทท์ สำโรง อินเตอร์เชนจ์','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(47,'PROJ047','เสนาคิทท์ รังสิต - ติวานนท์','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(48,'PROJ048','เสนาคิทท์ สุขุมวิท - บางปู','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(49,'PROJ049','เสนาคิทท์ เพชรเกษม 120','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(50,'PROJ050','เสนาคิทท์ สาทร - กัลปพฤกษ์','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(51,'PROJ051','ปีติ สุขุมวิท 101','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin2',1),(52,'PROJ052','เสนาคิทท์ พหลโยธิน - นวนคร','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(53,'PROJ053','เสนาคิทท์ บีช ฟรอนท์','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(54,'PROJ054','เสนาคิทท์ บางนา กม.29 เฟส 2','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin',1),(55,'PROJ055','เสนา วีว่า ฉลองกรุง - ลาดกระบัง','townhome',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(56,'PROJ056','นิช ไพรด์ เอกมัย','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin2',2),(57,'PROJ057','เฟล็กซี่ เมกะ สเปซ บางนา','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin2',2),(58,'PROJ058','เฟล็กซี่ ริเวอร์วิว - เจริญนคร','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin2',2),(59,'PROJ059','นิช โมโน บางโพ','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin3',3),(60,'PROJ060','โคซี่ บีทีเอส สะพานใหม่','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin3',3),(61,'PROJ061','โคซี่ เอ็มอาร์ที เพชรเกษม 48','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin3',3),(62,'PROJ062','โคซี่ รามฯ 189 สเตชั่น','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin3',3),(63,'PROJ063','เสนา ช็อปเฮ้าส์ สุขุมวิท -แพรกษา','commercial',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin5',5),(64,'PROJ064','เสนา อเวนิว บางกะดี - ติวานนท์','commercial',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin5',1),(65,'PROJ065','เสนา อเวนิว บางปะกง - บ้านโพธิ์','commercial',NULL,NULL,NULL,NULL,0,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin5',5),(66,'PROJ066','เสนา อเวนิว 1 รังสิต - คลอง 1','commercial',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin5',5),(67,'PROJ067','เสนา วิลเลจ บางนา - กม.29','house',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin3',3),(68,'PROJ068','เสนา วิลเลจ รามอินทรา กม.9','house',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin5',5),(69,'PROJ069','เสนา วิลเลจ สุขุมวิท - แพรกษา','house',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin5',5),(70,'PROJ070','เสนาคิทท์ เอ็มอาร์ที บางแค เฟส2','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(71,'PROJ071','เสนา วิลเลจ บางปะกง - บ้านโพธิ์','house',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin2',2),(72,'PROJ072','เสนา เวล่า เทพารักษ์ - บางบ่อ','townhome',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin2',2),(73,'PROJ073','เสนา วีว่า เทพารักษ์ - บางบ่อ','townhome',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin2',2),(74,'PROJ074','เสนา เวล่า สุขุมวิท - บางปู','townhome',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin2',2),(75,'PROJ075','เสนา เวล่า สิริโสธร','townhome',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin2',2),(76,'PROJ076','เจ ทาวน์ เอ็กคลูซีพ บางปะกง - บ้านโพธิ์','townhome',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin2',2),(77,'PROJ077','เสนา ช็อปเฮ้าส์ ลำลูกกา - คลอง 6','commercial',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin3',3),(78,'PROJ078','เสนา เวล่า วงแหวน - บางบัวทอง','townhome',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin3',3),(79,'PROJ079','เสนา เวล่า รัตนาธิเบศร์ - บางบัวทอง','townhome',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin3',3),(80,'PROJ080','เสนาคิทท์ เทพารักษ์ - บางบ่อ 2','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(81,'PROJ081','เสนา เวล่า รังสิต - คลอง 1','townhome',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin5',4),(82,'PROJ082','เสนาคิทท์ รังสิต - คลอง 4','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(83,'PROJ083','โคซี่ รามอินทรา - คู้บอน','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(84,'PROJ084','เสนาคิทท์ เวสต์เกต-บางบัวทอง','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1),(85,'PROJ085','โคซี่ ตากสิน - จอมทอง','condo',NULL,NULL,NULL,NULL,1,'2026-03-24 03:33:05','2026-03-24 03:33:05','admin1',1);
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `requests`
--

DROP TABLE IF EXISTS `requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `request_type` enum('commission','transfer','cancellation','other') NOT NULL,
  `subject` varchar(255) NOT NULL,
  `description` text,
  `status` enum('pending','in_review','approved','rejected') DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `approved_by` (`approved_by`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_requests_customer_id` (`customer_id`),
  KEY `idx_requests_status` (`status`),
  CONSTRAINT `requests_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `requests_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `requests_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `requests_ibfk_4` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requests`
--

LOCK TABLES `requests` WRITE;
/*!40000 ALTER TABLE `requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `unit_number` varchar(20) DEFAULT NULL,
  `sale_price` decimal(15,2) NOT NULL,
  `commission_rate` decimal(5,2) DEFAULT '3.00',
  `commission_amount` decimal(15,2) DEFAULT NULL,
  `contract_date` date DEFAULT NULL,
  `transfer_date` date DEFAULT NULL,
  `status` enum('reserved','contracted','transferred','cancelled') DEFAULT 'reserved',
  `notes` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_sales_customer_id` (`customer_id`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `sales_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','agent','manager') DEFAULT 'agent',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bud` varchar(10) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@sena.co.th','$2b$10$hashedpassword','admin',1,'2026-03-19 04:33:11','2026-03-19 04:33:11',NULL,NULL),(2,'agent001@sena.co.th','$2b$10$hashedpassword','agent',1,'2026-03-19 04:33:11','2026-03-19 04:33:11',NULL,NULL),(3,'manager@sena.co.th','$2b$10$hashedpassword','manager',1,'2026-03-19 04:33:11','2026-03-19 04:33:11',NULL,NULL),(4,'admin@test.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin',1,'2026-03-19 04:33:11','2026-03-19 04:33:11',NULL,NULL),(5,'agent1@test.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','agent',1,'2026-03-19 04:33:11','2026-03-19 04:33:11',NULL,NULL),(6,'agent2@test.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','agent',1,'2026-03-19 04:33:11','2026-03-19 04:33:11',NULL,NULL),(7,'manager@test.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','manager',1,'2026-03-19 04:33:11','2026-03-19 04:33:11',NULL,NULL),(8,'activate.1773903672@test.com','$2a$10$Lv1WFAIIzjZd6l32SmUo1e1/vbcKmz3VwboEjBbP5gKV9tmg25KMm','agent',1,'2026-03-19 07:01:12','2026-03-19 07:01:12',NULL,NULL),(9,'activate.1773903701@test.com','$2a$10$8A/GfQTostr/pxp8KNG.YefOt4CHqXCybDgrtt5CfLdO0Wdx3QA5W','agent',1,'2026-03-19 07:01:41','2026-03-19 07:01:41',NULL,NULL),(10,'agenttype.1773904745@test.com','$2a$10$TMEGbSSuYXKArHW3x.45GuYdv9PAD/lAyhCSiuA9Ud9FAIO29CwtC','agent',1,'2026-03-19 07:19:06','2026-03-19 07:19:06',NULL,NULL),(11,'agent_auto_1773997453@test.com','$2a$10$M8vPqNKr5HoTyeZUtDJMleRqxAsc7dwCZk2FZWKIS8BkyKJLpZmDC','agent',1,'2026-03-20 09:04:14','2026-03-20 09:04:14',NULL,NULL),(12,'agent_dup_1773997453@test.com','$2a$10$1txdKSxr01fQJ8AqdZzlquuvGOoqf4cdwxmFmCaj27xL4jWzhUafW','agent',1,'2026-03-20 09:04:14','2026-03-20 09:04:14',NULL,NULL),(13,'agent_dup_1773997464@test.com','$2a$10$9yQ41YViJOYcKhgwNyu5IOpmlgbYvHgX2hVG3/rb64kLYUUc.C1a2','agent',1,'2026-03-20 09:04:24','2026-03-20 09:04:24',NULL,NULL),(14,'agent_auto_1773997464@test.com','$2a$10$h2rFP2qE0Mo46YoOCgTQPOLMQv3N3.hpbl9PMzcNI.v4jzGk0R06a','agent',1,'2026-03-20 09:04:24','2026-03-20 09:04:24',NULL,NULL),(15,'agent_auto_1773997470_x@test.com','$2a$10$LmwdkdECTJueN8eMBJEf9uLSi35no7QKPi/LnQxG7Wks.6iI87vqS','agent',1,'2026-03-20 09:04:30','2026-03-20 09:04:30',NULL,NULL),(16,'test.register1774251582837@example.com','$2a$10$Fs.sOOLd/mvA.FXo4eQ/x.vFddNpcp5ZTqXX82qwWA.760eZiwr7y','agent',1,'2026-03-23 07:39:42','2026-03-23 07:39:42',NULL,NULL),(17,'test1774251920612@example.com','$2a$10$9qJiP7GFzAKr.sRNhL1PGePkp5Biv.8kMa/Pp4cKyRpA03rKydwCy','agent',1,'2026-03-23 07:45:20','2026-03-23 07:45:20',NULL,NULL),(18,'agent-notify-1774321703398@example.com','$2a$10$3CKACTohRXr48HYxgwi8n.ym.QlnLO45QAAJ2ATG1Fx4ftGEkn6Q6','agent',1,'2026-03-24 03:08:23','2026-03-24 03:08:23',NULL,NULL),(19,'agent-notify-1774321714389@example.com','$2a$10$YjMTnNAtzHycrNRcpwTHZOoKy3JsBXixPtjN6XpyKCsODj2ugWbNC','agent',1,'2026-03-24 03:08:34','2026-03-24 03:08:34',NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visits`
--

DROP TABLE IF EXISTS `visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `visit_date` date NOT NULL,
  `visit_time` time DEFAULT NULL,
  `status` enum('scheduled','completed','cancelled','no_show') DEFAULT 'scheduled',
  `notes` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_visits_customer_id` (`customer_id`),
  KEY `idx_visits_visit_date` (`visit_date`),
  CONSTRAINT `visits_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visits_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `visits_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visits`
--

LOCK TABLES `visits` WRITE;
/*!40000 ALTER TABLE `visits` DISABLE KEYS */;
INSERT INTO `visits` VALUES (1,4,'2024-09-21','14:00:00','scheduled','à¸™à¸±à¸”à¸Šà¸¡à¸«à¹‰à¸­à¸‡à¸•à¸±à¸§à¸­à¸¢à¹ˆà¸²à¸‡ à¸§à¸±à¸™à¹€à¸ªà¸²à¸£à¹Œ',3,'2026-03-19 04:33:11',NULL,'2026-03-19 04:33:11'),(2,5,'2024-09-18','10:30:00','completed','à¸Šà¸¡à¸«à¹‰à¸­à¸‡à¸•à¸±à¸§à¸­à¸¢à¹ˆà¸²à¸‡à¹€à¸£à¸µà¸¢à¸šà¸£à¹‰à¸­à¸¢ à¸¥à¸¹à¸à¸„à¹‰à¸²à¸›à¸£à¸°à¸—à¸±à¸šà¹ƒà¸ˆ',2,'2026-03-19 04:33:11',NULL,'2026-03-19 04:33:11');
/*!40000 ALTER TABLE `visits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `customer_history`
--

/*!50001 DROP VIEW IF EXISTS `customer_history`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `customer_history` AS select `al`.`id` AS `id`,`al`.`action` AS `action`,`al`.`record_id` AS `customer_id`,concat(`c`.`first_name`,' ',`c`.`last_name`) AS `customer_name`,`u`.`email` AS `changed_by`,`al`.`old_values` AS `old_values`,`al`.`new_values` AS `new_values`,`al`.`created_at` AS `created_at` from ((`activity_logs` `al` left join `customers` `c` on((`al`.`record_id` = `c`.`id`))) left join `users` `u` on((`al`.`user_id` = `u`.`id`))) where (`al`.`table_name` = 'customers') order by `al`.`created_at` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `daily_customer_changes`
--

/*!50001 DROP VIEW IF EXISTS `daily_customer_changes`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `daily_customer_changes` AS select cast(`al`.`created_at` as date) AS `change_date`,`al`.`action` AS `action`,count(0) AS `count`,group_concat(distinct `u`.`email` separator ',') AS `changed_by_users` from (`activity_logs` `al` left join `users` `u` on((`al`.`user_id` = `u`.`id`))) where (`al`.`table_name` = 'customers') group by cast(`al`.`created_at` as date),`al`.`action` order by `change_date` desc,`al`.`action` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-24  6:55:32

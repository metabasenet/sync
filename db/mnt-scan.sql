CREATE DATABASE  IF NOT EXISTS `mnt-scan` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `mnt-scan`;
-- MySQL dump 10.13  Distrib 8.0.33, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: mnt-scan
-- ------------------------------------------------------
-- Server version	8.0.33

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `balance`
--

DROP TABLE IF EXISTS `balance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `balance` (
  `addr` varchar(42) NOT NULL,
  `value` decimal(40,18) DEFAULT NULL,
  PRIMARY KEY (`addr`),
  KEY `val` (`value` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `balance`
--

LOCK TABLES `balance` WRITE;
/*!40000 ALTER TABLE `balance` DISABLE KEYS */;
/*!40000 ALTER TABLE `balance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `block`
--

DROP TABLE IF EXISTS `block`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `block` (
  `number` int NOT NULL,
  `hash` varchar(66) DEFAULT NULL,
  `timestamp` int DEFAULT NULL,
  `txns` int DEFAULT NULL,
  `reward` decimal(40,18) DEFAULT NULL,
  PRIMARY KEY (`number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `block`
--

LOCK TABLES `block` WRITE;
/*!40000 ALTER TABLE `block` DISABLE KEYS */;
/*!40000 ALTER TABLE `block` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `erc20`
--

DROP TABLE IF EXISTS `erc20`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `erc20` (
  `addr` varchar(42) NOT NULL,
  `name` varchar(32) DEFAULT NULL,
  `symbol` varchar(16) DEFAULT NULL,
  `decimals` int DEFAULT NULL,
  `totalSupply` decimal(40,18) DEFAULT NULL,
  `hash` varchar(64) DEFAULT NULL,
  `creator` varchar(42) DEFAULT NULL,
  PRIMARY KEY (`addr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `erc20`
--

LOCK TABLES `erc20` WRITE;
/*!40000 ALTER TABLE `erc20` DISABLE KEYS */;
/*!40000 ALTER TABLE `erc20` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `erc20balance`
--

DROP TABLE IF EXISTS `erc20balance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `erc20balance` (
  `addr` varchar(42) NOT NULL,
  `erc20addr` varchar(42) NOT NULL,
  `value` decimal(40,18) DEFAULT NULL,
  PRIMARY KEY (`addr`,`erc20addr`),
  KEY `val` (`value` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `erc20balance`
--

LOCK TABLES `erc20balance` WRITE;
/*!40000 ALTER TABLE `erc20balance` DISABLE KEYS */;
/*!40000 ALTER TABLE `erc20balance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `erc20transfe`
--

DROP TABLE IF EXISTS `erc20transfe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `erc20transfe` (
  `hash` varchar(66) NOT NULL,
  `addr` varchar(42) DEFAULT NULL,
  `from` varchar(42) DEFAULT NULL,
  `to` varchar(42) DEFAULT NULL,
  `value` decimal(40,18) DEFAULT NULL,
  `method` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`hash`),
  KEY `addr` (`addr`),
  KEY `from` (`from`),
  KEY `to` (`to`),
  CONSTRAINT `fk_erc20transfe_1` FOREIGN KEY (`hash`) REFERENCES `tx` (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `erc20transfe`
--

LOCK TABLES `erc20transfe` WRITE;
/*!40000 ALTER TABLE `erc20transfe` DISABLE KEYS */;
/*!40000 ALTER TABLE `erc20transfe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tx`
--

DROP TABLE IF EXISTS `tx`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tx` (
  `hash` varchar(66) NOT NULL,
  `number` int DEFAULT NULL,
  `from` varchar(42) DEFAULT NULL,
  `to` varchar(42) DEFAULT NULL,
  `value` decimal(40,18) DEFAULT NULL,
  `method` varchar(64) DEFAULT NULL,
  `fee` decimal(40,18) DEFAULT NULL,
  PRIMARY KEY (`hash`),
  KEY `fk_tx_1_idx` (`number`),
  CONSTRAINT `fk_tx_1` FOREIGN KEY (`number`) REFERENCES `block` (`number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tx`
--

LOCK TABLES `tx` WRITE;
/*!40000 ALTER TABLE `tx` DISABLE KEYS */;
/*!40000 ALTER TABLE `tx` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'mnt-scan'
--

--
-- Dumping routines for database 'mnt-scan'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-08-28 16:45:21

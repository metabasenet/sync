-- MySQL dump 10.13  Distrib 5.7.34, for Linux (x86_64)
--
-- Host: localhost    Database: mnt
-- ------------------------------------------------------
-- Server version	5.7.34-0ubuntu0.18.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `tx`
--

DROP TABLE IF EXISTS `tx`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tx` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `block_hash` varchar(64) DEFAULT NULL,
  `txid` varchar(64) DEFAULT NULL,
  `from` varchar(64) DEFAULT NULL,
  `to` varchar(64) DEFAULT NULL,
  `amount` decimal(20,8) DEFAULT NULL,
  `fee` decimal(20,8) DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `n` tinyint(2) DEFAULT NULL COMMENT '是否找零(1表示找零,0表示常规交易)',
  `spend_txid` varchar(64) DEFAULT NULL,
  `dpos_in` varchar(64) DEFAULT NULL COMMENT '挖矿的模板地址',
  `client_in` varchar(64) DEFAULT NULL COMMENT '挖矿的模板地址对应的钱包地址',
  `dpos_out` varchar(64) DEFAULT NULL COMMENT '抵押转出的挖矿地址',
  `client_out` varchar(64) DEFAULT NULL COMMENT '抵押转出的挖矿地址对应的普通地址',
  `transtime` bigint(20) DEFAULT NULL COMMENT '交易时间',
  `data` varchar(4096) DEFAULT NULL COMMENT '交易备注',
  `height` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `block_hash` (`block_hash`) USING BTREE,
  KEY `txid` (`txid`) USING BTREE,
  KEY `from` (`from`) USING BTREE,
  KEY `to` (`to`) USING BTREE,
  KEY `type` (`type`) USING BTREE,
  KEY `n` (`n`) USING BTREE,
  KEY `spend_txid` (`spend_txid`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=25177 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-07-21 12:03:04

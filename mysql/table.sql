-- MySQL dump 10.13  Distrib 5.7.38, for Linux (x86_64)
--
-- Host: 119.8.55.78    Database: mnt
-- ------------------------------------------------------
-- Server version	5.7.37-0ubuntu0.18.04.1

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
-- Table structure for table `addr`
--

DROP TABLE IF EXISTS `addr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `addr` (
  `walletId` varchar(64) NOT NULL,
  `mnt_addr` varchar(64) DEFAULT NULL,
  `eth_addr` varchar(64) DEFAULT NULL,
  `btc_addr` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`walletId`),
  UNIQUE KEY `mnt_addr_UNIQUE` (`mnt_addr`),
  UNIQUE KEY `eth_addr_UNIQUE` (`eth_addr`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;


-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `banners` (
  `id` int(10) NOT NULL,
  `type` varchar(45) DEFAULT NULL,
  `title` varchar(45) DEFAULT NULL,
  `content` varchar(45) DEFAULT NULL,
  `img` varchar(64) DEFAULT NULL,
  `bgImg` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `block`
--

DROP TABLE IF EXISTS `block`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `block` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hash` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  `prev_hash` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  `time` bigint(20) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `reward_address` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  `reward_money` decimal(40,18) DEFAULT NULL,
  `bits` decimal(30,2) DEFAULT NULL,
  `is_useful` bit(1) DEFAULT b'1',
  `type` varchar(64) DEFAULT NULL COMMENT '',
  `txs` bigint(20) DEFAULT NULL COMMENT '',
  PRIMARY KEY (`id`),
  KEY `hash` (`hash`) USING BTREE,
  KEY `time` (`time`) USING BTREE,
  KEY `height` (`height`) USING BTREE,
  KEY `reward_address` (`reward_address`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `blockstatistics`
--

DROP TABLE IF EXISTS `blockstatistics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blockstatistics` (
  `reward_address` varchar(255) NOT NULL,
  `reward_date` varchar(255) NOT NULL,
  `amount` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pool`
--

DROP TABLE IF EXISTS `pool`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pool` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `address` varchar(64) DEFAULT NULL,
  `name` varchar(64) DEFAULT NULL,
  `fee` decimal(10,2) DEFAULT NULL,
  `votes` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `address` (`address`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quotations`
--

DROP TABLE IF EXISTS `quotations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quotations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tradePairId` varchar(45) DEFAULT NULL,
  `price` decimal(20,8) DEFAULT NULL,
  `precision` int(11) DEFAULT NULL,
  `price24h` decimal(20,8) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rank`
--

DROP TABLE IF EXISTS `rank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rank` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `address` varchar(65) DEFAULT NULL COMMENT '',
  `ranking` int(11) DEFAULT NULL COMMENT '',
  `yield` decimal(20,6) DEFAULT NULL COMMENT '',
  `balance` decimal(20,6) DEFAULT NULL COMMENT '',
  PRIMARY KEY (`id`),
  KEY `address` (`address`),
  KEY `ranking` (`ranking`)
) ENGINE=MEMORY AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

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
  `amount` decimal(40,18) DEFAULT NULL,
  `fee` decimal(40,18) DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `dpos_in` varchar(64) DEFAULT NULL COMMENT '',
  `client_in` varchar(64) DEFAULT NULL COMMENT '',
  `dpos_out` varchar(64) DEFAULT NULL COMMENT '',
  `client_out` varchar(64) DEFAULT NULL COMMENT '',
  `transtime` bigint(20) DEFAULT NULL COMMENT '',
  `data` varchar(4096) DEFAULT NULL COMMENT '',
  `height` int(11) DEFAULT NULL,
  `nonce` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `block_hash` (`block_hash`) USING BTREE,
  KEY `txid` (`txid`) USING BTREE,
  KEY `from` (`from`) USING BTREE,
  KEY `to` (`to`) USING BTREE,
  KEY `type` (`type`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `uniswap`
--

DROP TABLE IF EXISTS `uniswap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `uniswap` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `height` int(11) DEFAULT NULL,
  `reserve0` varchar(100) DEFAULT NULL,
  `reserve1` varchar(100) DEFAULT NULL,
  `price` decimal(50,10) DEFAULT NULL,
  `txid` varchar(66) DEFAULT NULL,
  `timestamp` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `txid` (`txid`),
  KEY `height` (`height`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `relation`
--
DROP TABLE IF EXISTS `relation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `relation` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'dataID',
  `upper` varchar(64) DEFAULT NULL COMMENT 'upper',
  `lower` varchar(64) DEFAULT NULL COMMENT 'lower',
  `txid` varchar(64) DEFAULT NULL COMMENT 'txid',
  `created_at` int(11) DEFAULT NULL COMMENT 'utc time',
  `achievement` bigint(20) DEFAULT '0' COMMENT '',
  PRIMARY KEY (`id`),
  KEY `index2` (`lower`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;


--
-- Table structure for table `mnt_bsc`
--

DROP TABLE IF EXISTS `mnt_bsc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mnt_bsc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mnt_txid` varchar(128) DEFAULT NULL,
  `bsc_txid` varchar(70) DEFAULT NULL,
  `from` varchar(70) DEFAULT NULL,
  `value` decimal(50,20) DEFAULT NULL,
  `to` varchar(70) DEFAULT NULL,
  `type` int(11) DEFAULT NULL COMMENT '1 : bsc -> mnt;  2 : mnt -> bsc.',
  `state` int(11) DEFAULT NULL COMMENT 'null is Not processed;1 is Processing complete;2 is Back off.\n\n',
  `mnt_time` int(11) DEFAULT NULL,
  `bsc_time` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index2` (`mnt_txid`),
  KEY `index3` (`bsc_txid`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

DROP TABLE IF EXISTS `reward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reward` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vote` decimal(40,18) DEFAULT NULL,
  `extend` decimal(40,18) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `time` int(11) DEFAULT NULL,
  `txid` varchar(70) DEFAULT NULL,
  `addr` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mnt_bsc`
--


/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-05-04  8:56:11



DROP TABLE IF EXISTS `rewarddetail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rewarddetail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profit` decimal(40,18) DEFAULT NULL, 
  `height` int(11) DEFAULT NULL,
  `time` int(11) DEFAULT NULL, 
  `addr` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

alter table `pool` add column vote_count int;
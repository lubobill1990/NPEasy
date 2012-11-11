# ************************************************************
# Sequel Pro SQL dump
# Version 3408
#
# http://www.sequelpro.com/
# http://code.google.com/p/sequel-pro/
#
# Host: npeasy.com (MySQL 5.5.22-0ubuntu1-log)
# Database: npeasy_aux
# Generation Time: 2012-11-11 04:10:45 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table npeasy_access_token
# ------------------------------------------------------------

DROP TABLE IF EXISTS `npeasy_access_token`;

CREATE TABLE `npeasy_access_token` (
  `access_token` varchar(50) NOT NULL DEFAULT '',
  `app_key` varchar(50) NOT NULL DEFAULT '',
  `user_id` int(11) NOT NULL,
  `expire_till` int(11) NOT NULL,
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`access_token`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table npeasy_app
# ------------------------------------------------------------

DROP TABLE IF EXISTS `npeasy_app`;

CREATE TABLE `npeasy_app` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `app_key` varchar(50) NOT NULL DEFAULT '',
  `app_secret` varchar(50) NOT NULL DEFAULT '',
  `redirect_uri` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `npeasy_app` WRITE;
/*!40000 ALTER TABLE `npeasy_app` DISABLE KEYS */;

INSERT INTO `npeasy_app` (`id`, `app_key`, `app_secret`, `redirect_uri`)
VALUES
	(1,'1111','1111','http://npeasy.com:3000/callback');

/*!40000 ALTER TABLE `npeasy_app` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table npeasy_auth_code
# ------------------------------------------------------------

DROP TABLE IF EXISTS `npeasy_auth_code`;

CREATE TABLE `npeasy_auth_code` (
  `auth_code` varchar(50) NOT NULL DEFAULT '',
  `app_key` varchar(50) NOT NULL DEFAULT '',
  `user_id` int(11) NOT NULL,
  `expire_till` int(11) NOT NULL,
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `session_id` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`auth_code`),
  KEY `session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table user
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL DEFAULT '',
  `password` varchar(40) NOT NULL DEFAULT '',
  `salt` varchar(40) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user.email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;

INSERT INTO `user` (`id`, `email`, `password`, `salt`)
VALUES
	(1,'lubobill1990@163.com','7ba1eff16b66a3a98460bac1cdd316eb','b545adc348e1e63af85227feea0b2aaeef34a6e3');

/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

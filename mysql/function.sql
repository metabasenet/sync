DROP FUNCTION IF EXISTS queryChildrenAddressInfo;
DELIMITER ;;
CREATE FUNCTION queryChildrenAddressInfo(supperAddress varchar(64))
RETURNS VARCHAR(4000)
BEGIN
DECLARE sTemp longtext;
DECLARE sTempChd VARCHAR(4000);
SET sTemp='$';
SET sTempChd = supperAddress;
WHILE sTempChd IS NOT NULL DO
SET sTemp= CONCAT(sTemp,',',sTempChd);
SELECT GROUP_CONCAT(lower) INTO sTempChd FROM relation WHERE FIND_IN_SET(upper,sTempChd)>0;
END WHILE;
RETURN sTemp;
END
;;
DELIMITER ;
-- select queryChildrenAddressInfo('1xpvhpxvjqrweng0re3ptcr1ezjf6dkst705w3b8wts5wtkrs2ygzk84b');
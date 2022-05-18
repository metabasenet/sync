CREATE DEFINER=`mnt`@`%` PROCEDURE `blockstatisticsproc`()
label:BEGIN
DECLARE done INT DEFAULT 0; 
declare startState int default 10;
declare i int;
declare blockCount int;
declare reward_address1 varchar(255);
declare reward_date1 varchar(255);
declare amount1 int ;
declare addressCount int;
declare cur CURSOR for select reward_address,reward_date ,count(id) as amount   from(select * from  (
select id , reward_address , FROM_UNIXTIME(time,'%Y-%m-%d') as reward_date  from block where type = 'primary-dpos') a where  datediff(now(), reward_date ) < 2)b
group by   reward_address, reward_date order by reward_date ,reward_address;
DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done = 1; 
set blockCount = 1;
 select count(reward_address) into addressCount from block where `type`='primary-dpos' and datediff(now(),  FROM_UNIXTIME(time,'%Y-%m-%d')) < 2;
 if 0= addressCount then 
 leave label;
 end if; 
 OPEN cur;   
 REPEAT 
FETCH  cur INTO reward_address1, reward_date1, amount1; 
select reward_address1,reward_date1,amount1;
   if exists ( select *  from blockstatistics where reward_address=reward_address1 and reward_date=reward_date1) then 
	 update blockstatistics set amount=amount1 where reward_address=reward_address1 and reward_date=reward_date1;
   else
	insert into blockstatistics( reward_address, reward_date,amount) values( reward_address1,reward_date1,amount1);    
   end if;  
UNTIL done END REPEAT; 
CLOSE cur; 
END


CREATE DEFINER=`mnt`@`%` PROCEDURE `blockstatisticsproc31`()
BEGIN
delete from blockstatistics where datediff(now(), str_to_date(reward_date,'%Y-%m-%d')) < 31;
  insert into blockstatistics(reward_address,reward_date,amount) select reward_address,reward_date ,count(id) as amount 
 from(select * from(select id , reward_address , FROM_UNIXTIME(time,'%Y-%m-%d') as reward_date  from block where type = 'primary-dpos') a 
 where  datediff(now(), reward_date ) < 31)b group by   reward_address, reward_date order by reward_date ,reward_address;
END


CREATE DEFINER=`mnt`@`%` PROCEDURE `mint`(addr varchar(64))
BEGIN
    declare block_hash_ VARCHAR(64);
    declare general_reward decimal(20,10);
    declare exp_reward decimal(20,10);
    declare max_reward decimal(20,10);
    declare min_reward decimal(20,10);
    
    select max(block_hash) into block_hash_ from Tx 
    where `type` = 'vote-reward' order by id desc;
    
    select max(amount),min(amount) into max_reward, min_reward from tx 
    where block_hash = block_hash_ and  `type` = 'vote-reward';
    
	select ifnull(sum(amount),0) into exp_reward from tx 
    where block_hash = block_hash_ and `type` = 'vote-reward' and client_in = addr;
    
	select ifnull(sum(amount),0) into general_reward from tx 
    where block_hash =  block_hash_ and `type` = 'vote-reward' and `to` = addr;
    
    select general_reward,exp_reward,max_reward,min_reward;
END
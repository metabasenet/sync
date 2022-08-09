select   b.`name`,  b.vote as '计算次数',  a.count as '实际次数', b.percent as '计算比例',round(a.count * 100/2880,2) as '实际比例' from (
select count(reward_address) as count , reward_address  from `block` where height >43200 and height <=46080 group by reward_address
) a inner join (select *, convert(2880 * (votes / 998610.695300430) , signed) as vote ,round(votes * 100 / 998610.695300430,2) as percent from `pool`) b 
on a.reward_address =b.address
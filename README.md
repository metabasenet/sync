## setup db
```bash
sudo apt install nginx
sudo apt install mysql-server
sudo mysql -u root
mysql> use mysql;
mysql> CREATE USER 'mnt'@'localhost' IDENTIFIED BY '1234qwer';
mysql> GRANT ALL ON *.* TO 'mnt'@'localhost';
mysql> ALTER USER 'mnt'@'localhost' IDENTIFIED WITH mysql_native_password BY '1234qwer';
mysql> FLUSH PRIVILEGES;
mysql> select User,plugin,host from user;
+------------------+-----------------------+-----------+
| User             | plugin                | host      |
+------------------+-----------------------+-----------+
| root             | auth_socket           | localhost |
| mysql.session    | mysql_native_password | localhost |
| mysql.sys        | mysql_native_password | localhost |
| debian-sys-maint | mysql_native_password | localhost |
| mnt              | mysql_native_password | localhost |
+------------------+-----------------------+-----------+
5 rows in set (0.00 sec)
sudo apt install mysql-workbench
```

## sync 
```bash
pip install web3
vim config.py
./run.sh
```
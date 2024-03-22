import mysql from "mysql"
import { config } from './config.js';


export const sqlHelper = {
    conn: null,
    isConnect: false,

    init: function init() {
        this.conn = mysql.createConnection({ host: config.host, user: config.username, password: config.password, database: config.database });
        this.isConnect = false;
        return this;
    },


    open: function open() {
        this.conn.connect((err) => {
            if (err) throw err;
            this.isConnect = true;
            console.log('connect success');
        })
    },


    close: function close() {
        this.conn.end((err) => {
            if (err) throw err;
            this.isConnect = false;
            console.log("clsoe success");
        })
    },

    readDatabase: function execute(sql, params, callback) {
        if (!this.isConnect) {
            this.open();
        }
        this.conn.query(sql, params, callback);
    },

    writeDatabase: function execute(sql, params) {
        if (!this.isConnect) {
            this.open();
        }
        this.conn.query(sql, params, (err, result) => {
            if (err) {
                console.log(err.message);
            } else {
                console.log(result)
            }
        })
    }
}

// exports.open = open;
// export.insert = insert;
// exports.close = close;
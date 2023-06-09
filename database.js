const { dbHost, dbUserName, dbPassword, dbName } = require('./config.json');
const mysql = require('mysql2');

module.exports = {
    connectToDatabase() {
        return con = mysql.createConnection({
            host: dbHost,
            user: dbUserName,
            password: dbPassword,
            database: dbName
        })
    }
}
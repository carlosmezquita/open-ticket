const Sequelize = require('sequelize');

/*
 * Make sure you are on at least version 5 of Sequelize! Version 4 as used in this guide will pose a security threat.
 * You can read more about this issue on the [Sequelize issue tracker](https://github.com/sequelize/sequelize/issues/7310).
 */

const sequelize = new Sequelize('spain_discord', process.env.DB_USERNAME, process.env.DB_PASSWORD, {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: './storage/database.sqlite',
});

const Users = require('./models/Users.js')(sequelize, Sequelize.DataTypes);

module.exports = { Users };
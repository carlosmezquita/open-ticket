const Sequelize = require('sequelize');

const sequelize = new Sequelize('spain_discord', process.env.DB_USERNAME, process.env.DB_PASSWORD, {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: './storage/database.sqlite',
});

const user = require('./models/Users.js')(sequelize, Sequelize.DataTypes);


const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	// const users = [
	// 	user.upsert({ user_id: '466877761483702282', balance: 99999, birth_date: null }),
	// ];

	// await Promise.all(users);
	console.log('Database synced');

	sequelize.close();
}).catch(console.error);
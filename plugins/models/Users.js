module.exports = (sequelize, DataTypes) => {
	return sequelize.define('user', {
		user_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		balance: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
    },
    birth_date: DataTypes.DATEONLY
	}, {
		timestamps: true,
	});
};
const {Collection, Events} = require('discord.js')
const { Users } = require('./dbObjects.js');
const api = require("../core/api/api.js");

const currency = new Collection();

const {client} = api;

module.exports = async () => {
  // const { client } = api
  
  const storedBalances = await Users.findAll();
  storedBalances.forEach(b => currency.set(b.user_id, b));

}

module.exports.transferBalance = async (senderId, receiverId, amount) => {
  const sender = currency.get(senderId);

  if (!sender || sender.balance < amount) {
    return 'not-enough-balance'
  }

  amount = parseFloat(amount.toFixed(2))
  const receiver = currency.get(receiverId);
  sender.balance -= Number(amount)

  if (receiver) {
    receiver.balance += Number(amount);
    receiver.save();
  } else {

    const newUser = await Users.create({ user_id: receiverId, balance: amount, birth_date: null});
    currency.set(receiverId, newUser);
  }
  
  return 'money-succesfully-transfered'
}

module.exports.addBalance = async function (id, amount) {
  const user = currency.get(id);
  
  amount = parseFloat(amount.toFixed(2))

	if (user) {
		user.balance += Number(amount);
		return user.save();
	}

	const newUser = await Users.create({ user_id: id, balance: amount });
	currency.set(id, newUser);

	return newUser;
}

module.exports.getBalance =  function (id) {
	const user = currency.get(id);
	return user ? user.balance : 0;
}

module.exports.getLeaderboard = function (entries) {
  return currency.sort((a, b) => b.balance - a.balance)
    .filter(user => client.users.cache.has(user.user_id))
    .first(entries)
}
const { EmbedBuilder } = require("discord.js")
const { dungeon } = require("../dungeon-config.json")
const { connectToDatabase } = require('../database')

module.exports = {
    async makeMove(channel, game, index) {
        await channel.send(`Calculating enemy ${game.turnOrder[index].name}'s turn...`)
    }
}
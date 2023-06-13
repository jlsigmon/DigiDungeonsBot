const { SlashCommandBuilder } = require("discord.js")
const { parties } = require("../parties.json")
const { enemies } = require("../dungeon-config.json")
const { connectToDatabase } = require('../database')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start-wave')
        .setDescription('Allows you to start the next wave of your dungeon!'),
    async execute(interaction) {
        await interaction.reply('Running command...')

        let con = connectToDatabase()

        con.connect(async err => {
            if (err) {
                console.log("ERROR - An error occured connecting to the database: " + err.message)
                await interaction.editReply('An error occured!');
                return
            }
        })

        let game = parties.find(party => party.players.includes(interaction.user.id))

        if(game == undefined) {
            await interaction.editReply('You are not currently in a game!');
            return
        }

        let leader = game.players[0];

        if(leader != interaction.user.id) {
            await interaction.editReply('You are not the party leader for this game!');
            return
        }

        let name = interaction.user.username

        if(!game.started){
            await interaction.editReply('You cannot end a game that has not started yet!');
            return
        }

        if(interaction.channel.name != name + "'s Dungeon"){
            await interaction.editReply('You must use this command in the dungeon thread!');
            return
        }

        let digimon = [];

        for(let i = 0; i < game.players.length; i++){
            con.query(`SELECT * FROM digimon WHERE userID = '${game.players[i]}'`, async (err, rows) => {
                if (err) {
                    console.log("ERROR - An error occured getting the data: " + err.message)
                    await interaction.editReply('An error occured!')
                    return
                }

                let selectedDigimon = rows[game["player" + (i+1).toString()].digimon]

                let digimonObject = {
                    "user": selectedDigimon.userID,
                    "name": selectedDigimon.name,
                    "speed": selectedDigimon.speed
                }

                digimon.push(digimonObject)
            })
        }

        game.waveNum += 1

        let channelThreads = interaction.channel.threads ? interaction.channel.threads : interaction.channel.parent.threads

        let messageChannel = interaction.channel.name == name + "'s Dungeon" ? interaction.channel.parent : interaction.channel

        const gameThread = channelThreads.cache.find(x => x.name === name + "'s Dungeon");
        await gameThread.delete();

        await messageChannel.send(`<@${leader}>, Your game has been closed. Thanks for playing!`)

        con.end()
    }
}
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const wait = require('node:timers/promises').setTimeout;
const { parties } = require("../parties.json")
const { dungeon } = require("../dungeon-config.json")
const { makeMove } = require("../ai/normal")
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

        let game = parties.find(party => party.player == interaction.user.id)

        if(game == undefined) {
            await interaction.editReply('You are not currently in a game!');
            return
        }

        let name = interaction.user.username

        if(!game.started){
            await interaction.editReply('You cannot start a new wave in a dungeon that has not been started!');
            return
        }

        if(interaction.channel.name != name + "'s Dungeon"){
            await interaction.editReply('You must use this command in the dungeon thread!');
            return
        }

        if(game.currentEnemies.length != 0){
            await interaction.editReply('There are still enemy digimon alive in the current wave!');
            return
        }

        let digimon = []
        let enemyDigimon = ""
        let turnOrder = ""

        for(let i = 0; i < game.playerDigimon.length; i++){
            con.query(`SELECT * FROM digimon WHERE userID = '${game.player}' AND colId = ${game.playerDigimon[i].colId}`, async (err, rows) => {
                if (err) {
                    console.log("ERROR - An error occured getting the data: " + err.message)
                    await interaction.editReply('An error occured!')
                    return
                }

                let selectedDigimon = rows[0]

                let digimonObject = {
                    "user": selectedDigimon.userID,
                    "username": name,
                    "digiId": selectedDigimon.colId,
                    "name": selectedDigimon.name,
                    "speed": selectedDigimon.speed
                }

                digimon.push(digimonObject)

                game.waveNum += 1

                
                for(let i = 0; i < dungeon.training.waves[game.waveNum]; i++){
                    let eDigi = 0
                    let newDigi = {}
                    if(game.waveNum != (dungeon.training.waves.length-1)){
                        eDigi = Math.floor(Math.random()*dungeon.training.minions.length)
                        newDigi = {
                            "name": dungeon.training.minions[eDigi].name,
                            "id": i + 1,
                            "attribute": dungeon.training.minions[eDigi].attribute,
                            "hp": dungeon.training.minions[eDigi].hp,
                            "atk": dungeon.training.minions[eDigi].atk,
                            "def": dungeon.training.minions[eDigi].def,
                            "spirit": dungeon.training.minions[eDigi].spirit,
                            "speed": dungeon.training.minions[eDigi].speed
                        }
                    } else {
                        eDigi = Math.floor(Math.random()*dungeon.training.bosses.length)
                        newDigi = {
                            "name": dungeon.training.bosses[eDigi].name,
                            "id": i + 1,
                            "attribute": dungeon.training.bosses[eDigi].attribute,
                            "hp": dungeon.training.bosses[eDigi].hp,
                            "atk": dungeon.training.bosses[eDigi].atk,
                            "def": dungeon.training.bosses[eDigi].def,
                            "spirit": dungeon.training.bosses[eDigi].spirit,
                            "speed": dungeon.training.bosses[eDigi].speed
                        }
                    }
                    digimon.push(newDigi)
                    game.currentEnemies.push(newDigi)
                    enemyDigimon += newDigi.name + " - " + newDigi.id + "\n"
                }
                
                game.turnOrder = digimon.sort((a, b) => a.speed - b.speed).reverse()

                for(let i = 0; i < game.turnOrder.length; i++){
                    if(game.turnOrder[i].username != undefined){
                        turnOrder += game.turnOrder[i].username + "'s "
                    }
                    turnOrder += game.turnOrder[i].name
                    if(game.turnOrder[i].username == undefined){
                        turnOrder += " - " + game.turnOrder[i].id
                    }
                    turnOrder += "\n"
                }

                let waveEmbed = new EmbedBuilder()
                    .setTitle("Wave " + game.waveNum)
                    .addFields(
                        { name: 'Enemies', value: enemyDigimon, inline: true },
                        { name: 'Turn Order', value: turnOrder, inline: true }
                    )

                await interaction.channel.send({ embeds: [waveEmbed]})

                await wait(1000)

                if(game.turnOrder[0].username == undefined){
                    game.currentTurn = -1
                    game.turnIndex = 0
                    makeMove(interaction.channel, game, 0)
                } else {
                    game.currentTurn = game.turnOrder[0].digiId
                    await interaction.channel.send(`<@${game.turnOrder[0].user}>, it is your ${game.turnOrder[0].name}'s turn! Choose a move with /use-attack!`)
                }

                con.end()
            })
        }

        
    }
}
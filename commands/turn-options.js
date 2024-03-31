const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { digimonList } = require("../digimon-config.json")
const { connectToDatabase } = require('../database')
const { parties } = require("../parties.json")

module.exports = {
    data: new SlashCommandBuilder()
            .setName('turn-options')
            .setDescription('Gives a list of moves your digimon knows!'),
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

        if(game.currentTurn == -1){
            await interaction.editReply('It is not currently your turn!')
            return
        }

        let movesEmbed = new EmbedBuilder()
                .setTitle('Move Choice')

        con.query(`SELECT * FROM digimon WHERE userID = '${interaction.user.id}' AND colId = ${game.currentTurn}`, async (err, rows) => {
            if (err) {
                console.log("ERROR - An error occured getting the data: " + err.message)
                await interaction.editReply('An error occured!')
                return
            }

            digimonName = rows[0].name
            digimonLevel = rows[0].level

            let digiMoves = digimonList.find(digimon => digimon.name == digimonName).moves

            for(let i = 0; i < digiMoves.length; i++){
                if(digiMoves[i]["unlock-level"] <= digimonLevel){
                    switch(digiMoves[i].type){
                        case "attack":
                            movesEmbed.addFields(
                                { name: "Name", value: (i+1) + ": " + digiMoves[i].name, inline: true },
                                { name: "MP Cost", value: digiMoves[i].cost, inline: true },
                                { name: "Damage", value: digiMoves[i].damage, inline: true }
                            )
                            break
                        case "heal":
                            movesEmbed.addFields(
                                { name: "Name", value: (i+1) + ": " + digiMoves[i].name, inline: true },
                                { name: "MP Cost", value: digiMoves[i].cost, inline: true },
                                { name: "Heal", value: digiMoves[i].heal, inline: true }
                            )
                            break
                        case "status":
                            if(digiMoves[i].raiseStat != null){
                                movesEmbed.addFields(
                                    { name: "Name", value: (i+1) + ": " + digiMoves[i].name, inline: true },
                                    { name: "MP Cost", value: digiMoves[i].cost, inline: true },
                                    { name: "Raise", value: digiMoves[i].statAmount[0], inline: true }
                                )
                            } else if(digiMoves[i].dropStat != null){
                                movesEmbed.addFields(
                                    { name: "Name", value: (i+1) + ": " + digiMoves[i].name, inline: true },
                                    { name: "MP Cost", value: digiMoves[i].cost, inline: true },
                                    { name: "Drop", value: digiMoves[i].statAmount[0], inline: true }
                                )
                            }
                            break
                    }
                }
            }

            interaction.editReply({ embeds: [movesEmbed]})
        })

        con.end()
    }
}
const { SlashCommandBuilder } = require("discord.js");
const { parties } = require("../parties.json")
const { connectToDatabase } = require('../database')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('accept')
        .setDescription('Allows you to accept a party invite!')
        .addStringOption(option =>
            option
                .setName('slot-number')
                .setDescription('Number of the slot of the digimon you would like to view.')
                .setRequired(true)
                .addChoices(
                    { "name": "1", "value": "1"}, 
                    { "name": "2", "value": "2"}, 
                    { "name": "3", "value": "3"}, 
                    { "name": "4", "value": "4"}, 
                    { "name": "5", "value": "5"}, 
                    { "name": "6", "value": "6"}, 
                    { "name": "7", "value": "7"}, 
                    { "name": "8", "value": "8"}, 
                    { "name": "9", "value": "9"}, 
                    { "name": "10", "value": "10"} 
                )
        ),
    async execute(interaction) {
        await interaction.reply('Running command...')
        const slot = interaction.options.getString('slot-number')

        let con = connectToDatabase()

        con.connect(async err => {
            if (err) {
                console.log("ERROR - An error occured connecting to the database: " + err.message)
                await interaction.editReply('An error occured!');
                return
            }
        })

        con.query(`SELECT * FROM digimon WHERE userID = '${interaction.user.id}'`, async (err, rows) => {
            if (err) {
                console.log("ERROR - An error occured getting the data: " + err.message)
                await interaction.editReply('An error occured!')
                return
            }

            if(rows.length < 1){
                await interaction.editReply("You don't have any digimon! Please use the /choose-starter command to get started!")
                return
            } 

            if(rows.length < slot){
                await interaction.editReply("You don't have a digimon in that slot! Please use choose a different slot!")
                return
            } 

            let digimonId = rows[slot-1].colId

            let game = parties.find(party => party.players.includes(interaction.user.id))

            if(game == undefined) {
                await interaction.editReply('You do not have a pending invite to a game!');
                return
            }
    
            let leader = game.players[0];
    
            if(leader == interaction.user.id) {
                await interaction.editReply('You do not have a pending invite to a game!');
                return
            }
    
            let name = interaction.member.nickname ? interaction.member.nickname : interaction.user.username
            let numAccept = 1;
    
            for(let i = 1; i < game.players.length; i++){
                let n = i+1
                if(game["player" + n.toString()].user.id == interaction.user.id){
                    game["player" + n.toString()].digimon = digimonId
                    game["player" + n.toString()].accepted = true
                    numAccept += 1
                } else {
                    if(game["player" + n.toString()].accepted == true){
                        numAccept += 1
                    }
                }
            }
    
            await interaction.editReply(`<@${leader}>, ${name} has accepted their invite! ${numAccept} out of ${game.players.length} have accepted.`)
    
            con.end()
        })

    }
}
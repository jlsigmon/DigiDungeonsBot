const { SlashCommandBuilder } = require("discord.js");
const { parties } = require("../parties.json")
const { connectToDatabase } = require('../database')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-party')
        .setDescription('Allows you to create a new dungeon party with up to 4 digimon!')
        .addStringOption(option =>
            option
                .setName('slot-number')
                .setDescription('Number of the slot of the digimon you would like to add to the party first.')
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
        )
        .addStringOption(option =>
            option
                .setName('slot-number-two')
                .setDescription('Number of the slot of the digimon you would like to add to the party second.')
                .setRequired(false)
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
        )
        .addStringOption(option =>
            option
                .setName('slot-number-three')
                .setDescription('Number of the slot of the digimon you would like to add to the party third.')
                .setRequired(false)
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
        )
        .addStringOption(option =>
            option
                .setName('slot-number-four')
                .setDescription('Number of the slot of the digimon you would like to add to the party fourth.')
                .setRequired(false)
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
        const slotOne = interaction.options.getString('slot-number')
        const slotTwo = interaction.options.getString('slot-number-two')
        const slotThree = interaction.options.getString('slot-number-three')
        const slotFour = interaction.options.getString('slot-number-four')
        const player = interaction.user

        let game = parties.find(party => party.player == interaction.user.id)

        if(game != undefined) {
            await interaction.editReply('You have an active party already! Please close it before creating a new one!');
            return
        }

        let duplicateSlots = false

        if(slotTwo != null){
            if(slotOne == slotTwo) duplicateSlots = true
        }

        if(slotThree != null){
            if(slotOne == slotThree) duplicateSlots = true
            if(slotTwo == slotThree) duplicateSlots = true
        }

        if(slotFour != null){
            if(slotOne == slotFour) duplicateSlots = true
            if(slotTwo == slotFour) duplicateSlots = true
            if(slotThree == slotFour) duplicateSlots = true
        }    

        if(duplicateSlots) {
            await interaction.editReply("You chose the same slot number multiple times! Please choose different numbers for each slot!")
            return
        }
        
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

            if(rows.length < slotOne || rows.length < slotTwo || rows.length < slotThree ||rows.length < slotFour){
                await interaction.editReply("You don't have a digimon in one of the slots you chose! Please use choose a different slot!")
                return
            }

            let partyDigi = []
            partyDigi.push(rows[slotOne-1])
            if (slotTwo != null) {
                partyDigi.push(rows[slotTwo-1])
            }
            if (slotThree != null){
                partyDigi.push(rows[slotThree-1])
            }
            if (slotFour != null){
                partyDigi.push(rows[slotFour-1])
            }
          
            con.query(`SELECT * FROM users WHERE userID = '${player.id}'`, async (err, rows) => {
                if (err) {
                    console.log("ERROR - An error occured getting the data: " + err.message)
                    await interaction.editReply('An error occured!')
                    return
                }
        
                if(rows.length < 1){
                    await interaction.editReply(`You do not have a digimon yet!`)
                    return
                }
    
                if(rows[0].hasInvite == true){
                    await interaction.editReply(`You already have an invite or you are currently in a game!`)
                    return
                }
    
                parties.push({
                    "player": player.id,
                    "type": "",
                    "started": false,
                    "waveNum": 0,
                    "currentEnemies": [],
                    "turnOrder": [],
                    "turnIndex": -1,
                    "currentTurn": -1,
                    "playerDigimon": partyDigi
                })
    
                await interaction.editReply('Party has been created!')
                    
                con.end()
                    
                return
            })
            
        })
    }
}
const { SlashCommandBuilder } = require("discord.js");
const { parties } = require("../parties.json")
const { connectToDatabase } = require('../database')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-party')
        .setDescription('Allows you to create a game party with up to 3 other people!')
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
        )
        .addUserOption(option =>
            option
                .setName('player1')
                .setDescription('First player to invite.')
        )
        .addUserOption(option =>
            option
                .setName('player2')
                .setDescription('Second player to invite.')
        )
        .addUserOption(option =>
            option
                .setName('player3')
                .setDescription('Third player to invite.')
        ),
    async execute(interaction) {
        await interaction.reply('Running command...')
        const slot = interaction.options.getString('slot-number')
        const player1 = interaction.user
        const player2 = interaction.options.getUser('player1')
        const player3 = interaction.options.getUser('player2')
        const player4 = interaction.options.getUser('player3')

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

            if(player2 == null){
                con.query(`SELECT * FROM users WHERE userID = '${player1.id}'`, async (err, rows) => {
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
    
                    let sql = `UPDATE users SET hasInvite = ${true} WHERE userID = '${player1.id}'`;
                    con.query(sql, console.log)
    
                    parties.push({
                        "players": [player1.id],
                        "type": "",
                        "started": false,
                        "waveNum": 0,
                        "currentEnemies": [],
                        "turnOrder": [],
                        "player1": {
                            "user": player1,
                            "digimon": digimonId
                        },
                        "player2": "",
                        "player3": "",
                        "player4": ""
                    })
    
                    await interaction.editReply('Party has been created!')
                    
                    con.end()
                    
                    return
                })
            } else if(player3 == null && player2 != null && player1.id != player2.id){
                checkInviteStatus([player1, player2], con, interaction).then(async () => {
                    updateInviteStatus([player1, player2], con)
                    parties.push({
                        "players": [player1.id, player2.id],
                        "type": "",
                        "started": false,
                        "waveNum": 0,
                        "currentEnemies": [],
                        "turnOrder": [],
                        "player1": {
                            "user": player1,
                            "digimon": digimonId
                        },
                        "player2": {
                            "user": player2,
                            "digimon": "none",
                            "accepted": false
                        },
                        "player3": "",
                        "player4": ""
                    })
    
                    await interaction.editReply(`Party has been created! ${player2} use /accept to accept or /decline to decline the invite!`)
                    
                    con.end()
                    
                    return
                })
            } else if(player4 == null && player3 != null && player2 != null && player2.id != player3.id && player2.id != player1.id && player1.id != player3.id){
                checkInviteStatus([player1, player2, player3], con, interaction).then(async () => {
                    updateInviteStatus([player1, player2, player3], con)
                    parties.push({
                        "players": [player1.id, player2.id, player3.id],
                        "type": "",
                        "started": false,
                        "waveNum": 0,
                        "currentEnemies": [],
                        "turnOrder": [],
                        "player1": {
                            "user": player1,
                            "digimon": digimonId
                        },
                        "player2": {
                            "user": player2,
                            "digimon": "none",
                            "accepted": false
                        },
                        "player3": {
                            "user": player3,
                            "digimon": "none",
                            "accepted": false
                        },
                        "player4": ""
                    })
    
                    await interaction.editReply(`Party has been created! ${player2}, ${player3} use /accept to accept or /decline to decline the invite!`)
                    
                    con.end()
                    
                    return
                }) 
            } else if(player4 != null && player3 != null && player2 != null && player2.id != player3.id && player4.id != player1.id && player1.id != player2.id && player1.id != player3.id && player2.id != player4.id && player3.id != player4.id){
                checkInviteStatus([player1, player2, player3, player4], con, interaction).then(async () => {
                    updateInviteStatus([player1, player2, player3, player4], con)
                    parties.push({
                        "players": [player1.id, player2.id, player3.id, player4.id],
                        "type": "",
                        "started": false,
                        "waveNum": 0,
                        "turnNum": 0,
                        "currentEnemies": [],
                        "turnOrder": [],
                        "player1": {
                            "user": player1,
                            "digimon": digimonId
                        },
                        "player2": {
                            "user": player2,
                            "digimon": "none",
                            "accepted": false
                        },
                        "player3": {
                            "user": player3,
                            "digimon": "none",
                            "accepted": false
                        },
                        "player4": {
                            "user": player4,
                            "digimon": "none",
                            "accepted": false
                        }
                    })

                    await interaction.editReply(`Party has been created! ${player2}, ${player3}, ${player4} use /accept to accept or /decline to decline the invite!`)
                
                    con.end()
    
                    return
                })
            } else {
                await interaction.editReply(`You cannot the same person multiple times!`)
                return
            }
        })
    }
}

async function checkInviteStatus(players, con, interaction){
    for(let i = 0; i < players.length; i++){
        con.query(`SELECT * FROM users WHERE userID = '${players[i].id}'`, async (err, rows) => {
            if (err) {
                console.log("ERROR - An error occured getting the data: " + err.message)
                await interaction.editReply('An error occured!')
            }

            if(rows.length < 1){
                await interaction.editReply(`${players[i].username} does not have any digimon yet!`)
            }

            if(rows[0].hasInvite){
                await interaction.editReply(`${players[i].username} already has an invite or is currently in a game!`)
            }
        })
    }
}

function updateInviteStatus(players, con){
    for(let i = 0; i < players.length; i++){
        let sql = `UPDATE users SET hasInvite = ${true} WHERE userID = '${players[i].id}'`;
        con.query(sql, console.log)
    }
}
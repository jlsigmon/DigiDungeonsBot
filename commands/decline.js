const { SlashCommandBuilder } = require("discord.js");
const { parties } = require("../parties.json")
const { connectToDatabase } = require('../database')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('decline')
        .setDescription('Allows you to choose a starter digimon!'),
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
            await interaction.editReply('You do not have a pending invite to a game!');
            return
        }

        let leader = game.players[0];

        for(let i = 0; i < game.players.length; i++){
            con.query(`SELECT * FROM users WHERE userID = '${game.players[i]}'`, async (err, rows) => {
                if (err) {
                    console.log("ERROR - An error occured getting the data: " + err.message)
                    await interaction.editReply('An error occured!')
                    return
                }

                if(rows[0].hasInvite == true){
                    let sql = `UPDATE users SET hasInvite = ${false} WHERE userID = '${game.players[i]}'`;
                    con.query(sql, console.log)
                }
            })
        }

        parties.splice(parties.findIndex(party => party.players.includes(interaction.user.id)), 1)

        console.log(parties)
        await interaction.editReply(`<@${leader}>, a player has declined their invite! The game party will be closed.`)

        con.end()
    }
}
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { connectToDatabase } = require('../database')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tamed-digimon')
        .setDescription('Allows you to view your digimon!'),
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

            let digiNames = "";
            let digiLevel = "";
            let digiFriendship = "";

            for(let i = 0; i < rows.length; i++){
                digiNames += rows[i].name + "\n"
                digiLevel += rows[i].level + "\n"
                digiFriendship += rows[i].friendship + "\n"
            }
            
            let tamedEmbed = new EmbedBuilder()
                .setTitle('Tamed Digimon')
                .addFields(
                    { name: 'Digimon', value: digiNames, inline: true },
                    { name: 'Level', value: digiLevel, inline: true },
                    { name: 'Friendship', value: digiFriendship, inline: true }
                )
            
            interaction.editReply({ embeds: [tamedEmbed]})
            
            con.end()
        })

    }
}
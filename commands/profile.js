const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { connectToDatabase } = require('../database')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View your profile!'),
    async execute(interaction) {
        await interaction.reply('Running command...');

        let bal = 0;
        let numDigimon = 0;

        let con = connectToDatabase()

        con.connect(async err => {
            if (err) {
                console.log("ERROR - An error occured connecting to the database: " + err.message)
                await interaction.editReply('An error occured!');
                return
            }
        })

        con.query(`SELECT * FROM users WHERE userID = '${interaction.user.id}'`, async (err, rows) => {
            if (err) {
                console.log("ERROR - An error occured getting the data: " + err.message)
                await interaction.editReply('An error occured!')
                return
            }

            if(rows.length < 1){
                await interaction.editReply("You haven't chosen a digimon! Please use the /choose-starter command to get started!")
                return
            } 

            bal = rows[0].balance;
        })

        con.query(`SELECT * FROM digimon WHERE userID = '${interaction.user.id}'`, async (err, rows) => {
            if (err) {
                console.log("ERROR - An error occured getting the data: " + err.message)
                await interaction.editReply('An error occured!')
                return
            }

            numDigimon = rows.length;
        })

        con.query(`SELECT * FROM data WHERE userID = '${interaction.user.id}'`, async (err, rows) => {
            if (err) {
                console.log("ERROR - An error occured getting the data: " + err.message)
                await interaction.editReply('An error occured!')
                return
            }

            let name = interaction.member.nickname
            console.log(name)
            if(name == undefined){
                name = interaction.user.username
            }

            let profileEmbed = new EmbedBuilder()
                .setTitle(`${name}'s Profile`)
                .setThumbnail(interaction.user.avatarURL())
                .addFields(
                    { name: "Balance", value: bal.toString(), inline: true },
                    { name: "Number of Digimon", value: `${numDigimon.toString()} / 10`, inline: true }
                )
                .addFields(
                    { name: "Data", value: `Aqua: ${rows[0].aqua.toString()} | Beast: ${rows[0].beast.toString()}\n
                    Bird: ${rows[0].bird.toString()} | Dark: ${rows[0].dark.toString()}\n
                    Dragon: ${rows[0].dragon.toString()} | Holy: ${rows[0].holy.toString()}\n
                    Machine: ${rows[0].machine.toString()} | Nature: ${rows[0].nature.toString()}\n`},
                )

            await interaction.editReply({ embeds: [profileEmbed]})
        })

        con.end()
    }
}
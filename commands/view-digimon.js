const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { connectToDatabase } = require('../database')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('view-digimon')
        .setDescription('Allows you to view a specific digimon in your collection!')
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
        const slot = Number.parseInt(interaction.options.getString('slot-number'));

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

            let chosenDigimon = rows[slot-1];

            let digimonEmbed = new EmbedBuilder()
                .setTitle(chosenDigimon.name + ' Info')
                .addFields(
                    { name: 'Attribute', value: chosenDigimon.attribute, inline: true },
                    { name: 'Rank', value: chosenDigimon.evolution, inline: true },
                    { name: 'Level', value: chosenDigimon.level.toString(), inline: true },
                )
                .addFields(
                    { name: 'HP', value: chosenDigimon.hp.toString() + " / " + chosenDigimon.maxHp.toString(), inline: true },
                    { name: 'MP', value: chosenDigimon.mp.toString(), inline: true },
                    { name: 'Recovery', value: chosenDigimon.recovery.toString(), inline: true }
                )
                .addFields(
                    { name: 'ATK', value: chosenDigimon.atk.toString(), inline: true },
                    { name: 'DEF', value: chosenDigimon.def.toString(), inline: true },
                    { name: 'Speed', value: chosenDigimon.speed.toString(), inline: true }
                )
                .addFields(
                    { name: 'Spirit', value: chosenDigimon.spirit.toString(), inline: true },
                    { name: 'Friendship', value: chosenDigimon.friendship.toString(), inline: true },
                )
                .addFields(
                    { name: 'EXP / Next Level', value: chosenDigimon.exp.toString() + "/" + chosenDigimon.nextLevel.toString() }
                )
            
            interaction.editReply({ embeds: [digimonEmbed]})

            con.end()
        })

    }
}
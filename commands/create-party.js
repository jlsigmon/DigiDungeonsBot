const { SlashCommandBuilder } = require("discord.js");
const { parties } = require("../parties.json")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-party')
        .setDescription('Allows you to choose a starter digimon!')
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
        const player1 = interaction.user
        const player2 = interaction.options.getUser('player1')
        const player3 = interaction.options.getUser('player2')
        const player4 = interaction.options.getUser('player3')
        console.log(player2)

        if(player2 == null){
            parties.push({
                "player1": player1,
                "playey2": "",
                "playey3": "",
                "playey4": ""
            })

            await interaction.editReply('Party has been created!')
            return
        }

        if(player3 == null){
            parties.push({
                "player1": player1,
                "playey2": {
                    "user": player2,
                    "accepted": false
                },
                "playey3": "",
                "playey4": ""
            })

            await interaction.editReply(`Party has been created! ${player2} use /`)
            return
        }
    }
}
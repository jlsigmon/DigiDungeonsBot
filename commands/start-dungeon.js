const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { parties } = require("../parties.json")


module.exports = {
    data: new SlashCommandBuilder()
        .setName('start-dungeon')
        .setDescription('Allows you to start a new dungeon with your party!')
        .addStringOption(option =>
            option
                .setName('dungeon-type')
                .setDescription('Number of the slot of the digimon you would like to view.')
                .setRequired(true)
                .addChoices(
                    { "name": "Training", "value": "training"}
                )
        ),
    async execute(interaction) {
        await interaction.reply('Running command...')
        const type = interaction.options.getString('dungeon-type')

        let game = parties.find(party => party.player == interaction.user.id)

        if(game == undefined) {
            await interaction.editReply('You currently do not have a party created! Please create a party!');
            return
        }

        let name = interaction.user.username

        if(game.started){
            await interaction.editReply(`<@${game.player}>, you have already started the dungeon!`)
            return
        }

        game.type = type

        const dungeonThread = await interaction.channel.threads.create({
            name: name + "'s Dungeon",
            autoArchiveDuration: 60,
            type: ChannelType.PrivateThread,
            reason: 'Need to create a thread for the game'
        })

        await dungeonThread.members.add(game.player)
        
        game.started = true

        await dungeonThread.send(`<@${game.player}>, Your ${type} dungeon has been successfully started! Have fun!`)

    }
}
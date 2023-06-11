const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { parties } = require("../parties.json")


module.exports = {
    data: new SlashCommandBuilder()
        .setName('start-dungeon')
        .setDescription('Allows you to start a new dungeon with your party!'),
    async execute(interaction) {
        await interaction.reply('Running command...')

        let game = parties.find(party => party.players.includes(interaction.user.id))

        if(game == undefined) {
            await interaction.editReply('You are not currently the party leader of a game!');
            return
        }

        let leader = game.players[0];
       
        if(leader != interaction.user.id) {
            await interaction.editReply('You are not the party leader for this game!');
            return
        }

        let name = interaction.member.nickname ? interaction.member.nickname : interaction.user.username
        let numAccept = 1;

        if(game.players.length > 1){
            for(let i = 1; i < game.players.length; i++){
                let n = i+1;
                if(game["player" + n.toString()].accepted == true){
                    numAccept += 1
                }
            }
        }

        if(numAccept < game.players.length){
            await interaction.editReply(`<@${leader}>, there are still players who have not accepted! PLease wait until everyone accepts!`)
            return
        }

        const dungeonThread = await interaction.channel.threads.create({
            name: name + "'s Dungeon",
            autoArchiveDuration: 60,
            type: ChannelType.PrivateThread,
            reason: 'Need to create a thread for the game'
        })

        for(let i = 1; i < game.players.length; i++){
            await dungeonThread.members.add(game.players[i])
        }

        game.started = true

        await dungeonThread.send(`<@${leader}>, Your game has been successfully started! Have fun!`)

    }
}
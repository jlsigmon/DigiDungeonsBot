const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType } = require("discord.js");
const { connectToDatabase } = require('../database')
const { parties } = require("../parties.json")
const { digimonList } = require("../digimon-config.json");
const { calculateDamage } = require("../shared_functions/battle-functions")
const { execute } = require("./start-wave");
const { makeMove } = require("../ai/normal")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("use-attack")
        .setDescription("Choose an attack to use!")
        ,
    async execute(interaction){
        await interaction.reply('Running command...')
        let con = connectToDatabase()

        const collectorFilter = i => {
            i.deferUpdate();
            return i.user.id === interaction.user.id;
        };

        con.connect(async err => {
            if (err) {
                console.log("ERROR - An error occured connecting to the database: " + err.message)
                await interaction.editReply('An error occured!');
                return
            }
        })

        let game = parties.find(party => party.player == interaction.user.id)

        if(game == undefined) {
            await interaction.editReply('You are not currently in a game!');
            return
        }

        //TODO: Add check for users turn

        let movesEmbed = new EmbedBuilder()
                .setTitle('Move Choice')

        con.query(`SELECT * FROM digimon WHERE userID = '${interaction.user.id}' AND colId = ${game.currentTurn}`, async (err, rows) => {
            if (err) {
                console.log("ERROR - An error occured getting the data: " + err.message)
                await interaction.editReply('An error occured!')
                return
            }

            digimonName = rows[0].name
            digimonLevel = rows[0].level

            let digiMoves = digimonList.find(digimon => digimon.name == digimonName).moves

            let moveChoices = new StringSelectMenuBuilder()
                .setCustomId("moves")
                .setPlaceholder("Choose a move to use!")

            for(let i = 0; i < digiMoves.length; i++){
                if(digiMoves[i]["unlock-level"] <= digimonLevel){
                    moveChoices.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(digiMoves[i].name)
                            .setDescription("Target: " + digiMoves[i].target + " Damage: " + digiMoves[i].damage + " MP Cost: " + digiMoves[i].cost)
                            .setValue(digiMoves[i].name)
                        
                    )
                }
            } 
            
            let moveSelectMenu = new ActionRowBuilder()
                .addComponents(moveChoices)

            let menu = await interaction.editReply({
                content: 'Choose a move to use!',
                components: [moveSelectMenu]
            })    

            menu.awaitMessageComponent({ filter: collectorFilter, componentType: ComponentType.StringSelect, time: 60000})
                .then(async menuInteraction => {
                    let selection = menuInteraction.values[0]

                    let selectedMove = digiMoves.find(move => move.name === selection)

                    let targetChoices = new StringSelectMenuBuilder()
                        .setCustomId("targets")
                        .setPlaceholder("Choose a target!")

                    let targetSelectMenu = new ActionRowBuilder()
                        .addComponents(targetChoices)

                    switch(selectedMove.target){
                        case "enemy":
                            for(let x = 0; x < game.currentEnemies.length; x++){
                                targetChoices.addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel(game.currentEnemies[x].name + " - " + game.currentEnemies[x].id.toString())
                                        .setDescription("One of the enemy digimon")
                                        .setValue(x.toString())
                                )
                            }

                            let targetMenu = await interaction.channel.send({ 
                                content: `You have selected the attack ${selection}! Please choose an enemy target!`, 
                                components: [targetSelectMenu] 
                            })

                            processAttackMove(targetMenu, collectorFilter, interaction, game, selectedMove, rows[0])
                            break

                        case "ally":
                            break    
                    }
                    
                })
                .catch(async err => {
                    console.log("No interactions were collected!")
                    console.log(err)
                    await interaction.channel.send("The move selector has timed out! Please use /use-attack again!")
                })
        })

        con.end()
    }
}

async function processAttackMove(menu, filter, interaction, game, move, user){
    menu.awaitMessageComponent({ filter: filter, componentType: ComponentType.StringSelect, time: 60000})
        .then(async option => {
            let selection = game.currentEnemies[option.values[0]]

            let totalDamage = calculateDamage(user, selection, move)

            selection.hp = selection.hp - totalDamage

            let targetName = selection.name + " - " + selection.id

            await interaction.channel.send(`**Your ${user.name} has used ${move.name} on ${targetName} dealing ${totalDamage} damage! ${targetName} now has ${selection.hp} hp remaining!**`)

            endTheTurn(game, interaction)
        })
        .catch(async err => {
            console.log("No interactions were collected!")
            console.log(err)
            await interaction.channel.send("The move selector has timed out! Please use /use-attack again!")
        })
}

async function endTheTurn(game, interaction){
    await wait(1000)
    console.log("Ending the turn!")

    game.turnIndex += 1;

    if(game.turnIndex >= game.turnOrder.length) game.turnIndex = 0

    if(game.turnOrder[game.turnIndex].username == undefined){
        makeMove(interaction.channel, game, game.turnIndex)
    } else {
        game.currentTurn = game.turnOrder[index].digiId
        await interaction.channel.send(`<@${game.player}>, it is your ${game.turnOrder[index].name}'s turn! Choose an attack with /use-attack!`)
    }
}
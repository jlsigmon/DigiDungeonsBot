const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType } = require("discord.js");
const { connectToDatabase } = require('../database')
const { parties } = require("../parties.json")
const { digimonList } = require("../digimon-config.json")
const { dungeon } = require("../dungeon-config.json")
const { statIncrease } = require("../leveling-config.json")
const { calculateDamage, calculateHeal, calculateRecovery } = require("../shared_functions/battle-functions")
const { execute } = require("./start-wave");
const { makeMove } = require("../ai/normal")
const wait = require('node:timers/promises').setTimeout;

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
                            for(let x = 0; x < game.playerDigimon.length; x++){
                                targetChoices.addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel(game.playerDigimon[x].name + " - " + (x+1).toString())
                                        .setDescription("One of the player's party digimon")
                                        .setValue(x.toString())
                                )
                            }

                            let allyMenu = await interaction.channel.send({ 
                                content: `You have selected the move ${selection}! Please choose an ally to target!`, 
                                components: [targetSelectMenu] 
                            })

                            processHealMove(allyMenu, collectorFilter, interaction, game, selectedMove, rows[0])
                            break  
                            
                        case "enemyParty":
                            processAttackAllMove(interaction, game, selectedMove, rows[0])
                            break
                    }
                    
                })
                .catch(async err => {
                    console.log("No interactions were collected!")
                    console.log(err)
                    await interaction.channel.send("The move selector has timed out! Please use /use-attack again!")
                })
        })
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

            let defeatedEnemies = []

            if(selection.hp <= 0){
                defeatedEnemies.push(selection)
            }

            endTheTurn(game, interaction, defeatedEnemies)
        })
        .catch(async err => {
            console.log("No interactions were collected!")
            console.log(err)
            await interaction.channel.send("The move selector has timed out! Please use /use-attack again!")
        })
}

async function processHealMove(menu, filter, interaction, game, move, user){
    menu.awaitMessageComponent({ filter: filter, componentType: ComponentType.StringSelect, time: 60000})
        .then(async option => {
            let selection = game.playerDigimon[option.values[0]]

            let totalHeal = calculateHeal(user, move)

            con.query(`SELECT * FROM digimon WHERE userID = '${interaction.user.id}' AND colId = ${selection.colId}`, async (err, rows) => {
                if (err) {
                    console.log("ERROR - An error occured getting the data: " + err.message)
                    await interaction.editReply('An error occured!')
                    return
                }
                
                let newHp = 0

                if(rows[0].hp + totalHeal >= rows[0].maxHp){
                    newHp = rows[0].maxHp
                } else {
                    newHp = rows[0].hp + totalHeal
                }

                let sql = `UPDATE digimon SET hp = ${newHp} WHERE colId = ${selection.colId}`;
                con.query(sql, console.log)

                await interaction.channel.send(`**Your ${user.name} has used ${move.name} on ${rows[0].name} healing them for ${totalHeal} hp! ${rows[0].name} now has ${newHp} hp remaining!**`)

                endTheTurn(game, interaction, null)
            })

            
        })
        .catch(async err => {
            console.log("No interactions were collected!")
            console.log(err)
            await interaction.channel.send("The move selector has timed out! Please use /use-attack again!")
        })
}

async function processAttackAllMove(interaction, game, move, user){
    let defeatedEnemies = []

    for(i = 0; i < game.currentEnemies.length; i++){
        let selection = game.currentEnemies[i]

        let totalDamage = calculateDamage(user, selection, move)

        selection.hp = selection.hp - totalDamage

        let targetName = selection.name + " - " + selection.id

        await interaction.channel.send(`**Your ${user.name} has used ${move.name} on ${targetName} dealing ${totalDamage} damage! ${targetName} now has ${selection.hp} hp remaining!**`)

        if(selection.hp <= 0){
            defeatedEnemies.push(selection)
        }
    }

    endTheTurn(game, interaction, defeatedEnemies)
}

async function endTheTurn(game, interaction, defeatedEnemies){
    await wait(1000)
    console.log("Ending the turn!")

    if(defeatedEnemies != null){
        for(let i = 0; i < defeatedEnemies.length; i++){
            let enemy = defeatedEnemies[i]
            let targetName = enemy.name + " - " + enemy.id
            let dealtFinal = ""

            for(let x = 0; x < game.playerDigimon.length; x++){
                let digi = game.playerDigimon[x]
                con.query(`SELECT * FROM digimon WHERE userID = '${interaction.user.id}' AND colId = ${digi.colId}`, async (err, rows) => {
                    if (err) {
                        console.log("ERROR - An error occured getting the data: " + err.message)
                        await interaction.editReply('An error occured!')
                        return
                    }
                    
                    let newXp = 0
                    let maxLevel = 0
                    let gainXp = 0

                    if(game.waveNum == (dungeon.training.length - 1)) {
                        gainXp = dungeon.training.bossExp
                    } else {
                        gainXp = dungeon.training.exp
                    }

                    if(digi.colId == game.currentTurn){
                        dealtFinal = digi.name
                        newXp = rows[0].exp + gainXp + dungeon.training.killBonus
                        console.log("New XP value EXP: " + newXp + ". Gained EXP Value should be " + (dungeon.training.exp + dungeon.training.killBonus))
                    } else {
                        newXp = rows[0].exp + gainXp
                        console.log("New XP value EXP: " + newXp + ". Gained EXP Value should be " + (dungeon.training.exp))
                    }

                    if(digi.evolution == "Rookie") {
                        maxLevel = statIncrease.rookie.levelCap
                    }

                    if(newXp >= rows[0].nextLevel){
                        if(maxLevel != rows[0].level) {
                            newXp = newXp - rows[0].nextLevel
                            handleLevelUp(game, interaction, rows[0])
                        }
                    } 

                    let sql = `UPDATE digimon SET exp = ${newXp} WHERE colId = ${digi.colId}`;
                    con.query(sql, console.log)
                    
                })  
            }

            con.query(`SELECT * FROM data WHERE userID = '${interaction.user.id}'`, async (err, rows) => {
                if (err) {
                    console.log("ERROR - An error occured getting the data: " + err.message)
                    await interaction.editReply('An error occured!')
                    return
                }

                for(let x = 0; x < enemy.dataDrops.length; x++){
                    let newData = enemy.dataDrops[x].amount + rows[0][enemy.dataDrops[x].type]

                    let sql = `UPDATE data SET ${enemy.dataDrops[x].type} = ${newData} WHERE userID = ${interaction.user.id}`;
                    con.query(sql, console.log)
                }
            })

            await interaction.channel.send(`**${targetName} has been defeated! Your party has gained ${dungeon.training.exp} EXP with ${dealtFinal} gaining an additional ${dungeon.training.killBonus}!**`)
            for(let y= 0; y < game.currentEnemies.length; y++){
                if(game.currentEnemies[y].name == enemy.name && game.currentEnemies[y].id == enemy.id){
                    game.currentEnemies.splice(y, 1)
                }
            }
            
        }
    }

    con.end()

    if(game.currentEnemies.length == 0){
        if(game.waveNum == dungeon.training.waves.length){
            await interaction.channel.send(`<@${game.player}>, YOU HAVE DEFEATED THE BOSS! The dungeon has been completed and will close shortly! Thank you for playing!`)

            await wait(2000)

            await interaction.channel.delete('The game has been complete so the thread will be closed.')
        } else {
            await interaction.channel.send(`<@${game.player}>, you have defeated all of the digimon in the current wave! When you are ready, use /start-wave to begin the next wave!`)
        }
    } else {
        let valid = false 

        while(!valid){
            game.turnIndex += 1;

            if(game.turnIndex >= game.turnOrder.length) game.turnIndex = 0

            if(game.turnOrder[game.turnIndex].username == undefined){
                if(game.turnOrder[game.turnIndex].hp > 0){
                    valid = true
                } else {
                    console.log("Skipping to next digimon since this one has perished...")
                }
            } else {
                valid = true
            }
        }

        if(game.turnOrder[game.turnIndex].username == undefined){
            makeMove(interaction.channel, game, game.turnIndex)
        } else {
            game.currentTurn = game.turnOrder[game.turnIndex].digiId
            await interaction.channel.send(`<@${game.player}>, it is your ${game.turnOrder[game.turnIndex].name}'s turn! Choose an attack with /use-attack!`)
        }
    }
}

async function handleLevelUp(game, interaction, digi){
    console.log("LEVELING UP!!!!!")
    let newLevel = digi.level + 1
    let digiStatIncrease
    let expBase = 0
    
    if(digi.evolution == "Rookie") {
        expBase = 25
        if(digi.attribute == "Data"){
            digiStatIncrease = statIncrease.rookie.data
        }
        if(digi.attribute == "Vaccine"){
            digiStatIncrease = statIncrease.rookie.vaccine
        }
        if(digi.attribute == "Virus"){
            digiStatIncrease = statIncrease.rookie.virus
        }
    }

    let newMaxHp = digi.maxHp + digiStatIncrease.hp
    let newMp = digi.mp + digiStatIncrease.mp
    let newAtk = digi.atk + digiStatIncrease.atk
    let newDef = digi.def + digiStatIncrease.def
    let newSpirit = digi.spirit + digiStatIncrease.spirit
    let newSpeed = digi.speed + digiStatIncrease.speed
    let newRecovery = digi.recovery + digiStatIncrease.recovery
    let newNextLevel = expBase + (expBase * newLevel)
   
    let sql = `UPDATE digimon SET level = ${newLevel}, nextLevel = ${newNextLevel}, maxHp = ${newMaxHp}, mp = ${newMp}, atk = ${newAtk}, def = ${newDef}, spirit = ${newSpirit}, speed = ${newSpeed}, recovery = ${newRecovery} WHERE colId = ${digi.colId}`;
    con.query(sql, console.log)

    await interaction.channel.send(`**<@${game.player}>, Your ${digi.name} has leveled up to level ${newLevel}!!!**`)
}
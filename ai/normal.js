const { EmbedBuilder } = require("discord.js")
const wait = require('node:timers/promises').setTimeout;
const { dungeon } = require("../dungeon-config.json")
const { setOptions } = require("../commands/turn-options")
const { calculateDamage } = require("../shared_functions/battle-functions")
const { connectToDatabase } = require('../database')

module.exports = {
    async makeMove(channel, game, index) {
        makeMove(channel, game, index)
    }
}

async function makeMove(channel, game, index){
    await channel.send(`*Calculating enemy ${game.turnOrder[index].name}'s turn...*`)

    let con = connectToDatabase()

    con.connect(async err => {
        if (err) {
            console.log("ERROR - An error occured connecting to the database: " + err.message)
            await interaction.editReply('An error occured!');
            return
        }
    })

    let enemyDigimon = dungeon.training.minions.find(digimon => digimon.name == game.turnOrder[index].name)

    let moveSet = enemyDigimon.attacks

    let selectedMove = moveSet[Math.floor(Math.random()*moveSet.length)]

    let target = ""

    if(selectedMove.target == "enemy"){
        switch(selectedMove.numTargets){
            case 1:
                target = Math.floor(Math.random()*game.playerDigimon.length)
                break
            case 4:
                target = "all"
                break
        }
    } else if(selectedMove.target == "enemyParty"){
        target = "all"
    } else {
        target = selectedMove.target
    }

    console.log(target)

     if(target != "all" && target != "ally" && target != "party"){
        con.query(`SELECT * FROM digimon WHERE colId = ${game.playerDigimon[target]}`, async (err, rows) => {
            if (err) {
                console.log("ERROR - An error occured getting the data: " + err.message)
                channel.send(`<@${game.player}>, an error occured! Please close this dungeon. Sorry for the inconvenience!`)
            }

            let totalDamage = calculateDamage(enemyDigimon, rows[0], selectedMove)

            let newHp = rows[0].hp - totalDamage

            let sql = `UPDATE digimon SET hp = ${newHp} WHERE colId = ${game.playerDigimon[target]}`;
            con.query(sql, console.log)

            await channel.send(`**Enemy ${game.turnOrder[index].name} used ${selectedMove.name} on your ${rows[0].name} dealing ${totalDamage} damage!\n${rows[0].name} now has ${rows[0].hp - totalDamage} health remaining!**`)

            con.end()

            await wait(1000)

            endTurn(game, channel)
        })
    } else {
        await channel.send(`The move the enemy tried to use is not yet implemented yet! Please check back later! Skipping turn...`)

        await wait(1000)

        endTurn(game, channel)
    }
}

async function endTurn(game, channel){
    game.turnIndex += 1

    if(game.turnIndex >= game.turnOrder.length) game.turnIndex = 0

    if(game.turnOrder[game.turnIndex].username == undefined){
        makeMove(channel, game, game.turnIndex)
    } else {
        game.currentTurn = game.turnOrder[game.turnIndex].digiId
        await channel.send(`<@${game.player}>, it is your ${game.turnOrder[game.turnIndex].name}'s turn! Choose an attack with /use-attack!`)
    }
}
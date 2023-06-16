const { EmbedBuilder } = require("discord.js")
const wait = require('node:timers/promises').setTimeout;
const { dungeon } = require("../dungeon-config.json")
const { connectToDatabase } = require('../database')

module.exports = {
    async makeMove(channel, game, index) {
        makeMove(channel, game, index)
    }
}

async function makeMove(channel, game, index){
    await channel.send(`Calculating enemy ${game.turnOrder[index].name}'s turn...`)
    
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

    switch(selectedMove.targets){
        case 1:
            target = Math.floor(Math.random()*game.players.length) + 1
            break
        case 4:
            target = "all"
            break
    }

     if(target != "all"){
        let tPlayer = game["player" + target.toString()]

        con.query(`SELECT * FROM digimon WHERE colId = '${tPlayer.digimon}'`, async (err, rows) => {
            if (err) {
                console.log("ERROR - An error occured getting the data: " + err.message)
                await interaction.editReply('An error occured!')
            }

            let bonus = 0

            if(((enemyDigimon.attribute == "Data" && rows[0].attribute == "Vaccine") || (enemyDigimon.attribute == "Vaccine" && rows[0].attribute == "Virus") || (enemyDigimon.attribute == "Virus" && rows[0].attribute == "Data")) && selectedMove.times == 1){
                bonus = 5
            }

            let totalDamage = 0

            for(let i = 0; i < selectedMove.times; i++){
                totalDamage += selectedMove.damage + (Math.floor(enemyDigimon.atk / 5) + bonus) - (Math.floor(rows[0].def / 10))
            }

            let newHp = rows[0].hp - totalDamage

            let sql = `UPDATE digimon SET hp = ${newHp} WHERE colId = ${tPlayer.digimon}`;
            con.query(sql, console.log)

            await channel.send(`Enemy ${game.turnOrder[index].name} used ${selectedMove.name} on ${tPlayer.user.username}'s ${rows[0].name} dealing ${totalDamage} damage!\n${rows[0].name} now has ${rows[0].hp - totalDamage} health remaining!`)

            con.end()

            await wait(1000)

            index += 1;

            if(game.turnOrder[index].id != undefined){
                makeMove(channel, game, index)
            } else {
                await channel.send(`<@${game.turnOrder[index].user}>, it is your turn!`)
            }
        })
    }
}
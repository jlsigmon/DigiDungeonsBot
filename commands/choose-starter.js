const { SlashCommandBuilder } = require("discord.js");
const { connectToDatabase } = require('../database')

const { digimonList } = require('../digimon-config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('choose-starter')
        .setDescription('Allows you to choose a starter digimon!')
        .addStringOption(option =>
            option
                .setName('digimon')
                .setDescription('Name of the digimon you want to start with')
                .setRequired(true)
                .addChoices(
                    {
                            "name": "Agumon",
                            "value": "Agumon"
                    },
                    {
                            "name": "Gabumon",
                            "value": "Gabumon"
                    },
                    {
                            "name": "Palmon",
                            "value": "Palmon"
                    },
                    {
                            "name": "Tentomon",
                            "value": "Tentomon"
                    },
                    {
                            "name": "Biyomon",
                            "value": "Biyomon"
                    },
                    {
                            "name": "Veemon",
                            "value": "Veemon"
                    },
                    {
                            "name": "Wormmon",
                            "value": "Wormmon"
                    },
                    {
                            "name": "Patamon",
                            "value": "Patamon"
                    },
                    {
                            "name": "Salamon",
                            "value": "Salamon"
                    },
                    {
                            "name": "Armadillomon",
                            "value": "Armadillomon"
                    },
                    {
                            "name": "Guilmon",
                            "value": "Guilmon"
                    },
                    {
                            "name": "Renamon",
                            "value": "Renamon"
                    },
                    {
                            "name": "Terriermon",
                            "value": "Terriermon"
                    },
                    {
                            "name": "Impmon",
                            "value": "Impmon"
                    },
                    {
                            "name": "Gaomon",
                            "value": "Gaomon"
                    }
                )
        ),
    async execute(interaction) {
        await interaction.reply('Running command...')
        const digimon = interaction.options.getString('digimon');

        var con = connectToDatabase()

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

            if(rows.length > 0){
                if(rows[0].numStarters == 4){
                        await interaction.editReply('You already have claimed your two starter digimon!')
                        return
                } else {
                        let selected = digimonList.find(digi => digi.name == digimon)
                        if(selected){
                                let sql = `UPDATE users SET numStarters = ${rows[0].numStarters + 1} WHERE userID = ${interaction.user.id}`
                                con.query(sql, console.log);
                
                                sql = `INSERT INTO digimon (userID, name, evolution, level, exp, hp, mp, atk, def, spirit, speed, recovery, attribute, nextLevel, friendship) VALUES ('${interaction.user.id}', '${selected.name}', '${selected["evolution-rank"]}', ${0}, ${0}, ${selected["base-hp"]}, ${selected["base-mp"]}, ${selected["base-atk"]}, ${selected["base-def"]}, ${selected["base-spirit"]}, ${selected["base-speed"]}, ${selected["base-recovery"]}, '${selected.attribute}', ${25}, ${0})`
                                con.query(sql, console.log);
                
                             await interaction.editReply("You have chosen " + selected.name + " as your second starter digimon!")
                             return
                        } else {
                             await interaction.editReply("Something went wrong!")
                             return
                        }
                        
                }
            } else {
        
                let selected = digimonList.find(digi => digi.name == digimon)

                if(selected){
                        let sql = `INSERT INTO users (userID, balance) VALUES ('${interaction.user.id}', ${0})`
                        con.query(sql, console.log);

                        sql = `INSERT INTO digimon (userID, name, evolution, level, exp, hp, mp, atk, def, spirit, speed, recovery, attribute, nextLevel, friendship) VALUES ('${interaction.user.id}', '${selected.name}', '${selected["evolution-rank"]}', ${0}, ${0}, ${selected["base-hp"]}, ${selected["base-mp"]}, ${selected["base-atk"]}, ${selected["base-def"]}, ${selected["base-spirit"]}, ${selected["base-speed"]}, ${selected["base-recovery"]}, '${selected.attribute}', ${25}, ${0})`
                        con.query(sql, console.log);

                        sql = `INSERT INTO data (userID, aqua, beast, bird, dark, dragon, holy, machine, nature) VALUES ('${interaction.user.id}', ${0}, ${0}, ${0}, ${0}, ${0}, ${0}, ${0}, ${0})`
                        con.query(sql, console.log);

                        await interaction.editReply("You have chosen " + selected.name + " as your first digimon!")
                } else {
                        await interaction.editReply("Something went wrong!")
                }
                }

            con.end()
        })

    }
}
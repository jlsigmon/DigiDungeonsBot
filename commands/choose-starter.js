const { SlashCommandBuilder } = require("discord.js");
const mysql = require('mysql2');
const { dbHost, dbUserName, dbPassword, dbName } = require('../config.json');
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

        var con = mysql.createConnection({
            host: dbHost,
            user: dbUserName,
            password: dbPassword,
            database: dbName
        })

        con.connect(async err => {
            if (err) {
                console.log("ERROR - An error occured connecting to the database: " + err.message)
                await interaction.editReply('An error occured!');
            }
        })

        con.query(`SELECT * FROM users WHERE userID = '${interaction.user.id}'`, async (err, rows) => {
            if (err) {
                console.log("ERROR - An error occured getting the data: " + err.message)
                await interaction.editReply('An error occured!')
            }

            if(rows.length > 0){
                await interaction.editReply('You already have a starter digimon!')
            }

            let selected = digimonList.find(digi => digi.name == digimon)

            console.log(selected.name)

            if(selected){
                let sql = `INSERT INTO users (userID, balance) VALUES ('${interaction.user.id}', ${0})`
                con.query(sql, console.log);

                sql = `INSERT INTO digimon (userID, name, evolution, level, exp, hp, mp, atk, def, spirit, speed, recovery, attribute, nextLevel, friendship) VALUES ('${interaction.user.id}', '${selected.name}', '${selected["evolution-rank"]}', ${1}, ${0}, ${selected["base-hp"]}, ${selected["base-mp"]}, ${selected["base-atk"]}, ${selected["base-def"]}, ${selected["base-spirit"]}, ${selected["base-speed"]}, ${selected["base-recovery"]}, '${selected.attribute}', ${5000}, ${0})`
                con.query(sql, console.log);

                await interaction.editReply("You have chosen " + selected.name + " as your fisrt digimon!")
            } else {
                await interaction.editReply("Something went wrong!")
            }

            con.end()
        })

    }
}
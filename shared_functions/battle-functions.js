const { connectToDatabase } = require('../database')
const { dungeon } = require("../dungeon-config.json")

module.exports = {
    calculateDamage(user, target, selectedMove){
        let bonus = 0

        if(((user.attribute == "Data" && target.attribute == "Vaccine") || (user.attribute == "Vaccine" && target.attribute == "Virus") || (user.attribute == "Virus" && target.attribute == "Data")) && selectedMove.times == 1){
            bonus = 5
        }

        let totalDamage = 0

        for(let i = 0; i < selectedMove.times; i++){
            totalDamage += selectedMove.damage + (Math.floor(user.atk / 5) + bonus) -  (Math.floor(target.def / 10))
            console.log("Total Damage is: " + totalDamage)
        }
        
        console.log("bonus damage is: " + bonus)
        console.log("Move damage is: " + selectedMove.damage)
        console.log("User attack stat is: " + Math.floor(user.atk / 5))
        console.log("Target defense is: " + (Math.floor(target.def / 10)))
        
        return totalDamage
    },
    calculateHeal(user, selectedMove){
        let totalHeal = selectedMove.heal + (Math.floor(user.spirit/2))

        console.log("Total heal is: " + totalHeal)
        
        return totalHeal
    },
    calculateRecovery(user, target, selectedMove){
        let bonus = 0

        if(((user.attribute == "Data" && target.attribute == "Vaccine") || (user.attribute == "Vaccine" && target.attribute == "Virus") || (user.attribute == "Virus" && target.attribute == "Data")) && selectedMove.times == 1){
            bonus = 5
        }

        let totalDamage = 0

        for(let i = 0; i < selectedMove.times; i++){
            totalDamage += selectedMove.damage + (Math.floor(user.atk / 5) + bonus) -  (Math.floor(target.def / 10))
            console.log("Total Damage is: " + totalDamage)
        }
        
        console.log("bonus damage is: " + bonus)
        console.log("Move damage is: " + selectedMove.damage)
        console.log("User attack stat is: " + Math.floor(user.atk / 5))
        console.log("Target defense is: " + (Math.floor(target.def / 10)))
        
        return totalDamage
    }
}
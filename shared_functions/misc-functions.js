const { weights, natures } = require('../nature-config.json')

module.exports = {
    chooseNature(){
        let i;

        let weightsCopy = weights

        for(i = 1; i < weightsCopy.length; i++){
            weightsCopy[i] += weightsCopy[i-1]
        }

        let index = Math.floor(Math.random() * weightsCopy[weightsCopy.length - 1])

        for(i = 0; i < weightsCopy.length; i++)
            if(weightsCopy[i] > index)
                break

        return natures[i].name
    }
}
const ARMOR_TYPE_ANY = 0;
const ARMOR_TYPE_HEAD = 1;
const ARMOR_TYPE_BODY = 2;
const ARMOR_TYPE_ARMS = 3;
const ARMOR_TYPE_LEGS = 4;

const sortFields = [
    "physical",
    "strike",
    "slash",
    "pierce",
    "magic",
    "fire",
    "lightning",
    "holy",
    "poise",
    "immunity",
    "robustness",
    "focus",
    "vitality"
];

class armorOptimizer
{
    updateOnChange = true;  // Disabled temporarily when modifying input fields without user intervention

    configuration = {
        totalWeightMax: 40.64,
        selectedHead: -1,
        selectedBody: -1,
        selectedArms: -1,
        selectedLegs: -1,
        sort: 8,
        poiseMin: 15
    };

    sortBy({property})
    {
        return (a, b) =>
        {
            return b[property] - a[property];
        }
    }

    getArmorSetWeight(aSet)
    {
        let totalWeight = 0;

        for (const armorItem of aSet)
        {
            totalWeight += armorItem.weight;
        }

        return totalWeight;
    }

    testFindArmor()
    {
        armor.sort(this.sortBy({ property: sortFields[this.configuration.sort] }))

        let checkCountMax = 20;
        let armorCombinations = [];

        for (const baseArmorItem of armor)
        {
            let curCombination = [];

            curCombination.push(baseArmorItem);

            for (const checkArmorItem of armor)
            {

                if (
                    !curCombination.find(it => it.slotType === checkArmorItem.slotType) &&
                    (this.getArmorSetWeight(curCombination) + checkArmorItem.weight) <= this.configuration.totalWeightMax
                )
                {
                    curCombination.push(checkArmorItem);
                }

                if (curCombination.length >= 4)
                {
                    armorCombinations.push(curCombination);
                    break;
                }
            }

            if (armorCombinations.length >= checkCountMax)
            {
                console.log(armorCombinations);
                break;
            }

        }


    }

    initialize()
    {
        // this.contentElement = document.getElementById("outputDiv");

        // Later

        this.testFindArmor();


    }
}

var toolInstance = new armorOptimizer();

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

    sortBy({property, fallback})
    {
        return (a, b) =>
        {
            if (b[property] == a[property] && fallback != null)
                return b[fallback] - a[fallback];
            else
                return b[property] - a[property];
        }
    }

    sortByAggregate({property, fallback})
    {
        return (a, b) =>
        {
            let aTotal = this.getArrayPropertyTotal(b, property);
            let bTotal = this.getArrayPropertyTotal(a, property);

            if (aTotal == bTotal && fallback != null)
                return this.getArrayPropertyTotal(b, fallback) - this.getArrayPropertyTotal(a, fallback);
            else
                return this.getArrayPropertyTotal(b, property) - this.getArrayPropertyTotal(a, property);
        }
    }

    getArrayPropertyTotal(aSet, aProperty, aFallback)
    {
        let total = 0;

        for (const armorItem of aSet)
        {
            total += armorItem[aProperty];
        }

        return total;
    }

    testFindArmor()
    {
        armor.sort(this.sortBy({ property: sortFields[this.configuration.sort] }))

        let checkCountMax = 50000;
        let armorCombinations = [];

        for (const baseArmorItem of armor)
        {
            let curCombination = [];

            curCombination.push(baseArmorItem);

            for (const checkArmorItem of armor)
            {

                if (
                    !curCombination.find(it => it.slotType === checkArmorItem.slotType) &&
                    (this.getArrayPropertyTotal(curCombination, "weight") + checkArmorItem.weight) <= this.configuration.totalWeightMax
                )
                {
                    curCombination.push(checkArmorItem);
                }

                if (curCombination.length >= 4 && this.getArrayPropertyTotal(curCombination, "poise") >= this.configuration.poiseMin)
                {
                    armorCombinations.push(curCombination);
                    break;
                }
            }

            if (armorCombinations.length >= checkCountMax)
            {
                break;
            }

        }

        let output = "";
        let maxPoise = 0;


        armorCombinations.sort(this.sortByAggregate({ property: sortFields[this.configuration.sort], fallback: "physical"  }));

        for (const curCombination of armorCombinations)
        {
            let totalPoise = 0;
            let totalWeight = 0;
            curCombination.sort(this.sortBy({property: "slotType"}));
            for (const curArmor of curCombination)
            {
                output += `${curArmor.name}<br/>`
                totalPoise += curArmor.poise;
                totalWeight += curArmor.weight;
            }
            output += `Weight: ${totalWeight}<br/>`
            output += `Poise: ${totalPoise}<br/><br/>`
            maxPoise = Math.max(totalPoise, maxPoise);
        }



        output = `
        Total Combinations: ${armorCombinations.length}<br/>
        Max Poise: ${maxPoise}<br/><br/>
        ` + output;

        this.contentElement.innerHTML = output;

    }

    initialize()
    {
        this.contentElement = document.getElementById("outputDiv");

        // Later

        this.testFindArmor();


    }
}

var toolInstance = new armorOptimizer();

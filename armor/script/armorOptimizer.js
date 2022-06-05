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

const partNames = [
    "Head",
    "Body",
    "Arms",
    "Legs"
];

class armorOptimizer
{
    updateOnChange = true;  // Disabled temporarily when modifying input fields without user intervention

    configuration = {
        totalWeightMax: 40.64, // 40.64
        selectedHead: -1,
        selectedBody: -1,
        selectedArms: -1,
        selectedLegs: -1,
        poiseMin: 61,    // 61
        statPriority: {
            physical: 100,
            strike: 70,
            slash: 130,
            pierce: 110,
            magic: 100,
            fire: 65,
            lightning: 120,
            holy: 70,
            immunity: 0,
            robustness: 15,
            focus: 0,
            vitality: 0
        }
    };

    sortByPriority(propertyList)
    {
        return (a, b) =>
        {
            for (const curProperty of propertyList)
            {
                if(a[curProperty.name] != b[curProperty.name])
                {
                    if (curProperty.order == "desc")
                        return b[curProperty.name] - a[curProperty.name];
                    else
                        return a[curProperty.name] - b[curProperty.name];
                }
            }
            return 0;
        }
    }

    sortBy(property, fallback)
    {
        return (a, b) =>
        {
            if (b[property] == a[property] && fallback != null)
                return b[fallback] - a[fallback];
            else
                return b[property] - a[property];
        }
    }

    sortBySimple(aProperty)
    {
        return (a, b) =>
        {
            return b[aProperty] - a[aProperty];
        }
    }

    sortByAggregate(property, fallback, fallback2)
    {
        return (a, b) =>
        {
            const aTotal = this.getArrayPropertyTotal(a, property);
            const bTotal = this.getArrayPropertyTotal(b, property);

            let aTotalFB = 0;
            let bTotalFB = 0;

            if (aTotal == bTotal && fallback != null)
            {
                aTotalFB = this.getArrayPropertyTotal(b, fallback);
                bTotalFB = this.getArrayPropertyTotal(a, fallback);
            }

            if (aTotal != bTotal)
                return bTotal - aTotal;
            else if (fallback != null && aTotalFB != bTotalFB)
                return bTotalFB - aTotalFB;
            else if (fallback2 != null)
                return this.getArrayPropertyTotal(b, fallback2) - this.getArrayPropertyTotal(a, fallback2)
            else
                return 0;
        }
    }

    getArrayPropertyTotal(aSet, aProperty)
    {
        let total = 0;

        for (const arrayItem of aSet)
        {
            if (arrayItem != null)
                total += arrayItem[aProperty];
        }

        return total;
    }

    outputArmorList(aArmorSets)
    {
        let output = "";

        aArmorSets.sort(this.sortByAggregate("score", "poise"));
        aArmorSets.splice(20);
        for (const curCombination of aArmorSets)
        {
            curCombination.sort(this.sortBy("slotType")).reverse();

            const names = curCombination.reduce((a, b) => a + `<td>${b.name}</td>`, "");
            const weight = curCombination.reduce((a, b) => a + b.weight, 0).toPrecision(3);
            const [score, poise, immunity, robustness, focus, vitality] = this.getValueTotals(curCombination, ["score", "poise", "immunity", "robustness", "focus", "vitality"]);
            const negationFields = ["physical", "strike", "slash", "pierce", "magic", "fire", "lightning", "holy"];
            const negationCols = this.getNegationTotals(curCombination, negationFields).reduce((a, b) => a + `<td>${(100 - b).toFixed(3)}</td>`, "");

            output += `
                <tr>
                    ${names}
                    <td>${score.toFixed(3)}</td>
                    <td>${weight}</td>
                    <td>${poise}</td>
                    ${negationCols}
                    <td>${immunity}</td>
                    <td>${robustness}</td>
                    <td>${focus}</td>
                    <td>${vitality}</td>
                </tr>
            `;
        }

        this.contentElement.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Head</th>
                        <th>Body</th>
                        <th>Arms</th>
                        <th>Legs</th>
                        <th>Score</th>
                        <th>Weight</th>
                        <th>Poise</th>
                        <th>Physical</th>
                        <th>Strike</th>
                        <th>Slash</th>
                        <th>Pierce</th>
                        <th>Magic</th>
                        <th>Fire</th>
                        <th>Lightning</th>
                        <th>Holy</th>
                        <th>Immunity</th>
                        <th>Robustness</th>
                        <th>Focus</th>
                        <th>Vitality</th>
                    </tr>
                </thead>
                ${output}
            </table>
        `;
    }

    getValueTotals(pieces, propertyList)
    {
        const output = [];
        for (const curProperty of propertyList)
        {
            output.push(pieces.reduce((a, b) => a + b[curProperty], 0));
        }
        return output;
    }

    getNegationTotals(pieces, propertyList)
    {
        const output = [];
        for (const curProperty of propertyList)
        {
            output.push(pieces.reduce((a, b) => a * (1 - (b[curProperty] / 100)), 100));
        }
        return output;
    }

    getHighestSetValuesOptimal(objectList, propertyList, uniqueField, uniqueFieldEntries)
    {
        const pLength = propertyList.length;
        const outputList = Array(pLength).fill(0);
        for (const uniqueEntry of uniqueFieldEntries)
        {
            const filteredObjects = objectList.filter(e => e[uniqueField] == uniqueEntry);
            for (let i = 0; i < pLength; i++)
            {
                const curProperty = propertyList[i];
                outputList[i] += (filteredObjects.reduce((a, b) => Math.max(a, b[curProperty]), 0));
            }
        }
        return outputList;
    }

    findArmor()   // 182ms or so
    {
        const targetField = "score";
        const maxWeight = this.configuration.totalWeightMax;
        const uniqueField = "slotType";
        const highestSetValueProperties = [targetField, "poise"];

        for (const curPiece of armor)
        {
            let curScore = 0;
            for (const [stat, priority] of Object.entries(this.configuration.statPriority))
            {
                curScore += curPiece[stat] * (priority / 100);
            }
            curPiece.score = curScore;
            console.log(`${curScore}: ${curPiece.name}`);
        }

        armor.sort(this.sortBySimple(targetField));
        const armorCombinations = [];
        let highestValue = 0;
        const poiseMin = this.configuration.poiseMin
        const bodyList = armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_BODY && armorItem.weight <= maxWeight);
        const typeListLAH = [ARMOR_TYPE_LEGS, ARMOR_TYPE_ARMS, ARMOR_TYPE_HEAD];
        const typeListAH = [ARMOR_TYPE_ARMS, ARMOR_TYPE_HEAD];

        for (const bodyItem of bodyList)
        {
            const weightAfterBody = maxWeight - bodyItem.weight;
            const piecesAfterBody = armor.filter(armorItem => armorItem.slotType != ARMOR_TYPE_BODY && weightAfterBody - armorItem.weight >= 0);

            const [maxValueAfterBody, maxPoiseAfterBody] = this.getHighestSetValuesOptimal(piecesAfterBody, highestSetValueProperties, uniqueField, typeListLAH);
            if (maxPoiseAfterBody + bodyItem.poise < poiseMin || maxValueAfterBody + bodyItem[targetField] < highestValue)
                continue;

            const legList = piecesAfterBody.filter(armorItem => armorItem.slotType == ARMOR_TYPE_LEGS && weightAfterBody >= armorItem.weight);
            for (const legItem of legList)
            {
                const poiseAfterLeg = bodyItem.poise + legItem.poise;
                const valueAfterLeg = bodyItem[targetField] + legItem[targetField];
                const weightAfterLeg = weightAfterBody - legItem.weight;
                const piecesAfterLeg = piecesAfterBody.filter(armorItem => armorItem.slotType != ARMOR_TYPE_LEGS && weightAfterLeg - armorItem.weight >= 0);
                const [maxValueAfterLeg, maxPoiseAfterLeg] = this.getHighestSetValuesOptimal(piecesAfterLeg, highestSetValueProperties, uniqueField, typeListAH);
                if (maxPoiseAfterLeg + poiseAfterLeg < poiseMin || maxValueAfterLeg + valueAfterLeg < highestValue)
                    continue;

                const armList = piecesAfterLeg.filter(armorItem => armorItem.slotType == ARMOR_TYPE_ARMS && weightAfterLeg >= armorItem.weight);
                for (const armItem of armList)
                {
                    const weightAfterArm = weightAfterLeg - armItem.weight;
                    const poiseAfterArm = poiseAfterLeg + armItem.poise;
                    const valueAfterArm = valueAfterLeg + armItem[targetField];
                    const headList = piecesAfterLeg.filter(armorItem => armorItem.slotType == ARMOR_TYPE_HEAD && weightAfterArm >= armorItem.weight && poiseAfterArm + armorItem.poise >= poiseMin && armorItem[targetField] + valueAfterArm >= highestValue);
                    for (const headItem of headList)
                    {
                        const curValue = valueAfterArm + headItem[targetField];
                        if (curValue >= highestValue)
                        {
                            highestValue = curValue;
                            armorCombinations.push([bodyItem, legItem, headItem, armItem]);
                        }
                    }
                }
            }
        }
        this.outputArmorList(armorCombinations);
    }

    initialize()
    {
        this.contentElement = document.getElementById("outputDiv");
        document.getElementById("buttonFindArmor").addEventListener("click", this.findArmor.bind(this));
    }
}

var toolInstance = new armorOptimizer();
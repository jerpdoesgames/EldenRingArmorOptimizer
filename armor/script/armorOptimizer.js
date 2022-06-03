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
        sort: 0,
        poiseMin: 61    // 61
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

    sortBySimple(aProperty)
    {
        return (a, b) =>
        {
            return b[aProperty] - a[aProperty];
        }
    }

    sortByRatio({propertyA, propertyB, fallback})
    {
        return (a, b) =>
        {
            let aRatio = a[propertyA] / a[propertyB];
            let bRatio = b[propertyA] / b[propertyB];

            if (aRatio == bRatio)
                return b[fallback] - a[fallback];
            else
                return bRatio - aRatio;
        }
    }

    sortByAggregate({property, fallback, fallback2})
    {
        return (a, b) =>
        {
            let aTotal = this.getArrayPropertyTotal(a, property);
            let bTotal = this.getArrayPropertyTotal(b, property);

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

    testFindArmorRawBruteForce()    // 69000ms+
    {
        let headList = armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_HEAD);
        let bodyList = armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_BODY);
        let armList = armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_ARMS);
        let legList = armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_LEGS);

        let allCombinations = [];
        let highestValue = 0;
        let iterationCount = 0;

        for (const headItem of headList)
        {
            for (const bodyItem of bodyList)
            {
                for (const armItem of armList)
                {
                    for (const legItem of legList)
                    {
                        iterationCount++;

                        let curValue = this.getArrayPropertyTotal([headItem, bodyItem, armItem, legItem], sortFields[this.configuration.sort]);
                        let totalPoise = this.getArrayPropertyTotal([headItem, bodyItem, armItem, legItem], "poise");
                        let totalWeight = this.getArrayPropertyTotal([headItem, bodyItem, armItem, legItem], "weight");
                        if (
                            totalWeight <= this.configuration.totalWeightMax &&
                            curValue >= highestValue &&
                            totalPoise >= this.configuration.poiseMin
                        )
                        {
                            highestValue = Math.max(curValue, highestValue);
                            allCombinations.push([
                                headItem,
                                bodyItem,
                                armItem,
                                legItem
                            ]);
                        }

                    }
                }
            }
        }

        let outputPrefix = `Total Iterations: ${iterationCount}<br/>`;
        this.outputArmorList(allCombinations, outputPrefix)
    }

    outputArmorList(aArmorSets, aOutputPrefix = "")
    {
        let output = "";
        let maxPoise = 0;

        aArmorSets.sort(this.sortByAggregate({ property: sortFields[this.configuration.sort], fallback: "poise" }));
        for (let i = 0; i < aArmorSets.length && i < 20; i++)
        {
            let curCombination = aArmorSets[i];
            let totalPoise = 0;
            let totalWeight = 0;
            let totalValue = 0;
            curCombination.sort(this.sortBy({property: "slotType"}));
            for (const curArmor of curCombination)
            {
                let poiseWeight = curArmor.poise / curArmor.weight;
                let valueWeight = curArmor[sortFields[this.configuration.sort]] / curArmor.weight;
                output += `${curArmor.name} (${valueWeight} | ${poiseWeight})<br/>`
                totalPoise += curArmor.poise;
                totalWeight += curArmor.weight;
                totalValue += curArmor[sortFields[this.configuration.sort]];
            }
            output += `Weight: ${totalWeight}<br/>`
            output += `Value: ${totalValue}<br/>`
            output += `Poise: ${totalPoise}<br/><br/>`
            maxPoise = Math.max(totalPoise, maxPoise);
        }

        output = aOutputPrefix + `
        Total Combinations: ${aArmorSets.length}<br/>
        Max Poise: ${maxPoise}<br/><br/>
        ` + output;

        this.contentElement.innerHTML = output;
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

    testFindArmorReductiveBruteForce()   // 182ms or so
    {
        const targetField = sortFields[this.configuration.sort];
        const maxWeight = this.configuration.totalWeightMax;
        const uniqueField = "slotType";
        const highestSetValueProperties = [targetField, "poise"];
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
        let start = new Date();
        // this.testFindArmorRawBruteForce();
        this.testFindArmorReductiveBruteForce();
        let end = new Date();
        let duration = end - start;

        this.contentElement.innerHTML = `${duration}ms<br/><br/>` + this.contentElement.innerHTML;
    }
}

var toolInstance = new armorOptimizer();
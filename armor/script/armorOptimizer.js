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


    sortByPriority({ propertyList })
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
        let totalCombinations = 0;

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
                            totalCombinations++;
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

    testFindArmorReductiveBruteForce()   // 515-540ms
    {
        const targetField = sortFields[this.configuration.sort];
        // armor.sort(this.sortByRatio({ propertyA: sortFields[this.configuration.sort], propertyB: "poise" }));
        // armor.sort(this.sortBy({ property: "poise", fallback: targetField }));
        // armor.sort(this.sortByPriority({ propertyList: [ { name: "poise", order: "desc" }, { name: targetField, order: "desc" }, { name: "weight", order: "asc" } ] }));
        armor.sort(this.sortBy({ property: targetField, fallback: "poise" }));


        let iterationCount = 0;
        const checkCountMax = 500;
        let armorCombinations = [];
        let totalCombinations = 0;
        let highestValue = 0;

        const bodyList = armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_BODY && armorItem.weight <= this.configuration.totalWeightMax);

        for (const bodyItem of bodyList)
        {
            const weightAfterBody = this.configuration.totalWeightMax - bodyItem.weight;

            const piecesAfterBody = armor.filter(armorItem => armorItem.slotType != ARMOR_TYPE_BODY && weightAfterBody - armorItem.weight >= 0);
            const [maxValueAfterBody, maxPoiseAfterBody] = this.getHighestSetValues({ objectList: piecesAfterBody, propertyList: [targetField, "poise"], uniqueField: "slotType" });
            if (maxPoiseAfterBody + bodyItem.poise < this.configuration.poiseMin || maxValueAfterBody + bodyItem[targetField] < highestValue)
                continue;

                const legList = piecesAfterBody.filter(armorItem => armorItem.slotType == ARMOR_TYPE_LEGS && weightAfterBody - armorItem.weight >= 0);
            for (const legItem of legList)
            {
                const weightAfterLeg = weightAfterBody - legItem.weight;

                const piecesAfterLeg = piecesAfterBody.filter(armorItem => armorItem.slotType != ARMOR_TYPE_LEGS && weightAfterLeg - armorItem.weight >= 0);
                const [maxValueAfterLeg, maxPoiseAfterLeg] = this.getHighestSetValues({ objectList: piecesAfterLeg, propertyList: [targetField, "poise"], uniqueField: "slotType" });
                if (maxPoiseAfterLeg + bodyItem.poise + legItem.poise < this.configuration.poiseMin || maxValueAfterLeg + legItem[targetField] + bodyItem[targetField] < highestValue)
                    continue;

                    const headList = piecesAfterLeg.filter(armorItem => armorItem.slotType == ARMOR_TYPE_HEAD && weightAfterLeg - armorItem.weight >= 0);
                for (const headItem of headList)
                {
                    const weightAfterHead = weightAfterLeg - headItem.weight;

                    const poiseAfterHead = this.getArrayPropertyTotal([bodyItem, legItem, headItem], "poise");
                    const valueAfterHead = this.getArrayPropertyTotal([bodyItem, legItem, headItem], targetField);
                    const armList = armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_ARMS && weightAfterHead - armorItem.weight >= 0 && poiseAfterHead + armorItem.poise >= this.configuration.poiseMin && armorItem[targetField] + valueAfterHead >= highestValue);
                    for (const armItem of armList)
                    {
                        const curValue = valueAfterHead + armItem[targetField];
                        if (curValue >= highestValue)
                        {
                            const curCombination = [bodyItem, legItem, headItem, armItem];
                            highestValue = curValue;
                            armorCombinations.push(curCombination);
                            totalCombinations++;
                        }

                        iterationCount++;

                        if (totalCombinations >= checkCountMax)
                           break;
                    }

                    if (totalCombinations >= checkCountMax)
                       break;
                }

                if (totalCombinations >= checkCountMax)
                    break;
            }

            if (totalCombinations >= checkCountMax)
                break;
        }

        const outputPrefix = `Total Iterations: ${iterationCount}<br/>`;
        this.outputArmorList(armorCombinations, outputPrefix)
    }

    testfindArmorPathfinder() // 3-20ms sub-optimal result
    {
        armor.sort(this.sortBy({property: sortFields[this.configuration.sort], fallback: "physical"}));
        let headList = armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_HEAD);
        let bodyList = armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_BODY);
        let armList = armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_ARMS);
        let legList = armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_LEGS);

        let partIndex = [-1, -1, -1, -1];
        let partLists = [headList, bodyList, armList, legList]

        let iterationCount = 0;
        let iterationCountMax = 1000;

        let targetField = sortFields[this.configuration.sort];

        let curWeight = 0;
        let typeSort = [];
        for (const curArmor of armor)
        {
            if (typeSort.indexOf(curArmor.slotType) == -1)
                typeSort.push(curArmor.slotType);

            if (typeSort.length >= 4)
                break;
        }

        for (const curType of typeSort)
        {
            for (const curArmor of armor)
            {
                if (curArmor.slotType == curType && curArmor.weight + curWeight <= this.configuration.totalWeightMax)
                {
                    curWeight += curArmor.weight;
                    let curIndex = partLists[curType - 1].map(e => e.itemID).indexOf(curArmor.itemID);
                    partIndex[curType - 1] = curIndex;
                    break;
                }
            }
        }

        while (iterationCount < iterationCountMax)
        {
            let curValue = 0;

            for (let i = 0; i < 4; i++)
            {
                if (partIndex[i] >= 0)
                {
                    curWeight += partLists[i][partIndex[i]].weight;
                    curValue += partLists[i][partIndex[i]][sortFields[this.configuration.sort]];
                }

            }
            break;

            if (curWeight <= this.configuration.totalWeightMax)
            {
                // Find the biggest gain with the least overage?
                let biggestGainIndex = -1;

                for (let i = 0; i < partIndex.length; i++)
                {
                    // Isn't at the top of its list already
                    if (partIndex[i] > 0)
                    {
                        if (biggestGainIndex == -1)
                            biggestGainIndex = i;

                        let biggestGainPart = partLists[biggestGainIndex][partIndex[biggestGainIndex]];
                        let currentPart = partLists[i][partIndex[i]];

                        let biggestGainPartNext = partLists[biggestGainIndex][partIndex[biggestGainIndex] - 1];
                        let currentPartNext = partLists[i][partIndex[i] - 1];

                        if (
                            currentPartNext[targetField] > currentPart[targetField] &&
                            (currentPartNext[targetField] - currentPart[targetField]) <=
                            (biggestGainPartNext[targetField] - biggestGainPart[targetField])
                        )
                        {
                            biggestGainIndex = i;
                        }
                    }

                }
                // Find a lower weight variant of the least efficient piece
                if (biggestGainIndex > -1)
                {
                    partIndex[biggestGainIndex]--;
                }
                else
                {
                    break;
                }
            }
            else if (curWeight > this.configuration.totalWeightMax)
            {
                // Find the least efficient part that has a worse variant
                let leastEfficientIndex = -1;
                for (let i = 0; i < partIndex.length; i++)
                {
                    // Isn't at the bottom of its list already
                    if (partIndex[i] >= 0 && partIndex[i] < partLists[i].length - 1)
                    {
                        if (leastEfficientIndex == -1)
                            leastEfficientIndex = i;

                        let leastEfficientPart = partLists[leastEfficientIndex][partIndex[leastEfficientIndex]];
                        let currentPart = partLists[i][partIndex[i]];

                        let leastefficientpartRatio = leastEfficientPart[targetField] / leastEfficientPart.weight;
                        let currentPartRatio = currentPart[targetField] / currentPart.weight;

                        if (currentPartRatio < leastefficientpartRatio)
                        {
                            leastEfficientIndex = i;
                        }
                    }

                }

                // Find a lower weight variant of the least efficient piece
                if (leastEfficientIndex > -1)
                {
                    partIndex[leastEfficientIndex]++;
                }
            }

            iterationCount++;

        }

        let parts = [
            partLists[0][partIndex[0]],
            partLists[1][partIndex[1]],
            partLists[2][partIndex[2]],
            partLists[3][partIndex[3]],
        ];

        let totalWeight = this.getArrayPropertyTotal(parts, "weight");
        let totalValue = 0;
        let damageTaken = 100;
        for(const curPart of parts)
        {
            damageTaken = damageTaken * ((100 - curPart.physical) / 100);
        }

        totalValue = 100 - damageTaken;

        let partString = "";
        for (const curPart of parts)
        {
            if (curPart != null)
                partString += `${partNames[curPart.slotType - 1]}: ${curPart.name}<br/>`;
        }

        let output = `
            Iterations: ${iterationCount}<br/>
            Weight: ${totalWeight} / ${this.configuration.totalWeightMax}<br/>
            Value: ${totalValue}<br/>
            ${partString}
        `;

        this.contentElement.innerHTML = output;


    }

    testFindArmorMinPoiseHelper(aHeadList, aBodyList, aArmList, aLegList)
    {
        let validCombinations = [];
        let highestValue = 0;
        let iterationCount = 0;
        let iterationsAtOptimal = 0;

        for (const headItem of aHeadList)
        {
            for (const bodyItem of aBodyList)
            {
                for (const armItem of aArmList)
                {
                    for (const legItem of aLegList)
                    {
                        iterationCount++;

                        let curSet = [headItem, bodyItem, armItem, legItem];

                        let curValue = this.getArrayPropertyTotal(curSet, sortFields[this.configuration.sort]);
                        if (curValue >= highestValue)
                        {
                            let totalWeight = this.getArrayPropertyTotal(curSet, "weight");
                            if (totalWeight <= this.configuration.totalWeightMax)
                            {
                                let curPoise = this.getArrayPropertyTotal(curSet, "poise");
                                if (curPoise >= this.configuration.poiseMin)
                                {
                                    highestValue = Math.max(curValue, highestValue);

                                    validCombinations.push([
                                        headItem,
                                        bodyItem,
                                        armItem,
                                        legItem
                                    ]);
                                    iterationsAtOptimal = iterationCount;

                                    if (iterationCount == 24252493) // hack
                                    return [validCombinations, iterationCount, iterationsAtOptimal];
                                }
                            }
                        }
                    }
                }
            }
        }

        // This should be considered a failure state
        return [validCombinations, iterationCount, iterationsAtOptimal];
    }

    testfindArmorMinPoise()
    {
        // armor.sort(this.sortByRatio({propertyA: sortFields[this.configuration.sort], propertyB: "weight", fallback: "poise"}));
        // armor.sort(this.sortBy({fallback2: "weight", fallback: "poise", property: sortFields[this.configuration.sort]}));
        let sortProperties = [
            { name: "poise", order: "desc" },
            { name: "weight", order: "desc" },
            { name: sortFields[this.configuration.sort], order: "desc" },
        ];

        armor.sort(this.sortByPriority({ propertyList: sortProperties }))

        let headList = armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_HEAD);
        let bodyList = armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_BODY);
        let armList = armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_ARMS);
        let legList = armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_LEGS);

        let [validCombinations, totalIterations, iterationsAtOptimal] = this.testFindArmorMinPoiseHelper(headList, bodyList, armList, legList);

        validCombinations.sort(this.sortByAggregate({ property: sortFields[this.configuration.sort], fallback: "poise" }));

        let partString = "";

        for (const curCombination of validCombinations)
        {

            let totalValue = 0;
            let totalWeight = 0;
            let totalPoise = 0;
            for (const curPart of curCombination)
            {
                if (curPart != null)
                {
                    partString += `${partNames[curPart.slotType - 1]}: ${curPart.name}<br/>`;
                    totalValue += curPart[sortFields[this.configuration.sort]];
                    totalWeight += curPart.weight;
                    totalPoise += curPart.poise;
                }

            }
            partString += `
                ${sortFields[this.configuration.sort]}: ${totalValue}<br/>
                Poise: ${totalPoise}<br/>
                Weight: ${totalWeight}<br/>
            `;
            partString += "<br/>"
            break;
        }


        let output = `
            Valid Combinations: ${validCombinations.length}<br/>
            Iterations at Optimal: ${iterationsAtOptimal}<br/>
            Total Iterations: ${totalIterations}<br/><br/>
            ${partString}
        `;

        this.contentElement.innerHTML = output;

    }

    testFindArmorCrawler()
    {
        let validArmor = [];
        let validCombinations = [];

        validArmor = armor;
        validArmor.sort(this.sortBy({ property: sortFields[this.configuration.sort]}));

        for (const curPiece of validArmor)
        {
            let curArmorList = validArmor.slice();

            let curSet = [];
            curSet.push(curPiece);

            curArmorList = curArmorList.filter(armorItem => armorItem.slotType != curPiece.slotType);

            let stillLooking = true;
            while (curArmorList.length > 0 && stillLooking)
            {
                for (let armorIndex = 0; armorIndex < curArmorList.length; armorIndex++)
                {
                    let fillPiece = curArmorList[armorIndex];
                    let foundItem = false;

                    if (this.getArrayPropertyTotal(curSet, "weight") + fillPiece.weight <= this.configuration.totalWeightMax)
                    {
                        curSet.push(fillPiece);
                        foundItem = true;
                        for(let i = curArmorList.length - 1; i >= 0; i--)
                        {
                            if (curArmorList[i].slotType == fillPiece.slotType)
                            {
                                curArmorList.splice(i, 1);
                            }
                        }
                        break;
                    }

                    if (!foundItem)
                        stillLooking = false;

                }

            }

            if (this.getArrayPropertyTotal(curSet, "poise") >= this.configuration.poiseMin)
            {
                validCombinations.push(curSet);
            }
        }

        validCombinations.sort(this.sortByAggregate({ property: sortFields[this.configuration.sort], fallback: "poise" }));
        let totalCombinations = validCombinations.length;
        validCombinations = validCombinations.slice(0, 20);



        let partString = "";

        for (const curCombination of validCombinations)
        {
            let totalValue = 0;
            let totalWeight = 0;
            let totalPoise = 0;
            curCombination.sort(this.sortByPriority({propertyList: [ { name: "slotType", order: "asc" } ]}))
            for (const curPart of curCombination)
            {
                if (curPart != null)
                {
                    partString += `${partNames[curPart.slotType - 1]}: ${curPart.name}<br/>`;
                    totalValue += curPart[sortFields[this.configuration.sort]];
                    totalWeight += curPart.weight;
                    totalPoise += curPart.poise;
                }
            }

            partString += `
                ${sortFields[this.configuration.sort]}: ${totalValue}<br/>
                Poise: ${totalPoise}<br/>
                Weight: ${totalWeight}<br/>
            `;
            partString += "<br/>"
        }


        let output = `
            Valid Combinations: ${totalCombinations}<br/><br/>
            ${partString}
        `;

        this.contentElement.innerHTML = output;

    }


    testFindArmorTuner()
    {
        armor.sort(this.sortBy({ property: sortFields[this.configuration.sort], fallback: "weight"}));
        let partLists = [
            { list: armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_HEAD), index: 0 },
            { list: armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_BODY), index: 0 },
            { list: armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_ARMS), index: 0 },
            { list: armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_LEGS), index: 0 }
        ];

        let iterationCount = 0
        let iterationMax = 50000;

        while (iterationCount < iterationMax)
        {
            let curWeight = 0;
            for (const partData of partLists)
            {
                curWeight += partData.list[partData.index].weight;
            }

            // If weight is too high
            if (curWeight > this.configuration.totalWeightMax)
            {
                // Decrease the efficiency of the most efficient piece
                let maxEfficiency = -1;
                let maxEfficiencyIndex = -1;

                for (const [dataIndex, partData] of partLists.entries())
                {
                    if (partData.index < partData.list.length - 1)
                    {
                        let curPart = partData.list[partData.index];
                        let curEfficiency = curPart[sortFields[this.configuration.sort]] / curPart.weight;
                        if (maxEfficiencyIndex == -1 || curEfficiency > maxEfficiency)
                        {
                            maxEfficiencyIndex = dataIndex;
                            maxEfficiency = curEfficiency;
                        }

                        if (maxEfficiencyIndex != -1)
                        {
                            partLists[maxEfficiencyIndex].index++;
                        }
                    }
                }
            }
            else
            {
                // Increase efficiency with the least amount of overage
                let efficiencyInfo = [];

                for (const [dataIndex, partData] of partLists.entries())
                {
                    // if (partData.index <)
                }


                // Increase the efficiency of the least efficient piece (within weight)
                for (const [dataIndex, partData] of partLists.entries())
                {
                    if (partData.index > 0)
                    {
                        let curPart = partData.list[partData.index];
                        let curEfficiency = curPart[sortFields[this.configuration.sort]] / curPart.weight;

                        if (curWeight - curPart.weight + partData.list[partData.index - 1] <= this.configuration.totalWeightMax)
                        {
                            if (minEfficiencyIndex == -1 || curEfficiency < minEfficiency)
                            {
                                minEfficiencyIndex = dataIndex;
                                minEfficiency = curEfficiency;
                            }
                        }
                    }
                }





            }
            iterationCount++;
        }

        let parts = [];
        for (const partData of partLists)
        {
            parts.push(partData.list[partData.index]);
        }

        let totalWeight = this.getArrayPropertyTotal(parts, "weight");
        let totalValue = this.getArrayPropertyTotal(parts, sortFields[this.configuration.sort]);
        let totalPoise = this.getArrayPropertyTotal(parts, "poise");

        let partString = "";
        for (const curPart of parts)
        {
            if (curPart != null)
                partString += `${partNames[curPart.slotType - 1]}: ${curPart.name}<br/>`;
        }

        let output = `
            Iterations: ${iterationCount}<br/>
            Weight: ${totalWeight} / ${this.configuration.totalWeightMax}<br/>
            Value: ${totalValue}<br/>
            Poise: ${totalPoise}<br/>
            ${partString}
        `;

        this.contentElement.innerHTML = output;

        // console.log(partLists);
    }

    testFindArmorTuner2()
    {
        // Target value (fallback for poise).  Select initial pieces
        // If weight is too high, try to find equal part with same poise and lower weight (find biggest weight reduction)?
        // If weight is too high, try to find the minimal loss of poise in exchange for weight


            // If poise is too low, increase the poise of the least poise-efficient part
                // If weight can be increased,



        const targetField = sortFields[this.configuration.sort];
        armor.sort(this.sortBy({ property: targetField, fallback: "poise"}));
        let partLists = [
            { list: armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_HEAD) },
            { list: armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_BODY) },
            { list: armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_ARMS) },
            { list: armor.filter(armorItem => armorItem.slotType == ARMOR_TYPE_LEGS) }
        ];

        for (const partData of partLists)
        {
            partData.selected = partData.list[0];
        }

        let iterationCount = 0
        const iterationMax = 5000000;
        const maxWeight = this.configuration.totalWeightMax;
        let changeCount = 0;

        let curWeight = 0;
        let curPoise = 0;
        while (iterationCount < iterationMax)
        {

            curWeight = 0;
            curPoise = 0;
            let changeMade = false;
            for (const partData of partLists)
            {
                partData.poise = partData.selected.poise;
                partData.weight = partData.selected.weight;
                partData.value = partData.selected[targetField];
                curWeight += partData.weight;
                curPoise += partData.poise;
            }

            if (curWeight > maxWeight)
            {
                for (const partData of partLists)
                {
                    partData.changeIndex = 1;
                    partData.poiseLoss = 0;
                    partData.weightLoss = 0;

                    let selectedIndex = partData.list.map(e => e.itemID).indexOf(partData.selected.itemID);
                    if (selectedIndex < partData.list.length - 1)
                    {
                        let nextPart = partData.list[selectedIndex + 1];

                        partData.poiseLoss = partData.selected.poise - nextPart.poise;
                        partData.weightLoss = partData.selected.weight - nextPart.weight;
                        partData.changeIndex = 0;
                        partData.nextIndex = selectedIndex + 1;
                    }
                }
                partLists.sort(this.sortByPriority({ propertyList: [ { name: "changeIndex", order: "asc" }, { name: "poiseLoss", order: "desc" }, { name: "weightLoss", order: "asc" } ] }))

                for (const partData of partLists)
                {
                    if (partData.changeIndex == 0)
                    {
                        partData.selected = partData.list[partData.nextIndex];
                        changeCount++;
                        changeMade = true;
                        break;
                    }
                }
            }
            else
            {
                for (const partData of partLists)
                {
                    // Find items to swap to that retain >= target poise.  Sort these by value
                    let poiseWithoutCurrentPart = curPoise - partData.selected.poise;
                    let filteredList = partData.list.filter(armorItem => poiseWithoutCurrentPart + armorItem.poise >= this.configuration.poiseMin);

                    partData.changeIndex = 1;
                    partData.valueGain = 0;

                    if (filteredList.length > 0)
                    {
                        filteredList.sort(this.sortBy({property: targetField}));
                        partData.bestAlternative = filteredList[0];
                        partData.valueGain = partData.bestAlternative[targetField] - partData.selected[targetField];
                        partData.changeIndex = 0;
                    }
                }

                partLists.sort(this.sortByPriority({ propertyList: [ { name: "changeIndex", order: "asc" }, { name: "valueGain", order: "desc" } ] }))

                for (const partData of partLists)
                {
                    if (partData.changeIndex == 0)
                    {
                        partData.selected = partData.bestAlternative;
                        changeCount++;
                        changeMade = true;
                        break;
                    }
                }
            }

            if (!changeMade)
                break;

            iterationCount++;
        }

        console.log(partLists);
        console.log("weight: " + this.getArrayPropertyTotal(partLists, "weight"));
        console.log("value: " + this.getArrayPropertyTotal(partLists, "value"));
        console.log("poise: " + this.getArrayPropertyTotal(partLists, "poise"));
        console.log("iterations: " + iterationCount);
        console.log("changes: " + changeCount);

    }

    testFindArmorTuner3()
    {
        let iterationCount = 0
        const iterationMax = 5000;
        const maxWeight = this.configuration.totalWeightMax;
        const targetField = sortFields[this.configuration.sort];
        armor.sort(this.sortBy({ property: targetField, fallback: "poise"}));

        let selectedParts = [];

        for (const curPiece of armor)
        {
            let foundCount = 0;
            if (selectedParts.map(e => e.slotType).indexOf(curPiece.slotType) == -1)
            {
                selectedParts.push(curPiece);
                foundCount++;
            }
            if (foundCount >= 4)
                break;
        }

        while (iterationCount < iterationMax)
        {
            let curWeight = 0;
            let curPoise = 0;
            let curValue = 0;
            let selectedIDs = [];

            for (const curPiece of selectedParts)
            {
                selectedIDs.push(curPiece.itemID);
                curWeight += curPiece.weight;
                curPoise += curPiece.poise;
                curValue += curPiece[targetField];
            }

            if (curWeight > maxWeight)
            {
                let availablePieces = armor.filter(armorItem => selectedIDs.indexOf(armorItem.itemID) == -1 && selectedParts.find(it => it.slotType == armorItem.slotType).weight >= armorItem.weight);
                let pieceList = [];

                let valueLossMin = null;
                let valueLossMax = null;
                let poiseLossMin = null;
                let poiseLossMax = null;
                // Find lowest average loss per piece among poise, value
                for (const curPiece of availablePieces)
                {
                    let selectedPart = selectedParts.find(it => it.slotType == curPiece.slotType)
                    let curEntry = {
                        piece: curPiece,
                        valueLoss: selectedPart[targetField] - curPiece[targetField],
                        poiseLoss: selectedPart.poise - curPiece.poise,
                        weightLoss: selectedPart.weight - curPiece.weight,
                    };
                    pieceList.push(curEntry);

                    if (valueLossMin === null)
                    {
                        valueLossMin = curEntry.valueLoss;
                        valueLossMax = curEntry.valueLoss;
                    }
                    else
                    {
                        valueLossMin = Math.min(valueLossMin, curEntry.valueLoss);
                        valueLossMax = Math.max(valueLossMax, curEntry.valueLoss);
                    }

                    if (poiseLossMin === null)
                    {
                        poiseLossMin = curEntry.poiseLoss;
                        poiseLossMax = curEntry.poiseLoss;
                    }
                    else
                    {
                        poiseLossMin = Math.min(poiseLossMin, curEntry.poiseLoss);
                        poiseLossMax = Math.max(poiseLossMax, curEntry.poiseLoss);
                    }
                }

                if (pieceList.length > 0)
                {
                    for(const curChoice of pieceList)
                    {
                        curChoice.poiseLossRatio = curChoice.poiseLoss / (poiseLossMax - poiseLossMin);
                        curChoice.valueLossRatio = curChoice.valueLoss / (valueLossMax - valueLossMin);
                        curChoice.averageLossRatio = (curChoice.poiseLossRatio + curChoice.valueLossRatio) / 2;
                        curChoice.weight = curChoice.piece.weight;
                    }

                    pieceList.sort(this.sortByPriority({ propertyList: [ { name: "weightLoss", "order": "desc"},  { name: "averageLossRatio", order: "asc" } ] }))

                    let replacement = pieceList[0];
                    let replaceIndex = selectedParts.map(e => e.slotType).indexOf(replacement.piece.slotType);
                    console.log("replace " + selectedParts[replaceIndex].name + " with " + replacement.piece.name);
                    selectedParts[replaceIndex] = replacement.piece;
                }
            }
            else
            {

                let removeWeightGain = [];
                for(const curPart of selectedParts)
                {
                    let availableWeight = maxWeight - curWeight + curPart.weight;

                    removeWeightGain.push({ slotType: curPart.slotType, usableWeight: availableWeight });

                    // Would removing any given part give a better choice in any slot?
                }

                for(const removeOption in removeWeightGain)
                {
                    let availablePieces = armor.filter(armorItem => armorItem.weight <= removeOption.usableWeight);
                    console.log("pieces if whatever: " + availablePieces.length);
                    break;
                    let validOptions = [];

                    let valueLossMin = null;
                    let valueLossMax = null;
                    let poiseLossMin = null;
                    let poiseLossMax = null;


                }

                console.log(removeWeightGain);


                let pieceList = [];

                // for each weight freed value, is there a suitable replacement?
                console.log(`Weight reached: ${curWeight}/${maxWeight}`);
                console.log(`Poise: ${curPoise}`);
                console.log(`Value: ${curValue}`);
                break;
            }



            // Weight first
            // Minimum Poise second
            // Maximum value third


            iterationCount++;
        }


        console.log(iterationCount);
        console.log(selectedParts);
    }


    getHighestSetValues({objectList, propertyList, uniqueField})
    {
        let outputList = [];
        let uniqueFieldEntries = new Set(objectList.map(e => e[uniqueField]));

        for (const curProperty of propertyList)
        {
            let curValue = 0;
            for (const uniqueEntry of uniqueFieldEntries)
            {
                curValue += objectList.filter(e => e[uniqueField] == uniqueEntry).map(e => e[curProperty]).reduce((a, b) => Math.max(a, b));
            }
            outputList.push(curValue);
        }

        return outputList;
    }

    testFindArmorReductive()
    {
        let iterationCount = 0
        const iterationMax = 50000;
        const maxWeight = this.configuration.totalWeightMax;
        const targetField = sortFields[this.configuration.sort];
        armor.sort(this.sortBy({ property: targetField, fallback: "poise"}));

        let curWeight = 0;
        let highestValue = 0;
        let curPoise = 0;

        let armorIndex = 0;


        const [maxValue, maxPoise] = this.getHighestSetValues({ objectList: armor, propertyList: [targetField, "poise"], uniqueField: "slotType" });
        console.log(maxValue);
        console.log(maxPoise);
        return;

        while(iterationCount < iterationMax && armorIndex < armor.length)
        {

            let curArmorList = armor.slice();

            if (armorIndex > armor.length)
                armorIndex = 0;

            let basePiece = armor[armorIndex];
            curArmorList = curArmorList.filter(armorItem => armorItem.itemID != basePiece.itemID);
            let curMaxValue = 0;

            while(iterationCount < iterationMax && curArmorList.length > 0)
            {



                iterationCount++
            }

            if (curPoise >= this.configuration.poiseMin && curMaxValue < highestValue)
                break;

            armorIndex++;


        }

        // this.outputArmorList([selectedParts]);

    }

    initialize()
    {
        this.contentElement = document.getElementById("outputDiv");

        // this.testFindArmorRawBruteForce(); // SLOW/Perfect
        // this.testFindArmorReductiveBruteForce(); // Fast/Perfect

        let start = new Date();
        this.testFindArmorReductive();
        let end = new Date();
        let duration = end - start;

        this.contentElement.innerHTML = `${duration}ms<br/><br/>` + this.contentElement.innerHTML;
    }
}

var toolInstance = new armorOptimizer();
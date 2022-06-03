const ARMOR_TYPE_HEAD = 1;
const ARMOR_TYPE_BODY = 2;
const ARMOR_TYPE_ARMS = 3;
const ARMOR_TYPE_LEGS = 4;

let highestValue = 0;

function getArrayPropertyTotal(aSet, aProperty)
{
    let total = 0;

    for (const arrayItem of aSet)
    {
        if (arrayItem != null)
            total += arrayItem[aProperty];
    }

    return total;
}

function getHighestSetValues({objectList, propertyList, uniqueField})
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

onmessage = function(e) {

    if (e.data.messageType == 0) // Update highest value
    {
        highestValue = e.data.highestValue;
    }
    else if (e.data.messageType == 1) // Received workload
    {
        const bodyItem = e.data.bodyItem;
        const legItem = e.data.legItem;
        const armItem = e.data.armItem;
        const targetField = e.data.targetField;
        highestValue = e.data.highestValue;
        const poiseMin = e.data.poiseMin;
        const piecesAfterLeg = e.data.piecesAfterLeg;
        const weightAfterLeg = e.data.weightAfterLeg;

        const weightAfterArm = weightAfterLeg - armItem.weight;
        const poiseAfterArm = this.getArrayPropertyTotal([bodyItem, legItem, armItem], "poise");
        const valueAfterArm = this.getArrayPropertyTotal([bodyItem, legItem, armItem], targetField);
        const headList = piecesAfterLeg.filter(armorItem => armorItem.slotType == ARMOR_TYPE_HEAD && weightAfterArm - armorItem.weight >= 0 && poiseAfterArm + armorItem.poise >= poiseMin && armorItem[targetField] + valueAfterArm >= highestValue);

        for (const headItem of headList)
        {
            const curValue = valueAfterArm + headItem[targetField];
            if (curValue >= highestValue)
            {
                this.postMessage({
                    combination: [bodyItem, legItem, armItem, headItem],
                    highestValue: curValue,
                    success: true,
                    workerIndex: e.data.workerIndex
                })
            }
        }
    }

    this.postMessage({success: false});
}
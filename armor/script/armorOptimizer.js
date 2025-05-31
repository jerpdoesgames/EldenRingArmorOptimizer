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

const emptyHeadItem = {
    "name": "[Empty Slot]",
    "itemID": -2,
    "setID": -1,
    "slotType": ARMOR_TYPE_HEAD,
    "weight": 0,
    "poise": 0,
    "physical": 0,
    "strike": 0,
    "slash": 0,
    "pierce": 0,
    "magic": 0,
    "fire": 0,
    "lightning": 0,
    "holy": 0,
    "immunity": 0,
    "robustness": 0,
    "focus": 0,
    "vitality": 0
};

const emptyBodyItem = {
    "name": "[Empty Slot]",
    "itemID": -3,
    "setID": -1,
    "slotType": ARMOR_TYPE_BODY,
    "weight": 0,
    "poise": 0,
    "physical": 0,
    "strike": 0,
    "slash": 0,
    "pierce": 0,
    "magic": 0,
    "fire": 0,
    "lightning": 0,
    "holy": 0,
    "immunity": 0,
    "robustness": 0,
    "focus": 0,
    "vitality": 0
};

const emptyArmsItem = {
    "name": "[Empty Slot]",
    "itemID": -4,
    "setID": -1,
    "slotType": ARMOR_TYPE_ARMS,
    "weight": 0,
    "poise": 0,
    "physical": 0,
    "strike": 0,
    "slash": 0,
    "pierce": 0,
    "magic": 0,
    "fire": 0,
    "lightning": 0,
    "holy": 0,
    "immunity": 0,
    "robustness": 0,
    "focus": 0,
    "vitality": 0
};

const emptyLegsItem = {
    "name": "[Empty Slot]",
    "itemID": -5,
    "setID": -1,
    "slotType": ARMOR_TYPE_LEGS,
    "weight": 0,
    "poise": 0,
    "physical": 0,
    "strike": 0,
    "slash": 0,
    "pierce": 0,
    "magic": 0,
    "fire": 0,
    "lightning": 0,
    "holy": 0,
    "immunity": 0,
    "robustness": 0,
    "focus": 0,
    "vitality": 0
};


class armorOptimizer
{
    updateOnChange = true;  // Disabled temporarily when modifying input fields without user intervention

    configuration = {
        totalWeightMax: 90.0,
        equippedWeight: 21.7,
        targetWeightPercent: 70,
        allowEmptySlots: false,
        selectedHead: -1,
        selectedBody: -1,
        selectedArms: -1,
        selectedLegs: -1,
        poiseMin: 68,   // Straightsword 1HR1
        statPriority: {
            physical: 90,
            strike: 65,
            slash: 120,
            pierce: 105,
            magic: 110,
            fire: 65,
            lightning: 120,
            holy: 70,
            immunity: 0,
            robustness: 20,
            focus: 0,
            vitality: 0
        },
        disabledItems : []  // Only used for saving/loading configuration (enabled/disabled is stored per piece when running the optimizer)
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

    sortLexical(aProperty)
    {
        return (a, b) =>
        {
            return b[aProperty] < a[aProperty] ? -1 : 1;
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
        if (aArmorSets.length > 0)
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
                <table id="armorResultList">
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
        else
        {
            this.contentElement.innerHTML = `<p class="mainDescription failureMessage">No armor found!  Try selecting different armor or loosening the weight/poise requirements.</p>`;
        }

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

    toggleArmorEnabled(aArmorID)
    {
        const tempArmorList = armor.slice();
        tempArmorList.push(emptyHeadItem);
        tempArmorList.push(emptyBodyItem);
        tempArmorList.push(emptyArmsItem);
        tempArmorList.push(emptyLegsItem);

        const armorItem = tempArmorList.find(e => e.itemID == aArmorID);

        if (armorItem != undefined)
        {
            if (armorItem.hasOwnProperty("enabled"))
            {
                armorItem.enabled = !armorItem.enabled;
            }
            else
            {
                armorItem.enabled = false;
            }
        }

        this.populateItemList();
    }

    closeArmorSelection()
    {
        this.mainBodyElement.style.display = "block";
        this.armorListElement.style.display = "none";
    }

    openArmorSelection()
    {
        this.mainBodyElement.style.display = "none";
        this.armorListElement.style.display = "block";
    }

    getArmorSelectColumn(aArmorItem)
    {
        if (aArmorItem != null)
        {
            const enabledString = aArmorItem.enabled !== false ? "": " disabledArmor";
            return `<td id="selectArmorID${aArmorItem.itemID}" class="armorItemEntry${enabledString}" style="cursor:pointer;" onclick="toolInstance.toggleArmorEnabled(${aArmorItem.itemID})">${aArmorItem.name}</td>`;
        }
        else
        {
            return "<td></td>";
        }
    }

    getArmorSelectRow(aCurSet)
    {
        let headItem;
        let bodyItem;
        let armItem;
        let legItem;

        for (const armorItem of aCurSet)
        {
            switch(armorItem.slotType)
            {
                case ARMOR_TYPE_HEAD:
                    headItem = armorItem;
                    break;
                case ARMOR_TYPE_BODY:
                    bodyItem = armorItem;
                    break;
                case ARMOR_TYPE_ARMS:
                    armItem = armorItem;
                    break;
                case ARMOR_TYPE_LEGS:
                    legItem = armorItem;
                    break;
            }
        }

        let output = "";
        for (const curSetItem of [headItem, bodyItem, armItem, legItem])
        {
            output += this.getArmorSelectColumn(curSetItem);
        }

        return `<tr>${output}</tr>`;
    }

    enableAllArmor()
    {
        const tempArmorList = armor.slice();
        tempArmorList.push(emptyHeadItem);
        tempArmorList.push(emptyBodyItem);
        tempArmorList.push(emptyArmsItem);
        tempArmorList.push(emptyLegsItem);

        for (const armorItem of tempArmorList)
        {
            armorItem.enabled = true;
        }
        this.populateItemList();
    }

    disableAllArmor()
    {
        const tempArmorList = armor.slice();
        tempArmorList.push(emptyHeadItem);
        tempArmorList.push(emptyBodyItem);
        tempArmorList.push(emptyArmsItem);
        tempArmorList.push(emptyLegsItem);

        for (const armorItem of tempArmorList)
        {
            armorItem.enabled = false;
        }
        this.populateItemList();
    }

    onStatPriorityChange(aEvent)
    {
        let statName = aEvent.target.id;
        this.configuration.statPriority[statName] = parseInt(aEvent.target.value);
    }

    onMaxWeightChange(aEvent)
    {
        this.configuration.totalWeightMax = parseFloat(aEvent.target.value);
    }

    onEquippedWeightChange(aEvent)
    {
        this.configuration.equippedWeight = parseFloat(aEvent.target.value);
    }

    onWeightPercentChange(aEvent)
    {
        this.configuration.targetWeightPercent = parseInt(aEvent.target.value);
    }

    onPoiseChange(aEvent)
    {
        this.configuration.poiseMin = parseInt(aEvent.target.value);
    }

    onAllowEmptySlotsChange(aEvent)
    {
        this.configuration.allowEmptySlots = aEvent.target.checked;
    }

    onHeadSelected(aEvent)
    {
        this.configuration.selectedHead = parseInt(aEvent.target.value);
    }

    onBodySelected(aEvent)
    {
        this.configuration.selectedBody = parseInt(aEvent.target.value);
    }

    onArmsSelected(aEvent)
    {
        this.configuration.selectedArms = parseInt(aEvent.target.value);
    }

    onLegsSelected(aEvent)
    {
        this.configuration.selectedLegs = parseInt(aEvent.target.value);
    }

    populateForceArmorList(aListElement, aSlotType, aSelectedID)
    {
        const entryList = armor.filter(armorItem => armorItem.slotType == aSlotType);

        switch(aSlotType)
        {
            case ARMOR_TYPE_HEAD:
                entryList.unshift(emptyHeadItem);
                break;
            case ARMOR_TYPE_BODY:
                entryList.unshift(emptyBodyItem);
                break;
            case ARMOR_TYPE_ARMS:
                entryList.unshift(emptyArmsItem);
                break;
            case ARMOR_TYPE_LEGS:
                entryList.unshift(emptyLegsItem);
                break;
        }

        entryList.unshift({ itemID: -1, name: "[Any]" });

        let output = "";
        for (const armorItem of entryList)
        {
            let selectedString = (aSelectedID == armorItem.itemID) ? " selected" : "";
            output += `<option value="${armorItem.itemID}"${selectedString}>${armorItem.name}</option>`;
        }
        aListElement.innerHTML = output;
    }

    populateForceArmorSelections()
    {
        armor.sort(this.sortLexical("name"));
        armor.reverse();
        this.populateForceArmorList(document.getElementById("armorForceHead"), ARMOR_TYPE_HEAD, this.configuration.selectedHead);
        this.populateForceArmorList(document.getElementById("armorForceBody"), ARMOR_TYPE_BODY, this.configuration.selectedBody);
        this.populateForceArmorList(document.getElementById("armorForceArms"), ARMOR_TYPE_ARMS, this.configuration.selectedArms);
        this.populateForceArmorList(document.getElementById("armorForceLegs"), ARMOR_TYPE_LEGS, this.configuration.selectedLegs);
    }

    populateItemList()
    {
        let output = "";
        const selectableArmorList = armor.slice();
        selectableArmorList.push(emptyHeadItem);
        selectableArmorList.push(emptyBodyItem);
        selectableArmorList.push(emptyArmsItem);
        selectableArmorList.push(emptyLegsItem);
        selectableArmorList.sort(this.sortByPriority([{name: "itemID", order: "asc"}, {name: "setID", order: "asc"}, {name: "slotType", order: "asc"}]))
        let lastSetId = -1;
        let curRowTypes = [];
        let curRowItems = [];
        for (const armorItem of selectableArmorList)
        {
            if (curRowTypes.indexOf(armorItem.slotType) != -1 || lastSetId != armorItem.setID)
            {
                lastSetId = -1;
                curRowTypes = [];
                output += this.getArmorSelectRow(curRowItems);
                curRowItems = [];
            }

            curRowTypes.push(armorItem.slotType);
            curRowItems.push(armorItem);
            lastSetId = armorItem.setID;
        }

        if (curRowItems.length > 0)
        {
            output += this.getArmorSelectRow(curRowItems);
        }

        this.armorListBodyElements.innerHTML = output;
    }

    findArmor()   // 182ms or so
    {
        const targetField = "score";
        const maxWeight = (this.configuration.totalWeightMax * (this.configuration.targetWeightPercent / 100)) - this.configuration.equippedWeight;
        const uniqueField = "slotType";
        const allowEmptySlots = this.configuration.allowEmptySlots;
        const highestSetValueProperties = [targetField, "poise"];

        const selectedHead = this.configuration.selectedHead;
        const selectedBody = this.configuration.selectedBody;
        const selectedArms = this.configuration.selectedArms;
        const selectedLegs = this.configuration.selectedLegs;

        const armorSearchList = armor.slice();
        if (allowEmptySlots || selectedHead == -2) { armorSearchList.push(emptyHeadItem) };
        if (allowEmptySlots || selectedBody == -3) { armorSearchList.push(emptyBodyItem) };
        if (allowEmptySlots || selectedArms == -4) { armorSearchList.push(emptyArmsItem) };
        if (allowEmptySlots || selectedLegs == -5) { armorSearchList.push(emptyLegsItem) };

        for (const curPiece of armorSearchList)
        {
            let curScore = 0;
            for (const [stat, priority] of Object.entries(this.configuration.statPriority))
            {
                curScore += curPiece[stat] * (priority / 100);
            }
            curPiece.score = curScore;
        }

        armorSearchList.sort(this.sortBySimple(targetField));
        const armorCombinations = [];
        let highestValue = 0;
        const poiseMin = this.configuration.poiseMin
        const bodyList = armorSearchList.filter(armorItem => armorItem.slotType == ARMOR_TYPE_BODY && ((selectedBody == -1 && armorItem.enabled !== false) || selectedBody == armorItem.itemID) && armorItem.weight <= maxWeight);
        const typeListLAH = [ARMOR_TYPE_LEGS, ARMOR_TYPE_ARMS, ARMOR_TYPE_HEAD];
        const typeListAH = [ARMOR_TYPE_ARMS, ARMOR_TYPE_HEAD];

        for (const bodyItem of bodyList)
        {
            const weightAfterBody = maxWeight - bodyItem.weight;
            const piecesAfterBody = armorSearchList.filter(armorItem => armorItem.slotType != ARMOR_TYPE_BODY && weightAfterBody - armorItem.weight >= 0);

            const [maxValueAfterBody, maxPoiseAfterBody] = this.getHighestSetValuesOptimal(piecesAfterBody, highestSetValueProperties, uniqueField, typeListLAH);
            if (maxPoiseAfterBody + bodyItem.poise < poiseMin || maxValueAfterBody + bodyItem[targetField] < highestValue)
                continue;

            const legList = piecesAfterBody.filter(armorItem => armorItem.slotType == ARMOR_TYPE_LEGS && ((selectedLegs == -1 && armorItem.enabled !== false) || selectedLegs == armorItem.itemID) && weightAfterBody >= armorItem.weight);
            for (const legItem of legList)
            {
                const poiseAfterLeg = bodyItem.poise + legItem.poise;
                const valueAfterLeg = bodyItem[targetField] + legItem[targetField];
                const weightAfterLeg = weightAfterBody - legItem.weight;
                const piecesAfterLeg = piecesAfterBody.filter(armorItem => armorItem.slotType != ARMOR_TYPE_LEGS && weightAfterLeg - armorItem.weight >= 0);
                const [maxValueAfterLeg, maxPoiseAfterLeg] = this.getHighestSetValuesOptimal(piecesAfterLeg, highestSetValueProperties, uniqueField, typeListAH);
                if (maxPoiseAfterLeg + poiseAfterLeg < poiseMin || maxValueAfterLeg + valueAfterLeg < highestValue)
                    continue;

                const armList = piecesAfterLeg.filter(armorItem => armorItem.slotType == ARMOR_TYPE_ARMS && ((selectedArms == -1 && armorItem.enabled !== false) || selectedArms == armorItem.itemID) && weightAfterLeg >= armorItem.weight);
                for (const armItem of armList)
                {
                    const weightAfterArm = weightAfterLeg - armItem.weight;
                    const poiseAfterArm = poiseAfterLeg + armItem.poise;
                    const valueAfterArm = valueAfterLeg + armItem[targetField];
                    const headList = piecesAfterLeg.filter(armorItem => armorItem.slotType == ARMOR_TYPE_HEAD && ((selectedHead == -1 && armorItem.enabled !== false) || selectedHead == armorItem.itemID) && weightAfterArm >= armorItem.weight && poiseAfterArm + armorItem.poise >= poiseMin && armorItem[targetField] + valueAfterArm >= highestValue);
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
        this.armorListElement = document.getElementById("armorSelector");
        this.mainBodyElement = document.getElementById("mainContent");
        this.armorListBodyElements = document.getElementById("armorSelectListEntries");
        document.getElementById("buttonFindArmor").addEventListener("click", this.findArmor.bind(this));

        document.getElementById("armorForceHead").addEventListener("change", this.onHeadSelected.bind(this));
        document.getElementById("armorForceBody").addEventListener("change", this.onBodySelected.bind(this));
        document.getElementById("armorForceArms").addEventListener("change", this.onArmsSelected.bind(this));
        document.getElementById("armorForceLegs").addEventListener("change", this.onLegsSelected.bind(this));

        this.maxWeightElement = document.getElementById("maxWeight");
        this.maxWeightElement.addEventListener("change", this.onMaxWeightChange.bind(this));
        this.maxWeightElement.value = this.configuration.totalWeightMax;

        this.equippedWeightElement = document.getElementById("equippedWeight");
        this.equippedWeightElement.addEventListener("change", this.onEquippedWeightChange.bind(this));
        this.equippedWeightElement.value = this.configuration.equippedWeight;

        this.weightPercentElement = document.getElementById("weightPercent");
        this.weightPercentElement.addEventListener("change", this.onWeightPercentChange.bind(this));
        this.weightPercentElement.value = this.configuration.targetWeightPercent;

        this.poiseElement = document.getElementById("poise");
        this.poiseElement.addEventListener("change", this.onPoiseChange.bind(this));
        this.poiseElement.value = this.configuration.poiseMin;

        this.allowEmptySlotsElement = document.getElementById("allowEmptySlots");
        this.allowEmptySlotsElement.addEventListener("change", this.onAllowEmptySlotsChange.bind(this));
        this.allowEmptySlotsElement.checked = this.configuration.allowEmptySlots;

        for (const [statName, statValue] of Object.entries(this.configuration.statPriority))
        {
            const statElement = document.getElementById(statName);
            statElement.value = statValue;
            statElement.addEventListener("change", this.onStatPriorityChange.bind(this));
        }

        this.populateForceArmorSelections();
        this.populateItemList();
    }
}

var toolInstance = new armorOptimizer();

// Hacky VH business.
// - for the URL bar appearing/disappearing as you scroll up/down on mobile
window.addEventListener('resize', () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--calculatedVH', `${vh}px`);
});
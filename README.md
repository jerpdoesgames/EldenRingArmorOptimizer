# EldenRingArmorOptimizer
A web app finding the best armor for Elden Ring builds based on desired weight and negation/resistances.

[Click here for the current live version of the tool](https://jerp.tv/eldenring/armor/)

## How to Use:

1. Enter in the Maximum Equip Load for your character as determined by your stats and anything that increases it (Great-Jar's Arsenal, etc.).
2. Enter your Equipped Item Weight, which includes anything you have equipped EXCEPT armor.  Simplest way to get this is to equip the heaviest items you plan to use and then ensure your armor slots are empty.
3. Enter your Desired Weight Percentage - basically how much of your Maximum Equip Load you plan to use.  70% is the threshold for Medium Rolls (go beyond that and you'll become Heavy and will have much slower rolls).
4. Enter your minimum poise.  Everyone has their own personal peference for this based on what weapons they might be hit with, but 51 covers many small to mid-sized weapons.

## Optional Stuff:

* The Negation Priority fields let you specify which damage types you're most interested in reducing.
* The Resistance Priority Fields let you specify which status effects you're most interested in preventing.
* Setting any of these values to 0 lets you skip considering that Negation or Resistance.

Each point of Negation and Resistance on each piece of armor is multiplied by those priority values to come up with a score.  Armor pieces with higher scores (that fit within your Poise and Equip Weight settings) will be sorted higher in the list.


# My Other Tools

* **[Casting Tool Comparator](https://jerp.tv/eldenring/spelltools/)** (Enter in your desired stats and compare how each Staff and Seal performs relative to each other.)
* **[Spell Comparator](https://jerp.tv/eldenring/spells/)** (Compare AR, Damage, and FP Efficiency for offensive spells.)
* **[Rune Level Calculator](https://jerp.tv/eldenring/runes/)** (Find out the level of the player who died based on how many runes you received.)

# Credits

* This tool is inspired by the legendary work by [MugenMonkey](https://mugenmonkey.com) on various Build Planner, Starting Class Optimizer, Armor Optimizer, etc. tools for the Souls games.
* This tool uses data-mined information provided by [TarnishedSpreadsheet](https://www.reddit.com/user/tarnishedspreadsheet)
* Please be sure to check the [Contributors List](https://github.com/jerpdoesgames/EldenRingArmorOptimizer/graphs/contributors) to see who've been submitting changes on **GitHub**.

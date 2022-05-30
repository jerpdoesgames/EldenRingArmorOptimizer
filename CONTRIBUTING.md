# EldenRingSpellComparer Contribution Guidelines

The general goal behind this app is to be quick to load, highly responsive, and (most importantly) provide a limited set of highly-usable data.

## Technical Aspects

* No/Minimal external dependencies
  * Would like to avoid significant increases to the file size of the tool without gaining equally significant increases in functionality.
* Tool is developed in pure Javascript for simplicity (no jQuery, TypesScript, etc.)
* Minimal binary assets to reduce load times and bandwidth usage (no/minimal images).
* No browser/device-specific behavior.

## User Experience

* Mobile-Friendly - should be convenient to load/interact with on a phone/tablet.
  * Fonts should have reasonable size/clarity on small screens
  * Ease of touch interaction / no small buttons or links
  * No/minimal reliance on hover tooltips
  * App should be accessible as a single page / should not need to be broken up into multiple tabs
* Responsive design (should adapt to a variety of viewports automatically, with no/minimal hardcoded exceptions).
* Strike the balance of having enough highly-useful data to help users make beneficial decisions without overwhelming them with too much overly-detailed information that they may not understand or know how to utilize.
* Minimize how many hidden/optional/advanced features a user may need to fumble with, while still providing enough control to generate the data they want.

## Jerp's contribution to the project

As this is a hobby project and not a job, it's likely that I'm going to focus on feature implementation more than the cleanest/most efficient code.  This will especially be the case when there isn't a significant impact on performance/maintainability and doesn't have any user-facing issues.

Also, my Javascript knowledge is probably 10+ years old at this point.  While I'm happy to learn as I go, I'm struggling to find any real time to dedicate to that.

That being said, I'm happy to accept contributions to help clean up and optimize code - with a preference for maintaining readability as much as possible.
#Bubble Trouble _Reloaded_

The new bubble trouble is awful. The old game mechanics are missing, and the graphics make me want to vomit. This is my attempt in recreating the game that I once loved. I'll be using this page to log my progress.

## Changelog

Features:

* Namespaced connection to allow multiple game instances
* Splash screen and game creation step
* Players can die

Bug fixes:

* Smoothed animation by drawing player every frame based on time delta, rather than user input
* Line doesn't reset before touching the ball
* Deleting ball no longer throws undefined
* No more player teleportation when `j` is held down on fire
* Spear now collides if any part is touched

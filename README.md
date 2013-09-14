#Bubble Trouble _Reloaded_

The new bubble trouble is awful. The old game mechanics are missing, and the graphics make me want to vomit. This is my attempt in recreating the game that I once loved. I'll be using this page to log my progress.

###Todo
* Improve client / server sync
* Sound manager
* Sprite manager
* Level manager
* Improve server side socket interface 
* Write a better router for serving static files
* Splash screen, login screen, game room

###Updates

8/18
- Refactored the file handler to not use a bajillion if statements. I wonder how Connect does its static file handling.
9/10
- Added a basic sound manager.
9/13
- Smoothed animation by drawing player every frame based on time delta, rather than user input.

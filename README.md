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

9/24
- Added splash screen and game creation step
- Namespace connection as first step towards running multiple game instances

9/29
- Moved namespaced socket connection into the game object
- Fixed issue where the first client falls out of sync due to delayed game update

10/02
- Encapsulated canvas behavior in a class

10/12
- Fixed error where the line resets before touching the ball (logic error in collision system)
- Fixed undefined ball error on ball delete
- Moved game related objects on client into a game instance

10/13
- Fixed player teleportation bug. Reason: The client stops player movement on fire, but server doesnt unless on valid fire.

10/14
- Moved player sprite logic into PlayerSprite class

10/16
- Added player death

10/20 
- New directory structure
/client
/client/assets
/server


###Next steps

* Better sprite management
* Prettify changelog

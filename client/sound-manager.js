function Sound(source) {
  this.audio = new Audio(source);
}

Sound.prototype.play = function(options) {
  if (options) {
    var beforePlay = options.beforePlay || null;
    if (beforePlay && typeof beforePlay == 'function') {
      beforePlay(this.audio);
    }
  }

  this.audio.load();
  this.audio.play();
}

function SoundManager() {
  this.bubblePopSound;
  this.gunFireSound;
  this.backGroundSound;
}

SoundManager.prototype.playGunFire = function() {
  this.gunFireSound.play();
}

SoundManager.prototype.playBackGroundMusic = function() {
  var options = {
    beforePlay: function(audio) {
                  audio.addEventListener('ended', function() {
                    this.currentTime = 0;
                    this.play();
                  }, false);
                }
  }
  this.backGroundSound.play(options);
}

SoundManager.prototype.playBubblePopSound = function() {
  this.bubblePopSound.play();
}

SoundManager.prototype.init = function() {
  this.bubblePopSound = new Sound("assets/sounds/pop.wav");
  this.gunFireSound = new Sound("assets/sounds/gun.wav");
  this.backGroundSound = new Sound('assets/sounds/dst.mp3');
}



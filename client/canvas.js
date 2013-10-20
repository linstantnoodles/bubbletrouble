function Canvas(id) {
  this.id = id;
  this.context;
  this.width;
  this.height;
}

Canvas.prototype.getContext = function() {
  return this.context;
}

Canvas.prototype.setBackground = function(src) {
  var _this = this;
  var imageObj = new Image();
  imageObj.onload = function() {
    _this.context.drawImage(imageObj, 0, 0);
  }
  imageObj.src = src;
}

Canvas.prototype.init = function() {
  var canvas = document.getElementById(this.id);
  if (canvas.getContext) {
    this.context = canvas.getContext('2d');
  }
  this.width = canvas.width;
  this.height = canvas.height;
}

Canvas.prototype.getWidth = function() {
  return this.width;
}

Canvas.prototype.getHeight = function() {
  return this.height;
}


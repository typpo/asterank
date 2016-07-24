function toJED(d){
  // TODO precompute constants
  return Math.floor((d.getTime() / (1000 * 60 * 60 * 24)) - 0.5) + 2440588;
}

function fromJED(jed) {
  return new Date(1000*60*60*24 * (0.5 - 2440588 + jed));
}

function getColorFromPercent(value, highColor, lowColor) {
    var r = highColor >> 16;
    var g = highColor >> 8 & 0xFF;
    var b = highColor & 0xFF;

    r += ((lowColor >> 16) - r) * value;
    g += ((lowColor >> 8 & 0xFF) - g) * value;
    b += ((lowColor & 0xFF) - b) * value;

    return (r << 16 | g << 8 | b);
}

function displayColorForObject(roid) {
  /*
  if (roid.profit > 1e11)
    return new THREE.Color(0xffff00);
    */
  return new THREE.Color(0xffffff);

  /*
  var normal = parseFloat(1e11);
  if (roid.profit < 1)
    return new THREE.Color(0xcccccc);

  var adjustment = roid.profit / normal;
  console.log(adjustment);
  var ret = new THREE.Color(getColorFromPercent(
    adjustment,
    0x00ff00,
    0xcccccc

  ));
  // TODO change size too
  return ret;
  */
}

function getParameterByName(name)
{
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.search);
  if(results == null)
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}

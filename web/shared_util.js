var fuzzes = [
  {
    word: 'trillion',
    num: 1000000000000
  },
  {
    word: 'billion',
    num: 1000000000
  },
  {
    word: 'million',
    num: 1000000
  }
];

function toFuzz(n) {
  for (var i=0; i < fuzzes.length; i++) {
    var x = fuzzes[i];
    if (n / x.num >= 1) {
      var prefix = (n / x.num);
      if (i==0 && prefix > 100)
        return '>100 ' + x.word;
      return prefix.toFixed(2) + ' ' + x.word;
    }
  }
  return n;
}

function truncateText(txt, len) {
  if (txt.length > len) {
    txt = txt.substring(0,len-3) + '...';
  }
  return txt;
}

if (typeof(module) !== 'undefined') {
  module.exports = {
    toFuzz: toFuzz,
    truncateText: truncateText
  }
}

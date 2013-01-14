window.Ephemeris = {
  asteroid_2012_da14: {
    full_name: '2012 DA14',
    ma: 299.99868,
    epoch: 2456200.5,
    n: 0.98289640,
    a: 1.0018381,
    e: 0.1081389,
    i: 10.33722,

    w_bar: 58.33968,
    w: 271.07725,   // ARGUMENT of perihelion.  argument = longitude of perihelion - longitude of ascending node
    om: 147.26243,

    P: 365.256
  },

  // http://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html
  // http://ssd.jpl.nasa.gov/txt/aprx_pos_planets.pdf
  mercury: {
    full_name: 'Mercury',
    ma: 174.79252722,
    epoch: 2451545.0,
    a: 0.38709927,
    e: 0.20563593,
    i: 7.00497902,
    w_bar: 77.45779628,
    w: 29.12703035,
    L: 252.25032350,
    om: 48.33076593,
    P: 87.969
  },
  venus: {
    full_name: 'Venus',
    ma: 50.37663232,
    epoch: 2451545.0,
    a: 0.72333566,
    e: 0.00677672,
    i: 3.39467605,
    w_bar: 131.60246718,
    w: 54.92262463,
    L: 181.97909950,
    om: 76.67984255,
    P: 224.701
  },
  earth: {
    full_name: 'Earth',
    ma: -2.47311027,
    epoch: 2451545.0,
    a:1.00000261,
    e: 0.01671123,
    i: 0.00001531,
    w_bar: 102.93768193,
    w: 102.93768193,
    L: 100.46457166,
    //om:-11.26064,
    om: 0,
    P: 365.256
  },
  mars:{
    full_name: 'Mars',
    ma: 19.39019754,
    epoch: 2451545.0,
    a: 1.52371034,
    e: 0.09339410,
    i: 1.84969142,
    w_bar: -23.94362959,   // longitude of perihelion
    w: -73.5031685,   // argument of perihelion
    L: -4.55343205,    // mean longitude
    om: 49.55953891,    // longitude of ascending node
    P: 686.980
  },
  jupiter: {
    full_name: 'Jupiter',
    ma: 19.66796068,
    epoch: 2451545.0,
    a: 5.20288700,
    e: 0.04838624,
    i: 1.30439695,
    w_bar: 14.72847983,
    w: -85.74542926,
    L: 34.39644051,
    om: 100.47390909,
    P: 4332.589
  }
};

for (x in Ephemeris) {
  if (Ephemeris.hasOwnProperty(x) && Ephemeris[x].w_bar && Ephemeris[x].L) {
    Ephemeris[x].ma = Ephemeris[x].L - Ephemeris[x].w_bar;
  }
}

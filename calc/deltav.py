"""
Calculates delta-v for asteroids according to Shoemaker and Helin (1978)

See
http://echo.jpl.nasa.gov/~lance/delta_v/delta_v.rendezvous.html
http://echo.jpl.nasa.gov/~lance/delta_v/deltav.13.pl as well

"""

import numpy as np
import pandas as pp

DATA_PATH = 'data/fulldb.20130406.csv'
DV_TEST_PATH = 'data/deltav/db.csv'

mp = pp.read_csv(DATA_PATH, index_col='pdes')

mp.i = mp.i * np.pi / 180      # inclination in radians
mp['Q'] = mp.a * (1.0 + mp.e)  # aphelion

def AtensDeltaV(df):
  df['ut2'] = 2 - 2*np.cos(df.i/2)*np.sqrt(2*df.Q - df.Q**2)
  df['uc2'] = 3/df.Q - 1 - (2/df.Q)*np.sqrt(2 - df.Q)
  df['ur2'] = 3/df.Q - 1/df.a - (
      (2/df.Q)*np.cos(df.i/2)*np.sqrt(df.a*(1-df.e**2)/df.Q))
  return df

def ApollosDeltaV(df):
  df['ut2'] = 3 - 2/(df.Q + 1) - 2*np.cos(df.i/2)*np.sqrt(2*df.Q/(df.Q+1))
  df['uc2'] = 3/df.Q - 2/(df.Q+1) - (2/df.Q)*np.sqrt(2/(df.Q+1))
  df['ur2'] = 3/df.Q - 1/df.a - (
      (2/df.Q)*np.cos(df.i/2)*np.sqrt((df.a/df.Q)*(1-df.e**2)))
  return df

def AmorsDeltaV(df):
  df['ut2'] = 3 - 2/(df.Q+1) - 2*np.cos(df.i/2)*np.sqrt(2*df.Q/(df.Q+1))
  df['uc2'] = 3/df.Q - 2/(df.Q+1) - (
      (2/df.Q)*np.cos(df.i/2)*np.sqrt(2/(df.Q+1)))
  df['ur2'] = 3/df.Q - 1/df.a - (2/df.Q)*np.sqrt(df.a*(1-df.e**2)/df.Q)
  return df

atens = AtensDeltaV(mp[mp.a < 1])
apollos = ApollosDeltaV(mp[(mp.q <= 1) & (mp.a >= 1)])
amors = AmorsDeltaV(mp[(mp.q > 1) & (mp.a >= 1)])

mp = pp.concat((atens, apollos, amors))

v_earth = 29.784       # earth orbital velocity
U0 = 7.727 / v_earth;  # Normalized LEO velocity @ 300km
S = np.sqrt(2) * U0    # Normalied escape velocity from LEO

mp['ul'] = np.sqrt(mp.ut2 + S**2) - U0
mp['ur'] = np.sqrt(mp.uc2 - (
    2*np.sqrt(mp.ur2*mp.uc2)*np.cos(mp.i/2)) + mp.ur2)
mp['F'] = mp.ul + mp.ur
mp['DV'] = (30*mp.F) + .5

# TODO test against the actual data from
#    http://echo.jpl.nasa.gov/~lance/delta_v/delta_v.rendezvous.html
#   and compare their i and e values when off.

mp_test = pp.read_csv(DV_TEST_PATH, header=None,
                      names=('pdes', 'dv_expected'),
                      index_col='pdes')

results = mp.join(mp_test, how='inner')
results['dv_diff'] = results.DV - results.dv_expected

print('Comparing to %d known delta-vs.' % len(results))
print('Deviation from %d known delta-vs:' % len(results))
print(results.dv_diff.describe())

print('\n\nDisplaying asteroids that are more than 1m/s different:')

outliers = results[np.abs(results.dv_diff) > 1]
for pdes, row in outliers.iterrows():
  print('[%s] %s - %s - %s' % (
      row['class'], pdes, row['dv_expected'], row['DV']))

#TEST_CASES = (
#    ('2006 RH120', 3.813),
#    ('2007 UN12', 3.823),
#    ('2009 BD', 3.870),
#    ('2011 MD', 4.113),
#    ('2012 XK134', 4.478),
#    ('209215', 4.511), # pdes should be 2003 WP25
#    ('2013 CL129', 4.974),
#    ('2008 EJ85', 5.245),
#    ('2006 XW', 5.647),
#    ('337252', 6.110), # 2000 SD8
#    ('2003 UW5', 6.424),
#    ('2013 EP', 6.777))
#
#
#for pdes, expected in TEST_CASES:
#    print('[%s] %s - %s - %s' % (
#            mp.ix[pdes]['class'], pdes, expected, mp.ix[pdes]['DV']))

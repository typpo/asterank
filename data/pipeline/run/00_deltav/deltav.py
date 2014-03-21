"""
Calculates delta-v for asteroids according to Shoemaker and Helin (1978)

See
http://echo.jpl.nasa.gov/~lance/delta_v/delta_v.rendezvous.html
http://echo.jpl.nasa.gov/~lance/delta_v/deltav.13.pl as well

"""

import sys
import numpy as np
import operator
import pandas as pp

if len(sys.argv) < 3:
  DATA_PATH = 'data/fulldb.20140320.csv'
  DV_TEST_PATH = 'data/deltav/db.csv'
  OUTPUT_PATH = 'data/deltav/db2.csv'
else:
  DATA_PATH = sys.argv[1]
  DV_TEST_PATH = sys.argv[2]
  OUTPUT_PATH = sys.argv[3]

print 'Reading', DATA_PATH, '...'
df = pp.read_csv(DATA_PATH, index_col='pdes')

df.i = df.i * np.pi / 180      # inclination in radians
df['Q'] = df.a * (1.0 + df.e)  # aphelion

def AtensDeltaV(df):
  """Delta V calculation for Atens asteroids, where a < 1."""
  df['ut2'] = 2 - 2*np.cos(df.i/2)*np.sqrt(2*df.Q - df.Q**2)
  df['uc2'] = 3/df.Q - 1 - (2/df.Q)*np.sqrt(2 - df.Q)
  df['ur2'] = 3/df.Q - 1/df.a - (
      (2/df.Q)*np.cos(df.i/2)*np.sqrt(df.a*(1-df.e**2)/df.Q))
  return df

def ApollosDeltaV(df):
  """Delta V calculation for Apollo asteroids, where q <= 1, a >= 1."""
  df['ut2'] = 3 - 2/(df.Q + 1) - 2*np.cos(df.i/2)*np.sqrt(2*df.Q/(df.Q+1))
  df['uc2'] = 3/df.Q - 2/(df.Q+1) - (2/df.Q)*np.sqrt(2/(df.Q+1))
  df['ur2'] = 3/df.Q - 1/df.a - (
      (2/df.Q)*np.cos(df.i/2)*np.sqrt((df.a/df.Q)*(1-df.e**2)))
  return df

def AmorsDeltaV(df):
  """Delta V calculation for Amors asteroids, where q > 1 and a >= 1."""
  df['ut2'] = 3 - 2/(df.Q+1) - 2*np.cos(df.i/2)*np.sqrt(2*df.Q/(df.Q+1))
  df['uc2'] = 3/df.Q - 2/(df.Q+1) - (
      (2/df.Q)*np.cos(df.i/2)*np.sqrt(2/(df.Q+1)))
  df['ur2'] = 3/df.Q - 1/df.a - (2/df.Q)*np.sqrt(df.a*(1-df.e**2)/df.Q)
  return df

atens = AtensDeltaV(df[df.a < 1])
apollos = ApollosDeltaV(df[(df.q <= 1) & (df.a >= 1)])
amors = AmorsDeltaV(df[(df.q > 1) & (df.a >= 1)])

df = pp.concat((atens, apollos, amors))

v_earth = 29.784       # earth orbital velocity
U0 = 7.727 / v_earth;  # Normalized LEO velocity @ 300km
S = np.sqrt(2) * U0    # Normalied escape velocity from LEO

# Impulse for leaving LEO.
df['ul'] = np.sqrt(df.ut2 + S**2) - U0

# Impulse for rendevouzing at asteroid.
df['ur'] = np.sqrt(df.uc2 - (
    2*np.sqrt(df.ur2*df.uc2)*np.cos(df.i/2)) + df.ur2)

# Figure of merit, from Shoemaker and Helin.
df['F'] = df.ul + df.ur

# Delta V.
df['dv'] = (30*df.F) + .5

# Import Benner's delta v calculations.
print 'Reading', DV_TEST_PATH, '...'
df_test = pp.read_csv(DV_TEST_PATH, index_col='pdes')

results = df.join(df_test, how='inner', rsuffix='_benner')
results['dv_diff'] = (np.abs(results.dv - results.dv_benner) /
                      results.dv_benner)


print('\n\n% deviation from known delta-vs:')
print(results.dv_diff.describe())

print('\n\n% deviation for Atens:')
print(results[results.a < 1].dv_diff.describe())

print('\n\n% deviation for Apollos:')
print(results[(results.q <= 1) & (results.a >= 1)].dv_diff.describe())

print('\n\n% deviation for Amors:')
print(results[(results.q > 1) & (results.a >= 1)].dv_diff.describe())

print('\n\n30 asteroids with highest error:')
outliers = results.sort(columns=['dv_diff'])[-30:]
for pdes, row in outliers.iterrows():
  print('%s \t %.3f km/s (expected %.3f km/s) (error %%%.2f)' % (
      pdes, row['dv'], row['dv_benner'], row['dv_diff']*100))

df = df.sort(columns=['dv'])
print('\n\n30 asteroids with lowest delta-v:')
for pdes, row in df[:30].iterrows():
  print('%s \t%.3f km/s' % (pdes, row['dv']))

print '\nWriting results to', OUTPUT_PATH
#df.to_csv(OUTPUT_PATH, cols=('dv',))
f = open(OUTPUT_PATH, 'w')
f.write('pdes,dv\n')
for pdes, row in df.iterrows():
  f.write('%s,%f\n' % (pdes, row['dv']))
  """
  if full_name.find('Klio') > -1:
    print full_name
    print row

  name = row['pdes'] if row['pdes'] != '' else full_name
  f.write('%s,%f\n' % (name, row['dv']))
  """
f.close()

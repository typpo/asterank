## Asterank

Asterank (www.asterank.com) is a space development platform.  It supports calculations over the entire set of known asteroids and provides APIs and visualizations for many data sources, including NASA/JPL Horizons, NASA SkyMorph/NEAT and SDSS sky surveys, the Kepler Project, and the Minor Planet Center.

The main purpose of Asterank is to make space-related data readily accessible to the public.  Another goal of the site is to educate and inspire by demonstrating the importance of asteroid discovery and exploration.  Using publicly available data and scientific papers, the project evaluates the economic prospects of mining nearly 600,000 cataloged asteroids.  In addition, Asterank is the basis of a crowdsourced asteroid discovery citizen science initiative.

Asterank has been featured by BBC News, Popular Science, and other media.

## The basics

Asterank is configured to run with virtualenv.  Virtual environment setup:

  1. Install python and python virtualenv dependencies, eg. on ubuntu:

    ```
    sudo apt-get install python python-virtualenv
    ```

  2. Enter the Asterank directory.  Then, create the virtual environment and install packages:

    ```
    virtualenv  venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

  3. The web app requires mongodb.  `sudo apt-get install mongodb`.

  4. The main app is a Flask web application.  You should be able to run it now.

    ```
    ./app.py
    ```

You'll quickly notice that there's no data.  Continue reading for instructions on how to import data.

## The data pipeline

The `data/pipeline` folder contains the scrapers used to aggregate and build the database and associated APIs.

### SBDB setup

The SBDB is too large to include in this repo, and downloading it takes some time.  Download http://www.ianww.com/latest_fulldb.csv to `data/pipeline/static/`, or produce your own database by going to http://ssd.jpl.nasa.gov/sbdb_query.cgi and downloading all attributes for all objects in CSV format.

### Running the pipeline

Pipeline tasks are folders in the `pipeline/run` directory and are executed in increasing lexical order.  Tasks with the same numeric prefix may be run in parallel.

To execute the pipeline, simply run `./pipeline`.  To execute a specific task, run eg. `./pipeline 00_mytask`, where 00\_mytask matches a directory.  In order to run Asterank, you at least need to run steps `00_deltav` and `10_sbdb`.

## The sky survey/discovery process

### NEAT

Sky survey data is scraped from NEAT.  The process is generally three steps per asteroid:

  1. Collect asteroid observations and group them into nearby observations (within ~30 min of one another).

  2. Fetch images corresponding to each image group.

  3. Compute/extract astrometry from the image.  We use the open-source library available at [astrometry.net](http://astrometry.net).

Note that sky survey data depends on redis: `sudo apt-get install redis-server`.

All this happens in `v2/stackblink`.  In `data/astrometry` there are scripts available to help you bootstrap your astrometry setup.

### SDSS

SDSS setup:

  1. `cd sdss`
  2. `cat stripe_82 | ./load_data.sh`
  3. `./process_images.sh`

## How to collaborate

  1. Fork this repository
  2. Make changes
  3. Create a pull request on github

If you think you might like to contribute, feel free to contact me! ianw\_asterank at ianww.com.

## Notes and Todo

See [github issues](https://github.com/typpo/asterank/issues?state=open).

## License (MIT)

Copyright (C) 2012 by Ian Webster (asterank.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

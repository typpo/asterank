#!/usr/bin/env python

import telnetlib
t = telnetlib.Telnet()
t.open('horizons.jpl.nasa.gov', 6775)


t.read_very_eager()

#!/bin/bash

wget -o mpc.dat http://www.minorplanetcenter.org/iau/MPCORB/MPCORB.DAT.gz
gunzip MPCORB.DAT.gz

# 1. Desig
# 2. H
# 3. G
# 4. Epoch
# 5. M
# 6. Peri
# 7. Node
# 8. Incl
# 9. e
# 10. n
# 11. a
# 12. ref
# 13. #obs
# 14. #opp
# 15. arc
# 16. rms
# 17. Perts
# 18. Computer

tail -n +42 MPCORB.DAT | awk -F' ' -v OFS=',' '{ print $1, $17, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 }'

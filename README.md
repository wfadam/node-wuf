# node-wuf
an ATE program invoke tool

## No pains to run SSD MT program (under tXXXXXX/)
`$ wuf  fh  ECOTS_SD_DEVICENUMBER=55-88-99   ECOTS_SD_LOTNUMBER=LL52227373.99`

## Pass any variable who’s name starts with ECOTS_  (under tXXXXXX/)
`$ wuf  sh  fh  ECOTS_SD_RESCREEN=0`

## Run from a binary MT program
`$ wuf  sh  fh  abc_tp.zip`

## Run multiple flows in sequence (under tXXXXXX/) 
`$ wuf  debug  sh  fh`

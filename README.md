# node-wuf
an ATE program invoke tool

## No pains to run SSD MT program (under tXXXXXX/)
```bash
$ wuf  fh  ECOTS_SD_DEVICENUMBER=55-88-99   ECOTS_SD_LOTNUMBER=LL52227373.99
```

## Pass any variable who’s name starts with ECOTS_  (under tXXXXXX/)
```bash
$ wuf  sh  fh  ECOTS_SD_ABC=0
```

## Run from a binary MT program
```bash
$ wuf  sh  fh  abc_tp.zip
```

## Run multiple flows in sequence (under tXXXXXX/) 
```bash
$ wuf  debug  sh  fh
```

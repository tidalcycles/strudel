// Blue Monday - New Order inspired pattern
// Classic electronic dance track foundation

setcps(0.25)
$: sound("[bd ~ bd ~ bd ~ bd ~][bd*16]").bank("RolandTR909")
$: sound("[~ sd ~ sd][~ sd ~ sd]").bank("RolandTR909")
$: note("[d ~ f ~ d ~ c ~][c ~ c ~ c ~ a ~][a ~ c ~ c ~ a ~][c ~ c ~ c ~ a ~]").sound("casio")
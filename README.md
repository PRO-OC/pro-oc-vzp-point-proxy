# PRO OC VZP Point Proxy

## Použití

**GET <serverUrl>/online/online01?firstName=&lastName=&dateBirth=&until=**

```
firstName=<Krestni>
lastName=<Prijmeni>
dateBirth=<Datum narození, 19.5.1994 např.>
until=<Overeni provest ke dni - 9.3.2022 napr.>
```

```
{
    "shrnuti": "\n                        Pojištěnec <strong>má ke dni 09.03.2022 platné pojištění</strong> a je v Centrálním registru pojištěnců (CRP) evidován s následujícími údaji:\n                    ",
    "cisloPojistence": "940519xxxx",
    "druhPojisteni": "Veřejné zdravotní pojištění",
    "zdravotniPojistovna": "201 - Vojenská zdravotní pojišťovna ČR"
}
```
   

```
{
    "shrnuti": "\n                        Pojištěnec <strong>má ke dni 09.03.2022 platné pojištění</strong> a je v Centrálním registru pojištěnců (CRP) evidován s následujícími údaji:\n                    ",
    "cisloPojistence": "940519xxxx",
    "druhPojisteni": "Mezistátní smlouvy",
    "zdravotniPojistovna": "111 - Všeobecná zdravotní pojišťovna ČR"
}
```
    
```
{
   "shrnuti": "Zadaným kritériím neodpovídá v Centrálním registru pojištěnců (CRP) žádný pojištěnec.",
   "cisloPojistence": "",
   "druhPojisteni": "",
   "zdravotniPojistovna": ""
}
```

```
{
   "shrnuti": "Bylo nalezeno více pojištěnců odpovídajících zadaným kritériím. Upřesněte prosím váš požadavek uvedením dalších údajů pojištěnce (jméno, rodné příjmení).",
   "cisloPojistence": "",
   "druhPojisteni": "",
   "zdravotniPojistovna": ""
}
```

## Build docker image vzp-point

Je nutné zapnout BuildKit v souboru ```/etc/docker/daemon.json``` a restartovat deamona.

```
{ 
  "features": { 
    "buildkit": true 
  } 
}
```

Lokálně se za pomocí secrets z BuildKitu přidá následovně. Při přidávání na serveru v UI je nutné dodržet secret id ```cert``` a typ ```.pem```, id pro cert passphrase ```cert_pass``` v plain text a ```googlechromepolicy``` ve formátu ```json```.

```
DOCKER_BUILDKIT=1 sudo docker build \
--secret id=cert,src=./../pro-oc-vfn-secrets/cert.pem \
--secret id=cert_pass,src=./../pro-oc-vfn-secrets/certpassphrase.txt \
--secret id=googlechromepolicy,src=./../pro-oc-vfn-secrets/googlechromepolicy.json \
-t vzp-point . --progress=plain
```

## Spuštění docker image vzp-point

Env proměnné lokálně vkládané např. z jiného git repozitáře:

1) **(required)** ```ENCRYPT_KEY```
2) **(optional)** ```PORT``` (default 3000)

```
export ENCRYPT_KEY=$(cat ../pro-oc-vfn-secrets/encryptionkey.txt)

sudo docker run --network host -it \
-e ENCRYPT_KEY="${ENCRYPT_KEY}" \
vzp-point
```

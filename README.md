# PRO OC VZP Point Proxy

## Použití

- Certifikát umístit do souboru `./cert.pfx` a kód k certifikátu do `./cert.pfx.pass.txt`

- Název certifikátu pro `AutoSelectCertificateForUrls` upravit v souboru `googlechromepolicy.json`

- Encryption key pro komunikaci mezi proxy a klientem je potřeba umístit do souboru `./encryptionkey.txt`

**GET <serverUrl>/online/online01?firstName=< Krestni >&lastName=< Prijmeni >&dateBirth=< Datum narození 19.5.1994 např. >&until=< Overeni provest ke dni - 9.3.2022 napr. >**

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
   "shrnuti": "Zadaným kritériím neodpovídá v Centrálním registru pojištěnců (CRP) žádný pojištěnec.",
   "cisloPojistence": "",
   "druhPojisteni": "",
   "zdravotniPojistovna": ""
}
```

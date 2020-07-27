# Bakalárska práca
https://is.muni.cz/th/tsxu8/

# Návod

Nainštalujte si Node.js v12 - https://nodejs.org/.
Vstúpte do adresára `uploader/` a spustite príkaz `npm install`, 
čím sa nainštalujú všetky závislosti do adresára `node_modules`.
Následne je možné skompilovať serverovú časť aplikácie pomocou príkazu
`npm run build`. Následne server spustíte príkazom 
`npm run start`. Klientskú časť je možné skompilovať a zároveň spustiť
príkazom `npm run build:dev`. Takto skompilovaný server a klientská časť
bežia v režime development. Otvorte prehliadač a otvorte `http://localhost:8080`.
Aplikácia by sa mala korektne načítať.
# Užitočné príkazy

| Príkaz           | Popis       |
|------------------|-------------|
| `npm run build`  | Skompiluje sa serverová časť aplikácie
| `npm run start`  | Spustí sa serverová časť aplikácie
| `npm run build:dev`  | Skompiluje sa a spustí sa klientská časť aplikácie

# Štruktúra projektu
## Klient
`uploader/client/src/assets` - tu sa nachádzajú použité obrázky

`uploader/client/src/components` - tu sa nachádzajú jednotlivé komponenty *.vue
používateľského rozhrania

`uploader/client/src/js` - tu sa nachádza jednoduchý wrapper pre lepšiu prácu s
crypto-browserify pomocou typescriptu

`uploader/client/src/style` - tu sa nachádza globálny súbor s definovaným štýlom aplikácie

`uploader/client/src/ts` - tu sa nachádza všetka logika pre klientskú stranu aplikácie *.ts
    
    authDropbox.ts - obsahuje logiku, ktorá zabezpečuje prácu najmä s access tokenom 
    cipher.ts - obsahuje všetku logiku pre šifrovanie, dešifrovanie a generovanie hodnôt
    compatibility.ts - nástroj, ktorý deteguje chýbajúce funkcie, poprípade ich nahradí
    config.ts - tu je možné nastaviť rôzne konštanty pre šifrovanie atď.
    downloadFile.ts - implementácia sťahovania súboru spolu s ukladaním na disk užívatela
    downloadFileSource.ts - zdroj, ktorý zabezpečuje korektné sťahovanie súboru po častiach
    downloadMetadata.ts - stiahnutie a validácia metadát
    downloadMetadataSource.ts - zdroj, ktorý zabezpečuje korektné sťahovanie metadát na základe rozsahov
    limiter.ts - zabezpečuje kontrolu veľkosti nahrávaného súboru
    metadata.ts - trieda pre reprezentáciu metadat
    receiver.ts - obsahuje triedy, ktoré definujú, akým sposôbom sa sťahuje z daných úložisk
    sender.ts - obsahuje triedy, ktoré definujú, akým spôsobom sa nahráva súbor na dané úložiská
    uploadFile.ts - nahrávanie súboru
    uploadSource.ts - zdroj zašifrovaného súboru pre nahrávanie - zabezpečuje delenie na časti a šifrovanie
    utils.ts - základné nástroje pre vytváranie odkazov atď.
    
## Server
`uploader/server/dist/files` - sem sa ukladajú nahrané súbory

`uploader/server/src` - v tomto adresáry sa nachádzajú zdrojové kódy serveru

## Testy
`uploader/tests` - tu sa nachádzajú testy pre server ale aj pre klientskú časť
# Online
https://aploader.herokuapp.com/

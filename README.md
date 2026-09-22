# Dose Certa â€” V2.1

Aplicativo simples para acompanhar o uso diÃ¡rio de pÃ­lula anticoncepcional, sem recursos de ciclo menstrual ou previsÃ£o de ovulaÃ§Ã£o.

## O que mudou na V2

- Nova tela inicial em formato de dashboard.
- Progresso circular da cartela.
- Indicador de adesÃ£o registrada.
- VisÃ£o rÃ¡pida da semana.
- NavegaÃ§Ã£o com 4 Ã¡reas: Hoje, CalendÃ¡rio, HistÃ³rico e Ajustes.
- ConfiguraÃ§Ã£o inicial em etapas, em vez de um formulÃ¡rio Ãºnico.
- Seletor visual de data com calendÃ¡rio prÃ³prio.
- Seletor visual de horÃ¡rio com ajustes rÃ¡pidos.
- AnimaÃ§Ãµes leves ao entrar na tela e ao registrar uma dose.
- HistÃ³rico com indicadores e registros recentes.
- EdiÃ§Ã£o de dose com seletor de horÃ¡rio.
- Layout limitado no desktop para manter aparÃªncia de aplicativo mÃ³vel.
- MantÃ©m SQLite, ediÃ§Ã£o, exclusÃ£o, restauraÃ§Ã£o e notificaÃ§Ãµes da V1.
- `metro.config.js` jÃ¡ preparado para o WebAssembly usado pelo `expo-sqlite` na web.

## Stack

- React Native
- Expo SDK 57
- TypeScript
- expo-sqlite
- expo-notifications
- expo-linear-gradient
- react-native-svg

## InstalaÃ§Ã£o

Abra a pasta do projeto no VS Code e execute:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm install
npx expo install --fix
```

## Testar no navegador

```powershell
npx expo start --web --clear
```

O projeto jÃ¡ contÃ©m `react-dom`, `react-native-web` e a configuraÃ§Ã£o do Metro necessÃ¡ria para o SQLite web.

## Testar no Android

```powershell
npx expo start
```

Abra com Expo Go ou pressione `a` se tiver um emulador Android configurado.

## Gerar APK de teste

```powershell
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

## PersistÃªncia

Os dados sÃ£o armazenados em `pilula-em-dia.db` usando SQLite. Fechar o app nÃ£o apaga os registros. A desinstalaÃ§Ã£o/limpeza dos dados do aplicativo pode apagar o banco local; backup em nuvem pode ser acrescentado em uma versÃ£o futura.

## Aviso funcional

O aplicativo serve para lembrete e registro de uso. NÃ£o calcula ovulaÃ§Ã£o, perÃ­odo fÃ©rtil ou conduta clÃ­nica para doses esquecidas. Para esse tipo de orientaÃ§Ã£o, deve-se consultar a bula especÃ­fica do medicamento e/ou profissional de saÃºde.


## Temas completos

Em **Ajustes > Tema do aplicativo**, Ã© possÃ­vel alternar entre RosÃ©, Lavanda, Azul nÃ©voa, SÃ¡lvia, PÃªssego, Creme, Neutro, Escuro e Preto AMOLED. A preferÃªncia Ã© salva no SQLite e o tema altera fundo, cards, botÃµes, textos, bordas e navegaÃ§Ã£o.

## Como funciona

1. Configure data de inÃ­cio, quantidade de comprimidos, dias de pausa e horÃ¡rio diÃ¡rio.
2. O aplicativo gera os registros da cartela e agenda lembretes locais quando as notificaÃ§Ãµes estÃ£o permitidas.
3. Marque cada dose como tomada ou nÃ£o tomada; horÃ¡rio real, observaÃ§Ãµes e correÃ§Ãµes ficam salvos no histÃ³rico.
4. CalendÃ¡rio e histÃ³rico usam armazenamento SQLite local e continuam disponÃ­veis depois de fechar ou reiniciar o aplicativo.
5. **Apagar todos os dados** remove tratamento, histÃ³rico, registros apagados e preferÃªncias locais, retornando Ã  configuraÃ§Ã£o inicial.

## CrÃ©ditos

**Idealizado e desenvolvido por Joey Rickson GuimarÃ£es Oliveira.**

Dose Certa â€” projeto pessoal.

## Tema rÃ¡pido

AlÃ©m de Ajustes > Tema do aplicativo, a tela principal possui um botÃ£o flutuante de paleta (ðŸŽ¨) acima da barra inferior. Ele abre um seletor rÃ¡pido com todos os temas e salva a escolha no banco local imediatamente.


## V2.3 - layout responsivo
- Safe area real no Android/iOS para status bar e barra de navegaÃ§Ã£o do sistema.
- Barra inferior sobe automaticamente conforme o aparelho.
- BotÃ£o rÃ¡pido de tema acompanha a safe area.
- Tela Hoje reduz espaÃ§amentos e reorganiza aÃ§Ãµes automaticamente em aparelhos estreitos/baixos.
- ConteÃºdo centralizado em telas maiores e tablets.
- Novo Ã­cone oficial em assets/icon.png.

## V2.4 - Modo Alarme

AlÃ©m da notificaÃ§Ã£o normal, o app agora oferece **Modo alarme** em Ajustes.

- Som prÃ³prio `assets/pill_alarm.wav`, com aproximadamente 18 segundos.
- Canal Android de importÃ¢ncia mÃ¡xima, usando categoria de Ã¡udio de alarme e vibraÃ§Ã£o reforÃ§ada.
- O aviso fica marcado como persistente no Android e nÃ£o pode ser removido apenas deslizando enquanto estÃ¡ ativo.
- RepetiÃ§Ã£o configurÃ¡vel: a cada 1, 2, 5 ou 10 minutos, por 3, 5 ou 8 toques.
- AÃ§Ãµes na notificaÃ§Ã£o: **Tomei** e **Adiar 5 min**.
- Ao tocar em **Tomei**, a dose Ã© registrada com o horÃ¡rio real e os prÃ³ximos avisos daquela dose sÃ£o cancelados.
- Ao tocar em **Adiar 5 min**, os avisos daquela dose sÃ£o reagendados a partir de cinco minutos depois.
- BotÃ£o **Testar alarme em 10 s** em Ajustes.
- Atalho para a tela Android de **Alarmes e lembretes**, importante para maior precisÃ£o em versÃµes recentes do Android.

### ObservaÃ§Ã£o sobre o comportamento do alarme

Esta versÃ£o usa os recursos de notificaÃ§Ãµes locais do Expo/Android para produzir um aviso muito mais forte e repetitivo que uma notificaÃ§Ã£o comum. Ela nÃ£o mantÃ©m um Ã¡udio infinito tocando em loop como o aplicativo RelÃ³gio nativo: o som toca por aproximadamente 18 segundos e volta a disparar conforme as repetiÃ§Ãµes escolhidas. Um alarme totalmente contÃ­nuo atÃ© o usuÃ¡rio interromper exigiria uma implementaÃ§Ã£o Android nativa especÃ­fica, com serviÃ§o de Ã¡udio/alarme em primeiro plano.

### Novo build obrigatÃ³rio

O som personalizado Ã© incorporado ao APK no momento do build. Depois de atualizar para a V2.4, gere e instale um novo APK:

```powershell
eas build -p android --profile preview
```

Testes no navegador nÃ£o representam corretamente som, vibraÃ§Ã£o, canal de alarme ou permissÃµes especiais do Android.


# Pílula em Dia — V2.1

Aplicativo simples para acompanhar o uso diário de pílula anticoncepcional, sem recursos de ciclo menstrual ou previsão de ovulação.

## O que mudou na V2

- Nova tela inicial em formato de dashboard.
- Progresso circular da cartela.
- Indicador de adesão registrada.
- Visão rápida da semana.
- Navegação com 4 áreas: Hoje, Calendário, Histórico e Ajustes.
- Configuração inicial em etapas, em vez de um formulário único.
- Seletor visual de data com calendário próprio.
- Seletor visual de horário com ajustes rápidos.
- Animações leves ao entrar na tela e ao registrar uma dose.
- Histórico com indicadores e registros recentes.
- Edição de dose com seletor de horário.
- Layout limitado no desktop para manter aparência de aplicativo móvel.
- Mantém SQLite, edição, exclusão, restauração e notificações da V1.
- `metro.config.js` já preparado para o WebAssembly usado pelo `expo-sqlite` na web.

## Stack

- React Native
- Expo SDK 57
- TypeScript
- expo-sqlite
- expo-notifications
- expo-linear-gradient
- react-native-svg

## Instalação

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

O projeto já contém `react-dom`, `react-native-web` e a configuração do Metro necessária para o SQLite web.

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

## Persistência

Os dados são armazenados em `pilula-em-dia.db` usando SQLite. Fechar o app não apaga os registros. A desinstalação/limpeza dos dados do aplicativo pode apagar o banco local; backup em nuvem pode ser acrescentado em uma versão futura.

## Aviso funcional

O aplicativo serve para lembrete e registro de uso. Não calcula ovulação, período fértil ou conduta clínica para doses esquecidas. Para esse tipo de orientação, deve-se consultar a bula específica do medicamento e/ou profissional de saúde.


## Temas completos

Em **Ajustes > Tema do aplicativo**, é possível alternar entre Rosé, Lavanda, Azul névoa, Sálvia, Pêssego, Creme, Neutro, Escuro e Preto AMOLED. A preferência é salva no SQLite e o tema altera fundo, cards, botões, textos, bordas e navegação.

## Como funciona

1. Configure data de início, quantidade de comprimidos, dias de pausa e horário diário.
2. O aplicativo gera os registros da cartela e agenda lembretes locais quando as notificações estão permitidas.
3. Marque cada dose como tomada ou não tomada; horário real, observações e correções ficam salvos no histórico.
4. Calendário e histórico usam armazenamento SQLite local e continuam disponíveis depois de fechar ou reiniciar o aplicativo.
5. **Apagar todos os dados** remove tratamento, histórico, registros apagados e preferências locais, retornando à configuração inicial.

## Créditos

**Idealizado e desenvolvido por Joey Rickson Guimarães Oliveira.**

Pílula em Dia — projeto pessoal.

## Tema rápido

Além de Ajustes > Tema do aplicativo, a tela principal possui um botão flutuante de paleta (🎨) acima da barra inferior. Ele abre um seletor rápido com todos os temas e salva a escolha no banco local imediatamente.

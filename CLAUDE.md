# CLAUDE.md — App Divide Aí

Contexto completo para continuar o desenvolvimento sem perder histórico.

---

## O QUE É ESTE PROJETO

**Divide Aí** é um app mobile de divisão de despesas entre amigos, desenvolvido pela **Enjoy Pineapple**.
Criado por Pablo (Porto Alegre/RS) como produto independente do app BORA.

**Repositório:** https://github.com/EnjoyPineapple/app_divide_ai
**Pasta local:** `C:\dev\racha`

---

## STACK TÉCNICA

- **React Native + Expo SDK 56** (TypeScript desligado — tudo em `.js`)
- **React Navigation** (`@react-navigation/native` + `@react-navigation/native-stack`)
- **AsyncStorage** — armazenamento local, sem backend/servidor
- **expo-sharing + react-native-view-shot** — compartilhar resultado como foto
- **expo-auth-session** — login Google (configurado mas aguardando credenciais Google Cloud)
- **Expo Go** — testar em dispositivo físico Android (iOS trava no Expo Go — usar AVD Android)

---

## COMO RODAR

```bash
cd C:\dev\racha
npm install
npx expo start
```

Escanear QR code com Expo Go (Android) ou pressionar `a` para abrir no emulador Android.

---

## ESTRUTURA DE ARQUIVOS

```
App.js                        → navegação principal (Stack Navigator)
src/
  screens/
    HomeScreen.js             → lista eventos ATIVOS + botão Encerrar
    CreateEventScreen.js      → criar evento: nome + paleta + participantes
    EventDetailScreen.js      → adicionar pagamentos + grupos familiares
    ResultsScreen.js          → resultado: quem paga quem + compartilhar
    HistoryScreen.js          → histórico: ativos + concluídos + stats
    LoginScreen.js            → login Google / entrar sem conta
  components/
    Avatar.js                 → círculo colorido com iniciais (prop: name, index, size)
    FamilySection.js          → grupos familiares no EventDetail
    MoneyAnimation.js         → NÃO USADA — pode ser removida
  storage/
    events.js                 → CRUD AsyncStorage — chave: @divide_ai_events
    user.js                   → dados do usuário — chave: @divide_ai_user
  utils/
    calculate.js              → algoritmo de divisão (com suporte a famílias)
    colors.js                 → 8 cores para avatares: getColor(index), getColorByName(name)
    palettes.js               → 3 temas visuais por evento
assets/
  icon.png                    → logo do Divide Aí (exibido no header da HomeScreen)
```

---

## NAVEGAÇÃO (App.js)

```
Login         (headerShown: false) → tela inicial se não fez onboarding
Home          (headerShown: false) → tela principal com lista de eventos
CreateEvent                        → criar novo evento
EventDetail                        → detalhes e pagamentos do evento
Results                            → resultado calculado
History                            → histórico de todos os eventos
```

Lógica de rota inicial: verifica `user.seenOnboarding` no AsyncStorage — se true, vai para Home; caso contrário, Login.

---

## ESTRUTURA DE DADOS

### Evento (AsyncStorage)
```js
{
  id: string,              // Date.now().toString()
  name: string,
  paletteId: 'fintech' | 'brasa' | 'nightlife',
  createdAt: string,       // ISO date
  completed: boolean,
  participants: [{ id, name }],
  payments: [{
    id, participantId, participantName,
    participantIndex, amount, description
  }],
  families: [{             // grupos familiares
    id, headId, memberIds: []
  }]
}
```

### Usuário (AsyncStorage)
```js
{ name, email, photo, seenOnboarding: boolean }
```

---

## SISTEMA DE PALETAS (src/utils/palettes.js)

3 temas visuais selecionáveis ao criar o evento:

| ID | Nome | Cores principais |
|---|---|---|
| `fintech` | Social Fintech 🎯 | Coral #FF6B6B + Turquesa #06D6A0 |
| `brasa` | Brasa & Ouro 🔥 | Terracota #C2410C + Ouro #D97706 |
| `nightlife` | Nightlife Neon 🌙 | Roxo #7C3AED + Roxo claro #A855F7 |

Cada paleta tem: `headerBg, headerText, primary, accent, highlightBg, highlightText, highlightBorder, badgeBg, badgeText, preview`.

Uso: `import { getPalette } from '../utils/palettes'` → `getPalette(event.paletteId)`

A paleta é aplicada em:
- Header da tela (via `navigation.setOptions`)
- Botões de ação
- Badge de total nos cards
- Barra de cor no topo de cada card (HomeScreen e HistoryScreen)
- Header do card compartilhável (ResultsScreen)

---

## ALGORITMO DE DIVISÃO (src/utils/calculate.js)

`calculateResults(participants, payments, families)`

1. Calcula total pago por cada participante
2. Calcula cota individual (total / nº de participantes independentes)
3. **Grupos familiares:** dependentes não pagam cota própria — a dívida vai para o responsável (head)
4. Gera `balances[]` com: paid, balance, isCovered, coveredByName, isHead, coveredMembers
5. Gera `transactions[]` (quem paga quem) via algoritmo greedy creditor/devedor

---

## FUNCIONALIDADES IMPLEMENTADAS

- [x] Criar eventos com nome, paleta visual e participantes
- [x] Registrar pagamentos com máscara de moeda (R$ XX,XX)
- [x] Grupos familiares: responsável paga pelos dependentes
- [x] Calcular resultado: quem deve pagar quanto para quem
- [x] Compartilhar resultado como **foto** (react-native-view-shot + expo-sharing)
- [x] Compartilhar resultado como **texto** (WhatsApp-friendly com negrito)
- [x] Branding "Divide Aí · feito pela Enjoy Pineapple · enjoypineapple.com.br" nas fotos
- [x] Encerrar/Reabrir evento (direto da Home ou da tela de Resultado)
- [x] **Home:** mostra só eventos ativos — concluídos vão para o Histórico
- [x] **Histórico:** stats (total de eventos, valor gasto, pessoas) + lista ativos e concluídos
- [x] Login com Google (aguardando credenciais) + entrar sem conta
- [x] Avatar colorido com iniciais por participante

---

## PENDÊNCIAS CONHECIDAS

- [ ] Login Google: precisa configurar `WEB_CLIENT_ID` e `ANDROID_CLIENT_ID` no `LoginScreen.js` (Google Cloud Console)
- [ ] `MoneyAnimation.js` — arquivo não usado, pode ser deletado
- [ ] Link real da Play Store para quando publicar o Divide Aí
- [ ] iOS: Expo Go trava — usar Android AVD para desenvolvimento

---

## BRANDING

- **Header da HomeScreen:** logo `assets/icon.png` + "Divide Aí" + "by Enjoy Pineapple"
- **Foto compartilhada:** footer com logo + "Divide Aí · feito pela Enjoy Pineapple · enjoypineapple.com.br"
- **Texto compartilhado:** rodapé "_Divide Aí — feito pela Enjoy Pineapple_" + "_enjoypineapple.com.br_"

---

## OUTROS PROJETOS DA ENJOY PINEAPPLE

- **App BORA** — classificação de risco de atividades econômicas → `github.com/EnjoyPineapple/app_BORA`
- **Site institucional** → `github.com/EnjoyPineapple/Site-EnjoyPineapple` (enjoypineapple.com.br)

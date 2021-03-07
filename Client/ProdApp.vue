<template>
  <div id="app">
    <Game
      :show-game=" showApp && mapLoaded"
    />
    <div v-if="!showApp" :class='{"show-splash": showSplash, "hide-splash": !showSplash }' id="splash">
      <h1>Game Dev Bois Game Jam</h1>
    </div>
    <div v-else-if="!showSplash && !gameStarted"
      class="main-container"
     :class='{"show-main": showApp && mapLoaded }'
    >
      <div class="inner-container">
        <div class="half-vert top">
          <div class="game-title">
            Animal Crossing SNES
          </div>
          <div class="credits">
            <a href="http://www.fordesoft.com/" target="_blank">Graphics - Josh</a>
            <a href="https://twitter.com/lawofsavages" target="_blank">Code - visgotti </a>
            <a href="https://itch.io">Music/SFX - Francois</a>
          </div>
        </div>
        <div class="half-vert bottom">
          <div class="option-container">
            <div v-if="!chosingName" class="btn-options">
              <div @click="startGame(false)" class="play-btn" v-if="previousGameState">
                Continue
              </div>
              <div class="play-btn" @click="startChosingName()">
                New Game
              </div>
            </div>
            <div v-else class="name-enter-wrapper">
              <div @click="chosingName=false" class="cancel-btn"></div>
              <h2> What is your name? </h2>
              <input ref="entername" @keydown.enter.prevent.stop="startGame(true)" v-model="chosenName" type="text" />
              <div class="rdy-btn-wrapper">
                <div class="play-btn" :class="{'ready-btn': validChosenName, 'disabled-btn': !validChosenName  }"
                     @click="startGame(true)"
                > Ready! </div>
              </div>
            </div>
          </div>
        </div>
        </div>
    </div>
  </div>
</template>

<script>
import Game from './components/Game.vue';
import Gotti from 'gotti';


let gameInput;
let tick;

export default {
  name: 'app',
  components: {
    Game,
  },
  beforeMount() {
    this.tryGetPreviousGameState();
  },
  mounted() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.registerKeyEvents();
    setTimeout(() => {
      this.showSplash = true;
      setTimeout(() => {
        this.showSplash = false;
        setTimeout(() => {
          this.showApp = true;
        }, 1100);
      }, 2700);
    }, 100);
  },
  created() {
    Gotti.on('game-input', (g) => {
      gameInput = g;
    });
    Gotti.on('initial-map-load', () => {
      this.mapLoaded = true;
    });
    Gotti.on('game-stopped', () => {
      this.tryGetPreviousGameState();
      this.gameStarted = false;
      this.starting = false;
      this.chosenName = "";
      this.chosingName = false;
      this.registerKeyEvents();
    });
  },
  data: () => {
    return {
      startGameError: '',
      gameStarted: false,
      previousGameState: null, // Engine > Shared > types.ts GameStateData
      error: "",
      showApp: false,
      showSplash: false,
      onGame: false,
      mapLoaded: false,
      chosenName: "",
      chosingName: false,
      starting : false,
      registeredKeyEvents: false,
    }
  },
  methods: {
    getFocusIndex() {
    },
    handleKeyDown(e) {
      const isEnterKey = e.which == 13 || e.key === "Enter" || e.code === "Enter";
      if(isEnterKey && !this.gameStarted && !this.chosingName && !this.starting) {
        this.startChosingName();
      }
    },
    registerKeyEvents() {
      if(this.registeredKeyEvents) throw new Error(`Trying to register key events multiple times`);
      if(typeof document !== 'undefined') {
        document.addEventListener('keydown', this.handleKeyDown);
      } else if (typeof window !== 'undefined') {
        window.addEventListener('keydown', this.handleKeyDown);
      }
      this.registeredKeyEvents = true;
    },
    tryGetPreviousGameState() {
      if(typeof localStorage !== 'undefined') {
        const c = localStorage.getItem('game-state');
        if(c) {
          this.previousGameState = JSON.stringify(c);
        }
      }
    },
    onGameEnded() {
      this.gameStarted = false;
    },
    startChosingName() {
      this.chosingName=true;
      this.$nextTick(() => {
        if(this.$refs && this.$refs.entername) {
          this.$refs.entername.focus();
        }
      })
    },
    startGame(isNewGame, tries) {
      tries = tries || 0;
      if(this.starting && tries === 0 || this.gameStarted || !this.validChosenName)  return; // ignore any attempts of a player trying to start a game while already trying to start.
      this.starting = true;

      if(tries > 25) {
        this.starting = false;
        this.startGameError = 'Game can not load the map.'
      }

      // for some reason if they start before the map loads, just use a set timeout to await for it to flag true.
      if(!this.mapLoaded) {
        return setTimeout(() => {
          // since previousGameState is set we can
          this.startGame(isNewGame, ++tries);
        }, 200)
      }
      this.gameStarted = true;
      const payload = isNewGame ? { isNew: true, data: this.chosenName } : { isNew: false, data:  JSON.parse(JSON.stringify(this.previousGameState))};
      if(typeof document !== 'undefined') {
        document.removeEventListener('keydown', this.handleKeyDown);
      } else if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', this.handleKeyDown);
      }
      Gotti.emit('player-enter', payload);
      this.previousGameState = null;
    },
  },
  computed: {
    validChosenName() {
      return !!this.chosenName
    },
    newGameText() {
      return this.previousGameState ? 'Restart Game' : 'Start New Game'
    }
  }
}
</script>
<style>
  @font-face {
    font-family: 'Pixel';
    src: url('./assets/ChevyRay-Thicket.woff') format('woff'), /* Modern Browsers */
        url('./assets/ChevyRay-Thicket.ttf')  format('truetype'); /* Safari, Android, iOS */
  }
  body {
    overflow: hidden;
    margin: 0 !important;
    padding: 0 !important;
    height: 100%;
    width: 100%;
  }
  html {
    font-family: Pixel;
    margin: 0 !important;
    padding: 0 !important;
    height: 100%;
    width: 100%;
  }
</style>

<style lang="scss" scoped>
.btn {
  cursor: pointer;
}
.disabled-btn {
  color: darkgrey !important;
  opacity: .5 !important;
  cursor: not-allowed !important;
}
.ready-btn {
  color: white;
  opacity: 1;
  cursor: pointer;
}
.credits {
  display: flex;
  flex-direction: column;
  a {
    &:hover {
      color: crimson;
    }
  }
}
.hide-splash {
  opacity: 0;
  transition: opacity 1.1s ease-in-out;
  -moz-transition: opacity 1.1s ease-in-out;
  -webkit-transition: opacity 1.1s ease-in-out;
}
.show-splash {
  opacity: 1;
  transition: opacity 1.1s ease-in-out;
  -moz-transition: opacity 1.1s ease-in-out;
  -webkit-transition: opacity 1.1s ease-in-out;
}
  #logo {
    width: 260px;
    -webkit-filter: drop-shadow(3px 3px 4px rgba(255,255,255,.5))
    drop-shadow(-3px 3px 4px rgba(255,255,255,.5))
    drop-shadow(3px -3px 4px rgba(255,255,255,.5))
    drop-shadow(-3px -3px 4px rgba(255,255,255,.5));
    filter: drop-shadow(3px 3px 4px rgba(255,255,255,.5))
    drop-shadow(-3px 3px 4px rgba(255,255,255,.5))
    drop-shadow(3px -3px 4px rgba(255,255,255,.5))
    drop-shadow(-3px -3px 4px rgba(255,255,255,.5));
  }
  #progress-info {
    position: absolute;
    bottom: 50px;
  }
  #splash {
    color: white;
    position: absolute;
    background-color: black;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }
  #app {
    background-color: black;
    width: 100%;
    height: 100%;
  }

  #game-title {
    font-size: 36px;
  }

  .main-container {
    &.show-main {
      opacity: 1;
      transition: opacity 1.5s ease-in-out;
      -moz-transition: opacity 1.5s ease-in-out;
      -webkit-transition: opacity 1.5s ease-in-out;
    }
    opacity: 0;
    position: absolute;
    z-index: 2;
    min-width: 100%;
    max-width: 100%;
    min-height: 100%;
    max-height: 100%;
    width: 100%;
    height: 100%;
    padding: 0 !important;
    margin: 0 !important;
  }
.credits {
  a {
    text-decoration: none;
    color: white;
    background-color: transparent;
  }
}
.inner-container {
  color: white;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .half-vert {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
    height: 50%;
    max-height: 50%;
    height: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    &.top {
      justify-content: flex-end;
    }
    &.bottom {
      justify-content: flex-start;
    }
  }

  .option-container {
    padding-top: 50px;
    .play-btn {
      font-size: 50px;
      cursor: pointer;
      &:not(.disabled-btn) {
        &:hover {
          font-size: 55px;
        }
      }
    }
    display: flex;
    flex-direction: row;
    .name-enter-wrapper {
      display: flex;
      flex-direction: column;
      .cancel-btn {
        position: absolute;
        color: white;
        cursor: pointer;
      }
    }
    .rdy-btn-wrapper {
      padding-top: 7px;
      width: 100%;
      min-width: 100%;
      max-width: 100%;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
    }
  }
  .game-title {
    font-size: 84px;
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Old versions of Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none; /* Non-prefixed version, currently
                                 supported by Chrome, Edge, Opera and Firefox */
  }
}

</style>

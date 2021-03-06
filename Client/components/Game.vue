<template>
  <div id="game-wrapper"
     :class='{"show-game": showGame, "hide-game": !showGame }'
  >
    <canvas oncontextmenu="return false" id="game-canvas"></canvas>
  </div>
</template>
<script>
import Gotti from 'gotti';
export default {
  name: 'Game',
  props: {
    showGame: {
      type: Boolean
    },
    playerData: {
      type: Object,
      required: false,
    },
  },
  async mounted() {
    const data = this.playerData || {}
    await Gotti.startOfflineGame('island', data);
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
#game-wrapper {
  z-index: 1;
  position: absolute;
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
  min-width: 100%;
  max-width: 100%;
  max-height: 100%;
  height: 100%;
}
.hide-game {
  opacity: 0;
}
.show-game {
  opacity: 1;
  transition: opacity 1.5s ease-in-out;
  -moz-transition: opacity 1.5s ease-in-out;
  -webkit-transition: opacity 1.5s ease-in-out;
}
canvas {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>

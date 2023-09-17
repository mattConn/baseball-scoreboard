<template>
  <!-- <p class="time">{{ currentTime }}</p> -->
  <div class="games">
    <div id="current-games">
      <div v-for="game in games" :key="game.id">
        <p class="game" :class="{'current-game': currentGame?.id == game.id}" @click="gameClickHandler(game.id)">{{ `${game.away}@${game.home}` }}</p>
      </div>
    </div>

    <div id="data-ctn" v-if="currentGame">
      <ScoreBoard
        :home="currentGame.home"
        :away="currentGame.away"
        v-bind="currentPlay"
        :firstOut="currentPlay?.outs >= 1"
        :secondOut="currentPlay?.outs >= 2"
        :balls="currentPlay?.balls"
        :strikes="currentPlay?.strikes"
        :topHalf="currentPlay?.isTopInning"
      />
      <div id="views">
        <p v-for="(modeName, mode) in modes" :key="mode" :class="{'active-view': currentMode === mode}" @click="setMode(mode)">{{ modeName }}</p>
      </div>

      <table class="table" v-if="currentData">
        <tr>
          <th v-for="(header, headerIndex) in currentData[0]" :key="headerIndex" @click="tableHeaderClickHandler(headerIndex)">{{ header }}</th>
        </tr>
        <tr class="row" v-for="(row, rowIndex) in currentData?.slice(1)" :key="rowIndex">
          <td class="cell" v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td>
        </tr>
      </table>

    </div>
    <div v-else>
      <p>Select today's game</p>
    </div>
  </div>
</template>


<script>
import { getSchedule, getPlayByPlayData, getPitchSpeedData, getCurrentPlay, getTodaysDate } from './helpers2';
import ScoreBoard from './components/ScoreBoard.vue'

export default {
  name: 'App',
  components: {
    ScoreBoard
  },
  async created() {
    await this.init()
  },
  methods: {
    async init() {
      const urlParams = new URLSearchParams(window.location.search);
      const gameId = urlParams.get('gameid');
      const mode = urlParams.get('mode');
      const date = urlParams.get('date');

      // if (date) {
      //   this.date = date
      // } else {
      //   this.date = getTodaysDate()
      // }

      this.date = getTodaysDate()

      const schedule = await getSchedule(this.date)
      schedule.forEach(game => this.games.push(game))
      if (!gameId) {
        return
      }
      this.currentGame = this.games.find(game => game.id == gameId)
      document.title = `${this.currentGame.away}@${this.currentGame.home}`;

      this.currentMode = mode

      this.playByPlay = await getPlayByPlayData(this.currentGame.id)
      this.pitchSpeedData = getPitchSpeedData(this.playByPlay)
      this.currentPlay = await getCurrentPlay(this.currentGame.id)

      this.modesToData = {
        play: this.playByPlay,
        speed: this.pitchSpeedData,
        results: null,
      }

      this.currentData = this.modesToData[this.currentMode]
      console.log('this.currentData', this.currentData)
      // get current time as hh:mm:ss
      this.currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })


      this.intervalId = setInterval(async () => {
        console.log('getting data')
        this.playByPlay = await getPlayByPlayData(this.currentGame.id)
        this.pitchSpeedData = getPitchSpeedData(this.playByPlay)
        this.currentPlay = await getCurrentPlay(this.currentGame.id)

        // get current time as hh:mm:ss
        this.currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

        this.modesToData = {
          play: this.playByPlay,
          speed: this.pitchSpeedData,
          results: null,
        }
        const data = this.modesToData[this.currentMode]
        const headerIndex = this.sortIndex
        this.currentData = null
        this.currentData = data
        this.sortByColumn(headerIndex)
      }, 1000)
    },
    async dateSelector(next = false) {
      const date = this.date.split('-').map(n => Number(n))
      let [year, month, day] = date
      if (next) {
        day += 1
      } else {
        day -=1
      }
      
      const newDate = `${year}-${month}-${day}`
      window.history.pushState({}, '', `/?date=${newDate}`);
      // refresh page
      window.location.reload()
      // this.date = `${year}-${month}-${day}`
    },
    tableHeaderClickHandler(headerIndex) {
      this.sorted = !this.sorted
      this.sortByColumn(headerIndex)
    },
    sortByColumn(headerIndex){
      const data = this.currentData?.slice(1)
      if (!data) return

      this.sortIndex = headerIndex
      if (this.sorted) {
        data.sort((a,b) => b[headerIndex] - a[headerIndex])
      } else {
        data.sort((a,b) => a[headerIndex] - b[headerIndex])
      }
      this.currentData = [this.currentData[0], ...data]
    },
    gameClickHandler(gameId) {
      let href = `/?gameid=${gameId}&mode=${this.currentMode || 'play'}`
      const mode = new URLSearchParams(window.location.search).get('mode')
      if (mode) {
        href += `&mode=${mode}`
      }

      const date = new URLSearchParams(window.location.search).get('date')
      if (date) {
        href += `&date=${date}`
      }
      window.location.href = href
    },
    setMode(mode) {
      this.currentMode = mode
      // push to url params
      window.history.pushState({}, '', `/?gameid=${this.currentGame.id}&mode=${mode}`);
      this.currentData = this.modesToData[this.currentMode]
      console.log('this.currentData', this.currentData)
    }
  },
  data: function () {
    return {
      date: null,
      currentTime: '00:00:00 PM',
      currentPlay: null,
      currentData: null,
      sorted: false,
      modes: {
        play: 'Play by Play',
        speed: 'Speed',
        results: 'Results',
      },
      modesToData: null,
      currentMode: 'play',
      games: [],
      currentGame: null,

      pitchSpeedData: null,
      playByPlay: null,
    }
  }
}
</script>

<style>
body {
  background-color: #2c3e50;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  font-family: sans-serif;
  color: white;
}

#current-games {
  display: flex;
  color: white;
  justify-content: space-between;
  align-items: center;
  overflow: scroll;
  height: 5em;
}
#current-games p {
  margin: 0 1em;
  cursor: pointer;
}
#current-games p.current-game {
  background-color: #7f9ab5;
  color:#2c3e50;
}
#current-games p:hover {
  text-decoration: underline;
}

#data-ctn {
  /* margin-top: 1em; */
}

.table {
  border-collapse: collapse;
  width: 100%;
}

.table th {
  padding: 1em;
  text-align: left;
  background-color: #728799;
  color: white;
  text-align: center;
  cursor: pointer;
}

.time {
  text-align: left;
}

.table th:hover {
  text-decoration: underline;
}

.row:nth-child(even) {
  background-color: #7f9ab594;
}

#views {
  display: flex;
  justify-content: space-around;
}

#views p {
  cursor: pointer;
}

#views p:hover {
  text-decoration: underline;
}

.active-view {
  text-decoration: underline;
}

.date-selector {
  cursor: pointer;
}

.date::selection {
  background-color: transparent;
}
 
.date-selector:hover {
  text-decoration: underline;
}

.date-selector::selection {
  background-color: transparent;
}
</style>

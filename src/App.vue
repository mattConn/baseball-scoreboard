<template>
  <ScoreBoard v-for="game in games" :key="game.home" v-bind="game" />
</template>

<script>
import ScoreBoard from './components/ScoreBoard.vue';
import { getSchedule, getCurrentPlay, getCurrentBases } from './helpers';

export default {
  name: 'App',
  components: {
    ScoreBoard
  },
  async created() {
    const schedule = await getSchedule()

    this.games = schedule.map(game => {
      const { away, home, id } = game
      const data = {
        id,
        home,
        away,
        homeScore: 0,
        awayScore: 0,
        firstBase: false,
        secondBase: false,
        thirdBase: false,
        firstOut: false,
        secondOut: false,
        pitches: '0-0',
        topHalf: true,
        inning: 1,
        active: false,
        description: null,
      }
      return data
    })
    console.log('games', this.games)

    // this.games = [this.games[0]]

    const gameIds = this.games.map(game => game.id)

    const updateScoreboards = async () => {
      const basePositions = await Promise.all(gameIds.map(id => getCurrentBases(id)))
      const plays = await Promise.all(gameIds.map(id => getCurrentPlay(id)))

      console.log('current plays', plays)
      plays.forEach(play => {
        const game = this.games.find(game => game.id === play.id)
        const bases = basePositions.find(state => state.id === play.id)

        console.log('PLAY', play)
        const {active} = play

        if (!active) return

        const { 
          homeScore, 
          awayScore,
          isTopInning,
          strikes,
          balls,
          inning,
          outs,
          description
        //   firstBase, 
        //   secondBase, 
        //   thirdBase, 
        //   firstOut, 
        //   secondOut, 
        //   pitches, 
        //   topHalf, 
        //   inning 
        } = play

        game.active = active
        game.homeScore = homeScore
        game.awayScore = awayScore 
        game.topHalf = isTopInning
        game.pitches = `${balls}-${strikes}`
        game.inning = inning
        game.description = description

        let firstOut = false
        let secondOut = false
        if (outs >= 1) firstOut = true
        if (outs >= 2) secondOut = true
        game.firstOut = firstOut
        game.secondOut = secondOut

        game.firstBase = bases.first
        game.secondBase = bases.second
        game.thirdBase = bases.third
      })
    }

    setInterval(() => updateScoreboards(), 1000)

  },
  data: function () {
    return {
      games: []
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
  margin-top: 60px;
}
</style>

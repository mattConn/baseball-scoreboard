<template>
  <ScoreBoard v-for="game in games" :key="game.home" v-bind="game" />
</template>

<script>
import ScoreBoard from './components/ScoreBoard.vue';
import { getSchedule, getCurrentPlay } from './helpers';

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
      }
      return data
    })

    const gameIds = this.games.map(game => game.id)
    console.log(gameIds)

    const updateScoreboards = async () => {
      const plays = await Promise.all(gameIds.map(id => getCurrentPlay(id)))
      console.log('current plays', plays)
      plays.forEach(play => {
        const game = this.games.find(game => game.id === play.id)
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
          outs
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

        let firstOut = false
        let secondOut = false
        if (outs >= 1) firstOut = true
        if (outs >= 2) secondOut = true
        game.firstOut = firstOut
        game.secondOut = secondOut

        const {bases} = play
        game.firstBase = bases.includes('1B') || false
        game.secondBase = bases.includes('2B') || false
        game.thirdBase = bases.includes('3B') || false
      })
    }

    setInterval(updateScoreboards, 1000)

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

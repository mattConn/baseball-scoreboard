<template>
  <div class="scoreboard" :class="{active: active}">
    <div class="scores">
      <div class="away-logo">{{ away.toUpperCase() }}</div>
      <div class="score away-score">{{ awayScore }}</div>
      <div class="home-logo">{{ home.toUpperCase() }}</div>
      <div class="score home-score">{{ homeScore }}</div>
    </div>

    <div class="inning-info">
      <!-- <div class="bases">
        <div class="base third" :class="{'runner': thirdBase}"></div>
        <div class="base second" :class="{'runner': secondBase}"></div>
        <div class="base first" :class="{'runner': firstBase}"></div>
      </div> -->

      <div class="outs">
        <div class="out first-out" :class="{active: firstOut}"></div>
        <div class="out second-out" :class="{active: secondOut}"></div>
      </div>

      <div class="balls-strikes">
        {{ balls }}-{{ strikes }}
      </div>

      <div class="inning">
        <div class="half" :class="{bottom: !topHalf}"></div>
        <div class="inning-number">{{ inning }}</div>
      </div>
    </div>
  </div>
  <div class="description">
    <p>{{ description }}</p>
  </div>
</template>

<script>
export default {
  name: 'ScoreBoard',
  props: {
    home: String,
    away: String,
    homeScore: Number,
    awayScore: Number,
    firstBase: Boolean,
    secondBase: Boolean,
    thirdBase: Boolean,
    firstOut: Boolean,
    secondOut: Boolean,
    pitches: String,
    inning: Number,
    topHalf: Boolean,
    active: Boolean,
    description: String,
    balls: Number,
    strikes: Number
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.scoreboard {
  width: 300px;
  margin: 1em auto;
  padding-bottom: 1em;
  background-color: white;
  opacity: .5;
  transition: opacity .25s ease-in-out;
}

.scoreboard.active {
  opacity: 1
}

.scores {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
}


.scores .score {
  background-color: #728799;
  color: white;
}

.home-logo, .away-logo {
  color: black;
}

.inning-info {
  display: flex;
  margin-top: 1em;
  color: black
}

.scores div, .inning-info div {
  width: 75px;
}

.bases {
  display: flex;
  position: relative;
  left: 1em;
}
.bases .base {
  width: .8em;
  height: .8em;
  background-color: #A2A0A2;
  transform: rotate(45deg);
  position: relative;
}

.bases .base.runner {
  background-color: #e1d031;
}

.bases div {
  width: 75px;
}

.bases .base.second {
  top: -13px;
}

.outs {
  display: flex;
  justify-content: center;
  width: 2.5em;
}
.outs .first-out {
  margin-right: .25em;
}

.outs .out {
  width: 1em;
  height: 1em;
  background-color: #A2A0A2;
  border-radius: 50%;
}

.outs .out.active {
  background-color: #e1d031;
}

.inning {
  display: flex;
  align-items: center;
  justify-content: center;
}

.inning .inning-number {
  width: auto;
}

.inning .half {
  /* transform: rotate(180deg); */
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 10px 13.9px 10px;
  border-color: transparent transparent #e1d031 transparent;
}

.inning .half.bottom {
  transform: rotate(180deg);
}

.description {
  /* padding: 1em; */
  width: 300px;
  margin: 1em auto;
  background-color: #728799;
  color: white;
  /* text-indent: 1em; */
  /* opacity: .5; */
  text-align: left;
  transition: opacity .25s ease-in-out;
}

.description p {
  margin: 0;
  font-size: .9em;
}

</style>

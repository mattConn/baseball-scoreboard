const teamAbbreviations = {
    'Arizona Diamondbacks': 'ari',
    'Atlanta Braves': 'atl',
    'Baltimore Orioles': 'bal',
    'Boston Red Sox': 'bos',
    'Chicago Cubs': 'chc',
    'Chicago White Sox': 'chw',
    'Cincinnati Reds': 'cin',
    'Cleveland Guardians': 'cle',
    'Colorado Rockies': 'col',
    'Detroit Tigers': 'det',
    'Houston Astros': 'hou',
    'Kansas City Royals': 'kc',
    'Los Angeles Angels': 'laa',
    'Los Angeles Dodgers': 'lad',
    'Miami Marlins': 'mia',
    'Milwaukee Brewers': 'mil',
    'Minnesota Twins': 'min',
    'New York Mets': 'nym',
    'New York Yankees': 'nyy',
    'Oakland Athletics': 'oak',
    'Philadelphia Phillies': 'phi',
    'Pittsburgh Pirates': 'pit',
    'San Diego Padres': 'sd',
    'San Francisco Giants': 'sf',
    'Seattle Mariners': 'sea',
    'St. Louis Cardinals': 'stl',
    'Tampa Bay Rays': 'tb',
    'Texas Rangers': 'tex',
    'Toronto Blue Jays': 'tor',
    'Washington Nationals': 'wsh'
}

export const getPlayByPlayData = async (gameId) => {
  const allPlays = await getPlayByPlay({id: gameId})
  const {away, home} = await getGameTeams(gameId)

  const rows = [

  ]
  allPlays.forEach((play, index) => {
    const {
      outs,
      balls,
      strikes,
      awayScore,
      homeScore,
      team,
      isTopInning,
      inning,
      description,
      playEvents,
      matchup,
      playResult
      } = play

    const {pitcher} = matchup
    const pitcherName = pitcher.fullName

    let maxSpeed = 0
    const pitchSpeeds = []
    const pitchData = playEvents.filter(event => event.isPitch)
  
    pitchData.forEach(pitch => {
      const pitchType = pitch?.details?.type?.description

      const {pitchData} = pitch
      const pitchSpeed = pitchData.startSpeed

      const row = [
        index+1,
        isTopInning ? home : away, // pitcher team - opp. at bat
        inning,
        // isTopInning ? 'top' : 'bot',
        awayScore,
        homeScore,
        // outs,
        // balls,
        // strikes,
        pitcherName,
        pitchType,
        pitchSpeed,
        playResult
      ]

      rows.push(row)
    })
  })
  
  rows.reverse()
  const header = [
    'Play #',
    'Pitcher Team',
    'Inning',
    // 'Top/Bottom',
    'Away Score',
    'Home Score',
    // 'Outs',
    // 'Balls',
    // 'Strikes',
    'Pitcher',
    'Pitch Type',
    'Pitch Speed',
    'Play Result'
    ]
    rows.unshift(header)
  return rows
}

export const getTodaysDate = () => {
    // get todays date in YYYY-MM-DD format
    const today = new Date()
    const year = today.getFullYear()
    let month = today.getMonth() + 1
    if (month < 10) {
        month = `0${month}`
    }
    let day = today.getDate()
    if (day < 10) {
        day = `0${day}`
    }
    return `${year}-${month}-${day}`
}

export const getPitchSpeedData = (plays) => {
    const header = plays[0]
    const pitcherIndex = header.indexOf('Pitcher')
    const typeIndex = header.indexOf('Pitch Type')
    const speedIndex = header.indexOf('Pitch Speed')
    const resultIndex = header.indexOf('Play Result')
    const teamIndex = header.indexOf('Pitcher Team')

    const speedData = {}

    plays.slice(1).forEach(play => {
        const pitcher = play[pitcherIndex]
        const type = play[typeIndex]
        const speed = play[speedIndex]
        const result = play[resultIndex]
        const team = play[teamIndex]

        // get existing data
        const currentData = speedData[pitcher] || {
            team: null,
            max: 0,
            average: 0,
            pitches: 0,
        }

        // update data
        currentData.max = Math.max(currentData.max, speed)
        currentData.average = (currentData.average + speed) / 2
        currentData.pitches += 1
        currentData.team = team

        speedData[pitcher] = currentData
    })

    const rows = [
        [
        'Team',
        'Pitcher',
        'Pitches',
        'Max Speed',
        'Average Speed',
        ]
    ]
    Object.keys(speedData).forEach(pitcher => {
        const {team, pitches, max, average} = speedData[pitcher]
        rows.push([team, pitcher, pitches, max, average])
    })
    return rows
}

const getGameTeams = async (gameId) => {
  const aboutUrl = `https://statsapi.mlb.com/api/v1.1/game/${gameId}/feed/live`
  const aboutResp = await fetch(aboutUrl)
  const aboutJson = await aboutResp.json()

  const {teams} = aboutJson.gameData
  const {away, home} = teams
  
  const awayTeam = away.abbreviation
  const homeTeam = home.abbreviation

  return {
    away: awayTeam,
    home: homeTeam
  }
}

export const getSchedule = async (date) => {
    const scheduleUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&amp;date=${date}`
    const scheduleResp = await fetch(scheduleUrl)
    const scheduleJson = await scheduleResp.json()
    const { dates } = scheduleJson
    const [todaysSchedule] = dates
    const { games } = todaysSchedule

    const gamesByTeam = games.map(game => {
        const { teams } = game
        const { away, home } = teams

        return {
            away: teamAbbreviations[away.team.name] || away.team.name,
            home: teamAbbreviations[home.team.name] || home.team.name,
            id: game.gamePk
        }
    })

    return gamesByTeam
}

const getPlayByPlay = async (game) => {
    const gameId = game.id
    const playByPlayUrl = `https://statsapi.mlb.com/api/v1/game/${gameId}/playByPlay`
    const playByPlayResponse = await fetch(playByPlayUrl)
    const playByPlayJson = await playByPlayResponse.json()

    const {away, home} = game

    const {allPlays} = playByPlayJson

    const allPlayResults = allPlays.map(play => {
      const {about, result} = play
      const {event} = result // walk, single etc.
      const {isTopInning} = about

      const {playEvents} = play

      const pitchSpeeds = playEvents.map(event => {
        const {pitchData} = event
        const speed = pitchData?.startSpeed || 0
        return speed
      })

      const team = isTopInning ? away : home

      return {
        ...play.result,
        ...play.count,
        ...play.about,
        playEvents,
        team,
        away: isTopInning,
        pitchSpeeds,
        matchup: play.matchup,
        playResult: event
      }
    })
    return allPlayResults
}

const getBasePositions = async (gameId) => {
    const playByPlayUrl = `https://statsapi.mlb.com/api/v1/game/${gameId}/playByPlay`
    const playByPlayResponse = await fetch(playByPlayUrl)
    const playByPlayJson = await playByPlayResponse.json()
    const {allPlays} = playByPlayJson

    const basePositions = []
    allPlays.forEach(play => {
        const {runners} = play
        const positions = runners.map(runner => {
            const {end, isOut} = runner.movement
            if (isOut) {
                return 'out'
            }
            return end
        })

        const state = {
            first: positions.includes('1B'),
            second: positions.includes('2B'),
            third: positions.includes('3B'),
            exitField: positions.includes('score') || basePositions.includes('out'),
        }
        basePositions.push(state)
    })
    return basePositions
}

const getCurrentBases = async (gameId) => {
    const basePositions = await getBasePositions(gameId)
    let currentState = {
        id: gameId,
        first: false,
        second: false,
        third: false,
    }
    basePositions.forEach(state => {
        const keys = ['first', 'second', 'third']
        // use empty bases
        if (keys.every(key => !state[key])) {
            if (state.exitField) {
                currentState = {
                    id: gameId,
                    first: false,
                    second: false,
                    third: false,
                }
            } else {
                // ignore
                return
            }
        }
        keys.forEach(key => {
            currentState[key] = state[key]
        })
    })
    return currentState
}

export const getCurrentPlay = async (gameId) => {
    const playByPlayUrl = `https://statsapi.mlb.com/api/v1/game/${gameId}/playByPlay`
    const playByPlayResponse = await fetch(playByPlayUrl)
    const playByPlayJson = await playByPlayResponse.json()
    const {currentPlay} = playByPlayJson

    if (!currentPlay) {
        return {
            id: gameId,
            active: false,
        }
    }

    // get base positions
    // const {runners} = currentPlay
    // const basePositions = runners.map(runner => {
    //     const {end} = runner.movement
    //     if (end === 'score') {
    //         return null
    //     }
    //     return end
    // }).filter(position => position)
    
    const playInfo = {
        id: gameId,
        active: true,
        // bases: basePositions,
        ...currentPlay.result,
        ...currentPlay.count,
        ...currentPlay.about,
        playEvents: currentPlay.playEvents
    }
    return playInfo
}

const getPitchData = (allPlays) => {
  let awayPitches = 0
  let homePitches = 0

  let awayTotalPitchSpeed = 0
  let homeTotalPitchSpeed = 0

  let awayMaxPitchSpeed = 0
  let homeMaxPitchSpeed = 0

  let awayMinPitchSpeed = 1000
  let homeMinPitchSpeed = 1000

  allPlays.forEach(play => {
    const {playEvents, away, pitchSpeeds} = play
    const pitchSpeedsFiltered = pitchSpeeds.filter(speed => speed > 0)

    let maxSpeed = 0
    let minSpeed = 1000

    let sumPitchSpeeds = 0
    pitchSpeedsFiltered.forEach(speed => {
      sumPitchSpeeds += speed
      maxSpeed = Math.max(maxSpeed, speed)
      minSpeed = Math.min(minSpeed, speed)
    })

    if (away) {
      awayTotalPitchSpeed += sumPitchSpeeds
      awayPitches += pitchSpeedsFiltered.length
      awayMaxPitchSpeed = Math.max(awayMaxPitchSpeed, maxSpeed)
      awayMinPitchSpeed = Math.min(awayMinPitchSpeed, minSpeed)
    } else {
      homeTotalPitchSpeed += sumPitchSpeeds
      homePitches += pitchSpeedsFiltered.length
      homeMaxPitchSpeed = Math.max(homeMaxPitchSpeed, maxSpeed)
      homeMinPitchSpeed = Math.min(homeMinPitchSpeed, minSpeed)
    }
  })

  const awayAvgPitchSpeed = awayTotalPitchSpeed/awayPitches
  const homeAvgPitchSpeed = homeTotalPitchSpeed/homePitches

  return {
    awayPitches,
    homePitches,
    awayTotalPitchSpeed,
    homeTotalPitchSpeed,
    awayAvgPitchSpeed,
    homeAvgPitchSpeed,
    awayMaxPitchSpeed,
    homeMaxPitchSpeed,
    awayMinPitchSpeed,
    homeMinPitchSpeed
  }
}

const getData = async (e) => {
  const schedule = await getSchedule()
  schedule.forEach(async (game, index) => {
    const {id, away, home} = game

    const currentPlay = await getCurrentPlay(game)
    const allPlays = await getPlayByPlay(game)

    const {
      awayPitches,
      homePitches,
      awayAvgPitchSpeed,
      homeAvgPitchSpeed,
      homeMaxPitchSpeed,
      homeMinPitchSpeed,
      awayMaxPitchSpeed,
      awayMinPitchSpeed,
    } = getPitchData(allPlays)

    const { 
      homeScore, 
      awayScore,
      isTopInning,
      strikes,
      balls,
      inning,
      outs,
      description,
      playEvents
    } = currentPlay

    const row = [
      id,
      inning,
      away.toUpperCase(),
      awayScore,
      home.toUpperCase(),
      homeScore, 
      outs,
      balls,
      strikes,
      awayPitches,
      homePitches,
      awayAvgPitchSpeed,
      homeAvgPitchSpeed,
      awayMinPitchSpeed,
      homeMinPitchSpeed,
      awayMaxPitchSpeed,
      homeMaxPitchSpeed,
    ]

    // sheet.getRange(`A${index+2}:Q${index+2}`).setValues([row])
  })
}
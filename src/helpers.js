export const teamAbbreviations = {
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

export const getSchedule = async () => {
    const scheduleUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&amp;date=${getTodaysDate()}`
    const scheduleResp = await fetch(scheduleUrl)
    const scheduleJson = await scheduleResp.json()
    console.log(scheduleJson)
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

export const getPlayByPlay = async (gameId) => {
    const playByPlayUrl = `https://statsapi.mlb.com/api/v1/game/${gameId}/playByPlay`
    const playByPlayResponse = await fetch(playByPlayUrl)
    const playByPlayJson = await playByPlayResponse.json()
    console.log(playByPlayJson)
    const {allPlays} = playByPlayJson
    const allPlayResults = allPlays.map(play => ({
        ...play.result,
        ...play.count,
        halfInning: play.about.halfInning,
    }))
    return allPlayResults
}

export const getBasePositions = async (gameId) => {
    const playByPlayUrl = `https://statsapi.mlb.com/api/v1/game/${gameId}/playByPlay`
    const playByPlayResponse = await fetch(playByPlayUrl)
    const playByPlayJson = await playByPlayResponse.json()
    const {allPlays} = playByPlayJson

    const basePositions = []
    allPlays.forEach(play => {
        const {runners} = play
        const positions = runners.map(runner => {
            const {end, isOut} = runner.movement
            console.log('end', end)
            if (isOut) {
                return 'out'
            }
            return end
        })
        console.log('ARRAY', basePositions)

        const state = {
            first: positions.includes('1B'),
            second: positions.includes('2B'),
            third: positions.includes('3B'),
            exitField: positions.includes('score') || basePositions.includes('out'),
        }
        basePositions.push(state)
    })
    console.log('BASES ALLL', basePositions)
    return basePositions
}

export const getCurrentBases = async (gameId) => {
    const basePositions = await getBasePositions(gameId)
    console.log('BASES all', basePositions)
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
    console.log('BASES', currentState)
    return currentState
}

export const getCurrentPlay = async (gameId) => {
    const playByPlayUrl = `https://statsapi.mlb.com/api/v1/game/${gameId}/playByPlay`
    const playByPlayResponse = await fetch(playByPlayUrl)
    const playByPlayJson = await playByPlayResponse.json()
    console.log(playByPlayJson)
    const {currentPlay} = playByPlayJson

    if (!currentPlay) {
        return {
            id: gameId,
            active: false,
        }
    }

    // get base positions
    const {runners} = currentPlay
    const basePositions = runners.map(runner => {
        const {end} = runner.movement
        if (end === 'score') {
            return null
        }
        return end
    }).filter(position => position)
    
    const playInfo = {
        id: gameId,
        active: true,
        bases: basePositions,
        ...currentPlay.result,
        ...currentPlay.count,
        ...currentPlay.about,
    }
    console.log('PLAY', playInfo)
    return playInfo
}
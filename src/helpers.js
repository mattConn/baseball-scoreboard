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
    
    return {
        id: gameId,
        active: true,
        bases: basePositions,
        ...currentPlay.result,
        ...currentPlay.count,
        ...currentPlay.about,
    }
}
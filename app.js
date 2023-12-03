const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const app = express()

const databasePath = path.join(__dirname, 'cricketMatchDetails.db')

app.use(express.json())

let db = null

const initialisedatabaseAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running At http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initialisedatabaseAndServer()

const convertPlayerDetailsObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

const convertMatchDetailsObjectToResponseObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

const convertPlayerMatchScoreobjectToResponseObject = dbObject =>{
    return {
      playerMatchId: dbObject.player_match_id,
      playerId: dbObject.player_id,
      matchId: dbObject.match_id,
      score: dbObject.score,
      fours: dbObject.fours,
      sixes: dbObject.sixes
    }

}


app.get('/players/', async (request, response) => {
  const playersListQuery = `
        SELECT *
        FROM 
            player_details
    `
  const playersArray = await db.all(playersListQuery)
  response.send(playersArray.map(eachPlayer => convertPlayerDetailsObjectToResponseObject(eachPlayer)))
});

app.get("/players/:playerId/", async(request, response) =>{
    const {playerId} = request.params;
    const getPlayerQuery = `
        SELECT
            *
        FROM
            player_details
        WHERE
            player_id = ${playerId};`
    const playerDetails = await db.get(getPlayerQuery)
    response.send(convertPlayerDetailsObjectToResponseObject(playerDetails))
});

app.put("/players/:playerId/", async(request, response) =>{
    const {playerId} = request.params
    const {playerName} = request.body
    const playerUpdateQuery = `
        UPDATE 
            player_details
        SET
            player_name = '${playerName}'
        WHERE
            player_id = ${playerId};`
    
    await db.run(playerUpdateQuery)
    response.send("Player Details Updated")
});

app.get("/matches/:matchId/", async(request, response) =>{
    const {matchId} = request.params
    const specificMatchQuery = `
        SELECT 
            *
        FROM
            match_details
        WHERE
            match_id = ${matchId};`
    const specificMAtchDetails = await db.get(specificMatchQuery)
    response.send(convertMatchDetailsObjectToResponseObject(specificMAtchDetails))
});

app.get("/players/:playerId/matches", async(request, response) =>{
    const {playerId} = request.params
    const getPlayerMatchesQuery = `
        SELECT
             *
        FROM 
            player_match_score NATURAL JOIN
            match_details
        WHERE
            player_id = ${playerId};`
    const playerMatches = await db.all(getPlayerMatchesQuery)
    response.send(playerMatches.map(eachPlayer => convertMatchDetailsObjectToResponseObject(eachPlayer)))

});

app.get("/matches/:matchId/players", async(request, response) =>{
    const {matchId} = request.params
    const getMatchPlayersQuery = `
	    SELECT
          player_details.player_id ,
          player_details.player_name 
	    FROM
          player_match_score NATURAL JOIN player_details
      WHERE
          match_id = ${matchId};`
    
    const matchPlayerArray = await db.all(getMatchPlayersQuery)
    response.send(matchPlayerArray.map(eachMatch => convertPlayerDetailsObjectToResponseObject(eachMatch)))

})

app.get("/players/:playerId/playerScores", async(request, response) =>{
    const {playerId} = request.params
    const getPlayerScored = `
    SELECT
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes 
    FROM 
        player_details INNER JOIN player_match_score ON
        player_details.player_id = player_match_score.player_id
    WHERE 
        player_details.player_id = ${playerId};
    `;

    const playerArray = await db.get(getPlayerScored);
    response.send({
         playerId: playerArray['playerId'],
         playerName: playerArray['playerName'],
         totalScore: playerArray['totalScore'],
         totalFours: playerArray['totalFours'],
         totalSixes: playerArray['totalSixes']
    });
    

})

module.exports = app;
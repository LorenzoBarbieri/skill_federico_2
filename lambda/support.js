const moment = require("moment-timezone");
const axios = require('axios');
const Util = require('./util.js');
/*
function startAttention(handlerInput, userName) {
    const {attributesManager} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    sessionAttributes['first_time_flag'] = 0;
    sessionAttributes.classification_state = "START";
    sessionAttributes.userName = userName;
    let speakOutput = `Welcome ${sessionAttributes.NameProfile}, now i know your name! `;
    let speakOutput1 = " Since it is the first time we met, i would like to ask you some question. ";
    let speakOutput2 = " Can i do that? "
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    
    return {speakOutput, speakOutput1, speakOutput2};
    
}

*/
function startAttention_new(handlerInput, Name) {
    const {attributesManager} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    sessionAttributes['first_time_flag'] = 0;
    sessionAttributes.classification_state = "START";
     const audioUrl = Util.getS3PreSignedUrl("Media/chill-music-intro.mp3").replace(/&/g,'&amp;');
    let speakOutput = `<audio src="${audioUrl}"/>  <amazon:emotion name="excited" intensity="medium"> Welcome ${sessionAttributes.NameProfile} ! </amazon:emotion> ` +  `    `  + ` <amazon:emotion name="excited" intensity="medium"> I'm Jessica, nice to meet you. </amazon:emotion>` + '   ';
    let speakOutput1 =  ` <amazon:domain name="conversational"> <break time="1s"/> I saw you are not registered in the database yet! <break time="0.5s"/> Since it is the first time we met, i would like to ask you some question. </amazon:domain>`;
    let speakOutput2 = `<amazon:domain name="conversational"> Can i do that? </amazon:domain>`
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    
    return {speakOutput, speakOutput1, speakOutput2};
    
}

function checkPermission_reminder (handlerInput) {
    const {requestEnvelope} = handlerInput;
    const { permissions } = handlerInput.requestEnvelope.context.System.user;
            const consentToken = requestEnvelope.context.System.user.permissions
                                 && requestEnvelope.context.System.user.permissions.consentToken;
            if (!consentToken) {
                return 0;
             }
             else {
                 return 1;
             }
}

function checkPermission_address(handlerInput) {
    const { requestEnvelope, serviceClientFactory, responseBuilder } = handlerInput;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const consentToken = requestEnvelope.context.System.apiAccessToken;
    if (!consentToken) {
        return 0;
    }
    else {
        return 1;
    }
}

async function setReminder(handlerInput,time) {
                try {
                const {attributesManager,serviceClientFactory, requestEnvelope} = handlerInput;
                const reminderManagementServiceClient = serviceClientFactory.getReminderManagementServiceClient();
                const reminderPayload = {
                    "trigger": {
                     "type": "SCHEDULED_RELATIVE",
                     "offsetInSeconds": time,// reminder is set: 30 s in this example 1800 = 30 min
                    "timeZoneId": "Europe/Rome"
                    },
                    "alertInfo": {
                    "spokenInfo": {
                    "content": [{
                    "locale": "en-US",
                     "text": "open again the skill then tell me the words you remember"
                    }]
                 }
                },
                    "pushNotification": {
                    "status": "ENABLED"
                    }
                };
   
      await reminderManagementServiceClient.createReminder(reminderPayload);
    } catch (error) {
      console.error(error);
    }
    
}

async function updateDB (handlerInput) {
    
    const {attributesManager} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes()|| {};

    const score_classification = sessionAttributes.score_orientation+sessionAttributes.score_attention+sessionAttributes.score_memory_classification+sessionAttributes.classification_score;
    const id = sessionAttributes.id;
    let id_new;
    
    if (id === "Name not found") {
        sessionAttributes.game_state = "FINISHED";
        const config1 = {
                  method: 'POST',
                  baseURL: 'https://api.airtable.com/v0/appROKCgffWifCvT0/project',
                  headers: {'Authorization': 'Bearer keyulAWXkSfL6SWgb'}, 
                  data:
                  {
                      fields:
                      {
                          User_key: sessionAttributes.User_key
                      }
                   }
    
                   }
                  await axios(config1).then(response => {});
                  
                  
                  const config2 = {
                  method: 'get',
                  baseURL: 'https://api.airtable.com/v0/appROKCgffWifCvT0/project',
                  headers: {'Authorization': 'Bearer keyulAWXkSfL6SWgb'}, 
                  }
                  
                   await axios(config2).then(response => {
                          for (const record in response.data.records)
                             if (response.data.records[record].fields.User_key === sessionAttributes.User_key)
                                 id_new = response.data.records[record].id;});
                                 
                    sessionAttributes.id = id_new;
                    attributesManager.setSessionAttributes(sessionAttributes);
                    
                const config3 = {
                        method: 'patch',
                        baseURL: 'https://api.airtable.com/v0/appROKCgffWifCvT0/project',
                        url: id_new,
                        headers: {'Authorization': 'Bearer keyulAWXkSfL6SWgb'}, 
                        data:
                        {
                            fields:
                            {
                                User_key: sessionAttributes.User_key,
                                //First_time_flag: sessionAttributes.first_time_flag,
                                Game_state: sessionAttributes.game_state,
                                Classification_state: sessionAttributes.classification_state,
                                Flag_trenta_min: sessionAttributes.flag_30_min,
                                Random_vect_mem: sessionAttributes.random_vect_mem,
                                Score_calculation: sessionAttributes.score_calculation,
                                Score_opposite: sessionAttributes.score_opposite,
                                Score_language: sessionAttributes.score_language,
                                Score_dates: sessionAttributes.score_dates,
                                Score_memory: sessionAttributes.score_memory,
                                Classification_score: score_classification
                            }
                        }
                }
                            
            await axios(config3).then(response => {});
        
    }
    else {
            const config = {
                method: 'patch',
                baseURL: 'https://api.airtable.com/v0/appROKCgffWifCvT0/project',
                url: id,
                headers: {'Authorization': 'Bearer keyulAWXkSfL6SWgb'}, 
                  data:
                  {
                      fields:
                      {
                          User_key: sessionAttributes.User_key,
                          Game_state: sessionAttributes.game_state,
                          Classification_state: sessionAttributes.classification_state,
                          Flag_trenta_min: sessionAttributes.flag_30_min,
                          Random_vect_mem: sessionAttributes.random_vect_mem,
                          Score_calculation: sessionAttributes.score_calculation,
                          Score_opposite: sessionAttributes.score_opposite,
                          Score_language: sessionAttributes.score_language,
                          Score_dates: sessionAttributes.score_dates,
                          Score_memory: sessionAttributes.score_memory,
                          Classification_score: score_classification
                      }
                  }
            }
                            
            await axios(config).then(response => {});
    }
}



module.exports = {startAttention_new,checkPermission_reminder,checkPermission_address, setReminder, updateDB}
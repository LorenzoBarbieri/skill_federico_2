/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const skillBuilder = Alexa.SkillBuilders.custom();
const util = require('./util.js');
const momenttz = require('moment-timezone');
const moment = require('moment');
const now = momenttz.utc();
const axios = require('axios');
const calculation = require('./calculation.js');
const opposite = require('./opposite.js');
const language = require('./language.js');
const date = require('./date.js');
const memory = require('./memory.js');
const attention = require('./attention.js');
const orientation = require('./orientation.js');
const support = require("./support.js");
const messages = {
  NOTIFY_MISSING_PERMISSIONS: 'Please enable Location, Name and reminders permissions in the Amazon Alexa app.',
  EXITSKILLMESSAGE: 'Goodbye! See you soon.',
};
const question_orientation =    ['What year is it?', 
                                'What month is it ?', 
                                'What day of week is it?',
                                'What number of day is it?',
                                'Now tell me what time is it?',
                                'Which city do you live in?',
                                'What country do you live in?',
                                'What is your postal code?'];
//-------------------------------------------launch request Intent ------------------------------------------ //

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const { permissions } = handlerInput.requestEnvelope.context.System.user;
    const { requestEnvelope, serviceClientFactory, responseBuilder, attributesManager } = handlerInput;
    const consentToken = requestEnvelope.context.System.apiAccessToken;
    const sessionAttributes = await attributesManager.getSessionAttributes();
    //check name permission
    const upsServiceClient = serviceClientFactory.getUpsServiceClient();
    const profileName = await upsServiceClient.getProfileGivenName();
    sessionAttributes.Name = profileName;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    //check permission address
      const { deviceId } = requestEnvelope.context.System.device;
      const deviceAddressServiceClient = serviceClientFactory.getDeviceAddressServiceClient();
      const address = await deviceAddressServiceClient.getFullAddress(deviceId);

    if (permissions) {

      return handlerInput.responseBuilder
        //.speak("This skill needs permission to access your reminders.")
        .addDirective({
          type: "Connections.SendRequest",
          name: "AskFor",
          payload: {
          "@type": "AskForPermissionsConsentRequest",
            "@version": "1",
            "permissionScope": "alexa::alerts:reminders:skill:readwrite"
          },
          token: ""
        })
        .getResponse();
        
    } 
  }
};

const ConnectionsResponsetHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Connections.Response';
  },
  async handle(handlerInput) {
    const { permissions } = handlerInput.requestEnvelope.context.System.user;
    const {attributesManager, requestEnvelope} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const status = handlerInput.requestEnvelope.request.payload.status;
    // in case reminder permissions are not enbaled
    if ((!permissions) || (status === "DENIED")) {
    handlerInput.responseBuilder
        .speak("Without permissions, I can't set a reminder. So I guess that's goodbye.")
        .reprompt()
        .getResponse()
    }
    else {
        const { requestEnvelope, serviceClientFactory, responseBuilder, attributesManager } = handlerInput;
        const upsServiceClient = serviceClientFactory.getUpsServiceClient();
        const profileName = await upsServiceClient.getProfileGivenName();
        
        
        
        
        const { deviceId } = requestEnvelope.context.System.device;
        const deviceAddressServiceClient = serviceClientFactory.getDeviceAddressServiceClient();
        const address = await deviceAddressServiceClient.getFullAddress(deviceId);
        //function to generate key
        const vocals = ['a','e','i','o','u'];
        let Pcode = address.postalCode;
        let name = profileName;
        let key;
            name = name.replace("o","");
            for (let vocal of vocals) {
                name = name.replace(vocal,"");
            }
            if (Number(Pcode)%2 === 0) {
                Pcode = Number(Pcode);
            }
            else {
                Pcode = Number(Pcode)+1;
            }
        key = name.toLowerCase()+Pcode/2;
        
 
        sessionAttributes.NameProfile = profileName;
        sessionAttributes.User_key = key;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        let id = "Name not found";
        sessionAttributes.id = id;
        attributesManager.setSessionAttributes(sessionAttributes);
        const config = {
                  method: 'get',
                  baseURL: 'https://api.airtable.com/v0/appROKCgffWifCvT0/project',
                  headers: {'Authorization': 'Bearer keyulAWXkSfL6SWgb'}, 
                  }
        // get data from database     
                   await axios(config).then(response => {
                       for (const record in response.data.records) {
                             if (response.data.records[record].fields.User_key ===  sessionAttributes.User_key) { 
                                sessionAttributes.id = response.data.records[record].id; 
                                //sessionAttributes.userName = response.data.records[record].fields.Name;
                                //sessionAttributes.first_time_flag = response.data.records[record].fields.First_time_flag;
                                sessionAttributes.flag_30_min = response.data.records[record].fields.Flag_trenta_min;
                                sessionAttributes.random_vect_mem = response.data.records[record].fields.Random_vect_mem;
                                sessionAttributes.game_state = response.data.records[record].fields.Game_state;
                                sessionAttributes.classification_state = response.data.records[record].fields.Classification_state;
                                sessionAttributes.classification_score = response.data.records[record].fields.Classification_score;
                                //id = response.data.records[record].id;
                                handlerInput.attributesManager.setSessionAttributes(sessionAttributes); 
                       }
                       }
                             });
        
        // if it is the first time Alexa ask for the user name and then will guide him into the classification part
        if (sessionAttributes.id === "Name not found") {
            //const speakOutput0 = '<amazon:emotion name="excited" intensity="medium"> Welcome to the Classification and training skill, <break time="1s"/> say your name so i can register it.</amazon:emotion>';  
            let result = support.startAttention_new(handlerInput,sessionAttributes.Name);
            sessionAttributes.score_orientation = 0;
            sessionAttributes.score_attention = 0;
            sessionAttributes.score_memory_classification = 0;
            sessionAttributes.classification_score = 0;
            return handlerInput.responseBuilder
                .speak(result.speakOutput + result.speakOutput1 + result.speakOutput2)
                .reprompt()
                .getResponse();
        }
        // if the user exit the classification task before finishing it, the process will restart from the first part (attention)
        if (sessionAttributes.classification_state !== "FINISHED" && sessionAttributes.classification_state !== "MEMORY") {
            sessionAttributes.classification_state = "START";
            sessionAttributes.score_orientation = 0;
            sessionAttributes.score_attention = 0;
            sessionAttributes.score_memory_classification = 0;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            
            let result = attention.start(handlerInput);
            const speakOutput = `Welcome back ${sessionAttributes.NameProfile}, <break time="1s"/>  last time you didn't finished the classification part. We will start it again. `
            return handlerInput.responseBuilder
                .speak(speakOutput + result.speakOutput1 + result.speakOutput2)
                .reprompt(result.speakOutput)
                .getResponse();
            
        }
        // if the user is alredy known by Alexa. He is asked to start if he want to start the training.
        if( sessionAttributes.id !== "Name not found" && sessionAttributes.game_state === "FINISHED" && sessionAttributes.classification_state === "FINISHED" ){  //sessionAttributes['first_time_flag'] === 0 
            const speakOutput = `Welcome back ${sessionAttributes.NameProfile}!`;
            const speakOutput2 = "Let's start the training..";
            const speakOutput3 = "It consist of 4 games: Calculation. Synonim. Important Dates. Spelling. Memory. ";
            const speakOutput4 = "Would you like to start the game? ";
            
            sessionAttributes.game_state = "START";
            sessionAttributes.score_attention = 0;
            sessionAttributes.score_orientation = 0;
            sessionAttributes.score_memory_classification = 0;
            
            return handlerInput.responseBuilder
                .speak(speakOutput+speakOutput2+speakOutput3+speakOutput4)
                .reprompt()
                .getResponse();
        }
        // if 30 min are passed since memeory intent has been triggered the user is asked to say the words
        if ( (sessionAttributes.game_state === "MEMORY" || sessionAttributes.classification_state === "MEMORY")  && sessionAttributes.flag_30_min === 1) {
            let speakOutput = " ";
            if (sessionAttributes.game_state === "MEMORY") {
                speakOutput = `<amazon:emotion name="excited" intensity="medium"> Welcome back ${sessionAttributes.NameProfile}, <break time="1s"/>  one more effort. <break time="1s"/> Just tell me the words you remember and the training will be concluded </amazon:emotion>`;
            }
            if (sessionAttributes.classification_state ==="MEMORY") {
                speakOutput = `<amazon:emotion name="excited" intensity="medium"> Welcome back ${sessionAttributes.NameProfile} <break time="1s"/> , tell me the words you remember and the classification part will be over. </amazon:emotion>`;
                sessionAttributes.score_attention = 0;
                sessionAttributes.score_orientation = 0;
                handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            }
        
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt()
                .getResponse();
        }
        // if the user left the training game before finishing it, nex time he will restart from the game he left. the game will be repeated from the beginning
        if (sessionAttributes.game_state !== "FINISHED" && sessionAttributes.game_state !== "MEMORY") {
            let result;
            // restart calculation
            if (sessionAttributes.game_state === "CALCULATION") {
                result = calculation.start(handlerInput);
            }
            // restart opposite
            if (sessionAttributes.game_state === "OPPOSITE") {
                sessionAttributes.count_calculation = 3;
                handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                result = calculation.newGame(handlerInput);
            }
            // restart language
            if (sessionAttributes.game_state === "LANGUAGE") {
                sessionAttributes.count_opposite = 3;
                handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                result = opposite.newGame(handlerInput);
                
                return handlerInput.responseBuilder
                  .speak(result.speakOutput + result.speakOutput1+ result.speakOutput2)
                  .reprompt(result.reprompt)
                  .getResponse();
            }
            // restart dates
            if (sessionAttributes.game_state === "DATES") {
                result = language.newGame (handlerInput)
                sessionAttributes.index = 4;
                handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            }
            
            return handlerInput.responseBuilder
                .speak(result.speakOutput + result.speakOutput1)
                .reprompt(result.reprompt)
                .getResponse();
            
        }
        
    }
        
    
    }
};
// TRAINING or CLASSIFICATION BEGIN
const YesIntentHandler = {
     async canHandle(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = await attributesManager.getSessionAttributes()|| {};
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
            && (sessionAttributes.game_state === "START" || sessionAttributes.classification_state === "START");
    },
     async handle(handlerInput) {
         const {attributesManager,requestEnvelope } = handlerInput;
         const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
         if (sessionAttributes.classification_state === "START") {
            let result = attention.start(handlerInput);
            
            return handlerInput.responseBuilder
                .speak(result.speakOutput + result.speakOutput1 + result.speakOutput2)
                .reprompt(result.speakOutput + result.speakOutput1 + result.speakOutput2)
                .getResponse();
         }
         else {
            let result = calculation.start(handlerInput);
            
            return handlerInput.responseBuilder
                .speak(result.speakOutput+ result.speakOutput1)
                .reprompt(result.speakOutput+result.speakOutput1)
                .getResponse();
         }
}
};

const NoIntentHandler = {
     async canHandle(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = await attributesManager.getSessionAttributes()|| {};
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent'
            && (sessionAttributes.game_state === "START" || sessionAttributes.classification_state === "START");
    },
     async handle(handlerInput) {
         const {attributesManager, requestEnvelope} = handlerInput;
         const sessionAttributes = await attributesManager.getSessionAttributes()|| {};
         const {intent} = requestEnvelope.request;
         const name = sessionAttributes.Name
         let speakOutput, speakOutput1;

         if (sessionAttributes.classification_state === "START") {
             speakOutput = `No problem ${sessionAttributes.NameProfile}. <break time="1s"/> Come back later and open again the skill, if you change idea. `;
             speakOutput1 = `I know. <break time="1s"/> Answer to my question seems to be boring, but if you let me do this i will select the right game for you. <break time="1s"/> Change idea? ` ;
         }
         else {          
             speakOutput =`No problem ${sessionAttributes.NameProfile}. <break time="1s"/> Come back later and open again the skill, if you change idea. `;
             speakOutput1 = ' Training can be hard sometimes; <break time="1s"/> but, at the end, it will be worth it'; 
         }

            return handlerInput.responseBuilder
                .speak(speakOutput+speakOutput1)
                .reprompt()
                .getResponse();
}
};

// CALCULATION GAME
const calculationIntentHandler = { 
    async canHandle(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = await attributesManager.getSessionAttributes()|| {};
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AnswerIntent'
            && sessionAttributes.count_calculation <3
            && sessionAttributes.game_state === "CALCULATION";
    },
    handle(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = requestEnvelope.request;
        // get slot and check answer
        const user_sum = Alexa.getSlotValue(requestEnvelope, 'sum');
        calculation.check(handlerInput,user_sum);
        // new game or question
        let result = calculation.newGame(handlerInput);

        return handlerInput.responseBuilder
                .speak(result.speakOutput + result.speakOutput1)
                .reprompt(result.reprompt)
                .getResponse();
        
    }
};
// OPPOSITE GAME
const answeroppositeIntentHandler = { 
     canHandle(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes =  attributesManager.getSessionAttributes();
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AnswerIntent' 
            && sessionAttributes.game_state === "OPPOSITE";
    },
    handle(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        // get slot and check answer
        const word_opp = handlerInput.requestEnvelope.request.intent.slots.word;
        opposite.check(handlerInput,word_opp);
        // new game or question
        let result = opposite.newGame(handlerInput);
   
            return handlerInput.responseBuilder
                  .speak(result.speakOutput + result.speakOutput1+ result.speakOutput2)
                  .reprompt(result.reprompt)
                  .getResponse();
        
    }
};
// LANGUAGE GAME
const LanguageIntentHandler = {
    async canHandle(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = await attributesManager.getSessionAttributes()|| {};
        const request = handlerInput.requestEnvelope.request;
        
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AnswerIntent'
            && sessionAttributes.index<3
            && sessionAttributes.game_state === "LANGUAGE";
    },
    handle(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = requestEnvelope.request;
        // get slot values
        let letters_user = ['%','&','?'];
        let count = 0;
        let count_value =0;
        letters_user[0] = Alexa.getSlotValue(requestEnvelope, 'letter_a');
        letters_user[1] = Alexa.getSlotValue(requestEnvelope, 'letter_b');
        letters_user[2] = Alexa.getSlotValue(requestEnvelope, 'letter_c');
        
 
        
        for (const slot in letters_user)
        {
            if (letters_user[slot] === undefined)
            {
                count += 1;
            }
            
        }
        
        if (count === 3)
        {
            sessionAttributes.index+=1;
             handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            let result = language.newGame(handlerInput);
            return handlerInput.responseBuilder
                .speak(result.speakOutput+result.speakOutput1)
                .reprompt(result.reprompt)
                .getResponse();
        }
        
      
        
        //check answer
        language.check(handlerInput,letters_user);
        // new question or game
        let result = language.newGame(handlerInput);
        
            return handlerInput.responseBuilder
                .speak(result.speakOutput+result.speakOutput1)
                .reprompt(result.reprompt)
                .getResponse();
    }
};
// DATES GAME
const AnswerImportantDatesIntentHandler = { 
    async canHandle(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = await attributesManager.getSessionAttributes()|| {};
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AnswerIntent'
            && sessionAttributes.game_state === "DATES"; 
    },
    async handle(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes =  attributesManager.getSessionAttributes();
        const {intent} = requestEnvelope.request;
        // get slot and check answer
        const festivity = handlerInput.requestEnvelope.request.intent.slots.festivity.value;
        
         if (festivity === undefined)
         {
             sessionAttributes.count_dates +=1;
             handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
             
             // new game
        if (sessionAttributes.count_dates>1)
        {
            let result = date.newGame(handlerInput);
            // check permission
            const check_permission = support.checkPermission_reminder(handlerInput);
            if (!check_permission) {
                return handlerInput.responseBuilder
                .speak('Please enable reminders permission in the Amazon Alexa app.')
                .withAskForPermissionsConsentCard(['alexa::alerts:reminders:skill:readwrite'])
                .getResponse();
            }
            // set reminder and upload database
            support.setReminder(handlerInput,"30");
            support.updateDB(handlerInput);

        return handlerInput.responseBuilder
            .speak(result.speakOutput+result.speakOutput1+result.speakOutput2+result.speakOutput3)
            .getResponse();
       }
       // new question
        else
        {
            let speakOutput1 = date.newQuestion(handlerInput);

            return handlerInput.responseBuilder
                  .speak(speakOutput1)
                  .reprompt(speakOutput1)
                  .getResponse();
        }
    }
        date.check(handlerInput,festivity);
        // new game
        if (sessionAttributes.count_dates>1)
        {
            let result = date.newGame(handlerInput);
            // check permission
            const check_permission = support.checkPermission_reminder(handlerInput);
            if (!check_permission) {
                return handlerInput.responseBuilder
                .speak('Please enable reminders permission in the Amazon Alexa app.')
                .withAskForPermissionsConsentCard(['alexa::alerts:reminders:skill:readwrite'])
                .getResponse();
            }
            // set reminder and upload database
            support.setReminder(handlerInput,"30");
            support.updateDB(handlerInput);

        return handlerInput.responseBuilder
            .speak(result.speakOutput+result.speakOutput1+result.speakOutput2+result.speakOutput3)
            .getResponse();
       }
       // new question
        else
        {
            let speakOutput1 = date.newQuestion(handlerInput);

            return handlerInput.responseBuilder
                  .speak(speakOutput1)
                  .reprompt(speakOutput1)
                  .getResponse();
        }
    }
};

// MEMORY game
const memoryIntentHandler = {
    async canHandle(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = await attributesManager.getSessionAttributes()|| {};
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AnswerIntent'
            && (sessionAttributes.game_state === 'MEMORY' || sessionAttributes.classification_state === "MEMORY")
            && sessionAttributes.flag_30_min === 1;
    },
    
    async handle(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = await attributesManager.getSessionAttributes()|| {};
        const {intent} = requestEnvelope.request;
        let counter = '';
        // set and update session variables and get slot
        sessionAttributes.flag_30_min = 0;
        const memory_string = sessionAttributes.random_vect_mem; 
        const memory_vector = memory_string.split(".");
        let mem_words_user = []
        mem_words_user[0] = Alexa.getSlotValue(requestEnvelope, 'color');
        mem_words_user[1] = Alexa.getSlotValue(requestEnvelope, 'city');
        mem_words_user[2] = Alexa.getSlotValue(requestEnvelope, 'animal');
        mem_words_user[3] = Alexa.getSlotValue(requestEnvelope, 'profession');
        mem_words_user[4] = Alexa.getSlotValue(requestEnvelope, 'sport');
        
        
        if (mem_words_user === undefined)
        {
             if (sessionAttributes.game_state === "MEMORY") {
             result = memory.training(handlerInput);}
             if (sessionAttributes.classification_state === "MEMORY") {
             result = memory.classification(handlerInput);}
        }
        
        
        
        
        for  (const slot in mem_words_user)
        {
            if (mem_words_user[slot] === undefined)
            {
                counter =+1;
            }
        }
        
        
        if (counter ===5)
        {
             if (sessionAttributes.game_state === "MEMORY") {
             result = memory.training(handlerInput);}
             if (sessionAttributes.classification_state === "MEMORY") {
             result = memory.classification(handlerInput);}
        }
        

        memory.check(handlerInput,memory_vector,mem_words_user);
        let result;
        // memory intent part of training        
        if (sessionAttributes.game_state === "MEMORY") {
             result = memory.training(handlerInput);
        }
        // memory intent part of classification
        if (sessionAttributes.classification_state === "MEMORY") {
             result = memory.classification(handlerInput);
        }

        support.updateDB(handlerInput);

        return handlerInput.responseBuilder
            .speak(result.speakOutput+result.speakOutput1+result.speakOutput2+result.speakOutput3)
            .reprompt()
            .getResponse();
    }
};

// ATTENTION CLASSIFICATION Intent
const attentionIntentHandler = {
    async canHandle(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = await attributesManager.getSessionAttributes()|| {};
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AnswerIntent'
            && sessionAttributes.classification_state === "ATTENTION";
    },
     handle(handlerInput) {
    
        let score_attention = 0;
        let counter = 0;
        let user_slot = []
        
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
    
        
        // get slot value
        user_slot[0] = Alexa.getSlotValue(requestEnvelope, 'color');
        user_slot[1] = Alexa.getSlotValue(requestEnvelope, 'city');
        user_slot[2] = Alexa.getSlotValue(requestEnvelope, 'animals');
        user_slot[3] = Alexa.getSlotValue(requestEnvelope, 'profession');
        user_slot[4] = Alexa.getSlotValue(requestEnvelope, 'sport');
        
        for  (const slot in user_slot)
        {

            
            if (user_slot[slot] === undefined)
            {
                counter =+1;
                
            }
            
        }
        
        if (counter === 5)
        {
        let result = attention.newGame(handlerInput);
        
        return handlerInput.responseBuilder
            .speak(result.speakOutput + result.speakOutput1)
            .reprompt(result.speakOutput1)         
            .getResponse();
        }
        
        // check answer  
        attention.check(handlerInput,user_slot);
        // new game
        let result = attention.newGame(handlerInput);
        
        return handlerInput.responseBuilder
            .speak(result.speakOutput + result.speakOutput1)
            .reprompt(result.speakOutput1)         
            .getResponse();
    }
};
// ORIENTATION classification Intent: qui risponde a anno, mese, giorno della settimana e numero del giorno
const QuizAnswerHandler = {
  async canHandle(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = await attributesManager.getSessionAttributes()|| {};
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AnswerIntent'
            && sessionAttributes.classification_state === "ORIENTATION";

  },
  handle(handlerInput) {
    const {attributesManager, requestEnvelope} = handlerInput;
    const attributes =  attributesManager.getSessionAttributes();
    const {intent} = requestEnvelope.request;
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    let speakOutput = orientation.newQuestion1(handlerInput, slots);
    let repromptOutput = speakOutput;
      
      return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(repromptOutput)
      .getResponse();
    }
 };
// ORIENTATION classification part 2 (question related to the user location): time, address, country, postal code.
const TimezoneIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
        return attributes.classification_state === "ORIENTATION_2" &&
               request.type === 'IntentRequest' &&
               request.intent.name === 'AnswerIntent';
  },
  async handle(handlerInput) {
    
    const response = handlerInput.responseBuilder;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const { requestEnvelope, serviceClientFactory, responseBuilder } = handlerInput;
    let {deviceId} = requestEnvelope.context.System.device;
    const upsServiceClient = serviceClientFactory.getUpsServiceClient();
    const usertimeZone = await upsServiceClient.getSystemTimeZone(deviceId);
    const time_user = requestEnvelope.request.intent.slots.time;
    
    const speakOutput = orientation.timeCheck(handlerInput,time_user,usertimeZone);
    
      return response.speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
}
};
// ORIENTATION part 3

const GetAddressIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
        return attributes.classification_state === "ORIENTATION_3" &&
               request.type === 'IntentRequest' &&
               request.intent.name === 'AnswerIntent';
  },
  async handle(handlerInput) {

    const { requestEnvelope, serviceClientFactory, responseBuilder } = handlerInput;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const permission_address = support.checkPermission_address(handlerInput);
    // check permission
    if (!permission_address) {
            const PERMISSIONS = ['read::alexa:device:all:address'];
            const speakOutput = messages.NOTIFY_MISSING_PERMISSIONS  + ' ' + messages.EXITSKILLMESSAGE;
            return responseBuilder
                    .speak(speakOutput)
                    .withAskForPermissionsConsentCard(PERMISSIONS)
                    .getResponse();
    }
    // get address
    const { deviceId } = requestEnvelope.context.System.device;
    const deviceAddressServiceClient = serviceClientFactory.getDeviceAddressServiceClient();
    const address = await deviceAddressServiceClient.getFullAddress(deviceId);
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    // new question or new game
    let result  = orientation.newQuestion2(handlerInput, address, slots);
            if (attributes.classification_state === "MEMORY")
            {
                support.setReminder(handlerInput,"30");
                support.updateDB(handlerInput); 
                
                return responseBuilder
                        .speak(result.speakOutput + result.speakOutput1 + result.speakOutput2 + result.speakOutput3)
                        .getResponse();
            }
            else 
            {
                return responseBuilder
                        .speak(result.speakOutput + result.speakOutput1 + result.speakOutput2 + result.speakOutput3)
                        .reprompt(result.speakOutput)
                        .getResponse();
            }
  }
};

// ---------------------------------------------- classification finished -------------------------------------------- //

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';
        //support.updateDB(handlerInput);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        support.updateDB(handlerInput);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';
        support.updateDB(handlerInput);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        //support.updateDB(handlerInput);
        
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        //const speakOutput = `You just triggered ${intentName}`;
        let speakOutput1,speakOutput2,speakOutput3 = " ";
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        // handle of wrong intent trigger during initial phase
        if (sessionAttributes.game_state === "START" && intentName === "AnswerIntent") {
            speakOutput1 = `Sorry ${sessionAttributes.NameProfile}, i don't understand what you just said. Would you like to play my games?.`;
            speakOutput2 =  "Say yes if you want to play! Otherwise say NO."
        }
        if (sessionAttributes.classification_state === "START" && intentName === "AnswerIntent") {
            speakOutput1 = `Sorry ${sessionAttributes.NameProfile}, i don't understand what you just said. .`;
            speakOutput2 =  "Say yes if you want to do the classification task! Otherwise say NO.";
        }
        // handle wrong intent trigger during training or classification part
        if ((sessionAttributes.game_state !== "FINISHED" || sessionAttributes.game_state !== "START") && intentName !== "AnswerIntent" ) {
            speakOutput1 = "Sorry, yes and no are not a valid answer. Please try again.";
            if (sessionAttributes.game_state === "CALCULATION") {
                speakOutput2 = "We are in calculation game. Your answer must be a number."
                speakOutput3 = "Makes the sum of the following two numbers: " + sessionAttributes.string_numbers;
            }
            if (sessionAttributes.game_state === "OPPOSITE") {
                speakOutput2 = "We are in opposite game, your anwer must be an adjective.";
                speakOutput3 = "say the opposite of the word: . " + sessionAttributes.opposite_word;
            }
            if (sessionAttributes.game_state === "LANGUAGE") {
                speakOutput2 = "We are in language game, your answer must contains only letters."
                speakOutput3 = "try to spell this word: . " + sessionAttributes.language_word;
            }
            if (sessionAttributes.game_state === "DATES") {
                speakOutput2 = "We are in date game, your answer must be an important date.";
                speakOutput3 = "Whant anniversary occurs on the day: ." + sessionAttributes.date_word;
            }
            if (sessionAttributes.game_state === "MEMORY") {
                speakOutput2 = "We are in memory game, you have to answer with the words you remember.";
                speakOutput3 = "If you don't rememeber any words, say STOP to exit the skill. Next time you open the application, the training will restart from the beginning."
            }
        }
        if ((sessionAttributes.classification_state !== "FINISHED" && sessionAttributes.Classification_state !== "START") && intentName !== "AnswerIntent") {
            speakOutput1 = "Sorry, yes and no are not a valid answer. Please try again.";
            // other if
            if (sessionAttributes.classification_state === "Attention") {
                speakOutput2 = "Tell me the words you rememeber."
                speakOutput3 = "The words are:" + sessionAttributes.string_att;
            }
            if (sessionAttributes.classification_state === "Orientation") {
                speakOutput2 = question_orientation[sessionAttributes.counter_orientation];
            }
            if (sessionAttributes.classification_state === "MEMORY") {
                speakOutput2 = "We are in the memory part of classification, you have to answer with the words you remember.";
                speakOutput3 = "If you don't rememeber any words, say STOP to exit the skill. Next time you open the application, the classification will restart from the beginning."
            }

        }

        return handlerInput.responseBuilder
                            .speak(speakOutput1+speakOutput2+speakOutput3)
                            .reprompt()
                            .getResponse()
        //support.updateDB(handlerInput);
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        
          if (error.statusCode === 401)
          {
              const PERMISSIONS = ['alexa::profile:given_name:read'];
              return handlerInput.responseBuilder
             .speak(messages.NOTIFY_MISSING_PERMISSIONS)
              .reprompt(messages.NOTIFY_MISSING_PERMISSIONS)
              .withAskForPermissionsConsentCard(PERMISSIONS)
              .getResponse();
              
          }
        
          if (error.statusCode === 403) {
              const PERMISSIONS = ['read::alexa:device:all:address'];
              return handlerInput.responseBuilder
              .speak(messages.NOTIFY_MISSING_PERMISSIONS)
              .reprompt(messages.NOTIFY_MISSING_PERMISSIONS)
              .withAskForPermissionsConsentCard(PERMISSIONS)
              .getResponse();
              
          }
    
        //support.updateDB(handlerInput);
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        YesIntentHandler,
        NoIntentHandler,
        calculationIntentHandler,
        answeroppositeIntentHandler,
        LanguageIntentHandler,
        AnswerImportantDatesIntentHandler,
        memoryIntentHandler,
        attentionIntentHandler,
        QuizAnswerHandler,
        TimezoneIntentHandler,
        GetAddressIntentHandler,
        ConnectionsResponsetHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('device-location/v1')
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();

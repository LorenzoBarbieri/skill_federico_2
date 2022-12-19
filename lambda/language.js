const letters = ["D","O","G","B","O","Y","B","E","E"];
const words = ["dog","boy","bee"];
//const dates = ["December 25th", "November 4th", "July 4th", "October 31st", "May 1st", "May 29th", "December 31st"];
const dates = ["December 25th", "July 4th", "October 31st", "May 1st", "February 14th", "December 31st", "March 8th"];
const question_dates = ['What anniversary occurs on the day:  ', 
                        'Okay! Try this one. What anniversary occurs on the day:   ',
                        'The last one. What anniversary occurs on the day:   '];
                  
function check(handlerInput, letters_user) {
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        let index = sessionAttributes.index;
        let speakOutput1 = "";
        const check_vector = [];
        
        for (let i=0;i<3;i++) {
            check_vector[i] = letters[i+3*index];
        }
            for (let j=0;j<3;j++) {
                
            if(letters_user[j] !==undefined)
            {
            letters_user[j] = letters_user[j].replace(".","");
            letters_user[j] = letters_user[j].toUpperCase();
            if (letters_user[j] === check_vector[j]) {
             sessionAttributes.score_language +=1; 
            }
            }
        }
        sessionAttributes.index += 1;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
}

function newGame (handlerInput) {
    const {attributesManager} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    let speakOutput = " ",speakOutput1 = "",reprompt= " ";
        if (sessionAttributes.index<3) {
            sessionAttributes.language_word = words[sessionAttributes.index];
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            speakOutput1 = sessionAttributes.score_language + ". " + `Thank you. <break time="1s"/> Now tell me the spelling of the word: ${words[sessionAttributes.index]}`;
            reprompt = speakOutput1;
        }
        else {
            speakOutput = sessionAttributes.score_language + ". " +'<amazon:emotion name="excited" intensity="medium">Perfect! The language game is finished. <break time="1s"/> Next part is about some dates.</amazon:emotion>'; 
            sessionAttributes.game_state = "DATES";
            sessionAttributes.score_dates =0;
            sessionAttributes.count_dates =0;
            sessionAttributes.indicedata = [Math.floor(Math.random()*dates.length)];
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            const randomdate = dates[sessionAttributes.indicedata];  
            sessionAttributes.date_word = randomdate;
            speakOutput1 = " " +question_dates[sessionAttributes.count_dates] +  " " + randomdate; 
            reprompt = speakOutput1;
            
        }
    return {speakOutput, speakOutput1, reprompt};
}

module.exports = {check, newGame}
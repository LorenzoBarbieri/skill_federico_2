const numbers = [1,2,3,4,5,6,7,8,9];
const question_calculation = ['This is the first sum. Make the sum of the following 2 numbers. ', 
                  'This is the second sum. Make the sum of the following 2 numbers. ',
                  'This is the third sum. Make the sum of the following 2 numbers. '];
const words1 = ["hot", "dark", "strong", "tall", "big", "slow", "white", "expansive", "rare", "good", "narrow", "dirty","near", "external", "first", "extrovert"];
const words2 = ["cold", "clear", "weak", "short", "small",  "fast", "black", "cheap", "common", "bad", "wide", "clean", "far", "internal", "last", "shy"];
const question_opposite = ['This is the first word. Say the opposite of:  ', 
                  'This is the second word. Say the opposite of:  ',
                  'This is the third word. Say the opposte of:  ']

 function start(handlerInput)
{
    const {attributesManager} = handlerInput;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.count_calculation = 0;
    const speakOutput ='Lets get started with this new training session. <break time="1s"/> We begin with the calculation game. '+ question_calculation[sessionAttributes.count_calculation];
         sessionAttributes.score_calculation = 0;
         sessionAttributes.game_state = "CALCULATION";
            const random1 = [numbers[Math.floor(Math.random()*numbers.length)]];
            const random2 = [numbers[Math.floor(Math.random()*numbers.length)]];
            sessionAttributes.somma = Number(random1) + Number(random2);
            sessionAttributes.string_numbers = ". "+ random1 + ". " +  random2 + ". ";
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            const speakOutput1 = " " + random1 + " and " + random2; 
            const reprompt = speakOutput + speakOutput1;
    return {speakOutput, speakOutput1, reprompt};
}
function check (handlerInput,user_sum) {
    const {attributesManager, requestEnvelope} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    if (Number(user_sum) === Number(sessionAttributes.somma) && (user_sum !== undefined))  {  sessionAttributes.score_calculation +=1  }
    sessionAttributes.count_calculation +=1;  
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
}

function newGame (handlerInput)
{ 
    const {attributesManager} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    let speakOutput, speakOutput1 = "", reprompt= "";
    
    if (sessionAttributes.count_calculation > 2) {
    sessionAttributes.count_opposite = 0;
            speakOutput = sessionAttributes.score_calculation + ". "+'<amazon:emotion name="excited" intensity="medium">+Great! The game has finshed. The next part is about opposite. </amazon:emotion>' + ' ' ;
            sessionAttributes.game_state = "OPPOSITE";
            sessionAttributes.score_opposite = 0;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            sessionAttributes.indice = [Math.floor(Math.random()*words1.length)];
            const randomword = words1[sessionAttributes.indice];
            sessionAttributes.opposite_word = randomword;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            speakOutput1 =  question_opposite[sessionAttributes.count_opposite] + " " + randomword;
            reprompt = speakOutput1;
    
    }
    else {        
        const random1 = [numbers[Math.floor(Math.random()*numbers.length)]];
        const random2 = [numbers[Math.floor(Math.random()*numbers.length)]];
        sessionAttributes.somma = Number(random1) + Number(random2);
        sessionAttributes.string_numbers = ". "+ random1 + ". " +  random2 + ". ";
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        speakOutput = sessionAttributes.score_calculation + ". "+" "+question_calculation[sessionAttributes.count_calculation]+"." + " " + random1 + " and " + random2;
        reprompt = speakOutput
    }
    return {speakOutput,speakOutput1,reprompt};
}


module.exports = {start,check, newGame}